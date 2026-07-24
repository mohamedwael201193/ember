#!/usr/bin/env node
/**
 * Environment and stack health checks.
 * Usage: pnpm doctor
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ROOT,
  applyEnv,
  checkNode,
  checkPnpm,
  checkPorts,
  DEFAULT_PORTS,
  isDevMode,
  loadEnvFile,
  logFail,
  logOk,
  logSection,
  logWarn,
} from "./lib/common.mjs";

const setupMode = process.argv.includes("--setup");
let failures = 0;
let warnings = 0;

function pass(msg) {
  logOk(msg);
}
function warn(msg) {
  warnings += 1;
  logWarn(msg);
}
function fail(msg) {
  failures += 1;
  logFail(msg);
}

async function fetchOk(url, timeoutMs = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  console.log("\nEMBER doctor\n");
  applyEnv(loadEnvFile());
  const env = { ...loadEnvFile(), ...process.env };
  const dev = isDevMode(env);

  logSection("Toolchain");
  const node = checkNode(20);
  node.ok ? pass(node.message) : fail(node.message);
  if (node.major < 24) warn("Node 24+ recommended for production / Render parity");
  const pnpm = checkPnpm();
  pnpm.ok ? pass(pnpm.message) : fail(pnpm.message);
  existsSync(resolve(ROOT, "node_modules"))
    ? pass("workspace dependencies installed")
    : fail("node_modules missing — run pnpm install or pnpm setup");

  logSection("Mode");
  if (dev) pass("DEVELOPMENT_MODE=1 (sample data, no live secrets required)");
  else pass("Live mode — real credentials expected");

  logSection("Environment file");
  if (!existsSync(resolve(ROOT, ".env"))) {
    fail(".env missing — run pnpm setup");
  } else {
    pass(".env present");
  }

  if (env.EMBER_RUNTIME_URL) pass(`EMBER_RUNTIME_URL=${env.EMBER_RUNTIME_URL}`);
  else if (dev) pass("EMBER_RUNTIME_URL defaulting to http://127.0.0.1:10000");
  else fail("EMBER_RUNTIME_URL missing");

  for (const key of ["SENTINEL_SHARED_SECRET", "PRIMARY_OBSERVER_SHARED_SECRET"]) {
    if (env[key]) pass(`${key} set`);
    else (dev ? warn : fail)(`${key} missing`);
  }
  for (const key of ["RESCUE_JOURNAL_DIR", "PAYDAY_JOURNAL_DIR"]) {
    if (env[key]) pass(`${key}=${env[key]}`);
    else pass(`${key} will default under ./runtime/`);
  }

  if (env.SENTINEL_SHARED_SECRET && env.PRIMARY_OBSERVER_SHARED_SECRET) {
    if (env.SENTINEL_SHARED_SECRET === env.PRIMARY_OBSERVER_SHARED_SECRET) {
      fail("SENTINEL_SHARED_SECRET and PRIMARY_OBSERVER_SHARED_SECRET must differ");
    } else pass("HMAC secrets differ");
  }

  logSection("KeeperHub");
  const khKeys = [
    "KH_API_BASE",
    "KH_API_KEY_PRIMARY_EXECUTOR",
    "KH_API_KEY_PRIMARY_OBSERVER",
    "KH_API_KEY_STANDBY",
    "KH_ORG_A_W1_WORKFLOW_ID",
    "KH_ORG_B_W1_REPLAY_WORKFLOW_ID",
  ];
  for (const key of khKeys) {
    if (!env[key]) (dev ? warn : fail)(`${key} missing`);
    else if (String(env[key]).includes("dev_") || String(env[key]).includes("_not_for_production")) {
      if (dev) pass(`${key} (development placeholder)`);
      else fail(`${key} still has development placeholder`);
    } else pass(`${key} configured`);
  }

  logSection("RPC / chain");
  if (env.BASE_RPC_URL || env.BASE_SEPOLIA_RPC_URL) pass("RPC URL present");
  else (dev ? warn : fail)("BASE_RPC_URL / BASE_SEPOLIA_RPC_URL missing");
  if (env.CONTINUITY_ADDRESS_SEPOLIA || env.CONTINUITY_ADDRESS_MAINNET) {
    pass("Continuity address configured");
  } else (dev ? warn : fail)("CONTINUITY_ADDRESS_* missing");

  logSection("Pinata / IPFS");
  if (env.PROOF_ANCHOR_ENABLE === "1") {
    if (env.PINATA_JWT && !String(env.PINATA_JWT).includes("not-for-production")) {
      pass("PINATA_JWT set for anchoring");
    } else fail("PROOF_ANCHOR_ENABLE=1 requires a real PINATA_JWT");
  } else {
    pass("PROOF_ANCHOR_ENABLE=0 (IPFS pin optional)");
  }
  if (env.IPFS_GATEWAY) pass(`IPFS_GATEWAY=${env.IPFS_GATEWAY}`);
  else warn("IPFS_GATEWAY unset");

  logSection("Contracts");
  if (existsSync(resolve(ROOT, "contracts/src/Continuity.sol"))) {
    pass("contracts/src/Continuity.sol present");
  } else fail("Continuity.sol missing");
  if (existsSync(resolve(ROOT, "contracts/lib/forge-std"))) {
    pass("forge-std vendored");
  } else warn("forge-std missing — run forge install in contracts/");

  logSection("Frontend / BFF");
  if (existsSync(resolve(ROOT, "frontend/package.json"))) pass("frontend package present");
  else fail("frontend package missing");
  if (existsSync(resolve(ROOT, "frontend/server/bff.ts"))) pass("local BFF entry present");
  else fail("frontend/server/bff.ts missing");
  if (existsSync(resolve(ROOT, "fixtures/dev/sample-evidence.json"))) {
    pass("development fixtures present");
  } else fail("fixtures/dev sample data missing");

  logSection("Backend packages");
  for (const rel of [
    "services/payday/package.json",
    "services/sentinel/package.json",
    "services/primary-observer/package.json",
    "packages/mission-core/package.json",
    "packages/kh-client/package.json",
  ]) {
    existsSync(resolve(ROOT, rel)) ? pass(rel) : fail(`${rel} missing`);
  }

  logSection("Ports");
  const ports = await checkPorts(DEFAULT_PORTS);
  for (const p of ports) {
    p.ok ? pass(p.message) : warn(p.message);
  }

  logSection("Live probes (optional)");
  if (setupMode) {
    pass("skipping live HTTP probes during setup");
  } else {
    const runtime = env.EMBER_RUNTIME_URL || "http://127.0.0.1:10000";
    const health = await fetchOk(`${runtime.replace(/\/$/, "")}/healthz`);
    if (health.ok) pass(`runtime healthz OK (${runtime})`);
    else warn(`runtime healthz not reachable at ${runtime} — start with pnpm dev`);

    const bff = await fetchOk("http://127.0.0.1:8780/api/health");
    if (bff.ok) pass("BFF /api/health OK");
    else warn("BFF not running on :8780 — start with pnpm dev");

    const vite = await fetchOk("http://127.0.0.1:5173/");
    if (vite.ok) pass("Vite frontend OK");
    else warn("Vite not running on :5173 — start with pnpm dev");
  }

  logSection("Wallet configuration");
  for (const key of ["ORG_A_WALLET_ADDRESS", "ORG_B_WALLET_ADDRESS", "EMPLOYEE_ADDRESS"]) {
    if (!env[key]) (dev ? warn : fail)(`${key} missing`);
    else if (String(env[key]).startsWith("0x1111") || String(env[key]).startsWith("0x2222") || String(env[key]).startsWith("0x3333")) {
      if (dev) pass(`${key} (sample)`);
      else fail(`${key} still uses sample development address`);
    } else pass(`${key} set`);
  }

  logSection("MCP");
  if (existsSync(resolve(ROOT, "docs/mcp/cursor.mcp.json.example"))) {
    pass("MCP example config documented");
  } else warn("docs/mcp examples missing");
  if (existsSync(resolve(ROOT, ".cursor/mcp.json"))) {
    warn(".cursor/mcp.json exists locally — ensure it is never committed");
  }

  console.log(`\n────────────────────────────────────────`);
  if (failures === 0) {
    console.log(`Doctor: PASS (${warnings} warning${warnings === 1 ? "" : "s"})`);
    if (dev) {
      console.log("Ready for: pnpm dev");
    } else {
      console.log("Live credentials look present. Ready for: pnpm build && pnpm start");
    }
  } else {
    console.log(`Doctor: FAIL (${failures} error${failures === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"})`);
    console.log("Fix the ✗ items above, or run: pnpm setup");
  }
  console.log(`────────────────────────────────────────\n`);

  if (failures > 0 && !setupMode) process.exit(1);
  if (failures > 0 && setupMode) process.exitCode = 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

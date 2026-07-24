#!/usr/bin/env node
/**
 * Zero-setup bootstrap for a clean clone.
 * Usage: pnpm setup
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import {
  ROOT,
  applyEnv,
  checkNode,
  checkPnpm,
  checkPorts,
  copyIfMissing,
  DEFAULT_PORTS,
  ensureDirs,
  isDevMode,
  loadEnvFile,
  logFail,
  logOk,
  logSection,
  logWarn,
  writeIfMissing,
} from "./lib/common.mjs";

const MIN_NODE = 20;

function patchEnvFile(path, patches) {
  let text = existsSync(path) ? readFileSync(path, "utf8") : "";
  for (const [key, value] of Object.entries(patches)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(text)) text = text.replace(re, line);
    else text = `${text.trimEnd()}\n${line}\n`;
  }
  writeFileSync(path, text.endsWith("\n") ? text : `${text}\n`);
}

async function main() {
  console.log("\nEMBER setup — preparing a clean local workspace\n");

  logSection("Runtime");
  const node = checkNode(MIN_NODE);
  if (!node.ok) {
    logFail(node.message);
    process.exit(1);
  }
  logOk(node.message);

  try {
    execSync("corepack enable", { cwd: ROOT, stdio: "ignore" });
    logOk("corepack enabled");
  } catch {
    logWarn("corepack enable failed — ensure pnpm is on PATH");
  }

  let pnpm = checkPnpm();
  if (!pnpm.ok) {
    try {
      execSync("corepack prepare pnpm@10.34.5 --activate", {
        cwd: ROOT,
        stdio: "ignore",
      });
      pnpm = checkPnpm();
    } catch {
      /* fall through */
    }
  }
  if (!pnpm.ok) {
    logFail(pnpm.message);
    process.exit(1);
  }
  logOk(pnpm.message);

  logSection("Dependencies");
  if (!existsSync(resolve(ROOT, "node_modules"))) {
    console.log("  installing workspace packages (pnpm install)...");
    execSync("pnpm install", { cwd: ROOT, stdio: "inherit" });
  } else {
    logOk("node_modules already present");
  }

  logSection("Directories");
  const created = ensureDirs();
  if (created.length === 0) logOk("runtime / fixtures directories ready");
  else created.forEach((d) => logOk(`created ${d}`));

  logSection("Environment");
  const envExample = resolve(ROOT, ".env.example");
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envExample)) {
    logFail(".env.example missing from repository");
    process.exit(1);
  }

  const createdEnv = copyIfMissing(envExample, envPath);
  if (createdEnv) {
    patchEnvFile(envPath, {
      DEVELOPMENT_MODE: "1",
      EMBER_NETWORK: "development",
      EMBER_RUNTIME_URL: "http://127.0.0.1:10000",
      SENTINEL_PUBLIC_URL: "http://127.0.0.1:10000",
      PRIMARY_OBSERVER_PUBLIC_URL: "http://127.0.0.1:8788",
      PRIMARY_OBSERVER_URL: "http://127.0.0.1:8788",
      SENTINEL_SHARED_SECRET: "dev-sentinel-hmac-secret-32chars!!",
      PRIMARY_OBSERVER_SHARED_SECRET: "dev-observer-hmac-secret-32chars!!",
      PAYDAY_ENABLE: "0",
      PROOF_ANCHOR_ENABLE: "0",
      SENTINEL_SELF_POLL: "1",
      BASE_RPC_URL: "https://sepolia.base.org",
      BASE_SEPOLIA_RPC_URL: "https://sepolia.base.org",
      CONTINUITY_ADDRESS_SEPOLIA: "0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770",
      CONTINUITY_ADDRESS_MAINNET: "0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770",
      MISSION_ID_SEPOLIA: "1",
      MISSION_ID_MAINNET: "1",
      MISSION_START_AT: "1784768419",
      WORKFLOW_HASH_SEPOLIA:
        "0xdev000000000000000000000000000000000000000000000000000000000001",
      WORKFLOW_HASH_MAINNET:
        "0xdev000000000000000000000000000000000000000000000000000000000001",
      EMPLOYEE_ADDRESS: "0x3333333333333333333333333333333333333333",
      ORG_A_WALLET_ADDRESS: "0x1111111111111111111111111111111111111111",
      ORG_B_WALLET_ADDRESS: "0x2222222222222222222222222222222222222222",
      ORG_A_WALLET_INTEGRATION_ID: "dev-org-a-wallet",
      ORG_B_WALLET_INTEGRATION_ID: "dev-org-b-wallet",
      KH_API_BASE: "https://app.keeperhub.com",
      KH_MCP_URL: "https://app.keeperhub.com/mcp",
      KH_API_KEY_PRIMARY_EXECUTOR: "kh_dev_executor_not_for_production",
      KH_API_KEY_PRIMARY_OBSERVER: "kh_dev_observer_not_for_production",
      KH_API_KEY_STANDBY: "kh_dev_standby_not_for_production",
      KH_ORG_A_W1_WORKFLOW_ID: "dev-org-a-w1",
      KH_ORG_B_W1_REPLAY_WORKFLOW_ID: "dev-org-b-w1-replay",
      KH_ORG_B_W2_WORKFLOW_ID: "dev-org-b-w2",
      KH_ORG_B_W3_WORKFLOW_ID: "dev-org-b-w3",
      PINATA_JWT: "dev-pinata-jwt-not-for-production",
      RESCUE_JOURNAL_DIR: "./runtime/rescues",
      PAYDAY_JOURNAL_DIR: "./runtime/payday",
      LOG_LEVEL: "info",
    });
    logOk("created .env with DEVELOPMENT_MODE=1 (safe local defaults)");
  } else {
    logOk(".env already exists (left unchanged)");
  }

  const feExample = resolve(ROOT, "frontend/.env.example");
  const feEnv = resolve(ROOT, "frontend/.env");
  if (existsSync(feExample)) {
    if (copyIfMissing(feExample, feEnv)) {
      patchEnvFile(feEnv, {
        EMBER_RUNTIME_URL: "http://127.0.0.1:10000",
        EMBER_NETWORK: "development",
        DEVELOPMENT_MODE: "1",
        SENTINEL_SHARED_SECRET: "dev-sentinel-hmac-secret-32chars!!",
        PRIMARY_OBSERVER_SHARED_SECRET: "dev-observer-hmac-secret-32chars!!",
        BFF_PORT: "8780",
      });
      logOk("created frontend/.env for local BFF");
    } else {
      logOk("frontend/.env already exists");
    }
  }

  applyEnv(loadEnvFile(envPath));

  logSection("Sample data");
  const fixtureFiles = [
    "fixtures/dev/sample-snapshot.json",
    "fixtures/dev/sample-evidence.json",
    "fixtures/dev/sample-wallets.json",
    "fixtures/dev/sample-missions.json",
  ];
  for (const rel of fixtureFiles) {
    if (existsSync(resolve(ROOT, rel))) logOk(rel);
    else logFail(`missing ${rel}`);
  }

  writeIfMissing(
    resolve(ROOT, "runtime/README.md"),
    "# Local runtime data\n\nJournals and watcher state. Safe to delete. Never commit secrets here.\n"
  );

  logSection("Ports");
  const ports = await checkPorts(DEFAULT_PORTS);
  for (const p of ports) {
    if (p.ok) logOk(p.message);
    else logWarn(p.message);
  }

  logSection("Validation");
  if (isDevMode()) {
    logOk("DEVELOPMENT_MODE=1 — live KeeperHub / Pinata / funded wallets not required");
  } else {
    logWarn("DEVELOPMENT_MODE is off — run pnpm doctor to verify live credentials");
  }

  try {
    execSync("node scripts/doctor.mjs --setup", { cwd: ROOT, stdio: "inherit" });
  } catch {
    logWarn("doctor reported issues — see output above");
  }

  console.log(`
══════════════════════════════════════════════════
  Setup complete

  Next:
    pnpm doctor     # full health report
    pnpm dev        # frontend + BFF + mock runtime + watcher

  Docs:
    LOCAL_SETUP.md
    README.md
══════════════════════════════════════════════════
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

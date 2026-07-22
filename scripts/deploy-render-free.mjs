#!/usr/bin/env node
/**
 * Create/update three free Render web services from the public GitHub repo.
 * Loads RENDER_API_KEY from env; never prints secrets.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (!(key in process.env) || !process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(".env"));
const apiKey = process.env.RENDER_API_KEY || process.env.render_api_key;
if (!apiKey) throw new Error("RENDER_API_KEY missing");

const OWNER_ID = process.env.RENDER_OWNER_ID;
const REPO =
  process.env.RENDER_REPO ||
  "https://github.com/james32135/ember"; // token-accessible publish repo; override for forks
const BRANCH = process.env.RENDER_BRANCH || "main";

async function api(path, init = {}) {
  const response = await fetch(`https://api.render.com/v1${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${apiKey}`,
      accept: "application/json",
      "content-type": "application/json",
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${init.method || "GET"} ${path} -> ${response.status}: ${text.slice(0, 500)}`);
  }
  return body;
}

function envVar(key, value) {
  return { key, value };
}
function secretEnv(key) {
  const value = process.env[key];
  if (!value) return null;
  return { key, value };
}

const sharedEconomics = [
  envVar("PAYMENT_AMOUNT_USDC", process.env.PAYMENT_AMOUNT_USDC || "10000"),
  envVar("CADENCE_SECONDS", process.env.CADENCE_SECONDS || "300"),
  envVar("CHAIN_ID_MAINNET", "8453"),
  envVar("CHAIN_ID_REHEARSAL", "84532"),
  envVar("PAYROLL_BUDGET_USDC", process.env.PAYROLL_BUDGET_USDC || "5000000"),
  envVar("ESCROW_FUND_USDC", process.env.ESCROW_FUND_USDC || "1000000"),
  envVar("MAINNET_TOTAL_SPEND_CAP_USDC", process.env.MAINNET_TOTAL_SPEND_CAP_USDC || "10000000"),
  envVar("GRACE_MISSED_RUNS", process.env.GRACE_MISSED_RUNS || "2"),
  envVar("SENTINEL_POLL_SECONDS", process.env.SENTINEL_POLL_SECONDS || "120"),
  envVar("CLOCK_SKEW_SECONDS", process.env.CLOCK_SKEW_SECONDS || "60"),
  envVar("RECEIPT_CONFIRMATIONS", process.env.RECEIPT_CONFIRMATIONS || "3"),
  envVar("MAX_REPLAY_SLOTS", process.env.MAX_REPLAY_SLOTS || "12"),
  envVar("X402_FEE_USDC", process.env.X402_FEE_USDC || "50000"),
  envVar("X402_MAX_FEE_USDC", process.env.X402_MAX_FEE_USDC || "500000"),
  envVar("LOG_LEVEL", "info"),
  envVar("NODE_VERSION", "24.12.0"),
  envVar("NODE_ENV", "production"),
  envVar("KH_API_BASE", process.env.KH_API_BASE || "https://app.keeperhub.com"),
  envVar("KH_MCP_URL", process.env.KH_MCP_URL || "https://app.keeperhub.com/mcp"),
  envVar("USDC_ADDRESS_BASE_SEPOLIA", process.env.USDC_ADDRESS_BASE_SEPOLIA || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
  envVar("BASE_SEPOLIA_RPC_URL_FALLBACK", process.env.BASE_SEPOLIA_RPC_URL_FALLBACK || "https://sepolia.base.org")
].filter(Boolean);

function compact(vars) {
  return vars.filter(Boolean);
}

const services = [
  {
    name: "ember-primary-observer",
    startCommand: "node services/primary-observer/dist/main.js",
    envVars: compact([
      ...sharedEconomics,
      secretEnv("KH_API_KEY_PRIMARY_OBSERVER"),
      secretEnv("KH_ORG_A_W1_WORKFLOW_ID"),
      secretEnv("PRIMARY_OBSERVER_SHARED_SECRET")
    ])
  },
  {
    name: "ember-payday",
    startCommand: "node services/payday/dist/main.js",
    envVars: compact([
      ...sharedEconomics,
      envVar("PAYDAY_ENABLE", "0"),
      envVar("RESCUE_JOURNAL_DIR", "/tmp/ember/payday"),
      secretEnv("KH_API_KEY_PRIMARY_EXECUTOR"),
      secretEnv("KH_ORG_A_W1_WORKFLOW_ID"),
      secretEnv("ORG_A_WALLET_ADDRESS"),
      secretEnv("EMPLOYEE_ADDRESS"),
      secretEnv("MISSION_ID_SEPOLIA"),
      secretEnv("MISSION_START_AT"),
      secretEnv("BASE_SEPOLIA_RPC_URL")
    ])
  },
  {
    name: "ember-sentinel",
    startCommand: "node services/sentinel/dist/main.js",
    envVars: compact([
      ...sharedEconomics,
      envVar("SENTINEL_SELF_POLL", "1"),
      envVar("PROOF_ANCHOR_ENABLE", "0"),
      envVar("W1_CANONICAL_PATH", "workflows/w1-payday-stream.json"),
      envVar("RESCUE_JOURNAL_DIR", "/tmp/ember/rescues"),
      envVar("IPFS_GATEWAY", process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs"),
      secretEnv("KH_API_KEY_STANDBY"),
      secretEnv("KH_ORG_B_W1_REPLAY_WORKFLOW_ID"),
      secretEnv("KH_ORG_B_W2_WORKFLOW_ID"),
      secretEnv("KH_ORG_B_W3_WORKFLOW_ID"),
      secretEnv("ORG_A_WALLET_ADDRESS"),
      secretEnv("ORG_B_WALLET_ADDRESS"),
      secretEnv("ORG_B_WALLET_INTEGRATION_ID"),
      secretEnv("EMPLOYEE_ADDRESS"),
      secretEnv("SENTINEL_SHARED_SECRET"),
      secretEnv("PRIMARY_OBSERVER_SHARED_SECRET"),
      secretEnv("CONTINUITY_ADDRESS_SEPOLIA"),
      secretEnv("MISSION_ID_SEPOLIA"),
      secretEnv("MISSION_START_AT"),
      secretEnv("WORKFLOW_HASH_SEPOLIA"),
      secretEnv("BASE_SEPOLIA_RPC_URL"),
      secretEnv("PINATA_JWT")
    ])
  }
];

const owners = await api("/owners");
const ownerId =
  OWNER_ID ||
  owners.find((entry) => entry.owner?.type === "team")?.owner?.id ||
  owners[0]?.owner?.id;
if (!ownerId) throw new Error("no Render owner id");

const existing = await api("/services?limit=50");
const byName = new Map(
  (Array.isArray(existing) ? existing : []).map((row) => [row.service?.name || row.name, row.service || row])
);

const results = [];
for (const spec of services) {
  const current = byName.get(spec.name);
  if (current?.id) {
    await api(`/services/${current.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        repo: REPO,
        branch: BRANCH,
        autoDeploy: "yes",
        buildCommand: "corepack enable && pnpm install --frozen-lockfile && pnpm build",
        startCommand: spec.startCommand
      })
    });
    if (current.suspended === "suspended") {
      await api(`/services/${current.id}/resume`, { method: "POST", body: "{}" });
    }
    await api(`/services/${current.id}/env-vars`, {
      method: "PUT",
      body: JSON.stringify(spec.envVars)
    });
    const deploy = await api(`/services/${current.id}/deploys`, {
      method: "POST",
      body: JSON.stringify({ clearCache: "clear" })
    });
    results.push({
      name: spec.name,
      action: "updated_and_redeployed",
      id: current.id,
      url: current.serviceDetails?.url || current.url,
      deployId: deploy?.id || deploy?.deploy?.id,
      repo: REPO
    });
    continue;
  }

  const created = await api("/services", {
    method: "POST",
    body: JSON.stringify({
      type: "web_service",
      name: spec.name,
      ownerId,
      repo: REPO,
      autoDeploy: "yes",
      branch: BRANCH,
      buildCommand: "corepack enable && pnpm install --frozen-lockfile && pnpm build",
      startCommand: spec.startCommand,
      envVars: spec.envVars,
      serviceDetails: {
        runtime: "node",
        plan: "free",
        region: "frankfurt",
        healthCheckPath: "/healthz",
        envSpecificDetails: {
          buildCommand: "corepack enable && pnpm install --frozen-lockfile && pnpm build",
          startCommand: spec.startCommand
        }
      }
    })
  });
  const service = created.service || created;
  results.push({
    name: spec.name,
    action: "created",
    id: service.id,
    url: service.serviceDetails?.url || service.url
  });
}

// Wire PRIMARY_OBSERVER_URL after Observer exists
const observer = results.find((item) => item.name === "ember-primary-observer");
const sentinel = results.find((item) => item.name === "ember-sentinel");
if (observer?.url && sentinel?.id) {
  const host = observer.url.replace(/^https?:\/\//, "");
  await api(`/services/${sentinel.id}/env-vars`, {
    method: "PUT",
    body: JSON.stringify([
      ...services.find((item) => item.name === "ember-sentinel").envVars,
      envVar("PRIMARY_OBSERVER_URL", `https://${host}`)
    ])
  });
  await api(`/services/${sentinel.id}/deploys`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

async function waitHealthy(url, attempts = 36, delayMs = 10_000) {
  const healthUrl = `${url.replace(/\/$/, "")}/healthz`;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(8_000) });
      if (response.ok) {
        const body = await response.json();
        return { ok: true, attempt, status: response.status, body };
      }
      if (attempt === attempts) {
        return { ok: false, attempt, status: response.status };
      }
    } catch (error) {
      if (attempt === attempts) {
        return {
          ok: false,
          attempt,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return { ok: false, attempt: attempts };
}

const health = {};
for (const item of results) {
  if (!item.url) continue;
  const url = item.url.startsWith("http") ? item.url : `https://${item.url}`;
  item.url = url;
  health[item.name] = await waitHealthy(url);
}

mkdirSync("docs/evidence", { recursive: true });
const evidence = {
  version: 1,
  at: new Date().toISOString(),
  repo: REPO,
  ownerId,
  results,
  health,
  pass: Object.values(health).every((entry) => entry?.ok === true)
};
writeFileSync("docs/evidence/render-free-deploy.json", `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.pass) process.exitCode = 1;

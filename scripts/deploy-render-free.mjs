#!/usr/bin/env node
/**
 * Create/update one free Render web service (combined ember-runtime).
 * Loads keys from .env file (last occurrence wins); never prints secrets.
 * Suspends legacy split services when present.
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
    // Last occurrence wins so refreshed tokens at end of .env take effect.
    process.env[key] = value;
  }
}

loadEnvFile(resolve(".env"));
const apiKey = process.env.RENDER_API_KEY || process.env.render_api_key;
if (!apiKey) throw new Error("RENDER_API_KEY missing");

const OWNER_ID = process.env.RENDER_OWNER_ID;
const REPO =
  process.env.RENDER_REPO || "https://github.com/mohamedwael201193/ember";
const BRANCH = process.env.RENDER_BRANCH || "main";
const SERVICE_NAME = process.env.RENDER_SERVICE_NAME || "ember";
const LEGACY_NAMES = ["ember-primary-observer", "ember-payday", "ember-sentinel"];

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

const envVars = [
  envVar("NODE_VERSION", "24.12.0"),
  envVar("NODE_ENV", "production"),
  envVar("PAYDAY_ENABLE", process.env.PAYDAY_ENABLE || "0"),
  envVar("SENTINEL_SELF_POLL", "1"),
  envVar("PROOF_ANCHOR_ENABLE", process.env.PROOF_ANCHOR_ENABLE || "0"),
  envVar("KH_API_BASE", process.env.KH_API_BASE || "https://app.keeperhub.com"),
  envVar("KH_MCP_URL", process.env.KH_MCP_URL || "https://app.keeperhub.com/mcp"),
  envVar("BASE_SEPOLIA_RPC_URL_FALLBACK", process.env.BASE_SEPOLIA_RPC_URL_FALLBACK || "https://sepolia.base.org"),
  envVar("USDC_ADDRESS_BASE_SEPOLIA", process.env.USDC_ADDRESS_BASE_SEPOLIA || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
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
  envVar("W1_CANONICAL_PATH", "workflows/w1-payday-stream.json"),
  envVar("IPFS_GATEWAY", process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs"),
  envVar("RESCUE_JOURNAL_DIR", "/tmp/ember/rescues"),
  envVar("PAYDAY_JOURNAL_DIR", "/tmp/ember/payday"),
  envVar("LOG_LEVEL", "info"),
  secretEnv("KH_API_KEY_PRIMARY_EXECUTOR"),
  secretEnv("KH_API_KEY_PRIMARY_OBSERVER"),
  secretEnv("KH_API_KEY_STANDBY"),
  secretEnv("KH_ORG_A_W1_WORKFLOW_ID"),
  secretEnv("KH_ORG_B_W1_REPLAY_WORKFLOW_ID"),
  secretEnv("KH_ORG_B_W2_WORKFLOW_ID"),
  secretEnv("KH_ORG_B_W3_WORKFLOW_ID"),
  secretEnv("ORG_A_WALLET_ADDRESS"),
  secretEnv("ORG_B_WALLET_ADDRESS"),
  secretEnv("ORG_B_WALLET_INTEGRATION_ID"),
  secretEnv("EMPLOYEE_ADDRESS"),
  secretEnv("PRIMARY_OBSERVER_SHARED_SECRET"),
  secretEnv("SENTINEL_SHARED_SECRET"),
  secretEnv("CONTINUITY_ADDRESS_SEPOLIA"),
  secretEnv("MISSION_ID_SEPOLIA"),
  secretEnv("MISSION_START_AT"),
  secretEnv("WORKFLOW_HASH_SEPOLIA"),
  secretEnv("BASE_SEPOLIA_RPC_URL"),
  secretEnv("PINATA_JWT")
].filter(Boolean);

const startCommand = "node scripts/start-ember-runtime.mjs";
const buildCommand = "corepack enable && pnpm install --frozen-lockfile && pnpm build";

const owners = await api("/owners");
const ownerId =
  OWNER_ID ||
  owners.find((entry) => entry.owner?.type === "team")?.owner?.id ||
  owners[0]?.owner?.id;
if (!ownerId) throw new Error("no Render owner id");

const existing = await api("/services?limit=50");
const rows = Array.isArray(existing) ? existing : [];
const byName = new Map(rows.map((row) => [row.service?.name || row.name, row.service || row]));

const suspendedLegacy = [];
for (const name of LEGACY_NAMES) {
  const svc = byName.get(name);
  if (!svc?.id) continue;
  if (svc.suspended !== "suspended") {
    try {
      await api(`/services/${svc.id}/suspend`, { method: "POST", body: "{}" });
      suspendedLegacy.push({ name, id: svc.id, action: "suspended" });
    } catch (error) {
      suspendedLegacy.push({
        name,
        id: svc.id,
        action: "suspend_failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    suspendedLegacy.push({ name, id: svc.id, action: "already_suspended" });
  }
}

const current = byName.get(SERVICE_NAME);
let result;
async function patchRuntime(serviceId) {
  await api(`/services/${serviceId}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: SERVICE_NAME,
      repo: REPO,
      branch: BRANCH,
      autoDeploy: "yes",
      serviceDetails: {
        healthCheckPath: "/healthz",
        envSpecificDetails: {
          buildCommand,
          startCommand
        }
      }
    })
  });
}

const reuseName = process.env.RENDER_REUSE_SERVICE || "meridian-backend";
if (!current?.id && byName.get(reuseName)?.id) {
  current = byName.get(reuseName);
}

if (current?.id) {
  await patchRuntime(current.id);
  if (current.suspended === "suspended") {
    await api(`/services/${current.id}/resume`, { method: "POST", body: "{}" });
  }
  await api(`/services/${current.id}/env-vars`, {
    method: "PUT",
    body: JSON.stringify(envVars)
  });
  const deploy = await api(`/services/${current.id}/deploys`, {
    method: "POST",
    body: JSON.stringify({ clearCache: "clear" })
  });
  result = {
    name: SERVICE_NAME,
    action: "updated_and_redeployed",
    id: current.id,
    url: current.serviceDetails?.url || current.url,
    deployId: deploy?.id || deploy?.deploy?.id,
    repo: REPO,
    reusedFrom: current.name !== SERVICE_NAME ? current.name : undefined
  };
} else {
  let created;
  try {
    created = await api("/services", {
      method: "POST",
      body: JSON.stringify({
        type: "web_service",
        name: SERVICE_NAME,
        ownerId,
        repo: REPO,
        autoDeploy: "yes",
        branch: BRANCH,
        buildCommand,
        startCommand,
        envVars,
        serviceDetails: {
          runtime: "node",
          plan: "free",
          region: "frankfurt",
          healthCheckPath: "/healthz",
          envSpecificDetails: {
            buildCommand,
            startCommand
          }
        }
      })
    });
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}. Set RENDER_REUSE_SERVICE to a suspended web service name to retarget.`
    );
  }
  const service = created.service || created;
  result = {
    name: SERVICE_NAME,
    action: "created",
    id: service.id,
    url: service.serviceDetails?.url || service.url,
    repo: REPO
  };
}

async function waitHealthy(url, attempts = 48, delayMs = 10_000) {
  const healthUrl = `${url.replace(/\/$/, "")}/healthz`;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(12_000) });
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

if (result.url && !String(result.url).startsWith("http")) {
  result.url = `https://${result.url}`;
}
const health = result.url ? await waitHealthy(result.url) : { ok: false, error: "no_url" };

mkdirSync("docs/evidence", { recursive: true });
const evidence = {
  version: 2,
  at: new Date().toISOString(),
  mode: "single_web_service",
  repo: REPO,
  ownerId,
  result,
  suspendedLegacy,
  health,
  pass: health?.ok === true
};
writeFileSync("docs/evidence/render-free-deploy.json", `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.pass) process.exitCode = 1;

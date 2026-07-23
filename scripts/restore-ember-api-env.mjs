/**
 * Restore allowlisted env vars on Render service ember-api from repo .env.
 * Never prints secret values.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}

loadEnvFile(resolve(".env"));

const apiKey = process.env.RENDER_API_KEY || process.env.render_api_key;
if (!apiKey) throw new Error("render_api_key missing");

const SERVICE_ID = process.env.RENDER_EMBER_API_ID || "srv-d9gp5qr7uimc738ppb70";

const ALLOW = [
  "BASE_RPC_URL",
  "BASE_RPC_URL_FALLBACK",
  "BASE_SEPOLIA_RPC_URL",
  "BASE_SEPOLIA_RPC_URL_FALLBACK",
  "CADENCE_SECONDS",
  "CHAIN_ID_MAINNET",
  "CHAIN_ID_REHEARSAL",
  "CLOCK_SKEW_SECONDS",
  "CONTINUITY_ADDRESS_MAINNET",
  "CONTINUITY_ADDRESS_SEPOLIA",
  "EMBER_NETWORK",
  "EMPLOYEE_ADDRESS",
  "ESCROW_FUND_USDC",
  "GRACE_MISSED_RUNS",
  "IPFS_GATEWAY",
  "KH_API_BASE",
  "KH_API_KEY_PRIMARY_EXECUTOR",
  "KH_API_KEY_PRIMARY_OBSERVER",
  "KH_API_KEY_STANDBY",
  "KH_MCP_URL",
  "KH_ORG_A_W1_WORKFLOW_ID",
  "KH_ORG_A_W1_MAINNET_WORKFLOW_ID",
  "KH_ORG_B_W1_REPLAY_WORKFLOW_ID",
  "KH_ORG_B_W1_REPLAY_MAINNET_WORKFLOW_ID",
  "KH_ORG_B_W2_WORKFLOW_ID",
  "KH_ORG_B_W3_WORKFLOW_ID",
  "LOG_LEVEL",
  "MAINNET_TOTAL_SPEND_CAP_USDC",
  "MAX_REPLAY_SLOTS",
  "MISSION_ID_MAINNET",
  "MISSION_ID_SEPOLIA",
  "MISSION_START_AT",
  "MISSION_START_AT_MAINNET",
  "NODE_ENV",
  "NODE_VERSION",
  "ORG_A_WALLET_ADDRESS",
  "ORG_A_WALLET_INTEGRATION_ID",
  "ORG_B_WALLET_ADDRESS",
  "ORG_B_WALLET_INTEGRATION_ID",
  "PAYDAY_ENABLE",
  "PAYDAY_JOURNAL_DIR",
  "PAYMENT_AMOUNT_USDC",
  "PAYROLL_BUDGET_USDC",
  "PINATA_JWT",
  "PRIMARY_OBSERVER_SHARED_SECRET",
  "PROOF_ANCHOR_ENABLE",
  "RECEIPT_CONFIRMATIONS",
  "RESCUE_JOURNAL_DIR",
  "SENTINEL_POLL_SECONDS",
  "SENTINEL_SELF_POLL",
  "SENTINEL_SHARED_SECRET",
  "SENTINEL_PUBLIC_URL",
  "USDC_ADDRESS_BASE",
  "USDC_ADDRESS_BASE_SEPOLIA",
  "W1_CANONICAL_PATH",
  "WORKFLOW_HASH_MAINNET",
  "WORKFLOW_HASH_SEPOLIA",
  "X402_FEE_USDC",
  "X402_MAX_FEE_USDC",
];

const forced = {
  NODE_ENV: "production",
  NODE_VERSION: "24.12.0",
  EMBER_NETWORK: process.env.EMBER_NETWORK || "mainnet",
  PAYDAY_ENABLE: process.env.PAYDAY_ENABLE || "0",
  SENTINEL_SELF_POLL: "1",
  PROOF_ANCHOR_ENABLE: process.env.PROOF_ANCHOR_ENABLE || "0",
  PAYDAY_JOURNAL_DIR: "/var/data/ember/payday",
  RESCUE_JOURNAL_DIR: "/var/data/ember/rescues",
  SENTINEL_PUBLIC_URL: "https://ember-api-8qzg.onrender.com",
  KH_API_BASE: process.env.KH_API_BASE || "https://app.keeperhub.com",
  KH_MCP_URL: process.env.KH_MCP_URL || "https://app.keeperhub.com/mcp",
  LOG_LEVEL: "info",
  W1_CANONICAL_PATH:
    process.env.W1_CANONICAL_PATH || "workflows/w1-payday-stream.mainnet.json",
};

const body = [];
const missing = [];
for (const k of ALLOW) {
  const v = forced[k] ?? process.env[k];
  if (v !== undefined && String(v).length > 0) body.push({ key: k, value: String(v) });
  else missing.push(k);
}

const headers = {
  authorization: `Bearer ${apiKey}`,
  accept: "application/json",
  "content-type": "application/json",
};

const put = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, {
  method: "PUT",
  headers,
  body: JSON.stringify(body),
});
const out = await put.json();
const keys = (Array.isArray(out) ? out : [])
  .map((x) => x.envVar?.key)
  .filter(Boolean)
  .sort();

console.log(
  JSON.stringify(
    {
      status: put.status,
      restored: keys.length,
      keys,
      missing,
      hasSecrets: {
        SENTINEL_SHARED_SECRET: keys.includes("SENTINEL_SHARED_SECRET"),
        PRIMARY_OBSERVER_SHARED_SECRET: keys.includes("PRIMARY_OBSERVER_SHARED_SECRET"),
        PINATA_JWT: keys.includes("PINATA_JWT"),
        KH_API_KEY_PRIMARY_OBSERVER: keys.includes("KH_API_KEY_PRIMARY_OBSERVER"),
        BASE_RPC_URL: keys.includes("BASE_RPC_URL"),
      },
    },
    null,
    2
  )
);

if (put.status !== 200 || keys.length < 40) {
  process.exit(1);
}

const dep = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
  method: "POST",
  headers,
  body: JSON.stringify({ clearCache: "do_not_clear" }),
});
const depBody = await dep.text();
console.log("deploy", dep.status, depBody.slice(0, 220));

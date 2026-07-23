#!/usr/bin/env node
/**
 * Safe Render cutover: paginated GET of existing env-vars, merge updates, PUT full set, deploy.
 * Never PUTs a partial list (Render replaces the entire set).
 * Render lists env-vars in pages of ~20 — always paginate before merge.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
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
if (!apiKey) throw new Error("RENDER_API_KEY missing");
const serviceId = process.env.RENDER_SERVICE_ID || "srv-d93aj1ernols73b8a170";

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
    throw new Error(`${init.method || "GET"} ${path} -> ${response.status}: ${text.slice(0, 800)}`);
  }
  return body;
}

async function listAllEnv() {
  const map = new Map();
  let cursor = "";
  for (let i = 0; i < 20; i++) {
    const q = cursor ? `?limit=50&cursor=${encodeURIComponent(cursor)}` : "?limit=50";
    const page = await api(`/services/${serviceId}/env-vars${q}`);
    const rows = Array.isArray(page) ? page : [];
    if (!rows.length) break;
    for (const row of rows) {
      const key = row.envVar?.key || row.key;
      const value = row.envVar?.value || row.value;
      if (key) map.set(key, value);
      if (row.cursor) cursor = row.cursor;
    }
    if (rows.length < 50) break;
  }
  return map;
}

const updates = {
  EMBER_NETWORK: "mainnet",
  PAYDAY_ENABLE: process.env.PAYDAY_ENABLE || "0",
  PROOF_ANCHOR_ENABLE: process.env.PROOF_ANCHOR_ENABLE || "1",
  MISSION_START_AT: process.env.MISSION_START_AT_MAINNET || process.env.MISSION_START_AT,
  CONTINUITY_ADDRESS_MAINNET: process.env.CONTINUITY_ADDRESS_MAINNET,
  MISSION_ID_MAINNET: process.env.MISSION_ID_MAINNET || "1",
  WORKFLOW_HASH_MAINNET: process.env.WORKFLOW_HASH_MAINNET,
  KH_ORG_A_W1_WORKFLOW_ID:
    process.env.KH_ORG_A_W1_MAINNET_WORKFLOW_ID || process.env.KH_ORG_A_W1_WORKFLOW_ID,
  KH_ORG_B_W1_REPLAY_WORKFLOW_ID:
    process.env.KH_ORG_B_W1_REPLAY_MAINNET_WORKFLOW_ID ||
    process.env.KH_ORG_B_W1_REPLAY_WORKFLOW_ID,
  W1_CANONICAL_PATH: "workflows/w1-payday-stream.mainnet.json",
  BASE_RPC_URL: process.env.BASE_RPC_URL,
  BASE_RPC_URL_FALLBACK: process.env.BASE_RPC_URL_FALLBACK || "https://mainnet.base.org",
  USDC_ADDRESS_BASE: process.env.USDC_ADDRESS_BASE,
  CHAIN_ID_MAINNET: process.env.CHAIN_ID_MAINNET || "8453",
  CHAIN_ID_REHEARSAL: process.env.CHAIN_ID_REHEARSAL || "84532",
  PAYDAY_JOURNAL_DIR: process.env.PAYDAY_JOURNAL_DIR || "/var/data/ember/payday",
  RESCUE_JOURNAL_DIR: process.env.RESCUE_JOURNAL_DIR || "/var/data/ember/rescues"
};

const map = await listAllEnv();
const beforeKeys = [...map.keys()].sort();
if (beforeKeys.length < 40) {
  throw new Error(
    `Refusing cutover merge: only ${beforeKeys.length} env keys visible after pagination. Restore full env first.`
  );
}
for (const [key, value] of Object.entries(updates)) {
  if (value === undefined || value === "") throw new Error(`cutover update ${key} is empty`);
  map.set(key, value);
}
const envVars = [...map.entries()].map(([key, value]) => ({ key, value }));
await api(`/services/${serviceId}/env-vars`, {
  method: "PUT",
  body: JSON.stringify(envVars)
});
const deployRows = await api(`/services/${serviceId}/deploys`, {
  method: "POST",
  body: JSON.stringify({ clearCache: "do_not_clear" })
});
const deploy = deployRows?.deploy || deployRows;
const evidence = {
  version: 1,
  at: new Date().toISOString(),
  serviceId,
  beforeKeyCount: beforeKeys.length,
  afterKeyCount: envVars.length,
  updatedKeys: Object.keys(updates).sort(),
  deployId: deploy?.id ?? null,
  pass: envVars.length >= beforeKeys.length && envVars.length >= 40
};
mkdirSync("docs/evidence", { recursive: true });
writeFileSync(
  "docs/evidence/mainnet-render-cutover-2026-07-23.json",
  JSON.stringify(evidence, null, 2)
);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.pass) process.exit(1);

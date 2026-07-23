import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const payday = JSON.parse(
  readFileSync(resolve(root, "docs/evidence/mainnet-payday-slots-2026-07-23.json"), "utf8")
);
const rescue = JSON.parse(
  readFileSync(resolve(root, "docs/evidence/mainnet-rescue-2026-07-23.json"), "utf8")
);

const out = `/**
 * Vercel serverless BFF (single-file, no local imports).
 * Local BFF continues to use api/bff-core.ts via server/bff.ts.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, createHmac, randomBytes } from "node:crypto";

export const config = { maxDuration: 60 };

const bundledPayday = ${JSON.stringify(payday)} as const;
const bundledRescue = ${JSON.stringify(rescue)} as const;

function runtimeUrl(): string {
  return (
    process.env.EMBER_RUNTIME_URL ||
    process.env.SENTINEL_PUBLIC_URL ||
    "https://ember-api-8qzg.onrender.com"
  ).replace(/\\/$/, "");
}

function sentinelSecret(): string {
  return process.env.SENTINEL_SHARED_SECRET || "";
}

function observerSecret(): string {
  return process.env.PRIMARY_OBSERVER_SHARED_SECRET || sentinelSecret();
}

function bodySha256Hex(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}

function signHmac(secret: string, timestamp: number, nonce: string, body: string): string {
  const payload = \`\${timestamp}.\${nonce}.\${bodySha256Hex(body)}\`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function hmacHeaders(secret: string, body: string): Record<string, string> {
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString("hex");
  const signature = signHmac(secret, timestamp, nonce, body);
  return {
    "content-type": "application/json",
    "x-ember-timestamp": String(timestamp),
    "x-ember-nonce": nonce,
    "x-ember-body-sha256": bodySha256Hex(body),
    "x-ember-signature": signature,
  };
}

async function proxySigned(path: string, method: string, secret: string, body = "{}") {
  const headers = hmacHeaders(secret, body);
  if (method === "GET") delete headers["content-type"];
  const res = await fetch(\`\${runtimeUrl()}\${path}\`, {
    method,
    headers,
    body: method === "GET" ? undefined : body,
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function proxyPublic(path: string) {
  const res = await fetch(\`\${runtimeUrl()}\${path}\`);
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: res.status, json };
}

function publicConfig() {
  const network = process.env.EMBER_NETWORK || "mainnet";
  const isMainnet = network === "mainnet";
  return {
    network,
    chainId: isMainnet ? 8453 : 84532,
    missionId: isMainnet
      ? process.env.MISSION_ID_MAINNET || "1"
      : process.env.MISSION_ID_SEPOLIA || "1",
    continuity: isMainnet
      ? process.env.CONTINUITY_ADDRESS_MAINNET
      : process.env.CONTINUITY_ADDRESS_SEPOLIA,
    workflowHash: isMainnet
      ? process.env.WORKFLOW_HASH_MAINNET
      : process.env.WORKFLOW_HASH_SEPOLIA,
    orgAWorkflowId:
      process.env.KH_ORG_A_W1_MAINNET_WORKFLOW_ID ||
      process.env.KH_ORG_A_W1_WORKFLOW_ID,
    orgBReplayWorkflowId:
      process.env.KH_ORG_B_W1_REPLAY_MAINNET_WORKFLOW_ID ||
      process.env.KH_ORG_B_W1_REPLAY_WORKFLOW_ID,
    runtimeUrl: runtimeUrl(),
    explorerBase: isMainnet ? "https://basescan.org" : "https://sepolia.basescan.org",
    ipfsGateway: process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/",
  };
}

function loadEvidence() {
  const payday = bundledPayday as Record<string, unknown>;
  const rescueWrap = bundledRescue as { journal?: Record<string, unknown> };
  const journal = rescueWrap?.journal ?? null;
  return {
    continuity: (payday?.continuity as string) || "0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770",
    missionId: String(payday?.missionId || journal?.missionId || "1"),
    chainId: (payday?.chainId as number) || 8453,
    network: (payday?.network as string) || "mainnet",
    paydaySlots: (payday?.slots as unknown[]) || [],
    balances: payday?.balances,
    rescue: journal,
    proofCid: journal?.proofCid,
    anchorTx: journal?.anchorTxHash,
    rescueId: journal?.rescueId,
  };
}

async function handleApi(req: {
  method: string;
  pathname: string;
  search: string;
  body: string;
}) {
  const path = req.pathname.replace(/\\/+$/, "") || "/";
  const method = req.method.toUpperCase();
  const RUNTIME_URL = runtimeUrl();
  const SENTINEL_SECRET = sentinelSecret();
  const OBSERVER_SECRET = observerSecret();

  if (path === "/api/health" && method === "GET") {
    const upstream = await proxyPublic("/healthz");
    return {
      status: 200,
      data: { bff: "ok", runtime: RUNTIME_URL, upstreamStatus: upstream.status, upstream: upstream.json },
    };
  }
  if (path === "/api/ready" && method === "GET") {
    const upstream = await proxyPublic("/readyz");
    return { status: upstream.status, data: upstream.json };
  }
  if (path === "/api/config" && method === "GET") {
    return { status: 200, data: publicConfig() };
  }
  if (path === "/api/status" && method === "GET") {
    const upstream = await proxyPublic("/status");
    return { status: upstream.status, data: upstream.json };
  }
  if (path === "/api/check" && method === "POST") {
    if (!SENTINEL_SECRET) return { status: 500, data: { error: "SENTINEL_SHARED_SECRET missing in BFF env" } };
    const upstream = await proxySigned("/check", "POST", SENTINEL_SECRET, req.body || "{}");
    return { status: upstream.status, data: upstream.json };
  }
  if (path === "/api/rescue" && method === "POST") {
    if (!SENTINEL_SECRET) return { status: 500, data: { error: "SENTINEL_SHARED_SECRET missing in BFF env" } };
    const upstream = await proxySigned("/rescue", "POST", SENTINEL_SECRET, req.body || "{}");
    return { status: upstream.status, data: upstream.json };
  }
  if (path === "/api/executions" && method === "GET") {
    if (!OBSERVER_SECRET) return { status: 500, data: { error: "PRIMARY_OBSERVER_SHARED_SECRET missing" } };
    const upstream = await proxySigned(\`/v1/executions\${req.search || ""}\`, "GET", OBSERVER_SECRET, "");
    return { status: upstream.status, data: upstream.json };
  }
  if (path === "/api/snapshot" && method === "GET") {
    const cfg = publicConfig();
    const [health, ready, status] = await Promise.all([
      proxyPublic("/healthz"),
      proxyPublic("/readyz"),
      proxyPublic("/status"),
    ]);
    let check: unknown = null;
    let checkStatus = 0;
    if (SENTINEL_SECRET) {
      const c = await proxySigned("/check", "POST", SENTINEL_SECRET, "{}");
      check = c.json;
      checkStatus = c.status;
    }
    return {
      status: 200,
      data: {
        checkedAt: new Date().toISOString(),
        config: cfg,
        health: health.json,
        ready: ready.json,
        status: status.json,
        check,
        checkStatus,
        serviceReadiness: [
          { name: "runtime", ok: health.status === 200, detail: health.json },
          { name: "ready", ok: ready.status === 200, detail: ready.json },
          { name: "sentinel-check", ok: checkStatus === 200, detail: check },
        ],
      },
    };
  }
  if (path === "/api/evidence/mainnet" && method === "GET") {
    return { status: 200, data: loadEvidence() };
  }
  return { status: 404, data: { error: "not_found", path } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "content-type,authorization");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  try {
    const segments = req.query.path;
    const joined = Array.isArray(segments)
      ? segments.join("/")
      : typeof segments === "string"
        ? segments
        : "";
    const pathname = (\`/api/\${joined}\`).replace(/\\/+$/, "") || "/api";
    let body = "";
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      if (typeof req.body === "string") body = req.body || "{}";
      else if (req.body != null) body = JSON.stringify(req.body);
      else body = "{}";
    }
    const search =
      typeof req.url === "string" && req.url.includes("?")
        ? \`?\${req.url.split("?")[1]}\`
        : "";
    const result = await handleApi({
      method: req.method || "GET",
      pathname,
      search,
      body,
    });
    res.status(result.status).json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ember-bff]", message);
    res.status(500).json({ error: "bff_function_failed", message });
  }
}
`;

writeFileSync(resolve(root, "frontend/api/[...path].ts"), out);
console.log("wrote single-file api/[...path].ts", out.length);

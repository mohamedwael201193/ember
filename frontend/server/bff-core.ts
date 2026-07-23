/**
 * Shared BFF handlers for local Node server and Vercel serverless.
 * HMAC secrets stay server-side only.
 */
import { createHash, createHmac, randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { bundledPayday, bundledRescue } from "./evidence-data";

export type ApiResult = { status: number; data: unknown };

function loadEnvFile(path: string) {
  try {
    if (!existsSync(path)) return;
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* ignore missing/unreadable .env on serverless */
  }
}

/** Load repo .env when running locally (no-op on Vercel if file missing). */
export function bootstrapEnv() {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../.env"),
    resolve(process.cwd(), "../../.env"),
  ];
  for (const p of candidates) loadEnvFile(p);
}

export function runtimeUrl(): string {
  return (
    process.env.EMBER_RUNTIME_URL ||
    process.env.SENTINEL_PUBLIC_URL ||
    "https://ember-api-8qzg.onrender.com"
  ).replace(/\/$/, "");
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
  const payload = `${timestamp}.${nonce}.${bodySha256Hex(body)}`;
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

async function proxySigned(
  path: string,
  method: string,
  secret: string,
  body = "{}"
): Promise<{ status: number; json: unknown }> {
  const headers = hmacHeaders(secret, body);
  if (method === "GET") {
    delete headers["content-type"];
  }
  const res = await fetch(`${runtimeUrl()}${path}`, {
    method,
    headers,
    body: method === "GET" ? undefined : body,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function proxyPublic(path: string): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${runtimeUrl()}${path}`);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

export function publicConfig() {
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
    explorerBase: isMainnet
      ? "https://basescan.org"
      : "https://sepolia.basescan.org",
    ipfsGateway: process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs/",
  };
}

function loadEvidence() {
  const payday = bundledPayday as Record<string, unknown>;
  const rescueWrap = bundledRescue as { journal?: Record<string, unknown> };
  const journal = rescueWrap?.journal ?? null;

  return {
    continuity:
      (payday?.continuity as string) ||
      "0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770",
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

export type ApiRequest = {
  method: string;
  pathname: string;
  search: string;
  body: string;
};

/**
 * Route table shared by local BFF and Vercel `/api/*`.
 */
export async function handleApi(req: ApiRequest): Promise<ApiResult> {
  const path = req.pathname.replace(/\/+$/, "") || "/";
  const method = req.method.toUpperCase();
  const RUNTIME_URL = runtimeUrl();
  const SENTINEL_SECRET = sentinelSecret();
  const OBSERVER_SECRET = observerSecret();

  if (path === "/api/health" && method === "GET") {
    const upstream = await proxyPublic("/healthz");
    return {
      status: 200,
      data: {
        bff: "ok",
        runtime: RUNTIME_URL,
        upstreamStatus: upstream.status,
        upstream: upstream.json,
      },
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
    if (!SENTINEL_SECRET) {
      return { status: 500, data: { error: "SENTINEL_SHARED_SECRET missing in BFF env" } };
    }
    const body = req.body || "{}";
    const upstream = await proxySigned("/check", "POST", SENTINEL_SECRET, body);
    return { status: upstream.status, data: upstream.json };
  }

  if (path === "/api/rescue" && method === "POST") {
    if (!SENTINEL_SECRET) {
      return { status: 500, data: { error: "SENTINEL_SHARED_SECRET missing in BFF env" } };
    }
    const body = req.body || "{}";
    const upstream = await proxySigned("/rescue", "POST", SENTINEL_SECRET, body);
    return { status: upstream.status, data: upstream.json };
  }

  if (path === "/api/executions" && method === "GET") {
    if (!OBSERVER_SECRET) {
      return { status: 500, data: { error: "PRIMARY_OBSERVER_SHARED_SECRET missing" } };
    }
    const qs = req.search || "";
    const upstream = await proxySigned(`/v1/executions${qs}`, "GET", OBSERVER_SECRET, "");
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

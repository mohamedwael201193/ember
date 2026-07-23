/**
 * Vercel serverless BFF (single-file, no local imports).
 * Local BFF continues to use api/bff-core.ts via server/bff.ts.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, createHmac, randomBytes } from "node:crypto";

export const config = { maxDuration: 60 };

const bundledPayday = {"version":1,"verifiedAt":"2026-07-23T01:13:19.765Z","chainId":8453,"network":"mainnet","continuity":"0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770","missionId":"1","missionStartAt":1784768419,"workflowId":"5goaid2zjgzyb32661se3","slots":[{"slot":1784768419,"executionId":"667ekg3qk5f45127eqjyy","transactionHash":"0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2","explorer":"https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2","confirmations":3},{"slot":1784768719,"executionId":"pmxyj7low2i06bne6j1bt","transactionHash":"0xeb670541f1646dc55e2403d97ba683c7f325c7e38161b1c415da5e8b5bb86888","explorer":"https://basescan.org/tx/0xeb670541f1646dc55e2403d97ba683c7f325c7e38161b1c415da5e8b5bb86888","confirmations":3},{"slot":1784769019,"executionId":"0i0pqz1u7xc5act9agvwa","transactionHash":"0x9288d13aa65976b2fb996b4764be4ab098f22631094a28a5e5f8ea6e36b9eec3","explorer":"https://basescan.org/tx/0x9288d13aa65976b2fb996b4764be4ab098f22631094a28a5e5f8ea6e36b9eec3","confirmations":3}],"balances":{"orgA":"0.02","orgB":"0.12","employee":"0.03","continuity":"1"},"pass":true} as const;
const bundledRescue = {"status":200,"journal":{"version":1,"missionId":"1","rescueId":"3262643f2b4bec156242871d919663ceaec7696ed29cd63ffe02a59dcb4a7169","status":"COMPLETED","createdAt":"2026-07-23T01:23:05.644Z","updatedAt":"2026-07-23T01:32:49.602Z","workflowHashExpected":"0x0ccdc52804ea95ce83e7990b8b8e6a66c42b717c30a88a05248cf95310dd30e2","unpaidSlots":[1784769319,1784769619],"replayIntents":[{"slot":1784769319,"idempotencyKey":"ember-replay-1-1784769319","state":"CONFIRMED","executionId":"tjab2kqsitnwsfbr6e9ra","txHash":"0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41"},{"slot":1784769619,"idempotencyKey":"ember-replay-1-1784769619","state":"CONFIRMED","executionId":"xoratkk2crlscz57ma1fr","txHash":"0x83f721bfbafc20ba4327d2a955afd05db9ec7d063e41ae0484c851edf0c15432"}],"replays":[{"slot":1784769319,"executionId":"tjab2kqsitnwsfbr6e9ra","txHash":"0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41"},{"slot":1784769619,"executionId":"xoratkk2crlscz57ma1fr","txHash":"0x83f721bfbafc20ba4327d2a955afd05db9ec7d063e41ae0484c851edf0c15432"}],"stepsCompleted":["hash_check","ensure_replay_workflow","classify","replay","proof_scaffold","proof_ipfs_verified","proof_anchored","done"],"workflowHashComputed":"0x0ccdc52804ea95ce83e7990b8b8e6a66c42b717c30a88a05248cf95310dd30e2","replayWorkflowId":"pvhwggqr8318wac68jb62","proofHash":"0x61206b518afc1a501054276fe3b55bf0596efa549ad569e095eda45d5501460c","proofFeeMode":"ESCROW_FALLBACK","proofSha256":"61206b518afc1a501054276fe3b55bf0596efa549ad569e095eda45d5501460c","proofCid":"QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn","proofIpfsUri":"ipfs://QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn","anchorRescueId":"0xb03a3e55ec7303090c4148bcedd1f4a033c8647eee9ebb18875c436859817d04","anchorIdempotencyKey":"ember-anchor-1-3262643f2b4bec156242871d919663ceaec7696ed29cd63ffe02a59dcb4a7169-mainnet8453","anchorExecutionId":"04hqz6i716c0soebv5n3p","anchorTxHash":"0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f"},"pass":true} as const;

function runtimeUrl(): string {
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

async function proxySigned(path: string, method: string, secret: string, body = "{}") {
  const headers = hmacHeaders(secret, body);
  if (method === "GET") delete headers["content-type"];
  const res = await fetch(`${runtimeUrl()}${path}`, {
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
  const res = await fetch(`${runtimeUrl()}${path}`);
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
  const path = req.pathname.replace(/\/+$/, "") || "/";
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
    const upstream = await proxySigned(`/v1/executions${req.search || ""}`, "GET", OBSERVER_SECRET, "");
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
    const rawUrl = typeof req.url === "string" ? req.url : "/api";
    const pathname = new URL(rawUrl, "http://vercel.local").pathname.replace(/\/+$/, "") || "/api";
    let body = "";
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      if (typeof req.body === "string") body = req.body || "{}";
      else if (req.body != null) body = JSON.stringify(req.body);
      else body = "{}";
    }
    const search =
      typeof req.url === "string" && req.url.includes("?")
        ? `?${req.url.split("?")[1]}`
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

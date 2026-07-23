import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import type { Address } from "viem";
import {
  HMAC_BODY_SHA256_HEADER,
  HMAC_NONCE_HEADER,
  HMAC_SIGNATURE_HEADER,
  HMAC_TIMESTAMP_HEADER,
  FixedWindowRateLimiter,
  InMemoryNonceStore,
  RequestBodyTooLargeError,
  bodySha256Hex,
  deriveRescueId,
  loadSentinelEnv,
  readRequestBody,
  requestClientKey,
  resolveActiveNetworkConfig,
  signHmac,
  verifyHmac
} from "@ember/mission-core";
import { detectMissionHealth, type ExecutionSummary } from "./detector.js";
import { expectedTransferFromEnv, verifyExecutionPayments } from "./payments.js";
import { classifyUnpaid, runRescue } from "./rescue.js";

const sentinelKeys = [
  "KH_API_BASE",
  "KH_MCP_URL",
  "KH_API_KEY_STANDBY",
  "KH_ORG_B_W2_WORKFLOW_ID",
  "KH_ORG_B_W3_WORKFLOW_ID",
  "SENTINEL_SHARED_SECRET",
  "SENTINEL_PORT",
  "PORT",
  "SENTINEL_PUBLIC_URL",
  "MISSION_START_AT",
  "MISSION_ID_SEPOLIA",
  "MISSION_ID_MAINNET",
  "CONTINUITY_ADDRESS_SEPOLIA",
  "CONTINUITY_ADDRESS_MAINNET",
  "CADENCE_SECONDS",
  "GRACE_MISSED_RUNS",
  "CLOCK_SKEW_SECONDS",
  "PAYMENT_AMOUNT_USDC",
  "PAYROLL_BUDGET_USDC",
  "ESCROW_FUND_USDC",
  "MAINNET_TOTAL_SPEND_CAP_USDC",
  "SENTINEL_POLL_SECONDS",
  "RECEIPT_CONFIRMATIONS",
  "MAX_REPLAY_SLOTS",
  "X402_FEE_USDC",
  "X402_MAX_FEE_USDC",
  "EMBER_NETWORK",
  "CHAIN_ID_MAINNET",
  "CHAIN_ID_REHEARSAL",
  "BASE_RPC_URL",
  "BASE_RPC_URL_FALLBACK",
  "BASE_SEPOLIA_RPC_URL",
  "BASE_SEPOLIA_RPC_URL_FALLBACK",
  "USDC_ADDRESS_BASE",
  "USDC_ADDRESS_BASE_SEPOLIA",
  "WORKFLOW_HASH_SEPOLIA",
  "WORKFLOW_HASH_MAINNET",
  "LOG_LEVEL",
  "PRIMARY_OBSERVER_URL",
  "PRIMARY_OBSERVER_SHARED_SECRET",
  "SENTINEL_SELF_POLL",
  "RESCUE_JOURNAL_DIR",
  "PROOF_ANCHOR_ENABLE",
  "PINATA_JWT",
  "IPFS_GATEWAY",
  "W1_CANONICAL_PATH",
  "KH_ORG_B_W1_REPLAY_WORKFLOW_ID",
  "ORG_A_WALLET_ADDRESS",
  "ORG_B_WALLET_ADDRESS",
  "ORG_B_WALLET_INTEGRATION_ID",
  "EMPLOYEE_ADDRESS"
] as const;

const env = loadSentinelEnv(Object.fromEntries(sentinelKeys.map((key) => [key, process.env[key]])));
const activeNetwork = resolveActiveNetworkConfig(
  Object.fromEntries(sentinelKeys.map((key) => [key, process.env[key]]))
);
const nonceStore = new InMemoryNonceStore();
const observerResponseNonceStore = new InMemoryNonceStore();
const requestLimiter = new FixedWindowRateLimiter(60, 60_000);
const observerUrlValue = process.env.PRIMARY_OBSERVER_URL ?? "http://127.0.0.1:8788";
const observerUrl = /^https?:\/\//i.test(observerUrlValue)
  ? observerUrlValue
  : `http://${observerUrlValue}`;
const observerSecret = process.env.PRIMARY_OBSERVER_SHARED_SECRET ?? "";
const selfPollEnabled = (process.env.SENTINEL_SELF_POLL ?? "0") === "1";
const proofAnchorEnabled = (process.env.PROOF_ANCHOR_ENABLE ?? "0") === "1";
const journalDir = process.env.RESCUE_JOURNAL_DIR || "./runtime/rescues";
let shuttingDown = false;
let checksTotal = 0;
let checkFailuresTotal = 0;
let rescuesTotal = 0;

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function log(level: "info" | "error", event: string, detail: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    level,
    service: "sentinel",
    event,
    ...detail
  });
  (level === "error" ? console.error : console.log)(line);
}

function authorized(request: IncomingMessage, body: string): boolean {
  const timestamp = Number(request.headers[HMAC_TIMESTAMP_HEADER]);
  const nonce = request.headers[HMAC_NONCE_HEADER];
  const bodyHash = request.headers[HMAC_BODY_SHA256_HEADER];
  const signature = request.headers[HMAC_SIGNATURE_HEADER];
  return (
    typeof nonce === "string" &&
    typeof bodyHash === "string" &&
    typeof signature === "string" &&
    verifyHmac(
      env.SENTINEL_SHARED_SECRET,
      { timestamp, nonce, bodyHash, signature },
      body,
      nonceStore
    )
  );
}

async function fetchObserverExecutions(): Promise<ExecutionSummary[]> {
  if (!observerSecret) throw new Error("PRIMARY_OBSERVER_SHARED_SECRET missing for sentinel");
  const body = "";
  const timestamp = Date.now();
  const nonce = randomUUID();
  const bodyHash = bodySha256Hex(body);
  const signature = signHmac(observerSecret, timestamp, nonce, body);
  const response = await fetch(`${observerUrl.replace(/\/$/, "")}/v1/executions`, {
    method: "GET",
    signal: AbortSignal.timeout(65_000),
    headers: {
      [HMAC_TIMESTAMP_HEADER]: String(timestamp),
      [HMAC_NONCE_HEADER]: nonce,
      [HMAC_BODY_SHA256_HEADER]: bodyHash,
      [HMAC_SIGNATURE_HEADER]: signature
    }
  });
  if (!response.ok) {
    throw new Error(`observer HTTP ${response.status}`);
  }
  const responseBody = await response.text();
  if (Buffer.byteLength(responseBody) > 5_242_880) throw new Error("observer response too large");
  const responseTimestamp = Number(response.headers.get(HMAC_TIMESTAMP_HEADER));
  const responseNonce = response.headers.get(HMAC_NONCE_HEADER);
  const responseHash = response.headers.get(HMAC_BODY_SHA256_HEADER);
  const responseSignature = response.headers.get(HMAC_SIGNATURE_HEADER);
  if (
    !responseNonce ||
    !responseHash ||
    !responseSignature ||
    !verifyHmac(
      observerSecret,
      {
        timestamp: responseTimestamp,
        nonce: responseNonce,
        bodyHash: responseHash,
        signature: responseSignature
      },
      responseBody,
      observerResponseNonceStore
    )
  ) {
    throw new Error("observer response signature invalid");
  }
  const payload = JSON.parse(responseBody) as { executions?: ExecutionSummary[] };
  return payload.executions ?? [];
}

function baseStatus():
  | {
      ready: false;
      reason:
        | "continuity_address_not_configured"
        | "mission_start_missing"
        | "proof_configuration_missing";
    }
  | { ready: true; continuityAddress: string; missionStartAt: number } {
  const continuityAddress = activeNetwork.continuityAddress;
  if (!continuityAddress) return { ready: false, reason: "continuity_address_not_configured" };
  const missionStartAt = env.MISSION_START_AT;
  if (missionStartAt === undefined) return { ready: false, reason: "mission_start_missing" };
  if (
    proofAnchorEnabled &&
    (!process.env.KH_MCP_URL || !process.env.PINATA_JWT || !process.env.IPFS_GATEWAY)
  ) {
    return { ready: false, reason: "proof_configuration_missing" };
  }
  return { ready: true, continuityAddress, missionStartAt };
}

async function verifyPaidTimes(executions: ExecutionSummary[]): Promise<{
  verifiedPaymentTimes: number[];
  verifiedCount: number;
}> {
  const usdc = activeNetwork.usdcAddress;
  const orgA = process.env.ORG_A_WALLET_ADDRESS;
  const employee = process.env.EMPLOYEE_ADDRESS;
  if (!usdc || !orgA || !employee) throw new Error("missing_transfer_addresses");
  const expected = expectedTransferFromEnv({
    USDC_ADDRESS_BASE_SEPOLIA: usdc,
    ORG_A_WALLET_ADDRESS: orgA,
    EMPLOYEE_ADDRESS: employee,
    PAYMENT_AMOUNT_USDC: env.PAYMENT_AMOUNT_USDC
  });
  const rpcUrl = activeNetwork.rpcUrls[0];
  if (!rpcUrl) throw new Error("missing_rpc_url");
  const fallback = activeNetwork.rpcUrls[1];
  const verified = await verifyExecutionPayments({
    rpcUrl,
    ...(fallback ? { rpcFallbackUrl: fallback } : {}),
    executions,
    expected,
    minConfirmations: env.RECEIPT_CONFIRMATIONS,
    chainId: activeNetwork.chainId
  });
  return {
    verifiedPaymentTimes: verified.map((item) => item.blockTimestamp),
    verifiedCount: verified.length
  };
}

async function runCheck() {
  const configured = baseStatus();
  if (!configured.ready) {
    return { state: "WARMING_UP" as const, reason: configured.reason, missedSlots: [] as number[] };
  }
  const { continuityAddress, missionStartAt } = configured;
  checksTotal += 1;
  const executions = await fetchObserverExecutions();
  const { verifiedPaymentTimes, verifiedCount } = await verifyPaidTimes(executions);
  const detection = detectMissionHealth({
    nowSeconds: Math.floor(Date.now() / 1_000),
    startAt: missionStartAt,
    cadenceSeconds: env.CADENCE_SECONDS,
    graceMissedRuns: env.GRACE_MISSED_RUNS,
    clockSkewSeconds: env.CLOCK_SKEW_SECONDS,
    executions,
    verifiedPaymentTimes
  });
  return {
    missionId: activeNetwork.missionId ?? null,
    network: activeNetwork.network,
    chainId: activeNetwork.chainId,
    continuityAddress,
    checkedAt: new Date().toISOString(),
    executionSampleSize: executions.length,
    receiptVerifiedPayments: verifiedCount,
    receiptBacked: true,
    ...detection
  };
}

async function handleRescue(body: string) {
  const configured = baseStatus();
  if (!configured.ready) {
    throw new Error(configured.reason);
  }
  let rescueId: string | undefined;
  let dryRun = false;
  let maxReplaySlots = env.MAX_REPLAY_SLOTS;
  if (body.trim()) {
    const parsed = JSON.parse(body) as {
      rescueId?: string;
      dryRun?: boolean;
      maxReplaySlots?: number;
    };
    if (parsed.rescueId) {
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(parsed.rescueId)) throw new Error("invalid_rescue_id");
      rescueId = parsed.rescueId;
    }
    dryRun = Boolean(parsed.dryRun);
    if (
      typeof parsed.maxReplaySlots === "number" &&
      Number.isSafeInteger(parsed.maxReplaySlots) &&
      parsed.maxReplaySlots >= 1
    ) {
      maxReplaySlots = Math.min(parsed.maxReplaySlots, env.MAX_REPLAY_SLOTS);
    }
  }
  const missionId = activeNetwork.missionId ?? "1";
  const workflowHash = activeNetwork.workflowHash;
  if (!workflowHash) throw new Error("workflow hash missing for active network");
  if (!env.KH_API_BASE || !env.KH_API_KEY_STANDBY)
    throw new Error("standby_kh_credentials_missing");

  const orgA = process.env.ORG_A_WALLET_ADDRESS as Address | undefined;
  const orgB = process.env.ORG_B_WALLET_ADDRESS as Address | undefined;
  const employee = process.env.EMPLOYEE_ADDRESS as Address | undefined;
  const usdc = activeNetwork.usdcAddress as Address | undefined;
  const integrationId = process.env.ORG_B_WALLET_INTEGRATION_ID;
  if (!orgA || !orgB || !employee || !usdc || !integrationId) {
    throw new Error("rescue_addresses_or_integration_missing");
  }

  const executions = await fetchObserverExecutions();
  const replayWorkflowId = process.env.KH_ORG_B_W1_REPLAY_WORKFLOW_ID;
  const rpcUrl = activeNetwork.rpcUrls[0];
  if (!rpcUrl) throw new Error("missing_rpc_url");
  const context = {
    missionId,
    rescueId: rescueId ?? "pending",
    journalDir,
    startAt: configured.missionStartAt,
    cadenceSeconds: env.CADENCE_SECONDS,
    clockSkewSeconds: env.CLOCK_SKEW_SECONDS,
    nowSeconds: Math.floor(Date.now() / 1_000),
    maxReplaySlots,
    workflowHashExpected: workflowHash,
    w1CanonicalPath:
      process.env.W1_CANONICAL_PATH ||
      resolve(
        process.cwd(),
        activeNetwork.network === "mainnet"
          ? "workflows/w1-payday-stream.mainnet.json"
          : "workflows/w1-payday-stream.json"
      ),
    orgBIntegrationId: integrationId,
    employeeAddress: employee,
    usdcAddress: usdc,
    paymentAmountUsdc: env.PAYMENT_AMOUNT_USDC,
    orgAWallet: orgA,
    orgBWallet: orgB,
    rpcUrl,
    ...(activeNetwork.rpcUrls[1] ? { rpcFallbackUrl: activeNetwork.rpcUrls[1] } : {}),
    receiptConfirmations: env.RECEIPT_CONFIRMATIONS,
    chainId: activeNetwork.chainId,
    khBaseUrl: env.KH_API_BASE,
    khApiKeyStandby: env.KH_API_KEY_STANDBY,
    ...(process.env.KH_MCP_URL ? { khMcpUrl: process.env.KH_MCP_URL } : {}),
    proofAnchorEnabled,
    ...(process.env.PINATA_JWT ? { pinataJwt: process.env.PINATA_JWT } : {}),
    ...(process.env.IPFS_GATEWAY ? { ipfsGateway: process.env.IPFS_GATEWAY } : {}),
    continuityAddress: configured.continuityAddress as Address,
    ...(replayWorkflowId ? { replayWorkflowId } : {}),
    executions,
    dryRun
  };
  let preclassifiedUnpaidSlots: number[] | undefined;
  if (!rescueId) {
    preclassifiedUnpaidSlots = await classifyUnpaid(context);
    if (preclassifiedUnpaidSlots.length === 0) throw new Error("no_missed_slots");
    rescueId = deriveRescueId(missionId, preclassifiedUnpaidSlots);
  }
  return runRescue({
    ...context,
    rescueId,
    ...(preclassifiedUnpaidSlots ? { preclassifiedUnpaidSlots } : {})
  });
}

const port = env.SENTINEL_PORT ?? env.PORT ?? 8787;
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/healthz" && request.method === "GET") {
    json(response, 200, { ok: true, service: "sentinel" });
    return;
  }
  if (pathname === "/status" && request.method === "GET") {
    json(response, 200, baseStatus());
    return;
  }
  if (pathname === "/readyz" && request.method === "GET") {
    const status = baseStatus();
    const ready = !shuttingDown && status.ready && Boolean(observerSecret);
    json(response, ready ? 200 : 503, { ready });
    return;
  }
  if (pathname === "/metrics" && request.method === "GET") {
    const current = baseStatus();
    response.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" });
    response.end(
      [
        `ember_sentinel_configured ${current.ready ? 1 : 0}`,
        `ember_sentinel_checks_total ${checksTotal}`,
        `ember_sentinel_check_failures_total ${checkFailuresTotal}`,
        `ember_sentinel_rescues_total ${rescuesTotal}`
      ].join("\n") + "\n"
    );
    return;
  }

  if (pathname === "/rescue") {
    if (request.method !== "POST") {
      response.setHeader("allow", "POST");
      json(response, 405, { error: "method_not_allowed" });
      return;
    }
    const rate = requestLimiter.consume(requestClientKey(request));
    if (!rate.allowed) {
      response.setHeader("retry-after", String(rate.retryAfterSeconds));
      json(response, 429, { error: "rate_limited" });
      return;
    }
    let body: string;
    try {
      body = await readRequestBody(request, 65_536);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        json(response, 413, { error: "request_too_large" });
        return;
      }
      throw error;
    }
    if (!authorized(request, body)) {
      json(response, 401, { error: "unauthorized" });
      return;
    }
    try {
      const result = await handleRescue(body);
      rescuesTotal += 1;
      json(response, 200, result);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const status = detail === "rescue_lock_held" ? 409 : 502;
      log("error", "rescue_failed", { detail });
      json(response, status, { error: "rescue_failed" });
    }
    return;
  }

  if (pathname !== "/check") {
    json(response, 404, { error: "not_found" });
    return;
  }
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    json(response, 405, { error: "method_not_allowed" });
    return;
  }
  const rate = requestLimiter.consume(requestClientKey(request));
  if (!rate.allowed) {
    response.setHeader("retry-after", String(rate.retryAfterSeconds));
    json(response, 429, { error: "rate_limited" });
    return;
  }
  let body: string;
  try {
    body = await readRequestBody(request, 65_536);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      json(response, 413, { error: "request_too_large" });
      return;
    }
    throw error;
  }
  if (!authorized(request, body)) {
    json(response, 401, { error: "unauthorized" });
    return;
  }

  try {
    json(response, 200, await runCheck());
  } catch (error) {
    checkFailuresTotal += 1;
    log("error", "check_failed", {
      detail: error instanceof Error ? error.message : String(error)
    });
    json(response, 502, { error: "check_failed" });
  }
}).listen(port, () => {
  log("info", "listening", { port });
  if (selfPollEnabled) {
    const intervalMs = env.SENTINEL_POLL_SECONDS * 1_000;
    log("info", "self_poll_enabled", { intervalSeconds: env.SENTINEL_POLL_SECONDS });
    const tick = async () => {
      try {
        const result = await runCheck();
        log("info", "self_poll_complete", {
          state: result.state,
          sample: "executionSampleSize" in result ? result.executionSampleSize : 0,
          receipts: "receiptVerifiedPayments" in result ? result.receiptVerifiedPayments : 0
        });
      } catch (error) {
        checkFailuresTotal += 1;
        log("error", "self_poll_failed", {
          detail: error instanceof Error ? error.message : String(error)
        });
      }
    };
    void tick();
    selfPollTimer = setInterval(() => void tick(), intervalMs);
  }
});

let selfPollTimer: NodeJS.Timeout | undefined;
server.requestTimeout = 190_000;
server.headersTimeout = 10_000;
server.keepAliveTimeout = 5_000;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  if (selfPollTimer) clearInterval(selfPollTimer);
  log("info", "shutdown_started", { signal });
  server.close((error) => {
    if (error) {
      log("error", "shutdown_failed", { detail: error.message });
      process.exitCode = 1;
    }
    log("info", "shutdown_complete");
  });
  setTimeout(() => {
    log("error", "shutdown_timeout");
    process.exit(1);
  }, 30_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

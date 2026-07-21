import { mkdir, open } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { join } from "node:path";
import { createKeeperHubClient } from "@ember/kh-client";
import { verifyPaymentWithRetry, type ExpectedTransfer } from "@ember/receipt-checker";
import {
  FixedWindowRateLimiter,
  bearerTokenMatches,
  loadPaydayEnv,
  requestClientKey,
  slotIndexAt
} from "@ember/mission-core";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";

const paydayKeys = [
  "KH_API_BASE",
  "KH_API_KEY_PRIMARY_EXECUTOR",
  "KH_ORG_A_W1_WORKFLOW_ID",
  "ORG_A_WALLET_ADDRESS",
  "EMPLOYEE_ADDRESS",
  "ORG_A_WALLET_INTEGRATION_ID",
  "MISSION_START_AT",
  "PAYMENT_AMOUNT_USDC",
  "PAYROLL_BUDGET_USDC",
  "ESCROW_FUND_USDC",
  "MAINNET_TOTAL_SPEND_CAP_USDC",
  "CADENCE_SECONDS",
  "GRACE_MISSED_RUNS",
  "SENTINEL_POLL_SECONDS",
  "CLOCK_SKEW_SECONDS",
  "RECEIPT_CONFIRMATIONS",
  "MAX_REPLAY_SLOTS",
  "X402_FEE_USDC",
  "X402_MAX_FEE_USDC",
  "CHAIN_ID_MAINNET",
  "CHAIN_ID_REHEARSAL",
  "BASE_RPC_URL",
  "BASE_RPC_URL_FALLBACK",
  "BASE_SEPOLIA_RPC_URL",
  "USDC_ADDRESS_BASE",
  "USDC_ADDRESS_BASE_SEPOLIA",
  "CONTINUITY_ADDRESS_SEPOLIA",
  "CONTINUITY_ADDRESS_MAINNET",
  "MISSION_ID_SEPOLIA",
  "MISSION_ID_MAINNET",
  "WORKFLOW_HASH_SEPOLIA",
  "WORKFLOW_HASH_MAINNET",
  "LOG_LEVEL",
  "RESCUE_JOURNAL_DIR",
  "PAYDAY_ENABLE",
  "PAYDAY_CONTROL_TOKEN",
  "PAYDAY_PORT",
  "PORT"
] as const;

const env = loadPaydayEnv(Object.fromEntries(paydayKeys.map((key) => [key, process.env[key]])));
const journalDirectory = env.RESCUE_JOURNAL_DIR || "./runtime/payday";
const cadenceEnabled = env.PAYDAY_ENABLE === "1";
const workflowId = env.KH_ORG_A_W1_WORKFLOW_ID;
const controlToken = env.PAYDAY_CONTROL_TOKEN;
const runOnceLimiter = new FixedWindowRateLimiter(5, 60_000);
let tickInFlight = false;
let successfulRuns = 0;
let failedRuns = 0;
let shuttingDown = false;
const kh = createKeeperHubClient({
  baseUrl: env.KH_API_BASE,
  apiKey: env.KH_API_KEY_PRIMARY_EXECUTOR,
  timeoutMs: 90_000
});

async function journal(record: Record<string, unknown>): Promise<void> {
  await mkdir(journalDirectory, { recursive: true });
  const file = await open(join(journalDirectory, "payday.ndjson"), "a");
  try {
    await file.writeFile(`${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`);
    await file.sync();
  } finally {
    await file.close();
  }
}

async function waitForTerminal(
  executionId: string,
  timeoutMs = 180_000
): Promise<{
  status: string;
  transactionHashes: string[];
}> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await kh.workflows.waitForExecution(executionId, 30_000);
    if (
      result.completed ||
      ["success", "error", "cancelled", "failed"].includes(result.status.toLowerCase())
    ) {
      return {
        status: result.status,
        transactionHashes: (result.transactionHashes ?? [])
          .map((entry) => entry.hash)
          .filter(Boolean)
      };
    }
  }
  throw new Error(`execution ${executionId} timed out`);
}

async function verifyTerminalPayment(transactionHash: string): Promise<void> {
  const token = env.USDC_ADDRESS_BASE_SEPOLIA;
  const from = env.ORG_A_WALLET_ADDRESS;
  const to = env.EMPLOYEE_ADDRESS;
  const rpcUrls = [env.BASE_SEPOLIA_RPC_URL, env.BASE_SEPOLIA_RPC_URL_FALLBACK].filter(
    (value): value is string => Boolean(value)
  );
  if (!token || !from || !to || rpcUrls.length === 0) {
    throw new Error("PAYDAY receipt verification configuration is incomplete");
  }
  const expected: ExpectedTransfer = {
    token: token as Address,
    from: from as Address,
    to: to as Address,
    amount: BigInt(env.PAYMENT_AMOUNT_USDC)
  };
  const result = await verifyPaymentWithRetry({
    clients: rpcUrls.map((url) => createPublicClient({ chain: baseSepolia, transport: http(url) })),
    hash: transactionHash as Hex,
    expected,
    minConfirmations: env.RECEIPT_CONFIRMATIONS
  });
  if (!result.ok) throw new Error(`W1 receipt verification failed: ${result.reason}`);
}

async function cadenceTick(): Promise<void> {
  if (tickInFlight) {
    await journal({ event: "cadence_skipped", reason: "tick_in_flight" });
    return;
  }
  if (!workflowId) {
    await journal({ event: "cadence_skipped", reason: "missing_w1_workflow_id" });
    return;
  }
  if (!env.MISSION_START_AT) throw new Error("MISSION_START_AT is required for slot idempotency");
  const nowSeconds = Math.floor(Date.now() / 1_000);
  const slotIndex = slotIndexAt(env.MISSION_START_AT, env.CADENCE_SECONDS, nowSeconds);
  if (slotIndex === undefined) {
    await journal({ event: "cadence_skipped", reason: "mission_not_started" });
    return;
  }
  const slot = env.MISSION_START_AT + slotIndex * env.CADENCE_SECONDS;
  const idempotencyKey = `ember-payday-${env.MISSION_ID_SEPOLIA ?? "mission"}-${slot}`;
  tickInFlight = true;
  try {
    await journal({ event: "invoke_begin", workflowId, slot, idempotencyKey });
    const started = await kh.workflows.execute(workflowId, { slot }, { idempotencyKey });
    await journal({
      event: "invoke_accepted",
      workflowId,
      slot,
      executionId: started.executionId,
      status: started.status
    });
    const terminal = await waitForTerminal(started.executionId);
    await journal({
      event: "invoke_complete",
      workflowId,
      slot,
      executionId: started.executionId,
      status: terminal.status,
      transactionHashes: terminal.transactionHashes
    });
    if (terminal.status.toLowerCase() !== "success") {
      throw new Error(`W1 execution ${started.executionId} ended with status ${terminal.status}`);
    }
    const transactionHash = terminal.transactionHashes[0];
    if (!transactionHash)
      throw new Error(`W1 execution ${started.executionId} has no transaction hash`);
    await verifyTerminalPayment(transactionHash);
    await journal({
      event: "receipt_verified",
      workflowId,
      slot,
      executionId: started.executionId,
      transactionHash,
      confirmations: env.RECEIPT_CONFIRMATIONS
    });
    successfulRuns += 1;
  } catch (error) {
    failedRuns += 1;
    throw error;
  } finally {
    tickInFlight = false;
  }
}

function log(level: "info" | "error", event: string, detail: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    level,
    service: "payday",
    event,
    ...detail
  });
  (level === "error" ? console.error : console.log)(line);
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body));
}

async function guardedTick(): Promise<void> {
  try {
    await cadenceTick();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("error", "cadence_tick_failed", { message });
    await journal({ event: "invoke_error", error: message });
  }
}

let cadenceTimer: NodeJS.Timeout | undefined;
if (cadenceEnabled) {
  void guardedTick();
  cadenceTimer = setInterval(() => void guardedTick(), env.CADENCE_SECONDS * 1_000);
}

const port = env.PAYDAY_PORT ?? env.PORT ?? 8789;
const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/healthz" && request.method === "GET") {
    json(response, 200, { ok: true, service: "payday" });
    return;
  }
  if (pathname === "/readyz" && request.method === "GET") {
    const receiptConfigured = Boolean(
      env.BASE_SEPOLIA_RPC_URL &&
      env.USDC_ADDRESS_BASE_SEPOLIA &&
      env.ORG_A_WALLET_ADDRESS &&
      env.EMPLOYEE_ADDRESS
    );
    const ready =
      !shuttingDown &&
      Boolean(workflowId) &&
      (!cadenceEnabled || (Boolean(env.MISSION_START_AT) && receiptConfigured));
    json(response, ready ? 200 : 503, {
      ready,
      cadenceEnabled,
      workflowConfigured: Boolean(workflowId)
    });
    return;
  }
  if (pathname === "/metrics" && request.method === "GET") {
    response.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" });
    response.end(
      [
        `ember_payday_ready ${!shuttingDown && Boolean(workflowId) ? 1 : 0}`,
        `ember_payday_tick_in_flight ${tickInFlight ? 1 : 0}`,
        `ember_payday_runs_total{result="success"} ${successfulRuns}`,
        `ember_payday_runs_total{result="failure"} ${failedRuns}`
      ].join("\n") + "\n"
    );
    return;
  }
  if (pathname === "/run-once" && request.method === "POST") {
    if (!controlToken) {
      json(response, 404, { error: "not_found" });
      return;
    }
    const rate = runOnceLimiter.consume(requestClientKey(request));
    if (!rate.allowed) {
      response.setHeader("retry-after", String(rate.retryAfterSeconds));
      json(response, 429, { error: "rate_limited" });
      return;
    }
    const authorization =
      typeof request.headers.authorization === "string" ? request.headers.authorization : undefined;
    if (!bearerTokenMatches(controlToken, authorization)) {
      json(response, 401, { error: "unauthorized" });
      return;
    }
    void cadenceTick()
      .then(() => {
        json(response, 200, { ok: true });
      })
      .catch((error: unknown) => {
        log("error", "manual_run_failed", {
          message: error instanceof Error ? error.message : String(error)
        });
        json(response, 502, { ok: false, error: "execution_failed" });
      });
    return;
  }
  json(response, 404, { error: "not_found" });
}).listen(port, () => {
  log("info", "listening", { port, cadenceEnabled, manualControlEnabled: Boolean(controlToken) });
});

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  if (cadenceTimer) clearInterval(cadenceTimer);
  log("info", "shutdown_started", { signal });
  server.close((error) => {
    if (error) {
      log("error", "shutdown_failed", { message: error.message });
      process.exitCode = 1;
    }
    log("info", "shutdown_complete");
  });
  setTimeout(() => {
    log("error", "shutdown_timeout");
    process.exit(1);
  }, 15_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

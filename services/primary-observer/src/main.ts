import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import {
  HMAC_BODY_SHA256_HEADER,
  HMAC_NONCE_HEADER,
  HMAC_SIGNATURE_HEADER,
  HMAC_TIMESTAMP_HEADER,
  FixedWindowRateLimiter,
  InMemoryNonceStore,
  RequestBodyTooLargeError,
  readRequestBody,
  requestClientKey,
  loadObserverEnv,
  signHmac,
  verifyHmac,
  bodySha256Hex
} from "@ember/mission-core";
import { createKeeperHubClient } from "@ember/kh-client";

const observerKeys = [
  "KH_API_BASE",
  "KH_API_KEY_PRIMARY_OBSERVER",
  "KH_ORG_A_W1_WORKFLOW_ID",
  "PRIMARY_OBSERVER_SHARED_SECRET",
  "PRIMARY_OBSERVER_PORT",
  "PORT",
  "PRIMARY_OBSERVER_PUBLIC_URL"
] as const;

const env = loadObserverEnv(Object.fromEntries(observerKeys.map((key) => [key, process.env[key]])));
const nonceStore = new InMemoryNonceStore();
const requestLimiter = new FixedWindowRateLimiter(120, 60_000);
let shuttingDown = false;
const kh = createKeeperHubClient({
  baseUrl: env.KH_API_BASE,
  apiKey: env.KH_API_KEY_PRIMARY_OBSERVER,
  timeoutMs: 60_000
});

function json(
  response: ServerResponse,
  status: number,
  body: unknown,
  serviceSignature?: string
): void {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  };
  if (serviceSignature) headers["x-ember-service-signature"] = serviceSignature;
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function log(level: "info" | "error", event: string, detail: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    level,
    service: "primary-observer",
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
      env.PRIMARY_OBSERVER_SHARED_SECRET,
      { timestamp, nonce, bodyHash, signature },
      body,
      nonceStore
    )
  );
}

const port = env.PRIMARY_OBSERVER_PORT ?? env.PORT ?? 8788;
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/healthz" && request.method === "GET") {
    json(response, 200, { ok: true, service: "primary-observer" });
    return;
  }
  if (pathname === "/readyz" && request.method === "GET") {
    const ready = !shuttingDown && Boolean(env.KH_ORG_A_W1_WORKFLOW_ID);
    json(response, ready ? 200 : 503, {
      ready,
      workflowConfigured: Boolean(env.KH_ORG_A_W1_WORKFLOW_ID)
    });
    return;
  }
  if (pathname === "/metrics" && request.method === "GET") {
    response.writeHead(200, { "content-type": "text/plain; version=0.0.4; charset=utf-8" });
    response.end(
      `ember_primary_observer_ready ${!shuttingDown && env.KH_ORG_A_W1_WORKFLOW_ID ? 1 : 0}\n`
    );
    return;
  }

  if (pathname !== "/v1/executions") {
    json(response, 404, { error: "not_found" });
    return;
  }
  if (request.method !== "GET") {
    response.setHeader("allow", "GET");
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
    body = await readRequestBody(request, 1_024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      json(response, 413, { error: "request_too_large" });
      return;
    }
    throw error;
  }
  if (!authorized(request, body.length > 0 ? body : "")) {
    json(response, 401, { error: "unauthorized" });
    return;
  }
  if (!env.KH_ORG_A_W1_WORKFLOW_ID) {
    json(response, 503, { error: "workflow_not_configured" });
    return;
  }

  const requestId = randomUUID();
  try {
    const executions = await kh.workflows.listExecutions(env.KH_ORG_A_W1_WORKFLOW_ID);
    const payload = {
      requestId,
      workflowId: env.KH_ORG_A_W1_WORKFLOW_ID,
      fetchedAt: new Date().toISOString(),
      executions
    };
    const serialized = JSON.stringify(payload);
    if (Buffer.byteLength(serialized) > 5_242_880) {
      json(response, 502, { requestId, error: "keeperhub_response_too_large" });
      return;
    }
    const responseTimestamp = Date.now();
    const serviceSignature = signHmac(
      env.PRIMARY_OBSERVER_SHARED_SECRET,
      responseTimestamp,
      requestId,
      serialized
    );
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-ember-request-id": requestId,
      "x-ember-service-signature": serviceSignature,
      [HMAC_TIMESTAMP_HEADER]: String(responseTimestamp),
      [HMAC_NONCE_HEADER]: requestId,
      [HMAC_BODY_SHA256_HEADER]: bodySha256Hex(serialized),
      [HMAC_SIGNATURE_HEADER]: serviceSignature
    });
    response.end(serialized);
  } catch (error) {
    log("error", "keeperhub_request_failed", {
      requestId,
      message: error instanceof Error ? error.message : String(error)
    });
    json(response, 502, {
      requestId,
      error: "keeperhub_unavailable"
    });
  }
}).listen(port, () => {
  log("info", "listening", { port });
});

server.requestTimeout = 65_000;
server.headersTimeout = 10_000;
server.keepAliveTimeout = 5_000;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
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

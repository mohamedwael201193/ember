#!/usr/bin/env node
/**
 * Lightweight local runtime for DEVELOPMENT_MODE.
 * Serves the same public paths the BFF expects on EMBER_RUNTIME_URL.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, applyEnv, loadEnvFile } from "./lib/common.mjs";

applyEnv(loadEnvFile());

const PORT = Number(process.env.PORT || 10000);

function readFixture(name, fallback) {
  const path = resolve(ROOT, "fixtures/dev", name);
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

const evidence = readFixture("sample-evidence.json", {});
const snapshot = readFixture("sample-snapshot.json", {});

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "content-type,authorization,x-ember-timestamp,x-ember-nonce,x-ember-body-sha256,x-ember-signature",
      "access-control-allow-methods": "GET,POST,OPTIONS"
    });
    res.end();
    return;
  }

  if (path === "/healthz") {
    return send(res, 200, {
      ok: true,
      service: "ember-runtime",
      mode: "development",
      children: { observer: true, payday: true, sentinel: true }
    });
  }
  if (path === "/readyz") {
    return send(res, 200, { ok: true, mode: "development" });
  }
  if (path === "/status") {
    return send(res, 200, snapshot.status || { state: "RECOVERED", mode: "development" });
  }
  if (path === "/check" && req.method === "POST") {
    return send(res, 200, snapshot.check || { state: "RECOVERED", mode: "development" });
  }
  if (path === "/rescue" && req.method === "POST") {
    return send(res, 200, {
      ...(evidence.rescue || {}),
      mode: "development",
      dryRun: true
    });
  }
  if (path === "/v1/executions" || path.startsWith("/v1/executions")) {
    return send(res, 200, {
      mode: "development",
      items: (evidence.paydaySlots || []).map((slot) => ({
        id: slot.executionId,
        status: "SUCCEEDED",
        transactionHash: slot.transactionHash
      }))
    });
  }
  if (path === "/metrics") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("# HELP ember_dev 1\nember_dev_mode 1\n");
    return;
  }

  send(res, 404, { error: "not_found", path, mode: "development" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[dev-runtime] listening on http://127.0.0.1:${PORT} (DEVELOPMENT_MODE)`);
});

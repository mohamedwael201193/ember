#!/usr/bin/env node
/**
 * Single Render web process: run Observer + PAYDAY + Sentinel as children
 * and expose one public PORT with path-based routing.
 */
import { spawn } from "node:child_process";
import { createServer, request as httpRequest } from "node:http";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PUBLIC_PORT = Number(process.env.PORT || 10000);
const OBSERVER_PORT = Number(process.env.PRIMARY_OBSERVER_PORT || 8788);
const PAYDAY_PORT = Number(process.env.PAYDAY_PORT || 8789);
const SENTINEL_PORT = Number(process.env.SENTINEL_PORT || 8787);

const children = [];
let shuttingDown = false;

function log(level, msg, extra = {}) {
  console.log(JSON.stringify({ level, msg, service: "ember-runtime", ...extra, ts: new Date().toISOString() }));
}

function spawnService(name, entry, envExtra) {
  const child = spawn(process.execPath, [entry], {
    cwd: ROOT,
    env: {
      ...process.env,
      ...envExtra,
      // Children must not bind Render's public PORT.
      PORT: String(envExtra.PORT)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", (buf) => process.stdout.write(`[${name}] ${buf}`));
  child.stderr.on("data", (buf) => process.stderr.write(`[${name}] ${buf}`));
  child.on("exit", (code, signal) => {
    log("error", "child_exit", { name, code, signal });
    if (!shuttingDown) {
      shutdown("child_exit");
      process.exitCode = code || 1;
    }
  });
  children.push(child);
  return child;
}

function proxy(targetPort, req, res, rewritePath) {
  const headers = { ...req.headers, host: `127.0.0.1:${targetPort}` };
  const upstream = httpRequest(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      path: rewritePath ?? req.url,
      method: req.method,
      headers
    },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    }
  );
  upstream.on("error", (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "application/json" });
    }
    res.end(JSON.stringify({ error: "upstream_unavailable", message: error.message }));
  });
  req.pipe(upstream);
}

async function fetchJson(url, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

function routeTarget(pathname) {
  if (pathname.startsWith("/observer/")) {
    return { port: OBSERVER_PORT, path: pathname.slice("/observer".length) || "/" };
  }
  if (pathname.startsWith("/payday/")) {
    return { port: PAYDAY_PORT, path: pathname.slice("/payday".length) || "/" };
  }
  if (pathname.startsWith("/sentinel/")) {
    return { port: SENTINEL_PORT, path: pathname.slice("/sentinel".length) || "/" };
  }
  if (pathname === "/v1/executions" || pathname.startsWith("/v1/executions/")) {
    return { port: OBSERVER_PORT, path: pathname };
  }
  if (pathname === "/run-once") {
    return { port: PAYDAY_PORT, path: pathname };
  }
  if (
    pathname === "/check" ||
    pathname === "/rescue" ||
    pathname === "/status" ||
    pathname.startsWith("/check/") ||
    pathname.startsWith("/rescue/")
  ) {
    return { port: SENTINEL_PORT, path: pathname };
  }
  return null;
}

spawnService("observer", "services/primary-observer/dist/main.js", {
  PORT: String(OBSERVER_PORT),
  PRIMARY_OBSERVER_PORT: String(OBSERVER_PORT)
});
spawnService("payday", "services/payday/dist/main.js", {
  PORT: String(PAYDAY_PORT),
  PAYDAY_PORT: String(PAYDAY_PORT),
  RESCUE_JOURNAL_DIR: process.env.PAYDAY_JOURNAL_DIR || "/tmp/ember/payday"
});
spawnService("sentinel", "services/sentinel/dist/main.js", {
  PORT: String(SENTINEL_PORT),
  SENTINEL_PORT: String(SENTINEL_PORT),
  PRIMARY_OBSERVER_URL: `http://127.0.0.1:${OBSERVER_PORT}`,
  RESCUE_JOURNAL_DIR: process.env.RESCUE_JOURNAL_DIR || "/tmp/ember/rescues"
});

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;

  if (pathname === "/healthz" && req.method === "GET") {
    const [observer, payday, sentinel] = await Promise.all([
      fetchJson(`http://127.0.0.1:${OBSERVER_PORT}/healthz`),
      fetchJson(`http://127.0.0.1:${PAYDAY_PORT}/healthz`),
      fetchJson(`http://127.0.0.1:${SENTINEL_PORT}/healthz`)
    ]);
    const ok = observer.ok && payday.ok && sentinel.ok;
    res.writeHead(ok ? 200 : 503, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok,
        service: "ember-runtime",
        children: { observer: observer.ok, payday: payday.ok, sentinel: sentinel.ok }
      })
    );
    return;
  }

  if (pathname === "/readyz" && req.method === "GET") {
    const [observer, payday, sentinel] = await Promise.all([
      fetchJson(`http://127.0.0.1:${OBSERVER_PORT}/readyz`),
      fetchJson(`http://127.0.0.1:${PAYDAY_PORT}/readyz`),
      fetchJson(`http://127.0.0.1:${SENTINEL_PORT}/readyz`)
    ]);
    const ready = observer.ok && payday.ok && sentinel.ok;
    res.writeHead(ready ? 200 : 503, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ready,
        service: "ember-runtime",
        children: { observer: observer.ok, payday: payday.ok, sentinel: sentinel.ok }
      })
    );
    return;
  }

  if (pathname === "/metrics" && req.method === "GET") {
    // Prefer Sentinel metrics as the mission surface; include payday via prefix scrape.
    proxy(SENTINEL_PORT, req, res, "/metrics");
    return;
  }

  const target = routeTarget(pathname);
  if (!target) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not_found", service: "ember-runtime" }));
    return;
  }
  proxy(target.port, req, res, `${target.path}${new URL(req.url || "/", "http://localhost").search}`);
});

server.listen(PUBLIC_PORT, () => {
  log("info", "listening", {
    port: PUBLIC_PORT,
    observer: OBSERVER_PORT,
    payday: PAYDAY_PORT,
    sentinel: SENTINEL_PORT
  });
});

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log("info", "shutdown_started", { signal });
  server.close();
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

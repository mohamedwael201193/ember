#!/usr/bin/env node
/**
 * One-command local stack.
 * DEVELOPMENT_MODE=1 (default after pnpm setup):
 *   mock runtime + BFF + Vite + watcher
 * Live mode:
 *   built runtime + BFF + Vite + watcher
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, execSync } from "node:child_process";
import {
  ROOT,
  applyEnv,
  isDevMode,
  loadEnvFile,
  ensureDirs,
  checkNode,
  checkPnpm
} from "./lib/common.mjs";

applyEnv(loadEnvFile());
ensureDirs();

const node = checkNode(20);
if (!node.ok) {
  console.error(node.message);
  process.exit(1);
}
const pnpm = checkPnpm();
if (!pnpm.ok) {
  console.error(pnpm.message);
  process.exit(1);
}

const dev = isDevMode();
const children = [];

function start(name, command, args, env = {}) {
  const line = [command, ...args].join(" ");
  console.log(`[dev] starting ${name}: ${line}`);
  // Use a single command string on Windows so `.cmd` shims resolve without DEP0190.
  const child = spawn(line, {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
    windowsHide: true
  });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[dev] ${name} exited code=${code} signal=${signal}`);
    shutdown(code || 1);
  });
  children.push({ name, child });
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const { child } of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`\nEMBER dev — mode=${dev ? "development" : "live"}\n`);

if (dev) {
  start("runtime", "node", ["scripts/dev-mock-runtime.mjs"]);
} else {
  const paydayDist = resolve(ROOT, "services/payday/dist/main.js");
  if (!existsSync(paydayDist)) {
    console.log("[dev] building workspace (first live start)...");
    execSync("pnpm build", { cwd: ROOT, stdio: "inherit" });
  }
  start("runtime", "node", ["scripts/start-ember-runtime.mjs"], {
    PORT: process.env.PORT || "10000"
  });
}

start("watcher", "node", ["scripts/dev-watcher.mjs"]);
start("frontend", "pnpm", ["--filter", "@ember/frontend", "dev"], {
  EMBER_RUNTIME_URL: process.env.EMBER_RUNTIME_URL || "http://127.0.0.1:10000",
  DEVELOPMENT_MODE: dev ? "1" : process.env.DEVELOPMENT_MODE || "0"
});

console.log(`
────────────────────────────────────────
  UI:      http://127.0.0.1:5173
  BFF:     http://127.0.0.1:8780/api/health
  Runtime: ${process.env.EMBER_RUNTIME_URL || "http://127.0.0.1:10000"}/healthz
  Watcher: runtime/watcher/heartbeat.json
────────────────────────────────────────
`);

#!/usr/bin/env node
/**
 * Local watcher for DEVELOPMENT_MODE — polls runtime health and writes a heartbeat.
 * Does not touch mainnet or KeeperHub.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, applyEnv, loadEnvFile } from "./lib/common.mjs";

applyEnv(loadEnvFile());

const runtime = (process.env.EMBER_RUNTIME_URL || "http://127.0.0.1:10000").replace(/\/$/, "");
const intervalMs = Number(process.env.WATCH_INTERVAL_MS || 15000);
const outDir = resolve(ROOT, "runtime/watcher");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

async function tick() {
  const at = new Date().toISOString();
  let health = null;
  let ok = false;
  try {
    const res = await fetch(`${runtime}/healthz`);
    health = await res.json().catch(() => ({ raw: true }));
    ok = res.ok;
  } catch (err) {
    health = { error: err instanceof Error ? err.message : String(err) };
  }
  const row = { at, ok, runtime, health, mode: process.env.DEVELOPMENT_MODE === "1" ? "development" : "live" };
  writeFileSync(resolve(outDir, "heartbeat.json"), JSON.stringify(row, null, 2));
  console.log(`[watcher] ${at} ok=${ok} runtime=${runtime}`);
}

console.log(`[watcher] polling ${runtime}/healthz every ${intervalMs}ms`);
await tick();
setInterval(() => {
  void tick();
}, intervalMs);

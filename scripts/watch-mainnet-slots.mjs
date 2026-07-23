#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createHmac } from "node:crypto";

function loadEnv(path) {
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
  }
}
loadEnv(".env");

const startAt = Number(process.env.MISSION_START_AT);
const cadence = Number(process.env.CADENCE_SECONDS || 300);
const targetSlots = Number(process.env.WATCH_SLOTS || 3);
const journalPath =
  process.env.PAYDAY_JOURNAL_FILE || "runtime/mainnet/payday/payday.ndjson";
const base = process.env.WATCH_BASE || "http://127.0.0.1:10000";
const secret = process.env.SENTINEL_SHARED_SECRET;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseJournal() {
  if (!existsSync(journalPath)) return [];
  return readFileSync(journalPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function hmacCheck() {
  const body = "{}";
  const ts = String(Math.floor(Date.now() / 1000));
  const nonce = `n-${Date.now()}`;
  const bodyHash = createHmac("sha256", "").update(body).digest("hex"); // placeholder replaced below
  const { createHash } = await import("node:crypto");
  const sha = createHash("sha256").update(body).digest("hex");
  const payload = ["POST", "/check", ts, nonce, sha].join("\n");
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  const res = await fetch(`${base}/check`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ember-timestamp": ts,
      "x-ember-nonce": nonce,
      "x-ember-body-sha256": sha,
      "x-ember-signature": sig
    },
    body
  });
  return { status: res.status, json: await res.json() };
}

const events = [];
while (true) {
  const now = Math.floor(Date.now() / 1000);
  const slotIndex = now < startAt ? null : Math.floor((now - startAt) / cadence);
  const journal = parseJournal();
  const verified = journal.filter((e) => e.event === "receipt_verified");
  const errors = journal.filter((e) => e.event === "invoke_error");
  const snapshot = {
    at: new Date().toISOString(),
    now,
    startAt,
    slotIndex,
    verifiedSlots: verified.map((e) => e.slot),
    verifiedCount: verified.length,
    errorCount: errors.length,
    lastError: errors.at(-1)?.error ?? null
  };
  events.push(snapshot);
  console.log(JSON.stringify(snapshot));
  if (verified.length >= targetSlots) {
    let check;
    try {
      check = await hmacCheck();
    } catch (error) {
      check = { error: String(error) };
    }
    const evidence = {
      version: 1,
      pass: verified.length >= targetSlots && errors.length === 0,
      targetSlots,
      verified,
      check,
      snapshots: events.slice(-20)
    };
    mkdirSync("docs/evidence", { recursive: true });
    writeFileSync(
      "docs/evidence/mainnet-payday-slots-2026-07-23.json",
      JSON.stringify(evidence, null, 2)
    );
    console.log(JSON.stringify({ done: true, pass: evidence.pass }));
    process.exit(evidence.pass ? 0 : 1);
  }
  if (now > startAt + cadence * (targetSlots + 2)) {
    console.error("timeout waiting for slots");
    process.exit(2);
  }
  await sleep(15_000);
}

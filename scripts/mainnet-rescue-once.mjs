#!/usr/bin/env node
import { createHmac, createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

function loadEnv(path) {
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
  }
}
loadEnv(".env");

const base = process.env.WATCH_BASE || "http://127.0.0.1:10000";
const secret = process.env.SENTINEL_SHARED_SECRET;
const startAt = Number(process.env.MISSION_START_AT);
const cadence = Number(process.env.CADENCE_SECONDS || 300);
const grace = Number(process.env.GRACE_MISSED_RUNS || 2);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sign(body) {
  const timestamp = Date.now();
  const nonce = randomUUID();
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${bodyHash}`)
    .digest("hex");
  return {
    headers: {
      "content-type": "application/json",
      "x-ember-timestamp": String(timestamp),
      "x-ember-nonce": nonce,
      "x-ember-body-sha256": bodyHash,
      "x-ember-signature": signature
    }
  };
}

async function post(path, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const { headers } = sign(body);
  const res = await fetch(`${base}${path}`, { method: "POST", headers, body });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

const paidSlots = 3;
// Need grace missed runs after the last paid slot.
const earliestRescueAt = startAt + cadence * (paidSlots + grace);
console.log(
  JSON.stringify({
    now: Math.floor(Date.now() / 1000),
    earliestRescueAt,
    waitSeconds: Math.max(0, earliestRescueAt - Math.floor(Date.now() / 1000))
  })
);

while (Math.floor(Date.now() / 1000) < earliestRescueAt) {
  const check = await post("/check", {});
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      status: check.status,
      state: check.json.state,
      missed: check.json.missedSlots?.length ?? null
    })
  );
  await sleep(30_000);
}

let lastCheck;
for (let i = 0; i < 20; i++) {
  lastCheck = await post("/check", {});
  console.log(JSON.stringify({ phase: "pre-rescue-check", ...lastCheck }));
  if (lastCheck.json.state === "MISSION_DOWN" || (lastCheck.json.missedSlots?.length ?? 0) > 0) {
    break;
  }
  await sleep(30_000);
}

const rescue = await post("/rescue", { maxReplaySlots: 2 });
console.log(JSON.stringify({ phase: "rescue", status: rescue.status, json: rescue.json }, null, 2));

mkdirSync("docs/evidence", { recursive: true });
const journalPath = "runtime/mainnet/rescues";
const evidence = {
  version: 1,
  at: new Date().toISOString(),
  earliestRescueAt,
  lastCheck,
  rescue,
  journalExists: existsSync(journalPath),
  pass: rescue.status === 200 && (rescue.json.ok === true || rescue.json.status === "completed" || rescue.json.rescueId)
};
writeFileSync("docs/evidence/mainnet-rescue-2026-07-23.json", JSON.stringify(evidence, null, 2));
process.exit(evidence.pass ? 0 : 1);

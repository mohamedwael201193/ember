import { randomUUID } from "node:crypto";
import {
  HMAC_BODY_SHA256_HEADER,
  HMAC_NONCE_HEADER,
  HMAC_SIGNATURE_HEADER,
  HMAC_TIMESTAMP_HEADER,
  bodySha256Hex,
  signHmac
} from "../../packages/mission-core/dist/index.js";

const request = {
  maxReplaySlots: Number(process.env.MAX_REPLAY_SLOTS ?? "2"),
  dryRun: process.env.DRY_RUN === "1"
};
if (process.env.RESCUE_ID) request.rescueId = process.env.RESCUE_ID;
const body = JSON.stringify(request);
const secret = process.env.SENTINEL_SHARED_SECRET;
if (!secret) {
  console.error(JSON.stringify({ error: "SENTINEL_SHARED_SECRET missing" }));
  process.exit(2);
}
const timestamp = Date.now();
const nonce = randomUUID();
const bodyHash = bodySha256Hex(body);
const signature = signHmac(secret, timestamp, nonce, body);
const res = await fetch("http://127.0.0.1:8787/rescue", {
  method: "POST",
  headers: {
    [HMAC_TIMESTAMP_HEADER]: String(timestamp),
    [HMAC_NONCE_HEADER]: nonce,
    [HMAC_BODY_SHA256_HEADER]: bodyHash,
    [HMAC_SIGNATURE_HEADER]: signature,
    "content-type": "application/json"
  },
  body
});
const text = await res.text();
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  parsed = { raw: text };
}
console.log(JSON.stringify({ status: res.status, body: parsed }));

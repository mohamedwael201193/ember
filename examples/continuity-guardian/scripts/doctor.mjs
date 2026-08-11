#!/usr/bin/env node
/** Continuity-guardian doctor — inspect path health, no secrets required. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;

function ok(msg) {
  console.log(`  ok  ${msg}`);
}
function fail(msg) {
  failures += 1;
  console.log(` FAIL ${msg}`);
}

console.log("\ncontinuity-guardian doctor\n");

const policy = join(root, "policies", "example-mission.policy.json");
if (existsSync(policy)) {
  try {
    JSON.parse(readFileSync(policy, "utf8"));
    ok("example-mission.policy.json parses");
  } catch (e) {
    fail(`policy JSON invalid: ${e instanceof Error ? e.message : e}`);
  }
} else {
  fail("missing policies/example-mission.policy.json");
}

for (const wf of ["w1-payday-stream.mainnet.json", "w1-orgb-replay.mainnet.json"]) {
  const path = join(root, "workflows", wf);
  if (existsSync(path)) ok(`workflow present: ${wf}`);
  else fail(`missing workflows/${wf}`);
}

if (process.env.WRITE_MODE === "1") {
  console.log("  warn WRITE_MODE=1 set — inspect will still refuse live writes");
} else {
  ok("WRITE_MODE not enabling writes (safe default)");
}

const major = Number(process.versions.node.split(".")[0]);
if (major >= 20) ok(`node ${process.version}`);
else fail(`node >= 20 required (got ${process.version})`);

console.log("");
if (failures > 0) {
  console.log(`doctor failed (${failures})`);
  process.exit(1);
}
console.log("doctor passed — safe to pnpm inspect");
process.exit(0);

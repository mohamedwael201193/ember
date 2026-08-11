/**
 * Continuity Guardian — inspect-only classification.
 *
 * Loads MissionPolicy from env / example JSON and prints missed-slot
 * classification + replay plan via @ember/continuity-kit.
 *
 * No secrets required. No chain or KeeperHub writes.
 * WRITE_MODE=1 is documented as an explicit gate; this tool still refuses
 * to perform writes (production rescue remains in services/sentinel).
 */
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertNoDoublePay,
  classifyMissedSlots,
  coveredSlotsFromJournalReplays,
  planReplay,
  validatePolicy,
  type JournalReplayEntry,
  type MissionPolicy
} from "@ember/continuity-kit";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function env(name: string, fallback?: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value;
}

function parseSlotList(raw: string | undefined, label: string): number[] {
  if (!raw || raw.trim() === "") return [];
  return raw.split(",").map((part, index) => {
    const value = Number(part.trim());
    if (!Number.isSafeInteger(value)) {
      throw new Error(`${label}[${index}] must be a safe integer (got ${part.trim()})`);
    }
    return value;
  });
}

function parseJournalReplays(raw: string | undefined): JournalReplayEntry[] {
  if (!raw || raw.trim() === "" || raw.trim() === "[]") return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("JOURNAL_REPLAYS_JSON must be an array");
  return parsed.map((entry, index) => {
    if (entry === null || typeof entry !== "object") {
      throw new Error(`JOURNAL_REPLAYS_JSON[${index}] must be an object`);
    }
    const row = entry as Record<string, unknown>;
    if (!Number.isSafeInteger(row.slot)) {
      throw new Error(`JOURNAL_REPLAYS_JSON[${index}].slot must be a safe integer`);
    }
    const replay: JournalReplayEntry = { slot: row.slot as number };
    if (typeof row.txHash === "string") replay.txHash = row.txHash;
    if (typeof row.executionId === "string") replay.executionId = row.executionId;
    return replay;
  });
}

async function loadPolicy(): Promise<MissionPolicy> {
  const relative = env("POLICY_PATH", "policies/example-mission.policy.json")!;
  const path = isAbsolute(relative) ? relative : join(root, relative);
  const raw = await readFile(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  const result = validatePolicy(parsed);
  if (!result.ok) {
    const detail = result.issues.map((i) => `${i.path || "(root)"}: ${i.message}`).join("; ");
    throw new Error(`invalid policy at ${path}: ${detail}`);
  }
  return parsed as MissionPolicy;
}

function printSection(title: string, value: unknown): void {
  process.stdout.write(`\n## ${title}\n`);
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function main(): Promise<void> {
  const writeMode = env("WRITE_MODE", "0") === "1";
  if (writeMode) {
    process.stderr.write(
      [
        "WRITE_MODE=1 is set, but this example is inspect-only.",
        "It will not execute workflows, sign txs, or mutate journals.",
        "Use services/sentinel for production rescue writes.",
        "Unset WRITE_MODE (or set WRITE_MODE=0) and re-run for classification output.",
        ""
      ].join("\n")
    );
    process.exitCode = 2;
    return;
  }

  const policy = await loadPolicy();
  const expectedSlots = parseSlotList(
    env("EXPECTED_SLOTS", "1000,1300,1600,1900,2200"),
    "EXPECTED_SLOTS"
  );
  const confirmedSlots = new Set(
    parseSlotList(env("CONFIRMED_SLOTS", "1000,1300"), "CONFIRMED_SLOTS")
  );
  const journalReplays = parseJournalReplays(env("JOURNAL_REPLAYS_JSON", "[]"));
  const journalCovered = coveredSlotsFromJournalReplays(journalReplays);

  const confirmedWithJournal = new Set([...confirmedSlots, ...journalCovered]);
  const classification = classifyMissedSlots(
    expectedSlots,
    confirmedWithJournal,
    policy.graceMissedRuns
  );
  const unpaidForPlan =
    classification.status === "actionable" ? classification.actionableSlots : classification.missedSlots;
  const plan = planReplay(unpaidForPlan, journalCovered, policy.maxReplaySlots);

  try {
    assertNoDoublePay(plan.slotsToReplay, journalCovered);
  } catch (error) {
    process.stderr.write(`double-pay guard: ${(error as Error).message}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write("EMBER Continuity Guardian — inspect only (no writes, no secrets)\n");
  printSection("policy", {
    expectedCadenceSeconds: policy.expectedCadenceSeconds,
    primaryWorkflowId: policy.primaryWorkflowId,
    standbyWorkflowId: policy.standbyWorkflowId,
    graceMissedRuns: policy.graceMissedRuns,
    maxReplaySlots: policy.maxReplaySlots,
    receiptConfirmations: policy.receiptConfirmations,
    durableSlotIdentityNote: policy.durableSlotIdentityNote,
    workflowFiles: [
      "workflows/w1-payday-stream.mainnet.json",
      "workflows/w1-orgb-replay.mainnet.json"
    ]
  });
  printSection("inputs", {
    expectedSlots,
    confirmedSlots: [...confirmedSlots].sort((a, b) => a - b),
    journalCoveredSlots: [...journalCovered].sort((a, b) => a - b),
    writeMode: false
  });
  printSection("classification", classification);
  printSection("replayPlan", plan);
  process.stdout.write(
    "\nOK — inspect complete. Set WRITE_MODE=1 only as an explicit gate; this tool still will not write.\n"
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});

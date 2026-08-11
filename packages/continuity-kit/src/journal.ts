import type { JournalReplayEntry } from "./types.js";

/**
 * A replay entry counts as durable coverage only when it has a real on-chain
 * receipt hash. Dry-run placeholders (`0xdry…`) never mark a slot paid.
 */
export function isVerifiedReplayCoverage(replay: JournalReplayEntry): boolean {
  const hash = replay.txHash;
  if (typeof hash !== "string") return false;
  if (!hash.startsWith("0x")) return false;
  if (hash.startsWith("0xdry")) return false;
  if (!Number.isSafeInteger(replay.slot)) return false;
  return true;
}

/**
 * Build the covered slot set from journal replay entries (pure, no RPC).
 * Callers that need receipt verification should filter to verified replays
 * before invoking this helper (or only pass verified entries).
 */
export function coveredSlotsFromJournalReplays(
  replays: readonly JournalReplayEntry[]
): Set<number> {
  const covered = new Set<number>();
  for (const replay of replays) {
    if (isVerifiedReplayCoverage(replay)) covered.add(replay.slot);
  }
  return covered;
}

/**
 * Merge multiple journal covered sets into one mission-wide coverage set.
 */
export function mergeCoveredSlotSets(sets: readonly ReadonlySet<number>[]): Set<number> {
  const merged = new Set<number>();
  for (const set of sets) {
    for (const slot of set) merged.add(slot);
  }
  return merged;
}

/**
 * Refuse any planned replay that would pay a slot already covered.
 * Throws on collision so callers cannot silently double-pay.
 */
export function assertNoDoublePay(
  plannedSlots: readonly number[],
  coveredSlots: ReadonlySet<number>
): void {
  const collisions = [...new Set(plannedSlots.filter((slot) => coveredSlots.has(slot)))].sort(
    (a, b) => a - b
  );
  if (collisions.length > 0) {
    throw new Error(`double_pay_risk slots=${collisions.join(",")}`);
  }
}

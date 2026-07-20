import { createHash } from "node:crypto";

export function deriveRescueId(missionId: string, missedSlotIds: number[]): string {
  if (!missionId.trim()) throw new TypeError("missionId is required");
  if (missedSlotIds.length === 0) throw new RangeError("at least one missed slot is required");
  const slots = [...new Set(missedSlotIds)].sort((a, b) => a - b);
  if (slots.some((slot) => !Number.isSafeInteger(slot) || slot < 0)) {
    throw new TypeError("missed slots must be non-negative safe integers");
  }
  const first = slots[0]!;
  const last = slots[slots.length - 1]!;
  return createHash("sha256").update(`ember-rescue-v1:${missionId}:${first}:${last}`).digest("hex");
}

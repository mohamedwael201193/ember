import { expectedSlots, missedSlots, slotIndexAt } from "@ember/mission-core";

export type MissionHealth =
  "WARMING_UP" | "OK" | "DEGRADED" | "MISSION_DOWN" | "RESCUING" | "RECOVERED";

export interface ExecutionSummary {
  id: string;
  status: string;
  completedAt?: string | null;
  startedAt?: string | null;
  transactionHashes?: Array<{ hash?: string }>;
}

export interface DetectorInput {
  nowSeconds: number;
  startAt: number;
  cadenceSeconds: number;
  graceMissedRuns: number;
  clockSkewSeconds: number;
  executions: ExecutionSummary[];
  /** When set, slot payment times come from receipt-verified block timestamps (preferred). */
  verifiedPaymentTimes?: number[];
  rescuing?: boolean;
  recovered?: boolean;
}

export interface DetectorResult {
  state: MissionHealth;
  reason: string;
  expectedSlotCount: number;
  paidSlotCount: number;
  missedSlots: number[];
  latestPaidSlot?: number;
}

function successfulPaymentTimes(executions: ExecutionSummary[]): number[] {
  const times: number[] = [];
  for (const execution of executions) {
    if (execution.status.toLowerCase() !== "success") continue;
    const hashes = execution.transactionHashes ?? [];
    if (hashes.length === 0 || !hashes.some((entry) => Boolean(entry.hash))) continue;
    const stamp = execution.completedAt ?? execution.startedAt;
    if (!stamp) continue;
    const seconds = Math.floor(Date.parse(stamp) / 1_000);
    if (Number.isFinite(seconds)) times.push(seconds);
  }
  return times.sort((a, b) => a - b);
}

export function detectMissionHealth(input: DetectorInput): DetectorResult {
  if (input.rescuing) {
    return {
      state: "RESCUING",
      reason: "rescue_in_progress",
      expectedSlotCount: 0,
      paidSlotCount: 0,
      missedSlots: []
    };
  }
  if (input.recovered) {
    return {
      state: "RECOVERED",
      reason: "rescue_completed",
      expectedSlotCount: 0,
      paidSlotCount: 0,
      missedSlots: []
    };
  }
  if (input.nowSeconds + input.clockSkewSeconds < input.startAt) {
    return {
      state: "WARMING_UP",
      reason: "mission_not_started",
      expectedSlotCount: 0,
      paidSlotCount: 0,
      missedSlots: []
    };
  }

  const expected = expectedSlots(
    input.startAt,
    input.cadenceSeconds,
    input.nowSeconds,
    input.clockSkewSeconds
  );
  const paidTimes =
    input.verifiedPaymentTimes !== undefined
      ? input.verifiedPaymentTimes
      : successfulPaymentTimes(input.executions);
  const paidSlots = new Set<number>();
  for (const time of paidTimes) {
    const index = slotIndexAt(input.startAt, input.cadenceSeconds, time + input.clockSkewSeconds);
    if (index === undefined) continue;
    paidSlots.add(input.startAt + input.cadenceSeconds * index);
  }
  const missed = missedSlots(expected, paidSlots);
  const latestPaidSlot = paidSlots.size > 0 ? Math.max(...paidSlots) : undefined;
  const withLatest = (result: Omit<DetectorResult, "latestPaidSlot">): DetectorResult =>
    latestPaidSlot === undefined ? result : { ...result, latestPaidSlot };

  if (expected.length === 0) {
    return withLatest({
      state: "WARMING_UP",
      reason: "awaiting_first_due_slot",
      expectedSlotCount: 0,
      paidSlotCount: paidSlots.size,
      missedSlots: []
    });
  }
  if (missed.length === 0) {
    return withLatest({
      state: "OK",
      reason: "all_due_slots_paid",
      expectedSlotCount: expected.length,
      paidSlotCount: paidSlots.size,
      missedSlots: []
    });
  }
  if (missed.length < input.graceMissedRuns) {
    return withLatest({
      state: "DEGRADED",
      reason: "within_grace_window",
      expectedSlotCount: expected.length,
      paidSlotCount: paidSlots.size,
      missedSlots: missed
    });
  }
  return withLatest({
    state: "MISSION_DOWN",
    reason: "missed_beyond_grace",
    expectedSlotCount: expected.length,
    paidSlotCount: paidSlots.size,
    missedSlots: missed
  });
}

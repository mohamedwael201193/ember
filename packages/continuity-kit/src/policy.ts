import type {
  MissionPolicy,
  MissedSlotClassification,
  PolicyValidationResult,
  ReplayPlan
} from "./types.js";

const DEFAULT_SLOT_NOTE =
  "Slot ids are durable schedule anchors (startAt + cadence * index). " +
  "Do not infer historical coverage from standby replay block timestamps.";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafePositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

/**
 * Validate a MissionPolicy. Pure — does not throw; returns structured issues.
 */
export function validatePolicy(policy: unknown): PolicyValidationResult {
  const issues: PolicyValidationResult["issues"] = [];
  if (policy === null || typeof policy !== "object" || Array.isArray(policy)) {
    return { ok: false, issues: [{ path: "", message: "policy must be an object" }] };
  }
  const p = policy as Record<string, unknown>;

  if (!isSafePositiveInt(p.expectedCadenceSeconds)) {
    issues.push({
      path: "expectedCadenceSeconds",
      message: "must be a positive safe integer"
    });
  }
  if (!isNonEmptyString(p.primaryWorkflowId)) {
    issues.push({ path: "primaryWorkflowId", message: "must be a non-empty string" });
  }
  if (!isNonEmptyString(p.standbyWorkflowId)) {
    issues.push({ path: "standbyWorkflowId", message: "must be a non-empty string" });
  }
  if (
    !isSafePositiveInt(p.graceMissedRuns) ||
    (typeof p.graceMissedRuns === "number" && p.graceMissedRuns > 5)
  ) {
    issues.push({ path: "graceMissedRuns", message: "must be an integer from 1 to 5" });
  }
  if (
    !isSafePositiveInt(p.maxReplaySlots) ||
    (typeof p.maxReplaySlots === "number" && p.maxReplaySlots > 12)
  ) {
    issues.push({ path: "maxReplaySlots", message: "must be an integer from 1 to 12" });
  }
  if (!isSafePositiveInt(p.receiptConfirmations)) {
    issues.push({
      path: "receiptConfirmations",
      message: "must be a positive safe integer"
    });
  }
  if (!isNonEmptyString(p.durableSlotIdentityNote)) {
    issues.push({
      path: "durableSlotIdentityNote",
      message: "must document durable slot identity (non-empty string)"
    });
  }

  if (
    isNonEmptyString(p.primaryWorkflowId) &&
    isNonEmptyString(p.standbyWorkflowId) &&
    p.primaryWorkflowId.trim() === p.standbyWorkflowId.trim()
  ) {
    issues.push({
      path: "standbyWorkflowId",
      message: "must differ from primaryWorkflowId"
    });
  }

  return { ok: issues.length === 0, issues };
}

/** Convenience default note for operators bootstrapping a policy. */
export function defaultDurableSlotIdentityNote(): string {
  return DEFAULT_SLOT_NOTE;
}

/**
 * Classify which expected slots are unpaid relative to confirmed coverage,
 * applying a miss-count grace window (same semantics as EMBER sentinel).
 *
 * Pure: no I/O. `grace` is the allowed missed-run count before actionable.
 */
export function classifyMissedSlots(
  expectedSlots: readonly number[],
  confirmedSlots: ReadonlySet<number>,
  grace: number
): MissedSlotClassification {
  if (!Number.isSafeInteger(grace) || grace < 1) {
    throw new RangeError("grace must be a positive safe integer");
  }
  const missedSlots = expectedSlots
    .filter((slot) => !confirmedSlots.has(slot))
    .slice()
    .sort((a, b) => a - b);

  if (missedSlots.length === 0) {
    return {
      missedSlots: [],
      withinGrace: true,
      actionableSlots: [],
      status: "ok"
    };
  }
  if (missedSlots.length < grace) {
    return {
      missedSlots,
      withinGrace: true,
      actionableSlots: [],
      status: "within_grace"
    };
  }
  return {
    missedSlots,
    withinGrace: false,
    actionableSlots: [...missedSlots],
    status: "actionable"
  };
}

/**
 * Plan standby replays for unpaid slots that are not already journal-covered.
 * Caps at `maxReplaySlots`. Pure: no I/O.
 */
export function planReplay(
  unpaidSlots: readonly number[],
  coveredSlots: ReadonlySet<number>,
  maxReplaySlots: number
): ReplayPlan {
  if (!Number.isSafeInteger(maxReplaySlots) || maxReplaySlots < 1) {
    throw new RangeError("maxReplaySlots must be a positive safe integer");
  }

  const sortedUnpaid = [...unpaidSlots].sort((a, b) => a - b);
  const alreadyCovered: number[] = [];
  const candidates: number[] = [];

  for (const slot of sortedUnpaid) {
    if (coveredSlots.has(slot)) {
      alreadyCovered.push(slot);
      continue;
    }
    candidates.push(slot);
  }

  const slotsToReplay = candidates.slice(0, maxReplaySlots);
  const deferred = candidates.slice(maxReplaySlots);

  return { slotsToReplay, alreadyCovered, deferred };
}

/** Type guard after validatePolicy succeeds. */
export function asMissionPolicy(policy: unknown): MissionPolicy {
  const result = validatePolicy(policy);
  if (!result.ok) {
    const detail = result.issues.map((i) => `${i.path || "(root)"}: ${i.message}`).join("; ");
    throw new TypeError(`invalid MissionPolicy: ${detail}`);
  }
  return policy as MissionPolicy;
}

/**
 * Mission Continuity policy — portable across payroll, treasury sweeps,
 * liquidation keepers, grants, and settlement loops.
 *
 * Durable slot identity: each owed run is identified by a stable slot id
 * (typically `startAt + expectedCadenceSeconds * index`), NOT by the block
 * timestamp of a later standby replay. Replay txs land "now"; journals must
 * bind `(slotId → verified receipt)` so coverage survives restarts without
 * double-pay.
 */
export interface MissionPolicy {
  /** Expected seconds between owed runs (cadence). Must be > 0. */
  expectedCadenceSeconds: number;
  /** Primary / Org A workflow id that should hit every slot. */
  primaryWorkflowId: string;
  /** Standby / Org B replay workflow id used when primary misses. */
  standbyWorkflowId: string;
  /**
   * How many missed due slots are tolerated before rescue becomes actionable.
   * Matches EMBER `GRACE_MISSED_RUNS` semantics: action when missed >= grace.
   */
  graceMissedRuns: number;
  /** Cap on how many unpaid slots a single rescue may replay. */
  maxReplaySlots: number;
  /** Minimum receipt confirmations before a payment counts as confirmed. */
  receiptConfirmations: number;
  /**
   * Human-readable note documenting durable slot identity for operators
   * reusing this kit outside payroll (treasury / liquidation / grants / settlement).
   */
  durableSlotIdentityNote: string;
}

export type MissedSlotStatus = "ok" | "within_grace" | "actionable";

export interface MissedSlotClassification {
  /** Expected slots with no confirmation. Sorted ascending. */
  missedSlots: number[];
  /** True when missed count is below graceMissedRuns. */
  withinGrace: boolean;
  /** Slots that should drive rescue when not within grace; empty if within grace or ok. */
  actionableSlots: number[];
  status: MissedSlotStatus;
}

export interface ReplayPlan {
  /** Slots selected for standby replay this round (sorted, capped). */
  slotsToReplay: number[];
  /** Unpaid slots skipped because already covered by a verified journal replay. */
  alreadyCovered: number[];
  /** Unpaid slots deferred because maxReplaySlots was reached. */
  deferred: number[];
}

/** Minimal journal replay shape used for coverage / double-pay checks. */
export interface JournalReplayEntry {
  slot: number;
  txHash?: string;
  executionId?: string;
}

export interface PolicyValidationIssue {
  path: string;
  message: string;
}

export interface PolicyValidationResult {
  ok: boolean;
  issues: PolicyValidationIssue[];
}

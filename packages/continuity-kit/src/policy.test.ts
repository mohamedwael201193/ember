import { describe, expect, it } from "vitest";
import {
  asMissionPolicy,
  classifyMissedSlots,
  defaultDurableSlotIdentityNote,
  planReplay,
  validatePolicy
} from "./policy.js";

const validPolicy = {
  expectedCadenceSeconds: 300,
  primaryWorkflowId: "w1-primary",
  standbyWorkflowId: "w1-standby",
  graceMissedRuns: 2,
  maxReplaySlots: 3,
  receiptConfirmations: 2,
  durableSlotIdentityNote: defaultDurableSlotIdentityNote()
};

describe("validatePolicy", () => {
  it("accepts a well-formed MissionPolicy", () => {
    const result = validatePolicy(validPolicy);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(asMissionPolicy(validPolicy).primaryWorkflowId).toBe("w1-primary");
  });

  it("rejects identical primary and standby workflow ids", () => {
    const result = validatePolicy({
      ...validPolicy,
      standbyWorkflowId: "w1-primary"
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.path === "standbyWorkflowId")).toBe(true);
  });

  it("rejects out-of-range grace and replay caps", () => {
    expect(validatePolicy({ ...validPolicy, graceMissedRuns: 0 }).ok).toBe(false);
    expect(validatePolicy({ ...validPolicy, graceMissedRuns: 6 }).ok).toBe(false);
    expect(validatePolicy({ ...validPolicy, maxReplaySlots: 0 }).ok).toBe(false);
    expect(validatePolicy({ ...validPolicy, maxReplaySlots: 13 }).ok).toBe(false);
  });
});

describe("classifyMissedSlots", () => {
  it("returns ok when every expected slot is confirmed", () => {
    const classification = classifyMissedSlots(
      [1_000, 1_300, 1_600],
      new Set([1_000, 1_300, 1_600]),
      2
    );
    expect(classification).toEqual({
      missedSlots: [],
      withinGrace: true,
      actionableSlots: [],
      status: "ok"
    });
  });

  it("stays within grace when missed count is below grace", () => {
    const classification = classifyMissedSlots([1_000, 1_300, 1_600], new Set([1_000, 1_300]), 2);
    expect(classification.status).toBe("within_grace");
    expect(classification.withinGrace).toBe(true);
    expect(classification.missedSlots).toEqual([1_600]);
    expect(classification.actionableSlots).toEqual([]);
  });

  it("marks all missed slots actionable once grace is exhausted", () => {
    const classification = classifyMissedSlots([1_000, 1_300, 1_600, 1_900], new Set([1_000]), 2);
    expect(classification.status).toBe("actionable");
    expect(classification.withinGrace).toBe(false);
    expect(classification.missedSlots).toEqual([1_300, 1_600, 1_900]);
    expect(classification.actionableSlots).toEqual([1_300, 1_600, 1_900]);
  });

  it("rejects invalid grace", () => {
    expect(() => classifyMissedSlots([], new Set(), 0)).toThrow(RangeError);
  });
});

describe("planReplay", () => {
  it("skips covered slots and caps at maxReplaySlots", () => {
    const plan = planReplay([1_900, 1_300, 1_600, 2_200], new Set([1_600]), 2);
    expect(plan.alreadyCovered).toEqual([1_600]);
    expect(plan.slotsToReplay).toEqual([1_300, 1_900]);
    expect(plan.deferred).toEqual([2_200]);
  });

  it("returns empty plan when everything is covered", () => {
    const plan = planReplay([1_000, 1_300], new Set([1_000, 1_300]), 3);
    expect(plan.slotsToReplay).toEqual([]);
    expect(plan.alreadyCovered).toEqual([1_000, 1_300]);
    expect(plan.deferred).toEqual([]);
  });
});

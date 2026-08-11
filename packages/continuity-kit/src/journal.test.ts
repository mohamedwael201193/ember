import { describe, expect, it } from "vitest";
import {
  assertNoDoublePay,
  coveredSlotsFromJournalReplays,
  isVerifiedReplayCoverage,
  mergeCoveredSlotSets
} from "./journal.js";

describe("coveredSlotsFromJournalReplays", () => {
  it("includes only durable verified receipt hashes", () => {
    const covered = coveredSlotsFromJournalReplays([
      { slot: 1_000, txHash: "0xabc123", executionId: "e1" },
      { slot: 1_300, txHash: "0xdry-run-placeholder", executionId: "dry" },
      { slot: 1_600, executionId: "missing-hash" },
      { slot: 1_900, txHash: "not-a-hex" },
      { slot: 2_200, txHash: "0xdef456" }
    ]);
    expect([...covered].sort((a, b) => a - b)).toEqual([1_000, 2_200]);
  });

  it("treats dry-run hashes as non-coverage", () => {
    expect(isVerifiedReplayCoverage({ slot: 1_000, txHash: "0xdrydeadbeef" })).toBe(false);
  });
});

describe("mergeCoveredSlotSets", () => {
  it("unions mission-wide journal coverage", () => {
    const merged = mergeCoveredSlotSets([new Set([1_000, 1_300]), new Set([1_300, 1_600])]);
    expect([...merged].sort((a, b) => a - b)).toEqual([1_000, 1_300, 1_600]);
  });
});

describe("assertNoDoublePay", () => {
  it("allows disjoint planned slots", () => {
    expect(() => assertNoDoublePay([1_600, 1_900], new Set([1_000, 1_300]))).not.toThrow();
  });

  it("throws when a planned slot is already covered", () => {
    expect(() => assertNoDoublePay([1_300, 1_600], new Set([1_300]))).toThrow(
      /double_pay_risk slots=1300/
    );
  });
});

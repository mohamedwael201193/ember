import { describe, expect, it } from "vitest";
import { missedSlots } from "./diff.js";
import { expectedSlots, slotAt, slotIndexAt } from "./schedule.js";

describe("UTC slot math", () => {
  it("calculates slots at exact boundaries", () => {
    expect(slotAt(1_000, 300, 2)).toBe(1_600);
    expect(slotIndexAt(1_000, 300, 999)).toBeUndefined();
    expect(slotIndexAt(1_000, 300, 1_600)).toBe(2);
    expect(expectedSlots(1_000, 300, 1_600)).toEqual([1_000, 1_300, 1_600]);
  });

  it("holds the current slot through a grace window", () => {
    expect(expectedSlots(1_000, 300, 1_600, 1)).toEqual([1_000, 1_300]);
    expect(expectedSlots(1_000, 300, 1_899, 299)).toEqual([1_000, 1_300, 1_600]);
    expect(expectedSlots(1_000, 300, 1_900, 300)).toEqual([1_000, 1_300, 1_600]);
  });

  it("does not create a missed slot from allowed clock skew", () => {
    const expected = expectedSlots(1_000, 300, 1_660, 60);
    expect(expected).toEqual([1_000, 1_300, 1_600]);
    expect(missedSlots(expected, new Set([1_000, 1_300, 1_600]))).toEqual([]);
  });

  it("rejects invalid schedule values", () => {
    expect(() => slotAt(1_000, 0, 0)).toThrow(RangeError);
    expect(() => slotIndexAt(1_000, 0, 1_000)).toThrow(RangeError);
  });
});

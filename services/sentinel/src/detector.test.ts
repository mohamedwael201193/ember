import { describe, expect, it } from "vitest";
import { detectMissionHealth } from "./detector.js";

describe("detectMissionHealth", () => {
  const startAt = 1_000;
  const cadenceSeconds = 300;

  it("returns WARMING_UP before start", () => {
    const result = detectMissionHealth({
      nowSeconds: 900,
      startAt,
      cadenceSeconds,
      graceMissedRuns: 2,
      clockSkewSeconds: 60,
      executions: []
    });
    expect(result.state).toBe("WARMING_UP");
  });

  it("returns OK when due slots are paid", () => {
    const result = detectMissionHealth({
      nowSeconds: startAt + cadenceSeconds * 2 + 10,
      startAt,
      cadenceSeconds,
      graceMissedRuns: 2,
      clockSkewSeconds: 60,
      executions: [
        {
          id: "a",
          status: "success",
          completedAt: new Date((startAt + 5) * 1_000).toISOString(),
          transactionHashes: [{ hash: "0x1" }]
        },
        {
          id: "b",
          status: "success",
          completedAt: new Date((startAt + cadenceSeconds + 5) * 1_000).toISOString(),
          transactionHashes: [{ hash: "0x2" }]
        }
      ]
    });
    expect(result.state).toBe("OK");
    expect(result.missedSlots).toEqual([]);
  });

  it("uses verifiedPaymentTimes over execution timestamps", () => {
    const result = detectMissionHealth({
      nowSeconds: startAt + cadenceSeconds + 10,
      startAt,
      cadenceSeconds,
      graceMissedRuns: 2,
      clockSkewSeconds: 0,
      executions: [],
      verifiedPaymentTimes: [startAt + 5, startAt + cadenceSeconds + 5]
    });
    expect(result.state).toBe("OK");
    expect(result.paidSlotCount).toBe(2);
  });

  it("returns MISSION_DOWN after grace is exceeded", () => {
    const result = detectMissionHealth({
      nowSeconds: startAt + cadenceSeconds,
      startAt,
      cadenceSeconds,
      graceMissedRuns: 2,
      clockSkewSeconds: 0,
      executions: []
    });
    expect(result.state).toBe("MISSION_DOWN");
    expect(result.missedSlots).toHaveLength(2);
  });

  it("returns DEGRADED after the first missed slot", () => {
    const result = detectMissionHealth({
      nowSeconds: startAt,
      startAt,
      cadenceSeconds,
      graceMissedRuns: 2,
      clockSkewSeconds: 0,
      executions: []
    });
    expect(result.state).toBe("DEGRADED");
    expect(result.missedSlots).toEqual([startAt]);
  });
});

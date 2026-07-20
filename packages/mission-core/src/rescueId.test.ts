import { describe, expect, it } from "vitest";
import { deriveRescueId } from "./rescueId.js";

describe("deriveRescueId", () => {
  it("is deterministic across slot order and duplicates", () => {
    const expected = deriveRescueId("1", [1000, 1300]);
    expect(deriveRescueId("1", [1300, 1000, 1300])).toBe(expected);
    expect(expected).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes across missions or slot ranges", () => {
    expect(deriveRescueId("1", [1000, 1300])).not.toBe(deriveRescueId("2", [1000, 1300]));
    expect(deriveRescueId("1", [1000, 1300])).not.toBe(deriveRescueId("1", [1000, 1600]));
  });

  it("rejects empty or invalid inputs", () => {
    expect(() => deriveRescueId("", [1000])).toThrow("missionId is required");
    expect(() => deriveRescueId("1", [])).toThrow("at least one missed slot");
    expect(() => deriveRescueId("1", [-1])).toThrow("non-negative safe integers");
  });
});

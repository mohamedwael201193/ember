import { describe, expect, it } from "vitest";
import { buildProofBundle, proofHash, proofHashBytes32, serializeProofBundle } from "./proof.js";

describe("rescue proof bundle", () => {
  it("hashes deterministically regardless of object key insertion order", () => {
    const a = buildProofBundle({
      missionId: "1",
      rescueId: "r1",
      detectedAt: "2026-07-22T00:00:00.000Z",
      missedSlots: [1300, 1000],
      replays: [
        { slot: 1300, executionId: "b", txHash: "0xb" },
        { slot: 1000, executionId: "a", txHash: "0xa" }
      ],
      feeMode: "ESCROW_FALLBACK"
    });
    const b = buildProofBundle({
      missionId: "1",
      rescueId: "r1",
      detectedAt: "2026-07-22T00:00:00.000Z",
      missedSlots: [1000, 1300],
      replays: [
        { slot: 1000, executionId: "a", txHash: "0xa" },
        { slot: 1300, executionId: "b", txHash: "0xb" }
      ],
      feeMode: "ESCROW_FALLBACK"
    });
    expect(serializeProofBundle(a)).toBe(serializeProofBundle(b));
    expect(proofHash(a)).toBe(proofHash(b));
    expect(proofHashBytes32(a)).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("changes hash when a replay tx changes", () => {
    const base = buildProofBundle({
      missionId: "1",
      rescueId: "r1",
      detectedAt: "2026-07-22T00:00:00.000Z",
      missedSlots: [1000],
      replays: [{ slot: 1000, executionId: "a", txHash: "0xa" }],
      feeMode: "X402",
      feeReference: "x402:demo"
    });
    const tweaked = {
      ...base,
      replays: [{ slot: 1000, executionId: "a", txHash: "0xbeef" }]
    };
    expect(proofHash(base)).not.toBe(proofHash(tweaked));
  });
});

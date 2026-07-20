import {
  canonicalSha256,
  deterministicJson,
  sha256Hex,
  type CanonicalValue
} from "./canonicalize.js";

export type FeeModeName = "NONE" | "X402" | "MPP" | "ESCROW_FALLBACK";

export interface RescueProofReplay {
  slot: number;
  executionId: string;
  txHash: string;
}

export interface RescueProofReceiptCheck {
  slot?: number;
  txHash: string;
  ok: boolean;
  reason?: string;
}

export interface RescueProofBundle {
  version: 1;
  missionId: string;
  rescueId: string;
  detectedAt: string;
  missedSlots: number[];
  receiptChecks: RescueProofReceiptCheck[];
  replays: RescueProofReplay[];
  feeMode: FeeModeName;
  feeTx?: string;
  feeReference?: string;
  supersedes?: string;
}

export function toCanonicalProofValue(bundle: RescueProofBundle): CanonicalValue {
  const value: Record<string, CanonicalValue> = {
    version: bundle.version,
    missionId: bundle.missionId,
    rescueId: bundle.rescueId,
    detectedAt: bundle.detectedAt,
    missedSlots: bundle.missedSlots,
    receiptChecks: bundle.receiptChecks.map((item) => {
      const entry: Record<string, CanonicalValue> = {
        txHash: item.txHash,
        ok: item.ok
      };
      if (item.slot !== undefined) entry.slot = item.slot;
      if (item.reason !== undefined) entry.reason = item.reason;
      return entry;
    }),
    replays: bundle.replays.map((item) => ({
      slot: item.slot,
      executionId: item.executionId,
      txHash: item.txHash
    })),
    feeMode: bundle.feeMode
  };
  if (bundle.feeTx !== undefined) value.feeTx = bundle.feeTx;
  if (bundle.feeReference !== undefined) value.feeReference = bundle.feeReference;
  if (bundle.supersedes !== undefined) value.supersedes = bundle.supersedes;
  return value;
}

export function serializeProofBundle(bundle: RescueProofBundle): string {
  return deterministicJson(toCanonicalProofValue(bundle));
}

/** SHA-256 hex of canonical sorted-key JSON, or raw bytes/string (no 0x prefix). */
export function proofHash(bundle: RescueProofBundle | string | Uint8Array): string {
  if (typeof bundle === "string" || bundle instanceof Uint8Array) return sha256Hex(bundle);
  return canonicalSha256(toCanonicalProofValue(bundle));
}

export function proofHashBytes32(bundle: RescueProofBundle): `0x${string}` {
  return `0x${proofHash(bundle)}`;
}

export function buildProofBundle(input: {
  missionId: string;
  rescueId: string;
  detectedAt?: string;
  missedSlots: number[];
  receiptChecks?: RescueProofReceiptCheck[];
  replays: RescueProofReplay[];
  feeMode: FeeModeName;
  feeTx?: string;
  feeReference?: string;
  supersedes?: string;
}): RescueProofBundle {
  const bundle: RescueProofBundle = {
    version: 1,
    missionId: input.missionId,
    rescueId: input.rescueId,
    detectedAt: input.detectedAt ?? new Date().toISOString(),
    missedSlots: [...input.missedSlots].sort((a, b) => a - b),
    receiptChecks: input.receiptChecks ?? [],
    replays: [...input.replays].sort((a, b) => a.slot - b.slot),
    feeMode: input.feeMode
  };
  if (input.feeTx !== undefined) bundle.feeTx = input.feeTx;
  if (input.feeReference !== undefined) bundle.feeReference = input.feeReference;
  if (input.supersedes !== undefined) bundle.supersedes = input.supersedes;
  return bundle;
}

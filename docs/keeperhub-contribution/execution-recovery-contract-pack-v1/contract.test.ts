/**
 * Reference consumer for Execution Recovery Contract Pack v1.
 * Fixtures use synthetic IDs only — never present as live KeeperHub data.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, "fixtures");

type ExecBody = {
  httpStatus?: number;
  execution?: {
    id?: string;
    status?: string;
    transactionHash?: string;
    receipts?: Array<{
      hash?: string;
      verified?: boolean;
      receiptStatus?: string;
    }>;
  };
  error?: { code?: string };
  data?: unknown;
};

type Decision =
  | { action: "poll"; executionId: string; resubmit: false }
  | { action: "success"; executionId: string; txHash: string }
  | { action: "fail_closed"; reason: string; resubmit: false }
  | { action: "backoff"; reason: "rate_limited"; preserveIdempotencyKey: true }
  | { action: "terminal_failure"; reason: string };

const POLL_STATUSES = new Set(["queued", "running", "pending", "unconfirmed"]);

function loadFixture(name: string): ExecBody {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as ExecBody;
}

/** Decide next recovery step given a status envelope (R1–R6). */
export function decideRecovery(body: ExecBody, opts?: { requireReceipt?: boolean }): Decision {
  const requireReceipt = opts?.requireReceipt ?? true;

  if (body.httpStatus === 429 || body.error?.code === "rate_limited") {
    return { action: "backoff", reason: "rate_limited", preserveIdempotencyKey: true };
  }

  if (body.httpStatus === 404 || body.error?.code === "not_found") {
    return { action: "terminal_failure", reason: "not_found" };
  }

  const exec = body.execution;
  if (!exec || typeof exec !== "object" || !exec.id || !exec.status) {
    return { action: "fail_closed", reason: "malformed", resubmit: false };
  }

  const status = String(exec.status).toLowerCase();

  if (POLL_STATUSES.has(status)) {
    return { action: "poll", executionId: exec.id, resubmit: false };
  }

  if (status === "failed") {
    return { action: "terminal_failure", reason: "failed" };
  }

  if (status === "completed" || status === "success") {
    const receipts = exec.receipts ?? [];
    const reverted = receipts.some((r) => r.receiptStatus === "reverted");
    if (reverted) {
      return { action: "terminal_failure", reason: "reverted" };
    }

    const verified = receipts.find(
      (r) => r.verified === true && r.receiptStatus === "success" && r.hash
    );
    const txHash = verified?.hash ?? exec.transactionHash;

    if (requireReceipt) {
      if (!txHash) {
        return {
          action: "fail_closed",
          reason: "completed_without_chain_evidence",
          resubmit: false
        };
      }
      if (receipts.length > 0 && !verified) {
        return { action: "poll", executionId: exec.id, resubmit: false };
      }
    }

    if (txHash) {
      return { action: "success", executionId: exec.id, txHash };
    }
    return { action: "fail_closed", reason: "completed_without_chain_evidence", resubmit: false };
  }

  return { action: "fail_closed", reason: `unknown_status:${status}`, resubmit: false };
}

/** Write-retry helper: key must be stable across transport failures. */
export function nextWriteIdempotencyKey(previous: string | undefined, intentId: string): string {
  if (previous && previous.length > 0) return previous;
  return `intent:${intentId}`;
}

describe("Execution Recovery Contract Pack v1", () => {
  it("ships all required fixtures", () => {
    const files = readdirSync(fixturesDir).sort();
    expect(files).toEqual([
      "cold_start.json",
      "completed_with_tx.json",
      "completed_without_tx.json",
      "failed.json",
      "malformed.json",
      "not_found.json",
      "queued.json",
      "rate_limited.json",
      "reverted.json",
      "unconfirmed.json"
    ]);
  });

  it("R1: unconfirmed → poll, do not resubmit", () => {
    const d = decideRecovery(loadFixture("unconfirmed.json"));
    expect(d).toEqual({
      action: "poll",
      executionId: "exec_fixture_unconfirmed_001",
      resubmit: false
    });
  });

  it("R1: queued → poll, do not resubmit", () => {
    const d = decideRecovery(loadFixture("queued.json"));
    expect(d.action).toBe("poll");
    if (d.action === "poll") expect(d.resubmit).toBe(false);
  });

  it("R2: completed without tx → fail closed", () => {
    const d = decideRecovery(loadFixture("completed_without_tx.json"));
    expect(d).toEqual({
      action: "fail_closed",
      reason: "completed_without_chain_evidence",
      resubmit: false
    });
  });

  it("happy path: completed with verified receipt → success", () => {
    const d = decideRecovery(loadFixture("completed_with_tx.json"));
    expect(d.action).toBe("success");
    if (d.action === "success") {
      expect(d.txHash.startsWith("0x")).toBe(true);
    }
  });

  it("R3: write retry preserves stable idempotency key", () => {
    const first = nextWriteIdempotencyKey(undefined, "slot-42");
    const second = nextWriteIdempotencyKey(first, "slot-42");
    const third = nextWriteIdempotencyKey(second, "slot-42");
    expect(first).toBe("intent:slot-42");
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it("R4: failed / reverted / not_found / malformed are terminal or fail-closed", () => {
    expect(decideRecovery(loadFixture("failed.json")).action).toBe("terminal_failure");
    expect(decideRecovery(loadFixture("reverted.json")).action).toBe("terminal_failure");
    expect(decideRecovery(loadFixture("not_found.json")).action).toBe("terminal_failure");
    const malformed = decideRecovery(loadFixture("malformed.json"));
    expect(malformed.action).toBe("fail_closed");
    if (malformed.action === "fail_closed") expect(malformed.resubmit).toBe(false);
  });

  it("R5: rate limited → backoff and preserve idempotency key", () => {
    const d = decideRecovery(loadFixture("rate_limited.json"));
    expect(d).toEqual({
      action: "backoff",
      reason: "rate_limited",
      preserveIdempotencyKey: true
    });
  });

  it("R6: cold start remains pollable", () => {
    const d = decideRecovery(loadFixture("cold_start.json"));
    expect(d.action).toBe("poll");
  });
});

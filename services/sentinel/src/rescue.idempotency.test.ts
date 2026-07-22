import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { canonicalSha256 } from "@ember/mission-core";
import {
  deriveAnchorRescueId,
  loadJournalCoveredSlots,
  runRescue,
  withRescueLock
} from "./rescue.js";

describe("loadJournalCoveredSlots", () => {
  it("never treats dry-run journal slot ids as paid", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ember-rescue-"));
    await writeFile(
      join(dir, "1-test.json"),
      JSON.stringify({
        version: 1,
        missionId: "1",
        rescueId: "test",
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workflowHashExpected: "0xabc",
        unpaidSlots: [1000, 1300],
        replays: [
          { slot: 1000, executionId: "dry-1000", txHash: "0xdry1000" },
          { slot: 1300, executionId: "dry-1300", txHash: "0xdry1300" }
        ],
        stepsCompleted: ["done"]
      }),
      "utf8"
    );
    const covered = await loadJournalCoveredSlots({
      journalDir: dir,
      missionId: "1",
      rpcUrl: "http://127.0.0.1:9",
      expectedOrgB: {
        token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        from: "0xa45d8a46a4BC22Aae9946AE85962fA130A0aEFa6",
        to: "0x230640f6508c7a1086444c5ba62d230f395ba0e1",
        amount: 10000n
      },
      minConfirmations: 3
    });
    expect([...covered]).toEqual([]);
  });
});

describe("withRescueLock", () => {
  it("quarantines a lock whose owning process is dead", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ember-lock-"));
    const lock = join(dir, "1.lock");
    await writeFile(
      lock,
      JSON.stringify({ pid: 2_147_483_647, createdAt: new Date().toISOString() }),
      "utf8"
    );

    await expect(withRescueLock(lock, async () => "recovered")).resolves.toBe("recovered");
  });

  it("rejects a lock owned by a live process", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ember-lock-"));
    const lock = join(dir, "1.lock");
    await writeFile(
      lock,
      JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }),
      "utf8"
    );

    await expect(withRescueLock(lock, async () => "unexpected")).rejects.toThrow(
      "rescue_lock_held"
    );
  });
});

describe("deriveAnchorRescueId", () => {
  it("matches the bytes32 used by the proven live anchor", () => {
    expect(deriveAnchorRescueId("live2slots")).toBe(
      "0x2ea5d9d71a3998cdfd8f7893efd2961ddefa319d3334a2e6c99974eebee20131"
    );
  });
});

describe("runRescue dry-run journal", () => {
  it("persists deterministic replay and proof state across reruns", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ember-rescue-run-"));
    const workflowPath = join(dir, "w1.json");
    const definition = { name: "w1", description: "canonical", nodes: [], edges: [] };
    await writeFile(workflowPath, JSON.stringify(definition), "utf8");
    const context = {
      missionId: "1",
      rescueId: "deterministic",
      journalDir: dir,
      startAt: 1000,
      cadenceSeconds: 300,
      clockSkewSeconds: 0,
      nowSeconds: 1300,
      maxReplaySlots: 2,
      workflowHashExpected: `0x${canonicalSha256(definition)}`,
      w1CanonicalPath: workflowPath,
      orgBIntegrationId: "integration",
      employeeAddress: "0x230640f6508c7a1086444c5ba62d230f395ba0e1" as const,
      usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const,
      paymentAmountUsdc: 10000,
      orgAWallet: "0xB6Ed11fDceFBf213719C029e3aDc372c6701240b" as const,
      orgBWallet: "0xa45d8a46a4BC22Aae9946AE85962fA130A0aEFa6" as const,
      rpcUrl: "http://127.0.0.1:9",
      receiptConfirmations: 3,
      khBaseUrl: "https://app.keeperhub.com",
      khApiKeyStandby: "kh_test",
      executions: [],
      dryRun: true
    };

    const first = await runRescue(context);
    const second = await runRescue(context);
    const independentDryRun = await runRescue({ ...context, rescueId: "different" });
    expect(first.status).toBe("COMPLETED");
    expect(first.unpaidSlots).toEqual([1000, 1300]);
    expect(first.replays).toHaveLength(2);
    expect(second.proofHash).toBe(first.proofHash);
    expect(independentDryRun.unpaidSlots).toEqual(first.unpaidSlots);
    expect(JSON.parse(await readFile(join(dir, "1-deterministic.json"), "utf8"))).toMatchObject({
      status: "COMPLETED",
      proofFeeMode: "ESCROW_FALLBACK"
    });
  });
});

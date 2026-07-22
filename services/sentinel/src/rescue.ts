import { mkdir, open, readdir, readFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { McpHttpClient, createKeeperHubClient, parseMcpToolResult } from "@ember/kh-client";
import {
  buildProofBundle,
  canonicalSha256,
  expectedSlots,
  fetchAndRehash,
  missedSlots,
  pinJson,
  proofHashBytes32,
  serializeProofBundle,
  slotIndexAt,
  type CanonicalValue
} from "@ember/mission-core";
import type { Address, Hex } from "viem";
import { createPublicClient, http, keccak256, parseEventLogs, toBytes } from "viem";
import { baseSepolia } from "viem/chains";
import {
  verifyPaymentWithRetry,
  verifyUsdcPaymentReceipt,
  type ExpectedTransfer
} from "@ember/receipt-checker";
import type { ExecutionSummary } from "./detector.js";
import { extractCandidateHashes } from "./payments.js";

export type RescueStatus = "IN_PROGRESS" | "COMPLETED" | "ABORTED";

export interface RescueReplay {
  slot: number;
  executionId: string;
  txHash: string;
}

export interface RescueReplayIntent {
  slot: number;
  idempotencyKey: string;
  executionId?: string;
  txHash?: string;
  state: "INTENT" | "EXECUTING" | "CONFIRMED" | "FAILED";
}

export interface RescueJournal {
  version: 1;
  missionId: string;
  rescueId: string;
  status: RescueStatus;
  createdAt: string;
  updatedAt: string;
  workflowHashExpected: string;
  workflowHashComputed?: string;
  replayWorkflowId?: string;
  unpaidSlots: number[];
  replayIntents: RescueReplayIntent[];
  replays: RescueReplay[];
  stepsCompleted: string[];
  abortReason?: string;
  proofHash?: string;
  proofFeeMode?: "ESCROW_FALLBACK" | "X402" | "MPP" | "NONE";
  proofSha256?: string;
  proofCid?: string;
  proofIpfsUri?: string;
  anchorRescueId?: string;
  anchorIdempotencyKey?: string;
  anchorExecutionId?: string;
  anchorTxHash?: string;
  anchorRecoveredFromChain?: boolean;
}

export interface RescueContext {
  missionId: string;
  rescueId: string;
  journalDir: string;
  startAt: number;
  cadenceSeconds: number;
  clockSkewSeconds: number;
  nowSeconds: number;
  maxReplaySlots: number;
  workflowHashExpected: string;
  w1CanonicalPath: string;
  orgBIntegrationId: string;
  employeeAddress: Address;
  usdcAddress: Address;
  paymentAmountUsdc: number;
  orgAWallet: Address;
  orgBWallet: Address;
  rpcUrl: string;
  rpcFallbackUrl?: string;
  receiptConfirmations: number;
  khBaseUrl: string;
  khMcpUrl?: string;
  khApiKeyStandby: string;
  proofAnchorEnabled?: boolean;
  pinataJwt?: string;
  ipfsGateway?: string;
  continuityAddress?: Address;
  replayWorkflowId?: string;
  preclassifiedUnpaidSlots?: number[];
  executions: ExecutionSummary[];
  dryRun?: boolean;
}

const continuityProofAbi = [
  {
    type: "function",
    name: "anchorProof",
    stateMutability: "nonpayable",
    inputs: [
      { name: "missionId", type: "uint256" },
      { name: "rescueId", type: "bytes32" },
      { name: "proofHash", type: "bytes32" },
      { name: "ipfsUri", type: "string" },
      { name: "missedRuns", type: "uint64" },
      { name: "replayedRuns", type: "uint64" },
      { name: "feeMode", type: "uint8" },
      { name: "feeReference", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "rescueProof",
    stateMutability: "view",
    inputs: [
      { name: "missionId", type: "uint256" },
      { name: "rescueId", type: "bytes32" }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "proofHash", type: "bytes32" },
          { name: "ipfsUri", type: "string" },
          { name: "missedRuns", type: "uint64" },
          { name: "replayedRuns", type: "uint64" },
          { name: "feeMode", type: "uint8" },
          { name: "feeReference", type: "string" },
          { name: "feeClaimed", type: "bool" }
        ]
      }
    ]
  },
  {
    type: "event",
    name: "ProofAnchored",
    inputs: [
      { name: "missionId", type: "uint256", indexed: true },
      { name: "rescueId", type: "bytes32", indexed: true },
      { name: "proofHash", type: "bytes32", indexed: false },
      { name: "feeMode", type: "uint8", indexed: false },
      { name: "ipfsUri", type: "string", indexed: false },
      { name: "feeReference", type: "string", indexed: false }
    ]
  }
] as const;

interface DirectExecutionStart {
  executionId: string;
  status?: string;
}

interface DirectExecutionStatus {
  executionId: string;
  status: string;
  transactionHash?: string;
  result?: { success?: boolean; transactionHash?: string };
  error?: unknown;
}

export function deriveAnchorRescueId(rescueId: string): Hex {
  return keccak256(toBytes(rescueId));
}

interface RescueLockRecord {
  pid: number;
  createdAt: string;
}

function processIsAlive(pid: number): boolean {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function withRescueLock<T>(
  lockPath: string,
  work: () => Promise<T>,
  staleAfterMs = 30 * 60_000
): Promise<T> {
  await mkdir(join(lockPath, ".."), { recursive: true });
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      handle = await open(lockPath, "wx");
      break;
    } catch {
      let existing: RescueLockRecord | undefined;
      try {
        existing = JSON.parse(await readFile(lockPath, "utf8")) as RescueLockRecord;
      } catch {
        // A malformed lock cannot prove a live owner and is quarantined.
      }
      const createdAtMs = existing ? Date.parse(existing.createdAt) : Number.NaN;
      const stale =
        !existing ||
        !Number.isFinite(createdAtMs) ||
        Date.now() - createdAtMs > staleAfterMs ||
        !processIsAlive(existing.pid);
      if (!stale || attempt > 0) throw new Error("rescue_lock_held");
      try {
        await rename(lockPath, `${lockPath}.stale-${Date.now()}`);
      } catch {
        throw new Error("rescue_lock_held");
      }
    }
  }
  if (!handle) throw new Error("rescue_lock_held");
  try {
    const record: RescueLockRecord = { pid: process.pid, createdAt: new Date().toISOString() };
    await handle.writeFile(`${JSON.stringify(record)}\n`);
    await handle.sync();
    return await work();
  } finally {
    await handle.close();
    try {
      await rename(lockPath, `${lockPath}.released-${Date.now()}`);
    } catch {
      /* ignore */
    }
  }
}

function journalPath(dir: string, missionId: string, rescueId: string): string {
  return join(dir, `${missionId}-${rescueId}.json`);
}

async function loadOrCreateJournal(ctx: RescueContext): Promise<RescueJournal> {
  await mkdir(ctx.journalDir, { recursive: true });
  const path = journalPath(ctx.journalDir, ctx.missionId, ctx.rescueId);
  try {
    const raw = await readFile(path, "utf8");
    const journal = JSON.parse(raw) as RescueJournal;
    journal.replayIntents ??= [];
    return journal;
  } catch {
    const journal: RescueJournal = {
      version: 1,
      missionId: ctx.missionId,
      rescueId: ctx.rescueId,
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workflowHashExpected: ctx.workflowHashExpected,
      unpaidSlots: [],
      replayIntents: [],
      replays: [],
      stepsCompleted: []
    };
    await persistJournal(ctx, journal);
    return journal;
  }
}

async function persistJournal(ctx: RescueContext, journal: RescueJournal): Promise<void> {
  journal.updatedAt = new Date().toISOString();
  const path = journalPath(ctx.journalDir, ctx.missionId, ctx.rescueId);
  const temp = `${path}.tmp`;
  const handle = await open(temp, "w");
  try {
    await handle.writeFile(`${JSON.stringify(journal, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temp, path);
}

function markStep(journal: RescueJournal, step: string): void {
  if (!journal.stepsCompleted.includes(step)) journal.stepsCompleted.push(step);
}

function proofBundle(journal: RescueJournal) {
  return buildProofBundle({
    missionId: journal.missionId,
    rescueId: journal.rescueId,
    detectedAt: journal.createdAt,
    missedSlots: journal.unpaidSlots,
    replays: journal.replays,
    feeMode: "ESCROW_FALLBACK",
    receiptChecks: journal.replays.map((replay) => ({
      slot: replay.slot,
      txHash: replay.txHash,
      ok: !replay.txHash.startsWith("0xdry")
    }))
  });
}

async function storedProofMatches(ctx: RescueContext, journal: RescueJournal): Promise<boolean> {
  if (!ctx.continuityAddress || !journal.anchorRescueId || !journal.proofHash) return false;
  const client = createPublicClient({ chain: baseSepolia, transport: http(ctx.rpcUrl) });
  const stored = await client.readContract({
    address: ctx.continuityAddress,
    abi: continuityProofAbi,
    functionName: "rescueProof",
    args: [BigInt(journal.missionId), journal.anchorRescueId as Hex]
  });
  if (stored.proofHash === `0x${"0".repeat(64)}`) return false;
  if (
    stored.proofHash.toLowerCase() !== journal.proofHash.toLowerCase() ||
    stored.ipfsUri !== journal.proofIpfsUri
  ) {
    throw new Error("onchain_proof_conflict");
  }
  return true;
}

async function waitForDirectExecution(
  mcp: McpHttpClient,
  executionId: string,
  timeoutMs = 180_000
): Promise<DirectExecutionStatus> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    const raw = await mcp.callTool("get_direct_execution_status", {
      execution_id: executionId
    });
    const status = parseMcpToolResult<DirectExecutionStatus>(raw);
    const normalized = status.status.toLowerCase();
    if (normalized === "completed" || normalized === "success") return status;
    if (normalized === "failed" || normalized === "error" || normalized === "cancelled") {
      throw new Error(`proof_anchor_failed status=${status.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`proof_anchor_timeout executionId=${executionId}`);
}

async function pinAndVerifyProof(ctx: RescueContext, journal: RescueJournal): Promise<void> {
  if (!ctx.pinataJwt || !ctx.ipfsGateway) throw new Error("proof_ipfs_configuration_missing");
  const bundle = proofBundle(journal);
  const canonical = serializeProofBundle(bundle);
  const proofHash = proofHashBytes32(bundle);
  if (journal.proofHash && journal.proofHash.toLowerCase() !== proofHash.toLowerCase()) {
    throw new Error("proof_hash_changed");
  }
  journal.proofHash = proofHash;
  journal.proofFeeMode = "ESCROW_FALLBACK";

  if (!journal.proofCid) {
    const pin = await pinJson(ctx.pinataJwt, JSON.parse(canonical) as unknown);
    const canonicalBytes = new TextEncoder().encode(canonical);
    if (Buffer.compare(Buffer.from(pin.bytes), Buffer.from(canonicalBytes)) !== 0) {
      throw new Error("pinata_bytes_not_canonical");
    }
    if (`0x${pin.sha256}`.toLowerCase() !== proofHash.toLowerCase()) {
      throw new Error("pinata_hash_mismatch");
    }
    journal.proofSha256 = pin.sha256;
    journal.proofCid = pin.cid;
    journal.proofIpfsUri = `ipfs://${pin.cid}`;
    await persistJournal(ctx, journal);
  }
  if (!journal.proofSha256 || !journal.proofCid) throw new Error("proof_pin_incomplete");
  await fetchAndRehash(ctx.ipfsGateway, journal.proofCid, journal.proofSha256);
  markStep(journal, "proof_ipfs_verified");
  await persistJournal(ctx, journal);
}

async function anchorProof(ctx: RescueContext, journal: RescueJournal): Promise<void> {
  if (!ctx.khMcpUrl || !ctx.continuityAddress || !journal.proofHash || !journal.proofIpfsUri) {
    throw new Error("proof_anchor_configuration_missing");
  }
  journal.anchorRescueId ??= deriveAnchorRescueId(journal.rescueId);
  journal.anchorIdempotencyKey ??= `ember-anchor-${journal.missionId}-${journal.rescueId}`;
  await persistJournal(ctx, journal);

  if (await storedProofMatches(ctx, journal)) {
    journal.anchorRecoveredFromChain = true;
    markStep(journal, "proof_anchored");
    await persistJournal(ctx, journal);
    return;
  }

  const mcp = new McpHttpClient(ctx.khMcpUrl, ctx.khApiKeyStandby);
  await mcp.initialize();
  let started: DirectExecutionStart;
  try {
    const raw = await mcp.callTool("execute_contract_call", {
      contract_address: ctx.continuityAddress,
      chain_id: String(baseSepolia.id),
      function_name: "anchorProof",
      function_args: JSON.stringify([
        journal.missionId,
        journal.anchorRescueId,
        journal.proofHash,
        journal.proofIpfsUri,
        String(journal.unpaidSlots.length),
        String(journal.replays.length),
        "3",
        "escrow-fallback"
      ]),
      abi: JSON.stringify(continuityProofAbi),
      idempotency_key: journal.anchorIdempotencyKey
    });
    started = parseMcpToolResult<DirectExecutionStart>(raw);
  } catch (error) {
    if (await storedProofMatches(ctx, journal)) {
      journal.anchorRecoveredFromChain = true;
      markStep(journal, "proof_anchored");
      await persistJournal(ctx, journal);
      return;
    }
    throw error;
  }
  if (!started.executionId) throw new Error("proof_anchor_execution_id_missing");
  journal.anchorExecutionId = started.executionId;
  await persistJournal(ctx, journal);

  const terminal = await waitForDirectExecution(mcp, started.executionId);
  const txHash = terminal.transactionHash ?? terminal.result?.transactionHash;
  if (!txHash?.startsWith("0x") || terminal.result?.success === false) {
    throw new Error("proof_anchor_transaction_missing");
  }
  const client = createPublicClient({ chain: baseSepolia, transport: http(ctx.rpcUrl) });
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash as Hex,
    confirmations: ctx.receiptConfirmations,
    timeout: 180_000
  });
  if (receipt.status !== "success") throw new Error("proof_anchor_transaction_reverted");
  const events = parseEventLogs({
    abi: continuityProofAbi,
    eventName: "ProofAnchored",
    logs: receipt.logs,
    strict: true
  });
  const matchingEvent = events.some(
    (event) =>
      event.args.missionId === BigInt(journal.missionId) &&
      event.args.rescueId.toLowerCase() === journal.anchorRescueId?.toLowerCase() &&
      event.args.proofHash.toLowerCase() === journal.proofHash?.toLowerCase()
  );
  if (!matchingEvent) throw new Error("proof_anchor_event_missing");
  if (!(await storedProofMatches(ctx, journal))) throw new Error("proof_anchor_storage_missing");
  journal.anchorTxHash = txHash;
  markStep(journal, "proof_anchored");
  await persistJournal(ctx, journal);
}

async function computeW1Hash(path: string): Promise<{
  hash: string;
  definition: { name: string; description: string; nodes: unknown[]; edges: unknown[] };
}> {
  const { readFile } = await import("node:fs/promises");
  const raw = JSON.parse(await readFile(path, "utf8")) as {
    name: string;
    description?: string;
    nodes: unknown[];
    edges: unknown[];
  };
  const canonical: CanonicalValue = {
    name: raw.name,
    description: raw.description ?? "",
    nodes: raw.nodes as CanonicalValue,
    edges: raw.edges as CanonicalValue
  };
  return {
    hash: `0x${canonicalSha256(canonical)}`,
    definition: {
      name: raw.name,
      description: raw.description ?? "",
      nodes: raw.nodes,
      edges: raw.edges
    }
  };
}

/**
 * Replay txs land at "now", so block.timestamp cannot mark historical missed slots.
 * Completed journal replays bind (slotId → verified Org B receipt) for mission-wide idempotency.
 */
export async function loadJournalCoveredSlots(params: {
  journalDir: string;
  missionId: string;
  rpcUrl: string;
  expectedOrgB: ExpectedTransfer;
  minConfirmations: number;
}): Promise<Set<number>> {
  const covered = new Set<number>();
  let names: string[] = [];
  try {
    names = await readdir(params.journalDir);
  } catch {
    return covered;
  }
  const client = createPublicClient({ chain: baseSepolia, transport: http(params.rpcUrl) });
  const prefix = `${params.missionId}-`;
  for (const name of names) {
    if (!name.startsWith(prefix) || !name.endsWith(".json") || name.includes(".tmp")) continue;
    let journal: RescueJournal;
    try {
      journal = JSON.parse(await readFile(join(params.journalDir, name), "utf8")) as RescueJournal;
    } catch {
      continue;
    }
    if (journal.missionId !== params.missionId) continue;
    for (const replay of journal.replays ?? []) {
      if (!replay.txHash?.startsWith("0x") || replay.txHash.startsWith("0xdry")) {
        continue;
      }
      const verified = await verifyUsdcPaymentReceipt({
        client,
        hash: replay.txHash as Hex,
        expected: params.expectedOrgB,
        minConfirmations: params.minConfirmations
      });
      if (verified.ok) covered.add(replay.slot);
    }
  }
  return covered;
}

export async function classifyUnpaid(ctx: RescueContext): Promise<number[]> {
  const client = createPublicClient({ chain: baseSepolia, transport: http(ctx.rpcUrl) });
  const expectedOrgA: ExpectedTransfer = {
    token: ctx.usdcAddress,
    from: ctx.orgAWallet,
    to: ctx.employeeAddress,
    amount: BigInt(ctx.paymentAmountUsdc)
  };
  const expectedOrgB: ExpectedTransfer = {
    token: ctx.usdcAddress,
    from: ctx.orgBWallet,
    to: ctx.employeeAddress,
    amount: BigInt(ctx.paymentAmountUsdc)
  };
  const paidSlots = await loadJournalCoveredSlots({
    journalDir: ctx.journalDir,
    missionId: ctx.missionId,
    rpcUrl: ctx.rpcUrl,
    expectedOrgB,
    minConfirmations: ctx.receiptConfirmations
  });
  for (const candidate of extractCandidateHashes(ctx.executions)) {
    for (const expected of [expectedOrgA, expectedOrgB]) {
      const result = await verifyUsdcPaymentReceipt({
        client,
        hash: candidate.hash,
        expected,
        minConfirmations: ctx.receiptConfirmations
      });
      if (!result.ok || result.blockTimestamp === undefined) continue;
      const index = slotIndexAt(
        ctx.startAt,
        ctx.cadenceSeconds,
        result.blockTimestamp + ctx.clockSkewSeconds
      );
      if (index === undefined) continue;
      paidSlots.add(ctx.startAt + ctx.cadenceSeconds * index);
      break;
    }
  }
  const expected = expectedSlots(
    ctx.startAt,
    ctx.cadenceSeconds,
    ctx.nowSeconds,
    ctx.clockSkewSeconds
  );
  const unpaid = missedSlots(expected, paidSlots);
  return unpaid.slice(0, ctx.maxReplaySlots);
}

function rewriteForOrgB(
  definition: { name: string; description: string; nodes: unknown[]; edges: unknown[] },
  integrationId: string
): { name: string; description: string; nodes: unknown[]; edges: unknown[]; enabled: boolean } {
  const nodes = structuredClone(definition.nodes) as Array<{
    data?: { config?: Record<string, unknown> };
  }>;
  for (const node of nodes) {
    const config = node.data?.config;
    if (!config) continue;
    if (config.actionType === "web3/transfer-token") {
      config.integrationId = integrationId;
    }
  }
  return {
    name: `${definition.name}-orgb-replay`,
    description: `EMBER W1' disabled replay copy for Org B rescue. ${definition.description}`,
    nodes,
    edges: definition.edges,
    enabled: false
  };
}

export async function runRescue(ctx: RescueContext): Promise<RescueJournal> {
  const lockPath = join(ctx.journalDir, `${ctx.missionId}.lock`);
  return withRescueLock(lockPath, async () => {
    const journal = await loadOrCreateJournal(ctx);
    if (journal.status === "COMPLETED") return journal;

    const kh = createKeeperHubClient({
      baseUrl: ctx.khBaseUrl,
      apiKey: ctx.khApiKeyStandby,
      timeoutMs: 120_000
    });

    if (!journal.stepsCompleted.includes("hash_check")) {
      const { hash, definition } = await computeW1Hash(ctx.w1CanonicalPath);
      journal.workflowHashComputed = hash;
      if (hash.toLowerCase() !== ctx.workflowHashExpected.toLowerCase()) {
        journal.status = "ABORTED";
        journal.abortReason = `workflow_hash_mismatch expected=${ctx.workflowHashExpected} computed=${hash}`;
        await persistJournal(ctx, journal);
        return journal;
      }
      markStep(journal, "hash_check");
      await persistJournal(ctx, journal);
      // stash definition on next steps via recompute
      void definition;
    }

    if (!journal.stepsCompleted.includes("ensure_replay_workflow")) {
      if (ctx.replayWorkflowId) {
        journal.replayWorkflowId = ctx.replayWorkflowId;
      } else if (!ctx.dryRun) {
        const { definition } = await computeW1Hash(ctx.w1CanonicalPath);
        const body = rewriteForOrgB(definition, ctx.orgBIntegrationId);
        const created = await kh.workflows.create(body);
        journal.replayWorkflowId = created.id;
      } else {
        journal.replayWorkflowId = "dry-run-replay-workflow";
      }
      markStep(journal, "ensure_replay_workflow");
      await persistJournal(ctx, journal);
    }

    if (!journal.stepsCompleted.includes("classify")) {
      journal.unpaidSlots = ctx.preclassifiedUnpaidSlots ?? (await classifyUnpaid(ctx));
      markStep(journal, "classify");
      await persistJournal(ctx, journal);
    }

    if (!journal.stepsCompleted.includes("replay")) {
      const already = new Set(journal.replays.map((item) => item.slot));
      for (const slot of journal.unpaidSlots) {
        if (already.has(slot)) continue;
        if (ctx.dryRun) {
          journal.replays.push({ slot, executionId: `dry-${slot}`, txHash: `0xdry${slot}` });
          await persistJournal(ctx, journal);
          continue;
        }
        if (!journal.replayWorkflowId) throw new Error("replay_workflow_missing");
        let intent = journal.replayIntents.find((item) => item.slot === slot);
        if (!intent) {
          intent = {
            slot,
            idempotencyKey: `ember-replay-${ctx.missionId}-${slot}`,
            state: "INTENT"
          };
          journal.replayIntents.push(intent);
          await persistJournal(ctx, journal);
        }
        const started = await kh.workflows.execute(
          journal.replayWorkflowId,
          { slot },
          { idempotencyKey: intent.idempotencyKey }
        );
        intent.executionId = started.executionId;
        intent.state = "EXECUTING";
        await persistJournal(ctx, journal);
        const waited = await kh.workflows.waitForExecution(started.executionId, 60_000);
        const txHash = waited.transactionHashes?.[0]?.hash;
        if (waited.status.toLowerCase() !== "success" || !txHash) {
          intent.state = "FAILED";
          journal.status = "ABORTED";
          journal.abortReason = `replay_failed slot=${slot} status=${waited.status}`;
          await persistJournal(ctx, journal);
          return journal;
        }
        // Verify Org B → employee transfer before counting
        const verified = await verifyPaymentWithRetry({
          clients: [ctx.rpcUrl, ctx.rpcFallbackUrl]
            .filter((url): url is string => Boolean(url))
            .map((url) => createPublicClient({ chain: baseSepolia, transport: http(url) })),
          hash: txHash as Hex,
          expected: {
            token: ctx.usdcAddress,
            from: ctx.orgBWallet,
            to: ctx.employeeAddress,
            amount: BigInt(ctx.paymentAmountUsdc)
          },
          minConfirmations: ctx.receiptConfirmations
        });
        if (!verified.ok) {
          intent.state = "FAILED";
          journal.status = "ABORTED";
          journal.abortReason = `replay_receipt_mismatch slot=${slot} reason=${verified.reason}`;
          await persistJournal(ctx, journal);
          return journal;
        }
        intent.txHash = txHash;
        intent.state = "CONFIRMED";
        journal.replays.push({ slot, executionId: started.executionId, txHash });
        await persistJournal(ctx, journal);
      }
      markStep(journal, "replay");
      await persistJournal(ctx, journal);
    }

    if (!journal.stepsCompleted.includes("proof_scaffold")) {
      const bundle = proofBundle(journal);
      journal.proofHash = proofHashBytes32(bundle);
      journal.proofFeeMode = "ESCROW_FALLBACK";
      markStep(journal, "proof_scaffold");
      await persistJournal(ctx, journal);
    }

    if (ctx.proofAnchorEnabled && !ctx.dryRun) {
      if (!journal.stepsCompleted.includes("proof_ipfs_verified")) {
        await pinAndVerifyProof(ctx, journal);
      }
      if (!journal.stepsCompleted.includes("proof_anchored")) {
        await anchorProof(ctx, journal);
      }
    }

    journal.status = "COMPLETED";
    markStep(journal, "done");
    await persistJournal(ctx, journal);
    return journal;
  });
}

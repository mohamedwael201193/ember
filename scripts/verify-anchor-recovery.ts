import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type { Address } from "viem";
import {
  deriveAnchorRescueId,
  runRescue,
  type RescueJournal
} from "../services/sentinel/src/rescue.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const source = JSON.parse(
  await readFile(
    resolve(process.argv[2] ?? "services/sentinel/runtime/rescues/1-live2slots.json"),
    "utf8"
  )
) as RescueJournal;
const evidenceRaw = await readFile(
  resolve(process.argv[3] ?? "docs/evidence/proof-live2slots.json"),
  "utf8"
);
const evidence = JSON.parse(evidenceRaw.replace(/\\n\s*$/, "")) as {
  proofHash: string;
  sha256: string;
  cid: string;
  ipfsUri: string;
};
const directory = await mkdtemp(join(tmpdir(), "ember-anchor-recovery-"));
const journal: RescueJournal = {
  ...source,
  status: "IN_PROGRESS",
  replayIntents: source.replayIntents ?? [],
  stepsCompleted: [
    "hash_check",
    "ensure_replay_workflow",
    "classify",
    "replay",
    "proof_scaffold",
    "proof_ipfs_verified"
  ],
  proofHash: evidence.proofHash,
  proofSha256: evidence.sha256,
  proofCid: evidence.cid,
  proofIpfsUri: evidence.ipfsUri,
  proofFeeMode: "ESCROW_FALLBACK",
  anchorRescueId: deriveAnchorRescueId(source.rescueId)
};
await writeFile(
  join(directory, `${journal.missionId}-${journal.rescueId}.json`),
  JSON.stringify(journal)
);

try {
  const result = await runRescue({
    missionId: journal.missionId,
    rescueId: journal.rescueId,
    journalDir: directory,
    startAt: Number(required("MISSION_START_AT")),
    cadenceSeconds: Number(required("CADENCE_SECONDS")),
    clockSkewSeconds: Number(required("CLOCK_SKEW_SECONDS")),
    nowSeconds: Math.floor(Date.now() / 1000),
    maxReplaySlots: Number(required("MAX_REPLAY_SLOTS")),
    workflowHashExpected: journal.workflowHashExpected,
    w1CanonicalPath: resolve("workflows/w1-payday-stream.json"),
    orgBIntegrationId: required("ORG_B_WALLET_INTEGRATION_ID"),
    employeeAddress: required("EMPLOYEE_ADDRESS") as Address,
    usdcAddress: required("USDC_ADDRESS_BASE_SEPOLIA") as Address,
    paymentAmountUsdc: Number(required("PAYMENT_AMOUNT_USDC")),
    orgAWallet: required("ORG_A_WALLET_ADDRESS") as Address,
    orgBWallet: required("ORG_B_WALLET_ADDRESS") as Address,
    rpcUrl: required("BASE_SEPOLIA_RPC_URL"),
    receiptConfirmations: Number(required("RECEIPT_CONFIRMATIONS")),
    khBaseUrl: required("KH_API_BASE"),
    khMcpUrl: required("KH_MCP_URL"),
    khApiKeyStandby: required("KH_API_KEY_STANDBY"),
    proofAnchorEnabled: true,
    pinataJwt: "not-used-for-recovery",
    ipfsGateway: required("IPFS_GATEWAY"),
    continuityAddress: required("CONTINUITY_ADDRESS_SEPOLIA") as Address,
    executions: []
  });
  if (
    result.status !== "COMPLETED" ||
    !result.anchorRecoveredFromChain ||
    !result.stepsCompleted.includes("proof_anchored")
  ) {
    throw new Error("anchor recovery validation failed");
  }
  console.log(
    JSON.stringify({
      status: result.status,
      rescueId: result.rescueId,
      anchorRecoveredFromChain: result.anchorRecoveredFromChain,
      proofHash: result.proofHash
    })
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createPublicClient, http, keccak256, toBytes, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { fetchAndRehash } from "../packages/mission-core/src/index.js";
import { verifyUsdcPaymentReceipt } from "../packages/receipt-checker/src/index.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse((await readFile(resolve(path), "utf8")).replace(/^\uFEFF/, ""));
}

const abi = [
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
  }
] as const;

const evidence = (await readJson(
  process.argv[2] ?? "docs/evidence/post-fix-three-drills.json"
)) as {
  missionId: string;
  pass: boolean;
  drills: Array<{
    rescueId: string;
    slots: number[];
    replayTxHashes: Hex[];
    proofHash: Hex;
    cid: string;
    anchorTxHash: Hex;
    updatedAt: string;
    rerunUpdatedAt: string;
  }>;
};
if (!evidence.pass || evidence.drills.length !== 3) throw new Error("invalid drill evidence");
const chaos = (await readJson("docs/evidence/chaos-sentinel-mid-replay.json")) as {
  pass: boolean;
  rescueId: string;
  observedIntentState: string;
  slots: number[];
  replayTxHashes: Hex[];
  proofHash: Hex;
  proofCid: string;
  anchorTxHash: Hex;
  completedUpdatedAt: string;
  rerunUpdatedAt: string;
};
if (!chaos.pass || chaos.observedIntentState !== "EXECUTING") {
  throw new Error("invalid mid-replay chaos evidence");
}
const drills = [
  ...evidence.drills,
  {
    rescueId: chaos.rescueId,
    slots: chaos.slots,
    replayTxHashes: chaos.replayTxHashes,
    proofHash: chaos.proofHash,
    cid: chaos.proofCid,
    anchorTxHash: chaos.anchorTxHash,
    updatedAt: chaos.completedUpdatedAt,
    rerunUpdatedAt: chaos.rerunUpdatedAt
  }
];

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(required("BASE_SEPOLIA_RPC_URL"))
});
const expected = {
  token: required("USDC_ADDRESS_BASE_SEPOLIA") as Address,
  from: required("ORG_B_WALLET_ADDRESS") as Address,
  to: required("EMPLOYEE_ADDRESS") as Address,
  amount: BigInt(required("PAYMENT_AMOUNT_USDC"))
};
const continuity = required("CONTINUITY_ADDRESS_SEPOLIA") as Address;
const slots = new Set<number>();
const replayTransactions = new Set<string>();

for (const drill of drills) {
  if (drill.updatedAt !== drill.rerunUpdatedAt) throw new Error("rerun mutated completed journal");
  for (let index = 0; index < drill.slots.length; index += 1) {
    const slot = drill.slots[index]!;
    const txHash = drill.replayTxHashes[index]!;
    if (slots.has(slot) || replayTransactions.has(txHash.toLowerCase())) {
      throw new Error("duplicate slot or replay transaction");
    }
    slots.add(slot);
    replayTransactions.add(txHash.toLowerCase());
    const verified = await verifyUsdcPaymentReceipt({
      client,
      hash: txHash,
      expected,
      minConfirmations: Number(required("RECEIPT_CONFIRMATIONS"))
    });
    if (!verified.ok) throw new Error(`replay receipt failed: ${verified.reason}`);
  }

  await fetchAndRehash(required("IPFS_GATEWAY"), drill.cid, drill.proofHash.slice(2));
  const stored = await client.readContract({
    address: continuity,
    abi,
    functionName: "rescueProof",
    args: [BigInt(evidence.missionId), keccak256(toBytes(drill.rescueId))]
  });
  if (
    stored.proofHash.toLowerCase() !== drill.proofHash.toLowerCase() ||
    stored.ipfsUri !== `ipfs://${drill.cid}` ||
    stored.missedRuns !== 2n ||
    stored.replayedRuns !== 2n
  ) {
    throw new Error("stored proof does not match drill evidence");
  }
  const anchorReceipt = await client.getTransactionReceipt({ hash: drill.anchorTxHash });
  if (anchorReceipt.status !== "success") throw new Error("anchor transaction reverted");
}

console.log(
  JSON.stringify({
    pass: true,
    consecutiveDrills: evidence.drills.length,
    midReplayCrashDrills: 1,
    uniqueSlots: slots.size,
    uniqueReplayTransactions: replayTransactions.size,
    fetchedAndRehashedProofs: drills.length,
    verifiedAnchors: drills.length
  })
);

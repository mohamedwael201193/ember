import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import {
  buildProofBundle,
  fetchAndRehash,
  pinJson,
  proofHashBytes32,
  serializeProofBundle
} from "../packages/mission-core/src/index.js";
import { verifyUsdcPaymentReceipt } from "../packages/receipt-checker/src/index.js";

interface Journal {
  missionId: string;
  rescueId: string;
  createdAt: string;
  unpaidSlots: number[];
  replays: Array<{ slot: number; executionId: string; txHash: Hex }>;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function assertNoSecretFields(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSecretFields(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (/(secret|private.?key|api.?key|jwt|authorization|bearer)/i.test(key)) {
      throw new Error(`secret-shaped proof field rejected at ${path}.${key}`);
    }
    assertNoSecretFields(child, `${path}.${key}`);
  }
}

const journalPath = resolve(
  process.argv[2] ?? "services/sentinel/runtime/rescues/1-live2slots.json"
);
const outputPath = resolve(process.argv[3] ?? "docs/evidence/proof-live2slots.json");
const journal = JSON.parse(await readFile(journalPath, "utf8")) as Journal;
const rpcUrl = required("BASE_SEPOLIA_RPC_URL");
const client = createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) });
const expected = {
  token: required("USDC_ADDRESS_BASE_SEPOLIA") as Address,
  from: required("ORG_B_WALLET_ADDRESS") as Address,
  to: required("EMPLOYEE_ADDRESS") as Address,
  amount: BigInt(required("PAYMENT_AMOUNT_USDC"))
};

const receiptChecks = [];
for (const replay of journal.replays) {
  const check = await verifyUsdcPaymentReceipt({
    client,
    hash: replay.txHash,
    expected,
    minConfirmations: Number(required("RECEIPT_CONFIRMATIONS"))
  });
  if (!check.ok) {
    throw new Error(`replay receipt ${replay.txHash} failed: ${check.reason}`);
  }
  receiptChecks.push({ slot: replay.slot, txHash: replay.txHash, ok: true });
}

const bundle = buildProofBundle({
  missionId: journal.missionId,
  rescueId: journal.rescueId,
  detectedAt: journal.createdAt,
  missedSlots: journal.unpaidSlots,
  receiptChecks,
  replays: journal.replays,
  feeMode: "ESCROW_FALLBACK"
});
assertNoSecretFields(bundle);

// Parsing canonical JSON preserves its sorted insertion order, so pinJson hashes
// and uploads the exact same bytes returned by serializeProofBundle.
const canonical = serializeProofBundle(bundle);
const canonicalObject = JSON.parse(canonical) as unknown;
const pin = await pinJson(required("PINATA_JWT"), canonicalObject);
const canonicalBytes = new TextEncoder().encode(canonical);
if (Buffer.compare(Buffer.from(pin.bytes), Buffer.from(canonicalBytes)) !== 0) {
  throw new Error("Pinata request bytes differ from canonical proof bytes");
}
await fetchAndRehash(required("IPFS_GATEWAY"), pin.cid, pin.sha256);

const evidence = {
  version: 1,
  missionId: journal.missionId,
  rescueId: journal.rescueId,
  proofHash: proofHashBytes32(bundle),
  sha256: pin.sha256,
  cid: pin.cid,
  ipfsUri: `ipfs://${pin.cid}`,
  missedRuns: bundle.missedSlots.length,
  replayedRuns: bundle.replays.length,
  feeMode: bundle.feeMode,
  receiptChecks,
  bundle,
  fetchedBackAndRehashed: true,
  verifiedAt: new Date().toISOString()
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify({
    proofHash: evidence.proofHash,
    cid: evidence.cid,
    missedRuns: evidence.missedRuns,
    replayedRuns: evidence.replayedRuns,
    fetchedBackAndRehashed: true
  })
);

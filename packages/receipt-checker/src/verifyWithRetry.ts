import type { Hex } from "viem";
import {
  verifyUsdcPaymentReceipt,
  type PaymentVerificationResult,
  type ReceiptRpcClient
} from "./verifyPayment.js";
import type { ExpectedTransfer } from "./usdcTransferLog.js";

export async function verifyPaymentWithRetry(params: {
  clients: ReceiptRpcClient[];
  hash: Hex;
  expected: ExpectedTransfer;
  minConfirmations: number;
  timeoutMs?: number;
  pollMs?: number;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
}): Promise<PaymentVerificationResult> {
  const timeoutMs = params.timeoutMs ?? 180_000;
  const pollMs = params.pollMs ?? 2_000;
  const now = params.now ?? Date.now;
  const sleep =
    params.sleep ??
    ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const startedAt = now();
  let last: PaymentVerificationResult | undefined;

  while (now() - startedAt <= timeoutMs) {
    for (const client of params.clients) {
      last = await verifyUsdcPaymentReceipt({
        client,
        hash: params.hash,
        expected: params.expected,
        minConfirmations: params.minConfirmations
      });
      if (last.ok) return last;
      if (last.reason === "tx_reverted" || last.reason === "transfer_mismatch") return last;
    }
    await sleep(pollMs);
  }
  return last ?? { ok: false, txHash: params.hash, reason: "receipt_timeout" };
}

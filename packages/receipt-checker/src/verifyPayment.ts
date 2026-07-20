import type { Hex, TransactionReceipt } from "viem";
import { isExpectedErc20Transfer, type ExpectedTransfer } from "./usdcTransferLog.js";

export interface PaymentVerificationResult {
  ok: boolean;
  txHash: Hex;
  reason?: string;
  blockNumber?: bigint;
  blockTimestamp?: number;
  confirmations?: number;
}

/** Minimal RPC surface — avoids PublicClient version skew across workspace copies of viem. */
export interface ReceiptRpcClient {
  getTransactionReceipt(args: { hash: Hex }): Promise<TransactionReceipt>;
  getBlockNumber(): Promise<bigint>;
  getBlock(args: { blockNumber: bigint }): Promise<{ timestamp: bigint | number }>;
}

export function receiptHasExpectedTransfer(
  receipt: Pick<TransactionReceipt, "status" | "logs">,
  expected: ExpectedTransfer
): boolean {
  if (receipt.status !== "success") return false;
  return receipt.logs.some((log) => isExpectedErc20Transfer(log, expected));
}

export async function verifyUsdcPaymentReceipt(params: {
  client: ReceiptRpcClient;
  hash: Hex;
  expected: ExpectedTransfer;
  minConfirmations?: number;
}): Promise<PaymentVerificationResult> {
  const { client, hash, expected, minConfirmations = 1 } = params;
  let receipt: TransactionReceipt;
  try {
    receipt = await client.getTransactionReceipt({ hash });
  } catch {
    return { ok: false, txHash: hash, reason: "receipt_not_found" };
  }

  if (receipt.status !== "success") {
    return { ok: false, txHash: hash, reason: "tx_reverted", blockNumber: receipt.blockNumber };
  }
  if (!receiptHasExpectedTransfer(receipt, expected)) {
    return {
      ok: false,
      txHash: hash,
      reason: "transfer_mismatch",
      blockNumber: receipt.blockNumber
    };
  }

  const latest = await client.getBlockNumber();
  const confirmations = Number(latest - receipt.blockNumber) + 1;
  if (confirmations < minConfirmations) {
    return {
      ok: false,
      txHash: hash,
      reason: "insufficient_confirmations",
      blockNumber: receipt.blockNumber,
      confirmations
    };
  }

  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  return {
    ok: true,
    txHash: hash,
    blockNumber: receipt.blockNumber,
    blockTimestamp: Number(block.timestamp),
    confirmations
  };
}

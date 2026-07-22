import { createPublicClient, http, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import { verifyUsdcPaymentReceipt, type ExpectedTransfer } from "@ember/receipt-checker";
import type { ExecutionSummary } from "./detector.js";

export interface VerifiedPayment {
  executionId: string;
  txHash: Hex;
  blockTimestamp: number;
}

export function extractCandidateHashes(
  executions: ExecutionSummary[]
): Array<{ executionId: string; hash: Hex }> {
  const out: Array<{ executionId: string; hash: Hex }> = [];
  for (const execution of executions) {
    if (execution.status.toLowerCase() !== "success") continue;
    for (const entry of execution.transactionHashes ?? []) {
      if (!entry.hash?.startsWith("0x")) continue;
      out.push({ executionId: execution.id, hash: entry.hash as Hex });
    }
  }
  return out;
}

export async function verifyExecutionPayments(params: {
  rpcUrl: string;
  rpcFallbackUrl?: string;
  executions: ExecutionSummary[];
  expected: ExpectedTransfer;
  minConfirmations: number;
}): Promise<VerifiedPayment[]> {
  const transports = [params.rpcUrl, params.rpcFallbackUrl].filter(Boolean) as string[];
  let lastError: unknown;
  for (const url of transports) {
    try {
      const client = createPublicClient({ chain: baseSepolia, transport: http(url) });
      const verified: VerifiedPayment[] = [];
      const seen = new Set<string>();
      for (const candidate of extractCandidateHashes(params.executions)) {
        if (seen.has(candidate.hash.toLowerCase())) continue;
        seen.add(candidate.hash.toLowerCase());
        const result = await verifyUsdcPaymentReceipt({
          client,
          hash: candidate.hash,
          expected: params.expected,
          minConfirmations: params.minConfirmations
        });
        if (result.ok && result.blockTimestamp !== undefined) {
          verified.push({
            executionId: candidate.executionId,
            txHash: candidate.hash,
            blockTimestamp: result.blockTimestamp
          });
        }
      }
      return verified;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("rpc_unavailable");
}

export function expectedTransferFromEnv(env: {
  USDC_ADDRESS_BASE_SEPOLIA?: string;
  ORG_A_WALLET_ADDRESS?: string;
  EMPLOYEE_ADDRESS?: string;
  PAYMENT_AMOUNT_USDC: number;
}): ExpectedTransfer {
  const token = env.USDC_ADDRESS_BASE_SEPOLIA;
  const from = env.ORG_A_WALLET_ADDRESS;
  const to = env.EMPLOYEE_ADDRESS;
  if (!token || !from || !to) {
    throw new Error("missing_transfer_addresses");
  }
  return {
    token: token as Address,
    from: from as Address,
    to: to as Address,
    amount: BigInt(env.PAYMENT_AMOUNT_USDC)
  };
}

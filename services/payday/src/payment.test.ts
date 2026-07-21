import { describe, expect, it } from "vitest";
import { encodeAbiParameters, encodeEventTopics, parseAbiParameters } from "viem";
import {
  erc20TransferAbi,
  verifyPaymentWithRetry,
  type ExpectedTransfer,
  type ReceiptRpcClient
} from "@ember/receipt-checker";

const expected: ExpectedTransfer = {
  token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  from: "0xB6Ed11fDceFBf213719C029e3aDc372c6701240b",
  to: "0x230640f6508c7a1086444c5ba62d230f395ba0e1",
  amount: 10000n
};
const hash = `0x${"1".repeat(64)}` as const;

function matchingClient(latestBlocks: bigint[]): ReceiptRpcClient {
  const topics = encodeEventTopics({
    abi: erc20TransferAbi,
    eventName: "Transfer",
    args: { from: expected.from, to: expected.to }
  });
  const data = encodeAbiParameters(parseAbiParameters("uint256"), [expected.amount]);
  return {
    async getTransactionReceipt() {
      return {
        status: "success",
        blockNumber: 100n,
        logs: [{ address: expected.token, topics, data }]
      } as never;
    },
    async getBlockNumber() {
      return latestBlocks.shift() ?? 102n;
    },
    async getBlock() {
      return { timestamp: 1234n };
    }
  };
}

describe("verifyPaymentWithRetry", () => {
  it("waits until the required confirmation depth", async () => {
    let now = 0;
    const result = await verifyPaymentWithRetry({
      clients: [matchingClient([100n, 102n])],
      hash,
      expected,
      minConfirmations: 3,
      timeoutMs: 10,
      pollMs: 1,
      now: () => now,
      sleep: async () => {
        now += 1;
      }
    });
    expect(result.ok).toBe(true);
    expect(result.confirmations).toBe(3);
  });

  it("fails immediately on a transfer mismatch", async () => {
    let slept = false;
    const client = matchingClient([100n]);
    client.getTransactionReceipt = async () =>
      ({ status: "success", blockNumber: 100n, logs: [] }) as never;
    const result = await verifyPaymentWithRetry({
      clients: [client],
      hash,
      expected,
      minConfirmations: 1,
      sleep: async () => {
        slept = true;
      }
    });
    expect(result.reason).toBe("transfer_mismatch");
    expect(slept).toBe(false);
  });
});

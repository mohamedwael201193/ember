import { describe, expect, it } from "vitest";
import { receiptHasExpectedTransfer } from "./verifyPayment.js";
import type { TransactionReceipt } from "viem";
import { encodeEventTopics, encodeAbiParameters, parseAbiParameters } from "viem";
import { erc20TransferAbi } from "./usdcTransferLog.js";

const token = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const from = "0xB6Ed11fDceFBf213719C029e3aDc372c6701240b" as const;
const to = "0x230640f6508c7a1086444c5ba62d230f395ba0e1" as const;

describe("receiptHasExpectedTransfer", () => {
  it("accepts matching Transfer log on success receipt", () => {
    const topics = encodeEventTopics({
      abi: erc20TransferAbi,
      eventName: "Transfer",
      args: { from, to }
    });
    const data = encodeAbiParameters(parseAbiParameters("uint256"), [10000n]);
    const receipt = {
      status: "success",
      logs: [{ address: token, topics, data }]
    } as unknown as TransactionReceipt;
    expect(receiptHasExpectedTransfer(receipt, { token, from, to, amount: 10000n })).toBe(true);
  });

  it("rejects reverted receipts", () => {
    const receipt = { status: "reverted", logs: [] } as unknown as TransactionReceipt;
    expect(receiptHasExpectedTransfer(receipt, { token, from, to, amount: 10000n })).toBe(false);
  });
});

import { encodeAbiParameters, encodeEventTopics, type Address, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import { erc20TransferAbi, isExpectedErc20Transfer } from "./usdcTransferLog.js";

describe("ERC-20 Transfer receipt verification", () => {
  it("matches an exact Transfer log without a network call", () => {
    const token = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;
    const from = "0x0000000000000000000000000000000000000001" as Address;
    const to = "0x0000000000000000000000000000000000000002" as Address;
    const amount = 10_000n;
    const log = {
      address: token,
      topics: encodeEventTopics({
        abi: erc20TransferAbi,
        eventName: "Transfer",
        args: { from, to }
      }) as [Hex, ...Hex[]],
      data: encodeAbiParameters([{ type: "uint256" }], [amount])
    };

    expect(isExpectedErc20Transfer(log, { token, from, to, amount })).toBe(true);
    expect(isExpectedErc20Transfer(log, { token, from, to, amount: amount + 1n })).toBe(false);
  });
});

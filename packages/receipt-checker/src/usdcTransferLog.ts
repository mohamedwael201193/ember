import { decodeEventLog, type Address, type Hex, type Log } from "viem";

export const erc20TransferAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" }
    ]
  }
] as const;

export interface ExpectedTransfer {
  token: Address;
  from: Address;
  to: Address;
  amount: bigint;
}

export function isExpectedErc20Transfer(
  log: Pick<Log, "address" | "data" | "topics">,
  expected: ExpectedTransfer
): boolean {
  if (log.address.toLowerCase() !== expected.token.toLowerCase()) return false;
  try {
    const decoded = decodeEventLog({
      abi: erc20TransferAbi,
      eventName: "Transfer",
      data: log.data as Hex,
      topics: log.topics as [Hex, ...Hex[]],
      strict: true
    });
    return (
      decoded.args.from?.toLowerCase() === expected.from.toLowerCase() &&
      decoded.args.to?.toLowerCase() === expected.to.toLowerCase() &&
      decoded.args.value === expected.amount
    );
  } catch {
    return false;
  }
}

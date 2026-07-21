import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { isExpectedErc20Transfer } from "./packages/receipt-checker/src/usdcTransferLog.ts";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL!)
});
const hashes = [
  "0x31b011871deb5de1ffd400f9cc9961089d42943d63044869a49169d817127b34",
  "0x02974908458248c30971dee820f4f04dda34958f20a5dcd585fc49055097f0b3",
  "0x3318f2d9ec715421a17d69518f1da5726b8e226568a352d8eb356edff2526be7"
];
for (const hash of hashes) {
  const receipt = await client.getTransactionReceipt({ hash: hash as `0x${string}` });
  const ok = receipt.logs.some((log) =>
    isExpectedErc20Transfer(log, {
      token: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      from: "0xB6Ed11fDceFBf213719C029e3aDc372c6701240b",
      to: "0x230640f6508c7a1086444c5ba62d230f395ba0e1",
      amount: 10000n
    })
  );
  console.log(hash.slice(0, 12), "status=" + receipt.status, "transfer=" + ok);
}

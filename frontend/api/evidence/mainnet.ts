import type { VercelRequest, VercelResponse } from "@vercel/node";

const data = {
  "continuity": "0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770",
  "missionId": "1",
  "chainId": 8453,
  "network": "mainnet",
  "paydaySlots": [
    {
      "slot": 1784768419,
      "executionId": "667ekg3qk5f45127eqjyy",
      "transactionHash": "0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2",
      "explorer": "https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2",
      "confirmations": 3
    },
    {
      "slot": 1784768719,
      "executionId": "pmxyj7low2i06bne6j1bt",
      "transactionHash": "0xeb670541f1646dc55e2403d97ba683c7f325c7e38161b1c415da5e8b5bb86888",
      "explorer": "https://basescan.org/tx/0xeb670541f1646dc55e2403d97ba683c7f325c7e38161b1c415da5e8b5bb86888",
      "confirmations": 3
    },
    {
      "slot": 1784769019,
      "executionId": "0i0pqz1u7xc5act9agvwa",
      "transactionHash": "0x9288d13aa65976b2fb996b4764be4ab098f22631094a28a5e5f8ea6e36b9eec3",
      "explorer": "https://basescan.org/tx/0x9288d13aa65976b2fb996b4764be4ab098f22631094a28a5e5f8ea6e36b9eec3",
      "confirmations": 3
    }
  ],
  "balances": {
    "orgA": "0.02",
    "orgB": "0.12",
    "employee": "0.03",
    "continuity": "1"
  },
  "rescue": {
    "version": 1,
    "missionId": "1",
    "rescueId": "3262643f2b4bec156242871d919663ceaec7696ed29cd63ffe02a59dcb4a7169",
    "status": "COMPLETED",
    "createdAt": "2026-07-23T01:23:05.644Z",
    "updatedAt": "2026-07-23T01:32:49.602Z",
    "workflowHashExpected": "0x0ccdc52804ea95ce83e7990b8b8e6a66c42b717c30a88a05248cf95310dd30e2",
    "unpaidSlots": [
      1784769319,
      1784769619
    ],
    "replayIntents": [
      {
        "slot": 1784769319,
        "idempotencyKey": "ember-replay-1-1784769319",
        "state": "CONFIRMED",
        "executionId": "tjab2kqsitnwsfbr6e9ra",
        "txHash": "0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41"
      },
      {
        "slot": 1784769619,
        "idempotencyKey": "ember-replay-1-1784769619",
        "state": "CONFIRMED",
        "executionId": "xoratkk2crlscz57ma1fr",
        "txHash": "0x83f721bfbafc20ba4327d2a955afd05db9ec7d063e41ae0484c851edf0c15432"
      }
    ],
    "replays": [
      {
        "slot": 1784769319,
        "executionId": "tjab2kqsitnwsfbr6e9ra",
        "txHash": "0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41"
      },
      {
        "slot": 1784769619,
        "executionId": "xoratkk2crlscz57ma1fr",
        "txHash": "0x83f721bfbafc20ba4327d2a955afd05db9ec7d063e41ae0484c851edf0c15432"
      }
    ],
    "stepsCompleted": [
      "hash_check",
      "ensure_replay_workflow",
      "classify",
      "replay",
      "proof_scaffold",
      "proof_ipfs_verified",
      "proof_anchored",
      "done"
    ],
    "workflowHashComputed": "0x0ccdc52804ea95ce83e7990b8b8e6a66c42b717c30a88a05248cf95310dd30e2",
    "replayWorkflowId": "pvhwggqr8318wac68jb62",
    "proofHash": "0x61206b518afc1a501054276fe3b55bf0596efa549ad569e095eda45d5501460c",
    "proofFeeMode": "ESCROW_FALLBACK",
    "proofSha256": "61206b518afc1a501054276fe3b55bf0596efa549ad569e095eda45d5501460c",
    "proofCid": "QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn",
    "proofIpfsUri": "ipfs://QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn",
    "anchorRescueId": "0xb03a3e55ec7303090c4148bcedd1f4a033c8647eee9ebb18875c436859817d04",
    "anchorIdempotencyKey": "ember-anchor-1-3262643f2b4bec156242871d919663ceaec7696ed29cd63ffe02a59dcb4a7169-mainnet8453",
    "anchorExecutionId": "04hqz6i716c0soebv5n3p",
    "anchorTxHash": "0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f"
  },
  "proofCid": "QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn",
  "anchorTx": "0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f",
  "rescueId": "3262643f2b4bec156242871d919663ceaec7696ed29cd63ffe02a59dcb4a7169"
} as const;

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("access-control-allow-origin", "*");
  res.status(200).json(data);
}

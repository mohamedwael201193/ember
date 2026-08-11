# DoraHacks submission — EMBER

Hackathon: [Agents Onchain / KeeperHub](https://dorahacks.io/hackathon/agents-onchain/detail)  
Deadline context: Aug 13, 2026 12:00 UTC+2

## One-liner

When the agent dies, the mission survives — KeeperHub executes; EMBER recovers missed obligations on Base mainnet.

## Links

| Field | Value |
| --- | --- |
| Source code | https://github.com/mohamedwael201193/ember |
| Live demo | https://ember-web-seven.vercel.app |
| Demo video | *(upload ≤2:30 proof-first cut — see `docs/DEMO_VIDEO_DORAHACKS.md`)* |
| Primary onchain tx | https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2 |
| Continuity contract | https://basescan.org/address/0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770 |
| Evidence index | [`docs/evidence/README.md`](./docs/evidence/README.md) |
| Adoption artifact | [`docs/KEEPERHUB_CONTINUITY_ADOPTION.md`](./docs/KEEPERHUB_CONTINUITY_ADOPTION.md) |

## KeeperHub surfaces checklist

- [x] Workflow canvas (primary `5goaid2zjgzyb32661se3`, standby `pvhwggqr8318wac68jb62`)
- [x] Run / Runs audit (executions `667ekg3qk5f45127eqjyy`, `tjab2kqsitnwsfbr6e9ra`, anchor `04hqz6i716c0soebv5n3p`)
- [x] MCP `get_execution` evidence (`docs/evidence/mcp-continuity-demo-2026-08-11.json`)
- [x] Base mainnet USDC transfers via KeeperHub
- [x] Deep links from EMBER UI to KeeperHub / BaseScan / IPFS
- [ ] Fresh authenticated KH UI recording in final ≤2:30 video (operator action)

## Verified claims (only these)

1. Primary PAYDAY USDC on Base mainnet through KeeperHub — tx `0xd26e6174…341ea2`.
2. Missed-slot rescue replayed from standby org — tx `0x47437621…8e41` (+ second slot).
3. Rescue proof pinned to IPFS and anchored in `Continuity.sol` — CID `QmVr6yWD…`, anchor `0x74ba1eac…`.
4. Public provenance distinguishes LIVE / CERTIFIED SNAPSHOT / DEMO FIXTURE.
5. Mission Continuity Kit + inspect-only starter ship without requiring spend secrets.
6. Execution Recovery Contract Pack v1 prepared for [`KeeperHub/cli` #53](https://github.com/KeeperHub/cli/issues/53).

## Explicit non-claims

- Not claiming x402 marketplace fees as continuity payroll.
- Not claiming private routing, gas sponsorship, or undocumented KeeperHub features.
- Production may run as LIVE OBSERVER with certified snapshots for the payment story when writes are disabled.

## Onboarding bounty / adoption

Small mergeable contribution: **Execution Recovery Contract Pack v1** under `docs/keeperhub-contribution/execution-recovery-contract-pack-v1/`.  
Does not overlap open PR #95 (`--require-verified`).

## Team / contact

Repository owner: https://github.com/mohamedwael201193  
Project: EMBER

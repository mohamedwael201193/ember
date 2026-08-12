# EMBER evidence index

**Lead with Base mainnet — Phase 13.**  
JSON in this folder stores public workflow IDs, execution IDs, transaction hashes, addresses, and proof CIDs. **No API keys or private keys.**

Every public claim must be labeled:

| Label | Meaning |
| --- | --- |
| `LIVE RUNTIME` | Current process / observer talking to live APIs |
| `CERTIFIED MAINNET SNAPSHOT` | Historical Base mainnet run, verified and frozen |
| `DEMO FIXTURE` | Local/dev sample data — never claim as live |

---

## BASE MAINNET — PHASE 13 (judge-critical)

Provenance: **CERTIFIED MAINNET SNAPSHOT**

| Claim | ID / link | Artifact |
| --- | --- | --- |
| Continuity.sol | [`0x068bB96e…5770`](https://basescan.org/address/0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770) | `mainnet-continuity-deploy-2026-07-23.json` |
| Primary workflow | `5goaid2zjgzyb32661se3` | `mainnet-payday-slots-2026-07-23.json` |
| Primary execution | `667ekg3qk5f45127eqjyy` | `mainnet-slot0-2026-07-23.json` |
| Primary USDC tx | [`0xd26e6174…341ea2`](https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2) | same |
| Standby / rescue workflow | `pvhwggqr8318wac68jb62` | `mainnet-rescue-2026-07-23.json` |
| Rescue replay exec | `tjab2kqsitnwsfbr6e9ra` | same |
| Rescue USDC tx | [`0x47437621…8e41`](https://basescan.org/tx/0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41) | same |
| Second rescue tx | [`0x83f721bf…5432`](https://basescan.org/tx/0x83f721bfbafc20ba4327d2a955afd05db9ec7d063e41ae0484c851edf0c15432) | same |
| IPFS proof CID | [`QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn`](https://ipfs.io/ipfs/QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn) | same |
| Anchor execution | `04hqz6i716c0soebv5n3p` | same |
| Anchor tx | [`0x74ba1eac…211f`](https://basescan.org/tx/0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f) | same |
| MCP → KH → Base chain | `get_execution` on `667ekg3qk5f45127eqjyy` | `mcp-continuity-demo-2026-08-11.json` |
| MCP DX pass (no spend) | smoke exec `dy0alz2vlnujwimbbx8b0` | `mcp-dx-pass-2026-08-12.json` |

Identity check (must match across surfaces):

```text
EMBER evidence
  ↕ workflow 5goaid2zjgzyb32661se3
  ↕ execution 667ekg3qk5f45127eqjyy
  ↕ MCP get_execution
  ↕ tx 0xd26e6174…341ea2
  ↕ BaseScan
```

Additional certified PAYDAY slots (same mission):

- Slot 1: https://basescan.org/tx/0xeb670541f1646dc55e2403d97ba683c7f325c7e38161b1c415da5e8b5bb86888
- Slot 2: https://basescan.org/tx/0x9288d13aa65976b2fb996b4764be4ab098f22631094a28a5e5f8ea6e36b9eec3

---

## KeeperHub surfaces exercised

- Workflow canvas / Run / Runs (primary + standby)
- MCP: `tools_documentation`, `get_execution` (see MCP artifact)
- REST execute + receipt verify (runtime)
- Continuity.sol `anchorProof` via KeeperHub

Deep links:

- Primary workflow: https://app.keeperhub.com/workflows/5goaid2zjgzyb32661se3
- Primary run: https://app.keeperhub.com/workflows/5goaid2zjgzyb32661se3/executions/667ekg3qk5f45127eqjyy
- Standby workflow: https://app.keeperhub.com/workflows/pvhwggqr8318wac68jb62

---

## Base Sepolia — rehearsal (not the grand-prize claim)

Historical Sepolia rescue/proof/chaos drills remain valid engineering evidence for reliability, but they are **not** the Phase 13 mainnet claim.

| Artifact | What it proves |
| --- | --- |
| `rescue-live2slots.json` | Two-slot Org B replay |
| `rescue-idempotency-check.json` | No overlapping slot IDs after fix |
| `chaos-sentinel-kill.json` | Restart without new spend |
| `chaos-sentinel-mid-replay.json` | Mid-replay crash resume |
| `proof-live2slots.json` | Pin + fetch-back + anchor agree |
| `post-fix-three-drills.json` | Bounded multi-drill suite |
| `payday-restart-idempotency.json` | Same-slot restart reuse |
| `soak-12h.json` | 12h process soak |

Public Sepolia proof example (historical):

- CID: `Qmaq9qJ8KEcvR4yv8JitRXLwViDDdm5mnH8AkrMzrvzE6P`
- Anchor: https://sepolia.basescan.org/tx/0xad0fe495639b4222cf80d25bbf434dccfa42f023cf145339afd9702d401ed87b

---

## x402 / Marketplace experiments

Base mainnet x402 fee settlements prove KeeperHub paid-workflow rails. They are **not** continuity payroll:

- https://basescan.org/tx/0xabbe77bc77f922d67d7430c77486f4dc6d913c8bb4a810bb07dade644bdd3563
- https://basescan.org/tx/0x87f5c75fac79d090df15da27c8a330002c206e74ca3b20cb02114e0dda93e71f

See `phase11-*.json`.

---

## Development fixtures

`fixtures/dev/sample-evidence.json` is labeled **DEMO FIXTURE**. Explorer links and hashes there must not be presented as live mainnet.

---

## Passing ops / platform evidence

| Artifact | Result |
| --- | --- |
| `platform-verification.md` | Mixed dated matrix — failed gates stay failed |
| `render-*.json` | Combined Render runtime health / HMAC |
| `runtime-hardening-local-2026-07-22.json` | Credential allowlists + shutdown |
| `backend-certification-2026-07-22.json` | Consolidated certification snapshot |
| `validation-suite-2026-07-22.json` | Full local+live validation |

---

## Historical failures (retained on purpose)

- `rescue-live2slots-rerun.json` — pre-fix double-pay risk (slot ID binding bug). Post-fix: `rescue-idempotency-check.json`.
- `mainnet-deploy-blocker-2026-07-23.json` — funding stop before Continuity deploy succeeded.

Never promote a failed artifact to “pass” because a later run succeeded.

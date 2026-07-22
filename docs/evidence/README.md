# EMBER evidence index

All chain activity in this index is Base Sepolia. JSON files contain public
workflow IDs, execution IDs, transaction hashes, addresses, and proof data.
They contain no API key or private key.

## Passing evidence

| Artifact                          | Result              | What it proves                                                                                                               |
| --------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `platform-verification.md`        | Mixed, dated matrix | Live KeeperHub API, MCP, CLI, free-plan, and wallet behavior. Failed external gates remain visibly failed.                   |
| `rescue-live2slots.json`          | Pass                | Initial two-slot Org B replay with real KeeperHub executions and transactions.                                               |
| `rescue-idempotency-check.json`   | Pass after fix      | Same rescue is stable and later rescue slot IDs do not overlap prior covered slots.                                          |
| `chaos-sentinel-kill.json`        | Pass                | Sentinel process restart resumes a completed rescue without new replay transactions.                                         |
| `chaos-sentinel-mid-replay.json`  | Pass                | Sentinel was killed with a durable `EXECUTING` intent; restart reused the execution, finished two transfers and anchored.    |
| `chaos-payday-kill.json`          | Pass                | PAYDAY outage is observable and readiness recovers after restart.                                                            |
| `payday-restart-idempotency.json` | Pass                | Same-slot restart returns the same KeeperHub execution and transaction; receipt is valid.                                    |
| `proof-live2slots.json`           | Pass                | Canonical proof pin, gateway fetch-back hash, KeeperHub anchor execution, `ProofAnchored` event, and stored proof all agree. |
| `post-fix-three-drills.json`      | Pass                | Three bounded batches: six unique verified transfers, three fetched-back proofs, three anchors, stable explicit reruns.      |
| `render-free-deploy.json`         | Pass                | Three free Render web services created; public `/healthz`/`/readyz` and HMAC `/check` verified live.                         |

Public proof:

- CID: `Qmaq9qJ8KEcvR4yv8JitRXLwViDDdm5mnH8AkrMzrvzE6P`
- Anchor transaction:
  https://sepolia.basescan.org/tx/0xad0fe495639b4222cf80d25bbf434dccfa42f023cf145339afd9702d401ed87b
- Replay transaction 1:
  https://sepolia.basescan.org/tx/0x698ddc0afe9a34cc27a878e9b1bffe31c5b2cd26a433a5102a6dca71a02f2695
- Replay transaction 2:
  https://sepolia.basescan.org/tx/0x5701a6a01aeb557376f6014a1db6df49003ddbc44b134f2b389a256400c293dc
- PAYDAY restart transaction:
  https://sepolia.basescan.org/tx/0x47465f069fce41effa7d1a0e85d48b29a94fecd94a58b34f7cb8a80ede79c1db

## Historical failure evidence

`rescue-live2slots-rerun.json` is intentionally retained as a failed pre-fix
artifact. It shows the same historical slot IDs being paid again because replay
transaction block times landed in the current slot. This is not passing
evidence. The correction binds slot IDs to verified Org B transactions across
all mission journals; `rescue-idempotency-check.json` is the post-fix result.

## External blockers

- KeeperHub HTTP and Code workflow actions return `402 upgrade_required`.
- Agentic wallet provisioning returns HTTP 500, blocking a real paid
  Marketplace settlement.
- Render public deployment requires human service creation.
- Mainnet activity requires explicit Phase 13 human approval.

# EMBER backend architecture

## Component ceiling

EMBER intentionally uses two agents, one contract, and three KeeperHub
workflows:

- Agents: PAYDAY and EMBER/Sentinel
- Contract: `Continuity.sol`
- Workflows: W1 payroll, W2 sentinel pulse, W3 restore/replay entry

Primary Observer is a credential-isolation relay, not an agent. The imported
Org B W1' is a disabled replay copy of W1 and is not an additional product
workflow.

## Runtime flow

1. PAYDAY derives the current mission slot from `MISSION_START_AT`.
2. It writes and fsyncs an intent, then invokes W1 with a KeeperHub
   `Idempotency-Key` derived from mission and slot.
3. Primary Observer reads Org A execution history with its isolated full-scope
   key and signs the exact response body.
4. Sentinel verifies the Observer response signature and each candidate USDC
   receipt before calculating mission health.
5. On mission failure, Sentinel acquires a recoverable mission lock, verifies
   the canonical W1 hash, reconciles all slots, fsyncs a per-slot replay intent,
   and invokes the disabled Org B replay workflow once per unpaid slot with a
   deterministic idempotency key.
6. The journal binds historical slot IDs to replay transaction hashes, so a
   later transaction block time cannot make a rescued slot unpaid again.
7. Sentinel builds sorted canonical JSON, hashes it with SHA-256, pins it,
   fetches the CID, re-hashes the returned bytes, and only then requests
   `anchorProof` through the Org B remote KeeperHub MCP connection. Each proof
   step is journaled; after an ambiguous crash, Sentinel first reconciles
   `rescueProof` onchain before attempting another write.

## Trust boundaries

| Process            | Secrets allowed                            | Explicitly forbidden                                    |
| ------------------ | ------------------------------------------ | ------------------------------------------------------- |
| PAYDAY             | Org A executor key; optional control token | Org A observer key, Org B key, deployer key, Pinata JWT |
| Primary Observer   | Org A observer key; Observer HMAC secret   | Executor key, Org B key, deployer key                   |
| Sentinel           | Org B key; both service HMAC secrets       | Every Org A `kh_` key, deployer key                     |
| Deployment scripts | Deployer key during an explicit command    | Loading the key into any long-running service           |
| Future browser UI  | None                                       | All `kh_`, HMAC, wallet, Pinata, and deployer secrets   |

KeeperHub keys are full-scope. “Read-only” is enforced by the Observer's route
surface and process isolation, not by KeeperHub key scopes.

## Correctness invariants

- A mission slot has at most one accepted PAYDAY execution key.
- A rescue replays only receipt-unpaid and journal-uncovered slots.
- A rescue ID is anchored once.
- A replay or anchor crash resumes through the same KeeperHub idempotency key.
- A rescue uses one fee mode.
- Mainnet configuration is never selected implicitly.
- A proof is never anchored before fetch-back hash equality.
- The imported replay workflow remains schedule-disabled.

## Persistence and scaling

PAYDAY and Sentinel use append-only local journals with fsync and single-flight
execution. Render mounts a persistent disk for each. This design deliberately
runs one instance of each stateful service; horizontal replicas would require
a distributed lock and shared transactional journal. Primary Observer is
stateless and can be restarted independently.

No relational database is required for the current workload. Adding one would
increase the secret, migration, backup, and consistency surface without
improving the single-mission correctness model.

## Availability

- `/healthz`: process liveness
- `/readyz`: required configuration present and not shutting down
- `/metrics`: Prometheus text metrics
- SIGTERM/SIGINT: stop timers, drain HTTP, bounded forced exit
- KeeperHub mutations: local single-flight plus platform idempotency
- Receipt reads: Sepolia primary and Sepolia-only fallback
- Chaos: Windows process kill/restart with journal and transaction reconciliation

W2/W3 HTTP nodes currently return KeeperHub `402 upgrade_required`. Until the
plan is upgraded, Sentinel self-polls and `/rescue` is called directly with
HMAC. This is a documented platform gate, not a hidden fallback.

## Frontend boundary

Frontend code is intentionally absent. A later React + Vite client must use a
server-side backend-for-frontend; it must never sign HMAC requests or receive
KeeperHub keys in the browser. The prepared screen, state, navigation, and
event contracts live in `docs/FRONTEND_SPEC.md`.

# EMBER runbook

## Auth (KeeperHub)

All REST and MCP calls:

```http
Authorization: Bearer kh_xxxxxxxxx
```

Never send `X-API-Key`. If Cloudflare challenge/HTML appears, check platform outage / WAF regression / network before changing clients.

## Local services (no Docker required)

| Service          | Default port | Start (from repo root after build)                                                                  |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| Primary Observer | 8788         | Project env → strip standby/executor/deployer keys → `node services/primary-observer/dist/main.js`  |
| Sentinel         | 8787         | Project env → strip Org A executor/observer keys + deployer → `node services/sentinel/dist/main.js` |
| PAYDAY           | 8789         | Project env → executor key only → `node services/payday/dist/main.js`                               |

Journals: `RESCUE_JOURNAL_DIR` (default `./runtime/rescues`).

## HMAC routes

- Observer: `GET /v1/executions`
- Sentinel: `POST /check`, `POST /rescue`

Headers: `x-ember-timestamp`, `x-ember-nonce`, `x-ember-body-sha256`, `x-ember-signature`.

### Controlled live rescue (Sepolia)

```json
{ "rescueId": "live-<id>", "maxReplaySlots": 2, "dryRun": false }
```

Immediate re-run with a **new** `rescueId` must classify **zero** unpaid slots (or same `rescueId` returns completed journal with no new spends).

## Chaos substitutes (Docker unavailable)

Scripts under `scripts/chaos/`:

| Script                                                      | Purpose                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Stop-EmberProcess.ps1 -Service payday\|sentinel\|observer` | Kill listener on 8789/8787/8788                                               |
| `Start-EmberPayday.ps1 [-EnableCadence]`                    | Restart PAYDAY with projected credentials                                     |
| `Start-EmberObserver.ps1`                                  | Restart the isolated Observer with only its permitted key                     |
| `drill-payday-kill.ps1 [-EnableCadence]`                    | Kill, prove outage, restart, and verify readiness                             |
| `Start-EmberSentinel.ps1 [-ProofAnchorEnabled]`             | Restart Sentinel with projected env and optional live proof orchestration     |
| `drill-sentinel-kill.ps1`                                   | Kill → restart → same `rescueId` must return COMPLETED with unchanged replays |
| `drill-sentinel-mid-replay.ps1`                             | Kill on a durable replay intent; restart, reconcile, pin, and anchor          |
| `soak-services.ps1`                                         | Monitor health, readiness, metrics, PIDs, memory, and journal immutability    |
| `hmac-rescue.mjs`                                           | Bearer-free local HMAC helper for `/rescue`                                   |

| Drill                    | Action                                                   | Expected                                                                           |
| ------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Kill PAYDAY              | `Stop-EmberProcess.ps1 -Service payday`                  | No new W1 invokes; Sentinel eventually `MISSION_DOWN`                              |
| Kill Sentinel mid-rescue | `drill-sentinel-mid-replay.ps1`                          | Journal resumes from `EXECUTING`; exactly two unique txs and one anchor             |
| Kill Observer            | `Stop-EmberProcess.ps1 -Service observer`                | `/check` → 502 until restored                                                      |
| RPC primary outage       | Point `BASE_SEPOLIA_RPC_URL` at dead host; keep fallback | Receipt path uses fallback                                                         |
| Duplicate rescue         | Concurrent `/rescue` same mission                        | One `409 rescue_lock_held` or second completes with zero new txs for covered slots |

Evidence: `docs/evidence/chaos-sentinel-kill.json`,
`docs/evidence/chaos-sentinel-mid-replay.json`, and
`docs/evidence/chaos-payday-kill.json` (pass=true on 2026-07-22).

PAYDAY execution is keyed by `ember-payday-<mission>-<slot>` through the
KeeperHub `Idempotency-Key` header. Restarting in the same slot must return the
same execution ID and transaction hash; see
`docs/evidence/payday-restart-idempotency.json`.

## Native Render deployment

`render.yaml` declares three Node 24 web services. PAYDAY and Sentinel each
have a 1 GB persistent disk for their journals; Observer is stateless.

Sentinel production proof orchestration requires:

- `PROOF_ANCHOR_ENABLE=1`
- `KH_MCP_URL=https://app.keeperhub.com/mcp`
- `PINATA_JWT` as a secret
- `IPFS_GATEWAY`
- `CONTINUITY_ADDRESS_SEPOLIA`

For each rescue, confirm that the journal contains
`proof_ipfs_verified`, `proof_anchored`, `proofCid`, `anchorExecutionId`, and
`anchorTxHash`. If a process dies after anchor broadcast but before journal
commit, Sentinel reads the contract first and records
`anchorRecoveredFromChain=true` instead of sending a second write.

Read-only validation against the existing Base Sepolia proof:

```powershell
node --env-file=.env --import tsx scripts/verify-anchor-recovery.ts
```

1. Create a Render Blueprint from the repository.
2. Enter each `sync: false` value in the owning service only. Never copy the
   Org A observer/executor key into Sentinel.
3. Confirm `/healthz` is 200 and `/readyz` is 200 for all services.
4. Confirm Sentinel's `PRIMARY_OBSERVER_URL` resolves to the Observer service.
5. Keep `CONTINUITY_ADDRESS_MAINNET` and mainnet credentials absent before the
   Phase 13 human stop gate.
6. Run signed Observer and Sentinel probes from outside Render.
7. Restart PAYDAY and Sentinel independently and verify journal continuity.

Health is liveness only. Readiness checks required mission/workflow
configuration and returns 503 while shutting down. SIGTERM stops timers,
drains the HTTP server, and has a bounded forced-exit timeout.

## Platform bugs (continue elsewhere)

1. Agentic `wallet add` HTTP 500 — retry; if persistent, collect request/response/headers/timestamp/request-id into `docs/evidence/`.
2. Free-plan `402 upgrade_required` on HTTP Request / Code — keep Sentinel self-poll + direct `/rescue` until Pro or documented free workaround.

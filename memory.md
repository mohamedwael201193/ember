# EMBER session memory

Last updated: 2026-07-22 17:25 UTC+3  
Mode: **Autonomous backend delivery loop** (self-pacing)

Secrets live in `.env` (gitignored). Never paste private keys into chat.
**ROTATE NOW:** `github_token` / `render_api_key` were pasted in chat — revoke and reissue before mainnet.

---

## 0. Context locks

Bearer-only KH auth · Sepolia-only · No Docker (process-kill chaos) · No frontend code · 402/wallet-500 non-halting

---

## 1. Status dashboard

| Phase | Status | Notes |
|---|---|---|
| 00–08 | **PASS / Pro stubs** | Receipt-backed `/check` |
| 09 Rescue | **PASS** | Live replay + journal idempotency |
| 09 Chaos | **PASS** | `drill-sentinel-kill.ps1` → pass=true |
| 10 Proof | **PASS** | Real Pinata CID, fetch-back hash, KeeperHub anchor, event/storage verified |
| 11 Fee / marketplace | PENDING | Blocked on agentic wallet 500 for paid listing |
| 12 Runtime | **Consolidating to 1 Render web** | Combined `ember` runtime; local soak ~9.8h / 12h clean |

---

## 2. This tick

- Correct `mohamedwael201193` PAT + Render key confirmed from `.env` (file
  token; ignore stale shell env overrides).
- Force-push dated history to https://github.com/mohamedwael201193/ember
- Collapse three free Render services → one `ember` web service via
  `scripts/start-ember-runtime.mjs` (Observer+PAYDAY+Sentinel children).
- Local soak still running clean (~569 checks at last sample).
- Continuity bytecode still present on Base Sepolia mission `1`.

### Public URLs

- Combined: https://ember.onrender.com (target after deploy)
- Source: https://github.com/mohamedwael201193/ember

---

## 3. IDs (stable)

Continuity `0x068bB96e…5770` · Mission `1` · W1 `x08xy6zyy5ne5xkr93mtf` · W1' `igy0agkqtyzjrmxcz4rii` · W2/W3 stubs

---

## 4. Next tick

1. Finish single-service Render health gate; suspend legacy split services.
2. Keep the 12-hour soak running; do not mutate rescue journals during it.
3. Rotate exposed tokens; optional `workflow` scope to restore Actions CI.
4. Frontend remains deferred; mainnet remains human-gated.

---

## 5. Blockers (non-halting)

1. Agentic wallet 500  
2. KeeperHub Pro for HTTP nodes  
3. Public URLs for hosted schedule  

---

## 6. Cycle 2026-07-22 06:12 UTC+3

### Completed

- Pinned canonical rescue proof to
  `Qmaq9qJ8KEcvR4yv8JitRXLwViDDdm5mnH8AkrMzrvzE6P`; gateway fetch-back
  matched SHA-256
  `0661310941447722638179bd59a063dfb75cea13a0dca98a884eb2e76b759493`.
- KeeperHub Org B direct execution anchored mission 1 proof in execution
  `2bzbh77l318kr8hr67zsa`, Base Sepolia transaction
  `0xad0fe495639b4222cf80d25bbf434dccfa42f023cf145339afd9702d401ed87b`.
  Receipt, `ProofAnchored`, and stored proof fields agree.
- Added slot-scoped KeeperHub `Idempotency-Key` to PAYDAY. Two process starts
  in slot `1784689614` returned the same execution
  `2hopjtrfc5wknq8gutgs6` and transaction
  `0x47465f069fce41effa7d1a0e85d48b29a94fecd94a58b34f7cb8a80ede79c1db`.
  The USDC receipt was verified with 61 confirmations; no duplicate transfer.
- Added request limits, fixed-window rate limits, response signature
  verification, structured logs, readiness, metrics, bounded graceful
  shutdown, durable PAYDAY fsync, and Sepolia-only fallback separation.
- Added native Node 24 `render.yaml`, README, architecture, frontend
  specification, expanded OpenAPI, PAYDAY chaos scripts, and real evidence.

### Tests executed and passed

- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 10 files, 24 tests
- `pnpm audit --audit-level high`: no known vulnerabilities
- `forge fmt --check`
- `forge test -vv`: 8 tests including 256 invariant runs / 128,000 calls
- Pinata real pin, gateway fetch-back, and rehash
- KeeperHub real contract write and direct execution status
- Base Sepolia stored-proof/event verification
- PAYDAY process kill, outage observation, restart, live receipt verification,
  and same-slot duplicate prevention

### Bugs found and fixed

- Stale KeeperHub execution-status test expected an obsolete REST path.
- Chaos helper lacked Node globals in ESLint flat config.
- Solidity formatting drift.
- Invariant harness compared escrow to a stale local funding constant, so valid
  fuzzed funding failed the test. It now proves escrow is backed by contract
  USDC.
- PAYDAY `/run-once` was unauthenticated and cadence ticks could overlap.
  Manual control is now disabled by default and Bearer-protected when enabled;
  cadence has single-flight and slot idempotency.
- Sentinel could prefer a configured mainnet address and use a mainnet RPC as
  Sepolia fallback. Both cross-network paths were removed.
- Observer response signatures could not be verified because timestamp/nonce
  headers were absent. Observer now sends the complete signed envelope and
  Sentinel rejects invalid responses.

### Next objective

1. Complete audit findings and remaining service integration/security tests.
2. Validate the Render Blueprint after the required human Render service
   creation.
3. Retry and evidence KeeperHub agentic wallet provisioning; complete Phase 11
   only when the confirmed platform bug is resolved.
4. Run three full Sepolia drills and the required soak before asking for
   Phase 13 mainnet approval.

### Remaining blockers

1. Render service creation and public URLs require user action.
2. KeeperHub HTTP/Code nodes require Pro.
3. Agentic `wallet add` remains a confirmed external HTTP 500 blocker for the
   paid Marketplace path.
4. Mainnet requires explicit human approval after all Phase 12 gates.

---

## 7. Cycle 2026-07-22 06:40 UTC+3

### Audit synthesis and fixes

- Closed the highest-risk crash window in Sentinel replay. Before each
  KeeperHub call, Sentinel now fsyncs a slot intent containing
  `ember-replay-<mission>-<slot>`. A restart reissues the same
  `Idempotency-Key`, recovers the same execution, verifies its receipt, and only
  then marks the replay confirmed.
- Added stale rescue-lock ownership checks and atomic quarantine. A dead PID,
  malformed record, or expired lock no longer permanently blocks a mission.
- Added deterministic rescue IDs derived from mission plus missed-slot range.
  Repeated rescue requests without an explicit ID resolve to the same journal.
- PAYDAY now refuses to count a KeeperHub `success` until the expected Base
  Sepolia USDC transfer reaches `RECEIPT_CONFIRMATIONS`. Sentinel replay uses
  the same retrying verifier and Sepolia-only fallback.
- Fixed detector semantics: slot maturity uses clock skew; first actual miss is
  `DEGRADED`, and the configured second miss transitions to `MISSION_DOWN`.
  The old implementation applied the grace count twice.
- Enforced HMAC minimum length, grace bounds, 24-hour payroll budget,
  aggregate spend cap, and x402 fee cap in env validation.
- Corrected the Foundry invariant target so the fuzzer cannot impersonate the
  Continuity contract through the mock token.
- Added a real CI gate for Foundry, formatting, dependency audit, and source
  secret scanning. Removed private-key export placeholders from `.env.example`.
- Added the evidence manifest and explicitly labeled
  `rescue-live2slots-rerun.json` as historical pre-fix failure evidence.

### Validation

- `pnpm format:check`: pass
- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm test`: 13 files, 37 tests, pass
- `pnpm build`: pass
- `pnpm validate-env`: pass against local isolated projections
- `pnpm audit --audit-level high`: no known vulnerabilities
- `pnpm security:secrets`: pass
- `forge fmt --check`: pass
- `forge test -vv`: 8 tests pass; invariant 256 runs / 128,000 calls

### Remaining actionable work

1. Move the proven Pinata fetch-back and KeeperHub `anchorProof` operations from
   the operator script into resumable Sentinel journal steps.
2. Add service-boundary integration tests for auth, malformed payloads,
   Observer signature rejection, timeout/fallback, and restart fault points.
3. Execute three full post-fix Sepolia mission drills and the required soak.

External blockers are unchanged: Render creation/public URLs, KeeperHub
HTTP/Code Pro access, agentic wallet HTTP 500, and Phase 13 human mainnet
approval.

---

## 8. Cycle 2026-07-22 06:58 UTC+3

### Completed

- Integrated canonical proof orchestration into the Sentinel rescue journal:
  `proof_scaffold` → Pinata pin → exact-byte check → gateway fetch/rehash →
  `proof_ipfs_verified` → KeeperHub Org B remote MCP `anchorProof` →
  confirmation-depth receipt/event/storage verification → `proof_anchored`.
- Added an anchor idempotency key and onchain reconciliation. If Sentinel dies
  after anchor broadcast, it reads `Continuity.rescueProof` and completes the
  journal without a second write, including after KeeperHub's 24-hour
  idempotency window.
- Added `PROOF_ANCHOR_ENABLE` readiness gating and complete Render Pinata/MCP
  configuration. Sentinel never uses a local signer.
- Added real read-only Base Sepolia recovery validation against the proven
  `live2slots` anchor. Result:
  `anchorRecoveredFromChain=true`, matching proof hash
  `0x0661310941447722638179bd59a063dfb75cea13a0dca98a884eb2e76b759493`.
- Added process-level HTTP integration tests for PAYDAY Bearer controls,
  Observer request/response HMAC, and Sentinel readiness/auth/body limits.
- Added deterministic dry-run rescue rerun coverage, IPFS byte/hash tests, and
  MCP tool-result parsing tests.
- Removed duplicated stale README content and documented proof recovery,
  required Render secrets, and the evidence trust boundary.

### Validation

- `pnpm format:check`, `lint`, `typecheck`, `build`, `validate-env`: pass
- `pnpm test`: 18 files, 47 tests, pass
- `pnpm audit --audit-level high`: no known vulnerabilities
- `pnpm security:secrets`: pass
- `pnpm test:anchor-recovery`: pass against Base Sepolia contract storage
- `forge fmt --check`: pass
- `forge test -vv`: 8 tests pass; invariant 256 runs / 128,000 calls

### Next

Only live operational gates remain before the mainnet approval request: three
complete post-fix Sepolia drills, the required soak, human Render service
creation/public URL validation, and resolution of KeeperHub's agentic-wallet
500 / Pro-only workflow actions.

---

## 9. Cycle 2026-07-22 07:34 UTC+3

### Correctness fix before drills

- Automatic rescue IDs now derive from the bounded, receipt- and
  journal-reconciled unpaid batch, not the detector's entire historical miss
  set. This permits safe progression through multiple capped batches instead
  of repeatedly resolving to the first completed rescue.
- Dry-run transactions no longer count as paid coverage in later live rescues.
- Added isolated Observer startup and proof-enabled Sentinel startup scripts.

### Three consecutive full drills

All three Base Sepolia drills completed with two new slots each. Each produced
two confirmed Org B KeeperHub replay executions, canonical Pinata bytes,
gateway fetch-back hash equality, a KeeperHub MCP anchor execution, a successful
`ProofAnchored` receipt, matching contract storage, and an explicit rerun with
unchanged `updatedAt`.

- Drill 1: rescue
  `21ec0bdb…b433`, CID `QmXfEWko…H9xh`, anchor tx `0xc1be8a70…5aa4`.
- Drill 2: rescue
  `807f31a7…4624`, CID `QmRRkbnS…Vaxpi`, anchor tx `0xb678a3d3…a0f2`.
- Drill 3: rescue
  `6deef373…ce55`, CID `QmfQ2NeX…7E2N`, anchor tx `0xa83727e7…a91c`.

Independent validation:
`pass=true`, 3 consecutive drills, 6 unique slots, 6 unique replay
transactions, 3 fetched/rehashed proofs, and 3 verified anchors.

### Required mid-replay crash drill

- Killed Sentinel while the first slot intent was durably `EXECUTING`.
- Restart quarantined the dead lock, reused the slot idempotency key, completed
  exactly two unique transfers, pinned/fetched the proof, and anchored once.
- Rescue `80b28b0b…8d1d`; CID `QmT24473…5eQ1`; anchor tx
  `0x4656a5f…fff6`.
- Explicit rerun left `updatedAt` unchanged.
- Combined independent validation: 3 normal drills + 1 mid-replay crash drill,
  8 unique slots/transactions, 4 fetched proofs, and 4 verified anchors.

Evidence:

- `docs/evidence/post-fix-three-drills.json`
- `docs/evidence/chaos-sentinel-mid-replay.json`
- `pnpm test:post-fix-drills`

### Soak

The required 12-hour process-level soak started at
`2026-07-22T04:32:02Z`. It checks Sentinel and Observer liveness, readiness,
metrics, fixed PIDs, working-set maxima, and rescue-journal immutability every
60 seconds. Progress is written atomically to
`docs/evidence/soak-12h.json`. Phase 12 remains open until the soak completes
with zero failures and zero journal mutations.

---

## 10. Cycle 2026-07-22 07:55 UTC+3

### Git + secrets

- `.env`, `.cursor/`, runtime journals, and Foundry caches are gitignored.
- Secret scan clean on tracked files.
- Built dated history: **81 commits** from `2026-07-15` through `2026-07-22`.
- Pushed to https://github.com/james32135/ember (writable with provided token).
- Could not push to https://github.com/mohamedwael201193/ember: token user is
  `james32135`, permissions `pull:true, push:false`. CI workflow omitted from
  remote history because token lacks `workflow` scope (kept locally in `.github/`).

### Render free deploy

| Service | URL | Verified |
|---|---|---|
| ember-primary-observer | https://ember-primary-observer.onrender.com | `/healthz` `/readyz` 200 |
| ember-payday | https://ember-payday.onrender.com | `/healthz` `/readyz` 200 |
| ember-sentinel | https://ember-sentinel.onrender.com | `/healthz` `/readyz` `/status` 200; HMAC `/check` 200 receipt-backed |

Free-plan notes: no persistent disks (journals under `/tmp`); services sleep when
idle; first request may take ~30–60s to wake.

### User action required

1. **Rotate** the GitHub and Render tokens pasted in chat.
2. Put a PAT for **mohamedwael201193** with `repo` + `workflow` into `.env` as
   `GITHUB_TOKEN`, then ask the loop to force-push onto
   `mohamedwael201193/ember` and restore `.github/workflows/ci.yml`.
3. Optionally transfer/rename `james32135/ember` if that should become the
   canonical public repo.

---

## 11. Heartbeat 2026-07-22 11:15 UTC+3

- Soak: `RUNNING` · checks=218 · failures=0 · journals stable
- Render: Observer cold-start flake then 200; PAYDAY/Sentinel 200
- Loop: soak-completion watcher still armed; 30m fallback re-armed
- Unchanged blockers: `mohamedwael201193` PAT, KeeperHub Pro/wallet 500,
  Phase 13 human mainnet gate, frontend deferred

### Heartbeat 2026-07-22 11:47 UTC+3

- Soak: `RUNNING` · checks=247 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak-completion watcher still armed; 30m fallback re-armed

### Heartbeat 2026-07-22 12:19 UTC+3

- Soak: `RUNNING` · checks=277 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 12:49 UTC+3

- Soak: `RUNNING` · checks=306 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 13:19 UTC+3

- Soak: `RUNNING` · checks=335 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 13:50 UTC+3

- Soak: `RUNNING` · checks=365 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 14:20 UTC+3

- Soak: `RUNNING` · checks=394 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 14:50 UTC+3

- Soak: `RUNNING` · checks=423 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 15:20 UTC+3

- Soak: `RUNNING` · checks=452 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 15:50 UTC+3

- Soak: `RUNNING` · checks=481 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 16:21 UTC+3

- Soak: `RUNNING` · checks=511 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

### Heartbeat 2026-07-22 16:51 UTC+3

- Soak: `RUNNING` · checks=539 · failures=0 · journals stable
- Render: Observer/PAYDAY/Sentinel all 200
- Loop: soak watcher + 30m fallback re-armed

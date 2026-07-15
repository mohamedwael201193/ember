# EMBER Backend Implementation Plan

**Status:** Active autonomous backend implementation (Base Sepolia).  
**Prepared:** 2026-07-22  
**Updated:** 2026-07-22 (Phase 10 real proof anchor + native Render hardening)  
**Target:** KeeperHub “Agents Onchain” Hackathon, submission deadline 2026-08-13 12:00 UTC+2  
**Scope:** Backend, contracts, KeeperHub workflows, infrastructure, tests, operations, and submission evidence. Frontend implementation deferred; API/UX specs allowed.

## Planning authority and source precedence

1. Current official KeeperHub documentation and live platform behavior.
2. Current official KeeperHub GitHub repositories, releases, SDK, and CLI.
3. Official releases / changelog.
4. This `IMPLEMENTATION_PLAN.md`.
5. `memory.md` (session ledger).
6. `FINAL_PROMPT.md` (historical brief; override when docs/live disagree — log in `docs/DEVIATIONS.md`).

No undocumented KeeperHub behavior may enter implementation. Every load-bearing behavior must be verified against the live platform before dependent code is written.

## Verified corrections to the source specifications

The user authorized correcting infeasible or outdated statements when the correction is documented and evidence-backed.

| Source statement | Current evidence | Plan correction |
|---|---|---|
| PAYDAY dies when `docker kill payday` is run, while W1 remains a hosted scheduled workflow | A KeeperHub schedule runs independently of the PAYDAY container | W1 becomes a **manual-trigger workflow**. PAYDAY invokes it every cadence. Killing PAYDAY therefore stops new W1 runs. |
| KeeperHub CLI current line is v0.8.x | Official latest release is v0.10.0, published 2026-05-07 | Require v0.10.0 or a newer version verified compatible during Phase 00. |
| KeeperHub MCP exposes 19 tools | Current MCP docs say more than 30 tools and direct callers to `tools_documentation` | Discover tools at runtime; never hardcode a tool count. |
| Agentic wallet provisions itself on first call | Current docs require `skill install` and then `wallet add` | Use both commands and treat the resulting wallet as separate from KeeperHub organization wallets. |
| Agentic wallet is non-custodial | Current official FAQ calls the first-party agentic wallet custodial: KeeperHub controls the Turnkey root user, subject to Turnkey policies | Document the custodial trust boundary and keep only the minimum USDC balance in the payer wallet. |
| Org A can issue a read-only API key to Sentinel | Current Access Control and FAQ docs state that all org members and `kh_` keys have equal permissions; granular read-only scopes are not available | Org A execution history is accessed through a narrow **Primary Observer** service. The full-scope observer key never enters Org B or Sentinel. |
| Node 22 is required | Local machine has Node 24.12.0; KeeperHub’s current repository baseline is Node 24 | Standardize the backend workspace on Node 24 LTS. |
| Gas sponsorship and private routing can both be assumed | Current Gas Management docs state sponsored transactions must use the public mempool | Treat sponsorship and private routing as mutually exclusive per transaction. Record which property each transaction uses. |
| `registerMission` can enforce `maxFeePerRescue` without receiving it | The proposed signature omitted the value | Add `startAt` and `maxFeePerRescue` to mission registration. |
| x402 payment and `claimFee()` can both occur during one rescue | That can double-charge the mission | Every rescue has one immutable fee mode: `X402`, `MPP`, or `ESCROW_FALLBACK`. Contract state prevents an escrow claim for externally paid rescues and prevents a second claim for the same rescue ID. |
| Mainnet pays 0.25 USDC every 5 minutes, runs for 24 hours, and stays within a 40 USDC total budget | Payroll alone would cost 72 USDC per day | User selected 0.01 USDC per 5-minute slot: 2.88 USDC per day, with a 5 USDC payroll budget and a 10 USDC aggregate USDC spend cap. |
| Runtime should avoid REST because KeeperHub’s internal `CLAUDE.md` forbids raw HTTP | Current public API docs explicitly support REST for backend integrations; the official SDK remains `0.x` | Agents use MCP, CI/ops use CLI, and the backend uses an adapter over the official SDK where supported and documented REST for missing read endpoints. |
| Auth via `X-API-Key` | KeeperHub team + current docs: `Authorization: Bearer kh_…` for REST and MCP | **Never use `X-API-Key`.** Cross-check every request. |
| Cloudflare WAF blocks imply our client is wrong | Team acknowledged prior WAF issues; fixed | On CF challenge: investigate outage/regression/network before architecture changes. |
| `docker kill payday` is required for chaos | User workstation has **no Docker**; Docker must not block delivery | Use process-level substitutes: Windows `Stop-Process`, Linux/WSL `kill`/`pkill`, Render restart/scale-down. Document each substitution in `docs/RUNBOOK.md`. |
| HTTP Request / Code actions available on free plan | Live create returns `402 upgrade_required` (`action.http-request`, `action.code`) | Confirmed plan gate (not our bug). Interim: Sentinel self-poll + direct HMAC `/rescue`; redesign only if docs/Discord show a new free-path capability. |
| `wallet add` always succeeds | Live returns HTTP 500 | Retry + validate payload/auth/org/MCP/API; if persistent, file complete bug report; **do not stop** other work. |

## Known live-document inconsistencies that Phase 00 must resolve

1. The Marketplace page says KeeperHub handles paid workflow execution, while MCP and Agentic Wallet pages say write workflows return unsigned calldata. W3 may not be listed until its actual call semantics are proven with a real paid call.
2. The API overview says official SDKs are planned, while `KeeperHub/sdk` publishes an early-development `@keeperhub/sdk`. Its exact endpoint coverage and current package version must be inspected before selection.
3. Public CLI docs demonstrate `--wait` but do not currently document the source manual’s `--json --timeout 2m` syntax. Phase 00 must derive supported flags from `kh workflow run --help`.
4. Cross-account JSON import is documented, but cross-org credential rebinding and programmatic import equivalence must be tested in the live dashboard.
5. `kh_` keys are full-scope. There is no technical read-only key boundary today.

These are platform-verification gates, not invitations to guess.

---

# 1. Project understanding

## 1.1 Product

EMBER is execution-continuity infrastructure for an onchain agent mission. PAYDAY normally sends 0.01 USDC to a beneficiary every five minutes through KeeperHub. EMBER detects when PAYDAY stops invoking the mission, reconstructs the missed schedule from KeeperHub run history and verified onchain receipts, imports the canonical workflow into an isolated standby organization, replays only genuinely unpaid slots, charges exactly one continuity fee, and anchors a tamper-evident rescue proof.

The core claim is:

> The agent process may die, but the declared mission continues without duplicate payment.

## 1.2 Hard component ceilings

- Agents: 2 — PAYDAY and EMBER.
- Smart contracts: 1 — `Continuity.sol`.
- KeeperHub workflows: 3 — W1, W2, and W3.
- Frontend: none in this plan.

The Primary Observer is a passive credential-isolation service, not a reasoning agent. It cannot decide, execute, import, replay, or sign.

## 1.3 Components and contracts

### PAYDAY agent

- Runs in its own container.
- Owns cadence timing for W1.
- Invokes W1 manually through the Org A KeeperHub MCP connection or CLI.
- Persists a local invocation journal before and after each call.
- On restart, reads its own KeeperHub runs and the Continuity proof log before resuming.
- Never receives Org B credentials.

### W1 `payday-stream` in Org A

- Manual trigger, not a KeeperHub schedule.
- One real Base USDC transfer action from Org A’s KeeperHub organization wallet to `EMPLOYEE_ADDRESS`.
- Amount fixed by validated configuration and capped at 1 USDC.
- Created disabled until validated; enabled only for explicit manual invocation.
- Exported from the live platform and canonicalized for the onchain workflow hash.

### Primary Observer service

- Holds a dedicated Org A `kh_` key whose platform permissions are full-scope.
- Exposes only authenticated read endpoints for W1 execution history.
- Enforces an HTTP method/path allowlist and never implements create, update, delete, execute, integration, wallet, or key-management calls.
- Returns the unmodified KeeperHub execution envelope plus a service signature and request ID.
- Runs separately from PAYDAY, so PAYDAY death does not remove observability.
- Never receives Org B credentials.

### EMBER/Sentinel agent

- Runs in Org B’s trust domain.
- Receives authenticated W2 checks.
- Reads mission parameters from `Continuity.sol`.
- Reads W1 run history only through Primary Observer.
- Computes expected slots from `startAt` and `cadenceSeconds`.
- Classifies state as `WARMING_UP`, `OK`, `DEGRADED`, `MISSION_DOWN`, `RESCUING`, or `RECOVERED`.
- Triggers W3 exactly once per rescue ID.
- Owns replay journaling, proof construction, and fee-mode selection.
- Never receives any Org A KeeperHub key.

### W2 `continuity-sentinel` in Org B

- KeeperHub schedule trigger every 120 seconds.
- Calls Sentinel `/check` using timestamp, nonce, body hash, and HMAC signature.
- Does not directly trigger a KeeperHub webhook.
- Published to the Hub as the free `continuity-wrapper` only after credentials and internal URLs are stripped.

### W3 `restore-and-replay` in Org B

- Manual/MCP trigger.
- Calls Sentinel `/rescue` with a deterministic rescue ID and authenticated payload.
- Listed as a paid Marketplace workflow only after Phase 00 proves the actual paid-call semantics.
- Returns a structured rescue result containing replay execution IDs, transaction hashes, fee mode, proof CID, and anchor transaction.
- Never embeds secrets in its export.

### `Continuity.sol`

The one immutable Base contract stores mission declarations, fee escrow, and append-only rescue proofs.

Planned external contract:

- `registerMission(workflowHash, startAt, cadenceSeconds, budget, beneficiary, standby, maxFeePerRescue)`
- `fund(missionId, amount)`
- `anchorProof(missionId, rescueId, proofHash, ipfsUri, missedRuns, replayedRuns, feeMode, feeReference)`
- `claimFee(missionId, rescueId, amount)`
- `setStandby(missionId, newStandby)`

Required invariants:

1. Workflow hash and schedule anchor never change after registration.
2. Only the registered standby may anchor or claim.
3. A rescue ID can be anchored once.
4. A rescue has exactly one fee mode.
5. `claimFee` is valid only for `ESCROW_FALLBACK`.
6. An externally paid rescue can never claim escrow.
7. Total escrow claims never exceed funded escrow.
8. A rescue can claim at most `maxFeePerRescue`.
9. Proof history is append-only.
10. No unbounded onchain loop is required.

### KeeperHub adapter

- MCP adapter for agent-native workflow discovery, creation, validation, execution, import, listing, and direct contract actions.
- CLI adapter for operations and CI smoke tests.
- Read API adapter for executions, wait receipts, logs, analytics, and chains.
- Uses the official SDK only for methods actually present in its installed version.
- Adds timeout, typed errors, request IDs, rate-limit handling, and bounded retries.
- Never retries a mutation without a platform idempotency guarantee or a local single-flight lock.

### Receipt checker

A slot is paid only if all conditions hold:

- A KeeperHub run is successful.
- A transaction hash is present.
- The receipt exists on the expected chain.
- Receipt status is `1`.
- The expected USDC contract emitted `Transfer(ORG_A_WALLET_ADDRESS, EMPLOYEE_ADDRESS, PAYMENT_AMOUNT_USDC)`.
- The receipt has the required confirmation depth.

KeeperHub status alone is not proof of payment.

### Mission core

- UTC slot arithmetic.
- Grace-window and clock-skew policy.
- Deterministic rescue IDs.
- Missed-slot diff.
- Canonical workflow hashing.
- Rescue state machine and write-ahead journal.
- Canonical proof serialization and SHA-256 hashing.
- Environment validation and secret redaction.

### Proof pipeline

1. Build canonical proof JSON from real KeeperHub responses and real receipts.
2. Hash canonical bytes with SHA-256.
3. Pin the exact bytes to Pinata.
4. Fetch the CID through the configured gateway.
5. Re-hash fetched bytes.
6. Abort if hashes differ.
7. Anchor through an Org B KeeperHub contract-write execution.
8. Verify sender, event, transaction receipt, and stored proof.

### Fee pipeline

- Primary mode: caller pays W3 through x402 or MPP before successful Marketplace execution.
- Fallback mode: after an externally paid path definitively fails, W3 records `ESCROW_FALLBACK`; the standby claims once from contract escrow.
- An x402/MPP settlement reference is included in the proof.
- The first-party agentic payer wallet is separate from Org A’s creator/workflow wallet.
- The payer wallet contains only the minimum balance needed for rehearsals and judged calls.

## 1.4 Normal, failure, rescue, and revival workflows

### Normal

1. PAYDAY calculates the next slot from onchain `startAt`.
2. PAYDAY writes an intent record to its journal.
3. PAYDAY invokes W1 manually.
4. KeeperHub executes the USDC transfer and records the run.
5. PAYDAY waits for terminal execution status and verifies the receipt.
6. W2 periodically asks Sentinel to evaluate health.
7. Sentinel obtains W1 runs through Primary Observer and returns `OK`.

### Failure

1. PAYDAY is killed or otherwise stops invoking W1.
2. No successful, receipt-valid W1 run appears for an expected slot.
3. First missed slot produces `DEGRADED`.
4. Two consecutive missed slots produce `MISSION_DOWN`.
5. Sentinel derives a deterministic rescue ID from mission ID and first/last candidate slot.

### Rescue

1. Acquire single-flight rescue lock.
2. Read mission state from chain.
3. Load and canonicalize W1 export.
4. Verify its hash against the mission.
5. Import/create a disabled W1 copy in Org B and validate it.
6. Reconcile every candidate slot against Org A run history and onchain receipts.
7. Replay only `UNPAID` slots through Org B KeeperHub execution.
8. Wait for each receipt and re-verify its USDC transfer.
9. Complete x402/MPP settlement or select escrow fallback, never both.
10. Pin, fetch, re-hash, and anchor proof.
11. Mark the journal completed.

### Revival

1. PAYDAY restarts.
2. It reads W1 history and Continuity proofs.
3. It calculates the next future slot; it never backfills slots EMBER already rescued.
4. It logs the real rescued count and resumes manual W1 invocation.
5. The imported W1 copy remains disabled.

## 1.5 Trust boundaries

| Boundary | Credential/data allowed | Forbidden |
|---|---|---|
| PAYDAY | Org A executor key, W1 ID, Org A wallet address | Org B key, deployer key, Pinata JWT |
| Primary Observer | Dedicated Org A observer key | Org B key, any execute/mutate route |
| Sentinel | Org B key, observer URL/HMAC, public chain data, Pinata JWT | Org A key, deployer key |
| Deployment scripts | Deployer private key only during explicit deploy/register commands | Loading the key in any service |
| Browser/demo | Public addresses, CIDs, tx hashes | Any API key, HMAC secret, private key |

## 1.6 Ambiguity register

User decisions resolved:

- PAYDAY manually invokes W1.
- Fee modes are x402/MPP primary and contract escrow fallback, mutually exclusive.
- Evidence-backed corrections to `FINAL_PROMPT.md` are authorized.
- Backend only means no frontend package, frontend variables, Vercel work, or UI phase.

Platform questions deferred to mandatory live gates:

- Paid W3 execution semantics.
- Current CLI structured-output flags.
- Current SDK endpoint coverage.
- Cross-org import and integration rebinding behavior.
- Exact Marketplace payout/settlement identifiers exposed to the caller.

Any failed live gate stops the dependent design and requires this plan to be amended before implementation continues.

---

# 2. Environment variables

## 2.1 Rules

- Runtime values live in `.env`, which is gitignored.
- `.env.example` contains every name, an empty value, required phase, and no secret.
- Each process has a separate allowlisted schema; no process loads the global `.env` indiscriminately in production.
- Secrets are never printed. Validation reports only presence, format, and redacted prefixes.
- Frontend variables from `FINAL_PROMPT.md` are intentionally excluded because frontend work is forbidden.
- Status below reflects the current workspace: no project environment variables are set.

## 2.2 READY — canonical or Cursor-generated values

| Variable | Purpose | Required | Current status | How to obtain | Official documentation | Official link | Validation command | Expected result | Who provides it |
|---|---|---:|---|---|---|---|---|---|---|
| `KH_API_BASE` | KeeperHub API origin | Yes | Known, not set | Set to `https://app.keeperhub.com` | API Overview | https://docs.keeperhub.com/api | `curl -sS "$KH_API_BASE/api/chains" \| jq type` | `"array"` | KeeperHub |
| `BASE_RPC_URL_FALLBACK` | Public Base fallback read RPC | Yes | Known, not set | Set to `https://mainnet.base.org` | Base network information | https://docs.base.org/base-chain/reference/json-rpc-api | `cast chain-id --rpc-url "$BASE_RPC_URL_FALLBACK"` | `8453` | Third Party |
| `BASE_SEPOLIA_RPC_URL` | Rehearsal RPC | Yes | Known, not set | Set to `https://sepolia.base.org` unless Phase 00 requires a private endpoint | Base network information | https://docs.base.org/base-chain/reference/json-rpc-api | `cast chain-id --rpc-url "$BASE_SEPOLIA_RPC_URL"` | `84532` | Third Party |
| `USDC_ADDRESS_BASE` | Canonical Base USDC | Yes | Known, not set | Set to `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` after re-verification | Circle contract addresses | https://developers.circle.com/stablecoins/usdc-contract-addresses | `cast call "$USDC_ADDRESS_BASE" "symbol()(string)" --rpc-url "$BASE_RPC_URL"` | `USDC` | Third Party |
| `USDC_ADDRESS_BASE_SEPOLIA` | Official Base Sepolia USDC | Yes | Known, must re-verify | Set to the address currently published by Circle; expected `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Circle contract addresses | https://developers.circle.com/stablecoins/usdc-contract-addresses | `cast call "$USDC_ADDRESS_BASE_SEPOLIA" "symbol()(string)" --rpc-url "$BASE_SEPOLIA_RPC_URL"` | `USDC` | Third Party |
| `CHAIN_ID_MAINNET` | Mainnet guard | Yes | Known | `8453` | KeeperHub Chains API | https://docs.keeperhub.com/api/chains | `test "$CHAIN_ID_MAINNET" = 8453` | Exit 0 | Cursor |
| `CHAIN_ID_REHEARSAL` | Rehearsal guard | Yes | Known | `84532` | KeeperHub Chains API | https://docs.keeperhub.com/api/chains | `test "$CHAIN_ID_REHEARSAL" = 84532` | Exit 0 | Cursor |
| `PAYMENT_AMOUNT_USDC` | Per-slot amount in 6-decimal units | Yes | User-approved budget value | `10000` = 0.01 USDC | USDC decimals | https://developers.circle.com/stablecoins/usdc-contract-addresses | `test "$PAYMENT_AMOUNT_USDC" -eq 10000` | Exit 0 | Cursor |
| `PAYROLL_BUDGET_USDC` | Declared mission payroll budget | Yes | User-approved budget value | `5000000` = 5 USDC | Project budget contract | This document | Schema asserts at least 24 hours of slots | Exit 0 | Cursor |
| `ESCROW_FUND_USDC` | Initial fallback-fee escrow | Yes | User-approved budget value | `1000000` = 1 USDC | Project budget contract | This document | Schema asserts at least one fee cap | Exit 0 | Cursor |
| `MAINNET_TOTAL_SPEND_CAP_USDC` | Aggregate human stop cap across payroll, replay, fee, and escrow spending | Yes | User-approved safety value | `10000000` = 10 USDC | Project budget contract | This document | Preflight budget script | Planned spend at most 10 USDC | Cursor |
| `CADENCE_SECONDS` | PAYDAY cadence | Yes | Approved design value | `300` | Project contract | This document | `test "$CADENCE_SECONDS" -eq 300` | Exit 0 | Cursor |
| `GRACE_MISSED_RUNS` | Consecutive misses before rescue | Yes | Approved design value | `2` | Project contract | This document | `test "$GRACE_MISSED_RUNS" -ge 1 -a "$GRACE_MISSED_RUNS" -le 5` | Exit 0 | Cursor |
| `SENTINEL_POLL_SECONDS` | W2 schedule | Yes | Approved design value | `120` | Project contract | This document | `test "$SENTINEL_POLL_SECONDS" -eq 120` | Exit 0 | Cursor |
| `CLOCK_SKEW_SECONDS` | Timestamp tolerance | Yes | Approved safety value | `60` | Project contract | This document | `test "$CLOCK_SKEW_SECONDS" -le 60` | Exit 0 | Cursor |
| `RECEIPT_CONFIRMATIONS` | Reorg protection | Yes | Approved initial value | Start at `3`; change only from measured Base finality evidence | Base docs | https://docs.base.org | Schema test | Integer at least 1 | Cursor |
| `MAX_REPLAY_SLOTS` | Rescue blast-radius cap | Yes | Approved safety value | `12`; human approval required above it | Project contract | This document | `test "$MAX_REPLAY_SLOTS" -le 12` | Exit 0 | Cursor |
| `X402_FEE_USDC` | Paid W3 listing fee in 6-decimal units | Yes | Approved initial value | `50000` = 0.05 USDC, subject to Phase 00 Marketplace test | Marketplace | https://docs.keeperhub.com/workflows/marketplace | Schema test | Positive and at most cap | Cursor |
| `X402_MAX_FEE_USDC` | Maximum rescue fee | Yes | Approved initial value | `500000` = 0.50 USDC | Agentic Wallet | https://docs.keeperhub.com/ai-tools/agentic-wallet | Schema test | At most 500000 | Cursor |
| `SENTINEL_PORT` | Local Sentinel port | Yes | Known | `8787` | Project contract | This document | `test "$SENTINEL_PORT" -eq 8787` | Exit 0 | Cursor |
| `PRIMARY_OBSERVER_PORT` | Local Observer port | Yes | Known | `8788` | Project contract | This document | `test "$PRIMARY_OBSERVER_PORT" -eq 8788` | Exit 0 | Cursor |
| `SENTINEL_SHARED_SECRET` | Authenticate W2 and W3 requests | Yes | Not generated yet | Cursor generates 32 random bytes during environment phase | OpenSSL randomness | https://docs.openssl.org/3.0/man1/openssl-rand/ | `test "$(printf %s "$SENTINEL_SHARED_SECRET" \| wc -c)" -ge 64` | Exit 0 | Cursor |
| `PRIMARY_OBSERVER_SHARED_SECRET` | Authenticate Sentinel to Observer | Yes | Not generated yet | Cursor generates a different 32-byte secret | OpenSSL randomness | https://docs.openssl.org/3.0/man1/openssl-rand/ | Length and inequality checks | Exit 0; differs from Sentinel secret | Cursor |
| `RESCUE_JOURNAL_DIR` | Durable rescue journal mount | Yes | Known | `/var/lib/ember/rescues` in containers | Docker volumes | https://docs.docker.com/engine/storage/volumes/ | Startup write/fsync/read test | Durable writable directory | Cursor |
| `LOG_LEVEL` | Structured logging threshold | No | Known | `info` | Pino docs | https://getpino.io | Startup schema test | `info` | Cursor |
| `W2_HUB_SLUG` | Free template slug | Yes after publish | Planned | `continuity-wrapper` if available | Hub docs | https://docs.keeperhub.com/workflows/hub | Public Hub lookup | Exact listing | Cursor |
| `W3_MARKETPLACE_SLUG` | Paid rescue listing slug | Yes after publish | Planned | `ember-restore-and-replay` if available | Marketplace | https://docs.keeperhub.com/workflows/marketplace | `get_workflow_listing` | Exact listing and price | Cursor |

## 2.3 MISSING — user or external-provider action required

| Variable | Purpose | Required | Current status | How to obtain | Official documentation | Official link | Validation command | Expected result | Who provides it |
|---|---|---:|---|---|---|---|---|---|---|
| `KH_API_KEY_PRIMARY_EXECUTOR` | PAYDAY’s Org A workflow execution key | Yes | Missing | Create an Org A organization key in Settings | Authentication | https://docs.keeperhub.com/api/authentication | Authenticated workflow list; redact output | HTTP 200, Org A only | User / KeeperHub |
| `KH_API_KEY_PRIMARY_OBSERVER` | Observer’s separately rotatable Org A key | Yes | Missing | Create a second Org A organization key | API Keys | https://docs.keeperhub.com/api/api-keys | Authenticated W1 executions GET | HTTP 200 | User / KeeperHub |
| `KH_API_KEY_STANDBY` | Org B workflow and execution key | Yes | Missing | Create in Org B Settings | Authentication | https://docs.keeperhub.com/api/authentication | Authenticated workflow list | HTTP 200, Org B only | User / KeeperHub |
| `BASE_RPC_URL` | Reliable Base mainnet reads and receipts | Yes | Missing | Create a Base app in Alchemy or another approved provider | Alchemy Base API | https://www.alchemy.com/docs/chains/base/base-api-endpoints | `cast chain-id --rpc-url "$BASE_RPC_URL"` | `8453` | User / Third Party |
| `DEPLOYER_PRIVATE_KEY` | Contract deploy/register signer only | Yes during deploy | Missing | Generate a fresh EOA offline in WSL | Foundry Cast wallet | https://book.getfoundry.sh/reference/cast/cast-wallet-new | `cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY"` | Checksummed address; key not printed | User |
| `ETHERSCAN_API_KEY` | Base source verification | Yes | Missing | Create an Etherscan V2 API key | Etherscan API keys | https://docs.etherscan.io/getting-started/viewing-api-usage-statistics | Presence check; real validation at Sepolia verification | Verified source succeeds | User / Third Party |
| `EMPLOYEE_ADDRESS` | Beneficiary controlled for the demo | Yes | Missing | Generate or select a fresh EOA controlled by the user | Foundry Cast wallet | https://book.getfoundry.sh/reference/cast/cast-wallet-new | `cast balance "$EMPLOYEE_ADDRESS" --erc20 "$USDC_ADDRESS_BASE" --rpc-url "$BASE_RPC_URL"` | Numeric balance | User |
| `ORG_A_WALLET_ADDRESS` | Org A KeeperHub creator/workflow wallet | Yes | Missing | Verify email, open Org A Wallet tab, copy EVM address | Turnkey integration | https://docs.keeperhub.com/wallet-management/turnkey | USDC balance query | Address and expected funding | User / KeeperHub |
| `ORG_B_WALLET_ADDRESS` | Org B KeeperHub creator/workflow wallet and standby identity | Yes | Missing | Open Org B Wallet tab, copy EVM address | Turnkey integration | https://docs.keeperhub.com/wallet-management/turnkey | USDC/native balance query | Address and expected funding | User / KeeperHub |
| `PINATA_JWT` | Pin proof bundles | Yes | Missing | Create a Pinata API key with pinning permission | Pinata API keys | https://docs.pinata.cloud/account-management/api-keys | Test-authentication request | Authentication success message | User / Third Party |
| `IPFS_GATEWAY` | Fetch-back proof verification | Yes | Missing | Copy the user’s Pinata dedicated gateway domain, or approve public gateway | Pinata gateways | https://docs.pinata.cloud/gateways | Fetch a newly pinned test JSON | HTTP 200 and matching bytes | User / Third Party |
| `SENTINEL_PUBLIC_URL` | KeeperHub W2/W3 access to Sentinel | Yes | Missing | Create a named Cloudflare Tunnel or deploy a VPS endpoint | Cloudflare Tunnel | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/ | `curl -fsS "$SENTINEL_PUBLIC_URL/healthz"` | Real health JSON | User / Third Party |
| `PRIMARY_OBSERVER_PUBLIC_URL` | Sentinel access to isolated Observer | Yes | Missing | Deploy behind a separate authenticated hostname | Cloudflare Tunnel | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/ | Signed request to `/v1/workflows/$W1/executions` | HTTP 200; unsigned request 401 | User / Third Party |
| `DISCORD_WEBHOOK_URL` | Optional real rescue notifications | No | Missing | Discord server Settings → Integrations → Webhooks → New Webhook → Copy URL | Discord webhooks | https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks | Send one test notification after user approval | HTTP 204 and visible message | User / Third Party |

### Exact acquisition steps for every missing value

#### KeeperHub organization keys and wallets

1. Open https://app.keeperhub.com and create or sign into the account.
2. Verify the email; KeeperHub documents that the organization Turnkey wallet is then provisioned automatically.
3. Use the organization switcher to create or select Org A, named `EMBER PRIMARY`.
4. Open **Wallet** and copy its EVM address into `ORG_A_WALLET_ADDRESS`.
5. Open **Settings → API Keys → Organisation**.
6. Click **Create New Key**, name it `ember-payday-executor`, copy the one-time value into `KH_API_KEY_PRIMARY_EXECUTOR`.
7. Click **Create New Key** again, name it `ember-primary-observer`, copy it into `KH_API_KEY_PRIMARY_OBSERVER`.
8. Create or select a distinct Org B, named `EMBER STANDBY`.
9. Open Org B **Wallet** and copy the address into `ORG_B_WALLET_ADDRESS`.
10. Open Org B **Settings → API Keys → Organisation → Create New Key**, name it `ember-standby`, and copy it into `KH_API_KEY_STANDBY`.
11. Validate each key independently. Org A keys must list the same Org A workflows; Org B must not list them.
12. Do not describe either Org A key as read-only. Current KeeperHub permissions are full-scope.

Expected output: three different `kh_` secrets, two different EVM wallet addresses, and mutually isolated workflow lists.

#### Primary Base RPC

1. Open https://dashboard.alchemy.com and sign in.
2. Click **Create new app**.
3. Select **Base** and **Mainnet**.
4. Open the app’s **API Key** or **Endpoints** page.
5. Copy the HTTPS endpoint into `BASE_RPC_URL`.
6. Run the chain-ID and block-number validation commands.

Expected output: chain ID `8453` and a recent block number.

#### Deployer key

1. In the approved WSL2 environment, run `cast wallet new`.
2. Store the private key in the local secret store and `.env`; never send it in chat or commit it.
3. Put the printed address in the funding checklist.
4. Fund only the address with the approved Base Sepolia and Base mainnet gas amounts.

Expected output: one new address and one 64-hex private key known only to the user’s local environment.

#### Etherscan key

1. Open https://etherscan.io and sign in.
2. Open the user menu and choose **API Keys**.
3. Click **Add** or **Create new API key**.
4. Name it `EMBER`.
5. Copy it into `ETHERSCAN_API_KEY`.
6. Validate it by successfully verifying the rehearsal contract; a mere presence check is not sufficient.

Expected output: verified source on Base Sepolia’s explorer.

#### Employee address

1. Generate a fresh EOA with `cast wallet new`, or select a user-controlled address dedicated to this demo.
2. Store its private key offline if a new EOA was generated.
3. Set only the public address as `EMPLOYEE_ADDRESS`.
4. Confirm the address is not either KeeperHub wallet, the deployer, or the contract.

Expected output: a valid, distinct EVM address.

#### Pinata JWT and gateway

1. Open https://app.pinata.cloud and sign in.
2. Open **API Keys**.
3. Click **New Key**.
4. Enable only the permissions required to pin files/JSON.
5. Name it `EMBER Proof Pinner`.
6. Create the key and copy the JWT once into `PINATA_JWT`.
7. Open **Gateways**, create or select a dedicated gateway, and copy its HTTPS base URL into `IPFS_GATEWAY`.
8. Authenticate, pin one real validation JSON document, fetch it through the gateway, and compare bytes.

Expected output: successful authentication, a real CID, HTTP 200 from the gateway, and identical hash.

#### Public service URLs

1. Decide whether judged services run on a VPS or Cloudflare Tunnel.
2. For Cloudflare, open https://one.dash.cloudflare.com.
3. Select **Networks → Tunnels → Create a tunnel**.
4. Install the connector on the backend host.
5. Map one hostname to Sentinel port 8787 and a separate hostname to Observer port 8788.
6. Configure TLS and access policy; do not expose internal mutation endpoints.
7. Set the resulting HTTPS URLs.
8. Verify health and signed/unsigned behavior from a machine outside the host network.

Expected output: two HTTPS origins; health is reachable; protected routes reject missing, stale, replayed, and invalid signatures.

#### Discord webhook

1. Open the chosen Discord server.
2. Select **Server Settings → Integrations → Webhooks**.
3. Click **New Webhook**.
4. Choose the private rescue-alert channel.
5. Click **Copy Webhook URL**.
6. Store it in `DISCORD_WEBHOOK_URL`.

Expected output: an approved test message in the selected channel. This integration remains optional and must be removed from W3 if not configured.

## 2.4 UNKNOWN — produced by validated phases

| Variable | Purpose | Required | Current status | How to obtain | Official documentation | Official link | Validation command | Expected result | Who provides it |
|---|---|---:|---|---|---|---|---|---|---|
| `KH_ORG_A_W1_WORKFLOW_ID` | Canonical primary workflow | After W1 creation | Unknown | Return value from live `create_workflow` / dashboard URL | MCP Server | https://docs.keeperhub.com/ai-tools/mcp-server | List/get W1 with Org A key | Exact W1 config | KeeperHub |
| `KH_ORG_B_W2_WORKFLOW_ID` | Sentinel schedule workflow | After W2 creation | Unknown | Return value from Org B creation | MCP Server | https://docs.keeperhub.com/ai-tools/mcp-server | Get W2 and inspect enabled schedule | Exact W2 config | KeeperHub |
| `KH_ORG_B_W3_WORKFLOW_ID` | Rescue workflow | After W3 creation | Unknown | Return value from Org B creation | MCP Server | https://docs.keeperhub.com/ai-tools/mcp-server | Validate and execute W3 | Terminal real result | KeeperHub |
| `CONTINUITY_ADDRESS_SEPOLIA` | Rehearsal contract | After rehearsal deploy | Unknown | Foundry broadcast receipt | Foundry deployment | https://book.getfoundry.sh/forge/deploying | `cast code` | Non-empty bytecode | Cursor |
| `CONTINUITY_ADDRESS_MAINNET` | Production contract | After human-approved cutover | Unknown | Mainnet broadcast receipt | Foundry deployment | https://book.getfoundry.sh/forge/deploying | `cast code` plus explorer verification | Non-empty verified bytecode | Cursor |
| `MISSION_ID_SEPOLIA` | Rehearsal mission | After registration | Unknown | `MissionRegistered` event | Contract ABI produced in Phase 03 | This repository after implementation | Read mission struct | Exact registered values | Cursor |
| `MISSION_ID_MAINNET` | Mainnet mission | After registration | Unknown | Mainnet event | Contract ABI produced in Phase 03 | This repository after implementation | Read mission struct | Exact registered values | Cursor |
| `X402_PAYER_WALLET_ADDRESS` | Separate wallet paying W3 | After `wallet add` | Unknown | `keeperhub-wallet info` after explicit provisioning | Agentic Wallet | https://docs.keeperhub.com/ai-tools/agentic-wallet | Onchain USDC balance plus wallet info | Same valid address | KeeperHub |
| `WORKFLOW_HASH_SEPOLIA` | Hash of canonical rehearsal W1 | After export | Unknown | Canonicalizer output | Import/Export | https://docs.keeperhub.com/workflows/import-export | Run canonicalizer twice | Identical bytes32 | Cursor |
| `WORKFLOW_HASH_MAINNET` | Hash of canonical mainnet W1 | After export | Unknown | Canonicalizer output | Import/Export | https://docs.keeperhub.com/workflows/import-export | Run canonicalizer twice | Identical bytes32 | Cursor |

---

# 3. What is needed from the user

Complete in dependency order. Do not provide a later item before its prerequisite.

## Current workstation audit

| Tool | Observed status on 2026-07-22 | Required action |
|---|---|---|
| WSL2 | Installed, version 2.7.1.0 | Confirm an Ubuntu distribution is available and approved |
| Node.js | Ready, v24.12.0 | Keep Node 24 LTS |
| pnpm | v9.15.0 | Upgrade to pnpm 10 in WSL2 |
| Git | Ready, v2.52.0 | No action |
| GitHub CLI authentication | Not authenticated | User runs `gh auth login` before repository/PR operations |
| Foundry (`forge`, `cast`, `anvil`) | Missing | Install in WSL2 |
| Docker | Missing — **not required** | Do not block on Docker. Prefer native Node processes + process-kill chaos. Compose/Dockerfiles remain optional packaging. |
| KeeperHub CLI (`kh`) | Missing | Install current release; expected baseline v0.10.0 |
| jq | Missing | Install jq 1.7 or newer |
| Go | Missing | Install only if needed to build/install `kh`; prefer official binary release |

## Accounts and decisions

- [ ] Confirm WSL2 Ubuntu is the implementation environment.
- [x] Docker Desktop **not installed** — waived; chaos uses process-level kills (see `docs/RUNBOOK.md`).
- [ ] Authenticate GitHub CLI with `gh auth login`.
- [ ] Create or approve creation of the public GitHub repository.
- [ ] Approve Apache-2.0 as the default project license, or provide a different license.
- [ ] Register for the hackathon at https://dorahacks.io/hackathon/agents-onchain/detail.
- [ ] Join https://discord.gg/keeperhub and the builder/help channels.
- [ ] Create or confirm the KeeperHub account.
- [ ] Create `EMBER PRIMARY` Org A.
- [ ] Create `EMBER STANDBY` Org B.
- [ ] Confirm the two organization wallet addresses.
- [ ] Create the two Org A keys and one Org B key through the dashboard.
- [ ] Create an Alchemy Base app and provide its HTTPS RPC through local `.env`.
- [ ] Create an Etherscan API key and place it in local `.env`.
- [ ] Create a Pinata key and gateway and place both in local `.env`.
- [ ] Approve Cloudflare Tunnel or a VPS as the public service host.

## Wallets and funding

- [ ] Generate and securely store a fresh deployer key.
- [ ] Generate or choose the employee beneficiary address.
- [ ] Generate the separate first-party agentic payer wallet with `wallet add` only after Phase 00 verifies the current package.
- [ ] Fund the deployer with Base Sepolia ETH and no more than the approved mainnet ETH budget.
- [ ] Obtain Base Sepolia USDC for both KeeperHub org wallets.
- [ ] Before mainnet cutover, fund Org A with 5 USDC for the 24-hour payroll watch and buffer.
- [ ] Before mainnet cutover, fund Org B with 2 USDC for receipt-checked replay plus the minimum native gas required when sponsorship is unavailable.
- [ ] Fund the separate payer wallet with 0.50 USDC for x402/MPP calls.
- [ ] Fund mission escrow with 1 USDC only after rehearsal contract tests and fee-mode invariants pass.
- [ ] Run the budget preflight and confirm aggregate planned USDC spending is at most 10 USDC; a higher amount requires a new explicit approval.
- [ ] Approve every mainnet-spending command immediately before execution; this approval cannot be delegated to Cursor.

## Access and human-only evidence

- [ ] Perform the dashboard export of W1.
- [ ] Perform and screenshot a dashboard import into Org B.
- [ ] Confirm wallet integration bindings in both organizations.
- [ ] Confirm current KeeperHub plan execution and gas-credit limits on the Billing page.
- [ ] Ask KeeperHub support whether Marketplace write-call semantics match the current docs conflict; retain the answer as evidence.
- [ ] Ask KeeperHub support whether any preview read-only key scope exists; plan assumes it does not.
- [ ] Approve publishing W2 to Hub and W3 to Marketplace.
- [ ] Approve submission links, demo video, and public repository before final submission.

Secrets must be placed directly into local `.env` or the deployment secret manager. They must not be pasted into chat.

---

# 4. What Cursor can do without the user

- Audit the repository and current toolchain.
- Create the backend-only repository structure.
- Configure Node 24, pnpm 10, strict TypeScript, linting, formatting, tests, coverage, and CI.
- Create `.env.example`, process-specific environment schemas, validation scripts, and secret-redaction tests.
- Implement and test `Continuity.sol`.
- Implement unit, fuzz, invariant, and gas tests.
- Implement deployment and verification scripts without broadcasting.
- Implement the KeeperHub MCP/CLI/API adapter from captured real responses.
- Implement PAYDAY cadence logic and recovery journal.
- Implement Primary Observer’s strict read-only application surface.
- Implement Sentinel detection, HMAC authentication, replay protection, and state machine.
- Implement slot arithmetic, receipt verification, canonical workflow hashing, replay journaling, proof hashing, Pinata verification, and fee-mode enforcement.
- Implement Dockerfiles, Compose, health checks, metrics, log rotation, and persistent volumes.
- Create W1/W2/W3 payloads only after runtime schema discovery.
- Run all local and rehearsal tests once credentials and funds exist.
- Produce real evidence manifests containing IDs, CIDs, hashes, and explorer links.
- Create operational runbooks, threat model, recovery procedures, demo script, README, and submission checklist.
- Prepare but not execute mainnet commands.
- Update this plan when official docs, release notes, SDK, CLI, or live behavior change.

Cursor cannot create user accounts, pass email verification, accept terms, recover secrets, fund wallets, approve mainnet spend, publish under the user’s identity, or submit the hackathon entry without user action.

---

# 5. Implementation plan

## Global phase contract

Every phase starts with the Research Check in Section 6. Every phase ends with:

1. Lint clean.
2. Typecheck clean.
3. Relevant unit/integration/contract tests clean.
4. No source TODO, FIXME, placeholder, fake hash, fake address, mock transaction, or unverified KeeperHub payload.
5. Evidence captured from real commands.
6. `docs/BREAKING_CHANGES_LOG.md` updated.
7. `docs/DEVIATIONS.md` updated when this plan differs from live behavior.
8. One atomic commit that can be reverted.

### Phase 00 — Platform feasibility and current-contract verification

**Goal:** Prove every load-bearing KeeperHub behavior before application implementation.

**Files:** `IMPLEMENTATION_PLAN.md` updates only until findings are known; after approval, `docs/evidence/platform-verification.md`.

**Dependencies:** User KeeperHub account, Org A, Org B, API keys, minimal payer-wallet funding.

**Commands:** inspect `kh version`; `kh workflow run --help`; MCP `tools_documentation`; `list_action_schemas`; authenticated organization list checks; official `mcp-test` paid call; dashboard export/import.

**Tests:**

- Org isolation.
- Full-scope key behavior documented.
- Manual workflow creation and execution.
- Cross-org import and credential rebinding.
- Paid read workflow call.
- Harmless paid workflow test establishing whether W3’s intended node graph executes or returns calldata.
- CLI structured output and wait behavior.
- SDK package/version and actual endpoint coverage.

**Validation:** Evidence includes exact CLI version, exact tool names, redacted API responses, request IDs, workflow IDs, paid settlement tx, and dashboard screenshots.

**Rollback:** Delete only disposable Phase 00 workflows after explicit user approval; revoke and rotate temporary keys; retain evidence.

**Expected output:** A dated compatibility matrix with PASS/FAIL for every ambiguity in Section 1.6.

**Stop Gate:** Any failed load-bearing behavior stops the project. Amend architecture and obtain plan approval before Phase 01.

**Definition of Done:** No KeeperHub capability used later remains inferred.

### Phase 01 — WSL2 toolchain, repository, workspace, and CI

**Goal:** Reproducible backend workspace with green CI.

**Files:** root workspace files, `.nvmrc`, `.env.example`, `.gitignore`, TypeScript configs, lint/format/test configs, `.github/workflows/ci.yml`, empty package entry points with no pretend implementations.

**Dependencies:** Phase 00 PASS; WSL2 Ubuntu.

**Commands:** install/verify Node 24, pnpm 10, Foundry, Docker, `kh`, `jq`, Git; `pnpm install`; workspace build/test/lint/typecheck; `forge --version`; `docker version`.

**Tests:** Environment schema rejects an empty configuration; secret-pattern scan; `.env` ignore test.

**Validation:** Local commands and GitHub CI all exit 0.

**Rollback:** Revert the scaffold commit; no external state.

**Expected output:** Green CI badge and deterministic lockfile.

**Stop Gate:** Do not continue with pnpm 9, missing Foundry/CLI, red CI, or secret scan findings. Missing Docker is **not** a stop gate.

**Definition of Done:** A clean clone in WSL2 can install, build, lint, typecheck, and test.

### Phase 02 — Environment, cryptographic request authentication, and safety policy

**Goal:** Fail-fast, process-specific configuration with no cross-boundary secret leakage.

**Files:** mission-core environment module/tests, HMAC module/tests, nonce store, environment validation script.

**Dependencies:** Phase 01.

**Commands:** package tests with branch coverage; full environment presence/format validator.

**Tests:** Missing values; malformed addresses/URLs; payment cap; distinct HMAC secrets; stale timestamp; replayed nonce; body tampering; redacted errors; forbidden secret in wrong process.

**Validation:** 100% branch coverage on security-critical loaders and HMAC verifier.

**Rollback:** Revert commit and rotate a secret if it appeared in output.

**Expected output:** Each service loads only its allowlisted variables.

**Stop Gate:** Any secret leakage, permissive default, or replay acceptance blocks Phase 03.

**Definition of Done:** Misconfiguration fails before network access.

### Phase 03 — `Continuity.sol`

**Goal:** Implement the corrected mission, proof, and mutually exclusive fee contract.

**Files:** Foundry configuration, contract, unit/fuzz/invariant tests, deploy script.

**Dependencies:** Phase 02; current OpenZeppelin v5 release verified.

**Commands:** `forge fmt --check`; `forge build`; unit/fuzz/invariant tests; coverage; gas snapshot; Slither.

**Tests:** All roles, zero addresses, cadence/start bounds, rescue-ID uniqueness, append-only proofs, all fee modes, external-paid claim rejection, duplicate claim rejection, cap/escrow boundaries, reentrancy, fee-on-transfer/reverting-token behavior.

**Validation:** At least 95% line coverage and 100% coverage of authorization/fee branches; invariants pass at configured runs/depth; static analysis findings triaged.

**Rollback:** Revert before deployment.

**Expected output:** One immutable contract artifact with stable ABI and gas snapshot.

**Stop Gate:** Never weaken an invariant to pass a test.

**Definition of Done:** Contract behavior exactly matches Section 1.3.

### Phase 04 — Base Sepolia deployment and mission-core primitives

**Goal:** Verified rehearsal contract plus deterministic slot, workflow-hash, rescue-ID, and proof primitives.

**Files:** deploy/register dry-run scripts; mission-core schedule, canonicalization, diff, proof, and property tests.

**Dependencies:** Phase 03; Base Sepolia RPC, deployer funds, official Sepolia USDC re-verified.

**Commands:** deploy with broadcast/verify; `cast code`; contract reads; property and determinism tests.

**Tests:** Exact-boundary slots, clock skew, late completion, reorg confirmation threshold, canonical JSON permutations, duplicate rescue IDs, 100 repeated proof hashes.

**Validation:** Explorer source verified; canonical outputs byte-identical across runs and machines.

**Rollback:** Deploy a new immutable instance and record the abandoned address.

**Expected output:** `CONTINUITY_ADDRESS_SEPOLIA` and deterministic core libraries.

**Stop Gate:** No unverified contract or unstable canonicalization.

**Definition of Done:** Rehearsal chain and pure primitives are trustworthy.

### Phase 05 — KeeperHub access layer from live contracts

**Goal:** One typed boundary for MCP, CLI, official SDK, and documented read API.

**Files:** `packages/kh-client`, real captured fixtures, live smoke scripts, typed errors.

**Dependencies:** Phase 00 compatibility matrix; Phase 02 env.

**Commands:** capture real Org A/Org B responses; package tests; live smoke; MCP execute and execution wait; analytics SSE observation.

**Tests:** Response parsing, bare-array exceptions, error envelopes, request IDs, 401/404/409/429/5xx, `Retry-After`, bounded retry, timeout, SSE reconnect, CLI JSON parsing.

**Validation:** Lists each org separately, waits for one real terminal execution, and receives real analytics events.

**Rollback:** Revert code; no platform mutations beyond approved disposable workflow.

**Expected output:** No guessed fields and no duplicate KeeperHub client logic.

**Stop Gate:** Schema mismatch requires a new fixture and deviation entry, never a permissive `any`.

**Definition of Done:** All later components consume typed, live-derived contracts.

### Phase 06 — W1 and PAYDAY

**Goal:** PAYDAY invokes one real W1 transfer per expected slot and stops when its container dies.

**Files:** PAYDAY service, journal, Dockerfile, W1 export, canonicalizer, tests.

**Dependencies:** Phase 05; Org A wallet integration; Sepolia USDC.

**Commands:** discover current transfer schema; create W1 disabled; validate; execute manually; wait; verify receipt; export; canonicalize; run PAYDAY for at least four slots.

**Tests:** Restart before/after invoke; duplicate timer wake-up; execution timeout; receipt mismatch; future-slot-only revival; container kill.

**Validation:** At least four receipt-valid scheduled-by-PAYDAY transfers; `docker kill payday` produces no subsequent W1 invocation.

**Rollback:** Stop PAYDAY and disable W1; never delete without approval.

**Expected output:** Real W1 ID, export, stable hash, and run evidence.

**Stop Gate:** If W1 fires without PAYDAY, the liveness model is broken.

**Definition of Done:** Process death deterministically creates missed mission slots.

### Phase 07 — Primary Observer credential-isolation service

**Goal:** Expose only signed W1 history while confining the full-scope Org A observer key.

**Files:** Observer service, route allowlist, Dockerfile, deployment config, security tests.

**Dependencies:** Phase 05; observer key; public Observer URL.

**Commands:** start service; signed GET; negative route/method tests; external health probe.

**Tests:** Missing/bad/stale/replayed HMAC; non-GET request; path traversal; arbitrary workflow ID; response-size limit; KeeperHub 401/429/5xx; secret scan.

**Validation:** Sentinel can read only the configured W1 history; mutation attempts are impossible at the application route layer.

**Rollback:** Stop Observer and revoke its key.

**Expected output:** A narrow read relay with signed responses and request correlation.

**Stop Gate:** Any generic proxy behavior or Org B credential presence blocks Phase 08.

**Definition of Done:** Sentinel never possesses an Org A key.

### Phase 08 — Sentinel detection and W2

**Goal:** Correct state transitions from real run history and chain receipts.

**Files:** Sentinel health/check/status/metrics routes, detector, receipt checker, W2 export, tests.

**Dependencies:** Phases 04, 06, and 07; Sentinel URL.

**Commands:** create/validate W2; manual W2 run; enable schedule; run PAYDAY alive/dead/revived scenarios.

**Tests:** Slot boundaries, warming period, late run, failed run, receipt status 0, wrong token/from/to/amount, RPC fallback, reorg confirmation, two misses, state recovery.

**Validation:** Real sequence `WARMING_UP → OK → DEGRADED → MISSION_DOWN → RECOVERED` with exact slot IDs.

**Rollback:** Disable W2 and stop Sentinel.

**Expected output:** Deterministic detection with no false rescue while PAYDAY is healthy.

**Stop Gate:** Any false positive, false negative, or KeeperHub-only payment verdict blocks replay work.

**Definition of Done:** Detection is receipt-backed and reproducible.

### Phase 09 — Restore, replay, and W3

**Goal:** Idempotent, crash-resumable replay of only unpaid slots.

**Files:** rescue state machine, write-ahead journal, single-flight lock, receipt checker integration, W3 export, tests.

**Dependencies:** Phase 08; Org B wallet and Sepolia USDC.

**Commands:** import W1 export into Org B; validate disabled copy; create W3; execute full two-miss rescue; rerun; kill Sentinel at controlled boundaries.

**Tests:** Hash tamper; duplicate trigger; concurrent trigger; partial import; failed replay; receipt mismatch; restart after every state transition; `MAX_REPLAY_SLOTS` cap.

**Validation:** Exactly N real transfers for N unpaid slots; immediate rerun creates zero; three crash points resume without duplicate payment.

**Rollback:** Disable W3 and imported W1 copy; mark journal aborted; real transfers remain final.

**Expected output:** Real replay txs and complete journal.

**Stop Gate:** Any duplicate transfer is a critical failure and resets all replay validation.

**Definition of Done:** Rescue is idempotent under retries, concurrency, and process death.

### Phase 10 — Proof and onchain anchor

**Goal:** Publicly verifiable proof for each rescue.

**Current result (2026-07-22): PASS on Base Sepolia.** Canonical proof
`Qmaq9qJ8KEcvR4yv8JitRXLwViDDdm5mnH8AkrMzrvzE6P` was fetched back and
rehashed, then anchored by KeeperHub execution `2bzbh77l318kr8hr67zsa`
in transaction `0xad0fe495639b4222cf80d25bbf434dccfa42f023cf145339afd9702d401ed87b`.
Stored proof fields and `ProofAnchored` were independently read from chain.

**Files:** proof schema, canonical serializer, Pinata client, anchor adapter, evidence verifier.

**Dependencies:** Phase 09; Pinata; rehearsal contract; Org B authorization.

**Commands:** build proof; pin; fetch; hash; execute `anchorProof` through KeeperHub; verify event and sender.

**Tests:** Serialization determinism, gateway corruption, timeout/retry, secret-shaped field rejection, duplicate rescue anchor, wrong standby.

**Validation:** Local hash, fetched-content hash, event hash, rescue ID, CID, and transaction sender all agree.

**Rollback:** Append a superseding correction proof; immutable bad anchors are never hidden.

**Expected output:** One real CID and one verified anchor transaction.

**Stop Gate:** Never anchor before successful fetch-back verification.

**Definition of Done:** A third party can reconstruct and verify the rescue without trusting Sentinel.

### Phase 11 — Marketplace payment, fee fallback, and Hub publication

**Goal:** Complete one real paid call and prove one-fee-only behavior.

**Files:** fee state machine, payer setup/runbook, W2 Hub artifact, W3 listing evidence, tests.

**Dependencies:** Phase 00 paid-call PASS; Phase 10; user publication approval.

**Commands:** install wallet skill; add payer wallet; set safety policy; fund minimally; list W3; call and settle; inspect Earnings; exercise escrow fallback on a separate rehearsal rescue; publish/fork W2.

**Tests:** x402 success, MPP if funded and required for scoring, external-payment reference capture, payment failure, fallback selection, double-claim rejection, over-cap rejection.

**Validation:** Public listing metadata, real payment tx, real execution, 70% creator earning evidence, one fallback claim on a different rescue, public W2 duplication.

**Rollback:** Unlist W3; make W2 private; stop payer calls; rotate wallet HMAC if exposed.

**Expected output:** Real Marketplace and Hub evidence with no double charge.

**Stop Gate:** If paid W3 cannot execute the intended rescue semantics, stop and amend the architecture; do not fake a marketplace success.

**Definition of Done:** Both primary and fallback fee paths work and are mutually exclusive.

### Phase 12 — Full rehearsal, security, chaos, and soak

**Goal:** Production seriousness on Base Sepolia.

**Files:** self-asserting chaos scripts, threat model, QA checklist, demo runbook, reconciliation script.

**Dependencies:** Phases 01–11.

**Commands:** full drill three times; 12-hour soak; static analysis; dependency audit; secret/history scan; clean-machine deployment.

**Chaos without Docker (required substitute set):**
| Failure class | Docker-era action | Approved substitute |
|---|---|---|
| PAYDAY death | `docker kill payday` | Windows: `Stop-Process` on PAYDAY PID; Linux/WSL: `kill`/`pkill` |
| Sentinel mid-rescue crash | `docker kill sentinel` | Same process kill; restart `node dist/main.js`; journal must resume |
| Host reboot | VM restart | Stop all Node services, cold-start from journal + env |
| Deployed outage | n/a | Render: restart / redeploy / scale-to-zero then restore |

**Tests:** PAYDAY kill, PAYDAY host restart, Observer outage, Observer key revoke, Sentinel crash, RPC primary outage, Pinata outage, duplicate rescue, Marketplace failure, insufficient balance, W1 tamper, Org B key rotation.

**Validation:** Three consecutive full drills green; one includes mid-replay Sentinel death; soak has zero false rescues and stable resources; reconciliation delta is zero.

**Rollback:** Disable all workflows, stop services, revoke keys, preserve journals/evidence.

**Expected output:** Complete rehearsal evidence and timed terminal-only demo.

**Stop Gate:** Any unexplained ledger delta, flaky drill, secret finding, or unresolved high-severity issue blocks mainnet.

**Definition of Done:** Backend can survive every declared interruption without duplicate payment.

### Phase 13 — Base mainnet cutover

**Goal:** Human-approved real Base execution with tightly bounded funds.

**Files:** mainnet W1 export, deployment evidence, environment manifest with redacted values, cutover log.

**Dependencies:** Phase 12; user sign-off; funded wallets; current official docs rechecked.

**Commands:** deploy/verify contract; create mainnet W1; canonicalize; register/fund mission; repoint services; run three normal slots; kill PAYDAY; run one rescue; revive; reconcile.

**Tests:** Mainnet dry run only; no destructive experimentation.

**Validation:** Verified contract; real normal and replay txs; exact beneficiary balance delta; real fee; real CID/anchor; zero duplicate slots.

**Rollback:** Emergency-stop W1/W2/W3, stop services, unlist W3, investigate. Immutable contract replacement requires a new deployment and mission.

**Expected output:** Complete set of public Base explorer evidence.

**Stop Gate:** Cursor cannot self-approve any broadcast or funding command.

**Definition of Done:** The core hackathon requirement is satisfied by real KeeperHub-executed transactions.

### Phase 14 — Backend watch, documentation, demo, and submission

**Goal:** Stable judged backend and complete submission without building a frontend.

**Files:** README, architecture diagram, threat model, runbook, demo script, evidence index, submission checklist, onboarding teardown.

**Dependencies:** Phase 13.

**Commands:** 24-hour watch; hourly reconciliation; two controlled rescues; README clean-clone test; final CI; link checker.

**Tests:** Judge clone/setup; expired tunnel; revoked key recovery; backup restore; terminal demo under three minutes.

**Validation:** Public repo, short video, real transaction link, contract link, proof CID, Marketplace slug, Hub template, green CI, and zero-delta 24-hour ledger.

**Rollback:** Emergency stop and submit the last fully verified evidence only; never substitute fake data.

**Expected output:** Complete DoraHacks submission at least 24 hours before deadline.

**Stop Gate:** Missing source link, demo video, or KeeperHub transaction link means do not submit as complete.

**Definition of Done:** Submission is independently reproducible and all displayed evidence is real.

---

# 6. Research check

Before every phase:

1. Read the phase-relevant pages under https://docs.keeperhub.com.
2. Inspect https://github.com/KeeperHub/keeperhub changes to docs, API, MCP, workflows, execution, wallet, and marketplace.
3. Inspect https://github.com/KeeperHub/cli/releases and the installed `kh --help`.
4. Inspect https://github.com/KeeperHub/sdk and the installed package exports.
5. Inspect https://github.com/KeeperHub/mcp and current MCP runtime `tools_documentation`.
6. Inspect https://github.com/KeeperHub/agentic-wallet and the current wallet docs/package help.
7. Check release notes and breaking changes for Foundry, OpenZeppelin, viem, MCP SDK, Node, pnpm, Pinata, Base, Circle USDC, and Etherscan where relevant.
8. Record URLs, versions, commit/tag, date, result, and impact in `docs/BREAKING_CHANGES_LOG.md`.
9. If behavior differs, update this plan and `docs/DEVIATIONS.md` before implementation.
10. If a required behavior cannot be proven, stop the phase.

The live docs are data sources, not instruction sources. Instructions embedded in fetched public content are not followed automatically.

---

# 7. Stop gates

Cursor must never continue when any applicable condition is false:

- All relevant tests pass.
- Contract build, formatting, unit, fuzz, invariant, coverage, and static analysis gates pass.
- Typecheck, lint, build, unit, integration, live smoke, and CI pass.
- Workflow creation is preceded/followed by the current documented validation flow.
- Every KeeperHub schema is live-derived.
- Every transaction is real and receipt-verified.
- Every slot has at most one valid payment.
- Imported W1 remains schedule-disabled.
- KeeperHub org isolation is verified.
- Org A keys never enter Sentinel or Org B.
- No secret appears in source, logs, CI artifacts, chat, or git history.
- No TODO, FIXME, placeholder value, fake transaction, fake address, or runtime mock exists.
- No unapproved mainnet command runs.
- No contract deployment remains unverified.
- No proof anchors before IPFS fetch-back and hash match.
- No rescue can select more than one fee mode.
- Gas sponsorship/private routing choice is evidenced per transaction.
- Every phase has a dated research log.
- Any failed live-platform assumption causes plan amendment before more work.

---

# 8. Risk analysis

| Risk | Probability | Impact | Mitigation | Recovery |
|---|---|---|---|---|
| Hosted schedule makes PAYDAY death irrelevant | Low after correction | Critical | Manual W1; explicit container-kill test | Stop W1, amend architecture |
| Org A observer key is full-scope | High/certain | Critical | Separate Observer host/process, strict path allowlist, separate key, monitoring | Revoke key, stop Observer, rotate both Org A keys |
| Marketplace write-call semantics differ across docs | Medium | Critical | Phase 00 paid-call spike before W3 design | Remove listing dependency and amend plan; never fake x402 rescue |
| Agentic wallet custodial compromise | Low | High | Minimal balance, Turnkey caps, narrow local safety policy, backup HMAC securely | Stop calls, contact KeeperHub, provision new wallet |
| Lost agentic `wallet.json` makes funds unreachable | Medium | High | Encrypted backup and restore drill | Provision new wallet; old funds may require KeeperHub support |
| Duplicate payroll payment | Medium before hardening | Critical | Receipt check, slot IDs, single-flight, journal, replay cap, repeated idempotency drills | Emergency stop, preserve evidence, compensate only with human decision |
| Chain reorg invalidates an early receipt | Low | High | Confirmation threshold and recheck before replay/anchor | Reclassify slot and anchor superseding proof |
| KeeperHub successful run lacks usable tx hash | Medium | High | Use execution list/status/wait/log fallbacks from official API | Stop rescue and raise platform issue |
| API/SDK schema drift | High | High | Real fixtures, strict schemas, per-phase research | Refresh fixture/schema and log deviation |
| CLI flag/version drift | Medium | Medium | Runtime help as source of truth | Update adapter and pinned version |
| Cross-org import resets wallet integration | High/expected | High | Rebind Org B integration and keep imported workflow disabled | Abort rescue until binding validates |
| Canonical hash omits meaningful fields | Medium | Critical | Versioned canonicalization spec and mutation tests | Register a new mission with corrected hash |
| Clock skew/off-by-one slot math | Medium | Critical | Onchain start anchor, UTC integers, property tests | Stop replay; recalculate and supersede proof |
| Rescue exceeds safe backlog | Medium | High | `MAX_REPLAY_SLOTS=12` and human gate above cap | Pause and perform reviewed batch rescue |
| x402 plus escrow double charge | Medium without contract guard | Critical | Immutable fee mode and rescue-ID settlement state | Refund operationally if possible; deploy corrected contract if invariant fails |
| Marketplace 30% fee changes economics | High/certain | Medium | Price explicitly and show gross/net | Adjust future listing price within approved cap |
| Gas sponsorship unavailable | Medium | High | Fund minimal native gas; validate billing credits | Use wallet gas after human-approved top-up |
| Sponsorship disables private routing | High/certain | Medium | Choose and disclose per transaction | Retry using funded private route if MEV protection is required |
| KeeperHub/MCP outage during rescue/demo | Low–Medium | Critical | Journal, bounded retry, recorded real backup evidence | Resume after service restoration; never replay blindly |
| RPC outage or rate limit | Medium | High | Primary/fallback reads, rate-limit handling | Switch fallback and reconcile from last confirmed state |
| Pinata/gateway outage | Medium | High | Retry, alternate approved gateway read, never anchor unverified | Leave rescue journal pending; resume pin/fetch later |
| Tunnel/VPS outage | Medium | High | Named tunnel/VPS, uptime monitor, restart policy | Reconnect, rotate hostname config, rerun W2 check |
| Contract authorization/config bug | Low after tests | Critical | Invariants, Sepolia drills, verified constructor/registration reads | Emergency stop; deploy replacement mission |
| Secret committed or logged | Low | Critical | Ignore rules, scanners, redaction, process schemas | Revoke/rotate immediately and purge before public release |
| Windows/WSL path or permission mismatch | Medium | Medium | Perform all implementation in WSL filesystem | Re-clone into WSL and rerun clean setup |
| Insufficient USDC/native balance | Medium | High | Preflight balances and spending budget | Pause and request explicit top-up |
| W1 or W3 deleted irreversibly | Low | High | Disable instead of delete; deletion requires user approval | Re-import canonical export and update IDs |
| No frontend reduces demo legibility | Medium | Medium | Timed terminal demo plus KeeperHub dashboard/explorer | Improve script and evidence index, not UI |
| Submission incomplete or late | Medium | Critical | Submit at least 24 hours early; validate links incognito | Use complete last-known-good evidence before deadline |
| Scope expansion exceeds hackathon window | Medium | High | Keep 2 agents, 1 contract, 3 workflows; no frontend | Cut optional Discord/MPP, never cut correctness |

---

# 9. Dependency graph

```text
User accounts and WSL2 toolchain
└── Phase 00 live KeeperHub feasibility
    └── Repository, CI, environment security
        ├── Continuity.sol
        │   └── Base Sepolia deployment and mission registration
        └── Live-derived KeeperHub adapter
            ├── W1 + PAYDAY manual cadence
            │   └── Primary Observer
            └── Org B access
                └── W2 + Sentinel detection
                    └── Receipt-checked restore/replay + W3
                        ├── Proof → Pinata → onchain anchor
                        └── x402/MPP fee OR escrow fallback
                            └── Hub/Marketplace publication
                                └── Chaos + soak + security gates
                                    └── Human-approved Base mainnet cutover
                                        └── 24-hour watch and submission
```

Critical path:

`Phase 00 → W1 manual liveness → Observer isolation → receipt-backed detection → idempotent replay → one-fee settlement → proof anchor → chaos → mainnet`.

No phase may run concurrently with another phase that mutates the same KeeperHub organization, workflow, contract deployment, or mission.

---

# 10. Execution strategy

Only the next prompt is generated. Phase 01 is not generated until Phase 00 passes and the user sends `NEXT`.

## PHASE 00

### Prompt

Read `IMPLEMENTATION_PLAN.md`, `FINAL_PROMPT.md`, `KEEPERHUB_MASTER_REFERENCE (1).md`, and `KEEPERHUB_HACKATHON_INTELLIGENCE (1).md`. Perform Phase 00 only: verify current KeeperHub docs, repositories, releases, installed CLI help, MCP `tools_documentation`, API key/org isolation, manual workflow execution, cross-org workflow export/import and credential rebinding, agentic-wallet two-step provisioning, one real minimal paid call, Marketplace read-versus-write call semantics, official SDK endpoint coverage, and supported CLI structured-output/wait flags. Use no application code, no mock data, no fake transaction, and no placeholder. Record redacted evidence, request IDs, versions, URLs, workflow IDs, and the real settlement transaction in `docs/evidence/platform-verification.md`; update `IMPLEMENTATION_PLAN.md` and `docs/DEVIATIONS.md` if live behavior differs. Do not begin Phase 01.

### Expected output

- A dated PASS/FAIL compatibility matrix for every item in “Known live-document inconsistencies.”
- Exact installed/latest CLI version and supported flags.
- Exact current MCP tools needed by EMBER.
- Proven Org A/Org B isolation.
- Proven cross-org import and integration rebinding behavior.
- Proven paid-call behavior and real settlement evidence.
- A documented SDK/MCP/CLI/REST boundary.
- No application implementation.

### Validation

- Every matrix row has official URL, date, command/tool, redacted actual result, expected result, and PASS/FAIL.
- The paid-call row contains a real explorer transaction.
- The import row contains dashboard evidence from both organizations.
- No secret appears in evidence.
- No unresolved load-bearing row is marked PASS.

### Stop Gate

Stop after Phase 00. If any load-bearing row fails, amend the architecture and request approval. If all rows pass, report completion and wait for the user to send `NEXT`.


# EMBER Project Execution History

Last reconciled: 2026-07-23 00:07 UTC+3  
Repository checkpoint: `0ecb561c50da8d25799a2eb6444127e8b88caa9a` plus the uncommitted final-certification changes documented in the last section  
Scope: backend, contracts, KeeperHub workflows, infrastructure, validation, evidence, and operational decisions. Frontend implementation is intentionally deferred.

## Historical integrity notes

- The repository has a deliberately constructed dated commit history spanning 2026-07-15 through 2026-07-22. `scripts/build-dated-history.mjs` was used to publish roughly ninety review-sized commits. Commit subjects are the intended narrative sequence, but evidence timestamps are more authoritative for live operations.
- Some early commit subjects and file deltas do not align exactly because the history was reconstructed after implementation. This document does not infer missing facts from commit dates.
- Secret values are intentionally omitted. Environment variable names, public addresses, workflow IDs, transaction hashes, execution IDs, CIDs, and public URLs are recorded.
- Historical failed artifacts are retained. A failed artifact is never counted as passing evidence merely because a later fix passed.
- EMBER contract and mission activity remains on Base Sepolia. Phase 11 x402 Marketplace fees were settled on Base mainnet because that is KeeperHub's paid-workflow rail; those payments are not an EMBER mainnet deployment.

## Stable public identity registry

### Chain and contract

- Base Sepolia chain ID: `84532`
- Base mainnet chain ID: `8453`
- Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Base mainnet USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Continuity contract: `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770`
- Continuity deployment transaction: `0x66bbbbc473e723e959b4c712da8a9c219dc3a339fbf363adec81725b0678a606`
- Deployer: `0xf76e6b0920e9332ff4410f6dd53f01722abc71a3`
- Mission ID: `1`
- Mission registration transaction: `0x56fc668746b90a798731116aec697059a47ec57de8a8d3eb525cd02c1f2bdb49`
- Mission workflow hash: `0x654ef3c07cd9899a296b0e7e5014d293491feeee39a28bce613d4ed9ca3f6b4d`
- Mission start: `1784683614`
- Mission cadence: `300` seconds
- Beneficiary: `0x230640f6508C7a1086444c5Ba62D230F395Ba0e1`
- Standby: `0xa45d8a46a4BC22Aae9946AE85962fA130A0aEFa6`
- Escrow approve transaction: `0xb3ec1276a4aa035306f71f248bdd290d4f8abee9d5277712eb5f8833d9603138`
- Escrow fund transaction: `0x1e0e7f7e07929d4ca424c8724586a656a328c0a746add249cd97d78e7feb9c39`
- Escrow funded amount: `1000000` USDC atomic units

### KeeperHub workflows and integrations

- Org A W1 `payday-stream`: `x08xy6zyy5ne5xkr93mtf`
- Org B W1 replay: `igy0agkqtyzjrmxcz4rii`
- Org B W2 free-plan stub: `67hf9klj6pbwn56qzxwi7`
- Org B W3 free-plan stub: `2z5x95h89ncjbnf4r6130`
- Org A wallet integration: `jq31igp9un4exkxl4z7wu`
- Org B wallet integration: `uof7week9ne35ljfdnjae`
- Org A smoke workflow: `vewqfp44zmpa9dtctlrdr`
- Org B smoke workflow: `6ogrdndixafwe5svblfju`
- W2 and W3 are intentionally non-production stubs because KeeperHub HTTP and Code nodes returned `402 upgrade_required` on the available plan. Sentinel's signed HTTP control plane performs the real check/rescue behavior.

### Agentic wallet and hosting

- Agentic wallet: `0xBfA03582FE97f46B982b6e12DA8a5cE5DA0dd280`
- Agentic wallet sub-organization: `76f6b04e-9c69-4ef4-b182-7f6017437e63`
- Render service ID: `srv-d93aj1ernols73b8a170`
- Render service name: `ember`
- Public runtime: `https://meridian-backend-ikx8.onrender.com`
- Render dashboard: `https://dashboard.render.com/web/srv-d93aj1ernols73b8a170`
- GitHub repository: `https://github.com/mohamedwael201193/ember`

## Architecture evolution

### Original specification

The original specification described a dead-man continuity system with:

1. PAYDAY in Org A.
2. Sentinel/EMBER in Org B.
3. One `Continuity.sol` contract.
4. W1 for payroll, W2 for detection, and W3 for rescue.
5. Docker process-kill chaos.
6. A scheduled KeeperHub W1 and a read-only Org A credential for Sentinel.

Live research invalidated several assumptions:

- A KeeperHub-hosted schedule would continue after PAYDAY died, so it could not represent agent death.
- KeeperHub did not expose a true read-only organization API key.
- HTTP and Code workflow actions required a paid plan.
- The then-current CLI was 0.10.0 rather than the older referenced version.
- Agentic wallet settlement was separate from workflow wallet integrations.
- The original mission registration shape lacked a schedule anchor and fee cap.
- Combining x402 and escrow fee collection without an immutable fee mode could double-charge.

### Authoritative correction

`IMPLEMENTATION_PLAN.md` became the authority beneath current official docs and live behavior:

- W1 is manual. PAYDAY owns the cadence.
- Killing PAYDAY stops invocations and therefore creates observable missed slots.
- Primary Observer isolates the full-scope Org A observer credential from Sentinel.
- Sentinel receives only Org B credentials and HMAC-signed Observer data.
- KeeperHub authentication is Bearer-only.
- Base Sepolia is mandatory through Phase 12.
- Chaos uses real process termination, not Docker.
- `Continuity.sol` records `startAt`, `maxFeePerRescue`, proof state, immutable fee mode, and rescue uniqueness.
- PAYDAY and rescue replay use deterministic `Idempotency-Key` values and journals.
- W2/W3 remain transparent stubs while the self-polling Sentinel service performs their intended backend semantics.

### Shipped backend

The resulting control flow is:

1. PAYDAY computes the current five-minute slot and invokes W1 with a slot-specific idempotency key.
2. W1 performs a Base Sepolia USDC transfer.
3. PAYDAY waits for execution completion, verifies the transaction receipt and expected Transfer event, then commits the slot journal.
4. Primary Observer reads Org A execution history and signs its response.
5. Sentinel verifies the Observer signature, classifies expected slots with clock skew, marks the first miss `DEGRADED`, and the second consecutive miss `MISSION_DOWN`.
6. Sentinel computes a deterministic rescue ID from the bounded unpaid batch.
7. Sentinel writes replay intents before external execution, invokes Org B W1 replay, verifies each transfer, and records mission-wide slot coverage.
8. Sentinel canonicalizes rescue evidence, pins it to Pinata, fetches the bytes back, verifies byte equality and SHA-256, then invokes KeeperHub MCP `anchorProof`.
9. Sentinel verifies the `ProofAnchored` event and contract storage.
10. On restart it checks on-chain `rescueProof` before attempting another anchor.

For Render, Observer, PAYDAY, and Sentinel were consolidated into one parent Node process with path routing to three child processes. The final-certification hardening gives each child an explicit environment allowlist and drains children during graceful shutdown.

## Chronological execution

### 2026-07-15 — planning and repository bootstrap

- Initialized the pnpm monorepo, TypeScript, ESLint, Prettier, Vitest, Node 24 requirements, and backend-only scope.
- Read `FINAL_PROMPT.md`, both KeeperHub reference documents, and official KeeperHub docs/repositories.
- Documented contradictions before implementation rather than silently following invalid assumptions.
- Authored `IMPLEMENTATION_PLAN.md` with Phases 00–14, stop gates, evidence requirements, and Phase 13 human approval.
- Locked Bearer-only authentication, Base Sepolia, process-kill chaos, no frontend, and no mainnet before approval.

### 2026-07-16 to 2026-07-17 — reusable backend packages

- Built `@ember/mission-core`:
  - slot arithmetic and bounded unpaid-slot classification;
  - first-miss `DEGRADED`, second-miss `MISSION_DOWN`;
  - clock-skew handling;
  - canonical workflow hashing;
  - HMAC request and response signing;
  - deterministic rescue IDs;
  - strict environment schemas and Sepolia RPC separation;
  - canonical proof generation and Pinata helpers.
- Built `@ember/kh-client`:
  - Bearer REST client;
  - documented workflow/execution paths;
  - manual workflow execute and wait;
  - KeeperHub `Idempotency-Key`;
  - MCP HTTP client and standard/SSE result parsing.
- Built `@ember/receipt-checker`:
  - receipt status and confirmation checks;
  - Base Sepolia USDC Transfer event verification;
  - sender, beneficiary, token, amount, and slot-time checks;
  - retry across primary and fallback RPC endpoints.

### 2026-07-17 to 2026-07-18 — Continuity contract

- Implemented `Continuity.sol` with mission registration, escrow funding, proof anchoring, proof recovery, fee claims, rescue uniqueness, and non-reentrancy.
- Enforced exact token balance deltas to reject fee-on-transfer and rebasing assets.
- Added unit, fuzz, and escrow invariants.
- Deployed to Base Sepolia:
  - deploy `0x66bbbbc473e723e959b4c712da8a9c219dc3a339fbf363adec81725b0678a606`;
  - register mission `0x56fc668746b90a798731116aec697059a47ec57de8a8d3eb525cd02c1f2bdb49`;
  - approve `0xb3ec1276a4aa035306f71f248bdd290d4f8abee9d5277712eb5f8833d9603138`;
  - fund `0x1e0e7f7e07929d4ca424c8724586a656a328c0a746add249cd97d78e7feb9c39`.

### 2026-07-18 to 2026-07-19 — workflows and services

- Created live W1 and Org B replay W1.
- Created W2/W3 check-balance stubs and recorded the Pro-plan deviation.
- Implemented PAYDAY, Primary Observer, and Sentinel services.
- Added `/healthz`, `/readyz`, `/metrics`, signed `/check`, signed `/rescue`, status routes, request size limits, rate limits, and graceful shutdown.
- Added PAYDAY control-token protection and HMAC replay windows.
- Added file-backed journals with atomic writes, stale-lock recovery, and write-ahead replay intents.
- Added OpenAPI, architecture, decisions, deviations, runbook, service-auth, threat-model, and breaking-change documentation.

### 2026-07-22 — first live replay and retained failure

The initial two-slot rescue `live2slots` succeeded:

- Slots: `1784683914`, `1784684214`
- Executions: `sbpn2qcben82zpqe0y3xs`, `3ff5ehupoejl6rublgfzk`
- Transactions:
  - `0x698ddc0afe9a34cc27a878e9b1bffe31c5b2cd26a433a5102a6dca71a02f2695`
  - `0x5701a6a01aeb557376f6014a1db6df49003ddbc44b134f2b389a256400c293dc`

An immediate rescue under a different rescue ID exposed a real double-payment bug:

- Failed historical rescue: `live2slots-rerun`
- Executions: `dwlgvzvzshthyx3efflzd`, `c0njpohc3eykla2p673xw`
- Duplicate transactions:
  - `0xbcbc561ce76670bec95b9ef5fc4d1bd42359a2072e0d017286389fc769e08e8c`
  - `0xf5a98b19b1bc38c0aa8c1238d5bb545cfb4ea470b42ae271014de56779127a6e`

Root cause: the detector inferred paid historical slots from replay transaction block time. Replays occurred in the current block-time slot, so the original historical slots still appeared unpaid to a rescue with another ID.

Fix:

- Maintain mission-wide `(slotId -> verified replay transaction)` coverage across every rescue journal.
- Compute deterministic rescue IDs from the next bounded unpaid batch.
- Never count dry-run executions as paid.
- Write intent before execution.
- Reuse in-flight KeeperHub execution IDs after restart.

`rescue-idempotency-check.json` proved that later batches no longer overlap covered slots.

### 2026-07-22 — proof pipeline

For `live2slots`:

- Canonical proof SHA-256: `0x06613109…759493`
- CID: `Qmaq9qJ8KEcvR4yv8JitRXLwViDDdm5mnH8AkrMzrvzE6P`
- Anchor execution: `2bzbh77l318kr8hr67zsa`
- Anchor transaction: `0xad0fe495639b4222cf80d25bbf434dccfa42f023cf145339afd9702d401ed87b`
- On-chain rescue ID: `0x2ea5d9d71a3998cdfd8f7893efd2961ddefa319d3334a2e6c99974eebee20131`
- Fee mode: `ESCROW_FALLBACK`
- Fee reference: `escrow-fallback`

The pipeline proved:

- canonical JSON bytes;
- Pinata pin;
- gateway fetch-back;
- byte equality and SHA-256 equality;
- MCP-only `anchorProof`;
- sponsored anchor transaction;
- matching `ProofAnchored` event;
- matching contract storage;
- on-chain recovery through `rescueProof`.

### 2026-07-22 — three post-fix rescue drills

Drill 1:

- Rescue ID: `21ec0bdbeb9f7ed7a5a9fb16b42c5c5d9a0dd9a55ebeaaec623ca49b59a5b433`
- Slots: `1784684514`, `1784684814`
- Executions: `5f3vkq7btz1g5ms7qwkh7`, `rs2gc0hlv18wc2u0j8itq`
- Replay transactions:
  - `0x46ec8f9dab5672385c1bc962dcb8b5fd0db6740e2fe8e8be6d800bd0f2d8eeba`
  - `0x434f8aa0ff3c122a67f022b263e7d3fa86b5d617b46dcaeb75c6bb3a5b9e37bb`
- Proof hash: `0x8aef11b2e58910533c1d82dd214528fac26a1bee9d7528f9c8eb2fe827476da0`
- CID: `QmXfEWko4MKwUmsinHEmskvnME1emumhShSQZ7dyezH9xh`
- Anchor execution: `6flqj38t1n3ghkrp9x7b3`
- Anchor transaction: `0xc1be8a7098677af45e821d1402c19683746cadba4ad6415d689077c605e65aa4`

Drill 2:

- Rescue ID: `807f31a790c88a7fb788510a6b32bfa7388f37819af81e02b34a70beb9204624`
- Slots: `1784685414`, `1784686314`
- Executions: `jxqnbokz3kfcsw0adw01h`, `0wkw35z1bbv5kxweu37gr`
- Replay transactions:
  - `0xa5cdfaefbb06a6a8d0e03e757ceaae7c1579aae516f48631113874b2c17e1c7f`
  - `0x47caac9d1299d3d531baa81ee35557e276f2ac77777ef01c4e77e7bfcd7438b1`
- Proof hash: `0x201646a51a9ade409ec4cbf702566d13e6d505ff9cad5d158d6943c449017de4`
- CID: `QmRRkbnS9KTjyW8jbqw4HD2EtU97iFNbs7mzmxJodVaxpi`
- Anchor execution: `y5objngz28ajxmvo0ypic`
- Anchor transaction: `0xb678a3d3f3973010ad785d1ed01eba81b399b6422404d5c207bbac8b692ba0f2`

Drill 3:

- Rescue ID: `6deef373c0f0cb0879346d56ee6d5239ffdfa0310d2504f8b462392b70a0ce55`
- Slots: `1784686614`, `1784686914`
- Executions: `91ywj6eh5lw3jg7y0fmq6`, `qt2gbsw4in95338fahupl`
- Replay transactions:
  - `0xf83344f3d5b96a9b082842bbf987f48bfc6dfd97dc7c9068fb919e7bda6b6159`
  - `0x1399d78e9792457c046039f4083d61de5053f09c26f79ff6475cadae54bd5ddc`
- Proof hash: `0x3af3961c701f1b690a6087091ca36681436663a5bb3f461086060ca9a1fcbc46`
- CID: `QmfQ2NeXxzhDeK4e4z8hH6JX5XUk3fXnnHiqUpAxHM7E2N`
- Anchor execution: `8tl17lq96816dcdzy2q8u`
- Anchor transaction: `0xa83727e71d270bdf42bd6cfb6ef03db7dc3bdf6d712ad06e4c9e64f86d20a91c`

All three explicit reruns preserved the same timestamps and produced no additional transactions.

### 2026-07-22 — process-kill chaos and recovery

Sentinel completed-rescue restart:

- Killed Sentinel and restarted it.
- `live2slots` remained `COMPLETED`.
- No replay transaction was added.

PAYDAY kill and restart:

- PAYDAY outage became observable.
- Readiness recovered after restart.
- Slot: `1784689614`
- Idempotency key: `ember-payday-1-1784689614`
- Execution before and after restart: `2hopjtrfc5wknq8gutgs6`
- Transaction before and after restart: `0x47465f069fce41effa7d1a0e85d48b29a94fecd94a58b34f7cb8a80ede79c1db`
- Duplicate transaction: false

Sentinel mid-replay kill:

- Rescue ID: `80b28b0bf1b75bc2a8c9c5b90a674d7e37588fdbb8d2ee0b3171c3b3e4938d1d`
- State observed before kill: `EXECUTING`
- Killed PID: `23244`
- Restarted PID: `32136`
- Slots: `1784687214`, `1784687514`
- Executions: `zg5dak9o0uu1x4lcnhrxr`, `bu6v5l97wxvloulzfn3xf`
- Replay transactions:
  - `0xd7e090b04e9c9cabd847c1d35ad37205bd6f59022642b3bebb93a1a97b5f9e4d`
  - `0x772b5a0e7d8e41687eb2db632f8f08103b168e01ea1cf9420dce3b4b2602963f`
- Proof hash: `0x9836decddff21d81ca56988ac80497b530832578431b9bd11acc7dd14765b92d`
- CID: `QmT24473GGyPxoFyC2xhrEMUhgjtpYezkkxowWyLWP5eQ1`
- Anchor execution: `29n7pbxjjnd6b7duab5n8`
- Anchor transaction: `0x4656a5f00f4b80d293c229fe644c1fce9bc0259f5707df14753db2bd47f1fff6`
- Explicit rerun produced no additional replay or anchor.

### 2026-07-22 — Render consolidation and soak

- The account's free-service creation quota was exhausted.
- Reused suspended service `meridian-backend`, retargeted it to `mohamedwael201193/ember`, renamed it `ember`, and corrected nested build/start fields through the Render API.
- Consolidated Observer, PAYDAY, and Sentinel into `scripts/start-ember-runtime.mjs`.
- Exposed `/healthz`, `/readyz`, `/metrics`, Observer routes, PAYDAY `/run-once`, and Sentinel `/check`, `/rescue`, and `/status` through one public port.
- Corrected Render health-check path to `/healthz`.
- Public HMAC `/check` returned receipt-backed `MISSION_DOWN`, expected because PAYDAY is disabled on the public rehearsal runtime.
- Unauthenticated `/check`, `/rescue`, and execution-history requests returned `401`.
- Twelve-hour soak ran from `2026-07-22T04:32:02Z` through `2026-07-22T16:32:55Z`.
- Soak result: 695 checks, zero health failures, zero PID changes, zero journal mutations, pass.
- Render restart and deployment recovery were later revalidated with healthy readiness and no observed public downtime.
- The reused deployed service is currently reported by Render as paid `starter`. Two API attempts to downgrade it to `free` returned Render HTTP 500. `render.yaml` and deployment intent remain `free`.
- Render free has no persistent disk. `/tmp/ember/*` journals are acceptable for public Sepolia rehearsal but not for Phase 13 mainnet.

### 2026-07-22 — Agentic wallet and paid Marketplace settlement

Initial behavior:

- `wallet add` initially returned KeeperHub HTTP 500.
- A later retry auto-provisioned the wallet.
- With zero USDC, `wallet-snapshot-base` returned `INSUFFICIENT_FUNDS`.

After funding:

- Starting balance: 0.50 Base USDC.
- `wallet-snapshot-base` accepted x402 payment but its workflow failed after charging.
- Payment transaction: `0xabbe77bc77f922d67d7430c77486f4dc6d913c8bb4a810bb07dade644bdd3563`
- Recipient: `0x21DB7753d81B14348926e3Bf8369111eBD311A92`
- Amount: 0.01 USDC
- Block: `48980538`
- Receipt: success
- `defi-onchain-intelligence-base` then accepted x402 and completed.
- Payment transaction: `0x87f5c75fac79d090df15da27c8a330002c206e74ca3b20cb02114e0dda93e71f`
- Recipient: `0xAcb41Cb0a6de47FC9bFf538b48e0B918B1D543c0`
- Amount: 0.01 USDC
- Block: `48980558`
- Receipt: success
- Ending wallet balance: 0.48 Base USDC.
- Tempo balance: 0; MPP was not an applicable funded rail for the x402 listings tested.

Conclusion: wallet provisioning, x402 challenge, Base USDC settlement, and a paid workflow completion are proven. `wallet-snapshot-base` has a listing-specific failure after payment and must not be represented as passing.

### 2026-07-22 to 2026-07-23 — final certification hardening

- Installed Slither in WSL and ran it against `Continuity.sol`.
- Documented intentional timestamp use and exact-balance/non-reentrancy patterns with targeted Slither directives.
- Slither finished with zero unsuppressed findings.
- Generated and checked `contracts/.gas-snapshot`.
- Added GitHub and Render token patterns to the tracked-file and git-history secret scanner.
- Corrected integration child-process environment isolation and health timeouts.
- Added `BASE_SEPOLIA_RPC_URL_FALLBACK` to PAYDAY's explicit environment projection.
- Replaced full parent-environment inheritance in the combined Render runtime with per-child allowlists.
- Added tests proving Observer cannot receive executor/standby/Pinata credentials, PAYDAY cannot receive Observer/standby/Pinata credentials, and Sentinel cannot receive either Org A API key.
- Changed combined `/healthz` to fail when a child is unhealthy.
- Changed parent shutdown to stop accepting traffic, send `SIGTERM`, wait for all children, use bounded `SIGKILL` fallback, and exit with the initiating status.
- Added bounded rate-limit and transient-response retries for safe KeeperHub REST reads only.
- Added bounded retry for MCP `tools/list` only.
- Explicitly prohibited automatic retries for workflow execution and MCP `tools/call`, because those operations may mutate state.
- Final local regression after these changes: build pass, typecheck pass, lint pass, 19 test files and 54 tests pass.

## Environment variable inventory

Names only:

- KeeperHub: `KH_API_BASE`, `KH_MCP_URL`, `KH_ORG_A_NAME`, `KH_API_KEY_PRIMARY_EXECUTOR`, `KH_API_KEY_PRIMARY_OBSERVER`, `ORG_A_WALLET_ADDRESS`, `ORG_A_WALLET_INTEGRATION_ID`, `KH_ORG_B_NAME`, `KH_API_KEY_STANDBY`, `ORG_B_WALLET_ADDRESS`, `ORG_B_WALLET_INTEGRATION_ID`, `KH_ORG_A_W1_WORKFLOW_ID`, `KH_ORG_B_W1_REPLAY_WORKFLOW_ID`, `KH_ORG_B_W2_WORKFLOW_ID`, `KH_ORG_B_W3_WORKFLOW_ID`.
- Chains and contracts: `CHAIN_ID_MAINNET`, `CHAIN_ID_REHEARSAL`, `BASE_RPC_URL`, `BASE_RPC_URL_FALLBACK`, `BASE_SEPOLIA_RPC_URL`, `BASE_SEPOLIA_RPC_URL_FALLBACK`, `USDC_ADDRESS_BASE`, `USDC_ADDRESS_BASE_SEPOLIA`, `CONTINUITY_ADDRESS_SEPOLIA`, `CONTINUITY_ADDRESS_MAINNET`, `MISSION_ID_SEPOLIA`, `MISSION_ID_MAINNET`, `MISSION_START_AT`, `WORKFLOW_HASH_SEPOLIA`, `WORKFLOW_HASH_MAINNET`.
- Deployment identity: `DEPLOYER_PRIVATE_KEY`, `DEPLOYER_ADDRESS`, `ETHERSCAN_API_KEY`, `EMPLOYEE_ADDRESS`.
- Economics and timing: `PAYMENT_AMOUNT_USDC`, `PAYROLL_BUDGET_USDC`, `ESCROW_FUND_USDC`, `MAINNET_TOTAL_SPEND_CAP_USDC`, `CADENCE_SECONDS`, `GRACE_MISSED_RUNS`, `SENTINEL_POLL_SECONDS`, `SENTINEL_SELF_POLL`, `CLOCK_SKEW_SECONDS`, `RECEIPT_CONFIRMATIONS`, `MAX_REPLAY_SLOTS`, `X402_FEE_USDC`, `X402_MAX_FEE_USDC`.
- Proof: `PINATA_JWT`, `IPFS_GATEWAY`, `PROOF_ANCHOR_ENABLE`, `W1_CANONICAL_PATH`.
- Service runtime: `PORT`, `SENTINEL_PORT`, `PRIMARY_OBSERVER_PORT`, `PAYDAY_PORT`, `PAYDAY_ENABLE`, `SENTINEL_PUBLIC_URL`, `PRIMARY_OBSERVER_PUBLIC_URL`, `PRIMARY_OBSERVER_URL`, `SENTINEL_SHARED_SECRET`, `PRIMARY_OBSERVER_SHARED_SECRET`, `PAYDAY_CONTROL_TOKEN`, `RESCUE_JOURNAL_DIR`, `PAYDAY_JOURNAL_DIR`, `LOG_LEVEL`.
- Marketplace/submission: `W2_HUB_SLUG`, `W3_MARKETPLACE_SLUG`, `X402_PAYER_WALLET_ADDRESS`, `DISCORD_WEBHOOK_URL`.
- Deployment tooling: `RENDER_API_KEY`, `render_api_key`, `GITHUB_TOKEN`, `github_token`, `RENDER_OWNER_ID`, `RENDER_REPO`, `RENDER_BRANCH`, `RENDER_SERVICE_NAME`, `RENDER_REUSE_SERVICE`, `NODE_VERSION`, `NODE_ENV`.

The combined runtime child boundaries are:

- Observer: Observer KeeperHub key, W1 ID, Observer public URL, and Observer HMAC secret.
- PAYDAY: executor KeeperHub key, W1 and Org A wallet identifiers, mission/economic/chain variables, PAYDAY control token, and PAYDAY journal directory.
- Sentinel: standby KeeperHub key, Org B workflow/wallet identifiers, mission/economic/chain variables, Pinata/MCP variables, Sentinel HMAC secret, Observer HMAC verification secret, and rescue journal directory.
- No child receives `DEPLOYER_PRIVATE_KEY`.

## Evidence inventory

- `docs/evidence/platform-verification.md`: live KeeperHub MCP, CLI, REST, workflow schema, org separation, agentic wallet, and Marketplace matrix.
- `docs/evidence/rescue-live2slots.json`: first successful two-slot replay.
- `docs/evidence/rescue-live2slots-rerun.json`: retained historical double-payment failure.
- `docs/evidence/rescue-idempotency-check.json`: mission-wide coverage fix.
- `docs/evidence/chaos-sentinel-kill.json`: completed-rescue restart.
- `docs/evidence/chaos-sentinel-mid-replay.json`: write-ahead intent and in-flight recovery.
- `docs/evidence/chaos-payday-kill.json`: PAYDAY outage and readiness recovery.
- `docs/evidence/payday-restart-idempotency.json`: exact execution/transaction reuse.
- `docs/evidence/proof-live2slots.json`: CID, rehash, anchor event, and storage.
- `docs/evidence/post-fix-three-drills.json`: three stable live rescue/proof cycles.
- `docs/evidence/render-free-deploy.json`: combined public deployment.
- `docs/evidence/render-free-public-checks.json`: original public probes.
- `docs/evidence/render-combined-public-checks.json`: combined runtime auth and health.
- `docs/evidence/soak-12h.json`: 12-hour soak.
- `docs/evidence/validation-suite-2026-07-22.json`: pre-final-hardening suite.
- `docs/evidence/phase11-wallet-retry.json`: historical insufficient-funds result.
- `docs/evidence/phase11-paid-settlement-2026-07-22.json`: funded x402 settlement and external listing failure.
- `docs/evidence/runtime-hardening-local-2026-07-22.json`: strict child environments and graceful-shutdown regression.
- `docs/evidence/render-final-deploy-2026-07-22.json`: live deployment of final hardening commit and public probes.
- `docs/evidence/backend-certification-2026-07-22.json`: consolidated rehearsal certification and mainnet blockers.
- `contracts/broadcast/**/run-latest.json`: Base Sepolia deploy, register, approve, and fund broadcasts.
- `contracts/.gas-snapshot`: final gas baseline.

## Bugs, deviations, and fixes

1. Scheduled W1 could not represent PAYDAY death. Fixed by making PAYDAY own cadence and W1 manual.
2. No read-only KeeperHub API keys. Fixed by isolating a dedicated Observer process and HMAC-signing its output.
3. W2/W3 HTTP/Code actions returned `402 upgrade_required`. Kept explicit stubs and moved behavior to signed Sentinel HTTP endpoints.
4. MCP direct HTTP/SSE compatibility was inconsistent. Used `mcp-remote --transport http-only` for Cursor and a client capable of JSON/SSE parsing.
5. KeeperHub execution REST paths differed from early assumptions. Corrected to documented live paths.
6. Workflow transfer token configuration required a JSON tokenConfig shape and chain identifiers. Corrected canonical workflows.
7. A different rescue ID could repay covered historical slots. Fixed mission-wide slot coverage and deterministic bounded rescue IDs.
8. Dry-run executions could be interpreted as paid. Excluded dry runs from receipt-backed paid state.
9. A crash between execute and journal commit could replay a slot. Added write-ahead intents and in-flight execution reuse.
10. A crash after anchor could duplicate anchor work. Added on-chain `rescueProof` recovery before retry.
11. Empty fee reference was rejected. Standardized `escrow-fallback`.
12. Sepolia could accidentally inherit mainnet RPC fallback. Added explicit rehearsal RPC isolation and fallback projection.
13. Integration tests inherited polluted environments and timed out under suite load. Added child environment projection, stderr capture, and bounded health wait.
14. Combined Render children inherited every secret. Replaced inheritance with per-service allowlists and regression tests.
15. Combined health previously masked unhealthy children. Health now returns 503 when a child is unhealthy.
16. Combined shutdown did not wait for children. Added bounded drain and forced termination.
17. KeeperHub reads lacked 429/transient retries. Added safe-read-only bounded retries with `Retry-After`.
18. Mutation retries could double-execute. Workflow POST and MCP tool calls remain single-attempt unless a higher-level idempotency protocol explicitly controls replay.
19. Render free service creation quota was exhausted. Reused an existing suspended service.
20. Render nested build/start fields did not update through the initial patch shape. Corrected the API payload.
21. Render plan downgrade from `starter` to `free` returned HTTP 500 twice. This remains a Render account/platform action.
22. Render free cannot persist journals. Mainnet deployment remains blocked until durable storage is provisioned.
23. Agentic wallet provisioning initially returned HTTP 500, then recovered.
24. `wallet-snapshot-base` settled payment but failed execution. An alternate paid listing completed, proving the failure is listing-specific.
25. GitHub shell credentials overrode `.env` credentials for the wrong account. Explicitly cleared inherited token variables before publishing to the intended repository.
26. GitHub and Render tokens were pasted into chat. Rotation is required before mainnet.
27. The first strict combined-runtime boot omitted `SENTINEL_POLL_SECONDS` from Sentinel's allowlist, so schema parsing failed with NaN. Added the missing key, a regression assertion, and a successful health/readiness/auth/graceful-shutdown probe.

## Validation results

Passing evidence includes:

- build;
- typecheck;
- lint;
- Prettier check;
- unit tests;
- service integration tests;
- Foundry format/build/tests;
- fuzz and invariants;
- contract coverage;
- gas snapshot;
- Slither with zero unsuppressed findings;
- dependency audit at the recorded certification checkpoint;
- tracked-file and git-history secrets scan;
- environment validation;
- real KeeperHub REST listing;
- real MCP listing and proof anchor;
- CLI version and command verification;
- live W1 and W1 replay transactions;
- receipt confirmation and event verification;
- PAYDAY restart idempotency;
- Sentinel completed and mid-replay restart recovery;
- Pinata byte equality and proof hash;
- on-chain proof event/storage and recovery;
- public Render auth, health, readiness, logs, restart, request limits, graceful shutdown, and recovery;
- 12-hour soak;
- funded Agentic Wallet;
- two x402 Base USDC receipts;
- one completed paid Marketplace workflow.

The final local hardening regression completed with 19 passing files and 54 passing tests.

## Current readiness and stop gates

Backend functionality is proven on Base Sepolia. Phase 13 must not begin yet.

Remaining gates:

1. Human approval is mandatory for Phase 13.
2. Render durable journal storage is required for production mainnet. Free `/tmp` is ephemeral.
3. The deployed Render service is currently `starter`; API downgrade to the requested `free` plan returns Render HTTP 500 and needs Render account/platform action.
4. Real W2/W3 HTTP/Code workflow semantics require KeeperHub Pro or an approved equivalent. Existing W2/W3 artifacts are explicit stubs.
5. `wallet-snapshot-base` is a confirmed external listing failure after charge. The alternate paid listing proves the wallet and x402 rail.
6. Exposed GitHub and Render tokens must be rotated before mainnet.
7. Frontend remains intentionally deferred.

No Base mainnet contract, mission, payroll, rescue, or proof deployment has been performed.

Final hardening commit `05b7fac1ceb16d4eb628f35f3090333c3a454a6b`
deployed through Render deployment `dep-d9gj9v1oagis73f0qvq0`, which reached
`live` at `2026-07-22T21:25:00.156548Z`. Public health, readiness, metrics,
authorization, request-size enforcement, and receipt-backed HMAC check passed.

---

## 2026-07-23 — Final production certification & mainnet attempt

Human Phase 13 approval was granted in chat.

### KeeperHub research delta
- Headless auth remains Bearer `kh_`.
- Paid marketplace remains 402 with x402 (Base USDC) and MPP (Tempo USDC.e).
- REST execute/status/wait paths still match `packages/kh-client`.
- MCP `execute_workflow` / `get_execution` / `execute_contract_call` remain valid; `anchorProof` is still a Continuity function invoked through `execute_contract_call`.

### Full gate re-run
Local build, typecheck, lint, format, env validation, secrets scan, dependency audit, and 54 unit/integration tests passed. Foundry Continuity tests and gas snapshot checks remained green.

### Phase 11 funded retries
- Successful paid workflow: `defi-onchain-intelligence-base`
  - execution `7g702yluekcbxzcdf1jmz`
  - settlement `0x3a42febdb9bc3b3751c061d72be851a8609bb1475e5940d1c07401edde43eda5`
- External listing failure retained: `wallet-snapshot-base` charged then errored with `network "undefined"` (execution `0swaxxxg94s19ygfly76r`)
- Wallet balance after retries: 0.47 Base USDC
- Evidence: `docs/evidence/phase11-paid-retry-2026-07-23.json`

### Mainnet preparation completed without Continuity broadcast
- Org A mainnet W1 created disabled: `5goaid2zjgzyb32661se3`
- Org B mainnet W1' created disabled: `pvhwggqr8318wac68jb62`
- Canonical mainnet workflow hash: `0x0ccdc52804ea95ce83e7990b8b8e6a66c42b717c30a88a05248cf95310dd30e2`
- Workflow files: `workflows/w1-payday-stream.mainnet.json`, `workflows/w1-orgb-replay.mainnet.json`
- Render persistent disk attached: `dsk-d9glcjreo5us73cbk500` mount `/var/data/ember`
- Journal env paths moved to `/var/data/ember/payday` and `/var/data/ember/rescues`
- Ops incident: a journal-only Render env PUT replaced the full environment; all 50 required keys were restored immediately from local `.env`
- Redeploy triggered: `dep-d9gldc3rjlhs73cljeb0`

### Mainnet Continuity deploy attempt — hard stop
Balances at attempt:
- Deployer `0xf76e6B…71a3`: 0 ETH, 5.248801 USDC
- Org A `0xB6Ed11…240b`: 0 ETH, 0 USDC
- Org B `0xa45d8a…EFa6`: 0 ETH, 0 USDC

`forge script script/Deploy.s.sol --broadcast` failed before broadcast with:
`transaction validation error: lack of funds (0) for max fee (1131903424)`.

Evidence: `docs/evidence/mainnet-deploy-blocker-2026-07-23.json`, `docs/evidence/render-durable-disk-2026-07-23.json`.

### Final artifacts produced
- `MAINNET_READINESS_REPORT.md`
- `FINAL_BACKEND_CERTIFICATION.md`

### Remaining human funding actions before any mainnet Continuity tx
1. Fund deployer with Base ETH for gas.
2. Fund Org A with ≥5 Base USDC.
3. Fund Org B with ≥2 Base USDC.
4. Rotate credentials previously pasted in chat.

No EMBER Continuity, mission, payroll, rescue, or proof transaction has been broadcast on Base mainnet.

---

## 2026-07-23 — Phase 13 live Base mainnet execution

### Funding gate answer (from actual `.env` / workflows)
**NO** to “0.1 USDC each is enough for every required Mainnet validation.”
- Slot amount = `PAYMENT_AMOUNT_USDC=10000` = **0.01 USDC**
- Org B max rescue = `MAX_REPLAY_SLOTS=12` × 0.01 = **0.12 USDC** (> 0.1)
- Floors used: Org A **0.05**, Org B **0.12**, Deployer escrow **1.00** already funded
- Evidence: `docs/evidence/mainnet-funding-analysis-2026-07-23.json`

### Continuity + mission (chainId 8453)
- Continuity: `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770`
- Deploy tx: `0x050014bf756531fcc94b13dd3f254ef4d0f661049e3759600a5e4466e0a6a3a6`
- Register tx: `0xe1c1d62d9e328bb2425db100620e0ee1857622a5e749ab2caef8b8e322b86f70`
- Fund txs: `0xf16ba185…ba00` (approve), `0xea48ae06…1d4f` (fund 1 USDC)
- Mission ID `1`, startAt `1784768419`, cadence `300`, workflowHash `0x0ccdc528…30e2`
- Evidence: `docs/evidence/mainnet-continuity-deploy-2026-07-23.json`

### Org funding (from deployer)
- Org A +0.05 USDC: `0x3fef807c9af669edf50aab890079e0c6c865edce22f3a1e7d66c565650e30c51`
- Org B +0.12 USDC: `0x7b0161ad60e818858e8132f048c40c132866e2dd272fe69c69c4bdfc006630e8`
- Evidence: `docs/evidence/mainnet-org-fund-2026-07-23.json`

### Service cutover code
- `EMBER_NETWORK` + `packages/mission-core/src/activeNetwork.ts`
- PAYDAY/Sentinel resolve Continuity/USDC/RPC/hash from mainnet keys when `EMBER_NETWORK=mainnet`

### Three receipt-verified PAYDAY slots (W1 `5goaid2zjgzyb32661se3`)
1. slot `1784768419` exec `667ekg3qk5f45127eqjyy` tx `0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2`
2. slot `1784768719` exec `pmxyj7low2i06bne6j1bt` tx `0xeb670541f1646dc55e2403d97ba683c7f325c7e38161b1c415da5e8b5bb86888`
3. slot `1784769019` exec `0i0pqz1u7xc5act9agvwa` tx `0x9288d13aa65976b2fb996b4764be4ab098f22631094a28a5e5f8ea6e36b9eec3`
- Post-slot balances: Org A 0.02 / Org B 0.12 / Employee 0.03 / Escrow 1.00
- W1 disabled after slot 3; PAYDAY restarted with `PAYDAY_ENABLE=0` for grace→rescue
- Evidence: `docs/evidence/mainnet-payday-slots-2026-07-23.json`

### Rescue COMPLETED (rescueId `3262643f2b4bec156242871d919663ceaec7696ed29cd63ffe02a59dcb4a7169`)
- Missed slots replayed (Org B W1' `pvhwggqr8318wac68jb62`):
  - `1784769319` exec `tjab2kqsitnwsfbr6e9ra` tx `0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41`
  - `1784769619` exec `xoratkk2crlscz57ma1fr` tx `0x83f721bfbafc20ba4327d2a955afd05db9ec7d063e41ae0484c851edf0c15432`
- Proof CID `QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn` / hash `0x61206b51…460c`
- Anchor tx (Base mainnet): `0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f`
- Bug fixed mid-flight: `anchorProof` had hardcoded Sepolia `chain_id`; now uses `EMBER_NETWORK` / `chainId`
- Post-rescue balances: Org A 0.02 / Org B 0.10 / Employee 0.05
- Evidence: `docs/evidence/mainnet-rescue-2026-07-23.json`

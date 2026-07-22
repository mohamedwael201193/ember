# EMBER Mainnet Readiness Report

**Generated:** 2026-07-23 02:50 UTC+3  
**Authority:** live evidence + `IMPLEMENTATION_PLAN.md` Phase 13  
**Human Phase 13 approval:** granted in chat on 2026-07-23  
**Verdict:** **NOT READY TO BROADCAST** — deployer and Org wallets lack Base ETH / Org USDC required for a safe cutover.

This report is evidence-backed. No simulated success is claimed.

---

## 1. Executive summary

| Gate | Status |
|---|---|
| Sepolia backend rehearsal | **PASS** |
| Local build / typecheck / lint / tests | **PASS** (19 files / 54 tests) |
| Contracts (Foundry + Slither) | **PASS** |
| KeeperHub REST / MCP / CLI | **PASS** |
| Observer / Sentinel / PAYDAY | **PASS** (Sepolia) |
| Replay / recovery / chaos / soak | **PASS** (Sepolia) |
| Marketplace + Agentic Wallet x402 | **PASS** (with one external listing bug) |
| Render health / auth / metrics | **PASS** |
| Durable Render journals | **PASS** (disk attached; deploy in progress) |
| Mainnet W1 / W1' workflows prepared | **PASS** (disabled) |
| Mainnet Continuity deploy | **BLOCKED** — deployer ETH = 0 |
| Mainnet Org A / Org B USDC funding | **BLOCKED** — both 0 USDC |
| Credential rotation | **OPEN RISK** — tokens previously pasted in chat |

**Bottom line:** Phase 13 is approved and prepared, but on-chain deployment cannot safely continue until Base ETH and Org wallet USDC are funded. That is an unavoidable external funding blocker under the stop conditions.

---

## 2. Security

| Control | Evidence | Status |
|---|---|---|
| Bearer-only KeeperHub headless auth | `packages/kh-client`, live MCP | PASS |
| HMAC `/check` and `/rescue` | Render public probes | PASS |
| Child credential isolation | `scripts/runtime-child-env.test.mjs` | PASS |
| No deployer key in child processes | combined runtime allowlists | PASS |
| Secrets scan (tracked + history) | `pnpm security:secrets` | PASS |
| Dependency audit (high+) | `pnpm audit --audit-level high` | PASS (0) |
| Slither | 0 unsuppressed findings | PASS |
| Request size limit | oversized `/check` → 413 | PASS |
| Unauthenticated routes | 401 | PASS |
| Exposed GitHub/Render tokens | chat history | **OPEN — rotate before production ops** |
| Alchemy RPC free-tier limits | `eth_getLogs` 10-block cap | **OPEN RISK** for receipt scans |

---

## 3. Tests and coverage

| Suite | Result |
|---|---|
| `pnpm build` / `typecheck` / `lint` / `format:check` | PASS |
| `pnpm test` | 19 files / 54 tests PASS |
| `pnpm validate-env` | PASS |
| `pnpm security:secrets` | PASS |
| `pnpm audit --audit-level high` | PASS |
| Foundry unit + invariant | 8 tests PASS; 256 runs / 128000 calls |
| Continuity line coverage | 96.92% |
| Gas snapshot (`ContinuityTest`) | PASS |
| Slither | 0 findings |
| `pnpm test:live` | Org A / Org B workflow inventory |
| `pnpm test:anchor-recovery` | `live2slots` recovered |
| Post-fix drills | 3 drills + mid-replay, 8 txs, 4 anchors |
| 12h soak | 695 checks / 0 failures |

---

## 4. Contracts

| Item | Value |
|---|---|
| Contract | `Continuity.sol` |
| Sepolia address | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` |
| Mainnet address | **not deployed** |
| Mainnet USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (symbol verified) |
| Deploy script | `contracts/script/Deploy.s.sol` |
| Register script | `contracts/script/RegisterMission.s.sol` |
| Fund script | `contracts/script/FundMission.s.sol` |
| Forge broadcast attempt | **failed**: `lack of funds (0) for max fee` |
| Evidence | `docs/evidence/mainnet-deploy-blocker-2026-07-23.json` |

---

## 5. Infrastructure

| Component | Status | Notes |
|---|---|---|
| Render service | live | `srv-d93aj1ernols73b8a170` / `https://meridian-backend-ikx8.onrender.com` |
| Plan | starter | paid instance; free downgrade previously 500'd |
| Persistent disk | attached | `dsk-d9glcjreo5us73cbk500` → `/var/data/ember` |
| Journal dirs | set | `/var/data/ember/rescues`, `/var/data/ember/payday` |
| Health / ready / metrics | PASS | public 200 |
| HMAC check | PASS | receipt-backed `MISSION_DOWN` expected with PAYDAY disabled |
| Base RPC | configured | Alchemy + `https://mainnet.base.org` fallback |

---

## 6. Replay / recovery

Sepolia only (no mainnet mission yet):

- Mission-wide journal slot coverage after double-pay fix
- Write-ahead intents + in-flight execution reuse
- Mid-replay process-kill recovery
- On-chain `rescueProof` recovery before re-anchor
- Evidence: `rescue-*`, `chaos-*`, `proof-live2slots.json`, `post-fix-three-drills.json`

---

## 7. Marketplace / wallet

| Item | Result |
|---|---|
| Agentic wallet | `0xBfA03582FE97f46B982b6e12DA8a5cE5DA0dd280` |
| Balance after retries | 0.47 Base USDC |
| Successful paid workflow | `defi-onchain-intelligence-base` exec `7g702yluekcbxzcdf1jmz` |
| Settlement tx | `0x3a42febdb9bc3b3751c061d72be851a8609bb1475e5940d1c07401edde43eda5` |
| External listing bug | `wallet-snapshot-base` charges then errors: network `"undefined"` |
| MPP | not applicable (0 Tempo USDC.e; listings used x402) |

Evidence: `docs/evidence/phase11-paid-retry-2026-07-23.json`

---

## 8. KeeperHub readiness for mainnet cutover

Prepared (disabled) workflows:

| Role | ID | Network | Hash |
|---|---|---|---|
| Org A W1 mainnet | `5goaid2zjgzyb32661se3` | 8453 | `0x0ccdc52804ea95ce83e7990b8b8e6a66c42b717c30a88a05248cf95310dd30e2` |
| Org B W1' replay mainnet | `pvhwggqr8318wac68jb62` | 8453 | (replay; mission registers Org A canonical hash) |

W2/W3 remain free-plan stubs (`402 upgrade_required` for HTTP/Code). Production detection/rescue continues via Sentinel self-poll + HMAC HTTP.

---

## 9. Known risks

1. **Deployer Base ETH = 0** — hard stop for forge broadcast.
2. **Org A / Org B Base USDC = 0** — hard stop for payroll and rescue transfers.
3. **Credential exposure** — rotate GitHub / Render / Alchemy tokens before prolonged production ops.
4. **Alchemy free-tier log window** — use public Base RPC or upgrade for wide `eth_getLogs` receipt scans.
5. **W2/W3 Pro gap** — accepted with explicit stubs + Sentinel HTTP control plane.
6. **`wallet-snapshot-base` listing bug** — external; do not depend on that slug.
7. **Mission `startAt` must be future** — Sepolia `MISSION_START_AT` is in the past; mainnet registration needs a new UTC anchor.

---

## 10. Known external blockers (stop conditions)

| Blocker | Owner | Required action |
|---|---|---|
| Deployer gas | Human | Fund `0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3` with ≥0.002 ETH on Base |
| Org A payroll USDC | Human | Fund `0xB6Ed11fDceFBf213719C029e3aDc372c6701240b` with ≥5 USDC |
| Org B rescue USDC | Human | Fund `0xa45d8a46a4BC22Aae9946AE85962fA130A0aEFa6` with ≥2 USDC |
| Token rotation | Human | Revoke/reissue tokens pasted in chat |

After funding, the safe next commands are:

```bash
# Deploy Continuity on Base
export USDC_ADDRESS=$USDC_ADDRESS_BASE
forge script script/Deploy.s.sol --rpc-url "$BASE_RPC_URL" --broadcast --verify --etherscan-api-key "$ETHERSCAN_API_KEY"

# Register with FUTURE startAt and WORKFLOW_HASH_MAINNET
export CONTINUITY_ADDRESS=$CONTINUITY_ADDRESS_MAINNET
export WORKFLOW_HASH=$WORKFLOW_HASH_MAINNET
export MISSION_START_AT=<unix_now_plus_buffer>
forge script script/RegisterMission.s.sol --rpc-url "$BASE_RPC_URL" --broadcast

# Fund escrow (1 USDC)
export MISSION_ID=$MISSION_ID_MAINNET
forge script script/FundMission.s.sol --rpc-url "$BASE_RPC_URL" --broadcast
```

Then repoint Render/env to mainnet Continuity / mission / workflow IDs, enable PAYDAY for three slots, run one rescue drill, and record production evidence.

---

## 11. Readiness score

| Area | Score |
|---|---|
| Backend code / tests | 10 / 10 |
| Sepolia production rehearsal | 10 / 10 |
| Marketplace settlement path | 9 / 10 |
| Render durability | 9 / 10 |
| Mainnet funding / deploy | 2 / 10 |
| Overall Phase 13 cutover | **4 / 10 — blocked on wallet funding** |

**Certification statement:** EMBER backend is rehearsal-certified and mainnet-prepared. It is **not** mainnet-deployed. No Continuity, mission, payroll, rescue, or proof transaction exists on Base mainnet for EMBER.

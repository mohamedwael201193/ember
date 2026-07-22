# EMBER Final Backend Certification

**Date:** 2026-07-23  
**Scope:** Backend only (React + Vite frontend deferred)  
**Network posture:** Base Sepolia rehearsal certified; Base mainnet prepared and funding-blocked  
**Repository:** https://github.com/mohamedwael201193/ember  
**Public runtime:** https://meridian-backend-ikx8.onrender.com

---

## 1. Architecture

```
Org A PAYDAY ──manual W1──► Base USDC transfer ──► Employee
       │
       ▼ journals (slot → execution/tx)
Primary Observer (Org A observer key) ──HMAC──► Sentinel
       │
       ▼ receipt-backed /check
Sentinel (Org B) ──W1' replay──► employee catch-up
       │
       ▼ Pinata CID + byte equality
       └─ MCP execute_contract_call(anchorProof) ──► Continuity
```

Combined Render runtime (`scripts/start-ember-runtime.mjs`) hosts Observer + PAYDAY + Sentinel as credential-isolated children behind one public port.

### Production topology

| Surface | Implementation |
|---|---|
| Public URL | `https://meridian-backend-ikx8.onrender.com` |
| Plan / disk | Render starter + 1 GB disk at `/var/data/ember` |
| Journals | `/var/data/ember/payday`, `/var/data/ember/rescues` |
| Auth | Bearer KeeperHub keys + HMAC service secrets |
| Chain (rehearsal) | Base Sepolia `84532` |
| Chain (target) | Base mainnet `8453` (not yet cut over) |

---

## 2. Security review

- Bearer-only headless KeeperHub auth (`kh_`)
- Observer isolates Org A observer credential from Sentinel
- Combined runtime child env allowlists forbid cross-org key leakage and deployer key inheritance
- HMAC timestamp/nonce/body-hash on `/check` and `/rescue`
- Safe-read-only REST/MCP retries; mutations are single-attempt
- Request body hard limit (65 KB) → HTTP 413
- Rate limits with `Retry-After`
- Secrets scanner covers tracked files + git history (KH keys, JWT, GitHub, Render, private keys)
- Continuity: nonReentrant fund/claim/anchor, exact balance equality, immutable workflow hash, standby-only anchor, fee-mode exclusivity
- Slither: 0 unsuppressed findings

Open security ops items: rotate credentials previously pasted in chat; prefer non-free Alchemy or public RPC for wide log scans.

---

## 3. Testing summary

| Gate | Result |
|---|---|
| Build / typecheck / lint / format | PASS |
| Unit + integration | 54/54 PASS |
| Env validation | PASS |
| Secrets + dependency audit | PASS |
| Foundry unit/invariant/gas | PASS |
| Coverage Continuity lines | 96.92% |
| Slither | 0 findings |
| Live KeeperHub inventory | PASS |
| Anchor recovery | PASS |
| Post-fix drills + mid-replay chaos | PASS |
| 12h soak | PASS (695 checks) |
| Render public auth/health/metrics/limits | PASS |
| Marketplace x402 settlement | PASS (alt listing) |
| Mainnet Continuity broadcast | **FAIL / blocked — 0 deployer ETH** |

---

## 4. Evidence index

| Artifact | Proves |
|---|---|
| `docs/evidence/backend-certification-2026-07-22.json` | Prior rehearsal certification closeout |
| `docs/evidence/phase11-paid-settlement-2026-07-22.json` | First funded x402 settlements |
| `docs/evidence/phase11-paid-retry-2026-07-23.json` | Retried paid success + listing bug |
| `docs/evidence/render-final-deploy-2026-07-22.json` | Live Render hardening deploy |
| `docs/evidence/render-durable-disk-2026-07-23.json` | Persistent journal disk |
| `docs/evidence/mainnet-deploy-blocker-2026-07-23.json` | Forge lack-of-funds stop |
| `docs/evidence/runtime-hardening-local-2026-07-22.json` | Child env + graceful shutdown |
| `docs/evidence/soak-12h.json` | Long soak |
| `docs/evidence/proof-live2slots.json` | Pinata + anchor |
| `docs/evidence/post-fix-three-drills.json` | Stable rescue batches |
| `docs/evidence/chaos-*.json` | Process-kill recovery |
| `MAINNET_READINESS_REPORT.md` | Phase 13 gate matrix |
| `PROJECT_EXECUTION_HISTORY.md` | Full engineering chronology |

---

## 5. Transaction index (public)

### Base Sepolia (EMBER mission)

| Purpose | Tx |
|---|---|
| Continuity deploy | `0x66bbbbc473e723e959b4c712da8a9c219dc3a339fbf363adec81725b0678a606` |
| Mission register | `0x56fc668746b90a798731116aec697059a47ec57de8a8d3eb525cd02c1f2bdb49` |
| Escrow approve | `0xb3ec1276a4aa035306f71f248bdd290d4f8abee9d5277712eb5f8833d9603138` |
| Escrow fund | `0x1e0e7f7e07929d4ca424c8724586a656a328c0a746add249cd97d78e7feb9c39` |
| Live2slots replay 1 | `0x698ddc0afe9a34cc27a878e9b1bffe31c5b2cd26a433a5102a6dca71a02f2695` |
| Live2slots replay 2 | `0x5701a6a01aeb557376f6014a1db6df49003ddbc44b134f2b389a256400c293dc` |
| Proof anchor | `0xad0fe495639b4222cf80d25bbf434dccfa42f023cf145339afd9702d401ed87b` |
| PAYDAY restart idempotent | `0x47465f069fce41effa7d1a0e85d48b29a94fecd94a58b34f7cb8a80ede79c1db` |

### Base mainnet (Marketplace fees only)

| Purpose | Tx |
|---|---|
| x402 settlement 1 | `0xabbe77bc77f922d67d7430c77486f4dc6d913c8bb4a810bb07dade644bdd3563` |
| x402 settlement 2 | `0x87f5c75fac79d090df15da27c8a330002c206e74ca3b20cb02114e0dda93e71f` |
| x402 settlement 3 (success WF) | `0x3a42febdb9bc3b3751c061d72be851a8609bb1475e5940d1c07401edde43eda5` |

No EMBER Continuity / mission / payroll / rescue / proof txs exist on Base mainnet.

---

## 6. Contract index

| Network | Address | Mission | Workflow hash |
|---|---|---|---|
| Base Sepolia | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` | `1` | `0x654ef3c07cd9899a296b0e7e5014d293491feeee39a28bce613d4ed9ca3f6b4d` |
| Base mainnet | *pending deploy* | *pending* | prepared `0x0ccdc52804ea95ce83e7990b8b8e6a66c42b717c30a88a05248cf95310dd30e2` |

Proof CID (Sepolia live2slots): `Qmaq9qJ8KEcvR4yv8JitRXLwViDDdm5mnH8AkrMzrvzE6P`

---

## 7. Workflow index

| ID | Role | Network |
|---|---|---|
| `x08xy6zyy5ne5xkr93mtf` | Org A W1 Sepolia | 84532 |
| `igy0agkqtyzjrmxcz4rii` | Org B W1' Sepolia | 84532 |
| `67hf9klj6pbwn56qzxwi7` | W2 stub | 84532 |
| `2z5x95h89ncjbnf4r6130` | W3 stub | 84532 |
| `5goaid2zjgzyb32661se3` | Org A W1 mainnet (disabled) | 8453 |
| `pvhwggqr8318wac68jb62` | Org B W1' mainnet (disabled) | 8453 |

---

## 8. Deployment index

| Deploy | ID / commit | Status |
|---|---|---|
| Render combined runtime | `dep-d9gj9v1oagis73f0qvq0` / `05b7fac` | live (superseded) |
| Docs certification | `dep-d9gjc177f7vs73at689g` / `a91cb58` | live prior to disk redeploy |
| Disk + env restore redeploy | `dep-d9gldc3rjlhs73cljeb0` | triggered 2026-07-22T23:48Z |
| Disk | `dsk-d9glcjreo5us73cbk500` | attached `/var/data/ember` |

---

## 9. Operational runbook (short)

1. Keep PAYDAY disabled on public rehearsal until mainnet cutover checklist is green.
2. Use HMAC-signed `/check` for mission state; never trust unsigned Observer data.
3. Rescue only through HMAC `/rescue` or Sentinel self-poll; W2/W3 stubs are not production control planes.
4. Journals must remain under `/var/data/ember/*` on Render (disk-backed).
5. Before any mainnet broadcast: fund deployer ETH, Org A ≥5 USDC, Org B ≥2 USDC; set future `MISSION_START_AT`; verify USDC symbol on 8453.
6. After Continuity deploy: register → fund → repoint env → three PAYDAY slots → kill PAYDAY → one rescue → revive → reconcile ≤10 USDC total.
7. Rotate any credential that appeared in chat before prolonged production operation.

Full detail: `docs/RUNBOOK.md`, `MAINNET_READINESS_REPORT.md`.

---

## 10. Known limitations

1. W2/W3 HTTP/Code nodes require KeeperHub Pro; stubs remain explicit.
2. Mainnet Continuity not deployed (deployer ETH = 0).
3. Org A/B mainnet USDC balances are zero.
4. `wallet-snapshot-base` marketplace listing is broken after charge (external).
5. Frontend intentionally deferred.
6. Alchemy free-tier restricts wide `eth_getLogs` windows.

---

## 11. Production checklist

- [x] Sepolia Continuity deploy/register/fund
- [x] Live W1 + W1' transfers and receipt verification
- [x] Rescue idempotency + chaos recovery
- [x] Pinata proof + MCP anchor + on-chain recovery
- [x] Combined Render runtime + soak
- [x] Marketplace x402 settlement with receipt
- [x] Durable Render disk for journals
- [x] Mainnet W1 / W1' created (disabled) + hash computed
- [x] Human Phase 13 approval recorded
- [ ] Fund deployer Base ETH
- [ ] Fund Org A / Org B Base USDC
- [ ] Broadcast Continuity on Base mainnet
- [ ] Register + fund mainnet mission
- [ ] Cut over Render env to mainnet IDs
- [ ] Three live mainnet PAYDAY slots
- [ ] One live mainnet rescue + proof
- [ ] Rotate exposed credentials

---

## 12. Readiness score

| Dimension | Score |
|---|---|
| Code correctness & tests | 10/10 |
| Sepolia end-to-end | 10/10 |
| Ops / Render durability | 9/10 |
| Marketplace rails | 9/10 |
| Mainnet execution | 2/10 |
| **Overall backend for real users on Sepolia** | **9/10** |
| **Overall backend for Base mainnet cutover** | **4/10 (funding-blocked)** |

---

## 13. Certification statement

EMBER’s backend is fully implemented, tested against real KeeperHub / Pinata / Base Sepolia / Render infrastructure, documented, and reproducible. Phase 13 human approval is granted and mainnet workflows/hash/disk prep are complete. **Mainnet Continuity deployment has not occurred** because the deployer account has zero Base ETH and Org wallets have zero Base USDC. Under the mandated stop conditions, work stops at this unavoidable funding gate rather than simulating a deployment.

The only intentional product work remaining after mainnet funding and cutover is the React + Vite frontend.

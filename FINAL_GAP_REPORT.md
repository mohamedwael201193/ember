# FINAL_GAP_REPORT.md

**Audit date:** 2026-08-11  
**Hackathon:** [Agents Onchain / DoraHacks](https://dorahacks.io/hackathon/agents-onchain/detail)  
**Workshop:** [Meet KeeperHub / Luca — YouTube](https://www.youtube.com/watch?v=k6D7iIKKRiM)  
**Repo:** https://github.com/mohamedwael201193/ember  
**Live UI:** https://ember-web-seven.vercel.app  
**API:** https://ember-api-8qzg.onrender.com  

This report is the Phase 1–23 audit. **No product code was modified to produce it.**

---

## Workshop findings (must shape the win)

From the workshop video + `video.md` transcript:

1. KeeperHub = **reliable execution layer** (retries, gas, simulation, signing, audit trail, workflows, MCP, direct execution).
2. Stack: Frameworks → Communication (MCP) → Identity/Wallets → Payments (x402/MPP) → **KeeperHub** → Settlement.
3. Two MCP shapes: **direct execution** vs **workflows** (create / AI generate / run continuously).
4. Explicit ask: **not** “agents that use KeeperHub as a black box” — **contributions** KH can merge/adopt (protocol plugins, framework wrappers, nodes, simulation/debug/observability, MCP improvements, onboarding, marketplace/agent-economy wiring).
5. Demo baseline: Hub templates → Run → Runs/audit trail; MCP intent → workflow on canvas in ~40s.

EMBER already matches the **problem space** (last mile / silent failure / continuity). EMBER does **not** yet match the **contribution framing** or the **KeeperHub-on-camera** requirement.

---

## WHAT IS ALREADY EXCELLENT

- Real Base mainnet KeeperHub USDC payroll txs (3 slots) — `docs/evidence/mainnet-payday-slots-2026-07-23.json`
- Real mainnet rescue replays + IPFS CID + Continuity anchor — `docs/evidence/mainnet-rescue-2026-07-23.json`
- Continuity.sol + mission registry on Base — `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770`
- Receipt-backed unpaid detection + deterministic Idempotency-Key journals
- Sepolia chaos / kill drills / soak evidence
- Typed `@ember/kh-client` (REST + MCP)
- Product UI storytelling (PAYDAY / Rescue / Proofs) + Demo Mode
- Zero-secret `pnpm setup/doctor/dev` path
- Narrated demo assets under `docs/demo/`

### Strongest submission transaction

| Field | Value |
|-------|-------|
| Tx | `0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2` |
| Explorer | https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2 |
| Workflow | `5goaid2zjgzyb32661se3` (`payday-stream-mainnet`) |
| Execution | `667ekg3qk5f45127eqjyy` |
| Chain | Base mainnet `8453` |
| Amount | 0.01 USDC |

**Story txs:** rescue `0x474376…6c8e41`, anchor `0x74ba1eac…8d211f`.

---

## WHAT IS MISSING

1. **KeeperHub UI in the demo video** (canvas, Run, Runs, audit) — non-negotiable for judges who watched the workshop.
2. **MCP create_workflow → execute_workflow recorded evidence** (workshop’s primary agent UX).
3. **Extracted contribution artifact** KH could adopt (template / plugin / harness) — not only a branded app.
4. **Hub-published continuity template / strategy listing** (optional bounty + contribution narrative).
5. **Controlled Live failure→rescue filming path** that does not depend on accidental production failure.
6. Deep-links from EMBER UI → KeeperHub execution pages.

---

## WHAT IS WEAK

- MCP depth: anchor via MCP = real; workflow lifecycle via MCP = undemonstrated.
- Production Render: `PAYDAY_ENABLE=0`, `PROOF_ANCHOR_ENABLE=0` → public “Live” is mostly observer/check.
- Live Mode payment cards often feed from **bundled certified evidence**, not live observer streams.
- `docs/evidence/README.md` still Sepolia-led while product claims mainnet.
- x402 Marketplace settlements exist but are **not** EMBER continuity (easy to confuse judges).
- MPP / ERC-8004 / framework plugin: absent (correctly absent unless contribution chosen).

---

## WHAT IS MISLEADING

- UI can look “live verified” while showing a **2026-07-23 certified snapshot**.
- Historical `MISSION_DOWN` on Render while demo cards show restored story.
- Memory/history docs partially stale (frontend “deferred” while frontend shipped).
- Hero previously said Sepolia (fixed to Mainnet in product; KeeperHub cloud workflow descriptions may still say Sepolia).

---

## WHAT MUST BE FIXED (before Aug 13)

Priority order:

1. **Re-record demo** with KeeperHub app on camera (workflow `payday-stream-mainnet` / `5goaid2zjgzyb32661se3` → Run/Runs → tx → Basescan → EMBER Proofs).
2. **Capture MCP evidence JSON** for list/create-or-get/execute/get_execution (even if create is disabled and execute is a small safe run).
3. **Package “Payment Continuity / Guardian Replay” as Hub-ready template** + README section “What KeeperHub can adopt.”
4. **Honest labeling:** Certified snapshot vs Live observer everywhere.
5. **Update evidence README** to lead with mainnet Phase 13.
6. **Pitch rewrite:** agents decide → KeeperHub executes → EMBER continuity survives failure (contribution: recovery primitive).

---

## WHAT SHOULD NOT BE TOUCHED

- Do not invent new DeFi / NFT / ERC-8004 / random chat just to checkbox.
- Do not rewrite Continuity.sol unless a bug blocks demo.
- Do not fake txs or relabel Marketplace fee txs as EMBER payroll.
- Do not disable Demo Mode — keep it for clone-and-run.

---

## WHAT SHOULD BE ADDED

- KeeperHub deep-links on Executions / Rescue / Proofs
- `docs/evidence/mcp-continuity-demo-*.json` (new, after recording)
- Hub template export of W1 + W1' + continuity docs
- Controlled chaos script for demo: stop PAYDAY → wait 2 slots → trigger rescue → show KH Runs

---

## WHAT SHOULD BE REMOVED / DE-EMPHASIZED

- Sepolia-as-product language in judge-facing docs
- Any implication that Marketplace x402 fees = continuity proof
- Overlong demo without KH UI (current full cut is strong on EMBER/explorer, weak on KH)

---

## WHAT MUST BE SHOWN IN KEEPERHUB

1. Workflow canvas for mainnet payday (manual trigger → USDC transfer)
2. Run / execution start
3. Runs tab with execution ID matching evidence
4. Audit / steps (sim → submit → outcome)
5. Tx hash field that matches Basescan

## WHAT MUST BE SHOWN IN EMBER

1. Mission / Console health
2. PAYDAY cards with same hashes
3. Rescue seven beats → restored
4. Proofs: CID + sealed on Base
5. Demo vs Live badge honesty

## WHAT MUST BE SHOWN ON BASE EXPLORER

1. PAYDAY tx success + USDC token transfer
2. At least one rescue replay tx
3. Continuity contract / anchor tx (optional but powerful)

## WHAT MUST BE SHOWN IN THE VIDEO (~2:00–2:30 ideal)

0:00 Hook — agent payroll dies  
0:20 EMBER mission  
0:40 **KeeperHub workflow**  
0:55 Run → Runs → tx  
1:10 Basescan confirm  
1:25 Controlled miss / rescue story  
1:45 Rescue txs + KH execution IDs  
2:00 Proof seal  
2:15 Close — “Agents decide. KeeperHub executes. EMBER survives failure.”

## WHAT MUST BE SHOWN IN README

- What / why / KH fit / failure path
- Verified mainnet tx link
- Demo Mode vs Live Mode
- MCP setup
- “Contribution: continuity recovery primitive” section
- Clone commands

---

## Recommended ONE contribution

**A — Continuity / missed-execution recovery workflow primitive**

Ship as:

- Continuity.sol pattern (already live)
- Journaled classify → replay → pin → anchor pipeline docs
- Hub template: “Payroll Continuity Guardian”
- Optional: chaos harness as “continuity test kit”

This is the most original, most useful to KH, and closest to adoptability without fake multi-agent theater.

---

## Competitor lessons (do not copy products)

| Project | Lesson |
|---------|--------|
| Tradewise | Production seriousness + agent economy rails |
| Keeper-Gate | Framework-agnostic SDK cleanliness |
| ZW.ARM | Measurable mainnet volume + real DeFi utility |

EMBER wins on **failure continuity + proof**, not on yield APY. Lean into that.

---

## Runtime map (short)

```
Browser → Vercel SPA/BFF → Render runtime (Observer/PAYDAY/Sentinel)
                              ↓
                        KeeperHub REST/MCP
                              ↓
                        Base mainnet USDC + Continuity.sol
```

Demo Mode: fixtures / certified snapshot.  
Live Mode: should hit Render; payment cards may still fall back to bundled evidence — **label it**.

---

## Final answers (A–Q)

**A. Current score:** 101/150 (~6.7/10) — see `HACKATHON_SCORECARD.md`  
**B. Score after changes (projected):** 118–125/150 if KH UI + MCP evidence + contribution packaging land before deadline  
**C. Biggest remaining weakness:** App-on-top without KeeperHub UI / contribution packaging  
**D. Need another real tx?** Prefer **reuse existing mainnet txs** + show them in KH UI; only execute a new 0.01 USDC if KH Runs no longer show historical executions  
**E. Need MCP demonstration?** **Yes** — recorded create/list/execute or at minimum tools/list + execute_contract_call + get status evidence  
**F. Need KH contribution?** **Yes** — package continuity recovery as Hub template + adoptability docs  
**G. Show in KeeperHub:** canvas, Run, Runs, audit, matching executionId/tx  
**H. Show in EMBER:** PAYDAY / Rescue / Proofs with matching hashes  
**I. Show on explorer:** primary PAYDAY + one rescue (+ anchor)  
**J. Video script:** see “WHAT MUST BE SHOWN IN THE VIDEO”  
**K. Click sequence:** EMBER landing → console → KH workflow → Run → Runs → Basescan → EMBER rescue → proofs → close  
**L. Pitch:** “Agents decide. KeeperHub executes. EMBER is the continuity layer when the primary agent dies — detect, replay, prove, restore.”  
**M. README structure:** Problem → Solution → KH fit → Failure path → Verified tx → Demo/Live → Clone → MCP → Contribution  
**N. Final demo command:** `pnpm setup && pnpm doctor && pnpm dev` then film Live/Demo + app.keeperhub.com  
**O. Files changed this audit:** `HACKATHON_SCORECARD.md`, `FINAL_GAP_REPORT.md` only  
**P. Tests passed this pass:** not re-run (audit-only)  
**Q. Real evidence:** `docs/evidence/mainnet-payday-slots-2026-07-23.json`, `mainnet-rescue-2026-07-23.json`, `mainnet-continuity-deploy-2026-07-23.json`

---

## Next implementation gate (do not start until you approve)

1. Re-record DoraHacks video with KeeperHub UI  
2. Capture MCP evidence JSON  
3. Hub template + contribution README section  
4. Honest Live/snapshot labels  
5. Re-run scorecard

**Standard to beat:** “This is a real autonomous execution system, KeeperHub is essential, failure/recovery/proof are real, and KeeperHub could ship the continuity primitive.”

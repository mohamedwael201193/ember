# Finalist pitch — EMBER (5 minutes)

## 0:00–0:45 — Hook

Agents can decide. The last mile is moving value on time.

If the primary agent dies **before** it requests the next payroll slot, KeeperHub cannot execute a request that never arrived. EMBER is the missed-obligation layer: detect, recover once, prove.

Show primary BaseScan tx: `0xd26e6174…341ea2`.

## 0:45–2:00 — Architecture

- Org A primary workflow on cadence
- Observer + Sentinel compare schedule vs receipts vs journal
- Org B standby replay with deterministic idempotency keys
- IPFS proof + `Continuity.sol` anchor
- Continuity SLO in the operator UI; provenance badges everywhere

## 2:00–3:30 — Live / certified proof path

1. KeeperHub workflow canvas + execution audit for `667ekg3qk5f45127eqjyy`
2. MCP `get_execution` artifact matching the same IDs
3. Rescue run `tjab2kqsitnwsfbr6e9ra` → BaseScan
4. Proof CID + anchor tx

Identity invariant: EMBER ↔ workflow ↔ execution ↔ MCP ↔ tx ↔ BaseScan ↔ proof ↔ anchor.

## 3:30–4:15 — Why this wins the rubric

| Criterion | Evidence |
| --- | --- |
| Real onchain via KeeperHub | Mainnet USDC + workflows |
| Surfaces | UI + MCP + deep links |
| Reliability | Chaos drills, journal exactly-once, recovery contract pack |
| Usefulness / DX | Continuity Kit + inspect-only starter |
| Honesty | LIVE / SNAPSHOT / DEMO labels |

Differentiation vs policy gates or LP bots: **recovery after missed invocation**.

## 4:15–5:00 — Ask + close

“Agents decide. KeeperHub executes. EMBER keeps the mission alive.”

Point judges to README trust stack, evidence README, and SUBMISSION.md.

---

## Hostile Q&A

**Q: Is the public site spending live right now?**  
A: Check the provenance badge. Production often runs LIVE OBSERVER with CERTIFIED MAINNET SNAPSHOT for the payment story when `PAYDAY_ENABLE=0`. History is real; we do not fake live spends.

**Q: Isn’t this just retry?**  
A: Retry is the same request again. We recover slots that were never requested, with journal coverage beyond KH’s idempotency window.

**Q: Why dual org?**  
A: Credential isolation — standby must not share the primary’s blast radius.

**Q: Did you fake hashes?**  
A: No. Every judge-critical hash is on BaseScan and in `docs/evidence/`.

**Q: x402?**  
A: Marketplace fee experiments exist; they are not continuity payroll.

**Q: Upstream contribution?**  
A: Fixture pack for CLI #53; we intentionally avoid overlapping PR #95.

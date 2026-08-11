# HACKATHON_SCORECARD.md

**Hackathon:** [KeeperHub Agents Onchain (DoraHacks)](https://dorahacks.io/hackathon/agents-onchain/detail)  
**Project:** EMBER  
**Rescore date:** 2026-08-11 (independent FINAL audit — live verified)  
**Deadline:** 2026-08-13 12:00 UTC+2  
**Audit:** `FIRST_PLACE_AUDIT.md` · Certification: `FINAL_FIRST_PLACE_CERTIFICATION.md`

Scoring: judge lens (execution heavily weighted). Scores below 9 require an explicit reason.

| # | Criterion | Score /10 | Why |
|---|-----------|-----------|-----|
| 1 | Real KeeperHub execution | **9** | MCP re-verified primary `667ekg3qk5f45127eqjyy` ↔ tx `0xd26e6174…` and rescue `tjab2kqsitnwsfbr6e9ra`. |
| 2 | KeeperHub surface depth | **8** | Chrome Org A/B canvas + Runs + MCP. Hub marketplace listing still not published. |
| 3 | MCP integration | **9** | Cursor MCP lifecycle re-run this session (validate → smoke `0ujf4va5dm3ysl5xtkxez` → certified inspect). Camera recording still outstanding. |
| 4 | Reliability | **8** | Journals, idempotency tests, recovery contract pack; upstream PR filed. |
| 5 | Failure handling | **8** | Missed-slot product + live KH gas-fail Runs visible in UI (no USDC spent). |
| 6 | Observability | **8** | Continuity SLO + provenance + KH/BaseScan/IPFS; Render health restored. |
| 7 | Originality | **9** | Missed-invocation continuity remains distinctive. |
| 8 | Real-world usefulness | **8** | Continuity Kit + guardian starter; payroll reference. |
| 9 | Developer experience | **8** | Zero-secret clone path; MCP_DEMO; honest provenance. |
| 10 | Reusability | **8** | Continuity Kit + recovery fixtures now in upstream PR #97. |
| 11 | KeeperHub contribution potential | **8** | https://github.com/KeeperHub/cli/pull/97 opened (issue #53). |
| 12 | Demo quality | **6** | Rehearsal PASS; **final ≤2:30 video still not uploaded**. |
| 13 | Documentation | **9** | video.md, audit, matrix, certification rewritten from live evidence. |
| 14 | Security | **7** | Secret scan PASS; but credentials appeared in agent tooling this session — rotate required. Render env wipe incident recovered. |
| 15 | Production readiness | **8** | Render healthy `PAYDAY_ENABLE=0`; Vercel provenance PASS; **CI not on GitHub yet**. |

**Current total: 123 / 150 (≈ 8.2 / 10)**

### Verdict

> **Not 100%.** Mainnet evidence + MCP + KH UI rehearsal + upstream PR are real. Still blocked on (1) demo video upload, (2) GitHub Actions workflow push (`workflow` PAT scope), (3) credential rotation.

### Remaining weaknesses (highest impact)

1. Demo video without authenticated KeeperHub UI + MCP on camera  
2. CI workflow not on GitHub (`workflow` scope missing on PAT)  
3. Rotate exposed credentials

**Projected after those: ≈ 130–134 / 150 (≈ 8.7–8.9 / 10)**

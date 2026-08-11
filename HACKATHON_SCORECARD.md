# HACKATHON_SCORECARD.md

**Hackathon:** [KeeperHub Agents Onchain (DoraHacks)](https://dorahacks.io/hackathon/agents-onchain/detail)  
**Project:** EMBER  
**Rescore date:** 2026-08-11 (post First-Place sprint + workshop watch)  
**Deadline:** 2026-08-13 12:00 UTC+2  
**Workshop:** [YouTube k6D7iIKKRiM](https://www.youtube.com/watch?v=k6D7iIKKRiM) — gap analysis in `docs/KEEPERHUB_WORKSHOP_GAP_ANALYSIS.md`

Scoring: judge lens (execution heavily weighted). Scores below 9 require an explicit reason.

| # | Criterion | Score /10 | Why |
|---|-----------|-----------|-----|
| 1 | Real KeeperHub execution | **9** | Live MCP confirms certified PAYDAY exec `667ekg3qk5f45127eqjyy` ↔ tx `0xd26e6174…`. Rescue + anchor remain certified. Production still observer-gated for new spends (honest). |
| 2 | KeeperHub surface depth | **8** | Workflows + Runs deep links + MCP validate/execute smoke + UI badges. Hub template listing still not published. |
| 3 | MCP integration | **8** | Live agent lifecycle recorded (`mcp-agent-lifecycle-2026-08-11.json`): docs → list → get → validate → smoke execute → get_execution + certified inspect. Camera recording still outstanding. |
| 4 | Reliability | **8** | Journals, idempotency, chaos drills, recovery contract pack tests. |
| 5 | Failure handling | **8** | Missed-slot rescue is the product; certified drill labeled; Live on-camera failure still operator-filmed. |
| 6 | Observability | **8** | Continuity SLO + provenance + KH/BaseScan/IPFS links. |
| 7 | Originality | **9** | Missed-invocation continuity remains distinctive. |
| 8 | Real-world usefulness | **8** | Continuity Kit + guardian starter; payroll reference. |
| 9 | Developer experience | **8** | Zero-secret clone path; MCP_DEMO copy-paste; evidence README mainnet-first. |
| 10 | Reusability | **7** | Continuity Kit + recovery fixtures; Hub marketplace listing not live. |
| 11 | KeeperHub contribution potential | **7** | Execution Recovery Contract Pack v1 ready for CLI #53; upstream PR not opened yet. |
| 12 | Demo quality | **6** | Script is KH-first ≤2:30; **final video with KH UI not uploaded**. |
| 13 | Documentation | **9** | README trust stack, MCP_DEMO, workshop gap, verification matrix, certification. |
| 14 | Security | **8** | Secret scan, Bearer-only, dual-org, write gates. |
| 15 | Production readiness | **7** | Render healthy; Vercel needs redeploy for provenance; CI needs green push. |

**Current total: 120 / 150 (≈ 8.0 / 10)**

### Verdict

> Real mainnet KeeperHub execution + MCP agent lifecycle + continuity architecture are now judge-verifiable in-repo. First place still hinges on (1) KH-UI-on-camera demo, (2) green CI + redeployed provenance, (3) filing the upstream fixture PR.

### Remaining weaknesses (highest impact)

1. Demo video without authenticated KeeperHub UI  
2. CI / Vercel provenance not yet green in production  
3. Upstream contribution PR not filed  

**Projected after those three: ≈ 128–132 / 150 (≈ 8.5–8.8 / 10)**

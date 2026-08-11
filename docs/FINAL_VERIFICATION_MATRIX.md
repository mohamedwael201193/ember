# FINAL VERIFICATION MATRIX

**Date:** 2026-08-11  
**Standard:** PASS or BLOCKED with exact reason

| Area | Test | Command / URL | Expected | Actual | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Local setup | setup | `pnpm setup` | exits 0 | PASS (prior sprint) | PASS | `scripts/setup.mjs` |
| Doctor | doctor | `pnpm doctor` | healthy / warns only | PASS | PASS | doctor output |
| Continuity example | setup/doctor/inspect | `pnpm --filter @ember/example-continuity-guardian run setup/doctor` + `inspect` | inspect-only OK | PASS | PASS | example README |
| Format | prettier | `pnpm format:check` | clean | PASS | PASS | CI local |
| Lint | eslint | `pnpm lint` | clean | PASS | PASS | local |
| Typecheck | tsc | `pnpm typecheck` | clean (incl frontend) | PASS | PASS | local |
| Unit/integration | vitest | `pnpm test` | 82 pass | 82 pass | PASS | vitest; `fileParallelism:false` |
| Build | packages+fe | `pnpm build` | success | PASS | PASS | local |
| Secret scan | check-secrets | `pnpm security:secrets` | no secrets | PASS | PASS | 342 files |
| Foundry | forge test | `forge test --root contracts` | green | forge not installed locally | BLOCKED | CI installs Foundry |
| GitHub CI | Actions | push → workflow | green | pending push/result | BLOCKED→pending | `.github/workflows/ci.yml` |
| Render health | healthz | https://ember-api-8qzg.onrender.com/healthz | children true | `observer/payday/sentinel: true` | PASS | 200 JSON |
| Vercel BFF health | /api/health | https://ember-web-seven.vercel.app/api/health | upstream 200 | PASS | PASS | 200 |
| Vercel config | /api/config | same host | mainnet 8453 + WF ids | PASS | PASS | orgA `5goaid…` |
| Vercel evidence provenance | /api/evidence/mainnet | same | `provenance` present | **false before redeploy** | BLOCKED→redeploy | needs Vercel prod deploy |
| Primary tx on BaseScan | explorer | basescan.org/tx/0xd26e6174… | success USDC | matches MCP | PASS | MCP get_execution |
| MCP validate | validate_workflow | WF `5goaid2zjgzyb32661se3` | valid true | valid true | PASS | live MCP |
| MCP smoke execute | execute+get | WF `vewqfp44zmpa9dtctlrdr` | success no spend | exec `2qvzsmq24d6nsjm0fzlhp` | PASS | `mcp-agent-lifecycle-2026-08-11.json` |
| MCP certified inspect | get_execution | `667ekg3qk5f45127eqjyy` | tx match | match | PASS | `mcp-continuity-demo-2026-08-11.json` |
| KeeperHub workflow UI | app | payday-stream-mainnet canvas | Manual→Pay USDC | confirmed (user screenshot + get_workflow) | PASS | WF id matches |
| Rescue evidence | JSON | mainnet-rescue | txs + CID + anchor | present | PASS | docs/evidence |
| IPFS | gateway | QmVr6yWD… | reachable | certified | PASS | rescue journal |
| Continuity anchor | BaseScan | 0x74ba1eac… | success | certified | PASS | rescue journal |
| README | trust stack | README.md | 30s judge card | updated | PASS | README |
| MCP docs | MCP_DEMO | docs/MCP_DEMO.md | copy-paste setup | written | PASS | docs |
| Workshop gap | analysis | docs/KEEPERHUB_WORKSHOP_GAP_ANALYSIS.md | 12 Qs answered | written | PASS | /watch |
| Demo script | ≤2:30 KH-first | DEMO_VIDEO_DORAHACKS.md | KH UI mandatory | updated | PASS | docs |
| Demo video file | recording | DoraHacks upload | ≤2:30 with KH UI | **not recorded this session** | BLOCKED | operator action |
| Upstream PR | CLI #53 pack | open PR | PR URL | pack ready; PR not opened | BLOCKED | `docs/keeperhub-contribution/…` |
| Submission | SUBMISSION.md | DoraHacks fields | complete | present | PASS | SUBMISSION.md |

## Blockers remaining (exact manual actions)

1. **Push** branch and wait for GitHub Actions green (then badge is truthful).  
2. **Vercel production redeploy** of `frontend` so `/api/evidence/mainnet` includes `provenance`.  
3. **Record ≤2:30 demo** with KeeperHub canvas + MCP + matching IDs (`docs/DEMO_VIDEO_DORAHACKS.md`).  
4. **Open upstream PR** for Execution Recovery Contract Pack against KeeperHub/cli #53.  
5. **Foundry locally** optional; rely on CI `forge test`.

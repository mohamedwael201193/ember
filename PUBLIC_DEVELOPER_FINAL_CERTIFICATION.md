# Public developer final certification

**Date:** 2026-08-12 (pre-filming gate)  
**Commit intent:** public cleanup + README rewrite + website clarity + MCP re-proof  
**Not claimed:** PR #97 merged · unlimited “production-ready” without operator film

---

## Public repo status

Public surface emphasizes README, `docs/` developer guides, `examples/`, packages, services, frontend, contracts, evidence.  
Internal operator dumps remain local-only via `git rm --cached` + `.gitignore`.

## Files removed from public tracking (this gate)

| File | Why untracked |
| --- | --- |
| `FINAL_FIRST_PLACE_CERTIFICATION.md` | Internal win/score certification language |
| `HACKATHON_SCORECARD.md` | Internal scorecard |
| `DEMO_SCRIPT.md` | Temporary filming scratch (runbook remains public) |
| `docs/FINAL_VERIFICATION_MATRIX.md` | Internal audit matrix |
| `docs/FINALIST_PITCH.md` | Internal pitch |
| `docs/DEMO_VIDEO_DORAHACKS.md` | Internal video notes |
| `docs/PUBLIC_DEVELOPER_READINESS.md` | Internal DX scorecard (this cert replaces it) |
| `docs/KEEPERHUB_WORKSHOP_GAP_ANALYSIS.md` | Research / gap dump |
| `docs/BREAKING_CHANGES_LOG.md` | Internal change log |
| `docs/DEVIATIONS.md` | Internal deviations notes |

Previously untracked (still ignored): `memory.md`, `PROJECT_EXECUTION_HISTORY.md`, `FINAL_PROMPT.md`, intelligence dumps, older audits.

**Kept public (required):** README, CONTRIBUTING, ARCHITECTURE, API_REFERENCE, LOCAL_SETUP, MCP_GUIDE, and the listed `docs/*` developer guides including `docs/HACKATHON.md`.

## README status

Major rewrite completed as the official public entry point: problem, missed vs failed, KeeperHub vs EMBER, flows, Continuity.sol, MCP, one/two-org, local/integration/production, evidence, troubleshooting, security, contribution. No hackathon/win language in README.

## Website status

Audited https://ember-web-seven.vercel.app/  
Landing copy fixes: Sentinel vs replay wording, KeeperHub/EMBER role sentence, IPFS plain language, MCP one-liner, architecture cards, nav labels Payments/Health, provenance badge hides repo paths, default story mode when no preference.  
Deploy of these UI fixes is part of this push → `ember-web` GitHub integration.

## MCP status

Official docs confirmed: remote `https://app.keeperhub.com/mcp`, OAuth or `kh_`, one connection = one org, local stdio deprecated.  
Cursor MCP servers `keeperhub-devmo` / `devmo2` used for live tests. No separate EMBER MCP server.

## Cursor status

Tool discovery, validate, get_workflow (A+B), smoke ×2, get_execution verified in this session.

## Org A status

Workflow `payday-stream-mainnet` / `5goaid2zjgzyb32661se3`  
Chrome: canvas Manual → Pay Employee USDC, Run button, Runs tab populated, org switcher DEVMO, enabled=false via MCP.  
Validate: `valid: true`.

## Org B status

Workflow `payday-stream-orgb-replay-mainnet` / `pvhwggqr8318wac68jb62`  
MCP (`keeperhub-devmo2`): get_workflow PASS — Manual → Pay Employee USDC, Base 8453, enabled=false, separate `organizationId`.  
Chrome while Org A active: deep-link shows **Workflow Not Found** (expected — UI is org-scoped).  
**Filming rule:** switch the KeeperHub org switcher to Org B before showing the replay canvas. Do not deep-link Org B IDs while Org A is selected.

## Vercel

https://ember-web-seven.vercel.app/ → HTTP 200 (/, /app, /mission, /rescues, /proofs shells)  
Project: `ember-web` (GitHub-linked). Prefer git push over CLI `frontend` project.

## Render

https://ember-api-8qzg.onrender.com/healthz → 200  
https://ember-api-8qzg.onrender.com/readyz → 200  
`/health` is not the health path.

## Tests

| Gate | Result |
| --- | --- |
| `pnpm doctor` | PASS (dev stack not running warnings only) |
| `format:check` / `lint` / `typecheck` / `build` | PASS |
| `pnpm test` | **82/82 PASS** |
| `security:secrets` | PASS |
| continuity-guardian `inspect` | PASS |
| `forge` | SKIP locally (not installed); CI has Foundry |

## MCP evidence

`docs/evidence/mcp-prefilm-2026-08-12.json`  
Smoke A: `zdhwlmp0qwsybt8w8zcbh` success (no USDC)  
Smoke B: `9o6plh432oqpu6peji448` (second pass)

## PR #97

https://github.com/KeeperHub/cli/pull/97 — **OPEN**, **CHANGES_REQUESTED**, **not merged**.

## Final filming status

**Path proven twice (MCP smoke + KH UI inspection):**

Cursor MCP → tools_documentation → inspect/validate primary → safe smoke → get_execution → KeeperHub Org A canvas + Runs → (Org B canvas for rescue narrative) → EMBER Mission/Rescue/Proof URLs live → Base/IPFS evidence links documented.

**Operator still owns:** actual screen recording ≤2:30, correct org switcher on camera, no secrets on screen.

## Remaining blockers / operator actions

- [ ] Film using `docs/DEMO_RUNBOOK.md` + `docs/FINAL_FILMING_CHECKLIST.md`
- [ ] Confirm post-push `ember-web` deployment includes landing/copy fixes
- [ ] Re-check PR #97 before any merged claim
- [ ] Optional: dependency advisory cleanup (CI audit is non-blocking)
- [ ] Do not enable production payroll schedules for screenshots

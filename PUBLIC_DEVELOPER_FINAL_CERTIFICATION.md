# Public developer final certification

**Date:** 2026-08-12  
**Scope:** Documentation + DX + MCP + onboarding + public repo hygiene + demo readiness  
**Not claimed:** “100% hackathon win”, “PR merged”, “CI green on GitHub” without live proof

---

## 1. Current architecture

Agent / operator decides → KeeperHub executes (Org A primary, Org B standby) → EMBER detects missed invocations, journals recovery, pins proof, anchors Continuity.sol → operator UI.

## 2. KeeperHub role

Workflows, signing, gas, retries of requested runs, Runs audit, MCP, REST execution. EMBER does not replace KeeperHub.

## 3. MCP architecture

- Remote: `https://app.keeperhub.com/mcp` (recommended)  
- Auth: OAuth or org `kh_` Bearer (not `wfb_`)  
- One connection = one org  
- No separate “EMBER MCP server” required for basic architecture  

## 4. Cursor setup

Documented in `docs/MCP_CURSOR.md` with dual-org `mcp.json.example`.

## 5. Claude setup

Documented in `docs/MCP_CLAUDE.md` using official:

`claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp`

## 6. One-org setup

Org A MCP sufficient for inspect / validate / smoke.

## 7. Two-org setup

`docs/FULL_RECOVERY_SETUP.md` — separate keys and MCP server entries for Org A + Org B.

## 8. Local setup

`pnpm setup` → `pnpm doctor` → `pnpm dev` with `DEVELOPMENT_MODE=1` (no secrets). Guide: `docs/LOCAL_DEVELOPMENT.md`.

## 9. Production setup

- Frontend: https://ember-web-seven.vercel.app/ (HTTP 200 verified)  
- Runtime: https://ember-api-8qzg.onrender.com/healthz + `/readyz` verified  
- Prefer `PAYDAY_ENABLE=0` for honest observer demos  

## 10. Demo workflow

`docs/DEMO_RUNBOOK.md` + `docs/FINAL_FILMING_CHECKLIST.md` — Org A for primary, Org B for rescue narrative, smoke for live MCP.

## 11. Public repo structure

Emphasizes README, docs/, examples/, packages/, services/, frontend/, contracts/, workflows/, evidence.

## 12. Files moved out of public tracking

Internal operational / planning artifacts untracked via `git rm --cached` + `.gitignore` (working copies may remain locally):

- `memory.md`, `PROJECT_EXECUTION_HISTORY.md`  
- `FINAL_PROMPT.md`, `FIRST_PLACE_AUDIT.md`, `FINAL_GAP_REPORT.md`  
- `IMPLEMENTATION_PLAN.md`, `video.md`  
- `KEEPERHUB_HACKATHON_INTELLIGENCE*`, `KEEPERHUB_MASTER_REFERENCE*`  
- `docs/DESIGN.cursor.md`, `PR_97_FINAL_VERIFICATION.md` (status summarized in public hackathon docs)  
- related internal certification scratch where classified private  

Secrets (`.env`) were never intended for tracking; remain gitignored.

## 13. Files added / rewritten

Public DX docs under `docs/` (WHAT_IS_EMBER, MCP_*, AGENT_PROMPTS, LOCAL_DEVELOPMENT, FULL_RECOVERY_SETUP, DEMO_RUNBOOK, LIVE_MODE, HACKATHON, FAQ, SECURITY, PUBLIC_DEVELOPER_READINESS, …), examples/{cursor,claude,mcp,basic-inspect,safe-smoke-test}, README rewrite, MCP evidence JSON.

## 14. Tests

Run in verification gate: `pnpm setup`, `pnpm doctor`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm security:secrets` (record outcomes in history after run).

## 15. MCP test evidence

`docs/evidence/mcp-dx-pass-2026-08-12.json` — smoke execution `dy0alz2vlnujwimbbx8b0` success, no USDC.

## 16. Vercel verification

HTTP 200 on https://ember-web-seven.vercel.app/

## 17. Render verification

`/healthz` and `/readyz` OK. `/health` is not the health path (404).

## 18. PR #97 current state

https://github.com/KeeperHub/cli/pull/97 — **OPEN**, **CHANGES_REQUESTED**, **not merged** (verified via `gh pr view`).

## 19. Hackathon checklist

Mapped in `docs/HACKATHON.md`. Filming still operator-owned.

## 20. Remaining operator actions

- [ ] Film ≤2:30 using DEMO_RUNBOOK  
- [ ] Re-check PR #97 before claiming merge  
- [ ] Push CI workflow with a PAT that includes `workflow` scope if GitHub Actions badge must turn green  
- [ ] Rotate any credentials that ever appeared in local tooling dumps  
- [ ] Optional: deploy frontend after DemoBanner change  
- [ ] Do not enable production schedules for screenshots  

# Public developer readiness scorecard

Evidence-backed DX score for EMBER. Updated during the public developer-experience pass.

| Area | Score | Evidence |
| --- | --- | --- |
| Clone experience | **PASS** | README quick start; `pnpm setup` contract |
| Local setup | **PASS** | [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md); `.env.example` |
| Local testing | **PASS** | format/lint/typecheck/build/security PASS; vitest 82 tests (1 sentinel integration flaky timeout once, PASS on retry); continuity-guardian inspect PASS |
| MCP connection | **PASS** | Official remote `https://app.keeperhub.com/mcp`; tools_documentation live |
| Cursor | **PASS** | [MCP_CURSOR.md](./MCP_CURSOR.md) + dual-org `.cursor/mcp.json.example` |
| Claude | **PASS** | [MCP_CLAUDE.md](./MCP_CLAUDE.md); official `claude mcp add --transport http` |
| One-org setup | **PASS** | Documented + verified Org A validate/smoke |
| Two-org setup | **PASS** | [FULL_RECOVERY_SETUP.md](./FULL_RECOVERY_SETUP.md); Org B `get_workflow` verified |
| Safe mode | **PASS** | Smoke `vewqfp44zmpa9dtctlrdr`; demo fixtures |
| Live mode | **PASS** | [LIVE_MODE.md](./LIVE_MODE.md); provenance labels |
| Production verification | **PASS** | Vercel 200; `/healthz` + `/readyz` OK |
| Demo path | **PASS** | [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md) + filming checklist |
| Troubleshooting | **PASS** | MCP quickstart + FAQ + SECURITY |
| Repository hygiene | **PARTIAL** | Internal docs untracked via gitignore + `git rm --cached` in this pass |

## Fresh MCP evidence (this pass)

| Step | Result |
| --- | --- |
| `tools_documentation` | OK (Org A) |
| `validate_workflow` `5goaid2zjgzyb32661se3` | `valid: true`, 2 nodes |
| `get_workflow` Org B `pvhwggqr8318wac68jb62` | OK, disabled, Manual → Pay Employee USDC |
| Smoke `execute_workflow` | `executionId` `dy0alz2vlnujwimbbx8b0` |
| `get_execution` | `success`; Base Sepolia balance check; no USDC tx |

Artifact: [evidence/mcp-dx-pass-2026-08-12.json](./evidence/mcp-dx-pass-2026-08-12.json)

## PR #97 (live check)

- URL: https://github.com/KeeperHub/cli/pull/97  
- State: **OPEN**  
- Review: **CHANGES_REQUESTED**  
- Merged: **no**

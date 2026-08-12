# Public developer final certification

**Date:** 2026-08-12 (final agent/MCP product pass)  
**Thesis:** KeeperHub executes. EMBER keeps the mission alive.

---

## Certification answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | Can a new user understand Ember? | **Yes** — landing + `/agent` + console story |
| 2 | Can a new developer clone it? | **Yes** — `pnpm setup` / `doctor` / `dev` (no secrets for default path) |
| 3 | Can a developer connect Cursor? | **Yes** — documented + `/agent` copy config |
| 4 | Can a developer connect Claude? | **Yes** — official `claude mcp add --transport http …` |
| 5 | Can an external agent use KeeperHub MCP? | **Yes** — aggregate remote MCP; verified in Cursor |
| 6 | Can the user safely test without spending? | **Yes** — smoke `vewqfp44zmpa9dtctlrdr` |
| 7 | Which actions are actually real? | Snapshot/health reads; Practice rescue **dry-run** to runtime |
| 8 | Which actions are read-only? | Console evidence, Mission/Payments/Rescue/Proofs/Health/Wallets displays, external explorers |
| 9 | Which require KeeperHub? | Any onchain payment / workflow Run / MCP execute |
| 10 | Which require Org A? | Primary payroll inspect/validate/smoke |
| 11 | Which require Org B? | Standby replay inspect / recovery narrative |
| 12 | What to show in the final video? | Landing → `/agent` → Cursor MCP inspect/validate/smoke → Org A canvas/Runs → Console Rescue/Proof |

---

## UI honesty (this pass)

| Misleading before | Fix |
| --- | --- |
| “See it live” / “Open live console” | Renamed to Open console / Connect agent |
| Mission builder implied deploy | Banner: CONFIGURATION ONLY — local draft |
| Practice rescue one-click | Confirm dialog; dry-run only |
| Live executions teaser without data | Renders JSON or error honestly |
| Wallets without provenance | ProvenanceBadge added |

**Per-workflow MCP:** Not implemented for EMBER payroll — workflows are private/unlisted. Aggregate MCP is correct.

---

## MCP tests (Cursor, twice)

| Pass | Execution | Result |
| --- | --- | --- |
| A | `qrfqudv56kvu9h2nz3hmb` | **success**, no USDC |
| B | `yhm1lhk9xxtth9u192yew` | **success**, no USDC |

Validate `5goaid2zjgzyb32661se3`: valid. Browser console on landing: no errors.

## Production

- Vercel `ember-web`: **READY** for tip `a7dba66` (clipboard Copied UX) after Agent/MCP page `4c45458`
- Render: `/healthz` + `/readyz` → **200** (2026-08-12 recheck)
- Live route: https://ember-web-seven.vercel.app/agent (+ `/mcp` redirect)
- Chrome a11y snapshot: Connect/Verify/Inspect/Validate/Safe test/Use EMBER/Troubleshoot + Org A/B IDs + spend warning present
- Console: no app errors (extension CSP/MetaMask noise only)

## Tests

Local: frontend typecheck/build PASS; vitest 82/82 PASS; lint PASS (this session).
MCP: `tools_documentation` + `get_workflow(5goaid2zjgzyb32661se3)` rechecked after deploy.

## PR #97

OPEN / CHANGES_REQUESTED / not merged (re-check live before claiming otherwise).

## Remaining operator

- [ ] Film ≤2:30 with checklist
- [ ] Switch Org B in KeeperHub UI before replay canvas
- [x] Confirm `/agent` on production after deploy READY

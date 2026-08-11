# KeeperHub Workshop Gap Analysis

**Source video:** [KeeperHub: Onchain Agent Execution Infrastructure | ETHGlobal Open Agents](https://www.youtube.com/watch?v=k6D7iIKKRiM)  
**Watched:** 2026-08-11 via `/watch` (captions + 40 keyframes under `docs/demo/watch-kh-workshop/`)  
**Official MCP docs (current):** https://docs.keeperhub.com/ai-tools/mcp-server  
**Remote MCP endpoint:** `https://app.keeperhub.com/mcp`

---

## Answers to the 12 workshop questions

### 1. What does the KeeperHub team demonstrate?

KeeperHub as the **execution layer** for onchain agents: templates/Hub strategies, visual workflow canvas (triggers → reads → conditions → writes → notifications), **Run**, **Runs/audit**, MCP as the primary agent interface, Claude Code plugin/connectors, and (in the ETHGlobal framing) contribution/onboarding bounties — not black-box apps.

### 2. How do they connect MCP?

Hosted remote MCP at `https://app.keeperhub.com/mcp`. Claude Code: `claude mcp add --transport http …` then `/mcp` OAuth, or Bearer `kh_…` for headless. Connectors UI lists tools with allow/deny.

### 3. How does Claude interact with KeeperHub?

Claude discovers MCP tools natively after connect, then calls list/get/create/execute/status tools (and the workflow-builder skill in the workshop) to turn natural language into a deployed workflow.

### 4. How does Cursor/Claude discover tools?

`tools/list` from the MCP server (30+ tools). Authoritative runtime docs via `tools_documentation` / `list_action_schemas`.

### 5–8. Create / execute / Runs / onchain

Agent builds nodes/edges → `create_workflow` (or AI generate) → `execute_workflow` → poll `get_execution` → Runs UI + explorer tx when a write lands.

### 9. UI screens in the demo

Hub templates, workflow canvas, Properties/Runs, Enable/Run, Claude connectors + tool permissions, Claude chat creating a multi-node DeFi workflow, ETHGlobal KeeperHub prize page.

### 10–12. EMBER weaknesses vs what matters

| Weakness | Judge-important? | Fix without architecture rewrite? |
| --- | --- | --- |
| Demo video without KeeperHub UI | **Yes — critical** | Re-record ≤2:30 with canvas/Run/Runs |
| MCP lifecycle not shown on camera | **Yes** | Document + record Cursor/Claude MCP session |
| Simple Manual→Pay canvas vs workshop multi-node DeFi | Medium | Keep execution workflows simple; explain boundary; optional read-only smoke canvas |
| Continuity logic not inside KH nodes | Low if explained | Correct: EMBER classifies; KH executes |
| Contribution not filed upstream | Medium (bounty) | Ship fixture pack; open PR when auth allows |
| Production provenance missing on Vercel | **Yes** | Redeploy frontend |

---

## CURRENT EMBER vs KEEPERHUB EXPECTED vs ACTION

| Area | CURRENT EMBER | KEEPERHUB EXPECTED DEMO | ACTION REQUIRED |
| --- | --- | --- | --- |
| Positioning | Continuity / missed-slot recovery app | Execution layer + agent MCP + Hub visibility | Keep thesis; make KH visible on camera |
| Primary workflow | `payday-stream-mainnet` Manual → Pay USDC | Rich canvas OR clear “KH executes the write” | **Do not bloat certified W1**; keep 2-node write; show Runs |
| Recovery | Sentinel + Org B replay + proof + anchor | Reliability / retries narrative | Map: KH lands replay txs; EMBER detects miss |
| MCP | Live `get_execution`, validate, smoke execute | Agent discover → validate → execute → inspect | `docs/MCP_DEMO.md` + recorded session |
| MCP setup docs | `MCP_GUIDE.md` (mcp-remote) | Official remote URL + Claude/Cursor copy-paste | Align README + `docs/MCP_DEMO.md` with docs.keeperhub.com |
| Evidence | Real Base mainnet IDs | Visible audit trail | Preserve; cross-check every ID |
| Demo video | EMBER + explorer heavy | KH UI mandatory | Update `docs/DEMO_VIDEO_DORAHACKS.md` |
| Contribution | Recovery contract pack in-repo | Mergeable fixture / onboarding | Open CLI #53 PR; Continuity Guardian docs |
| Honesty | Provenance in code | LIVE vs SNAPSHOT clear | Redeploy Vercel so production shows badges |

---

## Verdict on “is the workflow too weak?”

**No — not for the continuity thesis.**

Workshop multi-node DeFi canvases show *what KH can express*. EMBER’s certified path is intentionally:

```text
EMBER: observe / detect / classify / journal / prove / anchor
KeeperHub: execute primary pay · execute standby replay · execute anchor call
```

Pretending KeeperHub nodes “detect missed payroll” would be **false**. Judges should see a **simple, real USDC transfer workflow** plus **Runs with matching tx**, and EMBER as the continuity brain.

Optional **non-spend** MCP smoke workflow (`EMBER MCP Smoke Test`) demonstrates agent execute→inspect without touching mainnet payroll.

---

## Verified live MCP actions (this sprint)

| Step | Tool | Result |
| --- | --- | --- |
| Docs | `tools_documentation` | Authoritative lifecycle confirmed |
| List | `list_workflows` | Includes `payday-stream-mainnet` `5goaid2zjgzyb32661se3` |
| Get | `get_workflow` | Manual → Pay Employee USDC on Base `8453` |
| Validate | `validate_workflow` | `valid: true` |
| Certified inspect | `get_execution` `667ekg3qk5f45127eqjyy` | tx `0xd26e6174…341ea2` matches evidence |
| Safe execute | `execute_workflow` smoke `vewqfp44zmpa9dtctlrdr` | exec `2qvzsmq24d6nsjm0fzlhp` success, **no spend** |

---

## Frames worth citing

- Claude Connectors → KeeperHub MCP URL + tool allowlist (~t=07:32)
- Claude agent building multi-node workflow via MCP (~t=09:27)
- KeeperHub Hub / template / canvas sections (~t=01:40–03:20)
- ETHGlobal KeeperHub prize framing (~t=12:23+)

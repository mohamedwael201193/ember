# MCP Quickstart

**Audience:** developers connecting Cursor, Claude Code, or another MCP client to KeeperHub for EMBER.  
**Official docs (source of truth):** [MCP Server](https://docs.keeperhub.com/ai-tools/mcp-server) · [Claude Code plugin](https://docs.keeperhub.com/ai-tools/claude-code-plugin) · [Overview](https://docs.keeperhub.com/ai-tools/overview)

## What MCP is

**MCP (Model Context Protocol)** lets an AI agent call tools on a remote server. For EMBER, that server is **KeeperHub**, not EMBER.

You do **not** install an “EMBER MCP server” for the basic architecture.

```text
Your agent (Cursor / Claude Code / …)
        ↓  MCP (HTTPS)
KeeperHub remote MCP  https://app.keeperhub.com/mcp
        ↓
Your KeeperHub organization (workflows, executions, wallets)
```

EMBER’s continuity services talk to KeeperHub via API keys in the backend. Your IDE agent talks to KeeperHub via MCP so you can **inspect / validate / safely test** the same workflows.

## Why EMBER uses KeeperHub MCP

| Goal | Tooling |
| --- | --- |
| Inspect payroll / replay workflows | `list_workflows`, `get_workflow` |
| Validate structure before demos | `validate_workflow` |
| Safe no-spend smoke | `execute_workflow` on the smoke workflow + `get_execution` |
| Build / debug workflows | `ai_generate_workflow`, `list_action_schemas`, … |

Call `tools_documentation` at runtime for the live tool list. Do not hard-code assumptions from old blog posts.

## Auth (official)

| Method | When | Notes |
| --- | --- | --- |
| **OAuth (browser)** | Interactive Cursor / Claude | Org = active org at approve time |
| **Bearer `kh_…` key** | Headless / CI / dual-org | Create under **Settings → API Keys → Organisation** |

Use **organization-scoped `kh_` keys**.  
Do **not** use user-scoped `wfb_` keys for MCP.

Remote endpoint (recommended):

```text
https://app.keeperhub.com/mcp
```

Local `kh serve --mcp` is **deprecated** in current KeeperHub docs. Prefer remote HTTP.

## Org scoping (critical)

**One MCP connection = one organization.**

There is no way for a single MCP connection to list both Org A and Org B private workflows.

| Mode | MCP servers |
| --- | --- |
| **Single-org** | One `keeperhub` entry |
| **Full EMBER recovery** | Two entries, e.g. `keeperhub-org-a` + `keeperhub-org-b` |

See [FULL_RECOVERY_SETUP.md](./FULL_RECOVERY_SETUP.md).

## What to install

1. A KeeperHub account at [app.keeperhub.com](https://app.keeperhub.com/)  
2. An MCP-capable agent (Cursor or Claude Code)  
3. Optional: org API key(s) for headless dual-org  
4. This repo (for prompts, workflow IDs, continuity context)

No EMBER-side MCP package is required.

## Cursor

See the full walkthrough: [MCP_CURSOR.md](./MCP_CURSOR.md)

Headless example (placeholders only):

```json
{
  "mcpServers": {
    "keeperhub-org-a": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://app.keeperhub.com/mcp",
        "--header",
        "Authorization: Bearer ${KH_API_KEY_PRIMARY_OBSERVER}",
        "--transport",
        "http-only"
      ]
    }
  }
}
```

If your Cursor build supports native HTTP MCP:

```json
{
  "mcpServers": {
    "keeperhub-org-a": {
      "type": "http",
      "url": "https://app.keeperhub.com/mcp",
      "headers": {
        "Authorization": "Bearer ${KH_API_KEY_PRIMARY_OBSERVER}"
      }
    }
  }
}
```

Prefer env var substitution over pasting keys into chat or committed JSON.

## Claude Code

Official remote add (OAuth):

```bash
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp
```

Then run `/mcp` inside Claude Code and approve in the browser.

Headless Bearer:

```bash
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer kh_YOUR_ORG_KEY"
```

Optional plugin (skills + slash commands) is documented at [Claude Code plugin](https://docs.keeperhub.com/ai-tools/claude-code-plugin).  
Full guide: [MCP_CLAUDE.md](./MCP_CLAUDE.md)

## Verify the connection

Ask the agent (or call tools yourself):

1. `tools_documentation`  
2. `list_workflows`  
3. Confirm you see expected names (e.g. `payday-stream-mainnet`, `EMBER MCP Smoke Test`)  
4. `validate_workflow` on a known ID — expect `valid: true` for the primary canvas  

Copy-paste prompts: [AGENT_PROMPTS.md](./AGENT_PROMPTS.md)

## Safe smoke test (no USDC spend)

EMBER’s documented smoke workflow is a **Manual → Base Sepolia ETH balance check** (read path):

| Field | Value |
| --- | --- |
| Name | `EMBER MCP Smoke Test` |
| Workflow ID | `vewqfp44zmpa9dtctlrdr` |
| Org | Org A (primary) |

1. `execute_workflow` with that ID (+ optional `idempotency_key`)  
2. Poll `get_execution` until terminal  
3. Match `executionId` in KeeperHub **Runs** UI  

Do **not** treat this as a mainnet payment.

## Read execution results

`execute_workflow` only proves the run was **accepted**.  
Only `get_execution` (status + logs / receipts) proves outcome.

## Money safety

| Do | Don’t |
| --- | --- |
| Start with smoke / validate / get | Paste keys into chat |
| Keep production schedules **disabled** | Enable recurring mainnet casually |
| Use Org B only for intentional rescue | Run primary payroll twice “to check” |
| Prefer certified snapshots for demos | Call DEMO FIXTURE “live” |

Mainnet payroll workflows move **real USDC**. Treat any prompt that executes them as **write mode** — human confirmation required.

## Troubleshooting auth

| Symptom | Fix |
| --- | --- |
| 401 / unauthorized | Wrong key type (`wfb_` vs `kh_`), expired OAuth, or header missing `Bearer` |
| Empty workflow list | Connected to the wrong org |
| Tools missing | Reload MCP / restart agent; confirm remote URL |
| Can see Org A but not Org B | Expected — add a **second** MCP server entry |
| Cold-start / 502 on create | Retry with same `idempotency_key` after backoff (see official docs) |

## Next

- Cursor: [MCP_CURSOR.md](./MCP_CURSOR.md)  
- Claude: [MCP_CLAUDE.md](./MCP_CLAUDE.md)  
- Prompts: [AGENT_PROMPTS.md](./AGENT_PROMPTS.md)  
- Two-org: [FULL_RECOVERY_SETUP.md](./FULL_RECOVERY_SETUP.md)

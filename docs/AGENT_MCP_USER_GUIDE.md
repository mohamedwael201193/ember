# Agent / MCP user guide

**Audience:** developers connecting Cursor or Claude Code to KeeperHub for EMBER.  
**Official docs:** https://docs.keeperhub.com/agent/mcp-server

## What this is

Connect your AI agent to **KeeperHub MCP**. The agent inspects, validates, and safely tests Ember-compatible workflows. KeeperHub executes onchain. EMBER preserves continuity.

EMBER does **not** expose a separate MCP server for the normal architecture.

```text
User → AI agent → KeeperHub MCP → workflow → onchain execution → EMBER continuity → proof
```

## Remote MCP (recommended)

Endpoint: `https://app.keeperhub.com/mcp`

| Auth | Notes |
| --- | --- |
| OAuth | Browser approve; org = active org at approve time |
| Bearer `kh_…` | Organisation API key — not `wfb_` |

Local `kh serve --mcp` is deprecated.

## Org scoping

One MCP connection = one organization.

| Org | Role |
| --- | --- |
| A | Primary payday |
| B | Standby replay |

Full recovery inspection needs two MCP server entries.

## Per-workflow MCP

Listed marketplace workflows can expose `https://app.keeperhub.com/mcp/w/<slug>`.  
EMBER primary/replay payroll workflows are **private / unlisted**, so the aggregate MCP server is the correct path. Do not invent a marketplace listing for appearance.

## Product page

Interactive guide with copy buttons: https://ember-web-seven.vercel.app/agent  
Alias: `/mcp` → `/agent`

## Safe smoke

Workflow `vewqfp44zmpa9dtctlrdr` — Base Sepolia balance check, no USDC.

## Related

- [MCP_QUICKSTART.md](./MCP_QUICKSTART.md)
- [MCP_CURSOR.md](./MCP_CURSOR.md)
- [MCP_CLAUDE.md](./MCP_CLAUDE.md)
- [AGENT_PROMPTS.md](./AGENT_PROMPTS.md)
- [FULL_RECOVERY_SETUP.md](./FULL_RECOVERY_SETUP.md)

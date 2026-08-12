# Cursor ↔ KeeperHub MCP

Connect Cursor to KeeperHub’s **remote** MCP so the agent can inspect and safely test EMBER workflows.

Official KeeperHub MCP docs: https://docs.keeperhub.com/ai-tools/mcp-server

## Checklist

1. Install / open [Cursor](https://cursor.com)  
2. Open this EMBER repository  
3. Open Cursor MCP settings (Settings → MCP, or project `.cursor/mcp.json`)  
4. Add KeeperHub remote MCP  
5. Authenticate (OAuth **or** Bearer `kh_` key)  
6. Connect **Org A** (primary)  
7. Optionally add **Org B** as a **second** MCP server  
8. Reload MCP / restart Cursor if tools do not appear  
9. Run a verification prompt from [AGENT_PROMPTS.md](./AGENT_PROMPTS.md)  
10. Confirm tools appear (`tools_documentation`, `list_workflows`, …)  
11. Confirm organization identity (workflow names / IDs match Org A)  
12. Confirm workflow visibility (`payday-stream-mainnet`, smoke test)  
13. Run safe smoke test only  
14. Inspect execution in Cursor + KeeperHub Runs  
15. Only then consider any write path (explicit confirmation)

## Config A — OAuth / browser (when supported)

Some Cursor builds can add an HTTP MCP server and complete browser OAuth against KeeperHub’s authorization server.

Remote URL:

```text
https://app.keeperhub.com/mcp
```

After connecting, approve access while the **correct org** is active in [app.keeperhub.com](https://app.keeperhub.com/).

If OAuth is unavailable in your Cursor build, use Config B.

## Config B — Headless Bearer (recommended for dual-org)

Create an **organisation** API key (`kh_…`) under Settings → API Keys → Organisation.

### One org (Org A)

Copy from [../.cursor/mcp.json.example](../.cursor/mcp.json.example) or:

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

Set `KH_API_KEY_PRIMARY_OBSERVER` in your shell / OS env — **never** commit the real value.

### Two orgs (full EMBER recovery)

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
    },
    "keeperhub-org-b": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://app.keeperhub.com/mcp",
        "--header",
        "Authorization: Bearer ${KH_API_KEY_STANDBY}",
        "--transport",
        "http-only"
      ]
    }
  }
}
```

Native HTTP form (if your Cursor version supports `type: "http"`):

```json
{
  "mcpServers": {
    "keeperhub-org-a": {
      "type": "http",
      "url": "https://app.keeperhub.com/mcp",
      "headers": { "Authorization": "Bearer ${KH_API_KEY_PRIMARY_OBSERVER}" }
    },
    "keeperhub-org-b": {
      "type": "http",
      "url": "https://app.keeperhub.com/mcp",
      "headers": { "Authorization": "Bearer ${KH_API_KEY_STANDBY}" }
    }
  }
}
```

Each entry has its own tool namespace. Tell the agent which server to use for primary vs standby.

## Verification prompts

```text
Call tools_documentation on keeperhub-org-a. Summarize how to inspect and execute workflows safely. Do not execute anything that spends money.
```

```text
On keeperhub-org-a, list_workflows and identify payday-stream-mainnet and EMBER MCP Smoke Test. Do not execute.
```

```text
Validate workflow 5goaid2zjgzyb32661se3. Do not enable schedules or create writes.
```

## Safe smoke

```text
Execute only workflow vewqfp44zmpa9dtctlrdr (EMBER MCP Smoke Test). Wait for get_execution. Return executionId, status, and logs. Do not run payroll workflows.
```

## Known EMBER IDs (Org A / Org B)

| Role | Name | Workflow ID |
| --- | --- | --- |
| Primary payroll (mainnet) | `payday-stream-mainnet` | `5goaid2zjgzyb32661se3` |
| MCP smoke (no spend) | `EMBER MCP Smoke Test` | `vewqfp44zmpa9dtctlrdr` |
| Standby replay (mainnet) | `payday-stream-orgb-replay-mainnet` | `pvhwggqr8318wac68jb62` |

Primary Runs / canvas: https://app.keeperhub.com/workflows/5goaid2zjgzyb32661se3

## Troubleshooting

| Issue | Action |
| --- | --- |
| No tools | Confirm MCP enabled; restart Cursor; check `mcp-remote` can reach the URL |
| Wrong workflows | Wrong org key — recreate key in the intended org |
| Org B invisible | Add second server; one connection cannot see both |
| Accidental spend fear | Stay on smoke workflow; leave payroll `enabled: false` |

## Do not

- Paste API keys into the chat  
- Commit `.cursor/mcp.json` with real secrets (live configs are gitignored; only `mcp.json.example` is tracked)  
- Enable production schedules for a screenshot  
- Document local `kh serve --mcp` as the preferred path

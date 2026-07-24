# MCP Guide

EMBER talks to KeeperHub over REST and optionally over **Model Context Protocol (MCP)** for tools such as remote `anchorProof` and workflow inspection.

This repository does **not** ship live API keys. Use the examples under `docs/mcp/`.

## Prerequisites

- Node.js ≥ 20 with `npx`
- A KeeperHub API key (`kh_…`)
- Network access to `https://app.keeperhub.com/mcp`

## Installation pattern

All IDE configs use the same bridge:

```bash
npx -y mcp-remote@latest https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer kh_xxxxxxxxx" \
  --transport http-only
```

`--transport http-only` avoids flaky SSE setups observed with some Cursor versions.

## Cursor

1. Copy [`docs/mcp/cursor.mcp.json.example`](./docs/mcp/cursor.mcp.json.example)
2. Place as `.cursor/mcp.json` in the project (gitignored) **or** merge into your global Cursor MCP settings
3. Replace the bearer token with a real `kh_` key (prefer Observer or Standby scope for read/tools; never paste keys into chat)
4. Restart Cursor MCP servers

Example file is also documented for checked-in reference; never commit a filled `.cursor/mcp.json`.

## Claude Desktop

1. Open Claude Desktop → Settings → Developer → Edit Config  
2. Merge [`docs/mcp/claude-desktop.mcp.json.example`](./docs/mcp/claude-desktop.mcp.json.example)  
3. Replace `YOUR_KH_API_KEY_HERE`  
4. Restart Claude Desktop  

## VS Code

1. Use the MCP servers contribution / `mcp.json` support for your VS Code MCP extension  
2. Start from [`docs/mcp/vscode.mcp.json.example`](./docs/mcp/vscode.mcp.json.example)  
3. Prefer the `inputs` password prompt so the key is not stored in plaintext repo files  

## Tool list (KeeperHub-side)

Exact tool names evolve with KeeperHub. Common categories used by EMBER:

| Area | Examples |
|------|----------|
| Wallet | balance / info style tools |
| Workflows | list / get / execute / validate |
| Protocol | search + execute protocol actions |
| Transfers | execute_transfer / contract_call |
| Status | get_execution / direct execution status |

Sentinel’s production proof path uses the Org B MCP connection for anchoring after IPFS pin verification — see `ARCHITECTURE.md`.

## Example prompts

```
List my KeeperHub workflows and show which ones look like W1 payroll.
```

```
Get execution status for execution id <id> and summarize failure reasons.
```

```
Prepare (do not broadcast) a continuity anchorProof payload for rescueId <id>.
```

## Example operator workflow

1. `pnpm doctor` — confirm local stack  
2. Configure MCP with **standby** key for recovery tools  
3. Ask the agent to inspect unpaid slots / last rescue journal under `runtime/rescues`  
4. Only then approve live `anchorProof` / replay actions in KeeperHub UI  

## Security rules

- Never commit MCP configs that embed live `kh_` keys  
- Never put MCP bearer tokens in frontend env  
- Rotate any key that appeared in a screenshot, log, or chat  
- Org A executor keys must not be used for Sentinel MCP  

## Local development without MCP

`DEVELOPMENT_MODE=1` does not require MCP. The UI and mock runtime work offline with `fixtures/dev/`.

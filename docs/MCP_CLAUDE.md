# Claude Code ↔ KeeperHub MCP

Official sources:

- [MCP Server](https://docs.keeperhub.com/ai-tools/mcp-server)  
- [Claude Code Plugin](https://docs.keeperhub.com/ai-tools/claude-code-plugin)

## Recommended: remote MCP (no local CLI)

```bash
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp
```

Inside Claude Code:

1. Run `/mcp`  
2. Complete browser OAuth while the **correct KeeperHub org** is active  
3. Confirm tools appear  

That is the current official preferred path. Local `kh serve --mcp` is **deprecated**.

## Headless / API key

```bash
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer kh_YOUR_ORG_KEY"
```

Use an **organisation** `kh_` key — not `wfb_`.

## Dual-org (EMBER full recovery)

Add two named servers (names are examples):

```bash
claude mcp add --transport http --scope user keeperhub-org-a https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer kh_ORG_A_KEY"

claude mcp add --transport http --scope user keeperhub-org-b https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer kh_ORG_B_KEY"
```

Switching OAuth org: change active org in the KeeperHub UI, then `claude mcp remove …` and re-add so the new org is captured.

## Optional: Claude Code plugin

For skills and slash commands on top of the same remote MCP:

1. Install `kh` CLI (`brew install keeperhub/tap/kh` or see CLI docs)  
2. `/plugin marketplace add KeeperHub/claude-plugins`  
3. `/plugin install keeperhub@keeperhub-plugins`  
4. Restart Claude Code  
5. `/keeperhub:login` and `/keeperhub:status`

Plugin auth still targets `https://app.keeperhub.com/mcp`.

## Verify

```text
Call tools_documentation. Then list_workflows. Identify EMBER MCP Smoke Test and payday-stream-mainnet. Do not execute write workflows.
```

```text
Validate workflow 5goaid2zjgzyb32661se3. Report errors/warnings only.
```

Safe smoke:

```text
Execute workflow vewqfp44zmpa9dtctlrdr only. Poll get_execution. Return executionId and status. Do not run USDC transfer workflows.
```

More prompts: [AGENT_PROMPTS.md](./AGENT_PROMPTS.md)

## Troubleshooting

| Message / symptom | Meaning |
| --- | --- |
| Claude “Login expired / `/login`” | Claude account — unrelated to KeeperHub |
| KeeperHub auth | Use `/mcp` or `/keeperhub:login` / refresh `KH_API_KEY` |
| Empty org | Wrong OAuth org or wrong `kh_` key |
| Need Org B | Second MCP server entry required |

## Safety

- Prefer smoke + validate for demos  
- Keep mainnet payroll schedules disabled  
- Never paste real keys into prompts  
- See [MCP_QUICKSTART.md](./MCP_QUICKSTART.md)

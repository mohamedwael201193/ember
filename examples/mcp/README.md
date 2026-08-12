# MCP examples (any client)

Remote endpoint: `https://app.keeperhub.com/mcp`

## Inspect

```text
list_workflows — identify payday-stream-mainnet and EMBER MCP Smoke Test. Do not execute.
```

## Validate

```text
validate_workflow on 5goaid2zjgzyb32661se3. Do not enable schedules.
```

## Safe run

```text
execute_workflow vewqfp44zmpa9dtctlrdr → get_execution. No payroll workflows.
```

## Status / failure

```text
get_execution <id> — summarize status and errors. Do not retry writes.
```

## Two-org inspection

```text
Use separate MCP servers for Org A and Org B. Explain primary vs standby. Do not execute.
```

Config examples: [../../docs/mcp/](../../docs/mcp/) · [../../.cursor/mcp.json.example](../../.cursor/mcp.json.example)

## DO NOT

- Paste API keys into chat  
- Commit `.env`  
- Use mainnet for experimentation  
- Enable schedules casually  
- Run the same payment twice  
- Treat snapshot evidence as fresh live data

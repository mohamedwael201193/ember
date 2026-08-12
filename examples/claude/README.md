# Claude Code examples

Official remote MCP:

```bash
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp
```

Then `/mcp` for OAuth. Details: [../../docs/MCP_CLAUDE.md](../../docs/MCP_CLAUDE.md).

## Prompts

Copy from [../../docs/AGENT_PROMPTS.md](../../docs/AGENT_PROMPTS.md).

## DO NOT

- Paste API keys into chat  
- Commit `.env`  
- Use mainnet for experimentation  
- Enable schedules casually  
- Run the same payment twice  
- Treat snapshot evidence as fresh live data

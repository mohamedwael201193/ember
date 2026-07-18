# Breaking changes / research log

| Date | Source | Finding | Impact on EMBER |
|---|---|---|---|
| 2026-07-22 | docs.keeperhub.com/ai-tools/mcp-server | Remote MCP preferred; `kh serve --mcp` deprecated | Agents use hosted MCP only |
| 2026-07-22 | MCP tools | `get_execution` replaces status+logs pair | `kh-client` uses `get_execution` |
| 2026-07-22 | list_action_schemas | `tokenConfig` must be customToken JSON string | W1 transfer config |
| 2026-07-22 | Marketplace + Agentic Wallet | call_workflow does not auto-pay; 402 x402/MPP | Fee pipeline requires agentic wallet or escrow |
| 2026-07-22 | @keeperhub/sdk 0.1.1 | Early 0.x REST SDK | Prefer MCP for agents; SDK/REST for ops |
| 2026-07-22 | GitHub KeeperHub/cli | Latest v0.10.0 (2026-05-07) | Require ≥0.10.0 |
| 2026-07-22 | Foundry | forge 1.7.1 installed in WSL | Contract CI via WSL/CI image |
| 2026-07-22 | OpenZeppelin | Continuity uses minimal IERC20 interface initially | May switch to OZ v5 IERC20 via forge-std/OZ install when expanding |

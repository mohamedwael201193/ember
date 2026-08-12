# KeeperHub integration

EMBER builds **on** KeeperHub. This page maps responsibilities and surfaces.

## Division of labor

| KeeperHub | EMBER |
| --- | --- |
| Workflow execution | Missed-obligation detection |
| Managed wallet signing + gas | Unpaid slot classification |
| Simulation / retries of requested runs | Isolated standby (Org B) replay |
| Audit trail / Runs UI | Recovery journal (exactly-once intent) |
| MCP + REST execution APIs | IPFS proof + Continuity.sol anchor |
| Workflow builder / Hub templates | Operator continuity product UI |

## Surfaces EMBER uses

| Surface | Link / note |
| --- | --- |
| App | https://app.keeperhub.com/ |
| Docs | https://docs.keeperhub.com/ |
| MCP | https://app.keeperhub.com/mcp |
| Primary WF | `5goaid2zjgzyb32661se3` |
| Replay WF | `pvhwggqr8318wac68jb62` |
| Smoke WF | `vewqfp44zmpa9dtctlrdr` |

## MCP

Developers connect agents to **KeeperHub MCP**, not an EMBER MCP server.  
See [MCP_QUICKSTART.md](./MCP_QUICKSTART.md).

## Upstream contribution

CLI execution-recovery work: https://github.com/KeeperHub/cli/pull/97  
Status must be read live from GitHub (do not assume merged).

Pack notes: [keeperhub-contribution/](./keeperhub-contribution/)

## Adoption

Reusable kit: [KEEPERHUB_CONTINUITY_ADOPTION.md](./KEEPERHUB_CONTINUITY_ADOPTION.md)  
Package: `packages/continuity-kit` · example: `examples/continuity-guardian`

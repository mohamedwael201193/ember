# Full recovery setup (two KeeperHub organizations)

EMBER’s strongest continuity story uses **two** KeeperHub organizations so standby credentials never share the primary executor’s key material.

## Why two orgs?

| Org | Role |
| --- | --- |
| **Org A (primary)** | Normal payday / payroll workflow execution |
| **Org B (standby)** | Rescue replay only — isolated wallet + API keys |

If the primary agent (or Org A credentials) are compromised or unavailable, Sentinel can still request replay through Org B.

## Why one MCP connection is not enough

Official KeeperHub MCP docs: **each MCP connection is scoped to a single organization.**

OAuth captures the org active at approval time.  
A `kh_` key is bound to the org that created it.

Therefore:

- One MCP server entry → Org A **or** Org B  
- Full EMBER recovery inspection → **two** MCP server entries  

Never tell a developer that one MCP connection automatically accesses both organizations.

## Create keys (placeholders only)

In each org: Settings → API Keys → **Organisation** tab → create `kh_…` key.

```bash
# Org A — primary executor / observer (use least privilege you can)
KH_API_KEY_PRIMARY_EXECUTOR=<YOUR_ORG_A_KEY>
KH_API_KEY_PRIMARY_OBSERVER=<YOUR_ORG_A_READ_KEY>

# Org B — standby only
KH_API_KEY_STANDBY=<YOUR_ORG_B_KEY>
```

Also configure (names from `.env.example`):

```bash
KH_ORG_A_W1_MAINNET_WORKFLOW_ID=5goaid2zjgzyb32661se3
KH_ORG_B_W1_REPLAY_MAINNET_WORKFLOW_ID=pvhwggqr8318wac68jb62
```

**Never** put real keys in docs, commits, screenshots, or chat.

## MCP: two server entries

### Cursor

See [MCP_CURSOR.md](./MCP_CURSOR.md) — `keeperhub-org-a` + `keeperhub-org-b`.

### Claude Code

```bash
claude mcp add --transport http --scope user keeperhub-org-a https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer <YOUR_ORG_A_KEY>"

claude mcp add --transport http --scope user keeperhub-org-b https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer <YOUR_ORG_B_KEY>"
```

## How EMBER uses them

```text
PAYDAY / agent  →  Org A workflow  →  Base USDC (primary)
Sentinel miss   →  Org B replay WF →  Base USDC (rescue only)
Sentinel        →  journal + IPFS proof + Continuity.sol
```

Backend services hold keys; the browser never receives `kh_` secrets.

## Credential isolation rules

| Do | Don’t |
| --- | --- |
| Separate wallets per org | Reuse Org A key for Org B MCP |
| Separate shared secrets for observer vs sentinel | Commit `.env` |
| Keep replay workflow **disabled** until intentional rescue | Enable Org B schedules casually |
| Rotate keys if exposed | Paste keys into agent chat |

## Verify without spending

```text
Inspect both Ember KeeperHub organizations and explain which is primary and which is standby. Do not execute anything.
```

Validate Org A primary; optionally `get_workflow` on Org B replay ID. Prefer smoke on Org A for MCP demos.

## Related

- [MCP_QUICKSTART.md](./MCP_QUICKSTART.md)  
- [AGENT_PROMPTS.md](./AGENT_PROMPTS.md)  
- [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md)

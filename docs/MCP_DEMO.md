# MCP Demo — EMBER × KeeperHub

Reproducible agent path matching current official docs:  
https://docs.keeperhub.com/ai-tools/mcp-server

**Remote endpoint:** `https://app.keeperhub.com/mcp`  
**Auth:** OAuth (Claude Code `/mcp`) or `Authorization: Bearer kh_…`  
**Never commit API keys.**

---

## What this proves

```text
Cursor / Claude
      ↓ MCP
KeeperHub tools
      ↓
list / get / validate / execute / get_execution
      ↓
KeeperHub Run
      ↓
(on write) Base tx  ·  (on read smoke) balance result
```

EMBER’s continuity brain stays off-chain. KeeperHub is the execution + audit surface.

---

## 1. Create / login to KeeperHub

1. Open https://app.keeperhub.com/  
2. Create or select the org that owns EMBER workflows (or a personal sandbox org).

## 2. API key (headless / Cursor)

Settings → API Keys → Organisation → create `kh_…` key.  
Prefer a key scoped to the org you intend to demo.

## 3. Configure remote MCP

### Claude Code (official)

```bash
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp
```

Then `/mcp` for OAuth.

Headless:

```bash
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp \
  --header "Authorization: Bearer kh_your_key_here"
```

### Cursor (project-local, gitignored)

Copy [`docs/mcp/cursor.mcp.json.example`](./mcp/cursor.mcp.json.example) → `.cursor/mcp.json` and replace the bearer token:

```json
{
  "mcpServers": {
    "keeperhub": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://app.keeperhub.com/mcp",
        "--header",
        "Authorization: Bearer kh_your_key_here",
        "--transport",
        "http-only"
      ]
    }
  }
}
```

Restart MCP servers. Confirm tools appear (`list_workflows`, `get_execution`, `tools_documentation`, …).

## 4. Verify tools

Ask the agent:

> Call `tools_documentation` and summarize the workflow execute → get_execution lifecycle.

## 5. Inspect EMBER’s certified workflow

> `get_workflow` for `5goaid2zjgzyb32661se3` (`payday-stream-mainnet`).

Expect: Manual Trigger → Pay Employee USDC, network `8453`, 0.01 USDC.

## 6. Validate

> `validate_workflow` with `workflowId=5goaid2zjgzyb32661se3`.

Expect: `valid: true`.

## 7. Safe execute (no mainnet spend)

Use the smoke workflow (Base Sepolia **read** balance):

| Field | Value |
| --- | --- |
| Name | `EMBER MCP Smoke Test` |
| ID | `vewqfp44zmpa9dtctlrdr` |
| Action | `web3/check-balance` on Base Sepolia |

> `execute_workflow` with that ID and a unique `idempotency_key`.  
> Then `get_execution` until `success`.

**Do not** `execute_workflow` on `payday-stream-mainnet` unless you explicitly intend to spend 0.01 USDC.

## 8. Inspect the Run

In KeeperHub UI: open the smoke workflow → **Runs** → execution ID from step 7.  
In MCP: `get_execution` returns step logs + output.

## 9. Certified mainnet evidence (inspect only)

> `get_execution` for `667ekg3qk5f45127eqjyy`

Must match:

| Field | Value |
| --- | --- |
| Workflow | `5goaid2zjgzyb32661se3` |
| Tx | `0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2` |
| Explorer | https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2 |

Artifact: [`evidence/mcp-continuity-demo-2026-08-11.json`](./evidence/mcp-continuity-demo-2026-08-11.json)

## 10. Local development vs live MCP

| Mode | Secrets | MCP | Spend |
| --- | --- | --- | --- |
| `DEVELOPMENT_MODE=1` | None | Optional | Never |
| MCP smoke | Org key | Yes | No (read) |
| Certified inspect | Org key | Yes | No (historical) |
| Mainnet PAYDAY execute | Org key + funds | Yes | **Real USDC** — gated |

Clone path without MCP:

```bash
pnpm install && pnpm setup && pnpm doctor && pnpm test && pnpm build
```

---

## Recorded live demo (this repo session)

| Step | ID / result |
| --- | --- |
| Validate mainnet W1 | `valid: true` |
| Smoke execute | `2qvzsmq24d6nsjm0fzlhp` |
| Smoke outcome | success, balance `0.12` ETH Sepolia, **no tx** |
| Certified PAYDAY get_execution | tx hash matches Phase 13 evidence |

See also: [`KEEPERHUB_WORKSHOP_GAP_ANALYSIS.md`](./KEEPERHUB_WORKSHOP_GAP_ANALYSIS.md)

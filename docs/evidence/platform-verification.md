# Platform verification — Phase 00

**Date:** 2026-07-22  
**Operator:** Cursor agent (EMBER)  
**Sources:** https://docs.keeperhub.com/, live `https://app.keeperhub.com`, GitHub `KeeperHub/cli` releases  
**Secrets:** redacted — never paste `kh_` / private keys into this file

## Compatibility matrix

| # | Behavior | Expected | Observed | Status |
|---|---|---|---|---|
| 1 | CLI version | ≥ 0.10.0 | `kh version 0.10.0` windows/amd64 + linux/amd64 | **PASS** |
| 2 | CLI run wait/json | `--wait`, timeout, structured output | `kh workflow run --help` shows `--wait`, `--timeout`, global `--json`, `--jq`. Example in help: `--wait --timeout 2m`. Live: `kh workflow run vewqfp44zmpa9dtctlrdr --wait --timeout 2m --json` → `status: success` | **PASS** |
| 3 | MCP remote auth | Bearer `kh_` or OAuth | Cursor uses `mcp-remote --transport http-only` + Bearer (native HTTP SSE GET fails — see deviations) | **PASS** |
| 4 | MCP tool discovery | Discover at runtime; >30 tools | `tools_documentation` + `tools/list` ≈ 34 tools; never hardcode count | **PASS** |
| 5 | Org isolation | Key A ≠ Key B data | REST `/api/workflows` Org A has smoke id; Org B does **not** (`B_sees_A_smoke=False`) | **PASS** |
| 6 | Observer key scope | Full org scope (no read-only) | Observer key lists same Org A workflows as executor (HTTP 200, same byte size) | **PASS** (confirms Primary Observer design) |
| 7 | Manual workflow execute | Real Base Sepolia read | Smoke WFs `vewqfp44zmpa9dtctlrdr` / `6ogrdndixafwe5svblfju` → balance **0.12 ETH** | **PASS** |
| 8 | Cross-org import + credential rebind | Programmatic create in B with B integration | Created Org B workflow `EMBER Import Rebind Smoke` with integration `uof7week9ne35ljfdnjae` and Org B address (idempotency `ember-import-rebind-2026-07-22`) | **PASS** |
| 9 | `web3/transfer-token` schema | `tokenConfig` JSON string | Live `list_action_schemas`: `{"mode":"custom","customToken":{"address","symbol"}}`; prefer `chainId` over deprecated `network` | **PASS** |
| 10 | Marketplace paid call (x402) | HTTP 402 with challenge | `call_workflow` slug `wallet-snapshot-base` → **402**, amount `10000` (0.01 USDC), asset Base USDC `0x8335…2913`, network `eip155:8453`, payTo `0x21db…1a92`. Tool does **not** auto-pay | **PASS** (challenge) |
| 11 | Marketplace paid settlement tx | Real Base USDC payment + execution | Agentic wallet `keeperhub-wallet add` → **HTTP 500 INTERNAL** provision failure. Settlement **blocked** until wallet provision works + Base USDC funded | **FAIL / BLOCKED** |
| 12 | Marketplace write semantics | Unsigned calldata for write | Docs + `call_workflow` description: write returns `{to,data,value}`. Sample write listings disabled (503). Architecture: treat paid **read** for fee path; W3 rescue remains Org B–owned manual/MCP unless write listing proven later | **PARTIAL** |
| 13 | Agentic wallet install | `skill install` + `wallet add` | `skill install` wrote Cursor/Claude skills; Cursor hooks require manual wiring. `wallet add` failed 500 | **PARTIAL** |
| 14 | Official SDK | Inspect coverage | `@keeperhub/sdk@0.1.1` early 0.x REST client; agents should prefer MCP. Backend may use SDK where methods exist + REST for gaps | **PASS** |
| 15 | Foundry toolchain | Installable | WSL `forge 1.7.1`; `forge test` Continuity: 2 passed | **PASS** |
| 16 | pnpm / Node | Node 24, pnpm 10 | Node v24.12.0; pnpm 10.34.5; lint/typecheck/test/build green | **PASS** |

## Key IDs (non-secret)

| Item | Value |
|---|---|
| Org A smoke workflow | `vewqfp44zmpa9dtctlrdr` |
| Org B smoke workflow | `6ogrdndixafwe5svblfju` |
| Org A wallet integration | `jq31igp9un4exkxl4z7wu` |
| Org B wallet integration | `uof7week9ne35ljfdnjae` |
| Paid listing probed | `wallet-snapshot-base` @ 0.01 USDC |
| CLI path (Windows) | `%LOCALAPPDATA%\keeperhub\bin\kh.exe` |
| CLI path (WSL) | `~/.local/bin/kh` |

## Load-bearing decision for W3 fees

1. **x402 challenge path is real** for paid **read** listings (402 + exact scheme on Base USDC).  
2. **Settlement not yet proven** — blocked on KeeperHub agentic wallet provisioning (platform 500).  
3. Until settlement PASS: implement W3 fee state machine with `X402` / `MPP` / `ESCROW_FALLBACK`, but **do not list W3 as paid Marketplace** until a real settlement tx is recorded. Escrow fallback remains the rehearsal path.  
4. Docs contradiction resolved for planning: Marketplace page claims KeeperHub handles payment+execution; MCP `call_workflow` explicitly does **not** auto-pay — agent/wallet must settle 402 then retry.

## Commands used (redacted)

```text
kh version
kh workflow run --help
kh workflow run <workflow-id> --wait --timeout 2m --json
GET /api/workflows  (Bearer kh_… Org A / Org B / Observer)
MCP tools_documentation / list_action_schemas / call_workflow / create_workflow
npx -p @keeperhub/wallet keeperhub-wallet skill install
npx -p @keeperhub/wallet keeperhub-wallet add   # FAILED 500
forge test  # WSL contracts/
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Human actions still required

1. Retry agentic wallet provision when KeeperHub recovers; fund with ≥0.05 Base mainnet USDC for paid rehearsal.  
2. Optional: dashboard confirmation of import/rebind (programmatic path already PASS).  
3. Docker Desktop / engine if compose-based chaos is required on this machine.  
4. Public URLs for Sentinel / Primary Observer (Render or tunnel) before live W2 schedule.

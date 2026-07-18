# Deviations log

Live platform behavior that differs from earlier specs or from `IMPLEMENTATION_PLAN.md` assumptions.

| Date | Topic | Plan / FINAL_PROMPT assumption | Live observation | Decision |
|---|---|---|---|---|
| 2026-07-22 | Cursor MCP HTTP | Direct `"type":"http"` to `/mcp` | GET `/mcp` returns `application/json` (not SSE); Cursor fails with `Failed to open SSE stream` after minutes | Use `mcp-remote --transport http-only` stdio bridge in `.cursor/mcp.json` |
| 2026-07-22 | CLI flags | Ambiguous `--json --timeout` | Global `--json` + `--wait` + `--timeout` confirmed in `kh workflow run --help` v0.10.0 | Use documented flags |
| 2026-07-22 | Paid Marketplace | Need real settlement tx in Phase 00 | x402 **402** proven on `wallet-snapshot-base`; agentic `wallet add` returns HTTP 500 | Proceed with escrow rehearsal; **do not list W3 paid** until settlement PASS |
| 2026-07-22 | Docs mcp-test slug | Docs reference `mcp-test` | `call_workflow` slug `mcp-test` → 404 | Use live `search_workflows` slugs |
| 2026-07-22 | Quickstart URL | `/getting-started/quick-start-guide` | 404; correct `/getting-started/quickstart` | Prefer quickstart path |
| 2026-07-22 | Validate workflow MCP | Inline draft validation | `validate_workflow` requires existing `workflowId` | Create disabled → validate → execute |
| 2026-07-22 | chain field | Prefer `chainId` in schemas docs | Workflow **action config** rejects `chainId` as UNKNOWN_FIELD for `web3/transfer-token`; must use `network` string | Use `network` in workflow nodes; `chainId` only where direct MCP execute tools require it |
| 2026-07-22 | Gas sponsorship | Optional | W1 Sepolia transfer returned `sponsored: true` via relayer `0x5af5…f07d` | Document sponsorship vs private routing mutual exclusion; receipt still shows USDC Transfer from org wallet |
| 2026-07-22 | Executions REST | Guessed `GET /api/executions/{id}` | Live 404; documented paths are `/api/workflows/{id}/executions`, `/api/workflows/executions/{id}/status`, `/wait` | `kh-client` uses list/status/wait |
| 2026-07-22 | W2 HTTP Request | Schedule → HTTP → Sentinel `/check` | Creating workflow with `action.http-request` or `code/run-code` returns **402 `upgrade_required` (Pro)** | W2 stub = Schedule + `web3/check-balance` pulse; Sentinel uses `SENTINEL_SELF_POLL=1` until Pro; replace stub when upgraded |
| 2026-07-22 | W3 Code/HTTP | Rescue workflow with HTTP/Code | Same Pro gate | W3 stub = Manual + `web3/check-balance`; Sentinel exposes HMAC `POST /rescue` directly; W3 HTTP node deferred until Pro |
| 2026-07-22 | Continuity rescueMission | Some notes assumed `rescueMission` | Live Continuity only has `registerMission`/`fund`/`anchorProof`/`claimFee`/`setStandby` | Rescue payments = Org B W1' `transfer-token` replay; onchain proof via `anchorProof` in Phase 10 |
| 2026-07-22 | Detection timestamps | KH `completedAt` for slots | Receipt block timestamps preferred; 9/9 W1 txs receipt-verified but only 2 map into post-`MISSION_START_AT` slots | Slot math uses verified `block.timestamp`; early rehearsal txs before start do not count |
| 2026-07-22 | Auth header | Some older notes mentioned API key headers | Team: **Bearer only**; never `X-API-Key` | `kh-client` already sends `Authorization: Bearer`; audit locked |
| 2026-07-22 | Docker chaos | `docker kill` drills | No Docker on workstation | Process-level `Stop-Process`/`kill` + Render restart; see RUNBOOK |
| 2026-07-22 | 402 Pro features | Assumed free HTTP/Code | Confirmed plan gate; no free workaround in current docs/pricing | Keep interim architecture until Pro or new capability |
| 2026-07-22 | Replay idempotency | Block timestamp marks historical unpaid slots | Replay txs land at "now" → same slot IDs reclassified unpaid → **double-pay** on `live2slots-rerun` | Mission-wide journal coverage: verified Org B replay `(slotId→txHash)` marks slot paid regardless of block time |
| 2026-07-22 | Direct contract-call empty string | `ESCROW_FALLBACK` permits an empty contract `feeReference` | KeeperHub direct execution rejected `feeReference: ""` as missing before broadcast | Use explicit non-secret marker `escrow-fallback`; first attempt had no transaction |
| 2026-07-22 | PAYDAY restart idempotency | Local journal alone prevents duplicate slot execution | Live KeeperHub accepts `Idempotency-Key`; restarting in the same slot returned execution `2hop…gs6` and the same tx | Key each W1 invocation by mission + slot and retain the local single-flight guard |
| 2026-07-22 | RPC fallback network | Generic `BASE_RPC_URL_FALLBACK` was available to Sepolia receipt checks | The configured generic fallback is Base mainnet, so it is not a valid Sepolia fallback | Add `BASE_SEPOLIA_RPC_URL_FALLBACK`; never cross network boundaries |
| 2026-07-22 | Render free disks | Blueprint assumed persistent disks for journals | Free plan rejects disks; journals must use ephemeral `/tmp/ember/*` | Free Blueprint uses `/tmp`; promote plan + disks before mainnet |

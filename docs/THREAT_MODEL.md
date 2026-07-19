# EMBER threat model (backend)

## Assets

- Org A / Org B `kh_` API keys and HMAC service secrets
- Org wallets (USDC payroll / rescue)
- Rescue journals (slot → tx binding)
- Continuity mission escrow and proof anchors

## Top risks and controls

| Threat                              | Impact   | Control                                                                                                                                           |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate payroll / rescue payment  | Critical | Receipt verification + journal slot coverage + single-flight lock + `MAX_REPLAY_SLOTS`                                                            |
| Observer key exfiltration           | High     | Isolation service; key never in Sentinel/Org B process env                                                                                        |
| HMAC replay / forgery               | High     | Timestamp skew + nonce store + body hash                                                                                                          |
| HMAC replay after process restart   | Medium   | 60-second validity window, TLS, rate limit, isolated secrets; deployed multi-instance service requires a shared nonce store                       |
| Workflow tamper before rescue       | High     | Canonical hash vs onchain `workflowHash`                                                                                                          |
| Crash after replay broadcast        | Critical | Fsynced per-slot replay intent + mission/slot KeeperHub `Idempotency-Key` before execute                                                          |
| Stale rescue lock after crash       | High     | PID/age lock ownership check and atomic stale-lock quarantine                                                                                     |
| Rescue journal tampering            | Critical | Restricted persistent-disk permissions, receipt re-verification, workflow hash, IPFS/onchain proof; preserve disk snapshots for incident response |
| KeeperHub full-scope key compromise | Critical | Separate process/service projection, no browser exposure, Observer route allowlist, immediate rotation procedure                                  |
| Agentic wallet custodian compromise | High     | Wallet is custodial; minimum balance and separate payer identity; paid path remains disabled while provisioning fails                             |
| x402/MPP plus escrow double charge  | Critical | Immutable fee mode per rescue; contract rejects escrow claims for externally paid modes                                                           |
| Receipt spoofing or wrong network   | Critical | Expected chain, token, sender, recipient, amount, status, and confirmation depth; Sepolia-only fallback                                           |
| KeeperHub Pro / platform outage     | Medium   | Self-poll + direct `/rescue`; journal resume after process kill                                                                                   |
| Cloudflare / WAF false negatives    | Medium   | Investigate outage before client redesign                                                                                                         |
| Mainnet overspend                   | Critical | Sepolia until Phase 13; aggregate USDC cap                                                                                                        |

## Residual constraints

- PAYDAY and Sentinel are single-instance stateful services. Horizontal scaling
  is unsafe until lock and nonce state move to a shared transactional store.
- The in-memory nonce store loses consumed nonces on restart. The narrow
  timestamp window limits exposure, but a shared store is required before
  multi-instance deployment.
- KeeperHub organization keys currently have no granular read-only scope.
  Observer isolation reduces application capability but does not reduce the
  underlying key's platform permissions.

## Non-goals (this doc)

Frontend XSS, Vercel edge auth — deferred with UI stage.

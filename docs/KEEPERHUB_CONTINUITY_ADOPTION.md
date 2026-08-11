# KeeperHub Continuity Adoption

Status: **EMBER reference architecture + upstream contribution proposal**  
Verified against current GitHub (2026-08-11):

- [`KeeperHub/cli` #53](https://github.com/KeeperHub/cli/issues/53) — **open** (public mock / JSON fixture suite)
- [`KeeperHub/cli` #95](https://github.com/KeeperHub/cli/pull/95) — **open, changes-requested** (chain-verified receipts on `kh execute status`)

Do **not** duplicate PR #95. Prefer a small fixture contract that complements #53 and teaches safe recovery semantics for adapters.

---

## What KeeperHub guarantees

When an agent (or operator) **requests** an execution:

1. KeeperHub accepts the workflow run.
2. KeeperHub executes the configured actions (transfers, contract calls, etc.).
3. KeeperHub returns execution status and, when available, onchain receipts.
4. KeeperHub provides surfaces for agents and humans: MCP, CLI, Workflow UI, audit/Runs.

Documented write idempotency for repeated submits is time-bounded (commonly discussed as ~24h for identical idempotency keys). That protects **retries of a requested run**. It does not invent a request that never happened.

---

## What EMBER adds

EMBER answers a different question:

> The primary agent died **before** it requested the next obligation. The mission schedule still expects a payment. Who detects the miss, pays exactly once from standby credentials, and proves it?

| Layer | Owner | Concern |
| --- | --- | --- |
| Requested execution retry | KeeperHub | Same invoke retried safely |
| Missed-invocation recovery | EMBER | Slot never requested → detect → standby replay |
| Receipt predicate | EMBER + chain | API “completed” ≠ paid unless receipt matches |
| Durable exactly-once | EMBER journal | Survives beyond KH idempotency window |
| Immutable proof | EMBER | IPFS + `Continuity.sol` anchor |

---

## Boundary (do not blur)

```text
Agent decides → KeeperHub executes requested work
                      ↓
            (agent dies / cron stops)
                      ↓
         EMBER detects unpaid slot from
         schedule + receipts + journal
                      ↓
         EMBER requests standby workflow
                      ↓
            KeeperHub executes recovery
                      ↓
         Base confirms → EMBER proves
```

EMBER never claims KeeperHub “auto-heals missed payroll” by itself.  
KeeperHub never needs EMBER’s journal to land a single requested transfer.

---

## Why missed-invocation recovery ≠ normal execution retry

| | Execution retry | Missed-invocation recovery |
| --- | --- | --- |
| Trigger | Same request failed / uncertain | No request for an expected slot |
| Idempotency key | Same key as original request | Deterministic per `(mission, slot, standby)` |
| Risk if naive | Double submit of one intent | Paying slots that were already paid |
| Evidence | One execution → one receipt | Gap proof + replay set + journal |

---

## Idempotency considerations

1. **KeeperHub window** — reuse the same `Idempotency-Key` when resuming an in-flight replay after crash.
2. **Journal window** — EMBER marks slots `CONFIRMED` / covered so a later rescue window cannot replay them even after KH’s key expires.
3. **Receipt gate** — never treat `status=completed` alone as paid (aligns with the intent of CLI PR #95 `--require-verified`).
4. **Unconfirmed** — poll; do not resubmit a new execution for the same slot while a prior execution ID is durable in the journal.
5. **No chain evidence** — fail closed; classify as needs human / retry policy, never invent success.

---

## Threat model (short)

| Threat | Mitigation |
| --- | --- |
| Double-pay after crash | Journal intents before submit; resume by execution ID |
| Double-pay after KH key expiry | Persistent covered-slot set |
| Fake “completed” without transfer | Receipt checker + explorer verify |
| Standby using primary credentials | Dual-org isolation (Org A observe / Org B replay) |
| Demo data mistaken for live | Provenance labels on every public surface |
| Accidental mainnet write from clone | Inspect-only defaults; `WRITE_MODE` gated |

---

## Reusable contract (Mission Continuity Kit)

Package: `@ember/continuity-kit`  
Starter: `examples/continuity-guardian`

Policy fields:

- expected cadence / slot identity
- primary workflow id
- standby workflow id
- receipt predicate
- grace window
- replay cap
- journal coverage / exactly-once helpers

Reference product: EMBER payroll on Base mainnet. Same primitive maps to treasury sweeps, liquidation keepers, recurring grants, settlement agents.

---

## Upstream integration model (mergeable slice)

For [`KeeperHub/cli` #53](https://github.com/KeeperHub/cli/issues/53), EMBER proposes **Execution Recovery Contract Pack v1**:

Path in this repo: [`docs/keeperhub-contribution/execution-recovery-contract-pack-v1/`](./keeperhub-contribution/execution-recovery-contract-pack-v1/)

Neutral JSON fixtures for:

- queued
- completed with transaction
- completed without transaction
- failed
- unconfirmed
- reverted
- not found
- rate limited
- cold start
- malformed response

Consumer tests (TypeScript here; Go port for CLI PR) encode:

```text
unconfirmed → poll → do not resubmit
no chain evidence → fail closed
write retry → stable idempotency key
```

This does **not** overlap PR #95’s `--require-verified` implementation. It gives adapter authors golden shapes so their mocks do not drift from production.

---

## What EMBER will not ask KeeperHub to absorb

- Dual-org standby product UX
- IPFS pinning policy
- Continuity.sol as a core platform requirement
- Full payroll product branding

Those stay in EMBER as the reference architecture proving the recovery layer works on Base mainnet.

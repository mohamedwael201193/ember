# @ember/continuity-kit

Pure TypeScript primitives for **mission continuity**: detect unpaid cadence slots, apply grace, plan standby replays, and refuse double-pay using durable slot identity.

This package has **no I/O, no secrets, and no chain clients**. Wire it into payroll, treasury, liquidation, grants, or settlement agents the same way EMBER uses it for USDC payday rescue.

## Install (monorepo)

```bash
pnpm --filter @ember/continuity-kit build
```

```ts
import {
  validatePolicy,
  classifyMissedSlots,
  planReplay,
  coveredSlotsFromJournalReplays,
  assertNoDoublePay
} from "@ember/continuity-kit";
```

## MissionPolicy

| Field | Meaning |
| --- | --- |
| `expectedCadenceSeconds` | Seconds between owed runs |
| `primaryWorkflowId` | Primary executor workflow (Org A / live path) |
| `standbyWorkflowId` | Standby replay workflow (Org B / rescue path) |
| `graceMissedRuns` | Missed-slot count tolerated before rescue is actionable (`1…5`) |
| `maxReplaySlots` | Cap on slots replayed per rescue (`1…12`) |
| `receiptConfirmations` | Confirmations required before a receipt counts |
| `durableSlotIdentityNote` | Operator-facing note: slots are schedule anchors, not replay block times |

**Durable slot identity:** owed runs are identified by stable slot ids (typically `startAt + cadence * index`). Standby replays land in the current block-time window, so journals must bind `(slotId → verified receipt)` — never infer historical coverage from replay timestamps.

## Pure API

- `validatePolicy(policy)` — structured validation
- `classifyMissedSlots(expectedSlots, confirmedSlots, grace)` — `ok` / `within_grace` / `actionable`
- `planReplay(unpaidSlots, coveredSlots, maxReplaySlots)` — capped replay plan, skips already-covered
- `coveredSlotsFromJournalReplays(replays)` — covered set from journal entries (skips `0xdry…`)
- `assertNoDoublePay(plannedSlots, coveredSlots)` — throws on collision

## Reuse outside payroll

| Domain | Primary cadence | Standby replay |
| --- | --- | --- |
| **Payroll** | Scheduled employee transfers | Org B / escrow catch-up for missed slots |
| **Treasury** | Idle-balance sweeps / rebalances | Alternate wallet / route when primary miss |
| **Liquidation** | Health-factor watch → liquidate | Backup keeper workflow for missed opportunities |
| **Grants** | Vesting / milestone payouts | Standby payer for skipped unlock slots |
| **Settlement** | Batch netting / clearing windows | Replay unsettled windows without double-settle |

Same invariants everywhere: durable slot ids, grace before panic, capped replay, journal coverage, no double-pay.

## Example

See [`examples/continuity-guardian`](../../examples/continuity-guardian) for an inspect-only CLI that classifies slots from env/example JSON without writing or requiring secrets.

# Continuity Guardian (example)

Inspect-only demo that loads a `MissionPolicy` and classifies missed slots with `@ember/continuity-kit`.

**Default mode is read-only.** No KeeperHub calls, no chain writes, no secrets required.

## Quick start

```bash
# from repo root (after pnpm install)
pnpm --filter @ember/continuity-kit build
pnpm --filter @ember/example-continuity-guardian run setup
pnpm --filter @ember/example-continuity-guardian run doctor
pnpm --filter @ember/example-continuity-guardian inspect
```

Or:

```bash
cd examples/continuity-guardian
pnpm run setup && pnpm run doctor && pnpm inspect
```

## WRITE_MODE gate

| Mode | Env | Behavior |
| --- | --- | --- |
| **Inspect (default)** | `WRITE_MODE` unset / `0` | Classify + print plan only. Safe. No secrets. |
| **Write** | `WRITE_MODE=1` | Explicitly gated. This example **refuses** to execute writes and exits with guidance — production rescue stays in `services/sentinel`. |

Never set `WRITE_MODE=1` expecting this example to broadcast txs. It will not.

## Env (all optional for inspect)

See [`.env.example`](./.env.example). Copy to `.env` only if you want overrides — inspect runs without it.

| Variable | Default | Purpose |
| --- | --- | --- |
| `POLICY_PATH` | `policies/example-mission.policy.json` | MissionPolicy JSON |
| `EXPECTED_SLOTS` | sample cadence | Comma-separated expected slot ids |
| `CONFIRMED_SLOTS` | sample subset | Comma-separated confirmed slot ids |
| `JOURNAL_REPLAYS_JSON` | `[]` | Optional JSON array of `{slot,txHash}` journal replays |
| `WRITE_MODE` | `0` | Must stay `0` for inspect |

## Workflows

`workflows/` holds copies of the mainnet PAYDAY + Org B replay definitions:

- `w1-payday-stream.mainnet.json` ← `../../workflows/w1-payday-stream.mainnet.json`
- `w1-orgb-replay.mainnet.json` ← `../../workflows/w1-orgb-replay.mainnet.json`

Referenced for policy workflow ids only; inspect does not execute them.

## What this teaches

Reuse the same continuity loop for payroll, treasury, liquidation, grants, or settlement:

1. Validate policy  
2. Classify missed slots vs grace  
3. Plan capped standby replay  
4. Assert no double-pay against journal coverage  

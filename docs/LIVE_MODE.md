# Live mode vs demo

Four states — never blur them.

## 1. Local demo

| | |
| --- | --- |
| Secrets | None required |
| Money | Never |
| Data | Fixtures under `fixtures/dev/` |
| Label | **DEMO FIXTURE — NO REAL TRANSACTIONS** |

How: `pnpm setup` → `pnpm dev` with `DEVELOPMENT_MODE=1`.

## 2. Local KeeperHub test

| | |
| --- | --- |
| Secrets | Real `kh_` keys in `.env` |
| Money | Prefer testnet / smoke read path |
| Data | Live KeeperHub API |
| Label | Real integration test — still not “production write” |

How: fill `.env.example` keys; run smoke workflow `vewqfp44zmpa9dtctlrdr` before any USDC workflow.

## 3. Live observer

| | |
| --- | --- |
| Secrets | Production read path / BFF → Render |
| Money | No writes when `PAYDAY_ENABLE=0` |
| Data | Live health + often **CERTIFIED MAINNET SNAPSHOT** for payment story |
| Label | **LIVE OBSERVER** / **LIVE RUNTIME** |

Public UI: https://ember-web-seven.vercel.app/  
API: https://ember-api-8qzg.onrender.com/healthz

## 4. Live write

| | |
| --- | --- |
| Secrets | Explicit executor keys + confirmation |
| Money | Real USDC on Base |
| Data | Fresh executions |
| Label | Operational write — not for casual demos |

Requires human confirmation. Do not enable recurring schedules for screenshots.

## Provenance labels (product)

| Label | Meaning |
| --- | --- |
| DEMO FIXTURE | Local sample only |
| LIVE OBSERVER / LIVE RUNTIME | Talking to live APIs; writes may be off |
| CERTIFIED MAINNET SNAPSHOT | Frozen real history — not a fresh spend |

Never call a demo fixture “live.”  
Never display a certified snapshot as if it were a brand-new onchain event.

# Local development

Clone → install → setup → doctor → dev, with **no secrets** required for the default path.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 20 (24 recommended) | https://nodejs.org |
| pnpm | 10.x via Corepack | `corepack enable` |
| Git | recent | |
| Foundry / `forge` | optional locally | Required for Solidity CI |

### Platform notes

| OS | Tip |
| --- | --- |
| Windows | PowerShell or WSL2 both work; prefer WSL if Foundry path issues appear |
| macOS / Linux | Standard Node + Corepack |

## Zero to running (demo)

```bash
git clone https://github.com/mohamedwael201193/ember.git
cd ember
corepack enable
pnpm install
pnpm setup
pnpm doctor
pnpm dev
```

Open **http://127.0.0.1:5173**.

| Surface | URL |
| --- | --- |
| Frontend | http://127.0.0.1:5173 |
| BFF (typical) | http://127.0.0.1:8780 |
| Runtime | http://127.0.0.1:10000 |

## What each command does

| Command | Purpose |
| --- | --- |
| `pnpm setup` | Verifies Node/pnpm, ensures deps, creates runtime folders, copies `.env.example` → `.env` with `DEVELOPMENT_MODE=1` |
| `pnpm doctor` | Reports env / stack readiness |
| `pnpm dev` | Starts local stack (mock runtime + frontend in demo mode) |
| `pnpm test` / `pnpm build` | Unit gates / production builds |

## How you know you are in demo mode

- `.env` has `DEVELOPMENT_MODE=1` / `EMBER_DEV_MODE=1`  
- UI shows **DEMO FIXTURE** (or similar) — sample missions, not live spends  
- No KeeperHub `kh_` keys required  

Fixtures live under `fixtures/dev/`. They are **not** mainnet evidence.

## Modes

| Mode | How | Spend |
| --- | --- | --- |
| **1. Local demo** | Default after `pnpm setup` | Never |
| **2. Local KeeperHub test** | Fill `kh_` keys; prefer smoke / testnet | Real API; avoid mainnet writes |
| **3. Live observer** | Point at production APIs; writes gated | Reads only when `PAYDAY_ENABLE=0` |
| **4. Live write** | Explicit env + human confirmation | Real USDC |

See also [LIVE_MODE.md](./LIVE_MODE.md) if present, and root `.env.example`.

## Switching to real integration (optional)

1. Edit `.env`: set `DEVELOPMENT_MODE=0`  
2. Fill KeeperHub org keys and workflow IDs (placeholders in `.env.example`)  
3. Keep `SENTINEL_SHARED_SECRET` ≠ `PRIMARY_OBSERVER_SHARED_SECRET`  
4. `pnpm doctor` then `pnpm build` / `pnpm start`  

Never commit `.env`.

## Continuity guardian example

```bash
pnpm --filter @ember/example-continuity-guardian run setup
pnpm --filter @ember/example-continuity-guardian run doctor
pnpm --filter @ember/example-continuity-guardian inspect
```

Inspect-only by default.

## Avoid confusion

| Label | Meaning |
| --- | --- |
| DEMO FIXTURE | Local sample only |
| LIVE OBSERVER | Live APIs; may still show certified payment snapshots |
| CERTIFIED MAINNET SNAPSHOT | Frozen real history — not a fresh spend |

Do not present fixtures or snapshots as “just happened onchain.”

## Next

- MCP: [MCP_QUICKSTART.md](./MCP_QUICKSTART.md)  
- Two-org: [FULL_RECOVERY_SETUP.md](./FULL_RECOVERY_SETUP.md)  
- Demo filming: [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md)

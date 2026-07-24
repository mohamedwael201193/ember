# Local Setup

Anyone should be able to go from zero to a running EMBER stack without tribal knowledge.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | **≥ 20** (24 recommended) | [nodejs.org](https://nodejs.org) |
| pnpm | **10.x** (via Corepack) | Do not install a global random pnpm unless you must |
| Git | any recent | |
| Foundry | optional | Only for Solidity tests / deploys |

No global npm packages are required. No Cursor-only steps. No machine-specific paths.

## Zero to running (development mode)

```bash
git clone <your-fork-or-upstream-url> ember
cd ember
corepack enable
pnpm install
pnpm setup
pnpm doctor
pnpm dev
```

Then open:

| Surface | URL |
|---------|-----|
| Frontend | http://127.0.0.1:5173 |
| BFF health | http://127.0.0.1:8780/api/health |
| Runtime health | http://127.0.0.1:10000/healthz |
| Watcher heartbeat | `runtime/watcher/heartbeat.json` |

`pnpm setup` will:

1. Verify Node + pnpm
2. Ensure dependencies are installed
3. Create `runtime/`, `fixtures/dev/` journals folders
4. Copy `.env.example` → `.env` with **DEVELOPMENT_MODE=1**
5. Copy `frontend/.env.example` → `frontend/.env`
6. Run a soft `pnpm doctor`

Development mode uses sample missions, wallets, proofs, and rescue history under `fixtures/dev/`. It does **not** need real KeeperHub keys, Pinata JWT, or funded wallets.

## Live local mode (real credentials)

1. Copy `.env.example` → `.env` (or edit the file from `pnpm setup`)
2. Set `DEVELOPMENT_MODE=0`
3. Fill every non-optional live variable (see [README](./README.md#environment-variables) and `.env.example`)
4. Ensure `SENTINEL_SHARED_SECRET` ≠ `PRIMARY_OBSERVER_SHARED_SECRET`
5. Run:

```bash
pnpm doctor
pnpm build
pnpm start          # combined runtime on :10000
# other terminal
pnpm --filter @ember/frontend dev
```

Or with `DEVELOPMENT_MODE=0` already in `.env`:

```bash
pnpm dev
```

`pnpm dev` in live mode builds once if `services/*/dist` is missing, then starts the real runtime + frontend + watcher.

## Commands cheat sheet

| Command | Purpose |
|---------|---------|
| `pnpm setup` | First-run bootstrap |
| `pnpm doctor` | Full environment / stack report |
| `pnpm dev` | One-command local stack |
| `pnpm validate-env` | Strict live env schema check |
| `pnpm build` | Build all packages/services |
| `pnpm start` | Combined production-style runtime |
| `pnpm test` | Unit tests |
| `pnpm lint` | ESLint |

## Ports

| Port | Process |
|------|---------|
| 5173 | Vite frontend |
| 8780 | BFF |
| 10000 | Combined runtime (or mock runtime) |
| 8787 | Sentinel (child / direct) |
| 8788 | Primary Observer |
| 8789 | PAYDAY |

If a port is busy, `pnpm doctor` warns you. Stop the conflicting process or change the matching `*_PORT` / `PORT` / `BFF_PORT` in `.env`.

## Windows / macOS / Linux

All first-class scripts are Node ESM (`.mjs`). PowerShell chaos drills under `scripts/chaos/` are optional operator tools, not required for setup.

## Foundry (optional)

```bash
cd contracts
forge install   # if forge-std missing
forge test
forge fmt --check
```

Use your local Foundry install — never a hardcoded WSL path from another machine.

## Troubleshooting

See [README Troubleshooting](./README.md#troubleshooting) and run `pnpm doctor`.

# EMBER

EMBER keeps an onchain payment mission running when its primary agent dies.
PAYDAY invokes a real KeeperHub USDC workflow on Base Sepolia. Sentinel
reconciles KeeperHub runs with ERC-20 receipts, replays only unpaid slots from
an isolated standby organization, pins a canonical rescue proof to IPFS, and
anchors that proof in `Continuity.sol`.

## Current rehearsal

- Network: Base Sepolia (`84532`)
- Contract: `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770`
- Mission: `1`
- Canonical W1: `x08xy6zyy5ne5xkr93mtf`
- Standby replay W1': `igy0agkqtyzjrmxcz4rii`
- Proof CID: `Qmaq9qJ8KEcvR4yv8JitRXLwViDDdm5mnH8AkrMzrvzE6P`
- Proof anchor: `0xad0fe495639b4222cf80d25bbf434dccfa42f023cf145339afd9702d401ed87b`

Phase 10 is complete on Sepolia. Mainnet is prohibited until Phase 13 and
requires explicit human approval. KeeperHub HTTP/Code workflow nodes and the
paid Marketplace call remain externally gated; Sentinel self-polling and
direct HMAC rescue are the documented interim paths.

## Workspace

- `contracts/` — the single Solidity contract and Foundry tests
- `packages/mission-core` — schedule, HMAC, canonical proof, IPFS, and runtime primitives
- `packages/kh-client` — typed KeeperHub REST boundary using Bearer auth
- `packages/receipt-checker` — receipt and USDC `Transfer` verification
- `services/payday` — slot-keyed W1 invoker with durable journal
- `services/primary-observer` — isolated, read-only Org A execution relay
- `services/sentinel` — detection, replay, recovery, and proof orchestration
- `workflows/` — the three canonical KeeperHub workflow artifacts
- `render.yaml` — native Node 24 Render Blueprint

## Local validation

Requirements: Node 24, pnpm 10, and Foundry in WSL2.

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
wsl -e bash -lc "cd /mnt/d/route/EMBER/contracts && ~/.foundry/bin/forge fmt --check && ~/.foundry/bin/forge test"
```

Copy `.env.example` to `.env` and provide real values locally. `.env` is
gitignored. KeeperHub REST and MCP authentication is always:

```http
Authorization: Bearer kh_xxxxxxxxx
```

Never use `X-API-Key`, never expose a `kh_` key to a browser, and never place
Org A credentials in Sentinel.

## Operations

All services expose `/healthz`, `/readyz`, and `/metrics`. Protected control
routes use timestamped HMAC requests with nonce replay prevention. PAYDAY's
optional `/run-once` route is disabled unless `PAYDAY_CONTROL_TOKEN` is set and
then requires an exact Bearer token.

Use `docs/RUNBOOK.md` for local process-kill chaos and Render deployment.
Architecture and trust boundaries are in `ARCHITECTURE.md`; real rehearsal
artifacts are indexed under `docs/evidence/`.

No database is required. Durable append-only files on Render persistent disks
are sufficient for the current single-instance PAYDAY and Sentinel design.

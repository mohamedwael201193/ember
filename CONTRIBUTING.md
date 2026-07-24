# Contributing

Thanks for helping make EMBER production-grade open source.

## Ground rules

1. **No secrets in git** — `.env`, `kh_` keys, HMAC secrets, private keys, Pinata JWTs  
2. **No browser secrets** — BFF only; never `VITE_` for KeeperHub/HMAC  
3. **Trust boundaries** — Org A keys never in Sentinel; Org B keys never in PAYDAY/Observer  
4. **Mainnet is explicit** — no implicit mainnet selection; human approval for spend  

## Developer setup

Follow [`LOCAL_SETUP.md`](./LOCAL_SETUP.md):

```bash
pnpm install
pnpm setup
pnpm doctor
pnpm dev
```

## Workflow

1. Fork + branch from `main`  
2. Make focused changes  
3. Run checks:

```bash
pnpm doctor
pnpm lint
pnpm typecheck
pnpm test
pnpm validate-env   # live mode only
```

4. Update docs when you change env vars, ports, or public APIs  
5. Open a PR with: summary, test plan, screenshots if UI changed  

## Package map

| Path | Responsibility |
|------|----------------|
| `packages/mission-core` | schedule, HMAC, proof, env schemas |
| `packages/kh-client` | KeeperHub REST/MCP boundary |
| `packages/receipt-checker` | USDC receipt verification |
| `services/payday` | slot invoker |
| `services/primary-observer` | Org A relay |
| `services/sentinel` | detect / replay / proof |
| `frontend` | product UI + BFF |
| `contracts` | `Continuity.sol` |
| `scripts` | setup, doctor, runtime, deploy helpers |

## Adding environment variables

1. Add to root `.env.example` (and `frontend/.env.example` if BFF needs it)  
2. Document in README + `LOCAL_SETUP.md`  
3. Teach `scripts/doctor.mjs` how to check it  
4. If required for live services, extend Zod schemas in `packages/mission-core`  

## UI contributions

- Prefer the existing design tokens (`frontend/DESIGN.md`)  
- Keep the first viewport brand-led; avoid dashboard-in-hero clutter  
- Exercise flows against `DEVELOPMENT_MODE=1` before requesting live keys  

## Commit style

Prefer short imperative subjects focused on why:

```
Add pnpm doctor checks for development fixtures
Fix BFF snapshot fallback when runtime is down
```

## Code of conduct

Be respectful. Assume good intent. No harassment. Maintainers may close hostile or secret-leaking PRs immediately.

## License

By contributing, you agree your contributions are licensed under the MIT License (`LICENSE`).

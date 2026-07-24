# `@ember/frontend`

Product UI + local BFF for EMBER.

## Quick start (from repo root)

```bash
pnpm setup
pnpm dev
```

Open http://127.0.0.1:5173

Full project docs: [`../README.md`](../README.md), [`../LOCAL_SETUP.md`](../LOCAL_SETUP.md).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Vite `:5173` + BFF `:8780` |
| `pnpm build` | Production static build |
| `pnpm start:bff` | BFF only |

## Env

See `.env.example`. Secrets stay on the BFF / Vercel serverless — never `VITE_`.

## Design

See `DESIGN.md` and root `docs/FRONTEND_SPEC.md`.

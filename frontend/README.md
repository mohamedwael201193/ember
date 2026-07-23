# EMBER Frontend

Premium React product UI for EMBER continuity.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS v4
- Motion + GSAP ScrollTrigger + Lenis
- TanStack Query + React Router
- Lucide icons

## Architecture

Browser → Vite (`/api/*`) → **BFF** (`server/bff.ts`) → Render runtime

HMAC secrets (`SENTINEL_SHARED_SECRET`, `PRIMARY_OBSERVER_SHARED_SECRET`) stay in the BFF.
The browser never signs Sentinel/Observer requests.

## Run

From repo root (loads `.env` via BFF):

```bash
pnpm --filter @ember/frontend install
pnpm --filter @ember/frontend dev
```

- Product: http://localhost:5173/
- App: http://localhost:5173/app
- BFF: http://127.0.0.1:8780

Required env (repo `.env` / see `.env.example`):

- `EMBER_RUNTIME_URL` (default `https://ember-api-8qzg.onrender.com`)
- `SENTINEL_SHARED_SECRET`
- `PRIMARY_OBSERVER_SHARED_SECRET`
- `EMBER_NETWORK`

## Deploy to Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Other** (uses `vercel.json`).
4. Add Environment Variables from `frontend/.env.example` (Production + Preview):
   - `EMBER_RUNTIME_URL`
   - `EMBER_NETWORK=mainnet`
   - `SENTINEL_SHARED_SECRET`
   - `PRIMARY_OBSERVER_SHARED_SECRET`
   - Continuity / workflow IDs as needed
5. Deploy.

SPA routes rewrite to `index.html`. `/api/*` is handled by serverless BFF (`api/[...path].ts`) using the same HMAC proxy as local `server/bff.ts`.

```bash
# Optional CLI
cd frontend
npx vercel
```

## Routes

| Path | Surface |
|------|---------|
| `/` | Cinematic landing (scroll story + original SVGs) |
| `/app` | Living console |
| `/app/mission/new` | Guided mission builder |
| `/app/mission` | Mission topology |
| `/app/executions` | PAYDAY calendar |
| `/app/rescues` | Rescue pipeline |
| `/app/proofs` | Visual proof chain |
| `/app/operations` | Ops status map |

## Design

See `frontend/DESIGN.md` and root `DESIGN.md`.

Inspiration language only: contentarchitecture.dev (split hero, large type, scroll chapters).
Not a copy. Hand-crafted SVG illustrations in `src/components/svg/SvgScene.tsx`.

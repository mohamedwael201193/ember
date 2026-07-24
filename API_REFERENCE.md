# API Reference

EMBER exposes three HTTP layers:

1. **Runtime** (Render / `pnpm start` / mock runtime) — public health + HMAC control routes  
2. **BFF** (local `:8780` or Vercel `/api/*`) — browser-safe proxy that signs HMAC server-side  
3. **KeeperHub** — external REST/MCP with `Authorization: Bearer kh_…`

OpenAPI fragment for Observer/Sentinel control routes: [`docs/openapi/ember-services.openapi.yaml`](./docs/openapi/ember-services.openapi.yaml)

---

## Runtime (combined process)

Default base: `http://127.0.0.1:10000` locally, or your Render URL.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/healthz` | none | Liveness + child process flags |
| GET | `/readyz` | none | Readiness |
| GET | `/status` | none | Mission status summary |
| GET | `/metrics` | none | Prometheus text |
| POST | `/check` | Sentinel HMAC | Mission health check |
| POST | `/rescue` | Sentinel HMAC | Trigger / resume rescue |
| GET | `/v1/executions` | Observer HMAC | Org A execution relay |
| * | `/observer/*` | proxied | Observer child |
| * | `/payday/*` | proxied | PAYDAY child |

### HMAC headers

```
content-type: application/json
x-ember-timestamp: <ms epoch>
x-ember-nonce: <hex>
x-ember-body-sha256: <hex sha256 of raw body>
x-ember-signature: <hex hmac-sha256 of `${timestamp}.${nonce}.${bodySha256}`>
```

Secrets:

- Sentinel routes → `SENTINEL_SHARED_SECRET`
- Observer routes → `PRIMARY_OBSERVER_SHARED_SECRET`

Clock skew tolerance: `CLOCK_SKEW_SECONDS` (default 60). Nonces are replay-protected in-process.

---

## BFF (browser → server)

Base (local): `http://127.0.0.1:8780`  
Base (prod): `https://<vercel-host>`

Vite proxies `/api/*` to the BFF in local dev.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | BFF + upstream runtime health |
| GET | `/api/ready` | Upstream readyz |
| GET | `/api/config` | Public mission config (no secrets) |
| GET | `/api/status` | Upstream status |
| GET | `/api/snapshot` | Aggregated dashboard payload |
| GET | `/api/evidence/mainnet` | Bundled / sample evidence |
| POST | `/api/check` | Signed proxy to `/check` |
| POST | `/api/rescue` | Signed proxy to `/rescue` |
| GET | `/api/executions` | Signed proxy to `/v1/executions` |
| GET | `/api/ping` | Vercel smoke test |

In `DEVELOPMENT_MODE=1`, snapshot/evidence/check/rescue are served from `fixtures/dev/*` via the mock runtime.

### Example

```bash
curl -s http://127.0.0.1:8780/api/health | jq
curl -s http://127.0.0.1:8780/api/config | jq
curl -s http://127.0.0.1:5173/api/snapshot | jq   # via Vite proxy
```

---

## KeeperHub

Not hosted by this repo. Client: `packages/kh-client`.

```http
Authorization: Bearer kh_xxxxxxxxx
```

Never send `X-API-Key`. Never expose `kh_` material to the browser.

MCP bridge examples: [`MCP_GUIDE.md`](./MCP_GUIDE.md)

---

## Error shapes

```json
{ "error": "not_found", "path": "/api/unknown" }
```

```json
{ "error": "SENTINEL_SHARED_SECRET missing in BFF env" }
```

HMAC / upstream failures return the upstream JSON body and status when available.

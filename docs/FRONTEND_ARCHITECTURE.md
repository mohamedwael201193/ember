# Frontend architecture boundary

No frontend is implemented in this backend repository. A future operator UI should consume a versioned API rather than service internals.

## API and DTOs

- `GET /healthz` exposes only `{ ok: true, service }`.
- `GET /v1/missions/{missionId}` should return mission configuration, current health state, and latest anchored proof metadata.
- `GET /v1/missions/{missionId}/rescues` should return append-only rescue summaries, including slot ranges, fee mode, proof CID, and transaction references.
- `GET /v1/missions/{missionId}/events` should use SSE with an event ID for reconnect and ordered state transitions.

DTOs must use explicit discriminated unions for health state and fee mode. Secret values, KeeperHub API keys, raw HMAC headers, and private workflow configuration are never API DTO fields.

## UX flows

1. An operator opens a mission overview and sees the last receipt-valid slot and current state.
2. Selecting a rescue shows the canonical proof hash, fetched CID status, fee mode, and replay receipt references.
3. A degraded mission displays candidate missed slots distinctly from receipt-verified unpaid slots.
4. A rescue action requires a server-side authorization boundary and presents its immutable fee mode before execution.

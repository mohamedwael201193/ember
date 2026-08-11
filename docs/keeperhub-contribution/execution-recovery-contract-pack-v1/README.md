# Execution Recovery Contract Pack v1

Proposed contribution toward [`KeeperHub/cli` #53](https://github.com/KeeperHub/cli/issues/53) (public JSON fixture suite).

**Not** a fork of [`KeeperHub/cli` #95](https://github.com/KeeperHub/cli/pull/95) (`--require-verified`). This pack teaches adapters how to interpret execution status envelopes before/while that CLI gate lands.

## Layout

```text
fixtures/          # golden JSON responses (neutral IDs)
contract.test.ts   # consumer contract tests (TypeScript reference)
contract.md        # normative recovery rules
UPSTREAM_PR.md     # draft notes for a KeeperHub/cli PR
```

## Normative rules (summary)

1. **Unconfirmed** → poll the same execution ID; do not create a new write.
2. **Completed without chain evidence** → fail closed when a receipt is required.
3. **Write retry** → reuse a stable idempotency key.
4. **Reverted / failed** → terminal failure; do not treat as paid.
5. **429** → backoff; preserve idempotency key on later retry.
6. **Malformed** → fail closed; do not guess success.

See `contract.md` for full wording.

## Local verification

From repo root (after `pnpm install`):

```bash
pnpm exec vitest run docs/keeperhub-contribution/execution-recovery-contract-pack-v1/contract.test.ts
```

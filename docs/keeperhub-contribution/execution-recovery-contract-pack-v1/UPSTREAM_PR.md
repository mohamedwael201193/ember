# Upstream PR draft — KeeperHub/cli

Target: [`KeeperHub/cli` issue #53](https://github.com/KeeperHub/cli/issues/53)  
Avoid overlap: [`KeeperHub/cli` PR #95](https://github.com/KeeperHub/cli/pull/95) (receipt `--require-verified`)

## Suggested title

`test(fixtures): add execution recovery contract pack v1`

## Suggested body

```md
## Summary
- Adds a versioned JSON fixture suite for execution status envelopes (queued, completed±tx, failed, unconfirmed, reverted, not_found, 429, cold start, malformed).
- Documents recovery rules: poll unconfirmed without resubmit; fail closed without chain evidence; stable idempotency keys on write retry.
- Complements #53 Option B. Does not implement CLI `--require-verified` (see #95).

## Test plan
- [ ] `go test` for fixture load + decision table (port from EMBER TypeScript reference)
- [ ] `gofmt` / `go vet` clean
- [ ] Confirm fixture IDs are synthetic and labeled as DEMO FIXTURE / contract fixtures
```

## Port note

EMBER ships a TypeScript reference consumer in this folder (`contract.test.ts`). Upstream should prefer Go tests under `testdata/execution_recovery_v1/` matching the same filenames and rules in `contract.md`.

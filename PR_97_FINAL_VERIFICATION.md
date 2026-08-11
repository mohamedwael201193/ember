# PR #97 Final Verification

Date: 2026-08-11  
PR: https://github.com/KeeperHub/cli/pull/97  
Head: `3505b09`  
Reviewer: @suisuss (CHANGES_REQUESTED on prior commit `6ae2087`)  
Review response: https://github.com/KeeperHub/cli/pull/97#pullrequestreview-4911164736

## CURRENT TRUTH

| Claim | Truth |
| --- | --- |
| Reviewer findings addressed in code | YES — pushed in `3505b09` |
| Local `go test ./internal/execrecovery ./cmd/execute` | PASS |
| GitHub review state | Still **CHANGES_REQUESTED** (no new approval yet) |
| Merged | **NO** |
| Approved | **NO** |
| CI `check-issue-link` | **FAIL** — issue #53 lacks `accepted` label |
| CI unit workflow | **action_required** — first-time contributor; needs maintainer approval to run |
| Mergeable | UNKNOWN / blocked by checks |

## Reviewer findings → fixes

| Reviewer finding | Fixed? | Code | Test | Verified |
| --- | --- | --- | --- | --- |
| A) Fixtures decode to empty struct | YES | Flat `response.executionId` fixtures; `internal/execrecovery` | `TestFixtures_DecodeIntoDirectStatus` | Local PASS |
| B) reverted classified as success | YES | R2 + `execOutcomeError` | `TestRevertedIsNeverSuccess`, `TestTransferCmd_WaitFailsOnRevertedReceipt` | Local PASS |
| C) POST retry without idempotency | YES | `Idempotency-Key` set once before `Do` on transfer/cc | `TestTransferCmd_IdempotencyKeyStableAcrossHTTPRetries` | Local PASS |
| D) not_found aborts wait | YES | poll/watch tolerate 404 until deadline | `TestTransferCmd_WaitToleratesInitialNotFound` | Local PASS |
| E) Status vocabulary inconsistency | YES | `vocabulary.go` + contract.md table | `TestVocabularySurfacesAreDistinct` | Local PASS |
| F) cold_start not R6 | YES | `cold_start.sequence.json` 404→pending→success | `TestColdStartSequence_R6` | Local PASS |
| G) malformed is valid JSON | YES | `responseRaw` non-JSON | `TestFixtures_ClassifyTable` / malformed | Local PASS |
| H) UTF-8 BOM README | YES | Removed `README_EXECUTION_RECOVERY.md` | N/A | File deleted |
| I) Docs not in sync path | YES | `docs/execution-recovery.md` + sync workflow list | Workflow file updated | Code review |
| J) Need loader/table tests | YES | Chose option (b) | `go test ./internal/execrecovery/...` | Local PASS |

## Commands executed (local)

```text
go test ./internal/execrecovery/ ./cmd/execute/ -count=1   # PASS
go generate ./docs/
go build -o bin/kh.exe ./cmd/kh
go vet ./...
go test ./...   # doctor/agentic FAIL on Windows keyring — also FAIL on clean upstream checkout; unrelated
```

`-race` requires CGO on this Windows host; not run here. Linux CI would run `make test` with race once workflow is approved.

## Official docs used

- https://docs.keeperhub.com/api/direct-execution (Idempotency-Key, receipts authoritative)
- https://docs.keeperhub.com/api/executions
- https://docs.keeperhub.com/cli/quickstart
- Current `cmd/execute/status.go`, `transfer.go`, `internal/http/client.go`, PR #95 receipts shape

## Remaining blockers (external)

1. Maintainer adds `accepted` to https://github.com/KeeperHub/cli/issues/53 **or** `no-issue-required` on the PR.
2. Maintainer approves first-time contributor CI workflow run.
3. Maintainer re-reviews and clears **Changes requested**.

## EMBER compatibility

- Render `/healthz` ok
- Vercel evidence `CERTIFIED MAINNET SNAPSHOT`
- MCP `list_workflows` still returns W1 `5goaid2zjgzyb32661se3`
- No mainnet spend performed
- Semantic alignment: EMBER already treats receipts/tx as proof; CLI now matches official receipt rules for reverted

## What we did NOT claim

- Not merged
- Not approved
- Not CI-green on GitHub
- Not production-accepted by KeeperHub maintainers

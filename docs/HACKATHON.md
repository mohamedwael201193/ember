# Hackathon alignment (DoraHacks Agents Onchain / KeeperHub)

Hackathon page: https://dorahacks.io/hackathon/agents-onchain/detail

## One-line mapping

**Agent decides → KeeperHub executes → EMBER preserves continuity.**

## Criteria map

| Theme | EMBER evidence |
| --- | --- |
| **Execution** | Real KeeperHub workflows; Base USDC txs via KH Runs |
| **KeeperHub surfaces** | MCP, workflow builder, Runs, execution APIs |
| **Reliability** | Missed-invocation detection, Org B replay, journal, proof, anchor |
| **Originality** | Continuity when the slot was **never requested** (not only retry of failed requested runs) |
| **DX** | Clone → `pnpm setup` → `pnpm doctor` → `pnpm dev`; MCP quickstarts + copy-paste prompts |
| **Contribution** | KeeperHub CLI PR targeting issue #53 — verify live status |

## Contribution truth (check live)

- PR: https://github.com/KeeperHub/cli/pull/97  
- Issue: https://github.com/KeeperHub/cli/issues/53  

As of the last DX pass verification: **OPEN**, review decision **CHANGES_REQUESTED**, **not merged**. Re-check before any “merged” claim.

## Demo

- Runbook: [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md)  
- Checklist: [FINAL_FILMING_CHECKLIST.md](./FINAL_FILMING_CHECKLIST.md)  
- Submission notes: [../SUBMISSION.md](../SUBMISSION.md)

## Do not claim

- Fake Tempo features EMBER does not use  
- CI green if GitHub Actions is not actually green  
- Merged upstream PR without GitHub `mergedAt`  
- Fresh mainnet spend when showing certified snapshots

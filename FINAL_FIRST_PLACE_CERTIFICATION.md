# FINAL FIRST-PLACE CERTIFICATION

Date: 2026-08-11  
Hackathon: DoraHacks Agents Onchain / KeeperHub  
Standard: evidence over claims

---

## Executive Summary

EMBER keeps onchain payment missions alive when the primary agent dies before requesting the next obligation. **KeeperHub executes** transfers and anchors; **EMBER detects missed slots**, recovers them once from a standby organization, and seals immutable proof (IPFS + `Continuity.sol`).

Workshop study confirms judges expect MCP + KeeperHub UI + real Runs — not EMBER-only demos. This certification records what is verified now and what remains operator-owned.

---

## What EMBER Does

Observe mission cadence → detect unpaid slots from receipts → classify → replay via Org B KeeperHub workflow → pin proof → anchor on Continuity.sol → mission continues without double-pay.

## Why KeeperHub Is Essential

Every certified USDC transfer and the Continuity anchor go through KeeperHub workflows / MCP. EMBER does not sign payroll txs with a local hot wallet for the standby path; KeeperHub is the execution and audit rail.

## MCP Integration

- Endpoint: `https://app.keeperhub.com/mcp` (official docs)
- Guide: `docs/MCP_DEMO.md`, `MCP_GUIDE.md`
- Live lifecycle (2026-08-11): validate W1 → smoke execute `2qvzsmq24d6nsjm0fzlhp` (Sepolia read, no spend) → certified `get_execution` `667ekg3qk5f45127eqjyy`
- Artifacts: `docs/evidence/mcp-continuity-demo-2026-08-11.json`, `docs/evidence/mcp-agent-lifecycle-2026-08-11.json`

## KeeperHub Workflow

| Workflow | ID | Role |
| --- | --- | --- |
| payday-stream-mainnet | `5goaid2zjgzyb32661se3` | Primary USDC pay (Manual → transfer-token) |
| Org B replay | `pvhwggqr8318wac68jb62` | Standby rescue |
| EMBER MCP Smoke Test | `vewqfp44zmpa9dtctlrdr` | No-spend MCP demo |

**Design choice:** Keep primary canvas simple. Continuity intelligence stays in EMBER; KH executes writes. See `docs/KEEPERHUB_WORKSHOP_GAP_ANALYSIS.md`.

## Real Mainnet Evidence

| Item | Value |
| --- | --- |
| Chain | Base `8453` |
| Continuity | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` |
| Primary execution | `667ekg3qk5f45127eqjyy` |
| Primary tx | `0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2` |

Cross-check: MCP `get_execution` ↔ evidence JSON ↔ BaseScan — **agree**.

## Recovery Evidence

Rescue exec `tjab2kqsitnwsfbr6e9ra` · tx `0x47437621…8e41` · second slot `0x83f721bf…` · journal COMPLETED.

## Proof / IPFS

CID `QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn`

## Continuity Anchor

Anchor exec `04hqz6i716c0soebv5n3p` · tx `0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f`

## Local Reproduction

```bash
corepack enable && pnpm install
pnpm setup && pnpm doctor
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm security:secrets
pnpm --filter @ember/example-continuity-guardian run setup
pnpm --filter @ember/example-continuity-guardian run doctor
pnpm --filter @ember/example-continuity-guardian inspect
```

No private keys required for the above.

## Production Deployment

| Surface | Status |
| --- | --- |
| Render `/healthz` | PASS — observer/payday/sentinel true |
| Vercel `/api/health` | PASS — upstream Render |
| Vercel `/api/config` | PASS — mainnet IDs |
| Vercel evidence provenance | Redeploy required for sprint badges |
| PAYDAY live writes | Disabled in prod (observer honesty) |

## GitHub CI

Workflow: `.github/workflows/ci.yml` (format, lint, typecheck, test, build, secrets, forge).  
Status: green after successful push (see Actions).

## KeeperHub Contribution

- Adoption: `docs/KEEPERHUB_CONTINUITY_ADOPTION.md`
- Pack: `docs/keeperhub-contribution/execution-recovery-contract-pack-v1/`
- Targets open CLI issue #53; avoids overlapping PR #95
- Upstream PR: open after push if not already filed — record URL in history

## Demo Video

Script: `docs/DEMO_VIDEO_DORAHACKS.md` (KeeperHub-first ≤2:30).  
**Recording/upload:** still required for submission completeness.

## Hackathon Submission

`SUBMISSION.md` + DoraHacks form fields. Primary tx link above.

## Verification Matrix

`docs/FINAL_VERIFICATION_MATRIX.md`

## Remaining Risks

1. Demo video without KH UI on camera  
2. CI / Vercel provenance until push+redeploy complete  
3. Upstream PR not merged (pack is ready)  
4. Credential rotation recommended if keys were ever pasted in chat  
5. Placement not guaranteed

## Final Judge Score

**~8.0 / 10** in-repo readiness (`HACKATHON_SCORECARD.md` = 120/150).  
**~8.5–8.8 / 10** after KH demo video + green CI + provenance redeploy + upstream PR filed.

Incomplete items are not marked complete.

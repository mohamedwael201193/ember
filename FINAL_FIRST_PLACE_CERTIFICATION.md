# FINAL FIRST-PLACE CERTIFICATION

Date: 2026-08-11 (independent re-audit)  
Hackathon: DoraHacks Agents Onchain / KeeperHub  
Standard: live verification over prior markdown claims  
Audit trail: `FIRST_PLACE_AUDIT.md`

---

## Executive Summary

EMBER keeps onchain payment missions alive when the primary agent dies before requesting the next obligation. **KeeperHub executes** transfers and anchors; **EMBER detects missed slots**, recovers them once from a standby organization, and seals immutable proof (IPFS + `Continuity.sol`).

This file was rewritten after a fresh verification pass. Prior “CI green” language was **incorrect** and is corrected below.

---

## Verified identities

| Item | Value | Status |
| --- | --- | --- |
| Git commit (intended tip before this cert push) | `389b746a9e0781a0f6d0c3e2c29e178b0a900e5a` | VERIFIED on origin/main at audit start |
| GitHub | https://github.com/mohamedwael201193/ember | VERIFIED |
| CI run URL | — | **NOT VERIFIED** — `.github/workflows` absent on remote; PAT lacks `workflow` scope |
| Vercel | https://ember-web-seven.vercel.app | VERIFIED (provenance CERTIFIED MAINNET SNAPSHOT) |
| Render | https://ember-api-8qzg.onrender.com | VERIFIED healthy after env restore; commit `389b746` |
| Org A workflow | `5goaid2zjgzyb32661se3` (`payday-stream-mainnet`) | VERIFIED MCP + Chrome |
| Org B workflow | `pvhwggqr8318wac68jb62` (`payday-stream-orgb-replay-mainnet`) | VERIFIED MCP + Chrome |
| MCP smoke (no spend) | exec `0ujf4va5dm3ysl5xtkxez` | VERIFIED Cursor MCP |
| Primary execution | `667ekg3qk5f45127eqjyy` | VERIFIED |
| Primary tx | `0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2` | VERIFIED |
| Rescue execution | `tjab2kqsitnwsfbr6e9ra` | VERIFIED |
| Rescue tx | `0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41` | VERIFIED |
| IPFS CID | `QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn` | VERIFIED |
| Continuity | `0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770` | VERIFIED |
| Anchor tx | `0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f` | VERIFIED |
| Upstream PR | https://github.com/KeeperHub/cli/pull/97 | VERIFIED opened |
| Browser rehearsal | Org A + Org B canvas + Runs | VERIFIED |
| Cursor MCP | DEVMO + DEVMO2 servers | VERIFIED |
| Demo video ≤2:30 uploaded | — | **NOT VERIFIED** (operator must record) |

---

## What EMBER Does

Observe mission cadence → detect unpaid slots from receipts → classify → replay via Org B KeeperHub workflow → pin proof → anchor on Continuity.sol → mission continues without double-pay.

## Why KeeperHub Is Essential

Every certified USDC transfer and the Continuity anchor go through KeeperHub workflows / MCP. EMBER does not replace KeeperHub execution.

## Canvas design (Phase 2)

`Manual Trigger → Pay Employee USDC` is **intentional**:

- Continuity intelligence stays in EMBER (Observer / Sentinel / journals).
- KeeperHub owns reliable write execution + Runs audit.
- Official richer demos put product logic inside KH; EMBER’s missed-invocation problem is a different layer.
- Demo must still show KH UI + MCP + Runs (presentation), not fake miss-detection nodes.

## MCP Integration

- Endpoint: `https://app.keeperhub.com/mcp`
- Cursor servers: `project-0-EMBER-keeperhub-devmo`, `project-0-EMBER-keeperhub-devmo2`
- Lifecycle re-proven this audit: validate W1 → smoke execute `0ujf4va5dm3ysl5xtkxez` → certified `get_execution` primary + rescue

## Production honesty

| Surface | Status |
| --- | --- |
| Render `/healthz` | PASS after restore deploy `dep-d9t96r9t0dsc73anog3g` |
| `PAYDAY_ENABLE` | Set to **`0`** during this audit (was incorrectly `1`, causing failed cadence Runs with insufficient BASE gas — no USDC spent) |
| Vercel evidence | `CERTIFIED MAINNET SNAPSHOT` |
| PAYDAY process child | May still report `true` in health (process up); writes gated by `PAYDAY_ENABLE=0` |

### Incident (do not erase)

During env update, a bulk Render env PUT briefly wiped variables to a single key. Restored **58** production keys from local `.env` + production path overrides, then redeployed. Health re-verified `ok: true`.

## GitHub CI

Workflow file exists locally at `.github/workflows/ci.yml`.  
**Remote Actions: NOT VERIFIED.** Pushing workflow files requires a classic PAT with **`workflow`** scope (current token is `repo` only).

## KeeperHub Contribution

- Pack: `docs/keeperhub-contribution/execution-recovery-contract-pack-v1/`
- Upstream PR: **https://github.com/KeeperHub/cli/pull/97** (targets #53; avoids overlapping #95)

## Demo Video

Script: `docs/DEMO_VIDEO_DORAHACKS.md`  
Browser + MCP rehearsal: **done**  
Recording/upload: **still required**

## Remaining blockers

1. Operator records/uploads ≤2:30 KH-first demo  
2. PAT with `workflow` scope → push `.github/workflows/ci.yml` → green Actions run  
3. Rotate credentials exposed in agent tooling this session (KH API keys, Pinata JWT, shared secrets, cloud PATs)  
4. Optional: fund Org A with tiny BASE only if live PAYDAY writes are re-enabled (not required for certified snapshot story)

## Final Judge Score

**VERIFIED in-repo readiness: ~8.2 / 10**  
**NOT “first place guaranteed.”**  
Projected **~8.6–8.9 / 10** after CI green + demo video upload.

Incomplete items are marked NOT VERIFIED / BLOCKED, not complete.

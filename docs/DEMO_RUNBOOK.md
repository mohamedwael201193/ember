# Demo runbook (filming)

Operator runbook for a reproducible ≤2:30 hackathon demo.

**Thesis on camera:** Agent decides → KeeperHub executes → EMBER preserves continuity.

## Preflight

- [ ] Cursor open on EMBER repo  
- [ ] MCP: `keeperhub-org-a` connected (and `keeperhub-org-b` ready)  
- [ ] No secrets visible in editor / terminal / browser  
- [ ] Production payroll schedules **disabled**  
- [ ] Prefer **no new mainnet spend** — use certified evidence for payment story  
- [ ] Tabs prepared (below)

## Browser tabs

| # | Tab | Org | Purpose |
| --- | --- | --- | --- |
| 1 | Cursor | — | MCP inspect / validate / smoke |
| 2 | KeeperHub primary canvas | **A** | `payday-stream-mainnet` |
| 3 | KeeperHub Runs (primary) | **A** | execution history |
| 4 | KeeperHub replay canvas | **B** | standby rescue workflow |
| 5 | EMBER Mission / Rescue / Proof | — | https://ember-web-seven.vercel.app |
| 6 | BaseScan primary tx | — | certified primary payment |
| 7 | IPFS proof CID | — | continuity proof |

### IDs

| Role | ID |
| --- | --- |
| Org A primary WF | `5goaid2zjgzyb32661se3` |
| Org B replay WF | `pvhwggqr8318wac68jb62` |
| Smoke (no spend) | `vewqfp44zmpa9dtctlrdr` |
| Certified primary exec | `667ekg3qk5f45127eqjyy` |
| Certified primary tx | `0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2` |
| Certified rescue tx | `0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41` |
| Proof CID | `QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn` |
| Anchor tx | `0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f` |

## Exact click / speak order

1. **Cursor** — “Agent decides”  
2. **MCP** — `tools_documentation` / list workflows (Org A)  
3. **Inspect** — `get_workflow` on primary ID  
4. **Validate** — `validate_workflow` → valid  
5. **KeeperHub canvas (Org A)** — Manual → Pay Employee USDC  
6. **Run / Runs (Org A)** — show certified execution or fresh **smoke** only  
7. **BaseScan** — primary USDC tx (certified)  
8. **EMBER Mission** — continuity product surface  
9. **Rescue** — miss → Org B replay narrative (show **Org B** canvas)  
10. **Proof** — IPFS + Continuity anchor  
11. **Closing line:** “KeeperHub executes. EMBER keeps the mission alive.”

## Org discipline

| Beat | Show |
| --- | --- |
| Primary payment | **Org A** only |
| Rescue replay | **Org B** only |
| MCP smoke | **Org A** smoke workflow |

Do not accidentally record the wrong organization.

## Safe live MCP (optional on camera)

Execute smoke `vewqfp44zmpa9dtctlrdr` only → `get_execution` → match Runs UI.  
No USDC transfer.

## Do not during filming

- Enable recurring schedules  
- Run primary / replay mainnet “for a fresh screenshot” unless pre-approved  
- Flash `.env` or API keys  
- Call DEMO FIXTURE “live”  
- Claim PR merged unless GitHub shows merged

## Related

- [FINAL_FILMING_CHECKLIST.md](./FINAL_FILMING_CHECKLIST.md)  
- [DEMO_VIDEO_DORAHACKS.md](./DEMO_VIDEO_DORAHACKS.md)  
- [AGENT_PROMPTS.md](./AGENT_PROMPTS.md)

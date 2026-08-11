# DoraHacks demo video — Agents Onchain (canonical ≤2:30)

Judges must see **KeeperHub executing**, not only EMBER + BaseScan.

Live product: https://ember-web-seven.vercel.app  
Repo: https://github.com/mohamedwael201193/ember  
MCP setup: [`MCP_DEMO.md`](./MCP_DEMO.md)  
Workshop gap: [`KEEPERHUB_WORKSHOP_GAP_ANALYSIS.md`](./KEEPERHUB_WORKSHOP_GAP_ANALYSIS.md)

**Target: 2:20–2:30.** Every visible ID must match across MCP, KeeperHub, EMBER, BaseScan, proof, anchor.

---

## Identity lock

| Surface | Value |
| --- | --- |
| Primary workflow | `5goaid2zjgzyb32661se3` |
| Primary execution | `667ekg3qk5f45127eqjyy` |
| Primary tx | `0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2` |
| Smoke workflow (no spend) | `vewqfp44zmpa9dtctlrdr` |
| Smoke execution (live MCP) | `2qvzsmq24d6nsjm0fzlhp` |
| Standby workflow | `pvhwggqr8318wac68jb62` |
| Rescue execution | `tjab2kqsitnwsfbr6e9ra` |
| Rescue tx | `0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41` |
| Proof CID | `QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn` |
| Anchor tx | `0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f` |

---

## Beat sheet (KeeperHub-first)

### 0:00–0:15 — Problem

> “AI payroll agents can decide to pay, but a missed execution can silently break the mission.”

### 0:15–0:35 — KeeperHub MCP

Show Cursor/Claude connected to `https://app.keeperhub.com/mcp`.  
Agent: `list_workflows` / `get_workflow` / `validate_workflow` on payday-stream-mainnet.

### 0:35–0:55 — KeeperHub workflow + Run

Canvas: Manual Trigger → Pay Employee USDC.  
Open **Runs** for `667ekg3qk5f45127eqjyy` (or show smoke Run live, then cut to certified PAYDAY Run).

Optional live no-spend: execute smoke workflow, show Run `2qvzsmq24d6nsjm0fzlhp`.

### 0:55–1:20 — EMBER

Console: Observer · Sentinel · PAYDAY · Rescue · Proof · Anchor · Continuity SLO.  
Provenance badge visible (CERTIFIED SNAPSHOT / LIVE OBSERVER).

> “EMBER watches continuity, detects a missed slot, replays through KeeperHub, and seals evidence.”

### 1:20–1:45 — Real evidence

Same execution ID + tx on BaseScan `0xd26e6174…`.

### 1:45–2:05 — Recovery

MISSED → SENTINEL → REPLAY → PROOF → ANCHOR → RESTORED  
(drill labeled CERTIFIED DRILL — NO LIVE SPEND, paired with real rescue tx).

### 2:05–2:20 — Proof

IPFS CID + Continuity anchor.

### 2:20–2:30 — Close

> “KeeperHub executes the action. EMBER makes sure the mission continues when execution fails.”

---

## Must appear on screen

1. KeeperHub org/workflow  
2. Workflow canvas  
3. MCP / AI client tools  
4. Agent using a KeeperHub tool  
5. KeeperHub Run  
6. Execution ID  
7. EMBER console  
8. Real transaction  
9. BaseScan  
10. Rescue evidence  
11. Proof  
12. Anchor  

---

## Non-claims

Do not claim private routing, gas sponsorship, or KH-native missed-slot detection unless visibly proven.

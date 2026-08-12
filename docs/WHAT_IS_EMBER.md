# What is EMBER?

**Audience:** anyone new to EMBER — judges, developers, operators.  
**Goal:** understand the product in under two minutes.

## One sentence

**When the agent dies, the mission survives.**

EMBER is an onchain **continuity** layer for autonomous payment missions.  
**KeeperHub executes** the transfers.  
**EMBER** detects missed obligations, safely replays them, and seals proof.

## The problem

Autonomous agents can schedule recurring payments (payroll, grants, settlements). Sometimes the **agent process dies** before it asks KeeperHub to run the next payment.

That is different from a failed run:

| Situation | Who handles it |
| --- | --- |
| Agent requested a run, then KeeperHub hit a transient error | KeeperHub retries / recovery of a **requested** execution |
| Agent never requested the next slot at all | **EMBER** detects the **missed invocation** and recovers |

Retries of a requested run are not the same as recovering a slot that was never requested.

## The solution (roles stay separate)

| Layer | Responsibility |
| --- | --- |
| **AI agent / operator** | Decides *what* should happen (inspect, validate, approve) |
| **KeeperHub** | Workflow execution, managed wallet signing, gas, simulation, retries of requested runs, audit trail, MCP |
| **EMBER** | Missed-slot detection, dual-org standby replay, recovery journal, IPFS proof, Continuity.sol anchor, operator UI |

EMBER is **not** a replacement for KeeperHub.

## Simple flow

```text
Agent decides
    ↓
KeeperHub executes (primary org)
    ↓
Payment lands onchain
    ↓
Miss detected (slot never requested)
    ↓
EMBER recovery (standby org replay)
    ↓
Proof (IPFS + Continuity.sol)
    ↓
Mission continues
```

## What the user sees

1. **Normal payment** — KeeperHub primary workflow runs; USDC moves; EMBER records healthy coverage.  
2. **Failure / death of the agent** — a scheduled obligation is unpaid because nobody asked KeeperHub.  
3. **Recovery** — EMBER’s Sentinel classifies unpaid slots and replays **only** those through a **separate** standby organization.  
4. **Proof** — canonical JSON → IPFS pin → onchain `anchorProof` on Continuity.sol.

You do **not** need to understand every blockchain detail to operate the product. You need to know:

- who executes (KeeperHub),
- who recovers continuity (EMBER),
- and that proofs are labeled honestly (demo vs live observer vs certified snapshot).

## Modes (do not confuse them)

| Mode | Secrets | Money | What you see |
| --- | --- | --- | --- |
| **Local demo** | None | Never | **DEMO FIXTURE** sample data |
| **Local KeeperHub test** | Real `kh_` keys | Prefer testnet / no-spend smoke | Real API calls |
| **Live observer** | Production read path | No writes when gated | Live health + certified payment story |
| **Live write** | Explicit env + confirmation | Real USDC | Operational — not for casual demos |

## Key terms (plain language)

- **Workflow** — a KeeperHub canvas of trigger + actions (e.g. Manual → Pay Employee USDC).  
- **Organization (org)** — KeeperHub workspace; each MCP connection sees **one** org.  
- **Execution** — one run of a workflow; has an `executionId` and optional transaction link.  
- **Missed slot** — a scheduled payment obligation that was never requested.  
- **Standby / Org B** — a second KeeperHub org used only for rescue replay (credential isolation).  
- **Proof** — hashable recovery record; pinned to IPFS and optionally anchored onchain.  
- **MCP** — Model Context Protocol; AI tools talk to **KeeperHub’s** MCP server, not a separate “EMBER MCP”.

## Next steps

- Local clone: [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)  
- Connect an agent: [MCP_QUICKSTART.md](./MCP_QUICKSTART.md)  
- Full dual-org recovery: [FULL_RECOVERY_SETUP.md](./FULL_RECOVERY_SETUP.md)  
- Architecture deep dive: [../ARCHITECTURE.md](../ARCHITECTURE.md)

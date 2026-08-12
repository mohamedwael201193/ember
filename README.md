<p align="center">
  <img src="frontend/public/ember.svg" alt="EMBER mark" width="72" />
</p>

# EMBER

**When the agent dies, the mission survives.**

**KeeperHub executes.  
EMBER keeps the mission alive.**

EMBER is an open-source **onchain continuity layer** for autonomous payment missions. It sits beside KeeperHub — it does not replace it. KeeperHub is the execution engine that signs, simulates, pays gas, retries requested runs, and records an audit trail. EMBER detects **missed obligations** (slots that were never requested), recovers them through an isolated standby organization, journals the rescue exactly once, pins a public proof, and anchors that proof on Base.

[Live app](https://ember-web-seven.vercel.app) · [What is EMBER?](./docs/WHAT_IS_EMBER.md) · [MCP quickstart](./docs/MCP_QUICKSTART.md) · [Architecture](./ARCHITECTURE.md) · [Evidence](./docs/evidence/README.md)

[![Base mainnet](https://img.shields.io/badge/Base-mainnet%208453-0052FF)](https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2)
[![KeeperHub](https://img.shields.io/badge/KeeperHub-workflows%20%2B%20MCP-111)](https://app.keeperhub.com/workflows/5goaid2zjgzyb32661se3)
[![CI](https://github.com/mohamedwael201193/ember/actions/workflows/ci.yml/badge.svg)](https://github.com/mohamedwael201193/ember/actions/workflows/ci.yml)
[![Node >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#local-clone-and-setup)
[![pnpm 10](https://img.shields.io/badge/pnpm-10-orange)](#local-clone-and-setup)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## Table of contents

- [What EMBER is](#what-ember-is)
- [The real problem](#the-real-problem)
- [Missed execution vs a failed transaction](#missed-execution-vs-a-failed-transaction)
- [What KeeperHub does](#what-keeperhub-does)
- [What EMBER does](#what-ember-does)
- [Architecture](#architecture)
- [Primary payment flow](#primary-payment-flow)
- [Failure flow](#failure-flow)
- [Recovery flow](#recovery-flow)
- [Proof flow](#proof-flow)
- [Continuity.sol](#continuitysol)
- [KeeperHub MCP](#keeperhub-mcp)
- [Cursor and Claude Code](#cursor-and-claude-code)
- [One-organization setup](#one-organization-setup)
- [Two-organization setup](#two-organization-setup)
- [Local clone and setup](#local-clone-and-setup)
- [Safe local testing](#safe-local-testing)
- [Real integration setup](#real-integration-setup)
- [Production architecture](#production-architecture)
- [Real evidence](#real-evidence)
- [Developer examples](#developer-examples)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Contribution](#contribution)
- [License](#license)

---

## What EMBER is

EMBER is continuity infrastructure for missions that must keep paying — payroll streams, recurring grants, settlement agents — even when the **decision process** that was supposed to request the next payment crashes, hangs, or never wakes up.

Public product surfaces:

| Surface | Role |
| --- | --- |
| Operator console | Mission health, payments, rescue, proofs |
| Continuity runtime | Observer + payday invoker + Sentinel |
| Continuity kit | Reusable policy/journal helpers (`packages/continuity-kit`) |
| Continuity.sol | Onchain proof anchor on Base |

Live console: https://ember-web-seven.vercel.app/

---

## The real problem

Autonomous agents schedule money movement. In production, the hard failure mode is not “the chain reverted once.” It is:

1. The agent (or the process that calls KeeperHub) **dies mid-cadence**.
2. The next payment slot is **never requested**.
3. Stakeholders see silence — no run, no receipt, no honest explanation.
4. A naive “retry everything” later may **double-pay**.

Teams need deterministic detection, isolated standby credentials, receipt-backed replay, and an auditable proof that the mission was restored.

---

## Missed execution vs a failed transaction

| Situation | What happened | Who should handle it |
| --- | --- | --- |
| **Failed / flaky requested run** | Someone asked KeeperHub to execute; the run errored or needs retry | KeeperHub execution infrastructure |
| **Missed invocation** | Nobody asked KeeperHub for that slot at all | **EMBER** continuity / Sentinel |

Retries of a *requested* run are not the same as recovering a slot that was *never requested*. That distinction is the core of EMBER.

---

## What KeeperHub does

[KeeperHub](https://keeperhub.com/) is the execution layer:

- Workflow builder and canvas
- Managed wallet signing and gas
- Simulation and retries for requested executions
- Runs / audit history
- REST execution APIs
- **Remote MCP** for AI agents (`https://app.keeperhub.com/mcp`)

Official docs: https://docs.keeperhub.com/

EMBER never pretends to be a second execution stack. Every primary and rescue USDC transfer in the verified mainnet path lands through KeeperHub workflows on Base.

---

## What EMBER does

| Capability | Meaning |
| --- | --- |
| Missed-slot detection | Compare expected cadence vs receipt-backed coverage |
| Dual-org standby | Primary executor (Org A) vs isolated replay (Org B) |
| Journaled rescue | Append-only steps; crash-safe resume |
| Exactly-once intent | Deterministic KeeperHub `Idempotency-Key` per slot |
| Public proof | Canonical JSON → SHA-256 → IPFS pin → fetch-back verify |
| Onchain seal | `anchorProof` on Continuity.sol |
| Operator UI | Human-readable mission / rescue / proof console |

---

## Architecture

```text
AI agent / operator (Cursor, Claude, …)
        │  decides / inspects (often via KeeperHub MCP)
        ▼
KeeperHub Org A  ──►  Base USDC payment (primary)
        │
        ▼
EMBER Observer / PAYDAY  ──►  watches executions & receipts
        │
   miss detected
        ▼
EMBER Sentinel  ──►  KeeperHub Org B replay workflow
        │
        ▼
Proof JSON → IPFS → Continuity.sol on Base
```

Monorepo layout (simplified):

```text
packages/     mission-core, kh-client, receipt-checker, continuity-kit
services/     payday, primary-observer, sentinel, gateway
frontend/     Vite app + BFF (secrets never enter the browser)
contracts/    Continuity.sol (Foundry)
examples/     continuity-guardian + MCP/Cursor/Claude starters
workflows/    KeeperHub workflow exports
docs/         Public developer documentation
```

Deep dive: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## Primary payment flow

1. Mission policy defines cadence, amount, recipient, and network (Base `8453` for mainnet evidence).
2. PAYDAY (or an operator / agent) requests the primary KeeperHub workflow.
3. KeeperHub executes **Manual → Pay Employee USDC** (or equivalent) with the Org A wallet integration.
4. USDC lands onchain; KeeperHub records the execution in Runs.
5. EMBER Observer relays / stores receipt-backed coverage for that slot.

Verified primary workflow id: `5goaid2zjgzyb32661se3` (`payday-stream-mainnet`).

---

## Failure flow

1. The primary agent stops requesting the next slot (process death, deploy gap, credential outage, …).
2. Time advances past the expected payment window.
3. KeeperHub has **no new requested run** for that slot — there is nothing for KeeperHub alone to “retry.”
4. EMBER marks the slot unpaid relative to receipts and mission policy.

---

## Recovery flow

1. **Sentinel** classifies unpaid slots that are not already covered by the rescue journal.
2. Only those slots are eligible for replay.
3. Replay executes through **Org B** (standby) KeeperHub workflow — separate API keys and wallet.
4. Each slot uses a deterministic idempotency key so crashes resume safely.
5. Journal steps append: hash check → replay → proof stages → done.

Verified standby workflow id: `pvhwggqr8318wac68jb62` (`payday-stream-orgb-replay-mainnet`).

Full dual-org guide: [`docs/FULL_RECOVERY_SETUP.md`](./docs/FULL_RECOVERY_SETUP.md)

---

## Proof flow

1. Build sorted canonical recovery JSON.
2. Compute SHA-256.
3. Pin to IPFS (Pinata in the reference deployment).
4. Fetch the CID bytes back and re-hash (refuse to anchor on mismatch).
5. Request `anchorProof` on Continuity.sol via KeeperHub / controlled write path.

Anyone can open the CID and the Base transaction. Continuity is visible, not tribal.

---

## Continuity.sol

`contracts/src/Continuity.sol` stores an onchain commitment to the recovery proof hash / CID metadata so operators and auditors can reconcile:

- local journal
- IPFS content
- chain anchor

Deployed Continuity address (Base mainnet evidence): [`0x068bB96e…5770`](https://basescan.org/address/0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770)

---

## KeeperHub MCP

External AI agents connect to **KeeperHub MCP**, not an “EMBER MCP server.”

```text
External AI agent
  → KeeperHub MCP (https://app.keeperhub.com/mcp)
  → KeeperHub workflow
  → execution / Runs
  → EMBER continuity / recovery observes and, when needed, recovers
```

Official source of truth:

- https://docs.keeperhub.com/ai-tools/mcp-server
- https://docs.keeperhub.com/ai-tools/overview
- https://docs.keeperhub.com/ai-tools/claude-code-plugin

| Fact | Detail |
| --- | --- |
| Endpoint | `https://app.keeperhub.com/mcp` (remote HTTP recommended) |
| Auth | OAuth **or** organisation-scoped Bearer `kh_…` (not `wfb_`) |
| Scope | **One MCP connection = one organization** |
| Local stdio | `kh serve --mcp` is **deprecated** in current KeeperHub docs |

Call `tools_documentation` at runtime for the live tool list.

EMBER guides:

- [`docs/MCP_QUICKSTART.md`](./docs/MCP_QUICKSTART.md)
- [`docs/MCP_CURSOR.md`](./docs/MCP_CURSOR.md)
- [`docs/MCP_CLAUDE.md`](./docs/MCP_CLAUDE.md)
- [`docs/AGENT_PROMPTS.md`](./docs/AGENT_PROMPTS.md)

Safe no-spend smoke workflow: `vewqfp44zmpa9dtctlrdr` (`EMBER MCP Smoke Test` — Base Sepolia balance check).

---

## Cursor and Claude Code

### Cursor

1. Open this repository.
2. Add KeeperHub remote MCP (see [`.cursor/mcp.json.example`](./.cursor/mcp.json.example)).
3. Authenticate with OAuth (if supported) or `Authorization: Bearer ${KH_API_KEY_…}`.
4. Ask the agent to run prompts from [`docs/AGENT_PROMPTS.md`](./docs/AGENT_PROMPTS.md).

### Claude Code

Official remote add:

```bash
claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp
```

Then `/mcp` for OAuth. Headless: pass `--header "Authorization: Bearer kh_…"`.  
Optional plugin: https://docs.keeperhub.com/ai-tools/claude-code-plugin

---

## One-organization setup

Use a single KeeperHub organization when you only need to:

- inspect / validate workflows
- run the safe smoke test
- understand the primary payroll canvas

One MCP server entry is enough. You will **not** see Org B private workflows on that connection.

---

## Two-organization setup

Full EMBER recovery isolation requires two orgs:

| Org | Role | Env placeholders |
| --- | --- | --- |
| **A** | Primary executor / observer | `KH_API_KEY_PRIMARY_EXECUTOR`, `KH_API_KEY_PRIMARY_OBSERVER` |
| **B** | Standby replay only | `KH_API_KEY_STANDBY` |

Configure **two** MCP server entries (for example `keeperhub-org-a` and `keeperhub-org-b`).  
Never tell a developer that one MCP connection can see both private orgs.

Guide: [`docs/FULL_RECOVERY_SETUP.md`](./docs/FULL_RECOVERY_SETUP.md)

---

## Local clone and setup

Prerequisites: Node ≥ 20, pnpm 10 via Corepack. Foundry optional locally.

```bash
git clone https://github.com/mohamedwael201193/ember.git
cd ember
corepack enable
pnpm install
pnpm setup
pnpm doctor
pnpm dev
```

Open http://127.0.0.1:5173

`pnpm setup` copies `.env.example` → `.env` with `DEVELOPMENT_MODE=1`. No KeeperHub keys are required for the default local path.

Full guide: [`docs/LOCAL_DEVELOPMENT.md`](./docs/LOCAL_DEVELOPMENT.md) · redirect: [`LOCAL_SETUP.md`](./LOCAL_SETUP.md)

---

## Safe local testing

```bash
pnpm doctor
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm security:secrets
```

Continuity starter (inspect-only by default):

```bash
pnpm --filter @ember/example-continuity-guardian run setup
pnpm --filter @ember/example-continuity-guardian run doctor
pnpm --filter @ember/example-continuity-guardian inspect
```

Local UI defaults to a labeled development / certified-story presentation. It is **not** a fresh mainnet spend. Provenance labels:

| Label | Meaning |
| --- | --- |
| **DEMO FIXTURE** | Local sample data |
| **LIVE OBSERVER** | Live APIs; writes may be gated |
| **CERTIFIED MAINNET SNAPSHOT** | Frozen real history |

---

## Real integration setup

1. Copy `.env.example` values into `.env`.
2. Set `DEVELOPMENT_MODE=0`.
3. Fill organisation `kh_` keys and workflow IDs.
4. Keep `SENTINEL_SHARED_SECRET` ≠ `PRIMARY_OBSERVER_SHARED_SECRET`.
5. Prefer smoke / testnet before any USDC write.
6. `pnpm doctor` → `pnpm build` → `pnpm start` (runtime) + frontend.

Never commit `.env`. Never put `kh_` keys in `VITE_` variables.

Modes: [`docs/LIVE_MODE.md`](./docs/LIVE_MODE.md)

---

## Production architecture

| Piece | URL / note |
| --- | --- |
| Frontend (Vercel) | https://ember-web-seven.vercel.app/ |
| Runtime (Render) | https://ember-api-8qzg.onrender.com/healthz |
| Readiness | https://ember-api-8qzg.onrender.com/readyz |
| BFF | Browser → Vercel BFF → Render (HMAC); secrets stay server-side |
| IPFS | Public CID via Pinata / gateway |
| Base | Chain id `8453` for mainnet evidence |

Deploy notes: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## Real evidence

Verified Base mainnet history (certified snapshots — real transactions, not a fresh spend for documentation):

| Artifact | Link / id |
| --- | --- |
| Primary USDC tx | [`0xd26e6174…341ea2`](https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2) |
| Primary execution | `667ekg3qk5f45127eqjyy` on workflow `5goaid2zjgzyb32661se3` |
| Rescue USDC tx | [`0x47437621…8e41`](https://basescan.org/tx/0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41) |
| Proof CID | [`QmVr6yWD…Woyn`](https://ipfs.io/ipfs/QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn) |
| Anchor tx | [`0x74ba1eac…211f`](https://basescan.org/tx/0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f) |

Index: [`docs/evidence/README.md`](./docs/evidence/README.md)

---

## Developer examples

| Path | Purpose |
| --- | --- |
| [`examples/cursor`](./examples/cursor) | Cursor MCP prompts |
| [`examples/claude`](./examples/claude) | Claude Code MCP prompts |
| [`examples/mcp`](./examples/mcp) | Inspect / validate / smoke |
| [`examples/safe-smoke-test`](./examples/safe-smoke-test) | No-spend smoke workflow |
| [`examples/basic-inspect`](./examples/basic-inspect) | Read-only inspection |
| [`examples/continuity-guardian`](./examples/continuity-guardian) | Continuity kit starter |

Copy-paste agent prompts: [`docs/AGENT_PROMPTS.md`](./docs/AGENT_PROMPTS.md)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| MCP 401 | Wrong key type or missing Bearer | Use org `kh_` key; not `wfb_` |
| Empty workflow list | Wrong org on the MCP connection | Re-auth with correct org / key |
| Cannot see Org B | Expected with one connection | Add a second MCP server entry |
| `tsc` missing on Vercel CLI | Wrong Vercel project / partial upload | Deploy via GitHub → project `ember-web` |
| Runtime 404 on `/health` | Wrong path | Use `/healthz` and `/readyz` |
| Local ports busy | Previous `pnpm dev` still running | Stop old processes; re-run `pnpm doctor` |

More: [`docs/FAQ.md`](./docs/FAQ.md) · [`docs/MCP_QUICKSTART.md`](./docs/MCP_QUICKSTART.md)

---

## Security

- Never commit `.env` or paste keys into chat.
- Browser never receives KeeperHub keys or HMAC secrets.
- Org A and Org B credentials stay isolated.
- Production schedules for payroll should stay **disabled** unless you are intentionally operating.
- Mainnet writes require explicit configuration and human confirmation.

See [`docs/SECURITY.md`](./docs/SECURITY.md) and [`docs/THREAT_MODEL.md`](./docs/THREAT_MODEL.md).

---

## Contribution

1. Fork and branch from `main`.
2. Prefer focused PRs that preserve the KeeperHub / EMBER responsibility split.
3. Run `pnpm doctor && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
4. Update public docs when you change env vars, ports, or APIs.

Guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)  
Adoption kit: [`docs/KEEPERHUB_CONTINUITY_ADOPTION.md`](./docs/KEEPERHUB_CONTINUITY_ADOPTION.md)  
KeeperHub integration map: [`docs/KEEPERHUB_INTEGRATION.md`](./docs/KEEPERHUB_INTEGRATION.md)

Upstream KeeperHub CLI execution-recovery work (status must be verified live on GitHub): https://github.com/KeeperHub/cli/pull/97

---

## License

[MIT](./LICENSE)

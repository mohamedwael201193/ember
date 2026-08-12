<p align="center">
  <img src="frontend/public/ember.svg" alt="EMBER mark" width="72" />
</p>

# EMBER

**When the agent dies, the mission survives.**

EMBER is an onchain continuity layer for autonomous payment missions.  
**KeeperHub executes.** EMBER detects missed obligations, safely replays them, and seals proof.

[Live app](https://ember-web-seven.vercel.app) · [What is EMBER?](./docs/WHAT_IS_EMBER.md) · [MCP quickstart](./docs/MCP_QUICKSTART.md) · [Evidence](./docs/evidence/README.md) · [Submission](./SUBMISSION.md)

[![Base mainnet](https://img.shields.io/badge/Base-mainnet%208453-0052FF)](https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2)
[![KeeperHub](https://img.shields.io/badge/KeeperHub-workflows%20%2B%20MCP-111)](https://app.keeperhub.com/workflows/5goaid2zjgzyb32661se3)
[![Node >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#quick-start)
[![pnpm 10](https://img.shields.io/badge/pnpm-10-orange)](#quick-start)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## Problem

Autonomous payment agents die mid-cadence. Retrying a *requested* KeeperHub run is not the same as recovering a slot that was *never requested*.

## Solution

| Layer | Does |
| --- | --- |
| **AI agent / operator** | Decides and inspects (often via MCP) |
| **KeeperHub** | Executes workflows, signs, gas, audit, MCP |
| **EMBER** | Detects unpaid slots, Org B standby replay, journal, IPFS proof, Continuity.sol |

```text
Agent decides → KeeperHub executes → miss detected → EMBER recovers → proof → mission continues
```

## Why KeeperHub

Every primary and rescue USDC transfer in the certified path lands through KeeperHub workflows on Base — canvas, Runs, execution APIs, and MCP.

## Real evidence (certified mainnet snapshot)

| | |
| --- | --- |
| Primary tx | [`0xd26e6174…341ea2`](https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2) |
| Primary run | workflow `5goaid2zjgzyb32661se3` · execution `667ekg3qk5f45127eqjyy` |
| Rescue tx | [`0x47437621…8e41`](https://basescan.org/tx/0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41) |
| Proof CID | [`QmVr6yWD…Woyn`](https://ipfs.io/ipfs/QmVr6yWDfuWbWE4m9UADtbJzSadqKXnUmpCHUERjsLWoyn) |
| Anchor | [`0x74ba1eac…211f`](https://basescan.org/tx/0x74ba1eac3e35c269175c06629782f66da454775141b6c94f14d608065c8d211f) |

### Provenance labels

| Label | Meaning |
| --- | --- |
| **LIVE OBSERVER** | Live APIs; payment writes may be disabled |
| **CERTIFIED MAINNET SNAPSHOT** | Frozen real history — not a fresh spend |
| **DEMO FIXTURE** | Local sample data only |

---

## Quick start (no secrets)

```bash
git clone https://github.com/mohamedwael201193/ember.git && cd ember
corepack enable && pnpm install
pnpm setup && pnpm doctor
pnpm test && pnpm build
pnpm dev
```

Open http://127.0.0.1:5173 — **DEMO FIXTURE** mode by default.

Full guide: [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)

---

## MCP setup (KeeperHub — not “EMBER MCP”)

External agents connect to **KeeperHub** remote MCP:

```text
https://app.keeperhub.com/mcp
```

- Auth: OAuth **or** organisation `kh_` Bearer key (not `wfb_`)  
- **One MCP connection = one organization**  
- Full dual-org recovery → two MCP server entries (Org A + Org B)

| Guide | Link |
| --- | --- |
| Quickstart | [docs/MCP_QUICKSTART.md](./docs/MCP_QUICKSTART.md) |
| Cursor | [docs/MCP_CURSOR.md](./docs/MCP_CURSOR.md) |
| Claude Code | [docs/MCP_CLAUDE.md](./docs/MCP_CLAUDE.md) |
| Copy-paste prompts | [docs/AGENT_PROMPTS.md](./docs/AGENT_PROMPTS.md) |
| Two-org recovery | [docs/FULL_RECOVERY_SETUP.md](./docs/FULL_RECOVERY_SETUP.md) |

Safe smoke workflow (no USDC): `vewqfp44zmpa9dtctlrdr` (`EMBER MCP Smoke Test`).

---

## Modes

| Mode | Secrets | Spend |
| --- | --- | --- |
| Local demo | None | Never |
| Local KeeperHub test | Real `kh_` keys | Prefer smoke / testnet |
| Live observer | Production reads | Writes gated |
| Live write | Explicit + confirmation | Real USDC |

Details: [docs/LIVE_MODE.md](./docs/LIVE_MODE.md)

---

## Production

| Surface | URL |
| --- | --- |
| Frontend | https://ember-web-seven.vercel.app/ |
| Runtime | https://ember-api-8qzg.onrender.com/healthz |
| Readiness | https://ember-api-8qzg.onrender.com/readyz |

Deploy notes: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Demo

- [docs/DEMO_RUNBOOK.md](./docs/DEMO_RUNBOOK.md)  
- [docs/FINAL_FILMING_CHECKLIST.md](./docs/FINAL_FILMING_CHECKLIST.md)  
- [docs/HACKATHON.md](./docs/HACKATHON.md)

---

## Documentation map

| Start here | [docs/WHAT_IS_EMBER.md](./docs/WHAT_IS_EMBER.md) |
| Architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| API | [API_REFERENCE.md](./API_REFERENCE.md) |
| Security | [docs/SECURITY.md](./docs/SECURITY.md) |
| FAQ | [docs/FAQ.md](./docs/FAQ.md) |
| KeeperHub integration | [docs/KEEPERHUB_INTEGRATION.md](./docs/KEEPERHUB_INTEGRATION.md) |
| Continuity kit | [packages/continuity-kit](./packages/continuity-kit) |
| Examples | [examples/](./examples/) |
| Contributing | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| DX scorecard | [docs/PUBLIC_DEVELOPER_READINESS.md](./docs/PUBLIC_DEVELOPER_READINESS.md) |

---

## Upstream contribution

KeeperHub CLI execution recovery: [PR #97](https://github.com/KeeperHub/cli/pull/97) (targets [issue #53](https://github.com/KeeperHub/cli/issues/53)).  
**Verify merge state on GitHub before claiming merged.**

---

## License

[MIT](./LICENSE)

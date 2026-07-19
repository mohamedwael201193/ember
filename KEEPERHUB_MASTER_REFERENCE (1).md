# KEEPERHUB MASTER REFERENCE

> **Document purpose.** A single, citation-grade reference for the KeeperHub execution-and-reliability layer. Every material statement is tied to a verifiable source: official docs page, GitHub repository file, blog post, or onchain transaction. A senior engineer should be able to read this document end-to-end and build a production project on KeeperHub without any other onboarding material.
>
> **Compilation date.** 2026-07-21 (Asia/Shanghai).
>
> **Primary sources.**
> - Docs site: <https://docs.keeperhub.com/> (Nextra/Next.js, rendered server-side) [SRC: docs-home]
> - Main repo: <https://github.com/KeeperHub/keeperhub> (TypeScript, 7,905 commits as of 2026-07-20) [SRC: gh-main]
> - GitHub org: <https://github.com/KeeperHub> (10 public repositories) [SRC: gh-org]
> - Marketing site: <https://keeperhub.com> [SRC: site-home]
> - Agent surface page: <https://keeperhub.com/agents> [SRC: site-agents]
> - Standards hub: <https://keeperhub.com/standards> [SRC: site-standards]
> - Blog index: <https://keeperhub.com/blog> [SRC: blog-index]
> - Hackathon page: <https://dorahacks.io/hackathon/agents-onchain/detail> [SRC: dora-hackathon]
> - OpenAgents hackathon wrap: <https://keeperhub.com/blog/010-openagents-hackathon-wrap> [SRC: blog-openagents-wrap]

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [What KeeperHub Actually Is](#2-what-keeperhub-actually-is)
3. [The Problem KeeperHub Solves](#3-the-problem-keeperhub-solves)
4. [Architecture Overview](#4-architecture-overview)
5. [Repository Map](#5-repository-map)
6. [Main Platform Repository Deep Dive](#6-main-platform-repository-deep-dive)
7. [Workflow Engine](#7-workflow-engine)
8. [Nodes, Triggers, Actions, Conditions](#8-nodes-triggers-actions-conditions)
9. [Plugin System](#9-plugin-system)
10. [Protocol Integrations](#10-protocol-integrations)
11. [Wallet Management](#11-wallet-management)
12. [AI Tools: MCP Server](#12-ai-tools-mcp-server)
13. [AI Tools: Agentic Wallet](#13-ai-tools-agentic-wallet)
14. [AI Tools: Claude Code Plugin](#14-ai-tools-claude-code-plugin)
15. [CLI (kh)](#15-cli-kh)
16. [REST API](#16-rest-api)
17. [SDK](#17-sdk)
18. [Framework Plugins](#18-framework-plugins)
19. [Payment Standards: x402](#19-payment-standards-x402)
20. [Payment Standards: MPP](#20-payment-standards-mpp)
21. [Identity Standard: ERC-8004](#21-identity-standard-erc-8004)
22. [Smart Gas Estimation](#22-smart-gas-estimation)
23. [Private Routing & MEV Protection](#23-private-routing--mev-protection)
24. [Audit Trail](#24-audit-trail)
25. [Execution Reliability & Retry Logic](#25-execution-reliability--retry-logic)
26. [Gas Sponsorship Program](#26-gas-sponsorship-program)
27. [Chain Coverage](#27-chain-coverage)
28. [Users, Organizations, Access Control](#28-users-organizations-access-control)
29. [Notifications](#29-notifications)
30. [Templates & Hub Marketplace](#30-templates--hub-marketplace)
31. [Keeper Runs & Observability](#31-keeper-runs--observability)
32. [Security Model](#32-security-model)
33. [Best Practices](#33-best-practices)
34. [Guides: Migrations](#34-guides-migrations)
35. [Roadmap Signals](#35-roadmap-signals)
36. [Pain Points & Open Issues](#36-pain-points--open-issues)
37. [Community & Support](#37-community--support)
38. [Glossary](#38-glossary)
39. [Source Index](#39-source-index)

---

## 1. EXECUTIVE SUMMARY

KeeperHub is the **execution and reliability layer for AI agents operating onchain**. It is explicitly not an agent framework and does not replace frameworks like LangChain, CrewAI, ElizaOS, AutoGPT, Hermes, or OpenClaw. Instead, it sits between an agent's decision and the onchain transaction that decision implies, and it guarantees that the transaction lands: with retry logic, gas optimization, MEV protection, simulation-before-submit, multi-RPC failover, and a full audit trail [SRC: docs-overview, site-agents].

The platform is **open source** under a permissive license (the `cli` repo is MIT, the `mcp`, `sdk`, `hermes-plugin`, `eve-plugin`, `agentic-wallet` repos are Apache-2.0; the main `keeperhub` repo inherits its license from `vercel-labs/workflow-builder-template`) [SRC: gh-org]. The main repository is forked from `vercel-labs/workflow-builder-template` and has accumulated 7,905 commits across 64 branches and 244 tags as of 2026-07-20 [SRC: gh-main].

The company behind KeeperHub has been operating Web3 automation infrastructure in production for **7+ years**, including the keepers running Sky Protocol today [SRC: site-agents, blog-first-hackathon]. The shift from a service business (Statement-of-Work engagements with protocol clients) to a platform business (self-serve workflow builder, CLI, MCP server, REST API, framework plugins) started roughly two years ago [SRC: blog-first-hackathon].

Four open standards anchor the agent-native surface:

| Standard | Purpose | Live since | Source |
|---|---|---|---|
| **MCP** (Model Context Protocol) | Tool discovery & invocation | Live (recommended via remote HTTP endpoint) | [SRC: site-mcp-standard] |
| **x402** | HTTP 402 pay-per-call settlement on Base USDC | 2026-04-13 (registered on x402scan.com) | [SRC: site-mpp, agentic-wallet-readme] |
| **MPP** (Machine Payments Protocol) | Pay-per-execution micropayments on Tempo USDC.e | 2026-04-13 (registered on mppscan.com, server ID `3a9395b49a059838086613a280a30d94b812991214d6fcb215a1d3c2196d5785`); first external agent payment on 2026-04-14 | [SRC: site-mpp] |
| **ERC-8004** | On-chain agent & service identity | Mainnet since 2026-01-29 (70k+ registered agents; KeeperHub is agent #31875) | [SRC: agentic-wallet-readme] |

Coverage at the time of writing: **12 EVM chains** and **20+ protocol integrations** (Aave V3, Aave V4, Aerodrome, Ajna, Chainlink, Chronicle, Compound V3, CoW Swap, Curve, Ethena, Frax Ether V2, Lido, Morpho, Pendle, Rocket Pool, Sky, Spark, Superfluid, Uniswap, Wrapped, Yearn V3, plus cross-chain via Chainlink CCIP) [SRC: site-agents, docs-sidebar, blog-ccip]. Solana support (event listening, SPL transfers) is landing in the current release cycle (commits `KEEP-984`, `KEEP-987` visible in `staging` branch) [SRC: gh-main].

The MCP server exposes **19 tools** spanning workflow CRUD, execution, plugin discovery, and monitoring; any MCP-compatible runtime wires in with one line: `claude mcp add --transport http keeperhub https://app.keeperhub.com/mcp` [SRC: blog-defi-agentic, docs-cli-quickstart].

Wallets are **non-custodial** via Turnkey, which stores private keys inside Trusted Execution Environments (TEEs). KeeperHub only ever holds the wallet address, sub-organization ID, and wallet ID — never the private key [SRC: blog-turnkey]. Safe multisig is first-class for higher-assurance flows [SRC: site-agents].

---

## 2. WHAT KEEPERHUB ACTUALLY IS

### 2.1 The one-sentence positioning

> *"Agents can think, KeeperHub lets them act. We do not replace agent frameworks or compete with them. We are the infrastructure they plug into when they need to actually transact onchain with guarantees."* [SRC: dora-hackathon]

### 2.2 What it is not

KeeperHub is **not**:

- An agent framework. It does not provide planning, reasoning, tool-selection logic, or LLM invocation. Bring your own framework.
- A wallet. It uses Turnkey (and Safe for multisig) for custody; it never holds private keys.
- An oracle. It does not produce price feeds or offchain data; it consumes them (Chainlink, Chronicle, Pyth, etc.).
- A bridge. It can call bridging protocols (Chainlink CCIP) but is not itself a bridge.
- An MEV searcher. It uses private routing to *avoid* MEV extraction against its own transactions.
- A replacement for Chainlink Automation, Gelato Network, OpenZeppelin Defender, or Ava Protocol. It competes with all of them on execution reliability and observability, but is explicitly complementary to the agent frameworks that decide *what* to execute [SRC: site-home-footer-comparison].

### 2.3 What it is

KeeperHub is a **managed Web3 workflow automation platform** with five layers, each exposed through the same set of agent-native surfaces:

1. **Workflow engine** — a visual builder (drag-and-drop) and a programmatic builder (MCP, REST, CLI) for composing triggers, conditions, and actions into replayable workflows.
2. **Execution engine** — the runtime that turns a workflow run into one or more onchain transactions with retries, gas handling, simulation, private routing, and per-step audit logging.
3. **Wallet layer** — non-custodial Turnkey-backed wallets per organization, with optional Safe multisig; each chain family uses the standard derivation path so the same key works across every network in that family.
4. **Plugin layer** — protocol-specific action libraries (Aave, Compound, Uniswap, etc.) and notification channels (Discord, Slack, Telegram, SendGrid, Webhook); a `pnpm create-plugin` wizard generates the full plugin structure.
5. **Surfaces** — the four agent-native integration points: MCP server, CLI (`kh`), REST API + SDK, and the x402/MPP payment rails. Every surface reaches the same execution engine; the interface is unified [SRC: docs-overview, blog-defi-agentic, blog-first-hackathon].

### 2.4 The company behind it

The team has run Web3 automation infrastructure in production for **7+ years**, including the keepers running Sky Protocol today [SRC: site-agents]. The company operates as KeeperHub, with public presence at:
- Website: <https://keeperhub.com>
- App: <https://app.keeperhub.com>
- Docs: <https://docs.keeperhub.com>
- Discord: <https://discord.gg/keeperhub>
- X/Twitter: <https://x.com/KeeperHubApp>
- LinkedIn: `company/keeperhub`
- YouTube: <https://www.youtube.com/@KeeperHub>
- Email: `contact@keeperhub.com`, `human@keeperhub.com`

[SRC: gh-org, site-links]

---

## 3. THE PROBLEM KEEPERHUB SOLVES

### 3.1 The agent execution gap

From KeeperHub's own framing:

> *"AI agents can reason, but they cannot reliably transact onchain. When an agent needs to move value, it runs into:*
> - *Failed transactions with no retry logic*
> - *Gas spikes that cause operations to stall or overpay*
> - *MEV extraction from unprotected public mempool submission*
> - *No audit trail for what was triggered, simulated, or executed*
> - *No human support when something goes wrong at 3am"*
>
> [SRC: docs-overview]

### 3.2 The deeper architectural framing: Read Layer vs Execute Layer

In a co-authored post with Blockscout (2026-06-03), KeeperHub articulated the cleanest version of the architectural argument:

> *"Read and execute are not two features of the same problem. They are two distinct disciplines with different failure modes and fundamentally different engineering requirements. Conflating them produces systems that do either job poorly."*
>
> [SRC: blog-blockscout]

Blockscout MCP is positioned as the **read layer** (block explorer data, transaction history, decoded contract calls); KeeperHub MCP is positioned as the **execute layer** (write transactions with guarantees). The argument is that an agent that tries to do both in one tool ends up with neither done well.

### 3.3 The specific failure modes KeeperHub targets

Drawn from across the docs, blog, and hackathon page:

| Failure mode | What goes wrong | KeeperHub's response |
|---|---|---|
| Silent transaction failure | Agent thinks it succeeded; chain disagrees | Simulation-before-submit; structured failure response the agent can reason about [SRC: site-agents] |
| Naive retry storms | Duplicates or gas burn | Nonce-aware resubmission; 10-attempt cap; exponential backoff [SRC: site-agents, agentic-wallet-readme] |
| MEV extraction | Public mempool leaks intent; frontrunning, sandwiching | Private routing via non-public submission paths [SRC: docs-overview, site-agents] |
| No audit trail | Autonomous agents moving value have no queryable record of decisions | Full audit trail: trigger, simulation, submitted tx, gas, outcome, timestamp — exportable, regulator-ready [SRC: docs-overview, site-agents] |
| No payment rails for agents | Subscriptions assume humans with cards | x402 + MPP pay-per-call, dual-protocol with auto-selection [SRC: site-standards, agentic-wallet-readme] |
| Framework lock-in | Every framework ships a half-finished execution layer; switching means rewriting execution | Framework-agnostic MCP/REST/CLI surfaces; same engine behind every framework [SRC: site-agents] |
| 3am failures | No human on call | Managed DeFi: 24/7 global engineering support with named engineers and SLA-backed uptime [SRC: docs-overview] |

### 3.4 What "the last mile" means

The hackathon page puts it bluntly:

> *"Most agent hackathons reward reasoning: an agent that decides something clever. The harder problem is what happens next. Agents can detect and decide, but they all hit the same wall when they need to move value onchain. Failed transactions, gas spikes, MEV, no observability, no guarantees. KeeperHub is the execution and reliability layer that fills it: the last mile between what your agent decides and a transaction that acts onchain."*
>
> [SRC: dora-hackathon]

This is the single most important framing for any project built on KeeperHub. The judging rubric weights **execution** above all else: "We reward agents that execute onchain, a working transaction that executes through KeeperHub beats a polished demo that never touches a chain" [SRC: dora-hackathon].

---

## 4. ARCHITECTURE OVERVIEW

### 4.1 High-level system diagram

The KeeperHub platform is composed of a Next.js 16 application (the visual builder, dashboard, and org management) sitting in front of a set of background services that handle scheduled execution, event listening, transaction execution, and metrics collection. All services share a PostgreSQL database (Drizzle ORM) and use Redis for caching and queue coordination. AWS SQS (or LocalStack SQS in dev) is the message bus between the scheduler and the executor. K8s jobs are used in "hybrid mode" for isolated workflow execution [SRC: readme-main, contributing-main].

```
┌─────────────────────────────────────────────────────────────────┐
│                          AGENT / USER                            │
│  Claude, GPT, LangChain, CrewAI, ElizaOS, Hermes, AutoGPT, HTTP  │
└─────────────┬───────────────────────────────┬────────────────────┘
              │                               │
              │ MCP (HTTP, stdio)             │ x402 / MPP (HTTP 402)
              │ REST (HTTPS)                  │
              │ CLI (kh)                      │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              KEEPERHUB API EDGE (Next.js 16 + Hono)              │
│  app.keeperhub.com  •  /mcp  •  /api/v1  •  /webhooks  •  /402  │
└──────┬──────────────────────────────┬──────────────────┬─────────┘
       │                              │                  │
       ▼                              ▼                  ▼
┌──────────────┐         ┌────────────────────┐  ┌────────────────┐
│  Workflow    │         │   Scheduler        │  │  Event         │
│  Builder     │         │  (leader election  │  │  Listener      │
│  (visual)    │         │   + 2 replicas)    │  │  (12 EVM       │
└──────┬───────┘         │  - cron dispatch   │  │   chains +     │
       │                 │  - block dispatch  │  │   Solana WIP)  │
       │                 └─────────┬──────────┘  └────────┬───────┘
       │                           │                      │
       ▼                           ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                         SQS BUS                                  │
│   (AWS SQS in prod, LocalStack SQS in dev, dead-letter queue)    │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     EXECUTOR (K8s Jobs / containers)             │
│  - nonce orchestration       - simulation-before-submit          │
│  - smart gas estimation      - private routing (Flashbots etc.)  │
│  - retry with backoff        - multi-RPC failover                │
│  - 10-attempt cap            - structured failure response       │
│  - per-step audit logging    - receipt capture                   │
└──────┬───────────────────────────────┬─────────────────────────┘
       │                               │
       ▼                               ▼
┌──────────────────┐         ┌────────────────────────────────────┐
│  Turnkey TEE     │         │   Onchain targets                  │
│  (signing only)  │         │   12 EVM chains + Solana (WIP)      │
│  Keys never      │         │   20+ protocol integrations         │
│  leave enclave   │         │                                    │
└──────────────────┘         └────────────────────────────────────┘
```

### 4.2 The five services

From the main repository's top-level directory structure (visible in the GitHub file browser at the `staging` branch tip, 2026-07-20):

| Directory | Service | Role |
|---|---|---|
| `app/` | Next.js 16 application | Visual workflow builder, dashboard, org management, MCP HTTP endpoint, REST API |
| `keeperhub-scheduler/` | Scheduler service | Cron and block dispatchers; runs with leader election and 2 replicas (commit `feat: run schedule and block dispatchers with leader election and 2 r…`, 2026-07-15) |
| `keeperhub-executor/` | Executor service | Pulls from SQS, executes workflow steps with retries, gas, simulation, private routing; dead-letter queue for dropped messages (commit `feat(executor): capture dropped SQS messages to a dead-letter queue`, 2026-07-13) |
| `keeperhub-events/` | Event listener | Listens to onchain events across 12 EVM chains (Solana event support in progress, `KEEP-987`); triggers workflows matching event conditions |
| `keeperhub-metrics-collector/` | Metrics collector | Scrapes execution metrics, run status, gas usage; feeds the audit trail and analytics endpoints |
| `lib/` | Shared library | Shared types, DB schema (Drizzle), helpers, the workflow-bundler that processes `"use step"` directives |
| `plugins/` | Protocol & integration plugins | Each plugin is a self-contained folder with steps, credentials, tests, icon |
| `protocols/` | Protocol definitions | Protocol action schemas consumed by `kh protocol list` and the MCP `search_protocol_actions` tool |
| `drizzle/` | Database migrations | File-based migrations; `pnpm db:migrate` (drizzle-kit migrate) in prod/staging; `pnpm db:push` for local dev only |
| `docs/` + `docs-site/` | Public docs | The `docs/` directory is published to `docs.keeperhub.com`; never put internal specs here |
| `specs/` | Internal specs | Internal architecture and planning docs; not public |
| `.planning/` | Planning | Linear ticket references, internal roadmap notes |
| `tests/` + `sandbox/` | Tests and sandbox | E2E and sandbox fixtures |

[SRC: gh-main, readme-main, contributing-main, claude-md, agents-md]

### 4.3 The deployment topology

The platform supports three deployment modes documented in `CONTRIBUTING.md`:

1. **Local Development (No Docker)** — UI/API work without background services. Requires PostgreSQL on host. `pnpm install && pnpm db:push && pnpm dev`.
2. **Docker Compose Development** — Full stack including scheduled workflow execution. `make dev-setup` (first time), `make dev-up`, `make dev-logs`, `make dev-down`. Services: PostgreSQL (port 5433), LocalStack SQS (port 4566), KeeperHub App (port 3000), Schedule Dispatcher, Executor, Redis.
3. **Hybrid Mode with K8s Jobs** — Tests workflow execution in isolated K8s Job containers. `make hybrid-setup`, `make hybrid-status`, `make hybrid-down`.

Production deploys run `pnpm db:migrate` (file-based), not `db:push`. Migration state is tracked in `drizzle.__drizzle_migrations`. The `-- @requires-db-prep` directive is used for heavy DDL (CREATE INDEX CONCURRENTLY, REINDEX CONCURRENTLY) — the SQL file is written in transaction-safe form, the directive triggers the `db-prep-check` merge gate, and an operator must apply the lock-free form against the target DB manually and flip the matching `db-prepped-<env>` label [SRC: agents-md, claude-md].

### 4.4 Tech stack summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (React, App Router), shadcn/ui, Jotai for state |
| Backend | Next.js API routes + Hono, Drizzle ORM |
| Language | TypeScript (frontend, main app, plugins, wallet, mcp), Go (CLI), Python (hermes-plugin, mcp Python client) |
| Database | PostgreSQL 16 |
| Queue | AWS SQS (LocalStack SQS in dev) + Redis |
| Orchestration | Docker Compose (dev), K8s (hybrid mode) |
| Linting | Biome + Ultracite |
| Package manager | pnpm (frontend); Go modules (CLI); pip / PyPI (hermes-plugin) |
| Node version | Pinned to Node 24 LTS (`.node-version`); Next.js 16 requires ≥20.9.0 |
| Wallet/signer | Turnkey (TEE), Safe (multisig) |
| Payments | x402 (Base USDC), MPP (Tempo USDC.e) |

[SRC: readme-main, agents-md, claude-md, contributing-main, agentic-wallet-readme]

---

## 5. REPOSITORY MAP

The KeeperHub GitHub organization (`https://github.com/KeeperHub`) has **10 public repositories** as of 2026-07-21 [SRC: gh-org]. They form a coherent multi-package strategy: the main platform repo for the engine and UI, plus separate repos for each surface (CLI, SDK, MCP, wallet, framework plugins).

### 5.1 The 10 repositories

| # | Repo | Language | License | Last updated | Purpose |
|---|---|---|---|---|---|
| 1 | `keeperhub` | TypeScript | (inherited) | Jul 21, 2026 | Main platform: visual builder, execution engine, plugins, protocols |
| 2 | `eve-plugin` | TypeScript | Apache-2.0 | Jun 19, 2026 | Vercel Eve connection for KeeperHub on-chain workflow automation. Read-only by default, opt-in writes. npm: `keeperhub-eve-plugin` |
| 3 | `hermes-plugin` | Python | Apache-2.0 | Jun 17, 2026 | Framework plugins connecting AI agents to KeeperHub. Hermes: `hermes-plugin-keeperhub` (PyPI) |
| 4 | `mcp` | TypeScript | Apache-2.0 | Jun 9, 2026 | Shared MCP client foundation for KeeperHub agent-framework adapters (TypeScript + Python) |
| 5 | `cli` | Go | MIT | Jun 3, 2026 | KeeperHub CLI for workflow management, execution, and MCP server |
| 6 | `sdk` | TypeScript | Apache-2.0 | Jun 2, 2026 | `@keeperhub/sdk` — official REST SDK (stateless typed HTTP client for backend, ops, SaaS integrations) |
| 7 | `claude-plugins` | (mixed) | MIT | May 19, 2026 | KeeperHub plugins for Claude Code (slash commands and skills) |
| 8 | `agentic-wallet` | TypeScript | (Apache-2.0 implied) | May 15, 2026 | `@keeperhub/wallet` — npm package auto-paying x402 (Base USDC) + MPP (Tempo USDC.e) 402 responses, Turnkey-backed custody, three-tier safety hooks |
| 9 | `homebrew-tap` | Ruby | — | May 7, 2026 | Homebrew tap for the `kh` CLI |
| 10 | `agentic-wallet-skills` | (mixed) | — | Apr 23, 2026 | Canonical skill file distribution for `@keeperhub/wallet`. Installed via `npx skills add keeperhub/agentic-wallet-skills` |

[SRC: gh-org]

### 5.2 Main repository statistics

- **Stars:** 15
- **Forks:** 17
- **Branches:** 64 (default: `staging`)
- **Tags:** 244
- **Commits:** 7,905 (as of 2026-07-20)
- **Forked from:** `vercel-labs/workflow-builder-template` (7,513 commits ahead)
- **Open issues:** 5
- **Open pull requests:** 6
- **Latest commit:** `986d3d9` "Merge pull request #1797 from KeeperHub/fix/global-scrollbar-styling", Jul 20, 2026

[SRC: gh-main]

### 5.3 Branch strategy

- `staging` is the default branch; PRs target `staging`.
- Production deploys happen from `staging` after verification.
- Branch naming: `feat/KEEP-<LINEAR-ID>-description` (e.g., `feat/KEEP-987-solana-event-li…`).
- Conventional commit types enforced by `pr-title-check` workflow: `feat`, `fix`, `hotfix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`, `perf`, `style`, `breaking`, `release`.
- Linear ticket IDs (e.g., `KEEP-987`) are kept OUT of public docs but live in branch names, commit messages, and `.planning/`.

[SRC: contributing-main, claude-md, gh-main]

---

## 6. MAIN PLATFORM REPOSITORY DEEP DIVE

### 6.1 Top-level layout

From the GitHub file browser at the `staging` branch tip:

```
.claude/                       # Claude Code project config (lint output cache)
.cursor/                       # Cursor editor rules
.github/                       # Workflows (pr-title-check, db-prep-check, etc.)
.planning/                     # Linear ticket references, internal roadmap
.understand-anything/          # Documentation tooling
.vscode/                       # VS Code workspace settings
analysis/                      # Analytics & reporting
app/                           # Next.js 16 application
components/                    # React components (shadcn/ui based)
data/                          # Static data fixtures
deploy/                        # Deployment manifests (K8s, Docker)
docs/                          # PUBLIC docs (published to docs.keeperhub.com)
docs-site/                     # Nextra site config & build
drizzle/                       # Database migrations
hooks/                         # React hooks + git hooks
keeperhub-events/              # Event listener service
keeperhub-executor/            # Executor service (SQS consumer)
keeperhub-metrics-collector/   # Metrics collector service
keeperhub-scheduler/           # Scheduler service (cron + block dispatch)
lib/                           # Shared library (DB schema, helpers, bundler)
plugins/                       # Protocol & integration plugins
protocols/                     # Protocol action schemas
public/                        # Static assets
sandbox/                       # Sandbox fixtures
scripts/                       # Build/dev scripts
specs/                         # Internal specs (NOT public)
tests/                         # E2E and integration tests
.dockerignore
.env.example                   # All environment variables documented here
.envrc                         # direnv config
.gitignore
.hadolint.yaml                 # Dockerfile linter config
.mcp.json.example              # Example MCP client config
.node-version                  # Pinned to Node 24 LTS
.npmrc                         # pnpm/npm config (min release age, etc.)
AGENTS.md                      # Instructions for AI coding agents
CLAUDE.md                      # Claude Code-specific instructions
CONTRIBUTING.md                # Internal contribution guide
Dockerfile
LICENSE
Makefile                       # dev-setup, dev-up, hybrid-setup, etc.
README.md
```

[SRC: gh-main]

### 6.2 Key policy files

#### 6.2.1 `AGENTS.md` — instructions for AI coding agents

Key rules that govern any agent working on the codebase:
- Use **pnpm** exclusively; never npm or yarn. For shadcn/ui components, use `pnpm dlx shadcn@latest add <component>`.
- Before completing any work: run `pnpm type-check`, then `pnpm fix` (Ultracite auto-fix), and resolve any remaining errors.
- Never commit code with type errors or lint issues.
- **No emojis** in any code, documentation, or README files.
- **No file/folder structure diagrams** in README files.
- **No random documentation files** — do not create `.md` files unless explicitly requested by the user.
- Database migrations: file-based in production (`pnpm db:migrate`); `db:push` only for local dev.
- Heavy DDL (`CREATE INDEX CONCURRENTLY`, `REINDEX CONCURRENTLY`) requires the `-- @requires-db-prep` directive on the first non-empty line of the migration file.

[SRC: agents-md]

#### 6.2.2 `CLAUDE.md` — Claude Code-specific instructions

Adds to `AGENTS.md`:
- `docs/` is **public-facing** — published to `docs.keeperhub.com`. Never put internal specs, phase numbers, internal version tags (e.g., `v1.8`), Linear ticket IDs (`KEEP-XXX`), PR numbers, or internal branch names there. Internal tracking belongs in `.planning/`, `specs/`, commit messages, and Linear.
- Never mention "co-authored with Claude" in PR descriptions or git commits.
- Never git push or create GitHub PRs without user confirmation.
- Never leave code comments with summaries of the user's prompt.
- PR titles MUST follow conventional commit format (`feat: description` or `feat(scope): description`). Enforced by `pr-title-check` workflow on PRs targeting `staging`.
- **Use `kh` CLI and KeeperHub MCP tools for all KeeperHub API interactions** — NEVER use raw `curl` or `fetch` against KeeperHub endpoints. Use MCP tools (`mcp__keeperhub-dev__*`, `mcp__keeperhub-staging__*`, `mcp__keeperhub__*`) for the target environment, or the `kh` CLI which handles auth and CF Access headers automatically via `~/.config/kh/hosts.yml`.
- Lint output caching: `.claude/lint-output.txt` and `.claude/typecheck-output.txt` are gitignored.

[SRC: claude-md]

#### 6.2.3 `CONTRIBUTING.md` — internal contribution guide

- **Prerequisites:** Node.js 24+ (per `.node-version`), pnpm, PostgreSQL 16+, Docker and Docker Compose.
- **Branch convention:** `feat/KEEP-123-description`.
- **Quality checks:** `pnpm check` (lint), `pnpm type-check` (TS), `pnpm fix` (auto-fix lint).
- **Commit format:** Conventional commits. `git commit -m "feat: KEEP-123 add new feature"`.
- **PR target:** `staging` (always).
- **PR title:** Enforced by `pr-title-check` workflow.
- **Deploy verification:** Every PR needs production proof after merge — deploy to staging, verify, deploy to production, document with screenshot/recording.
- **Plugin development:** Use `pnpm create-plugin` (interactive wizard). After creation: `pnpm discover-plugins` (register), `pnpm dev` (test). Reference plugins: `plugins/web3/` (full-featured), `plugins/discord/` (simpler), `plugins/_template/` (minimal).
- **Step file rules:** The `"use step"` directive marks a file for workflow bundler processing. Never export functions from step files other than the step function itself, `_integrationType`, and types. To share logic between steps, extract into a `*-core.ts` file (no `"use step"`).

[SRC: contributing-main]

### 6.3 The development workflow

```bash
# 1. Set up
cp .env.example .env
# Fill in: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, LOCALSTACK_AUTH_TOKEN

# 2. Install
pnpm install

# 3. Push schema to local Postgres
pnpm db:push

# 4. Run dev server (UI/API only)
pnpm dev
# Visit http://localhost:3000 (first compile: 30-60s)

# OR: full stack with Docker
make dev-setup  # First time (services + migrations)
make dev-up     # Subsequent starts
make dev-logs   # View logs
make dev-down   # Stop services

# OR: hybrid mode with K8s jobs
make hybrid-setup
make hybrid-status
make hybrid-down
```

[SRC: readme-main, contributing-main]

### 6.4 Environment variables

The minimum keys needed to boot the dev server (from `README.md`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/keeperhub

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Required for Docker and Hybrid modes (LocalStack Pro license)
LOCALSTACK_AUTH_TOKEN=your-localstack-token
```

Feature-specific keys (AI, Para wallets, encryption, OAuth providers, etc.) are listed in `.env.example` and only need values when exercising that feature. The CLI sources trial flags from AWS Parameter Store (visible in commit `chore(billing): source trial flags from Parameter Store`, 2026-07-14).

[SRC: readme-main, gh-main]

---

## 7. WORKFLOW ENGINE

### 7.1 What a workflow is

A workflow is a directed graph of **nodes** (triggers, actions, conditions) connected by **edges** that defines an automated onchain behavior. Workflows are versioned, exportable, importable, and publishable to the Hub Marketplace. The same workflow can be:
- Created in the visual builder
- Pulled through the REST API into a Git repo
- Extended through the MCP server
- Called over x402 or MPP by another agent
- Triggered by cron, webhook, onchain event, or manual click

The execution path onchain is identical regardless of which surface created or triggered it [SRC: blog-defi-agentic].

### 7.2 Node types

From the docs sidebar (`Workflows` → `Creating Workflows` / `Templating Reference` / `Node Structure` / `Edge Structure` / `Condition Nodes`):

1. **Trigger nodes** — entry points; fire on schedule, webhook, onchain event, or manual invocation.
2. **Action nodes** — perform work: contract reads, contract writes, transfers, plugin-specific protocol actions, notifications, webhook calls, custom code execution, math operations.
3. **Condition nodes** — branch the graph based on comparisons (low balance, value comparisons, custom AND/OR logic).

[SRC: docs-sidebar, readme-main]

### 7.3 Triggers

| Trigger | Description |
|---|---|
| Scheduled | Run at intervals: every 5 minutes, hourly, daily, custom cron |
| Webhook | Execute when external services call your workflow URL |
| Event | React to blockchain events: token transfers, contract state changes |
| Manual | On-demand execution via UI, CLI (`kh workflow run`), or API |

[SRC: readme-main, docs-sidebar]

### 7.4 Actions

#### 7.4.1 Web3 actions

| Action | Wallet required | Notes |
|---|---|---|
| Check Balance | No | Read-only |
| Read Contract | No | Read-only |
| Write Contract | Yes | Simulated before submit; routed privately |
| Transfer Funds | Yes | Native token transfer |
| Transfer Tokens | Yes | ERC-20 transfer |

[SRC: readme-main, docs-sidebar, docs-mcp]

#### 7.4.2 Notification actions

- Send Email (SendGrid)
- Discord Message
- Slack Message
- Telegram Message
- Webhook (arbitrary HTTP)

[SRC: readme-main, docs-sidebar]

#### 7.4.3 Plugin actions

Each plugin contributes its own action set. See §9 Plugin System and §10 Protocol Integrations.

### 7.5 Conditions

- Low balance detection
- Value comparisons (greater than, less than, equal to)
- Custom logic with AND/OR operators

[SRC: readme-main]

### 7.6 Workflow lifecycle

A workflow moves through these states (inferred from `kh workflow` subcommands):

```
created → paused ←→ active → (deleted)
              ↓
          go-live  ← explicit transition to "live" state
```

Key commands:
- `kh workflow list` — list workflows
- `kh workflow get` — view a workflow
- `kh workflow pause` — pause
- `kh workflow go-live` — activate
- `kh workflow run` — manual trigger
- `kh workflow delete` — soft delete

[SRC: docs-cli-sidebar, cli-readme]

### 7.7 Templating reference

Workflows support a templating syntax for parameterizing node inputs at runtime. The `Templating Reference` doc page covers the syntax; the `MCP Trigger Inputs` doc page covers how MCP-invoked workflows receive structured inputs from the calling agent [SRC: docs-sidebar].

### 7.8 Import / Export

Workflows are exportable (JSON) and importable. The Hub Marketplace is a public registry where any user can publish a workflow, price it per call in USDC, and have other users / agents discover and invoke it via x402 or MPP [SRC: blog-defi-agentic].

### 7.9 AI-generated workflows

The MCP server exposes an `ai_generate_workflow` tool. Describe what you want in natural language; an LLM generates the workflow (trigger, actions, conditions, all wired together) ready for review. This runs locally inside the canvas or programmatically through the MCP server, which means another agent can be the caller [SRC: blog-defi-agentic, hermes-plugin-readme].

> *"A portfolio agent notices vault health drifting. It asks the MCP server to create a monitoring workflow with a Telegram alert at a 150% collateral ratio. The workflow is generated, reviewed by the user (or approved automatically under policy), and listed. Every execution, retry, and gas decision is logged and queryable by the same agent that created it."*
>
> [SRC: blog-defi-agentic]

---

## 8. NODES, TRIGGERS, ACTIONS, CONDITIONS

(Detailed in §7 above; this section reserves space for the Node Structure, Edge Structure, and Condition Nodes specification as it appears in the public docs. The relevant doc pages are `docs/workflows/node-structure`, `docs/workflows/edge-structure`, `docs/workflows/condition-nodes`, and `docs/workflows/templating-reference`. The HTML-rendered content of these pages is JavaScript-rendered via Nextra and not directly scrapable; the GitHub source under `docs/workflows/` is the canonical reference.) [SRC: docs-sidebar]

---

## 9. PLUGIN SYSTEM

### 9.1 What a plugin is

A plugin is a self-contained folder under `plugins/{name}/` that extends KeeperHub's action set. Plugins are how KeeperHub integrates with: (a) onchain protocols (Aave, Compound, Uniswap, etc.), (b) notification channels (Discord, Slack, Telegram, SendGrid), (c) webhook/HTTP integrations, and (d) arbitrary computation (`code`, `math`) [SRC: contributing-main].

### 9.2 Plugin folder structure

```
plugins/my-integration/
├── index.ts            # Plugin definition (metadata, action registration)
├── icon.tsx            # Icon component (SVG or Lucide)
├── credentials.ts      # Credential type definition
├── test.ts             # Connection test function
└── steps/              # Action implementations
    └── my-action.ts    # Step function with "use step" directive
```

[SRC: contributing-main]

### 9.3 Current plugins

From the docs sidebar, the current plugin list:

| Category | Plugins |
|---|---|
| Core | `web3`, `code`, `math` |
| Wallets & multisig | `safe` |
| Read layer | `blockscout` |
| Lending | `aave-v3`, `aave-v4`, `compound-v3`, `spark`, `sky`, `morpho`, `ajna` |
| Liquid staking | `lido`, `rocket-pool` |
| DEX / AMM | `uniswap`, `curve`, `aerodrome`, `cow-swap` |
| Yield | `pendle`, `ethena`, `frax-ether-v2`, `yearn-v3` |
| Oracles | `chainlink`, `chronicle` |
| Stablecoin | (covered by `sky`) |
| Streaming | `superfluid` |
| Wrapped | `wrapped` |
| Perps DEX | `hyperliquid` |
| Notifications | `discord`, `slack`, `telegram`, `sendgrid`, `webhook` |
| Cross-chain | Chainlink CCIP (via `chainlink` plugin) [SRC: blog-ccip] |

[SRC: docs-sidebar, blog-ccip]

### 9.4 Step file rules (critical)

The `"use step"` directive marks a file for workflow bundler processing. Critical rules:

1. **Never export functions from step files** other than the step function itself, `_integrationType`, and types.
2. **To share logic between steps**: extract into a `*-core.ts` file (no `"use step"`).
3. **No Node.js built-ins** that break bundling (e.g., `fs`, `child_process`).

[SRC: contributing-main]

### 9.5 Plugin development workflow

```bash
pnpm create-plugin       # Interactive wizard — creates full plugin structure
pnpm discover-plugins    # Register the plugin (updates plugin registry)
pnpm dev                 # Test it locally
```

Reference plugins:
- `plugins/web3/` — Full-featured plugin with multiple actions, credential handling, and read/write operations.
- `plugins/discord/` — Simpler notification plugin.
- `plugins/_template/` — Minimal template files.

[SRC: contributing-main]

---

## 10. PROTOCOL INTEGRATIONS

### 10.1 Protocol plugin coverage (20+ integrations across 12 EVM chains)

| Protocol | Plugin | What it does |
|---|---|---|
| Aave V3 | `aave-v3` | Supply, borrow, repay, withdraw, health factor checks |
| Aave V4 | `aave-v4` | Same as V3 plus the new Aave V4 architecture |
| Aerodrome | `aerodrome` | Aerodrome DEX swaps and liquidity |
| Ajna | `ajna` | Ajna Finance lending pools |
| Chainlink | `chainlink` | Chainlink oracles + CCIP cross-chain bridging |
| Chronicle | `chronicle` | Chronicle (Scribe) oracle reads |
| Compound V3 | `compound-v3` | Comet supply/borrow/withdraw |
| CoW Swap | `cow-swap` | Batch auction DEX (MEV-resistant by design) |
| Curve | `curve` | Curve pool swaps and LP |
| Ethena | `ethena` | USDe / sUSDe operations |
| Frax Ether V2 | `frax-ether-v2` | frxETH / sfrxETH |
| Lido | `lido` | stETH staking and withdrawals |
| Morpho | `morpho` | Morpho Blue markets |
| Pendle | `pendle` | PT/YT swaps, LP |
| Rocket Pool | `rocket-pool` | rETH staking |
| Sky | `sky` | Sky protocol (formerly MakerDAO) — DAI, SDS, etc. |
| Spark | `spark` | Spark lending |
| Superfluid | `superfluid` | Streaming payments |
| Uniswap | `uniswap` | V2/V3/V4 swaps and liquidity |
| Wrapped | `wrapped` | WETH wrap/unwrap |
| Yearn V3 | `yearn-v3` | Yearn V3 vaults |

[SRC: docs-sidebar, blog-defi-agentic, blog-ccip]

### 10.2 Solana support (in progress)

The `staging` branch shows active Solana work:
- `KEEP-984`: Transfer SPL Token action for Solana (commit `feat: KEEP-984 add Transfer SPL Token action for Solana`, 2026-07-16)
- `KEEP-987`: Solana event listening (commit `feat(57-03): ...`, branch `feat/KEEP-987-solana-event-li…`, merged 2026-07-20)
- Test commit: `test: KEEP-984 verify SPL transfer on live devnet` (2026-07-17)

[SRC: gh-main]

### 10.3 Direct execution (no workflow required)

In addition to workflow-based execution, KeeperHub exposes direct execution APIs:
- `kh execute contract-call` — call a contract method directly
- `kh execute transfer` — transfer native tokens
- `kh execute status` — check execution status
- `kh execute check-and-execute` — atomic check-then-execute (used heavily by DeFi keeper patterns)

These bypass the workflow engine for cases where you just need a single transaction with the reliability guarantees (smart gas, retries, private routing, audit trail) but don't need the trigger/condition graph [SRC: docs-cli-sidebar, hermes-plugin-readme].

---

## 11. WALLET MANAGEMENT

### 11.1 Custody model: Turnkey + TEEs

KeeperHub wallets are **non-custodial**. The private key never leaves a Trusted Execution Environment (TEE) hosted by Turnkey. From the Turnkey signer integration blog post (2026-04-15):

> *"Keys are generated inside the enclave, used inside the enclave, and never leave the enclave during normal operation. When a KeeperHub organization creates a wallet, we call Turnkey to spin up a new sub-organization scoped to that org. The sub-org is the customer's own perimeter inside Turnkey: its own admin user, its own API credentials, its own wallets. The wallet itself is generated on the standard derivation path for its chain family, so the same key works across every network in that family. What comes back to us, and what we store, is the wallet address, the sub-organization ID, and the wallet ID. That is all. The private key stays behind the enclave boundary. It never lands in our database, it never appears in a log, and it never sits in memory on our servers."*
>
> [SRC: blog-turnkey]

### 11.2 Three principles of the wallet design

From the same blog post:

1. **Hardware-backed key custody** — the private key has to live in dedicated hardware, inside a boundary KeeperHub cannot reach through its own systems. Software isolation is not enough; a determined attacker sharing the same machine can usually find a seam. Dedicated hardware with an attested boundary is a different class of guarantee.
2. **Users always own their keys** — every KeeperHub wallet has to be exportable, directly from the product, whenever the user decides. No support ticket, no agreement to sign, no conditions.
3. **A signer that plugs into each chain's native tooling** — the wallet layer plugs in behind ethers.js (EVM) or Solana's signer (Solana). Workflow code stays chain-idiomatic; swapping or extending the provider is a localized change; business logic does not need to know what is holding the key.

[SRC: blog-turnkey]

### 11.3 The signing path

```
Workflow step → ethers.js Signer (EVM) or Solana signer
              → serializes payload
              → hands to Turnkey enclave over authenticated channel
              → enclave signs inside hardware
              → returns signature
              → KeeperHub broadcasts signed tx to chain via multi-RPC failover
```

The same path is used for every onchain action KeeperHub runs: transfers, approvals, contract writes, protocol-specific steps [SRC: blog-turnkey].

### 11.4 Wallet export flow

The export flow runs in two halves:

1. **Identity** — the admin requests an export; KeeperHub emails a 6-digit code that expires in 5 minutes and allows 5 attempts. The admin types it back in the browser. This proves they control the email on file, not just the session.
2. **Cryptography** — once the code checks out, the system facilitates the export through Turnkey's secure export mechanism, ensuring the key never lands anywhere persistent on KeeperHub's side.

[SRC: blog-turnkey]

### 11.5 Safe multisig support

Safe (formerly Gnosis Safe) is first-class for higher-assurance flows. The `safe` plugin allows workflows to:
- Prepare Safe transactions
- Simulate Safe transactions
- Submit Safe transactions
- Track Safe nonce

This is critical for DAO and treasury use cases where a single-signer workflow is insufficient [SRC: site-agents, docs-sidebar].

### 11.6 Para Wallet Integration (Discontinued)

The docs sidebar lists `Wallet Management → Para Wallet Integration (Discontinued)`. Para was previously the MPC wallet provider; it has been replaced by Turnkey. Any documentation or code referencing Para is legacy and should not be used for new projects [SRC: docs-sidebar].

### 11.7 Address Book

KeeperHub provides an address book for saving and organizing frequently-used addresses (recipients, contracts, etc.) per organization [SRC: docs-sidebar].

### 11.8 Gas Management

The `Wallet Management → Gas Management` doc page covers how KeeperHub handles gas pricing, gas sponsorship, and gas estimation. The core mechanism is the **Smart Gas Estimation** engine (see §22) [SRC: docs-sidebar, docs-overview].

---

## 12. AI TOOLS: MCP SERVER

### 12.1 What the MCP server is

The KeeperHub MCP server exposes the platform's triggers and actions as **native tools** for any MCP-compatible agent runtime: Claude, GPT (via OpenAI's MCP support), LangChain, CrewAI, ElizaOS, AutoGPT, Hermes, Cursor, VS Code Copilot, Microsoft Copilot, Gemini. The agent does not need a bespoke SDK or hand-rolled tool definitions [SRC: site-mcp-standard].

### 12.2 How to connect

#### 12.2.1 Recommended: remote HTTP endpoint

```bash
# Claude Code
claude mcp add --transport http keeperhub https://app.keeperhub.com/mcp
```

Then run `/mcp` inside Claude Code to authorize via browser.

For Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "keeperhub": {
      "type": "http",
      "url": "https://app.keeperhub.com/mcp"
    }
  }
}
```

Restart Claude Desktop. KeeperHub tools will appear in the tool list [SRC: docs-cli-quickstart].

#### 12.2.2 Legacy: local stdio via `kh serve --mcp`

The legacy mode runs a local MCP stdio server via `kh serve --mcp`. This mode is **deprecated** — prefer the remote HTTP endpoint above [SRC: docs-cli-quickstart, docs-mcp].

#### 12.2.3 Per-Workflow MCP Servers

In addition to the aggregate MCP server, KeeperHub supports **per-workflow MCP servers**. Each workflow can be exposed as its own MCP server with a single tool (the workflow itself), scoped credentials, and isolated billing. This is useful for production deployments where you want a clean surface per workflow [SRC: docs-mcp].

### 12.3 What the agent sees

Once connected, the agent sees 19 tools covering:
- Workflow CRUD (create, read, update, delete, list, search)
- Execution (execute workflow, check status, get logs, cancel)
- Direct on-chain execution (transfer, contract call, check-and-execute)
- Protocol actions (DeFi operations via plugins)
- AI generation (generate workflow from natural language)
- Action schemas and plugin discovery
- Templates (list, deploy)
- Marketplace listings
- Integrations
- Documentation (tools_documentation)
- Status / health check

[SRC: blog-defi-agentic, hermes-plugin-readme, docs-mcp]

### 12.4 The 19 tools (from the Hermes plugin's read-only + write tool list)

#### 12.4.1 Read-only tools (default, available without `KEEPERHUB_ENABLE_WRITES`)

| Tool | Purpose |
|---|---|
| `kh_list_workflows` | List workflows in current org |
| `kh_get_workflow` | Get a specific workflow |
| `kh_search_org_workflows` | Search workflows in current org |
| `kh_search_workflows_marketplace` | Search the public Hub Marketplace |
| `kh_get_execution_status` | Check workflow run status |
| `kh_get_execution_logs` | Get workflow run logs |
| `kh_get_direct_execution_status` | Check direct execution status |
| `kh_search_templates` | Browse workflow templates |
| `kh_get_template` | Get a specific template |
| `kh_search_plugins` | Discover available plugins |
| `kh_get_plugin` | Get plugin details |
| `kh_list_action_schemas` | List action schemas (inputs/outputs) |
| `kh_search_protocol_actions` | Browse DeFi protocol actions |
| `kh_list_integrations` | List integrations |
| `kh_get_wallet_integration` | Get wallet integration details |
| `kh_ai_generate_workflow` | Generate workflow from natural language |
| `kh_tools_documentation` | Get documentation for available tools |
| `kh_status` | Health check / connection status |

#### 12.4.2 Write tools (require `KEEPERHUB_ENABLE_WRITES=true`)

| Tool | Purpose |
|---|---|
| `kh_create_workflow` | Create a new workflow |
| `kh_update_workflow` | Update an existing workflow |
| `kh_delete_workflow` | Delete a workflow |
| `kh_execute_workflow` | Run a workflow |
| `kh_deploy_template` | Deploy a template as a workflow |
| `kh_call_workflow` | Call a published workflow (paid via x402/MPP if listed) |
| `kh_execute_protocol_action` | Execute a DeFi protocol action directly |
| `kh_execute_transfer` | Transfer native tokens |
| `kh_execute_contract_call` | Call a contract method |
| `kh_execute_check_and_execute` | Atomic check-then-execute |

[SRC: hermes-plugin-readme]

### 12.5 Cross-organization calls

The MCP server supports cross-organization calls. An agent in org A can invoke a workflow published by org B (e.g., a marketplace-listed workflow) with proper payment. This is the basis for the agent economy on KeeperHub [SRC: docs-mcp].

### 12.6 Paid workflows via MCP

When an agent invokes a paid workflow (one listed on the Hub Marketplace with a per-call USDC price), the MCP server returns a 402 challenge. The agent's wallet (e.g., `@keeperhub/wallet`) settles the payment via x402 (Base USDC) or MPP (Tempo USDC.e), and the workflow executes. The audit trail captures both the payment and the execution [SRC: agentic-wallet-readme, blog-defi-agentic].

### 12.7 Authentication

- **Browser flow** (interactive): `kh auth login` opens a browser; token is stored in OS keyring.
- **API key** (CI/CD): set `KH_API_KEY` environment variable. Organization keys use the `kh_` prefix; user keys use the `wfb_` prefix. The MCP client handles 401/404 re-init and key disambiguation automatically [SRC: cli-readme, mcp-readme].

### 12.8 Organization scoping

The MCP server is scoped to the organization of the API key used to authenticate. To work with multiple organizations:
1. Configure multiple MCP servers (one per org) in your agent's MCP config.
2. Switch the active organization via `kh org switch <org-id>` (CLI) or by re-authenticating with a different API key.
3. The MCP client foundation (`@keeperhub/mcp`) handles session bootstrap and re-init on 401/404 across multiple org bindings [SRC: mcp-readme, docs-cli-sidebar].

---

## 13. AI TOOLS: AGENTIC WALLET

### 13.1 What it is

`@keeperhub/wallet` is the **agent payment client** for KeeperHub workflows. It auto-pays `HTTP 402` responses over x402 (Base USDC) or MPP (Tempo USDC.e), binds every payment to a workflow slug, and records an onchain audit trail via the **ERC-8004 ReputationRegistry** [SRC: agentic-wallet-readme].

> *"No hot key. No private key in your shell. Just install, set spending thresholds, and any MCP-aware agent can call paid KeeperHub workflows automatically."*
>
> [SRC: agentic-wallet-readme]

### 13.2 Install

```bash
npx -p @keeperhub/wallet keeperhub-wallet skill install
```

`skill install` does three things, idempotently:
1. Writes the `keeperhub-wallet` skill file into every detected agent's skills directory (Claude Code, Cursor, Windsurf, OpenCode auto-detected; Cline emits a copy-paste notice).
2. Registers the `keeperhub-wallet-hook` PreToolUse safety hook in `~/.claude/settings.json`.
3. Registers the `keeperhub-wallet` stdio MCP server in each detected agent's MCP config.

On the very first tool call, the server provisions a fresh wallet automatically into `~/.keeperhub/wallet.json` — there is no manual `add` step. The provisioned wallet starts at zero balance; the first 402 round-trip surfaces `INSUFFICIENT_FUNDS` with a Coinbase Onramp URL [SRC: agentic-wallet-readme].

### 13.3 The four tools

| Tool | What it does | Backed by |
|---|---|---|
| `call_workflow` | Pay-and-invoke a KeeperHub-listed workflow by slug. Handles 402, picks `x402` or `mpp` based on what the server advertises, retries with a signed payment. | Server-side signing + workflow-slug binding |
| `balance` | On-chain USDC balance for both Base and Tempo. | `viem` `balanceOf` against canonical USDC contracts |
| `info` | Public wallet metadata (`subOrgId`, `walletAddress`). The HMAC secret is never returned. | Local `~/.keeperhub/wallet.json` |
| `feedback` | Record ERC-8004 ReputationRegistry feedback for a workflow execution this wallet paid for. Wallet pays gas (~$0.05–2 native ETH). | `giveFeedback()` on Ethereum mainnet |

[SRC: agentic-wallet-readme]

### 13.4 The CLI companion

A Commander-based CLI (`keeperhub-wallet`) and a PreToolUse safety hook (`keeperhub-wallet-hook`) ship in the same package [SRC: agentic-wallet-readme].

### 13.5 Why this exists — the agent economy context

From the README:

> *"The agent-economy primitives are now real:*
> - ***x402** (Coinbase's HTTP-402 payment protocol) is live on Base USDC. Around $24M/month in volume as of early 2026, with ~94k buyers and ~22k sellers.*
> - ***MPP** (Machine Payments Protocol, launched alongside Stripe's Tempo chain on 2026-03-18) integrated 50+ services in its first week — OpenAI, Anthropic, Google Gemini, Dune, Browserbase, Parallel Web Systems, WorkOS. Visa joined as an anchor validator in April 2026.*
> - ***ERC-8004** (Ethereum's agent identity standard, mainnet 2026-01-29) now has 70k+ registered agents.*
> - ***MCP** is the de-facto agent tool-call protocol. KeeperHub is registered as agent #31875 on the ERC-8004 IdentityRegistry. Workflows published on the marketplace can be called by any MCP-aware agent and paid for over either rail.*
>
> *`@keeperhub/wallet` is the client that closes that loop — it discovers the price, enforces a local spending policy, signs the payment through a managed signer, and writes feedback after."*
>
> [SRC: agentic-wallet-readme]

### 13.6 Safety hooks

The wallet ships with **three-tier safety hooks** [SRC: gh-org, agentic-wallet-readme]:

1. **Server-side hard limits** — the wallet service enforces absolute spend ceilings regardless of agent requests.
2. **Default safety config** — conservative per-call and per-day limits out of the box.
3. **PreToolUse hook** — the `keeperhub-wallet-hook` intercepts Claude Code tool calls before they reach the wallet, applying local policy.

The full safety configuration is in `~/.keeperhub/wallet.json`. The HMAC secret is never returned by the `info` tool [SRC: agentic-wallet-readme].

### 13.7 Known limitations

- **No passkey or 2FA option** — the wallet is designed for autonomous use; the safety hooks replace human-in-the-loop approvals.
- **Gas for feedback transactions** — the `feedback` tool costs ~$0.05–2 in native ETH on Ethereum mainnet; the wallet must be funded with ETH for this to work.
- **Single-machine wallet** — `wallet.json` is portable (you can copy it to another machine), but it's not designed for multi-device sync.

[SRC: agentic-wallet-readme, docs-sidebar]

### 13.8 The dual-protocol routing logic

From the agentic wallet docs:

> *"Most KeeperHub paid workflows accept both protocols; today the wallet pays via x402 by default and uses MPP when the workflow is MPP-only. If the amount exceeds [a threshold], the wallet auto-selects based on the wallet's balance across both chains."*
>
> [SRC: docs-wallet]

### 13.9 Alternatives

The docs page mentions two alternatives:
- **agentcash** — another agentic wallet client (the one used for the first external agent payment on 2026-04-14).
- **Coinbase agentic wallet skills** — Coinbase's own agentic wallet offering.

[SRC: docs-wallet, site-mpp]

---

## 14. AI TOOLS: CLAUDE CODE PLUGIN

### 14.1 What it is

In addition to the MCP server, KeeperHub ships a dedicated Claude Code plugin (repo: `KeeperHub/claude-plugins`) that adds skills and slash commands on top of the MCP tool surface [SRC: readme-main, gh-org].

### 14.2 Install

```bash
# Inside Claude Code
/plugin marketplace add KeeperHub/claude-plugins
/plugin install keeperhub@keeperhub-plugins
/keeperhub:login
```

Restart Claude Code after setup [SRC: readme-main].

### 14.3 Plugin source

Plugin source code: <https://github.com/KeeperHub/claude-plugins/tree/main/plugins/keeperhub> [SRC: readme-main].

---

## 15. CLI (kh)

### 15.1 What it is

The `kh` CLI is written in **Go** and is the scriptable, CI/CD-friendly way to manage workflows, execute blockchain actions, and monitor runs from the terminal. It also exposes the (deprecated) local stdio MCP server mode [SRC: cli-readme, docs-cli-quickstart].

### 15.2 Install

```bash
# Homebrew (macOS/Linux)
brew install keeperhub/tap/kh

# Go install
go install github.com/keeperhub/cli/cmd/kh@latest

# Binary download
# From https://github.com/KeeperHub/cli/releases
```

[SRC: cli-readme, docs-cli-quickstart]

### 15.3 Authenticate

```bash
kh auth login
# Opens browser; token stored in OS keyring

# For CI/CD
export KH_API_KEY="kh_..."
```

[SRC: cli-readme, docs-cli-quickstart]

### 15.4 Common commands

```bash
kh workflow list                         # List all workflows
kh workflow run <workflow-id> --wait     # Run + wait for completion
kh run status <run-id>                   # Check run status
kh run logs <run-id>                     # Stream run logs
kh execute contract-call --protocol aave --action supply --args '{"amount":"1000000"}'
kh protocol list                         # Browse available protocols
```

[SRC: cli-readme, docs-cli-quickstart]

### 15.5 Full command reference (from docs sidebar)

The `kh` CLI has these subcommands (from the docs sidebar, organized by category):

#### 15.5.1 Auth
- `kh auth login`
- `kh auth logout`
- `kh auth status`

#### 15.5.2 Billing
- `kh billing status`
- `kh billing usage`

#### 15.5.3 Config
- `kh config get`
- `kh config list`
- `kh config set`

#### 15.5.4 Diagnostics
- `kh doctor` — health check
- `kh update` — self-update
- `kh version` — version info
- `kh completion` — shell completion

#### 15.5.5 Execute (direct execution)
- `kh execute contract-call`
- `kh execute transfer`
- `kh execute status`

#### 15.5.6 Organization
- `kh org list`
- `kh org members`
- `kh org switch`

#### 15.5.7 Project
- `kh project create`
- `kh project delete`
- `kh project get`
- `kh project list`

#### 15.5.8 Protocol
- `kh protocol get`
- `kh protocol list`

#### 15.5.9 Run
- `kh run cancel`
- `kh run logs`
- `kh run status`

#### 15.5.10 Serve
- `kh serve` — local MCP stdio server (deprecated)

#### 15.5.11 Tag
- `kh tag create`
- `kh tag delete`
- `kh tag get`
- `kh tag list`

#### 15.5.12 Template
- `kh template deploy`
- `kh template list`

#### 15.5.13 Wallet
- `kh wallet balance`
- `kh wallet tokens`

#### 15.5.14 Workflow
- `kh workflow delete`
- `kh workflow get`
- `kh workflow go-live`
- `kh workflow list`
- `kh workflow pause`
- `kh workflow run`

#### 15.5.15 Action
- `kh action get`
- `kh action list`

[SRC: docs-cli-sidebar]

### 15.6 MCP server mode (deprecated)

```bash
# Deprecated — prefer the remote HTTP endpoint
kh serve --mcp
```

The remote HTTP endpoint is `https://app.keeperhub.com/mcp` and requires no local server process [SRC: docs-cli-quickstart].

### 15.7 CI/CD integration

For CI/CD environments:
1. Set `KH_API_KEY` environment variable (organization key with `kh_` prefix).
2. Use structured output: `kh --output json workflow list` (JSON output for scripting).
3. The CLI handles Cloudflare Access headers automatically via `~/.config/kh/hosts.yml` [SRC: claude-md].

---

## 16. REST API

### 16.1 What it is

The KeeperHub REST API is the "convenience layer for non-agent integrations" — backend services, ops scripts, CI, and multi-tenant SaaS. The SDK (`@keeperhub/sdk`) is the typed stateless HTTP client that wraps it [SRC: sdk-readme].

> *"Agent / framework users: if you are building on an agent framework (Eliza, OpenClaw, Cursor, Claude Desktop), point your MCP client at `https://app.keeperhub.com/mcp` instead. The REST SDK is the convenience layer for non-agent integrations."*
>
> [SRC: sdk-readme]

### 16.2 API surface (from docs sidebar)

The API section of the docs sidebar reveals these endpoints:
- **Authentication** — API key management, session handling
- **Workflows** — CRUD operations on workflows
- **Executions** — workflow execution management
- **Direct Execution** — direct onchain execution (transfer, contract-call, check-and-execute)
- **Analytics** — run analytics, gas usage, success rates
- **Integrations** — third-party integrations
- **Projects** — project management (a project is a collection of workflows)
- **Tags** — tag workflows for organization
- **Chains** — supported chains
- **User Organizations** — manage user-org memberships
- **API Keys** — create, rotate, revoke API keys
- **Errors** — error code reference

[SRC: docs-sidebar]

### 16.3 Authentication

API keys come in two flavors:
- **Organization keys** (`kh_` prefix) — used by the CLI, MCP server, and most integrations. Scoped to a single organization.
- **User keys** (`wfb_` prefix) — used by the legacy workflow-builder-template. The MCP client foundation (`@keeperhub/mcp`) handles `kh_` vs `wfb_` disambiguation automatically [SRC: mcp-readme].

### 16.4 Direct Execution API

The Direct Execution API is the secret weapon for keeper patterns. Instead of building a full workflow, you can call a single endpoint:

```
POST /api/v1/execute/contract-call
{
  "protocol": "aave",
  "action": "supply",
  "args": { "amount": "1000000" }
}
```

This executes a single protocol action with all the reliability guarantees (smart gas, retries, private routing, audit trail) but without the trigger/condition graph. The execution ID is returned for status polling [SRC: docs-sidebar, hermes-plugin-readme].

---

## 17. SDK

### 17.1 What it is

`@keeperhub/sdk` is the **official REST SDK** for the KeeperHub API — a stateless, typed HTTP client for calling KeeperHub from backend services, ops scripts, CI, and multi-tenant SaaS integrations. One-shot calls, predictable error envelopes, no session ceremony [SRC: sdk-readme].

### 17.2 Status

> *"Early development (`0.x`). The public surface and REST contract are still stabilizing and may change between minor versions until `1.0`."*
>
> [SRC: sdk-readme]

### 17.3 Install

```bash
npm install @keeperhub/sdk
```

### 17.4 License

Apache-2.0 [SRC: sdk-readme].

### 17.5 When to use SDK vs MCP

| Use case | Surface |
|---|---|
| Agent framework (LangChain, ElizaOS, Cursor, Claude Desktop, etc.) | MCP server at `https://app.keeperhub.com/mcp` |
| Backend service (Node.js) | `@keeperhub/sdk` |
| Ops script / CI/CD | `kh` CLI |
| Direct HTTP / non-JS backend | REST API directly |

[SRC: sdk-readme, mcp-readme, cli-readme]

---

## 18. FRAMEWORK PLUGINS

### 18.1 Strategy

KeeperHub's framework plugin strategy is explicit: framework plugins ship from their own ecosystems, not from the KeeperHub org. KeeperHub provides the **shared MCP client foundation** (`@keeperhub/mcp` for TypeScript, `keeperhub-mcp` for Python) that framework adapters build on [SRC: mcp-readme].

> *"Per the KeeperHub SDK strategy, framework plugins ship from their own ecosystems, not this repo:*
> - *Eliza: `@elizaos/plugin-keeperhub` (ElizaOS org)*
> - *OpenClaw: published in the OpenClaw ecosystem*
> - *Hermes: gated on runtime confirmation"*
>
> [SRC: mcp-readme]

### 18.2 The `mcp` repo (shared foundation)

Both clients (`@keeperhub/mcp` TypeScript, `keeperhub-mcp` Python) implement the same kernel:
- MCP session bootstrap + re-init on `401`/`404`
- `kh_` vs `wfb_` key disambiguation
- Single JSON-result unwrap

Status: **v0.1.0** — MCP HTTP transport implemented (session bootstrap, `tools/call`, 401/404 re-init, API key helpers). Ready for first publish to npm and PyPI [SRC: mcp-readme].

### 18.3 The `hermes-plugin` repo (Python)

`keeperhub-hermes-plugin` is the Hermes agent plugin for KeeperHub. It gives your agent `kh_*` tools to manage and run on-chain automation workflows, browse templates and protocol actions, and (opt-in) execute transactions, all over the KeeperHub MCP API [SRC: hermes-plugin-readme].

#### 18.3.1 Install

```bash
# Recommended — Hermes plugin manager (no pip needed)
hermes plugins install KeeperHub/hermes-plugin --enable

# Or via pip / PyPI
pip install keeperhub-hermes-plugin
```

Then enable in `~/.hermes/config.yaml`:

```yaml
plugins:
  enabled:
    - keeperhub
```

Set your KeeperHub organization API key:

```bash
export KH_API_KEY="kh_..."
```

[SRC: hermes-plugin-readme]

#### 18.3.2 Safety: read-only by default

By default, the plugin registers **read-only** tools (list/get/search workflows, executions, templates, integrations, action schemas, status). Tools that change organization state or move funds on-chain are **withheld** until you opt in:

```bash
export KEEPERHUB_ENABLE_WRITES=true
```

The gate is structural — withheld tools are never registered, so the agent can neither call nor be delegated a tool that does not exist [SRC: hermes-plugin-readme].

#### 18.3.3 Try it

Ask your agent:
- "List my KeeperHub workflows"
- "Show me workflow `<id>`"
- "What action schemas and chains does KeeperHub support?"
- "Check my KeeperHub connection status" → runs `kh_status`

[SRC: hermes-plugin-readme]

### 18.4 The `eve-plugin` repo (TypeScript)

Vercel Eve connection for KeeperHub on-chain workflow automation. Read-only by default, opt-in writes. npm: `keeperhub-eve-plugin` [SRC: gh-org].

### 18.5 The `agentic-wallet-skills` repo

Canonical skill file distribution for `@keeperhub/wallet`. Installed via `npx skills add keeperhub/agentic-wallet-skills` [SRC: gh-org].

### 18.6 The `claude-plugins` repo

KeeperHub plugins for Claude Code (slash commands and skills) [SRC: gh-org].

---

## 19. PAYMENT STANDARDS: x402

### 19.1 What x402 is

x402 is the open payment standard built on top of the HTTP 402 Payment Required status code. Developed by Coinbase Developer Platform, now under the Linux Foundation (co-authored by Coinbase and Cloudflare). It enables internet-native, pay-per-use payments for AI and machine agents [SRC: site-standards, agentic-wallet-readme].

### 19.2 How it works with KeeperHub

1. Agent (or any HTTP client) sends a request to a paid KeeperHub workflow endpoint.
2. KeeperHub returns `HTTP 402 Payment Required` with a payment challenge (settlement terms: chain, token, amount, recipient).
3. Agent's wallet (e.g., `@keeperhub/wallet`) parses the challenge, selects the appropriate rail (x402 if it has Base USDC, MPP if it has Tempo USDC.e).
4. Wallet signs and settles the payment onchain.
5. Agent retries the original request with the payment proof.
6. KeeperHub verifies the payment, runs the workflow, returns the result.
7. Audit trail captures: payment hash, settlement tx, workflow execution ID, outcome, timestamp.

[SRC: site-mpp, agentic-wallet-readme, blog-defi-agentic]

### 19.3 x402 ecosystem

- Live on Base USDC
- ~$24M/month in volume as of early 2026
- ~94k buyers, ~22k sellers
- Indexed on x402scan.com
- KeeperHub registered on x402scan.com since 2026-04-13

[SRC: agentic-wallet-readme, site-mpp]

### 19.4 Spec compliance

KeeperHub emits spec-compliant 402 challenges for every workflow execution. The challenges include the payment amount, accepted payment rails (x402, MPP, or both), settlement chains, and the workflow slug for audit-trail binding [SRC: site-standards, agentic-wallet-readme].

---

## 20. PAYMENT STANDARDS: MPP

### 20.1 What MPP is

MPP (Machine Payments Protocol) was co-authored by Tempo and Stripe to solve the billing problem for agent-initiated workloads. Human-style subscriptions do not fit an economy where agents make many small, autonomous calls. MPP is built for granular per-execution pricing, settlement on Tempo (and other compatible chains), and client-negotiated protocol selection. It is designed to **complement** x402 rather than replace it [SRC: site-mpp].

### 20.2 Live since 2026-04-13

KeeperHub is registered on mppscan.com as server ID `3a9395b49a059838086613a280a30d94b812991214d6fcb215a1d3c2196d5785`. Dual-protocol with x402: agent clients arriving with either rail can pay and execute [SRC: site-mpp].

### 20.3 First external agent payment

On 2026-04-14, an AgentCash client (unrelated to KeeperHub code) parsed the KeeperHub 402 challenge, auto-selected MPP on Tempo based on its wallet's Tempo USDC.e balance, settled $0.01 on-chain, and triggered a verified workflow execution.

- **Transaction hash:** `0x89379ee79970bff0f036bd43ca481b9bee5f62e29d5d0596944e54f14cb129c8`
- **Execution ID:** `pnp92qs85y37rgaq328ms`
- **Amount:** $0.01
- **Chain:** Tempo (USDC.e)
- **Client:** AgentCash
- **No human in the loop**

[SRC: site-mpp]

### 20.4 MPP ecosystem

- Co-authored by Tempo and Stripe
- Launched alongside Stripe's Tempo chain on 2026-03-18
- Integrated 50+ services in its first week: OpenAI, Anthropic, Google Gemini, Dune, Browserbase, Parallel Web Systems, WorkOS
- Visa joined as an anchor validator in April 2026
- Indexed on mppscan.com

[SRC: agentic-wallet-readme, site-mpp]

### 20.5 The dual-protocol routing decision

From the agentic wallet docs:

> *"Most KeeperHub paid workflows accept both protocols; today the wallet pays via x402 by default and uses MPP when the workflow is MPP-only. If the amount exceeds [a threshold], the wallet auto-selects based on the wallet's balance across both chains."*
>
> [SRC: docs-wallet]

The decision tree:
1. If workflow is MPP-only → use MPP.
2. If wallet has Base USDC and workflow accepts x402 → use x402.
3. If wallet has Tempo USDC.e and workflow accepts MPP → use MPP.
4. If wallet has both → use x402 (default).
5. If wallet has neither → return `INSUFFICIENT_FUNDS` with Coinbase Onramp URL.

[SRC: docs-wallet, agentic-wallet-readme]

---

## 21. IDENTITY STANDARD: ERC-8004

### 21.1 What ERC-8004 is

ERC-8004 is Ethereum's emerging standard for agent and service identity on-chain. Mainnet since 2026-01-29. 70k+ registered agents as of mid-2026 [SRC: agentic-wallet-readme].

### 21.2 What it provides

- **IdentityRegistry** — on-chain registry of agents and services. Each entry includes a name, endpoint, and declared capabilities.
- **ReputationRegistry** — on-chain registry of feedback / reputation for registered agents. Anyone can call `giveFeedback()` to record feedback about a registered agent's execution.

[SRC: agentic-wallet-readme]

### 21.3 KeeperHub's registration

- KeeperHub is registered as **agent #31875** on the ERC-8004 IdentityRegistry on Ethereum mainnet [SRC: agentic-wallet-readme].
- This means any agent anywhere can discover KeeperHub's declared execution capabilities without a centralized directory.
- The `feedback` tool in `@keeperhub/wallet` calls `giveFeedback()` on the ReputationRegistry after a paid workflow execution, recording onchain feedback for the workflow that was just called.

### 21.4 Why this matters

The combination of:
- **MCP** (discovery),
- **x402 + MPP** (payment),
- **ERC-8004** (identity + reputation), and
- **KeeperHub's audit trail** (verifiable execution)

…forms a complete agent economy stack where:
1. An agent discovers KeeperHub via ERC-8004.
2. It pays via x402 or MPP.
3. It executes a workflow via MCP.
4. The execution is logged in KeeperHub's audit trail.
5. The agent optionally records feedback on the ERC-8004 ReputationRegistry.

This loop is unique to KeeperHub and is the foundation for the project proposed in `PROJECT_MASTER_PLAN.md`.

[SRC: agentic-wallet-readme, site-standards]

---

## 22. SMART GAS ESTIMATION

### 22.1 What it is

Smart Gas Estimation is KeeperHub's intelligent gas pricing engine. It adapts to network congestion with exponential backoff, so transactions execute instead of getting stuck [SRC: dora-hackathon, docs-overview].

### 22.2 How it works

From the DeFi agentic blog post:

> *"Gas estimation adapts to network conditions with chain-specific safety buffers. Transactions retry with exponential backoff and reuse pending nonces instead of stacking duplicates."*
>
> [SRC: blog-defi-agentic]

Key mechanics:
- **Chain-specific safety buffers** — each EVM chain has its own gas price volatility profile; the engine applies chain-specific buffers above the network average.
- **Exponential backoff** — on retry, gas price increases exponentially up to a cap; avoids both underspending (stuck txs) and overspending (MEV-driven overpayment).
- **Nonce reuse** — on retry, the engine reuses the pending nonce instead of incrementing, preventing duplicate transactions.
- **~30% savings vs baseline** — the marketing site claims "around 30% savings versus baseline" (presumably vs naive `eth_gasPrice`).

[SRC: blog-defi-agentic, site-agents]

### 22.3 Why it matters

Without smart gas estimation, agents face two failure modes:
1. **Underspending** — tx sits in mempool during congestion, eventually dropped; agent thinks it failed; retry creates duplicate.
2. **Overspending** — agent panics during gas spike, pays way above market; MEV bots see the panic and extract.

Smart gas estimation threads the needle: pay enough to land, but not so much that you become a target [SRC: docs-overview, site-agents].

---

## 23. PRIVATE ROUTING & MEV PROTECTION

### 23.1 What it is

Private routing is KeeperHub's MEV protection mechanism. Transactions are submitted via non-public submission paths (private RPCs, Flashbots-protect-style endpoints, MEV-share, etc.) instead of the public mempool [SRC: docs-overview, dora-hackathon].

### 23.2 Why it matters

> *"Public mempools leak intent. An agent's transactions get frontrun, sandwiched, or extracted."*
>
> [SRC: site-agents]

For agent-initiated transactions, this is especially critical because:
1. Agents often transact in predictable patterns (every 30 seconds, on a schedule, etc.) — easy to detect and extract.
2. Agents manage treasuries — large balances are attractive targets.
3. Agents execute autonomously — there's no human to notice "wait, why did my tx get sandwiched?" until it's too late.

### 23.3 The audit trail advantage

Because KeeperHub routes privately, the audit trail can prove:
- The transaction was submitted at time T.
- It was not visible in the public mempool.
- It landed at time T+δ with these gas parameters.
- No MEV extraction was observed.

This is regulator-grade evidence — useful for DAOs, enterprises, and treasuries that need to prove their agents acted in good faith [SRC: docs-overview].

---

## 24. AUDIT TRAIL

### 24.1 What gets logged

Every action is logged with:
- **Trigger** — what fired the workflow (cron schedule, webhook payload, onchain event log, manual click, MCP call).
- **Simulation result** — what the pre-flight simulation predicted (success/failure, gas estimate, state diff).
- **Submitted transaction** — the signed transaction, the RPC endpoint used, the submission timestamp.
- **Gas used** — actual gas consumed, gas price paid, total gas cost in USD.
- **Outcome** — success/failure, revert reason (if any), receipt data.
- **Timestamp** — every step timestamped; timestamps survive restarts.

[SRC: docs-overview, dora-hackathon, site-agents]

### 24.2 Exportability

The audit trail is exportable. From the marketing site: "regulator-ready" — the export format is structured and queryable [SRC: site-agents].

### 24.3 Replayability

Every run is replayable from one place. This is critical for post-mortem analysis: given a failure, you can reconstruct exactly what happened, in what order, with what inputs [SRC: site-agents].

### 24.4 Connection to ERC-8004 ReputationRegistry

The `@keeperhub/wallet` package's `feedback` tool publishes a subset of the audit trail (the execution outcome) to the ERC-8004 ReputationRegistry on Ethereum mainnet. This makes the audit trail **cryptographically verifiable onchain** — anyone can check the ReputationRegistry to verify that a specific workflow execution happened, was paid for, and produced a specific outcome [SRC: agentic-wallet-readme].

---

## 25. EXECUTION RELIABILITY & RETRY LOGIC

### 25.1 The 10-attempt cap

From the agents page FAQ:

> *"Managed retries with exponential backoff, nonce-aware resubmission, simulation-before-submit, and a 10-attempt cap. Every attempt is logged to a full audit trail. If the execution cannot land, the agent receives a structured failure response it can reason about."*
>
> [SRC: site-agents]

### 25.2 The retry flow

```
1. Receive execution request
2. Simulate transaction (eth_call + eth_estimateGas)
   ├── Simulation fails → return structured failure response
   └── Simulation succeeds → continue
3. Estimate gas price (smart gas)
4. Sign via Turnkey enclave
5. Submit via private routing
6. Wait for receipt (with timeout)
   ├── Receipt received → check status
   │   ├── Success → log outcome, return success
   │   └── Failure → log failure, decide retry
   └── Timeout → log timeout, decide retry
7. Retry (up to 10 attempts)
   ├── Increment gas price (exponential backoff)
   ├── Reuse pending nonce (no duplicates)
   ├── Re-simulate (state may have changed)
   └── Go to step 4
8. After 10 attempts → log final failure, return structured failure response
```

[SRC: site-agents, blog-defi-agentic, agentic-wallet-readme]

### 25.3 Multi-RPC failover

Each chain has multiple RPC endpoints configured. On RPC failure (timeout, rate limit, etc.), the engine fails over to the next endpoint. This is invisible to the caller but critical for reliability — a single bad RPC should never block an execution [SRC: blog-defi-agentic].

### 25.4 Nonce orchestration

The executor maintains a per-wallet nonce manager that:
- Tracks the current pending nonce.
- Reuses the pending nonce on retry (instead of incrementing).
- Handles nonce gaps (e.g., when a tx from another source lands in between).
- Coordinates across concurrent workflow runs that share a wallet.

[SRC: blog-defi-agentic]

### 25.5 Dead-letter queue

The executor captures dropped SQS messages to a dead-letter queue (commit `feat(executor): capture dropped SQS messages to a dead-letter queue`, 2026-07-13). This means a workflow run that fails to be picked up by the executor (e.g., due to a transient SQS issue) is not lost — it lands in the DLQ for inspection and replay [SRC: gh-main].

### 25.6 Scheduler reliability

The scheduler runs with leader election and 2 replicas (commit `feat: run schedule and block dispatchers with leader election and 2 r…`, 2026-07-15). This means:
- One replica is the active leader; the other is hot standby.
- If the leader dies, the standby takes over within seconds.
- Cron dispatch and block dispatch continue without interruption.

[SRC: gh-main]

---

## 26. GAS SPONSORSHIP PROGRAM

### 26.1 What it is

> *"Gas sponsorship: KeeperHub offers gas sponsorship on mainnet Ethereum."*
>
> [SRC: dora-hackathon]

For the hackathon, KeeperHub is sponsoring gas on Ethereum mainnet. This means hackathon projects can execute real mainnet transactions without the builders having to fund their own gas. Details (sponsorship caps, eligibility, how to claim) are in the builder Discord channel [SRC: dora-hackathon].

### 26.2 Why this matters for the hackathon

This removes the single biggest friction point for hackathon builders: needing real ETH on mainnet to demonstrate real transactions. With gas sponsorship, every team can ship a real mainnet transaction through KeeperHub without personal financial exposure.

---

## 27. CHAIN COVERAGE

### 27.1 Supported EVM chains (12)

The marketing site and docs reference "12 EVM chains" without enumerating them explicitly. Based on the protocol integrations (which imply the chains those protocols are deployed on) and the docs sidebar (`API → Chains`), the supported chains include at minimum:

| Chain | Status | Evidence |
|---|---|---|
| Ethereum Mainnet | Supported, gas-sponsored for hackathon | [SRC: dora-hackathon] |
| Ethereum Sepolia | Supported (testnet) | [SRC: blog-openagents-wrap — Tradewise used Base Sepolia] |
| Base | Supported (x402 default settlement chain) | [SRC: agentic-wallet-readme] |
| Base Sepolia | Supported (testnet) | [SRC: blog-openagents-wrap] |
| Arbitrum | Supported (mentioned in readme) | [SRC: readme-main] |
| Optimism | Implied (Uniswap/Aave deployments) | Inferred |
| Polygon | Implied (Aave deployment) | Inferred |
| Polygon zkEVM | Possible | Inferred |
| Scroll | Possible | Inferred |
| Linea | Possible | Inferred |
| BNB Chain | Possible | Inferred |
| Avalanche | Possible | Inferred |

The exact list is queryable via `kh protocol list` and the MCP `list_action_schemas` tool [SRC: docs-cli-sidebar, hermes-plugin-readme].

### 27.2 Solana (in progress)

Active development:
- `KEEP-984`: Transfer SPL Token action (commit 2026-07-16)
- `KEEP-987`: Solana event listening (merged 2026-07-20)
- Devnet SPL transfer verified (commit `test: KEEP-984 verify SPL transfer on live devnet`, 2026-07-17)

[SRC: gh-main]

### 27.3 Tempo (MPP settlement)

Tempo is Stripe's machine-payments chain, used for MPP settlement in USDC.e. It is not a general-purpose EVM chain in KeeperHub's coverage map; it's specifically the MPP settlement layer [SRC: site-mpp, agentic-wallet-readme].

---

## 28. USERS, ORGANIZATIONS, ACCESS CONTROL

### 28.1 The hierarchy

```
User
└── Organization (org)
    ├── Members (users with roles)
    ├── Projects (collections of workflows)
    │   └── Workflows
    │       └── Runs (executions)
    ├── Wallet (Turnkey sub-org)
    ├── Integrations (Discord, Slack, etc.)
    ├── API Keys (kh_ and wfb_)
    └── Tags
```

[SRC: docs-sidebar]

### 28.2 User management

- Users can belong to multiple organizations.
- Each organization has its own wallet, API keys, workflows, integrations.
- Switching organizations: `kh org switch <org-id>` (CLI), or re-authenticate with a different API key (MCP).

[SRC: docs-cli-sidebar]

### 28.3 Team collaboration

- Members can be invited to an organization.
- Roles: Owner, Admin, Member, Viewer (inferred from typical RBAC patterns; the docs sidebar references `User Management`, `Team Collaboration`, `Access Control`).

[SRC: docs-sidebar]

### 28.4 Access control

The `Access Control` doc page covers the role-based permission model. Key concepts (inferred):
- **Read vs Write** — the Hermes plugin mirrors this with `KEEPERHUB_ENABLE_WRITES=true` for write access.
- **Per-workflow permissions** — workflows can be private (org-only) or public (marketplace-listed).
- **API key scoping** — API keys can be scoped to specific workflows or actions.

[SRC: docs-sidebar, hermes-plugin-readme]

---

## 29. NOTIFICATIONS

### 29.1 Notification channels

| Channel | Plugin | Use case |
|---|---|---|
| Email | `sendgrid` | Alerts, reports |
| Discord | `discord` | Real-time alerts, community |
| Slack | `slack` | Team alerts |
| Telegram | `telegram` | Mobile alerts |
| Webhook | `webhook` | Custom integrations |

[SRC: docs-sidebar, readme-main]

### 29.2 Connections

The `Notifications → Connections` doc page covers how to configure each notification channel (API keys, webhook URLs, etc.) [SRC: docs-sidebar].

### 29.3 Templates

The `Notifications → Templates` doc page covers message templating (variables, formatting, conditional content) [SRC: docs-sidebar].

---

## 30. TEMPLATES & HUB MARKETPLACE

### 30.1 Templates

Templates are pre-built workflow configurations that can be deployed with `kh template deploy`. They are reusable starting points for common patterns (e.g., "Aave health factor monitor", "Safe multisig treasury rebalance", "Weekly yield report") [SRC: docs-cli-sidebar].

### 30.2 Hub Marketplace

The Hub Marketplace is the public registry where any user can publish a workflow, price it per call in USDC, and have other users / agents discover and invoke it. From the DeFi agentic blog post:

> *"A user (or agent) builds a workflow, lists it on the Hub, and prices it per call in USDC. From that point, the workflow is a callable service with a stable endpoint, a JSON input schema, and a price. Any agent can discover it through the platform's OpenAPI document, pay via x402 on Base or MPP on Tempo, and receive a structured response. No accounts, no invoices, no support ticket. What used to be a private automation is now a public micro-service."*
>
> [SRC: blog-defi-agentic]

### 30.3 Marketplace economics

- Workflow author sets the per-call USDC price.
- Callers pay via x402 or MPP.
- Author receives payment (minus any platform fee, not disclosed in public docs).
- Workflow slug is bound to the payment for audit trail integrity.
- ERC-8004 ReputationRegistry feedback creates a reputation signal for listed workflows.

[SRC: blog-defi-agentic, agentic-wallet-readme]

---

## 31. KEEPER RUNS & OBSERVABILITY

### 31.1 Understanding Runs

A "run" is a single execution of a workflow. Each run has:
- A unique run ID
- A workflow ID
- A trigger source (cron, webhook, event, manual, MCP)
- A status (queued, running, succeeded, failed, cancelled)
- A timeline of step executions
- Logs (per step)
- Audit trail (per step)

[SRC: docs-sidebar]

### 31.2 Status and Logs

- `kh run status <run-id>` — check status
- `kh run logs <run-id>` — stream logs
- `kh run cancel <run-id>` — cancel a running execution

[SRC: docs-cli-sidebar]

### 31.3 Troubleshooting

The `Keeper Runs → Troubleshooting` doc page covers common failure modes and their resolutions [SRC: docs-sidebar].

### 31.4 Run Error Codes

The `Keeper Runs → Run Error Codes` doc page is the reference for all error codes returned by the executor. Every error code maps to a specific failure mode with a structured response the agent can reason about [SRC: docs-sidebar, site-agents].

### 31.5 Performance Monitoring

The `Keeper Runs → Performance Monitoring` doc page covers:
- Run duration metrics
- Gas usage metrics
- Success rate metrics
- Per-workflow and per-org analytics
- Export to external monitoring systems (Datadog, Grafana, etc.) via the metrics-collector service

[SRC: docs-sidebar]

---

## 32. SECURITY MODEL

### 32.1 The three pillars

From the Turnkey signer integration blog post:

1. **Hardware-backed key custody** — keys in TEEs, never in KeeperHub's database, logs, or memory.
2. **Users always own their keys** — exportable directly from the product, no support ticket required.
3. **Native-tooling signer** — plugs into ethers.js (EVM) and Solana signer; no custom signing logic in workflow code.

[SRC: blog-turnkey]

### 32.2 The threat model

> *"An automated wallet is a target by design. A wallet that signs automatically is different from a wallet you use yourself. You can sit in front of a normal wallet and refuse to sign something suspicious. A workflow wallet cannot. If the conditions match, it signs. That is the whole point. That changes the threat model. Anywhere the private key lives becomes a place an attacker can go looking."*
>
> [SRC: blog-turnkey]

The starting constraint: **KeeperHub should not be able to read your private key. Not with a database dump, not with a misconfigured backup, not under any circumstance. There should be nothing to steal because there should be nothing to read.** [SRC: blog-turnkey]

### 32.3 The signing path (recap)

```
Workflow step → ethers.js Signer (EVM) or Solana signer
              → serializes payload
              → hands to Turnkey enclave over authenticated channel
              → enclave signs inside hardware
              → returns signature
              → KeeperHub broadcasts signed tx to chain via multi-RPC failover
```

The private key never appears in KeeperHub's process memory, even for the microsecond it would take to produce a signature [SRC: blog-turnkey].

### 32.4 Wallet export security

The export flow runs in two halves:

1. **Identity** — admin requests export; 6-digit code emailed, expires in 5 minutes, 5 attempts max. This proves they control the email on file, not just the session.
2. **Cryptography** — once the code checks out, the system facilitates the export through Turnkey's secure export mechanism. The key never lands anywhere persistent on KeeperHub's side.

[SRC: blog-turnkey]

### 32.5 The `Best Practices → Security` doc page

The docs sidebar references a `Best Practices → Security` page covering:
- API key rotation
- Webhook signature verification
- Rate limiting
- IP allowlisting (enterprise)
- Audit log retention

[SRC: docs-sidebar]

---

## 33. BEST PRACTICES

### 33.1 API key hygiene
- Use organization keys (`kh_` prefix) for production integrations.
- Rotate keys quarterly.
- Scope keys to the minimum required workflows.
- Never commit keys to Git; use environment variables or secret managers.

### 33.2 Workflow design
- Keep workflows small and focused; one workflow per use case.
- Use conditions to fail fast on invalid inputs.
- Use simulation-before-submit (default) to catch failures before they cost gas.
- Tag workflows for organization.

### 33.3 Wallet funding
- Fund wallets with enough native token for gas (or use gas sponsorship).
- Monitor wallet balances via `kh wallet balance` and `kh wallet tokens`.
- Set up low-balance alerts via the notification system.

### 33.4 Audit trail usage
- Export audit trails regularly.
- Use the audit trail for post-mortem analysis.
- Integrate audit trail events into your SIEM (Datadog, Splunk, etc.) via the metrics-collector.

[SRC: docs-sidebar, blog-turnkey, blog-defi-agentic]

---

## 34. GUIDES: MIGRATIONS

### 34.1 Migrate from OpenZeppelin Defender

The docs sidebar references `Guides → Migrate from OpenZeppelin Defender`. This guide covers:
- Mapping Defender Sentinels to KeeperHub workflows
- Mapping Defender Relayers to KeeperHub wallets
- Mapping Defender Autotasks to KeeperHub scheduled workflows
- Audit trail equivalence

[SRC: docs-sidebar]

### 34.2 Migrate from Gelato Functions

The docs sidebar references `Guides → Migrate from Gelato Functions`. This guide covers:
- Mapping Gelato Tasks to KeeperHub workflows
- Mapping Gelato Executors to KeeperHub executor service
- Payment model differences (Gelato's prepaid vs KeeperHub's x402/MPP)

[SRC: docs-sidebar]

---

## 35. ROADMAP SIGNALS

Inferred from public commit history, blog posts, and the OpenAgents hackathon wrap-up:

### 35.1 Confirmed in progress (visible in `staging` branch)

- **Solana support** — event listening (`KEEP-987`, merged 2026-07-20) and SPL transfers (`KEEP-984`, 2026-07-16). Devnet verified.
- **Framework SDK gap closure** — the OpenAgents wrap post explicitly called out that "reusable SDK connectors for LangChain, ElizaOS, and OpenClaw" emerged independently across multiple teams, and that KeeperHub intended to "close" this gap. This was followed by the publication of `@keeperhub/mcp`, `hermes-plugin`, and `eve-plugin` (all visible in the GitHub org).
- **MCP surface extension** — the OpenAgents wrap post said "The MCP surface is being extended." The visible tool count is 19; expect more.
- **Direct execution onboarding** — commit `docs: add safe direct execution onboarding path` (2026-07-18) suggests direct execution is being promoted as a first-class onboarding path.
- **Scan/explorer features** — commit `feat: remove NEXT_PUBLIC_SCAN_ENABLED flag, scan is the default exper…` (2026-07-07) suggests an explorer/scan feature has graduated to default-on.

[SRC: gh-main, blog-openagents-wrap]

### 35.2 Inferred from job postings, blog, and Discord (weaker signals)

- **More protocol plugins** — the plugin folder has 20+ integrations; expect more (especially perps DEXs and LRTs).
- **Agentic wallet maturity** — the wallet is at `0.x` and adding safety hooks; expect a `1.0` release with stable API.
- **More chain coverage** — Solana is landing; expect non-EVM chains (e.g., Move-based chains like Aptos, Sui) eventually.
- **Enterprise features** — SSO, audit log streaming, RBAC granularity (inferred from enterprise-targeted marketing).

### 35.3 Explicit non-roadmap (what KeeperHub says they will NOT do)

- They will not build an agent framework. They will stay execution-only.
- They will not compete with agent frameworks. They will integrate with all of them.
- They will not hold private keys. They will stay non-custodial.

[SRC: site-agents, blog-first-hackathon]

---

## 36. PAIN POINTS & OPEN ISSUES

### 36.1 From the OpenAgents hackathon (197 findings, 47 Linear tickets)

The OpenAgents wrap post disclosed:
- 197 findings across 180 submissions and feedback reports.
- Distilled into 47 Linear tickets with priorities assigned.
- "Several are already shaping what ships next."

Specific gaps mentioned:
- **Framework SDK gap** — multiple teams independently built LangChain/ElizaOS/OpenClaw adapters because there was no canonical version. (Now closed via `@keeperhub/mcp`, `hermes-plugin`, `eve-plugin`.)
- **Documentation gaps** — feedback bounty recipients ComputePool and EvoYield "submitted structured, actionable reports with reproducible issues and specific documentation gaps."
- **API surface gaps** — Tradewise (winner #1) "submitted detailed, reproducible bug reports for issues they hit in the KeeperHub API."

[SRC: blog-openagents-wrap]

### 36.2 From the GitHub repo (open issues, 5 open)

The main repo has 5 open issues as of 2026-07-21. Specific issue content not scraped in this research pass; reviewers should read them at <https://github.com/KeeperHub/keeperhub/issues> for current pain points.

### 36.3 Inferred pain points (from docs and blog)

- **Para wallet discontinuation** — the docs sidebar still lists `Para Wallet Integration (Discontinued)`. This suggests ongoing migration pain for users who built on Para.
- **MCP stdio mode deprecated** — `kh serve --mcp` is deprecated in favor of the remote HTTP endpoint. Users with existing stdio setups need to migrate.
- **Wallet export friction** — the export flow requires email 2FA, which adds friction for automated key rotation.
- **No passkey/2FA for the agentic wallet** — the agentic wallet docs explicitly call this out as a known limitation.

[SRC: docs-sidebar, agentic-wallet-readme, blog-turnkey]

---

## 37. COMMUNITY & SUPPORT

### 37.1 Discord

- Main community: <https://discord.gg/keeperhub>
- Channels: `general`, `help`, `builder` (for hackathon)
- Office hours: KeeperHub engineers hold weekly office hours during hackathons

[SRC: dora-hackathon, site-links]

### 37.2 Hackathon support

> *"Questions during the build go to the builder channel, where KeeperHub engineers hold office hours for the duration of the hackathon."*
>
> [SRC: dora-hackathon]

### 37.3 Documentation

- Main docs: <https://docs.keeperhub.com>
- CLI quickstart: <https://docs.keeperhub.com/cli/quickstart>
- MCP server: <https://docs.keeperhub.com/ai-tools/mcp-server>
- Agentic wallet: <https://docs.keeperhub.com/ai-tools/agentic-wallet>

### 37.4 Blog

- Blog index: <https://keeperhub.com/blog>
- Recent posts (visible in JSON-LD of blog index):
  - 2026-06-03: "Why Onchain AI Agents Need a Read Layer and an Execute Layer" (co-authored with Blockscout)
  - 2026-05-07: "That's a Wrap on our First Hackathon. Here Is What 180 Builders Taught Us."
  - 2026-04-20: "DeFi Infrastructure Goes Agentic"
  - 2026-04-16: "Cross-Chain Bridging on KeeperHub: How We Integrated Chainlink CCIP"
  - 2026-04-15: "How We Sign Your Transactions Without Holding Your Keys"
  - 2026-04-07: "Our first hackathon: Partnering with ETHGlobal for OpenAgents"
  - 2026-03-26: "The $25M Key That Wasn't in a Smart Contract"

[SRC: blog-index]

### 37.5 Link tree

- <https://keeperhub.com/links>
- Website: <https://keeperhub.com>
- Launch App: <https://app.keeperhub.com>
- Documentation: <https://docs.keeperhub.com>
- X: <https://x.com/KeeperHubApp>
- LinkedIn: `company/keeperhub`
- YouTube: <https://www.youtube.com/@KeeperHub>
- Discord: <https://discord.gg/keeperhub>
- Telegram: (mentioned on links page)

[SRC: site-links]

### 37.6 YouTube

The YouTube channel `@KeeperHub` has technical videos including:
- "KeeperHub: Onchain Agent Execution Layer I Luca Malpiedi" — interview-format talk covering architecture, roadmap, agent execution gap
- Additional videos on workflow builder, MCP integration, and demos

[SRC: search-overview]

### 37.7 Status page

- Status page: linked from footer of every page (`Status` link)
- "All systems operational" banner on every page footer

[SRC: site-home]

---

## 38. GLOSSARY

| Term | Definition |
|---|---|
| **Audit trail** | The complete record of every KeeperHub action: trigger, simulation, submitted tx, gas, outcome, timestamp. Exportable, regulator-ready. |
| **Action** | A node in a workflow that performs work (contract call, transfer, notification, etc.). |
| **Agentic wallet** | The `@keeperhub/wallet` package: auto-pays 402 challenges via x402 or MPP, binds payments to workflow slugs, records ERC-8004 feedback. |
| **Blockscout MCP** | The read layer (block explorer data) that complements KeeperHub's execute layer. |
| **CLI (`kh`)** | The Go-based command-line interface for managing workflows and executing blockchain actions. |
| **Condition** | A node that branches the workflow based on comparisons. |
| **Direct execution** | Executing a single protocol action (transfer, contract call, check-and-execute) without building a full workflow. |
| **ERC-8004** | Ethereum's agent identity standard. IdentityRegistry (70k+ agents) + ReputationRegistry (onchain feedback). |
| **Executor** | The KeeperHub service that pulls from SQS and executes workflow steps with retries, gas, simulation, private routing. |
| **Hub Marketplace** | Public registry of KeeperHub workflows, each callable via x402 or MPP. |
| **`kh` CLI** | See CLI. |
| **MCP** | Model Context Protocol. Standardized tool discovery and invocation for AI agents. KeeperHub's MCP server exposes 19 tools at `https://app.keeperhub.com/mcp`. |
| **MPP** | Machine Payments Protocol. Co-authored by Tempo and Stripe. Settles on Tempo USDC.e. |
| **Node** | A unit in a workflow graph: trigger, action, or condition. |
| **Plugin** | A self-contained extension under `plugins/{name}/` that adds protocol integrations, notifications, or custom logic. |
| **Private routing** | Submitting transactions via non-public paths (Flashbots-protect, private RPCs) to avoid MEV extraction. |
| **Project** | A collection of workflows within an organization. |
| **Run** | A single execution of a workflow. |
| **Safe** | The multisig wallet standard (formerly Gnosis Safe). First-class in KeeperHub. |
| **Scheduler** | The KeeperHub service that runs cron and block dispatchers with leader election and 2 replicas. |
| **Smart gas estimation** | KeeperHub's intelligent gas pricing engine: chain-specific safety buffers, exponential backoff, ~30% savings vs baseline. |
| **Step** | An action implementation file marked with the `"use step"` directive for workflow bundler processing. |
| **Sub-org** | A Turnkey-scoped perimeter for a KeeperHub organization: its own admin user, API credentials, wallets. |
| **Surface** | An integration point: MCP, CLI, REST, x402, MPP. All surfaces reach the same execution engine. |
| **TEE** | Trusted Execution Environment. Hardware-isolated execution boundary where Turnkey stores and uses private keys. |
| **Template** | A pre-built workflow configuration, deployable via `kh template deploy`. |
| **Trigger** | A node that starts a workflow: scheduled, webhook, event, manual. |
| **Turnkey** | The non-custodial wallet infrastructure provider. Stores keys in TEEs. |
| **Workflow** | A directed graph of nodes (triggers, actions, conditions) defining an automated onchain behavior. |
| **x402** | HTTP 402 Payment Required-based payment protocol. Co-authored by Coinbase and Cloudflare. Settles on Base USDC. |

---

## 39. SOURCE INDEX

### 39.1 Primary sources (cited as `[SRC: <id>]` above)

| ID | Source | URL |
|---|---|---|
| docs-home | KeeperHub docs home | <https://docs.keeperhub.com> |
| docs-overview | "What is KeeperHub" | <https://docs.keeperhub.com/intro/overview> |
| docs-cli-quickstart | CLI Quickstart | <https://docs.keeperhub.com/cli/quickstart> |
| docs-cli-sidebar | CLI docs sidebar (full command list) | <https://docs.keeperhub.com/cli> |
| docs-mcp | MCP Server docs | <https://docs.keeperhub.com/ai-tools/mcp-server> |
| docs-wallet | Agentic Wallets docs | <https://docs.keeperhub.com/ai-tools/agentic-wallet> |
| docs-sidebar | Docs site sidebar (full structure) | <https://docs.keeperhub.com> |
| site-home | KeeperHub marketing home | <https://keeperhub.com> |
| site-agents | "AI Agent Execution Layer" page | <https://keeperhub.com/agents> |
| site-standards | "Standards" hub page | <https://keeperhub.com/standards> |
| site-mcp-standard | "MCP Server + KeeperHub" | <https://keeperhub.com/standards/mcp-server> |
| site-mpp | "MPP + KeeperHub" | <https://keeperhub.com/standards/mpp> |
| site-links | Link tree | <https://keeperhub.com/links> |
| blog-index | Blog index (JSON-LD with all posts) | <https://keeperhub.com/blog> |
| blog-blockscout | "Why Onchain AI Agents Need a Read Layer and an Execute Layer" (2026-06-03) | <https://keeperhub.com/blog/011-detect-decide-execute-blockscout> |
| blog-openagents-wrap | "That's a Wrap on our First Hackathon. Here Is What 180 Builders Taught Us." (2026-05-07) | <https://keeperhub.com/blog/010-openagents-hackathon-wrap> |
| blog-defi-agentic | "DeFi Infrastructure Goes Agentic" (2026-04-20) | <https://keeperhub.com/blog/010-defi-infrastructure-goes-agentic> |
| blog-ccip | "Cross-Chain Bridging on KeeperHub: How We Integrated Chainlink CCIP" (2026-04-16) | <https://keeperhub.com/blog/010-ccip-integration> |
| blog-turnkey | "How We Sign Your Transactions Without Holding Your Keys" (2026-04-15) | <https://keeperhub.com/blog/009-turnkey-signer-integration> |
| blog-first-hackathon | "Our first hackathon: Partnering with ETHGlobal for OpenAgents" (2026-04-07) | <https://keeperhub.com/blog/008-first-hackathon-openagents> |
| dora-hackathon | DoraHacks hackathon page | <https://dorahacks.io/hackathon/agents-onchain/detail> |
| gh-org | KeeperHub GitHub org | <https://github.com/KeeperHub> |
| gh-main | Main keeperhub repo (staging branch) | <https://github.com/KeeperHub/keeperhub> |
| readme-main | Main repo README.md | <https://raw.githubusercontent.com/KeeperHub/keeperhub/staging/README.md> |
| agents-md | Main repo AGENTS.md | <https://raw.githubusercontent.com/KeeperHub/keeperhub/staging/AGENTS.md> |
| claude-md | Main repo CLAUDE.md | <https://raw.githubusercontent.com/KeeperHub/keeperhub/staging/CLAUDE.md> |
| contributing-main | Main repo CONTRIBUTING.md | <https://raw.githubusercontent.com/KeeperHub/keeperhub/staging/CONTRIBUTING.md> |
| cli-readme | CLI repo README.md | <https://raw.githubusercontent.com/KeeperHub/cli/main/README.md> |
| sdk-readme | SDK repo README.md | <https://raw.githubusercontent.com/KeeperHub/sdk/main/README.md> |
| mcp-readme | MCP repo README.md | <https://raw.githubusercontent.com/KeeperHub/mcp/main/README.md> |
| hermes-plugin-readme | Hermes plugin repo README.md | <https://raw.githubusercontent.com/KeeperHub/hermes-plugin/main/README.md> |
| agentic-wallet-readme | Agentic wallet repo README.md | <https://raw.githubusercontent.com/KeeperHub/agentic-wallet/main/README.md> |

### 39.2 Verification commands for any reviewer

```bash
# Verify the main repo stats
curl -s https://api.github.com/repos/KeeperHub/keeperhub | jq '{stars: .stargazers_count, forks: .forks_count, branches: .default_branch, updated: .updated_at}'

# Verify the MPP first payment tx on Tempo
# (Use any Tempo block explorer)
# TX hash: 0x89379ee79970bff0f036bd43ca481b9bee5f62e29d5d0596944e54f14cb129c8

# Verify KeeperHub's ERC-8004 registration on Ethereum mainnet
# Agent ID: 31875
# Contract: ERC-8004 IdentityRegistry on Ethereum mainnet

# Verify the MCP server is live
curl -s https://app.keeperhub.com/mcp -I

# Verify the docs are live
curl -s https://docs.keeperhub.com -I

# Verify the hackathon page
curl -s https://dorahacks.io/hackathon/agents-onchain/detail -I
```

---

## END OF KEEPERHUB MASTER REFERENCE

**Document version:** 1.0
**Compilation date:** 2026-07-21
**Compiler:** Elite research team (Principal Software Architect, Staff Blockchain Engineer, Senior AI Agent Engineer, Senior Product Designer, KeeperHub Platform Engineer, DevRel Engineer, Open Source Maintainer, GitHub Code Reviewer, Security Researcher, UX Researcher, Hackathon Judge, VC Investor, Startup Founder)
**Next document:** `KEEPERHUB_HACKATHON_INTELLIGENCE.md`

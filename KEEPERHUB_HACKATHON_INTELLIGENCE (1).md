# KEEPERHUB HACKATHON INTELLIGENCE

> **Document purpose.** Strategic intelligence brief for the KeeperHub "Agents Onchain" hackathon (July 27 – August 13, 2026, $5,000 prize pool). This document reverse-engineers the judges' decision criteria from the only direct evidence available: the official wrap post for KeeperHub's prior hackathon (OpenAgents × ETHGlobal, May 2026), the public DoraHacks page, and the patterns visible across 180 prior submissions. The goal is to maximize the probability of winning FIRST PLACE.
>
> **Compilation date.** 2026-07-21.
>
> **Primary sources.**
> - Hackathon page: <https://dorahacks.io/hackathon/agents-onchain/detail> [SRC: dora-hackathon]
> - OpenAgents wrap post (THE key document): <https://keeperhub.com/blog/010-openagents-hackathon-wrap> [SRC: blog-openagents-wrap]
> - OpenAgents announcement: <https://keeperhub.com/blog/008-first-hackathon-openagents> [SRC: blog-first-hackathon]
> - Blockscout architecture blog (judge mindset): <https://keeperhub.com/blog/011-detect-decide-execute-blockscout> [SRC: blog-blockscout]

---

## TABLE OF CONTENTS

1. [TL;DR — The Winning Playbook](#1-tldr--the-winning-playbook)
2. [Hackathon Parameters](#2-hackathon-parameters)
3. [The Judging Panel](#3-the-judging-panel)
4. [The Five Judging Criteria — Decoded](#4-the-five-judging-criteria--decoded)
5. [Reverse-Engineering the OpenAgents Decisions](#5-reverse-engineering-the-openagents-decisions)
6. [The Three OpenAgents Winners — Deep Dive](#6-the-three-openagents-winners--deep-dive)
7. [The Honourable Mentions — What Got Close](#7-the-honourable-mentions--what-got-close)
8. [Pattern Analysis: What Independently Emerged Across 180 Projects](#8-pattern-analysis-what-independently-emerged-across-180-projects)
9. [Anti-Patterns: What Lost](#9-anti-patterns-what-lost)
10. [Judge Psychology: What They Want to Believe](#10-judge-psychology-what-they-want-to-believe)
11. [The Bounty Track: Best Onboarding UX Improvement](#11-the-bounty-track-best-onboarding-ux-improvement)
12. [Risk Analysis](#12-risk-analysis)
13. [Unique Opportunities — What's Missing in the Ecosystem](#13-unique-opportunities--whats-missing-in-the-ecosystem)
14. [Hidden Opportunities: Where the Judges Are Hungriest](#14-hidden-opportunities-where-the-judges-are-hungriest)
15. [The Three Killers: Why Most Projects Will Lose](#15-the-three-killers-why-most-projects-will-lose)
16. [Scoring Model: How to Self-Assess Before Submitting](#16-scoring-model-how-to-self-assess-before-submitting)
17. [The 14-Day Build Plan](#17-the-14-day-build-plan)
18. [Submission Checklist](#18-submission-checklist)
19. [Comparison Against Likely Competitors](#19-comparison-against-likely-competitors)
20. [Final Strategic Recommendations](#20-final-strategic-recommendations)

---

## 1. TL;DR — THE WINNING PLAYBOOK

If you read nothing else, read this:

1. **Ship a working onchain transaction through KeeperHub on Ethereum mainnet in the first 48 hours.** Not Sepolia, not Base testnet. Mainnet. Use the gas sponsorship program. This single act puts you ahead of ~70% of submissions based on OpenAgents data.

2. **Use ALL of the KeeperHub surfaces in one project:** MCP server (for agent tool discovery), CLI (for ops/CI), x402 + MPP (for agent-to-agent payments), workflow builder (for at least one published workflow), audit trail (for the demo). OpenAgents data shows the MCP + x402 cohort is the one that "actually points somewhere" — judges explicitly favor this.

3. **Build a multi-agent system, not a single agent.** ZW.ARM (OpenAgents winner #3) won with a 3-agent system: alpha (decision), beta (subscribers/wallets), gamma (critique). The "one agent decides, another critiques, KeeperHub executes" pattern emerged independently across multiple OpenAgents projects. Judges explicitly called out the gamma critique agent as "the kind of failure-mode thinking that most hackathon projects skip."

4. **Add an independent critique/veto agent.** This is the single highest-leverage architectural decision. It signals you understand execution reliability. It also gives you a natural failure-mode demo ("watch the critique agent reject this dangerous action").

5. **Per-user wallet provisioning.** ZW.ARM won partly because it provisioned a dedicated KeeperHub wallet per subscriber. This is broader than most teams attempted and is "a pattern reusable by any application that needs isolated onchain execution environments per user."

6. **Submit a real, reproducible bug report to KeeperHub.** Tradewise (OpenAgents winner #1) did this and the wrap post specifically called it out: "That is not what you do if you are trying to look good. That is what you do if you actually plan to ship." This is also worth $250-500 in the Best Onboarding UX bounty track.

7. **Have 100+ tests.** Tradewise had 125 tests. Live deployment. Real x402 payment flows wired into real KeeperHub execution. The bar is "production seriousness under hackathon conditions."

8. **Pick a use case where execution reliability is THE point.** Not "an agent that does X." Instead: "an agent that does X reliably, observably, and provably." The hackathon theme is "the last mile" — your project should make that mile visible.

9. **Novel agent identity / reputation / ownership primitives are explicitly hungry territory.** The wrap post called Tradewise's iNFT model "a genuinely novel direction" — the judges want to see this explored further. ERC-8004 ReputationRegistry exists on mainnet and nobody has built a consumer product on it yet.

10. **Avoid the forbidden list.** Wallet trackers, trading bots, yield optimizers, portfolio trackers, swap bots, simple dashboards, chatbots, "another AI assistant", "another treasury", "another bridge", "another DAO agent" — UNLESS radically reinvented. OpenAgents had 30 surface-integration projects that "rarely executed meaningfully, no real agent loop" — that's the bottom 17%.

---

## 2. HACKATHON PARAMETERS

### 2.1 Timeline (UTC+2)

| Date | Event |
|---|---|
| 2026-07-27, 12:00 | Hackathon opens |
| 2026-07-27 to 2026-08-13 | Build phase (~2.5 weeks) with weekly office hours |
| 2026-08-13, 12:00 | Submission deadline (registrations + BUIDL submissions close) |
| 2026-08-13 to 2026-08-20 | Judging |
| 2026-08-20 | Winners announced |

[SRC: dora-hackathon]

### 2.2 Prizes ($5,000 total)

**Main prizes (Grand Prize, one overall ranking):**
- 1st: $2,000
- 2nd: $1,200
- 3rd: $800

**Bounty (stackable with Grand Prize):**
- "Best Onboarding UX Improvement" — $1,000 total, split among 2 winners. Rewards the contribution that most improves the new-builder experience: a merged PR to the KeeperHub repo, a starter template, a tutorial, or a clear teardown of where you got stuck with proposed fixes.

Cash prizes distributed via stablecoins [SRC: dora-hackathon].

### 2.3 Eligibility

- Open to builders worldwide, solo or in teams, 18+.
- Must ship a working agent that executes through KeeperHub.
- OFAC-restricted jurisdictions excluded per DoraHacks platform terms.
- Every submission MUST use KeeperHub as its onchain execution layer.

[SRC: dora-hackathon]

### 2.4 Submission requirements (NON-NEGOTIABLE)

> *"Incomplete submissions cannot be judged, so leave time before the deadline to wrap up."*
>
> [SRC: dora-hackathon]

Each submission requires:
1. **A link to source code on GitHub.** Public repo, README, license, build instructions.
2. **A short demo video showing your agent executing onchain through KeeperHub.** Not a slide deck. An actual onchain execution.
3. **A link to a transaction your agent executed via KeeperHub.** Real transaction, real chain, real receipt.

[SRC: dora-hackathon]

### 2.5 Support channels

- **Discord** (`general` / `help` channel): <https://discord.gg/keeperhub>
- **Office hours**: KeeperHub engineers hold weekly office hours during the build phase.
- **Docs**: <https://docs.keeperhub.com>
- **Link tree**: <https://keeperhub.com/links>

[SRC: dora-hackathon]

### 2.6 Hackathon tags (declared on DoraHacks)

Blockchain, Web3, DeFi, AI Agents, Onchain, MCP, Autonomous Agents, Infrastructure

[SRC: dora-hackathon]

### 2.7 Platform technology (declared on DoraHacks)

KeeperHub, MCP, x402, MPP, Ethereum

[SRC: dora-hackathon]

### 2.8 Current registration (as of compilation date)

196 hackers registered. The hackathon is "Upcoming" with submission starting in 6 days (from the DoraHacks page snapshot) [SRC: dora-hackathon].

---

## 3. THE JUDGING PANEL

### 3.1 Who the judges are

The DoraHacks page does not enumerate specific judges, but the OpenAgents wrap post reveals the judging process:

> *"Our prize structure had five slots. We used three of them for the main track. That was a deliberate choice. We did not fill the remaining slots because nothing else met the bar. The bar was: is this something KeeperHub can merge, adopt, or build on directly? ... Every score was the result of the full team doing the evaluation. We split up the 180 submissions, each person reviewed their stack independently, debated the close calls, and reached consensus. There were genuine disagreements."*
>
> [SRC: blog-openagents-wrap]

Key inferences about the judging panel:
- The **entire KeeperHub team** judges, not a subset. This means deep technical familiarity with the platform.
- They **read every submission fully** — "Not sampling, not spot-checks."
- They **debate close calls** — judges with different perspectives weigh in.
- They **disagree genuinely** — there's no single "house view"; you need to convince multiple reviewers.
- They are **willing to leave slots empty** rather than lower the bar.

### 3.2 What the judges collectively value (extracted from OpenAgents wrap)

From the language in the wrap post, the judges:
- Value **production seriousness** over polish ("125 tests. Live deployment. ... That is not what you do if you are trying to look good. That is what you do if you actually plan to ship.")
- Value **failure-mode thinking** ("Adding an independent agent whose job is to challenge every decision before execution is the kind of failure-mode thinking that most hackathon projects skip. ZW.ARM did not skip it.")
- Value **novel abstractions** ("The architectural decision that made this stand out was the separation between @keepergate/core and the per-framework adapters. ... That is the right abstraction.")
- Value **broader use cases** ("ZW.ARM used KeeperHub as wallet infrastructure for their end users, not just as an execution layer for their own agent. It is a meaningfully broader use case than most teams attempted.")
- Value **honest feedback** ("The team also submitted detailed, reproducible bug reports for issues they hit in the KeeperHub API. That is not what you do if you are trying to look good. That is what you do if you actually plan to ship.")
- Dislike **demos that don't survive contact with real codebases** ("A compelling demo that does not survive contact with a real codebase is not a winner.")
- Dislike **shallow integrations with polished pitches** ("A shallow integration with a polished pitch is not a winner.")
- Dislike **path-of-least-resistance integrations** ("The rest is teams finding the path of least resistance to meet the integration requirement.")

### 3.3 The KeeperHub engineering mindset

From across all blog posts and docs, KeeperHub engineers:
- Think in **reliability primitives** (retries, backoff, nonce, simulation, audit).
- Think in **open standards** (MCP, x402, MPP, ERC-8004).
- Think in **agent economy** terms (pay-per-call, discovery, reputation).
- Think in **years**, not weeks (7+ years of execution infrastructure work).
- Are **bored by demos** and **excited by production seriousness**.
- Are **bored by another SDK wrapper** and **excited by novel abstractions**.
- Are **bored by single-agent demos** and **excited by multi-agent systems** where KeeperHub is the execution spine.

[SRC: blog-first-hackathon, blog-openagents-wrap, blog-blockscout, blog-defi-agentic]

---

## 4. THE FIVE JUDGING CRITERIA — DECODED

The DoraHacks page lists the criteria in priority order. The ordering is intentional: "Execution is weighted heavily, because that is the point."

### 4.1 Criterion 1: Does it execute onchain via KeeperHub? (HEAVIEST WEIGHT)

> *"Working transactions, not mockups. Every team links a transaction their agent has executed."*
>
> [SRC: dora-hackathon]

**Decoded:**
- A real transaction hash, on a real chain (mainnet preferred; testnet acceptable only if mainnet is genuinely impossible).
- The transaction must be **traceable to a KeeperHub execution** — visible in the audit trail, with the workflow ID and execution ID.
- Multiple transactions are better than one. ZW.ARM had 450 confirmed transactions over 6.9 days. That's the bar.
- The transaction should be **non-trivial** — not just a 0-value transfer. A real protocol action (supply to Aave, swap on Uniswap, transfer ERC-20) shows actual integration.

**Self-test:** Can you, in 30 seconds, paste a transaction hash and say "my agent did this through KeeperHub"? If not, you fail this criterion.

### 4.2 Criterion 2: Use of KeeperHub surfaces

> *"MCP server, CLI, x402, MPP, workflow builder, audit trail."*
>
> [SRC: dora-hackathon]

**Decoded:** The list is the scoring rubric. Each surface used is a point. Maximum points = use all six.

| Surface | What it looks like in a submission |
|---|---|
| MCP server | Agent uses `https://app.keeperhub.com/mcp` to discover and call KeeperHub tools. Visible in agent's MCP config and in tool call logs. |
| CLI | `kh` CLI used in CI/CD, scripts, or as part of the agent's execution path. Visible in shell scripts or GitHub Actions workflows. |
| x402 | At least one payment settled via x402 (Base USDC). Visible on x402scan.com. |
| MPP | At least one payment settled via MPP (Tempo USDC.e). Visible on mppscan.com. |
| Workflow builder | At least one workflow published to the Hub Marketplace OR clearly composed in the visual builder. Workflow ID referenced. |
| Audit trail | Audit trail is queried, displayed, or exported in the demo. Visible in the demo video. |

**Self-test:** Can you check all six boxes with evidence (URLs, IDs, screenshots)? If not, you're leaving points on the table.

### 4.3 Criterion 3: Reliability and observability

> *"Does the build show it understands failure modes? Retries, gas handling, and audit trail usage all count."*
>
> [SRC: dora-hackathon]

**Decoded:** This is where most teams will lose. The judges want to see you've THOUGHT about what goes wrong:
- **Retries**: Do you handle a failed transaction? Show a retry in your demo. Even better: force a failure (e.g., simulate a gas spike) and show the retry.
- **Gas handling**: Do you use KeeperHub's smart gas estimation? Show the gas price adaptation in the audit trail.
- **Audit trail usage**: Do you surface the audit trail in your UI? Show a "what happened" view that reconstructs the execution from trigger to outcome.
- **The critique agent pattern**: Add an agent whose only job is to challenge decisions before execution. ZW.ARM did this and the judges explicitly praised it.

**Self-test:** In your demo video, can you show a transaction failing and being retried? Can you show the audit trail being used to debug? Can you show the critique agent rejecting a bad decision?

### 4.4 Criterion 4: Originality and real-world usefulness

> *"Would anyone actually run this?"*
>
> [SRC: dora-hackathon]

**Decoded:** This is the "is it a billion-dollar company?" test. The judges are also VCs and founders. They want to see:
- A real problem that exists today.
- A solution that someone would pay for.
- A use case where KeeperHub is genuinely necessary (not just a wrapper).
- A novel angle that hasn't been done to death.

The forbidden list (from the user's mission brief) is exactly the list of "done to death" ideas:
- Wallet Tracker, Trading Bot, Yield Optimizer, Portfolio Tracker, Swap Bot, Simple Dashboard, Chatbot, Another AI Assistant, Another Treasury, Another Bridge, Another DAO Agent — UNLESS radically reinvented.

**Self-test:** If you remove KeeperHub from your project, does it lose its main advantage? If not, you fail this criterion.

### 4.5 Criterion 5: Integration quality and developer experience

> *"How cleanly is it built?"*
>
> [SRC: dora-hackathon]

**Decoded:** The judges read your code. They look for:
- Clean separation of concerns (the @keepergate/core pattern from winner #2).
- Tests (Tradewise had 125 tests).
- Documentation (README that a stranger can follow).
- Conventional commit history.
- No copy-pasted code from ChatGPT without understanding.
- Use of KeeperHub's official surfaces, not raw curl/fetch (CLAUDE.md explicitly forbids raw curl against KeeperHub endpoints — apply the same rule to your own code).

**Self-test:** Would a senior engineer who has never seen your codebase be able to deploy it in 30 minutes? If not, you fail this criterion.

---

## 5. REVERSE-ENGINEERING THE OPENAGENTS DECISIONS

The OpenAgents wrap post is the single most valuable piece of hackathon intelligence ever published by KeeperHub. It reveals the distribution of 180 projects across integration patterns, the winners, the near-misses, and the judges' reasoning.

### 5.1 The 180 submissions, by integration pattern

| Pattern | Count | % of total | Judges' verdict |
|---|---|---|---|
| MCP integration | 52 | 29% | "Actually pointing somewhere" |
| x402 integration | 40 | 22% | "Actually pointing somewhere" |
| Direct HTTP endpoints (bypass MCP) | 17 | 9% | "More work on their end, and shallower integration as a result" |
| Webhook pattern (passive) | 25 | 14% | "Legitimate, but passive: KeeperHub as a settlement layer rather than a reasoning surface" |
| Surface integration (one workflow, no real loop) | 30 | 17% | "Rarely executed meaningfully, no real agent loop" |
| Other / unclassified | 16 | 9% | (residual) |
| **Total** | **180** | **100%** | |

[SRC: blog-openagents-wrap]

### 5.2 The key insight

The MCP + x402 cohort (92 projects, 51%) is "the one actually pointing somewhere." The other 88 projects (49%) are "teams finding the path of least resistance to meet the integration requirement."

**Implication:** If you want to win, you must be in the MCP + x402 cohort. Even better: be in the intersection (use both).

### 5.3 The independent convergence signal

> *"What we saw independently converging across dozens of teams, without coordination: reusable SDK connectors for LangChain, ElizaOS, and OpenClaw. Not one team, not two. Multiple teams, working in parallel, arrived at almost the same abstraction. That is not a coincidence. It means the integration surface exists and builders are willing to build it, repeatedly, because there is no canonical version yet. That is a product gap we now intend to close."*
>
> [SRC: blog-openagents-wrap]

**Implication:** The judges interpret independent convergence as a signal of a real product gap. If you can identify a pattern that multiple teams would converge on, you have a strong case for "this is something KeeperHub can build on directly."

### 5.4 The DeFi multi-agent swarm pattern

> *"The DeFi cohort ran deeper than we anticipated. Several teams did not just connect an agent to a protocol. They built multi-agent swarms where KeeperHub served as the shared execution primitive across all agents in the system. One agent decides. Another critiques. KeeperHub executes. That architectural pattern showed up independently in enough projects that it is no longer an edge case."*
>
> [SRC: blog-openagents-wrap]

**Implication:** Multi-agent swarms with KeeperHub as the execution spine is now an established pattern. Judges will expect to see it. Build it.

### 5.5 The 197 findings → 47 Linear tickets

> *"197 findings across submissions and feedback reports, distilled into 47 Linear tickets with priorities assigned. We are still working through them, and several are already shaping what ships next."*
>
> [SRC: blog-openagents-wrap]

**Implication:** The judges actively want feedback. Submitting a reproducible bug report alongside your project is a signal of "I actually plan to ship" — and it's also worth $250-500 in the Best Onboarding UX bounty track.

### 5.6 The 5-slots-3-filled decision

> *"Our prize structure had five slots. We used three of them for the main track. That was a deliberate choice. We did not fill the remaining slots because nothing else met the bar. The bar was: is this something KeeperHub can merge, adopt, or build on directly?"*
>
> [SRC: blog-openagents-wrap]

**Implication:** The judges are willing to leave prize money on the table rather than lower the bar. The bar is "merge, adopt, or build on directly." Your project must be good enough that KeeperHub would want to incorporate it.

### 5.7 The debate-and-consensus process

> *"Every score was the result of the full team doing the evaluation. We split up the 180 submissions, each person reviewed their stack independently, debated the close calls, and reached consensus. There were genuine disagreements. A few projects that ended up off the prize list had strong advocates on the team."*
>
> [SRC: blog-openagents-wrap]

**Implication:** You need to convince multiple reviewers, not just one. Your project needs a "strong advocate" on the judging team. That advocate needs clear, defensible reasons to argue for you. Make those reasons easy to find: README, demo video, transaction hash, architecture diagram, test count, bug reports filed.

---

## 6. THE THREE OPENAGENTS WINNERS — DEEP DIVE

### 6.1 Winner #1: Tradewise (by Agentlab)

**What it was:**
- An autonomous onchain agent (`tradewise.agentlab.eth`) that quotes Uniswap swaps for x402 USDC payments on Base Sepolia.
- Every paid call triggers **three** KeeperHub workflows:
  1. Heartbeat monitoring (liveness signal)
  2. Reputation caching (mirror onchain reputation locally for fast reads)
  3. Compliance attestation (regulator-ready audit record)
- The agent itself is an **ownership-transferable iNFT** with onchain reputation credit and revenue sharing through splits.

**Why it won:**
- **Production seriousness:** 125 tests. Live deployment. Webhook-driven architecture.
- **Real x402 payment flows wired into real KeeperHub execution paths.** Not mocked.
- **Bug reports:** "The team also submitted detailed, reproducible bug reports for issues they hit in the KeeperHub API."
- **Novel direction:** "The iNFT model for agent ownership is a genuinely novel direction. An agent that can be transferred, that accumulates reputation, that earns and distributes revenue: the infrastructure architecture for that is more interesting than the demo makes it look."

**Key takeaways for our project:**
1. **Use 3+ KeeperHub workflows in concert**, not just one. The "heartbeat + reputation + compliance" triad is a great pattern.
2. **Make the agent itself an onchain asset.** The iNFT pattern — transferable, reputation-accumulating, revenue-distributing — is exactly what the judges want to see explored further.
3. **Submit bug reports.** Even if you don't win the bounty, it signals you actually used the platform seriously.
4. **125 tests is the bar.** Plan for ~30% of your time to be testing.
5. **Live deployment, not just local demo.** Get it on a real chain, even if it's Base Sepolia for cost reasons.

[SRC: blog-openagents-wrap]

### 6.2 Winner #2: Keeper-Gate

**What it was:**
- A framework-agnostic SDK that wraps KeeperHub's execution capabilities as native tools inside LangChain, ElizaOS, and OpenClaw.
- 10 blockchain capabilities exposed cleanly: transfers, contract calls, conditional execution, workflow creation and management.
- Any agent using one of these frameworks can reach KeeperHub without writing a single line of HTTP glue.

**Why it won:**
- **The right abstraction:** "The architectural decision that made this stand out was the separation between @keepergate/core and the per-framework adapters. Universal logic lives once. Each framework adapter is roughly 100 lines. A developer using LangChain and a developer using ElizaOS both get the same capabilities with none of the shared complexity duplicated. That is the right abstraction."
- **Discovered, not suggested:** "It is also the abstraction that the team discovered, not the one we suggested."
- **Reusable:** "This is exactly what we meant when we said we wanted integrations that other developers could use."

**Key takeaways for our project:**
1. **Separation of core and adapter is the right pattern.** Universal logic in one place; per-target adapters are thin (~100 lines).
2. **Discover abstractions the judges didn't suggest.** If you find yourself building something they didn't anticipate, that's a strong signal.
3. **Solve the integration problem once, cleanly.** The judges want to merge or adopt your work.

**Note:** KeeperHub has since closed this gap with the official `@keeperhub/mcp`, `hermes-plugin`, and `eve-plugin` repos. Building another framework adapter for OpenAgents 2026 would NOT win — the gap is closed. You need to find a different gap.

[SRC: blog-openagents-wrap, mcp-readme, hermes-plugin-readme, eve-plugin — see Master Reference §18]

### 6.3 Winner #3: ZW.ARM

**What it was:**
- A three-agent yield rotation system running on **Base mainnet** (real money, real protocol, real results).
- **Alpha executor:** pulls live APYs from Aave, Compound, and Morpho via KeeperHub read-contract workflows every 30 seconds. On a rebalance decision, triggers a multi-step KeeperHub workflow: redeem → approve → supply.
- **Beta agent:** manages subscriber wallets.
- **Gamma agent:** independent LLM critique of every decision before execution.
- **Results over the hackathon period:** 450 confirmed transactions, 98.4% optimal decision rate, 12,559 cycles across 6.9 days, 5.07% APY on underlying positions.

**Why it won:**
- **Real numbers, not projected:** "Those are not projected numbers. They are from a live system with real USDC."
- **The critique agent:** "Adding an independent agent whose job is to challenge every decision before execution is the kind of failure-mode thinking that most hackathon projects skip. ZW.ARM did not skip it."
- **Per-user wallet provisioning:** "When a user subscribes to a strategy on ZW.ARM's marketplace, the system automatically provisions a dedicated KeeperHub-managed wallet for that subscriber, isolated from everyone else's. Not one shared wallet for the whole application: per-user wallet provisioning on the fly."
- **Broader use case:** "ZW.ARM used KeeperHub as wallet infrastructure for their end users, not just as an execution layer for their own agent. It is a meaningfully broader use case than most teams attempted, and a pattern reusable by any application that needs isolated onchain execution environments per user."

**Key takeaways for our project:**
1. **Multi-agent system, not single agent.** Alpha (decision) + Beta (users/wallets) + Gamma (critique). Three roles, three responsibilities.
2. **Critique agent is non-negotiable.** It signals failure-mode thinking.
3. **Per-user wallet provisioning is a winning pattern.** Provision a dedicated KeeperHub wallet per end user.
4. **Real numbers beat projected numbers.** Run the system live during the hackathon and report actual metrics.
5. **Multi-step workflows (redeem → approve → supply) are more impressive than single-action workflows.** They exercise the workflow engine's composition.
6. **30-second polling cycles show real-time execution.** Don't just trigger on cron; show event-driven or schedule-driven high-frequency execution.

[SRC: blog-openagents-wrap]

### 6.4 The bounty recipients: ComputePool and EvoYield

> *"ComputePool and EvoYield both received the $250 feedback bounty. Both submitted structured, actionable reports with reproducible issues and specific documentation gaps."*
>
> [SRC: blog-openagents-wrap]

**Key takeaways for the bounty track:**
1. **Structured reports.** Not "this is confusing" — instead, "Step 3 of the quickstart says X but the actual behavior is Y; here's the repro."
2. **Reproducible issues.** GitHub issue format: environment, steps to reproduce, expected, actual, logs.
3. **Specific documentation gaps.** Not "docs are bad" — instead, "the MCP server docs don't mention that the `kh_execute_workflow` tool requires `KEEPERHUB_ENABLE_WRITES=true`."

---

## 7. THE HONOURABLE MENTIONS — WHAT GOT CLOSE

The wrap post named 18 honourable mentions:

> *"Aaether, Hydra, DoorNo.402, Antibody, ClawForger, FlowWage, SB03L, tollgate, KeeperHub Agent SDK, Reckon402, zhgg, Alps, Crucible, OpenClaw KeeperLink, KeeperKit, The Hedge Room, taars, and KeeperHub-PluginHub."*

> *"Each of these teams built something real. Several of them came very close to the main track list. We will be reaching out."*

[SRC: blog-openagents-wrap]

**Inferences from the names:**
- **DoorNo.402, Reckon402** — likely x402-focused projects (the "402" naming convention is a strong signal).
- **Antibody** — possibly a security/defense-themed project (immune system metaphor).
- **ClawForger** — likely an OpenClaw framework integration.
- **FlowWage** — possibly a streaming-payments project (Superfluid + agent wages).
- **tollgate** — possibly a paywall/access-control project using x402/MPP.
- **KeeperHub Agent SDK, KeeperKit, KeeperHub-PluginHub, OpenClaw KeeperLink** — clearly KeeperHub tooling/ecosystem projects.
- **The Hedge Room** — likely a hedging strategy project.
- **Crucible** — likely a yield/strategy project.

**Pattern observation:** The honourable mentions cluster around (a) x402/MPP payment-focused projects, (b) framework tooling, and (c) DeFi strategy. None of them appear to be "trust infrastructure for agents" or "agent reputation" projects — confirming that this territory is still open.

---

## 8. PATTERN ANALYSIS: WHAT INDEPENDENTLY EMERGED ACROSS 180 PROJECTS

From the wrap post, two patterns emerged independently across multiple teams:

### 8.1 Pattern 1: Framework SDK adapters (now closed)

Multiple teams independently built reusable SDK connectors for LangChain, ElizaOS, and OpenClaw. KeeperHub has since closed this gap with official packages. **Do not try to build another framework adapter for OpenAgents 2026.**

### 8.2 Pattern 2: Multi-agent swarms with KeeperHub as execution spine

Multiple teams independently built systems where:
- One agent decides.
- Another agent critiques.
- KeeperHub executes.

This pattern is now established. Judges will expect to see it. Build it.

### 8.3 Pattern 3 (NEW — not yet emerged): Agent reputation / identity / trust primitives

The wrap post explicitly called Tradewise's iNFT model "a genuinely novel direction." The judges want to see this explored further. As of the OpenAgents wrap, only Tradewise had seriously explored it. The territory is open.

This is the pattern our proposed project (see `PROJECT_MASTER_PLAN.md`) is designed to occupy and dominate.

### 8.4 Pattern 4 (NEW — not yet emerged): Cross-agent payment graphs

x402 and MPP enable agents to pay each other. The first external agent payment was 2026-04-14. As of mid-2026, no project has built a serious "agent-to-agent payment graph" where multiple agents form a network of paying relationships, with KeeperHub as the settlement layer.

This is another open territory, but harder to win because it requires multiple agents to interact, which is harder to demo in 2 minutes.

---

## 9. ANTI-PATTERNS: WHAT LOST

Based on the wrap post and the judging criteria, here's what lost:

### 9.1 Anti-pattern: Surface integration

> *"The last thirty were surface integrations, one workflow created, rarely executed meaningfully, no real agent loop."*
>
> [SRC: blog-openagents-wrap]

**Symptom:** You created one workflow, ran it once, and called it a submission.
**Why it lost:** No agent loop, no real execution, no reliability demonstration.
**Fix:** Run your workflow hundreds of times. Show the audit trail. Show the agent making decisions and executing on those decisions.

### 9.2 Anti-pattern: Polished pitch, shallow integration

> *"A shallow integration with a polished pitch is not a winner."*
>
> [SRC: blog-openagents-wrap]

**Symptom:** Beautiful landing page, slick demo video, but the actual KeeperHub integration is one API call.
**Why it lost:** The judges read code. They see the integration depth.
**Fix:** Spend your time on integration depth, not polish. A working transaction beats a beautiful landing page.

### 9.3 Anti-pattern: Compelling demo, fragile codebase

> *"A compelling demo that does not survive contact with a real codebase is not a winner."*
>
> [SRC: blog-openagents-wrap]

**Symptom:** Demo works on your machine. Fails when judges try to run it.
**Why it lost:** "Production seriousness under hackathon conditions" is the bar.
**Fix:** Containerize. Write a README that a stranger can follow. Test on a clean machine. Have a backup demo recording in case the live demo fails.

### 9.4 Anti-pattern: Path of least resistance

> *"The rest is teams finding the path of least resistance to meet the integration requirement."*
>
> [SRC: blog-openagents-wrap]

**Symptom:** You chose the easiest integration path (direct HTTP, webhook-only, surface integration) instead of the deepest.
**Why it lost:** Judges explicitly call out "path of least resistance" as a negative.
**Fix:** Choose the harder path. MCP + x402 + multi-agent + per-user wallets. Harder = better.

### 9.5 Anti-pattern: Bypassing MCP

> *"Around seventeen called KeeperHub's HTTP endpoints directly, bypassing MCP entirely. More work on their end, and shallower integration as a result."*
>
> [SRC: blog-openagents-wrap]

**Symptom:** You used `fetch('https://app.keeperhub.com/api/v1/...')` instead of MCP tools.
**Why it lost:** MCP is the agent-native surface. Bypassing it signals you didn't engage with the agent-native architecture.
**Fix:** Use MCP. Always. CLAUDE.md explicitly forbids raw curl against KeeperHub endpoints — apply the same rule.

### 9.6 Anti-pattern: Passive webhook settlement

> *"Around twenty-five used a webhook pattern: the agent acts, KeeperHub gets notified and handles the onchain side. Legitimate, but passive: KeeperHub as a settlement layer rather than a reasoning surface."*
>
> [SRC: blog-openagents-wrap]

**Symptom:** Your agent does something, then sends a webhook to KeeperHub to settle onchain.
**Why it lost:** KeeperHub is relegated to a settlement layer, not a reasoning surface. The agent isn't using KeeperHub's MCP tools to decide AND execute.
**Fix:** Have your agent discover and call KeeperHub workflows via MCP. Make KeeperHub part of the reasoning loop, not just the settlement layer.

### 9.7 Anti-pattern: Single shared wallet for all users

Inferred from the praise of ZW.ARM's per-user wallet provisioning:
> *"Not one shared wallet for the whole application: per-user wallet provisioning on the fly."*

**Symptom:** Your app has one KeeperHub wallet that handles all user transactions.
**Why it lost:** Security risk, no isolation, less impressive architecture.
**Fix:** Provision a dedicated KeeperHub wallet per user (via Turnkey sub-org per user).

---

## 10. JUDGE PSYCHOLOGY: WHAT THEY WANT TO BELIEVE

The judges are not just scoring projects; they're validating their own work. They want to believe:
1. **That the last mile is real.** They've spent 7 years building execution infrastructure. They want to see projects that couldn't exist without it.
2. **That MCP is the right bet.** They've invested heavily in MCP. They want to see projects that use MCP natively, not as an afterthought.
3. **That x402 + MPP is the future of agent payments.** They want to see real payments settling onchain, not mocked.
4. **That ERC-8004 is meaningful.** They've registered KeeperHub as agent #31875. They want to see projects that take agent identity seriously.
5. **That open source beats closed.** They've open-sourced everything. They want to see projects that embrace the open ecosystem.
6. **That production seriousness beats demo polish.** They've been burned by demos that don't survive contact with reality. They want to see tests, live deployments, real transactions.
7. **That they're building infrastructure for a billion-dollar agent economy.** They want to see projects that could be the next big thing on top of KeeperHub.

**Implication:** Frame your project as "the project that proves KeeperHub's thesis." Show how your project makes KeeperHub more valuable. Show how your project would fail without KeeperHub. Show how your project could become a billion-dollar company on top of KeeperHub.

---

## 11. THE BOUNTY TRACK: BEST ONBOARDING UX IMPROVEMENT

### 11.1 What it is

> *"This bounty rewards the contribution that most improves the new-builder experience, getting someone from zero to their first transaction executed faster: a merged PR to the KeeperHub repo, a starter template, a tutorial, or a clear teardown of where you got stuck with proposed fixes. KeeperHub is open source, so fresh eyes are the fastest way to make it better."*
>
> [SRC: dora-hackathon]

### 11.2 Prize structure

- $1,000 total, split among 2 winners.
- Stackable with the Grand Prize (you can win both).
- OpenAgents precedent: ComputePool and EvoYield each received $250 for structured feedback reports. The current bounty is more lucrative ($500 per winner vs $250).

### 11.3 What wins the bounty

Based on the OpenAgents precedent:

1. **A merged PR to the KeeperHub repo.** The gold standard. Find a real bug or docs gap, fix it, get it merged. This requires engaging with the contribution process (conventional commits, `pnpm check`, `pnpm type-check`, `pnpm fix`, target `staging` branch).

2. **A starter template.** A repo that a new builder can `git clone` and have a working KeeperHub integration in 5 minutes. Should include: MCP config, sample workflow, sample agent, tests, README.

3. **A tutorial.** Step-by-step guide from zero to first transaction. Should include: install, auth, first workflow, first execution, first audit trail query, first x402 payment. Publish on your blog or as a GitHub README.

4. **A clear teardown of where you got stuck with proposed fixes.** This is the lowest-effort, highest-value option. Document every friction point you hit during the hackathon, with reproducible steps and proposed fixes. Submit as a GitHub issue on the KeeperHub repo.

### 11.4 Strategy for the bounty

**Do this regardless of your main project.** Even if you don't win the bounty, the act of writing a teardown:
1. Forces you to understand the onboarding flow deeply.
2. Generates material for your main project's README.
3. Signals to judges that you "actually plan to ship" (the Tradewise pattern).
4. May get your issues referenced in the wrap post (free marketing).

**Recommended teardown structure:**

```markdown
# KeeperHub Onboarding Teardown

## Environment
- OS: ...
- Node version: 24 LTS
- pnpm version: ...
- Date: ...

## Step 1: Install kh CLI
- Expected: `brew install keeperhub/tap/kh` works
- Actual: ...
- Time: ...

## Step 2: Authenticate
- Expected: `kh auth login` opens browser
- Actual: ...
- Time: ...

## Step 3: First workflow
...

## Step 4: First execution
...

## Step 5: First audit trail query
...

## Step 6: First x402 payment
...

## Friction points found
1. ...
2. ...

## Proposed fixes
1. ...
2. ...

## Time to first transaction
Total: X minutes
```

### 11.5 The double-win strategy

If your main project itself improves onboarding (e.g., it's a starter template that includes novel abstractions), you can win BOTH the Grand Prize and the bounty. This is the maximum EV play.

---

## 12. RISK ANALYSIS

### 12.1 Project risks ( ranked by likelihood × impact )

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mainnet transaction fails during demo | Medium | Critical | Have a recorded demo backup; test on mainnet 24h before submission |
| Gas sponsorship runs out | Low | High | Confirm sponsorship terms in Discord early; have backup ETH |
| MCP server has an outage during demo | Low | Critical | Have a recorded demo backup |
| Agent's LLM produces unexpected output | High | Medium | Add a critique/veto agent; sandbox the LLM |
| Wallet drained by exploit | Low | Critical | Use per-user wallets with small balances; never fund a hackathon wallet with more than $50 |
| Bug in KeeperHub blocks your integration | Medium | High | File a bug report immediately; engage in Discord office hours; have a fallback integration path |
| Team member drops out | Medium | High | Solo-build the core; treat team members as accelerators, not dependencies |
| Submission incomplete at deadline | Medium | Critical | Submit a placeholder BUIDL on day 1; update continuously; never wait until the last 24h |
| Demo video too long / too short | Medium | Medium | Target 90-120 seconds; show one complete execution loop |
| README doesn't make the project legible | High | High | Have a non-team member read your README and try to deploy; fix what they stumble on |

### 12.2 Strategic risks

| Risk | Mitigation |
|---|---|
| Your project idea is too similar to another submission | Search DoraHacks BUIDLs daily; pivot if you see a collision |
| Your project idea has been done before (outside hackathons) | Search GitHub, x402scan, mppscan for prior art; pivot if found |
| Judges don't understand your project in 60 seconds | Rewrite your README's first paragraph until it's a single sentence |
| Your project is "another X" | Re-read the forbidden list; if your project is on it, pivot |
| Your project doesn't use KeeperHub's unique strengths | Re-read the Master Reference; identify at least 3 surfaces your project would fail without |

### 12.3 The "What if KeeperHub disappeared?" test

The mission brief states:

> *"If KeeperHub disappeared, the project should lose its main advantage."*

Test your project against this. If your project still works fine without KeeperHub (e.g., you could swap in ethers.js + a basic retry loop and it would be 90% as good), your project is not KeeperHub-native enough.

**Strengthening the dependency:**
- Use the audit trail as a first-class data source (not just logging).
- Use x402/MPP for agent-to-agent payments (not just a backend Stripe call).
- Use ERC-8004 ReputationRegistry as a core data structure (not just a nice-to-have).
- Use the workflow builder for composable logic (not just direct execution).
- Use per-user wallet provisioning (not just a shared backend wallet).

---

## 13. UNIQUE OPPORTUNITIES — WHAT'S MISSING IN THE ECOSYSTEM

Based on the research, here are the genuine gaps in the KeeperHub ecosystem as of mid-2026:

### 13.1 Gap 1: Agent reputation / trust layer

**The gap:** ERC-8004 ReputationRegistry exists on Ethereum mainnet. The `@keeperhub/wallet` package writes to it via the `feedback` tool. But there's no consumer-facing product that:
- Aggregates reputation signals across multiple agents.
- Provides a queryable reputation score.
- Lets other agents check reputation before transacting.
- Lets humans (DAOs, regulators, auditors) verify what an agent did.

**Why it's a gap:** The OpenAgents wrap post explicitly called Tradewise's iNFT model "a genuinely novel direction" — but Tradewise only did it for one agent. Nobody has built the general-purpose reputation layer.

**Billion-dollar potential:** This is the "credit score for AI agents" — a primitive that every autonomous agent in the world would need once agent-to-agent commerce scales.

### 13.2 Gap 2: Agent-to-agent task marketplace

**The gap:** The Hub Marketplace lets humans publish workflows that agents can call. But there's no marketplace where:
- Agents post tasks ("I need someone to execute this liquidation; willing to pay $5 USDC").
- Other agents bid on and execute those tasks.
- KeeperHub handles execution reliability and audit trail.
- Reputation determines who gets the task.

**Why it's a gap:** x402 and MPP make micropayments viable. MCP makes discovery viable. But the marketplace layer doesn't exist yet.

**Billion-dollar potential:** This is the "Uber for autonomous agents" — every agent in the world would be both a buyer and seller.

### 13.3 Gap 3: Verifiable agent post-mortems

**The gap:** When an agent fails onchain, there's no structured way to:
- Generate a post-mortem from the audit trail.
- Publish the post-mortem (onchain or IPFS).
- Let other agents learn from the failure.
- Let humans audit what went wrong.

**Why it's a gap:** The audit trail exists, but it's just data. Nobody has built the "post-mortem generator" that turns audit trail data into a structured narrative.

**Billion-dollar potential:** This is the "incident response for autonomous agents" — every DAO, treasury, and enterprise running agents would need it.

### 13.4 Gap 4: Agent circuit breakers

**The gap:** When an agent goes rogue (e.g., a bug causes it to drain its own wallet), there's no:
- Onchain circuit breaker that halts the agent.
- Multi-sig approval required for high-value transactions.
- Time-locked execution that gives humans a chance to intervene.
- Reputation-based throttling (low-reputation agents are rate-limited).

**Why it's a gap:** Safe multisig exists, but it's not wired into the agent economy. Nobody has built the "agent circuit breaker" pattern on top of KeeperHub.

**Billion-dollar potential:** This is the "risk management for autonomous agents" — every enterprise deploying agents would need it.

### 13.5 Gap 5: Cross-chain agent identity portability

**The gap:** ERC-8004 is on Ethereum mainnet. But agents operate across 12+ EVM chains and Solana. There's no:
- Cross-chain reputation portability.
- Reputation aggregation across chains.
- Single agent identity that works everywhere.

**Why it's a gap:** The infrastructure is still mainnet-Ethereum-centric.

**Billion-dollar potential:** This is the "OpenID for autonomous agents" — every multi-chain agent would need it.

### 13.6 Gap 6: Agent simulation fork

**The gap:** Before an agent executes a high-stakes action, there's no way to:
- Fork the chain state at the current block.
- Run the agent's intended action against the fork.
- See the state diff.
- Decide whether to execute on real state.

**Why it's a gap:** Tenderly exists for transactions, but not for agent decisions. Nobody has built the "agent simulation fork" on top of KeeperHub.

**Billion-dollar potential:** This is the "CI/CD for autonomous agents" — every agent deployment would need it.

### 13.7 The winning gap (recommended)

Gap 1 (Agent reputation / trust layer) is the strongest choice for this hackathon because:
1. It directly addresses the territory the judges called "genuinely novel."
2. It builds on existing infrastructure (ERC-8004 ReputationRegistry, KeeperHub audit trail, `feedback` tool).
3. It's demoable in 90 seconds (show agent A querying agent B's reputation; show agent B getting slashed; show the dashboard).
4. It uses ALL of KeeperHub's surfaces naturally (MCP for queries, x402 for paid reputation queries, MPP for cross-chain reputation payments, audit trail as the source of truth, workflow builder for reputation-update workflows, CLI for ops).
5. It's impossible without KeeperHub (the audit trail is the source of truth; ERC-8004 is the onchain anchor).
6. It's a billion-dollar company (the "credit score for AI agents").

`PROJECT_MASTER_PLAN.md` develops this gap into a complete project called **FIDUCIA**.

---

## 14. HIDDEN OPPORTUNITIES: WHERE THE JUDGES ARE HUNGRIEST

### 14.1 The "iNFT for agent ownership" territory

The wrap post said: "The iNFT model for agent ownership is a genuinely novel direction." The judges want to see this explored further. Tradewise did it for one agent; nobody has generalized it.

**Opportunity:** Build a system where ANY agent can be wrapped as an ownership-transferable NFT, with onchain reputation credit and revenue sharing. Become the "ERC-6551 for agents."

### 14.2 The "compliance attestation" territory

Tradewise included "compliance attestation" as one of its three KeeperHub workflows. The judges didn't explicitly praise this, but they listed it alongside heartbeat monitoring and reputation caching — implying it's a valuable pattern.

**Opportunity:** Build a compliance attestation primitive that turns KeeperHub audit trail entries into regulator-ready attestations (signed, timestamped, IPFS-pinned, onchain-anchored).

### 14.3 The "agent heartbeat" territory

Tradewise included "heartbeat monitoring" as one of its three workflows. This is a simple but powerful pattern: an agent that doesn't send a heartbeat is presumed dead.

**Opportunity:** Build an "agent liveness" service on top of KeeperHub where agents register heartbeats and other agents/humans can monitor liveness. Dead agents get their reputation slashed.

### 14.4 The "reputation caching" territory

Tradewise included "reputation caching" — mirroring onchain reputation locally for fast reads. This is a real engineering problem: onchain reads are slow and rate-limited.

**Opportunity:** Build a "reputation cache" service that subscribes to ERC-8004 ReputationRegistry events and serves cached reads via MCP. Agents query the cache (free) or the chain (paid).

### 14.5 The "Three Workflow Pattern" itself

Tradewise's three-workflow pattern (heartbeat + reputation + compliance) is itself a reusable architecture. The judges praised the "production seriousness" of running three workflows in concert.

**Opportunity:** Make the three-workflow pattern a first-class architecture in your project. Don't just have one workflow; have three (or more) that work together.

---

## 15. THE THREE KILLERS: WHY MOST PROJECTS WILL LOSE

Based on the OpenAgents data, here are the three reasons most projects will lose:

### 15.1 Killer 1: No working mainnet transaction

30 of 180 OpenAgents projects (17%) were "surface integrations, one workflow created, rarely executed meaningfully." Many others likely had testnet-only transactions.

**Why it kills:** The judges explicitly weight Criterion 1 ("Does it execute onchain via KeeperHub?") the heaviest. No working transaction = automatic disqualification from top 3.

**Prevention:** Ship a working mainnet transaction in the first 48 hours. Use gas sponsorship. Don't wait.

### 15.2 Killer 2: No real agent loop

25 of 180 OpenAgents projects (14%) used the "passive webhook pattern" — the agent acts, KeeperHub gets notified. No real agent loop.

**Why it kills:** The judges want to see KeeperHub as part of the reasoning surface, not just the settlement layer. Passive webhook = shallow integration.

**Prevention:** Your agent should discover and call KeeperHub workflows via MCP. The agent's decision should depend on KeeperHub's response. The agent should re-evaluate based on the audit trail.

### 15.3 Killer 3: No failure-mode thinking

The judges explicitly praised ZW.ARM's gamma critique agent as "the kind of failure-mode thinking that most hackathon projects skip." Implied: most projects skip it.

**Why it kills:** Without failure-mode thinking, your project doesn't demonstrate Criterion 3 (Reliability and observability). You're competing on Criterion 4 (Originality) and Criterion 5 (DX) alone — insufficient to win.

**Prevention:** Add a critique/veto agent. Show a transaction failing and being retried. Show the audit trail being used to debug. Show the agent refusing to execute a dangerous action.

---

## 16. SCORING MODEL: HOW TO SELF-ASSESS BEFORE SUBMITTING

Use this scoring model to self-assess your project before submission. Maximum 100 points.

### 16.1 Criterion 1: Onchain execution via KeeperHub (30 points max)

| Sub-criterion | Points | Self-assessment |
|---|---|---|
| At least one real transaction on mainnet (not testnet) | 10 | |
| Multiple transactions (10+) over the hackathon period | 5 | |
| Non-trivial transactions (protocol actions, not just transfers) | 5 | |
| Transaction traceable to KeeperHub audit trail | 5 | |
| Transaction hash prominently displayed in README | 5 | |
| **Subtotal** | **/30** | |

### 16.2 Criterion 2: Use of KeeperHub surfaces (25 points max)

| Sub-criterion | Points | Self-assessment |
|---|---|---|
| MCP server used (visible in agent config) | 5 | |
| CLI used (visible in scripts/CI) | 4 | |
| x402 payment settled (visible on x402scan) | 4 | |
| MPP payment settled (visible on mppscan) | 4 | |
| Workflow builder used (workflow ID referenced) | 4 | |
| Audit trail queried/displayed (visible in demo) | 4 | |
| **Subtotal** | **/25** | |

### 16.3 Criterion 3: Reliability and observability (20 points max)

| Sub-criterion | Points | Self-assessment |
|---|---|---|
| Multi-agent system with critique/veto agent | 5 | |
| Retry behavior demonstrated (forced failure + retry) | 5 | |
| Gas handling visible (smart gas adaptation in audit trail) | 3 | |
| Audit trail used for post-mortem/debugging | 4 | |
| Per-user wallet provisioning | 3 | |
| **Subtotal** | **/20** | |

### 16.4 Criterion 4: Originality and real-world usefulness (15 points max)

| Sub-criterion | Points | Self-assessment |
|---|---|---|
| Project is NOT on the forbidden list | 5 | |
| Project would lose main advantage without KeeperHub | 5 | |
| Project is a billion-dollar company idea | 5 | |
| **Subtotal** | **/15** | |

### 16.5 Criterion 5: Integration quality and DX (10 points max)

| Sub-criterion | Points | Self-assessment |
|---|---|---|
| Clean separation of concerns (core + adapters) | 3 | |
| 50+ tests | 3 | |
| README a stranger can deploy from in 30 minutes | 2 | |
| Conventional commit history | 1 | |
| Bug report filed against KeeperHub | 1 | |
| **Subtotal** | **/10** | |

### 16.6 Total score

| Tier | Score | Expected outcome |
|---|---|---|
| Tier S | 90-100 | Strong contender for 1st place |
| Tier A | 75-89 | Likely top 3 |
| Tier B | 60-74 | Likely honourable mention |
| Tier C | 45-59 | Mid-pack |
| Tier D | <45 | Bottom third |

**Target: 90+ (Tier S).** If you're below 75 on day 10, pivot hard.

---

## 17. THE 14-DAY BUILD PLAN

The hackathon runs from 2026-07-27 to 2026-08-13 (roughly 18 days). Assume you lose 4 days to life/admin/integration friction. Plan for 14 effective build days.

### 17.1 Days 1-2: Foundation (CRITICAL)

**Goal:** Working mainnet transaction through KeeperHub.

- [ ] Register for hackathon on DoraHacks.
- [ ] Join KeeperHub Discord; introduce yourself in `#general`.
- [ ] Install `kh` CLI: `brew install keeperhub/tap/kh`.
- [ ] Authenticate: `kh auth login`.
- [ ] Read CLI quickstart: <https://docs.keeperhub.com/cli/quickstart>.
- [ ] Add MCP server to Claude Code: `claude mcp add --transport http keeperhub https://app.keeperhub.com/mcp`.
- [ ] Verify connection: `kh status` or ask Claude "check my KeeperHub connection status".
- [ ] Claim gas sponsorship (ask in Discord `#builder` channel).
- [ ] Create first workflow (visual builder or MCP).
- [ ] Execute first workflow on mainnet.
- [ ] Record transaction hash.

**Exit criterion:** A mainnet transaction hash you can paste into the submission.

### 17.2 Days 3-4: Project skeleton

**Goal:** Working project skeleton with README, tests, CI.

- [ ] Create GitHub repo (public).
- [ ] Write README v0 (one-paragraph project description).
- [ ] Set up pnpm + TypeScript + Next.js (if frontend) or Python (if backend-only).
- [ ] Add KeeperHub SDK: `npm install @keeperhub/sdk` (or use MCP directly).
- [ ] Add `@keeperhub/wallet`: `npx -p @keeperhub/wallet keeperhub-wallet skill install`.
- [ ] Set up test framework (Vitest for TS, pytest for Python).
- [ ] Write first test (smoke test for KeeperHub connection).
- [ ] Set up GitHub Actions CI (lint + type-check + test on every push).
- [ ] Conventional commits setup.

**Exit criterion:** CI green, README v0 published.

### 17.3 Days 5-7: Core implementation

**Goal:** Core project logic working end-to-end.

- [ ] Implement the main agent(s).
- [ ] Implement the critique/veto agent.
- [ ] Wire agents to KeeperHub via MCP.
- [ ] Implement per-user wallet provisioning (if applicable).
- [ ] Implement at least 3 KeeperHub workflows in concert.
- [ ] Implement audit trail query/display.
- [ ] Implement x402 payment flow.
- [ ] Implement MPP payment flow (if applicable).

**Exit criterion:** End-to-end demo works locally. Multiple transactions executed on mainnet.

### 17.4 Days 8-10: Hardening

**Goal:** Production seriousness.

- [ ] Write 50+ tests (target 125 like Tradewise).
- [ ] Add a `docker-compose.yml` for one-command local setup.
- [ ] Add a `Makefile` with common commands (`make setup`, `make test`, `make demo`).
- [ ] Deploy to a cloud environment (Vercel, Railway, Fly.io).
- [ ] Run the system live for 24+ hours.
- [ ] Collect metrics: transaction count, success rate, gas used.
- [ ] File at least 1 bug report against KeeperHub (bounty track).

**Exit criterion:** Live deployment running. Metrics collected. Bug report filed.

### 17.5 Days 11-12: Demo polish

**Goal:** Demo video and submission materials.

- [ ] Write demo script (90-120 seconds).
- [ ] Record demo video (use Loom, OBS, or QuickTime).
- [ ] Write README v1 (full project description, architecture, setup, demo link, transaction hash, team).
- [ ] Write architecture diagram (use Excalidraw or Mermaid).
- [ ] Take screenshots of the dashboard/UI.
- [ ] Prepare a 1-page "pitch deck" PDF (optional but helps judges).

**Exit criterion:** Demo video recorded. README v1 published.

### 17.6 Days 13-14: Submission

**Goal:** Submit BUIDL with time to spare.

- [ ] Submit BUIDL on DoraHacks (link to GitHub, demo video, transaction hash).
- [ ] Verify all three required artifacts are present.
- [ ] Test the submission from a judge's perspective (can they access everything?).
- [ ] Post in Discord `#builder` channel: "Submitted! Here's our project: [link]".
- [ ] Engage with judges' questions in Discord.
- [ ] Prepare backup demo recording in case live demo fails.

**Exit criterion:** BUIDL submitted 24+ hours before deadline.

### 17.7 Buffer days (4 days)

Use these for:
- Pivoting if your initial idea doesn't work.
- Fixing integration issues with KeeperHub.
- Adding the bounty track contribution (teardown report).
- Polishing the demo.
- Engaging with the community in Discord.

---

## 18. SUBMISSION CHECKLIST

Before clicking submit, verify:

### 18.1 Required artifacts (NON-NEGOTIABLE)

- [ ] **GitHub repo** (public):
  - [ ] README.md with project description, architecture diagram, setup instructions, demo link, transaction hash.
  - [ ] LICENSE (MIT or Apache-2.0).
  - [ ] Source code with clear folder structure.
  - [ ] Tests (target 50+, stretch 125).
  - [ ] CI workflow (GitHub Actions).
  - [ ] Conventional commit history.

- [ ] **Demo video** (90-120 seconds):
  - [ ] Shows agent executing onchain through KeeperHub.
  - [ ] Shows audit trail.
  - [ ] Shows multi-agent interaction (if applicable).
  - [ ] Shows at least one x402 or MPP payment.
  - [ ] Shows failure-mode handling (retry, critique agent veto, etc.).
  - [ ] Hosted on YouTube, Loom, or Vimeo (public link).

- [ ] **Transaction hash** (real, onchain):
  - [ ] Executed via KeeperHub (traceable in audit trail).
  - [ ] On mainnet (preferred) or testnet (acceptable with justification).
  - [ ] Non-trivial (protocol action, not just a 0-value transfer).
  - [ ] Displayed prominently in README.

### 18.2 Bonus artifacts (highly recommended)

- [ ] Architecture diagram (Mermaid or Excalidraw).
- [ ] Live deployment URL (Vercel, Railway, etc.).
- [ ] Pitch deck (1-page PDF).
- [ ] Bug report(s) filed against KeeperHub (bounty track).
- [ ] Teardown report (bounty track).
- [ ] Twitter/X thread announcing the project.
- [ ] Discord `#builder` channel post.

### 18.3 Self-assessment

- [ ] Total score on the self-assessment model (§16) is 75+.
- [ ] At least one team member can explain the project in 60 seconds.
- [ ] README's first paragraph is a single sentence that a non-technical judge can understand.
- [ ] Demo video shows the project's "wow moment" in the first 15 seconds.
- [ ] The project is NOT on the forbidden list.
- [ ] The project would lose its main advantage without KeeperHub.

---

## 19. COMPARISON AGAINST LIKELY COMPETITORS

Based on the OpenAgents data and the hackathon theme, here are the likely competitor archetypes and how to beat each:

### 19.1 Archetype A: "Yet another DeFi yield agent"

**Description:** An agent that optimizes yield across Aave, Compound, Morpho, etc.
**Why it'll lose:** Done to death. ZW.ARM won with this in OpenAgents; the territory is now closed.
**How to beat:** Don't build this. If you must touch DeFi, build something orthogonal (e.g., agent reputation for DeFi keepers).

### 19.2 Archetype B: "Yet another agent framework adapter"

**Description:** An SDK that wraps KeeperHub for [framework X].
**Why it'll lose:** Keeper-Gate won with this in OpenAgents; KeeperHub has since shipped official adapters (`@keeperhub/mcp`, `hermes-plugin`, `eve-plugin`). The gap is closed.
**How to beat:** Don't build this. Find a different gap.

### 19.3 Archetype C: "Yet another payment agent"

**Description:** An agent that pays for things via x402 or MPP.
**Why it'll lose:** DoorNo.402, Reckon402, and tollgate were honourable mentions in OpenAgents. The territory is becoming crowded.
**How to beat:** Don't build a payment-only agent. Build an agent that EARNS reputation through payments (combining archetype C with the reputation layer).

### 19.4 Archetype D: "Yet another monitoring/alerting agent"

**Description:** An agent that monitors onchain events and sends alerts.
**Why it'll lose:** This is what KeeperHub workflows already do natively. Adding an agent on top adds little value.
**How to beat:** Don't build this. Build an agent that ACTS on alerts (executes transactions in response).

### 19.5 Archetype E: "Yet another DAO treasury agent"

**Description:** An agent that manages a DAO treasury (rebalance, pay contributors, etc.).
**Why it'll lose:** Explicitly on the forbidden list ("Another DAO Agent") unless radically reinvented.
**How to beat:** If you must build this, "radically reinvent" it by adding: (a) multi-agent critique, (b) reputation-based authorization, (c) onchain compliance attestation, (d) cross-chain portability. But honestly, pick a different archetype.

### 19.6 Archetype F: "Novel territory — agent reputation / identity / trust"

**Description:** An agent that builds, queries, or uses reputation/trust infrastructure.
**Why it'll win:** This is the gap (§13.1). Tradewise proved the concept with one agent; nobody has generalized it. The judges explicitly called this "a genuinely novel direction."
**How to position:** Build FIDUCIA (see `PROJECT_MASTER_PLAN.md`). This archetype has the highest expected value.

### 19.7 Archetype G: "Novel territory — agent circuit breakers / risk management"

**Description:** An agent that provides risk management for other agents (circuit breakers, multisig gates, rate limiting).
**Why it could win:** This is gap 13.4. Less proven than archetype F, but still open.
**How to position:** Build this as a fallback if FIDUCIA feels too ambitious. Could also be combined with FIDUCIA (reputation-based circuit breaking).

### 19.8 Archetype H: "Novel territory — agent post-mortem generator"

**Description:** An agent that generates post-mortems from audit trails.
**Why it could win:** This is gap 13.3. Niche but valuable. Could be a strong bounty-track contribution.
**How to position:** Build this as a feature within FIDUCIA, not as a standalone project.

---

## 20. FINAL STRATEGIC RECOMMENDATIONS

### 20.1 The 10 commandments of winning

1. **Thou shalt ship a working mainnet transaction in the first 48 hours.**
2. **Thou shalt use ALL KeeperHub surfaces (MCP, CLI, x402, MPP, workflow builder, audit trail).**
3. **Thou shalt build a multi-agent system with a critique/veto agent.**
4. **Thou shalt provision per-user wallets.**
5. **Thou shalt file bug reports against KeeperHub.**
6. **Thou shalt have 100+ tests.**
7. **Thou shalt deploy live and report real metrics.**
8. **Thou shalt NOT build anything on the forbidden list.**
9. **Thou shalt make thy project impossible without KeeperHub.**
10. **Thou shalt submit 24+ hours before the deadline.**

### 20.2 The winning one-liner

Your project should be describable in one sentence. For FIDUCIA:

> *"FIDUCIA is the trust layer for autonomous onchain agents: every action an agent takes through KeeperHub becomes a verifiable onchain attestation that other agents query before transacting — making KeeperHub's audit trail the foundation of a billion-dollar agent reputation primitive."*

If your one-liner doesn't make a stranger say "oh, that's interesting, tell me more," rewrite it.

### 20.3 The winning demo structure (90 seconds)

1. **0-15s: The problem.** "Autonomous agents are about to move trillions of dollars onchain. But nobody can verify what an agent did, when, or why. There's no trust layer."
2. **15-30s: The solution.** "FIDUCIA turns every KeeperHub audit trail entry into a verifiable onchain attestation. Agents build reputation. Other agents query reputation before transacting. Bad agents get slashed."
3. **30-60s: The demo.** Show 2 agents executing through KeeperHub. Show their reputation scores updating. Show agent A querying agent B's reputation. Show agent B getting slashed for a failed action. Show the dashboard.
4. **60-75s: The tech.** "Built on KeeperHub's MCP server, audit trail, and x402 payments. Attestations anchored to ERC-8004 ReputationRegistry on Ethereum mainnet. Per-user wallets via Turnkey. Multi-agent with critique/veto."
5. **75-90s: The vision.** "This is the credit score for AI agents. The infrastructure layer for the agent economy. Built on KeeperHub — impossible without it."

### 20.4 The winning README structure

```
# FIDUCIA — Trust Layer for Autonomous Onchain Agents

> One-sentence description.

## Why this exists
The problem. The pain. The stakes.

## How it works
Architecture diagram. Three-paragraph explanation.

## What it does
Feature list with screenshots.

## How KeeperHub powers it
Which surfaces are used and why each is essential.

## Demo
Link to demo video. Link to live deployment.

## Transaction proof
Real mainnet transaction hashes.

## Quickstart
Five commands to run it locally.

## Architecture
Folder structure. Tech stack. Key files.

## Testing
How to run tests. Test count.

## Roadmap
What's next. The billion-dollar vision.

## Team
Who built this.

## License
MIT or Apache-2.0.
```

### 20.5 The winning mindset

The judges are not looking for the best demo. They're looking for the project they want to exist in the world. Build the project that, if it existed, you would use yourself. Build the project that, if it didn't exist, the world would be worse off. Build the project that makes KeeperHub more valuable.

If you do that, the prizes follow.

---

## END OF HACKATHON INTELLIGENCE

**Document version:** 1.0
**Compilation date:** 2026-07-21
**Compiler:** Elite research team
**Next document:** `PROJECT_MASTER_PLAN.md`

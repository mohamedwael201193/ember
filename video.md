# KeeperHub team videos — deep brief for EMBER

Sources actually watched (frames + captions):

1. **ETHGlobal Open Agents workshop** — [k6D7iIKKRiM](https://www.youtube.com/watch?v=k6D7iIKKRiM) (~19 min)  
   Title: *KeeperHub: Onchain Agent Execution Infrastructure | ETHGlobal Open Agents Hackathon*  
   Speaker: **Luca** (growth / DevRel at KeeperHub)

2. **Tempo live product demo** — [KhtYnc1uRXw](https://www.youtube.com/watch?v=KhtYnc1uRXw) (~8:48)  
   Title: *5 Tempo Payment Workflows, Built and Run Live*

Captions often mis-hear “KeeperHub” as “Keepab / Kebab / Keep up”. Below uses the correct product name.

Working copies of watch extracts live under `docs/demo/watch-kh-workshop/` and `docs/demo/watch-khtync1u/` (gitignored media).

---

## One-sentence thesis (both videos)

**Agents decide. KeeperHub executes** — retries, gas, simulation, signing, audit trail — so the transaction actually lands onchain. The team wants builders who **contribute to that execution layer**, not black-box apps that hide KeeperHub.

---

# Video 1 — ETHGlobal workshop (what the team teaches)

## Who / why

- Luca opens: first KeeperHub × ETHGlobal Open Agents hackathon; team is excited/nervous; will help in Discord 24/7.
- Goal of the talk: give **tools + inspiration** to build **on top of KeeperHub infrastructure**, and clarify **what wins the prize track**.

## Part A — Product surfaces they show on camera

### Hub (template library)

- Hub = public **workflow templates** shared by the community.
- Demo: search “Aave” → **Aave V3 crosschain liquidation dashboard** → **Use template** → clones into a **private** workspace.
- Authors can share to Hub for copy/reuse.

### Marketplace / strategies (different from Hub)

- Next to Hub: **Marketplace** — publish a workflow as a **priced strategy**.
- Strategy listing does **not** dump private steps into Hub (so people can’t just copy the IP).
- Authors see earnings; other agents can **discover + pay to run**.
- Framing: **marketplace for onchain strategies**; KeeperHub is the **execution layer of that marketplace**.

### Run + Runs (audit trail) — the reference demo

Luca presses **Run** on the template and stresses what KeeperHub owns when something executes:

| Capability they name | Meaning for judges |
| --- | --- |
| Retries | Failed / congested txs don’t silently die |
| Gas adaptation | Engine adapts when gas spikes |
| Simulation | Preflight before broadcast |
| Signing | Managed execution path |
| Runs / audit trail | Every run + step visible |

This UI loop is the **baseline UX** they want every submission to respect:

```text
Workflow canvas → Run → Runs (steps green) → (onchain when applicable)
```

## Part B — Where KeeperHub sits in the agent stack

Luca’s stack (top → bottom):

1. **Agent frameworks** — LangGraph, OpenClaw, Eliza, etc. (reasoning)
2. **Communication** — MCP (Anthropic), A2A (Google)
3. **Identity / wallets** — ERC-8004 as identity/reputation registry
4. **Payments** — x402, MPP
5. **Reliable execution** — **KeeperHub** (retries, gas, simulation, SLAs, audit trail)
6. **Onchain settlement** — EVM / L2s

### The gap they say kills agents today

Not frameworks or wallets — **execution reliability**:

- Gas spike during liquidation → tx stuck in mempool → someone else lands
- **Silent failures** — agent thinks it succeeded; no audit trail to prove otherwise

Slogan they repeat:

> **The agent decides. KeeperHub executes.**  
> Fail → retry. Gas spike → adapt. Full audit of attempts / reverts / gas. SLA-backed.

## Part C — Team credibility they sell

- Ex MakerDAO / Sky protocol devops; production keepers ~7 years
- Globally distributed (hackathon support all timezones)
- KeeperHub = default execution layer for onchain agents; hackers should help make it *more* default

### What KeeperHub is / isn’t

- **Is:** visual workflow builder (n8n-like for onchain ops) **and** programmatic infra agents call
- Long-term framing for the hackathon: infra component like **Turnkey for wallets / Alchemy for RPC** — not “just a UI toy”
- Interfaces: **MCP (primary)**, CLI, x402/MPP for paying agents
- Testing wallets: they casually mention agent-cache style wallets for demos (not a security claim)

## Part D — MCP + Claude demo (the emotional center of the workshop)

### How agents connect

1. Docs → search **MCP** → connect remote server (today: `https://app.keeperhub.com/mcp` per current docs)
2. Claude Code / Claude Desktop / any MCP client → tools appear with schemas
3. Same pattern for Eliza / AgentKit / LangChain / anything that speaks MCP

### Two interaction shapes

| Shape | Agent calls | KeeperHub does |
| --- | --- | --- |
| **Direct execution** | `execute_protocol_action`, `execute_contract_call`, transfers… | Land the tx (retry/gas/sim) — reactive |
| **Workflows** | `create_workflow` / `ai_generate_workflow` | Persist trigger+actions; run continuously (cron/event) while agent sleeps |

Shared primitives under both:

- Triggers: schedule, webhook, onchain events  
- Condition nodes  
- Action nodes: ERC-20, protocol actions (Aave, Compound, Sky…), arbitrary `execute_contract_call`

### Live Claude → canvas story (~40 seconds)

Intent pasted into Claude (MCP connected):

> Watch an ERC-4626 vault; when utilization drops below a threshold, deposit idle USDC from a treasury wallet; notify Discord.

Flow shown:

1. Claude asks clarifying questions (protocol = Aave V3, network = Ethereum mainnet, placeholders OK)
2. Agent uses **AI generate workflow** + **create workflow**
3. Canvas appears: hourly schedule → utilization check (code node) → condition → approve → deposit → Discord
4. Placeholders called out honestly for demo

**Takeaways Luca wants:**

1. This is today’s KeeperHub UX baseline  
2. Every node / action type / protocol integration / framework connection is something **they** built — so hackers should **extend** that surface

## Part E — What the team loves (hackathon intent)

Explicit: **not** looking for agents that use KeeperHub as a **black box**.

Looking for **contributions they can merge / adopt / ship to every KeeperHub user**.

### Direction 1 — Protocol / chain plugins (biggest bucket)

- First-class nodes for protocols not supported yet (lending, perps, LST, bridges, risk primitives…)
- Or deepen an existing integration

### Direction 2 — Framework integrations

- Clean KeeperHub plugin/wrapper for OpenClaw, Eliza, LangChain, etc.
- Win condition: official-adoption quality — builders get KH natively without glue-code hell

### Direction 3 — Features / DX inside KeeperHub

Examples they name:

- New workflow nodes  
- Better simulation / debugging / observability  
- Testing harnesses  
- MCP server improvements  
- **Onboarding / UX** (they call Web3 UX everyone’s kryptonite — friction you hit = contribution opportunity)

### Specific callout — agent economy wiring

They love a clean story that connects:

Hub publish / priced strategy → **ERC-8004** discovery → **x402 / MPP** payment → reputation posted after runs  

…so KeeperHub becomes execution + evidence for a discoverable paid strategy.

### Tone

Open-ended; prize page has the formal breakdown; Discord/Telegram/X for questions. They apologize for going long and thank builders who contribute.

---

# Video 2 — Tempo payment workflows live (what “good demo” looks like now)

## Intent of the video

Show **KeeperHub native on Tempo**: five **real** payment workflows, built mostly by **describing them to Claude (MCP)**, then **Run** on **Moderato / Tempo testnet** — “no code, no paid nodes” framing.

This is the **demo aesthetic** judges internalize: NL → MCP → canvas → enable/run → Runs all green → explorer proof.

## Workflow 1 — Deposit watch + Discord alert

**Describe:** watch a Tempo deposit wallet for incoming path USD; alert when payment exceeds a size.

**What happens:**

- KeeperHub discovers Tempo actions via MCP  
- Builds: **transfer trigger** (path USD on Tempo testnet) → **condition** (amount > 100) → **Discord alert**  
- Fills network, token, deposit address from the prompt  
- Enable workflow → send test payment from terminal → **Runs**: catch → threshold → alert, all green  
- Emphasized: **executing on Tempo, not just a simulation**  
- Open execution output: value, address, full breakdown

## Workflow 2 — Forward with memo + expiry

**Describe:** incoming payment carries memo; forward a fixed amount; expire if it doesn’t land in time.

**What happens:**

- Claude + MCP again  
- Three steps: incoming transfer → payment expiry → transfer with memo (forward **25 path USD**, reuse memo)  
- Default **disabled** until human enables (safety habit they show repeatedly)  
- Test payment → all three complete → Tempo testnet explorer shows landed **memo and all**

## Workflow 3 — Swap on demand

**Describe:** sell 500 path USD for alpha USD via Tempo’s exchange with tight slippage (revert rather than bad fill).

**What happens:**

- Canvas: **Manual trigger** + **swap stablecoins** Tempo service  
- Click Run → trigger + swap complete → fill within limit → explorer verify

## Workflow 4 — Sign and hold (human control)

**Describe / build in UI:** sign payment now but **hold** until release (person or schedule).

**What happens:**

- Tempo node **sign and hold payment** (amount, recipient, memo, scheduled release, valid-before window)  
- Run → payment **parks as held** (not sent)  
- Release requires **authenticator / human approval** before value leaves  
- Then broadcast lands on testnet  

Lesson they sell: **control** — nothing dangerous runs unsupervised; held payments are first-class.

## Workflow 5 — Monthly / batch pay run

**Describe:** list of recipients + amounts + shared memo.

**What happens:**

- KeeperHub flags if two payments share a recipient before build  
- Result: single batch payout (demo: three Alpha USD payments, 450 total)  
- Manual trigger + payouts node  
- Execute → settle **together in one atomic transaction** on Tempo → explorer shows all three

## Closing line of Tempo video

> Describe the payment flow you need and run it reliably on chain.

---

# Cross-video: what KeeperHub “loves” (judge lens for EMBER)

| They love | They dislike / downrank |
| --- | --- |
| Visible **KeeperHub canvas + Run + Runs** | Hidden dependency (only your app + explorer) |
| **MCP / Claude** creating or driving workflows | Manual-only story with no agent surface |
| **Real execution** (testnet/mainnet) with audit steps green | Simulation-only claims |
| **Mergeable contributions** (plugins, fixtures, DX, MCP) | Black-box “we used KeeperHub once” apps |
| Clear split: agent decides / KH executes | Pretending KH does your product’s brain |
| Reliability narrative (retry, gas, sim, audit) | Silent failure with no proof |
| Optional: marketplace / x402 / ERC-8004 economy wiring | Checkbox theater without evidence |

---

# Mapping to EMBER (honest)

### Aligned with team love

- Real KeeperHub workflows execute USDC on Base mainnet (primary + standby replay + anchor path)
- MCP: inspect / validate / smoke execute / `get_execution` with matching IDs
- Continuity story = reliability after **missed invocation** (complementary to KH retries of a *requested* run)
- Contribution pack (execution recovery fixtures) aimed at mergeable CLI/DX

### Must show like their demos (still the submission gap)

Their videos always put **KeeperHub UI + agent MCP + Runs** on screen.  
EMBER’s remaining first-place risk is a demo that is only EMBER site → BaseScan.

Canonical beat sheet: `docs/DEMO_VIDEO_DORAHACKS.md`.

### Do not confuse Tempo demo with EMBER scope

Video 2 is **Tempo payment rails** (path/alpha USD, hold/release, batch atomic payout).  
EMBER’s certified evidence is **Base mainnet USDC continuity** — same *demo pattern*, different chain/product surface. Do not claim Tempo features as shipped EMBER.

---

# Memorable quotes (paraphrased accurately)

- “Agent decides. KeeperHub executes.”
- Gap isn’t reasoning — it’s **landing the tx** under congestion and silent failure.
- Hackathon: **contributions we can merge**, not black-box usage.
- Baseline UX: intent → MCP → canvas in ~40s; then Run / Runs.
- Tempo closer: “Describe the payment flow you need and run it reliably on chain.”

---

# Bookmark list Luca pushes

- ETHGlobal Discord KeeperHub channel  
- KeeperHub Discord  
- Docs: https://docs.keeperhub.com/  
- Link tree: https://keeperhub.com/links  
- App: https://app.keeperhub.com/  
- MCP docs: https://docs.keeperhub.com/ai-tools/mcp-server  

---

*Last synthesized: 2026-08-11 from `/watch` captions + keyframes of both URLs above.*

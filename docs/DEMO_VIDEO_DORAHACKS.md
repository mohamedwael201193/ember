# DoraHacks demo video — Agents Onchain / The Last Mile

Judges reward **working onchain execution through KeeperHub**, not polish alone.
This pack is how EMBER wins the submission checklist and the story in ≤ 90 seconds.

Live product: https://ember-web-seven.vercel.app  
Repo: https://github.com/mohamedwael201193/ember  
Hackathon: https://dorahacks.io/hackathon/agents-onchain/detail

---

## Can Cursor auto-record a narrated demo?

**Not with the MCPs currently installed in this workspace.**

| Capability | Status here |
|---|---|
| Chrome DevTools MCP (navigate / screenshot) | Available — no full video + TTS |
| NarrateAI DemoMaker / Playback / DemoSmith / demo-recorder-mcp | **Not installed** — those *can* record + voiceover if you add them |
| Agent inventing fake txs | Forbidden — only use real Basescan links below |

### If you want agent-recorded video later

Add one of these to Cursor MCP, then ask the agent to record:

1. **NarrateAI DemoMaker** — [narrateai-app/demomaker-plugin](https://github.com/narrateai-app/demomaker-plugin) (narrated MP4 from a plan)
2. **Playback** — [playback.mov](https://playback.mov/) macOS capture + MCP edit (`playback-mcp`)
3. **DemoSmith** — [G0d2i11a/demosmith-mcp](https://github.com/G0d2i11a/demosmith-mcp) (Playwright + TTS)
4. **demo-recorder-mcp** — [Schimuneck/demo-recorder-mcp](https://github.com/Schimuneck/demo-recorder-mcp)

Until then: record with OBS / Loom / Windows Game Bar using the script below. Screenshots for B-roll: `docs/screenshots/`.

---

## Submission links (paste into DoraHacks)

| Field | Value |
|---|---|
| Source code | https://github.com/mohamedwael201193/ember |
| Demo video | *(upload after recording)* |
| KeeperHub / onchain tx (primary) | https://basescan.org/tx/0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2 |
| Continuity contract | https://basescan.org/address/0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770 |

### Backup mainnet txs (show if asked)

- PAYDAY slot 1: https://basescan.org/tx/0xeb670541f1646dc55e2403d97ba683c7f325c7e38161b1c415da5e8b5bb86888
- PAYDAY slot 2: https://basescan.org/tx/0x9288d13aa65976b2fb996b4764be4ab098f22631094a28a5e5f8ea6e36b9eec3
- Rescue replay: https://basescan.org/tx/0x474376218593b8d3fbecb103286129b91dd6590fad779514b636cc480d6c8e41
- Deploy Continuity: https://basescan.org/tx/0x050014bf756531fcc94b13dd3f254ef4d0f661049e3759600a5e4466e0a6a3a6
- Marketplace fee settlements (x402): https://basescan.org/tx/0xabbe77bc77f922d67d7430c77486f4dc6d913c8bb4a810bb07dade644bdd3563

Evidence JSON: `docs/evidence/mainnet-payday-slots-2026-07-23.json`, `mainnet-rescue-2026-07-23.json`, `mainnet-continuity-deploy-2026-07-23.json`.

---

## Win framing (say this once, early)

> “Agents can decide. The last mile is moving value. EMBER detects unpaid AI payroll, restores it from a standby org, and every transfer executes on Base mainnet through KeeperHub — with an audit trail and sealed proof.”

That maps to judging: **execution · KeeperHub surfaces · reliability · usefulness**.

---

## 75–90s recording script (recommended)

Record at **1440×900**, browser zoom 100%, hide bookmarks. Prefer **Live** mode when showing Basescan; Demo Mode is fine for UI story beats.

### 0:00–0:12 · Hook + landing

**Open:** https://ember-web-seven.vercel.app/

**Show:** Hero badge **Live on Base Mainnet** + orbit (PAY → MISS → RESTORE → PROOF).

**Say:**
> “When an AI payroll agent dies, money stops. EMBER is continuity for onchain payroll — detect, restore, prove — executed through KeeperHub on Base mainnet.”

### 0:12–0:28 · Living console

**Open:** `/app`

**Say:**
> “This is the ops console. Topology, health, and the payment river. Green means verified receipts. Gaps are what the standby org must rescue.”

### 0:28–0:42 · PAYDAY = real KeeperHub money

**Open:** `/app/executions` then click a payment → open Basescan in a new tab.

**Say:**
> “PAYDAY is not a mock. Org A pays the employee through a KeeperHub workflow. Here’s the Base mainnet transaction.”

**Show URL bar:** `basescan.org/tx/0xd26e61…`

### 0:42–1:05 · Rescue (hero beat)

**Open:** `/app/rescues`

**Say:**
> “Primary agent goes down. Observer sees unpaid slots from receipts. Sentinel replays payroll from the standby org — again through KeeperHub — then we publish and seal proof.”

**Optional cut:** Basescan rescue tx `0x474376…`

### 1:05–1:20 · Proof + close

**Open:** `/app/proofs` then Continuity contract on Basescan.

**Say:**
> “Fingerprint, IPFS publish, onchain seal. If any layer disagrees, the proof fails. That’s the last mile: agents decide, KeeperHub executes, EMBER keeps the mission alive.”

**End frame:** Landing or GitHub README for 2 seconds.

---

## Longer cut (≤ 3 min)

Use root `DEMO_SCRIPT.md` for Mission Builder + Wallets. Keep the **Basescan open** beat — judges need to see a real hash.

---

## Voiceover tips

- Calm, slightly slow; no hype adjectives.
- Say **KeeperHub** and **Base mainnet** out loud at least twice.
- Never say Sepolia in the DoraHacks cut.
- If UI still shows an old Sepolia workflow in KeeperHub cloud, open **`payday-stream-mainnet`** / mainnet evidence instead — do not film Sepolia as the hero claim.

---

## Pre-flight checklist

- [ ] Hero says **Live on Base Mainnet**
- [ ] At least one Basescan tx is visible on camera
- [ ] KeeperHub mentioned + workflow/audit trail visible if possible
- [ ] Continuity contract link ready
- [ ] Video under ~2 minutes (90s ideal)
- [ ] GitHub public, README has demo + tx links
- [ ] DoraHacks BUIDL has: repo · video · tx link

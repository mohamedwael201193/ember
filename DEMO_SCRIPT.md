# EMBER Demo Script (≤ 3 minutes)

Use **Demo Mode** (header toggle or Settings). Speak calmly. Click slowly.

---

## 0:00–0:25 · Landing (“Why EMBER exists”)

**Open:** `/`

**Say:**
> “Autonomous payroll breaks when the primary agent dies. EMBER detects unpaid payments from receipts, restores them from a standby organization, and seals proof onchain.”

**Do:** Scroll once through the story. Land on the CTA.

**Click:** Enter console / Open app

---

## 0:25–0:50 · Living console

**Open:** `/app`

**Say:**
> “This is the living console — topology, health, and the payment river. Green means verified. Gaps show what must be rescued.”

**Do:** Point at health badge → topology → payment river.

**Click:** Mission

---

## 0:50–1:20 · Mission overview

**Open:** `/app/mission`

**Say:**
> “Mission overview answers five questions: what is running, who gets paid, who protects it, how often, and what’s the latest payment, rescue, and proof.”

**Do:** Hover the three story cards. Open “Technical details” only if asked.

**Click:** Build mission →

---

## 1:20–1:55 · Mission builder (Stripe pace)

**Open:** `/app/mission/new`

**Say / click each step:**

1. **Payer** — “Who pays while healthy.”
2. **Person** — type a name (e.g. `Alex`).
3. **Pay to** — paste a destination or keep sample.
4. **Rhythm** — “How much, how often — receipts prove every pulse.”
5. **Backup** — “Who restores payroll if the primary agent dies.”
6. **Review** — “Looks right?”

**Click:** Save draft · open overview

---

## 1:55–2:20 · PAYDAY

**Open:** `/app/executions`

**Say:**
> “Money visualization: Payer → KeeperHub → Employee. Each card is a receipt-verified payment — not a raw slot dump.”

**Do:** Click one payment receipt link (optional).

---

## 2:20–2:50 · Rescue (hero)

**Open:** `/app/rescues`

**Say:**
> “This is the hero moment. Watch → Decide → Replay → Prove → Publish → Seal → Restored. Every step glows because it actually happened in the certified story.”

**Do:** Let the pipeline animate. Click “See the proof chain.”

---

## 2:50–3:00 · Proofs · close

**Open:** `/app/proofs`

**Say:**
> “Fingerprint, publish, seal, agree. If any layer disagrees, the proof fails. That’s continuity judges can verify.”

**Close:** Return to `/` or `/app`.

---

## Optional 15s · Wallets

**Open:** `/app/wallets`

**Say:**
> “Pays. Rescues. Receives. Protects. No blockchain lecture required.”

---

## Recording checklist

- [ ] Demo Mode badge visible  
- [ ] No failed red network toasts  
- [ ] No raw `MISSION_DOWN` in the spoken script (UI shows “Needs rescue”)  
- [ ] Browser zoom 100%, 1440×900  
- [ ] Quiet desktop / hide bookmarks bar  

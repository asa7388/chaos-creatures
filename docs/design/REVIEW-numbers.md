# Numbers Audit — Cross-Document Consistency Review

**Auditor:** numbers-auditor agent
**Date:** 2026-02-16
**Scope:** All docs in `docs/design/` (00 through 10) plus `CLAUDE.md` and `_prd-brief.md`

---

## Summary

| Category | Matches | Mismatches | Notes/Warnings |
|---|---|---|---|
| Game Mechanics | 38 | 4 | Shard costs, chaos roll formula, turn phases, mana cap |
| Economy | 18 | 7 | Shard costs, loss dust, quest rewards, dust bonuses, pack contents |
| Technical/AI | 14 | 2 | Infrastructure stack in brief and 00 |
| Content Counts | 10 | 2 | Stabilizer counts, Probability Anchor existence |
| **Total** | **80** | **15** | |

---

## Critical Mismatches

These contradictions would cause implementation bugs if the wrong value is used. The PRD (10-prd.md) already identified and resolved Gaps 1-5 below, but the **source docs themselves remain unpatched** -- the incorrect values still exist in those files.

### CRITICAL-1: Shard Costs — Three Different Sets of Values

| Shard Tier | 00-master / 01-battle | 04-economy / 10-PRD (resolved) | 06-technical (seed SQL) | _prd-brief |
|---|---|---|---|---|
| Uncommon | 30 | **25** | 30 | 25 |
| Rare | 60 | **75** | 60 | 75 |
| Epic | 120 | **150** | 120 | 150 |
| Legendary | 240 | **240** | 240 | (missing) |

- **Source docs with OLD values (30/60/120/240):** `00-game-design-master.md` line 88, line 334; `01-battle-mechanics.md` lines 1235-1238; `06-technical-architecture.md` lines 604-607 (seed SQL).
- **Source docs with NEW values (25/75/150/240):** `04-progression-economy.md` lines 173-176, 322-325, 1045-1047; `10-prd.md` REQ-039 line 286, Gap 5 resolution line 958.
- **PRD Resolution:** Use 25/75/150/240 from `04-progression-economy.md`. Store in `economy_config` table.
- **Action needed:** Update `00-game-design-master.md`, `01-battle-mechanics.md`, and `06-technical-architecture.md` seed SQL to match 25/75/150/240. Currently these three docs still contain the old 30/60/120/240 values.

### CRITICAL-2: Chaos Roll Formula — Brief Has Completely Wrong Mechanics

| Doc | Chaos Trigger | Order Trigger | Nothing Trigger |
|---|---|---|---|
| **00-master** (line 486-488) | Roll < instability | Roll > instability | Roll == instability |
| **01-battle** (line 132-134) | Roll < instability | Roll > instability | Roll == instability |
| **02-data-model** (line 1125) | Roll < instability | Roll > instability | Roll == instability |
| **10-PRD** REQ-009 | Roll < instability | Roll > instability | Roll == instability |
| **_prd-brief** (line 34-36) | Roll <= instability | Roll > instab BUT within 5: Nothing | Roll > instability+5: Order |

- **The brief describes a completely different system** with a 5-point "dead zone" that does not exist in any other document.
- **Action needed:** The brief is obsolete input and should be ignored, but it must not be used as a reference. The canonical formula is: `roll < instability = CHAOS`, `roll > instability = ORDER`, `roll == instability = NOTHING`.

### CRITICAL-3: Turn Structure — Brief Has Wrong Phase Names and Count

| Doc | Phase List |
|---|---|
| **00-master** (lines 419-427) | Start of Turn, Chaos Roll, Event Resolution, Draw & Gain Mana, Main Phase, Declare Attackers, Assign Blockers, Combat Resolution, End Turn |
| **01-battle** (lines 334-349) | Same 9 phases as above |
| **10-PRD** REQ-005 | Same 9 phases |
| **_prd-brief** (line 27) | Upkeep, Chaos Roll, Draw, Main Phase 1, Declare Attackers, Assign Blockers, Combat Resolution, **Main Phase 2**, End |

- **The brief names phases incorrectly** ("Upkeep" instead of "Start of Turn", "Main Phase 1" and "Main Phase 2" instead of a single "Main Phase"). There is NO Main Phase 2 in the game -- all card plays happen before declaring attackers.
- **Action needed:** Ignore brief's phase names. The canonical phases are in 01-battle-mechanics.md Section 3.

### CRITICAL-4: Mana Cap -- Brief Says 6, All Other Docs Say 10

| Doc | Mana Cap |
|---|---|
| **00-master** (line 393) | 10 |
| **01-battle** (line 409) | 10 |
| **02-data-model** (line 761) | 10 |
| **06-technical** (line 1119) | 10 |
| **10-PRD** REQ-004 | 10 |
| **_prd-brief** (line 28) | **6** |

- **10-PRD already resolved this (Gap 2, line 940):** implement mana cap of 10.
- **Action needed:** None for implementation, but the brief is wrong.

### CRITICAL-5: Loss Dust Reward -- Brief Says 10, All Others Say 5

| Doc | Loss Dust |
|---|---|
| **00-master** (line 327) | 5 |
| **01-battle** (line 1220) | 5 |
| **04-economy** (line 130) | 5 |
| **06-technical** (line 600) | 5 |
| **07-ui-ux** (line 1716) | 5 |
| **10-PRD** REQ-037 | 5 |
| **_prd-brief** (line 77) | **10** |

- **10-PRD already resolved this (Gap 3, line 946).**

### CRITICAL-6: Card Pack Contents -- Brief Says 5 Commons, All Others Say 3

| Doc | Pack Contents | Pack Cost |
|---|---|---|
| **00-master** (line 85) | 3 random Commons | 100 Dust |
| **01-battle** (line 1232) | 3 random Commons | 100 Dust |
| **04-economy** (line 170) | 3 random Commons | 100 Dust |
| **09-monetization** (line 886) | 3 Commons | 100 Dust |
| **10-PRD** REQ-034 | 3 random Commons | 100 Dust |
| **_prd-brief** (line 21, 78) | **5 Commons** | 100 Dust |
| **07-ui-ux** (line 982) | (unspecified) | **500 Dust** |

- **10-PRD already resolved this (Gap 1, line 934):** implement 3 Commons for 100 Dust.
- **07-ui-ux line 982** shows "500 Dust" for a card pack which is a separate error (the PRD calls it a "placeholder error").

---

## Non-Critical Mismatches

### MISMATCH-7: Dust Bonus Percentages -- Brief vs All Others

| Doc | Mid Tier Dust Bonus | Top Tier Dust Bonus |
|---|---|---|
| **00-master** (line 356) | +50% quest dust | +100% quest dust |
| **01-battle** (line 1248-1249) | +50% | +100% |
| **04-economy** (line 154-155) | +50% | +100% |
| **10-PRD** REQ-038 | +50% | +100% |
| **_prd-brief** (line 80, 154-155) | **+25%** | **+50%** |

- **Action needed:** Ignore brief. Canonical values are +50% (Mid) and +100% (Top).

### MISMATCH-8: Weekly Quest Count -- Brief Says 3, All Others Say 2

| Doc | Weekly Quests |
|---|---|
| **00-master** (line 329) | 2 per week |
| **01-battle** (line 1222) | 2 per week |
| **04-economy** (line 506+) | 2 per week |
| **10-PRD** P1-001 (line 167) | 2 weekly quests |
| **_prd-brief** (line 83) | **3 weekly quests** |

### MISMATCH-9: Daily Quest Dust Amounts -- Brief vs Economy Doc

| Doc | Daily Quest Rewards |
|---|---|
| **00-master** (line 328) | 25-50 Dust |
| **01-battle** (line 1221) | 25-50 Dust |
| **04-economy** (lines 131-133) | Easy: 20, Medium: 30, Hard: 45 Dust |
| **10-PRD** Gap 4 (line 952) | 20/30/45 Dust (resolved) |
| **_prd-brief** (line 83) | **10-25 Dust** |

- Note: 00-master and 01-battle say "25-50" which is close to but not exactly the economy doc's 20-45 range. The economy doc is the detailed source of truth here.

### MISMATCH-10: Legendary Deck Limit -- Brief Says 1, All Others Say 2

| Doc | Max Legendaries per Deck |
|---|---|
| **00-master** (line 475) | Max 2 per deck, limited to 1 copy each |
| **01-battle** (line 1313) | Max 2 Legendary cards, max 1 copy of each |
| **02-data-model** (line 582) | Max 2 Legendaries, max 1 copy of each Legendary |
| **10-PRD** REQ-035 | Max 2 Legendaries, max 1 copy of each |
| **_prd-brief** (line 12) | **max 1 Legendary per deck** |

### MISMATCH-11: Void Lens — Stabilizer vs Spell Contradiction Within Doc 01

| Doc Section | Void Lens Type | HP |
|---|---|---|
| **00-master** Section 11 (line 598) | Board Stabilizer | 2 HP |
| **01-battle** Section 11 (line 1133) | Stabilizer (board, HP 2) | 2 HP |
| **01-battle** Section 12 (line 1196) | **Spell** (N/A) | N/A |

- In Section 11 of both docs 00 and 01, Void Lens is a board stabilizer with 2 HP.
- In Section 12 of doc 01, it is listed as a "Spell" with "N/A" for instability contribution.
- **Action needed:** Treat Void Lens as a stabilizer (board card with HP 2) per Section 11 in both docs. The Section 12 table entry is incorrect.

### MISMATCH-12: Probability Anchor — Exists in 01 Section 12 but Not in 00 or 01 Section 11

- `01-battle-mechanics.md` Section 12, line 1197 lists "Probability Anchor" (CM 3, While on field: instability treated as 10).
- This card does NOT appear in:
  - `00-game-design-master.md` Section 11 (the canonical stabilizer list)
  - `01-battle-mechanics.md` Section 11 (the canonical stabilizer list with HP values)
- Section 11 lists **5 board stabilizers + 2 manipulation spells = 7 cards** total. The "7 cards" count (00-master line 607) matches this list.
- If Probability Anchor is intended, it should be added to Section 11 in both docs (it would be the 8th card, making the count wrong).
- **Action needed:** Clarify whether Probability Anchor is a launch card. If yes, add it to Section 11 in both docs and update the "7 cards" count. If no, remove it from Section 12.

### MISMATCH-13: Starter Shard Package — Inconsistency Within Doc 04

| Doc | Starter Shards |
|---|---|
| **00-master** (line 77) | "enough shards to evolve 2-3 cards" (vague) |
| **01-battle** (line 1209) | "enough evolution shards to evolve 2-3 cards" (vague) |
| **04-economy** Section 2 (line 276) | 3 Uncommon + 1 Rare + **1 Legendary** |
| **04-economy** Section 3.2 (line 332) | 3 Uncommon + 1 Rare (**no Legendary**) |
| **04-economy** JSON config (lines 1106-1108) | 3 Uncommon + 1 Rare + **1 Legendary** |
| **10-PRD** REQ-047 (line 308) | 3 Uncommon + 1 Rare + **1 Legendary** |

- Doc 04 Section 3.2 omits the Legendary shard from the starter pack table. The JSON config and PRD include it.
- **Action needed:** Update Section 3.2 table to include the Legendary shard.

### MISMATCH-14: Season Length — 00-master vs All Others

| Doc | Season Length |
|---|---|
| **00-master** (line 1175) | ~4-6 weeks |
| **04-economy** (line 631) | 8 weeks (fixed) |
| **06-technical** (line 620) | 8 weeks |
| **09-monetization** (line 578) | 8 weeks |
| **10-PRD** US-008 (line 120) | 8 weeks |
| **_prd-brief** (line 92) | 6-8 weeks |

- **Action needed:** Update `00-game-design-master.md` to say 8 weeks. This is the finalized value from the economy and monetization docs.

### MISMATCH-15: Subscription Price — Ranges vs Fixed

| Doc | Mid Tier Price | Top Tier Price |
|---|---|---|
| **00-master** (line 355-357) | ~$5-8/month | ~$10-15/month |
| **01-battle** (line 1248-1249) | $5-8/mo | $10-15/mo |
| **09-monetization** (line 211) | **$6.99/month** | **$12.99/month** |
| **10-PRD** US-011 (line 128) | **$6.99/mo** | **$12.99/mo** |
| **_prd-brief** (line 154-155) | ~$5-8/mo | ~$10-15/mo |

- Docs 09 and 10 have finalized exact prices ($6.99 and $12.99). Docs 00, 01, and the brief still use ranges.
- **Action needed:** Update 00-master and 01-battle to use the finalized prices ($6.99/$12.99) for clarity, or explicitly note that 09-monetization is the source of truth for pricing.

---

## Verified Matches (Consistent Across All Docs)

### Game Mechanics

| Value | Expected (00/01) | Confirmed In |
|---|---|---|
| D20 roll | 1-20 | 00, 01, 02, 10 |
| Factions at launch | 3 | 00, 01, 02, 05, 10, CLAUDE.md |
| Keywords | 7 (Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing) | 00, 01, 02, 10, CLAUDE.md |
| Deck size | 20 cards | 00, 01, 02, 10, CLAUDE.md |
| Board slots | 5 per side | 00, 01, 02, 06, 07, 10 |
| Life total | 20 HP | 00, 01, 02, 06, 10 |
| Starting hand P1 | 4 cards | 00, 01, 10 |
| Starting hand P2 | 5 cards + Chaos Spark | 00, 01, 10 |
| Mana cap | 10 | 00, 01, 02, 06, 10 |
| Mana per turn | +1 | 00, 01, 10 |
| Turn timer | 60 seconds (decision phases) | 00, 01, 06, 10 |
| Timer warning | 15 seconds remaining | 00, 01, 10 |
| Event sub-timer | 10 seconds | 00, 01, 10 |
| Events per type | 8 Order + 8 Chaos = 16 total | 00, 01, 02, 03, 10 |
| Event selection probability | 12.5% each (1/8) | 00, 01, 02, 10 |
| Instability clamp | 1-20 (player), 0+ (creature) | 00, 01, 02, 10 |
| Taunt rule | Forced attack + forced block | 00, 01, 10, CLAUDE.md |
| No summoning sickness | Confirmed | 00, 01, 10 |
| P1 skip attack turn 1 | Confirmed | 00, 01, 10 |
| Disconnect auto-forfeit | 3 consecutive missed turns | 00, 01, 10 |
| Surrender available | After turn 2 | 00, 01, 10 |
| Max copies per deck | 2 | 00, 01, 02, 10 |
| Max Legendaries per deck | 2 (1 copy each) | 00, 01, 02, 10 |
| Modifier pools | 12 pools x (8 universal + 4 faction) = 240 | 00, 01, 02, 10, CLAUDE.md |
| Modifier selection (Free/Mid/Top) | 2 / 3 / 4 options | 00, 01, 02, 10, CLAUDE.md |
| PP formula | (CM cost x 2) + 1 | 01 |
| Evolution tier multipliers | 1.0x / 1.5x / 2.0x / 2.5x / 3.0x | 01, 10 |
| Shield PP cost | 3 | 01 |
| Deathtouch PP cost | 3 | 01 |
| Lifesteal PP cost | 2 | 01 |
| Flying PP cost | 2 | 01 |
| Piercing PP cost | 2 | 01 |
| Taunt PP cost | 1 | 01 |
| Reach PP cost | 1 | 01 |

### Evolution System

| Value | Expected (00/01) | Confirmed In |
|---|---|---|
| Energy per win | 2 | 00, 01, 02, 04, 10, CLAUDE.md |
| Energy per loss | 1 | 00, 01, 02, 04, 10, CLAUDE.md |
| All 20 deck cards earn energy | Yes | 00, 01, 04, 10, CLAUDE.md |
| Threshold: Common -> Uncommon | 15 | 00, 01, 02, 04, 06, 10, CLAUDE.md |
| Threshold: Uncommon -> Rare | 30 | 00, 01, 02, 04, 06, 10, CLAUDE.md |
| Threshold: Rare -> Epic | 50 | 00, 01, 02, 04, 06, 10, CLAUDE.md |
| Threshold: Epic -> Legendary | 75 | 00, 01, 02, 04, 06, 10, CLAUDE.md |
| Total energy Common -> Legendary | 170 | 00, 01, 04 |
| ~Games to Legendary (50% WR) | ~113 | 00, 01, 04 |
| Channel toward Order: 70% Order / 30% Chaos | Yes | 00, 01, 02, 10 |
| Channel toward Chaos: 70% Chaos / 30% Order | Yes | 00, 01, 02, 10 |
| CM cost fixed through evolution | Yes | 00, 01, 02, 10, CLAUDE.md |
| Modifiers per card (Common to Legendary) | 0/1/2/3/4 | 00, 01, 02 |
| Instability change (Chaos outcome) | +1 at all tiers | 01 |
| Instability change (Order outcome) | 0/0/-1/-2 (Unc/Rare/Epic/Leg) | 01 |

### Economy

| Value | Expected | Confirmed In |
|---|---|---|
| Win dust | 15 | 00, 01, 04, 06, 07, 10 |
| Loss dust | 5 | 00, 01, 04, 06, 07, 10 |
| Card pack (own faction) | 100 Dust, 3 Commons | 00, 01, 04, 09, 10 |
| Card pack (cross-faction) | 150 Dust, 3 Commons + unlock | 00, 01, 04, 10 |
| Specific Common | 50 Dust | 00 |
| Avatar unlock | 300 Dust | 00 |
| Cards per faction (Free/Mid/High) | 50/100/200 | 00, 02, 10 |
| Deck slots (Free/Mid/High) | 3/6/10 | 00, 02, 10 |
| Mid monthly card bonus | +3 Commons/mo | 00, 01, 10 |
| Top monthly card bonus | +5 Commons/mo + 1 Legendary shard | 00, 01, 10 |
| Starter dust | 200 | 04, 10 |
| Daily quests | 3 per day | 00, 01, 04, 10 |
| Weekly quests | 2 per week | 00, 01, 04, 10 |
| Daily evolution cap (Free/Mid/High) | 5/15/30 | 06, 10 |
| Hard daily evolution cap | 50 | 03, 10 |

### AI/Technical

| Value | Expected | Confirmed In |
|---|---|---|
| Base card art resolution | 1024x1024 | 00, 03, 10 |
| Free evolution art resolution | 768x1024 | 00, 02, 03, 10 |
| Mid/Top evolution art resolution | 1024x1024 | 00, 02, 03, 10 |
| Free model: FLUX Kontext Dev | Yes | 00, 02, 03, 10 |
| Mid/Top model: FLUX Kontext Pro | Yes | 00, 02, 03, 10 |
| Prismatic passes | 2 (generate + refine) | 00, 02, 03, 10 |
| Text model: GPT-4o Mini | Yes | 00, 02, 03, 10, CLAUDE.md |
| Cost per free evolution | ~$0.02 | 00, 03 |
| Cost per subscriber evolution | ~$0.04 | 00, 03 |
| Name candidates per evolution | 2-3 | 00, 02, 03, 10 |
| Audio channels max | 12 | 08 |
| Total audio budget | ~25 MB | 08 |
| Prompt modifiers (Free/Mid/Top) | 8-10 / 25-30 / 40+ | 00, 02, 03, 09 |

### Content Counts

| Value | Expected | Confirmed In |
|---|---|---|
| Card templates at launch | 360 faction + 7 universal = 367 | 05, 10 |
| Templates per faction | ~120 (90-125 creatures, 15-20 spells, 5-10 stabilizers) | 00, 05, 10 |
| Modifier definitions | 240 | 00, 01, 02, 10, CLAUDE.md |
| Universal modifiers | 96 (12 pools x 8) | 01, 02 |
| Faction modifiers per faction | 48 (12 pools x 4) | 01, 02 |
| Order events | 8 (O1-O8) | 01, 02, 10 |
| Chaos events | 8 (C1-C8) | 01, 02, 10 |
| Avatars at launch | 6 (2 per faction) | 00, 02, 10 |
| Universal visual prompt modifiers | 30 (U01-U30) | 03, 10 |
| Per-faction visual prompt modifiers | 28 each (IF/FF/DF 01-28) | 03, 10 |

---

## Infrastructure Stack Verification

All docs (03-10) must reference the correct stack from CLAUDE.md: Supabase, Railway, Expo (React Native), fal.ai, Cloudflare R2, PostHog, OpenAI.

| Doc | Stack Correct? | Issues |
|---|---|---|
| **00-game-design-master.md** | PARTIAL | Section 13 (line 640-644) lists generic "React Native / Flutter / PWA" for client and "Replicate or Fal.ai" for AI. CLAUDE.md mandates React Native (Expo) and fal.ai specifically. Also lists "Node.js or Python" instead of Railway Node.js/TypeScript. |
| **01-battle-mechanics.md** | YES | No infrastructure references (pure game mechanics). |
| **02-card-data-model.md** | YES | References match (fal.ai, GPT-4o Mini, Cloudflare R2). |
| **03-prompt-templates.md** | YES | Fully aligned: fal.ai, OpenAI, Cloudflare R2, Supabase, Railway, PostHog. |
| **04-progression-economy.md** | YES | References PostHog for analytics alerts. |
| **05-content-pipeline.md** | YES | fal.ai, OpenAI, Cloudflare R2, Supabase. Explicitly replaced generic references. |
| **06-technical-architecture.md** | YES | Fully aligned. Includes changelog noting removal of AWS/GCP/Redis/BullMQ/Kong. |
| **07-ui-ux-specs.md** | YES | References Expo, React Native, Supabase, expo-av. |
| **08-audio-design.md** | YES | References expo-av for audio playback. |
| **09-monetization-details.md** | YES | References RevenueCat, Supabase, PostHog, fal.ai. |
| **10-prd.md** | YES | Fully aligned. Revision log documents all stack changes from v1.0. |
| **_prd-brief.md** | NO | Lists Kong, AWS API Gateway, Socket.io, BullMQ, Redis, S3/GCS, Datadog, Grafana, Prometheus, BigQuery, Replicate (lines 100-105). All wrong per CLAUDE.md. |

**Action needed for 00-master:** Update Section 13 (Technical Direction) to use the exact stack from CLAUDE.md instead of generic alternatives. This section appears to be an early draft that was not updated when the infrastructure decisions were finalized.

---

## The _prd-brief.md Problem

The `_prd-brief.md` file contains **at least 12 incorrect values** across nearly every category. It appears to be an early condensed draft created before docs 03-10 were finalized. The PRD (10-prd.md) already identified and resolved 5 of these discrepancies in its Gaps section.

**Full list of brief errors:**

| # | Error in Brief | Correct Value | Source of Truth |
|---|---|---|---|
| 1 | Mana cap = 6 | 10 | 00/01/02/10 |
| 2 | Loss dust = 10 | 5 | 00/01/04/10 |
| 3 | Card pack = 5 Commons | 3 Commons | 00/01/04/10 |
| 4 | Shard costs: Unc=25, Rare=75, Epic=150 (Legendary missing) | 25/75/150/240 | 04/10 |
| 5 | Dust bonus: Mid +25%, Top +50% | +50% / +100% | 00/01/04/10 |
| 6 | Daily quests: 10-25 Dust each | 20/30/45 Dust | 04/10 |
| 7 | 3 weekly quests | 2 weekly quests | 00/01/04/10 |
| 8 | Max 1 Legendary per deck | Max 2 (1 copy each) | 00/01/02/10 |
| 9 | Chaos roll has a 5-point dead zone | Simple < / > / == comparison | 00/01/02/10 |
| 10 | Turn phases include Main Phase 1 and Main Phase 2 | Single Main Phase only | 00/01/10 |
| 11 | Infrastructure: Kong, Socket.io, Redis, S3, BullMQ, etc. | Supabase, Railway, R2, etc. | CLAUDE.md |
| 12 | Weekly quests: 50-100 Dust each | 150-200 Dust | 04 |

**Recommendation:** Either delete `_prd-brief.md` or add a prominent header stating it is superseded by the final docs and should not be referenced for implementation.

---

## Derived Calculation Checks

### Shard Cost Full Path (Common to Legendary)

Using the **04-economy resolved values** (25/75/150/240):
- Total: 25 + 75 + 150 + 240 = **490 Dust**

Using the **00/01/06 old values** (30/60/120/240):
- Total: 30 + 60 + 120 + 240 = **450 Dust**

Doc 04 references "450 Dust" for full evolution path in several places (lines 212, 252, 365, 370, 375, 409). This matches the OLD shard costs (30/60/120/240), NOT the new ones (25/75/150/240 = 490 Dust).

**This is a secondary mismatch within doc 04 itself.** The shard cost table says 25/75/150/240 but the progression calculations still use the old 450 total. If shard costs are truly 25/75/150/240, the full path cost should be 490 Dust, not 450.

### Energy Math Validation

| Metric | Doc 00 Value | Doc 01 Value | Doc 04 Value | Calculated |
|---|---|---|---|---|
| Games to Uncommon (1.5 avg energy) | ~10 | ~10 | 10.0 | 15/1.5 = 10.0 |
| Games to Rare (cumulative) | ~30 | ~30 | 30.0 | (15+30)/1.5 = 30.0 |
| Games to Epic (cumulative) | ~63 | ~63 | 63.3 | (15+30+50)/1.5 = 63.3 |
| Games to Legendary (cumulative) | ~113 | ~113 | 113.3 | (15+30+50+75)/1.5 = 113.3 |

All match. Energy math is consistent.

---

*End of audit. 15 mismatches identified, 6 critical (would affect implementation), 9 non-critical (would cause confusion but PRD resolutions exist). The `_prd-brief.md` is the source of most errors and should be deprecated.*

# Numbers Audit — REVIEW-numbers-v2.md

**Auditor:** Claude Code (numbers-auditor agent)
**Date:** 2026-02-16
**Scope:** All docs in `docs/design/` (00–10, plus supporting files)
**Method:** Full cross-document read + targeted grep for every canonical value

---

## Audit Results

### 1. Evolution Energy Thresholds (15/30/50/75)

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md (Section 4, line 143) | 15 / 30 / 50 / 75 | PASS |
| 01-battle-mechanics.md (evolution instability tables — thresholds implied) | Not explicitly listed but formula matches | PASS |
| 02-card-data-model.md (Section 2, `evolution_ready` computed property) | Uncommon=15, Rare=30, Epic=50, Legendary=75 | PASS |
| 03-prompt-templates.md | Not referenced (irrelevant to prompts) | N/A |
| 04-progression-economy.md (Section 1.1) | 15 / 30 / 50 / 75 — explicitly locked, cites 00 | PASS |
| 05-content-pipeline.md | Not referenced (pipeline doc) | N/A |
| 06-technical-architecture.md | Not explicitly listed; evolution logic defers to 01/02 | N/A |
| 07-ui-ux-specs.md | Not listed as a standalone table; evolution flow uses these values | N/A |
| 08-audio-design.md | Not referenced (audio doc) | N/A |
| 09-monetization-details.md | Not referenced (monetization doc) | N/A |
| 10-prd.md (REQ-024, Section 1.5) | 15 / 30 / 50 / 75 | PASS |

**Result: PASS** — All documents that reference this value use 15/30/50/75 consistently.

---

### 2. Energy Earn Rates (2/win, 1/loss, ALL 20 deck cards earn simultaneously)

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md (Section 4) | Win=2, Loss=1, all 20 cards earn simultaneously | PASS |
| 02-card-data-model.md (Section 2, computed property) | Energy earned per game: 2 (win), 1 (loss) for ALL cards in the deck | PASS |
| 04-progression-economy.md (Section 1.2) | Win=2, Loss=1; all 20 cards earn simultaneously | PASS |
| 10-prd.md (Section 1.5, US-006, REQ-023) | 2/win, 1/loss, all 20 deck cards earn simultaneously | PASS |

**Result: PASS** — All documents that reference this value are consistent.

---

### 3. 7 Keywords (Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing)

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md (Section key decisions checklist) | 7 keywords listed correctly | PASS |
| 01-battle-mechanics.md (Section 4) | All 7 listed and defined | PASS |
| 02-card-data-model.md (Keyword enum) | `SHIELD | LIFESTEAL | FLYING | REACH | DEATHTOUCH | TAUNT | PIERCING` | PASS |
| 05-content-pipeline.md (keyword distribution table) | Shield, Taunt, Reach, Flying, Piercing, Deathtouch, Lifesteal — all 7 appear | PASS |
| 10-prd.md (Section 1.5 key decisions, P0-001) | "all 7 keywords" referenced; listed correctly in 1.5 | PASS |

**Result: PASS** — All 7 keywords are listed correctly and consistently across all docs.

---

### 4. 3 Factions (Ironwright Collective/Augment, Fey Courts/Bond, Demonic Kingdoms/Corruption)

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md | Ironwright Collective (Augment), Fey Courts (Bond), Demonic Kingdoms (Corruption) | PASS |
| 01-battle-mechanics.md | Same | PASS |
| 02-card-data-model.md (faction_id enum comment) | IRONWRIGHT | FEY_COURTS | DEMONIC_KINGDOMS | PASS |
| 03-prompt-templates.md | All 3 factions with correct mechanics | PASS |
| 05-content-pipeline.md | All 3 factions with correct mechanics | PASS |
| 06-technical-architecture.md | All 3 factions referenced correctly | PASS |
| 07-ui-ux-specs.md | All 3 factions referenced correctly | PASS |
| 08-audio-design.md | Ironwright, Fey Courts, Demonic Kingdoms — all 3 present | PASS |
| 09-monetization-details.md | All 3 factions referenced correctly | PASS |
| 10-prd.md | Ironwright (Augment), Fey Courts (Bond), Demonic Kingdoms (Corruption) | PASS |

**Result: PASS** — All 3 factions with their exclusive mechanics are consistent across all docs.

---

### 5. Deck Size (exactly 20 cards)

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md | 20-card deck | PASS |
| 01-battle-mechanics.md | 20 deck cards | PASS |
| 02-card-data-model.md (Deck entity) | max_cards: 20 (exactly 20) | PASS |
| 04-progression-economy.md | 20 deck cards earn simultaneously | PASS |
| 05-content-pipeline.md | 20-card deck | PASS |
| 06-technical-architecture.md | 20 cards deck validation | PASS |
| 10-prd.md (REQ-035) | "Exactly 20 cards" | PASS |

**Result: PASS** — Deck size is consistently 20 cards everywhere.

---

### 6. CM Cost Fixed Forever Through Evolution

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md | "Chaos mote cost is fixed forever and never changes through evolution." | PASS |
| 01-battle-mechanics.md | CM cost constant confirmed in PP system | PASS |
| 02-card-data-model.md | `current_mana_cost` always equals `template.mana_cost` — constraint documented | PASS |
| 03-prompt-templates.md | "Chaos mote cost never changes through evolution" | PASS |
| 04-progression-economy.md | "CM cost is fixed forever" (referenced) | PASS |
| 10-prd.md (REQ-017, Section 1.5) | "CM cost is fixed forever through evolution" | PASS |

**Result: PASS** — CM cost immutability is consistently stated across all docs.

---

### 7. Instability Formula

Canonical: `avatar modifier + sum(creature base_instability + evolution changes + modifier adjustments), clamped 1-20`

| Document | Formula Found | Status |
|---|---|---|
| 00-game-design-master.md | Avatar modifier + sum of creature instabilities; creature instability = base + evo changes + modifier adjustments; player clamped 1-20 | PASS |
| 01-battle-mechanics.md (Section 2) | `player_instability = avatar_instability_modifier + sum(creature_instability)` where `creature_instability = template.base_instability + sum(evolution_step_instability_change) + sum(modifier_instability_adjustments)`, clamped 1-20 | PASS |
| 02-card-data-model.md (PlayerState) | `instability = avatar modifier + sum of board creature instabilities. Clamped 1-20` | PASS |
| 10-prd.md (REQ-015, Section 1.5) | "avatar modifier + sum(creature base_instability + evolution changes + modifier adjustments), clamped 1-20" | PASS |

**Result: PASS** — Instability formula is identical across all docs.

---

### 8. Modifier Pools (12 pools × (8 universal + 4 per faction) = 240 modifiers)

**IMPORTANT NOTE:** Doc 10 (PRD) introduces a "Gap 4" analysis claiming the 240 figure represents "pool slots" and the actual unique definitions are 144. This is an interpretation issue rather than a number discrepancy. CLAUDE.md and docs 00, 01, 02 all state the canonical math as "12 pools × (8 universal + 4 per faction) = 240 modifiers." Doc 10's Gap 4 resolution contradicts the canonical value.

| Document | Value Found | Status |
|---|---|---|
| CLAUDE.md | 12 pools × (8 universal + 4 per faction) = 240 modifiers | PASS |
| 00-game-design-master.md | "96 universal + 48 per faction × 3 factions = 240 modifier definitions at launch" | PASS |
| 01-battle-mechanics.md | "12 pools" × (8 universal + 4 faction) = 240 | PASS |
| 02-card-data-model.md | "12 universal pools... 8 modifiers each, plus 12 faction pools per faction... 4 modifiers each. 240 total modifier definitions at launch." | PASS |
| 10-prd.md (Section 1.5, P1-004) | 240 modifiers stated | PASS |
| 10-prd.md (Gap 4, line 1055) | States "144 unique modifier definitions" and "240 figure refers to pool slots" | **FAIL** — contradicts CLAUDE.md and protected docs 00/01/02. The canonical statement is 240 modifier definitions. The PRD's alternative interpretation of 144 must not be implemented. |

**Subscription-tiered modifier selection: Free (2 options), Mid (3), Top (4)**

| Document | Value Found | Status |
|---|---|---|
| CLAUDE.md | Free (2 options), Mid (3), Top (4) | PASS |
| 00-game-design-master.md | Free: Pick 1 of 2; Mid: Pick 1 of 3; Top: Pick 1 of 4 | PASS |
| 01-battle-mechanics.md (referenced) | Matches 00 | PASS |
| 02-card-data-model.md | Free=1+1, Mid=1+2, Top=2+2 (totals 2, 3, 4 — consistent) | PASS |
| 09-monetization-details.md | Free=2, Mid=3, Top=4 | PASS |
| 10-prd.md (US-011, Section 1.5) | Free=2, Mid=3, Top=4 | PASS |

**Result: FAIL (1 critical issue) / PASS (subscription-tier options)**
- **CRITICAL:** Doc 10 (PRD) Gap 4 states "144 unique modifier definitions" and reinterprets the canonical "240 modifiers" as "pool slots." This directly contradicts CLAUDE.md and protected docs 00/01/02 which unambiguously state "240 modifier definitions at launch." The PRD's Gap 4 resolution must NOT be used to implement 144 definitions — implement 240 as stated in all source-of-truth documents.

---

### 9. Shard Costs (30/60/120/240 Dust for Uncommon/Rare/Epic/Legendary)

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md (Section 3) | 30/60/120/240 | PASS |
| 02-card-data-model.md | Referenced via 00 | PASS |
| 04-progression-economy.md (Section 2.3) | 30/60/120/240 | PASS |
| 06-technical-architecture.md (economy_config seed) | 240 for Legendary confirmed | PASS |
| 07-ui-ux-specs.md (line 3161) | "30/60/120/240 Chaos Dust for Uncommon/Rare/Epic/Legendary" | PASS |
| 09-monetization-details.md | Not explicitly listed but uses same values in cost tables | PASS |
| 10-prd.md (REQ-039, line 306) | Uncommon=30, Rare=60, Epic=120, Legendary=240 — **correctly updated in v3.0** (old v2.0 had 25/75/150/240) | PASS |
| 10-prd.md Revision Log | v2.0 had wrong values 25/75/150/240; v3.0 corrected to 30/60/120/240 | PASS |

**Result: PASS** — Shard costs are 30/60/120/240 consistently in all v3.0 documents. The previous v2.0 discrepancy was corrected.

---

### 10. Subscription Prices ($6.99/month Mid, $12.99/month Top)

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md (Section 7, line 356) | **~$5–8/month** (Mid), **~$10–15/month** (High) | **WARNING** — uses approximation range, not finalized price |
| 01-battle-mechanics.md | No subscription prices listed | N/A |
| 04-progression-economy.md (Section 8) | $6.99/month (Mid), $12.99/month (Top) | PASS |
| 05-content-pipeline.md (Section 11) | $6.99 Mid, $12.99 Top | PASS |
| 06-technical-architecture.md (product ID comments) | $6.99/mo (mid), $12.99/mo (top) | PASS |
| 07-ui-ux-specs.md (subscription UI) | $6.99/mo (Mid), $12.99/mo (Top) | PASS |
| 08-audio-design.md | No subscription prices listed | N/A |
| 09-monetization-details.md | $6.99/month (Mid), $12.99/month (Top) — **canonical source** | PASS |
| 10-prd.md (US-011, Appendix) | $6.99/mo (Mid), $12.99/mo (Top) | PASS |

**Additional note on subscription naming:** The task checklist references "Chaos Pass $6.99/month, Chaos Pass+ $12.99/month." These names do **not** appear anywhere in CLAUDE.md or any design doc. The subscription tiers are consistently named "Mid Tier" / "High Tier" / "Top Tier" (with naming inconsistency between HIGH and TOP — see item 13). The "Chaos Pass" label from the audit task checklist is not a canonical name in any document and does not require a fix.

**Result: WARNING** — Doc 00 still shows approximate ranges (~$5–8/mo, ~$10–15/mo) rather than finalized prices ($6.99, $12.99). Doc 09 explicitly notes "The final prices are $6.99/month (Mid) and $12.99/month (Top). These supersede any '~$5-8/mo' or '~$10-15/mo' ranges in earlier design documents." However, since doc 00 is a **protected file**, this is a known and accepted discrepancy — doc 09 is the canonical source for pricing.

---

### 11. Budget ($300 Total Build-to-Launch)

| Document | Budget Total Found | Status |
|---|---|---|
| CLAUDE.md | $300 maximum | PASS |
| 04-progression-economy.md | $300 total; cost breakdown defers to 06 | PASS |
| 05-content-pipeline.md (Section 13c) | ~$115.54 for launch content; $184.46 headroom within $300 | PASS |
| 06-technical-architecture.md (Section 1.4) | Total ~$233, $67 buffer remaining | PASS |
| 08-audio-design.md | No budget total listed (audio is free/open source) | N/A |
| 09-monetization-details.md | $300 total; $99 Apple Developer only required paid signup | PASS |
| 10-prd.md (Section 1.7) | $300 cap; total ~$233 with $67 buffer | PASS |

**Per-service cost consistency (06 vs 10):**

| Service | Doc 06 | Doc 10 | Match? |
|---|---|---|---|
| Apple Developer | $99 | $99 | PASS |
| Supabase | $25 | $25 | PASS |
| Railway | $15 | $15 | PASS |
| fal.ai | $80 | $80 | PASS |
| OpenAI | $2 | $2 | PASS |
| Cloudflare R2 | $0 | $0 | PASS |
| PostHog | $0 | $0 | PASS |
| Domain | $12 | $12 | PASS |
| **Total** | **~$233** | **~$233** | **PASS** |

**Result: PASS** — All budget numbers are consistent across all documents. Total $233 is within $300 cap.

---

### 12. Launch Cards (367 cards across 8 batches)

| Document | Value Found | Status |
|---|---|---|
| 00-game-design-master.md | "~270–375" total (approximate range in Section 3) | **WARNING** — uses range, not final count |
| 05-content-pipeline.md (Section 1a) | "Practical launch target: 360 faction cards + 7 universal = **367 cards.** Generation runs in batches of 50. The full launch run is **8 batches**." | PASS — canonical source |
| 06-technical-architecture.md | "~367 base cards" in budget table | PASS |
| 10-prd.md (P1-004) | "367 total cards across 8 batches" | PASS |
| 10-prd.md (Section 1.7) | "367 cards" in budget | PASS |

**Per-faction card breakdown consistency:**

| Document | Creatures | Spells | Faction Stabilizers | Universal | Total |
|---|---|---|---|---|---|
| 05-content-pipeline.md | 100/faction = 300 | 17/faction = 51 | 7/faction = 21 | 7 | 379 (theoretical) / **367 (practical)** |
| 10-prd.md (P1-004) | 100 creatures | 17 spells | 7 stabilizers | 7 universal | "367 total" |
| 00-game-design-master.md | 60-80/faction creatures | 20-30/faction spells | 10-15/faction stab. | — | 270-375 |

**Result: WARNING** — Doc 00 uses the old approximate range (270–375) rather than the finalized target of 367. This is a known discrepancy (doc 00 is protected and was written before content pipeline finalization). Doc 05 is the authoritative source for launch card counts. The 367 figure is consistent across docs 05, 06, and 10.

---

### 13. Max Copies (2 per card in deck, max 2 Legendaries per deck, max 1 copy each Legendary)

| Document | Value Found | Status |
|---|---|---|
| CLAUDE.md | "Max copies: 2 per card in deck, max 2 Legendaries per deck" | PASS |
| 00-game-design-master.md (Section on deck rules) | Max 2 copies of any template; more than 2 Legendaries → prevented; 2 copies of a Legendary → prevented | PASS |
| 01-battle-mechanics.md (Section 12, deck construction) | Max 2 Legendary cards, max 1 copy of each | PASS |
| 02-card-data-model.md (Deck entity) | Max 2 Legendaries, max 1 copy each | PASS |
| 10-prd.md (REQ-035) | "Max 2 copies of any template. Max 2 Legendaries, max 1 copy of each Legendary." | PASS |
| 10-prd.md (REQ-164) | Tests for "3 Legendaries, 2 copies of one Legendary" both rejected | PASS |

**Result: PASS** — Max copies rules are consistent across all docs.

---

### 14. Tech Stack Compliance Check

Checking for React Native, Expo, Unity, Google Play, Android, Play Store, RevenueCat in **main body** (excluding revision logs).

| Doc | Tech Compliance Issues in Main Body | Status |
|---|---|---|
| 03-prompt-templates.md | All references in revision log only | PASS |
| 04-progression-economy.md | All references in revision log only | PASS |
| 05-content-pipeline.md | "No Android, no React Native, no Expo" (correct explicit denial); revision log changes noted | PASS |
| 06-technical-architecture.md | "No RevenueCat, no Stripe, no third-party payment SDK" (correct explicit denial); revision log references only | PASS |
| 07-ui-ux-specs.md | "No RevenueCat, no third-party wrappers" in tech table (correct); revision log changes noted; Google Play appears only in revision log | PASS |
| 08-audio-design.md | Revision log v2.0 mentions React Native/expo-av as prior state; v3.0 correctly replaced. Main body is iOS-native throughout | PASS |
| 09-monetization-details.md | Main body: "No Android. No Google Play." (correct explicit denial); "No RevenueCat" (correct); revision log references old RevenueCat sections | PASS |
| 10-prd.md | Main body: "No Android. No React Native. No Unity. No Expo." (correct); "No RevenueCat. No Stripe." (correct); revision log documents migration from old stack | PASS |

**Result: PASS** — No prohibited tech stack references in main body of any downstream doc (03–10). All occurrences are in revision logs documenting the migration from the old stack.

---

### 15. Additional Discrepancies Found

#### 15a. CRITICAL — Mid Tier Deck Slots: 5 vs 6

| Document | Mid Tier Deck Slots | Source |
|---|---|---|
| **00-game-design-master.md** (PROTECTED, line 1093) | **6** | Protected |
| **02-card-data-model.md** (PROTECTED, line 623 comment) | **6** (`3 (free), 6 (mid), 10 (high)`) | Protected |
| 04-progression-economy.md (Section 8, Mid tier benefits) | **6** | Downstream |
| 09-monetization-details.md (feature matrix, line 529) | **6** | Downstream |
| 09-monetization-details.md (Mid tier description, line 561) | **6** | Downstream |
| 09-monetization-details.md (conversion nudge table, line 787) | **3 → 6** transition described | Downstream |
| 06-technical-architecture.md (code, lines 721/751) | **5** | Downstream |
| 06-technical-architecture.md (DB schema, max_deck_slots default comment) | **5** (MID) | Downstream |
| 10-prd.md (US-014, line 151) | **5** | Downstream |
| 10-prd.md (REQ-036, line 296) | **5** | Downstream |
| 10-prd.md (Gap 2 resolution, line 1043) | **"Implement Mid = 5 deck slots"** | Downstream |
| 10-prd.md (Revision Log v3.0, line 1084) | Changed 6→5 per doc 06 | Downstream |
| _prd-input-summary.md | **5** | Input doc |

**Canonical value per protected docs 00 and 02: 6 deck slots for Mid tier.**

The PRD v3.0 changed this to 5 by deferring to the technical architecture doc, but this violates the protected file rule: downstream docs that contradict protected files are wrong and must be fixed. Docs 06, 10, and _prd-input-summary are downstream and must be corrected to **6** to match protected docs 00 and 02.

---

#### 15b. WARNING — Subscription Tier Naming: HIGH vs TOP

The canonical naming defined in protected doc 02 uses `SubscriptionTier: FREE | MID | HIGH`. However, multiple downstream docs inconsistently use "Top" or "top":

| Document | Naming Used | Status |
|---|---|---|
| **02-card-data-model.md** (PROTECTED, SubscriptionTier enum, line 691) | `FREE | MID | HIGH` | CANONICAL |
| 00-game-design-master.md (Section 7 table) | "Mid Tier" / "High Tier" | Matches 02 |
| 06-technical-architecture.md (code + DB) | `MID` / `HIGH` — enum values `FREE | MID | HIGH` | PASS |
| 09-monetization-details.md (Swift code) | `case top = "top"` | **INCONSISTENT** — uses `top` not `high` |
| 10-prd.md (US-014, REQ-036) | "Top" tier (verbal description); `top` in code | **INCONSISTENT** — uses `top` not `high` |
| 04-progression-economy.md | "Top-Tier Subscriber" (verbal); HIGH in config | Mixed usage |

**Canonical enum value per protected doc 02: `HIGH`**. Swift code in doc 09 uses `case top = "top"` which conflicts with the protected data model. Database schema in doc 06 uses `HIGH` which matches the protected doc. Verbal references throughout docs 09 and 10 saying "Top tier" are acceptable as human-readable labels, but raw code/enum values should use `HIGH` to match the protected schema.

---

#### 15c. WARNING — Subscription Prices in Doc 00

Doc 00 (protected) uses approximate price ranges (~$5–8/mo, ~$10–15/mo) rather than the finalized prices ($6.99/$12.99). Doc 09 explicitly addresses this: "The final prices are $6.99/month (Mid) and $12.99/month (Top). These supersede any '~$5-8/mo' or '~$10-15/mo' ranges in earlier design documents." Since doc 00 is protected (read-only), this discrepancy is locked in. **Implementation must use doc 09's $6.99/$12.99 values.**

---

#### 15d. CRITICAL — Modifier Count: 240 vs 144 (PRD Gap 4)

As documented under check #8 above, doc 10 (PRD) Gap 4 reinterprets the canonical 240 modifier count as "144 unique modifier definitions." This contradicts CLAUDE.md and protected docs 00/01/02, all of which state **240 modifier definitions at launch**. The Gap 4 resolution in doc 10 must NOT be used as implementation guidance on this point. The canonical count is 240.

---

#### 15e. INFO — Doc 00 Launch Card Count Uses Old Range

Doc 00 (Section 3) states "~270–375" total cards, while the finalized target is 367. Since doc 00 is protected, this cannot be changed. Doc 05 is the canonical source for launch card count (367).

---

#### 15f. INFO — Doc 00 Subscription Table Missing Monthly Card Bonus Values

Doc 00 (Section 7) subscription table lists "+3 Commons/mo" for Mid and "+5 Commons/mo" for High. These values do not appear in docs 04, 09, or 10, which focus on quest dust bonuses and shard benefits. This is not a contradiction but a feature detail that needs confirmation during implementation.

---

## Severity Summary

| Severity | Count | Items |
|---|---|---|
| **CRITICAL** | 2 | 1. Mid Tier deck slots: protected docs (00, 02) say 6; downstream docs (06, 10) say 5. Downstream docs are wrong. 2. PRD Gap 4 reinterprets 240 modifiers as 144 — contradicts CLAUDE.md and protected docs 00/01/02. |
| **WARNING** | 3 | 1. Subscription tier naming inconsistency: `HIGH` (protected doc 02 enum) vs `top`/`Top` (docs 09, 10 Swift code). 2. Doc 00 subscription prices use approximate ranges (~$5-8, ~$10-15) instead of final values ($6.99, $12.99) — locked in protected file, doc 09 is canonical. 3. Doc 00 launch card count uses old range (270–375) vs finalized 367 — locked in protected file, doc 05 is canonical. |
| **INFO** | 1 | Doc 00 subscription table references "+3/+5 Commons/mo" monthly card bonus; not confirmed in downstream docs (04, 09, 10). |

---

## Corrective Actions Required

### CRITICAL — Must Fix Before Build

1. **Deck Slots (Mid Tier):** Update docs 06 and 10 to change Mid tier deck slots from 5 to 6, matching protected docs 00 and 02.
   - **Doc 06:** `max_deck_slots: tier === "HIGH" ? 10 : tier === "MID" ? 5 : 3` → change MID to 6
   - **Doc 06:** DB schema comment `-- 3 (free), 5 (mid), 10 (high)` → update to 6
   - **Doc 10:** US-014 → change "Mid: 100 cards/faction, **5** deck slots" to **6**
   - **Doc 10:** REQ-036 → change "Mid: **5** slots" to **6**
   - **Doc 10:** Gap 2 resolution → change "Implement Mid = **5** deck slots" to 6, reference protected docs 00/02

2. **Modifier Count (240 vs 144):** Remove or replace PRD Gap 4 resolution text in doc 10 that instructs "Implement 144 unique modifier definitions." Replace with: "Implement **240 modifier definitions** at launch as specified in CLAUDE.md, `00-game-design-master.md`, `01-battle-mechanics.md`, and `02-card-data-model.md`. The 12 pools × (8 universal + 4 per faction) = 240 count is the canonical count of distinct modifier entries in the database, not an abstraction for pool slots."

### WARNING — Should Fix for Consistency

3. **Subscription Tier Naming (HIGH vs top):** The Swift enum in doc 09 uses `case top = "top"` but the protected data model (doc 02) and database schema (doc 06) use `HIGH`. Options:
   - Preferred: Update Swift code in doc 09 to use `case high = "high"` matching the DB schema
   - Alternatively: If "top" is intentional for the Swift client while the DB uses "HIGH", document this mapping explicitly

4. **Doc 00 Subscription Prices:** Protected file — cannot edit. Instead, ensure every implementation-facing doc (06, 07, 09, 10) prominently states the canonical prices $6.99 and $12.99. Doc 09 already contains the required override statement.

---

## Passing Checks Summary

All 13 canonical values were checked. Results:

| # | Check | Result |
|---|---|---|
| 1 | Evolution energy thresholds 15/30/50/75 | PASS |
| 2 | Energy earn rates 2/win, 1/loss, 20 cards simultaneously | PASS |
| 3 | 7 keywords (Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing) | PASS |
| 4 | 3 factions with correct exclusive mechanics | PASS |
| 5 | Deck size 20 cards | PASS |
| 6 | CM cost fixed forever | PASS |
| 7 | Instability formula | PASS |
| 8 | Modifier pools 240 total (implementation conflict in PRD Gap 4) | **CRITICAL** |
| 9 | Shard costs 30/60/120/240 | PASS |
| 10 | Subscription prices $6.99/$12.99 | WARNING (doc 00 uses ranges; canonical in doc 09) |
| 11 | Budget $300 total | PASS |
| 12 | Launch cards 367 across 8 batches | WARNING (doc 00 uses old range) |
| 13 | Max copies 2/card, 2 Legendaries max 1 copy each | PASS |
| 14 | Tech stack compliance | PASS |
| 15 | Additional: Mid deck slots 6 (not 5) | **CRITICAL** |
| 16 | Additional: HIGH vs top naming | WARNING |

---

*Audit complete. 2 CRITICAL issues, 3 WARNINGS, 1 INFO item found.*

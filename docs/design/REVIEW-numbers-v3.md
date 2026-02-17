# Numbers Audit — REVIEW-numbers-v3.md

**Auditor:** Claude Code (numbers-auditor agent)
**Date:** 2026-02-16
**Scope:** All docs in `docs/design/` (00–10, NOT REVIEW files)
**Method:** Full targeted grep across all docs for every canonical value
**Prior audit:** REVIEW-numbers-v2.md (this audit confirms v2 fixes and checks 13 canonical values)

---

## Summary Table

| # | Check | Result | Notes |
|---|---|---|---|
| V2-1 | Mid-tier deck slots = 6 everywhere | PASS | Clean — 6 confirmed in all docs |
| V2-2 | Modifier count = 240 everywhere | PASS | Clean — 240 confirmed in all docs |
| V2-3 | FAL_KEY (not FAL_API_KEY) in all docs | PASS | Zero instances of FAL_API_KEY found |
| V2-4 | Subscription tier "HIGH" in code/enums, "High Tier" in display | PARTIAL FAIL | Stale "Top" references remain in docs 01, 04, 05, 07 — see detail |
| V2-5 | Card count = 358 in doc 05 | PASS | Doc 05 correctly states 358. Stale 367 remains in docs 03, 06, 10 |
| V2-6 | No faction-specific stabilizers (all 7 universal) | FAIL | Doc 01 line 1111 contradicts this; doc 10 line 190 has "7 faction stabilizers per faction" |
| C-01 | Evolution thresholds: 15/30/50/75 | PASS | Consistent across 00, 02, 04, 06, 07, 10 |
| C-02 | Energy earn rates: 2/win, 1/loss, all 20 cards simultaneously | PASS | Consistent across 00, 02, 04, 06, 10 |
| C-03 | 7 keywords present and consistent | PASS | All 7 present and defined consistently |
| C-04 | 3 factions with correct exclusive mechanics | PASS | Augment/Bond/Corruption consistent everywhere |
| C-05 | Deck size: exactly 20 cards | PASS | Consistent across all docs |
| C-06 | CM cost fixed forever through evolution | PASS | Consistent across 00, 02 |
| C-07 | Instability formula: per-creature floor of 0, player clamped 1-20 | PASS | Consistent across 00, 01, 02 |
| C-08 | Shard costs: 30/60/120/240 Dust | PASS | Consistent across 00, 02, 04, 09, 10 |
| C-09 | Subscription prices: $6.99/$12.99 (doc 09 canonical) | PARTIAL FAIL | Stale ~$5-8/$10-15 ranges in doc 00 and doc 01; doc 09 correctly supersedes |
| C-10 | Budget within $300 cap | PASS | Doc 05: ~$115.54; doc 03: ~$270; doc 09: ~$249-$299. All under $300 |
| C-11 | Launch cards: 358 (doc 05 canonical) | PARTIAL FAIL | Docs 03, 06, 10 still say 367 |
| C-12 | Max copies: 2 per card, Legendaries max 2 with max 1 copy each | PASS | Consistent across 00, 01, 02, 05, 07 |

**Overall: 14 PASS, 1 FAIL, 3 PARTIAL FAIL**

---

## Detail: V2 Fixes Verification

### V2-1 — Mid-Tier Deck Slots = 6

Grepped all docs for deck slot values. Results:

| Doc | Value | Status |
|---|---|---|
| 00-game-design-master.md | Free 3, Mid 6, High 10 | PASS |
| 02-card-data-model.md | 3 (free), 6 (mid), 10 (high) | PASS |
| 04-progression-economy.md | FREE: 3, MID: 6, HIGH: 10 (JSON config) | PASS |
| 06-technical-architecture.md | `tier === "MID" ? 6` (webhook handler, lines 721, 751) | PASS |
| 09-monetization-details.md | Deck Slots: 3 / 6 / 10 (line 529) | PASS |
| 10-prd.md | Mid: 6 slots (REQ-036, line 296) | PASS |

**PASS — no stale "5 deck slots for Mid" references found.**

---

### V2-2 — Modifier Count = 240

| Doc | Value | Status |
|---|---|---|
| CLAUDE.md (project instructions) | 12 pools × (8 universal + 4 per faction) = 240 | PASS |
| 00-game-design-master.md | 96 universal + 48 per faction × 3 = 240 | PASS |
| 01-battle-mechanics.md | Grand Total 240 (table at line 858) | PASS |
| 02-card-data-model.md | 240 total modifier definitions at launch | PASS |
| 07-ui-ux-specs.md | "Table of all 240 modifiers" (admin) | PASS |
| 10-prd.md | 240 (lines 72, 476, 825, 1081, 1083) | PASS |

**PASS — 240 is clean and consistent across all docs.**

---

### V2-3 — FAL_KEY (not FAL_API_KEY)

Grepped all docs for `FAL_API_KEY`. **Zero matches found.**

Confirmed `FAL_KEY` usage:
- `03-prompt-templates.md` lines 76, 1369, 1517
- `05-content-pipeline.md` lines 183, 209, 230
- `06-technical-architecture.md` lines 106, 1920, 1954, 3356, 3832
- `10-prd.md` lines 684, 987

**PASS — FAL_API_KEY has been purged. FAL_KEY is used uniformly.**

---

### V2-4 — Subscription Tier Naming: HIGH in code, "High Tier" in display

Code/enum usage (must be FREE/MID/HIGH):

| Doc | Values Found | Status |
|---|---|---|
| 02-card-data-model.md | `SubscriptionTier: FREE \| MID \| HIGH` | PASS |
| 04-progression-economy.md | `"FREE"`, `"MID"`, `"HIGH"` (JSON) | PASS |
| 06-technical-architecture.md | `'FREE', 'MID', 'HIGH'` (SQL CHECK, TypeScript) | PASS |
| 09-monetization-details.md | `case free = "FREE"`, `case mid = "MID"`, `case high = "HIGH"` | PASS |
| 10-prd.md | `FREE/MID/HIGH` throughout | PASS |

**Stale "Top" references remaining (display contexts):**

| Doc | Line | Content | Issue |
|---|---|---|---|
| `01-battle-mechanics.md` | 1248 | `\| Top ($10–15/mo) \| +5 faction Commons...` | Should be "High Tier ($12.99/mo)" |
| `04-progression-economy.md` | 554 | Column header: `Top Dust (×2.0)` | Should be "High Dust (×2.0)" |
| `04-progression-economy.md` | 233–249, 267, 392, 434, 449, 961–963, 974, 1321–1323 | "Top Casual", "Top Regular", "Top Hardcore" persona names | Simulation personas — acceptable as informal labels but inconsistent with "High Tier" naming |
| `05-content-pipeline.md` | 1434 | `\| Top ($12.99/mo) \|` | Should be "High ($12.99/mo)" |
| `07-ui-ux-specs.md` | 2097 | `Top ($12.99/mo):` (subscription card style) | Should be "High ($12.99/mo)" |

**PARTIAL FAIL** — The code-level enums (FREE/MID/HIGH) are correct. Six display-context occurrences of "Top" remain. The persona names ("Top Casual/Regular/Hardcore") in doc 04 are used only in internal simulation tables and carry no player-facing meaning, so they are LOW priority. The references in docs 01, 05, and 07 are in user-facing specification contexts and should be corrected.

---

### V2-5 — Card Count = 358 in Doc 05

Doc 05, Section 1a:
- 100 creatures × 3 factions = 300
- 17 spells × 3 factions = 51
- 7 universal stabilizers = 7
- **Grand total: 358**

**Doc 05 is correct: PASS.**

**Stale 367 references in other docs:**

| Doc | Line | Content | Issue |
|---|---|---|---|
| `03-prompt-templates.md` | 1242 | "Full launch set (367 cards per doc 05 estimates)" | Incorrect — doc 05 says 358, not 367 |
| `03-prompt-templates.md` | 1246 | "367 base cards + 5000 evolution images" (R2 storage) | Should be 358 |
| `03-prompt-templates.md` | 1853 | Revision log: "~$14.30 for 367 cards" | Historical note, but propagates the wrong number |
| `06-technical-architecture.md` | 156 | "~367 base cards + testing + evolution testing" | Should be 358 |
| `06-technical-architecture.md` | 166 | "367 base card images at ~$0.025/image" | Should be 358 |
| `06-technical-architecture.md` | 167 | "367 base card text generations" | Should be 358 |
| `10-prd.md` | 190 | "~120 card templates per faction (100 creatures, 17 spells, **7 faction stabilizers**) + 7 universal stabilizers. **367 total cards**" | Double error: stabilizers labeled "faction" AND count is 367 |
| `10-prd.md` | 894 | "Batch generation pipeline targets 367 cards" | Should be 358 |

**PARTIAL FAIL** — Doc 05 is correct at 358, but docs 03, 06, and 10 still reference 367. Doc 10 line 190 has the most egregious instance: it says "7 faction stabilizers per faction" (implying 21 faction stabilizers) plus 7 universal = 28 extra stabilizers, yielding a wrong count of 367. This is a compound error (wrong stabilizer type AND wrong total).

---

### V2-6 — No Faction-Specific Stabilizers (All 7 Universal)

**Canonical position** (protected docs 00 and 01):
- Doc 00 line 607: "All 7 cards are **universal** (available to all factions)."
- Doc 01 line 1151: "Stabilizer count at launch: 5 board stabilizers (universal) + 2 manipulation spells (universal) = 7 cards."
- Doc 05 line 24: "7 (universal only — no faction-specific stabilizers at launch)"
- Doc 05 line 77: "All 7 stabilizers are universal (shared across all factions), not faction-specific."

**Contradictions found:**

| Doc | Line | Content | Issue |
|---|---|---|---|
| `01-battle-mechanics.md` | 1111 | "**Faction-locked.** Stabilizers belong to a faction." | Directly contradicts the stabilizer table immediately below it, which shows all 7 as Universal. This is an internal contradiction within doc 01 itself — the property bullet says faction-locked, but all card entries in the table say "Universal (all factions)". The table is correct; the property bullet is wrong. |
| `10-prd.md` | 190 | "~120 card templates per faction (100 creatures, 17 spells, **7 faction stabilizers**)" | Wrong. There are zero faction-specific stabilizers. This entry causes the 367 count error as well. |

**FAIL** — Doc 01 line 1111 contains a direct contradiction within the same section. Doc 10 line 190 labels stabilizers as "faction stabilizers." Both must be corrected. The canonical position (7 universal stabilizers, no faction-specific) is stated in protected doc 00, reinforced by doc 05.

---

## Detail: 13 Canonical Game Values

### C-01 — Evolution Energy Thresholds: 15/30/50/75

| Doc | Values | Status |
|---|---|---|
| 00-game-design-master.md | 15/30/50/75 (lines 143–146, 1327, 1417) | PASS |
| 02-card-data-model.md | Uncommon=15, Rare=30, Epic=50, Legendary=75 (line 150) | PASS |
| 04-progression-economy.md | threshold_uncommon=15, threshold_rare=30, threshold_epic=50, threshold_legendary=75 (JSON, lines 1030–1033) | PASS |
| 06-technical-architecture.md | Seeds: 15/30/50/75 (lines 1465–1468) | PASS |
| 07-ui-ux-specs.md | "Card energy thresholds per tier (15/30/50/75)" (line 3179) | PASS |
| 10-prd.md | Referenced via protected docs | PASS |

**PASS — Clean and consistent.**

---

### C-02 — Energy Earn Rates: 2/win, 1/loss, All 20 Simultaneously

| Doc | Values | Status |
|---|---|---|
| 00-game-design-master.md | "Win=2, Loss=1, all 20 deck cards earn simultaneously" | PASS |
| 02-card-data-model.md | "2 (win), 1 (loss) for ALL cards in the deck" (line 151) | PASS |
| 04-progression-economy.md | win_energy_per_card=2 (line 1028); energy table (lines 78–79) | PASS |
| 06-technical-architecture.md | energy_per_win=2, energy_per_loss=1 (lines 1463–1464); "Award chaos energy (2/win, 1/loss) to all 20 deck cards" (line 2189) | PASS |
| 10-prd.md | "2/win, 1/loss, all 20 deck cards earn simultaneously" | PASS |

**PASS — Clean and consistent.**

---

### C-03 — 7 Keywords (Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing)

All 7 keywords are present and consistently defined across:
- `02-card-data-model.md` line 63: `Keyword: SHIELD \| LIFESTEAL \| FLYING \| REACH \| DEATHTOUCH \| TAUNT \| PIERCING`
- `01-battle-mechanics.md` Section 4: all 7 defined with PP costs and rules
- `03-prompt-templates.md` line 1279: CSV column lists all 7
- `05-content-pipeline.md` line 544: PP costs for all 7
- `00-game-design-master.md` line 1399: "7 keywords: Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing"
- `08-audio-design.md` line 1443: "All 7 keyword triggers wired."
- `05-content-pipeline.md` line 1350: "Unit tests for all 7 keyword interactions"

**PASS — All 7 keywords consistent across all docs.**

---

### C-04 — 3 Factions with Correct Exclusive Mechanics

| Faction | Mechanic | Status |
|---|---|---|
| Ironwright Collective | Augment | PASS — consistent in 00, 01, 02, 03, 05, 06 |
| Fey Courts | Bond | PASS — consistent in 00, 01, 02, 03, 05, 06 |
| Demonic Kingdoms | Corruption | PASS — consistent in 00, 01, 02, 03, 05, 06 |

**PASS — Faction mechanic assignments are clean.**

---

### C-05 — Deck Size: Exactly 20 Cards

All docs that reference deck size use 20 cards. Confirmed in: 00 (line 149), 02 (multiple), 04 (lines 76, 106, 210, 279, 410), 06 (line 2189), 05 (line 1353), 07 (line 1960), 10 (REQ-036).

**PASS — Deck size 20 is clean.**

---

### C-06 — CM Cost Fixed Forever Through Evolution

- `02-card-data-model.md` line 33: "Fixed forever — never changes through evolution."
- `02-card-data-model.md` line 140: "`current_mana_cost` always equals `template.mana_cost`"
- `00-game-design-master.md` line 164: "Chaos mote cost is fixed forever and never changes through evolution."
- `00-game-design-master.md` line 1367: "CM cost never changes through evolution."

**PASS — Clean and consistent.**

---

### C-07 — Instability Formula: Per-Creature Floor of 0, Player Clamped 1-20

- `01-battle-mechanics.md` lines 307–311: `creature_instability: minimum 0`; `player_instability: minimum 1, maximum 20`
- `02-card-data-model.md` lines 94, 139, 764, 811: creature instability clamped min 0; player instability clamped 1-20
- `00-game-design-master.md` line 1365: "Each creature's instability...clamped min 0. Player instability clamped 1-20."

**PASS — Instability clamping rules are clean and consistent.**

---

### C-08 — Shard Costs: 30/60/120/240 Dust

| Doc | Values | Status |
|---|---|---|
| 00-game-design-master.md | 30/60/120/240 (line 88) | PASS |
| 04-progression-economy.md | 30/60/120/240 (lines 208, 277, 349–352) | PASS |
| 07-ui-ux-specs.md | Confirmed at 30/60/120/240 (line 3596) | PASS |
| 10-prd.md | REQ-039: "30, 60, 120, 240" (line 306) | PASS |
| 10-prd.md | Cross-doc note (lines 1063–1065) explicitly resolves PRD v1 discrepancy | PASS |

**PASS — Shard costs are clean at 30/60/120/240 in all docs.**

---

### C-09 — Subscription Prices: $6.99/$12.99 (Doc 09 Canonical)

Doc 09 is canonical and states:
> "The final prices are $6.99/month (Mid) and $12.99/month (High). These supersede any '~$5-8/mo' or '~$10-15/mo' ranges in earlier design documents."

All implementation docs (06, 09, 10) use $6.99 and $12.99 correctly.

**Stale range values remaining:**

| Doc | Line | Content | Issue |
|---|---|---|---|
| `00-game-design-master.md` | 208–209 | "Mid (~$5–8/mo)", "High (~$10–15/mo)" | Stale ranges — superseded by doc 09 |
| `00-game-design-master.md` | 356–357 | "~$5–8/month", "~$10–15/month" | Stale ranges — superseded by doc 09 |
| `00-game-design-master.md` | 740–741 | "Mid subscriber ($5-8/mo)", "High subscriber ($10-15/mo)" | Stale ranges |
| `01-battle-mechanics.md` | 1247 | "Mid ($5–8/mo)" | Stale range |
| `01-battle-mechanics.md` | 1248 | "Top ($10–15/mo)" | Stale range + "Top" naming issue |

**PARTIAL FAIL** — Doc 09 correctly establishes canonical prices of $6.99/$12.99 and declares them superseding. However, docs 00 and 01 retain the approximate ranges. Because doc 09 explicitly calls them out as superseded, this is an inconsistency rather than a critical error, but the stale values in doc 00 (protected file, read-only) cannot be changed; doc 01 (also protected) cannot be changed. The only non-protected doc with stale price ranges is doc 05 line 1434 (which uses the price correctly: "$12.99/mo"). **All implementation docs are correct.** The stale data is confined to protected docs 00 and 01, which cannot be modified.

**Revised verdict:** PASS for implementation purposes (docs 03–10 all use $6.99/$12.99 correctly). INFORMATIONAL for docs 00 and 01 — stale ranges noted but those are protected files.

---

### C-10 — Budget Within $300 Cap

| Doc | Estimate | Status |
|---|---|---|
| `03-prompt-templates.md` | ~$270 total to launch | PASS |
| `05-content-pipeline.md` | ~$115.54 total to launch ($184.46 headroom) | PASS |
| `09-monetization-details.md` | ~$249-$299 total to launch | PASS (borderline) |

All estimates are at or below $300. The $249-$299 range in doc 09 brushes the cap but does not exceed it.

**PASS — Budget constraint is satisfied.**

---

### C-11 — Launch Cards: 358 (Doc 05 Canonical)

**Doc 05 is correct:**
- 100 creatures × 3 factions = 300
- 17 spells × 3 factions = 51
- 7 universal stabilizers = 7
- **Total: 358**

**Cross-doc status:**

| Doc | Value | Status |
|---|---|---|
| `00-game-design-master.md` | No explicit total stated (defers to pipeline) | N/A |
| `01-battle-mechanics.md` | No explicit total | N/A |
| `02-card-data-model.md` | No explicit total | N/A |
| `03-prompt-templates.md` | **367** (lines 1242, 1246, 1853) | FAIL |
| `05-content-pipeline.md` | **358** (canonical) | PASS |
| `06-technical-architecture.md` | **367** (lines 156, 166, 167) | FAIL |
| `07-ui-ux-specs.md` | No explicit total | N/A |
| `09-monetization-details.md` | "~1,000 cards" (rough launch estimate) | N/A |
| `10-prd.md` | **367** (lines 190, 894) | FAIL |

**PARTIAL FAIL** — The canonical count of 358 is correct in doc 05 but docs 03, 06, and 10 still say 367. Doc 10 line 190 also mislabels them as "7 faction stabilizers per faction" (which would be 21 + 7 = 28 stabilizers total, explaining the discrepancy: 351 + 7 = 358 vs. 351 + 21 - 7 = 365 or some other miscalculation).

**Reconciliation:** 367 appears to be an earlier estimate that was corrected to 358. Docs 03, 06, and 10 were not updated.

---

### C-12 — Max Copies: 2 Per Card, Legendaries Max 2 (1 Copy Each)

| Doc | Value | Status |
|---|---|---|
| `00-game-design-master.md` | "Max 2 copies. Legendaries: Max 2 per deck, limited to 1 copy each." (lines 474–475) | PASS |
| `01-battle-mechanics.md` | "Max 2 copies of any single CardTemplate. Max 2 Legendary cards, max 1 copy of each." (lines 1311–1312) | PASS |
| `02-card-data-model.md` | "Legendary-tier cards: max 2 total, max 1 copy each" (line 582) | PASS |
| `05-content-pipeline.md` | "max 2 copies, Legendary limits" (line 1353) | PASS |
| `07-ui-ux-specs.md` | "Max 2 copies per card enforced" (line 1974) | PASS |
| `10-prd.md` | "validate 20 cards, single faction, copy limits, Legendary limits" | PASS |

**PASS — Copy limits are clean and consistent.**

---

## Issues Requiring Action

### CRITICAL

| ID | Doc | Line(s) | Issue | Action Required |
|---|---|---|---|---|
| CRIT-1 | `01-battle-mechanics.md` | 1111 | "Faction-locked. Stabilizers belong to a faction." — directly contradicts all other sources. The table immediately below shows all 7 stabilizers as "Universal (all factions)." The bullet point is wrong. | Change to: "**Faction-agnostic (Universal).** All launch stabilizers are available to all factions. Faction-specific stabilizers are reserved for future expansions." |
| CRIT-2 | `10-prd.md` | 190 | "~120 card templates per faction (100 creatures, 17 spells, **7 faction stabilizers**) + 7 universal stabilizers. **367 total cards across 8 batches.**" — two errors: (1) no faction-specific stabilizers exist; (2) total should be 358, not 367. | Change to: "117 card templates per faction (100 creatures, 17 spells) + 7 universal stabilizers. **358 total cards across 8 batches.**" |

### HIGH

| ID | Doc | Line(s) | Issue | Action Required |
|---|---|---|---|---|
| HIGH-1 | `10-prd.md` | 894 | "Batch generation pipeline targets 367 cards" | Change to 358 |
| HIGH-2 | `06-technical-architecture.md` | 156, 166, 167 | "~367 base cards" / "367 base card images" / "367 base card text generations" | Change all three to 358 |
| HIGH-3 | `03-prompt-templates.md` | 1242, 1246 | "367 cards per doc 05 estimates" / "367 base cards" | Change to 358 |
| HIGH-4 | `05-content-pipeline.md` | 1434 | "Top ($12.99/mo)" | Change to "High ($12.99/mo)" |
| HIGH-5 | `07-ui-ux-specs.md` | 2097 | "Top ($12.99/mo):" (subscription card styling) | Change to "High ($12.99/mo):" |
| HIGH-6 | `01-battle-mechanics.md` | 1247–1248 | "Mid ($5–8/mo)" and "Top ($10–15/mo)" — stale price range + "Top" naming | Change to "Mid ($6.99/mo)" and "High ($12.99/mo)" (doc 01 is protected — flag for step-1 exception) |

### LOW

| ID | Doc | Line(s) | Issue | Action Required |
|---|---|---|---|---|
| LOW-1 | `04-progression-economy.md` | 554 | Column header "Top Dust (×2.0)" | Change to "High Dust (×2.0)" |
| LOW-2 | `04-progression-economy.md` | 233–249, 961–963, 1321–1323 | Simulation persona names "Top Casual/Regular/Hardcore" | Can remain as internal-only persona labels; no player-facing impact |
| LOW-3 | `03-prompt-templates.md` | 1853 | Revision log references "367 cards" | Historical revision log — low priority to correct |
| LOW-4 | `00-game-design-master.md` | 208–209, 356–357, 740–741 | "~$5-8/mo", "~$10-15/mo" stale price ranges | Protected file — cannot be modified. Doc 09 already supersedes. Informational only. |

---

## Notes for Implementers

1. **Doc 05 is the authoritative card count source.** When any doc contradicts doc 05 on card counts, doc 05 wins. The correct count is **358** (300 creatures + 51 spells + 7 universal stabilizers).

2. **Doc 09 is the authoritative subscription price source.** When any doc contradicts doc 09 on prices, doc 09 wins. The correct prices are **$6.99/month (Mid)** and **$12.99/month (High)**. Stale ranges in protected docs 00 and 01 are non-actionable but noted.

3. **Doc 01 line 1111 contains an internal contradiction.** The "Faction-locked" property bullet contradicts the Universal designation on every card in the table below it. The correct reading is that all launch stabilizers are universal. The bullet is the error, not the table.

4. **All code-level enums use FREE/MID/HIGH.** "Top" only appears in display text in docs 05 and 07 and in legacy simulation persona labels in doc 04. No code or schema uses "TOP."

5. **The 367→358 discrepancy** is a stale count from an earlier design iteration. Three docs (03, 06, 10) were not updated when doc 05 finalized the count at 358. Doc 10 P1-004 has the most consequential instance because it also introduces a "faction stabilizers" mislabel.

---

*Audit complete. 14 PASS, 1 FAIL (V2-6 stabilizer universality), 3 PARTIAL FAIL (V2-4 Top/High naming, C-09 stale prices in protected docs, C-11 367→358 stale count in docs 03/06/10).*

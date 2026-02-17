# REVIEW-systems-v3.md — Cross-Document Consistency Audit (v3 Fixes Verification)

**Auditor:** Systems Consistency Auditor
**Date:** 2026-02-16
**Scope:** Docs 00–10 (design docs only, not REVIEW files)
**Purpose:** Verify that all 13 v2 audit fixes are clean, and surface any new contradictions introduced by those fixes.

---

## Summary Table

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Void Lens is a stabilizer in doc 01 Section 12; Probability Anchor removed | PASS with NEW ISSUE | Fix applied correctly. New issue: Section 12 summary table now has only 5 of 7 stabilizer/manipulation cards — Warding Pillar and Entropy Engine are missing. |
| 2 | FAL_KEY consistent across docs 03, 05, 06, 10 | PASS | All four docs use `FAL_KEY` uniformly. |
| 3 | Admin Dashboard technology = "React + Vite (TypeScript)" in docs 03, 06, 07, 10 | PARTIAL FAIL | Docs 06, 07, and 10 Section 4.12/REQ-179 are correct. Doc 10 Section 1.6 technology table still reads "Node.js + Express + static HTML/JS on Railway" for the Admin row — not updated. |
| 4 | Subscription tier enum FREE\|MID\|HIGH everywhere in code; "High Tier" in display names; NO "top"/"Top" in code/enum contexts | PARTIAL FAIL | `SubscriptionTier` Swift enum in doc 09 is correctly `case high = "HIGH"`. However, doc 09's `ProductID` Swift struct still uses `topMonthly` and `topAnnual` as variable names (code context). These should be `highMonthly`/`highAnnual`. Doc 10 uses "Top Regular" and "Top ~$0.08" in metric/label contexts (borderline; not enum values). Doc 03 uses "Prismatic Shard (Top)" as a shard display name — not a subscription tier enum value, acceptable. |
| 5 | Mid-tier deck slots = 6 in docs 06 and 10 | PASS | Doc 06 webhook code sets `max_deck_slots: 6` for MID. Doc 10 US-014 and REQ-036 both state Mid = 6 slots. Note: doc 10's v2.0 changelog line incorrectly states "6 slots → 5 slots" but the active spec (REQ-036) says 6. The changelog is stale/wrong but the functional requirement is correct. |
| 6 | Modifier count = 240 in doc 10 (Gap 4 resolution) | PASS | Doc 10 Section 1.5 CLAUDE.md quote, Gap 4 resolution, and P1-004 all state 240 modifiers. |
| 7 | Doc 10 PRD section references: P0-005 → 06 Section 4.5; P0-002 → 02 Sections 2–5/20; P0-013 → 06 Sections 4.6/5.1–5.6 | PASS | All three references verified correct in the P0 requirements table. |
| 8 | Doc 05 stabilizers are universal only (no per-faction stabilizers); card count = 358 | PASS for stabilizer type; NEW CONTRADICTION for card count | Doc 05 correctly states 358 cards with no per-faction stabilizers. But doc 10 Section 13.2 (doc summary table) claims doc 05 has "367 cards (300 creatures + 51 spells + 21 faction stabilizers + 7 universal)" — contradicting doc 05's own content. P1-004 also states "7 faction stabilizers" per faction. These are wrong. |
| 9 | Doc 09 has grace period section (Section 3f) | PASS | Section 3f exists with full 7-day grace period spec, SQL, and UI behavior. |
| 10 | Doc 06 has seasons and battle_pass_progress tables | PASS | Both `seasons` and `battle_pass_progress` tables are defined with full SQL DDL, RLS policies, and season-end processing logic. |
| 11 | Doc 06 evolution fallback art spec: `_fallback` suffix, `art_updated` Realtime event | PASS | R2 key uses `_fallback` suffix (e.g., `step-2_fallback.webp`). `art_updated` event broadcast via `collection:{player_id}` Supabase Realtime channel. iOS client cache eviction and shimmer overlay specified. 7-day cleanup cron included. |
| 12 | Doc 10 Admin Dashboard REQs in Section 4.12, REQ-179–186 | PASS | Section 4.12 exists with REQ-179 through REQ-186 covering auth, economy config editor, batch generation trigger, card review gallery, player lookup, match monitor, PostHog embed, and season management. |
| 13 | Doc 10 instability formula includes max(0, …) per-creature floor | PASS | Section 1.5 states: `player_instability = avatar_modifier + sum(max(0, creature_base_instability + evolution_changes + modifier_adjustments))`, clamped 1–20. |

---

## Detailed Findings

### FAIL-1: Doc 10 Section 1.6 Technology Table — Admin Row Not Updated

**Location:** `10-prd.md`, Section 1.6, infrastructure table, "Admin" row (line 95)

**Current text:**
```
| Admin | Node.js + Express + static HTML/JS on Railway | Dashboard for owner operations |
```

**Required text (per all other occurrences in docs 06, 07, 10 Section 4.12, and REQ-179):**
```
| Admin | React + Vite (TypeScript), deployed on Railway alongside the game server | Dashboard for owner operations |
```

**Impact:** High. This is the infrastructure summary table that Claude Code will read when setting up the project. If it says "Node.js + Express + static HTML/JS," the wrong stack will be built. Every other Admin Dashboard reference in the project uses "React + Vite (TypeScript)."

---

### FAIL-2: Doc 09 `ProductID` Swift Struct Uses `top` Variable Names in Code Context

**Location:** `09-monetization-details.md`, `ProductID` Swift struct (lines 123–127)

**Current code:**
```swift
static let topMonthly     = "com.chaoscreatures.app.sub_high_monthly_1299"
static let topAnnual      = "com.chaoscreatures.app.sub_high_annual_9999"

static let allSubscriptions: Set<String> = [
    midMonthly, midAnnual, topMonthly, topAnnual
]
```

**Required fix:**
```swift
static let highMonthly    = "com.chaoscreatures.app.sub_high_monthly_1299"
static let highAnnual     = "com.chaoscreatures.app.sub_high_annual_9999"

static let allSubscriptions: Set<String> = [
    midMonthly, midAnnual, highMonthly, highAnnual
]
```

**Impact:** Medium. The product IDs themselves correctly reference "high" (e.g., `sub_high_monthly_1299`), so the App Store wiring is correct. However, `topMonthly`/`topAnnual` are Swift identifiers in code that will appear in the implemented codebase, creating `top`-naming in source code — directly violating the canonical enum convention. Any developer reading this code will see `topMonthly` and may introduce `top`-naming elsewhere.

---

### NEW CONTRADICTION-A: Doc 10 Misrepresents Doc 05 Card Count and Stabilizer Structure

**Locations:**
- `10-prd.md`, P1-004 (line 190): "~120 card templates per faction (100 creatures, 17 spells, **7 faction stabilizers**) + 7 universal stabilizers. **367 total cards** across 8 batches."
- `10-prd.md`, Section 13.2 document summary for doc 05 (line 1048): "Launch content: **367 cards (300 creatures + 51 spells + 21 faction stabilizers + 7 universal)**"

**What doc 05 actually says:**
- `05-content-pipeline.md`, Section 1a: **358 card templates total** (300 creatures + 51 spells + 7 universal stabilizers)
- Explicitly states: "universal only — no faction-specific stabilizers at launch"

**Math check:**
- Doc 05: 300 + 51 + 7 = **358** (no per-faction stabilizers)
- Doc 10 P1-004: 300 + 51 + (7 × 3 factions) + 7 universal = 300 + 51 + 21 + 7 = **379** (if 7 faction stabilizers each), or if only 21 faction total: 300 + 51 + 21 + 7 = **379** — neither equals 367.
- Doc 10's own Gap 5 (line 1087) acknowledges 367 is the practical target vs 379 theoretical — but that theoretical number itself assumes 21 faction stabilizers, which contradicts doc 05.

**Root cause:** Doc 10 P1-004 and the Section 13.2 summary were written with a stale model (per-faction stabilizers in addition to universals). Doc 05 is the canonical source of truth per the protected docs and explicitly removed per-faction stabilizers from the launch count.

**Impact:** High. If a content pipeline agent reads doc 10 P1-004, it will try to generate 21 per-faction stabilizer cards that are not designed, named, or specced anywhere. Doc 05 is the authoritative content spec. Doc 10 P1-004 description and the Section 13.2 summary must be corrected to match doc 05.

---

### NEW CONTRADICTION-B: Doc 10 v2.0 Changelog Shows "Mid Deck Slots: 6 → 5" But Spec Says 6

**Location:** `10-prd.md`, v2.0 changes table (line 1121)

**Changelog entry:**
```
| Deck slot Mid tier | 6 slots | 5 slots | Aligned with 06-technical-architecture.md v3.0. |
```

**Active specification in same document:**
- US-014 (line 151): "Mid: 100 cards/faction, **6 deck slots**"
- REQ-036 (line 296): "Mid: **6 slots**"

**Doc 06 active spec:**
- Webhook code (line 721): `max_deck_slots: tier === "HIGH" ? 10 : tier === "MID" ? 6 : 3` — Mid = 6

**Assessment:** The active functional requirements (US-014 and REQ-036) and doc 06 all correctly state Mid = 6. The changelog entry is internally inconsistent with the same document's requirements and appears to be a stale or reversed migration note. It should read "5 slots → 6 slots (aligned with protected docs 00 and 02)" not the reverse. The active spec is correct; the changelog entry is wrong.

**Impact:** Low for implementation (the REQs override the changelog). Medium for auditability (a future auditor may read this changelog and conclude there was a deliberate decision to use 5 slots for Mid tier).

---

### NEW CONTRADICTION-C: Doc 01 Section 12 Summary Table Missing Warding Pillar and Entropy Engine

**Location:** `01-battle-mechanics.md`, Section 12, "Stabilizer/Manipulation Card Ranges" table (lines 1190–1196)

**Current table contains only 5 entries:**
| Card | CM Cost | Effect | Instability Contribution |
|---|---|---|---|
| Chaos Anchor | 2 | ... | 0 |
| Binding Ward | 2 | Spell: set instability to 5 | N/A (spell) |
| Chaos Rift | 2 | ... | 0 |
| Entropy Spike | 2 | Spell: set instability to 15 | N/A (spell) |
| Void Lens | 3 | ... | 0 |

**Missing from table (but defined in Section 11):**
- **Warding Pillar** (CM 3, HP 5): "While on field: your avatar's instability modifier is doubled"
- **Entropy Engine** (CM 3, HP 4): "While on field: when you roll a Chaos event, your highest-ATK creature gets +1 ATK permanently"

**Section 11 defines 5 board stabilizers + 2 spells = 7 cards.** The Section 12 summary table shows only 3 board stabilizers + 2 spells = 5 cards. Warding Pillar and Entropy Engine were presumably in the original table alongside Probability Anchor, and were accidentally omitted when Probability Anchor was removed. Note: doc 01 is a protected file; any correction here should be treated as a factual completion to match the established Section 11 content.

**Impact:** Medium. Content pipeline agents reading Section 12 to understand what cards exist will not see Warding Pillar or Entropy Engine in the summary table. Doc 05 correctly generates all 7 universal stabilizers from the Section 11 list (and its own explicit "7 cards" count), so the pipeline itself is not broken. But the Section 12 table is incomplete and could confuse balance analysis agents.

---

## Unresolved Pre-Existing Issues (Not New, Not Fixed)

These items were flagged in previous reviews and remain unfixed. They are noted here for completeness but were not in the v3 fix checklist.

**1. Doc 10 v2.0 changelog "Deck slot Mid tier: 6 → 5" (see NEW CONTRADICTION-B above)** — the active spec is correct; only the changelog description is wrong.

**2. "Top Regular" / "Top ~$0.08" verbal labels in doc 10** — these are metric/display labels (not code identifiers or enum values) referencing the High Tier subscriber segment. They are technically borderline per the "no top in code/enum contexts" rule, but are not in code blocks or enum definitions. They should ideally be "High Regular" / "High ~$0.08" for strict consistency, but are lower priority than the `topMonthly`/`topAnnual` Swift code identifiers.

**3. Doc 04 "Top Regular", "Top Casual", "Top Hardcore" player archetypes** — throughout doc 04, the High Tier subscriber is referred to as "Top Casual/Regular/Hardcore" in tables and calculations. The economy config uses `HIGH` correctly. The verbal archetype labels are display names, not code values, but they are inconsistent with the "High Tier" display name convention used in docs 00, 07, 09, and the product display names.

---

## Recommended Fixes (Priority Order)

| Priority | Location | Fix |
|---|---|---|
| **HIGH** | `10-prd.md` Section 1.6, Admin row | Change "Node.js + Express + static HTML/JS on Railway" to "React + Vite (TypeScript), deployed on Railway alongside the game server" |
| **HIGH** | `10-prd.md` P1-004 | Remove "7 faction stabilizers" — no per-faction stabilizers at launch. Change to "~117 card templates per faction (100 creatures, 17 spells) + 7 universal stabilizers. 358 total cards across 8 batches." |
| **HIGH** | `10-prd.md` Section 13.2, doc 05 summary | Change "367 cards (300 creatures + 51 spells + 21 faction stabilizers + 7 universal)" to "358 card templates (300 creatures + 51 spells + 7 universal stabilizers, no faction-specific stabilizers at launch)" |
| **MEDIUM** | `09-monetization-details.md` `ProductID` struct | Rename `topMonthly` → `highMonthly` and `topAnnual` → `highAnnual` (and update the `allSubscriptions` Set to match) |
| **MEDIUM** | `01-battle-mechanics.md` Section 12 summary table | Add Warding Pillar (CM 3, instability contribution 0) and Entropy Engine (CM 3, instability contribution 0) to the board stabilizer rows |
| **LOW** | `10-prd.md` v2.0 changelog entry | Correct the "Deck slot Mid tier: 6 slots → 5 slots" entry to reflect the actual change (which was confirming 6 slots as the canonical value, not reducing to 5) |
| **LOW** | `10-prd.md` REQ-140 and metrics table | Change "Top ~$0.08" to "High ~$0.08" and "Top Regular ~3 weeks" to "High Regular ~3 weeks" |

---

## Verification Commands

To verify all 13 original fix items after applying recommended fixes:

```bash
# Item 1: Void Lens as stabilizer, no Probability Anchor in Section 12
grep -n "Probability Anchor" docs/design/01-battle-mechanics.md   # should return empty
grep -n "Void Lens" docs/design/01-battle-mechanics.md | grep "stabilizer\|0$"   # should match

# Item 2: FAL_KEY consistency
grep -rn "FAL_API_KEY\|fal_api_key\|FAL_API\b" docs/design/03-prompt-templates.md docs/design/05-content-pipeline.md docs/design/06-technical-architecture.md docs/design/10-prd.md   # should return empty
grep -n "FAL_KEY" docs/design/03-prompt-templates.md docs/design/05-content-pipeline.md docs/design/06-technical-architecture.md docs/design/10-prd.md   # should match in all 4

# Item 3: Admin Dashboard technology
grep -n "React + Vite" docs/design/10-prd.md docs/design/06-technical-architecture.md docs/design/07-ui-ux-specs.md   # should match in all 3

# Item 4: No "top" in code/enum contexts
grep -n "case top\b\|topMonthly\|topAnnual\|top_tier\|TOP_TIER\|\"top\"" docs/design/09-monetization-details.md docs/design/10-prd.md   # should return empty after fixes

# Item 5: Mid deck slots = 6
grep -n "Mid.*6.*slot\|6.*deck.*slot\|max_deck_slots.*6" docs/design/06-technical-architecture.md docs/design/10-prd.md   # should match

# Item 6: 240 modifiers in doc 10
grep -n "240 modifier\|240.*modifier" docs/design/10-prd.md   # should match

# Item 8: Doc 05 card count 358, no faction stabilizers
grep -n "358\|universal only\|no faction-specific" docs/design/05-content-pipeline.md   # should match

# Item 9: Grace period Section 3f in doc 09
grep -n "3f\.\|Section 3f\|grace period" docs/design/09-monetization-details.md   # should match Section 3f

# Item 10: seasons and battle_pass_progress tables in doc 06
grep -n "CREATE TABLE seasons\|CREATE TABLE battle_pass_progress" docs/design/06-technical-architecture.md   # should match both

# Item 11: _fallback suffix and art_updated Realtime
grep -n "_fallback\|art_updated" docs/design/06-technical-architecture.md   # should match both

# Item 12: REQ-179 through REQ-186 in doc 10
grep -n "REQ-179\|REQ-186" docs/design/10-prd.md   # should match

# Item 13: max(0,...) per-creature floor in doc 10
grep -n "max(0" docs/design/10-prd.md   # should match instability formula
```

---

*Audit completed: 2026-02-16*
*Next action: Apply the 7 recommended fixes above, then run the verification commands.*

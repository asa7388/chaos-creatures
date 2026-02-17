# PRD Audit Report -- `10-prd.md` v2.0

**Auditor:** prd-auditor agent
**Date:** 2026-02-16
**Documents reviewed:**
- `10-prd.md` (PRD being audited)
- `00-game-design-master.md` (source of truth)
- `01-battle-mechanics.md` (source of truth)
- `02-card-data-model.md` (source of truth)
- `04-progression-economy.md` (source of truth for economy)
- `05-content-pipeline.md` (source of truth for content counts)
- `09-monetization-details.md` (source of truth for subscriptions)
- `CLAUDE.md` (infrastructure stack and build context)

---

## 1. Summary

| Category | Count |
|---|---|
| Contradictions with core docs | 4 |
| Unauthorized additions | 2 |
| Missing features | 8 |
| Vagueness issues | 5 |
| Owner skill assumptions | 1 |
| Infrastructure stack issues | 1 |

---

## 2. Contradictions with Core Docs

### C-1: Shard Costs (REQ-039 and Gap 5 Resolution)

**What the PRD says (REQ-039):** Shard costs are Uncommon=25, Rare=75, Epic=150, Legendary=240 Dust.

**What the PRD's Gap 5 claims:** "The economy doc (`04-progression-economy.md` Section 2.3) states Uncommon=25, Rare=75, Epic=150, Legendary=240."

**What the source docs actually say:**
- `04-progression-economy.md` lines 173-176: Uncommon=30, Rare=60, Epic=120, Legendary=240
- `04-progression-economy.md` lines 322-325: Uncommon=30, Rare=60, Epic=120, Legendary=240
- `04-progression-economy.md` line 250: "30 -> 60 -> 120 -> 240"
- `04-progression-economy.md` line 180: "30 + 60 + 120 + 240 = 450 Dust" (full evolution cost)
- `00-game-design-master.md` line 88: "30/60/120/240 Dust"
- `00-game-design-master.md` line 334: "30/60/120/240 Dust"

**Severity: HIGH.** The PRD's Gap 5 resolution cites the economy doc as stating values (25/75/150/240) that do not exist anywhere in that document. Every reference in both `04-progression-economy.md` and `00-game-design-master.md` consistently says 30/60/120/240. The PRD invented incorrect shard costs and attributed them to the economy doc. All downstream economy math in the economy doc (weekly income projections, time-to-legendary calculations, full evolution cost of 450 Dust) is based on 30/60/120/240.

**Resolution:** Change REQ-039 to: Uncommon=30, Rare=60, Epic=120, Legendary=240 Dust. Update Gap 5 to correctly state the economy doc values. Store in `economy_config` table as already specified.

---

### C-2: Phase Grouping (REQ-005)

**What the PRD says (REQ-005):** "Phases 1-4 and 9 are automatic (no player input, no timer). Phases 5-7 are decision phases with timers. Phase 8 resolves automatically after blocker confirmation."

**What the source doc says (`01-battle-mechanics.md` lines 332-348):**
```
AUTOMATIC PHASES (no timer):
  1. Start of Turn
  2. Chaos Roll
  3. Event Resolution
  4. Draw & Gain Mana

DECISION PHASES (60-second timer):
  5. Main Phase
  6. Declare Attackers
  7. Assign Blockers
  8. Combat Resolution

AUTOMATIC:
  9. End of Turn
```

**Severity: LOW.** The battle mechanics doc explicitly groups Phase 8 (Combat Resolution) under "DECISION PHASES" alongside Phases 5-7. The PRD reclassifies Phase 8 as automatic. While Phase 8 itself has no player input (combat resolves automatically), the source doc's grouping is intentional -- it places Phase 8 within the decision window, not after it. The PRD's reclassification is arguably more accurate for implementation but contradicts the explicit source doc categorization.

**Resolution:** Either align REQ-005 with the source doc ("Phases 5-8 are decision phases. Phase 8 resolves automatically within this window.") or add a note that Phase 8 is reclassified from the source doc for implementation clarity.

---

### C-3: Content Counts (P1-004 and REQ-135)

**What the PRD says:**
- P1-004: "~120 card templates per faction (90-125 creatures, 15-20 spells, 5-10 stabilizers)"
- REQ-135: Minimum 300 total (100/faction), target 360 total (120/faction)

**What the source docs say:**
- `05-content-pipeline.md` lines 15-24: 100 creatures + 17 spells + 7 faction stabilizers = 124 per faction, 372 faction total + 7 universal = **379 grand total** (practical target: 367)
- `00-game-design-master.md` lines 100-106: ~60-80 creatures, ~20-30 spells, ~10-15 stabilizers = ~90-125 per faction (earlier estimates)

**Severity: MEDIUM.** The PRD's creature/spell/stabilizer ranges (90-125 creatures, 15-20 spells, 5-10 stabilizers) come from the master doc's earlier estimates, not the content pipeline's final numbers (100 creatures, 17 spells, 7 stabilizers). More importantly, the PRD's REQ-135 target of "360 total (120/faction)" omits the 7 universal stabilizers. The content pipeline's practical target is 367 (360 faction + 7 universal).

**Resolution:** Update P1-004 to reference the content pipeline's final numbers: 100 creatures, 17 spells, 7 stabilizers = 124 per faction. Update REQ-135 target to 367 total (360 faction + 7 universal).

---

### C-4: Onboarding Starter Shard Rewards (US-003 vs. Economy Doc)

**What the PRD says (US-003):** "After faction selection, player receives 200 Chaos Dust, 3 Uncommon Shards, 1 Rare Shard, 1 Legendary Shard, and a starter avatar."

**What the source doc says (`04-progression-economy.md`):**
- Line 276: "20 Commons in 1 faction, 200 Dust, 3 Uncommon shards, 1 Rare shard, 1 Legendary shard" (matches)
- Lines 332-333: "Starter pack (onboarding): 3 Uncommon + 1 Rare" and separately "1 Legendary" (matches)

**Severity: NONE (verified).** After full audit, the starter rewards match between the PRD and the economy doc. Included here for completeness of the audit trail.

---

## 3. Unauthorized Additions

### A-1: First Daily Win Bonus (REQ-037)

**What the PRD says:** "First daily win: +25 bonus Dust."

**What the source docs say:** No source document mentions a first daily win bonus. The economy doc (`04-progression-economy.md`) defines `dust_income` at lines 1007-1010 with only `win_dust: 15`, `loss_dust: 5`, and `onboarding_bonus_dust: 200`. No `first_daily_win_bonus` field exists. The economy doc's weekly income projections do not account for this bonus.

**Impact:** Adding +25 Dust per day inflates weekly income by ~175 Dust/week (assuming the player wins at least once daily), which is a ~13% increase for Free Regular players (from 1,330 to ~1,505 Dust/week). This would change the economy doc's carefully calibrated progression timelines.

**Resolution:** Remove "First daily win: +25 bonus Dust" from REQ-037 unless this is an intentional design change approved by the owner. If approved, the economy doc's weekly income tables, time-to-milestone calculations, and dust bank projections all need recalculation.

---

### A-2: Battle Pass Details (P2-002)

**What the PRD says:** "Free track (30 tiers) + Premium track (50 tiers, $9.99/season), XP progression."

**What the source docs say:** The battle pass is mentioned in the monetization doc (`09-monetization-details.md`) but the specific "30 tiers free" detail and the "50 tiers premium" are specified there. This is not an addition from a core design doc (00, 01, 02) but is sourced from doc 09, so it is not truly unauthorized. However, the core design docs (00, 01, 02) do not define a battle pass system at all.

**Impact:** Low -- P2-002 is already categorized as post-launch. Including it is reasonable for planning.

**Resolution:** No action needed. The PRD correctly classifies this as P2 (post-launch).

---

## 4. Missing Features

### M-1: Specific Common Purchase (50 Dust)

**Source:** `00-game-design-master.md` line 87: "Specific Common | 50 Dust." `04-progression-economy.md` line 172: "Specific Common (targeted purchase) | 50 | Purchase a specific named Common."

**Missing from PRD:** P0-006 mentions "spending (card packs, shards, specific cards)" in the feature description, but no REQ defines this purchase type, and no API endpoint exists for it (only `POST /economy/purchase/card-pack` and `POST /economy/purchase/shard`).

**Resolution:** Add a REQ for specific Common card purchase (50 Dust, from own faction only). Add API endpoint `POST /economy/purchase/specific-card` with request `{card_template_id}`.

---

### M-2: Dismantle Feature

**Source:** `00-game-design-master.md` line 1129: "Dismantle -- Destroy a card to recover a fraction of its shard investment. Returns: Uncommon->nothing, Rare->Uncommon Shard, Epic->Rare Shard, Legendary->Epic Shard."

**Missing from PRD:** No REQ, no user story, and no API endpoint for dismantling cards. The data model (`02-card-data-model.md`) does not have a dedicated field for this, but the concept is fully described in the master doc.

**Resolution:** Add a REQ and API endpoint for card dismantling. This is an important economy sink. Consider P0 or P1 classification -- the economy doc's balance math may depend on it.

---

### M-3: Favorite/Star Card Feature

**Source:** `00-game-design-master.md` line 1130: "Favorite -- Star a card. Favorited cards appear first in sorts and cannot be accidentally dismantled." `02-card-data-model.md` line 122: `is_favorite: bool // Player-set flag, prevents accidental dismantle`

**Missing from PRD:** No REQ or API endpoint for favoriting cards.

**Resolution:** Add a REQ and integrate into collection UI. This is a companion feature to Dismantle (M-2) -- favorited cards cannot be accidentally dismantled.

---

### M-4: Visual Prompt Modifier Counts by Subscription Tier

**Source:** `00-game-design-master.md` line 944: "Player picks from their tier-appropriate prompt modifier list (8-10 for free, 25-30 for mid, 40+ for high)."

**Missing from PRD:** The PRD mentions "player-selected prompt modifiers" and "curated whitelist" (REQ-074), and the prompt modifier tables are referenced in `03-prompt-templates.md`, but no REQ specifies the number of visual prompt modifiers available per subscription tier during evolution.

**Resolution:** Add a REQ specifying: Free tier sees 8-10 visual prompt modifiers. Mid tier sees 25-30. Top tier sees 40+. Players select 1-3 modifiers from the list to influence art generation.

---

### M-5: Stabilizer-Specific Rules Not Enumerated

**Source:** `01-battle-mechanics.md` lines 1099-1111 defines specific stabilizer rules: stabilizers occupy board slots, have HP but no ATK, cannot attack or block, have continuous aura effects, have 0 base instability, do not evolve, and Taunt's forced-attack does not count stabilizers.

**Missing from PRD:** REQ-016 mentions "Stabilizers occupy board slots" but none of the other stabilizer-specific rules have dedicated requirements. The Taunt interaction with stabilizers is especially important -- Taunt forced-attack should not require the player to "attack with" a stabilizer (since they cannot attack).

**Resolution:** Add a dedicated REQ for stabilizer rules, particularly: (1) stabilizers cannot attack or block, (2) Taunt forced-attack does not count stabilizers, (3) stabilizers have 0 base instability, (4) stabilizers do not evolve.

---

### M-6: Hand Limit / No Hand Limit Rule

**Source:** `01-battle-mechanics.md` does not specify a hand limit. `02-card-data-model.md` does not define a hand_limit field. No hand limit appears anywhere in the source docs.

**Missing from PRD:** The PRD does not state whether there is a hand limit. For implementation, Claude Code needs to know: is there a maximum hand size? What happens if the player has too many cards? The battle doc says "Draw 1 card per turn. If deck is empty, no card is drawn and no penalty." But it never says what happens if the hand is full.

**Resolution:** Add a REQ explicitly stating that there is no hand limit (if that is the design intent), or defining the hand limit and discard behavior if there is one.

---

### M-7: Start of Turn Phase Effects

**Source:** `01-battle-mechanics.md` lines 355-365 defines Phase 1 (Start of Turn):
- Active player's board effects fire (Corruption self-damage, stabilizer auras, modifier start-of-turn triggers)
- Check for creature deaths from start-of-turn damage
- Remove dead creatures, fire ON_DEATH abilities
- Recalculate instability for active player

**Missing from PRD:** No REQ covers Phase 1 specifics. The Corruption self-damage mechanic fires in Phase 1 BEFORE the chaos roll, which is strategically significant (a Corruption creature might die before the roll, changing instability). This is a critical implementation detail.

**Resolution:** Add a REQ covering Phase 1 resolution order: board effects fire, creature deaths are processed, ON_DEATH abilities fire, instability is recalculated -- all before the Chaos Roll in Phase 2.

---

### M-8: Triggered Ability Framework Details

**Source:** `01-battle-mechanics.md` defines 7 trigger types: ON_ORDER, ON_CHAOS, ON_PLAY, ON_DEATH, ON_DAMAGE_TAKEN, ON_ATTACK, ON_BLOCK. It also defines effect types, targeting rules, durations, and tier scaling (Uncommon = 1 trigger, Rare = 60% chance of second ability, Epic = 1-2 triggers, Legendary = always 2 triggers).

**Missing from PRD:** REQ-012 covers firing order for event-type triggers and REQ-026 says "exactly one triggered ability per step." But the PRD does not enumerate the 7 trigger types, define targeting rules (SELF, RANDOM_ENEMY, RANDOM_FRIENDLY, ALL_FRIENDLY, ALL_ENEMY, FRIENDLY_CHOOSE, ALL_BOARD), or specify durations (PERMANENT, THIS_TURN, UNTIL_NEXT_ROLL). These details are critical for the game server's triggered ability resolution engine.

**Resolution:** Either add REQs enumerating trigger types, targeting, and durations, or add explicit forward references to `01-battle-mechanics.md` Sections 10.1-10.5 with a note that these are implementation-complete specifications.

---

## 5. Vagueness Issues

### V-1: REQ-027 Stat Growth Algorithm

**What it says:** "PP at tier = base_PP x tier_multiplier (Common 1.0x, Uncommon 1.5x, Rare 2.0x, Epic 2.5x, Legendary 3.0x). Per-step PP split between stats and modifier budget per `01-battle-mechanics.md` Section 1."

**Problem:** The requirement gives the tier multipliers but defers the actual stat growth algorithm to another doc. Claude Code needs to know: how are the extra PP points at each tier distributed between ATK and HP? What is the stat/modifier PP split ratio? The battle doc defines this, but the PRD should either include the algorithm or provide a precise forward reference with acceptance criteria.

**Resolution:** Add the stat growth allocation rule from `01-battle-mechanics.md` Section 1 directly to the acceptance criteria, or make the forward reference more specific (e.g., "See `01-battle-mechanics.md` Section 1.3, PP Split Table").

---

### V-2: REQ-051 Evolution Ceremony "9-Step Ceremony"

**What it says:** Lists 9 steps and references `07-ui-ux-specs.md` Section 4 for "Full step specs."

**Problem:** The 9 steps are listed but lack duration targets, animation specifications, and UI component details. Claude Code cannot implement a "Card Presentation" or "Evolution Animation" step without knowing what visual elements to render, what animations to use, or what the layout looks like. The forward reference to 07 is correct, but the PRD should include key acceptance criteria per step.

**Resolution:** Add per-step acceptance criteria or at minimum note that `07-ui-ux-specs.md` Section 4 contains complete per-step component specs that must be followed exactly.

---

### V-3: REQ-055 and REQ-056 Faction Mechanic Implementation

**What REQ-055 says:** "Ironwright: Augment (stacking self-referencing effects). Fey Courts: Bond (cross-creature synergies). Demonic Kingdoms: Corruption (self-damage for power)."

**Problem:** The descriptions are conceptual, not implementable. How does "stacking self-referencing effects" work in code? The answer is in `01-battle-mechanics.md` Section 6 (modifier pool examples), but the PRD provides no algorithmic specification for how Augment counting, Bond board-reading, or Corruption self-damage work mechanically.

**Resolution:** Either add implementation-level acceptance criteria (e.g., "Augment count = number of ModifierInstances on the card where modifier_definition.faction_mechanic == AUGMENT") or add explicit forward references to the exact sections in `01-battle-mechanics.md` that define these mechanics.

---

### V-4: Admin Dashboard Feature Scope (P1-011)

**What it says:** "React SPA on Railway: economy config editor, batch card generation trigger, generation review/approve/reject gallery, player lookup, match monitor, PostHog embedding."

**Problem:** This is a feature list, not a specification. Claude Code cannot build an admin dashboard from a comma-separated list. There is no REQ defining the admin dashboard's screens, data flows, authentication method, or UI layout.

**Resolution:** Add dedicated REQs for each admin dashboard feature, or add a strong forward reference to `06-technical-architecture.md` Section 8 which presumably specifies this.

---

### V-5: Matchmaking Edge Function Polling (REQ-043)

**What it says:** "A Supabase Edge Function polls the `matchmaking_queue` table every 2 seconds."

**Problem:** Who triggers the polling? Is it a pg_cron job? A client-side interval? A persistent Edge Function with a timer? Supabase Edge Functions are request-response, not long-running. The mechanism for "polling every 2 seconds" needs specification. Is it a pg_cron job that runs every 2 seconds and calls the Edge Function? (pg_cron minimum interval is 1 minute.) Is it a Supabase Realtime subscription on the matchmaking_queue table?

**Resolution:** Specify the exact polling mechanism. If pg_cron (minimum 1 minute interval), this cannot poll every 2 seconds. Alternative: use Supabase Realtime to subscribe to matchmaking_queue inserts and trigger matching logic on each new insert. Or use the Railway game server for matchmaking polling.

---

## 6. Owner Skill Assumptions

### O-1: Railway Log Checking (Section 12.5)

**What it says:** "Check Railway logs for game server errors. If server crashed, Railway auto-restarts."

**Problem:** Checking Railway logs requires navigating the Railway dashboard, understanding log output, and identifying error patterns. This assumes technical skill the owner may not have.

**Resolution:** Route critical game server errors to PostHog (or a Slack webhook) so the owner sees them in the Admin Dashboard or via notification, not in Railway logs. The Admin Dashboard should surface game server health status.

---

## 7. Infrastructure Stack Issues

### I-1: CLAUDE.md Does Not Include RevenueCat

**What CLAUDE.md says (line 39):** "Payments: App Store / Google Play native IAP (no Stripe needed -- stores handle subscriptions)"

**What the PRD says (Section 1.6):** "Payments: RevenueCat -- Wraps Apple IAP + Google Play Billing"

**What `09-monetization-details.md` says (Section 2):** RevenueCat was explicitly chosen over expo-in-app-purchases, with detailed reasoning.

**Severity: MEDIUM.** The PRD correctly uses RevenueCat per the monetization doc's decision. However, CLAUDE.md -- the project's master infrastructure reference -- does not list RevenueCat. Any agent reading CLAUDE.md alone will not know to use RevenueCat.

**Resolution:** Update CLAUDE.md's Infrastructure Stack section to change the Payments entry from "App Store / Google Play native IAP (no Stripe needed)" to "RevenueCat (wraps Apple IAP + Google Play Billing). Free until $2,500 MRR." Add RevenueCat to the accounts-to-create list.

---

## Appendix: Items Verified Correct

The following systems were audited and found to be consistent between the PRD and source docs:

- 3 factions (Ironwright/Augment, Fey Courts/Bond, Demonic Kingdoms/Corruption) -- matches 00, 01
- 7 keywords (Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing) -- matches 01
- MTG-style combat (declare attackers, assign blockers, simultaneous damage) -- matches 01
- Taunt = forced attack + forced block (two-part rule) -- matches 01
- Main phase only spells -- matches 01
- PP-based modifier pools: 12 pools x (8 universal + 4 per faction) = 240 modifiers -- matches 01
- Subscription-tiered modifier selection: Free (2 options), Mid (3), Top (4) -- matches 00, 01
- Chaos Dust economy: no real money on individual cards -- matches 00
- CM cost fixed forever through evolution -- matches 00, 01
- Evolution energy thresholds: 15/30/50/75 -- matches 00, 01, 04
- Energy earn rate: 2/win, 1/loss; all 20 deck cards earn simultaneously -- matches 00, 01, 04
- Instability formula: avatar modifier + sum(creature instability), clamped 1-20 -- matches 01
- D20 Chaos Roll: roll < instability = Chaos, roll > instability = Order, roll == instability = Nothing -- matches 01
- 8 Order events (O1-O8) and 8 Chaos events (C1-C8) -- matches 01
- Evolution instability changes per step and outcome -- matches 01
- 70/30 channeling roll -- matches 00, 01
- Deck size = 20 cards, single faction, max 2 copies, max 2 Legendaries at 1 copy each -- matches 02
- Card per-faction limits by tier (50/100/200) -- matches 00
- Deck slot limits by tier (3/6/10) -- matches 02
- Win: 15 Dust, Loss: 5 Dust -- matches 04
- Card pack: 3 Commons for 100 Dust -- matches 00, 04
- Cross-faction pack: 150 Dust, unlocks faction permanently -- matches 00, 04
- Mulligan: shuffle entire hand, draw same number, one opportunity -- matches 01
- P1 draws 4, P2 draws 5 + Chaos Spark -- matches 01
- Chaos Spark: 0-cost, single-use, +1 mana, cannot be mulliganed -- matches 01
- P1 cannot attack turn 1 -- matches 01
- Game end conditions (0 HP, surrender after turn 2, 3 consecutive disconnects, 3 consecutive timeouts) -- matches 01
- Active player loses on simultaneous 0 HP -- matches 01
- Subscription prices ($6.99 Mid, $12.99 Top) -- matches 09
- AI image generation endpoints and quality tiers -- matches 03
- Supabase/Railway/fal.ai/OpenAI/R2/PostHog stack -- matches CLAUDE.md (except RevenueCat, see I-1)

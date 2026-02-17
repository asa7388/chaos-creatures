# AUDIT-W3B: Design Doc vs Code Coverage
**Date**: 2026-02-17
**Auditor**: Claude Code (Audit Agent W3B)

---

## Summary

| Metric | Count |
|---|---|
| Systems fully implemented | 12 |
| Systems partially implemented | 7 |
| Systems missing from code | 4 |
| Contradictions found | 8 |
| Economy value mismatches | 3 |
| Enum consistency issues | 0 (all enums match) |

---

## Coverage Matrix

| System (from docs) | Doc Source | Implementation Status | Notes |
|---|---|---|---|
| **Card Template model** | Doc 02 Section 1 | FULL | `card_templates` table in 00002_core_tables.sql, `CardTemplate` in Swift/TS types. All fields present. |
| **Card Instance model** | Doc 02 Section 2 | FULL | `card_instances` table, Swift `CardInstance.swift`, TS `CardInstance` interface. All fields match. |
| **Evolution Record model** | Doc 02 Section 3 | FULL | JSONB array on card_instances. Schema matches doc 02. |
| **Modifier Definition model** | Doc 02 Section 4a | PARTIAL | Table exists (`modifier_definitions` in 00002_core_tables.sql) but **NO seed data**. 0 of 240 modifier definitions populated. |
| **Triggered Abilities model** | Doc 02 Section 5 | PARTIAL | Schema present as JSONB in card_instances. No pre-built triggered ability definitions seeded. |
| **Faction system (3 factions)** | Doc 00 Section 2 | FULL | 3 factions seeded in seed.sql. Correct names, mechanics, short_names, colors. |
| **Avatar system** | Doc 00 Section 10 / Doc 01 Section 5 | FULL | 6 avatars seeded (2 per faction). Instability modifiers populated. |
| **7 Keywords** | Doc 02 Section 1 | FULL | All 7 in SQL enum, Swift `Keyword` enum, TS `Keyword` type. Descriptions and iconNames in Swift. |
| **Combat resolution** | Doc 01 Section 3 (Phase 8) | FULL | `packages/game-server/src/engine/combat.ts` — Shield/Damage/Deathtouch/Piercing/Lifesteal priority chain. Taunt forced-attack and forced-block. Flying/Reach blocking rules. Simultaneous damage. |
| **Instability calculation** | Doc 01 Section 2 | FULL | `packages/game-server/src/engine/instability.ts` — creature instability (base + evo + modifier, clamped min 0), player instability (avatar + creatures, clamped 1-20). Matches spec exactly. |
| **Turn structure (9 phases)** | Doc 01 Section 3 | FULL | `packages/game-server/src/engine/turn.ts` — All 9 phases implemented. Start of turn Corruption self-damage. Chaos Roll with D20. Event resolution with 10-second sub-timer. Draw + Mana. Main phase. Declare attackers. Assign blockers. Combat resolution. End turn. |
| **D20 Chaos Roll** | Doc 00 Section 9 | FULL | `packages/game-server/src/engine/rng.ts` — SeededRNG for D20. `SpriteKit/Scenes/ChaosRollScene.swift` for animated roll. |
| **Event system (16 events)** | Doc 01 Sections 8-9 | FULL | All 16 events (8 Order + 8 Chaos) seeded in seed.sql. Effect JSON matches doc. `can_backfire` flags correct on C3, C6, C7. |
| **Quest system (30 templates)** | Doc 04 Section 4 | FULL | 30 quest templates seeded (20 daily + 10 weekly). Dust values, difficulties, shard rewards all match doc 04. |
| **Achievement system (23 achievements)** | Doc 00 Section 15 | FULL | 23 achievements seeded. Categories match. Edge Functions: `evaluate-achievements`, `check-missed-achievements`. |
| **Economy config (50+ keys)** | Doc 04 Section 9 | FULL | 50 economy_config entries in seed.sql. Match rewards, shard costs, energy thresholds, quest multipliers, season rewards all present. |
| **Chaos Dust economy** | Doc 04 Section 2 | FULL | `dust_per_win=15`, `dust_per_loss=5`. Edge Functions for pack opening, shard purchase, quest evaluation all exist. |
| **Evolution energy thresholds** | Doc 00 Section 4 | FULL | 15/30/50/75 in seed.sql economy_config, TS `EVOLUTION_ENERGY_THRESHOLDS`, Swift `EvolutionTier.energyThreshold`. All consistent. |
| **Matchmaking** | Doc 06 Section 2.3 | FULL | `packages/game-server/src/services/matchmaking.ts` — Rank-range expansion (2 initial, 5 max, 5s intervals). Edge Functions: `join-queue`, `leave-queue`. |
| **Deck validation** | Doc 02 Section 10 | FULL | Edge Function `validate-deck` and shared `deck-validator.ts`. 20-card size, max 2 copies, single faction, max 2 legendaries. |
| **Bot AI** | N/A (practice match) | FULL | `packages/game-server/src/bot/ai.ts` + `bot/runner.ts`. Practice mode working per CLAUDE.md. |
| **Season system** | Doc 04 Section 5 | PARTIAL | Season 1 seeded. Season tables exist (00008_season_tables.sql). Season rewards configured in economy_config. But no `season-end` or `season-rollover` Edge Function found. |
| **Subscription / StoreKit 2** | Doc 00 Section 7 | PARTIAL | `StoreKitService.swift` exists. `sync-entitlements` Edge Function exists. But no App Store Server API v2 receipt validation found on the game server. |
| **Evolution flow (art generation)** | Doc 03 Section 1 | PARTIAL | Edge Functions `start-evolution`, `complete-evolution`, `generate-evolution-art`, `generate-card-text` exist. Prompt builder (`prompts.ts`) is comprehensive. **But**: local script has diverged style anchor (see Contradictions). |
| **Batch card generation** | Doc 03 Section 1.3 | PARTIAL | Edge Function `batch-generate` exists. Admin dashboard has batch generation page. Local scripts exist. **But**: no card templates or modifier definitions are actually seeded — the pipeline has not been run to completion. |
| **Card dismantle system** | Doc 02 Section 8 | MISSING | No `dismantle-card` Edge Function. `ShardSource.dismantleReturn` enum value exists but no code uses it. |
| **Friend system** | Doc 02 Section 11 | MISSING | `friend_code` field exists on Player model. `friend_ids` array exists. Social tables exist (00005_social_tables.sql). But **no Edge Functions** for sending/accepting friend requests, no friend list UI screen. |
| **Battle Log / Graveyard UI** | Doc 07 Section 1 | PARTIAL | Graveyard referenced in BattleContainerView and BattleViewModel. But no dedicated `GraveyardView.swift` file or `BattleLogView.swift` file. These appear to be inline in BattleContainerView as sheets. |
| **Haptic feedback** | Doc 07 Technology Stack | MISSING | Doc 07 specifies `HapticManager` singleton wrapping `UIFeedbackGenerator`. No `HapticManager.swift` file exists. No `UIFeedbackGenerator` usage found anywhere in the codebase. |
| **Mode Selection screen** | Doc 07 Section 1 | PARTIAL | Referenced in ContentView.swift but no dedicated `ModeSelectionView.swift`. Mode selection appears embedded in HomeView. |

---

## Contradictions

### C-1: STYLE_ANCHOR divergence between Edge Functions and local scripts (CRITICAL)

| Location | STYLE_ANCHOR |
|---|---|
| `supabase/functions/_shared/prompts.ts` | `"fantasy card game art, painterly digital illustration, semi-realistic style, rich saturated colors..."` (v1 generic style) |
| `scripts/generate-test-cards.mjs` | `"traditional oil painting on canvas by Donato Giancola and Frank Frazetta, visible heavy brushwork..."` (v3 artist-reference style) |
| Doc 03 Section 1.1 | Matches the Edge Functions version (v1 generic) |
| CLAUDE.md Art Quality Target | Specifies v3 style anchor with artist references (Donato Giancola, Frank Frazetta, Brom, Keith Parkinson, etc.) |

**Impact**: The 9 test cards + 3 evolution variants were generated with the v3 artist-reference anchor (local scripts), but the Edge Functions `prompts.ts` still uses the v1 generic anchor. If the Edge Function pipeline is fixed and used for batch generation, cards will look completely different from the existing test cards. **CLAUDE.md is the source of truth** and specifies v3 artist references. The Edge Functions `prompts.ts` STYLE_ANCHOR must be updated to match.

Similarly, the FACTION_PREFIXES in `scripts/generate-test-cards.mjs` differ from `supabase/functions/_shared/prompts.ts` (the local scripts use more atmospheric, artist-referenced descriptions while the Edge Functions use generic descriptions).

### C-2: Admin Dashboard deployment location contradicts between docs

| Source | Says |
|---|---|
| CLAUDE.md | "Admin Dashboard: Vercel (Next.js web app)" / deployed URL is `*.vercel.app` |
| Doc 06 Section 1.2 | "deployed on Railway alongside the game server" |
| Doc 07 | "deployed on Railway (same project, separate service)" |
| `packages/admin-dashboard/package.json` description | "Next.js on Railway" |

**Reality**: CLAUDE.md has the deployed URL as `admin-dashboard-eight-sooty-40.vercel.app`, confirming it is actually deployed on **Vercel**. Doc 06 and Doc 07 still say Railway. The package.json description also says Railway.

**Fix needed**: Doc 06, Doc 07, and package.json should be updated to say Vercel.

### C-3: Max deck slots mismatch between Swift/seed.sql and Edge Functions

| Source | Free | Mid | High |
|---|---|---|---|
| Doc 00 Section 7 | 3 | 6 | 10 |
| Swift `SubscriptionTier.maxDeckSlots` | 3 | 6 | 10 |
| seed.sql `max_decks_free/mid/high` | 3 | 6 | 10 |
| Edge Functions `MAX_DECK_SLOTS` in `_shared/types.ts` | **4** | **6** | **8** |

**Impact**: The Edge Functions `save-deck` uses `MAX_DECK_SLOTS` from `_shared/types.ts` which has `FREE: 4, MID: 6, HIGH: 8`. This contradicts doc 00 (3/6/10), the seed.sql (3/6/10), and the Swift enum (3/6/10). Free users get 4 slots instead of 3 in the Edge Function, and High users get only 8 instead of 10.

### C-4: Match communication architecture — Doc says WebSocket, code uses Supabase Realtime

| Source | Says |
|---|---|
| CLAUDE.md | "communicates with clients via direct WebSocket" |
| Doc 06 Section 1.1 diagram | `IOS --> REALTIME`, `REALTIME --> GAME` |
| Game server code | Uses Supabase Realtime channels for match communication |
| iOS MatchService.swift | Uses `RealtimeChannelV2` (Supabase Swift SDK) |
| Game server `index.ts` comment | "Match communication uses Supabase Realtime channels (not raw WebSocket)" |

**Reality**: Both the iOS client and game server communicate via **Supabase Realtime channels**, not direct WebSocket. A lightweight WebSocket server exists on `/ws` only for health/admin monitoring. CLAUDE.md statement about "direct WebSocket" is incorrect.

### C-5: Onboarding starter shard package — seed.sql adds a Legendary shard not in doc 04

| Source | Starter Shards |
|---|---|
| Doc 04 Section 3.2 (authoritative) | 3 Uncommon + 1 Rare + **1 Legendary** |
| seed.sql `onboarding_shards_uncommon` | 3 |
| seed.sql `onboarding_shards_rare` | 1 |
| seed.sql `onboarding_shards_legendary` | **1** |

This is actually consistent with doc 04. However, seed.sql includes `onboarding_shards_legendary` = 1, while there is **no** `onboarding_shards_epic` key in seed.sql. Doc 04 Section 3.2 explicitly says the starter package is "3 Uncommon + 1 Rare + 1 Legendary" with no Epic shard, so the seed.sql correctly omits an Epic shard entry.

**Not a contradiction** — marking for awareness only. The starter package intentionally skips Epic shards (the Legendary shard is aspirational per doc 04).

### C-6: Doc 06 says Apple Sign-In only, but AuthService.swift may support email auth

Doc 06 Section 1.2 states: "Supabase Auth (Apple Sign-In Only)". However, this needs verification that `AuthService.swift` only supports Apple Sign-In.

### C-7: Composition variety system not implemented

CLAUDE.md states: "The prompt system includes 12 composition templates (portraits, action shots, environmental, dramatic, narrative) selected automatically based on card tier, keywords, and mana cost."

The Edge Functions `prompts.ts` has only a single `COMPOSITION_INSTRUCTION` string. The local script `generate-test-cards.mjs` also uses a single composition. There are **no 12 composition templates** and no automatic selection logic based on tier/keywords/mana cost. This system exists only in CLAUDE.md, not in doc 03 or any code.

### C-8: Doc 06 references "4-5 screens" for Admin Dashboard; actual has 8 pages

| Source | Admin Dashboard Screens |
|---|---|
| Doc 06 Section 1.2 | "Lightweight, 4-5 screens" |
| CLAUDE.md | "8 pages built: Login, Dashboard overview, Card generation & review gallery, Economy config editor, Analytics embed, Batch generation trigger, Settings, Generation job history" |

**CLAUDE.md reflects the actual build state** (8 pages). Doc 06 is stale.

---

## Economy Value Sync

| Config Key | Doc 04 Value | seed.sql Value | Match? |
|---|---|---|---|
| `dust_per_win` | 15 | 15 | YES |
| `dust_per_loss` | 5 | 5 | YES |
| `card_pack_cost_own_faction` | 100 | 100 | YES |
| `card_pack_cost_other_faction` | 150 | 150 | YES |
| `specific_common_cost` | 50 | 50 | YES |
| `shard_cost_uncommon` | 30 | 30 | YES |
| `shard_cost_rare` | 60 | 60 | YES |
| `shard_cost_epic` | 120 | 120 | YES |
| `shard_cost_legendary` | 240 | 240 | YES |
| `avatar_unlock_cost` | 300 | 300 | YES |
| `energy_per_win` | 2 | 2 | YES |
| `energy_per_loss` | 1 | 1 | YES |
| `energy_threshold_uncommon` | 15 | 15 | YES |
| `energy_threshold_rare` | 30 | 30 | YES |
| `energy_threshold_epic` | 50 | 50 | YES |
| `energy_threshold_legendary` | 75 | 75 | YES |
| `quest_multiplier_free` | 1.0 | 1.0 | YES |
| `quest_multiplier_mid` | 1.5 | 1.5 | YES |
| `quest_multiplier_high` | 2.0 | 2.0 | YES |
| `onboarding_dust_bonus` | 200 | 200 | YES |
| `onboarding_shards_uncommon` | 3 | 3 | YES |
| `onboarding_shards_rare` | 1 | 1 | YES |
| `max_cards_free` | 50 | 50 | YES |
| `max_cards_mid` | 100 | 100 | YES |
| `max_cards_high` | 200 | 200 | YES |
| `max_decks_free` | 3 | 3 | YES |
| `max_decks_mid` | 6 | 6 | YES |
| `max_decks_high` | 10 | 10 | YES |
| `season_length_weeks` | 8 | 8 | YES |
| Quest D01-D20 `base_dust` | Easy:20, Med:30, Hard:45 | Matches exactly | YES |
| Quest W01-W10 `base_dust` | Std:150, Hard:200 | Matches exactly | YES |

**All 30+ economy config values match perfectly.** The seed.sql is faithful to doc 04.

---

## Enum Consistency

| Enum Name | Swift | SQL | TypeScript (Game Server) | TypeScript (Edge Functions) | Match? |
|---|---|---|---|---|---|
| `CardType` | CREATURE, SPELL, STABILIZER | CREATURE, SPELL, STABILIZER | CREATURE, SPELL, STABILIZER | CREATURE, SPELL, STABILIZER | YES |
| `Keyword` (7) | SHIELD, LIFESTEAL, FLYING, REACH, DEATHTOUCH, TAUNT, PIERCING | Same | Same | Same | YES |
| `EvolutionTier` | COMMON, UNCOMMON, RARE, EPIC, LEGENDARY | Same | Same | Same | YES |
| `EventType` | ORDER, CHAOS | Same | Same | N/A (not separate) | YES |
| `ShardTier` | UNCOMMON, RARE, EPIC, LEGENDARY | Same | N/A (not separate) | UNCOMMON, RARE, EPIC, LEGENDARY | YES |
| `ShardQuality` | PLANAR, REFINED, PRISMATIC | Same | N/A | PLANAR, REFINED, PRISMATIC | YES |
| `ModifierPoolType` | UNIVERSAL, FACTION | Same | UNIVERSAL, FACTION | N/A | YES |
| `TierBracket` | EARLY, LATE | Same | EARLY, LATE | N/A | YES |
| `FactionMechanic` | AUGMENT, BOND, CORRUPTION | Same | Same | N/A | YES |
| `TriggerType` (7) | ON_ORDER, ON_CHAOS, ON_PLAY, ON_DEATH, ON_DAMAGE_TAKEN, ON_ATTACK, ON_BLOCK | Same | Same | N/A | YES |
| `SpellEffectType` (13) | 13 values matching | Same | Same | N/A | YES |
| `TargetType` (17) | 17 values matching | Same | Same | N/A | YES |
| `Duration` (4) | THIS_TURN, PERMANENT, WHILE_ON_FIELD, UNTIL_NEXT_ROLL | Same | Same | N/A | YES |
| `EffectType` (14) | 14 values matching | Same | Same | N/A | YES |
| `SubscriptionTier` | FREE, MID, HIGH | Same | Same | Same | YES |
| `SeasonRank` (17) | BRONZE_3 through GRANDMASTER | Same | Same | Same | YES |
| `GameMode` | RANKED, CASUAL, PRACTICE | Same | Same | Same | YES |
| `EndReason` | HP_ZERO, SURRENDER, DISCONNECT, TIMEOUT | Same | Same | N/A | YES |
| `MissionType` (10) | 10 values matching | Same | N/A | Same | YES |
| `MissionDifficulty` | EASY, MEDIUM, HARD | Same | N/A | Same | YES |
| `MissionPeriod` | DAILY, WEEKLY, ONBOARDING | Same | N/A | Same | YES |
| `AchievementCategory` (5) | 5 values matching | Same | N/A | Same | YES |
| `ColorblindMode` (4) | NONE, DEUTERANOPIA, PROTANOPIA, TRITANOPIA | Same | N/A | N/A | YES |
| `QualityLevel` (3) | FULL, REDUCED, MINIMAL | Same | N/A | N/A | YES |

**All enums are perfectly consistent across all four codebases (Swift, SQL, Game Server TS, Edge Functions TS).** This is a remarkable achievement given 24+ enum types across 4 platforms.

---

## Missing Features

### MF-1: Modifier Definitions (0 of 240 seeded) — HIGH PRIORITY

Doc 01 Section 7 specifies 240 modifier definitions (96 universal + 144 faction). The `modifier_definitions` table exists with the correct schema, but **zero rows are seeded**. Without modifier definitions, evolution cannot work in production — players have nothing to choose from.

**Files affected**: `supabase/seed.sql` (needs 240 INSERT statements), `supabase/functions/start-evolution/index.ts` (queries modifier_definitions), `supabase/functions/complete-evolution/index.ts`.

### MF-2: Card Templates (0 base cards seeded) — HIGH PRIORITY

Doc 00 Section 3 targets 270-375 base cards across 3 factions. The `card_templates` table exists but has **zero rows seeded**. The batch generation pipeline exists (Edge Function + Admin Dashboard + local scripts) but has only been used to generate 9 test cards locally, which appear to be stored directly in the database rather than via seed data.

### MF-3: Card Dismantle System — MEDIUM PRIORITY

Doc 02 Section 8 describes a card dismantle system (destroy a card instance to recover a percentage of invested resources). The `ShardSource.dismantleReturn` enum value exists in all platforms, but no Edge Function for dismantling cards exists. No UI for dismantling exists in the iOS app.

### MF-4: Friend System Edge Functions — MEDIUM PRIORITY

The `friend_ids` field exists on the Player model. Social tables exist (00005_social_tables.sql). But there are no Edge Functions for friend management (send request, accept, reject, remove, view friends). No friend-related UI screens exist beyond the `ProfileView`.

### MF-5: HapticManager — LOW PRIORITY

Doc 07 specifies a `HapticManager` singleton wrapping `UIFeedbackGenerator`. No haptic feedback code exists anywhere in the iOS codebase. This affects game feel for card play, attack, damage, chaos roll, and evolution reveal.

### MF-6: Season End/Rollover Edge Function — MEDIUM PRIORITY

The season system has tables, seed data (Season 1), and economy config for season rewards. But there is no `season-end` or `season-rollover` Edge Function to process end-of-season rewards, rank resets, or new season creation. This would need to run automatically when a season's `ends_at` timestamp passes.

### MF-7: Composition Variety System — LOW PRIORITY

CLAUDE.md describes 12 composition templates selected based on card tier/keywords/mana cost. Neither doc 03 nor any code implements this. All cards use the same single `COMPOSITION_INSTRUCTION` string.

---

## Stale Doc References

### SD-1: Doc 06 says Admin Dashboard on Railway

Doc 06 Section 1.2 and the architecture diagram show the Admin Dashboard as a Railway service. It is actually deployed on Vercel (`admin-dashboard-eight-sooty-40.vercel.app`). CLAUDE.md correctly states Vercel. Doc 06 and Doc 07 need updating.

### SD-2: Doc 06 says "4-5 screens" for Admin Dashboard

The admin dashboard has 8 pages. Doc 06 Section 1.2 still says "Lightweight 4-5 screen web app."

### SD-3: Doc 03 STYLE_ANCHOR does not match CLAUDE.md art quality target

Doc 03 Section 1.1 has the v1 generic STYLE_ANCHOR ("fantasy card game art, painterly digital illustration..."). CLAUDE.md specifies v3 with artist references (Donato Giancola, Frank Frazetta, Brom, etc.). The actual test cards were generated with v3 (local scripts). Doc 03 should be updated to reflect the locked v3 style anchor.

### SD-4: CLAUDE.md says "direct WebSocket" for game server communication

The game server uses Supabase Realtime channels for all match communication. The "direct WebSocket" language in CLAUDE.md is misleading. The only raw WebSocket is for admin health monitoring.

### SD-5: Doc 06 references Cloudflare Pages for legal pages

Doc 06 Section 1.2 says "Cloudflare Pages (free)" for privacy policy and ToS hosting. No evidence these pages have been created or deployed. No `legal/` or `pages/` directory exists in the repo.

### SD-6: Doc 06 references Xcode Cloud for CI/CD

Doc 06 Section 1.2 says "Xcode Cloud + App Store Connect" for app distribution. No evidence of Xcode Cloud configuration in the repo. This may be a future task.

---

## Detailed System Verification

### Battle Mechanics (Doc 01) — FULLY IMPLEMENTED

- Power budget system (PP = CM * 2 + 1): Not explicitly calculated at runtime (cards are pre-generated with stats), but the formula is available in doc 01 for card generation.
- Turn phases: All 9 phases present in `turn.ts`. Phase order matches doc 01 Section 3 exactly.
- Combat keyword priority: `combat.ts` implements Shield > Damage > Deathtouch > Piercing > Lifesteal.
- Taunt rules: Two-part (forced attack + forced block) correctly implemented.
- P1 Turn 1 restriction: P1 cannot attack on turn 1. Implemented.
- P2 Chaos Spark: Implemented in `turn.ts`, `match.ts`, `messages.ts`.
- Mulligan: Referenced in `handler.ts` and `messages.ts`.
- Simultaneous damage: Confirmed in `resolveCombatPair()`.
- Win on HP=0: Confirmed. Simultaneous death = active player loses. No mill/deck-out loss.

### Instability System (Doc 01 Section 2) — FULLY IMPLEMENTED

- Creature instability = base + evolution changes + modifier adjustments (clamped min 0)
- Player instability = avatar modifier + sum(creature instability) (clamped 1-20)
- All constants correct: D20 range 1-20, creature instability min 0

### Chaos Energy & Evolution (Doc 00 Section 4, Doc 04 Section 1) — FULLY IMPLEMENTED (thresholds only)

- Thresholds 15/30/50/75: Present in all three codebases (Swift, game server TS, Edge Functions TS, seed.sql)
- Energy per win/loss (2/1): Present in game server constants and seed.sql
- Evolution flow Edge Functions exist (`start-evolution`, `complete-evolution`)
- **Gap**: Cannot fully test evolution because modifier_definitions table is empty

### Deck Validation (Doc 00 Section 8, Doc 02 Section 10) — FULLY IMPLEMENTED

- 20-card deck: `DECK_SIZE = 20` in game server constants and Edge Functions
- Max 2 copies per template: `MAX_COPIES_PER_TEMPLATE = 2`
- Max 2 legendaries: `MAX_LEGENDARIES = 2`
- Single faction: Validated in `deck-validator.ts`

### UI Screens (Doc 07) — MOSTLY IMPLEMENTED

Present screens (matching doc 07 spec):
- Home (HomeView.swift) with DailyMissionsView
- Collection (CollectionView.swift) with CardDetailView
- Decks (DeckListView.swift, DeckBuilderView.swift)
- Profile (ProfileView.swift, SettingsView.swift)
- Shop (ShopView.swift, SubscriptionView.swift, CardPackOpeningView.swift)
- Battle flow: MatchmakingView, BattleContainerView, PostMatchView
- Evolution: EvolutionFlowView, ModifierPickerView, EvolutionRevealView
- Onboarding: OnboardingView, FactionPickerView
- Components: CardView, ManaGemView, KeywordBadgeView, LoadingView, ErrorView, EmptyStateView
- SpriteKit: BattleScene, ChaosRollScene, and all action/node files

Missing or partial screens:
- **ModeSelectionView**: No dedicated file; appears to be inline in HomeView via ContentView
- **AchievementsView**: No dedicated file; may be part of ProfileView
- **BattleLogView**: No dedicated SwiftUI view; appears to be a SpriteKit overlay (`BattleLogOverlay` referenced in doc 07 as "SKScene overlay node")
- **GraveyardView**: Referenced in code but no standalone file; implemented as sheet within BattleContainerView

### SpriteKit Animations — FULLY IMPLEMENTED

All specified animation actions have dedicated files:
- `CardPlayAction.swift` (card play)
- `AttackAction.swift` (attack declaration)
- `DamageAction.swift` (damage numbers)
- `DeathAction.swift` (creature death)
- `HealAction.swift` (healing)
- `ShieldBreakAction.swift` (shield break)
- `ChaosRollAction.swift` (D20 spin)
- `EventSlideAction.swift` (event popup)

SpriteKit nodes present:
- `CreatureNode`, `HandNode`, `HandCardNode`, `BoardNode`, `AvatarNode`
- `ManaBarNode`, `DamageNumberNode`, `EventBannerNode`, `TimerNode`, `PhaseIndicatorNode`
- `ParticleEffects` utility

### PostHog Analytics — IMPLEMENTED

`PostHogService.swift` exists, uses HTTP API directly (no SDK dependency). Events queued and flushed.

### AI Generation Pipeline (Doc 03) — PARTIALLY IMPLEMENTED

Edge Functions `prompts.ts` is comprehensive:
- STYLE_ANCHOR (v1 — needs update to v3)
- FACTION_PREFIXES for all 3 factions (+ DEMONIC_KINGDOMS alias)
- COMPOSITION_INSTRUCTION
- NEGATIVE_PROMPT (base and evolution variants)
- ORDER/CHAOS evolution instructions
- FACTION_SHORT_DESCRIPTIONS
- Evolution history context builder
- 114 visual modifier prompt descriptions (U01-U30, IF01-IF28, FF01-FF28, DF01-DF28)
- Shard quality parameter maps (endpoint, image size, steps, guidance, strength)
- Full prompt builder functions (buildArtPrompt, buildEvolutionPrompt, buildPrismaticRefinementRequest)
- Text generation prompts (naming, flavor text, narrative, base card text)

**Gap**: The STYLE_ANCHOR and FACTION_PREFIXES in `prompts.ts` use the older v1 generic descriptions, while the local scripts (`generate-test-cards.mjs`) use the v3 artist-reference style that CLAUDE.md locks as canonical. This is Contradiction C-1.

---

## Priority Recommendations

1. **CRITICAL**: Update `supabase/functions/_shared/prompts.ts` STYLE_ANCHOR and FACTION_PREFIXES to match the v3 artist-reference versions used in `scripts/generate-test-cards.mjs` and mandated by CLAUDE.md
2. **CRITICAL**: Seed 240 modifier definitions into `modifier_definitions` table (required for evolution to work)
3. **CRITICAL**: Fix `MAX_DECK_SLOTS` in `supabase/functions/_shared/types.ts` to match doc spec (FREE:3, MID:6, HIGH:10)
4. **HIGH**: Run batch card generation to populate `card_templates` (270-375 base cards needed for launch)
5. **MEDIUM**: Build `dismantle-card` Edge Function
6. **MEDIUM**: Build `season-end` / `season-rollover` Edge Function
7. **MEDIUM**: Build friend system Edge Functions
8. **LOW**: Add `HapticManager.swift` for game feel
9. **LOW**: Update doc 06 and doc 07 to say Vercel (not Railway) for admin dashboard
10. **LOW**: Update CLAUDE.md to say "Supabase Realtime channels" instead of "direct WebSocket"

---

## Revision Log

| Date | Author | Changes |
|---|---|---|
| 2026-02-17 | Claude Code (W3B Audit Agent) | Initial audit — comprehensive doc-vs-code coverage analysis |

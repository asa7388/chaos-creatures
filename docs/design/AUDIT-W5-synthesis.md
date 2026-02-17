# AUDIT-W5: Synthesis & Prioritized Remediation Plan
**Date**: 2026-02-17
**Input**: 12 audit reports (W1A through W4C)

## Executive Summary
- Total unique findings: **78** (after deduplication from ~160 raw findings)
- **CRITICAL**: 13 (S-09 Taunt moved to LOW per owner decision)
- **HIGH**: 22
- **MEDIUM**: 28
- **LOW**: 15

The codebase is structurally complete — all four projects build, navigation paths exist, and core game loops are implemented. However, there are 14 critical issues that block either core gameplay, online play, security, or App Store submission. The most urgent cluster is the **WebSocket/Realtime action pipeline** (player actions are silently dropped by the game server), followed by **missing card play interaction in SpriteKit**, and **8 missing Edge Functions** the iOS client expects. Security issues in Edge Functions (unauthenticated cron endpoints, public player data exposure) and App Store blockers (no app icon, missing privacy manifest) round out the critical tier.

---

## All Findings (Prioritized)

### CRITICAL — Must Fix Before Proceeding

| ID | Title | Source | Files | Complexity |
|---|---|---|---|---|
| S-01 | Player actions silently dropped — missing player_id + wrong encoding | W3A | PlayerAction.swift, MatchService.swift, handler.ts | MEDIUM |
| S-02 | No card play interaction in battle UI | W1B | BattleScene.swift, BattleViewModel.swift | MEDIUM |
| S-03 | STATE_SNAPSHOT decoding failure on iOS | W3A | MatchEvent.swift, messages.ts | SMALL |
| S-04 | Card detail sheet shows blank data (not wired to selected card) | W1A, W3C, W4A | CollectionView.swift, CardDetailView.swift | SMALL |
| S-05 | 8 missing Edge Functions the iOS client calls | W3A | Multiple new files in supabase/functions/ | LARGE |
| S-06 | Spell resolution is a stub on game server | W2A | turn.ts:259-268 | MEDIUM |
| S-07 | Audio never triggered — BattleAudioManager disconnected from pipeline | W1B | BattleAudioManager.swift, all Action files | MEDIUM |
| S-08 | No audio asset files exist | W1B, W4C | Resources/Audio/ (empty) | MEDIUM |
| ~~S-09~~ | ~~Taunt forced-block~~ — **moved to LOW (post-launch per owner decision)** | W1B | BattleScene.swift | MEDIUM |
| S-10 | verifyServiceRole() 403 bug blocks content pipeline | W2B, W4C | _shared/auth.ts | SMALL |
| S-11 | Missing auth on monthly-rewards and refresh-daily-quests | W2B | monthly-rewards/index.ts, refresh-daily-quests/index.ts | SMALL |
| S-12 | Players table exposes all columns to all authenticated users | W2C | 00011 migration (RLS policy) | SMALL |
| S-13 | SECURITY DEFINER RPCs callable by any authenticated user | W2C | 00012_triggers.sql, 00014_chaos_energy_rpc.sql | SMALL |
| S-14 | App Store submission blockers (no icon, no privacy manifest, no entitlements, no team ID, no encryption key) | W4C | Info.plist, project.pbxproj, Assets.xcassets | MEDIUM |

#### S-01: Player Actions Silently Dropped — Missing player_id + Wrong Encoding
**Description**: The game server requires `player_id` in every `player_action` broadcast payload. The iOS `MatchService.sendAction()` uses the `Codable` overload which produces nested Swift enum encoding instead of the flat JSON the server's Zod schemas expect. Additionally, `player_id` is never injected. All online gameplay actions are silently dropped.
**Source audits**: W3A (C-01, C-02)
**Files**: `ChaosCreatures/ChaosCreatures/Models/PlayerAction.swift`, `ChaosCreatures/ChaosCreatures/Services/MatchService.swift:104`, `packages/game-server/src/ws/handler.ts:139-148`
**Fix complexity**: MEDIUM (2 files, ~30 min — switch to `jsonPayload` dictionary, inject player_id)
**Remediation**: Agent 6A

#### S-02: No Card Play Interaction in Battle UI
**Description**: No drag-to-play or tap-to-play from hand to board is wired up. During Main Phase, touching the SpriteKit scene does nothing. The SwiftUI hand has a double-tap gesture in `HandCardView` but the BattleScene's main phase touch handler is a no-op. Players cannot play cards to the board.
**Source audits**: W1B (CRITICAL-01)
**Files**: `ChaosCreatures/ChaosCreatures/SpriteKit/Scenes/BattleScene.swift`, `ChaosCreatures/ChaosCreatures/Services/BattleViewModel.swift`
**Fix complexity**: MEDIUM (2-3 files, 1-2 hours — implement tap-on-hand-card then tap-on-slot flow)
**Remediation**: Agent 6A

#### S-03: STATE_SNAPSHOT Decoding Failure on iOS
**Description**: The server sends `{ type: "STATE_SNAPSHOT", state: { ...fields... } }` but the iOS decoder tries to decode the entire object as `ClientGameState`, which expects fields at the top level, not nested under `state`. This means the client cannot receive initial game state or reconnect state.
**Source audits**: W3A (C-03)
**Files**: `ChaosCreatures/ChaosCreatures/Models/MatchEvent.swift:43-44`, `packages/game-server/src/types/messages.ts:99-102`
**Fix complexity**: SMALL (1 file, add a wrapper struct or change server to flatten)
**Remediation**: Agent 6A

#### S-04: Card Detail Sheet Shows Blank Data
**Description**: When a card is tapped in the Collection grid, `selectedCard` is set on the local state, but `CardDetailView` reads from `router.selectedCardInstance`, which is never set from the collection view. The sheet opens but shows nil data. This also blocks the evolution flow since the Evolve button is on CardDetailView.
**Source audits**: W1A (H6), W3C (FP-2, Issue #12), W4A (4.2)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Collection/CollectionView.swift:86-88`, `ChaosCreatures/ChaosCreatures/Views/Collection/CardDetailView.swift`
**Fix complexity**: SMALL (1-2 files, ~15 min — pass card binding or set router state)
**Remediation**: Agent 6A

#### S-05: 8 Missing Edge Functions the iOS Client Calls
**Description**: The iOS client calls 8 Edge Functions that do not exist: `player/ensure-profile` (blocks sign-up), `player/delete-account` (blocks GDPR), `player/card-counts`, `player/set-active-deck`, `economy/spend-dust`, `economy/claim-mission` (blocks mission rewards), `economy/match-rewards` (blocks post-match rewards), `match/history`.
**Source audits**: W3A (M-01 through M-08)
**Files**: 8 new `index.ts` files under `supabase/functions/`
**Fix complexity**: LARGE (8 new files, 3+ hours)
**Remediation**: Agent 6A

#### S-06: Spell Resolution is a Stub on Game Server
**Description**: The `handlePlayCard()` function handles CREATURE and STABILIZER placement but the SPELL branch only deducts mana and moves the card to graveyard — no spell effect is resolved. Any player deck with spells is broken.
**Source audits**: W2A (CRIT-01)
**Files**: `packages/game-server/src/engine/turn.ts:259-268`
**Fix complexity**: MEDIUM (1-2 files, 1-2 hours — implement spell effect resolution using existing `resolveEffect()`)
**Remediation**: Agent 6B

#### S-07: Audio Never Triggered — BattleAudioManager Disconnected
**Description**: `BattleAudioManager` has 17 SFX and adaptive music defined but `playSFX()` is never called from any Action file or BattleScene. `updateMusicState()` is also never called from the game loop. Battle is completely silent.
**Source audits**: W1B (CRITICAL-03, HIGH-06)
**Files**: `ChaosCreatures/ChaosCreatures/Services/BattleAudioManager.swift`, all files in `SpriteKit/Actions/`, `SpriteKit/Scenes/BattleScene.swift`
**Fix complexity**: MEDIUM (8+ files — add playSFX calls to each Action, wire updateMusicState to game loop)
**Remediation**: Deferred to Impl W3 (Audio Integration)

#### S-08: No Audio Asset Files Exist
**Description**: All `.wav`/`.caf` files referenced by the SFX enum are absent. The music stems directory is empty. The game will be completely silent until assets are sourced and added.
**Source audits**: W1B (CRITICAL-04), W4C (WARN 1)
**Files**: `ChaosCreatures/ChaosCreatures/Resources/Audio/` (does not exist), `ChaosCreatures/ChaosCreatures/Resources/Sounds/` (empty)
**Fix complexity**: MEDIUM (source/generate 18 SFX + 12 music stems)
**Remediation**: Deferred to Impl W3 (Audio Integration)

#### ~~S-09: Taunt Forced-Block Not Implemented in SpriteKit~~ — MOVED TO LOW
**Owner decision**: Taunt client-side enforcement deferred to post-launch. Server already enforces Taunt correctly; client will simply not show forced-block UI hints for now. Moved to LOW tier.

#### S-10: verifyServiceRole() 403 Bug Blocks Content Pipeline
**Description**: The raw string comparison of `Authorization` bearer token against `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` fails consistently in production. This blocks all 7 service-role-protected Edge Functions (batch-generate, generate-card-art, etc.). Root cause: JWT gateway transformation or key mismatch.
**Source audits**: W2B (C1), W4C (Known Bug)
**Files**: `supabase/functions/_shared/auth.ts:59-76`
**Fix complexity**: SMALL (1 file — decode JWT payload and check `role === "service_role"`)
**Remediation**: Agent 6A

#### S-11: Missing Auth on Cron Edge Functions
**Description**: `monthly-rewards` and `refresh-daily-quests` only check that an Authorization header exists but do not verify its value. Anyone can trigger monthly rewards or quest refresh by sending any Authorization header.
**Source audits**: W2B (C2, C3)
**Files**: `supabase/functions/monthly-rewards/index.ts:16`, `supabase/functions/refresh-daily-quests/index.ts:22`
**Fix complexity**: SMALL (2 files — add `verifyServiceRole(req)` call)
**Remediation**: Agent 6A

#### S-12: Players Table Exposes All Columns to All Users
**Description**: The "Public profile read" RLS policy uses `USING (true)`, allowing any authenticated user to read every player's `chaos_dust`, `shards`, `auth_id`, `friend_ids`, `subscription_tier`, and `settings` (including privacy flags). This is a data privacy violation.
**Source audits**: W2C (C2)
**Files**: Migration 00011 (RLS policies on players table)
**Fix complexity**: SMALL (1 migration — restrict public SELECT to display_name, season_rank, showcase_card_ids, or use a view)
**Remediation**: Agent 6A

#### S-13: SECURITY DEFINER RPCs Callable by Any Authenticated User
**Description**: `add_chaos_dust`, `add_shards`, and `increment_chaos_energy` are `SECURITY DEFINER` functions with no execution restrictions. Any authenticated user could call these via Supabase RPC to give themselves dust, shards, or energy.
**Source audits**: W2C (C4)
**Files**: `supabase/migrations/00012_triggers.sql`, `supabase/migrations/00014_chaos_energy_rpc.sql`
**Fix complexity**: SMALL (1 migration — REVOKE public execution, GRANT to service_role only)
**Remediation**: Agent 6A

#### S-14: App Store Submission Blockers
**Description**: Five items block App Store submission: (1) No app icon (empty AppIcon.appiconset), (2) No DEVELOPMENT_TEAM in project.pbxproj, (3) Missing `ITSAppUsesNonExemptEncryption` in Info.plist, (4) Missing `PrivacyInfo.xcprivacy` manifest, (5) No `.entitlements` file for StoreKit 2 IAP.
**Source audits**: W4C (BLOCKER 1-5)
**Files**: `ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/AppIcon.appiconset/`, `ChaosCreatures/ChaosCreatures.xcodeproj/project.pbxproj`, Info.plist
**Fix complexity**: MEDIUM (5 items across multiple files, 1-2 hours)
**Remediation**: Deferred to Impl W7 (App Store Prep)

---

### HIGH — Should Fix

| ID | Title | Source | Files | Complexity |
|---|---|---|---|---|
| S-15 | Tutorial match not implemented (onboarding steps 3-6 missing) | W1A | New files: TutorialBattleView.swift, etc. | LARGE |
| S-16 | Timer not shown in SwiftUI battle HUD | W1A | BattleContainerView.swift | SMALL |
| S-17 | Matchmaking event name casing mismatch (MATCH_FOUND vs match_found) | W1C, W3A | MatchmakingService.swift | SMALL |
| S-18 | Chaos events C6 and C8 have game logic bugs | W2A | events.ts:206-221, 306-311 | SMALL |
| S-19 | Event resolution auto-fires before player choice (O2/O5) + handler stub | W2A | turn.ts:440-449, handler.ts:277-279 | MEDIUM |
| S-20 | Mulligan not implemented | W2A | handler.ts:273-275 | MEDIUM |
| S-21 | No Apple JWS verification on sync-entitlements | W2B | sync-entitlements/index.ts:72 | MEDIUM |
| S-22 | No evolution job processor — pending jobs never execute | W2B | Pipeline gap | MEDIUM |
| S-23 | Faction filter stubbed out in Collection (TODO) | W1A, W3C | CollectionView.swift | SMALL |
| S-24 | Deck builder cannot load existing deck data | W3C | DeckBuilderView.swift | MEDIUM |
| S-25 | Deck builder layout breaks on phones (split view too narrow) | W1A, W3C | DeckBuilderView.swift | MEDIUM |
| S-26 | StoreKit product ID mismatch (sub vs subscription) | W1C | StoreKitService.swift | SMALL |
| S-27 | Duplicate/conflicting RollResult vs ChaosRollOutcome enums | W1C | Enums.swift, BattleCard.swift | SMALL |
| S-28 | save-deck UPDATE sends ID in body, server reads from query param | W3A | CollectionService.swift, save-deck/index.ts | SMALL |
| S-29 | Missing economy purchase endpoints (specific card, shard, avatar) | W1C | EconomyService.swift | MEDIUM |
| S-30 | Card detail missing abilities, modifiers, and sticky action buttons | W1A | CardDetailView.swift | MEDIUM |
| S-31 | HP bars simplified to text in battle HUD | W1A | BattleContainerView.swift | MEDIUM |
| S-32 | Battle log not implemented | W1A | New file: BattleLogOverlay | MEDIUM |
| S-33 | D20 shape is hexagon (6 sides) instead of 20-sided polygon | W1B | ChaosRollAction.swift | SMALL |
| S-34 | Event banner has no tap-to-dismiss | W1B | EventBannerNode.swift | SMALL |
| S-35 | Timer urgent threshold is 10s, spec says 15s | W1B | TimerNode.swift | SMALL |
| S-36 | FactionMastery entity has no storage anywhere | W2C | New migration | MEDIUM |

#### S-15: Tutorial Match Not Implemented
**Description**: The guided tutorial battle (onboarding steps 3-6) is entirely missing. New players are released into the game without learning mechanics — instability, chaos roll, mana, combat, evolution. This will cause catastrophic churn for new users.
**Source audits**: W1A (C1), W3C (FP-1, FP-6)
**Files**: New files needed (TutorialBattleView, TutorialOverlayView, scripted AI)
**Fix complexity**: LARGE (5+ files, 3+ hours — scripted tutorial battle with overlay guidance)
**Remediation**: Agent 6C

#### S-16: Timer Not Shown in SwiftUI Battle HUD
**Description**: `TimerNode` exists in SpriteKit, but the SwiftUI HUD overlay does not display time remaining. Players have no visible countdown during their turns. The game server will timeout players who don't know they have a timer.
**Source audits**: W1A (C2)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Battle/BattleContainerView.swift`
**Fix complexity**: SMALL (1 file — add TimerBarView to SwiftUI HUD)
**Remediation**: Agent 6C

#### S-17: Matchmaking Event Name Casing Mismatch
**Description**: iOS listens for `"MATCH_FOUND"` (uppercase) but the game server/doc 06 specifies `"match_found"` (lowercase). If the casing doesn't match, players stay in queue forever.
**Source audits**: W1C (H-4), W3A (implicit)
**Files**: `ChaosCreatures/ChaosCreatures/Services/MatchmakingService.swift`
**Fix complexity**: SMALL (1 file, 1 line — verify actual server event name and align)
**Remediation**: Agent 6A

#### S-18: Chaos Events C6 and C8 Have Game Logic Bugs
**Description**: C6 (Chaos Siphon) targets two different random creatures for damage and buff instead of the same creature. C8 (Overcharge) missing "already has Piercing = +4 ATK instead" special case (marked "simplification" in code).
**Source audits**: W2A (CRIT-02, CRIT-03)
**Files**: `packages/game-server/src/engine/events.ts:206-221, 306-311`
**Fix complexity**: SMALL (1 file, 30 min — fix targeting for C6, add Piercing check for C8)
**Remediation**: Agent 6B

#### S-19: Event Resolution Auto-Fires Before Player Choice (O2/O5)
**Description**: `executeAutomaticPhases()` resolves events immediately before checking if player choice is needed. Combined with the CHOOSE_EVENT_TARGET handler being a no-op, O2 (Planar Ward) and O5 (Fortify) always auto-target the leftmost creature, removing player agency.
**Source audits**: W2A (HIGH-01, HIGH-04)
**Files**: `packages/game-server/src/engine/turn.ts:440-449`, `packages/game-server/src/ws/handler.ts:277-279`
**Fix complexity**: MEDIUM (2 files — check choice requirement before resolving, implement handler)
**Remediation**: Agent 6B

#### S-20: Mulligan Not Implemented
**Description**: The MULLIGAN action type exists in the schema but the handler is a no-op. No GAME_SETUP phase exists where mulligan would occur. Players cannot mulligan bad opening hands.
**Source audits**: W2A (HIGH-02)
**Files**: `packages/game-server/src/ws/handler.ts:273-275`, `packages/game-server/src/engine/turn.ts`
**Fix complexity**: MEDIUM (2-3 files — add setup phase with mulligan window)
**Remediation**: Agent 6B

#### S-21: No Apple JWS Verification on sync-entitlements
**Description**: Subscription upgrades are accepted without cryptographic verification of Apple's JWS transaction. A malicious client could send fake transaction data to upgrade their subscription for free.
**Source audits**: W2B (H1)
**Files**: `supabase/functions/sync-entitlements/index.ts:72`
**Fix complexity**: MEDIUM (1 file — add JWS verification or App Store Server API v2 validation)
**Remediation**: Agent 6B

#### S-22: No Evolution Job Processor
**Description**: `start-evolution` creates PENDING generation jobs but nothing processes them. `generate-evolution-art` and `generate-card-text` exist but are never triggered. Evolution art will never be generated in production.
**Source audits**: W2B (C4)
**Files**: `supabase/functions/start-evolution/index.ts` or new worker function
**Fix complexity**: MEDIUM (1-2 files — have start-evolution directly call generation functions, or add job poller)
**Remediation**: Agent 6B

#### S-23: Faction Filter Stubbed Out in Collection
**Description**: FactionTabBar exists but faction filtering is commented out with TODO: "Filter by faction once CardInstance includes faction data." Tapping faction tabs changes underline but doesn't filter cards.
**Source audits**: W1A (H3), W3C (FP-3, Issue #11)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Collection/CollectionView.swift`
**Fix complexity**: SMALL (1 file — implement filter using card_templates join or denormalized faction_id)
**Remediation**: Agent 6C

#### S-24: Deck Builder Cannot Load Existing Deck Data
**Description**: Tapping an existing deck opens DeckBuilderView but it always starts fresh — deck ID is passed as a destination parameter but the view does not accept or fetch existing deck data.
**Source audits**: W3C (FP-4, Issue #17)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Collection/DeckBuilderView.swift`
**Fix complexity**: MEDIUM (1-2 files — accept deck ID, fetch and populate existing data)
**Remediation**: Agent 6C

#### S-25: Deck Builder Layout Breaks on Phones
**Description**: Always shows 55/45 split view. On iPhone portrait (390pt), card pool gets 214pt and deck list gets 176pt — both too narrow. Spec calls for segmented picker switching between panels on phone.
**Source audits**: W1A (M3), W3C (FP-9, Issue #19)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Collection/DeckBuilderView.swift`
**Fix complexity**: MEDIUM (1 file — add `@Environment(\.horizontalSizeClass)` and segmented picker for compact)
**Remediation**: Agent 6C

#### S-26: StoreKit Product ID Mismatch
**Description**: Swift uses `com.chaoscreatures.sub.mid/high` but doc 06 defines `com.chaoscreatures.subscription.mid/high`. Wrong IDs will cause product loading to fail entirely.
**Source audits**: W1C (C-1)
**Files**: `ChaosCreatures/ChaosCreatures/Services/StoreKitService.swift`
**Fix complexity**: SMALL (1 file — align product IDs with App Store Connect)
**Remediation**: Agent 6A

#### S-27: Duplicate RollResult vs ChaosRollOutcome Enums
**Description**: `RollResult` uses lowercase raw values while `ChaosRollOutcome` uses UPPER_CASE. If the server sends UPPER_CASE, `RollResult` will fail to decode.
**Source audits**: W1C (C-2)
**Files**: `ChaosCreatures/ChaosCreatures/Models/Enums.swift`, `ChaosCreatures/ChaosCreatures/Models/BattleCard.swift`
**Fix complexity**: SMALL (2 files — remove one enum, use UPPER_CASE everywhere)
**Remediation**: Agent 6A

#### S-28: save-deck UPDATE Sends ID in Body, Server Reads from Query Param
**Description**: The Edge Function reads deck ID from `url.searchParams.get("id")`, but the iOS client sends it in the POST body via `.invoke()`. Deck updates always fail.
**Source audits**: W3A (C-04)
**Files**: `supabase/functions/save-deck/index.ts:27`, `ChaosCreatures/ChaosCreatures/Services/CollectionService.swift:140-176`
**Fix complexity**: SMALL (1 file — add body.id fallback in Edge Function)
**Remediation**: Agent 6A

#### S-29: Missing Economy Purchase Endpoints
**Description**: Three economy purchase operations from doc 06 are not implemented in Swift: purchase specific card with dust, purchase shards with dust (client doesn't call existing `purchase-shards` EF), purchase avatars with dust.
**Source audits**: W1C (H-1)
**Files**: `ChaosCreatures/ChaosCreatures/Services/EconomyService.swift`
**Fix complexity**: MEDIUM (1 file — add methods calling existing or new Edge Functions)
**Remediation**: Agent 6B

#### S-30: Card Detail Missing Abilities, Modifiers, and Sticky Action Buttons
**Description**: Players cannot see their card's triggered abilities or applied modifiers on the detail view. The sticky bottom bar with Evolve/Add to Deck/More menu (Favorite, Dismantle, Share) is missing.
**Source audits**: W1A (H5, H6)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Collection/CardDetailView.swift`
**Fix complexity**: MEDIUM (1 file — add sections and sticky bottom bar)
**Remediation**: Agent 6C

#### S-31: HP Bars Simplified to Text in Battle HUD
**Description**: Spec calls for animated HPBarView with fill, damage flash, and shake. Implementation shows "X/Y" text. HP changes are invisible during combat.
**Source audits**: W1A (H1)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Battle/BattleContainerView.swift`
**Fix complexity**: MEDIUM (1-2 files — build HPBarView component, replace text display)
**Remediation**: Agent 6C

#### S-32: Battle Log Not Implemented
**Description**: No way to review what happened in a turn. During complex combat with multiple attackers/blockers, players lose track of events.
**Source audits**: W1A (H2, M3)
**Files**: New file: BattleLogOverlay (SKNode or SwiftUI sheet)
**Fix complexity**: MEDIUM (1-2 new files)
**Remediation**: Agent 6C

#### S-33: D20 Shape is Hexagon
**Description**: D20 is drawn as a 6-sided polygon instead of a many-sided polygon as specced. The spec explicitly states "20-sided regular polygon."
**Source audits**: W1B (HIGH-02)
**Files**: `ChaosCreatures/ChaosCreatures/SpriteKit/Actions/ChaosRollAction.swift`
**Fix complexity**: SMALL (1 file — change polygon sides from 6 to 20)
**Remediation**: Agent 6B

#### S-34: Event Banner Has No Tap-to-Dismiss
**Description**: Spec requires "tap anywhere on overlay calls dismiss()." The banner only auto-dismisses after 2.5s hold. Players cannot skip events.
**Source audits**: W1B (HIGH-03)
**Files**: `ChaosCreatures/ChaosCreatures/SpriteKit/Nodes/EventBannerNode.swift`
**Fix complexity**: SMALL (1 file — set isUserInteractionEnabled, implement touchesBegan)
**Remediation**: Agent 6B

#### S-35: Timer Urgent Threshold is 10s, Spec Says 15s
**Description**: Timer turns red at 10 seconds remaining. Doc 01 and doc 07 both specify 15 seconds.
**Source audits**: W1B (HIGH-04)
**Files**: `ChaosCreatures/ChaosCreatures/SpriteKit/Nodes/TimerNode.swift`
**Fix complexity**: SMALL (1 file — change `urgentThreshold` from 10 to 15)
**Remediation**: Agent 6B

#### S-36: FactionMastery Entity Has No Storage
**Description**: Doc 02 defines `FactionMastery` with `faction_id`, `mastery_level`, `mastery_xp`, `games_played` per faction. This is not stored anywhere. The `update-mastery` Edge Function hacks it into `economy_config` which won't scale.
**Source audits**: W2C (H1), W2B (H5)
**Files**: New migration needed (faction_mastery table), `supabase/functions/update-mastery/index.ts`
**Fix complexity**: MEDIUM (new migration + update EF)
**Remediation**: Agent 6B

---

### MEDIUM — Fix If Time Permits

| ID | Title | Source | Files | Complexity |
|---|---|---|---|---|
| S-37 | Graveyard sheet not implemented in battle | W1A, W4A | BattleContainerView.swift | MEDIUM |
| S-38 | Achievements screen is placeholder Text() | W1A, W3C, W4A | ContentView.swift, new AchievementsView.swift | MEDIUM |
| S-39 | Evolution ceremony collapsed (9 steps -> 5) | W1A | EvolutionFlowView.swift | LARGE |
| S-40 | Deck builder missing mana curve visualization | W1A | DeckBuilderView.swift | MEDIUM |
| S-41 | Hand cards use placeholder art in battle | W1A | BattleContainerView.swift (HandCardView) | SMALL |
| S-42 | Avatars use placeholder everywhere | W1A, W3C | HomeView, ProfileView, BattleContainerView | SMALL |
| S-43 | Collection filter panel missing (only search exists) | W1A | CollectionView.swift, new FilterPanelView | MEDIUM |
| S-44 | Practice match requires valid deck but new players have none | W3C | MatchmakingView.swift | SMALL |
| S-45 | Post-match rewards hardcoded, not from server | W3C | PostMatchView.swift, BattleContainerView.swift | MEDIUM |
| S-46 | Missing auto-reconnect on WebSocket disconnect | W1C | MatchService.swift | MEDIUM |
| S-47 | O8 Harmonize event timing bug (healed creatures get +0/+1 too) | W2A | events.ts:296-304 | SMALL |
| S-48 | Non-atomic player stat updates in complete-evolution | W2B | complete-evolution/index.ts:185-204 | SMALL |
| S-49 | R2 upload broken in generate-card-art (signature mismatch) | W2B | generate-card-art/index.ts | MEDIUM |
| S-50 | R2 path mismatch for evolution art | W2B | generate-evolution-art/index.ts | SMALL |
| S-51 | Decks RLS policy missing WITH CHECK (insert bypass) | W2C | New migration | SMALL |
| S-52 | Multiple TEXT columns lack CHECK constraints | W2C | New migration | MEDIUM |
| S-53 | Seed SQL claims idempotency but is not idempotent | W2C | supabase/seed.sql | SMALL |
| S-54 | Edge Function name inconsistencies vs doc 06 | W1C | Multiple service files | SMALL |
| S-55 | AppState mission filter column mismatch | W1C | AppState.swift:86 | SMALL |
| S-56 | STYLE_ANCHOR divergence (v1 in Edge Functions vs v3 in scripts) | W3B | prompts.ts | SMALL |
| S-57 | MAX_DECK_SLOTS mismatch (types.ts vs seed.sql) | W3B, W4B | _shared/types.ts | SMALL |
| S-58 | Zero accessibility support (no VoiceOver, no Dynamic Type) | W4A | All 25+ view files | LARGE |
| S-59 | Modifier selection doesn't enforce universal/faction composition ratio | W4B | start-evolution/index.ts:134-138 | SMALL |
| S-60 | 40+ hardcoded hex colors in SpriteKit (should use SK.Colors) | W4A | Multiple SpriteKit node files | MEDIUM |
| S-61 | Inconsistent horizontal padding across screens | W4A | Multiple view files | SMALL |
| S-62 | 0 of 240 modifier definitions seeded | W3B | supabase/seed.sql | LARGE |
| S-63 | 0 base card templates seeded | W3B | supabase/seed.sql, batch generation | LARGE |
| S-64 | No card dismantle system | W3B, W1C | New EF + UI | MEDIUM |

#### S-37: Graveyard Sheet Not Implemented in Battle
**Description**: `PlayerHUDView` has an `onGraveyard` callback and graveyard count display, but no `.sheet` modifier to present a graveyard view. Players cannot view destroyed creatures during battle.
**Source audits**: W1A (M2, C3), W4A (4.1)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Battle/BattleContainerView.swift`, new GraveyardSheet view
**Fix complexity**: MEDIUM
**Remediation**: Agent 6C

#### S-38: Achievements Screen is Placeholder
**Description**: `ProfileDestination.achievements` routes to `Text("Achievements")` — bare text with no content. Players can reach this screen and see nothing useful.
**Source audits**: W1A (M1), W3C (DE-1), W4A (3.1)
**Files**: `ChaosCreatures/ChaosCreatures/App/ContentView.swift:73`, new `AchievementsView.swift`
**Fix complexity**: MEDIUM
**Remediation**: Agent 6C

#### S-39: Evolution Ceremony Collapsed
**Description**: 9-step spec reduced to ~5 steps. Missing: SpriteKit loading animation (dissolve/materialize), iris wipe art reveal, name selection from 2-3 options, separate ability reveal, flavor text typewriter, detailed final summary with share button.
**Source audits**: W1A (H4)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Evolution/EvolutionFlowView.swift`
**Fix complexity**: LARGE (significant animation work)
**Remediation**: Deferred to Impl W5 (Evolution Polish)

#### S-40: Deck Builder Missing Mana Curve Visualization
**Description**: DeckStatsSummaryBar with mana curve chart, attunement bar, avg instability not implemented. Only simple card count shown.
**Source audits**: W1A (M2)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Collection/DeckBuilderView.swift`
**Fix complexity**: MEDIUM
**Remediation**: Agent 6C

#### S-41: Hand Cards Use Placeholder Art in Battle
**Description**: HandCardView shows faction-colored rectangles instead of card art via AsyncImage. Players can't visually recognize cards.
**Source audits**: W1A (M4)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Battle/BattleContainerView.swift`
**Fix complexity**: SMALL (replace color rectangle with AsyncImage/CachedCardArt)
**Remediation**: Agent 6C

#### S-42: Avatars Use Placeholder Everywhere
**Description**: Home, Profile, and Battle HUD all use SF Symbol placeholder circles instead of AsyncImage avatars with faction-themed borders.
**Source audits**: W1A (M5), W3C (Issue #41)
**Files**: HomeView.swift, ProfileView.swift, BattleContainerView.swift
**Fix complexity**: SMALL (replace placeholders with AsyncImage + faction border)
**Remediation**: Deferred to Impl W1 (Visual Assets)

#### S-43: Collection Filter Panel Missing
**Description**: With potentially 100+ cards, players can only search by name. Cannot filter by card type, tier, mana cost, keywords, attunement, or evolution-ready status.
**Source audits**: W1A (H3)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Collection/CollectionView.swift`, new FilterPanelView
**Fix complexity**: MEDIUM
**Remediation**: Agent 6C

#### S-44: Practice Match Requires Valid Deck but New Players Have None
**Description**: New player who just completed onboarding has zero decks. The error message says "Build a deck first" but provides no navigation to the deck builder.
**Source audits**: W3C (FP-5, Issues #20-21)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Battle/MatchmakingView.swift`
**Fix complexity**: SMALL (add "Build a Deck" button in error state that navigates to Decks tab)
**Remediation**: Agent 6C

#### S-45: Post-Match Rewards Hardcoded, Not from Server
**Description**: XP, Dust, and Energy values in PostMatchView are hardcoded constants, not actual server-computed rewards.
**Source audits**: W3C (Issue #29)
**Files**: `ChaosCreatures/ChaosCreatures/Views/Battle/PostMatchView.swift`, `BattleContainerView.swift`
**Fix complexity**: MEDIUM (depends on economy/match-rewards Edge Function existing)
**Remediation**: Agent 6C

#### S-46: Missing Auto-Reconnect on WebSocket Disconnect
**Description**: No auto-reconnect with exponential backoff. Doc 06 specifies `maxReconnectAttempts = 5`. A temporary network glitch permanently disconnects the player.
**Source audits**: W1C (M-5)
**Files**: `ChaosCreatures/ChaosCreatures/Services/MatchService.swift`
**Fix complexity**: MEDIUM
**Remediation**: Agent 6B

#### S-47: O8 Harmonize Event Timing Bug
**Description**: Code heals all creatures 2 HP, then checks which are at full HP for +0/+1. Creatures healed TO full HP incorrectly also get the +0/+1 bonus.
**Source audits**: W2A (HIGH-03)
**Files**: `packages/game-server/src/engine/events.ts:296-304`
**Fix complexity**: SMALL (record full-HP creatures before heal, only apply +0/+1 to those)
**Remediation**: Agent 6B

#### S-48: Non-Atomic Player Stat Updates in complete-evolution
**Description**: Read-then-write on `cards_evolved_total` and `highest_tier_reached`. Two concurrent evolutions could lose an increment.
**Source audits**: W2B (H3)
**Files**: `supabase/functions/complete-evolution/index.ts:185-204`
**Fix complexity**: SMALL (use .rpc() for atomic increment)
**Remediation**: Agent 6B

#### S-49: R2 Upload Broken in generate-card-art
**Description**: Presigned URL approach signs headers that aren't sent in the actual upload request. Signature mismatch causes upload failure.
**Source audits**: W2B (H4)
**Files**: `supabase/functions/generate-card-art/index.ts`
**Fix complexity**: MEDIUM (switch to header-based signing like batch-generate)
**Remediation**: Agent 6B

#### S-50: R2 Path Mismatch for Evolution Art
**Description**: Stores to `cards/{faction}/{rarity}/...` instead of `evolution/{player_id}/{card_instance_id}/step-{n}.webp` as specified.
**Source audits**: W2B (H6)
**Files**: `supabase/functions/generate-evolution-art/index.ts`
**Fix complexity**: SMALL (fix path template)
**Remediation**: Agent 6B

#### S-51: Decks RLS Policy Missing WITH CHECK
**Description**: The `FOR ALL` policy on decks only has `USING` but no `WITH CHECK`. A player could INSERT a deck with `owner_id` belonging to another player.
**Source audits**: W2C (H3)
**Files**: New migration
**Fix complexity**: SMALL
**Remediation**: Agent 6A

#### S-52: Multiple TEXT Columns Lack CHECK Constraints
**Description**: `shard_transactions.shard_tier`, `shard_transactions.source`, `missions.mission_type`, `players.season_rank`, `players.highest_tier_reached`, `match_records` rank columns all accept arbitrary text.
**Source audits**: W2C (C3, H4, H5, M1-M3, M8)
**Files**: New migration
**Fix complexity**: MEDIUM (1 migration, many ALTER TABLE ADD CONSTRAINT)
**Remediation**: Agent 6A

#### S-53: Seed SQL Not Idempotent
**Description**: Claims idempotency in header but has no `ON CONFLICT DO NOTHING` clauses. Running seed twice fails on PK violations.
**Source audits**: W2C (H6)
**Files**: `supabase/seed.sql`
**Fix complexity**: SMALL (add ON CONFLICT DO NOTHING to all INSERTs)
**Remediation**: Agent 6A

#### S-54: Edge Function Name Inconsistencies vs Doc 06
**Description**: Multiple Edge Function names in Swift don't match doc 06 paths (join-queue vs POST /matchmaking/queue, etc.). Not a bug since client and server must agree, but documentation is stale.
**Source audits**: W1C (M-8)
**Files**: Documentation updates
**Fix complexity**: SMALL
**Remediation**: Documentation only — defer

#### S-55: AppState Mission Filter Column Mismatch
**Description**: Mission filter uses `("completed", "false")` but actual DB column is `"is_completed"`. Query may return wrong results.
**Source audits**: W1C (M-7)
**Files**: `ChaosCreatures/ChaosCreatures/App/AppState.swift:86`
**Fix complexity**: SMALL (1 line fix)
**Remediation**: Agent 6A

#### S-56: STYLE_ANCHOR Divergence (v1 in Edge Functions vs v3 in Scripts)
**Description**: Edge Functions `prompts.ts` uses v1 generic style anchor. Local scripts use v3 artist-reference style. CLAUDE.md mandates v3. Cards generated via Edge Functions will look different from test cards.
**Source audits**: W3B (C-1)
**Files**: `supabase/functions/_shared/prompts.ts`
**Fix complexity**: SMALL (copy v3 anchor from scripts to prompts.ts)
**Remediation**: Deferred to Impl W1 (Visual Assets)

#### S-57: MAX_DECK_SLOTS Mismatch
**Description**: `_shared/types.ts` has FREE:4, MID:6, HIGH:8. Seed.sql and Swift have FREE:3, MID:6, HIGH:10. Code disagrees with design spec.
**Source audits**: W3B (C-3), W4B (3.2)
**Files**: `supabase/functions/_shared/types.ts`
**Fix complexity**: SMALL (1 file — align to 3/6/10)
**Remediation**: Agent 6A

#### S-58: Zero Accessibility Support
**Description**: No `accessibilityLabel`, `accessibilityHint`, `accessibilityValue`, or Dynamic Type support anywhere. VoiceOver users cannot use the app. Apple may reject.
**Source audits**: W4A (Section 7)
**Files**: All 25+ SwiftUI view files
**Fix complexity**: LARGE (systematic effort across entire UI)
**Remediation**: Deferred to Impl W6 (Accessibility)

#### S-59: Modifier Selection Doesn't Enforce Composition Ratio
**Description**: Design doc specifies structured composition (1U+1F / 1U+2F / 2U+2F) but code uses random shuffle-and-slice from combined pool.
**Source audits**: W4B (Risk Item #1)
**Files**: `supabase/functions/start-evolution/index.ts:134-138`
**Fix complexity**: SMALL (1 file — separate universal and faction queries, enforce ratio)
**Remediation**: Agent 6B

#### S-60: 40+ Hardcoded Hex Colors in SpriteKit
**Description**: SpriteKit node files use inline `UIColor(hex:)` instead of `SK.Colors` constants. Plus `SK.Colors.background` is `.black` (#000000) not `#0D0D0D`.
**Source audits**: W4A (Section 1.2, 9.5)
**Files**: CreatureNode.swift, HandCardNode.swift, BoardNode.swift, EventBannerNode.swift, AvatarNode.swift, ParticleEffects.swift, BattleScene.swift, etc.
**Fix complexity**: MEDIUM (mechanical replacement across 10+ files)
**Remediation**: Deferred to Impl W2 (Card Rendering)

#### S-61: Inconsistent Horizontal Padding
**Description**: Screens use 6/8/12/16/20pt horizontal padding inconsistently. ShopView missing 80pt bottom padding.
**Source audits**: W4A (Section 2)
**Files**: CollectionView, DeckBuilderView, PostMatchView, MatchmakingView, ShopView
**Fix complexity**: SMALL (mechanical fixes)
**Remediation**: Deferred to Impl W4 (UI Polish)

#### S-62: 0 of 240 Modifier Definitions Seeded
**Description**: The `modifier_definitions` table exists with correct schema but has zero rows. Evolution cannot work without modifier options.
**Source audits**: W3B (MF-1)
**Files**: `supabase/seed.sql` (needs 240 INSERT statements)
**Fix complexity**: LARGE (240 definitions to create with balanced stats)
**Remediation**: Deferred to content pipeline (separate effort)

#### S-63: 0 Base Card Templates Seeded
**Description**: The `card_templates` table has zero rows in seed data. The batch generation pipeline exists but has only produced 9 test cards locally.
**Source audits**: W3B (MF-2)
**Files**: Batch generation pipeline
**Fix complexity**: LARGE (270-375 cards to generate)
**Remediation**: Deferred to content pipeline (separate effort)

#### S-64: No Card Dismantle System
**Description**: Doc 02 describes dismantling cards for shards. The enum value exists but no Edge Function or UI. Players cannot recycle unwanted cards.
**Source audits**: W3B (MF-3), W1C (H-5)
**Files**: New Edge Function + CardDetailView update
**Fix complexity**: MEDIUM
**Remediation**: Agent 6B

---

### LOW — Post-Launch

| ID | Title | Source | Complexity |
|---|---|---|---|
| S-09 | Taunt forced-block UI in SpriteKit (server enforces, client deferred) | W1B | MEDIUM |
| S-65 | No haptic feedback anywhere in app | W1B, W3B, W4A | MEDIUM |
| S-66 | Keywords use plain colored squares instead of icons in SpriteKit | W1B | SMALL |
| S-67 | Profile missing showcase cards and active title | W1A | SMALL |
| S-68 | Upgrade prompt view not implemented (monetization conversion) | W1A | MEDIUM |
| S-69 | Card flip interaction missing on card detail | W1A | MEDIUM |
| S-70 | No long-press context menus on collection cards | W1A | SMALL |
| S-71 | Post-match missing "Play Again" button | W1A, W3C | SMALL |
| S-72 | No hand size limit enforced on game server | W2A | SMALL |
| S-73 | No deck-out / fatigue condition | W2A | SMALL |
| S-74 | Bot cannot play spells | W2A | SMALL |
| S-75 | Friend system Edge Functions not implemented | W3B | LARGE |
| S-76 | Season end/rollover Edge Function missing | W3B | MEDIUM |
| S-77 | Settings changes are local-only (not synced to server) | W3C | SMALL |
| S-78 | SettingsView uses .large title (all others use .inline) | W4A | SMALL |

---

## Remediation Agent Assignments

### Agent 6A: Critical Bug Fixer
**Scope**: S-01, S-03, S-04, S-05, S-10, S-11, S-12, S-13, S-17, S-26, S-27, S-28, S-51, S-52, S-53, S-55, S-57
**Estimated findings**: 17
**Key files**:
- iOS: PlayerAction.swift, MatchService.swift, MatchEvent.swift, CollectionView.swift, MatchmakingService.swift, StoreKitService.swift, Enums.swift, BattleCard.swift, AppState.swift
- Edge Functions: _shared/auth.ts, monthly-rewards/index.ts, refresh-daily-quests/index.ts, save-deck/index.ts, _shared/types.ts, 8 new Edge Function files
- Database: 2 new migrations (RLS fixes, CHECK constraints, RPC permissions)
- Supabase: seed.sql (idempotency)

**Priority order**:
1. S-01 (player actions dropped — blocks ALL online play)
2. S-03 (STATE_SNAPSHOT decode — blocks game state sync)
3. S-04 (card detail blank — blocks core inspect/evolve flow)
4. S-10 (verifyServiceRole — blocks content pipeline)
5. S-11 (cron auth — security)
6. S-12, S-13 (database security)
7. S-05 (missing Edge Functions — blocks sign-up, rewards, GDPR)
8. S-17, S-26, S-27, S-28 (various mismatches)
9. S-51, S-52, S-53, S-55, S-57 (database/config cleanup)

### Agent 6B: Gameplay Gap Fixer
**Scope**: S-02, S-06, S-18, S-19, S-20, S-21, S-22, S-29, S-33, S-34, S-35, S-36, S-46, S-47, S-48, S-49, S-50, S-59, S-64
**Estimated findings**: 19 (S-09 Taunt deferred to post-launch)
**Key files**:
- Game Server: turn.ts, events.ts, handler.ts, combat.ts (spell resolution, event bugs, mulligan, event choice)
- iOS SpriteKit: BattleScene.swift, ChaosRollAction.swift, EventBannerNode.swift, TimerNode.swift
- Edge Functions: sync-entitlements, start-evolution, complete-evolution, generate-card-art, generate-evolution-art
- Database: New faction_mastery table migration

**Priority order**:
1. S-02 (card play interaction — blocks ALL gameplay)
2. S-06 (spell resolution — blocks spell cards)
3. ~~S-09~~ (Taunt forced-block — deferred to post-launch per owner decision)
4. S-18 (C6/C8 event bugs)
5. S-19 (event choice pipeline)
6. S-22 (evolution job processor)
7. S-20 (mulligan)
8. S-21 (JWS verification)
9. Remaining items in priority order

### Agent 6C: UX Gap Fixer
**Scope**: S-15, S-16, S-23, S-24, S-25, S-30, S-31, S-32, S-37, S-38, S-40, S-41, S-43, S-44, S-45
**Estimated findings**: 15
**Key files**:
- iOS Views: BattleContainerView.swift, CollectionView.swift, DeckBuilderView.swift, CardDetailView.swift, PostMatchView.swift, MatchmakingView.swift
- New files: AchievementsView.swift, GraveyardSheet, BattleLogOverlay, HPBarView, FilterPanelView, TutorialBattleView

**Priority order**:
1. S-23 (faction filter — core collection feature)
2. S-24 (deck builder edit — core deck management)
3. S-25 (deck builder phone layout)
4. S-16 (timer in HUD)
5. S-31 (HP bars)
6. S-30 (card detail actions)
7. S-44 (matchmaking no-deck error)
8. S-41 (hand card art)
9. S-37, S-38 (graveyard, achievements)
10. S-15 (tutorial — LARGE effort, may defer)
11. Remaining items

---

## Items Deferred to Implementation Pipeline

These findings will be addressed by the planned Implementation Waves (Impl W1-W7) and should NOT be separately remediated:

| Finding | Covered By | Impl Wave |
|---|---|---|
| S-07: Audio never triggered | Impl W3 — Audio Integration (wire SFX into animation pipeline) | W3 |
| S-08: No audio assets | Impl W3 — Audio Integration (source/generate SFX + music) | W3 |
| S-39: Evolution ceremony collapsed | Impl W5 — Evolution Polish (expand to 9-step flow) | W5 |
| S-42: Avatars use placeholder everywhere | Impl W1 — Visual Assets (generate avatar art, replace placeholders) | W1 |
| S-56: STYLE_ANCHOR divergence | Impl W1 — Visual Assets (update prompts.ts to v3) | W1 |
| S-58: Zero accessibility support | Impl W6 — Accessibility (systematic VoiceOver + Dynamic Type) | W6 |
| S-60: Hardcoded SpriteKit colors | Impl W2 — Card Rendering Overhaul (consolidate to SK.Colors) | W2 |
| S-61: Inconsistent padding | Impl W4 — UI Polish (standardize spacing) | W4 |
| S-14: App Store blockers | Impl W7 — App Store Prep (icon, privacy, entitlements, team ID) | W7 |
| S-62: 0 modifier definitions | Content Pipeline — separate batch generation effort | Content |
| S-63: 0 card templates | Content Pipeline — separate batch generation effort | Content |
| S-65: No haptic feedback | Impl W3 — Audio Integration (add HapticManager) | W3 |
| S-66: Keyword colored squares | Impl W1 — Visual Assets (generate keyword icons) | W1 |

---

## Cross-Reference: Audit Source to Finding ID

For traceability, here is the mapping from each audit report's findings to synthesis IDs:

| Audit | Key Findings -> Synthesis ID |
|---|---|
| **W1A** (UI Screens) | C1->S-15, C2->S-16, C3->S-37, H1->S-31, H2->S-32, H3->S-23/S-43, H4->S-39, H5/H6->S-30, M1->S-38, M2->S-40, M3->S-25, M4->S-41, M5->S-42 |
| **W1B** (SpriteKit) | CRIT-01->S-02, CRIT-02->deferred, CRIT-03->S-07, CRIT-04->S-08, CRIT-05->S-09, HIGH-01->S-65, HIGH-02->S-33, HIGH-03->S-34, HIGH-04->S-35, HIGH-05->S-09, HIGH-06->S-07 |
| **W1C** (Services) | C-1->S-26, C-2->S-27, H-1->S-29, H-2->deferred, H-3->deferred, H-4->S-17, H-5->S-64, M-5->S-46, M-7->S-55, M-8->S-54 |
| **W2A** (Game Server) | CRIT-01->S-06, CRIT-02->S-18, CRIT-03->S-18, HIGH-01->S-19, HIGH-02->S-20, HIGH-03->S-47, HIGH-04->S-19, MED-01->S-74, MED-04->S-72, MED-05->S-73 |
| **W2B** (Edge Functions) | C1->S-10, C2->S-11, C3->S-11, C4->S-22, H1->S-21, H3->S-48, H4->S-49, H5->S-36, H6->S-50, H8->deferred |
| **W2C** (Database) | C1->merged into S-52, C2->S-12, C3->S-52, C4->S-13, H1->S-36, H3->S-51, H4/H5->S-52, H6->S-53 |
| **W3A** (API Contract) | C-01/C-02->S-01, C-03->S-03, C-04->S-28, M-01..M-08->S-05 |
| **W3B** (Doc Coverage) | C-1->S-56, C-3->S-57, MF-1->S-62, MF-2->S-63, MF-3->S-64, MF-5->S-65 |
| **W3C** (Player Experience) | FP-1->S-15, FP-2->S-04, FP-3->S-23, FP-4->S-24, FP-5->S-44, FP-9->S-25, Issue #29->S-45 |
| **W4A** (UX Polish) | Section 7->S-58, Section 8->deferred(fonts), Section 1.2->S-60, Section 2->S-61, 3.1->S-38, 4.2->S-04 |
| **W4B** (Monetization) | Risk #1->S-59, 3.2->S-57 |
| **W4C** (Build Readiness) | BLOCKER 1-5->S-14, WARN 1->S-08, WARN 2->deferred, WARN 3->deferred(fonts) |

---

## Revision Log

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-17 | Claude Code (Opus 4.6) | Initial synthesis of 12 audit reports into 78 deduplicated findings |

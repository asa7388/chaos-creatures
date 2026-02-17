# AUDIT-W3C: Player Experience Audit
**Date**: 2026-02-17
**Auditor**: Claude Code (Audit Agent W3C)
**Scope**: Complete player journey through all iOS app screens, services, and navigation

---

## Summary

| Metric | Count |
|---|---|
| Journey steps tested | 11/11 |
| Dead ends found | 5 |
| Missing loading states | 3 |
| Missing error states | 7 |
| Missing empty states | 2 |
| Friction points | 14 |

**Overall Assessment**: The app has a solid structural foundation -- every major screen exists, navigation paths are defined, and the core loops (play, collect, evolve, buy) are implemented. However, there are significant gaps that would frustrate or confuse a real player: faction filtering is stubbed out, the card detail sheet ignores the selected card in the collection grid, the deck builder has no error state for failed loads, there is no tutorial explaining game mechanics, and several flows have missing confirmation dialogs or feedback. The app is at a functional prototype stage, not yet polished enough for a paying player.

---

## Navigation Graph

```
[App Launch]
    |
    v
[Splash Screen] ---- isInitializing=true
    |
    v (isInitializing=false)
[Sign In Screen] ---- !isAuthenticated
    |                   - "Sign in with Apple" button
    |                   - "Dev Mode" button (DEBUG only)
    v (isAuthenticated + needsOnboarding)
[Onboarding Flow]
    |-- [Intro Cinematic] (5 panels, skip button, tap/auto-advance)
    |-- [Faction Picker] (3 swipeable cards, "Choose" button)
    |-- [Ready to Play] ("Start Playing" button)
    |
    v (hasCompletedOnboarding)
[Main TabView] --- 5 tabs ---
    |
    |-- Tab 1: HOME
    |     |-- Player greeting + rank
    |     |-- PLAY button -> [Mode Selection]
    |     |     |-- Ranked -> [Matchmaking Sheet]
    |     |     |-- Casual -> [Matchmaking Sheet]
    |     |     |-- Practice -> [Matchmaking Sheet]
    |     |           |-> [Battle (fullscreen)] -> [Post-Match (fullscreen)]
    |     |-- Daily Missions (display only)
    |     |-- Quick Stats
    |     |-- Settings (toolbar)
    |
    |-- Tab 2: COLLECTION
    |     |-- Faction tab bar (All / Ironwright / Fey / Demonic)
    |     |-- Search toggle
    |     |-- Card grid -> tap -> [Card Detail Sheet]
    |     |     |-- Evolve Now button -> [Evolution Flow Sheet]
    |     |-- Empty state -> "Visit Shop" button
    |     |-- Settings (toolbar)
    |
    |-- Tab 3: DECKS
    |     |-- Deck list -> tap -> [Deck Builder]
    |     |-- "Create New Deck" -> [Deck Builder]
    |     |-- Empty state -> "Create Deck" button
    |     |-- Settings (toolbar)
    |
    |-- Tab 4: PROFILE
    |     |-- Player card (avatar, name, faction, sub tier)
    |     |-- Season rank + LP
    |     |-- Battle statistics
    |     |-- Faction mastery (hardcoded Lv. 0, 0% progress)
    |     |-- Achievements link -> [Placeholder Text]
    |     |-- Settings (toolbar)
    |
    |-- Tab 5: SHOP
          |-- Currency header (Dust + Shards)
          |-- Subscription cards -> [Subscription Sheet]
          |-- Card packs -> [Pack Opening Sheet]
          |-- Planar Shards (info only, no actions)
          |-- Settings (toolbar)

[Evolution Flow Sheet]
    |-- Loading -> Modifier Picker -> Confirming/Generating -> Reveal -> Continue

[Battle (fullscreen)]
    |-- SpriteKit scene + SwiftUI HUD
    |-- Hand cards, mana, HP, action buttons
    |-- Surrender dialog
    |-- Connection lost overlay
    |-> [Post-Match (fullscreen)] -> "Continue" -> back to TabView
```

---

## Journey Walkthrough

### Step 1: First Launch

**What happens**: App shows animated splash screen (sparkles icon + "Chaos Creatures" text + spinner) while `AppState.initialize()` runs. It restores the auth session and loads player data. Once `isInitializing` goes false, AppRouter determines the root screen.

**Issues**:
1. **P2 - No network error on splash**: If `restoreSession()` or `loadPlayerData()` fails on splash, the user sees no error. The app silently transitions to sign-in. If the network is down, the player has no idea why they are being asked to sign in again.
2. **P3 - Splash has no timeout**: If `initialize()` hangs (e.g., Supabase unreachable), the splash screen shows indefinitely with no indication of a problem and no retry mechanism.
3. **P1 - Sign In screen legal links point to non-existent URLs**: `https://chaoscreatures.app/terms` and `https://chaoscreatures.app/privacy` -- these pages are listed as "not done" in the build state. Tapping these links opens Safari to a dead URL.

### Step 2: Faction Selection

**What happens**: After signing in, if `needsOnboarding` is true (player has no primaryFactionId), the onboarding flow begins. It has 3 steps: intro cinematic (5 lore panels with auto-advance or tap-to-advance, skip button), faction picker (swipeable cards with faction name, mechanic badge, description, keywords, "Choose" button), and "Ready to Play" confirmation.

**Issues**:
4. **P2 - No confirmation before faction commit**: Tapping "Choose Ironwright" immediately fires `commitFaction()` with no "Are you sure?" dialog. The design doc states faction selection is permanent for the starter deck. A misclick permanently locks the player.
5. **P1 - commitFaction calls a non-standard Edge Function path**: The code calls `player/commit-faction` with `factionId: faction.rawValue`, but `FactionShortName.rawValue` is a string like `"IRONWRIGHT"`, not a UUID. The Edge Function likely expects a UUID faction_id. This may fail silently and leave the player stuck on onboarding.
6. **P3 - Intro cinematic auto-advance races with tap-advance**: `startAutoAdvance()` creates a new Task each panel, but if the user taps rapidly, multiple auto-advance tasks stack up and can advance panels unpredictably.
7. **P2 - No loading indicator during faction commit**: After tapping "Choose", the `commitFaction()` function runs an async call but shows no spinner or disabled state on the button. The player could tap multiple times.

### Step 3: Home Screen

**What happens**: After onboarding or session restore, the main TabView appears with 5 tabs. The Home tab shows: player greeting with avatar placeholder (SF Symbol, no real avatar), rank badge, play button (NavigationLink to mode selection), daily missions, and quick stats.

**Issues**:
8. **P2 - "Cards" stat tile shows totalGames instead of card count**: Line 155 in HomeView.swift shows `appState.player?.totalGames` under the "Cards" label with a `rectangle.stack.fill` icon. This is misleading -- it should show the actual number of cards owned.
9. **P3 - Level calculation is naive**: `player.playerXp / 100` assumes 100 XP per level. The design doc (04-progression-economy.md) specifies escalating XP curves. This will show wrong levels at higher XP values.
10. **P3 - No pull-to-refresh indicator feedback**: `.refreshable` is implemented, which is good, but the player greeting always shows "Welcome back, Player" if player data fails to load. There is no error indication for partial load failures.

### Step 4: Collection Browse

**What happens**: The Collection tab shows a faction tab bar (All/Ironwright/Fey/Demonic), a search toggle with text field, and a card grid. Loading, error, and empty states are all implemented.

**Issues**:
11. **P1 - Faction filter is completely stubbed out**: In `filteredCards` (line 180-183), the faction filter section has a TODO comment and does nothing: `_ = selectedFaction`. Tapping faction tabs visually selects them but never filters the cards. This is a core feature gap.
12. **P1 - Card detail sheet ignores the tapped card**: When a card is tapped in the grid, `selectedCard` is set on the local state, but `CardDetailView` reads from `router.selectedCardInstance`, which is never set from the collection view. The sheet opens but shows blank/nil data for every field. The card detail view says "// In a real implementation, the card would be passed in or fetched" -- it was never wired up.
13. **P3 - No sort options**: Players cannot sort by mana cost, tier, attack, health, or recency. Only search by name is available.
14. **P2 - Collection loads with `player_id` filter but data model uses `owner_id`**: `loadCards()` uses filter `("player_id", playerId.uuidString)` but `CollectionService.fetchCollection()` uses `("owner_id", ...)`. If the Supabase column is `owner_id`, the collection view's direct query will return 0 results.

### Step 5: Deck Builder

**What happens**: The Decks tab shows a list of saved decks with a "Create New Deck" button. Tapping a deck or creating a new one navigates to the deck builder, which has a split view: card pool on the left (55% width), deck list on the right (45%). Cards are tapped to add, swiped to remove. Save button in the toolbar.

**Issues**:
15. **P2 - Deck builder has no error state for failed card loading**: `loadAvailableCards()` sets `self.error` on failure but the view never displays it. The `error` state variable is declared but not used in the body. The player sees an empty card pool with no explanation.
16. **P2 - No deck deletion capability**: DeckListView has no swipe-to-delete or long-press delete. `CollectionService.deleteDeck()` exists but is never called from any view. Players can create decks but cannot delete them.
17. **P2 - Deck builder does not load existing deck data**: When editing an existing deck (`DecksDestination.deckBuilder(deck.id)`), the deck ID is passed to the destination enum, but `DeckBuilderView` does not accept or use a deck ID parameter. It always starts with an empty "New Deck". Editing an existing deck is impossible.
18. **P3 - No avatar selection in deck builder**: `CollectionService.createDeck()` requires an `avatarId` parameter, but the deck builder UI has no avatar picker. The save function hardcodes the player's primary faction ID and does not pass an avatar at all.
19. **P1 - Split view layout breaks on phones**: The 55/45 split with a divider assumes landscape or tablet. On an iPhone in portrait, both panels are too narrow to be usable. Cards in the 80-100px grid items will be cramped in a ~200px wide panel.

### Step 6: First Practice Match

**What happens**: From Home -> PLAY -> Mode Selection -> Practice, the matchmaking sheet opens. For practice mode, it skips the normal queue and calls `matchmakingService.startPracticeMatch(deckId:)` which POSTs to the game server at `/api/practice/start`. On success, it navigates to the battle fullscreen cover.

**Issues**:
20. **P1 - Practice match requires a valid deck but new players have none**: `joinQueue()` and `startPractice()` both fetch a valid deck via `filters: [("is_valid", "true")]`. A brand-new player who just completed onboarding has zero decks. The error message "No valid deck found. Build a deck first." is correct but there is no navigation to the deck builder from this error state. The player must dismiss the sheet and manually find the Decks tab.
21. **P2 - "No valid deck" error state has no CTA button**: When the deck fetch returns empty, `joinError` is set but the error view only has a "Try Again" button (which will fail again) and no "Build a Deck" button.
22. **P2 - Auto-selected deck**: The matchmaking flow auto-selects the first valid deck without letting the player choose which deck to use. If they have multiple decks, they cannot pick one.

### Step 7: Battle Flow

**What happens**: `BattleContainerView` hosts a SpriteKit scene with a SwiftUI HUD overlay. The HUD shows opponent HP/hand/deck/instability at the top, player HP/mana/deck/graveyard/surrender at the bottom, hand cards in a horizontal scroll view, and a phase-dependent primary action button.

**Issues**:
23. **P2 - No tutorial or help during battle**: A first-time player sees the battlefield with no explanation of phases, how to play cards (double-tap), how combat works, what the chaos roll means, or what any of the icons represent. There is no tutorial overlay, no help button, no tooltip system.
24. **P2 - No turn/phase indicator in SwiftUI HUD**: The `PhaseIndicatorNode` exists in SpriteKit, but the SwiftUI overlay does not show what phase it is. The player relies entirely on the SpriteKit scene rendering, which may be obscured by the HUD overlay.
25. **P3 - Hand card names truncated to 8 characters**: `Text(card.name.prefix(8))` makes cards like "Iron Sentinel" show as "Iron Sen", making it hard to distinguish similar cards.
26. **P2 - No undo for card play**: Double-tapping a hand card plays it immediately. There is no drag-to-play, no confirmation, and no undo. Misplays are permanent.
27. **P3 - Connection lost overlay has no timeout/dismiss**: `ConnectionLostOverlay` shows "Reconnecting..." indefinitely. If the server is truly unreachable, the player is stuck with no way to return to the main screen except force-quitting the app.

### Step 8: Match End

**What happens**: When `currentPhase` becomes `.gameOver`, `handleGameOver()` waits 1.5 seconds, disconnects, and calls `router.dismissBattle()` which sets `showBattle=false` and `showPostMatch=true`. PostMatchView shows as a fullscreen cover with animated reveals: result banner, match stats, rewards, continue button.

**Issues**:
28. **P2 - PostMatchView matchResult data is never passed**: `BattleContainerView` builds a `matchResult` struct but never passes it to PostMatchView. The PostMatchView fetches match record from Supabase via `MatchService.shared.fetchMatchRecord()`. If the server hasn't persisted the record yet (race condition), `isVictory` defaults to false and all stats show 0.
29. **P2 - Rewards are hardcoded, not from server**: XP (+25/+10), Dust (+5/+2), and Energy (+2/+1) are hardcoded in both BattleContainerView and PostMatchView. Actual server-computed rewards may differ, especially with subscription bonuses, season multipliers, or quest completions.
30. **P3 - No "Play Again" button on post-match**: After tapping "Continue", the player returns to the Home tab. If they want to play again immediately, they must tap PLAY -> choose mode -> wait for matchmaking again. A "Play Again" shortcut would reduce friction significantly.
31. **P2 - Mission progress not shown after match**: PostMatchView does not show which daily missions advanced or completed from this match. The player must go back to Home to check mission progress.

### Step 9: Evolution

**What happens**: From CardDetailView, if a card has `isEvolutionReady`, an "Evolve Now" button appears. Tapping it calls `router.navigateToEvolution(card)` which presents EvolutionFlowView as a sheet. The flow: loading -> modifier picker (2/3/4 options based on sub tier) with channel direction (Order/Chaos) -> confirm -> generating (with staged progress: art, text, modifiers) -> reveal with dramatic animation.

**Issues**:
32. **P1 - Evolution flow is unreachable for most players due to CardDetailView bug**: Since card detail does not receive the tapped card (Issue #12), the evolution button never appears. Even if it did, the player must: open Collection (1 tap), find a card with enough energy (scroll), tap it (1 tap), scroll to evolution section, tap "Evolve Now" (1 tap) -- 3 taps minimum if the card detail worked.
33. **P3 - No evolution-ready indicator on Home screen**: There is no notification, badge, or alert telling players when a card is evolution-ready. They must manually browse their collection to find eligible cards.
34. **P2 - Channel direction picker in modifier selection is confusing**: The Order/Chaos toggle is presented during modifier selection, but the relationship between channel direction and modifier attunement is not explained. A new player will not understand what "Channel Direction" means.

### Step 10: Shop

**What happens**: The Shop tab shows: currency header (Chaos Dust + shard counts), subscription tier cards (horizontal scroll), card packs (Starter 100 Dust, Rare 250, Epic 500), and a Planar Shards info section. Tapping a subscription card opens SubscriptionView as a sheet. Tapping a pack triggers CardPackOpeningView.

**Issues**:
35. **P2 - Card pack opening does not pass the selected pack type**: `CardPackOpeningView` receives a `packType` parameter, but `CollectionService.openPack()` only takes a `factionId` -- it does not accept the pack type. All packs may open as the same type regardless of which one the player selects.
36. **P3 - No purchase confirmation for card packs**: Tapping the dust price button immediately triggers `openPack()`. No "Are you sure you want to spend 250 Dust?" dialog. Accidental taps spend resources.
37. **P3 - Shard section is purely informational**: The "Planar Shards" section shows text about shards but has no actions. Players cannot trade shards, use shards, or see shard details. The section feels incomplete.
38. **P2 - Pack opening shows no new-card indicators**: When cards are revealed from a pack, there is no "NEW" badge to indicate if the player already has copies. Duplicate management is invisible.

### Step 11: Profile / Settings

**What happens**: The Profile tab shows player card (avatar placeholder, name, faction badge, sub tier), season rank with LP and W/L record, battle statistics grid, faction mastery progress bars, and an achievements link. Settings (accessible from every tab's toolbar gear icon) has sections for account, audio, visuals, gameplay, notifications, privacy, and about.

**Issues**:
39. **P1 - Achievements page is a placeholder**: `ProfileDestination.achievements` navigates to `Text("Achievements")` -- a plain text label with no content. This is a dead end.
40. **P2 - Faction mastery progress bars are all hardcoded to 0**: In ProfileView, all three faction mastery bars use `width: geometry.size.width * 0.0` and show "Lv. 0". The mastery system is not wired to any data.
41. **P2 - Faction badge in ProfileView likely never shows**: It tries to create a `FactionShortName` from `factionId.uuidString`, but FactionShortName raw values are strings like "IRONWRIGHT", not UUIDs. `FactionShortName(rawValue: factionId.uuidString)` will always return nil.
42. **P3 - Settings changes are local-only**: Audio, visual, gameplay, and notification settings use `@AppStorage` but are never synced to the server's `player.settings` field. If the player reinstalls or uses a new device, all settings are lost.
43. **P3 - "Export My Data" has no visual feedback during export**: The function is async but shows no loading spinner. The toast appears only on completion or failure.
44. **P2 - Delete Account has no loading state**: Tapping "Delete Forever" calls `deleteAccount()` which is async, but the confirmation dialog dismisses immediately. If the network call takes time, the player may think nothing happened and the app may behave unpredictably.

---

## Dead Ends

| # | Screen/Action | Description |
|---|---|---|
| DE-1 | Profile -> Achievements | Navigates to `Text("Achievements")` -- a plain text view with no content, no back context |
| DE-2 | Collection -> Card Grid -> Tap Card | CardDetailView opens but shows no data (router.selectedCardInstance is nil) |
| DE-3 | Connection Lost in Battle | ConnectionLostOverlay shows indefinitely with no dismiss/cancel option |
| DE-4 | Matchmaking "No valid deck" error | Error text shown but no navigation to deck builder; "Try Again" will fail again |
| DE-5 | Deck Builder edit mode | Tapping an existing deck opens DeckBuilderView but it starts fresh -- no existing data loaded |

---

## Missing States

| Screen | Loading State | Error State | Empty State |
|---|---|---|---|
| SplashView | Has spinner | **MISSING** (network failure silent) | N/A |
| SignInView | Has spinner + disabled button | Has error text | N/A |
| OnboardingView (faction commit) | **MISSING** (no spinner during commit) | Has toast error | N/A |
| HomeView | Pull-to-refresh | **MISSING** (appState.error not displayed) | N/A (always has content) |
| DailyMissionsView | N/A | **MISSING** (no error for mission load) | Has "All complete" state |
| CollectionView | Has LoadingView | Has ErrorView | Has EmptyStateView |
| CardDetailView | N/A (inline) | **MISSING** (no handling for nil card data) | N/A |
| DeckListView | Has LoadingView | Has ErrorView | Has EmptyStateView |
| DeckBuilderView | Has loading overlay | **MISSING** (error declared but not displayed) | Has "Tap cards to add" |
| MatchmakingView | Has searching animation | Has error view + retry | N/A |
| BattleContainerView | Connection overlay | Connection overlay | N/A |
| PostMatchView | Has loading spinner | Has error view + continue | N/A |
| EvolutionFlowView | Has loading view | Has error view + retry | N/A |
| ShopView | N/A (static) | **MISSING** (no error handling) | N/A |
| CardPackOpeningView | Has purchasing spinner | Has error alert | N/A |
| SubscriptionView | Has purchase spinner | Has error alert | N/A |
| ProfileView | Pull-to-refresh | **MISSING** (profile load error not shown) | N/A |
| SettingsView | N/A | **MISSING** (sign out/delete error not shown) | N/A |

**Summary**: 3 missing loading states (splash error, faction commit spinner, export data). 7 missing error states (splash, home, missions, card detail nil, deck builder load error, shop, profile).

---

## Friction Points

| # | Severity | Location | Description |
|---|---|---|---|
| FP-1 | HIGH | Onboarding | No tutorial explaining core game mechanics (instability, chaos roll, evolution, mana system) |
| FP-2 | HIGH | Collection -> Detail | Card detail sheet shows blank data -- the core "inspect your card" flow is broken |
| FP-3 | HIGH | Collection | Faction filter tabs are non-functional (stubbed TODO) |
| FP-4 | HIGH | Deck Builder | Cannot edit existing decks -- always starts fresh |
| FP-5 | HIGH | First Match | New player has no deck, error message gives no navigation to fix it |
| FP-6 | MEDIUM | Battle | No tutorial, help, or onboarding for first battle |
| FP-7 | MEDIUM | Battle | Double-tap to play card is not discoverable (no instruction) |
| FP-8 | MEDIUM | Faction Selection | No confirmation dialog -- one tap permanently selects faction |
| FP-9 | MEDIUM | Deck Builder | Split view layout unusable on iPhone portrait |
| FP-10 | MEDIUM | Post-Match | No "Play Again" shortcut |
| FP-11 | MEDIUM | Evolution | Channel direction picker unexplained |
| FP-12 | MEDIUM | Pack Opening | No purchase confirmation before spending Dust |
| FP-13 | LOW | Home | "Cards" stat shows totalGames (mislabeled) |
| FP-14 | LOW | Hand Cards | Names truncated to 8 characters |

---

## Tap Count Analysis

| Action | Taps from Home | Route | Acceptable? |
|---|---|---|---|
| Start a practice match | 3 | Home -> PLAY -> Practice -> (auto-join) | Yes |
| Start a ranked match | 3 | Home -> PLAY -> Ranked -> (auto-join) | Yes |
| View collection | 1 | Tab: Collection | Yes |
| View a specific card | 2 | Tab: Collection -> Tap card | Yes (but broken -- shows blank) |
| Evolve a card | 4+ | Tab: Collection -> Tap card -> Scroll -> "Evolve Now" | Borderline (and currently broken) |
| Build a new deck | 2 | Tab: Decks -> "Create Deck" | Yes |
| Edit an existing deck | 2 | Tab: Decks -> Tap deck | Yes (but broken -- starts fresh) |
| Open a card pack | 2 | Tab: Shop -> Tap pack price | Yes |
| View subscription options | 2 | Tab: Shop -> Tap upgrade button | Yes |
| View profile/stats | 1 | Tab: Profile | Yes |
| Access settings | 2 | Any tab -> Gear icon | Yes |
| Check daily missions | 0 | Home screen (visible) | Yes |
| View achievements | 2 | Tab: Profile -> Achievements | Dead end (placeholder) |

---

## Critical Path Issues (Prioritized Fix List)

### Must Fix Before Beta (P1)

1. **Wire CardDetailView to receive the selected card** -- CollectionView sets `selectedCard` but CardDetailView reads `router.selectedCardInstance`. Either pass the card as a binding/parameter or set `router.selectedCardInstance` before presenting the sheet.

2. **Implement faction filtering in CollectionView** -- Remove the TODO stub and filter cards by faction. This requires the card instances to carry faction data (either join with card_templates or store faction_id on card_instances).

3. **Fix deck builder to load existing deck data** -- Pass the deck ID to DeckBuilderView. On appear, if a deck ID is provided, fetch the existing deck and populate `deckName` and `deckCards`.

4. **Add "Build a Deck" navigation from matchmaking error** -- When "No valid deck found", show a button that dismisses the sheet and navigates to the Decks tab or directly to DeckBuilderView.

5. **Fix faction commit in onboarding** -- Verify the Edge Function `player/commit-faction` accepts the faction short name string, or convert it to the correct faction UUID before sending.

6. **Fix DeckBuilderView layout for phone portrait** -- Switch from side-by-side split to a tabbed or segmented layout (e.g., a picker switching between "Card Pool" and "My Deck" views) on compact width.

7. **Fix Collection `player_id` vs `owner_id` column mismatch** -- Ensure the filter column matches the actual Supabase column name.

### Should Fix Before Launch (P2)

8. Add a faction commit confirmation dialog in onboarding.
9. Add a loading spinner during faction commit.
10. Fix the "Cards" stat tile to show actual card count.
11. Display the DeckBuilderView load error.
12. Add deck deletion (swipe-to-delete on DeckListView).
13. Add deck selection before matchmaking (let player choose which deck).
14. Add a battle tutorial overlay for first-time players.
15. Add a turn/phase indicator to the SwiftUI HUD.
16. Show mission progress changes on PostMatchView.
17. Add a "Play Again" button to PostMatchView.
18. Add a purchase confirmation dialog for card packs.
19. Wire faction mastery data to ProfileView progress bars.
20. Fix faction badge display in ProfileView (UUID vs string mismatch).
21. Add loading/error states for account deletion.
22. Fix `openPack()` to pass the selected pack type.

### Nice to Have (P3)

23. Add sort options to CollectionView (mana cost, tier, name, recency).
24. Add evolution-ready notifications on the Home screen.
25. Explain channel direction in the modifier picker.
26. Fix auto-advance race condition in intro cinematic.
27. Fix XP level calculation to use proper progression curves.
28. Add timeout/dismiss to ConnectionLostOverlay.
29. Increase hand card name display from 8 to 12+ characters.
30. Sync settings to server for cross-device persistence.
31. Add "NEW" badge to pack-opened cards for duplicate awareness.
32. Build the Achievements screen.

---

## Revision Log

| Date | Author | Changes |
|---|---|---|
| 2026-02-17 | Claude Code (W3C Audit Agent) | Initial audit -- full player journey trace across all 11 steps |

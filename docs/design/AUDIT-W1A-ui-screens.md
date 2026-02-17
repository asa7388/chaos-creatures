# Audit W1A: UI Screen Completeness

**Auditor**: Claude Code (Automated)
**Date**: 2026-02-17
**Spec Source**: `docs/design/07-ui-ux-specs.md` v3.0
**Master Design**: `docs/design/00-game-design-master.md`

---

## Summary

- **Screens specced in doc 07**: 17 (including sub-screens and modals)
- **Screens implemented**: 13
- **Screens missing entirely**: 4
- **Screens partial (missing significant elements)**: 6

| Category | Count |
|----------|-------|
| COMPLETE | 7 |
| PARTIAL | 6 |
| MISSING | 4 |

---

## Screen-by-Screen Audit

### 1. Home Screen

- **Status**: PARTIAL
- **File**: `ChaosCreatures/ChaosCreatures/Views/Home/HomeView.swift`
- **Specced elements**:
  - Player greeting with avatar, name, rank
  - Play button (NavigationLink to Mode Selection)
  - Daily missions section
  - Quick stats section
  - Settings gear in toolbar
  - Pull-to-refresh
- **Implemented elements**:
  - Player greeting with placeholder avatar (Circle + SF Symbol, not AsyncImage from CDN), name, rank badge
  - Play button (NavigationLink to HomeDestination.modeSelection)
  - DailyMissionsView embedded
  - Quick stats (Wins, Cards, Dust)
  - Settings gear in toolbar
  - Pull-to-refresh via `.refreshable`
- **Missing elements**:
  - Avatar uses placeholder circle instead of AsyncImage with CDN URL and faction-themed border per spec
  - No "Evolution Ready" card carousel / notification section specced in doc 00
  - No season progress indicator
- **Loading state**: NO (no explicit loading state; data comes from AppState which loads on init)
- **Error state**: NO (no error handling for failed data loads on this screen)
- **Empty state**: N/A (always has player greeting and play button)
- **Animations**: Play button has gradient background. No entry animations specced.
- **Notes**: Functional but missing avatar CDN integration and lacks loading/error states.

---

### 2. Collection Screen

- **Status**: PARTIAL
- **File**: `ChaosCreatures/ChaosCreatures/Views/Collection/CollectionView.swift`
- **Specced elements**:
  - FactionTabBar (4 tabs: All, Ironwright, Fey Courts, Demonic)
  - FilterBar with search toggle and filter button
  - Card grid (LazyVGrid with adaptive columns)
  - Card grid items with tier badge, evolution-ready badge, mana cost, favorite star
  - Filter Panel sheet (card type, tier, mana cost range, attunement, keywords, special toggles)
  - Empty state per faction
  - Long-press context menu on cards
  - Settings gear in toolbar
- **Implemented elements**:
  - FactionTabBar with 4 tabs, animated underline
  - FilterBar with search toggle (no filter button -- only magnifying glass)
  - Card grid (LazyVGrid adaptive columns)
  - Card grid items (CardGridItemView) with tier badge, evolution-ready badge, mana cost
  - Empty state with action to navigate to shop
  - Settings gear in toolbar
  - Loading state (LoadingView)
  - Error state (ErrorView with retry)
  - Search filtering
- **Missing elements**:
  - **Filter button and FilterPanelView sheet** -- specced extensively in doc 07 Section 5.1 but NOT implemented. Only search exists.
  - **Favorite star** on card grid items not implemented
  - **Long-press context menu** on collection cards not implemented (spec: Evolve / Add / Favorite)
  - **Faction filter logic** is stubbed with TODO comment: "Filter by faction once CardInstance includes faction data"
  - **Sort option** not present
- **Loading state**: YES
- **Error state**: YES
- **Empty state**: YES
- **Animations**: Faction tab switch animates underline. Search bar slides in.
- **Notes**: Filter panel is a significant omission. Without it, players cannot filter by card type, tier, mana cost, keywords, or evolution-ready status. Faction filtering is also TODO.

---

### 3. Card Detail Screen

- **Status**: PARTIAL
- **File**: `ChaosCreatures/ChaosCreatures/Views/Collection/CardDetailView.swift`
- **Specced elements**:
  - Hero art with gradient overlay and card name
  - Stats row (ATK, HP, CM, INS) with dividers
  - Keywords horizontal scroll with KeywordChipView
  - Triggered abilities section
  - Modifiers section
  - Evolution history timeline
  - Energy progress bar
  - Games played count
  - Flavor text italic
  - Sticky bottom buttons: Evolve (gold, pulsing), Add to Deck, More menu (Favorite, Dismantle, Share Screenshot)
  - Card flip interaction (swipe up for lore/history 3D flip)
  - Full screen cover to EvolutionFlowView
- **Implemented elements**:
  - Card art section with AsyncImage and placeholder
  - Card info: name, mana cost, tier badge, flavor text
  - Stats section (ATK, HP, INST) -- missing CM (mana cost) as separate stat; mana cost shown in info section instead
  - Keywords section with KeywordRowView
  - Evolution progress bar with energy display
  - Evolve button (triggers router.navigateToEvolution)
  - Evolution history section with tier timeline
  - Close button in toolbar
- **Missing elements**:
  - **Sticky bottom buttons** (Evolve, Add to Deck, More menu) -- spec has sticky overlay at bottom; implementation only has Evolve inline in evolution section
  - **"Add to Deck" button** entirely missing
  - **More menu** (Favorite, Dismantle, Share Screenshot) entirely missing
  - **Card flip interaction** (3D rotation for lore/history back face) not implemented
  - **Triggered abilities section** not implemented (spec shows AbilityRowView for each triggered ability)
  - **Modifiers section** not implemented (spec shows ModifierRowView for each modifier)
  - **Games played count** not shown
  - **Hero art gradient overlay** with name at bottom-left not implemented (simpler layout used)
- **Loading state**: NO
- **Error state**: NO
- **Empty state**: N/A
- **Animations**: Evolution button triggers router navigation. No card flip animation.
- **Notes**: Missing several important interactive elements. The sticky bottom bar with Evolve/Add to Deck/More menu is a significant UX gap. Card flip is a polish item. Missing abilities and modifiers display means players cannot inspect the card's full game state.

---

### 4. Deck List Screen (Decks Tab Root)

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Collection/DeckListView.swift`
- **Specced elements**:
  - List of player decks with name, card count, valid badge, faction icon
  - Create new deck button (dashed border)
  - Deck slot counter
  - Settings gear in toolbar
  - Plus button in toolbar
  - Navigation to DeckBuilder
- **Implemented elements**:
  - Deck list with DeckRowView (faction icon, name, card count, VALID badge, chevron)
  - Create new deck button with dashed border
  - Deck slot counter ("/X slots")
  - Settings gear and plus button in toolbar
  - Navigation via DecksDestination.deckBuilder
- **Missing elements**: None significant
- **Loading state**: YES
- **Error state**: YES
- **Empty state**: YES (with "Create Deck" action)
- **Notes**: Well-implemented. Matches spec closely.

---

### 5. Deck Builder Screen

- **Status**: PARTIAL
- **File**: `ChaosCreatures/ChaosCreatures/Views/Collection/DeckBuilderView.swift`
- **Specced elements**:
  - Deck name text field
  - Faction selector row
  - Avatar selector row
  - DeckStatsSummaryBar (mana curve, attunement bar, avg instability, card count)
  - Panel tab switch (Deck Contents / Card Pool) on phone layout
  - Side-by-side layout (DeckContentsPanel + CardPoolPanel) on tablet
  - Card pool grid with search
  - Deck list with swipe-to-remove
  - Max 2 copies per card enforcement
  - Max 2 Legendaries enforcement
  - Save button with validation
  - WIP deck save with badge
  - Deck validation messaging
- **Implemented elements**:
  - Deck name text field
  - Card count header (X/20)
  - Split view layout (55/45 horizontal split) -- always split, no phone/tablet adaptation
  - Card pool with search and LazyVGrid
  - Deck list with swipe-to-remove
  - Max 2 copies per card enforcement
  - Save button with disabled state while saving
  - Loading state via `.loading()` modifier
- **Missing elements**:
  - **Faction selector row** not implemented
  - **Avatar selector row** not implemented
  - **DeckStatsSummaryBar** (mana curve visualization, attunement bar, avg instability) not implemented -- only simple card count
  - **Phone/tablet adaptive layout** not implemented (always split view, which is problematic on phone -- 55% of 390pt = 214pt for card pool is tight)
  - **Segmented picker** for Contents/Pool on phone not implemented
  - **WIP deck saving** not implemented
  - **Deck validation messaging** (red text describing issues) not implemented
  - **Max 2 Legendaries** rule not enforced
- **Loading state**: YES (via modifier)
- **Error state**: Partial (error state variable exists but not displayed)
- **Empty state**: YES (in deck list section, "Tap cards to add")
- **Notes**: Functional core but missing the polish elements. The mana curve visualization and attunement bar are important for strategic deck building. Phone layout needs the segmented picker rather than side-by-side split.

---

### 6. Battle Screen (BattleContainerView)

- **Status**: PARTIAL
- **File**: `ChaosCreatures/ChaosCreatures/Views/Battle/BattleContainerView.swift`
- **Specced elements**:
  - SpriteKit BattleScene with ZStack SwiftUI HUD overlay
  - OpponentHUDView (avatar with faction border, name, HPBar, instability, ManaRow, hand/deck counts)
  - PlayerHUDView (avatar with faction border, name, HPBar, instability, ManaRow, TimerBar)
  - HandScrollView (horizontal scroll of CardInHandView items)
  - BottomControlsView (ManaDisplay, BattleLogButton, EndTurnButton)
  - D20Node chaos roll animation
  - Phase indicator (9 phases)
  - Board card nodes (5 slots x 2 rows)
  - Event overlay
  - Graveyard sheet (triggered by avatar tap)
  - Battle log overlay (triggered by button tap)
  - Connection lost overlay
  - Surrender confirmation
  - Orientation lock (portrait)
  - All SpriteKit combat animations (card play, attacker glow, blocker drag, damage numbers, death, spell cast)
- **Implemented elements**:
  - SpriteKit scene creation with BattleViewModel
  - OpponentHUDView (HP, hand count, deck count, instability -- simplified, no avatar image, no ManaRow)
  - PlayerHUDView (HP, mana, deck count, graveyard count, Chaos Spark button, surrender button -- no avatar image, no TimerBar)
  - HandScrollView with HandCardView items (tap to select, double-tap to play)
  - PrimaryActionButton (replaces EndTurnButton/BattleLogButton from spec)
  - Connection lost overlay
  - Surrender confirmation alert
  - Match service connection and action bridging
  - Game over handling with transition to PostMatchView
- **Missing elements**:
  - **AvatarView** with CDN art and faction-themed border not implemented (neither HUD has avatar)
  - **HPBarView** with animated fill, damage flash, and shake -- spec has detailed component; implementation uses simple text display
  - **TimerBarView** with countdown, color change, pulse at 15s -- NOT implemented
  - **EndTurnButton** (spec: styled with state-aware background, long-press confirm) -- replaced by generic PrimaryActionButton
  - **BattleLogButton** and entire BattleLog overlay -- NOT implemented
  - **ManaRowView** (10 circles in opponent HUD) -- NOT implemented; mana shown as text "X/Y"
  - **GraveyardSheet** -- NOT implemented (graveyard button exists but no sheet)
  - **Phase indicator** display -- relies on SpriteKit scene (not auditable here, would need BattleScene.swift review)
  - **Card art in hand** -- HandCardView uses color placeholder rectangles, not AsyncImage
  - **Orientation lock** mechanism not visible in this file
- **Loading state**: YES (implicit via connection state)
- **Error state**: YES (ConnectionLostOverlay)
- **Empty state**: N/A
- **Animations**: HandCardView scale on selection. Connection overlay.
- **Notes**: The battle screen is functional for basic gameplay but significantly simplified vs spec. The most critical missing pieces are: TimerBarView (players need to know time remaining), HPBarView animations (core game feel), BattleLog (important for understanding what happened), and GraveyardSheet. The ManaRow simplification (text vs visual circles) is a polish concern but still impacts readability.

---

### 7. Mode Selection Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/App/ContentView.swift` (inline ModeSelectionView)
- **Specced elements**:
  - Three mode buttons (Ranked, Casual, Practice)
  - Mode descriptions
  - Navigation to Matchmaking
- **Implemented elements**:
  - ForEach over GameMode.allCases
  - Each mode has display name, description text, chevron
  - Tapping starts matchmaking via router
  - Styled cards with dark theme
- **Missing elements**: None significant
- **Loading state**: N/A
- **Error state**: N/A
- **Empty state**: N/A
- **Notes**: Clean implementation matching spec.

---

### 8. Matchmaking Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Battle/MatchmakingView.swift`
- **Specced elements**:
  - Searching state with animation (pulsing, rotating indicator)
  - Timer display
  - Estimated wait time
  - Match found state with animation
  - Cancel button
  - Error state with retry
  - Practice mode handling (AI match)
- **Implemented elements**:
  - Searching view with animated ring (rotation + pulse)
  - Duration display (formatted timer)
  - Estimated wait time
  - Match found view with checkmark + "Preparing battle..."
  - Cancel button (top header and bottom)
  - Error view with retry
  - Practice mode (startPractice separate flow)
  - Presentation detent .medium
  - Interactive dismiss disabled while searching
- **Missing elements**: None significant
- **Loading state**: YES (searching state IS the loading state)
- **Error state**: YES
- **Empty state**: N/A
- **Notes**: Thorough implementation. Well-matched to spec.

---

### 9. Post-Match Results Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Battle/PostMatchView.swift`
- **Specced elements**:
  - Victory/Defeat banner
  - Match stats (turns, duration, HP)
  - Rewards (XP, Dust, Energy)
  - Rank change for ranked mode
  - Continue button
  - Staggered reveal animation
  - Background gradient (blue for win, red for loss)
- **Implemented elements**:
  - Result banner with crown/X icon, VICTORY/DEFEAT text, end reason subtitle
  - Match stats section (Turns, Duration, Your HP, Opp HP)
  - Rewards section (XP, Dust, Energy with icons)
  - Rank points display for ranked mode
  - Continue button (dismissPostMatch)
  - Staggered animation sequence (banner 0s, stats 0.6s, rewards 1.0s, continue 1.4s)
  - Gradient background (blue/red)
- **Missing elements**:
  - **Evolution-ready card notifications** -- spec mentions "Evolve Cards" navigation from post-match; implementation only has "Continue" returning to home
  - **"Play Again" button** -- spec shows two options (Play Again, Evolve Cards); only Continue exists
- **Loading state**: YES
- **Error state**: YES (with continue button)
- **Empty state**: N/A
- **Animations**: YES -- staggered reveals with spring/easeOut
- **Notes**: Good implementation. Missing "Play Again" shortcut is minor.

---

### 10. Evolution Flow Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Evolution/EvolutionFlowView.swift`
- **Specced elements**:
  - Multi-step state machine (presentation, channel selection, generating, art reveal, name selection, ability reveal, modifier selection, flavor reveal, confirm)
  - Card preview
  - Loading state with generation stages
  - Error state with retry
  - Cancel button
  - Interactive dismiss disabled during generation
- **Implemented elements**:
  - State machine (loading, choosingModifier, confirming, generating, reveal, error)
  - Card preview with art, name, tier badge, tier transition indicator
  - Loading view with generation stage indicators (start, generate art, create text, apply modifiers)
  - Error view with retry and cancel buttons
  - Cancel button in toolbar (hidden during reveal)
  - Interactive dismiss disabled during confirming/generating
  - Status change handler transitioning between phases
  - Modifier name display during generation
- **Missing elements**:
  - **9-step flow reduced to ~5 steps** -- spec calls for separate screens for: card presentation (step 1), channel selection (step 2), SpriteKit loading animation (step 3), art reveal with iris wipe (step 4), name selection from 2-3 options (step 5), ability reveal (step 6), modifier selection (step 7), flavor text typewriter (step 8), confirm with summary (step 9). Implementation combines several: modifier+channel selection is one step, generation is one step, reveal is one step.
  - **SpriteKit evolution loading animation** (card dissolve, shard materialize, particle orbit) -- NOT implemented; uses SwiftUI ProgressView instead
  - **Art reveal iris wipe** (radial gradient mask animation) -- NOT implemented; EvolutionRevealView uses different animation (3D flip + scale)
  - **Name selection** from GPT-4o Mini suggestions -- NOT implemented (server picks name)
  - **Ability reveal** with slide-in animation -- NOT implemented as separate step
  - **Flavor text typewriter** effect -- NOT implemented as separate step
  - **Final card presentation with summary** (stats comparison, save/share buttons) -- EvolutionRevealView has some of this but no Share button
- **Loading state**: YES
- **Error state**: YES
- **Empty state**: N/A
- **Animations**: Phase transitions with easeInOut. Generation stages with progress indicators.
- **Notes**: The implementation is functional and handles the core flow (choose modifier + channel, generate, reveal) but collapses the 9-step ceremonial experience into fewer steps. This significantly reduces the drama and engagement of evolution, which is supposed to be the game's signature moment. The SpriteKit loading animation is a major missing piece for game feel.

---

### 11. Evolution Reveal Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Evolution/EvolutionRevealView.swift`
- **Specced elements**: Art reveal with dramatic presentation, before/after comparison, stat changes, modifier display, continue button
- **Implemented elements**:
  - Multi-phase reveal animation (glow, card appear with 3D flip, particles, title, details, continue)
  - Tier upgrade badge (previous -> new)
  - Card art display with tier-colored glow and pulse
  - Card name, tier badge, flavor text
  - Modifier display
  - Stat changes (ATK, HP, INST with color coding)
  - Previous name reference
  - Sparkle overlay particles
  - Continue button
- **Missing elements**:
  - **Iris wipe reveal** (radial gradient mask) -- uses 3D flip + scale instead (different but effective)
  - **Share button** for UIActivityViewController screenshot sharing
- **Loading state**: N/A
- **Error state**: N/A
- **Empty state**: N/A
- **Animations**: YES -- 7-phase staggered animation sequence with glow, spring, opacity
- **Notes**: This is one of the best-implemented screens. The reveal animation is polished and dramatic. Different approach from spec's iris wipe but visually compelling.

---

### 12. Modifier Picker Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Evolution/ModifierPickerView.swift`
- **Specced elements**:
  - Channel direction picker (Order/Chaos)
  - Modifier cards with name, attunement, flavor, effects, penalty indicator
  - Selected modifier detail panel
  - Confirm button
  - Cancel button
- **Implemented elements**:
  - Channel direction picker with ORDER/CHAOS toggle buttons
  - Direction description text
  - Modifier card list with full details (name, attunement badge, flavor text, keyword grant, instability adjustment, power rating, penalty indicator)
  - Selected modifier expanded detail (base effect, attuned effect, penalty)
  - Confirm/Cancel buttons with proper disabled state
  - Spring animations on selection
- **Missing elements**: None significant
- **Loading state**: N/A (modifiers pre-loaded)
- **Error state**: N/A
- **Empty state**: N/A
- **Animations**: YES -- spring animations on card selection, opacity transitions
- **Notes**: Excellent implementation. Thorough and matches spec well.

---

### 13. Onboarding Flow

- **Status**: PARTIAL
- **File**: `ChaosCreatures/ChaosCreatures/Views/Onboarding/OnboardingView.swift`, `FactionPickerView.swift`
- **Specced elements** (7 steps):
  1. Intro Cinematic (skippable panels)
  2. Faction Selection (swipeable cards)
  3. Tutorial Match (guided battle vs AI)
  4. Faction Commitment (keep trial deck)
  5. First Evolution (guided, pre-awarded energy + shard)
  6. Deck Builder Tour (overlay tooltips)
  7. Release to Home (final screen)
- **Implemented elements**:
  - Step 1: IntroCinematicView with 5 panels (SF Symbol icons instead of illustrations), auto-advance timer, skip button, tap to advance
  - Step 2: FactionPickerView with TabView pager, faction cards with icon, name, mechanic badge, description, keywords, "Choose" button
  - Step 3 (skipped): No tutorial match implemented
  - Step 4 (simplified): Faction commitment via Edge Function call (`player/commit-faction`), no confirmation alert/sheet
  - Step 5 (skipped): No guided first evolution
  - Step 6 (skipped): No deck builder tour
  - Step 7: ReadyToPlayView with checkmark icon, "Start Playing" button with pulse animation
- **Missing elements**:
  - **Tutorial Match** (Step 3) -- entirely missing. This is specced as a guided battle with TutorialOverlayView, SpotlightMaskView, 9 tutorial steps, and scripted AI defeat. Critical for new player retention.
  - **Faction Commitment confirmation** (Step 4) -- jumps straight to commit without alert/sheet confirmation
  - **First Evolution** (Step 5) -- not implemented. Players don't experience evolution during onboarding.
  - **Deck Builder Tour** (Step 6) -- not implemented. No tooltip overlays.
  - **Art assets** -- spec calls for illustration panels; implementation uses SF Symbols
- **Loading state**: NO
- **Error state**: Partial (toast on faction commit failure)
- **Empty state**: N/A
- **Animations**: Panel transitions, faction selection, button pulse
- **Notes**: Only 3 of 7 onboarding steps are implemented. The tutorial match is the single most important missing feature for new player retention. Without it, new players are thrown into real matches without understanding the game mechanics. The guided first evolution is also important for teaching the game's unique selling point.

---

### 14. Shop Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Shop/ShopView.swift`
- **Specced elements**:
  - Currency header (Chaos Dust + shard counts)
  - Subscription section (horizontal scroll of tier cards)
  - Card packs section (pack rows with buy buttons)
  - Shards section
  - Cosmetics section
  - Settings gear
- **Implemented elements**:
  - Currency header with dust display and 4 shard tier counters
  - Subscription section with 3 SubscriptionCardItem views (Free, Mid, High) in horizontal scroll
  - Card packs section with 3 PackRow views (Starter, Rare, Epic)
  - Shards section (info text, no purchase since shards are gameplay-earned)
  - Settings gear in toolbar
  - Navigation to SubscriptionView sheet
  - Navigation to CardPackOpeningView sheet
- **Missing elements**:
  - **Cosmetics section** -- specced but not implemented (acceptable for MVP)
  - **Shard tooltip** on tap -- specced but not implemented
  - **Dust tooltip** on tap -- specced but not implemented
- **Loading state**: NO (data from AppState)
- **Error state**: NO
- **Empty state**: N/A
- **Notes**: Good implementation for MVP. Missing tooltips are minor polish items.

---

### 15. Subscription Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Shop/SubscriptionView.swift`
- **Specced elements**:
  - Tier comparison cards
  - Feature comparison table
  - StoreKit 2 purchase flow
  - Restore purchases
  - Legal text
  - Close button
- **Implemented elements**:
  - Hero header
  - Tier selection (3 cards: Free, Mid, High with icons, names, prices, CURRENT badge)
  - Feature comparison table (7 features across 3 tiers)
  - FAQ section
  - Legal text
  - Sticky purchase button with loading state
  - StoreKit 2 integration via StoreKitService
  - Restore purchases button
  - Close button
  - Error alert for purchase failures
- **Missing elements**: None significant
- **Loading state**: YES (purchase in progress)
- **Error state**: YES (purchase error alert)
- **Empty state**: N/A
- **Notes**: Thorough implementation. Well-handled StoreKit 2 integration.

---

### 16. Card Pack Opening Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Shop/CardPackOpeningView.swift`
- **Specced elements**:
  - Pack preview with cost and balance
  - Pack appearing animation (scale + rotation)
  - Card reveal one-by-one with flip animation
  - Tap to reveal next / reveal all
  - "Open Another" option
  - Pack complete summary
- **Implemented elements**:
  - Pack preview (icon, name, description, cost, player balance)
  - Purchasing state with ProgressView
  - Pack appearing animation (spring scale + rotation, then shrink/burst)
  - Card fan reveal (indexed reveal with fan spread positioning)
  - Card info for current reveal (name, tier, stats)
  - "Tap to Reveal Next" and "Reveal All" buttons
  - "Open Another" when can afford
  - "Done" button
  - Error handling with alert
  - Glow effect behind pack
- **Missing elements**:
  - **3D card flip** (spec: `.rotation3DEffect(.degrees(flipped ? 0 : 180)`) -- implementation uses opacity fade (front/back swap via opacity) not 3D rotation
  - **Card back art** -- uses generic dark gradient instead of faction card back image
- **Loading state**: YES (purchasing phase)
- **Error state**: YES (alert)
- **Empty state**: N/A
- **Animations**: YES -- spring animations, fan spread, pack burst, glow
- **Notes**: Well-implemented with good animation sequencing. The card flip being opacity-based instead of 3D rotation is a minor polish difference.

---

### 17. Profile Screen

- **Status**: PARTIAL
- **File**: `ChaosCreatures/ChaosCreatures/Views/Profile/ProfileView.swift`
- **Specced elements**:
  - Player card (avatar, username, faction badge, subscription tier)
  - Season rank with icon, LP, W/L record
  - Battle statistics grid
  - Faction mastery per faction
  - Achievements link
  - Showcase cards section
  - Settings gear
  - Pull-to-refresh
- **Implemented elements**:
  - Player card (placeholder avatar, username, faction badge, subscription tier)
  - Season rank section (rank icon, LP, W/L with percentages)
  - Battle statistics grid (Total Matches, Win Streak, Best Streak, XP)
  - Faction mastery section (3 factions with progress bars -- hardcoded 0%)
  - Achievements link (NavigationLink to ProfileDestination.achievements)
  - Settings gear in toolbar
  - Pull-to-refresh
- **Missing elements**:
  - **Avatar** -- placeholder circle instead of CDN AsyncImage
  - **Showcase cards** -- specced in doc 00 (player picks 3 cards to display); not implemented
  - **Active title** -- Player model has `activeTitle` but not displayed
  - **Faction mastery data** -- progress bars exist but hardcoded to 0 (no mastery data integration)
  - **Cards evolved total** and **highest tier reached** stats -- in Player model but not displayed
- **Loading state**: NO (data from AppState)
- **Error state**: NO
- **Empty state**: Partial (rank section shows message if no rank)
- **Notes**: Functional but several data fields from the Player model are not surfaced in the UI. Showcase cards and active title are engagement features that are specced in the master design doc.

---

### 18. Settings Screen

- **Status**: COMPLETE
- **File**: `ChaosCreatures/ChaosCreatures/Views/Profile/SettingsView.swift`
- **Specced elements**:
  - Account section (username, subscription, sign out, delete account)
  - Audio section (music toggle + volume, SFX toggle + volume)
  - Visuals section (colorblind mode picker, reduce motion)
  - Gameplay section (confirm end turn, extended timer)
  - Notifications section (evolution ready, daily reset, match found)
  - Privacy section (privacy policy, terms, export data)
  - About section (version, build)
- **Implemented elements**:
  - All sections present with correct controls
  - Sign out with confirmation alert
  - Delete account with confirmation alert
  - Music/SFX toggles with conditional volume sliders
  - Colorblind mode picker (None, Deuteranopia, Protanopia, Tritanopia)
  - Reduce motion toggle
  - Gameplay toggles
  - Notification toggles
  - Privacy links (external URLs)
  - Export data button
  - Version and build info
- **Missing elements**: None
- **Loading state**: N/A
- **Error state**: N/A
- **Empty state**: N/A
- **Notes**: Comprehensive. Well-matched to spec. Uses @AppStorage correctly.

---

## MISSING Screens

### M1. Achievements Screen

- **Status**: MISSING
- **Specced in**: Doc 07 Section 1 (Secondary Screens table)
- **Navigation path**: Profile -> Achievements (ProfileDestination.achievements)
- **Router support**: YES (ProfileDestination.achievements exists)
- **ContentView destination**: PLACEHOLDER -- `Text("Achievements")` instead of real view
- **Impact**: Medium -- players can't view achievement progress
- **Notes**: Navigation path exists but destination is a placeholder Text view. Needs AchievementsView.swift.

### M2. Graveyard Sheet

- **Status**: MISSING
- **Specced in**: Doc 07 Section 3.8 (detailed GraveyardSheet spec)
- **Navigation path**: Avatar tap in battle -> sheet
- **Router support**: No (viewModel.showGraveyard state exists but no sheet)
- **Impact**: High -- during battle, players cannot view destroyed creatures
- **Notes**: Spec includes detailed layout with sort options, 3-column grid, card thumbnails. PlayerHUDView has `onGraveyard` callback and graveyard count display, but no `.sheet` modifier to present the graveyard.

### M3. Battle Log Overlay

- **Status**: MISSING
- **Specced in**: Doc 07 Section 3.7 (detailed BattleLogOverlay spec)
- **Navigation path**: BattleLogButton in BottomControlsView -> SKScene overlay
- **Impact**: High -- players cannot review what happened in the match
- **Notes**: Spec describes an SKNode sliding panel from the left edge with colored log entries. There is no BattleLogButton or BottomControlsView in the implementation. The PrimaryActionButton replaces both EndTurnButton and BattleLogButton from the spec.

### M4. Upgrade Prompt View

- **Status**: MISSING
- **Specced in**: Doc 07 Section 6.5
- **Navigation path**: Triggered when free player hits tier-locked action
- **Impact**: Low (monetization conversion) -- free players hitting limits won't see upgrade prompt
- **Notes**: Spec includes full modal overlay with Free vs Mid comparison and purchase CTA. Not implemented.

---

## Navigation Audit

### Tab Bar Structure

**Spec**: 5 tabs -- Home, Collection, Decks, Profile, Shop
**Implementation**: 5 tabs matching spec exactly

| Tab | Spec | Implemented | Root View |
|-----|------|-------------|-----------|
| Home | Tab 1 | YES | HomeView |
| Collection | Tab 2 | YES | CollectionView |
| Decks | Tab 3 | YES | DeckListView |
| Profile | Tab 4 | YES | ProfileView |
| Shop | Tab 5 | YES | ShopView |

Icons match: house.fill, rectangle.stack.fill, square.stack.3d.up.fill, person.fill, bag.fill

### Root Screen Routing

| Root Screen | Spec | Implemented |
|-------------|------|-------------|
| Splash | First screen on launch | YES (SplashView in RootView) |
| Sign In | When not authenticated | YES (SignInView with Apple Sign In) |
| Onboarding | First-time authenticated user | YES (OnboardingView) |
| Main (TabView) | Authenticated + onboarded | YES (ContentView) |

### Modal Presentations

| Modal | Spec | Implemented | Presentation |
|-------|------|-------------|-------------|
| Battle | fullScreenCover | YES | `.fullScreenCover(isPresented: $router.showBattle)` |
| Matchmaking | sheet | YES | `.sheet(isPresented: $router.showMatchmaking)` |
| Post-Match | fullScreenCover | YES | `.fullScreenCover(isPresented: $router.showPostMatch)` |
| Evolution | sheet | YES | `.sheet(isPresented: $router.showEvolution)` |
| Card Detail | sheet | YES | Via `CollectionView.selectedCard` binding |
| Subscription | sheet | YES | Via `ShopView.showSubscription` |
| Pack Opening | sheet | YES | Via `ShopView.selectedPackType` |
| Graveyard | sheet | MISSING | Not wired |
| Battle Log | SKScene overlay | MISSING | Not implemented |

### Navigation Paths

Each tab has its own `NavigationPath` in AppRouter. Destinations are type-safe enums.

| Tab | Destinations | All Wired |
|-----|-------------|-----------|
| Home | modeSelection, settings | YES |
| Collection | cardDetail, settings | YES |
| Decks | deckBuilder, settings | YES |
| Profile | achievements, settings | YES (achievements is placeholder) |
| Shop | subscription, cardPackOpening, settings | YES |

### Orphaned Screens

None found. All view files have at least one navigation path to reach them.

### Dead-End Screens

| Screen | Issue | Severity |
|--------|-------|----------|
| Achievements | Placeholder `Text("Achievements")` with no content or back navigation beyond SwiftUI built-in | Low (has built-in back button) |
| EvolutionFlowView | During `.generating` phase, if user force-dismisses (swipe), flow state may be inconsistent. `.interactiveDismissDisabled` mitigates this. | Low |

No true dead-end screens found. All screens have either navigation bar back buttons, close buttons, or dismiss mechanics.

---

## Critical Issues

| # | Issue | Screen | Description |
|---|-------|--------|-------------|
| C1 | **Tutorial match not implemented** | Onboarding | The guided tutorial battle (7 onboarding steps 3-6) is entirely missing. New players are released into the game without ever learning mechanics. This will cause catastrophic churn for new users. |
| C2 | **Timer not implemented in battle** | BattleContainerView | TimerBarView is specced to show remaining turn time with urgent pulse at 15s. Without it, players have no time awareness during their turns. The game server will timeout players who don't know they have a timer. |
| C3 | **Graveyard sheet not implemented** | BattleContainerView | During battle, players cannot view destroyed creatures. This impacts strategic decision-making (knowing what's left in the opponent's arsenal). |

---

## High Issues

| # | Issue | Screen | Description |
|---|-------|--------|-------------|
| H1 | **HP bars simplified to text** | BattleContainerView | Spec calls for animated HPBarView with fill, damage flash, and shake. Implementation shows "X/Y" text. HP changes are invisible during combat -- players must read numbers instead of seeing visual feedback. |
| H2 | **Battle log not implemented** | BattleContainerView | No way to review what happened in a turn. During complex combat with multiple attackers/blockers, players lose track of events. |
| H3 | **Filter panel missing in Collection** | CollectionView | With potentially 100+ cards, players can only search by name. Cannot filter by type, tier, mana cost, keywords, attunement, or evolution-ready status. |
| H4 | **Evolution ceremony collapsed** | EvolutionFlowView | 9-step spec reduced to ~5 steps. Missing: SpriteKit loading animation, iris wipe art reveal, name selection, ability reveal, flavor text typewriter. Evolution is the game's signature moment and needs the full ceremony. |
| H5 | **Card detail missing abilities and modifiers display** | CardDetailView | Players cannot see their card's triggered abilities or applied modifiers. This is critical game information for deck building and strategy. |
| H6 | **Card detail missing sticky action buttons** | CardDetailView | No "Add to Deck" button or More menu (Favorite, Dismantle, Share). Players can only evolve from this screen; all other actions require navigating elsewhere. |

---

## Medium Issues

| # | Issue | Screen | Description |
|---|-------|--------|-------------|
| M1 | **Achievements screen is placeholder** | ContentView (Profile tab) | Destination exists but shows only `Text("Achievements")`. |
| M2 | **Deck builder missing mana curve visualization** | DeckBuilderView | DeckStatsSummaryBar with mana curve, attunement bar, avg instability not implemented. Players can't see deck composition at a glance. |
| M3 | **Deck builder not phone-adaptive** | DeckBuilderView | Always shows 55/45 split view. On phone (390pt), card pool gets 214pt and deck list gets 176pt. Spec calls for segmented picker switching between panels on phone. |
| M4 | **Hand cards use placeholder art** | BattleContainerView | HandCardView shows faction-colored rectangles instead of card art (AsyncImage). Players can't recognize cards visually. |
| M5 | **Avatars use placeholder everywhere** | Multiple | Home, Profile, Battle HUD all use SF Symbol placeholder circles instead of AsyncImage avatars with faction borders. |
| M6 | **Collection faction filter is TODO** | CollectionView | FactionTabBar exists but faction filtering is commented out with TODO. Tapping faction tabs changes underline but doesn't filter cards. |
| M7 | **Profile missing showcase cards and active title** | ProfileView | Player model has `showcaseCardIds` and `activeTitle` fields but neither is displayed. |
| M8 | **Upgrade prompt not implemented** | Global | Free players hitting tier limits see no upgrade prompt. Monetization conversion path is missing. |
| M9 | **Card flip interaction missing** | CardDetailView | Spec calls for swipe-up 3D flip to show card lore/history on back face. Not implemented. |
| M10 | **No long-press context menus** | CollectionView | Spec calls for long-press on cards for quick actions (Evolve, Add to Deck, Favorite). Not implemented. |
| M11 | **ManaRowView missing in battle** | BattleContainerView | Opponent HUD should show 10 mana circles. Only text "X/Y" is shown. |
| M12 | **EndTurnButton not matching spec** | BattleContainerView | Spec has styled EndTurnButton with state-aware colors, long-press confirm option. Implementation uses generic PrimaryActionButton. |

---

## Revision Log

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-17 | Claude Code (Automated Audit) | Initial audit of UI screen completeness vs doc 07 spec |

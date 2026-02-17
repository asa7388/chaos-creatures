# AUDIT-W4A: UI/UX Polish Audit

**Date**: 2026-02-17
**Auditor**: Claude Code (Opus 4.6)
**Scope**: All SwiftUI Views (25 files), SpriteKit Nodes/Scenes (23 files), Color/Theme extensions, Navigation router

---

## Summary

| Metric | Count |
|---|---|
| **Screens reviewed** | 25 (all SwiftUI views) + 23 SpriteKit files |
| **Color inconsistencies** | 14 |
| **Spacing inconsistencies** | 8 |
| **Orphaned screens** | 1 |
| **Navigation issues** | 3 |
| **Header/title inconsistencies** | 2 |
| **Dark mode issues** | 5 |
| **Accessibility issues** | 19 (critical gap) |
| **SwiftUI/SpriteKit visual gaps** | 6 |
| **Font spec violations** | 1 (systemic) |

**Overall Assessment**: The app has a well-organized color system (`Color+Theme.swift` + `SpriteKitConstants.swift`) and consistent use of a dark theme. Navigation is complete with no dead-ends. However, there are significant gaps: (1) SpriteKit files bypass the centralized color constants with dozens of hardcoded hex values, (2) **zero** accessibility support (no VoiceOver labels, no Dynamic Type, no accessibility modifiers anywhere), (3) the spec-mandated fonts (Cinzel + Alegreya) are not used -- the entire app uses system fonts in SwiftUI and AvenirNext in SpriteKit, and (4) several minor color mismatches between the two rendering frameworks.

---

## 1. Color Audit

### 1.1 Color Architecture (Good)

The app has a centralized color system in two files:
- **SwiftUI colors**: `ChaosCreatures/Extensions/Color+Theme.swift` -- 30+ named color constants, faction helpers, tier/rank color functions
- **SpriteKit colors**: `ChaosCreatures/SpriteKit/Utilities/SpriteKitConstants.swift` -- `SK.Colors` enum with 15 UIColor constants
- **Faction bridge**: `FactionShortName.primaryUIColor` / `.accentUIColor` / `.swiftUIColor` extensions in Color+Theme.swift

The hex values are consistent between the two systems (e.g., `Color.orderBlue` = `#5BC0EB` matches `SK.Colors.orderBlue` = `#5BC0EB`).

### 1.2 Hardcoded Hex Values in SpriteKit (Major Issue)

While `SK.Colors` exists, **most SpriteKit node files use inline `UIColor(hex:)` instead of referencing the constants**. This creates a maintenance hazard -- if a color changes in `SK.Colors`, the inline hex values will be stale.

| Issue | File | Line(s) | Current (Hardcoded) | Should Use |
|---|---|---|---|---|
| ATK label color | `SpriteKit/Nodes/CreatureNode.swift` | 65, 266 | `UIColor(hex: "#F44336")` | `SK.Colors.damageRed` |
| HP label color | `SpriteKit/Nodes/CreatureNode.swift` | 75, 268 | `UIColor(hex: "#4CAF50")` | `SK.Colors.healGreen` |
| Mana cost badge | `SpriteKit/Nodes/CreatureNode.swift` | 97 | `UIColor(hex: "#4A90E2")` | `SK.Colors.manaFilled` |
| Stats bar bg | `SpriteKit/Nodes/CreatureNode.swift` | 56 | `UIColor(hex: "#0D0D0D")` | `SK.Colors.background` |
| Card name bg | `SpriteKit/Nodes/CreatureNode.swift` | 122 | `UIColor(hex: "#1A1A1A")` | `SK.Colors.surfaceLight` |
| Shield overlay fill | `SpriteKit/Nodes/CreatureNode.swift` | 235-236 | `UIColor(hex: "#5BC0EB")` | `SK.Colors.orderBlue` |
| Taunt icon placeholder | `SpriteKit/Nodes/CreatureNode.swift` | 214 | `UIColor(hex: "#FFD700")` | `SK.Colors.tauntGold` |
| Keyword colors | `SpriteKit/Nodes/CreatureNode.swift` | 201-207 | 7 inline hex values | Should be `SK.Colors` or a keyword color map |
| Hand card cost badge | `SpriteKit/Nodes/HandCardNode.swift` | 54, 126 | `UIColor(hex: "#4A90E2")` / `"#555555"` | `SK.Colors.manaFilled` / `SK.Colors.timerInactive` |
| Hand card bg | `SpriteKit/Nodes/HandCardNode.swift` | 86 | `UIColor(hex: "#1A1A1A")` | `SK.Colors.surfaceLight` |
| Board slot fill | `SpriteKit/Nodes/BoardNode.swift` | 42 | `UIColor(hex: "#0D0D0D")` | `SK.Colors.background` |
| Event banner bg | `SpriteKit/Nodes/EventBannerNode.swift` | 32 | `UIColor(hex: "#0D0D0D")` | `SK.Colors.background` |
| Event icon colors | `SpriteKit/Nodes/EventBannerNode.swift` | 46 | Inline `#5BC0EB` / `#E63946` | `SK.Colors.orderBlue` / `SK.Colors.chaosRed` |
| Avatar instability | `SpriteKit/Nodes/AvatarNode.swift` | 64, 66 | `UIColor(hex: "#E63946")` / `"#5BC0EB"` | `SK.Colors.chaosRed` / `SK.Colors.orderBlue` |
| Shield break flash | `SpriteKit/Actions/ShieldBreakAction.swift` | 36, 58 | `UIColor(hex: "#5BC0EB")` | `SK.Colors.orderBlue` |
| Heal node color | `SpriteKit/Nodes/DamageNumberNode.swift` | 40 | `UIColor(hex: "#5BC0EB")` | `SK.Colors.orderBlue` |
| Event victory color | `SpriteKit/Actions/EventSlideAction.swift` | 92 | `UIColor(hex: "#FFD700")` | `SK.Colors.tauntGold` |
| Battle bg | `SpriteKit/Scenes/BattleScene.swift` | 103 | `UIColor(hex: "#0D0D0D")` | `SK.Colors.background` |
| Default faction color | `SpriteKit/Scenes/BattleScene.swift` | 54-55 | `UIColor(hex: "#C9A84C")` | `FactionShortName.ironwright.primaryUIColor` |
| Particle colors (8+) | `SpriteKit/Utilities/ParticleEffects.swift` | 38-223 | 11 inline hex values | Should use `SK.Colors` or faction UIColor helpers |

**Total**: ~40 hardcoded `UIColor(hex:)` calls in SpriteKit files that should reference `SK.Colors` or `FactionShortName` extensions.

### 1.3 Hardcoded Hex Values in SwiftUI (Minor)

| Issue | File | Line(s) | Current | Should Use |
|---|---|---|---|---|
| Mana gem gradient | `Views/Components/ManaGemView.swift` | 18, 24 | `Color(hex: "#1565C0")`, `Color(hex: "#0D47A1")` | Named constants (e.g., `Color.manaGemLight` / `.manaGemDark`) |
| Flying keyword color | `Views/Components/KeywordBadgeView.swift` | 37 | `Color(hex: "#90CAF9")` | Named constant (e.g., `Color.keywordFlying`) |
| Sub tier mid gradient | `Views/Shop/ShopView.swift` | 303 | `Color(hex: "#0D47A1")`, `Color(hex: "#1565C0")` | Named constants |
| Sub tier high gradient | `Views/Shop/ShopView.swift` | 309 | `Color(hex: "#E65100")`, `Color(hex: "#F57F17")` | Named constants |

### 1.4 Color Duplication Between Frameworks

The same hex value appears in both `Color+Theme.swift` (SwiftUI) and `SpriteKitConstants.swift` (UIKit). This is unavoidable because `Color` and `UIColor` are different types, but the faction color bridge (`FactionShortName.primaryUIColor`) is not consistently used in SpriteKit nodes.

**Recommendation**: Add a `SK.Colors.factionPrimary(_ faction: FactionShortName) -> UIColor` helper to mirror `Color.factionPrimary()` and use it everywhere.

---

## 2. Spacing & Layout Issues

### 2.1 Consistent Patterns (Good)

The app uses a consistent card background pattern via `.cardBackground()` view modifier (defined in `View+Loading.swift`:261). This modifier applies `Color.bgSecondary` + 12pt corner radius + 1pt `borderDefault` stroke. Used in 17 places across Home, Collection, Profile, Shop, and DeckList views.

### 2.2 Inconsistent Horizontal Padding

| Issue | File | Padding Used | Expected |
|---|---|---|---|
| Home screen sections | `Views/Home/HomeView.swift` | `.padding(.horizontal, 16)` | 16pt (consistent) |
| Collection filter bar | `Views/Collection/CollectionView.swift` | `.padding(.horizontal, 12)` | Should be 16pt like other screens |
| Collection card grid | `Views/Collection/CollectionView.swift` | `.padding(.horizontal, 8)` | Should be 12-16pt |
| Deck builder card pool | `Views/Collection/DeckBuilderView.swift` | `.padding(.horizontal, 6)` | Tighter than other grids (8pt) |
| Deck builder search | `Views/Collection/DeckBuilderView.swift` | `.padding(8)` | Should match other search fields |
| Shop subscription cards | `Views/Shop/ShopView.swift` | `.padding(.horizontal, 16)` | 16pt (consistent) |
| PostMatch horizontal | `Views/Battle/PostMatchView.swift` | `.padding(.horizontal, 20)` | Different from the standard 16pt |
| Matchmaking cancel btn | `Views/Battle/MatchmakingView.swift` | `.padding(.horizontal, 20)` | Different from the standard 16pt |

### 2.3 Bottom Padding Inconsistency

Several views add `.padding(.bottom, 80)` for tab bar clearance, but the value varies:
- HomeView: 80pt
- CollectionView: 80pt
- DeckListView: 80pt
- ProfileView: 80pt
- ShopView: no explicit bottom padding (relies on ScrollView default)
- CardPackOpeningView: `.padding(.bottom, 24)` (sheet, no tab bar)
- PostMatchView: `.padding(.bottom, 40)` (fullScreenCover, no tab bar)

**ShopView** is missing the 80pt bottom padding that all other tab-level scroll views have.

### 2.4 Inner Section Padding

Most card sections use `.padding(16)` consistently. One exception:
- `DeckRowView` uses `.padding(16)` (consistent)
- `MissionRowView` uses `.padding(12)` (slightly tighter)
- `ProfileView.profileStatRow` uses `.padding(10)` (even tighter)

This creates subtle visual inconsistency between cards of similar hierarchy.

---

## 3. Orphaned Screens

### 3.1 Achievements Screen (Orphaned Placeholder)

**File**: `App/ContentView.swift:73`
```swift
case .achievements:
    Text("Achievements") // Placeholder
```

The Profile tab's NavigationStack routes to `.achievements`, and `ProfileView` has a NavigationLink to it, but the destination is just `Text("Achievements")` -- a raw placeholder with no screen. The `AppRouter` defines `ProfileDestination.achievements` but there is no `AchievementsView.swift` file. This will show as a blank screen with just the word "Achievements" and a back button.

**Impact**: User can reach this screen but sees nothing useful.
**Fix**: Build `AchievementsView` or hide the NavigationLink until it is ready.

### 3.2 All Other Screens Are Reachable

Tracing the navigation map from `ChaosCreaturesApp.swift`:
- **Splash** -> automatic transition based on AppState
- **SignIn** -> reached when not authenticated
- **Onboarding** (IntroCinematic -> FactionPicker -> ReadyToPlay) -> reached on first login
- **Main** (TabView with 5 tabs) -> all tabs have content
  - Home -> ModeSelection -> Matchmaking -> BattleContainer -> PostMatch (all connected)
  - Collection -> CardDetail (sheet) -> EvolutionFlow -> EvolutionReveal (all connected)
  - Decks -> DeckBuilder (all connected)
  - Profile -> Achievements (placeholder, but reachable), Settings
  - Shop -> Subscription (sheet), CardPackOpening (sheet)
- **Settings** -> reachable from every tab's gear icon (good)

No truly orphaned views found (all .swift files in Views/ are referenced in navigation).

---

## 4. Navigation Issues

### 4.1 No Graveyard View Exists

`BattleContainerView` defines `onGraveyard: { viewModel.showGraveyard = true }` in `PlayerHUDView`, but there is no sheet or view connected to `showGraveyard`. The doc 07 spec lists "Graveyard" as a sheet over BattleView, but no `GraveyardView.swift` exists and `BattleContainerView` has no `.sheet` modifier for it.

**Impact**: Tapping the graveyard button in battle does nothing visible.

### 4.2 CardDetail Sheet in Collection Ignores Selected Card

In `CollectionView.swift:86-88`:
```swift
.sheet(item: $selectedCard) { card in
    CardDetailView()  // card parameter is unused
}
```

`CardDetailView` reads from `router.selectedCardInstance`, but `CollectionView` sets `selectedCard` on its own `@State` -- it never calls `router.navigateToCardDetail(card)`. This means the sheet opens but `CardDetailView` may show stale data or nil data from the router.

**Impact**: Card detail may show wrong card or empty data when opened from Collection.

### 4.3 Missing Evolution Navigation from PostMatch

Doc 07 spec says PostMatch should offer "Evolve Cards" button navigating to `CollectionView?filter=evolutionReady`. The current `PostMatchView` only has a "Continue" button that calls `router.dismissPostMatch()` -- no evolution shortcut.

**Impact**: Players must manually navigate to Collection after winning to evolve cards.

---

## 5. Header/Title Consistency

### 5.1 NavigationBarTitleDisplayMode

| Screen | Display Mode | Expected |
|---|---|---|
| HomeView | `.inline` | `.inline` (correct) |
| CollectionView | `.inline` | `.inline` (correct) |
| DeckListView | `.inline` | `.inline` (correct) |
| ProfileView | `.inline` | `.inline` (correct) |
| ShopView | `.inline` | `.inline` (correct) |
| **SettingsView** | **`.large`** | **`.inline`** (inconsistent with all other screens) |
| DeckBuilderView | `.inline` | `.inline` (correct) |
| CardDetailView | `.inline` | `.inline` (correct) |
| ModeSelectionView | `.inline` | `.inline` (correct) |
| SubscriptionView | `.inline` | `.inline` (correct) |
| CardPackOpeningView | `.inline` | `.inline` (correct) |
| EvolutionFlowView | `.inline` | `.inline` (correct) |

**Issue**: `SettingsView` uses `.large` title display mode while every other screen uses `.inline`. This creates a visual jolt when navigating from any tab to Settings.

### 5.2 Section Headers Consistent

Section headers consistently use `.font(.system(size: 16, weight: .bold))` + `.foregroundColor(.textPrimary)` across Home, Profile, Shop, CardDetail. This is good.

---

## 6. Dark Mode Issues

### 6.1 Force-Dark Scheme (Intentional)

`ChaosCreaturesApp.swift:18` applies `.preferredColorScheme(.dark)` to the root view. This means the app is dark-mode-only, which matches the design philosophy ("Dark theme default with faction-themed light accents"). This is correct per spec.

### 6.2 Hardcoded `.black` and `.white` References

Several views use `.foregroundColor(.black)` or `.foregroundColor(.white)` directly instead of semantic colors. While this is fine in a forced-dark app, it creates fragility if light mode is ever added.

| File | Line(s) | Issue |
|---|---|---|
| `ChaosCreaturesApp.swift` | 150 | Sign-in button text: `.foregroundColor(.black)` on white bg |
| `FactionPickerView.swift` | 65, 98 | Mechanic badge text: `.foregroundColor(.black)` on faction color bg |
| `OnboardingView.swift` | 215 | "Start Playing" button: `.foregroundColor(.black)` on gold bg |
| `CardDetailView.swift` | 225 | "Evolve Now" button: `.foregroundColor(.black)` on gold bg |
| `ShopView.swift` | 118, 233, 260 | Subscription tier badges: `.foregroundColor(.black)` on gold bg |
| `SubscriptionView.swift` | 144, 337 | "CURRENT" badge / purchase button: `.foregroundColor(.black)` |
| `EvolutionFlowView.swift` | 380 | "Try Again" button: `.foregroundColor(.black)` on gold bg |
| `EvolutionRevealView.swift` | 304 | "Continue" button: `.foregroundColor(.black)` on gold bg |
| `PostMatchView.swift` | 266 | "Continue" button: `.foregroundColor(.white)` on ironwright bg |
| `BattleContainerView.swift` | 241-242, 311-312 | HUD text: `.foregroundColor(.white)` |

**Severity**: Low (dark mode is forced), but if the design ever needs a light mode variant, these will all need updating.

### 6.3 System Form in SettingsView

`SettingsView` uses SwiftUI `Form` which inherits system styling. In dark mode, Form sections use system dark backgrounds that may not match the app's custom `bgPrimary`/`bgSecondary` palette. The Form's grouped background will be `UIColor.systemGroupedBackground` (system dark gray) rather than `#0D0D0D` / `#141414`.

**Impact**: Settings screen looks slightly different from the rest of the app due to system Form styling vs custom dark theme.

### 6.4 TextField in CollectionView

`CollectionView.swift:131` uses `.textFieldStyle(.roundedBorder)` for the search field. The `.roundedBorder` style uses system colors that may not match the dark theme. Same issue in `DeckBuilderView.swift:91`.

**Impact**: Search fields may appear lighter than expected against the dark background.

### 6.5 ConnectionLostOverlay Uses Raw Black

`BattleContainerView.swift:491`: `Color.black.opacity(0.7)` is used instead of `Color.bgPrimary.opacity(0.7)`. While visually similar in dark mode, using the theme color is more consistent.

---

## 7. Accessibility

### 7.1 CRITICAL: Zero Accessibility Support

**No accessibility modifiers are used anywhere in the entire codebase.** A project-wide grep for `accessibilityLabel`, `accessibilityHint`, `accessibilityValue`, `accessibilityElement`, and `accessibilityHidden` returned zero results across all 70+ Swift files.

This means:
- VoiceOver users cannot use the app at all
- Interactive elements have no labels
- Decorative images are not hidden from VoiceOver
- Custom components (ManaGemView, StatTile, etc.) are opaque to assistive technology

### 7.2 No Dynamic Type Support

A project-wide grep for `DynamicType`, `dynamicTypeSize`, and `sizeCategory` returned zero results. Every text element uses fixed `.font(.system(size: N))` with hardcoded point sizes. The app will not respect the user's preferred text size from iOS Settings.

**Count of fixed-size font calls**: 185+ instances of `.font(.system(size:` across 23 view files.

### 7.3 Specific Accessibility Issues

| Issue | File | Severity |
|---|---|---|
| Play button has no accessibilityLabel | `Views/Home/HomeView.swift` | High |
| Stat tiles (Wins/Cards/Dust) are not grouped as accessible elements | `Views/Home/HomeView.swift` | Medium |
| ManaGemView shows a number visually but has no accessibility value | `Views/Components/ManaGemView.swift` | High |
| Card grid items have no accessibility labels describing the card | `Views/Components/CardView.swift` | High |
| Faction picker cards have no accessibility traits | `Views/Onboarding/FactionPickerView.swift` | High |
| Mission progress bars have no accessibility value | `Views/Home/DailyMissionsView.swift` | Medium |
| Evolution progress bar has no accessibility value | `Views/Collection/CardDetailView.swift` | Medium |
| Battle HUD elements (HP, mana, instability) have no labels | `Views/Battle/BattleContainerView.swift` | High |
| Hand cards in battle have no accessibility labels | `Views/Battle/BattleContainerView.swift` | High |
| Channel direction toggle (ORDER/CHAOS) has no traits | `Views/Evolution/ModifierPickerView.swift` | Medium |
| Keyword badges have no accessibility descriptions | `Views/Components/KeywordBadgeView.swift` | Medium |
| Pack opening cards have no accessibility labels | `Views/Shop/CardPackOpeningView.swift` | Medium |
| Surrender/Graveyard buttons in battle HUD have no labels | `Views/Battle/BattleContainerView.swift` | High |
| Shard counter icons in shop header have no labels | `Views/Shop/ShopView.swift` | Medium |
| Subscription tier comparison table has no accessibility structure | `Views/Shop/SubscriptionView.swift` | Medium |
| Deck row validity badge has no accessibility | `Views/Collection/DeckListView.swift` | Low |
| Rank color circle has no label | `Views/Home/HomeView.swift` | Low |
| Toast notifications may not be announced by VoiceOver | `Extensions/View+Loading.swift` | Medium |
| Error/Loading/Empty states should be announced as live regions | `Extensions/View+Loading.swift` | Medium |

### 7.4 Color Contrast

The dark theme generally has good contrast:
- Primary text (`#FFFFFF`) on primary bg (`#0D0D0D`): ratio ~21:1 (excellent)
- Secondary text (`#AAAAAA`) on primary bg (`#0D0D0D`): ratio ~10.8:1 (excellent)
- Tertiary text (`#888888`) on primary bg (`#0D0D0D`): ratio ~5.8:1 (passes AA)
- **Disabled text** (`#555555`) on primary bg (`#0D0D0D`): ratio ~2.7:1 (**fails** WCAG AA 4.5:1 for normal text)
- Disabled text (`#555555`) on tertiary bg (`#1A1A1A`): ratio ~2.2:1 (**fails** WCAG AA)

**Disabled text color needs to be lighter** (at least `#767676` for 4.5:1 ratio against `#0D0D0D`).

---

## 8. Font Specification Violations

### 8.1 Spec Requires Cinzel + Alegreya, App Uses System Fonts

Per CLAUDE.md:
> **Fonts**: Cinzel (card names, headers -- classical display font) + Alegreya (body text, flavor text, stats -- readable serif). Both from Google Fonts.

**Actual implementation**:
- **SwiftUI**: Uses `.font(.system(size: N, weight: W))` everywhere (San Francisco system font). No Cinzel or Alegreya references found.
- **SpriteKit**: Uses `AvenirNext-Bold/Heavy/Medium/Regular` (defined in `SK.Fonts`). No Cinzel or Alegreya references found.

Neither Cinzel nor Alegreya appear anywhere in the codebase. The custom fonts have not been integrated.

**Impact**: The app looks generic/system-default rather than having the specified fantasy card game aesthetic. This is a polish gap that affects the entire app's visual identity.

**To fix**:
1. Add Cinzel and Alegreya `.ttf`/`.otf` files to the Xcode project
2. Register them in `Info.plist` under `UIAppFonts`
3. Create font constants (e.g., `Font.cinzel(size:)`, `Font.alegreya(size:)`)
4. Replace `.font(.system(size:))` calls for headers/titles with Cinzel and body/flavor text with Alegreya
5. Update `SK.Fonts` to reference Cinzel/Alegreya instead of AvenirNext

---

## 9. SwiftUI to SpriteKit Visual Gaps

### 9.1 Font Family Mismatch

SwiftUI views use **San Francisco** (system font). SpriteKit nodes use **AvenirNext**. Neither matches the spec (Cinzel + Alegreya). When the battle HUD (SwiftUI overlay) sits on top of the battle scene (SpriteKit), users see two different font families on the same screen.

### 9.2 Color Application Approach

SwiftUI views consistently use named `Color.*` constants. SpriteKit nodes mostly use inline `UIColor(hex:)`. While the hex values match, the approach is fragile and makes it harder to verify visual consistency.

### 9.3 Card Rendering Discrepancy

Cards are rendered differently in SwiftUI vs SpriteKit:
- **SwiftUI** (`CardGridItemView`, `HandCardView`): Uses `AsyncImage` for art, SwiftUI text labels, `Color.tierColor()` borders
- **SpriteKit** (`CreatureNode`): Uses `SKSpriteNode` with manual layout, `SKLabelNode` with AvenirNext fonts, `UIColor(hex:)` borders

The hand cards in battle appear in **both** systems simultaneously:
- `HandScrollView` (SwiftUI overlay) renders `HandCardView` components
- `HandNode` / `HandCardNode` (SpriteKit) exist but may not be used since the hand is SwiftUI-rendered in `BattleContainerView`

This dual implementation may cause confusion about which system is authoritative for hand card rendering.

### 9.4 Corner Radius Discrepancy

- SwiftUI cards use `cornerRadius(8)` for grid items, `cornerRadius(12)` for section cards
- SpriteKit board slots use `slotCornerRadius: 6`
- SpriteKit hand cards use hardcoded corner radius values

### 9.5 Background Color Application

- SwiftUI: `Color.bgPrimary` (`#0D0D0D`) via `.background(Color.bgPrimary)`
- SpriteKit BattleScene: `UIColor(hex: "#0D0D0D")` as inline value instead of `SK.Colors.background` (which is `UIColor.black` -- **a different color!**)

`SK.Colors.background = UIColor.black` (`#000000`) but `Color.bgPrimary = Color(hex: "#0D0D0D")`. The BattleScene actually uses the correct `#0D0D0D` via inline hex, but `SK.Colors.background` is set to `.black` which is `#000000`. This means any SpriteKit code that does use `SK.Colors.background` gets the wrong shade.

### 9.6 Opacity vs Alpha

SwiftUI uses `.opacity(0.15)` for tinted backgrounds. SpriteKit uses `.withAlphaComponent(0.15)`. Values match, which is good, but the approach is duplicated across the two frameworks.

---

## 10. Additional Polish Issues

### 10.1 Placeholder Content

| Location | Issue |
|---|---|
| `ContentView.swift:73` | Achievements destination is `Text("Achievements")` -- bare placeholder |
| `ProfileView.swift:241` | Faction mastery progress is hardcoded to `0.0` width (`geometry.size.width * 0.0`) |
| `ProfileView.swift:251` | Faction mastery level is hardcoded to `"Lv. 0"` |
| All card art | Uses `AsyncImage` but many cards have no art URL -- shows photo icon placeholder |

### 10.2 Missing Haptic Feedback

CLAUDE.md mentions `UIFeedbackGenerator` wrapped in `HapticManager`, and doc 07 specifies haptic feedback. No haptic calls were found in any view file (grep for `haptic`, `feedback`, `UIImpactFeedbackGenerator` returned no results in Views/).

### 10.3 Missing Loading State for PostMatch

`PostMatchView` loads match results but shows a plain spinner with no card background or branding during loading. Other loading states use `LoadingView` which is styled.

### 10.4 Inconsistent Button Patterns

Primary action buttons use varying styles:
- Home play button: Gradient background with border stroke
- Evolve button: Solid gold (`Color.tauntGold`) with black text
- PostMatch continue: Solid ironwright with white text
- Pack open button: Solid pack color with black text
- Subscription purchase: Solid tier color with black text
- Error retry: Solid `borderActive` with white text

Consider standardizing a `PrimaryButton` view component.

---

## 11. Recommendations (Priority Order)

### P0 -- Must Fix Before Launch

1. **Accessibility: Add VoiceOver labels** to all interactive elements (buttons, cards, stat displays). Apple may reject the app for insufficient accessibility.
2. **Fix disabled text contrast**: Change `textDisabled` from `#555555` to at least `#767676` to pass WCAG AA.
3. **Build AchievementsView** or remove the NavigationLink from ProfileView to prevent users hitting a blank screen.
4. **Fix CardDetail sheet in CollectionView** to pass the selected card to `router.navigateToCardDetail()`.

### P1 -- Should Fix Before Launch

5. **Integrate Cinzel + Alegreya fonts** per the design spec. This affects the entire visual identity.
6. **Consolidate SpriteKit hardcoded colors** to use `SK.Colors` constants (40+ inline hex values to replace).
7. **Fix `SK.Colors.background`** from `UIColor.black` to `UIColor(hex: "#0D0D0D")` to match SwiftUI.
8. **Add graveyard sheet** to `BattleContainerView` or disable the graveyard button.
9. **Add bottom padding to ShopView** scroll content (80pt like other tab screens).

### P2 -- Polish Before Launch

10. **Standardize horizontal padding** to 16pt across all screens (fix 12pt/8pt/6pt/20pt variants).
11. **Change SettingsView title display mode** from `.large` to `.inline` for consistency.
12. **Add Dynamic Type support** for at least the main text styles (this is a larger effort).
13. **Replace `.textFieldStyle(.roundedBorder)`** with custom dark-themed text fields.
14. **Add haptic feedback** for key interactions (card play, evolution, pack opening).
15. **Extract mana gem gradient colors** and subscription tier gradient colors to named constants.
16. **Standardize button styles** into reusable `PrimaryButton` / `SecondaryButton` components.

---

## Revision Log

| Date | Author | Change |
|---|---|---|
| 2026-02-17 | Claude Code (Opus 4.6) | Initial audit -- W4A UI/UX Polish Audit |

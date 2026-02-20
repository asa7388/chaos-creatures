# Visual Polish — Status Log

## Current Phase: Wave 8 in progress (final wave)
## Started: 2026-02-19
## Plan: [PLAN-visual-polish.md](PLAN-visual-polish.md)

---

## Wave Status

| Wave | Description | Status | Agent ID | Notes |
|---|---|---|---|---|
| **0** | Foundation | **COMPLETE** | main context | CLAUDE.md, Color+Theme, sharp, ImageMagick, node-canvas, Puppeteer |
| **1A** | AI texture generation | **COMPLETE** | a770116 | 38/38 pass (21 regens across 3 iterations), $2.36 total |
| **1B** | Programmatic icons + shapes | **COMPLETE** | aa081ed | 86 icons via node-canvas, $0 |
| **1C** | Font integration (Bebas Neue + Fira Sans) | **COMPLETE** | a990a22 | 3 fonts, CardFont.swift + SpriteKit constants updated, $0 |
| **2** | SpriteKit card parity | **COMPLETE** | a3baf91 | CreatureNode + HandCardNode texture layers |
| **3** | Screen backgrounds | **COMPLETE** | a2fdce4 | 8 screens textured, CardDetailView rewritten |
| **4** | Faction-specific card frames | **COMPLETE** | main | Faction borders, text panels, stat icons, decorative accents |
| **5** | UI chrome | **COMPLETE** | main + 3 agents | Panel modifiers, button styles, custom icons, audit fixes |
| **6** | Card states + interactions | **COMPLETE** | 3 agents | Parallax, expand, destruction, damage stamps, lava pulse, exhausted state |
| **7** | Rarity treatments | **COMPLETE** | 3 agents | Holographic foil, GyroscopeManager, 5-tier SwiftUI + SpriteKit treatments |
| **8** | Settings + final polish | **IN PROGRESS** | 3 agents | Settings redesign, CardFrameView polish, currency display, off-white sweep |

## Audit Status

| Audit | After Wave | Status | Result |
|---|---|---|---|
| Asset quality | 1A, 1B | PENDING | — |
| Visual parity | 2 | PENDING | — |
| Screen texture | 3 | PENDING | — |
| Faction identity | 4 | PENDING | — |
| UI chrome consistency | 5 | PASS | 4 issues found and fixed |
| **5-agent deep audit** | 0-5 | **PASS** | 17 issues found: 3 P0 + 6 P1 + 8 P2 — all P0/P1 resolved |
| Performance | 2, 4, 6, 7 | PENDING | — |
| Immersion (final) | 8 | PENDING | — |
| **Screenshot vs Design Guide** | 8 | PENDING | Compare Simulator screenshots against 13-visual-design-guide.md Sections 1-17 |

---

## Detailed Log

### 2026-02-19

**Wave 0: Foundation — COMPLETE**

- [x] 0A: Saved design guide to `docs/design/13-visual-design-guide.md` (v1.1, 17 sections)
- [x] 0B: CLAUDE.md full refresh
  - Removed 2 trademark references (MTG, Magic: The Gathering)
  - Added copyright/trademark prohibition rule
  - Updated migration count (14→18), Edge Function count, scripts count (58+)
  - Updated current phase to "polish and audit"
  - Marked faction expansion as complete
  - Added 13-visual-design-guide.md to repo structure
- [x] 0C: Color+Theme.swift updated
  - 5 factions × 5 colors each (primary, dark, accent, highlight, frameTint)
  - 10 sub-faction accent colors
  - `appAccent` warm gold (#C9A84C) preserved for non-faction UI
  - Added `factionFrameTint()`, `factionAccent()` helper functions
  - UIColor extensions updated for SpriteKit parity
- [x] 0D: Installed sharp (`npm install sharp --save-dev`)
- [x] 0E: Installed ImageMagick 7.1.2-13, node-canvas, Puppeteer

**Gap Audit Completed**

Ran general-purpose agent to compare v3 plan against design guide. Key gaps found:
- Icons entirely missing (~70+ assets) → Resolved: Wave 1B uses node-canvas
- Sub-faction textures underspecified (5→9) → Resolved: 9 sub-faction borders in Wave 1A
- Card back illustration missing → Added to Wave 1A
- 2 fonts missing (stat numeral + UI sans-serif) → Added Wave 1C
- Metal surface variations missing → Added 5 metals to Wave 1A
- Multiple interaction specs missing → Added to Wave 6

**Tooling Upgrade Decision**

User asked: "Are we making design sacrifices because of the currently available tool stack?"
Analysis: Yes — sharp alone can't do Photoshop-level compositing (emboss, bevel, inner shadow), and AI generation produces fuzzy raster icons instead of clean vectors.
Solution: Added 3 tools:
- ImageMagick → frame compositing, emboss, procedural patterns
- node-canvas → clean vector icons, stat containers, geometric shapes
- Puppeteer → complex layered frame compositions via HTML/CSS rendering

Plan updated from v3 → v4 to incorporate new tools and close all identified gaps.

**Wave 1A: AI Texture Generation — Round 1 Complete**

- 38/38 textures generated at $1.52 total (agent used single-shot, not iterative)
- Script: `scripts/generate-visual-textures.mjs`
- Previews: `scripts/preview/visual-textures/`
- New Xcode asset folders created: `TextPanels/`, `UIComponents/`

Quality review results (24 pass, 14 need regen):

| Texture | Status | Issue |
|---|---|---|
| `bg-dark-leather` | PASS | Rich bookbinding leather |
| `bg-aged-wood` | PASS | Dark vertical grain hardwood |
| `bg-dark-parchment` | REGEN | Too light/cream for "dark" parchment Settings bg |
| `bg-polished-stone` | PASS | Dark slate with veining |
| `bg-play-mat-felt` | PASS | Dark felt with cosmic specs |
| `bg-metallic-foil` | PASS | Crinkled foil wrapper |
| `border-ironwright` | REGEN | Bright specular hotspot, not matte industrial |
| `border-fey-verdant` | REGEN | Chunky moss patches, not thin veins in wood |
| `border-fey-hollow` | PASS | White birch bark with peel lines |
| `border-demonic-furnace` | PASS | Cracked obsidian + magma veins |
| `border-demonic-bureaucracy` | PASS | Smooth dark obsidian |
| `border-celestial-knights` | REGEN | Bubble/crater surface, not polished gold |
| `border-celestial-chosen` | PASS | Rich brushed warm gold |
| `border-endless-cabals` | REGEN | Reads as dry earth, not aged bone |
| `border-endless-spectres` | REGEN | Transparency conversion killed content (white) |
| `tp-ironwright` | PASS | Dark matte gunmetal |
| `tp-fey-verdant` | REGEN | Has random objects (bowl, shears), not texture |
| `tp-fey-hollow` | REGEN | Soap bubbles, not frost |
| `tp-demonic-furnace` | PASS | Dark charred surface |
| `tp-demonic-bureaucracy` | PASS | Aged sepia parchment |
| `tp-celestial-knights` | PASS | Warm golden parchment |
| `tp-celestial-chosen` | PASS | Radiant cream fabric |
| `tp-endless-cabals` | PASS | Yellowed aged parchment |
| `tp-endless-spectres` | REGEN | White/invisible, same transparency issue |
| `metal-gold` | PASS | Rich polished gold |
| `metal-silver` | PASS | Clean brushed silver |
| `metal-bronze` | PASS | Aged patina bronze |
| `metal-iron` | REGEN | Ornate wrought iron gate, not flat surface |
| `metal-obsidian` | REGEN | Curved sphere shape, not flat surface |
| `tex-cardstock-grain` | REGEN | Too smooth, minimal fiber grain (low priority) |
| `tex-canvas-weave` | PASS | Subtle off-white linen |
| `tex-parchment` | PASS | Aged with foxing + torn edges |
| `ui-button-cardstock` | PASS | Embossed raised cardstock |
| `ui-button-cardstock-pressed` | REGEN | Grid of brick shapes, not single button |
| `ui-panel-leather` | PASS | Tooled leather with ornate corners |
| `ui-wax-seal` | PASS | Red wax dripping seal |
| `card-back-chaos` | PASS | Impasto cosmic vortex |
| `fx-spectral-fog` | REGEN | White/invisible, transparency issue |

Root causes:
1. Transparency conversion (3 failures) — luminance-to-alpha doesn't work
2. Objects in texture (3 failures) — prompts need "no objects, surface only"
3. Wrong material (4 failures) — prompts need to be more specific
4. Non-tileable (2 failures) — directional lighting, centered features
5. Too light (2 failures) — color correction needed

**Plan Updated to v4.1**

Added mandatory iterative protocol section to plan:
- Generate → Review → Lock cycle enforced
- Common failure patterns documented
- ImageMagick procedural fallbacks for stubborn assets
- Budget safety rails ($6 hard cap)
- Puppeteer frame rendering made explicit (not optional)
- Holographic foil via ImageMagick procedural (not AI)
- Chaos Mote animation via node-canvas/SpriteKit (not AI)
- Destruction crack overlay via ImageMagick procedural

**Wave 1B: Programmatic Icons — COMPLETE**

- 86 icons generated via node-canvas ($0 cost)
- Script: `scripts/generate-icons-v2.mjs`
- Previews: `scripts/preview/icons-v2/` (raw + embossed variants)
- All installed to Xcode Assets.xcassets
- Categories:
  - ATK icons (10): faction-tinted blade shards
  - HP icons (10): faction-tinted cracked shields
  - Chaos Motes (10): faction-colored radial gradient orbs
  - Instability indicator (1): diamond crystal
  - Stat Containers (5): hex (Ironwright), leaf (Fey), shard (Demonic), shield (Celestial), skull (Endless)
  - Keyword icons (20): shield, lifesteal, flying, reach, deathtouch, taunt, piercing, haste, regenerate, poison, stun, burn, freeze, drain, silence, ward, double-strike, trample, vigilance, menace
  - Faction Emblems (5): gear-flower, moon-tree, horned skull, shield-starburst, phylactery-eye
  - Sub-Faction Emblems (10): 2 per faction
  - Rarity indicators (5): common through legendary pips
  - UI Nav (6): home, battle, collection, shop, profile, settings
  - Card State (4): damaged, buffed, exhausted, shielded

**Wave 1A-fix + 1C Launched (parallel)**

- 1A-fix: Regenerating 14 failed textures with improved prompts
  - Green chroma key for transparency textures (instead of luminance-to-alpha)
  - Hyper-specific material descriptions for wrong-material failures
  - "No objects" enforcement for object-in-texture failures
  - Budget cap: $2.00 for this regen pass
- 1C: Font integration (Bebas Neue Bold + Fira Sans Regular/SemiBold)
  - Download from Google Fonts
  - Register in Info.plist
  - Create Typography.swift constants
  - Update CardFrameView stat numbers

**Wave 1A-fix: Texture Regeneration — COMPLETE**

- 14 textures regenerated across 3 iterations, $0.84 total
- Scripts: `scripts/regen-failed-textures.mjs`, `regen-failed-iter2.mjs`, `regen-cabals-iter3.mjs`
- Previews: `scripts/preview/visual-textures/regen/`
- All 14 installed to Xcode Assets.xcassets (replacing originals)
- Key lessons:
  - Transparency: black bg + luminance-to-alpha works; green chroma key does NOT (AI generates varied greens)
  - Objects: "extreme close-up macro filling entire frame" prevents isolated object generation
  - Bone texture: never use "skull" — AI generates skull objects. Use "aged animal bone material surface"
  - Dark tones: prefix "VERY DARK" + explicit "NOT light NOT cream NOT bright" negatives

**Wave 1C: Font Integration — COMPLETE**

- 3 font files downloaded from Google Fonts GitHub (OFL license, free)
  - BebasNeue-Regular.ttf — condensed display for stat numerals
  - FiraSans-Regular.ttf — UI labels, button text
  - FiraSans-SemiBold.ttf — emphasized UI labels
- Registered in Info.plist UIAppFonts
- Added to Xcode project build phases
- CardFont.swift updated: `.statNumber(size:)`, `.uiLabel(size:)`, `.uiLabelBold(size:)`
- SpriteKitConstants.swift updated: SK.Fonts.statNumber, uiLabel, uiLabelBold
- CardFrameView MedallionBadge now uses Bebas Neue for stat numbers
- Build verified: ** BUILD SUCCEEDED **

**Wave 5: UI Chrome — COMPLETE**

Foundation (main context):
- Created 3 panel view modifiers: `.leatherPanel()`, `.parchmentPanel()`, `.metalPanel()`
- Created 2 button styles: `CardstockButtonStyle`, `MetalButtonStyle`
- Added `AppTab.customIconName` for custom tab bar icons
- Updated ContentView tab items to use custom FactionIcons/ assets
- Changed tab tint from `.ironwright` to `.appAccent`
- Redesigned ModeSelectionView with custom icons, leather panels, felt background

Agent 1 — ShopView polish:
- PackRow: renamed `icon` to `iconAsset`, asset catalog icons, `.leatherPanel()`
- Purchase button: chaos dust icon next to price
- Free tier subscription card: leather texture overlay
- Shards section: parchment panel + instability diamond icon

Agent 2 — HomeView + ProfileView polish:
- HomeView: greeting (`.leatherPanel()` + profile icon), play button (`.metalPanel()` + battle icon), stats (`.leatherPanel()` + asset icons), toolbar `gearshape.fill`
- ProfileView: player card (`.leatherPanel()` + profile icon), rank (`.parchmentPanel()` + battle icon), stats (`.leatherPanel()`), faction mastery (`.leatherPanel()` + emblem assets), achievements (`.leatherPanel()` + battle icon), toolbar `gearshape.fill`
- StatTile: added `isTemplate` parameter for tintable vs pre-colored icons

Agent 3 — Remaining views:
- CollectionView: toolbar `gearshape.fill`
- DailyMissionsView: `.cardBackground()` → `.parchmentPanel()`
- DeckListView: DeckRowView `.cardBackground()` → `.leatherPanel()`

Audit (consistency agent):
- Found 4 issues, all fixed:
  1. CardDetailView: 5x `.cardBackground()` → `.leatherPanel()`
  2. ShopView toolbar: `gearshape` → `gearshape.fill`
  3. DeckListView toolbar: `gearshape` → `gearshape.fill`
  4. DeckListView: added `bg-dark-leather` background texture
- Build: passed after `.foregroundStyle` → `.foregroundColor` fix in ShopView

---

## Budget Tracking

| Expense | Amount | Running Total |
|---|---|---|
| Wave 1A round 1 (38 textures × $0.04) | $1.52 | $1.52 |
| Wave 1A-fix iter1 (13 regens) | $0.52 | $2.04 |
| Wave 1A-fix iter2 (7 regens) | $0.28 | $2.32 |
| Wave 1A-fix iter3 (1 regen) | $0.04 | $2.36 |
| Wave 1B (icons, node-canvas) | $0.00 | $2.36 |
| Wave 1C (fonts, Google Fonts) | $0.00 | $2.36 |
| Hard cap: | $6.00 | — |

---

## Files Modified (Running List)

### Wave 0
- `CLAUDE.md` — 8 edits (trademark removal, stats, copyright rule, phase update)
- `ChaosCreatures/ChaosCreatures/Extensions/Color+Theme.swift` — Full faction color overhaul
- `docs/design/13-visual-design-guide.md` — New file (design guide v1.1)
- `package.json` — sharp, canvas, puppeteer added as devDependencies
- `docs/design/PLAN-visual-polish.md` — New file (plan v4)
- `docs/design/STATUS-visual-polish.md` — New file (this status log)

### Wave 1A (Textures)
- `scripts/generate-visual-textures.mjs` — New file (38 texture definitions + fal.ai caller)
- `scripts/regen-failed-textures.mjs` — New file (14 regen definitions, iter1)
- `scripts/regen-failed-iter2.mjs` — New file (7 regen definitions, iter2)
- `scripts/regen-cabals-iter3.mjs` — New file (1 regen, iter3)
- `scripts/install-regen-textures.mjs` — New file (installs regens to Xcode)
- `Assets.xcassets/UIBackgrounds/` — 6 screen background textures
- `Assets.xcassets/CardTextures/` — 17 textures (borders, metals, card textures)
- `Assets.xcassets/TextPanels/` — 9 faction text panel textures
- `Assets.xcassets/UIComponents/` — 4 UI element textures
- `Assets.xcassets/CardBacks/` — 1 card back illustration

### Wave 1B (Icons)
- `scripts/generate-icons-v2.mjs` — New file (86 icon definitions via node-canvas)
- `Assets.xcassets/StatIcons/` — 31 stat icons (ATK, HP, chaos motes, instability, containers)
- `Assets.xcassets/KeywordIcons/` — 20 keyword icons
- `Assets.xcassets/FactionEmblems/` — 5 faction + 10 sub-faction emblems
- `Assets.xcassets/FactionIcons/` — Rarity pips, UI nav, card state icons

### Wave 1C (Fonts)
- `ChaosCreatures/Resources/Fonts/BebasNeue-Regular.ttf` — New file
- `ChaosCreatures/Resources/Fonts/FiraSans-Regular.ttf` — New file
- `ChaosCreatures/Resources/Fonts/FiraSans-SemiBold.ttf` — New file
- `ChaosCreatures/Config/Info.plist` — 3 UIAppFonts entries added
- `ChaosCreatures.xcodeproj/project.pbxproj` — Font build references added
- `ChaosCreatures/Config/CardFont.swift` — statNumber, uiLabel, uiLabelBold accessors
- `ChaosCreatures/SpriteKit/Utilities/SpriteKitConstants.swift` — SK.Fonts extensions
- `ChaosCreatures/Views/Components/CardFrameView.swift` — MedallionBadge uses Bebas Neue

### Wave 5 (UI Chrome)
- `ChaosCreatures/Extensions/View+Loading.swift` — 3 panel modifiers, 2 button styles
- `ChaosCreatures/App/AppState.swift` — AppTab.customIconName property
- `ChaosCreatures/App/ContentView.swift` — Custom tab icons, tint, ModeSelectionView redesign
- `ChaosCreatures/Views/Shop/ShopView.swift` — Pack rows, currency, shards, subscription, toolbar
- `ChaosCreatures/Views/Home/HomeView.swift` — All sections textured, custom icons, StatTile refactor
- `ChaosCreatures/Views/Profile/ProfileView.swift` — All sections textured, emblem assets, toolbar
- `ChaosCreatures/Views/Collection/CollectionView.swift` — Toolbar icon
- `ChaosCreatures/Views/Home/DailyMissionsView.swift` — Parchment panel
- `ChaosCreatures/Views/Collection/DeckListView.swift` — Leather panel, toolbar, background texture
- `ChaosCreatures/Views/Collection/CardDetailView.swift` — 5x cardBackground → leatherPanel

### Post-Wave 5: Deep Audit + Remediation

**5 parallel audit agents** ran against Waves 0-5 output:
1. Plan adherence (aa539c7): Waves 0-4 fully complete, Wave 5 has 4 minor incomplete items
2. Design guide compliance (a170e93): 78% → ~95% after fixes
3. Asset usage completeness (aedf4dc): 2 broken refs found, 137 orphaned (most reserved for future)
4. SpriteKit vs SwiftUI parity (a168876): HIGH parity, 4 P1 minor mismatches
5. Code quality + TODOs (a958df3): ProfileView placeholder, debug prints, hardcoded colors

**P0 Fixes (3):**
- `Color+Theme.swift`: `textPrimary` changed from `Color.white` to `Color(hex: "#F0EAD6")` — fixes 60+ views
- `ShopView.swift`: `instability-diamond` → `instability-indicator` (2 broken refs)
- `CardPackOpeningView.swift`: `card-back-universal` → `CardBacks/card-back-universal` (missing path)

**P1 Fixes (6 agents):**
- System fonts: Confirmed all `.font(.system(` are on SF Symbol icons only — no text uses system fonts
- Flat backgrounds: Added texture overlays to CollectionView, MatchmakingView, PostMatchView
- Warm black text: Added `Color.textDark (#1C1917)`, replaced 11 `.foregroundColor(.black)` instances
- Contact shadows: Created `.contactShadow()` modifier, replaced 3 floating shadows
- Debug prints: Removed 3 print statements from EmptyStateView, ErrorView, FactionPickerView
- Hardcoded white: Replaced 23 `.foregroundColor(.white)` with `.foregroundColor(.textPrimary)` across 12 files
- ProfileView: Fixed faction mastery progress bar (was hardcoded to 0.0), standardized fallbacks to "Adventurer"

**Final audit after remediation: ALL PASS**
- 0 `.foregroundColor(.white)` in Views (except ManaGemView — intentional for contrast)
- 0 `.foregroundColor(.black)` in Views
- 0 `textPrimary = Color.white` definitions
- 0 debug prints outside #Preview blocks

### SF Symbol → Custom Icon Replacement

**Phase 1 — Replace with existing Wave 1B assets (4 parallel agents):**
- Keywords: 9 SF Symbols → `KeywordIcons/kw-*` (KeywordBadgeView, CardFrameView, CardDetailView, ModifierPickerView)
- Factions: 5 SF Symbols → `FactionEmblems/emblem-*` (FactionPickerView, ProfileView, DeckListView)
- Tab bar: 5 custom icons already wired via AppTab.customIconName
- Battle HUD: HP/ATK/CM/instability stat icons → `StatIcons/*` (BattleContainerView, CollectionView, PostMatchView, EvolutionFlowView)

**Phase 2 — Generate 39 new UI icons + wire up (5 parallel agents):**
- Generated 39 icons via node-canvas (`scripts/generate-ui-icons.mjs`) at $0 cost
- Categories: battle(4), post-match(2), onboarding(5), packs(3), subscriptions(3), missions(6), achievements(5), triggers(6), evolution(3), misc(2)
- Wired across 16 files: OnboardingView, EvolutionFlowView, ModifierPickerView, EvolutionRevealView, ShopView, CardPackOpeningView, SubscriptionView, DailyMissionsView, AchievementsView, PostMatchView, TutorialOverlayView, BattleContainerView, BattleViewModel, CardDetailView, HomeView, MatchmakingView, CardFrameView

**Final audit: 60 SF Symbols remaining**
- 29 KEEP (standard UI chrome: checkmark, xmark, gearshape, chevron, arrow, magnifyingglass, etc.)
- 23 BORDERLINE/low-priority (photo placeholders, archivebox graveyard, flag surrender, empty states)
- 8 game-concept icons left as SF Symbols (no matching custom asset yet — future work)
- 0 broken UIIcons/ references
- 4 unused UIIcons (ui-sort-rarity — reserved for future)

### Wave 6: Card States & Interactions — COMPLETE

**3 parallel implementation agents:**
1. HandCardNode parallax + card expand (a456623): Art parallax on pan (3px offset), tap-to-expand with overlay + detail text
2. CreatureNode destruction + tapped state (acf5421): 3-phase death (cracks→desaturate→drift), Endless ghost afterimage, exhausted rotation + hourglass glyph, contact shadows
3. Damage stamps + lava pulse (a32e5b4): HP/ATK stamp animation (emboss pulse, red/gold), card shake on damage, gold sparkles on buff, Demonic lava vein pulse

**Audit found 3 unwired features → fix agent (a2fb350):**
- Exhausted state: wired `setExhausted(data.hasAttacked)` in syncBoard
- Hand parallax: SwiftUI-native implementation in HandScrollView (GeometryReader + normalized offset)
- Card expand: Long-press gesture (0.4s) triggers BattleCardExpandOverlay with card stats/keywords

**Files modified:**
- `SpriteKit/Utilities/SpriteKitConstants.swift` — SK.HandParallax + SK.CardExpand constants
- `SpriteKit/Nodes/HandCardNode.swift` — Parallax offset, card expand, art crop node
- `SpriteKit/Nodes/HandNode.swift` — Parallax + expand propagation methods
- `SpriteKit/Nodes/CreatureNode.swift` — Destruction, tapped state, contact shadow, damage stamps, lava pulse
- `SpriteKit/Actions/DeathAction.swift` — Wired to new playDestruction()
- `SpriteKit/Scenes/BattleScene.swift` — Stat change detection, lava pulse setup, exhausted state
- `Views/Battle/BattleContainerView.swift` — SwiftUI hand parallax, long-press card expand overlay

### Wave 7: Rarity Treatments — COMPLETE

**3 parallel implementation agents:**
1. Holographic foil asset (a0785bc): 512x512 procedural ImageMagick texture (plasma + emboss + metallic sheen)
2. SwiftUI rarity treatments (a5da338): GyroscopeManager singleton (CMMotion + Simulator sine fallback), RarityBorderModifier with 5 tiers, RarityFoilBorderMask shape, legendaryArtBleed, canvasWeaveOpacity per tier
3. SpriteKit rarity treatments (a84b582): applyRarityTreatment() in CreatureNode + HandCardNode, 5 tiers using SKShapeNode + SKAction.colorize (no CIFilter, no SKEmitterNode)

**Audit: ALL 11 items PASS.** No unwired features, no performance violations.

**Rarity tier summary:**
- Common: matte (no treatment)
- Uncommon: 1px silver inner border (#C0C0C0, 0.6α)
- Rare: 1.5px gold inner border (#FFD700, 0.7α) + pulsing glow
- Epic: rainbow shimmer + holographic foil overlay (gyroscope-driven in SwiftUI, SKAction.colorize in SpriteKit)
- Legendary: gold prismatic border + full foil + extended art (+4pt) + sparkle dots + dual golden shadow

**Files created:**
- `Services/GyroscopeManager.swift` — CoreMotion singleton
- `Resources/Assets.xcassets/RarityEffects/holographic-foil.imageset/` — procedural foil texture

**Files modified:**
- `SpriteKit/Utilities/SpriteKitConstants.swift` — SK.RarityEffects tier-specific constants
- `SpriteKit/Nodes/CreatureNode.swift` — applyRarityTreatment(), spawnLegendarySparkles()
- `SpriteKit/Nodes/HandCardNode.swift` — applyRarityEffect() rewrite for 5 tiers
- `Views/Components/CardFrameView.swift` — RarityBorderModifier, RarityFoilBorderMask
- `ChaosCreatures.xcodeproj/project.pbxproj` — GyroscopeManager + CoreMotion framework

**Commit:** `03b2a2a` — build(polish): Wave 7 — rarity treatments across SwiftUI + SpriteKit

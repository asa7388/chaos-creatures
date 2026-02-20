# Visual Polish — Status Log

## Current Phase: Wave 2+3 (SpriteKit + Screen Backgrounds)
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
| **2** | SpriteKit card parity | **IN PROGRESS** | a3baf91 | CreatureNode + HandCardNode texture layers |
| **3** | Screen backgrounds | **IN PROGRESS** | a2fdce4 | 8 screens getting textured backgrounds |
| **4** | Faction-specific card frames | BLOCKED (needs 2) | — | |
| **5** | UI chrome | BLOCKED (needs 1A) | — | |
| **6** | Card states + interactions | BLOCKED (needs 2) | — | |
| **7** | Rarity treatments | BLOCKED (needs 4) | — | |
| **8** | Settings + final polish | BLOCKED (needs 5/6/7) | — | |

## Audit Status

| Audit | After Wave | Status | Result |
|---|---|---|---|
| Asset quality | 1A, 1B | PENDING | — |
| Visual parity | 2 | PENDING | — |
| Screen texture | 3 | PENDING | — |
| Faction identity | 4 | PENDING | — |
| Performance | 2, 4, 6, 7 | PENDING | — |
| Immersion (final) | 8 | PENDING | — |

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

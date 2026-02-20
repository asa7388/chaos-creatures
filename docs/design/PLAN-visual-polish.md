# Visual Polish — Implementation Plan v4

## Status: IN PROGRESS
## Last Updated: 2026-02-19

---

## Context

Implementing the Visual Design & Art Direction Guide (v1.1, 17 sections, saved as `docs/design/13-visual-design-guide.md`). Every surface must feel like physical materials — cardstock, canvas, leather, parchment, metal foil.

**Already professional:** CardFrameView (SwiftUI) has wood borders, canvas weave, vellum text panel, bronze medallion badges. Collection screen has felt table. 63 asset imagesets. Cinzel + Alegreya fonts. Rarity glow treatments.

**Budget:** ~$68-102 remaining. Asset generation hard cap: $10.

---

## Tool Stack

| Tool | Purpose | Status |
|---|---|---|
| **sharp** (Node.js) | Color correction, background removal, compositing, tileability fix, resize | Installed |
| **ImageMagick 7** (CLI) | Emboss, bevel, inner shadow, complex blend modes, procedural patterns, texture compositing | Installed |
| **node-canvas** (Node.js) | Programmatic vector icon drawing, clean geometric shapes, stat containers, alpha masks | Installed |
| **Puppeteer** (Node.js) | Headless Chrome rendering of HTML/CSS compositions for complex layered frame templates | Installed |
| **sips** (macOS built-in) | Basic resize, format conversion | Available |
| **ffmpeg** (installed) | Batch conversion, sprite sheets | Available |
| **fal.ai** | AI image generation (FLUX Dev, SDXL Fast, FLUX Pro Kontext) | Available |

### Tool-to-Gap Mapping

| Gap from v3 Audit | Solution Tool | Why |
|---|---|---|
| 70+ icons (ATK/HP variants, keywords, nav, state) | **node-canvas** | Clean vector drawing, perfect consistency, any size |
| Stat container shapes (leaf, skull, hexagonal, etc.) | **node-canvas** | Precise geometric shapes with clean alpha |
| Frame compositing (emboss, bevel, inner shadow) | **ImageMagick** | Full Photoshop-equivalent layer effects |
| Sub-faction border textures (9 variants) | **fal.ai** + **ImageMagick** post-process | AI generates base material, IM adds effects |
| Card frame pre-baking (9 sub-faction × 5 rarity) | **Puppeteer** | HTML/CSS renders complex layered compositions to PNG |
| Procedural patterns (cracks, foil, noise) | **ImageMagick** | Procedural generation (plasma, fractal, gradient) |
| Metal surface variations (gold, silver, bronze, iron, obsidian) | **fal.ai** | Material photography style |
| Card back illustration | **fal.ai** (SDXL + PaletteKnife) | Painterly full illustration |
| Destruction crack overlay | **ImageMagick** | Procedural fracture pattern generation |
| Holographic foil overlay | **ImageMagick** | Procedural rainbow-shift metallic pattern |

### Fonts (Free, OFL Licensed)

| Use | Current | Design Guide Recommends | Action |
|---|---|---|---|
| Card names (display) | Cinzel | Cormorant Garamond, EB Garamond | Keep Cinzel (already integrated, classical serif) |
| Body/effects text | Alegreya | Alegreya, Source Serif Pro | Keep Alegreya (already integrated) |
| Stat numerals | Cinzel (shared) | Oswald Bold, Bebas Neue | **ADD Bebas Neue** (condensed, stamped-metal feel) |
| UI sans-serif | System | Fira Sans, Source Sans Pro | **ADD Fira Sans** (humanist, warm, non-sterile) |

---

## Mandatory Iterative Protocol (All Image Generation Agents)

Every agent that calls fal.ai MUST follow this protocol. No exceptions.

### The Generate-Review-Lock Cycle

```
For each asset:
  1. GENERATE one test image ($0.04)
  2. REVIEW — agent reads the PNG visually and checks:
     - Does it match the material described in the prompt?
     - No unwanted objects, text, or artifacts?
     - No extreme hotspots or uneven lighting?
     - For textures: will it tile? (no dominant center feature)
     - For transparent PNGs: is the transparency actually working?
  3. If FAIL → adjust prompt, REGENERATE (max 3 attempts per asset)
     - If transparency failed: fix the post-process pipeline, not the prompt
     - If wrong material: add stronger negative prompts
     - If objects appeared: add "no objects, no items, surface only" to prompt
  4. If PASS → LOCK the prompt for this asset
  5. POST-PROCESS (sharp/ImageMagick) → install to Xcode
```

### Budget Safety Rails

| Stage | Max Spend | Abort Condition |
|---|---|---|
| First pass (all assets × 1 shot) | $2.00 | — |
| Regen failures (est 30-40% fail) | $1.50 | Any single asset >$0.50 → skip it, use ImageMagick procedural |
| Batch variants (for hero assets only: card back, wax seal) | $0.50 | Only batch assets that passed first-shot review |
| **Total hard cap** | **$6.00** | Stop and reassess if approaching |

### Common Failure Patterns (from Wave 1A Round 1)

These were the actual failures from the first texture pass. Agents MUST guard against them:

1. **Transparency conversion kills content** — Generating fog/spectral effects on black and converting to alpha doesn't work with simple luminance mapping. Fix: generate on green/magenta chroma key background, or use ImageMagick `-fuzz` threshold masking.
2. **Objects appear in texture** — AI interprets "moss-tinted parchment" as a still-life photo with props. Fix: always include "no objects, no items, no tools, surface texture only, macro photography" in prompt.
3. **Non-tileable hotspots** — Directional lighting creates a bright center that won't tile. Fix: always include "even studio lighting, no directional shadows, no specular highlights" in prompt.
4. **Wrong material interpretation** — "Aged bone surface" → cracked dry earth. Fix: be hyper-specific: "human bone cross-section surface, yellowed ossuary wall, visible bone marrow pores."
5. **Grid/pattern instead of single element** — Asking for a "pressed button" produces a grid of buttons. Fix: "single element, centered, isolated."

### Procedural Alternatives (When AI Fails)

If an asset fails 3 generation attempts, switch to ImageMagick procedural generation:

| Asset Type | ImageMagick Alternative |
|---|---|
| Spectral fog | `magick -size 512x512 plasma:gray90-gray60 -blur 0x20 -alpha copy result.png` |
| Metal surfaces | `magick -size 512x512 gradient:color1-color2 -blur 0x1 -noise 2 result.png` |
| Cardstock grain | `magick -size 512x512 -seed N plasma: -blur 0x0.5 -normalize result.png` |
| Bone texture | `magick -size 512x512 plasma:wheat-tan -blur 0x3 -emboss 1 result.png` |

---

## AI Model Catalog

### Image Generation Models (fal.ai)

| Model | Endpoint | Cost | Best For |
|---|---|---|---|
| **FLUX Dev** | `fal-ai/flux/dev` | ~$0.04 | Textures, material surfaces, UI backgrounds |
| **SDXL Fast** | `fal-ai/fast-sdxl` | ~$0.025 | Card art, painterly elements (LoRA support) |
| **FLUX Pro Kontext** | `fal-ai/flux-pro/kontext` | ~$0.10 | Evolution img2img (highest quality) |

### Available LoRAs (SDXL only)

| LoRA | Scale | Best For |
|---|---|---|
| **EldritchPaletteKnife** | 0.9 | Heavy impasto oil painting, painterly borders |
| **ClassipeintXL 2.1** | 1.0 | Detailed oil painting, emblems, creatures |
| **EldritchImpressionismXL 1.5** | 1.0 | Environmental/atmospheric (too loose for icons) |
| **CHSCRT** | 0.8-1.0 | Project-specific trained style |

### Model Selection per Asset Category

| Asset | Primary | Fallback |
|---|---|---|
| Screen background textures | FLUX Dev | — |
| Faction border textures (9) | FLUX Dev | SDXL + PaletteKnife |
| Text panel textures (9) | FLUX Dev | — |
| Metal surfaces (5 metals) | FLUX Dev | — |
| Cardstock/canvas/parchment | FLUX Dev | — |
| Card-back illustration | SDXL + PaletteKnife | SDXL + ClassipeintXL |
| Faction emblems/decorative | SDXL + ClassipeintXL | FLUX Dev |
| Holographic foil | ImageMagick (procedural) | — |
| All icons | node-canvas (programmatic) | — |
| Stat containers | node-canvas (programmatic) | — |
| Crack overlay | ImageMagick (procedural) | — |

---

## Execution Flow

```
Wave 0 (foundation) ✅ COMPLETE
  ↓
Wave 1A (AI texture generation)  ←→  Wave 1B (programmatic icons + shapes)  [parallel]
  ↓ owner visual review (this file documents pass/fail per asset)
Wave 1A-fix (regen failed textures — iterative protocol enforced)
  ↓ asset-quality-auditor (verify all 38 textures + all icons pass)
Wave 1C (font integration — Bebas Neue + Fira Sans)
  ↓
Wave 2 (SpriteKit parity) ←→ Wave 3 (screen backgrounds)  [parallel]
  ↓ visual-parity-auditor + screen-texture-auditor + performance-auditor
Wave 4 (faction frames — Puppeteer pre-bake + runtime selection)
  ↓ faction-identity-auditor + performance-auditor
Wave 5 (UI chrome) ←→ Wave 6 (interactions)  [parallel]
  ↓ performance-auditor
Wave 7 (rarity treatments — holographic foil + gyroscope)
  ↓ performance-auditor
Wave 8 (settings redesign + final polish)
  ↓ immersion-auditor (final walkthrough)
```

---

## Wave 0: Foundation ($0) — COMPLETE

| Task | Status |
|---|---|
| 0A: Save design guide to `docs/design/13-visual-design-guide.md` | Done |
| 0B: CLAUDE.md full refresh (11 issues + copyright rule) | Done |
| 0C: Color+Theme.swift sub-faction colors | Done |
| 0D: Install sharp | Done |
| 0E: Install ImageMagick, node-canvas, Puppeteer | Done |

---

## Wave 1A: AI Texture Generation (~$6-8)

**Agent type:** `general-purpose`

Generate all material textures via fal.ai with iterative testing workflow.

### Texture Manifest

**Screen Backgrounds (6 textures, 1024x1024, tileable)**

| ID | Texture | Material | Screens |
|---|---|---|---|
| `bg-dark-leather` | Dark leather surface | Full-grain bookbinding leather | Home, Profile |
| `bg-aged-wood` | Aged wood table | Dark finished hardwood grain | Deck Builder |
| `bg-dark-parchment` | Dark parchment | Aged vellum, warm cream with foxing | Settings, Onboarding |
| `bg-polished-stone` | Polished dark stone | Dark obsidian/slate surface | Shop |
| `bg-play-mat-felt` | Play mat felt | Dark woven nylon with subtle cosmic pattern | Battle HUD |
| `bg-metallic-foil` | Metallic foil | Reflective metallic wrap | Pack Opening |

**Faction Border Textures (9 textures, 512x512, tileable)**

| ID | Sub-Faction | Material |
|---|---|---|
| `border-ironwright` | Ironwright (both sub-factions) | Brushed steel, bolt rivets |
| `border-fey-verdant` | Verdant Throne | Living wood grain, green moss veins |
| `border-fey-hollow` | Hollow Court | Bone-white birch bark, frost, hairline cracks |
| `border-demonic-furnace` | Furnace Lords | Cracked obsidian, glowing magma veins |
| `border-demonic-bureaucracy` | Obsidian Bureaucracy | Polished obsidian, smooth reflective cold |
| `border-celestial-knights` | Knights of Deliverance | Polished gold and ivory, cathedral filigree |
| `border-celestial-chosen` | Heaven's Chosen | Burning gold, soft radiant edges |
| `border-endless-cabals` | Necromantic Cabals | Aged bone, suture lines, yellowed ossuary |
| `border-endless-spectres` | Lost Spectres | Translucent spectral fog, semi-transparent PNG |

**Faction Text Panel Textures (9 textures, 512x256)**
Matching each border material but darker. Same faction IDs with `-textpanel` suffix.

**Metal Surface Variations (5 metals, 512x512, tileable)**

| ID | Metal | Use |
|---|---|---|
| `metal-gold` | Polished gold | Celestial stat containers, Rare+ borders |
| `metal-silver` | Brushed silver | Uncommon borders, neutral stat containers |
| `metal-bronze` | Aged bronze | Common stat containers, medallion badges |
| `metal-iron` | Dark iron | Ironwright stat containers |
| `metal-obsidian` | Polished obsidian | Demonic stat containers |

**Universal Card Textures (3 textures)**

| ID | Material | Use |
|---|---|---|
| `tex-cardstock-grain` | Matte 300gsm cardstock fiber | Full-card overlay at 5-8% opacity |
| `tex-canvas-weave` | Linen canvas warp/weft | Art window overlay at 3-5% opacity |
| `tex-parchment` | Warm cream parchment with foxing | Text box background |

**UI Component Textures (4 textures)**

| ID | Material | Use |
|---|---|---|
| `ui-button-cardstock` | Embossed cardstock (normal state) | Button surfaces |
| `ui-button-cardstock-pressed` | Depressed cardstock (pressed state) | Button press state |
| `ui-panel-leather` | Dark leather panel | Info panels, overlays |
| `ui-wax-seal` | Wax seal impression | Notifications |

**Card Back (1 illustration, 750x1050)**

| ID | Description |
|---|---|
| `card-back` | Chaos Mote vortex / planar shard field painting, SDXL + PaletteKnife |

**Spectral Fog Overlay (1 texture, 512x512, transparent PNG)**

| ID | Description |
|---|---|
| `fx-spectral-fog` | Semi-transparent fog wisps on alpha for Endless Spectres frame |

**Total: ~38 AI-generated textures**

### Budget Estimate

| Stage | Cost |
|---|---|
| Test shots (38 × $0.04) | $1.52 |
| Iteration (50% need 1 retry) | $0.76 |
| Batch variants (38 × 3 × $0.04) | $4.56 |
| Card back (SDXL, 5 variants) | $0.13 |
| Buffer | $1.03 |
| **Total** | **~$8.00** |

### Post-Processing Pipeline (per texture)

1. Tileability check (tile 3x3, inspect seams)
2. Color correction to faction palette hex (sharp hue/sat)
3. Contrast normalization (no hot spots at overlay opacity)
4. Resize + export @1x/@2x/@3x
5. Install to Xcode Assets.xcassets with Contents.json

### Deliverable
Script: `scripts/generate-visual-textures.mjs`
Output: `scripts/preview/visual-textures/` (previews) + installed to Xcode asset catalog

---

## Wave 1B: Programmatic Icons + Shapes ($0) — PARALLEL WITH 1A

**Agent type:** `general-purpose`

All icons and stat containers drawn programmatically with node-canvas. No AI generation needed.

### Icon Manifest

**ATK Icons (10 faction variants, 128x128, PNG with alpha)**
Fractured blade shard silhouette. Per-faction metal tint:
- Ironwright: steel blue-gray (#6B7B8D)
- Fey Verdant: living wood green (#2E8B57)
- Fey Hollow: ice blue (#A0C4E8)
- Demonic Furnace: volcanic orange (#FF4500)
- Demonic Bureaucracy: dark blood red (#991B1B)
- Celestial Knights: divine blue (#3B5998)
- Celestial Chosen: burning gold (#F59E0B)
- Endless Cabals: necrotic teal (#2DD4BF)
- Endless Spectres: sickly green (#4ADE80)
- Neutral: bronze (#CD7F32)

**HP Icons (10 faction variants, 128x128)**
Cracked shield / planar shard silhouette. Same faction color mapping.

**Chaos Mote Orbs (10 faction variants, 64x64)**
Painted orb with brighter core, darker edge. Faction-specific color.

**Instability Indicator (1, 64x64)**
Diamond/crystalline shard glyph.

**Stat Container Shapes (5 faction shapes, 256x256, alpha PNG)**

| Faction | Shape | Material Feel |
|---|---|---|
| Ironwright | Hexagonal | Industrial stamped metal |
| Fey | Leaf / seed-pod | Organic rounded |
| Demonic | Jagged obsidian shard | Volcanic glass edges |
| Celestial | Shield with gold trim | Cathedral architecture |
| Endless | Skull / vertebral | Bone construction |

**Effect Modifier Keyword Icons (20 icons, 64x64, monochrome)**
Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing, plus ~13 additional effect modifier symbols. Unified stroke weight, consistent style, embossed stamp aesthetic.

**Faction Emblems (5 primary, 256x256)**
Ironwright gear-flower, Fey moon-tree, Demonic horned skull, Celestial radiant shield, Endless phylactery.

**Sub-Faction Emblems (10, 128x128)**
Variants of the primary emblems with sub-faction specific modifications.

**Rarity Indicators (5, 32x32)**
Common (plain), Uncommon (silver pip), Rare (gold pip), Epic (holographic pip), Legendary (prismatic pip).

**UI Navigation Icons (6, 48x48, monochrome)**
Home, Collection, Battle, Shop, Deck, Profile — small monochrome glyphs.

**Card State Indicators (4, 48x48)**
Tapped (rotated arrow), Buffed (up arrow), Damaged (crack), Shielded (barrier).

**Total: ~75 programmatic icons**

### Implementation
Script: `scripts/generate-icons-v2.mjs`
- Uses node-canvas to draw each icon programmatically
- Consistent 2-3px stroke weight at 64px canvas
- Each icon gets subtle bevel via ImageMagick post-process (1-2px inner shadow)
- Color variants generated by re-tinting the base shape
- All exported with alpha channel

### Deliverable
Output: `scripts/preview/icons-v2/` (previews) + installed to Xcode asset catalog

---

## Wave 1C: Font Integration ($0)

**Agent type:** `general-purpose`

### Fonts to Add

| Font | Source | License | Use |
|---|---|---|---|
| Bebas Neue Bold | Google Fonts | OFL | Stat numerals (ATK, HP, CM, instability) |
| Fira Sans Regular + Bold | Google Fonts | OFL | UI menus, buttons, nav labels |

### Tasks
1. Download font files (.ttf) from Google Fonts
2. Add to Xcode project (ChaosCreatures/Resources/Fonts/)
3. Register in Info.plist
4. Create `Font+Theme.swift` extension with convenience accessors
5. Update stat numeral rendering in CardFrameView to use Bebas Neue
6. Update UI text in non-card screens to use Fira Sans

---

## Wave 2: SpriteKit Card Parity ($0)

**Agent type:** `general-purpose`

Port CardFrameView's texture layers to SpriteKit battle cards.

### Tasks
- Faction border texture on CreatureNode (3pt inset) and HandCardNode (4pt inset)
- Canvas weave overlay (SKSpriteNode, `.multiply` blend, 0.15 alpha)
- Faction-specific medallion stat badges (wax-seal texture, faction tint, embossed rim)
- Dark vellum text panel
- Faction-specific stat container shapes
- Contact shadows (soft shadow at card base, warm-tinted, not floating drop shadow)
- Slight perspective tilt on battlefield cards (top edge 1-3% narrower)
- Stat numerals in Bebas Neue

**Files:** `CreatureNode.swift`, `HandCardNode.swift`

---

## Wave 3: Screen Backgrounds ($0) — PARALLEL WITH WAVE 2

**Agent type:** `general-purpose`

Apply textured backgrounds to all screens using ZStack pattern (same as CollectionView).

| Screen | Texture | Opacity | Text Color |
|---|---|---|---|
| Home | `bg-dark-leather` | 0.35 | Off-white #F0EAD6 |
| Shop | `bg-polished-stone` | 0.30 | Off-white #F0EAD6 |
| Deck Builder | `bg-aged-wood` | 0.35 | Off-white #F0EAD6 |
| Profile | `bg-dark-leather` | 0.35 | Off-white #F0EAD6 |
| Settings | `bg-dark-parchment` | 0.30 | Off-white #F0EAD6 |
| Onboarding | `bg-dark-parchment` | 0.25 | Off-white #F0EAD6 |
| Pack Opening | `bg-metallic-foil` | 0.50 | Off-white #F0EAD6 |
| Battle HUD | `bg-play-mat-felt` | 0.40 | Off-white #F0EAD6 |

All text on dark textured backgrounds uses off-white `#F0EAD6` (parchment cream), never pure white.

**Files:** `HomeView.swift`, `ShopView.swift`, `DeckBuilderView.swift`, `ProfileView.swift`, `SettingsView.swift`, `OnboardingView.swift`, `CardPackOpeningView.swift`, `BattleContainerView.swift`

---

## Wave 4: Faction-Specific Card Frames ($0)

**Agent type:** `general-purpose`

CardFrameView + SpriteKit nodes select faction-specific assets based on card's faction + sub-faction.

### Per Sub-Faction Frame Kit (9 kits)
- Border texture (from Wave 1A)
- Text panel texture (from Wave 1A)
- Stat container shape (from Wave 1B)
- Faction-colored stat icons (from Wave 1B)
- Faction-colored Chaos Mote orbs (from Wave 1B)
- Decorative elements (vines/rivets/bone/filigree — positioned via code)

### Faction-Specific Decorative Details (runtime SwiftUI/SpriteKit)
- **Ironwright**: Bolt rivets at 4 corners, blueprint-grid faint lines in text box
- **Fey Verdant**: Organic curve on art window edge, tiny leaf buds at corners, bioluminescent dots
- **Fey Hollow**: Thorn points on art window upper edge, bare branch silhouettes
- **Demonic Furnace**: Jagged volcanic-glass art window edges, lava vein pulse animation (subtle, slow)
- **Demonic Bureaucracy**: Thin ruled lines on frame edges, wax-seal emblem at bottom, contract watermark
- **Celestial Knights**: Arched art window top, gold filigree lines, faint halo behind name
- **Celestial Chosen**: Slightly warped cathedral edges, faint eye symbols in border
- **Endless Cabals**: Stacked bone frame shapes, phylactery corner symbols, teal soul-light inner glow
- **Endless Spectres**: Soft bleeding art window edges, broken chain links, spectral fog overlay

### Pre-Baked Frames (Puppeteer)
Use Puppeteer to pre-render frame templates as layered HTML/CSS compositions → PNG export. This gives full CSS control over:
- `mix-blend-mode` for texture overlays
- `filter: drop-shadow()` for emboss/bevel effects
- CSS `mask-image` for shaped stat containers
- `backdrop-filter` for frosted/spectral effects
- Precise absolute positioning of decorative elements

Generate 9 sub-faction frame PNGs (rarity variations applied at runtime via SwiftUI/SpriteKit tint + overlay, not pre-baked — keeps asset count manageable).

**Files:** `CardFrameView.swift`, `CreatureNode.swift`, `HandCardNode.swift`, `FactionFrameKit.swift` (new)

---

## Wave 5: UI Chrome ($0) — PARALLEL WITH WAVE 6

**Agent type:** `general-purpose`

### Custom Button Styles
- `CardstockButtonStyle` — embossed paper texture (`ui-button-cardstock`), depresses on press (1-2px shift, shadow invert), cardstock grain
- `MetalButtonStyle` — stamped metal for primary CTAs, faction-colored tint

### Custom Panel Styles
- `.leatherPanel()` replacing `.cardBackground()` — leather texture + edge shadow
- `.parchmentPanel()` for info overlays — parchment texture, soft rounded corners, edge shadow

### Tab Bar
- Wood grain texture background
- Metallic underline for active tab (not color fill)
- Small monochrome glyph icons from Wave 1B

### Loading States
- Replace `ProgressView` with Chaos Mote animation
- Generate 8-frame sprite sheet via node-canvas (radial gradient orb with rotation + color shift per frame)
- Or use SpriteKit SKAction for runtime procedural animation (rotating gradient + scale pulse)
- Update `LoadingView.swift`

### Notification Treatment
- Replace toast banners with wax-seal parchment cards (slide in, physical feel)
- Use `ui-wax-seal` texture from Wave 1A
- Update `.toast()` modifier in `View+Loading.swift`

### Resource Displays
- Chaos Dust shown as physical token pile, not flat HUD number
- Count numeral embossed into small plate

**Files:** `ButtonStyles.swift` (new), `PanelStyles.swift` (new), `View+Loading.swift`, `LoadingView.swift`, `ContentView.swift`, `ShopView.swift`, `HomeView.swift`

---

## Wave 6: Card States & Interactions ($0) — PARALLEL WITH WAVE 5

**Agent type:** `general-purpose`

### Hand Parallax
Cards in hand: art moves at slightly different rate than frame (1-3px offset) when swiping. Implemented in HandCardNode.

### Card Expand Interaction
Tap → scale up smoothly from in-game position → depth-of-field blur background → hidden content fades in (effects 3-4, flavor text). Feels like picking up a physical card.

### Contact Shadows
Battlefield cards: warm contact shadow at base (not floating drop shadow). Dark at base, fading quickly, tinted toward background material color.

### Destruction Animation
Card cracks (fracture line overlay generated via ImageMagick procedural: `magick -size WxH plasma: -threshold 50% -edge 1` → crack pattern), art drains of color (desaturation animation), card drifts downward off screen. Endless faction: lingering ghost-image afterimage.

### Tapped/Exhausted State
Rotate 90° right + desaturation shift + small painted status glyph indicator.

### Damage/Buff Rendering
HP changes: "stamp" animation (old fades, new appears with emboss pulse). Damaged HP in muted red. Buffs in warm gold. No floating "+1" badges.

### Furnace Lords Lava Pulse
Very subtle slow glow animation on lava veins in Furnace Lords card borders at rest.

**Files:** `HandCardNode.swift`, `CreatureNode.swift`, `CardDetailView.swift`, `FullscreenCardView.swift`, `BattleScene.swift`

---

## Wave 7: Rarity Treatments ($0)

**Agent type:** `general-purpose`

### Common
Standard matte frame with base faction textures. No metallic elements.

### Uncommon
Thin silver metallic inner border line between art window and frame. Slightly richer texture detail.

### Rare
Gold metallic inner border. Enhanced faction decorative elements (more vines, more filigree, more lava veins).

### Epic
- Holographic foil overlay on card border (ImageMagick-generated procedural pattern)
- Rainbow-shift sheen reacts to device tilt (CMMotionManager/gyroscope)
- Enhanced material detail, polished metal border
- Art has luminous quality (brighter highlights in rendering)

### Legendary
- Full holographic foil border with animated shimmer
- Art elements catch light independently (foil on painted highlights)
- Extended art bleeds beyond normal art window into border
- Upgraded border material (gold for Celestial, dark steel for Ironwright, etc.)

### Holographic Foil Asset (ImageMagick procedural — no AI needed)
```bash
# Generate rainbow-shift metallic foil pattern
magick -size 512x512 plasma:purple-gold \
  -modulate 100,200 -blur 0x5 \
  \( -size 512x512 plasma: -blur 0x2 -normalize \) \
  -compose overlay -composite \
  -sharpen 0x1 holographic-foil.png
```
Generate at build time, not runtime. The foil texture is composited onto card borders at different offsets based on gyroscope tilt data.

### Implementation
- SwiftUI: Gyroscope-driven gradient shift overlay on card border (CMMotionManager)
- SpriteKit: Tilt-reactive color blend on border SKSpriteNode
- Procedural foil texture from ImageMagick (rainbow gradient + plasma noise)

**Files:** `CardFrameView.swift`, `CreatureNode.swift`, `HandCardNode.swift`

---

## Wave 8: Settings Redesign + Final Polish ($0)

**Agent type:** `general-purpose`

### Settings Overhaul
Replace native iOS Form:
- Custom section panels (vellum texture, embossed headers in Cinzel)
- Custom toggle rows (physical on/off switch appearance)
- Custom slider rows (leather-textured tracks)
- Dark parchment background

### CardFrameView Layout Polish
- Name bar bridges art/text (slight overlap at art bottom edge)
- Text box: 1-2 effects visible + "more" chevron in faction accent color
- Faction emblem watermark in text area (detail/fullscreen views)
- Off-white text (#F0EAD6) throughout, never pure white

### Currency Display
- Chaos Dust as physical tokens/pile on table surface
- Embossed numeral plate

### Final Immersion Sweep
- Verify every screen against design guide Sections 10 and 15
- Fix any remaining flat/digital elements
- Ensure all buttons use custom styles (zero default SwiftUI buttons)
- Ensure all panels use custom styles (zero `.cardBackground()`)
- Ensure no system-native components visible (no iOS Form, no standard toggles)

**Files:** `SettingsView.swift` (rewrite), `CardFrameView.swift`, `ShopView.swift`, `HomeView.swift`

---

## Audit Gates

| Audit | After Wave | What It Checks |
|---|---|---|
| `asset-quality-auditor` | 1A, 1B | Every image: no AI artifacts, no text, correct color, tiles seamlessly, reads at target size |
| `visual-parity-auditor` | 2 | Screenshot SpriteKit vs SwiftUI cards — must match |
| `screen-texture-auditor` | 3 | Screenshot every screen — no flat backgrounds, text readable |
| `faction-identity-auditor` | 4 | Screenshot 5 faction variants — visually distinct, consistent within faction |
| `performance-auditor` | 2, 4, 6, 7 | Battle fps with 10+ textured cards — must hold 60fps |
| `immersion-auditor` | 8 | Full app walkthrough — flag anything "digital" or immersion-breaking |

---

## Budget Summary

| Wave | AI Gen Cost | Notes |
|---|---|---|
| 0 | $0 | Code only — complete |
| 1A | ~$8.00 | 38 textures × (test + batch) via fal.ai |
| 1B | $0 | Programmatic (node-canvas + ImageMagick) |
| 1C | $0 | Font files from Google Fonts |
| 2-8 | $0 | Code only, reuse Wave 1 assets |
| **Total** | **~$8.00** | Hard cap: $10 |

Remaining after: ~$60-94 (for audio, card art at scale, App Store).

---

## Full Verification Checklist

- [ ] All tools installed and verified (sharp, ImageMagick, node-canvas, Puppeteer)
- [ ] All generated textures: no AI artifacts, correct colors, tileable, readable at target size
- [ ] All icons: clean vector quality, consistent stroke weight, correct faction colors
- [ ] Bebas Neue + Fira Sans integrated and rendering
- [ ] CLAUDE.md: zero trademark refs, all stats current, copyright rule added
- [ ] SpriteKit cards match SwiftUI CardFrameView quality
- [ ] Zero flat-only backgrounds (all screens textured)
- [ ] 9 visually distinct sub-faction card frames
- [ ] All buttons use custom physical styles (CardstockButtonStyle or MetalButtonStyle)
- [ ] All panels use custom physical styles (.leatherPanel() or .parchmentPanel())
- [ ] Settings uses custom UI (no native iOS Form, no standard toggles)
- [ ] Loading uses Chaos Mote animation (no ProgressView spinner)
- [ ] Notifications use wax-seal parchment treatment (no standard toast)
- [ ] Tab bar has wood texture + metallic underline active state
- [ ] Hand cards have parallax effect
- [ ] Battlefield cards have contact shadows (not floating drop shadows)
- [ ] Battlefield cards have slight perspective tilt
- [ ] Card expand feels like picking up a physical card
- [ ] Tapped/exhausted cards desaturate + show painted glyph indicator
- [ ] Destruction uses crack + color drain + drift animation
- [ ] Endless destruction has lingering ghost afterimage
- [ ] Damage/buff uses stamp animation (no floating "+1" badges)
- [ ] Furnace Lords have subtle lava pulse at rest
- [ ] Common-Legendary rarity progression through material quality
- [ ] Epic/Legendary have holographic foil with gyroscope response
- [ ] Legendary has extended art bleeding into border
- [ ] All text on dark backgrounds uses off-white #F0EAD6 (never pure white)
- [ ] Currency displayed as physical tokens (not flat HUD numbers)
- [ ] 60fps in battle with all effects active
- [ ] Build succeeds with zero errors

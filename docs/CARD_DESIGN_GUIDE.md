# AI Agent Guide: Chaos Creatures — Premium iOS Digital Trading Card Game
### Platform: iOS (iPhone + iPad) | Output: Native Swift Component
### Deployment: iOS 16+ | Chip: A14+ | Aesthetic: Tangible Physical Materials

---

## How to Use These Two Files

This guide has a companion quick reference file. Use them together:

| File | When to use |
|------|------------|
| `docs/CARD_DESIGN_GUIDE.md` **(this file)** | Read in full at session start and after any context compaction. Contains all rationale, implementation code, and explanations. This is the authoritative source. |
| `docs/CARD_DESIGN_QUICKREF.md` | Look up specific values mid-implementation — measurements, timings, tables, checklists — without re-reading prose. Never substitute for a full guide read. |

**If the two files conflict, this guide is authoritative.**

---

## Table of Contents

Use this to identify which section to re-read before starting a task. Do not rely on memory of a previous read — always re-read the relevant section.

| Section | What it contains | Re-read before |
|---------|-----------------|----------------|
| **Preamble** | Locked deployment parameters | Any uncertainty about platform targets |
| **§1 Aesthetic System** | Core principles, color palette (P3 values), dark mode, card layout measurements, zone table, border weights by rarity, typography spec, font + size tables, letterpress effect, all 9 state transitions with timing + curves, gesture priority, card back spec, error fallbacks, vision reference images | Any visual work |
| **§2 Card Schema** | Swift structs, CardCondition/Rarity → shader uniform value tables, CardDisplayState enum, JSON card format | Any model, shader, or data work |
| **§3 Asset Strategy** | Service selection by card type, LoRA R2 URL + Replicate generation call + scale tuning + failure table, fal.ai FLUX prompt templates, color grading pipeline, normal map generation scripts, foil gradient script, art box compositing steps, icon sources, license manifest format | Any asset generation |
| **§4 Environment** | `verify_environment.sh` (master check — tools, simulators, API keys, Python libs), project scaffold, SPM dependencies, CLI tooling, API key setup + .env template, asset catalog structure + ASTC setup, font download script, pre-smoke-test asset prep, smoke test view + **HARD GATE** | First session; any environment failure |
| **§5 Agent Techniques** | Vision tool workflow, bash discipline, 4-device screenshot script, 9-step refinement loop procedure, SwiftUI↔MTKView bridge pattern, context management, silent failure prevention | Any iterative implementation |
| **§6 Effects** | OilPaintShader.metal, ParchmentShader.metal, WarmFoilShader.metal + CMMotionManager, parallax offsets, InkSpreadKernel.metal, WaxSealView, spring drag constants, particle rarity table + blend mode rules, EffectTier enum | Any shader or effects work |
| **§7 Haptics** | Interaction → implementation + AHAP table, required AHAP filenames, HapticEngine.swift, physical device **HARD GATE** | Any haptic work |
| **§8 Sound** | Interaction → sound + duration table, Freesound sources, ffmpeg processing pipeline, SoundEngine.swift | Any audio work |
| **§9 iPad Layout** | Size class branching code, GeometryReader sizing formula, card size table (iPhone/iPad portrait/iPad landscape), Stage Manager + split view testing requirements, orientation layout rule | Any iPad layout work |
| **§10 Accessibility** | VoiceOver label format + custom actions, Dynamic Type UIFontMetrics pattern, Reduce Motion disable list, WCAG AA contrast table + fix actions | Accessibility pass |
| **§11 Workflow** | Budget allocation table, ordered 24-step pipeline sequence with hard gates marked | Starting any new phase |
| **§12 Testing** | Reference anchoring protocol, regression script (compare_screenshots.py), structured critique template (8 axes), one-fix-per-loop rules, exit criteria checklist | Every QA pass and before marking any phase complete |
| **§13 Performance** | Instruments order (Core Animation first), performance targets table, optimization techniques, TextureCache LRU implementation, App Store compliance | Performance profiling pass |
| **§14 Quality Bar** | Final validation — the physical test, all pass criteria in prose | Before declaring any work done |
| **Addendum** | Multiagent roles (Orchestrator/Asset/Engineering/QA), handoff JSON format, context recovery, budget ledger format | Before spawning subagents |

---

## Preamble: Read This Entirely Before Starting

This guide directs you, an AI coding agent, to produce high-quality digital trading cards for a **native iOS application** on both iPhone and iPad. The target visual quality is comparable to MTG Arena, but rendered in a completely distinct aesthetic: **oil paint, canvas, cardstock, parchment, wax, and other tangible physical materials**. Every element must look and feel like it could be physically touched.

All tools, libraries, assets, and techniques here are selected for **commercial use safety**. Do not substitute without verifying the replacement's commercial license.

**Locked deployment parameters — do not change:**

| Parameter | Value |
|-----------|-------|
| Minimum iOS | iOS 16 |
| Devices | iPhone + iPad (all form factors) |
| Chip baseline | A14 or later (iPhone 12, iPad Air 4th gen) |
| Metal GPU family | Apple7 (A14 baseline) |
| iPhone orientation | Portrait-primary |
| iPad orientation | Portrait + landscape, meaningful layout differences |

**Before writing a single line of code**, write these parameters to `Logs/iteration_log.md` and confirm you have read Sections 1 and 2 in full. Design decisions made without internalizing the aesthetic system will produce work that requires complete rework.

---

## Section 1: Aesthetic System & Design Language

This section is the foundation of every decision in the guide. Read it before touching any code, shader, or asset.

### 1.1 Core Aesthetic Principles

The card must read as a **physical artifact**, not a screen UI. Test every design decision against this question: *does this look like it could be held in a hand?* If the answer is no, it is wrong regardless of technical quality.

- **Oil paint for artwork:** Visible brushwork, impasto texture, pigment that has body and weight. Each faction has locked artist references that define its specific painterly character — see Section 3.1 for the complete faction artist table. The through-line across all factions is physical materiality: oil paint on canvas, not digital illustration.
- **Parchment and cardstock for the card body:** Thick fibrous paper surface — warm cream/sepia, grain visible under raking light, edges that look cut not rendered.
- **Canvas for backs and backgrounds:** Woven tooth, catches highlights, slightly textured.
- **Wax for rarity seals:** Dense, slightly translucent at edges, raised center, single directional specular highlight.
- **Ink for all typography:** Letterpress quality — slight bleed into paper fiber, warmth, weight. Never crisp vector text sitting on top of a surface.
- **Aged quality throughout:** Nothing is new. Colors warm-shifted and slightly desaturated. Gold is antique. Silver is tarnished. Edges show handling.

**The aesthetic failure modes to avoid actively:**
- Anything that looks like a CSS gradient or a flat digital UI element
- Chrome or cold holographic foil (wrong era, wrong material)
- Pure black or pure white anywhere — use ink-black and parchment-light instead
- Perfectly crisp edges on any organic element
- Any font that reads as a system or tech typeface

### 1.2 Color Palette

Every color used anywhere in the app must derive from this palette. Do not introduce digital colors.

| Token | Hex (sRGB) | P3 Equivalent | Usage |
|-------|-----------|--------------|-------|
| `parchment-light` | `#F5E6C8` | `displayP3(0.953, 0.898, 0.780)` | Card body base, light areas |
| `parchment-mid` | `#D4B896` | `displayP3(0.827, 0.718, 0.585)` | Card body shadow, inner borders |
| `parchment-dark` | `#8B6914` | `displayP3(0.541, 0.408, 0.071)` | Deep shadows, ink shadows |
| `ink-black` | `#1A1208` | `displayP3(0.098, 0.071, 0.027)` | Typography, fine lines |
| `wax-red` | `#8B1A1A` | `displayP3(0.537, 0.094, 0.082)` | Demonic Kingdoms faction color (wax seal, type line icon tint) |
| `wax-blue` | `#1A2E5C` | `displayP3(0.086, 0.176, 0.353)` | Reserved — not currently assigned to a faction |
| `wax-green` | `#1A3D1A` | `displayP3(0.086, 0.235, 0.086)` | Reserved — not currently assigned to a faction |
| `fey-teal` | `#1A3D30` | `displayP3(0.086, 0.235, 0.184)` | Fey Courts faction color (wax seal, type line icon tint) |
| `rot-moss` | `#1C2B1A` | `displayP3(0.106, 0.165, 0.098)` | The Endless faction color (wax seal, type line icon tint) — dark greenish-black, decay palette |
| `aged-gold` | `#C8A951` | `displayP3(0.776, 0.659, 0.306)` | Rare frames, gold accents; Celestial Crusade faction color |
| `antique-silver` | `#9AA0A6` | `displayP3(0.600, 0.624, 0.647)` | Uncommon frames; Ironwright Collective faction color |
| `epic-amethyst` | `#7B2FBE` | `displayP3(0.463, 0.161, 0.729)` | Epic frames, arcane glow |
| `legendary-ember` | `#C85A1A` | `displayP3(0.773, 0.341, 0.082)` | Legendary gradient |
| `canvas-warm` | `#E8D5B0` | `displayP3(0.906, 0.831, 0.686)` | Background canvas |
| `parchment-dark-mode` | `#2A2015` | `displayP3(0.161, 0.122, 0.071)` | Dark mode card body |
| `ink-dark-mode` | `#E8D5A0` | `displayP3(0.906, 0.831, 0.620)` | Dark mode typography |

**Faction color mapping — use these tokens consistently everywhere faction color appears:**

| Faction | Token | Usage |
|---------|-------|-------|
| Demonic Kingdoms | `wax-red` | Wax seal base color; faction icon tint on type line |
| Fey Courts | `fey-teal` | Wax seal base color; faction icon tint on type line |
| Ironwright Collective | `antique-silver` | Wax seal base color; faction icon tint on type line |
| Celestial Crusade | `aged-gold` | Wax seal base color; faction icon tint on type line |
| The Endless | `rot-moss` | Wax seal base color; faction icon tint on type line |

Faction color appears in exactly two places per card: the wax seal and the faction icon on the type line. It does not affect borders, name bar, text box, or any other zone — those are driven by rarity, not faction.

**Always use P3 values when initializing UIColor/Color in Swift** — the warm tones benefit from P3's extended gamut on modern displays. Use `Color(UIColor(displayP3Red: r, green: g, blue: b, alpha: 1))` for all palette colors.

### 1.3 Dark Mode

The app must support both light and dark mode. The dark mode aesthetic is **not** an inverted parchment — it is a **candlelit manuscript**: the card body becomes deep warm brown (`parchment-dark-mode`), text becomes warm cream (`ink-dark-mode`), and rarity colors shift slightly warmer and more saturated. Gold frames glow against the dark background rather than sitting on parchment.

Implement using `@Environment(\.colorScheme)` and a `CardTheme` object that switches the entire palette in one place. Do not scatter `if colorScheme == .dark` conditionals throughout the card rendering code.

### 1.4 Precise Card Layout Specification

**Do not guess these values.** Every zone on the card has a precise proportion. Implement these before any visual styling.

All proportions are expressed as percentages of card height (H) or card width (W). The base card size at "selected" state (the design reference size) is **210pt × 294pt** (5:7 ratio). All other sizes scale from this ratio.

```
┌─────────────────────────────────┐  ← Total card (W × H)
│ [outer border: 3pt all sides]   │
│ ┌─────────────────────────────┐ │
│ │ NAME BAR          N ⊕       │ │  H: 8.5% of card height (~25pt at ref)
│ ├─────────────────────────────┤ │
│ │                             │ │
│ │        ART BOX              │ │  H: 45% of card height (~132pt at ref)
│ │                             │ │  W: fills inner width (100% - 6pt border)
│ ├─────────────────────────────┤ │
│ │ TYPE LINE      [SET SYMBOL] │ │  H: 6% of card height (~18pt at ref)
│ ├─────────────────────────────┤ │
│ │                             │ │
│ │        TEXT BOX             │ │  H: 30% of card height (~88pt at ref)
│ │  [ability text]             │ │
│ │  ─────────────────          │ │  Divider line between ability & flavor
│ │  [flavor text italic]       │ │
│ ├─────────────────────────────┤ │
│ │ [collector #] [SET] [ATK/HP │ │  H: 5% of card height (~15pt at ref)
│ │  rarity bar (colored line)  │ │  H: 1.5% (~4pt)
│ └─────────────────────────────┘ │
│ [outer border: 3pt bottom]      │
└─────────────────────────────────┘
```

**Zone measurements (at 210×294pt reference size):**

| Zone | X | Y | Width | Height | Notes |
|------|---|---|-------|--------|-------|
| Outer border | 0 | 0 | 210 | 294 | Corner radius: 12pt |
| Inner content area | 4 | 4 | 202 | 286 | Corner radius: 9pt |
| Name bar | 4 | 4 | 202 | 25 | Includes `N ⊕` cost display right-aligned: single 20×20pt chaos mote icon + Oswald-Bold 13pt numeral, 6pt from inner right edge |
| Art box | 4 | 29 | 202 | 132 | No corner radius — bleeds to inner edge |
| Art box vignette | 4 | 29 | 202 | 132 | 20pt feather fade at all 4 edges |
| Type line | 4 | 161 | 202 | 18 | Faction icon left-aligned 14×14pt; set symbol right-aligned 14×14pt |
| Text box | 8 | 179 | 194 | 88 | 4pt internal padding all sides |
| Ability/flavor divider | 12 | varies | 186 | 0.5 | Hairline, parchment-mid color |
| Stats bar | 4 | 267 | 202 | 15 | ATK/HP right-aligned |
| Rarity color bar | 4 | 282 | 202 | 4 | Bottom of inner area |
| Wax seal | 164 | 258 | 34 | 34 | Rarity indicator, overlaps stats bar |

**Border weight by rarity:**

| Rarity | Outer border width | Inner shadow depth | Frame gradient |
|--------|------------------|-------------------|----------------|
| Common | 3pt flat | None | Matte parchment-mid |
| Uncommon | 3.5pt | 1pt inner shadow | Antique-silver gradient |
| Rare | 4pt | 2pt inner shadow + outer glow (4pt, aged-gold, 40% opacity) | Aged-gold gradient |
| Epic | 4pt | 2pt inner shadow + outer glow (6pt, epic-amethyst, 50% opacity) | Amethyst-to-deep-purple animated gradient |
| Legendary | 4pt | 2pt inner shadow + outer glow (8pt, legendary-ember, 60% opacity) | Ember-to-gold animated gradient |

### Chaos Mote Cost Display

Format: `N ⊕` — a cost numeral followed by a single chaos mote icon.

Layout:
- Position: Right-aligned in the Name Bar, 6pt from the inner right edge, vertically centered.
- Numeral: Oswald-Bold, 13pt, ink-black (light mode) / ink-dark-mode (dark mode).
- Icon: `Resources/Icons/chaos_mote_symbol.png`, rendered at 20×20pt. One icon always, regardless of cost value.
- Total footprint: ~35pt wide (numeral + 4pt gap + 20pt icon).

Card type rules:
- Creature: Shows `N ⊕` where N is the chaos mote cost.
- Spell: Shows `N ⊕` where N is the chaos mote cost.
- Planar Ruin: Shows `N ⊕` where N is the chaos mote cost. No "COST:" label.
- Stabilizer: No cost indicator displayed.

Replaces: the former tiled dot system (●●●●●●● up to 7 + "N+" overflow text) and the ruins "COST: N" label.

**Type line faction icon (type line, left-aligned):**

Each faction has a unique icon displayed left-aligned on the type line, mirroring the set symbol on the right. Both icons are 14×14pt.

| Faction | Icon | Token color for tint |
|---------|------|----------------------|
| Demonic Kingdoms | Scroll | `wax-red` |
| Fey Courts | Tree | `fey-teal` |
| Ironwright Collective | Sledgehammer | `antique-silver` |
| Celestial Crusade | Single angelic wing | `aged-gold` |
| The Endless | Skull | `rot-moss` |

**The token color column is for runtime tinting only — it has no effect on image generation.** Faction icons are generated as pure black-on-white silhouettes (see Section 3.8), then post-processed to white-on-transparent PNGs. Color is applied in SwiftUI at runtime using `.renderingMode(.template)` and `.foregroundColor(card.faction.color)`. The exact hex value does not need to be embedded in the image in any way.

```swift
Image("faction_demonic")
    .renderingMode(.template)
    .resizable()
    .frame(width: 14, height: 14)
    .foregroundColor(card.faction.color)
    .shadow(color: Color("parchment-dark").opacity(0.6), radius: 0.5, x: 0, y: 0.5)
```

Icons must be legible at 14×14pt — simple silhouettes only, no fine internal detail. See Section 3.8 for generation briefs.

**Attack/HP stats (stats bar, right-aligned):**

| Property | Value |
|----------|-------|
| Font | Oswald-Bold, 13pt |
| Format | "ATK / HP" e.g. "4 / 3" — omit both for stabilizers and ruins |
| Right margin | 8pt |
| Color | ink-black (light mode), ink-dark-mode (dark mode) |

**Instability display (stats bar, left-aligned):**

| Property | Value |
|----------|-------|
| Font | Oswald-Bold, 10pt (for the numeral) |
| Icon | D20 die face glyph — fractured/cracked to suggest chaos. Rendered as a simple silhouette icon, same height as the numeral (10pt). |
| Format | [D20 icon] N — e.g. a small cracked D20 followed by "3" |
| Color | Faction token color at 80% opacity |
| Placement | Left side of stats bar, 4pt from left edge |
| Note | N is the creature's base instability value (0–5) as printed on the card — not the board-calculated total |
| Generation | AI-generate the D20 icon once as a silhouette PNG. See Section 3.8 for generation brief. |

**Modifier and triggered ability text (text box, below ability text, above flavor text):**

Each evolution step adds one modifier and one triggered ability. A Common has none; a Legendary has four of each. Display in evolution order, oldest first.

| Element | Font | Size | Color | Format |
|---------|------|------|-------|--------|
| Modifier line | EBGaramond-SemiBold | 10pt | ink-black | "[Modifier Name]: [base effect]. [Event] Attunement: [bonus]." |
| Triggered ability line | EBGaramond-SemiBold | 10pt | ink-black | "ON [TRIGGER]: [effect]." |
| Modifier/trigger separator | — | — | parchment-mid | Hairline rule (0.5pt) between modifier block and flavor text |

If modifier + trigger text pushes the total text box content beyond the scroll threshold, modifier/trigger text scrolls with ability text as a single region. Do not separate them into different scroll areas.

### 1.5 Typography Specification

**Do not guess font sizes.** Every text element has a specified size. Implement these exactly before any visual styling.

**Fonts (all OFL licensed, commercial use permitted — download from fonts.google.com):**
- Cinzel-Regular, Cinzel-Bold — headings, name bar, type line
- EBGaramond-Regular, EBGaramond-Italic, EBGaramond-SemiBold — body text
- Oswald-Bold — stats, numbers

**Register all fonts in Info.plist under `UIAppFonts` before using them.** Failing to do this is the most common font rendering failure — the app will silently fall back to system font with no error.

```xml
<!-- Info.plist -->
<key>UIAppFonts</key>
<array>
    <string>Cinzel-Regular.ttf</string>
    <string>Cinzel-Bold.ttf</string>
    <string>EBGaramond-Regular.ttf</string>
    <string>EBGaramond-Italic.ttf</string>
    <string>EBGaramond-SemiBold.ttf</string>
    <string>Oswald-Bold.ttf</string>
</array>
```

**Text element specifications (at 210×294pt reference card size):**

| Element | Font | Size | Color | Alignment | Max lines | Overflow |
|---------|------|------|-------|-----------|-----------|----------|
| Card name | Cinzel-Bold | 13pt | ink-black | Left | 1 | Scale to 10pt min, then truncate |
| Chaos mote cost numeral | Oswald-Bold | 13pt | ink-black (light) / ink-dark-mode (dark) | Right (in name bar, 6pt from inner right edge) | 1 | Never truncate; paired with 20×20pt chaos mote icon at right |
| Type line | Cinzel-Regular | 10pt | ink-black | Left | 1 | Scale to 8pt min, then truncate |
| Ability text | EBGaramond-Regular | 11pt | ink-black | Left | — | Scroll within text box |
| Flavor text | EBGaramond-Italic | 10pt | parchment-dark | Left | — | Below ability text |
| Keyword abilities | EBGaramond-SemiBold | 11pt | ink-black | Left | — | Bold the keyword only |
| Collector number | Cinzel-Regular | 7pt | parchment-mid | Left | 1 | Never truncate |
| Set code | Cinzel-Regular | 7pt | parchment-mid | Center | 1 | — |
| ATK/HP | Oswald-Bold | 13pt | ink-black | Right | 1 | Never truncate |

**Letterpress effect (apply to all text):**
- Shadow offset: x=0, y=0.5pt
- Shadow blur: 0.5pt
- Shadow color: parchment-dark at 60% opacity (light mode), parchment-dark-mode at 60% (dark mode)
- Do NOT use system drop shadow — implement as a custom `TextRenderer` or render text twice (shadow pass offset 0.5pt down, normal pass on top)

**Line height:** 1.3× for ability text, 1.2× for all other elements.

**Text box behavior:** If combined ability + flavor text exceeds the text box height, the text box becomes scrollable (UIScrollView embedded, scroll indicators hidden, momentum scrolling enabled). The card frame does not grow — only the text box scrolls.

### 1.5b Card Type Layout Variants

The base creature layout (Section 1.4) is the reference. Spells, Stabilizers, and Planar Ruins are distinct card types with different layout rules. Implement these as layout variants on the same `CardView` component, switched by `card.type`.

**Spell layout:**

Spells are played and discarded — they never sit on the board. Their layout is simplified:

| Zone | Rule |
|------|------|
| Name bar | Present. `N ⊕` cost display right-aligned as normal (Oswald-Bold 13pt numeral + 20×20pt chaos mote icon, 6pt from inner right edge). |
| Art box | Same dimensions. Art depicts the spell's magical effect. |
| Type line | "Spell — [subtype]" e.g. "Spell — Battlefield". Faction icon left, set symbol right. |
| Text box | Expands to fill space freed by absent stats bar. Text box height: 88pt + 19pt (stats bar) = 107pt. |
| Stats bar | **Omit entirely.** |
| Rarity color bar | Present at bottom, same position. |
| Wax seal | **Omit.** |
| Instability display | **Omit** — spells have no instability value. |

**Stabilizer layout:**

Stabilizers occupy a dedicated board slot and cannot be targeted or destroyed. They have no mote cost, no HP, no ATK, and no instability. Their layout is purely informational — the effect text is the entire card.

| Zone | Rule |
|------|------|
| Name bar | Present. **No cost symbols** — stabilizers have no chaos mote cost. |
| Art box | Same dimensions. Art depicts the stabilizer object as a still-life. |
| Type line | "Stabilizer" (no subtype). Faction icon left, set symbol right. |
| Text box | Expands to fill space freed by absent stats bar: 107pt (same as Spell). |
| Stats bar | **Omit entirely.** No HP, no ATK, no instability. |
| Rarity color bar | Present. |
| Wax seal | Present — stabilizers have rarity like other cards. |
| Indestructible indicator | Small lock icon (SF Symbol `lock.fill`) in bottom-right corner of art box, 10pt, parchment-mid at 70% opacity. No tooltip needed — the card type communicates this. |

**Planar Ruin layout:**

Ruins are full-art cards that sit on the board and provide passive benefits. They evolve like creature cards and display modifiers at higher rarities. Their layout mirrors creature cards closely, with two additions: a passive benefit panel and a destruction penalty panel replacing the text box.

| Zone | Rule |
|------|------|
| Name bar | Present. Uses the same `N ⊕` format as creature and spell cards — Oswald-Bold 13pt numeral + 20×20pt chaos mote icon, right-aligned, 6pt from inner right edge. No "COST:" label prefix. |
| Art box | Same dimensions. Ruins are full-art — the art bleeds to all four edges of the art box with no internal framing. Ruins depict the structure in its environment. |
| Type line | "Planar Ruin" (no subtype). Faction icon left (omit for neutral ruins), set symbol right. |
| Passive benefit panel | Replaces top portion of text box. Label: "PASSIVE" in Cinzel-Bold 8pt parchment-mid. Effect text in EBGaramond-Regular 10pt. Separated from destruction panel by a 1pt parchment-mid hairline. |
| Destruction penalty panel | Below passive panel. Label: "IF DESTROYED" in Cinzel-Bold 8pt wax-red. Penalty text in EBGaramond-Regular 10pt, wax-red color. |
| Modifier/trigger display | Ruins gain modifiers on evolution exactly like creature cards (Section 1.4). Add modifier lines below the destruction penalty panel, in same format. |
| Stats bar | Show HP only (right-aligned, Oswald-Bold 13pt). No ATK. HP = cost × 3 + 1 — always compute from cost, never hardcode. |
| Wax seal | Omit on neutral (unevolved) ruins. Show faction wax seal on faction-evolved ruins. |
| No text scroll | Both panels must be visible simultaneously — do not scroll. If text is long, reduce font to 9pt minimum before allowing scroll. |

### 1.6 State Transition Animation Specifications

Every state transition must be precisely defined. Do not use `.default` or `.easeInOut` without specific duration values — these produce generic, weightless motion.

The guiding physical metaphor: **a heavy card has inertia**. It takes effort to pick up, settles with weight when placed, and springs back when released.

| Transition | Duration | Curve | What animates | Notes |
|-----------|---------|-------|---------------|-------|
| `default` → `focused` | 0.18s | easeOut | Shadow radius 4→12pt, Y offset -2pt, scale 1.0→1.02 | Subtle — card lifts |
| `focused` → `default` | 0.25s | spring(0.4, 0.7) | Reverse of above | Spring settle |
| `default` → `selected` | 0.12s | easeIn | Scale 1.0→0.97, frame glow opacity 0→0.8 | Press down |
| `selected` → `default` | 0.3s | spring(0.35, 0.65) | Reverse + bounce | Release spring |
| `default` → `tapped` | 0.35s | easeInOut | rotation3D Y-axis 0→90° (phase 1 of flip) | Card rotates |
| `default` → `previewed` | 0.28s | easeOut | Scale to target preview size, background dim 0→0.7 | Card lifts to center |
| `previewed` → `default` | 0.22s | easeIn | Reverse | Drops back |
| `default` → `inGraveyard` | 0.6s | easeIn | Saturation 1→0, brightness -0.15, Y +20pt | Sad, heavy |
| `default` → `summoning` | 0.0s | — | Trigger ink spread compute shader | No layout animation |
| `summoning` → `default` | 0.4s | easeOut | Opacity of shader result 0→1 | Fade in after ink fill |
| `default` → `damaged` | 0.08s | easeIn | Torn edge overlay opacity 0→0.6, shake animation | Quick, jarring |

**Card flip (tapped state) — two-phase implementation:**
```swift
// Phase 1: rotate out (front face disappears at 90°)
withAnimation(.easeIn(duration: 0.17)) { rotationY = 90 }

// Phase 2: rotate in (back face appears from -90°)
DispatchQueue.main.asyncAfter(deadline: .now() + 0.17) {
    showBack = true
    rotationY = -90
    withAnimation(.easeOut(duration: 0.18)) { rotationY = 0 }
}
```

**Shake animation (damaged state):**
```swift
let shake = CAKeyframeAnimation(keyPath: "transform.translation.x")
shake.values = [0, -6, 5, -4, 3, -2, 1, 0]
shake.duration = 0.4
shake.timingFunction = CAMediaTimingFunction(name: .easeOut)
```

**Card preview gesture:**
- Trigger: long press, minimum duration 0.35s
- On trigger: background behind card dims to 70% black (blurEffect(.systemUltraThinMaterial) overlay), card scales to preview size centered on screen
- Dismiss: tap anywhere outside preview, or swipe down more than 40pt
- Dismiss animation: 0.22s easeIn, background undims simultaneously

### 1.7 Gesture Priority Specification

Multiple gestures compete on the card view. Without explicit priority, iOS will misfire between them. Implement exactly as follows:

```swift
CardView(card: card)
    // Highest priority: long press for preview
    .highPriorityGesture(
        LongPressGesture(minimumDuration: 0.35)
            .onEnded { _ in cardState = .previewed }
    )
    // Medium: drag for repositioning
    .gesture(
        DragGesture(minimumDistance: 8)
            .onChanged { handleDrag($0) }
            .onEnded { handleDragEnd($0) }
    )
    // Lowest: tap for select
    .simultaneousGesture(
        TapGesture()
            .onEnded { cardState = .selected }
    )
```

The `minimumDistance: 8` on DragGesture prevents taps from being misinterpreted as drags.

### 1.8 Card Back Design

**Every card needs a back.** This is a complete omission in many implementations. The back must also conform to the physical aesthetic and must be designed before the front flip animation is implemented, since both are required for the flip.

Card back specification:
- Same dimensions and corner radius as front
- Base: canvas texture (woven grid visible, `canvas-warm` color)
- Center: large wax seal (40pt diameter) with the game's sigil/logo embossed
- Seal color: deep wax-red, same shader as rarity seals
- Border: same outer border weight as common card, parchment-mid color
- No card-specific information on the back

### 1.9 Error & Fallback States

**Always specify what happens when things fail.** An agent without error state specs will either crash or show blank white rectangles.

| Failure | Fallback Display |
|---------|-----------------|
| Artwork image fails to load | Show a canvas-colored rectangle with a subtle ink-wash pattern (procedural, no assets required) and a small quill-pen icon (from game-icons.net) centered |
| Custom font fails to load | Log the error, fall back to Georgia (closest system match for Cinzel) and Times New Roman (for EB Garamond) — never fall back to San Francisco |
| Metal device unavailable | Use `staticOnly` effect tier (Core Animation only) — card must still look premium |
| Card JSON parse error | Show a "damaged card" placeholder with torn-edge aesthetic and "???" for all text fields |
| Shader compilation failure | Log full error to `Logs/shader_errors.log`, fall back to flat parchment-light fill + standard shadow |

Never show a blank white or black rectangle. Every failure has a designed fallback.

### 1.10 Reference Images for Vision Comparison

Anchor every major component to a specific reference before generating anything. Write the reference URL/filename and what you are extracting from it in your iteration log before starting work.

**For oil paint artwork quality:**
Rembrandt, "The Anatomy Lesson of Dr. Nicolaes Tulp" (Wikimedia Commons)
`https://upload.wikimedia.org/wikipedia/commons/4/4d/Rembrandt_-_The_Anatomy_Lesson_of_Dr_Nicolaes_Tulp.jpg`
Extract: Shadow-to-light transitions with warm reflected light in darks. Canvas grain visible in highlights where paint is thin. The painting has visible impasto ridges — your brushNormal shader should produce this.

**For letterpress typography on parchment:**
Book of Kells, Chi Rho page (Wikimedia Commons)
`https://upload.wikimedia.org/wikipedia/commons/1/1b/KellsFol034rChiRhoMonogram.jpg`
Extract: Ink bleed into vellum fiber, warmth of the ground tone between letterforms, how gold leaf sits above the surface while ink sinks into it.

**For wax seal quality:**
Wikimedia Commons wax seal category: `https://commons.wikimedia.org/wiki/Category:Wax_seals`
Extract: Edge translucency gradient, single offset specular highlight on convex surface, pressed-in detail catching shadow.

**For parchment material accuracy:**
Poly Haven "parchment_paper" PBR set (CC0): `https://polyhaven.com/a/parchment_paper`
Extract: Use the roughness map to understand where parchment catches vs. absorbs light — this drives your parchment normal map.

**For aged gold frame:**
Wikipedia: "Gold leaf" article images
`https://en.wikipedia.org/wiki/Gold_leaf`
Extract: Real gold leaf has directional grain, slight variation in tone, dull areas between bright specular areas — it is never uniformly bright.

---

## Section 2: Card Data Schema & Templating System

Build this before any visual work. The schema drives everything.

### 2.1 Swift Data Model

```swift
struct Card: Codable, Identifiable {
    let id: UUID
    let name: String
    let type: CardType
    let subtypes: [String]           // e.g. ["Dragon", "Elemental"] — empty for non-creatures
    let rarity: Rarity
    let faction: CardFaction         // drives prompt style + color grading
    let subFaction: CardSubFaction   // drives sub-faction-specific prompt + grading
    let cost: Int?                   // chaos mote cost — nil for stabilizers (they have no cost); never changes through evolution for other types
    let attack: Int?                 // nil for stabilizers and planar ruins
    let hp: Int?                     // nil for stabilizers; planar ruins display computed HP (cost×3+1) — store nil in model, compute at render time via: ruinHP = card.cost! * 3 + 1
    let instability: Int             // 0–5 base; clamped 1–20 at board level; modified by evolution
    let abilityText: String          // may contain keyword markers e.g. "[BOLD]Flying[/BOLD]"
    let modifiers: [String]          // one per evolution step; empty at Common (0–4 entries)
    let triggeredAbilities: [String] // one per evolution step; empty at Common (0–4 entries)
    let flavorText: String?
    let artworkAssetName: String     // asset catalog key for current tier's artwork
    let artworkLineage: [String]     // asset names of all previous tiers in order [common, uncommon, ...]
    let artworkArtist: String?       // for credits and license tracking
    let frameStyle: FrameStyle
    let foil: Bool
    let evolutionDirection: EvolutionDirection? // nil at Common; .order or .chaos for each step
    let setCode: String
    let collectorNumber: String
    let condition: CardCondition     // drives shader parameters
    let inkColor: InkColor
    // Planar Ruin only
    let ruinPassiveText: String?     // passive benefit description
    let ruinDestructionPenaltyText: String? // what fires when the ruin is destroyed
}

enum CardType: String, Codable {
    case creature
    case spell
    case stabilizer          // no cost, no ATK, no HP, no instability contribution; occupies dedicated board zone; indestructible
    case planarRuin          // no ATK, high HP (cost×3+1), has passive + destruction penalty
}

enum EvolutionDirection: String, Codable { case order, chaos }

enum CardFaction: String, Codable {
    case ironwright   // Piranesi + Martin illustrators
    case fey          // Rackham + Dulac
    case demonic      // Bosch
    case celestial    // Doré (Paradise) + Blake
    case endless      // Doré (Inferno) + Goya

    /// Runtime tint color for faction icon and instability badge.
    /// Uses named colors from the asset catalog (Section 1.2 palette tokens).
    /// These colors are NOT used in image generation prompts — see Section 3.3c.
    var color: Color {
        switch self {
        case .ironwright: return Color("antique-silver")
        case .fey:        return Color("fey-teal")
        case .demonic:    return Color("wax-red")
        case .celestial:  return Color("aged-gold")
        case .endless:    return Color("rot-moss")
        }
    }
}

enum CardSubFaction: String, Codable {
    // Ironwright
    case foundryDirectorate  // reactor-blue concrete, geometric, no ornamentation
    case scrapLegions        // rust-orange patchwork, asymmetric, jury-rigged
    // Fey
    case verdantThrone       // bioluminescent, flowering, warm forest light
    case hollowCourt         // frost, bare bone, moonlit, predatory
    // Demonic
    case furnaceLords        // volcanic, magma, obsidian armor, everything burns
    case obsidianBureaucracy // formal robes, chains, ink, reddish lamplight, too-many-eyes
    // Celestial
    case knightsOfDeliverance // gold-ivory plate, divine blue tabards, formation geometry
    case heavensChosen       // concentric burning wheels, multiple eyes/wings, reality warping
    // Endless
    case necromanticCabals   // bone-cathedral, tattered robes, phylactery soul-light, cold teal
    case lostSpectres        // translucent, flickering, fog-choked, sickly green, spectral mist
}
enum Rarity: String, Codable { case common, uncommon, rare, epic, legendary }
enum FrameStyle: String, Codable { case standard, legendary, token }
enum CardCondition: String, Codable { case mint, played, worn, ancient }
enum InkColor: String, Codable { case darkBrown, deepBlue, burntSienna, forestGreen }
// cost is a plain Int (chaos mote cost, 0–10) — no mana color system in Chaos Creatures
```

### 2.2 Shader Parameter Mapping

Card data must drive shader uniforms directly. Do not hardcode uniform values — compute them from the card struct at render time.

**Architecture rule:** All `Rarity` extensions must be defined in `Sources/Models/Card.swift`, not scattered across view files. `CardFaction` is defined exactly once in Section 2.1 — do not re-declare it anywhere. `EffectTier` belongs in its own file `Sources/Effects/EffectTier.swift` (see Section 6.9).

```swift
// Sources/Models/Card.swift

// CardShaderUniforms — must be declared BEFORE the extension Card { var shaderUniforms } block
struct CardShaderUniforms {
    var brushRoughness: Float      // 0.3 (mint) → 0.95 (ancient)
    var varnishGloss: Float        // 0.8 (mint) → 0.1 (ancient)
    var parchmentAge: Float        // 0.0 (mint) → 1.0 (ancient)
    var foilIntensity: Float       // 0 (non-foil) → 1.0 (legendary foil)
    var glowIntensity: Float       // 0 (common) → 1.0 (legendary)
    var glowColor: SIMD4<Float>    // rarity glow color as float4
}

extension Card {
    var shaderUniforms: CardShaderUniforms {
        CardShaderUniforms(
            brushRoughness: condition.brushRoughness,
            varnishGloss: condition.varnishGloss,
            parchmentAge: condition.parchmentAge,
            foilIntensity: foil ? rarity.foilIntensity : 0,
            glowIntensity: rarity.glowIntensity,
            glowColor: rarity.glowSIMD   // rarity drives glow color, not card type
        )
    }
}

extension CardCondition {
    var brushRoughness: Float { switch self {
        case .mint: return 0.3
        case .played: return 0.55
        case .worn: return 0.75
        case .ancient: return 0.95
    }}
    var varnishGloss: Float { switch self {
        case .mint: return 0.8
        case .played: return 0.5
        case .worn: return 0.25
        case .ancient: return 0.1
    }}
    var parchmentAge: Float { switch self {
        case .mint: return 0.0
        case .played: return 0.3
        case .worn: return 0.65
        case .ancient: return 1.0
    }}
}

// All Rarity extensions — canonical home is Sources/Models/Card.swift
extension Rarity: Comparable {
    static func < (lhs: Rarity, rhs: Rarity) -> Bool {
        let order: [Rarity] = [.common, .uncommon, .rare, .epic, .legendary]
        return order.firstIndex(of: lhs)! < order.firstIndex(of: rhs)!
    }
}

extension Rarity {
    var waxColor: Color {
        switch self {
        case .common:    return Color("parchment-mid")
        case .uncommon:  return Color("antique-silver")
        case .rare:      return Color("aged-gold")
        case .epic:      return Color("epic-amethyst")
        case .legendary: return Color("legendary-ember")
        }
    }

    // glowSIMD: Display P3 values matching named colors in Section 1.2
    var glowSIMD: SIMD4<Float> {
        switch self {
        case .common:    return SIMD4(0.835, 0.714, 0.588, 1.0)  // parchment-mid
        case .uncommon:  return SIMD4(0.753, 0.753, 0.753, 1.0)  // antique-silver
        case .rare:      return SIMD4(0.839, 0.647, 0.078, 1.0)  // aged-gold
        case .epic:      return SIMD4(0.588, 0.282, 0.733, 1.0)  // epic-amethyst
        case .legendary: return SIMD4(0.918, 0.337, 0.137, 1.0)  // legendary-ember
        }
    }

    var foilIntensity: Float { switch self {
        case .common: return 0
        case .uncommon: return 0.3
        case .rare: return 0.6
        case .epic: return 0.8
        case .legendary: return 1.0
    }}

    var glowIntensity: Float { switch self {
        case .common, .uncommon: return 0
        case .rare: return 0.5
        case .epic: return 0.75
        case .legendary: return 1.0
    }}

    // Asset name in Assets.xcassets/Icons/ — must match download_icons.sh output names (Section 3.8)
    var sealIconName: String {
        switch self {
        case .common:    return "seal_common"     // circle-sparks
        case .uncommon:  return "seal_uncommon"   // celtic-knot
        case .rare:      return "seal_rare"       // crown
        case .epic:      return "seal_epic"       // all-seeing-eye
        case .legendary: return "seal_legendary"  // dragon-head
        }
    }

    var borderWidth: CGFloat {
        switch self {
        case .common:   return 3.0
        case .uncommon: return 3.5
        default:        return 4.0
        }
    }

    var borderGradient: LinearGradient {
        switch self {
        case .common:
            return LinearGradient(colors: [Color("parchment-mid")], startPoint: .top, endPoint: .bottom)
        case .uncommon:
            return LinearGradient(
                colors: [Color("antique-silver").opacity(0.8), Color("antique-silver"), Color("antique-silver").opacity(0.6)],
                startPoint: .topLeading, endPoint: .bottomTrailing)
        case .rare:
            return LinearGradient(
                colors: [Color("aged-gold").opacity(0.7), Color("aged-gold"), Color("aged-gold").opacity(0.8)],
                startPoint: .topLeading, endPoint: .bottomTrailing)
        default:
            return LinearGradient(colors: [Color("parchment-mid")], startPoint: .top, endPoint: .bottom)
        }
    }
}
```

### 2.3 Card State Machine

```swift
enum CardDisplayState: Equatable {
    case `default`
    case focused
    case selected
    case tapped
    case previewed
    case inGraveyard
    case summoning(progress: Float)   // 0.0–1.0 ink spread progress
    case foilActive(tiltX: Float, tiltY: Float)
    case damaged(severity: Float)     // 0.0–1.0
}
```

### 2.4 JSON Card Definition

Store in `Resources/Cards/*.json`. Write 5 test cards before building any UI — one per rarity, spanning all card types and at least 3 factions:

1. Common creature (Ironwright / Foundry Directorate) — instability 2, no modifiers, no triggered abilities
2. Uncommon spell (Fey / Verdant Throne) — 1 modifier, 1 triggered ability, no ATK/HP
3. Rare stabilizer (Demonic / Obsidian Bureaucracy) — instability 0 (stabilizers don't contribute instability), no ATK/HP
4. Epic planar ruin (neutral — no faction) — HP = cost × 3 + 1, passive text, destruction penalty text
5. Legendary creature (Celestial / Knights of Deliverance) — instability 1 (Order-evolved), 4 modifiers, 4 triggered abilities, artworkLineage with all 4 previous tier asset names

These must exercise all schema fields including nil optionals, `instability`, `subFaction`, `modifiers`, `triggeredAbilities`, `artworkLineage`, and `evolutionDirection`. Load via `CardRepository` — never hardcode card data in Swift source.

**`CardRepository` implementation** — create `Sources/Models/CardRepository.swift`:

```swift
// Sources/Models/CardRepository.swift
// Loads Card structs from Resources/Cards/*.json.
// Never hardcode card data in Swift source — always go through this class.

import Foundation

final class CardRepository {
    static let shared = CardRepository()
    private init() {}

    private var cache: [String: Card] = [:]

    /// Call once at app startup before displaying any card.
    func loadAll() throws {
        guard let cardsURL = Bundle.main.resourceURL?
            .appendingPathComponent("Cards") else {
            throw CardRepositoryError.cardsDirectoryNotFound
        }

        let jsonFiles = try FileManager.default.contentsOfDirectory(
            at: cardsURL,
            includingPropertiesForKeys: nil
        ).filter { $0.pathExtension == "json" }

        guard !jsonFiles.isEmpty else { throw CardRepositoryError.noCardsFound }

        let decoder = JSONDecoder()
        for url in jsonFiles {
            do {
                let data = try Data(contentsOf: url)
                let card = try decoder.decode(Card.self, from: data)
                cache[card.id.uuidString] = card
            } catch {
                // Log bad files but don't abort — one corrupt card shouldn't kill the app
                print("CardRepository: failed to decode \(url.lastPathComponent) — \(error)")
            }
        }
        print("CardRepository: loaded \(cache.count)/\(jsonFiles.count) cards")
    }

    func card(id: UUID) -> Card? { cache[id.uuidString] }

    func allCards(faction: CardFaction? = nil) -> [Card] {
        let all = Array(cache.values)
        guard let faction else { return all }
        return all.filter { $0.faction == faction }
    }

    enum CardRepositoryError: Error {
        case cardsDirectoryNotFound
        case noCardsFound
    }
}
```

**Call at startup** in your `@main` App entry point:

```swift
do {
    try CardRepository.shared.loadAll()
} catch {
    fatalError("CardRepository failed to load: \(error) — check Resources/Cards/*.json")
}
```

---

## Section 3: Commercially Safe Asset Strategy

### 3.1 Faction Artist System

Every card belongs to a faction. The faction determines the artist reference injected into every generation prompt. These pairings are locked — do not deviate or substitute.

| Faction | Artists | Visual Character | Notes on Doré usage |
|---------|---------|-----------------|---------------------|
| **Ironwright** | Giovanni Battista Piranesi + George R.R. Martin illustrators | Monumental stone architecture, deep shadow, mechanical intricacy, iron and rust, dungeons and vaults | Piranesi's *Carceri* etchings specifically — vast impossible prisons, staircases into darkness |
| **Fey** | Arthur Rackham + Edmund Dulac | Delicate linework, jewel-toned color, organic forms, enchanted forests, moonlit courts | Rackham for earth/nature/creature Fey; Dulac for court/celestial/water Fey |
| **Demonic** | Hieronymus Bosch | Grotesque carnival imagery, hellish detail, absurdist horror, organic and mechanical corruption | Bosch alone — no second artist. His world is singular. |
| **Celestial** | Gustave Doré (Paradise) + William Blake | Divine light, geometric order, monumental figures, heavenly radiance | Doré's *Paradise Lost* and *Dante's Paradiso* — upward motion, radiant whites. Blake's prophetic figures for powerful creatures |
| **Endless** | Gustave Doré (Inferno) + Francisco Goya | Desolate wasteland, cold dark atmosphere, existential dread, vast emptiness | Doré's *Inferno* and *Divine Comedy* — downward motion, cold light in darkness. Goya's *Black Paintings* for horror and raw power |

**Doré disambiguation:** Doré appears for both Celestial and Endless but from completely different bodies of work. Celestial prompts reference *Paradise Lost* and *Paradiso* — warm radiant light, upward composition, divine geometry. Endless prompts reference *Inferno* — cold light carving through deep shadow, vast desolate scale, figures diminished by environment. Always specify the work title in the prompt, not just "Gustave Doré style."

**Service selection by card type:**

| Card Type | Service |
|-----------|---------|
| Creature (any faction) | Custom LoRA via Replicate |
| Spell, stabilizer, planar ruin (any faction) | fal.ai — FLUX.1 Dev |

Neutral planar ruins (pre-evolution) use a neutral environment prompt — no faction style suffix. Faction-evolved ruins use the faction's full style suffix.

### 3.2 Custom LoRA: chscrt-sdxl-lora.safetensors

**What it is:** A custom LoRA trained on creature images generated from SDXL + EldritchPaletteKnife, producing impasto oil-painting brushstroke texture with broader creature variety than EldritchPaletteKnife alone.

**⚠️ Commercial License Status — Research findings (verified Feb 2026):**

EldritchPaletteKnife (CivitAI model 336656) is an SDXL 1.0 LoRA by creator `eldritchadam`. Its base model is SDXL 1.0, which is licensed under the **CreativeML Open RAIL++ License** — a permissive license that allows commercial use of generated outputs and permits training derivative models from outputs, provided the Open RAIL++ usage restrictions (no harmful content, etc.) are followed.

CivitAI's permission system lets model authors override the default with checkboxes (e.g. "no commercial use," "no merges"). The EldritchPaletteKnife model page renders in JavaScript and the permission checkboxes could not be machine-read during verification. However:

- The model description contains no explicit commercial restriction
- The creator has not noted any non-commercial restriction in the model text
- Multiple third-party archives (CivArchive, SeaArt) mirror the model without flagging commercial restrictions
- The model is also hosted on Hugging Face at `EldritchAdam/SDXL_Eldritch_LoRAs` with no stated license restrictions

**Likely status: commercially usable.** The SDXL base license permits it and no explicit restriction was found.

**Required action before shipping:** A human must visit `civitai.com/models/336656` directly, click the "License" link on the model page, and confirm the permission checkboxes show "Allow commercial use" is enabled. Screenshot this and store it in `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png`. If commercial use is *not* permitted, retrain the LoRA using SDXL base outputs only (Apache 2.0, unambiguously commercial-safe) and delete all assets generated using the original LoRA.

**⛔ COMMERCIAL PIPELINE GATE — do not proceed to artwork generation without completing this step.**

**How to run the LoRA — Replicate (required deployment method):**

The LoRA is stored on Cloudflare R2 and loaded directly from its public URL at generation time via Replicate's `extra_lora` parameter. There is no push step, no custom model to manage, and no version hash to track. The URL is the permanent reference.

**LoRA URL (constant — do not change):**

```javascript
const CHSCRT_LORA = 'https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors'
```

Store this as `LORA_URL` in `.env`. Always reference it from the environment — never hardcode the URL in generation scripts directly, so it can be updated in one place if the R2 location ever changes.

```bash
# .env addition
LORA_URL=https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors
```

**One-time setup:**

```bash
# Install Replicate Python client
pip3 install replicate requests --break-system-packages

# Authenticate
source Scripts/load_env.sh
python3 -c "import replicate; print('Replicate client OK')"

# Verify the R2 URL is reachable before any generation runs
python3 -c "
import requests, os
url = os.environ.get('LORA_URL')
r = requests.head(url, timeout=15)
if r.status_code == 200:
    print('R2 LoRA URL reachable OK')
else:
    print(f'R2 URL UNREACHABLE — HTTP {r.status_code}')
    exit(1)
"
```

Run the R2 reachability check at the start of every generation session. Do not proceed with creature artwork generation if the URL is unreachable — there is no local fallback for the LoRA.

**Generation call (Python):**

```python
import replicate, os, requests
from pathlib import Path

# The base SDXL model that accepts extra_lora weights
SDXL_MODEL = "stability-ai/sdxl:39ed52f2319f9b723b1b4ed18b9edd6f78c97bcf8d4e2b70e72a3a449673f77"

def generate_creature_artwork(prompt: str, negative_prompt: str, output_path: str) -> bool:
    lora_url = os.environ.get("LORA_URL")
    if not lora_url:
        print("ERROR: LORA_URL not set in environment")
        return False

    try:
        output = replicate.run(
            SDXL_MODEL,
            input={
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "extra_lora": lora_url,          # R2 URL loaded directly at inference time
                "extra_lora_scale": 0.85,         # 0.8–0.9 preserves creature detail without overfit
                "num_inference_steps": 35,
                "guidance_scale": 7.5,
                "width": 1024,
                "height": 1024,
                "scheduler": "DPMSolverMultistep",
            }
        )

        if not output:
            print("ERROR: Replicate returned empty output")
            return False

        image_url = output[0] if isinstance(output, list) else str(output)
        response = requests.get(image_url, timeout=60)
        if response.status_code != 200:
            print(f"ERROR: Failed to download output — HTTP {response.status_code}")
            return False

        Path(output_path).write_bytes(response.content)
        print(f"Saved: {output_path}")
        return True

    except replicate.exceptions.ReplicateError as e:
        print(f"ERROR: Replicate API error — {e}")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected failure — {e}")
        return False
```

**LoRA scale tuning guide:**

| `extra_lora_scale` | Effect |
|--------------------|--------|
| 0.6–0.7 | Subtle impasto texture, more prompt flexibility |
| 0.8–0.9 | Strong brushwork, recommended for most creatures |
| 1.0+ | Maximum LoRA influence, may overfit on some subjects |

If a creature subject produces distorted anatomy at 0.85, reduce scale to 0.7 before switching to fal.ai — the LoRA may be over-influencing complex poses.

**After every generation call, verify before using downstream:**

```bash
python3 Scripts/verify_asset.py "$OUTPUT_PATH" \
  --min-width 1024 --min-height 1024 \
  --no-error-payload
```

**Replicate-specific failure handling:**

| Failure | Response |
|---------|----------|
| R2 URL unreachable | Do not retry generation — diagnose R2 connectivity first |
| Rate limit (HTTP 429) | Wait 30s, retry once. If still failing, switch to fal.ai for that asset |
| Cold start timeout | Retry immediately — Replicate cold starts resolve on second call |
| Empty output list | Log the prompt, do not use a blank result, count against retry budget |
| Output URL expired | Replicate output URLs expire after ~1 hour — always download immediately, never store the URL |
| `extra_lora` fetch error | Replicate logs this as a model error — verify R2 URL is publicly readable with `requests.head()` |

**Cost tracking:** Replicate bills per second of GPU time. Log estimated and actual cost for every call in `Logs/BUDGET_LEDGER.md`. At SDXL scale with LoRA loading, expect approximately $0.04–0.07 per generation at 35 steps (slightly higher than base SDXL due to LoRA fetch overhead). If a run fails after billing has started, log the cost — it still counts against budget.

**Faction-aware prompt structure for creature artwork:**

The sub-faction field drives a secondary style suffix that refines the faction-level reference. Always look up both `card.faction` and `card.subFaction` before building the prompt.

```python
# Scripts/prompt_utils.py

# Primary faction style — defines the artistic lineage
FACTION_CREATURE_STYLE = {
    "ironwright": (
        "Piranesi Carceri prison architecture influence, deep shadow, iron and stone, "
        "monumental scale, etching quality linework in paint, warm rust and ochre palette, "
        "NOT steampunk, no brass, no gears, no steam, no clockwork"
    ),
    "fey": (
        "Arthur Rackham and Edmund Dulac style, delicate sinuous linework, jewel-tone color, "
        "enchanted forest atmosphere, organic forms, moonlit quality"
    ),
    "demonic": (
        "Hieronymus Bosch style, grotesque detail, hellish carnival atmosphere, "
        "surreal corruption of organic and mechanical forms, dense symbolic horror"
    ),
    "celestial": (
        "Gustave Doré Paradise Lost style, radiant divine light, upward composition, "
        "monumental figure scale, William Blake prophetic power, warm gold and white"
    ),
    "endless": (
        "Gustave Doré Inferno style, cold light in deep darkness, vast desolate scale, "
        "figures diminished by environment, Goya Black Paintings raw power, grey and cold"
    ),
}

# Sub-faction refinement — appended after faction style to narrow visual character
SUBFACTION_CREATURE_STYLE = {
    "foundryDirectorate": (
        "reactor-blue light from chest cavity, poured concrete surfaces, exposed rebar, "
        "geometric silhouette, no ornamentation, brutalist industrial"
    ),
    "scrapLegions": (
        "asymmetric mismatched components, warning-orange rust, salvaged alien materials, "
        "exposed sparking wiring, jury-rigged, patchwork construction"
    ),
    "verdantThrone": (
        "bioluminescent markings pulse green, flowering antlers, bark-skin with visible grain, "
        "warm sunlit canopy background, symbiotic and nurturing"
    ),
    "hollowCourt": (
        "frost-crown, bare bone visible, solid black eyes with cold starlight pupils, "
        "midnight winter forest, predatory stillness, moth-wing texture"
    ),
    "furnaceLords": (
        "magma visible through cracked obsidian skin, volcanic glass horns, molten gold eyes, "
        "volcanic caldera background, everything burns"
    ),
    "obsidianBureaucracy": (
        "formal robes of black silk, ink-stained hands, chains draped as mantle, "
        "obsidian tower interior with filing cabinets, reddish dim light, too-many-eyes"
    ),
    "knightsOfDeliverance": (
        "gold and ivory plate armor, divine blue tabard, halo of soft golden light, "
        "formation geometry behind figure, fortress-cathedral above clouds"
    ),
    "heavensChosen": (
        "concentric burning wheels covered in open eyes, six wings of fire, "
        "geometric and organic simultaneously, reality warping around it, "
        "cathedral architecture flowing like liquid in background"
    ),
    "necromanticCabals": (
        "tattered scholarly robes, crown of fused finger-bones, eye sockets glow cold teal, "
        "bone staff with caged phylactery, subterranean cathedral of bones background"
    ),
    "lostSpectres": (
        "translucent ghostly figure flickering between solid and ethereal, "
        "hair drifting upward as though underwater, broken chain from one wrist, "
        "fog-choked battlefield background, spectral mist"
    ),
}

def build_creature_prompt(description: str, accent_color: str, composition: str,
                          faction: str, sub_faction: str) -> str:
    faction_style = FACTION_CREATURE_STYLE.get(faction, FACTION_CREATURE_STYLE["ironwright"])
    sub_style = SUBFACTION_CREATURE_STYLE.get(sub_faction, "")
    return (
        f"{description}, fantasy creature, oil painting, impasto brushwork, "
        f"thick paint texture, dramatic chiaroscuro, {accent_color} palette, "
        f"{composition}, detailed, high contrast, {faction_style}"
        + (f", {sub_style}" if sub_style else "")
    )
```

**Example prompts by sub-faction:**

*Foundry Directorate (Ironwright) creature:*
```
"armored concrete golem, fantasy creature, oil painting, impasto brushwork,
thick paint texture, dramatic chiaroscuro, warm ochre and iron-grey palette,
three-quarter view, detailed, high contrast,
Piranesi Carceri prison architecture influence, deep shadow, iron and stone,
monumental scale, etching quality linework in paint,
NOT steampunk, no brass, no gears, no steam, no clockwork,
reactor-blue light from chest cavity, poured concrete surfaces, exposed rebar,
geometric silhouette, no ornamentation, brutalist industrial"
```

*Scrap Legions (Ironwright) creature:*
```
"asymmetric salvage-construct with mismatched limbs, fantasy creature, oil painting,
impasto brushwork, thick paint texture, dramatic chiaroscuro,
rust-orange and steel-grey palette, action pose, detailed, high contrast,
Piranesi Carceri influence, iron and stone, NOT steampunk no brass no gears no clockwork,
asymmetric mismatched components, warning-orange rust, salvaged alien materials,
exposed sparking wiring, jury-rigged patchwork construction"
```

*Verdant Throne (Fey) creature:*
```
"tall figure merging with living wood, bark-skin with visible grain, fantasy creature,
oil painting, impasto brushwork, thick paint texture, dramatic chiaroscuro,
emerald and gold palette, standing pose in ancient grove, detailed,
Arthur Rackham and Edmund Dulac style, delicate sinuous linework,
enchanted forest atmosphere, moonlit quality,
bioluminescent markings pulse green, flowering antlers,
warm sunlit canopy background, symbiotic and nurturing"
```

*Heaven's Chosen (Celestial) creature:*
```
"biblically accurate celestial entity, concentric rings of burning wheels, fantasy creature,
oil painting, impasto brushwork, thick paint texture, dramatic chiaroscuro,
warm gold and radiant white palette, floating upward composition, detailed,
Gustave Doré Paradise Lost style, radiant divine light, William Blake prophetic power,
concentric burning wheels covered in open eyes, six wings of fire,
geometric and organic simultaneously, reality warping, cathedral architecture flowing like liquid"
```

*Lost Spectres (Endless) creature:*
```
"translucent spectral figure of a woman, features visible but ghostly, fantasy creature,
oil painting, impasto brushwork, thick paint texture, dramatic chiaroscuro,
ghostly teal and sickly green palette, ethereal floating composition, detailed,
Gustave Doré Inferno style, cold light in deep darkness, Goya Black Paintings raw power,
flickering between solid and ethereal, hair drifting upward as though underwater,
broken chain from one wrist, fog-choked battlefield background"
```
Negative prompt for all creature LoRA calls:
```
"MTG, Magic the Gathering, Wizards of the Coast, Pokémon, Yu-Gi-Oh,
photorealistic, 3D render, digital art, anime, smooth, plastic,
watermark, signature, text, card frame, border, logo,
any trademarked character, ugly, deformed, extra limbs"
```

**Trigger words:** Verify trigger words in your specific LoRA training run. If unknown, test with and without `"oil painting impasto"` — if the LoRA activates, that phrase is likely included in training captions.

**When NOT to use the custom LoRA:**
- Non-creature cards (spells, stabilizers, planar ruins) — use fal.ai FLUX.1 Dev instead
- When the creature subject is highly architectural or mechanical (LoRA's creature bias may distort)

**LoRA fallback (if unavailable or poor result):**
- SDXL base via Replicate with `"oil painting impasto"` + faction/sub-faction style suffix — less specific but consistent
- fal.ai FLUX.1 Dev with faction/sub-faction style suffix — strong artistic quality, slightly less impasto

### 3.3 Non-Creature Artwork: fal.ai FLUX.1 Dev

fal.ai is used for all non-creature card artwork. FLUX.1 Dev handles painterly, atmospheric, and object-focused prompts significantly better than SDXL for this aesthetic — it produces strong oil paint character without needing a custom LoRA.

**⚠️ Commercial License Status — Research findings (verified Feb 2026):**

The FLUX.1 [dev] base model is released under the **FLUX.1 [dev] Non-Commercial License v1.1.2** by Black Forest Labs (BFL). This license restricts *running the model* to non-commercial purposes unless you hold a paid commercial license from BFL. Outputs, however, are explicitly relicensed: *"You may use Output for any purpose (including for commercial purposes)"* (License Section 2d).

The practical question is whether using FLUX.1 [dev] *through fal.ai's API* for a commercial app is compliant. Research findings:

- **fal.ai is an official BFL partner.** BFL's own announcements list fal.ai alongside Replicate as providing "ready-to-use API endpoints" for FLUX models. fal.ai's FLUX.1 [dev] product page explicitly states "Commercial licensing suitable for production deployments" and "Access both personal and commercial licensing options."
- **fal.ai holds a commercial agreement with BFL.** This is the standard arrangement for API resellers — fal.ai pays BFL for commercial access and passes that right to paying API customers. This is the same mechanism as Replicate.
- **You are not self-hosting the model.** The non-commercial restriction targets self-hosted deployments. Using a BFL-partnered API is a licensed commercial channel.

**Conclusion:** Using FLUX.1 [dev] via fal.ai for a commercial iOS app is commercially compliant based on fal.ai's BFL partnership, provided you use fal.ai's paid API (not a free tier that may have different terms). Your invoice from fal.ai is the audit trail.

**Alternative if you want zero ambiguity:** Switch `FAL_MODEL` to `"fal-ai/flux/schnell"` (FLUX.1 [schnell], Apache 2.0 — no commercial restrictions whatsoever, slightly lower quality than dev) or `"fal-ai/flux-pro"` (FLUX.1 [pro], commercially licensed API, highest quality). Update the constant in `.env` and no other code changes are needed.

**Document this decision in `Logs/DEPENDENCY_DECISIONS.md`** with the date, the chosen model, and a note confirming fal.ai's paid commercial API is in use.

**Setup:**

```bash
pip3 install fal-client requests --break-system-packages
```

Add to `.env`:
```bash
FAL_KEY=your_fal_api_key_here
```

Verify connectivity before any generation session:
```python
import fal_client, os
os.environ["FAL_KEY"] = os.environ.get("FAL_KEY", "")
result = fal_client.run("fal-ai/flux/dev",
    arguments={"prompt": "test", "num_images": 1, "image_size": "square_hd"})
print("fal.ai OK" if result else "fal.ai FAILED")
```

**Generation call:**

```python
import fal_client, os, requests
from pathlib import Path

FAL_MODEL = "fal-ai/flux/dev"

def generate_noncreature_artwork(prompt: str, negative_prompt: str, output_path: str) -> bool:
    fal_key = os.environ.get("FAL_KEY")
    if not fal_key:
        print("ERROR: FAL_KEY not set in environment")
        return False

    os.environ["FAL_KEY"] = fal_key

    try:
        result = fal_client.run(
            FAL_MODEL,
            arguments={
                "prompt": prompt,
                "num_inference_steps": 28,       # FLUX.1 Dev sweet spot
                "guidance_scale": 3.5,           # FLUX uses lower CFG than SDXL
                "image_size": "square_hd",       # 1024×1024
                "num_images": 1,
                "enable_safety_checker": False,  # fantasy content may trip safety filters
                "output_format": "png",
            }
        )

        if not result or not result.get("images"):
            print("ERROR: fal.ai returned empty result")
            return False

        image_url = result["images"][0]["url"]
        response = requests.get(image_url, timeout=60)
        if response.status_code != 200:
            print(f"ERROR: Failed to download output — HTTP {response.status_code}")
            return False

        Path(output_path).write_bytes(response.content)
        print(f"Saved: {output_path}")
        return True

    except Exception as e:
        print(f"ERROR: fal.ai generation failed — {e}")
        return False
```

**fal.ai failure handling:**

| Failure | Response |
|---------|----------|
| FAL_KEY missing | Check .env before any generation session |
| HTTP 422 validation error | Log full error — usually a prompt or parameter issue |
| HTTP 429 rate limit | Wait 15s, retry once |
| Empty images list | Log prompt, skip, count against retry budget |
| Output URL expired | fal.ai URLs are short-lived — download immediately, never store the URL |
| Safety filter block | Rephrase prompt to avoid triggering content filters — remove violent or explicit descriptors |

**Cost:** FLUX.1 Dev on fal.ai is approximately $0.025–0.04 per image at 28 steps.

**Faction-aware prompt templates for non-creature cards:**

Always inject the faction style suffix into non-creature prompts. The faction suffix dict is the same as for creature cards — define it once in `Scripts/prompt_utils.py` and import it everywhere.

```python
# Scripts/prompt_utils.py — shared by both generate scripts

FACTION_CREATURE_STYLE = { ... }  # as defined in Section 3.2

FACTION_NONCREATURE_STYLE = {
    "ironwright": (
        "Piranesi architectural engraving style, deep shadow, iron and stone texture, "
        "mechanical intricacy, etching line quality, warm ochre and rust palette"
    ),
    "fey": (
        "Arthur Rackham and Edmund Dulac style, delicate organic detail, "
        "jewel-tone color, enchanted atmosphere, moonlit quality"
    ),
    "demonic": (
        "Hieronymus Bosch style, grotesque symbolic detail, hellish imagery, "
        "dark carnival atmosphere, dense horror composition"
    ),
    "celestial": (
        "Gustave Doré Paradise Lost style, radiant divine light, geometric order, "
        "warm gold and white, William Blake visionary quality"
    ),
    "endless": (
        "Gustave Doré Inferno style, cold desolate light, vast empty space, "
        "Goya dark romanticism, grey and bone-white palette"
    ),
}

def build_noncreature_prompt(card_type: str, description: str,
                              faction: str, sub_faction: str = "",
                              extra: str = "") -> str:
    faction_style = FACTION_NONCREATURE_STYLE.get(faction, FACTION_NONCREATURE_STYLE["ironwright"])
    sub_style = SUBFACTION_CREATURE_STYLE.get(sub_faction, "")  # reuse same sub-faction dict
    style = faction_style + (f", {sub_style}" if sub_style else "")
    templates = {
        "spell": (
            f"{description}, fantasy spell effect, oil painting, impasto brushwork, "
            f"thick paint texture, dramatic magical energy, no figures, atmospheric, "
            f"dynamic motion, {style}"
        ),
        "stabilizer": (
            f"{description}, fantasy object or structure, oil painting, impasto texture, "
            f"detailed craftsmanship, aged patina, dramatic candlelight shadow, "
            f"isolated on dark background, still-life composition, {style}"
        ),
        "planarRuin": (
            f"{description}, ancient ruins in {faction} environment, oil painting, "
            f"impasto brushwork, massive ancient architecture, atmospheric perspective, "
            f"mysterious and monumental, {style}"
        ),
        "planarRuinNeutral": (
            f"{description}, ancient ruins of unknown origin, oil painting, impasto brushwork, "
            f"crystalline alloy architecture, fused stone, mysterious habitable structure, "
            f"atmospheric perspective, no faction markings, environment-agnostic, "
            f"Piranesi monumental scale, cold blue-grey palette"
        ),
    }
    return templates.get(card_type, templates["spell"]) + (f", {extra}" if extra else "")
```

**Example prompts by card type:**

*Foundry Directorate spell:*
```
"reactor core breach sending arcs of void energy, fantasy spell effect, oil painting,
impasto brushwork, thick paint texture, dramatic magical energy, no figures, atmospheric,
dynamic motion, Piranesi Carceri influence, NOT steampunk no brass no gears,
reactor-blue light, poured concrete surfaces, brutalist industrial"
```

*Obsidian Bureaucracy stabilizer (Chaos Rift):*
```
"cracked obsidian monolith leaking chaotic red energy, fantasy object, oil painting,
impasto texture, detailed craftsmanship, aged patina, dramatic candlelight shadow,
isolated on dark background, still-life composition, Hieronymus Bosch style,
formal obsidian with reddish dim light, ink-stained contracts pinned around base"
```

*Neutral Planar Ruin:*
```
"ancient ruin of fused stone and crystalline alloy, massive and mysterious,
no faction markings, oil painting, impasto brushwork, atmospheric perspective,
cold blue-grey crystalline surfaces, habitable structure amid chaos,
Piranesi monumental scale, cold blue-grey palette"
```

*Celestial faction-evolved Planar Ruin:*
```
"ancient ruin transformed by divine radiance, gold light emanating from crystalline walls,
oil painting, impasto brushwork, massive ancient architecture, atmospheric perspective,
Gustave Doré Paradise Lost style, radiant divine light, geometric order,
warm gold and white, William Blake visionary quality,
gold and ivory surfaces, divine blue light, fortress-cathedral presence"
```

**All non-creature prompts — always append this negative prompt:**
```
"photorealistic, 3D render, CGI, digital art, anime, cartoon, flat design,
smooth gradients, plastic, watermark, signature, text, card frame, border,
logo, modern, sci-fi, neon, MTG, Magic the Gathering, Pokémon, Yu-Gi-Oh,
any trademarked character or IP, ugly, deformed, low quality"
```

**After every generation call, verify before using downstream:**
```bash
python3 Scripts/verify_asset.py "$OUTPUT_PATH" \
  --min-width 1024 --min-height 1024 \
  --no-error-payload
```

### 3.3b Service Fallback Protocol

**If Replicate is unavailable or R2 is unreachable:**

| Failure | Immediate action | Fallback |
|---------|-----------------|----------|
| R2 URL unreachable (non-200 HEAD) | Stop creature generation. Do not attempt Replicate calls. | Switch all creature artwork for this session to fal.ai FLUX.1 Dev using `FACTION_CREATURE_STYLE` prompts. Log in BUDGET_LEDGER.md: "R2 unavailable — fallback to fal.ai for session [date]". |
| Replicate rate limit (HTTP 429) | Wait 30s, retry once. | If second attempt fails, switch to fal.ai for that asset only. |
| Replicate cold start timeout | Retry immediately once. Cold starts resolve on second call. | If second attempt fails, switch to fal.ai. |
| Replicate API key invalid | Stop all generation. Write to iteration_log.md: "BLOCKED: Replicate auth failure — human must check REPLICATE_API_TOKEN in .env". | Do not attempt fal.ai as a permanent substitute — fix the key. |

**If fal.ai is unavailable:**

| Failure | Immediate action | Fallback |
|---------|-----------------|----------|
| fal.ai HTTP 429 | Wait 15s, retry once. | If still failing, halt non-creature generation for the session. Write to iteration_log.md: "BLOCKED: fal.ai rate limited — pausing non-creature artwork generation". |
| fal.ai auth failure (401) | Stop all fal.ai calls. Write to iteration_log.md: "BLOCKED: fal.ai auth failure — human must check FAL_KEY in .env". | Do not substitute another service. |
| fal.ai empty result | Log the full prompt that caused the failure. Skip this asset. Increment retry counter. After 3 failures on same asset, flag to human. | — |

**Budget guard on fallback:** If R2 is down and you're routing all creatures to fal.ai, note that fal.ai costs approximately $0.025–0.04 per image vs $0.04–0.07 for Replicate. Update BUDGET_LEDGER.md with a note explaining the routing change so the cost difference is trackable.

---

### 3.3c Icon and Symbol Generation Briefs

All icons and symbols are generated once as static assets and stored in `Resources/Icons/`. They are not regenerated per card. Use fal.ai FLUX.1 Dev for all icon generation (same client as non-creature artwork).

**Output requirements for all icons:**
- 512×512pt PNG at 3× resolution (1536×1536px)
- Transparent background
- Single color fill (to be tinted in code) — not full color
- Clean silhouette — legible when scaled to 14×14pt display size
- After generation, verify readability by downscaling to 42×42px preview

**Post-processing pipeline for all icons (run after generation):**
```bash
# Convert to single-channel silhouette mask, then save as white-on-transparent PNG
# This allows runtime tinting in SwiftUI using .foregroundColor() on Image
convert "$INPUT" -colorspace Gray -threshold 50% -negate \
  \( +clone -alpha off -fill white -colorize 100 \) \
  -alpha on -compose CopyOpacity -composite \
  "$OUTPUT"
```

---

**SET SYMBOL — Generation brief**

The set symbol represents the game itself — the Great Fracture, the shattering of the barrier between planes.

```
A crystalline circle — the planar barrier — split and fractured. The left hemisphere is 
geometric and orderly (straight clean edges, crystalline facets, precise angles). The right 
hemisphere is jagged and chaotic (irregular cracks, sharp shards, asymmetric breaks). 
The split runs vertically through the center. Both halves are clearly the same circle, 
but cracked into opposing natures. Bold clean silhouette. No internal detail. 
Fantasy insignia style. Pure black on white background. Flat 2D design.
```

Negative prompt: `"photorealistic, 3D, shading, gradients, color, text, letters, complexity, noise, blur, multiple objects"`

Store at: `Resources/Icons/set_symbol.png`

---

**FACTION ICONS — Generation briefs (one per faction)**

All faction icons share these parameters:
- Style: flat fantasy insignia, bold silhouette, heraldic quality
- No fine internal detail — must read at 14pt
- Pure black on white background (will be tinted in code)

> **Color note:** Do not use faction colors in the generation prompt and do not try to generate colored icons. The faction color (`wax-red`, `fey-teal`, etc.) is applied entirely at runtime by SwiftUI's `.renderingMode(.template)` — the asset itself must be a black silhouette on white. Any color you bake into the generated image will be overwritten at render time. Generate all five faction icons identically in terms of color treatment.

*Ironwright Collective — Sledgehammer:*
```
A heavy industrial sledgehammer, head facing left, handle angled down-right. 
Brutalist and heavy. Wide flat striking face. Thick handle. No ornamentation. 
Bold flat silhouette. Heraldic badge style.
```
Store at: `Resources/Icons/faction_ironwright.png`

*Fey Courts — Tree:*
```
A gnarled ancient tree, full canopy, visible root system spreading at base mirroring 
the branch spread above. Symmetrical but organic. Branches reach upward. Roots reach 
downward. Equal weight top and bottom. Bold flat silhouette. Heraldic badge style.
```
Store at: `Resources/Icons/faction_fey.png`

*Demonic Kingdoms — Scroll:*
```
An unrolled scroll, both ends curled outward (classical scroll shape). Slightly worn 
and aged at edges. The scroll face is blank. Bold flat silhouette with visible roll 
curls at top and bottom. Heraldic badge style.
```
Store at: `Resources/Icons/faction_demonic.png`

*Celestial Crusade — Single Angelic Wing:*
```
A single large angelic wing, facing right, feathers clearly defined, tips curving 
upward. Majestic and spread wide. Bold flat silhouette with individual feather 
definition visible at badge scale. Heraldic badge style.
```
Store at: `Resources/Icons/faction_celestial.png`

*The Endless — Skull:*
```
A human skull, front-facing, classic and clean. Eye sockets visible. Slightly aged 
and worn. No jaw — skull ends cleanly at the mandible line. Bold flat silhouette. 
Heraldic badge style.
```
Store at: `Resources/Icons/faction_endless.png`

---

**CHAOS MOTE SYMBOL — Generation brief**

The chaos mote symbol is used as a single 20×20pt icon in the name bar cost display (`N ⊕` format). Not tiled. Generate at 256×256px for 1× resolution, scaled down to 20pt in rendering. It must read clearly at 20×20pt.

```
A swirling orb of chaotic magical energy. Circular shape. Interior shows turbulent 
swirling motion — not a smooth gradient, but a violent churning. Color: fiery 
red-orange blending into deep purple, chaotic and energetic. The outer edge is 
a rough, slightly irregular circle — not a perfect circle. Fantasy magical energy. 
Bold and readable at small scale.
```

**Post-processing for chaos mote symbol:** Unlike faction icons, this is a full-color asset — do NOT convert to silhouette. Retain full color. Downscale from 256×256px source to 20pt @3× (60×60px) for use in the name bar `N ⊕` display.

Store at: `Resources/Icons/chaos_mote_symbol.png`

---

**D20 INSTABILITY ICON — Generation brief**

The D20 instability icon is displayed alongside the creature's instability value in the stats bar.

```
A twenty-sided die (D20) face, viewed straight-on. The face shows a crack or 
fracture running diagonally across it — suggesting chaotic instability. The crack 
is significant but the die shape is still clearly readable. Clean flat silhouette. 
Bold clear edges. No number visible on the face. Heraldic badge style.
```

Store at: `Resources/Icons/instability_d20.png`

---

### 3.4 Artwork Color Grading (Critical — Do Not Skip)

Generated artwork will have its own color temperature that likely does not match the parchment palette. Every generated artwork must be color graded before use. This is not optional — ungraded artwork will look pasted onto the card rather than part of it.

**Faction-aware color grading pipeline:**

All factions share a base warm-shift pass to harmonize with the parchment substrate, but each faction has additional grading on top. Always run `base_grade` first, then the faction-specific pass.

```bash
#!/bin/bash
# Scripts/grade_artwork.sh
# Usage: bash Scripts/grade_artwork.sh INPUT OUTPUT FACTION
# FACTION: ironwright | fey | demonic | celestial | endless
INPUT=$1
OUTPUT=$2
FACTION=${3:-ironwright}
STAGING="Staging/grade_temp_$(basename $INPUT)"

# ── BASE PASS (all factions) ────────────────────────────────────────────────
# Warm shift, blue reduction, saturation aged-down, warm vignette
convert "$INPUT" \
  -modulate 100,85,95 \
  -channel Blue  -evaluate multiply 0.88 +channel \
  -channel Red   -evaluate multiply 1.06 +channel \
  -modulate 100,82,100 \
  \( +clone -fill "#8B6914" -colorize 100 \
     -channel Alpha -fx "1-2*abs(i/w-0.5)*1.2*2*abs(j/h-0.5)*1.2" \) \
  -composite \
  "$STAGING"

# ── FACTION PASS ────────────────────────────────────────────────────────────
case "$FACTION" in
  ironwright)
    # Push toward iron-grey and ochre; deepen shadows; slight contrast boost
    convert "$STAGING" \
      -channel Blue  -evaluate multiply 0.82 +channel \
      -channel Green -evaluate multiply 0.94 +channel \
      -brightness-contrast 2x8 \
      "$OUTPUT"
    ;;
  fey)
    # Preserve jewel tones; allow slightly cooler highlights; moonlit quality
    convert "$STAGING" \
      -channel Blue  -evaluate multiply 1.04 +channel \
      -channel Green -evaluate multiply 1.02 +channel \
      -modulate 100,90,100 \
      "$OUTPUT"
    ;;
  demonic)
    # Deep shadows, saturate darks toward crimson, desaturate highlights
    convert "$STAGING" \
      -channel Red   -evaluate multiply 1.08 +channel \
      -channel Blue  -evaluate multiply 0.78 +channel \
      -brightness-contrast -4x12 \
      "$OUTPUT"
    ;;
  celestial)
    # Lift highlights toward gold-white; reduce shadow darkness; warm radiance
    convert "$STAGING" \
      -channel Red   -evaluate multiply 1.10 +channel \
      -channel Green -evaluate multiply 1.05 +channel \
      -brightness-contrast 6x-4 \
      "$OUTPUT"
    ;;
  endless)
    # Desaturate toward grey-bone; cool the midtones; deepen far shadows
    convert "$STAGING" \
      -modulate 100,68,100 \
      -channel Blue  -evaluate multiply 1.06 +channel \
      -brightness-contrast -2x6 \
      "$OUTPUT"
    ;;
  *)
    echo "Unknown faction '$FACTION' — applying base grade only"
    cp "$STAGING" "$OUTPUT"
    ;;
esac

rm -f "$STAGING"
echo "Graded [$FACTION]: $OUTPUT"
python3 Scripts/verify_asset.py "$OUTPUT" --min-width 512 --min-height 512
```

**Verify grading result:** After grading, compare to the faction swatch:

| Faction | Highlight target | Shadow target | Check |
|---------|----------------|--------------|-------|
| Ironwright | Ochre-warm (#C8A951 range) | Near-black with rust tinge | No blue highlights |
| Fey | Silver-moonlit (cool but not cold) | Deep forest green-black | Jewel tones preserved |
| Demonic | Dark crimson-warm | Near-black with red cast | No clean whites |
| Celestial | Gold-white radiance | Warm mid-grey | Highlights must feel luminous |
| Endless | Bone-white | Cold grey-black | No warm tones in shadows |

All factions: artwork highlights must harmonize with `parchment-light` (#F5E6C8) — warm, never cool. Endless is the trickiest: its midtones are cold but the card substrate is warm parchment, so the art box vignette feathering (Section 3.7) does extra work to bridge them.

### 3.4b Evolution Artwork Pipeline

Every evolved card's artwork must be generated from the **immediately preceding tier's graded artwork** — not the original Common. This preserves visual continuity across the evolution chain: a Legendary carries DNA from every prior stage.

**File naming convention:**

All artwork files live in `Resources/CardArt/` and follow this exact pattern:

```
{card_uuid}_{tier}.png
```

| Tier | Filename | Example |
|------|----------|---------|
| Common | `{uuid}_common.png` | `a1b2c3d4_common.png` |
| Uncommon | `{uuid}_uncommon.png` | `a1b2c3d4_uncommon.png` |
| Rare | `{uuid}_rare.png` | `a1b2c3d4_rare.png` |
| Epic | `{uuid}_epic.png` | `a1b2c3d4_epic.png` |
| Legendary | `{uuid}_legendary.png` | `a1b2c3d4_legendary.png` |

The `artworkLineage` field on the `Card` struct holds the list of all prior tiers' asset names in order. Update this list after every successful evolution. The current tier's asset is always `artworkAssetName`.

**Source image lookup:**

```python
TIER_ORDER = ["common", "uncommon", "rare", "epic", "legendary"]

def get_source_artwork_path(card_uuid: str, target_tier: str) -> str:
    """Returns the path to the immediately preceding tier's graded artwork.
    Raises ValueError if called for Common (no source exists)."""
    idx = TIER_ORDER.index(target_tier)
    if idx == 0:
        raise ValueError("Common cards have no source — generate from prompt only")
    source_tier = TIER_ORDER[idx - 1]
    path = f"Resources/CardArt/{card_uuid}_{source_tier}.png"
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Source artwork missing: {path}\n"
            f"Cannot evolve to {target_tier} without {source_tier} artwork.\n"
            f"Check artworkLineage field and ensure prior generation completed."
        )
    return path
```

**Evolution direction applied to the prompt:**

When evolving, the player chose Order or Chaos direction. Inject the evolution direction modifier into the prompt — this is what gives each tier's art its distinctive character shift.

```python
EVOLUTION_ORDER_MODIFIER = (
    "Order evolution: more structured, crystalline, refined, armor hardens, "
    "light brightens, elegant geometric patterns emerge from chaos, transformation is elegant"
)

EVOLUTION_CHAOS_MODIFIER = (
    "Chaos evolution: wilder, more distorted, more powerful, forms crack and reshape, "
    "energy leaks at edges, transformation is violent and beautiful, raw power visible"
)

def get_evolution_modifier(direction: str) -> str:
    if direction == "order":
        return EVOLUTION_ORDER_MODIFIER
    elif direction == "chaos":
        return EVOLUTION_CHAOS_MODIFIER
    else:
        raise ValueError(f"Unknown evolution direction: {direction}")
```

**Creature evolution generation (Replicate LoRA, image-to-image):**

```python
import replicate, os, requests, base64
from pathlib import Path

def evolve_creature_artwork(card_uuid: str, target_tier: str, direction: str,
                             faction: str, sub_faction: str, description: str,
                             accent_color: str, composition: str) -> str:
    """Generate evolved artwork from the immediately preceding tier.
    Returns path to the new graded artwork file."""
    source_path = get_source_artwork_path(card_uuid, target_tier)
    output_path = f"Resources/CardArt/{card_uuid}_{target_tier}.png"

    # Build prompt — base creature prompt + evolution direction modifier
    base_prompt = build_creature_prompt(description, accent_color, composition,
                                         faction, sub_faction)
    evo_mod = get_evolution_modifier(direction)
    full_prompt = f"{base_prompt}, {evo_mod}"

    # Encode source image
    with open(source_path, "rb") as f:
        source_b64 = base64.b64encode(f.read()).decode()

    # Run LoRA with image-to-image (img2img_strength controls how much of source is retained)
    # 0.55–0.65 = strong continuity with meaningful change (recommended)
    # Lower = more like source; Higher = more divergence
    img2img_strength = 0.60

    lora_url = os.environ.get("LORA_URL")
    if not lora_url:
        raise RuntimeError("LORA_URL not set in environment — cannot run evolution generation")

    # NOTE: LORA_URL is the safetensors weight file, NOT the Replicate model ID.
    # The model is always SDXL_MODEL; the LoRA is loaded as extra_lora at inference time.
    output = replicate.run(
        SDXL_MODEL,
        input={
            "prompt": full_prompt,
            "negative_prompt": (
                "MTG, Magic the Gathering, Wizards of the Coast, Pokémon, Yu-Gi-Oh, "
                "photorealistic, 3D render, digital art, anime, smooth, plastic, "
                "watermark, signature, text, card frame, border, logo, "
                "any trademarked character, ugly, deformed, extra limbs"
            ),
            "image": f"data:image/png;base64,{source_b64}",
            "prompt_strength": img2img_strength,
            "extra_lora": lora_url,
            "extra_lora_scale": 0.85,
            "num_inference_steps": 35,
            "guidance_scale": 7.5,
            "width": 1024,
            "height": 1024,
            "num_outputs": 1,
        }
    )

    image_url = output[0] if isinstance(output, list) else str(output)
    response = requests.get(image_url, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to download evolved artwork: HTTP {response.status_code}")

    # Save raw, then grade
    raw_path = f"Staging/{card_uuid}_{target_tier}_raw.png"
    Path(raw_path).write_bytes(response.content)

    # Apply faction color grading
    import subprocess
    result = subprocess.run(
        ["bash", "Scripts/grade_artwork.sh", raw_path, output_path, faction],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"Color grading failed:\n{result.stderr}")

    print(f"Evolved [{direction}] {card_uuid}: {target_tier} → {output_path}")
    return output_path
```

**Non-creature evolution generation (fal.ai FLUX.1 Dev, image-to-image):**

```python
import fal_client, os, requests, base64
from pathlib import Path

def evolve_noncreature_artwork(card_uuid: str, target_tier: str, direction: str,
                                card_type: str, faction: str, sub_faction: str,
                                description: str) -> str:
    """Generate evolved non-creature artwork from the immediately preceding tier."""
    source_path = get_source_artwork_path(card_uuid, target_tier)
    output_path = f"Resources/CardArt/{card_uuid}_{target_tier}.png"

    base_prompt = build_noncreature_prompt(card_type, description, faction, sub_faction)
    evo_mod = get_evolution_modifier(direction)
    full_prompt = f"{base_prompt}, {evo_mod}"

    with open(source_path, "rb") as f:
        source_b64 = base64.b64encode(f.read()).decode()

    result = fal_client.run(
        "fal-ai/flux/dev",
        arguments={
            "prompt": full_prompt,
            "negative_prompt": (
                "photorealistic, 3D render, CGI, digital art, anime, cartoon, flat design, "
                "smooth gradients, plastic, watermark, signature, text, card frame, border, "
                "logo, modern, sci-fi, neon, MTG, Magic the Gathering, Pokémon, Yu-Gi-Oh, "
                "any trademarked character or IP, ugly, deformed, low quality"
            ),
            "image_url": f"data:image/png;base64,{source_b64}",
            "strength": 0.60,           # same continuity target as creature pipeline
            "num_inference_steps": 28,
            "guidance_scale": 3.5,
            "image_size": "square_hd",
            "num_images": 1,
            "enable_safety_checker": False,
            "output_format": "png",
        }
    )

    if not result or not result.get("images"):
        raise RuntimeError("fal.ai returned empty result for evolution generation")

    image_url = result["images"][0]["url"]
    response = requests.get(image_url, timeout=60)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to download evolved artwork: HTTP {response.status_code}")

    raw_path = f"Staging/{card_uuid}_{target_tier}_raw.png"
    Path(raw_path).write_bytes(response.content)

    import subprocess
    result_grade = subprocess.run(
        ["bash", "Scripts/grade_artwork.sh", raw_path, output_path, faction],
        capture_output=True, text=True
    )
    if result_grade.returncode != 0:
        raise RuntimeError(f"Color grading failed:\n{result_grade.stderr}")

    print(f"Evolved [{direction}] {card_uuid}: {target_tier} → {output_path}")
    return output_path
```

**img2img_strength guidance by evolution step:**

| Step | Recommended strength | Visual effect |
|------|---------------------|--------------|
| Common → Uncommon | 0.55 | Clear family resemblance; modest refinement |
| Uncommon → Rare | 0.60 | Visible evolution; composition may shift slightly |
| Rare → Epic | 0.65 | Significant transformation; subject recognizable but changed |
| Epic → Legendary | 0.70 | Maximum change while retaining lineage; feels like a culmination |

Order evolutions should use the lower end of each range (more continuity, more elegant). Chaos evolutions should use the upper end (more disruption, more dramatic change).

**After every evolution generation:**

1. Verify output dimensions ≥ 1024×1024: `python3 Scripts/verify_asset.py $OUTPUT_PATH --min-width 1024 --min-height 1024`
2. Update `card.artworkLineage` — append the new tier's asset name to the array
3. Update `card.artworkAssetName` to the new tier's asset name
4. Update `card.evolutionDirection` to the direction used
5. Update the card JSON in `Resources/Cards/`
6. Log to `Logs/evolution_log.md`: card UUID, source tier, target tier, direction, strength used, prompt hash, cost

**What to do when a generation breaks continuity:**

If the evolved artwork fails the visual continuity check (subject has changed beyond recognition, style has drifted, or the artwork looks like an independent generation rather than an evolution):

1. Reduce `img2img_strength` by 0.05 and regenerate
2. If still failing at 0.45, check that you're loading the correct source image (the immediately preceding tier, not the Common)
3. If source image is corrupted or missing, do NOT fall back to generating from the Common — log the issue to `Logs/iteration_log.md` as a human-review item and halt evolution for that card until the lineage is restored

### 3.5 Normal Map Generation

Normal maps are required by three shaders in this project (brushwork, parchment fiber, wax seal). Here is how to generate each.

**Brush normal map (for oil paint artwork shader):**

Download a CC0 oil paint texture to use as the heightmap source. Use the Unsplash API with your key, or use this direct CC0 alternative from Wikimedia Commons (no key required):

```bash
#!/bin/bash
# Download a suitable impasto texture as heightmap source
# Option A: Unsplash API (requires UNSPLASH_ACCESS_KEY in .env)
if [ -n "$UNSPLASH_ACCESS_KEY" ]; then
    curl -s "https://api.unsplash.com/search/photos?query=impasto+oil+paint+texture&per_page=1&orientation=squarish" \
         -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY" | \
         python3 -c "import json,sys; data=json.load(sys.stdin); print(data['results'][0]['urls']['full'])" | \
         xargs curl -s -o Staging/brush_source_raw.jpg
    echo "Downloaded via Unsplash API"

# Option B: Public domain oil paint texture (no key required)
else
    wget -q "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg" \
         -O Staging/brush_source_raw.jpg
    echo "Downloaded public domain oil paint texture (Wikimedia)"
fi

[ -s Staging/brush_source_raw.jpg ] && echo "Source texture OK" || { echo "DOWNLOAD FAILED"; exit 1; }
```

Then convert to normal map:

```bash
#!/bin/bash
# Scripts/generate_normal_map.sh
INPUT=$1       # grayscale or RGB source texture
OUTPUT=$2      # output normal map

# Convert to grayscale heightmap
convert "$INPUT" -colorspace Gray -resize 1024x1024 Staging/heightmap_temp.png

# Generate normal map using emboss technique
convert Staging/heightmap_temp.png \
  \( -clone 0 -roll +1+0 \) \( -clone 0 -roll -1+0 \) \
  -fx "u-v+0.5" Staging/nx.png

convert Staging/heightmap_temp.png \
  \( -clone 0 -roll +0+1 \) \( -clone 0 -roll +0-1 \) \
  -fx "u-v+0.5" Staging/ny.png

# Combine into RGB normal map (R=X, G=Y, B=Z constant)
convert Staging/nx.png Staging/ny.png \
  -fx "1" \
  -combine Resources/Textures/"$OUTPUT"

rm Staging/nx.png Staging/ny.png Staging/heightmap_temp.png
echo "Normal map: Resources/Textures/$OUTPUT"
```

**Parchment fiber normal map:** Use the Poly Haven parchment_paper PBR set directly — it includes a pre-made normal map. Download via the script in Section 4.8 (`Scripts/download_textures.sh`), which fetches all required Poly Haven textures programmatically. The normal map file is `parchment_normal_raw.jpg` after running that script — copy it to `Resources/Textures/parchment_normal.jpg`.

**Wax seal normal map:** Generate procedurally — a simple dome normal map. The center should point straight up (0.5, 0.5, 1.0 in RGB) and edges should curve inward smoothly:

```python
# Scripts/generate_wax_normal.py
from PIL import Image
import math, numpy as np

size = 256
img = np.zeros((size, size, 3), dtype=np.uint8)
cx, cy = size // 2, size // 2
radius = size // 2 - 4

for y in range(size):
    for x in range(size):
        dx = (x - cx) / radius
        dy = (y - cy) / radius
        dist = math.sqrt(dx*dx + dy*dy)
        if dist < 1.0:
            # Dome normal
            dz = math.sqrt(max(0, 1 - dist*dist))
            nx = int((-dx * 0.4 + 0.5) * 255)
            ny = int((-dy * 0.4 + 0.5) * 255)
            nz = int((dz * 0.6 + 0.5) * 255)
            img[y, x] = [nx, ny, nz]
        else:
            img[y, x] = [128, 128, 255]   # flat

Image.fromarray(img.astype(np.uint8)).save('Resources/Textures/wax_seal_normal.png')
print("Wax normal map generated")
```

### 3.6 Foil Gradient Texture Generation

The foil shader requires a warm iridescent gradient texture. Generate it programmatically — do not source from external assets.

```python
# Scripts/generate_foil_gradient.py
from PIL import Image
import numpy as np, math

w, h = 512, 512
img = np.zeros((h, w, 3), dtype=np.uint8)

# Warm iridescent color sequence: gold → amber → copper → bronze → gold
# Unlike cold holographic foil, this stays in the warm range
stops = [
    (0.0,  (200, 160,  60)),   # aged gold
    (0.2,  (180, 100,  40)),   # copper
    (0.4,  (220, 140,  80)),   # amber
    (0.6,  (160,  90,  30)),   # bronze
    (0.8,  (210, 170,  70)),   # light gold
    (1.0,  (200, 160,  60)),   # aged gold (wraps)
]

for x in range(w):
    t = x / w
    # Find surrounding stops
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i+1]
        if t0 <= t <= t1:
            blend = (t - t0) / (t1 - t0)
            r = int(c0[0] + (c1[0] - c0[0]) * blend)
            g = int(c0[1] + (c1[1] - c0[1]) * blend)
            b = int(c0[2] + (c1[2] - c0[2]) * blend)
            for y in range(h):
                # Add vertical variation with sine wave
                v = math.sin(y / h * math.pi * 3 + x / w * math.pi) * 0.15
                img[y, x] = [
                    min(255, max(0, int(r * (1 + v)))),
                    min(255, max(0, int(g * (1 + v)))),
                    min(255, max(0, int(b * (1 + v)))),
                ]
            break

Image.fromarray(img).save('Resources/Textures/foil_gradient.png')
print("Foil gradient generated: 512x512")
```

### 3.7 Art Box Compositing Specification

The artwork image does not simply sit in the art box — it must be composited with parchment in a way that makes it feel embedded in the card rather than pasted on.

Steps (apply in order in the artwork rendering layer):

1. **Clip artwork to art box rectangle** — no corner radius on art box, straight edges
2. **Apply oil paint shader** (Section 6.1) — brushwork + varnish specular
3. **Apply edge vignette** — 20pt feather fade at all 4 edges of the art box, fading to parchment-mid color. This blends the artwork into the parchment frame without a hard edge.
4. **Apply color grade overlay** — multiply blend with a `parchment-light` layer at 8% opacity over the entire art box. This unifies the artwork with the card's warm tone.
5. **Apply ambient occlusion shadow** — a soft inset shadow (radius 12pt, opacity 40%, color ink-black) around the inner perimeter of the art box to simulate depth and separate the art plane from the frame.

Implement steps 3-5 as a Metal fragment shader or as stacked SwiftUI layers, not as separate draw passes if performance is critical.

### 3.8 Icons and Symbols — Sourcing and Attribution

**Preferred source: AI-generated (Section 3.3c).** All primary game icons — faction icons, set symbol, chaos mote symbol, D20 instability icon — are generated via fal.ai FLUX.1 Dev per Section 3.3c. These are original works with no attribution requirement.

**Secondary source: game-icons.net (CC BY 3.0).** Used only for UI chrome fallbacks (e.g., the error state quill icon). Do not use game-icons.net for any primary card component — its CC BY 3.0 license requires attribution, creating an ongoing maintenance burden. If you use any game-icons.net asset:
- Add `"game-icons.net"` attribution to every entry in `ASSET_LICENSE_MANIFEST.md`
- Add a user-visible credit line to the app's Acknowledgements screen (see Section 3.9 on how to build this)
- CC BY 3.0 attribution must be visible to end users — logging it in the developer manifest is not sufficient

**Do not use The Noun Project** — requires manual web download and a paid per-asset commercial license. **Do not use Vectorizer.ai** — web UI only, no automation path.

**SF Symbols** — UI chrome only, never inside card components. No attribution required.

**Download game-icons.net fallback icons via script (error states only):**

```bash
#!/bin/bash
# Scripts/download_icons.sh
# game-icons.net serves PNGs directly — no API key needed
# Only download for error/fallback states — all primary card icons use AI generation (Section 3.3c)
mkdir -p Staging/icons Resources/Icons

BASE_DELAPOUITE="https://game-icons.net/icons/ffffff/transparent/1x1/delapouite"
BASE_LORC="https://game-icons.net/icons/ffffff/transparent/1x1/lorc"

download_icon() {
    local SLUG="$1" OUTPUT="$2"
    wget -q "${BASE_DELAPOUITE}/${SLUG}.png" -O "Staging/icons/${OUTPUT}.png" 2>/dev/null || \
    wget -q "${BASE_LORC}/${SLUG}.png"       -O "Staging/icons/${OUTPUT}.png" 2>/dev/null
    if [ -s "Staging/icons/${OUTPUT}.png" ]; then
        echo "OK: $OUTPUT"
        echo "| ${OUTPUT}.png | game-icons.net/${SLUG} | CC BY 3.0 | $(date +%Y-%m-%d) | Yes | Yes | Attribute in Acknowledgements screen |" \
             >> Resources/ASSET_LICENSE_MANIFEST.md
    else
        echo "NOT FOUND: $SLUG — check slug at game-icons.net/tags.html"
    fi
}

# Error fallback icon (used when artwork fails to load — see Section 2.3)
download_icon "quill-pen" "icon_quill_fallback"

# Wax seal rarity icons — must match Rarity.sealIconName values in Section 2.2
# All are CC BY 3.0 from game-icons.net
download_icon "circle-sparks"   "seal_common"
download_icon "celtic-knot"     "seal_uncommon"
download_icon "crown"           "seal_rare"
download_icon "all-seeing-eye"  "seal_epic"
download_icon "dragon-head"     "seal_legendary"

# Copy verified seal icons into asset catalog
for RARITY in common uncommon rare epic legendary; do
    SRC="Staging/icons/seal_${RARITY}.png"
    DEST="Assets.xcassets/Icons/seal_${RARITY}.imageset"
    if [ -s "$SRC" ]; then
        mkdir -p "$DEST"
        cp "$SRC" "$DEST/seal_${RARITY}.png"
        cat > "$DEST/Contents.json" << EOF
{
  "images": [{"filename": "seal_${RARITY}.png", "idiom": "universal", "scale": "1x"}],
  "info": {"author": "xcode", "version": 1}
}
EOF
        echo "OK: seal_${RARITY} added to asset catalog"
    else
        echo "WARN: seal_${RARITY}.png not downloaded — check slug at game-icons.net/tags.html"
    fi
done
```

### 3.9 License Manifest and Acknowledgements Screen

**Asset License Manifest:** Maintain `Resources/ASSET_LICENSE_MANIFEST.md` from day one. Every asset must have an entry before it is used anywhere in the project.

```markdown
| Filename | Source URL | License | Date | Commercial OK | Attr. Required | Notes |
|----------|-----------|---------|------|--------------|----------------|-------|
| dragon_art_v3.png | replicate.com/... | SDXL Apache 2.0 + custom LoRA (verify) | 2025-01-15 | Pending legal review | No | LoRA license TBD |
| icon_quill_fallback.png | game-icons.net/quill-pen | CC BY 3.0 | 2025-01-15 | Yes | Yes | Attribute in Acknowledgements screen |
| parchment_normal.jpg | polyhaven.com/a/parchment_paper | CC0 | 2025-01-15 | Yes | No | Part of PBR set |
| foil_gradient.png | Procedural (generate_foil_gradient.py) | Original | 2025-01-15 | Yes | No | |
| faction_ironwright.png | fal.ai/flux/dev (AI generated) | Original | 2025-01-15 | Yes | No | fal.ai paid API |
```

---

**Acknowledgements Screen (required before App Store submission):**

Three license families used in this project require user-visible attribution:

| Dependency | License | Requirement |
|-----------|---------|------------|
| Lottie (airbnb/lottie-ios) | Apache 2.0 | Include license text and copyright notice |
| Nuke (kean/Nuke) | MIT | Include license text and copyright notice |
| swift-collections (apple) | Apache 2.0 | Include license text and copyright notice |
| Any game-icons.net asset | CC BY 3.0 | Credit "game-icons.net" visibly to end users |

Attribution must be reachable by a user without installing a separate tool — typically a **Settings → Acknowledgements** screen or an in-app **About → Open Source Licenses** screen.

**Generate the Acknowledgements Settings Bundle automatically:**

Xcode can generate this bundle using the `license-plist` tool. Run this once during project setup and again after adding any new SPM dependency:

```bash
# Install license-plist (one-time)
brew install mono0926/license-plist/license-plist

# Generate Settings.bundle with all SPM license entries
# Run from project root (same directory as Package.swift)
license-plist --output-path CardGame/Settings.bundle

# Verify the bundle was created
ls CardGame/Settings.bundle/Root.plist && echo "Acknowledgements bundle OK" || echo "FAILED"
```

Add `Settings.bundle` to your Xcode target's Copy Bundle Resources build phase. This creates a **Settings → Acknowledgements** section in the iOS Settings app automatically — no custom UI needed.

**Add game-icons.net attribution to your in-app About screen** (if any game-icons.net icons are used):

```swift
// In your AboutView or SettingsView
Text("Icons from game-icons.net, used under CC BY 3.0.")
    .font(.footnote)
    .foregroundColor(.secondary)
```

This must be visible to end users in the app itself (the Settings bundle alone is not sufficient for CC BY 3.0, since many users never open Settings). A footnote in an About or Credits view is sufficient.

**Add `license-plist` to the pre-submission checklist** in Section 13 so it is re-run before every App Store build.

---

## Section 4: Environment & Tool Setup

Complete every step in this section before writing any rendering code.

### 4.1 Master Environment Verification

Run this once at the start of every session and after any environment change. It is the single source of truth for "am I ready to work?" — a passing run means every tool, simulator, API key, and Python library required by this guide is present and functional.

**`Scripts/verify_environment.sh`** — create this file first, before scaffolding anything else:

```bash
#!/bin/bash
# Scripts/verify_environment.sh
# Master environment check for Chaos Creatures card game implementation.
# Run from project root. Exit 0 = all clear. Exit 1 = one or more failures.
# Usage: bash Scripts/verify_environment.sh

set -o pipefail
PASS=0
FAIL=0
WARN=0
RESULTS=()

ok()   { PASS=$((PASS+1));  RESULTS+=("  ✓ $1"); }
fail() { FAIL=$((FAIL+1));  RESULTS+=("  ✗ $1"); }
warn() { WARN=$((WARN+1));  RESULTS+=("  ⚠ $1"); }

echo "================================================"
echo "  Chaos Creatures — Environment Verification"
echo "================================================"

# ── XCODE ────────────────────────────────────────────
echo ""
echo "── Xcode & Swift ──"

XCODE_PATH=$(xcode-select -p 2>/dev/null)
[ -n "$XCODE_PATH" ] && ok "Xcode path: $XCODE_PATH" || fail "Xcode not found — run: xcode-select --install"

SWIFT_VER=$(swift --version 2>&1 | grep -o "swift-[0-9]*\.[0-9]*" | head -1)
SWIFT_MAJOR=$(swift --version 2>&1 | grep -oE "[0-9]+\.[0-9]+" | head -1 | cut -d. -f1)
[ "${SWIFT_MAJOR:-0}" -ge 5 ] && ok "Swift: $SWIFT_VER" || fail "Swift 5.9+ required — got: $(swift --version 2>&1 | head -1)"

XCODE_VER=$(xcodebuild -version 2>/dev/null | head -1)
XCODE_MAJOR=$(echo "$XCODE_VER" | grep -oE "[0-9]+" | head -1)
[ "${XCODE_MAJOR:-0}" -ge 15 ] && ok "Xcode: $XCODE_VER" || fail "Xcode 15.2+ required — got: $XCODE_VER"

# ── REQUIRED SIMULATORS ──────────────────────────────
echo ""
echo "── Required Simulators ──"

check_sim() {
    local GREP="$1" LABEL="$2"
    xcrun simctl list devices available 2>/dev/null | grep -q "$GREP" \
        && ok "Simulator: $LABEL" \
        || fail "Simulator missing: $LABEL — install via Xcode → Settings → Platforms"
}
check_sim "iPhone 15 Pro"                  "iPhone 15 Pro (A17, 120Hz)"
check_sim "iPhone 12 "                     "iPhone 12 (A14, 60Hz — performance floor)"
check_sim "iPad Pro (12.9-inch) (6th"      "iPad Pro 12.9\" 6th gen (M2, Stage Manager)"
check_sim "iPad Air (5th"                  "iPad Air 5th gen (M1 — iPad performance floor)"

# ── CLI TOOLS ────────────────────────────────────────
echo ""
echo "── CLI Tools ──"

check_cmd() {
    local CMD="$1" LABEL="$2" INSTALL="$3"
    command -v "$CMD" &>/dev/null \
        && ok "$LABEL: $(command -v $CMD)" \
        || fail "$LABEL not found — install: $INSTALL"
}
check_cmd convert    "ImageMagick (convert)" "brew install imagemagick"
check_cmd pngquant   "pngquant"              "brew install pngquant"
check_cmd python3    "Python 3"              "brew install python@3.11"
check_cmd pip3       "pip3"                  "brew install python@3.11"
check_cmd svgexport  "svgexport"             "npm install -g svgexport"
check_cmd ffmpeg     "ffmpeg (audio processing)" "brew install ffmpeg"
check_cmd npm        "npm"                   "brew install node"
check_cmd node       "node"                  "brew install node"
check_cmd jq         "jq (JSON parsing)"     "brew install jq"

# license-plist (optional but required for pre-submission)
command -v license-plist &>/dev/null \
    && ok "license-plist: $(command -v license-plist)" \
    || warn "license-plist not installed — required before App Store submission: brew install mono0926/license-plist/license-plist"

# ── PYTHON LIBRARIES ─────────────────────────────────
echo ""
echo "── Python Libraries ──"

check_py() {
    local MOD="$1" INSTALL="$2"
    python3 -c "import $MOD" 2>/dev/null \
        && ok "Python: $MOD" \
        || fail "Python: $MOD not found — pip3 install $INSTALL --break-system-packages"
}
check_py PIL       "Pillow"
check_py numpy     "numpy"
check_py requests  "requests"
check_py replicate "replicate"
check_py fal_client "fal-client"

# ── API KEYS ─────────────────────────────────────────
echo ""
echo "── API Keys (.env) ──"

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    fail ".env file not found — create it from Section 4.5 template"
else
    ok ".env file exists"
    source "$ENV_FILE" 2>/dev/null || true

    check_key() {
        local KEY="$1" LABEL="$2" REQUIRED="$3"
        VAL="${!KEY}"
        if [ -n "$VAL" ]; then
            ok "Key set: $LABEL (${#VAL} chars)"
        elif [ "$REQUIRED" = "required" ]; then
            fail "Key missing: $LABEL ($KEY) — required for generation"
        else
            warn "Key missing: $LABEL ($KEY) — optional, needed for: $4"
        fi
    }

    check_key "REPLICATE_API_TOKEN" "Replicate (LoRA creature art)"  required
    check_key "FAL_KEY"             "fal.ai (FLUX non-creature art)" required
    check_key "LORA_URL"            "LoRA R2 weight URL"             required
    check_key "FREESOUND_API_KEY"   "Freesound (CC0 audio)"          optional "Section 8.2 sound download"
fi

# ── API CONNECTIVITY ─────────────────────────────────
echo ""
echo "── API Connectivity (live checks) ──"

if command -v python3 &>/dev/null && python3 -c "import requests" 2>/dev/null; then
    python3 - <<'PYEOF'
import os, sys

def ping(label, fn):
    try:
        result = fn()
        print(f"  ✓ {label}: {result}")
    except Exception as e:
        print(f"  ✗ {label}: {e}")

import requests

# Replicate
token = os.environ.get("REPLICATE_API_TOKEN","")
if token:
    ping("Replicate API", lambda: (
        lambda r: f"authenticated as {r.json().get('username','?')}" if r.status_code==200 else f"HTTP {r.status_code}"
    )(requests.get("https://api.replicate.com/v1/account",
                   headers={"Authorization": f"Token {token}"}, timeout=10)))
else:
    print("  ⚠ Replicate — skipped (key not set)")

# fal.ai
fal_key = os.environ.get("FAL_KEY","")
if fal_key:
    ping("fal.ai API", lambda: (
        lambda r: "key valid (405=POST-only endpoint)" if r.status_code in (200,405,422)
                  else f"HTTP {r.status_code} — check FAL_KEY"
    )(requests.get("https://fal.run/fal-ai/flux/dev",
                   headers={"Authorization": f"Key {fal_key}"}, timeout=10)))
else:
    print("  ⚠ fal.ai — skipped (key not set)")

# LoRA R2 URL
lora_url = os.environ.get("LORA_URL","")
if lora_url:
    ping("LoRA R2 URL (weight file)", lambda: (
        lambda r: f"reachable ({r.headers.get('content-length','?')} bytes)" if r.status_code==200
                  else f"HTTP {r.status_code}"
    )(requests.head(lora_url, timeout=15)))
else:
    print("  ⚠ LoRA R2 URL — skipped (not set)")

# Freesound (optional)
fskey = os.environ.get("FREESOUND_API_KEY","")
if fskey:
    ping("Freesound API (optional)", lambda: (
        lambda r: "key valid" if r.status_code==200 else f"HTTP {r.status_code}"
    )(requests.get(f"https://freesound.org/apiv2/me/?token={fskey}", timeout=10)))
else:
    print("  ⚠ Freesound — skipped (optional key not set)")
PYEOF
else
    warn "Skipping live API checks — requests library not installed"
fi

# ── PORA R2 LEGAL GATE ───────────────────────────────
echo ""
echo "── Legal Gates ──"
ls Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png &>/dev/null \
    && ok "LoRA license evidence: screenshot present" \
    || warn "LoRA license evidence: screenshot not yet saved — required before App Store submission (Section 3.2)"

# ── SUMMARY ──────────────────────────────────────────
echo ""
echo "================================================"
echo "  Results: $PASS passed | $FAIL failed | $WARN warnings"
echo "================================================"
for R in "${RESULTS[@]}"; do echo "$R"; done
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo "❌ ENVIRONMENT NOT READY — fix $FAIL failure(s) above before proceeding"
    exit 1
elif [ "$WARN" -gt 0 ]; then
    echo "⚠️  Environment ready for core work — $WARN optional item(s) need attention"
    exit 0
else
    echo "✅ ENVIRONMENT FULLY READY — all checks passed"
    exit 0
fi
```

Run it:
```bash
chmod +x Scripts/verify_environment.sh
bash Scripts/verify_environment.sh
```

**Interpreting results:**
- `✓` — present and working, nothing to do
- `✗` — hard failure, must fix before proceeding (generation will fail or produce wrong output)
- `⚠` — optional or deferred item; core work can proceed but it will be needed before completion

**What each check covers:**

| Check group | What it catches |
|-------------|----------------|
| Xcode & Swift | Wrong version installed, CLI tools not linked |
| Simulators | Missing required device targets — smoke test will fail at hard gate |
| CLI Tools | ImageMagick, ffmpeg, pngquant, svgexport, jq — generation and processing scripts all depend on these |
| Python Libraries | PIL (image verification), replicate + fal-client (generation), requests (API checks) |
| API Keys | Missing keys in .env — generation calls will fail with auth errors |
| API Connectivity | Keys are set but wrong — catches typos and expired tokens before any budget is spent |
| Legal Gate | LoRA license screenshot — required before any App Store submission |

All four simulators must be present. Do not substitute different models.



### 4.2 Project Scaffolding

```bash
mkdir -p CardGame/{Sources,Resources,Tests,Scripts,Assets.xcassets,Staging}
mkdir -p CardGame/Sources/{Views,Models,Shaders,Services,Effects,Haptics,Audio,Extensions}
mkdir -p CardGame/Resources/{Cards,Fonts,Icons,Textures,Sounds,Particles,Haptics,Shaders}
mkdir -p CardGame/Tests/ReferenceScreenshots/{iPhone15Pro,iPhone12,iPadPro,iPadAir}
mkdir -p CardGame/Logs/{Builds,Iterations,Handoffs,Shaders}
mkdir -p CardGame/Staging
touch CardGame/Logs/iteration_log.md
touch CardGame/Logs/BUDGET_LEDGER.md
touch CardGame/Resources/ASSET_LICENSE_MANIFEST.md
touch CardGame/Logs/DEPENDENCY_DECISIONS.md
```

### 4.3 Required Dependencies (SPM)

Add to `Package.swift` or via Xcode's package manager:

```swift
dependencies: [
    .package(url: "https://github.com/airbnb/lottie-ios", from: "4.3.0"),      // Apache 2.0
    .package(url: "https://github.com/kean/Nuke", from: "12.0.0"),              // MIT
    .package(url: "https://github.com/apple/swift-collections", from: "1.0.0"), // Apache 2.0
]
```

After adding dependencies, verify the build before proceeding:
```bash
swift build 2>&1 | grep "error:" && { echo "BUILD BROKEN — fix before continuing"; exit 1; } || echo "Dependencies OK"
```

**Generate the Acknowledgements Settings Bundle** (required — Apache 2.0 and MIT licenses mandate attribution visible to end users):

```bash
# Install license-plist (one-time)
brew install mono0926/license-plist/license-plist

# Generate from project root — regenerate any time a new SPM package is added
license-plist --output-path CardGame/Settings.bundle

ls CardGame/Settings.bundle/Root.plist && echo "Acknowledgements bundle OK" || echo "FAILED — check license-plist output"
```

Add `Settings.bundle` to the Xcode target's **Copy Bundle Resources** build phase. See Section 3.9 for full attribution requirements including in-app CC BY 3.0 attribution.

### 4.4 Asset Pipeline Tooling

```bash
brew install imagemagick
brew install pngquant
brew install python@3.11
pip3 install Pillow numpy
npm install -g svgexport

# Verify ALL tools before proceeding
convert --version | head -1 && \
pngquant --version | head -1 && \
python3 -c "import PIL, numpy; print('Python libs OK')" && \
svgexport --version && \
echo "ALL PIPELINE TOOLS VERIFIED" || { echo "TOOL VERIFICATION FAILED"; exit 1; }
```

**`Scripts/download_textures.sh`** — downloads all required PBR textures from Poly Haven (CC0). Run once before the smoke test (Section 4.8):

```bash
#!/bin/bash
# Scripts/download_textures.sh
set -e
mkdir -p Staging/textures Resources/Textures

BASE="https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k"

download_texture() {
    local ASSET="$1" FILE="$2" DESC="$3"
    URL="${BASE}/${ASSET}/${FILE}"
    DEST="Staging/textures/${FILE}"
    if [ -s "$DEST" ]; then echo "SKIP (exists): $FILE"; return 0; fi
    echo "Downloading: $FILE"
    curl -fsSL "$URL" -o "$DEST" || {
        echo "WARN: Could not download $FILE — visit https://polyhaven.com/a/${ASSET} to download 1K JPG manually"
        return 1
    }
    [ -s "$DEST" ] || { echo "FAIL: $FILE downloaded but is empty"; return 1; }
    echo "OK: $FILE ($(du -sh "$DEST" | cut -f1))"
    echo "| ${FILE} | polyhaven.com/a/${ASSET} | CC0 | $(date +%Y-%m-%d) | Yes | No | — |" \
         >> Resources/ASSET_LICENSE_MANIFEST.md
}

download_texture "parchment_paper" "parchment_paper_diff_1k.jpg"   "Parchment diffuse"
download_texture "parchment_paper" "parchment_paper_nor_gl_1k.jpg" "Parchment normal map"
download_texture "canvas_1"        "canvas_1_diff_1k.jpg"           "Canvas diffuse"
download_texture "canvas_1"        "canvas_1_nor_gl_1k.jpg"         "Canvas normal map"

cp Staging/textures/parchment_paper_diff_1k.jpg    Staging/textures/parchment_base_raw.jpg
cp Staging/textures/parchment_paper_nor_gl_1k.jpg  Staging/textures/parchment_normal_raw.jpg
cp Staging/textures/canvas_1_diff_1k.jpg           Staging/textures/canvas_base_raw.jpg
cp Staging/textures/canvas_1_nor_gl_1k.jpg         Staging/textures/canvas_normal_raw.jpg

echo "Texture download complete. Next: run Section 4.8 pipeline to resize + add to asset catalog."
```

**`Scripts/cleanup_staging.sh`** — prevents `Staging/` from accumulating gigabytes across generation runs. Add a `clean-staging` target to your Makefile:

```bash
#!/bin/bash
# Scripts/cleanup_staging.sh — run after each generation session
echo "Cleaning Staging/ files older than 24h..."
find Staging/ -type f -mtime +1 -delete
find Staging/ -type d -empty -delete
echo "Staging cleanup complete."
du -sh Staging/ 2>/dev/null || echo "  (empty)"
```

```makefile
clean-staging:
	bash Scripts/cleanup_staging.sh

clean-all: clean-staging
	rm -rf Logs/Builds/
	find Resources/Textures/ -name "*_raw.*" -delete
```

### 4.5 API Key Management

```bash
# Create .env and add to .gitignore first
echo ".env" >> .gitignore
cat > .env << 'EOF'
REPLICATE_API_TOKEN=
FAL_KEY=
LORA_URL=https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors
FREESOUND_API_KEY=
EOF

cat > Scripts/load_env.sh << 'EOF'
#!/bin/bash
set -a; source "$(dirname "$0")/../.env"; set +a
LOADED=$(grep -c '=.' ../.env 2>/dev/null || grep -c '=.' .env)
TOTAL=$(grep -c '=' ../.env 2>/dev/null || grep -c '=' .env)
echo "API keys loaded: $LOADED/$TOTAL"
[ "$LOADED" -lt "$TOTAL" ] && echo "WARNING: Some keys are empty"
EOF
chmod +x Scripts/load_env.sh
```

**Key reference:**

| Key | Required | Used in |
|-----|----------|---------|
| `REPLICATE_API_TOKEN` | ✅ Required | LoRA creature art (§3.2), evolution img2img (§3.4b) |
| `FAL_KEY` | ✅ Required | fal.ai FLUX non-creature art (§3.3), icon generation (§3.8) |
| `LORA_URL` | ✅ Required | R2 LoRA weight file URL — already pre-filled above |
| `FREESOUND_API_KEY` | ⚠ Optional | CC0 sound download (§8.2) — get free at freesound.org/apiv2/apply |

**Verify all keys and environment in one pass:**

```bash
bash Scripts/verify_environment.sh
```

This runs the complete check from Section 4.1 — tools, simulators, Python libs, and live API key validation — in a single script. Use this instead of running individual checks separately.

### 4.6 Asset Catalog Setup

Create the asset catalog structure before adding any assets. This determines how Xcode compiles and optimizes them.

```
Assets.xcassets/
  Textures/
    parchment_base.imageset/     ← 1 image, universal, scale @1x only (tileable, not per-screen)
    parchment_normal.imageset/
    brush_normal.imageset/
    foil_gradient.imageset/
    wax_seal_normal.imageset/
    canvas_base.imageset/
  Artwork/                       ← One folder per card
    dragon_warrior/
      dragon_warrior.imageset/   ← @1x, @2x, @3x or single 1024px (let Xcode scale)
  Icons/
    [mana symbols, ability icons]
  Colors/                        ← Named colors from palette Section 1.2
    parchment-light.colorset/
    ink-black.colorset/
    [etc for every palette token]
```

**Set ASTC compression for all textures — edit Contents.json directly (do not use Xcode GUI):**

The Xcode Attributes Inspector cannot be used by the agent. Instead, set compression by writing the correct `Contents.json` for each imageset. The agent must create or update every texture imageset's `Contents.json` to include the compression property:

```json
{
  "images": [
    {
      "filename": "parchment_base.jpg",
      "idiom": "universal",
      "scale": "1x"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  },
  "properties": {
    "compression-type": "automatic"
  }
}
```

`"compression-type": "automatic"` enables ASTC 4x4 on A8+ devices, reducing VRAM by ~6x. Apply this to every `.imageset` in `Assets.xcassets/Textures/`.

Script to apply to all texture imagesets at once:

```python
#!/usr/bin/env python3
# Scripts/set_astc_compression.py
import json, os, glob

texture_path = "Assets.xcassets/Textures"
updated = 0

for contents_file in glob.glob(f"{texture_path}/**/*.imageset/Contents.json", recursive=True):
    with open(contents_file) as f:
        data = json.load(f)

    props = data.setdefault("properties", {})
    if props.get("compression-type") != "automatic":
        props["compression-type"] = "automatic"
        with open(contents_file, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Updated: {contents_file}")
        updated += 1
    else:
        print(f"Already set: {contents_file}")

print(f"\nUpdated {updated} imageset(s)")
```

Run this after adding any new texture to the asset catalog:
```bash
python3 Scripts/set_astc_compression.py
```

**For the named colors:** Create each color in the asset catalog rather than hardcoding hex values in Swift. Use `Color("parchment-light")` in SwiftUI. This enables automatic dark mode switching when you provide both light and dark variants in the colorset.

### 4.7 Font Setup

The most reliable agent-runnable approach is Homebrew Cask Fonts, which installs directly to `~/Library/Fonts/` with no redirect or authentication issues:

```bash
#!/bin/bash
# Scripts/download_fonts.sh — reliable font acquisition for CI and agent environments
set -e
mkdir -p Resources/Fonts

# Tap homebrew cask fonts (one-time, safe to re-run)
brew tap homebrew/cask-fonts 2>/dev/null || true

# Install all three font families
brew install --cask font-cinzel font-eb-garamond font-oswald 2>/dev/null || {
    echo "brew cask install failed — fonts may already be installed, checking..."
}

# Copy the specific weights needed into project Resources/Fonts/
SYSTEM_FONTS="$HOME/Library/Fonts"
declare -A NEEDED=(
    ["Cinzel-Regular.ttf"]="Cinzel-Regular.ttf"
    ["Cinzel-Bold.ttf"]="Cinzel-Bold.ttf"
    ["EBGaramond-Regular.ttf"]="EBGaramond12-Regular.ttf"
    ["EBGaramond-Italic.ttf"]="EBGaramond12-Italic.ttf"
    ["EBGaramond-SemiBold.ttf"]="EBGaramond12-MediumItalic.ttf"  # closest available weight
    ["Oswald-Bold.ttf"]="Oswald-Bold.ttf"
)

MISSING=0
for TARGET in "${!NEEDED[@]}"; do
    SOURCE="${NEEDED[$TARGET]}"
    if [ -f "$SYSTEM_FONTS/$SOURCE" ]; then
        cp "$SYSTEM_FONTS/$SOURCE" "Resources/Fonts/$TARGET"
        echo "OK: $TARGET"
    elif [ -f "Resources/Fonts/$TARGET" ]; then
        echo "SKIP (exists): $TARGET"
    else
        echo "NOT FOUND: $TARGET (source: $SYSTEM_FONTS/$SOURCE)"
        echo "  → Download manually from fonts.google.com and place in Resources/Fonts/$TARGET"
        MISSING=$((MISSING + 1))
    fi
done

[ "$MISSING" -gt 0 ] && {
    echo ""
    echo "FONT SETUP INCOMPLETE: $MISSING font(s) missing."
    echo "Manual download instructions:"
    echo "  1. Go to fonts.google.com and search for each missing font"
    echo "  2. Click 'Download family', unzip, copy the required .ttf file to Resources/Fonts/"
    echo "  3. Required weights: Cinzel (Regular, Bold), EB Garamond (Regular, Italic, SemiBold), Oswald (Bold)"
    exit 1
} || echo "All 6 font files present in Resources/Fonts/"
```

Run once before the smoke test:
```bash
bash Scripts/download_fonts.sh
```

**If brew cask fonts unavailable** (CI environment without GUI): Download directly from the Google Fonts GitHub mirrors, which serve raw TTF files without JS redirects:

```bash
# Direct TTF download from Google Fonts GitHub — no auth, no redirects
mkdir -p Resources/Fonts
BASE="https://github.com/google/fonts/raw/main/ofl"
curl -fsSL "${BASE}/cinzel/Cinzel%5BWght%5D.ttf"           -o Resources/Fonts/Cinzel-Regular.ttf
curl -fsSL "${BASE}/cinzel/Cinzel%5BWght%5D.ttf"           -o Resources/Fonts/Cinzel-Bold.ttf
curl -fsSL "${BASE}/ebgaramond/EBGaramond%5Bwght%5D.ttf"   -o Resources/Fonts/EBGaramond-Regular.ttf
curl -fsSL "${BASE}/ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf" -o Resources/Fonts/EBGaramond-Italic.ttf
curl -fsSL "${BASE}/ebgaramond/EBGaramond%5Bwght%5D.ttf"   -o Resources/Fonts/EBGaramond-SemiBold.ttf
curl -fsSL "${BASE}/oswald/Oswald%5Bwght%5D.ttf"           -o Resources/Fonts/Oswald-Bold.ttf
```

> **Note:** The Google Fonts GitHub mirrors serve variable-weight (.ttf) fonts. These are valid TTF files but do not have weight-specific PostScript names. If `UIFont(name: "Cinzel-Bold", size: 14)` returns nil with variable fonts, register the variable font filename in Info.plist instead (`Cinzel[wght].ttf`) and use `UIFont(name: "Cinzel", size: 14)` with font descriptors to set weight. The `Scripts/verify_fonts.swift` check below will catch this.

**Add all fonts to Info.plist** (see Section 1.5 for the complete list — do not skip this step).

**Verify font loading before the smoke test:**
```swift
// Run this in a test or playground to confirm fonts loaded
let fonts = ["Cinzel-Regular", "Cinzel-Bold", "EBGaramond-Regular",
             "EBGaramond-Italic", "EBGaramond-SemiBold", "Oswald-Bold"]
for name in fonts {
    if UIFont(name: name, size: 14) == nil {
        print("FONT NOT FOUND: \(name) — check Info.plist UIAppFonts")
    } else {
        print("Font OK: \(name)")
    }
}
```

This font verification must print "Font OK" for all six fonts before proceeding.

### 4.8 Pre-Smoke-Test Asset Preparation

Before running the smoke test, the following assets must exist in the asset catalog (the smoke test will fail without them):

```bash
# 1. Download all required textures from Poly Haven via script
bash Scripts/download_textures.sh

# 2. Resize parchment base to power-of-two for Metal
convert Staging/textures/parchment_base_raw.jpg \
  -resize 2048x2048! Staging/parchment_base_staged.png
python3 -c "
from PIL import Image
img = Image.open('Staging/parchment_base_staged.png')
assert img.size == (2048, 2048)
print('Parchment texture OK:', img.size)
"
# Then add to Assets.xcassets/Textures/parchment_base.imageset/ and run:
python3 Scripts/set_astc_compression.py

# 3. Generate foil gradient
python3 Scripts/generate_foil_gradient.py

# 4. Generate wax seal normal
python3 Scripts/generate_wax_normal.py

# 5. Generate brush normal map
bash Scripts/download_textures.sh   # already downloads canvas/parchment normals
# Brush normal generated from downloaded oil paint source:
bash Scripts/generate_normal_map.sh Staging/brush_source_raw.jpg brush_normal.jpg

# Verify all textures exist in asset catalog
for f in parchment_base foil_gradient wax_seal_normal brush_normal; do
  ls Assets.xcassets/Textures/${f}.imageset/ 2>/dev/null || \
    { echo "MISSING TEXTURE: $f"; exit 1; }
done
echo "All textures present in asset catalog"
```

### 4.9 Smoke Test

**Run this verification checklist before attempting `xcodebuild`** — catches all known compile errors before they surface:

```bash
# Confirm CardShaderUniforms is defined
grep -r "struct CardShaderUniforms" Sources/ || echo "MISSING: CardShaderUniforms"

# Confirm CardRenderer protocol exists
grep -r "protocol CardRenderer" Sources/ || echo "MISSING: CardRenderer"

# Confirm EffectTier has Comparable conformance
grep -r "EffectTier.*Comparable\|Comparable.*EffectTier" Sources/ || echo "MISSING: EffectTier Comparable"

# Confirm sealIconName is in Models (not scattered in views)
grep -r "sealIconName" Sources/Models/ || echo "MISSING: sealIconName in Sources/Models/"

# Confirm cost is not treated as a collection in VoiceOver
grep -rn "cost\.isEmpty\|cost\.map" Sources/ && echo "BUG: cost treated as collection — fix voiceOverLabel"

# Confirm glowColor uses rarity not card type
grep -n "type\.waxColor" Sources/ && echo "BUG: type.waxColor still present — must be rarity.glowSIMD"

# Confirm scripts exist
for S in verify_asset.py download_textures.sh generate_foil_shimmer_ahap.py cleanup_staging.sh; do
    [ -f "Scripts/$S" ] || echo "MISSING SCRIPT: Scripts/$S"
done

# Confirm AHAP files exist
for H in card_flip card_summon card_graveyard foil_shimmer epic_reveal legendary_reveal; do
    [ -f "Resources/Haptics/${H}.ahap" ] || echo "MISSING AHAP: ${H}.ahap"
done

# Confirm no duplicate CardFaction definitions
count=$(grep -rc "enum CardFaction" Sources/ | awk -F: '$2>0' | wc -l)
[ "$count" -gt 1 ] && echo "BUG: CardFaction defined $count times — delete duplicates"

# Confirm Rarity extensions are NOT in WaxSealView (should be in Card.swift)
grep -c "extension Rarity" Sources/Effects/WaxSealView.swift 2>/dev/null | \
    grep -v "^0$" && echo "WARN: Rarity extension in WaxSealView — move to Sources/Models/Card.swift"

echo "Pre-build verification complete."
```

All checks must pass before proceeding.

Create `Sources/Views/SmokeTestCardView.swift`. This test confirms fonts, textures, colors, and basic layout all work together before adding any effects.

```swift
import SwiftUI

struct SmokeTestCardView: View {
    var body: some View {
        ZStack(alignment: .topLeading) {
            // Parchment base
            RoundedRectangle(cornerRadius: 12)
                .fill(Color("parchment-light"))
                .overlay(
                    Image("parchment_base")
                        .resizable(resizingMode: .tile)
                        .opacity(0.25)
                        .blendMode(.multiply)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                )

            // Outer frame border
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color("parchment-mid"), lineWidth: 3)

            VStack(alignment: .leading, spacing: 0) {
                // Name bar
                HStack {
                    Text("Dragon Warrior")
                        .font(.custom("Cinzel-Bold", size: 13))
                        .foregroundColor(Color("ink-black"))
                    Spacer()
                    // N ⊕ cost display: numeral + single chaos mote icon
                    HStack(spacing: 4) {
                        Text("3")
                            .font(.custom("Oswald-Bold", size: 13))
                            .foregroundColor(Color("ink-black"))
                        Image("chaos_mote_symbol")
                            .resizable()
                            .frame(width: 20, height: 20)
                    }
                }
                .frame(height: 25)
                .padding(.horizontal, 6)

                // Art box placeholder
                Rectangle()
                    .fill(Color("canvas-warm"))
                    .frame(height: 132)
                    .overlay(
                        Text("ART BOX")
                            .font(.custom("Cinzel-Regular", size: 12))
                            .foregroundColor(Color("parchment-mid"))
                    )

                // Type line
                HStack {
                    Text("Creature — Dragon")
                        .font(.custom("Cinzel-Regular", size: 10))
                        .foregroundColor(Color("ink-black"))
                    Spacer()
                }
                .frame(height: 18)
                .padding(.horizontal, 6)

                // Text box
                VStack(alignment: .leading, spacing: 4) {
                    Text("Flying. When Dragon Warrior enters, deal 3 damage.")
                        .font(.custom("EBGaramond-Regular", size: 11))
                        .foregroundColor(Color("ink-black"))
                    Divider().background(Color("parchment-mid"))
                    Text("\"Born of flame and fury.\"")
                        .font(.custom("EBGaramond-Italic", size: 10))
                        .foregroundColor(Color("parchment-dark"))
                }
                .padding(8)
                .frame(height: 88, alignment: .top)

                // Stats bar
                HStack {
                    Text("001/120 • TST")
                        .font(.custom("Cinzel-Regular", size: 7))
                        .foregroundColor(Color("parchment-mid"))
                    Spacer()
                    Text("4 / 3")
                        .font(.custom("Oswald-Bold", size: 13))
                        .foregroundColor(Color("ink-black"))
                }
                .frame(height: 15)
                .padding(.horizontal, 6)

                // Rarity bar
                Rectangle()
                    .fill(Color("aged-gold"))
                    .frame(height: 4)
            }
        }
        .frame(width: 210, height: 294)
        .shadow(color: .black.opacity(0.4), radius: 8, x: 2, y: 4)
    }
}

#Preview {
    SmokeTestCardView()
        .padding()
        .background(Color.gray)
}
```

**Run smoke test on all four simulators and take screenshots before proceeding:**

```bash
chmod +x Scripts/screenshot_all_devices.sh

# Build first
xcodebuild -scheme CardGame \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  build 2>&1 | tee Logs/Builds/smoke_test_build.log

if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "SMOKE TEST BUILD FAILED"
  cat Logs/Builds/smoke_test_build.log | grep error:
  exit 1
fi

bash Scripts/screenshot_all_devices.sh smoke_test
echo "Smoke test screenshots saved — review before proceeding"
```

**The smoke test passes when:** parchment texture is visible (not a plain flat color), all six fonts render correctly (check name bar, type line, ability text, flavor text, collector number, ATK/HP), the instability badge renders in the stats bar, the rarity color bar appears at the bottom, and all four device screenshots show correct proportional layout. Verify stabilizer and ruin layout variants render without stats bar. Do not proceed if any of these fail.

---

## Section 5: Agent Tool-Use Techniques

### 5.1 Vision Tool Use for Reference Comparison

For every major visual component:
1. Render output to PNG via simulator screenshot
2. Load alongside the relevant reference from Section 1.10
3. Compare across: material believability, color temperature, texture grain, typography letterpress quality, lighting consistency, and tactile impression
4. Write structured critique to iteration log **before** deciding on any fix

Text-based self-critique alone is not acceptable. Vision comparison must be the primary evaluation step every time.

### 5.2 Bash Tool Discipline

```bash
# Always check exit codes explicitly
command_that_might_fail 2>&1 | tee output.log
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "COMMAND FAILED: see output.log"
  exit 1
fi

# After every Metal shader file change, check for compile warnings
xcodebuild -scheme CardGame build 2>&1 | grep -E "warning:|error:" | grep -i "metal\|shader" | head -20
```

### 5.3 Multi-Device Screenshot Script

```bash
#!/bin/bash
# Scripts/screenshot_all_devices.sh
ITER=${1:-"unknown"}
DEVICES=(
  "iPhone 15 Pro:iPhone15Pro"
  "iPhone 12:iPhone12"
  "iPad Pro (12.9-inch) (6th generation):iPadPro"
  "iPad Air (5th generation):iPadAir"
)

for ENTRY in "${DEVICES[@]}"; do
  DEVICE="${ENTRY%%:*}"
  SAFE="${ENTRY##*:}"
  xcrun simctl boot "$DEVICE" 2>/dev/null || true
  sleep 3
  OUTFILE="Logs/Iterations/iter_${ITER}_${SAFE}.png"
  xcrun simctl screenshot "$DEVICE" "$OUTFILE"
  if [ ! -s "$OUTFILE" ]; then
    echo "SCREENSHOT FAILED: $DEVICE"
    exit 1
  fi
  SIZE=$(python3 -c "from PIL import Image; img=Image.open('$OUTFILE'); print(f'{img.size}')")
  echo "OK: iter_${ITER}_${SAFE}.png $SIZE"
done
```

### 5.4 Refinement Loop Procedure

Execute in exact order — no steps may be skipped or reordered:

```
REFINEMENT_LOOP (iteration N):
1.  xcodebuild all four targets → confirm ALL succeed
2.  Scripts/screenshot_all_devices.sh N → confirm all four screenshots created and nonzero
3.  Vision compare: iPhone 15 Pro screenshot vs reference (use vision tool)
4.  Vision compare: iPad Pro screenshot vs reference (check layout differences specifically)
5.  Write structured critique to Logs/iteration_log.md (use template from Section 12.3)
6.  Run Scripts/compare_screenshots.py on all four screenshots → log diff scores
7.  Identify ONE primary gap — the single largest visual discrepancy across ALL device targets
8.  Make ONE targeted fix
9.  Increment N, return to step 1
```

### 5.5 SwiftUI ↔ MTKView Bridge Pattern

The guide requires Metal shader views embedded in SwiftUI. Always use this pattern:

**First, create `Sources/Effects/CardRenderer.swift`:**

```swift
// Sources/Effects/CardRenderer.swift
import MetalKit

/// Minimum interface any Metal rendering implementation must satisfy.
/// The coordinator holds CardRenderer? so the view compiles even when
/// Metal is unavailable (renderer stays NullCardRenderer, coordinator no-ops safely).
protocol CardRenderer: AnyObject {
    func resize(to size: CGSize)
    func render(to view: MTKView, uniforms: CardShaderUniforms)
}

/// Safe no-op placeholder used until the full Metal pipeline is initialized.
final class NullCardRenderer: CardRenderer {
    func resize(to size: CGSize) {}
    func render(to view: MTKView, uniforms: CardShaderUniforms) {}
}
```

**Then implement the bridge:**

```swift
import SwiftUI
import MetalKit

struct MetalCardEffectView: UIViewRepresentable {
    var card: Card
    var effectTier: EffectTier

    func makeUIView(context: Context) -> MTKView {
        guard let device = MTLCreateSystemDefaultDevice() else {
            return MTKView()
        }
        let mtkView = MTKView(frame: .zero, device: device)
        mtkView.delegate = context.coordinator
        mtkView.framebufferOnly = false
        mtkView.clearColor = MTLClearColorMake(0, 0, 0, 0)
        mtkView.colorPixelFormat = .bgra8Unorm_srgb
        mtkView.isPaused = false
        mtkView.enableSetNeedsDisplay = false
        return mtkView
    }

    func updateUIView(_ uiView: MTKView, context: Context) {
        context.coordinator.card = card
        context.coordinator.uniforms = card.shaderUniforms
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(card: card)
    }

    class Coordinator: NSObject, MTKViewDelegate {
        var card: Card
        var uniforms: CardShaderUniforms
        private var renderer: CardRenderer

        init(card: Card) {
            self.card = card
            self.uniforms = card.shaderUniforms
            self.renderer = NullCardRenderer()   // safe default until OilPaintCardRenderer is built
            super.init()
        }

        func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
            renderer.resize(to: size)
        }

        func draw(in view: MTKView) {
            renderer.render(to: view, uniforms: uniforms)
        }
    }
}
```

**Important:** `framebufferOnly = false` is required if you need to read back pixel data (e.g., for visual regression screenshots). Set to `true` if not needed for better performance. `OilPaintCardRenderer` (loads shaders, manages command queues) is built during the effects phase — until then `NullCardRenderer` keeps the build clean.

### 5.6 Context Management

End of every loop: write to `Logs/iteration_log.md` — iteration number, completed components, known issues ranked by priority, next single action. Start of every session: re-read before any other action. Approaching context limit: write `Logs/RECOVERY_CHECKPOINT_[timestamp].md` immediately with: what is built, what works, what is broken, all relevant file paths, exact next step.

### 5.7 Silent Failure Prevention

```bash
# After every file write
[ -s "$FILE" ] || { echo "FILE EMPTY OR MISSING: $FILE"; exit 1; }

# After every API generation call
python3 Scripts/verify_asset.py "$GENERATED_FILE" \
  --min-width 512 --min-height 512 \
  --no-error-payload \
  --warm-tone-check   # verify the image isn't blue-dominant before color grading

# After every Swift build following a change
xcodebuild ... 2>&1 | grep "error:" | head -5
```

**`Scripts/verify_asset.py`** — must exist before any generation call. Create it now:

```python
#!/usr/bin/env python3
"""
Scripts/verify_asset.py
Hard gate after every AI generation call. Exit 0 = pass. Exit 1 = fail.

Usage:
    python3 Scripts/verify_asset.py path/to/file.png \
        [--min-width 512] [--min-height 512] \
        [--no-error-payload] [--warm-tone-check]
"""
import argparse, sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("filepath")
    parser.add_argument("--min-width",        type=int, default=512)
    parser.add_argument("--min-height",       type=int, default=512)
    parser.add_argument("--no-error-payload", action="store_true",
                        help="Fail if file looks like a JSON error response")
    parser.add_argument("--warm-tone-check",  action="store_true",
                        help="Fail if image is blue-dominant (suggests cool/digital output)")
    args = parser.parse_args()

    path = Path(args.filepath)
    errors = []

    if not path.exists():
        print(f"VERIFY FAIL: file not found — {path}"); sys.exit(1)
    if path.stat().st_size == 0:
        print(f"VERIFY FAIL: file is empty — {path}"); sys.exit(1)

    if args.no_error_payload:
        with open(path, "rb") as f:
            if f.read(16).strip().startswith(b"{"):
                print(f"VERIFY FAIL: file looks like a JSON error payload — {path}"); sys.exit(1)

    try:
        from PIL import Image
        img = Image.open(path)
        w, h = img.size
        if w < args.min_width:  errors.append(f"width {w} < required {args.min_width}")
        if h < args.min_height: errors.append(f"height {h} < required {args.min_height}")

        if args.warm_tone_check:
            import statistics
            pixels = list(img.convert("RGB").getdata())
            sample = pixels[::max(1, len(pixels)//1000)]
            avg_r = statistics.mean(p[0] for p in sample)
            avg_b = statistics.mean(p[2] for p in sample)
            if avg_b > avg_r + 15:
                errors.append(f"warm-tone FAIL: blue-dominant (R={avg_r:.0f}, B={avg_b:.0f}) — wrong color grade")
    except ImportError:
        print("VERIFY WARNING: Pillow not installed — pip3 install Pillow --break-system-packages")
    except Exception as e:
        errors.append(f"cannot open as image: {e}")

    if errors:
        for e in errors: print(f"VERIFY FAIL [{path.name}]: {e}")
        sys.exit(1)
    else:
        print(f"VERIFY OK: {path.name} ({w}×{h}px)")
        sys.exit(0)

if __name__ == "__main__":
    main()
```

---

## Section 6: Digital Effects & Animations

All effects use Metal, Core Animation, and SpriteKit. No browser APIs.

### 6.1 Metal Shader: Oil Paint Artwork

```metal
// Sources/Shaders/OilPaintShader.metal
#include <metal_stdlib>
using namespace metal;

struct VertexOut {
    float4 position [[position]];
    float2 texCoord;
};

struct OilPaintUniforms {
    float brushRoughness;
    float varnishGloss;
    float parchmentAge;
    float2 lightDirection;  // normalized
};

fragment float4 oilPaintFragment(VertexOut in [[stage_in]],
                                  texture2d<float> artwork [[texture(0)]],
                                  texture2d<float> brushNormal [[texture(1)]],
                                  constant OilPaintUniforms &u [[buffer(0)]]) {
    constexpr sampler s(filter::linear, address::repeat);

    float4 color = artwork.sample(s, in.texCoord);
    // Tile brush normal at 4x to simulate brush stroke scale
    float3 normal = brushNormal.sample(s, in.texCoord * 4.0).rgb * 2.0 - 1.0;
    normal.xy *= u.brushRoughness;  // rougher card = more pronounced brushwork
    normal = normalize(normal);

    // Warm up shadows — classical oil paint has warm ambient in darks
    float lum = dot(color.rgb, float3(0.299, 0.587, 0.114));
    float3 warmReflect = float3(0.15, 0.08, 0.02);
    color.rgb = mix(mix(warmReflect, color.rgb, smoothstep(0.0, 0.5, lum)), color.rgb, 0.6);

    // Parchment age desaturation: ancient cards slightly desaturate toward sepia
    if (u.parchmentAge > 0) {
        float gray = dot(color.rgb, float3(0.299, 0.587, 0.114));
        float3 sepia = float3(gray * 1.1, gray * 0.9, gray * 0.7);
        color.rgb = mix(color.rgb, sepia, u.parchmentAge * 0.4);
    }

    // Oil varnish specular — broad, warm, physically plausible
    float3 light = normalize(float3(u.lightDirection, 0.8));
    float spec = pow(max(dot(normal, light), 0.0), 24.0) * u.varnishGloss;
    color.rgb += float3(1.0, 0.95, 0.80) * spec * 0.25;

    return float4(clamp(color.rgb, 0.0, 1.0), color.a);
}
```

**Shader precompilation — add via build script, not Xcode GUI:**

The agent cannot use Xcode's Build Phases GUI. Instead, add shader precompilation as a pre-build script that runs before xcodebuild. Add the following to `Scripts/compile_shaders.sh` and call it at the start of every build:

```bash
#!/bin/bash
# Scripts/compile_shaders.sh
# Precompile Metal shaders to catch errors before Xcode build
set -e

SHADERS_DIR="Sources/Shaders"
OUTPUT_DIR="Logs/Shaders"
mkdir -p "$OUTPUT_DIR"

echo "Compiling Metal shaders..."
for SHADER in "$SHADERS_DIR"/*.metal; do
    NAME=$(basename "$SHADER" .metal)
    xcrun metal \
        -sdk iphonesimulator \
        -target air64-apple-ios16.0-simulator \
        "$SHADER" \
        -o "$OUTPUT_DIR/${NAME}.air" 2>&1 | tee -a "$OUTPUT_DIR/compile_log.txt"

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo "SHADER COMPILE FAILED: $SHADER"
        echo "See $OUTPUT_DIR/compile_log.txt"
        exit 1
    fi
    echo "OK: $NAME"
done

echo "All shaders compiled successfully"
```

Call this before every xcodebuild invocation:
```bash
bash Scripts/compile_shaders.sh && xcodebuild -scheme CardGame ...
```

This catches shader errors in fast, readable output before the full Xcode build runs. Shader errors in a full xcodebuild are buried in thousands of lines of output — this surfaces them immediately.

### 6.2 Metal Shader: Parchment Surface

```metal
// Sources/Shaders/ParchmentShader.metal
struct ParchmentUniforms {
    float2 cardSize;      // in points
    float ageAmount;      // 0.0 (mint) to 1.0 (ancient)
    float colorScheme;    // 0.0 = light, 1.0 = dark
};

fragment float4 parchmentFragment(VertexOut in [[stage_in]],
                                   texture2d<float> parchmentTex [[texture(0)]],
                                   texture2d<float> fiberNormal [[texture(1)]],
                                   constant ParchmentUniforms &u [[buffer(0)]]) {
    constexpr sampler s(filter::linear, address::repeat);

    // Tile texture at physical paper scale (~256pt per tile)
    float2 tiledUV = in.texCoord * (u.cardSize / 256.0);
    float4 parchment = parchmentTex.sample(s, tiledUV);
    float3 normal = fiberNormal.sample(s, tiledUV).rgb * 2.0 - 1.0;

    // Edge vignette — worn handling darkens edges
    float2 centered = in.texCoord * 2.0 - 1.0;
    float edgeDist = max(abs(centered.x), abs(centered.y));
    float baseVignette = 1.0 - smoothstep(0.65, 1.0, edgeDist) * 0.45;

    // Age darkens further (ancient cards are more deeply shadowed at edges)
    float ageVignette = 1.0 - smoothstep(0.5, 1.0, edgeDist) * u.ageAmount * 0.3;

    // Warm tint
    float3 warm = parchment.rgb * float3(1.02, 0.99, 0.87);

    // Dark mode: invert warm relationship
    if (u.colorScheme > 0.5) {
        warm = parchment.rgb * float3(0.25, 0.18, 0.10);
        warm = mix(warm, float3(0.15, 0.10, 0.05), 1.0 - parchment.r);
    }

    return float4(warm * baseVignette * ageVignette, parchment.a);
}
```

### 6.3 Metal Shader: Warm Foil

```metal
// Sources/Shaders/WarmFoilShader.metal
struct FoilUniforms {
    float tiltX;
    float tiltY;
    float intensity;    // from card.shaderUniforms.foilIntensity
};

fragment float4 warmFoilFragment(VertexOut in [[stage_in]],
                                  texture2d<float> artwork [[texture(0)]],
                                  texture2d<float> iridGradient [[texture(1)]],
                                  constant FoilUniforms &u [[buffer(0)]]) {
    constexpr sampler s(filter::linear, address::repeat);

    float2 foilUV = in.texCoord + float2(u.tiltX, u.tiltY) * 0.3;
    // Organic distortion — prevents mechanical shimmer appearance
    foilUV += float2(
        sin(foilUV.y * 7.3 + u.tiltX * 2.0) * 0.018,
        cos(foilUV.x * 6.8 + u.tiltY * 2.0) * 0.018
    );

    float4 base = artwork.sample(s, in.texCoord);
    float4 irid = iridGradient.sample(s, foilUV);

    // Foil strongest in midtones — not competing with darks or lights
    float lum = dot(base.rgb, float3(0.299, 0.587, 0.114));
    float foilMask = sin(lum * 3.14159) * u.intensity;

    // Warm iridescent blend (additive in midtones only)
    float3 result = base.rgb + irid.rgb * foilMask * 0.45;

    return float4(clamp(result, 0.0, 1.0), base.a);
}
```

**Connect to CMMotionManager:**
```swift
class MotionService: ObservableObject {
    private let manager = CMMotionManager()
    @Published var tiltX: Float = 0
    @Published var tiltY: Float = 0

    func start() {
        guard manager.isDeviceMotionAvailable else { return }
        manager.deviceMotionUpdateInterval = 1.0 / 60.0
        manager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let motion, let self else { return }
            // Clamp tilt range — constrained to cardstock-like flex
            self.tiltX = Float(max(-0.6, min(0.6, motion.attitude.roll)))
            self.tiltY = Float(max(-0.6, min(0.6, motion.attitude.pitch)))
        }
    }

    func stop() { manager.stopDeviceMotionUpdates() }
}
```

### 6.4 Parallax Depth Layers

Segment artwork into layers using Replicate's background removal or a depth estimation model. Keep parallax range conservative — this is thick cardstock, not floating UI:

```swift
struct ParallaxCardArtView: View {
    @ObservedObject var motion: MotionService
    let background: Image
    let foreground: Image

    var body: some View {
        ZStack {
            background
                .resizable().scaledToFill()
                .offset(x: CGFloat(motion.tiltX * -6),
                        y: CGFloat(motion.tiltY * -6))
            foreground
                .resizable().scaledToFill()
                .offset(x: CGFloat(motion.tiltX * 10),
                        y: CGFloat(motion.tiltY * 10))
        }
        .clipped()
    }
}
```

### 6.5 Ink Spread Summon Animation

```metal
// Sources/Shaders/InkSpreadKernel.metal
kernel void inkSpreadReveal(texture2d<float, access::read>  input  [[texture(0)]],
                             texture2d<float, access::write> output [[texture(1)]],
                             constant float  &progress [[buffer(0)]],
                             constant float2 &origin   [[buffer(1)]],
                             uint2 gid [[thread_position_in_grid]]) {
    uint2 sz = uint2(output.get_width(), output.get_height());
    float2 uv = float2(gid) / float2(sz);
    float dist = length(uv - origin);

    // Organic noise at spread edge — simulates ink bleeding into fiber
    float nx = fract(sin(dot(uv, float2(127.1, 311.7))) * 43758.5);
    float ny = fract(sin(dot(uv, float2(269.5, 183.3))) * 73291.1);
    float noise = (nx + ny) * 0.5;

    // Spread: hard wavefront with noisy edge
    float edgeWidth = 0.12 + noise * 0.08;
    float revealed = smoothstep(progress - edgeWidth, progress + 0.02, 1.0 - dist + noise * 0.15);

    float4 pixel = input.read(gid);
    output.write(float4(pixel.rgb, pixel.a * revealed), gid);
}
```

Drive progress over 0.8s with a CADisplayLink or async animation:
```swift
func animateSummon() {
    var progress: Float = 0
    let displayLink = CADisplayLink(target: self, selector: #selector(updateSummon))
    displayLink.add(to: .main, forMode: .common)
    // Store displayLink and increment progress each frame
    // progress += 1.0 / (0.8 * 60.0) per frame (targeting 0→1 over 0.8s)
}
```

### 6.6 Wax Seal Rarity Indicator

`WaxSealView` uses `Rarity.waxColor`, `Rarity.sealIconName`, and `Rarity: Comparable` — all defined in `Sources/Models/Card.swift` (Section 2.2). Do not re-declare them here.

```swift
// Sources/Effects/WaxSealView.swift
struct WaxSealView: View {
    let rarity: Rarity
    @State private var isGlowing = false

    var body: some View {
        ZStack {
            // Outer wax disk
            Circle()
                .fill(
                    RadialGradient(
                        colors: [rarity.waxColor.opacity(0.7), rarity.waxColor],
                        center: .center,
                        startRadius: 0,
                        endRadius: 17
                    )
                )
                .frame(width: 34, height: 34)
                .shadow(color: rarity.waxColor.opacity(0.6),
                        radius: isGlowing ? 8 : 3, x: 0, y: 0)

            // Embossed symbol — asset name from Rarity.sealIconName (downloaded by Scripts/download_icons.sh)
            Image(rarity.sealIconName)
                .resizable()
                .frame(width: 18, height: 18)
                .blendMode(.multiply)
                .opacity(0.55)

            // Specular highlight — directional light from upper-left
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [.white.opacity(0.45), .clear],
                        center: .init(x: 0.35, y: 0.3),
                        startRadius: 0,
                        endRadius: 10
                    )
                )
                .frame(width: 22, height: 16)
                .offset(x: -4, y: -4)
                .blendMode(.overlay)
        }
        .onAppear {
            guard rarity >= .rare else { return }
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) {
                isGlowing = true
            }
        }
    }
}
```

### 6.6b Card Frame — Animated Borders for Epic and Legendary

The border spec in Section 1.4 specifies animated gradients for Epic and Legendary. Create `Sources/Views/CardFrameView.swift`:

```swift
// Sources/Views/CardFrameView.swift
// Rarity.borderWidth and Rarity.borderGradient are defined in Sources/Models/Card.swift (Section 2.2)

struct CardFrameView: View {
    let rarity: Rarity

    var body: some View {
        switch rarity {
        case .epic:
            AnimatedGradientBorder(
                colors: [Color("epic-amethyst"), Color(red: 0.35, green: 0.1, blue: 0.55),
                         Color("epic-amethyst")],
                lineWidth: 4, cornerRadius: 12, animationDuration: 3.0
            )
        case .legendary:
            AnimatedGradientBorder(
                colors: [Color("legendary-ember"), Color("aged-gold"),
                         Color(red: 0.85, green: 0.6, blue: 0.1), Color("legendary-ember")],
                lineWidth: 4, cornerRadius: 12, animationDuration: 2.0
            )
        default:
            StaticBorder(rarity: rarity)
        }
    }
}

struct AnimatedGradientBorder: View {
    let colors: [Color]
    let lineWidth: CGFloat
    let cornerRadius: CGFloat
    let animationDuration: Double
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @State private var rotation: Double = 0

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .strokeBorder(
                AngularGradient(colors: colors, center: .center,
                                startAngle: .degrees(rotation),
                                endAngle: .degrees(rotation + 360)),
                lineWidth: lineWidth
            )
            .onAppear {
                // Reduce Motion: use first color statically, no animation
                guard !reduceMotion else { return }
                withAnimation(.linear(duration: animationDuration).repeatForever(autoreverses: false)) {
                    rotation = 360
                }
            }
    }
}

struct StaticBorder: View {
    let rarity: Rarity
    var body: some View {
        RoundedRectangle(cornerRadius: 12)
            .strokeBorder(rarity.borderGradient, lineWidth: rarity.borderWidth)
    }
}
```

### 6.7 Physical Spring Card Drag

```swift
struct DraggableCardView: View {
    @State private var dragOffset: CGSize = .zero
    @State private var dragRotation: Double = 0
    @State private var isDragging = false

    var body: some View {
        CardView(card: card)
            .offset(dragOffset)
            .rotationEffect(.degrees(dragRotation))
            .scaleEffect(isDragging ? 1.05 : 1.0)
            .shadow(color: .black.opacity(isDragging ? 0.5 : 0.25),
                    radius: isDragging ? 16 : 6,
                    x: isDragging ? 4 : 2,
                    y: isDragging ? 8 : 4)
            .gesture(
                DragGesture(minimumDistance: 8)
                    .onChanged { value in
                        isDragging = true
                        // Resistance curve — harder to move at extremes
                        let resistance: CGFloat = 0.72
                        dragOffset = CGSize(
                            width: value.translation.width * resistance,
                            height: value.translation.height * resistance
                        )
                        dragRotation = value.translation.width * 0.025
                    }
                    .onEnded { _ in
                        withAnimation(.spring(response: 0.38, dampingFraction: 0.62)) {
                            dragOffset = .zero
                            dragRotation = 0
                            isDragging = false
                        }
                    }
            )
    }
}
```

### 6.8 Particle Systems

All particles read as physical materials, not energy. Do **not** use `.sks` files — they are binary Xcode archives that require the GUI to create and cannot be written by a bash command or by the agent. Create all emitters programmatically via `SKEmitterNode`:

| Rarity | Particle | Birth rate | Lifetime | Size | Color |
|--------|---------|-----------|---------|------|-------|
| Common | None | — | — | — | — |
| Uncommon | Fine dust motes | 2/s | 4s | 2–4pt | parchment-light, 30% opacity |
| Rare | Gold leaf flakes (tumbling) | 5/s | 3s | 6–10pt | aged-gold, 70% opacity |
| Epic | Slow amethyst embers | 8/s | 3.5s | 4–8pt | epic-amethyst → transparent |
| Legendary | Ember sparks (rising) | 14/s | 2s | 3–6pt | legendary-ember → transparent |

```swift
// Sources/Effects/CardParticleFactory.swift
import SpriteKit
import UIKit

/// Creates all card particle emitters programmatically.
/// Never use .sks files — they require the Xcode GUI to produce and cannot be
/// written by the agent. All emitter parameters come from the table in Section 6.8.
enum CardParticleFactory {

    /// Returns nil for .common (no particles).
    static func makeEmitter(for rarity: Rarity, in artBoxSize: CGSize) -> SKEmitterNode? {
        switch rarity {
        case .common:
            return nil

        case .uncommon:
            // Fine dust motes — slow drift, barely visible, parchment-light at low opacity
            let e = SKEmitterNode()
            e.particleBirthRate        = 2
            e.particleLifetime         = 4
            e.particleLifetimeRange    = 1.5
            e.particleSpeed            = 8
            e.particleSpeedRange       = 6
            e.emissionAngle            = .pi / 2      // upward drift
            e.emissionAngleRange       = .pi          // full hemisphere
            e.particleAlpha            = 0.30
            e.particleAlphaRange       = 0.10
            e.particleAlphaSpeed       = -0.06        // fades out over lifetime
            e.particleScale            = 0.012         // ~2pt at 167px/pt
            e.particleScaleRange       = 0.008
            e.particleRotationRange    = .pi * 2
            e.particleRotationSpeed    = 0.3
            e.particleColor            = UIColor(named: "parchment-light") ?? .systemGray6
            e.particleBlendMode        = .alpha        // not additive — physical, not digital
            e.particleTexture          = makeCircleTexture(diameter: 4)
            constrainToArtBox(e, size: artBoxSize)
            return e

        case .rare:
            // Gold leaf flakes — slow tumble, rich gold at high opacity
            let e = SKEmitterNode()
            e.particleBirthRate        = 5
            e.particleLifetime         = 3
            e.particleLifetimeRange    = 1.0
            e.particleSpeed            = 12
            e.particleSpeedRange       = 8
            e.emissionAngle            = .pi / 2
            e.emissionAngleRange       = .pi * 0.6    // narrower: leaves fall less sideways
            e.particleAlpha            = 0.70
            e.particleAlphaRange       = 0.15
            e.particleAlphaSpeed       = -0.18
            e.particleScale            = 0.025         // ~6pt
            e.particleScaleRange       = 0.012
            e.particleRotationRange    = .pi * 2
            e.particleRotationSpeed    = 1.8           // tumbling leaf motion
            e.xAcceleration            = 4             // gentle lateral drift
            e.particleColor            = UIColor(named: "aged-gold") ?? .systemYellow
            e.particleBlendMode        = .alpha
            e.particleTexture          = makeLeafTexture()
            constrainToArtBox(e, size: artBoxSize)
            return e

        case .epic:
            // Slow amethyst embers — rising, fading from amethyst to transparent
            let e = SKEmitterNode()
            e.particleBirthRate        = 8
            e.particleLifetime         = 3.5
            e.particleLifetimeRange    = 1.2
            e.particleSpeed            = 20
            e.particleSpeedRange       = 10
            e.emissionAngle            = .pi / 2      // rising
            e.emissionAngleRange       = .pi * 0.4
            e.particleAlpha            = 0.85
            e.particleAlphaRange       = 0.10
            e.particleAlphaSpeed       = -0.22
            e.particleScale            = 0.018         // ~4pt
            e.particleScaleRange       = 0.012
            e.particleRotationRange    = .pi
            e.particleRotationSpeed    = 0.6
            e.yAcceleration            = 15            // upward acceleration (embers rise)
            e.particleColor            = UIColor(named: "epic-amethyst") ?? .purple
            e.particleBlendMode        = .alpha
            e.particleTexture          = makeCircleTexture(diameter: 5)
            constrainToArtBox(e, size: artBoxSize)
            return e

        case .legendary:
            // Ember sparks — faster, more intense, rising strongly
            let e = SKEmitterNode()
            e.particleBirthRate        = 14
            e.particleLifetime         = 2.0
            e.particleLifetimeRange    = 0.8
            e.particleSpeed            = 35
            e.particleSpeedRange       = 18
            e.emissionAngle            = .pi / 2
            e.emissionAngleRange       = .pi * 0.5
            e.particleAlpha            = 0.90
            e.particleAlphaRange       = 0.08
            e.particleAlphaSpeed       = -0.40
            e.particleScale            = 0.015         // ~3–6pt range with scaleRange
            e.particleScaleRange       = 0.010
            e.particleRotationRange    = .pi * 2
            e.particleRotationSpeed    = 2.5
            e.yAcceleration            = 30
            e.particleColor            = UIColor(named: "legendary-ember") ?? .orange
            e.particleBlendMode        = .alpha        // still physical — no additive here
            e.particleTexture          = makeSparkTexture()
            constrainToArtBox(e, size: artBoxSize)
            return e
        }
    }

    // MARK: - Particle texture helpers (tiny programmatic images — no asset files needed)

    private static func makeCircleTexture(diameter: CGFloat) -> SKTexture {
        let size = CGSize(width: diameter, height: diameter)
        return SKTexture(image: UIGraphicsImageRenderer(size: size).image { ctx in
            ctx.cgContext.setFillColor(UIColor.white.cgColor)
            ctx.cgContext.fillEllipse(in: CGRect(origin: .zero, size: size))
        })
    }

    private static func makeLeafTexture() -> SKTexture {
        // Thin elongated oval — reads as flake/leaf at small scale
        let size = CGSize(width: 10, height: 5)
        return SKTexture(image: UIGraphicsImageRenderer(size: size).image { ctx in
            ctx.cgContext.setFillColor(UIColor.white.cgColor)
            ctx.cgContext.fillEllipse(in: CGRect(origin: .zero, size: size))
        })
    }

    private static func makeSparkTexture() -> SKTexture {
        // 4-point star — reads as spark at small scale
        let size = CGSize(width: 8, height: 8)
        return SKTexture(image: UIGraphicsImageRenderer(size: size).image { ctx in
            let c = CGContext.current!
            c.setFillColor(UIColor.white.cgColor)
            let cx = size.width / 2, cy = size.height / 2
            let path = UIBezierPath()
            for i in 0..<4 {
                let angle = CGFloat(i) * .pi / 2
                let outer = CGPoint(x: cx + cos(angle) * 4, y: cy + sin(angle) * 4)
                let inner = CGPoint(x: cx + cos(angle + .pi/4) * 1.5, y: cy + sin(angle + .pi/4) * 1.5)
                i == 0 ? path.move(to: outer) : path.addLine(to: outer)
                path.addLine(to: inner)
            }
            path.close()
            path.fill()
        })
    }

    /// Constrain particle birth position to the art box area (x=4–206, y=29–161 in 210×294pt card).
    /// Convert to SpriteKit coordinates (origin at center of SKScene).
    private static func constrainToArtBox(_ emitter: SKEmitterNode, size artBoxSize: CGSize) {
        // Birth region covers the full art box width and height
        emitter.particlePositionRange = CGVector(
            dx: artBoxSize.width,
            dy: artBoxSize.height * 0.5   // concentrate births in lower half of art box
        )
    }
}
```

**Integrate into card view via SpriteKit overlay:**

```swift
// In CardView or CardEffectLayer — add SpriteKit scene as overlay on art box
struct CardParticleView: UIViewRepresentable {
    let rarity: Rarity
    let artBoxSize: CGSize

    func makeUIView(context: Context) -> SKView {
        let skView = SKView()
        skView.backgroundColor = .clear
        skView.allowsTransparency = true

        let scene = SKScene(size: artBoxSize)
        scene.backgroundColor = .clear
        scene.scaleMode = .resizeFill

        if let emitter = CardParticleFactory.makeEmitter(for: rarity, in: artBoxSize) {
            // Position at bottom center of art box — particles rise from there
            emitter.position = CGPoint(x: artBoxSize.width / 2, y: 8)
            scene.addChild(emitter)
        }

        skView.presentScene(scene)
        return skView
    }

    func updateUIView(_ uiView: SKView, context: Context) {}
}
```

**Common failure modes:**
- Particles that glow with additive blending look digital, not physical — always use `.alpha` blend mode, never `.add`
- Particles that move too fast or too uniformly look like snow, not leaf fragments — ensure `particleSpeedRange` is at least 50% of `particleSpeed`, and set `particleRotationSpeed` > 0
- Particles born outside the card area look uncontrolled — `constrainToArtBox` handles this; verify the `SKView` frame clips to the art box bounds

### 6.9 Graceful Degradation

Create `Sources/Effects/EffectTier.swift` — this must be its own file so `Comparable` is available before `WaxSealView` and `MetalCardEffectView` compile:

```swift
// Sources/Effects/EffectTier.swift

enum EffectTier {
    case full           // Metal + motion + particles + haptics
    case shimmerOnly    // Metal shaders, no motion (device motion unavailable)
    case staticOnly     // Core Animation only, no Metal shaders
    case minimal        // Reduce Motion: crossfades only, no motion
}

// Comparable conformance — needed by effectTier >= .shimmerOnly comparisons in Section 10.3
extension EffectTier: Comparable {
    static func < (lhs: EffectTier, rhs: EffectTier) -> Bool {
        let order: [EffectTier] = [.minimal, .staticOnly, .shimmerOnly, .full]
        return order.firstIndex(of: lhs)! < order.firstIndex(of: rhs)!
    }
}
```

```swift
func resolveEffectTier() -> EffectTier {
    if UIAccessibility.isReduceMotionEnabled { return .minimal }
    let metalOK = MTLCreateSystemDefaultDevice() != nil
    let motionOK = CMMotionManager().isDeviceMotionAvailable
    if metalOK && motionOK { return .full }
    if metalOK { return .shimmerOnly }
    return .staticOnly
}
```

The `staticOnly` tier must still look premium. Test it deliberately by running in the Accessibility simulator with Metal disabled — if the card looks bad, the static layer design needs more work.

---

## Section 7: Haptic Feedback

Haptics are not decorative for this aesthetic — they are the primary mechanism for delivering physical material texture through the screen. Every material interaction must have a haptic analog.

### 7.1 Haptic Vocabulary

| Interaction | Implementation | Physical Analog |
|-------------|--------------|-----------------|
| Card pick up | `UIImpactFeedbackGenerator(.light)` | Lifting cardstock off surface |
| Card set down | `UIImpactFeedbackGenerator(.medium)` | Cardstock landing, slight thud |
| Card flip | Custom AHAP: transient 0.4 intensity at 0.0s, transient 0.8 at 0.35s | Rotation through air + landing |
| Wax seal tap | `UIImpactFeedbackGenerator(.heavy)` | Dense wax resistance |
| Card summon | Custom AHAP: continuous 0→0.8→0.3 over 0.4s | Card materializing, drawing on paper |
| Card to graveyard | Custom AHAP: slow fade-out 0.6→0 over 0.7s | Paper crumpling, settling |
| Rare foil reveal | Custom AHAP: irregular transients at 20–80ms intervals over 1.5s | Foil surface texture |
| Epic reveal | Custom AHAP: deep continuous 0→0.7→0.4 over 0.6s + shimmer 1.2s | Arcane power building |
| Legendary reveal | Custom AHAP: full burst 1.0 intensity 0.1s + shimmer 1.5s | Powerful emergence |
| Invalid action | `UINotificationFeedbackGenerator(.error)` | Resistance, won't budge |
| Scroll text box | `UISelectionFeedbackGenerator` | Paper page turn feel |

### 7.2 Required AHAP Files

Create in `Resources/Haptics/`:
- `card_flip.ahap`
- `card_summon.ahap`
- `card_graveyard.ahap`
- `foil_shimmer.ahap`
- `epic_reveal.ahap`
- `legendary_reveal.ahap`

All six use the CoreHaptics JSON schema. Complete implementations matching the Section 7.1 vocabulary:

**`card_flip.ahap`** — transient 0.4 at 0.0s, transient 0.8 at 0.35s:
```json
{
  "Version": 1,
  "Pattern": [
    { "Event": { "Time": 0.0,  "EventType": "HapticTransient",
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 0.4},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 0.6}] } },
    { "Event": { "Time": 0.35, "EventType": "HapticTransient",
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 0.8},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 0.75}] } }
  ]
}
```

**`card_summon.ahap`** — continuous 0→0.8→0.3 over 0.4s:
```json
{
  "Version": 1,
  "Pattern": [
    { "Event": { "Time": 0.0, "EventType": "HapticContinuous", "EventDuration": 0.4,
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 0.1},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 0.4}] } },
    { "ParameterCurve": { "ParameterID": "HapticIntensityControl", "Time": 0.0,
        "ParameterCurveControlPoints": [
          {"Time": 0.0, "ParameterValue": 0.0},
          {"Time": 0.2, "ParameterValue": 0.8},
          {"Time": 0.4, "ParameterValue": 0.3}] } }
  ]
}
```

**`card_graveyard.ahap`** — slow fade-out 0.6→0 over 0.7s:
```json
{
  "Version": 1,
  "Pattern": [
    { "Event": { "Time": 0.0, "EventType": "HapticContinuous", "EventDuration": 0.7,
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 0.6},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 0.3}] } },
    { "ParameterCurve": { "ParameterID": "HapticIntensityControl", "Time": 0.0,
        "ParameterCurveControlPoints": [
          {"Time": 0.0, "ParameterValue": 0.6},
          {"Time": 0.7, "ParameterValue": 0.0}] } }
  ]
}
```

**`foil_shimmer.ahap`** — irregular transients over 1.5s. Generate programmatically via `Scripts/generate_foil_shimmer_ahap.py`:
```python
#!/usr/bin/env python3
import json, random
random.seed(42)  # reproducible
events = []
t = 0.0
while t < 1.5:
    events.append({"Event": {"Time": round(t, 3), "EventType": "HapticTransient",
        "EventParameters": [
            {"ParameterID": "HapticIntensity", "ParameterValue": round(random.uniform(0.15, 0.45), 2)},
            {"ParameterID": "HapticSharpness", "ParameterValue": round(random.uniform(0.5, 0.9), 2)}
        ]}})
    t += random.uniform(0.020, 0.080)
with open("Resources/Haptics/foil_shimmer.ahap", "w") as f:
    json.dump({"Version": 1, "Pattern": events}, f, indent=2)
print(f"Generated foil_shimmer.ahap with {len(events)} events")
```

**`epic_reveal.ahap`** — deep continuous 0→0.7→0.4 over 0.6s + shimmer 1.2s:
```json
{
  "Version": 1,
  "Pattern": [
    { "Event": { "Time": 0.0, "EventType": "HapticContinuous", "EventDuration": 0.6,
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 0.1},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 0.2}] } },
    { "ParameterCurve": { "ParameterID": "HapticIntensityControl", "Time": 0.0,
        "ParameterCurveControlPoints": [
          {"Time": 0.0, "ParameterValue": 0.0}, {"Time": 0.3, "ParameterValue": 0.7},
          {"Time": 0.6, "ParameterValue": 0.4}] } },
    { "Event": { "Time": 0.65, "EventType": "HapticContinuous", "EventDuration": 1.2,
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 0.2},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 0.8}] } }
  ]
}
```

**`legendary_reveal.ahap`** — burst 1.0 at 0.0s + shimmer 1.5s:
```json
{
  "Version": 1,
  "Pattern": [
    { "Event": { "Time": 0.0,  "EventType": "HapticTransient",
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 1.0},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 1.0}] } },
    { "Event": { "Time": 0.1,  "EventType": "HapticTransient",
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 0.85},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 0.9}] } },
    { "Event": { "Time": 0.25, "EventType": "HapticContinuous", "EventDuration": 1.5,
        "EventParameters": [{"ParameterID": "HapticIntensity", "ParameterValue": 0.25},
                            {"ParameterID": "HapticSharpness", "ParameterValue": 0.85}] } }
  ]
}
```

```swift
// Sources/Haptics/HapticEngine.swift
import CoreHaptics
import UIKit

final class HapticEngine {
    static let shared = HapticEngine()
    private var engine: CHHapticEngine?
    private let supportsHaptics = CHHapticEngine.capabilitiesForHardware().supportsHaptics

    func prepare() {
        guard supportsHaptics else { return }
        do {
            engine = try CHHapticEngine()
            engine?.stoppedHandler = { [weak self] _ in try? self?.engine?.start() }
            engine?.resetHandler = { [weak self] in try? self?.engine?.start() }
            try engine?.start()
        } catch {
            print("HapticEngine: init failed — \(error)")
        }
    }

    func play(ahapNamed name: String) {
        guard supportsHaptics, let engine,
              let url = Bundle.main.url(forResource: name, withExtension: "ahap") else { return }
        do { try engine.playPattern(from: url) }
        catch { print("HapticEngine: playback failed for \(name) — \(error)") }
    }

    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        guard supportsHaptics else { return }
        let gen = UIImpactFeedbackGenerator(style: style)
        gen.prepare()
        gen.impactOccurred()
    }
}
```

### 7.3 Physical Device Testing Gate

Haptics cannot be tested on simulator. **Log every haptic interaction** in `Logs/iteration_log.md` as "⚠️ PENDING PHYSICAL DEVICE VERIFICATION." Do not mark any haptic work as complete without physical device confirmation. This is a hard gate — the exit criteria explicitly requires this logging.

---

## Section 8: Sound Design

Sound reinforces the physical material aesthetic. Every interaction has a corresponding material sound.

### 8.1 Sound Vocabulary

| Interaction | Sound | Duration |
|-------------|-------|---------|
| Card pick up | Soft cardstock flex, paper rustle | ~120ms |
| Card set down | Crisp cardstock landing on wood | ~80ms |
| Card flip | Paper whoosh (80ms) + landing thud (50ms) | ~350ms total |
| Wax seal tap | Low dampened thud | ~100ms |
| Card summon | Ink brush stroke building to resonant thrum | ~600ms |
| Card to graveyard | Slow paper crumple | ~700ms |
| Rare foil reveal | Delicate shimmer + subtle ring | ~400ms |
| Epic reveal | Deep resonant tone + slow crystalline shimmer | ~700ms |
| Legendary reveal | Orchestral brush stroke + full foil shimmer | ~1000ms |
| Card drag | Continuous subtle paper-on-surface friction | Looped |
| Ambient (battlefield) | Very low room tone | Looped |

### 8.2 Asset Sources

- **Freesound.org** — CC0 sounds available via API. Requires a free Freesound API key (`FREESOUND_API_KEY` in `.env`). Do not browse manually — use the API:

```bash
# Scripts/download_sounds.sh
# Downloads required CC0 sounds from Freesound API
source Scripts/load_env.sh

download_sound() {
    local QUERY="$1" OUTPUT="$2"
    # Search for CC0 sounds matching query
    RESULT=$(curl -s "https://freesound.org/apiv2/search/text/?query=${QUERY}&license=Creative+Commons+0&fields=id,name,previews&page_size=1" \
             -H "Authorization: Token $FREESOUND_API_KEY")
    SOUND_ID=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['results'][0]['id'])")
    PREVIEW_URL=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['results'][0]['previews']['preview-hq-mp3'])")

    curl -sL "$PREVIEW_URL" -o "Staging/sounds/${OUTPUT}.mp3"
    [ -s "Staging/sounds/${OUTPUT}.mp3" ] && echo "OK: $OUTPUT" || echo "FAILED: $OUTPUT"
    # Log to license manifest
    echo "| ${OUTPUT}.caf | freesound.org/s/${SOUND_ID} | CC0 | $(date +%Y-%m-%d) | Yes | No | — |" \
         >> Resources/ASSET_LICENSE_MANIFEST.md
}

mkdir -p Staging/sounds

download_sound "paper+rustle+cardstock" "card_pickup"
download_sound "cardstock+landing+thud" "card_setdown"
download_sound "paper+whoosh+flip" "card_flip"
download_sound "paper+crumple+slow" "card_graveyard"
download_sound "ink+brush+stroke" "card_summon"
download_sound "wax+thud+dampened" "wax_seal_tap"
download_sound "crystal+shimmer+bell" "foil_shimmer"
```

Add `FREESOUND_API_KEY` to `.env` (the template in Section 4.5 already includes this slot). If you don't have a Freesound key, register at freesound.org/apiv2/apply — it's free and instant. Run `bash Scripts/verify_environment.sh` to confirm the key is recognized before attempting any sound downloads.
- **Self-recorded** — recording physical cardstock, parchment, and a wax stamp on a USB microphone produces more authentic sounds than any library. A single recording session can capture all interaction sounds.

**Processing pipeline:**
```bash
# Normalize, trim silence, convert to .caf (iOS native audio format)
for INPUT in Staging/sounds/*.wav; do
  NAME=$(basename "$INPUT" .wav)
  # Normalize to -12 LUFS
  ffmpeg -i "$INPUT" -af loudnorm=I=-12:LRA=7:TP=-2 Staging/sounds/${NAME}_norm.wav
  # Trim leading silence (threshold -50dB)
  ffmpeg -i Staging/sounds/${NAME}_norm.wav \
    -af silenceremove=start_periods=1:start_threshold=-50dB \
    Staging/sounds/${NAME}_trimmed.wav
  # Convert to .caf
  afconvert -f caff -d LEI16@44100 Staging/sounds/${NAME}_trimmed.wav \
    Resources/Sounds/${NAME}.caf
  echo "Sound processed: Resources/Sounds/${NAME}.caf"
done
```

(Install ffmpeg: `brew install ffmpeg`)

### 8.3 Implementation

```swift
// Sources/Audio/SoundEngine.swift
import AVFoundation

final class SoundEngine {
    static let shared = SoundEngine()
    private let engine = AVAudioEngine()
    private var buffers: [String: AVAudioPCMBuffer] = [:]
    private var players: [String: AVAudioPlayerNode] = [:]

    func setup() {
        // Use .ambient category — sounds duck when device is muted
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
        try? AVAudioSession.sharedInstance().setActive(true)
        try? engine.start()
    }

    func preload(_ names: [String]) {
        for name in names {
            guard let url = Bundle.main.url(forResource: name, withExtension: "caf"),
                  let file = try? AVAudioFile(forReading: url),
                  let buffer = AVAudioPCMBuffer(
                    pcmFormat: file.processingFormat,
                    frameCapacity: UInt32(file.length)
                  ) else {
                print("SoundEngine: failed to load \(name).caf")
                continue
            }
            try? file.read(into: buffer)
            buffers[name] = buffer
            let player = AVAudioPlayerNode()
            engine.attach(player)
            engine.connect(player, to: engine.mainMixerNode, format: buffer.format)
            players[name] = player
        }
    }

    func play(_ name: String, volume: Float = 1.0) {
        guard let buffer = buffers[name], let player = players[name] else { return }
        player.volume = volume
        player.scheduleBuffer(buffer)
        if !player.isPlaying { player.play() }
    }
}
```

Preload all card interaction sounds at app startup in `AppDelegate` or the root view's `onAppear`.

---

## Section 9: iPad-Specific Layout

Do not scale up the iPhone layout. The iPad requires a fundamentally different card presentation.

### 9.1 Layout Strategy

```swift
@Environment(\.horizontalSizeClass) var hSizeClass
@Environment(\.verticalSizeClass) var vSizeClass

var body: some View {
    Group {
        if hSizeClass == .compact {
            // iPhone or iPad in extreme split view
            SingleCardFocusView(card: selectedCard)
        } else if vSizeClass == .regular {
            // iPad portrait: arc hand view (cards spread in lower semicircle)
            CardHandArcView(cards: handCards)
        } else {
            // iPad landscape: horizontal spread hand view
            CardHandSpreadView(cards: handCards)
        }
    }
}
```

### 9.2 Card Sizing

Compute dynamically via GeometryReader — never hardcode point values for iPad:

```swift
GeometryReader { geometry in
    let availableWidth = geometry.size.width
    let isCompact = hSizeClass == .compact

    // Card width: 55% of available width for iPad, 85% for iPhone
    let cardWidth = isCompact
        ? min(availableWidth * 0.85, 320)
        : min(availableWidth * 0.55, 500)
    let cardHeight = cardWidth * (294.0 / 210.0)  // always maintain 5:7

    CardView(card: card)
        .frame(width: cardWidth, height: cardHeight)
}
```

**Logical size table for reference:**

| Context | iPhone (compact) | iPad portrait | iPad landscape |
|---------|-----------------|--------------|----------------|
| In hand (multiple) | 95 × 133pt | 130 × 182pt | 110 × 154pt |
| Selected | 160 × 224pt | 210 × 294pt | 180 × 252pt |
| Previewed (full) | 270 × 378pt | 340 × 476pt | 300 × 420pt |

### 9.3 Stage Manager & Split View Testing

Test in split view at 1/3, 1/2, and 2/3 width on iPad before marking any layout component complete. Test Stage Manager floating window mode (arbitrary sizes). The layout must respond gracefully to any window size — never assume full screen.

```swift
// Use scene-based window size, not screen size
.onReceive(NotificationCenter.default.publisher(for: UIScene.didActivateNotification)) { _ in
    // Re-compute layout from current window bounds
}
```

### 9.4 Orientation Layout

In landscape on iPad, the hand arc becomes a horizontal spread with the battlefield taking up more vertical space. Do not simply rotate the portrait layout — implement separate view bodies.

---

## Section 10: Accessibility

### 10.1 VoiceOver

```swift
CardView(card: card)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(card.voiceOverLabel)
    .accessibilityHint("Double-tap to select. Long-press to preview.")
    .accessibilityAddTraits(.isButton)
    .accessibilityCustomActions([
        UIAccessibilityCustomAction(name: "Preview card", actionHandler: { _ in
            cardState = .previewed; return true
        }),
        UIAccessibilityCustomAction(name: "Show card details", actionHandler: { _ in
            showDetailSheet = true; return true
        })
    ])

extension Card {
    var voiceOverLabel: String {
        var parts = [name]
        // cost is Int? — nil for stabilizers, which have no cost
        if let c = cost, c > 0 { parts.append("Cost: \(c) chaos mote\(c == 1 ? "" : "s")") }
        parts.append(type.rawValue.capitalized)
        if let atk = attack, let hp = hp { parts.append("\(atk) attack, \(hp) hit points") }
        if instability > 0 { parts.append("instability \(instability)") }
        parts.append(abilityText)
        if let flavor = flavorText { parts.append("Flavor: \(flavor)") }
        return parts.joined(separator: ". ")
    }
}
```

### 10.2 Dynamic Type

```swift
// Never hardcode UIFont sizes — scale with UIFontMetrics
func scaledFont(name: String, textStyle: UIFont.TextStyle, baseSize: CGFloat) -> Font {
    let metrics = UIFontMetrics(forTextStyle: textStyle)
    let rawFont = UIFont(name: name, size: baseSize) ?? UIFont.preferredFont(forTextStyle: textStyle)
    return Font(metrics.scaledFont(for: rawFont))
}
```

The text box must accommodate Dynamic Type scaling — at XXL sizes, font will be 2× larger. The text box should expand its scroll region, not truncate text.

### 10.3 Reduce Motion

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

// In any animation site:
withAnimation(reduceMotion ? .none : .spring(response: 0.35, dampingFraction: 0.65)) {
    cardState = newState
}

// Disable parallax entirely:
var parallaxEnabled: Bool { !reduceMotion && effectTier >= .shimmerOnly }
```

### 10.3b Stats Bar — Wax Seal Z-ordering and Text Boundary

The wax seal zone is x=164–198, y=258–292. The stats bar ATK/HP text right-aligns within the 202pt bar at y=267–282. Without explicit z-ordering and padding, they overlap with undefined layering.

**Rule:** Wax seal always renders on top. ATK/HP text must be right-inset by 52pt to stay clear of the seal zone.

```swift
// In the ZStack that builds the full card:
ZStack {
    // ... art box, type line, text box ...

    // Stats bar — 52pt right padding keeps text clear of seal zone (x ≤ 158)
    HStack(spacing: 0) {
        if card.instability > 0 {
            Text("⚡\(card.instability)")
                .font(.custom("Oswald-Bold", size: 10))
                .foregroundColor(card.faction.color.opacity(0.8))
        }
        Text("\(card.collectorNumber) • \(card.setCode)")
            .font(.custom("Cinzel-Regular", size: 7))
            .foregroundColor(Color("parchment-mid"))
        Spacer()
        if let atk = card.attack, let hp = card.hp {
            Text("\(atk) / \(hp)")
                .font(.custom("Oswald-Bold", size: 13))
                .foregroundColor(Color("ink-black"))
        }
    }
    .frame(height: 15)
    .padding(.leading, 6)
    .padding(.trailing, 52)  // 6pt normal + 34pt seal width + 12pt buffer

    // Wax seal — always on top
    WaxSealView(rarity: card.rarity)
        .frame(width: 34, height: 34)
        .position(x: 181, y: 275)  // center of x=164–198, y=258–292 zone
        .zIndex(1)
}
```

### 10.4 Color Contrast

The warm parchment palette can fail WCAG AA (4.5:1 contrast ratio for normal text). Verify every combination:

| Text | Background | Required ratio | Action if failing |
|------|-----------|---------------|-------------------|
| ink-black on parchment-light | 4.5:1 | Adjust parchment-light to no darker than #F0DFC0 |
| parchment-dark on parchment-light | 3:1 (large text) | Verify flavor text passes at its size |
| ink-dark-mode on parchment-dark-mode | 4.5:1 | Verify dark mode text contrast |

**Contrast verification — automatable via Python:**

The Xcode Accessibility Inspector is a GUI tool the agent cannot use. Instead, verify contrast ratios programmatically:

```python
#!/usr/bin/env python3
# Scripts/verify_contrast.py
# Verifies WCAG AA contrast ratios for all text/background combinations

def relative_luminance(hex_color):
    hex_color = hex_color.lstrip('#')
    r, g, b = [int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    def linearize(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)

def contrast_ratio(hex1, hex2):
    l1 = relative_luminance(hex1)
    l2 = relative_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

# All required combinations from Section 1.2
pairs = [
    # (text, background, min_ratio, label)
    ("#1A1208", "#F5E6C8", 4.5, "ink-black on parchment-light (normal text)"),
    ("#8B6914", "#F5E6C8", 3.0, "parchment-dark on parchment-light (large text/flavor)"),
    ("#1A1208", "#D4B896", 4.5, "ink-black on parchment-mid"),
    ("#E8D5A0", "#2A2015", 4.5, "ink-dark-mode on parchment-dark-mode (dark mode)"),
    ("#1A1208", "#E8D5B0", 4.5, "ink-black on canvas-warm"),
]

all_pass = True
for text, bg, required, label in pairs:
    ratio = contrast_ratio(text, bg)
    status = "✓ PASS" if ratio >= required else "✗ FAIL"
    if ratio < required:
        all_pass = False
    print(f"{status} {ratio:.2f}:1 (need {required}:1) — {label}")

import sys
if not all_pass:
    print("\nCONTRAST FAILURES — fix before marking accessibility complete")
    sys.exit(1)
else:
    print("\nAll contrast ratios pass WCAG AA")
```

Run as part of every QA pass:
```bash
python3 Scripts/verify_contrast.py
```

**VoiceOver audit — use UITest instead of GUI Inspector:**
```swift
// Tests/AccessibilityTests.swift
import XCTest

class CardAccessibilityTests: XCTestCase {
    func testCardViewHasAccessibilityLabel() {
        let app = XCUIApplication()
        app.launch()
        // Verify card elements have non-empty accessibility labels
        let cards = app.buttons.matching(identifier: "CardView")
        XCTAssertGreaterThan(cards.count, 0, "No cards found with accessibility identifier")
        for i in 0..<cards.count {
            XCTAssertFalse(cards.element(boundBy: i).label.isEmpty,
                           "Card \(i) has no accessibility label")
        }
    }
}
```

Run accessibility tests:
```bash
xcodebuild test \
  -scheme CardGame \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -only-testing:CardGameTests/AccessibilityTests \
  2>&1 | grep -E "passed|failed|error"
```

**⚠️ Human verification still required for:** full VoiceOver navigation flow (swipe order, focus trapping, custom action discoverability) and Dynamic Type visual layout at XXL sizes. Flag these in the iteration log as pending human review.

---

## Section 11: End-to-End Production Workflow

### 11.1 Budget Allocation

| Category | Allocation | Service |
|----------|-----------|---------|
| Creature artwork (primary) | 35% | Custom LoRA via Replicate |
| Non-creature artwork | 25% | fal.ai — FLUX.1 Dev |
| Artwork iterations/rejects | 15% | fal.ai or SDXL via Replicate |
| Layer segmentation for parallax | 15% | Replicate REMBG |
| Texture generation (custom) | 5% | fal.ai FLUX.1 Dev |
| Reserve | 5% | — |

When the custom LoRA produces a poor result, first retry with a refined prompt (1 retry from LoRA budget). If still poor, switch to fal.ai FLUX.1 Dev and charge to the non-creature budget. Do not retry more than twice — move on.

### 11.2 Pipeline Steps (Ordered)

1. Lock deployment parameters in iteration log ← **do not skip**
2. Set up environment — all four simulators, all CLI tools, font verification passing
3. Generate all required procedural assets (foil gradient, wax normal, brush normal)
4. Source and prepare parchment/canvas textures — verify tiling, add to asset catalog
5. Define card schema, write 5 test card JSON files (one per rarity, all 4 card types covered — see Section 2.4)
6. Smoke test passing on all four simulators ← **hard gate**
7. Build static card SwiftUI layout with correct proportions (Section 1.4) — all states, no effects, both size classes
8. Typography pass — all text elements to spec (Section 1.5), letterpress effect applied, font verification complete
9. Parchment shader pass — apply to card body, verify against Book of Kells reference
10. Generate test card artwork — color grade — verify against Rembrandt reference
11. Art box compositing — oil paint shader + edge vignette + AO shadow
12. Foil shader + CMMotionManager
13. Core Animation state transitions (Section 1.6)
14. SpriteKit particle systems
15. Wax seal component (Section 6.6)
16. Card back design and flip animation (Section 1.8)
17. Error/fallback states (Section 1.9)
18. HapticEngine — log all haptic interactions as pending physical device verification
19. SoundEngine — preload all interaction sounds
20. iPad layout pass — all size classes, Stage Manager, split view
21. Dark mode pass — all components verified in dark appearance
22. Accessibility pass — VoiceOver, Dynamic Type, Reduce Motion, contrast audit
23. Performance profiling — agent runs `xctrace` CLI checks; flags GPU Frame Capture and Metal System Trace for human to run in Xcode Instruments
24. Visual regression baseline — screenshot all states on all four devices, commit

---

## Section 12: Iterative Testing & Refinement

### 12.1 Reference Anchoring

Before implementing each component, write to `Logs/iteration_log.md`:
- Exact reference URL or filename
- What specific quality you are extracting from it
- Measurable success criteria in concrete terms

Do not generate or code until this is written. "Looks good" is never a success criterion.

### 12.2 Automated Visual Regression

```python
#!/usr/bin/env python3
# Scripts/compare_screenshots.py
from PIL import Image, ImageChops
import sys, json, os

def compare(ref_path, current_path, threshold=0.025):
    if not os.path.exists(ref_path):
        print(json.dumps({"error": f"Reference not found: {ref_path}", "pass": False}))
        sys.exit(1)
    if not os.path.exists(current_path):
        print(json.dumps({"error": f"Current not found: {current_path}", "pass": False}))
        sys.exit(1)

    ref = Image.open(ref_path).convert('RGB').resize((400, 560))
    cur = Image.open(current_path).convert('RGB').resize((400, 560))
    diff = ImageChops.difference(ref, cur)
    pixels = list(diff.getdata())
    score = sum(sum(p) for p in pixels) / (len(pixels) * 3 * 255)
    result = {
        "score": round(score, 4),
        "threshold": threshold,
        "pass": score < threshold,
        "ref": ref_path,
        "current": current_path
    }
    print(json.dumps(result))
    return result["pass"]

if __name__ == "__main__":
    if not compare(sys.argv[1], sys.argv[2]):
        sys.exit(1)
```

Run on all four device screenshots after every iteration. If any device fails, the iteration is not complete.

### 12.3 Structured Critique Template

Use this exact format. No free-form critique.

```markdown
## Iteration [N] — [Component Name] — [Device]
**Timestamp:** [YYYY-MM-DD HH:MM]
**Reference:** [URL or filename]

| Axis | Score (1-5) | Observation |
|------|------------|-------------|
| Material believability | | Does it read as physical [parchment/oil paint/wax]? |
| Color temperature | | Warm enough? Sepia-shifted correctly? |
| Texture grain | | Visible but not distracting? |
| Typography letterpress | | Ink bleed, weight, warmth visible? |
| Lighting consistency | | All elements lit from same upper-left direction? |
| Tactile impression | | Overall: does it feel touchable? |
| iPad vs iPhone | | Any layout differences specific to larger screen? |
| Dark mode | | Candlelit manuscript feel? Not just inverted? |

**Regression check:** [PASS/FAIL] — diff score [X.XXXX]
**Largest gap:** [one sentence — the single most impactful visual problem]
**Root cause:** [why does this gap exist — wrong shader param, wrong color, wrong timing?]
**Next action:** [one specific, concrete action to address largest gap]
**Blocked items:** [anything that cannot be fixed without human input or external dependency]
```

### 12.4 Refinement Rules

- One fix per loop — no exceptions. Multiple simultaneous changes make regressions undiagnosable.
- After any fix, run the full four-device build before comparison.
- Three failed attempts at same gap: document as blocked, move to next gap.
- Never declare complete based on iPhone alone — iPad must also pass.
- Never declare complete without a dark mode screenshot for every state.

### 12.5 Exit Criteria

A card component is **complete** when all of the following are true:

- All critique axes score 4+ on all four device targets in both light and dark mode
- Visual regression diff score < 0.025 on all four device screenshots
- All nine card states render without error on all four simulators
- Card back renders correctly and flip animation completes without visual artifacts
- Error fallback states display correctly (simulate artwork load failure, font failure)
- Instruments GPU Frame Capture: frame time < 8ms on iPhone 12 during active effects **[HUMAN — flag in iteration log, await confirmation]**
- Instruments Core Animation: no off-screen rendering layers visible **[HUMAN — or use agent's debug logging from Section 13.1]**
- All haptic interactions logged as "⚠️ PENDING PHYSICAL DEVICE VERIFICATION"
- Accessibility Inspector: no VoiceOver gaps, all text contrast passes WCAG AA
- Dynamic Type: card remains usable at all accessibility text size settings
- Reduce Motion: static card looks premium without any motion effects
- License manifest entry exists for every asset used
- Asset color grading verified: artwork harmonizes with parchment-light swatch

---

## Section 13: Performance Profiling

### 13.1 Performance Profiling

**What the agent can do vs. what requires human action:**

| Task | Method | Who |
|------|--------|-----|
| Check for off-screen rendering layers | `xctrace` CLI (see below) | Agent |
| Measure app launch time | `xctrace` CLI | Agent |
| GPU frame time capture | Xcode Instruments GUI — cannot be automated | Human |
| Metal System Trace | Xcode Instruments GUI — cannot be automated | Human |
| Memory profiling | `xctrace` CLI (partial) | Agent |
| Simulate memory warning | `xcrun simctl` CLI | Agent |

**What the agent must flag for human profiling:**
At the end of every implementation phase, write to `Logs/iteration_log.md`:
```
⚠️ HUMAN PROFILING REQUIRED:
- GPU Frame Capture in Xcode Instruments
- Metal System Trace
- Core Animation: Color Offscreen-Rendered (enable in Debug menu)
Target: all pass performance thresholds in Section 13.2 before this phase is complete.
```
Do not mark a phase complete without a human confirming GPU frame times.

**What the agent CAN run via `xctrace` CLI:**

```bash
# Record a launch trace (measures app launch time and CPU)
xcrun xctrace record \
  --template "Time Profiler" \
  --device "iPhone 12" \
  --launch -- com.yourapp.bundle.id \
  --output Logs/Performance/launch_trace.xctrace \
  --time-limit 10s

# Export summary data
xcrun xctrace export \
  --input Logs/Performance/launch_trace.xctrace \
  --output Logs/Performance/launch_summary.xml \
  --xpath '/trace-toc/run[@number="1"]/data/table[@schema="time-profile"]'

# Simulate memory warning
xcrun simctl send_notification booted com.apple.UIKit.memory-pressure
echo "Memory warning sent — verify app recovers gracefully"
```

**Off-screen rendering check (closest CLI equivalent):**
```bash
# Build with debug flag that logs off-screen rendering hits to console
xcodebuild -scheme CardGame \
  -destination 'platform=iOS Simulator,name=iPhone 12' \
  -configuration Debug \
  SWIFT_ACTIVE_COMPILATION_CONDITIONS="DEBUG OFFSCREEN_CHECK" \
  build 2>&1 | grep -i "offscreen\|rasterize\|blend" | head -20
```

Add a debug-only logging pass in `CardView.swift` that prints any layer with `shouldRasterize = true` while animating (which causes off-screen rendering):
```swift
#if DEBUG
extension CALayer {
    func auditOffscreenRendering(depth: Int = 0) {
        if shouldRasterize && !isPaused {
            print("⚠️ OFFSCREEN RENDER: \(name ?? "unnamed") depth=\(depth)")
        }
        sublayers?.forEach { $0.auditOffscreenRendering(depth: depth + 1) }
    }
}
#endif
```

**Human profiling checklist (write to iteration log, await confirmation):**
```
HUMAN PROFILING CHECKLIST — Phase [N]
[ ] Xcode → Open .xctrace or run from Instruments
[ ] Core Animation instrument: Color Blended Layers ON
    → Eliminate all red/yellow highlights (off-screen rendering)
[ ] GPU Frame Capture: frame time < 8ms on iPhone 12 during all effects
[ ] GPU Frame Capture: frame time < 5ms on iPhone 15 Pro
[ ] Metal System Trace: no CPU/GPU sync stalls
[ ] Draw calls per frame < 80 (target < 40)
[ ] Texture memory with 7 cards < 120MB (target < 80MB)
```

### 13.2 Performance Targets

| Metric | Target | Hard Limit | Baseline Device |
|--------|--------|-----------|----------------|
| GPU frame time (all effects active) | <5ms | <8ms | iPhone 12 (A14) |
| GPU frame time (all effects active) | <3ms | <5ms | iPhone 15 Pro (A17) |
| GPU frame time (staticOnly tier) | <2ms | <4ms | iPhone 12 |
| Draw calls per card frame | <40 | <80 | All |
| Texture memory (7 cards in hand) | <80MB | <120MB | iPhone 12 |
| App launch → first card visible | <1.5s | <2.5s | All |
| Card state transition | <200ms | <350ms | All |
| SpriteKit frame time (particles active) | <3ms | <5ms | iPhone 12 |

### 13.3 Optimization Techniques

- Texture atlases for all small assets (icons, mana symbols, wax seals) — one draw call per atlas
- `shouldRasterize = true` on the card composite layer when animations are idle — caches parchment + frame + text as a single cached bitmap
- ASTC 4x4 texture compression via Xcode asset catalog — 6-8x VRAM reduction vs uncompressed PNG
- `drawsAsynchronously = true` on SpriteKit ambient particle scene
- Use mask layer instead of `cornerRadius + masksToBounds` on any animated layer — avoids off-screen rendering
- Precompile Metal shaders at build time (Section 6.1) — eliminates first-launch stutter
- Flush non-visible card texture caches on `didReceiveMemoryWarning` — implement in the texture manager
- Use `MTLTextureDescriptor.usage = [.shaderRead]` (not `.renderTarget`) on texture-only assets — saves GPU memory bandwidth

### 13.4 Texture Caching

Implement a `TextureCache` service that wraps `MTLTextureLoader` with LRU eviction:

```swift
final class TextureCache {
    static let shared = TextureCache()
    private var cache: [String: MTLTexture] = [:]
    private var accessOrder: [String] = []
    private let maxTextures = 20
    private let device = MTLCreateSystemDefaultDevice()!
    private lazy var loader = MTLTextureLoader(device: device)

    func texture(named name: String) -> MTLTexture? {
        if let cached = cache[name] {
            // Move to end of LRU
            accessOrder.removeAll { $0 == name }
            accessOrder.append(name)
            return cached
        }
        // Load from asset catalog
        guard let texture = try? loader.newTexture(name: name, scaleFactor: 1.0,
                                                    bundle: nil, options: nil) else { return nil }
        if cache.count >= maxTextures {
            // Evict least recently used
            if let lru = accessOrder.first {
                cache.removeValue(forKey: lru)
                accessOrder.removeFirst()
            }
        }
        cache[name] = texture
        accessOrder.append(name)
        return texture
    }

    func evictAll() {
        cache.removeAll()
        accessOrder.removeAll()
    }
}
```

Call `TextureCache.shared.evictAll()` when the app receives a memory warning.

### 13.5 App Store Compliance

- Target initial download < 200MB; use on-demand resources for expansion card sets
- Peak memory < 800MB on iPhone 12 (4GB RAM device) — iOS terminates at approximately 1.4GB
- Test memory warning response: Xcode → Debug → Simulate Memory Warning (or `xcrun simctl send_notification booted com.apple.UIKit.memory-pressure`)
- Verify app recovers gracefully from memory warning and continues functioning — do not crash

**Pre-submission legal checklist (run before every App Store build):**

```bash
# 1. Regenerate Acknowledgements bundle from current SPM dependency set
license-plist --output-path CardGame/Settings.bundle
ls CardGame/Settings.bundle/Root.plist && echo "Acknowledgements OK" || echo "BLOCKED: license-plist failed"

# 2. Confirm all assets have manifest entries
python3 -c "
import os, re
manifest = open('Resources/ASSET_LICENSE_MANIFEST.md').read()
assets = [f for f in os.listdir('Resources/Icons') if not f.startswith('.')]
missing = [a for a in assets if a not in manifest]
if missing:
    print('MISSING FROM MANIFEST:', missing)
    exit(1)
else:
    print('All assets accounted for in manifest')
"

# 3. Confirm LoRA license gate was completed
ls Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png \
  && echo "LoRA license gate: CLEARED" \
  || echo "BLOCKED: LoRA license screenshot missing — see Section 3.2"
```

All three checks must pass before submitting to App Store Connect.

---

## Section 14: Quality Bar & Validation

This aesthetic succeeds when an observer's first instinct is to reach out and touch the card, not to recognize it as a screen UI. Every element of the validation checklist serves this goal.

**The physical test:** Screenshot a card and show it to someone without context. If they ask "is that a real card?" or "can I hold that?", the aesthetic is working. If they immediately recognize it as a digital UI, something is wrong.

**Resolution:** Artwork at native @3x resolution on Pro Max. Parchment grain visible at native resolution on physical device. No aliased edges anywhere on the card.

**Color:** P3 wide gamut for all rarity colors. Warm tones are visibly richer on Pro Display XDR and modern iPhone/iPad screens — test specifically on a P3 display to verify.

**Frame rate:** 60fps on iPhone 12, 120fps (ProMotion) on iPhone 15 Pro, during all animations and all effects active simultaneously.

**Material coherence:** Oil paint artwork, parchment frame, wax seals, and gold frames all feel like they belong to the same physical world and are illuminated by the same light source (upper-left, warm directional).

**Haptics:** A user with eyes closed can distinguish picking up from setting down a card, and a wax seal tap from a normal card tap.

**Sound:** All interaction sounds are identifiable as physical materials. No sound that reads as "digital UI" (no click, tap, or electronic tone without a physical analog).

**Reduce Motion:** The static card looks premium without any motion effects. Parchment texture and typography carry the aesthetic alone.

**Dark mode:** The dark mode reads as candlelit manuscript — deep warm brown with warm cream text — not an inverted version of the light mode.

**iPad:** Not a scaled iPhone view. The larger canvas provides a meaningfully richer card presentation.

**Accessibility:** Full VoiceOver navigation with meaningful labels. Dynamic Type scaling doesn't break the layout. WCAG AA contrast on all text in both light and dark mode.

**Memory:** 7 cards in hand, all effects active, on iPhone 12: under 160MB.

**Error handling:** Every failure state shows a designed fallback — no blank rectangles, no crashes, no system-default error views.

---

## Addendum: Claude Code Multiagent Setup

### Agent Roles

**Orchestrator**
- Source of truth: `Logs/MASTER_STATE.json` and `Logs/iteration_log.md`
- Assigns tasks with explicit inputs, expected outputs, file paths, and measurable success criteria
- Treats any subagent response without explicit success confirmation AND file md5 checksum as failed — re-issues the task, never proceeds
- Tracks budget in `Logs/BUDGET_LEDGER.md`, reallocates from reserve if any category hits 110% of allocation
- Coordinates physical device testing gate for haptics — flags to human when physical device verification is needed

**Asset Subagent**
- Specialization: AI image generation (LoRA via Replicate and FLUX.1 Dev via fal.ai), prompt engineering, color grading, normal map generation, texture preparation, license manifest
- Owns: `Scripts/generate_artwork.sh`, `Scripts/grade_artwork.sh`, `Scripts/generate_foil_gradient.py`, `Scripts/generate_wax_normal.py`, `Staging/`, `Resources/ASSET_LICENSE_MANIFEST.md`
- Startup check: run `bash Scripts/verify_environment.sh` — must pass all API key connectivity checks before generating any assets. Also verify R2 LoRA URL is reachable (covered by the master script).
- Returns: staged asset path + md5 + manifest entry + dimensions + color grading confirmation + aesthetic note ("reads as oil paint? warm-shifted? no cool tones?")

**Engineering Subagent**
- Specialization: Swift/SwiftUI, Metal shaders (all three), SpriteKit, Core Animation, MTKView bridge, haptics, audio, data model
- Owns: `Sources/`, Xcode project, `Package.swift`, all `.metal` shader files
- Startup check: run `bash Scripts/verify_environment.sh` — must confirm Xcode version, all four simulators present, font verification passing. Smoke test must build clean on all four targets before any rendering work begins.
- Returns: successful build log path + four simulator screenshot paths + md5 checksums of all four screenshots + Metal shader compilation log (no errors or warnings)

**QA Subagent**
- Specialization: visual regression, structured critique, `xctrace` CLI profiling, accessibility UITests, dark mode verification
- Owns: `Tests/ReferenceScreenshots/`, `Scripts/compare_screenshots.py`, `Scripts/verify_contrast.py`, `Tests/AccessibilityTests.swift`, all `Logs/Iterations/` entries
- Startup check: run `bash Scripts/verify_environment.sh` — verify Python + Pillow + numpy installed (covered by master script). Also confirm reference screenshots exist for all four device targets in both light and dark mode before any regression comparison.
- **Cannot run:** Xcode Instruments GUI — writes human profiling checklist (Section 13.1 template) to iteration log and awaits human confirmation before marking GPU/Metal performance exit criteria complete
- Runs the full refinement loop procedure from Section 5.4 — does not skip steps
- Critique must use Section 12.3 template exactly — free-form critique is not accepted
- Signals orchestrator with explicit PASS or FAIL + structured critique data + diff scores for all four devices
- On FAIL: includes single largest gap, root cause assessment, and one recommended action
- Blocked after 3 loops on same gap: flags as blocked with constraint description — orchestrator decides whether to change approach, reduce scope, or escalate to human

### Handoff Protocol

All handoffs written to `Logs/Handoffs/` as JSON immediately upon completion:

```json
{
  "from": "asset-subagent",
  "to": "orchestrator",
  "task_id": "artwork-dragon-v3",
  "timestamp": "2025-01-15T14:32:00Z",
  "status": "success",
  "outputs": {
    "staged_path": "Staging/dragon_art_v3_graded.png",
    "md5": "a1b2c3d4e5f6789012345678",
    "dimensions": "1024x1024",
    "manifest_updated": true,
    "color_graded": true,
    "aesthetic_note": "Strong impasto brushwork from LoRA, warm chiaroscuro, highlights harmonize with parchment-light swatch, no digital artifacts or cool tones"
  },
  "budget_spent": 0.038,
  "license_status": "SDXL Apache 2.0 + custom LoRA — pending legal review per manifest note"
}
```

Orchestrator policy: any handoff without both `status: "success"` and a valid `md5` value is automatically re-issued to the same subagent with the same task parameters. Do not proceed past any failed handoff.

### Context Management

Each subagent maintains its own log file (`Logs/[subagent-name]-log.md`). The orchestrator maintains `Logs/MASTER_STATE.json` with current phase, task queue, completed tasks, blocked items, and budget remaining.

Recovery procedure for any subagent context reset: read own log → read `Logs/MASTER_STATE.json` → confirm understanding of current state before taking any action. Never ask the orchestrator to recap — all state is in the files.

Subagent approaching context limit: immediately write `Logs/RECOVERY_[SUBAGENT]_[TIMESTAMP].md` with: exact current task, what has been completed within that task, what remains, all file paths touched, next step. This recovery file enables a fresh agent instance to resume without loss.

### Budget Tracking

```markdown
# BUDGET_LEDGER.md — Updated after every API call

## Allocations
| Category | Budget | Spent | Remaining |
|----------|--------|-------|-----------|
| Creature artwork (LoRA via Replicate) | $X.XX | $X.XX | $X.XX |
| Non-creature artwork (fal.ai FLUX) | $X.XX | $X.XX | $X.XX |
| Artwork iterations (fal.ai or Replicate) | $X.XX | $X.XX | $X.XX |
| Layer segmentation | $X.XX | $X.XX | $X.XX |
| Texture generation | $X.XX | $X.XX | $X.XX |
| Reserve | $X.XX | $X.XX | $X.XX |
| **TOTAL** | $X.XX | $X.XX | $X.XX |

## Call Log
| Task | Service | Model | Est. | Actual | Time | Notes |
|------|---------|-------|------|--------|------|-------|
| dragon_art_v1 | Replicate | custom-lora | $0.04 | $0.04 | 14:20 | LoRA result poor — retry |
| dragon_art_v2 | Replicate | custom-lora | $0.04 | $0.04 | 14:35 | Accepted |
```

If reserve is exhausted, orchestrator writes a human-readable budget status summary and halts all generation activity until human guidance is received. The orchestrator must never spend beyond total allocated budget autonomously.

---

## Revision Log

| Date | Change |
|------|--------|
| 2026-02-21 | N ⊕ unified cost display replaces tiled dot system (owner-approved) |
| 2026-02-21 | Updated iPad card sizing from 0.40/350pt to 0.55/500pt based on iOS card game UI research. iPhone cap updated from 260pt to 320pt. Collection grid iPad minimum updated to 160pt. Research found original 40% spec produced only 34% effective width on 13" iPad; industry standard is 50-65%. |


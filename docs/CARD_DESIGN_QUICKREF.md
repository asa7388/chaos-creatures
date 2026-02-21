# Chaos Creatures — Card Design Quick Reference
### Lookup tables only — no explanations. For rationale, read CARD_DESIGN_GUIDE.md.
### If this file conflicts with the full guide, the full guide is authoritative.

---

## DEPLOYMENT PARAMETERS (locked)

| Parameter | Value |
|-----------|-------|
| Minimum iOS | iOS 16 |
| Devices | iPhone + iPad (all form factors) |
| Chip baseline | A14+ (iPhone 12, iPad Air 4th gen) |
| Metal GPU family | Apple7 |
| iPhone orientation | Portrait-primary |
| iPad orientation | Portrait + landscape, separate layouts |
| Card aspect ratio | 5:7 (210 × 294pt reference) |

---

## COLOR PALETTE (use P3 values in Swift)

| Token | Hex | P3 (r, g, b) | Usage |
|-------|-----|-------------|-------|
| `parchment-light` | `#F5E6C8` | `0.953, 0.898, 0.780` | Card body base |
| `parchment-mid` | `#D4B896` | `0.827, 0.718, 0.585` | Shadows, inner borders |
| `parchment-dark` | `#8B6914` | `0.541, 0.408, 0.071` | Deep shadows, ink shadow color |
| `ink-black` | `#1A1208` | `0.098, 0.071, 0.027` | All typography, fine lines |
| `wax-red` | `#8B1A1A` | `0.537, 0.094, 0.082` | Demonic Kingdoms faction color |
| `wax-blue` | `#1A2E5C` | `0.086, 0.176, 0.353` | Reserved (unassigned) |
| `wax-green` | `#1A3D1A` | `0.086, 0.235, 0.086` | Reserved (unassigned) |
| `fey-teal` | `#1A3D30` | `0.086, 0.235, 0.184` | Fey Courts faction color |
| `rot-moss` | `#1C2B1A` | `0.106, 0.165, 0.098` | The Endless faction color |
| `aged-gold` | `#C8A951` | `0.776, 0.659, 0.306` | Rare frames; Celestial Crusade faction color |
| `antique-silver` | `#9AA0A6` | `0.600, 0.624, 0.647` | Uncommon frames; Ironwright faction color |
| `epic-amethyst` | `#7B2FBE` | `0.463, 0.161, 0.729` | Epic frames, arcane glow |
| `legendary-ember` | `#C85A1A` | `0.773, 0.341, 0.082` | Legendary gradient |
| `canvas-warm` | `#E8D5B0` | `0.906, 0.831, 0.686` | Backgrounds, card back |
| `parchment-dark-mode` | `#2A2015` | `0.161, 0.122, 0.071` | Dark mode card body |
| `ink-dark-mode` | `#E8D5A0` | `0.906, 0.831, 0.620` | Dark mode typography |

Swift: `Color(UIColor(displayP3Red: r, green: g, blue: b, alpha: 1))`

### Faction Color Mapping

| Faction | Token | Where used |
|---------|-------|-----------|
| Demonic Kingdoms | `wax-red` | Wax seal + faction icon tint |
| Fey Courts | `fey-teal` | Wax seal + faction icon tint |
| Ironwright Collective | `antique-silver` | Wax seal + faction icon tint |
| Celestial Crusade | `aged-gold` | Wax seal + faction icon tint |
| The Endless | `rot-moss` | Wax seal + faction icon tint |

---

## CARD LAYOUT (210 × 294pt reference — always scale proportionally)

```
┌─────────────────────────────────┐
│ [outer border: 3pt all sides]   │
│ ┌─────────────────────────────┐ │
│ │ NAME BAR          N ⊕       │ │  25pt tall
│ ├─────────────────────────────┤ │
│ │        ART BOX              │ │  132pt tall
│ ├─────────────────────────────┤ │
│ │[FAC] TYPE LINE  [SET SYMBOL]│ │  18pt tall
│ ├─────────────────────────────┤ │
│ │        TEXT BOX             │ │  88pt tall
│ │  [ability] ──────────────   │ │
│ │  [flavor italic]            │ │
│ ├─────────────────────────────┤ │
│ │ [collector #]  [SET] [STATS]│ │  15pt tall
│ │ ░░░░ rarity color bar ░░░░  │ │  4pt tall
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Zone Measurements

| Zone | X | Y | W | H | Notes |
|------|---|---|---|---|-------|
| Outer border | 0 | 0 | 210 | 294 | Corner radius: 12pt |
| Inner content area | 4 | 4 | 202 | 286 | Corner radius: 9pt |
| Name bar | 4 | 4 | 202 | 25 | `N ⊕` right-aligned, 6pt from inner right edge; Oswald-Bold 13pt numeral + 20×20pt chaos mote icon |
| Art box | 4 | 29 | 202 | 132 | No corner radius |
| Art box vignette | 4 | 29 | 202 | 132 | 20pt feather fade all 4 edges |
| Type line | 4 | 161 | 202 | 18 | Faction icon left 14×14pt; set symbol right 14×14pt |
| Text box | 8 | 179 | 194 | 88 | 4pt internal padding (Spell/Stabilizer: 107pt — stats bar absent) |
| Ability/flavor divider | 12 | varies | 186 | 0.5 | parchment-mid hairline |
| Stats bar | 4 | 267 | 202 | 15 | ATK/HP right-aligned; D20 instability icon+N left; absent on Spell/Stabilizer |
| Rarity color bar | 4 | 282 | 202 | 4 | Bottom of inner area |
| Wax seal | 164 | 258 | 34 | 34 | Rarity indicator — absent on Spell and neutral Ruins |

### Border Weight by Rarity

| Rarity | Border | Inner shadow | Outer glow | Frame |
|--------|--------|-------------|-----------|-------|
| Common | 3pt flat | None | None | Matte parchment-mid |
| Uncommon | 3.5pt | 1pt | None | Antique-silver gradient |
| Rare | 4pt | 2pt | 4pt, aged-gold, 40% | Aged-gold gradient |
| Epic | 4pt | 2pt | 6pt, epic-amethyst, 50% | Amethyst→purple animated |
| Legendary | 4pt | 2pt | 8pt, legendary-ember, 60% | Ember→gold animated |

### Chaos Mote Cost Display

Format: `N ⊕` — numeral (Oswald-Bold 13pt) + single chaos mote icon (20×20pt)
Position: Right-aligned in Name Bar, 6pt from inner right edge, vertically centered
Icon file: Resources/Icons/chaos_mote_symbol.png

| Card Type    | Cost Display       |
|--------------|-------------------|
| Creature     | `N ⊕`             |
| Spell        | `N ⊕`             |
| Planar Ruin  | `N ⊕` (no label)  |
| Stabilizer   | None              |

### Faction Icons (type line, left-aligned, 14×14pt)

| Faction | Icon | Token | Asset |
|---------|------|-------|-------|
| Demonic Kingdoms | Scroll | `wax-red` | `faction_demonic.png` |
| Fey Courts | Tree | `fey-teal` | `faction_fey.png` |
| Ironwright Collective | Sledgehammer | `antique-silver` | `faction_ironwright.png` |
| Celestial Crusade | Single wing | `aged-gold` | `faction_celestial.png` |
| The Endless | Skull | `rot-moss` | `faction_endless.png` |

All faction icons are white silhouette PNGs (tinted at runtime). All in `Resources/Icons/`.

### Instability Badge (stats bar, left-aligned)

| Property | Value |
|----------|-------|
| Icon | D20 cracked die silhouette — `Resources/Icons/instability_d20.png` |
| Font | Oswald-Bold, 10pt |
| Format | [D20 icon] N |
| Color | Faction token color at 80% opacity |
| Left margin | 4pt |

---

## TYPOGRAPHY

### Fonts (OFL licensed, fonts.google.com)

| Font | Used for |
|------|---------|
| Cinzel-Bold | Card name |
| Cinzel-Regular | Type line, collector number, set code, mana cost text |
| EBGaramond-Regular | Ability text |
| EBGaramond-Italic | Flavor text |
| EBGaramond-SemiBold | Keyword abilities |
| Oswald-Bold | ATK/HP stats, instability badge, chaos mote cost numeral (13pt) |

All 6 must be registered in Info.plist under `UIAppFonts` before use.

### Text Element Specs

| Element | Font | Size | Color | Align | Max lines | Overflow |
|---------|------|------|-------|-------|-----------|----------|
| Card name | Cinzel-Bold | 13pt | ink-black | Left | 1 | Scale to 10pt, truncate |
| Chaos mote cost numeral | Oswald-Bold | 13pt | ink-black | Right | 1 | Never truncate — all card types except stabilizers |
| Type line | Cinzel-Regular | 10pt | ink-black | Left | 1 | Scale to 8pt, truncate |
| Ability text | EBGaramond-Regular | 11pt | ink-black | Left | — | Scroll |
| Flavor text | EBGaramond-Italic | 10pt | parchment-dark | Left | — | Below ability |
| Keywords | EBGaramond-SemiBold | 11pt | ink-black | Left | — | Bold keyword only |
| Collector # | Cinzel-Regular | 7pt | parchment-mid | Left | 1 | Never truncate |
| Set code | Cinzel-Regular | 7pt | parchment-mid | Center | 1 | — |
| ATK/HP | Oswald-Bold | 13pt | ink-black | Right | 1 | Never truncate |
| Instability (D20 N) | Oswald-Bold | 10pt | faction color 80% | Left | 1 | Never truncate |

### Letterpress Effect (apply to all text)

| Property | Value |
|----------|-------|
| Shadow offset | x=0, y=0.5pt |
| Shadow blur | 0.5pt |
| Shadow color (light) | parchment-dark at 60% opacity |
| Shadow color (dark) | parchment-dark-mode at 60% opacity |
| Line height (ability) | 1.3× |
| Line height (all other) | 1.2× |

Do NOT use system drop shadow. Render text twice: shadow pass +0.5pt down, then normal pass on top.

---

## STATE TRANSITIONS

Physical metaphor: heavy card with inertia. Weighted, not snappy.

| Transition | Duration | Curve | What animates |
|-----------|---------|-------|---------------|
| `default` → `focused` | 0.18s | easeOut | Shadow 4→12pt, Y -2pt, scale 1.0→1.02 |
| `focused` → `default` | 0.25s | spring(0.4, 0.7) | Reverse |
| `default` → `selected` | 0.12s | easeIn | Scale 1.0→0.97, glow 0→0.8 |
| `selected` → `default` | 0.3s | spring(0.35, 0.65) | Reverse + bounce |
| `default` → `tapped` | 0.35s | easeInOut | Y-axis rotate 0→90° (phase 1 of flip) |
| `default` → `previewed` | 0.28s | easeOut | Scale up, background dim 0→0.7 |
| `previewed` → `default` | 0.22s | easeIn | Reverse |
| `default` → `inGraveyard` | 0.6s | easeIn | Saturation 1→0, brightness -0.15, Y +20pt |
| `default` → `summoning` | 0.0s | — | Trigger ink spread shader |
| `summoning` → `default` | 0.4s | easeOut | Shader opacity 0→1 |
| `default` → `damaged` | 0.08s | easeIn | Torn overlay 0→0.6, shake |

### Card Flip (tapped state — two phases)
- Phase 1: easeIn 0.17s — rotate 0→90°, swap face at 90°
- Phase 2: easeOut 0.18s — rotate -90°→0°

### Shake (damaged state)
- x values: `[0, -6, 5, -4, 3, -2, 1, 0]`
- Duration: 0.4s, easeOut

### Card Preview Gesture
- Long press minimum: 0.35s
- Background: 70% black + `.systemUltraThinMaterial`
- Dismiss: tap outside OR swipe down >40pt, 0.22s easeIn

### Card Drag Constants
- Resistance: 0.72
- Rotation: `translation.width * 0.025` degrees
- Release spring: response 0.38, damping 0.62

### Parallax Offsets
- Foreground: tilt × 10pt
- Background: tilt × -6pt
- Tilt clamp: ±0.6 radians
- CMMotionManager interval: 1/60s

---

## GESTURE PRIORITY ORDER

1. `.highPriorityGesture` — LongPressGesture(minimumDuration: 0.35) → `.previewed`
2. `.gesture` — DragGesture(minimumDistance: 8) → reposition
3. `.simultaneousGesture` — TapGesture() → `.selected`

---

## CARD BACK

| Property | Value |
|----------|-------|
| Base | canvas-warm + canvas texture |
| Center seal | 40pt diameter, wax-red, game sigil |
| Border | 3pt, parchment-mid (same as common) |
| Corner radius | 12pt |
| Content | None |

---

## ERROR FALLBACKS

| Failure | Fallback |
|---------|---------|
| Artwork load fails | Canvas-warm rect + procedural ink-wash + quill icon (game-icons.net) |
| Font load fails | Georgia for Cinzel, Times New Roman for EB Garamond. Never SF. |
| Metal unavailable | `staticOnly` effect tier |
| Card JSON parse error | Torn-edge placeholder, "???" for all text |
| Shader compile fails | Log to `Logs/shader_errors.log`, flat parchment-light + standard shadow |

Never show blank white or black rectangle.

---

## SHADER PARAMETER VALUES

### CardCondition → Uniforms

| Condition | brushRoughness | varnishGloss | parchmentAge |
|-----------|--------------|-------------|-------------|
| mint | 0.3 | 0.8 | 0.0 |
| played | 0.55 | 0.5 | 0.3 |
| worn | 0.75 | 0.25 | 0.65 |
| ancient | 0.95 | 0.1 | 1.0 |

### Rarity → Uniforms

| Rarity | foilIntensity | glowIntensity |
|--------|-------------|-------------|
| common | 0 | 0 |
| uncommon | 0.3 | 0 |
| rare | 0.6 | 0.5 |
| epic | 0.8 | 0.75 |
| legendary | 1.0 | 1.0 |

---

## ASSET GENERATION

### Service by Card Type

| Card Type | Service |
|-----------|---------|
| Creature (any faction) | Custom LoRA via Replicate |
| Spell, stabilizer, planar ruin (any faction) | fal.ai — FLUX.1 Dev |
| Neutral planar ruin | fal.ai — no faction style suffix |

Faction drives the style suffix injected into every prompt — see Section 3.1 for full faction artist table and `Scripts/prompt_utils.py` for `FACTION_CREATURE_STYLE` and `FACTION_NONCREATURE_STYLE` dicts.

### Faction Artist Reference

| Faction | Artists | Doré body of work |
|---------|---------|------------------|
| ironwright | Piranesi (*Carceri*) + Martin illustrators | — |
| fey | Rackham + Dulac | — |
| demonic | Bosch (alone) | — |
| celestial | Doré + Blake | *Paradise Lost* / *Paradiso* — warm, upward, radiant |
| endless | Doré + Goya | *Inferno* / *Divine Comedy* — cold, downward, desolate |

**Doré disambiguation:** Always specify the work in the prompt, never just "Gustave Doré style."

### Sub-Faction Visual Modifiers

Sub-faction appends a secondary style suffix after the faction suffix. Always pass both `faction` and `sub_faction` to `build_creature_prompt()` and `build_noncreature_prompt()`.

| Sub-Faction | Faction | Key visual identifiers |
|-------------|---------|----------------------|
| foundryDirectorate | ironwright | Reactor-blue light, poured concrete, exposed rebar, geometric, no ornamentation |
| scrapLegions | ironwright | Asymmetric mismatched parts, warning-orange rust, sparking wiring, patchwork |
| verdantThrone | fey | Bioluminescent green markings, flowering antlers, bark-skin, warm canopy light |
| hollowCourt | fey | Frost-crown, bare bone, solid black eyes with starlight pupils, winter midnight |
| furnaceLords | demonic | Magma through cracked obsidian skin, volcanic glass horns, caldera background |
| obsidianBureaucracy | demonic | Formal black robes, ink-stained hands, chains as mantle, reddish lamplight, too-many-eyes |
| knightsOfDeliverance | celestial | Gold-ivory plate, divine blue tabard, soft golden halo, formation geometry |
| heavensChosen | celestial | Concentric burning wheels, open eyes covering surface, six wings of fire, reality warping |
| necromanticCabals | endless | Tattered scholarly robes, finger-bone crown, cold teal eye-socket glow, bone cathedral |
| lostSpectres | endless | Translucent flickering form, hair drifting upward, broken chain, fog-choked battlefield |

**Ironwright guard:** All Ironwright prompts must include `NOT steampunk, no brass, no gears, no steam, no clockwork` — this is already in `FACTION_CREATURE_STYLE["ironwright"]` but double-check it survives string concatenation.

### Evolution Art Pipeline

Each tier's artwork is generated from the **immediately preceding tier** — never from the Common base.

**File naming:** `Resources/CardArt/{card_uuid}_{tier}.png`

| Step | Source file | Target file | img2img strength |
|------|-------------|-------------|-----------------|
| Common → Uncommon | `{uuid}_common.png` | `{uuid}_uncommon.png` | 0.55 |
| Uncommon → Rare | `{uuid}_uncommon.png` | `{uuid}_rare.png` | 0.60 |
| Rare → Epic | `{uuid}_rare.png` | `{uuid}_epic.png` | 0.65 |
| Epic → Legendary | `{uuid}_epic.png` | `{uuid}_legendary.png` | 0.70 |

Order evolutions → lower end of strength range. Chaos evolutions → upper end.

**Evolution direction prompt modifiers:**
- Order: `more structured, crystalline, refined, armor hardens, light brightens, elegant patterns emerge`
- Chaos: `wilder, more distorted, more powerful, forms crack and reshape, energy leaks at edges`

**After every evolution:** update `card.artworkLineage` (append prior asset name), update `card.artworkAssetName`, log to `Logs/evolution_log.md`.

**Continuity failure:** if subject unrecognizable → reduce strength by 0.05 and retry. If still failing at 0.45 → do NOT fall back to Common — flag as human-review item in iteration log.

### fal.ai Constants

| Property | Value |
|----------|-------|
| Model | `fal-ai/flux/dev` |
| Env var | `FAL_KEY` |
| Steps | 28 |
| Guidance scale | 3.5 |
| Image size | `square_hd` (1024×1024) |
| Cost | ~$0.025–0.04 per image |

### LoRA Constants

| Property | Value |
|----------|-------|
| R2 URL | `https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors` |
| Env var | `LORA_URL` |
| Base model | `stability-ai/sdxl:39ed52f2319f9b723b1b4ed18b9edd6f78c97bcf8d4e2b70e72a3a449673f77` |
| Steps | 35 |
| Guidance | 7.5 |
| Scheduler | DPMSolverMultistep |
| Size | 1024 × 1024 |
| Default scale | 0.85 |

### LoRA Scale Tuning

| Scale | Effect |
|-------|--------|
| 0.6–0.7 | Subtle impasto, more prompt flexibility |
| 0.8–0.9 | Strong brushwork — recommended default (0.85) |
| 1.0+ | Maximum influence, may distort anatomy |

If anatomy distorts at 0.85 → try 0.7 → then switch to fal.ai FLUX.1 Dev.

### Replicate Failure Handling

| Failure | Response |
|---------|----------|
| R2 unreachable | Stop — diagnose before generating |
| HTTP 429 | Wait 30s, retry once, then fal.ai |
| Cold start timeout | Retry immediately |
| Empty output | Log, skip, count against retry budget |
| Output URL expired (~1hr) | Download immediately, never store URL |
| extra_lora fetch error | Verify R2 URL publicly readable |

Cost: ~$0.04–0.07 per generation. Max retries per asset: 2 total, then move on.

---

## BUDGET ALLOCATION

| Category | % | Service |
|----------|---|---------|
| Creature artwork | 35% | LoRA via Replicate |
| Non-creature artwork | 25% | fal.ai FLUX.1 Dev |
| Artwork iterations | 15% | fal.ai or SDXL via Replicate |
| Layer segmentation | 15% | Replicate REMBG |
| Texture generation | 5% | fal.ai FLUX.1 Dev |
| Reserve | 5% | — |

---

## HAPTIC VOCABULARY

| Interaction | Implementation | AHAP file |
|-------------|--------------|-----------|
| Card pick up | `UIImpactFeedbackGenerator(.light)` | — |
| Card set down | `UIImpactFeedbackGenerator(.medium)` | — |
| Card flip | Transient 0.4 @ 0.0s + transient 0.8 @ 0.35s | `card_flip.ahap` |
| Wax seal tap | `UIImpactFeedbackGenerator(.heavy)` | — |
| Card summon | Continuous 0→0.8→0.3 over 0.4s | `card_summon.ahap` |
| Card to graveyard | Fade 0.6→0 over 0.7s | `card_graveyard.ahap` |
| Foil reveal (rare) | Irregular transients 20–80ms over 1.5s | `foil_shimmer.ahap` |
| Epic reveal | Deep continuous 0→0.7→0.4 over 0.6s + shimmer 1.2s | `epic_reveal.ahap` |
| Legendary reveal | Burst 1.0 @ 0.1s + shimmer 1.5s | `legendary_reveal.ahap` |
| Invalid action | `UINotificationFeedbackGenerator(.error)` | — |
| Text scroll | `UISelectionFeedbackGenerator` | — |

All haptics: log as `⚠️ PENDING PHYSICAL DEVICE VERIFICATION` — cannot self-verify on simulator.

---

## SOUND VOCABULARY

| Interaction | Sound | Duration |
|-------------|-------|---------|
| Card pick up | Cardstock flex, paper rustle | ~120ms |
| Card set down | Crisp cardstock landing | ~80ms |
| Card flip | Whoosh (80ms) + thud (50ms) | ~350ms total |
| Wax seal tap | Dampened thud | ~100ms |
| Card summon | Ink stroke → thrum | ~600ms |
| Card to graveyard | Paper crumple | ~700ms |
| Rare foil reveal | Shimmer + subtle ring | ~400ms |
| Epic reveal | Deep resonant tone + crystalline shimmer | ~700ms |
| Legendary reveal | Orchestral brush + full shimmer | ~1000ms |
| Card drag | Paper friction loop | Looped |
| Ambient | Low room tone | Looped |

Processing: normalize to -12 LUFS, trim silence, convert to `.caf` via `afconvert`.
Implementation: `AVAudioEngine` + preloaded buffers. Never `AVAudioPlayer`. Session: `.ambient`.

---

## PARTICLE SYSTEMS

| Rarity | Particle | Birth rate | Lifetime | Size | Color | Blend |
|--------|---------|-----------|---------|------|-------|-------|
| Common | None | — | — | — | — | — |
| Uncommon | Dust motes | 2/s | 4s | 2–4pt | parchment-light 30% | .alpha |
| Rare | Gold leaf flakes | 5/s | 3s | 6–10pt | aged-gold 70% | .alpha |
| Epic | Slow amethyst embers | 8/s | 3.5s | 4–8pt | epic-amethyst→clear | .alpha |
| Legendary | Ember sparks | 14/s | 2s | 3–6pt | legendary-ember→clear | .alpha |

Always `.alpha` blend — additive looks digital. Birth region: art box area only.

---

## EFFECT TIERS

| Tier | When active | What runs |
|------|------------|-----------|
| `full` | Metal + motion + Reduce Motion off | All shaders + parallax + particles + haptics |
| `shimmerOnly` | Metal OK, motion unavailable | Shaders only, no parallax |
| `staticOnly` | Metal unavailable | Core Animation only |
| `minimal` | Reduce Motion enabled | Crossfades only |

`staticOnly` must still look premium via parchment texture + typography alone.

---

## CARD SIZING BY CONTEXT

| Context | iPhone compact | iPad portrait | iPad landscape |
|---------|--------------|--------------|----------------|
| In hand | 95 × 133pt | 130 × 182pt | 110 × 154pt |
| Selected | 160 × 224pt | 210 × 294pt | 180 × 252pt |
| Previewed | 270 × 378pt | 340 × 476pt | 300 × 420pt |

GeometryReader formula:
- iPhone: `min(availableWidth * 0.85, 320)`
- iPad: `min(availableWidth * 0.55, 500)`
- Height always: `width * (294.0 / 210.0)`

---

## ACCESSIBILITY — WCAG AA CONTRAST

| Text | Background | Required | Fix if failing |
|------|-----------|---------|----------------|
| ink-black | parchment-light | 4.5:1 | Lighten to max #F0DFC0 |
| parchment-dark | parchment-light | 3:1 (large text) | Verify at flavor text size |
| ink-dark-mode | parchment-dark-mode | 4.5:1 | Verify dark mode |

Reduce Motion — disable: parallax, particles, ink spread, foil shimmer, all spring animations → crossfades.

---

## PERFORMANCE TARGETS

| Metric | Target | Hard limit | Device |
|--------|--------|-----------|--------|
| GPU frame time (effects on) | <5ms | <8ms | iPhone 12 |
| GPU frame time (effects on) | <3ms | <5ms | iPhone 15 Pro |
| GPU frame time (staticOnly) | <2ms | <4ms | iPhone 12 |
| Draw calls per frame | <40 | <80 | All |
| Texture memory (7 cards) | <80MB | <120MB | iPhone 12 |
| App launch → first card | <1.5s | <2.5s | All |
| State transition | <200ms | <350ms | All |
| SpriteKit particles | <3ms | <5ms | iPhone 12 |
| Total memory (7 cards + effects) | <160MB | — | iPhone 12 |
| Peak memory | <800MB | — | iPhone 12 |
| Initial download | <200MB | — | App Store |

Instruments order (human runs in Xcode): Core Animation → GPU Frame Capture → Metal System Trace → Memory. Agent runs `xctrace` CLI for launch time and CPU; flags GPU/Metal profiling for human. See Section 13.1 for human profiling checklist template.

---

## REQUIRED SIMULATORS (all four)

| Simulator | Chip | Purpose |
|-----------|------|---------|
| iPhone 15 Pro | A17, 120Hz | Quality ceiling |
| iPhone 12 | A14, 60Hz | Performance floor |
| iPad Pro 12.9" 6th gen | M2 | Stage Manager |
| iPad Air 5th gen | M1 | iPad performance floor |

---

## PIPELINE SEQUENCE (ordered — respect dependencies)

| Step | Task | Gate |
|------|------|------|
| 1 | Lock deployment parameters → iteration log | — |
| 2 | `bash Scripts/verify_environment.sh` → all ✓ before continuing (§4.1) | — |
| 3 | Generate procedural assets (foil gradient, wax normal, brush normal) | — |
| 4 | Source + prepare parchment/canvas → asset catalog | — |
| 5 | Schema + 5 test JSON cards (one per rarity, ≥3 factions) | — |
| **6** | **Smoke test — all 4 simulators** | **⛔ HARD GATE: user sign-off** |
| 7 | Static card layout (correct proportions, both size classes) | — |
| 8 | Typography pass (all text to spec, letterpress) | — |
| 9 | Parchment shader | — |
| 10 | Generate + color grade test artwork | — |
| 11 | Art box compositing (oil paint shader + vignette + AO) | — |
| 12 | Foil shader + CMMotionManager | — |
| 13 | State transition animations | — |
| 14 | SpriteKit particles | — |
| 15 | Wax seal component | — |
| 16 | Card back + flip animation | — |
| 17 | Error/fallback states | — |
| 18 | HapticEngine (log all as pending) | — |
| 19 | SoundEngine (preload all sounds) | — |
| 20 | iPad layout (size classes, Stage Manager, split view) | — |
| 21 | Dark mode pass | — |
| 22 | Accessibility pass | — |
| 23 | Performance — agent: xctrace CLI; human: Instruments GPU/Metal | — |
| 24 | Visual regression baseline → commit | — |
| **25** | **Haptic verification** | **⛔ HARD GATE: physical device with user** |

---

## EXIT CRITERIA CHECKLIST

- [ ] All critique axes ≥4, all 4 devices, light AND dark mode
- [ ] Visual regression diff <0.025, all 4 device screenshots
- [ ] All 9 card states render without error on all 4 simulators
- [ ] Card back correct, flip animation clean
- [ ] Error fallback states verified (artwork fail, font fail)
- [ ] xctrace CLI: launch time within target (agent)
- [ ] ⚠️ HUMAN: Instruments GPU Frame Capture — frame time <8ms iPhone 12, <5ms iPhone 15 Pro
- [ ] ⚠️ HUMAN: Instruments Core Animation — no off-screen rendering (red highlights)
- [ ] Agent debug audit: no shouldRasterize violations during animation (Section 13.1)
- [ ] All haptics: `⚠️ PENDING PHYSICAL DEVICE VERIFICATION`
- [ ] VoiceOver: no gaps (Accessibility Inspector)
- [ ] All text contrast: WCAG AA (Accessibility Inspector)
- [ ] Dynamic Type: card usable at all sizes
- [ ] Reduce Motion: static card looks premium
- [ ] Dark mode: candlelit manuscript feel
- [ ] License manifest entry for every asset
- [ ] Artwork color grading verified per faction:

| Faction | Highlights | Shadows | Disqualifier |
|---------|-----------|---------|-------------|
| Ironwright | Ochre-warm (#C8A951 range) | Near-black, rust tinge | Any blue highlights |
| Fey | Silver-moonlit (cool but not cold) | Deep forest green-black | Jewel tones washed out |
| Demonic | Dark crimson-warm | Near-black, red cast | Any clean whites |
| Celestial | Gold-white radiance | Warm mid-grey | Flat or cool highlights |
| Endless | Bone-white | Cold grey-black | Warm tones in shadows |
- [ ] iPad layout meaningful — not scaled iPhone

---

## STRUCTURED CRITIQUE AXES (score 1–5 each iteration)

| Axis | Question |
|------|---------|
| Material believability | Reads as physical parchment/oil paint/wax? |
| Color temperature | Warm enough? Sepia-shifted? |
| Texture grain | Visible but not distracting? |
| Typography letterpress | Ink bleed, weight, warmth visible? |
| Lighting consistency | All elements lit from same upper-left source? |
| Tactile impression | Does it feel touchable? |
| iPad vs iPhone | Larger canvas used meaningfully? |
| Dark mode | Candlelit manuscript, not inverted? |

All axes ≥4 before proceeding. One fix per loop. Three fails on same gap → blocked.

---

## VISION REFERENCES

| Component | URL | What to extract |
|-----------|-----|----------------|
| Oil paint | `https://upload.wikimedia.org/wikipedia/commons/4/4d/Rembrandt_-_The_Anatomy_Lesson_of_Dr_Nicolaes_Tulp.jpg` | Warm reflected darks, canvas grain in thin highlights |
| Letterpress | `https://upload.wikimedia.org/wikipedia/commons/1/1b/KellsFol034rChiRhoMonogram.jpg` | Ink bleed into fiber, ground tone warmth |
| Wax seal | `https://commons.wikimedia.org/wiki/Category:Wax_seals` | Edge translucency, single offset specular |
| Parchment | `https://polyhaven.com/a/parchment_paper` | Roughness map: catch vs absorb light |
| Aged gold | `https://en.wikipedia.org/wiki/Gold_leaf` | Directional grain, tonal variation |

---

---

## NON-CREATURE CARD LAYOUTS

| Zone | Creature | Spell | Stabilizer | Planar Ruin |
|------|----------|-------|------------|-------------|
| Name bar | ✓ `N ⊕` right-aligned | ✓ `N ⊕` right-aligned | ✓ **no cost indicator** | ✓ `N ⊕` right-aligned (no label) |
| Art box | ✓ | ✓ | ✓ still-life | ✓ full-art (bleeds to edges) |
| Type line | "Creature — [type]" | "Spell — [subtype]" | "Stabilizer" | "Planar Ruin" |
| Faction icon | ✓ | ✓ | ✓ | Omit if neutral |
| Text box | 88pt | 107pt (expanded) | 107pt (expanded) | Passive + Destroyed panels |
| Stats bar | ATK / HP + D20 N | **Omit** | **Omit** | HP only (cost×3+1) |
| Wax seal | ✓ | **Omit** | ✓ | Omit if neutral; faction color if evolved |
| Instability badge | ✓ | **Omit** | **Omit** | **Omit** |
| Indestructible icon | **Omit** | **Omit** | `lock.fill` SF Symbol, 10pt, parchment-mid 70%, bottom-right of art box | **Omit** |

---

## KEY FILE LOCATIONS

| File | Purpose |
|------|---------|
| `docs/CARD_DESIGN_GUIDE.md` | Full guide — authoritative |
| `docs/CARD_DESIGN_QUICKREF.md` | This file — lookup only |
| `Resources/TestCards/test_cards.json` | 5 test cards for pipeline smoke test |
| `Resources/Icons/set_symbol.png` | Game set symbol |
| `Resources/Icons/faction_ironwright.png` | Ironwright faction icon |
| `Resources/Icons/faction_fey.png` | Fey Courts faction icon |
| `Resources/Icons/faction_demonic.png` | Demonic Kingdoms faction icon |
| `Resources/Icons/faction_celestial.png` | Celestial Crusade faction icon |
| `Resources/Icons/faction_endless.png` | The Endless faction icon |
| `Resources/Icons/chaos_mote_symbol.png` | Single 20×20pt chaos mote cost icon used in `N ⊕` name bar display |
| `Resources/Icons/instability_d20.png` | D20 instability badge icon |
| `Logs/MASTER_STATE.json` | Current phase, task queue, budget |
| `Logs/iteration_log.md` | Per-iteration log + critiques |
| `Logs/CONFLICTS.md` | Guide conflicts + resolutions |
| `Logs/BUDGET_LEDGER.md` | Every API call with cost |
| `Resources/ASSET_LICENSE_MANIFEST.md` | Every asset + license |
| `Resources/Haptics/` | card_flip, card_summon, card_graveyard, foil_shimmer, epic_reveal, legendary_reveal .ahap |
| `Resources/Sounds/` | All interaction sounds .caf |
| `Sources/Shaders/OilPaintShader.metal` | Artwork shader |
| `Sources/Shaders/ParchmentShader.metal` | Card body shader |
| `Sources/Shaders/WarmFoilShader.metal` | Foil shader |
| `Sources/Shaders/InkSpreadKernel.metal` | Summon compute shader |
| `Sources/Haptics/HapticEngine.swift` | Haptic service |
| `Sources/Audio/SoundEngine.swift` | Audio service |
| `Sources/Effects/WaxSealView.swift` | Wax seal component |
| `Scripts/verify_environment.sh` | Master env check — tools, simulators, API keys, Python libs (§4.1) |
| `Scripts/download_fonts.sh` | Font acquisition via homebrew-cask-fonts or GitHub mirrors (§4.7) |
| `Scripts/grade_artwork.sh` | Color grading pipeline |
| `Scripts/screenshot_all_devices.sh` | 4-device screenshot capture |
| `Scripts/compare_screenshots.py` | Visual regression diff |
| `Scripts/verify_asset.py` | Asset verification — dimensions, warm tone, no error payload (see §5.7) |
| `Scripts/download_textures.sh` | Polyhaven texture download (see §4.4) |

---

## REVISION LOG

| Date | Change |
|------|--------|
| 2026-02-21 | `N ⊕` unified cost display replaces tiled dot system (owner-approved) |
| 2026-02-21 | Updated iPad card sizing from 0.40/350pt to 0.55/500pt based on iOS card game UI research. iPhone cap updated from 260pt to 320pt. Collection grid iPad minimum updated to 160pt. Research found original 40% spec produced only 34% effective width on 13" iPad; industry standard is 50-65%. |

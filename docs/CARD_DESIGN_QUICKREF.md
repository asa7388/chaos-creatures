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

Faction token colors are **reserved** — not used for runtime tinting. Faction identity is expressed through the wax seal's embossed symbol.

| Faction | Token | Embossed Symbol on Wax Seal |
|---------|-------|---------------------------|
| Demonic Kingdoms | `wax-red` | Scroll with curled ends |
| Fey Courts | `fey-teal` | Gnarled ancient tree |
| Ironwright Collective | `antique-silver` | Sledgehammer |
| Celestial Crusade | `aged-gold` | Single angelic wing |
| The Endless | `rot-moss` | Human skull, front-facing |

Wax color is driven by **rarity** (parchment-tan → silver → gold → amethyst → ember-red), not faction.

---

## CARD LAYOUT — Full-Art Dossier (210 × 294pt reference, 5:7 ratio)

```
ZStack layers (bottom → top):
  1. CardBacklightView        rarity glow behind card
  2. Artwork image             fills inner area (202×286pt), corner radius 9pt
  3. Art vignette gradient     bottom 40% darkening (clear → black 45%)
  4. CardDossierTextView       labeled fields, bottom-anchored
  5. WaxSealView               Rank Emblem, bottom-right, 34×34pt

ParchmentShader ragged edge applies to entire card container.
No zones. No border overlay. No decorative frame PNG.
```

### Front-Face Text Fields (Yeseva One, all left-aligned, 8pt from inner edge)

| Field | Size | Opacity | Notes |
|-------|------|---------|-------|
| Name | 13pt | 100% | Primary identification |
| Field labels | 8pt | 70% | Smaller, recedes |
| Type / Faction | 10pt | 90% | |
| Abilities | 10pt | 90% | Summary only, no descriptions |
| Modifiers | 10pt | 90% | Names only, no effects |
| Cost / ATK / HP | 11pt | 100% | Single line, plain numbers |
| Instability | 10pt | 90% | Plain number |

### Rarity Backlight (CardBacklightView — §6.6c)

Sits **behind** the card in ZStack. A blurred radial gradient that bleeds past the card edges, creating the illusion of colored light from behind the card. Steady at idle, brightens on interaction.

| Rarity | Color token | Idle opacity | Interaction opacity | Blur radius | Edge bleed |
|--------|------------|-------------|-------------------|------------|-----------|
| Common | `parchment-light` | 0.18 | 0.32 | 28pt | 24pt |
| Uncommon | `antique-silver` | 0.28 | 0.48 | 30pt | 26pt |
| Rare | `aged-gold` | 0.38 | 0.60 | 34pt | 28pt |
| Epic | `epic-amethyst` | 0.50 | 0.72 | 38pt | 32pt |
| Legendary | `legendary-ember` | 0.60 | 0.85 | 42pt | 36pt |

- **Interaction trigger:** `.focused` or `.selected` card state
- **Brighten:** 0.18s easeOut
- **Settle:** spring(response: 0.4, dampingFraction: 0.7)
- **Reduce Motion:** animation disabled, idle glow stays static
- **CRITICAL:** CardView ZStack must NOT be clipped — the bleed is intentional

### Faction Icons (wax seal embossing only)

Faction icons are embossed into the wax seal. They do **not** appear as standalone elements on the card face.

| Faction | Icon | Asset |
|---------|------|-------|
| Demonic Kingdoms | Scroll with curled ends | `faction_demonic.png` (silhouette, used as embossing reference) |
| Fey Courts | Gnarled ancient tree | `faction_fey.png` |
| Ironwright Collective | Sledgehammer | `faction_ironwright.png` |
| Celestial Crusade | Single angelic wing | `faction_celestial.png` |
| The Endless | Human skull, front-facing | `faction_endless.png` |

Wax seal assets are pre-generated as 25 faction×rarity PNGs in `Assets.xcassets/Icons/Seals/`. Naming: `seal_[faction]_[rarity]`. See `WAX_SEAL_OVERHAUL_BRIEF.md`.

---

## TYPOGRAPHY

### Front Face — Yeseva One (sole card font)

| Property | Value |
|----------|-------|
| File | YesevaOne-Regular.ttf (OFL, Google Fonts) |
| Fallback | Georgia Bold |
| Shadow | x=0, y=1pt, blur 2pt, black 80% |
| Line spacing | 1.4× |

### Back Face — IM Fell English

| Property | Value |
|----------|-------|
| Files | IMFellEnglish-Regular.ttf, IMFellEnglish-Italic.ttf (OFL) |
| Fallback | Georgia / Georgia Italic |
| Shadow | x=0, y=0.5pt, blur 0.5pt, parchment-dark 60% |

### Text Element Specs

| Element           | Font            | Size | Color              |
|-------------------|-----------------|------|--------------------|
| Card name (front) | Yeseva One      | 13pt | parchment-light    |
| Labels (front)    | Yeseva One      | 8pt  | parchment-light 70%|
| Values (front)    | Yeseva One      | 10pt | parchment-light 90%|
| Stats (front)     | Yeseva One      | 11pt | parchment-light    |
| Report body (back)| IM Fell English | 10pt | ink-black          |
| Report label(back)| IM Fell English | 9pt  | ink-black          |
| Flavor text (back)| IM Fell Italic  | 10pt | parchment-dark     |
| Faction hdr (back)| IM Fell English | 8pt  | parchment-dark 60% |

### Retired Fonts

RETIRED from card faces: Cinzel, EBGaramond, Oswald
(kept for SpriteKit battle scene + non-card UI only)

---

## STATE TRANSITIONS

Physical metaphor: heavy card with inertia. Weighted, not snappy.

| Transition | Duration | Curve | What animates |
|-----------|---------|-------|---------------|
| `default` → `focused` | 0.18s | easeOut | Shadow 4→12pt, Y -2pt, scale 1.0→1.02 |
| `focused` → `default` | 0.25s | spring(0.4, 0.7) | Reverse |
| `default` → `selected` | 0.12s | easeIn | Scale 1.0→0.97, backlight brightens |
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

## CARD BACK — Intelligence Report

Layers: parchment panel (parchment-panel.imageset) + scrollable content
Font: IM Fell English (Regular + Italic)
Shadow: x=0, y=0.5pt, blur 0.5pt, parchment-dark 60%

Content (top → bottom):

| Element | Size | Color | Notes |
|---------|------|-------|-------|
| Faction name header | 8pt | 60% opacity | Centered |
| "Abilities:" label | 9pt | ink-black | |
| [Keyword]: [desc] | 10pt | ink-black | Keyword in italic |
| "Modifiers:" label | 9pt | ink-black | |
| [Name]: [effect] | 10pt | ink-black | |
| Divider | 0.5pt | parchment-mid | Hairline |
| "[Flavor text]" | 10pt italic | parchment-dark | Quoted |
| Game sigil | — | — | DEFERRED |

Scrolling: momentum, no indicators, content clips to inner area
Ragged edge: same ParchmentShader treatment as front face

### Card Type Back Variants

| Type | Content order |
|------|--------------|
| Creature | Abilities → Modifiers → Flavor |
| Spell | Abilities (full) → Flavor |
| Stabilizer | Abilities (passive) → Flavor |
| Planar Ruin | Passive → Destroyed → Modifiers → Flavor |

---

## ERROR FALLBACKS

| Failure | Fallback |
|---------|---------|
| Artwork load fails | Canvas-warm rect + procedural ink-wash + quill icon (game-icons.net) |
| Font load fails | Georgia Bold for Yeseva One, Georgia/Georgia Italic for IM Fell English. Never SF. |
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

### Ragged Edge Uniforms (ParchmentShader)

| Condition | edgeRaggedStrength | edgeWidth |
|-----------|-------------------|-----------|
| mint      | 0.15              | 0.04      |
| played    | 0.35              | 0.06      |
| worn      | 0.60              | 0.08      |
| ancient   | 0.85              | 0.12      |

| Property | Value |
|----------|-------|
| edgeSeed | Derived from card UUID (deterministic per card) |
| fbm noise | 3–4 octaves, uv * 8.0 + edgeSeed |
| Alpha | smoothstep(0.0, displacedEdge, distFromEdge) |
| Darkening | 40% at very edge (material thinning) |

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

Always `.alpha` blend — additive looks digital. Birth region: full card interior only.

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
- iPhone: `min(availableWidth * 0.85, 260)`
- iPad: `min(availableWidth * 0.40, 350)`
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
| 7 | Full-art dossier layout (ZStack, vignette, text overlay) | — |
| 8 | Typography pass (Yeseva One front, IM Fell English back) | — |
| 9 | ParchmentShader ragged edge (fbm noise, condition-driven) | — |
| 10 | Generate + color grade test artwork | — |
| 11 | Art compositing (full-bleed artwork + vignette gradient) | — |
| 12 | Foil shader + CMMotionManager | — |
| 13 | State transition animations | — |
| 14 | SpriteKit particles | — |
| 15 | Wax seal component | — |
| 16 | Card back (intelligence report) + flip animation | — |
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

## CARD TYPE — DOSSIER FIELD VISIBILITY

| Field        | Creature | Spell | Stabilizer | Planar Ruin |
|--------------|----------|-------|------------|-------------|
| Name         | ✓        | ✓     | ✓          | ✓           |
| Type/Faction | ✓        | ✓     | ✓          | ✓           |
| Abilities    | ✓        | ✓     | ✓          | ✓           |
| Modifiers    | ✓*       | —     | —          | ✓**         |
| Destroyed    | —        | —     | —          | ✓           |
| Cost         | ✓        | ✓     | —          | ✓           |
| ATK          | ✓        | —     | —          | —           |
| HP           | ✓        | —     | —          | ✓***        |
| Instability  | ✓*       | —     | —          | —           |
| Rank Emblem  | ✓        | —     | ✓          | ✓**         |
| Wax Seal     | ✓        | —     | ✓          | ✓**         |

```
* Omitted if Common (no modifiers) or 0 (instability)
** Only if faction-evolved
*** HP = cost × 3 + 1
```

---

## KEY FILE LOCATIONS

| File | Purpose |
|------|---------|
| `docs/CARD_DESIGN_GUIDE.md` | Full guide — authoritative |
| `docs/CARD_DESIGN_QUICKREF.md` | This file — lookup only |
| `docs/WAX_SEAL_OVERHAUL_BRIEF.md` | Wax seal + D20 generation pipeline |
| `Resources/TestCards/test_cards.json` | 5 test cards for pipeline smoke test |
| `Resources/Icons/set_symbol.png` | Game set symbol |
| `Resources/Icons/faction_ironwright.png` | Ironwright faction icon (silhouette — used for wax embossing) |
| `Resources/Icons/faction_fey.png` | Fey Courts faction icon |
| `Resources/Icons/faction_demonic.png` | Demonic Kingdoms faction icon |
| `Resources/Icons/faction_celestial.png` | Celestial Crusade faction icon |
| `Resources/Icons/faction_endless.png` | The Endless faction icon |
| `Sources/Views/CardDossierTextView.swift` | Front-face dossier text overlay |
| `Assets.xcassets/Icons/Seals/` | 25 wax seal imagesets — `seal_[faction]_[rarity].imageset` |
| `Logs/MASTER_STATE.json` | Current phase, task queue, budget |
| `Logs/iteration_log.md` | Per-iteration log + critiques |
| `Logs/CONFLICTS.md` | Guide conflicts + resolutions |
| `Logs/BUDGET_LEDGER.md` | Every API call with cost |
| `Resources/ASSET_LICENSE_MANIFEST.md` | Every asset + license |
| `Resources/Haptics/` | card_flip, card_summon, card_graveyard, foil_shimmer, epic_reveal, legendary_reveal .ahap |
| `Resources/Sounds/` | All interaction sounds .caf |
| `Sources/Shaders/OilPaintShader.metal` | Artwork shader |
| `Sources/Shaders/ParchmentShader.metal` | Ragged edge + parchment body shader |
| `Sources/Shaders/WarmFoilShader.metal` | Foil shader |
| `Sources/Shaders/InkSpreadKernel.metal` | Summon compute shader |
| `Sources/Haptics/HapticEngine.swift` | Haptic service |
| `Sources/Audio/SoundEngine.swift` | Audio service |
| `Sources/Effects/WaxSealView.swift` | Wax seal component (AI image + rarity glow) |
| `Scripts/verify_environment.sh` | Master env check — tools, simulators, API keys, Python libs (§4.1) |
| `Scripts/download_fonts.sh` | Font acquisition via homebrew-cask-fonts or GitHub mirrors (§4.7) |
| `Scripts/grade_artwork.sh` | Color grading pipeline |
| `Scripts/generate_wax_seals.py` | Generate 25 wax seal images via fal.ai |
| `Scripts/install_wax_seals.py` | Install generated seals into asset catalog |
| `Scripts/preview_wax_seal.py` | Preview seal at actual 34pt display size |
| `Scripts/download_wax_references.py` | Download Wikimedia Commons reference images |
| `Scripts/screenshot_all_devices.sh` | 4-device screenshot capture |
| `Scripts/compare_screenshots.py` | Visual regression diff |
| `Scripts/verify_asset.py` | Asset verification — dimensions, warm tone, no error payload (see §5.7) |
| `Scripts/download_textures.sh` | Polyhaven texture download (see §4.4) |

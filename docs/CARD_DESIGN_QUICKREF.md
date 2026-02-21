# Card Design Quick Reference
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
| `wax-red` | `#8B1A1A` | `0.537, 0.094, 0.082` | Red card type, wax seals |
| `wax-blue` | `#1A2E5C` | `0.086, 0.176, 0.353` | Blue card type |
| `wax-green` | `#1A3D1A` | `0.086, 0.235, 0.086` | Green card type |
| `aged-gold` | `#C8A951` | `0.776, 0.659, 0.306` | Rare frames, gold accents |
| `antique-silver` | `#9AA0A6` | `0.600, 0.624, 0.647` | Uncommon frames |
| `mythic-ember` | `#C85A1A` | `0.773, 0.341, 0.082` | Mythic gradient |
| `canvas-warm` | `#E8D5B0` | `0.906, 0.831, 0.686` | Backgrounds, card back |
| `parchment-dark-mode` | `#2A2015` | `0.161, 0.122, 0.071` | Dark mode card body |
| `ink-dark-mode` | `#E8D5A0` | `0.906, 0.831, 0.620` | Dark mode typography |

Swift: `Color(UIColor(displayP3Red: r, green: g, blue: b, alpha: 1))`

---

## CARD LAYOUT (210 × 294pt reference — always scale proportionally)

```
┌─────────────────────────────────┐
│ [outer border: 3pt all sides]   │
│ ┌─────────────────────────────┐ │
│ │ NAME BAR          [COST]    │ │  25pt tall
│ ├─────────────────────────────┤ │
│ │        ART BOX              │ │  132pt tall
│ ├─────────────────────────────┤ │
│ │ TYPE LINE      [SET SYMBOL] │ │  18pt tall
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
| Name bar | 4 | 4 | 202 | 25 | Cost symbols right-aligned |
| Art box | 4 | 29 | 202 | 132 | No corner radius |
| Art box vignette | 4 | 29 | 202 | 132 | 20pt feather fade all 4 edges |
| Type line | 4 | 161 | 202 | 18 | Set symbol right-aligned 14×14pt |
| Text box | 8 | 179 | 194 | 88 | 4pt internal padding |
| Ability/flavor divider | 12 | varies | 186 | 0.5 | parchment-mid hairline |
| Stats bar | 4 | 267 | 202 | 15 | ATK/DEF right-aligned |
| Rarity color bar | 4 | 282 | 202 | 4 | Bottom of inner area |
| Wax seal | 164 | 258 | 34 | 34 | Overlaps stats bar |

### Border Weight by Rarity

| Rarity | Border | Inner shadow | Outer glow | Frame |
|--------|--------|-------------|-----------|-------|
| Common | 3pt flat | None | None | Matte parchment-mid |
| Uncommon | 3.5pt | 1pt | None | Antique-silver gradient |
| Rare | 4pt | 2pt | 4pt, aged-gold, 40% | Aged-gold gradient |
| Mythic | 4pt | 2pt | 8pt, mythic-ember, 60% | Ember→gold animated |

### Mana Cost Symbols

| Property | Value |
|----------|-------|
| Size | 16 × 16pt |
| Spacing | 2pt between |
| Max displayed | 7 (overflow: "N+" text) |
| Right margin | 6pt from inner edge |
| Vertical | Centered in name bar |

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
| Oswald-Bold | ATK/DEF stats |

All 6 must be registered in Info.plist under `UIAppFonts` before use.

### Text Element Specs

| Element | Font | Size | Color | Align | Max lines | Overflow |
|---------|------|------|-------|-------|-----------|----------|
| Card name | Cinzel-Bold | 13pt | ink-black | Left | 1 | Scale to 10pt, truncate |
| Mana cost text | Cinzel-Regular | 10pt | ink-black | Right | 1 | Never truncate |
| Type line | Cinzel-Regular | 10pt | ink-black | Left | 1 | Scale to 8pt, truncate |
| Ability text | EBGaramond-Regular | 11pt | ink-black | Left | — | Scroll |
| Flavor text | EBGaramond-Italic | 10pt | parchment-dark | Left | — | Below ability |
| Keywords | EBGaramond-SemiBold | 11pt | ink-black | Left | — | Bold keyword only |
| Collector # | Cinzel-Regular | 7pt | parchment-mid | Left | 1 | Never truncate |
| Set code | Cinzel-Regular | 7pt | parchment-mid | Center | 1 | — |
| ATK/DEF | Oswald-Bold | 13pt | ink-black | Right | 1 | Never truncate |

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
| mythic | 1.0 | 1.0 |

---

## ASSET GENERATION

### Service by Card Type

| Card Type | Service |
|-----------|---------|
| Creature | Custom LoRA via Replicate |
| Spell / Instant | fal.ai — FLUX.1 Dev |
| Artifact | fal.ai — FLUX.1 Dev |
| Enchantment | fal.ai — FLUX.1 Dev |
| Land | fal.ai — FLUX.1 Dev |

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
| Mythic reveal | Burst 1.0 @ 0.1s + shimmer 1.5s | `mythic_reveal.ahap` |
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
| Mythic reveal | Orchestral brush + shimmer | ~1000ms |
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
| Mythic | Ember sparks | 14/s | 2s | 3–6pt | mythic-ember→clear | .alpha |

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
| 2 | Environment setup (simulators, CLI tools, font verification) | — |
| 3 | Generate procedural assets (foil gradient, wax normal, brush normal) | — |
| 4 | Source + prepare parchment/canvas → asset catalog | — |
| 5 | Schema + 3 test JSON cards | — |
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
- [ ] Artwork color grading verified vs parchment-light swatch
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

## KEY FILE LOCATIONS

| File | Purpose |
|------|---------|
| `docs/CARD_DESIGN_GUIDE.md` | Full guide — authoritative |
| `docs/CARD_DESIGN_QUICKREF.md` | This file — lookup only |
| `Logs/MASTER_STATE.json` | Current phase, task queue, budget |
| `Logs/iteration_log.md` | Per-iteration log + critiques |
| `Logs/CONFLICTS.md` | Guide conflicts + resolutions |
| `Logs/BUDGET_LEDGER.md` | Every API call with cost |
| `Resources/ASSET_LICENSE_MANIFEST.md` | Every asset + license |
| `Resources/Haptics/` | card_flip, card_summon, card_graveyard, foil_shimmer, mythic_reveal .ahap |
| `Resources/Sounds/` | All interaction sounds .caf |
| `Sources/Shaders/OilPaintShader.metal` | Artwork shader |
| `Sources/Shaders/ParchmentShader.metal` | Card body shader |
| `Sources/Shaders/WarmFoilShader.metal` | Foil shader |
| `Sources/Shaders/InkSpreadKernel.metal` | Summon compute shader |
| `Sources/Haptics/HapticEngine.swift` | Haptic service |
| `Sources/Audio/SoundEngine.swift` | Audio service |
| `Sources/Effects/WaxSealView.swift` | Wax seal component |
| `Scripts/generate_artwork.sh` | LoRA generation |
| `Scripts/grade_artwork.sh` | Color grading pipeline |
| `Scripts/screenshot_all_devices.sh` | 4-device screenshot capture |
| `Scripts/compare_screenshots.py` | Visual regression diff |

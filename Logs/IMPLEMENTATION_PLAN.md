# Implementation Plan — Chaos Creatures Design Overhaul
Date: 2026-02-21

---

## Decisions Required Before Starting

These items must be resolved by the owner before any agent can begin Phase 2 and beyond. No implementation work should start on the blocked areas until each decision is recorded in `Logs/DEPENDENCY_DECISIONS.md`.

---

**DECISION 1 — CardFrameView Architecture (HIGHEST PRIORITY BLOCKER)**

The existing `CardFrameView.swift` (1,986 lines) uses a full-art-bleed design with overlaid stat badges. The `docs/CARD_DESIGN_GUIDE.md` Section 1.4 mandates a zone-stack layout (Name Bar → Art Box → Type Line → Text Box → Stats Bar → Rarity Color Bar). These two designs are architecturally incompatible. It is not possible to migrate one to the other incrementally.

Option A — Adopt the guide's zone-stack layout. CardFrameView requires a complete rewrite (~1,000+ lines replaced). All downstream views that depend on `CardDisplaySize`, `ATKBadgeView`, `HPBadgeView`, and `CMBadgeView` must be updated.

Option B — Retain the existing full-art-bleed design as the canonical card face. The guide's Section 1.4 zone measurements and Sections 1.5b card-type variant specs are superseded. The guide must be updated to reflect the existing implementation. Agents will work on other gaps (Metal shaders, color palette, state machine, accessibility) while keeping the current layout structure.

⛔ DECISION GATE — Owner must approve Option A or Option B before Phase 2 begins. Record the decision in `Logs/DEPENDENCY_DECISIONS.md`.

---

**DECISION 2 — Typography Font Set**

`CLAUDE.md` specifies Cinzel + Alegreya as the decided fonts. The `docs/CARD_DESIGN_GUIDE.md` Section 1.5 mandates Cinzel + EBGaramond + Oswald. The implemented codebase uses Cinzel + Alegreya + Bebas Neue + Fira Sans, which aligns with CLAUDE.md. These font families are different at a functional level — no bridge is possible.

Option A — Adopt the guide's font set (EBGaramond + Oswald). Download and register 6 new font files. Rewrite `CardFont.swift`. Update `Info.plist`. Update all card views. The smoke test (Section 4.9) uses EBGaramond and Oswald — it will render incorrectly until this is done.

Option B — Retain Alegreya + Bebas Neue as the canonical fonts. The guide's Sections 1.5 and 4.7 font requirements are superseded. Update the smoke test view to use the approved fonts. The smoke test confirms the retained font set loads and renders correctly.

⛔ DECISION GATE — Owner must approve Option A or Option B before Phase 0 (font download) can complete. Record decision in `Logs/DEPENDENCY_DECISIONS.md`.

---

**DECISION 3 — Generation Pipeline Architecture**

The existing scripts (`generate-base-pool.mjs`, etc.) use `fal-ai/fast-sdxl` via JavaScript. The guide requires Python scripts using Replicate (for creatures with the LoRA) and `fal-ai/flux/dev` (for non-creatures). The LoRA weight file `chscrt-sdxl-lora.safetensors` must also be confirmed at the R2 URL before creature generation can run.

Option A — Adopt the guide's pipeline. Create `Scripts/generate_creature.py` (Replicate + LoRA) and `Scripts/generate_noncreature.py` (fal.ai FLUX.1 Dev). Retire the existing `.mjs` scripts for new production generation.

Option B — Retain the existing `.mjs` scripts as the primary pipeline. Document the deviation in `Logs/DEPENDENCY_DECISIONS.md` as an authorized variant. The guide's Python scripts are created as supplementary tools for LoRA-specific generation only.

⛔ DECISION GATE — Owner must approve Option A or Option B before Phase 5 (Asset Generation Pipeline) begins. Additionally, before any creature artwork generation runs under any option, the owner must visit `civitai.com/models/336656` and take the screenshot described in the Commercial License Gate below.

---

**COMMERCIAL LICENSE GATE — EldritchPaletteKnife (must complete before Phase 5)**

Before any creature artwork is generated using the `chscrt-sdxl-lora.safetensors` LoRA (which was trained on EldritchPaletteKnife outputs):

1. Visit `civitai.com/models/336656`
2. Click the "License" link on the model page
3. Confirm the "Allow commercial use" permission checkbox state
4. Screenshot the page showing the checkbox state
5. Save to `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png`

If commercial use is not permitted: retrain the LoRA using SDXL base outputs only (Apache 2.0, unambiguously commercial-safe) and delete all existing LoRA-generated assets.

⛔ COMMERCIAL PIPELINE GATE — Do not proceed to Phase 5 without this file existing at the path above.

---

## Phase Overview

| Phase | Name | Depends On | Parallel With | Effort |
|-------|------|------------|---------------|--------|
| 0 | Environment & Toolchain Setup | Decisions 2, 3 | — | Medium |
| 1 | Color Palette & Data Schema | Phase 0 | — | Medium |
| DECISION GATE | CardFrameView Architecture | Decision 1 | — | — |
| SMOKE TEST GATE | Smoke Test Build | Phase 1 | — | Small |
| 2 | Card Layout Rebuild | Decision 1, Phase 1 | — | XL |
| 3 | Metal Shader Pipeline | Smoke Test Gate | Phase 5 | XL |
| 4 | Rarity & Particle Effects | Phase 3 | Phase 6 | Large |
| 5 | Asset Generation Pipeline | Decision 3, Phase 0, Commercial Gate | Phase 3 | Large |
| 6 | Sound & Haptics | Phase 0 | Phase 3, Phase 5 | Large |
| 7 | Accessibility & iPad | Phase 2 | Phase 4 | Medium |
| 8 | Performance & Final Polish | Phase 4, Phase 6, Phase 7 | — | Medium |

---

## Phase 0: Environment & Toolchain Setup

**Depends on:** Decision 2 (font set), Decision 3 (pipeline architecture)
**Must be sequential first** — everything depends on this environment being stable.
**Effort:** Medium (100–400 lines total across shell scripts and config files)

### Tasks

**0.1 — Project-root `Resources/` directory structure**
Create directories: `Resources/CardArt/`, `Resources/Fonts/`, `Resources/Icons/`, `Resources/Textures/`, `Resources/Sounds/`, `Resources/Haptics/`, `Resources/Cards/`, `Resources/LegalEvidence/`, `Staging/`.
Also create: `Logs/Performance/`.
Effort: Small (directory creation, no code).

**0.2 — `Logs/BUDGET_LEDGER.md` and `Logs/DEPENDENCY_DECISIONS.md`**
Create both files. Populate `BUDGET_LEDGER.md` with the budget allocation table from Section 11.1 (creatures 35%, non-creature 25%, iterations 15%, parallax 15%, textures 5%, reserve 5%). Record Decisions 1–3 and the Commercial License Gate decision in `DEPENDENCY_DECISIONS.md`.
Effort: Small.

**0.3 — `.env` additions**
Add `REPLICATE_API_TOKEN=`, `LORA_URL=https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors`, `FREESOUND_API_KEY=` to the root `.env` file.
Effort: Small.

**0.4 — Python library installation**
Run: `pip3 install Pillow numpy requests replicate fal-client --break-system-packages`
Verify: `python3 -c "import PIL, numpy, requests, replicate, fal_client; print('OK')"`
Effort: Small.

**0.5 — Missing CLI tools**
`brew install pngquant`
`npm install -g svgexport`
`brew install mono0926/license-plist/license-plist`
Audit all existing `.sh` scripts for bare `convert` usage and replace with `magick` (ImageMagick 7).
Effort: Small.

**0.6 — Font files** (contingent on Decision 2)
If Option A (guide fonts): Download `Cinzel-Regular.ttf`, `Cinzel-Bold.ttf`, `EBGaramond-Regular.ttf`, `EBGaramond-Italic.ttf`, `EBGaramond-SemiBold.ttf`, `Oswald-Bold.ttf` from fonts.google.com. Add to `ChaosCreatures/ChaosCreatures/Resources/Fonts/` and to Xcode project. Update `Info.plist` `UIAppFonts` array.
If Option B (retain fonts): Verify the 6 existing font files load correctly in Simulator. No Info.plist change needed.
Effort: Small.

**0.7 — `Scripts/load_env.sh`**
Create shared environment loader that sources root `.env` and prints loaded/total key count. Used at the start of all generation scripts.
Effort: Small.

**0.8 — `Scripts/verify_environment.sh` (master gate)**
Create the full environment check script from Section 4.1: Xcode version check, simulator device targets check, all CLI tools check, Python library import check, API key presence check, R2 LoRA URL reachability check, legal gate file check.
Exits 0 on pass, 1 on fail. `✓`/`✗`/`⚠` output format.
Effort: Medium.

**0.9 — `Scripts/cleanup_staging.sh` and `Makefile`**
Create `Scripts/cleanup_staging.sh` deleting Staging files older than 24h. Create `Makefile` at project root with `clean-staging` and `clean-all` targets.
Effort: Small.

**0.10 — SPM dependency verification**
Check `ChaosCreatures.xcodeproj` for `lottie-ios` and `Nuke`. Add missing packages. Add `swift-collections` if absent.
Effort: Small.

### Phase 0 Exit Criteria
- `Scripts/verify_environment.sh` exits 0
- All 6 required font files load in Simulator without crash (verify via Xcode console — no "failed to find font" warnings)
- `python3 -c "import PIL, numpy, requests, replicate, fal_client"` exits 0
- `Resources/LegalEvidence/` and `Resources/Haptics/` directories exist
- `Logs/BUDGET_LEDGER.md` and `Logs/DEPENDENCY_DECISIONS.md` exist with content

---

## Phase 1: Color Palette & Data Schema

**Depends on:** Phase 0 complete
**Sequential after Phase 0.** Must complete before any card rendering code is written or any color token is referenced.
**Effort:** Medium (100–400 lines)

### Tasks

**1.1 — 16 P3 named color assets in `Assets.xcassets`**
Create 16 `.colorset` directories under `Assets.xcassets/Colors/` (or root level):
`parchment-light`, `parchment-mid`, `parchment-dark`, `ink-black`, `wax-red`, `wax-blue`, `wax-green`, `fey-teal`, `rot-moss`, `aged-gold`, `antique-silver`, `epic-amethyst`, `legendary-ember`, `canvas-warm`, `parchment-dark-mode`, `ink-dark-mode`.
Each `Contents.json` must specify Display P3 color space with the exact P3 values from Section 1.2 table. Include dark mode variants where applicable.
Effort: Small (repetitive JSON creation).

**1.2 — Replace all `Color(hex:)` references in card rendering code**
Search for all `Color(hex:)` usages in `CardFrameView.swift` and replace with `Color("token-name")` lookups. Verify the replaced values match the guide's intended P3 tokens (several existing hex values differ from guide spec).
Effort: Small.

**1.3 — `CardDisplayState` enum**
Create `ChaosCreatures/ChaosCreatures/Models/CardDisplayState.swift`:
`enum CardDisplayState: Equatable { case default, focused, selected, tapped, previewed, inGraveyard, summoning(progress: Float), foilActive(tiltX: Float, tiltY: Float), damaged(severity: Float) }`
Effort: Small.

**1.4 — Guide-spec `Card` struct and `CardFaction` enum**
Create (or extend) `ChaosCreatures/ChaosCreatures/Models/Card.swift` containing:
- The full `Card: Codable, Identifiable` struct from Section 2.1 (all required fields including `ruinPassiveText`, `ruinDestructionPenaltyText`, `artworkLineage`, etc.)
- `enum CardFaction: String, Codable` with `var color: Color` extension using named color assets
- `enum CardSubFaction`, `enum CardType`, `enum Rarity`, `enum FrameStyle`, `enum CardCondition`, `enum InkColor`
Note: `CardFaction` must unify or replace the existing `FactionShortName` enum. Confirm there is no duplicate declaration.
Effort: Medium.

**1.5 — `CardShaderUniforms` struct and all `Rarity` extensions**
In `Sources/Models/Card.swift` (or equivalent), add per Section 2.2:
- `struct CardShaderUniforms` with all 6 fields
- `extension Card { var shaderUniforms: CardShaderUniforms }`
- `extension CardCondition { var brushRoughness, varnishGloss, parchmentAge }`
- `extension Rarity { var waxColor, glowSIMD, foilIntensity, glowIntensity, sealIconName, borderWidth, borderGradient }`
- `extension Rarity: Comparable`
All Rarity extensions must be in Card.swift, not scattered in view files.
Effort: Medium.

**1.6 — `EffectTier` enum**
Create `ChaosCreatures/ChaosCreatures/Effects/EffectTier.swift`:
`enum EffectTier: Int, Comparable { case minimal, staticOnly, shimmerOnly, full }`
`func resolveEffectTier() -> EffectTier` checking `isReduceMotionEnabled`, `MTLCreateSystemDefaultDevice()`, `CMMotionManager().isDeviceMotionAvailable`.
Must be created before `WaxSealView` and `MetalCardEffectView` to avoid compilation order issues.
Effort: Small.

**1.7 — `CardTheme` object for dark mode**
Create `ChaosCreatures/ChaosCreatures/Models/CardTheme.swift`:
Observes `@Environment(\.colorScheme)`. Switches the entire palette in one place. CardFrameView adopts `@Environment(\.colorScheme)` and routes all color lookups through `CardTheme`.
Effort: Small.

**1.8 — `CardRepository` and 5 test card JSON files**
Create `ChaosCreatures/ChaosCreatures/Models/CardRepository.swift` per Section 2.4 implementation.
Create `Resources/Cards/` with 5 test JSON files: one per rarity, spanning all 4 card types, at least 3 factions. These exercise all schema fields.
Effort: Medium.

**1.9 — `ASTC compression script and Textures/ group`**
Create `Scripts/set_astc_compression.py`. Run on all texture imagesets in `Assets.xcassets`.
Create `Assets.xcassets/Textures/` group with 6 imageset placeholders: `parchment_base`, `parchment_normal`, `brush_normal`, `foil_gradient`, `wax_seal_normal`, `canvas_base`. (Assets populated in Phase 5.)
Effort: Small.

### Phase 1 Exit Criteria
- All 16 color tokens resolve in Simulator without "Unable to find color named" errors
- `CardDisplayState` compiles: `swift -e "let s: CardDisplayState = .default"` style check via xcodebuild
- `CardShaderUniforms` struct defined (smoke test verification from Section 4.9 grep checks)
- `EffectTier` has Comparable conformance (smoke test check)
- `Rarity.sealIconName` defined in `Sources/Models/Card.swift` (smoke test check)
- No duplicate `CardFaction` declarations (smoke test check)
- `CardRepository` loads all 5 test JSON files without error in Simulator

---

## ⛔ DECISION GATE: CardFrameView Architecture

Owner must review the gap analysis finding for Section 1.4 (full-art-bleed vs. zone-stack conflict) and record a decision in `Logs/DEPENDENCY_DECISIONS.md` before Phase 2 begins.

Record exactly: "Decision 1 — CardFrameView: Option A (zone-stack rewrite)" or "Decision 1 — CardFrameView: Option B (retain full-art-bleed)".

No agent should proceed to Phase 2 until this decision is recorded.

---

## ⛔ HARD GATE — SMOKE TEST (Section 4.9)

Before Phase 3 begins, all of the following must pass:

1. Run the Section 4.9 pre-build verification bash block (grep checks for CardShaderUniforms, CardRenderer, EffectTier, sealIconName, no duplicate CardFaction)
2. All checks in that block must print no "MISSING" or "BUG" lines
3. `Sources/Views/SmokeTestCardView.swift` created and compiles
4. Build succeeds for all 4 simulators: iPhone 15 Pro, iPhone 12, iPad Pro 12.9 6th gen, iPad Air 5th gen
5. `Scripts/screenshot_all_devices.sh smoke_test` runs and produces 4 non-zero screenshot files
6. **User must view all four simulator screenshots and confirm:**
   - Parchment texture visible (not a flat color)
   - All six fonts render correctly (name bar: Cinzel-Bold, type line: Cinzel-Regular, ability text: EBGaramond-Regular or approved equivalent, flavor text: EBGaramond-Italic or approved equivalent, collector number: Cinzel-Regular 7pt, ATK/HP: Oswald-Bold or approved equivalent)
   - Rarity color bar visible at bottom
   - All four device screenshots show correct proportional layout

⛔ HARD GATE — User must see and approve all four simulator screenshots before Phase 3 begins.

---

## Phase 2: Card Layout Rebuild

**Depends on:** Decision 1 (CardFrameView architecture) approved, Phase 1 complete
**Sequential after Decision Gate.** Cannot run in parallel with any phase that touches CardFrameView.
**Effort:** XL (major architectural component — 400+ lines if zone-stack, 200+ lines if full-art-bleed option with corrections)

### Tasks (assuming Option A — zone-stack rewrite; adjust if Option B)

**2.1 — Zone-stack layout implementation**
Rewrite CardFrameView body with the exact zone measurements from Section 1.4:
Outer border (corner radius 12pt), Name Bar (25pt), Art Box (132pt), Type Line (18pt), Text Box (88pt, scrollable), Stats Bar (15pt), Rarity Color Bar (4pt).
Width 210pt reference size. Height = width × (294/210). All font sizes per Section 1.5 table.
Effort: XL.

**2.2 — Card type layout variants**
Add `switch card.type` logic per Section 1.5b:
- Spell: omit stats bar, text box 107pt, omit wax seal, omit instability
- Stabilizer: no cost symbols, no ATK/HP/instability, lock icon SF Symbol in art box bottom-right
- Planar Ruin: HP-only stats bar, passive benefit panel + destruction penalty panel, faction wax seal only on faction-evolved ruins
Effort: Large.

**2.3 — Chaos Mote symbol system**
AI-generate chaos mote symbol once as 32×32pt PNG at 3×. Add to asset catalog. Implement tiled symbol display in name bar: up to 7 symbols, 2pt spacing, "N+" overflow in Cinzel-Regular 10pt.
Effort: Medium.

**2.4 — Font migrations**
Apply the approved font set to all zones: card name (Cinzel-Bold 13pt), type line (Cinzel-Regular 10pt), ability text (EBGaramond-Regular 11pt or approved equiv), flavor text (EBGaramond-Italic 10pt or approved equiv), keywords (EBGaramond-SemiBold 11pt or approved equiv), collector number (Cinzel-Regular 7pt), ATK/HP (Oswald-Bold 13pt or approved equiv).
Letterpress shadow on all text: x=0, y=0.5pt, blur 0.5pt, parchment-dark 60% opacity.
Effort: Medium.

**2.5 — Gesture priority stack on CardFrameView**
Add three-tier gesture stack directly to CardFrameView:
`.highPriorityGesture(LongPressGesture(minimumDuration: 0.35))` → previewed state
`.gesture(DragGesture(minimumDistance: 8))` → drag handler
`.simultaneousGesture(TapGesture())` → selected state
Wire to `@State private var cardState: CardDisplayState = .default`.
Effort: Small.

**2.6 — CardDisplayState transitions wired to CardFrameView**
Implement all 11 state transitions from Section 1.6 table with precise durations and curves:
focused (0.18s easeOut), focused→default (0.25s spring), selected (0.12s easeIn), selected→default (0.3s spring), tapped two-phase flip, previewed (0.28s easeOut), previewed→default (0.22s easeIn), inGraveyard (0.6s easeIn), summoning (0.4s easeOut), damaged shake (CAKeyframeAnimation 0.4s).
Effort: Large.

**2.7 — CardBackView and flip animation**
Create `ChaosCreatures/ChaosCreatures/Views/Components/CardBackView.swift`:
Canvas texture base (woven grid, canvas-warm color), centered 40pt wax seal with game sigil (deep wax-red), parchment-mid border at Common border weight.
Wire two-phase flip animation to `tapped` state: Phase 1 easeIn 0.17s → 90°, Phase 2 swap faces, easeOut 0.18s from -90° to 0°.
Effort: Medium.

**2.8 — Error and fallback states**
Expand `artPlaceholder` to match Section 1.9: canvas-colored rectangle + procedural ink-wash + quill icon on artwork load failure.
Add font fallback to Georgia/Times New Roman (not San Francisco) in CardFont.swift.
Add shader error log path `Logs/shader_errors.log`.
Add Metal-unavailable check routing to `staticOnly` EffectTier.
Add torn-edge "???" placeholder for JSON parse errors.
Effort: Medium.

**2.9 — GeometryReader relative sizing**
Replace `CardDisplaySize` enum absolute values with GeometryReader-relative sizing per Section 9.2:
Card width = `isCompact ? min(availableWidth * 0.85, 260) : min(availableWidth * 0.40, 350)`.
Height = `cardWidth * (294.0 / 210.0)` always.
Effort: Medium.

**2.10 — `voiceOverLabel` computed property on card model**
Add `var voiceOverLabel: String` to `CardDisplayData` (or the Card struct) concatenating name, cost, type, ATK/HP, instability, abilityText, flavorText per Section 10.1 implementation.
Effort: Small.

**2.11 — Accessibility modifiers on CardFrameView**
Add to CardFrameView body: `.accessibilityElement(children: .ignore)`, `.accessibilityLabel(card.voiceOverLabel)`, `.accessibilityHint("Double-tap to select. Long-press to preview.")`, `.accessibilityAddTraits(.isButton)`, `.accessibilityCustomActions` with "Preview card" and "Show card details". Add `.accessibilityIdentifier("CardView")` for UITest lookup.
Effort: Small.

**2.12 — `DraggableCardView`**
Create `ChaosCreatures/ChaosCreatures/Views/Components/DraggableCardView.swift` with resistance 0.72, rotation `width * 0.025`, scale 1.05 while dragging, shadow radius 16 while dragging, spring `response: 0.38, dampingFraction: 0.62` on release.
Effort: Small.

### Phase 2 Exit Criteria
- Card renders in Simulator matching Section 1.4 zone measurements (verify with Xcode view hierarchy inspector)
- All four card type variants render correctly without a stats bar on spells/stabilizers
- Flip animation completes without visual artifacts on iPhone 15 Pro simulator
- Font letterpress shadow visible on all text zones
- VoiceOver reads card name, cost, and type correctly when run in Simulator

---

## Phase 3: Metal Shader Pipeline

**Depends on:** Smoke Test Gate passed
**Can run in parallel with Phase 5** (asset generation pipeline does not require Metal shaders)
**Cannot run until smoke test gate passes** — font and color foundations must be confirmed working first.
**Effort:** XL (500+ lines Metal + 200+ lines Swift bridge)

### Tasks

**3.1 — `Sources/Effects/CardRenderer.swift`**
Create `CardRenderer` protocol: `func resize(to size: CGSize)`, `func render(to view: MTKView, uniforms: CardShaderUniforms)`.
Create `NullCardRenderer: CardRenderer` as safe no-op placeholder.
Effort: Small.

**3.2 — `Sources/Effects/MetalCardEffectView.swift`**
Create `MetalCardEffectView: UIViewRepresentable` wrapping `MTKView` with `Coordinator` conforming to `MTKViewDelegate`. `NullCardRenderer` as default renderer. `OilPaintCardRenderer` wired in Phase 3.4.
Effort: Small.

**3.3 — Shader directory and Xcode target membership**
Create `ChaosCreatures/ChaosCreatures/Shaders/` directory. Add all `.metal` files to Xcode target. Run `Scripts/compile_shaders.sh` (create if absent) after each shader addition to verify no compile errors.
Effort: Small.

**3.4 — `OilPaintShader.metal`**
Fragment shader applying brushwork normal mapping, warm shadow lift, parchment age desaturation, oil varnish specular. Driven by `brushRoughness`, `varnishGloss`, `parchmentAge`, `lightDirection` uniforms from `CardShaderUniforms`.
Requires: `brush_normal.imageset` texture (generated in Phase 5.3 or Staging).
Effort: Large.

**3.5 — `ParchmentShader.metal`**
Fragment shader with physical paper UV tiling (256pt per tile), fiber normal mapping from `parchment_normal.imageset`, edge vignette with age darkening, warm tint, dark mode branching via `colorScheme` uniform.
Effort: Large.

**3.6 — `WarmFoilShader.metal`**
Fragment shader with `tiltX`/`tiltY` uniforms, organic sine UV distortion, luminance-based foil mask, warm iridescent additive blend. Driven by `CardShaderUniforms.foilIntensity`. Note: `GyroscopeManager` already provides tilt data — wire to Metal uniform instead of SwiftUI offset. Existing SwiftUI holographic overlay remains as `staticOnly`-tier fallback.
Effort: Large.

**3.7 — `InkSpreadKernel.metal`**
Compute kernel with organic noise at spread edge, progress-driven reveal 0.0 to 1.0 over 0.8s via `CADisplayLink`. Triggered by `CardDisplayState.summoning(progress:)` transition.
Effort: Large.

**3.8 — `WaxSealView.swift`**
Create `ChaosCreatures/ChaosCreatures/Views/Components/WaxSealView.swift` for rarity indication (separate from existing `WaxSealBadge` stat component):
`rarity.waxColor` RadialGradient outer disk, `rarity.sealIconName` embossed symbol, specular highlight Ellipse, pulsing glow animation for rare+. Positioned at x=164, y=258 per Section 1.4 table.
Pulsing glow must respect `@Environment(\.accessibilityReduceMotion)`.
Effort: Medium.

**3.9 — `TextureCache.swift`**
Create `ChaosCreatures/ChaosCreatures/Services/TextureCache.swift` per Section 13.4: `final class TextureCache` with `MTLTexture` LRU eviction (20 textures, explicit `accessOrder` array, `evictAll()` method). Add `NotificationCenter` observer for `UIApplication.didReceiveMemoryWarningNotification` calling both `TextureCache.shared.evictAll()` and `ImageCacheService.shared.clearMemoryCache()`.
Effort: Small.

**3.10 — `OilPaintCardRenderer`**
Implement full `OilPaintCardRenderer: CardRenderer` using the OilPaintShader. Wire to `MetalCardEffectView`. Add Metal shader compile warning check to build scripts (xcodebuild piped through grep for metal/shader warnings).
Effort: Large.

### Phase 3 Exit Criteria
- All four `.metal` files compile without errors (xcodebuild + metal grep filter)
- Oil paint effect visually detectable on card art in iPhone 15 Pro Simulator (visible brushwork, not flat)
- Foil effect responds to gyroscope tilt in Simulator (use motion simulation in Simulator hardware menu)
- Parchment grain visible at native @3x resolution in fullscreen card preview
- Shader compilation failure falls back gracefully to flat parchment-light fill (test by deliberately corrupting a shader, verify no crash)
- Add human profiling checklist entry to `Logs/iteration_log.md` per Section 13.1 template

---

## Phase 4: Rarity & Particle Effects

**Depends on:** Phase 3 complete (WaxSealView and MetalCardEffectView must exist)
**Can run in parallel with Phase 6** (sound and haptics have no dependency on Phase 4)
**Effort:** Large (400+ lines)

### Tasks

**4.1 — `CardParticleFactory`**
Create `ChaosCreatures/ChaosCreatures/Effects/CardParticleFactory.swift`:
`enum CardParticleFactory` with `static func makeEmitter(for rarity: Rarity, in artBoxSize: CGSize) -> SKEmitterNode?`.
All emitters use `.alpha` blend mode (NOT `.add`).
Birth rates per Section 6.8: uncommon 2/s lifetime 4s, rare 5/s lifetime 3s, epic 8/s lifetime 3.5s, legendary 14/s lifetime 2s.
Common has no emitter (returns nil).
Note: SpriteKit particle work is compatible with the guide's SpriteKit-for-particles approach — no conflict.
Effort: Medium.

**4.2 — Rarity border treatments with Reduce Motion compliance**
Verify `RarityBorderModifier` uses correct color tokens (`aged-gold` for Rare, `epic-amethyst` for Epic, `legendary-ember` for Legendary).
Extract `AnimatedGradientBorder` and `StaticBorder` as standalone components.
Add `@Environment(\.accessibilityReduceMotion) var reduceMotion` to all animated border components. Guard all `.repeatForever()` animations: `guard !reduceMotion else { return }`.
Effort: Medium.

**4.3 — Rarity color bar and border weight corrections**
Add 4pt rarity color bar at bottom of inner content area. Verify border widths match Section 1.4 table: Common 3pt, Uncommon 3.5pt, Rare/Epic/Legendary 4pt with correct outer glow values.
Effort: Small.

**4.4 — Wax seal icon assets**
Download seal icon assets (`seal_common`, `seal_uncommon`, `seal_rare`, `seal_epic`, `seal_legendary`) via `Scripts/download_icons.sh` (create script if not present). Add to `Assets.xcassets/Icons/`. Wire to `Rarity.sealIconName` in `WaxSealView`.
Effort: Small.

**4.5 — `preferredFramesPerSecond` on SKView**
Set `skView.preferredFramesPerSecond = 60` in `BattleScene`. Add `drawsAsynchronously = true` on SpriteKit ambient particle scene. Add `shouldRasterize = true` on card composite layer when animations are idle.
Effort: Small.

**4.6 — SKTextureAtlas for small SpriteKit assets**
Create texture atlas for SpriteKit-rendered small assets (keyword badges, stat icons, mana symbols used on battlefield). One draw call per atlas.
Effort: Small.

### Phase 4 Exit Criteria
- All 5 rarity tiers visually distinct in iPhone 15 Pro Simulator
- Epic and Legendary animated borders pause when Reduce Motion is enabled in Simulator accessibility settings
- Rarity color bar visible at bottom of card inner area
- Particle emitters use `.alpha` blend mode (verify in Xcode SpriteKit inspector — additive blend will look digital/glowing vs. physical)
- Add human profiling checklist entry to `Logs/iteration_log.md`

---

## Phase 5: Asset Generation Pipeline

**Depends on:** Phase 0 complete, Decision 3 (pipeline architecture), Commercial License Gate
**Can run in parallel with Phase 3** (Metal shaders do not depend on generated art)
**Effort:** Large (400+ lines across Python scripts)

⚠️ Before starting this phase, confirm:
- `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png` exists
- `REPLICATE_API_TOKEN` and `LORA_URL` are set in `.env`
- `Scripts/verify_environment.sh` exits 0

### Tasks

**5.1 — `Scripts/prompt_utils.py`**
Create shared Python module with `FACTION_CREATURE_STYLE`, `SUBFACTION_CREATURE_STYLE`, `FACTION_NONCREATURE_STYLE`, `build_creature_prompt()`, `build_noncreature_prompt()` per Sections 3.2–3.3.
Effort: Medium.

**5.2 — `Scripts/verify_asset.py`**
Create dimension verification script: validates file exists, is nonzero, is not a JSON error payload, meets minimum dimensions. Optional warm-tone check (fail if blue-dominant). Exit 0 pass, exit 1 fail.
Effort: Small.

**5.3 — Procedural texture generation scripts**
- `Scripts/generate_normal_map.sh` — ImageMagick clone/roll/fx technique for RGB normal maps
- `Scripts/generate_wax_normal.py` — Pillow + numpy dome normal map 256×256 → `Resources/Textures/wax_seal_normal.png`
- `Scripts/generate_foil_gradient.py` — Pillow + numpy 512×512 warm iridescent gradient → `Resources/Textures/foil_gradient.png`
Run all three scripts. Move outputs to `ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/Textures/` imagesets.
Effort: Medium.

**5.4 — `Scripts/download_textures.sh`**
Download Poly Haven CC0 PBR textures (parchment_paper, canvas_1 diffuse + normal maps) from `dl.polyhaven.org`. Save to `Staging/textures/`. Append license entries to `Resources/ASSET_LICENSE_MANIFEST.md`. Move usable textures to Textures/ imageset group.
Effort: Small.

**5.5 — `Scripts/generate_creature.py`** (if Decision 3 Option A)
Create Replicate-based creature generation script using `chscrt-sdxl-lora.safetensors` at R2 URL. Include R2 reachability check, `extra_lora_scale: 0.85`, 35 steps, verify_asset.py call after each generation, cost logging to `Logs/BUDGET_LEDGER.md`.
Effort: Medium.

**5.6 — `Scripts/generate_noncreature.py`** (if Decision 3 Option A)
Create fal.ai FLUX.1 Dev script for spells, stabilizers, planar ruins. Uses `prompt_utils.py` faction-aware templates. Verify_asset.py call after each generation.
Effort: Medium.

**5.7 — `Scripts/grade_artwork.sh`**
Create 5-pass ImageMagick color grading script: base warm-shift + vignette pass, then faction-specific passes (ironwright shadow deepening, fey blue/green lift, demonic red push, celestial highlight lift, endless desaturation). Outputs to `Resources/CardArt/{card_uuid}_{tier}.png`.
Effort: Medium.

**5.8 — `Resources/ASSET_LICENSE_MANIFEST.md` and `Logs/DEPENDENCY_DECISIONS.md` population**
Populate the license manifest with all existing card art assets (9 test cards + 3 evolution variants). Document the fal.ai FLUX.1 Dev commercial license decision (BFL partnership confirmation, model choice) in `DEPENDENCY_DECISIONS.md`.
Effort: Small.

**5.9 — `Scripts/screenshot_all_devices.sh` and `Scripts/compare_screenshots.py`**
Create multi-device screenshot script per Section 5.3: boot 4 simulators, capture screenshots, verify nonzero, print dimensions.
Create pixel diff regression script per Section 12.2: Pillow-based, resize to 400×560, normalized diff, pass if < 0.025, output JSON.
After first "good" iteration passes the smoke test gate, establish baseline reference screenshots in `Tests/ReferenceScreenshots/`.
Effort: Medium.

### Phase 5 Exit Criteria
- `Scripts/verify_asset.py` passes on 5 sample generation outputs
- `Scripts/grade_artwork.sh` produces visually warm-shifted outputs (compare against parchment-light swatch)
- Foil gradient texture and wax seal normal map present in asset catalog Textures/ group
- Parchment and canvas PBR textures present in Staging/textures/
- License manifest populated with all generated assets
- Cost log entries in `Logs/BUDGET_LEDGER.md` for all API calls in this phase

---

## Phase 6: Sound & Haptics

**Depends on:** Phase 0 complete (font + environment ready)
**Can run in parallel with Phase 3 and Phase 5**
**Effort:** Large (400+ lines Swift + AHAP JSON files)

⚠️ ALL haptic items in this phase carry "⚠️ PENDING PHYSICAL DEVICE VERIFICATION" status. Mark them in `Logs/iteration_log.md`. Do not mark Phase 6 complete without physical device verification of haptics.

### Tasks

**6.1 — `Resources/Haptics/` directory and all 6 AHAP files**
Create `ChaosCreatures/ChaosCreatures/Resources/Haptics/`.
Create (or generate) AHAP files using exact JSON from Section 7.2:
- `card_flip.ahap` — transient at 0.0s (0.4, 0.6), transient at 0.35s (0.8, 0.75)
- `card_summon.ahap` — HapticContinuous 0→0.8→0.3 over 0.4s with ParameterCurve
- `card_graveyard.ahap` — HapticContinuous fade-out 0.6→0 over 0.7s
- `epic_reveal.ahap` — two-phase: continuous 0→0.7→0.4 over 0.6s, then shimmer 0.2 over 1.2s starting at 0.65s
- `legendary_reveal.ahap` — burst 1.0 at 0.0s, 0.85 at 0.1s, shimmer 0.25 over 1.5s starting at 0.25s
Create `Scripts/generate_foil_shimmer_ahap.py` (Python using random.seed(42) per Section 7.2) and run it to produce `foil_shimmer.ahap`.
Add all 6 AHAP files to Xcode project.
Effort: Medium.
⚠️ PENDING PHYSICAL DEVICE VERIFICATION on all 6 files.

**6.2 — `HapticEngine.swift`**
Create `ChaosCreatures/ChaosCreatures/Services/HapticEngine.swift`:
`final class HapticEngine` singleton with `CHHapticEngine`, `func prepare()`, `func play(ahapNamed:)`, `func impact(_ style:)`.
`prepare()` initializes and starts CHHapticEngine, sets stoppedHandler and resetHandler.
`play(ahapNamed:)` uses `engine.playPattern(from:)`.
`impact(_ style:)` uses `UIImpactFeedbackGenerator` for simple patterns (card pick up, card set down, wax seal tap, invalid action, scroll text box).
Log all 11 haptic interactions in `Logs/iteration_log.md` as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.
Effort: Medium.

**6.3 — Audio format conversion: WAV to CAF**
Convert all 19 existing SFX `.wav` files to `.caf` using `afconvert -f caff -d LEI16@44100` per Section 8.2.
Update `BattleAudioManager.playSFX()` to look for `.caf` extension.
Effort: Small.

**6.4 — Missing SFX sourcing**
Source CC0 sounds from freesound.org for: `card_draw.caf`, `card_flip.caf`, `card_summon.caf`, `card_graveyard.caf`, `wax_seal_tap.caf`, `foil_shimmer.caf`. Process through ffmpeg pipeline from Section 8.2.
Update `Resources/ASSET_LICENSE_MANIFEST.md` with all sourced sounds.
Effort: Medium.

**6.5 — Missing faction music tracks**
Source or generate `battle-celestial` and `battle-endless` tracks. Fix stem naming convention to match `BattleAudioManager`'s lookup pattern (`{faction.rawValue.lowercased()}_{stem}`).
Effort: Medium.

**6.6 — `Scripts/download_sounds.sh`**
Create automated CC0 sound download script using Freesound API with `FREESOUND_API_KEY`. Logs downloads to `Resources/ASSET_LICENSE_MANIFEST.md`.
Effort: Small.

**6.7 — BattleAudioManager / SoundEngine naming**
Either rename `BattleAudioManager` to `SoundEngine` and update all references (Option A), or document the name deviation in `Logs/DEPENDENCY_DECISIONS.md` as an authorized variant (Option B). The music stem/adaptive system is a superset of the guide's spec — the functional behavior is compliant.
Effort: Small.

### Phase 6 Exit Criteria
- All 6 AHAP files present in `Resources/Haptics/` and added to Xcode project
- `HapticEngine.shared.prepare()` called at app startup without crash in Simulator
- `HapticEngine.shared.play(ahapNamed: "card_flip")` called without crash (no sound in Simulator — file load is the verification)
- All 11 haptic interactions logged in `Logs/iteration_log.md` as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION
- All SFX files in `.caf` format
- 5 faction battle tracks present (all 5 factions)

⛔ HAPTIC HARD GATE — User must verify all haptic interactions on a physical iOS device (A14 or later, iPhone 12 minimum) before Phase 6 is marked complete. Log device model and iOS version in `Logs/iteration_log.md`.

---

## Phase 7: Accessibility & iPad

**Depends on:** Phase 2 complete (card layout must exist before accessibility modifiers are verified)
**Can run in parallel with Phase 4**
**Effort:** Medium (100–400 lines)

Note: Some Phase 7 tasks (VoiceOver label and accessibility modifiers) are already assigned to Phase 2 steps 2.10–2.11. Phase 7 adds the remaining accessibility and iPad work.

### Tasks

**7.1 — Reduce Motion: audit and add guards to all animation sites**
Add `@Environment(\.accessibilityReduceMotion) var reduceMotion` to `CardFrameView`.
Guard all animation sites in CardFrameView: rarity pulse, shimmer phase, gyroscope foil parallax offset.
Update `GyroscopeManager` to disable tilt tracking when reduce motion is enabled.
Pattern: `withAnimation(reduceMotion ? .none : .spring(response: 0.35, dampingFraction: 0.65)) { ... }`
Effort: Small.

**7.2 — Dynamic Type: UIFontMetrics for text box content**
Add `scaledFont(name:textStyle:baseSize:)` to `CardFont.swift` using `UIFontMetrics(forTextStyle:).scaledFont(for:)`.
Apply to text box content (ability text, flavor text). Text box scroll region must expand at XXL sizes.
Effort: Small.

**7.3 — `CardAccessibilityTests.swift`**
Create `ChaosCreaturesUITests/CardAccessibilityTests.swift` with `testCardViewHasAccessibilityLabel()`.
The test finds all elements with `accessibilityIdentifier("CardView")`, asserts count > 0, asserts each has non-empty accessibility label.
Effort: Small.

**7.4 — `Scripts/verify_contrast.py`**
Create WCAG AA contrast verification script checking 5 pairs from Section 10.4. Run as part of every QA pass.
Effort: Small.

**7.5 — iPad size class branching**
Implement `CardHandArcView` (iPad portrait) and `CardHandSpreadView` (iPad landscape).
Add `@Environment(\.horizontalSizeClass)` and `@Environment(\.verticalSizeClass)` to BattleContainerView and CollectionView.
Branch: compact → SingleCardFocusView, regular portrait → CardHandArcView, landscape → CardHandSpreadView.
Effort: Medium.

**7.6 — iPad landscape orientation support**
Add `UIInterfaceOrientationLandscapeLeft` and `UIInterfaceOrientationLandscapeRight` to `UISupportedInterfaceOrientations` in Info.plist (iPad only, not iPhone).
Effort: Small.

**7.7 — Stage Manager / multiple scenes** (optional, flag for owner review)
Enable `UIApplicationSupportsMultipleScenes` in Info.plist. Add `UIScene.didActivateNotification` observer to re-compute layout from current window bounds. Test in 1/3, 1/2, 2/3 split view widths.
Note: This is a significant architectural change — flag for owner approval before implementing.
Effort: Medium (if approved).

### Phase 7 Exit Criteria
- VoiceOver reads card name, cost, type, ATK/HP, and ability text correctly in Simulator VoiceOver test
- `Scripts/verify_contrast.py` exits 0 on all 5 required pairs
- Epic and Legendary animations are static when Reduce Motion is enabled (Simulator accessibility settings)
- `CardAccessibilityTests` passes in UITest run
- Card layout meaningfully differs between iPhone portrait and iPad portrait in Simulator

---

## Phase 8: Performance & Final Polish

**Depends on:** Phase 4 (particles), Phase 6 (haptics, audio), Phase 7 (accessibility) complete
**Sequential — must be last.** This phase validates and polishes everything built in prior phases.
**Effort:** Medium (100–400 lines + testing)

### Tasks

**8.1 — Memory warning handler wired**
(Covered in Phase 3.9 — verify it was implemented correctly.)
Run `xcrun simctl send_notification booted com.apple.UIKit.memory-pressure` and confirm app does not crash, card art reloads correctly after memory warning.

**8.2 — `Logs/Performance/` trace runs**
Run `xcrun xctrace record --template "Time Profiler" --device "iPhone 12" ...` per Section 13.1.
Save to `Logs/Performance/launch_trace.xctrace`.
Write human profiling checklist to `Logs/iteration_log.md` — GPU Frame Capture, Metal System Trace, Core Animation Color Offscreen-Rendered. Await human confirmation before marking exit criteria complete.

**8.3 — Visual regression baseline and first full pass**
Run `Scripts/screenshot_all_devices.sh` on all 4 simulators in light mode and dark mode.
Commit baseline reference screenshots to `Tests/ReferenceScreenshots/`.
Run `Scripts/compare_screenshots.py` on all four screenshots.
Log structured critique per Section 12.3 8-axis template in `Logs/iteration_log.md`.

**8.4 — `Logs/iteration_log.md` structured critique pass**
Run a full critique of the rendered card against Section 12.3 axes: Material believability, Color temperature, Texture grain, Typography letterpress, Lighting consistency, Tactile impression, iPad vs iPhone, Dark mode.
Score each axis 1–5 on all four devices in both light and dark mode.
All axes must score 4+ on all four device targets.

**8.5 — Section 12.5 exit criteria checklist**
Evaluate all 13 exit criteria per Section 12.5:
- Critique axes all 4+ (verified in 8.4)
- Regression diff < 0.025 on all four screenshots
- All 9 card states render without error on all four simulators
- Card back flip animation clean
- Error fallback states display correctly
- GPU frame time < 8ms on iPhone 12 [HUMAN GATE]
- No off-screen rendering [HUMAN or debug log]
- All haptic interactions logged as PENDING PHYSICAL DEVICE VERIFICATION [Phase 6]
- VoiceOver gaps confirmed none, all contrast passes WCAG AA [Phase 7]
- Dynamic Type usable at all sizes
- Reduce Motion: static card looks premium
- License manifest entry for every asset
- Artwork color grading verified against parchment-light swatch

**8.6 — Final `Scripts/verify_environment.sh` run**
Run `Scripts/verify_environment.sh` one final time. All checks must pass.
Document final pass in `Logs/iteration_log.md`.

### Phase 8 Exit Criteria
- Section 12.5 checklist: all 13 criteria confirmed pass
- `Scripts/compare_screenshots.py` scores < 0.025 on all four device screenshots (light and dark mode)
- `Scripts/verify_contrast.py` exits 0
- `Scripts/verify_environment.sh` exits 0
- Human profiling checklist in `Logs/iteration_log.md`: GPU frame time confirmed < 8ms on iPhone 12 by owner
- ⚠️ Haptic hard gate confirmed by owner on physical device (carry-over from Phase 6)
- `Logs/BUDGET_LEDGER.md` reflects actual spend vs. budget allocation

---

## Phases Summary Table

| Phase | Can Start When | Blocked Until | Parallel With |
|-------|---------------|---------------|---------------|
| 0 | Decisions 2 & 3 recorded | — | — |
| 1 | Phase 0 exit criteria pass | — | — |
| DECISION GATE | Phase 1 complete | Decision 1 recorded | — |
| SMOKE TEST GATE | Phase 1 complete, decision gate done | User approves 4 screenshots | — |
| 2 | Decision Gate + Smoke Test Gate | Both gates cleared | — |
| 3 | Smoke Test Gate | — | Phase 5 |
| 4 | Phase 3 complete | — | Phase 6 |
| 5 | Phase 0 + Commercial Gate | Owner confirms license | Phase 3 |
| 6 | Phase 0 | — | Phase 3, 5 |
| 7 | Phase 2 complete | — | Phase 4 |
| 8 | Phase 4 + 6 + 7 | All prior phases done | — |

---

*Implementation plan complete. 8 phases, 3 owner decision gates, 2 hard gates (smoke test, haptic physical device). Total gap items addressed: 83 (18 CONFLICT, 11 PARTIAL, 46 ABSENT). Compliant items require no action.*

# Gap Analysis — Chaos Creatures Design Overhaul
Date: 2026-02-21

## Summary

| Category | Count |
|----------|-------|
| CONFLICT | 18 |
| PARTIAL | 11 |
| ABSENT | 46 |
| COMPLIANT | 8 |
| **TOTAL** | **83** |

Sources: AUDIT_VISUAL_DESIGN.md (39 items across Sections 1, 2, 6, 9, 14), AUDIT_ASSETS_PIPELINE.md (42 items across Sections 3, 4, 8, 11), AUDIT_SYSTEMS_QUALITY.md (35 items across Sections 5, 7, 10, 12, 13). Items that appeared in multiple audits have been deduplicated.

---

## Decisions Required Before Implementation Can Begin

The following CONFLICT items represent fundamental architectural incompatibilities. No agent can proceed on the affected areas until the owner makes a decision.

**Decision 1 — CardFrameView architecture (HIGHEST PRIORITY BLOCKER)**
The existing `CardFrameView.swift` (1,986 lines) uses a full-art-bleed design with overlaid stat badges. The guide's Section 1.4 mandates a top-down zone-stack layout (Name Bar → Art Box → Type Line → Text Box → Stats Bar → Rarity Bar) with precise proportional measurements. These designs are architecturally incompatible. A complete rewrite is required if the guide is authoritative; the guide's Section 1.4 measurements are superseded if the existing design is retained.

**Decision 2 — Typography font set**
The existing codebase uses Cinzel + Alegreya + Bebas Neue + Fira Sans, which matches the CLAUDE.md project spec. The guide mandates Cinzel + EBGaramond + Oswald. These are different font families and no bridge is possible. All body text, flavor text, keyword styling, and stat numerals would change. CLAUDE.md and the guide are in direct conflict. The owner must decide which font set is canonical before any typography work proceeds.

**Decision 3 — Generation pipeline architecture**
The existing scripts use `fal-ai/fast-sdxl` via JavaScript `.mjs` files. The guide requires Python scripts using Replicate (for creatures) and `fal-ai/flux/dev` (for non-creatures). The LoRA weight file `chscrt-sdxl-lora.safetensors` must also be confirmed present at the R2 URL before creature generation can run.

---

## CONFLICTS

### [CONFLICT] Section 1.4 — Card layout is full-art-bleed vs. guide's zone-stack specification
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 14–61)
**Current:** Full-art overlay design with a name plate badge at top-left, wax-seal stat badges at corners, and a lower-thirds text panel. No discrete Name Bar (25pt), Art Box (132pt), Type Line (18pt), Text Box (88pt), Stats Bar (15pt), or Rarity Color Bar (4pt) zones. Reference size is not 210×294pt.
**Required:** 210×294pt reference size (5:7 ratio). Top-down zone-stack with precise proportional measurements. Corner radius 12pt. Text box is a scrollable region. All measurements from Section 1.4 table.
**Recommended action:** Owner must decide which layout is canonical (see Decision 1 above). If zone-stack wins, CardFrameView requires a complete rewrite. If full-art-bleed wins, update the guide.

### [CONFLICT] Section 1.4 — Stats bar: ATK/HP as wax-seal badges, not a stats bar zone
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 1280–1350)
**Current:** ATK and HP displayed as separate wax-seal-style circular badges (ATKBadgeView, HPBadgeView) positioned at bottom corners. No 15pt stats bar. No collector number or set code visible.
**Required:** 15pt stats bar at y=267: instability display left (D20 icon + Oswald-Bold 10pt numeral, faction color 80% opacity), collector number center-left (Cinzel-Regular 7pt parchment-mid), "ATK / HP" right-aligned (Oswald-Bold 13pt).
**Recommended action:** Contingent on the CardFrameView architecture decision.

### [CONFLICT] Section 1.4 — Rarity color bar absent; rarity border treatment deviates
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 1640–1831, RarityBorderModifier)
**Current:** Rarity expressed as overlay strokes with glows and holographic-foil overlays. No 4pt rarity color bar at bottom of inner content area (y=282, height=4pt).
**Required:** 4pt rarity color bar at bottom. Border weights by rarity: Common 3pt, Uncommon 3.5pt, Rare/Epic/Legendary 4pt with specific outer glow values and gradient colors matching guide tokens.
**Recommended action:** Add rarity color bar strip. Update border gradient colors to use named color tokens (`aged-gold`, `epic-amethyst`, `legendary-ember`) instead of hardcoded hex.

### [CONFLICT] Section 1.4 — Type line zone and faction icon implementation
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 1097–1118)
**Current:** Type line appears inside lower-thirds text panel as a row, not a discrete 18pt zone. Faction icon is a watermark emblem, not a 14×14pt template-rendered icon tinted with faction color.
**Required:** Dedicated 18pt type line zone between art box and text box. Faction icon 14×14pt left-aligned with `.renderingMode(.template)` and `.foregroundColor(card.faction.color)`. Set symbol 14×14pt right-aligned. Type text in Cinzel-Regular 10pt.
**Recommended action:** Contingent on CardFrameView architecture decision. Faction icon template rendering and color tinting must be fixed regardless.

### [CONFLICT] Section 1.2 — P3 color palette not in asset catalog as named colors
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/` (no `.colorset` folders)
**Current:** All 16 palette tokens are hardcoded as hex strings via `Color(hex:)` extension. Some hex values differ from guide spec (e.g., `#3C301E` vs guide's `parchment-dark-mode` `#2A2015`). No named color assets exist.
**Required:** All 16 named palette tokens as `.colorset` files with Display P3 color space. All card code references `Color("token-name")` lookups.
**Recommended action:** Create all 16 `.colorset` entries. Replace all `Color(hex:)` references in CardFrameView. This is a hard prerequisite for dark mode and faction color correctness.

### [CONFLICT] Section 1.3 — Dark mode: no CardTheme object; no dark mode implementation
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (entire file)
**Current:** No `@Environment(\.colorScheme)` in any card rendering file. No `CardTheme` object. `parchment-dark-mode` and `ink-dark-mode` tokens not referenced anywhere.
**Required:** `CardTheme` object that switches the entire palette in one place via `@Environment(\.colorScheme)`. Dark mode renders as "candlelit manuscript" — deep warm brown card body, warm cream text.
**Recommended action:** Create `Sources/Models/CardTheme.swift`. Route all color lookups through `CardTheme`. Contingent on named color assets being created first.

### [CONFLICT] Section 1.5 — Typography: wrong fonts in use
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Config/CardFont.swift` (lines 1–255)
**Current:** Cinzel (headings/names), Alegreya (body/flavor), Bebas Neue (stat numerals), Fira Sans (UI labels). Info.plist registers: `Cinzel-Variable.ttf`, `Alegreya-Variable.ttf`, `Alegreya-Italic-Variable.ttf`, `BebasNeue-Regular.ttf`, `FiraSans-Regular.ttf`, `FiraSans-SemiBold.ttf`. CLAUDE.md project spec says "Cinzel + Alegreya."
**Required by guide:** Cinzel-Regular, Cinzel-Bold; EBGaramond-Regular, EBGaramond-Italic, EBGaramond-SemiBold; Oswald-Bold. Info.plist must register these six files specifically.
**Recommended action:** Owner must decide which font set is canonical (see Decision 2 above). Do not change until decision is made.

### [CONFLICT] Section 4.7 — Font files installed differ from guide spec
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Fonts/`
**Current:** `Cinzel-Variable.ttf`, `Alegreya-Variable.ttf`, `Alegreya-Italic-Variable.ttf`, `BebasNeue-Regular.ttf`, `FiraSans-Regular.ttf`, `FiraSans-SemiBold.ttf`.
**Required by guide:** `Cinzel-Regular.ttf`, `Cinzel-Bold.ttf`, `EBGaramond-Regular.ttf`, `EBGaramond-Italic.ttf`, `EBGaramond-SemiBold.ttf`, `Oswald-Bold.ttf`.
**Recommended action:** Contingent on font decision. Do not change until owner decides.

### [CONFLICT] Section 3.2 — Creature generation pipeline uses fal-ai/fast-sdxl, not Replicate LoRA
**File:** `/Users/alexali/Projects/chaos-creatures/scripts/generate-base-pool.mjs` (lines 465, 892), `generate-test-cards.mjs`, `gen-custom.mjs`, and 8+ other scripts
**Current:** All creature generation uses `fal-ai/fast-sdxl` via JavaScript `.mjs` scripts. The custom LoRA `chscrt-sdxl-lora.safetensors` and Replicate's `extra_lora` mechanism are not used anywhere.
**Required:** Creatures generated via Replicate + `chscrt-sdxl-lora.safetensors` at canonical R2 URL.
**Recommended action:** Create `Scripts/generate_creature.py` and `Scripts/evolve_creature.py` using the Replicate client per Section 3.2.

### [CONFLICT] Section 3.2 — `REPLICATE_API_TOKEN` and `LORA_URL` missing from `.env`
**File:** `/Users/alexali/Projects/chaos-creatures/.env`
**Current:** Contains `FAL_KEY`, `OPENAI_API_KEY`, Supabase/R2/admin credentials. No `REPLICATE_API_TOKEN`, no `LORA_URL`, no `FREESOUND_API_KEY`.
**Required:** `REPLICATE_API_TOKEN`, `LORA_URL=https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors`, `FREESOUND_API_KEY`.
**Recommended action:** Add the three missing keys to `.env`.

### [CONFLICT] Section 3.3 — Non-creature pipeline uses fal-ai/fast-sdxl, not fal-ai/flux/dev
**File:** `/Users/alexali/Projects/chaos-creatures/scripts/generate-base-pool.mjs`, `generate-test-cards.mjs`
**Current:** Non-creature cards generated using `fal-ai/fast-sdxl` + EldritchPaletteKnife or ClassipeintXL LoRA. Evolution scripts use FLUX Kontext variants (img2img editor), not FLUX.1 Dev (text-to-image).
**Required:** Non-creature artwork (spells, stabilizers, planar ruins) via `fal-ai/flux/dev` with faction-aware prompt templates from `Scripts/prompt_utils.py`.
**Recommended action:** Create `Scripts/generate_noncreature.py` using `fal_client.run("fal-ai/flux/dev", ...)` per Section 3.3.

### [CONFLICT] Section 6.6 — WaxSealBadge is for stats display, not rarity indication
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 208–354, WaxSealBadge)
**Current:** `WaxSealBadge` shows ATK, HP, and CM stat numerals. This is for stat display, not rarity. No separate `WaxSealView` for rarity exists at x=164, y=258.
**Required:** Separate `Sources/Effects/WaxSealView.swift` for rarity indication using `rarity.waxColor` and `rarity.sealIconName`. RadialGradient outer disk, embossed symbol, specular highlight, pulsing glow for rare+. The existing stat badge component is unrelated to this.
**Recommended action:** Create `WaxSealView.swift` per Section 6.6 spec. The existing stat badge can coexist.

### [CONFLICT] Section 6.8 — Particle blend mode: `.add` used throughout, guide requires `.alpha`
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/SpriteKit/Utilities/ParticleEffects.swift` (lines 83, 114, 148, 255–282)
**Current:** All particle emitters use `.add` blend mode. The guide explicitly states additive blending looks digital, not physical.
**Required:** Card rarity particle emitters must use `.alpha` blend mode. Birth rates: uncommon 2/s lifetime 4s, rare 5/s lifetime 3s, epic 8/s lifetime 3.5s, legendary 14/s lifetime 2s. Must be in a separate `CardParticleFactory` enum.
**Recommended action:** Create `Sources/Effects/CardParticleFactory.swift` using `.alpha` blend mode. Existing `ParticleEffects.swift` gameplay particles can remain as-is.

### [CONFLICT] Section 8 — Audio class is `BattleAudioManager`, not `SoundEngine`
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/BattleAudioManager.swift`
**Current:** Class named `BattleAudioManager` with `static let shared = BattleAudioManager()`. Uses `AVAudioPlayer` as fallback for SFX rather than pre-loaded `AVAudioPCMBuffer` per sound.
**Required:** Section 8.3 specifies class named `SoundEngine` with pre-loaded `AVAudioPCMBuffer` and `AVAudioPlayerNode` per sound for SFX. Any code that imports `SoundEngine` would fail compilation.
**Recommended action:** Either rename to `SoundEngine` or document as authorized deviation. The music stem/adaptive system in `BattleAudioManager` is a superset of the guide's spec — this is not a regression, just a name conflict.

### [CONFLICT] Section 9.2 — Card sizes hardcoded, not computed from GeometryReader
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 24–61)
**Current:** Card sizes are hardcoded in `CardDisplaySize` enum (grid=112×157pt, hand=90×130pt, detail=280×392pt, fullscreen=350×490pt). iPad gets 1.15× badge/font scale via `iPadScale` device idiom check — does not resize the card frame.
**Required:** Card width = `isCompact ? min(availableWidth * 0.85, 260) : min(availableWidth * 0.40, 350)`. Height = `cardWidth * (294.0 / 210.0)` always. Reference size table from Section 9.2.
**Recommended action:** Replace `CardDisplaySize` enum with GeometryReader-relative sizing. Contingent on CardFrameView architecture decision.

### [CONFLICT] Section 7.1 — Haptic split: simple vs. complex interactions (theoretical, nothing exists)
**File:** Not found (neither `CHHapticEngine` nor `UIImpactFeedbackGenerator` present anywhere)
**Current:** No haptic code exists. Guide specifies that simple interactions use `UIImpactFeedbackGenerator` while complex interactions (card flip, summon, foil reveal) use CHHapticEngine AHAP patterns.
**Required:** `HapticEngine.swift` with two methods: `func impact(_ style:)` routing simple gestures through UIImpactFeedbackGenerator, and `func play(ahapNamed:)` routing complex interactions through CHHapticEngine.
**Recommended action:** When implementing, the guide's own HapticEngine class already resolves the split — build it per Section 7 specification. Note: theoretical conflict since nothing exists; implement correctly from scratch.

### [CONFLICT] Section 6.6b — `RarityBorderModifier` does not respect `accessibilityReduceMotion`
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 1640–1831)
**Current:** Epic and Legendary animations start unconditionally in `.onAppear`. No `@Environment(\.accessibilityReduceMotion)` check.
**Required:** All animated borders must guard `.repeatForever()` animations behind `guard !reduceMotion`.
**Recommended action:** Add `@Environment(\.accessibilityReduceMotion) var reduceMotion` to `RarityBorderModifier` and guard all repeating animations. This is a hard App Store requirement.

### [CONFLICT] Section 9.1 — Size class handling: device idiom check instead of size class branching
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Collection/DeckBuilderView.swift` (line 12); `CardFrameView.swift`
**Current:** `@Environment(\.horizontalSizeClass)` used only in DeckBuilderView. CardFrameView uses `UIDevice.current.userInterfaceIdiom == .pad ? 1.15 : 1.0` — device idiom, not size class.
**Required:** Size class branching in card presentation views: compact → SingleCardFocusView, regular portrait → CardHandArcView, landscape → CardHandSpreadView. Guide says explicitly "do not scale up the iPhone layout."
**Recommended action:** Implement `CardHandArcView` and `CardHandSpreadView`. Add size class environment to BattleContainerView and CollectionView.

---

## PARTIAL

### [PARTIAL] Section 1.8 — Card back assets exist but no CardBackView or flip animation
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/CardBacks/` (7 imagesets present)
**Current:** `card-back-universal.imageset`, plus 5 faction-specific and 1 chaos variant exist. No `CardBackView` Swift component. No two-phase flip animation wired to the `tapped` card state.
**Required:** `CardBackView.swift` compositing the universal asset. Canvas texture (woven grid), centered 40pt wax seal with game sigil, deep wax-red seal, parchment-mid border. Flip animation: Phase 1 easeIn 0.17s to 90°; Phase 2 swap faces, easeOut 0.18s from -90° to 0°.
**Recommended action:** Create `CardBackView.swift`. Wire flip animation to `tapped` state in `CardFrameView` (contingent on CardDisplayState enum being created first).

### [PARTIAL] Section 4.4 — CLI tools partially present (3 of 6)
**File:** System CLI tools
**Current:** `ffmpeg` v8.0.1 present; `imagemagick (magick)` v7.1.2-13 present; `jq` v1.7.1 present. Missing: `pngquant`, `svgexport`, `license-plist`.
**Required:** All 6 tools present. Note: ImageMagick 7 uses `magick` command — scripts using bare `convert` need updating.
**Recommended action:** `brew install pngquant`, `npm install -g svgexport`, `brew install mono0926/license-plist/license-plist`. Audit scripts for bare `convert` usage and update to `magick`.

### [PARTIAL] Section 4.3 — SPM dependencies partially match guide spec
**File:** Xcode project package dependencies
**Current:** Supabase Swift SDK transitive dependencies present (`swift-http-types`, `swift-concurrency-extras`, etc.). `lottie-ios` and `Nuke` not confirmed present.
**Required:** `lottie-ios` (Apache 2.0), `Nuke` (MIT), `swift-collections` (Apache 2.0).
**Recommended action:** Verify in `ChaosCreatures.xcodeproj` whether lottie-ios and Nuke are present. Add if missing.

### [PARTIAL] Section 6.7 — Physical spring card drag exists but wrong constants
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Battle/BattleContainerView.swift`
**Current:** DragGesture present but not as a dedicated `DraggableCardView` struct. No resistance curve 0.72, no rotation `width * 0.025`, no spring `response: 0.38, dampingFraction: 0.62`.
**Required:** `DraggableCardView` with: resistance 0.72, rotation `width * 0.025`, scale 1.05 while dragging, shadow radius 16 while dragging, release spring `response: 0.38, dampingFraction: 0.62`.
**Recommended action:** Create `DraggableCardView.swift` per Section 6.7. Wire to `CardFrameView` for battle hand cards.

### [PARTIAL] Section 8 — Faction music 3 of 5 factions present; stem naming mismatch
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Sounds/Music/`
**Current:** `battle-ironwright.wav`, `battle-fey.wav`, `battle-demonic.wav`, `battle-tension.wav`, `menu-ambient.wav`. Missing: `battle-celestial.wav`, `battle-endless.wav`. Stem naming (`battle-{faction}.wav`) does not match `BattleAudioManager`'s lookup pattern (`{faction.rawValue.lowercased()}_{stem}`).
**Required:** 5 faction battle tracks plus adaptive stems per faction.
**Recommended action:** Source or generate `battle-celestial.wav` and `battle-endless.wav`. Fix stem naming convention to match BattleAudioManager's lookup.

### [PARTIAL] Section 8.1 — SFX sound set covers gameplay but not card-interaction sounds
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/` (19 `.wav` files)
**Current:** Covers card_play, attack, damage, death, chaos_roll, events, turn_start, victory/defeat, evolution_reveal. Missing: `card_draw.caf`, `card_flip.caf`, `card_summon.caf`, `card_graveyard.caf`, `wax_seal_tap.caf`, `foil_shimmer.caf`. All files in `.wav` format, not `.caf`.
**Required:** Section 8.1 sound vocabulary uses `.caf` format. Missing card-interaction sounds must be sourced from freesound.org CC0.
**Recommended action:** Convert all `.wav` to `.caf` using afconvert pipeline from Section 8.2. Source missing CC0 sounds. Update `BattleAudioManager.playSFX()` to look for `.caf` extension.

### [PARTIAL] Section 11.2 — Pipeline steps 1–2 partial; steps 3–24 not started
**File:** Project state assessment
**Current:** Step 1 (lock deployment parameters in iteration_log) done. Step 2 (environment setup) partial — some CLI tools present, Python libs absent, fonts conflict with guide spec, no verify script.
**Required:** All 24 pipeline steps complete in order.
**Recommended action:** Complete Section 4 environment gaps before attempting Steps 3+.

### [PARTIAL] Section 10.4 — Color palette defined but no WCAG contrast verification script
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/` (Color+Theme.swift)
**Current:** Color palette defined using hex values. Card text uses `#F0EAD6` on dark panels. No `Scripts/verify_contrast.py`. No contrast ratio calculated or documented.
**Required:** `Scripts/verify_contrast.py` checking 5 WCAG AA pairs: ink-black on parchment-light (4.5:1), parchment-dark on parchment-light (3:1 large text), ink-black on parchment-mid (4.5:1), ink-dark-mode on parchment-dark-mode (4.5:1), ink-black on canvas-warm (4.5:1).
**Recommended action:** Create `Scripts/verify_contrast.py` per Section 10.4. Run as part of every QA pass.

### [PARTIAL] Section 13.4 — Image cache exists but is UIImage-based, not MTLTexture LRU
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/ImageCacheService.swift`
**Current:** `NSCache<NSString, UIImage>` (50MB, 200 items) + `URLCache` (200MB disk). Well-implemented but handles `UIImage`, not `MTLTexture`. No memory warning observer triggers cache clear.
**Required:** Separate `TextureCache` for MTLTexture LRU eviction (20 textures, explicit `accessOrder` array, `evictAll()` on memory warning). The existing `ImageCacheService` should be kept for card art UIImages.
**Recommended action:** Create `TextureCache.swift` alongside (not replacing) `ImageCacheService`. Add `NotificationCenter` observer for `UIApplication.didReceiveMemoryWarningNotification` to `ImageCacheService` to call `clearMemoryCache()`.

### [PARTIAL] Section 5.4 — Refinement loop infrastructure: exists in guide, no iteration entries logged
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md` (single entry)
**Current:** Log exists with guide-read confirmation. No refinement loop entries. The three required scripts (screenshot_all_devices.sh, compare_screenshots.py, verify_asset.py) don't exist, making the 9-step loop impossible to execute.
**Required:** Every visual iteration logged with Section 12.3 8-axis critique template. Regression diff scores for all four devices.
**Recommended action:** Not yet applicable since implementation hasn't begun. Create missing scripts before visual implementation starts. Enforce loop discipline when iteration begins.

### [PARTIAL] Section 12.4 — Refinement rules not yet violated or enforced (pre-implementation)
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md`
**Current:** One entry only. No iterations run. `ScreenshotTests.swift` is a stub.
**Required:** One fix per loop, four-device build after any fix, three failures = blocked, never declare complete on iPhone alone, always include dark mode screenshot.
**Recommended action:** Rules become applicable once visual implementation begins. Missing four-device screenshot infrastructure is the primary blocker.

---

## ABSENT

### [ABSENT] Section 6.1 — OilPaintShader.metal (zero Metal shaders exist anywhere)
**File:** Not found (glob for `*.metal` found zero files in the entire project)
**Current:** No Metal shaders of any kind. The entire Metal shader pipeline is absent.
**Required:** `Sources/Shaders/OilPaintShader.metal` with fragment shader applying brushwork normal mapping, warm shadow lift, parchment age desaturation, and oil varnish specular. Driven by brushRoughness, varnishGloss, parchmentAge, lightDirection uniforms.
**Recommended action:** Create the Shaders/ directory. Implement all four Metal shaders from Section 6. Add to Xcode target. Prerequisite: MetalCardEffectView bridge and CardRenderer protocol must exist first.

### [ABSENT] Section 6.2 — ParchmentShader.metal
**File:** Not found
**Current:** Parchment texture applied via SwiftUI `Image("CardTextures/tex-parchment")` with `.blendMode(.overlay)`. Flat texture overlay, not a Metal fragment shader.
**Required:** `Sources/Shaders/ParchmentShader.metal` with fiber normal mapping, edge vignette, dark mode color branching via `colorScheme` uniform.
**Recommended action:** Implement after MetalCardEffectView bridge is complete.

### [ABSENT] Section 6.3 — WarmFoilShader.metal
**File:** Not found
**Current:** Foil implemented in SwiftUI via `RarityBorderModifier` overlaying `Image("RarityEffects/holographic-foil")` with `.blendMode(.overlay)` and offset from `GyroscopeManager`. Core Animation approach, not Metal.
**Required:** `Sources/Shaders/WarmFoilShader.metal` with tiltX/tiltY uniforms, organic sine UV distortion, luminance-based foil mask, warm iridescent additive blend. Existing SwiftUI overlay can remain as `staticOnly`-tier fallback.
**Recommended action:** `GyroscopeManager` already exists and provides tilt data — wire it to a Metal uniform instead of a SwiftUI offset.

### [ABSENT] Section 6.4 — InkSpreadKernel.metal (summoning animation)
**File:** Not found
**Current:** No ink spread compute shader. No summoning animation connected to card state transitions.
**Required:** `Sources/Shaders/InkSpreadKernel.metal` — compute kernel with organic noise at spread edge, progress-driven reveal 0.0 to 1.0 over 0.8s via CADisplayLink. Triggered by `CardDisplayState.summoning(progress:)`.
**Recommended action:** Implement after OilPaintShader and MetalCardEffectView are complete.

### [ABSENT] Section 5.5 / Section 6.5 — MetalCardEffectView SwiftUI bridge and CardRenderer protocol
**File:** Not found
**Current:** No `MetalCardEffectView: UIViewRepresentable`, no `CardRenderer` protocol, no `NullCardRenderer`, no `OilPaintCardRenderer`, no MTKView integration in any card view.
**Required:** `Sources/Effects/MetalCardEffectView.swift` and `Sources/Effects/CardRenderer.swift`. `NullCardRenderer` as default until `OilPaintCardRenderer` is built.
**Recommended action:** Create both files per Sections 5.5 and 6.5 before any Metal shader work. This is the architectural foundation for the Metal pipeline.

### [ABSENT] Section 6.9 — EffectTier enum and graceful degradation path
**File:** Not found
**Current:** No `EffectTier` enum. No `resolveEffectTier()` function.
**Required:** `Sources/Effects/EffectTier.swift` — enum with cases: full, shimmerOnly, staticOnly, minimal. `Comparable` conformance. `resolveEffectTier()` checking `UIAccessibility.isReduceMotionEnabled`, `MTLCreateSystemDefaultDevice()`, `CMMotionManager().isDeviceMotionAvailable`.
**Recommended action:** Create `EffectTier.swift` before `WaxSealView` and `MetalCardEffectView` to avoid compilation order issues.

### [ABSENT] Section 6.6b — Animated gradient borders: no `AnimatedGradientBorder` / `StaticBorder` components
**File:** Not found as standalone components
**Current:** Border animation logic embedded in `RarityBorderModifier` (lines 1640–1831) inside the 1,986-line file. No standalone `AnimatedGradientBorder` and `StaticBorder` components.
**Required:** Extracted standalone `AnimatedGradientBorder` and `StaticBorder` components that respect `@Environment(\.accessibilityReduceMotion)`.
**Recommended action:** Extract border animation components from `RarityBorderModifier`. Add Reduce Motion check.

### [ABSENT] Section 1.6 — CardDisplayState enum and 11 named state transitions
**File:** Not found
**Current:** No `CardDisplayState` enum anywhere. Card interactions handled locally in individual parent views, not in a state machine.
**Required:** `enum CardDisplayState: Equatable { case default, focused, selected, tapped, previewed, inGraveyard, summoning(progress: Float), foilActive(tiltX: Float, tiltY: Float), damaged(severity: Float) }`. All 11 transitions with precise duration and curve specifications.
**Recommended action:** Create `Sources/Models/CardDisplayState.swift`. Add `@State private var cardState: CardDisplayState = .default` to `CardFrameView`. Wire all 11 transitions. This gates all interactive animations.

### [ABSENT] Section 1.7 — Gesture priority stack on CardFrameView
**File:** Not found in card rendering files
**Current:** LongPressGesture and DragGesture exist in parent views (BattleContainerView, CollectionView) but not on CardFrameView itself. No explicit three-tier priority chain on the card view.
**Required:** On CardFrameView: `.highPriorityGesture(LongPressGesture(minimumDuration: 0.35))` for preview; `.gesture(DragGesture(minimumDistance: 8))` for repositioning; `.simultaneousGesture(TapGesture())` for select. Exactly this priority order.
**Recommended action:** Add the three-tier gesture stack to CardFrameView directly, not to parent containers.

### [ABSENT] Section 1.5 — Letterpress effect on all card text
**File:** Not found (partially present: card name only)
**Current:** `.shadow(color: .black.opacity(0.55), radius: 0.4, x: 0, y: 0.5)` on card name only (line 805). All other text elements lack letterpress treatment.
**Required:** All text: shadow offset x=0, y=0.5pt, blur 0.5pt, color parchment-dark at 60% opacity. Guide recommends custom `TextRenderer` or double-render (shadow pass + normal pass).
**Recommended action:** Apply uniform letterpress shadow to all text elements.

### [ABSENT] Section 1.5b — Spell, Stabilizer, Planar Ruin layout variants
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 658–688)
**Current:** Only variation by card type is the frame asset name. All card types use the same full-art card body.
**Required:** Switch on `card.type`: spell → omit stats bar, text box 107pt, omit wax seal, omit instability; stabilizer → no cost symbols, no ATK/HP/instability, lock icon in art box; planar ruin → HP-only stats bar, passive benefit panel + destruction penalty panel replacing text box.
**Recommended action:** Add `switch card.type` variant logic to CardFrameView that changes zone heights and visible elements. Contingent on CardFrameView architecture decision.

### [ABSENT] Section 1.4 — Chaos Mote symbols in name bar
**File:** Not found
**Current:** CM cost displayed as `CMBadgeView` — wax-seal-style badge at top-right corner. The guide specifies individual 16×16pt swirling orb symbols in the name bar.
**Required:** Individual 16×16pt swirling orb symbols (fiery red-orange blending into deep purple, turbulent swirl), 2pt spacing, right-aligned in name bar. AI-generated once as 32×32pt PNG at 3×.
**Recommended action:** Contingent on CardFrameView architecture decision. If zone-stack layout is adopted, replace CM badge with tiled chaos mote symbols in the name bar.

### [ABSENT] Section 1.9 — Error and fallback states (5 required, only 1 approximate present)
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 772–790, artPlaceholder)
**Current:** `artPlaceholder` shows a gradient rectangle with a `UIIcons/ui-hero` icon. No canvas-colored ink-wash pattern, no quill-pen icon, no torn-edge "???" placeholder, no Metal-unavailable handler, no shader error log.
**Required:** 5 fallback states: (1) artwork load failure → canvas-colored rectangle + procedural ink-wash + quill icon; (2) font failure → log + Georgia/Times New Roman fallback, never San Francisco; (3) Metal unavailable → staticOnly tier; (4) JSON parse error → torn-edge "???" placeholder; (5) shader compile failure → log to `Logs/shader_errors.log`, flat parchment-light fill.
**Recommended action:** Expand `artPlaceholder`. Add font fallback logic in CardFont.swift (currently falls back to system font). Add shader error log mechanism.

### [ABSENT] Section 2.1 — CardFaction enum with color extension
**File:** Not found
**Current:** `FactionShortName` enum exists in multiple files. No `CardFaction` enum with `var color: Color` extension using P3 named color assets. Faction color logic is scattered as inline `factionPrimaryBorderColor()` private functions with raw `Color(hex:)` values.
**Required:** `enum CardFaction: String, Codable` with `var color: Color { switch self { case .ironwright: return Color("antique-silver") ... } }` using named asset catalog colors.
**Recommended action:** Unify `FactionShortName` into `CardFaction` with the asset catalog color extension. Prerequisite: named color assets must be created first.

### [ABSENT] Section 2.2 — CardShaderUniforms struct and Rarity extensions
**File:** Not found
**Current:** No `CardShaderUniforms` struct. No `extension Card { var shaderUniforms }`. No `extension CardCondition { var brushRoughness, varnishGloss, parchmentAge }`. No `extension Rarity { var waxColor, glowSIMD, foilIntensity, glowIntensity, sealIconName, borderWidth, borderGradient }`.
**Required:** Full shader parameter mapping system from Section 2.2. All Rarity extensions must live in `Sources/Models/Card.swift`.
**Recommended action:** Create the entire shader-parameter system. This is prerequisite for Metal shader implementation.

### [ABSENT] Section 2.2 — Rarity.sealIconName and wax seal icon assets
**File:** Not found
**Current:** No `Rarity.sealIconName` property. No seal icon assets (`seal_common`, `seal_uncommon`, `seal_rare`, `seal_epic`, `seal_legendary`) in asset catalog.
**Required:** `var sealIconName: String` on Rarity. Seal icon assets in `Assets.xcassets/Icons/` downloaded via `Scripts/download_icons.sh`.
**Recommended action:** Implement `Rarity.sealIconName`. Download icons. Wire to `WaxSealView`.

### [ABSENT] Section 2.3 — CardDisplayState enum
**File:** Not found (confirmed by search)
**Current:** No `CardDisplayState` enum anywhere in codebase.
**Required:** `enum CardDisplayState: Equatable` with all 9 cases including associated values.
**Recommended action:** Create `Sources/Models/CardDisplayState.swift`. Foundation for all state transitions.

### [ABSENT] Section 2.4 — CardRepository and test card JSON files
**File:** Not found
**Current:** No `CardRepository` class. No `Resources/Cards/*.json` files. Card data sourced exclusively from Supabase via network.
**Required:** `CardRepository` singleton loading card data from `Resources/Cards/*.json`. Five test card JSON files (one per rarity, all 4 card types, at least 3 factions).
**Recommended action:** Create `Sources/Models/CardRepository.swift` and 5 test JSON files per Section 2.4. Implement as local development scaffold and offline fallback.

### [ABSENT] Section 3.2 — LoRA weight file at R2 URL not confirmed present
**File:** R2 storage (not a codebase file)
**Current:** `.env` has no `LORA_URL`. Training result JSON at `scripts/preview/sdxl-lora-training-result.json` suggests a training run completed on Replicate, but upload to R2 at the canonical path is not confirmed.
**Required:** `LORA_URL` in `.env`. File present at `https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors`.
**Recommended action:** Verify R2 upload. Add `LORA_URL` to `.env`. Run reachability check from Section 3.2.

### [ABSENT] Section 3.4 — `Scripts/grade_artwork.sh` (5-pass ImageMagick color grading)
**File:** Not found
**Current:** No color grading pipeline.
**Required:** 5-pass ImageMagick bash script: base warm-shift + vignette, then faction-specific passes (ironwright shadow, fey blue/green lift, demonic red push, celestial highlight lift, endless desaturation). Outputs to `Resources/CardArt/`.
**Recommended action:** Create `Scripts/grade_artwork.sh` per Section 3.4 specification.

### [ABSENT] Section 3.5 — `Scripts/generate_normal_map.sh` (RGB normal map from heightmap)
**File:** Not found
**Current:** No normal map generation script.
**Required:** Bash script converting grayscale heightmap to RGB normal map (R=X, G=Y, B=Z) using ImageMagick clone/roll/fx technique.
**Recommended action:** Create `Scripts/generate_normal_map.sh` per Section 3.5.

### [ABSENT] Section 3.5 — `Scripts/generate_wax_normal.py` (procedural wax seal normal map)
**File:** Not found
**Current:** Nothing.
**Required:** Python script (Pillow + numpy) generating 256×256 dome-shaped normal map for wax seal shader, saved to `Resources/Textures/wax_seal_normal.png`.
**Recommended action:** Create `Scripts/generate_wax_normal.py` per Section 3.5.

### [ABSENT] Section 3.6 — `Scripts/generate_foil_gradient.py` (warm iridescent gradient texture)
**File:** Not found
**Current:** Nothing.
**Required:** Python script (Pillow + numpy) generating 512×512 warm iridescent gradient texture (gold → amber → copper → bronze → gold) with sine wave vertical variation, saved to `Resources/Textures/foil_gradient.png`.
**Recommended action:** Create `Scripts/generate_foil_gradient.py` per Section 3.6.

### [ABSENT] Section 3.2 — `Scripts/prompt_utils.py` (shared prompt construction module)
**File:** Not found
**Current:** Prompt logic embedded individually in each `.mjs` script without a shared Python module.
**Required:** `Scripts/prompt_utils.py` with `FACTION_CREATURE_STYLE`, `SUBFACTION_CREATURE_STYLE`, `FACTION_NONCREATURE_STYLE`, `build_creature_prompt()`, `build_noncreature_prompt()`.
**Recommended action:** Create `Scripts/prompt_utils.py` from guide specification. Imported by all generation scripts.

### [ABSENT] Section 3.2 — `Scripts/verify_asset.py` (post-generation dimension verification)
**File:** Not found (also flagged by Audit C Section 5.7)
**Current:** Nothing. No asset dimension verification after generation.
**Required:** Python script verifying image dimensions (`--min-width`, `--min-height` flags), no JSON error payload, warm-tone check. Exits 0 on pass, 1 on fail. Called after every generation and evolution step.
**Recommended action:** Create `Scripts/verify_asset.py` per Sections 3.2 and 5.7.

### [ABSENT] Section 3.9 — `Resources/ASSET_LICENSE_MANIFEST.md`
**File:** Not found at project root
**Current:** No license manifest anywhere. No asset license tracking.
**Required:** Manifest table tracking every asset (filename, source URL, license, date, commercial OK, attribution required). Must exist from day one.
**Recommended action:** Create `Resources/ASSET_LICENSE_MANIFEST.md` and populate with existing card art assets.

### [ABSENT] Section 3.2 — `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png`
**File:** Not found (directory does not exist)
**Current:** `Resources/LegalEvidence/` directory does not exist at project root.
**Required:** Screenshot of EldritchPaletteKnife CivitAI model page (civitai.com/models/336656) showing commercial use permission state. Hard gate before artwork generation can proceed.
**Recommended action:** Human must visit the page, screenshot the license checkboxes, save to `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png`.

### [ABSENT] Section 4.1 — `Scripts/verify_environment.sh` (master environment check)
**File:** Not found
**Current:** Nothing. No master gate script.
**Required:** Shell script running all checks (Xcode, simulators, CLI tools, Python libs, API keys, API connectivity, legal gates). Exits 0 (pass) or 1 (fail) with `✓`/`✗`/`⚠` output.
**Recommended action:** Create `Scripts/verify_environment.sh` per Section 4.1. This is the single "am I ready to work?" gate.

### [ABSENT] Section 4.1 — Python libraries: Pillow, numpy, replicate, fal-client not installed
**File:** System Python environment
**Current:** All four packages absent from system Python.
**Required:** All four importable: Pillow (image verification, normal maps), numpy (foil gradient, wax normal), replicate (creature generation), fal-client (non-creature generation).
**Recommended action:** `pip3 install Pillow numpy requests replicate fal-client --break-system-packages`. Verify with single import test.

### [ABSENT] Section 4.4 — `Scripts/download_textures.sh` (Poly Haven PBR texture download)
**File:** Not found
**Current:** Nothing. No script to download parchment_paper and canvas_1 PBR textures.
**Required:** Script downloading from `dl.polyhaven.org`, saving to `Staging/textures/`, appending license entries to `Resources/ASSET_LICENSE_MANIFEST.md`.
**Recommended action:** Create `Scripts/download_textures.sh` per Section 4.4.

### [ABSENT] Section 4.4 — `Scripts/cleanup_staging.sh` and `Makefile`
**File:** Not found
**Current:** No `Staging/` directory. No `Makefile` at project root.
**Required:** `Scripts/cleanup_staging.sh` deleting files older than 24h. `Makefile` with `clean-staging` and `clean-all` targets.
**Recommended action:** Create both per Section 4.4.

### [ABSENT] Section 4.5 — `Scripts/load_env.sh` (shared environment loader)
**File:** Not found
**Current:** Individual scripts load `.env` files directly with no shared loader.
**Required:** `Scripts/load_env.sh` that sources root `.env` and prints loaded/total key count. Used at start of all generation scripts.
**Recommended action:** Create `Scripts/load_env.sh` per Section 4.5.

### [ABSENT] Section 4.6 — `Assets.xcassets/Textures/` group with ASTC compression
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/`
**Current:** No dedicated `Textures/` group. `CardTextures` group exists but lacks required imagesets. No `"compression-type": "automatic"` in any imageset's `Contents.json`.
**Required:** `Textures/` group with: `parchment_base`, `parchment_normal`, `brush_normal`, `foil_gradient`, `wax_seal_normal`, `canvas_base` imagesets. Each with ASTC compression enabled.
**Recommended action:** Create `Textures/` group and imagesets. Create and run `Scripts/set_astc_compression.py` on all texture imagesets.

### [ABSENT] Section 4.9 — `Sources/Views/SmokeTestCardView.swift`
**File:** Not found
**Current:** No smoke test view.
**Required:** SwiftUI view exercising all 6 required fonts, parchment texture, name bar, art box placeholder, type line, text box, stats bar, rarity color bar. Must compile and render on all 4 simulators.
**Recommended action:** Create `Sources/Views/SmokeTestCardView.swift` per Section 4.9 specification. Note: uses guide-specified fonts — contingent on font decision.

### [ABSENT] Section 7 — HapticEngine class (entire haptic system absent)
**File:** Not found
**Current:** No `HapticEngine.swift`, no `CoreHaptics` import, no `CHHapticEngine`, no `UIImpactFeedbackGenerator` in any iOS Swift file.
**Required:** `final class HapticEngine` singleton with `CHHapticEngine`. `func prepare()`, `func play(ahapNamed:)`, `func impact(_ style:)` per Section 7 Swift block.
**Recommended action:** Create `ChaosCreatures/ChaosCreatures/Services/HapticEngine.swift`. All haptic work carries ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.

### [ABSENT] Section 7.2 — All 6 AHAP files (Resources/Haptics/ directory does not exist)
**File:** Not found
**Current:** No `Resources/Haptics/` directory. No `.ahap` files anywhere.
**Required:** `card_flip.ahap`, `card_summon.ahap`, `card_graveyard.ahap`, `foil_shimmer.ahap` (generated by script), `epic_reveal.ahap`, `legendary_reveal.ahap` — all in `Resources/Haptics/`. Smoke test checks for these explicitly.
**Recommended action:** Create `Resources/Haptics/` directory and all 6 AHAP files. Create `Scripts/generate_foil_shimmer_ahap.py` for the procedurally generated shimmer pattern.

### [ABSENT] Section 8.2 — `Scripts/download_sounds.sh` (automated CC0 sound download)
**File:** Not found
**Current:** `scripts/AUDIO-SOURCING-GUIDE.md` provides manual instructions only. No automated script.
**Required:** `Scripts/download_sounds.sh` using Freesound API with `FREESOUND_API_KEY` to download CC0 sounds and log to `Resources/ASSET_LICENSE_MANIFEST.md`.
**Recommended action:** Create `Scripts/download_sounds.sh` per Section 8.2.

### [ABSENT] Section 9.3 — Stage Manager: UIApplicationSupportsMultipleScenes is false
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Config/Info.plist` (line 27)
**Current:** `UIApplicationSupportsMultipleScenes = false`. No scene size observation.
**Required:** Enable multiple scenes for Stage Manager. Observe `UIScene.didActivateNotification` to re-compute layout from current window bounds.
**Recommended action:** Enable multiple scenes in Info.plist. Add scene-size observation in root views. Note: this is a significant architectural change.

### [ABSENT] Section 9.4 — Landscape iPad: portrait-only orientation, no CardHandSpreadView
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Config/Info.plist` (`UISupportedInterfaceOrientations`)
**Current:** Portrait-only. No landscape orientation support. No `CardHandSpreadView`.
**Required:** iPad supports landscape left and right. Separate `CardHandSpreadView` for landscape (not rotated portrait layout).
**Recommended action:** Add landscape orientation support to Info.plist for iPad. Implement `CardHandSpreadView`.

### [ABSENT] Section 10.1 — VoiceOver: no accessibility modifiers on CardFrameView
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (1,986 lines)
**Current:** No `.accessibilityLabel()`, `.accessibilityElement()`, `.accessibilityHint()`, `.accessibilityAddTraits()`, or `.accessibilityCustomActions()` anywhere in the file.
**Required:** `.accessibilityElement(children: .ignore)`, `.accessibilityLabel(card.voiceOverLabel)`, `.accessibilityHint("Double-tap to select. Long-press to preview.")`, `.accessibilityAddTraits(.isButton)`, `.accessibilityCustomActions` for "Preview card" and "Show card details".
**Recommended action:** Add all accessibility modifiers. Critical for App Store approval.

### [ABSENT] Section 10.1 — `voiceOverLabel` computed property on card model
**File:** Not found in any model file
**Current:** No `voiceOverLabel` on `CardDisplayData`, `CardInstance`, or `CardTemplate`.
**Required:** `var voiceOverLabel: String` concatenating name, cost, type, ATK/HP, instability, ability text, and flavor text per guide Section 10.1 implementation.
**Recommended action:** Add `voiceOverLabel` to `CardDisplayData`. All required fields are already present on that struct.

### [ABSENT] Section 10.2 — Dynamic Type: no UIFontMetrics scaling in font system
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Config/CardFont.swift`
**Current:** All font functions take hardcoded `size: CGFloat` parameter. No `UIFontMetrics` scaling anywhere.
**Required:** `scaledFont(name:textStyle:baseSize:)` using `UIFontMetrics(forTextStyle:).scaledFont(for:)`. Text box scroll region must expand at XXL sizes.
**Recommended action:** Add `scaledFont()` to CardFont for text box content (ability text, flavor text). Frame-zone text (card name, stats) may be exempt due to fixed proportions. Consult owner on scope.

### [ABSENT] Section 10.3 — Reduce Motion: no `accessibilityReduceMotion` checks anywhere
**File:** Not found in any iOS Swift file
**Current:** No `@Environment(\.accessibilityReduceMotion)` or `UIAccessibility.isReduceMotionEnabled` check in any file. All animations run unconditionally.
**Required:** All animation sites must check reduce motion. `GyroscopeManager` must disable tilt tracking when reduce motion is enabled. Guide pattern: `withAnimation(reduceMotion ? .none : .spring(...)) { ... }`.
**Recommended action:** Add reduce motion checks to all animation sites in CardFrameView (rarity pulse, shimmer, gyroscope foil parallax) and to GyroscopeManager. Apple App Store requirement.

### [ABSENT] Section 10.4 — CardAccessibilityTests XCTest
**File:** Not found in UITests target
**Current:** `ChaosCreaturesUITests` has stub files only (ScreenshotTests.swift, BattleFlowUITests.swift). No AccessibilityTests.swift.
**Required:** `Tests/AccessibilityTests.swift` with `CardAccessibilityTests: XCTestCase` and `testCardViewHasAccessibilityLabel()`. Also requires `accessibilityIdentifier("CardView")` on CardFrameView.
**Recommended action:** Create test file. Add `accessibilityIdentifier("CardView")` to CardFrameView alongside accessibility label work.

### [ABSENT] Section 5.3 — `Scripts/screenshot_all_devices.sh` (multi-device screenshot automation)
**File:** Not found
**Current:** No screenshot automation script. 60+ art generation scripts exist but no simulator screenshot script.
**Required:** Script booting 4 simulators (iPhone 15 Pro, iPhone 12, iPad Pro 12.9 6th gen, iPad Air 5th gen), capturing screenshots from each, verifying nonzero output, printing dimensions.
**Recommended action:** Create `Scripts/screenshot_all_devices.sh` per Section 5.3 before beginning any visual refinement iterations.

### [ABSENT] Section 5.2 — Metal shader warning check in build tooling
**File:** Not found
**Current:** No CI or build script checks for Metal shader compile warnings.
**Required:** `xcodebuild ... 2>&1 | grep -E "warning:|error:" | grep -i "metal\|shader"` after every Metal shader file change.
**Recommended action:** Add Metal shader warning check to build validation scripts once Metal shaders are implemented.

### [ABSENT] Section 12.2 — `Scripts/compare_screenshots.py` (visual regression script)
**File:** Not found
**Current:** No visual regression script. `validate-art-quality.mjs` and `validate-evolution-quality.mjs` exist but test generation output, not rendered UI.
**Required:** Python script (Pillow) loading reference and current screenshots, resizing to 400×560, computing normalized pixel diff, passing if score < 0.025, outputting JSON with score/threshold/pass/fail.
**Recommended action:** Create `Scripts/compare_screenshots.py` per Section 12.2.

### [ABSENT] Section 12.5 — Exit criteria checklist not evaluated for any component
**File:** Not found
**Current:** None of the 13 exit criteria have been evaluated. No critique scores, no regression diffs, no GPU frame time measurements, no haptic logs, no VoiceOver checks.
**Required:** All 13 criteria must pass before any card component is declared complete.
**Recommended action:** Track the checklist in `Logs/iteration_log.md` as implementation progresses.

### [ABSENT] Section 11.1 — `Logs/BUDGET_LEDGER.md`
**File:** Not found at `/Users/alexali/Projects/chaos-creatures/Logs/BUDGET_LEDGER.md`
**Current:** Nothing. No API spend tracking.
**Required:** `Logs/BUDGET_LEDGER.md` tracking all API calls: cost per call, session totals, cumulative vs. budget. Budget allocation table (creatures 35%, non-creature 25%, iterations 15%, parallax 15%, textures 5%, reserve 5%).
**Recommended action:** Create `Logs/BUDGET_LEDGER.md` immediately.

### [ABSENT] Section 11 — `Logs/DEPENDENCY_DECISIONS.md`
**File:** Not found
**Current:** Nothing. No documentation of authorized deviations from guide spec.
**Required:** Document fal.ai FLUX.1 Dev commercial license decision, LoRA source/license decision, and any other authorized deviations.
**Recommended action:** Create `Logs/DEPENDENCY_DECISIONS.md`. Document the existing fal.ai Kontext evolution pipeline as an authorized variant.

### [ABSENT] Section 11 — QA baseline screenshots not committed
**File:** Not found
**Current:** `Tests/ReferenceScreenshots/` directory does not exist. No baseline screenshots committed.
**Required:** Baseline screenshots in `Tests/ReferenceScreenshots/{iPhone15Pro,iPhone12,iPadPro,iPadAir}/` for all four devices in both light and dark mode.
**Recommended action:** After smoke test passes, run `Scripts/screenshot_all_devices.sh` and commit baselines to establish regression anchor.

### [ABSENT] Section 11 — Project-root `Resources/` directory structure
**File:** `/Users/alexali/Projects/chaos-creatures/Resources/` (does not exist)
**Current:** iOS resources live in `ChaosCreatures/ChaosCreatures/Resources/`. No project-root `Resources/` for pipeline outputs.
**Required:** `Resources/CardArt/`, `Resources/Fonts/`, `Resources/Icons/`, `Resources/Textures/`, `Resources/Sounds/`, `Resources/Haptics/`, `Resources/Cards/`, `Resources/ASSET_LICENSE_MANIFEST.md`, `Resources/LegalEvidence/`.
**Recommended action:** Create project-root `Resources/` directory structure. Files consumed by the iOS app bundle are copied from here into `ChaosCreatures/ChaosCreatures/Resources/`.

### [ABSENT] Section 13.3 — No SKTextureAtlas usage for small assets
**File:** Not found
**Current:** No `SKTextureAtlas` usage. No `.atlas` bundle in Resources. SpriteKit nodes load textures individually.
**Required:** Texture atlases for all small SpriteKit assets (icons, mana symbols, wax seals) to reduce draw calls.
**Recommended action:** Create texture atlas for SpriteKit small assets. Optimization — implement after baseline performance measured.

### [ABSENT] Section 13.2 — No preferredFramesPerSecond setting on SKView
**File:** Not found
**Current:** No `preferredFramesPerSecond` on any `SKView`. No frame rate enforcement or measurement.
**Required:** `skView.preferredFramesPerSecond = 60`. GPU frame time < 8ms on iPhone 12 (hard limit). These require both enforcement and Instruments measurement.
**Recommended action:** Set `preferredFramesPerSecond = 60` on `SKView` in `BattleScene`. Add human profiling checklist to iteration log after each phase.

### [ABSENT] Section 13.3 — Memory warning handler not wired to cache clear
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/ImageCacheService.swift`
**Current:** `clearMemoryCache()` and `clearAllCaches()` methods exist but nothing triggers them on memory pressure.
**Required:** `NotificationCenter.default.addObserver` for `UIApplication.didReceiveMemoryWarningNotification` calling `clearMemoryCache()`. Must also call `TextureCache.shared.evictAll()` once TextureCache is created.
**Recommended action:** Add memory warning observer to `ImageCacheService`. This prevents app termination on low-memory devices.

### [ABSENT] Section 14 — `Scripts/compare_screenshots.py` and reference baseline
**File:** Not found (also flagged under Section 12.2)
**Current:** No regression framework. `Logs/iteration_log.md` has no structured critique entries.
**Required:** Screenshot regression script, four-device reference directories, structured critique log with 8-axis template.
**Recommended action:** All Section 14 quality bar criteria are currently unverifiable — blocked by missing Metal shaders, P3 palette, letterpress effect, and dark mode. Address Section 6 and Section 1 gaps first.

### [ABSENT] Section 13.1 — `Logs/Performance/` directory and Instruments profiling notes
**File:** Not found
**Current:** No `Logs/Performance/` directory. No profiling notes or human gate entries in iteration log.
**Required:** At end of every phase, write human profiling checklist to `Logs/iteration_log.md`. Create `Logs/Performance/` for `.xctrace` output.
**Recommended action:** Create `Logs/Performance/`. Add profiling checklist template to iteration log at end of each implementation phase.

---

## COMPLIANT

| Section | Item | File |
|---------|------|------|
| §3.3b | fal.ai Kontext evolution pipeline exists (functional intent matches) | `scripts/evolve-kontext-lora.mjs`, `evolve-all-kl.mjs` |
| §4.5 | `.env` file exists and is gitignored | `/Users/alexali/Projects/chaos-creatures/.env` |
| §5.6 | `Logs/iteration_log.md` exists with guide-read confirmation | `/Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md` |
| §5.6 | CHECKPOINT.md files exist in all 6 module directories | Project root + 5 module directories |
| §8.3 | AVAudioEngine used for music (matches guide architecture) | `ChaosCreatures/ChaosCreatures/Services/BattleAudioManager.swift` |
| §8 (SFX) | SFX set covers primary gameplay interactions (19 files) | `Resources/Sounds/SFX/` |
| §11 | `Logs/` directory exists with core files | `/Users/alexali/Projects/chaos-creatures/Logs/` |
| §13.5 | App Store compliance: AsyncImage CDN approach keeps download size small | Project architecture |

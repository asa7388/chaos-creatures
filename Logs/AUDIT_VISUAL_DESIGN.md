# AUDIT_VISUAL_DESIGN.md
## Audit Agent A — Visual & Design (Sections 1, 2, 6, 9, 14)
## Date: 2026-02-22
## Supersedes: AUDIT_VISUAL_DESIGN.md dated 2026-02-21 (archived to docs/archive/)

This audit compares the current iOS codebase against the CARD_DESIGN_GUIDE.md
for Sections 1 (Aesthetic System), 2 (Card Schema), 6 (Effects & Animations),
9 (iPad Layout), and 14 (Quality Bar).

### Mandatory Documents Read
- docs/CARD_DESIGN_GUIDE.md — Sections 1, 2, 6, 9, 14
- docs/GRIMDARK_AESTHETIC_DIRECTIVE.md — full
- docs/CRITIQUE_SCORING_GUIDE.md — full

### Files Examined
- `ChaosCreatures/Views/Components/CardFrameView.swift` (1300+ lines)
- `ChaosCreatures/Views/Components/CardView.swift`
- `ChaosCreatures/Views/Components/CardBackView.swift`
- `ChaosCreatures/Views/Components/DraggableCardView.swift`
- `ChaosCreatures/Config/CardPalette.swift`
- `ChaosCreatures/Config/CardFont.swift`
- `ChaosCreatures/Models/CardTheme.swift`
- `ChaosCreatures/Models/CardGuideEnums.swift`
- `ChaosCreatures/Models/CardDisplayState.swift`
- `ChaosCreatures/Extensions/Color+Theme.swift`
- `ChaosCreatures/Effects/WaxSealView.swift`
- `ChaosCreatures/Effects/InstabilityBadgeView.swift`
- `ChaosCreatures/Effects/ParallaxCardArtView.swift`
- `ChaosCreatures/Effects/EffectTier.swift`
- `ChaosCreatures/Effects/CardParticleFactory.swift`
- `ChaosCreatures/Services/GyroscopeManager.swift`
- `ChaosCreatures/Shaders/OilPaintShader.metal`
- `ChaosCreatures/Shaders/ParchmentShader.metal`
- `ChaosCreatures/Shaders/WarmFoilShader.metal`
- `ChaosCreatures/Shaders/InkSpreadKernel.metal`
- `ChaosCreatures/Config/Info.plist`
- `ChaosCreatures/Views/Debug/SmokeTestCardView.swift`
- All 16 `.colorset` files in Assets.xcassets
- Glob/grep searches for MTKView, MetalCardEffectView, CardRenderer, CardBacklightView, HapticEngine, CHHapticEngine, .ahap files

---

## SECTION 1 — Aesthetic System & Design Language

---

### [COMPLIANT] Section 1.2 — P3 Color Palette (16 named tokens in Asset Catalog)

**File:** `ChaosCreatures/Config/CardPalette.swift` + 16 `.colorset` files in `Assets.xcassets`
**Current:** All 16 guide-mandated palette tokens exist as named Asset Catalog colorsets using Display P3 color space: `parchment-light`, `parchment-mid`, `parchment-dark`, `ink-black`, `canvas-warm`, `wax-red`, `wax-blue`, `wax-green`, `fey-teal`, `rot-moss`, `aged-gold`, `antique-silver`, `epic-amethyst`, `legendary-ember`, `parchment-dark-mode`, `ink-dark-mode`. CardPalette.swift provides `Color("token-name")` accessors. Dark mode variants (`parchment-light` <-> `parchment-dark-mode`, `ink-black` <-> `ink-dark-mode`) are correctly configured.
**Verdict:** Exact match to Section 1.2 specification.

---

### [COMPLIANT] Section 1.3 — Dark Mode via CardTheme Object

**File:** `ChaosCreatures/Models/CardTheme.swift`
**Current:** `CardTheme` struct takes `colorScheme: ColorScheme` and provides: `cardBase`, `nameBarBackground`, `typeLineBackground`, `textBoxBackground`, `statsBarBackground`, `primaryText`, `secondaryText`, `flavorText`, `letterpressShadowColor`, `outerBorder`. All switch between P3 named tokens based on color scheme. CardFrameView reads `@Environment(\.colorScheme)` and creates `CardTheme(colorScheme: colorScheme)`.
**Verdict:** Matches Section 1.3 centralized dark mode switching requirement.

---

### [COMPLIANT] Section 1.4 — Zone-Stack Layout Architecture

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 254-266
**Current:** Zone-stack VStack layout with proportional zone heights: Name Bar 8.5%, Art Box 44.9%, Type Line 6.1%, Text Box 29.9%, Stats Bar 7.0%, Rarity Bar 1.4%. Card aspect ratio is 210:294 (5:7). GeometryReader computes card width dynamically.
**Verdict:** Architecture matches Section 1.4 zone-stack specification.

---

### [CONFLICT] Section 1.4 — Creature Layout Uses Full-Bleed ZStack Instead of Zone-Stack VStack

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 545-584
**Current:** The creature layout (`creatureLayout`) uses a full-bleed art ZStack with the text panel zones overlaid at the bottom. Art fills the full card height instead of the 45% Art Box zone. Spell, stabilizer, and planar ruin layouts correctly use VStack zone-stack.
**Required:** Section 1.4 specifies a consistent VStack zone-stack for all card types where art is confined to the Art Box zone (45% of card height).
**Recommended action:** Confirm with owner whether creature full-bleed overlay is an intentional design choice or should match the zone-stack pattern used by other card types. If the guide is authoritative, creature layout needs conversion to VStack zone-stack.

---

### [CONFLICT] Section 1.4 — Stats Bar Height Is 7% Not 5%

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` line 264
**Current:** `ZoneHeight.statsBar = 0.070` (~21pt at 294pt card height). Comment notes: "increased for badge visibility."
**Required:** Section 1.4 specifies Stats Bar at 5% (~15pt / 294pt).
**Recommended action:** The 7% was likely a deliberate choice for badge legibility at small card sizes. Confirm if this is an approved deviation. If not, reduce to 0.051.

---

### [COMPLIANT] Section 1.4 — Rarity Color Bar Present

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 1087-1115
**Current:** Rarity color bar is the bottom zone at 1.4% height. Colors use named palette tokens: common=`parchment-mid`, uncommon=`antique-silver`, rare=`aged-gold` gradient, epic=`epic-amethyst` gradient, legendary=`legendary-ember`/`aged-gold` gradient.
**Verdict:** Matches Section 1.4 rarity bar specification.

---

### [COMPLIANT] Section 1.4 — Card Type Layout Variants

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 527-656
**Current:** Four layout variants implemented: creature (full-bleed ZStack), spell (no stats bar, expanded text box), stabilizer (no cost, lock icon in art box, expanded text box), planar ruin (HP only, passive + destruction panels). Spell and stabilizer use `textBoxExpanded` height (36.4%).
**Verdict:** All four variants present with correct structural differences per Section 1.5b. (Creature ZStack vs VStack conflict noted separately above.)

---

### [PARTIAL] Section 1.4 — Wax Seal Placed on Type Line Instead of Stats Bar

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` line 852
**Current:** WaxSealView is placed right-aligned on the type line zone, at `28 * scale` size.
**Required:** Section 1.4 specifies wax seal at x=164, y=258 in 210x294pt coordinates, overlapping the stats bar, at 34x34pt.
**Recommended action:** Move wax seal from type line to stats bar zone. Increase size to 34pt at reference scale.

---

### [COMPLIANT] Section 1.5 — Typography Font Set (Cinzel + EB Garamond + Oswald)

**File:** `ChaosCreatures/Config/CardFont.swift` + `Config/Info.plist`
**Current:** All six required fonts registered in Info.plist: Cinzel-Regular.ttf, Cinzel-Bold.ttf, EBGaramond-Regular.ttf, EBGaramond-Italic.ttf, EBGaramond-SemiBold.ttf, Oswald-Bold.ttf. CardFont provides semantic aliases matching the Section 1.5 zone table: cardName=Cinzel-Bold 13pt, cardType=Cinzel-Regular 10pt, abilityText=EBGaramond-Regular 11pt, flavorText=EBGaramond-Italic 10pt, keywordName=EBGaramond-SemiBold 11pt, statNumber=Oswald-Bold 13pt. Fallback chain: Cinzel->Georgia, EBGaramond->TimesNewRoman, Oswald->Impact. Never San Francisco.
**Verdict:** Exact match to Section 1.5 specification.

---

### [COMPLIANT] Section 1.5 — Letterpress Shadow on All Card Text

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 270-288
**Current:** `LetterpressShadow` ViewModifier applies shadow(color: parchment-dark 60% opacity, radius: 0.5, x: 0, y: 0.5). Applied via `.letterpressShadow()` extension to all card text: name bar, type line, ability text, flavor text, keywords, stat numbers, collector number.
**Verdict:** Matches Section 1.5 letterpress specification. Shadow uses CardTheme-aware color switching for dark mode.

---

### [COMPLIANT] Section 1.6 — CardDisplayState Transitions

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 403-497
**Current:** StateTransform struct maps each CardDisplayState case to scale, opacity, saturation, brightness, shadowRadius, shadowY, yOffset. Values match: focused=scale 1.02, shadowRadius 12, yOffset -2; selected=scale 0.97; inGraveyard=opacity 0.3, saturation 0, brightness -0.15, yOffset 20. Two-phase flip animation (easeIn 0.17s to 90 degrees, swap face, easeOut 0.18s from -90 to 0). Shake animation for damaged state.
**Verdict:** Matches Section 1.6 state transition specification.

---

### [COMPLIANT] Section 1.7 — Gesture Priority Stack

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 373-399
**Current:** Three-tier gesture stack on card content: `.highPriorityGesture(LongPressGesture(minimumDuration: 0.35))` for preview; `.gesture(DragGesture(minimumDistance: 8))` for repositioning; `.simultaneousGesture(TapGesture())` for select. Exact priority order as specified.
**Verdict:** Exact match to Section 1.7.

---

### [COMPLIANT] Section 1.8 — Card Back Design

**File:** `ChaosCreatures/Views/Components/CardBackView.swift`
**Current:** Canvas-warm base, 8pt woven grid pattern (ink-black 8% opacity), centered 40pt wax-red circle with radial gradient, specular highlight ellipse (white 30% at top), "CC" embossed text, parchment-mid 3pt border, 12pt corner radius. Flip animation wired in CardFrameView handleTap() with two-phase rotation.
**Verdict:** Matches Section 1.8 card back specification.

---

### [COMPLIANT] Section 1.9 — Art Fallback States

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 796-833
**Current:** `artFallback` renders canvas-warm rectangle + procedural crosshatch pattern (ink-black 8% opacity, 12pt spacing) + centered quill pen system icon (pencil.and.outline) at 35% parchment-dark opacity.
**Verdict:** Matches Section 1.9 artwork load failure fallback. (Uses SF Symbol instead of game-icons.net asset but fulfills the same purpose.)

---

### [PARTIAL] Section 1.9 — Font Fallback (Georgia/TimesNewRoman)

**File:** `ChaosCreatures/Config/CardFont.swift` lines 223-263
**Current:** Font fallback chain is Cinzel->Georgia, EBGaramond->TimesNewRoman, Oswald->Impact. However, if all named fonts AND all named fallbacks fail, the final fallback is `.systemFont()` which would produce San Francisco — violating the guide's "never San Francisco" rule.
**Required:** The final fallback should be Georgia/TimesNewRoman, never system font.
**Recommended action:** Change the `.systemFont()` terminal fallbacks to use named serif fonts instead. The probability of this path executing is low (requires both custom font and named fallback to fail), but the guide is explicit.

---

## SECTION 2 — Card Data Schema & Templating System

---

### [COMPLIANT] Section 2.1 — Card Struct (All Required Fields)

**File:** `ChaosCreatures/Models/CardGuideEnums.swift` lines 387-491
**Current:** `Card` struct contains all Section 2.1 fields: id, name, type, subtypes, rarity (Rarity enum), faction (CardFaction enum), subFaction, cost, attack, hp, instability, abilityText, modifiers, triggeredAbilities, flavorText, artworkAssetName, artworkLineage, artworkArtist, frameStyle, foil, evolutionDirection, setCode, collectorNumber, condition (CardCondition), inkColor (InkColor), ruinPassiveText, ruinDestructionPenaltyText. Computed properties: shaderUniforms, ruinHP, voiceOverLabel.
**Verdict:** Exact match to Section 2.1 specification.

---

### [COMPLIANT] Section 2.1 — CardFaction Enum

**File:** `ChaosCreatures/Models/CardGuideEnums.swift` lines 23-119
**Current:** `enum CardFaction: String, Codable, CaseIterable, Identifiable` with cases: ironwright, fey, demonic, celestial, endless. Raw values match DB strings. Provides displayName, shortDisplayName, mechanic, emblemAssetName, swiftUIColor, primaryUIColor, accentUIColor, frameTintUIColor.
**Verdict:** Matches Section 2.1. (Note: `swiftUIColor` uses Color+Theme.swift sRGB hex colors for faction UI, not the P3 palette tokens. This is acceptable because faction colors in the guide palette are for wax seal/icon tint only, not broad UI use.)

---

### [COMPLIANT] Section 2.2 — CardShaderUniforms Struct

**File:** `ChaosCreatures/Models/CardGuideEnums.swift` lines 374-381
**Current:** `CardShaderUniforms` with fields: brushRoughness, varnishGloss, parchmentAge, foilIntensity, glowIntensity, glowColor (SIMD4<Float>). Card.shaderUniforms computed property derives values from condition and rarity.
**Verdict:** Exact match to Section 2.2.

---

### [COMPLIANT] Section 2.2 — Rarity Extensions (waxColor, glowSIMD, foilIntensity, etc.)

**File:** `ChaosCreatures/Models/CardGuideEnums.swift` lines 236-322
**Current:** All Rarity extensions defined in one place: waxColor (5 P3 named colors), glowSIMD (5 SIMD4 values), foilIntensity (0/0.3/0.6/0.8/1.0), glowIntensity (0/0/0.5/0.75/1.0), sealIconName (seal_common through seal_legendary), borderWidth (3/3.5/4/4/4), borderGradient (palette token gradients).
**Verdict:** Matches Section 2.2. Architecture rule followed: "All Rarity extensions defined here, not scattered across view files."

---

### [COMPLIANT] Section 2.2 — CardCondition Shader Parameter Mapping

**File:** `ChaosCreatures/Models/CardGuideEnums.swift` lines 330-362
**Current:** CardCondition enum (mint/played/worn/ancient) with brushRoughness (0.3/0.55/0.75/0.95), varnishGloss (0.8/0.5/0.25/0.1), parchmentAge (0.0/0.3/0.65/1.0).
**Verdict:** Exact match to Section 2.2 condition table.

---

### [COMPLIANT] Section 2.3 — CardDisplayState Enum (9 Cases)

**File:** `ChaosCreatures/Models/CardDisplayState.swift`
**Current:** 9-case enum: `default`, focused, selected, tapped, previewed, summoning(progress: Float), foilActive(tiltX: Float, tiltY: Float), damaged(severity: Float), inGraveyard. Equatable conformance. Extensive doc comments with transition timing.
**Verdict:** Exact match to Section 2.3.

---

### [PARTIAL] Section 2.4 — CardRepository and Test Card JSON Files

**File:** Not found as standalone file.
**Current:** No `CardRepository` singleton or `Resources/Cards/*.json` files exist. Card data is sourced from Supabase via `CollectionService` / `CardTemplate` models. However, CardDisplayData struct (in CardFrameView.swift) provides conversion inits from CardTemplate, CardInstance, BattleCreatureData, and BattleCardData. The Card struct has `init(from template: CardTemplate)` with many TODO placeholders.
**Required:** Section 2.4 specifies a local CardRepository loading from JSON for development and offline testing.
**Recommended action:** Low priority. The network-first architecture works for live use. Consider adding test card JSON fixtures for Xcode Preview and snapshot testing.

---

## SECTION 6 — Effects & Animations

---

### [COMPLIANT] Section 6.1 — OilPaintShader.metal

**File:** `ChaosCreatures/Shaders/OilPaintShader.metal`
**Current:** Fragment shader with: brush normal tiling at 4x, warm shadow lift (warmReflect float3(0.15, 0.08, 0.02)), parchment age sepia desaturation, oil varnish specular (float3(1.0, 0.95, 0.80) * spec * 0.25). Uniforms: brushRoughness, varnishGloss, parchmentAge, lightDirection.
**Verdict:** Exact match to Section 6.1 specification.

---

### [COMPLIANT] Section 6.2 — ParchmentShader.metal

**File:** `ChaosCreatures/Shaders/ParchmentShader.metal`
**Current:** Fragment shader with: physical paper scale UV tiling (cardSize/256.0), fiber normal mapping at 5% diffuse strength, four-edge vignette via smoothstep(0.65, 1.0) * 0.45, age darkening, dark mode branching (float3(0.25, 0.18, 0.10)). Uniforms: cardSize, ageAmount, colorScheme.
**Verdict:** Exact match to Section 6.2 specification.

---

### [COMPLIANT] Section 6.3 — WarmFoilShader.metal

**File:** `ChaosCreatures/Shaders/WarmFoilShader.metal`
**Current:** Fragment shader with: tilt-driven UV offset, organic sine distortion (sin at 7.3, cos at 6.8 frequencies, 0.018 amplitude), luminance-based foil mask (sin(lum * pi)), warm iridescent additive blend at * 0.45. Uniforms: tiltX, tiltY, intensity.
**Verdict:** Exact match to Section 6.3 specification.

---

### [COMPLIANT] Section 6.5 — InkSpreadKernel.metal

**File:** `ChaosCreatures/Shaders/InkSpreadKernel.metal`
**Current:** Compute kernel with: organic noise at spread edge (two-frequency hash noise), edgeWidth 0.12 + noise * 0.08, smoothstep reveal from 0.0 to 1.0. Bounds check for out-of-range thread positions. Uniforms: progress (float), origin (float2).
**Verdict:** Exact match to Section 6.5 specification.

---

### [ABSENT] Section 6.5 — MetalCardEffectView (MTKView UIViewRepresentable Bridge)

**File:** Not found.
**Current:** No `MetalCardEffectView: UIViewRepresentable` struct exists. No `MTKView` integration anywhere in the codebase. The four Metal shaders exist as source code but are NOT connected to any rendering pipeline. Grep for `MTKView`, `MetalCardEffectView`, and `CardRenderer` found zero results outside EffectTier.swift (which only references Metal for capability detection).
**Required:** Section 6.5 specifies `MetalCardEffectView: UIViewRepresentable` wrapping MTKView with Coordinator implementing MTKViewDelegate. This is the bridge that connects the shaders to actual card rendering.
**Recommended action:** This is the #1 critical gap. Without this bridge, all four Metal shaders are dead code. Create `Sources/Effects/MetalCardEffectView.swift` per Section 5.5 code. Add `CardRenderer` protocol and `NullCardRenderer` as safe default. Wire to CardFrameView art box zone.

---

### [ABSENT] Section 6.6 — CardBacklightView (Behind-Card Glow Layer)

**File:** Not found.
**Current:** Rarity glow is implemented as `.shadow()` modifiers on the card face (line 510-511 in CardFrameView.swift): `shadow(color: rarityGlowColor.opacity(glowIntensity * 0.6), radius: glowIntensity * 8)`. This is a drop shadow, not a separate behind-card glow layer.
**Required:** Section 6.6 specifies `CardBacklightView` — a separate view layer positioned BEHIND the card that provides the rarity glow effect. This is architecturally different from a shadow modifier: it should be a radial gradient or blurred shape placed in the ZStack behind CardFrameView.
**Recommended action:** Create `CardBacklightView` as a separate component. The current .shadow() approach visually approximates the effect but is not architecturally correct. Low visual priority but important for layered rendering when cards overlap.

---

### [COMPLIANT] Section 6.6 — WaxSealView Component

**File:** `ChaosCreatures/Effects/WaxSealView.swift`
**Current:** Loads AI-generated seal images by `seal_[factionSlug]_[raritySlug]` naming convention. 25 total images (5 factions x 5 rarities). Default size 34pt. Glow shadow for rare+ cards with 1.8s easeInOut repeating animation. Fallback: programmatic circle with "!" indicator and console warning.
**Verdict:** Functionally correct per Section 6.6. Uses AI-generated images instead of programmatic construction, which is an improvement over the guide's RadialGradient + icon approach.

---

### [COMPLIANT] Section 6.6b — InstabilityBadgeView

**File:** `ChaosCreatures/Effects/InstabilityBadgeView.swift`
**Current:** D20 base image 22x22pt, Oswald-Bold 9pt white text, black 60% opacity shadow, y=-1 offset.
**Verdict:** Exact match to Section 6.6b specification.

---

### [PARTIAL] Section 6.6b — AnimatedRarityBorder (Reduce Motion)

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 1146-1190
**Current:** `AnimatedRarityBorder` implements rotating AngularGradient for Epic/Legendary cards. Legendary rotates at 3.0s, Epic at 4.5s. DOES check `UIAccessibility.isReduceMotionEnabled` on appear and sets static rotation=45 when true.
**Required:** Section 6.6b requires Reduce Motion check. This is implemented.
**Partial because:** The colors array uses raw `Color(hex:)` values (e.g., "#FFD700", "#9B59B6") instead of the guide's named palette tokens (`aged-gold`, `epic-amethyst`). The colors are visually close but not sourced from the P3 palette.
**Recommended action:** Replace hex colors in AnimatedRarityBorder with `Color("aged-gold")`, `Color("epic-amethyst")`, `Color("legendary-ember")` palette tokens.

---

### [COMPLIANT] Section 6.7 — DraggableCardView (Physical Spring Drag)

**File:** `ChaosCreatures/Views/Components/DraggableCardView.swift`
**Current:** Drag resistance 0.72, rotation width * 0.025, scale 1.05 while dragging, shadow radius 16 while dragging, spring response 0.38 damping 0.62 on release. Wraps CardFrameView.
**Verdict:** Exact match to Section 6.7 specification.

---

### [COMPLIANT] Section 6.8 — CardParticleFactory (Rarity Particles)

**File:** `ChaosCreatures/Effects/CardParticleFactory.swift`
**Current:** All emitter parameters match Section 6.8 table: uncommon 2/s lifetime 4s, rare 5/s lifetime 3s, epic 8/s lifetime 3.5s, legendary 14/s lifetime 2s. All use `.alpha` blend mode. Correct particle colors from named palette tokens. CardParticleView UIViewRepresentable wrapper provides SwiftUI integration.
**Verdict:** Exact match to Section 6.8 specification. ".alpha blend mode, never .add" rule followed.

---

### [COMPLIANT] Section 6.9 — EffectTier Enum and Graceful Degradation

**File:** `ChaosCreatures/Effects/EffectTier.swift`
**Current:** Four tiers: minimal (Reduce Motion), staticOnly (no Metal), shimmerOnly (no gyroscope), full. Comparable conformance. `resolveEffectTier()` checks UIAccessibility.isReduceMotionEnabled, MTLCreateSystemDefaultDevice(), CMMotionManager().isDeviceMotionAvailable — in correct priority order.
**Verdict:** Exact match to Section 6.9 specification.

---

### [COMPLIANT] Section 6 — ParallaxCardArtView

**File:** `ChaosCreatures/Effects/ParallaxCardArtView.swift`
**Current:** Two-layer parallax: background shifts -6pt, foreground shifts +10pt. Uses GyroscopeManager.shared. Reference-counted start/stop via onAppear/onDisappear. Single-image variant included with 1.5pt blur on background pass.
**Verdict:** Matches Section 6.4 parallax specification.

---

### [PARTIAL] Section 6 — GyroscopeManager (30Hz vs 60Hz, Tilt Range)

**File:** `ChaosCreatures/Services/GyroscopeManager.swift`
**Current:** Singleton with reference-counted start/stop. CMMotionManager on device, sine-wave fallback in Simulator. Update interval: 30Hz (1.0/30.0).
**Required:** Section 6.3 specifies 60Hz update rate. Section 6.3 also specifies tilt clamped to -0.6...0.6. Current implementation normalizes to -1...1 (full tilt at pi/4).
**Recommended action:** Change updateInterval to 1.0/60.0. Change normalization to clamp at -0.6...0.6 (maxAngle = 0.6 instead of pi/4). The 30Hz rate was likely a power-saving choice; 60Hz provides smoother foil shimmer. The wider tilt range means more extreme foil displacement than specified.

---

### [ABSENT] Section 6 — HapticEngine and AHAP Files

**File:** Not found.
**Current:** No HapticEngine.swift, no CHHapticEngine integration, no .ahap files anywhere in the project. Zero CoreHaptics usage.
**Required:** Section 7.1 specifies HapticEngine singleton with CHHapticEngine, six AHAP files (card_flip, card_summon, card_graveyard, foil_shimmer, epic_reveal, legendary_reveal).
**Recommended action:** Create HapticEngine.swift and six AHAP files. This is a Phase 7 task per the implementation plan. Requires physical device verification (haptics cannot be tested in Simulator).

---

### [PARTIAL] Section 6 — Color+Theme.swift Uses sRGB Not P3

**File:** `ChaosCreatures/Extensions/Color+Theme.swift`
**Current:** `Color(hex:)` initializer uses `.sRGB` color space (line 127). All faction colors, UI theme colors, and rarity colors in this file are sRGB hex values. The ATK badge uses `#FF8F00` and HP badge uses `#E53935` — ad-hoc colors not from the Section 1.2 palette.
**Required:** Card-visible colors should use P3 palette tokens. The `Color(hex:)` extension is appropriate for non-card UI but should not be used for card rendering.
**Recommended action:** The stats bar in CardFrameView lines 1033 and 1049 use `Color(hex: "#FF8F00")` and `Color(hex: "#E53935")` directly. These should either use named palette tokens or be documented as intentional badge accent colors outside the palette. The broader Color+Theme.swift file is fine for non-card UI screens.

---

## SECTION 9 — iPad Layout

---

### [PARTIAL] Section 9.1 — Size Class Handling

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` line 303, `Views/Collection/DeckBuilderView.swift` line 12
**Current:** `@Environment(\.horizontalSizeClass)` is read in CardFrameView and DeckBuilderView. CardFrameView uses it in `computedCardWidth()` (line 344: iPad gets `width * 0.55` vs iPhone `width * 0.85`). This is basic scaling, not the full layout branching required.
**Required:** Section 9.1 specifies separate view bodies based on size class: compact -> SingleCardFocusView, regular+portrait -> CardHandArcView, landscape -> CardHandSpreadView.
**Recommended action:** The current implementation provides basic iPad scaling but not the architectural separation the guide requires. CardHandArcView and CardHandSpreadView do not exist. This is a later-phase concern (Phase 8+) after core card rendering is complete.

---

### [PARTIAL] Section 9.2 — Card Sizing via GeometryReader

**File:** `ChaosCreatures/Views/Components/CardFrameView.swift` lines 316-349
**Current:** GeometryReader resolves card width from available space. Aspect ratio locked at 210:294 (5:7). For grid/hand sizes: iPhone gets `min(availableWidth * 0.85, 320)`, iPad gets `min(availableWidth * 0.55, 500)`. For detail/fullscreen: returns `min(geometry.size.width, 500)`.
**Required:** Section 9.2 specifies `isCompact ? min(availableWidth * 0.85, 260) : min(availableWidth * 0.40, 350)`. Reference size table: in-hand iPhone 95x133pt, in-hand iPad portrait 130x182pt.
**Recommended action:** The multipliers differ slightly (0.55 vs 0.40 for iPad, 320 vs 260 max for iPhone). Adjust to match guide values. Low priority — the current approach is functional and proportional.

---

### [ABSENT] Section 9.3 — Stage Manager and Multiple Scenes

**File:** Info.plist line 25
**Current:** `UIApplicationSupportsMultipleScenes` exists in Info.plist but value is `false`. Landscape orientation IS supported (UIInterfaceOrientationLandscapeLeft and LandscapeRight in Info.plist lines 32-33). No scene-size observation for split view.
**Required:** Section 9.3 specifies enabling multiple scenes and testing in Stage Manager floating window mode, 1/3, 1/2, 2/3 split view widths.
**Recommended action:** Enable multiple scenes in Info.plist. Add scene-size observation. This is significant architectural work; defer to Phase 8+.

---

## SECTION 14 — Quality Bar

---

### [PARTIAL] Section 14 — Visual Regression Framework

**File:** `scripts/screenshot_all_devices.sh` exists.
**Current:** The screenshot script exists but there is no `Scripts/compare_screenshots.py` (Pillow-based pixel diff). No `Tests/ReferenceScreenshots/` directory with baseline images for the four required devices.
**Required:** Section 14 specifies pixel diff with 0.025 threshold, baseline screenshots for iPhone 15 Pro, iPhone 12, iPad Pro, iPad Air in both light and dark mode.
**Recommended action:** Create compare_screenshots.py. Capture baseline screenshots on all four simulators. This gates the quality bar process for all future visual iterations.

---

### [ABSENT] Section 14 — Physical Quality Test Prerequisites

**File:** N/A
**Current:** The physical quality test ("does a screenshot make an observer want to reach out and touch the card?") cannot be fully assessed until the Metal shader bridge (MetalCardEffectView) connects the oil paint, parchment, and foil shaders to actual card rendering. Currently the card uses SwiftUI-only rendering: parchment base color, async image loading, SwiftUI shadow and gradient effects. The Metal shaders are source code only.
**Required:** Artwork at native @3x through Metal shaders. Parchment grain visible. No aliased edges. 60fps on iPhone 12.
**Recommended action:** This is entirely blocked by the missing MetalCardEffectView bridge. Address Section 6.5 gap first.

---

### [ABSENT] Section 14 — Structured Critique Log

**File:** `Logs/iteration_log.md` exists but does not use Section 12.3 template.
**Current:** iteration_log.md has session entries but not the 8-axis structured critique template (Material believability, Color temperature, Texture grain, Typography letterpress, Lighting consistency, Tactile impression, iPad vs iPhone, Dark mode).
**Required:** Every visual iteration logged with the Section 12.3 template, regression diff scores for all four devices.
**Recommended action:** Adopt structured critique template for all future visual phases.

---

## SUMMARY

| Category | COMPLIANT | PARTIAL | CONFLICT | ABSENT |
|----------|-----------|---------|----------|--------|
| Section 1 — Aesthetic System | 10 | 2 | 2 | 0 |
| Section 2 — Card Schema | 5 | 1 | 0 | 0 |
| Section 6 — Effects | 9 | 3 | 0 | 2 |
| Section 9 — iPad Layout | 0 | 2 | 0 | 1 |
| Section 14 — Quality Bar | 0 | 1 | 0 | 2 |
| **TOTALS** | **24** | **9** | **2** | **5** |

**Total findings: 40**

---

## TOP 5 MOST CRITICAL GAPS (Ordered by Impact)

### 1. MetalCardEffectView Bridge — Section 6.5 (ABSENT)
All four Metal shaders (OilPaint, Parchment, WarmFoil, InkSpread) exist as source files and exactly match the guide spec. But there is NO MTKView-based UIViewRepresentable bridge to connect them to SwiftUI. Without this, the shaders are dead code and the card renders with flat SwiftUI colors instead of the guide's physical material effects. This is the single most impactful missing component. Approximate work: ~200 lines of Swift (MetalCardEffectView + Coordinator + CardRenderer protocol + NullCardRenderer).

### 2. Creature Full-Bleed Layout vs Zone-Stack — Section 1.4 (CONFLICT)
Creature cards use a full-bleed art ZStack with overlaid text panel, while the guide specifies a VStack zone-stack where art is confined to the 45% Art Box zone. This is the only card type that diverges; spell, stabilizer, and planar ruin all use VStack. Owner decision needed: is the full-bleed creature design an intentional creative choice, or should it match the other layouts?

### 3. HapticEngine — Section 7 (ABSENT)
Zero CoreHaptics integration. No HapticEngine singleton, no AHAP files. The guide specifies six haptic patterns for card interactions. This is a Phase 7 task requiring physical device testing. Approximate work: ~150 lines Swift + 6 AHAP JSON files.

### 4. GyroscopeManager Parameters — Section 6.3 (PARTIAL)
Update rate is 30Hz (should be 60Hz). Tilt normalization is -1...1 (should be clamped -0.6...0.6). Both affect foil shimmer quality and are quick fixes (~5 lines changed).

### 5. AnimatedRarityBorder Colors — Section 6.6b (PARTIAL)
Uses raw hex colors instead of P3 palette tokens. Quick fix: replace 12 hex strings with named Color("token") references. Low effort, high correctness impact.

---

## COMPARISON TO PREVIOUS AUDIT (2026-02-21)

The previous audit found **0 COMPLIANT, 4 PARTIAL, 15 CONFLICT, 20 ABSENT** across the same sections.
This audit finds **24 COMPLIANT, 9 PARTIAL, 2 CONFLICT, 5 ABSENT**.

Major items resolved since previous audit:
- P3 color palette: 16 named colorsets created (was CONFLICT, now COMPLIANT)
- CardTheme dark mode object: Created (was CONFLICT, now COMPLIANT)
- Zone-stack layout: Implemented for 3 of 4 card types (was CONFLICT, now COMPLIANT for architecture)
- Typography: EBGaramond + Oswald font set installed (was CONFLICT, now COMPLIANT)
- Letterpress shadow: Applied to all text (was ABSENT, now COMPLIANT)
- CardDisplayState: 9-case enum created (was ABSENT, now COMPLIANT)
- Gesture priority stack: Implemented (was ABSENT, now COMPLIANT)
- Card back: CardBackView created with flip animation (was PARTIAL, now COMPLIANT)
- All four Metal shaders: Created with exact guide spec values (was ABSENT, now COMPLIANT as source)
- Card struct: Full Section 2.1 fields implemented (was ABSENT, now COMPLIANT)
- CardShaderUniforms: Created (was ABSENT, now COMPLIANT)
- Rarity extensions: All in one file (was ABSENT, now COMPLIANT)
- DraggableCardView: Created (was PARTIAL, now COMPLIANT)
- CardParticleFactory: Created with .alpha blend mode (was ABSENT, now COMPLIANT)
- EffectTier: Created (was ABSENT, now COMPLIANT)

Remaining work is primarily the Metal rendering bridge (MetalCardEffectView) and haptics — these are Phase 3 and Phase 7 tasks respectively.

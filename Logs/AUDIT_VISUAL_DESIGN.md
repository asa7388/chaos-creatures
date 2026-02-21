# AUDIT_VISUAL_DESIGN.md
## Audit Agent A — Sections 1, 2, 6, 9, 14
## Date: 2026-02-21

This audit compares the current iOS codebase against the CARD_DESIGN_GUIDE.md for Sections 1, 2, 6, 9, and 14.

Files examined:
- `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (1986 lines)
- `/ChaosCreatures/ChaosCreatures/Views/Components/CardView.swift`
- `/ChaosCreatures/ChaosCreatures/Models/CardTemplate.swift`
- `/ChaosCreatures/ChaosCreatures/Models/CardInstance.swift`
- `/ChaosCreatures/ChaosCreatures/Config/CardFont.swift`
- `/ChaosCreatures/ChaosCreatures/Config/Info.plist`
- `/ChaosCreatures/ChaosCreatures/Services/GyroscopeManager.swift`
- `/ChaosCreatures/ChaosCreatures/SpriteKit/Utilities/ParticleEffects.swift`
- `/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/` (all subdirs)
- All Swift files in Views/, Models/, Services/, SpriteKit/
- Glob searches for *.metal files (none found)
- Searches for CardRepository, CardShaderUniforms, CardRenderer, HapticEngine, EffectTier, CardDisplayState, WaxSealView, MetalCardEffectView

---

## SECTION 1 — Aesthetic System & Design Language

---

### [CONFLICT] Section 1.2 — P3 color palette not in asset catalog as named colors

**File:** `/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/` — no `.colorset` folders found
**Current:** All color tokens are hardcoded as hex strings inline in Swift code (e.g., `Color(hex: "#F0EAD6")`, `Color(hex: "#3C301E")`). No named color assets matching the guide's 16 palette tokens (`parchment-light`, `parchment-mid`, `parchment-dark`, `ink-black`, `wax-red`, `fey-teal`, `rot-moss`, `aged-gold`, `antique-silver`, `epic-amethyst`, `legendary-ember`, `canvas-warm`, `parchment-dark-mode`, `ink-dark-mode`) exist anywhere in the asset catalog or codebase. Colors referenced in `CardFrameView.swift` use a bespoke `Color(hex:)` extension with raw hex values that differ from guide spec.
**Required:** All 16 named palette tokens defined as `Color(UIColor(displayP3Red: r, green: g, blue: b, alpha: 1))` in P3 color space, registered in the asset catalog as `.colorset` files with Display P3 color space. All card code references these by name, e.g., `Color("parchment-light")`.
**Recommended action:** Create all 16 `.colorset` entries in the asset catalog. Replace all raw hex strings in CardFrameView with `Color("token-name")` lookups. Verify the hex values in the existing code map to the guide's P3 equivalents — several appear to be different hues (e.g., `#3C301E` for panel background versus the guide's `parchment-dark-mode` `#2A2015`).

---

### [CONFLICT] Section 1.3 — Dark mode: no CardTheme object; scattered inline handling

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (entire file)
**Current:** No `@Environment(\.colorScheme)` usage detected in any card rendering file. No `CardTheme` object exists. Dark mode aesthetic is not implemented. The `parchment-dark-mode` and `ink-dark-mode` tokens are not referenced anywhere.
**Required:** A `CardTheme` object that switches the full palette in one place based on `@Environment(\.colorScheme)`. Dark mode renders as "candlelit manuscript" — deep warm brown card body, warm cream text. No scattered `if colorScheme == .dark` conditionals allowed.
**Recommended action:** Create `Sources/Models/CardTheme.swift`. Add `@Environment(\.colorScheme) var colorScheme` to `CardFrameView`. Route all color lookups through `CardTheme`.

---

### [CONFLICT] Section 1.4 — Card layout proportions do not match guide specification

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` lines 14-61
**Current:** `CardDisplaySize` defines four sizes: grid (112×157pt), hand (90×130pt), detail (280×392pt), fullscreen (350×490pt). The layout is a full-art overlay with a name plate badge at top-left, wax-seal stat badges at corners, and a lower-thirds text panel. There are NO distinct zones for Name Bar (25pt), Art Box (132pt), Type Line (18pt), Text Box (88pt), Stats Bar (15pt), or Rarity Color Bar (4pt) as proportional measurements. The guide's reference size is 210×294pt with 5:7 ratio and a top-down zone stack. The app instead uses a full-art bleed design with overlaid elements.
**Required:** 210×294pt reference size with precise zone measurements: outer border 3pt, Name Bar 8.5% (~25pt), Art Box 45% (~132pt), Type Line 6% (~18pt), Text Box 30% (~88pt), Stats Bar 5% (~15pt), Rarity Color Bar 1.5% (~4pt). Corner radius 12pt. Text box is a scrollable region.
**Recommended action:** The existing design is an intentional variation from the guide (full-art with overlay badges). Before implementing the guide's zoned layout, confirm with the owner whether the existing design or the guide's zone-stack design is canonical. If the guide is authoritative, CardFrameView requires a complete rewrite. If the existing design is the intended final form, the guide's Section 1.4 measurements are superseded by this implementation.

---

### [CONFLICT] Section 1.4 — Rarity color bar absent; rarity border treatment differs

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (RarityBorderModifier, lines 1640–1831)
**Current:** Rarity is expressed as a border treatment using `RarityBorderModifier` — overlay strokes (silver for uncommon, gold for rare, gradient for epic, prismatic for legendary) with glows and holographic-foil overlays. No 4pt rarity color bar at the bottom of the inner content area.
**Required:** 4pt `Rarity Color Bar` at the bottom of the inner content area (y=282, height=4pt). Border weight by rarity: Common 3pt, Uncommon 3.5pt, Rare 4pt with outer glow (4pt, aged-gold, 40% opacity), Epic 4pt with amethyst-to-deep-purple animated gradient, Legendary 4pt with ember-to-gold animated gradient.
**Recommended action:** Add the rarity color bar as a fixed-height strip at the bottom of the card inner area. Current border treatments have the right idea but deviate on specifics (guide specifies `aged-gold` gradient for Rare, not `#FFD700`; guide uses `epic-amethyst` token, current uses the color directly).

---

### [ABSENT] Section 1.4 — Chaos Mote symbols in name bar (right-aligned symbol icons)

**File:** Not found
**Current:** Chaos mote cost is displayed as a `CMBadgeView` — a wax-seal-style badge at the top-right corner of the card. The guide specifies individual 16×16pt swirling orb symbols in the name bar, right-aligned, up to 7 shown, with "N+" overflow text.
**Required:** Circular swirling orb symbols (16×16pt, fiery red-orange blending into deep purple, turbulent swirl pattern), 2pt spacing between them, right-aligned in the name bar (25pt tall zone). AI-generated once as 32×32pt PNG at 3× resolution.
**Recommended action:** The wax-seal CM badge is a different design decision. If the guide is authoritative, replace the CM badge with tiled chaos mote symbols in the name bar.

---

### [CONFLICT] Section 1.4 — Type line zone structure and faction icon implementation

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` lines 1097–1118 (typeLineRow)
**Current:** Type line appears inside the lower-thirds text panel as a row with type text left-aligned and instability indicator right-aligned. Uses `Fira Sans` (uiLabelBold). Faction icon is shown as a watermark emblem in the text panel area, not as a 14×14pt icon left-aligned on the type line with `.renderingMode(.template)` and faction color tint.
**Required:** Dedicated 18pt-tall type line zone between art box and text box. Faction icon 14×14pt left-aligned with `.renderingMode(.template)` and `.foregroundColor(card.faction.color)`. Set symbol 14×14pt right-aligned. Type text in Cinzel-Regular 10pt center.
**Recommended action:** Type line zone needs to exist as a discrete layout region, not embedded in the text panel. Faction icon needs to use template rendering mode with the proper named faction color.

---

### [CONFLICT] Section 1.4 — Stats bar: ATK/HP format and instability icon differ

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` lines 1280–1350 (ATK/HP badge overlays)
**Current:** ATK and HP are displayed as separate wax-seal-style circular badges (`ATKBadgeView`, `HPBadgeView`) positioned at the bottom-left and bottom-right of the card, straddling the art/panel boundary. No 15pt stats bar zone. No collector number or set code visible in the card UI.
**Required:** 15pt stats bar (y=267) with: instability display left (D20 icon + numeral in Oswald-Bold 10pt, faction color 80% opacity); collector number Cinzel-Regular 7pt parchment-mid center-left; "ATK / HP" right-aligned in Oswald-Bold 13pt. Wax seal overlaps stats bar at x=164, y=258, 34×34pt.
**Recommended action:** The wax-seal badge approach is distinct from the guide's stats bar. The current design is more visually elaborate but structurally divergent. Confirm intended design before implementing guide spec.

---

### [CONFLICT] Section 1.5 — Typography: wrong fonts in use

**File:** `/ChaosCreatures/ChaosCreatures/Config/CardFont.swift` lines 1–255
**Current:** The app uses four font families: Cinzel (headings/names), Alegreya (body/flavor), Bebas Neue (stat numerals), Fira Sans (UI labels/secondary text). The `Info.plist` registers: `Cinzel-Variable.ttf`, `Alegreya-Variable.ttf`, `Alegreya-Italic-Variable.ttf`, `BebasNeue-Regular.ttf`, `FiraSans-Regular.ttf`, `FiraSans-SemiBold.ttf`.
**Required:** Guide specifies exactly: Cinzel-Regular, Cinzel-Bold (headings, name bar, type line, collector number); EBGaramond-Regular, EBGaramond-Italic, EBGaramond-SemiBold (ability text, flavor text, keywords); Oswald-Bold (ATK/HP stats and numbers). Info.plist must register these six specific files: `Cinzel-Regular.ttf`, `Cinzel-Bold.ttf`, `EBGaramond-Regular.ttf`, `EBGaramond-Italic.ttf`, `EBGaramond-SemiBold.ttf`, `Oswald-Bold.ttf`.
**Recommended action:** This is a fundamental conflict. The codebase uses Alegreya + Bebas Neue + Fira Sans; the guide mandates EB Garamond + Oswald. All body text, flavor text, keyword styling, and stat numerals would need to change fonts. The guide also uses only two font families for card elements (Cinzel + EB Garamond), while the codebase uses four. Confirm with owner which font set is canonical.

---

### [ABSENT] Section 1.5 — Letterpress effect on all card text

**File:** Not found (partially present)
**Current:** `CardFrameView.swift` applies a `.shadow(color: .black.opacity(0.55), radius: 0.4, x: 0, y: 0.5)` to the card name only (line 805). Other text elements do not have letterpress shadows.
**Required:** All text on the card must have letterpress treatment: shadow offset x=0, y=0.5pt, blur 0.5pt, color parchment-dark at 60% opacity (light mode). Guide recommends custom `TextRenderer` or double-render (shadow pass + normal pass) rather than system drop shadow.
**Recommended action:** Apply uniform letterpress shadow to all text elements: type line, ability text, flavor text, collector number, ATK/HP stats.

---

### [ABSENT] Section 1.5b — Spell layout variant (no art box removal; text box expansion)

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` lines 658–688
**Current:** The `frameAssetName` property returns `"CardFrames/\(factionKey)-spell"` for spell cards, applying a different frame asset. However, the spell layout still uses the same full-art card body with art layer and text panel. The guide's spell layout omits the stats bar entirely (text box expands to 107pt = 88pt + 19pt) and omits the wax seal rarity indicator.
**Required:** Spell cards: no stats bar, text box 107pt tall, no wax seal, no instability display. Stabilizers: no cost symbols, no HP/ATK/instability in stats bar; lock icon in bottom-right of art box. Planar Ruins: HP-only stats bar (HP = cost×3+1), passive benefit panel + destruction penalty panel replacing text box; no wax seal on neutral ruins.
**Recommended action:** Add `switch card.type { case .spell: ... case .stabilizer: ... case .planarRuin: ... case .creature: ... }` variant logic to `CardFrameView` that changes the zone heights and visible elements. Currently the only variation is the frame asset name.

---

### [ABSENT] Section 1.6 — State transition animations (11 named states)

**File:** Not found
**Current:** No `CardDisplayState` enum exists anywhere in the codebase. No state machine for focused/selected/tapped/previewed/inGraveyard/summoning/foilActive/damaged states was found. Card interactions are handled locally in individual views (e.g., BattleContainerView has some gesture handling, CollectionView has basic taps).
**Required:** Full `CardDisplayState` enum: default, focused, selected, tapped, previewed, inGraveyard, summoning(progress: Float), foilActive(tiltX: Float, tiltY: Float), damaged(severity: Float). Each of the 11 state transitions has precise duration, curve, and property specifications (shadow, scale, opacity, rotation).
**Recommended action:** Create `Sources/Models/CardDisplayState.swift` with the enum. Add `@State private var cardState: CardDisplayState = .default` to `CardFrameView`. Wire all 11 transitions per Section 1.6 table.

---

### [ABSENT] Section 1.7 — Gesture priority ordering

**File:** Not found in card rendering files
**Current:** In `BattleContainerView.swift` and `CollectionView.swift`, `LongPressGesture` and `DragGesture` appear, but not in CardFrameView itself. No `.highPriorityGesture(LongPressGesture(minimumDuration: 0.35))` on the card view with the explicit three-tier priority chain from the guide.
**Required:** On `CardView`/`CardFrameView`: `.highPriorityGesture(LongPressGesture(minimumDuration: 0.35))` for preview; `.gesture(DragGesture(minimumDistance: 8))` for repositioning; `.simultaneousGesture(TapGesture())` for select. Exactly this priority order.
**Recommended action:** Add the three-tier gesture stack to CardFrameView directly, not to parent containers.

---

### [PARTIAL] Section 1.8 — Card back design

**File:** `/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/CardBacks/` (contains 7 imagesets)
**Current:** Card back assets exist: `card-back-universal.imageset`, `card-back-celestial.imageset`, `card-back-demonic.imageset`, `card-back-endless.imageset`, `card-back-fey.imageset`, `card-back-ironwright.imageset`, `card-back-chaos.imageset`. Assets are present but there is no `CardBackView` Swift component or flip animation implementation.
**Required:** Card back must have canvas texture (woven grid), centered wax seal (40pt diameter with game sigil), deep wax-red seal, parchment-mid border. A `CardBackView` must be implemented. The two-phase flip animation (Phase 1: easeIn 0.17s to 90°, Phase 2: swap faces, easeOut 0.18s from -90° to 0°) must be wired to the `tapped` card state.
**Recommended action:** Create `CardBackView.swift` compositing the universal card back asset. Implement the flip animation in `CardFrameView` using the two-phase pattern from Section 1.6. Currently the assets exist but are unused in the card component.

---

### [ABSENT] Section 1.9 — Error and fallback states

**File:** Not found in card rendering
**Current:** The art placeholder in `CardFrameView` (line 772–790) shows a gradient rectangle with a `UIIcons/ui-hero` icon. This is the `artPlaceholder` view, which lacks the guide's requirements: no canvas-colored rectangle with ink-wash pattern, no quill-pen icon from `game-icons.net`, no "???" torn-edge placeholder for JSON parse errors.
**Required:** Five distinct fallback states: (1) artwork load failure → canvas-colored rectangle + ink-wash + quill icon; (2) custom font failure → log error, fall back to Georgia/Times New Roman (not San Francisco); (3) Metal unavailable → `staticOnly` tier; (4) JSON parse error → torn-edge "???" placeholder; (5) shader compile failure → log to `Logs/shader_errors.log`, flat parchment-light fill + standard shadow.
**Recommended action:** Expand `artPlaceholder` to match guide spec. Add font fallback logic in CardFont.swift (currently falls back to `systemFont` which violates the guide). No shader error logging file or mechanism exists.

---

## SECTION 2 — Card Data Schema & Templating System

---

### [CONFLICT] Section 2.1 — CardTemplate struct does not match guide spec

**File:** `/ChaosCreatures/ChaosCreatures/Models/CardTemplate.swift` lines 1–76
**Current:** `CardTemplate` (Codable, Identifiable, Equatable) has: id, name, cardType, factionId (UUID, not CardFaction enum), baseAttack, baseHealth, baseInstability, manaCost, baseKeywords ([String]), spellEffect, stabilizerType, artPrompt, artUrl, flavorText, batchId, approvedAt, approvedBy, isLegendaryEligible, createdAt. Missing many fields the guide requires.
**Required (from guide Section 2.1):** Card struct requires: rarity (Rarity enum), faction (CardFaction enum, not UUID), subFaction (CardSubFaction enum), cost (Int?), attack (Int?), hp (Int?), instability (Int), abilityText (String), modifiers ([String]), triggeredAbilities ([String]), artworkAssetName (String), artworkLineage ([String]), artworkArtist (String?), frameStyle (FrameStyle enum), foil (Bool), evolutionDirection (EvolutionDirection?), setCode (String), collectorNumber (String), condition (CardCondition), inkColor (InkColor), ruinPassiveText (String?), ruinDestructionPenaltyText (String?).
**Recommended action:** The existing CardTemplate is a DB-backed model for the pipeline, while the guide's `Card` struct is for runtime card display. Determine whether to extend CardTemplate or create a separate displayable `Card` struct as specified in the guide. The guide's `CardFaction` enum (ironwright/fey/demonic/celestial/endless) vs. the codebase's `FactionShortName` enum (ironwright/feyCourts/demonicKingdoms/celestialCrusade/theEndless) have matching concepts but divergent naming conventions.

---

### [ABSENT] Section 2.1 — CardFaction enum with color extension not present

**File:** Not found
**Current:** The codebase uses `FactionShortName` enum (in multiple files). No `CardFaction` enum with a `var color: Color { switch self { ... } }` extension using P3 named colors from the asset catalog exists. The faction color logic is scattered across `CardFrameView.swift` as inline `factionPrimaryBorderColor()` private functions returning raw hex `Color(hex:)` values.
**Required:** `enum CardFaction: String, Codable { case ironwright, fey, demonic, celestial, endless }` with `var color: Color { switch self { case .ironwright: return Color("antique-silver") ... } }` using named asset catalog colors.
**Recommended action:** Unify `FactionShortName` and the guide's `CardFaction` into a single enum with the asset catalog color extension. Currently faction colors are duplicated across CardFrameView's private methods using hardcoded hex instead of the P3 named tokens.

---

### [ABSENT] Section 2.2 — CardShaderUniforms struct

**File:** Not found
**Current:** No `CardShaderUniforms` struct exists anywhere in the codebase. No `extension Card { var shaderUniforms: CardShaderUniforms }` computed property. No `extension CardCondition { var brushRoughness: Float ... }`. No `extension Rarity { var waxColor: Color ... var glowSIMD: SIMD4<Float> ... var foilIntensity: Float ... var glowIntensity: Float ... }`.
**Required:** `CardShaderUniforms` struct with brushRoughness, varnishGloss, parchmentAge, foilIntensity, glowIntensity, glowColor fields. All `Rarity` extensions (waxColor, glowSIMD, foilIntensity, glowIntensity, sealIconName, borderWidth, borderGradient) must live in `Sources/Models/Card.swift`.
**Recommended action:** Create the entire shader-parameter mapping system from Section 2.2. This is prerequisite for Metal shader implementation.

---

### [ABSENT] Section 2.2 — Rarity.sealIconName and wax seal icon assets

**File:** Not found
**Current:** No `Rarity.sealIconName` property exists. The rarity wax seal icons (`seal_common`, `seal_uncommon`, `seal_rare`, `seal_epic`, `seal_legendary`) are not present in the asset catalog. The codebase uses a different wax-seal badge system (WaxSealBadge in CardFrameView) for ATK/HP/CM stats, not for rarity.
**Required:** `var sealIconName: String { ... }` on Rarity returning `seal_common` (circle-sparks), `seal_uncommon` (celtic-knot), `seal_rare` (crown), `seal_epic` (all-seeing-eye), `seal_legendary` (dragon-head). These assets must exist in `Assets.xcassets/Icons/` and be downloaded via `Scripts/download_icons.sh`.
**Recommended action:** Implement `Rarity.sealIconName`. Download seal icons via the script in Section 3.8. Add to asset catalog. Wire to the rarity indicator wax seal (separate from the stat badges already present).

---

### [ABSENT] Section 2.3 — CardDisplayState enum

**File:** Not found
**Current:** No `CardDisplayState` enum exists anywhere in the codebase. (Confirmed by search for `CardDisplayState`, `enum.*State` in card-related files — no results.)
**Required:** `enum CardDisplayState: Equatable { case default, focused, selected, tapped, previewed, inGraveyard, summoning(progress: Float), foilActive(tiltX: Float, tiltY: Float), damaged(severity: Float) }`
**Recommended action:** Create this enum. Wire to `CardFrameView` via `@State private var displayState: CardDisplayState = .default`. This is the foundation for all state transitions in Section 1.6.

---

### [ABSENT] Section 2.4 — CardRepository and test card JSON files

**File:** Not found
**Current:** No `CardRepository` class exists. No `Resources/Cards/*.json` files exist in the project. Card data is sourced exclusively from Supabase via `CollectionService`, `CardTemplate` models, and live network calls.
**Required:** `CardRepository` singleton loading card data from `Resources/Cards/*.json` at startup. Five test card JSON files (one per rarity, all 4 card types, at least 3 factions) exercising all schema fields.
**Recommended action:** The existing architecture uses a network-first approach. The guide's JSON repository is a local development scaffold. Determine whether to implement it as a local fallback, test fixture only, or full replacement. At minimum, test card JSON files are needed for development and offline testing.

---

### [ABSENT] Section 2 — CardRenderer protocol and TemplateEngine

**File:** Not found
**Current:** No `protocol CardRenderer: AnyObject { func resize(to size: CGSize); func render(to view: MTKView, uniforms: CardShaderUniforms) }`. No `NullCardRenderer`. No `TemplateEngine` or slot system.
**Required:** `CardRenderer` protocol as the minimum interface for Metal rendering. `NullCardRenderer` as safe no-op placeholder. `TemplateEngine` and slot system for card template rendering.
**Recommended action:** Create `Sources/Effects/CardRenderer.swift` with the protocol and null implementation per Section 5.5. This is prerequisite for the Metal effect pipeline.

---

## SECTION 6 — Effects & Animations

---

### [ABSENT] Section 6.1 — OilPaintShader.metal

**File:** Not found (glob for *.metal found zero files anywhere in the project)
**Current:** No Metal shaders exist anywhere in the project. The entire Metal shader pipeline (OilPaintShader, ParchmentShader, WarmFoilShader, InkSpreadKernel) is absent.
**Required:** `Sources/Shaders/OilPaintShader.metal` with fragment shader applying brushwork normal mapping, warm shadow lift, parchment age desaturation, and oil varnish specular. Driven by brushRoughness, varnishGloss, parchmentAge, lightDirection uniforms.
**Recommended action:** Create the Shaders/ directory. Implement all four Metal shaders from Section 6. Add them to the Xcode target. Run `Scripts/compile_shaders.sh` to verify compilation.

---

### [ABSENT] Section 6.2 — ParchmentShader.metal

**File:** Not found
**Current:** Parchment texture is applied via SwiftUI `Image("CardTextures/tex-parchment")` with `.blendMode(.overlay)` and low opacity. This is a flat texture overlay, not a Metal fragment shader with fiber normal mapping, edge vignette computation, or dark mode color scheme branching.
**Required:** `Sources/Shaders/ParchmentShader.metal` with: physical paper scale UV tiling (256pt per tile), fiber normal mapping, edge vignette with age darkening, warm tint, dark mode branching via `colorScheme` uniform.
**Recommended action:** Implement ParchmentShader.metal. Connect via MTKView bridge.

---

### [ABSENT] Section 6.3 — WarmFoilShader.metal

**File:** Not found
**Current:** Foil effect is implemented entirely in SwiftUI via `RarityBorderModifier` (lines 1640–1831 in CardFrameView). For epic/legendary tiers, it overlays `Image("RarityEffects/holographic-foil")` with `.blendMode(.overlay)` and offset driven by `GyroscopeManager.shared.tiltX/tiltY`. This is a Core Animation approach, not a Metal shader.
**Required:** `Sources/Shaders/WarmFoilShader.metal` with tiltX/tiltY uniforms, organic sine distortion of UV coordinates, luminance-based foil mask (strongest in midtones), warm iridescent additive blend. Driven by `CardShaderUniforms.foilIntensity`.
**Recommended action:** Implement WarmFoilShader.metal and MetalCardEffectView bridge. The existing SwiftUI holographic overlay can remain as a `staticOnly`-tier fallback while Metal handles full/shimmer tiers. Note: `GyroscopeManager` already exists and provides the tilt data — it just needs to feed a Metal uniform instead of a SwiftUI offset.

---

### [ABSENT] Section 6.4 — InkSpreadKernel.metal (summoning animation)

**File:** Not found
**Current:** No ink spread compute shader. No summoning animation. `CardPlayAction.swift` exists in the SpriteKit directory but handles battlefield card play animations (not the ink spread reveal for the `summoning` state).
**Required:** `Sources/Shaders/InkSpreadKernel.metal` — compute kernel with organic noise at spread edge, progress-driven reveal from 0.0 to 1.0 over 0.8s via CADisplayLink. Triggered when `CardDisplayState` transitions to `.summoning(progress:)`.
**Recommended action:** Implement the compute shader and drive it from CardFrameView's summoning state transition.

---

### [ABSENT] Section 6.5 — MetalCardEffectView SwiftUI bridge

**File:** Not found
**Current:** No `MetalCardEffectView: UIViewRepresentable` struct. No `MTKView` integration in any card-related SwiftUI view.
**Required:** `Sources/Effects/MetalCardEffectView.swift` — UIViewRepresentable wrapping MTKView, with Coordinator implementing MTKViewDelegate, `NullCardRenderer` as default until `OilPaintCardRenderer` is built.
**Recommended action:** Create the bridge per Section 5.5 code. This is the foundation for all Metal effects.

---

### [CONFLICT] Section 6.6 — WaxSealView component exists differently

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` lines 208–354 (WaxSealBadge)
**Current:** `WaxSealBadge` is implemented as a stat value badge (shows ATK, HP, CM cost numerals). It uses faction seal shape assets or a bronze circle fallback. This is for stat display, not for rarity indication. No separate `WaxSealView` exists for rarity with `rarity.waxColor` and `rarity.sealIconName`.
**Required:** `Sources/Effects/WaxSealView.swift` — a rarity indicator component using `rarity.waxColor` (from Section 2.2), `rarity.sealIconName` (from Section 2.2), RadialGradient outer disk, embossed symbol, specular highlight Ellipse, pulsing glow animation for rare+. Positioned at x=164, y=258 in card coordinates (overlapping stats bar).
**Recommended action:** Create `WaxSealView.swift` per Section 6.6. The existing `WaxSealBadge` for stats is a different component serving a different purpose; both can coexist.

---

### [ABSENT] Section 6.6b — Animated gradient borders for Epic and Legendary

**File:** Not found as a standalone component
**Current:** In `RarityBorderModifier`, Epic has an animated LinearGradient border cycling between `isPulsing` states, and Legendary has a full `AngularGradient` rotating via `shimmerPhase`. However, these are implemented inside `RarityBorderModifier`, not as standalone `AnimatedGradientBorder` and `StaticBorder` components. The guide requires `CardFrameView` (the standalone frame view from Section 6.6b) as a separate file from the full card view.
**Required:** Standalone `Sources/Views/CardFrameView.swift` (distinct from the existing 1986-line file of the same name, which is the full card rendering component) containing: `CardFrameView(rarity:)`, `AnimatedGradientBorder`, `StaticBorder`. Animated borders must respect `@Environment(\.accessibilityReduceMotion)`.
**Recommended action:** Extract border animation logic from `RarityBorderModifier` into standalone components. Add Reduce Motion check (currently absent from `RarityBorderModifier`).

---

### [ABSENT] Section 6.6b — Reduce Motion not respected in border animations

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` lines 1640–1831 (RarityBorderModifier)
**Current:** `RarityBorderModifier` never reads `@Environment(\.accessibilityReduceMotion)`. Epic and Legendary tier animations always play regardless of user accessibility setting.
**Required:** All animated borders (Epic, Legendary) must check `@Environment(\.accessibilityReduceMotion) var reduceMotion` and use first color statically when true.
**Recommended action:** Add `@Environment(\.accessibilityReduceMotion) var reduceMotion` to `RarityBorderModifier`. Guard all `.repeatForever()` animations behind `guard !reduceMotion else { return }`.

---

### [PARTIAL] Section 6.7 — Physical spring card drag

**File:** `/ChaosCreatures/ChaosCreatures/Views/Battle/BattleContainerView.swift` (DragGesture present)
**Current:** DragGesture exists in BattleContainerView and CollectionView, but not as a dedicated `DraggableCardView` struct with the precise spring constants from the guide: resistance 0.72, drag rotation `value.translation.width * 0.025`, release spring `response: 0.38, dampingFraction: 0.62`.
**Required:** `DraggableCardView` with: resistance curve 0.72, rotation `width * 0.025`, scale 1.05 while dragging, shadow radius 16 while dragging, spring `response: 0.38, dampingFraction: 0.62` on release.
**Recommended action:** Create `DraggableCardView.swift` per Section 6.7. Wire to `CardFrameView` for battle hand cards.

---

### [CONFLICT] Section 6.8 — Particle systems: wrong blend mode for card rarity particles

**File:** `/ChaosCreatures/ChaosCreatures/SpriteKit/Utilities/ParticleEffects.swift` lines 1–594
**Current:** `ParticleEffects.swift` implements faction-specific particles (death, heal, shield break, card play glow, chaos roll, legendary sparkles, etc.) using `.add` blend mode throughout (lines 83, 114, 148, etc.). The `legendarySparkles` function exists (line 255–282) but uses `.add` blend mode.
**Required:** Card rarity particle emitters per Section 6.8 must use `.alpha` blend mode (not `.add`). The guide explicitly states: "Particles that glow with additive blending look digital, not physical — always use `.alpha` blend mode, never `.add`." The rarity-specific emitters (uncommon dust motes, rare gold flakes, epic amethyst embers, legendary ember sparks) need to be in a separate `CardParticleFactory` enum with the precise parameters from the Section 6.8 table.
**Required function:** `CardParticleFactory.makeEmitter(for rarity: Rarity, in artBoxSize: CGSize) -> SKEmitterNode?` with exact birth rates: uncommon=2/s lifetime=4s, rare=5/s lifetime=3s, epic=8/s lifetime=3.5s, legendary=14/s lifetime=2s.
**Recommended action:** Create `Sources/Effects/CardParticleFactory.swift` with `.alpha` blend mode. The existing `ParticleEffects.swift` is for gameplay effects and can stay. The existing `legendarySparkles` in `ParticleEffects.swift` uses `.add` — leave it for gameplay but add the new card-specific factory.

---

### [ABSENT] Section 6.9 — EffectTier enum and graceful degradation

**File:** Not found
**Current:** No `EffectTier` enum. No `resolveEffectTier()` function checking Metal availability and Reduce Motion. No degradation path.
**Required:** `Sources/Effects/EffectTier.swift` — enum with cases: full, shimmerOnly, staticOnly, minimal. `Comparable` conformance. `resolveEffectTier()` function checking `UIAccessibility.isReduceMotionEnabled`, `MTLCreateSystemDefaultDevice()`, `CMMotionManager().isDeviceMotionAvailable`.
**Recommended action:** Create `EffectTier.swift` per Section 6.9. This must be created before `WaxSealView` and `MetalCardEffectView` to avoid compilation order issues.

---

### [ABSENT] Section 6 (HapticEngine) — HapticEngine class and AHAP files

**File:** Not found
**Current:** No `HapticEngine.swift` class. No `.ahap` files anywhere in the project. The Sounds directory contains SFX and Music subdirectories but no Haptics directory. The `BattleAudioManager.swift` handles audio but not CoreHaptics.
**Required:** `Sources/Haptics/HapticEngine.swift` singleton with `CHHapticEngine`. Six AHAP files in `Resources/Haptics/`: `card_flip.ahap`, `card_summon.ahap`, `card_graveyard.ahap`, `foil_shimmer.ahap`, `epic_reveal.ahap`, `legendary_reveal.ahap`. Physical material haptic vocabulary per Section 7.1.
**Recommended action:** Create `HapticEngine.swift`. Generate AHAP files per Section 7.2 specifications. Add Haptics resource directory.

---

## SECTION 9 — iPad Layout

---

### [PARTIAL] Section 9.1 — Size class handling (present in one view only)

**File:** `/ChaosCreatures/ChaosCreatures/Views/Collection/DeckBuilderView.swift` line 12
**Current:** `@Environment(\.horizontalSizeClass) private var sizeClass` is used in `DeckBuilderView.swift` only. The primary card rendering component `CardFrameView` does not use size classes — it uses a fixed `CardDisplaySize` enum instead. The `iPadScale` multiplier in CardFrameView is a device idiom check (`UIDevice.current.userInterfaceIdiom == .pad ? 1.15 : 1.0`), not a size-class-based layout branch.
**Required:** Size class branching in card presentation views: `hSizeClass == .compact` → SingleCardFocusView, `vSizeClass == .regular` → CardHandArcView (iPad portrait), landscape → CardHandSpreadView. Separate view bodies for each orientation, not simple scaling.
**Recommended action:** Implement `CardHandArcView` and `CardHandSpreadView`. Add size class environment to BattleContainerView and CollectionView. The guide explicitly says "Do not scale up the iPhone layout."

---

### [CONFLICT] Section 9.2 — Card sizing via GeometryReader not implemented

**File:** `/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` lines 24–61
**Current:** Card sizes are hardcoded in `CardDisplaySize` enum (grid=112×157pt, hand=90×130pt, detail=280×392pt, fullscreen=350×490pt). These are absolute values, not relative to available width via GeometryReader. iPad gets a 1.15× badge/font scale via `iPadScale` but the card frame itself does not resize.
**Required:** Card width = `isCompact ? min(availableWidth * 0.85, 260) : min(availableWidth * 0.40, 350)`. Height = `cardWidth * (294.0 / 210.0)` always. Reference size table: in-hand iPhone 95×133pt, in-hand iPad portrait 130×182pt, in-hand iPad landscape 110×154pt; selected iPhone 160×224pt, selected iPad 210×294pt; previewed iPhone 270×378pt, previewed iPad 340×476pt.
**Recommended action:** Wrap card size computation in `GeometryReader { geometry in ... }` per Section 9.2. The current `CardDisplaySize` enum would need to move to relative sizing or be replaced.

---

### [ABSENT] Section 9.3 — Stage Manager and split view testing

**File:** Not found
**Current:** `UIApplicationSupportsMultipleScenes` is `false` in `Info.plist` (line 27). Stage Manager requires multiple scene support. No scene size observation for split view. Split view layouts have not been tested per guide requirements (1/3, 1/2, 2/3 width).
**Required:** Enable `UIApplicationSupportsMultipleScenes`. Observe `UIScene.didActivateNotification` to re-compute layout from current window bounds. Test in all three split view widths and Stage Manager floating window mode.
**Recommended action:** Enable multiple scenes in Info.plist. Add scene-size observation in root views. Note that this is a significant architectural change.

---

### [ABSENT] Section 9.4 — Landscape iPad separate view body

**File:** Not found
**Current:** No landscape-specific card hand layout exists. iPad landscape mode would show the same portrait layout due to the fixed `UISupportedInterfaceOrientations` in Info.plist (portrait only — `UIInterfaceOrientationPortrait` only).
**Required:** Landscape iPad: horizontal spread hand view with more vertical space for battlefield. Separate view body (not rotated portrait). Info.plist should support `UIInterfaceOrientationLandscapeLeft` and `UIInterfaceOrientationLandscapeRight` at minimum for iPad.
**Recommended action:** Add landscape orientation support to Info.plist for iPad. Implement `CardHandSpreadView` for landscape iPad.

---

## SECTION 14 — Quality Bar

---

### [ABSENT] Section 14 — Visual regression framework

**File:** Not found
**Current:** No `Scripts/compare_screenshots.py` exists. No `Tests/ReferenceScreenshots/` directory. No structured critique log in `Logs/iteration_log.md` using the Section 12.3 template. The `Logs/iteration_log.md` file exists but contains no structured visual critique entries.
**Required:** `Scripts/compare_screenshots.py` (Pillow-based pixel diff with 0.025 threshold). `Tests/ReferenceScreenshots/{iPhone15Pro,iPhone12,iPadPro,iPadAir}/` directories. Baseline screenshots for all four devices in both light and dark mode. `Logs/iteration_log.md` with structured critiques per Section 12.3 template.
**Recommended action:** Create compare_screenshots.py per Section 12.2. Run `Scripts/screenshot_all_devices.sh` on all four simulators. Store baselines. This is the quality gate mechanism for all visual iteration.

---

### [ABSENT] Section 14 — Physical quality test criteria not verifiable (no reference baseline)

**File:** Not found
**Current:** The "physical test" (does a screenshot make an observer want to reach out and touch the card?) cannot be assessed without: P3 color palette, Metal shaders, parchment texture at native @3x resolution, letterpress typography, and dark mode implementation. None of these are currently implemented at the required fidelity. Art box currently shows either a loaded PNG URL or a flat gradient placeholder — no oil paint shader, no edge vignette, no AO shadow.
**Required:** Artwork at native @3x on Pro Max. Parchment grain visible at native resolution. No aliased edges. 60fps on iPhone 12, 120fps on iPhone 15 Pro. Material coherence (oil paint + parchment + wax + gold all from same light source, upper-left warm directional).
**Recommended action:** This section is entirely blocked by missing Metal shaders, missing P3 color palette, missing letterpress effect, and missing dark mode. Address SECTION 6 and SECTION 1 gaps first.

---

### [ABSENT] Section 14 — Quality checklist: no critique log or QA process

**File:** `/ChaosCreatures/Logs/iteration_log.md` (exists but empty/not using guide template)
**Current:** `Logs/iteration_log.md` exists but does not use the 8-axis structured critique template from Section 12.3 (Material believability, Color temperature, Texture grain, Typography letterpress, Lighting consistency, Tactile impression, iPad vs iPhone, Dark mode). No regression pass scores logged.
**Required:** Every visual iteration logged with the Section 12.3 template. Regression diff scores for all four devices included. Largest gap, root cause, next action explicit.
**Recommended action:** Establish the structured critique workflow. Template entries should be made after every visual change.

---

## SUMMARY

| Category | COMPLIANT | PARTIAL | CONFLICT | ABSENT |
|----------|-----------|---------|----------|--------|
| Section 1 — Aesthetic System | 0 | 1 | 8 | 3 |
| Section 2 — Card Schema | 0 | 0 | 2 | 5 |
| Section 6 — Effects | 0 | 2 | 3 | 7 |
| Section 9 — iPad Layout | 0 | 1 | 2 | 2 |
| Section 14 — Quality Bar | 0 | 0 | 0 | 3 |
| **TOTALS** | **0** | **4** | **15** | **20** |

**Total findings: 39**

---

## TOP 5 MOST CRITICAL GAPS (Highest new-code volume required)

### 1. Metal Shader Pipeline — Sections 6.1–6.5 (ABSENT)
Zero Metal shaders exist. Four `.metal` files (OilPaintShader, ParchmentShader, WarmFoilShader, InkSpreadKernel), the MetalCardEffectView UIViewRepresentable bridge, the CardRenderer protocol, NullCardRenderer, OilPaintCardRenderer, and CardShaderUniforms must all be created from scratch. This is the largest single code body required — approximately 500+ lines of Metal + 200+ lines of Swift. All texture assets (brush_normal.jpg, parchment_normal.jpg, wax_seal_normal.png, foil_gradient.png) must also be generated and added to the asset catalog. This is the foundation that the aesthetic goal rests on.

### 2. Card Layout Structural Redesign — Section 1.4 + 1.5b (CONFLICT)
The existing CardFrameView (1986 lines) uses a full-art-bleed with overlaid badges design. The guide specifies a zone-stacked layout (Name Bar → Art Box → Type Line → Text Box → Stats Bar → Rarity Bar). These are architecturally incompatible. A decision by the owner is needed: if the guide's zone layout is adopted, CardFrameView requires a complete rewrite. If the existing design is retained, all guide section 1.4 measurement specs are formally superseded and should be updated in the guide to match. This is the highest-impact design decision — it determines whether ~1000 lines of existing code is replaced.

### 3. P3 Color Palette & Named Color Assets — Section 1.2 (CONFLICT)
No named color assets exist in the asset catalog. All 16 P3 palette tokens must be created as `.colorset` files with Display P3 color space values. All card rendering code (currently using raw `Color(hex:)` strings) must be migrated to `Color("token-name")` lookups. Without this, dark mode cannot be implemented (the dark-mode token variants only work through named assets), and the guide's faction color system cannot use named colors as intended. Scope: 16 new colorset files + search-and-replace across CardFrameView and related files.

### 4. State Machine + Gesture System — Sections 1.6 + 1.7 + 2.3 (ABSENT)
The `CardDisplayState` enum does not exist. Eleven named state transitions with precise timing/curve specifications must be implemented. The three-tier gesture priority stack must be added to CardFrameView. This gates all interactive animations including card flip (requiring card back integration), damage shake, summoning ink spread, preview scale, and graveyard fade. This is prerequisite work before the interactive feel of the card matches the guide's physical metaphor.

### 5. Typography Font Set Replacement — Section 1.5 (CONFLICT)
The guide mandates EB Garamond (body/flavor) + Oswald Bold (stats) for card content. The codebase uses Alegreya (body/flavor) + Bebas Neue (stats) + Fira Sans (UI). All body text, flavor text, keyword styling, and stat numerals would need font changes across CardFont.swift and all card views. Additionally, EBGaramond-SemiBold is required for keyword ability lines with the specific bold-keyword pattern. Six specific font files must be registered in Info.plist replacing the current six. Scope: font download + Info.plist update + CardFont.swift rewrite + visual regression pass across all card text elements.

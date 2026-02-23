# Audit C — Systems & Quality
## Sections 5, 7, 10, 12, 13 of CARD_DESIGN_GUIDE.md
**Date:** 2026-02-22
**Auditor:** Audit Agent C
**Scope:** Agent Tool-Use (S5), Haptics (S7), Accessibility (S10), Iterative Testing (S12), Performance Profiling (S13)
**Documents read before audit:**
- `docs/CARD_DESIGN_GUIDE.md` Sections 5, 7, 10, 12, 13 (in full)
- `docs/GRIMDARK_AESTHETIC_DIRECTIVE.md` (in full)
- `docs/CRITIQUE_SCORING_GUIDE.md` (in full)

---

## Section 5: Agent Tool-Use Techniques

### [ABSENT] S5.1 — Vision Tool Reference Comparison Workflow
**File:** No implementation found
**Current:** No automated reference comparison tooling exists. No `Scripts/verify_asset.py` script. No reference image download tooling.
**Required:** Section 5.1 specifies: render output to PNG via simulator screenshot, load alongside reference from Section 1.10, compare across 6 axes, write structured critique before any fix. Section 5.7 specifies `Scripts/verify_asset.py` must exist before any generation call.
**Recommended action:** Create `Scripts/verify_asset.py` with the exact implementation from Section 5.7 (warm-tone check, min dimensions, JSON error payload detection). This is a prerequisite for any asset generation work.

---

### [PARTIAL] S5.2 — Bash Tool Discipline (Exit Code Checking)
**File:** `scripts/screenshot_all_devices.sh` (line 46)
**Current:** The screenshot script checks for file existence after `xcrun simctl io` but does not check exit codes with `${PIPESTATUS[0]}`. Other scripts (`.mjs` generation scripts) do not follow the bash discipline pattern from Section 5.2.
**Required:** Section 5.2 specifies: "Always check exit codes explicitly" with `${PIPESTATUS[0]}` pattern. After every Metal shader file change, check for compile warnings.
**Recommended action:** Update `scripts/screenshot_all_devices.sh` to check exit codes. Add post-Metal-build grep check per Section 5.2 to the shader compilation script (`scripts/compile_shaders.sh`).

---

### [PARTIAL] S5.3 — Multi-Device Screenshot Script
**File:** `/Users/alexali/Projects/chaos-creatures/scripts/screenshot_all_devices.sh`
**Current:** Script exists but with deviations from guide spec:
  - Device list uses iPhone 17 Pro, iPhone 17 Pro Max, iPhone 16e, iPad Pro 13-inch (4 devices)
  - Guide specifies iPhone 15 Pro, iPhone 12, iPad Pro 12.9-inch 6th gen, iPad Air 5th gen (4 devices)
  - Output goes to `Tests/SmokeTest/` not `Logs/Iterations/iter_${ITER}_${SAFE}.png`
  - Does not use `ITER` parameter format from guide
  - Does not use PIL Image.open to verify image dimensions
  - Missing the iteration numbering system required by Section 5.3
**Required:** Section 5.3 specifies exact device list (iPhone 15 Pro, iPhone 12, iPad Pro 12.9" 6th gen, iPad Air 5th gen), output path `Logs/Iterations/iter_${ITER}_${SAFE}.png`, and PIL size verification.
**Recommended action:** Update device list to include at least one older device (iPhone 12 equivalent). Add PIL dimension verification. Add iteration numbering parameter. The device name updates are acceptable since the project targets newer simulators, but the output path and verification should match the guide.

---

### [ABSENT] S5.4 — Refinement Loop Procedure
**File:** No implementation found
**Current:** The 9-step refinement loop procedure is not implemented as a runnable script or enforced workflow. The iteration log shows structured critiques (Section 12.3 format) but does not follow the exact 9-step loop: (1) xcodebuild all four targets, (2) screenshot script, (3) vision compare iPhone, (4) vision compare iPad, (5) write critique, (6) run compare_screenshots.py, (7) identify ONE gap, (8) ONE fix, (9) increment N.
**Required:** Section 5.4 specifies "Execute in exact order -- no steps may be skipped or reordered."
**Recommended action:** Document the refinement loop as a runnable checklist or shell script. Enforce the one-fix-per-loop rule. This is a workflow discipline item, not a code item.

---

### [ABSENT] S5.5 — SwiftUI-MTKView Bridge Pattern
**File:** No `Sources/Effects/CardRenderer.swift` found
**Current:** No `CardRenderer` protocol, no `NullCardRenderer`, no `MetalCardEffectView` UIViewRepresentable with MTKView. The Metal shaders exist as `.metal` files but have no Swift-side MTKView bridge. `CardParticleFactory.swift` uses `SKView` (SpriteKit) not `MTKView` (Metal).
**Required:** Section 5.5 specifies complete `CardRenderer` protocol + `NullCardRenderer` + `MetalCardEffectView` with `MTKView` delegate pattern.
**Recommended action:** Create `CardRenderer.swift` and `MetalCardEffectView.swift` per Section 5.5 to wire the four Metal shaders (OilPaintShader, ParchmentShader, WarmFoilShader, InkSpreadKernel) to actual rendering views.

---

### [PARTIAL] S5.6 — Context Management (Iteration Log)
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md`
**Current:** Iteration log exists and is actively maintained. Contains session start confirmations, phase completion records, structured critiques, deviation registers. However, no `Logs/RECOVERY_CHECKPOINT_[timestamp].md` files exist. Recovery checkpoints are written inline to the iteration log rather than as separate timestamped files.
**Required:** Section 5.6 specifies: "Approaching context limit: write `Logs/RECOVERY_CHECKPOINT_[timestamp].md` immediately."
**Recommended action:** Minor. The iteration log is sufficient for recovery. Creating separate checkpoint files would be additive improvement.

---

### [ABSENT] S5.7 — Silent Failure Prevention Scripts
**File:** No `Scripts/verify_asset.py` found. No `Scripts/load_env.sh` found. No `Scripts/verify_environment.sh` found.
**Current:** None of the three guard scripts specified in Sections 5.7 and 4 exist:
  - `Scripts/verify_asset.py` — image dimension + warm-tone + error-payload check
  - `Scripts/load_env.sh` — environment variable loader
  - `Scripts/verify_environment.sh` — master environment check (tools, simulators, API keys, Python libs)
**Required:** Section 5.7 provides the complete implementation of `verify_asset.py`. Section 4 specifies `verify_environment.sh` and `load_env.sh` as prerequisites.
**Recommended action:** Create all three scripts. `verify_asset.py` is the highest priority as it gates all asset generation work.

---

## Section 7: Haptic Feedback

### [ABSENT] S7.1 — Haptic Vocabulary Implementation
**File:** No haptic implementation found anywhere in the codebase
**Current:** Zero references to `CHHapticEngine`, `CoreHaptics`, `UIImpactFeedbackGenerator`, `UINotificationFeedbackGenerator`, or `UISelectionFeedbackGenerator` in any Swift file in the entire `ChaosCreatures/` directory. No file named `HapticEngine.swift` exists. No haptic call sites in any view or scene.
**Required:** Section 7.1 specifies 11 haptic interactions: card pick up (impact light), card set down (impact medium), card flip (custom AHAP), wax seal tap (impact heavy), card summon (custom AHAP), card to graveyard (custom AHAP), rare foil reveal (custom AHAP), epic reveal (custom AHAP), legendary reveal (custom AHAP), invalid action (notification error), scroll text box (selection feedback).
**Recommended action:** Create `HapticEngine.swift` per Section 7.2 implementation. Wire haptic calls to all 11 interaction sites across CardFrameView, BattleScene, and other views. This is entirely unimplemented — expected per task description.

---

### [ABSENT] S7.2 — Required AHAP Files
**File:** No `Resources/Haptics/` directory exists. No `.ahap` files anywhere in the project.
**Current:** Zero AHAP files. The six required files do not exist:
  - `card_flip.ahap` — ABSENT
  - `card_summon.ahap` — ABSENT
  - `card_graveyard.ahap` — ABSENT
  - `foil_shimmer.ahap` — ABSENT
  - `epic_reveal.ahap` — ABSENT
  - `legendary_reveal.ahap` — ABSENT
**Required:** Section 7.2 provides complete JSON implementations for all six AHAP files plus a Python generator script for `foil_shimmer.ahap`.
**Recommended action:** Create `Resources/Haptics/` directory and all six AHAP files using the exact JSON from Section 7.2. Create `Scripts/generate_foil_shimmer_ahap.py` per Section 7.2.

---

### [ABSENT] S7.2 — HapticEngine.swift Singleton
**File:** No `HapticEngine.swift` or equivalent found
**Current:** No `HapticEngine` class exists. No `CHHapticEngine` initialization at app startup. `ChaosCreaturesApp.swift` does not reference haptics. `AppDelegate.swift` contains only orientation lock (6 lines total).
**Required:** Section 7.2 provides complete `HapticEngine` singleton implementation with `prepare()`, `play(ahapNamed:)`, and `impact(_:)` methods. Must be initialized at app startup.
**Recommended action:** Create `HapticEngine.swift` per Section 7.2. Call `HapticEngine.shared.prepare()` in `ChaosCreaturesApp.init()` or `AppDelegate.application(_:didFinishLaunchingWithOptions:)`.

---

### [ABSENT] S7.3 — Physical Device Testing Gate Logging
**File:** No haptic-related entries in iteration log
**Current:** No haptic interactions are logged as "PENDING PHYSICAL DEVICE VERIFICATION" in `Logs/iteration_log.md` because no haptic work has been done.
**Required:** Section 7.3 specifies: "Log every haptic interaction in `Logs/iteration_log.md` as 'PENDING PHYSICAL DEVICE VERIFICATION.' Do not mark any haptic work as complete without physical device confirmation."
**Recommended action:** When haptics are implemented, each of the 11 interactions must be logged as pending physical verification. This is a hard gate per Section 12.5 exit criteria.

---

## Section 10: Accessibility

### [PARTIAL] S10.1 — VoiceOver Labels on Card Components
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (lines 325-331)
**Current:** CardFrameView has correct VoiceOver implementation:
  - `.accessibilityElement(children: .ignore)` — correct
  - `.accessibilityLabel(data.voiceOverLabel)` — correct, computed property exists on both `CardDisplayData` (line 240) and `Card` struct (CardGuideEnums.swift line 441)
  - `.accessibilityHint("Double-tap to select. Long-press to preview.")` — correct
  - `.accessibilityAddTraits(.isButton)` — correct
  - `.accessibilityIdentifier("CardView")` — correct
  - `.accessibilityAction(named: "Preview card")` — correct
  - `.accessibilityAction(named: "Show card details")` — correct (placeholder handler)

However, **NO OTHER VIEW in the entire app has any accessibility annotations.** Grep for `.accessibilityLabel`, `.accessibilityHint`, `.accessibilityIdentifier`, and `.accessibilityElement` returns results ONLY from `CardFrameView.swift`. The following views have NO accessibility support:
  - `OnboardingView.swift` — multiple interactive buttons, no labels
  - `CollectionView.swift` — grid of cards, no collection-level accessibility
  - `CardDetailView.swift` — detail view, no labels
  - `DeckBuilderView.swift` — drag targets, no labels
  - `DeckListView.swift` — list items, no labels
  - `ShopView.swift` — purchase buttons, no labels
  - `SubscriptionView.swift` — subscription buttons, no labels
  - `SettingsView.swift` — settings toggles, no labels
  - `HomeView.swift` — navigation buttons, no labels
  - `ProfileView.swift` — profile info, no labels
  - `MatchmakingView.swift` — matchmaking state, no labels
  - `BattleContainerView.swift` — battle controls, no labels
  - `PostMatchView.swift` — result display, no labels
  - `EvolutionFlowView.swift` — evolution controls, no labels
  - `EvolutionRevealView.swift` — reveal animation, no labels
  - All SpriteKit nodes (BattleScene, CreatureNode, HandCardNode, etc.) — no accessibility

**Required:** Section 10.1 specifies VoiceOver on ALL card components. Section 12.5 exit criteria requires "Accessibility Inspector: no VoiceOver gaps."
**Recommended action:** Add VoiceOver labels, hints, traits, and identifiers to ALL interactive views listed above. SpriteKit scenes require `UIAccessibilityElement` approach since SwiftUI accessibility modifiers do not apply to SKNode. This is a significant body of work.

---

### [ABSENT] S10.2 — Dynamic Type Scaling
**File:** No implementation found
**Current:** Zero references to `UIFontMetrics`, `scaledFont`, or `DynamicType` anywhere in the codebase. All fonts use fixed sizes via `CardFont` accessors (e.g., `CardFont.cinzelBold(size: 13)`). Text sizes do not scale with user accessibility settings.
**Required:** Section 10.2 specifies a `scaledFont(name:textStyle:baseSize:)` helper function using `UIFontMetrics(forTextStyle:).scaledFont(for:)`. The text box must accommodate Dynamic Type scaling at XXL sizes via expanded scroll region.
**Recommended action:** Create `scaledFont()` helper per Section 10.2. Replace all fixed-size font accessors in CardFrameView and other views with UIFontMetrics-scaled variants. Ensure the text box scroll region expands at larger sizes.

---

### [PARTIAL] S10.3 — Reduce Motion Handling
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift` (line 1178), `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Effects/EffectTier.swift` (line 23)
**Current:** Two Reduce Motion check sites exist:
  1. `CardFrameView.swift` line 1178: `if UIAccessibility.isReduceMotionEnabled` — guards the Epic/Legendary animated border rotation, falling back to a static 45-degree gradient. Correct.
  2. `EffectTier.swift` line 23: `if UIAccessibility.isReduceMotionEnabled { return .minimal }` — correctly returns `.minimal` tier which disables all animation. Correct.

However, **24 files use `withAnimation` or `.animation` and 30+ `.repeatForever` animation sites exist with NO Reduce Motion guard.** Key unguarded animation sites:
  - `OnboardingView.swift` (9 animation calls, including `.repeatForever`) — NO reduceMotion check
  - `EvolutionRevealView.swift` (`.repeatForever`) — NO reduceMotion check
  - `WaxSealView.swift` (`.repeatForever` breathing animation) — NO reduceMotion check
  - `CardDetailView.swift` (`.repeatForever` rotation) — NO reduceMotion check
  - `MatchmakingView.swift` (2 `.repeatForever` animations) — NO reduceMotion check
  - `LoadingView.swift` (2 `.repeatForever` animations) — NO reduceMotion check
  - `FullscreenCardView.swift` (`.repeatForever`) — NO reduceMotion check
  - `DraggableCardView.swift` (drag animations) — NO reduceMotion check
  - `ChaosCreaturesApp.swift` (root view transition `.animation`) — NO reduceMotion check
  - `CollectionView.swift` (animations) — NO reduceMotion check
  - `BattleContainerView.swift` (animations) — NO reduceMotion check
  - `PostMatchView.swift` (animations) — NO reduceMotion check
  - All SpriteKit nodes with `SKAction.repeatForever` (CreatureNode 12+ instances, HandCardNode 4+ instances, TimerNode 2 instances) — NO reduceMotion check

**Required:** Section 10.3 specifies: "In any animation site: `withAnimation(reduceMotion ? .none : .spring(...))`. Disable parallax entirely." The guide also requires `@Environment(\.accessibilityReduceMotion)` to be checked at EVERY animation site.
**Recommended action:** Add `@Environment(\.accessibilityReduceMotion)` or `UIAccessibility.isReduceMotionEnabled` guard to ALL animation sites (30+ locations). For SpriteKit: check `UIAccessibility.isReduceMotionEnabled` before starting any `.repeatForever` actions. This is a substantial pass across the entire codebase.

---

### [ABSENT] S10.4 — Color Contrast Compliance Verification
**File:** No `Scripts/verify_contrast.py` found
**Current:** No contrast verification script exists. The five required color contrast pairs from Section 10.4 have not been programmatically verified:
  1. `ink-black` on `parchment-light` (need 4.5:1) — UNVERIFIED
  2. `parchment-dark` on `parchment-light` (need 3.0:1 large text) — UNVERIFIED
  3. `ink-black` on `parchment-mid` (need 4.5:1) — UNVERIFIED
  4. `ink-dark-mode` on `parchment-dark-mode` (need 4.5:1) — UNVERIFIED
  5. `ink-black` on `canvas-warm` (need 4.5:1) — UNVERIFIED
**Required:** Section 10.4 provides complete `Scripts/verify_contrast.py` implementation. Must be run as part of every QA pass.
**Recommended action:** Create `Scripts/verify_contrast.py` per Section 10.4 and run it. The palette was designed to pass WCAG AA but this has never been verified.

---

### [ABSENT] S10.4 — Accessibility UITest
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreaturesUITests/` directory exists but contains no accessibility test
**Current:** UITest directory contains `BattleFlowUITests.swift`, `OnboardingUITests.swift`, and `ScreenshotTests.swift`. None of these test accessibility. No `AccessibilityTests.swift` file exists.
**Required:** Section 10.4 provides a complete `CardAccessibilityTests` test class that verifies cards have non-empty accessibility labels.
**Recommended action:** Create `Tests/AccessibilityTests.swift` per Section 10.4 with `testCardViewHasAccessibilityLabel()`.

---

## Section 12: Iterative Testing & Refinement

### [ABSENT] S12.2 — Visual Regression Script (compare_screenshots.py)
**File:** No `Scripts/compare_screenshots.py` found
**Current:** The visual regression comparison script does not exist. No automated pixel-diff comparison is available. The iteration log notes "Regression check: NOT RUN" multiple times.
**Required:** Section 12.2 provides complete `Scripts/compare_screenshots.py` implementation using PIL ImageChops.difference with a 0.025 threshold. Must be run on all four device screenshots after every iteration.
**Recommended action:** Create `Scripts/compare_screenshots.py` per Section 12.2.

---

### [PARTIAL] S12.3 — Structured Critique Template Usage
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md`
**Current:** The iteration log contains multiple structured critiques using the Section 12.3 template format:
  - Phase 2 Structured Critique (line 178) — 8 axes scored, largest gap identified, root cause, next action, blocked items
  - Phase 2 End Gate Critique (line 314) — same format
  - Wax Seal Iteration 1 Critique (line 469) — custom 8-axis wax seal scoring
  - Phase 3 End Gate Critique (line 381) — PASS/WARN/FAIL assessment

However, deviations from the exact template:
  - War Camp Test (Axis 9) is missing from all critiques — the binary YES/NO axis is never scored
  - The Phase 3 critique uses a PASS/WARN/FAIL format instead of the 8+1 axis scoring template
  - Regression diff scores are always "N/A" because `compare_screenshots.py` does not exist
  - Some critiques lack the "War camp test result: [YES/NO]" section entirely
**Required:** Section 12.3 specifies the exact 9-axis template with War Camp Test as a mandatory binary check. "A phase is not complete until the war camp test returns YES."
**Recommended action:** Ensure all future critiques include all 9 axes, especially the War Camp Test. The existing critiques are structurally sound but incomplete. Add War Camp Test to Phase 2 and Phase 3 end gate critiques retroactively.

---

### [PARTIAL] S12.1 — Reference Anchoring Protocol
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md`
**Current:** Some reference anchoring is present (e.g., "Reference: CARD_DESIGN_GUIDE.md Sections 1.3-1.9" in the Phase 2 end gate critique; wax seal iteration references specific JPG files). However, the protocol is not consistently followed:
  - No exact reference URL or filename is written BEFORE implementation begins (they appear in post-hoc critiques)
  - No "measurable success criteria in concrete terms" are recorded before implementation
  - The guide says "Do not generate or code until this is written" — this is not consistently observed
**Required:** Section 12.1: Before implementing each component, write to iteration_log.md: exact reference, specific quality being extracted, measurable success criteria.
**Recommended action:** Enforce the pre-implementation reference anchoring protocol in future phases. Minor process improvement.

---

### [ABSENT] S12.5 — Reference Screenshot Baseline
**File:** No `Tests/ReferenceScreenshots/` directory found
**Current:** No reference screenshot baseline exists. The iteration log notes this repeatedly ("No reference screenshots exist for diff scoring"). Without a baseline, visual regression comparison (Section 12.2) cannot function.
**Required:** Section 12.5 exit criteria: "Visual regression diff score < 0.025 on all four device screenshots." This requires a baseline in `Tests/ReferenceScreenshots/`.
**Recommended action:** After the next visual milestone, capture screenshots on all four target devices and commit them as `Tests/ReferenceScreenshots/` baseline. This unblocks the compare_screenshots.py workflow.

---

### [CONFLICT] S12.4 — Refinement Rules (One-Fix-Per-Loop)
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md` (line 298)
**Current:** The Phase 2 deviation fix batch shows multiple deviations fixed in a single pass (dark mode, wax seal position, selected scale, focused scale/shadow, chaos mote, EffectTier — 6 fixes in one batch). This violates the "one fix per loop" rule.
**Required:** Section 12.4: "One fix per loop -- no exceptions. Multiple simultaneous changes make regressions undiagnosable."
**Recommended action:** Enforce one-fix-per-loop discipline in future phases. The Phase 2 batch fix was pre-shader work where regression risk was low, but the protocol should be followed strictly going forward.

---

## Section 13: Performance Profiling

### [ABSENT] S13.1 — Instruments Profiling History
**File:** No `Logs/Performance/` directory found
**Current:** No Instruments profiling has been performed. No `.xctrace` files exist. No launch traces. No performance data recorded. The iteration log contains no "HUMAN PROFILING REQUIRED" flags (required by Section 13.1) despite Phase 3 being complete.
**Required:** Section 13.1 specifies: "At the end of every implementation phase, write to `Logs/iteration_log.md`: 'HUMAN PROFILING REQUIRED: GPU Frame Capture, Metal System Trace, Core Animation Color Offscreen-Rendered.' Do not mark a phase complete without a human confirming GPU frame times."
**Recommended action:** Create `Logs/Performance/` directory. Add "HUMAN PROFILING REQUIRED" entries to iteration_log.md for Phases 2 and 3 retroactively. Run `xctrace` CLI profiling per Section 13.1. Flag GPU Frame Capture and Metal System Trace for human execution.

---

### [ABSENT] S13.2 — Performance Targets Tracking
**File:** No performance measurements recorded anywhere
**Current:** No performance targets have been measured or tracked:
  - GPU frame time: UNMEASURED
  - Draw calls per card frame: UNMEASURED
  - Texture memory (7 cards in hand): UNMEASURED
  - App launch to first card visible: UNMEASURED
  - Card state transition time: UNMEASURED
  - SpriteKit frame time: UNMEASURED
**Required:** Section 13.2 specifies hard limits (e.g., GPU frame time < 8ms on iPhone 12, texture memory < 120MB, app launch < 2.5s).
**Recommended action:** Measure all performance targets from Section 13.2 and record in `Logs/Performance/`. Agent can run `xctrace` for launch time and CPU profiling; GPU frame times require human Instruments session.

---

### [ABSENT] S13.3 — Texture Atlas Usage
**File:** No `SKTextureAtlas` usage found in any Swift file
**Current:** Zero references to `SKTextureAtlas` or `textureAtlas` in the entire codebase. All SpriteKit nodes use individual texture loads. There is no texture atlasing for small assets (icons, mana symbols, wax seals).
**Required:** Section 13.3: "Texture atlases for all small assets (icons, mana symbols, wax seals) -- one draw call per atlas."
**Recommended action:** Create texture atlases for icon sets, mana symbols, and wax seal images. Update SpriteKit nodes to load textures from atlases instead of individual files.

---

### [PARTIAL] S13.4 — Texture Cache Implementation
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/ImageCacheService.swift`
**Current:** An `ImageCacheService` exists with:
  - `NSCache<NSString, UIImage>` for in-memory caching (50 MB, 200 item limit)
  - `URLCache` for disk caching (200 MB)
  - Batch preloading (`preloadBatch`, `preloadCardArt`)
  - `clearMemoryCache()` and `clearAllCaches()` methods
  - SwiftUI `CachedCardArt` view for async image loading

However, this is a **UIImage/URLCache** service for card art from the R2 CDN. It is NOT the `TextureCache` specified in Section 13.4, which is a **Metal `MTLTexture`** LRU cache wrapping `MTLTextureLoader` with max 20 textures and `evictAll()` on memory warning. The existing ImageCacheService serves a different purpose (HTTP image caching) from the guide's TextureCache (GPU texture memory management).
**Required:** Section 13.4: `TextureCache` singleton wrapping `MTLTextureLoader` with LRU eviction (max 20 textures). Call `TextureCache.shared.evictAll()` on memory warning.
**Recommended action:** Create `TextureCache.swift` per Section 13.4 for Metal textures, separate from the existing `ImageCacheService`. The ImageCacheService is fine for its purpose but does not fulfill the Metal texture caching requirement.

---

### [ABSENT] S13.5 — Memory Warning Handling
**File:** No memory warning handling found
**Current:** Zero references to `didReceiveMemoryWarning`, `UIApplication.didReceiveMemoryWarningNotification`, or `memoryWarning` in any Swift file. The `AppDelegate.swift` contains only an orientation lock method (6 lines). `ChaosCreaturesApp.swift` does not observe memory warnings. `ImageCacheService` has a `clearMemoryCache()` method but it is never called in response to a memory warning.
**Required:** Section 13.3: "Flush non-visible card texture caches on `didReceiveMemoryWarning`." Section 13.4: "Call `TextureCache.shared.evictAll()` when the app receives a memory warning." Section 13.5: "Test memory warning response: verify app recovers gracefully."
**Recommended action:** Add memory warning observer in `AppDelegate` or `ChaosCreaturesApp`:
```swift
NotificationCenter.default.addObserver(
    forName: UIApplication.didReceiveMemoryWarningNotification,
    object: nil, queue: .main
) { _ in
    Task { await ImageCacheService.shared.clearMemoryCache() }
    // TextureCache.shared.evictAll() — when TextureCache is created
}
```

---

### [ABSENT] S13.3 — preferredFramesPerSecond Setting
**File:** No `preferredFramesPerSecond` found in any file
**Current:** Neither `BattleScene.swift` nor `BattleContainerView.swift` (which creates the `SpriteView`) nor `CardParticleFactory.swift` (which creates an `SKView`) sets `preferredFramesPerSecond`. SpriteKit defaults to 60fps, which is correct for gameplay but the guide implies intentional frame rate management.
**Required:** Section 13.3 does not specify an exact fps value but lists `preferredFramesPerSecond` as a performance setting to configure.
**Recommended action:** Set `preferredFramesPerSecond = 60` on the battle SKView. For the particle overlay SKView in `CardParticleFactory`, consider setting 30fps since particles do not require 60fps update rate. This reduces GPU load for idle card views.

---

### [ABSENT] S13.3 — drawsAsynchronously on SpriteKit Nodes
**File:** No `drawsAsynchronously` found in any file
**Current:** Zero references to `drawsAsynchronously` in the entire codebase. No SpriteKit nodes have async drawing enabled.
**Required:** Section 13.3: "`drawsAsynchronously = true` on SpriteKit ambient particle scene."
**Recommended action:** Set `drawsAsynchronously = true` on particle emitter nodes in `CardParticleFactory.swift` and on the ambient battlefield background in `BattleScene.swift`.

---

### [ABSENT] S13.3 — shouldRasterize on Idle Card Layers
**File:** No `shouldRasterize` found in any file
**Current:** Zero references to `shouldRasterize` in the entire codebase. No card layers are rasterized when idle.
**Required:** Section 13.3: "`shouldRasterize = true` on the card composite layer when animations are idle -- caches parchment + frame + text as a single cached bitmap."
**Recommended action:** Set `shouldRasterize = true` and `rasterizationScale = UIScreen.main.scale` on card layers when in `.default` (idle) state. Disable rasterization when animating (to avoid off-screen rendering during animation). Add the debug `CALayer.auditOffscreenRendering()` extension from Section 13.1.

---

### [ABSENT] S13.1 — Off-Screen Rendering Audit
**File:** No off-screen rendering audit code found
**Current:** The `CALayer.auditOffscreenRendering()` debug extension from Section 13.1 does not exist. No `OFFSCREEN_CHECK` compilation condition is defined.
**Required:** Section 13.1 provides a debug-only `CALayer` extension that logs any layer with `shouldRasterize = true` while animating.
**Recommended action:** Add the debug audit extension per Section 13.1. Use it during development to detect off-screen rendering hits.

---

### [ABSENT] S13.5 — App Store Compliance Checks
**File:** No pre-submission legal checklist script found
**Current:** The pre-submission legal checklist from Section 13.5 (license-plist, asset manifest verification, LoRA license gate) is not implemented as a runnable script. No `Settings.bundle` with acknowledgements. No `Resources/LegalEvidence/` directory.
**Required:** Section 13.5 provides a 3-step bash script for pre-submission compliance.
**Recommended action:** Create the pre-submission compliance script. This is needed before App Store submission but not blocking current development.

---

## Summary

| Status | Count |
|--------|-------|
| **COMPLIANT** | 0 |
| **PARTIAL** | 7 |
| **ABSENT** | 19 |
| **CONFLICT** | 1 |
| **Total findings** | 27 |

### Breakdown by Section

| Section | COMPLIANT | PARTIAL | ABSENT | CONFLICT |
|---------|-----------|---------|--------|----------|
| S5 Agent Tool-Use | 0 | 3 | 4 | 0 |
| S7 Haptics | 0 | 0 | 4 | 0 |
| S10 Accessibility | 0 | 2 | 3 | 0 |
| S12 Testing | 0 | 2 | 2 | 1 |
| S13 Performance | 0 | 1 | 8 | 0 |

---

## Priority Recommendations

### Immediate (before next phase)
1. **Create `Scripts/verify_asset.py`** — gates all asset generation (S5.7)
2. **Create `Scripts/verify_contrast.py`** — gates accessibility sign-off (S10.4)
3. **Create `Scripts/compare_screenshots.py`** — gates visual regression (S12.2)
4. **Add memory warning observer** — prevents memory-related crashes (S13.5)
5. **Add "HUMAN PROFILING REQUIRED" to iteration log** for Phases 2 and 3 (S13.1)

### Before next major visual phase
6. **Add Reduce Motion guards** to all 30+ animation sites (S10.3)
7. **Add VoiceOver labels** to all interactive views beyond CardFrameView (S10.1)
8. **Create Dynamic Type `scaledFont()` helper** and apply to card text (S10.2)
9. **Set `drawsAsynchronously` and `shouldRasterize`** on SpriteKit nodes (S13.3)

### Before haptic/audio phase
10. **Create `Resources/Haptics/` and all 6 AHAP files** (S7.2)
11. **Create `HapticEngine.swift`** (S7.2)
12. **Wire haptic calls** to all 11 interaction sites (S7.1)

### Before App Store submission
13. **Create Metal TextureCache** per Section 13.4 (S13.4)
14. **Create texture atlases** for small assets (S13.3)
15. **Run full Instruments profiling** and record results (S13.1, S13.2)
16. **Create pre-submission compliance script** (S13.5)
17. **Create `AccessibilityTests.swift`** UITest (S10.4)
18. **Create reference screenshot baseline** (S12.5)

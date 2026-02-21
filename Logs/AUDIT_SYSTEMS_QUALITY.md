# Audit: Systems & Quality — Sections 5, 7, 10, 12, 13
**Agent:** Audit Agent C
**Date:** 2026-02-21
**Guide:** docs/CARD_DESIGN_GUIDE.md
**Codebase root:** /Users/alexali/Projects/chaos-creatures

---

## Summary

| Section | Items Audited | COMPLIANT | PARTIAL | CONFLICT | ABSENT |
|---------|--------------|-----------|---------|----------|--------|
| §5 Agent Techniques | 7 | 2 | 1 | 0 | 4 |
| §7 Haptics | 9 | 0 | 0 | 1 | 8 |
| §10 Accessibility | 7 | 0 | 1 | 0 | 6 |
| §12 Iterative Testing | 5 | 0 | 1 | 0 | 4 |
| §13 Performance | 7 | 1 | 1 | 0 | 5 |
| **TOTAL** | **35** | **3** | **4** | **1** | **27** |

---

## Section 5 — Agent Tool-Use Techniques

Section 5 describes agent workflow patterns and tooling discipline. The guide specifies several concrete artifacts (scripts, log files, code patterns) that should exist in the project.

---

### [COMPLIANT] Section 5.6 — Context management: iteration log exists

**File:** /Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md (line 1)
**Current:** File exists. Contains a guide-read confirmation entry dated 2026-02-21 with guide sections 1–14 read, locked deployment parameters, and three top-priority sections identified.
**Required:** Guide §5.6 requires writing to `Logs/iteration_log.md` at end of every loop: iteration number, completed components, known issues ranked by priority, next single action. Also requires re-reading at the start of every session.
**Recommended action:** None — the file exists and is in use. Its single entry reflects the beginning of the first implementation session. Verify future sessions continue to append entries per the guide's format.

---

### [COMPLIANT] Section 5.6 — Context resilience: CHECKPOINT.md files exist

**File:** /Users/alexali/Projects/chaos-creatures/ChaosCreatures/CHECKPOINT.md (and 5 other module checkpoints)
**Current:** Six CHECKPOINT.md files exist across modules:
- `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/CHECKPOINT.md`
- `/Users/alexali/Projects/chaos-creatures/supabase/CHECKPOINT.md`
- `/Users/alexali/Projects/chaos-creatures/supabase/functions/CHECKPOINT.md`
- `/Users/alexali/Projects/chaos-creatures/packages/admin-dashboard/CHECKPOINT.md`
- `/Users/alexali/Projects/chaos-creatures/packages/game-server/CHECKPOINT.md`
- `/Users/alexali/Projects/chaos-creatures/CHECKPOINT.md`

The iOS CHECKPOINT.md is detailed (144 lines), covers files created, build results, architecture decisions, and known issues — consistent with the guide's checkpoint format.
**Required:** Guide §5.6 and CLAUDE.md Build Phase Protocol both require per-module CHECKPOINT.md files with status, files created, current task, test results, decisions, and next steps.
**Recommended action:** None — checkpoint infrastructure is in place. The CLAUDE.md-specified format (§Build Phase Protocol) is being followed.

---

### [ABSENT] Section 5.3 — Multi-device screenshot script

**File:** Not found
**Current:** No `Scripts/screenshot_all_devices.sh` file exists anywhere in the project. The `scripts/` directory contains 60+ art generation and texture scripts but no simulator screenshot automation.
**Required:** Guide §5.3 specifies `Scripts/screenshot_all_devices.sh` — a bash script that boots 4 simulator targets (iPhone 15 Pro, iPhone 12, iPad Pro 12.9-inch 6th gen, iPad Air 5th gen), captures a screenshot from each, verifies each output is nonzero, and prints dimensions. This script is invoked as step 2 of the §5.4 Refinement Loop.
**Recommended action:** Create `Scripts/screenshot_all_devices.sh` using the exact implementation from guide §5.3 before beginning any visual refinement iterations. The guide marks this as a required step — refinement loops that skip it cannot be considered complete.

---

### [ABSENT] Section 5.7 — `Scripts/verify_asset.py`

**File:** Not found
**Current:** No `Scripts/verify_asset.py` or any Python verification script exists. The scripts directory contains `.mjs` JavaScript generation scripts and `.sh` shell scripts but no Python asset verification tooling.
**Required:** Guide §5.7 specifies `Scripts/verify_asset.py` as a hard gate after every AI generation call. Must validate: file exists, file is nonzero, file is not a JSON error payload (optional), image dimensions meet minimums (optional), and warm-tone check — fails if image is blue-dominant (optional). Must exit 0 on pass, exit 1 on fail. The guide states this must exist before any generation call.
**Recommended action:** Create `Scripts/verify_asset.py` using the exact implementation from guide §5.7. This is marked as a hard gate — generation pipelines that do not call it risk silently consuming failed generations against the budget.

---

### [ABSENT] Section 5.2 — Metal shader build check in Bash discipline

**File:** Not found
**Current:** No CI or build script checks for Metal shader compile warnings after changes. No `Makefile`, `build.sh`, or CI configuration contains `xcodebuild ... 2>&1 | grep -E "warning:|error:" | grep -i "metal\|shader"`.
**Required:** Guide §5.2 states: "After every Metal shader file change, check for compile warnings" using xcodebuild piped through grep for metal/shader warnings.
**Recommended action:** Add Metal shader warning check to any build validation script. Since no Metal shaders exist yet (they are absent — see Section 6 audit), this will become critical once shaders are implemented.

---

### [ABSENT] Section 5.5 — SwiftUI ↔ MTKView bridge: MetalCardEffectView

**File:** Not found
**Current:** No `MetalCardEffectView`, `CardRenderer`, `NullCardRenderer`, or `OilPaintCardRenderer` exists in the codebase. The `ChaosCreatures/ChaosCreatures/` directory has no Metal-related Swift files. Card rendering uses pure SwiftUI (`CardFrameView.swift`) with Core Animation for rarity effects.
**Required:** Guide §5.5 requires `Sources/Effects/CardRenderer.swift` (a `CardRenderer` protocol plus `NullCardRenderer`) and `MetalCardEffectView` (a `UIViewRepresentable` wrapping `MTKView` with a `Coordinator` conforming to `MTKViewDelegate`). The `NullCardRenderer` must be the default until `OilPaintCardRenderer` is built.
**Recommended action:** This is a foundational architecture piece required before implementing any Metal shaders. Create `CardRenderer.swift` and `MetalCardEffectView.swift` using the guide §5.5 implementations before beginning Section 6 effects work.

---

### [PARTIAL] Section 5.4 — Refinement loop procedure: exists in guide, no evidence of execution

**File:** /Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md (single entry)
**Current:** The iteration log contains one entry confirming guide was read and deployment parameters were written. It does not contain any completed refinement loop entries (no structured critique, no regression diff scores, no "ONE primary gap" identifications).
**Required:** Guide §5.4 specifies a 9-step refinement loop (build → 4-device screenshots → 2 vision comparisons → structured critique to log → compare_screenshots.py on 4 screenshots → identify ONE gap → ONE fix → increment N → repeat). Guide §5.1 states this loop must be executed for every major visual component.
**Recommended action:** No refinement loops have been executed yet — this is appropriate since the guide was read but implementation has not begun. As implementation starts, every visual component must go through the full 9-step loop. The missing scripts (§5.3 screenshot script, §5.7 verify_asset.py, §12.2 compare_screenshots.py) must be created first since they are dependencies of step 2 and step 6.

---

## Section 7 — Haptic Feedback

Section 7 specifies CoreHaptics-based haptic feedback with AHAP pattern files and a `HapticEngine` class. All haptic findings carry the physical device verification flag per guide §7.3.

---

### [ABSENT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7 entire: HapticEngine class

**File:** Not found
**Current:** No `HapticEngine.swift`, no `HapticEngine` class, no `CoreHaptics` import, no `CHHapticEngine` usage, no `UIImpactFeedbackGenerator` call anywhere in the iOS Swift source files (`ChaosCreatures/ChaosCreatures/**/*.swift`). Haptics are completely absent from the codebase.
**Required:** Guide §7 (Swift code block) specifies a `final class HapticEngine` singleton with:
- `static let shared = HapticEngine()`
- `private var engine: CHHapticEngine?`
- `private let supportsHaptics = CHHapticEngine.capabilitiesForHardware().supportsHaptics`
- `func prepare()` — initializes and starts CHHapticEngine, sets stoppedHandler and resetHandler
- `func play(ahapNamed:)` — plays AHAP file from bundle using `engine.playPattern(from:)`
- `func impact(_ style:)` — fallback to `UIImpactFeedbackGenerator` for simple patterns
**Recommended action:** Create `ChaosCreatures/ChaosCreatures/Services/HapticEngine.swift` using the exact implementation from guide §7. Flag as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION in iteration log.

---

### [CONFLICT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7.1: Simple interactions use UIImpactFeedbackGenerator (not CHHapticEngine)

**File:** Not found (neither implementation exists)
**Current:** Neither `CHHapticEngine` nor `UIImpactFeedbackGenerator` exists in the codebase.
**Required:** Guide §7.1 specifies that "card pick up", "card set down", "wax seal tap", "invalid action", and "scroll text box" use `UIImpactFeedbackGenerator` or `UINotificationFeedbackGenerator` — not custom AHAP patterns. The guide's HapticEngine class (`func impact(_ style:)`) routes these through UIImpactFeedbackGenerator even when CHHapticEngine is available. This is intentional — AHAP patterns are reserved for complex multi-event haptics (card flip, summon, graveyard, foil reveals).
**Recommended action:** The conflict is theoretical since no haptic code exists. When implementing, correctly separate: simple interactions (UIImpactFeedbackGenerator via `impact()` method) from complex interactions (CHHapticEngine via `play(ahapNamed:)` method). The guide's own HapticEngine class already resolves this with two separate methods.

---

### [ABSENT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7.2: card_flip.ahap

**File:** Not found
**Current:** No `Resources/Haptics/` directory exists. The Resources directory contains `Assets.xcassets/`, `Fonts/`, `Particles/`, and `Sounds/` but no `Haptics/` subdirectory.
**Required:** Guide §7.2 specifies `card_flip.ahap` — CoreHaptics JSON pattern: transient at 0.0s (intensity 0.4, sharpness 0.6), transient at 0.35s (intensity 0.8, sharpness 0.75). Must be in `Resources/Haptics/`.
**Recommended action:** Create `Resources/Haptics/` directory and create `card_flip.ahap` using the exact JSON from guide §7.2. Add the directory to Xcode project. Flag as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.

---

### [ABSENT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7.2: card_summon.ahap

**File:** Not found
**Current:** No `Resources/Haptics/` directory or AHAP files exist.
**Required:** Guide §7.2 specifies `card_summon.ahap` — HapticContinuous 0→0.8→0.3 over 0.4s with ParameterCurve for HapticIntensityControl. Complete JSON provided in guide.
**Recommended action:** Create `card_summon.ahap` using the exact JSON from guide §7.2. Flag as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.

---

### [ABSENT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7.2: card_graveyard.ahap

**File:** Not found
**Current:** No `Resources/Haptics/` directory or AHAP files exist.
**Required:** Guide §7.2 specifies `card_graveyard.ahap` — HapticContinuous fade-out 0.6→0 over 0.7s. Complete JSON provided in guide.
**Recommended action:** Create `card_graveyard.ahap` using the exact JSON from guide §7.2. Flag as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.

---

### [ABSENT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7.2: foil_shimmer.ahap

**File:** Not found
**Current:** No `Resources/Haptics/` directory or AHAP files exist. No `Scripts/generate_foil_shimmer_ahap.py` script exists.
**Required:** Guide §7.2 specifies `foil_shimmer.ahap` — programmatically generated via `Scripts/generate_foil_shimmer_ahap.py` (provided in guide). Produces irregular transients at 20–80ms random intervals over 1.5s. Uses `random.seed(42)` for reproducibility.
**Recommended action:** Create `Scripts/generate_foil_shimmer_ahap.py` using the guide's Python implementation, run it to generate `Resources/Haptics/foil_shimmer.ahap`, and add the output file to the Xcode project. Flag as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.

---

### [ABSENT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7.2: epic_reveal.ahap

**File:** Not found
**Current:** No `Resources/Haptics/` directory or AHAP files exist.
**Required:** Guide §7.2 specifies `epic_reveal.ahap` — two-phase pattern: continuous 0→0.7→0.4 over 0.6s followed by shimmer continuous 0.2 intensity over 1.2s starting at 0.65s. Complete JSON provided in guide.
**Recommended action:** Create `epic_reveal.ahap` using the exact JSON from guide §7.2. Flag as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.

---

### [ABSENT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7.2: legendary_reveal.ahap

**File:** Not found
**Current:** No `Resources/Haptics/` directory or AHAP files exist.
**Required:** Guide §7.2 specifies `legendary_reveal.ahap` — burst 1.0 transient at 0.0s, 0.85 transient at 0.1s, then continuous shimmer 0.25 intensity over 1.5s starting at 0.25s. Complete JSON provided in guide.
**Recommended action:** Create `legendary_reveal.ahap` using the exact JSON from guide §7.2. Flag as ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.

---

### [ABSENT] ⚠️ PENDING PHYSICAL DEVICE VERIFICATION — Section 7.3: Haptic interactions logged in iteration log

**File:** Not found
**Current:** The `Logs/iteration_log.md` does not contain any haptic interaction entries logged as "⚠️ PENDING PHYSICAL DEVICE VERIFICATION." The log has one entry (guide read confirmation) with no haptic tracking.
**Required:** Guide §7.3 states: "Log every haptic interaction in `Logs/iteration_log.md` as '⚠️ PENDING PHYSICAL DEVICE VERIFICATION.' Do not mark any haptic work as complete without physical device confirmation."
**Recommended action:** When HapticEngine and AHAP files are created, immediately add entries to `Logs/iteration_log.md` for all 11 haptic interactions from §7.1 table (card pick up, card set down, card flip, wax seal tap, card summon, card to graveyard, rare foil reveal, epic reveal, legendary reveal, invalid action, scroll text box) each marked ⚠️ PENDING PHYSICAL DEVICE VERIFICATION.

---

## Section 10 — Accessibility

Section 10 specifies VoiceOver labels, Dynamic Type scaling, Reduce Motion compliance, and WCAG AA color contrast verification.

---

### [ABSENT] Section 10.1 — accessibilityLabel on CardView (CardFrameView)

**File:** /Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift
**Current:** `CardFrameView` (1,986 lines) has no `.accessibilityLabel()`, `.accessibilityElement()`, `.accessibilityHint()`, `.accessibilityAddTraits()`, or `.accessibilityCustomActions()` modifiers anywhere in the file. The card renders visual elements only — it is invisible to VoiceOver.
**Required:** Guide §10.1 specifies:
- `.accessibilityElement(children: .ignore)` on `CardView`
- `.accessibilityLabel(card.voiceOverLabel)` — a computed property on `Card` (or equivalent) that concatenates name, cost, type, ATK/HP, instability, ability text, and flavor text
- `.accessibilityHint("Double-tap to select. Long-press to preview.")`
- `.accessibilityAddTraits(.isButton)`
- `.accessibilityCustomActions` with "Preview card" and "Show card details" actions
**Recommended action:** Add accessibility modifiers to `CardFrameView.body`. Add a `voiceOverLabel` computed property to `CardDisplayData` (the struct already has all required fields). This is a critical accessibility gap that would prevent App Store approval in some markets.

---

### [ABSENT] Section 10.1 — Card.voiceOverLabel computed property

**File:** Not found in CardFrameView.swift, CardDisplayData, or any model file
**Current:** No `voiceOverLabel` property exists on `CardDisplayData`, `CardInstance`, or `CardTemplate`. Searched all Swift files in `ChaosCreatures/ChaosCreatures/` — no `voiceOverLabel` definition found.
**Required:** Guide §10.1 provides the exact `voiceOverLabel` implementation on `Card`:
```swift
var voiceOverLabel: String {
    var parts = [name]
    if let c = cost, c > 0 { parts.append("Cost: \(c) chaos mote\(c == 1 ? "" : "s")") }
    parts.append(type.rawValue.capitalized)
    if let atk = attack, let hp = hp { parts.append("\(atk) attack, \(hp) hit points") }
    if instability > 0 { parts.append("instability \(instability)") }
    parts.append(abilityText)
    if let flavor = flavorText { parts.append("Flavor: \(flavor)") }
    return parts.joined(separator: ". ")
}
```
**Recommended action:** Add `voiceOverLabel` as a computed property on `CardDisplayData` (adapting the guide's `Card` extension). `CardDisplayData` already has `name`, `manaCost`, `cardType`, `attack`, `health`, `instability`, `keywords` (for ability text), and `flavorText` — all fields are available.

---

### [ABSENT] Section 10.2 — Dynamic Type: fonts are hardcoded sizes, no UIFontMetrics scaling

**File:** /Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Config/CardFont.swift
**Current:** All `CardFont` functions take a `size: CGFloat` parameter and return `.custom(family, size: size)` without any `UIFontMetrics` scaling. Example: `static func cardName(size: CGFloat) -> Font { .custom(cinzelFamily, size: size).weight(.bold) }`. The size value is fixed at the call site (e.g., `namePlateFontSize` computed from `CardDisplaySize` enum). There is no Dynamic Type scaling anywhere in the font system.
**Required:** Guide §10.2 specifies: "Never hardcode UIFont sizes — scale with UIFontMetrics." Provides `scaledFont(name:textStyle:baseSize:)` using `UIFontMetrics(forTextStyle:).scaledFont(for:)`. The text box must expand its scroll region at XXL sizes rather than truncating.
**Recommended action:** Add a `scaledFont()` function to `CardFont` using `UIFontMetrics` for text box content (ability text, flavor text — the variable-length text elements). Note: card frame zones are proportional to card dimensions, so card name and stat numbers in fixed-size frames may be exempt. However, the detail/fullscreen text box content must scale. Consult owner on scope: full Dynamic Type compliance requires the text box to grow, which conflicts with the fixed card proportions in §1.4.

---

### [ABSENT] Section 10.3 — Reduce Motion: no `accessibilityReduceMotion` environment checks

**File:** Not found
**Current:** No `.environment(\.accessibilityReduceMotion)` or `UIAccessibility.isReduceMotionEnabled` check exists anywhere in the iOS Swift source. Animations run unconditionally: the `RarityBorderModifier` in `CardFrameView.swift` (lines 1698–1826) starts pulsing/shimmer animations in `.onAppear {}` without checking reduce motion. `ParticleEffects.swift` starts particle animations without reduce motion checks.
**Required:** Guide §10.3 specifies: use `@Environment(\.accessibilityReduceMotion) var reduceMotion` and wrap all animation calls:
```swift
withAnimation(reduceMotion ? .none : .spring(response: 0.35, dampingFraction: 0.65)) { ... }
```
Also: `var parallaxEnabled: Bool { !reduceMotion && effectTier >= .shimmerOnly }`.
**Recommended action:** Add reduce motion checks to all animation sites in `CardFrameView.swift` (rarity pulse animations, shimmer phase animations, gyroscope-driven foil parallax) and to `GyroscopeManager` (disable tilt tracking when reduce motion is enabled). This is an Apple accessibility requirement that affects App Store review.

---

### [PARTIAL] Section 10.4 — Color contrast: palette exists but no verification script

**File:** Not found (`Scripts/verify_contrast.py`)
**Current:** Color palette is defined in `Color+Theme.swift` using hex values (e.g., `Color(hex: "#F0EAD6")` for parchment text, `Color(hex: "#1A1408")` for dark backgrounds). Card text uses `parchmentTextColor = Color(hex: "#F0EAD6")` on dark panel backgrounds. No WCAG contrast verification script exists. No contrast ratio has been calculated or documented.
**Required:** Guide §10.4 provides a complete `Scripts/verify_contrast.py` that calculates WCAG AA contrast ratios for 5 required text/background pairs and exits 1 on any failure. Required checks: ink-black on parchment-light (4.5:1), parchment-dark on parchment-light (3:1 large text), ink-black on parchment-mid (4.5:1), ink-dark-mode on parchment-dark-mode (4.5:1), ink-black on canvas-warm (4.5:1). The guide states this must run as part of every QA pass.
**Recommended action:** Create `Scripts/verify_contrast.py` using the guide's implementation. Note: the codebase uses `#F0EAD6` for card text against dark panels (`Color.black.opacity(0.80)`) — this combination likely passes, but the five guide-specified pairs use different colors (`#F5E6C8` parchment-light, `#D4B896` parchment-mid) that may not match the current implementation. Run the script to confirm.

---

### [ABSENT] Section 10.4 — Accessibility XCTest: CardAccessibilityTests

**File:** Not found
**Current:** The test target `ChaosCreaturesUITests` exists and contains `ScreenshotTests.swift` (stub, TODO only) and `BattleFlowUITests.swift` (stub, TODO only). No `AccessibilityTests.swift` exists. The unit test target `ChaosCreaturesTests` contains model and service tests but no accessibility tests.
**Required:** Guide §10.4 specifies `Tests/AccessibilityTests.swift` containing `CardAccessibilityTests: XCTestCase` with `testCardViewHasAccessibilityLabel()` — launches the app, finds all `buttons` with identifier "CardView", asserts count > 0, asserts each has a non-empty accessibility label. The guide provides the exact xcodebuild test command.
**Recommended action:** Create `ChaosCreaturesUITests/CardAccessibilityTests.swift` using the guide's implementation. This requires `accessibilityIdentifier("CardView")` to also be added to `CardFrameView` (currently absent) so the test can find card elements.

---

### [ABSENT] Section 10.1 — accessibilityActivate() for card selection gesture

**File:** Not found
**Current:** Card selection in `CardFrameView` uses `.onTapGesture {}` on keyword names (line 1150) and tooltip dismissal (line 1230). No `accessibilityActivate()` override or `accessibilityCustomAction` for gesture replication exists.
**Required:** Guide §10.1 specifies `.accessibilityCustomActions` including "Preview card" and "Show card details" custom actions with `UIAccessibilityCustomAction` handlers. These allow VoiceOver users to trigger the same interactions as sighted users performing long-press and double-tap.
**Recommended action:** Implement alongside the primary `accessibilityLabel` work. Both are part of the same guide §10.1 implementation block.

---

## Section 12 — Iterative Testing & Refinement

Section 12 specifies a visual regression script, structured critique template, one-fix-per-loop rules, and exit criteria checklist.

---

### [ABSENT] Section 12.2 — Visual regression script: compare_screenshots.py

**File:** Not found
**Current:** No `Scripts/compare_screenshots.py` exists anywhere in the project. The `scripts/` directory contains art generation scripts (`generate-card-textures.mjs`, etc.) and validation scripts (`validate-art-quality.mjs`, `validate-evolution-quality.mjs`) but no screenshot comparison tooling.
**Required:** Guide §12.2 provides `Scripts/compare_screenshots.py` — a Python script using Pillow that: loads reference and current screenshots, resizes both to 400×560, computes per-pixel difference using `ImageChops.difference()`, calculates a normalized score (0.0–1.0), passes if score < 0.025, outputs JSON with score, threshold, pass/fail, and file paths. Must run on all four device screenshots after every iteration.
**Recommended action:** Create `Scripts/compare_screenshots.py` using the exact guide implementation. Install Pillow dependency (`pip3 install Pillow --break-system-packages`). Establish reference screenshot set when a first "good" iteration is achieved — without reference screenshots, the comparison script cannot function.

---

### [ABSENT] Section 12.3 — Structured critique log: no entries in required format

**File:** /Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md
**Current:** The iteration log exists but contains only one entry (guide read confirmation + deployment parameters). It does not contain any structured critique entries in the guide's format. The required 8-axis table (Material believability, Color temperature, Texture grain, Typography letterpress, Lighting consistency, Tactile impression, iPad vs iPhone, Dark mode) has never been used.
**Required:** Guide §12.3 requires this exact format for every iteration:
```markdown
## Iteration [N] — [Component Name] — [Device]
**Timestamp:** [YYYY-MM-DD HH:MM]
**Reference:** [URL or filename]
| Axis | Score (1-5) | Observation |
...
**Regression check:** [PASS/FAIL] — diff score [X.XXXX]
**Largest gap:** [one sentence]
**Root cause:** [why]
**Next action:** [one specific action]
**Blocked items:** [dependencies]
```
**Recommended action:** Use the guide's exact template for every visual iteration starting with the first rendered card component. Free-form critique is explicitly prohibited by the guide ("No free-form critique").

---

### [ABSENT] Section 12.5 — Exit criteria checklist: not implemented

**File:** Not found
**Current:** No exit criteria checklist has been applied to any card component. The guide's §12.5 lists 13 specific exit criteria that must all pass before a component is declared complete. None of these have been evaluated.
**Required:** Guide §12.5 requires all of the following before any card component is marked complete:
1. All critique axes score 4+ on all four device targets in both light and dark mode
2. Visual regression diff score < 0.025 on all four device screenshots
3. All nine card states render without error on all four simulators
4. Card back renders correctly and flip animation completes without visual artifacts
5. Error fallback states display correctly
6. GPU frame time < 8ms on iPhone 12 [HUMAN gate]
7. No off-screen rendering layers [HUMAN or debug logging]
8. All haptic interactions logged as PENDING PHYSICAL DEVICE VERIFICATION
9. No VoiceOver gaps, all text contrast passes WCAG AA
10. Dynamic Type: card usable at all accessibility text size settings
11. Reduce Motion: static card looks premium without motion effects
12. License manifest entry for every asset used
13. Artwork color grading verified against parchment-light swatch
**Recommended action:** Keep this checklist visible in the iteration log for each component. Mark each item as the implementation progresses.

---

### [PARTIAL] Section 12.4 — Refinement rules: one-fix-per-loop and four-device requirement

**File:** /Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md
**Current:** The iteration log exists but contains no refinement loop entries. No evidence that the one-fix-per-loop rule or four-device requirement has been followed or violated — implementation has not begun. The ScreenshotTests.swift file is a stub (`// TODO: Implement for App Store submission`), suggesting screenshot automation was planned but not implemented.
**Required:** Guide §12.4 states: one fix per loop (no exceptions), run full four-device build after any fix, three failures on same gap means blocked (document and move on), never declare complete on iPhone alone, never declare complete without dark mode screenshot for every state.
**Recommended action:** The rules are not yet applicable since no iterations have been run. Flag for enforcement once visual implementation begins. The critical blocker is the missing four-device screenshot infrastructure (§5.3 script absent).

---

### [ABSENT] Section 12 — Reference anchoring: no pre-implementation anchor entries

**File:** /Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md
**Current:** The iteration log does not contain any reference anchoring entries per guide §12.1 format. No "exact reference URL or filename," "specific quality you are extracting," or "measurable success criteria" have been written before any component implementation.
**Required:** Guide §12.1 states: "Before implementing each component, write to `Logs/iteration_log.md`: exact reference URL or filename, what specific quality you are extracting from it, measurable success criteria in concrete terms. Do not generate or code until this is written."
**Recommended action:** Before beginning any card rendering implementation, write reference anchors for each major component (card frame, text panel, wax seal badges, rarity treatments). Reference §1.10 vision reference images. "Looks good" is explicitly prohibited as a success criterion by the guide.

---

## Section 13 — Performance Profiling

Section 13 specifies texture caching, memory warning handling, Instruments profiling gates, frame rate targets, and GPU performance.

---

### [PARTIAL] Section 13.4 — Image caching exists but is UIImage-based, not MTLTexture LRU

**File:** /Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/ImageCacheService.swift (line 9)
**Current:** `ImageCacheService` is a well-implemented two-tier image cache: `NSCache<NSString, UIImage>` (50MB in-memory) + `URLCache` (200MB disk). It has LRU eviction via `NSCache`'s built-in behavior (count limit 200, cost limit 50MB), `clearMemoryCache()`, and `clearAllCaches()`. This is a solid implementation for card art loaded as `UIImage` via `AsyncImage`.
**Required:** Guide §13.4 specifies `TextureCache` — a `final class` managing `MTLTexture` objects (not `UIImage`) with explicit LRU eviction using an `accessOrder: [String]` array, `maxTextures = 20`, `MTLTextureLoader`, and an `evictAll()` method called on memory warning. This is for Metal GPU textures used by `OilPaintCardRenderer`, not for the card art `UIImage` cache.
**Recommended action:** The existing `ImageCacheService` is appropriate and should be kept for card art loaded into SwiftUI views. The guide's `TextureCache` is a separate concern — it caches Metal GPU textures for the shader pipeline (which does not exist yet). Create `TextureCache.swift` when implementing the Metal shader pipeline (Section 6). Do not replace `ImageCacheService`.

---

### [ABSENT] Section 13.3 — Memory warning handler: no didReceiveMemoryWarning notification observer

**File:** Not found
**Current:** No `UIApplication.didReceiveMemoryWarningNotification` observer exists in `ImageCacheService.swift`, `AppState.swift`, or any other Swift file. The `ImageCacheService` has `clearMemoryCache()` and `clearAllCaches()` methods but nothing calls them on a memory warning. The app does not respond to iOS memory pressure events.
**Required:** Guide §13.3 states: "Flush non-visible card texture caches on `didReceiveMemoryWarning` — implement in the texture manager." Guide §13.4 states: "Call `TextureCache.shared.evictAll()` when the app receives a memory warning." Guide §13.5 states: "Verify app recovers gracefully from memory warning and continues functioning — do not crash."
**Recommended action:** Add a `NotificationCenter.default.addObserver(forName: UIApplication.didReceiveMemoryWarningNotification ...)` observer to `ImageCacheService` (or wherever image/texture caching is managed) that calls `clearMemoryCache()`. This is a stability requirement — unhandled memory pressure can cause app termination.

---

### [ABSENT] Section 13.1 — Instruments profiling history: no trace files or profiling notes

**File:** Not found
**Current:** No `.xctrace` files, no `Logs/Performance/` directory, and no profiling notes exist anywhere in the project. The guide's `Logs/Performance/launch_trace.xctrace` output path does not exist.
**Required:** Guide §13.1 states: at the end of every implementation phase, write to `Logs/iteration_log.md`:
```
⚠️ HUMAN PROFILING REQUIRED:
- GPU Frame Capture in Xcode Instruments
- Metal System Trace
- Core Animation: Color Offscreen-Rendered
Target: all pass performance thresholds in Section 13.2 before this phase is complete.
```
The agent can run `xcrun xctrace record` for Time Profiler and memory pressure simulation (`xcrun simctl send_notification`). GPU frame time must be confirmed by a human.
**Recommended action:** Create `Logs/Performance/` directory. After each implementation phase, run `xcrun xctrace record` with the Time Profiler template and add the human profiling flag to the iteration log. The human profiling checklist from §13.1 must be completed before any phase exit.

---

### [ABSENT] Section 13.2 — Target frame rate enforcement: no preferredFramesPerSecond or CADisplayLink

**File:** Not found
**Current:** No `preferredFramesPerSecond`, `CADisplayLink`, or explicit 60fps enforcement exists in the codebase. Comments in `CreatureNode.swift` (line 619) and `HandCardNode.swift` (line 728) reference "lightweight 60fps performance" in the context of using `SKShapeNode` circles instead of `SKEmitterNode`, but no actual frame rate setting or measurement is implemented.
**Required:** Guide §13.2 performance targets: GPU frame time < 8ms (hard limit) on iPhone 12 for all effects active; < 5ms target. Card state transitions < 200ms (hard limit). SpriteKit frame time with particles active < 5ms hard limit. These require both enforcement (e.g., `skView.preferredFramesPerSecond = 60`) and measurement.
**Recommended action:** Set `preferredFramesPerSecond = 60` on the `SKView` in `BattleScene`. Add the human profiling checklist to the iteration log after each phase. The frame time targets cannot be agent-verified (require Instruments GUI) — flag them as human gates per guide §13.1.

---

### [ABSENT] Section 13.3 — Texture atlases: no SKTextureAtlas usage

**File:** Not found
**Current:** No `SKTextureAtlas` usage exists in any Swift file. The SpriteKit nodes (`CreatureNode`, `HandCardNode`, `BoardNode`, etc.) load textures individually. No `.atlas` bundle exists in the Resources directory.
**Required:** Guide §13.3 optimization technique: "Texture atlases for all small assets (icons, mana symbols, wax seals) — one draw call per atlas." `SKTextureAtlas` groups related sprites, reducing draw calls.
**Recommended action:** Create a texture atlas for SpriteKit-rendered small assets (UI icons, mana symbols, keyword badges used on the battlefield). The card art assets are too large for atlas grouping. This is an optimization — implement after baseline performance is measured.

---

### [COMPLIANT] Section 13.5 — App Store compliance: download size and on-demand resources not yet applicable

**File:** /Users/alexali/Projects/chaos-creatures/ChaosCreatures (project)
**Current:** The app has not been submitted to App Store Connect. No large asset bundles have been compiled. The codebase uses `AsyncImage` for card art loaded from R2 CDN (not bundled), which is the correct pattern for keeping initial download size small. No `.xctrace` exists to measure current binary size.
**Required:** Guide §13.5 requires: initial download < 200MB, use on-demand resources for expansion card sets, peak memory < 800MB on iPhone 12, verify memory warning recovery.
**Recommended action:** This is not yet applicable (pre-submission). Run `xcodebuild archive` when approaching App Store submission and check the IPA size. The CDN-based art loading approach correctly avoids bundling card art in the initial download.

---

## Top 5 Most Critical Gaps

Ranked by impact on App Store submission, user experience, and implementation completeness:

### 1. Haptics: Entire system absent (Section 7)
The HapticEngine class, all 6 AHAP files, and the `Resources/Haptics/` directory do not exist. Haptics are described in the guide as "the primary mechanism for delivering physical material texture through the screen" — a core aesthetic requirement. Without haptics, the "tangible physical materials" aesthetic is incomplete. All 9 items are ABSENT. The physical device verification gate means this cannot be marked complete without device testing. Priority: HIGH for pre-submission implementation.

### 2. Accessibility: No VoiceOver support on any card (Section 10)
`CardFrameView` — the primary card rendering component used everywhere in the app — has zero accessibility modifiers. No `accessibilityLabel`, no `accessibilityHint`, no `accessibilityAddTraits`. VoiceOver users cannot identify any card by name, cost, type, or stats. This is a critical gap for App Store approval in accessibility-compliant markets and for WCAG compliance. Priority: HIGH — must be implemented before App Store submission.

### 3. Reduce Motion: Animations run unconditionally (Section 10)
Rarity pulse animations and gyroscope-driven foil parallax in `CardFrameView` start unconditionally in `.onAppear`. Apple's App Store review includes accessibility checks, and failing to respect `isReduceMotionEnabled` is grounds for rejection. Priority: HIGH — required fix before App Store submission.

### 4. Visual regression infrastructure missing (Sections 5, 12)
Three scripts required by the guide's refinement loop do not exist: `Scripts/screenshot_all_devices.sh`, `Scripts/compare_screenshots.py`, and `Scripts/verify_asset.py`. Without these, the guide's 9-step refinement loop (§5.4) cannot be executed, the exit criteria checklist (§12.5) cannot be verified, and visual regressions cannot be caught automatically. Every visual implementation session is operating without a QA safety net. Priority: HIGH — create before beginning any card rendering implementation.

### 5. Memory warning handler absent (Section 13)
The app does not respond to iOS memory pressure notifications. `ImageCacheService` has cache-clearing methods but nothing triggers them. On low-memory devices (iPhone 12 with 4GB RAM), accumulated card art cache could trigger iOS to terminate the app. The guide explicitly states "verify app recovers gracefully from memory warning and continues functioning — do not crash." Priority: MEDIUM — should be fixed before TestFlight distribution.

---

*End of audit. 35 items assessed. 3 COMPLIANT, 4 PARTIAL, 1 CONFLICT, 27 ABSENT.*

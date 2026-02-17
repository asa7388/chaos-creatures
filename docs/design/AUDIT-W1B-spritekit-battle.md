# Audit W1B: SpriteKit Battle System

**Auditor:** Claude Code (Opus 4.6)
**Date:** 2026-02-17
**Spec Sources:** `docs/design/01-battle-mechanics.md`, `docs/design/07-ui-ux-specs.md`
**Implementation:** 2 Scenes, 10 Nodes, 8 Actions, 2 Utilities, 3 Services (23 Swift files total)

---

## Summary

| Category | Specced | Implemented | Coverage |
|----------|---------|-------------|----------|
| Animation types | 8 | 8 | 100% |
| Board elements | 7 | 7 | 100% |
| Keywords with visuals | 7 | 7 | 100% |
| Turn phases | 11 (9 gameplay + setup + over) | 11 | 100% |
| SFX events | 17 | 17 (enum defined, files pending) | 100% (API) |
| Critical issues | -- | 5 | -- |
| High issues | -- | 6 | -- |
| Medium issues | -- | 8 | -- |

**Overall assessment:** The SpriteKit battle system is architecturally complete and covers all specced animations, board elements, keyword visuals, and turn phases. The code is clean, well-documented, and closely follows the spec. However, there are several issues around spec fidelity, missing behaviors, and potential runtime problems that must be resolved before the battle system is shippable.

---

## Animation Audit

### 1. Card Play (Hand to Board) -- CardPlayAction.swift
**Status: IMPLEMENTED**

- Three-phase animation: scale up (33%), move to slot (44%), scale down (23%) of 0.45s total duration.
- Landing glow via `ParticleEffects.cardPlayGlow()` with faction color particles.
- Screen flash on land.
- Haptic not directly in CardPlayAction -- it is handled in BattleScene via `HapticManager`. **Spec says haptic on land at 0.45s delay (doc 07 Section 3.5).** The current code calls completion() synchronously after the flash setup, but the haptic call from the spec pseudocode is absent from CardPlayAction itself. The BattleScene `animateCardPlayed()` does not call `HapticManager` either.

**Issue [HIGH-01]:** No haptic feedback on card play landing. Doc 07 specifies `HapticManager.shared.lightImpact()` at 0.45s.

### 2. Attack Declaration (Glow + Movement) -- AttackAction.swift
**Status: IMPLEMENTED**

- `fullAttackSequence()`: glow-in (0.2s), lunge to 70% of target distance (0.4x duration), hold at impact (0.1x), snap back (0.5x). Total attack duration: 0.6s.
- Impact shake on target (4 alternating shakes, decaying intensity).
- Red damage flash on target node.
- `setAttackState()` in CreatureNode: red glow pulse via `SKAction.repeatForever` matching doc 07 Section 3.5 attacker glow spec.

**Notes:** The spec mentions a sword icon above the card during declaration (`icon_attack_sword`). This is present in the spec pseudocode but NOT implemented in the actual `CreatureNode.setAttackState()` or `BattleScene.handleAttackerSelection()`. The sword icon is only in the doc 07 spec pseudocode example; the actual implementation uses colorize-based glow only.

**Issue [MEDIUM-01]:** Missing sword icon above attacking creatures during declaration phase. Spec describes `icon_attack_sword` but no such asset or node exists.

### 3. Damage Numbers (Floating Text) -- DamageAction.swift + DamageNumberNode.swift
**Status: IMPLEMENTED**

- Factory methods: `damage()`, `lethalDamage()`, `heal()`, `shieldAbsorb()`, `faceDamage()`.
- Float animation: fade in (0.05s), move up 40pt (0.8s, easeOut), scale pulse (1.3x then 0.8x), fade out at 60% mark, auto-remove.
- Jitter variant for multi-hit staggered display.
- Lethal damage: larger font (22pt vs 18pt base).
- Face damage: even larger (24pt).
- Screen vignette flash on face damage.

**Notes:** Doc 07 specifies `float up 50pt` in the `spawnDamageNumber` pseudocode, but implementation uses 40pt. Minor deviation.

**Issue [MEDIUM-02]:** Damage number float height is 40pt; spec says 50pt.

### 4. Creature Death (Fade/Shatter) -- DeathAction.swift
**Status: IMPLEMENTED**

- Phase 1: White flash + scale up (1.2x).
- Phase 2: Shrink to 0 + fade out (0.5s).
- Phase 3: Remove from parent.
- Faction-specific particles via `ParticleEffects.deathEmitter()`: Ironwright=gold sparks, Fey Courts=green petals, Demonic=red embers.
- Multi-death support with staggered delay (0.1s per creature).
- Graveyard fly animation available in `graveyardFly()` static method.

**Notes:** Doc 07 specifies a screen flash (white, 0.35 alpha, 0.06s in, 0.12s out) + card rotation (`pi/8`) as part of the shatter. The implementation does white flash via `colorize` on the creature itself but does NOT add a full-screen flash node like the spec shows. Also, the spec includes a rotation during fade (`rotate(byAngle: .pi / 8)`), which is absent from the implementation.

**Issue [MEDIUM-03]:** Death animation missing full-screen flash overlay and card rotation during shatter. Spec has both; implementation has colorize-only.

**Issue [MEDIUM-04]:** Graveyard fly animation (`graveyardFly()`) exists in `DeathAction` but is never called from `BattleScene.animateDeaths()`. The spec shows a thumbnail flying from death position to avatar position.

### 5. Chaos Roll (D20 Spin) -- ChaosRollAction.swift + ChaosRollScene.swift
**Status: IMPLEMENTED**

- `createD20Node()`: hexagonal shape (6-sided approximation), 80pt diameter, dark fill, white stroke.
- `spinAndReveal()`: rapid number spin with decelerating tick rate, rotation (6pi), scale pulse, result color reveal, settle bounce (1.3x pulse).
- Result particles via `ParticleEffects.chaosRollEmitter()` with color-coded output.
- Screen flash for ORDER/CHAOS (none for NOTHING).
- `ChaosRollScene`: standalone full-screen overlay with instability display, entrance scale-in, result text label.

**Notes:** D20 is drawn as a 6-sided polygon (hexagon), not a 20-sided polygon. The spec says "20-sided regular polygon, 80pt diameter" for the `SKShapeNode`. This is a visual mismatch -- a hexagon looks nothing like an icosahedron face.

**Issue [HIGH-02]:** D20 shape is a hexagon (6 sides) instead of a 20-sided polygon as specced. The spec explicitly states "20-sided regular polygon." While a true D20 is an icosahedron (3D), the 2D representation should at least approximate a many-sided polygon, not a hexagon.

**Issue [MEDIUM-05]:** Roll duration calculation differs. Spec pseudocode: `1.5 + (instability / 20.0)` seconds (max ~2.5s). Implementation: `chaosRollBase * 0.67` for spin phase (~1.0s), plus reveal/hold. The instability-based duration modulation from the spec (higher instability = longer roll) is not applied in `ChaosRollAction.spinAndReveal()` -- the base duration is fixed. It IS applied in `BattleScene.animateChaosRoll()` for the older inline approach that was replaced.

### 6. Event Popup (Slide In/Out) -- EventSlideAction.swift + EventBannerNode.swift
**Status: IMPLEMENTED**

- `EventBannerNode`: background panel (280x180pt), faction-colored border, icon, title, description (multiline), outer glow border.
- Slide-in from top (0.3s, easeOut), hold (2.5s), slide-out to top (0.3s, easeIn).
- Full-screen color flash behind banner.
- `showTurnBanner()`, `showCombatBanner()`, `showGameOverBanner()` convenience methods.
- Banner auto-dismisses; also has manual `dismiss()`.

**Notes:** Spec says event overlay has a "tap anywhere to dismiss" interaction in `touchesBegan`. The `EventBannerNode` has a `dismiss()` method but does NOT set `isUserInteractionEnabled = true` and does NOT override `touchesBegan`. Tap-to-dismiss is not wired up.

**Issue [HIGH-03]:** Event banner does not support tap-to-dismiss. Spec requires "tap anywhere on overlay: touchesBegan calls dismiss() immediately." The banner only auto-dismisses after the hold timer.

### 7. Heal Effect -- HealAction.swift
**Status: IMPLEMENTED**

- Green floating number via `DamageNumberNode.heal()`.
- Green glow flash on target creature.
- Heal particle emitter via `ParticleEffects.healEmitter()`.
- `showLifesteal()`: 0.2s delay after damage for staggered display.
- `showPlayerHeal()`: green number near avatar + subtle green screen flash.

**Quality:** Clean implementation, matches spec intent well.

### 8. Shield Break -- ShieldBreakAction.swift
**Status: IMPLEMENTED**

- Removes shield overlay from creature.
- "Shield!" text via `DamageNumberNode.shieldAbsorb()`.
- Blue shatter particles via `ParticleEffects.shieldBreakEmitter()`.
- Blue flash on creature (0.05s in, 0.3s out).
- `playShieldGrant()` also available for shield regeneration events.

**Quality:** Good implementation. Matches spec for shield absorption visual feedback.

---

## Board Layout Audit

### 5 Creature Slots Per Player
**Status: IMPLEMENTED**
- `SK.Board.slotCount = 5` in SpriteKitConstants.
- `BoardNode` creates 5 `SKShapeNode` slots arranged horizontally.
- `creatureNodes` array: `Array(repeating: nil, count: 5)`.

### Slot Size: 64x90pt
**Status: IMPLEMENTED**
- `SK.Board.slotSize = CGSize(width: 64, height: 90)` matches spec exactly.

### Phase Indicator Present
**Status: IMPLEMENTED**
- `PhaseIndicatorNode`: 9 phase dots with labels, current phase highlighted with color and 1.5x scale.
- Displays: Start, Roll, Event, Draw, Main, Attack, Block, Combat, End.
- Phase-specific coloring: Roll/Event=red, Attack/Block/Combat=attacker red, Main=blue, others=white.
- Large current phase name label above dots with scale-up animation on transition.

### Turn Timer Present
**Status: IMPLEMENTED**
- `TimerNode`: circular ring timer (radius 22pt, 4pt ring width).
- Progress ring drains clockwise.
- Blue (normal) to red (urgent at <=10s) with pulse animation.
- Text label shows seconds remaining.
- Activated during decision phases only (.mainPhase, .declareAttackers, .assignBlockers).

**Issue [HIGH-04]:** Timer urgent threshold is 10 seconds in implementation (`urgentThreshold = 10`), but doc 07 specifies 15 seconds ("15-0s: red, repeating opacity pulse"). Doc 01 also says "At 15 seconds remaining: timer bar turns red, audio/visual warning."

### Mana Bar Present
**Status: IMPLEMENTED**
- `ManaBarNode`: 10 circular gems (radius 8pt, 3pt spacing).
- Filled = faction color, empty = dark gray.
- `animateSpend()`: scale pulse on spent gem.
- `animateGain()`: scale glow on gained gem.

**Issue [MEDIUM-06]:** Mana bar uses gem circles (radius 8pt = 16pt diameter) instead of the 20pt diameter circles specified in doc 07 Section 3.2 (`ManaRowView`). The SpriteKit implementation is smaller than the SwiftUI HUD spec. Note: the SpriteKit mana bar may be a secondary display since the primary ManaRowView is in SwiftUI overlay. But both exist.

### Hand Cards Visible
**Status: IMPLEMENTED**
- `HandNode` + `HandCardNode`: SpriteKit-based hand rendering with card art, name, cost badge, stats.
- Doc 07 specifies hand as SwiftUI `HandScrollView` overlay (primary). The SpriteKit `HandNode` is a secondary tracking system for animation origin points.
- `HandCardNode.setPlayable()`: dims unaffordable cards.
- Opponent hand: rendered as face-down count in SwiftUI HUD (`opponentHandCount`).

### Avatar Nodes for Both Players
**Status: IMPLEMENTED**
- `AvatarNode`: 48x48pt sprite with 3pt faction-colored border ring.
- Instability label below (color-coded: red >=15, blue <=4, white otherwise).
- Async avatar image loading.
- Player avatar: bottom-left. Opponent avatar: top-right.

---

## Keyword Rendering Audit

All 7 keywords have visual representation:

| Keyword | Color | Visual | Status |
|---------|-------|--------|--------|
| Shield | `#5BC0EB` (blue) | Keyword icon + shield overlay (breathing animation) + shield break particles | IMPLEMENTED |
| Lifesteal | `#4CAF50` (green) | Keyword icon + heal glow on damage dealt | IMPLEMENTED |
| Flying | `#81D4FA` (light blue) | Keyword icon (colored square) | IMPLEMENTED |
| Reach | `#8D6E63` (brown) | Keyword icon (colored square) | IMPLEMENTED |
| Deathtouch | `#9C27B0` (purple) | Keyword icon (colored square) | IMPLEMENTED |
| Taunt | `#FFD700` (gold) | Keyword icon + dedicated taunt icon (14x14, top-right) with pulse animation | IMPLEMENTED |
| Piercing | `#FF7043` (orange) | Keyword icon (colored square) | IMPLEMENTED |

**Notes:** Keywords are rendered as small colored squares (`SK.Card.keywordIconSize = 12pt`), max 3 displayed. They are positioned between the art and stats bar. At 64x90pt card scale, these are small but distinguishable by color.

**Issue [MEDIUM-07]:** Keywords use plain colored squares, not actual icons or symbols. The spec's `BoardCardNode` pseudocode references `SKSpriteNode(imageNamed:)` for keyword icons, implying asset-based icons. The implementation uses colored `SKSpriteNode` rectangles as placeholders. Flying, Reach, Deathtouch, and Piercing are visually identical except for color. On a 64x90pt card, differentiating 12pt colored squares may be difficult for colorblind players.

**Issue [MEDIUM-08]:** Shield has a dedicated overlay with breathing animation (good), and Taunt has a dedicated pulsing icon (good), but the other 5 keywords (Lifesteal, Flying, Reach, Deathtouch, Piercing) rely solely on colored squares with no distinct iconography.

---

## Battle Flow Audit

### BattleStateMachine -- 11 Turn Phases
**Status: IMPLEMENTED**

The `TurnPhase` enum defines all 11 phases from doc 01:

| Doc 01 Phase | Enum Case | Display Name |
|---|---|---|
| (Setup) | `.gameSetup` | "Setup" |
| Phase 1: Start of Turn | `.startOfTurn` | "Start" |
| Phase 2: Chaos Roll | `.chaosRoll` | "Roll" |
| Phase 3: Event Resolution | `.eventResolution` | "Event" |
| Phase 4: Draw & Gain Mana | `.drawAndMana` | "Draw" |
| Phase 5: Main Phase | `.mainPhase` | "Main" |
| Phase 6: Declare Attackers | `.declareAttackers` | "Attack" |
| Phase 7: Assign Blockers | `.assignBlockers` | "Block" |
| Phase 8: Combat Resolution | `.combatResolution` | "Combat" |
| Phase 9: End of Turn | `.endTurn` | "End" |
| (Game Over) | `.gameOver` | "Over" |

Decision phases correctly identified: `.mainPhase`, `.declareAttackers`, `.assignBlockers`.

Phase indicator displays 9 gameplay phases (excludes setup and game over). Matches spec.

### BattleStateMachine Event Queue
**Status: IMPLEMENTED**

- FIFO event queue with sequential processing.
- `handleServerEvent()` dispatches by type: state snapshots apply immediately; phase changes transition + enqueue; other events enqueue.
- `animationDidComplete()` advances the queue.
- `flushEventQueue()` for reconnection scenarios.

### Drag-to-Play for Playing Cards from Hand
**Status: PARTIALLY IMPLEMENTED**

Doc 07 specifies "Drag cards from hand" during Main Phase. The current implementation:
- Hand is primarily SwiftUI (`HandScrollView` overlay).
- `HandCardNode` has `isDragging` and `originalPosition` properties, suggesting drag was planned.
- `BattleScene.touchesBegan` during `.mainPhase` has a `break` (no action).
- Card playing is triggered via `BattleViewModel.playCard()` which sends the action to the server delegate.

**Issue [CRITICAL-01]:** No drag-to-play interaction is wired up. During Main Phase, touching the SpriteKit scene does nothing. The hand is in SwiftUI, but there is no tap-to-select-then-tap-slot or drag gesture from the SwiftUI hand to a board slot. The `BattleSceneDelegate.didSelectHandCard` exists but is never invoked from touch handling. Players currently have no way to play cards to the board via the UI.

### Blocker Assignment UI
**Status: IMPLEMENTED**

- `handleBlockerDragStart()`: identifies touched creature on player board during Block phase.
- `handleBlockerDragMove()`: draws line from blocker to touch position, highlights valid targets green / invalid red.
- `handleBlockerDragEnd()`: if dropped on opponent creature, calls `stateMachine.assignBlocker()` and draws persistent line.
- Block lines stored in `blockerLines` dictionary, cleared on phase change.

**Notes:** The blocker assignment logic checks `!sm.isMyTurn` for the block phase. This is correct per doc 01 -- the defending player (non-active player) assigns blockers.

**Issue [HIGH-05]:** Taunt auto-block is not implemented in the SpriteKit touch handling. Doc 07 Section 3.5 specifies: "Taunt creature auto-block: assigned automatically when Block phase begins. Block line drawn. Touch events on the Taunt card node return immediately without processing (isUserInteractionEnabled = false). Banner: 'Your Taunt creature must block.'" None of this exists in `BattleScene`.

### Chaos Roll Scene Transitions
**Status: IMPLEMENTED**

- `BattleScene.animateChaosRoll()`: creates D20 node at center, fades in, calls `ChaosRollAction.spinAndReveal()`, then result particles/flash, then fade out and advance queue.
- `ChaosRollScene`: standalone scene available for full-screen presentation.
- Result colors: Order=blue, Chaos=red, Nothing=gray. All match spec.

### Event Banner Displays Order/Chaos Events
**Status: IMPLEMENTED**

- `BattleScene.animateEventTriggered()` calls `EventSlideAction.showEvent()`.
- `EventBannerNode` shows event name, type, description with slide-in/hold/slide-out animation.
- Color-coded: Order=blue, Chaos=red.

### Practice Match vs Bot (BattleViewModel)
**Status: PARTIALLY IMPLEMENTED**

- `BattleViewModel` bridges state machine to SwiftUI.
- Server events handled via `handleServerEvent()`.
- Player actions sent via `battleDelegate?.battleScene(_, didRequestAction:)`.
- No local bot/AI logic exists. Practice match requires the Railway game server to be running.

**Issue [CRITICAL-02]:** No offline/local bot mode for practice matches. `BattleViewModel` is entirely server-dependent. For testing and development without the game server, there is no way to play a practice match. This blocks Simulator testing of the battle flow.

---

## Audio Audit

### BattleAudioManager
**Status: IMPLEMENTED (API complete, assets pending)**

- Singleton `BattleAudioManager.shared`.
- AVAudioEngine for adaptive music stems (base, tension, chaos, victory per faction).
- 17 SFX defined in `SFX` enum covering all battle events:
  - `cardPlay`, `attack`, `damage`, `death`, `heal`, `shieldBreak`
  - `chaosRollStart`, `chaosRollOrder`, `chaosRollChaos`, `chaosRollNothing`
  - `eventOrder`, `eventChaos`, `turnStart`, `manaGain`
  - `buttonTap`, `victory`, `defeat`, `chaosSpark`
- `playSFX()` uses SpriteKit `SKAction.playSoundFileNamed` with AVAudioPlayer fallback.
- Adaptive music: tension ramps with low HP, chaos stem during roll/event phases.
- Volume controls for music and SFX independently.
- Audio session configured as `.ambient` with `.mixWithOthers`.

**Issue [CRITICAL-03]:** SFX calls are never wired into the animation pipeline. `BattleAudioManager.playSFX()` is never called from any Action file (AttackAction, DamageAction, DeathAction, CardPlayAction, ChaosRollAction, etc.) or from BattleScene. The audio manager exists in isolation. No battle sounds will play.

**Issue [HIGH-06]:** Adaptive music `updateMusicState()` is never called from BattleScene or BattleViewModel. The music system exists but is disconnected from the game loop.

**Issue [CRITICAL-04]:** No audio asset files exist in the project. All `.wav` and `.caf` files referenced by the SFX enum are absent. `playSFX()` gracefully no-ops on missing files, but this means zero audio in battle until assets are created and added.

---

## Critical Issues

| ID | Description | Affected Files |
|----|-------------|----------------|
| CRITICAL-01 | **No card play interaction.** No drag-to-play or tap-to-play from hand to board is wired up. Players cannot play cards. The SwiftUI hand has no gesture to trigger `playCard()`, and BattleScene's main phase touch handler is a no-op. | `BattleScene.swift`, `BattleViewModel.swift` |
| CRITICAL-02 | **No offline practice mode.** BattleViewModel is 100% server-dependent. No local bot exists for Simulator testing or practice play. | `BattleViewModel.swift` |
| CRITICAL-03 | **Audio never triggered.** BattleAudioManager has 17 SFX defined but none are called from any animation action or scene. Battle is completely silent. | `BattleAudioManager.swift`, all Action files |
| CRITICAL-04 | **No audio assets.** All `.wav`/`.caf` files referenced by SFX enum do not exist in the bundle. | Resources/Audio/ |
| CRITICAL-05 | **Blocker assignment ignores Taunt forced-block rules.** The assignBlockers phase has no Taunt auto-assignment, no Taunt banner, no forced-block enforcement. Per doc 01, Taunt creatures MUST block if able. Without this, the core defensive keyword is broken. | `BattleScene.swift` |

---

## High Issues

| ID | Description | Affected Files |
|----|-------------|----------------|
| HIGH-01 | No haptic feedback on card play landing. Doc 07 specifies `HapticManager.shared.lightImpact()`. | `CardPlayAction.swift`, `BattleScene.swift` |
| HIGH-02 | D20 is a hexagon (6 sides) instead of a many-sided polygon. Spec says "20-sided regular polygon." | `ChaosRollAction.swift` |
| HIGH-03 | Event banner has no tap-to-dismiss. Spec requires "tap anywhere calls dismiss()." Players cannot skip the 2.5s hold. | `EventBannerNode.swift` |
| HIGH-04 | Timer urgent threshold is 10s, spec says 15s. Affects urgency timing for both visual and audio warnings. | `TimerNode.swift` |
| HIGH-05 | Taunt forced-attack banner missing during Declare Attackers phase. Spec describes gold banner "Taunt forces your attack" with auto-glow. | `BattleScene.swift` |
| HIGH-06 | Adaptive music `updateMusicState()` never called from game loop. Music system is disconnected. | `BattleAudioManager.swift`, `BattleScene.swift` |

---

## Medium Issues

| ID | Description | Affected Files |
|----|-------------|----------------|
| MEDIUM-01 | Missing sword icon above attacking creatures during declaration. Spec references `icon_attack_sword`. | `BattleScene.swift`, `CreatureNode.swift` |
| MEDIUM-02 | Damage number float height is 40pt; spec says 50pt. | `DamageNumberNode.swift` |
| MEDIUM-03 | Death animation missing full-screen flash overlay and card rotation during shatter. | `DeathAction.swift` |
| MEDIUM-04 | Graveyard fly animation exists but is never called. Dead creatures don't animate toward the avatar/graveyard icon. | `DeathAction.swift`, `BattleScene.swift` |
| MEDIUM-05 | Chaos roll spin duration does not incorporate instability-based modulation as spec requires. | `ChaosRollAction.swift` |
| MEDIUM-06 | SpriteKit mana gems are 16pt diameter vs spec's 20pt. | `ManaBarNode.swift` |
| MEDIUM-07 | Keywords use plain colored squares instead of asset-based icons. Hard to differentiate, especially for colorblind players. | `CreatureNode.swift` |
| MEDIUM-08 | Only Shield and Taunt have distinctive visual overlays. Other 5 keywords (Lifesteal, Flying, Reach, Deathtouch, Piercing) rely on small colored squares with no iconography. | `CreatureNode.swift` |

---

## File Inventory

### Scenes (2)
| File | Lines | Status |
|------|-------|--------|
| `SpriteKit/Scenes/BattleScene.swift` | 823 | Core scene, well-structured, handles all server events |
| `SpriteKit/Scenes/ChaosRollScene.swift` | 152 | Standalone D20 scene, usable for testing |

### Nodes (10)
| File | Lines | Status |
|------|-------|--------|
| `SpriteKit/Nodes/AvatarNode.swift` | 85 | Complete, clean |
| `SpriteKit/Nodes/BoardNode.swift` | 211 | Complete, comprehensive slot management |
| `SpriteKit/Nodes/CreatureNode.swift` | 351 | Complete, all visual states |
| `SpriteKit/Nodes/DamageNumberNode.swift` | 132 | Complete, good factory pattern |
| `SpriteKit/Nodes/EventBannerNode.swift` | 144 | Complete, missing tap-to-dismiss |
| `SpriteKit/Nodes/HandCardNode.swift` | 134 | Complete, drag support stubbed |
| `SpriteKit/Nodes/HandNode.swift` | 97 | Complete, layout management |
| `SpriteKit/Nodes/ManaBarNode.swift` | 100 | Complete, animations clean |
| `SpriteKit/Nodes/PhaseIndicatorNode.swift` | 135 | Complete, 9 phases displayed |
| `SpriteKit/Nodes/TimerNode.swift` | 163 | Complete, wrong urgent threshold |

### Actions (8)
| File | Lines | Status |
|------|-------|--------|
| `SpriteKit/Actions/AttackAction.swift` | 106 | Complete, 4 methods |
| `SpriteKit/Actions/CardPlayAction.swift` | 81 | Complete, 3 methods |
| `SpriteKit/Actions/ChaosRollAction.swift` | 188 | Complete, D20 shape wrong |
| `SpriteKit/Actions/DamageAction.swift` | 115 | Complete, 4 methods |
| `SpriteKit/Actions/DeathAction.swift` | 117 | Complete, faction particles |
| `SpriteKit/Actions/EventSlideAction.swift` | 118 | Complete, 5 banner types |
| `SpriteKit/Actions/HealAction.swift` | 86 | Complete, 3 methods |
| `SpriteKit/Actions/ShieldBreakAction.swift` | 64 | Complete, break + grant |

### Utilities (2)
| File | Lines | Status |
|------|-------|--------|
| `SpriteKit/Utilities/ParticleEffects.swift` | 258 | Complete, 7 emitter types |
| `SpriteKit/Utilities/SpriteKitConstants.swift` | 231 | Complete, well-organized |

### Services (3)
| File | Lines | Status |
|------|-------|--------|
| `Services/BattleViewModel.swift` | 223 | Complete, clean MVVM bridge |
| `Services/BattleStateMachine.swift` | 223 | Complete, FIFO animation queue |
| `Services/BattleAudioManager.swift` | 283 | Complete API, disconnected |

---

## Recommendations (Priority Order)

1. **Wire card play interaction** (CRITICAL-01): Implement tap-on-hand-card then tap-on-slot gesture flow through BattleViewModel and BattleScene. This is the #1 blocker for any gameplay.

2. **Wire audio into animations** (CRITICAL-03): Add `BattleAudioManager.shared.playSFX()` calls into each Action file's main animation method. This is straightforward but must be done for every animation type.

3. **Implement Taunt forced-block and forced-attack** (CRITICAL-05 + HIGH-05): Add auto-assignment logic at block phase start, draw auto-block lines, show banners, and enforce Taunt attack rules during attacker declaration.

4. **Create placeholder audio assets** (CRITICAL-04): Generate or source 17 placeholder `.wav` files for the SFX enum. Can be simple beeps/clicks for development; replace with polished audio later.

5. **Add local bot for practice mode** (CRITICAL-02): Create a `LocalBotService` that generates server events locally so the battle system can be tested in the Simulator without Railway.

6. **Fix D20 polygon** (HIGH-02): Change from 6-sided to at minimum a 12+ sided polygon.

7. **Fix timer urgent threshold** (HIGH-04): Change from 10 to 15 seconds.

8. **Add tap-to-dismiss on event banner** (HIGH-03): Set `isUserInteractionEnabled = true` on EventBannerNode and implement `touchesBegan`.

---

## Revision Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-17 | Claude Code (Opus 4.6) | Initial audit of SpriteKit battle system against docs 01 and 07 |

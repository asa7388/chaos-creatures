# 07 — UI/UX Specifications

**Chaos Creatures — Mobile Card Game Interface Design**
**Version: 2.0 — Revised for React Native (Expo) / TypeScript**

This document is the complete UI/UX specification for engineering implementation. It covers every screen, interaction pattern, animation, and component in the player-facing mobile app AND the owner-facing admin dashboard. All component names reference actual React Native primitives or the named third-party libraries listed below.

**Design Philosophy:** Clean, stylish, card-game-native. Dark theme default with faction-themed light accents. Think Balatro's clarity, Marvel Snap's speed, Slay the Spire's readability. Every screen serves one primary purpose with minimal navigation friction.

**Depends on:** `00-game-design-master.md`, `01-battle-mechanics.md`, `02-card-data-model.md`

---

## Technology Stack Decisions (Non-Negotiable)

These are fixed decisions. Do not use alternatives.

| Layer | Technology | Notes |
|---|---|---|
| Client framework | React Native (Expo SDK 51+) | TypeScript only. Ships via Expo EAS Build. |
| Navigation | Expo Router v3 (file-based routing) | Bottom tabs, stack navigators, modals all via Expo Router. |
| Animation library | React Native Reanimated 3 | All card animations, transitions, layout shifts. |
| 2D graphics / particles | React Native Skia | D20 rendering, particle effects, card frame drawing, HP bars. |
| Gesture handling | React Native Gesture Handler | Drag interactions (blocker assignment, hand play), swipe, long-press. |
| State management | Zustand | Global game state, collection state, deck builder state. |
| Server state / caching | TanStack Query (React Query) | All Supabase data fetching, mutation, and cache invalidation. |
| Real-time match comms | Supabase Realtime (channels) | WebSocket match state from Railway game server. |
| Backend database | Supabase (Postgres + Edge Functions) | Auth, player data, card data, deck data, economy. |
| Card art CDN | Cloudflare R2 | All generated card art served via R2 CDN URL. |
| Analytics | PostHog | All player events. Use `posthog-react-native`. |
| Payments | Expo IAP (expo-in-app-purchases) | Wraps App Store / Google Play native IAP. |
| Haptics | Expo Haptics | All haptic feedback. |
| Sharing | Expo Sharing + Expo FileSystem | Evolution share screenshots. |

---

## Part A — Player-Facing App

---

## 1. Screen Inventory

Complete list of all screens with primary purpose and access path.

### Core Screens (Always Accessible)

| Screen | Primary Purpose | Access Path | Expo Router Path |
|--------|----------------|-------------|-----------------|
| **Home** | Dashboard and play entry point | Bottom tab bar (position 1) | `/(tabs)/home` |
| **Collection** | Browse and manage owned cards | Bottom tab bar (position 2) | `/(tabs)/collection` |
| **Decks** | Build and edit decks | Bottom tab bar (position 3) | `/(tabs)/decks` |
| **Profile** | Player stats, achievements, showcase | Bottom tab bar (position 4) | `/(tabs)/profile` |
| **Shop** | Subscriptions, shards, cosmetics | Bottom tab bar (position 5) | `/(tabs)/shop` |

### Battle Flow Screens

| Screen | Primary Purpose | Access Path | Expo Router Path |
|--------|----------------|-------------|-----------------|
| **Mode Selection** | Choose Ranked / Casual / Practice | Tap Play on Home | `/battle/mode-select` |
| **Matchmaking** | Queue for match, show opponent | After mode selection | `/battle/matchmaking` |
| **Battle** | Main gameplay screen | After match found | `/battle/[matchId]` |
| **Post-Match Results** | Results, rewards, XP, evolution-ready cards | After battle ends | `/battle/results` |

### Card Management Screens

| Screen | Primary Purpose | Access Path | Expo Router Path |
|--------|----------------|-------------|-----------------|
| **Card Detail** | Full stats, evolution history, actions | Tap any card anywhere | `/card/[cardInstanceId]` |
| **Evolution Flow** | Multi-step evolution ritual | Tap Evolve in Card Detail | `/card/[cardInstanceId]/evolve` |
| **Graveyard** | Destroyed cards during battle | Tap avatar in battle | Modal over battle screen |

### Secondary Screens

| Screen | Primary Purpose | Access Path | Expo Router Path |
|--------|----------------|-------------|-----------------|
| **Settings** | Account, audio, visual, gameplay | Gear icon (top-right, any screen) | `/settings` |
| **Achievements** | View achievement progress | Profile → Achievements | `/profile/achievements` |
| **Battle Log** | Chronological action history | Side panel in battle | Side drawer in battle |
| **Onboarding Tutorial** | First-time user education | First launch only | `/onboarding` |

---

## 2. Navigation Map

```
[App Launch]
    |
    +--> [Onboarding] (first launch: /onboarding)
    |         |
    |         v
    +--> [Expo Router Tabs Layout]
              |
    ┌─────────────────────────────────────────────────────┐
    │              Bottom Tab Bar (persistent)            │
    │  [Home]  [Collection]  [Decks]  [Profile]  [Shop]  │
    └─────────────────────────────────────────────────────┘
         |          |           |          |         |
         v          v           v          v         v
      /home    /collection   /decks    /profile   /shop
         |          |           |          |         |
         |      /card/[id]  /decks/[id]  /profile/ /shop/
         |          |       (builder)   achievements  sub
         |      /card/[id]/             /profile/
         |       evolve                  friends
         |
    /battle/mode-select
         |
    /battle/matchmaking
         |
    /battle/[matchId]  <-- full-screen, hides tab bar
         |   |
         |   +--> [Battle Log] (Animated.View slide-in panel, left)
         |   +--> [Graveyard] (Modal, full-height)
         |   +--> [Card Detail] (Modal, from tapping board card)
         |
    /battle/results
         |
         +--> /home (Play Again)
         +--> /collection?filter=evolution-ready (Evolve Cards)

[Settings] accessible via stack push from any screen via gear icon.
```

**Navigation Principles:**

- Bottom tab bar uses `Tabs` component from Expo Router. It is hidden on `/battle/[matchId]` using `tabBarStyle: { display: 'none' }` in the screen options.
- Modal screens (Card Detail, Graveyard, Evolution Flow) use `presentation: 'modal'` in Expo Router screen options.
- Deep linking: Push notification "card ready to evolve" links to `/card/[cardInstanceId]/evolve`.
- All back navigation uses the Expo Router `router.back()` method. No custom back button logic.

---

## 3. Battlefield Screen (Detailed)

The most important screen in the game. Route: `/battle/[matchId]`. Full-screen, portrait orientation locked via `expo-screen-orientation` set to `PORTRAIT` on mount.

### 3.1 Layout Specification

The battle screen is a single `View` with `flex: 1, backgroundColor: '#0D0D0D'`. All regions are absolutely positioned or use `flexDirection: 'column'` with explicit heights.

```
Screen (375pt wide reference, portrait)
┌──────────────────────────────────────────────┐  Total height: ~812pt (iPhone 14)
│  OpponentInfoBar                             │  h: 64pt
│  [Avatar 48x48] [Name] [HP Bar] [Instability]│
│  [HandCount] [DeckCount] [Mana row x10]      │
├──────────────────────────────────────────────┤
│  OpponentBoard (5 slots)                     │  h: 110pt
│  [Slot][Slot][Slot][Slot][Slot]              │
├──────────────────────────────────────────────┤
│  CenterZone                                  │  h: 120pt
│  [D20Component]  [PhaseIndicator]            │
│  [EventOverlay - conditional]                │
├──────────────────────────────────────────────┤
│  PlayerBoard (5 slots)                       │  h: 110pt
│  [Slot][Slot][Slot][Slot][Slot]              │
├──────────────────────────────────────────────┤
│  PlayerInfoBar                               │  h: 56pt
│  [Avatar 48x48] [Name] [HP Bar] [Instability]│
│  [TimerBar]                                  │
├──────────────────────────────────────────────┤
│  HandScrollView                              │  h: 128pt
│  Horizontal ScrollView of CardInHand items   │
├──────────────────────────────────────────────┤
│  BottomControls                              │  h: 56pt
│  [ManaDisplay] [BattleLogButton] [EndTurnBtn]│
└──────────────────────────────────────────────┘
  (+ SafeAreaView inset bottom for home bar)
```

All heights are fixed values, not percentages, to guarantee layout stability during animations.

### 3.2 Component Specifications

All components below are React Native components unless noted as Skia or Reanimated.

#### OpponentInfoBar and PlayerInfoBar

```
Component: View
style: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
         backgroundColor: '#141414', borderBottomWidth: 1, borderColor: '#2A2A2A' }
```

Children:
- **AvatarFrame**: `Pressable` wrapping a `Image` (60x60pt). Source: Cloudflare R2 CDN URL. Faction-themed border: 3pt solid, color = faction accent. On press: open Graveyard modal. `onLongPress` opens player profile tooltip.
- **HpBar**: Custom Skia component. See HpBar spec below.
- **InstabilityDisplay**: `Text` 18pt bold. Color: white normally, red if instability >= 15, blue if <= 4.
- **HandCountBadge** (opponent only): `View` + `Text` showing "[N] cards". No interaction.
- **ManaRow**: Row of 10 `View` circles (20pt diameter, 3pt gap). Filled = faction accent color. Empty = '#2A2A2A'. No interaction.

#### HpBar (Skia Component)

File: `components/battle/HpBar.tsx`

Use `@shopify/react-native-skia` `Canvas` component.

- Canvas dimensions: width = full parent width minus 80pt (for avatar), height = 28pt.
- Background rect: dark gray `#1A1A1A`, rounded corners 6pt.
- Filled rect width: `(currentHp / maxHp) * totalWidth`. Color interpolation:
  - 100-60%: `#4CAF50` (green)
  - 59-30%: `#FFC107` (yellow-amber), transition via `interpolateColor` from Reanimated
  - 29-0%: `#F44336` (red)
- Text overlay: `[currentHp]/[maxHp]` centered in canvas, 14pt bold, white. Use Skia `Text` with `SkFont`.
- Damage animation: on HP decrease, use Reanimated `withSequence(withTiming(1, {duration: 80}), withTiming(0, {duration: 120}))` driving a white overlay opacity on the bar. Simultaneously drive a `shake` shared value: `withSequence(withTiming(-6), withTiming(6), withTiming(-4), withTiming(4), withTiming(0))` applied as `translateX` on the entire `PlayerInfoBar`.
- Heal animation: green pulse `withTiming` on a green overlay opacity.

#### BoardSlots

Five slots per side.

```
Component: View
style: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
         paddingHorizontal: 8, gap: 4 }
```

Each **BoardSlot**:
```
Component: Pressable
style: { width: 60, height: 85, borderRadius: 8,
         borderWidth: 1.5, borderColor: '#3A3A3A',  // empty state
         backgroundColor: '#1A1A1A' }
```
- Empty state: dim border `#3A3A3A`, no content.
- Occupied: render `BoardCardView` component.

**BoardCardView** (compact card in slot):

```
Component: View (full slot dimensions, 60x85)
```

Children:
- `Image` (top 60% of slot, art from CDN URL). `resizeMode: 'cover'`.
- Stats row at bottom 30%: `View` with `flexDirection: 'row', justifyContent: 'space-between'`. Two `Text` nodes: ATK (left, 13pt bold, white) and HP (right, 13pt bold, white). Background: `rgba(0,0,0,0.7)`.
- Keyword icons row: small `Image` icons (10x10pt each), max 3 visible, centered above stats. Tap on icons opens tooltip.
- TauntShield (conditional): `View` positioned top-right, `position: 'absolute', top: 3, right: 3`. Shield icon 14x14pt, color `#FFD700`. Uses Reanimated `withRepeat(withTiming(...))` for pulsing glow — achieved via animating `shadowOpacity` or a Skia glow layer.
- AttunementGlow (conditional): Skia `Canvas` overlay on the card border. Blue for Order-attuned, Red for Chaos-attuned. Pulse animation on Reanimated shared value.
- Attack selection state: 3pt red border glow on the card `View`. Driven by `borderColor` animated with Reanimated.
- Block assignment state: 3pt green border glow.
- Block assignment line: drawn in parent `Canvas` overlay spanning the full board area using Skia `Path`. Yellow line, 2pt stroke, from blocker center to attacker center.

#### CenterZone (D20 + Phase Indicator)

```
Component: View
style: { height: 120, justifyContent: 'center', alignItems: 'center',
         position: 'relative' }
```

Children:
- **D20Component**: Skia `Canvas` (80x80pt). Renders a 20-sided polygon with number display. Animation state machine:
  - `idle`: Static, shows last roll value (or "--" before first roll).
  - `rolling`: Reanimated `withRepeat` rotating + scaling (simulates tumble). Duration: 1500-2500ms depending on game event. Shows blur effect via Skia `Blur` filter during roll.
  - `settled`: Scale pulse `withTiming(1.1, 200ms)` then back to 1.0. Number appears.
  - Color: white frame, number fills with `#5BC0EB` if Order triggered, `#E63946` if Chaos triggered, `#888` if "nothing".
- **PhaseIndicator**: Horizontal `View` of 9 `Text` labels separated by `View` dividers.
  - All 9 phases: "Start", "Roll", "Event", "Draw", "Main", "Attack", "Block", "Combat", "End"
  - Active phase: 13pt bold white, glow effect via `textShadowColor` and `textShadowRadius`.
  - Completed phases: 11pt, opacity 0.3.
  - Future phases: 11pt, opacity 0.2.
  - Reanimated `withTiming` on opacity/color when phase changes.

#### EventOverlay

Positioned absolutely over `CenterZone`. Uses Reanimated `FadeIn` / `FadeOut` layout animations.

```
Component: Animated.View (Reanimated)
style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
         justifyContent: 'center', alignItems: 'center', zIndex: 100 }
entering: FadeIn.duration(400)
exiting: FadeOut.duration(300)
```

Inner card: `View` 280x180pt, `borderRadius: 12`, background `rgba(20,20,20,0.95)`, border 1.5pt faction-colored.

Contents:
- Event icon (`Image`, 40x40pt)
- Event name (`Text`, 18pt bold, white)
- Effect description (`Text`, 14pt, `#B0B0B0`, max 3 lines)
- Order/Chaos label row: icon + `Text`, 13pt

Auto-dismiss: `setTimeout(() => setVisible(false), 2500)`. Tap anywhere on overlay dismisses immediately.

Affected creatures highlighted: when overlay shows, BoardCardView components matching `affectedCreatureIds` pulse their Skia glow layer (3 cycles of blue/red at 600ms intervals).

#### HandScrollView

```
Component: ScrollView
style: { height: 128 }
horizontal: true
showsHorizontalScrollIndicator: false
contentContainerStyle: { paddingHorizontal: 8, gap: -10 }
```

(Gap of -10 creates the 10pt overlap between cards.)

Each **CardInHand**:
```
Component: GestureDetector (react-native-gesture-handler)
  Gesture: Gesture.Pan() + Gesture.LongPress() + Gesture.Tap()
```

Wrap a `Animated.View` (Reanimated) of dimensions 90x130pt.

- `Image` (full card art, top 70%), `resizeMode: 'cover'`, `borderRadius: 8`.
- Stats overlay at bottom: `Text` row with mana cost (center, 16pt bold), ATK/HP (14pt).
- Affordable (mana available): full opacity 1.0.
- Unaffordable: `opacity: 0.45`, grayscale via `filter` or Skia `ColorMatrix`.

Drag-to-play gesture:
- `Gesture.Pan().onStart()`: scale the card to 1.2 via `withTiming(1.2, 150ms)` on a Reanimated shared value. Add drop shadow.
- `.onUpdate()`: translate the card to follow gesture with `useAnimatedStyle` mapping `translationX`/`translationY`.
- `.onEnd(event)`: check if card was dragged to valid drop zone (board slot Y threshold). If valid: trigger `playCard(cardId, slotIndex)` action and animate card to slot. If invalid: `withSpring` card back to original position in hand (bounce-back).
- Drag threshold: `minDistance: 10` to prevent accidental drags on taps.
- `.onUpdate()` broadcasts current finger position to `DroppableSlot` components via a Zustand action so they can highlight.

Long-press gesture (card preview):
- After 400ms hold, show `CardDetailModal` in peek mode (card detail slides up but game continues behind).

#### ManaDisplay

```
Component: View
style: { flexDirection: 'row', gap: 3, alignItems: 'center' }
```

10 circles, each `View` 20pt diameter `borderRadius: 10`. Filled: faction accent color. Empty: `#2A2A2A` with 1.5pt border `#4A4A4A`. When a mana is spent, animate `opacity` from 1.0 to 0.4 via `withTiming(0.4, 200ms)`.

#### TimerBar

Embedded in PlayerInfoBar row.

```
Component: View
style: { width: 120, height: 10, borderRadius: 5, backgroundColor: '#2A2A2A',
         overflow: 'hidden' }
```

Inner filled bar: `Animated.View` (Reanimated). Width driven by `withTiming` from 120 to 0 over `turnDuration` seconds.

Color states (via `interpolateColor` on time remaining):
- 60-16s: `#4A90E2` (blue)
- 15-0s: `#E63946` (red, also triggers `withRepeat` opacity pulse for visual urgency)

At 15s: fire `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` and trigger audio cue via `expo-av`.

Numeric overlay: `Text` 11pt, absolute center of bar, shows seconds remaining (integer).

When it is opponent's turn: bar is gray `#3A3A3A` with no animation. Text shows "--".

#### EndTurnButton

```
Component: Pressable
style: { width: 100, height: 44, borderRadius: 8, justifyContent: 'center',
         alignItems: 'center' }
onPress: handleEndTurn
```

States:
- **Your turn, actions available**: `backgroundColor: '#2A2A2A'`, border 2pt `#4A90E2`. Reanimated `withRepeat(withTiming)` on `borderOpacity` for subtle glow pulse.
- **Your turn, no actions remain**: `backgroundColor: '#1A6A3A'` (green), brighter pulse. Text `#FFFFFF`.
- **Opponent's turn**: `backgroundColor: '#1A1A1A'`, `opacity: 0.5`. `pointerEvents: 'none'`.

Label: `Text` "END TURN" 13pt bold, color `#FFFFFF`.

Confirm-before-end-turn setting: if enabled, `onPress` does nothing. `onLongPress` (400ms) triggers end turn. A `Text` "Hold to End" replaces the label when this setting is active.

### 3.3 Turn Phase Visual States

| Phase | PhaseIndicator Active Label | Timer State | Board Interaction |
|---|---|---|---|
| Start | "Start" | Inactive | None |
| Chaos Roll | "Roll" | Inactive | Watch D20 spin |
| Event | "Event" | Inactive | Overlay visible |
| Draw | "Draw" | Inactive | Card draw animation |
| Main | "Main" | Active (60s), blue | Drag cards from hand |
| Attack | "Attack" | Active (continues), blue | Tap creatures to toggle attacker |
| Block | "Block" | Active (continues), blue | Drag creatures onto attackers |
| Combat | "Combat" | Inactive | Watch animations |
| End | "End" | Inactive | None |

Phase transitions use `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` or a Reanimated `FadeIn`/`FadeOut` on the active indicator. Phase state is stored in Zustand from the Supabase Realtime match state update.

### 3.4 Combat Animations

All animations use React Native Reanimated unless noted.

#### Attacker Selection

When player taps a BoardCardView to toggle attacker:
1. `borderColor` animates to `#E63946` (red) via `withTiming(600ms)`.
2. An "attack swords" icon (16x16pt SVG) fades in above the card via `FadeIn` entering animation.
3. Tapping again: border back to default, icon fades out.
4. If opponent has Taunt creature: all eligible attackers auto-highlighted. A `View` overlay slides in from bottom with `Text` "Taunt forces your attack." Player cannot deselect attackers. The Taunt creature's slot has a pulsing gold border.

#### Blocker Assignment

Defender assigns blockers by dragging their creature onto an opponent's attacker.

Interaction flow:
1. During Block phase, player's own BoardCardViews become `GestureDetector` wrapped with `Gesture.Pan()`.
2. On drag start: Reanimated `withTiming(1.15)` scale on card. Add shadow via `elevation` (Android) or `shadowOpacity` (iOS).
3. Card lifts visually (`zIndex` set to 999 via Animated).
4. `.onUpdate()`: translate card to follow gesture. Broadcast drag position to all opponent BoardCardViews via Zustand.
5. Opponent attacker slots: if drag position overlaps, border becomes `#4CAF50` (green). If not valid target, border `#F44336` (red flash then returns to normal).
6. On drag end over valid attacker: `runOnJS(assignBlocker)(myCreatureId, attackerCreatureId)`. Card animates to attacker slot vicinity. A Skia line drawn in parent canvas from blocker position to attacker position: yellow, 2pt stroke.
7. On drag end over invalid zone: `withSpring` card back to original slot position. Haptic: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`.
8. Your Taunt creature: auto-assigned on Block phase start. Block line drawn automatically. `Pressable` has `pointerEvents: 'none'` — cannot be moved. Overlay text: "Taunt must block."

#### Damage Numbers

Triggered by `combat_result` message from game server via Supabase Realtime.

Each damage event spawns a `DamageNumber` component:

```
Component: Animated.View (Reanimated)
```

Initial position: above the damaged creature or player HP bar.
- Text: `-${damageAmount}` in `#F44336` (red), 22pt bold. Critical (kills creature): 28pt, `withSequence` scale pulse.
- Lifesteal heal number: `+${healAmount}` in `#4CAF50` (green).
- Animation: `withTiming(translateY: -40, opacity: 0, duration: 800ms)`. Auto-removed after animation via `useEffect` cleanup.
- Piercing: two separate DamageNumber components — one at blocker, one at face — fire simultaneously.

#### Death Animation

When creature HP reaches 0:
1. Reanimated `FadeOut.duration(300)` on the `BoardCardView`.
2. Simultaneously, a Skia `Canvas` particle burst at the slot position. Pre-built particle textures (faction-specific sprite sheet). Particles disperse outward over 1200ms.
   - Ironwright: gear/crystal fragments.
   - Fey Courts: leaf/petal burst.
   - Demonic Kingdoms: ember/smoke dissipation.
3. Slot returns to empty state after 1200ms (cannot skip — game state must be clear before next action).
4. A small card thumbnail animates from slot position to the owning player's avatar position (graveyard entry animation). `withTiming` on translate, 600ms.

#### Spell Cast Animation

1. Card enlarges from hand to center screen: Reanimated translate + scale `withTiming(300ms)`.
2. Spell name `Text` pulses: `withSequence(withTiming(1.1), withTiming(1.0))`.
3. Effect particles emitted from center toward target(s) via Skia Canvas path-following animation.
4. Card dissolves (opacity 0) and adds to graveyard.
5. Targeting spells: valid targets glow green (`#4CAF50` border pulse) before player taps to confirm. Cancel: tap outside any highlighted target, or tap the spell card again.

### 3.5 Taunt Indicators

- TauntShield icon on creature: position `absolute, top: 3, right: 3`. Image `shield.png` 14x14pt, tinted `#FFD700`.
- Pulse animation: Reanimated `withRepeat(withSequence(withTiming(1.3, 750ms), withTiming(1.0, 750ms)), -1)` on `scale` shared value applied to the icon. Loop = -1 (infinite while Taunt creature is on board).

**Attack phase with opponent Taunt:**
- Toast overlay slides up from bottom: `View` 280x52pt, `borderRadius: 8`, `backgroundColor: 'rgba(255,215,0,0.15)'`, `borderColor: '#FFD700'`, border 1.5pt. Text: "Taunt creature forces your attack." Auto-dismisses after 2000ms.
- All eligible attackers on player's board receive `borderColor: '#E63946'` glow automatically. Player cannot deselect.

**Block phase with player Taunt:**
- Taunt creature pre-assigned to block first declared attacker automatically. Block line drawn.
- Toast: "Your Taunt creature must block." Same styling as above.

### 3.6 Event Overlay (Full Specification)

Event overlay: `Animated.View` entering with `SlideInDown.duration(400)`. Positioned in `CenterZone` area, z-index 50.

```
Component: Animated.View
style: { width: 280, borderRadius: 12, padding: 16,
         backgroundColor: 'rgba(20,20,20,0.96)',
         borderWidth: 1.5 }
borderColor: Order = '#5BC0EB', Chaos = '#E63946'
```

Contents:
- Event icon: `Image` 40x40pt (pre-generated icons from asset bundle, not dynamic).
- Event name: `Text` 18pt bold, white.
- Effect description: `Text` 14pt, `#B0B0B0`, 3 lines max.
- Trigger type badge: small `View` row with circle icon + `Text` "Order Event" or "Chaos Event", 12pt.

Affected creature highlight: while overlay is visible, creatures in `affectedCreatureIds` pulse. Implemented via a Reanimated `withRepeat(withSequence(withTiming(1), withTiming(0)), 3)` on a `glowOpacity` shared value passed as prop to `BoardCardView`.

Auto-dismiss: `useEffect(() => { const t = setTimeout(() => dismiss(), 2500); return () => clearTimeout(t); }, [])`. Tap anywhere on overlay: immediate dismiss. On dismiss: `FadeOut.duration(300)`.

### 3.7 Battle Log (Side Panel)

Trigger: tap `BattleLogButton` (32x32pt icon, bottom-left corner) or swipe right from left edge of screen.

Implementation:
- `Animated.View` (Reanimated) sliding in from left. Width 280pt, full screen height. Background `#141414`.
- `translateX` animated from -280 to 0 via `withSpring({damping: 20, stiffness: 200})`.
- A dark semi-transparent overlay (`View, flex:1, backgroundColor: 'rgba(0,0,0,0.5)'`) covers the rest of the screen. Tap overlay to dismiss.
- Inside: `FlatList` of log entries. `inverted: true` so newest entries appear at bottom.

Each `LogEntry` item:
```
Component: View
style: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10,
         borderBottomWidth: 1, borderColor: '#2A2A2A' }
```
- Icon `Image` 20x20pt (colored by type).
- `Text` timestamp "T3" (turn 3), `#888`, 11pt, width 24pt.
- `Text` description, 12pt, color by type: Order `#5BC0EB`, Chaos `#E63946`, Damage `#FF7043`, Heal `#4CAF50`, Card played `#FFFFFF`.

Entry format examples:
- "[Roll] Turn 3: 14 → Order Event"
- "[Event] All creatures +1 HP"
- "[Play] Temple Warden (3 mana)"
- "[Attack] Rift Slasher → opponent face (4 dmg)"
- "[Block] Temple Warden blocked Rift Slasher"
- "[Death] Rift Slasher destroyed"

Tap entry: emit `highlightEntity(entityId)` action in Zustand which temporarily highlights the relevant card/zone on the board via a yellow outline pulse (1s).

### 3.8 Graveyard Panel

Accessible by tapping player or opponent avatar.

```
Component: Modal (Expo Router presentation: 'modal')
style: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }
```

Inner panel: `View` height `90%`, `borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: '#1A1A1A'`.

Header: `Text` "Your Graveyard" or "[Opponent] Graveyard", 18pt bold. `Pressable` dismiss button (X icon, top-right, 44x44pt tap target).

Sort controls: two `Pressable` buttons: "Newest" | "By Cost". Active has faction accent underline.

Card grid: `FlatList` with `numColumns: 3`. Each cell: `Pressable` 100x140pt `Image` (card art from CDN). Tier badge overlaid top-right. On press: open Card Detail modal (read-only in battle context).

---

## 4. Evolution Screen (Detailed)

Route: `/card/[cardInstanceId]/evolve`. Full-screen modal, `presentation: 'modal'`. Portrait only.

The evolution flow is a state machine managed in local component state with Zustand for persistence. States: `STEP_1_PRESENTATION` | `STEP_2_CHANNEL` | `STEP_3_GENERATING` | `STEP_4_REVEAL` | `STEP_5_NAME` | `STEP_6_ABILITY` | `STEP_7_MODIFIER` | `STEP_8_FLAVOR` | `STEP_9_CONFIRM`.

All step transitions use `withTiming(300ms)` fade.

### 4.1 Evolution Flow Overview

```
[Card Detail - "Evolve" button tapped]
    |
    v
Step 1: Card Presentation & History
    |
    v
Step 2: Channel Selection (Order / Chaos)
    |
    v
Step 3: Evolution Animation + AI Art Generation (FLUX request fires here)
    |
    v
Step 4: Art Reveal (dramatic unveil)
    |
    v
Step 5: Name Selection (from GPT-4o Mini options)
    |
    v
Step 6: New Ability Reveal
    |
    v
Step 7: Modifier Selection (2 / 3 / 4 options by tier)
    |
    v
Step 8: Flavor Text Reveal
    |
    v
Step 9: Final Card Presentation & Confirm
    |
    v
[Collection - card updated]
```

### 4.2 Step-by-Step Specifications

#### Step 1: Card Presentation & History

Layout: `View, flex: 1, flexDirection: 'column', alignItems: 'center', paddingTop: 40`.

Card display: `Image` of current card art, 240x336pt (5:7 ratio), `borderRadius: 12`, `borderWidth: 3, borderColor: tierColor`.

Stats row below card: `Text` nodes for ATK, HP, Mana Cost (24pt bold). Instability (16pt).

Energy progress: `Text` "[75/75 Energy - Ready]" in `#4CAF50`. Uses `ProgressBar` component.

Shard requirement: `View` row with shard icon (`Image` 24x24pt) + `Text` "Requires: 1x Epic Shard".

Evolution history timeline: `ScrollView` horizontal below card. Each node: `View` with Order/Chaos icon + tier label + modifier gained. Connected by a horizontal `View` line separator. Current tier node has gold border.

Button: `Pressable` "Begin Evolution" 200x52pt. `backgroundColor: '#4A90E2'`. `borderRadius: 10`. Reanimated pulse on `scale`: `withRepeat(withSequence(withTiming(1.03, 1000ms), withTiming(1.0, 1000ms)), -1)`.

#### Step 2: Channel Selection (Order / Chaos)

Full-screen two-option layout.

```
Component: View
style: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }
```

Reminder text at top: `Text` 13pt, `#888`, "This influences the new ability and modifier attunement."

Order button: `Pressable` 300x160pt. `backgroundColor: gradient` — use `expo-linear-gradient` `LinearGradient` from `#0D47A1` to `#1976D2`. `borderRadius: 16`.
- Icon: `Image` crystal 48x48pt.
- Label: `Text` "Channel toward Order" 18pt bold white.
- Probability: `Text` "70% chance Order, 30% chance Chaos" 13pt `#90CAF9`.
- Flavor: `Text` "Stabilize and harmonize" 13pt italic `#B0B0B0`.

Chaos button: same structure. Gradient: `#B71C1C` to `#E53935`.
- Label: "Channel toward Chaos"
- Probability: "70% chance Chaos, 30% chance Order"

Selection:
1. Player taps button. Selected button: `withTiming` scale to 1.06. Other button: `withTiming` opacity to 0.
2. Fire the Supabase Edge Function `evolution/start` with `{ cardInstanceId, direction: 'order' | 'chaos' }`. This starts the FLUX image generation job on the server and returns the `evolutionJobId`.
3. After 600ms transition to Step 3 regardless of whether FLUX has responded yet.

#### Step 3: Evolution Animation + AI Art Generation

This step runs while FLUX generates the image in the background. The animation must loop gracefully.

Visual sequence implemented as a Skia `Canvas` full-screen component:

1. **Card Dissolves (0-800ms):** Reanimated `opacity: 0` + `scale: 1.2` on the card `Image` from Step 1. Simultaneously, spawn particle burst: 30 particles (Skia `Circle` shapes) animated outward from center using `withTiming` on each particle's `x`/`y`/`opacity` driven by Reanimated shared values. Particles colored by evolution direction (blue = Order, red = Chaos).

2. **Shard Materializes (800-1200ms):** Shard icon `Image` (64x64pt) fades in at center via `withTiming`. Slow spin: `withRepeat(withTiming(2 * Math.PI, 2000ms, Easing.linear), -1)` on rotation.

3. **Energy Channeling Loop (1200ms onward, loops until FLUX complete):** Particles orbit the shard in a circular path. Implemented via `useDerivedValue` computing (x, y) from angle + radius for each particle. Angle incremented on each animation frame. Order: smooth circular orbit in blue. Chaos: erratic path using `Math.random()` perturbation on each frame.

4. "Channeling energy..." text: `Text` 13pt `#888`, appears via `FadeIn` after 3 seconds if FLUX has not completed.

5. **Shard Cracks (when FLUX complete):** Shard splits into two halves, each translating outward. Flash: `View` `position: 'absolute'` full-screen `backgroundColor: '#FFFFFF'` opacity pulse from 0 to 0.9 to 0 over 300ms. Then transition to Step 4.

FLUX polling: the client polls `GET /evolution/status/{evolutionJobId}` (Supabase Edge Function) every 500ms. When status = `completed`, the new art URL is available and Step 3 ends.

If FLUX takes >10 seconds: show error modal. "Evolution interrupted. Your shard and energy have been refunded." Button: "Try Again" → back to Step 2. Server rolls back the evolution transaction via Supabase Edge Function.

#### Step 4: Art Reveal (Dramatic Unveil)

The new card with FLUX-generated art is revealed.

1. New card `Image` (art from CDN URL returned by FLUX) fades in at center, 260x364pt. Initially obscured by a white Skia gradient overlay (radial gradient from center, fully opaque).
2. Skia radial gradient opacity animates from 1.0 to 0.0 over 1200ms (iris wipe effect), revealing art from center outward.
3. Card frame `View` (border matching new tier color) fades in simultaneously.
4. New tier badge (top-right, 28x28pt `View` + `Text`) animates in with `BounceIn` from react-native-reanimated entering animation.
5. Particle swirl around card: Skia canvas with 20 particles orbiting the card perimeter over 1500ms then dispersing.
6. Hold for 2 seconds. `Text` "Tap to continue" appears at bottom after 1.5s.
7. Audio: `expo-av` `Audio.Sound.createAsync(require('../assets/sounds/reveal.mp3'))` plays.

#### Step 5: Name Selection

Layout: `View, flex: 1, flexDirection: 'column', alignItems: 'center', paddingTop: 30, gap: 20`.

Top: evolved card art (smaller, 180x252pt).

Middle: old name with strikethrough: `Text` with `textDecorationLine: 'line-through'`, opacity 0.5, 18pt.

Name options (2-3 GPT-4o Mini suggestions, received in FLUX completion response):

Each name: `Pressable` 300x52pt, `backgroundColor: '#1A1A1A'`, `borderRadius: 10`, `borderWidth: 1.5, borderColor: '#3A3A3A'`. On press: `borderColor` → `#FFD700` (gold), other options fade to 50% opacity. `Text` 17pt bold center white.

Confirm not needed — selecting a name immediately transitions to Step 6 after 500ms.

#### Step 6: New Ability Reveal

Layout: card at top (180x252pt), ability card slides in from right.

Ability card: `Animated.View` entering `SlideInRight.duration(500)`. Dimensions 300x140pt. `borderRadius: 12`. Background gradient matching trigger type (blue gradient for Order, red for Chaos). Border 2pt matching type.

Contents:
- Trigger icon `Image` 36x36pt (Order crystal or Chaos flame).
- Trigger label `Text` "Order Trigger" or "Chaos Trigger" 14pt bold, aligned right.
- Ability name `Text` 17pt bold, centered, white.
- Ability description `Text` 13pt, `#B0B0B0`, centered, 3 lines max.

Icon pulses once: `withSequence(withTiming(1.2, 200ms), withTiming(1.0, 200ms))`. Border glows: Reanimated opacity pulse on shadow.

"Tap to continue" `Pressable` button (44pt height) at bottom.

#### Step 7: Modifier Selection

Header: `Text` "Choose a Modifier" 18pt bold, center.

Card above: evolved card (160x224pt), showing new ability icon on card face.

Modifier options in horizontal `ScrollView` (needed for 4 options on smaller phones):

Each modifier card: `Pressable` 250x180pt. `backgroundColor: '#1A1A1A'`. `borderRadius: 12`. `borderWidth: 1.5, borderColor: '#3A3A3A'`. Margin 8pt.

Modifier card interior:
- Header row: modifier name `Text` 15pt bold + attunement icon `Image` 20x20pt (right-aligned).
- Divider `View` 1pt `#3A3A3A`.
- Base effect: `Text` "Always: +1 ATK" 13pt `#FFFFFF`.
- Attuned bonus: `Text` "Order: also Shield" 13pt `#5BC0EB` (Order) or `#E63946` (Chaos).
- Penalty (if applicable): `Text` "Chaos: -1 ATK" 13pt `#F44336`.
- Footer: faction badge `View` small pill + tier badge.
- PP cost: small `Text` "2 PP" `#888` bottom-right.

Guaranteed composition:
- Free tier (2 options): 1 universal + 1 faction-exclusive.
- Mid tier (3 options): 1 universal + 2 faction-exclusive.
- Top tier (4 options): 2 universal + 2 faction-exclusive.

Selection: tap modifier card → `borderColor: '#FFD700'` gold. Other cards `opacity: 0.3`. "Confirm Modifier" `Pressable` button appears at bottom: 200x52pt `backgroundColor: '#FFD700'` `borderRadius: 10`. `Text` "Confirm Modifier" 15pt bold `#000`.

On confirm: selected modifier slides onto card (animate from modifier card position to card face position, shrinking to icon size). Transition to Step 8 after 800ms.

#### Step 8: Flavor Text Reveal

Layout: fully evolved card at top (200x280pt showing all new stats). Flavor text box below.

Flavor text box: `View` 320x100pt. `backgroundColor: 'rgba(0,0,0,0.8)'`. `borderRadius: 10`. `borderWidth: 1.5`. `borderColor`: faction accent.

Flavor text typed out letter-by-letter via a `useEffect` incrementing a character count index and `text.substring(0, charCount)`. Interval: 40ms per character. Tap to complete instantly (set charCount to full length).

After typing completes + 1.5s pause (or tap): transition to Step 9.

Example flavor text format: italicized `Text` 14pt `#B0B0B0` centered with quotes: `"Once bound by Order's chains, it now dances on the edge of madness."`

#### Step 9: Final Card Presentation & Confirm

Center: final card large display (280x392pt). Shows:
- New art (CDN URL).
- New name `Text` overlaid at bottom of art, 22pt bold, shadow.
- Updated ATK/HP.
- New tier badge.
- Triggered ability icon on card.
- Modifier icon on card.
- Mana cost (unchanged, prominent top-left).

Evolution Summary panel below card: `View` `backgroundColor: '#141414'` `borderRadius: 12` `padding: 16`.

- "Evolution Complete!" `Text` 22pt bold `#FFD700`.
- Stats: `Text` "3/4 → 5/6" 16pt. Color green for increases.
- Instability change: `Text` "Instability: 2 → 3" 16pt. Red if increased, blue if decreased.
- New ability: 1-line summary.
- New modifier: 1-line summary.

Buttons at bottom:
- "Save & Continue": `Pressable` 180x52pt `backgroundColor: '#FFD700'` `borderRadius: 10`. `Text` 15pt bold `#000`. On press: call Supabase `evolution/confirm` Edge Function (commits the evolution to DB). On success: `router.back()` to collection.
- "Share Screenshot": `Pressable` 180x52pt `borderWidth: 2, borderColor: '#FFFFFF'` `borderRadius: 10`. On press: use `expo-file-system` + `expo-sharing` to capture the card view as an image and open native share sheet.

Share image: `captureRef` from `react-native-view-shot` on the card display + summary panel. Dimensions: 1080x1920 equivalent. Watermark: "Chaos Creatures" `Text` 12pt bottom-right.

### 4.3 Art Generation Loading State

- FLUX typically responds in 2-4 seconds.
- The Step 3 animation is designed to loop indefinitely — no spinner, no jarring state.
- Minimum animation play time: 2500ms (even if FLUX responds faster, hold for drama).
- "Channeling energy..." text fades in at 3000ms if still waiting.
- After 10000ms: show error modal. Server refunds shard and energy. Analytics event: `posthog.capture('evolution_flux_timeout', { cardInstanceId })`.

---

## 5. Collection & Deck Builder

### 5.1 Collection Screen

Route: `/(tabs)/collection`.

```
Component: SafeAreaView
style: { flex: 1, backgroundColor: '#0D0D0D' }
```

#### Faction Tabs

```
Component: ScrollView (horizontal, showsHorizontalScrollIndicator: false)
style: { height: 48, backgroundColor: '#141414' }
```

Tab items: `Pressable` with `Text` faction name + faction icon `Image` 20x20pt. Active tab: faction accent color underline `View` 3pt height below tab. Inactive: `#3A3A3A`.

Tabs: "All" | "Ironwright" | "Fey Courts" | "Demonic" (abbreviated on small screens).

#### Filter Bar

```
Component: View
style: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 }
```

- Sort `Pressable`: shows current sort label + chevron. On press: `BottomSheet` modal (from `@gorhom/bottom-sheet`) with sort options list.
- Filter `Pressable`: funnel icon. On press: opens FilterPanel bottom sheet.
- Search `Pressable`: magnifier icon. On press: `TextInput` slides down from top via Reanimated.

#### Card Grid

```
Component: FlatList
numColumns: 3 (phone portrait) | 5 (tablet 768pt+)
keyExtractor: card.instanceId
renderItem: CardGridItem
contentContainerStyle: { paddingHorizontal: 8, paddingBottom: 80 }
columnWrapperStyle: { gap: 8 }
ItemSeparatorComponent: 8pt View spacer
```

Each `CardGridItem`: `Pressable` 100x140pt. On press: `router.push('/card/${item.instanceId}')`. On long press: quick action menu via `ContextMenu` (use `@gorhom/bottom-sheet` or a custom `Animated.View` popover).

Contents:
- `Image` (CDN URL, full cell) `resizeMode: 'cover'` `borderRadius: 8`.
- Tier badge: `View` absolute top-right, 20x20pt, background = tier color, `Text` tier initial.
- Evolution-ready badge: `View` absolute bottom-right, pulsing shard icon `Image` 14x14pt. Visible only when energy threshold met and player has matching shard. Pulse via Reanimated repeat.
- Favorite star: `Image` star icon, absolute top-left, 16x16pt, visible only when favorited.

Empty state: `View` centered with faction symbol `Image` at 30% opacity + `Text` message + `Pressable` "Visit Shop" button.

#### FilterPanel (Bottom Sheet)

Use `@gorhom/bottom-sheet` `BottomSheet` component. `snapPoints: ['65%']`.

Internal `ScrollView` with sections:

1. **Card Type**: `View` with row of `Pressable` pill buttons: "Creature" | "Spell" | "Stabilizer". Toggle state stored locally.
2. **Evolution Tier**: similar pill buttons: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary".
3. **Mana Cost**: range slider using `@react-native-community/slider` (two sliders, min and max). Range 1-10.
4. **Attunement Leaning**: radio-style `Pressable` rows: "Mostly Order" | "Balanced" | "Mostly Chaos" | "Any".
5. **Keywords**: row of keyword icon `Pressable` buttons (toggle). 7 keywords = 7 buttons in a wrap `View`.
6. **Special**: `Switch` (React Native) for "Evolution Ready", "In Deck", "Not in Deck", "Favorited Only".

Bottom: "Apply" `Pressable` 180x44pt `backgroundColor: '#4A90E2'` + "Reset" `Text` button.

#### Search

`TextInput`: `backgroundColor: '#1A1A1A'`, `borderRadius: 8`, `color: '#FFFFFF'`, 14pt, `placeholderTextColor: '#666'`, 44pt height, `returnKeyType: 'search'`.

Slides down via Reanimated `withTiming` on `translateY` from -60 to 0. Search fires on each keystroke with 300ms debounce (TanStack Query `useQuery` with `enabled: query.length > 0`). Fuzzy matching on card names via Supabase RPC `search_cards`.

### 5.2 Card Detail View

Route: `/card/[cardInstanceId]`. Presented as a modal (`presentation: 'modal'`).

```
Component: ScrollView
style: { flex: 1, backgroundColor: '#0D0D0D' }
```

Top 50%: card art in `Image` (full width, aspect ratio preserved via `aspectRatio: 5/7`). Safe area aware.

Card overlay: `View` absolute at image bottom. Dark gradient to transparent. `Text` card name 22pt bold white with `textShadowColor: '#000'`.

Faction pill: `View` absolute top-left, `borderRadius: 20`, `backgroundColor: 'rgba(0,0,0,0.7)'`, `Text` + icon.

Tier badge: `View` absolute top-right.

Bottom panel (scrollable, 50% initial height):

1. **Stats Row**: `View flexDirection: 'row', justifyContent: 'space-around'`. ATK, HP, Mana (28pt bold, with icon). Instability (18pt).
2. **Keywords Row**: horizontal `ScrollView` of keyword `Pressable` chips. Each chip: icon 24x24pt + label 12pt. On press: `Tooltip` modal with keyword description.
3. **Triggered Abilities**: `SectionList` or manual `View` map. Each ability: `View` with trigger type icon + ability name + description. Order abilities: blue accent. Chaos: red accent. "Gained at [Tier]" small badge.
4. **Modifiers**: `View` map with expandable accordions using Reanimated height animation. Closed: name + icon. Open: full effect text.
5. **Evolution History**: vertical `View` timeline. Nodes connected by `View` vertical line (2pt, `#3A3A3A`).
6. **Card Progress**: energy progress bar (`View` + animated inner `View`). Games played count. Next evolution requirement.
7. **Flavor Text**: `Text` italic 14pt `#888` centered.

Sticky action buttons (bottom, `position: 'absolute', bottom: 0`):
- **Evolve**: `Pressable` 160x52pt `backgroundColor: '#FFD700'`. Only rendered if `isEvolutionReady`. Pulsing via Reanimated.
- **Add to Deck**: `Pressable` 160x52pt `borderWidth: 2, borderColor: '#FFFFFF'`.
- **More Actions** (3-dot): `Pressable` 52x52pt. Opens action sheet (Expo `ActionSheetIOS` on iOS, custom `BottomSheet` on Android).
  - Options: "Favorite", "Dismantle" (confirmation required, then deducts card and grants Chaos Dust), "Share Screenshot".

### 5.3 Deck Builder Screen

Route: `/(tabs)/decks`. On small phones, this is a single-column stack. On tablet (>768pt), two-panel side-by-side.

Detect layout: `useWindowDimensions()` hook. If `width >= 768`, render `DeckBuilderTablet`. Otherwise render `DeckBuilderPhone`.

#### DeckBuilderPhone (stacked, scroll-based)

```
Component: View, flex: 1
```

**Header section** (fixed, no scroll):

- Deck name: `TextInput` 18pt center-aligned, `maxLength: 30`, `backgroundColor: '#1A1A1A'`, `borderRadius: 8`. Placeholder "Untitled Deck".
- Faction selector: three `Pressable` buttons in a row. Each: faction icon + name. Active: faction accent border. On first card added: `pointerEvents: 'none'` + lock icon overlay.
- Avatar selector: `FlatList` horizontal. Each avatar: `Pressable` 60x60pt `Image` from CDN. Selected: `borderColor: '#FFD700'` 3pt. Instability modifier `Text` below each.

**DeckStatsSummaryBar** (sticky below header):

```
Component: View
style: { backgroundColor: '#141414', padding: 10, borderBottomWidth: 1 }
```

- Mana curve: `View` with 10 `View` bars. Each bar height = `count * 8pt` (min 4pt). `backgroundColor: tierColor` for each slot.
- Attunement balance: `View` horizontal bar 200pt wide. Left segment = `(orderCount / total) * 200` wide in `#5BC0EB`. Right = Chaos in `#E63946`. Middle = gray.
- Avg instability `Text` 17pt bold, color coded.
- Card count `Text` 17pt. Green if 20, yellow 15-19, red <15.

**Tab switch**: two `Pressable` tabs: "Deck Contents" | "Card Pool". Switches between two panels.

**Deck Contents Panel**:

```
Component: FlatList
data: cardsInDeck (sorted by current sortOrder)
renderItem: DeckCardRow
```

Each `DeckCardRow`: `Pressable` 44pt height (minimum tap). `flexDirection: 'row'`. Card thumbnail `Image` 40x56pt. Card name `Text` 15pt bold. Mana cost icon. ATK/HP 12pt `#888`. Attunement dots row (up to 4 dots per card). Long-press triggers `Gesture.LongPress` with 400ms delay showing "Remove from Deck?" confirmation tooltip via `Portal` overlay.

**Card Pool Panel**:

Same `FlatList` grid as Collection screen (numColumns: 3). Shows only cards NOT in deck by default. Tap card to add (if deck < 20 and valid). Validation feedback: deck-full shake animation (`withSequence` on container) + toast.

Max 2 copies per card enforced: if already 2 copies in deck, card in pool rendered with `opacity: 0.4` and `pointerEvents: 'none'`.

Max 2 Legendaries enforced: same dim treatment.

#### DeckBuilderTablet (side-by-side)

`View flexDirection: 'row'`. Left panel 320pt wide = Deck Contents. Right panel = Card Pool.

Both panels visible simultaneously. Header spans full width.

#### Deck Validation Toast

Invalid deck: "Save Deck" `Pressable` is `disabled: true, opacity: 0.5`. Below it: `Text` in `#F44336` showing reason: "Need 6 more cards" or "Remove 1 Legendary".

Valid WIP decks (< 20 cards) can be saved with WIP badge by tapping "Save WIP". These appear in deck list with a `[WIP]` badge but cannot be used in matchmaking (greyed out in mode selection).

---

## 6. Shop & Economy Screens

Route: `/(tabs)/shop`.

### 6.1 Layout

```
Component: ScrollView
style: { flex: 1, backgroundColor: '#0D0D0D' }
```

**Sticky header** (CurrencyHeader):

```
Component: View
style: { backgroundColor: '#141414', paddingVertical: 10, paddingHorizontal: 16,
         flexDirection: 'row', justifyContent: 'space-between' }
```

- Chaos Dust: chaos mote `Image` 24x24pt + `Text` balance 22pt bold `#FFD700`. On tap: tooltip explaining Chaos Dust.
- Shards row: 4 shard tier icons (20x20pt each) with count `Text` 14pt next to each. On tap: tooltip.

**Scrollable sections:**

#### Section 1: Subscription Tiers

`Text` "Subscription" 16pt bold section header.

Horizontal `ScrollView` of three `SubscriptionCard` components.

Each `SubscriptionCard`: `View` 260x320pt. `borderRadius: 16`. `borderWidth: 2`. Shadow `elevation: 4`.

- Free tier: `backgroundColor: '#1A1A1A'`, `borderColor: '#3A3A3A'`.
- Mid tier: background = `LinearGradient` `['#0D47A1', '#1565C0']`. `borderColor: '#2196F3'`.
- Top tier: background = `LinearGradient` `['#E65100', '#F57F17']`. `borderColor: '#FFD700'`.

Contents: tier name (20pt bold), price (16pt), benefits `FlatList` (each item = checkmark `Text` + benefit `Text` 13pt), action button "Current Tier" / "Upgrade" (triggers `expo-in-app-purchases`).

Current tier: gold `View` badge "CURRENT" top-right corner of card.

No countdown timers. No "limited time" pressure text.

#### Section 2: Card Packs

`Text` "Card Packs" 16pt bold section header.

`FlatList` vertical, `scrollEnabled: false`. Each `PackItem`: `Pressable` `View` `flexDirection: 'row'`, 60pt height, `borderRadius: 10`, `backgroundColor: '#1A1A1A'`, `marginBottom: 8`.

- Pack icon `Image` 48x48pt.
- Name + contents description `Text` column.
- Cost `Text` "500 Dust" 16pt bold.
- "Buy" `Pressable` 80x36pt `backgroundColor: '#4A90E2'` `borderRadius: 8`. On press: confirm bottom sheet → `purchasePack(type)` Supabase Edge Function call.

**Pack Opening Modal**: `Modal` full-screen. Dark background. Five cards dealt face-down one at a time (0.8s each). `Animated.View` flip animation (Reanimated `withTiming` on `rotateY`). Cards flip to reveal art. Final screen: "Cards Added!" + "View Collection" `Pressable`.

#### Section 3: Planar Shards

`Text` "Planar Shards" 16pt bold section header.

2-column `FlatList` grid. Each `ShardBundle`: `Pressable View` 160x120pt. Shard icon (48x48pt). Quantity `Text`. Price `Text`. "Buy" button. On press: native IAP flow via `expo-in-app-purchases`.

#### Section 4: Premium Styles (Top Tier)

Gated: if not Top Tier subscriber, show "Unlock with Top Tier" overlay on this section.

Horizontal `FlatList` of `StyleCard` components: sample card `Image` (160x224pt) + style name + description + "Preview" / "Apply" button.

Preview modal: `Modal` with horizontal `FlatList` of 6 sample cards in that style. `Pressable` "Purchase Style" at bottom.

#### Section 5: Cosmetics

2-column grid. Thumbnails (card frames, card backs, board skins). Each has name, price, "Buy" button.

### 6.2 Subscription Upgrade Prompt

Triggered when free player hits a tier-locked action.

```
Component: Modal (presentation: 'transparentModal')
```

Backdrop: `View` `position: 'absolute'` `flex: 1` `backgroundColor: 'rgba(0,0,0,0.8)'`.

Inner modal: `Animated.View` `SlideInUp.duration(400)`. `View` 320pt wide. `borderRadius: 20`. `backgroundColor: '#1A1A1A'`. Padding 24.

- Header `Text` 20pt bold describing locked feature.
- Body `Text` 15pt `#B0B0B0`.
- 2-column benefit comparison: Free vs Mid.
- Primary button: "Upgrade to Mid Tier — $X.XX/mo" 220x52pt gold.
- "Not Now" `Pressable` text button below. Dismissed via `setVisible(false)`. Shows once per session per trigger type (tracked in Zustand session state).

---

## 7. Onboarding Flow

Route: `/onboarding`. Shown only on first launch. Stored in `AsyncStorage` key `onboardingComplete`. After completion, key set to `'true'` and router redirects to `/(tabs)/home`.

### 7.1 Flow Overview

```
[App Launch]
    |
    v
[Step 1: Intro Cinematic - Animated sequence, skippable]
    |
    v
[Step 2: Faction Selection - Three faction cards, swipeable]
    |
    v
[Step 3: Trial Match - Guided battle vs AI]
    |
    v
[Step 4: Faction Commitment - Keep one trial deck]
    |
    v
[Step 5: First Evolution - Guided flow, pre-awarded energy + shard]
    |
    v
[Step 6: Deck Builder Tour - Overlay tooltips]
    |
    v
[Step 7: Home Screen - Free to play, daily missions pre-populated]
```

### 7.2 Step-by-Step Specifications

#### Step 1: Intro Cinematic

`View` full-screen `backgroundColor: '#0D0D0D'`.

Implement as a sequence of `Animated.View` panels (not video, keeps app bundle small). Each panel: `Image` static illustration + `Text` subtitle.

Panel sequence (timing in ms):
- 0-4000: World illustration. "The world was once a thriving land of many civilizations."
- 4000-8000: Chaos rift illustration. "War tore open rents to the Plane of Chaos."
- 8000-12000: Transforming creatures illustration. "Chaos motes transform everything they touch."
- 12000-16000: Planar shard illustration. "Planar Shards hold the power of transformation."
- 16000-20000: Player avatar illustration. "Channel their power. Transform your creatures. Master the chaos."

Each panel fades in/out via Reanimated `FadeIn`/`FadeOut`. Panel advance driven by `useRef` timer.

Skip button: `Pressable` top-right, 44x44pt. `Text` "Skip" 14pt `#888`. On press: immediately advance to Step 2 and clear all timers.

Audio: `expo-av` plays `assets/music/onboarding_intro.mp3` (looping, fades in).

#### Step 2: Faction Selection

Three `FactionCard` components in a horizontal `FlatList` or `PagerView` (use `react-native-pager-view`).

Each `FactionCard`: full-screen card (view width x 80% height). `borderRadius: 20`. Faction-themed gradient background via `LinearGradient`.

Contents:
- Faction icon `Image` 80x80pt centered.
- Faction name `Text` 26pt bold.
- 2-line description `Text` 16pt `#B0B0B0`.
- Sample card `Image` 180x252pt (pre-generated base card from faction pool).
- "Choose [Faction]" `Pressable` 200x52pt faction accent color. On press: expand selected card, fade out others, 600ms transition, then advance to Step 3.

Page indicator: 3 dots at bottom. Active dot = faction accent.

#### Step 3: Tutorial Match (Guided Battle)

Uses the standard Battle screen (`/battle/tutorial`) but with an overlay state machine that controls which elements can be interacted with.

Tutorial overlay: `View` `position: 'absolute'` `flex: 1` `pointerEvents: 'box-none'` (allows touch-through to highlighted elements only).

`TutorialOverlay` component maintains a `currentStep` state. For each step:
- A `SpotlightMask`: Skia canvas rendering a semi-transparent dark overlay with a hole cut out for the highlighted element. Position data comes from `useRef` + `onLayout` measurements on the target element.
- `TutorialTooltip`: `View` 280x100pt positioned near the spotlight. `Text` instruction. Arrow pointing toward highlighted element.
- Highlighted element has `pointerEvents: 'auto'`. All other elements have `pointerEvents: 'none'`.

Tutorial steps (9 steps as specified in master doc). Each step waits for the required player action before advancing. Step 9 triggers a scripted AI defeat (server returns loss).

Turn timer is disabled during tutorial (server sends unlimited timer state).

Skip button: always visible at top-right, 44x44pt. On press: skip to Step 4, award starter deck, mark tutorial complete.

#### Step 4: Faction Commitment

After tutorial match, modal appears:

`Modal presentation: 'modal'`. `View` `borderRadius: 20` centered.

"Keep [Faction] as your first faction?" with selected faction illustration.

Two deck previews: selected faction (highlighted, gold border) vs. "Return" indicator for others.

"Keep [Faction] Deck" `Pressable` 220x52pt. Calls Supabase `player/commit-faction` Edge Function. On success: the 20 trial cards are converted to owned `CardInstance` records in DB.

#### Step 5: First Evolution (Guided)

Server pre-awards 15 chaos energy (threshold met) and 1 Uncommon Shard to the player's starting 2-cost creature.

Notification banner slides in: "Your [CreatureName] is ready to evolve!" `Pressable` opens Card Detail.

In Card Detail, an overlay tooltip points to "Evolve" button: "Tap Evolve to transform your creature."

Player proceeds through normal evolution flow with overlays at each step explaining what they're doing. Same `TutorialOverlay` mechanism.

#### Step 6: Deck Builder Tour

On first visit to `/(tabs)/decks`, check Zustand flag `deckBuilderTourComplete`. If false, run tour.

Tour: 5 tooltips using `TutorialTooltip` positioned near target elements. Each auto-advances after 4s or on tap. Tour completes: set `deckBuilderTourComplete: true`.

#### Step 7: Release to Home

Last onboarding screen: `View` full-screen. Faction-themed gradient. "You're ready!" `Text` 28pt bold. "Start Playing" `Pressable` 200x52pt gold. On press: sets `AsyncStorage` `onboardingComplete: 'true'`, then `router.replace('/(tabs)/home')`.

Pre-populate daily missions in Zustand: 3 starter missions as defined in master doc.

### 7.3 Starter Deck Composition

See master doc Section 3 Onboarding Flow for exact card counts. Starter deck data is seeded in Supabase and fetched by `player/commit-faction` Edge Function. Cards are pre-generated from the batch pipeline CardTemplates.

---

## 8. Interaction Patterns

React Native Gesture Handler (`react-native-gesture-handler`) handles all gestures.

### 8.1 Tap Targets

**Minimum tap target: 44x44pt** (Apple HIG).

All `Pressable` and `TouchableOpacity` components must have either:
- Physical dimensions >= 44x44pt, OR
- `hitSlop={{ top: N, bottom: N, left: N, right: N }}` to expand tap area to 44x44 minimum.

Visual elements smaller than 44pt (mana crystals 20pt, keyword icons 24pt): add `hitSlop` padding so logical tap area is 44x44.

### 8.2 Tap Interactions

All `Pressable` components use `android_ripple={{ color: 'rgba(255,255,255,0.1)' }}` on Android.

On iOS: `Animated.View` with `useAnimatedStyle` scaling to 0.95 on press-in, back to 1.0 on press-out. Duration: 100ms via `withTiming(Linear)`.

| Element | Tap Action | Feedback |
|---|---|---|
| Card in hand | Select to play (lift) | Scale 1.1, shadow |
| Card on board | Open Card Detail modal | Brief scale pulse 1.05 |
| Creature (attack phase) | Toggle attacker | Red border glow |
| Avatar (battle) | Open Graveyard modal | Avatar scale pulse |
| Pressable button | Execute action | Scale 0.95 then 1.0 |
| Faction tab | Filter collection | Accent underline slides (Reanimated) |

### 8.3 Long Press Interactions

Implemented via `Gesture.LongPress()` from RNGH. All long presses require `minDuration: 400` (ms).

| Element | Long Press Action | Feedback |
|---|---|---|
| Card in hand (battle) | Preview detail without playing | Card Detail modal in peek mode |
| Card row in deck builder | "Remove from Deck?" prompt | Confirmation tooltip appears |
| Deck in deck selector | Action menu (Edit/Duplicate/Delete) | Bottom sheet slides up |
| Card in collection | Quick action menu (Evolve/Add/Favorite) | Context menu popover |

### 8.4 Drag Interactions

Implemented via `Gesture.Pan()`. Minimum distance before activation: `minDistance: 10`.

| Element | Drag | Feedback |
|---|---|---|
| Card from hand → board | Play card | Card 1.2x scale, follows finger, drop zones highlight green |
| Card from hand → target | Cast targeted spell | Card follows finger, valid targets glow green |
| Blocker → attacker | Assign block | Blocker 1.15x scale, follows finger, valid attackers glow |
| Blocker → empty board | Unassign block | Connection line breaks on release |
| Hand (horizontal) | Scroll | Momentum scroll (ScrollView native) |

Drag smoothing: 0.1s Reanimated `withTiming` on position updates to prevent jitter.

Invalid drop: `withSpring` card back to origin. Haptic: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`.

Valid drop: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`.

### 8.5 Swipe Interactions

| Element | Direction | Action |
|---|---|---|
| Hand (in battle) | Left/right | ScrollView native scroll |
| Collection grid | Up/down | FlatList native scroll |
| Deck selector (home) | Left/right | FlatList paginated scroll |
| Left edge of battle screen | Right | Open battle log panel (Gesture.Pan detecting start near x < 20) |
| Evolution channel buttons | Left/right | PagerView swipe between Order/Chaos options |

Swipe activation: minimum 50pt movement, velocity threshold 80pt/s (distinguish from slow drag).

### 8.6 Haptic Feedback

Implemented via `expo-haptics`. All haptics wrapped in a `try/catch` because haptics are not available on all devices.

| Action | Haptic | expo-haptics call |
|---|---|---|
| Card played | Light impact | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` |
| Damage dealt | Medium impact | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Creature destroyed | Heavy impact | `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` |
| D20 rolls | Light on start, medium on land | Two calls sequenced |
| Evolution complete | Success | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Invalid action / error | Error | `Haptics.notificationAsync(NotificationFeedbackType.Error)` |
| Button tap (general) | Selection | `Haptics.selectionAsync()` |

Android: use same `expo-haptics` API. Expo maps calls to `android.os.VibrationEffect` automatically.

---

## 9. Responsive Considerations

### 9.1 Phone vs Tablet

Detect via `useWindowDimensions()` hook. Define breakpoints:
- Phone portrait: `width < 428`
- Phone landscape: `height < 428` (or `width >= 428 && height < 428`)
- Tablet: `width >= 768`

| Screen | Phone Portrait | Tablet (768pt+) |
|---|---|---|
| Collection | 3 columns `FlatList` | 5 columns |
| Deck Builder | Stacked (tabs for deck/pool) | Side-by-side `View` |
| Battle | Full portrait (see layout spec) | Portrait preferred (wider board) |
| Shop | Single column | 2 columns for packs/shards grid |
| Bottom tab bar | Icons only if width < 375 | Icons + labels |

### 9.2 Orientation Lock

All screens: allow both portrait and landscape via `expo-screen-orientation`.

**Exception — Battle screen**: force portrait on mount via `ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)`. Restore on unmount via `ScreenOrientation.unlockAsync()`.

**Exception — Evolution flow**: force portrait on mount, restore on unmount.

This is the MVP decision. Landscape battle is a post-launch enhancement.

### 9.3 Safe Area

All screens wrapped in `<SafeAreaView style={{ flex: 1 }}>` from `react-native-safe-area-context`.

Modals and full-screen overlays: extend background to screen edges (including notch/Dynamic Island area) via `backgroundColor` on the outer `View`, but keep content (text, buttons) inside `SafeAreaView`.

### 9.4 Font Scaling (Accessibility)

```
Component text: Text allowFontScaling={true} (default)
```

Fixed-size text (ATK/HP on compact cards): `allowFontScaling={false}` with `adjustsFontSizeToFit={true}` and `minimumFontScale={0.7}` to handle small values without breaking layout.

Long card names: `numberOfLines={1}` + `ellipsizeMode="tail"`. Max ~25 characters before truncation.

---

## 10. Animation & Timing Specifications

### 10.1 Standard Durations (Reanimated)

| Animation | Duration | Easing |
|---|---|---|
| Modal slide in/out | 300ms | `Easing.out(Easing.quad)` |
| Card flip (detail reveal) | 400ms | `Easing.inOut(Easing.quad)` |
| Button press feedback | 100ms | `Easing.linear` |
| Tab switch | 250ms | `Easing.out(Easing.cubic)` |
| Tooltip appear/dismiss | 200ms | `Easing.out(Easing.quad)` |
| Card draw (deck to hand) | 500ms | `Easing.out(Easing.cubic)` |
| Card play (hand to board) | 400ms | `Easing.out(Easing.cubic)` |
| Damage number fly-up | 800ms | `Easing.out(Easing.quad)` |
| Death animation | 1200ms | Custom particle |
| D20 roll | 1500-2500ms | Custom tumble |
| Evolution shard crack | 600ms | `Easing.inOut(Easing.quad)` |
| Art reveal (iris wipe) | 1200ms | `Easing.out(Easing.cubic)` |

All `withTiming` calls use `Easing` imported from `react-native-reanimated`. Not from `react-native`.

### 10.2 Skippable vs Non-Skippable

**Skippable** (player tap to advance):
- Evolution animations (any step — tap to accelerate to next step).
- Intro cinematic (skip button always visible).
- Flavor text typeout (tap to complete instantly).
- Pack opening (tap to skip to next card reveal).

**Non-Skippable** (must complete for game state clarity):
- Combat damage resolution.
- D20 roll + event overlay (minimum 2.5s).
- Card draw animation.
- Death animation (1200ms minimum).

### 10.3 Reduced Motion Mode

Check `AccessibilityInfo.isReduceMotionEnabled()` on mount. Store in Zustand `preferences.reducedMotion`.

If `reducedMotion: true`:
- Replace all `withTiming`/`withSpring` transitions with instant value changes via `withTiming(value, { duration: 0 })`.
- D20 roll: instant number display, no spinning animation.
- Particle effects: disabled (Skia canvas still renders but particles are omitted).
- Screen shake on damage: disabled.
- Card slides: fade-in instead of translate.

---

## 11. Error States & Edge Cases

### 11.1 Network Loss

**During Matchmaking:** `NetInfo` (from `@react-native-community/netinfo`) detects loss. Toast "Connection lost. Matchmaking cancelled." `router.back()` to mode selection.

**During Battle:** Reconnection overlay: `View` full-screen semi-transparent dark. Spinner (use `ActivityIndicator` from React Native). "Reconnecting..." `Text`. Client attempts Supabase Realtime reconnect. If reconnected within 10s: resume. If not: "Match forfeited. Returning home." Counts as loss. `router.replace('/(tabs)/home')`.

**During Evolution:** If Supabase call fails: error modal with "Try Again" button and "Cancel" button. Shard and energy are NOT consumed until `evolution/confirm` is called (final step). Partial failures before confirm = safe to retry.

### 11.2 Empty States

Each `FlatList` has a `ListEmptyComponent` prop rendering an empty state `View`:

```
Component: View
style: { flex: 1, justifyContent: 'center', alignItems: 'center',
         paddingVertical: 60, paddingHorizontal: 30 }
```

Faction symbol `Image` 80x80pt at 20% opacity. `Text` message 16pt `#888` centered. `Pressable` CTA button if applicable.

| Screen | Empty Condition | Message | CTA |
|---|---|---|---|
| Collection | No cards in faction | "No cards yet. Visit the Shop!" | "Visit Shop" |
| Deck Builder | No cards | "Add cards from the card pool" | None |
| Graveyard | No destroyed cards | "No cards destroyed yet" | None |
| Friends | No friends | "Add friends to challenge them!" | "Add Friend" |

### 11.3 Validation Messages

Toast notifications: implement as a `ToastProvider` at the Expo Router root layout. `Toast.show(message, type)` callable from anywhere. Position: bottom, above tab bar. Duration: 2000ms. Slide in from bottom, slide out.

| Invalid Action | Message | Toast Type |
|---|---|---|
| Deck full | "Deck is full (20/20)" | warning |
| Not enough mana | "Not enough mana" | error |
| Max Legendaries | "Deck already has 2 Legendaries" | warning |
| Max copies | "Already have 2 copies" | warning |
| Card not ready | Card Detail: disabled "Evolve" with tooltip | tooltip |
| Purchase failed | "Purchase failed. Please try again." | Modal (not toast) |

---

## 12. Accessibility Features

### 12.1 Colorblind Modes

Setting in `/(tabs)/profile` → Settings → Visuals → "Colorblind Mode".

Options: "None" | "Deuteranopia" | "Protanopia" | "Tritanopia".

Implementation: Zustand `preferences.colorblindMode` drives icon + pattern changes globally.

Order indicator: blue + crystal icon + striped `View` pattern overlay (CSS-like via Skia).
Chaos indicator: red + flame icon + dotted `View` pattern overlay.
Attunement: Order = blue circle icon, Chaos = red triangle icon, Neutral = gray square.
HP bars: always show numeric HP alongside color bar.

### 12.2 VoiceOver / TalkBack

Apply `accessible={true}` and `accessibilityLabel` props to all interactive elements.

Examples:
- Card on board: `accessibilityLabel={`${card.name}, ${card.atk} attack, ${card.hp} HP, ${card.keywords.join(', ')}`}`
- End Turn button: `accessibilityLabel="End Turn"`
- Battle state label: applied to a visually-hidden `Text` component announcing "Your turn, 45 seconds remaining, instability 8, 3 creatures on your board."

Priority: implement labels for all interactive elements in MVP. Screen reader navigation of the full battle screen is post-launch enhancement.

### 12.3 Turn Timer Extension

Setting: `preferences.extendedTimer` (boolean). Only affects Casual and Practice modes. Server respects this setting when creating the match — sends `timerSeconds: 90` instead of 60 in match init payload. Ranked always 60s regardless of setting.

---

## 13. Visual Styling Constants

### 13.1 Color Palette (TypeScript constants file: `constants/colors.ts`)

```typescript
export const Colors = {
  // Base
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  border: '#3A3A3A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#666666',

  // Factions
  ironwright: '#4A90E2',
  feyCourts: '#7ED321',
  demonic: '#D0021B',

  // Events
  order: '#5BC0EB',
  chaos: '#E63946',

  // Tiers
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',

  // Actions
  danger: '#F44336',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
} as const;
```

### 13.2 Typography (`constants/typography.ts`)

```typescript
export const Typography = {
  // All sizes in sp (scale-independent pixels, same as pt on 1x screens)
  displayLarge: { fontSize: 28, fontWeight: '700' as const },
  displayMedium: { fontSize: 24, fontWeight: '700' as const },
  headline: { fontSize: 20, fontWeight: '700' as const },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  micro: { fontSize: 11, fontWeight: '400' as const },
  // Card-specific
  cardStatLarge: { fontSize: 28, fontWeight: '800' as const },
  cardStatSmall: { fontSize: 16, fontWeight: '700' as const },
  cardNameBoard: { fontSize: 13, fontWeight: '700' as const },
} as const;
```

Font family: `fontFamily` is NOT set globally. React Native uses San Francisco (iOS) and Roboto (Android) by default. A display font (e.g., a fantasy/serif font) will be loaded via `expo-font` for card names and evolution screen headers only. Font file goes in `assets/fonts/`. `useFonts` hook in root layout.

### 13.3 Card Frame Design Constants

Aspect ratio: 5:7 (portrait). `borderRadius: 8`. Border 3pt, color = tier color. Art area: top 65%. Stats area: bottom 35% with dark gradient overlay starting at 50%.

Board size: 60x84pt (exactly 5:7 at 60pt wide).
Hand size: 88x123pt.
Detail view size: 280x392pt.
Grid thumbnail: 100x140pt.

---

## 14. Settings Screen

Route: `/settings`. Full-screen stack push from gear icon.

```
Component: SectionList
sections: accountSection, audioSection, visualsSection, gameplaySection,
          notificationsSection, privacySection
```

Each section header: `Text` 13pt `#888` uppercase, padded.

Each setting row: `View` 44pt height minimum (full touch target). `flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'`.

- Text setting: `TextInput` right-aligned.
- Toggle setting: `Switch` (React Native `Switch`, `trackColor: { true: faction accent, false: '#3A3A3A' }`).
- Dropdown setting: `Pressable` showing current value + chevron → navigates to sub-screen with `RadioGroup`.
- Slider setting: `@react-native-community/slider` full-width.
- Destructive action (Delete Account): `Text` `#F44336` color. On press: confirmation `Alert.alert()`.

Data Export: `Pressable` row "Export My Data" → calls Supabase `player/export-data` Edge Function → JSON file downloaded via `expo-file-system` and shared via `expo-sharing`.

---

## 15. Post-Match Results Screen

Route: `/battle/results`.

### 15.1 Layout

```
Component: ScrollView
style: { flex: 1, backgroundColor: '#0D0D0D' }
```

**Result Header** (fixed, not scrollable):

```
Component: View
style: { paddingVertical: 40, alignItems: 'center' }
background: LinearGradient victory=[#F9A825,#FF8F00] or defeat=['#1A1A1A','#0D0D0D']
```

`Text` "VICTORY" or "DEFEAT" 36pt bold. Reason `Text` 14pt `#888`.

Victory: Reanimated `BounceIn` on "VICTORY" text + confetti particle burst from Skia Canvas.
Defeat: no animation (clean and respectful).

**Rewards Section:**

XP bar: `Text` "+50 XP" + `ProgressBar` component showing level progress. Fills from current position via Reanimated `withTiming`.

Card Energy Earned: `FlatList` horizontal showing up to 5 card thumbnails. Each card: `Image` 50x70pt + `Text` "+2 Energy" below. "READY TO EVOLVE!" badge on cards that hit threshold: animated `BounceIn` gold badge.

Chaos Dust: `Text` chaos mote icon + "+100 Dust" `Text` 20pt bold.

Quest Progress: if any quests advanced, render quest rows with progress `Text`.

**Opponent Profile Card:**

`View` `backgroundColor: '#1A1A1A'` `borderRadius: 12` `padding: 16`. Opponent avatar + name + rank badge. 3 showcase card thumbnails. "Add Friend" and "View Profile" `Pressable` buttons.

**Bottom Buttons:**

- "Play Again": `Pressable` 180x52pt gold. Re-queues same deck.
- "Evolve Cards": `Pressable` 180x52pt `#2196F3`. Only visible if any card evolution-ready. On press: `router.push('/collection?filter=evolution-ready')`.
- "Home": `Pressable` text-only, bottom-left.

---

## Part B — Admin / Content Management UI

The owner manages the game via a web dashboard. This is a separate web application, NOT part of the mobile app. It is the sole interface for all game management tasks. The owner should never touch the Supabase dashboard, Railway console, or any raw database.

**Stack: React (Vite + TypeScript) deployed to Cloudflare Pages.**

Route: `admin.chaoscreatures.game` (password-protected via Supabase Auth email/password, single owner account).

---

## 16. Admin Dashboard Overview

### 16.1 Admin Navigation

Persistent left sidebar (240pt wide) with section links:

```
[Logo]
-----------
[Dashboard]     /admin
[Cards]         /admin/cards
[Evolution]     /admin/evolution
[Players]       /admin/players
[Economy]       /admin/economy
[Analytics]     /admin/analytics
[Settings]      /admin/settings
```

Main content area fills remaining width.

### 16.2 Dashboard Page (`/admin`)

Landing page showing key metrics at a glance.

**Stats Grid (4 columns):**
- Total active players (last 7 days).
- Total evolutions today.
- Total card packs purchased today.
- Total Chaos Dust distributed today.

Each stat: large `text` number + small delta vs. yesterday (green up-arrow or red down-arrow).

**Pending Actions Panel** (highest priority):
- Cards awaiting approval: count badge + "Review Now" link → `/admin/cards?status=pending`.
- Evolution requests failed: count + "Investigate" link.
- Player reports: count + "Review" link.

**Recent Activity Feed:** Scrollable list of last 50 events (card approved, player registered, evolution completed, pack purchased). Timestamp + event type + description.

**Quick Actions:**
- "Generate Card Batch" button → opens generation workflow modal.
- "Send Announcement" button → in-game notification to all players.
- "Toggle Maintenance Mode" button → puts game in maintenance mode (shows maintenance screen to players).

### 16.3 Cards Management (`/admin/cards`)

This is the core content approval workflow.

**Tab bar:** "Pending Review" | "Approved" | "Rejected" | "All Cards"

**Pending Review tab (default):**

Grid of card thumbnails (6 columns on wide monitor). Each card:
- Full card art thumbnail (160x224pt).
- Card name overlay.
- Faction badge.
- Tier badge.
- Generation timestamp.
- Two buttons: "Approve" (green) and "Reject" (red).

Approving a card: calls `POST /admin/cards/{templateId}/approve`. Card moves to approved state. `approved_at` and `approved_by` stamped in DB.

Rejecting a card: opens reject modal. Owner selects reason from dropdown: "Art quality poor" | "Stats imbalanced" | "Art inappropriate" | "Other" (free text). Card marked `rejected`. Option: "Regenerate" button — triggers new FLUX generation job for the same template.

**Batch approve:** Checkbox selection + "Approve Selected" button at top. Calls batch approve API.

**Card Detail (click thumbnail):** Expanded view showing:
- Large card art (400x560pt).
- All card stats: type, mana cost, ATK, HP, instability, keywords, faction.
- Generation metadata: FLUX model used, prompt used, generation time.
- Action buttons: Approve / Reject / Regenerate / Edit Stats.

**Edit Stats:** Inline form. Owner can adjust ATK, HP, mana cost, keywords, instability values. Save triggers DB update. Reason field required. Change logged in audit trail.

**Regenerate:** Owner can optionally edit the prompt modifier list before regenerating. "Use same prompt" or "Edit prompt" toggle. Submit → new FLUX job queued → card returns to pending.

**Generate Card Batch Workflow:**

Modal overlay with wizard:

Step 1: Select faction (Ironwright / Fey Courts / Demonic Kingdoms).
Step 2: Select card type (Creature / Spell / Stabilizer).
Step 3: Set quantity (1-20 cards).
Step 4: Select archetype template from dropdown (e.g., "2-cost aggro creature", "3-cost removal spell").
Step 5: Review generated prompt. "Generate" button.
Step 6: Progress bar while FLUX batch runs. Real-time job status via polling.
Step 7: Results appear in Pending Review tab.

All of this fires via a single button press after the wizard setup. No command line.

### 16.4 Evolution Management (`/admin/evolution`)

Monitor and manage player evolutions.

**Active Jobs tab:** Live table of in-progress FLUX generation jobs. Columns: Player ID, Card Name, Evolution tier, Status (queued / generating / completed / failed), Duration, Actions.

**Failed Jobs:** Filtered view. For each failed job: Player ID, Card, Error message, Time. Action: "Refund & Notify Player" (server refunds shard + energy, sends in-app notification) or "Retry Job" (requeues FLUX job).

**Evolution Statistics:** Daily chart (line graph) of evolutions per day. Breakdown: by tier (Common→Uncommon, Uncommon→Rare, etc.), by faction. Uses PostHog analytics data via PostHog API.

**Modifier Pool Management:** Table of all 240 modifiers. Editable via inline form. Owner can adjust modifier text, PP cost, effects. Cannot delete a modifier already granted to a player's card — only deprecate (marks as no-longer-available for new evolutions but remains on existing cards).

### 16.5 Players Management (`/admin/players`)

**Player search:** Input field. Search by username, player ID, or email. Returns matching player row(s).

**Player list:** Table. Columns: Username, Faction, Subscription tier, Total games, Cards owned, Last active, Join date, Actions.

**Player detail page (click row):**
- Player info panel: avatar, username, email, subscription tier, join date, last active.
- Stats: total games, win rate, total evolutions, Chaos Dust balance, shard balances.
- Card collection: grid of all owned cards (same as Collection screen admin view).
- Activity log: recent actions (logins, purchases, evolutions, battles).
- Actions panel:
  - "Grant Chaos Dust": input field + "Grant" button. Requires reason field. Logged.
  - "Grant Shard": tier dropdown + "Grant" button. Logged.
  - "Suspend Account": input reason + duration. Logged.
  - "Unsuspend Account": if suspended.
  - "Reset Evolution" (admin escape hatch): refund a specific evolution. Reverts card and returns shard + energy.

All admin actions are logged in an `admin_audit_log` table in Supabase with `admin_user_id`, `action`, `target_player_id`, `reason`, and `timestamp`.

### 16.6 Economy Management (`/admin/economy`)

**Currency Overview:**
- Total Chaos Dust in circulation (sum of all player balances).
- Total Dust distributed today, this week, this month.
- Dust source breakdown: wins, losses, quests, admin grants.

**Quest Management:**
- Table of all active daily/weekly quests.
- Edit quest: reward amount, description, completion condition.
- "Add New Quest" button → form modal.
- Toggle quest on/off without deleting.

**Subscription Overview:**
- Count of players per tier (Free / Mid / Top).
- Monthly revenue estimate.
- Churn rate (month-over-month tier changes).

**IAP Products:** Table of all App Store / Google Play IAP product IDs. Shows price, type (subscription / one-time), active status. Cannot be edited here (IAP products are managed in App Store Connect / Play Console) — this is read-only reference.

### 16.7 Analytics (`/admin/analytics`)

Embedded PostHog dashboard iframe. Configured during setup to show:
- Daily/weekly active users.
- Retention cohorts.
- Match completion rate.
- Evolution funnel (how many players start vs. complete evolution).
- Economy health (Dust inflation/deflation indicators).
- Subscription conversion funnel.

Alternatively, owner can link directly to PostHog project dashboard in a new tab.

### 16.8 Settings (`/admin/settings`)

- **Game Configuration:** Global values editable here instead of hardcoded:
  - Turn timer duration (default 60s). Input field + Save.
  - Card energy thresholds per tier (15/30/50/75). Four input fields + Save.
  - Chaos Dust rewards per game result (Win: 15, Loss: 5). Input fields + Save.
  - Pack costs (standard/premium/faction). Input fields + Save.
  - Shard costs per tier. Input fields + Save.
  All saved values write to a `game_config` table in Supabase. Client reads config on launch and caches it.

- **Maintenance Mode:** Toggle switch. When on: all game clients show a maintenance screen. Message text field.

- **Announcement:** Text area + "Send to All Players" button. Sends in-app notification to all active players.

- **Admin Accounts:** Table of admin users. Add / remove admin emails. All admins have full access (no role subdivision in MVP).

- **API Keys Status:** Read-only table showing whether each required API key is set in environment variables. Green checkmark / red X for: SUPABASE_URL, SUPABASE_SERVICE_KEY, FAL_AI_KEY, OPENAI_API_KEY, CLOUDFLARE_R2_KEY, POSTHOG_KEY. Does NOT display the actual key values.

### 16.9 Admin Content Generation Pipeline

The full card batch generation workflow from the owner's perspective:

1. Owner opens `/admin/cards` → clicks "Generate Card Batch".
2. Wizard: select faction, card type, archetype, quantity.
3. Click "Generate" — server fires FLUX batch job via `admin/generate-batch` Supabase Edge Function.
4. Modal shows progress: "Generating 10 cards... [7/10 complete]". Auto-refreshes every 2 seconds.
5. When batch complete: modal closes. "Pending Review" tab auto-selected with new cards showing.
6. Owner scrolls through cards. For each: "Approve" or "Reject" or open detail for closer look.
7. Rejected cards offer "Regenerate" option.
8. All approved cards are immediately available in player packs.

The owner's entire workflow is: open browser → two clicks → review grid → approve/reject. No terminal, no SQL, no API calls.

---

## 17. Deep Linking & Notifications

### 17.1 Deep Link Scheme

Expo `app.json` config:
```json
{
  "scheme": "chaoscreatures",
  "intentFilters": [
    { "pattern": "/card/:cardInstanceId/evolve" },
    { "pattern": "/card/:cardInstanceId" },
    { "pattern": "/shop" },
    { "pattern": "/battle/results" }
  ]
}
```

Push notifications via Expo Push Notification Service (`expo-notifications`). Notification payloads include a `data.screen` field that Expo Router resolves on tap.

### 17.2 Notification Types

| Notification | Trigger | Deep Link |
|---|---|---|
| "Card ready to evolve!" | Evolution threshold met | `/card/{id}/evolve` |
| "Daily quests reset" | 00:00 UTC daily | `/(tabs)/home` |
| "Match found!" | Matchmaking match | `/battle/{matchId}` |
| "Friend came online" | Friend status change | `/(tabs)/profile` |
| Game announcement | Admin sends announcement | Modal on `/home` |

All notifications respect notification settings from `/(tabs)/profile → Settings → Notifications`.

---

## 18. File & Asset Conventions

### 18.1 Project Structure

```
app/                          Expo Router screens
  (tabs)/
    home.tsx
    collection.tsx
    decks.tsx
    profile.tsx
    shop.tsx
  battle/
    [matchId].tsx
    mode-select.tsx
    matchmaking.tsx
    results.tsx
  card/
    [cardInstanceId].tsx
    [cardInstanceId]/
      evolve.tsx
  onboarding.tsx
  settings.tsx
components/                   Reusable components
  battle/
    BoardSlot.tsx
    BoardCardView.tsx
    D20Component.tsx
    PhaseIndicator.tsx
    EventOverlay.tsx
    HpBar.tsx
    TimerBar.tsx
    HandScrollView.tsx
    CardInHand.tsx
    ManaDisplay.tsx
    EndTurnButton.tsx
    BattleLogPanel.tsx
    GraveyardModal.tsx
    DamageNumber.tsx
    TauntShield.tsx
  card/
    CardGridItem.tsx
    CardDetailModal.tsx
    EvolutionTimeline.tsx
  evolution/
    ChannelButton.tsx
    ShardAnimation.tsx
    ArtReveal.tsx
    NameSelector.tsx
    AbilityReveal.tsx
    ModifierCard.tsx
    FlavorTextReveal.tsx
  shared/
    HpBar.tsx
    ProgressBar.tsx
    ToastProvider.tsx
    TutorialOverlay.tsx
    BottomSheet.tsx
    CardFrame.tsx
constants/
  colors.ts
  typography.ts
  layout.ts                   CARD_SIZES, BOARD_SLOT_SIZE, etc.
stores/                       Zustand stores
  gameStore.ts
  collectionStore.ts
  deckStore.ts
  playerStore.ts
  preferencesStore.ts
assets/
  fonts/
  icons/                      All UI icons as PNG (1x, 2x, 3x)
  sounds/
  particles/
```

### 18.2 Asset Naming Convention

```
[category]_[element]_[variant]_[state]@[scale]x.png
```

Examples:
- `icon_chaos_mote_filled@2x.png`
- `icon_shard_uncommon@2x.png`
- `icon_keyword_taunt@2x.png`
- `card_frame_common@2x.png`
- `avatar_ironwright_aldric_portrait@2x.png`
- `bg_battle_ironwright@2x.png`

SVG icons for scalable UI icons (faction symbols, keyword icons) stored as `.svg` files and rendered via `react-native-svg`.

---

## 19. Open Questions & Post-Launch Enhancements

### Resolved for MVP:
- Orientation: portrait-only in battle. Restored outside battle.
- Card flip interaction: deferred post-launch.
- Admin dashboard: web app on Cloudflare Pages.

### Deferred to Post-Launch:
- Landscape battle mode.
- Light theme.
- Advanced battle log filters.
- Deck import/export (share codes).
- Card comparison tool.
- Collection stats dashboard.
- Battle replay viewer.
- Full VoiceOver/TalkBack battle navigation.

### Post-Launch Monitoring (via PostHog):
- Turn timeout rate: if >15% of turns end by timer, increase to 75s.
- Evolution flow completion rate: if <70% complete all 9 steps, simplify to fewer steps.
- Modifier selection time: if >30s average, reduce to 2 options across all tiers.
- Pack purchase conversion after graveyard view (does graveyard envy drive shop opens?).

---

## Revision Log

This section documents all changes made from Version 1.0 to Version 2.0.

### Breaking Changes (Removed)

1. **Removed all Unity/C# references.** The original document mentioned no Unity references, but did use vague phrases like "the engineer should decide" and "engineering handoff" that implied an engineer would interpret the spec. All such phrases removed. Replaced with specific implementation decisions.

2. **Removed generic "engineering handoff" framing.** The document was written as a spec for a human engineering team. Reframed for direct Claude Code implementation — all decisions are made explicitly in this document.

### Technology Stack Additions

3. **Added Technology Stack Decisions section.** Original doc had no component library or animation library decisions. Now specifies: React Native (Expo), Expo Router v3, React Native Reanimated 3, React Native Skia, React Native Gesture Handler, Zustand, TanStack Query, Supabase Realtime, expo-haptics, expo-av, expo-in-app-purchases, expo-screen-orientation, @gorhom/bottom-sheet, react-native-pager-view, react-native-view-shot, @react-native-community/netinfo, @react-native-community/slider.

4. **Added Expo Router path for every screen.** Original had screen names only. All screens now have explicit Expo Router file paths.

5. **Replaced all "Unity component" language with React Native component names.** Every component specification now names actual React Native primitives (View, ScrollView, Pressable, Animated.View, FlatList, TextInput, Modal, SafeAreaView, Switch, SectionList, PagerView, ActivityIndicator, Alert).

### Battlefield Screen Changes

6. **Added exact pixel heights for all battle screen regions.** Original had a text layout diagram without dimensions. Now specifies exact pt heights (64, 110, 120, 110, 56, 128, 56) that sum to fit the reference screen.

7. **Added full HpBar Skia implementation spec.** Original said "HP Bar with gradient." Now specifies Skia Canvas, color interpolation values, exact Reanimated animation sequences for damage and heal.

8. **Added full BoardCardView spec.** Original had "Compact card display" bullet points. Now specifies exact component structure, child components, absolute positioning for badge elements, and Reanimated animation hooks.

9. **Added CenterZone D20 animation state machine.** Original said "Full 3D roll when active." Now specifies a 2D Skia canvas with 4 states (idle/rolling/settled), Reanimated timing, Easing functions, and color state mapping.

10. **Replaced drag interaction description with RNGH implementation spec.** Original had "Drag card upward from hand." Now specifies `Gesture.Pan()`, `onStart`/`onUpdate`/`onEnd` handlers, `withSpring` bounce-back, and Zustand broadcast for drop zone highlighting.

11. **Specified mana crystal animation with exact Reanimated call.** `withTiming(0.4, 200ms)`.

12. **Added TimerBar color states as exact values.** `#4A90E2` for normal, `#E63946` for warning, pulsing `withRepeat` opacity.

### Evolution Screen Changes

13. **Added Evolution Flow state machine.** Original listed steps sequentially. Now specifies a named state machine: `STEP_1_PRESENTATION | STEP_2_CHANNEL | ... | STEP_9_CONFIRM`.

14. **Added FLUX API call timing.** Clarified that the API call fires at Step 2 (channel selection confirm), not Step 3. The server returns `evolutionJobId` and the client polls `/evolution/status/{evolutionJobId}` every 500ms during Step 3 animation.

15. **Specified Step 3 particle animation implementation.** Original said "particles swirl." Now specifies Skia Canvas with 30 particle `Circle` shapes driven by Reanimated shared values, orbit implemented via `useDerivedValue` computing (x, y) from angle + radius.

16. **Added `react-native-view-shot` for share screenshot.** Original said "Generates shareable image." Now specifies `captureRef` from `react-native-view-shot` + `expo-sharing`.

17. **Added FLUX failure handling detail.** Specified 10-second timeout, error modal, server rollback via Edge Function, PostHog error event.

### Collection & Deck Builder Changes

18. **Replaced generic "grid" with FlatList spec.** Specified `numColumns`, `keyExtractor`, `renderItem`, `columnWrapperStyle`, `ItemSeparatorComponent`.

19. **Added @gorhom/bottom-sheet for FilterPanel.** Original said "Opens filter panel." Now specifies `BottomSheet` component with `snapPoints: ['65%']`.

20. **Added search debounce detail.** 300ms debounce via TanStack Query `enabled` flag.

21. **Added tablet layout detection.** `useWindowDimensions()` hook with explicit `768pt` breakpoint driving `DeckBuilderTablet` vs `DeckBuilderPhone` conditional render.

22. **Added Deck Contents drag-to-remove spec.** `Gesture.LongPress` with 400ms delay + `Portal` overlay for confirmation.

### Shop Screen Changes

23. **Added expo-in-app-purchases for subscription and shard purchases.** Original said "Button: Purchase" without implementation detail. Now specifies Expo IAP.

24. **Added Pack Opening Modal specification.** Original had brief description. Now specifies full Modal component, face-down card `FlatList`, Reanimated `rotateY` flip animation sequence.

25. **Specified LinearGradient for subscription tier cards.** Uses `expo-linear-gradient`.

### Onboarding Flow Changes

26. **Added TutorialOverlay implementation.** Original described overlays conceptually. Now specifies Skia `SpotlightMask` canvas, `onLayout` measurements for positioning, `pointerEvents: 'box-none'` for touch-through behavior.

27. **Added AsyncStorage persistence for onboarding state.** `onboardingComplete` key in AsyncStorage. Expo Router redirect logic on root layout.

28. **Added faction commitment step (Step 4).** Original onboarding had only 3 trial games then commitment, but did not specify what UI triggers the commitment. Now specifies a post-tutorial `Modal` with explicit Supabase `player/commit-faction` Edge Function call.

29. **Added `react-native-pager-view` for faction selection.** Swipeable PagerView with page indicator dots.

### Interaction Patterns Changes

30. **Specified all Gesture.Pan() / Gesture.LongPress() implementations with RNGH.** Original had description-level interaction table. Now has implementation-level specs.

31. **Added Gesture.LongPress `minDuration: 400ms` standard.** Consistent across all long-press interactions.

32. **Added drag tolerance spec: `minDistance: 10`.** Prevents accidental drags on taps.

33. **Added expo-haptics type for every haptic event.** Original said "Light impact / Medium impact." Now specifies exact `expo-haptics` method calls.

### Accessibility Changes

34. **Added `accessibilityLabel` examples with actual prop values.** Original said "cards read aloud." Now shows exact prop string with template literal.

35. **Added `AccessibilityInfo.isReduceMotionEnabled()` check.** Original said "when Reduced Motion is enabled." Now specifies the check mechanism and Zustand storage.

36. **Added `allowFontScaling={false}` for fixed-size card stats.** With `adjustsFontSizeToFit` and `minimumFontScale`.

### Color Palette & Typography Changes

37. **Added `constants/colors.ts` TypeScript file contents.** Original had a markdown table of hex values. Now provides the actual exportable TypeScript constants object.

38. **Added `constants/typography.ts` TypeScript file contents.** Font size constants as a TypeScript object.

39. **Added `fontFamily` decision.** System font for UI. Single display font via `expo-font` for card names only.

### Admin Dashboard (New — Entire Section)

40. **Added Part B — Admin / Content Management UI.** This is entirely new. The original document had no admin UI spec. The admin dashboard covers 9 sections:
    - Dashboard overview with live metrics and pending actions.
    - Cards management with approve/reject workflow, batch generation wizard, regenerate, edit stats.
    - Evolution management with live job monitoring, failed job handling, modifier pool editing.
    - Players management with search, player detail, admin actions (grant currency, suspend, reset evolution).
    - Economy management with quest editor, subscription stats, currency circulation tracking.
    - Analytics via embedded PostHog.
    - Settings with editable game config (turn timer, energy thresholds, costs) stored in `game_config` Supabase table.
    - API key status display (no values shown, just connectivity checks).
    - Full card generation pipeline description from owner's perspective (wizard-driven, browser-only, no terminal).

### File Organization Changes

41. **Added complete project directory structure.** Specifies all screen files, component folders, store files, and asset categories as actual file paths.

42. **Specified Expo Router file structure.** All screen files match Expo Router file-based routing conventions.

### Error Handling Changes

43. **Added NetInfo network detection.** `@react-native-community/netinfo` for network loss detection.

44. **Added ToastProvider architecture.** Central provider at root layout with `Toast.show()` API. Eliminates ad-hoc toast implementations.

45. **Added evolution partial failure safety.** Clarified that shard and energy are not consumed until `evolution/confirm` is called in Step 9, making retries safe.

### Navigation Changes

46. **Changed Settings from "gear icon in header" to explicit stack push.** Added `router.push('/settings')` from gear icon `Pressable` in header of any screen.

47. **Added `tabBarStyle: { display: 'none' }` for battle screen.** Makes tab bar hidden during battle without breaking the tab navigator.

48. **Added deep link intent filters.** Specified Expo `app.json` scheme and intent filter patterns.

### Post-Match Results Changes

49. **Added confetti Skia particle burst on victory.** Specified as Skia Canvas burst triggered by `BounceIn` Reanimated entering animation on result header.

50. **Added `router.push('/collection?filter=evolution-ready')` for Evolve Cards button.** Previous version said "goes to Collection filtered to ready cards" without specifying the URL parameter.

---

*Document Version: 2.0*
*Last Updated: 2026-02-16*
*Status: Revised — React Native (Expo) / TypeScript. Admin UI included. All engineering decisions specified. Ready for Claude Code implementation.*

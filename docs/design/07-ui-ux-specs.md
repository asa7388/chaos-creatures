# 07 — UI/UX Specifications

**Chaos Creatures — Mobile Card Game Interface Design**
**Version: 3.0 — Native iOS: Swift + SwiftUI + SpriteKit**

This document is the complete UI/UX specification for engineering implementation. It covers every screen, interaction pattern, animation, and component in the player-facing iOS app AND the owner-facing admin dashboard web application. All iOS component names reference actual SwiftUI types or SpriteKit classes. The admin dashboard is a separate web application and is documented in Part B.

**Design Philosophy:** Clean, stylish, card-game-native. Dark theme default with faction-themed light accents. Think Balatro's clarity, Marvel Snap's speed, Slay the Spire's readability. Every screen serves one primary purpose with minimal navigation friction.

**Depends on:** `00-game-design-master.md`, `01-battle-mechanics.md`, `02-card-data-model.md`

---

## Technology Stack (Non-Negotiable)

These are fixed decisions. Do not use alternatives.

### iOS Game Client

| Layer | Technology | Notes |
|---|---|---|
| UI framework | SwiftUI | All non-battle screens: collection, deck builder, shop, settings, onboarding, profile. iOS 17+ minimum target. |
| Battle scene | SpriteKit (`SKScene`, `SKSpriteNode`, `SKAction`) | Full battlefield rendering, card animations, D20 roll, damage numbers, death, events. |
| Navigation | SwiftUI `NavigationStack` | Stack-based navigation for all screen flows. |
| Tab bar | SwiftUI `TabView` | Five tabs: Home, Collection, Decks, Profile, Shop. |
| Networking | Supabase Swift SDK + `URLSession` | All Supabase calls (auth, data, realtime). Swift Concurrency (`async/await`). |
| Real-time | Supabase Realtime channels | WebSocket match state from Railway game server. |
| Payments | StoreKit 2 (native Apple API) | Subscriptions and one-time IAP. No RevenueCat, no third-party wrappers. |
| Haptics | `UIFeedbackGenerator` (`UIImpactFeedbackGenerator`, `UINotificationFeedbackGenerator`) | Wrapped in a Swift `HapticManager` singleton. |
| Push notifications | Apple Push Notification service (APNs) via Supabase Edge Functions | `UNUserNotificationCenter` for local registration. |
| Analytics | PostHog iOS SDK | All player events. |
| Card art | `AsyncImage` (SwiftUI) | Loads from Cloudflare R2 CDN URL. |
| State management | SwiftUI `@StateObject` / `@EnvironmentObject` / `@Observable` (iOS 17) | No third-party state library. |
| Persistence | `UserDefaults` for preferences, Supabase for all game data | No Core Data in MVP. |
| Orientation lock | `AppDelegate` / `UIViewController` override for portrait lock in battle | `UIInterfaceOrientationMask`. |

### Admin Dashboard (Web Application — Separate)

| Layer | Technology |
|---|---|
| Framework | React + Vite (TypeScript) |
| Deployment | Railway (same project, separate service) |
| Auth | Supabase Auth (email/password, single owner account) |

---

## Part A — Player-Facing iOS App

---

## 1. Screen Inventory

Complete list of all screens with primary purpose and navigation path.

### Core Screens (Tab Bar)

| Screen | Primary Purpose | SwiftUI Navigation |
|--------|----------------|--------------------|
| **Home** | Dashboard and play entry point | `TabView` tab 1 |
| **Collection** | Browse and manage owned cards | `TabView` tab 2 |
| **Decks** | Build and edit decks | `TabView` tab 3 |
| **Profile** | Player stats, achievements, showcase | `TabView` tab 4 |
| **Shop** | Subscriptions, shards, card packs | `TabView` tab 5 |

### Battle Flow Screens

| Screen | Primary Purpose | Navigation Path |
|--------|----------------|-----------------|
| **Mode Selection** | Choose Ranked / Casual / Practice | Home → `NavigationStack` push |
| **Matchmaking** | Queue for match, show opponent | Mode Selection → push |
| **Battle** | Main gameplay (`SKScene`) | Match found → full-screen cover |
| **Post-Match Results** | Results, rewards, XP, evolution-ready cards | Battle end → replace |

### Card Management Screens

| Screen | Primary Purpose | Navigation Path |
|--------|----------------|-----------------|
| **Card Detail** | Full stats, evolution history, actions | Tap any card → `sheet` or push |
| **Evolution Flow** | Multi-step evolution ritual | Card Detail → full-screen `sheet` |
| **Graveyard** | Destroyed cards during battle | Tap avatar in battle → `sheet` over `SKView` |

### Secondary Screens

| Screen | Primary Purpose | Navigation Path |
|--------|----------------|-----------------|
| **Settings** | Account, audio, visual, gameplay | Gear icon → `NavigationStack` push |
| **Achievements** | View achievement progress | Profile → push |
| **Battle Log** | Chronological action history | Side panel in battle → `SKScene` overlay node |
| **Onboarding** | First-time user education | First launch → replaces root |

---

## 2. Navigation Map

```
[App Launch]
    |
    +--> [Onboarding] (first launch — SwiftUI full-screen flow)
    |         |
    |         v
    +--> [TabView — persistent tab bar]
              |
    ┌─────────────────────────────────────────────────────┐
    │              Tab Bar (5 tabs, persistent)           │
    │  [Home]  [Collection]  [Decks]  [Profile]  [Shop]  │
    └─────────────────────────────────────────────────────┘
         |          |           |          |         |
         v          v           v          v         v
      HomeView  CollectionView DecksView ProfileView ShopView
         |          |           |
    NavigationStack NavigationStack NavigationStack
         |          |           |
    ModeSelectView  CardDetailView  DeckBuilderView
         |          |
    MatchmakingView  EvolutionView (full-screen sheet)
         |
    BattleView (full-screen cover, hides tab bar)
    [SKView hosting BattleScene : SKScene]
         |   |
         |   +--> GraveyardSheet (sheet over BattleView)
         |   +--> CardDetailSheet (sheet, read-only battle context)
         |   +--> BattleLogOverlay (SKScene overlay node)
         |
    PostMatchResultsView (replaces BattleView)
         |
         +--> HomeView (Play Again)
         +--> CollectionView?filter=evolutionReady (Evolve Cards)

[Settings] — NavigationStack push from gear icon in any screen toolbar.
```

**Navigation Principles:**

- `TabView` uses `.tabViewStyle(.tabBar)`. The tab bar is hidden during battle by setting `.toolbar(.hidden, for: .tabBar)` on `BattleView`.
- Modal presentations use SwiftUI `.sheet()` or `.fullScreenCover()` modifiers.
- Deep links from push notifications use a `NavigationPath` binding at the root `NavigationStack`.
- All back navigation uses SwiftUI's built-in back button (`.navigationBarBackButtonHidden(false)`). No custom back logic.
- `BattleView` is presented as a `.fullScreenCover` so it truly covers everything including the tab bar.

---

## 3. Battlefield Screen (Detailed)

The most important screen in the game. Presented as a `.fullScreenCover`. It hosts a SwiftUI `BattleView` containing an `SKView` that fills the entire screen and presents `BattleScene : SKScene`. All card rendering and animations happen inside `BattleScene`. HUD overlays (HP bars, phase indicator, timer, mana) are SwiftUI `View`s layered over the `SKView` using a `ZStack`.

Portrait orientation locked on `BattleView` appear via:

```swift
.onAppear {
    AppDelegate.orientationLock = .portrait
    UINavigationController.attemptRotationToDeviceOrientation()
}
.onDisappear {
    AppDelegate.orientationLock = .all
}
```

### 3.1 Layout Specification

```
Screen (390pt wide reference — iPhone 15 Pro, portrait)
┌──────────────────────────────────────────────────────┐  Total: ~844pt
│  OpponentHUDView (SwiftUI overlay)                   │  h: 68pt
│  [Avatar 48x48] [Name] [HPBar] [Instability]         │
│  [HandCount] [DeckCount] [ManaRow x10]               │
├──────────────────────────────────────────────────────┤
│  SpriteKit SKView (BattleScene)                      │  h: fills all
│  ┌────────────────────────────────────────────────┐  │  middle space
│  │  Opponent board: 5 SKSpriteNode card slots     │  │
│  │  [Slot][Slot][Slot][Slot][Slot]                │  │
│  │  ─────── CenterZone ───────────────────────── │  │
│  │  [D20Node]  [PhaseIndicatorNode]               │  │
│  │  [EventOverlayNode — conditional]              │  │
│  │  Player board: 5 SKSpriteNode card slots       │  │
│  │  [Slot][Slot][Slot][Slot][Slot]                │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  PlayerHUDView (SwiftUI overlay)                     │  h: 60pt
│  [Avatar 48x48] [Name] [HPBar] [Instability]         │
│  [TimerBar]                                          │
├──────────────────────────────────────────────────────┤
│  HandScrollView (SwiftUI overlay)                    │  h: 132pt
│  Horizontal ScrollView of CardInHandView items       │
├──────────────────────────────────────────────────────┤
│  BottomControlsView (SwiftUI overlay)                │  h: 56pt
│  [ManaDisplay] [BattleLogButton] [EndTurnButton]     │
└──────────────────────────────────────────────────────┘
  (+ safeAreaInsets.bottom for home indicator)
```

The `ZStack` layout:

```swift
ZStack(alignment: .top) {
    SpriteView(scene: battleScene, options: [.allowsTransparency])
        .ignoresSafeArea()
    VStack(spacing: 0) {
        OpponentHUDView(viewModel: vm)
            .frame(height: 68)
        Spacer() // SpriteKit fills this space
        PlayerHUDView(viewModel: vm)
            .frame(height: 60)
        HandScrollView(viewModel: vm)
            .frame(height: 132)
        BottomControlsView(viewModel: vm)
            .frame(height: 56)
            .padding(.bottom, safeAreaInsets.bottom)
    }
}
```

All SwiftUI overlay heights are fixed `frame(height:)` values. The `SpriteView` expands to fill remaining space via `Spacer()`.

### 3.2 SwiftUI HUD Component Specifications

#### OpponentHUDView and PlayerHUDView

```swift
struct PlayerHUDView: View {
    @ObservedObject var viewModel: BattleViewModel
    var body: some View {
        HStack(spacing: 8) {
            AvatarView(url: viewModel.playerAvatarURL, faction: viewModel.playerFaction)
                .frame(width: 48, height: 48)
                .onTapGesture { viewModel.openGraveyard(.player) }
            VStack(alignment: .leading, spacing: 2) {
                Text(viewModel.playerName).font(.system(size: 13, weight: .bold))
                HPBarView(current: viewModel.playerHP, max: viewModel.playerMaxHP)
                    .frame(height: 20)
            }
            InstabilityView(value: viewModel.playerInstability)
            Spacer()
            ManaRowView(filled: viewModel.playerMana, total: 10)
        }
        .padding(.horizontal, 12)
        .background(Color(hex: "#141414"))
    }
}
```

- **AvatarView**: `AsyncImage` at 48x48pt. Faction-themed border: 3pt stroke matching faction accent color. On tap: opens `GraveyardSheet`.
- **HPBarView**: SwiftUI `GeometryReader` with two `Rectangle` layers. See HPBarView spec below.
- **InstabilityView**: `Text` 18pt bold. Color: `.white` normally, `Color(hex: "#E63946")` if instability >= 15, `Color(hex: "#5BC0EB")` if <= 4.
- **ManaRowView** (player HUD only): `HStack` of 10 `Circle` views, 20pt diameter, 3pt spacing. Filled = faction accent. Empty = `Color(hex: "#2A2A2A")`.

#### HPBarView

```swift
struct HPBarView: View {
    let current: Int
    let max: Int
    @State private var animatedFraction: Double = 1.0
    @State private var flashOpacity: Double = 0.0
    @State private var shakeOffset: CGFloat = 0.0

    var barColor: Color {
        let pct = Double(current) / Double(max)
        if pct > 0.6 { return Color(hex: "#4CAF50") }
        if pct > 0.3 { return Color(hex: "#FFC107") }
        return Color(hex: "#F44336")
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 5)
                    .fill(Color(hex: "#1A1A1A"))
                RoundedRectangle(cornerRadius: 5)
                    .fill(barColor)
                    .frame(width: geo.size.width * animatedFraction)
                    .animation(.easeInOut(duration: 0.3), value: animatedFraction)
                RoundedRectangle(cornerRadius: 5)
                    .fill(Color.white.opacity(flashOpacity))
                Text("\(current)/\(max)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        }
        .offset(x: shakeOffset)
        .onChange(of: current) { newVal in
            animatedFraction = Double(newVal) / Double(max)
            // Damage flash
            withAnimation(.easeOut(duration: 0.08)) { flashOpacity = 0.9 }
            withAnimation(.easeIn(duration: 0.15).delay(0.08)) { flashOpacity = 0 }
            // Shake sequence
            withAnimation(.easeInOut(duration: 0.06)) { shakeOffset = -6 }
            withAnimation(.easeInOut(duration: 0.06).delay(0.06)) { shakeOffset = 6 }
            withAnimation(.easeInOut(duration: 0.06).delay(0.12)) { shakeOffset = -4 }
            withAnimation(.easeInOut(duration: 0.06).delay(0.18)) { shakeOffset = 0 }
        }
    }
}
```

#### TimerBarView

Embedded in `PlayerHUDView`.

```swift
struct TimerBarView: View {
    let totalSeconds: Int
    @State private var secondsRemaining: Int
    @State private var isUrgent: Bool = false
    @State private var pulseOpacity: Double = 1.0

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(hex: "#2A2A2A"))
                RoundedRectangle(cornerRadius: 4)
                    .fill(isUrgent ? Color(hex: "#E63946") : Color(hex: "#4A90E2"))
                    .opacity(pulseOpacity)
                    .frame(width: geo.size.width * (CGFloat(secondsRemaining) / CGFloat(totalSeconds)))
                    .animation(.linear(duration: 1.0), value: secondsRemaining)
                Text(secondsRemaining > 0 ? "\(secondsRemaining)" : "--")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
            }
        }
        .frame(height: 10)
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { _ in
            if secondsRemaining > 0 { secondsRemaining -= 1 }
            if secondsRemaining == 15 && !isUrgent {
                isUrgent = true
                HapticManager.shared.mediumImpact()
                withAnimation(.easeInOut(duration: 0.5).repeatForever(autoreverses: true)) {
                    pulseOpacity = 0.4
                }
            }
        }
    }
}
```

- 60-16s: `Color(hex: "#4A90E2")` (blue), solid.
- 15-0s: `Color(hex: "#E63946")` (red), repeating opacity pulse via `.repeatForever(autoreverses: true)`.
- Opponent's turn: gray `Color(hex: "#3A3A3A")`, no timer, text "--".

#### EndTurnButton

```swift
struct EndTurnButton: View {
    @ObservedObject var vm: BattleViewModel
    @State private var isPressed: Bool = false

    var body: some View {
        Button(action: vm.handleEndTurn) {
            Text(vm.confirmBeforeEndTurn ? "Hold to End" : "END TURN")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.white)
                .frame(width: 100, height: 44)
                .background(backgroundColor)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(borderColor, lineWidth: 2)
                )
                .scaleEffect(isPressed ? 0.95 : 1.0)
                .animation(.easeInOut(duration: 0.1), value: isPressed)
        }
        .disabled(!vm.isPlayerTurn)
        .simultaneousGesture(
            LongPressGesture(minimumDuration: 0.4).onEnded { _ in
                if vm.confirmBeforeEndTurn { vm.handleEndTurn() }
            }
        )
    }

    var backgroundColor: Color {
        if !vm.isPlayerTurn { return Color(hex: "#1A1A1A") }
        if vm.noActionsRemain { return Color(hex: "#1A6A3A") }
        return Color(hex: "#2A2A2A")
    }

    var borderColor: Color {
        if !vm.isPlayerTurn { return .clear }
        return Color(hex: "#4A90E2")
    }
}
```

### 3.3 SpriteKit BattleScene Nodes

`BattleScene : SKScene` manages all in-game node hierarchy.

#### Node Hierarchy

```
BattleScene (SKScene)
├── backgroundNode (SKSpriteNode — faction-themed battlefield art)
├── opponentBoardNode (SKNode)
│   ├── slotNode_0..4 (SKSpriteNode — empty slot frames)
│   │   └── cardNode (BoardCardNode : SKSpriteNode — when occupied)
├── centerZoneNode (SKNode)
│   ├── d20Node (D20Node : SKShapeNode)
│   ├── phaseIndicatorNode (SKNode with SKLabelNode children)
│   └── eventOverlayNode (SKNode — conditionally added)
├── playerBoardNode (SKNode)
│   ├── slotNode_0..4 (SKSpriteNode)
│   │   └── cardNode (BoardCardNode : SKSpriteNode — when occupied)
└── blockLineNode (SKShapeNode — blocker assignment lines)
```

#### BoardCardNode

```swift
class BoardCardNode: SKSpriteNode {
    var cardArtNode: SKSpriteNode      // CDN art texture, top 60% of card
    var statsBarNode: SKSpriteNode     // Dark bg bar, bottom 25%
    var atkLabel: SKLabelNode          // ATK value, left-aligned
    var hpLabel: SKLabelNode           // HP value, right-aligned
    var tauntIconNode: SKSpriteNode?   // Shield icon, top-right, gold tint
    var keywordIconNodes: [SKSpriteNode] // Up to 3 icons, centered above stats
    var glowNode: SKEffectNode         // SKGlowEffect for attunement / selection state
    var tierBadgeNode: SKSpriteNode    // Tier color badge, top-right corner

    // Called when card is selected as attacker
    func setAttackState(_ isAttacking: Bool) {
        let targetColor: UIColor = isAttacking ? UIColor(hex: "#E63946") : .clear
        let colorize = SKAction.colorize(with: targetColor, colorBlendFactor: isAttacking ? 0.6 : 0.0, duration: 0.15)
        glowNode.run(colorize)
    }

    // Called during block assignment hover
    func setBlockHoverState(_ isValid: Bool) {
        let color: UIColor = isValid ? UIColor(hex: "#4CAF50") : UIColor(hex: "#F44336")
        glowNode.run(SKAction.colorize(with: color, colorBlendFactor: 0.5, duration: 0.1))
    }
}
```

Board slot dimensions: 64x90pt each. 5 slots per row. `BoardCardNode` fills slot entirely.

#### D20Node

```swift
class D20Node: SKShapeNode {
    var numberLabel: SKLabelNode

    enum RollState { case idle, rolling, settled(Int, RollResult) }

    func transition(to state: RollState) {
        switch state {
        case .idle:
            numberLabel.text = "--"
            removeAllActions()

        case .rolling:
            // Spin and wobble
            let spin = SKAction.rotate(byAngle: .pi * 4, duration: 0.4)
            let scalePump = SKAction.sequence([
                SKAction.scale(to: 1.15, duration: 0.2),
                SKAction.scale(to: 0.9, duration: 0.2)
            ])
            let group = SKAction.group([spin, scalePump])
            run(SKAction.repeatForever(group), withKey: "rolling")
            numberLabel.text = "?"

        case .settled(let value, let result):
            removeAction(forKey: "rolling")
            numberLabel.text = "\(value)"
            // Color result
            switch result {
            case .order: numberLabel.fontColor = UIColor(hex: "#5BC0EB")
            case .chaos: numberLabel.fontColor = UIColor(hex: "#E63946")
            case .nothing: numberLabel.fontColor = UIColor(hex: "#888888")
            }
            // Settle bounce
            let bounce = SKAction.sequence([
                SKAction.scale(to: 1.0, duration: 0),
                SKAction.scale(to: 1.2, duration: 0.15),
                SKAction.scale(to: 1.0, duration: 0.15)
            ])
            run(bounce)
        }
    }
}
```

- D20 polygon: `SKShapeNode` path drawn as a 20-sided regular polygon, 80pt diameter. Fill: `UIColor(hex: "#1A1A1A")`. Stroke: white, 2pt.
- Roll duration: 1500-2500ms depending on instability value (higher instability = longer roll, building tension).
- On `settled`: settle bounce via `SKAction.scale`.

#### PhaseIndicatorNode

An `SKNode` containing 9 `SKLabelNode` children arranged horizontally.

Phases: "Start", "Roll", "Event", "Draw", "Main", "Attack", "Block", "Combat", "End"

```swift
func updateActivePhase(_ phase: TurnPhase) {
    for (index, labelNode) in phaseLabels.enumerated() {
        let thisPhase = TurnPhase.allCases[index]
        if thisPhase == phase {
            labelNode.fontSize = 12
            labelNode.fontColor = .white
            labelNode.alpha = 1.0
            // Glow pulse
            let glow = SKAction.sequence([
                SKAction.fadeAlpha(to: 0.6, duration: 0.3),
                SKAction.fadeAlpha(to: 1.0, duration: 0.3)
            ])
            labelNode.run(SKAction.repeat(glow, count: 2))
        } else if thisPhase.rawValue < phase.rawValue {
            labelNode.fontSize = 10
            labelNode.fontColor = UIColor(white: 1, alpha: 0.3)
        } else {
            labelNode.fontSize = 10
            labelNode.fontColor = UIColor(white: 1, alpha: 0.2)
        }
    }
}
```

### 3.4 Turn Phase Visual States

| Phase | Active Label | Timer | Board Interaction |
|---|---|---|---|
| Start of Turn | "Start" | Inactive | None |
| Chaos Roll | "Roll" | Inactive | Watch D20 spin |
| Event Resolution | "Event" | Inactive | EventOverlay visible |
| Draw & Gain Mana | "Draw" | Inactive | Card draw animation |
| Main Phase | "Main" | Active (60s), blue | Drag cards from hand |
| Declare Attackers | "Attack" | Active (continues), blue | Tap creatures to toggle attacker |
| Assign Blockers | "Block" | Active (continues), blue | Drag creatures onto attackers |
| Combat Resolution | "Combat" | Inactive | Watch animations |
| End Turn | "End" | Inactive | None |

Phase transitions: `SKAction.fadeOut(withDuration: 0.15)` then `SKAction.fadeIn(withDuration: 0.15)` on the active indicator node.

### 3.5 SpriteKit Combat Animations

All combat animations are `SKAction` sequences on `BoardCardNode` instances within `BattleScene`.

#### Card Play (Hand to Board)

```swift
func animateCardPlay(cardNode: BoardCardNode, fromPosition: CGPoint, toSlot: CGPoint) {
    cardNode.position = fromPosition
    cardNode.setScale(1.3)
    cardNode.alpha = 0.0
    addChild(cardNode)

    let sequence = SKAction.sequence([
        SKAction.group([
            SKAction.fadeIn(withDuration: 0.15),
            SKAction.scale(to: 1.0, duration: 0.15)
        ]),
        SKAction.move(to: toSlot, duration: 0.3),  // easeOut curve
        SKAction.scale(to: 1.05, duration: 0.08),
        SKAction.scale(to: 1.0, duration: 0.08)
    ])
    cardNode.run(sequence)
    // Haptic on land
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
        HapticManager.shared.lightImpact()
    }
}
```

Duration: 450ms total.

#### Attacker Declaration Glow

```swift
func animateAttackerSelected(_ cardNode: BoardCardNode) {
    let glowIn = SKAction.sequence([
        SKAction.colorize(with: UIColor(hex: "#E63946"), colorBlendFactor: 0.5, duration: 0.2),
        SKAction.colorize(with: UIColor(hex: "#E63946"), colorBlendFactor: 0.3, duration: 0.3)
    ])
    let pulse = SKAction.sequence([
        SKAction.colorize(with: UIColor(hex: "#E63946"), colorBlendFactor: 0.5, duration: 0.4),
        SKAction.colorize(with: UIColor(hex: "#E63946"), colorBlendFactor: 0.25, duration: 0.4)
    ])
    cardNode.run(SKAction.sequence([glowIn, SKAction.repeatForever(pulse)]), withKey: "attackerGlow")

    // Sword icon node above card
    let swordIcon = SKSpriteNode(imageNamed: "icon_attack_sword")
    swordIcon.position = CGPoint(x: cardNode.position.x, y: cardNode.position.y + 50)
    swordIcon.alpha = 0
    swordIcon.setScale(0.5)
    addChild(swordIcon)
    swordIcon.run(SKAction.group([
        SKAction.fadeIn(withDuration: 0.2),
        SKAction.scale(to: 1.0, duration: 0.2)
    ]))
}
```

If opponent has Taunt creature: a `SKLabelNode` banner slides in from the bottom of the scene ("Taunt forces your attack.") using `SKAction.move(to:duration:)`. Player cannot deselect attackers while Taunt banner is visible. Taunt creature's slot has a `SKAction.repeatForever` gold border pulse via an overlay `SKShapeNode`.

#### Blocker Assignment Drag

Drag interaction is handled in `BattleScene.touchesMoved(_:with:)`.

1. `touchesBegan`: identify touched `BoardCardNode` in player board during Block phase. Begin tracking.
2. `touchesMoved`: move the node to follow touch position. Scale: 1.15x via `SKAction.scale(to:duration:)` (0.1s). Evaluate overlap with opponent slot nodes each frame.
3. Overlap detection: `cardNode.frame.intersects(slotNode.frame)`. If valid target: set slot border overlay to green (`UIColor(hex: "#4CAF50")`). If invalid target: flash red.
4. `touchesEnded` over valid attacker slot: call `gameViewModel.assignBlocker(myCreature, attacker)`. Draw a block line via `SKShapeNode` path from blocker position to attacker position (yellow, 2pt stroke). Haptic: `HapticManager.shared.mediumImpact()`.
5. `touchesEnded` over invalid zone: `SKAction.move(to: originalPosition, duration: 0.25)` with `.easeOut` timing mode. Haptic: `HapticManager.shared.errorNotification()`.
6. Taunt creature auto-block: assigned automatically when Block phase begins. Block line drawn. Touch events on the Taunt card node return immediately without processing (`.isUserInteractionEnabled = false` on that node). A banner: "Your Taunt creature must block."

#### Damage Numbers

Spawned by `BattleScene` on receiving `combat_result` from game server via Supabase Realtime.

```swift
func spawnDamageNumber(_ amount: Int, at position: CGPoint, type: DamageType) {
    let label = SKLabelNode(fontNamed: "AvenirNext-Heavy")
    label.text = type == .heal ? "+\(amount)" : "-\(amount)"
    label.fontSize = type == .lethal ? 28 : 22
    label.fontColor = type == .heal ? UIColor(hex: "#4CAF50") : UIColor(hex: "#F44336")
    label.position = position
    label.zPosition = 100
    addChild(label)

    let floatUp = SKAction.moveBy(x: 0, y: 50, duration: 0.8)
    floatUp.timingMode = .easeOut
    let fadeOut = SKAction.fadeOut(withDuration: 0.4)
    let sequence = SKAction.sequence([
        SKAction.group([floatUp, SKAction.sequence([
            SKAction.wait(forDuration: 0.4),
            fadeOut
        ])]),
        SKAction.removeFromParent()
    ])

    if type == .lethal {
        // Scale pulse for killing blow
        let pulse = SKAction.sequence([
            SKAction.scale(to: 1.4, duration: 0.1),
            SKAction.scale(to: 1.0, duration: 0.1)
        ])
        label.run(SKAction.sequence([pulse, sequence]))
    } else {
        label.run(sequence)
    }
}
```

Piercing damage: two `spawnDamageNumber` calls fire simultaneously — one at blocker position, one offset toward the opponent avatar position.

#### Death Animation

```swift
func animateCreatureDeath(_ cardNode: BoardCardNode) {
    let faction = cardNode.faction

    // 1. Screen flash
    let flashNode = SKSpriteNode(color: UIColor(hex: "#FFFFFF"), size: self.size)
    flashNode.position = CGPoint(x: size.width / 2, y: size.height / 2)
    flashNode.alpha = 0
    flashNode.zPosition = 200
    addChild(flashNode)
    flashNode.run(SKAction.sequence([
        SKAction.fadeAlpha(to: 0.35, duration: 0.06),
        SKAction.fadeOut(withDuration: 0.12),
        SKAction.removeFromParent()
    ]))

    // 2. Card shatter — fade + shrink
    let shatter = SKAction.sequence([
        SKAction.group([
            SKAction.fadeOut(withDuration: 0.35),
            SKAction.scale(to: 0.7, duration: 0.35),
            SKAction.rotate(byAngle: .pi / 8, duration: 0.35)
        ]),
        SKAction.removeFromParent()
    ])
    cardNode.run(shatter)

    // 3. Faction-specific particles (SKEmitterNode)
    let emitterName: String
    switch faction {
    case .ironwright: emitterName = "DeathEmitter_Ironwright"  // gear/spark particles
    case .feyCourts:  emitterName = "DeathEmitter_FeyCourts"   // leaf/petal burst
    case .demonic:    emitterName = "DeathEmitter_Demonic"     // ember/smoke
    }
    if let emitter = SKEmitterNode(fileNamed: emitterName) {
        emitter.position = cardNode.position
        emitter.zPosition = 99
        addChild(emitter)
        emitter.run(SKAction.sequence([
            SKAction.wait(forDuration: 1.2),
            SKAction.removeFromParent()
        ]))
    }

    // 4. Graveyard thumbnail fly-out
    let thumb = SKSpriteNode(texture: cardNode.cardArtNode.texture)
    thumb.size = CGSize(width: 24, height: 34)
    thumb.position = cardNode.position
    addChild(thumb)
    let avatarPos = cardNode.isPlayerCard ? playerAvatarScenePosition : opponentAvatarScenePosition
    thumb.run(SKAction.sequence([
        SKAction.move(to: avatarPos, duration: 0.5),
        SKAction.removeFromParent()
    ]))

    HapticManager.shared.heavyImpact()
}
```

Total duration: 1200ms minimum. Slot is not interactive until `cardNode.removeFromParent()` completes.

#### Spell Cast Animation

```swift
func animateSpellCast(cardNode: SKSpriteNode, targetPosition: CGPoint?) {
    let center = CGPoint(x: size.width / 2, y: size.height / 2)

    // 1. Enlarge to center
    let moveCenter = SKAction.move(to: center, duration: 0.3)
    moveCenter.timingMode = .easeOut
    let scaleUp = SKAction.scale(to: 1.4, duration: 0.3)
    cardNode.run(SKAction.group([moveCenter, scaleUp]))

    // 2. Spell name pulse
    let nameLabel = SKLabelNode(text: cardNode.cardName)
    nameLabel.position = center
    nameLabel.fontSize = 20
    nameLabel.fontColor = .white
    nameLabel.zPosition = 150
    addChild(nameLabel)
    nameLabel.run(SKAction.sequence([
        SKAction.scale(to: 1.2, duration: 0.15),
        SKAction.scale(to: 1.0, duration: 0.15),
        SKAction.wait(forDuration: 0.5),
        SKAction.fadeOut(withDuration: 0.2),
        SKAction.removeFromParent()
    ]))

    // 3. Effect burst toward target
    if let target = targetPosition {
        spawnSpellParticles(from: center, to: target)
    }

    // 4. Card dissolve
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
        cardNode.run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.25),
            SKAction.removeFromParent()
        ]))
    }
}
```

Targeting spells: valid targets get a green `SKShapeNode` border overlay pulsed via `SKAction.repeatForever`. Tap target: overlay removed, spell resolves. Tap elsewhere or tap spell card again: cancel (card returns to hand via `SKAction.move`).

#### Chaos Roll Animation (Full Sequence)

```swift
func animateChaosRoll(result: Int, rollResult: RollResult) {
    // 1. Phase transitions to "Roll"
    phaseIndicatorNode.updateActivePhase(.chaosRoll)

    // 2. D20 begins spinning
    d20Node.transition(to: .rolling)
    HapticManager.shared.lightImpact()

    // Duration based on instability — higher = longer tension
    let rollDuration = TimeInterval(1.5 + (Double(currentInstability) / 20.0))

    DispatchQueue.main.asyncAfter(deadline: .now() + rollDuration) {
        // 3. D20 settles, shows result number
        self.d20Node.transition(to: .settled(result, rollResult))
        HapticManager.shared.mediumImpact()

        // 4. If event triggered, show EventOverlayNode after 600ms
        if rollResult != .nothing {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                self.showEventOverlay(for: rollResult)
            }
        }
    }
}
```

#### EventOverlayNode

An `SKNode` added to `BattleScene` centered over the `centerZoneNode`.

```swift
func showEventOverlay(for result: RollResult) {
    let overlay = EventOverlayNode(result: result, eventData: currentEventData)
    overlay.position = CGPoint(x: size.width / 2, y: size.height / 2)
    overlay.alpha = 0
    overlay.setScale(0.85)
    addChild(overlay)

    // Slide in + scale up
    overlay.run(SKAction.group([
        SKAction.fadeIn(withDuration: 0.3),
        SKAction.scale(to: 1.0, duration: 0.3)
    ]))

    // Highlight affected creatures
    for creatureId in currentEventData.affectedCreatureIds {
        if let node = findBoardCardNode(id: creatureId) {
            let highlightColor: UIColor = result == .order ?
                UIColor(hex: "#5BC0EB") : UIColor(hex: "#E63946")
            let pulse = SKAction.sequence([
                SKAction.colorize(with: highlightColor, colorBlendFactor: 0.6, duration: 0.3),
                SKAction.colorize(with: .clear, colorBlendFactor: 0.0, duration: 0.3)
            ])
            node.run(SKAction.repeat(pulse, count: 3))
        }
    }

    // Auto-dismiss after 2500ms
    overlay.run(SKAction.sequence([
        SKAction.wait(forDuration: 2.5),
        SKAction.group([
            SKAction.fadeOut(withDuration: 0.3),
            SKAction.scale(to: 0.85, duration: 0.3)
        ]),
        SKAction.removeFromParent()
    ]))
}
```

`EventOverlayNode` internal layout (child `SKNode`s):
- Background: `SKShapeNode` rounded rect 280x180pt. Fill: `UIColor(white: 0.08, alpha: 0.96)`. Stroke: Order = `UIColor(hex: "#5BC0EB")`, Chaos = `UIColor(hex: "#E63946")`, 1.5pt.
- Event icon: `SKSpriteNode` 40x40pt.
- Event name: `SKLabelNode` 18pt bold, white.
- Effect description: `SKLabelNode` 13pt, gray, multiline via `numberOfLines`.
- Trigger type badge: small `SKLabelNode` 12pt.

Tap anywhere on overlay: `touchesBegan` on overlay node calls `dismiss()` immediately.

### 3.6 Taunt Indicators

- Taunt icon (`SKSpriteNode`, shield image, 14x14pt, gold tint `UIColor(hex: "#FFD700")`) positioned at `BoardCardNode` top-right (absolute offset from card center).
- Pulse animation: `SKAction.repeatForever(SKAction.sequence([SKAction.scale(to: 1.3, duration: 0.75), SKAction.scale(to: 1.0, duration: 0.75)]))` on the icon node. Runs while Taunt creature is on board.

**Attack phase with opponent Taunt:**
- An `SKSpriteNode` banner (280x52pt) slides up from bottom of scene: `SKAction.move(from: offscreen, to: visible, duration: 0.3)`. Text: "Taunt creature forces your attack." Background: `UIColor(hex: "#FFD700", alpha: 0.15)`. Border: gold 1.5pt. Auto-dismisses after 2000ms.
- All eligible attacker nodes auto-receive red glow. `isUserInteractionEnabled = false` on deselect logic.

**Block phase with player Taunt:**
- Taunt creature pre-assigned to block first declared attacker. Block line drawn automatically via `SKShapeNode`.
- Banner: "Your Taunt creature must block." Same styling.

### 3.7 Battle Log (SpriteKit Overlay)

Trigger: tap `BattleLogButton` in `BottomControlsView`.

Implementation: `BattleLogOverlay` is an `SKNode` added to `BattleScene`. It slides in from the left edge.

```swift
func showBattleLog() {
    logOverlay.removeAllActions()
    logOverlay.run(SKAction.moveTo(x: 140, duration: 0.3))  // 280pt panel center
    // Timing: .easeOut
}

func hideBattleLog() {
    logOverlay.run(SKAction.moveTo(x: -140, duration: 0.25))
}
```

Panel dimensions: 280pt wide, full scene height. Background: `SKSpriteNode` with `UIColor(hex: "#141414")`.

Log entries: `SKLabelNode` rows, 12pt, colored by type: Order `#5BC0EB`, Chaos `#E63946`, Damage `#FF7043`, Heal `#4CAF50`, Card played `#FFFFFF`. Entries scroll using `SKAction.moveBy` on the content node when new entries are added.

Tap dark overlay area to dismiss.

### 3.8 Graveyard (SwiftUI Sheet)

Triggered by tapping player or opponent avatar. Presented as a SwiftUI `.sheet` over the `BattleView`.

```swift
struct GraveyardSheet: View {
    let owner: GraveyardOwner
    @ObservedObject var vm: BattleViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text(owner == .player ? "Your Graveyard" : "\(vm.opponentName)'s Graveyard")
                    .font(.system(size: 18, weight: .bold))
                Spacer()
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(Color(hex: "#888888"))
                }
                .frame(width: 44, height: 44)
            }
            .padding()

            Picker("Sort", selection: $vm.graveyardSort) {
                Text("Newest").tag(GraveyardSort.newest)
                Text("By Cost").tag(GraveyardSort.byCost)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            LazyVGrid(columns: [
                GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())
            ], spacing: 8) {
                ForEach(vm.graveyardCards(for: owner)) { card in
                    CardThumbnailView(card: card)
                        .frame(height: 140)
                        .onTapGesture { vm.selectedCardDetail = card }
                }
            }
            .padding()
        }
        .background(Color(hex: "#1A1A1A"))
        .presentationDetents([.large])
    }
}
```

---

## 4. Evolution Screen (Detailed)

Presented as a `.fullScreenCover` from `CardDetailView`. Portrait orientation locked (same mechanism as battle screen).

The evolution flow is a state machine in `EvolutionViewModel`. States:

```swift
enum EvolutionStep {
    case presentation
    case channelSelection
    case generating(jobId: String)
    case artReveal(artURL: URL)
    case nameSelection(options: [String])
    case abilityReveal(ability: NewAbility)
    case modifierSelection(options: [ModifierOption])
    case flavorReveal(text: String)
    case confirm(card: EvolvedCardPreview)
}
```

All step transitions use:

```swift
withAnimation(.easeInOut(duration: 0.3)) {
    currentStep = newStep
}
```

### 4.1 Evolution Flow Overview

```
[Card Detail → "Evolve" tapped]
    |
    v
Step 1: Card Presentation & History
    |
    v
Step 2: Channel Selection (Order / Chaos)
    — FLUX API call fires here, returns evolutionJobId
    |
    v
Step 3: Evolution Animation + AI Art Generation (loading)
    — Client polls /evolution/status/{jobId} every 500ms
    |
    v
Step 4: Art Reveal (dramatic unveil)
    |
    v
Step 5: Name Selection (2-3 GPT-4o Mini suggestions)
    |
    v
Step 6: New Ability Reveal
    |
    v
Step 7: Modifier Selection (2/3/4 options by subscription tier)
    |
    v
Step 8: Flavor Text Reveal (typewriter)
    |
    v
Step 9: Final Card Presentation & Confirm
    |
    v
[Collection — card updated, evolution/confirm called]
```

### 4.2 Step-by-Step Specifications

#### Step 1: Card Presentation & History

```swift
struct EvolutionStep1View: View {
    let card: CardInstance
    @Binding var currentStep: EvolutionStep

    var body: some View {
        VStack(spacing: 20) {
            AsyncImage(url: card.artURL) { image in
                image.resizable().aspectRatio(5/7, contentMode: .fit)
            } placeholder: { CardArtPlaceholder() }
            .frame(width: 240)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(tierColor(card.tier), lineWidth: 3)
            )

            HStack(spacing: 24) {
                StatBadge(label: "ATK", value: "\(card.atk)")
                StatBadge(label: "HP", value: "\(card.hp)")
                StatBadge(label: "CM", value: "\(card.manaCost)")
                StatBadge(label: "INS", value: "\(card.instability)")
            }

            EnergyProgressView(current: card.evolutionEnergy, required: card.nextThreshold)

            ShardRequirementView(tier: card.nextEvolutionTier)

            EvolutionTimelineView(history: card.evolutionHistory)
                .frame(height: 60)

            Button("Begin Evolution") {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                    currentStep = .channelSelection
                }
            }
            .frame(width: 200, height: 52)
            .background(Color(hex: "#4A90E2"))
            .cornerRadius(10)
            .foregroundColor(.white)
            .font(.system(size: 16, weight: .bold))
            .scaleEffect(pulseScale)
            .onAppear {
                withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                    pulseScale = 1.03
                }
            }
        }
        .padding()
    }
    @State private var pulseScale: CGFloat = 1.0
}
```

#### Step 2: Channel Selection (Order / Chaos)

```swift
struct EvolutionStep2View: View {
    @ObservedObject var vm: EvolutionViewModel

    var body: some View {
        VStack(spacing: 20) {
            Text("This influences the new ability and modifier attunement.")
                .font(.system(size: 13))
                .foregroundColor(Color(hex: "#888888"))

            ChannelOptionView(
                direction: .order,
                gradient: [Color(hex: "#0D47A1"), Color(hex: "#1976D2")],
                label: "Channel toward Order",
                probability: "70% Order, 30% Chaos",
                flavor: "Stabilize and harmonize"
            ) {
                vm.selectChannel(.order)
            }
            .opacity(vm.selectedChannel == .chaos ? 0.3 : 1.0)
            .scaleEffect(vm.selectedChannel == .order ? 1.04 : 1.0)

            ChannelOptionView(
                direction: .chaos,
                gradient: [Color(hex: "#B71C1C"), Color(hex: "#E53935")],
                label: "Channel toward Chaos",
                probability: "70% Chaos, 30% Order",
                flavor: "Unleash the unpredictable"
            ) {
                vm.selectChannel(.chaos)
            }
            .opacity(vm.selectedChannel == .order ? 0.3 : 1.0)
            .scaleEffect(vm.selectedChannel == .chaos ? 1.04 : 1.0)
        }
        .animation(.easeInOut(duration: 0.3), value: vm.selectedChannel)
        .padding()
    }
}
```

On selection: `vm.selectChannel(_:)` calls `evolution/start` Supabase Edge Function with `{ cardInstanceId, direction }`. Server returns `evolutionJobId`. After 600ms SwiftUI animation completes, transition to Step 3.

#### Step 3: Evolution Animation (SpriteKit Loading Screen)

Step 3 renders a dedicated `SpriteView(scene: evolutionLoadingScene)` full-screen.

`EvolutionLoadingScene : SKScene` sequence:

```swift
// Phase 1 (0-800ms): Card dissolves
func phase1CardDissolve() {
    let cardNode = self.currentCardNode
    cardNode.run(SKAction.group([
        SKAction.fadeOut(withDuration: 0.5),
        SKAction.scale(to: 1.3, duration: 0.5)
    ]))
    spawnDissolveParticles(count: 30, color: channelColor, from: center)
}

// Phase 2 (800-1200ms): Shard materializes
func phase2ShardMaterialize() {
    shardNode.alpha = 0
    shardNode.setScale(0.5)
    shardNode.run(SKAction.group([
        SKAction.fadeIn(withDuration: 0.4),
        SKAction.scale(to: 1.0, duration: 0.4)
    ]))
    let spin = SKAction.rotate(byAngle: .pi * 2, duration: 2.0)
    spin.timingMode = .linear
    shardNode.run(SKAction.repeatForever(spin), withKey: "shardSpin")
}

// Phase 3 (1200ms+): Particle orbit loop — runs until FLUX complete
func phase3OrbitLoop() {
    for (index, particle) in orbitParticles.enumerated() {
        let orbitAction = orbitParticleAction(
            radius: 60,
            speed: channelDirection == .order ? 2.0 : 1.5,
            perturbation: channelDirection == .chaos ? 8.0 : 0.0,
            phase: Double(index) * (2 * .pi / Double(orbitParticles.count))
        )
        particle.run(SKAction.repeatForever(orbitAction))
    }
    // "Channeling energy..." label fades in after 3s if still waiting
    run(SKAction.sequence([
        SKAction.wait(forDuration: 3.0),
        SKAction.run { self.channelingLabel.run(SKAction.fadeIn(withDuration: 0.5)) }
    ]))
}

// Called when FLUX job completes
func phase4ShardCracks(completion: @escaping () -> Void) {
    // Shard splits
    leftHalf.run(SKAction.moveBy(x: -40, y: 0, duration: 0.3))
    rightHalf.run(SKAction.moveBy(x: 40, y: 0, duration: 0.3))
    // Full-screen white flash
    let flash = flashNode
    flash.run(SKAction.sequence([
        SKAction.fadeAlpha(to: 0.9, duration: 0.15),
        SKAction.fadeOut(withDuration: 0.15),
        SKAction.run { completion() }
    ]))
}
```

Particle orbit: Order = smooth circular path at constant speed. Chaos = circular path with random `CGFloat.random(in: -8...8)` perturbation added to x/y each frame via `SKAction.customAction`.

Minimum animation time: 2500ms even if FLUX responds faster (held in `EvolutionViewModel`).

Polling: `Task` in `EvolutionViewModel` calls `GET /evolution/status/{jobId}` every 500ms using `URLSession`. On `completed`: call `phase4ShardCracks`, then transition to `.artReveal(artURL:)` step.

Timeout at 10s: show error `Alert`. Server refunds shard and energy via `evolution/cancel` Edge Function. PostHog event: `evolution_flux_timeout`.

#### Step 4: Art Reveal (Dramatic Unveil)

```swift
struct ArtRevealView: View {
    let artURL: URL
    let tier: EvolutionTier
    @State private var revealProgress: CGFloat = 0.0
    @State private var tierBadgeScale: CGFloat = 0.0
    @State private var showContinue: Bool = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            AsyncImage(url: artURL) { image in
                image.resizable()
                    .aspectRatio(5/7, contentMode: .fit)
                    .frame(width: 260)
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(tierColor(tier), lineWidth: 3)
                    )
                    // Iris wipe: mask using a radial gradient
                    .mask(
                        RadialGradient(
                            gradient: Gradient(stops: [
                                .init(color: .black, location: revealProgress * 1.2),
                                .init(color: .clear, location: revealProgress * 1.2 + 0.05)
                            ]),
                            center: .center,
                            startRadius: 0,
                            endRadius: 300
                        )
                    )
            } placeholder: { ProgressView() }

            // Tier badge bounces in when reveal completes
            if revealProgress > 0.95 {
                TierBadgeView(tier: tier)
                    .scaleEffect(tierBadgeScale)
                    .onAppear {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.5)) {
                            tierBadgeScale = 1.0
                        }
                    }
            }

            if showContinue {
                Text("Tap to continue")
                    .font(.system(size: 14))
                    .foregroundColor(Color(hex: "#888888"))
                    .transition(.opacity)
                    .padding(.top, 420)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.2)) {
                revealProgress = 1.0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                withAnimation { showContinue = true }
            }
        }
        .onTapGesture { /* advance to name selection */ }
    }
}
```

The iris wipe uses a SwiftUI `RadialGradient` mask whose stop locations are driven by `revealProgress` animated via `.easeOut(duration: 1.2)`. Starts fully opaque center (hidden), expands outward to fully reveal.

#### Step 5: Name Selection

```swift
struct NameSelectionView: View {
    let options: [String]
    let oldName: String
    @Binding var selectedName: String?

    var body: some View {
        VStack(spacing: 20) {
            Text(oldName)
                .font(.system(size: 18))
                .strikethrough()
                .opacity(0.5)
                .foregroundColor(.white)

            ForEach(options, id: \.self) { name in
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedName = name
                    }
                }) {
                    Text(name)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 300, height: 52)
                        .background(Color(hex: "#1A1A1A"))
                        .cornerRadius(10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(selectedName == name ?
                                    Color(hex: "#FFD700") : Color(hex: "#3A3A3A"),
                                    lineWidth: 1.5)
                        )
                        .opacity(selectedName != nil && selectedName != name ? 0.4 : 1.0)
                }
            }
        }
        .padding()
        .onChange(of: selectedName) { _ in
            // Auto-advance to Step 6 after 500ms
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                // viewModel.advanceToAbilityReveal()
            }
        }
    }
}
```

#### Step 6: New Ability Reveal

```swift
struct AbilityRevealView: View {
    let ability: NewAbility
    @State private var slideIn: Bool = false

    var body: some View {
        VStack(spacing: 20) {
            // Small card art above
            // ...

            VStack(spacing: 8) {
                HStack {
                    Image(abilityTriggerIcon(ability.trigger))
                        .resizable().frame(width: 36, height: 36)
                        .scaleEffect(slideIn ? 1.0 : 0.5)
                    Spacer()
                    Text(ability.trigger == .order ? "Order Trigger" : "Chaos Trigger")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(ability.trigger == .order ?
                            Color(hex: "#5BC0EB") : Color(hex: "#E63946"))
                }
                Text(ability.name)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(.white)
                Text(ability.description)
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#B0B0B0"))
                    .multilineTextAlignment(.center)
            }
            .padding(16)
            .frame(width: 300)
            .background(
                LinearGradient(
                    colors: ability.trigger == .order ?
                        [Color(hex: "#0D2A5E"), Color(hex: "#1040A0")] :
                        [Color(hex: "#5E0D0D"), Color(hex: "#A01010")],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
            )
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(ability.trigger == .order ?
                        Color(hex: "#5BC0EB") : Color(hex: "#E63946"),
                        lineWidth: 2)
            )
            .offset(x: slideIn ? 0 : 400)
            .animation(.spring(response: 0.5, dampingFraction: 0.7), value: slideIn)
        }
        .onAppear {
            withAnimation { slideIn = true }
            withAnimation(.easeInOut(duration: 0.2).delay(0.5).repeatCount(1)) {
                // icon pulse handled separately
            }
        }
    }
}
```

#### Step 7: Modifier Selection

```swift
struct ModifierSelectionView: View {
    let options: [ModifierOption]  // 2, 3, or 4 based on subscription tier
    @Binding var selected: ModifierOption?

    var body: some View {
        VStack(spacing: 12) {
            Text("Choose a Modifier")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.white)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(options) { option in
                        ModifierCardView(option: option, isSelected: selected?.id == option.id)
                            .frame(width: 250, height: 180)
                            .opacity(selected != nil && selected?.id != option.id ? 0.3 : 1.0)
                            .onTapGesture {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    selected = option
                                }
                            }
                    }
                }
                .padding(.horizontal)
            }

            if selected != nil {
                Button("Confirm Modifier") { /* advance to flavor */ }
                    .frame(width: 200, height: 52)
                    .background(Color(hex: "#FFD700"))
                    .foregroundColor(.black)
                    .font(.system(size: 15, weight: .bold))
                    .cornerRadius(10)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: selected?.id)
    }
}
```

`ModifierCardView` contents:
- Modifier name `Text` 15pt bold.
- Attunement icon `Image` 20x20pt, right-aligned.
- Base effect: `Text` "Always: +1 ATK" 13pt white.
- Attuned bonus: `Text` color `#5BC0EB` (Order) or `#E63946` (Chaos).
- Penalty if any: `Text` `#F44336`.
- Faction badge pill + tier badge.
- PP cost: 11pt gray, bottom-right.

Tier composition (subscription):
- Free: 1 universal + 1 faction-exclusive (2 total).
- Mid: 1 universal + 2 faction-exclusive (3 total).
- Top: 2 universal + 2 faction-exclusive (4 total).

On confirm: `withAnimation(.spring(response: 0.5, dampingFraction: 0.7))` slides modifier card toward the card art position while shrinking to icon size.

#### Step 8: Flavor Text Reveal

```swift
struct FlavorRevealView: View {
    let fullText: String
    @State private var displayedText: String = ""
    @State private var charIndex: Int = 0

    var body: some View {
        VStack(spacing: 20) {
            // Evolved card display (200x280pt)

            VStack {
                Text("\"\(displayedText)\"")
                    .font(.system(size: 14, style: .italic))
                    .foregroundColor(Color(hex: "#B0B0B0"))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 320, minHeight: 80)
            }
            .padding()
            .background(Color.black.opacity(0.8))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(factionAccentColor, lineWidth: 1.5)
            )
        }
        .onAppear { startTyping() }
        .onTapGesture {
            // Tap: complete instantly
            charIndex = fullText.count
            displayedText = fullText
            timer?.invalidate()
        }
    }

    func startTyping() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.04, repeats: true) { t in
            if charIndex < fullText.count {
                let idx = fullText.index(fullText.startIndex, offsetBy: charIndex)
                displayedText.append(fullText[idx])
                charIndex += 1
            } else {
                t.invalidate()
                // Auto-advance after 1.5s pause
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    // viewModel.advanceToConfirm()
                }
            }
        }
    }
    @State private var timer: Timer? = nil
}
```

#### Step 9: Final Card Presentation & Confirm

Large card display (280x392pt) showing all new stats. Below it, `EvolutionSummaryView`:

```swift
struct EvolutionSummaryView: View {
    let summary: EvolutionSummary
    @ObservedObject var vm: EvolutionViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Evolution Complete!")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(Color(hex: "#FFD700"))
            HStack {
                Text("Stats:").foregroundColor(Color(hex: "#888888"))
                Text("\(summary.oldAtk)/\(summary.oldHp) → \(summary.newAtk)/\(summary.newHp)")
                    .foregroundColor(Color(hex: "#4CAF50"))
                    .font(.system(size: 16, weight: .bold))
            }
            HStack {
                Text("Instability:").foregroundColor(Color(hex: "#888888"))
                let delta = summary.newInstability - summary.oldInstability
                Text("\(summary.oldInstability) → \(summary.newInstability)")
                    .foregroundColor(delta > 0 ? Color(hex: "#F44336") : Color(hex: "#5BC0EB"))
            }
            Text("New ability: \(summary.newAbilityName)")
                .font(.system(size: 14))
                .foregroundColor(.white)
            Text("New modifier: \(summary.modifierName)")
                .font(.system(size: 14))
                .foregroundColor(.white)
        }
        .padding()
        .background(Color(hex: "#141414"))
        .cornerRadius(12)
    }
}
```

Buttons:
- "Save & Continue": calls `evolution/confirm` Supabase Edge Function. On success: dismiss `.fullScreenCover` to collection.
- "Share": uses `UIActivityViewController` via `ShareLink` (SwiftUI) to share a screenshot captured with `ImageRenderer` (SwiftUI, iOS 16+) of the card view + summary panel. Watermark "Chaos Creatures" overlay on rendered image.

### 4.3 Art Generation Loading State

- FLUX typically responds in 2-4 seconds.
- Minimum animation play time: 2500ms.
- "Channeling energy..." `SKLabelNode` fades in at 3000ms if still waiting.
- Timeout at 10000ms: `Alert` presented over `SpriteView`. Server refunds. PostHog event: `evolution_flux_timeout`.

---

## 5. Collection & Deck Builder

### 5.1 Collection Screen

Tab 2 of `TabView`. `NavigationStack` root view.

```swift
struct CollectionView: View {
    @StateObject var vm = CollectionViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                FactionTabBar(selected: $vm.selectedFaction)
                    .frame(height: 48)
                FilterBar(vm: vm)
                    .frame(height: 48)
                cardGridOrEmpty
            }
            .background(Color(hex: "#0D0D0D"))
            .navigationTitle("Collection")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: SettingsView()) {
                        Image(systemName: "gearshape")
                    }
                }
            }
        }
    }

    @ViewBuilder
    var cardGridOrEmpty: some View {
        if vm.cards.isEmpty {
            CollectionEmptyState(faction: vm.selectedFaction)
        } else {
            CollectionGridView(cards: vm.cards, vm: vm)
        }
    }
}
```

#### FactionTabBar

```swift
struct FactionTabBar: View {
    @Binding var selected: FactionFilter
    let factions: [FactionFilter] = [.all, .ironwright, .feyCourts, .demonic]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(factions, id: \.self) { faction in
                    Button(action: {
                        withAnimation(.easeInOut(duration: 0.2)) { selected = faction }
                    }) {
                        VStack(spacing: 4) {
                            HStack(spacing: 6) {
                                if faction != .all {
                                    Image(factionIconName(faction))
                                        .resizable().frame(width: 18, height: 18)
                                }
                                Text(factionLabel(faction))
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(selected == faction ? .white : Color(hex: "#888888"))
                            }
                            Rectangle()
                                .fill(selected == faction ? factionAccentColor(faction) : Color.clear)
                                .frame(height: 3)
                                .cornerRadius(1.5)
                        }
                        .frame(minWidth: 80)
                    }
                }
            }
        }
        .background(Color(hex: "#141414"))
    }
}
```

#### Filter Bar

```swift
struct FilterBar: View {
    @ObservedObject var vm: CollectionViewModel
    @State private var showFilter = false
    @State private var showSearch = false

    var body: some View {
        HStack(spacing: 8) {
            Button(action: { showFilter = true }) {
                Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                    .font(.system(size: 13))
            }
            .buttonStyle(.bordered)

            Spacer()

            if showSearch {
                TextField("Search cards...", text: $vm.searchQuery)
                    .textFieldStyle(.roundedBorder)
                    .frame(maxWidth: 200)
                    .transition(.move(edge: .trailing).combined(with: .opacity))
                    .submitLabel(.search)
            }

            Button(action: {
                withAnimation(.easeInOut(duration: 0.2)) { showSearch.toggle() }
            }) {
                Image(systemName: "magnifyingglass")
            }
        }
        .padding(.horizontal, 12)
        .background(Color(hex: "#0D0D0D"))
        .sheet(isPresented: $showFilter) { FilterPanelView(vm: vm) }
    }
}
```

Search fires on each keystroke via `onChange(of: vm.searchQuery)` with 300ms `Task.sleep` debounce in `CollectionViewModel`.

#### Card Grid

```swift
struct CollectionGridView: View {
    let cards: [CardInstance]
    let vm: CollectionViewModel

    let columns = [
        GridItem(.adaptive(minimum: 100, maximum: 120))
    ]

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(cards) { card in
                    CardGridItemView(card: card)
                        .frame(height: 140)
                        .onTapGesture { vm.selectedCard = card }
                        .onLongPressGesture(minimumDuration: 0.4) {
                            vm.contextMenuCard = card
                        }
                }
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 80)
        }
    }
}
```

`LazyVGrid` with `.adaptive(minimum: 100)`: 3 columns on phone, 5+ on iPad. `LazyVGrid` ensures cells not on screen are not rendered (performance).

Each `CardGridItemView`:
- `AsyncImage` (CDN URL). `.aspectRatio(5/7, contentMode: .fill)`. `.cornerRadius(8)`.
- Tier badge: `Text` overlay, top-right, `ZStack`.
- Evolution-ready badge: shard icon, bottom-right, pulsing via `withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true))` on `scaleEffect`. Visible only when energy threshold met and shard owned.
- Favorite star: top-left, only if favorited.

Empty state: faction symbol `Image` at 20% opacity + `Text` message + optional `NavigationLink` "Visit Shop".

#### Filter Panel (Sheet)

```swift
struct FilterPanelView: View {
    @ObservedObject var vm: CollectionViewModel

    var body: some View {
        NavigationStack {
            Form {
                Section("Card Type") {
                    MultiToggleRow(options: CardType.allCases, selected: $vm.filterCardTypes)
                }
                Section("Evolution Tier") {
                    MultiToggleRow(options: EvolutionTier.allCases, selected: $vm.filterTiers)
                }
                Section("Mana Cost") {
                    RangeSlider(range: $vm.filterManaCostRange, bounds: 1...10)
                }
                Section("Attunement") {
                    Picker("", selection: $vm.filterAttunement) {
                        Text("Any").tag(AttunementFilter.any)
                        Text("Mostly Order").tag(AttunementFilter.order)
                        Text("Balanced").tag(AttunementFilter.balanced)
                        Text("Mostly Chaos").tag(AttunementFilter.chaos)
                    }
                    .pickerStyle(.segmented)
                }
                Section("Keywords") {
                    KeywordToggleGrid(selected: $vm.filterKeywords)
                }
                Section("Special") {
                    Toggle("Evolution Ready", isOn: $vm.filterEvolutionReady)
                    Toggle("In Deck", isOn: $vm.filterInDeck)
                    Toggle("Favorited Only", isOn: $vm.filterFavorited)
                }
            }
            .navigationTitle("Filter")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Reset") { vm.resetFilters() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") { /* dismiss */ }
                        .font(.system(size: 14, weight: .semibold))
                }
            }
        }
        .presentationDetents([.large])
    }
}
```

### 5.2 Card Detail View

Presented as `.sheet` from collection or `.navigationDestination` push. Read-only when viewed from battle context.

```swift
struct CardDetailView: View {
    let card: CardInstance
    @ObservedObject var vm: CardDetailViewModel
    @State private var showEvolution: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero art
                AsyncImage(url: card.artURL) { image in
                    image.resizable().aspectRatio(5/7, contentMode: .fit)
                } placeholder: { CardArtPlaceholder() }
                .frame(maxWidth: .infinity)
                .overlay(
                    LinearGradient(
                        colors: [.clear, .black],
                        startPoint: .init(x: 0.5, y: 0.5),
                        endPoint: .bottom
                    )
                )
                .overlay(
                    Text(card.name)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                        .shadow(radius: 4)
                        .padding()
                    , alignment: .bottomLeading
                )

                // Stats row
                HStack(spacing: 0) {
                    StatView(label: "ATK", value: "\(card.atk)")
                    Divider()
                    StatView(label: "HP", value: "\(card.hp)")
                    Divider()
                    StatView(label: "CM", value: "\(card.manaCost)")
                    Divider()
                    StatView(label: "INS", value: "\(card.instability)")
                }
                .frame(height: 56)
                .background(Color(hex: "#141414"))

                // Keywords
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(card.keywords, id: \.self) { kw in
                            KeywordChipView(keyword: kw)
                        }
                    }.padding(.horizontal)
                }
                .frame(height: 48)

                // Triggered abilities
                CardSectionView(title: "Abilities") {
                    ForEach(card.triggeredAbilities) { ability in
                        AbilityRowView(ability: ability)
                    }
                }

                // Modifiers
                CardSectionView(title: "Modifiers") {
                    ForEach(card.modifiers) { mod in
                        ModifierRowView(modifier: mod)
                    }
                }

                // Evolution history
                CardSectionView(title: "Evolution History") {
                    EvolutionTimelineView(history: card.evolutionHistory)
                        .frame(height: max(60, CGFloat(card.evolutionHistory.count) * 40))
                }

                // Energy progress
                CardSectionView(title: "Progress") {
                    EnergyProgressView(current: card.evolutionEnergy, required: card.nextThreshold)
                    Text("\(card.gamesPlayed) games played")
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#888888"))
                }

                // Flavor text
                Text("\"\(card.flavorText)\"")
                    .font(.system(size: 14, weight: .light))
                    .italic()
                    .foregroundColor(Color(hex: "#888888"))
                    .multilineTextAlignment(.center)
                    .padding()

                Spacer().frame(height: 80) // Room for sticky buttons
            }
        }
        .background(Color(hex: "#0D0D0D"))
        .overlay(stickyButtons, alignment: .bottom)
        .fullScreenCover(isPresented: $showEvolution) {
            EvolutionFlowView(card: card)
        }
    }

    @ViewBuilder
    var stickyButtons: some View {
        HStack(spacing: 12) {
            if card.isEvolutionReady {
                Button("Evolve") { showEvolution = true }
                    .frame(width: 160, height: 52)
                    .background(Color(hex: "#FFD700"))
                    .foregroundColor(.black)
                    .cornerRadius(10)
                    .font(.system(size: 16, weight: .bold))
                    .scaleEffect(evolveButtonPulse)
                    .onAppear {
                        withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) {
                            evolveButtonPulse = 1.04
                        }
                    }
            }
            Button("Add to Deck") { vm.addToDeck() }
                .frame(width: 160, height: 52)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white, lineWidth: 2))
                .foregroundColor(.white)

            Menu {
                Button("Favorite", action: vm.toggleFavorite)
                Button("Dismantle", role: .destructive, action: vm.showDismantleConfirmation)
                Button("Share Screenshot", action: vm.shareScreenshot)
            } label: {
                Image(systemName: "ellipsis.circle")
                    .font(.title2)
                    .frame(width: 52, height: 52)
            }
        }
        .padding()
        .background(.ultraThinMaterial)
    }
    @State private var evolveButtonPulse: CGFloat = 1.0
}
```

Card flip interaction (back face showing lore/history): swipe up on card art triggers a 3D flip via:

```swift
withAnimation(.easeInOut(duration: 0.4)) {
    cardFaceRotation += 180
}
```

Using `.rotation3DEffect(.degrees(cardFaceRotation), axis: (x: 0, y: 1, z: 0))` on the card art, with front/back faces swapped at 90 degrees using `.opacity(cardFaceRotation.truncatingRemainder(dividingBy: 360) < 90 ? 1 : 0)`.

### 5.3 Deck Builder

Tab 3 of `TabView`. `NavigationStack` root.

Layout adapts to screen size:

```swift
struct DeckBuilderView: View {
    @StateObject var vm = DeckBuilderViewModel()
    @Environment(\.horizontalSizeClass) var sizeClass

    var body: some View {
        NavigationStack {
            Group {
                if sizeClass == .regular {  // iPad
                    DeckBuilderTabletLayout(vm: vm)
                } else {
                    DeckBuilderPhoneLayout(vm: vm)
                }
            }
        }
    }
}
```

#### DeckBuilderPhoneLayout

```swift
struct DeckBuilderPhoneLayout: View {
    @ObservedObject var vm: DeckBuilderViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Deck name
            TextField("Untitled Deck", text: $vm.deckName)
                .font(.system(size: 18, weight: .medium))
                .multilineTextAlignment(.center)
                .frame(height: 44)
                .padding(.horizontal)

            // Faction selector
            FactionSelectorRow(selected: $vm.faction, locked: vm.factionLocked)
                .frame(height: 52)

            // Avatar selector
            AvatarSelectorRow(selected: $vm.avatarId, faction: vm.faction)
                .frame(height: 80)

            // Stats summary
            DeckStatsSummaryBar(vm: vm)
                .frame(height: 72)

            // Panel tab switch
            Picker("", selection: $vm.activePanel) {
                Text("Deck Contents").tag(DeckPanel.contents)
                Text("Card Pool").tag(DeckPanel.pool)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 6)

            // Panels
            if vm.activePanel == .contents {
                DeckContentsPanel(vm: vm)
            } else {
                CardPoolPanel(vm: vm)
            }
        }
        .background(Color(hex: "#0D0D0D"))
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") { vm.saveDeck() }
                    .disabled(!vm.isValidDeck)
            }
        }
    }
}
```

`DeckStatsSummaryBar`:
- Mana curve: `HStack` of 10 `Rectangle` bars, each height = `max(4, count * 8)` pt, colored by dominant tier in that slot.
- Attunement bar: `GeometryReader` with two `Rectangle` layers proportional to Order/Chaos counts.
- Avg instability `Text` color-coded.
- Card count: green if 20, amber if 15-19, red if <15.

`DeckContentsPanel`: `List` of `DeckCardRow` items. Each row 44pt height minimum. Card thumbnail `AsyncImage` 40x56pt. Card name. Mana cost. ATK/HP. `.swipeActions(edge: .trailing) { Button("Remove", role: .destructive) { vm.removeCard(card) } }`.

`CardPoolPanel`: `LazyVGrid` same as collection grid showing only cards not already in the deck by default. Tap card to add. Validation: deck full = shake animation on the `DeckStatsSummaryBar` via:

```swift
withAnimation(.default) { shakeOffset = 10 }
DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
    withAnimation(.default) { shakeOffset = -10 }
}
// ... repeat for shake sequence
```

Max 2 copies per card enforced: card in pool shown with `.opacity(0.4)` and `allowsHitTesting(false)` if already at 2 copies.

Max 2 Legendaries enforced: same treatment.

#### DeckBuilderTabletLayout (iPad)

```swift
struct DeckBuilderTabletLayout: View {
    var body: some View {
        HStack(spacing: 0) {
            // Left panel: deck contents (320pt fixed)
            DeckContentsPanel(vm: vm)
                .frame(width: 320)
            Divider()
            // Right panel: card pool
            CardPoolPanel(vm: vm)
        }
    }
}
```

Header (deck name, faction, avatar, stats) spans full width above the `HStack`.

#### Deck Validation

Invalid deck: "Save" toolbar button is `.disabled(true)`. Below the stats bar: `Text` in `Color(hex: "#F44336")` describing the issue: "Need 6 more cards" or "Remove 1 Legendary".

WIP decks (< 20 cards) can be saved with a WIP badge via "Save WIP" button. Appear in deck list with `[WIP]` badge. Cannot be used in matchmaking (greyed out in mode selection).

---

## 6. Shop & Economy Screens

Tab 5 of `TabView`. `NavigationStack` root.

### 6.1 Layout

```swift
struct ShopView: View {
    @StateObject var vm = ShopViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    CurrencyHeaderView(vm: vm)
                        .frame(height: 52)
                    subscriptionSection
                    cardPacksSection
                    shardsSection
                    cosmeticsSection
                }
            }
            .background(Color(hex: "#0D0D0D"))
            .navigationTitle("Shop")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
```

**CurrencyHeaderView:**

```swift
struct CurrencyHeaderView: View {
    @ObservedObject var vm: ShopViewModel
    var body: some View {
        HStack {
            // Chaos Dust
            HStack(spacing: 4) {
                Image("icon_chaos_mote_filled")
                    .resizable().frame(width: 22, height: 22)
                Text("\(vm.chaosDust)")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(Color(hex: "#FFD700"))
            }
            .onTapGesture { vm.showDustTooltip = true }

            Spacer()

            // Shard counts
            HStack(spacing: 10) {
                ForEach(ShardTier.allCases) { tier in
                    HStack(spacing: 3) {
                        Image(shardIconName(tier)).resizable().frame(width: 18, height: 18)
                        Text("\(vm.shardCount(tier))")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white)
                    }
                    .onTapGesture { vm.showShardTooltip = tier }
                }
            }
        }
        .padding(.horizontal, 16)
        .background(Color(hex: "#141414"))
    }
}
```

### 6.2 Subscription Tiers Section

```swift
var subscriptionSection: some View {
    VStack(alignment: .leading, spacing: 12) {
        Text("Subscription").font(.system(size: 16, weight: .bold)).foregroundColor(.white)
            .padding(.horizontal, 16)

        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                SubscriptionCardView(tier: .free, currentTier: vm.playerTier)
                SubscriptionCardView(tier: .mid, currentTier: vm.playerTier)
                SubscriptionCardView(tier: .top, currentTier: vm.playerTier)
            }
            .padding(.horizontal, 16)
        }
    }
    .padding(.vertical, 16)
}
```

Each `SubscriptionCardView` — 260x320pt:
- Free: background `Color(hex: "#1A1A1A")`, border `Color(hex: "#3A3A3A")`.
- Mid ($6.99/mo): `LinearGradient(colors: [Color(hex: "#0D47A1"), Color(hex: "#1565C0")])`, border `Color(hex: "#2196F3")`.
- Top ($12.99/mo): `LinearGradient(colors: [Color(hex: "#E65100"), Color(hex: "#F57F17")])`, border `Color(hex: "#FFD700")`.

Contents: tier name 20pt bold, price 16pt, benefits `ForEach` list (checkmark SF symbol + benefit text 13pt), action button.

Current tier: `Text("CURRENT")` badge top-right corner, gold background, 11pt bold.

Action button triggers StoreKit 2 purchase:

```swift
Button(action: {
    Task { await vm.purchase(tier: .mid) }
}) {
    Text(vm.playerTier == .mid ? "Current Tier" : "Upgrade")
        .frame(maxWidth: .infinity, minHeight: 44)
}
.disabled(vm.playerTier == .mid)
```

StoreKit 2 purchase flow in `ShopViewModel`:

```swift
func purchase(tier: SubscriptionTier) async {
    guard let product = await StoreKitManager.shared.product(for: tier.productID) else { return }
    do {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updateSubscriptionStatus(tier: tier)
            await transaction.finish()
        case .pending:
            break // awaiting parental approval
        case .userCancelled:
            break
        @unknown default:
            break
        }
    } catch {
        showPurchaseError = true
    }
}
```

No countdown timers or "limited time" pressure text anywhere in the shop.

### 6.3 Card Packs Section

```swift
var cardPacksSection: some View {
    VStack(alignment: .leading, spacing: 8) {
        Text("Card Packs").font(.system(size: 16, weight: .bold)).foregroundColor(.white)
            .padding(.horizontal, 16)

        VStack(spacing: 8) {
            ForEach(vm.availablePacks) { pack in
                PackRowView(pack: pack) {
                    vm.confirmPackPurchase(pack)
                }
            }
        }
        .padding(.horizontal, 16)
    }
    .padding(.vertical, 12)
}
```

Each `PackRowView`: 60pt height, `HStack`. Pack icon `AsyncImage` 48x48pt. Name + contents `VStack`. Cost "500 Dust" 16pt bold. "Buy" `Button` 80x36pt `Color(hex: "#4A90E2")` `.cornerRadius(8)`.

**Pack Opening**: `.fullScreenCover(isPresented: $vm.showPackOpening)` presents `PackOpeningView`:

```swift
struct PackOpeningView: View {
    let cards: [CardInstance]
    @State private var revealedCount = 0
    @State private var flipped: [Bool]

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 20) {
                // Five card slots
                HStack(spacing: -12) {
                    ForEach(0..<cards.count, id: \.self) { i in
                        PackCardView(card: cards[i], isFlipped: flipped[i])
                            .frame(width: 80, height: 112)
                            .zIndex(Double(i == revealedCount - 1 ? 10 : i))
                    }
                }
                // Reveal timing: cards flip one at a time, 800ms apart
                // Auto-reveals on appear, tap advances immediately
                Button("View Collection") { /* dismiss */ }
                    .opacity(revealedCount >= cards.count ? 1 : 0)
            }
        }
        .onAppear { startRevealSequence() }
    }

    func startRevealSequence() {
        for i in 0..<cards.count {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.8) {
                withAnimation(.easeInOut(duration: 0.4)) {
                    flipped[i] = true
                    revealedCount = i + 1
                }
                HapticManager.shared.lightImpact()
            }
        }
    }
}
```

Card flip: `.rotation3DEffect(.degrees(flipped ? 0 : 180), axis: (x: 0, y: 1, z: 0))`. Front face: CDN art. Back face: faction card back image.

### 6.4 Shards Section

2-column `LazyVGrid`. Each `ShardBundleView`: 160x120pt `Button`. Shard icon 48x48pt. Quantity. Price. On tap: StoreKit 2 one-time purchase via `product.purchase()`.

### 6.5 Subscription Upgrade Prompt

Triggered when free player hits a tier-locked action.

```swift
struct UpgradePromptView: View {
    let lockedFeature: String
    @Binding var isPresented: Bool
    @ObservedObject var vm: ShopViewModel

    var body: some View {
        ZStack {
            Color.black.opacity(0.8).ignoresSafeArea()
                .onTapGesture { isPresented = false }

            VStack(spacing: 20) {
                Text(lockedFeature)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
                Text("Upgrade to unlock this feature")
                    .font(.system(size: 15))
                    .foregroundColor(Color(hex: "#B0B0B0"))
                // Free vs Mid comparison
                SubscriptionComparisonView()
                Button("Upgrade to Mid Tier — $6.99/mo") {
                    Task { await vm.purchase(tier: .mid) }
                }
                .frame(maxWidth: 240, minHeight: 52)
                .background(Color(hex: "#FFD700"))
                .foregroundColor(.black)
                .cornerRadius(10)
                Button("Not Now") { isPresented = false }
                    .foregroundColor(Color(hex: "#888888"))
            }
            .padding(24)
            .frame(width: 320)
            .background(Color(hex: "#1A1A1A"))
            .cornerRadius(20)
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: isPresented)
    }
}
```

Shown once per session per trigger type, tracked in `@AppStorage("upgradePromptSession")`.

---

## 7. Onboarding Flow

Shown only on first launch. Stored in `UserDefaults` key `onboardingComplete`. After completion, root `@State` switches from `OnboardingView` to `MainTabView`.

```swift
@main
struct ChaosCreaturesApp: App {
    @AppStorage("onboardingComplete") var onboardingComplete = false

    var body: some Scene {
        WindowGroup {
            if onboardingComplete {
                MainTabView()
            } else {
                OnboardingFlowView(onComplete: { onboardingComplete = true })
            }
        }
    }
}
```

### 7.1 Flow Overview

```
[App Launch — first time]
    |
    v
Step 1: Intro Cinematic (skippable)
    |
    v
Step 2: Faction Selection (swipeable cards)
    |
    v
Step 3: Tutorial Match (guided battle vs AI)
    |
    v
Step 4: Faction Commitment (keep trial deck)
    |
    v
Step 5: First Evolution (guided, pre-awarded energy + shard)
    |
    v
Step 6: Deck Builder Tour (overlay tooltips)
    |
    v
Step 7: Home Screen (released to free play)
```

### 7.2 Step-by-Step Specifications

#### Step 1: Intro Cinematic

`ZStack` full-screen `Color(hex: "#0D0D0D")`.

Static illustration panels with `Text` subtitles. No video — keeps app bundle size small.

Panel sequence:

```swift
let panels: [(imageName: String, text: String, duration: Double)] = [
    ("onboarding_world",    "The world was once a thriving land of many civilizations.", 4.0),
    ("onboarding_rift",     "War tore open rents to the Plane of Chaos.",                 4.0),
    ("onboarding_motes",    "Chaos motes transform everything they touch.",               4.0),
    ("onboarding_shards",   "Planar Shards hold the power of transformation.",            4.0),
    ("onboarding_player",   "Channel their power. Transform your creatures.", 4.0),
]
```

Transition: `withAnimation(.easeInOut(duration: 0.5))` on `currentPanelIndex`. Auto-advance via `Timer.publish`. Tap anywhere advances immediately.

Skip button: top-right, `Button` 44x44pt minimum. `Text("Skip", font: .system(size: 14))`. `foregroundColor(Color(hex: "#888888"))`. On tap: `withAnimation(.easeInOut(duration: 0.3)) { currentStep = .factionSelection }`.

#### Step 2: Faction Selection

Three `FactionCardView` components in a `TabView(.page)` (SwiftUI pager):

```swift
TabView(selection: $selectedFaction) {
    ForEach(Faction.allCases) { faction in
        FactionCardView(faction: faction) {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                committedFaction = faction
                currentStep = .tutorialMatch
            }
        }
        .tag(faction)
    }
}
.tabViewStyle(.page(indexDisplayMode: .always))
```

Each `FactionCardView`: full screen height at 80%. Faction-themed `LinearGradient` background. Faction icon 80x80pt. Name 26pt bold. 2-line description. Sample card `AsyncImage` 180x252pt. "Choose [Faction]" `Button` 200x52pt faction accent color.

On tap: selected card expands via `withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) { selectedFaction = faction }`, others fade via `.opacity`. After 600ms, advance to Step 3.

#### Step 3: Tutorial Match (Guided Battle)

Launches standard `BattleView` (same `SKScene`) with `isTutorialMode: true` flag.

`TutorialOverlayView` is a SwiftUI `View` layered over `BattleView` in the `ZStack`.

```swift
struct TutorialOverlayView: View {
    @ObservedObject var tutorialVM: TutorialViewModel
    let targetFrames: [TutorialStep: CGRect]

    var body: some View {
        ZStack {
            // Spotlight mask
            SpotlightMaskView(highlightRect: targetFrames[tutorialVM.currentStep])
            // Tooltip
            if let rect = targetFrames[tutorialVM.currentStep] {
                TutorialTooltipView(
                    text: tutorialVM.currentStep.instruction,
                    anchorRect: rect
                )
            }
        }
        .allowsHitTesting(false) // Touch passes through except highlighted element
    }
}
```

`SpotlightMaskView`: `Canvas` drawing a full-screen dark rect with a rounded-rect cutout at `highlightRect`. Alpha: 0.75 outside, 0.0 inside the cutout.

Target elements report their frames via `.background(GeometryReader { geo in Color.clear.preference(key: FramePreferenceKey.self, value: geo.frame(in: .global)) })`.

Tutorial steps: 9 steps covering all phases of a turn. Each step waits for the required player action before advancing. Step 9 is scripted AI defeat.

Turn timer disabled in tutorial mode (server sets `timerSeconds: 0`).

Skip button always visible. On skip: award starter deck, mark tutorial complete, advance to Step 4.

#### Step 4: Faction Commitment

`Alert` with custom styling via SwiftUI `.alert`:

```swift
.alert("Keep \(faction.name)?", isPresented: $showCommitAlert) {
    Button("Keep \(faction.name) Deck", role: .none) {
        Task { await vm.commitFaction(faction) }
    }
    Button("Cancel", role: .cancel) {}
} message: {
    Text("These 20 cards become yours to keep, evolve, and build with.")
}
```

Or a custom sheet for richer visuals: faction illustration + "Keep [Faction] Deck" primary `Button` + "See Other Factions" secondary `Button`.

On confirm: calls `player/commit-faction` Supabase Edge Function. On success: trial cards become owned `CardInstance` records. Advance to Step 5.

#### Step 5: First Evolution (Guided)

Server pre-awards 15 evolution energy (threshold met) and 1 Uncommon Shard to the player's starting 2-cost creature.

`NotificationBanner` slides in from top:

```swift
withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
    showBanner = true
}
```

Banner: "Your [CreatureName] is ready to evolve!" 16pt bold. Tap opens `CardDetailView` with tutorial overlay on "Evolve" button.

Player proceeds through normal evolution flow. `TutorialOverlayView` shown at each evolution step with tooltip explaining that step.

#### Step 6: Deck Builder Tour

On first visit to `DeckBuilderView`, check `UserDefaults` flag `deckBuilderTourComplete`. If false, run tour.

Tour: 5 `TutorialTooltipView` instances shown sequentially over target elements. Each auto-advances after 4s or on tap. On completion: `UserDefaults.standard.set(true, forKey: "deckBuilderTourComplete")`.

#### Step 7: Release to Home

Final onboarding screen: `VStack` full-screen. Faction-themed `LinearGradient`. "You're ready!" 28pt bold. "Start Playing" `Button` 200x52pt gold. On tap:

```swift
withAnimation(.easeInOut(duration: 0.4)) {
    onboardingComplete = true  // triggers @AppStorage switch to MainTabView
}
```

Pre-populate missions in Supabase: `player/complete-onboarding` Edge Function seeds 3 starter daily missions for the player.

### 7.3 Starter Deck Composition

See `00-game-design-master.md` Section 3 for exact card counts. Starter deck data is seeded in Supabase and fetched by the `player/commit-faction` Edge Function. Cards are pre-generated from the batch pipeline card templates.

---

## 8. Interaction Patterns

All touch handling in SwiftUI uses built-in gesture modifiers. In `BattleScene` (SpriteKit), touch handling uses `touchesBegan/touchesMoved/touchesEnded`.

### 8.1 Tap Targets

**Minimum tap target: 44x44pt** (Apple Human Interface Guidelines).

All SwiftUI `Button` and tappable `View`s must have either:
- Physical dimensions >= 44x44pt, OR
- `.contentShape(Rectangle())` with `.frame(minWidth: 44, minHeight: 44)` to expand the hit area.

Visual elements smaller than 44pt (mana crystals 20pt, keyword icons 24pt): wrap with `.frame(width: 44, height: 44).contentShape(Rectangle())`.

In SpriteKit: `SKSpriteNode` with physical size < 44pt gets a transparent `SKSpriteNode` child of 44x44pt with `isUserInteractionEnabled = false` as a hit area, or the touch detection logic uses an expanded `CGRect` with 44pt minimum.

### 8.2 Tap Interactions

Standard SwiftUI `Button` provides visual feedback automatically. For custom tappable `View`s, use `@State var isPressed` with `.scaleEffect(isPressed ? 0.95 : 1.0)` and `.animation(.easeInOut(duration: 0.1), value: isPressed)` driven by `.simultaneousGesture(DragGesture(minimumDistance: 0).onChanged { _ in isPressed = true }.onEnded { _ in isPressed = false })`.

| Element | Tap Action | Animation |
|---|---|---|
| Card in hand | Select to play (lift) | `scaleEffect(1.1)` + shadow |
| Card on board (battle) | Open Card Detail sheet | Brief `scaleEffect(1.05)` pulse |
| Creature (attack phase) | Toggle attacker | Red `SKAction.colorize` glow |
| Avatar (battle) | Open Graveyard sheet | Avatar `scaleEffect` pulse |
| `Button` | Execute action | `.scaleEffect(0.95)` on press-in |
| Faction tab | Filter collection | Accent underline `withAnimation` slide |

### 8.3 Long Press Interactions

All long presses use `.onLongPressGesture(minimumDuration: 0.4)`.

| Element | Long Press Action | Feedback |
|---|---|---|
| Card in hand (battle) | Preview detail without playing | Card Detail sheet in peek mode |
| Card row in deck builder | Swipe-to-delete OR long press shows action menu | `.swipeActions` or `Menu` |
| Deck in deck selector | Action menu (Edit/Duplicate/Delete) | `confirmationDialog` slides up |
| Card in collection | Quick action: Evolve / Add / Favorite | `confirmationDialog` |

### 8.4 Drag Interactions (SpriteKit)

All drag interactions in the battle screen are handled in `BattleScene`. Minimum distance before drag activation: 10pt (evaluated in `touchesMoved` by comparing to initial `touchesBegan` position).

| Drag | Feedback |
|---|---|
| Card from hand → board slot | Card 1.2x scale, follows touch, drop zones highlight green |
| Card from hand → target | Card follows touch, valid targets show green `SKShapeNode` border |
| Blocker → attacker | Blocker 1.15x scale, follows touch, valid attackers glow |
| Blocker dropped on empty board | `SKAction.move(to: originalPosition, duration: 0.25)` snap-back |

Invalid drop: snap-back `SKAction.move`, haptic error notification.

Valid drop: light haptic impact.

### 8.5 Swipe Interactions

| Element | Direction | Action |
|---|---|---|
| Hand scroll area (`ScrollView`) | Left/Right | Native `ScrollView` momentum scroll |
| Collection grid | Up/Down | Native `ScrollView` scroll |
| Deck selector | Left/Right | `TabView(.page)` swipe |
| Left edge of battle scene | Right | `BattleLogOverlay` slides in (detected in `touchesBegan` with `location.x < 20`) |
| Evolution channel options | Left/Right | `TabView(.page)` swipe |

### 8.6 Haptic Feedback

All haptics use `UIFeedbackGenerator` subclasses wrapped in `HapticManager`:

```swift
class HapticManager {
    static let shared = HapticManager()
    private let lightImpactGen = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpactGen = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpactGen = UIImpactFeedbackGenerator(style: .heavy)
    private let notificationGen = UINotificationFeedbackGenerator()
    private let selectionGen = UISelectionFeedbackGenerator()

    func lightImpact()  { lightImpactGen.impactOccurred() }
    func mediumImpact() { mediumImpactGen.impactOccurred() }
    func heavyImpact()  { heavyImpactGen.impactOccurred() }
    func successNotification() { notificationGen.notificationOccurred(.success) }
    func errorNotification()   { notificationGen.notificationOccurred(.error) }
    func selectionChanged()    { selectionGen.selectionChanged() }
}
```

| Action | Haptic |
|---|---|
| Card played | `lightImpact()` |
| Damage dealt | `mediumImpact()` |
| Creature destroyed | `heavyImpact()` |
| D20 roll start | `lightImpact()` |
| D20 settle | `mediumImpact()` |
| Evolution complete | `successNotification()` |
| Invalid action / error | `errorNotification()` |
| Button tap (general) | `selectionChanged()` |
| Timer reaches 15s | `mediumImpact()` |

Haptic generators are prepared (`prepare()` called before needed) to reduce latency. All haptic calls are wrapped in `@MainActor` or dispatched to main thread.

---

## 9. Responsive Considerations

### 9.1 Phone vs iPad

Detect via SwiftUI `@Environment(\.horizontalSizeClass)`. `compact` = phone portrait. `regular` = iPad or phone landscape.

| Screen | Compact (phone) | Regular (iPad) |
|---|---|---|
| Collection | `LazyVGrid` adaptive min 100pt (~3 cols) | adaptive min 100pt (~5+ cols) |
| Deck Builder | Stacked (`Picker` tabs for contents/pool) | Side-by-side `HStack` |
| Battle | Full portrait layout | Portrait preferred (wider board) |
| Shop | Single column | 2-column grid for packs/shards |
| Tab bar | Icons + labels if space allows | Icons + labels |

### 9.2 Orientation Lock

All screens: both orientations permitted (default).

**Exception — Battle screen**: portrait locked on `.onAppear` via `AppDelegate.orientationLock = .portrait`. Restored on `.onDisappear`. Implementation:

```swift
// AppDelegate.swift
class AppDelegate: NSObject, UIApplicationDelegate {
    static var orientationLock: UIInterfaceOrientationMask = .all

    func application(_ application: UIApplication,
                     supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return AppDelegate.orientationLock
    }
}
```

**Exception — Evolution flow**: portrait locked on `.fullScreenCover` appear, restored on dismiss.

This is the MVP decision. Landscape battle is a post-launch enhancement.

### 9.3 Safe Area

All SwiftUI `View`s use `.safeAreaInset` or `SafeAreaInsetsKey` environment value for padding. The `BattleView` `ZStack` uses `.ignoresSafeArea()` on the `SpriteView` but adds `safeAreaInsets.bottom` padding to `BottomControlsView`. `.ignoresSafeArea(.keyboard)` applied where text inputs appear.

### 9.4 Dynamic Type

All `Text` uses `.font(.system(size:weight:))` with no explicit `allowsHitTesting` override for readable text. For compact card stat labels on `BoardCardNode` (`SKLabelNode`): fixed `fontSize` in SpriteKit — no Dynamic Type support there. Acceptable for game UI elements.

Long card names: `.lineLimit(1)` + `.minimumScaleFactor(0.7)` to truncate gracefully.

---

## 10. Animation Timing Reference

All SwiftUI animations use named types from SwiftUI's `Animation` API.

### 10.1 Standard Durations

| Animation | Duration | SwiftUI Type |
|---|---|---|
| Modal slide in/out | 300ms | `.spring(response: 0.3, dampingFraction: 0.8)` |
| Card flip (detail reveal) | 400ms | `.easeInOut(duration: 0.4)` |
| Button press feedback | 100ms | `.easeInOut(duration: 0.1)` |
| Tab underline slide | 200ms | `.easeInOut(duration: 0.2)` |
| Tooltip appear/dismiss | 200ms | `.easeOut(duration: 0.2)` |
| Sheet present/dismiss | System default | SwiftUI `.sheet()` default |
| Step transition (evolution) | 300ms | `.easeInOut(duration: 0.3)` |
| Tier badge bounce-in | Spring | `.spring(response: 0.4, dampingFraction: 0.5)` |
| Channel selection expand | 300ms | `.easeInOut(duration: 0.3)` |
| Modifier confirm slide | Spring | `.spring(response: 0.5, dampingFraction: 0.7)` |

### 10.2 SpriteKit Standard Durations

| Animation | Duration | SKAction timing |
|---|---|---|
| Card play (hand to board) | 450ms | `.easeOut` on `move` |
| Attacker glow-in | 200ms | `.easeOut` on `colorize` |
| Damage number float-up | 800ms | `.easeOut` on `moveBy` |
| Death shatter | 350ms | default |
| Death emitter | 1200ms | wait then `removeFromParent` |
| D20 roll | 1500-2500ms | `.repeatForever` spin |
| D20 settle bounce | 300ms | sequence |
| EventOverlay appear | 300ms | `.easeOut` |
| EventOverlay dismiss | 300ms | default |
| Shard crack | 300ms | default |
| Screen flash (death) | 180ms | sequence |
| Battle log slide-in | 300ms | `.easeOut` on `moveTo` |

### 10.3 Skippable vs Non-Skippable

**Skippable** (player tap to advance):
- Evolution step animations (tap advances to next step).
- Intro cinematic (Skip button always visible).
- Flavor text typeout (tap to complete instantly).
- Pack opening (tap to skip to next card reveal).
- Art reveal (tap advances after reveal completes).

**Non-Skippable** (must complete for game state clarity):
- Combat damage resolution (SpriteKit animation must finish before next action).
- D20 roll + EventOverlay (minimum 2.5s for readability).
- Card draw animation.
- Death animation (1200ms minimum — slot must be cleared before next action).

### 10.4 Reduced Motion

Check `UIAccessibility.isReduceMotionEnabled` on app start. Store in `@AppStorage("prefersReducedMotion")`.

If reduced motion is on:
- Replace all `withAnimation(.spring(...))` and `withAnimation(.easeInOut(...))` with `withAnimation(.linear(duration: 0))` — instant changes.
- D20 roll: instant number display, no `SKAction` spin.
- Particle emitters: disabled (omit `SKEmitterNode` from death/evolution scenes).
- Screen shake on damage: disabled.
- Card play: instant position change, no `SKAction.move`.
- Screen transitions: `.opacity` only, no `.move`.

---

## 11. Error States & Edge Cases

### 11.1 Network Loss

**During Matchmaking:** `NWPathMonitor` detects path status change. Present `Alert`: "Connection lost. Matchmaking cancelled." On dismiss: pop `NavigationStack` back to mode selection.

**During Battle:** `BattleScene` receives no Supabase Realtime updates for 5+ seconds. Show `ReconnectingOverlayNode` in SpriteKit (full-screen semi-transparent dark rect + spinning `SKSpriteNode` + `SKLabelNode` "Reconnecting..."). Client attempts Supabase Realtime reconnect. If reconnected within 10s: overlay removes. If not: `Alert` "Match forfeited." counts as loss. Dismiss `BattleView` `.fullScreenCover` to `HomeView`.

**During Evolution:** If Supabase call fails: `Alert` with "Try Again" and "Cancel" buttons. Shard and energy not consumed until `evolution/confirm` is called in Step 9. Partial failures are safe to retry.

### 11.2 Empty States

Every list and grid has a `ContentUnavailableView` (iOS 17 native) or custom empty state when data is empty.

```swift
var body: some View {
    if cards.isEmpty {
        ContentUnavailableView {
            Label("No cards yet", systemImage: "rectangle.stack")
        } description: {
            Text("Visit the Shop to get your first cards.")
        } actions: {
            NavigationLink("Visit Shop", destination: ShopView())
                .buttonStyle(.borderedProminent)
        }
    } else {
        CollectionGridView(cards: cards)
    }
}
```

| Screen | Empty Condition | Message |
|---|---|---|
| Collection | No cards in faction | "No cards yet. Visit the Shop!" |
| Deck Builder | Empty deck | "Add cards from the card pool" |
| Graveyard | No destroyed cards | "No cards destroyed yet" |
| Battle Log | No log entries | "No actions yet this turn" |

### 11.3 Validation Messages

Toast notifications: custom `ToastView` presented via SwiftUI overlay at the root `MainTabView`. Triggered via `@EnvironmentObject var toastVM: ToastViewModel`.

```swift
struct ToastView: View {
    let message: String
    let type: ToastType  // .info, .warning, .error, .success

    var body: some View {
        Text(message)
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(.white)
            .padding(.horizontal, 16).padding(.vertical, 10)
            .background(toastColor)
            .cornerRadius(20)
            .shadow(radius: 8)
            .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}
```

Position: bottom of screen, above tab bar. Auto-dismiss after 2000ms via `Task.sleep(nanoseconds: 2_000_000_000)` in `ToastViewModel`.

| Invalid Action | Message | Type |
|---|---|---|
| Deck full | "Deck is full (20/20)" | `.warning` |
| Not enough mana | "Not enough mana" | `.error` |
| Max Legendaries | "Already have 2 Legendaries" | `.warning` |
| Max copies | "Already have 2 copies of this card" | `.warning` |
| Purchase failed | Custom `Alert` with retry button | Alert |

---

## 12. Accessibility Features

### 12.1 Colorblind Modes

Setting in Profile → Settings → Visuals → "Colorblind Mode".

Options: None / Deuteranopia / Protanopia / Tritanopia.

Stored in `@AppStorage("colorblindMode")`. Applied globally via `@EnvironmentObject var accessibilityVM: AccessibilityViewModel`.

When active:
- Order indicator: blue + crystal icon + diagonal stripe overlay (SwiftUI `Canvas` hatching pattern).
- Chaos indicator: red + flame icon + dot pattern overlay.
- Attunement: Order = triangle, Chaos = circle, Neutral = square (shape-based, not just color).
- HP bars: always show numeric HP text regardless of colorblind setting.

In SpriteKit nodes: `BoardCardNode` checks `AccessibilityViewModel.shared.colorblindMode` and uses icon textures alongside color tints.

### 12.2 VoiceOver

Apply `accessibilityLabel(_:)` and `accessibilityHint(_:)` to all interactive elements.

Examples:
- Card on board: `.accessibilityLabel("\(card.name), \(card.atk) attack, \(card.hp) HP, \(card.keywords.joined(separator: ", "))")`
- End Turn button: `.accessibilityLabel("End Turn")`
- Phase indicator: `.accessibilityLabel("Current phase: \(phase.displayName)")`
- A hidden `Text` announces turn state: "Your turn. \(secondsRemaining) seconds remaining. Instability \(instability). \(boardCreatureCount) creatures on your board."

Priority: labels for all interactive elements in MVP. Full VoiceOver battle navigation (tabbing between cards) is a post-launch enhancement.

### 12.3 Turn Timer Extension

Setting: `@AppStorage("extendedTimer") var extendedTimer: Bool`. Applies to Casual and Practice modes only. When enabled, client sends `{ timerExtended: true }` in match init request to server. Server responds with `timerSeconds: 90`. Ranked always 60s regardless.

---

## 13. Visual Styling Constants

### 13.1 Color Palette (`Sources/Constants/Colors.swift`)

```swift
enum AppColors {
    // Base
    static let background        = Color(hex: "#0D0D0D")
    static let surface           = Color(hex: "#1A1A1A")
    static let surfaceElevated   = Color(hex: "#242424")
    static let border            = Color(hex: "#3A3A3A")
    static let textPrimary       = Color.white
    static let textSecondary     = Color(hex: "#B0B0B0")
    static let textMuted         = Color(hex: "#666666")

    // Factions
    static let ironwright        = Color(hex: "#4A90E2")
    static let feyCourts         = Color(hex: "#7ED321")
    static let demonic           = Color(hex: "#D0021B")

    // Events
    static let order             = Color(hex: "#5BC0EB")
    static let chaos             = Color(hex: "#E63946")

    // Tiers
    static let tierCommon        = Color(hex: "#9E9E9E")
    static let tierUncommon      = Color(hex: "#4CAF50")
    static let tierRare          = Color(hex: "#2196F3")
    static let tierEpic          = Color(hex: "#9C27B0")
    static let tierLegendary     = Color(hex: "#FFD700")

    // Actions
    static let danger            = Color(hex: "#F44336")
    static let success           = Color(hex: "#4CAF50")
    static let warning           = Color(hex: "#FFC107")
    static let info              = Color(hex: "#2196F3")
}
```

Extension for hex init: `extension Color { init(hex: String) { ... } }` (standard Swift extension, included in `Extensions/Color+Hex.swift`).

### 13.2 Typography (`Sources/Constants/Typography.swift`)

```swift
enum AppFont {
    // San Francisco (system default) for all UI text
    static func display(_ size: CGFloat) -> Font { .system(size: size, weight: .bold) }
    static func headline(_ size: CGFloat) -> Font { .system(size: size, weight: .bold) }
    static func body(_ size: CGFloat) -> Font { .system(size: size, weight: .regular) }
    static func caption(_ size: CGFloat) -> Font { .system(size: size, weight: .regular) }

    // Display font for card names and evolution headers (loaded from bundle)
    // Font file: Resources/Fonts/CardDisplayFont.ttf (open-source fantasy font)
    static func cardDisplay(_ size: CGFloat) -> Font { .custom("CardDisplayFont", size: size) }
}
```

Font registration in `@main` `ChaosCreaturesApp.init()`:

```swift
UIFont.registerFont(from: Bundle.main.url(forResource: "CardDisplayFont", withExtension: "ttf")!)
```

### 13.3 Card Frame Design Constants (`Sources/Constants/CardConstants.swift`)

```swift
enum CardSize {
    static let aspectRatio: CGFloat = 5.0 / 7.0

    // SwiftUI contexts
    static let boardWidth: CGFloat = 64    // Board slot (5:7 → 64x90)
    static let handWidth: CGFloat = 88     // Hand card (88x123)
    static let detailWidth: CGFloat = 280  // Card Detail view (280x392)
    static let gridWidth: CGFloat = 100    // Collection grid (100x140)

    // SpriteKit contexts (CGFloat points matching above)
    static let boardSKSize = CGSize(width: 64, height: 90)
    static let handSKSize  = CGSize(width: 88, height: 123)
}
```

Card frame: `cornerRadius: 8`. Border 3pt, color = tier color. Art area: top 65%. Stats area: bottom 35% with dark gradient overlay starting at 50%.

---

## 14. Settings Screen

Accessed via gear icon `ToolbarItem` on any tab's `NavigationStack`. `NavigationLink(destination: SettingsView())`.

```swift
struct SettingsView: View {
    var body: some View {
        Form {
            Section("Account") {
                LabeledContent("Username", value: playerVM.username)
                NavigationLink("Change Email") { ChangeEmailView() }
                Button("Sign Out", role: .destructive) { authVM.signOut() }
                Button("Delete Account", role: .destructive) { showDeleteConfirmation = true }
            }
            Section("Audio") {
                Toggle("Music", isOn: $prefs.musicEnabled)
                Slider(value: $prefs.musicVolume, in: 0...1) { Text("Music Volume") }
                Toggle("Sound Effects", isOn: $prefs.sfxEnabled)
                Slider(value: $prefs.sfxVolume, in: 0...1) { Text("SFX Volume") }
            }
            Section("Visuals") {
                Picker("Colorblind Mode", selection: $prefs.colorblindMode) {
                    Text("None").tag(ColorblindMode.none)
                    Text("Deuteranopia").tag(ColorblindMode.deuteranopia)
                    Text("Protanopia").tag(ColorblindMode.protanopia)
                    Text("Tritanopia").tag(ColorblindMode.tritanopia)
                }
                Toggle("Reduce Motion", isOn: $prefs.reducedMotion)
            }
            Section("Gameplay") {
                Toggle("Confirm Before End Turn", isOn: $prefs.confirmEndTurn)
                Toggle("Extended Timer (Casual/Practice)", isOn: $prefs.extendedTimer)
            }
            Section("Notifications") {
                Toggle("Evolution Ready", isOn: $prefs.notifyEvolutionReady)
                Toggle("Daily Quests Reset", isOn: $prefs.notifyDailyReset)
                Toggle("Match Found", isOn: $prefs.notifyMatchFound)
            }
            Section("Privacy") {
                NavigationLink("Privacy Policy") { WebView(url: privacyPolicyURL) }
                NavigationLink("Terms of Service") { WebView(url: tosURL) }
                Button("Export My Data") { Task { await settingsVM.exportData() } }
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.large)
    }
}
```

All preferences stored in `@AppStorage` or `UserDefaults`. No Core Data.

Data Export: calls Supabase `player/export-data` Edge Function. Returns JSON file URL. Presented via `ShareLink` (SwiftUI).

---

## 15. Post-Match Results Screen

Presented after `BattleView` dismisses. `NavigationStack` push from `HomeView` or direct state replacement.

```swift
struct PostMatchResultsView: View {
    let result: MatchResult
    @ObservedObject var vm: PostMatchViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                ResultHeaderView(result: result)
                RewardsSection(vm: vm)
                EnergyEarnedSection(vm: vm)
                OpponentProfileSection(vm: vm)
                Spacer().frame(height: 20)
                bottomButtons
            }
        }
        .background(Color(hex: "#0D0D0D"))
    }
}
```

**ResultHeaderView:**

```swift
struct ResultHeaderView: View {
    let result: MatchResult
    @State private var textScale: CGFloat = 0.5
    @State private var textOpacity: Double = 0.0

    var body: some View {
        ZStack {
            if result.isVictory {
                LinearGradient(colors: [Color(hex: "#F9A825"), Color(hex: "#FF8F00")],
                               startPoint: .top, endPoint: .bottom)
            } else {
                LinearGradient(colors: [Color(hex: "#1A1A1A"), Color(hex: "#0D0D0D")],
                               startPoint: .top, endPoint: .bottom)
            }

            VStack(spacing: 8) {
                Text(result.isVictory ? "VICTORY" : "DEFEAT")
                    .font(.system(size: 36, weight: .black))
                    .foregroundColor(.white)
                    .scaleEffect(textScale)
                    .opacity(textOpacity)
                Text(result.reason).font(.system(size: 14)).foregroundColor(Color(hex: "#888888"))
            }
            .padding(.vertical, 40)
        }
        .onAppear {
            if result.isVictory {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.5)) {
                    textScale = 1.0
                    textOpacity = 1.0
                }
                // Confetti (SpriteKit particle emitter launched in an overlay SKView)
                showConfetti = true
            } else {
                withAnimation(.easeIn(duration: 0.4)) {
                    textOpacity = 1.0
                    textScale = 1.0
                }
            }
        }
    }
    @State private var showConfetti = false
}
```

Victory: `.spring(response: 0.5, dampingFraction: 0.5)` bounce on "VICTORY" text + confetti burst from a small overlay `SpriteView` with `SKEmitterNode(fileNamed: "VictoryConfetti")`.

Defeat: clean fade-in, no animation.

**RewardsSection:** XP bar fills via `withAnimation(.easeOut(duration: 1.0)) { xpProgress = targetProgress }`. Chaos Dust "+N Dust" fades in.

**EnergyEarnedSection:** Horizontal `ScrollView` of up to 5 card thumbnails. Each card with "+2 Energy" label. "READY TO EVOLVE!" gold badge on cards that hit threshold, animated with `.spring(response: 0.4, dampingFraction: 0.5)` on `.scaleEffect`.

**OpponentProfileSection:** Opponent avatar + name + rank badge. 3 showcase card thumbnails. "Add Friend" and "View Profile" buttons.

**Bottom buttons:**
- "Play Again": `Button` 180x52pt gold. Re-queues same deck.
- "Evolve Cards": `Button` 180x52pt `Color(hex: "#2196F3")`. Only visible if evolution-ready cards exist. On tap: navigate to `CollectionView` with filter `evolutionReady = true`.
- "Home": `Button` text-only, bottom-left.

---

## Part B — Admin Dashboard (Web Application)

The owner manages the game via a web dashboard. This is a **separate application** — NOT part of the iOS app. It is a React + Vite (TypeScript) web app deployed on Railway as a separate service in the same project.

**This section describes a web application, not iOS. All component names are HTML/React, not SwiftUI.**

**URL:** `admin.chaoscreatures.game` (or Railway-provided subdomain).
**Auth:** Supabase Auth email/password. Single owner account. No public registration.
**Stack:** React + Vite + TypeScript. No additional UI component library required — plain CSS or Tailwind CSS (both free). Deployed to Railway as a Node.js static server.

---

## 16. Admin Dashboard Overview

### 16.1 Admin Navigation

Persistent left sidebar (240px wide) — always visible on desktop.

```
[Chaos Creatures Logo]
──────────────────────
[Dashboard]     /admin
[Cards]         /admin/cards
[Evolution]     /admin/evolution
[Players]       /admin/players
[Economy]       /admin/economy
[Analytics]     /admin/analytics
[Settings]      /admin/settings
──────────────────────
[Sign Out]
```

Main content area fills remaining width. Responsive: sidebar collapses to hamburger menu on screens < 768px.

### 16.2 Dashboard Page (`/admin`)

Landing page with key metrics.

**Stats Grid (4 columns):**
- Total active players (last 7 days).
- Total evolutions today.
- Total card packs purchased today.
- Total Chaos Dust distributed today.

Each stat: large number + small delta vs. yesterday (green up-arrow or red down-arrow icon).

**Pending Actions Panel** (high priority, shown first):
- Cards awaiting approval: count badge + "Review Now" link → `/admin/cards?status=pending`.
- Evolution jobs failed: count + "Investigate" link.
- Player reports: count + "Review" link.

**Recent Activity Feed:** Scrollable list of last 50 events. Timestamp + event type + description.

**Quick Actions:**
- "Generate Card Batch" button → opens generation workflow modal.
- "Send Announcement" button → text area + "Send to All Players" confirm.
- "Toggle Maintenance Mode" toggle button.

### 16.3 Cards Management (`/admin/cards`)

Core content approval workflow.

**Tab bar:** Pending Review | Approved | Rejected | All Cards

**Pending Review tab:**

Grid of card thumbnails (6 columns on wide monitor). Each card item:
- Full card art thumbnail (160x224px).
- Card name overlay.
- Faction badge + Tier badge.
- Generation timestamp.
- "Approve" button (green) and "Reject" button (red).

Approve: `POST /admin/cards/{templateId}/approve`. Card moves to approved, `approved_at` and `approved_by` stamped.

Reject: modal opens. Owner selects reason from `<select>`: "Art quality poor" | "Stats imbalanced" | "Art inappropriate" | "Other" (free text). Card marked `rejected`. "Regenerate" option available.

Batch approve: checkbox selection + "Approve Selected" button.

**Card Detail modal (click thumbnail):**
- Large card art (400x560px).
- All card stats: type, mana cost, ATK, HP, instability, keywords, faction.
- Generation metadata: FLUX model, prompt, generation time.
- Action buttons: Approve / Reject / Regenerate / Edit Stats.

**Edit Stats:** Inline `<form>`. ATK, HP, mana cost, keywords, instability. Save → DB update. Reason field required. Change logged in `admin_audit_log`.

**Regenerate:** Option to edit prompt before regenerating. Submit → new FLUX job queued.

**Generate Card Batch Workflow (modal wizard):**

1. Select faction.
2. Select card type (Creature / Spell / Stabilizer).
3. Set quantity (1-20).
4. Select archetype template from `<select>`.
5. Review generated prompt. "Generate" button.
6. Progress bar: "Generating 10 cards... [7/10 complete]". Auto-refreshes every 2s via polling.
7. On complete: modal closes. Pending Review tab auto-selected.

Owner's entire workflow: open browser → two clicks → review grid → approve/reject. No terminal, no SQL.

### 16.4 Evolution Management (`/admin/evolution`)

**Active Jobs tab:** Live table of in-progress FLUX jobs. Columns: Player ID, Card Name, Evolution tier, Status (queued / generating / completed / failed), Duration, Actions.

**Failed Jobs:** Filtered view. For each failed job: Player ID, Card, Error message, Time. Action: "Refund & Notify Player" (refunds shard + energy, sends in-app notification) or "Retry Job".

**Evolution Statistics:** Line chart of evolutions per day. Breakdown by tier and faction. Uses PostHog analytics API.

**Modifier Pool Management:** Table of all 240 modifiers. Inline editable: name, PP cost, effect text. Cannot delete modifiers already granted to players — only deprecate (marks unavailable for new evolutions, remains on existing cards).

### 16.5 Players Management (`/admin/players`)

**Search:** `<input>` field, search by username, player ID, or email.

**Player list:** `<table>`. Columns: Username, Faction, Subscription tier, Total games, Cards owned, Last active, Join date, Actions.

**Player detail page (click row):**
- Player info: avatar, username, email, subscription tier, join date, last active.
- Stats: total games, win rate, total evolutions, Chaos Dust balance, shard balances.
- Card collection: grid of owned cards.
- Activity log: recent actions.
- Actions panel:
  - "Grant Chaos Dust": `<input>` + "Grant" button. Reason field required. Logged.
  - "Grant Shard": tier `<select>` + "Grant" button. Logged.
  - "Suspend Account": reason + duration. Logged.
  - "Unsuspend Account".
  - "Reset Evolution": reverts a specific evolution, returns shard + energy.

All admin actions logged in `admin_audit_log` table: `admin_user_id`, `action`, `target_player_id`, `reason`, `timestamp`.

### 16.6 Economy Management (`/admin/economy`)

**Currency Overview:**
- Total Chaos Dust in circulation.
- Dust distributed today / this week / this month.
- Dust source breakdown: wins, losses, quests, admin grants (pie or bar chart).

**Quest Management:**
- Table of all active daily/weekly quests.
- Edit quest: reward amount, description, completion condition (inline form).
- "Add New Quest" button → form modal.
- Toggle quest on/off without deleting.

**Subscription Overview:**
- Player count per tier (Free / Mid / Top).
- Monthly revenue estimate.
- Tier churn rate.

**IAP Products:** Read-only table of App Store IAP product IDs, prices, types, active status. Cannot be edited here (managed in App Store Connect). Reference only.

Note: Shard costs are 30/60/120/240 Chaos Dust for Uncommon/Rare/Epic/Legendary. These match all source docs. The game config table stores these values and the admin can adjust them in Settings.

### 16.7 Analytics (`/admin/analytics`)

Embedded PostHog dashboard `<iframe>`. Configured to show:
- Daily/weekly active users.
- Retention cohorts (D1, D7, D30).
- Match completion rate.
- Evolution funnel (start → channel → generating → confirm).
- Economy health (Dust inflation/deflation).
- Subscription conversion funnel.

Alternative: "Open in PostHog" link opens the PostHog project dashboard in a new tab.

### 16.8 Settings (`/admin/settings`)

**Game Configuration** (all values editable, stored in `game_config` Supabase table, read by iOS client on launch):
- Turn timer duration (default 60s).
- Card energy thresholds per tier (15/30/50/75).
- Chaos Dust reward per win (default 15) and loss (default 5).
- Pack costs. Shard costs per tier.

Each field: `<input type="number">` with current value. "Save" button calls `PATCH /admin/config`.

**Maintenance Mode:** `<input type="checkbox">` toggle. When on: iOS clients show maintenance screen. Message `<textarea>` for custom message.

**Announcement:** `<textarea>` + "Send to All Players" button. Sends push notification via APNs to all registered devices.

**Admin Accounts:** Table of admin user emails. "Add Admin" form. "Remove" button per row.

**API Keys Status:** Read-only status table. Shows green checkmark / red X for each key: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FAL_AI_KEY`, `OPENAI_API_KEY`, `CLOUDFLARE_R2_KEY`, `POSTHOG_KEY`. Does NOT display actual key values.

### 16.9 Admin Content Generation Pipeline (Owner Workflow)

Complete workflow from the owner's perspective — no terminal required:

1. Open `admin.chaoscreatures.game` in browser. Sign in.
2. Navigate to `/admin/cards`. Click "Generate Card Batch".
3. Wizard: select faction, card type, archetype, quantity (e.g., 10 Ironwright creatures).
4. Click "Generate". Server fires FLUX batch job via `admin/generate-batch` Supabase Edge Function.
5. Modal shows progress: "Generating 10 cards... [7/10 complete]". Auto-refreshes every 2s.
6. Batch complete: modal closes. Pending Review tab selected showing new cards.
7. Owner scrolls cards. For each: "Approve", "Reject", or click for detail view.
8. Rejected cards offer "Regenerate".
9. Approved cards immediately available in player packs.

Total owner effort: open browser → two clicks → review grid → approve/reject buttons.

---

## 17. Deep Linking & Notifications

### 17.1 URL Scheme

Registered in `Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>chaoscreatures</string></array>
  </dict>
</array>
```

Universal links (HTTPS) via `apple-app-site-association` hosted on Cloudflare Pages at `https://chaoscreatures.game/.well-known/apple-app-site-association`.

Deep link handling in `ChaosCreaturesApp`:
```swift
.onOpenURL { url in
    deepLinkVM.handle(url)
}
```

`deepLinkVM.handle(_:)` parses the URL path and sets `NavigationPath` state to push the appropriate destination.

### 17.2 Notification Types

Push notifications sent from Supabase Edge Functions via APNs.

| Notification | Trigger | Deep Link Target |
|---|---|---|
| "Card ready to evolve!" | Evolution threshold met | Card Detail screen for that card |
| "Daily quests reset" | 00:00 UTC daily | Home screen |
| "Match found!" | Matchmaking match | Battle screen |
| Game announcement | Admin sends announcement | Alert on Home screen |

Notification registration:
```swift
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
    if granted { DispatchQueue.main.async { UIApplication.shared.registerForRemoteNotifications() } }
}
```

Device token sent to Supabase `player_devices` table via `player/register-device` Edge Function.

All notifications respect per-type toggles in Settings (`@AppStorage` flags sent to server on change).

---

## 18. File & Project Structure

### 18.1 iOS App Project Structure

```
ChaosCreatures/
├── App/
│   ├── ChaosCreaturesApp.swift          @main entry point
│   └── AppDelegate.swift                Orientation lock, APNs
├── Sources/
│   ├── Battle/
│   │   ├── BattleView.swift             SwiftUI wrapper (ZStack)
│   │   ├── BattleViewModel.swift
│   │   ├── BattleScene.swift            SKScene subclass
│   │   ├── BoardCardNode.swift          SKSpriteNode subclass
│   │   ├── D20Node.swift                SKShapeNode subclass
│   │   ├── PhaseIndicatorNode.swift
│   │   ├── EventOverlayNode.swift
│   │   ├── BattleLogOverlay.swift       SKNode panel
│   │   └── HUD/
│   │       ├── PlayerHUDView.swift
│   │       ├── OpponentHUDView.swift
│   │       ├── HPBarView.swift
│   │       ├── TimerBarView.swift
│   │       ├── ManaRowView.swift
│   │       ├── HandScrollView.swift
│   │       ├── CardInHandView.swift
│   │       └── EndTurnButton.swift
│   ├── Collection/
│   │   ├── CollectionView.swift
│   │   ├── CollectionViewModel.swift
│   │   ├── CardGridItemView.swift
│   │   ├── FactionTabBar.swift
│   │   ├── FilterBar.swift
│   │   └── FilterPanelView.swift
│   ├── DeckBuilder/
│   │   ├── DeckBuilderView.swift
│   │   ├── DeckBuilderViewModel.swift
│   │   ├── DeckContentsPanel.swift
│   │   ├── CardPoolPanel.swift
│   │   └── DeckStatsSummaryBar.swift
│   ├── Evolution/
│   │   ├── EvolutionFlowView.swift
│   │   ├── EvolutionViewModel.swift
│   │   ├── EvolutionLoadingScene.swift   SKScene
│   │   ├── ArtRevealView.swift
│   │   ├── NameSelectionView.swift
│   │   ├── AbilityRevealView.swift
│   │   ├── ModifierSelectionView.swift
│   │   ├── FlavorRevealView.swift
│   │   └── EvolutionSummaryView.swift
│   ├── Shop/
│   │   ├── ShopView.swift
│   │   ├── ShopViewModel.swift
│   │   ├── SubscriptionCardView.swift
│   │   ├── PackOpeningView.swift
│   │   └── StoreKitManager.swift
│   ├── Onboarding/
│   │   ├── OnboardingFlowView.swift
│   │   ├── IntroCinematicView.swift
│   │   ├── FactionSelectionView.swift
│   │   ├── TutorialOverlayView.swift
│   │   └── TutorialViewModel.swift
│   ├── Profile/
│   │   ├── ProfileView.swift
│   │   └── AchievementsView.swift
│   ├── Settings/
│   │   └── SettingsView.swift
│   ├── PostMatch/
│   │   ├── PostMatchResultsView.swift
│   │   └── PostMatchViewModel.swift
│   ├── Shared/
│   │   ├── CardDetailView.swift
│   │   ├── GraveyardSheet.swift
│   │   ├── ToastView.swift
│   │   ├── ToastViewModel.swift
│   │   ├── HapticManager.swift
│   │   └── CardArtPlaceholder.swift
│   ├── Models/
│   │   ├── CardInstance.swift
│   │   ├── MatchState.swift
│   │   └── PlayerProfile.swift
│   ├── Services/
│   │   ├── SupabaseService.swift
│   │   ├── RealtimeService.swift
│   │   └── DeepLinkViewModel.swift
│   └── Constants/
│       ├── Colors.swift
│       ├── Typography.swift
│       └── CardConstants.swift
├── Resources/
│   ├── Assets.xcassets/
│   │   ├── AppIcon.appiconset/
│   │   ├── CardBacks/
│   │   ├── FactionIcons/
│   │   ├── KeywordIcons/
│   │   └── ShardIcons/
│   ├── Fonts/
│   │   └── CardDisplayFont.ttf
│   ├── Particles/
│   │   ├── DeathEmitter_Ironwright.sks
│   │   ├── DeathEmitter_FeyCourts.sks
│   │   ├── DeathEmitter_Demonic.sks
│   │   └── VictoryConfetti.sks
│   └── Sounds/
│       ├── reveal.caf
│       └── onboarding_intro.caf
├── Tests/
│   ├── BattleLogicTests.swift
│   └── EvolutionFlowTests.swift
└── ChaosCreatures.xcodeproj
```

### 18.2 Admin Dashboard Project Structure

```
admin-dashboard/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Cards.tsx
│   │   ├── Evolution.tsx
│   │   ├── Players.tsx
│   │   ├── Economy.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── CardGrid.tsx
│   │   ├── GenerateBatchModal.tsx
│   │   ├── PlayerTable.tsx
│   │   └── StatCard.tsx
│   ├── services/
│   │   └── supabase.ts
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

### 18.3 Asset Naming Convention

```
[category]_[element]_[variant]_[state]@[scale]x.png
```

Examples:
- `icon_chaos_mote_filled@2x.png`
- `icon_shard_uncommon@2x.png`
- `icon_keyword_taunt@2x.png`
- `avatar_ironwright_aldric_portrait@2x.png`

SVG format is not used in SpriteKit (not supported). All icons are PNG at 1x, 2x, 3x in `Assets.xcassets`. SwiftUI `Image` picks the appropriate scale automatically.

Sound files: `.caf` format (Core Audio Format) — Apple's recommended format for iOS game audio. Converted from source WAV/MP3 using `afconvert` command-line tool.

---

## 19. Open Questions & Post-Launch Enhancements

### Resolved for MVP

- Orientation: portrait-only in battle and evolution. All others allow rotation.
- Card flip interaction: implemented in Card Detail via `.rotation3DEffect`.
- Admin dashboard: separate React + Vite web app on Railway.
- No RevenueCat: StoreKit 2 direct.
- No React Native, no Expo, no TypeScript client.

### Deferred to Post-Launch

- Landscape battle mode.
- Light theme.
- Advanced battle log filters.
- Deck import/export via share codes.
- Card comparison tool.
- Collection stats dashboard.
- Battle replay viewer.
- Full VoiceOver turn-by-turn battle navigation.
- `SCNNode` 3D card flip animation (currently 2D `.rotation3DEffect`).

### Post-Launch Monitoring (via PostHog)

- Turn timeout rate: if >15% of turns end by timer, increase to 75s (adjust `game_config` via admin settings).
- Evolution flow completion rate: if <70% complete all 9 steps, simplify to fewer steps.
- Modifier selection time: if >30s average, reduce to 2 options across all tiers.
- Pack purchase conversion after graveyard view.

---

## Revision Log

### Version 3.0 — 2026-02-16

**Platform Migration: React Native/Expo/TypeScript → Native iOS Swift/SwiftUI/SpriteKit**

This revision is a full rewrite of the technology-specific sections of the document. All gameplay mechanics, screen inventory, navigation structure, color palette, and animation timing values are unchanged. Only the implementation details (component names, library calls, animation APIs) have been updated to match the actual platform.

#### Breaking Changes (Version 2.0 → 3.0)

1. **Removed all React Native, Expo, TypeScript client references.** Every `View`, `Pressable`, `Animated.View`, `FlatList`, `ScrollView`, `GestureDetector`, Reanimated `withTiming/withSpring/withRepeat`, Skia Canvas, Zustand, TanStack Query, expo-haptics, expo-av, expo-in-app-purchases, expo-screen-orientation, @gorhom/bottom-sheet, and Expo Router path reference has been removed or replaced.

2. **Technology Stack table fully replaced.** Now lists: SwiftUI (UI framework), SpriteKit (battlefield), SwiftUI `NavigationStack` (navigation), SwiftUI `TabView` (tab bar), Supabase Swift SDK + `URLSession` (networking), StoreKit 2 (payments), `UIFeedbackGenerator` (haptics), PostHog iOS SDK (analytics), `AsyncImage` (card art), SwiftUI `@StateObject`/`@EnvironmentObject`/`@Observable` (state), `UserDefaults` (persistence), `AppDelegate` orientation lock.

3. **Removed Expo Router file-path routing.** Navigation is now `NavigationStack`, `NavigationPath`, `.sheet()`, `.fullScreenCover()`, and `.navigationDestination()`.

4. **Removed Google Play references.** iOS/App Store only. Removed `android_ripple` and Android-specific haptics notes.

#### Battlefield Screen Changes (Section 3)

5. **Battle screen architecture changed.** Was a single React Native `View` with Reanimated/Skia overlays. Is now a SwiftUI `ZStack` containing a `SpriteView` (hosting `BattleScene : SKScene`) with SwiftUI HUD views layered on top.

6. **All board card components converted to SpriteKit.** `BoardCardView` (React Native) → `BoardCardNode : SKSpriteNode`. Node hierarchy documented with `SKNode`, `SKSpriteNode`, `SKShapeNode`, `SKLabelNode`, `SKEffectNode`, `SKEmitterNode` types.

7. **HpBar converted from Skia Canvas to SwiftUI `GeometryReader`.** Damage flash and shake now use SwiftUI `withAnimation(.easeOut)` / `withAnimation(.easeIn)` on `@State` vars.

8. **TimerBar converted from Reanimated to SwiftUI `Timer.publish`.** Urgent pulse uses `.repeatForever(autoreverses: true)`.

9. **D20 roll converted to SpriteKit.** Was Reanimated + Skia polygon. Now `D20Node : SKShapeNode` with `SKAction.rotate`, `SKAction.scale`, `SKAction.group` sequences. Roll state machine documented.

10. **PhaseIndicator converted to SpriteKit.** Was React Native `View` row + Reanimated. Now `SKNode` with `SKLabelNode` children. `SKAction.fadeAlpha` for transitions.

11. **All combat animations rewritten as SKAction sequences.** Card play, attacker glow, blocker drag, damage numbers, death, spell cast, chaos roll, event overlay all specified as `SKAction.sequence`, `SKAction.group`, `SKAction.repeatForever` calls with explicit `timingMode` settings.

12. **Death animation uses `SKEmitterNode` for faction-specific particles.** `.sks` particle files: `DeathEmitter_Ironwright`, `DeathEmitter_FeyCourts`, `DeathEmitter_Demonic`.

13. **Blocker assignment drag converted from RNGH `Gesture.Pan()` to SpriteKit `touchesMoved`.** `cardNode.frame.intersects(slotNode.frame)` for overlap detection.

14. **Battle Log converted from Reanimated slide panel to SpriteKit `SKNode`.** `SKAction.moveTo(x:duration:)` slide. `SKLabelNode` entries.

15. **Graveyard converted from Expo Router Modal to SwiftUI `.sheet()`.** `LazyVGrid` with 3 `GridItem(.flexible())` columns.

#### Evolution Screen Changes (Section 4)

16. **Evolution state machine converted from Zustand to `EvolutionViewModel` with Swift enum.** `enum EvolutionStep` with associated values replaces the string-constant states.

17. **Step 3 loading animation converted to `EvolutionLoadingScene : SKScene`.** SpriteKit phases: card dissolve (`SKAction.fadeOut` + `SKAction.scale`), shard materialize, orbit loop (`SKAction.repeatForever` + `SKAction.customAction` for chaos perturbation), shard crack. FLUX polling via Swift `Task` + `URLSession`.

18. **Step 4 art reveal converted to SwiftUI `RadialGradient` mask.** `revealProgress` state animated via `.easeOut(duration: 1.2)`. Tier badge bounce via `.spring(response: 0.4, dampingFraction: 0.5)`.

19. **Step 7 modifier selection uses SwiftUI horizontal `ScrollView` + `.transition(.move(edge: .bottom).combined(with: .opacity))` for confirm button appearance.**

20. **Step 8 flavor text typeout uses `Timer.scheduledTimer` in Swift.** 40ms per character interval.

21. **Step 9 share uses `ImageRenderer` (SwiftUI) + `ShareLink`.** Replaced `react-native-view-shot` + `expo-sharing`.

#### Collection & Deck Builder Changes (Section 5)

22. **Collection grid converted from `FlatList` to `LazyVGrid` with `.adaptive(minimum: 100)`.** Performance and responsiveness equivalent.

23. **Filter panel converted from `@gorhom/bottom-sheet` to SwiftUI `.sheet` with `Form` + `Section` groups.** `.presentationDetents([.large])`.

24. **Search converted from TanStack Query `enabled` flag to Swift `Task.sleep` debounce in `CollectionViewModel`.**

25. **Card detail "More Actions" converted from `ActionSheetIOS` to SwiftUI `Menu`.**

26. **Card flip converted from separate `Animated.View` + `rotateY` to `.rotation3DEffect(.degrees(cardFaceRotation), axis: (0, 1, 0))`.**

27. **Deck Builder tablet detection converted from `useWindowDimensions()` to `@Environment(\.horizontalSizeClass)`.**

28. **Deck contents list converted from `FlatList` + `Gesture.LongPress` to SwiftUI `List` + `.swipeActions`.**

#### Shop Screen Changes (Section 6)

29. **All IAP calls converted from `expo-in-app-purchases` to StoreKit 2.** `product.purchase()` in `async` context. `Product.PurchaseResult` enum handling. `transaction.finish()` for acknowledgment.

30. **Pack opening flip animation converted from Reanimated `rotateY` to SwiftUI `.rotation3DEffect`.**

31. **Subscription tier cards converted from `expo-linear-gradient` `LinearGradient` to SwiftUI native `LinearGradient`.**

32. **Upgrade prompt converted from Reanimated `SlideInUp` to SwiftUI `.transition(.move(edge: .bottom).combined(with: .opacity))`.**

#### Onboarding Changes (Section 7)

33. **Onboarding state storage converted from `AsyncStorage` key to `@AppStorage("onboardingComplete")`.**

34. **Root switch from onboarding to main app now uses `@AppStorage` boolean driving a conditional in `ChaosCreaturesApp.body`.**

35. **Tutorial spotlight mask converted from Skia canvas hole to SwiftUI `Canvas` drawing a full-screen rect with `blendMode(.destinationOut)` cutout.**

36. **Faction selection converted from `react-native-pager-view` to SwiftUI `TabView(.page)`.** `.tabViewStyle(.page(indexDisplayMode: .always))`.

#### Interaction Pattern Changes (Section 8)

37. **Minimum tap target enforcement updated.** Was `hitSlop` on React Native `Pressable`. Now `.contentShape(Rectangle())` + `.frame(minWidth: 44, minHeight: 44)` in SwiftUI. SpriteKit: expanded `CGRect` or transparent 44x44pt child node.

38. **All `expo-haptics` calls replaced with `UIFeedbackGenerator` calls via `HapticManager` singleton.** Explicit `prepare()` calls documented.

39. **Press feedback converted from Reanimated `useAnimatedStyle` to SwiftUI `@State var isPressed` + `.scaleEffect` + `.animation(.easeInOut(duration: 0.1))`.**

40. **Long press: `Gesture.LongPress()` from RNGH → SwiftUI `.onLongPressGesture(minimumDuration: 0.4)`.**

#### Animation Timing Changes (Section 10)

41. **All animation specs now reference SwiftUI `Animation` types:** `.spring(response:dampingFraction:)`, `.easeInOut(duration:)`, `.easeOut(duration:)`, `.linear(duration:)`, `.repeatForever(autoreverses:)`.

42. **SpriteKit animation specs reference `SKAction` types explicitly:** `SKAction.sequence`, `SKAction.group`, `SKAction.repeatForever`, `SKAction.fadeIn`, `SKAction.fadeOut`, `SKAction.scale`, `SKAction.move`, `SKAction.colorize`, `SKAction.rotate`, `SKAction.moveBy`, `SKAction.removeFromParent`, `SKAction.wait`, `SKAction.run`, `SKAction.customAction` with `.timingMode` values.

43. **Reduced motion check converted from `AccessibilityInfo.isReduceMotionEnabled()` (React Native) to `UIAccessibility.isReduceMotionEnabled` (Swift).** Stored in `@AppStorage`.

#### Error Handling Changes (Section 11)

44. **Network monitoring converted from `@react-native-community/netinfo` to `NWPathMonitor` (Network framework, native iOS).**

45. **Empty states now use iOS 17 `ContentUnavailableView`** with label, description, and actions closures.

46. **Toast provider converted from a `ToastProvider` Expo Router root component to a SwiftUI `@EnvironmentObject var toastVM: ToastViewModel`** with `.overlay` at `MainTabView` root.

#### Visual Styling Changes (Section 13)

47. **Color constants converted from TypeScript `export const Colors = {...} as const` to Swift `enum AppColors { static let ... = Color(hex: ...) }`.** `Color(hex:)` extension in `Extensions/Color+Hex.swift`.

48. **Typography converted from TypeScript constants to Swift `enum AppFont` with static methods.** System font (SF Pro) used for all UI. Custom display font loaded via `UIFont.registerFont`.

49. **Card size constants converted to Swift `enum CardSize` with `CGFloat` and `CGSize` values for both SwiftUI and SpriteKit contexts.**

50. **SVG icons removed.** SpriteKit does not support SVG. All icons are PNG in `Assets.xcassets` at 1x/2x/3x scales.

#### Settings Screen Changes (Section 14)

51. **Settings screen converted from `SectionList` + `Switch` / `Slider` / `Pressable` to SwiftUI `Form` + `Section` + `Toggle` + `Slider` + `Picker`.** `Toggle` replaces `Switch`. `Slider` from SwiftUI replaces `@react-native-community/slider`. `Picker` replaces custom `RadioGroup` navigation.

52. **Data export uses `ShareLink` (SwiftUI) instead of `expo-file-system` + `expo-sharing`.**

#### Post-Match Results Changes (Section 15)

53. **Result header victory animation converted from Reanimated `BounceIn` entering animation to SwiftUI `.spring(response: 0.5, dampingFraction: 0.5)` on `scaleEffect` + confetti via `SKEmitterNode` in an overlay `SpriteView`.**

54. **"Evolve Cards" button navigation uses `NavigationPath` push with filter parameter instead of Expo Router `router.push('/collection?filter=evolution-ready')`.**

#### Admin Dashboard Changes (Section 16)

55. **Admin dashboard clearly labeled as a separate web application** in its own Part B section. No SwiftUI or SpriteKit references. React + Vite + TypeScript stack confirmed.

56. **IAP Products section updated:** removed Google Play references. iOS/App Store only. Managed in App Store Connect.

57. **Shard costs confirmed at 30/60/120/240 Chaos Dust** (Uncommon/Rare/Epic/Legendary), matching `04-progression-economy.md` and `00-game-design-master.md`. Previous version 2.0 PRD values of 25/75/150/240 are incorrect and have been corrected (REVIEW.md CRIT-1 addressed).

#### File Structure Changes (Section 18)

58. **Project structure converted from Expo Router file-based structure** (`app/`, `components/`, `stores/`) **to Xcode project structure** (`ChaosCreatures/Sources/`, `ChaosCreatures/Resources/`, SpriteKit `.sks` particle files).

59. **Audio format changed from `.mp3` to `.caf`** (Core Audio Format — Apple's recommended format for iOS game audio).

60. **SVG removed from asset conventions.** All icons PNG in `Assets.xcassets`.

#### Deep Linking Changes (Section 17)

61. **Deep link scheme registration moved from Expo `app.json` to `Info.plist` `CFBundleURLTypes`.**

62. **Push notification registration converted from `expo-notifications` to native `UNUserNotificationCenter.current().requestAuthorization` + `UIApplication.shared.registerForRemoteNotifications`.**

63. **Deep link handling uses SwiftUI `.onOpenURL` modifier + `NavigationPath` state instead of Expo Router `router.push`.**

---

*Document Version: 3.0*
*Last Updated: 2026-02-16*
*Status: Revised — Native iOS Swift/SwiftUI/SpriteKit. StoreKit 2. App Store only. Admin dashboard as separate web application. All React Native / Expo / TypeScript client references removed. All SpriteKit and SwiftUI animation types specified. Ready for Claude Code iOS implementation.*

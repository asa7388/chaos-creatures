// BattleContainerView.swift
// Chaos Creatures
// Hosts the SpriteKit BattleScene with SwiftUI HUD overlay.
// Connects to MatchService on appear, routes server events to BattleViewModel,
// and transitions to PostMatchView on game over.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SwiftUI
import SpriteKit

/// Main battle view: ZStack of SpriteKit scene + SwiftUI HUD overlays.
/// SpriteKit handles the battlefield (boards, creatures, animations).
/// SwiftUI handles the HUD (HP bars, hand cards, action buttons).
struct BattleContainerView: View {

    let matchId: String

    @Environment(AppRouter.self) private var router

    @StateObject private var viewModel = BattleViewModel()
    @StateObject private var tutorialManager = TutorialManager()  // S-15
    @State private var matchService = MatchService.shared
    @State private var sceneSize: CGSize = .zero
    @State private var matchResult: MatchResultData?
    @State private var showSurrenderConfirm = false
    @State private var showBattleLog = false  // S-32
    @State private var actionBridge: ActionBridge?  // Strong ref to keep delegate alive

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Play mat felt texture behind SpriteKit
                Color.bgPrimary.ignoresSafeArea()
                Image("UIBackgrounds/bg-play-mat-felt")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.40)

                // SpriteKit battlefield
                SpriteView(scene: viewModel.createScene(size: geo.size))
                    .ignoresSafeArea()

                // SwiftUI HUD overlay
                VStack(spacing: 0) {
                    // Opponent HUD (top)
                    OpponentHUDView(
                        hp: viewModel.opponentHp,
                        maxHp: viewModel.opponentMaxHp,
                        handCount: viewModel.opponentHandCount,
                        deckCount: viewModel.opponentDeckCount,
                        instability: viewModel.opponentInstability
                    )
                    .padding(.top, 8)
                    .padding(.horizontal, 12)

                    // S-16: Turn timer bar
                    if viewModel.turnTimerActive {
                        TurnTimerBar(
                            timeRemaining: viewModel.turnTimeRemaining,
                            maxTime: viewModel.stateMachine.gameState?.turnTimerSeconds ?? 45,
                            isMyTurn: viewModel.isMyTurn
                        )
                        .padding(.horizontal, 12)
                        .padding(.top, 4)
                    }

                    // S-32: Battle log toggle + S-64: Connection quality indicator
                    HStack {
                        // S-64: Connection quality indicator
                        ConnectionQualityIndicator(quality: viewModel.connectionQuality)

                        Spacer()

                        Button(action: { showBattleLog.toggle() }) {
                            Image("UIIcons/ui-battle-log")
                                .renderingMode(.template)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 14, height: 14)
                                .foregroundColor(.textSecondary)
                                .padding(6)
                                .background(Color.bgPrimary.opacity(0.7))
                                .clipShape(Circle())
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.top, 4)

                    Spacer()

                    // Player HUD (bottom) + hand + controls
                    VStack(spacing: 4) {
                        // Action button
                        if viewModel.showPrimaryAction {
                            PrimaryActionButton(
                                label: viewModel.primaryActionLabel,
                                action: viewModel.performPrimaryAction
                            )
                            .padding(.horizontal, 20)
                        }

                        // Hand scroll view
                        HandScrollView(
                            hand: viewModel.hand,
                            selectedCardId: viewModel.selectedHandCardId,
                            canPlay: viewModel.stateMachine.canPlayCards,
                            currentMana: viewModel.playerMana,
                            onSelect: { cardId in
                                viewModel.selectHandCard(cardId)
                                // Tell the scene about the selected card for slot highlighting
                                let card = viewModel.hand.first(where: { $0.instanceId == cardId })
                                let needsSlot = card?.cardType == .creature || card?.cardType == .stabilizer || card?.cardType == .planarRuin
                                viewModel.battleScene?.setSelectedHandCard(cardId, needsSlot: needsSlot)
                            },
                            onPlay: { cardId in
                                // For spells, play immediately (no slot needed).
                                // For creatures/stabilizers, selection + board tap handles it.
                                let card = viewModel.hand.first(where: { $0.instanceId == cardId })
                                if card?.cardType == .spell {
                                    viewModel.playCard(cardId)
                                    viewModel.battleScene?.setSelectedHandCard(nil, needsSlot: false)
                                } else {
                                    // Select and wait for board slot tap
                                    viewModel.selectHandCard(cardId)
                                    viewModel.battleScene?.setSelectedHandCard(cardId, needsSlot: true)
                                }
                            }
                        )
                        .frame(height: 120)

                        // Player HUD
                        PlayerHUDView(
                            hp: viewModel.playerHp,
                            maxHp: viewModel.playerMaxHp,
                            mana: viewModel.playerMana,
                            manaCap: viewModel.playerManaCap,
                            deckCount: viewModel.playerDeckCount,
                            graveyardCount: viewModel.playerGraveyardCount,
                            hasChaosSpark: viewModel.hasChaosSpark,
                            onChaosSpark: viewModel.useChaosSpark,
                            onSurrender: { showSurrenderConfirm = true },
                            onGraveyard: { viewModel.showGraveyard = true }
                        )
                        .padding(.horizontal, 12)
                        .padding(.bottom, 8)
                    }
                }

                // Connection lost overlay
                if !viewModel.isConnected {
                    ConnectionLostOverlay()
                }

                // S-15: Tutorial overlay
                TutorialOverlayView(manager: tutorialManager)
            }
            .onAppear {
                sceneSize = geo.size
            }
        }
        .ignoresSafeArea()
        .statusBarHidden()
        .task {
            await connectToMatch()
            // S-15: Start tutorial for first practice match
            tutorialManager.startIfNeeded(isPracticeMode: router.selectedGameMode == .practice)
            // S-64: Start connection quality monitoring
            viewModel.startConnectionMonitor()
        }
        .onDisappear {
            Task {
                await matchService.disconnect()
            }
            viewModel.stopConnectionMonitor()
        }
        .alert("Surrender?", isPresented: $showSurrenderConfirm) {
            Button("Surrender", role: .destructive) {
                viewModel.surrender()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You will lose this match if you surrender.")
        }
        .onChange(of: viewModel.currentPhase) { _, newPhase in
            // S-15: Notify tutorial of phase changes
            tutorialManager.onPhaseChange(newPhase)

            if newPhase == .gameOver {
                // Build match result data from the view model's state
                handleGameOver()
            }
        }
        // S-41: Graveyard sheet
        .sheet(isPresented: $viewModel.showGraveyard) {
            GraveyardSheetView(graveyardCount: viewModel.playerGraveyardCount)
        }
        // S-32: Battle log sheet
        .sheet(isPresented: $showBattleLog) {
            BattleLogSheetView(entries: viewModel.battleLog)
        }
    }

    // MARK: - Match Connection

    private func connectToMatch() async {
        guard let playerId = await SupabaseService.shared.currentUserID else {
            viewModel.isConnected = false
            return
        }

        // Wire MatchService events to BattleViewModel
        matchService.onGameEvent = { [weak viewModel] event in
            viewModel?.handleServerEvent(event)
        }

        matchService.onConnectionStateChange = { [weak viewModel] connected in
            viewModel?.isConnected = connected
        }

        // Connect to the match channel
        try? await matchService.connect(matchId: matchId, playerId: playerId)

        // Wire BattleScene delegate for player actions
        let bridge = ActionBridge(matchService: matchService, matchId: matchId, playerId: playerId)
        actionBridge = bridge  // Keep strong reference (battleDelegate is weak)
        viewModel.battleScene?.battleDelegate = bridge
    }

    // MARK: - Game Over

    private func handleGameOver() {
        // Extract result data from the current game state
        let state = viewModel.stateMachine.gameState
        let isWinner: Bool
        if let winner = state?.winner, let mySide = state?.mySide {
            isWinner = winner == mySide
        } else {
            isWinner = false
        }

        matchResult = MatchResultData(
            matchId: matchId,
            isVictory: isWinner,
            playerFinalHp: viewModel.playerHp,
            opponentFinalHp: viewModel.opponentHp,
            totalTurns: viewModel.currentTurn,
            xpEarned: isWinner ? 25 : 10, // Base XP values
            dustEarned: isWinner ? 5 : 2   // Base dust values
        )

        // Short delay for match-end animation, then transition
        Task {
            try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds
            await matchService.disconnect()
            router.dismissBattle()
        }
    }
}

// MARK: - Action Bridge (BattleScene -> MatchService)

/// Bridges BattleScene delegate actions to MatchService.
/// BattleScene sends PlayerAction, this bridge forwards to the server.
@MainActor
private class ActionBridge: @preconcurrency BattleSceneDelegate {
    let matchService: MatchService
    let matchId: String
    let playerId: UUID

    init(matchService: MatchService, matchId: String, playerId: UUID) {
        self.matchService = matchService
        self.matchId = matchId
        self.playerId = playerId
    }

    func battleScene(_ scene: BattleScene, didSelectHandCard cardId: String) {
        // Hand card selection is handled by BattleViewModel directly
    }

    func battleScene(_ scene: BattleScene, didRequestAction action: PlayerAction) {
        Task {
            await matchService.sendAction(action)
        }
    }

    func battleSceneDidTapAvatar(_ scene: BattleScene, isPlayer: Bool) {
        // Avatar tap is handled by BattleViewModel
    }
}

// MARK: - Match Result Data

struct MatchResultData {
    let matchId: String
    let isVictory: Bool
    let playerFinalHp: Int
    let opponentFinalHp: Int
    let totalTurns: Int
    let xpEarned: Int
    let dustEarned: Int
}

// MARK: - Opponent HUD

struct OpponentHUDView: View {
    let hp: Int
    let maxHp: Int
    let handCount: Int
    let deckCount: Int
    let instability: Int

    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 12) {
                // S-31: HP bar
                HPBarView(current: hp, max: maxHp, height: 10, showLabel: true, fontSize: 11)
                    .frame(maxWidth: 120)

                Spacer()

                // Hand count
                HStack(spacing: 4) {
                    Image(systemName: "rectangle.portrait.fill")
                        .foregroundColor(.textSecondary)
                        .font(.system(size: 10))  // SF Symbol icon size - keep as-is
                    Text("\(handCount)")
                        .font(CardFont.stats(size: 12))
                        .foregroundColor(.textSecondary)
                }

                // Deck count
                HStack(spacing: 4) {
                    Image(systemName: "square.stack.fill")
                        .foregroundColor(.textSecondary)
                        .font(.system(size: 10))  // SF Symbol icon size - keep as-is
                    Text("\(deckCount)")
                        .font(CardFont.stats(size: 12))
                        .foregroundColor(.textSecondary)
                }

                // Instability
                HStack(spacing: 4) {
                    Image("StatIcons/instability-indicator")
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 10, height: 10)
                        .foregroundColor(instabilityColor)
                    Text("\(instability)")
                        .font(CardFont.stats(size: 12))
                        .foregroundColor(instabilityColor)
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(Color.bgPrimary.opacity(0.8))
        .cornerRadius(8)
    }

    private var instabilityColor: Color {
        if instability >= 15 { return .chaosRed }
        if instability <= 4 { return .orderBlue }
        return .white
    }
}

// MARK: - Player HUD

struct PlayerHUDView: View {
    let hp: Int
    let maxHp: Int
    let mana: Int
    let manaCap: Int
    let deckCount: Int
    let graveyardCount: Int
    let hasChaosSpark: Bool
    let onChaosSpark: () -> Void
    let onSurrender: () -> Void
    let onGraveyard: () -> Void

    var body: some View {
        VStack(spacing: 4) {
            // S-31: HP bar row
            HStack(spacing: 8) {
                HPBarView(current: hp, max: maxHp, height: 12, showLabel: true, fontSize: 12)
                    .frame(maxWidth: 140)

                // Chaos Motes (CM)
                HStack(spacing: 4) {
                    Image("StatIcons/chaos-motes")
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 12, height: 12)
                        .foregroundColor(.timerBlue)
                    Text("\(mana)/\(manaCap)")
                        .font(CardFont.stats(size: 13))
                        .foregroundColor(.textPrimary)
                }

                Spacer()

                // Chaos Spark button
                if hasChaosSpark {
                    Button(action: onChaosSpark) {
                        Image("UIIcons/ui-chaos-spark")
                            .renderingMode(.template)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 22, height: 22)
                            .foregroundColor(.warningYellow)
                    }
                }

                // Graveyard
                Button(action: onGraveyard) {
                    HStack(spacing: 2) {
                        Image(systemName: "archivebox.fill")
                            .font(.system(size: 11))  // SF Symbol icon size - keep as-is
                        Text("\(graveyardCount)")
                            .font(CardFont.stats(size: 11))
                    }
                    .foregroundColor(.textSecondary)
                }

                // Deck count
                HStack(spacing: 2) {
                    Image(systemName: "square.stack.fill")
                        .font(.system(size: 11))  // SF Symbol icon size - keep as-is
                    Text("\(deckCount)")
                        .font(CardFont.stats(size: 11))
                }
                .foregroundColor(.textSecondary)

                // Surrender (menu)
                Button(action: onSurrender) {
                    Image(systemName: "flag.fill")
                        .foregroundColor(.textTertiary)
                        .font(.system(size: 14))  // SF Symbol icon size - keep as-is
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(Color.bgPrimary.opacity(0.8))
        .cornerRadius(8)
    }
}

// MARK: - Hand Scroll View

struct HandScrollView: View {
    let hand: [BattleCardData]
    let selectedCardId: String?
    let canPlay: Bool
    let currentMana: Int
    let onSelect: (String?) -> Void
    let onPlay: (String) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(hand) { card in
                    HandCardView(
                        card: card,
                        isSelected: card.instanceId == selectedCardId,
                        canAfford: card.manaCost <= currentMana && canPlay,
                        onTap: {
                            if card.instanceId == selectedCardId {
                                // Double-tap to play
                                if card.manaCost <= currentMana && canPlay {
                                    onPlay(card.instanceId)
                                }
                            } else {
                                onSelect(card.instanceId)
                            }
                        }
                    )
                }
            }
            .padding(.horizontal, 12)
        }
        .background(Color.bgPrimary.opacity(0.6))
    }
}

// MARK: - Hand Card View (SwiftUI)

struct HandCardView: View {
    let card: BattleCardData
    let isSelected: Bool
    let canAfford: Bool
    let onTap: () -> Void

    var body: some View {
        VStack(spacing: 2) {
            // Card art placeholder
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.factionPrimary(card.factionShortName ?? .ironwright).opacity(0.3))
                .frame(width: 60, height: 48)

            // Name
            Text(card.name.prefix(8))
                .font(CardFont.bodyBold(size: 8))
                .foregroundColor(.textPrimary)
                .lineLimit(1)

            // Stats
            if card.cardType == .planarRuin, let hp = card.baseHealth {
                Text("HP \(hp)")
                    .font(CardFont.stats(size: 9))
                    .foregroundColor(.textSecondary)
            } else if let atk = card.baseAttack, let hp = card.baseHealth {
                Text("\(atk)/\(hp)")
                    .font(CardFont.stats(size: 9))
                    .foregroundColor(.textSecondary)
            } else {
                Text(card.cardType == .stabilizer ? "Stabilizer" : "Spell")
                    .font(CardFont.body(size: 9))
                    .foregroundColor(.textSecondary)
            }
        }
        .frame(width: 64, height: 100)
        .background(Color.bgTertiary)
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(
                    isSelected ? Color.orderBlue : (canAfford ? Color.factionPrimary(card.factionShortName ?? .ironwright).opacity(0.4) : Color.textDisabled),
                    lineWidth: isSelected ? 2 : 1
                )
        )
        .overlay(alignment: .topLeading) {
            // CM cost badge
            Text("\(card.manaCost)")
                .font(CardFont.stats(size: 10))
                .foregroundColor(.textPrimary)
                .frame(width: 18, height: 18)
                .background(canAfford ? Color.timerBlue : Color.textDisabled)
                .clipShape(Circle())
                .offset(x: -4, y: -4)
        }
        .opacity(canAfford ? 1.0 : 0.6)
        .scaleEffect(isSelected ? 1.08 : 1.0)
        .animation(.easeInOut(duration: 0.15), value: isSelected)
        .onTapGesture(perform: onTap)
    }
}

// MARK: - Primary Action Button

struct PrimaryActionButton: View {
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(CardFont.bodyBold(size: 15))
                .foregroundColor(.textPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.orderBlue)
                .cornerRadius(8)
        }
    }
}

// MARK: - Connection Lost Overlay

struct ConnectionLostOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.7)
            VStack(spacing: 12) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                Text("Reconnecting...")
                    .font(CardFont.bodyBold(size: 16))
                    .foregroundColor(.textPrimary)
            }
        }
        .ignoresSafeArea()
    }
}

// MARK: - S-31: HP Bar View

struct HPBarView: View {
    let current: Int
    let max: Int
    let height: CGFloat
    let showLabel: Bool
    let fontSize: CGFloat

    private var ratio: Double {
        guard max > 0 else { return 0 }
        return Double(current) / Double(max)
    }

    private var barColor: Color {
        if ratio > 0.6 { return .healGreen }
        if ratio > 0.3 { return .warningYellow }
        return .chaosRed
    }

    var body: some View {
        HStack(spacing: 4) {
            Image("StatIcons/heart-hp")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: fontSize, height: fontSize)
                .foregroundColor(.chaosRed)

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background
                    RoundedRectangle(cornerRadius: height / 2)
                        .fill(Color.bgQuaternary)

                    // Fill
                    RoundedRectangle(cornerRadius: height / 2)
                        .fill(
                            LinearGradient(
                                colors: [barColor, barColor.opacity(0.7)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * CGFloat(ratio))
                        .animation(.easeInOut(duration: 0.3), value: current)
                }
            }
            .frame(height: height)

            if showLabel {
                Text("\(current)")
                    .font(CardFont.stats(size: fontSize))
                    .foregroundColor(.textPrimary)
                    .frame(minWidth: 20, alignment: .trailing)
            }
        }
    }
}

// MARK: - S-16: Turn Timer Bar

struct TurnTimerBar: View {
    let timeRemaining: Int
    let maxTime: Int
    let isMyTurn: Bool

    private var ratio: Double {
        guard maxTime > 0 else { return 0 }
        return Double(timeRemaining) / Double(maxTime)
    }

    private var timerColor: Color {
        if timeRemaining <= 5 { return .chaosRed }
        if timeRemaining <= 15 { return .warningYellow }
        return .timerBlue
    }

    var body: some View {
        HStack(spacing: 6) {
            Image("UIIcons/ui-hourglass")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 10, height: 10)
                .foregroundColor(timerColor)

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.bgQuaternary)

                    RoundedRectangle(cornerRadius: 3)
                        .fill(timerColor)
                        .frame(width: geometry.size.width * CGFloat(ratio))
                        .animation(.linear(duration: 1), value: timeRemaining)
                }
            }
            .frame(height: 6)

            Text("\(timeRemaining)s")
                .font(CardFont.stats(size: 11))
                .foregroundColor(timerColor)
                .frame(minWidth: 30, alignment: .trailing)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.bgPrimary.opacity(0.8))
        .cornerRadius(6)
    }
}

// MARK: - S-41: Graveyard Sheet

struct GraveyardSheetView: View {
    let graveyardCount: Int
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                if graveyardCount == 0 {
                    VStack(spacing: 12) {
                        Spacer()
                        Image(systemName: "archivebox")
                            .font(.system(size: 40))  // SF Symbol icon size - keep as-is
                            .foregroundColor(.textDisabled)
                        Text("No cards in graveyard")
                            .font(CardFont.body(size: 15))
                            .foregroundColor(.textSecondary)
                        Spacer()
                    }
                } else {
                    VStack(spacing: 8) {
                        Text("\(graveyardCount) card(s) in graveyard")
                            .font(CardFont.body(size: 15))
                            .foregroundColor(.textSecondary)
                            .padding(.top, 16)

                        Text("Destroyed creatures are sent here.")
                            .font(CardFont.body(size: 13))
                            .foregroundColor(.textTertiary)

                        Spacer()
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.bgPrimary)
            .navigationTitle("Graveyard")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

// MARK: - S-32: Battle Log Sheet

struct BattleLogSheetView: View {
    let entries: [BattleLogEntry]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(entries) { entry in
                            HStack(spacing: 8) {
                                Group {
                                    if entry.type.isCustomIcon {
                                        Image(entry.type.iconName)
                                            .renderingMode(.template)
                                            .resizable()
                                            .aspectRatio(contentMode: .fit)
                                            .frame(width: 10, height: 10)
                                    } else {
                                        Image(systemName: entry.type.iconName)
                                            .font(.system(size: 10))
                                    }
                                }
                                    .foregroundColor(entry.type.color)
                                    .frame(width: 16)

                                Text("T\(entry.turn)")
                                    .font(CardFont.stats(size: 10))
                                    .foregroundColor(.textTertiary)
                                    .frame(width: 24)

                                Text(entry.message)
                                    .font(CardFont.body(size: 12))
                                    .foregroundColor(.textSecondary)
                                    .lineLimit(2)

                                Spacer()
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .id(entry.id)
                        }
                    }
                    .padding(.vertical, 8)
                }
                .onAppear {
                    if let last = entries.last {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
            .background(Color.bgPrimary)
            .navigationTitle("Battle Log")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

// MARK: - S-64: Connection Quality Indicator

struct ConnectionQualityIndicator: View {
    let quality: ConnectionQuality

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: quality.iconName)
                .font(.system(size: 12))  // SF Symbol icon size - keep as-is
                .foregroundColor(indicatorColor)

            if quality == .poor || quality == .disconnected {
                Text(quality == .disconnected ? "Offline" : "Weak")
                    .font(CardFont.bodyBold(size: 10))
                    .foregroundColor(indicatorColor)
            }
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(Color.bgPrimary.opacity(0.7))
        .cornerRadius(6)
    }

    private var indicatorColor: Color {
        switch quality {
        case .good: return .green
        case .degraded: return .yellow
        case .poor: return .red
        case .disconnected: return .gray
        }
    }
}

#Preview {
    BattleContainerView(matchId: "preview-match")
        .preferredColorScheme(.dark)
        .environment(AppRouter())
}

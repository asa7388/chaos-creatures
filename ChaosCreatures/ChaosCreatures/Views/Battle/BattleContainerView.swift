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
    @State private var matchService = MatchService.shared
    @State private var sceneSize: CGSize = .zero
    @State private var matchResult: MatchResultData?
    @State private var showSurrenderConfirm = false
    @State private var actionBridge: ActionBridge?  // Strong ref to keep delegate alive

    var body: some View {
        GeometryReader { geo in
            ZStack {
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
                            onSelect: { cardId in viewModel.selectHandCard(cardId) },
                            onPlay: { cardId in viewModel.playCard(cardId) }
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
            }
            .onAppear {
                sceneSize = geo.size
            }
        }
        .ignoresSafeArea()
        .statusBarHidden()
        .task {
            await connectToMatch()
        }
        .onDisappear {
            Task {
                await matchService.disconnect()
            }
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
            if newPhase == .gameOver {
                // Build match result data from the view model's state
                handleGameOver()
            }
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
        await matchService.connect(matchId: matchId, playerId: playerId)

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
private class ActionBridge: BattleSceneDelegate {
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

    @MainActor
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
        HStack(spacing: 12) {
            // HP
            HStack(spacing: 4) {
                Image(systemName: "heart.fill")
                    .foregroundColor(.chaosRed)
                    .font(.system(size: 12))
                Text("\(hp)/\(maxHp)")
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            }

            Spacer()

            // Hand count
            HStack(spacing: 4) {
                Image(systemName: "rectangle.portrait.fill")
                    .foregroundColor(.textSecondary)
                    .font(.system(size: 10))
                Text("\(handCount)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.textSecondary)
            }

            // Deck count
            HStack(spacing: 4) {
                Image(systemName: "square.stack.fill")
                    .foregroundColor(.textSecondary)
                    .font(.system(size: 10))
                Text("\(deckCount)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.textSecondary)
            }

            // Instability
            HStack(spacing: 4) {
                Image(systemName: "bolt.fill")
                    .foregroundColor(instabilityColor)
                    .font(.system(size: 10))
                Text("\(instability)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(instabilityColor)
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
        HStack(spacing: 12) {
            // HP
            HStack(spacing: 4) {
                Image(systemName: "heart.fill")
                    .foregroundColor(.chaosRed)
                    .font(.system(size: 14))
                Text("\(hp)/\(maxHp)")
                    .font(.system(size: 15, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            }

            // Mana
            HStack(spacing: 4) {
                Image(systemName: "drop.fill")
                    .foregroundColor(.timerBlue)
                    .font(.system(size: 12))
                Text("\(mana)/\(manaCap)")
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            }

            Spacer()

            // Chaos Spark button
            if hasChaosSpark {
                Button(action: onChaosSpark) {
                    Image(systemName: "bolt.circle.fill")
                        .foregroundColor(.warningYellow)
                        .font(.system(size: 22))
                }
            }

            // Graveyard
            Button(action: onGraveyard) {
                HStack(spacing: 2) {
                    Image(systemName: "archivebox.fill")
                        .font(.system(size: 11))
                    Text("\(graveyardCount)")
                        .font(.system(size: 11, weight: .semibold))
                }
                .foregroundColor(.textSecondary)
            }

            // Deck count
            HStack(spacing: 2) {
                Image(systemName: "square.stack.fill")
                    .font(.system(size: 11))
                Text("\(deckCount)")
                    .font(.system(size: 11, weight: .semibold))
            }
            .foregroundColor(.textSecondary)

            // Surrender (menu)
            Button(action: onSurrender) {
                Image(systemName: "flag.fill")
                    .foregroundColor(.textTertiary)
                    .font(.system(size: 14))
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
                .font(.system(size: 8, weight: .semibold))
                .foregroundColor(.white)
                .lineLimit(1)

            // Stats
            if let atk = card.baseAttack, let hp = card.baseHealth {
                Text("\(atk)/\(hp)")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.textSecondary)
            } else {
                Text("Spell")
                    .font(.system(size: 9))
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
            // Mana cost badge
            Text("\(card.manaCost)")
                .font(.system(size: 10, weight: .heavy))
                .foregroundColor(.white)
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
                .font(.system(size: 15, weight: .bold))
                .foregroundColor(.white)
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
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
            }
        }
        .ignoresSafeArea()
    }
}

#Preview {
    BattleContainerView(matchId: "preview-match")
        .preferredColorScheme(.dark)
        .environment(AppRouter())
}

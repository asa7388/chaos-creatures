// BattleViewModel.swift
// Chaos Creatures
// ObservableObject bridging BattleStateMachine to SwiftUI HUD overlays.
// Source: docs/design/07-ui-ux-specs.md Section 3, docs/design/06-technical-architecture.md

import Foundation
import Combine
import SpriteKit

/// ViewModel for the battle SwiftUI overlay. Bridges BattleStateMachine
/// and BattleScene to SwiftUI views (hand, HUD, controls).
@MainActor
final class BattleViewModel: ObservableObject {

    // MARK: - Published State (for SwiftUI)

    @Published var hand: [BattleCardData] = []
    @Published var playerHp: Int = 20
    @Published var playerMaxHp: Int = 20
    @Published var playerMana: Int = 0
    @Published var playerManaCap: Int = 0
    @Published var playerInstability: Int = 10
    @Published var playerDeckCount: Int = 20
    @Published var playerGraveyardCount: Int = 0

    @Published var opponentHp: Int = 20
    @Published var opponentMaxHp: Int = 20
    @Published var opponentHandCount: Int = 0
    @Published var opponentDeckCount: Int = 20
    @Published var opponentInstability: Int = 10

    @Published var currentPhase: TurnPhase = .gameSetup
    @Published var isMyTurn: Bool = false
    @Published var currentTurn: Int = 0
    @Published var matchId: String = ""

    @Published var hasChaosSpark: Bool = false
    @Published var isAnimating: Bool = false
    @Published var showGraveyard: Bool = false
    @Published var isConnected: Bool = true

    @Published var selectedHandCardId: String?

    // MARK: - Internal

    let stateMachine = BattleStateMachine()
    private(set) var battleScene: BattleScene?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Init

    init() {
        observeStateMachine()
    }

    // MARK: - Scene Setup

    /// Create and configure the BattleScene
    func createScene(size: CGSize) -> BattleScene {
        let scene = BattleScene(size: size)
        scene.scaleMode = .resizeFill
        scene.configure(stateMachine: stateMachine)
        self.battleScene = scene
        return scene
    }

    // MARK: - Observe State Machine

    private func observeStateMachine() {
        stateMachine.$currentPhase
            .assign(to: &$currentPhase)

        stateMachine.$isMyTurn
            .assign(to: &$isMyTurn)

        stateMachine.$currentTurn
            .assign(to: &$currentTurn)

        stateMachine.$isAnimating
            .assign(to: &$isAnimating)

        stateMachine.$matchId
            .assign(to: &$matchId)

        stateMachine.$gameState
            .compactMap { $0 }
            .sink { [weak self] state in
                self?.updateFromGameState(state)
            }
            .store(in: &cancellables)
    }

    private func updateFromGameState(_ state: ClientGameState) {
        hand = state.myHand
        playerHp = state.me.currentHp
        playerMaxHp = state.me.maxHp
        playerMana = state.me.currentMana
        playerManaCap = state.me.manaCap
        playerInstability = state.me.instability
        playerDeckCount = state.me.deckCount
        playerGraveyardCount = state.me.graveyardCount
        hasChaosSpark = state.me.hasChaosSpark
        isConnected = state.me.isConnected

        opponentHp = state.opponent.currentHp
        opponentMaxHp = state.opponent.maxHp
        opponentHandCount = state.opponent.handCount
        opponentDeckCount = state.opponent.deckCount
        opponentInstability = state.opponent.instability
    }

    // MARK: - Server Event Handling

    /// Called by MatchService when a server event arrives
    func handleServerEvent(_ event: ServerEvent) {
        stateMachine.handleServerEvent(event)
    }

    // MARK: - Player Actions

    /// Play a card from hand
    func playCard(_ cardId: String, targetSlot: Int? = nil, targetId: String? = nil) {
        guard stateMachine.canPlayCards else { return }
        guard let card = hand.first(where: { $0.instanceId == cardId }) else { return }
        guard card.manaCost <= playerMana else { return }

        selectedHandCardId = nil
        let action = PlayerAction.playCard(cardId: cardId, targetSlot: targetSlot, targetId: targetId)
        sendAction(action)
    }

    /// Select a card in hand (for preview or targeting)
    func selectHandCard(_ cardId: String?) {
        selectedHandCardId = cardId
    }

    /// Use chaos spark
    func useChaosSpark() {
        guard hasChaosSpark else { return }
        sendAction(.useChaosSpark)
    }

    /// End the main phase (go to combat)
    func endMainPhase() {
        guard currentPhase == .mainPhase, isMyTurn else { return }
        sendAction(.endMainPhase)
    }

    /// Confirm attacker declaration
    func confirmAttackers() {
        guard stateMachine.canDeclareAttackers else { return }
        let action = stateMachine.confirmAttackers()
        sendAction(action)
    }

    /// Confirm blocker assignments
    func confirmBlockers() {
        guard stateMachine.canAssignBlockers else { return }
        let action = stateMachine.confirmBlockers()
        sendAction(action)
    }

    /// End turn (skip remaining phases)
    func endTurn() {
        guard isMyTurn else { return }
        sendAction(.endTurn)
    }

    /// Surrender the match
    func surrender() {
        sendAction(.surrender)
    }

    /// Mulligan decision
    func mulligan(keep: Bool) {
        sendAction(.mulligan(keep: keep))
    }

    // MARK: - Helpers

    private func sendAction(_ action: PlayerAction) {
        battleScene?.battleDelegate?.battleScene(battleScene!, didRequestAction: action)
    }

    /// Whether a card can be played (enough mana + correct phase)
    func canPlayCard(_ card: BattleCardData) -> Bool {
        stateMachine.canPlayCards && card.manaCost <= playerMana
    }

    /// Primary action button label based on current phase
    var primaryActionLabel: String {
        switch currentPhase {
        case .mainPhase where isMyTurn:
            return "End Phase"
        case .declareAttackers where isMyTurn:
            return stateMachine.hasConfirmedAttackers ? "Waiting..." : "Confirm Attack"
        case .assignBlockers:
            return stateMachine.hasConfirmedBlockers ? "Waiting..." : "Confirm Block"
        default:
            return ""
        }
    }

    /// Whether the primary action button should be shown
    var showPrimaryAction: Bool {
        switch currentPhase {
        case .mainPhase where isMyTurn: return true
        case .declareAttackers where isMyTurn: return true
        case .assignBlockers: return true
        default: return false
        }
    }

    /// Perform the primary action for the current phase
    func performPrimaryAction() {
        switch currentPhase {
        case .mainPhase: endMainPhase()
        case .declareAttackers: confirmAttackers()
        case .assignBlockers: confirmBlockers()
        default: break
        }
    }
}

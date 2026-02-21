// BattleViewModel.swift
// Chaos Creatures
// ObservableObject bridging BattleStateMachine to SwiftUI HUD overlays.
// Source: docs/design/07-ui-ux-specs.md Section 3, docs/design/06-technical-architecture.md

import SwiftUI
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
    @Published var connectionQuality: ConnectionQuality = .good
    private var lastServerEventTime: Date = .now

    @Published var selectedHandCardId: String?

    // Stability zone: stabilizers the player has played this match
    @Published var playerStabilityZone: [BattleStabilizerData] = []
    @Published var stabilizersPlayedThisTurn: Int = 0

    // S-16: Turn timer
    @Published var turnTimeRemaining: Int = 0
    @Published var turnTimerActive: Bool = false
    private var timerTask: Task<Void, Never>?

    // S-41: Graveyard cards
    @Published var graveyardCards: [BattleCardData] = []

    // S-32: Battle log
    @Published var battleLog: [BattleLogEntry] = []

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
        playerStabilityZone = state.me.stabilityZone
        stabilizersPlayedThisTurn = state.me.stabilizersPlayedThisTurn

        opponentHp = state.opponent.currentHp
        opponentMaxHp = state.opponent.maxHp
        opponentHandCount = state.opponent.handCount
        opponentDeckCount = state.opponent.deckCount
        opponentInstability = state.opponent.instability
    }

    // MARK: - Server Event Handling

    /// Called by MatchService when a server event arrives
    func handleServerEvent(_ event: ServerEvent) {
        // S-64: Track last event time for connection quality indicator
        lastServerEventTime = .now
        if !isConnected {
            isConnected = true
        }
        connectionQuality = .good

        stateMachine.handleServerEvent(event)

        // S-16: Handle timer events
        switch event {
        case .phaseChanged(let data):
            if data.phase.isDecisionPhase {
                startTurnTimer(seconds: stateMachine.gameState?.turnTimerSeconds ?? 45)
            } else {
                stopTurnTimer()
            }
            // S-32: Log phase change
            addLogEntry(type: .phaseChange, message: "\(data.phase.displayName) phase")

        case .timerWarning(let data):
            turnTimeRemaining = data.secondsRemaining

        case .timerExpired:
            stopTurnTimer()
            addLogEntry(type: .system, message: "Timer expired")

        case .turnStart(let data):
            addLogEntry(type: .turnStart, message: "Turn \(data.turn)")

        case .chaosRoll(let data):
            addLogEntry(type: .chaosRoll, message: "D20 rolled \(data.roll) (\(data.result.rawValue))")

        case .cardPlayed(let data):
            addLogEntry(type: .cardPlayed, message: "\(data.card.name) played")

        case .creatureDestroyed(let data):
            // S-41: Track destroyed creatures for graveyard
            addLogEntry(type: .creatureDied, message: "Creature destroyed (\(data.cause))")

        case .hpChanged(let data):
            let delta = data.newHp - data.oldHp
            let sign = delta >= 0 ? "+" : ""
            addLogEntry(type: .hpChange, message: "HP \(sign)\(delta) (\(data.cause))")

        case .combatResolved(let data):
            addLogEntry(type: .combat, message: "\(data.pairs.count + data.unblocked.count) combat actions resolved")

        case .eventTriggered(let data):
            addLogEntry(type: .eventTriggered, message: "\(data.eventName): \(data.description)")

        case .ruinDestroyed(let data):
            addLogEntry(type: .creatureDied, message: "Ruin destroyed (\(data.cause))")

        case .ruinPassiveEffect(let data):
            addLogEntry(type: .eventTriggered, message: "\(data.ruinName): \(data.effectDescription)")

        default:
            break
        }
    }

    // MARK: - Player Actions

    /// Play a card from hand
    func playCard(_ cardId: String, targetSlot: Int? = nil, targetId: String? = nil) {
        guard stateMachine.canPlayCards else { return }
        guard let card = hand.first(where: { $0.instanceId == cardId }) else { return }

        // Stabilizers are free (0 motes). All other cards require mana.
        if card.cardType != .stabilizer {
            guard card.manaCost <= playerMana else { return }
        }

        // Stabilizers: max 1 per turn
        if card.cardType == .stabilizer {
            guard stabilizersPlayedThisTurn < 1 else { return }
        }

        selectedHandCardId = nil

        // For creatures and planar ruins, auto-select the first empty slot if none specified.
        // Stabilizers go directly to the stability zone — no board slot needed.
        var slot = targetSlot
        let needsSlot = card.cardType == .creature || card.cardType == .planarRuin
        if slot == nil && needsSlot {
            if let state = stateMachine.gameState {
                slot = state.me.board.firstIndex(where: { $0 == nil })
            }
        }

        let action = PlayerAction.playCard(cardId: cardId, targetSlot: slot, targetId: targetId)
        sendAction(action)
    }

    /// Activate a stabilizer's ability
    func activateStabilizer(instanceId: String) {
        guard stateMachine.canPlayCards else { return }
        sendAction(.activateStabilizer(instanceId: instanceId))
    }

    /// Select a card in hand (for preview or targeting)
    func selectHandCard(_ cardId: String?) {
        selectedHandCardId = cardId
    }

    /// Use chaos spark
    func useChaosSpark() {
        guard hasChaosSpark else { return }
        // SFX: chaos spark crackle
        BattleAudioManager.shared.playSFX(.chaosSpark)
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

    /// Whether a card can be played (enough CM + correct phase).
    /// Stabilizers are free (0 motes) but limited to 1 per turn.
    func canPlayCard(_ card: BattleCardData) -> Bool {
        guard stateMachine.canPlayCards else { return false }
        if card.cardType == .stabilizer {
            return stabilizersPlayedThisTurn < 1
        }
        return card.manaCost <= playerMana
    }

    // MARK: - S-16: Turn Timer

    private func startTurnTimer(seconds: Int) {
        stopTurnTimer()
        turnTimeRemaining = seconds
        turnTimerActive = true

        timerTask = Task { [weak self] in
            while let self, self.turnTimeRemaining > 0, !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if !Task.isCancelled {
                    self.turnTimeRemaining = max(0, self.turnTimeRemaining - 1)
                }
            }
            if !Task.isCancelled {
                self?.turnTimerActive = false
            }
        }
    }

    private func stopTurnTimer() {
        timerTask?.cancel()
        timerTask = nil
        turnTimerActive = false
    }

    // MARK: - S-64: Connection Quality Monitor

    private var connectionMonitorTask: Task<Void, Never>?

    func startConnectionMonitor() {
        connectionMonitorTask?.cancel()
        connectionMonitorTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 5_000_000_000) // 5 seconds
                guard let self, !Task.isCancelled else { return }

                if !self.isConnected {
                    self.connectionQuality = .disconnected
                } else {
                    let elapsed = Date().timeIntervalSince(self.lastServerEventTime)
                    if elapsed < 10 {
                        self.connectionQuality = .good
                    } else if elapsed < 20 {
                        self.connectionQuality = .degraded
                    } else {
                        self.connectionQuality = .poor
                    }
                }
            }
        }
    }

    func stopConnectionMonitor() {
        connectionMonitorTask?.cancel()
        connectionMonitorTask = nil
    }

    // MARK: - S-32: Battle Log

    private func addLogEntry(type: BattleLogEntryType, message: String) {
        let entry = BattleLogEntry(
            id: UUID(),
            timestamp: Date(),
            turn: currentTurn,
            type: type,
            message: message
        )
        battleLog.append(entry)
        // Keep log to a reasonable size
        if battleLog.count > 200 {
            battleLog.removeFirst(50)
        }
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
        // SFX: UI button tap
        BattleAudioManager.shared.playSFX(.buttonTap)

        switch currentPhase {
        case .mainPhase: endMainPhase()
        case .declareAttackers: confirmAttackers()
        case .assignBlockers: confirmBlockers()
        default: break
        }
    }
}

// MARK: - Connection Quality (S-64)

enum ConnectionQuality {
    case good       // Recent events received within 10s
    case degraded   // No events for 10-20s
    case poor       // No events for 20s+
    case disconnected

    var iconName: String {
        switch self {
        case .good: return "UIIcons/ui-world"
        case .degraded: return "UIIcons/ui-warning"
        case .poor: return "UIIcons/ui-defeat"
        case .disconnected: return "UIIcons/ui-defeat"
        }
    }

    var color: String {
        switch self {
        case .good: return "green"
        case .degraded: return "yellow"
        case .poor: return "red"
        case .disconnected: return "gray"
        }
    }
}

// MARK: - Battle Log Entry (S-32)

enum BattleLogEntryType: String {
    case turnStart = "TURN"
    case phaseChange = "PHASE"
    case chaosRoll = "ROLL"
    case cardPlayed = "CARD"
    case creatureDied = "DEATH"
    case hpChange = "HP"
    case combat = "COMBAT"
    case eventTriggered = "EVENT"
    case system = "SYSTEM"

    var iconName: String {
        switch self {
        case .turnStart: return "UIIcons/ui-refresh"
        case .phaseChange: return "UIIcons/ui-arrow-right"
        case .chaosRoll: return "UIIcons/ui-chaos-rift"
        case .cardPlayed: return "UIIcons/ui-mission-cards"
        case .creatureDied: return "UIIcons/ui-trigger-death"
        case .hpChange: return "StatIcons/heart-hp"
        case .combat: return "UIIcons/ui-trigger-attack"
        case .eventTriggered: return "UIIcons/ui-chaos-spark"
        case .system: return "UIIcons/ui-settings"
        }
    }

    var color: Color {
        switch self {
        case .turnStart: return .textSecondary
        case .phaseChange: return .orderBlue
        case .chaosRoll: return .warningYellow
        case .cardPlayed: return .ironwright
        case .creatureDied: return .chaosRed
        case .hpChange: return .healGreen
        case .combat: return .damageOrange
        case .eventTriggered: return .rarityEpic
        case .system: return .textTertiary
        }
    }
}

struct BattleLogEntry: Identifiable {
    let id: UUID
    let timestamp: Date
    let turn: Int
    let type: BattleLogEntryType
    let message: String
}

// BattleStateMachine.swift
// Chaos Creatures
// Client-side state machine that mirrors server turn phases.
// The client is a rendering engine — this tracks state, it does NOT compute logic.
// Source: docs/design/01-battle-mechanics.md, docs/design/06-technical-architecture.md

import Foundation
import Combine

/// Delegate protocol for BattleScene to respond to state changes.
protocol BattleStateMachineDelegate: AnyObject {
    func stateMachine(_ sm: BattleStateMachine, didTransitionTo phase: TurnPhase, isMyTurn: Bool)
    func stateMachine(_ sm: BattleStateMachine, didReceiveEvent event: ServerEvent)
    func stateMachine(_ sm: BattleStateMachine, didUpdateGameState state: ClientGameState)
    func stateMachine(_ sm: BattleStateMachine, animationQueueReady queue: [ServerEvent])
}

/// Client-side state machine tracking server phase transitions.
/// Queues incoming server events and processes them sequentially via the animation system.
/// Does NOT compute game logic — all state comes from the server.
@MainActor
final class BattleStateMachine: ObservableObject {

    // MARK: - Published State

    @Published private(set) var currentPhase: TurnPhase = .gameSetup
    @Published private(set) var isMyTurn: Bool = false
    @Published private(set) var currentTurn: Int = 0
    @Published private(set) var gameState: ClientGameState?
    @Published private(set) var isAnimating: Bool = false
    @Published private(set) var matchId: String = ""

    // MARK: - Delegate

    weak var delegate: BattleStateMachineDelegate?

    // MARK: - Animation Queue

    /// Events waiting to be animated. Processed FIFO.
    private var eventQueue: [ServerEvent] = []

    /// Whether the animation system is currently processing an event
    private var isProcessingEvent: Bool = false

    // MARK: - Attacker/Blocker Tracking

    /// Instance IDs of creatures the local player has selected as attackers
    @Published var selectedAttackerIds: [String] = []

    /// Blocker assignments the local player is building: [blockerId: attackerId]
    @Published var blockerAssignments: [String: String] = [:]

    /// Whether the local player has confirmed their attackers this phase
    @Published var hasConfirmedAttackers: Bool = false

    /// Whether the local player has confirmed their blockers this phase
    @Published var hasConfirmedBlockers: Bool = false

    // MARK: - Init

    init() {}

    // MARK: - Event Ingestion

    /// Called when a server event arrives via WebSocket.
    /// Events are queued and processed sequentially through the animation pipeline.
    func handleServerEvent(_ event: ServerEvent) {
        switch event {
        case .stateSnapshot(let state):
            // State snapshots update immediately (no animation)
            updateGameState(state)
            delegate?.stateMachine(self, didUpdateGameState: state)

        case .phaseChanged(let data):
            // Phase transitions update immediately + trigger UI changes
            transitionPhase(data.phase, activePlayer: data.activePlayer)
            // Also queue for animation (banner, etc.)
            enqueueEvent(event)

        case .turnStart(let data):
            currentTurn = data.turn
            transitionPhase(.startOfTurn, activePlayer: data.activePlayer)
            enqueueEvent(event)

        case .matchEnd:
            transitionPhase(.gameOver, activePlayer: gameState?.activePlayer ?? .player1)
            enqueueEvent(event)

        default:
            // All other events go through the animation queue
            enqueueEvent(event)
        }

        delegate?.stateMachine(self, didReceiveEvent: event)
    }

    // MARK: - Phase Transitions

    private func transitionPhase(_ phase: TurnPhase, activePlayer: PlayerSide) {
        let previousPhase = currentPhase
        currentPhase = phase
        isMyTurn = (activePlayer == gameState?.mySide)

        // Reset combat selections on phase change
        if phase == .declareAttackers {
            selectedAttackerIds = []
            hasConfirmedAttackers = false
        } else if phase == .assignBlockers {
            blockerAssignments = [:]
            hasConfirmedBlockers = false
        }

        delegate?.stateMachine(self, didTransitionTo: phase, isMyTurn: isMyTurn)
    }

    private func updateGameState(_ state: ClientGameState) {
        self.gameState = state
        self.matchId = state.matchId
        self.currentPhase = state.phase
        self.currentTurn = state.currentTurn
        self.isMyTurn = state.isMyTurn
    }

    // MARK: - Animation Queue

    private func enqueueEvent(_ event: ServerEvent) {
        eventQueue.append(event)
        processNextEvent()
    }

    /// Call this after an animation completes to process the next queued event
    func animationDidComplete() {
        isProcessingEvent = false
        isAnimating = false
        processNextEvent()
    }

    private func processNextEvent() {
        guard !isProcessingEvent, !eventQueue.isEmpty else { return }
        isProcessingEvent = true
        isAnimating = true

        let event = eventQueue.removeFirst()
        delegate?.stateMachine(self, animationQueueReady: [event])
    }

    /// Flush all queued events (e.g. on reconnect, apply state snapshot instead)
    func flushEventQueue() {
        eventQueue.removeAll()
        isProcessingEvent = false
        isAnimating = false
    }

    // MARK: - Attacker Selection

    /// Toggle a creature as attacker during DECLARE_ATTACKERS phase
    func toggleAttacker(_ creatureId: String) {
        guard currentPhase == .declareAttackers, isMyTurn, !hasConfirmedAttackers else { return }

        if let index = selectedAttackerIds.firstIndex(of: creatureId) {
            selectedAttackerIds.remove(at: index)
        } else {
            selectedAttackerIds.append(creatureId)
        }
    }

    /// Confirm attackers — sends action to server
    func confirmAttackers() -> PlayerAction {
        hasConfirmedAttackers = true
        return .declareAttackers(attackerIds: selectedAttackerIds)
    }

    // MARK: - Blocker Assignment

    /// Assign a blocker to an attacker during ASSIGN_BLOCKERS phase
    func assignBlocker(blockerId: String, to attackerId: String) {
        guard currentPhase == .assignBlockers, !isMyTurn, !hasConfirmedBlockers else { return }
        // The defender assigns blockers, so it's NOT their turn (the attacker's turn)
        // Actually, per the game rules, the non-active player assigns blockers
        blockerAssignments[blockerId] = attackerId
    }

    /// Remove a blocker assignment
    func removeBlockerAssignment(blockerId: String) {
        blockerAssignments.removeValue(forKey: blockerId)
    }

    /// Confirm blockers — sends action to server
    func confirmBlockers() -> PlayerAction {
        hasConfirmedBlockers = true
        let assignments = blockerAssignments.map {
            BlockerAssignmentPayload(blockerId: $0.key, attackerId: $0.value)
        }
        return .assignBlockers(assignments: assignments)
    }

    // MARK: - Query Helpers

    /// Whether the local player can play cards right now
    var canPlayCards: Bool {
        currentPhase == .mainPhase && isMyTurn
    }

    /// Whether the local player can declare attackers right now
    var canDeclareAttackers: Bool {
        currentPhase == .declareAttackers && isMyTurn && !hasConfirmedAttackers
    }

    /// Whether the local player can assign blockers right now
    var canAssignBlockers: Bool {
        currentPhase == .assignBlockers && !hasConfirmedBlockers
    }

    /// Whether a timer should be shown for the current phase
    var shouldShowTimer: Bool {
        currentPhase.isDecisionPhase
    }

    /// Current CM available (from last game state)
    var currentMana: Int {
        gameState?.me.currentMana ?? 0
    }
}

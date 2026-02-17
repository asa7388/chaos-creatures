// GameState.swift
// Chaos Creatures
// Client-side game state projection received from server.
// Mirrors: packages/game-server/src/types/messages.ts ClientGameState

import Foundation

// MARK: - Client Game State

struct ClientGameState: Codable {
    let matchId: String
    let currentTurn: Int
    let activePlayer: PlayerSide
    let phase: TurnPhase
    let firstPlayer: PlayerSide
    let declaredAttackers: [String]
    let blockerAssignments: [ClientBlockerAssignment]
    let lastRollValue: Int?
    let lastRollEvent: EventType?
    let lastRollEventId: String?
    let turnTimerStarted: String?
    let turnTimerSeconds: Int
    let mySide: PlayerSide
    let myHand: [BattleCardData]
    let myDeckCount: Int
    let opponent: ClientBattlePlayer
    let me: ClientBattlePlayer
    let winner: PlayerSide?

    enum CodingKeys: String, CodingKey {
        case matchId = "match_id"
        case currentTurn = "current_turn"
        case activePlayer = "active_player"
        case phase
        case firstPlayer = "first_player"
        case declaredAttackers = "declared_attackers"
        case blockerAssignments = "blocker_assignments"
        case lastRollValue = "last_roll_value"
        case lastRollEvent = "last_roll_event"
        case lastRollEventId = "last_roll_event_id"
        case turnTimerStarted = "turn_timer_started"
        case turnTimerSeconds = "turn_timer_seconds"
        case mySide = "my_side"
        case myHand = "my_hand"
        case myDeckCount = "my_deck_count"
        case opponent, me, winner
    }

    /// Whether it is the local player's turn
    var isMyTurn: Bool {
        activePlayer == mySide
    }
}

// MARK: - Client Battle Player

struct ClientBattlePlayer: Codable {
    let playerId: String
    let side: PlayerSide
    let avatarId: String
    let currentHp: Int
    let maxHp: Int
    let currentMana: Int
    let manaCap: Int
    let instability: Int
    let board: [BattleCreatureData?]
    let handCount: Int
    let deckCount: Int
    let graveyardCount: Int
    let hasChaosSpark: Bool
    let lastEventType: EventType?
    let consecutiveMissedTurns: Int
    let isConnected: Bool

    enum CodingKeys: String, CodingKey {
        case playerId = "player_id"
        case side
        case avatarId = "avatar_id"
        case currentHp = "current_hp"
        case maxHp = "max_hp"
        case currentMana = "current_mana"
        case manaCap = "mana_cap"
        case instability, board
        case handCount = "hand_count"
        case deckCount = "deck_count"
        case graveyardCount = "graveyard_count"
        case hasChaosSpark = "has_chaos_spark"
        case lastEventType = "last_event_type"
        case consecutiveMissedTurns = "consecutive_missed_turns"
        case isConnected = "is_connected"
    }

    /// Get creature at a specific board slot (0-4)
    func creatureAt(slot: Int) -> BattleCreatureData? {
        guard slot >= 0 && slot < board.count else { return nil }
        return board[slot]
    }

    /// All non-nil creatures currently on board
    var activeCreatures: [BattleCreatureData] {
        board.compactMap { $0 }
    }

    /// Count of creatures on board
    var creatureCount: Int {
        activeCreatures.count
    }

    /// First empty slot index, or nil if board is full
    var firstEmptySlot: Int? {
        board.firstIndex(where: { $0 == nil })
    }

    /// Whether the board has any empty slots
    var hasEmptySlot: Bool {
        firstEmptySlot != nil
    }
}

// MARK: - Client Blocker Assignment

struct ClientBlockerAssignment: Codable {
    let blockerCreatureId: String
    let attackerCreatureId: String

    enum CodingKeys: String, CodingKey {
        case blockerCreatureId = "blocker_creature_id"
        case attackerCreatureId = "attacker_creature_id"
    }
}

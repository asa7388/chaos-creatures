// GameState.swift
// Chaos Creatures
// Client-side game state projection received from server.
// Mirrors: packages/game-server/src/types/messages.ts ClientGameState

import Foundation

// MARK: - Stabilizer Type Enum

enum StabilizerTypeEnum: String, Codable {
    case order = "ORDER"
    case chaos = "CHAOS"
    case hybrid = "HYBRID"
}

// MARK: - Battle Stabilizer Data (in stability zone)

struct BattleStabilizerData: Codable, Identifiable {
    let instanceId: String
    let templateId: String
    let name: String
    let artUrl: String?
    let stabilizerType: StabilizerTypeEnum
    /// The "type" key from the activated_effect JSONB, decoded for display purposes.
    let activatedEffectType: String
    let isOnCooldown: Bool
    let zoneIndex: Int

    var id: String { instanceId }

    enum CodingKeys: String, CodingKey {
        case instanceId = "instance_id"
        case templateId = "template_id"
        case name
        case artUrl = "art_url"
        case stabilizerType = "stabilizer_type"
        case activatedEffect = "activated_effect"
        case isOnCooldown = "is_on_cooldown"
        case zoneIndex = "zone_index"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        instanceId = try container.decode(String.self, forKey: .instanceId)
        templateId = try container.decode(String.self, forKey: .templateId)
        name = try container.decode(String.self, forKey: .name)
        artUrl = try container.decodeIfPresent(String.self, forKey: .artUrl)
        stabilizerType = try container.decode(StabilizerTypeEnum.self, forKey: .stabilizerType)
        isOnCooldown = try container.decode(Bool.self, forKey: .isOnCooldown)
        zoneIndex = try container.decode(Int.self, forKey: .zoneIndex)
        // Decode only the "type" key from the activated_effect JSONB dict
        if let effectDict = try? container.decode([String: String].self, forKey: .activatedEffect),
           let effectType = effectDict["type"] {
            activatedEffectType = effectType
        } else {
            activatedEffectType = "UNKNOWN"
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(instanceId, forKey: .instanceId)
        try container.encode(templateId, forKey: .templateId)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(artUrl, forKey: .artUrl)
        try container.encode(stabilizerType, forKey: .stabilizerType)
        try container.encode(isOnCooldown, forKey: .isOnCooldown)
        try container.encode(zoneIndex, forKey: .zoneIndex)
        try container.encode(["type": activatedEffectType], forKey: .activatedEffect)
    }
}

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
    let stabilityZone: [BattleStabilizerData]
    let stabilizersPlayedThisTurn: Int

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
        case stabilityZone = "stability_zone"
        case stabilizersPlayedThisTurn = "stabilizers_played_this_turn"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        playerId = try container.decode(String.self, forKey: .playerId)
        side = try container.decode(PlayerSide.self, forKey: .side)
        avatarId = try container.decode(String.self, forKey: .avatarId)
        currentHp = try container.decode(Int.self, forKey: .currentHp)
        maxHp = try container.decode(Int.self, forKey: .maxHp)
        currentMana = try container.decode(Int.self, forKey: .currentMana)
        manaCap = try container.decode(Int.self, forKey: .manaCap)
        instability = try container.decode(Int.self, forKey: .instability)
        board = try container.decode([BattleCreatureData?].self, forKey: .board)
        handCount = try container.decode(Int.self, forKey: .handCount)
        deckCount = try container.decode(Int.self, forKey: .deckCount)
        graveyardCount = try container.decode(Int.self, forKey: .graveyardCount)
        hasChaosSpark = try container.decode(Bool.self, forKey: .hasChaosSpark)
        lastEventType = try container.decodeIfPresent(EventType.self, forKey: .lastEventType)
        consecutiveMissedTurns = try container.decode(Int.self, forKey: .consecutiveMissedTurns)
        isConnected = try container.decode(Bool.self, forKey: .isConnected)
        stabilityZone = try container.decodeIfPresent([BattleStabilizerData].self, forKey: .stabilityZone) ?? []
        stabilizersPlayedThisTurn = try container.decodeIfPresent(Int.self, forKey: .stabilizersPlayedThisTurn) ?? 0
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

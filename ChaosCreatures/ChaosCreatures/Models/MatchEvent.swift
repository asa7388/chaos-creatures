// MatchEvent.swift
// Chaos Creatures
// All server event types (Codable enums) for match communication.
// Mirrors: packages/game-server/src/types/messages.ts

import Foundation

// MARK: - Server -> Client Events

enum ServerEvent: Codable {
    case stateSnapshot(ClientGameState)
    case turnStart(TurnStartData)
    case chaosRoll(ChaosRollData)
    case eventTriggered(EventTriggeredData)
    case cardDrawn(CardDrawnData)
    case manaGained(ManaGainedData)
    case cardPlayed(CardPlayedData)
    case attackersDeclared(AttackersDeclaredData)
    case blockersAssigned(BlockersAssignedData)
    case combatResolved(CombatResolvedData)
    case creatureDestroyed(CreatureDestroyedData)
    case hpChanged(HpChangedData)
    case instabilityChanged(InstabilityChangedData)
    case timerWarning(TimerWarningData)
    case timerExpired(TimerExpiredData)
    case matchEnd(MatchEndData)
    case mulliganRequest(MulliganRequestData)
    case phaseChanged(PhaseChangedData)
    case chaosSparkUsed(ChaosSparkUsedData)
    case opponentHandUpdate(OpponentHandUpdateData)
    case serverError(ServerErrorData)

    enum CodingKeys: String, CodingKey {
        case type
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        let singleContainer = try decoder.singleValueContainer()

        switch type {
        case "STATE_SNAPSHOT":
            self = .stateSnapshot(try singleContainer.decode(ClientGameState.self))
        case "TURN_START":
            self = .turnStart(try singleContainer.decode(TurnStartData.self))
        case "CHAOS_ROLL":
            self = .chaosRoll(try singleContainer.decode(ChaosRollData.self))
        case "EVENT_TRIGGERED":
            self = .eventTriggered(try singleContainer.decode(EventTriggeredData.self))
        case "CARD_DRAWN":
            self = .cardDrawn(try singleContainer.decode(CardDrawnData.self))
        case "MANA_GAINED":
            self = .manaGained(try singleContainer.decode(ManaGainedData.self))
        case "CARD_PLAYED":
            self = .cardPlayed(try singleContainer.decode(CardPlayedData.self))
        case "ATTACKERS_DECLARED":
            self = .attackersDeclared(try singleContainer.decode(AttackersDeclaredData.self))
        case "BLOCKERS_ASSIGNED":
            self = .blockersAssigned(try singleContainer.decode(BlockersAssignedData.self))
        case "COMBAT_RESOLVED":
            self = .combatResolved(try singleContainer.decode(CombatResolvedData.self))
        case "CREATURE_DESTROYED":
            self = .creatureDestroyed(try singleContainer.decode(CreatureDestroyedData.self))
        case "HP_CHANGED":
            self = .hpChanged(try singleContainer.decode(HpChangedData.self))
        case "INSTABILITY_CHANGED":
            self = .instabilityChanged(try singleContainer.decode(InstabilityChangedData.self))
        case "TIMER_WARNING":
            self = .timerWarning(try singleContainer.decode(TimerWarningData.self))
        case "TIMER_EXPIRED":
            self = .timerExpired(try singleContainer.decode(TimerExpiredData.self))
        case "MATCH_END":
            self = .matchEnd(try singleContainer.decode(MatchEndData.self))
        case "MULLIGAN_REQUEST":
            self = .mulliganRequest(try singleContainer.decode(MulliganRequestData.self))
        case "PHASE_CHANGED":
            self = .phaseChanged(try singleContainer.decode(PhaseChangedData.self))
        case "CHAOS_SPARK_USED":
            self = .chaosSparkUsed(try singleContainer.decode(ChaosSparkUsedData.self))
        case "OPPONENT_HAND_UPDATE":
            self = .opponentHandUpdate(try singleContainer.decode(OpponentHandUpdateData.self))
        case "SERVER_ERROR":
            self = .serverError(try singleContainer.decode(ServerErrorData.self))
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath,
                                      debugDescription: "Unknown event type: \(type)")
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        // Client primarily decodes; encoding provided for completeness
        var container = encoder.singleValueContainer()
        switch self {
        case .stateSnapshot(let data): try container.encode(data)
        case .turnStart(let data): try container.encode(data)
        case .chaosRoll(let data): try container.encode(data)
        case .eventTriggered(let data): try container.encode(data)
        case .cardDrawn(let data): try container.encode(data)
        case .manaGained(let data): try container.encode(data)
        case .cardPlayed(let data): try container.encode(data)
        case .attackersDeclared(let data): try container.encode(data)
        case .blockersAssigned(let data): try container.encode(data)
        case .combatResolved(let data): try container.encode(data)
        case .creatureDestroyed(let data): try container.encode(data)
        case .hpChanged(let data): try container.encode(data)
        case .instabilityChanged(let data): try container.encode(data)
        case .timerWarning(let data): try container.encode(data)
        case .timerExpired(let data): try container.encode(data)
        case .matchEnd(let data): try container.encode(data)
        case .mulliganRequest(let data): try container.encode(data)
        case .phaseChanged(let data): try container.encode(data)
        case .chaosSparkUsed(let data): try container.encode(data)
        case .opponentHandUpdate(let data): try container.encode(data)
        case .serverError(let data): try container.encode(data)
        }
    }
}

// MARK: - Event Data Types

struct TurnStartData: Codable {
    let type: String
    let turn: Int
    let activePlayer: PlayerSide

    enum CodingKeys: String, CodingKey {
        case type, turn
        case activePlayer = "active_player"
    }
}

struct ChaosRollData: Codable {
    let type: String
    let roll: Int
    let instability: Int
    let result: ChaosRollOutcome
    let activePlayer: PlayerSide

    enum CodingKeys: String, CodingKey {
        case type, roll, instability, result
        case activePlayer = "active_player"
    }
}

struct EventTriggeredData: Codable {
    let type: String
    let eventId: String
    let eventName: String
    let eventType: EventType
    let description: String
    let effectResults: [EffectResultData]
    let triggerResults: [TriggerResultData]
    let requiresChoice: Bool
    let validTargets: [String]?

    enum CodingKeys: String, CodingKey {
        case type, description
        case eventId = "event_id"
        case eventName = "event_name"
        case eventType = "event_type"
        case effectResults = "effect_results"
        case triggerResults = "trigger_results"
        case requiresChoice = "requires_choice"
        case validTargets = "valid_targets"
    }
}

struct CardDrawnData: Codable {
    let type: String
    let card: BattleCardData
    let player: PlayerSide
    let cardsRemaining: Int

    enum CodingKeys: String, CodingKey {
        case type, card, player
        case cardsRemaining = "cards_remaining"
    }
}

struct ManaGainedData: Codable {
    let type: String
    let player: PlayerSide
    let currentMana: Int
    let manaCap: Int

    enum CodingKeys: String, CodingKey {
        case type, player
        case currentMana = "current_mana"
        case manaCap = "mana_cap"
    }
}

struct CardPlayedData: Codable {
    let type: String
    let player: PlayerSide
    let card: BattleCardData
    let slot: Int?
    let creature: BattleCreatureData?
    let manaRemaining: Int
    let effectResults: [EffectResultData]?

    enum CodingKeys: String, CodingKey {
        case type, player, card, slot, creature
        case manaRemaining = "mana_remaining"
        case effectResults = "effect_results"
    }
}

struct AttackersDeclaredData: Codable {
    let type: String
    let attackerIds: [String]
    let player: PlayerSide

    enum CodingKeys: String, CodingKey {
        case type, player
        case attackerIds = "attacker_ids"
    }
}

struct BlockersAssignedData: Codable {
    let type: String
    let assignments: [BlockerAssignmentData]
    let player: PlayerSide
}

struct BlockerAssignmentData: Codable {
    let blockerId: String
    let attackerId: String

    enum CodingKeys: String, CodingKey {
        case blockerId = "blocker_id"
        case attackerId = "attacker_id"
    }
}

struct CombatResolvedData: Codable {
    let type: String
    let pairs: [CombatPairResultData]
    let unblocked: [UnblockedResultData]
    let deaths: [DeathData]
    let player1Hp: Int
    let player2Hp: Int

    enum CodingKeys: String, CodingKey {
        case type, pairs, unblocked, deaths
        case player1Hp = "player_1_hp"
        case player2Hp = "player_2_hp"
    }
}

struct CombatPairResultData: Codable {
    let attackerId: String
    let blockerId: String
    let attackerDamageDealt: Int
    let blockerDamageDealt: Int
    let attackerDied: Bool
    let blockerDied: Bool
    let piercingDamage: Int
    let attackerLifesteal: Int
    let blockerLifesteal: Int
    let attackerShieldBroke: Bool
    let blockerShieldBroke: Bool

    enum CodingKeys: String, CodingKey {
        case attackerId = "attacker_id"
        case blockerId = "blocker_id"
        case attackerDamageDealt = "attacker_damage_dealt"
        case blockerDamageDealt = "blocker_damage_dealt"
        case attackerDied = "attacker_died"
        case blockerDied = "blocker_died"
        case piercingDamage = "piercing_damage"
        case attackerLifesteal = "attacker_lifesteal"
        case blockerLifesteal = "blocker_lifesteal"
        case attackerShieldBroke = "attacker_shield_broke"
        case blockerShieldBroke = "blocker_shield_broke"
    }
}

struct UnblockedResultData: Codable {
    let attackerId: String
    let faceDamage: Int
    let lifesteal: Int

    enum CodingKeys: String, CodingKey {
        case attackerId = "attacker_id"
        case faceDamage = "face_damage"
        case lifesteal
    }
}

struct DeathData: Codable {
    let creatureId: String
    let side: PlayerSide
    let boardSlot: Int

    enum CodingKeys: String, CodingKey {
        case creatureId = "creature_id"
        case side
        case boardSlot = "board_slot"
    }
}

struct CreatureDestroyedData: Codable {
    let type: String
    let creatureId: String
    let boardSlot: Int
    let player: PlayerSide
    let cause: String

    enum CodingKeys: String, CodingKey {
        case type, player, cause
        case creatureId = "creature_id"
        case boardSlot = "board_slot"
    }
}

struct HpChangedData: Codable {
    let type: String
    let player: PlayerSide
    let oldHp: Int
    let newHp: Int
    let cause: String

    enum CodingKeys: String, CodingKey {
        case type, player, cause
        case oldHp = "old_hp"
        case newHp = "new_hp"
    }
}

struct InstabilityChangedData: Codable {
    let type: String
    let player: PlayerSide
    let oldInstability: Int
    let newInstability: Int

    enum CodingKeys: String, CodingKey {
        case type, player
        case oldInstability = "old_instability"
        case newInstability = "new_instability"
    }
}

struct TimerWarningData: Codable {
    let type: String
    let secondsRemaining: Int
    let phase: TurnPhase

    enum CodingKeys: String, CodingKey {
        case type, phase
        case secondsRemaining = "seconds_remaining"
    }
}

struct TimerExpiredData: Codable {
    let type: String
    let phase: TurnPhase
    let player: PlayerSide
}

struct MatchEndData: Codable {
    let type: String
    let winner: PlayerSide
    let endReason: EndReason
    let player1FinalHp: Int
    let player2FinalHp: Int
    let totalTurns: Int

    enum CodingKeys: String, CodingKey {
        case type, winner
        case endReason = "end_reason"
        case player1FinalHp = "player_1_final_hp"
        case player2FinalHp = "player_2_final_hp"
        case totalTurns = "total_turns"
    }
}

struct MulliganRequestData: Codable {
    let type: String
    let hand: [BattleCardData]
}

struct PhaseChangedData: Codable {
    let type: String
    let phase: TurnPhase
    let activePlayer: PlayerSide

    enum CodingKeys: String, CodingKey {
        case type, phase
        case activePlayer = "active_player"
    }
}

struct ChaosSparkUsedData: Codable {
    let type: String
    let player: PlayerSide
    let manaAfter: Int

    enum CodingKeys: String, CodingKey {
        case type, player
        case manaAfter = "mana_after"
    }
}

struct OpponentHandUpdateData: Codable {
    let type: String
    let count: Int
}

struct ServerErrorData: Codable {
    let type: String
    let code: String
    let message: String
}

// MARK: - Sub-types

struct EffectResultData: Codable {
    let effectType: String
    let targetIds: [String]
    let value: Int?
    let description: String

    enum CodingKeys: String, CodingKey {
        case effectType = "effect_type"
        case targetIds = "target_ids"
        case value, description
    }
}

struct TriggerResultData: Codable {
    let creatureId: String
    let abilityName: String
    let effectResults: [EffectResultData]

    enum CodingKeys: String, CodingKey {
        case creatureId = "creature_id"
        case abilityName = "ability_name"
        case effectResults = "effect_results"
    }
}

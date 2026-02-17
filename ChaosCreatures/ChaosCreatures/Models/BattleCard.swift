// BattleCard.swift
// Chaos Creatures
// Runtime battle representation of a card.
// Mirrors: packages/game-server/src/types/game-state.ts BattleCard + BattleCreature

import Foundation

// MARK: - Enums (mirroring server enums.ts)

enum CardType: String, Codable {
    case creature = "CREATURE"
    case spell = "SPELL"
    case stabilizer = "STABILIZER"
}

enum Keyword: String, Codable, CaseIterable {
    case shield = "SHIELD"
    case lifesteal = "LIFESTEAL"
    case flying = "FLYING"
    case reach = "REACH"
    case deathtouch = "DEATHTOUCH"
    case taunt = "TAUNT"
    case piercing = "PIERCING"

    var displayName: String {
        rawValue.capitalized
    }

    var iconName: String {
        switch self {
        case .shield: return "shield.fill"
        case .lifesteal: return "heart.fill"
        case .flying: return "wind"
        case .reach: return "arrow.up.forward"
        case .deathtouch: return "skull.fill"
        case .taunt: return "exclamationmark.shield.fill"
        case .piercing: return "arrow.right.to.line"
        }
    }
}

enum EventType: String, Codable {
    case order = "ORDER"
    case chaos = "CHAOS"
}

enum ChaosRollOutcome: String, Codable {
    case order = "ORDER"
    case chaos = "CHAOS"
    case nothing = "NOTHING"
}

enum PlayerSide: String, Codable {
    case player1 = "PLAYER_1"
    case player2 = "PLAYER_2"
}

enum TurnPhase: String, Codable, CaseIterable {
    case gameSetup = "GAME_SETUP"
    case startOfTurn = "START_OF_TURN"
    case chaosRoll = "CHAOS_ROLL"
    case eventResolution = "EVENT_RESOLUTION"
    case drawAndMana = "DRAW_AND_MANA"
    case mainPhase = "MAIN_PHASE"
    case declareAttackers = "DECLARE_ATTACKERS"
    case assignBlockers = "ASSIGN_BLOCKERS"
    case combatResolution = "COMBAT_RESOLUTION"
    case endTurn = "END_TURN"
    case gameOver = "GAME_OVER"

    /// Short display name for the phase indicator
    var shortName: String {
        switch self {
        case .gameSetup: return "Setup"
        case .startOfTurn: return "Start"
        case .chaosRoll: return "Roll"
        case .eventResolution: return "Event"
        case .drawAndMana: return "Draw"
        case .mainPhase: return "Main"
        case .declareAttackers: return "Attack"
        case .assignBlockers: return "Block"
        case .combatResolution: return "Combat"
        case .endTurn: return "End"
        case .gameOver: return "Over"
        }
    }

    /// The 9 phases displayed in the indicator (excludes setup and game over)
    static var displayPhases: [TurnPhase] {
        [.startOfTurn, .chaosRoll, .eventResolution, .drawAndMana,
         .mainPhase, .declareAttackers, .assignBlockers, .combatResolution, .endTurn]
    }

    /// Whether this phase is a decision phase (timer active)
    var isDecisionPhase: Bool {
        switch self {
        case .mainPhase, .declareAttackers, .assignBlockers:
            return true
        default:
            return false
        }
    }
}

enum EndReason: String, Codable {
    case hpZero = "HP_ZERO"
    case surrender = "SURRENDER"
    case disconnect = "DISCONNECT"
    case timeout = "TIMEOUT"
}

enum EvolutionTier: String, Codable, CaseIterable {
    case common = "COMMON"
    case uncommon = "UNCOMMON"
    case rare = "RARE"
    case epic = "EPIC"
    case legendary = "LEGENDARY"

    var borderColor: UIColor {
        switch self {
        case .common: return UIColor(hex: "#9E9E9E")
        case .uncommon: return UIColor(hex: "#4CAF50")
        case .rare: return UIColor(hex: "#2196F3")
        case .epic: return UIColor(hex: "#9C27B0")
        case .legendary: return UIColor(hex: "#FF9800")
        }
    }
}

import UIKit

// MARK: - Battle Card Data (from server)

struct BattleCardData: Codable, Identifiable {
    let instanceId: String
    let templateId: String
    let cardType: CardType
    let name: String
    let manaCost: Int
    let artUrl: String
    let baseAttack: Int?
    let baseHealth: Int?
    let baseInstability: Int
    let innateKeywords: [Keyword]
    let factionId: String

    var id: String { instanceId }

    enum CodingKeys: String, CodingKey {
        case instanceId = "instance_id"
        case templateId = "template_id"
        case cardType = "card_type"
        case name
        case manaCost = "mana_cost"
        case artUrl = "art_url"
        case baseAttack = "base_attack"
        case baseHealth = "base_health"
        case baseInstability = "base_instability"
        case innateKeywords = "innate_keywords"
        case factionId = "faction_id"
    }

    var faction: Faction {
        Faction(rawValue: factionId) ?? .ironwright
    }
}

// MARK: - Battle Creature Data (on board, extends BattleCard)

struct BattleCreatureData: Codable, Identifiable {
    let instanceId: String
    let templateId: String
    let cardType: CardType
    let name: String
    let manaCost: Int
    let artUrl: String
    let baseAttack: Int?
    let baseHealth: Int?
    let baseInstability: Int
    let innateKeywords: [Keyword]
    let factionId: String

    // Current combat stats
    let attack: Int
    let health: Int
    let maxHealth: Int

    // State
    let hasAttacked: Bool
    let isAlive: Bool

    // Instability
    let instabilityValue: Int

    // Active keywords
    let activeKeywords: [Keyword]
    let shieldActive: Bool

    // Board position
    let boardSlot: Int

    var id: String { instanceId }

    enum CodingKeys: String, CodingKey {
        case instanceId = "instance_id"
        case templateId = "template_id"
        case cardType = "card_type"
        case name
        case manaCost = "mana_cost"
        case artUrl = "art_url"
        case baseAttack = "base_attack"
        case baseHealth = "base_health"
        case baseInstability = "base_instability"
        case innateKeywords = "innate_keywords"
        case factionId = "faction_id"
        case attack, health
        case maxHealth = "max_health"
        case hasAttacked = "has_attacked"
        case isAlive = "is_alive"
        case instabilityValue = "instability_value"
        case activeKeywords = "active_keywords"
        case shieldActive = "shield_active"
        case boardSlot = "board_slot"
    }

    var faction: Faction {
        Faction(rawValue: factionId) ?? .ironwright
    }

    var hasTaunt: Bool {
        activeKeywords.contains(.taunt)
    }

    var hasFlying: Bool {
        activeKeywords.contains(.flying)
    }
}

// MARK: - BattleCard (legacy Identifiable conformance)

struct BattleCard: Identifiable {
    let id: String
    let data: BattleCardData

    init(data: BattleCardData) {
        self.id = data.instanceId
        self.data = data
    }
}

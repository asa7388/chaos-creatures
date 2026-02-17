// BattleCard.swift
// Chaos Creatures
// Runtime battle representation of a card.
// Mirrors: packages/game-server/src/types/game-state.ts BattleCard + BattleCreature
// Note: Enums are defined in Enums.swift to avoid duplication.

import Foundation
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

    var factionShortName: FactionShortName? {
        FactionShortName(rawValue: factionId)
    }

    var faction: Faction {
        factionShortName?.asFaction ?? .ironwright
    }
}

// MARK: - Battle Creature Data (on board, extends BattleCard)

struct BattleCreatureData: Codable, Identifiable, Equatable {
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

    var factionShortName: FactionShortName? {
        FactionShortName(rawValue: factionId)
    }

    var hasTaunt: Bool {
        activeKeywords.contains(.taunt)
    }

    var hasFlying: Bool {
        activeKeywords.contains(.flying)
    }

    static func == (lhs: BattleCreatureData, rhs: BattleCreatureData) -> Bool {
        lhs.instanceId == rhs.instanceId
    }
}

// MARK: - Chaos Roll Outcome (server-specific, distinct from RollResult)

enum ChaosRollOutcome: String, Codable {
    case order = "ORDER"
    case chaos = "CHAOS"
    case nothing = "NOTHING"
}

// MARK: - Evolution Tier UIKit Extension (for SpriteKit use)

extension EvolutionTier {
    var borderUIColor: UIColor {
        switch self {
        case .common: return UIColor(red: 0.62, green: 0.62, blue: 0.62, alpha: 1.0)
        case .uncommon: return UIColor(red: 0.30, green: 0.69, blue: 0.31, alpha: 1.0)
        case .rare: return UIColor(red: 0.13, green: 0.59, blue: 0.95, alpha: 1.0)
        case .epic: return UIColor(red: 0.61, green: 0.15, blue: 0.69, alpha: 1.0)
        case .legendary: return UIColor(red: 1.0, green: 0.60, blue: 0.0, alpha: 1.0)
        }
    }
}

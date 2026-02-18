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
    let evolutionTier: EvolutionTier
    let modifiers: [BattleModifier]?
    let triggeredAbilities: [BattleTriggeredAbility]?

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
        case evolutionTier = "evolution_tier"
        case modifiers
        case triggeredAbilities = "triggered_abilities"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        instanceId = try container.decode(String.self, forKey: .instanceId)
        templateId = try container.decode(String.self, forKey: .templateId)
        cardType = try container.decode(CardType.self, forKey: .cardType)
        name = try container.decode(String.self, forKey: .name)
        manaCost = try container.decode(Int.self, forKey: .manaCost)
        artUrl = try container.decode(String.self, forKey: .artUrl)
        baseAttack = try container.decodeIfPresent(Int.self, forKey: .baseAttack)
        baseHealth = try container.decodeIfPresent(Int.self, forKey: .baseHealth)
        baseInstability = try container.decode(Int.self, forKey: .baseInstability)
        innateKeywords = try container.decode([Keyword].self, forKey: .innateKeywords)
        factionId = try container.decode(String.self, forKey: .factionId)
        evolutionTier = try container.decodeIfPresent(EvolutionTier.self, forKey: .evolutionTier) ?? .common
        modifiers = try container.decodeIfPresent([BattleModifier].self, forKey: .modifiers)
        triggeredAbilities = try container.decodeIfPresent([BattleTriggeredAbility].self, forKey: .triggeredAbilities)
    }

    var factionShortName: FactionShortName? {
        FactionShortName(rawValue: factionId)
    }

    /// Faction UIColor for SpriteKit rendering
    var factionPrimaryColor: UIColor {
        factionShortName?.primaryUIColor ?? UIColor(hex: "#C9A84C")
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
    let evolutionTier: EvolutionTier

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
        case evolutionTier = "evolution_tier"
        case attack, health
        case maxHealth = "max_health"
        case hasAttacked = "has_attacked"
        case isAlive = "is_alive"
        case instabilityValue = "instability_value"
        case activeKeywords = "active_keywords"
        case shieldActive = "shield_active"
        case boardSlot = "board_slot"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        instanceId = try container.decode(String.self, forKey: .instanceId)
        templateId = try container.decode(String.self, forKey: .templateId)
        cardType = try container.decode(CardType.self, forKey: .cardType)
        name = try container.decode(String.self, forKey: .name)
        manaCost = try container.decode(Int.self, forKey: .manaCost)
        artUrl = try container.decode(String.self, forKey: .artUrl)
        baseAttack = try container.decodeIfPresent(Int.self, forKey: .baseAttack)
        baseHealth = try container.decodeIfPresent(Int.self, forKey: .baseHealth)
        baseInstability = try container.decode(Int.self, forKey: .baseInstability)
        innateKeywords = try container.decode([Keyword].self, forKey: .innateKeywords)
        factionId = try container.decode(String.self, forKey: .factionId)
        evolutionTier = try container.decodeIfPresent(EvolutionTier.self, forKey: .evolutionTier) ?? .common
        attack = try container.decode(Int.self, forKey: .attack)
        health = try container.decode(Int.self, forKey: .health)
        maxHealth = try container.decode(Int.self, forKey: .maxHealth)
        hasAttacked = try container.decode(Bool.self, forKey: .hasAttacked)
        isAlive = try container.decode(Bool.self, forKey: .isAlive)
        instabilityValue = try container.decode(Int.self, forKey: .instabilityValue)
        activeKeywords = try container.decode([Keyword].self, forKey: .activeKeywords)
        shieldActive = try container.decode(Bool.self, forKey: .shieldActive)
        boardSlot = try container.decode(Int.self, forKey: .boardSlot)
    }

    var factionShortName: FactionShortName? {
        FactionShortName(rawValue: factionId)
    }

    /// Faction UIColor for SpriteKit rendering
    var factionPrimaryColor: UIColor {
        factionShortName?.primaryUIColor ?? UIColor(hex: "#C9A84C")
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

// MARK: - Battle Modifier (runtime modifier state from server)

struct BattleModifier: Codable {
    let definitionId: String
    let name: String
    let isAttunedActive: Bool
    let isPenaltyActive: Bool
    let instabilityAdjustment: Int
    let grantsKeyword: Keyword?

    enum CodingKeys: String, CodingKey {
        case definitionId = "definition_id"
        case name
        case isAttunedActive = "is_attuned_active"
        case isPenaltyActive = "is_penalty_active"
        case instabilityAdjustment = "instability_adjustment"
        case grantsKeyword = "grants_keyword"
    }
}

// MARK: - Battle Triggered Ability (from evolution)

struct BattleTriggeredAbility: Codable {
    let id: String
    let cardInstanceId: String
    let trigger: String
    let name: String
    let description: String

    enum CodingKeys: String, CodingKey {
        case id
        case cardInstanceId = "card_instance_id"
        case trigger, name, description
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

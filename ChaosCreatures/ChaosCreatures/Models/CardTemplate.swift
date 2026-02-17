// CardTemplate.swift
// Chaos Creatures
// Codable struct matching the card_templates DB table (00002_core_tables.sql).
// Source of truth: docs/design/02-card-data-model.md Section 1.

import Foundation

struct CardTemplate: Codable, Identifiable, Equatable {
    let id: UUID
    let name: String
    let cardType: CardType
    let factionId: UUID

    // Base stats (Common tier values)
    let baseAttack: Int?       // Creatures only; null for spells/stabilizers
    let baseHealth: Int?       // Creatures only; null for spells/stabilizers
    let baseInstability: Int   // 0-5 for creatures, 0 for spells/stabilizers
    let manaCost: Int          // 1-10, fixed forever

    // Keywords (innate, present at Common)
    let baseKeywords: [String] // Stored as TEXT[] in DB

    // Spell/Stabilizer-specific
    let spellEffect: SpellEffect?
    let stabilizerType: StabilizerType?

    // AI generation metadata
    let artPrompt: String
    let artUrl: String
    let flavorText: String

    // Pipeline metadata
    let batchId: String?
    let approvedAt: Date?
    let approvedBy: String?
    let isLegendaryEligible: Bool

    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name
        case cardType = "card_type"
        case factionId = "faction_id"
        case baseAttack = "base_attack"
        case baseHealth = "base_health"
        case baseInstability = "base_instability"
        case manaCost = "mana_cost"
        case baseKeywords = "base_keywords"
        case spellEffect = "spell_effect"
        case stabilizerType = "stabilizer_type"
        case artPrompt = "art_prompt"
        case artUrl = "art_url"
        case flavorText = "flavor_text"
        case batchId = "batch_id"
        case approvedAt = "approved_at"
        case approvedBy = "approved_by"
        case isLegendaryEligible = "is_legendary_eligible"
        case createdAt = "created_at"
    }

    // MARK: - Computed Properties

    var keywords: [Keyword] {
        baseKeywords.compactMap { Keyword(rawValue: $0) }
    }

    var isCreature: Bool { cardType == .creature }
    var isSpell: Bool { cardType == .spell }
    var isStabilizer: Bool { cardType == .stabilizer }

    var artURL: URL? { URL(string: artUrl) }

    static func == (lhs: CardTemplate, rhs: CardTemplate) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - SpellEffect (Section 6)

struct SpellEffect: Codable {
    let effectType: SpellEffectType
    let target: TargetType
    let value: Int?
    let duration: Duration?
    let keyword: Keyword?
    let instabilityChange: Int?
    let instabilitySet: Int?
    let description: String

    enum CodingKeys: String, CodingKey {
        case effectType = "effect_type"
        case target, value, duration, keyword
        case instabilityChange = "instability_change"
        case instabilitySet = "instability_set"
        case description
    }
}

// MARK: - Effect (Section 7)

struct Effect: Codable {
    let effectType: EffectType
    let target: TargetType
    let value: Int?
    let keyword: Keyword?
    let duration: Duration?
    let secondaryEffect: Effect?
    let condition: EffectCondition?

    enum CodingKeys: String, CodingKey {
        case effectType = "effect_type"
        case target, value, keyword, duration
        case secondaryEffect = "secondary_effect"
        case condition
    }
}

// MARK: - Effect Condition

struct EffectCondition: Codable {
    let type: String        // e.g., "NONE", "CREATURE_COUNT_GTE", etc.
    let value: Int?         // The threshold/parameter for the condition
    let keyword: String?    // For HAS_KEYWORD condition
    let eventType: String?  // For LAST_EVENT_WAS condition

    enum CodingKeys: String, CodingKey {
        case type, value, keyword
        case eventType = "event_type"
    }
}

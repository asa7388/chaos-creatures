// CardInstance.swift
// Chaos Creatures
// Codable struct matching the card_instances DB table (00002_core_tables.sql).
// Source of truth: docs/design/02-card-data-model.md Section 2.

import Foundation

struct CardInstance: Codable, Identifiable, Equatable {
    let id: UUID
    let templateId: UUID
    let ownerId: UUID

    // Card type (denormalized from template, may be nil for legacy data)
    var cardType: CardType?

    // Current state
    var tier: Rarity
    var currentName: String
    var currentAttack: Int?
    var currentHealth: Int?
    var currentManaCost: Int
    var instabilityValue: Int

    // Keywords
    var innateKeywords: [String]
    var modifierKeywords: [String]

    // Evolution history (JSONB array)
    var evolutionHistory: [EvolutionRecord]

    // Modifiers (JSONB array of ModifierInstance objects)
    var modifiers: [ModifierInstance]

    // Triggered abilities (JSONB array)
    var triggeredAbilities: [TriggeredAbility]

    // Progression
    var chaosEnergy: Int
    var gamesPlayed: Int

    // Art
    var artUrl: String
    var flavorText: String
    var artPromptHistory: [String]

    // Metadata
    var isFavorite: Bool
    var inDeckIds: [UUID]
    let createdAt: Date
    var lastEvolvedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case templateId = "template_id"
        case ownerId = "owner_id"
        case cardType = "card_type"
        case tier
        case currentName = "current_name"
        case currentAttack = "current_attack"
        case currentHealth = "current_health"
        case currentManaCost = "current_mana_cost"
        case instabilityValue = "instability_value"
        case innateKeywords = "innate_keywords"
        case modifierKeywords = "modifier_keywords"
        case evolutionHistory = "evolution_history"
        case modifiers
        case triggeredAbilities = "triggered_abilities"
        case chaosEnergy = "chaos_energy"
        case gamesPlayed = "games_played"
        case artUrl = "art_url"
        case flavorText = "flavor_text"
        case artPromptHistory = "art_prompt_history"
        case isFavorite = "is_favorite"
        case inDeckIds = "in_deck_ids"
        case createdAt = "created_at"
        case lastEvolvedAt = "last_evolved_at"
    }

    // MARK: - Computed Properties

    var artURL: URL? { URL(string: artUrl) }

    var isPlanarRuin: Bool { cardType == .planarRuin }
    var isCreature: Bool { cardType == .creature }
    var isSpell: Bool { cardType == .spell }
    var isStabilizer: Bool { cardType == .stabilizer }

    /// Effective keywords = union of innate + modifier keywords
    var effectiveKeywords: [Keyword] {
        let allRaw = Set(innateKeywords + modifierKeywords)
        return allRaw.compactMap { Keyword(rawValue: $0) }
    }

    /// Energy threshold for next evolution tier
    var nextEnergyThreshold: Int? {
        tier.nextTier?.energyThreshold
    }

    /// Whether this card has enough energy to evolve
    var isEvolutionReady: Bool {
        guard let threshold = nextEnergyThreshold else { return false }
        return chaosEnergy >= threshold
    }

    /// Progress toward next evolution (0.0 - 1.0)
    var evolutionProgress: Double {
        guard let threshold = nextEnergyThreshold, threshold > 0 else { return 1.0 }
        return min(Double(chaosEnergy) / Double(threshold), 1.0)
    }

    /// Number of order-attuned modifiers
    var orderAttunementCount: Int {
        modifiers.filter { $0.attunement == .order }.count
    }

    /// Number of chaos-attuned modifiers
    var chaosAttunementCount: Int {
        modifiers.filter { $0.attunement == .chaos }.count
    }

    /// Number of order triggers
    var orderTriggerCount: Int {
        triggeredAbilities.filter { $0.trigger == .onOrder }.count
    }

    /// Number of chaos triggers
    var chaosTriggerCount: Int {
        triggeredAbilities.filter { $0.trigger == .onChaos }.count
    }

    static func == (lhs: CardInstance, rhs: CardInstance) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Evolution Record (Section 3)

struct EvolutionRecord: Codable, Identifiable {
    var id: String { "\(step)" }

    let step: Int                    // 1-4
    let fromTier: Rarity
    let toTier: Rarity
    let channeledToward: EventType
    let actualOutcome: EventType
    let modifierChosenId: String
    let modifierRejectedId: String
    let abilityGrantedId: String

    // Stat changes
    let attackChange: Int?
    let healthChange: Int?
    let instabilityChange: Int

    // AI generation
    let referenceArtUrl: String
    let artUrl: String
    let artPrompt: String
    let promptModifiersSelected: [String]
    let nameCandidates: [String]
    let nameChosen: String
    let flavorText: String

    // Shard & generation metadata
    let evolvedAt: Date
    let shardConsumed: ShardTier
    let shardQuality: ShardQuality
    let generationModel: String
    let generationResolution: String
    let textGenerationModel: String

    enum CodingKeys: String, CodingKey {
        case step
        case fromTier = "from_tier"
        case toTier = "to_tier"
        case channeledToward = "channeled_toward"
        case actualOutcome = "actual_outcome"
        case modifierChosenId = "modifier_chosen_id"
        case modifierRejectedId = "modifier_rejected_id"
        case abilityGrantedId = "ability_granted_id"
        case attackChange = "attack_change"
        case healthChange = "health_change"
        case instabilityChange = "instability_change"
        case referenceArtUrl = "reference_art_url"
        case artUrl = "art_url"
        case artPrompt = "art_prompt"
        case promptModifiersSelected = "prompt_modifiers_selected"
        case nameCandidates = "name_candidates"
        case nameChosen = "name_chosen"
        case flavorText = "flavor_text"
        case evolvedAt = "evolved_at"
        case shardConsumed = "shard_consumed"
        case shardQuality = "shard_quality"
        case generationModel = "generation_model"
        case generationResolution = "generation_resolution"
        case textGenerationModel = "text_generation_model"
    }
}

// MARK: - Modifier Instance (Section 4b)

struct ModifierInstance: Codable, Identifiable {
    let id: UUID
    let definitionId: UUID
    let cardInstanceId: UUID
    let evolutionStep: Int

    // Denormalized from definition
    let name: String
    let poolType: ModifierPoolType
    let factionMechanic: FactionMechanic?
    let attunement: EventType
    let baseEffect: Effect
    let attunedEffect: Effect
    let hasPenalty: Bool
    let penaltyEffect: Effect?
    let grantsKeyword: Keyword?
    let keywordIsAttuned: Bool
    let instabilityAdjustment: Int
    let instabilityIsAttuned: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case definitionId = "definition_id"
        case cardInstanceId = "card_instance_id"
        case evolutionStep = "evolution_step"
        case name
        case poolType = "pool_type"
        case factionMechanic = "faction_mechanic"
        case attunement
        case baseEffect = "base_effect"
        case attunedEffect = "attuned_effect"
        case hasPenalty = "has_penalty"
        case penaltyEffect = "penalty_effect"
        case grantsKeyword = "grants_keyword"
        case keywordIsAttuned = "keyword_is_attuned"
        case instabilityAdjustment = "instability_adjustment"
        case instabilityIsAttuned = "instability_is_attuned"
    }
}

// MARK: - Triggered Ability (Section 5)

struct TriggeredAbility: Codable, Identifiable {
    let id: UUID
    let cardInstanceId: UUID
    let evolutionStep: Int
    let trigger: TriggerType
    let effect: Effect
    let description: String
    let name: String

    enum CodingKeys: String, CodingKey {
        case id
        case cardInstanceId = "card_instance_id"
        case evolutionStep = "evolution_step"
        case trigger, effect, description, name
    }
}

// MARK: - Modifier Definition (Section 4a, read-only game content)

struct ModifierDefinition: Codable, Identifiable {
    let id: UUID
    let name: String
    let flavorText: String
    let poolType: ModifierPoolType
    let factionId: UUID?
    let ppCost: Int
    let tierBracket: TierBracket
    let attunement: EventType
    let baseEffect: Effect
    let attunedEffect: Effect
    let hasPenalty: Bool
    let penaltyEffect: Effect?
    let grantsKeyword: Keyword?
    let keywordIsAttuned: Bool
    let instabilityAdjustment: Int
    let instabilityIsAttuned: Bool
    let factionMechanic: FactionMechanic?
    let powerRating: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name
        case flavorText = "flavor_text"
        case poolType = "pool_type"
        case factionId = "faction_id"
        case ppCost = "pp_cost"
        case tierBracket = "tier_bracket"
        case attunement
        case baseEffect = "base_effect"
        case attunedEffect = "attuned_effect"
        case hasPenalty = "has_penalty"
        case penaltyEffect = "penalty_effect"
        case grantsKeyword = "grants_keyword"
        case keywordIsAttuned = "keyword_is_attuned"
        case instabilityAdjustment = "instability_adjustment"
        case instabilityIsAttuned = "instability_is_attuned"
        case factionMechanic = "faction_mechanic"
        case powerRating = "power_rating"
        case createdAt = "created_at"
    }
}

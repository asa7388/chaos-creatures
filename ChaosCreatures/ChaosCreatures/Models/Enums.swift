// Enums.swift
// Chaos Creatures
// All game enums matching Supabase schema (00001_enums.sql) and doc 02-card-data-model.md exactly.

import Foundation

// MARK: - Card Types (Section 1)

enum CardType: String, Codable, CaseIterable, Identifiable {
    case creature = "CREATURE"
    case spell = "SPELL"
    case stabilizer = "STABILIZER"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .creature: return "Creature"
        case .spell: return "Spell"
        case .stabilizer: return "Stabilizer"
        }
    }
}

// MARK: - Keywords (Section 1)

enum Keyword: String, Codable, CaseIterable, Identifiable {
    case shield = "SHIELD"
    case lifesteal = "LIFESTEAL"
    case flying = "FLYING"
    case reach = "REACH"
    case deathtouch = "DEATHTOUCH"
    case taunt = "TAUNT"
    case piercing = "PIERCING"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .shield: return "Shield"
        case .lifesteal: return "Lifesteal"
        case .flying: return "Flying"
        case .reach: return "Reach"
        case .deathtouch: return "Deathtouch"
        case .taunt: return "Taunt"
        case .piercing: return "Piercing"
        }
    }

    var description: String {
        switch self {
        case .shield: return "Absorbs the first instance of damage, then breaks."
        case .lifesteal: return "Heals its controller for damage dealt."
        case .flying: return "Can only be blocked by creatures with Flying or Reach."
        case .reach: return "Can block creatures with Flying."
        case .deathtouch: return "Any damage this deals to a creature destroys it."
        case .taunt: return "Must be attacked and must block if able."
        case .piercing: return "Excess combat damage is dealt to the defending player."
        }
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

// MARK: - Stabilizer Types (Section 1)

enum StabilizerType: String, Codable, CaseIterable {
    case order = "ORDER"
    case chaos = "CHAOS"
    case hybrid = "HYBRID"
}

// MARK: - Evolution Tiers (Section 2)

enum EvolutionTier: String, Codable, CaseIterable, Identifiable, Comparable {
    case common = "COMMON"
    case uncommon = "UNCOMMON"
    case rare = "RARE"
    case epic = "EPIC"
    case legendary = "LEGENDARY"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .common: return "Common"
        case .uncommon: return "Uncommon"
        case .rare: return "Rare"
        case .epic: return "Epic"
        case .legendary: return "Legendary"
        }
    }

    /// Index for comparison (0-4)
    var tierIndex: Int {
        switch self {
        case .common: return 0
        case .uncommon: return 1
        case .rare: return 2
        case .epic: return 3
        case .legendary: return 4
        }
    }

    /// Chaos energy threshold to reach this tier
    var energyThreshold: Int {
        switch self {
        case .common: return 0
        case .uncommon: return 15
        case .rare: return 30
        case .epic: return 50
        case .legendary: return 75
        }
    }

    /// The next tier, if any
    var nextTier: EvolutionTier? {
        switch self {
        case .common: return .uncommon
        case .uncommon: return .rare
        case .rare: return .epic
        case .epic: return .legendary
        case .legendary: return nil
        }
    }

    static func < (lhs: EvolutionTier, rhs: EvolutionTier) -> Bool {
        lhs.tierIndex < rhs.tierIndex
    }
}

// MARK: - Event Types (Section 3)

enum EventType: String, Codable, CaseIterable {
    case order = "ORDER"
    case chaos = "CHAOS"
}

// MARK: - Shard Tiers (Section 3)

enum ShardTier: String, Codable, CaseIterable {
    case uncommon = "UNCOMMON"
    case rare = "RARE"
    case epic = "EPIC"
    case legendary = "LEGENDARY"

    var displayName: String {
        switch self {
        case .uncommon: return "Uncommon Shard"
        case .rare: return "Rare Shard"
        case .epic: return "Epic Shard"
        case .legendary: return "Legendary Shard"
        }
    }
}

// MARK: - Shard Quality (Section 3)

enum ShardQuality: String, Codable, CaseIterable {
    case planar = "PLANAR"
    case refined = "REFINED"
    case prismatic = "PRISMATIC"
}

// MARK: - Modifier Pool Type (Section 4a)

enum ModifierPoolType: String, Codable, CaseIterable {
    case universal = "UNIVERSAL"
    case faction = "FACTION"
}

// MARK: - Tier Bracket (Section 4a)

enum TierBracket: String, Codable, CaseIterable {
    case early = "EARLY"
    case late = "LATE"
}

// MARK: - Faction Mechanic (Section 4a / Section 10)

enum FactionMechanic: String, Codable, CaseIterable {
    case augment = "AUGMENT"
    case bond = "BOND"
    case corruption = "CORRUPTION"
}

// MARK: - Trigger Types (Section 5)

enum TriggerType: String, Codable, CaseIterable {
    case onOrder = "ON_ORDER"
    case onChaos = "ON_CHAOS"
    case onPlay = "ON_PLAY"
    case onDeath = "ON_DEATH"
    case onDamageTaken = "ON_DAMAGE_TAKEN"
    case onAttack = "ON_ATTACK"
    case onBlock = "ON_BLOCK"
}

// MARK: - Spell Effect Types (Section 6)

enum SpellEffectType: String, Codable, CaseIterable {
    case damage = "DAMAGE"
    case heal = "HEAL"
    case buffAttack = "BUFF_ATTACK"
    case buffHealth = "BUFF_HEALTH"
    case draw = "DRAW"
    case gainMana = "GAIN_MANA"
    case grantKeyword = "GRANT_KEYWORD"
    case removeKeyword = "REMOVE_KEYWORD"
    case destroy = "DESTROY"
    case instabilityModify = "INSTABILITY_MODIFY"
    case instabilitySet = "INSTABILITY_SET"
    case chooseEventType = "CHOOSE_EVENT_TYPE"
    case costReduction = "COST_REDUCTION"
}

// MARK: - Target Types (Section 6)

enum TargetType: String, Codable, CaseIterable {
    case `self` = "SELF"
    case friendlyCreature = "FRIENDLY_CREATURE"
    case enemyCreature = "ENEMY_CREATURE"
    case anyCreature = "ANY_CREATURE"
    case allFriendly = "ALL_FRIENDLY"
    case allEnemy = "ALL_ENEMY"
    case allCreatures = "ALL_CREATURES"
    case randomFriendly = "RANDOM_FRIENDLY"
    case randomEnemy = "RANDOM_ENEMY"
    case randomAny = "RANDOM_ANY"
    case lowestHPFriendly = "LOWEST_HP_FRIENDLY"
    case lowestHPEnemy = "LOWEST_HP_ENEMY"
    case highestATKFriendly = "HIGHEST_ATK_FRIENDLY"
    case highestATKEnemy = "HIGHEST_ATK_ENEMY"
    case highestCostInHand = "HIGHEST_COST_IN_HAND"
    case playerSelf = "PLAYER_SELF"
    case playerOpponent = "PLAYER_OPPONENT"
}

// MARK: - Duration (Section 6)

enum Duration: String, Codable, CaseIterable {
    case thisTurn = "THIS_TURN"
    case permanent = "PERMANENT"
    case whileOnField = "WHILE_ON_FIELD"
    case untilNextRoll = "UNTIL_NEXT_ROLL"
}

// MARK: - Effect Types (Section 7)

enum EffectType: String, Codable, CaseIterable {
    case statModifyAttack = "STAT_MODIFY_ATTACK"
    case statModifyHealth = "STAT_MODIFY_HEALTH"
    case statModifyCost = "STAT_MODIFY_COST"
    case damage = "DAMAGE"
    case heal = "HEAL"
    case healPlayer = "HEAL_PLAYER"
    case drawCard = "DRAW_CARD"
    case gainMana = "GAIN_MANA"
    case grantKeyword = "GRANT_KEYWORD"
    case removeKeyword = "REMOVE_KEYWORD"
    case destroyCreature = "DESTROY_CREATURE"
    case summonToken = "SUMMON_TOKEN"
    case doubleModifierActivation = "DOUBLE_MODIFIER_ACTIVATION"
    case costReduction = "COST_REDUCTION"
}

// MARK: - Subscription Tiers (Section 12)

enum SubscriptionTier: String, Codable, CaseIterable {
    case free = "FREE"
    case mid = "MID"
    case high = "HIGH"

    var displayName: String {
        switch self {
        case .free: return "Free"
        case .mid: return "Chaos Adept"
        case .high: return "Chaos Master"
        }
    }

    var maxCardsPerFaction: Int {
        switch self {
        case .free: return 50
        case .mid: return 100
        case .high: return 200
        }
    }

    var maxDeckSlots: Int {
        switch self {
        case .free: return 3
        case .mid: return 6
        case .high: return 10
        }
    }

    var modifierChoices: Int {
        switch self {
        case .free: return 2
        case .mid: return 3
        case .high: return 4
        }
    }

    var shardQuality: ShardQuality {
        switch self {
        case .free: return .planar
        case .mid: return .refined
        case .high: return .prismatic
        }
    }
}

// MARK: - Season Ranks (Section 12)

enum SeasonRank: String, Codable, CaseIterable, Comparable {
    case bronze3 = "BRONZE_3"
    case bronze2 = "BRONZE_2"
    case bronze1 = "BRONZE_1"
    case silver3 = "SILVER_3"
    case silver2 = "SILVER_2"
    case silver1 = "SILVER_1"
    case gold3 = "GOLD_3"
    case gold2 = "GOLD_2"
    case gold1 = "GOLD_1"
    case platinum3 = "PLATINUM_3"
    case platinum2 = "PLATINUM_2"
    case platinum1 = "PLATINUM_1"
    case diamond3 = "DIAMOND_3"
    case diamond2 = "DIAMOND_2"
    case diamond1 = "DIAMOND_1"
    case master = "MASTER"
    case grandmaster = "GRANDMASTER"

    var displayName: String {
        switch self {
        case .bronze3: return "Bronze III"
        case .bronze2: return "Bronze II"
        case .bronze1: return "Bronze I"
        case .silver3: return "Silver III"
        case .silver2: return "Silver II"
        case .silver1: return "Silver I"
        case .gold3: return "Gold III"
        case .gold2: return "Gold II"
        case .gold1: return "Gold I"
        case .platinum3: return "Platinum III"
        case .platinum2: return "Platinum II"
        case .platinum1: return "Platinum I"
        case .diamond3: return "Diamond III"
        case .diamond2: return "Diamond II"
        case .diamond1: return "Diamond I"
        case .master: return "Master"
        case .grandmaster: return "Grandmaster"
        }
    }

    var rankIndex: Int {
        Self.allCases.firstIndex(of: self) ?? 0
    }

    static func < (lhs: SeasonRank, rhs: SeasonRank) -> Bool {
        lhs.rankIndex < rhs.rankIndex
    }
}

// MARK: - Colorblind Modes (Section 12)

enum ColorblindMode: String, Codable, CaseIterable {
    case none = "NONE"
    case deuteranopia = "DEUTERANOPIA"
    case protanopia = "PROTANOPIA"
    case tritanopia = "TRITANOPIA"
}

// MARK: - Quality Levels (Section 12)

enum QualityLevel: String, Codable, CaseIterable {
    case full = "FULL"
    case reduced = "REDUCED"
    case minimal = "MINIMAL"
}

// MARK: - Game Modes (Section 14)

enum GameMode: String, Codable, CaseIterable {
    case ranked = "RANKED"
    case casual = "CASUAL"
    case practice = "PRACTICE"

    var displayName: String {
        switch self {
        case .ranked: return "Ranked"
        case .casual: return "Casual"
        case .practice: return "Practice"
        }
    }
}

// MARK: - End Reasons (Section 14)

enum EndReason: String, Codable, CaseIterable {
    case hpZero = "HP_ZERO"
    case surrender = "SURRENDER"
    case disconnect = "DISCONNECT"
    case timeout = "TIMEOUT"
}

// MARK: - Mission Types (Section 16)

enum MissionType: String, Codable, CaseIterable {
    case winGames = "WIN_GAMES"
    case playCards = "PLAY_CARDS"
    case playCreatures = "PLAY_CREATURES"
    case playSpells = "PLAY_SPELLS"
    case evolveCard = "EVOLVE_CARD"
    case triggerOrderEvents = "TRIGGER_ORDER_EVENTS"
    case triggerChaosEvents = "TRIGGER_CHAOS_EVENTS"
    case dealDamage = "DEAL_DAMAGE"
    case winWithStyle = "WIN_WITH_STYLE"
    case playGames = "PLAY_GAMES"
}

// MARK: - Reward Types (Section 16)

enum RewardType: String, Codable, CaseIterable {
    case xp = "XP"
    case shards = "SHARDS"
    case chaosEnergyBoost = "CHAOS_ENERGY_BOOST"
}

// MARK: - Shard Sources (Section 15)

enum ShardSource: String, Codable, CaseIterable {
    case matchReward = "MATCH_REWARD"
    case dailyLogin = "DAILY_LOGIN"
    case weeklyChallenge = "WEEKLY_CHALLENGE"
    case seasonReward = "SEASON_REWARD"
    case milestone = "MILESTONE"
    case purchase = "PURCHASE"
    case evolutionConsumed = "EVOLUTION_CONSUMED"
    case dismantleReturn = "DISMANTLE_RETURN"
    case subscriptionGrant = "SUBSCRIPTION_GRANT"
}

// MARK: - Achievement Categories (Section 17)

enum AchievementCategory: String, Codable, CaseIterable {
    case evolution = "EVOLUTION"
    case battle = "BATTLE"
    case collection = "COLLECTION"
    case chaosRoll = "CHAOS_ROLL"
    case social = "SOCIAL"
}

// MARK: - Mission Difficulty

enum MissionDifficulty: String, Codable, CaseIterable {
    case easy = "EASY"
    case medium = "MEDIUM"
    case hard = "HARD"
}

// MARK: - Mission Period

enum MissionPeriod: String, Codable, CaseIterable {
    case daily = "DAILY"
    case weekly = "WEEKLY"
    case onboarding = "ONBOARDING"
}

// MARK: - Turn Phases (Section 13)

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

    var displayName: String {
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

    /// The 9 phases displayed in the battlefield indicator (excludes setup and game over)
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

// MARK: - Player Side (Section 13)

enum PlayerSide: String, Codable {
    case player1 = "PLAYER_1"
    case player2 = "PLAYER_2"
}

// MARK: - Log Entry Types (Section 13)

enum LogEntryType: String, Codable, CaseIterable {
    case roll = "ROLL"
    case eventTriggered = "EVENT_TRIGGERED"
    case cardPlayed = "CARD_PLAYED"
    case cardDrawn = "CARD_DRAWN"
    case attackDeclared = "ATTACK_DECLARED"
    case blockerAssigned = "BLOCKER_ASSIGNED"
    case combatDamage = "COMBAT_DAMAGE"
    case creatureDestroyed = "CREATURE_DESTROYED"
    case spellCast = "SPELL_CAST"
    case modifierActivated = "MODIFIER_ACTIVATED"
    case triggerFired = "TRIGGER_FIRED"
    case hpChanged = "HP_CHANGED"
    case manaChanged = "MANA_CHANGED"
    case instabilityChanged = "INSTABILITY_CHANGED"
    case gameStart = "GAME_START"
    case gameEnd = "GAME_END"
    case surrender = "SURRENDER"
    case chaosSparkUsed = "CHAOS_SPARK_USED"
    case turnStart = "TURN_START"
    case turnTimeout = "TURN_TIMEOUT"
}

// MARK: - Faction Short Names

enum FactionShortName: String, Codable, CaseIterable, Identifiable {
    case ironwright = "IRONWRIGHT"
    case feyCourts = "FEY_COURTS"
    case demonicKingdoms = "DEMONIC_KINGDOMS"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .ironwright: return "The Ironwright Collective"
        case .feyCourts: return "The Fey Courts"
        case .demonicKingdoms: return "The Demonic Kingdoms"
        }
    }

    var shortDisplayName: String {
        switch self {
        case .ironwright: return "Ironwright"
        case .feyCourts: return "Fey Courts"
        case .demonicKingdoms: return "Demonic"
        }
    }

    var mechanic: FactionMechanic {
        switch self {
        case .ironwright: return .augment
        case .feyCourts: return .bond
        case .demonicKingdoms: return .corruption
        }
    }

}

// MARK: - Unlock Condition (Section 9)

enum UnlockConditionType: String, Codable {
    case freeStarter = "FREE_STARTER"
    case factionMastery = "FACTION_MASTERY"
    case seasonReward = "SEASON_REWARD"
    case chaosDust = "CHAOS_DUST"
}

struct UnlockCondition: Codable {
    let type: UnlockConditionType
    let level: Int?
    let season: String?
    let cost: Int?

    enum CodingKeys: String, CodingKey {
        case type, level, season, cost
    }
}

// Player.swift
// Chaos Creatures
// Codable struct matching the players DB table (00002_core_tables.sql).

import Foundation

// MARK: - Player

struct Player: Codable, Identifiable, Equatable {
    let id: UUID
    let authId: UUID
    var displayName: String
    let friendCode: String

    // Subscription
    var subscriptionTier: SubscriptionTier

    // Faction
    var primaryFactionId: UUID?
    var unlockedFactionIds: [UUID]
    var onboardingComplete: Bool

    // Progression
    var playerLevel: Int
    var playerXp: Int
    var seasonRank: SeasonRank
    var seasonRankPoints: Int
    var hiddenMmr: Int

    // Currency
    var chaosDust: Int

    // Collection limits (derived from subscription_tier, denormalized)
    var maxCardsPerFaction: Int
    var maxDeckSlots: Int

    // Shards
    var shardsUncommon: Int
    var shardsRare: Int
    var shardsEpic: Int
    var shardsLegendary: Int

    // Profile
    var showcaseCardIds: [UUID]
    var activeTitle: String?

    // Stats
    var totalGames: Int
    var totalWins: Int
    var totalLosses: Int
    var currentWinStreak: Int
    var bestWinStreak: Int
    var cardsEvolvedTotal: Int
    var highestTierReached: Rarity

    // Social
    var friendIds: [UUID]

    // Settings (JSONB)
    var settings: PlayerSettings

    // Timestamps
    let createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case authId = "auth_id"
        case displayName = "display_name"
        case friendCode = "friend_code"
        case subscriptionTier = "subscription_tier"
        case primaryFactionId = "primary_faction_id"
        case unlockedFactionIds = "unlocked_faction_ids"
        case onboardingComplete = "onboarding_complete"
        case playerLevel = "player_level"
        case playerXp = "player_xp"
        case seasonRank = "season_rank"
        case seasonRankPoints = "season_rank_points"
        case hiddenMmr = "hidden_mmr"
        case chaosDust = "chaos_dust"
        case maxCardsPerFaction = "max_cards_per_faction"
        case maxDeckSlots = "max_deck_slots"
        case shardsUncommon = "shards_uncommon"
        case shardsRare = "shards_rare"
        case shardsEpic = "shards_epic"
        case shardsLegendary = "shards_legendary"
        case showcaseCardIds = "showcase_card_ids"
        case activeTitle = "active_title"
        case totalGames = "total_games"
        case totalWins = "total_wins"
        case totalLosses = "total_losses"
        case currentWinStreak = "current_win_streak"
        case bestWinStreak = "best_win_streak"
        case cardsEvolvedTotal = "cards_evolved_total"
        case highestTierReached = "highest_tier_reached"
        case friendIds = "friend_ids"
        case settings
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // MARK: - Computed Properties

    var winRate: Double {
        guard totalGames > 0 else { return 0 }
        return Double(totalWins) / Double(totalGames)
    }

    var totalLossesComputed: Int {
        totalGames - totalWins
    }

    func shardCount(for tier: ShardTier) -> Int {
        switch tier {
        case .uncommon: return shardsUncommon
        case .rare: return shardsRare
        case .epic: return shardsEpic
        case .legendary: return shardsLegendary
        }
    }

    static func == (lhs: Player, rhs: Player) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Player Settings

struct PlayerSettings: Codable, Equatable {
    // Audio
    var masterVolume: Double
    var musicVolume: Double
    var sfxVolume: Double

    // Visuals
    var reducedMotion: Bool
    var colorblindMode: ColorblindMode
    var cardAnimationQuality: QualityLevel
    var screenShake: Bool

    // Gameplay
    var autoEndTurn: Bool
    var confirmEndTurn: Bool

    // Notifications
    var notifyDailyRewards: Bool
    var notifyEvolutionReady: Bool
    var notifyFriendActivity: Bool
    var notifySeasonEnding: Bool

    // Privacy
    var blockFriendRequests: Bool
    var hideProfile: Bool
    var hideOnlineStatus: Bool

    enum CodingKeys: String, CodingKey {
        case masterVolume = "master_volume"
        case musicVolume = "music_volume"
        case sfxVolume = "sfx_volume"
        case reducedMotion = "reduced_motion"
        case colorblindMode = "colorblind_mode"
        case cardAnimationQuality = "card_animation_quality"
        case screenShake = "screen_shake"
        case autoEndTurn = "auto_end_turn"
        case confirmEndTurn = "confirm_end_turn"
        case notifyDailyRewards = "notify_daily_rewards"
        case notifyEvolutionReady = "notify_evolution_ready"
        case notifyFriendActivity = "notify_friend_activity"
        case notifySeasonEnding = "notify_season_ending"
        case blockFriendRequests = "block_friend_requests"
        case hideProfile = "hide_profile"
        case hideOnlineStatus = "hide_online_status"
    }

    static let `default` = PlayerSettings(
        masterVolume: 1.0,
        musicVolume: 0.7,
        sfxVolume: 1.0,
        reducedMotion: false,
        colorblindMode: .none,
        cardAnimationQuality: .full,
        screenShake: true,
        autoEndTurn: false,
        confirmEndTurn: true,
        notifyDailyRewards: true,
        notifyEvolutionReady: true,
        notifyFriendActivity: true,
        notifySeasonEnding: true,
        blockFriendRequests: false,
        hideProfile: false,
        hideOnlineStatus: false
    )
}

// MARK: - Faction Mastery

struct FactionMastery: Codable, Identifiable {
    var id: UUID { factionId }
    let factionId: UUID
    var masteryLevel: Int
    var masteryXp: Int
    var gamesPlayed: Int

    enum CodingKeys: String, CodingKey {
        case factionId = "faction_id"
        case masteryLevel = "mastery_level"
        case masteryXp = "mastery_xp"
        case gamesPlayed = "games_played"
    }
}

// MARK: - Faction (matching factions table)

struct Faction: Codable, Identifiable, Equatable {
    let id: UUID
    let name: String
    let shortName: CardFaction
    let exclusiveMechanic: FactionMechanic
    let artPromptPrefix: String
    let flavorVoice: String
    let nameVoice: String
    let cardFrameAsset: String
    let colorPrimary: String
    let colorSecondary: String
    let colorBackground: String
    let particleTheme: String
    let battleMusicUrl: String?
    let ambientAudioUrl: String?
    let releasedAt: Date
    var cardTemplateCount: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name
        case shortName = "short_name"
        case exclusiveMechanic = "exclusive_mechanic"
        case artPromptPrefix = "art_prompt_prefix"
        case flavorVoice = "flavor_voice"
        case nameVoice = "name_voice"
        case cardFrameAsset = "card_frame_asset"
        case colorPrimary = "color_primary"
        case colorSecondary = "color_secondary"
        case colorBackground = "color_background"
        case particleTheme = "particle_theme"
        case battleMusicUrl = "battle_music_url"
        case ambientAudioUrl = "ambient_audio_url"
        case releasedAt = "released_at"
        case cardTemplateCount = "card_template_count"
        case createdAt = "created_at"
    }

    static func == (lhs: Faction, rhs: Faction) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Avatar (matching avatars table)

struct Avatar: Codable, Identifiable, Equatable {
    let id: UUID
    let name: String
    let factionId: UUID
    let instabilityModifier: Int
    let portraitUrl: String
    let battleSpriteUrl: String
    let frameStyle: String
    let title: String
    let loreText: String
    let unlockCondition: UnlockCondition
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name
        case factionId = "faction_id"
        case instabilityModifier = "instability_modifier"
        case portraitUrl = "portrait_url"
        case battleSpriteUrl = "battle_sprite_url"
        case frameStyle = "frame_style"
        case title
        case loreText = "lore_text"
        case unlockCondition = "unlock_condition"
        case createdAt = "created_at"
    }

    static func == (lhs: Avatar, rhs: Avatar) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Mission (matching missions table)

struct Mission: Codable, Identifiable {
    let id: UUID
    let playerId: UUID
    let missionType: MissionType
    let description: String
    let difficulty: MissionDifficulty
    let period: MissionPeriod
    let targetValue: Int
    var currentValue: Int
    var isCompleted: Bool
    var isClaimed: Bool
    let rewardDust: Int
    let rewardShardTier: ShardTier?
    let rewardShardCount: Int
    let expiresAt: Date
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case playerId = "player_id"
        case missionType = "mission_type"
        case description, difficulty, period
        case targetValue = "target_value"
        case currentValue = "current_value"
        case isCompleted = "is_completed"
        case isClaimed = "is_claimed"
        case rewardDust = "reward_dust"
        case rewardShardTier = "reward_shard_tier"
        case rewardShardCount = "reward_shard_count"
        case expiresAt = "expires_at"
        case createdAt = "created_at"
    }

    var progress: Double {
        guard targetValue > 0 else { return 0 }
        return min(Double(currentValue) / Double(targetValue), 1.0)
    }
}

// MARK: - Achievement (matching achievements table)

struct Achievement: Codable, Identifiable {
    let id: UUID
    let name: String
    let description: String
    let category: AchievementCategory
    let targetValue: Int
    let rewardType: RewardType
    let rewardAmount: Int
    let rewardTitle: String?
    let iconUrl: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, description, category
        case targetValue = "target_value"
        case rewardType = "reward_type"
        case rewardAmount = "reward_amount"
        case rewardTitle = "reward_title"
        case iconUrl = "icon_url"
        case createdAt = "created_at"
    }
}

// MARK: - Player Achievement (matching player_achievements table)

struct PlayerAchievement: Codable, Identifiable {
    let id: UUID
    let playerId: UUID
    let achievementId: UUID
    var currentValue: Int
    var isUnlocked: Bool
    let unlockedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case playerId = "player_id"
        case achievementId = "achievement_id"
        case currentValue = "current_value"
        case isUnlocked = "is_unlocked"
        case unlockedAt = "unlocked_at"
        case createdAt = "created_at"
    }

    var progress: Double {
        // Needs the Achievement's targetValue to compute
        0
    }
}

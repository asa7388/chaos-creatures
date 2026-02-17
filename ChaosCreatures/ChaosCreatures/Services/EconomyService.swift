// EconomyService.swift
// Chaos Creatures
// Dust, shards, and economy operations via Supabase.
// Source: docs/design/04-progression-economy.md, 06-technical-architecture.md

import Foundation

final class EconomyService {
    static let shared = EconomyService()
    private init() {}

    private let supabase = SupabaseService.shared

    // MARK: - Balance Queries

    /// Fetch current dust balance (from player record)
    func fetchDustBalance(playerId: UUID) async throws -> Int {
        let player: Player = try await supabase.fetch(
            from: SupabaseService.Table.players,
            id: playerId
        )
        return player.chaosDust
    }

    /// Fetch shard balances (all tiers)
    func fetchShardBalances(playerId: UUID) async throws -> ShardBalances {
        let player: Player = try await supabase.fetch(
            from: SupabaseService.Table.players,
            id: playerId
        )
        return ShardBalances(
            uncommon: player.shardsUncommon,
            rare: player.shardsRare,
            epic: player.shardsEpic,
            legendary: player.shardsLegendary
        )
    }

    // MARK: - Dust Transactions

    /// Spend dust to purchase something (validated server-side)
    func spendDust(
        playerId: UUID,
        amount: Int,
        source: String,
        referenceId: String? = nil
    ) async throws -> Int {
        struct SpendRequest: Encodable {
            let amount: Int
            let source: String
            let referenceId: String?

            enum CodingKeys: String, CodingKey {
                case amount, source
                case referenceId = "reference_id"
            }
        }

        struct SpendResponse: Decodable {
            let balanceAfter: Int

            enum CodingKeys: String, CodingKey {
                case balanceAfter = "balance_after"
            }
        }

        let response: SpendResponse = try await supabase.callFunction(
            "economy/spend-dust",
            body: SpendRequest(
                amount: amount,
                source: source,
                referenceId: referenceId
            )
        )

        return response.balanceAfter
    }

    /// Fetch dust transaction history
    func fetchDustHistory(
        playerId: UUID,
        limit: Int = 50
    ) async throws -> [DustTransaction] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.dustTransactions,
            filters: [("player_id", playerId.uuidString)],
            orderBy: "created_at",
            ascending: false,
            limit: limit
        )
    }

    // MARK: - Shard Transactions

    /// Fetch shard transaction history
    func fetchShardHistory(
        playerId: UUID,
        limit: Int = 50
    ) async throws -> [ShardTransaction] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.shardTransactions,
            filters: [("player_id", playerId.uuidString)],
            orderBy: "created_at",
            ascending: false,
            limit: limit
        )
    }

    /// Check if player can afford a shard cost
    func canAffordShard(playerId: UUID, tier: ShardTier, count: Int = 1) async throws -> Bool {
        let balances = try await fetchShardBalances(playerId: playerId)
        return balances.count(for: tier) >= count
    }

    // MARK: - Shard Purchases

    /// Purchase an Evolution Shard with Chaos Dust.
    /// Costs: Uncommon=30, Rare=60, Epic=120, Legendary=240
    func purchaseShard(tier: ShardTier) async throws -> PurchaseShardResult {
        struct PurchaseRequest: Encodable {
            let shardTier: String

            enum CodingKeys: String, CodingKey {
                case shardTier = "shard_tier"
            }
        }

        return try await supabase.callFunction(
            "purchase-shards",
            body: PurchaseRequest(shardTier: tier.rawValue)
        )
    }

    // MARK: - Card Packs

    /// Open a card pack for a faction. Deducts dust and returns new card instances.
    /// Costs: 100 dust (own faction) or 150 dust (other faction).
    func openPack(factionId: UUID) async throws -> OpenPackResult {
        struct PackRequest: Encodable {
            let factionId: String

            enum CodingKeys: String, CodingKey {
                case factionId = "faction_id"
            }
        }

        return try await supabase.callFunction(
            "open-pack",
            body: PackRequest(factionId: factionId.uuidString)
        )
    }

    // MARK: - Economy Config

    /// Fetch economy configuration values
    func fetchEconomyConfig() async throws -> [EconomyConfig] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.economyConfig,
            orderBy: "key"
        )
    }

    /// Fetch a single economy config value
    func fetchConfigValue(key: String) async throws -> EconomyConfig? {
        let results: [EconomyConfig] = try await supabase.fetchAll(
            from: SupabaseService.Table.economyConfig,
            filters: [("key", key)],
            limit: 1
        )
        return results.first
    }

    // MARK: - Missions

    /// Fetch active missions for the player
    func fetchActiveMissions(playerId: UUID) async throws -> [Mission] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.missions,
            filters: [
                ("player_id", playerId.uuidString),
                ("is_completed", "false")
            ],
            orderBy: "expires_at"
        )
    }

    /// Claim a completed mission reward
    func claimMission(missionId: UUID) async throws -> MissionClaimResult {
        struct ClaimRequest: Encodable {
            let missionId: UUID

            enum CodingKeys: String, CodingKey {
                case missionId = "mission_id"
            }
        }

        return try await supabase.callFunction(
            "economy/claim-mission",
            body: ClaimRequest(missionId: missionId)
        )
    }

    // MARK: - Post-Match Rewards

    /// Process post-match rewards (called after a match completes)
    func processMatchRewards(matchId: String, won: Bool) async throws -> MatchRewards {
        struct RewardRequest: Encodable {
            let matchId: String
            let won: Bool

            enum CodingKeys: String, CodingKey {
                case matchId = "match_id"
                case won
            }
        }

        return try await supabase.callFunction(
            "economy/match-rewards",
            body: RewardRequest(matchId: matchId, won: won)
        )
    }
}

// MARK: - Supporting Types

struct ShardBalances: Equatable {
    let uncommon: Int
    let rare: Int
    let epic: Int
    let legendary: Int

    func count(for tier: ShardTier) -> Int {
        switch tier {
        case .uncommon: return uncommon
        case .rare: return rare
        case .epic: return epic
        case .legendary: return legendary
        }
    }
}

struct MissionClaimResult: Decodable {
    let dustAwarded: Int
    let shardsAwarded: Int?
    let shardTier: ShardTier?
    let xpAwarded: Int

    enum CodingKeys: String, CodingKey {
        case dustAwarded = "dust_awarded"
        case shardsAwarded = "shards_awarded"
        case shardTier = "shard_tier"
        case xpAwarded = "xp_awarded"
    }
}

struct PurchaseShardResult: Decodable {
    let shardTier: String
    let dustSpent: Int

    enum CodingKeys: String, CodingKey {
        case shardTier = "shard_tier"
        case dustSpent = "dust_spent"
    }
}

struct OpenPackResult: Decodable {
    let cards: [CardInstanceData]
    let dustSpent: Int

    enum CodingKeys: String, CodingKey {
        case cards
        case dustSpent = "dust_spent"
    }
}

struct CardInstanceData: Decodable, Identifiable {
    let id: UUID
    let templateId: UUID
    let currentName: String
    let tier: String
    let artUrl: String

    enum CodingKeys: String, CodingKey {
        case id
        case templateId = "template_id"
        case currentName = "current_name"
        case tier
        case artUrl = "art_url"
    }
}

struct MatchRewards: Decodable {
    let dustAwarded: Int
    let xpAwarded: Int
    let chaosEnergyAwarded: Int
    let rankPointsChange: Int
    let shardAwarded: ShardTier?
    let missionsProgressed: [UUID]

    enum CodingKeys: String, CodingKey {
        case dustAwarded = "dust_awarded"
        case xpAwarded = "xp_awarded"
        case chaosEnergyAwarded = "chaos_energy_awarded"
        case rankPointsChange = "rank_points_change"
        case shardAwarded = "shard_awarded"
        case missionsProgressed = "missions_progressed"
    }
}

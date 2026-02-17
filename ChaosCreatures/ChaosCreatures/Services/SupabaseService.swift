// SupabaseService.swift
// Chaos Creatures
// Supabase Swift SDK client singleton.
// Source: docs/design/06-technical-architecture.md Section 2.2

import Foundation
import Supabase

final class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient
    let isConfigured: Bool

    private init() {
        let urlString = Secrets.supabaseURL
        let key = Secrets.supabaseAnonKey

        // Guard against placeholder/empty values to prevent crash on launch
        if let url = URL(string: urlString),
           url.host != nil,
           !key.isEmpty,
           key != "placeholder-key" {
            client = SupabaseClient(supabaseURL: url, supabaseKey: key)
            isConfigured = true
        } else {
            // Provide a dummy client so the app can still launch and show UI
            client = SupabaseClient(
                supabaseURL: URL(string: "https://localhost.invalid")!,
                supabaseKey: "not-configured"
            )
            isConfigured = false
            print("[SupabaseService] Not configured — set real values in Config.xcconfig")
        }
    }

    // MARK: - Convenience Query Methods

    /// Fetch a single row by ID
    func fetch<T: Decodable>(
        from table: String,
        id: UUID,
        as type: T.Type = T.self
    ) async throws -> T {
        try await client
            .from(table)
            .select()
            .eq("id", value: id.uuidString)
            .single()
            .execute()
            .value
    }

    /// Fetch multiple rows with optional filters
    func fetchAll<T: Decodable>(
        from table: String,
        as type: T.Type = T.self,
        filters: [(column: String, value: String)] = [],
        orderBy: String? = nil,
        ascending: Bool = true,
        limit: Int? = nil
    ) async throws -> [T] {
        var filterQuery = client.from(table).select()

        for filter in filters {
            filterQuery = filterQuery.eq(filter.column, value: filter.value)
        }

        var transformQuery: PostgrestTransformBuilder = filterQuery

        if let orderBy {
            transformQuery = transformQuery.order(orderBy, ascending: ascending)
        }

        if let limit {
            transformQuery = transformQuery.limit(limit)
        }

        return try await transformQuery.execute().value
    }

    /// Insert a row
    func insert<T: Encodable>(
        into table: String,
        values: T
    ) async throws {
        try await client
            .from(table)
            .insert(values)
            .execute()
    }

    /// Update rows matching filters
    func update<T: Encodable>(
        table: String,
        values: T,
        filters: [(column: String, value: String)]
    ) async throws {
        var query = try client.from(table).update(values)

        for filter in filters {
            query = query.eq(filter.column, value: filter.value)
        }

        try await query.execute()
    }

    /// Delete rows matching filters
    func delete(
        from table: String,
        filters: [(column: String, value: String)]
    ) async throws {
        var query = client.from(table).delete()

        for filter in filters {
            query = query.eq(filter.column, value: filter.value)
        }

        try await query.execute()
    }

    /// Call a Supabase Edge Function
    func callFunction<T: Decodable>(
        _ functionName: String,
        body: (any Encodable)? = nil
    ) async throws -> T {
        if let body {
            return try await client.functions
                .invoke(functionName, options: .init(body: body))
        } else {
            return try await client.functions
                .invoke(functionName)
        }
    }

    /// Call an Edge Function without expecting a return value
    func callFunction(
        _ functionName: String,
        body: (any Encodable)? = nil
    ) async throws {
        if let body {
            try await client.functions
                .invoke(functionName, options: .init(body: body))
        } else {
            try await client.functions
                .invoke(functionName)
        }
    }

    // MARK: - Auth Convenience

    /// Current authenticated user ID
    var currentUserID: UUID? {
        get async {
            try? await client.auth.session.user.id
        }
    }

    /// Current auth session
    var currentSession: Session? {
        get async {
            try? await client.auth.session
        }
    }
}

// MARK: - Table Names

extension SupabaseService {
    enum Table {
        static let players = "players"
        static let factions = "factions"
        static let avatars = "avatars"
        static let cardTemplates = "card_templates"
        static let cardInstances = "card_instances"
        static let decks = "decks"
        static let matchRecords = "match_records"
        static let matchmakingQueue = "matchmaking_queue"
        static let modifierDefinitions = "modifier_definitions"
        static let eventDefinitions = "event_definitions"
        static let economyConfig = "economy_config"
        static let shardTransactions = "shard_transactions"
        static let dustTransactions = "dust_transactions"
        static let achievements = "achievements"
        static let playerAchievements = "player_achievements"
        static let missions = "missions"
        static let friendRequests = "friend_requests"
    }
}

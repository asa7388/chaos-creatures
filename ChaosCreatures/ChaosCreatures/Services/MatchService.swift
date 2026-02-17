// MatchService.swift
// Chaos Creatures
// Realtime channel for active match communication via Supabase Realtime.
// Handles WebSocket connection, sending player actions, receiving game events.
// Source: docs/design/06-technical-architecture.md Section 2.4

import Foundation
import Supabase

@MainActor @Observable
final class MatchService {
    static let shared = MatchService()

    // MARK: - State

    var isConnected = false
    var connectionError: String?

    // MARK: - Callbacks

    /// Called when a game event is received from the server
    var onGameEvent: ((ServerEvent) -> Void)?

    /// Called when connection state changes
    var onConnectionStateChange: ((Bool) -> Void)?

    // MARK: - Private

    private var matchChannel: RealtimeChannelV2?
    private var currentMatchId: String?
    private var heartbeatTask: Task<Void, Never>?
    private let supabase = SupabaseService.shared

    private init() {}

    // MARK: - Connection

    /// Connect to a match channel
    func connect(matchId: String, playerId: UUID) async throws {
        // Disconnect from any existing match
        await disconnect()

        currentMatchId = matchId

        let channel = supabase.client.realtimeV2.channel("match:\(matchId)")

        // Listen for broadcast messages (game events from server)
        let events = channel.broadcastStream(event: "game_event")

        try await channel.subscribeWithError()
        matchChannel = channel
        isConnected = true
        connectionError = nil
        onConnectionStateChange?(true)

        // Start listening for events
        Task { @MainActor [weak self] in
            for await message in events {
                guard let self else { return }

                // Decode the server event from the broadcast payload
                if let jsonData = try? JSONSerialization.data(
                    withJSONObject: message,
                    options: []
                ),
                   let event = try? JSONDecoder().decode(
                    ServerEvent.self,
                    from: jsonData
                   ) {
                    self.onGameEvent?(event)
                }
            }
        }

        // Start heartbeat
        startHeartbeat(matchId: matchId, playerId: playerId)
    }

    /// Disconnect from the current match
    func disconnect() async {
        heartbeatTask?.cancel()
        heartbeatTask = nil

        if let channel = matchChannel {
            await channel.unsubscribe()
            matchChannel = nil
        }

        isConnected = false
        currentMatchId = nil
        onConnectionStateChange?(false)
    }

    // MARK: - Send Actions

    /// Send a player action to the game server
    func sendAction(_ action: PlayerAction) async {
        guard let channel = matchChannel, isConnected else {
            connectionError = "Not connected to match"
            return
        }

        // Use the Codable overload so the server receives the expected format.
        try? await channel.broadcast(event: "player_action", message: action)
    }

    /// Send end turn action
    func sendEndTurn() async {
        await sendAction(.endTurn)
    }

    /// Send surrender action
    func sendSurrender() async {
        await sendAction(.surrender)
    }

    // MARK: - Heartbeat

    /// Send periodic heartbeat to keep connection alive and detect timeouts
    private func startHeartbeat(matchId: String, playerId: UUID) {
        heartbeatTask?.cancel()

        heartbeatTask = Task { @MainActor [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 10_000_000_000) // 10 seconds
                guard let self, self.isConnected else { return }

                // Send heartbeat via broadcast
                try? await self.matchChannel?.broadcast(
                    event: "heartbeat",
                    message: ["player_id": playerId.uuidString]
                )
            }
        }
    }

    // MARK: - Match Records

    /// Fetch a match record by ID
    func fetchMatchRecord(matchId: String) async throws -> MatchRecord {
        let records: [MatchRecord] = try await supabase.fetchAll(
            from: SupabaseService.Table.matchRecords,
            filters: [("id", matchId)],
            limit: 1
        )
        guard let record = records.first else {
            throw MatchServiceError.matchNotFound
        }
        return record
    }

    /// Fetch recent match history for a player
    func fetchMatchHistory(
        playerId: UUID,
        limit: Int = 20
    ) async throws -> [MatchRecord] {
        // Edge function handles the complex query
        // (match records where player is player1 OR player2)
        struct HistoryRequest: Encodable {
            let playerId: UUID
            let limit: Int

            enum CodingKeys: String, CodingKey {
                case playerId = "player_id"
                case limit
            }
        }

        return try await supabase.callFunction(
            "match/history",
            body: HistoryRequest(playerId: playerId, limit: limit)
        )
    }
}

// MARK: - Errors

enum MatchServiceError: LocalizedError {
    case matchNotFound
    case notConnected
    case sendFailed

    var errorDescription: String? {
        switch self {
        case .matchNotFound: return "Match not found."
        case .notConnected: return "Not connected to match server."
        case .sendFailed: return "Failed to send action."
        }
    }
}

// MARK: - Match Record (from match_records table)

struct MatchRecord: Codable, Identifiable {
    let id: UUID
    let gameMode: GameMode
    let player1Id: UUID
    let player2Id: UUID?
    let player1DeckId: UUID
    let player2DeckId: UUID?
    let winnerId: UUID?
    let endReason: EndReason?
    let totalTurns: Int
    let durationSeconds: Int
    let player1FinalHp: Int
    let player2FinalHp: Int
    let createdAt: Date
    let endedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case gameMode = "mode"
        case player1Id = "player_1_id"
        case player2Id = "player_2_id"
        case player1DeckId = "player_1_deck_id"
        case player2DeckId = "player_2_deck_id"
        case winnerId = "winner_id"
        case endReason = "end_reason"
        case totalTurns = "total_turns"
        case durationSeconds = "duration_seconds"
        case player1FinalHp = "player_1_final_hp"
        case player2FinalHp = "player_2_final_hp"
        case createdAt = "started_at"
        case endedAt = "ended_at"
    }
}

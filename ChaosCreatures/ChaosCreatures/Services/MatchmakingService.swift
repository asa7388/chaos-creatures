// MatchmakingService.swift
// Chaos Creatures
// Queue join/leave + match found listener via Supabase Realtime.
// Source: docs/design/06-technical-architecture.md Section 2.4

import Foundation
import Supabase

@MainActor @Observable
final class MatchmakingService {
    static let shared = MatchmakingService()

    // MARK: - State

    var isSearching = false
    var matchFound = false
    var matchId: String?
    var estimatedWait: TimeInterval = 30
    var searchDuration: TimeInterval = 0
    var error: String?

    // MARK: - Private

    private var queueChannel: RealtimeChannelV2?
    private var searchTimer: Task<Void, Never>?
    private let supabase = SupabaseService.shared

    private init() {}

    // MARK: - Queue Management

    /// Join the matchmaking queue
    func joinQueue(
        playerId: UUID,
        deckId: UUID,
        gameMode: GameMode,
        mmr: Int
    ) async throws {
        guard !isSearching else { return }

        isSearching = true
        matchFound = false
        matchId = nil
        searchDuration = 0
        error = nil

        struct QueueEntry: Encodable {
            let playerId: UUID
            let deckId: UUID
            let gameMode: GameMode
            let mmr: Int

            enum CodingKeys: String, CodingKey {
                case playerId = "player_id"
                case deckId = "deck_id"
                case gameMode = "game_mode"
                case mmr
            }
        }

        do {
            // Insert into matchmaking queue
            try await supabase.insert(
                into: SupabaseService.Table.matchmakingQueue,
                values: QueueEntry(
                    playerId: playerId,
                    deckId: deckId,
                    gameMode: gameMode,
                    mmr: mmr
                )
            )

            // Start listening for match assignment
            await subscribeToMatchFound(playerId: playerId)

            // Start search timer
            startSearchTimer()
        } catch {
            isSearching = false
            self.error = "Failed to join queue: \(error.localizedDescription)"
            throw error
        }
    }

    /// Leave the matchmaking queue
    func leaveQueue(playerId: UUID) async {
        // Remove from queue table
        do {
            try await supabase.delete(
                from: SupabaseService.Table.matchmakingQueue,
                filters: [("player_id", playerId.uuidString)]
            )
        } catch {
            // Best-effort removal
        }

        // Unsubscribe from realtime channel
        await unsubscribe()

        // Reset state
        isSearching = false
        matchFound = false
        matchId = nil
        searchTimer?.cancel()
        searchTimer = nil
    }

    /// Start a practice match against AI
    func startPracticeMatch(playerId: UUID, deckId: UUID) async throws -> String {
        struct PracticeRequest: Encodable {
            let playerId: UUID
            let deckId: UUID

            enum CodingKeys: String, CodingKey {
                case playerId = "player_id"
                case deckId = "deck_id"
            }
        }

        struct PracticeResponse: Decodable {
            let matchId: String

            enum CodingKeys: String, CodingKey {
                case matchId = "match_id"
            }
        }

        let response: PracticeResponse = try await supabase.callFunction(
            "matchmaking/practice",
            body: PracticeRequest(playerId: playerId, deckId: deckId)
        )

        return response.matchId
    }

    // MARK: - Realtime Subscription

    /// Subscribe to match found notifications via Supabase Realtime
    private func subscribeToMatchFound(playerId: UUID) async {
        let channel = supabase.client.realtimeV2.channel("matchmaking:\(playerId.uuidString)")

        let changes = channel.postgresChange(
            InsertAction.self,
            schema: "public",
            table: "match_assignments",
            filter: "player_id=eq.\(playerId.uuidString)"
        )

        await channel.subscribe()

        self.queueChannel = channel

        // Listen for match assignment in background
        Task { @MainActor [weak self] in
            for await change in changes {
                guard let self, self.isSearching else { return }

                if let matchIdValue = change.record["match_id"]?.stringValue {
                    self.matchFound = true
                    self.matchId = matchIdValue
                    self.isSearching = false
                    self.searchTimer?.cancel()
                    return
                }
            }
        }
    }

    /// Unsubscribe from the realtime channel
    private func unsubscribe() async {
        if let channel = queueChannel {
            await channel.unsubscribe()
            queueChannel = nil
        }
    }

    // MARK: - Search Timer

    private func startSearchTimer() {
        searchTimer?.cancel()
        searchDuration = 0

        searchTimer = Task { @MainActor [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
                guard let self, self.isSearching else { return }
                self.searchDuration += 1
            }
        }
    }

    /// Formatted search duration string (e.g., "1:30")
    var searchDurationFormatted: String {
        let minutes = Int(searchDuration) / 60
        let seconds = Int(searchDuration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

// MARK: - Match Assignment Payload

private struct MatchAssignment: Decodable {
    let matchId: String
    let playerId: UUID

    enum CodingKeys: String, CodingKey {
        case matchId = "match_id"
        case playerId = "player_id"
    }
}

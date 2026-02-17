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

    /// Join the matchmaking queue via Edge Function
    func joinQueue(
        deckId: UUID,
        gameMode: GameMode = .ranked
    ) async throws {
        guard !isSearching else { return }

        isSearching = true
        matchFound = false
        matchId = nil
        searchDuration = 0
        error = nil

        struct JoinQueueRequest: Encodable {
            let deckId: UUID
            let mode: String

            enum CodingKeys: String, CodingKey {
                case deckId = "deck_id"
                case mode
            }
        }

        struct JoinQueueEnvelope: Decodable {
            let data: JoinQueueResponse
        }

        struct JoinQueueResponse: Decodable {
            let queueId: String
            let estimatedWaitSeconds: Int

            enum CodingKeys: String, CodingKey {
                case queueId = "queue_id"
                case estimatedWaitSeconds = "estimated_wait_seconds"
            }
        }

        do {
            // Call join-queue Edge Function (player_id read from JWT server-side)
            let envelope: JoinQueueEnvelope = try await supabase.callFunction(
                "join-queue",
                body: JoinQueueRequest(
                    deckId: deckId,
                    mode: gameMode.rawValue
                )
            )

            estimatedWait = TimeInterval(envelope.data.estimatedWaitSeconds)

            // Start listening for match found broadcast
            guard let playerId = await supabase.currentUserID else {
                throw MatchmakingError.notAuthenticated
            }
            try await subscribeToMatchFound(playerId: playerId)

            // Start search timer
            startSearchTimer()
        } catch {
            isSearching = false
            self.error = "Failed to join queue: \(error.localizedDescription)"
            throw error
        }
    }

    /// Leave the matchmaking queue via Edge Function
    func leaveQueue() async {
        // Call leave-queue Edge Function (player_id read from JWT server-side)
        do {
            try await supabase.callFunction("leave-queue")
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

    /// Subscribe to MATCH_FOUND broadcast on the player-specific matchmaking channel
    private func subscribeToMatchFound(playerId: UUID) async throws {
        let channel = supabase.client.realtimeV2.channel("matchmaking:\(playerId.uuidString)")

        let broadcastStream = channel.broadcastStream(event: "MATCH_FOUND")

        try await channel.subscribeWithError()

        self.queueChannel = channel

        // Listen for match found broadcast in background
        Task { @MainActor [weak self] in
            for await message in broadcastStream {
                guard let self, self.isSearching else { return }

                if let matchIdValue = message["match_id"]?.stringValue {
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

// MARK: - Matchmaking Errors

enum MatchmakingError: LocalizedError {
    case notAuthenticated

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "You must be signed in to join matchmaking."
        }
    }
}

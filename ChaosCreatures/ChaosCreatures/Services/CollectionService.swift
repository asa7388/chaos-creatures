// CollectionService.swift
// Chaos Creatures
// Card/deck CRUD via Supabase queries and Edge Functions.
// Source: docs/design/06-technical-architecture.md Section 2.3

import Foundation

final class CollectionService {
    static let shared = CollectionService()
    private init() {}

    private let supabase = SupabaseService.shared

    // MARK: - Card Collection

    /// Fetch all cards owned by the player
    func fetchCollection(playerId: UUID) async throws -> [CardInstance] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.cardInstances,
            filters: [("owner_id", playerId.uuidString)],
            orderBy: "created_at",
            ascending: false
        )
    }

    /// Fetch cards for a specific faction
    func fetchCollectionByFaction(playerId: UUID, factionId: String) async throws -> [CardInstance] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.cardInstances,
            filters: [
                ("owner_id", playerId.uuidString),
                ("faction_id", factionId)
            ],
            orderBy: "current_mana_cost"
        )
    }

    /// Fetch a single card instance by ID
    func fetchCard(id: UUID) async throws -> CardInstance {
        try await supabase.fetch(from: SupabaseService.Table.cardInstances, id: id)
    }

    /// Toggle favorite status on a card
    func toggleFavorite(cardId: UUID, isFavorite: Bool) async throws {
        struct FavoriteUpdate: Encodable {
            let isFavorite: Bool

            enum CodingKeys: String, CodingKey {
                case isFavorite = "is_favorite"
            }
        }

        try await supabase.update(
            table: SupabaseService.Table.cardInstances,
            values: FavoriteUpdate(isFavorite: isFavorite),
            filters: [("id", cardId.uuidString)]
        )
    }

    /// Get total card count per faction for collection limit checking
    func cardCountByFaction(playerId: UUID) async throws -> [String: Int] {
        struct CountResult: Decodable {
            let factionId: String
            let count: Int

            enum CodingKeys: String, CodingKey {
                case factionId = "faction_id"
                case count
            }
        }

        let result: [CountResult] = try await supabase.callFunction(
            "player/card-counts",
            body: ["player_id": playerId.uuidString]
        )

        return Dictionary(uniqueKeysWithValues: result.map { ($0.factionId, $0.count) })
    }

    // MARK: - Decks

    /// Fetch all decks for the player
    func fetchDecks(playerId: UUID) async throws -> [Deck] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.decks,
            filters: [("owner_id", playerId.uuidString)],
            orderBy: "updated_at",
            ascending: false
        )
    }

    /// Fetch a single deck by ID
    func fetchDeck(id: UUID) async throws -> Deck {
        try await supabase.fetch(from: SupabaseService.Table.decks, id: id)
    }

    /// Save a deck (create or update)
    func saveDeck(
        name: String,
        factionId: UUID,
        avatarId: UUID,
        cards: [DeckEntry],
        existingDeckId: UUID? = nil
    ) async throws -> Deck {
        struct DeckSave: Encodable {
            let deckId: UUID?
            let name: String
            let factionId: UUID
            let avatarId: UUID
            let cards: [DeckEntry]

            enum CodingKeys: String, CodingKey {
                case deckId = "deck_id"
                case name
                case factionId = "faction_id"
                case avatarId = "avatar_id"
                case cards
            }
        }

        return try await supabase.callFunction(
            "player/save-deck",
            body: DeckSave(
                deckId: existingDeckId,
                name: name,
                factionId: factionId,
                avatarId: avatarId,
                cards: cards
            )
        )
    }

    /// Delete a deck
    func deleteDeck(id: UUID) async throws {
        try await supabase.delete(
            from: SupabaseService.Table.decks,
            filters: [("id", id.uuidString)]
        )
    }

    /// Set a deck as the active deck for matchmaking
    func setActiveDeck(deckId: UUID, playerId: UUID) async throws {
        struct SetActive: Encodable {
            let deckId: UUID
            let playerId: UUID

            enum CodingKeys: String, CodingKey {
                case deckId = "deck_id"
                case playerId = "player_id"
            }
        }

        try await supabase.callFunction(
            "player/set-active-deck",
            body: SetActive(deckId: deckId, playerId: playerId)
        )
    }

    // MARK: - Card Packs

    /// Open a card pack and get new cards
    func openPack(factionId: String) async throws -> PackOpenResult {
        struct PackOpenRequest: Encodable {
            let factionId: String

            enum CodingKeys: String, CodingKey {
                case factionId = "faction_id"
            }
        }

        let envelope: PackOpenEnvelope = try await supabase.callFunction(
            "open-pack",
            body: PackOpenRequest(factionId: factionId)
        )
        return envelope.data
    }

    // MARK: - Card Templates (read-only game content)

    /// Fetch all card templates
    func fetchCardTemplates() async throws -> [CardTemplate] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.cardTemplates,
            orderBy: "mana_cost"
        )
    }

    /// Fetch card templates for a specific faction
    func fetchCardTemplates(factionId: String) async throws -> [CardTemplate] {
        try await supabase.fetchAll(
            from: SupabaseService.Table.cardTemplates,
            filters: [("faction_id", factionId)],
            orderBy: "mana_cost"
        )
    }
}

// MARK: - Pack Open Result

/// Wrapper for Edge Function envelope: { data: { cards, dust_spent } }
struct PackOpenEnvelope: Decodable {
    let data: PackOpenResult
}

struct PackOpenResult: Decodable {
    let cards: [CardInstance]
    let dustSpent: Int

    enum CodingKeys: String, CodingKey {
        case cards
        case dustSpent = "dust_spent"
    }
}

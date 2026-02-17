// Deck.swift
// Chaos Creatures
// Codable struct matching the decks DB table (00002_core_tables.sql).
// Source of truth: docs/design/02-card-data-model.md Section 11.

import Foundation

struct Deck: Codable, Identifiable, Equatable {
    let id: UUID
    let ownerId: UUID
    var name: String
    let factionId: UUID
    var avatarId: UUID

    // Contents (JSONB array of DeckEntry)
    var cardEntries: [DeckEntry]

    // Validation
    var isValid: Bool
    var validationErrors: [String]

    // Stats
    var gamesPlayed: Int
    var wins: Int
    var losses: Int

    let createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case ownerId = "owner_id"
        case name
        case factionId = "faction_id"
        case avatarId = "avatar_id"
        case cardEntries = "card_entries"
        case isValid = "is_valid"
        case validationErrors = "validation_errors"
        case gamesPlayed = "games_played"
        case wins, losses
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // MARK: - Computed Properties

    /// Total number of cards (sum of all quantities)
    var totalCards: Int {
        cardEntries.reduce(0) { $0 + $1.quantity }
    }

    /// Win rate for this deck
    var winRate: Double {
        guard gamesPlayed > 0 else { return 0 }
        return Double(wins) / Double(gamesPlayed)
    }

    // MARK: - Validation

    /// Validates the deck against all construction rules.
    /// Returns an array of validation errors (empty if valid).
    func validate(cards: [CardInstance], templates: [UUID: CardTemplate]) -> [String] {
        var errors: [String] = []

        // Rule: exactly 20 cards
        if totalCards != 20 {
            errors.append("Deck must contain exactly 20 cards (currently \(totalCards))")
        }

        // Rule: no template appears more than 2 times
        var templateCounts: [UUID: Int] = [:]
        var legendaryCount = 0
        for entry in cardEntries {
            if let card = cards.first(where: { $0.id == entry.cardInstanceId }) {
                templateCounts[card.templateId, default: 0] += entry.quantity

                if card.tier == .legendary {
                    legendaryCount += entry.quantity
                    // Legendary: max 1 copy each
                    if entry.quantity > 1 {
                        errors.append("Legendary card '\(card.currentName)' can only have 1 copy")
                    }
                }
            }
        }

        for (templateId, count) in templateCounts {
            if count > 2 {
                errors.append("Template \(templateId) appears \(count) times (max 2)")
            }
        }

        // Rule: max 2 Legendary cards total
        if legendaryCount > 2 {
            errors.append("Maximum 2 Legendary cards per deck (currently \(legendaryCount))")
        }

        return errors
    }

    static func == (lhs: Deck, rhs: Deck) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Deck Entry

struct DeckEntry: Codable, Equatable {
    let cardInstanceId: UUID
    var quantity: Int  // 1 or 2

    enum CodingKeys: String, CodingKey {
        case cardInstanceId = "card_instance_id"
        case quantity
    }
}

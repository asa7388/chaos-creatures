// DeckBuilderView.swift
// Chaos Creatures
// Deck editor with card pool and deck list (20 cards).
// Source: docs/design/07-ui-ux-specs.md Section 5.3

import SwiftUI

struct DeckBuilderView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss

    @State private var deckName = "New Deck"
    @State private var deckCards: [DeckEntry] = []
    @State private var availableCards: [CardInstance] = []
    @State private var isLoading = false
    @State private var isSaving = false
    @State private var error: String?
    @State private var searchQuery = ""

    private let maxCards = 20

    var body: some View {
        VStack(spacing: 0) {
            // Deck header
            deckHeader

            // Split view: deck list + card pool
            GeometryReader { geometry in
                HStack(spacing: 0) {
                    // Card pool (left/top)
                    cardPoolSection
                        .frame(width: geometry.size.width * 0.55)

                    Divider()
                        .background(Color.borderDefault)

                    // Deck list (right/bottom)
                    deckListSection
                        .frame(width: geometry.size.width * 0.45)
                }
            }
        }
        .background(Color.bgPrimary)
        .navigationTitle("Deck Builder")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    Task { await saveDeck() }
                }) {
                    Text("Save")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.orderBlue)
                }
                .disabled(isSaving)
            }
        }
        .loading(isLoading: isLoading || isSaving)
        .task {
            await loadAvailableCards()
        }
    }

    // MARK: - Deck Header

    private var deckHeader: some View {
        HStack {
            TextField("Deck Name", text: $deckName)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.textPrimary)
                .textFieldStyle(.plain)

            Spacer()

            Text("\(totalCards)/\(maxCards)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(totalCards == maxCards ? .healGreen : .warningYellow)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.bgSecondary)
    }

    // MARK: - Card Pool

    private var cardPoolSection: some View {
        VStack(spacing: 0) {
            // Search
            TextField("Search...", text: $searchQuery)
                .textFieldStyle(.roundedBorder)
                .padding(8)

            // Card grid
            ScrollView {
                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 80, maximum: 100))],
                    spacing: 6
                ) {
                    ForEach(filteredAvailable) { card in
                        CardGridItemView(card: card, showEvolutionBadge: false)
                            .frame(height: 112)
                            .opacity(canAddCard(card) ? 1.0 : 0.4)
                            .onTapGesture {
                                addCard(card)
                            }
                    }
                }
                .padding(.horizontal, 6)
                .padding(.bottom, 80)
            }
        }
    }

    // MARK: - Deck List

    private var deckListSection: some View {
        VStack(spacing: 0) {
            Text("Deck (\(totalCards)/\(maxCards))")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.textSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(8)
                .background(Color.bgSecondary)

            if deckCards.isEmpty {
                VStack(spacing: 8) {
                    Spacer()
                    Image(systemName: "rectangle.stack")
                        .font(.system(size: 28))
                        .foregroundColor(.textDisabled)
                    Text("Tap cards to add")
                        .font(.system(size: 13))
                        .foregroundColor(.textTertiary)
                    Spacer()
                }
            } else {
                List {
                    ForEach(deckCards, id: \.cardInstanceId) { entry in
                        if let card = findCard(entry.cardInstanceId) {
                            CardListRowView(card: card, quantity: entry.quantity)
                                .listRowBackground(Color.bgPrimary)
                                .swipeActions(edge: .trailing) {
                                    Button(role: .destructive) {
                                        removeCard(entry.cardInstanceId)
                                    } label: {
                                        Label("Remove", systemImage: "minus.circle")
                                    }
                                }
                        }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
    }

    // MARK: - Helpers

    private var totalCards: Int {
        deckCards.reduce(0) { $0 + $1.quantity }
    }

    private var filteredAvailable: [CardInstance] {
        if searchQuery.isEmpty { return availableCards }
        let query = searchQuery.lowercased()
        return availableCards.filter { $0.name.lowercased().contains(query) }
    }

    private func canAddCard(_ card: CardInstance) -> Bool {
        guard totalCards < maxCards else { return false }
        let existing = deckCards.first(where: { $0.cardInstanceId == card.id })
        return (existing?.quantity ?? 0) < 2
    }

    private func addCard(_ card: CardInstance) {
        guard canAddCard(card) else {
            appState.showToast("Can't add more copies", type: .warning)
            return
        }

        if let index = deckCards.firstIndex(where: { $0.cardInstanceId == card.id }) {
            deckCards[index] = DeckEntry(
                cardInstanceId: card.id,
                quantity: deckCards[index].quantity + 1
            )
        } else {
            deckCards.append(DeckEntry(cardInstanceId: card.id, quantity: 1))
        }
    }

    private func removeCard(_ cardId: UUID) {
        if let index = deckCards.firstIndex(where: { $0.cardInstanceId == cardId }) {
            if deckCards[index].quantity > 1 {
                deckCards[index] = DeckEntry(
                    cardInstanceId: cardId,
                    quantity: deckCards[index].quantity - 1
                )
            } else {
                deckCards.remove(at: index)
            }
        }
    }

    private func findCard(_ id: UUID) -> CardInstance? {
        availableCards.first(where: { $0.id == id })
    }

    // MARK: - Data

    private func loadAvailableCards() async {
        guard let playerId = appState.player?.id else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            availableCards = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.cardInstances,
                filters: [("player_id", playerId.uuidString)],
                orderBy: "mana_cost"
            )
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func saveDeck() async {
        isSaving = true
        defer { isSaving = false }

        do {
            struct DeckSave: Encodable {
                let name: String
                let cards: [DeckEntry]
                let factionId: String

                enum CodingKeys: String, CodingKey {
                    case name, cards
                    case factionId = "faction_id"
                }
            }

            let factionId = appState.player?.primaryFactionId ?? FactionShortName.ironwright.rawValue
            try await SupabaseService.shared.callFunction(
                "player/save-deck",
                body: DeckSave(name: deckName, cards: deckCards, factionId: factionId)
            )
            appState.showToast("Deck saved!", type: .success)
            dismiss()
        } catch {
            appState.showToast("Failed to save deck", type: .error)
        }
    }
}

#Preview {
    NavigationStack {
        DeckBuilderView()
    }
    .environment(AppState())
    .environment(AppRouter())
}

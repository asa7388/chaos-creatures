// DeckBuilderView.swift
// Chaos Creatures
// Deck editor with card pool and deck list (20 cards).
// Source: docs/design/07-ui-ux-specs.md Section 5.3

import SwiftUI

struct DeckBuilderView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss
    @Environment(\.horizontalSizeClass) private var sizeClass

    @State private var deckName = "New Deck"
    @State private var deckCards: [DeckEntry] = []
    @State private var availableCards: [CardInstance] = []
    @State private var existingDeckId: UUID?
    @State private var isLoading = false
    @State private var isSaving = false
    @State private var error: String?
    @State private var searchQuery = ""
    @State private var showDeckPanel = false  // For phone toggle layout (S-25)

    private let maxCards = 20

    var body: some View {
        VStack(spacing: 0) {
            // Deck header
            deckHeader

            // S-25: Adaptive layout based on horizontal size class
            if sizeClass == .regular {
                // iPad / landscape: side-by-side split
                splitLayout
            } else {
                // iPhone portrait: tab-toggle between pool and deck
                phoneLayout
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
                        .font(CardFont.bodyBold(size: 15))
                        .foregroundColor(.orderBlue)
                }
                .disabled(isSaving)
            }
        }
        .loading(isLoading: isLoading || isSaving)
        .task {
            await loadData()
        }
    }

    // MARK: - Deck Header

    private var deckHeader: some View {
        VStack(spacing: 0) {
            HStack {
                TextField("Deck Name", text: $deckName)
                    .font(CardFont.cardName(size: 16))
                    .foregroundColor(.textPrimary)
                    .textFieldStyle(.plain)

                Spacer()

                Text("\(totalCards)/\(maxCards)")
                    .font(CardFont.stats(size: 14))
                    .foregroundColor(totalCards == maxCards ? .healGreen : .warningYellow)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.bgSecondary)

            // S-25: Phone toggle between Available Cards and Deck
            if sizeClass != .regular {
                HStack(spacing: 0) {
                    Button(action: { withAnimation { showDeckPanel = false } }) {
                        Text("Available Cards")
                            .font(CardFont.bodyBold(size: 13))
                            .foregroundColor(showDeckPanel ? .textTertiary : .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(showDeckPanel ? Color.clear : Color.orderBlue.opacity(0.3))
                    }

                    Button(action: { withAnimation { showDeckPanel = true } }) {
                        HStack(spacing: 4) {
                            Text("Deck")
                                .font(CardFont.bodyBold(size: 13))
                            Text("(\(totalCards))")
                                .font(CardFont.stats(size: 12))
                        }
                        .foregroundColor(showDeckPanel ? .white : .textTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(showDeckPanel ? Color.orderBlue.opacity(0.3) : Color.clear)
                    }
                }
                .background(Color.bgSecondary)
            }
        }
    }

    // MARK: - Split Layout (iPad / landscape)

    private var splitLayout: some View {
        GeometryReader { geometry in
            HStack(spacing: 0) {
                cardPoolSection
                    .frame(width: geometry.size.width * 0.55)

                Divider()
                    .background(Color.borderDefault)

                deckListSection
                    .frame(width: geometry.size.width * 0.45)
            }
        }
    }

    // MARK: - Phone Layout (S-25)

    private var phoneLayout: some View {
        Group {
            if showDeckPanel {
                deckListSection
                    .transition(.move(edge: .trailing))
            } else {
                cardPoolSection
                    .transition(.move(edge: .leading))
            }
        }
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
                .font(CardFont.bodyBold(size: 13))
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
                        .font(CardFont.body(size: 13))
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
        return availableCards.filter { $0.currentName.lowercased().contains(query) }
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

    /// S-24: Load available cards and, if editing, pre-populate from existing deck
    private func loadData() async {
        guard let playerId = appState.player?.id else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            // Load available cards
            availableCards = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.cardInstances,
                filters: [("owner_id", playerId.uuidString)],
                orderBy: "current_mana_cost"
            )

            // S-24: If we navigated with an existing deck ID, load its data
            if let selectedDeck = router.selectedDeck {
                existingDeckId = selectedDeck.id
                deckName = selectedDeck.name
                deckCards = selectedDeck.cardEntries
            } else {
                // Check if the navigation destination included a deck ID
                // DeckListView navigates with DecksDestination.deckBuilder(deck.id)
                // The deck might be set via router.selectedDeck
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func saveDeck() async {
        isSaving = true
        defer { isSaving = false }

        do {
            struct DeckSave: Encodable {
                let id: UUID?
                let name: String
                let cards: [DeckEntry]
                let factionId: String

                enum CodingKeys: String, CodingKey {
                    case id, name, cards
                    case factionId = "faction_id"
                }
            }

            let factionId = appState.player?.primaryFactionId?.uuidString ?? ""
            try await SupabaseService.shared.callFunction(
                "player/save-deck",
                body: DeckSave(
                    id: existingDeckId,
                    name: deckName,
                    cards: deckCards,
                    factionId: factionId
                )
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

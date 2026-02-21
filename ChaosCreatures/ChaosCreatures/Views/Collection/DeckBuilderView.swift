// DeckBuilderView.swift
// Chaos Creatures
// Deck editor with card pool and deck list (30 cards).
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
    @State private var cardTypeFilter: CardType? = nil  // nil = all types

    private let maxCards = 30
    private let maxRuins = 2

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
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-aged-wood")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.35)
            }
        )
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
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .background(
                        ZStack {
                            Color(hex: "#2A2318")
                            Image("CardTextures/tex-parchment")
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .opacity(0.24)
                        }
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.tauntGold.opacity(0.2), lineWidth: 0.6)
                    )

                Spacer()

                HStack(spacing: 8) {
                    if ruinCount > 0 {
                        Text("\(ruinCount)/\(maxRuins) Ruins")
                            .font(CardFont.body(size: 12))
                            .foregroundColor(ruinCount > maxRuins ? .chaosRed : .textTertiary)
                    }
                    Text("\(totalCards)/\(maxCards)")
                        .font(CardFont.stats(size: 14))
                        .foregroundColor(totalCards == maxCards ? .healGreen : .warningYellow)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(
                ZStack {
                    Color.bgSecondary
                    Image("UIComponents/ui-panel-leather")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .opacity(0.32)
                }
            )

            // S-25: Phone toggle between Available Cards and Deck
            if sizeClass != .regular {
                HStack(spacing: 0) {
                    Button(action: { withAnimation { showDeckPanel = false } }) {
                        Text("Available Cards")
                            .font(CardFont.bodyBold(size: 13))
                            .foregroundColor(showDeckPanel ? .textTertiary : .textPrimary)
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
                        .foregroundColor(showDeckPanel ? .textPrimary : .textTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(showDeckPanel ? Color.orderBlue.opacity(0.3) : Color.clear)
                    }
                }
                .background(
                    ZStack {
                        Color.bgSecondary
                        Image("UIComponents/ui-panel-leather")
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .opacity(0.26)
                    }
                )
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
            // Card type filter tabs
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    cardTypeFilterTab(nil, label: "All")
                    cardTypeFilterTab(.creature, label: "Creatures")
                    cardTypeFilterTab(.spell, label: "Spells")
                    cardTypeFilterTab(.stabilizer, label: "Stabilizers")
                    cardTypeFilterTab(.planarRuin, label: "Ruins")
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
            }
            .background(Color.bgSecondary)
            .overlay(
                Image("UIComponents/ui-panel-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .opacity(0.28)
            )

            // Search
            HStack(spacing: 6) {
                ThemedGlyph(symbol: "magnifyingglass", size: 12, color: .textTertiary)
                TextField("Search cards...", text: $searchQuery)
                    .font(CardFont.body(size: 13))
                    .foregroundColor(.textPrimary)
                    .textFieldStyle(.plain)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(
                ZStack {
                    Color(hex: "#2A2318")
                    Image("CardTextures/tex-parchment")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .opacity(0.22)
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.tauntGold.opacity(0.2), lineWidth: 0.6)
            )
            .padding(8)

            // Card grid
            ScrollView {
                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 80, maximum: 100))],
                    spacing: 6
                ) {
                    ForEach(filteredAvailable) { card in
                        CardGridItemView(card: card, faction: deckFaction, showEvolutionBadge: false)
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
                .background(
                    ZStack {
                        Color.bgSecondary
                        Image("UIComponents/ui-panel-leather")
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .opacity(0.3)
                    }
                )

            if deckCards.isEmpty {
                VStack(spacing: 8) {
                    Spacer()
                    ThemedGlyph(symbol: "rectangle.stack", size: 28, color: .textDisabled)
                    Text("Tap cards to add")
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textTertiary)
                    Spacer()
                }
            } else {
                List {
                    ForEach(deckCards, id: \.cardInstanceId) { entry in
                        if let card = findCard(entry.cardInstanceId) {
                            CardListRowView(card: card, quantity: entry.quantity, faction: deckFaction)
                                .listRowBackground(Color.bgPrimary)
                                .swipeActions(edge: .trailing) {
                                    Button(role: .destructive) {
                                        removeCard(entry.cardInstanceId)
                                    } label: {
                                        Text("Remove")
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

    /// Count of Planar Ruins currently in the deck
    private var ruinCount: Int {
        deckCards.reduce(0) { total, entry in
            guard let card = findCard(entry.cardInstanceId),
                  card.cardType == .planarRuin else { return total }
            return total + entry.quantity
        }
    }

    private var filteredAvailable: [CardInstance] {
        var cards = availableCards

        // Apply card type filter
        if let typeFilter = cardTypeFilter {
            cards = cards.filter { $0.cardType == typeFilter }
        }

        // Apply search query
        if !searchQuery.isEmpty {
            let query = searchQuery.lowercased()
            cards = cards.filter { $0.currentName.lowercased().contains(query) }
        }

        return cards
    }

    private func canAddCard(_ card: CardInstance) -> Bool {
        guard totalCards < maxCards else { return false }
        let existing = deckCards.first(where: { $0.cardInstanceId == card.id })
        let currentCopies = existing?.quantity ?? 0

        // Planar Ruins: max 2 total ruins in deck, max 1 copy of each
        if card.cardType == .planarRuin {
            return currentCopies < 1 && ruinCount < maxRuins
        }

        return currentCopies < 2
    }

    // MARK: - Card Type Filter Tab

    private func cardTypeFilterTab(_ type: CardType?, label: String) -> some View {
        let isSelected = (cardTypeFilter == type)
        return Button(action: {
            withAnimation(.easeInOut(duration: 0.15)) { cardTypeFilter = type }
        }) {
            Text(label)
                .font(CardFont.bodyBold(size: 12))
                .foregroundColor(isSelected ? .textPrimary : .textTertiary)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(isSelected ? Color.orderBlue.opacity(0.4) : Color.bgTertiary)
                .cornerRadius(6)
        }
    }

    private func addCard(_ card: CardInstance) {
        guard canAddCard(card) else {
            if card.cardType == .planarRuin && ruinCount >= maxRuins {
                appState.showToast("Max \(maxRuins) ruins per deck", type: .warning)
            } else {
                appState.showToast("Can't add more copies", type: .warning)
            }
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

    private var deckFaction: CardFaction? {
        if let deck = router.selectedDeck,
           let faction = appState.factions.first(where: { $0.id == deck.factionId })?.shortName {
            return faction
        }
        if let primaryFactionId = appState.player?.primaryFactionId {
            return appState.factions.first(where: { $0.id == primaryFactionId })?.shortName
        }
        return nil
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

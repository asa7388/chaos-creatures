// CollectionView.swift
// Chaos Creatures
// Card collection grid with faction tabs and filters.
// Source: docs/design/07-ui-ux-specs.md Section 5.1

import SwiftUI

// MARK: - Collection Sort Options

enum CollectionSortOption: String, CaseIterable {
    case newest = "Newest"
    case oldest = "Oldest"
    case name = "Name"
    case manaCost = "CM Cost"
    case rarity = "Rarity"

    var iconName: String {
        switch self {
        case .newest: return "clock.arrow.circlepath"
        case .oldest: return "clock"
        case .name: return "textformat"
        case .manaCost: return "diamond.fill"
        case .rarity: return "star.fill"
        }
    }
}

// MARK: - Faction Filter

enum FactionFilter: String, Hashable, CaseIterable {
    case all = "ALL"
    case ironwright = "IRONWRIGHT"
    case feyCourts = "FEY_COURTS"
    case demonic = "DEMONIC_KINGDOMS"
    case celestial = "CELESTIAL_CRUSADE"
    case endless = "THE_ENDLESS"

    var displayName: String {
        switch self {
        case .all: return "All"
        case .ironwright: return "Ironwright"
        case .feyCourts: return "Fey Courts"
        case .demonic: return "Demonic"
        case .celestial: return "Celestial"
        case .endless: return "Endless"
        }
    }

    var color: Color {
        switch self {
        case .all: return .textPrimary
        case .ironwright: return .ironwright
        case .feyCourts: return .feyCourts
        case .demonic: return .demonic
        case .celestial: return Color(hex: "#DAA520")
        case .endless: return Color(hex: "#6B3FA0")
        }
    }
}

struct CollectionView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    @State private var cards: [CardInstance] = []
    @State private var templateFactionMap: [UUID: UUID] = [:]  // templateId -> factionId
    @State private var selectedFaction: FactionFilter = .all
    @State private var searchQuery = ""
    @State private var sortOption: CollectionSortOption = .newest
    @State private var showSortMenu = false
    @State private var isLoading = false
    @State private var error: String?
    @State private var showSearch = false
    @State private var selectedCard: CardInstance?
    @State private var fullscreenCard: CardInstance?

    var body: some View {
        VStack(spacing: 0) {
            // Faction tab bar
            factionTabBar

            // Filter/search bar
            filterBar

            // Card grid or empty state
            if isLoading {
                LoadingView("Loading collection...")
            } else if let error {
                ErrorView(message: error) {
                    Task { await loadCards() }
                }
            } else if filteredCards.isEmpty {
                EmptyStateView(
                    icon: "rectangle.stack",
                    message: "No cards yet",
                    description: "Visit the Shop to get your first cards.",
                    actionTitle: "Visit Shop"
                ) {
                    appState.selectedTab = .shop
                }
            } else {
                cardGrid
            }
        }
        .background(
            ZStack {
                Color.bgPrimary
                // Felt table texture — cards laid out on a game table
                Image("UIBackgrounds/felt-table")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.5)
            }
        )
        .navigationTitle("Collection")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: CollectionDestination.settings) {
                    Image(systemName: "gearshape.fill")
                        .foregroundColor(.textSecondary)
                }
            }
        }
        .sheet(item: $selectedCard) { card in
            CardDetailView()
        }
        .fullScreenCover(item: $fullscreenCard) { card in
            FullscreenCardView(card: card)
        }
        .task {
            await loadCards()
        }
    }

    // MARK: - Faction Tab Bar

    private var factionTabBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(FactionFilter.allCases, id: \.self) { faction in
                    Button(action: {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedFaction = faction
                        }
                    }) {
                        VStack(spacing: 4) {
                            Text(faction.displayName)
                                .font(CardFont.body(size: 14))
                                .foregroundColor(selectedFaction == faction ? .white : .textTertiary)

                            Rectangle()
                                .fill(selectedFaction == faction ? faction.color : Color.clear)
                                .frame(height: 3)
                                .cornerRadius(1.5)
                        }
                        .frame(minWidth: 80)
                    }
                }
            }
        }
        .frame(height: 48)
        .background(Color.bgSecondary)
    }

    // MARK: - Filter Bar

    private var filterBar: some View {
        HStack(spacing: 8) {
            // Sort menu (S-45)
            Menu {
                ForEach(CollectionSortOption.allCases, id: \.self) { option in
                    Button(action: {
                        sortOption = option
                    }) {
                        Label(option.rawValue, systemImage: option.iconName)
                    }
                }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "arrow.up.arrow.down")
                        .font(.system(size: 12))
                    Text(sortOption.rawValue)
                        .font(CardFont.body(size: 12))
                }
                .foregroundColor(.textSecondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.bgTertiary)
                .cornerRadius(6)
            }

            Spacer()

            if showSearch {
                TextField("Search cards...", text: $searchQuery)
                    .textFieldStyle(.roundedBorder)
                    .frame(maxWidth: 200)
                    .transition(.move(edge: .trailing).combined(with: .opacity))
                    .submitLabel(.search)
            }

            Button(action: {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showSearch.toggle()
                    if !showSearch { searchQuery = "" }
                }
            }) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.textSecondary)
            }
        }
        .padding(.horizontal, 12)
        .frame(height: 44)
        .background(Color.bgPrimary)
    }

    // MARK: - Card Grid

    private var cardGrid: some View {
        ScrollView {
            LazyVGrid(
                columns: [GridItem(.adaptive(minimum: 112, maximum: 130))],
                spacing: 8
            ) {
                ForEach(filteredCards) { card in
                    CardGridItemView(card: card)
                        .frame(height: 157)
                        .onTapGesture {
                            router.selectedCardInstance = card
                            selectedCard = card
                        }
                        .onLongPressGesture(minimumDuration: 0.4) {
                            fullscreenCard = card
                        }
                }
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 80)
        }
    }

    // MARK: - Filtering

    private var filteredCards: [CardInstance] {
        var result = cards

        // Faction filter (S-23): match template's factionId to faction IDs from appState
        if selectedFaction != .all {
            let matchingFactionIds = factionIdsForFilter(selectedFaction)
            result = result.filter { card in
                guard let factionId = templateFactionMap[card.templateId] else { return false }
                return matchingFactionIds.contains(factionId)
            }
        }

        // Search filter (S-43)
        if !searchQuery.isEmpty {
            let query = searchQuery.lowercased()
            result = result.filter {
                $0.currentName.lowercased().contains(query)
                || $0.effectiveKeywords.contains(where: { $0.displayName.lowercased().contains(query) })
            }
        }

        // Sort (S-45)
        switch sortOption {
        case .newest:
            result.sort { $0.createdAt > $1.createdAt }
        case .oldest:
            result.sort { $0.createdAt < $1.createdAt }
        case .name:
            result.sort { $0.currentName.localizedCaseInsensitiveCompare($1.currentName) == .orderedAscending }
        case .manaCost:
            result.sort { $0.currentManaCost < $1.currentManaCost }
        case .rarity:
            result.sort { $0.tier.tierIndex > $1.tier.tierIndex }
        }

        return result
    }

    /// Map FactionFilter to the set of matching faction UUIDs from appState.factions
    private func factionIdsForFilter(_ filter: FactionFilter) -> Set<UUID> {
        let targetShortName: FactionShortName
        switch filter {
        case .all: return Set(appState.factions.map(\.id))
        case .ironwright: targetShortName = .ironwright
        case .feyCourts: targetShortName = .feyCourts
        case .demonic: targetShortName = .demonicKingdoms
        case .celestial: targetShortName = .celestialCrusade
        case .endless: targetShortName = .theEndless
        }
        return Set(appState.factions.filter { $0.shortName == targetShortName }.map(\.id))
    }

    // MARK: - Data Loading

    private func loadCards() async {
        #if DEBUG
        if appState.isDevMode {
            cards = appState.devCards
            templateFactionMap = appState.devTemplateFactionMap
            return
        }
        #endif

        guard let playerId = appState.player?.id else { return }
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            // Load cards and templates in parallel
            async let cardsTask: [CardInstance] = SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.cardInstances,
                filters: [("owner_id", playerId.uuidString)],
                orderBy: "created_at",
                ascending: false
            )
            async let templatesTask: [CardTemplate] = CollectionService.shared.fetchCardTemplates()

            let (loadedCards, loadedTemplates) = try await (cardsTask, templatesTask)
            cards = loadedCards

            // Build templateId -> factionId map for faction filtering
            templateFactionMap = Dictionary(
                uniqueKeysWithValues: loadedTemplates.map { ($0.id, $0.factionId) }
            )
        } catch {
            self.error = "Failed to load collection: \(error.localizedDescription)"
        }
    }
}

#Preview {
    NavigationStack {
        CollectionView()
    }
    .environment(AppState())
    .environment(AppRouter())
}

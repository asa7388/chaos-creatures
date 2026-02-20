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
        case .newest: return "arrow.clockwise"
        case .oldest: return "UIIcons/ui-hourglass"
        case .name: return "UIIcons/ui-battle-log"
        case .manaCost: return "StatIcons/chaos-motes"
        case .rarity: return "UIIcons/ui-sort-rarity"
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
                // Collector table key art (subtle so cards remain primary)
                Image("UIBackgrounds/bg-collection")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.26)

                // Dark leather texture — card collection
                Image("UIBackgrounds/bg-dark-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.40)

                // Center-weighted vignette for clearer hierarchy
                LinearGradient(
                    colors: [Color.black.opacity(0.32), .clear, Color.black.opacity(0.36)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
            }
        )
        .themedNavigationTitle("Collection")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: CollectionDestination.settings) {
                    ThemedGlyph(symbol: "gearshape.fill", size: 14, color: .textSecondary)
                }
            }
        }
        .fullScreenCover(item: $selectedCard) { card in
            CardDetailView(card: card, faction: factionForCard(card))
        }
        .fullScreenCover(item: $fullscreenCard) { card in
            FullscreenCardView(card: card, faction: factionForCard(card))
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
                                .foregroundColor(selectedFaction == faction ? .textPrimary : .textTertiary)

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
        .background(
            ZStack {
                Color.bgSecondary
                Image("UIComponents/ui-panel-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .opacity(0.32)
            }
        )
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color.tauntGold.opacity(0.16))
                .frame(height: 0.6)
        }
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
                        HStack(spacing: 8) {
                            ThemedGlyph(symbol: option.iconName, size: 12, color: .textPrimary)
                            Text(option.rawValue)
                        }
                    }
                }
            } label: {
                HStack(spacing: 4) {
                    ThemedGlyph(symbol: "arrow.up.arrow.down", size: 12, color: .textSecondary)
                    Text(sortOption.rawValue)
                        .font(CardFont.body(size: 12))
                }
                .foregroundColor(.textSecondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    ZStack {
                        Color(hex: "#2A2318")
                        Image("CardTextures/tex-parchment")
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .opacity(0.2)
                    }
                )
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color.tauntGold.opacity(0.2), lineWidth: 0.5)
                )
            }

            Spacer()

            if showSearch {
                HStack(spacing: 6) {
                    ThemedGlyph(symbol: "magnifyingglass", size: 12, color: .textTertiary)
                    TextField("Search cards...", text: $searchQuery)
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textPrimary)
                        .textFieldStyle(.plain)
                        .submitLabel(.search)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
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
                .frame(maxWidth: 220)
                .transition(.move(edge: .trailing).combined(with: .opacity))
            }

            Button(action: {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showSearch.toggle()
                    if !showSearch { searchQuery = "" }
                }
            }) {
                ThemedGlyph(symbol: "magnifyingglass", size: 14, color: .textSecondary)
            }
        }
        .padding(.horizontal, 12)
        .frame(height: 44)
        .background(
            ZStack {
                Color.bgPrimary
                Image("CardTextures/tex-parchment")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .opacity(0.12)
            }
        )
    }

    // MARK: - Card Grid

    private var cardGrid: some View {
        ScrollView {
            ZStack(alignment: .leading) {
                // Binder page surface
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.black.opacity(0.26))
                    .overlay(
                        Image("CardTextures/tex-parchment")
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .opacity(0.10)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.tauntGold.opacity(0.16), lineWidth: 0.8)
                    )

                // Binder ring spine treatment
                VStack(spacing: 24) {
                    ForEach(0..<12, id: \.self) { _ in
                        Circle()
                            .stroke(Color.tauntGold.opacity(0.28), lineWidth: 1.2)
                            .frame(width: 12, height: 12)
                            .background(Circle().fill(Color.black.opacity(0.35)))
                            .overlay(
                                Circle()
                                    .stroke(Color.white.opacity(0.10), lineWidth: 0.6)
                            )
                    }
                }
                .frame(width: 20)
                .padding(.leading, 4)

                LazyVGrid(
                    columns: [GridItem(.adaptive(minimum: 112, maximum: 130))],
                    spacing: 10
                ) {
                    ForEach(filteredCards) { card in
                        let faction = factionForCard(card)
                        ZStack {
                            // Recessed card pocket (binder sleeve look)
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.black.opacity(0.30))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.tauntGold.opacity(0.14), lineWidth: 0.5)
                                )

                            CardGridItemView(card: card, faction: faction)
                                .frame(height: 157)
                                .padding(3)
                        }
                        .frame(height: 164)
                        .onTapGesture {
                            router.selectedCardInstance = card
                            router.selectedCardFaction = faction
                            selectedCard = card
                        }
                        .onLongPressGesture(minimumDuration: 0.4) {
                            router.selectedCardFaction = faction
                            fullscreenCard = card
                        }
                    }
                }
                .padding(.leading, 24)
                .padding(.trailing, 8)
                .padding(.vertical, 10)
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

    /// Resolve card faction from template-faction map and app state's faction definitions.
    private func factionForCard(_ card: CardInstance) -> FactionShortName? {
        guard let factionId = templateFactionMap[card.templateId] else { return nil }
        return appState.factions.first(where: { $0.id == factionId })?.shortName
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

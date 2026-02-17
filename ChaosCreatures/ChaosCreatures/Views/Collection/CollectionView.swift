// CollectionView.swift
// Chaos Creatures
// Card collection grid with faction tabs and filters.
// Source: docs/design/07-ui-ux-specs.md Section 5.1

import SwiftUI

// MARK: - Faction Filter

enum FactionFilter: String, Hashable, CaseIterable {
    case all = "ALL"
    case ironwright = "IRONWRIGHT"
    case feyCourts = "FEY_COURTS"
    case demonic = "DEMONIC_KINGDOMS"

    var displayName: String {
        switch self {
        case .all: return "All"
        case .ironwright: return "Ironwright"
        case .feyCourts: return "Fey Courts"
        case .demonic: return "Demonic"
        }
    }

    var color: Color {
        switch self {
        case .all: return .textPrimary
        case .ironwright: return .ironwright
        case .feyCourts: return .feyCourts
        case .demonic: return .demonic
        }
    }
}

struct CollectionView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    @State private var cards: [CardInstance] = []
    @State private var selectedFaction: FactionFilter = .all
    @State private var searchQuery = ""
    @State private var isLoading = false
    @State private var error: String?
    @State private var showSearch = false
    @State private var selectedCard: CardInstance?

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
        .background(Color.bgPrimary)
        .navigationTitle("Collection")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: CollectionDestination.settings) {
                    Image(systemName: "gearshape")
                        .foregroundColor(.textSecondary)
                }
            }
        }
        .sheet(item: $selectedCard) { card in
            CardDetailView()
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
                                .font(.system(size: 14, weight: .medium))
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
                columns: [GridItem(.adaptive(minimum: 100, maximum: 120))],
                spacing: 8
            ) {
                ForEach(filteredCards) { card in
                    CardGridItemView(card: card)
                        .frame(height: 140)
                        .onTapGesture {
                            selectedCard = card
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

        // Faction filter
        if selectedFaction != .all {
            // TODO: Filter by faction once CardInstance includes faction data
            _ = selectedFaction
        }

        // Search filter
        if !searchQuery.isEmpty {
            let query = searchQuery.lowercased()
            result = result.filter { $0.currentName.lowercased().contains(query) }
        }

        return result
    }

    // MARK: - Data Loading

    private func loadCards() async {
        guard let playerId = appState.player?.id else { return }
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            cards = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.cardInstances,
                filters: [("player_id", playerId.uuidString)],
                orderBy: "created_at",
                ascending: false
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

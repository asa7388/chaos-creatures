// ContentView.swift
// Chaos Creatures
// Root TabView with 5 tabs: Home, Collection, Decks, Profile, Shop.
// Source: docs/design/07-ui-ux-specs.md Section 2

import SwiftUI

struct ContentView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    var body: some View {
        @Bindable var router = router

        TabView(selection: Bindable(appState).selectedTab) {
            // Tab 1: Home
            NavigationStack(path: $router.homeNavigationPath) {
                HomeView()
                    .navigationDestination(for: HomeDestination.self) { destination in
                        switch destination {
                        case .modeSelection:
                            ModeSelectionView()
                        case .settings:
                            SettingsView()
                        }
                    }
            }
            .tabItem {
                Label(AppTab.home.rawValue, systemImage: AppTab.home.iconName)
            }
            .tag(AppTab.home)

            // Tab 2: Collection
            NavigationStack(path: $router.collectionNavigationPath) {
                CollectionView()
                    .navigationDestination(for: CollectionDestination.self) { destination in
                        switch destination {
                        case .cardDetail:
                            CardDetailView()
                        case .settings:
                            SettingsView()
                        }
                    }
            }
            .tabItem {
                Label(AppTab.collection.rawValue, systemImage: AppTab.collection.iconName)
            }
            .tag(AppTab.collection)

            // Tab 3: Decks
            NavigationStack(path: $router.decksNavigationPath) {
                DeckListView()
                    .navigationDestination(for: DecksDestination.self) { destination in
                        switch destination {
                        case .deckBuilder:
                            DeckBuilderView()
                        case .settings:
                            SettingsView()
                        }
                    }
            }
            .tabItem {
                Label(AppTab.decks.rawValue, systemImage: AppTab.decks.iconName)
            }
            .tag(AppTab.decks)

            // Tab 4: Profile
            NavigationStack(path: $router.profileNavigationPath) {
                ProfileView()
                    .navigationDestination(for: ProfileDestination.self) { destination in
                        switch destination {
                        case .achievements:
                            Text("Achievements") // Placeholder
                        case .settings:
                            SettingsView()
                        }
                    }
            }
            .tabItem {
                Label(AppTab.profile.rawValue, systemImage: AppTab.profile.iconName)
            }
            .tag(AppTab.profile)

            // Tab 5: Shop
            NavigationStack(path: $router.shopNavigationPath) {
                ShopView()
                    .navigationDestination(for: ShopDestination.self) { destination in
                        switch destination {
                        case .subscription:
                            SubscriptionView()
                        case .cardPackOpening:
                            CardPackOpeningView(packType: .starter)
                        case .settings:
                            SettingsView()
                        }
                    }
            }
            .tabItem {
                Label(AppTab.shop.rawValue, systemImage: AppTab.shop.iconName)
            }
            .tag(AppTab.shop)
        }
        .tint(.ironwright)
        .fullScreenCover(isPresented: $router.showBattle) {
            if let matchID = router.matchID {
                BattleContainerView(matchId: matchID)
                    .environment(router)
            }
        }
        .sheet(isPresented: $router.showMatchmaking) {
            MatchmakingView()
                .environment(appState)
                .environment(router)
        }
        .fullScreenCover(isPresented: $router.showPostMatch) {
            PostMatchView(matchId: router.matchID)
                .environment(appState)
                .environment(router)
        }
        .sheet(isPresented: $router.showEvolution) {
            if let card = router.selectedCardInstance {
                EvolutionFlowView(card: card)
                    .environment(appState)
            }
        }
    }
}

// MARK: - Mode Selection View

struct ModeSelectionView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    var body: some View {
        VStack(spacing: 16) {
            Text("Choose Mode")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.textPrimary)
                .padding(.top, 20)

            ForEach(GameMode.allCases, id: \.self) { mode in
                Button(action: {
                    router.startMatchmaking(mode: mode)
                }) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(mode.displayName)
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(.textPrimary)
                            Text(modeDescription(mode))
                                .font(.system(size: 13))
                                .foregroundColor(.textSecondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.textTertiary)
                    }
                    .padding(16)
                    .cardBackground()
                }
                .padding(.horizontal, 16)
            }

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPrimary)
        .navigationTitle("Play")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func modeDescription(_ mode: GameMode) -> String {
        switch mode {
        case .ranked: return "Compete for rank. Earn bonus rewards."
        case .casual: return "Play without rank changes."
        case .practice: return "Play against AI. No rewards."
        }
    }
}

#Preview {
    ContentView()
        .environment(AppState())
        .environment(AppRouter())
}

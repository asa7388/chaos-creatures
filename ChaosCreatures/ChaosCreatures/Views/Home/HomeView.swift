// HomeView.swift
// Chaos Creatures
// Main home tab with play button, daily missions, and player overview.
// Source: docs/design/07-ui-ux-specs.md Section 1

import SwiftUI

struct HomeView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    // S-40: Track whether the player has any valid decks
    @State private var hasValidDeck = true  // Optimistic default
    @State private var hasCheckedDecks = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Player greeting
                playerGreetingSection

                // S-40: First-time user deck creation prompt
                if hasCheckedDecks && !hasValidDeck {
                    firstDeckPrompt
                }

                // Play button
                playButtonSection

                // Daily missions
                DailyMissionsView()

                // Quick stats
                quickStatsSection
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 80) // Space for tab bar
        }
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-dark-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.35)
            }
        )
        .navigationTitle("Chaos Creatures")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: HomeDestination.settings) {
                    Image(systemName: "gearshape.fill")
                        .foregroundColor(.textSecondary)
                }
            }
        }
        .task {
            await checkForDecks()
        }
        .refreshable {
            await appState.refreshPlayer()
            await checkForDecks()
        }
    }

    // MARK: - S-40: Deck Check

    private func checkForDecks() async {
        guard let playerId = appState.player?.id else { return }
        do {
            let decks: [Deck] = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.decks,
                filters: [
                    ("player_id", playerId.uuidString),
                    ("is_valid", "true")
                ],
                limit: 1
            )
            hasValidDeck = !decks.isEmpty
        } catch {
            // On error, keep optimistic default so we don't block the user
            hasValidDeck = true
        }
        hasCheckedDecks = true
    }

    // MARK: - Player Greeting

    private var playerGreetingSection: some View {
        HStack(spacing: 12) {
            // Avatar
            Circle()
                .fill(Color.bgTertiary)
                .frame(width: 48, height: 48)
                .overlay(
                    Image("FactionIcons/ui-profile")
                        .renderingMode(.template)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 24, height: 24)
                        .foregroundColor(.textTertiary)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Welcome back, \(appState.player?.displayName ?? "Adventurer")")
                    .font(CardFont.bodyBold(size: 16))
                    .foregroundColor(.textPrimary)

                if let rank = appState.player?.seasonRank {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.rankColor(rank))
                            .frame(width: 8, height: 8)
                        Text(rank.displayName)
                            .font(CardFont.body(size: 13))
                            .foregroundColor(.textSecondary)
                    }
                }
            }

            Spacer()

            // Rank/XP badge
            if let player = appState.player {
                VStack(spacing: 2) {
                    Text("Level \(player.playerXp / 100)")
                        .font(CardFont.stats(size: 12))
                        .foregroundColor(.ironwright)
                    Text("\(player.playerXp % 100) XP")
                        .font(CardFont.body(size: 10))
                        .foregroundColor(.textTertiary)
                }
                .padding(8)
                .background(Color.bgTertiary)
                .cornerRadius(8)
            }
        }
        .padding(16)
        .leatherPanel()
        .padding(.top, 8)
    }

    // MARK: - S-40: First Deck Prompt

    private var firstDeckPrompt: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 20))  // SF Symbol icon size - keep as-is
                    .foregroundColor(.warningYellow)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Build Your First Deck")
                        .font(CardFont.cardName(size: 16))
                        .foregroundColor(.textPrimary)
                    Text("You need a valid 20-card deck before you can play. Create one now!")
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textSecondary)
                }
            }

            Button(action: {
                appState.selectedTab = .decks
                router.decksNavigationPath.append(DecksDestination.deckBuilder(nil))
            }) {
                HStack(spacing: 6) {
                    Image("UIIcons/ui-mission-cards")
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 14, height: 14)
                    Text("Create Deck")
                        .font(CardFont.bodyBold(size: 15))
                }
                .foregroundColor(.textPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.orderBlue)
                .cornerRadius(10)
            }
        }
        .padding(16)
        .background(Color.warningYellow.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.warningYellow.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Play Button

    private var playButtonSection: some View {
        NavigationLink(value: HomeDestination.modeSelection) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("PLAY")
                        .font(CardFont.displayTitle(size: 24))
                        .foregroundColor(.textPrimary)
                    Text("Ranked, Casual, or Practice")
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textSecondary)
                }
                Spacer()
                Image("FactionIcons/ui-battle")
                    .renderingMode(.template)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 32, height: 32)
                    .foregroundColor(.appAccent)
            }
            .padding(20)
            .metalPanel(texture: "CardTextures/metal-bronze", cornerRadius: 16)
        }
    }

    // MARK: - Quick Stats

    private var quickStatsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your Stats")
                .font(CardFont.cardName(size: 16))
                .foregroundColor(.textPrimary)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                StatTile(
                    title: "Wins",
                    value: "\(appState.player?.totalWins ?? 0)",
                    icon: "FactionIcons/ui-battle",
                    color: .tauntGold
                )
                StatTile(
                    title: "Cards",
                    value: "\(appState.player?.totalGames ?? 0)",
                    icon: "FactionIcons/ui-collection",
                    color: .orderBlue
                )
                StatTile(
                    title: "Dust",
                    value: "\(appState.player?.chaosDust ?? 0)",
                    icon: "StatIcons/chaos-mote-ironwright",
                    color: .ironwright,
                    isTemplate: false
                )
            }
        }
        .padding(16)
        .leatherPanel()
    }
}

// MARK: - Stat Tile Component

struct StatTile: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var isTemplate: Bool = true

    var body: some View {
        VStack(spacing: 6) {
            if isTemplate {
                Image(icon)
                    .renderingMode(.template)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 22, height: 22)
                    .foregroundColor(color)
            } else {
                Image(icon)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 22, height: 22)
            }

            Text(value)
                .font(CardFont.stats(size: 18))
                .foregroundColor(.textPrimary)

            Text(title)
                .font(CardFont.body(size: 11))
                .foregroundColor(.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.bgTertiary)
        .cornerRadius(10)
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
    .environment(AppState())
    .environment(AppRouter())
}

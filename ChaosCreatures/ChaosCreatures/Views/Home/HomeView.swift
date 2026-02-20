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
                    Image(systemName: "gearshape")
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
                    Image(systemName: "person.fill")
                        .foregroundColor(.textTertiary)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Welcome back, \(appState.player?.displayName ?? "Player")")
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
        .cardBackground()
        .padding(.top, 8)
    }

    // MARK: - S-40: First Deck Prompt

    private var firstDeckPrompt: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 20))
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
                    Image(systemName: "plus.rectangle.on.rectangle")
                        .font(.system(size: 14))
                    Text("Create Deck")
                        .font(CardFont.bodyBold(size: 15))
                }
                .foregroundColor(.white)
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
                Image(systemName: "play.fill")
                    .font(.system(size: 28))
                    .foregroundColor(.ironwright)
            }
            .padding(20)
            .background(
                LinearGradient(
                    colors: [Color.ironwright.opacity(0.2), Color.bgSecondary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.ironwright.opacity(0.5), lineWidth: 1)
            )
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
                    icon: "trophy.fill",
                    color: .tauntGold
                )
                StatTile(
                    title: "Cards",
                    value: "\(appState.player?.totalGames ?? 0)",
                    icon: "rectangle.stack.fill",
                    color: .orderBlue
                )
                StatTile(
                    title: "Dust",
                    value: "\(appState.player?.chaosDust ?? 0)",
                    icon: "sparkle",
                    color: .ironwright
                )
            }
        }
        .padding(16)
        .cardBackground()
    }
}

// MARK: - Stat Tile Component

struct StatTile: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)

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

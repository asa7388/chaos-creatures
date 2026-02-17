// HomeView.swift
// Chaos Creatures
// Main home tab with play button, daily missions, and player overview.
// Source: docs/design/07-ui-ux-specs.md Section 1

import SwiftUI

struct HomeView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Player greeting
                playerGreetingSection

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
        .background(Color.bgPrimary)
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
        .refreshable {
            await appState.refreshPlayer()
        }
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
                Text("Welcome back, \(appState.player?.username ?? "Player")")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.textPrimary)

                if let rank = appState.player?.seasonRank {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.rankColor(rank))
                            .frame(width: 8, height: 8)
                        Text(rank.displayName)
                            .font(.system(size: 13))
                            .foregroundColor(.textSecondary)
                    }
                }
            }

            Spacer()

            // Rank/XP badge
            if let player = appState.player {
                VStack(spacing: 2) {
                    Text("Level \(player.xp / 100)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.ironwright)
                    Text("\(player.xp % 100) XP")
                        .font(.system(size: 10))
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

    // MARK: - Play Button

    private var playButtonSection: some View {
        NavigationLink(value: HomeDestination.modeSelection) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("PLAY")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.textPrimary)
                    Text("Ranked, Casual, or Practice")
                        .font(.system(size: 13))
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
                .font(.system(size: 16, weight: .bold))
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
                    value: "\(appState.player?.totalMatches ?? 0)",
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
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.textPrimary)

            Text(title)
                .font(.system(size: 11))
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

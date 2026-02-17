// ProfileView.swift
// Chaos Creatures
// Player profile with stats, rank, faction mastery, and achievements.
// Source: docs/design/07-ui-ux-specs.md Section 1

import SwiftUI

struct ProfileView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Player card
                playerCardSection

                // Season rank
                rankSection

                // Battle stats
                battleStatsSection

                // Faction mastery
                factionMasterySection

                // Achievements link
                NavigationLink(value: ProfileDestination.achievements) {
                    HStack {
                        Image(systemName: "medal.fill")
                            .foregroundColor(.tauntGold)
                        Text("Achievements")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.textPrimary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.textTertiary)
                    }
                    .padding(16)
                    .cardBackground()
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 80)
        }
        .background(Color.bgPrimary)
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: ProfileDestination.settings) {
                    Image(systemName: "gearshape")
                        .foregroundColor(.textSecondary)
                }
            }
        }
        .refreshable {
            await appState.refreshPlayer()
        }
    }

    // MARK: - Player Card

    private var playerCardSection: some View {
        VStack(spacing: 16) {
            // Avatar
            Circle()
                .fill(Color.bgTertiary)
                .frame(width: 72, height: 72)
                .overlay(
                    Image(systemName: "person.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.textTertiary)
                )

            // Username
            Text(appState.player?.displayName ?? "Player")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.textPrimary)

            // Faction badge
            if let factionId = appState.player?.primaryFactionId,
               let faction = FactionShortName(rawValue: factionId.uuidString) {
                HStack(spacing: 6) {
                    Image(systemName: faction.systemIconName)
                        .font(.system(size: 13))
                    Text(faction.displayName)
                        .font(.system(size: 13, weight: .medium))
                }
                .foregroundColor(faction.swiftUIColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(faction.swiftUIColor.opacity(0.15))
                .cornerRadius(12)
            }

            // Subscription tier
            if let tier = appState.player?.subscriptionTier, tier != .free {
                Text(tier.displayName)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.tauntGold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.tauntGold.opacity(0.15))
                    .cornerRadius(8)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .cardBackground()
        .padding(.top, 8)
    }

    // MARK: - Season Rank

    private var rankSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Season Rank")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.textPrimary)

            if let rank = appState.player?.seasonRank {
                HStack(spacing: 16) {
                    // Rank icon
                    VStack(spacing: 4) {
                        Circle()
                            .fill(Color.rankColor(rank))
                            .frame(width: 48, height: 48)
                            .overlay(
                                Image(systemName: "trophy.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(.black.opacity(0.6))
                            )
                        Text(rank.displayName)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Color.rankColor(rank))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        // LP progress
                        HStack {
                            Text("LP")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.textTertiary)
                            Text("\(appState.player?.seasonRankPoints ?? 0)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.textPrimary)
                        }

                        // Win/Loss
                        HStack(spacing: 16) {
                            HStack(spacing: 4) {
                                Text("W")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.healGreen)
                                Text("\(appState.player?.totalWins ?? 0)")
                                    .font(.system(size: 13))
                                    .foregroundColor(.textSecondary)
                            }
                            HStack(spacing: 4) {
                                Text("L")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.chaosRed)
                                Text("\(appState.player?.totalLosses ?? 0)")
                                    .font(.system(size: 13))
                                    .foregroundColor(.textSecondary)
                            }
                            if let player = appState.player, player.totalGames > 0 {
                                Text("\(Int(Double(player.totalWins) / Double(player.totalGames) * 100))%")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(.textTertiary)
                            }
                        }
                    }

                    Spacer()
                }
            } else {
                Text("Play ranked matches to earn your rank!")
                    .font(.system(size: 14))
                    .foregroundColor(.textSecondary)
            }
        }
        .padding(16)
        .cardBackground()
    }

    // MARK: - Battle Stats

    private var battleStatsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Battle Statistics")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.textPrimary)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                profileStatRow("Total Matches", value: "\(appState.player?.totalGames ?? 0)")
                profileStatRow("Win Streak", value: "\(appState.player?.currentWinStreak ?? 0)")
                profileStatRow("Best Streak", value: "\(appState.player?.bestWinStreak ?? 0)")
                profileStatRow("XP", value: "\(appState.player?.playerXp ?? 0)")
            }
        }
        .padding(16)
        .cardBackground()
    }

    // MARK: - Faction Mastery

    private var factionMasterySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Faction Mastery")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.textPrimary)

            ForEach(FactionShortName.allCases) { faction in
                HStack(spacing: 12) {
                    Image(systemName: faction.systemIconName)
                        .font(.system(size: 18))
                        .foregroundColor(faction.swiftUIColor)
                        .frame(width: 32, height: 32)
                        .background(faction.swiftUIColor.opacity(0.15))
                        .cornerRadius(8)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(faction.shortDisplayName)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.textPrimary)

                        // Progress bar
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.bgQuaternary)
                                    .cornerRadius(3)

                                Rectangle()
                                    .fill(faction.swiftUIColor)
                                    .frame(width: geometry.size.width * 0.0) // Will be populated from mastery data
                                    .cornerRadius(3)
                            }
                        }
                        .frame(height: 6)
                    }

                    Spacer()

                    Text("Lv. 0")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.textTertiary)
                }
                .padding(10)
                .background(Color.bgTertiary)
                .cornerRadius(10)
            }
        }
        .padding(16)
        .cardBackground()
    }

    // MARK: - Helpers

    private func profileStatRow(_ title: String, value: String) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 13))
                .foregroundColor(.textSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.textPrimary)
        }
        .padding(10)
        .background(Color.bgTertiary)
        .cornerRadius(8)
    }
}

#Preview {
    NavigationStack {
        ProfileView()
    }
    .environment(AppState())
    .environment(AppRouter())
}

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
                            .font(CardFont.bodyBold(size: 16))
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
                .font(CardFont.displayTitle(size: 22))
                .foregroundColor(.textPrimary)

            // Faction badge
            if let factionId = appState.player?.primaryFactionId,
               let faction = FactionShortName(rawValue: factionId.uuidString) {
                HStack(spacing: 6) {
                    Image(systemName: faction.systemIconName)
                        .font(.system(size: 13))
                    Text(faction.displayName)
                        .font(CardFont.body(size: 13))
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
                    .font(CardFont.bodyBold(size: 12))
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
                .font(CardFont.cardName(size: 16))
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
                            .font(CardFont.bodyBold(size: 14))
                            .foregroundColor(Color.rankColor(rank))
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        // LP progress
                        HStack {
                            Text("LP")
                                .font(CardFont.body(size: 13))
                                .foregroundColor(.textTertiary)
                            Text("\(appState.player?.seasonRankPoints ?? 0)")
                                .font(CardFont.cardName(size: 16))
                                .foregroundColor(.textPrimary)
                        }

                        // Win/Loss
                        HStack(spacing: 16) {
                            HStack(spacing: 4) {
                                Text("W")
                                    .font(CardFont.bodyBold(size: 12))
                                    .foregroundColor(.healGreen)
                                Text("\(appState.player?.totalWins ?? 0)")
                                    .font(CardFont.stats(size: 13))
                                    .foregroundColor(.textSecondary)
                            }
                            HStack(spacing: 4) {
                                Text("L")
                                    .font(CardFont.bodyBold(size: 12))
                                    .foregroundColor(.chaosRed)
                                Text("\(appState.player?.totalLosses ?? 0)")
                                    .font(CardFont.stats(size: 13))
                                    .foregroundColor(.textSecondary)
                            }
                            if let player = appState.player, player.totalGames > 0 {
                                Text("\(Int(Double(player.totalWins) / Double(player.totalGames) * 100))%")
                                    .font(CardFont.stats(size: 12))
                                    .foregroundColor(.textTertiary)
                            }
                        }
                    }

                    Spacer()
                }
            } else {
                Text("Play ranked matches to earn your rank!")
                    .font(CardFont.body(size: 14))
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
                .font(CardFont.cardName(size: 16))
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
                .font(CardFont.cardName(size: 16))
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
                            .font(CardFont.body(size: 14))
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
                        .font(CardFont.bodyBold(size: 13))
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
                .font(CardFont.body(size: 13))
                .foregroundColor(.textSecondary)
            Spacer()
            Text(value)
                .font(CardFont.stats(size: 14))
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

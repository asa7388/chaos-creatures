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
                        Image("FactionIcons/ui-battle")
                            .renderingMode(.template)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 20, height: 20)
                            .foregroundColor(.tauntGold)
                        Text("Achievements")
                            .font(CardFont.bodyBold(size: 16))
                            .foregroundColor(.textPrimary)
                        Spacer()
                        ThemedGlyph(symbol: "chevron.right", size: 12, color: .textTertiary)
                    }
                    .padding(16)
                    .leatherPanel()
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
        .themedNavigationTitle("Profile")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: ProfileDestination.settings) {
                    ThemedGlyph(symbol: "gearshape.fill", size: 14, color: .textSecondary)
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
                    Image("FactionIcons/ui-profile")
                        .renderingMode(.template)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 32, height: 32)
                        .foregroundColor(.textTertiary)
                )

            // Username
            Text(appState.player?.displayName ?? "Adventurer")
                .font(CardFont.displayTitle(size: 22))
                .foregroundColor(.textPrimary)

            // Faction badge
            if let factionId = appState.player?.primaryFactionId,
               let faction = FactionShortName(rawValue: factionId.uuidString) {
                HStack(spacing: 6) {
                    Image(faction.emblemAssetName)
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 13, height: 13)
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
        .leatherPanel()
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
                                Image("FactionIcons/ui-battle")
                                    .renderingMode(.template)
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 22, height: 22)
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
        .parchmentPanel()
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
        .leatherPanel()
    }

    // MARK: - Faction Mastery

    private var factionMasterySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Faction Mastery")
                .font(CardFont.cardName(size: 16))
                .foregroundColor(.textPrimary)

            ForEach(FactionShortName.allCases) { faction in
                HStack(spacing: 12) {
                    Image(factionEmblemAsset(faction))
                        .resizable()
                        .scaledToFit()
                        .frame(width: 28, height: 28)
                        .frame(width: 32, height: 32)
                        .background(faction.swiftUIColor.opacity(0.15))
                        .cornerRadius(8)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(faction.shortDisplayName)
                            .font(CardFont.body(size: 14))
                            .foregroundColor(.textPrimary)

                        // Progress bar
                        // TODO: Wire up real FactionMastery data when available (AppState needs to load faction_mastery table)
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.bgQuaternary)
                                    .cornerRadius(3)

                                Rectangle()
                                    .fill(faction.swiftUIColor)
                                    .frame(width: geometry.size.width * placeholderMasteryProgress(for: faction))
                                    .cornerRadius(3)
                            }
                        }
                        .frame(height: 6)
                    }

                    Spacer()

                    Text("Lv. \(placeholderMasteryLevel(for: faction))")
                        .font(CardFont.bodyBold(size: 13))
                        .foregroundColor(.textTertiary)
                }
                .padding(10)
                .background(Color.bgTertiary)
                .cornerRadius(10)
            }
        }
        .padding(16)
        .leatherPanel()
    }

    // MARK: - Helpers

    private func factionEmblemAsset(_ faction: FactionShortName) -> String {
        switch faction {
        case .ironwright: return "FactionEmblems/emblem-ironwright"
        case .feyCourts: return "FactionEmblems/emblem-fey"
        case .demonicKingdoms: return "FactionEmblems/emblem-demonic"
        case .celestialCrusade: return "FactionEmblems/emblem-celestial"
        case .theEndless: return "FactionEmblems/emblem-endless"
        }
    }

    /// Placeholder mastery progress based on player stats (0.0-1.0)
    /// TODO: Replace with real FactionMastery data when wired up in AppState
    private func placeholderMasteryProgress(for faction: FactionShortName) -> Double {
        guard let player = appState.player else { return 0.0 }

        // Use win rate as a placeholder for progress
        let baseProgress = player.winRate

        // Add some variance based on faction to make it look less uniform
        let factionVariance: Double
        switch faction {
        case .ironwright: factionVariance = 0.1
        case .feyCourts: factionVariance = 0.15
        case .demonicKingdoms: factionVariance = 0.05
        case .celestialCrusade: factionVariance = 0.2
        case .theEndless: factionVariance = 0.12
        }

        return min(baseProgress + factionVariance, 1.0)
    }

    /// Placeholder mastery level based on player level
    /// TODO: Replace with real FactionMastery data when wired up in AppState
    private func placeholderMasteryLevel(for faction: FactionShortName) -> Int {
        guard let player = appState.player else { return 0 }

        // Derive from player level with faction variance
        let baseFactionLevel = player.playerLevel / 3

        let factionAdjustment: Int
        switch faction {
        case .ironwright: factionAdjustment = 1
        case .feyCourts: factionAdjustment = 2
        case .demonicKingdoms: factionAdjustment = 0
        case .celestialCrusade: factionAdjustment = 3
        case .theEndless: factionAdjustment = 1
        }

        return max(0, baseFactionLevel + factionAdjustment)
    }

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

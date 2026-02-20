// AchievementsView.swift
// Chaos Creatures
// S-37: Achievement list with progress bars, category filters, and reward display.
// Source: docs/design/07-ui-ux-specs.md Section 6

import SwiftUI

struct AchievementsView: View {
    @Environment(AppState.self) private var appState

    @State private var achievements: [Achievement] = []
    @State private var playerAchievements: [PlayerAchievement] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var selectedCategory: AchievementCategory?

    var body: some View {
        Group {
            if isLoading {
                loadingView
            } else if let error {
                errorView(error)
            } else if achievements.isEmpty {
                emptyView
            } else {
                achievementList
            }
        }
        .background(Color.bgPrimary)
        .navigationTitle("Achievements")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadAchievements()
        }
    }

    // MARK: - Category Filter

    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // All categories
                categoryPill(label: "All", isSelected: selectedCategory == nil) {
                    selectedCategory = nil
                }

                ForEach(AchievementCategory.allCases, id: \.rawValue) { category in
                    categoryPill(
                        label: categoryDisplayName(category),
                        isSelected: selectedCategory == category
                    ) {
                        selectedCategory = category
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }

    private func categoryPill(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(isSelected ? CardFont.bodyBold(size: 13) : CardFont.body(size: 13))
                .foregroundColor(isSelected ? .textPrimary : .textSecondary)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? Color.ironwright : Color.bgTertiary)
                .cornerRadius(16)
        }
    }

    // MARK: - Achievement List

    private var achievementList: some View {
        VStack(spacing: 0) {
            // Summary header
            summaryHeader

            // Category filter
            categoryFilter

            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(filteredAchievements) { achievement in
                        AchievementRowView(
                            achievement: achievement,
                            playerProgress: playerProgress(for: achievement)
                        )
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 80)
            }
        }
    }

    // MARK: - Summary Header

    private var summaryHeader: some View {
        HStack(spacing: 16) {
            // Unlocked count
            VStack(spacing: 2) {
                Text("\(unlockedCount)")
                    .font(CardFont.stats(size: 24))
                    .foregroundColor(.tauntGold)
                Text("Unlocked")
                    .font(CardFont.body(size: 11))
                    .foregroundColor(.textTertiary)
            }
            .frame(maxWidth: .infinity)

            // Total count
            VStack(spacing: 2) {
                Text("\(achievements.count)")
                    .font(CardFont.stats(size: 24))
                    .foregroundColor(.textPrimary)
                Text("Total")
                    .font(CardFont.body(size: 11))
                    .foregroundColor(.textTertiary)
            }
            .frame(maxWidth: .infinity)

            // Completion %
            VStack(spacing: 2) {
                Text("\(completionPercent)%")
                    .font(CardFont.stats(size: 24))
                    .foregroundColor(.ironwright)
                Text("Complete")
                    .font(CardFont.body(size: 11))
                    .foregroundColor(.textTertiary)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(16)
        .background(Color.bgSecondary)
    }

    // MARK: - Empty / Loading / Error

    private var loadingView: some View {
        VStack(spacing: 12) {
            Spacer()
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .ironwright))
            Text("Loading achievements...")
                .font(CardFont.body(size: 14))
                .foregroundColor(.textSecondary)
            Spacer()
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40))  // SF Symbol icon size - keep as-is
                .foregroundColor(.warningYellow)
            Text(message)
                .font(CardFont.body(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Retry") {
                Task { await loadAchievements() }
            }
            .font(CardFont.bodyBold(size: 15))
            .foregroundColor(.textPrimary)
            .padding(.horizontal, 24)
            .padding(.vertical, 10)
            .background(Color.ironwright)
            .cornerRadius(8)
            Spacer()
        }
    }

    private var emptyView: some View {
        VStack(spacing: 12) {
            Spacer()
            Image("UIIcons/ui-achievement-medal")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 48, height: 48)
                .foregroundColor(.textDisabled)
            Text("No achievements available yet")
                .font(CardFont.body(size: 16))
                .foregroundColor(.textSecondary)
            Spacer()
        }
    }

    // MARK: - Data Loading

    private func loadAchievements() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            // Fetch all achievement definitions
            achievements = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.achievements,
                orderBy: "category"
            )

            // Fetch player's progress on achievements
            if let playerId = appState.player?.id {
                playerAchievements = try await SupabaseService.shared.fetchAll(
                    from: SupabaseService.Table.playerAchievements,
                    filters: [("player_id", playerId.uuidString)]
                )
            }
        } catch {
            self.error = "Failed to load achievements: \(error.localizedDescription)"
        }
    }

    // MARK: - Computed Properties

    private var filteredAchievements: [Achievement] {
        guard let category = selectedCategory else { return achievements }
        return achievements.filter { $0.category == category }
    }

    private func playerProgress(for achievement: Achievement) -> PlayerAchievement? {
        playerAchievements.first(where: { $0.achievementId == achievement.id })
    }

    private var unlockedCount: Int {
        playerAchievements.filter(\.isUnlocked).count
    }

    private var completionPercent: Int {
        guard !achievements.isEmpty else { return 0 }
        return Int(Double(unlockedCount) / Double(achievements.count) * 100)
    }

    private func categoryDisplayName(_ category: AchievementCategory) -> String {
        switch category {
        case .evolution: return "Evolution"
        case .battle: return "Battle"
        case .collection: return "Collection"
        case .chaosRoll: return "Chaos Roll"
        case .social: return "Social"
        }
    }
}

// MARK: - Achievement Row

struct AchievementRowView: View {
    let achievement: Achievement
    let playerProgress: PlayerAchievement?

    private var isUnlocked: Bool {
        playerProgress?.isUnlocked ?? false
    }

    private var currentValue: Int {
        playerProgress?.currentValue ?? 0
    }

    private var progress: Double {
        guard achievement.targetValue > 0 else { return 0 }
        return min(Double(currentValue) / Double(achievement.targetValue), 1.0)
    }

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            achievementIcon

            // Content
            VStack(alignment: .leading, spacing: 4) {
                // Title
                HStack {
                    Text(achievement.name)
                        .font(CardFont.bodyBold(size: 15))
                        .foregroundColor(isUnlocked ? .textPrimary : .textSecondary)

                    if isUnlocked {
                        Image(systemName: "checkmark.circle.fill")
                            .font(CardFont.body(size: 12))
                            .foregroundColor(.healGreen)
                    }
                }

                // Description
                Text(achievement.description)
                    .font(CardFont.body(size: 12))
                    .foregroundColor(.textTertiary)
                    .lineLimit(2)

                // Progress bar (if not unlocked)
                if !isUnlocked {
                    HStack(spacing: 6) {
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.bgQuaternary)

                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.ironwright)
                                    .frame(width: geometry.size.width * CGFloat(progress))
                            }
                        }
                        .frame(height: 6)

                        Text("\(currentValue)/\(achievement.targetValue)")
                            .font(CardFont.stats(size: 10))
                            .foregroundColor(.textTertiary)
                            .frame(minWidth: 40, alignment: .trailing)
                    }
                }

                // Reward info
                rewardLabel
            }
        }
        .padding(14)
        .background(isUnlocked ? Color.bgSecondary : Color.bgTertiary)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isUnlocked ? Color.tauntGold.opacity(0.3) : Color.clear, lineWidth: 1)
        )
        .opacity(isUnlocked ? 1.0 : 0.85)
    }

    private var achievementIcon: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10)
                .fill(isUnlocked ? Color.tauntGold.opacity(0.2) : Color.bgQuaternary)
                .frame(width: 44, height: 44)

            Image(categoryIcon(achievement.category))
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 20, height: 20)
                .foregroundColor(isUnlocked ? .tauntGold : .textDisabled)
        }
    }

    private var rewardLabel: some View {
        HStack(spacing: 4) {
            Image(rewardIconName)
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 10, height: 10)
                .foregroundColor(.ironwright)

            Text(rewardText)
                .font(CardFont.body(size: 11))
                .foregroundColor(.ironwright)

            if let title = achievement.rewardTitle {
                Text("+ \"\(title)\"")
                    .font(CardFont.flavorText(size: 11))
                    .foregroundColor(.tauntGold)
            }
        }
        .padding(.top, 2)
    }

    private var rewardIconName: String {
        switch achievement.rewardType {
        case .xp: return "UIIcons/ui-mission-trophy"
        case .shards: return "UIIcons/ui-crystal-shard"
        case .chaosEnergyBoost: return "UIIcons/ui-chaos-spark"
        }
    }

    private var rewardText: String {
        switch achievement.rewardType {
        case .xp: return "+\(achievement.rewardAmount) XP"
        case .shards: return "+\(achievement.rewardAmount) Shards"
        case .chaosEnergyBoost: return "+\(achievement.rewardAmount) Energy"
        }
    }

    private func categoryIcon(_ category: AchievementCategory) -> String {
        switch category {
        case .evolution: return "UIIcons/ui-achieve-evolution"
        case .battle: return "UIIcons/ui-achieve-battle"
        case .collection: return "UIIcons/ui-achieve-collection"
        case .chaosRoll: return "UIIcons/ui-achieve-chaos"
        case .social: return "UIIcons/ui-achieve-social"
        }
    }
}

#Preview {
    NavigationStack {
        AchievementsView()
    }
    .environment(AppState())
}

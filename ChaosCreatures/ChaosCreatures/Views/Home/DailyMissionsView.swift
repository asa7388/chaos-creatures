// DailyMissionsView.swift
// Chaos Creatures
// Daily mission display with progress bars.
// Source: docs/design/04-progression-economy.md

import SwiftUI

struct DailyMissionsView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Daily Missions")
                    .font(CardFont.cardName(size: 16))
                    .foregroundColor(.textPrimary)

                Spacer()

                if !appState.activeMissions.isEmpty {
                    Text("\(completedCount)/\(appState.activeMissions.count)")
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textTertiary)
                }
            }

            if appState.activeMissions.isEmpty {
                HStack {
                    ThemedGlyph(symbol: "checkmark.circle.fill", size: 16, color: .healGreen)
                    Text("All missions complete! Check back tomorrow.")
                        .font(CardFont.body(size: 14))
                        .foregroundColor(.textSecondary)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.bgTertiary)
                .cornerRadius(10)
            } else {
                ForEach(appState.activeMissions) { mission in
                    MissionRowView(mission: mission)
                }
            }
        }
        .padding(16)
        .parchmentPanel()
    }

    private var completedCount: Int {
        appState.activeMissions.filter { $0.isCompleted }.count
    }
}

// MARK: - Mission Row

struct MissionRowView: View {
    let mission: Mission

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                // Mission icon
                Image(missionIcon(mission.missionType))
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 16, height: 16)
                    .foregroundColor(mission.isCompleted ? .healGreen : .orderBlue)
                    .frame(width: 28, height: 28)
                    .background(
                        (mission.isCompleted ? Color.healGreen : Color.orderBlue)
                            .opacity(0.15)
                    )
                    .cornerRadius(6)

                VStack(alignment: .leading, spacing: 2) {
                    Text(mission.description)
                        .font(CardFont.body(size: 14))
                        .foregroundColor(.textPrimary)
                        .lineLimit(1)

                    Text(rewardText(mission))
                        .font(CardFont.body(size: 12))
                        .foregroundColor(.textTertiary)
                }

                Spacer()

                // Progress label
                Text("\(mission.currentValue)/\(mission.targetValue)")
                    .font(CardFont.stats(size: 13))
                    .foregroundColor(mission.isCompleted ? .healGreen : .textSecondary)
            }

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.bgQuaternary)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(mission.isCompleted ? Color.healGreen : Color.orderBlue)
                        .frame(width: geometry.size.width * mission.progress)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)
        }
        .padding(12)
        .background(Color.bgTertiary)
        .cornerRadius(10)
        .opacity(mission.isCompleted ? 0.7 : 1.0)
    }

    private func missionIcon(_ type: MissionType) -> String {
        switch type {
        case .winGames: return "UIIcons/ui-mission-trophy"
        case .playCards: return "UIIcons/ui-mission-cards"
        case .playCreatures: return "UIIcons/ui-mission-creatures"
        case .playSpells: return "UIIcons/ui-mission-spells"
        case .evolveCard: return "UIIcons/ui-mission-evolve"
        case .triggerOrderEvents: return "UIIcons/ui-attune-order"
        case .triggerChaosEvents: return "UIIcons/ui-attune-chaos"
        case .dealDamage: return "UIIcons/ui-trigger-damage"
        case .winWithStyle: return "UIIcons/ui-mission-trophy"
        case .playGames: return "UIIcons/ui-mission-games"
        }
    }

    private func rewardText(_ mission: Mission) -> String {
        var parts: [String] = []
        if mission.rewardDust > 0 {
            parts.append("+\(mission.rewardDust) Dust")
        }
        if mission.rewardShardCount > 0, let tier = mission.rewardShardTier {
            parts.append("+\(mission.rewardShardCount) \(tier.rawValue) Shards")
        }
        return parts.isEmpty ? "Reward" : parts.joined(separator: ", ")
    }
}

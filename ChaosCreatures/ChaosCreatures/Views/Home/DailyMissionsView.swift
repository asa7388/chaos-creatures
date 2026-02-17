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
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.textPrimary)

                Spacer()

                if !appState.activeMissions.isEmpty {
                    Text("\(completedCount)/\(appState.activeMissions.count)")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.textTertiary)
                }
            }

            if appState.activeMissions.isEmpty {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.healGreen)
                    Text("All missions complete! Check back tomorrow.")
                        .font(.system(size: 14))
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
        .cardBackground()
    }

    private var completedCount: Int {
        appState.activeMissions.filter { $0.completed }.count
    }
}

// MARK: - Mission Row

struct MissionRowView: View {
    let mission: Mission

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                // Mission icon
                Image(systemName: missionIcon(mission.missionType))
                    .font(.system(size: 16))
                    .foregroundColor(mission.completed ? .healGreen : .orderBlue)
                    .frame(width: 28, height: 28)
                    .background(
                        (mission.completed ? Color.healGreen : Color.orderBlue)
                            .opacity(0.15)
                    )
                    .cornerRadius(6)

                VStack(alignment: .leading, spacing: 2) {
                    Text(mission.description)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.textPrimary)
                        .lineLimit(1)

                    Text(rewardText(mission))
                        .font(.system(size: 12))
                        .foregroundColor(.textTertiary)
                }

                Spacer()

                // Progress label
                Text("\(mission.currentProgress)/\(mission.targetValue)")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(mission.completed ? .healGreen : .textSecondary)
            }

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.bgQuaternary)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(mission.completed ? Color.healGreen : Color.orderBlue)
                        .frame(width: geometry.size.width * mission.progress)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)
        }
        .padding(12)
        .background(Color.bgTertiary)
        .cornerRadius(10)
        .opacity(mission.completed ? 0.7 : 1.0)
    }

    private func missionIcon(_ type: MissionType) -> String {
        switch type {
        case .winGames: return "trophy.fill"
        case .playCards: return "rectangle.stack.fill"
        case .playCreatures: return "person.3.fill"
        case .playSpells: return "wand.and.stars"
        case .evolveCard: return "arrow.up.circle.fill"
        case .triggerOrderEvents: return "shield.fill"
        case .triggerChaosEvents: return "bolt.fill"
        case .dealDamage: return "flame.fill"
        case .winWithStyle: return "star.fill"
        case .playGames: return "gamecontroller.fill"
        }
    }

    private func rewardText(_ mission: Mission) -> String {
        switch mission.rewardType {
        case .xp: return "+\(mission.rewardAmount) XP"
        case .shards: return "+\(mission.rewardAmount) Shards"
        case .chaosEnergyBoost: return "+\(mission.rewardAmount) Chaos Energy"
        }
    }
}

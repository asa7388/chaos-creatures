// FactionPickerView.swift
// Chaos Creatures
// Faction selection with swipeable cards for onboarding.
// Source: docs/design/07-ui-ux-specs.md Section 7.2 Step 2

import SwiftUI

struct FactionPickerView: View {
    let onSelect: (FactionShortName) -> Void

    @State private var selectedFaction: FactionShortName = .ironwright

    var body: some View {
        VStack(spacing: 0) {
            // Header
            Text("Choose Your Faction")
                .font(.system(size: 26, weight: .bold))
                .foregroundColor(.textPrimary)
                .padding(.top, 40)
                .padding(.bottom, 8)

            Text("Each faction has a unique mechanic that shapes your strategy.")
                .font(.system(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
                .padding(.bottom, 24)

            // Faction pager
            TabView(selection: $selectedFaction) {
                ForEach(FactionShortName.allCases) { faction in
                    FactionCardView(faction: faction) {
                        onSelect(faction)
                    }
                    .tag(faction)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .always))
        }
        .background(Color.bgPrimary)
    }
}

// MARK: - Faction Card

struct FactionCardView: View {
    let faction: FactionShortName
    let onChoose: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            // Faction icon
            Image(systemName: faction.systemIconName)
                .font(.system(size: 64))
                .foregroundColor(faction.swiftUIColor)

            // Faction name
            Text(faction.displayName)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.textPrimary)

            // Mechanic badge
            Text(faction.mechanic.rawValue)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.black)
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
                .background(faction.swiftUIColor)
                .cornerRadius(12)

            // Description
            Text(factionDescription(faction))
                .font(.system(size: 15))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                .fixedSize(horizontal: false, vertical: true)

            // Theme keywords
            HStack(spacing: 12) {
                ForEach(factionKeywords(faction), id: \.self) { keyword in
                    Text(keyword)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.textTertiary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.bgTertiary)
                        .cornerRadius(8)
                }
            }

            Spacer()

            // Choose button
            Button(action: onChoose) {
                Text("Choose \(faction.shortDisplayName)")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.black)
                    .frame(width: 200, height: 52)
                    .background(faction.swiftUIColor)
                    .cornerRadius(12)
            }
            .padding(.bottom, 40)
        }
        .padding(.top, 20)
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [
                    faction.swiftUIColor.opacity(0.15),
                    Color.bgPrimary
                ],
                startPoint: .top,
                endPoint: .center
            )
        )
    }

    private func factionDescription(_ faction: FactionShortName) -> String {
        switch faction {
        case .ironwright:
            return "Masters of mechanical augmentation. Stack stat boosts and keywords through evolution to build unstoppable creatures."
        case .feyCourts:
            return "Weavers of natural bonds. Create powerful synergies between creatures that share the battlefield."
        case .demonicKingdoms:
            return "Wielders of dark corruption. Sacrifice resources for devastating power spikes that can swing entire games."
        }
    }

    private func factionKeywords(_ faction: FactionShortName) -> [String] {
        switch faction {
        case .ironwright:
            return ["Augment", "Stat Boosts", "Keywords"]
        case .feyCourts:
            return ["Bond", "Synergy", "Teamwork"]
        case .demonicKingdoms:
            return ["Corruption", "Sacrifice", "Power"]
        }
    }
}

// MARK: - FactionShortName Icon Extension

extension FactionShortName {
    var systemIconName: String {
        switch self {
        case .ironwright: return "gearshape.2.fill"
        case .feyCourts: return "leaf.fill"
        case .demonicKingdoms: return "flame.fill"
        }
    }
}

#Preview {
    FactionPickerView { faction in
        print("Selected: \(faction)")
    }
}

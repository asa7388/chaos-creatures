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
                .font(CardFont.displayTitle(size: 26))
                .foregroundColor(.textPrimary)
                .padding(.top, 40)
                .padding(.bottom, 8)

            Text("Each faction has a unique mechanic that shapes your strategy.")
                .font(CardFont.body(size: 14))
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
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-dark-parchment")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .opacity(0.26)
            }
        )
    }
}

// MARK: - Faction Card

struct FactionCardView: View {
    let faction: FactionShortName
    let onChoose: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            // Faction icon
            Image(faction.emblemAssetName)
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 64, height: 64)
                .foregroundColor(faction.swiftUIColor)

            // Faction name
            Text(faction.displayName)
                .font(CardFont.displayTitle(size: 24))
                .foregroundColor(.textPrimary)

            // Mechanic badge
            Text(faction.mechanic.rawValue)
                .font(CardFont.bodyBold(size: 13))
                .foregroundColor(.textDark)
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
                .background(faction.swiftUIColor)
                .cornerRadius(12)

            // Description
            Text(factionDescription(faction))
                .font(CardFont.body(size: 15))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                .fixedSize(horizontal: false, vertical: true)

            // Theme keywords
            HStack(spacing: 12) {
                ForEach(factionKeywords(faction), id: \.self) { keyword in
                    Text(keyword)
                        .font(CardFont.body(size: 12))
                        .foregroundColor(.textTertiary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            ZStack {
                                Color(hex: "#2A2318")
                                Image("CardTextures/tex-parchment")
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .opacity(0.2)
                            }
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.tauntGold.opacity(0.15), lineWidth: 0.5)
                        )
                }
            }

            Spacer()

            // Choose button
            Button(action: onChoose) {
                Text("Choose \(faction.shortDisplayName)")
                    .font(CardFont.bodyBold(size: 17))
                    .foregroundColor(.textDark)
                    .frame(width: 200, height: 52)
                    .background(faction.swiftUIColor)
                    .cornerRadius(12)
            }
            .padding(.bottom, 40)
        }
        .padding(.top, 20)
        .frame(maxWidth: .infinity)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.bgSecondary.opacity(0.92))
                Image("UIComponents/ui-panel-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .opacity(0.3)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                LinearGradient(
                    colors: [
                        faction.swiftUIColor.opacity(0.18),
                        .clear
                    ],
                    startPoint: .top,
                    endPoint: .center
                )
                .clipShape(RoundedRectangle(cornerRadius: 20))
            }
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(faction.swiftUIColor.opacity(0.3), lineWidth: 0.8)
            )
        )
        .padding(.horizontal, 16)
    }

    private func factionDescription(_ faction: FactionShortName) -> String {
        switch faction {
        case .ironwright:
            return "Masters of mechanical augmentation. Stack stat boosts and keywords through evolution to build unstoppable creatures."
        case .feyCourts:
            return "Weavers of natural bonds. Create powerful synergies between creatures that share the battlefield."
        case .demonicKingdoms:
            return "Wielders of dark corruption. Sacrifice resources for devastating power spikes that can swing entire games."
        case .celestialCrusade:
            return "Champions of divine exaltation. Empower your strongest creatures with celestial blessings that grow with righteous victory."
        case .theEndless:
            return "Masters of undying persistence. Your fallen creatures refuse to stay dead, returning weakened but relentless."
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
        case .celestialCrusade:
            return ["Exalt", "Divine Buffs", "Judgment"]
        case .theEndless:
            return ["Persist", "Undying", "Inevitability"]
        }
    }
}

#Preview {
    FactionPickerView { _ in
        // no-op
    }
}

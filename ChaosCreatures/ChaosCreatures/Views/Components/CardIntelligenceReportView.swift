// CardIntelligenceReportView.swift
// Chaos Creatures
//
// Back-face content view — scrollable "intelligence report" on parchment panel.
// Uses IM Fell English (Regular + Italic) typography via CardFont.
//
// Spec: CARD_DESIGN_GUIDE.md Section 1.8.
// Content varies by CardType:
//   Creature:   Faction header -> Abilities -> Modifiers -> Divider -> Flavor
//   Spell:      Faction header -> Abilities (full mechanic) -> Divider -> Flavor
//   Stabilizer: Faction header -> Abilities (passive) -> Divider -> Flavor
//   Planar Ruin: Faction header -> Passive -> Destroyed penalty -> Modifiers -> Divider -> Flavor

import SwiftUI

// MARK: - ReportTextShadow ViewModifier

/// Letterpress shadow: x=0, y=0.5pt, blur 0.5pt, parchment-dark at 60% opacity.
struct ReportTextShadow: ViewModifier {
    func body(content: Content) -> some View {
        content.shadow(
            color: Color(red: 0.647, green: 0.573, blue: 0.443).opacity(0.6),
            radius: 0.5,
            x: 0,
            y: 0.5
        )
    }
}

extension View {
    func reportTextShadow() -> some View {
        modifier(ReportTextShadow())
    }
}

// MARK: - CardIntelligenceReportView

struct CardIntelligenceReportView: View {
    let data: CardDisplayData
    let cardScale: CGFloat  // cardWidth / 210.0

    // MARK: - Colors

    /// Warm near-black ink for body text.
    /// Uses the "ink-black" asset if available; falls back to warm near-black.
    private var inkColor: Color {
        Color("ink-black")
    }

    /// Hairline divider color — parchment-mid at 60% opacity.
    private var dividerColor: Color {
        Color("parchment-mid").opacity(0.6)
    }

    // MARK: - Body

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                // 1. Faction name header
                factionHeader

                // 2. Spacer
                Spacer()
                    .frame(height: 8 * cardScale)

                // 3-5. Card-type-specific content
                cardTypeContent

                // 6. Hairline divider
                hairlineDivider

                // 7. Flavor text
                if !data.flavorText.isEmpty {
                    flavorTextSection
                }
            }
            .padding(12 * cardScale)
        }
    }

    // MARK: - Faction Header

    /// Faction name, centered, 60% opacity, IM Fell English 8pt * cardScale.
    private var factionHeader: some View {
        Group {
            if let faction = data.faction {
                Text(faction.displayName.uppercased())
                    .font(CardFont.reportFactionHeader(size: 8 * cardScale))
                    .foregroundColor(inkColor.opacity(0.6))
                    .reportTextShadow()
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        }
    }

    // MARK: - Card Type Content

    @ViewBuilder
    private var cardTypeContent: some View {
        switch data.cardType {
        case .creature:
            creatureContent
        case .spell:
            spellContent
        case .stabilizer:
            stabilizerContent
        case .planarRuin:
            planarRuinContent
        }
    }

    // MARK: - Creature Content

    /// Abilities -> Modifiers -> (then divider + flavor handled by parent)
    private var creatureContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            abilitiesSection
            Spacer().frame(height: 6 * cardScale)
            modifiersSection
        }
    }

    // MARK: - Spell Content

    /// Abilities (full mechanic) -> (then divider + flavor handled by parent)
    private var spellContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            abilitiesSection
        }
    }

    // MARK: - Stabilizer Content

    /// Abilities (passive) -> (then divider + flavor handled by parent)
    private var stabilizerContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            abilitiesSection
        }
    }

    // MARK: - Planar Ruin Content

    /// Passive -> Destroyed penalty -> Modifiers -> (then divider + flavor handled by parent)
    private var planarRuinContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Passive section
            if let passiveText = data.ruinPassiveText, !passiveText.isEmpty {
                sectionLabel("Passive:")
                Text(passiveText)
                    .font(CardFont.reportBody(size: 9 * cardScale))
                    .foregroundColor(inkColor)
                    .reportTextShadow()
                    .fixedSize(horizontal: false, vertical: true)
                Spacer().frame(height: 6 * cardScale)
            }

            // Destroyed penalty section
            if let penaltyText = data.ruinDestructionPenaltyText, !penaltyText.isEmpty {
                sectionLabel("Destroyed:")
                Text(penaltyText)
                    .font(CardFont.reportBody(size: 9 * cardScale))
                    .foregroundColor(inkColor)
                    .reportTextShadow()
                    .fixedSize(horizontal: false, vertical: true)
                Spacer().frame(height: 6 * cardScale)
            }

            // Modifiers
            modifiersSection
        }
    }

    // MARK: - Abilities Section

    @ViewBuilder
    private var abilitiesSection: some View {
        let hasKeywords = !data.keywords.isEmpty
        let hasAbilityText = data.abilityText != nil && !data.abilityText!.isEmpty

        if hasKeywords || hasAbilityText {
            sectionLabel("Abilities:")

            // Each keyword on its own line: "Keyword: description"
            ForEach(data.keywords, id: \.self) { keyword in
                HStack(alignment: .top, spacing: 0) {
                    Text("\(keyword.displayName): ")
                        .font(CardFont.reportItalic(size: 9 * cardScale))
                        .foregroundColor(inkColor)
                    Text(keyword.description)
                        .font(CardFont.reportBody(size: 9 * cardScale))
                        .foregroundColor(inkColor)
                }
                .reportTextShadow()
                .fixedSize(horizontal: false, vertical: true)
            }

            // Ability text (rules text) if present and no keywords cover it
            if let abilityText = data.abilityText, !abilityText.isEmpty, data.keywords.isEmpty {
                Text(abilityText)
                    .font(CardFont.reportBody(size: 9 * cardScale))
                    .foregroundColor(inkColor)
                    .reportTextShadow()
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: - Modifiers Section

    @ViewBuilder
    private var modifiersSection: some View {
        // Only show for card types that support modifiers
        if data.cardType == .creature || data.cardType == .planarRuin {
            sectionLabel("Modifiers:")
            Text("No active modifiers.")
                .font(CardFont.reportBody(size: 9 * cardScale))
                .foregroundColor(inkColor.opacity(0.6))
                .reportTextShadow()
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Hairline Divider

    private var hairlineDivider: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 6 * cardScale)
            Rectangle()
                .fill(dividerColor)
                .frame(height: 0.5)
            Spacer().frame(height: 6 * cardScale)
        }
    }

    // MARK: - Flavor Text

    /// Quoted flavor text in IM Fell English Italic, 80% opacity.
    private var flavorTextSection: some View {
        Text("\u{201C}\(data.flavorText)\u{201D}")
            .font(CardFont.reportItalic(size: 10 * cardScale))
            .foregroundColor(inkColor.opacity(0.8))
            .reportTextShadow()
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Helpers

    /// Section label — IM Fell English 9pt * cardScale, semibold weight.
    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(CardFont.reportSectionLabel(size: 9 * cardScale))
            .fontWeight(.semibold)
            .foregroundColor(inkColor)
            .reportTextShadow()
            .padding(.bottom, 2 * cardScale)
    }
}

// MARK: - Preview

#Preview("Intelligence Report — Creature") {
    ZStack {
        Color("parchment-light")
        CardIntelligenceReportView(
            data: CardDisplayData(
                name: "Ironclad Vanguard",
                artUrl: nil,
                manaCost: 4,
                attack: 5,
                health: 7,
                instability: 3,
                tier: .rare,
                cardType: .creature,
                faction: .ironwright,
                keywords: [.shield, .taunt],
                flavorText: "Forged in the foundries of the Ninth Spire, it knows neither mercy nor retreat.",
                abilityText: "Shield: absorbs one hit. Taunt: must be attacked."
            ),
            cardScale: 280.0 / 210.0
        )
    }
    .frame(width: 280, height: 392)
    .clipShape(RoundedRectangle(cornerRadius: 12))
}

#Preview("Intelligence Report — Spell") {
    ZStack {
        Color("parchment-light")
        CardIntelligenceReportView(
            data: CardDisplayData(
                name: "Verdant Cascade",
                artUrl: nil,
                manaCost: 3,
                tier: .uncommon,
                cardType: .spell,
                faction: .fey,
                keywords: [.lifesteal],
                flavorText: "The forest drinks deep of what it is owed.",
                abilityText: "Deal 4 damage. Heal for damage dealt."
            ),
            cardScale: 280.0 / 210.0
        )
    }
    .frame(width: 280, height: 392)
    .clipShape(RoundedRectangle(cornerRadius: 12))
}

#Preview("Intelligence Report — Planar Ruin") {
    ZStack {
        Color("parchment-light")
        CardIntelligenceReportView(
            data: CardDisplayData(
                name: "Ashen Colosseum",
                artUrl: nil,
                manaCost: 3,
                health: 10,
                tier: .rare,
                cardType: .planarRuin,
                faction: .demonic,
                keywords: [],
                flavorText: "Even its rubble commands obedience.",
                ruinPassiveText: "All friendly creatures deal +1 damage.",
                ruinDestructionPenaltyText: "All your creatures lose 2 ATK until end of turn."
            ),
            cardScale: 280.0 / 210.0
        )
    }
    .frame(width: 280, height: 392)
    .clipShape(RoundedRectangle(cornerRadius: 12))
}

#Preview("Intelligence Report — Stabilizer") {
    ZStack {
        Color("parchment-light")
        CardIntelligenceReportView(
            data: CardDisplayData(
                name: "Chaos Dampener",
                artUrl: nil,
                manaCost: 2,
                tier: .common,
                cardType: .stabilizer,
                faction: .celestial,
                keywords: [.ward],
                flavorText: "Silence is the first commandment of order."
            ),
            cardScale: 280.0 / 210.0
        )
    }
    .frame(width: 280, height: 392)
    .clipShape(RoundedRectangle(cornerRadius: 12))
}

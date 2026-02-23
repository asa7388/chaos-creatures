// CardDossierTextView.swift
// Chaos Creatures
//
// Front-face text overlay for the full-art dossier card layout.
// Renders labeled text fields over the creature artwork, anchored
// at the bottom of the card and growing upward.
//
// Spec: CARD_DESIGN_GUIDE.md Section 1.4 (layout) and Section 1.5 (typography).
// All text uses Fredericka the Great Regular via CardFont.frederickaTheGreat(size:).
// All text receives DossierTextShadow modifier for legibility over artwork.

import SwiftUI

// MARK: - DossierTextShadow ViewModifier

struct DossierTextShadow: ViewModifier {
    func body(content: Content) -> some View {
        content
            .shadow(color: .black.opacity(0.9), radius: 3, x: 0, y: 1)
    }
}

extension View {
    func dossierTextShadow() -> some View {
        modifier(DossierTextShadow())
    }
}

// MARK: - CardDossierTextView

struct CardDossierTextView: View {
    let data: CardDisplayData
    let cardScale: CGFloat  // cardWidth / 210.0

    // MARK: - Colors

    /// Ivory / cream white — warm off-white for maximum legibility over artwork.
    private let ivoryColor = Color(red: 1.0, green: 0.98, blue: 0.94)
    private let labelColor: Color
    private let valueColor: Color

    init(data: CardDisplayData, cardScale: CGFloat) {
        self.data = data
        self.cardScale = cardScale
        let ivory = Color(red: 1.0, green: 0.98, blue: 0.94)
        self.labelColor = ivory
        self.valueColor = ivory
    }

    // MARK: - Body

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer(minLength: 0)

            // Text fields — no backdrop, shadow-only legibility
            VStack(alignment: .leading, spacing: 2 * cardScale) {
                // --- Name (no label) ---
                nameField

                // --- Type / Faction ---
                typeField

                // --- Abilities (keywords) ---
                if !data.keywords.isEmpty {
                    abilitiesField
                }

                // --- Cost / ATK / HP line (card-type dependent) ---
                statsLineField

                // --- Instability (creatures only, > 0) ---
                if shouldShowInstability {
                    instabilityField
                }

                // --- Destroyed (planar ruin penalty) ---
                if shouldShowDestroyed, let penalty = data.ruinDestructionPenaltyText, !penalty.isEmpty {
                    destroyedField(penalty: penalty)
                }

                // --- Rank label (card-type dependent) ---
                if shouldShowRank {
                    rankField
                }
            }
            .padding(.horizontal, 6 * cardScale)
            .padding(.vertical, 4 * cardScale)
        }
        .padding(.leading, 6 * cardScale)
        .padding(.trailing, 6 * cardScale)
        .padding(.bottom, 6 * cardScale)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
    }

    // MARK: - Field Views

    /// Card name — no label, 15pt, 100% opacity.
    private var nameField: some View {
        Text(data.name)
            .font(CardFont.frederickaTheGreat(size: 15 * cardScale))
            .foregroundColor(valueColor)
            .lineLimit(2)
            .minimumScaleFactor(0.7)
            .lineSpacing(1.4 * cardScale)
            .dossierTextShadow()
    }

    /// Type / Faction line.
    private var typeField: some View {
        fieldRow(label: "Type:", value: data.typeLine, valueSize: 12, valueOpacity: 1.0)
    }

    /// Abilities — keyword names joined with commas.
    private var abilitiesField: some View {
        let keywordNames = data.keywords.map { $0.displayName }.joined(separator: ", ")
        return fieldRow(label: "Abilities:", value: keywordNames, valueSize: 12, valueOpacity: 1.0)
    }

    /// Cost / ATK / HP inline stats — varies by card type.
    @ViewBuilder
    private var statsLineField: some View {
        switch data.cardType {
        case .creature:
            // Cost: N  ATK: N  HP: N
            creatureStatsLine
        case .spell:
            // Cost only, no ATK, no HP
            spellStatsLine
        case .stabilizer:
            // No cost, no ATK, no HP — nothing to show
            EmptyView()
        case .planarRuin:
            // HP only (no ATK, no Cost label)
            ruinStatsLine
        }
    }

    /// Creature: `Cost: N  ATK: N  HP: N`
    private var creatureStatsLine: some View {
        HStack(alignment: .firstTextBaseline, spacing: 0) {
            statSegment(label: "Cost:", value: "\(data.manaCost)")
            statSpacer
            if let atk = data.attack {
                statSegment(label: "ATK:", value: "\(atk)")
                statSpacer
            }
            if let hp = data.health {
                statSegment(label: "HP:", value: "\(hp)")
            }
        }
        .dossierTextShadow()
    }

    /// Spell: `Cost: N`
    private var spellStatsLine: some View {
        HStack(alignment: .firstTextBaseline, spacing: 0) {
            statSegment(label: "Cost:", value: "\(data.manaCost)")
        }
        .dossierTextShadow()
    }

    /// Planar Ruin: `HP: N`
    @ViewBuilder
    private var ruinStatsLine: some View {
        if let hp = data.health {
            HStack(alignment: .firstTextBaseline, spacing: 0) {
                statSegment(label: "HP:", value: "\(hp)")
            }
            .dossierTextShadow()
        }
    }

    /// Instability field — creatures only, shown when > 0.
    private var instabilityField: some View {
        fieldRow(
            label: "Instability:",
            value: "\(data.instability ?? 0)",
            valueSize: 12,
            valueOpacity: 1.0
        )
    }

    /// Destroyed field — planar ruin destruction penalty.
    private func destroyedField(penalty: String) -> some View {
        fieldRow(label: "Destroyed:", value: penalty, valueSize: 12, valueOpacity: 1.0)
    }

    /// Rank label — seal is rendered separately, this is just the text label.
    private var rankField: some View {
        Text("Rank:")
            .font(CardFont.frederickaTheGreat(size: 9 * cardScale))
            .foregroundColor(labelColor.opacity(0.85))
            .dossierTextShadow()
    }

    // MARK: - Helpers

    /// Generic labeled field row.
    @ViewBuilder
    private func fieldRow(label: String, value: String, valueSize: CGFloat, valueOpacity: Double) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 4 * cardScale) {
            Text(label)
                .font(CardFont.frederickaTheGreat(size: 9 * cardScale))
                .foregroundColor(labelColor.opacity(0.85))
            Text(value)
                .font(CardFont.frederickaTheGreat(size: valueSize * cardScale))
                .foregroundColor(valueColor.opacity(valueOpacity))
                .lineLimit(3)
                .minimumScaleFactor(0.7)
        }
        .lineSpacing(1.4 * cardScale)
        .dossierTextShadow()
    }

    /// Inline stat segment: label + value on same baseline.
    private func statSegment(label: String, value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 2 * cardScale) {
            Text(label)
                .font(CardFont.frederickaTheGreat(size: 9 * cardScale))
                .foregroundColor(labelColor.opacity(0.85))
            Text(value)
                .font(CardFont.frederickaTheGreat(size: 13 * cardScale))
                .foregroundColor(valueColor)
        }
    }

    /// Fixed-width spacer between stat segments.
    private var statSpacer: some View {
        Spacer()
            .frame(width: 8 * cardScale)
    }

    // MARK: - Conditional Display Logic

    /// Instability shows for creatures only when > 0.
    private var shouldShowInstability: Bool {
        data.cardType == .creature && (data.instability ?? 0) > 0
    }

    /// Destroyed field shows for planar ruins only.
    private var shouldShowDestroyed: Bool {
        data.cardType == .planarRuin
    }

    /// Rank label shows based on card type:
    /// - Creature: yes (unless common — skip for common since modifiers are empty)
    /// - Spell: no
    /// - Stabilizer: yes
    /// - Planar Ruin: yes if evolved (tier > .common)
    private var shouldShowRank: Bool {
        switch data.cardType {
        case .creature:
            return data.tier > .common
        case .spell:
            return false
        case .stabilizer:
            return true
        case .planarRuin:
            return data.tier > .common
        }
    }
}

// MARK: - Preview

#Preview("Dossier Text — Creature Detail") {
    ZStack {
        // Simulate artwork background
        LinearGradient(
            colors: [Color.black.opacity(0.6), Color.black.opacity(0.85)],
            startPoint: .top,
            endPoint: .bottom
        )

        CardDossierTextView(
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
                flavorText: "",
                abilityText: "Shield: absorbs one hit. Taunt: must be attacked."
            ),
            cardScale: 280.0 / 210.0
        )
    }
    .frame(width: 280, height: 392)
    .clipShape(RoundedRectangle(cornerRadius: 12))
}

#Preview("Dossier Text — Spell") {
    ZStack {
        LinearGradient(
            colors: [Color.black.opacity(0.5), Color.black.opacity(0.8)],
            startPoint: .top,
            endPoint: .bottom
        )

        CardDossierTextView(
            data: CardDisplayData(
                name: "Verdant Cascade",
                artUrl: nil,
                manaCost: 3,
                tier: .uncommon,
                cardType: .spell,
                faction: .fey,
                keywords: [.lifesteal],
                flavorText: "",
                abilityText: "Deal 4 damage. Heal for damage dealt."
            ),
            cardScale: 280.0 / 210.0
        )
    }
    .frame(width: 280, height: 392)
    .clipShape(RoundedRectangle(cornerRadius: 12))
}

#Preview("Dossier Text — Planar Ruin") {
    ZStack {
        LinearGradient(
            colors: [Color.black.opacity(0.5), Color.black.opacity(0.8)],
            startPoint: .top,
            endPoint: .bottom
        )

        CardDossierTextView(
            data: CardDisplayData(
                name: "Ashen Colosseum",
                artUrl: nil,
                manaCost: 3,
                health: 10,
                tier: .rare,
                cardType: .planarRuin,
                faction: .demonic,
                keywords: [],
                flavorText: "",
                ruinPassiveText: "All creatures deal +1 damage.",
                ruinDestructionPenaltyText: "All your creatures lose 2 ATK until end of turn."
            ),
            cardScale: 280.0 / 210.0
        )
    }
    .frame(width: 280, height: 392)
    .clipShape(RoundedRectangle(cornerRadius: 12))
}

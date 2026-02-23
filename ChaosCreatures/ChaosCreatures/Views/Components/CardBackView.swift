// CardBackView.swift
// Chaos Creatures
//
// Card back design per CARD_DESIGN_GUIDE.md Section 1.8.
// Phase 4 rewrite: parchment panel background + CardIntelligenceReportView overlay.
// The card back presents an aged-document "intelligence report" for the card,
// showing stats, keywords, and lore in a dossier format.
//
// Flip animation is driven by CardFrameView (two-phase Y-axis rotation):
//   Phase 1: easeIn 0.17s -> rotationY 90deg (front face disappears)
//   Phase 2: swap face, easeOut 0.18s from -90deg -> 0deg
//
// Task 4.1

import SwiftUI

// MARK: - CardBackView

/// The card back face. Rendered by CardFrameView when isFlipped = true.
/// Dimensions and corner radius match card front exactly.
struct CardBackView: View {
    let data: CardDisplayData
    let cardWidth: CGFloat
    let cardHeight: CGFloat

    private var cardScale: CGFloat {
        cardWidth / 210.0
    }

    var body: some View {
        ZStack {
            // 1. Parchment panel background -- warm cream fill (aged document look)
            Color(red: 0.953, green: 0.898, blue: 0.780)

            // 2. CardIntelligenceReportView -- dossier content overlay
            CardIntelligenceReportView(data: data, cardScale: cardScale)
        }
        .frame(width: cardWidth, height: cardHeight)
        .clipShape(RoundedRectangle(cornerRadius: 9 * cardScale))
    }
}

// MARK: - Previews

#Preview("Card Back -- Creature") {
    CardBackView(
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
            flavorText: "Through the flames of industry, a new guardian is born."
        ),
        cardWidth: 210,
        cardHeight: 294
    )
    .padding()
    .background(Color.bgPrimary)
}

#Preview("Card Back -- Spell") {
    CardBackView(
        data: CardDisplayData(
            name: "Verdant Cascade",
            artUrl: nil,
            manaCost: 3,
            tier: .common,
            cardType: .spell,
            faction: .fey,
            keywords: [.lifesteal],
            flavorText: "The forest remembers what was taken."
        ),
        cardWidth: 210,
        cardHeight: 294
    )
    .padding()
    .background(Color.bgPrimary)
}

#Preview("Card Back -- Small") {
    CardBackView(
        data: CardDisplayData(
            name: "Shadow Assassin",
            artUrl: nil,
            manaCost: 2,
            attack: 2,
            health: 1,
            instability: 2,
            tier: .uncommon,
            cardType: .creature,
            faction: .demonic,
            keywords: [.haste],
            flavorText: ""
        ),
        cardWidth: 90,
        cardHeight: 126
    )
    .padding()
    .background(Color.bgPrimary)
}

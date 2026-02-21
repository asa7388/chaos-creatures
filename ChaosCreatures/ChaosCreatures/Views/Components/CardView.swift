// CardView.swift
// Chaos Creatures
// Reusable card rendering component for collection, deck builder, and shop.
// Now delegates to CardFrameView for professional frame-based rendering.
// Source: docs/design/07-ui-ux-specs.md Section 5.1

import SwiftUI

// MARK: - Card Grid Item (Collection Grid)

struct CardGridItemView: View {
    let card: CardInstance
    let faction: CardFaction?
    let showEvolutionBadge: Bool

    init(card: CardInstance, faction: CardFaction? = nil, showEvolutionBadge: Bool = true) {
        self.card = card
        self.faction = faction
        self.showEvolutionBadge = showEvolutionBadge
    }

    var body: some View {
        CardFrameView(
            data: CardDisplayData(
                instance: card,
                faction: faction
            ),
            size: .grid
        )
    }
}

// MARK: - Card List Row (Deck Builder)

struct CardListRowView: View {
    let card: CardInstance
    let quantity: Int
    let faction: CardFaction?

    init(card: CardInstance, quantity: Int, faction: CardFaction? = nil) {
        self.card = card
        self.quantity = quantity
        self.faction = faction
    }

    var body: some View {
        HStack(spacing: 12) {
            // Mini card frame
            CardFrameView(
                data: CardDisplayData(
                    instance: card,
                    faction: faction
                ),
                size: .hand
            )
            .frame(width: 48, height: 67)
            .scaleEffect(48.0 / 90.0) // Scale down hand-size to fit row
            .frame(width: 48, height: 67)

            // Card info
            VStack(alignment: .leading, spacing: 2) {
                Text(card.currentName)
                    .font(CardFont.cardName(size: 14))
                    .foregroundColor(.textPrimary)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(card.tier.displayName)
                        .font(CardFont.body(size: 11))
                        .foregroundColor(.textTertiary)

                    if card.cardType == .planarRuin, let hp = card.currentHealth {
                        Text("HP \(hp)")
                            .font(CardFont.stats(size: 11))
                            .foregroundColor(.textSecondary)
                    } else if let atk = card.currentAttack, let hp = card.currentHealth {
                        Text("\(atk)/\(hp)")
                            .font(CardFont.stats(size: 11))
                            .foregroundColor(.textSecondary)
                    }
                }
            }

            Spacer()

            // Quantity
            if quantity > 1 {
                Text("x\(quantity)")
                    .font(CardFont.stats(size: 14))
                    .foregroundColor(.textSecondary)
            }

            // CM cost
            ManaGemView(cost: card.currentManaCost)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Card Template View (for browsing templates)

struct CardTemplateView: View {
    let template: CardTemplate
    let faction: CardFaction?

    init(template: CardTemplate, faction: CardFaction? = nil) {
        self.template = template
        self.faction = faction
    }

    var body: some View {
        CardFrameView(
            data: CardDisplayData(
                template: template,
                faction: faction
            ),
            size: .grid
        )
    }
}

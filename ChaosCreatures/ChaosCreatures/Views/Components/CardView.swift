// CardView.swift
// Chaos Creatures
// Reusable card rendering component for collection, deck builder, and shop.
// Source: docs/design/07-ui-ux-specs.md Section 5.1

import SwiftUI

// MARK: - Card Grid Item (Collection Grid)

struct CardGridItemView: View {
    let card: CardInstance
    let showEvolutionBadge: Bool

    init(card: CardInstance, showEvolutionBadge: Bool = true) {
        self.card = card
        self.showEvolutionBadge = showEvolutionBadge
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Card art
            AsyncImage(url: URL(string: card.artUrl ?? "")) { phase in
                switch phase {
                case .empty:
                    cardPlaceholder
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(5.0 / 7.0, contentMode: .fill)
                case .failure:
                    cardPlaceholder
                @unknown default:
                    cardPlaceholder
                }
            }
            .aspectRatio(5.0 / 7.0, contentMode: .fit)
            .cornerRadius(8)

            // Tier border
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.tierColor(card.currentTier), lineWidth: 2)

            // Tier badge
            Text(card.currentTier.displayName)
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(.white)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.tierColor(card.currentTier))
                .cornerRadius(4)
                .padding(4)

            // Evolution ready badge
            if showEvolutionBadge && card.isEvolutionReady {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 16))
                            .foregroundColor(.tauntGold)
                            .padding(4)
                    }
                }
            }

            // Mana cost
            VStack {
                HStack {
                    ManaGemView(cost: card.manaCost)
                        .padding(4)
                    Spacer()
                }
                Spacer()
            }
        }
    }

    private var cardPlaceholder: some View {
        Rectangle()
            .fill(Color.bgTertiary)
            .aspectRatio(5.0 / 7.0, contentMode: .fit)
            .overlay(
                Image(systemName: "photo")
                    .font(.system(size: 24))
                    .foregroundColor(.textDisabled)
            )
    }
}

// MARK: - Card List Row (Deck Builder)

struct CardListRowView: View {
    let card: CardInstance
    let quantity: Int

    var body: some View {
        HStack(spacing: 12) {
            // Mini art
            AsyncImage(url: URL(string: card.artUrl ?? "")) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(1, contentMode: .fill)
                        .frame(width: 44, height: 44)
                        .cornerRadius(6)
                default:
                    Rectangle()
                        .fill(Color.bgTertiary)
                        .frame(width: 44, height: 44)
                        .cornerRadius(6)
                }
            }

            // Card info
            VStack(alignment: .leading, spacing: 2) {
                Text(card.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.textPrimary)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(card.cardType.displayName)
                        .font(.system(size: 11))
                        .foregroundColor(.textTertiary)

                    if card.cardType == .creature {
                        Text("\(card.attack ?? 0)/\(card.health ?? 0)")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.textSecondary)
                    }
                }
            }

            Spacer()

            // Quantity
            if quantity > 1 {
                Text("x\(quantity)")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.textSecondary)
            }

            // Mana cost
            ManaGemView(cost: card.manaCost)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Card Template View (for browsing templates)

struct CardTemplateView: View {
    let template: CardTemplate

    var body: some View {
        ZStack(alignment: .topTrailing) {
            AsyncImage(url: URL(string: template.artUrl ?? "")) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(5.0 / 7.0, contentMode: .fill)
                case .failure, .empty:
                    Rectangle()
                        .fill(Color.bgTertiary)
                        .aspectRatio(5.0 / 7.0, contentMode: .fit)
                        .overlay(
                            VStack(spacing: 4) {
                                Image(systemName: "photo")
                                    .font(.system(size: 20))
                                    .foregroundColor(.textDisabled)
                                Text(template.name)
                                    .font(.system(size: 10))
                                    .foregroundColor(.textTertiary)
                            }
                        )
                @unknown default:
                    EmptyView()
                }
            }
            .aspectRatio(5.0 / 7.0, contentMode: .fit)
            .cornerRadius(8)

            // Mana cost
            VStack {
                HStack {
                    ManaGemView(cost: template.manaCost)
                        .padding(4)
                    Spacer()
                }
                Spacer()
            }
        }
    }
}

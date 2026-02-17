// CardDetailView.swift
// Chaos Creatures
// Full card detail with stats, keywords, evolution history, and evolve button.
// Source: docs/design/07-ui-ux-specs.md Section 5.2

import SwiftUI

struct CardDetailView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss

    // In a real implementation, the card would be passed in or fetched
    // For now, we use the router's selectedCardInstance

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Card art
                    cardArtSection

                    // Card info
                    cardInfoSection

                    // Stats (creatures only)
                    if let card = router.selectedCardInstance, card.currentAttack != nil {
                        statsSection(card: card)
                    }

                    // Keywords
                    if let card = router.selectedCardInstance, !card.effectiveKeywords.isEmpty {
                        keywordsSection(card: card)
                    }

                    // Evolution progress
                    if let card = router.selectedCardInstance {
                        evolutionSection(card: card)
                    }

                    // Evolution history
                    if let card = router.selectedCardInstance, !card.evolutionHistory.isEmpty {
                        evolutionHistorySection(card: card)
                    }
                }
                .padding(16)
                .padding(.bottom, 80)
            }
            .background(Color.bgPrimary)
            .navigationTitle(router.selectedCardInstance?.currentName ?? "Card Detail")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    // MARK: - Card Art

    private var cardArtSection: some View {
        Group {
            if let artUrl = router.selectedCardInstance?.artUrl, let url = URL(string: artUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(5.0 / 7.0, contentMode: .fit)
                            .cornerRadius(12)
                    default:
                        artPlaceholder
                    }
                }
            } else {
                artPlaceholder
            }
        }
        .frame(maxWidth: 280)
        .frame(maxWidth: .infinity)
    }

    private var artPlaceholder: some View {
        Rectangle()
            .fill(Color.bgTertiary)
            .aspectRatio(5.0 / 7.0, contentMode: .fit)
            .cornerRadius(12)
            .overlay(
                Image(systemName: "photo")
                    .font(.system(size: 40))
                    .foregroundColor(.textDisabled)
            )
    }

    // MARK: - Card Info

    private var cardInfoSection: some View {
        VStack(spacing: 8) {
            if let card = router.selectedCardInstance {
                // Name + mana cost
                HStack {
                    Text(card.currentName)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.textPrimary)
                    Spacer()
                    LargeManaGemView(cost: card.currentManaCost)
                }

                // Tier info
                HStack {
                    Text(card.tier.displayName)
                        .font(.system(size: 14))
                        .foregroundColor(.textSecondary)

                    Spacer()

                    // Tier badge
                    Text(card.tier.displayName)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.tierColor(card.tier))
                        .cornerRadius(6)
                }

                // Flavor text
                if !card.flavorText.isEmpty {
                    Text(card.flavorText)
                        .font(.system(size: 13).italic())
                        .foregroundColor(.textTertiary)
                        .padding(.top, 4)
                }
            }
        }
        .padding(16)
        .cardBackground()
    }

    // MARK: - Stats

    private func statsSection(card: CardInstance) -> some View {
        HStack(spacing: 20) {
            statBox(title: "ATK", value: "\(card.currentAttack ?? 0)", color: .chaosRed)
            statBox(title: "HP", value: "\(card.currentHealth ?? 0)", color: .healGreen)
            statBox(title: "INST", value: "\(card.instabilityValue)", color: .warningYellow)
        }
        .padding(16)
        .cardBackground()
    }

    private func statBox(title: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(color)
            Text(value)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.textPrimary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Keywords

    private func keywordsSection(card: CardInstance) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Keywords")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.textPrimary)

            KeywordRowView(keywords: card.effectiveKeywords)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .cardBackground()
    }

    // MARK: - Evolution

    private func evolutionSection(card: CardInstance) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Evolution")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.textPrimary)

            // Energy progress
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Chaos Energy")
                        .font(.system(size: 13))
                        .foregroundColor(.textSecondary)
                    Spacer()
                    Text("\(card.chaosEnergy)/\(card.nextEnergyThreshold ?? 0)")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.textPrimary)
                }

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.bgQuaternary)
                            .cornerRadius(4)

                        Rectangle()
                            .fill(Color.ironwright)
                            .frame(width: geometry.size.width * CGFloat(card.evolutionProgress))
                            .cornerRadius(4)
                    }
                }
                .frame(height: 8)
            }

            // Evolve button
            if card.isEvolutionReady {
                Button(action: {
                    router.navigateToEvolution(card)
                }) {
                    HStack {
                        Image(systemName: "arrow.up.circle.fill")
                        Text("Evolve Now")
                    }
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Color.tauntGold)
                    .cornerRadius(10)
                }
            }
        }
        .padding(16)
        .cardBackground()
    }

    // MARK: - Evolution History

    private func evolutionHistorySection(card: CardInstance) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Evolution History")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.textPrimary)

            ForEach(card.evolutionHistory) { record in
                HStack(spacing: 8) {
                    Circle()
                        .fill(Color.tierColor(record.toTier))
                        .frame(width: 8, height: 8)

                    Text("\(record.fromTier.displayName) -> \(record.toTier.displayName)")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.textPrimary)

                    Spacer()

                    Text(record.nameChosen)
                        .font(.system(size: 11))
                        .foregroundColor(.textTertiary)
                }
                .padding(8)
                .background(Color.bgTertiary)
                .cornerRadius(6)
            }
        }
        .padding(16)
        .cardBackground()
    }
}

#Preview {
    CardDetailView()
        .environment(AppState())
        .environment(AppRouter())
}

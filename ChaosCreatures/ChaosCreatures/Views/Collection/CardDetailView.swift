// CardDetailView.swift
// Chaos Creatures
// Full card detail with stats, keywords, evolution history, and evolve button.
// Now uses CardFrameView for professional card rendering with frames and themed fonts.
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
            ZStack(alignment: .bottom) {
                ScrollView {
                    VStack(spacing: 20) {
                        // Card rendered with professional frame
                        cardFrameSection

                        // Card info (name, tier, flavor text — shown outside the frame for detail)
                        cardInfoSection

                        // Stats (creatures only)
                        if let card = router.selectedCardInstance, card.currentAttack != nil {
                            statsSection(card: card)
                        }

                        // Keywords
                        if let card = router.selectedCardInstance, !card.effectiveKeywords.isEmpty {
                            keywordsSection(card: card)
                        }

                        // S-30: Triggered abilities
                        if let card = router.selectedCardInstance, !card.triggeredAbilities.isEmpty {
                            triggeredAbilitiesSection(card: card)
                        }

                        // S-30: Applied modifiers
                        if let card = router.selectedCardInstance, !card.modifiers.isEmpty {
                            modifiersSection(card: card)
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
                    .padding(.bottom, 100) // Space for action bar
                }

                // S-30: Sticky bottom action bar
                if let card = router.selectedCardInstance {
                    actionBar(card: card)
                }
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

    // MARK: - Card Frame Section

    private var cardFrameSection: some View {
        Group {
            if let card = router.selectedCardInstance {
                CardFrameView(
                    data: CardDisplayData(instance: card),
                    size: .detail
                )
                .frame(maxWidth: .infinity)
            } else {
                artPlaceholder
            }
        }
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
            .frame(maxWidth: 280)
            .frame(maxWidth: .infinity)
    }

    // MARK: - Card Info

    private var cardInfoSection: some View {
        VStack(spacing: 8) {
            if let card = router.selectedCardInstance {
                // Name + mana cost
                HStack {
                    Text(card.currentName)
                        .font(CardFont.cardName(size: 22))
                        .foregroundColor(.textPrimary)
                    Spacer()
                    LargeManaGemView(cost: card.currentManaCost)
                }

                // Tier info
                HStack {
                    Text(card.tier.displayName)
                        .font(CardFont.body(size: 14))
                        .foregroundColor(.textSecondary)

                    Spacer()

                    // Tier badge
                    Text(card.tier.displayName)
                        .font(CardFont.bodyBold(size: 12))
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.tierColor(card.tier))
                        .cornerRadius(6)
                }

                // Flavor text
                if !card.flavorText.isEmpty {
                    Text(card.flavorText)
                        .font(CardFont.flavorText(size: 13))
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
                .font(CardFont.bodyBold(size: 11))
                .foregroundColor(color)
            Text(value)
                .font(CardFont.stats(size: 24))
                .foregroundColor(.textPrimary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Keywords

    private func keywordsSection(card: CardInstance) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Keywords")
                .font(CardFont.bodyBold(size: 14))
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
                .font(CardFont.bodyBold(size: 14))
                .foregroundColor(.textPrimary)

            // Energy progress
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Chaos Energy")
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textSecondary)
                    Spacer()
                    Text("\(card.chaosEnergy)/\(card.nextEnergyThreshold ?? 0)")
                        .font(CardFont.bodyBold(size: 13))
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
                    .font(CardFont.bodyBold(size: 15))
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

    // MARK: - S-30: Triggered Abilities

    private func triggeredAbilitiesSection(card: CardInstance) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Triggered Abilities")
                .font(CardFont.bodyBold(size: 14))
                .foregroundColor(.textPrimary)

            ForEach(card.triggeredAbilities) { ability in
                HStack(spacing: 8) {
                    // Trigger type icon
                    Image(systemName: triggerIcon(ability.trigger))
                        .font(.system(size: 14))
                        .foregroundColor(triggerColor(ability.trigger))
                        .frame(width: 24, height: 24)
                        .background(triggerColor(ability.trigger).opacity(0.15))
                        .cornerRadius(6)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(ability.name)
                            .font(CardFont.bodyBold(size: 13))
                            .foregroundColor(.textPrimary)

                        Text(ability.description)
                            .font(CardFont.body(size: 12))
                            .foregroundColor(.textSecondary)
                            .lineLimit(3)
                    }
                }
                .padding(10)
                .background(Color.bgTertiary)
                .cornerRadius(8)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .cardBackground()
    }

    private func triggerIcon(_ trigger: TriggerType) -> String {
        switch trigger {
        case .onOrder: return "sun.max.fill"
        case .onChaos: return "flame.fill"
        case .onPlay: return "rectangle.portrait.arrowtriangle.2.outward"
        case .onDeath: return "xmark.circle.fill"
        case .onDamageTaken: return "bolt.heart.fill"
        case .onAttack: return "arrowshape.right.fill"
        case .onBlock: return "shield.fill"
        }
    }

    private func triggerColor(_ trigger: TriggerType) -> Color {
        switch trigger {
        case .onOrder: return .orderBlue
        case .onChaos: return .chaosRed
        case .onPlay: return .ironwright
        case .onDeath: return .textTertiary
        case .onDamageTaken: return .damageOrange
        case .onAttack: return .chaosRed
        case .onBlock: return .orderBlue
        }
    }

    // MARK: - S-30: Applied Modifiers

    private func modifiersSection(card: CardInstance) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Applied Modifiers")
                .font(CardFont.bodyBold(size: 14))
                .foregroundColor(.textPrimary)

            ForEach(card.modifiers) { modifier in
                HStack(spacing: 8) {
                    // Attunement icon
                    Image(systemName: modifier.attunement == .order ? "sun.max.fill" : "flame.fill")
                        .font(.system(size: 12))
                        .foregroundColor(modifier.attunement == .order ? .orderBlue : .chaosRed)
                        .frame(width: 22, height: 22)
                        .background(
                            (modifier.attunement == .order ? Color.orderBlue : Color.chaosRed).opacity(0.15)
                        )
                        .cornerRadius(6)

                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(modifier.name)
                                .font(CardFont.bodyBold(size: 13))
                                .foregroundColor(.textPrimary)

                            if let keyword = modifier.grantsKeyword {
                                Text(keyword.displayName)
                                    .font(CardFont.bodyBold(size: 10))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 1)
                                    .background(Color.ironwright)
                                    .cornerRadius(4)
                            }
                        }

                        HStack(spacing: 4) {
                            Text("Step \(modifier.evolutionStep)")
                                .font(CardFont.body(size: 11))
                                .foregroundColor(.textTertiary)

                            if modifier.instabilityAdjustment != 0 {
                                let sign = modifier.instabilityAdjustment > 0 ? "+" : ""
                                Text("Inst \(sign)\(modifier.instabilityAdjustment)")
                                    .font(CardFont.bodyBold(size: 11))
                                    .foregroundColor(modifier.instabilityAdjustment > 0 ? .chaosRed : .orderBlue)
                            }
                        }
                    }

                    Spacer()
                }
                .padding(10)
                .background(Color.bgTertiary)
                .cornerRadius(8)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .cardBackground()
    }

    // MARK: - S-30: Action Bar

    private func actionBar(card: CardInstance) -> some View {
        HStack(spacing: 12) {
            // Evolve button (if eligible)
            if card.isEvolutionReady {
                Button(action: {
                    dismiss()
                    router.navigateToEvolution(card)
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 16))
                        Text("Evolve")
                            .font(CardFont.bodyBold(size: 15))
                    }
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Color.tauntGold)
                    .cornerRadius(10)
                }
            }

            // Add to Deck button
            Button(action: {
                dismiss()
                appState.selectedTab = .decks
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "plus.rectangle.on.rectangle")
                        .font(.system(size: 14))
                    Text("Add to Deck")
                        .font(CardFont.bodyBold(size: 15))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(Color.orderBlue)
                .cornerRadius(10)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            Color.bgSecondary
                .shadow(color: .black.opacity(0.3), radius: 8, y: -4)
        )
    }

    // MARK: - Evolution History

    private func evolutionHistorySection(card: CardInstance) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Evolution History")
                .font(CardFont.bodyBold(size: 14))
                .foregroundColor(.textPrimary)

            ForEach(card.evolutionHistory) { record in
                HStack(spacing: 8) {
                    Circle()
                        .fill(Color.tierColor(record.toTier))
                        .frame(width: 8, height: 8)

                    Text("\(record.fromTier.displayName) -> \(record.toTier.displayName)")
                        .font(CardFont.bodyBold(size: 13))
                        .foregroundColor(.textPrimary)

                    Spacer()

                    Text(record.nameChosen)
                        .font(CardFont.body(size: 11))
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

// CardDetailView.swift
// Chaos Creatures
// Full card detail — redesigned to eliminate all duplicated information.
// The card frame already shows name, CM, ATK, HP, keywords, and flavor text.
// Below the card: stats ribbon, expandable keyword descriptions, modifiers,
// evolution progress, evolution history. Tap card for fullscreen viewer.
// Source: docs/design/07-ui-ux-specs.md Section 5.2

import SwiftUI

struct CardDetailView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss

    @State private var showFullscreen = false
    @State private var keywordsExpanded = true
    @State private var modifiersExpanded = false
    @State private var abilitiesExpanded = false
    @State private var evolutionExpanded = true
    @State private var historyExpanded = false
    @State private var shimmerOffset: CGFloat = -1.0

    var body: some View {
        ZStack(alignment: .topLeading) {
            // Background: subtle radial gradient from faction color
            backgroundGradient

            VStack(spacing: 0) {
                ScrollView {
                    VStack(spacing: 16) {
                        // Top spacing for close button area
                        Spacer().frame(height: 8)

                        // Card frame — tap for fullscreen
                        cardFrameSection

                        // Stats ribbon (ATK, HP, Instability) — creatures only
                        if let card = router.selectedCardInstance, card.currentAttack != nil {
                            statsRibbon(card: card)
                        }

                        // Expandable sections
                        if let card = router.selectedCardInstance {
                            // Keywords with full descriptions
                            if !card.effectiveKeywords.isEmpty {
                                keywordsSection(card: card)
                            }

                            // Triggered abilities
                            if !card.triggeredAbilities.isEmpty {
                                triggeredAbilitiesSection(card: card)
                            }

                            // Applied modifiers
                            if !card.modifiers.isEmpty {
                                modifiersSection(card: card)
                            }

                            // Evolution progress
                            evolutionSection(card: card)

                            // Evolution history
                            if !card.evolutionHistory.isEmpty {
                                evolutionHistorySection(card: card)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 100) // Space for action bar
                }

                // Sticky bottom action bar
                if let card = router.selectedCardInstance {
                    actionBar(card: card)
                }
            }

            // Close button overlay (top-left)
            closeButton
        }
        .fullScreenCover(isPresented: $showFullscreen) {
            if let card = router.selectedCardInstance {
                FullscreenCardView(card: card)
            }
        }
    }

    // MARK: - Background

    private var backgroundGradient: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            if let card = router.selectedCardInstance,
               let faction = factionForCard(card) {
                RadialGradient(
                    colors: [
                        Color.factionPrimary(faction).opacity(0.03),
                        Color.bgPrimary.opacity(0)
                    ],
                    center: .top,
                    startRadius: 0,
                    endRadius: 400
                )
                .ignoresSafeArea()
            }
        }
    }

    // MARK: - Close Button

    private var closeButton: some View {
        Button(action: { dismiss() }) {
            Image(systemName: "xmark")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white.opacity(0.9))
                .frame(width: 32, height: 32)
                .background(Color.black.opacity(0.6))
                .clipShape(Circle())
        }
        .padding(.leading, 16)
        .padding(.top, 12)
    }

    // MARK: - Card Frame Section

    private var cardFrameSection: some View {
        Group {
            if let card = router.selectedCardInstance {
                CardFrameView(
                    data: CardDisplayData(instance: card),
                    size: .detail
                )
                .frame(width: 320, height: 448) // 320pt wide, 5:7 ratio
                .shadow(color: .black.opacity(0.5), radius: 16, x: 0, y: 8)
                .onTapGesture {
                    showFullscreen = true
                }
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
            .cornerRadius(14)
            .overlay(
                Image(systemName: "photo")
                    .font(.system(size: 40))
                    .foregroundColor(.textDisabled)
            )
            .frame(maxWidth: 320)
            .frame(maxWidth: .infinity)
    }

    // MARK: - Stats Ribbon

    private func statsRibbon(card: CardInstance) -> some View {
        HStack(spacing: 0) {
            // Faction-colored left edge accent
            if let faction = factionForCard(card) {
                Rectangle()
                    .fill(Color.factionPrimary(faction))
                    .frame(width: 2)
            }

            HStack(spacing: 0) {
                // ATK stat
                statCell(
                    iconName: "swords",
                    value: card.currentAttack ?? 0,
                    color: .chaosRed,
                    label: "ATK"
                )

                Divider()
                    .background(Color.bgQuaternary)
                    .frame(height: 32)

                // HP stat
                statCell(
                    iconName: "heart.fill",
                    value: card.currentHealth ?? 0,
                    color: .healGreen,
                    label: "HP"
                )

                Divider()
                    .background(Color.bgQuaternary)
                    .frame(height: 32)

                // Instability stat
                statCell(
                    iconName: "waveform.path",
                    value: card.instabilityValue,
                    color: .warningYellow,
                    label: "INST"
                )
            }
            .frame(maxWidth: .infinity)
        }
        .frame(height: 56)
        .background(Color.bgSecondary)
        .cornerRadius(12)
    }

    private func statCell(iconName: String, value: Int, color: Color, label: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: iconName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(color)
                .frame(width: 24, height: 24)
                .background(color.opacity(0.15))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 0) {
                Text("\(value)")
                    .font(CardFont.stats(size: 24))
                    .foregroundColor(.textPrimary)
                Text(label)
                    .font(CardFont.body(size: 10))
                    .foregroundColor(.textTertiary)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Keywords Section (Expandable)

    private func keywordsSection(card: CardInstance) -> some View {
        DisclosureGroup(
            isExpanded: $keywordsExpanded,
            content: {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(card.effectiveKeywords) { keyword in
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: keyword.sfSymbolName)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(keywordColor(keyword))
                                .frame(width: 28, height: 28)
                                .background(keywordColor(keyword).opacity(0.15))
                                .cornerRadius(7)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(keyword.displayName)
                                    .font(CardFont.bodyBold(size: 14))
                                    .foregroundColor(.textPrimary)

                                Text(keyword.description)
                                    .font(CardFont.body(size: 12))
                                    .foregroundColor(.textSecondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                .padding(.top, 8)
            },
            label: {
                HStack(spacing: 6) {
                    Image(systemName: "sparkle")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.textTertiary)
                    Text("Keywords")
                        .font(CardFont.bodyBold(size: 14))
                        .foregroundColor(.textPrimary)
                    Spacer()
                    Text("\(card.effectiveKeywords.count)")
                        .font(CardFont.body(size: 12))
                        .foregroundColor(.textTertiary)
                }
            }
        )
        .tint(.textTertiary)
        .padding(16)
        .leatherPanel()
    }

    // MARK: - Triggered Abilities Section (Expandable)

    private func triggeredAbilitiesSection(card: CardInstance) -> some View {
        DisclosureGroup(
            isExpanded: $abilitiesExpanded,
            content: {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(card.triggeredAbilities) { ability in
                        HStack(spacing: 8) {
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
                .padding(.top, 8)
            },
            label: {
                HStack(spacing: 6) {
                    Image(systemName: "bolt.circle")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.textTertiary)
                    Text("Triggered Abilities")
                        .font(CardFont.bodyBold(size: 14))
                        .foregroundColor(.textPrimary)
                    Spacer()
                    Text("\(card.triggeredAbilities.count)")
                        .font(CardFont.body(size: 12))
                        .foregroundColor(.textTertiary)
                }
            }
        )
        .tint(.textTertiary)
        .padding(16)
        .leatherPanel()
    }

    // MARK: - Applied Modifiers Section (Expandable, default collapsed)

    private func modifiersSection(card: CardInstance) -> some View {
        DisclosureGroup(
            isExpanded: $modifiersExpanded,
            content: {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(card.modifiers) { modifier in
                        HStack(spacing: 8) {
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
                .padding(.top, 8)
            },
            label: {
                HStack(spacing: 6) {
                    Image(systemName: "gearshape.2")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.textTertiary)
                    Text("Applied Modifiers")
                        .font(CardFont.bodyBold(size: 14))
                        .foregroundColor(.textPrimary)
                    Spacer()
                    Text("\(card.modifiers.count)")
                        .font(CardFont.body(size: 12))
                        .foregroundColor(.textTertiary)
                }
            }
        )
        .tint(.textTertiary)
        .padding(16)
        .leatherPanel()
    }

    // MARK: - Evolution Section (Expandable)

    private func evolutionSection(card: CardInstance) -> some View {
        let isReady = card.isEvolutionReady

        return DisclosureGroup(
            isExpanded: .init(
                get: { isReady ? true : evolutionExpanded },
                set: { evolutionExpanded = $0 }
            ),
            content: {
                VStack(alignment: .leading, spacing: 12) {
                    // Tier info
                    HStack {
                        Text(card.tier.displayName)
                            .font(CardFont.body(size: 13))
                            .foregroundColor(.textSecondary)

                        Spacer()

                        if let nextTier = card.tier.nextTier {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.right")
                                    .font(.system(size: 10))
                                    .foregroundColor(.textTertiary)
                                Text(nextTier.displayName)
                                    .font(CardFont.bodyBold(size: 13))
                                    .foregroundColor(Color.tierColor(nextTier))
                            }
                        } else {
                            Text("Max Tier")
                                .font(CardFont.bodyBold(size: 13))
                                .foregroundColor(.rarityLegendary)
                        }
                    }

                    // Energy progress bar
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

                        // Progress bar with rounded caps and glowing leading edge
                        GeometryReader { geometry in
                            let barWidth = geometry.size.width
                            let fillWidth = barWidth * CGFloat(card.evolutionProgress)

                            ZStack(alignment: .leading) {
                                // Background track
                                Capsule()
                                    .fill(Color.bgQuaternary)

                                // Fill bar with rounded caps
                                if fillWidth > 0 {
                                    Capsule()
                                        .fill(
                                            LinearGradient(
                                                colors: [
                                                    factionAccentColor(card).opacity(0.7),
                                                    factionAccentColor(card)
                                                ],
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                        .frame(width: max(fillWidth, 10))

                                    // Glowing leading edge
                                    if fillWidth > 10 {
                                        Circle()
                                            .fill(Color.white.opacity(0.7))
                                            .frame(width: 6, height: 6)
                                            .shadow(color: factionAccentColor(card), radius: 4)
                                            .offset(x: fillWidth - 6)
                                    }
                                }

                                // Shimmer overlay (only when evolution is ready)
                                if isReady {
                                    Capsule()
                                        .fill(
                                            LinearGradient(
                                                stops: [
                                                    .init(color: .clear, location: 0.0),
                                                    .init(color: .white.opacity(0.3), location: 0.5),
                                                    .init(color: .clear, location: 1.0)
                                                ],
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                        .frame(width: barWidth * 0.3)
                                        .offset(x: shimmerOffset * barWidth)
                                        .mask(
                                            Capsule()
                                                .frame(width: max(fillWidth, 10))
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                        )
                                        .onAppear {
                                            withAnimation(
                                                .linear(duration: 2.0)
                                                .repeatForever(autoreverses: false)
                                            ) {
                                                shimmerOffset = 1.3
                                            }
                                        }
                                }
                            }
                        }
                        .frame(height: 10)
                    }

                    // Evolve button (inside section, only if ready)
                    if isReady {
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
                            .background(
                                LinearGradient(
                                    colors: [Color.tauntGold, Color(hex: "#FFB300")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
                            )
                            .cornerRadius(10)
                        }
                    }
                }
                .padding(.top, 8)
            },
            label: {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.up.circle")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(isReady ? .tauntGold : .textTertiary)
                    Text("Evolution")
                        .font(CardFont.bodyBold(size: 14))
                        .foregroundColor(.textPrimary)
                    Spacer()
                    if isReady {
                        Text("READY")
                            .font(CardFont.bodyBold(size: 10))
                            .foregroundColor(.tauntGold)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.tauntGold.opacity(0.15))
                            .cornerRadius(4)
                    }
                }
            }
        )
        .tint(.textTertiary)
        .padding(16)
        .leatherPanel()
    }

    // MARK: - Evolution History (Expandable, default collapsed)

    private func evolutionHistorySection(card: CardInstance) -> some View {
        DisclosureGroup(
            isExpanded: $historyExpanded,
            content: {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(Array(card.evolutionHistory.enumerated()), id: \.element.id) { index, record in
                        HStack(spacing: 10) {
                            // Timeline indicator
                            VStack(spacing: 0) {
                                Circle()
                                    .fill(Color.tierColor(record.toTier))
                                    .frame(width: 10, height: 10)

                                if index < card.evolutionHistory.count - 1 {
                                    Rectangle()
                                        .fill(Color.bgQuaternary)
                                        .frame(width: 1)
                                        .frame(maxHeight: .infinity)
                                }
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                HStack {
                                    Text("\(record.fromTier.displayName) \u{2192} \(record.toTier.displayName)")
                                        .font(CardFont.bodyBold(size: 13))
                                        .foregroundColor(.textPrimary)

                                    Spacer()
                                }

                                Text(record.nameChosen)
                                    .font(CardFont.flavorText(size: 12))
                                    .foregroundColor(.textTertiary)
                            }
                            .padding(.vertical, 8)
                        }
                    }
                }
                .padding(.top, 8)
            },
            label: {
                HStack(spacing: 6) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.textTertiary)
                    Text("Evolution History")
                        .font(CardFont.bodyBold(size: 14))
                        .foregroundColor(.textPrimary)
                    Spacer()
                    Text("\(card.evolutionHistory.count)")
                        .font(CardFont.body(size: 12))
                        .foregroundColor(.textTertiary)
                }
            }
        )
        .tint(.textTertiary)
        .padding(16)
        .leatherPanel()
    }

    // MARK: - Action Bar

    private func actionBar(card: CardInstance) -> some View {
        let factionColor = factionAccentColor(card)

        return HStack(spacing: 12) {
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
                    .background(
                        LinearGradient(
                            colors: [Color.tauntGold, Color(hex: "#FFB300")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.white.opacity(0.15), lineWidth: 1)
                    )
                    .cornerRadius(10)
                }
            }

            // Add to Deck button — faction-colored
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
                .background(
                    LinearGradient(
                        colors: [factionColor, factionColor.opacity(0.8)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                )
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

    // MARK: - Helper Functions

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

    private func keywordColor(_ keyword: Keyword) -> Color {
        switch keyword {
        case .shield: return .orderBlue
        case .lifesteal: return .healGreen
        case .flying: return Color(hex: "#90CAF9")
        case .reach: return .damageOrange
        case .deathtouch: return .chaosRed
        case .taunt: return .tauntGold
        case .piercing: return .warningYellow
        case .haste: return .damageOrange
        case .ward: return Color(hex: "#B39DDB")
        }
    }

    /// Get the faction for theming (from appState template-faction map, or fallback).
    private func factionForCard(_ card: CardInstance) -> FactionShortName? {
        // Try to resolve faction from appState template map
        if let factionId = appState.devTemplateFactionMap[card.templateId] {
            // Match factionId to a FactionShortName via appState.factions
            if let faction = appState.factions.first(where: { $0.id == factionId }) {
                return faction.shortName
            }
        }
        return nil
    }

    /// Faction accent color, with a fallback to ironwright gold.
    private func factionAccentColor(_ card: CardInstance) -> Color {
        if let faction = factionForCard(card) {
            return Color.factionPrimary(faction)
        }
        return .ironwright
    }
}

#Preview {
    CardDetailView()
        .environment(AppState())
        .environment(AppRouter())
}

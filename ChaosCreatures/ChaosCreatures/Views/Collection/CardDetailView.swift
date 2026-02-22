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

    private let fixedCard: CardInstance?
    private let fixedFaction: CardFaction?

    @State private var showFullscreen = false
    @State private var modifiersExpanded = false
    @State private var abilitiesExpanded = false
    @State private var historyExpanded = false
    @State private var shimmerOffset: CGFloat = -1.0

    init(card: CardInstance? = nil, faction: CardFaction? = nil) {
        self.fixedCard = card
        self.fixedFaction = faction
    }

    private var displayCard: CardInstance? {
        fixedCard ?? router.selectedCardInstance
    }

    var body: some View {
        let card = displayCard

        ZStack(alignment: .topLeading) {
            // Background: subtle radial gradient from faction color
            backgroundGradient

            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    // Top spacing for close button area
                    Spacer().frame(height: 8)

                    // Card frame — tap for fullscreen
                    cardFrameSection(card: card)

                    // Stats ribbon (ATK, HP, Instability) — creatures only
                    if let card, card.currentAttack != nil {
                        statsRibbon(card: card)
                    }

                    // Expandable sections
                    if let card {
                        let hasKeywords = !card.effectiveKeywords.isEmpty
                        let hasAbilities = !card.triggeredAbilities.isEmpty
                        let hasModifiers = !card.modifiers.isEmpty

                        // Keywords with full descriptions
                        if hasKeywords {
                            keywordsSection(card: card)
                        }

                        // Triggered abilities
                        if hasAbilities {
                            triggeredAbilitiesSection(card: card)
                        }

                        // Applied modifiers
                        if hasModifiers {
                            modifiersSection(card: card)
                        }

                        // Always keep at least one explanatory panel in view.
                        if !hasKeywords && !hasAbilities && !hasModifiers {
                            cardNotesSection(card: card)
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
                .padding(.bottom, 24)
            }

            // Close button overlay (top-left)
            closeButton
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if let card {
                actionBar(card: card)
            }
        }
        .fullScreenCover(isPresented: $showFullscreen) {
            if let card {
                FullscreenCardView(card: card, faction: factionForCard(card))
            }
        }
    }

    // MARK: - Background

    private var backgroundGradient: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            if let card = displayCard,
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
            ThemedGlyph(symbol: "xmark", size: 14, weight: .bold, color: .textPrimary.opacity(0.9))
                .frame(width: 32, height: 32)
                .background(Color.black.opacity(0.6))
                .clipShape(Circle())
        }
        .padding(.leading, 16)
        .padding(.top, 12)
    }

    // MARK: - Card Frame Section

    private var detailCardWidth: CGFloat {
        let screenWidth = UIScreen.main.bounds.width
        if UIDevice.current.userInterfaceIdiom == .pad {
            return min(screenWidth * 0.55, 500)
        } else {
            return min(screenWidth * 0.85, 320)
        }
    }

    private func cardFrameSection(card: CardInstance?) -> some View {
        // Pass the pre-computed card width directly as the frame so that
        // CardFrameView's GeometryReader reports exactly that width.
        // CardFrameView.computedCardWidth returns geometry.size.width unchanged
        // for the .detail size, so no second multiplication occurs.
        let cardWidth = detailCardWidth
        let cardHeight = cardWidth * (294.0 / 210.0)

        return Group {
            if let card {
                CardFrameView(
                    data: CardDisplayData(instance: card, faction: factionForCard(card)),
                    size: .detail
                )
                .frame(width: cardWidth, height: cardHeight)
                .contactShadow(opacity: 0.6)
                .onTapGesture {
                    showFullscreen = true
                }
            } else {
                artPlaceholder
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var artPlaceholder: some View {
        Rectangle()
            .fill(Color.bgTertiary)
            .aspectRatio(5.0 / 7.0, contentMode: .fit)
            .cornerRadius(14)
            .overlay(
                ThemedGlyph(symbol: "photo", size: 40, color: .textDisabled)
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
                    iconName: "UIIcons/ui-trigger-attack",
                    value: card.currentAttack ?? 0,
                    color: .chaosRed,
                    label: "ATK"
                )

                Divider()
                    .background(Color.bgQuaternary)
                    .frame(height: 32)

                // HP stat
                statCell(
                    iconName: "KeywordIcons/kw-shield",
                    value: card.currentHealth ?? 0,
                    color: .healGreen,
                    label: "HP"
                )

                Divider()
                    .background(Color.bgQuaternary)
                    .frame(height: 32)

                // Instability stat
                statCell(
                    iconName: "UIIcons/ui-crystal-shard",
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

    // MARK: - Notes Section (fallback when no dynamic sections)

    private func cardNotesSection(card: CardInstance) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Card Notes")
                .font(CardFont.bodyBold(size: 14))
                .foregroundColor(.textPrimary)

            HStack(spacing: 8) {
                noteChip(title: "Type", value: card.cardType?.displayName ?? "Creature")
                noteChip(title: "Tier", value: card.tier.displayName)
                noteChip(title: "Decks", value: "\(card.inDeckIds.count)")
            }

            if !card.flavorText.isEmpty {
                Text(card.flavorText)
                    .font(CardFont.flavorText(size: 12))
                    .foregroundColor(.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Text("No active keywords or modifiers on this card yet.")
                    .font(CardFont.body(size: 12))
                    .foregroundColor(.textTertiary)
            }
        }
        .padding(16)
        .leatherPanel()
    }

    private func noteChip(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title.uppercased())
                .font(CardFont.uiLabel(size: 10))
                .foregroundColor(.textTertiary)
            Text(value)
                .font(CardFont.bodyBold(size: 12))
                .foregroundColor(.textPrimary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.bgTertiary)
        .cornerRadius(8)
    }

    private func statCell(iconName: String, value: Int, color: Color, label: String) -> some View {
        HStack(spacing: 8) {
            Image(iconName)
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 14, height: 14)
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

    // MARK: - Keywords Section

    private func keywordsSection(card: CardInstance) -> some View {
        let keywords = resolvedKeywords(from: card)

        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image("UIIcons/ui-evolution-sparkle")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 12, height: 12)
                    .foregroundColor(.textTertiary)
                Text("Keywords")
                    .font(CardFont.bodyBold(size: 14))
                    .foregroundColor(.textPrimary)
                Spacer()
                Text("\(keywords.count)")
                    .font(CardFont.body(size: 12))
                    .foregroundColor(.textTertiary)
            }

            if keywords.isEmpty {
                Text("No keyword abilities are active on this card.")
                    .font(CardFont.body(size: 12))
                    .foregroundColor(.textTertiary)
            } else {
                ForEach(keywords, id: \.rawValue) { keyword in
                    HStack(alignment: .top, spacing: 10) {
                        Group {
                            if UIImage(named: keyword.customIconName) != nil {
                                Image(keyword.customIconName)
                                    .renderingMode(.template)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .foregroundColor(keywordColor(keyword))
                            } else {
                                Image(systemName: "star.circle.fill")
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .foregroundColor(.accentColor)
                            }
                        }
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
                    .padding(.vertical, 2)
                }
            }
        }
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
                            ThemedGlyph(symbol: triggerIcon(ability.trigger), size: 14, color: triggerColor(ability.trigger))
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
                    Image("UIIcons/ui-trigger-attack")
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 12, height: 12)
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
                            Image(modifier.attunement == .order ? "UIIcons/ui-attune-order" : "UIIcons/ui-attune-chaos")
                                .renderingMode(.template)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 12, height: 12)
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
                                            .foregroundColor(.textPrimary)
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
                    ThemedGlyph(symbol: "gearshape.2", size: 12, weight: .semibold, color: .textTertiary)
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

    // MARK: - Evolution Section

    private func evolutionSection(card: CardInstance) -> some View {
        let isReady = card.isEvolutionReady

        return VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                ThemedGlyph(
                    symbol: "arrow.up.circle",
                    size: 12,
                    weight: .semibold,
                    color: isReady ? .tauntGold : .textTertiary
                )
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

            // Tier info
            HStack {
                Text(card.tier.displayName)
                    .font(CardFont.body(size: 13))
                    .foregroundColor(.textSecondary)

                Spacer()

                if let nextTier = card.tier.nextTier {
                    HStack(spacing: 4) {
                        ThemedGlyph(symbol: "arrow.right", size: 10, color: .textTertiary)
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
                    Text(energyProgressText(card))
                        .font(CardFont.bodyBold(size: 13))
                        .foregroundColor(.textPrimary)
                }

                GeometryReader { geometry in
                    let barWidth = geometry.size.width
                    let fillWidth = barWidth * CGFloat(card.evolutionProgress)

                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.bgQuaternary)

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

                            if fillWidth > 10 {
                                Circle()
                                    .fill(Color.textPrimary.opacity(0.7))
                                    .frame(width: 6, height: 6)
                                    .shadow(color: factionAccentColor(card), radius: 4)
                                    .offset(x: fillWidth - 6)
                            }
                        }

                        if isReady {
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        stops: [
                                            .init(color: .clear, location: 0.0),
                                            .init(color: Color.textPrimary.opacity(0.3), location: 0.5),
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

            if isReady {
                Button(action: {
                    router.navigateToEvolution(card, faction: factionForCard(card))
                }) {
                    HStack {
                        ThemedGlyph(symbol: "arrow.up.circle.fill", size: 16, color: .textDark)
                        Text("Evolve Now")
                    }
                    .font(CardFont.bodyBold(size: 15))
                    .foregroundColor(.textDark)
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
                            .stroke(Color.textPrimary.opacity(0.15), lineWidth: 1)
                    )
                    .cornerRadius(10)
                }
            }
        }
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
                    Image("UIIcons/ui-evolution-sparkle")
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 12, height: 12)
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
                    router.navigateToEvolution(card, faction: factionForCard(card))
                }) {
                    HStack(spacing: 6) {
                        ThemedGlyph(symbol: "arrow.up.circle.fill", size: 16, color: .textDark)
                        Text("Evolve")
                            .font(CardFont.bodyBold(size: 15))
                    }
                    .foregroundColor(.textDark)
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
                            .stroke(Color.textPrimary.opacity(0.15), lineWidth: 1)
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
                    ThemedGlyph(symbol: "plus.rectangle.on.rectangle", size: 14, color: .textPrimary)
                    Text("Add to Deck")
                        .font(CardFont.bodyBold(size: 15))
                }
                .foregroundColor(.textPrimary)
                .frame(maxWidth: .infinity, minHeight: 44)
            }
            .buttonStyle(CardstockButtonStyle())
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(factionColor.opacity(0.35), lineWidth: 1)
            )
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            ZStack {
                Color.bgSecondary
                Image("UIComponents/ui-panel-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .opacity(0.22)
            }
            .shadow(color: .black.opacity(0.3), radius: 8, y: -4)
        )
    }

    // MARK: - Helper Functions

    private func triggerIcon(_ trigger: TriggerType) -> String {
        switch trigger {
        case .onOrder: return "UIIcons/ui-trigger-order"
        case .onChaos: return "UIIcons/ui-trigger-chaos"
        case .onPlay: return "UIIcons/ui-trigger-play"
        case .onDeath: return "UIIcons/ui-trigger-death"
        case .onDamageTaken: return "UIIcons/ui-trigger-damage"
        case .onAttack: return "UIIcons/ui-trigger-attack"
        case .onBlock: return "KeywordIcons/kw-shield"
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
    private func factionForCard(_ card: CardInstance) -> CardFaction? {
        if let fixedFaction {
            return fixedFaction
        }
        if let selectedFaction = router.selectedCardFaction {
            return selectedFaction
        }
        if let factionId = appState.devTemplateFactionMap[card.templateId] {
            return appState.factions.first(where: { $0.id == factionId })?.shortName
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

    private func resolvedKeywords(from card: CardInstance) -> [Keyword] {
        let stringKeywords = card.innateKeywords + card.modifierKeywords
        if stringKeywords.isEmpty {
            // Seed-data path: string arrays are empty, fall back to the already-resolved
            // effectiveKeywords computed property (which is [Keyword]).
            var seen: Set<String> = []
            return card.effectiveKeywords.filter { seen.insert($0.rawValue).inserted }
        }

        // Normal path: parse the raw strings into Keyword values.
        var seen: Set<String> = []
        var resolved: [Keyword] = []
        for raw in stringKeywords {
            let normalized = raw.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
            guard !normalized.isEmpty, !seen.contains(normalized) else { continue }
            guard let keyword = Keyword(rawValue: normalized) else { continue }
            seen.insert(normalized)
            resolved.append(keyword)
        }
        return resolved
    }

    private func energyProgressText(_ card: CardInstance) -> String {
        guard let threshold = card.nextEnergyThreshold else {
            return "MAX"
        }
        return "\(card.chaosEnergy)/\(threshold)"
    }
}

#Preview {
    CardDetailView()
        .environment(AppState())
        .environment(AppRouter())
}

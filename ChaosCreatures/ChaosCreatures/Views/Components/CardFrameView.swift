// CardFrameView.swift
// Chaos Creatures
//
// Phase 2 rewrite — zone-stack layout per CARD_DESIGN_GUIDE.md Section 1.4.
// Replaces the full-art-bleed design with a structured zone stack:
//   Name Bar / Art Box / Type Line / Text Box / Stats Bar / Rarity Bar
//
// All tasks implemented:
//   2.1  Zone-stack VStack layout with GeometryReader sizing
//   2.2  Card type layout variants (creature / spell / stabilizer / planarRuin)
//   2.3  Chaos Mote symbol row in Name Bar
//   2.4  CardFont accessors + letterpress shadow on all text
//   2.5  Gesture priority stack (LongPress > Drag > Tap)
//   2.6  CardDisplayState transitions
//   2.8  Art box fallback (canvas-warm + quill + crosshatch)
//   2.9  GeometryReader relative sizing, no hardcoded CardDisplaySize values
//   2.11 Accessibility modifiers

import SwiftUI
import CoreMotion

// MARK: - CardDisplaySize (preserved for backward-compat with existing call sites)

enum CardDisplaySize {
    case grid
    case hand
    case detail
    case fullscreen

    var width: CGFloat {
        switch self {
        case .grid: return 112
        case .hand: return 90
        case .detail: return 280
        case .fullscreen: return 350
        }
    }

    var height: CGFloat {
        switch self {
        case .grid: return 157
        case .hand: return 130
        case .detail: return 392
        case .fullscreen: return 490
        }
    }

    var showKeywords: Bool {
        self == .detail || self == .fullscreen
    }

    var showFlavorText: Bool {
        self == .detail || self == .fullscreen
    }

    var showTypeLine: Bool {
        self == .detail || self == .fullscreen
    }

    var showCardName: Bool { true }
    var showStatBadges: Bool { true }
}

// MARK: - CardDisplayData (preserved for backward-compat with existing call sites)

struct CardDisplayData {
    let name: String
    let artUrl: String?
    let manaCost: Int
    let attack: Int?
    let health: Int?
    let instability: Int?
    let tier: Rarity
    let cardType: CardType
    let faction: CardFaction?
    let keywords: [Keyword]
    let flavorText: String
    let isEvolutionReady: Bool
    /// Planar Ruin passive benefit text.
    var ruinPassiveText: String?
    /// Planar Ruin destruction penalty text.
    var ruinDestructionPenaltyText: String?
    /// Ability text (rules text) for text box.
    var abilityText: String?
    /// Collector number string for stats bar.
    var collectorNumber: String?
    /// Set code string for stats bar.
    var setCode: String?

    // MARK: Memberwise init

    init(
        name: String,
        artUrl: String?,
        manaCost: Int,
        attack: Int? = nil,
        health: Int? = nil,
        instability: Int? = nil,
        tier: Rarity = .common,
        cardType: CardType = .creature,
        faction: CardFaction? = nil,
        keywords: [Keyword] = [],
        flavorText: String = "",
        isEvolutionReady: Bool = false,
        ruinPassiveText: String? = nil,
        ruinDestructionPenaltyText: String? = nil,
        abilityText: String? = nil,
        collectorNumber: String? = nil,
        setCode: String? = nil
    ) {
        self.name = name
        self.artUrl = artUrl
        self.manaCost = manaCost
        self.attack = attack
        self.health = health
        self.instability = instability
        self.tier = tier
        self.cardType = cardType
        self.faction = faction
        self.keywords = keywords
        self.flavorText = flavorText
        self.isEvolutionReady = isEvolutionReady
        self.ruinPassiveText = ruinPassiveText
        self.ruinDestructionPenaltyText = ruinDestructionPenaltyText
        self.abilityText = abilityText
        self.collectorNumber = collectorNumber
        self.setCode = setCode
    }

    /// Create from a CardInstance (collection/deck views).
    init(instance: CardInstance, faction: CardFaction? = nil) {
        self.name = instance.currentName
        self.artUrl = instance.artUrl
        self.manaCost = instance.currentManaCost
        self.attack = instance.currentAttack
        self.health = instance.currentHealth
        self.instability = instance.instabilityValue
        self.tier = instance.tier
        self.cardType = instance.cardType ?? (instance.currentAttack != nil ? .creature : .spell)
        self.faction = faction
        self.keywords = instance.effectiveKeywords
        self.flavorText = instance.flavorText
        self.isEvolutionReady = instance.isEvolutionReady
        self.ruinPassiveText = nil
        self.ruinDestructionPenaltyText = nil
        self.abilityText = nil
        self.collectorNumber = nil
        self.setCode = nil
    }

    /// Create from a CardTemplate (template browsing).
    init(template: CardTemplate, faction: CardFaction? = nil) {
        self.name = template.name
        self.artUrl = template.artUrl
        self.manaCost = template.manaCost
        self.attack = template.baseAttack
        self.health = template.baseHealth
        self.instability = template.baseInstability
        self.tier = .common
        self.cardType = template.cardType
        self.faction = faction
        self.keywords = template.keywords
        self.flavorText = template.flavorText
        self.isEvolutionReady = false
        self.ruinPassiveText = nil
        self.ruinDestructionPenaltyText = nil
        self.abilityText = nil
        self.collectorNumber = nil
        self.setCode = nil
    }

    /// Create from BattleCreatureData (battlefield).
    init(battleCreature: BattleCreatureData) {
        self.name = battleCreature.name
        self.artUrl = battleCreature.artUrl
        self.manaCost = battleCreature.manaCost
        self.attack = battleCreature.attack
        self.health = battleCreature.health
        self.instability = battleCreature.instabilityValue
        self.tier = .common
        self.cardType = battleCreature.cardType
        self.faction = battleCreature.factionShortName
        self.keywords = battleCreature.activeKeywords
        self.flavorText = ""
        self.isEvolutionReady = false
        self.ruinPassiveText = nil
        self.ruinDestructionPenaltyText = nil
        self.abilityText = nil
        self.collectorNumber = nil
        self.setCode = nil
    }

    /// Create from BattleCardData (hand card).
    init(battleCard: BattleCardData) {
        self.name = battleCard.name
        self.artUrl = battleCard.artUrl
        self.manaCost = battleCard.manaCost
        self.attack = battleCard.baseAttack
        self.health = battleCard.baseHealth
        self.instability = nil
        self.tier = .common
        self.cardType = battleCard.cardType
        self.faction = battleCard.factionShortName
        self.keywords = battleCard.innateKeywords
        self.flavorText = ""
        self.isEvolutionReady = false
        self.ruinPassiveText = nil
        self.ruinDestructionPenaltyText = nil
        self.abilityText = nil
        self.collectorNumber = nil
        self.setCode = nil
    }

    // MARK: Computed Properties

    var typeLine: String {
        let typeText = cardType.displayName
        if let faction = faction {
            return "\(typeText) \u{2014} \(faction.shortDisplayName)"
        }
        return typeText
    }

    var factionEmblemAssetName: String? {
        switch faction {
        case .ironwright: return "FactionEmblems/ironwright-emblem"
        case .fey:        return "FactionEmblems/fey-emblem"
        case .demonic:    return "FactionEmblems/demonic-emblem"
        case .celestial:  return "FactionEmblems/celestial-emblem"
        case .endless:    return "FactionEmblems/endless-emblem"
        case nil: return nil
        }
    }

    var showsCreatureStats: Bool {
        cardType == .creature || cardType == .planarRuin
    }

    /// VoiceOver label for accessibility.
    var voiceOverLabel: String {
        var parts = [String]()
        parts.append(name)
        parts.append("Cost: \(manaCost)")
        parts.append(cardType.displayName.capitalized)
        if let atk = attack { parts.append("Attack: \(atk)") }
        if let hp = health { parts.append("HP: \(hp)") }
        if let inst = instability { parts.append("Instability: \(inst)") }
        if let ability = abilityText { parts.append(ability) }
        if !flavorText.isEmpty { parts.append(flavorText) }
        return parts.joined(separator: ". ")
    }
}

// MARK: - Zone Height Constants

/// Zone height constants derived from CARD_DESIGN_GUIDE.md Section 1.4.
/// All values expressed as fractions of the 294pt reference card height.
private enum ZoneHeight {
    static let nameBars: CGFloat = 0.085   // 25pt / 294pt ≈ 8.5%
    static let artBox: CGFloat  = 0.449    // 132pt / 294pt ≈ 45%
    static let typeLine: CGFloat = 0.061   // 18pt / 294pt ≈ 6%
    static let textBox: CGFloat  = 0.299   // 88pt / 294pt ≈ 30%
    static let textBoxExpanded: CGFloat = 0.364  // 107pt / 294pt (spell/stabilizer)
    static let statsBar: CGFloat = 0.051   // 15pt / 294pt ≈ 5%
    static let rarityBar: CGFloat = 0.014  // 4pt / 294pt ≈ 1.5%
}

// MARK: - Letterpress Shadow ViewModifier

private struct LetterpressShadow: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme
    private var shadowColor: Color {
        colorScheme == .dark ? Color("parchment-dark-mode").opacity(0.6) : Color("parchment-dark").opacity(0.6)
    }
    func body(content: Content) -> some View {
        content
            .shadow(
                color: shadowColor,
                radius: 0.5, x: 0, y: 0.5
            )
    }
}

private extension View {
    func letterpressShadow() -> some View {
        modifier(LetterpressShadow())
    }
}

// MARK: - CardFrameView

struct CardFrameView: View {
    let data: CardDisplayData
    let size: CardDisplaySize

    @State private var cardState: CardDisplayState = .default
    @State private var isFlipped: Bool = false
    @State private var rotationY: Double = 0
    @State private var showBack: Bool = false
    @State private var dragOffset: CGSize = .zero
    @State private var shakeOffset: CGFloat = 0
    @State private var activeTooltipKeyword: Keyword? = nil
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.colorScheme) private var colorScheme

    private var theme: CardTheme { CardTheme(colorScheme: colorScheme) }

    var body: some View {
        GeometryReader { geometry in
            let cardWidth = computedCardWidth(geometry: geometry)
            let cardHeight = cardWidth * (294.0 / 210.0)
            cardContent(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(width: cardWidth, height: cardHeight)
                .position(x: geometry.size.width / 2, y: geometry.size.height / 2)
        }
        .aspectRatio(210.0 / 294.0, contentMode: .fit)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(data.voiceOverLabel)
        .accessibilityHint("Double-tap to select. Long-press to preview.")
        .accessibilityAddTraits(.isButton)
        .accessibilityIdentifier("CardView")
        .accessibilityAction(named: "Preview card") { cardState = .previewed }
        .accessibilityAction(named: "Show card details") { /* navigate to detail — handled externally */ }
    }

    private func computedCardWidth(geometry: GeometryProxy) -> CGFloat {
        let isCompact = horizontalSizeClass == .compact
        let rawWidth: CGFloat
        if isCompact {
            rawWidth = min(geometry.size.width * 0.85, 260)
        } else {
            rawWidth = min(geometry.size.width * 0.40, 350)
        }
        return max(rawWidth, 160)
    }

    // MARK: - Card Content (with gesture + state transforms)

    @ViewBuilder
    private func cardContent(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let stateTransform = cardStateTransform

        ZStack {
            if showBack {
                CardBackView(cardWidth: cardWidth, cardHeight: cardHeight)
            } else {
                cardFace(cardWidth: cardWidth, cardHeight: cardHeight)
            }
        }
        .scaleEffect(stateTransform.scale)
        .opacity(stateTransform.opacity)
        .saturation(stateTransform.saturation)
        .brightness(stateTransform.brightness)
        .shadow(color: .black.opacity(0.5), radius: stateTransform.shadowRadius, x: 0, y: stateTransform.shadowY)
        .offset(x: shakeOffset, y: stateTransform.yOffset)
        .rotation3DEffect(.degrees(rotationY), axis: (x: 0, y: 1, z: 0))
        // Gesture priority stack per Section 1.7
        .highPriorityGesture(
            LongPressGesture(minimumDuration: 0.35)
                .onEnded { _ in
                    withAnimation(.easeOut(duration: 0.28)) {
                        cardState = .previewed
                    }
                }
        )
        .gesture(
            DragGesture(minimumDistance: 8)
                .onChanged { value in
                    dragOffset = value.translation
                }
                .onEnded { _ in
                    dragOffset = .zero
                    if cardState == .previewed {
                        withAnimation(.easeIn(duration: 0.22)) {
                            cardState = .default
                        }
                    }
                }
        )
        .simultaneousGesture(
            TapGesture()
                .onEnded {
                    handleTap()
                }
        )
    }

    // MARK: - State Transitions (Task 2.6)

    private struct StateTransform {
        var scale: CGFloat = 1.0
        var opacity: Double = 1.0
        var saturation: Double = 1.0
        var brightness: Double = 0.0
        var shadowRadius: CGFloat = 4
        var shadowY: CGFloat = 2
        var yOffset: CGFloat = 0
    }

    private var cardStateTransform: StateTransform {
        var t = StateTransform()
        switch cardState {
        case .default:
            t.scale = 1.0
            t.shadowRadius = 4
        case .focused:
            t.scale = 1.02
            t.shadowRadius = 12
            t.yOffset = -2
        case .selected:
            t.scale = 0.97
            t.shadowRadius = 6
        case .tapped:
            t.scale = 1.0
            t.shadowRadius = 4
        case .previewed:
            t.scale = 1.12
            t.shadowRadius = 20
        case .inGraveyard:
            t.opacity = 0.3
            t.saturation = 0.0
            t.brightness = -0.15
            t.yOffset = 20
        case .summoning(let progress):
            t.scale = 0.6 + CGFloat(progress) * 0.4
            t.opacity = Double(progress)
        case .foilActive:
            t.scale = 1.0
            t.shadowRadius = 6
        case .damaged(let severity):
            t.shadowRadius = 4 + CGFloat(severity) * 8
        }
        return t
    }

    private func handleTap() {
        if cardState == .previewed {
            withAnimation(.easeIn(duration: 0.22)) {
                cardState = .default
            }
            return
        }
        // Two-phase flip for .tapped state
        withAnimation(.easeIn(duration: 0.17)) {
            rotationY = 90
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.17) {
            showBack.toggle()
            rotationY = -90
            withAnimation(.easeOut(duration: 0.18)) {
                rotationY = 0
            }
        }
        withAnimation(.easeIn(duration: 0.12)) {
            cardState = .selected
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.65)) {
                cardState = .default
            }
        }
    }

    /// Applies shake animation for the damaged state.
    private func applyShake(severity: Float) {
        let distance = CGFloat(severity) * 8
        withAnimation(.spring(response: 0.1, dampingFraction: 0.2)) {
            shakeOffset = distance
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.spring(response: 0.1, dampingFraction: 0.2)) {
                shakeOffset = -distance * 0.6
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            withAnimation(.spring(response: 0.15, dampingFraction: 0.4)) {
                shakeOffset = 0
            }
        }
    }

    // MARK: - Card Face

    @ViewBuilder
    private func cardFace(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        cardBody(cardWidth: cardWidth, cardHeight: cardHeight)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(rarityBorderGradient, lineWidth: data.tier.borderWidth)
            )
            .shadow(color: rarityGlowColor.opacity(Double(data.tier.glowIntensity) * 0.6),
                    radius: CGFloat(data.tier.glowIntensity) * 8)
            .shadow(color: .black.opacity(0.45), radius: 3, x: 0, y: 2)
    }

    // MARK: - 2.2 Card Type Layout Variants

    @ViewBuilder
    private func cardBody(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        switch data.cardType {
        case .creature:
            creatureLayout(cardWidth: cardWidth, cardHeight: cardHeight)
        case .spell:
            spellLayout(cardWidth: cardWidth, cardHeight: cardHeight)
        case .stabilizer:
            stabilizerLayout(cardWidth: cardWidth, cardHeight: cardHeight)
        case .planarRuin:
            planarRuinLayout(cardWidth: cardWidth, cardHeight: cardHeight)
        }
    }

    // MARK: - Creature Layout (standard — all zones present)

    private func creatureLayout(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let waxSealSize: CGFloat = 34
        return VStack(spacing: 0) {
            nameBar(cardWidth: cardWidth, cardHeight: cardHeight, showCost: true)
                .frame(height: cardHeight * ZoneHeight.nameBars)

            artBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.artBox)
                .frame(height: cardHeight * ZoneHeight.artBox)

            typeLine(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.typeLine)

            textBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.textBox)
                .frame(height: cardHeight * ZoneHeight.textBox)

            statsBar(cardWidth: cardWidth, cardHeight: cardHeight, showAtk: true)
                .frame(height: cardHeight * ZoneHeight.statsBar)

            rarityColorBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.rarityBar)
        }
        .background(cardBaseColor)
        .overlay(alignment: .topLeading) {
            waxSeal
                .frame(width: waxSealSize, height: waxSealSize)
                .offset(
                    x: (164.0 / 210.0) * cardWidth - waxSealSize / 2,
                    y: (258.0 / 294.0) * cardHeight - waxSealSize / 2
                )
                .allowsHitTesting(false)
        }
    }

    // MARK: - Spell Layout (no stats bar, expanded text box, no wax seal, no instability)

    private func spellLayout(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        VStack(spacing: 0) {
            nameBar(cardWidth: cardWidth, cardHeight: cardHeight, showCost: true)
                .frame(height: cardHeight * ZoneHeight.nameBars)

            artBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.artBox)
                .frame(height: cardHeight * ZoneHeight.artBox)

            typeLine(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.typeLine)

            textBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.textBoxExpanded)
                .frame(height: cardHeight * ZoneHeight.textBoxExpanded)

            rarityColorBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.rarityBar)
        }
        .background(cardBaseColor)
    }

    // MARK: - Stabilizer Layout (no cost, no stats, lock icon in art box)

    private func stabilizerLayout(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        VStack(spacing: 0) {
            nameBar(cardWidth: cardWidth, cardHeight: cardHeight, showCost: false)
                .frame(height: cardHeight * ZoneHeight.nameBars)

            artBoxWithLockIcon(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.artBox)
                .frame(height: cardHeight * ZoneHeight.artBox)

            typeLine(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.typeLine)

            textBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.textBoxExpanded)
                .frame(height: cardHeight * ZoneHeight.textBoxExpanded)

            rarityColorBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.rarityBar)
        }
        .background(cardBaseColor)
    }

    // MARK: - Planar Ruin Layout (HP only, passive + destruction panels)

    private func planarRuinLayout(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let waxSealSize: CGFloat = 34
        return VStack(spacing: 0) {
            ruinNameBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.nameBars)

            artBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.artBox)
                .frame(height: cardHeight * ZoneHeight.artBox)

            typeLine(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.typeLine)

            ruinTextBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.textBox)
                .frame(height: cardHeight * ZoneHeight.textBox)

            statsBar(cardWidth: cardWidth, cardHeight: cardHeight, showAtk: false)
                .frame(height: cardHeight * ZoneHeight.statsBar)

            rarityColorBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.rarityBar)
        }
        .background(cardBaseColor)
        .overlay(alignment: .topLeading) {
            waxSeal
                .frame(width: waxSealSize, height: waxSealSize)
                .offset(
                    x: (164.0 / 210.0) * cardWidth - waxSealSize / 2,
                    y: (258.0 / 294.0) * cardHeight - waxSealSize / 2
                )
                .allowsHitTesting(false)
        }
    }

    // MARK: - Name Bar Zone

    private func nameBar(cardWidth: CGFloat, cardHeight: CGFloat, showCost: Bool) -> some View {
        ZStack(alignment: .leading) {
            nameBarBackground
            HStack(alignment: .center, spacing: 4) {
                Text(data.name)
                    .font(CardFont.cardName(size: 13))
                    .foregroundColor(theme.primaryText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .letterpressShadow()
                Spacer(minLength: 4)
                if showCost {
                    chaosMoteRow(cost: data.manaCost)
                }
            }
            .padding(.horizontal, 6)
        }
    }

    /// Planar Ruin name bar — shows cost as number with label instead of symbols.
    private func ruinNameBar(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        ZStack(alignment: .leading) {
            nameBarBackground
            HStack(alignment: .center, spacing: 4) {
                Text(data.name)
                    .font(CardFont.cardName(size: 13))
                    .foregroundColor(theme.primaryText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .letterpressShadow()
                Spacer(minLength: 4)
                // Ruin cost label
                HStack(spacing: 2) {
                    Text("Cost:")
                        .font(CardFont.cardType(size: 9))
                        .foregroundColor(theme.secondaryText)
                        .letterpressShadow()
                    Text("\(data.manaCost)")
                        .font(CardFont.cardName(size: 11))
                        .foregroundColor(theme.primaryText)
                        .letterpressShadow()
                }
                .padding(.trailing, 4)
            }
            .padding(.horizontal, 6)
        }
    }

    private var nameBarBackground: some View {
        theme.nameBarBackground
            .overlay(
                LinearGradient(
                    colors: [Color.white.opacity(0.12), Color.clear],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
    }

    // MARK: - 2.3 Chaos Mote Symbol Row

    private func chaosMoteRow(cost: Int) -> some View {
        Group {
            if cost > 7 {
                Text("\(cost)+")
                    .font(CardFont.cardType(size: 10))
                    .foregroundColor(theme.primaryText)
                    .letterpressShadow()
                    .padding(.trailing, 6)
            } else {
                HStack(spacing: 2) {
                    ForEach(0..<min(cost, 7), id: \.self) { _ in
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        Color("legendary-ember").opacity(0.9),
                                        Color("epic-amethyst").opacity(0.85)
                                    ],
                                    center: .center,
                                    startRadius: 1,
                                    endRadius: 8
                                )
                            )
                            .frame(width: 16, height: 16)
                            .overlay(
                                Circle().stroke(Color("aged-gold").opacity(0.6), lineWidth: 0.5)
                            )
                    }
                }
                .padding(.trailing, 6)
            }
        }
    }

    // MARK: - Art Box Zone

    private func artBox(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        ZStack(alignment: .bottom) {
            // Art image or fallback
            artLayer(cardWidth: cardWidth, cardHeight: cardHeight)

            // Subtle bottom vignette for text legibility
            LinearGradient(
                colors: [Color.clear, Color.black.opacity(0.25)],
                startPoint: .center,
                endPoint: .bottom
            )
            .allowsHitTesting(false)
        }
    }

    private func artBoxWithLockIcon(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        ZStack(alignment: .bottomTrailing) {
            artBox(cardWidth: cardWidth, cardHeight: cardHeight)
            // Lock icon for stabilizers (Section 1.5b)
            Image(systemName: "lock.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 10, height: 10)
                .foregroundColor(Color("parchment-mid").opacity(0.7))
                .padding(6)
                .allowsHitTesting(false)
        }
    }

    // MARK: - Art Layer (2.8 — fallback when artwork missing)

    private func artLayer(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        Group {
            if let urlString = data.artUrl, !urlString.isEmpty, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        artFallback(cardWidth: cardWidth, cardHeight: cardHeight)
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: cardWidth, height: cardHeight)
                            .clipped()
                    case .failure:
                        artFallback(cardWidth: cardWidth, cardHeight: cardHeight)
                    @unknown default:
                        artFallback(cardWidth: cardWidth, cardHeight: cardHeight)
                    }
                }
            } else {
                artFallback(cardWidth: cardWidth, cardHeight: cardHeight)
            }
        }
        .frame(width: cardWidth, height: cardHeight)
        .clipped()
    }

    /// Fallback when artwork is nil or fails to load (Section 1.9).
    /// Shows canvas-warm base + crosshatch pattern + centered quill icon.
    private func artFallback(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        ZStack {
            Color("canvas-warm")

            // Crosshatch pattern drawn procedurally
            Canvas { context, size in
                let spacing: CGFloat = 12
                let lineColor = Color("ink-black").opacity(0.08)
                // Diagonal lines top-left to bottom-right
                var x: CGFloat = -size.height
                while x < size.width + size.height {
                    var path = Path()
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x + size.height, y: size.height))
                    context.stroke(path, with: .color(lineColor), lineWidth: 0.5)
                    x += spacing
                }
                // Diagonal lines top-right to bottom-left
                x = 0
                while x < size.width + size.height {
                    var path = Path()
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x - size.height, y: size.height))
                    context.stroke(path, with: .color(lineColor), lineWidth: 0.5)
                    x += spacing
                }
            }
            .frame(width: cardWidth, height: cardHeight)

            // Quill pen icon centered
            Image(systemName: "pencil.and.outline")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 40, height: 40)
                .foregroundColor(Color("parchment-dark").opacity(0.35))
        }
        .frame(width: cardWidth, height: cardHeight)
    }

    // MARK: - Wax Seal

    private var waxSeal: some View {
        ZStack {
            // Drop shadow
            Circle()
                .fill(Color.black.opacity(0.40))
                .frame(width: 32, height: 32)
                .blur(radius: 3)
                .offset(y: 2)

            // Seal body — rarity color with radial gradient
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            data.tier.waxColor.opacity(0.9),
                            data.tier.waxColor.opacity(0.6),
                            Color.black.opacity(0.7)
                        ],
                        center: .init(x: 0.4, y: 0.35),
                        startRadius: 1,
                        endRadius: 17
                    )
                )
                .frame(width: 34, height: 34)

            // Top-lit highlight
            LinearGradient(
                colors: [Color.white.opacity(0.35), Color.clear],
                startPoint: .top,
                endPoint: .center
            )
            .frame(width: 30, height: 18)
            .offset(y: -7)
            .blendMode(.screen)
            .clipShape(Circle().offset(y: -4))

            // Rarity symbol — collector number displayed in seal at detail sizes
            Text(raritySymbol)
                .font(CardFont.collectorNumber(size: 9))
                .foregroundColor(Color("parchment-light").opacity(0.9))
                .shadow(color: .black.opacity(0.7), radius: 1, x: 0, y: 0.5)
        }
    }

    private var raritySymbol: String {
        switch data.tier {
        case .common:    return "C"
        case .uncommon:  return "U"
        case .rare:      return "R"
        case .epic:      return "E"
        case .legendary: return "\u{2605}" // star
        }
    }

    // MARK: - Type Line Zone

    private func typeLine(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        ZStack {
            theme.typeLineBackground
            HStack(alignment: .center, spacing: 4) {
                // Faction icon (left-aligned, 14×14pt)
                if let faction = data.faction {
                    Image(faction.emblemAssetName)
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 14, height: 14)
                        .foregroundColor(faction.color)
                        .shadow(
                            color: theme.letterpressShadowColor.opacity(0.6),
                            radius: 0.5, x: 0, y: 0.5
                        )
                }

                Text(data.typeLine)
                    .font(CardFont.cardType(size: 10))
                    .foregroundColor(theme.primaryText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .letterpressShadow()

                Spacer(minLength: 2)

                // Set symbol placeholder (right-aligned 14×14pt)
                Image(systemName: "seal")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 14, height: 14)
                    .foregroundColor(theme.secondaryText.opacity(0.5))
            }
            .padding(.horizontal, 6)
        }
    }

    // MARK: - Text Box Zone

    private func textBox(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        ZStack(alignment: .topLeading) {
            theme.textBoxBackground
                .overlay(
                    // Subtle paper texture overlay
                    Image("CardTextures/paper-texture")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .opacity(0.06)
                )

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    // Keyword ability names row
                    if !data.keywords.isEmpty {
                        keywordsRow
                            .padding(.bottom, 4)
                        Divider()
                            .frame(height: 0.5)
                            .background(theme.secondaryText.opacity(0.3))
                            .padding(.bottom, 4)
                    }

                    // Ability text
                    if let abilityText = data.abilityText, !abilityText.isEmpty {
                        Text(abilityText)
                            .font(CardFont.abilityText(size: 11))
                            .foregroundColor(theme.primaryText)
                            .lineSpacing(3)
                            .letterpressShadow()
                            .padding(.bottom, 4)
                    }

                    // Ability/flavor divider
                    if let abilityText = data.abilityText, !abilityText.isEmpty, !data.flavorText.isEmpty {
                        Divider()
                            .frame(height: 0.5)
                            .background(theme.secondaryText.opacity(0.3))
                            .padding(.bottom, 4)
                    }

                    // Flavor text
                    if !data.flavorText.isEmpty {
                        Text("\u{201C}\(data.flavorText)\u{201D}")
                            .font(CardFont.flavorText(size: 10))
                            .foregroundColor(theme.flavorText)
                            .lineSpacing(2)
                            .letterpressShadow()
                    }
                }
                .padding(4)
            }
        }
        .overlay(
            // Inner top shadow to suggest recessed panel
            LinearGradient(
                colors: [Color.black.opacity(0.08), Color.clear],
                startPoint: .top,
                endPoint: .init(x: 0.5, y: 0.25)
            )
            .allowsHitTesting(false)
        )
    }

    private var keywordsRow: some View {
        HStack(spacing: 0) {
            ForEach(Array(data.keywords.enumerated()), id: \.element) { index, keyword in
                if index > 0 {
                    Text(" \u{00B7} ")
                        .font(CardFont.keywordName(size: 11))
                        .foregroundColor(theme.secondaryText)
                        .letterpressShadow()
                }
                Text(keyword.displayName)
                    .font(CardFont.keywordName(size: 11))
                    .foregroundColor(theme.primaryText)
                    .letterpressShadow()
                    .onTapGesture {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            activeTooltipKeyword = (activeTooltipKeyword == keyword) ? nil : keyword
                        }
                    }
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: - Planar Ruin Text Box

    private func ruinTextBox(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        ZStack(alignment: .topLeading) {
            theme.textBoxBackground

            VStack(alignment: .leading, spacing: 0) {
                // Passive benefit panel
                VStack(alignment: .leading, spacing: 2) {
                    Text("PASSIVE")
                        .font(CardFont.cardName(size: 8))
                        .foregroundColor(theme.secondaryText)
                        .letterpressShadow()
                    Text(data.ruinPassiveText ?? "")
                        .font(CardFont.abilityText(size: 10))
                        .foregroundColor(theme.primaryText)
                        .lineSpacing(2)
                        .letterpressShadow()
                        .minimumScaleFactor(0.8)
                }
                .padding(.horizontal, 4)
                .padding(.top, 4)
                .padding(.bottom, 4)

                // Separator
                Rectangle()
                    .fill(theme.secondaryText.opacity(0.3))
                    .frame(height: 1)
                    .padding(.horizontal, 4)

                // Destruction penalty panel
                VStack(alignment: .leading, spacing: 2) {
                    Text("IF DESTROYED")
                        .font(CardFont.cardName(size: 8))
                        .foregroundColor(Color("wax-red"))
                        .letterpressShadow()
                    Text(data.ruinDestructionPenaltyText ?? "")
                        .font(CardFont.abilityText(size: 10))
                        .foregroundColor(Color("wax-red"))
                        .lineSpacing(2)
                        .letterpressShadow()
                        .minimumScaleFactor(0.8)
                }
                .padding(.horizontal, 4)
                .padding(.top, 4)
                .padding(.bottom, 4)

                Spacer(minLength: 0)
            }
        }
    }

    // MARK: - Stats Bar Zone

    private func statsBar(cardWidth: CGFloat, cardHeight: CGFloat, showAtk: Bool) -> some View {
        ZStack {
            theme.statsBarBackground
            HStack(alignment: .center) {
                // Instability indicator (left — creature only, not planar ruins)
                if data.cardType == .creature, let instability = data.instability {
                    HStack(spacing: 3) {
                        Image(systemName: "die.face.4")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 10, height: 10)
                            .foregroundColor(factionIconColor.opacity(0.8))
                        Text("\(instability)")
                            .font(CardFont.statNumber(size: 10))
                            .foregroundColor(factionIconColor.opacity(0.8))
                            .letterpressShadow()
                    }
                    .padding(.leading, 4)
                }

                // Collector number (left of center)
                if let cn = data.collectorNumber {
                    Text(cn)
                        .font(CardFont.collectorNumber(size: 7))
                        .foregroundColor(theme.secondaryText)
                        .letterpressShadow()
                        .padding(.leading, 4)
                }

                Spacer(minLength: 0)

                // Set code (center)
                if let setCode = data.setCode {
                    Text(setCode)
                        .font(CardFont.collectorNumber(size: 7))
                        .foregroundColor(theme.secondaryText)
                        .letterpressShadow()
                }

                Spacer(minLength: 0)

                // ATK / HP (right-aligned, Oswald-Bold 13pt)
                if data.cardType == .planarRuin {
                    // HP only for ruins
                    if let hp = data.health {
                        Text("\(hp)")
                            .font(CardFont.statNumber(size: 13))
                            .foregroundColor(theme.primaryText)
                            .letterpressShadow()
                            .padding(.trailing, 8)
                    }
                } else if showAtk, let atk = data.attack, let hp = data.health {
                    Text("\(atk) / \(hp)")
                        .font(CardFont.statNumber(size: 13))
                        .foregroundColor(theme.primaryText)
                        .letterpressShadow()
                        .padding(.trailing, 8)
                }
            }
        }
    }

    // MARK: - Rarity Color Bar Zone

    private func rarityColorBar(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        rarityBarColor
    }

    private var rarityBarColor: some View {
        Group {
            switch data.tier {
            case .common:
                Color("parchment-mid")
            case .uncommon:
                Color("antique-silver")
            case .rare:
                LinearGradient(
                    colors: [Color("aged-gold").opacity(0.7), Color("aged-gold"), Color("aged-gold").opacity(0.8)],
                    startPoint: .leading, endPoint: .trailing
                )
            case .epic:
                LinearGradient(
                    colors: [Color("epic-amethyst").opacity(0.7), Color("epic-amethyst"), Color("epic-amethyst").opacity(0.7)],
                    startPoint: .leading, endPoint: .trailing
                )
            case .legendary:
                LinearGradient(
                    colors: [Color("legendary-ember"), Color("aged-gold"), Color("legendary-ember")],
                    startPoint: .leading, endPoint: .trailing
                )
            }
        }
    }

    // MARK: - Rarity Border Gradient

    private var rarityBorderGradient: LinearGradient {
        data.tier.borderGradient
    }

    private var rarityGlowColor: Color {
        switch data.tier {
        case .common, .uncommon: return .clear
        case .rare:      return Color("aged-gold")
        case .epic:      return Color("epic-amethyst")
        case .legendary: return Color("legendary-ember")
        }
    }

    // MARK: - Card Base Color

    private var cardBaseColor: Color {
        theme.cardBase
    }

    // MARK: - Faction Color Helpers

    private var factionIconColor: Color {
        guard let faction = data.faction else { return Color("parchment-dark") }
        return faction.color
    }
}

// MARK: - Keyword Asset Name Extension

extension Keyword {
    var sfSymbolName: String {
        switch self {
        case .shield: return "shield.fill"
        case .lifesteal: return "drop.fill"
        case .flying: return "wind"
        case .reach: return "scope"
        case .deathtouch: return "xmark.seal.fill"
        case .taunt: return "exclamationmark.shield.fill"
        case .piercing: return "arrow.right.circle.fill"
        case .haste: return "bolt.fill"
        case .ward: return "sparkles"
        }
    }
}

// MARK: - Noise Texture Overlay (preserved for backwards compat)

struct NoiseTextureOverlay: View {
    let width: CGFloat
    let height: CGFloat
    let opacity: Double

    var body: some View {
        Canvas { context, canvasSize in
            let dotCount = Int(canvasSize.width * canvasSize.height * 0.06)
            for i in 0..<dotCount {
                let seed1 = Double(i * 7919 + 104729)
                let seed2 = Double(i * 6271 + 73939)
                let x = (seed1.truncatingRemainder(dividingBy: canvasSize.width * 3.7))
                    .truncatingRemainder(dividingBy: canvasSize.width)
                let y = (seed2.truncatingRemainder(dividingBy: canvasSize.height * 3.7))
                    .truncatingRemainder(dividingBy: canvasSize.height)
                let gray = ((seed1 + seed2).truncatingRemainder(dividingBy: 2.0)) < 1.0 ? 0.0 : 1.0
                let dotRect = CGRect(x: abs(x), y: abs(y), width: 1, height: 1)
                context.fill(
                    Path(ellipseIn: dotRect),
                    with: .color(Color(white: gray, opacity: 0.5))
                )
            }
        }
        .frame(width: width, height: height)
        .opacity(opacity)
        .blendMode(.overlay)
        .allowsHitTesting(false)
    }
}

// MARK: - Inner Vignette Overlay (preserved for backwards compat)

struct InnerVignetteOverlay: View {
    var body: some View {
        RadialGradient(
            colors: [Color.clear, Color.clear, Color.black.opacity(0.10)],
            center: .center, startRadius: 10, endRadius: 250
        )
        .allowsHitTesting(false)
    }
}

// MARK: - CMBadgeView / ATKBadgeView / HPBadgeView (preserved for call sites in SpriteKit nodes)

struct CMBadgeView: View {
    let value: Int
    let size: CGFloat
    var factionSealAsset: String? = nil
    var body: some View {
        ZStack {
            Circle()
                .fill(Color("aged-gold").opacity(0.85))
                .frame(width: size, height: size)
            Text("\(value)")
                .font(CardFont.statNumber(size: size * 0.5))
                .foregroundColor(Color("parchment-light"))
                .shadow(color: .black.opacity(0.7), radius: 0.5, x: 0, y: 0.5)
        }
        .frame(width: size, height: size)
    }
}

struct ATKBadgeView: View {
    let value: Int
    let size: CGFloat
    var factionSealAsset: String? = nil
    var body: some View {
        ZStack {
            Circle()
                .fill(Color(hex: "#BF360C").opacity(0.85))
                .frame(width: size, height: size)
            Text("\(value)")
                .font(CardFont.statNumber(size: size * 0.5))
                .foregroundColor(Color("parchment-light"))
                .shadow(color: .black.opacity(0.7), radius: 0.5, x: 0, y: 0.5)
        }
        .frame(width: size, height: size)
    }
}

struct HPBadgeView: View {
    let value: Int
    let size: CGFloat
    var factionSealAsset: String? = nil
    var body: some View {
        ZStack {
            Circle()
                .fill(Color(hex: "#1B5E20").opacity(0.85))
                .frame(width: size, height: size)
            Text("\(value)")
                .font(CardFont.statNumber(size: size * 0.5))
                .foregroundColor(Color("parchment-light"))
                .shadow(color: .black.opacity(0.7), radius: 0.5, x: 0, y: 0.5)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - CardFrameView Previews

#Preview("Zone-Stack Grid") {
    HStack(spacing: 6) {
        ForEach(
            [
                ("Recruit",  Rarity.common,    CardFaction.ironwright),
                ("Veteran",  Rarity.uncommon,  CardFaction.fey),
                ("Champion", Rarity.rare,      CardFaction.demonic),
                ("Archon",   Rarity.epic,      CardFaction.celestial),
                ("Ascended", Rarity.legendary, CardFaction.endless)
            ],
            id: \.0
        ) { name, tier, faction in
            VStack(spacing: 4) {
                CardFrameView(
                    data: CardDisplayData(
                        name: name,
                        artUrl: nil,
                        manaCost: tier.tierIndex + 1,
                        attack: tier.tierIndex + 2,
                        health: tier.tierIndex + 3,
                        instability: tier.tierIndex,
                        tier: tier,
                        faction: faction,
                        keywords: [.shield],
                        flavorText: "A warrior forged in \(tier.displayName) fire.",
                        abilityText: "Shield: absorbs one hit."
                    ),
                    size: .grid
                )
                .frame(width: 90)
                Text(tier.displayName)
                    .font(.caption2)
                    .foregroundColor(.textSecondary)
            }
        }
    }
    .padding()
    .background(Color.bgPrimary)
}

#Preview("Spell Card") {
    CardFrameView(
        data: CardDisplayData(
            name: "Arcane Bolt",
            artUrl: nil,
            manaCost: 2,
            tier: .common,
            cardType: .spell,
            faction: .fey,
            flavorText: "A flash of emerald lightning.",
            abilityText: "Deal 3 damage to any creature."
        ),
        size: .detail
    )
    .frame(width: 210)
    .padding()
    .background(Color.bgPrimary)
}

#Preview("Stabilizer Card") {
    CardFrameView(
        data: CardDisplayData(
            name: "Chaos Anchor",
            artUrl: nil,
            manaCost: 0,
            tier: .uncommon,
            cardType: .stabilizer,
            faction: .ironwright,
            flavorText: "Cannot be destroyed.",
            abilityText: "All your creatures gain +1 ATK."
        ),
        size: .detail
    )
    .frame(width: 210)
    .padding()
    .background(Color.bgPrimary)
}

#Preview("Planar Ruin Card") {
    CardFrameView(
        data: CardDisplayData(
            name: "Ashen Colosseum",
            artUrl: nil,
            manaCost: 3,
            health: 10,
            tier: .rare,
            cardType: .planarRuin,
            faction: .demonic,
            flavorText: "Once a great arena.",
            ruinPassiveText: "All creatures deal +1 damage in combat.",
            ruinDestructionPenaltyText: "All your creatures lose 2 ATK until end of turn."
        ),
        size: .detail
    )
    .frame(width: 210)
    .padding()
    .background(Color.bgPrimary)
}

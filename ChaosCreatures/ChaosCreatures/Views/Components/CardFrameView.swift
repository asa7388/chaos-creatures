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
    static let statsBar: CGFloat = 0.051   // ~15pt / 294pt ≈ 5% per CARD_DESIGN_GUIDE.md Section 1.4
    static let rarityBar: CGFloat = 0.014  // 4pt / 294pt ≈ 1.5%
}

// MARK: - Zone Boundary Material-Edge Treatment
//
// Grimdark zone boundary: replaces clean digital hairlines with material-edge
// treatments — a subtle inner shadow on the upper zone's bottom edge and a warm
// highlight on the lower zone's top edge. This creates the illusion of one
// physical material overlapping another (brass meeting canvas, vellum on parchment).
// See docs/GRIMDARK_AESTHETIC_DIRECTIVE.md — "field document from a two-hundred-year war."

private struct ZoneBoundaryEdge: View {
    /// Total height of the boundary treatment.
    /// Thin bronze/gold ornamental divider — like brass tacks holding parchment layers together.
    let height: CGFloat

    var body: some View {
        VStack(spacing: 0) {
            // Dark shadow line (bottom of upper zone)
            Rectangle()
                .fill(Color("ink-black").opacity(0.60))
                .frame(height: 1)
            // Bronze/gold decorative strip (the physical material edge)
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [
                            Color("aged-gold").opacity(0.50),
                            Color("aged-gold").opacity(0.70),
                            Color("aged-gold").opacity(0.50)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(height: 1.5)
            // Dark shadow line (top of lower zone)
            Rectangle()
                .fill(Color("ink-black").opacity(0.40))
                .frame(height: 0.5)
        }
        .frame(height: height)
        .allowsHitTesting(false)
    }
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

    // MARK: - Scale Factor
    // All font and icon sizes are expressed relative to the 210pt reference card width.
    // The GeometryReader resolves the actual card width; this scale is forwarded through
    // every zone builder so that iPad (671pt) and iPhone (210pt) render proportionally.
    private func cardScale(cardWidth: CGFloat) -> CGFloat {
        cardWidth / 210.0
    }

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
        // For .detail and .fullscreen the parent (CardDetailView / FullscreenCardView)
        // already pre-computes the target card width and passes it as the frame width.
        // Returning geometry.size.width directly avoids a second multiplication.
        // For .grid and .hand the container may be larger than one card, so the
        // multiplier is still applied to derive the correct card size.
        switch size {
        case .detail, .fullscreen:
            return max(min(geometry.size.width, 500), 160)
        case .grid, .hand:
            if UIDevice.current.userInterfaceIdiom == .pad {
                return max(min(geometry.size.width * 0.55, 500), 160)
            } else {
                return max(min(geometry.size.width * 0.85, 320), 160)
            }
        }
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
        // In grid context, taps are handled by the parent collection view (opens CardDetailView)
        guard size != .grid else { return }
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
            .overlay(animatedBorder)
            .shadow(color: rarityGlowColor.opacity(Double(data.tier.glowIntensity) * 0.6),
                    radius: CGFloat(data.tier.glowIntensity) * 8)
            .shadow(color: .black.opacity(0.45), radius: 3, x: 0, y: 2)
    }

    // MARK: - Animated Epic/Legendary Border

    @ViewBuilder
    private var animatedBorder: some View {
        if data.tier == .epic || data.tier == .legendary {
            AnimatedRarityBorder(
                isLegendary: data.tier == .legendary,
                cornerRadius: 12
            )
        }
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

    // MARK: - Creature Layout (VStack zone-stack per CARD_DESIGN_GUIDE.md Section 1.4)

    private func creatureLayout(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let boundaryHeight: CGFloat = 4 * cardScale(cardWidth: cardWidth)
        return VStack(spacing: 0) {
            nameBar(cardWidth: cardWidth, cardHeight: cardHeight, showCost: true)
                .frame(height: cardHeight * ZoneHeight.nameBars)

            ZoneBoundaryEdge(height: boundaryHeight)

            artBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.artBox)
                .frame(height: cardHeight * ZoneHeight.artBox)

            ZoneBoundaryEdge(height: boundaryHeight)

            typeLine(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.typeLine)

            ZoneBoundaryEdge(height: boundaryHeight)

            textBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.textBox)
                .frame(height: cardHeight * ZoneHeight.textBox)

            ZoneBoundaryEdge(height: boundaryHeight)

            statsBar(cardWidth: cardWidth, cardHeight: cardHeight, showAtk: true)
                .frame(height: cardHeight * ZoneHeight.statsBar)

            rarityColorBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.rarityBar)
        }
        .background(cardBaseBackground)
    }

    // MARK: - Spell Layout (no stats bar, expanded text box, no wax seal, no instability)

    private func spellLayout(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let boundaryHeight: CGFloat = 4 * cardScale(cardWidth: cardWidth)
        return VStack(spacing: 0) {
            nameBar(cardWidth: cardWidth, cardHeight: cardHeight, showCost: true)
                .frame(height: cardHeight * ZoneHeight.nameBars)

            ZoneBoundaryEdge(height: boundaryHeight)

            artBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.artBox)
                .frame(height: cardHeight * ZoneHeight.artBox)

            ZoneBoundaryEdge(height: boundaryHeight)

            typeLine(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.typeLine)
                .zIndex(10)

            ZoneBoundaryEdge(height: boundaryHeight)

            textBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.textBoxExpanded)
                .frame(height: cardHeight * ZoneHeight.textBoxExpanded)

            rarityColorBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.rarityBar)
        }
        .background(cardBaseBackground)
    }

    // MARK: - Stabilizer Layout (no cost, no stats, lock icon in art box)

    private func stabilizerLayout(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let boundaryHeight: CGFloat = 4 * cardScale(cardWidth: cardWidth)
        return VStack(spacing: 0) {
            nameBar(cardWidth: cardWidth, cardHeight: cardHeight, showCost: false)
                .frame(height: cardHeight * ZoneHeight.nameBars)

            ZoneBoundaryEdge(height: boundaryHeight)

            artBoxWithLockIcon(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.artBox)
                .frame(height: cardHeight * ZoneHeight.artBox)

            ZoneBoundaryEdge(height: boundaryHeight)

            typeLine(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.typeLine)
                .zIndex(10)

            ZoneBoundaryEdge(height: boundaryHeight)

            textBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.textBoxExpanded)
                .frame(height: cardHeight * ZoneHeight.textBoxExpanded)

            rarityColorBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.rarityBar)
        }
        .background(cardBaseBackground)
    }

    // MARK: - Planar Ruin Layout (HP only, passive + destruction panels)

    private func planarRuinLayout(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let boundaryHeight: CGFloat = 4 * cardScale(cardWidth: cardWidth)
        return VStack(spacing: 0) {
            ruinNameBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.nameBars)

            ZoneBoundaryEdge(height: boundaryHeight)

            artBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.artBox)
                .frame(height: cardHeight * ZoneHeight.artBox)

            ZoneBoundaryEdge(height: boundaryHeight)

            typeLine(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.typeLine)
                .zIndex(10)

            ZoneBoundaryEdge(height: boundaryHeight)

            ruinTextBox(cardWidth: cardWidth, cardHeight: cardHeight * ZoneHeight.textBox)
                .frame(height: cardHeight * ZoneHeight.textBox)

            ZoneBoundaryEdge(height: boundaryHeight)

            statsBar(cardWidth: cardWidth, cardHeight: cardHeight, showAtk: false)
                .frame(height: cardHeight * ZoneHeight.statsBar)

            rarityColorBar(cardWidth: cardWidth, cardHeight: cardHeight)
                .frame(height: cardHeight * ZoneHeight.rarityBar)
        }
        .background(cardBaseBackground)
    }

    // MARK: - Name Bar Zone

    private func nameBar(cardWidth: CGFloat, cardHeight: CGFloat, showCost: Bool) -> some View {
        let scale = cardScale(cardWidth: cardWidth)
        return ZStack(alignment: .leading) {
            nameBarBackground
            HStack(alignment: .center, spacing: 4 * scale) {
                Text(data.name)
                    .font(CardFont.cardName(size: 13 * scale))
                    .foregroundColor(theme.primaryText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .letterpressShadow()
                    .shadow(color: Color.black.opacity(0.5), radius: 2, x: 0, y: 1)
                Spacer(minLength: 4 * scale)
                if showCost {
                    chaosMoteRow(cost: data.manaCost, cardWidth: cardWidth)
                }
            }
            .padding(.horizontal, 6 * scale)
        }
    }

    /// Planar Ruin name bar — uses the same N ⊕ unified cost display as creature/spell bars.
    private func ruinNameBar(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let scale = cardScale(cardWidth: cardWidth)
        return ZStack(alignment: .leading) {
            nameBarBackground
            HStack(alignment: .center, spacing: 4 * scale) {
                Text(data.name)
                    .font(CardFont.cardName(size: 13 * scale))
                    .foregroundColor(theme.primaryText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .letterpressShadow()
                    .shadow(color: Color.black.opacity(0.5), radius: 2, x: 0, y: 1)
                Spacer(minLength: 4 * scale)
                chaosMoteRow(cost: data.manaCost, cardWidth: cardWidth)
            }
            .padding(.horizontal, 6 * scale)
        }
    }

    private var nameBarBackground: some View {
        // Faction texture shows through — no zone-specific background
        Color.clear
    }

    // MARK: - 2.3 N ⊕ Unified Chaos Mote Cost Display

    /// Renders the unified "N ⊕" cost indicator: cost numeral (Oswald-Bold 13pt) +
    /// single chaos mote icon. Right-aligned in the name bar with 6pt trailing inset.
    /// Scales proportionally with cardWidth/210.0.
    /// Only shown when showCost is true (creature, spell, planarRuin); hidden for stabilizers.
    private func chaosMoteRow(cost: Int, cardWidth: CGFloat = 210.0) -> some View {
        let scale = cardWidth / 210.0
        return HStack(spacing: 4 * scale) {
            Text("\(cost)")
                .font(CardFont.statNumber(size: 13 * scale))
                .foregroundColor(theme.primaryText)
                .letterpressShadow()
                .shadow(color: Color.black.opacity(0.5), radius: 2, x: 0, y: 1)
            Image("chaos_mote_symbol")
                .resizable()
                .frame(
                    width: 20 * scale,
                    height: 20 * scale
                )
                .shadow(color: Color.black.opacity(0.5), radius: 2, x: 0, y: 1)
        }
        .padding(.trailing, 6 * scale)
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
        let scale = cardScale(cardWidth: cardWidth)
        return ZStack(alignment: .bottomTrailing) {
            artBox(cardWidth: cardWidth, cardHeight: cardHeight)
            // Lock icon for stabilizers (Section 1.5b)
            Image(systemName: "lock.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 10 * scale, height: 10 * scale)
                .foregroundColor(Color("parchment-mid").opacity(0.7))
                .padding(6 * scale)
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

    // MARK: - Type Line Zone

    private func typeLine(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let scale = cardScale(cardWidth: cardWidth)
        return ZStack {
            // Faction texture shows through — no zone-specific background
            Color.clear
            HStack(alignment: .center, spacing: 4 * scale) {
                Text(effectiveTypeLine)
                    .font(CardFont.cardType(size: 10 * scale))
                    .foregroundColor(theme.primaryText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .letterpressShadow()
                    .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)

                Spacer(minLength: 2 * scale)
            }
            .padding(.horizontal, 6 * scale)
        }
    }

    // MARK: - Text Box Zone

    private func textBox(cardWidth: CGFloat, cardHeight: CGFloat) -> some View {
        let scale = cardScale(cardWidth: cardWidth)
        return ZStack(alignment: .topLeading) {
            // Faction texture shows through — no zone-specific background
            Color.clear

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    // Keyword ability names row
                    if !data.keywords.isEmpty {
                        keywordsRow(scale: scale)
                            .padding(.bottom, 4 * scale)
                        Divider()
                            .frame(height: 0.5)
                            .background(theme.secondaryText.opacity(0.3))
                            .padding(.bottom, 4 * scale)
                    }

                    // Ability text
                    if let abilityText = data.abilityText, !abilityText.isEmpty {
                        Text(abilityText)
                            .font(CardFont.abilityText(size: 11 * scale))
                            .foregroundColor(theme.primaryText)
                            .lineSpacing(3 * scale)
                            .letterpressShadow()
                            .shadow(color: Color.black.opacity(0.3), radius: 1, x: 0, y: 1)
                            .padding(.bottom, 4 * scale)
                    }

                    // Ability/flavor divider
                    if let abilityText = data.abilityText, !abilityText.isEmpty, !data.flavorText.isEmpty {
                        Divider()
                            .frame(height: 0.5)
                            .background(theme.secondaryText.opacity(0.3))
                            .padding(.bottom, 4 * scale)
                    }

                    // Flavor text
                    if !data.flavorText.isEmpty {
                        Text("\u{201C}\(data.flavorText)\u{201D}")
                            .font(CardFont.flavorText(size: 10 * scale))
                            .foregroundColor(theme.flavorText)
                            .lineSpacing(2 * scale)
                            .letterpressShadow()
                            .shadow(color: Color.black.opacity(0.3), radius: 1, x: 0, y: 1)
                    }
                }
                .padding(4 * scale)
            }
        }
    }

    private func keywordsRow(scale: CGFloat) -> some View {
        HStack(spacing: 0) {
            ForEach(Array(data.keywords.enumerated()), id: \.element) { index, keyword in
                if index > 0 {
                    Text(" \u{00B7} ")
                        .font(CardFont.keywordName(size: 11 * scale))
                        .foregroundColor(theme.secondaryText)
                        .letterpressShadow()
                        .shadow(color: Color.black.opacity(0.3), radius: 1, x: 0, y: 1)
                }
                Text(keyword.displayName)
                    .font(CardFont.keywordName(size: 11 * scale))
                    .foregroundColor(theme.primaryText)
                    .letterpressShadow()
                    .shadow(color: Color.black.opacity(0.3), radius: 1, x: 0, y: 1)
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
        let scale = cardScale(cardWidth: cardWidth)
        return ZStack(alignment: .topLeading) {
            // Faction texture shows through — no zone-specific background
            Color.clear

            VStack(alignment: .leading, spacing: 0) {
                // Passive benefit panel
                VStack(alignment: .leading, spacing: 2 * scale) {
                    Text("PASSIVE")
                        .font(CardFont.cardName(size: 8 * scale))
                        .foregroundColor(theme.secondaryText)
                        .letterpressShadow()
                        .shadow(color: Color.black.opacity(0.3), radius: 1, x: 0, y: 1)
                    Text(data.ruinPassiveText ?? "")
                        .font(CardFont.abilityText(size: 10 * scale))
                        .foregroundColor(theme.primaryText)
                        .lineSpacing(2 * scale)
                        .letterpressShadow()
                        .shadow(color: Color.black.opacity(0.3), radius: 1, x: 0, y: 1)
                        .minimumScaleFactor(0.8)
                }
                .padding(.horizontal, 4 * scale)
                .padding(.top, 4 * scale)
                .padding(.bottom, 4 * scale)

                // Separator
                Rectangle()
                    .fill(theme.secondaryText.opacity(0.3))
                    .frame(height: 1)
                    .padding(.horizontal, 4 * scale)

                // Destruction penalty panel
                VStack(alignment: .leading, spacing: 2 * scale) {
                    Text("IF DESTROYED")
                        .font(CardFont.cardName(size: 8 * scale))
                        .foregroundColor(Color("wax-red"))
                        .letterpressShadow()
                        .shadow(color: Color.black.opacity(0.3), radius: 1, x: 0, y: 1)
                    Text(data.ruinDestructionPenaltyText ?? "")
                        .font(CardFont.abilityText(size: 10 * scale))
                        .foregroundColor(Color("wax-red"))
                        .lineSpacing(2 * scale)
                        .letterpressShadow()
                        .shadow(color: Color.black.opacity(0.3), radius: 1, x: 0, y: 1)
                        .minimumScaleFactor(0.8)
                }
                .padding(.horizontal, 4 * scale)
                .padding(.top, 4 * scale)
                .padding(.bottom, 4 * scale)

                Spacer(minLength: 0)
            }
        }
    }

    // MARK: - Stats Bar Zone

    private func statsBar(cardWidth: CGFloat, cardHeight: CGFloat, showAtk: Bool) -> some View {
        let scale = cardScale(cardWidth: cardWidth)
        // Wax seal size: 34pt at 210pt reference, scales proportionally
        let sealSize: CGFloat = 34 * scale
        return ZStack(alignment: .trailing) {
            // Faction texture shows through — no zone-specific background
            ZStack {
                Color.clear
                HStack(alignment: .center) {
                    if data.cardType == .planarRuin {
                        // Planar Ruin: HP only — bottom right, no ATK
                        Spacer()
                        if let hp = data.health {
                            HStack(spacing: 4 * scale) {
                                Image(systemName: "heart.fill")
                                    .resizable()
                                    .frame(width: 12 * scale, height: 12 * scale)
                                    .foregroundColor(Color("wax-red"))
                                    .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                                Text("\(hp)")
                                    .font(CardFont.statNumber(size: 13 * scale))
                                    .foregroundColor(theme.primaryText)
                                    .letterpressShadow()
                                    .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                            }
                            .padding(.horizontal, 8 * scale)
                            .padding(.vertical, 3 * scale)
                            .background(Capsule().fill(Color.black.opacity(0.6)))
                        }
                    } else if showAtk, let atk = data.attack, let hp = data.health {
                        // Creature: ATK badge bottom-left, HP badge bottom-right
                        HStack(spacing: 4 * scale) {
                            Image(systemName: "crossed.swords")
                                .resizable()
                                .frame(width: 12 * scale, height: 12 * scale)
                                .foregroundColor(Color("aged-gold"))
                                .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                            Text("\(atk)")
                                .font(CardFont.statNumber(size: 13 * scale))
                                .foregroundColor(theme.primaryText)
                                .letterpressShadow()
                                .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                        }
                        .padding(.horizontal, 8 * scale)
                        .padding(.vertical, 3 * scale)
                        .background(Capsule().fill(Color("aged-gold").opacity(0.25)).overlay(Capsule().stroke(Color("aged-gold").opacity(0.6), lineWidth: 0.5 * scale)))

                        Spacer()

                        HStack(spacing: 4 * scale) {
                            Image(systemName: "heart.fill")
                                .resizable()
                                .frame(width: 12 * scale, height: 12 * scale)
                                .foregroundColor(Color("wax-red"))
                                .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                            Text("\(hp)")
                                .font(CardFont.statNumber(size: 13 * scale))
                                .foregroundColor(theme.primaryText)
                                .letterpressShadow()
                                .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                        }
                        .padding(.horizontal, 8 * scale)
                        .padding(.vertical, 3 * scale)
                        .background(Capsule().fill(Color("wax-red").opacity(0.25)).overlay(Capsule().stroke(Color("wax-red").opacity(0.6), lineWidth: 0.5 * scale)))
                    } else {
                        // No stats to show — instability and collector info only
                        if data.cardType == .creature, let instability = data.instability, instability > 0 {
                            InstabilityBadgeView(instability: instability)
                                .padding(.leading, 4 * scale)
                                .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                        }
                        if let cn = data.collectorNumber {
                            Text(cn)
                                .font(CardFont.collectorNumber(size: 7 * scale))
                                .foregroundColor(theme.secondaryText)
                                .letterpressShadow()
                                .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                                .padding(.leading, 4 * scale)
                        }
                        Spacer(minLength: 0)
                        if let setCode = data.setCode {
                            Text(setCode)
                                .font(CardFont.collectorNumber(size: 7 * scale))
                                .foregroundColor(theme.secondaryText)
                                .letterpressShadow()
                                .shadow(color: Color.black.opacity(0.4), radius: 2, x: 0, y: 1)
                        }
                        Spacer(minLength: 0)
                    }
                }
                .padding(.horizontal, 6 * scale)
            }
            .clipped()

            // Wax seal — overlaps stats bar, right-aligned
            // Guide ref: x=164, y=258 at 210x294pt; size=34pt. Positioned to overlap
            // upward from the stats bar zone.
            WaxSealView(rarity: data.tier, faction: effectiveFaction ?? .ironwright, size: sealSize)
                .offset(x: -6 * scale, y: -sealSize * 0.35)
                .zIndex(10)
        }
        .zIndex(5)
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

    // MARK: - Faction Background Texture

    /// Maps a faction to its card body background texture asset name.
    /// Returns nil for factions that don't have a custom background yet,
    /// which causes the layout to fall back to the solid cardBaseColor.
    private var factionBackgroundImage: String? {
        guard let faction = effectiveFaction else { return nil }
        switch faction {
        case .celestial: return "CardTextures/bg-celestial"
        case .fey:       return "CardTextures/bg-fey"
        // Other factions will be added later — return nil for now
        case .ironwright, .demonic, .endless: return nil
        }
    }

    /// Fallback faction detection when `data.faction` is nil.
    /// Scans the art URL filename and card name for faction identifiers.
    /// This handles cases where the CollectionView template→faction lookup
    /// chain fails to populate the faction field.
    private var inferredFaction: CardFaction? {
        let sources = [
            data.artUrl?.lowercased() ?? "",
            data.name.lowercased()
        ]
        for text in sources {
            if text.contains("ironwright") { return .ironwright }
            if text.contains("fey") { return .fey }
            if text.contains("demonic") { return .demonic }
            if text.contains("celestial") { return .celestial }
            if text.contains("endless") { return .endless }
        }
        return nil
    }

    /// The effective faction for rendering, using inferredFaction as fallback.
    private var effectiveFaction: CardFaction? {
        data.faction ?? inferredFaction
    }

    /// Type line text with faction fallback. Uses inferredFaction when
    /// data.faction is nil so the type line still shows "Creature — Ironwright" etc.
    private var effectiveTypeLine: String {
        if data.faction != nil {
            return data.typeLine
        }
        if let inferred = inferredFaction {
            return "\(data.cardType.displayName) \u{2014} \(inferred.shortDisplayName)"
        }
        return data.typeLine
    }

    /// The card body base layer: faction texture if available, solid color fallback otherwise.
    /// Placed as the .background() of each card type layout's VStack.
    @ViewBuilder
    private var cardBaseBackground: some View {
        if let bgImage = factionBackgroundImage {
            Image(bgImage)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .allowsHitTesting(false)
        } else {
            cardBaseColor
        }
    }


}

// MARK: - AnimatedRarityBorder

/// Isolated View struct for Epic/Legendary rotating gradient border.
/// Using a separate struct prevents parent CardFrameView re-renders from
/// interrupting the continuous rotation animation.
private struct AnimatedRarityBorder: View {
    let isLegendary: Bool
    let cornerRadius: CGFloat

    @State private var rotation: Double = 0

    private var colors: [Color] {
        isLegendary
            ? [Color("aged-gold"), Color("aged-gold").opacity(0.85), Color("legendary-ember"),
               Color("aged-gold"), Color("aged-gold").opacity(0.9), Color("aged-gold")]
            : [Color("epic-amethyst"), Color("epic-amethyst").opacity(0.8), Color("epic-amethyst").opacity(0.6),
               Color("epic-amethyst"), Color("epic-amethyst").opacity(0.85), Color("epic-amethyst")]
    }

    private var duration: Double { isLegendary ? 3.0 : 4.5 }
    private var lineWidth: CGFloat { isLegendary ? 3 : 2 }

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .strokeBorder(
                AngularGradient(
                    colors: colors,
                    center: .center,
                    startAngle: .degrees(rotation),
                    endAngle: .degrees(rotation + 360)
                ),
                lineWidth: lineWidth
            )
            .opacity(0.9)
            .onAppear {
                // Guard prevents re-triggering if view is briefly re-appeared
                guard rotation == 0 else { return }
                if UIAccessibility.isReduceMotionEnabled {
                    rotation = 45
                } else {
                    withAnimation(
                        .linear(duration: duration)
                        .repeatForever(autoreverses: false)
                    ) {
                        rotation = 360
                    }
                }
            }
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

// CardFrameView.swift
// Chaos Creatures
// Professional full-art card renderer with physical paper-card aesthetic.
// Oil-painting style cards: shaped stat badges, paper texture overlay, inner vignette,
// parchment-brown double border, contained text panel with arched top.
// Rarity treatments use the card border itself (faction-colored with glow/shimmer).
// Source: CLAUDE.md Card Visual System, docs/design/07-ui-ux-specs.md Section 5

import SwiftUI
import CoreMotion

// MARK: - Card Display Size

enum CardDisplaySize {
    /// Grid view in collection (~100x140pt). Condensed: name + stat badges only.
    case grid
    /// Hand view in battle (~90x130pt). Condensed: name + keyword dots + stat badges.
    case hand
    /// Detail view in card detail sheet (~280x392pt). Full info: all elements.
    case detail
    /// Fullscreen admiration view (~350x490pt). Full info, large scale.
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

    var showCardName: Bool {
        true
    }

    var showStatBadges: Bool {
        true
    }
}

// MARK: - Card Display Data

/// Unified data structure for rendering any card at any scale.
/// Adapts from CardInstance, CardTemplate, or BattleCardData.
struct CardDisplayData {
    let name: String
    let artUrl: String?
    let manaCost: Int
    let attack: Int?
    let health: Int?
    let instability: Int?
    let tier: EvolutionTier
    let cardType: CardType
    let faction: FactionShortName?
    let keywords: [Keyword]
    let flavorText: String
    let isEvolutionReady: Bool

    // MARK: - Initializers

    init(
        name: String,
        artUrl: String?,
        manaCost: Int,
        attack: Int? = nil,
        health: Int? = nil,
        instability: Int? = nil,
        tier: EvolutionTier = .common,
        cardType: CardType = .creature,
        faction: FactionShortName? = nil,
        keywords: [Keyword] = [],
        flavorText: String = "",
        isEvolutionReady: Bool = false
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
    }

    /// Create from a CardInstance (collection/deck views).
    init(instance: CardInstance, faction: FactionShortName? = nil) {
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
    }

    /// Create from a CardTemplate (template browsing).
    init(template: CardTemplate, faction: FactionShortName? = nil) {
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
    }

    /// Create from BattleCreatureData (battlefield).
    init(battleCreature: BattleCreatureData) {
        self.name = battleCreature.name
        self.artUrl = battleCreature.artUrl
        self.manaCost = battleCreature.manaCost
        self.attack = battleCreature.attack
        self.health = battleCreature.health
        self.instability = battleCreature.instabilityValue
        self.tier = .common // Tier not tracked in battle state
        self.cardType = battleCreature.cardType
        self.faction = battleCreature.factionShortName
        self.keywords = battleCreature.activeKeywords
        self.flavorText = ""
        self.isEvolutionReady = false
    }

    /// Create from BattleCardData (hand card).
    init(battleCard: BattleCardData) {
        self.name = battleCard.name
        self.artUrl = battleCard.artUrl
        self.manaCost = battleCard.manaCost
        self.attack = battleCard.baseAttack
        self.health = battleCard.baseHealth
        self.instability = nil // Not shown in hand
        self.tier = .common
        self.cardType = battleCard.cardType
        self.faction = battleCard.factionShortName
        self.keywords = battleCard.innateKeywords
        self.flavorText = ""
        self.isEvolutionReady = false
    }

    // MARK: - Computed Properties

    /// Type line text (e.g. "Creature -- Ironwright", "Spell -- Fey Courts").
    var typeLine: String {
        let typeText = cardType.displayName
        if let faction = faction {
            return "\(typeText) \u{2014} \(faction.shortDisplayName)"
        }
        return typeText
    }

    /// Faction emblem asset name for watermark.
    var factionEmblemAssetName: String? {
        switch faction {
        case .ironwright: return "FactionEmblems/ironwright-emblem"
        case .feyCourts: return "FactionEmblems/fey-emblem"
        case .demonicKingdoms: return "FactionEmblems/demonic-emblem"
        case .celestialCrusade: return "FactionEmblems/celestial-emblem"
        case .theEndless: return "FactionEmblems/endless-emblem"
        case nil: return nil
        }
    }

    /// Whether this card type shows ATK/HP stat badges.
    var showsCreatureStats: Bool {
        let isCreature = cardType == .creature
        let isRuin = cardType == .planarRuin
        return isCreature || isRuin
    }
}

// MARK: - Bronze Medallion Stat Badges

/// Shared bronze medallion structure — wax seal texture with embossed rim.
private struct MedallionBadge: View {
    let value: Int
    let size: CGFloat
    let iconName: String
    let tintColor: Color

    var body: some View {
        ZStack {
            // Bronze wax seal texture base
            Image("CardTextures/wax-seal-bronze")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: size, height: size)
                .clipShape(Circle())

            // Stat color tint
            Circle()
                .fill(tintColor.opacity(0.35))

            // AI art icon faintly visible through the medallion
            Image(iconName)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: size, height: size)
                .clipShape(Circle())
                .blendMode(.overlay)
                .opacity(0.3)

            // Embossed raised rim — dark outer edge
            Circle()
                .stroke(
                    LinearGradient(
                        colors: [Color(hex: "#8B7355"), Color(hex: "#2A1F0F")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: size * 0.08
                )

            // Inner highlight on upper rim — simulates light hitting metal edge
            Circle()
                .stroke(Color(hex: "#D4B896").opacity(0.4), lineWidth: 0.5)
                .padding(size * 0.06)

            // Number stamped into the medallion — Bebas Neue for bold, impactful numerals
            Text("\(value)")
                .font(CardFont.statNumber(size: size * 0.50))
                .foregroundColor(Color(hex: "#F0EAD6"))
                .shadow(color: .black.opacity(0.9), radius: 1.5, x: 0, y: 1)
                .shadow(color: tintColor.opacity(0.3), radius: 3, x: 0, y: 0)
        }
        .frame(width: size, height: size)
        .shadow(color: .black.opacity(0.5), radius: 2, x: 0, y: 1)
    }
}

/// CM (Chaos Motes) medallion badge — top-right.
struct CMBadgeView: View {
    let value: Int
    let size: CGFloat
    var body: some View {
        MedallionBadge(
            value: value, size: size,
            iconName: "StatIcons/chaos-motes",
            tintColor: Color(hex: "#0D47A1")
        )
    }
}

/// ATK medallion badge — bottom-left.
struct ATKBadgeView: View {
    let value: Int
    let size: CGFloat
    var body: some View {
        MedallionBadge(
            value: value, size: size,
            iconName: "StatIcons/sword-atk",
            tintColor: Color(hex: "#BF360C")
        )
    }
}

/// HP medallion badge — bottom-right.
struct HPBadgeView: View {
    let value: Int
    let size: CGFloat
    var body: some View {
        MedallionBadge(
            value: value, size: size,
            iconName: "StatIcons/heart-hp",
            tintColor: Color(hex: "#1B5E20")
        )
    }
}

/// Instability medallion badge — top-left, amber-tinted.
struct InstabilityBadgeView: View {
    let value: Int
    let size: CGFloat
    var body: some View {
        MedallionBadge(
            value: value, size: size,
            iconName: "StatIcons/chaos-motes",
            tintColor: Color(hex: "#FF8F00")
        )
    }
}

// MARK: - Noise Texture Overlay

/// Subtle grain/noise overlay that breaks up digital smoothness.
struct NoiseTextureOverlay: View {
    let width: CGFloat
    let height: CGFloat
    let opacity: Double

    var body: some View {
        Canvas { context, canvasSize in
            // Deterministic pseudo-random dots for grain texture
            let dotCount = Int(canvasSize.width * canvasSize.height * 0.06)
            for i in 0..<dotCount {
                // Simple hash-based pseudo-random to avoid randomness issues
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

// MARK: - Inner Vignette Overlay

/// Subtle radial darkening at card edges simulating printed card look.
struct InnerVignetteOverlay: View {
    var body: some View {
        RadialGradient(
            colors: [
                Color.clear,
                Color.clear,
                Color.black.opacity(0.10)
            ],
            center: .center,
            startRadius: 10,
            endRadius: 250
        )
        .allowsHitTesting(false)
    }
}

// MARK: - CardFrameView

struct CardFrameView: View {
    let data: CardDisplayData
    let size: CardDisplaySize

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Layer 0: Wood-textured card border (visible frame)
            borderFrame

            // Layer 1: Card art (inset from edges to show border)
            // Legendary: art bleeds 4pt into the border for extended art effect
            artLayer
                .padding(legendaryArtBleed)

            // Layer 2: Canvas texture overlay (makes art feel painted on physical canvas)
            // Uncommon+ gets slightly richer texture detail (higher opacity)
            Image("CardTextures/canvas-weave")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: size.width - legendaryArtBleed * 2, height: size.height - legendaryArtBleed * 2)
                .clipped()
                .blendMode(.overlay)
                .opacity(canvasWeaveOpacity)
                .padding(legendaryArtBleed)
                .allowsHitTesting(false)

            // Layer 3: Print grain overlay (offset printing texture)
            NoiseTextureOverlay(
                width: size.width,
                height: size.height,
                opacity: 0.06
            )

            // Layer 4: Inner vignette (subtle edge darkening)
            InnerVignetteOverlay()
                .frame(width: size.width, height: size.height)

            // Layer 5: Textured text panel at bottom
            textPanel

            // Layer 5.5: Faction decorative accents (detail/fullscreen only)
            if size == .detail || size == .fullscreen {
                factionDecorativeOverlay
            }

            // Layer 6: CM cost badge (top-right corner)
            cmBadge
                .padding(.trailing, cmInset)
                .padding(.top, cmInset)

            // Layer 7: ATK badge (bottom-left, overlapping text panel)
            if data.showsCreatureStats, let atk = data.attack {
                atkBadgeOverlay(atk: atk)
            }

            // Layer 8: HP badge (bottom-right, overlapping text panel)
            if data.showsCreatureStats, let hp = data.health {
                hpBadgeOverlay(hp: hp)
            }

            // Layer 9: Instability badge (top-left, for creatures at detail/fullscreen, or hand if > 0)
            if let instability = data.instability, data.showsCreatureStats {
                if size == .detail || size == .fullscreen || (instability > 0 && size == .hand) {
                    instabilityBadgeOverlay(value: instability)
                }
            }

            // Layer 10: Evolution tier chevron badge (top-left, below instability if shown)
            if data.tier != .common && size != .hand {
                evolutionChevronBadge
            }

            // Layer 11: Evolution ready indicator (grid/hand only)
            if data.isEvolutionReady && size != .detail && size != .fullscreen {
                evolutionReadyBadge
            }
        }
        .frame(width: size.width, height: size.height)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        // Outer card edge — dark line simulating cut card stock
        .overlay(
            RoundedRectangle(cornerRadius: cornerRadius)
                .stroke(Color(hex: "#1A1408"), lineWidth: 1.5)
        )
        // Rarity treatment on top of base border
        .modifier(RarityBorderModifier(tier: data.tier, faction: data.faction, cornerRadius: cornerRadius))
        // Card shadow for physical depth
        .contactShadow(opacity: 0.6, yOffset: 3)
    }

    // MARK: - Corner Radius & Border

    private var cornerRadius: CGFloat {
        switch size {
        case .grid, .hand: return 12
        case .detail, .fullscreen: return 18
        }
    }

    /// Visible card border width — wood-textured frame around the art.
    private var borderWidth: CGFloat {
        switch size {
        case .grid: return 4
        case .hand: return 3
        case .detail: return 8
        case .fullscreen: return 10
        }
    }

    /// Legendary cards bleed art 4pt into the border for extended art effect.
    /// All other tiers use the standard border width for art inset.
    private var legendaryArtBleed: CGFloat {
        if data.tier == .legendary {
            return max(borderWidth - 4, 0)
        }
        return borderWidth
    }

    /// Canvas weave opacity — Uncommon+ gets slightly richer texture.
    private var canvasWeaveOpacity: Double {
        switch data.tier {
        case .common: return 0.15
        case .uncommon: return 0.20
        case .rare: return 0.22
        case .epic: return 0.18
        case .legendary: return 0.16
        }
    }

    // MARK: - Faction-Textured Border Frame

    /// Faction-specific border texture that frames the card art.
    /// Falls back to universal wood grain for cards with no faction.
    private var borderFrame: some View {
        Image(factionBorderAssetName)
            .resizable()
            .aspectRatio(contentMode: .fill)
            .frame(width: size.width, height: size.height)
            .clipped()
            .brightness(-0.05)
            .overlay(
                // Faction frame tint overlay — darkens and unifies the texture
                factionFrameTintColor.opacity(0.20)
            )
    }

    /// Asset name for faction border texture.
    private var factionBorderAssetName: String {
        guard let faction = data.faction else { return "CardTextures/card-border-wood" }
        switch faction {
        case .ironwright: return "CardTextures/border-ironwright"
        case .feyCourts: return "CardTextures/border-fey-verdant"
        case .demonicKingdoms: return "CardTextures/border-demonic-furnace"
        case .celestialCrusade: return "CardTextures/border-celestial-knights"
        case .theEndless: return "CardTextures/border-endless-cabals"
        }
    }

    /// Faction frame tint color for the border overlay.
    private var factionFrameTintColor: Color {
        guard let faction = data.faction else { return Color(hex: "#3D2B1A") }
        return Color.factionFrameTint(faction)
    }

    /// Asset name for faction text panel texture.
    private var factionTextPanelAssetName: String {
        guard let faction = data.faction else { return "CardTextures/dark-vellum" }
        switch faction {
        case .ironwright: return "TextPanels/tp-ironwright"
        case .feyCourts: return "TextPanels/tp-fey-verdant"
        case .demonicKingdoms: return "TextPanels/tp-demonic-furnace"
        case .celestialCrusade: return "TextPanels/tp-celestial-knights"
        case .theEndless: return "TextPanels/tp-endless-cabals"
        }
    }

    /// Faction-colored stat icon asset names for medallion badges.
    private var factionAtkIconName: String {
        guard let faction = data.faction else { return "StatIcons/sword-atk" }
        switch faction {
        case .ironwright: return "StatIcons/atk-ironwright"
        case .feyCourts: return "StatIcons/atk-feyVerdant"
        case .demonicKingdoms: return "StatIcons/atk-demonicFurnace"
        case .celestialCrusade: return "StatIcons/atk-celestialKnights"
        case .theEndless: return "StatIcons/atk-endlessCabals"
        }
    }

    private var factionHpIconName: String {
        guard let faction = data.faction else { return "StatIcons/heart-hp" }
        switch faction {
        case .ironwright: return "StatIcons/hp-ironwright"
        case .feyCourts: return "StatIcons/hp-feyVerdant"
        case .demonicKingdoms: return "StatIcons/hp-demonicFurnace"
        case .celestialCrusade: return "StatIcons/hp-celestialKnights"
        case .theEndless: return "StatIcons/hp-endlessCabals"
        }
    }

    private var factionCmIconName: String {
        guard let faction = data.faction else { return "StatIcons/chaos-motes" }
        switch faction {
        case .ironwright: return "StatIcons/chaos-mote-ironwright"
        case .feyCourts: return "StatIcons/chaos-mote-feyVerdant"
        case .demonicKingdoms: return "StatIcons/chaos-mote-demonicFurnace"
        case .celestialCrusade: return "StatIcons/chaos-mote-celestialKnights"
        case .theEndless: return "StatIcons/chaos-mote-endlessCabals"
        }
    }

    // MARK: - Full-Bleed Art Layer

    /// Inner art dimensions (inset by border width on all sides).
    /// Legendary uses legendaryArtBleed for extended art effect.
    private var artWidth: CGFloat { size.width - legendaryArtBleed * 2 }
    private var artHeight: CGFloat { size.height - legendaryArtBleed * 2 }
    private var innerCornerRadius: CGFloat { max(cornerRadius - legendaryArtBleed, 4) }

    private var artLayer: some View {
        Group {
            if let urlString = data.artUrl, !urlString.isEmpty, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        artPlaceholder
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: artWidth, height: artHeight)
                            .clipped()
                    case .failure:
                        artPlaceholder
                    @unknown default:
                        artPlaceholder
                    }
                }
            } else {
                artPlaceholder
            }
        }
        .frame(width: artWidth, height: artHeight)
        .clipShape(RoundedRectangle(cornerRadius: innerCornerRadius))
    }

    private var artPlaceholder: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [factionBgColor.opacity(0.3), Color.bgTertiary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: artWidth, height: artHeight)
            .overlay(
                Image(systemName: "photo")
                    .font(.system(size: max(artWidth * 0.2, 12)))  // SF Symbol icon size - keep as-is
                    .foregroundColor(.textDisabled)
            )
    }

    // MARK: - Contained Text Panel

    /// The name bar bridge lifts the text panel slightly into the art area,
    /// creating a visual "bridge" between art and text at the name bar.
    private var nameBarBridgeOffset: CGFloat {
        switch size {
        case .grid: return 3
        case .hand: return 2
        case .detail, .fullscreen: return 5
        }
    }

    private var textPanel: some View {
        VStack(spacing: 0) {
            Spacer()

            ZStack(alignment: .bottom) {
                // Panel background: contained rectangle with rounded top
                panelBackground

                // Text content
                panelContent
            }
            // Shift panel upward so the name bar bridges into the art area
            .offset(y: -nameBarBridgeOffset)
        }
        .frame(width: size.width, height: size.height)
    }

    private var panelBackground: some View {
        VStack(spacing: 0) {
            Spacer()
            ZStack {
                // Faction-specific text panel texture base
                Image(factionTextPanelAssetName)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(
                        width: size.width - panelHorizontalInset * 2,
                        height: size.height * textPanelHeightRatio
                    )
                    .clipped()
                    .brightness(0.05)

                // Darkening overlay for text readability
                Color.black.opacity(0.30)

                // Paper grain on text panel for extra print texture
                Image("CardTextures/paper-texture")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(
                        width: size.width - panelHorizontalInset * 2,
                        height: size.height * textPanelHeightRatio
                    )
                    .clipped()
                    .blendMode(.overlay)
                    .opacity(0.12)
            }
            .frame(
                width: size.width - panelHorizontalInset * 2,
                height: size.height * textPanelHeightRatio
            )
            .clipShape(RoundedRectangle(cornerRadius: panelTopCornerRadius))
            // Inner shadow — top edge darkened (recessed into card)
            .overlay(alignment: .top) {
                LinearGradient(
                    colors: [Color.black.opacity(0.4), Color.clear],
                    startPoint: .top,
                    endPoint: .init(x: 0.5, y: 0.3)
                )
                .frame(height: size.height * textPanelHeightRatio * 0.3)
                .clipShape(RoundedRectangle(cornerRadius: panelTopCornerRadius))
            }
            // Bottom edge highlight (light hitting the recessed edge)
            .overlay(alignment: .bottom) {
                LinearGradient(
                    colors: [Color.clear, Color(hex: "#8B7355").opacity(0.15)],
                    startPoint: .init(x: 0.5, y: 0.7),
                    endPoint: .bottom
                )
                .frame(height: size.height * textPanelHeightRatio * 0.2)
                .clipShape(RoundedRectangle(cornerRadius: panelTopCornerRadius))
            }
            .padding(.horizontal, panelHorizontalInset)
            // Faction-colored top border on text panel — like a gilt edge
            .overlay(alignment: .top) {
                RoundedRectangle(cornerRadius: panelTopCornerRadius)
                    .stroke(factionBorderColor.opacity(0.35), lineWidth: 0.5)
                    .frame(height: size.height * textPanelHeightRatio)
                    .padding(.horizontal, panelHorizontalInset)
            }
        }
        .frame(width: size.width, height: size.height)
    }

    private var panelTopCornerRadius: CGFloat {
        switch size {
        case .grid: return 6
        case .hand: return 5
        case .detail, .fullscreen: return 10
        }
    }

    private var panelHorizontalInset: CGFloat {
        switch size {
        case .grid, .hand: return 3
        case .detail, .fullscreen: return 4
        }
    }

    private var textPanelHeightRatio: CGFloat {
        switch size {
        case .grid: return 0.30
        case .hand: return 0.22
        case .detail, .fullscreen: return 0.25
        }
    }

    @ViewBuilder
    private var panelContent: some View {
        switch size {
        case .grid:
            gridPanel
        case .hand:
            handPanel
        case .detail, .fullscreen:
            detailPanel
        }
    }

    /// Off-white text color — like ink on aged parchment, not digital white.
    /// Matches design spec #F0EAD6 throughout all card text.
    private var parchmentTextColor: Color { Color(hex: "#F0EAD6") }

    // MARK: - Grid Panel (112x157) -- Name only, minimal

    private var gridPanel: some View {
        VStack(spacing: 0) {
            Text(data.name)
                .font(CardFont.body(size: 10))
                .foregroundColor(parchmentTextColor)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity, alignment: .center)
                .shadow(color: .black.opacity(0.8), radius: 2, x: 0, y: 1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
        .padding(.top, 4)
        .padding(.bottom, 4)
    }

    // MARK: - Hand Panel (90x130) -- Name + keyword dots

    private var handPanel: some View {
        VStack(spacing: 2) {
            Text(data.name)
                .font(CardFont.cardName(size: 9))
                .foregroundColor(parchmentTextColor)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .frame(maxWidth: .infinity, alignment: .leading)
                .shadow(color: .black.opacity(0.8), radius: 2, x: 0, y: 1)

            // Keyword dots (up to 3)
            if !data.keywords.isEmpty {
                HStack(spacing: 3) {
                    ForEach(Array(data.keywords.prefix(3))) { keyword in
                        Circle()
                            .fill(keywordColor(keyword))
                            .frame(width: 6, height: 6)
                            .shadow(color: keywordColor(keyword).opacity(0.5), radius: 1)
                    }
                    Spacer()
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 6)
        .padding(.top, 4)
    }

    // MARK: - Detail Panel (280x392) -- Full info

    private var detailPanel: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Card name
            Text(data.name)
                .font(CardFont.cardName(size: 22))
                .foregroundColor(parchmentTextColor)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity, alignment: .leading)
                .shadow(color: .black.opacity(0.8), radius: 3, x: 0, y: 1)

            // Type line + faction icon
            HStack(spacing: 6) {
                if let emblemAsset = data.factionEmblemAssetName {
                    Image(emblemAsset)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 16, height: 16)
                        .opacity(0.8)
                }

                Text(data.typeLine)
                    .font(CardFont.body(size: 12))
                    .foregroundColor(parchmentTextColor.opacity(0.70))
                    .lineLimit(1)

                Spacer()
            }

            // Keywords (full pill badges with text)
            if !data.keywords.isEmpty {
                keywordBadgesRow
            }

            // Flavor text
            if !data.flavorText.isEmpty {
                Text(data.flavorText)
                    .font(CardFont.flavorText(size: 12))
                    .foregroundColor(parchmentTextColor.opacity(0.55))
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)
                    .padding(.top, 2)
            }
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 14)
        .padding(.top, 8)
    }

    // MARK: - Keyword Badges Row (Detail only)

    /// Maximum visible keywords before showing "more" indicator.
    private let maxVisibleKeywords = 2

    private var keywordBadgesRow: some View {
        HStack(spacing: 4) {
            ForEach(Array(data.keywords.prefix(maxVisibleKeywords))) { keyword in
                keywordBadge(keyword: keyword)
            }

            // "More" chevron when keywords exceed the visible limit
            if data.keywords.count > maxVisibleKeywords {
                let extraCount = data.keywords.count - maxVisibleKeywords
                HStack(spacing: 2) {
                    Text("+\(extraCount)")
                        .font(CardFont.body(size: 10))
                        .lineLimit(1)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 8, weight: .semibold))
                }
                .foregroundColor(factionAccentColor)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(factionAccentColor.opacity(0.12))
                .cornerRadius(4)
            }
        }
    }

    /// Faction accent color for the "more" keywords chevron.
    private var factionAccentColor: Color {
        guard let faction = data.faction else { return parchmentTextColor }
        return Color.factionAccent(faction)
    }

    private func keywordBadge(keyword: Keyword) -> some View {
        HStack(spacing: 3) {
            Image(keyword.customIconName)
                .renderingMode(.template)
                .font(.system(size: 10, weight: .semibold))

            Text(keyword.displayName)
                .font(CardFont.body(size: 10))
                .lineLimit(1)
        }
        .foregroundColor(keywordColor(keyword))
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(keywordColor(keyword).opacity(0.15))
        .cornerRadius(4)
    }

    // MARK: - CM Badge (Top-Right)

    private var cmBadge: some View {
        MedallionBadge(
            value: data.manaCost, size: cmBadgeSize,
            iconName: factionCmIconName,
            tintColor: Color(hex: "#0D47A1")
        )
    }

    private var cmBadgeSize: CGFloat {
        switch size {
        case .grid: return 22
        case .hand: return 20
        case .detail, .fullscreen: return 36
        }
    }

    private var cmInset: CGFloat {
        switch size {
        case .grid: return 5
        case .hand: return 4
        case .detail, .fullscreen: return 8
        }
    }

    // MARK: - ATK Badge (Bottom-Left)

    private func atkBadgeOverlay(atk: Int) -> some View {
        VStack {
            Spacer()
            HStack {
                MedallionBadge(
                    value: atk, size: atkHpBadgeSize,
                    iconName: factionAtkIconName,
                    tintColor: Color(hex: "#BF360C")
                )
                Spacer()
            }
            .padding(.leading, atkHpInset)
            .padding(.bottom, atkHpBottomInset)
        }
        .frame(width: size.width, height: size.height)
    }

    // MARK: - HP Badge (Bottom-Right)

    private func hpBadgeOverlay(hp: Int) -> some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                MedallionBadge(
                    value: hp, size: atkHpBadgeSize,
                    iconName: factionHpIconName,
                    tintColor: Color(hex: "#1B5E20")
                )
            }
            .padding(.trailing, atkHpInset)
            .padding(.bottom, atkHpBottomInset)
        }
        .frame(width: size.width, height: size.height)
    }

    // MARK: - Instability Badge (Top-Left)

    private func instabilityBadgeOverlay(value: Int) -> some View {
        VStack {
            HStack {
                MedallionBadge(
                    value: value, size: instabilityBadgeSize,
                    iconName: "StatIcons/instability-indicator",
                    tintColor: Color(hex: "#FF8F00")
                )
                    .padding(.leading, instabilityInset)
                    .padding(.top, instabilityInset)
                Spacer()
            }
            Spacer()
        }
        .frame(width: size.width, height: size.height)
    }

    private var instabilityBadgeSize: CGFloat {
        switch size {
        case .grid: return 22
        case .hand: return 20
        case .detail, .fullscreen: return 36
        }
    }

    private var instabilityInset: CGFloat {
        switch size {
        case .grid: return 5
        case .hand: return 4
        case .detail, .fullscreen: return 8
        }
    }

    private var atkHpBadgeSize: CGFloat {
        switch size {
        case .grid: return 22
        case .hand: return 20
        case .detail, .fullscreen: return 36
        }
    }

    private var atkHpInset: CGFloat {
        switch size {
        case .grid: return 4
        case .hand: return 4
        case .detail, .fullscreen: return 8
        }
    }

    private var atkHpBottomInset: CGFloat {
        switch size {
        case .grid: return 4
        case .hand: return 4
        case .detail, .fullscreen: return 8
        }
    }

    // MARK: - Evolution Tier Chevron Badge (Top-Left)

    private var evolutionChevronBadge: some View {
        VStack {
            HStack {
                Text(tierChevronText)
                    .font(CardFont.cardName(size: tierChevronFontSize))
                    .foregroundColor(Color.tierColor(data.tier))
                    .shadow(color: Color.tierColor(data.tier).opacity(0.6), radius: 3)
                    .padding(.horizontal, tierChevronPaddingH)
                    .padding(.vertical, tierChevronPaddingV)
                    .background(
                        Capsule()
                            .fill(Color.black.opacity(0.55))
                    )
                    .overlay(
                        Capsule()
                            .stroke(Color.tierColor(data.tier).opacity(0.4), lineWidth: 0.5)
                    )
                    .padding(.leading, tierChevronLeadingInset)
                    .padding(.top, tierChevronTopInset)
                Spacer()
            }
            Spacer()
        }
        .frame(width: size.width, height: size.height)
    }

    private var tierChevronText: String {
        switch data.tier {
        case .common: return ""
        case .uncommon: return "\u{2227}" // single chevron ^
        case .rare: return "\u{2227}\u{2227}" // ^^
        case .epic: return "\u{2227}\u{2227}\u{2227}" // ^^^
        case .legendary: return "\u{2606}" // star outline
        }
    }

    private var tierChevronFontSize: CGFloat {
        switch size {
        case .grid: return 8
        case .hand: return 7
        case .detail, .fullscreen: return 14
        }
    }

    private var tierChevronPaddingH: CGFloat {
        switch size {
        case .grid, .hand: return 3
        case .detail, .fullscreen: return 6
        }
    }

    private var tierChevronPaddingV: CGFloat {
        switch size {
        case .grid, .hand: return 1
        case .detail, .fullscreen: return 3
        }
    }

    /// Leading inset shifts right if instability badge is shown at top-left
    private var tierChevronLeadingInset: CGFloat {
        let hasInstability: Bool
        if let inst = data.instability, data.showsCreatureStats {
            hasInstability = (size == .detail || size == .fullscreen) || (inst > 0 && size == .hand)
        } else {
            hasInstability = false
        }
        let base: CGFloat = (size == .detail || size == .fullscreen) ? 8 : 4
        if hasInstability {
            return base + instabilityBadgeSize + 2
        }
        return base
    }

    private var tierChevronTopInset: CGFloat {
        switch size {
        case .grid, .hand: return 4
        case .detail, .fullscreen: return 8
        }
    }

    // MARK: - Evolution Ready Badge

    private var evolutionReadyBadge: some View {
        VStack {
            HStack {
                Spacer()
                Image("UIIcons/ui-evolution-sparkle")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: size == .grid ? 14 : 12, height: size == .grid ? 14 : 12)
                    .foregroundColor(.tauntGold)
                    .shadow(color: .tauntGold.opacity(0.5), radius: 3)
                    .padding(4)
            }
            Spacer()
        }
        .frame(width: size.width, height: size.height)
    }

    // MARK: - Faction Decorative Overlay

    /// Subtle faction-specific decorative accents visible at detail/fullscreen scale.
    /// Corner accents, inner glow tints, and faction emblem watermark.
    @ViewBuilder
    private var factionDecorativeOverlay: some View {
        ZStack {
            // Faction emblem watermark in text panel area
            if let emblemAsset = data.factionEmblemAssetName {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Image(emblemAsset)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: size.width * 0.22, height: size.width * 0.22)
                            .opacity(0.07)
                            .blendMode(.screen)
                        Spacer()
                    }
                    .padding(.bottom, size.height * textPanelHeightRatio * 0.3)
                }
            }

            // Faction-specific accents
            switch data.faction {
            case .ironwright:
                ironwrightAccents
            case .feyCourts:
                feyAccents
            case .demonicKingdoms:
                demonicAccents
            case .celestialCrusade:
                celestialAccents
            case .theEndless:
                endlessAccents
            case nil:
                EmptyView()
            }
        }
        .frame(width: size.width, height: size.height)
        .allowsHitTesting(false)
    }

    /// Ironwright: bolt rivets at 4 corners.
    private var ironwrightAccents: some View {
        let rivetSize: CGFloat = size == .fullscreen ? 7 : 5
        let inset: CGFloat = borderWidth + 2
        return ZStack {
            ForEach(0..<4) { i in
                Circle()
                    .fill(Color(hex: "#6B7B8D").opacity(0.6))
                    .frame(width: rivetSize, height: rivetSize)
                    .overlay(
                        Circle()
                            .stroke(Color(hex: "#4A5568").opacity(0.8), lineWidth: 0.5)
                    )
                    .overlay(
                        Circle()
                            .fill(Color.white.opacity(0.2))
                            .frame(width: rivetSize * 0.4, height: rivetSize * 0.4)
                            .offset(x: -rivetSize * 0.12, y: -rivetSize * 0.12)
                    )
                    .position(
                        x: i % 2 == 0 ? inset + rivetSize / 2 : size.width - inset - rivetSize / 2,
                        y: i < 2 ? inset + rivetSize / 2 : size.height - inset - rivetSize / 2
                    )
            }
        }
    }

    /// Fey Courts: tiny leaf-bud dots at corners + organic inner glow.
    private var feyAccents: some View {
        let budSize: CGFloat = size == .fullscreen ? 5 : 4
        let inset: CGFloat = borderWidth + 3
        return ZStack {
            // Bioluminescent inner glow at corners
            RadialGradient(
                colors: [Color(hex: "#7FFFD4").opacity(0.06), .clear],
                center: .topLeading,
                startRadius: 0,
                endRadius: size.width * 0.4
            )
            RadialGradient(
                colors: [Color(hex: "#7FFFD4").opacity(0.04), .clear],
                center: .bottomTrailing,
                startRadius: 0,
                endRadius: size.width * 0.4
            )

            // Leaf bud dots at top corners
            ForEach(0..<2) { i in
                Ellipse()
                    .fill(Color(hex: "#2E8B57").opacity(0.5))
                    .frame(width: budSize, height: budSize * 1.4)
                    .rotationEffect(.degrees(i == 0 ? -30 : 30))
                    .position(
                        x: i == 0 ? inset + budSize : size.width - inset - budSize,
                        y: inset + budSize
                    )
            }
        }
    }

    /// Demonic Kingdoms: faint lava vein glow at bottom edge.
    private var demonicAccents: some View {
        VStack {
            Spacer()
            // Lava glow at bottom border
            LinearGradient(
                colors: [.clear, Color(hex: "#FF4500").opacity(0.08)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: size.height * 0.15)
        }
    }

    /// Celestial Crusade: gold filigree inner border accent.
    private var celestialAccents: some View {
        RoundedRectangle(cornerRadius: cornerRadius - 1)
            .stroke(
                LinearGradient(
                    colors: [
                        Color(hex: "#DAA520").opacity(0.12),
                        Color(hex: "#FFD700").opacity(0.06),
                        Color(hex: "#DAA520").opacity(0.12)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                lineWidth: 1
            )
            .padding(borderWidth + 1)
    }

    /// The Endless: necrotic teal inner glow.
    private var endlessAccents: some View {
        ZStack {
            // Soul-light inner glow from edges
            RoundedRectangle(cornerRadius: cornerRadius)
                .stroke(
                    Color(hex: "#2DD4BF").opacity(0.08),
                    lineWidth: 3
                )
                .blur(radius: 3)
                .padding(borderWidth)
        }
    }

    // MARK: - Helper Colors

    private var factionBgColor: Color {
        guard let faction = data.faction else { return .bgQuaternary }
        return Color.factionPrimary(faction)
    }

    private var factionBorderColor: Color {
        guard let faction = data.faction else { return Color(hex: "#888888") }
        return factionPrimaryBorderColor(faction)
    }

    /// Faction border color for rarity treatment overlay.
    private func factionPrimaryBorderColor(_ faction: FactionShortName) -> Color {
        switch faction {
        case .ironwright: return Color(hex: "#C9A84C")
        case .feyCourts: return Color(hex: "#4CAF50")
        case .demonicKingdoms: return Color(hex: "#E63946")
        case .celestialCrusade: return Color(hex: "#DAA520")
        case .theEndless: return Color(hex: "#6B3FA0")
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
}

// MARK: - Rarity Border Modifier

/// Applies rarity-based border treatment using the card border itself.
/// Common = plain matte border. Uncommon = thin silver metallic inner line.
/// Rare = gold metallic inner border. Epic = holographic foil overlay (gyroscope-driven).
/// Legendary = full foil border + art overlay + extended art bleed.
private struct RarityBorderModifier: ViewModifier {
    let tier: EvolutionTier
    let faction: FactionShortName?
    let cornerRadius: CGFloat

    @State private var isPulsing = false
    @State private var shimmerPhase: CGFloat = 0
    @ObservedObject private var gyroscope = GyroscopeManager.shared

    private var factionColor: Color {
        guard let faction = faction else { return Color(hex: "#888888") }
        switch faction {
        case .ironwright: return Color(hex: "#C9A84C")
        case .feyCourts: return Color(hex: "#4CAF50")
        case .demonicKingdoms: return Color(hex: "#E63946")
        case .celestialCrusade: return Color(hex: "#DAA520")
        case .theEndless: return Color(hex: "#6B3FA0")
        }
    }

    func body(content: Content) -> some View {
        switch tier {
        case .common:
            // Plain warm brown border — the base matte card look. No metallic elements.
            content

        case .uncommon:
            // Thin silver metallic inner border line (1px, #C0C0C0, 0.6 opacity)
            // + faction-colored outer shadow + slightly richer canvas weave
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius - 1)
                        .stroke(Color(hex: "#C0C0C0").opacity(0.60), lineWidth: 1)
                        .padding(1)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(factionColor.opacity(0.30), lineWidth: 1.5)
                )
                .shadow(color: factionColor.opacity(0.15), radius: 4)

        case .rare:
            // Gold metallic inner border (1.5px, #FFD700, 0.7 opacity)
            // + faction-colored border + 6px pulsing glow
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius - 1)
                        .stroke(Color(hex: "#FFD700").opacity(0.70), lineWidth: 1.5)
                        .padding(1)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(factionColor.opacity(0.50), lineWidth: 2)
                )
                .shadow(
                    color: factionColor.opacity(isPulsing ? 0.35 : 0.20),
                    radius: isPulsing ? 8 : 4
                )
                .onAppear {
                    withAnimation(
                        .easeInOut(duration: 3.0)
                        .repeatForever(autoreverses: true)
                    ) {
                        isPulsing = true
                    }
                }

        case .epic:
            // Gradient border + holographic foil overlay on card border
            // Foil offset driven by gyroscope tilt data
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    factionColor.opacity(0.80),
                                    Color(hex: "#FFFDE7").opacity(0.60),
                                    factionColor.opacity(0.80)
                                ],
                                startPoint: isPulsing ? .topLeading : .bottomTrailing,
                                endPoint: isPulsing ? .bottomTrailing : .topLeading
                            ),
                            lineWidth: 2.5
                        )
                )
                // Holographic foil overlay on the border region
                .overlay(
                    Image("RarityEffects/holographic-foil")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .offset(
                            x: gyroscope.tiltX * 30,
                            y: gyroscope.tiltY * 20
                        )
                        .blendMode(.overlay)
                        .opacity(0.20)
                        .clipShape(
                            // Only show foil on the border region (mask out the inner art area)
                            RarityFoilBorderMask(
                                cornerRadius: cornerRadius,
                                borderWidth: 0 // full card coverage at low opacity
                            )
                        )
                        .allowsHitTesting(false)
                )
                .shadow(color: factionColor.opacity(0.40), radius: 8)
                .onAppear {
                    gyroscope.startIfNeeded()
                    withAnimation(
                        .easeInOut(duration: 3.0)
                        .repeatForever(autoreverses: true)
                    ) {
                        isPulsing = true
                    }
                }
                .onDisappear {
                    gyroscope.stopIfUnneeded()
                }

        case .legendary:
            // Gold prismatic border at full opacity + 12px golden glow + animated shimmer
            // + holographic foil at higher opacity + subtle art overlay
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(
                            AngularGradient(
                                colors: [
                                    Color(hex: "#FFD700"),
                                    Color(hex: "#FFF8E1"),
                                    Color(hex: "#FFD700"),
                                    Color(hex: "#FF8F00"),
                                    Color(hex: "#FFD700")
                                ],
                                center: .center,
                                startAngle: .degrees(shimmerPhase),
                                endAngle: .degrees(shimmerPhase + 360)
                            ),
                            lineWidth: 3.5
                        )
                )
                // Full holographic foil border at higher opacity (0.35)
                .overlay(
                    Image("RarityEffects/holographic-foil")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .offset(
                            x: gyroscope.tiltX * 40,
                            y: gyroscope.tiltY * 30
                        )
                        .blendMode(.overlay)
                        .opacity(0.35)
                        .clipShape(
                            RarityFoilBorderMask(
                                cornerRadius: cornerRadius,
                                borderWidth: 0
                            )
                        )
                        .allowsHitTesting(false)
                )
                // Subtle foil overlay on art area (very low opacity)
                .overlay(
                    Image("RarityEffects/holographic-foil")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .offset(
                            x: gyroscope.tiltX * 20,
                            y: gyroscope.tiltY * 15
                        )
                        .blendMode(.softLight)
                        .opacity(0.08)
                        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
                        .allowsHitTesting(false)
                )
                .shadow(color: Color(hex: "#FFD700").opacity(0.35), radius: 12)
                .shadow(color: Color(hex: "#FFD700").opacity(0.15), radius: 4)
                .onAppear {
                    gyroscope.startIfNeeded()
                    withAnimation(
                        .linear(duration: 4.0)
                        .repeatForever(autoreverses: false)
                    ) {
                        shimmerPhase = 360
                    }
                }
                .onDisappear {
                    gyroscope.stopIfUnneeded()
                }
        }
    }
}

// MARK: - Rarity Foil Border Mask Shape

/// A shape that masks to the border region of a rounded rectangle.
/// When borderWidth > 0, it shows only the border strip.
/// When borderWidth == 0, it shows the full card area (for low-opacity full-card foil).
private struct RarityFoilBorderMask: Shape {
    let cornerRadius: CGFloat
    let borderWidth: CGFloat

    func path(in rect: CGRect) -> Path {
        if borderWidth <= 0 {
            // Full card coverage
            return Path(roundedRect: rect, cornerRadius: cornerRadius)
        }
        // Border-only: outer minus inner
        var path = Path(roundedRect: rect, cornerRadius: cornerRadius)
        let insetRect = rect.insetBy(dx: borderWidth, dy: borderWidth)
        let innerRadius = max(cornerRadius - borderWidth, 2)
        path.addPath(Path(roundedRect: insetRect, cornerRadius: innerRadius))
        return path
    }
}

// MARK: - Keyword Asset Name Extension

extension Keyword {
    /// SF Symbol name for this keyword's icon (legacy, kept for backwards compatibility).
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

// MARK: - CardFrameView Previews

#Preview("Rarity Tiers - Grid") {
    HStack(spacing: 6) {
        ForEach(
            [
                ("Recruit", EvolutionTier.common, FactionShortName.ironwright),
                ("Veteran", EvolutionTier.uncommon, FactionShortName.feyCourts),
                ("Champion", EvolutionTier.rare, FactionShortName.demonicKingdoms),
                ("Archon", EvolutionTier.epic, FactionShortName.celestialCrusade),
                ("Ascended", EvolutionTier.legendary, FactionShortName.theEndless)
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
                        keywords: [.shield]
                    ),
                    size: .grid
                )
                Text(tier.displayName)
                    .font(.caption2)
                    .foregroundColor(.textSecondary)
            }
        }
    }
    .padding()
    .background(Color.bgPrimary)
}

#Preview("Rarity Tiers - Detail") {
    ScrollView(.horizontal) {
        HStack(spacing: 12) {
            ForEach(
                [
                    ("Iron Recruit", EvolutionTier.common, FactionShortName.ironwright),
                    ("Fey Veteran", EvolutionTier.uncommon, FactionShortName.feyCourts),
                    ("Demon Champion", EvolutionTier.rare, FactionShortName.demonicKingdoms),
                    ("Celestial Archon", EvolutionTier.epic, FactionShortName.celestialCrusade),
                    ("Endless Ascended", EvolutionTier.legendary, FactionShortName.theEndless)
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
                            keywords: [.shield, .taunt, .lifesteal, .haste],
                            flavorText: "A warrior forged in \(tier.displayName) fire."
                        ),
                        size: .detail
                    )
                    Text(tier.displayName)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
        }
        .padding()
    }
    .background(Color.bgPrimary)
}

#Preview("Hand Size") {
    HStack(spacing: 8) {
        CardFrameView(
            data: CardDisplayData(
                name: "Iron Sentinel",
                artUrl: nil,
                manaCost: 3,
                attack: 4,
                health: 5,
                instability: 2,
                tier: .uncommon,
                faction: .ironwright,
                keywords: [.shield, .taunt, .lifesteal]
            ),
            size: .hand
        )

        CardFrameView(
            data: CardDisplayData(
                name: "Arcane Bolt",
                artUrl: nil,
                manaCost: 2,
                tier: .common,
                cardType: .spell,
                faction: .feyCourts
            ),
            size: .hand
        )
    }
    .padding()
    .background(Color.bgPrimary)
}

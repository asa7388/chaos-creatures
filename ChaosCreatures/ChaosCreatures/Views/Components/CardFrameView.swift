// CardFrameView.swift
// Chaos Creatures
// Professional full-art card renderer with physical paper-card aesthetic.
// Oil-painting style cards: shaped stat badges, paper texture overlay, inner vignette,
// parchment-brown double border, contained text panel with arched top.
// Rarity treatments use the card border itself (faction-colored with glow/shimmer).
// Source: CLAUDE.md Card Visual System, docs/design/07-ui-ux-specs.md Section 5

import SwiftUI

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
                .foregroundColor(Color(hex: "#F0E6D2"))
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
            artLayer
                .padding(borderWidth)

            // Layer 2: Canvas texture overlay (makes art feel painted on physical canvas)
            Image("CardTextures/canvas-weave")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: size.width - borderWidth * 2, height: size.height - borderWidth * 2)
                .clipped()
                .blendMode(.overlay)
                .opacity(0.15)
                .padding(borderWidth)
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
        .shadow(color: .black.opacity(0.4), radius: 8, x: 0, y: 4)
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

    // MARK: - Wood-Textured Border Frame

    /// Dark wood grain border that frames the card art, like a physical card stock edge.
    private var borderFrame: some View {
        Image("CardTextures/card-border-wood")
            .resizable()
            .aspectRatio(contentMode: .fill)
            .frame(width: size.width, height: size.height)
            .clipped()
            .brightness(-0.1)
            .overlay(
                // Warm parchment tint — like aged card stock
                Color(hex: "#3D2B1A").opacity(0.15)
            )
    }

    // MARK: - Full-Bleed Art Layer

    /// Inner art dimensions (inset by border width on all sides).
    private var artWidth: CGFloat { size.width - borderWidth * 2 }
    private var artHeight: CGFloat { size.height - borderWidth * 2 }
    private var innerCornerRadius: CGFloat { max(cornerRadius - borderWidth, 4) }

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
                    .font(.system(size: max(artWidth * 0.2, 12)))
                    .foregroundColor(.textDisabled)
            )
    }

    // MARK: - Contained Text Panel

    private var textPanel: some View {
        VStack(spacing: 0) {
            Spacer()

            ZStack(alignment: .bottom) {
                // Panel background: contained rectangle with rounded top
                panelBackground

                // Text content
                panelContent
            }
        }
        .frame(width: size.width, height: size.height)
    }

    private var panelBackground: some View {
        VStack(spacing: 0) {
            Spacer()
            ZStack {
                // Dark vellum/leather texture base
                Image("CardTextures/dark-vellum")
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

    /// Warm cream text color — like ink on aged parchment, not digital white.
    private var parchmentTextColor: Color { Color(hex: "#F0E6D2") }

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
                    .foregroundColor(Color(hex: "#BBBBBB"))
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
                    .foregroundColor(Color(hex: "#999999"))
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

    private var keywordBadgesRow: some View {
        HStack(spacing: 4) {
            ForEach(data.keywords) { keyword in
                keywordBadge(keyword: keyword)
            }
        }
    }

    private func keywordBadge(keyword: Keyword) -> some View {
        HStack(spacing: 3) {
            Image(systemName: keyword.sfSymbolName)
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
        CMBadgeView(value: data.manaCost, size: cmBadgeSize)
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
                ATKBadgeView(value: atk, size: atkHpBadgeSize)
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
                HPBadgeView(value: hp, size: atkHpBadgeSize)
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
                InstabilityBadgeView(value: value, size: instabilityBadgeSize)
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
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: size == .grid ? 14 : 12))
                    .foregroundColor(.tauntGold)
                    .shadow(color: .tauntGold.opacity(0.5), radius: 3)
                    .padding(4)
            }
            Spacer()
        }
        .frame(width: size.width, height: size.height)
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
/// Common = plain brown border. Higher rarities use faction color with increasing glow/shimmer.
private struct RarityBorderModifier: ViewModifier {
    let tier: EvolutionTier
    let faction: FactionShortName?
    let cornerRadius: CGFloat

    @State private var isPulsing = false
    @State private var shimmerPhase: CGFloat = 0

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
            // Plain warm brown border — the base card look. No extra glow.
            content

        case .uncommon:
            // Faction-colored border at 50% + subtle outer shadow
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(factionColor.opacity(0.50), lineWidth: 2)
                )
                .shadow(color: factionColor.opacity(0.15), radius: 4)

        case .rare:
            // Faction-colored border at 70% + 6px glow + slow 3s pulse on shadow
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(factionColor.opacity(0.70), lineWidth: 2)
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
            // Gradient border cycling faction color and white-gold + 8px glow + shimmer
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
                .shadow(color: factionColor.opacity(0.40), radius: 8)
                .onAppear {
                    withAnimation(
                        .easeInOut(duration: 3.0)
                        .repeatForever(autoreverses: true)
                    ) {
                        isPulsing = true
                    }
                }

        case .legendary:
            // Gold border at full opacity + 12px golden glow + animated shimmer
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
                            lineWidth: 3
                        )
                )
                .shadow(color: Color(hex: "#FFD700").opacity(0.35), radius: 12)
                .shadow(color: Color(hex: "#FFD700").opacity(0.15), radius: 4)
                .onAppear {
                    withAnimation(
                        .linear(duration: 4.0)
                        .repeatForever(autoreverses: false)
                    ) {
                        shimmerPhase = 360
                    }
                }
        }
    }
}

// MARK: - Keyword Asset Name Extension

extension Keyword {
    /// SF Symbol name for this keyword's icon.
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

#Preview("Grid Size") {
    HStack(spacing: 8) {
        CardFrameView(
            data: CardDisplayData(
                name: "Iron Sentinel",
                artUrl: nil,
                manaCost: 3,
                attack: 4,
                health: 5,
                instability: 2,
                tier: .common,
                faction: .ironwright,
                keywords: [.shield, .taunt]
            ),
            size: .grid
        )

        CardFrameView(
            data: CardDisplayData(
                name: "Fey Whisperer",
                artUrl: nil,
                manaCost: 2,
                attack: 2,
                health: 3,
                instability: 1,
                tier: .rare,
                faction: .feyCourts,
                keywords: [.flying]
            ),
            size: .grid
        )

        CardFrameView(
            data: CardDisplayData(
                name: "Hellfire Drake",
                artUrl: nil,
                manaCost: 5,
                attack: 6,
                health: 4,
                instability: 4,
                tier: .legendary,
                faction: .demonicKingdoms,
                keywords: [.piercing, .deathtouch]
            ),
            size: .grid
        )
    }
    .padding()
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

#Preview("Detail Size") {
    CardFrameView(
        data: CardDisplayData(
            name: "Iron Sentinel, Forged Warden",
            artUrl: nil,
            manaCost: 3,
            attack: 4,
            health: 5,
            instability: 3,
            tier: .epic,
            faction: .ironwright,
            keywords: [.shield, .taunt, .lifesteal],
            flavorText: "Through the flames of industry, a new guardian is born."
        ),
        size: .detail
    )
    .padding()
    .background(Color.bgPrimary)
}

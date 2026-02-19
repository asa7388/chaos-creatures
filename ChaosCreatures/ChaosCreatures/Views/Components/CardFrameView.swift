// CardFrameView.swift
// Chaos Creatures
// Full-art card renderer with unified text panel. No bordered frames.
// Art fills 100% of the card. All card info is in a gradient text panel at the bottom ~28%.
// Source: CLAUDE.md Card Visual System, docs/design/07-ui-ux-specs.md Section 5

import SwiftUI

// MARK: - Card Display Size

enum CardDisplaySize {
    /// Grid view in collection (~100x140pt). Condensed: name + ATK/HP only.
    case grid
    /// Hand view in battle (~90x130pt). Condensed: name + ATK/HP only.
    case hand
    /// Detail view in card detail sheet (~280x392pt). Full info: all elements.
    case detail

    var width: CGFloat {
        switch self {
        case .grid: return 100
        case .hand: return 90
        case .detail: return 280
        }
    }

    var height: CGFloat {
        switch self {
        case .grid: return 140
        case .hand: return 130
        case .detail: return 392
        }
    }

    var showKeywords: Bool {
        self == .detail
    }

    var showFlavorText: Bool {
        self == .detail
    }

    var showTypeLine: Bool {
        self == .detail
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
        case .ironwright: return "FactionEmblems/ironwright"
        case .feyCourts: return "FactionEmblems/fey"
        case .demonicKingdoms: return "FactionEmblems/demonic"
        case .celestialCrusade: return "FactionEmblems/celestial"
        case .theEndless: return "FactionEmblems/endless"
        case nil: return nil
        }
    }
}

// MARK: - CardFrameView

struct CardFrameView: View {
    let data: CardDisplayData
    let size: CardDisplaySize

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Layer 1: Full-bleed card art (fills 100% of card)
            artLayer

            // Layer 2: Gradient text panel at bottom ~28%
            textPanel

            // Layer 3: Mana cost badge (top-right corner)
            manaCostBadge

            // Layer 4: Evolution ready indicator (grid/hand only)
            if data.isEvolutionReady && size != .detail {
                evolutionReadyBadge
            }
        }
        .frame(width: size.width, height: size.height)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .modifier(RarityGlowModifier(tier: data.tier, cornerRadius: cornerRadius))
    }

    // MARK: - Corner Radius

    private var cornerRadius: CGFloat {
        switch size {
        case .grid, .hand: return 8
        case .detail: return 14
        }
    }

    // MARK: - Full-Bleed Art Layer

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
                            .frame(width: size.width, height: size.height)
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
        .frame(width: size.width, height: size.height)
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
            .frame(width: size.width, height: size.height)
            .overlay(
                Image(systemName: "photo")
                    .font(.system(size: max(size.width * 0.2, 12)))
                    .foregroundColor(.textDisabled)
            )
    }

    // MARK: - Unified Text Panel (Bottom ~28%)

    private var textPanel: some View {
        VStack(spacing: 0) {
            Spacer()

            ZStack(alignment: .bottom) {
                // Gradient background: clear at top -> 78% opacity black at bottom
                LinearGradient(
                    stops: [
                        .init(color: .clear, location: 0.0),
                        .init(color: .black.opacity(0.35), location: 0.25),
                        .init(color: .black.opacity(0.78), location: 0.65),
                        .init(color: .black.opacity(0.88), location: 1.0)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: size.height * textPanelHeightRatio)

                // Text content
                panelContent
            }
        }
        .frame(width: size.width, height: size.height)
    }

    private var textPanelHeightRatio: CGFloat {
        switch size {
        case .grid, .hand: return 0.32
        case .detail: return 0.36
        }
    }

    @ViewBuilder
    private var panelContent: some View {
        switch size {
        case .grid, .hand:
            condensedPanel
        case .detail:
            fullPanel
        }
    }

    // MARK: - Condensed Panel (Grid / Hand) — Name + Stats

    private var condensedPanel: some View {
        VStack(spacing: 2) {
            // Card name
            Text(data.name)
                .font(CardFont.cardName(size: condensedNameFontSize))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .frame(maxWidth: .infinity, alignment: .leading)

            // ATK/HP stats row
            if data.cardType == .planarRuin, let hp = data.health {
                // Ruins show HP only (no ATK)
                HStack(spacing: 0) {
                    Spacer()
                    statIcon(imageName: "StatIcons/heart-hp", value: hp, color: .healGreen)
                }
            } else if let atk = data.attack, let hp = data.health {
                HStack(spacing: 0) {
                    Spacer()
                    statIcon(imageName: "StatIcons/sword-atk", value: atk, color: .damageOrange)
                    Spacer().frame(width: 6)
                    statIcon(imageName: "StatIcons/heart-hp", value: hp, color: .healGreen)
                }
            }
        }
        .padding(.horizontal, 6)
        .padding(.bottom, 6)
        .padding(.top, 4)
    }

    private var condensedNameFontSize: CGFloat {
        size == .grid ? 9 : 8
    }

    // MARK: - Full Panel (Detail) — All Info

    private var fullPanel: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Card name
            Text(data.name)
                .font(CardFont.cardName(size: 18))
                .foregroundColor(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Type line + faction badge
            HStack(spacing: 6) {
                Text(data.typeLine)
                    .font(CardFont.body(size: 12))
                    .foregroundColor(Color(hex: "#BBBBBB"))
                    .lineLimit(1)

                if let faction = data.faction {
                    factionBadge(faction: faction)
                }

                Spacer()
            }

            // Keywords
            if !data.keywords.isEmpty {
                keywordBadgesRow
            }

            // Flavor text
            if !data.flavorText.isEmpty {
                Text(data.flavorText)
                    .font(CardFont.flavorText(size: 11))
                    .foregroundColor(Color(hex: "#999999"))
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)
                    .padding(.top, 2)
            }

            // ATK/HP stats row (bottom-right)
            if data.cardType == .planarRuin, let hp = data.health {
                // Ruins show HP only (no ATK)
                HStack(spacing: 0) {
                    Spacer()
                    statIcon(imageName: "StatIcons/heart-hp", value: hp, color: .healGreen)
                }
                .padding(.top, 2)
            } else if let atk = data.attack, let hp = data.health {
                HStack(spacing: 0) {
                    Spacer()
                    statIcon(imageName: "StatIcons/sword-atk", value: atk, color: .damageOrange)
                    Spacer().frame(width: 10)
                    statIcon(imageName: "StatIcons/heart-hp", value: hp, color: .healGreen)
                }
                .padding(.top, 2)
            }
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 12)
        .padding(.top, 8)
    }

    // MARK: - Stat Icon (ATK / HP)

    private func statIcon(imageName: String, value: Int, color: Color) -> some View {
        HStack(spacing: statIconSpacing) {
            Image(imageName)
                .resizable()
                .renderingMode(.template)
                .aspectRatio(contentMode: .fit)
                .frame(width: statIconSize, height: statIconSize)
                .foregroundColor(color)

            Text("\(value)")
                .font(CardFont.stats(size: statFontSize))
                .foregroundColor(color)
        }
    }

    private var statIconSize: CGFloat {
        switch size {
        case .grid: return 10
        case .hand: return 9
        case .detail: return 18
        }
    }

    private var statIconSpacing: CGFloat {
        switch size {
        case .grid, .hand: return 2
        case .detail: return 4
        }
    }

    private var statFontSize: CGFloat {
        switch size {
        case .grid: return 11
        case .hand: return 10
        case .detail: return 20
        }
    }

    // MARK: - Faction Badge (Colored Pill)

    private func factionBadge(faction: FactionShortName) -> some View {
        Text(faction.shortDisplayName)
            .font(CardFont.body(size: 9))
            .foregroundColor(.white)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(
                Capsule()
                    .fill(factionBadgeColor(faction))
            )
    }

    private func factionBadgeColor(_ faction: FactionShortName) -> Color {
        switch faction {
        case .ironwright: return Color(hex: "#e8c06a")
        case .feyCourts: return Color(hex: "#6edba0")
        case .demonicKingdoms: return Color(hex: "#e86a6a")
        case .celestialCrusade: return Color(hex: "#DAA520")
        case .theEndless: return Color(hex: "#9B72CF")
        }
    }

    // MARK: - Keyword Badges Row

    private var keywordBadgesRow: some View {
        HStack(spacing: 4) {
            ForEach(data.keywords) { keyword in
                keywordBadge(keyword: keyword)
            }
        }
    }

    private func keywordBadge(keyword: Keyword) -> some View {
        HStack(spacing: 3) {
            Image(keyword.assetIconName)
                .resizable()
                .renderingMode(.template)
                .aspectRatio(contentMode: .fit)
                .frame(width: 12, height: 12)

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

    // MARK: - Mana Cost Badge (Top-Right)

    private var manaCostBadge: some View {
        HStack(spacing: manaCostIconSpacing) {
            Image("StatIcons/chaos-motes")
                .resizable()
                .renderingMode(.template)
                .aspectRatio(contentMode: .fit)
                .frame(width: manaCostIconSize, height: manaCostIconSize)
                .foregroundColor(.white)

            Text("\(data.manaCost)")
                .font(CardFont.stats(size: manaCostFontSize))
                .foregroundColor(.white)
        }
        .padding(.horizontal, manaCostPillPaddingH)
        .padding(.vertical, manaCostPillPaddingV)
        .background(
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "#1565C0"), Color(hex: "#0D47A1")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
        )
        .overlay(
            Capsule()
                .stroke(Color.white.opacity(0.3), lineWidth: 1)
        )
        .shadow(color: Color(hex: "#1565C0").opacity(0.5), radius: 3)
        .padding(.trailing, manaCostEdgePadding)
        .padding(.top, manaCostEdgePadding)
    }

    private var manaCostIconSize: CGFloat {
        switch size {
        case .grid: return 9
        case .hand: return 8
        case .detail: return 16
        }
    }

    private var manaCostIconSpacing: CGFloat {
        switch size {
        case .grid, .hand: return 2
        case .detail: return 4
        }
    }

    private var manaCostFontSize: CGFloat {
        switch size {
        case .grid: return 10
        case .hand: return 9
        case .detail: return 16
        }
    }

    private var manaCostPillPaddingH: CGFloat {
        switch size {
        case .grid, .hand: return 4
        case .detail: return 8
        }
    }

    private var manaCostPillPaddingV: CGFloat {
        switch size {
        case .grid, .hand: return 2
        case .detail: return 4
        }
    }

    private var manaCostEdgePadding: CGFloat {
        switch size {
        case .grid, .hand: return 4
        case .detail: return 8
        }
    }

    // MARK: - Evolution Ready Badge

    private var evolutionReadyBadge: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: size == .grid ? 14 : 12))
                    .foregroundColor(.tauntGold)
                    .shadow(color: .tauntGold.opacity(0.5), radius: 3)
                    .padding(4)
            }
        }
        .frame(width: size.width, height: size.height)
    }

    // MARK: - Helper Colors

    private var factionBgColor: Color {
        guard let faction = data.faction else { return .bgQuaternary }
        return Color.factionPrimary(faction)
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

// MARK: - Rarity Glow Modifier

/// Applies rarity-based glow effects via shadow modifiers instead of frame overlays.
private struct RarityGlowModifier: ViewModifier {
    let tier: EvolutionTier
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        switch tier {
        case .common:
            // No special border
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
                )

        case .uncommon:
            // Subtle silver border + shadow
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(Color(hex: "#C0C0C0").opacity(0.5), lineWidth: 1)
                )
                .shadow(color: Color(hex: "#C0C0C0").opacity(0.3), radius: 4)

        case .rare:
            // Blue glow border + shadow
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(Color(hex: "#2196F3").opacity(0.6), lineWidth: 1.5)
                )
                .shadow(color: Color(hex: "#2196F3").opacity(0.4), radius: 6)

        case .epic:
            // Purple glow border + shadow
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color(hex: "#9C27B0").opacity(0.7),
                                    Color(hex: "#CE93D8").opacity(0.8),
                                    Color(hex: "#9C27B0").opacity(0.7)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2
                        )
                )
                .shadow(color: Color(hex: "#9C27B0").opacity(0.5), radius: 8)

        case .legendary:
            // Gold glow border + shadow
            content
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color(hex: "#FFD700").opacity(0.8),
                                    Color(hex: "#FFA000").opacity(0.9),
                                    Color(hex: "#FFD700").opacity(0.8),
                                    Color(hex: "#FFA000").opacity(0.9)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2.5
                        )
                )
                .shadow(color: Color(hex: "#FFD700").opacity(0.5), radius: 10)
                .shadow(color: Color(hex: "#FFA000").opacity(0.3), radius: 4)
        }
    }
}

// MARK: - Keyword Asset Name Extension

extension Keyword {
    /// The asset catalog image name for this keyword's icon.
    /// Format matches SK.KeywordIcons.assetName() -- e.g. "KeywordIcons/shield"
    var assetIconName: String {
        switch self {
        case .shield: return "KeywordIcons/shield"
        case .lifesteal: return "KeywordIcons/lifesteal"
        case .flying: return "KeywordIcons/flying"
        case .reach: return "KeywordIcons/reach"
        case .deathtouch: return "KeywordIcons/deathtouch"
        case .taunt: return "KeywordIcons/taunt"
        case .piercing: return "KeywordIcons/piercing"
        case .haste: return "KeywordIcons/haste"
        case .ward: return "KeywordIcons/ward"
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

#Preview("Detail Size") {
    CardFrameView(
        data: CardDisplayData(
            name: "Iron Sentinel, Forged Warden",
            artUrl: nil,
            manaCost: 3,
            attack: 4,
            health: 5,
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

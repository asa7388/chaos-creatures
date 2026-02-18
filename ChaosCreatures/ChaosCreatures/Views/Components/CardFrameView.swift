// CardFrameView.swift
// Chaos Creatures
// Professional card rendering component that composites frame, art, text, and stat badges.
// Replaces the old placeholder card rendering with real card frames and themed typography.
// Source: CLAUDE.md Card Visual System, docs/design/07-ui-ux-specs.md Section 5

import SwiftUI

// MARK: - Card Display Size

enum CardDisplaySize {
    /// Grid view in collection (~100x140pt). Minimal info: art, frame, mana cost, tiny ATK/HP.
    case grid
    /// Hand view in battle (~90x130pt). Similar to grid.
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
        self.cardType = instance.currentAttack != nil ? .creature : .spell
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

    // MARK: - Frame Asset Name

    /// Returns the asset catalog name for this card's frame image.
    /// Format matches SK.CardFrames.assetName() — e.g. "CardFrames/ironwright-common"
    var frameAssetName: String {
        switch cardType {
        case .spell:
            return "CardFrames/spell"
        case .stabilizer:
            return "CardFrames/stabilizer"
        case .creature:
            let factionPrefix = factionFramePrefix
            let tierSuffix = frameTierSuffix
            return "CardFrames/\(factionPrefix)-\(tierSuffix)"
        }
    }

    private var factionFramePrefix: String {
        switch faction {
        case .ironwright: return "ironwright"
        case .feyCourts: return "fey"
        case .demonicKingdoms: return "demonic"
        case nil: return "ironwright" // Fallback
        }
    }

    private var frameTierSuffix: String {
        switch tier {
        case .common, .uncommon: return "common"
        case .rare: return "rare"
        case .epic, .legendary: return "legendary"
        }
    }

    /// Faction emblem asset name for watermark.
    /// Format matches SK.FactionEmblems.assetName() — e.g. "FactionEmblems/ironwright"
    var factionEmblemAssetName: String? {
        switch faction {
        case .ironwright: return "FactionEmblems/ironwright"
        case .feyCourts: return "FactionEmblems/fey"
        case .demonicKingdoms: return "FactionEmblems/demonic"
        case nil: return nil
        }
    }

    /// Type line text (e.g. "Creature -- Ironwright", "Spell -- Fey Courts").
    var typeLine: String {
        let typeText = cardType.displayName
        if let faction = faction {
            return "\(typeText) \u{2014} \(faction.shortDisplayName)"
        }
        return typeText
    }
}

// MARK: - CardFrameView

struct CardFrameView: View {
    let data: CardDisplayData
    let size: CardDisplaySize

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height

            ZStack(alignment: .topLeading) {
                // Layer 1: Card art (fills art window area)
                artLayer(width: w, height: h)

                // Layer 2: Frame overlay
                frameLayer(width: w, height: h)

                // Layer 3: Faction emblem watermark (behind text, very subtle)
                if size == .detail {
                    emblemWatermark(width: w, height: h)
                }

                // Layer 4: Card name bar
                cardNameOverlay(width: w, height: h)

                // Layer 5: Type line (detail only)
                if size.showTypeLine {
                    typeLineOverlay(width: w, height: h)
                }

                // Layer 6: Keywords (detail only)
                if size.showKeywords && !data.keywords.isEmpty {
                    keywordsOverlay(width: w, height: h)
                }

                // Layer 7: Flavor text (detail only)
                if size.showFlavorText && !data.flavorText.isEmpty {
                    flavorTextOverlay(width: w, height: h)
                }

                // Layer 8: Mana cost badge (top-right)
                manaCostBadge(width: w, height: h)

                // Layer 9: ATK/HP badges (bottom corners, creatures only)
                if data.attack != nil, data.health != nil {
                    statBadges(width: w, height: h)
                }

                // Layer 10: Rarity glow border
                rarityBorder(width: w, height: h)

                // Layer 11: Evolution ready indicator
                if data.isEvolutionReady && size != .detail {
                    evolutionReadyBadge(width: w, height: h)
                }
            }
        }
        .frame(width: size.width, height: size.height)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }

    // MARK: - Corner Radius

    private var cornerRadius: CGFloat {
        switch size {
        case .grid, .hand: return 8
        case .detail: return 14
        }
    }

    // MARK: - Art Layer

    private func artLayer(width: CGFloat, height: CGFloat) -> some View {
        let artHeight = height * artHeightRatio

        return VStack(spacing: 0) {
            if let urlString = data.artUrl, !urlString.isEmpty, let url = URL(string: urlString) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        artPlaceholder(width: width, height: artHeight)
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: width, height: artHeight)
                            .clipped()
                    case .failure:
                        artPlaceholder(width: width, height: artHeight)
                    @unknown default:
                        artPlaceholder(width: width, height: artHeight)
                    }
                }
                .frame(width: width, height: artHeight)
            } else {
                artPlaceholder(width: width, height: artHeight)
            }
            Spacer(minLength: 0)
        }
    }

    private var artHeightRatio: CGFloat {
        switch size {
        case .grid, .hand: return 0.65
        case .detail: return 0.55
        }
    }

    private func artPlaceholder(width: CGFloat, height: CGFloat) -> some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [factionBgColor.opacity(0.3), Color.bgTertiary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: width, height: height)
            .overlay(
                Image(systemName: "photo")
                    .font(.system(size: max(width * 0.2, 12)))
                    .foregroundColor(.textDisabled)
            )
    }

    // MARK: - Frame Layer

    private func frameLayer(width: CGFloat, height: CGFloat) -> some View {
        Image(data.frameAssetName)
            .resizable()
            .aspectRatio(contentMode: .fill)
            .frame(width: width, height: height)
            .clipped()
            .allowsHitTesting(false)
    }

    // MARK: - Faction Emblem Watermark

    private func emblemWatermark(width: CGFloat, height: CGFloat) -> some View {
        Group {
            if let emblemName = data.factionEmblemAssetName {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Image(emblemName)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: width * 0.35)
                            .opacity(0.06)
                        Spacer()
                    }
                    Spacer()
                        .frame(height: height * 0.08)
                }
            }
        }
    }

    // MARK: - Card Name

    private func cardNameOverlay(width: CGFloat, height: CGFloat) -> some View {
        let nameY = height * nameYRatio
        let fontSize = nameFontSize

        return VStack(spacing: 0) {
            Spacer()
                .frame(height: nameY)

            // Name bar background
            ZStack {
                Rectangle()
                    .fill(Color.bgPrimary.opacity(nameBarOpacity))
                    .frame(height: nameBarHeight)

                Text(data.name)
                    .font(CardFont.cardName(size: fontSize))
                    .foregroundColor(.textPrimary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .padding(.horizontal, namePadding)
            }

            Spacer(minLength: 0)
        }
    }

    private var nameYRatio: CGFloat {
        switch size {
        case .grid, .hand: return 0.62
        case .detail: return 0.53
        }
    }

    private var nameFontSize: CGFloat {
        switch size {
        case .grid: return 9
        case .hand: return 8
        case .detail: return 18
        }
    }

    private var nameBarHeight: CGFloat {
        switch size {
        case .grid, .hand: return 18
        case .detail: return 34
        }
    }

    private var nameBarOpacity: Double {
        switch size {
        case .grid, .hand: return 0.7
        case .detail: return 0.8
        }
    }

    private var namePadding: CGFloat {
        switch size {
        case .grid, .hand: return 4
        case .detail: return 16
        }
    }

    // MARK: - Type Line

    private func typeLineOverlay(width: CGFloat, height: CGFloat) -> some View {
        VStack(spacing: 0) {
            Spacer()
                .frame(height: height * 0.59)

            Text(data.typeLine)
                .font(CardFont.body(size: 12))
                .foregroundColor(.textSecondary)
                .lineLimit(1)
                .padding(.horizontal, 16)

            Spacer(minLength: 0)
        }
    }

    // MARK: - Keywords

    private func keywordsOverlay(width: CGFloat, height: CGFloat) -> some View {
        VStack(spacing: 0) {
            Spacer()
                .frame(height: height * 0.64)

            HStack(spacing: 4) {
                ForEach(data.keywords) { keyword in
                    compactKeywordBadge(keyword: keyword)
                }
            }
            .padding(.horizontal, 12)

            Spacer(minLength: 0)
        }
    }

    private func compactKeywordBadge(keyword: Keyword) -> some View {
        HStack(spacing: 3) {
            // Use asset catalog keyword icon with SF Symbol fallback
            Image(keyword.assetIconName)
                .resizable()
                .renderingMode(.template)
                .aspectRatio(contentMode: .fit)
                .frame(width: keywordIconSize, height: keywordIconSize)

            if size == .detail {
                Text(keyword.displayName)
                    .font(CardFont.body(size: 10))
                    .lineLimit(1)
            }
        }
        .foregroundColor(keywordColor(keyword))
        .padding(.horizontal, size == .detail ? 6 : 3)
        .padding(.vertical, 2)
        .background(keywordColor(keyword).opacity(0.15))
        .cornerRadius(4)
    }

    private var keywordIconSize: CGFloat {
        switch size {
        case .grid, .hand: return 8
        case .detail: return 12
        }
    }

    // MARK: - Flavor Text

    private func flavorTextOverlay(width: CGFloat, height: CGFloat) -> some View {
        VStack(spacing: 0) {
            Spacer()
                .frame(height: height * 0.72)

            Text(data.flavorText)
                .font(CardFont.flavorText(size: 11))
                .foregroundColor(.textTertiary)
                .multilineTextAlignment(.center)
                .lineLimit(3)
                .padding(.horizontal, 16)

            Spacer(minLength: 0)
        }
    }

    // MARK: - Mana Cost Badge

    private func manaCostBadge(width: CGFloat, height: CGFloat) -> some View {
        let gemSize = manaGemSize

        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                Spacer()
                ZStack {
                    // Gem background
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color(hex: "#1565C0"), Color(hex: "#0D47A1")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: gemSize, height: gemSize)
                        .shadow(color: Color(hex: "#1565C0").opacity(0.6), radius: 3)

                    // Outer ring
                    Circle()
                        .stroke(Color.white.opacity(0.3), lineWidth: 1)
                        .frame(width: gemSize, height: gemSize)

                    // Cost number
                    Text("\(data.manaCost)")
                        .font(CardFont.stats(size: gemSize * 0.5))
                        .foregroundColor(.white)
                }
                .padding(.trailing, manaCostPadding)
                .padding(.top, manaCostPadding)
            }
            Spacer(minLength: 0)
        }
    }

    private var manaGemSize: CGFloat {
        switch size {
        case .grid: return 22
        case .hand: return 20
        case .detail: return 36
        }
    }

    private var manaCostPadding: CGFloat {
        switch size {
        case .grid, .hand: return 4
        case .detail: return 8
        }
    }

    // MARK: - Stat Badges (ATK / HP)

    private func statBadges(width: CGFloat, height: CGFloat) -> some View {
        VStack(spacing: 0) {
            Spacer()

            HStack(spacing: 0) {
                // ATK badge (bottom-left)
                if let atk = data.attack {
                    statBadge(
                        value: atk,
                        icon: "bolt.fill",
                        color: .damageOrange,
                        bgColor: Color(hex: "#1A0800")
                    )
                    .padding(.leading, statBadgePadding)
                }

                Spacer()

                // HP badge (bottom-right)
                if let hp = data.health {
                    statBadge(
                        value: hp,
                        icon: "heart.fill",
                        color: .healGreen,
                        bgColor: Color(hex: "#001A00")
                    )
                    .padding(.trailing, statBadgePadding)
                }
            }
            .padding(.bottom, statBadgePadding)
        }
    }

    private func statBadge(value: Int, icon: String, color: Color, bgColor: Color) -> some View {
        let badgeSize = statBadgeSize

        return ZStack {
            // Badge shape
            RoundedRectangle(cornerRadius: badgeSize * 0.2)
                .fill(bgColor.opacity(0.85))
                .frame(width: badgeSize, height: badgeSize)

            RoundedRectangle(cornerRadius: badgeSize * 0.2)
                .stroke(color.opacity(0.6), lineWidth: 1)
                .frame(width: badgeSize, height: badgeSize)

            VStack(spacing: size == .detail ? 1 : 0) {
                if size == .detail {
                    Image(systemName: icon)
                        .font(.system(size: badgeSize * 0.22))
                        .foregroundColor(color.opacity(0.7))
                }

                Text("\(value)")
                    .font(CardFont.stats(size: statFontSize))
                    .foregroundColor(color)
            }
        }
    }

    private var statBadgeSize: CGFloat {
        switch size {
        case .grid: return 22
        case .hand: return 20
        case .detail: return 44
        }
    }

    private var statFontSize: CGFloat {
        switch size {
        case .grid: return 11
        case .hand: return 10
        case .detail: return 20
        }
    }

    private var statBadgePadding: CGFloat {
        switch size {
        case .grid, .hand: return 3
        case .detail: return 8
        }
    }

    // MARK: - Rarity Border

    private func rarityBorder(width: CGFloat, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .stroke(
                rarityBorderGradient,
                lineWidth: rarityBorderWidth
            )
            .frame(width: width, height: height)
            .opacity(rarityBorderOpacity)
    }

    private var rarityBorderWidth: CGFloat {
        switch data.tier {
        case .common: return 1
        case .uncommon: return 1.5
        case .rare: return 2
        case .epic: return 2.5
        case .legendary: return 3
        }
    }

    private var rarityBorderOpacity: Double {
        switch data.tier {
        case .common: return 0.3
        case .uncommon: return 0.5
        case .rare: return 0.7
        case .epic: return 0.8
        case .legendary: return 1.0
        }
    }

    private var rarityBorderGradient: LinearGradient {
        let color = Color.tierColor(data.tier)
        switch data.tier {
        case .common:
            return LinearGradient(
                colors: [color.opacity(0.3), color.opacity(0.5)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .uncommon:
            return LinearGradient(
                colors: [color.opacity(0.5), color],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .rare:
            return LinearGradient(
                colors: [color, color.opacity(0.7), color],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .epic:
            return LinearGradient(
                colors: [
                    Color(hex: "#9C27B0"),
                    Color(hex: "#CE93D8"),
                    Color(hex: "#9C27B0")
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        case .legendary:
            return LinearGradient(
                colors: [
                    Color(hex: "#FFD700"),
                    Color(hex: "#FFA000"),
                    Color(hex: "#FFD700"),
                    Color(hex: "#FFA000")
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    // MARK: - Evolution Ready Badge

    private func evolutionReadyBadge(width: CGFloat, height: CGFloat) -> some View {
        VStack(spacing: 0) {
            Spacer()
            HStack(spacing: 0) {
                Spacer()
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: size == .grid ? 14 : 12))
                    .foregroundColor(.tauntGold)
                    .shadow(color: .tauntGold.opacity(0.5), radius: 3)
                    .padding(4)
            }
        }
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
        }
    }
}

// MARK: - Keyword Asset Name Extension

extension Keyword {
    /// The asset catalog image name for this keyword's icon.
    /// Format matches SK.KeywordIcons.assetName() — e.g. "KeywordIcons/shield"
    var assetIconName: String {
        switch self {
        case .shield: return "KeywordIcons/shield"
        case .lifesteal: return "KeywordIcons/lifesteal"
        case .flying: return "KeywordIcons/flying"
        case .reach: return "KeywordIcons/reach"
        case .deathtouch: return "KeywordIcons/deathtouch"
        case .taunt: return "KeywordIcons/taunt"
        case .piercing: return "KeywordIcons/piercing"
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

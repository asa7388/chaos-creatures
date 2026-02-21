// CardFrameView.swift
// Chaos Creatures
// Professional full-art card renderer with physical paper-card aesthetic.
// Oil-painting style cards: wax-seal stat badges, paper texture overlay, inner vignette,
// parchment-brown double border, contained text panel with arched top.
// Rarity treatments use the card border itself (faction-colored with glow/shimmer).
// Source: CLAUDE.md Card Visual System, docs/design/07-ui-ux-specs.md Section 5

import SwiftUI
import CoreMotion

// MARK: - Card Display Size

enum CardDisplaySize {
    /// Grid view in collection (~112x157pt). Condensed: name plate + CM seal + faction icon + stat seals.
    case grid
    /// Hand view in battle (~90x130pt). Condensed: name plate + CM seal + keyword dots + stat seals.
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

// MARK: - Wax Seal Stat Badges

/// Wax-seal-style badge with faction seal shape, contact shadow, and embossed stat number.
/// Replaces the previous MedallionBadge with a richer physical aesthetic.
private struct WaxSealBadge: View {
    let value: Int
    let size: CGFloat
    let factionSealAsset: String?  // nil = neutral bronze circle fallback
    let tintColor: Color
    let iconName: String

    var body: some View {
        ZStack {
            sealShadow
            sealBody

            // Stat icon stamp (behind number, watermark effect)
            Image(iconName)
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size * 0.62, height: size * 0.62)
                .foregroundColor(Color(hex: "#F0EAD6").opacity(0.22))
                .offset(y: -size * 0.03)
                .mask(sealMask)

            // Top-lit highlight
            LinearGradient(
                colors: [Color.white.opacity(0.30), Color.clear],
                startPoint: .top,
                endPoint: .center
            )
            .frame(width: size * 0.90, height: size * 0.56)
            .offset(y: -size * 0.18)
            .blendMode(.screen)
            .mask(sealMask)

            // Number stamped into the seal
            Text("\(value)")
                .font(CardFont.statNumber(size: size * 0.50))
                .foregroundColor(Color(hex: "#F0EAD6"))
                .shadow(color: .black.opacity(0.8), radius: 0.5, x: 0, y: 1)
                .shadow(color: tintColor.opacity(0.3), radius: 2, x: 0, y: 0)
        }
        .frame(width: size, height: size)
    }

    @ViewBuilder
    private var sealBody: some View {
        if let sealAsset = factionSealAsset {
            Image(sealAsset)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .overlay(
                    tintColor.opacity(0.20)
                        .blendMode(.overlay)
                        .mask(
                            Image(sealAsset)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: size, height: size)
                        )
                )
                .overlay(
                    Image("CardTextures/tex-cardstock-grain")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: size, height: size)
                        .opacity(0.10)
                        .mask(
                            Image(sealAsset)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: size, height: size)
                        )
                )
        } else {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            tintColor.opacity(0.45),
                            Color(hex: "#2D2215"),
                            Color.black.opacity(0.94)
                        ],
                        center: .center,
                        startRadius: 1,
                        endRadius: size * 0.7
                    )
                )

            Image("CardTextures/metal-bronze")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: size, height: size)
                .clipShape(Circle())
                .opacity(0.55)

            Circle()
                .stroke(
                    LinearGradient(
                        colors: [Color(hex: "#AA8A54"), Color(hex: "#23180B")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: size * 0.08
                )

            Circle()
                .stroke(Color(hex: "#D4B896").opacity(0.4), lineWidth: 0.5)
                .padding(size * 0.06)
        }
    }

    @ViewBuilder
    private var sealMask: some View {
        if let sealAsset = factionSealAsset {
            Image(sealAsset)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
        } else {
            Circle()
                .frame(width: size, height: size)
        }
    }

    @ViewBuilder
    private var sealShadow: some View {
        if let sealAsset = factionSealAsset {
            Image(sealAsset)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .brightness(-1)
                .colorMultiply(.black)
                .opacity(0.48)
                .blur(radius: size * 0.08)
                .offset(y: size * 0.07)
        } else {
            Circle()
                .fill(Color.black.opacity(0.45))
                .frame(width: size * 0.92, height: size * 0.92)
                .blur(radius: size * 0.09)
                .offset(y: size * 0.07)
        }
    }
}

/// CM (Chaos Motes) wax seal badge — top-right.
struct CMBadgeView: View {
    let value: Int
    let size: CGFloat
    var factionSealAsset: String? = nil
    var body: some View {
        WaxSealBadge(
            value: value, size: size,
            factionSealAsset: factionSealAsset,
            tintColor: Color(hex: "#0D47A1"),
            iconName: "UIIcons/ui-chaos-mana"
        )
    }
}

/// ATK wax seal badge — bottom-left.
struct ATKBadgeView: View {
    let value: Int
    let size: CGFloat
    var factionSealAsset: String? = nil
    var body: some View {
        WaxSealBadge(
            value: value, size: size,
            factionSealAsset: factionSealAsset,
            tintColor: Color(hex: "#BF360C"),
            iconName: "UIIcons/ui-trigger-attack"
        )
    }
}

/// HP wax seal badge — bottom-right.
struct HPBadgeView: View {
    let value: Int
    let size: CGFloat
    var factionSealAsset: String? = nil
    var body: some View {
        WaxSealBadge(
            value: value, size: size,
            factionSealAsset: factionSealAsset,
            tintColor: Color(hex: "#1B5E20"),
            iconName: "KeywordIcons/kw-shield"
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

    /// Tooltip state for modifier keyword taps (detail/fullscreen only).
    @State private var activeTooltipKeyword: Keyword? = nil

    /// iPad scaling multiplier: 1.15x for badges and fonts on iPad.
    private var iPadScale: CGFloat {
        #if os(iOS)
        return UIDevice.current.userInterfaceIdiom == .pad ? 1.15 : 1.0
        #else
        return 1.0
        #endif
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            // Layer -1: Black base (prevents card back bleed)
            Color.black

            // Layer 0: Pre-baked card frame artwork (fallbacks to texture frame)
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

            // Layer 5: Lower thirds text panel
            textPanel

            // Layer 5.5: Faction decorative accents (detail/fullscreen only)
            if size == .detail || size == .fullscreen {
                factionDecorativeOverlay
            }

            // Layer 6: Card name plate (top-left corner)
            cardNamePlate

            // Layer 7: CM cost wax seal (top-right corner)
            cmBadgeOverlay

            // Layer 8: ATK badge (bottom-left, straddling art/panel boundary)
            if data.showsCreatureStats, let atk = data.attack {
                atkBadgeOverlay(atk: atk)
            }

            // Layer 9: HP badge (bottom-right, straddling art/panel boundary)
            if data.showsCreatureStats, let hp = data.health {
                hpBadgeOverlay(hp: hp)
            }

            // Layer 10: Evolution tier chevron badge (detail/fullscreen only)
            if data.tier != .common && (size == .detail || size == .fullscreen) {
                evolutionChevronBadge
            }

            // Layer 11: Evolution ready indicator (grid/hand only)
            if data.isEvolutionReady && size != .detail && size != .fullscreen {
                evolutionReadyBadge
            }

            // Layer 12: Modifier tooltip overlay (detail/fullscreen only)
            if let keyword = activeTooltipKeyword, size.showKeywords {
                modifierTooltipOverlay(keyword: keyword)
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

    // MARK: - Faction Seal Asset Resolution

    /// Resolves the faction-specific wax seal asset name for stat badges.
    /// Returns nil for neutral/unknown factions (falls back to bronze circle).
    private var factionSealAsset: String? {
        guard let faction = data.faction else { return nil }
        switch faction {
        case .ironwright: return "StatIcons/stat-seal-ironwright"
        case .feyCourts: return "StatIcons/stat-seal-fey"
        case .demonicKingdoms: return "StatIcons/stat-seal-demonic"
        case .celestialCrusade: return "StatIcons/stat-seal-celestial"
        case .theEndless: return "StatIcons/stat-seal-endless"
        }
    }

    // MARK: - Faction-Textured Border Frame

    /// Uses pre-baked card frame art where available.
    /// Falls back to faction texture frame for cards with unknown faction.
    private var borderFrame: some View {
        ZStack {
            Image(factionBorderAssetName)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: size.width, height: size.height)
                .clipped()

            Image(frameAssetName)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: size.width, height: size.height)
                .clipped()
        }
        .overlay(
            // Keep frame stack grounded in each faction's palette
            factionFrameTintColor.opacity(0.10)
        )
    }

    /// Deterministic per-card seed for selecting sub-faction visual variants.
    private var visualSeed: UInt32 {
        let key = "\(data.name)|\(data.manaCost)|\(data.cardType.rawValue)"
        return fnv1a32(key)
    }

    private var useAlternateSubfactionVisual: Bool {
        (visualSeed % 2) == 1
    }

    private func fnv1a32(_ input: String) -> UInt32 {
        var hash: UInt32 = 2_166_136_261
        for byte in input.utf8 {
            hash ^= UInt32(byte)
            hash = hash &* 16_777_619
        }
        return hash
    }

    /// Asset name for pre-baked card frame art.
    private var frameAssetName: String {
        if data.cardType == .planarRuin {
            return "CardFrames/planar-ruin"
        }
        guard let faction = data.faction else { return "CardTextures/card-border-wood" }

        let factionKey: String
        switch faction {
        case .ironwright: factionKey = "ironwright"
        case .feyCourts: factionKey = "fey"
        case .demonicKingdoms: factionKey = "demonic"
        case .celestialCrusade: factionKey = "celestial"
        case .theEndless: factionKey = "endless"
        }

        if data.cardType == .spell {
            return "CardFrames/\(factionKey)-spell"
        }
        if data.cardType == .stabilizer {
            return "CardFrames/\(factionKey)-stabilizer"
        }

        let rarityKey: String
        switch data.tier {
        case .common, .uncommon: rarityKey = "common"
        case .rare: rarityKey = "rare"
        case .epic, .legendary: rarityKey = "legendary"
        }
        return "CardFrames/\(factionKey)-\(rarityKey)"
    }

    /// Asset name for faction border texture.
    private var factionBorderAssetName: String {
        guard let faction = data.faction else { return "CardTextures/card-border-wood" }
        switch faction {
        case .ironwright: return "CardTextures/border-ironwright"
        case .feyCourts: return useAlternateSubfactionVisual ? "CardTextures/border-fey-hollow" : "CardTextures/border-fey-verdant"
        case .demonicKingdoms: return useAlternateSubfactionVisual ? "CardTextures/border-demonic-bureaucracy" : "CardTextures/border-demonic-furnace"
        case .celestialCrusade: return useAlternateSubfactionVisual ? "CardTextures/border-celestial-chosen" : "CardTextures/border-celestial-knights"
        case .theEndless: return useAlternateSubfactionVisual ? "CardTextures/border-endless-spectres" : "CardTextures/border-endless-cabals"
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
        case .feyCourts: return useAlternateSubfactionVisual ? "TextPanels/tp-fey-hollow" : "TextPanels/tp-fey-verdant"
        case .demonicKingdoms: return useAlternateSubfactionVisual ? "TextPanels/tp-demonic-bureaucracy" : "TextPanels/tp-demonic-furnace"
        case .celestialCrusade: return useAlternateSubfactionVisual ? "TextPanels/tp-celestial-chosen" : "TextPanels/tp-celestial-knights"
        case .theEndless: return useAlternateSubfactionVisual ? "TextPanels/tp-endless-spectres" : "TextPanels/tp-endless-cabals"
        }
    }

    /// Sub-faction emblem assets are used where available so generated emblem art is visible.
    private var factionEmblemAssetName: String? {
        guard let faction = data.faction else { return data.factionEmblemAssetName }
        switch faction {
        case .ironwright:
            return useAlternateSubfactionVisual ? "FactionEmblems/sub-scrap-legions" : "FactionEmblems/sub-foundry-directorate"
        case .feyCourts:
            return useAlternateSubfactionVisual ? "FactionEmblems/sub-hollow-court" : "FactionEmblems/sub-verdant-throne"
        case .demonicKingdoms:
            return useAlternateSubfactionVisual ? "FactionEmblems/sub-obsidian-bureaucracy" : "FactionEmblems/sub-furnace-lords"
        case .celestialCrusade:
            return useAlternateSubfactionVisual ? "FactionEmblems/sub-heavens-chosen" : "FactionEmblems/sub-knights-deliverance"
        case .theEndless:
            return useAlternateSubfactionVisual ? "FactionEmblems/sub-lost-spectres" : "FactionEmblems/sub-necromantic-cabals"
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
                Image("UIIcons/ui-hero")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: max(artWidth * 0.16, 12), height: max(artWidth * 0.16, 12))
                    .foregroundColor(.textDisabled.opacity(0.8))
            )
    }

    // MARK: - Card Name Plate (Top-Left)

    /// Contained name plate badge at the top-left of the card.
    private var cardNamePlate: some View {
        VStack {
            HStack {
                Text(data.name.uppercased())
                    .font(CardFont.cardName(size: namePlateFontSize * iPadScale))
                    .foregroundColor(parchmentTextColor)
                    .lineLimit(namePlateMaxLines)
                    .minimumScaleFactor(0.65)
                    .tracking(0.35)
                    // Letterpress inner shadow effect
                    .shadow(color: .black.opacity(0.55), radius: 0.4, x: 0, y: 0.5)
                    .padding(.horizontal, namePlatePaddingH)
                    .padding(.vertical, namePlatePaddingV)
                    .background(
                        ZStack {
                            LinearGradient(
                                colors: [
                                    Color(hex: "#3C301E").opacity(0.92),
                                    Color.black.opacity(0.80)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )

                            Image(factionTextPanelAssetName)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .opacity(0.18)
                        }
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                    .overlay(
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(factionBorderColor.opacity(0.56), lineWidth: 0.7)
                    )
                    .overlay(alignment: .top) {
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(Color.white.opacity(0.16), lineWidth: 0.35)
                            .padding(0.45)
                    }
                    .frame(maxWidth: namePlateMaxWidth, alignment: .leading)
                    .padding(.leading, namePlateInset)
                    .padding(.top, namePlateInset)
                    .shadow(color: Color.black.opacity(0.5), radius: 1.2, x: 0, y: 1)

                Spacer()
            }
            Spacer()
        }
        .frame(width: size.width, height: size.height)
    }

    private var namePlatePaddingH: CGFloat {
        switch size {
        case .grid: return 4
        case .hand: return 3.5
        case .detail: return 6
        case .fullscreen: return 7
        }
    }

    private var namePlatePaddingV: CGFloat {
        switch size {
        case .grid: return 2
        case .hand: return 1.5
        case .detail: return 3
        case .fullscreen: return 3.5
        }
    }

    private var namePlateFontSize: CGFloat {
        switch size {
        case .grid: return 10
        case .hand: return 9
        case .detail: return 18
        case .fullscreen: return 22
        }
    }

    private var namePlateMaxLines: Int {
        switch size {
        case .grid, .hand: return 1
        case .detail, .fullscreen: return 2
        }
    }

    private var namePlateMaxWidth: CGFloat {
        switch size {
        case .grid: return size.width * 0.66
        case .hand: return size.width * 0.68
        case .detail: return size.width * 0.56
        case .fullscreen: return size.width * 0.54
        }
    }

    private var namePlateInset: CGFloat {
        switch size {
        case .grid: return 6
        case .hand: return 5
        case .detail: return 9
        case .fullscreen: return 10
        }
    }

    // MARK: - Lower Thirds Text Panel (Redesigned)

    private var textPanel: some View {
        VStack(spacing: 0) {
            Spacer()
            ZStack(alignment: .bottom) {
                panelBackground
                panelContent
            }
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
                Color.black.opacity(size == .grid || size == .hand ? 0.34 : 0.42)

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
        case .detail, .fullscreen: return 11
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
        case .grid: return 0.25
        case .hand: return 0.24
        case .detail, .fullscreen: return 0.34
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

    // MARK: - Grid Panel (112x157) -- Faction icon + minimal info

    private var gridPanel: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Text(compactTypeLabel)
                    .font(CardFont.uiLabel(size: 7))
                    .foregroundColor(parchmentTextColor.opacity(0.68))
                    .tracking(0.5)
                    .lineLimit(1)

                Spacer(minLength: 0)

                if data.tier != .common {
                    Image(tierPipIconAsset)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 8, height: 8)
                        .opacity(0.95)
                }
            }
        }
        .padding(.horizontal, 7)
        .padding(.top, 6)
        .padding(.bottom, 8)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(Color.black.opacity(0.34))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(factionBorderColor.opacity(0.32), lineWidth: 0.6)
                )
        )
    }

    // MARK: - Hand Panel (90x130) -- Keyword dots

    private var handPanel: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Text(compactTypeLabel)
                    .font(CardFont.uiLabel(size: 6.5))
                    .foregroundColor(parchmentTextColor.opacity(0.65))
                    .tracking(0.45)
                    .lineLimit(1)

                Spacer(minLength: 0)
            }

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
        .padding(.horizontal, 7)
        .padding(.bottom, 6)
        .padding(.top, 5)
    }

    // MARK: - Detail Panel (280x392 / 350x490) -- Full info (Redesigned)

    private var detailPanel: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Type Line: faction icon + "CREATURE — IRONWRIGHT" left, "◆ INST X" right
            typeLineRow
                .padding(.bottom, 4)

            // Thin dashed divider
            thinDivider(color: factionBorderColor, opacity: 0.15, thickness: 0.5)
                .padding(.bottom, 5)

            // Modifier Names (middle — only if keywords exist)
            if !data.keywords.isEmpty {
                modifierNamesRow
                    .padding(.bottom, 4)

                // Thin dashed divider
                thinDivider(color: parchmentTextColor, opacity: 0.10, thickness: 0.3)
                    .padding(.bottom, 4)
            }

            // Flavor Text (bottom)
            if !data.flavorText.isEmpty {
                Text("\u{201C}\(data.flavorText)\u{201D}")
                    .font(CardFont.flavorText(size: (size == .fullscreen ? 12 : 11) * iPadScale))
                    .foregroundColor(parchmentTextColor.opacity(0.58))
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)
                    .truncationMode(.tail)
            }
        }
        .padding(.horizontal, 14)
        .padding(.bottom, detailPanelBottomPadding)
        .padding(.top, 8)
    }

    private var detailPanelBottomPadding: CGFloat {
        switch size {
        case .detail: return 24
        case .fullscreen: return 28
        case .grid, .hand: return 10
        }
    }

    /// Type line row: type text (left), instability (right)
    private var typeLineRow: some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(data.typeLine.uppercased())
                .font(CardFont.uiLabelBold(size: typeLineFontSize * iPadScale))
                .foregroundColor(parchmentTextColor.opacity(0.80))
                .tracking(0.4)
                .lineLimit(1)

            Spacer(minLength: 2)

            if let instability = data.instability {
                HStack(spacing: 2) {
                    Text("\u{25C6}")  // ◆ diamond
                    .font(CardFont.uiLabel(size: (size == .fullscreen ? 10 : 9) * iPadScale))
                    Text("INST \(instability)")
                        .font(CardFont.uiLabelBold(size: (size == .fullscreen ? 11 : 10) * iPadScale))
                }
                .foregroundColor(factionAccentColor.opacity(0.88))
            }
        }
    }

    private var typeLineFontSize: CGFloat {
        size == .fullscreen ? 13 : 12
    }

    /// Modifier names row: "Haste · Shield · Piercing" — tappable for tooltip
    private var modifierNamesRow: some View {
        let keywordList = data.keywords
        return HStack(spacing: 0) {
            ForEach(Array(keywordList.enumerated()), id: \.element) { index, keyword in
                if index > 0 {
                    Text(" \u{00B7} ")  // centered dot separator
                        .font(CardFont.bodyBold(size: modifierNameFontSize * iPadScale))
                        .foregroundColor(parchmentTextColor.opacity(0.50))
                }
                Text(keyword.displayName)
                    .font(CardFont.bodyBold(size: modifierNameFontSize * iPadScale))
                    .foregroundColor(parchmentTextColor.opacity(0.82))
                    .padding(.horizontal, 4)
                    .padding(.vertical, 1)
                    .background(
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.black.opacity(activeTooltipKeyword == keyword ? 0.42 : 0.18))
                            .overlay(
                                RoundedRectangle(cornerRadius: 3)
                                    .stroke(
                                        factionBorderColor.opacity(activeTooltipKeyword == keyword ? 0.48 : 0.20),
                                        lineWidth: 0.45
                                    )
                            )
                    )
                    .onTapGesture {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            if activeTooltipKeyword == keyword {
                                activeTooltipKeyword = nil
                            } else {
                                activeTooltipKeyword = keyword
                            }
                        }
                    }
            }
            Spacer(minLength: 0)
        }
    }

    private var modifierNameFontSize: CGFloat {
        size == .fullscreen ? 12 : 11
    }

    /// Thin solid divider line for text panel hierarchy
    private func thinDivider(color: Color, opacity: Double, thickness: CGFloat) -> some View {
        Rectangle()
            .fill(color.opacity(opacity))
            .frame(height: thickness)
    }

    // MARK: - Modifier Tooltip Overlay

    /// Inline tooltip appearing when user taps a modifier name.
    private func modifierTooltipOverlay(keyword: Keyword) -> some View {
        VStack {
            Spacer()

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Image(keyword.customIconName)
                            .renderingMode(.template)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 14 * iPadScale, height: 14 * iPadScale)
                            .foregroundColor(keywordColor(keyword))

                        Text(keyword.displayName)
                            .font(CardFont.bodyBold(size: 12 * iPadScale))
                            .foregroundColor(parchmentTextColor)
                    }

                    Text(keyword.description)
                        .font(CardFont.body(size: 11 * iPadScale))
                        .foregroundColor(parchmentTextColor.opacity(0.75))
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(
                    ZStack {
                        Color.black.opacity(0.85)
                        Image("CardTextures/tex-parchment")
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .opacity(0.10)
                    }
                )
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(factionBorderColor.opacity(0.60), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.6), radius: 4, x: 0, y: 2)
                .frame(maxWidth: size.width * 0.85)
                .padding(.horizontal, 8)
            }

            // Position above the panel area
            Spacer()
                .frame(height: size.height * textPanelHeightRatio + 10)
        }
        .frame(width: size.width, height: size.height)
        .contentShape(Rectangle())
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.15)) {
                activeTooltipKeyword = nil
            }
        }
    }

    // MARK: - CM Badge (Top-Right)

    private var cmBadgeOverlay: some View {
        VStack {
            HStack {
                Spacer()
                WaxSealBadge(
                    value: data.manaCost,
                    size: cmBadgeSize * iPadScale,
                    factionSealAsset: factionSealAsset,
                    tintColor: cmTintColor,
                    iconName: "UIIcons/ui-chaos-mana"
                )
                .padding(.trailing, cmInset)
                .padding(.top, cmInset)
            }
            Spacer()
        }
        .frame(width: size.width, height: size.height)
    }

    private var cmTintColor: Color {
        guard data.faction != nil else { return Color(hex: "#0D47A1") }
        return factionBorderColor.opacity(0.80)
    }

    private var cmBadgeSize: CGFloat {
        switch size {
        case .grid: return 24
        case .hand: return 20
        case .detail: return 36
        case .fullscreen: return 40
        }
    }

    private var cmInset: CGFloat {
        switch size {
        case .grid: return 6
        case .hand: return 5
        case .detail, .fullscreen: return 10
        }
    }

    // MARK: - ATK Badge (Bottom-Left, Straddling Art/Panel Boundary)

    private func atkBadgeOverlay(atk: Int) -> some View {
        let badgeSize = atkHpBadgeSize * iPadScale
        return VStack {
            Spacer()
            HStack {
                WaxSealBadge(
                    value: atk,
                    size: badgeSize,
                    factionSealAsset: factionSealAsset,
                    tintColor: Color(hex: "#BF360C"),
                    iconName: "UIIcons/ui-trigger-attack"
                )
                .padding(.leading, atkHpInset)
                .padding(.bottom, statBadgeBottomInset)
                Spacer()
            }
        }
        .frame(width: size.width, height: size.height)
    }

    // MARK: - HP Badge (Bottom-Right, Straddling Art/Panel Boundary)

    private func hpBadgeOverlay(hp: Int) -> some View {
        let badgeSize = atkHpBadgeSize * iPadScale
        return VStack {
            Spacer()
            HStack {
                Spacer()
                WaxSealBadge(
                    value: hp,
                    size: badgeSize,
                    factionSealAsset: factionSealAsset,
                    tintColor: Color(hex: "#1B5E20"),
                    iconName: "KeywordIcons/kw-shield"
                )
                .padding(.trailing, atkHpInset)
                .padding(.bottom, statBadgeBottomInset)
            }
        }
        .frame(width: size.width, height: size.height)
    }

    private var atkHpBadgeSize: CGFloat {
        switch size {
        case .grid: return 24
        case .hand: return 20
        case .detail: return 36
        case .fullscreen: return 40
        }
    }

    private var atkHpInset: CGFloat {
        switch size {
        case .grid: return 6
        case .hand: return 5
        case .detail, .fullscreen: return 10
        }
    }

    private var statBadgeBottomInset: CGFloat {
        switch size {
        case .grid: return 4
        case .hand: return 3
        case .detail: return 9
        case .fullscreen: return 11
        }
    }

    // MARK: - Evolution Tier Chevron Badge (Top-Left, after name plate)

    private var evolutionChevronBadge: some View {
        VStack {
            HStack {
                Text(tierChevronText)
                    .font(CardFont.cardName(size: tierChevronFontSize * iPadScale))
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

    private var tierChevronLeadingInset: CGFloat {
        // Position after name plate area
        let base: CGFloat = (size == .detail || size == .fullscreen) ? 8 : 4
        guard size == .detail || size == .fullscreen else { return base }
        // Place below name plate vertically instead — shift horizontal offset
        return base + namePlateInset
    }

    private var tierChevronTopInset: CGFloat {
        switch size {
        case .grid, .hand: return 4
        case .detail: return 36  // Below name plate
        case .fullscreen: return 42
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
            if let emblemAsset = factionEmblemAssetName {
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

    /// Ironwright: subtle forged-metal inner edge.
    private var ironwrightAccents: some View {
        RoundedRectangle(cornerRadius: cornerRadius - 1)
            .stroke(
                LinearGradient(
                    colors: [
                        Color(hex: "#89A1B8").opacity(0.12),
                        Color(hex: "#4B5A68").opacity(0.06),
                        Color(hex: "#89A1B8").opacity(0.10)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                lineWidth: 1
            )
            .padding(borderWidth + 1)
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

    // MARK: - Card Metadata Helpers

    private var compactTypeLabel: String {
        switch data.cardType {
        case .creature: return "CREATURE"
        case .spell: return "SPELL"
        case .stabilizer: return "STABILIZER"
        case .planarRuin: return "RUIN"
        }
    }

    private var tierPipIconAsset: String {
        switch data.tier {
        case .common: return "StatIcons/rarity-common"
        case .uncommon: return "StatIcons/rarity-uncommon"
        case .rare: return "StatIcons/rarity-rare"
        case .epic: return "StatIcons/rarity-epic"
        case .legendary: return "StatIcons/rarity-legendary"
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

    /// Faction accent color for instability and other highlights.
    private var factionAccentColor: Color {
        guard let faction = data.faction else { return parchmentTextColor }
        return Color.factionAccent(faction)
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

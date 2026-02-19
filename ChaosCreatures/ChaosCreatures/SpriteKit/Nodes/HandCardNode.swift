// HandCardNode.swift
// Chaos Creatures
// Individual card in hand — full-art design with unified text panel.
// Rendered in SpriteKit for drag-to-play interactions from within the scene.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SpriteKit

/// Represents a card in the player's hand within the SpriteKit scene.
/// Full-bleed art fills the card bounds. A dark semi-transparent panel at the
/// bottom 28% holds the card name and ATK/HP stats with sword-atk and heart-hp
/// icons. A mana cost badge with chaos-motes icon sits at the top-right.
final class HandCardNode: SKSpriteNode {

    // MARK: - Properties

    private(set) var cardData: BattleCardData
    private let cardArtNode: SKSpriteNode
    private let textPanel: SKSpriteNode
    private let nameLabel: SKLabelNode
    private let atkIcon: SKSpriteNode
    private let atkLabel: SKLabelNode
    private let hpIcon: SKSpriteNode
    private let hpLabel: SKLabelNode
    private let manaBadge: SKSpriteNode
    private let manaIcon: SKSpriteNode
    private let manaCostLabel: SKLabelNode
    private var keywordIcons: [SKSpriteNode] = []
    private var rarityOverlay: SKNode?

    var isDragging: Bool = false
    var originalPosition: CGPoint = .zero

    // MARK: - Init

    init(card: BattleCardData) {
        self.cardData = card
        let cardSize = SK.Card.handSize
        let panelHeight = cardSize.height * SK.Card.textPanelRatio

        let factionColor = card.factionPrimaryColor

        // --- Full-bleed card art (fills entire card) ---
        cardArtNode = SKSpriteNode(color: factionColor.withAlphaComponent(0.3), size: cardSize)
        cardArtNode.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        cardArtNode.position = .zero
        cardArtNode.zPosition = 0

        // --- Unified text panel at bottom 28% ---
        textPanel = SKSpriteNode(color: .black.withAlphaComponent(SK.Card.textPanelAlpha),
                                 size: CGSize(width: cardSize.width, height: panelHeight))
        textPanel.anchorPoint = CGPoint(x: 0.5, y: 0.0)
        textPanel.position = CGPoint(x: 0, y: -cardSize.height / 2)
        textPanel.zPosition = 1

        // --- Card name (upper portion of text panel) ---
        nameLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        nameLabel.fontSize = SK.Card.handNameFontSize
        nameLabel.fontColor = .white
        nameLabel.horizontalAlignmentMode = .center
        nameLabel.verticalAlignmentMode = .center
        nameLabel.position = CGPoint(x: 0, y: -cardSize.height / 2 + panelHeight * 0.65)
        nameLabel.zPosition = 2

        let displayName = card.name.count > 12 ? String(card.name.prefix(11)) + "\u{2026}" : card.name
        nameLabel.text = displayName

        // --- ATK: sword icon + label (bottom-left of text panel) ---
        let statIconSize = SK.Card.handStatIconSize
        let statFontSize = SK.Card.handStatFontSize
        let statsY = -cardSize.height / 2 + panelHeight * 0.25

        atkIcon = SKSpriteNode(imageNamed: "StatIcons/sword-atk")
        atkIcon.size = CGSize(width: statIconSize, height: statIconSize)
        atkIcon.position = CGPoint(x: -cardSize.width / 2 + 9, y: statsY)
        atkIcon.zPosition = 2

        atkLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        atkLabel.fontSize = statFontSize
        atkLabel.fontColor = UIColor(hex: "#FF7043")
        atkLabel.horizontalAlignmentMode = .left
        atkLabel.verticalAlignmentMode = .center
        atkLabel.position = CGPoint(x: -cardSize.width / 2 + 9 + statIconSize / 2 + 3, y: statsY)
        atkLabel.zPosition = 2

        hpIcon = SKSpriteNode(imageNamed: "StatIcons/heart-hp")
        hpIcon.size = CGSize(width: statIconSize, height: statIconSize)
        hpIcon.position = CGPoint(x: cardSize.width / 2 - 9, y: statsY)
        hpIcon.zPosition = 2

        hpLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        hpLabel.fontSize = statFontSize
        hpLabel.fontColor = UIColor(hex: "#4CAF50")
        hpLabel.horizontalAlignmentMode = .right
        hpLabel.verticalAlignmentMode = .center
        hpLabel.position = CGPoint(x: cardSize.width / 2 - 9 - statIconSize / 2 - 3, y: statsY)
        hpLabel.zPosition = 2

        // For creatures show ATK/HP; for spells/stabilizers show type label
        if let atk = card.baseAttack, let hp = card.baseHealth {
            atkLabel.text = "\(atk)"
            hpLabel.text = "\(hp)"
        } else {
            // Non-creature: hide stat icons, show type text centered
            atkIcon.isHidden = true
            hpIcon.isHidden = true
            atkLabel.text = ""
            hpLabel.text = ""

            // Use hpLabel for centered type text
            hpLabel.isHidden = true
            atkLabel.horizontalAlignmentMode = .center
            atkLabel.position = CGPoint(x: 0, y: statsY)
            atkLabel.fontColor = UIColor(hex: "#AAAAAA")
            atkLabel.text = card.cardType == .spell ? "Spell" : "Stabilizer"
        }

        // --- Mana cost badge (top-right) ---
        let manaBadgeSize = SK.Card.handManaBadgeSize
        let manaIconSize = SK.Card.handManaIconSize

        manaBadge = SKSpriteNode(color: UIColor(hex: "#1A1A1A").withAlphaComponent(0.75),
                                 size: CGSize(width: manaBadgeSize, height: manaBadgeSize))
        manaBadge.position = CGPoint(x: cardSize.width / 2 - manaBadgeSize / 2 - 3,
                                     y: cardSize.height / 2 - manaBadgeSize / 2 - 3)
        manaBadge.zPosition = 3

        manaIcon = SKSpriteNode(imageNamed: "StatIcons/chaos-motes")
        manaIcon.size = CGSize(width: manaIconSize, height: manaIconSize)
        manaIcon.position = CGPoint(x: -manaIconSize / 4, y: 0)
        manaIcon.zPosition = 1
        manaBadge.addChild(manaIcon)

        manaCostLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        manaCostLabel.fontSize = SK.Card.handManaCostFontSize
        manaCostLabel.fontColor = .white
        manaCostLabel.horizontalAlignmentMode = .center
        manaCostLabel.verticalAlignmentMode = .center
        manaCostLabel.position = CGPoint(x: manaIconSize / 4, y: 0)
        manaCostLabel.zPosition = 1
        manaCostLabel.text = "\(card.manaCost)"
        manaBadge.addChild(manaCostLabel)

        // --- Super init ---
        super.init(texture: nil, color: .clear, size: cardSize)
        self.name = "handCard_\(card.instanceId)"

        // Background rounded rect
        let bg = SKShapeNode(rectOf: cardSize, cornerRadius: 8)
        bg.fillColor = UIColor(hex: "#1A1A1A")
        bg.strokeColor = card.evolutionTier.borderUIColor.withAlphaComponent(0.5)
        bg.lineWidth = 1.5
        bg.zPosition = -1
        addChild(bg)

        addChild(cardArtNode)
        addChild(textPanel)
        addChild(nameLabel)
        addChild(atkIcon)
        addChild(atkLabel)
        addChild(hpIcon)
        addChild(hpLabel)
        addChild(manaBadge)

        // Keyword icons above the text panel (creatures only)
        if card.cardType == .creature {
            setupKeywordIcons(card.innateKeywords)
        }

        // Rarity effect (lighter at hand scale)
        applyRarityEffect(card.evolutionTier)

        // Load art
        loadArt(urlString: card.artUrl)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Art Loading

    private func loadArt(urlString: String) {
        guard let url = URL(string: urlString) else { return }
        Task { @MainActor in
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                if let image = UIImage(data: data) {
                    self.cardArtNode.texture = SKTexture(image: image)
                    self.cardArtNode.color = .clear
                    self.cardArtNode.colorBlendFactor = 0
                }
            } catch { }
        }
    }

    // MARK: - Keyword Icons

    private func setupKeywordIcons(_ keywords: [Keyword]) {
        keywordIcons.forEach { $0.removeFromParent() }
        keywordIcons.removeAll()

        let displayKeywords = Array(keywords.prefix(SK.Card.maxKeywordIcons))
        guard !displayKeywords.isEmpty else { return }

        let iconSize: CGFloat = 10
        let spacing: CGFloat = iconSize + 2
        let totalWidth = CGFloat(displayKeywords.count) * spacing - 2
        let startX = -totalWidth / 2 + iconSize / 2

        // Position keyword icons just above the text panel
        let panelHeight = size.height * SK.Card.textPanelRatio
        let iconsY = -size.height / 2 + panelHeight + iconSize / 2 + 2

        for (index, keyword) in displayKeywords.enumerated() {
            let icon: SKSpriteNode

            let assetName = SK.KeywordIcons.assetName(keyword: keyword)
            if let _ = UIImage(named: assetName) {
                icon = SKSpriteNode(imageNamed: assetName)
                icon.size = CGSize(width: iconSize, height: iconSize)
            } else {
                icon = SKSpriteNode(color: keywordColor(keyword), size: CGSize(width: iconSize, height: iconSize))
            }

            icon.position = CGPoint(x: startX + CGFloat(index) * spacing, y: iconsY)
            icon.zPosition = 2
            icon.name = "keyword_\(keyword.rawValue)"
            addChild(icon)
            keywordIcons.append(icon)
        }
    }

    private func keywordColor(_ keyword: Keyword) -> UIColor {
        switch keyword {
        case .shield: return UIColor(hex: "#5BC0EB")
        case .lifesteal: return UIColor(hex: "#4CAF50")
        case .flying: return UIColor(hex: "#90CAF9")
        case .reach: return UIColor(hex: "#FF7043")
        case .deathtouch: return UIColor(hex: "#E63946")
        case .taunt: return UIColor(hex: "#FFD700")
        case .piercing: return UIColor(hex: "#FFC107")
        case .haste: return UIColor(hex: "#FF9800")
        case .ward: return UIColor(hex: "#B39DDB")
        }
    }

    // MARK: - Rarity Visual Effects

    private func applyRarityEffect(_ tier: EvolutionTier) {
        rarityOverlay?.removeFromParent()
        rarityOverlay = nil

        switch tier {
        case .common:
            break // No effect

        case .uncommon:
            let overlay = SKShapeNode(rectOf: size, cornerRadius: 8)
            overlay.fillColor = SK.RarityEffects.uncommonSheenColor.withAlphaComponent(SK.RarityEffects.uncommonOverlayAlpha)
            overlay.strokeColor = .clear
            overlay.zPosition = 5
            let anim = SKAction.sequence([
                SKAction.fadeAlpha(to: 0.12, duration: SK.RarityEffects.uncommonSheenDuration),
                SKAction.fadeAlpha(to: 0.04, duration: SK.RarityEffects.uncommonSheenDuration)
            ])
            overlay.run(SKAction.repeatForever(anim), withKey: "uncommonSheen")
            addChild(overlay)
            rarityOverlay = overlay

        case .rare:
            let glowRect = CGSize(width: size.width + 3, height: size.height + 3)
            let overlay = SKShapeNode(rectOf: glowRect, cornerRadius: 9)
            overlay.fillColor = .clear
            overlay.strokeColor = SK.RarityEffects.rareGlowColor
            overlay.lineWidth = 2
            overlay.alpha = SK.RarityEffects.rareGlowAlphaMin
            overlay.zPosition = 5
            overlay.glowWidth = 2
            let pulse = SKAction.sequence([
                SKAction.fadeAlpha(to: SK.RarityEffects.rareGlowAlphaMax, duration: SK.RarityEffects.rareGlowPulseDuration),
                SKAction.fadeAlpha(to: SK.RarityEffects.rareGlowAlphaMin, duration: SK.RarityEffects.rareGlowPulseDuration)
            ])
            overlay.run(SKAction.repeatForever(pulse), withKey: "rareGlow")
            addChild(overlay)
            rarityOverlay = overlay

        case .epic:
            let overlay = SKShapeNode(rectOf: size, cornerRadius: 8)
            overlay.fillColor = SK.RarityEffects.epicShimmerColor.withAlphaComponent(0.1)
            overlay.strokeColor = SK.RarityEffects.epicShimmerColor
            overlay.lineWidth = 1.5
            overlay.alpha = SK.RarityEffects.epicShimmerAlphaMin
            overlay.zPosition = 5
            overlay.glowWidth = 2
            let shimmer = SKAction.sequence([
                SKAction.fadeAlpha(to: SK.RarityEffects.epicShimmerAlphaMax, duration: SK.RarityEffects.epicShimmerDuration),
                SKAction.fadeAlpha(to: SK.RarityEffects.epicShimmerAlphaMin, duration: SK.RarityEffects.epicShimmerDuration)
            ])
            overlay.run(SKAction.repeatForever(shimmer), withKey: "epicShimmer")
            addChild(overlay)
            rarityOverlay = overlay

        case .legendary:
            let container = SKNode()
            container.zPosition = 5

            let glowRect = CGSize(width: size.width + 4, height: size.height + 4)
            let glowBorder = SKShapeNode(rectOf: glowRect, cornerRadius: 10)
            glowBorder.fillColor = .clear
            glowBorder.strokeColor = SK.RarityEffects.legendaryGlowColor
            glowBorder.lineWidth = 2.5
            glowBorder.alpha = SK.RarityEffects.legendaryGlowAlphaMin
            glowBorder.glowWidth = 3
            let pulse = SKAction.sequence([
                SKAction.fadeAlpha(to: SK.RarityEffects.legendaryGlowAlphaMax, duration: SK.RarityEffects.legendaryGlowDuration),
                SKAction.fadeAlpha(to: SK.RarityEffects.legendaryGlowAlphaMin, duration: SK.RarityEffects.legendaryGlowDuration)
            ])
            glowBorder.run(SKAction.repeatForever(pulse), withKey: "legendaryGlow")
            container.addChild(glowBorder)

            let emitter = ParticleEffects.legendarySparkles(cardSize: size)
            emitter.zPosition = 1
            container.addChild(emitter)

            addChild(container)
            rarityOverlay = container
        }
    }

    // MARK: - Playability

    /// Highlight if player can afford this card
    func setPlayable(_ canPlay: Bool) {
        alpha = canPlay ? 1.0 : 0.6
        manaBadge.color = canPlay
            ? UIColor(hex: "#1A1A1A").withAlphaComponent(0.75)
            : UIColor(hex: "#555555").withAlphaComponent(0.75)
    }

    /// Scale up when selected/previewed
    func setSelected(_ selected: Bool) {
        let targetScale: CGFloat = selected ? 1.15 : 1.0
        run(SKAction.scale(to: targetScale, duration: 0.15))
    }
}

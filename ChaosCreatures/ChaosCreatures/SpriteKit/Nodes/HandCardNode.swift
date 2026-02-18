// HandCardNode.swift
// Chaos Creatures
// Individual card in hand (compact view). Rendered in SpriteKit for potential
// future drag-to-play interactions from within the scene.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SpriteKit

/// Represents a card in the player's hand within the SpriteKit scene.
/// Currently hand cards are rendered via SwiftUI overlay (HandScrollView),
/// but this node is available for drag-to-board animation source points.
final class HandCardNode: SKSpriteNode {

    // MARK: - Properties

    private(set) var cardData: BattleCardData
    private let frameNode: SKSpriteNode
    private let cardArt: SKSpriteNode
    private let nameLabel: SKLabelNode
    private let costLabel: SKLabelNode
    private let costBadge: SKShapeNode
    private let statsLabel: SKLabelNode
    private var keywordIcons: [SKSpriteNode] = []
    private var rarityOverlay: SKNode?

    var isDragging: Bool = false
    var originalPosition: CGPoint = .zero

    // MARK: - Init

    init(card: BattleCardData) {
        self.cardData = card
        let cardSize = SK.Card.handSize

        // Card frame texture — faction and rarity-aware
        let frameAssetName: String
        if card.cardType == .spell {
            frameAssetName = SK.CardFrames.spell
        } else if card.cardType == .stabilizer {
            frameAssetName = SK.CardFrames.stabilizer
        } else if let faction = card.factionShortName {
            frameAssetName = SK.CardFrames.assetName(faction: faction, tier: card.evolutionTier)
        } else {
            frameAssetName = SK.CardFrames.assetName(faction: .ironwright, tier: .common)
        }

        if let _ = UIImage(named: frameAssetName) {
            frameNode = SKSpriteNode(imageNamed: frameAssetName)
            frameNode.size = cardSize
        } else {
            // Fallback: solid dark card background when frame assets are missing
            frameNode = SKSpriteNode(color: UIColor(hex: "#1A1A1A"), size: cardSize)
        }
        frameNode.zPosition = 0

        // Card art placeholder
        let factionColor = card.factionPrimaryColor
        let artHeight = cardSize.height * 0.55
        cardArt = SKSpriteNode(color: factionColor.withAlphaComponent(0.3),
                                size: CGSize(width: cardSize.width - 6, height: artHeight))
        cardArt.anchorPoint = CGPoint(x: 0.5, y: 1.0)
        cardArt.position = CGPoint(x: 0, y: cardSize.height / 2 - 3)
        cardArt.zPosition = 1

        // Name — Cinzel Bold for card names
        nameLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        nameLabel.fontSize = 8
        nameLabel.fontColor = .white
        nameLabel.horizontalAlignmentMode = .center
        nameLabel.verticalAlignmentMode = .center
        nameLabel.position = CGPoint(x: 0, y: -cardSize.height / 2 + 30)
        nameLabel.zPosition = 2
        let displayName = card.name.count > 10 ? String(card.name.prefix(9)) + "..." : card.name
        nameLabel.text = displayName

        // Mana cost badge
        costBadge = SKShapeNode(circleOfRadius: 10)
        costBadge.fillColor = UIColor(hex: "#4A90E2")
        costBadge.strokeColor = .clear
        costBadge.position = CGPoint(x: -cardSize.width / 2 + 12, y: cardSize.height / 2 - 12)
        costBadge.zPosition = 3

        costLabel = SKLabelNode(fontNamed: SK.Fonts.heavy)
        costLabel.fontSize = 12
        costLabel.fontColor = .white
        costLabel.horizontalAlignmentMode = .center
        costLabel.verticalAlignmentMode = .center
        costLabel.text = "\(card.manaCost)"
        costBadge.addChild(costLabel)

        // Stats (ATK/HP for creatures) — Alegreya Bold for stats
        statsLabel = SKLabelNode(fontNamed: SK.Fonts.medium)
        statsLabel.fontSize = 11
        statsLabel.fontColor = .white
        statsLabel.horizontalAlignmentMode = .center
        statsLabel.verticalAlignmentMode = .center
        statsLabel.position = CGPoint(x: 0, y: -cardSize.height / 2 + 14)
        statsLabel.zPosition = 2
        if let atk = card.baseAttack, let hp = card.baseHealth {
            statsLabel.text = "\(atk)/\(hp)"
        } else {
            statsLabel.text = card.cardType == .spell ? "Spell" : ""
        }

        super.init(texture: nil, color: .clear, size: cardSize)
        self.name = "handCard_\(card.instanceId)"

        // Background rounded rect (visible behind frame)
        let bg = SKShapeNode(rectOf: cardSize, cornerRadius: 8)
        bg.fillColor = UIColor(hex: "#1A1A1A")
        bg.strokeColor = card.evolutionTier.borderUIColor.withAlphaComponent(0.5)
        bg.lineWidth = 1.5
        bg.zPosition = -1
        addChild(bg)

        addChild(frameNode)
        addChild(cardArt)
        addChild(nameLabel)
        addChild(costBadge)
        addChild(statsLabel)

        // Setup keyword icons for hand cards (small icons below art)
        if card.cardType == .creature {
            setupKeywordIcons(card.innateKeywords)
        }

        // Apply rarity effect (lighter at hand scale)
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
                    self.cardArt.texture = SKTexture(image: image)
                    self.cardArt.color = .clear
                    self.cardArt.colorBlendFactor = 0
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

        let iconSize: CGFloat = 10 // Slightly smaller for hand cards
        let spacing: CGFloat = iconSize + 2
        let totalWidth = CGFloat(displayKeywords.count) * spacing - 2
        let startX = -totalWidth / 2 + iconSize / 2

        for (index, keyword) in displayKeywords.enumerated() {
            let icon: SKSpriteNode

            let assetName = SK.KeywordIcons.assetName(keyword: keyword)
            if let _ = UIImage(named: assetName) {
                icon = SKSpriteNode(imageNamed: assetName)
                icon.size = CGSize(width: iconSize, height: iconSize)
            } else {
                icon = SKSpriteNode(color: keywordColor(keyword), size: CGSize(width: iconSize, height: iconSize))
            }

            // Position just above the stats bar
            icon.position = CGPoint(x: startX + CGFloat(index) * spacing,
                                    y: -size.height / 2 + 42)
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
        case .flying: return UIColor(hex: "#81D4FA")
        case .reach: return UIColor(hex: "#8D6E63")
        case .deathtouch: return UIColor(hex: "#9C27B0")
        case .taunt: return UIColor(hex: "#FFD700")
        case .piercing: return UIColor(hex: "#FF7043")
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
        costBadge.fillColor = canPlay ? UIColor(hex: "#4A90E2") : UIColor(hex: "#555555")
    }

    /// Scale up when selected/previewed
    func setSelected(_ selected: Bool) {
        let targetScale: CGFloat = selected ? 1.15 : 1.0
        run(SKAction.scale(to: targetScale, duration: 0.15))
    }
}

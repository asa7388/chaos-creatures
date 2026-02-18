// CreatureNode.swift
// Chaos Creatures
// BoardCardNode — card on board with frame texture, art, stats overlay, keyword icons,
// rarity visual effects, and glow states for attacker/blocker selection.
// Source: docs/design/07-ui-ux-specs.md Section 3.3

import SpriteKit

/// A card on the battlefield board. Renders faction-themed card frame, art,
/// ATK/HP stats, keyword icons, rarity border effects, and selection glows.
final class CreatureNode: SKSpriteNode {

    // MARK: - Child Nodes

    private let frameNode: SKSpriteNode
    private let cardArtNode: SKSpriteNode
    private let statsBarNode: SKSpriteNode
    private let atkLabel: SKLabelNode
    private let hpLabel: SKLabelNode
    private let nameLabel: SKLabelNode
    private let manaCostBadge: SKShapeNode
    private let manaCostLabel: SKLabelNode
    private var keywordIcons: [SKSpriteNode] = []
    private var tauntIcon: SKSpriteNode?
    private var shieldOverlay: SKShapeNode?
    private var rarityOverlay: SKNode?

    // MARK: - State

    private(set) var creatureId: String
    private(set) var factionShortName: FactionShortName?
    private(set) var evolutionTier: EvolutionTier
    private(set) var boardSlot: Int
    private(set) var isPlayerCard: Bool
    var isAttacking: Bool = false
    var isBlockTarget: Bool = false

    // MARK: - Init

    init(creature: BattleCreatureData, isPlayer: Bool) {
        self.creatureId = creature.instanceId
        self.factionShortName = creature.factionShortName
        self.evolutionTier = creature.evolutionTier
        self.boardSlot = creature.boardSlot
        self.isPlayerCard = isPlayer

        let factionColor = creature.factionPrimaryColor
        let cardSize = SK.Board.slotSize

        // Card frame — the primary visual background, loaded from asset catalog.
        // Falls back to a solid dark rect if frame image is not yet in the asset catalog.
        let frameAssetName: String
        if creature.cardType == .spell {
            frameAssetName = SK.CardFrames.spell
        } else if creature.cardType == .stabilizer {
            frameAssetName = SK.CardFrames.stabilizer
        } else if let faction = creature.factionShortName {
            frameAssetName = SK.CardFrames.assetName(faction: faction, tier: creature.evolutionTier)
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

        // Card art — top 60%
        let artHeight = cardSize.height * SK.Card.artRatio
        cardArtNode = SKSpriteNode(color: factionColor.withAlphaComponent(0.3),
                                    size: CGSize(width: cardSize.width - 4, height: artHeight))
        cardArtNode.anchorPoint = CGPoint(x: 0.5, y: 1.0)
        cardArtNode.position = CGPoint(x: 0, y: cardSize.height / 2 - 2)
        cardArtNode.zPosition = 1

        // Stats bar — bottom 25%
        let statsHeight = cardSize.height * SK.Card.statsBarRatio
        statsBarNode = SKSpriteNode(color: UIColor(hex: "#0D0D0D").withAlphaComponent(0.85),
                                     size: CGSize(width: cardSize.width - 4, height: statsHeight))
        statsBarNode.anchorPoint = CGPoint(x: 0.5, y: 0.0)
        statsBarNode.position = CGPoint(x: 0, y: -cardSize.height / 2 + 2)
        statsBarNode.zPosition = 1

        // ATK label — left of stats bar (Alegreya Bold for stats)
        atkLabel = SKLabelNode(fontNamed: SK.Fonts.medium)
        atkLabel.fontSize = SK.Card.statsFontSize
        atkLabel.fontColor = UIColor(hex: "#FF7043")
        atkLabel.horizontalAlignmentMode = .left
        atkLabel.verticalAlignmentMode = .center
        atkLabel.position = CGPoint(x: -cardSize.width / 2 + 6, y: -cardSize.height / 2 + statsHeight / 2 + 2)
        atkLabel.zPosition = 2
        atkLabel.text = "\(creature.attack)"

        // HP label — right of stats bar (Alegreya Bold for stats)
        hpLabel = SKLabelNode(fontNamed: SK.Fonts.medium)
        hpLabel.fontSize = SK.Card.statsFontSize
        hpLabel.fontColor = UIColor(hex: "#4CAF50")
        hpLabel.horizontalAlignmentMode = .right
        hpLabel.verticalAlignmentMode = .center
        hpLabel.position = CGPoint(x: cardSize.width / 2 - 6, y: -cardSize.height / 2 + statsHeight / 2 + 2)
        hpLabel.zPosition = 2
        hpLabel.text = "\(creature.health)"

        // Name label — centered between ATK and HP
        // At board scale (64x90pt), name is very small (~7pt).
        // Cinzel is unreadable below 7pt, so use Alegreya Bold as fallback at small sizes.
        let nameFontSize = max(SK.Card.nameFontSize - 3, 6)
        let nameFontName = nameFontSize < 8 ? SK.Fonts.medium : SK.Fonts.bold
        nameLabel = SKLabelNode(fontNamed: nameFontName)
        nameLabel.fontSize = nameFontSize
        nameLabel.fontColor = .white
        nameLabel.horizontalAlignmentMode = .center
        nameLabel.verticalAlignmentMode = .center
        nameLabel.position = CGPoint(x: 0, y: -cardSize.height / 2 + statsHeight / 2 + 2)
        nameLabel.zPosition = 2

        // Truncate long names for board scale
        let displayName = creature.name.count > 8 ? String(creature.name.prefix(7)) + "..." : creature.name
        nameLabel.text = displayName

        // Mana cost badge — top-left
        manaCostBadge = SKShapeNode(circleOfRadius: SK.Card.manaCostBadgeSize / 2)
        manaCostBadge.fillColor = UIColor(hex: "#4A90E2")
        manaCostBadge.strokeColor = .clear
        manaCostBadge.position = CGPoint(x: -cardSize.width / 2 + 10, y: cardSize.height / 2 - 10)
        manaCostBadge.zPosition = 3

        manaCostLabel = SKLabelNode(fontNamed: SK.Fonts.medium)
        manaCostLabel.fontSize = 10
        manaCostLabel.fontColor = .white
        manaCostLabel.horizontalAlignmentMode = .center
        manaCostLabel.verticalAlignmentMode = .center
        manaCostLabel.text = "\(creature.manaCost)"
        manaCostBadge.addChild(manaCostLabel)

        super.init(texture: nil, color: .clear, size: cardSize)
        self.name = "creature_\(creature.instanceId)"

        // Background rounded rect (visible behind frame if frame has transparent areas)
        let bg = SKShapeNode(rectOf: cardSize, cornerRadius: SK.Board.slotCornerRadius)
        bg.fillColor = UIColor(hex: "#1A1A1A")
        bg.strokeColor = creature.evolutionTier.borderUIColor.withAlphaComponent(0.6)
        bg.lineWidth = 1.5
        bg.zPosition = -1
        addChild(bg)

        addChild(frameNode)
        addChild(cardArtNode)
        addChild(statsBarNode)
        addChild(atkLabel)
        addChild(hpLabel)
        addChild(nameLabel)
        addChild(manaCostBadge)

        // Setup keywords with icon textures
        setupKeywordIcons(creature.activeKeywords)

        // Taunt indicator
        if creature.hasTaunt {
            setupTauntIcon()
        }

        // Shield overlay
        if creature.shieldActive {
            showShield()
        }

        // Apply rarity visual effects
        applyRarityEffect(creature.evolutionTier)

        // Load art async
        loadCardArt(urlString: creature.artUrl)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Art Loading

    private func loadCardArt(urlString: String) {
        guard let url = URL(string: urlString) else { return }

        Task { @MainActor in
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                if let image = UIImage(data: data) {
                    let texture = SKTexture(image: image)
                    self.cardArtNode.texture = texture
                    self.cardArtNode.color = .clear
                    self.cardArtNode.colorBlendFactor = 0
                }
            } catch {
                // Keep faction-colored placeholder on failure
            }
        }
    }

    // MARK: - Keyword Icons

    private func setupKeywordIcons(_ keywords: [Keyword]) {
        // Remove old icons
        keywordIcons.forEach { $0.removeFromParent() }
        keywordIcons.removeAll()

        let displayKeywords = Array(keywords.prefix(SK.Card.maxKeywordIcons))
        let iconSize = SK.Card.keywordIconSize
        let spacing: CGFloat = iconSize + 2
        let totalWidth = CGFloat(displayKeywords.count) * spacing - 2
        let startX = -totalWidth / 2 + iconSize / 2

        for (index, keyword) in displayKeywords.enumerated() {
            let icon: SKSpriteNode

            // Try loading keyword icon texture from asset catalog
            let assetName = SK.KeywordIcons.assetName(keyword: keyword)
            if let _ = UIImage(named: assetName) {
                icon = SKSpriteNode(imageNamed: assetName)
                icon.size = CGSize(width: iconSize, height: iconSize)
            } else {
                // Fallback: colored square with same color coding as before
                icon = SKSpriteNode(color: keywordColor(keyword), size: CGSize(width: iconSize, height: iconSize))
            }

            icon.position = CGPoint(x: startX + CGFloat(index) * spacing,
                                    y: -size.height / 2 + size.height * SK.Card.statsBarRatio + iconSize)
            icon.zPosition = 2
            icon.name = "keyword_\(keyword.rawValue)"
            addChild(icon)
            keywordIcons.append(icon)
        }
    }

    private func keywordColor(_ keyword: Keyword) -> UIColor {
        // Colors must match CardFrameView.keywordColor() in SwiftUI
        switch keyword {
        case .shield: return UIColor(hex: "#5BC0EB")     // orderBlue
        case .lifesteal: return UIColor(hex: "#4CAF50")  // healGreen
        case .flying: return UIColor(hex: "#90CAF9")     // light blue
        case .reach: return UIColor(hex: "#FF7043")      // damageOrange
        case .deathtouch: return UIColor(hex: "#E63946") // chaosRed
        case .taunt: return UIColor(hex: "#FFD700")      // tauntGold
        case .piercing: return UIColor(hex: "#FFC107")   // warningYellow
        }
    }

    // MARK: - Taunt Icon

    private func setupTauntIcon() {
        let iconSize: CGFloat = 14
        let tauntAsset = SK.KeywordIcons.assetName(keyword: .taunt)
        let icon: SKSpriteNode

        if let _ = UIImage(named: tauntAsset) {
            icon = SKSpriteNode(imageNamed: tauntAsset)
            icon.size = CGSize(width: iconSize, height: iconSize)
        } else {
            icon = SKSpriteNode(color: UIColor(hex: "#FFD700"), size: CGSize(width: iconSize, height: iconSize))
        }

        icon.position = CGPoint(x: size.width / 2 - 10, y: size.height / 2 - 26)
        icon.zPosition = 3
        icon.name = "taunt_icon"

        // Pulse animation (per doc 07 Section 3.6)
        let pulse = SKAction.sequence([
            SKAction.scale(to: 1.3, duration: 0.75),
            SKAction.scale(to: 1.0, duration: 0.75)
        ])
        icon.run(SKAction.repeatForever(pulse), withKey: "tauntPulse")

        addChild(icon)
        tauntIcon = icon
    }

    // MARK: - Shield

    func showShield() {
        guard shieldOverlay == nil else { return }
        let shield = SKShapeNode(rectOf: CGSize(width: size.width + 4, height: size.height + 4), cornerRadius: SK.Board.slotCornerRadius + 2)
        shield.fillColor = UIColor(hex: "#5BC0EB").withAlphaComponent(0.15)
        shield.strokeColor = UIColor(hex: "#5BC0EB")
        shield.lineWidth = 2
        shield.zPosition = 4
        shield.name = "shield_overlay"

        // Breathing animation
        let breathe = SKAction.sequence([
            SKAction.fadeAlpha(to: 0.7, duration: 1.0),
            SKAction.fadeAlpha(to: 1.0, duration: 1.0)
        ])
        shield.run(SKAction.repeatForever(breathe), withKey: "shieldBreathe")

        addChild(shield)
        shieldOverlay = shield
    }

    func removeShield() {
        shieldOverlay?.removeFromParent()
        shieldOverlay = nil
    }

    // MARK: - Rarity Visual Effects

    private func applyRarityEffect(_ tier: EvolutionTier) {
        // Remove any existing rarity effect
        rarityOverlay?.removeFromParent()
        rarityOverlay = nil

        switch tier {
        case .common:
            // No extra effect (matte frame)
            break

        case .uncommon:
            applyUncommonSheen()

        case .rare:
            applyRareGlow()

        case .epic:
            applyEpicShimmer()

        case .legendary:
            applyLegendaryPrismatic()
        }
    }

    /// Uncommon: subtle metallic sheen — low-opacity silver overlay that drifts
    private func applyUncommonSheen() {
        let overlay = SKShapeNode(rectOf: size, cornerRadius: SK.Board.slotCornerRadius)
        overlay.fillColor = SK.RarityEffects.uncommonSheenColor.withAlphaComponent(SK.RarityEffects.uncommonOverlayAlpha)
        overlay.strokeColor = .clear
        overlay.zPosition = 5
        overlay.name = "rarity_overlay"

        let sheenAnim = SKAction.sequence([
            SKAction.fadeAlpha(to: 0.15, duration: SK.RarityEffects.uncommonSheenDuration),
            SKAction.fadeAlpha(to: 0.04, duration: SK.RarityEffects.uncommonSheenDuration)
        ])
        overlay.run(SKAction.repeatForever(sheenAnim), withKey: "uncommonSheen")

        addChild(overlay)
        rarityOverlay = overlay
    }

    /// Rare: blue energy glow pulse on the border
    private func applyRareGlow() {
        let glowRect = CGSize(width: size.width + 4, height: size.height + 4)
        let overlay = SKShapeNode(rectOf: glowRect, cornerRadius: SK.Board.slotCornerRadius + 2)
        overlay.fillColor = .clear
        overlay.strokeColor = SK.RarityEffects.rareGlowColor
        overlay.lineWidth = 2.5
        overlay.alpha = SK.RarityEffects.rareGlowAlphaMin
        overlay.zPosition = 5
        overlay.name = "rarity_overlay"
        overlay.glowWidth = 3

        let pulse = SKAction.sequence([
            SKAction.fadeAlpha(to: SK.RarityEffects.rareGlowAlphaMax, duration: SK.RarityEffects.rareGlowPulseDuration),
            SKAction.fadeAlpha(to: SK.RarityEffects.rareGlowAlphaMin, duration: SK.RarityEffects.rareGlowPulseDuration)
        ])
        overlay.run(SKAction.repeatForever(pulse), withKey: "rareGlow")

        addChild(overlay)
        rarityOverlay = overlay
    }

    /// Epic: purple shimmer — oscillating purple overlay opacity
    private func applyEpicShimmer() {
        let overlay = SKShapeNode(rectOf: size, cornerRadius: SK.Board.slotCornerRadius)
        overlay.fillColor = SK.RarityEffects.epicShimmerColor.withAlphaComponent(0.15)
        overlay.strokeColor = SK.RarityEffects.epicShimmerColor
        overlay.lineWidth = 2
        overlay.alpha = SK.RarityEffects.epicShimmerAlphaMin
        overlay.zPosition = 5
        overlay.name = "rarity_overlay"
        overlay.glowWidth = 2

        let shimmer = SKAction.sequence([
            SKAction.fadeAlpha(to: SK.RarityEffects.epicShimmerAlphaMax, duration: SK.RarityEffects.epicShimmerDuration),
            SKAction.fadeAlpha(to: SK.RarityEffects.epicShimmerAlphaMin, duration: SK.RarityEffects.epicShimmerDuration)
        ])
        overlay.run(SKAction.repeatForever(shimmer), withKey: "epicShimmer")

        addChild(overlay)
        rarityOverlay = overlay
    }

    /// Legendary: gold prismatic glow + particle sparkles
    private func applyLegendaryPrismatic() {
        let container = SKNode()
        container.zPosition = 5
        container.name = "rarity_overlay"

        // Gold glow border
        let glowRect = CGSize(width: size.width + 6, height: size.height + 6)
        let glowBorder = SKShapeNode(rectOf: glowRect, cornerRadius: SK.Board.slotCornerRadius + 3)
        glowBorder.fillColor = .clear
        glowBorder.strokeColor = SK.RarityEffects.legendaryGlowColor
        glowBorder.lineWidth = 3
        glowBorder.alpha = SK.RarityEffects.legendaryGlowAlphaMin
        glowBorder.glowWidth = 4

        let pulse = SKAction.sequence([
            SKAction.fadeAlpha(to: SK.RarityEffects.legendaryGlowAlphaMax, duration: SK.RarityEffects.legendaryGlowDuration),
            SKAction.fadeAlpha(to: SK.RarityEffects.legendaryGlowAlphaMin, duration: SK.RarityEffects.legendaryGlowDuration)
        ])
        glowBorder.run(SKAction.repeatForever(pulse), withKey: "legendaryGlow")
        container.addChild(glowBorder)

        // Particle sparkles around the border
        let emitter = ParticleEffects.legendarySparkles(cardSize: size)
        emitter.zPosition = 1
        container.addChild(emitter)

        addChild(container)
        rarityOverlay = container
    }

    // MARK: - State Updates

    /// Update stats from server state
    func updateStats(attack: Int, health: Int, maxHealth: Int) {
        atkLabel.text = "\(attack)"
        hpLabel.text = "\(health)"

        // Color HP red if damaged
        if health < maxHealth {
            hpLabel.fontColor = UIColor(hex: "#F44336")
        } else {
            hpLabel.fontColor = UIColor(hex: "#4CAF50")
        }
    }

    /// Update keywords display
    func updateKeywords(_ keywords: [Keyword]) {
        setupKeywordIcons(keywords)

        if keywords.contains(.taunt) && tauntIcon == nil {
            setupTauntIcon()
        } else if !keywords.contains(.taunt) {
            tauntIcon?.removeFromParent()
            tauntIcon = nil
        }
    }

    // MARK: - Selection States (per doc 07 Section 3.3)

    /// Mark this creature as an attacker (red glow pulse)
    func setAttackState(_ isAttacking: Bool) {
        self.isAttacking = isAttacking
        if isAttacking {
            let glowIn = SKAction.sequence([
                SKAction.colorize(with: SK.Colors.attackerGlow, colorBlendFactor: 0.5, duration: 0.2),
                SKAction.colorize(with: SK.Colors.attackerGlow, colorBlendFactor: 0.3, duration: 0.3)
            ])
            let pulse = SKAction.sequence([
                SKAction.colorize(with: SK.Colors.attackerGlow, colorBlendFactor: 0.5, duration: 0.4),
                SKAction.colorize(with: SK.Colors.attackerGlow, colorBlendFactor: 0.25, duration: 0.4)
            ])
            run(SKAction.sequence([glowIn, SKAction.repeatForever(pulse)]), withKey: "attackerGlow")
        } else {
            removeAction(forKey: "attackerGlow")
            run(SKAction.colorize(withColorBlendFactor: 0, duration: 0.15))
        }
    }

    /// Hover state during blocker assignment
    func setBlockHoverState(_ isValid: Bool) {
        let color: UIColor = isValid ? SK.Colors.validTarget : SK.Colors.invalidTarget
        run(SKAction.colorize(with: color, colorBlendFactor: 0.5, duration: 0.1), withKey: "blockHover")
    }

    func clearBlockHoverState() {
        removeAction(forKey: "blockHover")
        run(SKAction.colorize(withColorBlendFactor: 0, duration: 0.1))
    }

    /// Highlight for valid target (spell targeting, event targeting)
    func setValidTargetHighlight(_ show: Bool) {
        if show {
            let pulse = SKAction.sequence([
                SKAction.colorize(with: SK.Colors.validTarget, colorBlendFactor: 0.4, duration: 0.3),
                SKAction.colorize(with: SK.Colors.validTarget, colorBlendFactor: 0.15, duration: 0.3)
            ])
            run(SKAction.repeatForever(pulse), withKey: "validTarget")
        } else {
            removeAction(forKey: "validTarget")
            run(SKAction.colorize(withColorBlendFactor: 0, duration: 0.15))
        }
    }

    /// Dim creatures that cannot act
    func setDimmed(_ dimmed: Bool) {
        alpha = dimmed ? 0.5 : 1.0
    }

    // MARK: - Attunement Visual

    func showAttunement(eventType: EventType) {
        removeAction(forKey: "attunement")
        let color: UIColor = eventType == .order ? SK.Colors.orderBlue : SK.Colors.chaosRed
        let pulse = SKAction.sequence([
            SKAction.colorize(with: color, colorBlendFactor: 0.2, duration: 0.5),
            SKAction.colorize(with: color, colorBlendFactor: 0.05, duration: 0.5)
        ])
        run(SKAction.repeatForever(pulse), withKey: "attunement")
    }

    func clearAttunement() {
        removeAction(forKey: "attunement")
        run(SKAction.colorize(withColorBlendFactor: 0, duration: 0.2))
    }
}

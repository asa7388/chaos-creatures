// CreatureNode.swift
// Chaos Creatures
// BoardCardNode — full-art card on board with unified text panel, stat icons,
// mana cost badge, keyword icons, rarity glow, and selection states.
// Source: docs/design/07-ui-ux-specs.md Section 3.3

import SpriteKit

/// A card on the battlefield board. Full-bleed art fills the card bounds.
/// A dark semi-transparent panel at the bottom 28% holds the card name and ATK/HP
/// stats with sword-atk and heart-hp icons. A mana cost badge with chaos-motes
/// icon sits at the top-right. Rarity is expressed as a colored glow behind the card.
final class CreatureNode: SKSpriteNode {

    // MARK: - Child Nodes

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
    private var tauntIcon: SKSpriteNode?
    private var shieldOverlay: SKShapeNode?
    private var rarityGlowNode: SKSpriteNode?

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
        let panelHeight = cardSize.height * SK.Card.textPanelRatio

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

        // --- Card name (top of text panel) ---
        let nameFontSize = SK.Card.boardNameFontSize
        nameLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        nameLabel.fontSize = nameFontSize
        nameLabel.fontColor = .white
        nameLabel.horizontalAlignmentMode = .center
        nameLabel.verticalAlignmentMode = .center
        // Position name in upper portion of text panel
        nameLabel.position = CGPoint(x: 0, y: -cardSize.height / 2 + panelHeight * 0.65)
        nameLabel.zPosition = 2

        let displayName = creature.name.count > 8 ? String(creature.name.prefix(7)) + "\u{2026}" : creature.name
        nameLabel.text = displayName

        // --- ATK: sword icon + label (bottom-left of text panel) ---
        let statIconSize = SK.Card.boardStatIconSize
        let statFontSize = SK.Card.boardStatFontSize
        let statsY = -cardSize.height / 2 + panelHeight * 0.25

        atkIcon = SKSpriteNode(imageNamed: "StatIcons/sword-atk")
        atkIcon.size = CGSize(width: statIconSize, height: statIconSize)
        atkIcon.position = CGPoint(x: -cardSize.width / 2 + 7, y: statsY)
        atkIcon.zPosition = 2

        atkLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        atkLabel.fontSize = statFontSize
        atkLabel.fontColor = UIColor(hex: "#FF7043")
        atkLabel.horizontalAlignmentMode = .left
        atkLabel.verticalAlignmentMode = .center
        atkLabel.position = CGPoint(x: -cardSize.width / 2 + 7 + statIconSize / 2 + 2, y: statsY)
        atkLabel.zPosition = 2
        atkLabel.text = "\(creature.attack)"

        // --- HP: heart icon + label (bottom-right of text panel) ---
        hpIcon = SKSpriteNode(imageNamed: "StatIcons/heart-hp")
        hpIcon.size = CGSize(width: statIconSize, height: statIconSize)
        hpIcon.position = CGPoint(x: cardSize.width / 2 - 7, y: statsY)
        hpIcon.zPosition = 2

        hpLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        hpLabel.fontSize = statFontSize
        hpLabel.fontColor = UIColor(hex: "#4CAF50")
        hpLabel.horizontalAlignmentMode = .right
        hpLabel.verticalAlignmentMode = .center
        hpLabel.position = CGPoint(x: cardSize.width / 2 - 7 - statIconSize / 2 - 2, y: statsY)
        hpLabel.zPosition = 2
        hpLabel.text = "\(creature.health)"

        // --- Mana cost badge (top-right) ---
        let manaBadgeSize = SK.Card.boardManaBadgeSize
        let manaIconSize = SK.Card.boardManaIconSize

        manaBadge = SKSpriteNode(color: UIColor(hex: "#1A1A1A").withAlphaComponent(0.75),
                                 size: CGSize(width: manaBadgeSize, height: manaBadgeSize))
        manaBadge.position = CGPoint(x: cardSize.width / 2 - manaBadgeSize / 2 - 2,
                                     y: cardSize.height / 2 - manaBadgeSize / 2 - 2)
        manaBadge.zPosition = 3

        manaIcon = SKSpriteNode(imageNamed: "StatIcons/chaos-motes")
        manaIcon.size = CGSize(width: manaIconSize, height: manaIconSize)
        manaIcon.position = CGPoint(x: -manaIconSize / 4, y: 0)
        manaIcon.zPosition = 1
        manaBadge.addChild(manaIcon)

        manaCostLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        manaCostLabel.fontSize = SK.Card.boardManaCostFontSize
        manaCostLabel.fontColor = .white
        manaCostLabel.horizontalAlignmentMode = .center
        manaCostLabel.verticalAlignmentMode = .center
        manaCostLabel.position = CGPoint(x: manaIconSize / 4, y: 0)
        manaCostLabel.zPosition = 1
        manaCostLabel.text = "\(creature.manaCost)"
        manaBadge.addChild(manaCostLabel)

        // --- Super init ---
        super.init(texture: nil, color: .clear, size: cardSize)
        self.name = "creature_\(creature.instanceId)"

        // Background rounded rect with thin rarity-tinted border
        let bg = SKShapeNode(rectOf: cardSize, cornerRadius: SK.Board.slotCornerRadius)
        bg.fillColor = UIColor(hex: "#1A1A1A")
        bg.strokeColor = creature.evolutionTier.borderUIColor.withAlphaComponent(0.6)
        bg.lineWidth = 1.5
        bg.zPosition = -1
        addChild(bg)

        // Rarity glow (colored sprite behind card)
        applyRarityGlow(creature.evolutionTier)

        addChild(cardArtNode)
        addChild(textPanel)
        addChild(nameLabel)
        addChild(atkIcon)
        addChild(atkLabel)
        addChild(hpIcon)
        addChild(hpLabel)
        addChild(manaBadge)

        // Keyword icons above the text panel
        setupKeywordIcons(creature.activeKeywords)

        // Taunt indicator
        if creature.hasTaunt {
            setupTauntIcon()
        }

        // Shield overlay
        if creature.shieldActive {
            showShield()
        }

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

    // MARK: - Rarity Glow (background behind card)

    private func applyRarityGlow(_ tier: EvolutionTier) {
        rarityGlowNode?.removeFromParent()
        rarityGlowNode = nil

        guard let glowColor = SK.RarityEffects.glowColor(for: tier) else { return }

        let oversize = SK.RarityEffects.glowOversize
        let glowSize = CGSize(width: size.width + oversize * 2, height: size.height + oversize * 2)
        let glow = SKSpriteNode(color: glowColor.withAlphaComponent(SK.RarityEffects.glowAlpha),
                                size: glowSize)
        glow.zPosition = -2
        glow.name = "rarity_glow"

        // Subtle pulse animation
        let pulse = SKAction.sequence([
            SKAction.fadeAlpha(to: 0.6, duration: SK.RarityEffects.glowPulseDuration),
            SKAction.fadeAlpha(to: 0.3, duration: SK.RarityEffects.glowPulseDuration)
        ])
        glow.run(SKAction.repeatForever(pulse), withKey: "rarityGlowPulse")

        addChild(glow)
        rarityGlowNode = glow
    }

    // MARK: - Keyword Icons

    private func setupKeywordIcons(_ keywords: [Keyword]) {
        keywordIcons.forEach { $0.removeFromParent() }
        keywordIcons.removeAll()

        let displayKeywords = Array(keywords.prefix(SK.Card.maxKeywordIcons))
        let iconSize = SK.Card.keywordIconSize
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

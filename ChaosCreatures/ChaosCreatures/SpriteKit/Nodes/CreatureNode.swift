// CreatureNode.swift
// Chaos Creatures
// BoardCardNode — card on board with art texture, stats overlay, keyword badges.
// Source: docs/design/07-ui-ux-specs.md Section 3.3

import SpriteKit

/// A card on the battlefield board. Renders art, ATK/HP stats, keyword icons,
/// rarity border, and glow states for attacker/blocker selection.
final class CreatureNode: SKSpriteNode {

    // MARK: - Child Nodes

    private let cardArtNode: SKSpriteNode
    private let statsBarNode: SKSpriteNode
    private let atkLabel: SKLabelNode
    private let hpLabel: SKLabelNode
    private let nameLabel: SKLabelNode
    private let manaCostBadge: SKShapeNode
    private let manaCostLabel: SKLabelNode
    private let tierBadge: SKShapeNode
    private var keywordIcons: [SKSpriteNode] = []
    private var tauntIcon: SKSpriteNode?
    private var shieldOverlay: SKShapeNode?

    // MARK: - State

    private(set) var creatureId: String
    private(set) var factionShortName: FactionShortName?
    private(set) var boardSlot: Int
    private(set) var isPlayerCard: Bool
    var isAttacking: Bool = false
    var isBlockTarget: Bool = false

    // MARK: - Init

    init(creature: BattleCreatureData, isPlayer: Bool) {
        self.creatureId = creature.instanceId
        self.factionShortName = creature.factionShortName
        self.boardSlot = creature.boardSlot
        self.isPlayerCard = isPlayer

        let factionColor = creature.factionPrimaryColor
        let cardSize = SK.Board.slotSize

        // Card art — top 60%
        let artHeight = cardSize.height * SK.Card.artRatio
        cardArtNode = SKSpriteNode(color: factionColor.withAlphaComponent(0.3),
                                    size: CGSize(width: cardSize.width - 4, height: artHeight))
        cardArtNode.anchorPoint = CGPoint(x: 0.5, y: 1.0)
        cardArtNode.position = CGPoint(x: 0, y: cardSize.height / 2 - 2)
        cardArtNode.zPosition = 1

        // Stats bar — bottom 25%
        let statsHeight = cardSize.height * SK.Card.statsBarRatio
        statsBarNode = SKSpriteNode(color: UIColor(hex: "#0D0D0D"),
                                     size: CGSize(width: cardSize.width - 4, height: statsHeight))
        statsBarNode.anchorPoint = CGPoint(x: 0.5, y: 0.0)
        statsBarNode.position = CGPoint(x: 0, y: -cardSize.height / 2 + 2)
        statsBarNode.zPosition = 1

        // ATK label — left of stats bar
        atkLabel = SKLabelNode(fontNamed: SK.Fonts.heavy)
        atkLabel.fontSize = SK.Card.statsFontSize
        atkLabel.fontColor = UIColor(hex: "#F44336")
        atkLabel.horizontalAlignmentMode = .left
        atkLabel.verticalAlignmentMode = .center
        atkLabel.position = CGPoint(x: -cardSize.width / 2 + 6, y: -cardSize.height / 2 + statsHeight / 2 + 2)
        atkLabel.zPosition = 2
        atkLabel.text = "\(creature.attack)"

        // HP label — right of stats bar
        hpLabel = SKLabelNode(fontNamed: SK.Fonts.heavy)
        hpLabel.fontSize = SK.Card.statsFontSize
        hpLabel.fontColor = UIColor(hex: "#4CAF50")
        hpLabel.horizontalAlignmentMode = .right
        hpLabel.verticalAlignmentMode = .center
        hpLabel.position = CGPoint(x: cardSize.width / 2 - 6, y: -cardSize.height / 2 + statsHeight / 2 + 2)
        hpLabel.zPosition = 2
        hpLabel.text = "\(creature.health)"

        // Name label — centered between ATK and HP
        nameLabel = SKLabelNode(fontNamed: SK.Fonts.medium)
        nameLabel.fontSize = SK.Card.nameFontSize - 2
        nameLabel.fontColor = .white
        nameLabel.horizontalAlignmentMode = .center
        nameLabel.verticalAlignmentMode = .center
        nameLabel.position = CGPoint(x: 0, y: -cardSize.height / 2 + statsHeight / 2 + 2)
        nameLabel.zPosition = 2

        // Truncate long names
        let displayName = creature.name.count > 8 ? String(creature.name.prefix(7)) + "..." : creature.name
        nameLabel.text = displayName

        // Mana cost badge — top-left
        manaCostBadge = SKShapeNode(circleOfRadius: SK.Card.manaCostBadgeSize / 2)
        manaCostBadge.fillColor = UIColor(hex: "#4A90E2")
        manaCostBadge.strokeColor = .clear
        manaCostBadge.position = CGPoint(x: -cardSize.width / 2 + 10, y: cardSize.height / 2 - 10)
        manaCostBadge.zPosition = 3

        manaCostLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        manaCostLabel.fontSize = 10
        manaCostLabel.fontColor = .white
        manaCostLabel.horizontalAlignmentMode = .center
        manaCostLabel.verticalAlignmentMode = .center
        manaCostLabel.text = "\(creature.manaCost)"
        manaCostBadge.addChild(manaCostLabel)

        // Tier badge — top-right corner colored dot
        tierBadge = SKShapeNode(circleOfRadius: SK.Card.tierBadgeSize / 2)
        tierBadge.fillColor = .clear // Will be set based on evolution tier data
        tierBadge.strokeColor = .clear
        tierBadge.position = CGPoint(x: cardSize.width / 2 - 10, y: cardSize.height / 2 - 10)
        tierBadge.zPosition = 3

        super.init(texture: nil, color: .clear, size: cardSize)
        self.name = "creature_\(creature.instanceId)"

        // Background rounded rect
        let bg = SKShapeNode(rectOf: cardSize, cornerRadius: SK.Board.slotCornerRadius)
        bg.fillColor = UIColor(hex: "#1A1A1A")
        bg.strokeColor = factionColor.withAlphaComponent(0.6)
        bg.lineWidth = 1.5
        bg.zPosition = 0
        addChild(bg)

        addChild(cardArtNode)
        addChild(statsBarNode)
        addChild(atkLabel)
        addChild(hpLabel)
        addChild(nameLabel)
        addChild(manaCostBadge)
        addChild(tierBadge)

        // Setup keywords
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

    // MARK: - Keyword Icons

    private func setupKeywordIcons(_ keywords: [Keyword]) {
        // Remove old icons
        keywordIcons.forEach { $0.removeFromParent() }
        keywordIcons.removeAll()

        let displayKeywords = Array(keywords.prefix(SK.Card.maxKeywordIcons))
        let spacing: CGFloat = SK.Card.keywordIconSize + 2
        let totalWidth = CGFloat(displayKeywords.count) * spacing - 2
        let startX = -totalWidth / 2 + SK.Card.keywordIconSize / 2

        for (index, keyword) in displayKeywords.enumerated() {
            let icon = SKSpriteNode(color: keywordColor(keyword), size: CGSize(width: SK.Card.keywordIconSize, height: SK.Card.keywordIconSize))
            icon.position = CGPoint(x: startX + CGFloat(index) * spacing, y: -size.height / 2 + size.height * SK.Card.statsBarRatio + SK.Card.keywordIconSize)
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

    // MARK: - Taunt Icon

    private func setupTauntIcon() {
        let icon = SKSpriteNode(color: UIColor(hex: "#FFD700"), size: CGSize(width: 14, height: 14))
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

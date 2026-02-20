// CreatureNode.swift
// Chaos Creatures
// BoardCardNode — full-art card on board with textured layers matching CardFrameView:
// canvas weave overlay, faction border texture, faction text panel, wax-seal medallion
// stat badges (ATK bottom-left, HP bottom-right, CM top-right), rarity glow, contact
// shadow, and selection states. At 64x90pt the card name is omitted — too small to read.
// Source: docs/design/07-ui-ux-specs.md Section 3.3

import SpriteKit

/// A card on the battlefield board. Full-bleed art fills the card bounds.
/// Texture layers (canvas weave, faction border, text panel) give the hand-painted
/// paper-card feel matching the SwiftUI CardFrameView. Wax-seal medallion stat badges
/// overlay corners: CM top-right, ATK bottom-left, HP bottom-right.
/// Rarity is expressed as a colored glow behind the card.
final class CreatureNode: SKSpriteNode {

    // MARK: - Child Nodes

    private let cardArtNode: SKSpriteNode
    private let cmBadge: SKNode
    private let cmLabel: SKLabelNode
    private let atkBadge: SKNode
    private let atkLabel: SKLabelNode
    private let hpBadge: SKNode
    private let hpLabel: SKLabelNode
    private var tauntIcon: SKSpriteNode?
    private var shieldOverlay: SKShapeNode?
    private var rarityGlowNode: SKSpriteNode?

    /// Centered type label for non-creature cards (spells, stabilizers, ruins)
    private var typeLabel: SKLabelNode?

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
        let cornerRadius = SK.Board.slotCornerRadius
        let faction = creature.factionShortName

        // --- Full-bleed card art (fills entire card) ---
        cardArtNode = SKSpriteNode(color: factionColor.withAlphaComponent(0.3), size: cardSize)
        cardArtNode.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        cardArtNode.position = .zero
        cardArtNode.zPosition = 0

        // --- Medallion stat badges ---

        // CM cost badge (top-right) — wax seal medallion
        let cmRadius = SK.Card.boardCMBadgeRadius
        let cmContainer = SKNode()
        cmContainer.position = CGPoint(x: cardSize.width / 2 - cmRadius - 2,
                                       y: cardSize.height / 2 - cmRadius - 2)
        cmContainer.zPosition = 3

        cmLabel = SKLabelNode(fontNamed: SK.Fonts.statNumber)
        cmLabel.fontSize = SK.Card.boardCMFontSize
        cmLabel.fontColor = SK.CardTextures.parchmentText
        cmLabel.horizontalAlignmentMode = .center
        cmLabel.verticalAlignmentMode = .center
        cmLabel.position = .zero
        cmLabel.zPosition = 4
        cmLabel.text = "\(creature.manaCost)"
        cmBadge = cmContainer

        // ATK badge (bottom-left) — wax seal medallion
        let statRadius = SK.Card.boardStatBadgeRadius
        let atkContainer = SKNode()
        atkContainer.position = CGPoint(x: -cardSize.width / 2 + statRadius + 2,
                                        y: -cardSize.height / 2 + statRadius + 2)
        atkContainer.zPosition = 3

        atkLabel = SKLabelNode(fontNamed: SK.Fonts.statNumber)
        atkLabel.fontSize = SK.Card.boardStatFontSize
        atkLabel.fontColor = SK.CardTextures.parchmentText
        atkLabel.horizontalAlignmentMode = .center
        atkLabel.verticalAlignmentMode = .center
        atkLabel.position = .zero
        atkLabel.zPosition = 4
        atkLabel.text = "\(creature.attack)"
        atkBadge = atkContainer

        // HP badge (bottom-right) — wax seal medallion
        let hpContainer = SKNode()
        hpContainer.position = CGPoint(x: cardSize.width / 2 - statRadius - 2,
                                       y: -cardSize.height / 2 + statRadius + 2)
        hpContainer.zPosition = 3

        hpLabel = SKLabelNode(fontNamed: SK.Fonts.statNumber)
        hpLabel.fontSize = SK.Card.boardStatFontSize
        hpLabel.fontColor = SK.CardTextures.parchmentText
        hpLabel.horizontalAlignmentMode = .center
        hpLabel.verticalAlignmentMode = .center
        hpLabel.position = .zero
        hpLabel.zPosition = 4
        hpLabel.text = "\(creature.health)"
        hpBadge = hpContainer

        // --- Super init ---
        super.init(texture: nil, color: .clear, size: cardSize)
        self.name = "creature_\(creature.instanceId)"

        // ====================================================================
        // LAYER STACK (back to front)
        // ====================================================================

        // Layer -3: Contact shadow — warm soft shadow beneath the card
        let shadowSize = CGSize(width: cardSize.width + 4, height: cardSize.height + 2)
        let shadowNode = SKShapeNode(rectOf: shadowSize, cornerRadius: cornerRadius + 1)
        shadowNode.fillColor = UIColor(hex: "#1A1408").withAlphaComponent(0.45)
        shadowNode.strokeColor = .clear
        shadowNode.position = CGPoint(x: 0, y: -2)
        shadowNode.zPosition = -3
        shadowNode.name = "contact_shadow"
        addChild(shadowNode)

        // Layer -2: Rarity glow (colored sprite behind card)
        applyRarityGlow(creature.evolutionTier)

        // Layer -1: Background rounded rect with faction border texture
        setupFactionBorder(cardSize: cardSize, cornerRadius: cornerRadius,
                           faction: faction, tier: creature.evolutionTier)

        // Layer 0: Card art
        addChild(cardArtNode)

        // Layer 0.5: Canvas weave texture overlay (multiply blend, hand-painted feel)
        let canvasWeave = SKSpriteNode(imageNamed: SK.CardTextures.canvasWeave)
        canvasWeave.size = cardSize
        canvasWeave.position = .zero
        canvasWeave.zPosition = 0.5
        canvasWeave.alpha = 0.15
        canvasWeave.blendMode = .multiply
        canvasWeave.name = "canvas_weave"
        addChild(canvasWeave)

        // Layer 1: Faction text panel texture at bottom (small — just enough for stat context)
        setupTextPanelTexture(cardSize: cardSize, faction: faction)

        // Faction-specific stat icon names
        let cmIcon = SK.CardTextures.cmIconName(faction: faction)
        let atkIcon = SK.CardTextures.atkIconName(faction: faction)
        let hpIcon = SK.CardTextures.hpIconName(faction: faction)

        // Layer 3: CM badge (medallion)
        setupMedallionBadge(container: cmContainer, radius: cmRadius,
                            tintColor: SK.CardTextures.cmTintColor,
                            iconName: cmIcon, label: cmLabel)
        addChild(cmBadge)

        // Planar Ruins have HP but no ATK — hide ATK badge for ruins
        let isRuin = creature.cardType == .planarRuin
        let isCreature = creature.cardType == .creature

        if isCreature {
            // Creatures show ATK and HP badges
            setupMedallionBadge(container: atkContainer, radius: statRadius,
                                tintColor: SK.CardTextures.atkTintColor,
                                iconName: atkIcon, label: atkLabel)
            addChild(atkBadge)

            setupMedallionBadge(container: hpContainer, radius: statRadius,
                                tintColor: SK.CardTextures.hpTintColor,
                                iconName: hpIcon, label: hpLabel)
            addChild(hpBadge)
        } else if isRuin {
            // Ruins show HP badge only (no ATK)
            setupMedallionBadge(container: hpContainer, radius: statRadius,
                                tintColor: SK.CardTextures.hpTintColor,
                                iconName: hpIcon, label: hpLabel)
            addChild(hpBadge)

            // Ruin visual overlay: subtle stone/ruin tint border
            let ruinOverlay = SKShapeNode(rectOf: cardSize, cornerRadius: cornerRadius)
            ruinOverlay.fillColor = .clear
            ruinOverlay.strokeColor = UIColor(hex: "#8B8680").withAlphaComponent(0.6)
            ruinOverlay.lineWidth = 2.0
            ruinOverlay.zPosition = 5
            ruinOverlay.name = "ruin_overlay"
            addChild(ruinOverlay)
        } else {
            // Spells/Stabilizers on board: show CM badge + centered type text instead of ATK/HP
            let typeLbl = SKLabelNode(fontNamed: SK.Fonts.bold)
            typeLbl.fontSize = 8
            typeLbl.fontColor = UIColor(hex: "#AAAAAA")
            typeLbl.horizontalAlignmentMode = .center
            typeLbl.verticalAlignmentMode = .center
            typeLbl.position = CGPoint(x: 0, y: -cardSize.height / 2 + 12)
            typeLbl.zPosition = 3
            typeLbl.text = creature.cardType == .spell ? "Spell" : "Ruin"
            addChild(typeLbl)
            self.typeLabel = typeLbl
        }

        // Layer 4: Faction accent (subtle inner glow at board scale)
        setupFactionAccent(faction: faction, cardSize: cardSize, cornerRadius: cornerRadius)

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

    // MARK: - Faction Border Texture

    /// Background with faction-specific border texture instead of a flat color border.
    /// The border texture is placed behind the art; the art covers the inner area,
    /// leaving only the 2pt border edge of the texture visible around the card.
    private func setupFactionBorder(cardSize: CGSize, cornerRadius: CGFloat,
                                    faction: FactionShortName?, tier: EvolutionTier) {
        // Faction border texture fills the full card — the art sprite on top covers
        // the inner area, leaving only the border edges visible.
        let borderTexture = SKSpriteNode(imageNamed: SK.CardTextures.borderAssetName(faction: faction))
        borderTexture.size = cardSize
        borderTexture.position = .zero
        borderTexture.alpha = 0.85
        borderTexture.zPosition = -1
        borderTexture.name = "faction_border"

        // Crop the border texture to the card's rounded rect shape
        let borderCropMask = SKShapeNode(rectOf: cardSize, cornerRadius: cornerRadius)
        borderCropMask.fillColor = .white
        borderCropMask.strokeColor = .clear

        let borderCrop = SKCropNode()
        borderCrop.maskNode = borderCropMask
        borderCrop.addChild(borderTexture)
        borderCrop.zPosition = -1
        addChild(borderCrop)

        // Dark base fill for the inner card area (behind art)
        let innerInset: CGFloat = 2.0
        let innerSize = CGSize(width: cardSize.width - innerInset * 2,
                               height: cardSize.height - innerInset * 2)
        let innerBg = SKShapeNode(rectOf: innerSize, cornerRadius: max(cornerRadius - innerInset, 2))
        innerBg.fillColor = UIColor(hex: "#1A1A1A")
        innerBg.strokeColor = .clear
        innerBg.zPosition = -0.8
        innerBg.name = "card_bg"
        addChild(innerBg)

        // Thin rarity-tinted stroke on top of the textured border
        let strokeOverlay = SKShapeNode(rectOf: cardSize, cornerRadius: cornerRadius)
        strokeOverlay.fillColor = .clear
        strokeOverlay.strokeColor = tier.borderUIColor.withAlphaComponent(0.5)
        strokeOverlay.lineWidth = 1.0
        strokeOverlay.zPosition = -0.4
        addChild(strokeOverlay)
    }

    // MARK: - Text Panel Texture

    /// Faction-specific text panel texture at the bottom of the card.
    private func setupTextPanelTexture(cardSize: CGSize, faction: FactionShortName?) {
        let panelHeight: CGFloat = cardSize.height * 0.20 // Slightly shorter on board cards
        let panelWidth: CGFloat = cardSize.width - 4 // Inset 2pt from each side

        let textPanelSprite = SKSpriteNode(imageNamed: SK.CardTextures.textPanelAssetName(faction: faction))
        textPanelSprite.size = CGSize(width: panelWidth, height: panelHeight)
        textPanelSprite.anchorPoint = CGPoint(x: 0.5, y: 0)
        textPanelSprite.position = CGPoint(x: 0, y: -cardSize.height / 2 + 2)
        textPanelSprite.zPosition = 1
        textPanelSprite.alpha = 0.7
        textPanelSprite.name = "text_panel"

        // Darkening overlay for contrast (matches CardFrameView dark-vellum treatment)
        let darkenOverlay = SKSpriteNode(color: .black.withAlphaComponent(0.25),
                                         size: CGSize(width: panelWidth, height: panelHeight))
        darkenOverlay.anchorPoint = CGPoint(x: 0.5, y: 0)
        darkenOverlay.position = CGPoint(x: 0, y: -cardSize.height / 2 + 2)
        darkenOverlay.zPosition = 1.1
        darkenOverlay.name = "text_panel_darken"

        addChild(textPanelSprite)
        addChild(darkenOverlay)
    }

    // MARK: - Medallion Badge Setup

    /// Creates a wax-seal medallion badge at the given container position.
    /// Matches the SwiftUI MedallionBadge: wax-seal-bronze texture base, faction color
    /// tint, stat icon at low opacity, embossed rim, and Bebas Neue stat number.
    private func setupMedallionBadge(container: SKNode, radius: CGFloat,
                                     tintColor: UIColor, iconName: String,
                                     label: SKLabelNode) {
        let diameter = radius * 2

        // 1. Wax seal bronze texture base, clipped to circle
        let sealTexture = SKSpriteNode(imageNamed: SK.CardTextures.waxSealBronze)
        sealTexture.size = CGSize(width: diameter, height: diameter)
        sealTexture.zPosition = 0

        let sealCrop = SKCropNode()
        let sealMask = SKShapeNode(circleOfRadius: radius)
        sealMask.fillColor = .white
        sealCrop.maskNode = sealMask
        sealCrop.addChild(sealTexture)
        sealCrop.zPosition = 0
        container.addChild(sealCrop)

        // 2. Stat color tint overlay
        let tintCircle = SKShapeNode(circleOfRadius: radius)
        tintCircle.fillColor = tintColor.withAlphaComponent(0.35)
        tintCircle.strokeColor = .clear
        tintCircle.zPosition = 1
        container.addChild(tintCircle)

        // 3. Stat icon texture at low opacity (overlay blend)
        let iconSprite = SKSpriteNode(imageNamed: iconName)
        iconSprite.size = CGSize(width: diameter, height: diameter)
        iconSprite.alpha = 0.25
        iconSprite.blendMode = .alpha
        let iconCrop = SKCropNode()
        let iconMask = SKShapeNode(circleOfRadius: radius)
        iconMask.fillColor = .white
        iconCrop.maskNode = iconMask
        iconCrop.addChild(iconSprite)
        iconCrop.zPosition = 2
        container.addChild(iconCrop)

        // 4. Embossed rim — dark outer ring
        let outerRim = SKShapeNode(circleOfRadius: radius)
        outerRim.fillColor = .clear
        outerRim.strokeColor = SK.CardTextures.rimDark.withAlphaComponent(0.8)
        outerRim.lineWidth = max(radius * 0.12, 0.75)
        outerRim.zPosition = 3
        container.addChild(outerRim)

        // 5. Inner highlight — simulates light hitting metal edge
        let innerRim = SKShapeNode(circleOfRadius: radius * 0.88)
        innerRim.fillColor = .clear
        innerRim.strokeColor = SK.CardTextures.rimHighlight.withAlphaComponent(0.35)
        innerRim.lineWidth = 0.5
        innerRim.zPosition = 3.5
        container.addChild(innerRim)

        // 6. Number label (Bebas Neue)
        label.zPosition = 4
        // Drop shadow effect via a second label behind
        let shadowLabel = SKLabelNode(fontNamed: SK.Fonts.statNumber)
        shadowLabel.fontSize = label.fontSize
        shadowLabel.fontColor = .black.withAlphaComponent(0.85)
        shadowLabel.horizontalAlignmentMode = .center
        shadowLabel.verticalAlignmentMode = .center
        shadowLabel.position = CGPoint(x: 0, y: -0.5)
        shadowLabel.zPosition = 3.8
        shadowLabel.text = label.text
        shadowLabel.name = "stat_shadow"
        container.addChild(shadowLabel)
        container.addChild(label)
    }

    // MARK: - Faction Accent

    /// Subtle faction-specific accent at board card scale — a thin inner glow line
    /// in the faction's accent color, visible along the card edges.
    private func setupFactionAccent(faction: FactionShortName?, cardSize: CGSize, cornerRadius: CGFloat) {
        guard let faction = faction else { return }

        let accentColor: UIColor
        switch faction {
        case .ironwright: accentColor = UIColor(hex: "#E07020") // Warning orange
        case .feyCourts: accentColor = UIColor(hex: "#7FFFD4")  // Bioluminescent
        case .demonicKingdoms: accentColor = UIColor(hex: "#FF4500") // Volcanic
        case .celestialCrusade: accentColor = UIColor(hex: "#DAA520") // Holy gold
        case .theEndless: accentColor = UIColor(hex: "#2DD4BF")  // Ghostly teal
        }

        let innerGlow = SKShapeNode(rectOf: CGSize(width: cardSize.width - 4,
                                                     height: cardSize.height - 4),
                                     cornerRadius: max(cornerRadius - 2, 2))
        innerGlow.fillColor = .clear
        innerGlow.strokeColor = accentColor.withAlphaComponent(0.15)
        innerGlow.lineWidth = 0.75
        innerGlow.zPosition = 2.5
        innerGlow.name = "faction_accent"
        addChild(innerGlow)
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

        // Also update shadow labels
        if let atkShadow = atkBadge.childNode(withName: "stat_shadow") as? SKLabelNode {
            atkShadow.text = "\(attack)"
        }
        if let hpShadow = hpBadge.childNode(withName: "stat_shadow") as? SKLabelNode {
            hpShadow.text = "\(health)"
        }

        // Color HP badge tint red if damaged
        let hpTintNode = hpBadge.children.compactMap { $0 as? SKShapeNode }.first { $0.fillColor != .clear }
        if let tintNode = hpTintNode {
            if health < maxHealth {
                tintNode.fillColor = UIColor(hex: "#F44336").withAlphaComponent(0.45)
            } else {
                tintNode.fillColor = SK.CardTextures.hpTintColor.withAlphaComponent(0.35)
            }
        }
    }

    /// Update keywords display (taunt indicator only at board scale)
    func updateKeywords(_ keywords: [Keyword]) {
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

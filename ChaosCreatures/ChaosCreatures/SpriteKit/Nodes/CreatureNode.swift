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
    private var rarityBorderNode: SKShapeNode?
    private var raritySparkles: [SKShapeNode] = []

    /// Centered type label for non-creature cards (spells, stabilizers, ruins)
    private var typeLabel: SKLabelNode?

    /// Exhausted/tapped state nodes
    private var exhaustedGlyph: SKSpriteNode?
    private var desaturationEffectNode: SKEffectNode?
    private(set) var isExhausted: Bool = false

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

        // Layer -3: Contact shadow — warm-tinted ellipse at the BASE of the card,
        // dark at contact point, fading quickly. Not pure black: slightly warm brown.
        setupContactShadow(cardSize: cardSize)

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

        // Layer 5: Rarity-specific inner border treatment (Wave 7)
        applyRarityTreatment(tier: creature.evolutionTier, cardSize: cardSize, cornerRadius: cornerRadius)

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

    // MARK: - Rarity Treatment (Wave 7 — Inner Border Effects)

    /// Apply tier-specific rarity inner border treatment.
    /// Common: nothing. Uncommon: thin silver border. Rare: gold border with glow.
    /// Epic: rainbow shimmer border. Legendary: rainbow shimmer + pulse + sparkle dots.
    private func applyRarityTreatment(tier: EvolutionTier, cardSize: CGSize, cornerRadius: CGFloat) {
        // Clean up any previous treatment
        rarityBorderNode?.removeFromParent()
        rarityBorderNode = nil
        raritySparkles.forEach { $0.removeFromParent() }
        raritySparkles.removeAll()

        switch tier {
        case .common:
            break // No treatment — matte frame only

        case .uncommon:
            let inset = SK.RarityEffects.uncommonBorderInset
            let borderSize = CGSize(width: cardSize.width - inset * 2,
                                    height: cardSize.height - inset * 2)
            let border = SKShapeNode(rectOf: borderSize,
                                     cornerRadius: max(cornerRadius - inset, 2))
            border.fillColor = .clear
            border.strokeColor = SK.RarityEffects.uncommonBorderColor
                .withAlphaComponent(SK.RarityEffects.uncommonBorderAlpha)
            border.lineWidth = SK.RarityEffects.uncommonBorderWidth
            border.zPosition = 5.5
            border.name = "rarity_border"
            addChild(border)
            rarityBorderNode = border

        case .rare:
            let inset = SK.RarityEffects.rareBorderInset
            let borderSize = CGSize(width: cardSize.width - inset * 2,
                                    height: cardSize.height - inset * 2)
            let border = SKShapeNode(rectOf: borderSize,
                                     cornerRadius: max(cornerRadius - inset, 2))
            border.fillColor = .clear
            border.strokeColor = SK.RarityEffects.rareBorderColor
                .withAlphaComponent(SK.RarityEffects.rareBorderAlpha)
            border.lineWidth = SK.RarityEffects.rareBorderWidth
            border.glowWidth = SK.RarityEffects.rareBorderGlowWidth
            border.zPosition = 5.5
            border.name = "rarity_border"
            addChild(border)
            rarityBorderNode = border

        case .epic:
            let inset = SK.RarityEffects.epicBorderInset
            let borderSize = CGSize(width: cardSize.width - inset * 2,
                                    height: cardSize.height - inset * 2)
            let border = SKShapeNode(rectOf: borderSize,
                                     cornerRadius: max(cornerRadius - inset, 2))
            border.fillColor = .clear
            border.strokeColor = SK.RarityEffects.epicShimmerColors[0]
                .withAlphaComponent(SK.RarityEffects.epicBorderBaseAlpha)
            border.lineWidth = SK.RarityEffects.epicBorderWidth
            border.glowWidth = 1.0
            border.zPosition = 5.5
            border.name = "rarity_border"
            addChild(border)
            rarityBorderNode = border

            // Rainbow shimmer via color cycling
            let shimmerColors = SK.RarityEffects.epicShimmerColors
            let stepDuration = SK.RarityEffects.epicShimmerStepDuration
            let blendFactor = SK.RarityEffects.epicShimmerBlendFactor
            var colorActions: [SKAction] = []
            for color in shimmerColors {
                colorActions.append(
                    SKAction.colorize(with: color,
                                      colorBlendFactor: blendFactor,
                                      duration: stepDuration)
                )
            }
            border.run(SKAction.repeatForever(SKAction.sequence(colorActions)),
                       withKey: "epicShimmer")

        case .legendary:
            let inset = SK.RarityEffects.legendaryBorderInset
            let borderSize = CGSize(width: cardSize.width - inset * 2,
                                    height: cardSize.height - inset * 2)
            let border = SKShapeNode(rectOf: borderSize,
                                     cornerRadius: max(cornerRadius - inset, 2))
            border.fillColor = .clear
            border.strokeColor = SK.RarityEffects.epicShimmerColors[0]
                .withAlphaComponent(SK.RarityEffects.legendaryBorderBaseAlpha)
            border.lineWidth = SK.RarityEffects.legendaryBorderWidth
            border.glowWidth = 1.5
            border.zPosition = 5.5
            border.name = "rarity_border"
            addChild(border)
            rarityBorderNode = border

            // Rainbow shimmer at higher intensity
            let shimmerColors = SK.RarityEffects.epicShimmerColors
            let stepDuration = SK.RarityEffects.legendaryShimmerStepDuration
            let blendFactor = SK.RarityEffects.legendaryShimmerBlendFactor
            var colorActions: [SKAction] = []
            for color in shimmerColors {
                colorActions.append(
                    SKAction.colorize(with: color,
                                      colorBlendFactor: blendFactor,
                                      duration: stepDuration)
                )
            }
            border.run(SKAction.repeatForever(SKAction.sequence(colorActions)),
                       withKey: "legendaryShimmer")

            // Animated pulse glow on the border (slow scale 1.0 -> 1.02 -> 1.0)
            let pulseUp = SKAction.scale(to: SK.RarityEffects.legendaryPulseScaleMax,
                                         duration: SK.RarityEffects.legendaryPulseDuration / 2)
            pulseUp.timingMode = .easeInEaseOut
            let pulseDown = SKAction.scale(to: 1.0,
                                           duration: SK.RarityEffects.legendaryPulseDuration / 2)
            pulseDown.timingMode = .easeInEaseOut
            border.run(SKAction.repeatForever(SKAction.sequence([pulseUp, pulseDown])),
                       withKey: "legendaryPulse")

            // Extended art: expand card art by 4pt on each side
            let extendedSize = CGSize(
                width: cardSize.width + SK.RarityEffects.legendaryArtExtension * 2,
                height: cardSize.height + SK.RarityEffects.legendaryArtExtension * 2
            )
            cardArtNode.size = extendedSize

            // Floating sparkle dots (lightweight SKShapeNode, no emitter)
            spawnLegendarySparkles(cardSize: cardSize)
        }
    }

    /// Spawn a few small floating sparkle dots that drift randomly around the card.
    /// Uses SKShapeNode circles instead of SKEmitterNode for lightweight 60fps performance.
    private func spawnLegendarySparkles(cardSize: CGSize) {
        let count = SK.RarityEffects.legendarySparkleCount
        let radius = SK.RarityEffects.legendarySparkleRadius
        let sparkleColor = SK.RarityEffects.legendarySparkleColor
        let halfW = cardSize.width / 2
        let halfH = cardSize.height / 2

        for i in 0..<count {
            let dot = SKShapeNode(circleOfRadius: radius)
            dot.fillColor = sparkleColor
            dot.strokeColor = .clear
            dot.alpha = 0.0
            dot.zPosition = 6.0
            dot.name = "legendary_sparkle_\(i)"

            // Random starting position along the card border area
            let startX = CGFloat.random(in: -halfW...halfW)
            let startY = CGFloat.random(in: -halfH...halfH)
            dot.position = CGPoint(x: startX, y: startY)
            addChild(dot)
            raritySparkles.append(dot)

            // Each sparkle: fade in, drift randomly, fade out, reposition, repeat
            let initialDelay = SKAction.wait(forDuration: Double(i) * 0.6)
            let driftCycle = createSparkleDriftCycle(halfW: halfW, halfH: halfH)
            dot.run(SKAction.sequence([initialDelay,
                                       SKAction.repeatForever(driftCycle)]),
                    withKey: "sparkleDrift_\(i)")
        }
    }

    /// One cycle of a sparkle: fade in, drift, fade out, reposition.
    private func createSparkleDriftCycle(halfW: CGFloat, halfH: CGFloat) -> SKAction {
        let fadeIn = SKAction.fadeAlpha(to: CGFloat.random(in: 0.5...0.9),
                                        duration: 0.4)
        let drift = SKAction.moveBy(x: CGFloat.random(in: -8...8),
                                    y: CGFloat.random(in: -8...8),
                                    duration: 1.8)
        drift.timingMode = .easeInEaseOut
        let fadeOut = SKAction.fadeOut(withDuration: 0.4)
        let reposition = SKAction.run { [weak self] in
            guard let self = self else { return }
            _ = self // keep reference alive
        }
        let moveTo = SKAction.move(to: CGPoint(
            x: CGFloat.random(in: -halfW...halfW),
            y: CGFloat.random(in: -halfH...halfH)
        ), duration: 0)

        return SKAction.sequence([fadeIn, drift, fadeOut, moveTo, reposition])
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

    // MARK: - Stat Stamp Animations (Wave 6 Visual Polish)

    /// Stored references for stat label default colors to restore after stamp animation.
    /// Parchment text color is the default for all stat labels.
    private static let defaultStatColor = SK.CardTextures.parchmentText
    private static let damageStampColor = UIColor(hex: "#991B1B")  // Muted red
    private static let buffStampColor = UIColor(hex: "#F59E0B")    // Warm gold

    /// Play a "stamp" animation on the HP label for damage taken.
    /// The old numeral fades out, new numeral appears with an emboss pulse
    /// (starts 1.3x scale, snaps to 1.0x with bounce), HP label flashes muted red,
    /// and the card shakes briefly (2-3px, 0.15s). Total duration ~0.3s.
    func playDamageStamp(newHp: Int, maxHealth: Int) {
        // Update the HP badge tint to red if damaged
        let hpTintNode = hpBadge.children.compactMap { $0 as? SKShapeNode }.first { $0.fillColor != .clear }
        if let tintNode = hpTintNode, newHp < maxHealth {
            tintNode.fillColor = UIColor(hex: "#F44336").withAlphaComponent(0.45)
        }

        playStatStamp(on: hpLabel, container: hpBadge, newValue: newHp, isDamage: true)

        // Card-local screen shake (not the whole scene)
        playCardShake()
    }

    /// Play a "stamp" animation on the HP label for a buff (heal).
    /// Same emboss pulse but with warm gold color and upward-rising sparkle particles.
    func playBuffStamp(newHp: Int, maxHealth: Int) {
        // Restore HP badge tint if healed to full
        let hpTintNode = hpBadge.children.compactMap { $0 as? SKShapeNode }.first { $0.fillColor != .clear }
        if let tintNode = hpTintNode {
            if newHp >= maxHealth {
                tintNode.fillColor = SK.CardTextures.hpTintColor.withAlphaComponent(0.35)
            }
        }

        playStatStamp(on: hpLabel, container: hpBadge, newValue: newHp, isDamage: false)

        // Sparkle particles rising from the HP badge
        playBuffSparkle(at: hpBadge.position)
    }

    /// Play a "stamp" animation on the ATK label for damage (debuff).
    func playAtkDamageStamp(newAtk: Int) {
        playStatStamp(on: atkLabel, container: atkBadge, newValue: newAtk, isDamage: true)

        // Card-local screen shake for ATK debuffs
        playCardShake()
    }

    /// Play a "stamp" animation on the ATK label for a buff.
    func playAtkBuffStamp(newAtk: Int) {
        playStatStamp(on: atkLabel, container: atkBadge, newValue: newAtk, isDamage: false)

        // Sparkle particles rising from the ATK badge
        playBuffSparkle(at: atkBadge.position)
    }

    /// Core stamp animation shared by damage and buff variants.
    /// Fades old numeral out quickly (0.1s), shows new numeral with emboss pulse (1.3x -> 1.0x bounce),
    /// shifts label color to red (damage) or gold (buff), then restores default after hold.
    private func playStatStamp(on label: SKLabelNode, container: SKNode, newValue: Int, isDamage: Bool) {
        let stampColor = isDamage ? Self.damageStampColor : Self.buffStampColor
        let actionKey = "statStamp_\(ObjectIdentifier(label).hashValue)"

        // Remove any in-progress stamp animation on this label
        label.removeAction(forKey: actionKey)

        // Also update the shadow label behind the stat number
        let shadowLabel = container.childNode(withName: "stat_shadow") as? SKLabelNode

        // Phase 1: Quick fade out of old value (0.1s)
        let fadeOut = SKAction.fadeAlpha(to: 0.2, duration: 0.1)

        // Phase 2: Update text and start emboss pulse
        let updateAndPulse = SKAction.run { [weak label, weak shadowLabel] in
            label?.text = "\(newValue)"
            shadowLabel?.text = "\(newValue)"
            label?.fontColor = stampColor
            label?.alpha = 1.0
            label?.setScale(1.3)
        }

        // Phase 3: Bounce scale down from 1.3x to 1.0x with easeOut timing (0.15s)
        let bounceDown = SKAction.scale(to: 1.0, duration: 0.15)
        bounceDown.timingMode = .easeOut

        // Phase 4: Brief shadow flicker — darken shadow and brighten back
        let shadowFlicker = SKAction.run { [weak shadowLabel] in
            shadowLabel?.fontColor = .black.withAlphaComponent(1.0)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
                shadowLabel?.fontColor = .black.withAlphaComponent(0.85)
            }
        }

        // Phase 5: Hold the stamp color briefly then restore (total ~0.3s from start)
        let holdColor = SKAction.wait(forDuration: 0.25)
        let restoreColor = SKAction.run { [weak label] in
            label?.fontColor = Self.defaultStatColor
        }

        let sequence = SKAction.sequence([
            fadeOut,
            updateAndPulse,
            SKAction.group([bounceDown, shadowFlicker]),
            holdColor,
            restoreColor
        ])

        label.run(sequence, withKey: actionKey)
    }

    /// Brief card-local shake (2-3px random offset for 0.15s).
    /// Only shakes this card node, not the entire scene.
    private func playCardShake() {
        let shakeKey = "cardDamageShake"
        removeAction(forKey: shakeKey)

        let originalPos = self.position
        let shakeCount = 4
        var shakeActions: [SKAction] = []

        for _ in 0..<shakeCount {
            let offsetX = CGFloat.random(in: -3...3)
            let offsetY = CGFloat.random(in: -2...2)
            let duration = 0.15 / Double(shakeCount)
            let targetPos = CGPoint(x: originalPos.x + offsetX, y: originalPos.y + offsetY)
            let move = SKAction.move(to: targetPos, duration: duration)
            move.timingMode = .easeInEaseOut
            shakeActions.append(move)
        }

        // Snap back to original position at end
        let snapBack = SKAction.move(to: originalPos, duration: 0.03)
        snapBack.timingMode = .easeOut
        shakeActions.append(snapBack)

        run(SKAction.sequence(shakeActions), withKey: shakeKey)
    }

    /// Small upward-rising gold sparkle particles from the given local position.
    /// 2-3 small particles fade out over 0.5s. Lightweight — SKShapeNode circles, no emitter.
    private func playBuffSparkle(at localPos: CGPoint) {
        let sparkleCount = 3
        for i in 0..<sparkleCount {
            let sparkle = SKShapeNode(circleOfRadius: 1.5)
            sparkle.fillColor = Self.buffStampColor
            sparkle.strokeColor = .clear
            sparkle.position = CGPoint(
                x: localPos.x + CGFloat.random(in: -4...4),
                y: localPos.y
            )
            sparkle.zPosition = 10
            sparkle.alpha = 0.9
            sparkle.name = "buff_sparkle_\(i)"
            addChild(sparkle)

            let delay = SKAction.wait(forDuration: Double(i) * 0.08)
            let riseAndFade = SKAction.group([
                SKAction.moveBy(x: CGFloat.random(in: -3...3), y: 12, duration: 0.5),
                SKAction.fadeOut(withDuration: 0.5),
                SKAction.scale(to: 0.3, duration: 0.5)
            ])
            let cleanup = SKAction.removeFromParent()

            sparkle.run(SKAction.sequence([delay, riseAndFade, cleanup]))
        }
    }

    // MARK: - Furnace Lords Lava Pulse (Wave 6 Visual Polish)

    /// Action keys for lava pulse animations.
    private static let lavaPulseKey = "furnaceLavaPulse"
    private static let lavaPulseBloomKey = "furnaceLavaPulseBloom"

    /// Set up a subtle ambient lava vein glow animation along the card border.
    /// Only for Demonic faction creatures (Furnace Lords is the primary sub-faction visual).
    /// Uses two thin SKShapeNode lines: a 1.5px foreground line and a wider bloom line behind it.
    /// Alpha pulses slowly (3.5s cycle). Very lightweight — SKAction on alpha only, no CIFilter.
    func setupLavaPulse() {
        // Don't add duplicate lava pulse
        guard childNode(withName: "lava_pulse_line") == nil else { return }

        let cardSize = SK.Board.slotSize
        let cornerRadius = SK.Board.slotCornerRadius
        let lavaColor = UIColor(hex: "#FF4500") // Volcanic orange

        // Foreground lava vein line — 1.5px, along card border, inset slightly
        let inset: CGFloat = 1.5
        let lineSize = CGSize(width: cardSize.width - inset * 2, height: cardSize.height - inset * 2)
        let lineRadius = max(cornerRadius - inset, 2)

        let lavaLine = SKShapeNode(rectOf: lineSize, cornerRadius: lineRadius)
        lavaLine.fillColor = .clear
        lavaLine.strokeColor = lavaColor
        lavaLine.lineWidth = 1.5
        lavaLine.alpha = 0.3
        lavaLine.zPosition = 5.5  // Above ruin overlay, below stat badges
        lavaLine.name = "lava_pulse_line"
        lavaLine.glowWidth = 0.5
        addChild(lavaLine)

        // Background bloom line — wider, very low alpha, gives the glow/bloom effect
        let bloomLine = SKShapeNode(rectOf: lineSize, cornerRadius: lineRadius)
        bloomLine.fillColor = .clear
        bloomLine.strokeColor = lavaColor
        bloomLine.lineWidth = 4.0
        bloomLine.alpha = 0.1
        bloomLine.zPosition = 5.4
        bloomLine.name = "lava_pulse_bloom"
        addChild(bloomLine)

        // Animate foreground line alpha: 0.3 -> 0.6 -> 0.3 in a 3.5s cycle
        let pulseDuration: TimeInterval = 1.75  // half-cycle
        let pulseUp = SKAction.fadeAlpha(to: 0.6, duration: pulseDuration)
        pulseUp.timingMode = .easeInEaseOut
        let pulseDown = SKAction.fadeAlpha(to: 0.3, duration: pulseDuration)
        pulseDown.timingMode = .easeInEaseOut
        let linePulse = SKAction.sequence([pulseUp, pulseDown])
        lavaLine.run(SKAction.repeatForever(linePulse), withKey: Self.lavaPulseKey)

        // Animate bloom line alpha: 0.05 -> 0.15 -> 0.05 (very subtle)
        let bloomUp = SKAction.fadeAlpha(to: 0.15, duration: pulseDuration)
        bloomUp.timingMode = .easeInEaseOut
        let bloomDown = SKAction.fadeAlpha(to: 0.05, duration: pulseDuration)
        bloomDown.timingMode = .easeInEaseOut
        let bloomPulse = SKAction.sequence([bloomUp, bloomDown])
        bloomLine.run(SKAction.repeatForever(bloomPulse), withKey: Self.lavaPulseBloomKey)
    }

    /// Remove the lava pulse effect (cleanup).
    func removeLavaPulse() {
        childNode(withName: "lava_pulse_line")?.removeFromParent()
        childNode(withName: "lava_pulse_bloom")?.removeFromParent()
    }

    /// Whether this creature should have the Furnace Lords lava pulse.
    /// The Demonic Kingdoms faction's primary sub-faction is Furnace Lords,
    /// and sub-faction data is not available during battle, so all Demonic creatures get it.
    var isFurnaceLords: Bool {
        factionShortName == .demonicKingdoms
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

    // MARK: - Contact Shadow (warm-tinted base shadow)

    /// Elliptical contact shadow at the bottom edge of the card.
    /// Dark at contact point, fading quickly. Warm brown tint (not pure black).
    private func setupContactShadow(cardSize: CGSize) {
        // Primary contact shadow — narrow ellipse at the card's base
        let shadowWidth = cardSize.width * 0.9
        let shadowHeight: CGFloat = 6.0  // Thin sliver at base
        let shadowPath = CGPath(ellipseIn: CGRect(x: -shadowWidth / 2, y: -shadowHeight / 2,
                                                   width: shadowWidth, height: shadowHeight),
                                 transform: nil)
        let contactShadow = SKShapeNode(path: shadowPath)
        // Warm brown tint per spec: Color(red: 0.1, green: 0.08, blue: 0.06)
        contactShadow.fillColor = UIColor(red: 0.1, green: 0.08, blue: 0.06, alpha: 0.55)
        contactShadow.strokeColor = .clear
        // Position at the very bottom edge of the card, offset slightly below
        contactShadow.position = CGPoint(x: 0, y: -cardSize.height / 2 - 1)
        contactShadow.zPosition = -3
        contactShadow.name = "contact_shadow"
        // Simulate blur via a slightly larger, more transparent second ellipse
        addChild(contactShadow)

        // Outer diffuse shadow — wider, softer, fades out
        let outerWidth = cardSize.width * 1.1
        let outerHeight: CGFloat = 10.0
        let outerPath = CGPath(ellipseIn: CGRect(x: -outerWidth / 2, y: -outerHeight / 2,
                                                  width: outerWidth, height: outerHeight),
                                transform: nil)
        let outerShadow = SKShapeNode(path: outerPath)
        outerShadow.fillColor = UIColor(red: 0.1, green: 0.08, blue: 0.06, alpha: 0.2)
        outerShadow.strokeColor = .clear
        outerShadow.position = CGPoint(x: 0, y: -cardSize.height / 2 - 2)
        outerShadow.zPosition = -3.1
        outerShadow.name = "contact_shadow_outer"
        addChild(outerShadow)
    }

    // MARK: - Destruction Animation

    /// Play a dramatic 3-phase destruction sequence when the creature dies.
    /// Phase 1: Crack overlay (0-0.3s)
    /// Phase 2: Art desaturation (0.3-0.8s)
    /// Phase 3: Card drifts downward off screen (0.8-1.2s)
    /// Endless faction special: lingering ghost afterimage fades over 2s.
    func playDestruction(in scene: SKScene, completion: @escaping () -> Void) {
        let cardSize = self.size
        let isEndless = factionShortName == .theEndless

        // --- Phase 1 (0-0.3s): Crack overlay ---
        let crackNode = createCrackOverlay(cardSize: cardSize)
        crackNode.alpha = 0
        crackNode.zPosition = 6
        crackNode.name = "crack_overlay"
        addChild(crackNode)

        // Fade crack lines in
        crackNode.run(SKAction.fadeAlpha(to: 1.0, duration: 0.3))

        // --- Phase 2 (0.3-0.8s): Desaturation via colorize ---
        // CIFilter is expensive per the rules. Instead, use colorize to gray
        // which achieves a desaturation-like effect without SKEffectNode overhead.
        let desaturateDelay = SKAction.wait(forDuration: 0.3)
        let desaturate = SKAction.colorize(with: UIColor(white: 0.3, alpha: 1.0),
                                            colorBlendFactor: 0.7, duration: 0.5)

        // --- Phase 3 (0.8-1.2s): Drift downward + fade out ---
        let driftDelay = SKAction.wait(forDuration: 0.8)
        let drift = SKAction.group([
            SKAction.moveBy(x: 0, y: -200, duration: 0.4),
            SKAction.fadeOut(withDuration: 0.4)
        ])
        drift.timingMode = .easeIn

        // Capture scene position before removal for ghost effect
        let scenePosition = scene.convert(self.position, from: self.parent ?? scene)

        // Run the full sequence
        run(SKAction.sequence([desaturateDelay, desaturate])) // desaturation runs in parallel

        run(SKAction.sequence([driftDelay, drift])) { [weak self] in
            guard let self = self else {
                completion()
                return
            }

            // Endless faction special: ghost afterimage
            if isEndless {
                self.spawnGhostAfterimage(at: scenePosition, in: scene)
            }

            self.removeFromParent()
            completion()
        }
    }

    /// Create jagged crack lines across the card as an SKNode with SKShapeNode children.
    private func createCrackOverlay(cardSize: CGSize) -> SKNode {
        let container = SKNode()
        let halfW = cardSize.width / 2
        let halfH = cardSize.height / 2

        // Generate 4 crack lines from random edge points toward the center area
        let crackCount = 4
        for _ in 0..<crackCount {
            let path = CGMutablePath()

            // Start from a random edge
            let edge = Int.random(in: 0...3)
            var startPoint: CGPoint
            switch edge {
            case 0: // Top
                startPoint = CGPoint(x: CGFloat.random(in: -halfW...halfW), y: halfH)
            case 1: // Bottom
                startPoint = CGPoint(x: CGFloat.random(in: -halfW...halfW), y: -halfH)
            case 2: // Left
                startPoint = CGPoint(x: -halfW, y: CGFloat.random(in: -halfH...halfH))
            default: // Right
                startPoint = CGPoint(x: halfW, y: CGFloat.random(in: -halfH...halfH))
            }

            path.move(to: startPoint)

            // Zigzag toward center with 3-5 segments
            let segmentCount = Int.random(in: 3...5)
            let centerTarget = CGPoint(x: CGFloat.random(in: -halfW * 0.3...halfW * 0.3),
                                        y: CGFloat.random(in: -halfH * 0.3...halfH * 0.3))

            for i in 1...segmentCount {
                let t = CGFloat(i) / CGFloat(segmentCount)
                let baseX = startPoint.x + (centerTarget.x - startPoint.x) * t
                let baseY = startPoint.y + (centerTarget.y - startPoint.y) * t
                // Add jagged offset perpendicular to the general direction
                let jitterX = CGFloat.random(in: -8...8)
                let jitterY = CGFloat.random(in: -8...8)
                path.addLine(to: CGPoint(x: baseX + jitterX, y: baseY + jitterY))
            }

            let crackLine = SKShapeNode(path: path)
            crackLine.strokeColor = UIColor.white.withAlphaComponent(0.8)
            crackLine.lineWidth = CGFloat.random(in: 0.5...1.5)
            crackLine.lineCap = .round
            crackLine.glowWidth = 1.0
            container.addChild(crackLine)
        }

        return container
    }

    /// Spawn a translucent ghost afterimage for Endless faction creatures.
    /// The ghost lingers at 15% opacity and fades out over 2 seconds.
    private func spawnGhostAfterimage(at position: CGPoint, in scene: SKScene) {
        let cardSize = self.size
        let ghost = SKSpriteNode(color: UIColor(hex: "#6B3FA0").withAlphaComponent(0.3),
                                  size: cardSize)
        // Copy the card art texture if available
        if let artTexture = cardArtNode.texture {
            ghost.texture = artTexture
            ghost.color = UIColor(hex: "#6B3FA0") // Spectral purple tint
            ghost.colorBlendFactor = 0.5
        }
        ghost.position = position
        ghost.alpha = 0.15
        ghost.zPosition = SK.ZPosition.creatures - 1
        ghost.name = "endless_ghost"
        scene.addChild(ghost)

        // Subtle upward drift + fade out over 2 seconds
        let ghostFade = SKAction.group([
            SKAction.fadeOut(withDuration: 2.0),
            SKAction.moveBy(x: 0, y: 15, duration: 2.0),
            SKAction.scale(to: 1.05, duration: 2.0)
        ])
        ghost.run(SKAction.sequence([ghostFade, SKAction.removeFromParent()]))
    }

    // MARK: - Tapped / Exhausted State

    /// Mark the creature as exhausted (tapped) after attacking.
    /// Rotates 90 degrees clockwise, desaturates to ~60%, adds hourglass glyph.
    func setExhausted(_ exhausted: Bool) {
        guard exhausted != isExhausted else { return }
        isExhausted = exhausted

        if exhausted {
            // Rotate 90 degrees clockwise (negative = clockwise in SpriteKit)
            run(SKAction.rotate(toAngle: -.pi / 2, duration: 0.2, shortestUnitArc: true),
                withKey: "exhaustRotate")

            // Desaturation: tint toward gray at ~40% blend (keeping ~60% color)
            run(SKAction.colorize(with: UIColor(white: 0.4, alpha: 1.0),
                                   colorBlendFactor: 0.4, duration: 0.2),
                withKey: "exhaustDesat")

            // Add hourglass status glyph
            setupExhaustedGlyph()
        } else {
            // Untap: rotate back to 0
            run(SKAction.rotate(toAngle: 0, duration: 0.2, shortestUnitArc: true),
                withKey: "exhaustRotate")

            // Restore saturation
            removeAction(forKey: "exhaustDesat")
            run(SKAction.colorize(withColorBlendFactor: 0, duration: 0.2),
                withKey: "exhaustDesatRestore")

            // Remove hourglass glyph
            removeExhaustedGlyph()
        }
    }

    /// Create and add the hourglass status glyph indicator.
    private func setupExhaustedGlyph() {
        guard exhaustedGlyph == nil else { return }

        let glyphSize: CGFloat = 24
        let glyph: SKSpriteNode

        if let _ = UIImage(named: "UIIcons/ui-hourglass") {
            glyph = SKSpriteNode(imageNamed: "UIIcons/ui-hourglass")
            glyph.size = CGSize(width: glyphSize, height: glyphSize)
            // Bronze tint
            glyph.color = UIColor(hex: "#CD7F32")
            glyph.colorBlendFactor = 0.4
        } else {
            // Fallback: bronze-tinted square placeholder
            glyph = SKSpriteNode(color: UIColor(hex: "#CD7F32"), size: CGSize(width: glyphSize, height: glyphSize))
        }

        // Position at top-right corner of the card
        glyph.position = CGPoint(x: size.width / 2 - glyphSize / 2 - 2,
                                  y: size.height / 2 - glyphSize / 2 - 2)
        glyph.zPosition = 5
        glyph.name = "exhausted_glyph"

        // Subtle pulse animation (scale 1.0 -> 1.1 -> 1.0, repeating)
        let pulse = SKAction.sequence([
            SKAction.scale(to: 1.1, duration: 0.6),
            SKAction.scale(to: 1.0, duration: 0.6)
        ])
        glyph.run(SKAction.repeatForever(pulse), withKey: "exhaustedPulse")

        addChild(glyph)
        exhaustedGlyph = glyph
    }

    /// Remove the hourglass status glyph.
    private func removeExhaustedGlyph() {
        exhaustedGlyph?.removeAction(forKey: "exhaustedPulse")
        exhaustedGlyph?.run(SKAction.sequence([
            SKAction.fadeOut(withDuration: 0.15),
            SKAction.removeFromParent()
        ]))
        exhaustedGlyph = nil
    }
}

// HandCardNode.swift
// Chaos Creatures
// Individual card in hand — full-art design with textured layers matching CardFrameView:
// canvas weave overlay, faction border texture, faction text panel, wax-seal medallion
// stat badges, keyword dots, and contact shadow. Rendered in SpriteKit for drag-to-play
// interactions from within the scene.
//
// Wave 6 additions:
//   - Parallax: art layer shifts 1-3px on horizontal pan for depth-under-glass feel
//   - Card Expand: tap to expand card to ~80% screen width with detail text overlay
//
// Source: docs/design/07-ui-ux-specs.md Section 3

import SpriteKit

/// Represents a card in the player's hand within the SpriteKit scene.
/// Full-bleed art fills the card bounds. Texture layers (canvas weave, faction border,
/// text panel) give the hand-painted paper-card feel matching the SwiftUI CardFrameView.
/// Wax-seal medallion stat badges overlay corners: CM top-right, ATK bottom-left of text
/// panel, HP bottom-right of text panel. Keywords shown as tiny colored dots just above
/// the text panel edge.
///
/// **Parallax**: The card art is wrapped in an `SKCropNode` so it clips to the card
/// bounds. Call `applyParallaxOffset(_:)` during horizontal panning to shift the art
/// layer relative to the frame, creating a subtle depth effect.
///
/// **Card Expand**: Call `expandInScene(_:)` to present a full-screen preview of the
/// card with a dark overlay, larger stats, and hidden detail text revealed.
final class HandCardNode: SKSpriteNode {

    // MARK: - Properties

    private(set) var cardData: BattleCardData
    private let cardArtNode: SKSpriteNode
    /// Crop node that clips the art to card bounds during parallax offset
    private let artCropNode: SKCropNode
    private let nameLabel: SKLabelNode
    private let cmBadge: SKNode
    private let cmLabel: SKLabelNode
    private let atkBadge: SKNode
    private let atkLabel: SKLabelNode
    private let hpBadge: SKNode
    private let hpLabel: SKLabelNode
    private var keywordDots: [SKShapeNode] = []
    private var rarityOverlay: SKNode?

    /// Centered type label for non-creature cards
    private var typeLabel: SKLabelNode?

    var isDragging: Bool = false
    var originalPosition: CGPoint = .zero

    /// Whether this card is currently shown in expanded/preview mode
    private(set) var isExpanded: Bool = false

    // MARK: - Init

    init(card: BattleCardData) {
        self.cardData = card
        let cardSize = SK.Card.handSize
        let panelHeight = cardSize.height * SK.Card.textPanelRatio
        let faction = card.factionShortName

        let factionColor = card.factionPrimaryColor

        // --- Full-bleed card art (fills entire card), wrapped in crop for parallax ---
        cardArtNode = SKSpriteNode(color: factionColor.withAlphaComponent(0.3), size: cardSize)
        cardArtNode.anchorPoint = CGPoint(x: 0.5, y: 0.5)
        cardArtNode.position = .zero
        cardArtNode.zPosition = 0

        // Crop node clips the art to card bounds so parallax offset doesn't bleed
        artCropNode = SKCropNode()
        let artMask = SKShapeNode(rectOf: cardSize, cornerRadius: 8)
        artMask.fillColor = .white
        artMask.strokeColor = .clear
        artCropNode.maskNode = artMask
        artCropNode.addChild(cardArtNode)
        artCropNode.zPosition = 0

        // --- Card name (upper portion of text panel) ---
        nameLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        nameLabel.fontSize = SK.Card.handNameFontSize
        nameLabel.fontColor = SK.CardTextures.parchmentText
        nameLabel.horizontalAlignmentMode = .center
        nameLabel.verticalAlignmentMode = .center
        nameLabel.position = CGPoint(x: 0, y: -cardSize.height / 2 + panelHeight * 0.65)
        nameLabel.zPosition = 2.5

        let displayName = card.name.count > 12 ? String(card.name.prefix(11)) + "\u{2026}" : card.name
        nameLabel.text = displayName

        // --- Medallion stat badges ---

        // CM cost badge (top-right) — wax seal medallion
        let cmRadius = SK.Card.handCMBadgeRadius
        let cmContainer = SKNode()
        cmContainer.position = CGPoint(x: cardSize.width / 2 - cmRadius - 3,
                                       y: cardSize.height / 2 - cmRadius - 3)
        cmContainer.zPosition = 3
        cmBadge = cmContainer

        cmLabel = SKLabelNode(fontNamed: SK.Fonts.statNumber)
        cmLabel.fontSize = SK.Card.handCMFontSize
        cmLabel.fontColor = SK.CardTextures.parchmentText
        cmLabel.horizontalAlignmentMode = .center
        cmLabel.verticalAlignmentMode = .center
        cmLabel.position = .zero
        cmLabel.zPosition = 4
        cmLabel.text = "\(card.manaCost)"

        // ATK badge (bottom-left of text panel) — wax seal medallion
        let statRadius = SK.Card.handStatBadgeRadius
        let panelBottomY = -cardSize.height / 2

        let atkContainer = SKNode()
        atkContainer.position = CGPoint(x: -cardSize.width / 2 + statRadius + 4,
                                        y: panelBottomY + panelHeight * 0.25)
        atkContainer.zPosition = 3
        atkBadge = atkContainer

        atkLabel = SKLabelNode(fontNamed: SK.Fonts.statNumber)
        atkLabel.fontSize = SK.Card.handStatFontSize
        atkLabel.fontColor = SK.CardTextures.parchmentText
        atkLabel.horizontalAlignmentMode = .center
        atkLabel.verticalAlignmentMode = .center
        atkLabel.position = .zero
        atkLabel.zPosition = 4

        // HP badge (bottom-right of text panel) — wax seal medallion
        let hpContainer = SKNode()
        hpContainer.position = CGPoint(x: cardSize.width / 2 - statRadius - 4,
                                       y: panelBottomY + panelHeight * 0.25)
        hpContainer.zPosition = 3
        hpBadge = hpContainer

        hpLabel = SKLabelNode(fontNamed: SK.Fonts.statNumber)
        hpLabel.fontSize = SK.Card.handStatFontSize
        hpLabel.fontColor = SK.CardTextures.parchmentText
        hpLabel.horizontalAlignmentMode = .center
        hpLabel.verticalAlignmentMode = .center
        hpLabel.position = .zero
        hpLabel.zPosition = 4

        // For creatures show ATK/HP; for spells/stabilizers show type label
        let isCreature = (card.baseAttack != nil && card.baseHealth != nil)
        if isCreature {
            atkLabel.text = "\(card.baseAttack!)"
            hpLabel.text = "\(card.baseHealth!)"
        } else {
            atkLabel.text = ""
            hpLabel.text = ""
        }

        // --- Super init ---
        super.init(texture: nil, color: .clear, size: cardSize)
        self.name = "handCard_\(card.instanceId)"

        // ====================================================================
        // LAYER STACK (back to front)
        // ====================================================================

        // Layer -3: Contact shadow — warm soft shadow beneath the card
        let shadowSize = CGSize(width: cardSize.width + 6, height: cardSize.height + 3)
        let shadowNode = SKShapeNode(rectOf: shadowSize, cornerRadius: 9)
        shadowNode.fillColor = UIColor(hex: "#1A1408").withAlphaComponent(0.5)
        shadowNode.strokeColor = .clear
        shadowNode.position = CGPoint(x: 0, y: -3)
        shadowNode.zPosition = -3
        shadowNode.name = "contact_shadow"
        addChild(shadowNode)

        // Layer -1: Background with faction border texture
        setupFactionBorder(cardSize: cardSize, faction: faction, tier: card.evolutionTier)

        // Layer 0: Card art (inside crop node for parallax clipping)
        addChild(artCropNode)

        // Layer 0.5: Canvas weave texture overlay (multiply blend, hand-painted feel)
        let canvasWeave = SKSpriteNode(imageNamed: SK.CardTextures.canvasWeave)
        canvasWeave.size = cardSize
        canvasWeave.position = .zero
        canvasWeave.zPosition = 0.5
        canvasWeave.alpha = 0.15
        canvasWeave.blendMode = .multiply
        canvasWeave.name = "canvas_weave"
        addChild(canvasWeave)

        // Layer 1: Faction text panel texture at bottom
        setupTextPanelTexture(cardSize: cardSize, panelHeight: panelHeight, faction: faction)

        // Layer 2: Card name (on top of text panel)
        // Drop shadow for name label
        let nameShadow = SKLabelNode(fontNamed: SK.Fonts.bold)
        nameShadow.fontSize = SK.Card.handNameFontSize
        nameShadow.fontColor = .black.withAlphaComponent(0.8)
        nameShadow.horizontalAlignmentMode = .center
        nameShadow.verticalAlignmentMode = .center
        nameShadow.position = CGPoint(x: nameLabel.position.x + 0.5,
                                      y: nameLabel.position.y - 0.5)
        nameShadow.zPosition = 2.4
        nameShadow.text = nameLabel.text
        addChild(nameShadow)
        addChild(nameLabel)

        // Faction-specific stat icon names
        let cmIcon = SK.CardTextures.cmIconName(faction: faction)
        let atkIcon = SK.CardTextures.atkIconName(faction: faction)
        let hpIcon = SK.CardTextures.hpIconName(faction: faction)

        // Layer 3: CM badge (medallion)
        setupMedallionBadge(container: cmContainer, radius: cmRadius,
                            tintColor: SK.CardTextures.cmTintColor,
                            iconName: cmIcon, label: cmLabel)
        addChild(cmBadge)

        if isCreature {
            // ATK medallion badge
            setupMedallionBadge(container: atkContainer, radius: statRadius,
                                tintColor: SK.CardTextures.atkTintColor,
                                iconName: atkIcon, label: atkLabel)
            addChild(atkBadge)

            // HP medallion badge
            setupMedallionBadge(container: hpContainer, radius: statRadius,
                                tintColor: SK.CardTextures.hpTintColor,
                                iconName: hpIcon, label: hpLabel)
            addChild(hpBadge)
        } else {
            // Non-creature: show centered type label instead of ATK/HP badges
            let typeLbl = SKLabelNode(fontNamed: SK.Fonts.bold)
            typeLbl.fontSize = 9
            typeLbl.fontColor = UIColor(hex: "#AAAAAA")
            typeLbl.horizontalAlignmentMode = .center
            typeLbl.verticalAlignmentMode = .center
            typeLbl.position = CGPoint(x: 0, y: panelBottomY + panelHeight * 0.25)
            typeLbl.zPosition = 3
            typeLbl.text = card.cardType == .spell ? "Spell" : "Stabilizer"
            addChild(typeLbl)
            self.typeLabel = typeLbl
        }

        // Keyword dots above the text panel (creatures only)
        if card.cardType == .creature {
            setupKeywordDots(card.innateKeywords)
        }

        // Rarity effect (lighter at hand scale)
        applyRarityEffect(card.evolutionTier)

        // Load art
        loadArt(urlString: card.artUrl)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Faction Border Texture

    /// Background with faction-specific border texture instead of a flat color border.
    /// The border texture is placed behind the art; the art covers the inner area,
    /// leaving only the 2.5pt border edge of the texture visible around the card.
    private func setupFactionBorder(cardSize: CGSize, faction: FactionShortName?,
                                    tier: EvolutionTier) {
        let cornerRadius: CGFloat = 8

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
        let innerInset: CGFloat = 2.5
        let innerSize = CGSize(width: cardSize.width - innerInset * 2,
                               height: cardSize.height - innerInset * 2)
        let innerBg = SKShapeNode(rectOf: innerSize, cornerRadius: max(cornerRadius - innerInset, 2))
        innerBg.fillColor = UIColor(hex: "#1A1A1A")
        innerBg.strokeColor = .clear
        innerBg.zPosition = -0.8
        innerBg.name = "card_bg"
        addChild(innerBg)

        // Thin rarity-tinted stroke on top
        let strokeOverlay = SKShapeNode(rectOf: cardSize, cornerRadius: cornerRadius)
        strokeOverlay.fillColor = .clear
        strokeOverlay.strokeColor = tier.borderUIColor.withAlphaComponent(0.5)
        strokeOverlay.lineWidth = 1.5
        strokeOverlay.zPosition = -0.4
        addChild(strokeOverlay)
    }

    // MARK: - Text Panel Texture

    /// Faction-specific text panel texture at the bottom of the card.
    private func setupTextPanelTexture(cardSize: CGSize, panelHeight: CGFloat,
                                       faction: FactionShortName?) {
        let panelWidth: CGFloat = cardSize.width - 6 // Inset 3pt from each side

        let textPanelSprite = SKSpriteNode(imageNamed: SK.CardTextures.textPanelAssetName(faction: faction))
        textPanelSprite.size = CGSize(width: panelWidth, height: panelHeight)
        textPanelSprite.anchorPoint = CGPoint(x: 0.5, y: 0)
        textPanelSprite.position = CGPoint(x: 0, y: -cardSize.height / 2 + 3)
        textPanelSprite.zPosition = 1
        textPanelSprite.alpha = 0.75
        textPanelSprite.name = "text_panel"

        // Darkening overlay for text readability
        let darkenOverlay = SKSpriteNode(color: .black.withAlphaComponent(0.30),
                                         size: CGSize(width: panelWidth, height: panelHeight))
        darkenOverlay.anchorPoint = CGPoint(x: 0.5, y: 0)
        darkenOverlay.position = CGPoint(x: 0, y: -cardSize.height / 2 + 3)
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

        // 3. Stat icon texture at low opacity
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

        // 5. Inner highlight
        let innerRim = SKShapeNode(circleOfRadius: radius * 0.88)
        innerRim.fillColor = .clear
        innerRim.strokeColor = SK.CardTextures.rimHighlight.withAlphaComponent(0.35)
        innerRim.lineWidth = 0.5
        innerRim.zPosition = 3.5
        container.addChild(innerRim)

        // 6. Number label (Bebas Neue) with drop shadow
        label.zPosition = 4
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

    // MARK: - Keyword Dots (tiny colored circles)

    private func setupKeywordDots(_ keywords: [Keyword]) {
        keywordDots.forEach { $0.removeFromParent() }
        keywordDots.removeAll()

        let displayKeywords = Array(keywords.prefix(SK.Card.maxKeywordIcons))
        guard !displayKeywords.isEmpty else { return }

        let dotRadius = SK.Card.keywordDotRadius
        let dotDiameter = dotRadius * 2
        let spacing: CGFloat = dotDiameter + 3
        let totalWidth = CGFloat(displayKeywords.count) * spacing - 3
        let startX = -totalWidth / 2 + dotRadius

        // Position keyword dots just above the text panel edge
        let panelHeight = size.height * SK.Card.textPanelRatio
        let dotsY = -size.height / 2 + panelHeight + dotRadius + 3

        for (index, keyword) in displayKeywords.enumerated() {
            let dot = SKShapeNode(circleOfRadius: dotRadius)
            dot.fillColor = keywordColor(keyword)
            dot.strokeColor = UIColor.white.withAlphaComponent(0.4)
            dot.lineWidth = 0.5
            dot.position = CGPoint(x: startX + CGFloat(index) * spacing, y: dotsY)
            dot.zPosition = 2
            dot.name = "keyword_\(keyword.rawValue)"
            addChild(dot)
            keywordDots.append(dot)
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
        // Dim the CM badge tint when unplayable
        let cmTint = cmBadge.children.compactMap { $0 as? SKShapeNode }.first { $0.fillColor != .clear }
        if let tintNode = cmTint {
            tintNode.fillColor = canPlay
                ? SK.CardTextures.cmTintColor.withAlphaComponent(0.35)
                : UIColor(hex: "#555555").withAlphaComponent(0.4)
        }
    }

    /// Scale up when selected/previewed
    func setSelected(_ selected: Bool) {
        let targetScale: CGFloat = selected ? 1.15 : 1.0
        run(SKAction.scale(to: targetScale, duration: 0.15))
    }

    // MARK: - Parallax Effect

    /// Apply a horizontal parallax offset to the art layer relative to the card frame.
    /// Call this during horizontal pan/swipe through the hand. The offset is clamped
    /// to `SK.HandParallax.maxOffset` and smoothly interpolated.
    ///
    /// - Parameter normalizedOffset: A value in -1...1 representing the pan direction
    ///   and intensity (negative = panning left, positive = panning right).
    func applyParallaxOffset(_ normalizedOffset: CGFloat) {
        let maxOff = SK.HandParallax.maxOffset
        let clamped = max(-1, min(1, normalizedOffset))
        let targetX = clamped * maxOff

        cardArtNode.removeAction(forKey: "parallax")
        let moveAction = SKAction.moveTo(x: targetX, duration: SK.HandParallax.interpolationDuration)
        moveAction.timingMode = .easeOut
        cardArtNode.run(moveAction, withKey: "parallax")
    }

    /// Smoothly reset the parallax offset to zero. Call when the swipe/pan ends.
    func resetParallaxOffset() {
        cardArtNode.removeAction(forKey: "parallax")
        let resetAction = SKAction.moveTo(x: 0, duration: SK.HandParallax.resetDuration)
        resetAction.timingMode = .easeInEaseOut
        cardArtNode.run(resetAction, withKey: "parallax")
    }

    // MARK: - Card Expand (Tap-to-Preview)

    /// Expand this card to a full-screen preview in the given scene.
    /// Creates a dark overlay behind the expanded card, scales the card up to ~80%
    /// of scene width, corrects rotation to upright, and fades in detail text.
    /// The overlay is touch-enabled and self-dismissing — no BattleScene modification needed.
    ///
    /// - Parameter scene: The SKScene to present the expanded card in.
    func expandInScene(_ scene: SKScene) {
        guard !isExpanded, !isDragging else { return }
        isExpanded = true

        let sceneSize = scene.size
        let cardSize = self.size

        // Calculate target scale: expanded card should be ~80% of scene width
        let targetWidth = sceneSize.width * SK.CardExpand.widthFraction
        let scaleFactor = targetWidth / cardSize.width

        // Store pre-expand state for dismissal
        let originalZPos = self.zPosition
        let originalScale = self.xScale
        let originalParent = self.parent
        let positionInScene = scene.convert(self.position, from: self.parent ?? scene)

        // --- Dark overlay (touch-enabled, self-dismissing) ---
        let overlay = CardExpandOverlayNode(size: sceneSize, handCardNode: self)
        overlay.position = .zero
        overlay.zPosition = SK.CardExpand.overlayZPosition
        scene.addChild(overlay)

        // Fade in overlay
        overlay.run(SKAction.fadeAlpha(to: SK.CardExpand.overlayAlpha, duration: SK.CardExpand.expandDuration))

        // --- Shadow node (grows as card "lifts") ---
        let shadowSize = CGSize(width: cardSize.width * scaleFactor + 24,
                                height: cardSize.height * scaleFactor + 12)
        let shadowNode = SKShapeNode(rectOf: shadowSize, cornerRadius: 14)
        shadowNode.fillColor = UIColor.black.withAlphaComponent(0)
        shadowNode.strokeColor = .clear
        shadowNode.position = CGPoint(x: 0, y: -8)
        shadowNode.zPosition = SK.CardExpand.cardZPosition - 1
        shadowNode.name = "cardExpandShadow"
        scene.addChild(shadowNode)

        // Grow shadow
        shadowNode.run(SKAction.customAction(withDuration: SK.CardExpand.expandDuration) { node, elapsed in
            let progress = elapsed / CGFloat(SK.CardExpand.expandDuration)
            (node as? SKShapeNode)?.fillColor = UIColor.black.withAlphaComponent(progress * SK.CardExpand.shadowAlpha)
        })

        // --- Move card to scene root for expansion ---
        self.removeFromParent()
        self.position = positionInScene
        self.zPosition = SK.CardExpand.cardZPosition
        scene.addChild(self)

        // --- Detail text container (fades in during expand) ---
        let detailContainer = SKNode()
        detailContainer.name = "cardExpandDetails"
        detailContainer.alpha = 0
        detailContainer.zPosition = SK.CardExpand.cardZPosition + 1

        // Build detail content positioned relative to the expanded card center
        let expandedCardHeight = cardSize.height * scaleFactor

        // Keyword labels (if creature)
        if cardData.cardType == .creature && !cardData.innateKeywords.isEmpty {
            let keywordText = cardData.innateKeywords.map { $0.rawValue.capitalized }.joined(separator: " / ")
            let kwLabel = SKLabelNode(fontNamed: SK.Fonts.medium)
            kwLabel.fontSize = SK.CardExpand.detailFontSize
            kwLabel.fontColor = SK.CardTextures.parchmentText.withAlphaComponent(0.85)
            kwLabel.horizontalAlignmentMode = .center
            kwLabel.verticalAlignmentMode = .center
            kwLabel.position = CGPoint(x: 0, y: -expandedCardHeight / 2 - 20)
            kwLabel.text = keywordText
            detailContainer.addChild(kwLabel)
        }

        // Modifier text (if any)
        if let modifiers = cardData.modifiers, !modifiers.isEmpty {
            let modText = modifiers.map { $0.name }.joined(separator: ", ")
            let modLabel = SKLabelNode(fontNamed: SK.Fonts.regular)
            modLabel.fontSize = SK.CardExpand.detailFontSize - 1
            modLabel.fontColor = UIColor(hex: "#C0B090")
            modLabel.horizontalAlignmentMode = .center
            modLabel.verticalAlignmentMode = .center
            modLabel.position = CGPoint(x: 0, y: -expandedCardHeight / 2 - 38)
            modLabel.text = modText
            modLabel.preferredMaxLayoutWidth = targetWidth - 20
            modLabel.numberOfLines = 2
            detailContainer.addChild(modLabel)
        }

        scene.addChild(detailContainer)

        // --- Animate expansion: scale + move to center + rotation correction ---
        let currentRotation = self.zRotation
        let expandGroup = SKAction.group([
            SKAction.scale(to: scaleFactor, duration: SK.CardExpand.expandDuration),
            SKAction.move(to: .zero, duration: SK.CardExpand.expandDuration),
            SKAction.rotate(toAngle: 0, duration: SK.CardExpand.expandDuration)
        ])
        expandGroup.timingMode = .easeInEaseOut

        self.run(expandGroup, withKey: "cardExpand")
        detailContainer.run(SKAction.sequence([
            SKAction.wait(forDuration: SK.CardExpand.expandDuration * 0.5),
            SKAction.fadeIn(withDuration: SK.CardExpand.expandDuration * 0.5)
        ]))

        // --- Store dismiss data for animation back ---
        let dismissData = CardExpandDismissData(
            originalParent: originalParent,
            originalPosition: positionInScene,
            originalZPosition: originalZPos,
            originalScale: originalScale,
            originalRotation: currentRotation,
            overlay: overlay,
            shadowNode: shadowNode,
            detailContainer: detailContainer
        )
        self.userData = self.userData ?? NSMutableDictionary()
        self.userData?["expandDismissData"] = dismissData
    }

    /// Dismiss the expanded card preview, animating it back to its original position.
    /// Called when the user taps the overlay or the expanded card itself.
    func dismissExpand() {
        guard isExpanded else { return }
        guard let dismissData = self.userData?["expandDismissData"] as? CardExpandDismissData else {
            isExpanded = false
            return
        }

        let overlay = dismissData.overlay
        let shadowNode = dismissData.shadowNode
        let detailContainer = dismissData.detailContainer

        // Disable overlay touch handling during dismiss animation
        overlay.isUserInteractionEnabled = false

        // Fade out overlay + shadow + details
        overlay.run(SKAction.sequence([
            SKAction.fadeAlpha(to: 0, duration: SK.CardExpand.dismissDuration),
            SKAction.removeFromParent()
        ]))

        shadowNode.run(SKAction.sequence([
            SKAction.fadeOut(withDuration: SK.CardExpand.dismissDuration),
            SKAction.removeFromParent()
        ]))

        detailContainer.run(SKAction.sequence([
            SKAction.fadeOut(withDuration: SK.CardExpand.dismissDuration * 0.4),
            SKAction.removeFromParent()
        ]))

        // Animate card back to original position
        let dismissGroup = SKAction.group([
            SKAction.scale(to: dismissData.originalScale, duration: SK.CardExpand.dismissDuration),
            SKAction.move(to: dismissData.originalPosition, duration: SK.CardExpand.dismissDuration),
            SKAction.rotate(toAngle: dismissData.originalRotation, duration: SK.CardExpand.dismissDuration)
        ])
        dismissGroup.timingMode = .easeInEaseOut

        let reparentAction = SKAction.run { [weak self] in
            guard let self = self else { return }

            // Re-parent card back to original container
            self.removeFromParent()
            if let parent = dismissData.originalParent {
                let localPos = parent.convert(dismissData.originalPosition, from: self.scene ?? parent)
                self.position = localPos
                parent.addChild(self)
            }
            self.zPosition = dismissData.originalZPosition
            self.isExpanded = false
            self.userData?.removeObject(forKey: "expandDismissData")
        }

        self.run(SKAction.sequence([dismissGroup, reparentAction]), withKey: "cardDismiss")
    }
}

// MARK: - Card Expand Overlay (Touch-Enabled Dismiss Layer)

/// Full-screen dark overlay that intercepts all touches to dismiss the expanded card.
/// Uses `isUserInteractionEnabled = true` so BattleScene does not need modification.
/// Touches on this overlay (or anywhere while it is visible) trigger card dismissal.
private final class CardExpandOverlayNode: SKSpriteNode {

    private weak var handCardNode: HandCardNode?

    init(size: CGSize, handCardNode: HandCardNode) {
        self.handCardNode = handCardNode
        super.init(texture: nil, color: .black, size: size)
        self.alpha = 0
        self.name = "cardExpandOverlay"
        self.isUserInteractionEnabled = true
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        // Any touch on the overlay dismisses the expanded card
        handCardNode?.dismissExpand()
    }
}

// MARK: - Card Expand Dismiss Data

/// Stores the state needed to animate the expanded card back to its original position.
/// Stored in the node's `userData` dictionary during expansion.
final class CardExpandDismissData: NSObject {
    weak var originalParent: SKNode?
    let originalPosition: CGPoint
    let originalZPosition: CGFloat
    let originalScale: CGFloat
    let originalRotation: CGFloat
    let overlay: SKSpriteNode
    let shadowNode: SKShapeNode
    let detailContainer: SKNode

    init(originalParent: SKNode?,
         originalPosition: CGPoint,
         originalZPosition: CGFloat,
         originalScale: CGFloat,
         originalRotation: CGFloat,
         overlay: SKSpriteNode,
         shadowNode: SKShapeNode,
         detailContainer: SKNode) {
        self.originalParent = originalParent
        self.originalPosition = originalPosition
        self.originalZPosition = originalZPosition
        self.originalScale = originalScale
        self.originalRotation = originalRotation
        self.overlay = overlay
        self.shadowNode = shadowNode
        self.detailContainer = detailContainer
    }
}

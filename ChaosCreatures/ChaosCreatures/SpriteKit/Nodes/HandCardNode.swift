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
    private let cardArt: SKSpriteNode
    private let nameLabel: SKLabelNode
    private let costLabel: SKLabelNode
    private let costBadge: SKShapeNode
    private let statsLabel: SKLabelNode

    var isDragging: Bool = false
    var originalPosition: CGPoint = .zero

    // MARK: - Init

    init(card: BattleCardData) {
        self.cardData = card
        let cardSize = SK.Card.handSize

        // Card art placeholder
        let factionColor = card.factionPrimaryColor
        let artHeight = cardSize.height * 0.55
        cardArt = SKSpriteNode(color: factionColor.withAlphaComponent(0.3),
                                size: CGSize(width: cardSize.width - 6, height: artHeight))
        cardArt.anchorPoint = CGPoint(x: 0.5, y: 1.0)
        cardArt.position = CGPoint(x: 0, y: cardSize.height / 2 - 3)
        cardArt.zPosition = 1

        // Name
        nameLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        nameLabel.fontSize = 9
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

        // Stats (ATK/HP for creatures)
        statsLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
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

        // Background
        let bg = SKShapeNode(rectOf: cardSize, cornerRadius: 8)
        bg.fillColor = UIColor(hex: "#1A1A1A")
        bg.strokeColor = factionColor.withAlphaComponent(0.5)
        bg.lineWidth = 1.5
        bg.zPosition = 0
        addChild(bg)

        addChild(cardArt)
        addChild(nameLabel)
        addChild(costBadge)
        addChild(statsLabel)

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

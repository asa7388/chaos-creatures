// AvatarNode.swift
// Chaos Creatures
// Player avatar display with instability modifier indicator.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SpriteKit

/// Player avatar node displayed on the battlefield.
/// Tap opens graveyard sheet (handled via delegate).
final class AvatarNode: SKNode {

    // MARK: - Properties

    private let avatarSprite: SKSpriteNode
    private let borderNode: SKShapeNode
    private let instabilityLabel: SKLabelNode
    let isPlayer: Bool

    // MARK: - Init

    init(isPlayer: Bool, factionColor: UIColor) {
        self.isPlayer = isPlayer

        // Avatar image placeholder (48x48 per doc 07)
        avatarSprite = SKSpriteNode(color: factionColor.withAlphaComponent(0.5),
                                     size: CGSize(width: 48, height: 48))
        avatarSprite.zPosition = 1

        // Border ring
        borderNode = SKShapeNode(circleOfRadius: 27)
        borderNode.fillColor = .clear
        borderNode.strokeColor = factionColor
        borderNode.lineWidth = 3
        borderNode.zPosition = 2

        // Instability modifier label
        instabilityLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        instabilityLabel.fontSize = 12
        instabilityLabel.fontColor = .white
        instabilityLabel.horizontalAlignmentMode = .center
        instabilityLabel.verticalAlignmentMode = .center
        instabilityLabel.position = CGPoint(x: 0, y: -36)
        instabilityLabel.zPosition = 2

        super.init()
        self.name = isPlayer ? "playerAvatar" : "opponentAvatar"
        self.isUserInteractionEnabled = true

        addChild(avatarSprite)
        addChild(borderNode)
        addChild(instabilityLabel)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Updates

    func updateInstability(_ value: Int) {
        instabilityLabel.text = "Inst: \(value)"

        if value >= 15 {
            instabilityLabel.fontColor = UIColor(hex: "#E63946")
        } else if value <= 4 {
            instabilityLabel.fontColor = UIColor(hex: "#5BC0EB")
        } else {
            instabilityLabel.fontColor = .white
        }
    }

    func loadAvatar(urlString: String) {
        guard let url = URL(string: urlString) else { return }
        Task { @MainActor in
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                if let image = UIImage(data: data) {
                    self.avatarSprite.texture = SKTexture(image: image)
                    self.avatarSprite.color = .clear
                    self.avatarSprite.colorBlendFactor = 0
                }
            } catch { }
        }
    }
}

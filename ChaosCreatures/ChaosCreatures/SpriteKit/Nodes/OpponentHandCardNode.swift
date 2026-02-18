// OpponentHandCardNode.swift
// Chaos Creatures
// Face-down card back for opponent's hand cards.
// Shows the card back texture (universal or faction-specific) at hand card size.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SpriteKit

/// A face-down card in the opponent's hand. Shows the card back texture.
/// Used for rendering the opponent's hand count indicator in SpriteKit.
final class OpponentHandCardNode: SKSpriteNode {

    // MARK: - Init

    /// Create a face-down card back node.
    /// - Parameter faction: Optional faction for faction-specific card back; uses universal if nil or asset missing.
    init(faction: FactionShortName? = nil) {
        let cardSize = SK.Card.handSize

        // Try faction-specific card back first, then universal, then fallback
        let factionAsset: String? = faction.map { SK.CardBacks.factionBack(faction: $0) }
        let universalAsset = SK.CardBacks.universal

        let texture: SKTexture?
        if let factionAsset = factionAsset, let _ = UIImage(named: factionAsset) {
            texture = SKTexture(imageNamed: factionAsset)
        } else if let _ = UIImage(named: universalAsset) {
            texture = SKTexture(imageNamed: universalAsset)
        } else {
            texture = nil
        }

        if let texture = texture {
            super.init(texture: texture, color: .clear, size: cardSize)
        } else {
            // Fallback: dark card with subtle pattern
            super.init(texture: nil, color: .clear, size: cardSize)
            let bg = SKShapeNode(rectOf: cardSize, cornerRadius: 8)
            bg.fillColor = UIColor(hex: "#1A1A1A")
            bg.strokeColor = UIColor(hex: "#3A3A3A")
            bg.lineWidth = 1.5
            bg.zPosition = 0
            addChild(bg)

            // Simple logo/pattern placeholder — faction emblem if available
            if let faction = faction {
                let emblemAsset = SK.FactionEmblems.assetName(faction: faction)
                if let _ = UIImage(named: emblemAsset) {
                    let emblem = SKSpriteNode(imageNamed: emblemAsset)
                    emblem.size = CGSize(width: 30, height: 30)
                    emblem.alpha = 0.4
                    emblem.zPosition = 1
                    addChild(emblem)
                }
            }

            // Centered "?" text as final fallback visual
            let questionMark = SKLabelNode(fontNamed: SK.Fonts.bold)
            questionMark.text = "?"
            questionMark.fontSize = 24
            questionMark.fontColor = UIColor(hex: "#3A3A3A")
            questionMark.horizontalAlignmentMode = .center
            questionMark.verticalAlignmentMode = .center
            questionMark.zPosition = 2
            addChild(questionMark)
        }

        self.name = "opponentCard"
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Card Flip Animation

    /// Flip this face-down card to reveal a face-up card.
    /// Scales X to 0 (sideways), swaps in the provided front node, scales X back to 1.
    /// - Parameters:
    ///   - frontNode: The face-up card node to reveal (e.g. a CreatureNode or HandCardNode).
    ///   - completion: Called when the flip animation finishes.
    func flipToReveal(frontNode: SKSpriteNode, completion: @escaping () -> Void) {
        let halfDuration = SK.CardFlip.halfDuration

        // Phase 1: scale X to 0 (card turns sideways)
        let scaleDown = SKAction.scaleX(to: 0, duration: halfDuration)
        scaleDown.timingMode = .easeIn

        // Phase 2: swap content and scale back
        let scaleUp = SKAction.scaleX(to: 1.0, duration: halfDuration)
        scaleUp.timingMode = .easeOut

        run(scaleDown) { [weak self] in
            guard let self = self else { return }

            // Replace this node with the front node at the same position
            frontNode.position = self.position
            frontNode.zPosition = self.zPosition
            frontNode.xScale = 0
            frontNode.yScale = 1.0
            self.parent?.addChild(frontNode)

            frontNode.run(scaleUp) {
                self.removeFromParent()
                completion()
            }
        }
    }
}

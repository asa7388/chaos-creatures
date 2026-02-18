// CardFlipAction.swift
// Chaos Creatures
// Card flip animation for revealing face-down cards (opponent plays, card draws).
// Scale X to 0 (card turns sideways), switch texture, scale X back to 1.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SpriteKit

enum CardFlipAction {

    /// Flip a face-down card back to reveal a face-up creature on the board.
    /// Used when opponent plays a card that was hidden.
    ///
    /// - Parameters:
    ///   - cardBack: The OpponentHandCardNode (face-down) to flip.
    ///   - revealNode: The CreatureNode or HandCardNode to show after the flip.
    ///   - completion: Called when the flip animation finishes.
    static func flipReveal(
        cardBack: OpponentHandCardNode,
        revealNode: SKSpriteNode,
        completion: @escaping () -> Void
    ) {
        cardBack.flipToReveal(frontNode: revealNode, completion: completion)
    }

    /// Generic flip animation on any SKSpriteNode.
    /// Scales X to 0, runs a midpoint callback (to swap textures), then scales X back.
    ///
    /// - Parameters:
    ///   - node: The node to animate.
    ///   - atMidpoint: Called when the card is edge-on (xScale = 0), before scaling back.
    ///   - completion: Called when the full flip is done.
    static func flipInPlace(
        node: SKSpriteNode,
        atMidpoint: @escaping () -> Void,
        completion: @escaping () -> Void
    ) {
        let halfDuration = SK.CardFlip.halfDuration

        let scaleDown = SKAction.scaleX(to: 0, duration: halfDuration)
        scaleDown.timingMode = .easeIn

        let scaleUp = SKAction.scaleX(to: 1.0, duration: halfDuration)
        scaleUp.timingMode = .easeOut

        node.run(scaleDown) {
            atMidpoint()
            node.run(scaleUp) {
                completion()
            }
        }
    }

    /// Create a card-back node at a given position for use in flip-reveal animations.
    /// This is a convenience for creating the face-down starting state.
    ///
    /// - Parameters:
    ///   - position: Where to place the card back in its parent.
    ///   - faction: Optional faction for faction-specific back art.
    ///   - zPosition: Z depth.
    /// - Returns: A configured OpponentHandCardNode.
    static func createCardBack(
        at position: CGPoint,
        faction: FactionShortName? = nil,
        zPosition: CGFloat = SK.ZPosition.creatures
    ) -> OpponentHandCardNode {
        let cardBack = OpponentHandCardNode(faction: faction)
        cardBack.position = position
        cardBack.zPosition = zPosition
        return cardBack
    }
}

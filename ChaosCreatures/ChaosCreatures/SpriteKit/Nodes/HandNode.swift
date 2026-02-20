// HandNode.swift
// Chaos Creatures
// Fan of cards in hand. Note: the primary hand display uses SwiftUI
// HandScrollView overlay. This SpriteKit node is used for animation
// source/destination points and the card play animation origin.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SpriteKit

/// Container for hand card references within the SpriteKit scene.
/// The actual hand UI is SwiftUI-based (HandScrollView), but this node
/// tracks positions for card play animations.
final class HandNode: SKNode {

    // MARK: - Properties

    private(set) var cardNodes: [HandCardNode] = []
    private let maxCards: Int = 10

    // MARK: - Init

    override init() {
        super.init()
        self.name = "playerHand"
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Card Management

    /// Update hand display from server card list
    func updateHand(cards: [BattleCardData], currentMana: Int) {
        // Remove existing
        cardNodes.forEach { $0.removeFromParent() }
        cardNodes.removeAll()

        let cardWidth = SK.Card.handSize.width
        let spacing: CGFloat = 6
        let totalWidth = CGFloat(cards.count) * (cardWidth + spacing) - spacing
        let startX = -totalWidth / 2 + cardWidth / 2

        for (index, card) in cards.enumerated() {
            let node = HandCardNode(card: card)
            node.position = CGPoint(x: startX + CGFloat(index) * (cardWidth + spacing), y: 0)
            node.zPosition = SK.ZPosition.handCards + CGFloat(index) * 0.1
            node.setPlayable(card.manaCost <= currentMana)
            addChild(node)
            cardNodes.append(node)
        }
    }

    /// Remove a specific card (after being played)
    func removeCard(instanceId: String) {
        if let index = cardNodes.firstIndex(where: { $0.cardData.instanceId == instanceId }) {
            cardNodes[index].removeFromParent()
            cardNodes.remove(at: index)
            relayout()
        }
    }

    /// Add a card (after drawing)
    func addCard(_ card: BattleCardData, currentMana: Int) {
        let node = HandCardNode(card: card)
        node.setPlayable(card.manaCost <= currentMana)
        addChild(node)
        cardNodes.append(node)
        relayout()
    }

    /// Relayout cards after add/remove
    private func relayout() {
        let cardWidth = SK.Card.handSize.width
        let spacing: CGFloat = 6
        let totalWidth = CGFloat(cardNodes.count) * (cardWidth + spacing) - spacing
        let startX = -totalWidth / 2 + cardWidth / 2

        for (index, node) in cardNodes.enumerated() {
            let targetPos = CGPoint(x: startX + CGFloat(index) * (cardWidth + spacing), y: 0)
            node.run(SKAction.move(to: targetPos, duration: 0.2))
        }
    }

    /// Get the scene position of a specific card (for animation origin)
    func cardPosition(instanceId: String) -> CGPoint? {
        guard let node = cardNodes.first(where: { $0.cardData.instanceId == instanceId }) else { return nil }
        return convert(node.position, to: scene ?? self)
    }

    /// Update playability based on current CM
    func updatePlayability(currentMana: Int) {
        for node in cardNodes {
            node.setPlayable(node.cardData.manaCost <= currentMana)
        }
    }

    // MARK: - Parallax

    /// Apply parallax offset to all hand card art layers.
    /// Called during horizontal pan/swipe through the hand.
    ///
    /// - Parameter normalizedOffset: -1...1 representing pan direction/intensity.
    func applyParallaxOffset(_ normalizedOffset: CGFloat) {
        for node in cardNodes {
            node.applyParallaxOffset(normalizedOffset)
        }
    }

    /// Reset parallax offset on all hand cards (call when swipe/pan ends).
    func resetParallaxOffset() {
        for node in cardNodes {
            node.resetParallaxOffset()
        }
    }

    // MARK: - Card Expand

    /// Returns the currently expanded card, if any.
    var expandedCard: HandCardNode? {
        cardNodes.first(where: { $0.isExpanded })
    }

    /// Expand a specific hand card by instance ID. Only one card can be expanded at a time.
    func expandCard(instanceId: String, in scene: SKScene) {
        // Dismiss any already-expanded card first
        expandedCard?.dismissExpand()

        guard let node = cardNodes.first(where: { $0.cardData.instanceId == instanceId }) else { return }
        node.expandInScene(scene)
    }

    /// Dismiss the currently expanded card, if any.
    func dismissExpandedCard() {
        expandedCard?.dismissExpand()
    }
}

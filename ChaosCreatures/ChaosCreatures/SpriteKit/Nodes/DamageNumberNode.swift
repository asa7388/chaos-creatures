// DamageNumberNode.swift
// Chaos Creatures
// Floating damage/heal text that rises and fades.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// Floating number that rises and fades out. Used for damage, healing, shield breaks.
final class DamageNumberNode: SKLabelNode {

    // MARK: - Factory Methods

    /// Create a red damage number (e.g. "-3")
    static func damage(_ amount: Int, at position: CGPoint) -> DamageNumberNode {
        let node = DamageNumberNode(amount: amount, color: SK.Colors.damageRed, prefix: "-")
        node.position = position
        node.zPosition = SK.ZPosition.damageNumbers
        return node
    }

    /// Create a lethal damage number (bright red, larger)
    static func lethalDamage(_ amount: Int, at position: CGPoint) -> DamageNumberNode {
        let node = DamageNumberNode(amount: amount, color: SK.Colors.lethalDamage, prefix: "-")
        node.fontSize = 22
        node.position = position
        node.zPosition = SK.ZPosition.damageNumbers
        return node
    }

    /// Create a green heal number (e.g. "+2")
    static func heal(_ amount: Int, at position: CGPoint) -> DamageNumberNode {
        let node = DamageNumberNode(amount: amount, color: SK.Colors.healGreen, prefix: "+")
        node.position = position
        node.zPosition = SK.ZPosition.damageNumbers
        return node
    }

    /// Create a blue shield absorbed number
    static func shieldAbsorb(_ amount: Int, at position: CGPoint) -> DamageNumberNode {
        let node = DamageNumberNode(amount: amount, color: UIColor(hex: "#5BC0EB"), prefix: "")
        node.text = "Shield!"
        node.position = position
        node.zPosition = SK.ZPosition.damageNumbers
        return node
    }

    /// Create a face damage number aimed at a player avatar
    static func faceDamage(_ amount: Int, at position: CGPoint) -> DamageNumberNode {
        let node = DamageNumberNode(amount: amount, color: SK.Colors.lethalDamage, prefix: "-")
        node.fontSize = 24
        node.position = position
        node.zPosition = SK.ZPosition.damageNumbers
        return node
    }

    // MARK: - Init

    private init(amount: Int, color: UIColor, prefix: String) {
        super.init()
        self.fontName = SK.Fonts.heavy
        self.fontSize = 18
        self.fontColor = color
        self.text = "\(prefix)\(amount)"
        self.horizontalAlignmentMode = .center
        self.verticalAlignmentMode = .center
        self.alpha = 0
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Animation

    /// Run the float-up-and-fade animation, then remove self
    func animate(completion: (() -> Void)? = nil) {
        let duration = SK.Duration.damageFloat

        let fadeIn = SKAction.fadeIn(withDuration: 0.05)
        let moveUp = SKAction.moveBy(x: 0, y: 40, duration: duration)
        moveUp.timingMode = .easeOut
        let fadeOut = SKAction.fadeOut(withDuration: duration * 0.4)
        fadeOut.timingMode = .easeIn
        let scaleUp = SKAction.scale(to: 1.3, duration: duration * 0.2)
        let scaleDown = SKAction.scale(to: 0.8, duration: duration * 0.8)
        let scaleSeq = SKAction.sequence([scaleUp, scaleDown])

        let group = SKAction.group([moveUp, scaleSeq, SKAction.sequence([
            SKAction.wait(forDuration: duration * 0.6),
            fadeOut
        ])])

        let fullSequence = SKAction.sequence([
            fadeIn,
            group,
            SKAction.removeFromParent()
        ])

        run(fullSequence) {
            completion?()
        }
    }

    /// Variant: float with slight horizontal jitter for multi-hit combat
    func animateWithJitter(xOffset: CGFloat = 0, delay: TimeInterval = 0, completion: (() -> Void)? = nil) {
        let duration = SK.Duration.damageFloat

        let wait = SKAction.wait(forDuration: delay)
        let fadeIn = SKAction.fadeIn(withDuration: 0.05)
        let moveUp = SKAction.moveBy(x: xOffset, y: 40, duration: duration)
        moveUp.timingMode = .easeOut
        let fadeOut = SKAction.fadeOut(withDuration: duration * 0.4)
        let scaleUp = SKAction.scale(to: 1.3, duration: duration * 0.2)
        let scaleDown = SKAction.scale(to: 0.8, duration: duration * 0.8)

        let group = SKAction.group([moveUp, SKAction.sequence([scaleUp, scaleDown]), SKAction.sequence([
            SKAction.wait(forDuration: duration * 0.6),
            fadeOut
        ])])

        let fullSequence = SKAction.sequence([
            wait,
            fadeIn,
            group,
            SKAction.removeFromParent()
        ])

        run(fullSequence) {
            completion?()
        }
    }
}

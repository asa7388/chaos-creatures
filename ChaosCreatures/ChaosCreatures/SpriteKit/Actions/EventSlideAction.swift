// EventSlideAction.swift
// Chaos Creatures
// Event banner slide in from top, hold, slide out.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// Convenience wrapper for showing event banners in the battle scene.
/// Delegates to EventBannerNode for the actual animation.
enum EventSlideAction {

    /// Show an Order/Chaos event banner
    static func showEvent(
        eventName: String,
        eventType: EventType,
        description: String,
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        let banner = EventBannerNode(
            eventName: eventName,
            eventType: eventType,
            description: description,
            sceneSize: scene.size
        )
        banner.present(in: scene, completion: completion)
    }

    /// Show a quick text banner (for non-event notifications like "Your Turn", "Combat!")
    static func showQuickBanner(
        text: String,
        color: UIColor,
        in scene: SKScene,
        duration: TimeInterval = 1.5,
        completion: (() -> Void)? = nil
    ) {
        let label = SKLabelNode(fontNamed: SK.Fonts.heavy)
        label.fontSize = 22
        label.fontColor = color
        label.horizontalAlignmentMode = .center
        label.verticalAlignmentMode = .center
        label.text = text
        label.alpha = 0
        label.position = CGPoint(x: scene.size.width / 2, y: scene.size.height / 2)
        label.zPosition = SK.ZPosition.eventBanner
        scene.addChild(label)

        let fadeIn = SKAction.fadeIn(withDuration: 0.15)
        label.setScale(0.5)
        let scaleIn = SKAction.scale(to: 1.0, duration: 0.15)
        let hold = SKAction.wait(forDuration: duration)
        let fadeOut = SKAction.fadeOut(withDuration: 0.3)
        let scaleOut = SKAction.scale(to: 1.3, duration: 0.3)
        let remove = SKAction.removeFromParent()

        label.run(SKAction.sequence([
            SKAction.group([fadeIn, scaleIn]),
            hold,
            SKAction.group([fadeOut, scaleOut]),
            remove
        ])) {
            completion?()
        }
    }

    /// Show turn start banner ("Your Turn" or "Opponent's Turn")
    static func showTurnBanner(
        isMyTurn: Bool,
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        let text = isMyTurn ? "Your Turn" : "Opponent's Turn"
        let color = isMyTurn ? SK.Colors.orderBlue : SK.Colors.chaosRed
        showQuickBanner(text: text, color: color, in: scene, duration: 1.0, completion: completion)
    }

    /// Show combat phase banner
    static func showCombatBanner(
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        showQuickBanner(text: "Combat!", color: SK.Colors.attackerGlow, in: scene, duration: 0.8, completion: completion)
    }

    /// Show game over banner
    static func showGameOverBanner(
        isVictory: Bool,
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        let text = isVictory ? "Victory!" : "Defeat"
        let color: UIColor = isVictory ? UIColor(hex: "#FFD700") : SK.Colors.chaosRed

        let label = SKLabelNode(fontNamed: SK.Fonts.heavy)
        label.fontSize = 36
        label.fontColor = color
        label.horizontalAlignmentMode = .center
        label.verticalAlignmentMode = .center
        label.text = text
        label.alpha = 0
        label.position = CGPoint(x: scene.size.width / 2, y: scene.size.height / 2)
        label.zPosition = SK.ZPosition.screenFlash
        scene.addChild(label)

        // Dramatic entrance
        let fadeIn = SKAction.fadeIn(withDuration: 0.3)
        label.setScale(0.1)
        let scaleIn = SKAction.scale(to: 1.0, duration: 0.3)
        scaleIn.timingMode = .easeOut
        let hold = SKAction.wait(forDuration: 2.0)

        label.run(SKAction.sequence([
            SKAction.group([fadeIn, scaleIn]),
            hold,
            SKAction.run(completion)
        ]))
    }
}

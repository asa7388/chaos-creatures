// DamageAction.swift
// Chaos Creatures
// Damage number float + target shake animations.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// Animation helpers for displaying damage numbers and effects.
enum DamageAction {

    /// Show a floating damage number above a creature node
    static func showDamage(
        _ amount: Int,
        on target: SKNode,
        in scene: SKScene,
        isLethal: Bool = false,
        completion: (() -> Void)? = nil
    ) {
        let position = CGPoint(
            x: target.position.x,
            y: target.position.y + (target.frame.height / 2) + 10
        )

        let damageNode = isLethal
            ? DamageNumberNode.lethalDamage(amount, at: position)
            : DamageNumberNode.damage(amount, at: position)

        scene.addChild(damageNode)
        damageNode.animate(completion: completion)

        // Shake the target
        AttackAction.impactShake(on: target)
    }

    /// Show face damage (to player avatar)
    static func showFaceDamage(
        _ amount: Int,
        on avatarNode: AvatarNode,
        in scene: SKScene,
        completion: (() -> Void)? = nil
    ) {
        let position = CGPoint(
            x: avatarNode.position.x,
            y: avatarNode.position.y + 30
        )

        let damageNode = DamageNumberNode.faceDamage(amount, at: position)
        scene.addChild(damageNode)
        damageNode.animate(completion: completion)

        // Flash the avatar
        AttackAction.impactShake(on: avatarNode)

        // Red vignette flash
        screenDamageFlash(in: scene)
    }

    /// Show multiple damage numbers from combat resolution (staggered)
    static func showCombatDamage(
        pairs: [(target: SKNode, amount: Int, isLethal: Bool)],
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        guard !pairs.isEmpty else {
            completion()
            return
        }

        let group = DispatchGroup()
        for (index, pair) in pairs.enumerated() {
            group.enter()
            let delay = TimeInterval(index) * 0.15

            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                let position = CGPoint(
                    x: pair.target.position.x + CGFloat.random(in: -8...8),
                    y: pair.target.position.y + (pair.target.frame.height / 2) + 10
                )

                let damageNode = pair.isLethal
                    ? DamageNumberNode.lethalDamage(pair.amount, at: position)
                    : DamageNumberNode.damage(pair.amount, at: position)

                scene.addChild(damageNode)
                damageNode.animateWithJitter(
                    xOffset: CGFloat.random(in: -10...10),
                    delay: 0
                ) {
                    group.leave()
                }

                AttackAction.impactShake(on: pair.target)
            }
        }

        group.notify(queue: .main) {
            completion()
        }
    }

    /// Brief red vignette flash when the local player takes face damage
    static func screenDamageFlash(in scene: SKScene) {
        let flash = SKSpriteNode(color: SK.Colors.damageRed, size: scene.size)
        flash.position = CGPoint(x: scene.size.width / 2, y: scene.size.height / 2)
        flash.alpha = 0
        flash.zPosition = SK.ZPosition.screenFlash
        scene.addChild(flash)

        flash.run(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.12, duration: 0.05),
            SKAction.fadeAlpha(to: 0, duration: 0.25),
            SKAction.removeFromParent()
        ]))
    }
}

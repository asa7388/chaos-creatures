// HealAction.swift
// Chaos Creatures
// Green heal number float + sparkle particles.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// Animation helpers for healing effects (Lifesteal, event heals, spell heals).
enum HealAction {

    /// Show a floating green heal number above a creature
    static func showHeal(
        _ amount: Int,
        on target: SKNode,
        in scene: SKScene,
        completion: (() -> Void)? = nil
    ) {
        let position = CGPoint(
            x: target.position.x,
            y: target.position.y + (target.frame.height / 2) + 10
        )

        let healNode = DamageNumberNode.heal(amount, at: position)
        scene.addChild(healNode)
        healNode.animate(completion: completion)

        // Green glow flash on the target
        let glowIn = SKAction.colorize(with: SK.Colors.healGreen, colorBlendFactor: 0.3, duration: 0.1)
        let glowOut = SKAction.colorize(withColorBlendFactor: 0, duration: 0.2)
        target.run(SKAction.sequence([glowIn, glowOut]), withKey: "healGlow")

        // Heal particles
        let emitter = ParticleEffects.healEmitter()
        emitter.position = target.position
        emitter.zPosition = SK.ZPosition.particles
        scene.addChild(emitter)

        emitter.run(SKAction.sequence([
            SKAction.wait(forDuration: SK.Duration.healFloat),
            SKAction.removeFromParent()
        ]))

        // Additional heal shimmer for richer visual
        let shimmer = ParticleEffects.healShimmer(at: target.position)
        shimmer.zPosition = SK.ZPosition.particles
        scene.addChild(shimmer)
        shimmer.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.9),
            SKAction.removeFromParent()
        ]))
    }

    /// Lifesteal: show heal on attacker after dealing damage
    static func showLifesteal(
        _ amount: Int,
        on attacker: SKNode,
        in scene: SKScene,
        completion: (() -> Void)? = nil
    ) {
        // Slight delay to stagger after damage number
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            showHeal(amount, on: attacker, in: scene, completion: completion)
        }
    }

    /// Player HP heal: show green number near avatar
    static func showPlayerHeal(
        _ amount: Int,
        on avatarNode: AvatarNode,
        in scene: SKScene,
        completion: (() -> Void)? = nil
    ) {
        let position = CGPoint(
            x: avatarNode.position.x,
            y: avatarNode.position.y + 30
        )

        let healNode = DamageNumberNode.heal(amount, at: position)
        scene.addChild(healNode)
        healNode.animate(completion: completion)

        // Green screen flash (subtle)
        let flash = SKSpriteNode(color: SK.Colors.healGreen, size: scene.size)
        flash.position = CGPoint(x: scene.size.width / 2, y: scene.size.height / 2)
        flash.alpha = 0
        flash.zPosition = SK.ZPosition.screenFlash
        scene.addChild(flash)

        flash.run(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.06, duration: 0.05),
            SKAction.fadeAlpha(to: 0, duration: 0.2),
            SKAction.removeFromParent()
        ]))
    }
}

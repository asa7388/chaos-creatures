// ShieldBreakAction.swift
// Chaos Creatures
// Shield pop/break visual effect with blue shatter particles.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// Animation for the Shield keyword being consumed (absorbs first damage, then breaks).
enum ShieldBreakAction {

    /// Play shield break animation on a creature node.
    /// Removes the shield overlay and spawns blue shatter particles.
    static func playShieldBreak(
        on creature: CreatureNode,
        in scene: SKScene,
        completion: (() -> Void)? = nil
    ) {
        // Remove the shield overlay from the creature
        creature.removeShield()

        // "Shield!" text
        let shieldText = DamageNumberNode.shieldAbsorb(0, at: CGPoint(
            x: creature.position.x,
            y: creature.position.y + (creature.frame.height / 2) + 10
        ))
        scene.addChild(shieldText)
        shieldText.animate()

        // Blue shatter particles
        let emitter = ParticleEffects.shieldBreakEmitter()
        emitter.position = creature.position
        emitter.zPosition = SK.ZPosition.particles
        scene.addChild(emitter)

        // Flash the creature blue briefly
        let flashBlue = SKAction.colorize(with: UIColor(hex: "#5BC0EB"), colorBlendFactor: 0.5, duration: 0.05)
        let flashBack = SKAction.colorize(withColorBlendFactor: 0, duration: SK.Duration.shieldBreak)
        creature.run(SKAction.sequence([flashBlue, flashBack]))

        // Auto-remove emitter
        emitter.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.8),
            SKAction.removeFromParent()
        ])) {
            completion?()
        }
    }

    /// Shield granted animation (blue shimmer overlay appears)
    static func playShieldGrant(
        on creature: CreatureNode,
        in scene: SKScene,
        completion: (() -> Void)? = nil
    ) {
        creature.showShield()

        // Blue glow pulse to signal new shield
        let glowIn = SKAction.colorize(with: UIColor(hex: "#5BC0EB"), colorBlendFactor: 0.3, duration: 0.15)
        let glowOut = SKAction.colorize(withColorBlendFactor: 0, duration: 0.25)
        creature.run(SKAction.sequence([glowIn, glowOut])) {
            completion?()
        }
    }
}

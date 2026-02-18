// CardPlayAction.swift
// Chaos Creatures
// Hand-to-board card play animation.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// SKAction sequences for card play animation.
/// Card scales up from hand, moves to board slot, settles in with glow.
enum CardPlayAction {

    /// Create the full card play animation.
    /// - Parameters:
    ///   - from: Starting position (hand card position in scene coordinates)
    ///   - to: Target position (board slot position in scene coordinates)
    ///   - factionColor: Faction color for the glow burst
    /// - Returns: SKAction sequence for the card play
    static func playCard(from startPos: CGPoint, to targetPos: CGPoint, factionColor: UIColor) -> SKAction {
        let duration = SK.Duration.cardPlay

        // Phase 1: Scale up and lift (0.15s)
        let scaleUp = SKAction.scale(to: 1.3, duration: duration * 0.33)
        scaleUp.timingMode = .easeOut

        // Phase 2: Move to board slot (0.2s)
        let moveToSlot = SKAction.move(to: targetPos, duration: duration * 0.44)
        moveToSlot.timingMode = .easeInEaseOut

        // Phase 3: Scale down to board size and settle (0.1s)
        let scaleDown = SKAction.scale(to: 1.0, duration: duration * 0.23)
        scaleDown.timingMode = .easeIn

        return SKAction.sequence([scaleUp, moveToSlot, scaleDown])
    }

    /// Animate the glow burst at the landing spot (called after card lands)
    static func landingGlow(at position: CGPoint, factionColor: UIColor, in scene: SKScene) {
        let emitter = ParticleEffects.cardPlayGlow(factionColor: factionColor)
        emitter.position = position
        emitter.zPosition = SK.ZPosition.particles
        scene.addChild(emitter)

        // Auto-remove emitter after particles finish
        let wait = SKAction.wait(forDuration: 0.6)
        let remove = SKAction.removeFromParent()
        emitter.run(SKAction.sequence([wait, remove]))
    }

    /// Full card play sequence: move + trail + glow + screen flash
    static func fullPlaySequence(
        cardNode: SKNode,
        from startPos: CGPoint,
        to targetPos: CGPoint,
        factionColor: UIColor,
        scene: SKScene,
        completion: @escaping () -> Void
    ) {
        cardNode.position = startPos
        let playAction = playCard(from: startPos, to: targetPos, factionColor: factionColor)

        // Attach particle trail to card during movement
        let trail = ParticleEffects.cardPlayTrail()
        trail.targetNode = scene // Trail particles stay in world space
        trail.zPosition = SK.ZPosition.particles
        cardNode.addChild(trail)

        cardNode.run(playAction) {
            // Remove trail emitter after card lands
            trail.particleBirthRate = 0 // Stop emitting
            trail.run(SKAction.sequence([
                SKAction.wait(forDuration: 0.3), // Let remaining particles fade
                SKAction.removeFromParent()
            ]))

            // Landing effects
            landingGlow(at: targetPos, factionColor: factionColor, in: scene)

            // Brief screen flash
            let flash = SKSpriteNode(color: factionColor, size: scene.size)
            flash.position = CGPoint(x: scene.size.width / 2, y: scene.size.height / 2)
            flash.alpha = 0
            flash.zPosition = SK.ZPosition.screenFlash
            scene.addChild(flash)

            flash.run(SKAction.sequence([
                SKAction.fadeAlpha(to: 0.08, duration: 0.05),
                SKAction.fadeAlpha(to: 0, duration: 0.15),
                SKAction.removeFromParent()
            ]))

            completion()
        }
    }
}

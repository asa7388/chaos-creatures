// AttackAction.swift
// Chaos Creatures
// Creature attack animation (lunge toward target + impact shake).
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// SKAction sequences for creature attack animations.
/// Attacker lunges toward target, impact shake on hit, snap back.
enum AttackAction {

    /// Attack lunge toward a target position, then snap back.
    /// - Parameters:
    ///   - attacker: The creature node performing the attack
    ///   - targetPosition: The position to lunge toward (target creature or avatar)
    ///   - completion: Called after the lunge completes (before snap-back)
    static func lunge(
        attacker: SKNode,
        toward targetPosition: CGPoint,
        completion: @escaping () -> Void
    ) {
        let originalPos = attacker.position
        let duration = SK.Duration.attack

        // Calculate lunge destination (70% of the way to target)
        let dx = targetPosition.x - originalPos.x
        let dy = targetPosition.y - originalPos.y
        let lungePoint = CGPoint(x: originalPos.x + dx * 0.7, y: originalPos.y + dy * 0.7)

        // Phase 1: Lunge forward (fast)
        let lungeForward = SKAction.move(to: lungePoint, duration: duration * 0.4)
        lungeForward.timingMode = .easeIn

        // Phase 2: Hold at impact briefly
        let hold = SKAction.wait(forDuration: duration * 0.1)

        // Phase 3: Snap back (slightly slower)
        let snapBack = SKAction.move(to: originalPos, duration: duration * 0.5)
        snapBack.timingMode = .easeOut

        let sequence = SKAction.sequence([lungeForward, hold, SKAction.run(completion), snapBack])
        attacker.run(sequence, withKey: "attackLunge")
    }

    /// Impact shake applied to the target node when hit
    static func impactShake(on target: SKNode) {
        let shakeIntensity: CGFloat = 5
        let shakeDuration: TimeInterval = 0.06
        let shakeCount = 4

        var actions: [SKAction] = []
        for i in 0..<shakeCount {
            let direction: CGFloat = (i % 2 == 0) ? 1 : -1
            let intensity = shakeIntensity * (1.0 - CGFloat(i) / CGFloat(shakeCount))
            actions.append(SKAction.moveBy(x: direction * intensity, y: 0, duration: shakeDuration))
        }
        // Return to original position
        actions.append(SKAction.moveBy(x: 0, y: 0, duration: 0))

        target.run(SKAction.sequence(actions), withKey: "impactShake")
    }

    /// Red flash on the target when taking damage
    static func damageFlash(on target: SKNode) {
        let flashIn = SKAction.colorize(with: SK.Colors.damageRed, colorBlendFactor: 0.6, duration: 0.05)
        let flashOut = SKAction.colorize(withColorBlendFactor: 0, duration: 0.15)
        target.run(SKAction.sequence([flashIn, flashOut]), withKey: "damageFlash")
    }

    /// Full attack sequence: glow attacker, lunge, impact on target, snap back
    static func fullAttackSequence(
        attacker: CreatureNode,
        target: SKNode,
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        // Glow the attacker briefly before lunging
        let glowIn = SKAction.colorize(with: SK.Colors.attackerGlow, colorBlendFactor: 0.4, duration: SK.Duration.attackerGlowIn)

        attacker.run(glowIn) {
            // Lunge toward target
            lunge(attacker: attacker, toward: target.position) {
                // On impact:
                impactShake(on: target)
                damageFlash(on: target)

                // Damage impact particles at target position
                let impactEmitter = ParticleEffects.damageImpact(at: target.position)
                impactEmitter.zPosition = SK.ZPosition.particles
                scene.addChild(impactEmitter)
                impactEmitter.run(SKAction.sequence([
                    SKAction.wait(forDuration: 0.3),
                    SKAction.removeFromParent()
                ]))
            }

            // Clear glow after snap-back
            let totalDuration = SK.Duration.attack + SK.Duration.attackerGlowIn
            DispatchQueue.main.asyncAfter(deadline: .now() + totalDuration) {
                attacker.run(SKAction.colorize(withColorBlendFactor: 0, duration: 0.1))
                completion()
            }
        }
    }

    /// Face attack: attacker lunges toward the player avatar
    static func faceAttackSequence(
        attacker: CreatureNode,
        avatarNode: AvatarNode,
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        fullAttackSequence(attacker: attacker, target: avatarNode, in: scene, completion: completion)
    }
}

// DeathAction.swift
// Chaos Creatures
// Creature death animation with faction-specific particle effects.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// Faction-specific death animations for creatures on the board.
/// Each faction has a distinct visual: Ironwright=sparks, Fey=petals, Demonic=embers.
enum DeathAction {

    /// Play the full death animation on a creature node, then remove it.
    /// Uses the enhanced 3-phase destruction sequence from CreatureNode:
    /// crack overlay -> desaturation -> drift off screen, with faction particles.
    /// Endless faction creatures leave a lingering ghost afterimage.
    static func playDeath(
        creature: CreatureNode,
        faction: FactionShortName?,
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        let position = creature.position
        let effectiveFaction = faction ?? .ironwright

        // Faction-specific particle burst (fires immediately at creature position)
        let emitter = ParticleEffects.deathEmitter(for: effectiveFaction)
        emitter.position = position
        emitter.zPosition = SK.ZPosition.particles
        scene.addChild(emitter)

        // Additional death shatter burst for extra impact
        let factionColor: UIColor
        switch effectiveFaction {
        case .ironwright: factionColor = UIColor(hex: "#D4AF37")
        case .feyCourts: factionColor = UIColor(hex: "#81C784")
        case .demonicKingdoms: factionColor = UIColor(hex: "#FF5252")
        case .celestialCrusade: factionColor = UIColor(hex: "#DAA520")
        case .theEndless: factionColor = UIColor(hex: "#6B3FA0")
        }
        let shatter = ParticleEffects.deathShatter(at: position, color: factionColor)
        shatter.zPosition = SK.ZPosition.particles
        scene.addChild(shatter)
        shatter.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.6),
            SKAction.removeFromParent()
        ]))

        // Run enhanced 3-phase destruction on the creature node itself
        // (crack overlay, desaturation, drift downward, Endless ghost)
        creature.playDestruction(in: scene) {
            // Auto-remove emitter after particles finish
            emitter.run(SKAction.sequence([
                SKAction.wait(forDuration: max(SK.Duration.deathParticles - 1.2, 0)),
                SKAction.removeFromParent()
            ])) {
                completion()
            }
        }
    }

    /// Quick death for multiple creatures dying simultaneously (e.g. simultaneous combat)
    static func playMultipleDeaths(
        creatures: [(node: CreatureNode, faction: FactionShortName?)],
        in scene: SKScene,
        completion: @escaping () -> Void
    ) {
        guard !creatures.isEmpty else {
            completion()
            return
        }

        let group = DispatchGroup()
        for (index, entry) in creatures.enumerated() {
            group.enter()
            let delay = TimeInterval(index) * 0.1

            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                playDeath(creature: entry.node, faction: entry.faction, in: scene) {
                    group.leave()
                }
            }
        }

        group.notify(queue: .main) {
            completion()
        }
    }

    /// Graveyard fly animation: small thumbnail flies from death position to graveyard icon
    static func graveyardFly(
        from position: CGPoint,
        to graveyardPosition: CGPoint,
        factionColor: UIColor,
        in scene: SKScene
    ) {
        let thumbnail = SKSpriteNode(color: factionColor.withAlphaComponent(0.5),
                                      size: CGSize(width: 16, height: 22))
        thumbnail.position = position
        thumbnail.zPosition = SK.ZPosition.particles
        thumbnail.alpha = 0.8
        scene.addChild(thumbnail)

        let fly = SKAction.move(to: graveyardPosition, duration: SK.Duration.graveyardFly)
        fly.timingMode = .easeIn
        let shrink = SKAction.scale(to: 0.3, duration: SK.Duration.graveyardFly)
        let fade = SKAction.fadeOut(withDuration: SK.Duration.graveyardFly * 0.5)

        thumbnail.run(SKAction.sequence([
            SKAction.group([fly, shrink, SKAction.sequence([
                SKAction.wait(forDuration: SK.Duration.graveyardFly * 0.5),
                fade
            ])]),
            SKAction.removeFromParent()
        ]))
    }
}

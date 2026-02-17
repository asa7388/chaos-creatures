// ParticleEffects.swift
// Chaos Creatures
// Programmatic SKEmitterNode presets per faction.
// No .sks files needed — all particles built in code.
// Source: docs/design/08-audio-design.md (faction identities), docs/design/07-ui-ux-specs.md

import SpriteKit

enum ParticleEffects {

    // MARK: - Death Particles

    /// Faction-specific death particle burst
    static func deathEmitter(for faction: FactionShortName) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 80
        emitter.numParticlesToEmit = 40
        emitter.particleLifetime = 0.8
        emitter.particleLifetimeRange = 0.3

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 120
        emitter.particleSpeedRange = 60

        emitter.particleAlpha = 1.0
        emitter.particleAlphaSpeed = -1.2

        emitter.particleScale = 0.3
        emitter.particleScaleRange = 0.15
        emitter.particleScaleSpeed = -0.2

        emitter.yAcceleration = -40

        switch faction {
        case .ironwright:
            // Gear/spark particles — bright orange-yellow
            emitter.particleColor = UIColor(hex: "#D4AF37")
            emitter.particleColorBlendFactor = 1.0
            emitter.particleSize = CGSize(width: 6, height: 6)
            emitter.particleSpeed = 150
            emitter.yAcceleration = -80

        case .feyCourts:
            // Leaf/petal burst — soft green
            emitter.particleColor = UIColor(hex: "#81C784")
            emitter.particleColorBlendFactor = 1.0
            emitter.particleSize = CGSize(width: 8, height: 4)
            emitter.particleSpeed = 80
            emitter.particleRotationRange = .pi
            emitter.particleRotationSpeed = 2.0
            emitter.yAcceleration = -20

        case .demonicKingdoms:

            // Ember/smoke — deep red
            emitter.particleColor = UIColor(hex: "#FF5252")
            emitter.particleColorBlendFactor = 1.0
            emitter.particleSize = CGSize(width: 5, height: 5)
            emitter.particleSpeed = 100
            emitter.yAcceleration = 30 // Embers rise
        }

        emitter.particleBlendMode = .add
        return emitter
    }

    // MARK: - Heal Particles

    /// Green sparkle particles for Lifesteal heal
    static func healEmitter() -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 30
        emitter.numParticlesToEmit = 20
        emitter.particleLifetime = 0.6
        emitter.particleLifetimeRange = 0.2

        emitter.emissionAngle = .pi / 2 // Upward
        emitter.emissionAngleRange = .pi / 4

        emitter.particleSpeed = 60
        emitter.particleSpeedRange = 20

        emitter.particleAlpha = 0.9
        emitter.particleAlphaSpeed = -1.5

        emitter.particleScale = 0.2
        emitter.particleScaleRange = 0.1

        emitter.particleColor = UIColor(hex: "#4CAF50")
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 6, height: 6)

        emitter.particleBlendMode = .add
        return emitter
    }

    // MARK: - Shield Break Particles

    /// Blue shatter particles for Shield keyword absorption
    static func shieldBreakEmitter() -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 60
        emitter.numParticlesToEmit = 30
        emitter.particleLifetime = 0.5
        emitter.particleLifetimeRange = 0.2

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 100
        emitter.particleSpeedRange = 50

        emitter.particleAlpha = 1.0
        emitter.particleAlphaSpeed = -2.0

        emitter.particleScale = 0.25
        emitter.particleScaleRange = 0.1

        emitter.particleColor = UIColor(hex: "#5BC0EB")
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 8, height: 3)

        emitter.particleRotationRange = .pi
        emitter.particleRotationSpeed = 3.0

        emitter.yAcceleration = -60

        emitter.particleBlendMode = .add
        return emitter
    }

    // MARK: - Card Play Glow

    /// Brief glow burst when a card is played to the board
    static func cardPlayGlow(factionColor: UIColor) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 40
        emitter.numParticlesToEmit = 20
        emitter.particleLifetime = 0.4
        emitter.particleLifetimeRange = 0.1

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 40
        emitter.particleSpeedRange = 20

        emitter.particleAlpha = 0.8
        emitter.particleAlphaSpeed = -2.0

        emitter.particleScale = 0.15
        emitter.particleScaleRange = 0.05

        emitter.particleColor = factionColor
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 4, height: 4)

        emitter.particleBlendMode = .add
        return emitter
    }

    // MARK: - Chaos Roll Particles

    /// Spinning chaos energy during D20 roll
    static func chaosRollEmitter(result: ChaosRollOutcome) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 50
        emitter.numParticlesToEmit = 40
        emitter.particleLifetime = 0.6
        emitter.particleLifetimeRange = 0.2

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 80
        emitter.particleSpeedRange = 30

        emitter.particleAlpha = 1.0
        emitter.particleAlphaSpeed = -1.5

        emitter.particleScale = 0.2
        emitter.particleScaleRange = 0.1

        switch result {
        case .order:
            emitter.particleColor = UIColor(hex: "#5BC0EB")
        case .chaos:
            emitter.particleColor = UIColor(hex: "#E63946")
        case .nothing:
            emitter.particleColor = UIColor(hex: "#888888")
        }

        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 5, height: 5)
        emitter.particleBlendMode = .add

        return emitter
    }

    // MARK: - Attunement Glow

    /// Soft glow around creature when attuned modifier is active
    static func attunementGlow(eventType: EventType) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 10
        emitter.particleLifetime = 1.0
        emitter.particleLifetimeRange = 0.3

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 15
        emitter.particleSpeedRange = 5

        emitter.particleAlpha = 0.4
        emitter.particleAlphaSpeed = -0.4

        emitter.particleScale = 0.3
        emitter.particleScaleRange = 0.1

        switch eventType {
        case .order:
            emitter.particleColor = UIColor(hex: "#5BC0EB")
        case .chaos:
            emitter.particleColor = UIColor(hex: "#E63946")
        }

        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 6, height: 6)
        emitter.particleBlendMode = .add

        return emitter
    }

    // MARK: - Spell Effect Trail

    /// Particle trail for spell projectile
    static func spellTrail(factionColor: UIColor) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 60
        emitter.particleLifetime = 0.3
        emitter.particleLifetimeRange = 0.1

        emitter.particleAlpha = 0.8
        emitter.particleAlphaSpeed = -2.5

        emitter.particleScale = 0.15
        emitter.particleScaleRange = 0.05

        emitter.particleColor = factionColor
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 4, height: 4)

        emitter.particleBlendMode = .add
        emitter.targetNode = nil // Will be set to the scene so trail stays in place

        return emitter
    }
}

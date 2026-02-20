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

        case .celestialCrusade:
            // Divine radiance — golden light
            emitter.particleColor = UIColor(hex: "#DAA520")
            emitter.particleColorBlendFactor = 1.0
            emitter.particleSize = CGSize(width: 6, height: 6)
            emitter.particleSpeed = 120
            emitter.yAcceleration = 40 // Light rises

        case .theEndless:
            // Spectral mist — purple wisps
            emitter.particleColor = UIColor(hex: "#6B3FA0")
            emitter.particleColorBlendFactor = 1.0
            emitter.particleSize = CGSize(width: 7, height: 3)
            emitter.particleSpeed = 60
            emitter.particleRotationRange = .pi
            emitter.particleRotationSpeed = 1.5
            emitter.yAcceleration = 10 // Wisps drift upward slowly
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

    // MARK: - Legendary Sparkles

    /// Golden sparkle particles around a legendary card border.
    /// Positioned at the card's center, particles emanate from the edges.
    static func legendarySparkles(cardSize: CGSize) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = SK.RarityEffects.legendaryParticleBirthRate
        emitter.particleLifetime = 1.2
        emitter.particleLifetimeRange = 0.4

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 12
        emitter.particleSpeedRange = 8

        emitter.particleAlpha = 0.9
        emitter.particleAlphaSpeed = -0.7

        emitter.particleScale = 0.15
        emitter.particleScaleRange = 0.08
        emitter.particleScaleSpeed = -0.05

        emitter.particleColor = SK.RarityEffects.legendaryParticleColor
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 4, height: 4)

        // Emit from around the card border using a rectangle emission area
        emitter.particlePositionRange = CGVector(dx: cardSize.width + 4, dy: cardSize.height + 4)

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

    // MARK: - Death Shatter

    /// Burst of particles scattering outward from creature position on death.
    /// Color matches faction. 20-30 particles, 0.5s duration.
    static func deathShatter(at position: CGPoint, color: UIColor) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 200 // High birth rate, low count = quick burst
        emitter.numParticlesToEmit = 25
        emitter.particleLifetime = 0.45
        emitter.particleLifetimeRange = 0.15

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 140
        emitter.particleSpeedRange = 60

        emitter.particleAlpha = 1.0
        emitter.particleAlphaSpeed = -2.0

        emitter.particleScale = 0.25
        emitter.particleScaleRange = 0.15
        emitter.particleScaleSpeed = -0.3

        emitter.particleColor = color
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 6, height: 6)

        emitter.particleRotationRange = .pi * 2
        emitter.particleRotationSpeed = 4.0

        emitter.yAcceleration = -50

        emitter.particleBlendMode = .add
        emitter.position = position
        return emitter
    }

    // MARK: - Evolution Glow

    /// Swirling upward spiral of golden/purple particles around evolving creature.
    /// Birth rate ramps up during the 2s duration for a climactic feel.
    static func evolutionGlow(at position: CGPoint) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 30
        emitter.numParticlesToEmit = 50
        emitter.particleLifetime = 1.0
        emitter.particleLifetimeRange = 0.4

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 35
        emitter.particleSpeedRange = 15

        emitter.particleAlpha = 0.9
        emitter.particleAlphaSpeed = -0.5

        emitter.particleScale = 0.2
        emitter.particleScaleRange = 0.1
        emitter.particleScaleSpeed = 0.08

        emitter.particleColor = UIColor(hex: "#FFD700") // Gold
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 5, height: 5)

        // Swirl upward
        emitter.yAcceleration = 40
        emitter.particlePositionRange = CGVector(dx: 40, dy: 40)

        emitter.particleBlendMode = .add
        emitter.position = position
        return emitter
    }

    // MARK: - Chaos Energy Swirl

    /// Red/purple particles swirling chaotically around a point during chaos events.
    /// High speed variance for chaotic movement. 1.5s duration.
    static func chaosEnergySwirl(at position: CGPoint) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 40
        emitter.numParticlesToEmit = 45
        emitter.particleLifetime = 0.8
        emitter.particleLifetimeRange = 0.4

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 100
        emitter.particleSpeedRange = 80 // High variance = chaotic motion

        emitter.particleAlpha = 0.9
        emitter.particleAlphaSpeed = -1.0

        emitter.particleScale = 0.2
        emitter.particleScaleRange = 0.12
        emitter.particleScaleSpeed = -0.15

        emitter.particleColor = UIColor(hex: "#E63946") // Chaos red
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 5, height: 5)

        // Erratic movement
        emitter.xAcceleration = CGFloat.random(in: -30...30)
        emitter.yAcceleration = CGFloat.random(in: -30...30)
        emitter.particlePositionRange = CGVector(dx: 30, dy: 30)

        emitter.particleRotationRange = .pi * 2
        emitter.particleRotationSpeed = 6.0

        emitter.particleBlendMode = .add
        emitter.position = position
        return emitter
    }

    // MARK: - Order Energy Crystallize

    /// Blue/white geometric particles converging on a point during order events.
    /// Particles slow down as they approach center. 1.5s duration.
    static func orderEnergyCrystallize(at position: CGPoint) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 35
        emitter.numParticlesToEmit = 40
        emitter.particleLifetime = 1.0
        emitter.particleLifetimeRange = 0.3

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = -50 // Negative speed = particles converge inward
        emitter.particleSpeedRange = 20

        emitter.particleAlpha = 0.8
        emitter.particleAlphaSpeed = -0.6

        emitter.particleScale = 0.22
        emitter.particleScaleRange = 0.08
        emitter.particleScaleSpeed = -0.12 // Shrink as they converge

        emitter.particleColor = UIColor(hex: "#5BC0EB") // Order blue
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 6, height: 4) // Elongated = geometric feel

        // Start spawned in a wide ring, converge to center
        emitter.particlePositionRange = CGVector(dx: 80, dy: 80)

        emitter.particleRotationRange = .pi / 4
        emitter.particleRotationSpeed = 1.5

        emitter.particleBlendMode = .add
        emitter.position = position
        return emitter
    }

    // MARK: - CM Gain Sparkle

    /// Small burst of blue/cyan sparkles for CM gain. Quick and subtle. 0.3s duration.
    static func manaGainSparkle(at position: CGPoint) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 100 // Quick burst
        emitter.numParticlesToEmit = 12
        emitter.particleLifetime = 0.25
        emitter.particleLifetimeRange = 0.1

        emitter.emissionAngle = .pi / 2 // Upward
        emitter.emissionAngleRange = .pi / 3
        emitter.particleSpeed = 50
        emitter.particleSpeedRange = 20

        emitter.particleAlpha = 1.0
        emitter.particleAlphaSpeed = -4.0

        emitter.particleScale = 0.12
        emitter.particleScaleRange = 0.06

        emitter.particleColor = UIColor(hex: "#4A90E2") // CM blue
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 4, height: 4)

        emitter.yAcceleration = 20

        emitter.particleBlendMode = .add
        emitter.position = position
        return emitter
    }

    // MARK: - Card Play Trail

    /// Particle trail that follows a card being played from hand to board.
    /// Returns emitter to be added as a child of the moving card node.
    /// White/gold trail particles.
    static func cardPlayTrail() -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 50
        emitter.particleLifetime = 0.3
        emitter.particleLifetimeRange = 0.1

        // Emit backward (trail behind the moving card)
        emitter.emissionAngle = -.pi / 2 // Downward (card moves up)
        emitter.emissionAngleRange = .pi / 6

        emitter.particleSpeed = 20
        emitter.particleSpeedRange = 10

        emitter.particleAlpha = 0.7
        emitter.particleAlphaSpeed = -2.3

        emitter.particleScale = 0.12
        emitter.particleScaleRange = 0.05

        emitter.particleColor = UIColor(hex: "#FFD700") // Gold
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 4, height: 4)

        emitter.particleBlendMode = .add
        emitter.targetNode = nil // Set to scene so trail stays in world space

        return emitter
    }

    // MARK: - Damage Impact

    /// Red burst at impact point. Quick, violent, few particles. 0.2s duration.
    static func damageImpact(at position: CGPoint) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 300 // Very high rate, very few particles = instant burst
        emitter.numParticlesToEmit = 15
        emitter.particleLifetime = 0.18
        emitter.particleLifetimeRange = 0.06

        emitter.emissionAngleRange = .pi * 2
        emitter.particleSpeed = 160
        emitter.particleSpeedRange = 60

        emitter.particleAlpha = 1.0
        emitter.particleAlphaSpeed = -5.0

        emitter.particleScale = 0.2
        emitter.particleScaleRange = 0.1
        emitter.particleScaleSpeed = -0.5

        emitter.particleColor = UIColor(hex: "#F44336") // Damage red
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 5, height: 5)

        emitter.particleBlendMode = .add
        emitter.position = position
        return emitter
    }

    // MARK: - Heal Shimmer

    /// Green/gold upward floating particles. Gentle, slow rise. 0.8s duration.
    static func healShimmer(at position: CGPoint) -> SKEmitterNode {
        let emitter = SKEmitterNode()

        emitter.particleBirthRate = 25
        emitter.numParticlesToEmit = 18
        emitter.particleLifetime = 0.7
        emitter.particleLifetimeRange = 0.2

        emitter.emissionAngle = .pi / 2 // Upward
        emitter.emissionAngleRange = .pi / 5
        emitter.particleSpeed = 30
        emitter.particleSpeedRange = 12

        emitter.particleAlpha = 0.8
        emitter.particleAlphaSpeed = -1.0

        emitter.particleScale = 0.15
        emitter.particleScaleRange = 0.08
        emitter.particleScaleSpeed = 0.04 // Grow slightly as they rise

        emitter.particleColor = UIColor(hex: "#4CAF50") // Heal green
        emitter.particleColorBlendFactor = 1.0
        emitter.particleSize = CGSize(width: 5, height: 5)

        emitter.yAcceleration = 15 // Gentle upward drift
        emitter.particlePositionRange = CGVector(dx: 30, dy: 10)

        emitter.particleBlendMode = .add
        emitter.position = position
        return emitter
    }
}

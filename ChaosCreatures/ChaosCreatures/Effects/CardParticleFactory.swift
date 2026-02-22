// CardParticleFactory.swift
// Chaos Creatures
//
// Programmatic rarity particle emitters for card display.
// All emitters built via SKEmitterNode — no .sks files.
// Particle parameters from docs/CARD_DESIGN_GUIDE.md Section 6.8.
// Blend mode is .alpha (not .add) — physical material appearance, not digital glow.
//
// Spec: docs/CARD_DESIGN_GUIDE.md Section 6.8
// Task 3.2

import SpriteKit
import SwiftUI
import UIKit

/// Creates rarity-specific card particle emitters programmatically.
/// Never use .sks files — they require the Xcode GUI to produce and cannot be
/// written by code. All emitter parameters match the Section 6.8 table.
///
/// Returns `nil` for `.common` (no particles on common cards).
enum CardParticleFactory {

    /// Returns nil for .common (no particles).
    static func makeEmitter(for rarity: Rarity, in artBoxSize: CGSize) -> SKEmitterNode? {
        switch rarity {
        case .common:
            return nil

        case .uncommon:
            // Fine dust motes — slow drift, barely visible, parchment-light at 30% opacity
            let e = SKEmitterNode()
            e.particleBirthRate        = 2
            e.particleLifetime         = 4
            e.particleLifetimeRange    = 1.5
            e.particleSpeed            = 8
            e.particleSpeedRange       = 6
            e.emissionAngle            = .pi / 2      // upward drift
            e.emissionAngleRange       = .pi          // full hemisphere
            e.particleAlpha            = 0.30
            e.particleAlphaRange       = 0.10
            e.particleAlphaSpeed       = -0.06        // fades out over lifetime
            e.particleScale            = 0.012         // ~2pt at 167px/pt
            e.particleScaleRange       = 0.008
            e.particleRotationRange    = .pi * 2
            e.particleRotationSpeed    = 0.3
            e.particleColor            = UIColor(named: "parchment-light") ?? .systemGray6
            e.particleBlendMode        = .alpha        // physical, not digital
            e.particleTexture          = makeCircleTexture(diameter: 4)
            constrainToArtBox(e, size: artBoxSize)
            return e

        case .rare:
            // Gold leaf flakes — slow tumble, rich gold at 70% opacity
            let e = SKEmitterNode()
            e.particleBirthRate        = 5
            e.particleLifetime         = 3
            e.particleLifetimeRange    = 1.0
            e.particleSpeed            = 12
            e.particleSpeedRange       = 8
            e.emissionAngle            = .pi / 2
            e.emissionAngleRange       = .pi * 0.6    // narrower: leaves fall less sideways
            e.particleAlpha            = 0.70
            e.particleAlphaRange       = 0.15
            e.particleAlphaSpeed       = -0.18
            e.particleScale            = 0.025         // ~6pt
            e.particleScaleRange       = 0.012
            e.particleRotationRange    = .pi * 2
            e.particleRotationSpeed    = 1.8           // tumbling leaf motion
            e.xAcceleration            = 4             // gentle lateral drift
            e.particleColor            = UIColor(named: "aged-gold") ?? .systemYellow
            e.particleBlendMode        = .alpha
            e.particleTexture          = makeLeafTexture()
            constrainToArtBox(e, size: artBoxSize)
            return e

        case .epic:
            // Slow amethyst embers — rising, fading from amethyst to transparent
            let e = SKEmitterNode()
            e.particleBirthRate        = 8
            e.particleLifetime         = 3.5
            e.particleLifetimeRange    = 1.2
            e.particleSpeed            = 20
            e.particleSpeedRange       = 10
            e.emissionAngle            = .pi / 2      // rising
            e.emissionAngleRange       = .pi * 0.4
            e.particleAlpha            = 0.85
            e.particleAlphaRange       = 0.10
            e.particleAlphaSpeed       = -0.22
            e.particleScale            = 0.018         // ~4pt
            e.particleScaleRange       = 0.012
            e.particleRotationRange    = .pi
            e.particleRotationSpeed    = 0.6
            e.yAcceleration            = 15            // embers rise
            e.particleColor            = UIColor(named: "epic-amethyst") ?? .purple
            e.particleBlendMode        = .alpha
            e.particleTexture          = makeCircleTexture(diameter: 5)
            constrainToArtBox(e, size: artBoxSize)
            return e

        case .legendary:
            // Ember sparks — faster, more intense, strongly rising
            let e = SKEmitterNode()
            e.particleBirthRate        = 14
            e.particleLifetime         = 2.0
            e.particleLifetimeRange    = 0.8
            e.particleSpeed            = 35
            e.particleSpeedRange       = 18
            e.emissionAngle            = .pi / 2
            e.emissionAngleRange       = .pi * 0.5
            e.particleAlpha            = 0.90
            e.particleAlphaRange       = 0.08
            e.particleAlphaSpeed       = -0.40
            e.particleScale            = 0.015         // 3–6pt range with scaleRange
            e.particleScaleRange       = 0.010
            e.particleRotationRange    = .pi * 2
            e.particleRotationSpeed    = 2.5
            e.yAcceleration            = 30
            e.particleColor            = UIColor(named: "legendary-ember") ?? .orange
            e.particleBlendMode        = .alpha        // physical — no additive
            e.particleTexture          = makeSparkTexture()
            constrainToArtBox(e, size: artBoxSize)
            return e
        }
    }

    // MARK: - Particle Texture Helpers

    /// Soft circle — used for dust motes and epic embers.
    private static func makeCircleTexture(diameter: CGFloat) -> SKTexture {
        let size = CGSize(width: diameter, height: diameter)
        let image = UIGraphicsImageRenderer(size: size).image { ctx in
            ctx.cgContext.setFillColor(UIColor.white.cgColor)
            ctx.cgContext.fillEllipse(in: CGRect(origin: .zero, size: size))
        }
        return SKTexture(image: image)
    }

    /// Thin elongated oval — reads as a tumbling leaf or gold flake at small scale.
    private static func makeLeafTexture() -> SKTexture {
        let size = CGSize(width: 10, height: 5)
        let image = UIGraphicsImageRenderer(size: size).image { ctx in
            ctx.cgContext.setFillColor(UIColor.white.cgColor)
            ctx.cgContext.fillEllipse(in: CGRect(origin: .zero, size: size))
        }
        return SKTexture(image: image)
    }

    /// 4-point star — reads as a spark at small scale.
    private static func makeSparkTexture() -> SKTexture {
        let size = CGSize(width: 8, height: 8)
        let image = UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            c.setFillColor(UIColor.white.cgColor)
            let cx = size.width / 2
            let cy = size.height / 2
            let outerR: CGFloat = 4.0
            let innerR: CGFloat = 1.5
            let path = UIBezierPath()
            for i in 0..<4 {
                let outerAngle = CGFloat(i) * .pi / 2
                let innerAngle = outerAngle + .pi / 4
                let outer = CGPoint(x: cx + cos(outerAngle) * outerR,
                                    y: cy + sin(outerAngle) * outerR)
                let inner = CGPoint(x: cx + cos(innerAngle) * innerR,
                                    y: cy + sin(innerAngle) * innerR)
                if i == 0 {
                    path.move(to: outer)
                } else {
                    path.addLine(to: outer)
                }
                path.addLine(to: inner)
            }
            path.close()
            path.fill()
        }
        return SKTexture(image: image)
    }

    /// Constrain particle birth position to the art box area.
    /// Particles spawn within the card's art region, not outside it.
    /// Art box in a 210×294pt card: x=4–206, y=29–161 (top 62% of card is art).
    private static func constrainToArtBox(_ emitter: SKEmitterNode, size artBoxSize: CGSize) {
        emitter.particlePositionRange = CGVector(
            dx: artBoxSize.width,
            dy: artBoxSize.height * 0.5   // concentrate births in lower half of art box
        )
    }
}

// MARK: - CardParticleView (SwiftUI integration)

/// SwiftUI wrapper that presents an `SKScene` with rarity particles
/// overlaid on the card's art box.
///
/// Usage:
/// ```swift
/// CardParticleView(rarity: card.rarity, artBoxSize: CGSize(width: 202, height: 132))
///     .allowsHitTesting(false)
/// ```
struct CardParticleView: UIViewRepresentable {
    let rarity: Rarity
    let artBoxSize: CGSize

    func makeUIView(context: Context) -> SKView {
        let skView = SKView()
        skView.backgroundColor = .clear
        skView.allowsTransparency = true
        skView.ignoresSiblingOrder = true

        let scene = SKScene(size: artBoxSize)
        scene.backgroundColor = .clear
        scene.scaleMode = .resizeFill

        if let emitter = CardParticleFactory.makeEmitter(for: rarity, in: artBoxSize) {
            // Position at bottom-center of art box — particles rise upward from here
            emitter.position = CGPoint(x: artBoxSize.width / 2, y: 8)
            scene.addChild(emitter)
        }

        skView.presentScene(scene)
        return skView
    }

    func updateUIView(_ uiView: SKView, context: Context) {
        // Rarity does not change at runtime — no update needed
    }
}

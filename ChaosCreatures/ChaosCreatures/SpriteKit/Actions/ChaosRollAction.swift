// ChaosRollAction.swift
// Chaos Creatures
// D20 spin animation + result reveal with color-coded outcome.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// D20 chaos roll animation: spin with random numbers, decelerate, land on result.
enum ChaosRollAction {

    /// Create the D20 node for the roll animation
    static func createD20Node() -> SKNode {
        let container = SKNode()
        container.name = "d20Container"

        // D20 polygon (hexagonal approximation)
        let sides = 6
        let radius = SK.D20.diameter / 2
        let path = CGMutablePath()
        for i in 0..<sides {
            let angle = CGFloat(i) * (.pi * 2 / CGFloat(sides)) - .pi / 2
            let x = radius * cos(angle)
            let y = radius * sin(angle)
            if i == 0 {
                path.move(to: CGPoint(x: x, y: y))
            } else {
                path.addLine(to: CGPoint(x: x, y: y))
            }
        }
        path.closeSubpath()

        let polygon = SKShapeNode(path: path)
        polygon.fillColor = SK.D20.fillColor
        polygon.strokeColor = SK.D20.strokeColor
        polygon.lineWidth = SK.D20.strokeWidth
        polygon.zPosition = 1
        polygon.name = "d20Shape"
        container.addChild(polygon)

        // Number label
        let label = SKLabelNode(fontNamed: SK.Fonts.heavy)
        label.fontSize = SK.D20.numberFontSize
        label.fontColor = .white
        label.horizontalAlignmentMode = .center
        label.verticalAlignmentMode = .center
        label.zPosition = 2
        label.name = "d20Number"
        label.text = "?"
        container.addChild(label)

        return container
    }

    /// Full D20 spin animation
    /// - Parameters:
    ///   - d20Node: The D20 container node (from createD20Node)
    ///   - rollValue: The final roll value (1-20)
    ///   - instability: Player's instability value (shown during roll)
    ///   - result: The chaos roll outcome (ORDER, CHAOS, NOTHING)
    ///   - completion: Called after the reveal
    static func spinAndReveal(
        d20Node: SKNode,
        rollValue: Int,
        instability: Int,
        result: ChaosRollOutcome,
        completion: @escaping () -> Void
    ) {
        guard let numberLabel = d20Node.childNode(withName: "d20Number") as? SKLabelNode,
              let shapeNode = d20Node.childNode(withName: "d20Shape") as? SKShapeNode else {
            completion()
            return
        }

        let baseDuration = SK.Duration.chaosRollBase

        // Phase 1: Rapid number spin (1.0s)
        let spinDuration: TimeInterval = baseDuration * 0.67
        let tickInterval: TimeInterval = 0.05
        let tickCount = Int(spinDuration / tickInterval)

        var spinActions: [SKAction] = []
        for i in 0..<tickCount {
            let randomNum = Int.random(in: 1...20)
            spinActions.append(SKAction.run {
                numberLabel.text = "\(randomNum)"
            })
            // Decelerate: longer waits near the end
            let progress = CGFloat(i) / CGFloat(tickCount)
            let waitTime = tickInterval * (1.0 + progress * 2.0)
            spinActions.append(SKAction.wait(forDuration: waitTime))
        }

        // Phase 2: Land on final number
        spinActions.append(SKAction.run {
            numberLabel.text = "\(rollValue)"
        })

        // Rotation during spin
        let spinRotation = SKAction.rotate(byAngle: .pi * 6, duration: spinDuration)
        spinRotation.timingMode = .easeOut

        // Scale pulse during spin
        let scalePulse = SKAction.sequence([
            SKAction.scale(to: 1.1, duration: spinDuration * 0.3),
            SKAction.scale(to: 0.95, duration: spinDuration * 0.3),
            SKAction.scale(to: 1.0, duration: spinDuration * 0.4)
        ])

        let spinGroup = SKAction.group([
            SKAction.sequence(spinActions),
            spinRotation,
            scalePulse
        ])

        // Phase 3: Result reveal (color change + glow)
        let resultColor: UIColor
        switch result {
        case .order: resultColor = SK.D20.orderColor
        case .chaos: resultColor = SK.D20.chaosColor
        case .nothing: resultColor = SK.D20.nothingColor
        }

        let revealAction = SKAction.run {
            numberLabel.fontColor = resultColor
            shapeNode.strokeColor = resultColor

            // Big scale pulse on reveal
            let revealPulse = SKAction.sequence([
                SKAction.scale(to: 1.3, duration: 0.15),
                SKAction.scale(to: 1.0, duration: 0.15)
            ])
            d20Node.run(revealPulse)
        }

        let holdResult = SKAction.wait(forDuration: 0.8)

        let fullSequence = SKAction.sequence([
            spinGroup,
            revealAction,
            holdResult,
            SKAction.run(completion)
        ])

        d20Node.run(fullSequence, withKey: "chaosRoll")
    }

    /// Chaos roll particle burst based on result
    static func resultParticles(
        result: ChaosRollOutcome,
        at position: CGPoint,
        in scene: SKScene
    ) {
        let emitter = ParticleEffects.chaosRollEmitter(result: result)
        emitter.position = position
        emitter.zPosition = SK.ZPosition.particles
        scene.addChild(emitter)

        emitter.run(SKAction.sequence([
            SKAction.wait(forDuration: 1.0),
            SKAction.removeFromParent()
        ]))
    }

    /// Screen-wide color flash for the roll result
    static func resultFlash(
        result: ChaosRollOutcome,
        in scene: SKScene
    ) {
        let color: UIColor
        switch result {
        case .order: color = SK.D20.orderColor
        case .chaos: color = SK.D20.chaosColor
        case .nothing: return // No flash for nothing
        }

        let flash = SKSpriteNode(color: color, size: scene.size)
        flash.position = CGPoint(x: scene.size.width / 2, y: scene.size.height / 2)
        flash.alpha = 0
        flash.zPosition = SK.ZPosition.screenFlash
        scene.addChild(flash)

        flash.run(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.2, duration: 0.05),
            SKAction.fadeAlpha(to: 0, duration: 0.3),
            SKAction.removeFromParent()
        ]))
    }
}

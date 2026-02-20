// ChaosRollScene.swift
// Chaos Creatures
// Standalone D20 roll animation overlay scene.
// Used when presenting chaos roll as a full-screen overlay.
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// Standalone D20 chaos roll scene for full-screen presentation.
/// In the main battle flow, the D20 is rendered within BattleScene.
/// This scene is available as an alternative for testing or dramatic reveals.
final class ChaosRollScene: SKScene {

    // MARK: - Properties

    private var d20Node: SKNode?
    private var instabilityLabel: SKLabelNode?
    private var resultCallback: ((ChaosRollOutcome) -> Void)?

    // MARK: - Lifecycle

    override func didMove(to view: SKView) {
        backgroundColor = UIColor.black.withAlphaComponent(0.85)
        anchorPoint = CGPoint(x: 0.5, y: 0.5)

        setupBackground()
    }

    // MARK: - Setup

    private func setupBackground() {
        // Semi-transparent dark overlay
        let overlay = SKSpriteNode(color: UIColor.black.withAlphaComponent(0.7), size: size)
        overlay.zPosition = 0
        addChild(overlay)
    }

    // MARK: - Roll Presentation

    /// Present a chaos roll with animation.
    /// - Parameters:
    ///   - rollValue: The final D20 value (1-20)
    ///   - instability: Player's instability value
    ///   - result: ORDER, CHAOS, or NOTHING
    ///   - completion: Called after the reveal animation
    func presentRoll(
        rollValue: Int,
        instability: Int,
        result: ChaosRollOutcome,
        completion: @escaping (ChaosRollOutcome) -> Void
    ) {
        self.resultCallback = completion

        // Instability display
        let instLabel = SKLabelNode(fontNamed: SK.Fonts.medium)
        instLabel.fontSize = 14
        instLabel.fontColor = UIColor(hex: "#F0EAD6").withAlphaComponent(0.6)
        instLabel.horizontalAlignmentMode = .center
        instLabel.verticalAlignmentMode = .center
        instLabel.position = CGPoint(x: 0, y: SK.D20.diameter / 2 + 30)
        instLabel.zPosition = 10
        instLabel.text = "Instability: \(instability)"
        addChild(instLabel)
        self.instabilityLabel = instLabel

        // Create D20
        let d20 = ChaosRollAction.createD20Node()
        d20.position = .zero
        d20.zPosition = 10
        d20.setScale(0.1)
        d20.alpha = 0
        addChild(d20)
        self.d20Node = d20

        // Entrance animation
        let scaleIn = SKAction.scale(to: 1.0, duration: 0.3)
        scaleIn.timingMode = .easeOut
        let fadeIn = SKAction.fadeIn(withDuration: 0.2)

        d20.run(SKAction.group([scaleIn, fadeIn])) { [weak self] in
            guard let self = self else { return }

            // Spin and reveal
            ChaosRollAction.spinAndReveal(
                d20Node: d20,
                rollValue: rollValue,
                instability: instability,
                result: result
            ) {
                // Result particles
                ChaosRollAction.resultParticles(result: result, at: .zero, in: self)
                ChaosRollAction.resultFlash(result: result, in: self)

                // Show result text
                self.showResultText(result)

                // Fade out after delay
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    self.dismissRoll(result: result)
                }
            }
        }
    }

    private func showResultText(_ result: ChaosRollOutcome) {
        let text: String
        let color: UIColor
        switch result {
        case .order:
            text = "ORDER"
            color = SK.D20.orderColor
        case .chaos:
            text = "CHAOS"
            color = SK.D20.chaosColor
        case .nothing:
            text = "NOTHING"
            color = SK.D20.nothingColor
        }

        let label = SKLabelNode(fontNamed: SK.Fonts.heavy)
        label.fontSize = 24
        label.fontColor = color
        label.horizontalAlignmentMode = .center
        label.verticalAlignmentMode = .center
        label.position = CGPoint(x: 0, y: -(SK.D20.diameter / 2 + 30))
        label.zPosition = 10
        label.text = text
        label.alpha = 0
        label.setScale(0.5)
        addChild(label)

        label.run(SKAction.sequence([
            SKAction.group([
                SKAction.fadeIn(withDuration: 0.15),
                SKAction.scale(to: 1.0, duration: 0.15)
            ])
        ]))
    }

    private func dismissRoll(result: ChaosRollOutcome) {
        let fadeOut = SKAction.fadeOut(withDuration: 0.3)
        children.forEach { $0.run(fadeOut) }

        run(SKAction.sequence([
            SKAction.wait(forDuration: 0.3),
            SKAction.run { [weak self] in
                self?.resultCallback?(result)
            }
        ]))
    }
}

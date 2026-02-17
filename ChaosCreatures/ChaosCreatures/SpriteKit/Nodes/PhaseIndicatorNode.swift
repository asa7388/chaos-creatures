// PhaseIndicatorNode.swift
// Chaos Creatures
// Horizontal phase indicator showing the 9 turn phases with current phase highlighted.
// Source: docs/design/07-ui-ux-specs.md Section 3.2

import SpriteKit

/// Horizontal row of phase dots/labels across the center divider.
/// Current phase is highlighted; past phases are dimmed; future phases are dark.
final class PhaseIndicatorNode: SKNode {

    // MARK: - Properties

    private var phaseDots: [SKShapeNode] = []
    private var phaseLabels: [SKLabelNode] = []
    private let currentPhaseLabel: SKLabelNode
    private let phases = TurnPhase.displayPhases

    private let dotRadius: CGFloat = 4
    private let dotSpacing: CGFloat = 32
    private var currentPhaseIndex: Int = 0

    // MARK: - Init

    override init() {
        // Large current phase name label
        currentPhaseLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        currentPhaseLabel.fontSize = 13
        currentPhaseLabel.fontColor = .white
        currentPhaseLabel.horizontalAlignmentMode = .center
        currentPhaseLabel.verticalAlignmentMode = .center
        currentPhaseLabel.position = CGPoint(x: 0, y: 14)
        currentPhaseLabel.zPosition = 1

        super.init()
        self.name = "phaseIndicator"
        self.zPosition = SK.ZPosition.phaseIndicator

        addChild(currentPhaseLabel)
        setupDots()
        updatePhase(.startOfTurn)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Setup

    private func setupDots() {
        let totalWidth = CGFloat(phases.count - 1) * dotSpacing
        let startX = -totalWidth / 2

        for (index, phase) in phases.enumerated() {
            let dot = SKShapeNode(circleOfRadius: dotRadius)
            dot.fillColor = SK.Colors.surfaceMid
            dot.strokeColor = .clear
            dot.position = CGPoint(x: startX + CGFloat(index) * dotSpacing, y: 0)
            dot.zPosition = 1
            dot.name = "phaseDot_\(index)"
            addChild(dot)
            phaseDots.append(dot)

            // Small label below dot
            let label = SKLabelNode(fontNamed: SK.Fonts.regular)
            label.fontSize = 7
            label.fontColor = UIColor.white.withAlphaComponent(0.3)
            label.horizontalAlignmentMode = .center
            label.verticalAlignmentMode = .top
            label.position = CGPoint(x: startX + CGFloat(index) * dotSpacing, y: -dotRadius - 3)
            label.zPosition = 1
            label.text = phase.displayName
            addChild(label)
            phaseLabels.append(label)
        }
    }

    // MARK: - Updates

    /// Update to show the current phase with animation
    func updatePhase(_ phase: TurnPhase) {
        guard let index = phases.firstIndex(of: phase) else {
            // Non-display phase (gameSetup, gameOver) — dim everything
            currentPhaseLabel.text = phase.displayName
            phaseDots.forEach { $0.fillColor = SK.Colors.surfaceMid }
            phaseLabels.forEach { $0.fontColor = UIColor.white.withAlphaComponent(0.3) }
            return
        }

        currentPhaseIndex = index
        currentPhaseLabel.text = phase.displayName

        // Animate the label change
        let scaleUp = SKAction.scale(to: 1.2, duration: SK.Duration.phaseTransition)
        let scaleDown = SKAction.scale(to: 1.0, duration: SK.Duration.phaseTransition)
        currentPhaseLabel.run(SKAction.sequence([scaleUp, scaleDown]))

        // Update dot colors
        for (i, dot) in phaseDots.enumerated() {
            if i < index {
                // Past phase — dim
                dot.fillColor = UIColor.white.withAlphaComponent(0.2)
                dot.run(SKAction.scale(to: 1.0, duration: SK.Duration.phaseTransition))
                phaseLabels[i].fontColor = UIColor.white.withAlphaComponent(0.2)
            } else if i == index {
                // Current phase — bright + pulse
                let phaseColor = colorForPhase(phase)
                dot.fillColor = phaseColor
                dot.run(SKAction.scale(to: 1.5, duration: SK.Duration.phaseTransition))
                phaseLabels[i].fontColor = phaseColor
                currentPhaseLabel.fontColor = phaseColor
            } else {
                // Future phase — dark
                dot.fillColor = SK.Colors.surfaceMid
                dot.run(SKAction.scale(to: 1.0, duration: SK.Duration.phaseTransition))
                phaseLabels[i].fontColor = UIColor.white.withAlphaComponent(0.3)
            }
        }
    }

    // MARK: - Helpers

    private func colorForPhase(_ phase: TurnPhase) -> UIColor {
        switch phase {
        case .chaosRoll, .eventResolution:
            return SK.Colors.chaosRed
        case .declareAttackers, .assignBlockers, .combatResolution:
            return SK.Colors.attackerGlow
        case .mainPhase:
            return SK.Colors.orderBlue
        default:
            return UIColor.white
        }
    }
}

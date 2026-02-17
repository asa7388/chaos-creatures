// ManaBarNode.swift
// Chaos Creatures
// Mana crystal display (filled/empty gems).
// Source: docs/design/07-ui-ux-specs.md Section 3.2

import SpriteKit

/// Horizontal row of mana gems. Filled gems = available mana, empty = used.
/// Max 10 gems per doc design.
final class ManaBarNode: SKNode {

    // MARK: - Properties

    private var gemNodes: [SKShapeNode] = []
    private let maxMana: Int = 10
    private let gemRadius: CGFloat = 8
    private let gemSpacing: CGFloat = 3
    private var factionColor: UIColor

    // MARK: - Init

    init(factionColor: UIColor) {
        self.factionColor = factionColor
        super.init()
        self.name = "manaBar"
        setupGems()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Setup

    private func setupGems() {
        let totalWidth = CGFloat(maxMana) * (gemRadius * 2 + gemSpacing) - gemSpacing
        let startX = -totalWidth / 2 + gemRadius

        for i in 0..<maxMana {
            let gem = SKShapeNode(circleOfRadius: gemRadius)
            gem.fillColor = SK.Colors.manaEmpty
            gem.strokeColor = UIColor.white.withAlphaComponent(0.15)
            gem.lineWidth = 0.5
            gem.position = CGPoint(x: startX + CGFloat(i) * (gemRadius * 2 + gemSpacing), y: 0)
            gem.zPosition = 1
            gem.name = "manaGem_\(i)"
            addChild(gem)
            gemNodes.append(gem)
        }
    }

    // MARK: - Updates

    /// Update display: show `filled` gems as active, `total` gems visible, rest hidden
    func update(filled: Int, total: Int) {
        for (index, gem) in gemNodes.enumerated() {
            if index < total {
                gem.isHidden = false
                if index < filled {
                    gem.fillColor = factionColor
                    gem.strokeColor = factionColor.withAlphaComponent(0.6)
                } else {
                    gem.fillColor = SK.Colors.manaEmpty
                    gem.strokeColor = UIColor.white.withAlphaComponent(0.15)
                }
            } else {
                gem.isHidden = true
            }
        }
    }

    /// Animate a gem being spent
    func animateSpend(newFilled: Int) {
        guard newFilled >= 0 && newFilled < gemNodes.count else { return }
        let gem = gemNodes[newFilled]
        let pulse = SKAction.sequence([
            SKAction.scale(to: 1.3, duration: 0.1),
            SKAction.scale(to: 1.0, duration: 0.1)
        ])
        gem.run(pulse)
        gem.fillColor = SK.Colors.manaEmpty
    }

    /// Animate gaining mana at start of turn
    func animateGain(newFilled: Int) {
        guard newFilled > 0 && newFilled <= gemNodes.count else { return }
        let gem = gemNodes[newFilled - 1]
        gem.fillColor = factionColor
        let glow = SKAction.sequence([
            SKAction.scale(to: 1.4, duration: 0.15),
            SKAction.scale(to: 1.0, duration: 0.15)
        ])
        gem.run(glow)
    }

    /// Update the faction color
    func setFactionColor(_ color: UIColor) {
        self.factionColor = color
    }
}

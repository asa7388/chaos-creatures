// BoardNode.swift
// Chaos Creatures
// 5-slot board layout (per player) for creature placement.
// Source: docs/design/07-ui-ux-specs.md Section 3.3

import SpriteKit

/// Manages 5 creature slots for one player's side of the battlefield.
/// Slots are arranged horizontally, centered within the node.
final class BoardNode: SKNode {

    // MARK: - Properties

    let isPlayerBoard: Bool
    private(set) var slotNodes: [SKShapeNode] = []
    private(set) var creatureNodes: [CreatureNode?] = Array(repeating: nil, count: SK.Board.slotCount)

    // MARK: - Init

    init(isPlayer: Bool) {
        self.isPlayerBoard = isPlayer
        super.init()
        self.name = isPlayer ? "playerBoard" : "opponentBoard"
        setupSlots()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Setup

    private func setupSlots() {
        let slotSize = SK.Board.slotSize
        let spacing = SK.Board.slotSpacing
        let totalWidth = SK.Board.totalWidth
        let startX = -totalWidth / 2 + slotSize.width / 2

        for i in 0..<SK.Board.slotCount {
            let x = startX + CGFloat(i) * (slotSize.width + spacing)
            let slot = SKShapeNode(rectOf: slotSize, cornerRadius: SK.Board.slotCornerRadius)
            slot.fillColor = UIColor(hex: "#0D0D0D").withAlphaComponent(0.3)
            slot.strokeColor = SK.Board.emptySlotColor
            slot.lineWidth = SK.Board.emptySlotBorderWidth
            slot.position = CGPoint(x: x, y: 0)
            slot.zPosition = SK.ZPosition.boardSlots
            slot.name = "slot_\(i)"
            addChild(slot)
            slotNodes.append(slot)
        }
    }

    // MARK: - Creature Management

    /// Place a creature in a specific slot
    func placeCreature(_ creature: BattleCreatureData) {
        let slot = creature.boardSlot
        guard slot >= 0 && slot < SK.Board.slotCount else { return }

        // Remove existing creature in this slot
        removeCreature(atSlot: slot)

        let creatureNode = CreatureNode(creature: creature, isPlayer: isPlayerBoard)
        creatureNode.position = slotPosition(slot)
        creatureNode.zPosition = SK.ZPosition.creatures
        addChild(creatureNode)
        creatureNodes[slot] = creatureNode
    }

    /// Remove creature from a slot (for death, etc.)
    func removeCreature(atSlot slot: Int) {
        guard slot >= 0 && slot < SK.Board.slotCount else { return }
        creatureNodes[slot]?.removeFromParent()
        creatureNodes[slot] = nil
    }

    /// Get the creature node at a slot
    func creatureAt(slot: Int) -> CreatureNode? {
        guard slot >= 0 && slot < SK.Board.slotCount else { return nil }
        return creatureNodes[slot]
    }

    /// Find creature node by creature ID
    func creatureNode(withId id: String) -> CreatureNode? {
        creatureNodes.compactMap { $0 }.first { $0.creatureId == id }
    }

    /// Get slot index for a creature ID
    func slotIndex(forCreatureId id: String) -> Int? {
        creatureNodes.firstIndex { $0?.creatureId == id }
    }

    /// Update all creatures from server state
    func updateFromState(board: [BattleCreatureData?]) {
        for i in 0..<min(board.count, SK.Board.slotCount) {
            if let creature = board[i] {
                if let existing = creatureNodes[i], existing.creatureId == creature.instanceId {
                    // Update existing creature stats
                    existing.updateStats(attack: creature.attack, health: creature.health, maxHealth: creature.maxHealth)
                    existing.updateKeywords(creature.activeKeywords)
                    if creature.shieldActive {
                        existing.showShield()
                    } else {
                        existing.removeShield()
                    }
                } else {
                    // New creature in this slot
                    placeCreature(creature)
                }
            } else {
                // Slot is empty
                removeCreature(atSlot: i)
            }
        }
    }

    /// Place an already-created CreatureNode at a specific slot (used by BattleScene)
    func placeCreature(_ node: CreatureNode, at slot: Int) {
        guard slot >= 0 && slot < SK.Board.slotCount else { return }
        creatureNodes[slot]?.removeFromParent()
        creatureNodes[slot] = node
    }

    /// Remove creature by instance ID
    func removeCreature(id: String) {
        if let index = creatureNodes.firstIndex(where: { $0?.creatureId == id }) {
            creatureNodes[index]?.removeFromParent()
            creatureNodes[index] = nil
        }
    }

    // MARK: - Position Helpers

    /// Get the local position for a slot index
    func positionForSlot(_ index: Int) -> CGPoint {
        guard index >= 0 && index < slotNodes.count else { return .zero }
        return slotNodes[index].position
    }

    /// Get the scene-relative position for a slot index
    func slotPosition(_ index: Int) -> CGPoint {
        guard index >= 0 && index < slotNodes.count else { return .zero }
        return slotNodes[index].position
    }

    /// Get the scene position of a slot (converting to scene coordinates)
    func slotScenePosition(_ index: Int) -> CGPoint {
        guard index >= 0 && index < slotNodes.count else { return .zero }
        return convert(slotNodes[index].position, to: scene ?? self)
    }

    /// Find which slot (if any) contains the given point
    func slotAt(point: CGPoint) -> Int? {
        let localPoint = convert(point, from: scene ?? self)
        for (index, slot) in slotNodes.enumerated() {
            if slot.contains(localPoint) {
                return index
            }
        }
        return nil
    }

    /// First empty slot index
    var firstEmptySlot: Int? {
        creatureNodes.firstIndex(where: { $0 == nil })
    }

    /// All occupied creature nodes
    var allCreatures: [CreatureNode] {
        creatureNodes.compactMap { $0 }
    }

    /// Count of occupied slots
    var creatureCount: Int {
        allCreatures.count
    }

    // MARK: - Visual States

    /// Highlight a slot as valid drop target
    func highlightSlot(_ index: Int, valid: Bool) {
        guard index >= 0 && index < slotNodes.count else { return }
        let color: UIColor = valid ? SK.Colors.validTarget : SK.Colors.invalidTarget
        slotNodes[index].strokeColor = color
        slotNodes[index].lineWidth = 2.5
    }

    /// Reset slot to default appearance
    func resetSlotHighlight(_ index: Int) {
        guard index >= 0 && index < slotNodes.count else { return }
        slotNodes[index].strokeColor = SK.Board.emptySlotColor
        slotNodes[index].lineWidth = SK.Board.emptySlotBorderWidth
    }

    /// Reset all slots to default
    func resetAllSlotHighlights() {
        for i in 0..<slotNodes.count {
            resetSlotHighlight(i)
        }
    }

    /// Clear all attacker/blocker states
    func clearAllSelectionStates() {
        for creature in allCreatures {
            creature.setAttackState(false)
            creature.clearBlockHoverState()
            creature.setDimmed(false)
            creature.setValidTargetHighlight(false)
        }
    }
}

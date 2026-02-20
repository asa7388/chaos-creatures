// BattleScene.swift
// Chaos Creatures
// Main battlefield SKScene — board layout, card nodes, HUD, phase management.
// The client is a rendering engine — all logic is server-authoritative.
// Source: docs/design/07-ui-ux-specs.md Section 3, docs/design/06-technical-architecture.md

import SpriteKit
import Combine

/// Delegate for BattleScene to communicate with the SwiftUI layer.
protocol BattleSceneDelegate: AnyObject {
    func battleScene(_ scene: BattleScene, didSelectHandCard cardId: String)
    func battleScene(_ scene: BattleScene, didRequestAction action: PlayerAction)
    func battleSceneDidTapAvatar(_ scene: BattleScene, isPlayer: Bool)
}

/// Main battlefield scene. Renders the game state received from the server.
/// Layout (top to bottom):
///   - Opponent avatar + CM bar
///   - Opponent board (5 slots)
///   - Center divider (phase indicator + turn timer)
///   - Player board (5 slots)
///   - Player avatar + CM bar
///   - (Hand is rendered via SwiftUI overlay below)
final class BattleScene: SKScene {

    // MARK: - Delegate

    weak var battleDelegate: BattleSceneDelegate?

    // MARK: - Node References

    private var playerBoard: BoardNode!
    private var opponentBoard: BoardNode!
    private var playerAvatar: AvatarNode!
    private var opponentAvatar: AvatarNode!
    private var playerManaBar: ManaBarNode!
    private var opponentManaBar: ManaBarNode!
    private var phaseIndicator: PhaseIndicatorNode!
    private var turnTimer: TimerNode!
    private var d20Node: SKNode?

    // Blocker assignment visuals
    private var blockerLines: [String: SKShapeNode] = [:]
    private var dragLine: SKShapeNode?
    private var dragStartCreature: CreatureNode?

    // Background
    private var backgroundNode: SKSpriteNode!

    // MARK: - State

    private var stateMachine: BattleStateMachine?
    private var playerFactionColor: UIColor = UIColor(hex: "#C9A84C")
    private var opponentFactionColor: UIColor = UIColor(hex: "#C9A84C")
    private var lastGameState: ClientGameState?
    private var cancellables = Set<AnyCancellable>()

    // Creature node lookup: [instanceId: CreatureNode]
    private var creatureNodes: [String: CreatureNode] = [:]

    // MARK: - Lifecycle

    override func didMove(to view: SKView) {
        backgroundColor = .black
        anchorPoint = CGPoint(x: 0.5, y: 0.5) // Center origin

        setupBackground()
        setupBoards()
        setupAvatars()
        setupManaBars()
        setupCenterDivider()
    }

    override func willMove(from view: SKView) {
        super.willMove(from: view)
        // Clean up all audio when leaving battle
        BattleAudioManager.shared.cleanup()
    }

    // MARK: - Configuration

    /// Configure the scene with a state machine. Called by BattleContainerView.
    func configure(stateMachine: BattleStateMachine) {
        self.stateMachine = stateMachine
        stateMachine.delegate = self

        // Observe state changes
        stateMachine.$currentPhase
            .receive(on: RunLoop.main)
            .sink { [weak self] phase in
                self?.phaseIndicator?.updatePhase(phase)
            }
            .store(in: &cancellables)

        // Start battle music
        BattleAudioManager.shared.startBattleMusic()
    }

    /// Set faction colors for both players
    func setFactionColors(player: UIColor, opponent: UIColor) {
        self.playerFactionColor = player
        self.opponentFactionColor = opponent
        playerManaBar?.setFactionColor(player)
        opponentManaBar?.setFactionColor(opponent)
    }

    /// Set the player's faction for audio theming
    func setPlayerFaction(_ faction: FactionShortName) {
        BattleAudioManager.shared.setFaction(faction)
    }

    // MARK: - Setup

    private func setupBackground() {
        // Dark gradient background
        backgroundNode = SKSpriteNode(color: UIColor(hex: "#0D0D0D"), size: size)
        backgroundNode.zPosition = SK.ZPosition.background
        addChild(backgroundNode)

        // Center line divider
        let divider = SKShapeNode(rectOf: CGSize(width: size.width * 0.85, height: 1))
        divider.fillColor = UIColor.white.withAlphaComponent(0.08)
        divider.strokeColor = .clear
        divider.position = .zero
        divider.zPosition = SK.ZPosition.background + 1
        addChild(divider)
    }

    private func setupBoards() {
        // Player board (bottom half)
        playerBoard = BoardNode(isPlayer: true)
        playerBoard.position = CGPoint(x: 0, y: SK.Board.playerBoardOffsetY)
        playerBoard.zPosition = SK.ZPosition.boardSlots
        addChild(playerBoard)

        // Opponent board (top half)
        opponentBoard = BoardNode(isPlayer: false)
        opponentBoard.position = CGPoint(x: 0, y: SK.Board.opponentBoardOffsetY)
        opponentBoard.zPosition = SK.ZPosition.boardSlots
        addChild(opponentBoard)
    }

    private func setupAvatars() {
        // Player avatar (bottom-left)
        playerAvatar = AvatarNode(isPlayer: true, factionColor: playerFactionColor)
        playerAvatar.position = CGPoint(x: -size.width / 2 + 50, y: SK.Board.playerBoardOffsetY - 60)
        playerAvatar.zPosition = SK.ZPosition.avatars
        addChild(playerAvatar)

        // Opponent avatar (top-right)
        opponentAvatar = AvatarNode(isPlayer: false, factionColor: opponentFactionColor)
        opponentAvatar.position = CGPoint(x: size.width / 2 - 50, y: SK.Board.opponentBoardOffsetY + 60)
        opponentAvatar.zPosition = SK.ZPosition.avatars
        addChild(opponentAvatar)
    }

    private func setupManaBars() {
        // Player CM bar (below player board)
        playerManaBar = ManaBarNode(factionColor: playerFactionColor)
        playerManaBar.position = CGPoint(x: 0, y: SK.Board.playerBoardOffsetY - 60)
        playerManaBar.zPosition = SK.ZPosition.manaBar
        addChild(playerManaBar)

        // Opponent CM bar (above opponent board)
        opponentManaBar = ManaBarNode(factionColor: opponentFactionColor)
        opponentManaBar.position = CGPoint(x: 0, y: SK.Board.opponentBoardOffsetY + 60)
        opponentManaBar.zPosition = SK.ZPosition.manaBar
        addChild(opponentManaBar)
    }

    private func setupCenterDivider() {
        // Phase indicator at center
        phaseIndicator = PhaseIndicatorNode()
        phaseIndicator.position = CGPoint(x: 0, y: 0)
        addChild(phaseIndicator)

        // Turn timer (right of center)
        turnTimer = TimerNode()
        turnTimer.position = CGPoint(x: size.width / 2 - 40, y: 0)
        turnTimer.zPosition = SK.ZPosition.phaseIndicator
        turnTimer.setInactive()
        addChild(turnTimer)
    }

    // MARK: - Full State Update (from server snapshot)

    /// Apply a full game state snapshot from the server.
    /// Called on initial load and reconnect.
    func applyGameState(_ state: ClientGameState) {
        lastGameState = state

        // Update boards
        syncBoard(boardNode: playerBoard, creatures: state.me.board, isPlayer: true)
        syncBoard(boardNode: opponentBoard, creatures: state.opponent.board, isPlayer: false)

        // Update avatars
        playerAvatar.updateInstability(state.me.instability)
        opponentAvatar.updateInstability(state.opponent.instability)

        // Update CM
        playerManaBar.update(filled: state.me.currentMana, total: state.me.manaCap)
        opponentManaBar.update(filled: state.opponent.currentMana, total: state.opponent.manaCap)

        // Update phase indicator
        phaseIndicator.updatePhase(state.phase)

        // Update timer
        if state.phase.isDecisionPhase {
            turnTimer.setVisible()
            turnTimer.start(seconds: state.turnTimerSeconds)
        } else {
            turnTimer.setInactive()
        }

        // Update creature dim states for main phase
        updateCreatureInteractivity(state)

        // Update adaptive music stems based on game state
        BattleAudioManager.shared.updateMusicState(
            playerHp: state.me.currentHp,
            opponentHp: state.opponent.currentHp,
            isMyTurn: state.isMyTurn,
            phase: state.phase,
            lastRollResult: nil
        )
    }

    // Track previous creature stats for stamp animation detection: [instanceId: (atk, hp, maxHp)]
    private var previousCreatureStats: [String: (attack: Int, health: Int, maxHealth: Int)] = [:]

    /// Sync board nodes to match server state
    private func syncBoard(boardNode: BoardNode, creatures: [BattleCreatureData?], isPlayer: Bool) {
        // Remove creatures that are no longer on the board
        let serverIds = Set(creatures.compactMap { $0?.instanceId })
        let existingIds = Set(boardNode.allCreatures.map { $0.creatureId })
        let removedIds = existingIds.subtracting(serverIds)

        for removedId in removedIds {
            if let node = creatureNodes.removeValue(forKey: removedId) {
                node.removeFromParent()
            }
            boardNode.removeCreature(id: removedId)
            previousCreatureStats.removeValue(forKey: removedId)
        }

        // Add or update creatures
        for (slot, creatureData) in creatures.enumerated() {
            if let data = creatureData {
                if let existingNode = creatureNodes[data.instanceId] {
                    // Detect stat changes and play stamp animations
                    let prevStats = previousCreatureStats[data.instanceId]
                    let oldHp = prevStats?.health ?? data.health
                    let oldAtk = prevStats?.attack ?? data.attack

                    // HP change stamp animation
                    if data.health != oldHp {
                        if data.health < oldHp {
                            existingNode.playDamageStamp(newHp: data.health, maxHealth: data.maxHealth)
                        } else {
                            existingNode.playBuffStamp(newHp: data.health, maxHealth: data.maxHealth)
                        }
                    }

                    // ATK change stamp animation
                    if data.attack != oldAtk {
                        if data.attack < oldAtk {
                            existingNode.playAtkDamageStamp(newAtk: data.attack)
                        } else {
                            existingNode.playAtkBuffStamp(newAtk: data.attack)
                        }
                    }

                    // Update stats (updates labels for cases where stamp didn't fire,
                    // and handles badge tint). Stamp animation will override the label text
                    // with its own animated sequence if it fired.
                    if data.health == oldHp && data.attack == oldAtk {
                        // No change — still call updateStats for badge tint consistency
                        existingNode.updateStats(attack: data.attack, health: data.health, maxHealth: data.maxHealth)
                    }

                    existingNode.updateKeywords(data.activeKeywords)
                    if data.shieldActive { existingNode.showShield() } else { existingNode.removeShield() }

                    // Update exhausted/tapped state based on hasAttacked flag
                    existingNode.setExhausted(data.hasAttacked)

                    // Store current stats for next comparison
                    previousCreatureStats[data.instanceId] = (data.attack, data.health, data.maxHealth)
                } else {
                    // Create new creature node
                    let creatureNode = CreatureNode(creature: data, isPlayer: isPlayer)
                    let position = boardNode.positionForSlot(slot)
                    creatureNode.position = position
                    creatureNode.zPosition = SK.ZPosition.creatures
                    boardNode.addChild(creatureNode)
                    boardNode.placeCreature(creatureNode, at: slot)
                    creatureNodes[data.instanceId] = creatureNode

                    // Store initial stats for future change detection
                    previousCreatureStats[data.instanceId] = (data.attack, data.health, data.maxHealth)

                    // Set up Furnace Lords lava pulse for Demonic creatures
                    if creatureNode.isFurnaceLords {
                        creatureNode.setupLavaPulse()
                    }
                }
            }
        }
    }

    /// Update which creatures are interactive / dimmed based on current phase
    private func updateCreatureInteractivity(_ state: ClientGameState) {
        let isMyTurn = state.isMyTurn

        for creature in playerBoard.allCreatures {
            if state.phase == .declareAttackers && isMyTurn {
                // Can select attackers: dim creatures that have already attacked
                if let data = state.me.board.compactMap({ $0 }).first(where: { $0.instanceId == creature.creatureId }) {
                    creature.setDimmed(data.hasAttacked)
                }
            } else {
                creature.setDimmed(false)
            }
        }
    }

    // MARK: - Incremental Event Animations

    /// Animate a card being played to the board
    func animateCardPlayed(_ data: CardPlayedData) {
        // Spells have no slot and no creature data
        guard let slot = data.slot, let creatureData = data.creature else {
            // Spell card — show spell effect
            animateSpellCast(data)
            return
        }

        // Note: Planar Ruins are also placed on the board using CreatureNode.
        // The server sends them with attack=0 and the CreatureNode displays accordingly.
        // Ruins use the same board slots as creatures.

        let isPlayer = (data.player == lastGameState?.mySide)
        let boardNode = isPlayer ? playerBoard! : opponentBoard!
        let factionColor = creatureData.factionPrimaryColor

        // Create creature node
        let creatureNode = CreatureNode(creature: creatureData, isPlayer: isPlayer)
        creatureNode.zPosition = SK.ZPosition.creatures

        // Start from bottom of screen (hand area) if player, or top if opponent
        let startY = isPlayer ? -size.height / 2 - 50 : size.height / 2 + 50
        let startPos = CGPoint(x: 0, y: startY)
        let targetPos = boardNode.positionForSlot(slot)

        creatureNode.position = startPos
        boardNode.addChild(creatureNode)

        // SFX: card play whoosh
        BattleAudioManager.shared.playSFX(.cardPlay, in: self)

        CardPlayAction.fullPlaySequence(
            cardNode: creatureNode,
            from: startPos,
            to: targetPos,
            factionColor: factionColor,
            scene: self
        ) { [weak self] in
            boardNode.placeCreature(creatureNode, at: slot)
            self?.creatureNodes[creatureData.instanceId] = creatureNode

            // Store initial stats for future change detection
            self?.previousCreatureStats[creatureData.instanceId] = (creatureData.attack, creatureData.health, creatureData.maxHealth)

            // Set up Furnace Lords lava pulse for Demonic creatures
            if creatureNode.isFurnaceLords {
                creatureNode.setupLavaPulse()
            }

            // Update CM
            if isPlayer {
                self?.playerManaBar.update(filled: data.manaRemaining, total: self?.lastGameState?.me.manaCap ?? 10)
                self?.playerManaBar.animateSpend(newFilled: data.manaRemaining)
            }

            self?.stateMachine?.animationDidComplete()
        }
    }

    /// Animate a spell being cast (no board placement)
    private func animateSpellCast(_ data: CardPlayedData) {
        let factionColor = data.card.factionPrimaryColor

        // SFX: card play whoosh for spell cast
        BattleAudioManager.shared.playSFX(.cardPlay, in: self)

        // Flash the screen with faction color
        let flash = SKSpriteNode(color: factionColor, size: size)
        flash.position = .zero
        flash.alpha = 0
        flash.zPosition = SK.ZPosition.screenFlash
        addChild(flash)

        flash.run(SKAction.sequence([
            SKAction.fadeAlpha(to: 0.15, duration: 0.1),
            SKAction.fadeAlpha(to: 0, duration: 0.3),
            SKAction.removeFromParent()
        ])) { [weak self] in
            self?.stateMachine?.animationDidComplete()
        }
    }

    /// Animate the D20 chaos roll
    func animateChaosRoll(_ data: ChaosRollData) {
        // Create and position D20 node at center
        let d20 = ChaosRollAction.createD20Node()
        d20.position = .zero
        d20.zPosition = SK.ZPosition.chaosRoll
        d20.alpha = 0
        addChild(d20)
        self.d20Node = d20

        // SFX: chaos roll start
        BattleAudioManager.shared.playSFX(.chaosRollStart, in: self)

        // Fade in
        d20.run(SKAction.fadeIn(withDuration: 0.15)) { [weak self] in
            guard let self = self else { return }

            // Spin and reveal
            ChaosRollAction.spinAndReveal(
                d20Node: d20,
                rollValue: data.roll,
                instability: data.instability,
                result: data.result
            ) {
                // SFX: chaos roll result
                BattleAudioManager.shared.playChaosRollSFX(data.result, in: self)

                // Result particles and flash
                ChaosRollAction.resultParticles(result: data.result, at: .zero, in: self)
                ChaosRollAction.resultFlash(result: data.result, in: self)

                // Fade out D20
                d20.run(SKAction.sequence([
                    SKAction.wait(forDuration: 0.3),
                    SKAction.fadeOut(withDuration: 0.3),
                    SKAction.removeFromParent()
                ])) {
                    self.d20Node = nil
                    self.stateMachine?.animationDidComplete()
                }
            }
        }
    }

    /// Animate an Order/Chaos event
    func animateEventTriggered(_ data: EventTriggeredData) {
        // SFX: event trigger based on type
        let eventSfx: BattleAudioManager.SFX = (data.eventType == .order) ? .eventOrder : .eventChaos
        BattleAudioManager.shared.playSFX(eventSfx, in: self)

        EventSlideAction.showEvent(
            eventName: data.eventName,
            eventType: data.eventType,
            description: data.description,
            in: self
        ) { [weak self] in
            self?.stateMachine?.animationDidComplete()
        }
    }

    /// Animate combat resolution
    func animateCombatResolved(_ data: CombatResolvedData) {
        // Animate blocked pairs sequentially
        animateCombatPairs(data.pairs, index: 0) { [weak self] in
            guard let self = self else { return }

            // Then unblocked attacks (face damage)
            self.animateUnblockedAttacks(data.unblocked, index: 0) {
                // Then deaths
                self.animateDeaths(data.deaths) {
                    self.stateMachine?.animationDidComplete()
                }
            }
        }
    }

    private func animateCombatPairs(_ pairs: [CombatPairResultData], index: Int, completion: @escaping () -> Void) {
        guard index < pairs.count else {
            completion()
            return
        }

        let pair = pairs[index]
        guard let attackerNode = creatureNodes[pair.attackerId],
              let blockerNode = creatureNodes[pair.blockerId] else {
            animateCombatPairs(pairs, index: index + 1, completion: completion)
            return
        }

        // SFX: attack
        BattleAudioManager.shared.playSFX(.attack, in: self)

        // Attacker lunges at blocker
        AttackAction.fullAttackSequence(attacker: attackerNode, target: blockerNode, in: self) { [weak self] in
            guard let self = self else { return }

            // Show damage numbers + SFX
            if pair.attackerDamageDealt > 0 {
                BattleAudioManager.shared.playSFX(.damage, in: self)
                DamageAction.showDamage(pair.attackerDamageDealt, on: blockerNode, in: self, isLethal: pair.blockerDied)
            }
            if pair.blockerDamageDealt > 0 {
                DamageAction.showDamage(pair.blockerDamageDealt, on: attackerNode, in: self, isLethal: pair.attackerDied)
            }

            // Shield breaks + SFX
            if pair.attackerShieldBroke {
                BattleAudioManager.shared.playSFX(.shieldBreak, in: self)
                ShieldBreakAction.playShieldBreak(on: attackerNode, in: self)
            }
            if pair.blockerShieldBroke {
                BattleAudioManager.shared.playSFX(.shieldBreak, in: self)
                ShieldBreakAction.playShieldBreak(on: blockerNode, in: self)
            }

            // Brief pause, then next pair
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.animateCombatPairs(pairs, index: index + 1, completion: completion)
            }
        }
    }

    private func animateUnblockedAttacks(_ unblocked: [UnblockedResultData], index: Int, completion: @escaping () -> Void) {
        guard index < unblocked.count else {
            completion()
            return
        }

        let attack = unblocked[index]
        guard let attackerNode = creatureNodes[attack.attackerId] else {
            animateUnblockedAttacks(unblocked, index: index + 1, completion: completion)
            return
        }

        // Determine which avatar to hit
        let isPlayerAttacker = attackerNode.isPlayerCard
        let targetAvatar = isPlayerAttacker ? opponentAvatar! : playerAvatar!

        // SFX: attack
        BattleAudioManager.shared.playSFX(.attack, in: self)

        AttackAction.faceAttackSequence(attacker: attackerNode, avatarNode: targetAvatar, in: self) { [weak self] in
            guard let self = self else { return }
            BattleAudioManager.shared.playSFX(.damage, in: self)
            DamageAction.showFaceDamage(attack.faceDamage, on: targetAvatar, in: self)

            if attack.lifesteal > 0 {
                BattleAudioManager.shared.playSFX(.heal, in: self)
                let healAvatar = isPlayerAttacker ? self.playerAvatar! : self.opponentAvatar!
                HealAction.showPlayerHeal(attack.lifesteal, on: healAvatar, in: self)
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                self.animateUnblockedAttacks(unblocked, index: index + 1, completion: completion)
            }
        }
    }

    private func animateDeaths(_ deaths: [DeathData], completion: @escaping () -> Void) {
        let deathEntries: [(node: CreatureNode, faction: FactionShortName?)] = deaths.compactMap { death in
            guard let node = creatureNodes[death.creatureId] else { return nil }
            return (node: node, faction: node.factionShortName)
        }

        // SFX: death
        if !deathEntries.isEmpty {
            BattleAudioManager.shared.playSFX(.death, in: self)
        }

        DeathAction.playMultipleDeaths(creatures: deathEntries, in: self) { [weak self] in
            guard let self = self else { return }
            // Clean up references
            for death in deaths {
                self.creatureNodes.removeValue(forKey: death.creatureId)
                self.previousCreatureStats.removeValue(forKey: death.creatureId)
                let board = (death.side == self.lastGameState?.mySide) ? self.playerBoard : self.opponentBoard
                board?.removeCreature(id: death.creatureId)
            }
            completion()
        }
    }

    /// Animate creature death from non-combat sources (spells, events)
    func animateCreatureDestroyed(_ data: CreatureDestroyedData) {
        guard let node = creatureNodes[data.creatureId] else {
            stateMachine?.animationDidComplete()
            return
        }

        // SFX: death
        BattleAudioManager.shared.playSFX(.death, in: self)

        DeathAction.playDeath(creature: node, faction: node.factionShortName, in: self) { [weak self] in
            self?.creatureNodes.removeValue(forKey: data.creatureId)
            self?.previousCreatureStats.removeValue(forKey: data.creatureId)
            let board = (data.player == self?.lastGameState?.mySide) ? self?.playerBoard : self?.opponentBoard
            board?.removeCreature(id: data.creatureId)
            self?.stateMachine?.animationDidComplete()
        }
    }

    /// Animate HP change (from events, spells)
    func animateHpChanged(_ data: HpChangedData) {
        let isPlayer = (data.player == lastGameState?.mySide)
        let avatar = isPlayer ? playerAvatar! : opponentAvatar!
        let delta = data.newHp - data.oldHp

        if delta < 0 {
            BattleAudioManager.shared.playSFX(.damage, in: self)
            DamageAction.showFaceDamage(abs(delta), on: avatar, in: self)
        } else if delta > 0 {
            BattleAudioManager.shared.playSFX(.heal, in: self)
            HealAction.showPlayerHeal(delta, on: avatar, in: self)
        }

        // Delay completion briefly for animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.stateMachine?.animationDidComplete()
        }
    }

    /// Animate instability change
    func animateInstabilityChanged(_ data: InstabilityChangedData) {
        let isPlayer = (data.player == lastGameState?.mySide)
        let avatar = isPlayer ? playerAvatar! : opponentAvatar!
        avatar.updateInstability(data.newInstability)
        stateMachine?.animationDidComplete()
    }

    /// Show timer warning
    func handleTimerWarning(_ data: TimerWarningData) {
        turnTimer.setRemaining(data.secondsRemaining)
        stateMachine?.animationDidComplete()
    }

    /// Handle CM gained
    func animateManaGained(_ data: ManaGainedData) {
        let isPlayer = (data.player == lastGameState?.mySide)
        let manaBar = isPlayer ? playerManaBar! : opponentManaBar!
        manaBar.update(filled: data.currentMana, total: data.manaCap)
        manaBar.animateGain(newFilled: data.currentMana)

        // SFX: CM crystal clink
        BattleAudioManager.shared.playSFX(.manaGain, in: self)

        // CM gain sparkle particles at CM bar position
        let sparkle = ParticleEffects.manaGainSparkle(at: manaBar.position)
        sparkle.zPosition = SK.ZPosition.particles
        addChild(sparkle)
        sparkle.run(SKAction.sequence([
            SKAction.wait(forDuration: 0.4),
            SKAction.removeFromParent()
        ]))

        stateMachine?.animationDidComplete()
    }

    /// Handle turn start banner
    func animateTurnStart(_ data: TurnStartData) {
        let isMyTurn = (data.activePlayer == lastGameState?.mySide)

        // SFX: turn start ping
        BattleAudioManager.shared.playSFX(.turnStart, in: self)

        // Start timer for decision phases
        if isMyTurn {
            turnTimer.setVisible()
            turnTimer.start(seconds: lastGameState?.turnTimerSeconds ?? 60)
        } else {
            turnTimer.setInactive()
        }

        EventSlideAction.showTurnBanner(isMyTurn: isMyTurn, in: self) { [weak self] in
            self?.stateMachine?.animationDidComplete()
        }
    }

    /// Handle match end
    func animateMatchEnd(_ data: MatchEndData) {
        let isVictory = (data.winner == lastGameState?.mySide)

        // SFX: victory or defeat
        BattleAudioManager.shared.playSFX(isVictory ? .victory : .defeat, in: self)

        // Music: game end sting
        BattleAudioManager.shared.playGameEndMusic(isVictory: isVictory)

        EventSlideAction.showGameOverBanner(isVictory: isVictory, in: self) { [weak self] in
            self?.stateMachine?.animationDidComplete()
        }
    }

    // MARK: - Ruin Events

    /// Animate a Planar Ruin being destroyed
    func animateRuinDestroyed(_ data: RuinDestroyedData) {
        guard let node = creatureNodes[data.ruinId] else {
            stateMachine?.animationDidComplete()
            return
        }

        // SFX: death (ruins use the same destruction sound)
        BattleAudioManager.shared.playSFX(.death, in: self)

        // Ruin destruction: crumble/fade effect
        DeathAction.playDeath(creature: node, faction: node.factionShortName, in: self) { [weak self] in
            self?.creatureNodes.removeValue(forKey: data.ruinId)
            self?.previousCreatureStats.removeValue(forKey: data.ruinId)
            let board = (data.player == self?.lastGameState?.mySide) ? self?.playerBoard : self?.opponentBoard
            board?.removeCreature(id: data.ruinId)
            self?.stateMachine?.animationDidComplete()
        }
    }

    /// Animate a Planar Ruin's passive effect triggering
    func animateRuinPassiveEffect(_ data: RuinPassiveEffectData) {
        guard let node = creatureNodes[data.ruinId] else {
            stateMachine?.animationDidComplete()
            return
        }

        // Brief glow pulse on the ruin to indicate its passive activated
        let glowColor: UIColor = SK.Colors.orderBlue
        let pulse = SKAction.sequence([
            SKAction.colorize(with: glowColor, colorBlendFactor: 0.6, duration: 0.2),
            SKAction.colorize(withColorBlendFactor: 0, duration: 0.4)
        ])
        node.run(pulse)

        // Show a small label with the ruin's effect description
        EventSlideAction.showEvent(
            eventName: data.ruinName,
            eventType: .order,
            description: data.effectDescription,
            in: self
        ) { [weak self] in
            self?.stateMachine?.animationDidComplete()
        }
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)

        // Check for creature taps based on current phase
        if let sm = stateMachine {
            switch sm.currentPhase {
            case .declareAttackers where sm.isMyTurn:
                handleAttackerSelection(at: location)

            case .assignBlockers where !sm.isMyTurn:
                handleBlockerDragStart(at: location)

            case .mainPhase where sm.isMyTurn:
                handleMainPhaseTap(at: location)

            default:
                break
            }
        }
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)

        if stateMachine?.currentPhase == .assignBlockers {
            handleBlockerDragMove(at: location)
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)

        if stateMachine?.currentPhase == .assignBlockers {
            handleBlockerDragEnd(at: location)
        }
    }

    // MARK: - Card Selection State

    /// The instance ID of the hand card currently selected for play (set by BattleViewModel)
    private var selectedHandCardForPlay: String?

    /// Called by BattleContainerView when a hand card is selected/deselected.
    /// Highlights empty board slots when a creature/stabilizer card is selected.
    func setSelectedHandCard(_ cardId: String?, needsSlot: Bool) {
        selectedHandCardForPlay = cardId

        // Clear previous slot highlights
        playerBoard.resetAllSlotHighlights()

        // Highlight empty slots if a creature/stabilizer card is selected
        if cardId != nil && needsSlot {
            for i in 0..<SK.Board.slotCount {
                if playerBoard.creatureAt(slot: i) == nil {
                    playerBoard.highlightSlot(i, valid: true)
                }
            }
        }
    }

    // MARK: - Main Phase Tap (card play to board)

    private func handleMainPhaseTap(at location: CGPoint) {
        guard let selectedCardId = selectedHandCardForPlay else { return }

        // Check if the tap is on a player board slot
        let locationInBoard = convert(location, to: playerBoard)
        guard let slot = playerBoard.slotAt(point: locationInBoard) else { return }

        // Check the slot is empty
        guard playerBoard.creatureAt(slot: slot) == nil else { return }

        // Play the selected card to this slot
        playerBoard.resetAllSlotHighlights()
        selectedHandCardForPlay = nil
        battleDelegate?.battleScene(self, didRequestAction:
            .playCard(cardId: selectedCardId, targetSlot: slot, targetId: nil))
    }

    // MARK: - Attacker Selection

    private func handleAttackerSelection(at location: CGPoint) {
        let locationInBoard = convert(location, to: playerBoard)
        guard let slot = playerBoard.slotAt(point: locationInBoard) else { return }

        let creatures = playerBoard.allCreatures
        guard let creature = creatures.first(where: { $0.boardSlot == slot }) else { return }

        // Toggle attacker selection
        stateMachine?.toggleAttacker(creature.creatureId)

        // Update visual
        let isSelected = stateMachine?.selectedAttackerIds.contains(creature.creatureId) ?? false
        creature.setAttackState(isSelected)
    }

    // MARK: - Blocker Assignment (Drag)

    private func handleBlockerDragStart(at location: CGPoint) {
        let locationInBoard = convert(location, to: playerBoard)

        for creature in playerBoard.allCreatures {
            if creature.frame.contains(locationInBoard) {
                dragStartCreature = creature
                creature.setBlockHoverState(true)

                // Create drag line
                dragLine = SKShapeNode()
                dragLine?.strokeColor = SK.Colors.validTarget
                dragLine?.lineWidth = 2
                dragLine?.zPosition = SK.ZPosition.blockLines
                addChild(dragLine!)
                break
            }
        }
    }

    private func handleBlockerDragMove(at location: CGPoint) {
        guard let startCreature = dragStartCreature, let line = dragLine else { return }

        let startPos = convert(startCreature.position, from: playerBoard)
        let path = CGMutablePath()
        path.move(to: startPos)
        path.addLine(to: location)
        line.path = path

        // Check hover over opponent creatures (potential attackers to block)
        let locationInOpponentBoard = convert(location, to: opponentBoard)
        var foundTarget = false
        for creature in opponentBoard.allCreatures {
            if creature.frame.contains(locationInOpponentBoard) {
                creature.setBlockHoverState(true)
                foundTarget = true
                line.strokeColor = SK.Colors.validTarget
            } else {
                creature.clearBlockHoverState()
            }
        }
        if !foundTarget {
            line.strokeColor = SK.Colors.invalidTarget
        }
    }

    private func handleBlockerDragEnd(at location: CGPoint) {
        guard let blocker = dragStartCreature else { return }
        blocker.clearBlockHoverState()

        // Check if dropped on an opponent creature (attacker)
        let locationInOpponentBoard = convert(location, to: opponentBoard)
        var assignedAttacker: CreatureNode?
        for creature in opponentBoard.allCreatures {
            creature.clearBlockHoverState()
            if creature.frame.contains(locationInOpponentBoard) {
                assignedAttacker = creature
            }
        }

        if let attacker = assignedAttacker {
            // Valid blocker assignment
            stateMachine?.assignBlocker(blockerId: blocker.creatureId, to: attacker.creatureId)

            // Draw persistent line
            let lineKey = blocker.creatureId
            blockerLines[lineKey]?.removeFromParent()

            let persistentLine = SKShapeNode()
            let startPos = convert(blocker.position, from: playerBoard)
            let endPos = convert(attacker.position, from: opponentBoard)
            let path = CGMutablePath()
            path.move(to: startPos)
            path.addLine(to: endPos)
            persistentLine.path = path
            persistentLine.strokeColor = SK.Colors.validTarget
            persistentLine.lineWidth = 2
            persistentLine.zPosition = SK.ZPosition.blockLines
            addChild(persistentLine)
            blockerLines[lineKey] = persistentLine
        }

        // Remove drag line
        dragLine?.removeFromParent()
        dragLine = nil
        dragStartCreature = nil
    }

    /// Clear all blocker assignment lines
    func clearBlockerLines() {
        blockerLines.values.forEach { $0.removeFromParent() }
        blockerLines.removeAll()
    }

    // MARK: - Helpers

    /// Find a creature node by instance ID
    func creatureNode(for instanceId: String) -> CreatureNode? {
        creatureNodes[instanceId]
    }

    /// Get position of a board slot in scene coordinates
    func positionForSlot(_ slot: Int, isPlayer: Bool) -> CGPoint {
        let board = isPlayer ? playerBoard! : opponentBoard!
        let localPos = board.positionForSlot(slot)
        return convert(localPos, from: board)
    }
}

// MARK: - BattleStateMachineDelegate

extension BattleScene: BattleStateMachineDelegate {

    func stateMachine(_ sm: BattleStateMachine, didTransitionTo phase: TurnPhase, isMyTurn: Bool) {
        phaseIndicator.updatePhase(phase)

        // Clear blocker lines on phase change
        if phase != .assignBlockers {
            clearBlockerLines()
        }

        // Timer management
        if phase.isDecisionPhase {
            turnTimer.setVisible()
            turnTimer.start(seconds: lastGameState?.turnTimerSeconds ?? 60)
        } else {
            turnTimer.setInactive()
        }
    }

    func stateMachine(_ sm: BattleStateMachine, didReceiveEvent event: ServerEvent) {
        // Handled by animation queue
    }

    func stateMachine(_ sm: BattleStateMachine, didUpdateGameState state: ClientGameState) {
        applyGameState(state)
    }

    func stateMachine(_ sm: BattleStateMachine, animationQueueReady queue: [ServerEvent]) {
        guard let event = queue.first else { return }

        switch event {
        case .turnStart(let data):
            animateTurnStart(data)
        case .chaosRoll(let data):
            animateChaosRoll(data)
        case .eventTriggered(let data):
            animateEventTriggered(data)
        case .cardPlayed(let data):
            animateCardPlayed(data)
        case .combatResolved(let data):
            animateCombatResolved(data)
        case .creatureDestroyed(let data):
            animateCreatureDestroyed(data)
        case .hpChanged(let data):
            animateHpChanged(data)
        case .instabilityChanged(let data):
            animateInstabilityChanged(data)
        case .timerWarning(let data):
            handleTimerWarning(data)
        case .manaGained(let data):
            animateManaGained(data)
        case .matchEnd(let data):
            animateMatchEnd(data)
        case .phaseChanged:
            // Phase changes are visual only — just complete immediately
            sm.animationDidComplete()
        case .cardDrawn:
            // Card draw handled by SwiftUI hand overlay
            sm.animationDidComplete()
        case .attackersDeclared(let data):
            // Highlight declared attackers
            for id in data.attackerIds {
                creatureNodes[id]?.setAttackState(true)
            }
            sm.animationDidComplete()
        case .blockersAssigned(let data):
            // Show blocker lines from server
            for assignment in data.assignments {
                if let blockerNode = creatureNodes[assignment.blockerId],
                   let attackerNode = creatureNodes[assignment.attackerId] {
                    let line = SKShapeNode()
                    let startBoard = blockerNode.isPlayerCard ? playerBoard! : opponentBoard!
                    let endBoard = attackerNode.isPlayerCard ? playerBoard! : opponentBoard!
                    let startPos = convert(blockerNode.position, from: startBoard)
                    let endPos = convert(attackerNode.position, from: endBoard)
                    let path = CGMutablePath()
                    path.move(to: startPos)
                    path.addLine(to: endPos)
                    line.path = path
                    line.strokeColor = SK.Colors.validTarget
                    line.lineWidth = 2
                    line.zPosition = SK.ZPosition.blockLines
                    addChild(line)
                    blockerLines[assignment.blockerId] = line
                }
            }
            sm.animationDidComplete()
        case .ruinDestroyed(let data):
            animateRuinDestroyed(data)
        case .ruinPassiveEffect(let data):
            animateRuinPassiveEffect(data)
        default:
            sm.animationDidComplete()
        }
    }
}

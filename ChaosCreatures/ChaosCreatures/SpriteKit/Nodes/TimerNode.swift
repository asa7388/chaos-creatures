// TimerNode.swift
// Chaos Creatures
// Circular countdown timer for turn decisions.
// Source: docs/design/07-ui-ux-specs.md Section 3.2

import SpriteKit

/// Circular countdown timer displayed during decision phases.
/// Ring drains clockwise; changes from blue to red when urgent.
final class TimerNode: SKNode {

    // MARK: - Properties

    private let backgroundRing: SKShapeNode
    private let progressRing: SKShapeNode
    private let timeLabel: SKLabelNode
    private let radius: CGFloat = 22
    private let ringWidth: CGFloat = 4

    private var totalSeconds: Int = 60
    private var remainingSeconds: Int = 60
    private var isActive: Bool = false
    private var timerAction: SKAction?

    /// Threshold (in seconds) below which the timer turns urgent red
    private let urgentThreshold: Int = 15

    // MARK: - Init

    override init() {
        // Background ring (dark track)
        backgroundRing = SKShapeNode(circleOfRadius: radius)
        backgroundRing.fillColor = .clear
        backgroundRing.strokeColor = SK.Colors.timerInactive
        backgroundRing.lineWidth = ringWidth
        backgroundRing.zPosition = 0

        // Progress ring (fills on top)
        let path = CGMutablePath()
        path.addArc(center: .zero, radius: radius,
                     startAngle: .pi / 2, endAngle: .pi / 2 - .pi * 2,
                     clockwise: true)
        progressRing = SKShapeNode(path: path)
        progressRing.fillColor = .clear
        progressRing.strokeColor = SK.Colors.timerNormal
        progressRing.lineWidth = ringWidth
        progressRing.lineCap = .round
        progressRing.zPosition = 1

        // Time label
        timeLabel = SKLabelNode(fontNamed: SK.Fonts.bold)
        timeLabel.fontSize = 14
        timeLabel.fontColor = .white
        timeLabel.horizontalAlignmentMode = .center
        timeLabel.verticalAlignmentMode = .center
        timeLabel.zPosition = 2

        super.init()
        self.name = "turnTimer"

        addChild(backgroundRing)
        addChild(progressRing)
        addChild(timeLabel)

        updateDisplay()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Control

    /// Start the timer with a given number of seconds
    func start(seconds: Int) {
        stop()
        self.totalSeconds = seconds
        self.remainingSeconds = seconds
        self.isActive = true
        updateDisplay()

        // Tick every second
        let tick = SKAction.sequence([
            SKAction.wait(forDuration: 1.0),
            SKAction.run { [weak self] in
                self?.tick()
            }
        ])
        let timerAction = SKAction.repeatForever(tick)
        run(timerAction, withKey: "timerTick")
    }

    /// Set the remaining time (from server timer warning)
    func setRemaining(_ seconds: Int) {
        self.remainingSeconds = max(0, seconds)
        updateDisplay()
    }

    /// Stop the timer
    func stop() {
        removeAction(forKey: "timerTick")
        removeAction(forKey: "urgentPulse")
        isActive = false
        progressRing.strokeColor = SK.Colors.timerNormal
        timeLabel.fontColor = .white
    }

    /// Hide the timer (non-decision phases)
    func setInactive() {
        stop()
        alpha = 0.3
        timeLabel.text = "--"
    }

    /// Show the timer (decision phases)
    func setVisible() {
        alpha = 1.0
    }

    // MARK: - Private

    private func tick() {
        guard isActive else { return }
        remainingSeconds = max(0, remainingSeconds - 1)
        updateDisplay()

        if remainingSeconds <= 0 {
            stop()
        }
    }

    private func updateDisplay() {
        timeLabel.text = "\(remainingSeconds)"

        // Update progress ring
        let fraction = CGFloat(remainingSeconds) / CGFloat(max(1, totalSeconds))
        let endAngle = (.pi / 2) - (.pi * 2 * fraction)
        let path = CGMutablePath()
        path.addArc(center: .zero, radius: radius,
                     startAngle: .pi / 2, endAngle: endAngle,
                     clockwise: true)
        progressRing.path = path

        // Color based on urgency
        if remainingSeconds <= urgentThreshold && isActive {
            progressRing.strokeColor = SK.Colors.timerUrgent
            timeLabel.fontColor = SK.Colors.timerUrgent

            // Start pulse if not already pulsing
            if action(forKey: "urgentPulse") == nil {
                let pulse = SKAction.sequence([
                    SKAction.scale(to: 1.1, duration: 0.3),
                    SKAction.scale(to: 1.0, duration: 0.3)
                ])
                run(SKAction.repeatForever(pulse), withKey: "urgentPulse")
            }
        } else {
            progressRing.strokeColor = SK.Colors.timerNormal
            timeLabel.fontColor = .white
            removeAction(forKey: "urgentPulse")
        }
    }
}

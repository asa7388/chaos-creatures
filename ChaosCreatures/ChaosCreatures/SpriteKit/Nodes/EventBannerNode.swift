// EventBannerNode.swift
// Chaos Creatures
// Order/Chaos event popup banner (slide in from top, display, slide out).
// Source: docs/design/07-ui-ux-specs.md Section 3.5

import SpriteKit

/// Full-screen event banner that slides in from the top, displays the event,
/// then slides out. Used for Order/Chaos event resolution.
final class EventBannerNode: SKNode {

    // MARK: - Properties

    private let backgroundNode: SKShapeNode
    private let iconNode: SKSpriteNode
    private let titleLabel: SKLabelNode
    private let descriptionLabel: SKLabelNode
    private let borderNode: SKShapeNode
    private let flashNode: SKSpriteNode
    private let storedEventType: EventType

    private var onDismiss: (() -> Void)?

    // MARK: - Init

    init(eventName: String, eventType: EventType, description: String, sceneSize: CGSize) {
        self.storedEventType = eventType
        let bannerSize = SK.EventOverlay.size
        let isOrder = eventType == .order
        let themeColor = isOrder ? SK.Colors.orderBlue : SK.Colors.chaosRed

        // Background panel
        backgroundNode = SKShapeNode(rectOf: bannerSize, cornerRadius: SK.EventOverlay.cornerRadius)
        backgroundNode.fillColor = UIColor(hex: "#0D0D0D").withAlphaComponent(SK.EventOverlay.backgroundAlpha)
        backgroundNode.strokeColor = themeColor
        backgroundNode.lineWidth = SK.EventOverlay.borderWidth
        backgroundNode.zPosition = 1

        // Outer glow border
        borderNode = SKShapeNode(rectOf: CGSize(width: bannerSize.width + 6, height: bannerSize.height + 6),
                                  cornerRadius: SK.EventOverlay.cornerRadius + 3)
        borderNode.fillColor = .clear
        borderNode.strokeColor = themeColor.withAlphaComponent(0.3)
        borderNode.lineWidth = 3
        borderNode.zPosition = 0

        // Event type icon
        let iconColor = isOrder ? UIColor(hex: "#5BC0EB") : UIColor(hex: "#E63946")
        iconNode = SKSpriteNode(color: iconColor, size: CGSize(width: SK.EventOverlay.iconSize, height: SK.EventOverlay.iconSize))
        iconNode.position = CGPoint(x: 0, y: bannerSize.height / 2 - SK.EventOverlay.iconSize / 2 - 20)
        iconNode.zPosition = 2

        // Title
        titleLabel = SKLabelNode(fontNamed: SK.Fonts.heavy)
        titleLabel.fontSize = SK.EventOverlay.titleFontSize
        titleLabel.fontColor = themeColor
        titleLabel.horizontalAlignmentMode = .center
        titleLabel.verticalAlignmentMode = .center
        titleLabel.position = CGPoint(x: 0, y: 10)
        titleLabel.zPosition = 2
        titleLabel.text = eventName

        // Description (multi-line via line breaks)
        descriptionLabel = SKLabelNode(fontNamed: SK.Fonts.regular)
        descriptionLabel.fontSize = SK.EventOverlay.descriptionFontSize
        descriptionLabel.fontColor = UIColor(hex: "#F0EAD6").withAlphaComponent(0.85)
        descriptionLabel.horizontalAlignmentMode = .center
        descriptionLabel.verticalAlignmentMode = .top
        descriptionLabel.position = CGPoint(x: 0, y: -10)
        descriptionLabel.zPosition = 2
        descriptionLabel.numberOfLines = 3
        descriptionLabel.preferredMaxLayoutWidth = bannerSize.width - 30
        descriptionLabel.text = description

        // Full-screen flash overlay
        flashNode = SKSpriteNode(color: themeColor, size: sceneSize)
        flashNode.alpha = 0
        flashNode.zPosition = -1

        super.init()
        self.name = "eventBanner"
        self.zPosition = SK.ZPosition.eventBanner
        self.alpha = 0
        self.isUserInteractionEnabled = true

        addChild(borderNode)
        addChild(backgroundNode)
        addChild(iconNode)
        addChild(titleLabel)
        addChild(descriptionLabel)
        addChild(flashNode)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        // Tap to dismiss the event banner early
        dismiss()
    }

    // MARK: - Presentation

    /// Show the banner with slide-in animation, hold, then slide out and remove.
    func present(in scene: SKScene, completion: (() -> Void)? = nil) {
        self.onDismiss = completion
        self.position = CGPoint(x: scene.size.width / 2, y: scene.size.height / 2 + scene.size.height)
        scene.addChild(self)

        // Full-screen color flash
        let flash = SKAction.sequence([
            SKAction.fadeAlpha(to: 0.15, duration: 0.1),
            SKAction.fadeAlpha(to: 0, duration: 0.3)
        ])

        // Slide in from top
        let targetY = scene.size.height / 2
        let slideIn = SKAction.moveTo(y: targetY, duration: SK.Duration.eventOverlayFade)
        slideIn.timingMode = .easeOut
        let fadeIn = SKAction.fadeIn(withDuration: SK.Duration.eventOverlayFade)

        // Hold
        let hold = SKAction.wait(forDuration: SK.Duration.eventOverlayHold)

        // Slide out to top
        let slideOut = SKAction.moveTo(y: scene.size.height + SK.EventOverlay.size.height, duration: SK.Duration.eventOverlayFade)
        slideOut.timingMode = .easeIn
        let fadeOut = SKAction.fadeOut(withDuration: SK.Duration.eventOverlayFade)

        let sequence = SKAction.sequence([
            SKAction.group([slideIn, fadeIn]),
            hold,
            SKAction.group([slideOut, fadeOut]),
            SKAction.removeFromParent()
        ])

        flashNode.run(flash)
        run(sequence) { [weak self] in
            self?.onDismiss?()
        }

        // Add chaos/order energy particles at banner center after slide-in
        let centerPos = CGPoint(x: scene.size.width / 2, y: targetY)
        let eventType = self.storedEventType
        DispatchQueue.main.asyncAfter(deadline: .now() + SK.Duration.eventOverlayFade) {
            let emitter: SKEmitterNode
            switch eventType {
            case .order:
                emitter = ParticleEffects.orderEnergyCrystallize(at: centerPos)
            case .chaos:
                emitter = ParticleEffects.chaosEnergySwirl(at: centerPos)
            }
            emitter.zPosition = SK.ZPosition.particles
            scene.addChild(emitter)
            emitter.run(SKAction.sequence([
                SKAction.wait(forDuration: 1.5),
                SKAction.removeFromParent()
            ]))
        }
    }

    /// Immediately dismiss without waiting for hold
    func dismiss() {
        removeAllActions()
        let fadeOut = SKAction.fadeOut(withDuration: 0.2)
        run(SKAction.sequence([fadeOut, SKAction.removeFromParent()])) { [weak self] in
            self?.onDismiss?()
        }
    }
}

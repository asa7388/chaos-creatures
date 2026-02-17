// SpriteKitConstants.swift
// Chaos Creatures
// Layout constants, z-positions, animation durations for SpriteKit.
// Source: docs/design/07-ui-ux-specs.md Section 3

import CoreGraphics
import UIKit

enum SK {

    // MARK: - Z-Positions (back to front)
    // Source: docs/design/06-technical-architecture.md Section 2.3

    enum ZPosition {
        static let background: CGFloat = 0
        static let boardSlots: CGFloat = 10
        static let creatures: CGFloat = 20
        static let avatars: CGFloat = 30
        static let manaBar: CGFloat = 40
        static let handCards: CGFloat = 50
        static let phaseIndicator: CGFloat = 60
        static let damageNumbers: CGFloat = 70
        static let eventBanner: CGFloat = 80
        static let chaosRoll: CGFloat = 90
        static let uiButtons: CGFloat = 100
        static let blockLines: CGFloat = 65
        static let particles: CGFloat = 99
        static let screenFlash: CGFloat = 200
    }

    // MARK: - Board Layout

    enum Board {
        /// Number of creature slots per player
        static let slotCount: Int = 5

        /// Card slot dimensions (64x90pt per doc 07)
        static let slotSize = CGSize(width: 64, height: 90)

        /// Spacing between card slots
        static let slotSpacing: CGFloat = 8

        /// Total board width for all slots
        static var totalWidth: CGFloat {
            CGFloat(slotCount) * slotSize.width + CGFloat(slotCount - 1) * slotSpacing
        }

        /// Vertical offset for opponent board from center
        static let opponentBoardOffsetY: CGFloat = 120

        /// Vertical offset for player board from center
        static let playerBoardOffsetY: CGFloat = -120

        /// Empty slot border color
        static let emptySlotColor = UIColor(hex: "#2A2A2A")

        /// Empty slot border width
        static let emptySlotBorderWidth: CGFloat = 1.5

        /// Empty slot corner radius
        static let slotCornerRadius: CGFloat = 6
    }

    // MARK: - Card Rendering

    enum Card {
        /// Hand card size (90x130pt per doc 07)
        static let handSize = CGSize(width: 90, height: 130)

        /// Board card size (same as slot size)
        static let boardSize = Board.slotSize

        /// Art takes top 60% of card
        static let artRatio: CGFloat = 0.6

        /// Stats bar takes bottom 25%
        static let statsBarRatio: CGFloat = 0.25

        /// ATK/HP label font size on board cards
        static let statsFontSize: CGFloat = 14

        /// Name label font size
        static let nameFontSize: CGFloat = 10

        /// Keyword icon size
        static let keywordIconSize: CGFloat = 12

        /// Max keyword icons displayed
        static let maxKeywordIcons: Int = 3

        /// Tier badge size
        static let tierBadgeSize: CGFloat = 10

        /// Mana cost badge size
        static let manaCostBadgeSize: CGFloat = 16
    }

    // MARK: - D20 Node

    enum D20 {
        /// Diameter of the D20 polygon
        static let diameter: CGFloat = 80

        /// Fill color
        static let fillColor = UIColor(hex: "#1A1A1A")

        /// Stroke color
        static let strokeColor = UIColor.white

        /// Stroke width
        static let strokeWidth: CGFloat = 2

        /// Number label font size
        static let numberFontSize: CGFloat = 28

        /// Order result color
        static let orderColor = UIColor(hex: "#5BC0EB")

        /// Chaos result color
        static let chaosColor = UIColor(hex: "#E63946")

        /// Nothing result color
        static let nothingColor = UIColor(hex: "#888888")
    }

    // MARK: - Animation Durations

    enum Duration {
        /// Card play: hand to board (0.45s)
        static let cardPlay: TimeInterval = 0.45

        /// Attack lunge (0.6s)
        static let attack: TimeInterval = 0.6

        /// Damage number float (0.8s)
        static let damageFloat: TimeInterval = 0.8

        /// Death animation (0.5s card + 1.2s particles)
        static let death: TimeInterval = 0.5
        static let deathParticles: TimeInterval = 1.2

        /// Chaos roll spin (base 1.5s + instability bonus)
        static let chaosRollBase: TimeInterval = 1.5

        /// Event overlay hold time (2.5s)
        static let eventOverlayHold: TimeInterval = 2.5

        /// Event overlay fade in/out
        static let eventOverlayFade: TimeInterval = 0.3

        /// Shield break (0.3s)
        static let shieldBreak: TimeInterval = 0.3

        /// Heal float (0.8s)
        static let healFloat: TimeInterval = 0.8

        /// Phase indicator transition
        static let phaseTransition: TimeInterval = 0.15

        /// Attacker glow in
        static let attackerGlowIn: TimeInterval = 0.2

        /// Blocker snap back
        static let blockerSnapBack: TimeInterval = 0.25

        /// Evolution reveal minimum
        static let evolutionRevealMin: TimeInterval = 2.5

        /// Spell cast center + hold
        static let spellCast: TimeInterval = 0.6

        /// Graveyard thumbnail fly
        static let graveyardFly: TimeInterval = 0.5
    }

    // MARK: - Event Overlay

    enum EventOverlay {
        static let size = CGSize(width: 280, height: 180)
        static let cornerRadius: CGFloat = 12
        static let backgroundAlpha: CGFloat = 0.96
        static let iconSize: CGFloat = 40
        static let titleFontSize: CGFloat = 18
        static let descriptionFontSize: CGFloat = 13
        static let borderWidth: CGFloat = 1.5
    }

    // MARK: - Battle Log Overlay

    enum BattleLog {
        static let panelWidth: CGFloat = 280
        static let backgroundColor = UIColor(hex: "#141414")
        static let entryFontSize: CGFloat = 12
    }

    // MARK: - Colors

    enum Colors {
        static let background = UIColor.black
        static let surface = UIColor(hex: "#141414")
        static let surfaceLight = UIColor(hex: "#1A1A1A")
        static let surfaceMid = UIColor(hex: "#2A2A2A")

        static let attackerGlow = UIColor(hex: "#E63946")
        static let validTarget = UIColor(hex: "#4CAF50")
        static let invalidTarget = UIColor(hex: "#F44336")
        static let tauntGold = UIColor(hex: "#FFD700")

        static let orderBlue = UIColor(hex: "#5BC0EB")
        static let chaosRed = UIColor(hex: "#E63946")
        static let healGreen = UIColor(hex: "#4CAF50")
        static let damageRed = UIColor(hex: "#F44336")
        static let lethalDamage = UIColor(hex: "#FF0000")

        static let manaFilled = UIColor(hex: "#4A90E2")
        static let manaEmpty = UIColor(hex: "#2A2A2A")

        static let timerNormal = UIColor(hex: "#4A90E2")
        static let timerUrgent = UIColor(hex: "#E63946")
        static let timerInactive = UIColor(hex: "#3A3A3A")
    }

    // MARK: - Fonts

    enum Fonts {
        static let bold = "AvenirNext-Bold"
        static let heavy = "AvenirNext-Heavy"
        static let medium = "AvenirNext-Medium"
        static let regular = "AvenirNext-Regular"
    }
}

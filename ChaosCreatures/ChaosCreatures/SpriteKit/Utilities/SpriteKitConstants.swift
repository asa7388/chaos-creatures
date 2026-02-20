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

        // MARK: Full-Art Layout

        /// Unified text panel occupies the bottom 28% of the card (hand cards only)
        static let textPanelRatio: CGFloat = 0.28

        /// Text panel background opacity
        static let textPanelAlpha: CGFloat = 0.78

        /// Corner radius for the text panel
        static let textPanelCornerRadius: CGFloat = 0

        // MARK: Circular Badge Radii

        /// CM cost badge radius on board cards (14pt diameter)
        static let boardCMBadgeRadius: CGFloat = 7

        /// CM cost badge radius on hand cards (18pt diameter)
        static let handCMBadgeRadius: CGFloat = 9

        /// ATK/HP stat badge radius on board cards (12pt diameter)
        static let boardStatBadgeRadius: CGFloat = 6

        /// ATK/HP stat badge radius on hand cards (16pt diameter)
        static let handStatBadgeRadius: CGFloat = 8

        // MARK: Font Sizes — Board (64x90pt)

        /// Name label font size on board cards (removed from board but kept for reference)
        static let boardNameFontSize: CGFloat = 7

        /// ATK/HP stat font size on board cards
        static let boardStatFontSize: CGFloat = 9

        /// CM cost font size on board cards
        static let boardManaCostFontSize: CGFloat = 8

        /// CM cost font size for circular badge on board
        static let boardCMFontSize: CGFloat = 8

        // MARK: Font Sizes — Hand (90x130pt)

        /// Name label font size on hand cards
        static let handNameFontSize: CGFloat = 9

        /// ATK/HP stat font size on hand cards
        static let handStatFontSize: CGFloat = 11

        /// CM cost font size on hand cards
        static let handManaCostFontSize: CGFloat = 10

        /// CM cost font size for circular badge in hand
        static let handCMFontSize: CGFloat = 10

        // MARK: Stat Icon Sizes (legacy — replaced by badge radii)

        /// Stat icon size (sword-atk, heart-hp) on board cards
        static let boardStatIconSize: CGFloat = 8

        /// Stat icon size on hand cards
        static let handStatIconSize: CGFloat = 10

        // MARK: CM Cost Badge (legacy square badge sizes)

        /// CM cost badge diameter on board cards
        static let boardManaBadgeSize: CGFloat = 14

        /// CM cost badge diameter on hand cards
        static let handManaBadgeSize: CGFloat = 18

        /// Chaos-motes icon size inside CM badge on board cards
        static let boardManaIconSize: CGFloat = 10

        /// Chaos-motes icon size inside CM badge on hand cards
        static let handManaIconSize: CGFloat = 13

        // MARK: Keyword Icons

        /// Keyword icon size (legacy sprite-based icons — hand cards now use dots)
        static let keywordIconSize: CGFloat = 12

        /// Keyword dot radius for hand cards (6pt diameter)
        static let keywordDotRadius: CGFloat = 3

        /// Max keyword icons/dots displayed
        static let maxKeywordIcons: Int = 3

        // MARK: Legacy (kept for compatibility)

        /// Art fills 100% of card (full-bleed design)
        static let artRatio: CGFloat = 1.0

        /// Stats bar takes bottom 25% (legacy — replaced by textPanelRatio)
        static let statsBarRatio: CGFloat = 0.25

        /// ATK/HP label font size on board cards (legacy)
        static let statsFontSize: CGFloat = 14

        /// Name label font size (legacy)
        static let nameFontSize: CGFloat = 10

        /// Tier badge size
        static let tierBadgeSize: CGFloat = 10

        /// CM cost badge size (legacy)
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
    // Cinzel for card names/headers, Alegreya for body/flavor, Bebas Neue for stat numbers,
    // Fira Sans for UI labels. PostScript names from font files registered via Info.plist.

    enum Fonts {
        /// Card names, titles — Cinzel Bold
        static let bold = CardFont.spriteKitCardName        // "Cinzel-Bold"
        /// Large display text — Cinzel Bold (heaviest available via PS name)
        static let heavy = CardFont.spriteKitCardName       // "Cinzel-Bold"
        /// Stats, emphasized body — Alegreya Bold
        static let medium = CardFont.spriteKitStats         // "Alegreya-Bold"
        /// Body text, descriptions — Alegreya Regular
        static let regular = CardFont.spriteKitBody         // "Alegreya-Regular"
        /// Stat numerals (ATK/HP/CM/damage numbers) — Bebas Neue
        static let statNumber = CardFont.spriteKitStatNumber // "BebasNeue-Regular"
        /// UI labels — Fira Sans Regular
        static let uiLabel = CardFont.spriteKitUILabel       // "FiraSans-Regular"
        /// Emphasized UI labels — Fira Sans SemiBold
        static let uiLabelBold = CardFont.spriteKitUILabelBold // "FiraSans-SemiBold"
    }

    // MARK: - Card Frame Asset Names

    enum CardFrames {
        /// Asset name for a card frame by faction and rarity.
        /// Format: "CardFrames/{faction}-{rarity}" e.g. "CardFrames/ironwright-common"
        static func assetName(faction: FactionShortName, tier: EvolutionTier) -> String {
            let factionKey: String
            switch faction {
            case .ironwright: factionKey = "ironwright"
            case .feyCourts: factionKey = "fey"
            case .demonicKingdoms: factionKey = "demonic"
            case .celestialCrusade: factionKey = "celestial"
            case .theEndless: factionKey = "endless"
            }
            let tierKey: String
            switch tier {
            case .common, .uncommon: tierKey = "common"
            case .rare: tierKey = "rare"
            case .epic, .legendary: tierKey = "legendary"
            }
            return "CardFrames/\(factionKey)-\(tierKey)"
        }

        /// Spell card frame asset name
        static let spell = "CardFrames/spell"

        /// Stabilizer card frame asset name
        static let stabilizer = "CardFrames/stabilizer"
    }

    // MARK: - Keyword Icon Asset Names

    enum KeywordIcons {
        /// Asset name for a keyword icon: "KeywordIcons/{keyword}"
        static func assetName(keyword: Keyword) -> String {
            let key: String
            switch keyword {
            case .shield: key = "shield"
            case .lifesteal: key = "lifesteal"
            case .flying: key = "flying"
            case .reach: key = "reach"
            case .deathtouch: key = "deathtouch"
            case .taunt: key = "taunt"
            case .piercing: key = "piercing"
            case .haste: key = "haste"
            case .ward: key = "ward"
            }
            return "KeywordIcons/\(key)"
        }
    }

    // MARK: - Faction Emblem Asset Names

    enum FactionEmblems {
        static func assetName(faction: FactionShortName) -> String {
            let key: String
            switch faction {
            case .ironwright: key = "ironwright"
            case .feyCourts: key = "fey"
            case .demonicKingdoms: key = "demonic"
            case .celestialCrusade: key = "celestial"
            case .theEndless: key = "endless"
            }
            return "FactionEmblems/\(key)"
        }
    }

    // MARK: - Card Back Asset Names

    enum CardBacks {
        static let universal = "CardBacks/card-back-universal"

        static func factionBack(faction: FactionShortName) -> String {
            let key: String
            switch faction {
            case .ironwright: key = "ironwright"
            case .feyCourts: key = "fey"
            case .demonicKingdoms: key = "demonic"
            case .celestialCrusade: key = "celestial"
            case .theEndless: key = "endless"
            }
            return "CardBacks/card-back-\(key)"
        }
    }

    // MARK: - Rarity Effects

    enum RarityEffects {
        /// Uncommon: subtle metallic sheen overlay
        static let uncommonOverlayAlpha: CGFloat = 0.08
        static let uncommonSheenDuration: TimeInterval = 2.0
        static let uncommonSheenColor = UIColor(hex: "#C0C0C0") // Silver

        /// Rare: energy glow pulse
        static let rareGlowColor = UIColor(hex: "#2196F3")  // Blue
        static let rareGlowAlphaMin: CGFloat = 0.15
        static let rareGlowAlphaMax: CGFloat = 0.4
        static let rareGlowPulseDuration: TimeInterval = 1.2

        /// Epic: purple shimmer
        static let epicShimmerColor = UIColor(hex: "#9C27B0")
        static let epicShimmerAlphaMin: CGFloat = 0.1
        static let epicShimmerAlphaMax: CGFloat = 0.35
        static let epicShimmerDuration: TimeInterval = 1.5

        /// Legendary: gold prismatic + particle sparkles
        static let legendaryGlowColor = UIColor(hex: "#FF9800")
        static let legendaryParticleColor = UIColor(hex: "#FFD700")
        static let legendaryGlowAlphaMin: CGFloat = 0.2
        static let legendaryGlowAlphaMax: CGFloat = 0.5
        static let legendaryGlowDuration: TimeInterval = 1.0
        static let legendaryParticleBirthRate: CGFloat = 8

        // MARK: Rarity Background Glow (full-art cards)
        /// Colored glow behind the card based on rarity tier.
        /// Used as a slightly-oversized SKSpriteNode behind the card.

        static let glowOversize: CGFloat = 6  // pt larger per side than card
        static let glowAlpha: CGFloat = 0.45
        static let glowPulseDuration: TimeInterval = 1.5

        /// Color per tier for the background glow
        static func glowColor(for tier: EvolutionTier) -> UIColor? {
            switch tier {
            case .common: return nil  // no glow
            case .uncommon: return UIColor(hex: "#C0C0C0")  // silver
            case .rare: return UIColor(hex: "#2196F3")       // blue
            case .epic: return UIColor(hex: "#9C27B0")       // purple
            case .legendary: return UIColor(hex: "#FFD700")  // gold
            }
        }
    }

    // MARK: - Card Flip Animation

    enum CardFlip {
        static let totalDuration: TimeInterval = 0.4
        static let halfDuration: TimeInterval = 0.2
    }

    // MARK: - Card Texture Assets

    /// Maps factions to their primary border and text panel texture asset names.
    /// Since sub-faction data is not available during battle, each faction maps to
    /// its primary sub-faction texture (e.g. feyCourts -> fey-verdant).
    enum CardTextures {
        /// Faction-specific border texture asset name from CardTextures/ in Assets.xcassets.
        static func borderAssetName(faction: FactionShortName?) -> String {
            guard let faction = faction else { return "CardTextures/border-ironwright" }
            switch faction {
            case .ironwright: return "CardTextures/border-ironwright"
            case .feyCourts: return "CardTextures/border-fey-verdant"
            case .demonicKingdoms: return "CardTextures/border-demonic-furnace"
            case .celestialCrusade: return "CardTextures/border-celestial-knights"
            case .theEndless: return "CardTextures/border-endless-cabals"
            }
        }

        /// Faction-specific text panel texture asset name from TextPanels/ in Assets.xcassets.
        static func textPanelAssetName(faction: FactionShortName?) -> String {
            guard let faction = faction else { return "TextPanels/tp-ironwright" }
            switch faction {
            case .ironwright: return "TextPanels/tp-ironwright"
            case .feyCourts: return "TextPanels/tp-fey-verdant"
            case .demonicKingdoms: return "TextPanels/tp-demonic-furnace"
            case .celestialCrusade: return "TextPanels/tp-celestial-knights"
            case .theEndless: return "TextPanels/tp-endless-cabals"
            }
        }

        /// Faction-specific ATK icon asset name.
        static func atkIconName(faction: FactionShortName?) -> String {
            guard let faction = faction else { return "StatIcons/sword-atk" }
            switch faction {
            case .ironwright: return "StatIcons/atk-ironwright"
            case .feyCourts: return "StatIcons/atk-feyVerdant"
            case .demonicKingdoms: return "StatIcons/atk-demonicFurnace"
            case .celestialCrusade: return "StatIcons/atk-celestialKnights"
            case .theEndless: return "StatIcons/atk-endlessCabals"
            }
        }

        /// Faction-specific HP icon asset name.
        static func hpIconName(faction: FactionShortName?) -> String {
            guard let faction = faction else { return "StatIcons/heart-hp" }
            switch faction {
            case .ironwright: return "StatIcons/hp-ironwright"
            case .feyCourts: return "StatIcons/hp-feyVerdant"
            case .demonicKingdoms: return "StatIcons/hp-demonicFurnace"
            case .celestialCrusade: return "StatIcons/hp-celestialKnights"
            case .theEndless: return "StatIcons/hp-endlessCabals"
            }
        }

        /// Faction-specific CM (chaos mote) icon asset name.
        static func cmIconName(faction: FactionShortName?) -> String {
            guard let faction = faction else { return "StatIcons/chaos-motes" }
            switch faction {
            case .ironwright: return "StatIcons/chaos-mote-ironwright"
            case .feyCourts: return "StatIcons/chaos-mote-feyVerdant"
            case .demonicKingdoms: return "StatIcons/chaos-mote-demonicFurnace"
            case .celestialCrusade: return "StatIcons/chaos-mote-celestialKnights"
            case .theEndless: return "StatIcons/chaos-mote-endlessCabals"
            }
        }

        /// Canvas weave overlay texture
        static let canvasWeave = "CardTextures/tex-canvas-weave"

        /// Wax seal bronze texture for medallion stat badges
        static let waxSealBronze = "CardTextures/wax-seal-bronze"

        // MARK: Medallion Badge Colors

        /// CM badge tint color (deep blue)
        static let cmTintColor = UIColor(hex: "#0D47A1")
        /// ATK badge tint color (deep orange)
        static let atkTintColor = UIColor(hex: "#BF360C")
        /// HP badge tint color (deep green)
        static let hpTintColor = UIColor(hex: "#1B5E20")

        /// Parchment text color for medallion numbers
        static let parchmentText = UIColor(hex: "#F0E6D2")
        /// Dark brown for medallion rim gradient start
        static let rimLight = UIColor(hex: "#8B7355")
        /// Very dark brown for medallion rim gradient end
        static let rimDark = UIColor(hex: "#2A1F0F")
        /// Inner highlight on medallion rim
        static let rimHighlight = UIColor(hex: "#D4B896")
    }
}

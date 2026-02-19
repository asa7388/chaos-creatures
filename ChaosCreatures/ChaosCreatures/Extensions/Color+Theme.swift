// Color+Theme.swift
// Chaos Creatures
// Faction color palettes and app-wide theme colors.
// Source: docs/design/07-ui-ux-specs.md

import SwiftUI
import UIKit

// MARK: - Faction Colors

extension Color {
    // Ironwright Collective -- steampunk brass/industrial
    static let ironwright = Color(hex: "#C9A84C")
    static let ironwrightDark = Color(hex: "#8B6914")
    static let ironwrightAccent = Color(hex: "#D4AF37")

    // Fey Courts -- ethereal green/nature
    static let feyCourts = Color(hex: "#4CAF50")
    static let feyCourtsDark = Color(hex: "#2E7D32")
    static let feyCourtsAccent = Color(hex: "#81C784")

    // Demonic Kingdoms -- hellfire red
    static let demonic = Color(hex: "#E63946")
    static let demonicDark = Color(hex: "#B71C1C")
    static let demonicAccent = Color(hex: "#FF5252")

    // MARK: - UI Theme Colors

    static let bgPrimary = Color(hex: "#0D0D0D")
    static let bgSecondary = Color(hex: "#141414")
    static let bgTertiary = Color(hex: "#1A1A1A")
    static let bgQuaternary = Color(hex: "#2A2A2A")
    static let bgElevated = Color(hex: "#3A3A3A")

    static let textPrimary = Color.white
    static let textSecondary = Color(hex: "#AAAAAA")
    static let textTertiary = Color(hex: "#888888")
    static let textDisabled = Color(hex: "#555555")

    // Battle HUD
    static let orderBlue = Color(hex: "#5BC0EB")
    static let chaosRed = Color(hex: "#E63946")
    static let healGreen = Color(hex: "#4CAF50")
    static let warningYellow = Color(hex: "#FFC107")
    static let damageOrange = Color(hex: "#FF7043")
    static let timerBlue = Color(hex: "#4A90E2")
    static let tauntGold = Color(hex: "#FFD700")
    static let validGreen = Color(hex: "#4CAF50")
    static let invalidRed = Color(hex: "#F44336")

    // Rarity colors
    static let rarityCommon = Color(hex: "#9E9E9E")
    static let rarityUncommon = Color(hex: "#4CAF50")
    static let rarityRare = Color(hex: "#2196F3")
    static let rarityEpic = Color(hex: "#9C27B0")
    static let rarityLegendary = Color(hex: "#FF9800")

    // Borders
    static let borderDefault = Color(hex: "#3A3A3A")
    static let borderActive = Color(hex: "#4A90E2")

    // MARK: - Hex Initializer

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    // MARK: - Helpers

    static func tierColor(_ tier: EvolutionTier) -> Color {
        switch tier {
        case .common: return .rarityCommon
        case .uncommon: return .rarityUncommon
        case .rare: return .rarityRare
        case .epic: return .rarityEpic
        case .legendary: return .rarityLegendary
        }
    }

    static func factionPrimary(_ faction: FactionShortName) -> Color {
        switch faction {
        case .ironwright: return .ironwright
        case .feyCourts: return .feyCourts
        case .demonicKingdoms: return .demonic
        case .celestialCrusade: return Color(hex: "#DAA520")
        case .theEndless: return Color(hex: "#6B3FA0")
        }
    }

    static func rankColor(_ rank: SeasonRank) -> Color {
        switch rank {
        case .bronze3, .bronze2, .bronze1:
            return Color(hex: "#CD7F32")
        case .silver3, .silver2, .silver1:
            return Color(hex: "#C0C0C0")
        case .gold3, .gold2, .gold1:
            return Color(hex: "#FFD700")
        case .platinum3, .platinum2, .platinum1:
            return Color(hex: "#E5E4E2")
        case .diamond3, .diamond2, .diamond1:
            return Color(hex: "#B9F2FF")
        case .master:
            return Color(hex: "#9C27B0")
        case .grandmaster:
            return Color(hex: "#FF4500")
        }
    }
}

// MARK: - UIColor Hex Extension (for SpriteKit)

extension UIColor {
    convenience init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            red: CGFloat(r) / 255,
            green: CGFloat(g) / 255,
            blue: CGFloat(b) / 255,
            alpha: CGFloat(a) / 255
        )
    }
}

// MARK: - FactionShortName UIKit Extensions (for SpriteKit)

extension FactionShortName {
    var primaryUIColor: UIColor {
        switch self {
        case .ironwright: return UIColor(hex: "#C9A84C")
        case .feyCourts: return UIColor(hex: "#4CAF50")
        case .demonicKingdoms: return UIColor(hex: "#E63946")
        case .celestialCrusade: return UIColor(hex: "#DAA520")
        case .theEndless: return UIColor(hex: "#6B3FA0")
        }
    }

    var accentUIColor: UIColor {
        switch self {
        case .ironwright: return UIColor(hex: "#D4AF37")
        case .feyCourts: return UIColor(hex: "#81C784")
        case .demonicKingdoms: return UIColor(hex: "#FF5252")
        case .celestialCrusade: return UIColor(hex: "#F5F0E1")
        case .theEndless: return UIColor(hex: "#E8DCC8")
        }
    }

    var swiftUIColor: Color {
        switch self {
        case .ironwright: return .ironwright
        case .feyCourts: return .feyCourts
        case .demonicKingdoms: return .demonic
        case .celestialCrusade: return Color(hex: "#DAA520")
        case .theEndless: return Color(hex: "#6B3FA0")
        }
    }
}

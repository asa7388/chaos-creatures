// Color+Theme.swift
// Chaos Creatures
// Faction color palettes and app-wide theme colors.
// Source: docs/design/07-ui-ux-specs.md

import SwiftUI
import UIKit

// MARK: - Faction Colors

extension Color {
    // Ironwright Collective -- brutalist space-industrial
    static let ironwright = Color(hex: "#6B7B8D")          // Steel Blue-Gray
    static let ironwrightDark = Color(hex: "#4A5568")      // Cold Iron
    static let ironwrightAccent = Color(hex: "#E07020")    // Warning Orange
    static let ironwrightHighlight = Color(hex: "#3B82C4") // Reactor Blue
    static let ironwrightFrameTint = Color(hex: "#3D4654") // Iron Plate (text panel overlay)

    // Fey Courts -- living forest
    static let feyCourts = Color(hex: "#2E8B57")           // Emerald
    static let feyCourtsDark = Color(hex: "#8B4513")       // Bark Brown
    static let feyCourtsAccent = Color(hex: "#7FFFD4")     // Bioluminescent
    static let feyCourtsHighlight = Color(hex: "#B8860B")  // Forest Gold
    static let feyCourtsFrameTint = Color(hex: "#1A3A1A")  // Forest Shadow (text panel overlay)

    // Demonic Kingdoms -- volcanic infernal
    static let demonic = Color(hex: "#8B2252")             // Blood Red
    static let demonicDark = Color(hex: "#1A0A0A")         // Obsidian Black
    static let demonicAccent = Color(hex: "#FF4500")       // Volcanic Orange
    static let demonicHighlight = Color(hex: "#FFD700")    // Hellfire Yellow
    static let demonicFrameTint = Color(hex: "#2A1010")    // Smoked Obsidian (text panel overlay)

    // Celestial Crusade -- divine radiance
    static let celestial = Color(hex: "#DAA520")           // Holy Gold
    static let celestialDark = Color(hex: "#2A2030")       // Divine Shadow
    static let celestialAccent = Color(hex: "#F5F0E1")     // Divine Ivory
    static let celestialHighlight = Color(hex: "#3B5998")  // Righteous Blue
    static let celestialFrameTint = Color(hex: "#2A2030")  // Divine Shadow (text panel overlay)

    // The Endless -- necrotic spectral
    static let endless = Color(hex: "#6B3FA0")             // Necrotic Purple
    static let endlessDark = Color(hex: "#1A1525")         // Tomb Shadow
    static let endlessAccent = Color(hex: "#E8DCC8")       // Bone White
    static let endlessHighlight = Color(hex: "#5F9EA0")    // Ghostly Teal
    static let endlessFrameTint = Color(hex: "#1A1525")    // Tomb Shadow (text panel overlay)

    // MARK: - Sub-Faction Accent Colors

    // Ironwright sub-factions
    static let foundryDirectorate = Color(hex: "#6B7B8D")  // Steel (primary)
    static let scrapLegions = Color(hex: "#8B4513")        // Rust

    // Fey Courts sub-factions
    static let verdantThrone = Color(hex: "#2E8B57")       // Emerald (primary)
    static let hollowCourt = Color(hex: "#A0C4E8")         // Ice Blue

    // Demonic Kingdoms sub-factions
    static let obsidianBureaucracy = Color(hex: "#D4C4A8") // Parchment Tan
    static let furnaceLords = Color(hex: "#FF4500")        // Volcanic Orange

    // Celestial Crusade sub-factions
    static let knightsOfDeliverance = Color(hex: "#3B5998") // Righteous Blue
    static let heavensChosen = Color(hex: "#F8F4F0")        // Judgment White

    // Endless sub-factions
    static let necromanticCabals = Color(hex: "#7B9E5F")   // Sickly Green
    static let lostSpectres = Color(hex: "#5F9EA0")        // Ghostly Teal

    // MARK: - App Accent (generic warm gold, used across non-faction UI)
    static let appAccent = Color(hex: "#C9A84C")

    // MARK: - UI Theme Colors

    static let bgPrimary = Color(hex: "#0D0D0D")
    static let bgSecondary = Color(hex: "#141414")
    static let bgTertiary = Color(hex: "#1A1A1A")
    static let bgQuaternary = Color(hex: "#2A2A2A")
    static let bgElevated = Color(hex: "#3A3A3A")

    static let textPrimary = Color(hex: "#F0EAD6")
    static let textSecondary = Color(hex: "#AAAAAA")
    static let textTertiary = Color(hex: "#888888")
    static let textDisabled = Color(hex: "#555555")
    static let textDark = Color(hex: "#1C1917")  // Warm black for light-context text

    // Battle HUD
    static let orderBlue = Color(hex: "#5BC0EB")
    static let chaosRed = Color(hex: "#E63946")
    static let healGreen = Color(hex: "#4CAF50")
    static let warningYellow = Color(hex: "#FFC107")
    static let damageOrange = Color(hex: "#FF7043")
    static let timerBlue = Color(hex: "#4A90E2")
    static let missionBlue = Color(hex: "#4EA6C5")
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

    static func tierColor(_ tier: Rarity) -> Color {
        switch tier {
        case .common:    return .rarityCommon
        case .uncommon:  return .rarityUncommon
        case .rare:      return .rarityRare
        case .epic:      return .rarityEpic
        case .legendary: return .rarityLegendary
        }
    }

    static func factionPrimary(_ faction: CardFaction) -> Color {
        switch faction {
        case .ironwright: return .ironwright
        case .fey:        return .feyCourts
        case .demonic:    return .demonic
        case .celestial:  return .celestial
        case .endless:    return .endless
        }
    }

    static func factionFrameTint(_ faction: CardFaction) -> Color {
        switch faction {
        case .ironwright: return .ironwrightFrameTint
        case .fey:        return .feyCourtsFrameTint
        case .demonic:    return .demonicFrameTint
        case .celestial:  return .celestialFrameTint
        case .endless:    return .endlessFrameTint
        }
    }

    static func factionAccent(_ faction: CardFaction) -> Color {
        switch faction {
        case .ironwright: return .ironwrightAccent
        case .fey:        return .feyCourtsAccent
        case .demonic:    return .demonicAccent
        case .celestial:  return .celestialAccent
        case .endless:    return .endlessAccent
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

// FactionShortName UIKit extensions removed — moved to CardFaction in CardGuideEnums.swift (P1-1, 2026-02-21).
// Use CardFaction.primaryUIColor, .accentUIColor, .frameTintUIColor, .swiftUIColor instead.

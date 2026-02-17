// CardFont.swift
// Chaos Creatures
// Typed font accessors for Cinzel (card names, headers) and Alegreya (body, flavor, stats).
// Source: CLAUDE.md Card Visual System — Fonts section

import SwiftUI
import UIKit

enum CardFont {

    // MARK: - Font Family Names
    // These must match the family names registered by iOS from the variable .ttf files.
    // Cinzel variable font (wght 400–900): family "Cinzel"
    // Alegreya variable font (wght 400–900): family "Alegreya"
    // Alegreya Italic variable font (wght 400–900): family "Alegreya"

    private static let cinzelFamily = "Cinzel"
    private static let alegreyaFamily = "Alegreya"

    // MARK: - SwiftUI Font Accessors (Card Names, Headers — Cinzel)

    /// Card names on cards and in lists. Cinzel Bold (weight 700).
    static func cardName(size: CGFloat) -> Font {
        .custom(cinzelFamily, size: size).weight(.bold)
    }

    /// Section headers, navigation titles. Cinzel Regular (weight 400).
    static func header(size: CGFloat) -> Font {
        .custom(cinzelFamily, size: size).weight(.regular)
    }

    /// Large display titles (e.g. game logo, splash). Cinzel Black (weight 900).
    static func displayTitle(size: CGFloat) -> Font {
        .custom(cinzelFamily, size: size).weight(.black)
    }

    // MARK: - SwiftUI Font Accessors (Body, Flavor, Stats — Alegreya)

    /// Body text, descriptions. Alegreya Regular (weight 400).
    static func body(size: CGFloat) -> Font {
        .custom(alegreyaFamily, size: size).weight(.regular)
    }

    /// Emphasized body text, labels. Alegreya Bold (weight 700).
    static func bodyBold(size: CGFloat) -> Font {
        .custom(alegreyaFamily, size: size).weight(.bold)
    }

    /// Flavor text on cards. Alegreya Italic Regular (weight 400).
    static func flavorText(size: CGFloat) -> Font {
        .custom(alegreyaFamily, size: size).weight(.regular).italic()
    }

    /// ATK/HP and other numeric stats. Alegreya Bold (weight 700).
    static func stats(size: CGFloat) -> Font {
        .custom(alegreyaFamily, size: size).weight(.bold)
    }

    // MARK: - UIFont Accessors (for SpriteKit / UIKit)

    /// Card names in SpriteKit. Cinzel Bold.
    static func cardNameUI(size: CGFloat) -> UIFont {
        cinzelUIFont(size: size, weight: .bold)
    }

    /// Headers in UIKit contexts. Cinzel Regular.
    static func headerUI(size: CGFloat) -> UIFont {
        cinzelUIFont(size: size, weight: .regular)
    }

    /// Display titles in UIKit contexts. Cinzel Black.
    static func displayTitleUI(size: CGFloat) -> UIFont {
        cinzelUIFont(size: size, weight: .black)
    }

    /// Body text in SpriteKit. Alegreya Regular.
    static func bodyUI(size: CGFloat) -> UIFont {
        alegreyaUIFont(size: size, weight: .regular, italic: false)
    }

    /// Bold body text in SpriteKit. Alegreya Bold.
    static func bodyBoldUI(size: CGFloat) -> UIFont {
        alegreyaUIFont(size: size, weight: .bold, italic: false)
    }

    /// Flavor text in SpriteKit. Alegreya Italic.
    static func flavorTextUI(size: CGFloat) -> UIFont {
        alegreyaUIFont(size: size, weight: .regular, italic: true)
    }

    /// ATK/HP stats in SpriteKit. Alegreya Bold.
    static func statsUI(size: CGFloat) -> UIFont {
        alegreyaUIFont(size: size, weight: .bold, italic: false)
    }

    // MARK: - SpriteKit Font Name Strings
    // For SKLabelNode.fontName which requires a PostScript name string.

    /// Cinzel Bold PostScript name for SKLabelNode.
    static let spriteKitCardName = "Cinzel-Bold"

    /// Cinzel Regular PostScript name for SKLabelNode.
    static let spriteKitHeader = "Cinzel-Regular"

    /// Alegreya Regular PostScript name for SKLabelNode.
    static let spriteKitBody = "Alegreya-Regular"

    /// Alegreya Bold PostScript name for SKLabelNode.
    static let spriteKitStats = "Alegreya-Bold"

    /// Alegreya Italic PostScript name for SKLabelNode.
    static let spriteKitFlavorText = "Alegreya-Italic"

    // MARK: - Private Helpers

    private static func cinzelUIFont(size: CGFloat, weight: UIFont.Weight) -> UIFont {
        let descriptor = UIFontDescriptor(fontAttributes: [
            .family: cinzelFamily,
            .traits: [UIFontDescriptor.TraitKey.weight: weight]
        ])
        let font = UIFont(descriptor: descriptor, size: size)
        // Verify the font loaded from the custom family, not a system fallback
        if font.familyName == cinzelFamily {
            return font
        }
        // Fallback: try PostScript name directly
        if let psFont = UIFont(name: "Cinzel-Regular", size: size) {
            return psFont
        }
        return .systemFont(ofSize: size, weight: weight)
    }

    private static func alegreyaUIFont(size: CGFloat, weight: UIFont.Weight, italic: Bool) -> UIFont {
        let descriptor = UIFontDescriptor(fontAttributes: [
            .family: alegreyaFamily,
            .traits: [UIFontDescriptor.TraitKey.weight: weight]
        ])

        let resolved: UIFontDescriptor
        if italic, let italicDescriptor = descriptor.withSymbolicTraits(.traitItalic) {
            resolved = italicDescriptor
        } else {
            resolved = descriptor
        }

        let font = UIFont(descriptor: resolved, size: size)
        if font.familyName == alegreyaFamily {
            return font
        }
        // Fallback: try PostScript name directly
        let psName = italic ? "Alegreya-Italic" : "Alegreya-Regular"
        if let psFont = UIFont(name: psName, size: size) {
            return psFont
        }
        return italic ? .italicSystemFont(ofSize: size) : .systemFont(ofSize: size, weight: weight)
    }

    // MARK: - Debug: List Registered Font Names

    /// Call this once at app launch (debug only) to verify fonts loaded correctly.
    /// Prints all font names in the Cinzel and Alegreya families.
    static func debugPrintRegisteredFonts() {
        #if DEBUG
        for family in UIFont.familyNames.sorted() {
            if family.contains("Cinzel") || family.contains("Alegreya") {
                print("Font family: \(family)")
                for name in UIFont.fontNames(forFamilyName: family) {
                    print("  - \(name)")
                }
            }
        }
        #endif
    }
}

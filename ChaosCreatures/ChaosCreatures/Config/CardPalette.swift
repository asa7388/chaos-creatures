// CardPalette.swift
// Chaos Creatures
//
// Named color tokens from the P3 palette (Section 1.2, CARD_DESIGN_GUIDE.md).
// All 16 tokens from the guide's color table are represented here.
//
// ALWAYS access card colors via these properties — never use raw Color(hex:) for card rendering.
// Always initialized via UIColor(displayP3Red:green:blue:alpha:) to ensure P3 gamut on A14+ devices.
//
// Dark mode pairs:
//   parchment-light (light) ↔ parchment-dark-mode (dark) — card body base
//   ink-black (light) ↔ ink-dark-mode (dark) — typography
// All other tokens are accent/faction colors and do not invert with dark mode.

import SwiftUI

enum CardPalette {

    // MARK: - Base Materials

    /// Card body base (light areas). Dark mode: becomes deep warm brown (parchment-dark-mode).
    static var parchmentLight: Color { Color("parchment-light") }

    /// Card body shadow, inner borders.
    static var parchmentMid: Color { Color("parchment-mid") }

    /// Deep shadows, ink shadows.
    static var parchmentDark: Color { Color("parchment-dark") }

    /// Typography, fine lines. Dark mode: becomes warm cream (ink-dark-mode).
    static var inkBlack: Color { Color("ink-black") }

    /// Background canvas.
    static var canvasWarm: Color { Color("canvas-warm") }

    // MARK: - Faction Colors
    // Used for wax seal and faction icon tint only. Not used in borders, name bar, or text box.

    /// Demonic Kingdoms faction color — wax seal base color; faction icon tint on type line.
    static var waxRed: Color { Color("wax-red") }

    /// Reserved — not currently assigned to a faction.
    static var waxBlue: Color { Color("wax-blue") }

    /// Reserved — not currently assigned to a faction.
    static var waxGreen: Color { Color("wax-green") }

    /// Fey Courts faction color — wax seal base color; faction icon tint on type line.
    static var feyTeal: Color { Color("fey-teal") }

    /// The Endless faction color — wax seal base color; faction icon tint on type line.
    /// Dark greenish-black, decay palette.
    static var rotMoss: Color { Color("rot-moss") }

    /// Celestial Crusade faction color; also Rare frames and gold accents.
    static var agedGold: Color { Color("aged-gold") }

    /// Ironwright Collective faction color; also Uncommon frames.
    static var antiqueSilver: Color { Color("antique-silver") }

    // MARK: - Rarity Accents

    /// Epic frames, arcane glow.
    static var epicAmethyst: Color { Color("epic-amethyst") }

    /// Legendary gradient.
    static var legendaryEmber: Color { Color("legendary-ember") }

    // MARK: - Dark Mode Alternates
    // These tokens are used by parchment-light and ink-black's dark-mode appearance entries
    // in Assets.xcassets. They are also exposed here for use in CardTheme switching.

    /// Dark mode card body — deep warm brown (#2A2015).
    static var parchmentDarkMode: Color { Color("parchment-dark-mode") }

    /// Dark mode typography — warm cream (#E8D5A0).
    static var inkDarkMode: Color { Color("ink-dark-mode") }
}

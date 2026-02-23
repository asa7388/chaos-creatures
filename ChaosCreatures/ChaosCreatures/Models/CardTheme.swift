// CardTheme.swift
// Chaos Creatures
//
// Single source of color switching for card rendering (Section 1.3, CARD_DESIGN_GUIDE.md).
// All card views source their colors from this struct — never from direct Color("token")
// lookups scattered across the view hierarchy.
//
// Dark mode pairs:
//   parchment-light (light) ↔ parchment-dark-mode (dark) — card body base
//   ink-black (light) ↔ ink-dark-mode (dark) — typography

import SwiftUI

/// Single source of color switching for card rendering.
/// All card views source their colors from this struct, never from direct
/// Color("token") lookups scattered across the view hierarchy.
struct CardTheme {
    let colorScheme: ColorScheme

    // MARK: - Base Surfaces

    var cardBase: Color {
        colorScheme == .dark ? Color("parchment-dark-mode") : Color("parchment-light")
    }

    // MARK: - Text Colors

    var primaryText: Color {
        colorScheme == .dark ? Color("ink-dark-mode") : Color("ink-black")
    }
    var secondaryText: Color {
        colorScheme == .dark ? Color("ink-dark-mode").opacity(0.75) : Color("ink-black").opacity(0.72)
    }
    var flavorText: Color {
        colorScheme == .dark ? Color("ink-dark-mode").opacity(0.60) : Color("ink-black").opacity(0.55)
    }

    // MARK: - Shadow for Letterpress

    var letterpressShadowColor: Color {
        colorScheme == .dark ? Color("parchment-dark-mode") : Color("parchment-dark")
    }

    // MARK: - Border

    var outerBorder: Color {
        colorScheme == .dark ? Color("ink-dark-mode").opacity(0.4) : Color("ink-black").opacity(0.35)
    }
}

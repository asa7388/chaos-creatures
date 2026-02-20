// ThemedGlyph.swift
// Chaos Creatures
// Resolves common SF Symbols to custom in-world UI glyph assets.

import SwiftUI

struct ThemedGlyph: View {
    let symbol: String
    let size: CGFloat
    var weight: Font.Weight = .regular
    var color: Color = .textSecondary

    var body: some View {
        Group {
            if let assetName = Self.assetName(for: symbol) {
                Image(assetName)
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            } else {
                Image(systemName: symbol)
                    .font(.system(size: size, weight: weight))
            }
        }
        .frame(width: size, height: size)
        .foregroundColor(color)
    }

    static func assetName(for symbol: String) -> String? {
        // Pass through explicit custom asset paths.
        if symbol.contains("/") { return symbol }

        switch symbol {
        case "gearshape.fill", "gearshape.2", "gearshape":
            return "UIIcons/ui-settings"
        case "magnifyingglass":
            return "UIIcons/ui-search"
        case "xmark":
            return "UIIcons/ui-close"
        case "plus", "plus.circle.fill", "plus.rectangle.on.rectangle":
            return "UIIcons/ui-plus"
        case "minus.circle", "minus.circle.fill":
            return "UIIcons/ui-minus"
        case "checkmark.circle.fill", "checkmark":
            return "UIIcons/ui-check"
        case "exclamationmark.triangle.fill":
            return "UIIcons/ui-warning"
        case "arrow.clockwise":
            return "UIIcons/ui-refresh"
        case "chevron.right":
            return "UIIcons/ui-chevron-right"
        case "arrow.right":
            return "UIIcons/ui-arrow-right"
        case "arrow.up.arrow.down":
            return "UIIcons/ui-sort"
        case "rectangle.stack", "rectangle.stack.fill", "square.stack.fill", "square.stack.3d.up.fill":
            return "UIIcons/ui-cards-stack"
        case "archivebox", "archivebox.fill":
            return "UIIcons/ui-archive"
        case "flag.fill":
            return "UIIcons/ui-flag"
        case "arrow.up.circle", "arrow.up.circle.fill":
            return "UIIcons/ui-evolution-sparkle"
        case "photo":
            return "UIIcons/ui-hero"
        case "shield.fill", "exclamationmark.shield.fill":
            return "KeywordIcons/kw-shield"
        default:
            return nil
        }
    }
}

// ManaGemView.swift
// Chaos Creatures
// Mana cost display with gem-shaped background and themed font.
// Source: docs/design/07-ui-ux-specs.md Section 3.2

import SwiftUI

struct ManaGemView: View {
    let cost: Int
    var size: CGFloat = 24

    var body: some View {
        ZStack {
            // Diamond shape background
            Circle()
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "#1565C0"), Color(hex: "#0D47A1")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: size, height: size)
                .shadow(color: Color(hex: "#1565C0").opacity(0.5), radius: 2)

            // Outer ring for polish
            Circle()
                .stroke(Color.white.opacity(0.25), lineWidth: 1)
                .frame(width: size, height: size)

            // Cost number
            Text("\(cost)")
                .font(CardFont.stats(size: size * 0.55))
                .foregroundColor(.white)
        }
    }
}

// MARK: - Large Mana Gem (for card detail)

struct LargeManaGemView: View {
    let cost: Int

    var body: some View {
        ManaGemView(cost: cost, size: 36)
    }
}

#Preview {
    HStack(spacing: 12) {
        ManaGemView(cost: 1)
        ManaGemView(cost: 3)
        ManaGemView(cost: 5)
        ManaGemView(cost: 10)
        LargeManaGemView(cost: 7)
    }
    .padding()
    .background(Color.bgPrimary)
}

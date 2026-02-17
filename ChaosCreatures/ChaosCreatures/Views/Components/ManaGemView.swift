// ManaGemView.swift
// Chaos Creatures
// Mana cost display with gem-shaped background.
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

            // Cost number
            Text("\(cost)")
                .font(.system(size: size * 0.55, weight: .bold))
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

// WaxSealView.swift
// Chaos Creatures
//
// Embossed wax seal rarity badge component.
// Uses Unicode text symbols instead of image assets — guarantees the symbol
// always renders regardless of asset pipeline state.
// Radial gradient + specular highlight create dimensional wax-stamp look.
//
// Spec: docs/CARD_DESIGN_GUIDE.md Section 6.6
// Revised: uses raritySymbol (Text) instead of Image(sealIconName) because
//          seal_common / seal_rare / etc. image assets are not yet generated.

import SwiftUI

/// Embossed wax seal rarity indicator placed at the top-right corner of CardFrameView.
/// Renders at a configurable `size` (default 34pt to match legacy fixed size).
/// Uses `Rarity.waxColor` from CardGuideEnums.swift for color continuity.
struct WaxSealView: View {
    let rarity: Rarity
    var size: CGFloat = 34

    @State private var isGlowing = false
    @State private var appeared = false

    // MARK: - Symbol

    /// Unicode symbol stamped into the wax. No image assets needed.
    private var raritySymbol: String {
        switch rarity {
        case .common:    return "◆"
        case .uncommon:  return "◈"
        case .rare:      return "★"
        case .epic:      return "✦"
        case .legendary: return "⚜"
        }
    }

    // MARK: - Colors

    /// Lighter highlight color derived from waxColor — simulates light from upper-left.
    private var highlightColor: Color {
        switch rarity {
        case .common:    return Color("parchment-light")
        case .uncommon:  return Color(red: 0.85, green: 0.85, blue: 0.90) // light silver
        case .rare:      return Color(red: 0.98, green: 0.85, blue: 0.45) // bright gold
        case .epic:      return Color(red: 0.75, green: 0.50, blue: 0.95) // bright amethyst
        case .legendary: return Color(red: 1.00, green: 0.62, blue: 0.30) // bright ember
        }
    }

    // MARK: - Body

    var body: some View {
        ZStack {
            // Layer 1: Drop shadow disc — gives the seal elevation off the card surface
            Circle()
                .fill(Color.black.opacity(0.55))
                .frame(width: size, height: size)
                .offset(x: size * 0.05, y: size * 0.07)
                .blur(radius: size * 0.08)

            // Layer 2: Outer wax ring — slightly darker pressed/crushed edge
            Circle()
                .fill(rarity.waxColor)
                .frame(width: size, height: size)

            // Layer 3: Main wax disc — radial gradient lit from upper-left
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(stops: [
                            .init(color: highlightColor, location: 0.0),
                            .init(color: rarity.waxColor, location: 0.50),
                            .init(color: rarity.waxColor.opacity(0.75), location: 1.0)
                        ]),
                        center: UnitPoint(x: 0.30, y: 0.28),
                        startRadius: 0,
                        endRadius: size * 0.52
                    )
                )
                .frame(width: size * 0.84, height: size * 0.84)

            // Layer 4: Engraved inner ring — pressed impression circle
            Circle()
                .stroke(
                    LinearGradient(
                        colors: [
                            rarity.waxColor.opacity(0.25),
                            highlightColor.opacity(0.55)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: max(1.0, size * 0.04)
                )
                .frame(width: size * 0.64, height: size * 0.64)

            // Layer 5: The stamp symbol — lit from top, shadow presses it into wax
            Text(raritySymbol)
                .font(.system(size: size * 0.38, weight: .bold))
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.95),
                            highlightColor.opacity(0.75)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                // Shadow below symbol = looks pressed into the wax surface
                .shadow(color: rarity.waxColor.opacity(0.90),
                        radius: size * 0.025,
                        x: size * 0.012,
                        y: size * 0.022)

            // Layer 6: Specular highlight — directional glint from upper-left
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color.white.opacity(0.40), .clear],
                        center: .init(x: 0.35, y: 0.30),
                        startRadius: 0,
                        endRadius: size * 0.28
                    )
                )
                .frame(width: size * 0.55, height: size * 0.40)
                .offset(x: -size * 0.10, y: -size * 0.12)
                .blendMode(.screen)
        }
        // Outer glow for Rare+ (pulsing animation)
        .shadow(
            color: rarity >= .rare ? rarity.waxColor.opacity(isGlowing ? 0.75 : 0.20) : .clear,
            radius: isGlowing ? size * 0.32 : size * 0.10,
            x: 0, y: 0
        )
        // Stamp-press entrance animation
        .scaleEffect(appeared ? 1.0 : 0.05)
        .rotationEffect(.degrees(appeared ? 0 : -45))
        .animation(
            .spring(response: 0.32, dampingFraction: 0.55, blendDuration: 0)
                .delay(0.08),
            value: appeared
        )
        .onAppear {
            appeared = true
            guard rarity >= .rare else { return }
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) {
                isGlowing = true
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("WaxSealView — all rarities") {
    HStack(spacing: 16) {
        ForEach(Rarity.allCases) { rarity in
            VStack(spacing: 6) {
                WaxSealView(rarity: rarity)
                WaxSealView(rarity: rarity, size: 52)
                Text(rarity.displayName)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
    .padding(24)
    .background(Color(UIColor.systemBackground))
}
#endif

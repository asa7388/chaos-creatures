// WaxSealView.swift
// Chaos Creatures
//
// Wax seal rarity badge component. Replaces the plain "C/U/R/E/L" text placeholder.
// Uses Rarity.waxColor and Rarity.sealIconName from Sources/Models/CardGuideEnums.swift.
// Glowing animation applies only to .rare and above (Rarity: Comparable).
//
// Spec: docs/CARD_DESIGN_GUIDE.md Section 6.6
// Task 3.1

import SwiftUI

/// Wax seal rarity indicator placed at the top-right corner of CardFrameView.
/// Uses `Rarity.waxColor` and `Rarity.sealIconName` — both defined in
/// `CardGuideEnums.swift`. Do not re-declare Rarity extensions here.
struct WaxSealView: View {
    let rarity: Rarity
    @State private var isGlowing = false

    var body: some View {
        ZStack {
            // Outer wax disk — radial gradient from center to edge
            Circle()
                .fill(
                    RadialGradient(
                        colors: [rarity.waxColor.opacity(0.7), rarity.waxColor],
                        center: .center,
                        startRadius: 0,
                        endRadius: 17
                    )
                )
                .frame(width: 34, height: 34)
                .shadow(color: rarity.waxColor.opacity(0.6),
                        radius: isGlowing ? 8 : 3, x: 0, y: 0)

            // Embossed symbol — asset name from Rarity.sealIconName
            // Icons downloaded by Scripts/download_icons.sh into Assets.xcassets/Icons/
            Image(rarity.sealIconName)
                .resizable()
                .frame(width: 18, height: 18)
                .blendMode(.multiply)
                .opacity(0.55)

            // Specular highlight — directional light from upper-left
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [.white.opacity(0.45), .clear],
                        center: .init(x: 0.35, y: 0.3),
                        startRadius: 0,
                        endRadius: 10
                    )
                )
                .frame(width: 22, height: 16)
                .offset(x: -4, y: -4)
                .blendMode(.overlay)
        }
        .onAppear {
            // Glow animation only for Rare and above
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
    HStack(spacing: 12) {
        ForEach(Rarity.allCases) { rarity in
            VStack(spacing: 4) {
                WaxSealView(rarity: rarity)
                Text(rarity.displayName)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
    .padding(20)
    .background(Color(UIColor.systemBackground))
}
#endif

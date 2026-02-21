// CardBackView.swift
// Chaos Creatures
//
// Card back design per CARD_DESIGN_GUIDE.md Section 1.8.
// Physical aesthetic: canvas texture base, woven grid pattern, centered wax seal,
// parchment-mid border.
//
// Also provides a flip-to-back animation bridge used by CardFrameView (.tapped state):
//   Phase 1: easeIn 0.17s → rotationY 90° (front face disappears)
//   Phase 2: swap face, easeOut 0.18s from -90° → 0°
//
// Task 2.7

import SwiftUI

// MARK: - CardBackView

/// The universal card back. Rendered by CardFrameView when isFlipped = true.
/// Dimensions and corner radius match card front exactly.
struct CardBackView: View {
    let cardWidth: CGFloat
    let cardHeight: CGFloat

    var body: some View {
        ZStack {
            // Base: canvas-warm fill
            Color("canvas-warm")

            // Woven grid pattern (Canvas API, 8pt grid, ink-black 8% opacity)
            Canvas { context, size in
                let gridSpacing: CGFloat = 8
                let lineColor = Color("ink-black").opacity(0.08)

                // Horizontal lines
                var y: CGFloat = 0
                while y <= size.height {
                    var path = Path()
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: size.width, y: y))
                    context.stroke(path, with: .color(lineColor), lineWidth: 0.5)
                    y += gridSpacing
                }

                // Vertical lines
                var x: CGFloat = 0
                while x <= size.width {
                    var path = Path()
                    path.move(to: CGPoint(x: x, y: 0))
                    path.addLine(to: CGPoint(x: x, y: size.height))
                    context.stroke(path, with: .color(lineColor), lineWidth: 0.5)
                    x += gridSpacing
                }

                // Diagonal weave accent (every other intersection)
                x = 0
                while x <= size.width {
                    var yOffset: CGFloat = (x / gridSpacing).truncatingRemainder(dividingBy: 2) == 0 ? 0 : gridSpacing / 2
                    while yOffset <= size.height {
                        let dotRect = CGRect(x: x - 0.75, y: yOffset - 0.75, width: 1.5, height: 1.5)
                        context.fill(
                            Path(ellipseIn: dotRect),
                            with: .color(Color("ink-black").opacity(0.06))
                        )
                        yOffset += gridSpacing
                    }
                    x += gridSpacing
                }
            }
            .frame(width: cardWidth, height: cardHeight)
            .allowsHitTesting(false)

            // Centered wax seal: 40pt circle in wax-red radial gradient
            ZStack {
                // Drop shadow
                Circle()
                    .fill(Color.black.opacity(0.45))
                    .frame(width: 42, height: 42)
                    .blur(radius: 4)
                    .offset(y: 3)

                // Seal body
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color("wax-red").opacity(0.8),
                                Color("wax-red"),
                                Color.black.opacity(0.85)
                            ],
                            center: .init(x: 0.38, y: 0.32),
                            startRadius: 2,
                            endRadius: 20
                        )
                    )
                    .frame(width: 40, height: 40)

                // Top-lit specular highlight (wax physics)
                Ellipse()
                    .fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.30), Color.clear],
                            startPoint: .top,
                            endPoint: .center
                        )
                    )
                    .frame(width: 28, height: 16)
                    .offset(y: -9)
                    .blendMode(.screen)
                    .clipShape(Circle().scale(0.95))

                // "CC" logotype embossed in seal
                Text("CC")
                    .font(CardFont.cardName(size: 14))
                    .foregroundColor(Color("ink-black").opacity(0.85))
                    .shadow(color: Color("wax-red").opacity(0.3), radius: 1, x: 0, y: 0.5)
            }

            // Parchment-mid border (common weight 3pt)
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color("parchment-mid"), lineWidth: 3)
                .frame(width: cardWidth, height: cardHeight)
                .allowsHitTesting(false)

            // Outer edge (cut card stock)
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color("ink-black").opacity(0.35), lineWidth: 1)
                .frame(width: cardWidth, height: cardHeight)
                .allowsHitTesting(false)
        }
        .frame(width: cardWidth, height: cardHeight)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.45), radius: 3, x: 0, y: 2)
    }
}

// MARK: - Previews

#Preview("Card Back") {
    CardBackView(cardWidth: 210, cardHeight: 294)
        .padding()
        .background(Color.bgPrimary)
}

#Preview("Card Back — Small") {
    CardBackView(cardWidth: 90, cardHeight: 126)
        .padding()
        .background(Color.bgPrimary)
}

// LoadingView.swift
// Chaos Creatures
// Standard loading state with spinner, message, and dark theme styling.
// Source: docs/design/07-ui-ux-specs.md Section 11

import SwiftUI

struct ChaosMoteSpinner: View {
    var size: CGFloat = 28
    var tint: Color = .tauntGold

    @State private var rotation: Double = 0
    @State private var pulse: CGFloat = 0.92

    var body: some View {
        ZStack {
            Circle()
                .stroke(tint.opacity(0.22), lineWidth: max(size * 0.08, 2))
                .frame(width: size, height: size)

            Circle()
                .trim(from: 0.05, to: 0.38)
                .stroke(
                    AngularGradient(
                        colors: [tint.opacity(0.2), tint, tint.opacity(0.35)],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: max(size * 0.1, 2.5), lineCap: .round)
                )
                .frame(width: size, height: size)
                .rotationEffect(.degrees(rotation))

            Image("StatIcons/chaos-mote-neutral")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size * 0.42, height: size * 0.42)
                .colorMultiply(tint)
                .scaleEffect(pulse)
        }
        .onAppear {
            withAnimation(.linear(duration: 1.1).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            withAnimation(.easeInOut(duration: 0.85).repeatForever(autoreverses: true)) {
                pulse = 1.08
            }
        }
    }
}

struct LoadingView: View {
    let message: String
    var tint: Color = .tauntGold

    init(_ message: String = "Loading...") {
        self.message = message
    }

    var body: some View {
        VStack(spacing: 16) {
            ChaosMoteSpinner(size: 34, tint: tint)

            Text(message)
                .font(CardFont.uiLabel(size: 15))
                .foregroundColor(.textSecondary)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(
            ZStack {
                Color.bgSecondary
                Image("CardTextures/dark-vellum")
                    .resizable()
                    .opacity(0.28)
            }
            .clipShape(RoundedRectangle(cornerRadius: 12))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.tauntGold.opacity(0.22), lineWidth: 0.8)
        )
        .contactShadow(opacity: 0.45, yOffset: 1.5)
    }
}

#Preview {
    ZStack {
        Color.bgPrimary.ignoresSafeArea()
        LoadingView("Fetching your collection...")
    }
}

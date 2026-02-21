// FullscreenCardView.swift
// Chaos Creatures
// Fullscreen card admiration view. Shows the card large on a dark background.
// Tap anywhere or swipe down to dismiss. Subtle gentle rotation animation.
// Source: docs/design/07-ui-ux-specs.md Section 5.2

import SwiftUI

struct FullscreenCardView: View {
    let card: CardInstance
    let faction: CardFaction?

    @Environment(\.dismiss) private var dismiss

    @State private var dragOffset: CGFloat = 0
    @State private var rotationPhase: Bool = false
    @State private var opacity: Double = 1.0

    // Threshold for swipe-to-dismiss
    private let dismissThreshold: CGFloat = 100

    var body: some View {
        GeometryReader { geometry in
            let cardScale = fullscreenCardScale(in: geometry.size)

            ZStack {
                // Dark background with a subtle lamp-like highlight on the card.
                Color.black.opacity(0.92)
                    .ignoresSafeArea()
                RadialGradient(
                    colors: [Color.textPrimary.opacity(0.07), .clear],
                    center: .top,
                    startRadius: 20,
                    endRadius: 520
                )
                .ignoresSafeArea()
            }
            .contentShape(Rectangle())
            .onTapGesture {
                dismissWithFade()
            }
            .overlay {
                // Card centered in the viewport with slight upward bias.
                CardFrameView(
                    data: CardDisplayData(instance: card, faction: faction),
                    size: .fullscreen
                )
                .shadow(color: .black.opacity(0.6), radius: 24, x: 0, y: 12)
                .rotation3DEffect(
                    .degrees(rotationPhase ? 1.0 : -1.0),
                    axis: (x: 0.2, y: 1.0, z: 0.0),
                    perspective: 0.5
                )
                .offset(y: dragOffset)
                .scaleEffect(cardScale * dragScale)
                .offset(y: -geometry.size.height * 0.035)
                .frame(width: CardDisplaySize.fullscreen.width, height: CardDisplaySize.fullscreen.height)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            // Only track downward drags
                            if value.translation.height > 0 {
                                dragOffset = value.translation.height
                            }
                        }
                        .onEnded { value in
                            if value.translation.height > dismissThreshold {
                                withAnimation(.easeOut(duration: 0.25)) {
                                    dragOffset = UIScreen.main.bounds.height
                                    opacity = 0
                                }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                                    dismiss()
                                }
                            } else {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    dragOffset = 0
                                }
                            }
                        }
                )
            }
        }
        .opacity(opacity)
        .onAppear {
            // Start the gentle rotation animation
            withAnimation(
                .easeInOut(duration: 4.0)
                .repeatForever(autoreverses: true)
            ) {
                rotationPhase = true
            }
        }
        .statusBarHidden(true)
    }

    /// Scale down slightly as user drags to dismiss
    private var dragScale: CGFloat {
        let progress = min(abs(dragOffset) / 300.0, 1.0)
        return 1.0 - (progress * 0.1)
    }

    private func fullscreenCardScale(in size: CGSize) -> CGFloat {
        let horizontalScale = (size.width - 28) / CardDisplaySize.fullscreen.width
        let verticalScale = (size.height * 0.88) / CardDisplaySize.fullscreen.height
        #if os(iOS)
        let maxScale: CGFloat = UIDevice.current.userInterfaceIdiom == .pad ? 1.9 : 1.34
        #else
        let maxScale: CGFloat = 1.34
        #endif
        return min(max(min(horizontalScale, verticalScale), 0.96), maxScale)
    }

    private func dismissWithFade() {
        withAnimation(.easeOut(duration: 0.25)) {
            opacity = 0
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            dismiss()
        }
    }
}

#Preview {
    // Preview with mock data
    FullscreenCardView(
        card: CardInstance(
            id: UUID(),
            templateId: UUID(),
            ownerId: UUID(),
            cardType: .creature,
            tier: .epic,
            currentName: "Iron Sentinel, Forged Warden",
            currentAttack: 4,
            currentHealth: 5,
            currentManaCost: 3,
            instabilityValue: 2,
            innateKeywords: ["SHIELD", "TAUNT"],
            modifierKeywords: [],
            evolutionHistory: [],
            modifiers: [],
            triggeredAbilities: [],
            chaosEnergy: 40,
            gamesPlayed: 15,
            artUrl: "",
            flavorText: "Through the flames of industry, a new guardian is born.",
            artPromptHistory: [],
            isFavorite: false,
            inDeckIds: [],
            createdAt: Date(),
            lastEvolvedAt: nil
        ),
        faction: .ironwright
    )
}

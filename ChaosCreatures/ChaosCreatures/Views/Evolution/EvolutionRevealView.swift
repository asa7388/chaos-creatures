// EvolutionRevealView.swift
// Chaos Creatures
// Dramatic art reveal after evolution completes.
// Shows before/after comparison, new modifier, evolved art, and a "Continue" button.
// Now uses CardFrameView for the card reveal and CardFont for themed typography.
// Source: docs/design/07-ui-ux-specs.md Section 5

import SwiftUI

struct EvolutionRevealView: View {
    let result: EvolutionResult
    let previousTier: EvolutionTier
    let previousName: String
    let previousArtUrl: String?
    let modifierName: String?
    let statChanges: EvolutionStatChanges?
    let onContinue: () -> Void

    // MARK: - Animation State

    @State private var phase: RevealPhase = .darkened
    @State private var glowOpacity: Double = 0
    @State private var cardScale: CGFloat = 0.3
    @State private var cardOpacity: Double = 0
    @State private var cardRotation: Double = -15
    @State private var titleOpacity: Double = 0
    @State private var detailsOpacity: Double = 0
    @State private var particleOpacity: Double = 0
    @State private var showContinue = false
    @State private var pulseGlow = false

    private enum RevealPhase {
        case darkened
        case glowing
        case revealing
        case revealed
    }

    var body: some View {
        ZStack {
            // Background
            Color.bgPrimary.ignoresSafeArea()

            // Radial glow behind card
            RadialGradient(
                colors: [
                    Color.tierColor(result.tier).opacity(glowOpacity * 0.5),
                    Color.tierColor(result.tier).opacity(glowOpacity * 0.2),
                    .clear
                ],
                center: .center,
                startRadius: 0,
                endRadius: 250
            )
            .ignoresSafeArea()

            // Particle sparkle overlay
            if particleOpacity > 0 {
                sparkleOverlay
                    .opacity(particleOpacity)
            }

            VStack(spacing: 0) {
                Spacer()

                // Tier upgrade badge
                tierUpgradeBadge
                    .opacity(titleOpacity)

                Spacer()
                    .frame(height: 16)

                // Main card reveal — uses CardFrameView
                cardReveal
                    .scaleEffect(cardScale)
                    .opacity(cardOpacity)
                    .rotation3DEffect(.degrees(cardRotation), axis: (x: 0, y: 1, z: 0))

                Spacer()
                    .frame(height: 24)

                // Card name and details
                cardDetails
                    .opacity(detailsOpacity)

                Spacer()

                // Continue button
                if showContinue {
                    continueButton
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .padding(.horizontal, 16)
        }
        .onAppear {
            runRevealSequence()
        }
    }

    // MARK: - Tier Upgrade Badge

    private var tierUpgradeBadge: some View {
        HStack(spacing: 12) {
            // Previous tier
            VStack(spacing: 4) {
                Text(previousTier.displayName)
                    .font(CardFont.bodyBold(size: 14))
                    .foregroundColor(Color.tierColor(previousTier))
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.tierColor(previousTier))
                    .frame(width: 60, height: 3)
            }

            // Arrow
            Image(systemName: "arrow.right")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.tauntGold)

            // New tier
            VStack(spacing: 4) {
                Text(result.tier.displayName)
                    .font(CardFont.bodyBold(size: 14))
                    .foregroundColor(Color.tierColor(result.tier))
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.tierColor(result.tier))
                    .frame(width: 60, height: 3)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 12)
        .background(Color.bgSecondary.opacity(0.8))
        .cornerRadius(12)
    }

    // MARK: - Card Reveal (uses CardFrameView)

    private var cardReveal: some View {
        CardFrameView(
            data: CardDisplayData(
                name: result.newName,
                artUrl: result.newArtUrl,
                manaCost: 0, // Mana cost not shown in reveal context
                tier: result.tier,
                flavorText: result.newFlavorText
            ),
            size: .detail
        )
        .shadow(
            color: Color.tierColor(result.tier).opacity(pulseGlow ? 0.6 : 0.2),
            radius: pulseGlow ? 20 : 8
        )
    }

    // MARK: - Card Details

    private var cardDetails: some View {
        VStack(spacing: 12) {
            // New name
            Text(result.newName)
                .font(CardFont.cardName(size: 24))
                .foregroundColor(.textPrimary)
                .multilineTextAlignment(.center)

            // Tier badge
            Text(result.tier.displayName)
                .font(CardFont.bodyBold(size: 13))
                .foregroundColor(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 5)
                .background(Color.tierColor(result.tier))
                .cornerRadius(8)

            // Flavor text
            if !result.newFlavorText.isEmpty {
                Text("\"\(result.newFlavorText)\"")
                    .font(CardFont.flavorText(size: 13))
                    .foregroundColor(.textTertiary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            // Modifier applied
            if let modName = modifierName {
                HStack(spacing: 6) {
                    Image(systemName: "sparkle")
                        .font(.system(size: 12))
                        .foregroundColor(.tauntGold)
                    Text("Modifier: \(modName)")
                        .font(CardFont.bodyBold(size: 13))
                        .foregroundColor(.tauntGold)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.tauntGold.opacity(0.1))
                .cornerRadius(8)
            }

            // Stat changes
            if let changes = statChanges {
                statChangesView(changes)
            }

            // Previous name reference
            if previousName != result.newName {
                Text("Previously: \(previousName)")
                    .font(CardFont.body(size: 12))
                    .foregroundColor(.textDisabled)
            }
        }
    }

    private func statChangesView(_ changes: EvolutionStatChanges) -> some View {
        HStack(spacing: 16) {
            if changes.attackBonus != 0 {
                statBadge(
                    label: "ATK",
                    value: changes.attackBonus,
                    color: .damageOrange
                )
            }
            if changes.healthBonus != 0 {
                statBadge(
                    label: "HP",
                    value: changes.healthBonus,
                    color: .healGreen
                )
            }
            if changes.instabilityChange != 0 {
                statBadge(
                    label: "INST",
                    value: changes.instabilityChange,
                    color: changes.instabilityChange > 0 ? .chaosRed : .orderBlue
                )
            }
        }
    }

    private func statBadge(label: String, value: Int, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value > 0 ? "+\(value)" : "\(value)")
                .font(CardFont.stats(size: 16))
                .foregroundColor(color)
            Text(label)
                .font(CardFont.bodyBold(size: 10))
                .foregroundColor(.textTertiary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }

    // MARK: - Continue Button

    private var continueButton: some View {
        Button(action: onContinue) {
            Text("Continue")
                .font(CardFont.bodyBold(size: 16))
                .foregroundColor(.black)
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(Color.tauntGold)
                .cornerRadius(12)
        }
        .padding(.bottom, 32)
    }

    // MARK: - Sparkle Overlay

    private var sparkleOverlay: some View {
        GeometryReader { _ in
            ZStack {
                ForEach(0..<12, id: \.self) { i in
                    let angle = Double(i) * (360.0 / 12.0)
                    let radius: CGFloat = 140
                    let x = cos(angle * .pi / 180) * radius
                    let y = sin(angle * .pi / 180) * radius

                    Image(systemName: "sparkle")
                        .font(.system(size: CGFloat.random(in: 6...14)))
                        .foregroundColor(Color.tierColor(result.tier).opacity(Double.random(in: 0.3...0.8)))
                        .offset(x: x, y: y)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    // MARK: - Animation Sequence

    private func runRevealSequence() {
        // SFX: evolution reveal sound
        BattleAudioManager.shared.playSFX(.evolutionReveal)

        // Phase 1: Glow build-up (0 - 0.6s)
        withAnimation(.easeIn(duration: 0.6)) {
            glowOpacity = 0.8
            phase = .glowing
        }

        // Phase 2: Card appears with 3D flip (0.6 - 1.4s)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.65)) {
                cardScale = 1.0
                cardOpacity = 1.0
                cardRotation = 0
                phase = .revealing
            }
        }

        // Phase 3: Particles appear (1.0s)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation(.easeIn(duration: 0.5)) {
                particleOpacity = 1.0
            }
        }

        // Phase 4: Title fade in (1.3s)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.3) {
            withAnimation(.easeIn(duration: 0.4)) {
                titleOpacity = 1.0
            }
        }

        // Phase 5: Details fade in (1.6s)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
            withAnimation(.easeIn(duration: 0.5)) {
                detailsOpacity = 1.0
                phase = .revealed
            }
        }

        // Phase 6: Start glow pulse (2.0s)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                pulseGlow = true
            }
        }

        // Phase 7: Show continue button (2.2s)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                showContinue = true
            }
        }
    }
}

#Preview {
    EvolutionRevealView(
        result: EvolutionResult(
            cardInstanceId: UUID(),
            newName: "Iron Sentinel, Forged Warden",
            newArtUrl: "",
            newFlavorText: "Through the flames of industry, a new guardian is born.",
            tier: .uncommon
        ),
        previousTier: .common,
        previousName: "Iron Sentinel",
        previousArtUrl: nil,
        modifierName: "Tempered Plating",
        statChanges: EvolutionStatChanges(
            attackBonus: 1,
            healthBonus: 2,
            instabilityChange: -1
        ),
        onContinue: {}
    )
}

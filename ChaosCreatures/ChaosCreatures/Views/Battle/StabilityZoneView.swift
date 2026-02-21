// StabilityZoneView.swift
// Chaos Creatures
// Horizontal strip showing the player's stabilizers in the stability zone.
// Stabilizers are free (0 motes), one per turn, and each has an activated ability
// with a per-card cooldown (unavailable next turn after use).
// Positioned between the board area and the hand, on the player's side only.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SwiftUI

// MARK: - Stability Zone View

/// Horizontal scrolling strip of stabilizers the player has in their stability zone.
/// Shows each stabilizer's name, art thumbnail, and an ACTIVATE button.
/// On cooldown: grayed out with "COOLDOWN" label.
/// When `canActivate` is false (opponent's turn): all buttons disabled.
struct StabilityZoneView: View {
    let stabilizers: [BattleStabilizerData]
    /// False when it is not the local player's turn.
    let canActivate: Bool
    /// Called with the instanceId of the stabilizer to activate.
    let onActivate: (String) -> Void

    var body: some View {
        if stabilizers.isEmpty {
            EmptyView()
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(stabilizers) { stabilizer in
                        StabilizerZoneCard(
                            stabilizer: stabilizer,
                            canActivate: canActivate,
                            onActivate: onActivate
                        )
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
            }
            .frame(height: 84)
            .background(Color.bgPrimary.opacity(0.5))
        }
    }
}

// MARK: - Stabilizer Zone Card

/// Single stabilizer card tile shown in the stability zone strip.
struct StabilizerZoneCard: View {
    let stabilizer: BattleStabilizerData
    let canActivate: Bool
    let onActivate: (String) -> Void

    var body: some View {
        VStack(spacing: 4) {
            // Art thumbnail or faction-colored placeholder
            ZStack {
                RoundedRectangle(cornerRadius: 4)
                    .fill(stabilizerTypeColor.opacity(0.25))
                    .frame(width: 48, height: 36)

                if let artUrl = stabilizer.artUrl, let url = URL(string: artUrl) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(width: 48, height: 36)
                                .clipShape(RoundedRectangle(cornerRadius: 4))
                        default:
                            stabilizerTypePlaceholder
                        }
                    }
                } else {
                    stabilizerTypePlaceholder
                }
            }
            .overlay(
                // Cooldown dimming overlay
                stabilizer.isOnCooldown
                    ? RoundedRectangle(cornerRadius: 4).fill(Color.black.opacity(0.5))
                    : nil
            )

            // Card name (truncated)
            Text(stabilizer.name.prefix(10))
                .font(CardFont.bodyBold(size: 8))
                .foregroundColor(stabilizer.isOnCooldown ? .textDisabled : .textPrimary)
                .lineLimit(1)

            // Activate / cooldown button
            if stabilizer.isOnCooldown {
                Text("COOLDOWN")
                    .font(.system(size: 7, weight: .bold))
                    .foregroundColor(.gray)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(3)
            } else {
                Button(action: { onActivate(stabilizer.instanceId) }) {
                    Text("ACTIVATE")
                        .font(.system(size: 7, weight: .bold))
                        .foregroundColor(canActivate ? .yellow : .gray)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(
                            canActivate
                                ? Color.yellow.opacity(0.15)
                                : Color.gray.opacity(0.15)
                        )
                        .cornerRadius(3)
                }
                .disabled(!canActivate)
            }
        }
        .padding(6)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(stabilizer.isOnCooldown
                      ? Color.gray.opacity(0.15)
                      : Color.black.opacity(0.70))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(
                    stabilizer.isOnCooldown
                        ? Color.gray.opacity(0.4)
                        : Color.yellow.opacity(0.55),
                    lineWidth: 1
                )
        )
        .frame(width: 80)
    }

    // MARK: - Helpers

    private var stabilizerTypeColor: Color {
        switch stabilizer.stabilizerType {
        case .order: return .orderBlue
        case .chaos: return .chaosRed
        case .hybrid: return .warningYellow
        }
    }

    private var stabilizerTypePlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 4)
                .fill(stabilizerTypeColor.opacity(0.2))
                .frame(width: 48, height: 36)
            Text(stabilizerTypeInitial)
                .font(CardFont.stats(size: 14))
                .foregroundColor(stabilizerTypeColor.opacity(0.8))
        }
    }

    private var stabilizerTypeInitial: String {
        switch stabilizer.stabilizerType {
        case .order: return "O"
        case .chaos: return "C"
        case .hybrid: return "H"
        }
    }
}

#Preview {
    StabilityZoneView(
        stabilizers: [],
        canActivate: true,
        onActivate: { _ in }
    )
    .preferredColorScheme(.dark)
}

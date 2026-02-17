// ModifierPickerView.swift
// Chaos Creatures
// Choose visual modifier during evolution (tier-gated options: Free=2, Mid=3, Top=4).
// Also includes channel direction picker (ORDER vs CHAOS).
// Source: docs/design/07-ui-ux-specs.md, 02-card-data-model.md Section 4

import SwiftUI

struct ModifierPickerView: View {
    let modifiers: [ModifierDefinition]
    let cardName: String
    let onConfirm: (ModifierDefinition, EventType) -> Void
    let onCancel: () -> Void

    @State private var selectedModifier: ModifierDefinition?
    @State private var channelDirection: EventType = .order
    @State private var showDetail: ModifierDefinition?

    var body: some View {
        VStack(spacing: 0) {
            // Header
            header

            ScrollView {
                VStack(spacing: 20) {
                    // Channel direction toggle
                    channelDirectionPicker

                    // Modifier cards
                    modifierGrid

                    // Selected modifier detail
                    if let selected = selectedModifier {
                        selectedModifierDetail(selected)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 120) // Space for confirm button
            }

            // Confirm button
            confirmButton
        }
        .background(Color.bgPrimary)
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 8) {
            Text("Choose a Modifier")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.textPrimary)

            Text("Select a modifier for \(cardName)'s evolution")
                .font(.system(size: 14))
                .foregroundColor(.textSecondary)
        }
        .padding(.top, 20)
        .padding(.bottom, 16)
    }

    // MARK: - Channel Direction Picker

    private var channelDirectionPicker: some View {
        VStack(spacing: 8) {
            Text("Channel Direction")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.textTertiary)

            HStack(spacing: 0) {
                // ORDER button
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        channelDirection = .order
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "shield.lefthalf.filled")
                            .font(.system(size: 14))
                        Text("ORDER")
                            .font(.system(size: 14, weight: .bold))
                    }
                    .foregroundColor(channelDirection == .order ? .white : .orderBlue)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(channelDirection == .order ? Color.orderBlue : Color.clear)
                }

                // CHAOS button
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        channelDirection = .chaos
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 14))
                        Text("CHAOS")
                            .font(.system(size: 14, weight: .bold))
                    }
                    .foregroundColor(channelDirection == .chaos ? .white : .chaosRed)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(channelDirection == .chaos ? Color.chaosRed : Color.clear)
                }
            }
            .background(Color.bgTertiary)
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.borderDefault, lineWidth: 1)
            )

            Text(channelDirection == .order
                ? "Order channels grant stability and defensive bonuses"
                : "Chaos channels increase instability but unlock powerful effects")
                .font(.system(size: 12))
                .foregroundColor(channelDirection == .order ? .orderBlue : .chaosRed)
                .multilineTextAlignment(.center)
                .padding(.top, 4)
        }
    }

    // MARK: - Modifier Grid

    private var modifierGrid: some View {
        VStack(spacing: 12) {
            Text("Available Modifiers")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.textTertiary)
                .frame(maxWidth: .infinity, alignment: .leading)

            ForEach(modifiers) { modifier in
                modifierCard(modifier)
            }
        }
    }

    private func modifierCard(_ modifier: ModifierDefinition) -> some View {
        let isSelected = selectedModifier?.id == modifier.id

        return Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                if selectedModifier?.id == modifier.id {
                    selectedModifier = nil
                } else {
                    selectedModifier = modifier
                }
            }
        }) {
            VStack(alignment: .leading, spacing: 10) {
                // Top row: name + attunement badge
                HStack {
                    Text(modifier.name)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.textPrimary)

                    Spacer()

                    // Attunement badge
                    HStack(spacing: 4) {
                        Image(systemName: modifier.attunement == .order ? "shield.lefthalf.filled" : "flame.fill")
                            .font(.system(size: 10))
                        Text(modifier.attunement == .order ? "Order" : "Chaos")
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .foregroundColor(modifier.attunement == .order ? .orderBlue : .chaosRed)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background((modifier.attunement == .order ? Color.orderBlue : Color.chaosRed).opacity(0.15))
                    .cornerRadius(6)
                }

                // Flavor text
                Text(modifier.flavorText)
                    .font(.system(size: 12))
                    .foregroundColor(.textTertiary)
                    .lineLimit(2)

                // Effect info row
                HStack(spacing: 12) {
                    // Keyword granted
                    if let keyword = modifier.grantsKeyword {
                        HStack(spacing: 4) {
                            Image(systemName: keyword.iconName)
                                .font(.system(size: 11))
                            Text(keyword.displayName)
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(.healGreen)
                    }

                    // Instability adjustment
                    let instAdj = modifier.instabilityAdjustment
                    if instAdj != 0 {
                        HStack(spacing: 3) {
                            Image(systemName: instAdj > 0 ? "arrow.up" : "arrow.down")
                                .font(.system(size: 10, weight: .bold))
                            Text("\(abs(instAdj)) Instability")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(instAdj > 0 ? .chaosRed : .orderBlue)
                    }

                    Spacer()

                    // Power rating
                    HStack(spacing: 3) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 10))
                        Text("Power \(modifier.powerRating)")
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundColor(.tauntGold)
                }

                // Penalty indicator
                if modifier.hasPenalty {
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 10))
                        Text("Has penalty effect")
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundColor(.warningYellow)
                }
            }
            .padding(14)
            .background(isSelected ? Color.bgElevated : Color.bgSecondary)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        isSelected ? Color.tauntGold : Color.borderDefault,
                        lineWidth: isSelected ? 2 : 1
                    )
            )
            .scaleEffect(isSelected ? 1.02 : 1.0)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Selected Modifier Detail

    private func selectedModifierDetail(_ modifier: ModifierDefinition) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Selected: \(modifier.name)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.tauntGold)

            // Base effect description
            VStack(alignment: .leading, spacing: 4) {
                Text("Base Effect")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.textSecondary)
                Text(effectDescription(modifier.baseEffect))
                    .font(.system(size: 12))
                    .foregroundColor(.textTertiary)
            }

            // Attuned effect
            VStack(alignment: .leading, spacing: 4) {
                Text("Attuned Effect (\(modifier.attunement == .order ? "Order" : "Chaos"))")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(modifier.attunement == .order ? .orderBlue : .chaosRed)
                Text(effectDescription(modifier.attunedEffect))
                    .font(.system(size: 12))
                    .foregroundColor(.textTertiary)
            }

            // Penalty if present
            if modifier.hasPenalty, let penalty = modifier.penaltyEffect {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Penalty")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.warningYellow)
                    Text(effectDescription(penalty))
                        .font(.system(size: 12))
                        .foregroundColor(.textTertiary)
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.bgTertiary)
        .cornerRadius(10)
        .transition(.opacity.combined(with: .move(edge: .bottom)))
    }

    // MARK: - Confirm Button

    private var confirmButton: some View {
        VStack(spacing: 0) {
            Divider()
                .background(Color.borderDefault)

            HStack(spacing: 12) {
                Button(action: onCancel) {
                    Text("Cancel")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.textSecondary)
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .background(Color.bgQuaternary)
                        .cornerRadius(12)
                }

                Button(action: {
                    guard let modifier = selectedModifier else { return }
                    onConfirm(modifier, channelDirection)
                }) {
                    Text("Confirm Evolution")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(selectedModifier != nil ? .black : .textDisabled)
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .background(selectedModifier != nil ? Color.tauntGold : Color.bgQuaternary)
                        .cornerRadius(12)
                }
                .disabled(selectedModifier == nil)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.bgSecondary)
        }
    }

    // MARK: - Helpers

    private func effectDescription(_ effect: Effect) -> String {
        var parts: [String] = []

        let typeName = effect.effectType.rawValue
            .replacingOccurrences(of: "_", with: " ")
            .lowercased()
            .capitalized
        parts.append(typeName)

        if let value = effect.value {
            parts.append("(\(value > 0 ? "+\(value)" : "\(value)"))")
        }

        if let keyword = effect.keyword {
            parts.append("- \(keyword.displayName)")
        }

        if let duration = effect.duration {
            let durationName = duration.rawValue
                .replacingOccurrences(of: "_", with: " ")
                .lowercased()
                .capitalized
            parts.append("[\(durationName)]")
        }

        return parts.joined(separator: " ")
    }
}

#Preview {
    ModifierPickerView(
        modifiers: [],
        cardName: "Iron Sentinel",
        onConfirm: { _, _ in },
        onCancel: {}
    )
}

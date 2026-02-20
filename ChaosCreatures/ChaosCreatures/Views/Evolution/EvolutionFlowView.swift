// EvolutionFlowView.swift
// Chaos Creatures
// Multi-step evolution ceremony: select card -> choose modifier + channel -> confirm -> reveal.
// Source: docs/design/07-ui-ux-specs.md Section 5, 02-card-data-model.md Section 3

import SwiftUI

struct EvolutionFlowView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router
    @Environment(\.dismiss) private var dismiss

    let card: CardInstance

    // MARK: - State

    @State private var flowPhase: EvolutionFlowPhase = .loading
    @State private var selectedModifier: ModifierDefinition?
    @State private var selectedChannel: EventType = .order

    // Snapshot of card before evolution (for reveal comparison)
    @State private var previousTier: EvolutionTier = .common
    @State private var previousName: String = ""
    @State private var previousArtUrl: String?

    private let evolutionService = EvolutionService.shared

    // MARK: - Flow Phases

    private enum EvolutionFlowPhase: Equatable {
        case loading
        case choosingModifier
        case confirming
        case generating
        case reveal
        case error(String)

        static func == (lhs: EvolutionFlowPhase, rhs: EvolutionFlowPhase) -> Bool {
            switch (lhs, rhs) {
            case (.loading, .loading),
                 (.choosingModifier, .choosingModifier),
                 (.confirming, .confirming),
                 (.generating, .generating),
                 (.reveal, .reveal):
                return true
            case (.error(let a), .error(let b)):
                return a == b
            default:
                return false
            }
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.bgPrimary.ignoresSafeArea()

                switch flowPhase {
                case .loading:
                    loadingView

                case .choosingModifier:
                    ModifierPickerView(
                        modifiers: evolutionService.modifierChoices,
                        cardName: card.currentName,
                        onConfirm: { modifier, channel in
                            selectedModifier = modifier
                            selectedChannel = channel
                            confirmEvolution(modifier: modifier, channel: channel)
                        },
                        onCancel: {
                            evolutionService.cancelEvolution()
                            dismiss()
                        }
                    )

                case .confirming, .generating:
                    generatingView

                case .reveal:
                    if let result = evolutionService.evolutionResult {
                        EvolutionRevealView(
                            result: result,
                            previousTier: previousTier,
                            previousName: previousName,
                            previousArtUrl: previousArtUrl,
                            modifierName: selectedModifier?.name,
                            statChanges: evolutionService.statChanges,
                            evolvedFaction: router.selectedCardFaction,
                            evolvedManaCost: card.currentManaCost,
                            evolvedAttack: evolvedAttackValue,
                            evolvedHealth: evolvedHealthValue,
                            evolvedInstability: evolvedInstabilityValue,
                            evolvedCardType: card.cardType ?? (card.currentAttack != nil ? .creature : .spell),
                            onContinue: {
                                evolutionService.reset()
                                Task { await appState.refreshPlayer() }
                                dismiss()
                            }
                        )
                    }

                case .error(let message):
                    errorView(message: message)
                }
            }
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if flowPhase != .reveal {
                        Button("Cancel") {
                            evolutionService.cancelEvolution()
                            dismiss()
                        }
                        .foregroundColor(.textSecondary)
                    }
                }
            }
            .interactiveDismissDisabled(
                flowPhase == .confirming || flowPhase == .generating
            )
        }
        .task {
            await startEvolution()
        }
        .onChange(of: evolutionService.evolutionStatus) { _, newStatus in
            handleStatusChange(newStatus)
        }
    }

    // MARK: - Navigation Title

    private var navigationTitle: String {
        switch flowPhase {
        case .loading: return "Preparing Evolution"
        case .choosingModifier: return "Choose Modifier"
        case .confirming: return "Evolving..."
        case .generating: return "Evolving..."
        case .reveal: return "Evolution Complete"
        case .error: return "Evolution Failed"
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 20) {
            // Card being evolved
            cardPreview

            ChaosMoteSpinner(size: 34, tint: Color.tierColor(card.tier))

            Text("Preparing evolution choices...")
                .font(CardFont.body(size: 15))
                .foregroundColor(.textSecondary)

            // Card stats
            evolutionEligibilityInfo
        }
    }

    // MARK: - Generating View

    private var generatingView: some View {
        VStack(spacing: 24) {
            // Card preview
            cardPreview

            // Status indicator
            VStack(spacing: 12) {
                ChaosMoteSpinner(size: 38, tint: .tauntGold)

                Text(evolutionService.evolutionStatus.displayMessage)
                    .font(CardFont.body(size: 16))
                    .foregroundColor(.textSecondary)
                    .animation(.easeInOut, value: evolutionService.evolutionStatus)

                // Progress stages
                generationStages
            }

            if let modifier = selectedModifier {
                HStack(spacing: 6) {
                    Image("UIIcons/ui-evolution-sparkle")
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 12, height: 12)
                        .foregroundColor(.tauntGold)
                    Text("Applying: \(modifier.name)")
                        .font(CardFont.bodyBold(size: 13))
                        .foregroundColor(.tauntGold)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color.tauntGold.opacity(0.1))
                .cornerRadius(8)
            }
        }
    }

    // MARK: - Generation Stages

    private var generationStages: some View {
        VStack(alignment: .leading, spacing: 8) {
            stageRow(
                label: "Start evolution",
                isComplete: evolutionService.evolutionStatus != .generating,
                isActive: evolutionService.evolutionStatus == .generating
            )
            stageRow(
                label: "Generate new art",
                isComplete: evolutionService.evolutionStatus != .generatingArt
                    && evolutionService.evolutionStatus != .generating,
                isActive: evolutionService.evolutionStatus == .generatingArt
            )
            stageRow(
                label: "Create name and lore",
                isComplete: evolutionService.evolutionStatus == .applyingModifiers
                    || evolutionService.evolutionStatus == .completed,
                isActive: evolutionService.evolutionStatus == .generatingText
            )
            stageRow(
                label: "Apply modifier effects",
                isComplete: evolutionService.evolutionStatus == .completed,
                isActive: evolutionService.evolutionStatus == .applyingModifiers
            )
        }
        .padding(16)
        .background(Color.bgSecondary)
        .cornerRadius(12)
        .padding(.horizontal, 32)
    }

    private func stageRow(label: String, isComplete: Bool, isActive: Bool) -> some View {
        HStack(spacing: 10) {
            if isComplete {
                ThemedGlyph(symbol: "checkmark.circle.fill", size: 16, color: .healGreen)
            } else if isActive {
                ChaosMoteSpinner(size: 14, tint: .tauntGold)
                    .frame(width: 16, height: 16)
            } else {
                Circle()
                    .fill(Color.bgQuaternary)
                    .frame(width: 16, height: 16)
            }

            Text(label)
                .font(isActive ? CardFont.bodyBold(size: 13) : CardFont.body(size: 13))
                .foregroundColor(isActive ? .textPrimary : (isComplete ? .textSecondary : .textDisabled))
        }
    }

    // MARK: - Card Preview

    private var cardPreview: some View {
        VStack(spacing: 8) {
            CardFrameView(
                data: CardDisplayData(instance: card, faction: router.selectedCardFaction),
                size: .hand
            )
            .contactShadow(opacity: 0.45, yOffset: 2)

            Text(card.currentName)
                .font(CardFont.cardName(size: 16))
                .foregroundColor(.textPrimary)

            HStack(spacing: 8) {
                Text(card.tier.displayName)
                    .font(CardFont.bodyBold(size: 12))
                    .foregroundColor(.textPrimary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.tierColor(card.tier))
                    .cornerRadius(6)

                if let nextTier = card.tier.nextTier {
                    ThemedGlyph(symbol: "arrow.right", size: 10, color: .textDisabled)

                    Text(nextTier.displayName)
                        .font(CardFont.bodyBold(size: 12))
                        .foregroundColor(.textPrimary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.tierColor(nextTier))
                        .cornerRadius(6)
                }
            }
        }
    }

    // MARK: - Evolution Eligibility Info

    private var evolutionEligibilityInfo: some View {
        VStack(spacing: 6) {
            HStack(spacing: 4) {
                Image("StatIcons/chaos-motes")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 12, height: 12)
                    .foregroundColor(.tauntGold)
                Text("Chaos Energy: \(card.chaosEnergy)")
                    .font(CardFont.body(size: 13))
                    .foregroundColor(.textSecondary)

                if let threshold = card.nextEnergyThreshold {
                    Text("/ \(threshold)")
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textDisabled)
                }
            }

            // Evolution progress bar
            if let threshold = card.nextEnergyThreshold, threshold > 0 {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.bgQuaternary)
                            .frame(height: 6)

                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.tauntGold)
                            .frame(
                                width: geo.size.width * card.evolutionProgress,
                                height: 6
                            )
                    }
                }
                .frame(height: 6)
                .padding(.horizontal, 40)
            }
        }
    }

    // MARK: - Error View

    private func errorView(message: String) -> some View {
        VStack(spacing: 20) {
            ThemedGlyph(symbol: "exclamationmark.triangle.fill", size: 48, color: .warningYellow)

            Text("Evolution Failed")
                .font(CardFont.cardName(size: 20))
                .foregroundColor(.textPrimary)

            Text(message)
                .font(CardFont.body(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            VStack(spacing: 12) {
                Button(action: {
                    flowPhase = .loading
                    Task { await startEvolution() }
                }) {
                    Text("Try Again")
                        .font(CardFont.bodyBold(size: 15))
                        .foregroundColor(.textDark)
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .background(Color.tauntGold)
                        .cornerRadius(12)
                }

                Button(action: {
                    evolutionService.reset()
                    dismiss()
                }) {
                    Text("Cancel")
                        .font(CardFont.body(size: 15))
                        .foregroundColor(.textSecondary)
                }
            }
            .padding(.horizontal, 32)
        }
    }

    // MARK: - Actions

    private func startEvolution() async {
        // Snapshot card state before evolution
        previousTier = card.tier
        previousName = card.currentName
        previousArtUrl = card.artUrl

        flowPhase = .loading

        do {
            try await evolutionService.startEvolution(cardId: card.id)
            // Status handler will transition to .choosingModifier
        } catch {
            flowPhase = .error(error.localizedDescription)
        }
    }

    private func confirmEvolution(modifier: ModifierDefinition, channel: EventType) {
        flowPhase = .confirming

        Task {
            do {
                try await evolutionService.confirmEvolution(
                    modifierChosenId: modifier.id,
                    nameChosen: card.currentName // Server generates new name
                )
                // Status handler will transition to .reveal
            } catch {
                flowPhase = .error(error.localizedDescription)
            }
        }
    }

    // MARK: - Evolved Card Preview Values

    private var evolvedAttackValue: Int? {
        guard let currentAttack = card.currentAttack else { return nil }
        return currentAttack + (evolutionService.statChanges?.attackBonus ?? 0)
    }

    private var evolvedHealthValue: Int? {
        guard let currentHealth = card.currentHealth else { return nil }
        return currentHealth + (evolutionService.statChanges?.healthBonus ?? 0)
    }

    private var evolvedInstabilityValue: Int? {
        guard card.cardType == .creature else { return nil }
        return card.instabilityValue + (evolutionService.statChanges?.instabilityChange ?? 0)
    }

    // MARK: - Status Change Handler

    private func handleStatusChange(_ status: EvolutionStatus) {
        switch status {
        case .choosingModifier:
            if flowPhase == .loading {
                withAnimation(.easeInOut(duration: 0.3)) {
                    flowPhase = .choosingModifier
                }
            }

        case .generating, .generatingArt, .generatingText, .applyingModifiers:
            if flowPhase != .generating && flowPhase != .confirming {
                withAnimation(.easeInOut(duration: 0.3)) {
                    flowPhase = .generating
                }
            }

        case .completed:
            withAnimation(.easeInOut(duration: 0.3)) {
                flowPhase = .reveal
            }

        case .failed:
            if let error = evolutionService.error {
                flowPhase = .error(error)
            } else {
                flowPhase = .error("An unknown error occurred.")
            }

        default:
            break
        }
    }
}

#Preview {
    EvolutionFlowView(
        card: CardInstance(
            id: UUID(),
            templateId: UUID(),
            ownerId: UUID(),
            tier: .common,
            currentName: "Iron Sentinel",
            currentAttack: 3,
            currentHealth: 4,
            currentManaCost: 3,
            instabilityValue: 2,
            innateKeywords: ["SHIELD"],
            modifierKeywords: [],
            evolutionHistory: [],
            modifiers: [],
            triggeredAbilities: [],
            chaosEnergy: 15,
            gamesPlayed: 8,
            artUrl: "",
            flavorText: "A stalwart guardian of the Ironwright forges.",
            artPromptHistory: [],
            isFavorite: false,
            inDeckIds: [],
            createdAt: Date(),
            lastEvolvedAt: nil
        )
    )
    .environment(AppState())
    .environment(AppRouter())
}

// TutorialOverlayView.swift
// Chaos Creatures
// S-15: Tutorial overlay that shows tooltips during the first practice match.
// Shows sequential hints at key moments to teach new players the basics.

import SwiftUI

// MARK: - Tutorial Step

enum TutorialStep: Int, CaseIterable {
    case welcome = 0
    case chaosMoteExplain
    case playCard
    case chaosRoll
    case attackPhase
    case complete

    var title: String {
        switch self {
        case .welcome: return "Welcome to Battle!"
        case .chaosMoteExplain: return "Chaos Motes"
        case .playCard: return "Playing Cards"
        case .chaosRoll: return "The Chaos Roll"
        case .attackPhase: return "Combat"
        case .complete: return "You're Ready!"
        }
    }

    var message: String {
        switch self {
        case .welcome:
            return "This is your first battle. Let's learn the basics! Each turn you'll draw a card, gain Chaos Motes, and play cards from your hand."
        case .chaosMoteExplain:
            return "The blue number at the bottom is your Chaos Motes (CM). Cards cost CM to play. You gain +1 max CM each turn."
        case .playCard:
            return "Tap a card in your hand to select it, then tap again to play it. Creatures go on your board, spells take effect immediately."
        case .chaosRoll:
            return "At the start of each turn, a D20 is rolled. Based on your instability rating, it may trigger an Order or Chaos event that affects the battle!"
        case .attackPhase:
            return "After your main phase, you can declare attackers. Your opponent then assigns blockers. Unblocked creatures deal damage to the opponent's HP."
        case .complete:
            return "That's the basics! Win by reducing your opponent's HP to zero. Good luck!"
        }
    }

    var iconName: String {
        switch self {
        case .welcome: return "UIIcons/ui-chaos-spark"
        case .chaosMoteExplain: return "UIIcons/ui-chaos-mana"
        case .playCard: return "UIIcons/ui-mission-cards"
        case .chaosRoll: return "UIIcons/ui-chaos-rift"
        case .attackPhase: return "UIIcons/ui-trigger-attack"
        case .complete: return "checkmark.circle.fill"
        }
    }

    /// Whether this step uses a custom asset (true) or SF Symbol (false)
    var isCustomIcon: Bool {
        switch self {
        case .complete: return false
        default: return true
        }
    }

    var iconColor: Color {
        switch self {
        case .welcome: return .ironwright
        case .chaosMoteExplain: return .timerBlue
        case .playCard: return .healGreen
        case .chaosRoll: return .warningYellow
        case .attackPhase: return .chaosRed
        case .complete: return .orderBlue
        }
    }

    /// The phase that should trigger this tutorial step
    var triggerPhase: TurnPhase? {
        switch self {
        case .welcome: return .gameSetup
        case .chaosMoteExplain: return .drawAndMana
        case .playCard: return .mainPhase
        case .chaosRoll: return .chaosRoll
        case .attackPhase: return .declareAttackers
        case .complete: return nil  // Shows after attackPhase is dismissed
        }
    }
}

// MARK: - Tutorial Manager

@MainActor
final class TutorialManager: ObservableObject {
    @Published var currentStep: TutorialStep? = nil
    @Published var isActive: Bool = false

    private static let hasCompletedTutorialKey = "hasCompletedTutorial"
    private var shownSteps: Set<TutorialStep> = []

    static var hasCompletedTutorial: Bool {
        UserDefaults.standard.bool(forKey: hasCompletedTutorialKey)
    }

    /// Start the tutorial if this is the first practice match
    func startIfNeeded(isPracticeMode: Bool) {
        guard isPracticeMode, !Self.hasCompletedTutorial else { return }
        isActive = true
        currentStep = .welcome
    }

    /// Called when a phase changes to show relevant tutorial step
    func onPhaseChange(_ phase: TurnPhase) {
        guard isActive else { return }

        for step in TutorialStep.allCases {
            if step.triggerPhase == phase, !shownSteps.contains(step) {
                currentStep = step
                return
            }
        }
    }

    /// Dismiss current step and advance
    func dismissCurrentStep() {
        guard let current = currentStep else { return }
        shownSteps.insert(current)

        // If this was the attack phase step, show complete
        if current == .attackPhase {
            currentStep = .complete
            return
        }

        if current == .complete {
            completeTutorial()
            return
        }

        // Otherwise, hide until next phase triggers
        currentStep = nil
    }

    private func completeTutorial() {
        UserDefaults.standard.set(true, forKey: Self.hasCompletedTutorialKey)
        currentStep = nil
        isActive = false
    }
}

// MARK: - Tutorial Overlay View

struct TutorialOverlayView: View {
    @ObservedObject var manager: TutorialManager

    var body: some View {
        if let step = manager.currentStep {
            ZStack {
                // Semi-transparent backdrop
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                    .onTapGesture {
                        withAnimation(.easeOut(duration: 0.25)) {
                            manager.dismissCurrentStep()
                        }
                    }

                // Tutorial tooltip
                VStack(spacing: 16) {
                    // Icon
                    if step.isCustomIcon {
                        Image(step.iconName)
                            .renderingMode(.template)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 36, height: 36)
                            .foregroundColor(step.iconColor)
                    } else {
                        Image(systemName: step.iconName)
                            .font(.system(size: 36))
                            .foregroundColor(step.iconColor)
                    }

                    // Title
                    Text(step.title)
                        .font(CardFont.cardName(size: 20))
                        .foregroundColor(.textPrimary)

                    // Message
                    Text(step.message)
                        .font(CardFont.body(size: 14))
                        .foregroundColor(.textSecondary)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                        .padding(.horizontal, 8)

                    // Step indicator
                    HStack(spacing: 6) {
                        ForEach(TutorialStep.allCases, id: \.rawValue) { s in
                            Circle()
                                .fill(s == step ? step.iconColor : Color.textDisabled)
                                .frame(width: 6, height: 6)
                        }
                    }
                    .padding(.top, 4)

                    // Dismiss button
                    Button(action: {
                        withAnimation(.easeOut(duration: 0.25)) {
                            manager.dismissCurrentStep()
                        }
                    }) {
                        Text(step == .complete ? "Start Playing!" : "Got It")
                            .font(CardFont.bodyBold(size: 15))
                            .foregroundColor(.textPrimary)
                            .frame(maxWidth: 200)
                            .padding(.vertical, 12)
                            .background(step.iconColor)
                            .cornerRadius(10)
                    }
                }
                .padding(24)
                .background(Color.bgSecondary)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(step.iconColor.opacity(0.3), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.4), radius: 20)
                .padding(.horizontal, 32)
                .transition(.scale.combined(with: .opacity))
            }
            .animation(.spring(response: 0.4, dampingFraction: 0.8), value: manager.currentStep?.rawValue)
        }
    }
}

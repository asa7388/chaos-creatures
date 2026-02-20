// OnboardingView.swift
// Chaos Creatures
// First-time user onboarding flow with intro cinematic and faction selection.
// Source: docs/design/07-ui-ux-specs.md Section 7

import SwiftUI

// MARK: - Onboarding Steps

enum OnboardingStep: Int, CaseIterable {
    case introCinematic
    case factionSelection
    case readyToPlay
}

struct OnboardingView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router
    @State private var currentStep: OnboardingStep = .introCinematic

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            // Dark parchment texture
            Image("UIBackgrounds/bg-dark-parchment")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .ignoresSafeArea()
                .opacity(0.25)

            switch currentStep {
            case .introCinematic:
                IntroCinematicView {
                    withAnimation(.easeInOut(duration: 0.5)) {
                        currentStep = .factionSelection
                    }
                }
                .transition(.opacity)

            case .factionSelection:
                FactionPickerView { faction in
                    Task {
                        await commitFaction(faction)
                    }
                }
                .transition(.opacity)

            case .readyToPlay:
                ReadyToPlayView {
                    withAnimation(.easeInOut(duration: 0.4)) {
                        router.rootScreen = .main
                    }
                }
                .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: currentStep)
    }

    private func commitFaction(_ faction: FactionShortName) async {
        // Call Edge Function to commit faction and create starter deck
        struct FactionCommitRequest: Encodable {
            let factionId: String

            enum CodingKeys: String, CodingKey {
                case factionId = "faction_id"
            }
        }

        do {
            try await SupabaseService.shared.callFunction(
                "player/commit-faction",
                body: FactionCommitRequest(factionId: faction.rawValue)
            )
            await appState.loadPlayerData()
            withAnimation(.easeInOut(duration: 0.5)) {
                currentStep = .readyToPlay
            }
        } catch {
            appState.showToast("Failed to select faction. Please try again.", type: .error)
        }
    }
}

// MARK: - Intro Cinematic

struct IntroCinematicView: View {
    let onComplete: () -> Void

    @State private var currentPanelIndex = 0
    @State private var panelOpacity: Double = 0

    private let panels: [(iconName: String, text: String, duration: Double)] = [
        ("globe.americas.fill", "The world was once a thriving land of many civilizations.", 4.0),
        ("bolt.fill", "War tore open rents to the Plane of Chaos.", 4.0),
        ("sparkles", "Chaos motes transform everything they touch.", 4.0),
        ("diamond.fill", "Planar Shards hold the power of transformation.", 4.0),
        ("person.fill", "Channel their power. Transform your creatures.", 4.0),
    ]

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                // Panel icon
                Image(systemName: panels[currentPanelIndex].iconName)
                    .font(.system(size: 80))
                    .foregroundColor(.ironwright)
                    .opacity(panelOpacity)

                // Panel text
                Text(panels[currentPanelIndex].text)
                    .font(CardFont.body(size: 20))
                    .foregroundColor(.textPrimary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .opacity(panelOpacity)

                Spacer()

                // Progress dots
                HStack(spacing: 8) {
                    ForEach(0..<panels.count, id: \.self) { index in
                        Circle()
                            .fill(index == currentPanelIndex ? Color.ironwright : Color.textDisabled)
                            .frame(width: 8, height: 8)
                    }
                }
                .padding(.bottom, 20)
            }

            // Skip button
            VStack {
                HStack {
                    Spacer()
                    Button(action: onComplete) {
                        Text("Skip")
                            .font(CardFont.body(size: 14))
                            .foregroundColor(.textTertiary)
                            .frame(width: 44, height: 44)
                    }
                    .padding(.trailing, 16)
                    .padding(.top, 8)
                }
                Spacer()
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            advancePanel()
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 0.5)) {
                panelOpacity = 1
            }
            startAutoAdvance()
        }
    }

    private func advancePanel() {
        if currentPanelIndex < panels.count - 1 {
            withAnimation(.easeInOut(duration: 0.5)) {
                panelOpacity = 0
            }
            Task {
                try? await Task.sleep(nanoseconds: 500_000_000)
                currentPanelIndex += 1
                withAnimation(.easeInOut(duration: 0.5)) {
                    panelOpacity = 1
                }
                startAutoAdvance()
            }
        } else {
            onComplete()
        }
    }

    private func startAutoAdvance() {
        let duration = panels[currentPanelIndex].duration
        Task {
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            advancePanel()
        }
    }
}

// MARK: - Ready to Play

struct ReadyToPlayView: View {
    let onStart: () -> Void

    @State private var opacity: Double = 0
    @State private var buttonScale: Double = 0.9

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.healGreen)

            Text("You're Ready!")
                .font(CardFont.displayTitle(size: 28))
                .foregroundColor(.textPrimary)

            Text("Build your deck. Evolve your creatures.\nDominate the chaos.")
                .font(CardFont.body(size: 16))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)

            Spacer()

            Button(action: onStart) {
                Text("Start Playing")
                    .font(CardFont.bodyBold(size: 17))
                    .foregroundColor(.black)
                    .frame(width: 200, height: 52)
                    .background(Color.tauntGold)
                    .cornerRadius(12)
            }
            .scaleEffect(buttonScale)
            .padding(.bottom, 60)
        }
        .opacity(opacity)
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) {
                opacity = 1
            }
            withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                buttonScale = 1.05
            }
        }
    }
}

// MatchmakingView.swift
// Chaos Creatures
// Queue UI with timer, pulsing animation, and cancel button.
// Transitions to BattleContainerView when match is found via AppRouter.
// Source: docs/design/07-ui-ux-specs.md Section 3

import SwiftUI

struct MatchmakingView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    @State private var matchmakingService = MatchmakingService.shared
    @State private var pulseScale: CGFloat = 1.0
    @State private var rotationAngle: Double = 0
    @State private var joinError: String?
    @State private var hasJoinedQueue = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text(router.selectedGameMode.displayName)
                    .font(CardFont.cardName(size: 18))
                    .foregroundColor(.textPrimary)
                Spacer()
                Button("Cancel") {
                    Task { await cancelMatchmaking() }
                }
                .font(CardFont.bodyBold(size: 16))
                .foregroundColor(.chaosRed)
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 12)

            Spacer()

            if matchmakingService.matchFound {
                // Match found state
                matchFoundView
            } else if let error = joinError {
                // Error state
                errorView(error)
            } else {
                // Searching state
                searchingView
            }

            Spacer()

            // Cancel button (bottom)
            if !matchmakingService.matchFound {
                Button(action: {
                    Task { await cancelMatchmaking() }
                }) {
                    Text("Cancel Search")
                        .font(CardFont.bodyBold(size: 16))
                        .foregroundColor(.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.bgTertiary)
                        .cornerRadius(12)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-play-mat-felt")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.35)
            }
        )
        .task {
            await joinQueue()
        }
        .onChange(of: matchmakingService.matchFound) { _, found in
            if found, let matchId = matchmakingService.matchId {
                // Short delay for the "Match Found!" animation to display
                Task {
                    try? await Task.sleep(nanoseconds: 800_000_000) // 0.8 seconds
                    router.navigateToBattle(matchID: matchId)
                }
            }
        }
        .interactiveDismissDisabled(matchmakingService.isSearching)
        .presentationDetents([.medium])
    }

    // MARK: - Searching View

    private var searchingView: some View {
        VStack(spacing: 24) {
            // Animated searching indicator
            ZStack {
                // Outer ring
                Circle()
                    .stroke(Color.ironwright.opacity(0.2), lineWidth: 3)
                    .frame(width: 100, height: 100)

                // Rotating arc
                Circle()
                    .trim(from: 0, to: 0.3)
                    .stroke(
                        Color.ironwright,
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )
                    .frame(width: 100, height: 100)
                    .rotationEffect(.degrees(rotationAngle))

                // Inner pulsing icon
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 32, weight: .medium))  // SF Symbol icon size - keep as-is
                    .foregroundColor(.ironwright)
                    .scaleEffect(pulseScale)
            }
            .onAppear {
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                    pulseScale = 1.15
                }
                withAnimation(.linear(duration: 2.0).repeatForever(autoreverses: false)) {
                    rotationAngle = 360
                }
            }

            VStack(spacing: 8) {
                Text(router.selectedGameMode == .practice ? "Setting up AI opponent..." : "Finding Opponent...")
                    .font(CardFont.cardName(size: 20))
                    .foregroundColor(.textPrimary)

                Text(matchmakingService.searchDurationFormatted)
                    .font(CardFont.stats(size: 36))
                    .foregroundColor(.ironwright)

                Text("Estimated wait: ~\(Int(matchmakingService.estimatedWait))s")
                    .font(CardFont.body(size: 13))
                    .foregroundColor(.textTertiary)
            }
        }
    }

    // MARK: - Match Found View

    private var matchFoundView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))  // SF Symbol icon size - keep as-is
                .foregroundColor(.orderBlue)
                .transition(.scale.combined(with: .opacity))

            Text("Match Found!")
                .font(CardFont.displayTitle(size: 24))
                .foregroundColor(.textPrimary)

            Text("Preparing battle...")
                .font(CardFont.body(size: 15))
                .foregroundColor(.textSecondary)

            ChaosMoteSpinner(size: 26, tint: .ironwright)
        }
        .transition(.opacity)
    }

    // MARK: - Error View

    private func errorView(_ error: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))  // SF Symbol icon size - keep as-is
                .foregroundColor(.warningYellow)

            Text("Queue Error")
                .font(CardFont.cardName(size: 20))
                .foregroundColor(.textPrimary)

            Text(error)
                .font(CardFont.body(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            // S-44: If the error is about no deck, show a "Build a Deck" button
            if error.lowercased().contains("no valid deck") || error.lowercased().contains("build a deck") {
                Button(action: {
                    router.showMatchmaking = false
                    appState.selectedTab = .decks
                    router.decksNavigationPath.append(DecksDestination.deckBuilder(nil))
                }) {
                    HStack(spacing: 6) {
                        Image("UIIcons/ui-mission-cards")
                            .renderingMode(.template)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 16, height: 16)
                        Text("Build a Deck")
                    }
                    .font(CardFont.bodyBold(size: 16))
                    .foregroundColor(.textPrimary)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 12)
                    .background(Color.orderBlue)
                    .cornerRadius(10)
                }
            }

            Button("Try Again") {
                joinError = nil
                Task { await joinQueue() }
            }
            .font(CardFont.bodyBold(size: 16))
            .foregroundColor(.textPrimary)
            .padding(.horizontal, 32)
            .padding(.vertical, 12)
            .background(Color.ironwright)
            .cornerRadius(10)
        }
    }

    // MARK: - Queue Actions

    private func joinQueue() async {
        guard !hasJoinedQueue else { return }
        hasJoinedQueue = true

        // Practice mode: call game server directly, skip matchmaking queue
        if router.selectedGameMode == .practice {
            await startPractice()
            return
        }

        // PvP modes: use the matchmaking queue (existing flow)
        do {
            let decks: [Deck] = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.decks,
                filters: [("is_valid", "true")],
                limit: 1
            )
            guard let deck = decks.first else {
                joinError = "No valid deck found. Build a deck first."
                return
            }

            try await matchmakingService.joinQueue(
                deckId: deck.id,
                gameMode: router.selectedGameMode
            )
        } catch {
            joinError = error.localizedDescription
            hasJoinedQueue = false
        }
    }

    private func startPractice() async {
        do {
            let decks: [Deck] = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.decks,
                filters: [("is_valid", "true")],
                limit: 1
            )
            guard let deck = decks.first else {
                joinError = "No valid deck found. Build a deck first."
                hasJoinedQueue = false
                return
            }

            _ = try await matchmakingService.startPracticeMatch(deckId: deck.id)

            // Match found immediately -- navigate to battle
            // The onChange(of: matchmakingService.matchFound) handler will fire
            // and call router.navigateToBattle(matchID:)

        } catch {
            joinError = error.localizedDescription
            hasJoinedQueue = false
        }
    }

    private func cancelMatchmaking() async {
        if router.selectedGameMode != .practice {
            await matchmakingService.leaveQueue()
        }
        matchmakingService.isSearching = false
        matchmakingService.matchFound = false
        matchmakingService.matchId = nil
        router.showMatchmaking = false
    }
}

#Preview {
    MatchmakingView()
        .environment(AppState())
        .environment(AppRouter())
}

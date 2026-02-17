// PostMatchView.swift
// Chaos Creatures
// Results screen with victory/defeat display, rewards, and energy progress.
// Presented as fullScreenCover after BattleContainerView dismisses.
// Source: docs/design/07-ui-ux-specs.md Section 3.10

import SwiftUI

struct PostMatchView: View {
    let matchId: String?

    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    @State private var matchRecord: MatchRecord?
    @State private var isLoading = true
    @State private var loadError: String?

    // Animation states
    @State private var showResultBanner = false
    @State private var showStats = false
    @State private var showRewards = false
    @State private var showContinue = false

    var body: some View {
        ZStack {
            // Background
            backgroundGradient
                .ignoresSafeArea()

            VStack(spacing: 0) {
                if isLoading {
                    loadingView
                } else if let error = loadError {
                    errorView(error)
                } else {
                    resultContent
                }
            }
        }
        .task {
            await loadMatchResult()
            await animateResults()
        }
    }

    // MARK: - Background

    private var backgroundGradient: some View {
        LinearGradient(
            colors: isVictory
                ? [Color.orderBlue.opacity(0.3), Color.bgPrimary]
                : [Color.chaosRed.opacity(0.3), Color.bgPrimary],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                .scaleEffect(1.5)
            Text("Loading results...")
                .font(.system(size: 16))
                .foregroundColor(.textSecondary)
            Spacer()
        }
    }

    // MARK: - Error View

    private func errorView(_ error: String) -> some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundColor(.warningYellow)

            Text("Could not load match results")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.textPrimary)

            Text(error)
                .font(.system(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            continueButton
        }
    }

    // MARK: - Result Content

    private var resultContent: some View {
        VStack(spacing: 24) {
            Spacer()

            // Victory / Defeat banner
            if showResultBanner {
                resultBanner
                    .transition(.scale.combined(with: .opacity))
            }

            // Match stats
            if showStats {
                matchStatsView
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            // Rewards section
            if showRewards {
                rewardsView
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            Spacer()

            // Continue button
            if showContinue {
                continueButton
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Result Banner

    private var resultBanner: some View {
        VStack(spacing: 12) {
            // Icon
            Image(systemName: isVictory ? "crown.fill" : "xmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(isVictory ? .tauntGold : .chaosRed)

            // Title
            Text(isVictory ? "VICTORY" : "DEFEAT")
                .font(.system(size: 40, weight: .black))
                .foregroundColor(isVictory ? .tauntGold : .chaosRed)

            // Subtitle
            if let record = matchRecord {
                Text(endReasonText(record.endReason))
                    .font(.system(size: 15))
                    .foregroundColor(.textSecondary)
            }
        }
    }

    // MARK: - Match Stats

    private var matchStatsView: some View {
        VStack(spacing: 12) {
            Text("Match Stats")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.textPrimary)

            HStack(spacing: 16) {
                statBox(title: "Turns", value: "\(matchRecord?.totalTurns ?? 0)")
                statBox(title: "Duration", value: formatDuration(matchRecord?.durationSeconds ?? 0))
                statBox(title: "Your HP", value: "\(playerFinalHp)")
                statBox(title: "Opp HP", value: "\(opponentFinalHp)")
            }
        }
        .padding(16)
        .background(Color.bgSecondary.opacity(0.8))
        .cornerRadius(12)
    }

    private func statBox(title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 20, weight: .bold, design: .monospaced))
                .foregroundColor(.textPrimary)
            Text(title)
                .font(.system(size: 11))
                .foregroundColor(.textTertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Rewards

    private var rewardsView: some View {
        VStack(spacing: 12) {
            Text("Rewards")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.textPrimary)

            HStack(spacing: 20) {
                rewardItem(
                    icon: "star.fill",
                    label: "XP",
                    value: "+\(xpEarned)",
                    color: .orderBlue
                )

                rewardItem(
                    icon: "sparkle",
                    label: "Dust",
                    value: "+\(dustEarned)",
                    color: .ironwright
                )

                rewardItem(
                    icon: "bolt.fill",
                    label: "Energy",
                    value: "+\(energyEarned)",
                    color: .warningYellow
                )
            }

            // Rank change (for ranked mode)
            if let record = matchRecord, record.gameMode == .ranked {
                HStack(spacing: 8) {
                    Image(systemName: isVictory ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                        .foregroundColor(isVictory ? .orderBlue : .chaosRed)
                        .font(.system(size: 16))
                    Text(isVictory ? "Rank Points +15" : "Rank Points -10")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(isVictory ? .orderBlue : .chaosRed)
                }
                .padding(.top, 4)
            }
        }
        .padding(16)
        .background(Color.bgSecondary.opacity(0.8))
        .cornerRadius(12)
    }

    private func rewardItem(icon: String, label: String, value: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)

            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.textPrimary)

            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.textTertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Continue Button

    private var continueButton: some View {
        Button(action: {
            router.dismissPostMatch()
        }) {
            Text("Continue")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.ironwright)
                .cornerRadius(14)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 40)
    }

    // MARK: - Data Loading

    private func loadMatchResult() async {
        guard let matchId else {
            isLoading = false
            loadError = "No match ID provided."
            return
        }

        do {
            let record = try await MatchService.shared.fetchMatchRecord(matchId: matchId)
            self.matchRecord = record
            isLoading = false
        } catch {
            // If match record is not available yet (server still processing),
            // show basic results from the match that just ended
            isLoading = false
            // Not a hard error -- the player still sees the result banner
        }
    }

    // MARK: - Animation Sequencing

    private func animateResults() async {
        // Wait for loading to finish
        while isLoading {
            try? await Task.sleep(nanoseconds: 100_000_000)
        }

        // Stagger the reveals
        withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
            showResultBanner = true
        }

        try? await Task.sleep(nanoseconds: 600_000_000)

        withAnimation(.easeOut(duration: 0.4)) {
            showStats = true
        }

        try? await Task.sleep(nanoseconds: 400_000_000)

        withAnimation(.easeOut(duration: 0.4)) {
            showRewards = true
        }

        try? await Task.sleep(nanoseconds: 400_000_000)

        withAnimation(.easeOut(duration: 0.3)) {
            showContinue = true
        }
    }

    // MARK: - Computed Properties

    private var isVictory: Bool {
        guard let record = matchRecord,
              let currentUserId = appState.player?.id else {
            return false
        }
        return record.winnerId == currentUserId
    }

    private var playerFinalHp: Int {
        guard let record = matchRecord,
              let currentUserId = appState.player?.id else { return 0 }
        return record.player1Id == currentUserId
            ? record.player1FinalHp
            : record.player2FinalHp
    }

    private var opponentFinalHp: Int {
        guard let record = matchRecord,
              let currentUserId = appState.player?.id else { return 0 }
        return record.player1Id == currentUserId
            ? record.player2FinalHp
            : record.player1FinalHp
    }

    private var xpEarned: Int {
        isVictory ? 25 : 10
    }

    private var dustEarned: Int {
        isVictory ? 5 : 2
    }

    private var energyEarned: Int {
        isVictory ? 2 : 1
    }

    // MARK: - Helpers

    private func endReasonText(_ reason: EndReason?) -> String {
        guard let reason else { return "" }
        switch reason {
        case .hpZero: return "Health reduced to zero"
        case .surrender: return "Opponent surrendered"
        case .disconnect: return "Opponent disconnected"
        case .timeout: return "Opponent timed out"
        }
    }

    private func formatDuration(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let secs = seconds % 60
        return String(format: "%d:%02d", minutes, secs)
    }
}

#Preview("Victory") {
    PostMatchView(matchId: nil)
        .environment(AppState())
        .environment(AppRouter())
        .preferredColorScheme(.dark)
}

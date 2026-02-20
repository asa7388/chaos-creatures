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
        ZStack {
            LinearGradient(
                colors: isVictory
                    ? [Color.orderBlue.opacity(0.3), Color.bgPrimary]
                    : [Color.chaosRed.opacity(0.3), Color.bgPrimary],
                startPoint: .top,
                endPoint: .bottom
            )

            Image("UIBackgrounds/bg-dark-leather")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .ignoresSafeArea()
                .opacity(0.35)
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            Spacer()
            ChaosMoteSpinner(size: 36, tint: isVictory ? .orderBlue : .chaosRed)
            Text("Loading results...")
                .font(CardFont.body(size: 16))
                .foregroundColor(.textSecondary)
            Spacer()
        }
    }

    // MARK: - Error View

    private func errorView(_ error: String) -> some View {
        VStack(spacing: 20) {
            Spacer()

            Image("UIIcons/ui-defeat")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 48, height: 48)
                .foregroundColor(.warningYellow)

            Text("Could not load match results")
                .font(CardFont.bodyBold(size: 18))
                .foregroundColor(.textPrimary)

            Text(error)
                .font(CardFont.body(size: 14))
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
            Image(isVictory ? "UIIcons/ui-victory" : "UIIcons/ui-defeat")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 64, height: 64)
                .foregroundColor(isVictory ? .tauntGold : .chaosRed)

            // Title
            Text(isVictory ? "VICTORY" : "DEFEAT")
                .font(CardFont.displayTitle(size: 40))
                .foregroundColor(isVictory ? .tauntGold : .chaosRed)

            // Subtitle
            if let record = matchRecord {
                Text(endReasonText(record.endReason))
                    .font(CardFont.body(size: 15))
                    .foregroundColor(.textSecondary)
            }
        }
    }

    // MARK: - Match Stats

    private var matchStatsView: some View {
        VStack(spacing: 12) {
            Text("Match Stats")
                .font(CardFont.cardName(size: 16))
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
                .font(CardFont.stats(size: 20))
                .foregroundColor(.textPrimary)
            Text(title)
                .font(CardFont.body(size: 11))
                .foregroundColor(.textTertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - S-38: Rewards (mode-aware)

    private var rewardsView: some View {
        VStack(spacing: 12) {
            if isPracticeMode {
                // Practice mode: no rewards earned
                practiceRewardsView
            } else {
                // PvP mode: show actual rewards based on win/loss and mode
                pvpRewardsView
            }
        }
        .padding(16)
        .background(Color.bgSecondary.opacity(0.8))
        .cornerRadius(12)
    }

    private var practiceRewardsView: some View {
        VStack(spacing: 8) {
            Text("Practice Match")
                .font(CardFont.cardName(size: 16))
                .foregroundColor(.textPrimary)

            Text("No rewards in practice mode. Play Ranked or Casual to earn XP, Dust, and Chaos Energy!")
                .font(CardFont.body(size: 13))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 8)

            // Still show energy earned (all 20 deck cards gain energy even in practice)
            HStack(spacing: 6) {
                Image("StatIcons/chaos-motes")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 14, height: 14)
                    .foregroundColor(.warningYellow)
                Text("All deck cards earned +\(energyEarned) Chaos Energy")
                    .font(CardFont.body(size: 13))
                    .foregroundColor(.warningYellow)
            }
            .padding(.top, 4)
        }
    }

    private var pvpRewardsView: some View {
        VStack(spacing: 12) {
            Text("Rewards")
                .font(CardFont.cardName(size: 16))
                .foregroundColor(.textPrimary)

            HStack(spacing: 20) {
                rewardItem(
                    icon: "UIIcons/ui-mission-trophy",
                    label: "XP",
                    value: "+\(xpEarned)",
                    color: .orderBlue,
                    isCustomAsset: true
                )

                rewardItem(
                    icon: "UIIcons/ui-crystal-shard",
                    label: "Dust",
                    value: "+\(dustEarned)",
                    color: .ironwright,
                    isCustomAsset: true
                )

                rewardItem(
                    icon: "StatIcons/chaos-motes",
                    label: "Energy",
                    value: "+\(energyEarned)/card",
                    color: .warningYellow,
                    isCustomAsset: true
                )
            }

            // Ranked mode bonus info
            if matchRecord?.gameMode == .ranked {
                HStack(spacing: 8) {
                    Image(isVictory ? "UIIcons/ui-victory" : "UIIcons/ui-defeat")
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 16, height: 16)
                        .foregroundColor(isVictory ? .orderBlue : .chaosRed)
                    Text(isVictory ? "Rank Points +15" : "Rank Points -10")
                        .font(CardFont.bodyBold(size: 14))
                        .foregroundColor(isVictory ? .orderBlue : .chaosRed)
                }
                .padding(.top, 4)
            }

            // Energy explanation
            Text("All 20 deck cards gained +\(energyEarned) Chaos Energy")
                .font(CardFont.body(size: 11))
                .foregroundColor(.textTertiary)
                .padding(.top, 2)
        }
    }

    private func rewardItem(icon: String, label: String, value: String, color: Color, isCustomAsset: Bool) -> some View {
        VStack(spacing: 6) {
            if isCustomAsset {
                Image(icon)
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 24, height: 24)
                    .foregroundColor(color)
            } else {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
            }

            Text(value)
                .font(CardFont.stats(size: 18))
                .foregroundColor(.textPrimary)

            Text(label)
                .font(CardFont.body(size: 11))
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
                .font(CardFont.bodyBold(size: 18))
                .foregroundColor(.textPrimary)
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

        // Practice matches don't save match records to Supabase,
        // so skip the fetch and show results based on router state
        if router.selectedGameMode == .practice {
            isLoading = false
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

    /// S-38: Whether this was a practice match
    private var isPracticeMode: Bool {
        if let record = matchRecord {
            return record.gameMode == .practice
        }
        // Fallback to router's selected mode if no record loaded
        return router.selectedGameMode == .practice
    }

    /// S-38: XP earned — based on mode and win/loss
    /// Source: docs/design/04-progression-economy.md
    /// Ranked: 30 win / 15 loss, Casual: 25 win / 10 loss, Practice: 0
    private var xpEarned: Int {
        guard !isPracticeMode else { return 0 }
        let isRanked = matchRecord?.gameMode == .ranked
        if isRanked {
            return isVictory ? 30 : 15
        }
        return isVictory ? 25 : 10
    }

    /// S-38: Dust earned — based on mode and win/loss
    /// Ranked: 8 win / 3 loss, Casual: 5 win / 2 loss, Practice: 0
    private var dustEarned: Int {
        guard !isPracticeMode else { return 0 }
        let isRanked = matchRecord?.gameMode == .ranked
        if isRanked {
            return isVictory ? 8 : 3
        }
        return isVictory ? 5 : 2
    }

    /// S-38: Chaos energy per card — 2 win / 1 loss (all modes including practice)
    /// Source: packages/game-server/src/engine/constants.ts
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

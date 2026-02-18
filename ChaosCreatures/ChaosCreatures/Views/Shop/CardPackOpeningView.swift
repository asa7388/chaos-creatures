// CardPackOpeningView.swift
// Chaos Creatures
// Pack reveal animation with card fan reveal.
// Players purchase a pack with Chaos Dust, then watch cards revealed one-by-one.
// Now uses CardFrameView for revealed cards and CardFont for themed typography.
// Source: docs/design/07-ui-ux-specs.md Section 6, 09-monetization-details.md

import SwiftUI

// MARK: - Pack Type

enum PackType: String, CaseIterable, Identifiable {
    case starter = "STARTER"
    case rare = "RARE"
    case epic = "EPIC"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .starter: return "Starter Pack"
        case .rare: return "Rare Pack"
        case .epic: return "Epic Pack"
        }
    }

    var cardCount: Int {
        switch self {
        case .starter: return 5
        case .rare: return 3
        case .epic: return 3
        }
    }

    var dustCost: Int {
        switch self {
        case .starter: return 100
        case .rare: return 250
        case .epic: return 500
        }
    }

    var guaranteedMinTier: EvolutionTier {
        switch self {
        case .starter: return .common
        case .rare: return .rare
        case .epic: return .epic
        }
    }

    var iconName: String {
        switch self {
        case .starter: return "gift.fill"
        case .rare: return "star.fill"
        case .epic: return "sparkles"
        }
    }

    var color: Color {
        switch self {
        case .starter: return .rarityUncommon
        case .rare: return .rarityRare
        case .epic: return .rarityEpic
        }
    }
}

// MARK: - Opening Phase

private enum OpeningPhase: Equatable {
    case idle
    case purchasing
    case packAppearing
    case revealing(Int)  // index of card being revealed
    case allRevealed
}

struct CardPackOpeningView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    let packType: PackType

    @State private var phase: OpeningPhase = .idle
    @State private var revealedCards: [CardInstance] = []
    @State private var error: String?
    @State private var packScale: CGFloat = 0.0
    @State private var packRotation: Double = 0.0
    @State private var packOpacity: Double = 1.0
    @State private var cardOffsets: [CGFloat] = []
    @State private var cardScales: [CGFloat] = []
    @State private var cardOpacities: [Double] = []
    @State private var showGlow = false

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color.bgPrimary.ignoresSafeArea()

                // Particle glow behind pack
                if showGlow {
                    RadialGradient(
                        colors: [packType.color.opacity(0.4), .clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 200
                    )
                    .ignoresSafeArea()
                    .transition(.opacity)
                }

                VStack(spacing: 24) {
                    Spacer()

                    // Pack or cards display
                    switch phase {
                    case .idle:
                        packPreview

                    case .purchasing:
                        VStack(spacing: 16) {
                            ProgressView()
                                .scaleEffect(1.5)
                                .tint(packType.color)
                            Text("Opening pack...")
                                .font(CardFont.body(size: 16))
                                .foregroundColor(.textSecondary)
                        }

                    case .packAppearing:
                        packAnimation

                    case .revealing, .allRevealed:
                        cardRevealArea

                    }

                    Spacer()

                    // Action buttons
                    actionButtons
                }
                .padding(.horizontal, 16)
            }
            .navigationTitle(packType.displayName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.textSecondary)
                }
            }
            .alert("Error", isPresented: .constant(error != nil)) {
                Button("OK") { error = nil }
            } message: {
                if let error {
                    Text(error)
                }
            }
        }
    }

    // MARK: - Pack Preview (Idle)

    private var packPreview: some View {
        VStack(spacing: 16) {
            // Pack icon
            ZStack {
                Circle()
                    .fill(packType.color.opacity(0.15))
                    .frame(width: 120, height: 120)

                Image(systemName: packType.iconName)
                    .font(.system(size: 48))
                    .foregroundColor(packType.color)
            }

            Text(packType.displayName)
                .font(CardFont.cardName(size: 22))
                .foregroundColor(.textPrimary)

            Text(packDescription)
                .font(CardFont.body(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)

            // Cost display
            HStack(spacing: 4) {
                Image(systemName: "sparkle")
                    .foregroundColor(.tauntGold)
                Text("\(packType.dustCost) Chaos Dust")
                    .font(CardFont.bodyBold(size: 16))
                    .foregroundColor(.tauntGold)
            }

            // Balance
            if let dust = appState.player?.chaosDust {
                Text("Your balance: \(dust)")
                    .font(CardFont.body(size: 12))
                    .foregroundColor(.textTertiary)
            }
        }
    }

    private var packDescription: String {
        switch packType {
        case .starter:
            return "\(packType.cardCount) random cards from your faction."
        case .rare:
            return "\(packType.cardCount) cards, guaranteed 1 Rare or better."
        case .epic:
            return "\(packType.cardCount) cards, guaranteed 1 Epic or better."
        }
    }

    // MARK: - Pack Animation

    private var packAnimation: some View {
        ZStack {
            Circle()
                .fill(packType.color.opacity(0.15))
                .frame(width: 160, height: 160)

            Image(systemName: packType.iconName)
                .font(.system(size: 64))
                .foregroundColor(packType.color)
                .scaleEffect(packScale)
                .rotationEffect(.degrees(packRotation))
                .opacity(packOpacity)
        }
    }

    // MARK: - Card Reveal

    private var cardRevealArea: some View {
        VStack(spacing: 20) {
            // Card fan
            ZStack {
                ForEach(Array(revealedCards.enumerated()), id: \.element.id) { index, card in
                    revealedCard(card: card, index: index)
                }
            }
            .frame(height: 280)

            // Card info for current reveal
            if case .revealing(let currentIndex) = phase,
               currentIndex < revealedCards.count {
                let card = revealedCards[currentIndex]
                VStack(spacing: 4) {
                    Text(card.currentName)
                        .font(CardFont.cardName(size: 18))
                        .foregroundColor(.textPrimary)

                    HStack(spacing: 8) {
                        Text(card.tier.displayName)
                            .font(CardFont.bodyBold(size: 13))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color.tierColor(card.tier))
                            .cornerRadius(6)

                        if let atk = card.currentAttack, let hp = card.currentHealth {
                            Text("\(atk)/\(hp)")
                                .font(CardFont.stats(size: 13))
                                .foregroundColor(.textSecondary)
                        }

                        Text("\(card.currentManaCost) CM")
                            .font(CardFont.stats(size: 13))
                            .foregroundColor(.orderBlue)
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .bottom)))
            }

            // Summary for all revealed
            if phase == .allRevealed {
                VStack(spacing: 4) {
                    Text("Pack Complete!")
                        .font(CardFont.cardName(size: 18))
                        .foregroundColor(.tauntGold)
                    Text("\(revealedCards.count) cards added to your collection")
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textSecondary)
                }
            }
        }
    }

    private func revealedCard(card: CardInstance, index: Int) -> some View {
        let totalCards = revealedCards.count
        let fanSpread: CGFloat = min(CGFloat(totalCards - 1) * 30, 120)
        let startOffset = -fanSpread / 2
        let offset = totalCards > 1
            ? startOffset + (fanSpread * CGFloat(index) / CGFloat(totalCards - 1))
            : 0

        let isCurrentReveal: Bool = {
            if case .revealing(let current) = phase { return index == current }
            return false
        }()

        let isRevealed: Bool = {
            switch phase {
            case .revealing(let current): return index <= current
            case .allRevealed: return true
            default: return false
            }
        }()

        return ZStack {
            // Card back (using card-back-universal asset)
            Image("card-back-universal")
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 90, height: 130)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.borderDefault, lineWidth: 1)
                )
                .opacity(isRevealed ? 0 : 1)

            // Card front — uses CardFrameView for professional rendering
            CardFrameView(
                data: CardDisplayData(instance: card),
                size: .hand
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(
                        isCurrentReveal ? packType.color : Color.clear,
                        lineWidth: isCurrentReveal ? 2 : 0
                    )
            )
            .opacity(isRevealed ? 1 : 0)
            .scaleEffect(isRevealed ? (index < cardScales.count ? cardScales[index] : 1.0) : 0.5)
        }
        .offset(x: isRevealed ? offset : 0)
        .animation(.spring(response: 0.5, dampingFraction: 0.7), value: isRevealed)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isCurrentReveal)
    }

    // MARK: - Action Buttons

    private var actionButtons: some View {
        VStack(spacing: 12) {
            switch phase {
            case .idle:
                let canAfford = (appState.player?.chaosDust ?? 0) >= packType.dustCost

                Button(action: {
                    Task { await openPack() }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "sparkle")
                        Text("Open for \(packType.dustCost) Dust")
                    }
                    .font(CardFont.bodyBold(size: 16))
                    .foregroundColor(canAfford ? .black : .textDisabled)
                    .frame(maxWidth: .infinity, minHeight: 50)
                    .background(canAfford ? packType.color : Color.bgQuaternary)
                    .cornerRadius(12)
                }
                .disabled(!canAfford)

                if !canAfford {
                    Text("Not enough Chaos Dust")
                        .font(CardFont.body(size: 12))
                        .foregroundColor(.warningYellow)
                }

            case .purchasing:
                EmptyView()

            case .packAppearing:
                EmptyView()

            case .revealing(let index):
                if index < revealedCards.count - 1 {
                    Button(action: {
                        revealNext()
                    }) {
                        Text("Tap to Reveal Next")
                            .font(CardFont.bodyBold(size: 16))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity, minHeight: 50)
                            .background(packType.color)
                            .cornerRadius(12)
                    }

                    Button(action: {
                        revealAll()
                    }) {
                        Text("Reveal All")
                            .font(CardFont.body(size: 14))
                            .foregroundColor(.textTertiary)
                    }
                } else {
                    Button(action: {
                        withAnimation {
                            phase = .allRevealed
                        }
                    }) {
                        Text("Continue")
                            .font(CardFont.bodyBold(size: 16))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity, minHeight: 50)
                            .background(packType.color)
                            .cornerRadius(12)
                    }
                }

            case .allRevealed:
                let canAffordAnother = (appState.player?.chaosDust ?? 0) >= packType.dustCost

                Button(action: { dismiss() }) {
                    Text("Done")
                        .font(CardFont.bodyBold(size: 16))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .background(packType.color)
                        .cornerRadius(12)
                }

                if canAffordAnother {
                    Button(action: {
                        resetAndReopen()
                    }) {
                        Text("Open Another (\(packType.dustCost) Dust)")
                            .font(CardFont.body(size: 14))
                            .foregroundColor(packType.color)
                    }
                }
            }
        }
        .padding(.bottom, 24)
    }

    // MARK: - Pack Opening Logic

    private func openPack() async {
        phase = .purchasing

        do {
            let factionId = appState.player?.primaryFactionId?.uuidString ?? FactionShortName.ironwright.rawValue

            let result = try await CollectionService.shared.openPack(factionId: factionId)

            revealedCards = result.cards

            // Initialize animation arrays
            cardOffsets = Array(repeating: CGFloat(0), count: revealedCards.count)
            cardScales = Array(repeating: CGFloat(1.0), count: revealedCards.count)
            cardOpacities = Array(repeating: 0.0, count: revealedCards.count)

            // Run pack appear animation
            await runPackAppearAnimation()

            // Refresh player dust balance
            await appState.refreshPlayer()

        } catch {
            self.error = "Failed to open pack: \(error.localizedDescription)"
            phase = .idle
        }
    }

    private func runPackAppearAnimation() async {
        phase = .packAppearing
        packScale = 0
        packRotation = -30
        packOpacity = 1

        withAnimation(.spring(response: 0.6, dampingFraction: 0.6)) {
            packScale = 1.2
            packRotation = 0
            showGlow = true
        }

        try? await Task.sleep(nanoseconds: 600_000_000) // 0.6s

        // Shrink and burst
        withAnimation(.easeIn(duration: 0.3)) {
            packScale = 0.5
            packOpacity = 0
        }

        try? await Task.sleep(nanoseconds: 300_000_000) // 0.3s

        // Start revealing
        withAnimation {
            phase = .revealing(0)
            if !cardScales.isEmpty {
                cardScales[0] = 1.0
            }
        }
    }

    private func revealNext() {
        if case .revealing(let current) = phase {
            let next = current + 1
            if next < revealedCards.count {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                    phase = .revealing(next)
                    if next < cardScales.count {
                        cardScales[next] = 1.0
                    }
                }
            }
        }
    }

    private func revealAll() {
        withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
            for i in cardScales.indices {
                cardScales[i] = 1.0
            }
            phase = .allRevealed
        }
    }

    private func resetAndReopen() {
        revealedCards = []
        cardOffsets = []
        cardScales = []
        cardOpacities = []
        showGlow = false
        packScale = 0
        packRotation = 0
        packOpacity = 1
        phase = .idle

        Task { await openPack() }
    }
}

#Preview {
    CardPackOpeningView(packType: .rare)
        .environment(AppState())
}

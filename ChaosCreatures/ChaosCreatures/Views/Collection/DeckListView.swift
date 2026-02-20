// DeckListView.swift
// Chaos Creatures
// List of player's saved decks with create/edit/delete.
// Source: docs/design/07-ui-ux-specs.md Section 5.3

import SwiftUI

struct DeckListView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    @State private var decks: [Deck] = []
    @State private var isLoading = false
    @State private var error: String?

    private var maxDeckSlots: Int {
        appState.player?.subscriptionTier.maxDeckSlots ?? 3
    }

    var body: some View {
        Group {
            if isLoading {
                LoadingView("Loading decks...")
            } else if let error {
                ErrorView(message: error) {
                    Task { await loadDecks() }
                }
            } else if decks.isEmpty {
                EmptyStateView(
                    icon: "square.stack.3d.up.fill",
                    message: "No decks yet",
                    description: "Create your first deck to start playing!",
                    actionTitle: "Create Deck"
                ) {
                    router.decksNavigationPath.append(DecksDestination.deckBuilder(nil))
                }
            } else {
                deckList
            }
        }
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-dark-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.35)
            }
        )
        .navigationTitle("My Decks")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 16) {
                    if decks.count < maxDeckSlots {
                        Button(action: {
                            router.decksNavigationPath.append(DecksDestination.deckBuilder(nil))
                        }) {
                            ThemedGlyph(symbol: "plus", size: 14, color: .textSecondary)
                        }
                    }
                    NavigationLink(value: DecksDestination.settings) {
                        ThemedGlyph(symbol: "gearshape.fill", size: 14, color: .textSecondary)
                    }
                }
            }
        }
        .task {
            await loadDecks()
        }
    }

    // MARK: - Deck List

    private var deckList: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Deck count header
                HStack {
                    Text("Decks")
                        .font(CardFont.bodyBold(size: 14))
                        .foregroundColor(.textSecondary)
                    Spacer()
                    Text("\(decks.count)/\(maxDeckSlots) slots")
                        .font(CardFont.body(size: 13))
                        .foregroundColor(.textTertiary)
                }
                .padding(.horizontal, 16)

                ForEach(decks) { deck in
                    Button(action: {
                        // S-24: Set the selected deck so DeckBuilderView can load it
                        router.selectedDeck = deck
                        router.decksNavigationPath.append(DecksDestination.deckBuilder(deck.id))
                    }) {
                        DeckRowView(
                            deck: deck,
                            faction: appState.factions.first(where: { $0.id == deck.factionId })?.shortName
                        )
                    }
                    .padding(.horizontal, 16)
                }

                // Create new deck button
                if decks.count < maxDeckSlots {
                    Button(action: {
                        router.decksNavigationPath.append(DecksDestination.deckBuilder(nil))
                    }) {
                        HStack(spacing: 8) {
                            ThemedGlyph(symbol: "plus.circle.fill", size: 18, color: .tauntGold)
                            Text("Create New Deck")
                                .font(CardFont.body(size: 15))
                                .foregroundColor(.textPrimary)
                        }
                        .frame(maxWidth: .infinity, minHeight: 52)
                    }
                    .buttonStyle(CardstockButtonStyle())
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.tauntGold.opacity(0.28), lineWidth: 0.8)
                    )
                    .padding(.horizontal, 16)
                }
            }
            .padding(.vertical, 8)
            .padding(.bottom, 80)
        }
    }

    // MARK: - Data Loading

    private func loadDecks() async {
        guard let playerId = appState.player?.id else { return }

        #if DEBUG
        if appState.isDevMode {
            decks = buildDevModeDecks(playerId: playerId)
            return
        }
        #endif

        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            decks = try await CollectionService.shared.fetchDecks(playerId: playerId)
        } catch {
            self.error = "Failed to load decks: \(error.localizedDescription)"
        }
    }

    #if DEBUG
    private func buildDevModeDecks(playerId: UUID) -> [Deck] {
        guard let factionId = appState.factions.first?.id else { return [] }
        let now = Date()

        // Build a 20-card deck from dev cards so the Decks UI is visually testable in dev mode.
        let seedEntries = Array(appState.devCards.prefix(10)).map { card in
            DeckEntry(cardInstanceId: card.id, quantity: 2)
        }

        return [
            Deck(
                id: UUID(),
                ownerId: playerId,
                name: "Foundry Vanguard",
                factionId: factionId,
                avatarId: UUID(),
                cardEntries: seedEntries,
                isValid: true,
                validationErrors: [],
                gamesPlayed: 18,
                wins: 11,
                losses: 7,
                createdAt: now.addingTimeInterval(-86_400),
                updatedAt: now
            )
        ]
    }
    #endif
}

// MARK: - Deck Row

struct DeckRowView: View {
    let deck: Deck
    let faction: FactionShortName?

    var body: some View {
        HStack(spacing: 12) {
            // Faction icon
            if let faction {
                Image(faction.emblemAssetName)
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 24, height: 24)
                    .foregroundColor(faction.swiftUIColor)
                    .frame(width: 40, height: 40)
                    .background(faction.swiftUIColor.opacity(0.15))
                    .cornerRadius(10)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(deck.name)
                    .font(CardFont.cardName(size: 16))
                    .foregroundColor(.textPrimary)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    Text("\(deck.totalCards)/20 cards")
                        .font(CardFont.body(size: 12))
                        .foregroundColor(deck.totalCards == 20 ? .textSecondary : .warningYellow)

                    if deck.isValid {
                        Text("VALID")
                            .font(CardFont.bodyBold(size: 10))
                            .foregroundColor(.healGreen)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.healGreen.opacity(0.15))
                            .cornerRadius(4)
                    }
                }
            }

            Spacer()

            ThemedGlyph(symbol: "chevron.right", size: 13, color: .textTertiary)
        }
        .padding(16)
        .leatherPanel()
    }
}

#Preview {
    NavigationStack {
        DeckListView()
    }
    .environment(AppState())
    .environment(AppRouter())
}

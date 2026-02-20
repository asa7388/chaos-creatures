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
                            Image(systemName: "plus")
                                .foregroundColor(.textSecondary)
                        }
                    }
                    NavigationLink(value: DecksDestination.settings) {
                        Image(systemName: "gearshape.fill")
                            .foregroundColor(.textSecondary)
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
                        DeckRowView(deck: deck)
                    }
                    .padding(.horizontal, 16)
                }

                // Create new deck button
                if decks.count < maxDeckSlots {
                    Button(action: {
                        router.decksNavigationPath.append(DecksDestination.deckBuilder(nil))
                    }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 20))  // SF Symbol icon size - keep as-is
                            Text("Create New Deck")
                                .font(CardFont.body(size: 15))
                        }
                        .foregroundColor(.orderBlue)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(Color.orderBlue.opacity(0.1))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [6]))
                                .foregroundColor(.orderBlue.opacity(0.3))
                        )
                    }
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
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            decks = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.decks,
                filters: [("player_id", playerId.uuidString)],
                orderBy: "updated_at",
                ascending: false
            )
        } catch {
            self.error = "Failed to load decks: \(error.localizedDescription)"
        }
    }
}

// MARK: - Deck Row

struct DeckRowView: View {
    let deck: Deck

    var body: some View {
        HStack(spacing: 12) {
            // Faction icon
            if let faction = FactionShortName(rawValue: deck.factionId.uuidString) {
                Image(systemName: faction.systemIconName)
                    .font(.system(size: 20))  // SF Symbol icon size - keep as-is
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

            Image(systemName: "chevron.right")
                .font(.system(size: 13))  // SF Symbol icon size - keep as-is
                .foregroundColor(.textTertiary)
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

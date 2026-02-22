// AppRouter.swift
// Chaos Creatures
// Navigation state machine handling onboarding, auth, and main app flows.
// Source: docs/design/07-ui-ux-specs.md Section 2

import SwiftUI

@MainActor @Observable
final class AppRouter {
    // MARK: - Root Screen

    enum RootScreen: Equatable {
        case splash
        case signIn
        case onboarding
        case main
    }

    var rootScreen: RootScreen = .splash

    // MARK: - Modal Presentations

    var showBattle = false
    var showEvolution = false
    var showCardDetail = false

    // MARK: - Battle Flow

    var matchID: String?
    var selectedGameMode: GameMode = .casual
    var showMatchmaking = false
    var showPostMatch = false

    // MARK: - Detail Navigation

    var selectedCardInstance: CardInstance?
    var selectedCardFaction: CardFaction?
    var selectedDeck: Deck?

    // MARK: - Navigation Paths (per tab)

    var homeNavigationPath = NavigationPath()
    var collectionNavigationPath = NavigationPath()
    var decksNavigationPath = NavigationPath()
    var profileNavigationPath = NavigationPath()
    var shopNavigationPath = NavigationPath()

    // MARK: - Route Determination

    /// Determine root screen based on app state
    func determineRootScreen(appState: AppState) {
        #if DEBUG
        if appState.isDevMode {
            rootScreen = .main
            return
        }
        #endif
        if appState.isInitializing {
            rootScreen = .splash
        } else if !appState.auth.isAuthenticated {
            rootScreen = .signIn
        } else if appState.needsOnboarding {
            rootScreen = .onboarding
        } else {
            rootScreen = .main
        }
    }

    // MARK: - Navigation Actions

    func navigateToCardDetail(_ card: CardInstance, faction: CardFaction? = nil) {
        selectedCardInstance = card
        selectedCardFaction = faction
        showCardDetail = true
    }

    func navigateToEvolution(_ card: CardInstance, faction: CardFaction? = nil) {
        selectedCardInstance = card
        selectedCardFaction = faction
        showEvolution = true
    }

    func navigateToBattle(matchID: String) {
        self.matchID = matchID
        showMatchmaking = false
        showBattle = true
    }

    func dismissBattle() {
        showBattle = false
        showPostMatch = true
    }

    func dismissPostMatch() {
        showPostMatch = false
        matchID = nil
    }

    func startMatchmaking(mode: GameMode) {
        selectedGameMode = mode
        showMatchmaking = true
    }

    /// Reset all navigation state (e.g., on sign out)
    func reset() {
        rootScreen = .signIn
        showBattle = false
        showEvolution = false
        showCardDetail = false
        showMatchmaking = false
        showPostMatch = false
        matchID = nil
        selectedCardInstance = nil
        selectedCardFaction = nil
        selectedDeck = nil
        homeNavigationPath = NavigationPath()
        collectionNavigationPath = NavigationPath()
        decksNavigationPath = NavigationPath()
        profileNavigationPath = NavigationPath()
        shopNavigationPath = NavigationPath()
    }
}

// MARK: - Navigation Destinations (for type-safe routing)

enum HomeDestination: Hashable {
    case modeSelection
    case settings
}

enum CollectionDestination: Hashable {
    case cardDetail(UUID)
    case settings
}

enum DecksDestination: Hashable {
    case deckBuilder(UUID?)
    case settings
}

enum ProfileDestination: Hashable {
    case achievements
    case settings
}

enum ShopDestination: Hashable {
    case subscription
    case cardPackOpening
    case settings
}

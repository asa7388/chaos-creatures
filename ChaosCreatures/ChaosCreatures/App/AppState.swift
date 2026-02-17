// AppState.swift
// Chaos Creatures
// Central app state using @Observable (iOS 17+).
// Holds auth state, player data, loading states, and toast notifications.
// Source: docs/design/06-technical-architecture.md, 07-ui-ux-specs.md

import SwiftUI

@MainActor @Observable
final class AppState {
    // MARK: - Auth State

    let auth = AuthService()

    // MARK: - Player Data

    var player: Player?
    var factions: [Faction] = []
    var activeMissions: [Mission] = []

    // MARK: - Loading States

    var isInitializing = true
    var isLoadingPlayer = false
    var error: String?

    // MARK: - Toast Notifications

    var showToast = false
    var toastMessage = ""
    var toastType: ToastType = .info

    // MARK: - Navigation

    var selectedTab: AppTab = .home

    // MARK: - Initialization

    /// Called on app launch to restore session and load initial data
    func initialize() async {
        isInitializing = true
        defer { isInitializing = false }

        // Restore auth session
        await auth.restoreSession()
        auth.startAuthListener()

        // If authenticated, load player data
        if auth.isAuthenticated {
            await loadPlayerData()
        }
    }

    // MARK: - Player Data Loading

    /// Load player profile and related data from Supabase
    func loadPlayerData() async {
        guard auth.isAuthenticated else { return }
        isLoadingPlayer = true
        error = nil
        defer { isLoadingPlayer = false }

        do {
            guard let authId = await SupabaseService.shared.currentUserID else { return }

            // Fetch player profile
            let players: [Player] = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.players,
                filters: [("auth_id", authId.uuidString)],
                limit: 1
            )
            player = players.first

            // Fetch factions
            factions = try await SupabaseService.shared.fetchAll(
                from: SupabaseService.Table.factions,
                orderBy: "name"
            )

            // Fetch active missions
            if let playerId = player?.id {
                activeMissions = try await SupabaseService.shared.fetchAll(
                    from: SupabaseService.Table.missions,
                    filters: [
                        ("player_id", playerId.uuidString),
                        ("completed", "false")
                    ],
                    orderBy: "expires_at"
                )
            }
        } catch {
            self.error = "Failed to load profile: \(error.localizedDescription)"
        }
    }

    /// Refresh player data after a change
    func refreshPlayer() async {
        await loadPlayerData()
    }

    // MARK: - Toast Helpers

    func showToast(_ message: String, type: ToastType = .info) {
        toastMessage = message
        toastType = type
        withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
            showToast = true
        }
    }

    // MARK: - Onboarding

    var hasCompletedOnboarding: Bool {
        player?.primaryFactionId != nil
    }

    var needsOnboarding: Bool {
        auth.isAuthenticated && !hasCompletedOnboarding
    }
}

// MARK: - App Tabs

enum AppTab: String, CaseIterable, Identifiable {
    case home = "Home"
    case collection = "Collection"
    case decks = "Decks"
    case profile = "Profile"
    case shop = "Shop"

    var id: String { rawValue }

    var iconName: String {
        switch self {
        case .home: return "house.fill"
        case .collection: return "rectangle.stack.fill"
        case .decks: return "square.stack.3d.up.fill"
        case .profile: return "person.fill"
        case .shop: return "bag.fill"
        }
    }
}

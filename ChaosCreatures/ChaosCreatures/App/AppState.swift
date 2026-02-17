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

    // MARK: - Dev Mode (DEBUG only)

    #if DEBUG
    var isDevMode = false

    /// Skip auth and load mock data so all screens are visible in Simulator
    func enterDevMode() {
        let ironwrightId = UUID()
        let feyId = UUID()
        let demonicId = UUID()
        let now = Date()

        player = Player(
            id: UUID(),
            authId: UUID(),
            displayName: "DevPlayer",
            friendCode: "CHAOS-1234",
            subscriptionTier: .mid,
            primaryFactionId: ironwrightId,
            unlockedFactionIds: [ironwrightId, feyId, demonicId],
            onboardingComplete: true,
            playerLevel: 12,
            playerXp: 2450,
            seasonRank: .gold2,
            seasonRankPoints: 340,
            hiddenMmr: 1200,
            chaosDust: 1500,
            maxCardsPerFaction: 100,
            maxDeckSlots: 6,
            shardsUncommon: 8,
            shardsRare: 3,
            shardsEpic: 1,
            shardsLegendary: 0,
            showcaseCardIds: [],
            activeTitle: "Chaos Adept",
            totalGames: 47,
            totalWins: 28,
            totalLosses: 19,
            currentWinStreak: 3,
            bestWinStreak: 7,
            cardsEvolvedTotal: 5,
            highestTierReached: .rare,
            friendIds: [],
            settings: .default,
            createdAt: now,
            updatedAt: now
        )

        factions = [
            Faction(id: ironwrightId, name: "The Ironwright Collective", shortName: .ironwright, exclusiveMechanic: .augment, artPromptPrefix: "", flavorVoice: "", nameVoice: "", cardFrameAsset: "frame_ironwright", colorPrimary: "#C4A04E", colorSecondary: "#8B7635", colorBackground: "#1A1A2E", particleTheme: "sparks", battleMusicUrl: nil, ambientAudioUrl: nil, releasedAt: now, cardTemplateCount: 40, createdAt: now),
            Faction(id: feyId, name: "The Fey Courts", shortName: .feyCourts, exclusiveMechanic: .bond, artPromptPrefix: "", flavorVoice: "", nameVoice: "", cardFrameAsset: "frame_fey", colorPrimary: "#7CB342", colorSecondary: "#558B2F", colorBackground: "#1A2E1A", particleTheme: "leaves", battleMusicUrl: nil, ambientAudioUrl: nil, releasedAt: now, cardTemplateCount: 38, createdAt: now),
            Faction(id: demonicId, name: "The Demonic Kingdoms", shortName: .demonicKingdoms, exclusiveMechanic: .corruption, artPromptPrefix: "", flavorVoice: "", nameVoice: "", cardFrameAsset: "frame_demonic", colorPrimary: "#E53935", colorSecondary: "#B71C1C", colorBackground: "#2E1A1A", particleTheme: "embers", battleMusicUrl: nil, ambientAudioUrl: nil, releasedAt: now, cardTemplateCount: 35, createdAt: now),
        ]

        activeMissions = [
            Mission(id: UUID(), playerId: player!.id, missionType: .winGames, description: "Win 3 games", difficulty: .easy, period: .daily, targetValue: 3, currentValue: 1, isCompleted: false, isClaimed: false, rewardDust: 50, rewardShardTier: nil, rewardShardCount: 0, expiresAt: now.addingTimeInterval(86400), createdAt: now),
            Mission(id: UUID(), playerId: player!.id, missionType: .playCreatures, description: "Play 10 creatures", difficulty: .medium, period: .daily, targetValue: 10, currentValue: 6, isCompleted: false, isClaimed: false, rewardDust: 30, rewardShardTier: .uncommon, rewardShardCount: 1, expiresAt: now.addingTimeInterval(86400), createdAt: now),
        ]

        isDevMode = true
        isInitializing = false
    }
    #endif
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

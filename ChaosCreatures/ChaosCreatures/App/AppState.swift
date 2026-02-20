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
        #if DEBUG
        if CommandLine.arguments.contains("-devMode") {
            enterDevMode()
            if CommandLine.arguments.contains("-startCollection") {
                selectedTab = .collection
            }
            return
        }
        #endif

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
                        ("is_completed", "false")
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
    var devCards: [CardInstance] = []
    var devTemplateFactionMap: [UUID: UUID] = [:]

    /// Skip auth and load mock data so all screens are visible in Simulator
    func enterDevMode() {
        let ironwrightId = UUID()
        let feyId = UUID()
        let demonicId = UUID()
        let celestialId = UUID()
        let endlessId = UUID()
        let now = Date()

        player = Player(
            id: UUID(),
            authId: UUID(),
            displayName: "DevPlayer",
            friendCode: "CHAOS-1234",
            subscriptionTier: .mid,
            primaryFactionId: ironwrightId,
            unlockedFactionIds: [ironwrightId, feyId, demonicId, celestialId, endlessId],
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
            Faction(id: celestialId, name: "The Celestial Crusade", shortName: .celestialCrusade, exclusiveMechanic: .exalt, artPromptPrefix: "", flavorVoice: "", nameVoice: "", cardFrameAsset: "frame_celestial", colorPrimary: "#DAA520", colorSecondary: "#B8860B", colorBackground: "#2E2A1A", particleTheme: "light", battleMusicUrl: nil, ambientAudioUrl: nil, releasedAt: now, cardTemplateCount: 30, createdAt: now),
            Faction(id: endlessId, name: "The Endless", shortName: .theEndless, exclusiveMechanic: .persist, artPromptPrefix: "", flavorVoice: "", nameVoice: "", cardFrameAsset: "frame_endless", colorPrimary: "#6B3FA0", colorSecondary: "#5A2D8C", colorBackground: "#1A1A2E", particleTheme: "void", battleMusicUrl: nil, ambientAudioUrl: nil, releasedAt: now, cardTemplateCount: 28, createdAt: now),
        ]

        activeMissions = [
            Mission(id: UUID(), playerId: player!.id, missionType: .winGames, description: "Win 3 games", difficulty: .easy, period: .daily, targetValue: 3, currentValue: 1, isCompleted: false, isClaimed: false, rewardDust: 50, rewardShardTier: nil, rewardShardCount: 0, expiresAt: now.addingTimeInterval(86400), createdAt: now),
            Mission(id: UUID(), playerId: player!.id, missionType: .playCreatures, description: "Play 10 creatures", difficulty: .medium, period: .daily, targetValue: 10, currentValue: 6, isCompleted: false, isClaimed: false, rewardDust: 30, rewardShardTier: .uncommon, rewardShardCount: 1, expiresAt: now.addingTimeInterval(86400), createdAt: now),
        ]

        // Mock v18 test cards with real R2 art URLs
        let devPlayerId = player!.id
        let r2Base = "https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/cards/v18-test"

        struct DevCard {
            let name: String
            let fileName: String
            let factionId: UUID
            let cardType: CardType
            let atk: Int?
            let hp: Int
            let cm: Int
            let keywords: [String]
        }

        let devCardDefs: [DevCard] = [
            DevCard(name: "Rebar Golem", fileName: "V18-ironwright-rebar-golem.png", factionId: ironwrightId, cardType: .creature, atk: 5, hp: 3, cm: 4, keywords: ["HASTE"]),
            DevCard(name: "Void Welder", fileName: "V18-ironwright-void-welder.png", factionId: ironwrightId, cardType: .creature, atk: 3, hp: 4, cm: 3, keywords: ["SHIELD"]),
            DevCard(name: "Thornback Stag", fileName: "V18-fey-courts-thornback-stag.png", factionId: feyId, cardType: .creature, atk: 2, hp: 6, cm: 5, keywords: ["TAUNT"]),
            DevCard(name: "Briar Witch", fileName: "V18-fey-courts-briar-witch.png", factionId: feyId, cardType: .creature, atk: 3, hp: 4, cm: 3, keywords: ["LIFESTEAL"]),
            DevCard(name: "Infernal Bailiff", fileName: "V18-demonic-infernal-bailiff.png", factionId: demonicId, cardType: .creature, atk: 4, hp: 4, cm: 4, keywords: ["DEATHTOUCH"]),
            DevCard(name: "Ember Hound", fileName: "V18-demonic-ember-hound.png", factionId: demonicId, cardType: .creature, atk: 5, hp: 3, cm: 4, keywords: ["HASTE"]),
            DevCard(name: "Siege Seraph", fileName: "V18-celestial-crusade-siege-seraph.png", factionId: celestialId, cardType: .creature, atk: 5, hp: 3, cm: 4, keywords: ["FLYING"]),
            DevCard(name: "Chapel Warden", fileName: "V18-celestial-crusade-chapel-warden.png", factionId: celestialId, cardType: .creature, atk: 3, hp: 4, cm: 3, keywords: ["WARD"]),
            DevCard(name: "Bone Colossus", fileName: "V18-the-endless-bone-colossus.png", factionId: endlessId, cardType: .creature, atk: 2, hp: 6, cm: 5, keywords: ["TAUNT"]),
            DevCard(name: "Wailing Shade", fileName: "V18-the-endless-wailing-shade.png", factionId: endlessId, cardType: .creature, atk: 2, hp: 6, cm: 5, keywords: ["LIFESTEAL"]),
            DevCard(name: "The Resonance Spire", fileName: "V18-neutral-the-resonance-spire.png", factionId: ironwrightId, cardType: .planarRuin, atk: nil, hp: 8, cm: 3, keywords: []),
            DevCard(name: "The Sunken Archive", fileName: "V18-neutral-the-sunken-archive.png", factionId: feyId, cardType: .planarRuin, atk: nil, hp: 6, cm: 5, keywords: []),
        ]

        var mockCards: [CardInstance] = []
        var mockFactionMap: [UUID: UUID] = [:]
        for def in devCardDefs {
            let templateId = UUID()
            mockFactionMap[templateId] = def.factionId
            mockCards.append(CardInstance(
                id: UUID(),
                templateId: templateId,
                ownerId: devPlayerId,
                cardType: def.cardType,
                tier: .common,
                currentName: def.name,
                currentAttack: def.atk,
                currentHealth: def.hp,
                currentManaCost: def.cm,
                instabilityValue: 1,
                innateKeywords: def.keywords,
                modifierKeywords: [],
                evolutionHistory: [],
                modifiers: [],
                triggeredAbilities: [],
                chaosEnergy: 0,
                gamesPlayed: 0,
                artUrl: "\(r2Base)/\(def.fileName)",
                flavorText: "The forge remembers what the flesh forgets.",
                artPromptHistory: [],
                isFavorite: false,
                inDeckIds: [],
                createdAt: now,
                lastEvolvedAt: nil
            ))
        }
        devCards = mockCards
        devTemplateFactionMap = mockFactionMap

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

    var customIconName: String {
        switch self {
        case .home: return "FactionIcons/ui-home"
        case .collection: return "FactionIcons/ui-collection"
        case .decks: return "FactionIcons/ui-deck"
        case .profile: return "FactionIcons/ui-profile"
        case .shop: return "FactionIcons/ui-shop"
        }
    }
}

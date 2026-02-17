// AppRouter.swift
// Chaos Creatures
// TODO: Implement in Wave 1
// Navigation state machine handling onboarding, auth, and main app flows.

import SwiftUI

@MainActor
class AppRouter: ObservableObject {
    enum AppScreen {
        case onboarding
        case home
        case battle
    }

    @Published var currentScreen: AppScreen = .onboarding
    // TODO: Implement navigation logic
}

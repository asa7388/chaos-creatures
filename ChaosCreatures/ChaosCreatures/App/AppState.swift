// AppState.swift
// Chaos Creatures
// TODO: Implement in Wave 1
// ObservableObject holding auth state, player data, and global app state.

import SwiftUI

@MainActor
class AppState: ObservableObject {
    // TODO: Add @Published properties for auth state, player profile, loading states
    @Published var isAuthenticated = false
    @Published var isLoading = true
}

// AuthService.swift
// Chaos Creatures
// Apple Sign-In + Supabase Auth integration.
// Source: docs/design/06-technical-architecture.md Section 2.2

import AuthenticationServices
import Foundation
import Supabase

@MainActor @Observable
final class AuthService {
    // MARK: - Published State

    var session: Session?
    var isLoading = false
    var error: String?
    var isAuthenticated: Bool { session != nil }

    // MARK: - Private

    private let supabase = SupabaseService.shared.client

    // MARK: - Apple Sign-In

    /// Sign in with Apple via Supabase Auth
    func signInWithApple() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let session = try await supabase.auth.signInWithApple()
            self.session = session

            // Ensure player record exists (Edge Function creates if needed)
            try await ensurePlayerProfile()
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Session Management

    /// Restore existing session on app launch
    func restoreSession() async {
        isLoading = true
        defer { isLoading = false }

        do {
            session = try await supabase.auth.session
        } catch {
            session = nil
        }
    }

    /// Sign out and clear session
    func signOut() async {
        do {
            try await supabase.auth.signOut()
        } catch {
            // Best-effort sign out
        }
        session = nil
        error = nil
    }

    /// Refresh session token if needed
    func refreshSession() async {
        do {
            session = try await supabase.auth.refreshSession()
        } catch {
            // Token refresh failed, force sign out
            session = nil
        }
    }

    // MARK: - Account Management

    /// Delete user account (calls Edge Function for GDPR-compliant deletion)
    func deleteAccount() async throws {
        guard session != nil else { return }

        try await SupabaseService.shared.callFunction("player/delete-account")
        try await supabase.auth.signOut()
        session = nil
    }

    // MARK: - Private Helpers

    /// Ensure player profile exists in the players table after sign-in
    private func ensurePlayerProfile() async throws {
        struct EnsureRequest: Encodable {
            let action: String
        }
        try await SupabaseService.shared.callFunction(
            "player/ensure-profile",
            body: EnsureRequest(action: "ensure")
        )
    }
}

// MARK: - Auth State Listener

extension AuthService {
    /// Listen for auth state changes (call in app lifecycle)
    func startAuthListener() {
        Task { @MainActor in
            for await (event, session) in supabase.auth.authStateChanges {
                switch event {
                case .signedIn:
                    self.session = session
                case .signedOut:
                    self.session = nil
                case .tokenRefreshed:
                    self.session = session
                default:
                    break
                }
            }
        }
    }
}

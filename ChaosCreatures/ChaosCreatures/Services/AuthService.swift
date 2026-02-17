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

    /// Sign in with Apple via Supabase Auth (using ID token flow)
    /// Called from UI after Apple credential is obtained.
    func signInWithApple(idToken: String, nonce: String) async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let session = try await supabase.auth.signInWithIdToken(
                credentials: .init(
                    provider: .apple,
                    idToken: idToken,
                    nonce: nonce
                )
            )
            self.session = session

            // Ensure player record exists (Edge Function creates if needed)
            try await ensurePlayerProfile()
        } catch {
            self.error = error.localizedDescription
        }
    }

    /// Convenience wrapper: triggers the full Apple Sign In flow
    /// (ASAuthorizationController) and then passes the credential to Supabase.
    func signInWithApple() async {
        isLoading = true
        error = nil

        do {
            let helper = AppleSignInHelper()
            let credential = try await helper.performSignIn()
            guard let idTokenData = credential.identityToken,
                  let idToken = String(data: idTokenData, encoding: .utf8) else {
                self.error = "Failed to obtain Apple ID token."
                isLoading = false
                return
            }
            let nonce = helper.currentNonce
            // Delegate to the token-based method (which sets isLoading = false)
            await signInWithApple(idToken: idToken, nonce: nonce)
        } catch {
            self.error = error.localizedDescription
            isLoading = false
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

// MARK: - Apple Sign In Helper

import CryptoKit

/// Handles the ASAuthorizationController flow and returns the credential.
private final class AppleSignInHelper: NSObject, ASAuthorizationControllerDelegate {
    private var continuation: CheckedContinuation<ASAuthorizationAppleIDCredential, Error>?
    private(set) var currentNonce: String = ""

    @MainActor
    func performSignIn() async throws -> ASAuthorizationAppleIDCredential {
        currentNonce = Self.randomNonceString()
        let hashedNonce = Self.sha256(currentNonce)

        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = hashedNonce

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self

        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            controller.performRequests()
        }
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        if let credential = authorization.credential as? ASAuthorizationAppleIDCredential {
            continuation?.resume(returning: credential)
        } else {
            continuation?.resume(throwing: AuthError.invalidCredential)
        }
        continuation = nil
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        continuation?.resume(throwing: error)
        continuation = nil
    }

    private enum AuthError: Error {
        case invalidCredential
    }

    private static func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        var randomBytes = [UInt8](repeating: 0, count: length)
        _ = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        return String(randomBytes.map { charset[Int($0) % charset.count] })
    }

    private static func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        return hashedData.compactMap { String(format: "%02x", $0) }.joined()
    }
}

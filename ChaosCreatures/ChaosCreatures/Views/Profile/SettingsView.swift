// SettingsView.swift
// Chaos Creatures
// App settings: account, audio, visuals, gameplay, notifications, privacy.
// Source: docs/design/07-ui-ux-specs.md Section 14

import SwiftUI

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    // Audio
    @AppStorage("musicEnabled") private var musicEnabled = true
    @AppStorage("musicVolume") private var musicVolume = 0.7
    @AppStorage("sfxEnabled") private var sfxEnabled = true
    @AppStorage("sfxVolume") private var sfxVolume = 0.8

    // Visuals
    @AppStorage("colorblindMode") private var colorblindMode = "NONE"
    @AppStorage("reducedMotion") private var reducedMotion = false

    // Gameplay
    @AppStorage("confirmEndTurn") private var confirmEndTurn = false
    @AppStorage("extendedTimer") private var extendedTimer = false

    // Notifications
    @AppStorage("notifyEvolutionReady") private var notifyEvolutionReady = true
    @AppStorage("notifyDailyReset") private var notifyDailyReset = true
    @AppStorage("notifyMatchFound") private var notifyMatchFound = true

    // State
    @State private var showDeleteConfirmation = false
    @State private var showSignOutConfirmation = false

    var body: some View {
        Form {
            // Account
            Section("Account") {
                LabeledContent("Username", value: appState.player?.username ?? "Unknown")

                if let tier = appState.player?.subscriptionTier {
                    LabeledContent("Subscription", value: tier.displayName)
                }

                Button("Sign Out", role: .destructive) {
                    showSignOutConfirmation = true
                }

                Button("Delete Account", role: .destructive) {
                    showDeleteConfirmation = true
                }
            }

            // Audio
            Section("Audio") {
                Toggle("Music", isOn: $musicEnabled)
                if musicEnabled {
                    Slider(value: $musicVolume, in: 0...1) {
                        Text("Music Volume")
                    }
                }
                Toggle("Sound Effects", isOn: $sfxEnabled)
                if sfxEnabled {
                    Slider(value: $sfxVolume, in: 0...1) {
                        Text("SFX Volume")
                    }
                }
            }

            // Visuals
            Section("Visuals") {
                Picker("Colorblind Mode", selection: $colorblindMode) {
                    Text("None").tag("NONE")
                    Text("Deuteranopia").tag("DEUTERANOPIA")
                    Text("Protanopia").tag("PROTANOPIA")
                    Text("Tritanopia").tag("TRITANOPIA")
                }
                Toggle("Reduce Motion", isOn: $reducedMotion)
            }

            // Gameplay
            Section("Gameplay") {
                Toggle("Confirm Before End Turn", isOn: $confirmEndTurn)
                Toggle("Extended Timer (Casual/Practice)", isOn: $extendedTimer)
            }

            // Notifications
            Section("Notifications") {
                Toggle("Evolution Ready", isOn: $notifyEvolutionReady)
                Toggle("Daily Quests Reset", isOn: $notifyDailyReset)
                Toggle("Match Found", isOn: $notifyMatchFound)
            }

            // Privacy
            Section("Privacy & Legal") {
                Link("Privacy Policy", destination: URL(string: "https://chaoscreatures.app/privacy")!)
                Link("Terms of Service", destination: URL(string: "https://chaoscreatures.app/terms")!)
                Button("Export My Data") {
                    Task { await exportData() }
                }
            }

            // App info
            Section("About") {
                LabeledContent("Version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                LabeledContent("Build", value: Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1")
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.large)
        .alert("Sign Out?", isPresented: $showSignOutConfirmation) {
            Button("Sign Out", role: .destructive) {
                Task {
                    await appState.auth.signOut()
                    router.reset()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You will need to sign in again to access your account.")
        }
        .alert("Delete Account?", isPresented: $showDeleteConfirmation) {
            Button("Delete Forever", role: .destructive) {
                Task {
                    try? await appState.auth.deleteAccount()
                    router.reset()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will permanently delete your account and all your cards. This cannot be undone.")
        }
    }

    private func exportData() async {
        do {
            struct ExportResponse: Decodable {
                let url: String
            }
            let response: ExportResponse = try await SupabaseService.shared.callFunction("player/export-data")
            // In production, present ShareLink with the URL
            appState.showToast("Data export ready!", type: .success)
        } catch {
            appState.showToast("Export failed. Try again later.", type: .error)
        }
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
    .environment(AppState())
    .environment(AppRouter())
}

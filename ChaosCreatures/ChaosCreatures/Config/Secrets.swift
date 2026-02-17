// Secrets.swift
// Chaos Creatures
// TODO: Implement in Wave 1
// Reads API keys from Info.plist (set via .xcconfig).

import Foundation

enum Secrets {
    static var supabaseURL: String {
        Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
    }

    static var supabaseAnonKey: String {
        Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? ""
    }

    static var postHogAPIKey: String {
        Bundle.main.object(forInfoDictionaryKey: "POSTHOG_API_KEY") as? String ?? ""
    }

    static var r2PublicURL: String {
        Bundle.main.object(forInfoDictionaryKey: "R2_PUBLIC_URL") as? String ?? ""
    }

    static var gameServerURL: String {
        Bundle.main.object(forInfoDictionaryKey: "GAME_SERVER_URL") as? String ?? ""
    }
}

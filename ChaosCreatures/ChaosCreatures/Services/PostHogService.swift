// PostHogService.swift
// Chaos Creatures
// Analytics event tracking via PostHog.
// Lightweight wrapper with no third-party SDK — uses PostHog HTTP API directly.
// Source: docs/design/06-technical-architecture.md Section 2.7

import Foundation
import UIKit

final class PostHogService: @unchecked Sendable {
    static let shared = PostHogService()

    // MARK: - Configuration

    private let apiKey: String
    private let host = "https://us.i.posthog.com"
    private var distinctId: String?
    private var isEnabled = true

    // Queue for batching events
    private var eventQueue: [PostHogEvent] = []
    private let batchSize = 10
    private let flushInterval: TimeInterval = 30

    private var flushTimer: Task<Void, Never>?
    private let lock = NSLock()

    private init() {
        apiKey = Secrets.postHogAPIKey
        startFlushTimer()
    }

    // MARK: - Identity

    /// Identify the user (call after sign-in)
    func identify(userId: String, properties: [String: Any] = [:]) {
        distinctId = userId

        var payload: [String: Any] = [
            "api_key": apiKey,
            "distinct_id": userId,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "$set": properties
        ]

        // Add default properties
        let defaults = defaultProperties()
        var mergedProps = properties
        for (key, value) in defaults {
            mergedProps[key] = value
        }
        payload["$set"] = mergedProps

        sendToAPI(endpoint: "/capture", payload: [
            "api_key": apiKey,
            "distinct_id": userId,
            "event": "$identify",
            "properties": mergedProps,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ])
    }

    /// Reset identity (call on sign-out)
    func reset() {
        distinctId = nil
    }

    /// Enable or disable tracking
    func setEnabled(_ enabled: Bool) {
        isEnabled = enabled
    }

    // MARK: - Event Tracking

    /// Track a single event
    func track(event: String, properties: [String: Any] = [:]) {
        guard isEnabled, let distinctId else { return }

        var allProperties = defaultProperties()
        for (key, value) in properties {
            allProperties[key] = value
        }

        let posthogEvent = PostHogEvent(
            event: event,
            distinctId: distinctId,
            properties: allProperties,
            timestamp: Date()
        )

        lock.lock()
        eventQueue.append(posthogEvent)
        let shouldFlush = eventQueue.count >= batchSize
        lock.unlock()

        if shouldFlush {
            flush()
        }
    }

    // MARK: - Predefined Events

    /// Track app open
    func trackAppOpen() {
        track(event: "app_opened")
    }

    /// Track sign-in
    func trackSignIn(method: String = "apple") {
        track(event: "user_signed_in", properties: ["method": method])
    }

    /// Track match start
    func trackMatchStart(mode: String, faction: String) {
        track(event: "match_started", properties: [
            "game_mode": mode,
            "faction": faction
        ])
    }

    /// Track match end
    func trackMatchEnd(won: Bool, turns: Int, duration: TimeInterval) {
        track(event: "match_ended", properties: [
            "won": won,
            "turns": turns,
            "duration_seconds": Int(duration)
        ])
    }

    /// Track card evolution
    func trackEvolution(cardId: String, fromTier: String, toTier: String) {
        track(event: "card_evolved", properties: [
            "card_id": cardId,
            "from_tier": fromTier,
            "to_tier": toTier
        ])
    }

    /// Track pack purchase
    func trackPackPurchase(packType: String, dustCost: Int) {
        track(event: "pack_purchased", properties: [
            "pack_type": packType,
            "dust_cost": dustCost
        ])
    }

    /// Track subscription change
    func trackSubscription(tier: String, action: String) {
        track(event: "subscription_changed", properties: [
            "tier": tier,
            "action": action  // "purchased", "upgraded", "downgraded", "cancelled"
        ])
    }

    /// Track screen view
    func trackScreenView(screen: String) {
        track(event: "$screen", properties: [
            "$screen_name": screen
        ])
    }

    /// Track deck creation
    func trackDeckCreated(faction: String, cardCount: Int) {
        track(event: "deck_created", properties: [
            "faction": faction,
            "card_count": cardCount
        ])
    }

    /// Track chaos roll result
    func trackChaosRoll(result: String, instability: Int) {
        track(event: "chaos_roll", properties: [
            "result": result,
            "instability": instability
        ])
    }

    /// Track onboarding step
    func trackOnboarding(step: String, faction: String? = nil) {
        var props: [String: Any] = ["step": step]
        if let faction { props["faction"] = faction }
        track(event: "onboarding_step", properties: props)
    }

    // MARK: - Flush

    /// Flush queued events to PostHog
    func flush() {
        lock.lock()
        let events = eventQueue
        eventQueue.removeAll()
        lock.unlock()

        guard !events.isEmpty else { return }

        let batch = events.map { event -> [String: Any] in
            [
                "event": event.event,
                "distinct_id": event.distinctId,
                "properties": event.properties,
                "timestamp": ISO8601DateFormatter().string(from: event.timestamp)
            ]
        }

        sendToAPI(endpoint: "/batch", payload: [
            "api_key": apiKey,
            "batch": batch
        ])
    }

    // MARK: - Private

    private func startFlushTimer() {
        flushTimer = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(flushInterval * 1_000_000_000))
                flush()
            }
        }
    }

    private func defaultProperties() -> [String: Any] {
        [
            "$os": "iOS",
            "$os_version": UIDevice.current.systemVersion,
            "$app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown",
            "$app_build": Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "unknown",
            "$device_model": UIDevice.current.model,
            "$lib": "chaos-creatures-ios",
            "$lib_version": "1.0.0"
        ]
    }

    private func sendToAPI(endpoint: String, payload: [String: Any]) {
        guard let url = URL(string: host + endpoint) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            return
        }

        // Fire and forget
        URLSession.shared.dataTask(with: request) { _, _, _ in }.resume()
    }
}

// MARK: - Event Model

private struct PostHogEvent {
    let event: String
    let distinctId: String
    let properties: [String: Any]
    let timestamp: Date
}

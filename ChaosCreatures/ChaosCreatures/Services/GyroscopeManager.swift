// GyroscopeManager.swift
// Chaos Creatures
// Singleton that provides device tilt data for rarity foil effects.
// Uses CMMotionManager on real devices; falls back to a slow sine-wave
// animation in the Simulator where CoreMotion is unavailable.

import Foundation
import CoreMotion
import Combine

@MainActor
final class GyroscopeManager: ObservableObject {

    // MARK: - Singleton

    static let shared = GyroscopeManager()

    // MARK: - Published State

    /// Horizontal tilt clamped to ±0.6 radians per Section 6 of CARD_DESIGN_GUIDE.md
    @Published private(set) var tiltX: Double = 0
    /// Vertical tilt clamped to ±0.6 radians per Section 6 of CARD_DESIGN_GUIDE.md
    @Published private(set) var tiltY: Double = 0

    // MARK: - Private

    private let motionManager = CMMotionManager()
    private var isRunning = false
    private var referenceCount = 0
    private var simulatorTimer: Timer?

    /// Update interval: 60 Hz per Section 6 of CARD_DESIGN_GUIDE.md
    private let updateInterval: TimeInterval = 1.0 / 60.0

    // MARK: - Init

    private init() {}

    // MARK: - Public API (reference-counted start/stop)

    /// Call when a view that needs tilt data appears.
    func startIfNeeded() {
        referenceCount += 1
        guard !isRunning else { return }
        isRunning = true

        #if targetEnvironment(simulator)
        startSimulatorFallback()
        #else
        if motionManager.isDeviceMotionAvailable {
            startDeviceMotion()
        } else {
            startSimulatorFallback()
        }
        #endif
    }

    /// Call when a view that needs tilt data disappears.
    func stopIfUnneeded() {
        referenceCount = max(referenceCount - 1, 0)
        guard referenceCount == 0, isRunning else { return }
        isRunning = false

        #if targetEnvironment(simulator)
        stopSimulatorFallback()
        #else
        if motionManager.isDeviceMotionActive {
            motionManager.stopDeviceMotionUpdates()
        } else {
            stopSimulatorFallback()
        }
        #endif

        tiltX = 0
        tiltY = 0
    }

    // MARK: - Device Motion (Real Device)

    private func startDeviceMotion() {
        motionManager.deviceMotionUpdateInterval = updateInterval
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let self, let motion else { return }
            // attitude.roll = left/right tilt, attitude.pitch = forward/back tilt
            // Clamp to ±0.6 radians per Section 6 of CARD_DESIGN_GUIDE.md
            // Constrained to cardstock-like flex — not full device rotation range
            let clampedX = max(-0.6, min(0.6, motion.attitude.roll))
            let clampedY = max(-0.6, min(0.6, motion.attitude.pitch))
            Task { @MainActor in
                self.tiltX = clampedX
                self.tiltY = clampedY
            }
        }
    }

    // MARK: - Simulator Fallback (Slow Sine Wave)

    private func startSimulatorFallback() {
        let startTime = Date()
        simulatorTimer = Timer.scheduledTimer(withTimeInterval: updateInterval, repeats: true) { [weak self] _ in
            let elapsed = Date().timeIntervalSince(startTime)
            // Slow, gentle oscillation: ~6 second period for X, ~8 for Y
            let x = sin(elapsed * 2 * .pi / 6.0) * 0.4
            let y = sin(elapsed * 2 * .pi / 8.0 + 1.0) * 0.3
            Task { @MainActor in
                self?.tiltX = x
                self?.tiltY = y
            }
        }
    }

    private func stopSimulatorFallback() {
        simulatorTimer?.invalidate()
        simulatorTimer = nil
    }
}

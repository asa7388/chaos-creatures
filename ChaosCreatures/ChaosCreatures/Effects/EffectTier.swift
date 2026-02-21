import UIKit
import Metal
import CoreMotion

/// Determines the level of visual effects to apply based on device capabilities
/// and accessibility settings. Used by MetalCardEffectView and WaxSealView
/// to fall back gracefully on older devices or when accessibility is enabled.
enum EffectTier: Int, Comparable {
    case minimal = 0      // Reduce Motion ON or very old device — no animation, flat colors only
    case staticOnly = 1   // Metal unavailable — static SwiftUI effects only (holographic overlay)
    case shimmerOnly = 2  // Motion unavailable — Metal shaders but no gyroscope foil
    case full = 3         // Full Metal + gyroscope foil effects

    static func < (lhs: EffectTier, rhs: EffectTier) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}

/// Resolves the appropriate EffectTier for the current device and accessibility state.
/// Call once at app launch and cache the result.
func resolveEffectTier() -> EffectTier {
    // Reduce Motion takes highest priority
    if UIAccessibility.isReduceMotionEnabled {
        return .minimal
    }

    // Check Metal availability
    guard MTLCreateSystemDefaultDevice() != nil else {
        return .staticOnly
    }

    // Check gyroscope availability
    guard CMMotionManager().isDeviceMotionAvailable else {
        return .shimmerOnly
    }

    return .full
}

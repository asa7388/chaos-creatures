// CardDisplayState.swift
// Chaos Creatures
//
// Card visual state machine from Section 2.3 of CARD_DESIGN_GUIDE.md.
// State transitions and animation specifications are defined in Section 1.6.
//
// Implementation notes:
//   - The `default` case uses backtick quoting because `default` is a Swift keyword.
//   - summoning carries a progress float (0.0–1.0 = ink spread progress).
//   - foilActive carries tiltX/tiltY from CMMotionManager for foil shimmer on Legendary cards.
//   - damaged carries severity (0.0–1.0) to drive torn-edge overlay opacity.
//
// Transition durations (Section 1.6):
//   default → focused:    0.18s easeOut   (shadow radius 4→12pt, Y -2pt, scale 1.0→1.02)
//   focused → default:    0.25s spring(0.4, 0.7)
//   default → selected:   0.12s easeIn    (scale 1.0→0.97, frame glow 0→0.8)
//   selected → default:   0.3s  spring(0.35, 0.65)
//   default → tapped:     0.35s easeInOut (Y-axis flip phase 1: 0→90°)
//   default → previewed:  0.28s easeOut   (scale to preview size, dim 0→0.7)
//   previewed → default:  0.22s easeIn
//   default → inGraveyard:0.6s  easeIn    (saturation 1→0, brightness -0.15, Y +20pt)
//   default → summoning:  0.0s  — triggers ink spread compute shader
//   summoning → default:  0.4s  easeOut   (shader opacity 0→1)
//   default → damaged:    0.08s easeIn    (torn overlay 0→0.6, shake animation)

import SwiftUI

/// All possible visual states a card can occupy during display and interaction.
/// Section 2.3, CARD_DESIGN_GUIDE.md.
enum CardDisplayState: Equatable {
    /// Default resting state.
    case `default`

    /// Hovered / pointer over (iPad/pointer device).
    case focused

    /// Tapped once — card is selected, awaiting a follow-up action.
    case selected

    /// Card is exhausted / played sideways — two-phase flip animation (Section 1.6).
    case tapped

    /// Long-press triggered large preview overlay (minimum press 0.35s per Section 1.7).
    case previewed

    /// Card is entering the battlefield — ink spread compute shader active.
    /// `progress` is 0.0 (shader start) to 1.0 (fully revealed).
    case summoning(progress: Float)

    /// Legendary foil shimmer driven by CMMotionManager device tilt.
    /// `tiltX` and `tiltY` are raw attitude values from CMMotionManager.
    case foilActive(tiltX: Float, tiltY: Float)

    /// Card just received damage — shake animation + torn edge overlay.
    /// `severity` is 0.0 (minimal) to 1.0 (lethal) and drives overlay opacity.
    case damaged(severity: Float)

    /// Card is dead — desaturating fade, brightness drop, downward drift.
    case inGraveyard
}

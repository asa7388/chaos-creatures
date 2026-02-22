// ParallaxCardArtView.swift
// Chaos Creatures
//
// Two-layer parallax on card art driven by GyroscopeManager tilt values.
// Background layer shifts opposite to tilt direction (further away).
// Foreground layer shifts in the same direction but less (closer).
// Parallax range is conservative — cardstock flex, not floating UI.
//
// Spec: docs/CARD_DESIGN_GUIDE.md Section 6.4
// Task 3.3

import SwiftUI

/// Two-layer parallax card art view.
/// Background shifts at ±6pt per unit tilt; foreground at ±10pt per unit tilt.
/// Both layers clipped to the art box. Uses `GyroscopeManager.shared` tilt values.
///
/// Place this inside `CardFrameView` as the art content layer. The parent
/// must clip to `artBoxSize` bounds.
///
/// Usage:
/// ```swift
/// ParallaxCardArtView(
///     background: Image("card_art_bg"),
///     foreground: Image("card_art_fg"),
///     artBoxSize: CGSize(width: 202, height: 132)
/// )
/// ```
struct ParallaxCardArtView: View {
    /// Background layer image (environment, sky, background elements).
    /// Shifts most with device tilt — appears furthest from viewer.
    let background: Image
    /// Foreground subject image (creature, card subject).
    /// Shifts less with device tilt — appears closest to viewer.
    let foreground: Image
    /// Size of the art box this view should fill.
    let artBoxSize: CGSize

    @ObservedObject private var motion: GyroscopeManager = .shared

    // Parallax constants from Section 6.4 — kept conservative (cardstock flex)
    private let bgShift: CGFloat = 6.0
    private let fgShift: CGFloat = 10.0

    var body: some View {
        ZStack {
            // Background layer — shifts most, reads as furthest away
            background
                .resizable()
                .scaledToFill()
                .frame(
                    width: artBoxSize.width + bgShift * 2,
                    height: artBoxSize.height + bgShift * 2
                )
                .offset(
                    x: CGFloat(motion.tiltX) * -bgShift,
                    y: CGFloat(motion.tiltY) * -bgShift
                )
                .clipped()

            // Foreground subject — shifts less, reads as closest to viewer
            foreground
                .resizable()
                .scaledToFill()
                .frame(
                    width: artBoxSize.width + fgShift * 2,
                    height: artBoxSize.height + fgShift * 2
                )
                .offset(
                    x: CGFloat(motion.tiltX) * fgShift,
                    y: CGFloat(motion.tiltY) * fgShift
                )
                .clipped()
        }
        .frame(width: artBoxSize.width, height: artBoxSize.height)
        .clipped()
        .onAppear { motion.startIfNeeded() }
        .onDisappear { motion.stopIfUnneeded() }
    }
}

// MARK: - Single-image convenience variant

/// Single-image parallax — simulates depth using a scaled and offset single image.
/// Use when artwork has not been segmented into background/foreground layers.
/// Background is the full image slightly blurred; foreground is the same image
/// at original quality — the offset differential between them creates the illusion.
struct ParallaxCardArtSingleView: View {
    let artImage: Image
    let artBoxSize: CGSize

    @ObservedObject private var motion: GyroscopeManager = .shared

    private let bgShift: CGFloat = 6.0
    private let fgShift: CGFloat = 3.0

    var body: some View {
        ZStack {
            // Background pass — slightly blurred for depth separation
            artImage
                .resizable()
                .scaledToFill()
                .frame(
                    width: artBoxSize.width + bgShift * 2,
                    height: artBoxSize.height + bgShift * 2
                )
                .blur(radius: 1.5)
                .offset(
                    x: CGFloat(motion.tiltX) * -bgShift,
                    y: CGFloat(motion.tiltY) * -bgShift
                )
                .clipped()

            // Foreground pass — sharp, moves in opposite direction at smaller range
            artImage
                .resizable()
                .scaledToFill()
                .frame(
                    width: artBoxSize.width + fgShift * 2,
                    height: artBoxSize.height + fgShift * 2
                )
                .offset(
                    x: CGFloat(motion.tiltX) * fgShift,
                    y: CGFloat(motion.tiltY) * fgShift
                )
                .clipped()
        }
        .frame(width: artBoxSize.width, height: artBoxSize.height)
        .clipped()
        .onAppear { motion.startIfNeeded() }
        .onDisappear { motion.stopIfUnneeded() }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("ParallaxCardArtView") {
    let artBoxSize = CGSize(width: 202, height: 132)
    return ZStack {
        Color(red: 0.08, green: 0.06, blue: 0.04)
        ParallaxCardArtSingleView(
            artImage: Image(systemName: "photo.artframe"),
            artBoxSize: artBoxSize
        )
        .border(Color.white.opacity(0.2))
    }
    .frame(width: 240, height: 180)
}
#endif

// ChaosCreatures/Effects/InstabilityBadgeView.swift
// D20 base image from Assets.xcassets/Icons/D20.imageset/
// Number overlaid in code — one asset, value always current.
// Replaces the previous text-only instability display in the stats bar.

import SwiftUI

struct InstabilityBadgeView: View {
    let instability: Int   // 0–5

    var body: some View {
        ZStack {
            Image("d20_instability_base")
                .resizable()
                .interpolation(.high)
                .frame(width: 22, height: 22)

            Text("\(instability)")
                .font(.custom("Oswald-Bold", size: 9))
                .foregroundColor(.white)
                // Subtle shadow so numeral reads against both blue and orange areas
                .shadow(color: .black.opacity(0.6), radius: 1, x: 0, y: 0.5)
                // Offset slightly upward from center — sits on the upper face of the die
                .offset(y: -1)
        }
    }
}

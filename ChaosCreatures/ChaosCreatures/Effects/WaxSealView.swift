// WaxSealView.swift
// Chaos Creatures
//
// Faction × rarity wax seal badge.
// Loads the AI-generated seal image (25 total: 5 factions × 5 rarities) from
// Assets.xcassets/Icons/Seals/. Images were generated via fal.ai FLUX.1 Dev,
// background-removed with REMBG, and scaled to 102×102 px.
//
// Image naming convention: seal_<factionSlug>_<raritySlug>
//   factionSlug: demonic | fey | ironwright | celestial | endless
//   raritySlug:  common  | uncommon | rare  | epic      | legendary
//
// Fallback: programmatic circle with "!" — only shown if asset is missing.
// Rare+ seals pulse with a glow animation on appearance.

import SwiftUI

struct WaxSealView: View {
    let rarity: Rarity
    let faction: CardFaction
    var size: CGFloat = 34

    @State private var isGlowing = false

    // MARK: - Slug helpers

    /// Maps CardFaction (rawValue = "DEMONIC_KINGDOMS" etc.) to image filename slug.
    private var factionSlug: String {
        switch faction {
        case .demonic:    return "demonic"
        case .fey:        return "fey"
        case .ironwright: return "ironwright"
        case .celestial:  return "celestial"
        case .endless:    return "endless"
        }
    }

    /// Maps Rarity (rawValue = "COMMON" etc.) to image filename slug.
    private var raritySlug: String {
        switch rarity {
        case .common:    return "common"
        case .uncommon:  return "uncommon"
        case .rare:      return "rare"
        case .epic:      return "epic"
        case .legendary: return "legendary"
        }
    }

    private var imageName: String {
        "seal_\(factionSlug)_\(raritySlug)"
    }

    // MARK: - Body

    var body: some View {
        Group {
            if UIImage(named: imageName) != nil {
                Image(imageName)
                    .resizable()
                    .interpolation(.high)
                    .frame(width: size, height: size)
                    .blendMode(.screen)
            } else {
                // Fallback: programmatic circle — do not ship to App Store
                Circle()
                    .fill(rarity.waxColor)
                    .frame(width: size, height: size)
                    .overlay(
                        Text("!")
                            .font(.system(size: size * 0.35, weight: .bold))
                            .foregroundColor(.white)
                    )
                    .onAppear {
                        print("WAX SEAL MISSING: \(imageName) — run Scripts/generate_wax_seals.py")
                    }
            }
        }
        .shadow(
            color: rarity >= .rare ? rarity.waxColor.opacity(isGlowing ? 0.75 : 0.35) : .clear,
            radius: isGlowing ? size * 0.32 : size * 0.10,
            x: 0, y: 0
        )
        .onAppear {
            guard rarity >= .rare else { return }
            withAnimation(
                .easeInOut(duration: 1.8).repeatForever(autoreverses: true)
            ) {
                isGlowing = true
            }
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("WaxSealView — all factions × all rarities") {
    ScrollView {
        VStack(spacing: 20) {
            ForEach(CardFaction.allCases) { faction in
                HStack(spacing: 12) {
                    Text(faction.displayName)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .frame(width: 60, alignment: .trailing)
                    ForEach(Rarity.allCases) { rarity in
                        VStack(spacing: 4) {
                            WaxSealView(rarity: rarity, faction: faction)
                            Text(rarity.displayName)
                                .font(.system(size: 7))
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
        }
        .padding(24)
    }
    .background(Color(UIColor.systemBackground))
}
#endif

// CardGuideEnums.swift
// Chaos Creatures
//
// Enums and Card struct from CARD_DESIGN_GUIDE.md Section 2.1 and Section 2.2.
// These types are the render-time card data model used by card views (Phase 2+).
//
// CONFLICT NOTE: Several types here have naming overlaps with existing DB-mapped types
// in Enums.swift and CardTemplate.swift. See Logs/CONFLICTS.md (Conflicts P1-1, P1-2, P1-3)
// for details. Both type families coexist until the owner resolves the naming conflicts.
//
//   CardFaction  ↔ FactionShortName  (same concept, different names — see P1-1)
//   Rarity       ↔ EvolutionTier     (same concept, different names — see P1-2)
//   Card         ↔ CardTemplate      (same concept, different fields — see P1-3)
//
// Architecture rule (Section 2.2): All Rarity extensions must be defined here,
// not scattered across view files. CardFaction.color is defined here once only.

import SwiftUI

// MARK: - CardFaction (Section 2.1)
// Render-time faction type for card views and prompt generation.
// NOT interchangeable with FactionShortName (DB-mapped) — see CONFLICTS.md P1-1.

enum CardFaction: String, Codable {
    case ironwright   // Piranesi + Martin illustrators
    case fey          // Rackham + Dulac
    case demonic      // Bosch
    case celestial    // Dore (Paradise) + Blake
    case endless      // Dore (Inferno) + Goya

    /// Runtime tint color for faction icon and instability badge.
    /// Uses named colors from the asset catalog (Section 1.2 palette tokens).
    /// These colors are NOT used in image generation prompts — see Section 3.3c.
    var color: Color {
        switch self {
        case .ironwright: return Color("antique-silver")
        case .fey:        return Color("fey-teal")
        case .demonic:    return Color("wax-red")
        case .celestial:  return Color("aged-gold")
        case .endless:    return Color("rot-moss")
        }
    }
}

// MARK: - CardSubFaction (Section 2.1)

enum CardSubFaction: String, Codable {
    // Ironwright
    case foundryDirectorate   // reactor-blue concrete, geometric, no ornamentation
    case scrapLegions         // rust-orange patchwork, asymmetric, jury-rigged
    // Fey
    case verdantThrone        // bioluminescent, flowering, warm forest light
    case hollowCourt          // frost, bare bone, moonlit, predatory
    // Demonic
    case furnaceLords         // volcanic, magma, obsidian armor, everything burns
    case obsidianBureaucracy  // formal robes, chains, ink, reddish lamplight, too-many-eyes
    // Celestial
    case knightsOfDeliverance // gold-ivory plate, divine blue tabards, formation geometry
    case heavensChosen        // concentric burning wheels, multiple eyes/wings, reality warping
    // Endless
    case necromanticCabals    // bone-cathedral, tattered robes, phylactery soul-light, cold teal
    case lostSpectres         // translucent, flickering, fog-choked, sickly green, spectral mist
}

// MARK: - Rarity (Section 2.1)
// Render-time rarity type for card views, frames, and shader uniforms.
// NOT interchangeable with EvolutionTier (DB-mapped) — see CONFLICTS.md P1-2.

enum Rarity: String, Codable {
    case common
    case uncommon
    case rare
    case epic
    case legendary
}

// MARK: - Rarity Extensions (Section 2.2)
// All Rarity extensions are defined here — do not add Rarity extensions to view files.

extension Rarity: Comparable {
    static func < (lhs: Rarity, rhs: Rarity) -> Bool {
        let order: [Rarity] = [.common, .uncommon, .rare, .epic, .legendary]
        return order.firstIndex(of: lhs)! < order.firstIndex(of: rhs)!
    }
}

extension Rarity {
    /// Wax seal color for the rarity badge (Section 6.6 WaxSeal component).
    var waxColor: Color {
        switch self {
        case .common:    return Color("parchment-mid")
        case .uncommon:  return Color("antique-silver")
        case .rare:      return Color("aged-gold")
        case .epic:      return Color("epic-amethyst")
        case .legendary: return Color("legendary-ember")
        }
    }

    /// Display P3 glow color for shader uniforms (Section 2.2 CardShaderUniforms.glowColor).
    /// Values match the named palette tokens in Section 1.2.
    var glowSIMD: SIMD4<Float> {
        switch self {
        case .common:    return SIMD4(0.835, 0.714, 0.588, 1.0)  // parchment-mid
        case .uncommon:  return SIMD4(0.753, 0.753, 0.753, 1.0)  // antique-silver (approx)
        case .rare:      return SIMD4(0.839, 0.647, 0.078, 1.0)  // aged-gold (approx)
        case .epic:      return SIMD4(0.588, 0.282, 0.733, 1.0)  // epic-amethyst (approx)
        case .legendary: return SIMD4(0.918, 0.337, 0.137, 1.0)  // legendary-ember (approx)
        }
    }

    /// Foil shimmer intensity for legendary foil shader (0 = no foil, 1.0 = full foil).
    var foilIntensity: Float {
        switch self {
        case .common:   return 0
        case .uncommon: return 0.3
        case .rare:     return 0.6
        case .epic:     return 0.8
        case .legendary: return 1.0
        }
    }

    /// Outer glow intensity for frame shader (0 = no glow, 1.0 = maximum glow).
    var glowIntensity: Float {
        switch self {
        case .common, .uncommon: return 0
        case .rare:    return 0.5
        case .epic:    return 0.75
        case .legendary: return 1.0
        }
    }

    /// Asset name in Assets.xcassets/Icons/ for the wax seal icon.
    var sealIconName: String {
        switch self {
        case .common:    return "seal_common"     // circle-sparks
        case .uncommon:  return "seal_uncommon"   // celtic-knot
        case .rare:      return "seal_rare"       // crown
        case .epic:      return "seal_epic"       // all-seeing-eye
        case .legendary: return "seal_legendary"  // dragon-head
        }
    }

    /// Outer border width in points (Section 1.4).
    var borderWidth: CGFloat {
        switch self {
        case .common:   return 3.0
        case .uncommon: return 3.5
        default:        return 4.0
        }
    }

    /// Border gradient (Section 1.4 — rarity drives border treatment, not faction).
    var borderGradient: LinearGradient {
        switch self {
        case .common:
            return LinearGradient(
                colors: [Color("parchment-mid")],
                startPoint: .top, endPoint: .bottom)
        case .uncommon:
            return LinearGradient(
                colors: [Color("antique-silver").opacity(0.8), Color("antique-silver"), Color("antique-silver").opacity(0.6)],
                startPoint: .topLeading, endPoint: .bottomTrailing)
        case .rare:
            return LinearGradient(
                colors: [Color("aged-gold").opacity(0.7), Color("aged-gold"), Color("aged-gold").opacity(0.8)],
                startPoint: .topLeading, endPoint: .bottomTrailing)
        default:
            return LinearGradient(
                colors: [Color("parchment-mid")],
                startPoint: .top, endPoint: .bottom)
        }
    }
}

// MARK: - Supporting Enums (Section 2.1)

enum EvolutionDirection: String, Codable { case order, chaos }

enum FrameStyle: String, Codable { case standard, legendary, token }

enum CardCondition: String, Codable {
    case mint
    case played
    case worn
    case ancient
}

extension CardCondition {
    var brushRoughness: Float {
        switch self {
        case .mint:    return 0.3
        case .played:  return 0.55
        case .worn:    return 0.75
        case .ancient: return 0.95
        }
    }
    var varnishGloss: Float {
        switch self {
        case .mint:    return 0.8
        case .played:  return 0.5
        case .worn:    return 0.25
        case .ancient: return 0.1
        }
    }
    var parchmentAge: Float {
        switch self {
        case .mint:    return 0.0
        case .played:  return 0.3
        case .worn:    return 0.65
        case .ancient: return 1.0
        }
    }
}

enum InkColor: String, Codable {
    case darkBrown
    case deepBlue
    case burntSienna
    case forestGreen
}

// MARK: - CardShaderUniforms (Section 2.2)
// Computed at render time from the Card struct. Do not hardcode uniform values.

struct CardShaderUniforms {
    var brushRoughness: Float      // 0.3 (mint) → 0.95 (ancient)
    var varnishGloss: Float        // 0.8 (mint) → 0.1 (ancient)
    var parchmentAge: Float        // 0.0 (mint) → 1.0 (ancient)
    var foilIntensity: Float       // 0 (non-foil) → 1.0 (legendary foil)
    var glowIntensity: Float       // 0 (common) → 1.0 (legendary)
    var glowColor: SIMD4<Float>    // rarity glow color as float4
}

// MARK: - Card Struct (Section 2.1)
// Render-time card model — loaded from Resources/Cards/*.json via CardRepository (Phase 2).
// NOT the same as CardTemplate (Supabase DB model) — see CONFLICTS.md P1-3.

struct Card: Codable, Identifiable {
    let id: UUID
    let name: String
    let type: CardType
    let subtypes: [String]           // e.g. ["Dragon", "Elemental"] — empty for non-creatures
    let rarity: Rarity
    let faction: CardFaction         // drives prompt style + color grading
    let subFaction: CardSubFaction   // drives sub-faction-specific prompt + grading
    let cost: Int?                   // chaos mote cost — nil for stabilizers; never changes through evolution
    let attack: Int?                 // nil for stabilizers and planar ruins
    let hp: Int?                     // nil for stabilizers; planar ruins display computed HP (cost*3+1) — store nil, compute at render time
    let instability: Int             // 0-5 base; clamped 1-20 at board level; modified by evolution
    let abilityText: String          // may contain keyword markers e.g. "[BOLD]Flying[/BOLD]"
    let modifiers: [String]          // one per evolution step; empty at Common (0-4 entries)
    let triggeredAbilities: [String] // one per evolution step; empty at Common (0-4 entries)
    let flavorText: String?
    let artworkAssetName: String     // asset catalog key for current tier's artwork
    let artworkLineage: [String]     // asset names of all previous tiers in order [common, uncommon, ...]
    let artworkArtist: String?       // for credits and license tracking
    let frameStyle: FrameStyle
    let foil: Bool
    let evolutionDirection: EvolutionDirection? // nil at Common; .order or .chaos for each step
    let setCode: String
    let collectorNumber: String
    let condition: CardCondition     // drives shader parameters
    let inkColor: InkColor
    // Planar Ruin only
    let ruinPassiveText: String?          // passive benefit description
    let ruinDestructionPenaltyText: String? // fires when the ruin is destroyed

    // MARK: Computed Properties

    /// Shader uniforms computed from this card's condition and rarity.
    var shaderUniforms: CardShaderUniforms {
        CardShaderUniforms(
            brushRoughness: condition.brushRoughness,
            varnishGloss: condition.varnishGloss,
            parchmentAge: condition.parchmentAge,
            foilIntensity: foil ? rarity.foilIntensity : 0,
            glowIntensity: rarity.glowIntensity,
            glowColor: rarity.glowSIMD
        )
    }

    /// Planar Ruin computed HP: cost * 3 + 1.
    /// Nil for non-ruin types. Stored hp is nil for ruins — always use this for display.
    var ruinHP: Int? {
        guard type == .planarRuin, let cost = cost else { return nil }
        return cost * 3 + 1
    }
}

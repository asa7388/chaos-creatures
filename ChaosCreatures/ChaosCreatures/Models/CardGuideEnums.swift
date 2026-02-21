// CardGuideEnums.swift
// Chaos Creatures
//
// Enums and Card struct from CARD_DESIGN_GUIDE.md Section 2.1 and Section 2.2.
// These types are the render-time card data model used by card views (Phase 2+).
//
// P1 MIGRATIONS APPLIED (2026-02-21):
//   P1-1: FactionShortName merged into CardFaction (raw values, all properties preserved)
//   P1-2: EvolutionTier merged into Rarity (all progression + render properties unified)
//   P1-3: Card(from: CardTemplate) conversion init added
//
// Architecture rule (Section 2.2): All Rarity extensions must be defined here,
// not scattered across view files. CardFaction.color is defined here once only.

import SwiftUI
import UIKit

// MARK: - CardFaction (Section 2.1)
// Unified faction enum — replaces both CardFaction and FactionShortName.
// Raw values match the DB/Supabase string values (from Enums.swift FactionShortName).
// Short case names are used everywhere; DB decoding uses the raw value.

enum CardFaction: String, Codable, CaseIterable, Identifiable {
    case ironwright  = "IRONWRIGHT"          // Piranesi + Martin illustrators
    case fey         = "FEY_COURTS"          // Rackham + Dulac
    case demonic     = "DEMONIC_KINGDOMS"    // Bosch
    case celestial   = "CELESTIAL_CRUSADE"  // Dore (Paradise) + Blake
    case endless     = "THE_ENDLESS"         // Dore (Inferno) + Goya

    var id: String { rawValue }

    // MARK: Display

    var displayName: String {
        switch self {
        case .ironwright: return "The Ironwright Collective"
        case .fey:        return "The Fey Courts"
        case .demonic:    return "The Demonic Kingdoms"
        case .celestial:  return "The Celestial Crusade"
        case .endless:    return "The Endless"
        }
    }

    var shortDisplayName: String {
        switch self {
        case .ironwright: return "Ironwright"
        case .fey:        return "Fey Courts"
        case .demonic:    return "Demonic"
        case .celestial:  return "Celestial"
        case .endless:    return "Endless"
        }
    }

    // MARK: Mechanic

    var mechanic: FactionMechanic {
        switch self {
        case .ironwright: return .augment
        case .fey:        return .bond
        case .demonic:    return .corruption
        case .celestial:  return .exalt
        case .endless:    return .persist
        }
    }

    // MARK: Assets

    var emblemAssetName: String {
        switch self {
        case .ironwright: return "FactionEmblems/emblem-ironwright"
        case .fey:        return "FactionEmblems/emblem-fey"
        case .demonic:    return "FactionEmblems/emblem-demonic"
        case .celestial:  return "FactionEmblems/emblem-celestial"
        case .endless:    return "FactionEmblems/emblem-endless"
        }
    }

    // MARK: SwiftUI Color

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

    var swiftUIColor: Color {
        switch self {
        case .ironwright: return .ironwright
        case .fey:        return .feyCourts
        case .demonic:    return .demonic
        case .celestial:  return .celestial
        case .endless:    return .endless
        }
    }

    // MARK: UIKit Colors (for SpriteKit)

    var primaryUIColor: UIColor {
        switch self {
        case .ironwright: return UIColor(hex: "#6B7B8D")
        case .fey:        return UIColor(hex: "#2E8B57")
        case .demonic:    return UIColor(hex: "#8B2252")
        case .celestial:  return UIColor(hex: "#DAA520")
        case .endless:    return UIColor(hex: "#6B3FA0")
        }
    }

    var accentUIColor: UIColor {
        switch self {
        case .ironwright: return UIColor(hex: "#E07020")
        case .fey:        return UIColor(hex: "#7FFFD4")
        case .demonic:    return UIColor(hex: "#FF4500")
        case .celestial:  return UIColor(hex: "#F5F0E1")
        case .endless:    return UIColor(hex: "#E8DCC8")
        }
    }

    var frameTintUIColor: UIColor {
        switch self {
        case .ironwright: return UIColor(hex: "#3D4654")
        case .fey:        return UIColor(hex: "#1A3A1A")
        case .demonic:    return UIColor(hex: "#2A1010")
        case .celestial:  return UIColor(hex: "#2A2030")
        case .endless:    return UIColor(hex: "#1A1525")
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
// Unified rarity/evolution-tier enum — replaces both Rarity and EvolutionTier.
// Raw values match the DB/Supabase string values (from Enums.swift EvolutionTier: "COMMON" etc.)
// This type carries BOTH render properties (frame, shader, wax seal) AND
// progression properties (energy thresholds, tier navigation).

enum Rarity: String, Codable, CaseIterable, Identifiable {
    case common    = "COMMON"
    case uncommon  = "UNCOMMON"
    case rare      = "RARE"
    case epic      = "EPIC"
    case legendary = "LEGENDARY"

    var id: String { rawValue }

    // MARK: Display

    var displayName: String {
        switch self {
        case .common:    return "Common"
        case .uncommon:  return "Uncommon"
        case .rare:      return "Rare"
        case .epic:      return "Epic"
        case .legendary: return "Legendary"
        }
    }

    // MARK: Progression (from EvolutionTier)

    /// Index for tier ordering and comparison (0-4).
    var tierIndex: Int {
        switch self {
        case .common:    return 0
        case .uncommon:  return 1
        case .rare:      return 2
        case .epic:      return 3
        case .legendary: return 4
        }
    }

    /// Chaos energy threshold to reach this tier (design: 0/15/30/50/75).
    var energyThreshold: Int {
        switch self {
        case .common:    return 0
        case .uncommon:  return 15
        case .rare:      return 30
        case .epic:      return 50
        case .legendary: return 75
        }
    }

    /// The next tier, if any.
    var nextTier: Rarity? {
        switch self {
        case .common:    return .uncommon
        case .uncommon:  return .rare
        case .rare:      return .epic
        case .epic:      return .legendary
        case .legendary: return nil
        }
    }

    /// The previous tier, if any.
    var previousTier: Rarity? {
        switch self {
        case .common:    return nil
        case .uncommon:  return .common
        case .rare:      return .uncommon
        case .epic:      return .rare
        case .legendary: return .epic
        }
    }

    // MARK: UIKit border color (for SpriteKit — was EvolutionTier.borderUIColor)

    var borderUIColor: UIColor {
        switch self {
        case .common:    return UIColor(red: 0.62, green: 0.62, blue: 0.62, alpha: 1.0)
        case .uncommon:  return UIColor(red: 0.30, green: 0.69, blue: 0.31, alpha: 1.0)
        case .rare:      return UIColor(red: 0.13, green: 0.59, blue: 0.95, alpha: 1.0)
        case .epic:      return UIColor(red: 0.61, green: 0.15, blue: 0.69, alpha: 1.0)
        case .legendary: return UIColor(red: 1.0,  green: 0.60, blue: 0.0,  alpha: 1.0)
        }
    }
}

// MARK: - Rarity Extensions (Section 2.2)
// All Rarity extensions are defined here — do not add Rarity extensions to view files.

extension Rarity: Comparable {
    static func < (lhs: Rarity, rhs: Rarity) -> Bool {
        lhs.tierIndex < rhs.tierIndex
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
// Also constructable from CardTemplate via Card(from:) for DB-sourced data.

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

    // MARK: - VoiceOver (Task 2.10)

    /// Accessibility label for VoiceOver. Summarises all visible card information.
    var voiceOverLabel: String {
        var parts = [String]()
        parts.append(name)
        parts.append("Cost: \(cost.map { "\($0)" } ?? "none")")
        parts.append(type.rawValue.capitalized)
        if let atk = attack { parts.append("Attack: \(atk)") }
        if let displayHP = type == .planarRuin ? ruinHP : hp {
            parts.append("HP: \(displayHP)")
        }
        parts.append("Instability: \(instability)")
        if !abilityText.isEmpty { parts.append(abilityText) }
        if let flavor = flavorText, !flavor.isEmpty { parts.append(flavor) }
        return parts.joined(separator: ". ")
    }

    // MARK: - CardTemplate Conversion Init (P1-3)
    // Maps CardTemplate (DB model) → Card (render model).
    // CardTemplate.factionId is a UUID (FK to factions table), not a faction short-name string,
    // so faction is always unknown at this level — caller must resolve via Faction.shortName lookup.
    // Fields with no source in CardTemplate are documented with TODO.

    init(from template: CardTemplate) {
        self.id             = template.id
        self.name           = template.name
        self.type           = template.cardType
        self.subtypes       = []                    // TODO: no source in CardTemplate (DB has no subtype column)
        self.rarity         = .common               // TODO: no source in CardTemplate — CardTemplate is always the base Common record; tier lives on CardInstance
        self.faction        = .ironwright           // TODO: CardTemplate.factionId is a UUID FK; resolve via Faction.shortName → CardFaction before using for rendering
        self.subFaction     = .foundryDirectorate   // TODO: no source in CardTemplate (sub-faction not stored at template level)
        self.cost           = template.manaCost
        self.attack         = template.baseAttack
        self.hp             = template.baseHealth
        self.instability    = template.baseInstability
        self.abilityText    = ""                    // TODO: no source in CardTemplate — ability text is derived from modifiers/triggers on CardInstance
        self.modifiers      = []                    // TODO: no source in CardTemplate (modifiers live on CardInstance.modifiers)
        self.triggeredAbilities = []                // TODO: no source in CardTemplate (triggered abilities live on CardInstance)
        self.flavorText     = template.flavorText
        self.artworkAssetName = template.artUrl     // maps remote URL as asset name; local asset lookup may differ
        self.artworkLineage = []                    // TODO: no source in CardTemplate (lineage tracks evolution history, lives on CardInstance.artPromptHistory)
        self.artworkArtist  = nil                   // TODO: no source in CardTemplate
        self.frameStyle     = .standard
        self.foil           = false                 // TODO: no source in CardTemplate — foil is instance-level cosmetic
        self.evolutionDirection = nil               // Common tier has no evolution direction yet
        self.setCode        = template.batchId ?? "ALPHA"
        self.collectorNumber = template.id.uuidString // stable per-card identifier from DB id
        self.condition      = .mint
        self.inkColor       = .darkBrown
        self.ruinPassiveText = nil                  // TODO: no source in CardTemplate (ruin passive is derived from spellEffect for PLANAR_RUIN type)
        self.ruinDestructionPenaltyText = nil       // TODO: no source in CardTemplate
    }
}

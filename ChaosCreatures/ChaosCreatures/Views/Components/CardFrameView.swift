// CardFrameView.swift
// Chaos Creatures
//
// Phase 3 rewrite — Full-Art Dossier layout per CARD_DESIGN_GUIDE.md Section 1.4.
// Phase 4 addition — Two-phase flip animation (Section 1.8) toggling front/back face.
//
// Architecture:
//   - Artwork image fills entire card interior (202x286pt inner area)
//   - Vignette gradient (bottom 40%, transparent -> 45% black)
//   - CardDossierTextView overlay anchored to bottom, growing upward
//   - Ragged edge shader via .layerEffect() replaces digital strokeBorder
//     (noise-displaced parchment edge driven by CardCondition)
//   - Rarity glow preserved as outer shadow (rare+)
//   - Gesture priority: LongPress > Tap (flip)
//   - Tap triggers two-phase Y-axis flip: Phase 1 easeIn 0.17s (0->90deg),
//     Phase 2 easeOut 0.18s (-90->0deg) with content swap at the midpoint.
//   - CardDisplayState transitions (see CardDisplayState.swift for full state machine)
//
// Spec: CARD_DESIGN_GUIDE.md Sections 1.4 (layout), 1.5 (typography), 1.5b (field visibility), 1.8 (card back)

import SwiftUI
import CoreMotion

// MARK: - CardDisplaySize (preserved for backward compat)

enum CardDisplaySize {
    case grid
    case hand
    case detail
    case fullscreen

    var width: CGFloat {
        switch self {
        case .grid: return 112
        case .hand: return 90
        case .detail: return 280
        case .fullscreen: return 350
        }
    }

    var height: CGFloat {
        switch self {
        case .grid: return 157
        case .hand: return 130
        case .detail: return 392
        case .fullscreen: return 490
        }
    }

    var showKeywords: Bool {
        self == .detail || self == .fullscreen
    }

    var showFlavorText: Bool {
        self == .detail || self == .fullscreen
    }

    var showTypeLine: Bool {
        self == .detail || self == .fullscreen
    }

    var showCardName: Bool { true }
    var showStatBadges: Bool { true }
}

// MARK: - CardDisplayData (model preserved for backward compat)

struct CardDisplayData {
    let name: String
    let artUrl: String?
    let manaCost: Int
    let attack: Int?
    let health: Int?
    let instability: Int?
    let tier: Rarity
    let cardType: CardType
    let faction: CardFaction?
    let keywords: [Keyword]
    let flavorText: String
    let isEvolutionReady: Bool
    /// Planar Ruin passive benefit text.
    var ruinPassiveText: String?
    /// Planar Ruin destruction penalty text.
    var ruinDestructionPenaltyText: String?
    /// Ability text (rules text) for text box.
    var abilityText: String?
    /// Collector number string for stats bar.
    var collectorNumber: String?
    /// Set code string for stats bar.
    var setCode: String?
    /// Card physical condition — drives ragged edge shader uniforms.
    var condition: CardCondition

    init(
        name: String,
        artUrl: String?,
        manaCost: Int,
        attack: Int? = nil,
        health: Int? = nil,
        instability: Int? = nil,
        tier: Rarity = .common,
        cardType: CardType = .creature,
        faction: CardFaction? = nil,
        keywords: [Keyword] = [],
        flavorText: String = "",
        isEvolutionReady: Bool = false,
        ruinPassiveText: String? = nil,
        ruinDestructionPenaltyText: String? = nil,
        abilityText: String? = nil,
        collectorNumber: String? = nil,
        setCode: String? = nil,
        condition: CardCondition = .played
    ) {
        self.name = name
        self.artUrl = artUrl
        self.manaCost = manaCost
        self.attack = attack
        self.health = health
        self.instability = instability
        self.tier = tier
        self.cardType = cardType
        self.faction = faction
        self.keywords = keywords
        self.flavorText = flavorText
        self.isEvolutionReady = isEvolutionReady
        self.ruinPassiveText = ruinPassiveText
        self.ruinDestructionPenaltyText = ruinDestructionPenaltyText
        self.abilityText = abilityText
        self.collectorNumber = collectorNumber
        self.setCode = setCode
        self.condition = condition
    }

    /// Create from a CardInstance (collection/deck views).
    init(instance: CardInstance, faction: CardFaction? = nil) {
        self.name = instance.currentName
        self.artUrl = instance.artUrl
        self.manaCost = instance.currentManaCost
        self.attack = instance.currentAttack
        self.health = instance.currentHealth
        self.instability = instance.instabilityValue
        self.tier = instance.tier
        self.cardType = instance.cardType ?? (instance.currentAttack != nil ? .creature : .spell)
        self.faction = faction
        self.keywords = instance.effectiveKeywords
        self.flavorText = instance.flavorText
        self.isEvolutionReady = instance.isEvolutionReady
        self.ruinPassiveText = nil
        self.ruinDestructionPenaltyText = nil
        self.abilityText = nil
        self.collectorNumber = nil
        self.setCode = nil
        self.condition = .played  // Default — CardInstance doesn't track condition yet
    }

    // MARK: Computed properties for dossier layout

    var typeLine: String {
        let typeText = cardType.displayName
        if let faction = faction {
            return "\(typeText) / \(faction.shortDisplayName)"
        }
        return typeText
    }

    var factionEmblemAssetName: String? {
        switch faction {
        case .ironwright: return "FactionEmblems/ironwright-emblem"
        case .fey:        return "FactionEmblems/fey-emblem"
        case .demonic:    return "FactionEmblems/demonic-emblem"
        case .celestial:  return "FactionEmblems/celestial-emblem"
        case .endless:    return "FactionEmblems/endless-emblem"
        case nil: return nil
        }
    }
}

// MARK: - CardFrameView

struct CardFrameView: View {
    let data: CardDisplayData
    let cardWidth: CGFloat
    let cardHeight: CGFloat
    let cardScale: CGFloat  // cardWidth / 210.0 (reference card width)

    @State var displayState: CardDisplayState = .default
    @State var parallaxOffset: CGSize = .zero

    // MARK: - Flip Animation State (Section 1.8)
    @State private var isFlipped: Bool = false
    @State private var flipAngle: Double = 0

    let gyroscope: GyroscopeManager

    // MARK: - Init

    init(
        data: CardDisplayData,
        cardWidth: CGFloat,
        cardHeight: CGFloat,
        gyroscope: GyroscopeManager = GyroscopeManager.shared
    ) {
        self.data = data
        self.cardWidth = cardWidth
        self.cardHeight = cardHeight
        self.cardScale = cardWidth / 210.0
        self.gyroscope = gyroscope
    }

    // MARK: - Body

    var body: some View {
        GeometryReader { geo in
            ZStack {
                if isFlipped {
                    // Back face: parchment intelligence report — shader applies here
                    CardBackView(data: data, cardWidth: geo.size.width, cardHeight: geo.size.height)
                        .frame(width: geo.size.width, height: geo.size.height)
                        .layerEffect(
                            ShaderLibrary.raggedEdge(
                                .float2(Float(geo.size.width), Float(geo.size.height)),
                                .float(edgeRaggedStrength),
                                .float(edgeWidth),
                                .float(edgeSeed)
                            ),
                            maxSampleOffset: .zero
                        )
                } else {
                    // Front face: art + vignette grouped with shader,
                    // text overlay on top WITHOUT shader so text stays crisp.

                    // Layer 1: Art + vignette with ragged edge shader
                    cardArtWithVignette
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipShape(RoundedRectangle(cornerRadius: 9 * cardScale))
                        .layerEffect(
                            ShaderLibrary.raggedEdge(
                                .float2(Float(geo.size.width), Float(geo.size.height)),
                                .float(edgeRaggedStrength),
                                .float(edgeWidth),
                                .float(edgeSeed)
                            ),
                            maxSampleOffset: .zero
                        )

                    // Layer 2: Text overlay — NO shader, crisp and unaffected
                    CardDossierTextView(data: data, faction: data.faction, cardScale: cardScale)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                        .padding(0)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
            .clipShape(RoundedRectangle(cornerRadius: 12 * cardScale))
            // Rarity glow — colored outer shadow for rare+ cards
            .shadow(
                color: rarityGlowColor.opacity(Double(data.tier.glowIntensity) * 0.6),
                radius: CGFloat(data.tier.glowIntensity) * 8
            )
            // Drop shadow — physical card depth cue
            .shadow(color: .black.opacity(0.45), radius: 3, x: 0, y: 2)
            .rotation3DEffect(.degrees(flipAngle), axis: (x: 0, y: 1, z: 0))
            .onTapGesture {
                flipCard()
            }
            .onLongPressGesture(minimumDuration: 0.5) {
                withAnimation(.easeInOut(duration: 0.2)) {
                    displayState = .focused
                }
            } onPressingChanged: { isPressing in
                if !isPressing && displayState == .focused {
                    withAnimation(.easeInOut(duration: 0.15)) {
                        displayState = .default
                    }
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Card: \(data.name)")
            .accessibilityValue(isFlipped
                ? "\(data.name), Intelligence Report"
                : "\(data.cardType.displayName), Cost: \(data.manaCost)")
            .accessibilityHint("Double-tap to flip card")
            .onAppear {
                Task { @MainActor in
                    gyroscope.startIfNeeded()
                }
            }
            .onDisappear {
                Task { @MainActor in
                    gyroscope.stopIfUnneeded()
                }
            }
        }
    }

    // MARK: - Flip Animation (Section 1.8)

    /// Two-phase Y-axis card flip animation per CARD_DESIGN_GUIDE.md Section 1.8.
    /// Phase 1: current face rotates 0 -> 90 deg (0.17s easeIn) -- card turns edge-on.
    /// Phase 2: new face appears at -90 deg and rotates to 0 deg (0.18s easeOut).
    private func flipCard() {
        // Phase 1: rotate current face to edge-on
        withAnimation(.easeIn(duration: 0.17)) {
            flipAngle = 90
        }
        // Phase 2: swap content and rotate new face into view
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.17) {
            isFlipped.toggle()
            flipAngle = -90
            withAnimation(.easeOut(duration: 0.18)) {
                flipAngle = 0
            }
        }
    }

    // MARK: - Card Art + Vignette (shader target, no text)

    /// Art and vignette layers only — ragged edge shader applies to this group.
    /// Text overlay is composited separately above the shader to stay crisp.
    @ViewBuilder
    private var cardArtWithVignette: some View {
        ZStack(alignment: .bottomLeading) {
            // 1. Artwork fills entire inner area
            artworkLayer
                .ignoresSafeArea()

            // 2. Vignette gradient (bottom 40%)
            vignetteGradient
                .ignoresSafeArea()
        }
    }

    // MARK: - Card Inner Content (Art + Vignette + Text) — legacy composite

    /// Full front face composite. Retained for backward compatibility with
    /// any callers that need the complete front face in a single view.
    @ViewBuilder
    private var cardInnerContent: some View {
        ZStack(alignment: .bottomLeading) {
            // 1. Artwork fills entire inner area
            artworkLayer
                .ignoresSafeArea()

            // 2. Vignette gradient (bottom 40%)
            vignetteGradient
                .ignoresSafeArea()

            // 3. CardDossierTextView overlay (bottom-anchored)
            CardDossierTextView(data: data, faction: data.faction, cardScale: cardScale)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                .padding(0)
        }
    }

    // MARK: - Artwork Layer

    @ViewBuilder
    private var artworkLayer: some View {
        if let url = data.artUrl {
            // Remote artwork
            AsyncImage(url: URL(string: url)) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                        .ignoresSafeArea()
                case .failure, .empty:
                    artFallback
                @unknown default:
                    artFallback
                }
            }
        } else {
            // No artwork: fallback texture
            artFallback
        }
    }

    /// Fallback artwork: canvas + brush strokes + crosshatch (procedural)
    private var artFallback: some View {
        ZStack {
            // Canvas-warm base
            Image("Textures/parchment-panel")
                .resizable()
                .scaledToFill()
                .opacity(0.8)

            // Procedural brush strokes overlay
            Canvas { context, size in
                for _ in 0..<20 {
                    let x = CGFloat.random(in: 0..<size.width)
                    let y = CGFloat.random(in: 0..<size.height)
                    let width = CGFloat.random(in: 10..<100)
                    let height = CGFloat.random(in: 2..<8)
                    let opacity = Double.random(in: 0.05..<0.2)
                    var path = Path()
                    path.move(to: CGPoint(x: x, y: y))
                    path.addLine(to: CGPoint(x: x + width, y: y + height))
                    let stroke = StrokeStyle(lineWidth: 1.5)
                    context.stroke(
                        path,
                        with: .color(Color("ink-black").opacity(opacity)),
                        style: stroke
                    )
                }
            }
        }
    }

    // MARK: - Vignette Gradient (bottom 40%)

    private var vignetteGradient: some View {
        VStack {
            Spacer()
            LinearGradient(
                stops: [
                    .init(color: Color.clear, location: 0.0),
                    .init(color: Color.black.opacity(0.10), location: 0.6),
                    .init(color: Color.black.opacity(0.18), location: 1.0)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: cardHeight * 0.30)
        }
    }

    // MARK: - Ragged Edge Shader Uniforms
    // Maps CardCondition to shader parameters. See RaggedEdgeShader.metal.
    // Mint cards have minimal edge distortion; ancient cards have heavy raggedness.

    /// Noise displacement amplitude — how far the edge deviates from the card rectangle.
    private var edgeRaggedStrength: Float {
        switch data.condition {
        case .mint:    return 0.15
        case .played:  return 0.35
        case .worn:    return 0.60
        case .ancient: return 0.85
        }
    }

    /// Base edge falloff width in UV space — how deep into the card the edge zone extends.
    private var edgeWidth: Float {
        switch data.condition {
        case .mint:    return 0.04
        case .played:  return 0.06
        case .worn:    return 0.08
        case .ancient: return 0.12
        }
    }

    /// Per-card seed so every card has a unique edge pattern (deterministic from card name).
    private var edgeSeed: Float {
        Float(abs(data.name.hashValue) % 0xFFFF) / Float(0xFFFF)
    }

    // MARK: - Rarity Colors

    private var rarityGlowColor: Color {
        switch data.tier {
        case .common, .uncommon: return .clear
        case .rare:      return Color("aged-gold")
        case .epic:      return Color("epic-amethyst")
        case .legendary: return Color("legendary-ember")
        }
    }
}

// MARK: - AnimatedRarityBorder

/// Isolated View struct for Epic/Legendary rotating gradient border.
/// Using a separate struct prevents parent CardFrameView re-renders from
/// interrupting the continuous rotation animation.
private struct AnimatedRarityBorder: View {
    let isLegendary: Bool
    let cornerRadius: CGFloat

    @State private var rotation: Double = 0

    private var colors: [Color] {
        isLegendary
            ? [Color(hex: "#FFD700"), Color(hex: "#FFC820"), Color(hex: "#FF8C00"),
               Color(hex: "#FFD700"), Color(hex: "#FFE860"), Color(hex: "#FFD700")]
            : [Color(hex: "#9B59B6"), Color(hex: "#7D3C98"), Color(hex: "#D98EE5"),
               Color(hex: "#9B59B6"), Color(hex: "#A569BD"), Color(hex: "#9B59B6")]
    }

    private var duration: Double { isLegendary ? 3.0 : 4.5 }
    private var lineWidth: CGFloat { isLegendary ? 3 : 2 }

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .strokeBorder(
                AngularGradient(
                    gradient: Gradient(colors: colors),
                    center: .center,
                    angle: .degrees(rotation)
                ),
                lineWidth: lineWidth
            )
            .onAppear {
                withAnimation(.linear(duration: duration).repeatForever(autoreverses: false)) {
                    rotation = 360
                }
            }
    }
}


// MARK: - Previews

#Preview("Creature (Detail)") {
    CardFrameView(
        data: CardDisplayData(
            name: "Ironclad Vanguard",
            artUrl: nil,
            manaCost: 4,
            attack: 5,
            health: 7,
            instability: 3,
            tier: .rare,
            cardType: .creature,
            faction: .ironwright,
            keywords: [.shield, .taunt],
            flavorText: ""
        ),
        cardWidth: 280,
        cardHeight: 392
    )
}

#Preview("Spell (Common)") {
    CardFrameView(
        data: CardDisplayData(
            name: "Verdant Cascade",
            artUrl: nil,
            manaCost: 3,
            tier: .common,
            cardType: .spell,
            faction: .fey,
            keywords: [.lifesteal],
            flavorText: ""
        ),
        cardWidth: 280,
        cardHeight: 392
    )
}

#Preview("Grid View (Small)") {
    CardFrameView(
        data: CardDisplayData(
            name: "Shadow Assassin",
            artUrl: nil,
            manaCost: 2,
            attack: 2,
            health: 1,
            instability: 2,
            tier: .uncommon,
            cardType: .creature,
            faction: .demonic,
            keywords: [.haste],
            flavorText: ""
        ),
        cardWidth: 112,
        cardHeight: 157
    )
}

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
//   - Ragged edge via RaggedEdgeMask (Canvas path + .mask()) replaces Metal shader
//     (noise-displaced parchment edge driven by CardCondition, guaranteed Simulator render)
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
                    // Back face: parchment intelligence report — ragged mask applied
                    CardBackView(data: data, cardWidth: geo.size.width, cardHeight: geo.size.height)
                        .frame(width: geo.size.width, height: geo.size.height)
                        .mask(
                            RaggedEdgeMask(
                                width: geo.size.width,
                                height: geo.size.height,
                                seed: edgeSeed,
                                strength: CGFloat(edgeWidth) * geo.size.width
                            )
                        )
                } else {
                    // Front face: art + vignette grouped with shader,
                    // text overlay on top WITHOUT shader so text stays crisp.

                    // Layer 1: Art + vignette with ragged edge mask
                    // NOTE: No inner .clipShape — the mask handles the edge treatment.
                    cardArtWithVignette
                        .frame(width: geo.size.width, height: geo.size.height)
                        .mask(
                            RaggedEdgeMask(
                                width: geo.size.width,
                                height: geo.size.height,
                                seed: edgeSeed,
                                strength: CGFloat(edgeWidth) * geo.size.width
                            )
                        )

                    // Layer 2: Text overlay — NO shader, crisp and unaffected
                    CardDossierTextView(data: data, faction: data.faction, cardScale: cardScale)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                        .padding(0)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
            // Don't clip with rounded rect — the ragged mask IS the edge.
            // Just clip to prevent any stray rendering artifacts.
            .clipped()
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

    // MARK: - Ragged Edge Parameters
    // Maps CardCondition to ragged edge parameters. Used by RaggedEdgeMask (Canvas path).
    // Previously drove RaggedEdgeShader.metal (removed — Metal silently fails in Simulator).
    // Mint cards have minimal edge distortion; ancient cards have heavy raggedness.
    // The mask defines the card's SHAPE (outer boundary), NOT an inner vignette.

    /// Noise amplitude multiplier — how much noise varies the ragged boundary position.
    /// Higher values = more dramatic irregularity in the torn edge.
    /// The boundary varies from edgeWidth to edgeWidth * (1 + strength).
    private var edgeRaggedStrength: Float {
        switch data.condition {
        case .mint:    return 0.3
        case .played:  return 0.6
        case .worn:    return 0.8
        case .ancient: return 1.0
        }
    }

    /// Base inset from edge in UV space — how far the ragged boundary sits inside
    /// the card rectangle. On a 280pt card: 0.03 = 8pt, 0.08 = 22pt, 0.12 = 34pt, 0.18 = 50pt.
    /// Must be large enough to be clearly visible at collection grid size (112pt wide).
    private var edgeWidth: Float {
        switch data.condition {
        case .mint:    return 0.03
        case .played:  return 0.08
        case .worn:    return 0.12
        case .ancient: return 0.18
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

// MARK: - RaggedEdgeMask (replaces Metal shader — guaranteed to render in Simulator)

/// Pure SwiftUI/CoreGraphics mask that draws an irregular card shape.
/// Applied via `.mask()` on the card art and back-face layers.
/// Each edge is subdivided into `segments` line segments, with each vertex
/// displaced inward by seeded pseudo-noise to create a torn-paper effect.
/// The `seed` ensures every card has a unique edge pattern (deterministic).
struct RaggedEdgeMask: View {
    let width: CGFloat
    let height: CGFloat
    let seed: Float
    let strength: CGFloat  // how far edges deviate (in points)
    let segments: Int = 60  // number of edge segments per side

    var body: some View {
        Canvas { context, size in
            var path = Path()

            // Walk around the card perimeter, displacing each point by seeded noise.
            // Top edge: left to right
            let topPoints = edgePoints(
                from: CGPoint(x: 0, y: 0),
                to: CGPoint(x: width, y: 0),
                normal: CGVector(dx: 0, dy: 1),  // displace downward (inward)
                edgeSeed: seed
            )

            // Right edge: top to bottom
            let rightPoints = edgePoints(
                from: CGPoint(x: width, y: 0),
                to: CGPoint(x: width, y: height),
                normal: CGVector(dx: -1, dy: 0),  // displace leftward (inward)
                edgeSeed: seed + 1.0
            )

            // Bottom edge: right to left
            let bottomPoints = edgePoints(
                from: CGPoint(x: width, y: height),
                to: CGPoint(x: 0, y: height),
                normal: CGVector(dx: 0, dy: -1),  // displace upward (inward)
                edgeSeed: seed + 2.0
            )

            // Left edge: bottom to top
            let leftPoints = edgePoints(
                from: CGPoint(x: 0, y: height),
                to: CGPoint(x: 0, y: 0),
                normal: CGVector(dx: 1, dy: 0),  // displace rightward (inward)
                edgeSeed: seed + 3.0
            )

            // Build path
            path.move(to: topPoints[0])
            for point in topPoints.dropFirst() { path.addLine(to: point) }
            for point in rightPoints.dropFirst() { path.addLine(to: point) }
            for point in bottomPoints.dropFirst() { path.addLine(to: point) }
            for point in leftPoints.dropFirst() { path.addLine(to: point) }
            path.closeSubpath()

            context.fill(path, with: .color(.white))
        }
        .frame(width: width, height: height)
    }

    private func edgePoints(from start: CGPoint, to end: CGPoint, normal: CGVector, edgeSeed: Float) -> [CGPoint] {
        var points: [CGPoint] = []
        for i in 0...segments {
            let t = CGFloat(i) / CGFloat(segments)
            let baseX = start.x + (end.x - start.x) * t
            let baseY = start.y + (end.y - start.y) * t

            // Seeded noise: use sin-based pseudo-noise for deterministic results
            let noiseInput = Float(t) * 12.0 + edgeSeed
            let noise = pseudoNoise(noiseInput)
            let displacement = CGFloat(noise) * strength

            let px = baseX + normal.dx * displacement
            let py = baseY + normal.dy * displacement
            points.append(CGPoint(x: px, y: py))
        }
        return points
    }

    // Simple deterministic noise using layered sine waves (no randomness needed)
    private func pseudoNoise(_ x: Float) -> Float {
        let n = sin(x * 1.0) * 0.5 +
                sin(x * 2.3 + 1.7) * 0.25 +
                sin(x * 5.1 + 3.2) * 0.125 +
                sin(x * 11.8 + 0.5) * 0.0625
        return (n + 1.0) / 2.0  // normalize to 0...1
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

// RaggedEdgeShader.metal
// Chaos Creatures
//
// Ragged parchment edge shader — makes the card's OUTER BOUNDARY irregular,
// as if the physical edge is torn/ragged. This defines the card's SHAPE,
// not an inner vignette. Pixels outside the ragged boundary are fully
// transparent; pixels inside are fully opaque. The transition is sharp
// (anti-aliased over ~4 pixels).
//
// Applied via SwiftUI .layerEffect() (iOS 17+).
//
// Uses fbm (fractal Brownian motion) noise to displace the card boundary,
// creating an organic torn-paper edge.
//
// Spec: CARD_DESIGN_GUIDE.md Section 6.2b
//
// Parameters:
//   size              — card dimensions in points (float2)
//   edgeRaggedStrength — noise amplitude multiplier (0.3 mint .. 1.0 ancient)
//   edgeWidth         — base inset from edge in UV space (0.03 mint .. 0.18 ancient)
//   edgeSeed          — per-card seed so every card has a unique edge pattern

#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

// MARK: - Noise primitives

static float hash2d(float2 p) {
    return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

static float noise2d(float2 p) {
    float2 i = floor(p);
    float2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // smoothstep interpolation

    float a = hash2d(i);
    float b = hash2d(i + float2(1.0, 0.0));
    float c = hash2d(i + float2(0.0, 1.0));
    float d = hash2d(i + float2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

static float fbm(float2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < octaves; i++) {
        value += amplitude * noise2d(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// MARK: - Ragged edge layer effect

[[ stitchable ]] half4 raggedEdge(
    float2 position,
    SwiftUI::Layer layer,
    float2 size,
    float edgeRaggedStrength,
    float edgeWidth,
    float edgeSeed
) {
    // Sample the original layer at this position
    half4 color = layer.sample(position);

    // Normalize position to 0-1 UV space
    float2 uv = position / size;

    // 1. Distance from nearest edge (0 = at edge, 0.5 = at center)
    float2 edgeDistXY = min(uv, 1.0 - uv);
    float distFromEdge = min(edgeDistXY.x, edgeDistXY.y);

    // 2. FBM noise displaces the edge boundary.
    //    Seed is scattered across a large range so different cards produce
    //    clearly different edge patterns. Frequency 12 gives ~6 "bumps" per edge,
    //    which reads as torn paper without looking like digital static.
    float noise = fbm(uv * 12.0 + float2(edgeSeed * 137.0, edgeSeed * 97.0), 4);

    // 3. The ragged boundary: noise pushes the edge inward by varying amounts.
    //    edgeWidth is the BASE inset. noise * strength * edgeWidth adds irregularity.
    //    The boundary varies between edgeWidth and edgeWidth * (1 + strength).
    float raggedBoundary = edgeWidth * (1.0 + noise * edgeRaggedStrength);

    // 4. SHARP cutoff: pixels beyond the ragged boundary are transparent.
    //    Use a very tight smoothstep (~4 pixel transition) for anti-aliasing only.
    //    This is NOT a gradient — it's a hard edge with minimal AA.
    float pixelSize = 1.0 / max(size.x, size.y);
    float edgeAlpha = smoothstep(raggedBoundary - pixelSize * 2.0, raggedBoundary + pixelSize * 2.0, distFromEdge);

    // 5. Very subtle darkening right at the razor edge (material thinning).
    //    This is kept VERY subtle — no visible inner vignette.
    //    Only darkens in a narrow band right at the boundary edge.
    float edgeDarkening = mix(0.85, 1.0, smoothstep(raggedBoundary, raggedBoundary + edgeWidth * 0.3, distFromEdge));

    // 6. Apply: multiply RGB by subtle darkening, multiply alpha by sharp cutoff
    color.rgb *= half3(edgeDarkening);
    color.a *= half(edgeAlpha);

    return color;
}

// RaggedEdgeShader.metal
// Chaos Creatures
//
// Ragged parchment edge shader — removes the clean digital border and replaces
// it with a noise-displaced parchment edge that reads as physical material.
// Applied via SwiftUI .layerEffect() (iOS 17+).
//
// Uses fbm (fractal Brownian motion) noise to displace the card boundary,
// creating an organic torn-paper edge. Edge darkening simulates material
// thinning where the parchment has worn away.
//
// Parameters:
//   size              — card dimensions in points (float2)
//   edgeRaggedStrength — noise displacement amplitude (0.15 mint .. 0.85 ancient)
//   edgeWidth         — base edge falloff width in UV space (0.04 mint .. 0.12 ancient)
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

    // 1. Compute distance from each edge (normalized 0=at edge, 1=at center)
    float2 edgeDistXY = min(uv, 1.0 - uv);
    float distFromEdge = min(edgeDistXY.x, edgeDistXY.y);

    // 2. Sample fbm noise (4 octaves) seeded with edgeSeed
    float n = fbm(uv * 12.0 + float2(edgeSeed, edgeSeed * 0.7), 4);

    // 3. Displace the edge boundary
    float displacedEdge = edgeWidth + (n * edgeRaggedStrength * edgeWidth);

    // 4. Alpha falloff — smooth transition from transparent at edge to opaque inside
    float edgeAlpha = smoothstep(0.0, displacedEdge, distFromEdge);

    // 5. Edge darkening — material thinning effect (parchment gets darker where thin)
    float edgeDarkening = mix(0.6, 1.0, smoothstep(0.0, displacedEdge * 1.5, distFromEdge));

    // 6. Apply: multiply RGB by darkening, multiply alpha by falloff
    color.rgb *= half3(edgeDarkening);
    color.a *= half(edgeAlpha);

    return color;
}

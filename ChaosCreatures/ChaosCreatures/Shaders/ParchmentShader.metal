// ParchmentShader.metal
// Sources: Section 6.2 of CARD_DESIGN_GUIDE.md
// Applies parchment surface treatment: tiled texture, four-edge vignette
// (worn handling darkens edges), age darkening, and warm tint.
// Closes DEV-13: four-edge vignette on card text panel background.
//
// Textures:
//   texture(0): parchmentTex — tiling parchment/canvas base texture
//   texture(1): fiberNormal  — tiling fiber normal map for subtle surface detail
// Uniforms (buffer 0): ParchmentUniforms

#include <metal_stdlib>
using namespace metal;

struct VertexOut {
    float4 position [[position]];
    float2 texCoord;
};

struct ParchmentUniforms {
    float2 cardSize;      // card dimensions in points (e.g. 210, 294)
    float ageAmount;      // 0.0 (mint) to 1.0 (ancient)
    float colorScheme;    // 0.0 = light mode, 1.0 = dark mode
};

fragment float4 parchmentFragment(VertexOut in [[stage_in]],
                                   texture2d<float> parchmentTex [[texture(0)]],
                                   texture2d<float> fiberNormal [[texture(1)]],
                                   constant ParchmentUniforms &u [[buffer(0)]]) {
    constexpr sampler s(filter::linear, address::repeat);

    // Tile texture at physical paper scale (~256pt per tile)
    float2 tiledUV = in.texCoord * (u.cardSize / 256.0);
    float4 parchment = parchmentTex.sample(s, tiledUV);

    // Fiber normal: subtle surface micro-detail (top-left warm light at 5% strength)
    float3 normal = fiberNormal.sample(s, tiledUV).rgb * 2.0 - 1.0;
    float3 lightDir = normalize(float3(-0.5, -0.8, 1.0));
    float fiberDiffuse = max(0.0, dot(normal, lightDir)) * 0.05;

    // Four-edge vignette — worn handling darkens edges
    float2 centered = in.texCoord * 2.0 - 1.0;
    float edgeDist = max(abs(centered.x), abs(centered.y));
    float baseVignette = 1.0 - smoothstep(0.65, 1.0, edgeDist) * 0.45;

    // Age darkens further (ancient cards are more deeply shadowed at edges)
    float ageVignette = 1.0 - smoothstep(0.5, 1.0, edgeDist) * u.ageAmount * 0.3;

    // Warm tint + micro fiber diffuse
    float3 warm = parchment.rgb * float3(1.02, 0.99, 0.87) + fiberDiffuse;

    // Dark mode: invert warm relationship
    if (u.colorScheme > 0.5) {
        warm = parchment.rgb * float3(0.25, 0.18, 0.10);
        warm = mix(warm, float3(0.15, 0.10, 0.05), 1.0 - parchment.r);
    }

    return float4(clamp(warm * baseVignette * ageVignette, 0.0, 1.0), parchment.a);
}

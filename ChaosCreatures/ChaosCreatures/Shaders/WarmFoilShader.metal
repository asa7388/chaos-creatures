// WarmFoilShader.metal
// Sources: Section 6.3 of CARD_DESIGN_GUIDE.md
// Gyroscope-driven foil shimmer for Rare+ cards.
// Parallax UV distortion driven by CMMotionManager tilt, with organic sine
// distortion to prevent mechanical shimmer appearance.
// Foil strongest in midtones — not competing with darks or lights.
//
// Textures:
//   texture(0): artwork      — base card art image
//   texture(1): iridGradient — warm iridescent gradient texture (gold→rose gold→copper)
// Uniforms (buffer 0): FoilUniforms
//
// Connect tiltX/tiltY from MotionService (Section 6.3):
//   uniforms.tiltX = motionService.tiltX   (clamped -0.6 to 0.6)
//   uniforms.tiltY = motionService.tiltY   (clamped -0.6 to 0.6)
//   uniforms.intensity from card.shaderUniforms.foilIntensity

#include <metal_stdlib>
using namespace metal;

struct VertexOut {
    float4 position [[position]];
    float2 texCoord;
};

struct FoilUniforms {
    float tiltX;        // gyroscope roll,  clamped [-0.6, 0.6]
    float tiltY;        // gyroscope pitch, clamped [-0.6, 0.6]
    float intensity;    // from card.shaderUniforms.foilIntensity (0.0–1.0)
};

fragment float4 warmFoilFragment(VertexOut in [[stage_in]],
                                  texture2d<float> artwork [[texture(0)]],
                                  texture2d<float> iridGradient [[texture(1)]],
                                  constant FoilUniforms &u [[buffer(0)]]) {
    constexpr sampler s(filter::linear, address::repeat);

    float2 foilUV = in.texCoord + float2(u.tiltX, u.tiltY) * 0.3;

    // Organic distortion — prevents mechanical shimmer appearance
    foilUV += float2(
        sin(foilUV.y * 7.3 + u.tiltX * 2.0) * 0.018,
        cos(foilUV.x * 6.8 + u.tiltY * 2.0) * 0.018
    );

    float4 base = artwork.sample(s, in.texCoord);
    float4 irid = iridGradient.sample(s, foilUV);

    // Foil strongest in midtones — not competing with darks or lights
    float lum = dot(base.rgb, float3(0.299, 0.587, 0.114));
    float foilMask = sin(lum * 3.14159) * u.intensity;

    // Warm iridescent blend (additive in midtones only)
    float3 result = base.rgb + irid.rgb * foilMask * 0.45;

    return float4(clamp(result, 0.0, 1.0), base.a);
}

// OilPaintShader.metal
// Sources: Section 6.1 of CARD_DESIGN_GUIDE.md
// Applies oil paint post-processing: impasto brushwork, warm shadow ambient,
// age-driven sepia desaturation, and varnish specular highlight.
//
// Textures:
//   texture(0): artwork    — the card's full-art image
//   texture(1): brushNormal — tiling brush-stroke normal map (Resources/brush_normal.jpg)
// Uniforms (buffer 0): OilPaintUniforms

#include <metal_stdlib>
using namespace metal;

struct VertexOut {
    float4 position [[position]];
    float2 texCoord;
};

struct OilPaintUniforms {
    float brushRoughness;   // 0.0–1.0  — higher = more pronounced brushwork
    float varnishGloss;     // 0.0–1.0  — varnish specular intensity
    float parchmentAge;     // 0.0–1.0  — 0=mint, 1=ancient (drives sepia shift)
    float2 lightDirection;  // normalized, e.g. (-0.5, -0.8) for top-left warm light
};

fragment float4 oilPaintFragment(VertexOut in [[stage_in]],
                                  texture2d<float> artwork [[texture(0)]],
                                  texture2d<float> brushNormal [[texture(1)]],
                                  constant OilPaintUniforms &u [[buffer(0)]]) {
    constexpr sampler s(filter::linear, address::repeat);

    float4 color = artwork.sample(s, in.texCoord);

    // Tile brush normal at 4x to simulate brush stroke scale
    float3 normal = brushNormal.sample(s, in.texCoord * 4.0).rgb * 2.0 - 1.0;
    normal.xy *= u.brushRoughness;  // rougher card = more pronounced brushwork
    normal = normalize(normal);

    // Warm up shadows — classical oil paint has warm ambient in darks
    float lum = dot(color.rgb, float3(0.299, 0.587, 0.114));
    float3 warmReflect = float3(0.15, 0.08, 0.02);
    color.rgb = mix(mix(warmReflect, color.rgb, smoothstep(0.0, 0.5, lum)), color.rgb, 0.6);

    // Parchment age desaturation: ancient cards slightly desaturate toward sepia
    if (u.parchmentAge > 0) {
        float gray = dot(color.rgb, float3(0.299, 0.587, 0.114));
        float3 sepia = float3(gray * 1.1, gray * 0.9, gray * 0.7);
        color.rgb = mix(color.rgb, sepia, u.parchmentAge * 0.4);
    }

    // Oil varnish specular — broad, warm, physically plausible
    float3 light = normalize(float3(u.lightDirection, 0.8));
    float spec = pow(max(dot(normal, light), 0.0), 24.0) * u.varnishGloss;
    color.rgb += float3(1.0, 0.95, 0.80) * spec * 0.25;

    return float4(clamp(color.rgb, 0.0, 1.0), color.a);
}

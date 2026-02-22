// InkSpreadKernel.metal
// Sources: Section 6.5 of CARD_DESIGN_GUIDE.md
// Compute kernel for ink-spread card summon animation.
// Drives a 0→1 progress value over 0.8s via CADisplayLink (Section 6.5).
//
// Textures:
//   texture(0): input  — source card art (read access)
//   texture(1): output — resulting ink-spread frame (write access)
// Buffers:
//   buffer(0): float progress — animation progress 0.0→1.0
//   buffer(1): float2 origin  — ink start position in normalized UV coords
//
// Organic noise at spread edge simulates ink bleeding into fiber.

#include <metal_stdlib>
using namespace metal;

kernel void inkSpreadReveal(texture2d<float, access::read>  input  [[texture(0)]],
                             texture2d<float, access::write> output [[texture(1)]],
                             constant float  &progress [[buffer(0)]],
                             constant float2 &origin   [[buffer(1)]],
                             uint2 gid [[thread_position_in_grid]]) {
    uint2 sz = uint2(output.get_width(), output.get_height());
    if (gid.x >= sz.x || gid.y >= sz.y) return;

    float2 uv = float2(gid) / float2(sz);
    float dist = length(uv - origin);

    // Organic noise at spread edge — simulates ink bleeding into fiber
    float nx = fract(sin(dot(uv, float2(127.1, 311.7))) * 43758.5);
    float ny = fract(sin(dot(uv, float2(269.5, 183.3))) * 73291.1);
    float noise = (nx + ny) * 0.5;

    // Spread: hard wavefront with noisy edge
    float edgeWidth = 0.12 + noise * 0.08;
    float revealed = smoothstep(progress - edgeWidth, progress + 0.02, 1.0 - dist + noise * 0.15);

    float4 pixel = input.read(gid);
    output.write(float4(pixel.rgb, pixel.a * revealed), gid);
}

#!/usr/bin/env python3
"""
Scripts/generate_foil_gradient.py
Generates a 512x512 warm metallic foil gradient texture for the WarmFoilShader.
Uses aged gold / bronze / copper / amber palette with vertical sine wave variation
to create a warm iridescent effect suitable for foil stamping on rare+ cards.

Reference: docs/CARD_DESIGN_GUIDE.md Section 3.6

Output: ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/Textures/FoilGradient.imageset/foil_gradient.png

Usage:
    python3 Scripts/generate_foil_gradient.py
"""

import os
import sys
import json
import math

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("ERROR: Required Python packages not found.")
    print("Install with: pip3 install Pillow numpy")
    sys.exit(1)


def main():
    # Resolve project root (script lives in Scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    # Output paths
    assets_base = os.path.join(
        project_root,
        "ChaosCreatures",
        "ChaosCreatures",
        "Resources",
        "Assets.xcassets",
        "Textures",
    )
    imageset_dir = os.path.join(assets_base, "FoilGradient.imageset")
    output_path = os.path.join(imageset_dir, "foil_gradient.png")

    # Also save to Resources/Textures/ for direct pipeline use
    resources_dir = os.path.join(project_root, "Resources", "Textures")

    # ─────────────────────────────────────────────────
    # Create directories
    # ─────────────────────────────────────────────────
    os.makedirs(imageset_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)

    # Ensure Textures group Contents.json exists
    textures_contents = os.path.join(assets_base, "Contents.json")
    if not os.path.exists(textures_contents):
        os.makedirs(assets_base, exist_ok=True)
        with open(textures_contents, "w") as f:
            json.dump({"info": {"author": "xcode", "version": 1}}, f, indent=2)
            f.write("\n")
        print(f"Created Textures group Contents.json")

    # ─────────────────────────────────────────────────
    # Create imageset Contents.json with ASTC compression
    # ─────────────────────────────────────────────────
    contents_path = os.path.join(imageset_dir, "Contents.json")
    if not os.path.exists(contents_path):
        contents = {
            "images": [
                {
                    "filename": "foil_gradient.png",
                    "idiom": "universal",
                    "scale": "1x",
                }
            ],
            "info": {"author": "xcode", "version": 1},
            "properties": {"compression-type": "automatic"},
        }
        with open(contents_path, "w") as f:
            json.dump(contents, f, indent=2)
            f.write("\n")
        print(f"Created FoilGradient.imageset/Contents.json")

    # ─────────────────────────────────────────────────
    # Generate the foil gradient texture
    # ─────────────────────────────────────────────────
    w, h = 512, 512
    img = np.zeros((h, w, 3), dtype=np.uint8)

    # Warm iridescent color sequence: gold -> amber -> copper -> bronze -> gold
    # These stay in the warm range, matching aged-gold (#C9A84C) palette
    # Unlike cold holographic foil, this produces a warm metallic sheen
    stops = [
        (0.0, (200, 160, 60)),    # aged gold
        (0.2, (180, 100, 40)),    # copper
        (0.4, (220, 140, 80)),    # amber
        (0.6, (160, 90, 30)),     # bronze
        (0.8, (210, 170, 70)),    # light gold
        (1.0, (200, 160, 60)),    # aged gold (wraps for seamless tiling)
    ]

    for x in range(w):
        t = x / w

        # Find the surrounding color stops and interpolate
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i + 1]
            if t0 <= t <= t1:
                # Linear interpolation between stops
                blend = (t - t0) / (t1 - t0)
                r = int(c0[0] + (c1[0] - c0[0]) * blend)
                g = int(c0[1] + (c1[1] - c0[1]) * blend)
                b = int(c0[2] + (c1[2] - c0[2]) * blend)

                for y in range(h):
                    # Add vertical variation with sine wave for iridescence
                    v = math.sin(y / h * math.pi * 3 + x / w * math.pi) * 0.15
                    img[y, x] = [
                        min(255, max(0, int(r * (1 + v)))),
                        min(255, max(0, int(g * (1 + v)))),
                        min(255, max(0, int(b * (1 + v)))),
                    ]
                break

    # Save the texture
    result = Image.fromarray(img)
    result.save(output_path)
    print(f"Foil gradient generated: {w}x{h}")
    print(f"  Asset catalog: {os.path.relpath(output_path, project_root)}")

    # Also save to Resources/Textures/ for direct pipeline use
    resources_output = os.path.join(resources_dir, "foil_gradient.png")
    result.save(resources_output)
    print(f"  Resources:     {os.path.relpath(resources_output, project_root)}")


if __name__ == "__main__":
    main()

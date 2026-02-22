#!/usr/bin/env python3
"""
Scripts/reinstall_wax_seals_raw.py
Reinstalls wax seal PNGs from pre-REMBG raw files (512px).
Resizes to 144×144px (3x for 48pt display) and copies directly to xcassets.
Does NOT use REMBG. Dark background is handled by .blendMode(.screen) in SwiftUI.

Usage: python3 Scripts/reinstall_wax_seals_raw.py
"""

import json
import sys
from pathlib import Path
from PIL import Image

# Raw 512px source files (pre-REMBG)
STAGING_DIR = Path("Staging/wax_seals")
# Installed Resources/Icons also work but we prefer Staging (raw)
RESOURCES_DIR = Path("Resources/Icons")

SEALS_DIR = Path("ChaosCreatures/ChaosCreatures/Assets.xcassets/Icons/Seals")

FACTIONS = ["demonic", "fey", "ironwright", "celestial", "endless"]
RARITIES = ["common", "uncommon", "rare", "epic", "legendary"]

# Target size: 144px = @3x for 48pt display (up from 102px to fill the badge better)
TARGET_SIZE = 144

installed = 0
failed = []

for faction in FACTIONS:
    for rarity in RARITIES:
        name = f"seal_{faction}_{rarity}"

        # Prefer raw from Staging, fall back to Resources/Icons
        raw_src = STAGING_DIR / f"{name}_raw.png"
        resource_src = RESOURCES_DIR / f"{name}.png"

        if raw_src.exists():
            src = raw_src
            src_type = "raw"
        elif resource_src.exists():
            src = resource_src
            src_type = "resources"
        else:
            print(f"MISSING: {name} — no raw or resource PNG found")
            failed.append(name)
            continue

        # Open as RGB (drop any alpha from source — raw PNGs are fully opaque)
        img = Image.open(src).convert("RGB")

        # Resize to target size with high-quality LANCZOS
        img_resized = img.resize((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)

        # Write destination
        imageset = SEALS_DIR / f"{name}.imageset"
        imageset.mkdir(parents=True, exist_ok=True)
        dest = imageset / f"{name}.png"
        img_resized.save(dest, format="PNG", optimize=False)

        # Write Contents.json
        contents = {
            "images": [{"filename": f"{name}.png", "idiom": "universal", "scale": "3x"}],
            "info": {"author": "xcode", "version": 1},
            "properties": {"compression-type": "automatic"}
        }
        (imageset / "Contents.json").write_text(json.dumps(contents, indent=2))

        print(f"DONE: {name} (from {src_type}: {src.name})")
        installed += 1

print(f"\nInstalled: {installed}/25 seals")
if failed:
    print(f"Failed ({len(failed)}): {', '.join(failed)}")
    sys.exit(1)

# Final verification
count = len(list(SEALS_DIR.glob("*.imageset")))
print(f"Asset catalog check: {count} imagesets in {SEALS_DIR}/")
print("Done — all seals reinstalled as raw RGB PNGs (no REMBG).")
print("WaxSealView.swift uses .blendMode(.screen) to dissolve dark backgrounds.")

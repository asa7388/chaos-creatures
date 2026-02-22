#!/usr/bin/env python3
"""
Scripts/install_wax_seals.py
Places all 25 generated wax seal PNGs into Assets.xcassets/Icons/Seals/
with correct Contents.json (ASTC compression, @3x scale).
Run after generate_wax_seals.py completes successfully.

Usage: python3 Scripts/install_wax_seals.py
"""

import json, shutil, sys
from pathlib import Path

SEALS_DIR  = Path("/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Assets.xcassets/Icons/Seals")
SOURCE_DIR = Path("/Users/alexali/Projects/chaos-creatures/Resources/Icons")
FACTIONS   = ["demonic", "fey", "ironwright", "celestial", "endless"]
RARITIES   = ["common", "uncommon", "rare", "epic", "legendary"]

missing = []
installed = 0

for faction in FACTIONS:
    for rarity in RARITIES:
        name = f"seal_{faction}_{rarity}"
        src  = SOURCE_DIR / f"{name}.png"

        if not src.exists():
            print(f"MISSING: {src} — run generate_wax_seals.py first")
            missing.append(name)
            continue

        imageset = SEALS_DIR / f"{name}.imageset"
        imageset.mkdir(parents=True, exist_ok=True)
        shutil.copy(src, imageset / f"{name}.png")

        contents = {
            "images": [{"filename": f"{name}.png", "idiom": "universal", "scale": "3x"}],
            "info": {"author": "xcode", "version": 1},
            "properties": {"compression-type": "automatic"}
        }
        (imageset / "Contents.json").write_text(json.dumps(contents, indent=2))
        print(f"OK: {imageset.name}")
        installed += 1

print(f"\nInstalled: {installed}/25 imagesets")
if missing:
    print(f"Missing ({len(missing)}): {', '.join(missing)}")
    sys.exit(1)

# Verify
count = len(list(SEALS_DIR.glob("*.imageset")))
print(f"Asset catalog check: {count} imagesets in {SEALS_DIR}/")
assert count == 25, f"Expected 25 imagesets, found {count}"
print("Asset catalog OK")

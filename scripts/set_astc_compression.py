#!/usr/bin/env python3
"""
Scripts/set_astc_compression.py
Walks all .imageset directories under the asset catalog's texture-related groups
and ensures each Contents.json has "compression-type": "automatic" in its
"properties" key. This enables ASTC 4x4 compression on A8+ devices, reducing
VRAM by ~6x vs uncompressed PNG.

Reference: docs/CARD_DESIGN_GUIDE.md Section 4.6

Usage:
    python3 Scripts/set_astc_compression.py              # apply changes
    python3 Scripts/set_astc_compression.py --dry-run    # report only, no changes
"""

import json
import os
import sys
import glob
import argparse


def main():
    parser = argparse.ArgumentParser(
        description="Set ASTC compression on all texture imagesets in the asset catalog."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only report what would be modified without changing files.",
    )
    args = parser.parse_args()

    # Project root — script lives in Scripts/, project root is one level up
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    # Asset catalog base path
    assets_base = os.path.join(
        project_root,
        "ChaosCreatures",
        "ChaosCreatures",
        "Resources",
        "Assets.xcassets",
    )

    # Texture-related groups to scan (the guide says Textures/, but the project
    # also has CardTextures/, RarityEffects/, and other texture-containing groups)
    texture_groups = [
        "Textures",
        "CardTextures",
        "RarityEffects",
        "TextPanels",
        "UIBackgrounds",
    ]

    checked = 0
    modified = 0
    skipped = 0

    # Collect all imageset Contents.json files from texture groups
    contents_files = []
    for group in texture_groups:
        group_path = os.path.join(assets_base, group)
        if not os.path.isdir(group_path):
            continue
        pattern = os.path.join(group_path, "**", "*.imageset", "Contents.json")
        contents_files.extend(glob.glob(pattern, recursive=True))

    # Also scan the top-level Textures/ directory per the guide spec
    # (in case it gets created separately from the existing groups)
    top_textures = os.path.join(assets_base, "Textures")
    if os.path.isdir(top_textures):
        pattern = os.path.join(top_textures, "**", "*.imageset", "Contents.json")
        for f in glob.glob(pattern, recursive=True):
            if f not in contents_files:
                contents_files.append(f)

    if not contents_files:
        print(f"No .imageset directories found in texture groups under:")
        print(f"  {assets_base}")
        print(f"Searched groups: {', '.join(texture_groups)}")
        print("\nNothing to do.")
        return

    for contents_file in sorted(contents_files):
        checked += 1
        rel_path = os.path.relpath(contents_file, project_root)

        try:
            with open(contents_file, "r") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"  ERROR reading {rel_path}: {e}")
            skipped += 1
            continue

        # Check if properties.compression-type is already set to "automatic"
        props = data.get("properties", {})
        if props.get("compression-type") == "automatic":
            print(f"  Already set: {rel_path}")
            continue

        # Inject or update the compression property
        if "properties" not in data:
            data["properties"] = {}
        data["properties"]["compression-type"] = "automatic"

        if args.dry_run:
            print(f"  Would modify: {rel_path}")
        else:
            try:
                with open(contents_file, "w") as f:
                    json.dump(data, f, indent=2)
                    f.write("\n")  # trailing newline
                print(f"  Updated: {rel_path}")
            except IOError as e:
                print(f"  ERROR writing {rel_path}: {e}")
                skipped += 1
                continue

        modified += 1

    # Summary
    print()
    action = "would modify" if args.dry_run else "modified"
    print(f"Summary: {checked} imagesets checked, {modified} {action}", end="")
    if skipped:
        print(f", {skipped} errors/skipped", end="")
    print()

    if args.dry_run and modified > 0:
        print("Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()

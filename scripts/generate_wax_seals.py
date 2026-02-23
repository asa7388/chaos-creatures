#!/usr/bin/env python3
"""
Scripts/generate_wax_seals.py
Generates 25 AI wax seal images (5 factions × 5 rarities) via fal.ai FLUX.1 Dev.
Then runs REMBG background removal and downscales to 102×102px for asset catalog.

SEMANTIC (v2):
  Faction → embossed symbol (scroll / tree / sledgehammer / wing / skull)
  Rarity  → wax color (parchment-tan / pewter-silver / amber-gold / amethyst / ember-red)

Usage:
    python3 Scripts/generate_wax_seals.py [--faction demonic] [--rarity legendary]
    # Without flags: generates all 25. With flags: generates one for iteration.

Prerequisites:
    pip3 install fal-client rembg Pillow --break-system-packages
    FAL_KEY in .env
"""

import os, sys, argparse
from pathlib import Path
from datetime import datetime

# Faction → embossed symbol description (same symbols as Section 3.8 generation briefs)
FACTIONS = {
    "demonic":    "an unrolled scroll with curled ends, slightly aged at edges",
    "fey":        "a gnarled ancient tree, full canopy, roots spreading at base mirroring the branches",
    "ironwright": "a heavy industrial sledgehammer, head facing left, thick handle angled down-right",
    "celestial":  "a single large angelic wing, feathers spreading upward, majestic",
    "endless":    "a clean human skull, front-facing, no jaw",
}

# Rarity → wax color description
RARITIES = {
    "common":    "warm parchment-tan wax, aged linen color",
    "uncommon":  "pewter-silver wax, antique grey",
    "rare":      "aged gold wax, warm amber-honey",
    "epic":      "deep amethyst wax, dark purple",
    "legendary": "ember-red wax, deep fiery orange-red",
}

NEGATIVE_PROMPT = (
    "digital, flat, plastic, smooth, perfect circle, 3D render, cartoon, "
    "gradient, glow, neon, modern, clean, vector art, multiple objects, text, "
    "frame, border, label, glossy, polished"
)

STAGING_DIR = Path("Staging/wax_seals")
OUTPUT_DIR  = Path("Resources/Icons")
MANIFEST    = Path("Resources/ASSET_LICENSE_MANIFEST.md")


def build_prompt(wax_color: str, faction_symbol: str) -> str:
    return (
        f"A circular wax seal, {wax_color}, {faction_symbol} embossed and pressed into the center of the wax. "
        "Physical wax material — beeswax and resin compound, slightly translucent at the thinning edges, "
        "dense and opaque in the center. Single specular highlight at upper-left quadrant, warm directional "
        "light, no highlight on right side. Visible texture where the stamp pressed into the soft wax — "
        "slight displacement, raised ridge of wax around the outer edge of the impressed symbol. "
        "Depth of color — lighter where wax is thin, saturated and rich where wax is thick. "
        "Aged and handmade, organic surface irregularities, slight imperfections at rim. "
        "Fantasy heraldic style. Isolated on pure white background. Macro photography, studio lighting."
    )


def generate_one(faction: str, rarity: str, dry_run: bool = False) -> Path:
    """Generate, remove background, downscale. Returns final 102px PNG path."""
    import fal_client
    from PIL import Image
    import rembg

    name = f"seal_{faction}_{rarity}"
    staged_raw   = STAGING_DIR / f"{name}_raw.png"
    staged_rembg = STAGING_DIR / f"{name}_rembg.png"
    final_path   = OUTPUT_DIR / f"{name}.png"

    STAGING_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if final_path.exists():
        print(f"SKIP (exists): {name}")
        return final_path

    # Rarity → wax color, Faction → symbol
    prompt = build_prompt(RARITIES[rarity], FACTIONS[faction])
    print(f"\nGenerating: {name}")
    print(f"  Wax:    {RARITIES[rarity]}")
    print(f"  Symbol: {FACTIONS[faction]}")

    if dry_run:
        print(f"  PROMPT: {prompt}")
        print("  DRY RUN — skipping API call")
        return final_path

    # ── fal.ai generation ──
    result = fal_client.run(
        "fal-ai/flux/dev",
        arguments={
            "prompt": prompt,
            "negative_prompt": NEGATIVE_PROMPT,
            "image_size": {"width": 512, "height": 512},
            "num_inference_steps": 35,
            "guidance_scale": 7.5,
            "num_images": 1,
            "enable_safety_checker": True,
            "output_format": "png",
        }
    )

    image_url = result["images"][0]["url"]

    import urllib.request
    urllib.request.urlretrieve(image_url, staged_raw)

    if not staged_raw.exists() or staged_raw.stat().st_size == 0:
        raise RuntimeError(f"Generation failed — empty file: {staged_raw}")
    print(f"  Generated: {staged_raw} ({staged_raw.stat().st_size // 1024}KB)")

    # ── Background removal ──
    print("  Removing background...")
    with open(staged_raw, "rb") as f:
        raw_bytes = f.read()
    clean_bytes = rembg.remove(
        raw_bytes,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240
    )
    with open(staged_rembg, "wb") as f:
        f.write(clean_bytes)
    print(f"  Background removed: {staged_rembg}")

    # ── Downscale to 102×102px (@3x for 34pt) ──
    img = Image.open(staged_rembg).convert("RGBA")
    img_resized = img.resize((102, 102), Image.LANCZOS)
    img_resized.save(final_path, "PNG", optimize=True)
    print(f"  Final asset: {final_path} (102×102px)")

    # ── Verify ──
    verify_seal(final_path, faction, rarity)

    # ── License manifest ──
    log_manifest(name, image_url)

    return final_path


def verify_seal(path: Path, faction: str, rarity: str):
    """Basic quality checks — fails loudly rather than silently accepting bad output."""
    from PIL import Image
    import statistics

    img = Image.open(path).convert("RGBA")
    w, h = img.size
    assert w == 102 and h == 102, f"Wrong size: {w}×{h}, expected 102×102"

    pixels = list(img.getdata())
    alpha_vals = [p[3] for p in pixels]
    opaque_count = sum(1 for a in alpha_vals if a > 128)
    total = len(pixels)
    opaque_pct = opaque_count / total

    if opaque_pct < 0.20:
        raise ValueError(
            f"VERIFY FAIL [{path.name}]: seal is mostly transparent ({opaque_pct:.0%} opaque) "
            "— REMBG removed too much. Try alpha_matting_foreground_threshold=200."
        )
    if opaque_pct > 0.85:
        raise ValueError(
            f"VERIFY FAIL [{path.name}]: background not removed ({opaque_pct:.0%} opaque) "
            "— REMBG failed. Check staged_rembg file manually."
        )

    # Rarity-based color tone checks (v2: rarity drives wax color)
    rgb_pixels = [(p[0], p[1], p[2]) for p in pixels if p[3] > 128]
    if rgb_pixels:
        avg_r = statistics.mean(p[0] for p in rgb_pixels)
        avg_g = statistics.mean(p[1] for p in rgb_pixels)
        avg_b = statistics.mean(p[2] for p in rgb_pixels)

        if rarity in ("rare", "legendary"):
            # rare=gold/amber (warm), legendary=ember-red — should be red/warm dominant
            if avg_b > avg_r + 20:
                raise ValueError(
                    f"VERIFY FAIL [{path.name}]: {rarity} wax should be warm "
                    f"(R={avg_r:.0f}, B={avg_b:.0f}) — wrong color. Regenerate."
                )
        elif rarity == "epic":
            # epic=amethyst (deep purple) — should be blue/purple dominant
            if avg_r > avg_b + 30:
                raise ValueError(
                    f"VERIFY FAIL [{path.name}]: epic wax should be purple "
                    f"(R={avg_r:.0f}, B={avg_b:.0f}) — wrong color. Regenerate."
                )

    transparent_pct = sum(1 for a in alpha_vals if a < 10) / total
    print(f"  VERIFY OK: {opaque_pct:.0%} opaque, {transparent_pct:.0%} transparent")


def log_manifest(name: str, source_url: str):
    entry = (
        f"| {name}.png | fal.ai FLUX.1 Dev output — AI generated | "
        f"fal.ai commercial license | {datetime.now().strftime('%Y-%m-%d')} | Yes | No | — |\n"
    )
    with open(MANIFEST, "a") as f:
        f.write(entry)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--faction", choices=list(FACTIONS.keys()),
                        help="Generate only this faction")
    parser.add_argument("--rarity",  choices=list(RARITIES.keys()),
                        help="Generate only this rarity")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print prompts without calling API")
    args = parser.parse_args()

    env_file = Path("/Users/alexali/Projects/chaos-creatures/.env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

    fal_key = os.environ.get("FAL_KEY", "")
    if not fal_key and not args.dry_run:
        print("FAL_KEY not set — check .env")
        sys.exit(1)
    os.environ["FAL_KEY"] = fal_key

    factions = [args.faction] if args.faction else list(FACTIONS.keys())
    rarities = [args.rarity]  if args.rarity  else list(RARITIES.keys())
    combos   = [(f, r) for f in factions for r in rarities]

    print(f"Generating {len(combos)} wax seal(s)...")

    if args.dry_run:
        for faction, rarity in combos:
            print(f"\n{'='*60}")
            print(f"seal_{faction}_{rarity}")
            print(build_prompt(RARITIES[rarity], FACTIONS[faction]))
        return

    failed = []
    for faction, rarity in combos:
        try:
            generate_one(faction, rarity, dry_run=args.dry_run)
        except Exception as e:
            print(f"\nFAIL: seal_{faction}_{rarity} — {e}")
            failed.append(f"seal_{faction}_{rarity}: {e}")

    print(f"\n{'='*60}")
    print(f"Done: {len(combos) - len(failed)} succeeded, {len(failed)} failed")
    if failed:
        print("Failures:")
        for f in failed: print(f"  {f}")
        sys.exit(1)

if __name__ == "__main__":
    main()

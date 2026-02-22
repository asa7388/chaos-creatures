# Wax Seal Overhaul — Claude Code Brief
### AI-Generated Physical Wax Seals with Reference Pipeline

---

## What This Replaces

`Sources/Effects/WaxSealView.swift` currently builds the seal programmatically — a `Circle()` with a `RadialGradient`, a specular `Ellipse`, and an overlaid symbol image. Replace all of that with AI-generated images where the **faction symbol** is physically embossed into the wax and the **wax color is driven by rarity**. The glow animation stays in code.

**Semantic mapping:**
- **Faction → embossed symbol** (scroll, tree, sledgehammer, wing, skull — the same icons used on the type line, now pressed into wax)
- **Rarity → wax color** (parchment tan → silver → gold → amethyst → ember red)

At a glance the seal communicates both pieces of information. The faction symbol appears twice on the card — type line and wax seal — in completely different visual registers, which reinforces faction identity rather than feeling redundant.

---

## Output: 25 Images

One image per faction × rarity combination. Naming convention: `seal_[faction]_[rarity]`

| | common | uncommon | rare | epic | legendary |
|---|---|---|---|---|---|
| **demonic** | seal_demonic_common | seal_demonic_uncommon | seal_demonic_rare | seal_demonic_epic | seal_demonic_legendary |
| **fey** | seal_fey_common | seal_fey_uncommon | seal_fey_rare | seal_fey_epic | seal_fey_legendary |
| **ironwright** | seal_ironwright_common | seal_ironwright_uncommon | seal_ironwright_rare | seal_ironwright_epic | seal_ironwright_legendary |
| **celestial** | seal_celestial_common | seal_celestial_uncommon | seal_celestial_rare | seal_celestial_epic | seal_celestial_legendary |
| **endless** | seal_endless_common | seal_endless_uncommon | seal_endless_rare | seal_endless_epic | seal_endless_legendary |

---

## Step 1 — Download Reference Images

Run this first. All references are pre-1900 historical seals or CC-licensed museum photographs — public domain, free for any use. They are used only for agent evaluation and are never bundled in the app.

**`Scripts/download_wax_references.py`**

```python
#!/usr/bin/env python3
"""
Scripts/download_wax_references.py
Downloads wax seal reference images from Wikimedia Commons via API.
Used only for agent evaluation — never bundled in the app.

Usage: python3 Scripts/download_wax_references.py
"""

import urllib.request, urllib.parse, json, sys
from pathlib import Path

REFS_DIR = Path("References/WaxSeals")
REFS_DIR.mkdir(parents=True, exist_ok=True)

REFERENCES = [
    (
        "ref_wellcome_13c_seals.jpg",
        "Two 13th century seals. Wellcome M0007984.jpg",
        "PRIMARY MATERIAL REF: Two 13th century wax seals side by side. "
        "Study: wax density at center vs translucency at edge, embossed symbol depth, "
        "surface texture from stamp impression, warm reflected light in recessed areas."
    ),
    (
        "ref_sombor_1842_hatmakers.jpg",
        "1842 wax seal of hat maker guild in Sombor.jpg",
        "DARK WAX REF: Deep red-brown guild seal, high resolution. "
        "Study: how darker wax handles specular highlight, edge definition, "
        "symbol clarity at small display sizes, aged imperfections at rim."
    ),
    (
        "ref_schwamberg_1614.jpg",
        "Zlatník Herzig van Bein velká peče't Jana Jiřího ze Švamberka, 1614.jpg",
        "HISTORICAL EMBOSSING REF: 1614 seal, 3549×3524px. "
        "Study: depth of symbol impression into wax, raised displacement ring "
        "around embossed area, aged cracking at edge."
    ),
    (
        "ref_letter_a_modern.jpg",
        "Wax seal with impression of uppercase letter A.jpg",
        "MODERN MACRO REF: High-quality macro photo of fresh red wax seal. "
        "Study: translucency at thinning edges, specular highlight shape and position, "
        "surface texture, how light penetrates the wax body."
    ),
    (
        "ref_birmingham_police_red.jpg",
        "WMP Museum - Birmingham City Police wax seal 01.jpg",
        "DEEP RED WAX REF: Museum-quality photo of dark red official seal. "
        "Study: color depth in dark-colored wax, embossed lettering legibility, "
        "aged vs fresh wax surface comparison."
    ),
    (
        "ref_sealing_wax_on_letters.jpg",
        "Sealing wax on letters.jpg",
        "CONTEXT REF: Multiple wax seals on historical letters, 5464×2720px. "
        "Study: how seals read at document scale (closer to our 34pt display size), "
        "color variety across different wax types, seal-to-document proportion."
    ),
    (
        "ref_making_wax_seal_steps.jpg",
        "The Making of Wax Seal step by step - Mittelalterlichen Kriminalmuseum Rothenburg ob der Tauber.JPG",
        "PROCESS REF: Step-by-step wax seal creation at Rothenburg museum. "
        "Study: what melted wax looks like vs set wax, how stamp impression "
        "creates displacement, what a freshly-made vs aged seal looks like."
    ),
]

COMMONS_API = "https://commons.wikimedia.org/w/api.php"

def get_image_url(filename: str) -> tuple[str, str]:
    """Resolve Wikimedia Commons filename to direct download URL and license via API."""
    params = urllib.parse.urlencode({
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "format": "json",
    })
    api_url = f"{COMMONS_API}?{params}"
    with urllib.request.urlopen(api_url, timeout=15) as r:
        data = json.loads(r.read())

    pages = data["query"]["pages"]
    page = next(iter(pages.values()))

    if "imageinfo" not in page:
        raise ValueError(f"No imageinfo found for: {filename}")

    info = page["imageinfo"][0]
    direct_url = info["url"]

    meta = info.get("extmetadata", {})
    license_name = meta.get("LicenseShortName", {}).get("value", "unknown")
    license_url  = meta.get("LicenseUrl", {}).get("value", "")

    return direct_url, f"{license_name} {license_url}".strip()


def download_reference(local_name: str, wiki_name: str, description: str):
    dest = REFS_DIR / local_name
    if dest.exists():
        print(f"SKIP (exists): {local_name}")
        return

    print(f"Resolving: {wiki_name}")
    try:
        url, license_info = get_image_url(wiki_name)
        print(f"  URL: {url}")
        print(f"  License: {license_info}")
        print(f"  Downloading...")
        urllib.request.urlretrieve(url, dest)
        size_kb = dest.stat().st_size // 1024
        print(f"  OK: {local_name} ({size_kb}KB)")

        desc_file = REFS_DIR / f"{local_name}.txt"
        desc_file.write_text(
            f"Source: {wiki_name}\n"
            f"URL: {url}\n"
            f"License: {license_info}\n"
            f"Usage: Evaluation reference only — not bundled in app\n\n"
            f"What to study:\n{description}\n"
        )

    except Exception as e:
        print(f"  FAIL: {e}")
        print(f"  Manual download: https://commons.wikimedia.org/wiki/File:{urllib.parse.quote(wiki_name)}")


def main():
    print(f"Downloading {len(REFERENCES)} wax seal references to {REFS_DIR}/\n")
    for local_name, wiki_name, description in REFERENCES:
        download_reference(local_name, wiki_name, description)
    print(f"\nDone. Reference images in {REFS_DIR}/")
    print("Each image has a .txt companion explaining what to study in it.")

if __name__ == "__main__":
    main()
```

Run it:
```bash
python3 Scripts/download_wax_references.py
```

### What to extract from each reference

Before generating any seal, load and study these using the vision tool. Each has a `.txt` companion with detailed instructions. Short version:

| Reference | Primary quality to extract |
|-----------|---------------------------|
| `ref_wellcome_13c_seals.jpg` | **Wax density gradient** — opaque center, translucent at thinning edge. The single most important physical quality to match. |
| `ref_schwamberg_1614.jpg` | **Embossing depth** — symbol pressed *into* wax, creating visible displacement and a raised ring around the impression. Not printed on top. |
| `ref_letter_a_modern.jpg` | **Specular shape** — where the highlight lands, how large, how it fades at the edge. Upper-left per card lighting. |
| `ref_sombor_1842_hatmakers.jpg` | **Dark wax** — how color-saturated vs near-black at small sizes. Dark colors (ironwright, endless) must still read as colored, not just grey. |
| `ref_birmingham_police_red.jpg` | **Deep red** — physical quality of the demonic faction wax color. |
| `ref_sealing_wax_on_letters.jpg` | **Scale reality check** — what a wax seal looks like at close to 34pt relative to surrounding content. |
| `ref_making_wax_seal_steps.jpg` | **Material understanding** — what wax is as a physical substance. Useful for diagnosing why a generated output looks wrong. |

**Write to `Logs/iteration_log.md` before generating anything:**
```
## Wax Seal Reference Study — [timestamp]
ref_wellcome_13c_seals.jpg: Edge translucency — [describe]. Embossing depth — [describe]. Specular — [where, how diffuse].
ref_schwamberg_1614.jpg: Symbol impression depth — [describe]. Displacement ring — [present/absent, describe].
ref_letter_a_modern.jpg: Specular position — [describe]. Size — [describe]. Hardness — [sharp point / broad diffuse].
Ready to generate calibration seal.
```

---

## Step 2 — Generation

### Prerequisites

```bash
pip3 install fal-client rembg Pillow --break-system-packages
# FAL_KEY must be set in .env — verify with: bash Scripts/verify_environment.sh
```

### Generation spec

**Service:** fal.ai FLUX.1 Dev  
**Source resolution:** 512×512px (use 768×768 if 34pt detail is insufficient — see prompt iteration guide)  
**Final asset resolution:** 102×102px (@3x for 34pt display size)  
**Background:** transparent (REMBG pass after generation)

**Prompt template:**

```
A circular wax seal, [WAX_COLOR], [FACTION_SYMBOL] embossed and pressed into the center of the wax.
Physical wax material — beeswax and resin compound, slightly translucent at the thinning edges,
dense and opaque in the center. Single specular highlight at upper-left quadrant, warm directional
light, no highlight on right side. Visible texture where the stamp pressed into the soft wax —
slight displacement, raised ridge of wax around the outer edge of the impressed symbol.
Depth of color — lighter where wax is thin, saturated and rich where wax is thick.
Aged and handmade, organic surface irregularities, slight imperfections at rim.
Fantasy heraldic style. Isolated on pure white background. Macro photography, studio lighting.
```

**Negative prompt (all images):**
```
digital, flat, plastic, smooth, perfect circle, 3D render, cartoon, gradient, glow, neon,
modern, clean, vector art, multiple objects, text, frame, border, label, glossy, polished
```

**WAX_COLOR substitutions** (driven by rarity):

| Rarity | WAX_COLOR value |
|--------|----------------|
| common | warm parchment-tan wax, aged linen color |
| uncommon | pewter-silver wax, antique grey |
| rare | aged gold wax, warm amber-honey |
| epic | deep amethyst wax, dark purple |
| legendary | ember-red wax, deep fiery orange-red |

**FACTION_SYMBOL substitutions** (driven by faction — same symbols as Section 3.8 generation briefs):

| Faction | FACTION_SYMBOL value |
|---------|---------------------|
| demonic | an unrolled scroll with curled ends, slightly aged at edges |
| fey | a gnarled ancient tree, full canopy, roots spreading at base mirroring the branches |
| ironwright | a heavy industrial sledgehammer, head facing left, thick handle angled down-right |
| celestial | a single large angelic wing, feathers spreading upward, majestic |
| endless | a clean human skull, front-facing, no jaw |

**fal.ai call parameters:**
```python
{
    "prompt": prompt,
    "negative_prompt": negative_prompt,
    "image_size": {"width": 512, "height": 512},
    "num_inference_steps": 35,
    "guidance_scale": 7.5,
    "num_images": 1,
    "enable_safety_checker": True,
    "output_format": "png"
}
```

### `Scripts/generate_wax_seals.py`

```python
#!/usr/bin/env python3
"""
Scripts/generate_wax_seals.py
Generates 25 AI wax seal images (5 factions × 5 rarities) via fal.ai FLUX.1 Dev.
Then runs REMBG background removal and downscales to 102×102px for asset catalog.

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

FACTIONS = {
    # faction → embossed symbol description (same as Section 3.8 briefs)
    "demonic":    "an unrolled scroll with curled ends, slightly aged at edges",
    "fey":        "a gnarled ancient tree, full canopy, roots spreading at base mirroring the branches",
    "ironwright": "a heavy industrial sledgehammer, head facing left, thick handle angled down-right",
    "celestial":  "a single large angelic wing, feathers spreading upward, majestic",
    "endless":    "a clean human skull, front-facing, no jaw",
}

RARITIES = {
    # rarity → wax color description
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
        f"A circular wax seal, {wax_color}, {symbol} embossed and pressed into the center of the wax. "
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

    # FACTIONS[faction] = symbol description, RARITIES[rarity] = wax color
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

    # Color tone check — rarity now drives wax color
    # Warm rarities (rare=gold, legendary=ember-red) should be red/orange dominant
    # Cool rarities (epic=amethyst) should be blue-purple dominant
    if rarity in ("rare", "legendary"):
        rgb_pixels = [(p[0], p[1], p[2]) for p in pixels if p[3] > 128]
        if rgb_pixels:
            avg_r = statistics.mean(p[0] for p in rgb_pixels)
            avg_b = statistics.mean(p[2] for p in rgb_pixels)
            if avg_b > avg_r + 20:
                raise ValueError(
                    f"VERIFY FAIL [{path.name}]: {rarity} seal should be warm "
                    f"(R={avg_r:.0f}, B={avg_b:.0f}) — wrong color generated. Regenerate."
                )
    elif rarity == "epic":
        rgb_pixels = [(p[0], p[1], p[2]) for p in pixels if p[3] > 128]
        if rgb_pixels:
            avg_r = statistics.mean(p[0] for p in rgb_pixels)
            avg_b = statistics.mean(p[2] for p in rgb_pixels)
            if avg_r > avg_b + 30:
                raise ValueError(
                    f"VERIFY FAIL [{path.name}]: epic seal should be purple/cool "
                    f"(R={avg_r:.0f}, B={avg_b:.0f}) — wrong color generated. Regenerate."
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

    env_file = Path(".env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

    fal_key = os.environ.get("FAL_KEY", "")
    if not fal_key and not args.dry_run:
        print("FAL_KEY not set — run: bash Scripts/verify_environment.sh")
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
```

---

## Step 3 — Preview at Actual Display Size

**This is mandatory before approving any seal.** A seal that looks convincing at 512px generation size routinely loses all embossing depth at 34pt.

### `Scripts/preview_wax_seal.py`

```python
#!/usr/bin/env python3
"""
Scripts/preview_wax_seal.py
Composites a generated wax seal onto a parchment card mock at actual display size.
Shows the seal at 34pt (@3x = 102px) in the correct position, plus a 4× zoom inset.

Usage:
    python3 Scripts/preview_wax_seal.py Resources/Icons/seal_demonic_legendary.png
    # Output: Staging/wax_seals/preview_seal_demonic_legendary.png
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw

def make_preview(seal_path: Path) -> Path:
    CARD_W, CARD_H = 630, 882   # 210×294pt at @3x
    SCALE = 3

    PARCHMENT_LIGHT = (245, 230, 200)
    PARCHMENT_MID   = (212, 184, 150)
    INK_BLACK       = (26, 18, 8)

    card = Image.new("RGB", (CARD_W, CARD_H), PARCHMENT_LIGHT)
    draw = ImageDraw.Draw(card)

    # Zone guides (Section 1.4 measurements × 3)
    draw.rectangle([12, 12, CARD_W-12, 87],   outline=PARCHMENT_MID, width=1)  # Name bar
    draw.text((20, 20), "Name Bar", fill=PARCHMENT_MID)
    draw.rectangle([12, 87, CARD_W-12, 483],  outline=PARCHMENT_MID, width=1)  # Art box
    draw.text((20, 100), "Art Box", fill=PARCHMENT_MID)
    draw.rectangle([12, 483, CARD_W-12, 537], outline=PARCHMENT_MID, width=1)  # Type line
    draw.rectangle([24, 537, CARD_W-24, 801], outline=PARCHMENT_MID, width=1)  # Text box
    draw.text((30, 550), "Text Box", fill=PARCHMENT_MID)
    draw.rectangle([12, 801, CARD_W-12, 846], fill=PARCHMENT_MID)              # Stats bar
    draw.text((CARD_W - 80, 812), "4 / 7", fill=INK_BLACK)
    draw.rectangle([12, 846, CARD_W-12, 858], fill=(200, 169, 81))             # Rarity bar
    draw.rectangle([0, 0, CARD_W-1, CARD_H-1], outline=INK_BLACK, width=3)    # Outer border

    # Wax seal at correct position: center x=181pt, y=275pt → 543px, 825px @3x
    SEAL_PX = 102
    SEAL_LEFT = int(181 * SCALE) - SEAL_PX // 2
    SEAL_TOP  = int(275 * SCALE) - SEAL_PX // 2

    seal_img = Image.open(seal_path).convert("RGBA")
    if seal_img.size != (SEAL_PX, SEAL_PX):
        seal_img = seal_img.resize((SEAL_PX, SEAL_PX), Image.LANCZOS)

    card_rgba = card.convert("RGBA")
    card_rgba.paste(seal_img, (SEAL_LEFT, SEAL_TOP), mask=seal_img)
    card_final = card_rgba.convert("RGB")

    # 4× zoom inset alongside card
    INSET_ZOOM = 4
    INSET_SIZE = SEAL_PX * INSET_ZOOM  # 408px
    seal_zoomed = seal_img.resize((INSET_SIZE, INSET_SIZE), Image.LANCZOS)

    output_w = CARD_W + INSET_SIZE + 20
    output_h = max(CARD_H, INSET_SIZE + 80)
    output = Image.new("RGB", (output_w, output_h), (180, 180, 180))
    output.paste(card_final, (0, 0))
    output.paste(seal_zoomed.convert("RGB"), (CARD_W + 10, 40))

    draw_out = ImageDraw.Draw(output)
    draw_out.text((CARD_W + 10, 10), "Seal at 4x zoom", fill=INK_BLACK)
    draw_out.text((CARD_W + 10, INSET_SIZE + 50),
                  f"Display size: {SEAL_PX}px = 34pt @3x", fill=INK_BLACK)

    out_dir = Path("Staging/wax_seals")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"preview_{seal_path.stem}.png"
    output.save(out_path)
    print(f"Preview saved: {out_path}")
    return out_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 Scripts/preview_wax_seal.py path/to/seal.png")
        sys.exit(1)
    make_preview(Path(sys.argv[1]))
```

Run after the calibration seal:
```bash
python3 Scripts/preview_wax_seal.py Resources/Icons/seal_demonic_legendary.png
# Opens Staging/wax_seals/preview_seal_demonic_legendary.png
```

---

## Step 4 — Vision Evaluation & Critique

After generating the calibration seal and its preview, load all three of these with the vision tool simultaneously:
1. `References/WaxSeals/ref_wellcome_13c_seals.jpg` — primary physical reference
2. `Staging/wax_seals/seal_demonic_legendary_raw.png` — generated output at source resolution
3. `Staging/wax_seals/preview_seal_demonic_legendary.png` — output at 34pt on card mock

Complete this critique template and write it to `Logs/iteration_log.md` before making any approval decision:

```markdown
## Wax Seal Iteration [N] — seal_[faction]_[rarity] — [timestamp]
**References loaded:** ref_wellcome_13c_seals.jpg, ref_[faction_color].jpg
**Files evaluated:** [raw path], [preview path]

| Axis | Score (1–5) | Observation |
|------|------------|-------------|
| Physical material | | Reads as wax (beeswax/resin), not plastic/glass/digital button? |
| Edge translucency | | Wax thins and becomes slightly translucent toward rim? |
| Embossing depth | | Symbol appears PRESSED INTO wax (not printed on top)? |
| Displacement ring | | Subtle raised ridge of wax around impressed symbol? |
| Specular accuracy | | Single highlight, upper-left, warm, correctly diffuse? |
| Color depth | | Wax color has internal depth, lighter at thin edges? |
| 34pt readability | | At actual display size: symbol legible? Reads as wax? |
| Imperfections | | Rim irregularities, aged quality, handmade feel? |

**Largest gap at 34pt:** [the thing that fails most at actual display size]
**Root cause:** [wrong prompt element / generation variance / REMBG artifact]
**Prompt change if regenerating:** [exact phrase to add/remove/change]
**Decision:** APPROVE / REGENERATE — [reason]
```

All 8 axes must score ≥ 3 at 34pt before approving. **Physical material** and **34pt readability** are the two that cannot be sacrificed — everything else can be imperfect.

---

## Prompt Iteration Guide

When specific axes fail, change exactly these elements:

| Failing axis | What to change |
|-------------|----------------|
| Reads as plastic/digital | Add: `"beeswax and resin compound, organic surface irregularities"`. Remove any word like "glossy", "polished", "reflective" |
| No edge translucency | Add: `"wax thins toward rim, slight translucency at edge where wax is thinnest"`. Try `guidance_scale: 8.5` |
| Symbol printed-on, not embossed | Add: `"deep stamp impression, wax displaced outward from symbol, concave recess where stamp pressed"`. Remove `"embossed"` (FLUX sometimes reads this as raised-on-top) |
| No displacement ring | Add: `"raised ridge of wax around the outer edge of the impressed symbol"` |
| Specular on wrong side | Add: `"single specular highlight at upper-left quadrant, no highlight on right side or bottom"` |
| Wax color too flat | Add: `"depth of color — lighter where wax is thin, saturated and rich where wax is thick"` |
| Disappears at 34pt | Regenerate at `768×768` instead of `512×512`. More source detail survives downscaling. |
| Background not removed cleanly | Adjust REMBG threshold: `rembg.remove(raw_bytes, alpha_matting=True, alpha_matting_foreground_threshold=200)` (lower = more aggressive) |

---

## Step 5 — Calibration Gate

**Do not run the full 25-seal batch until the calibration seal passes.**

```bash
# 1. Generate calibration seal
python3 Scripts/generate_wax_seals.py --faction demonic --rarity legendary

# 2. Generate display-size preview
python3 Scripts/preview_wax_seal.py Resources/Icons/seal_demonic_legendary.png

# 3. Load both files + ref_wellcome_13c_seals.jpg with vision tool
# 4. Complete the critique template above
# 5. Write to Logs/iteration_log.md:
#    - Completed critique
#    - Final approved prompt text (label it "APPROVED PROMPT — demonic legendary")
#    - Decision: APPROVE or REGENERATE with reason

# If approved, run all 25:
python3 Scripts/generate_wax_seals.py
```

**Why demonic legendary is the calibration seal:** It's the hardest combination — ember-red wax (the most saturated, richest wax color, must read as distinctly red not just dark) plus the scroll symbol (both curl ends must read legibly at 34pt, making it the most geometrically demanding faction symbol). If it passes at 34pt, the remaining 24 are easier. Simpler symbols (skull for endless, sledgehammer for ironwright) and lighter wax colors (parchment-tan for common, silver for uncommon) are more forgiving. Approve too easily here and detail failures will surface in the batch.

---

## Step 5b — D20 Instability Icon

The D20 is a full-color asset — not a silhouette like the other icons. It shows swirling blue (chaos) and fiery orange (order) on the die face, with the instability number overlaid in code at runtime. One base asset, number always matches the card's actual value.

### Generation spec

**Asset name:** `d20_instability_base.png`  
**Source resolution:** 512×512px  
**Final resolution:** 48×48pt @3x (144×144px) — large enough that the number overlay reads clearly  
**Background:** transparent (REMBG pass, same pipeline as wax seals)  
**Output:** `Resources/Icons/d20_instability_base.png`

**Prompt:**
```
A twenty-sided die (D20), viewed straight-on, face showing. The die face is filled with
violently swirling magical energy — on the left side, deep electric cobalt blue with turbulent
swirling motion; on the right side, fierce fiery orange with upward-licking flame motion.
The two colors meet at the center in a chaotic collision, neither dominant.
The die has visible facets and edges — clearly a D20, not a sphere.
A single crack or fracture runs diagonally across the face, suggesting chaos and instability.
The crack is significant but the die shape remains clearly readable.
Fantasy magical artifact. Studio lighting with rim light. Isolated on pure white background.
```

**Negative prompt:**
```
smooth gradient, flat, uniform color, cartoon, plastic, digital, text, numbers, letters,
blurry, soft, glowing outline, 2D, vector art, coin, circle, sphere, perfect symmetry
```

**fal.ai call parameters:**
```python
{
    "prompt": prompt,
    "negative_prompt": negative_prompt,
    "image_size": {"width": 512, "height": 512},
    "num_inference_steps": 40,
    "guidance_scale": 8.0,
    "num_images": 1,
    "enable_safety_checker": True,
    "output_format": "png"
}
```

**Post-processing:** Same REMBG pipeline as wax seals (`alpha_matting=True`), then downscale to 144×144px. Do **not** convert to silhouette — retain full color.

**Generate with:**
```bash
python3 - <<'EOF'
import fal_client, urllib.request, os
from pathlib import Path

env_file = Path(".env")
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

PROMPT = (
    "A twenty-sided die (D20), viewed straight-on, face showing. The die face is filled with "
    "violently swirling magical energy — on the left side, deep electric cobalt blue with turbulent "
    "swirling motion; on the right side, fierce fiery orange with upward-licking flame motion. "
    "The two colors meet at the center in a chaotic collision, neither dominant. "
    "The die has visible facets and edges — clearly a D20, not a sphere. "
    "A single crack or fracture runs diagonally across the face, suggesting chaos and instability. "
    "The crack is significant but the die shape remains clearly readable. "
    "Fantasy magical artifact. Studio lighting with rim light. Isolated on pure white background."
)
NEG = (
    "smooth gradient, flat, uniform color, cartoon, plastic, digital, text, numbers, letters, "
    "blurry, soft, glowing outline, 2D, vector art, coin, circle, sphere, perfect symmetry"
)

result = fal_client.run("fal-ai/flux/dev", arguments={
    "prompt": PROMPT, "negative_prompt": NEG,
    "image_size": {"width": 512, "height": 512},
    "num_inference_steps": 40, "guidance_scale": 8.0,
    "num_images": 1, "enable_safety_checker": True, "output_format": "png"
})

raw_path = Path("Staging/d20_raw.png")
raw_path.parent.mkdir(parents=True, exist_ok=True)
urllib.request.urlretrieve(result["images"][0]["url"], raw_path)
print(f"Downloaded: {raw_path}")

import rembg
from PIL import Image
with open(raw_path, "rb") as f:
    clean = rembg.remove(f.read(), alpha_matting=True, alpha_matting_foreground_threshold=240)
rembg_path = Path("Staging/d20_rembg.png")
with open(rembg_path, "wb") as f:
    f.write(clean)

img = Image.open(rembg_path).convert("RGBA").resize((144, 144), Image.LANCZOS)
out = Path("Resources/Icons/d20_instability_base.png")
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out, "PNG", optimize=True)
print(f"Final asset: {out} (144×144px)")
EOF
```

**Verify:**
```python
from PIL import Image
import statistics
img = Image.open("Resources/Icons/d20_instability_base.png").convert("RGBA")
assert img.size == (144, 144), f"Wrong size: {img.size}"
pixels = list(img.getdata())
opaque = [p for p in pixels if p[3] > 128]
assert 0.30 < len(opaque)/len(pixels) < 0.90, "REMBG issue — check opacity"
# Should have both blue and orange channels present in opaque pixels
avg_r = statistics.mean(p[0] for p in opaque)
avg_b = statistics.mean(p[2] for p in opaque)
assert abs(avg_r - avg_b) < 60, f"Color imbalanced: R={avg_r:.0f} B={avg_b:.0f} — one color dominated, regenerate"
print(f"D20 verify OK: {len(opaque)/len(pixels):.0%} opaque, R={avg_r:.0f} B={avg_b:.0f}")
```

**Install into asset catalog:**
```bash
mkdir -p Assets.xcassets/Icons/D20.imageset
cp Resources/Icons/d20_instability_base.png Assets.xcassets/Icons/D20.imageset/
cat > Assets.xcassets/Icons/D20.imageset/Contents.json << 'EOF'
{
  "images": [{"filename": "d20_instability_base.png", "idiom": "universal", "scale": "3x"}],
  "info": {"author": "xcode", "version": 1},
  "properties": {"compression-type": "automatic", "preserves-vector-representation": false}
}
EOF
```

### `InstabilityBadgeView.swift`

The D20 image is the base asset. The instability number is overlaid as a SwiftUI `Text` in white at runtime — one asset works for all instability values 0–5.

```swift
// Sources/Effects/InstabilityBadgeView.swift
// D20 base image from Assets.xcassets/Icons/D20.imageset/
// Number overlaid in code — one asset, value always current.
// Replaces the previous text-only instability display in the stats bar.

import SwiftUI

struct InstabilityBadgeView: View {
    let instability: Int   // 0–5

    var body: some View {
        ZStack {
            Image("d20_instability_base")
                .resizable()
                .interpolation(.high)
                .frame(width: 22, height: 22)

            Text("\(instability)")
                .font(.custom("Oswald-Bold", size: 9))
                .foregroundColor(.white)
                // Subtle shadow so numeral reads against both blue and orange areas
                .shadow(color: .black.opacity(0.6), radius: 1, x: 0, y: 0.5)
                // Offset slightly upward from center — sits on the upper face of the die
                .offset(y: -1)
        }
    }
}
```

**Replace the instability display in the stats bar** (Section 10.3b). Find the existing instability text in the `HStack` and replace it:

```swift
// Before (old text-only display):
if card.instability > 0 {
    Text("⚡\(card.instability)")
        .font(.custom("Oswald-Bold", size: 10))
        .foregroundColor(card.faction.color.opacity(0.8))
}

// After (D20 badge with number overlay):
if card.instability > 0 {
    InstabilityBadgeView(instability: card.instability)
}
```

**Note:** `card.faction.color` is no longer referenced anywhere after this change. See the guide update instructions at the end of this document — `CardFaction.color` gets removed from the model.

---

## Step 6 — Install Wax Seals into Asset Catalog


### `Scripts/install_wax_seals.py`

```python
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

SEALS_DIR  = Path("Assets.xcassets/Icons/Seals")
SOURCE_DIR = Path("Resources/Icons")
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
```

```bash
python3 Scripts/install_wax_seals.py

# Verify:
find Assets.xcassets/Icons/Seals -name "*.imageset" | wc -l
# Must return 25
```

---

## Step 7 — Update `WaxSealView.swift`

Replace the entire existing file:

```swift
// Sources/Effects/WaxSealView.swift
// Rarity and CardFaction are defined in Sources/Models/Card.swift.
// Loads the pre-generated AI wax seal image for the faction × rarity combination.
// The wax color and embossed symbol are baked into the image — no programmatic
// circle, gradient, or symbol overlay. Glow animation remains in code.

import SwiftUI

struct WaxSealView: View {
    let rarity: Rarity
    let faction: CardFaction
    @State private var isGlowing = false

    private var imageName: String {
        "seal_\(faction.rawValue)_\(rarity.rawValue)"
    }

    var body: some View {
        Group {
            if UIImage(named: imageName) != nil {
                Image(imageName)
                    .resizable()
                    .interpolation(.high)
            } else {
                // Fallback: programmatic circle — logs gap, do not ship to App Store
                Circle()
                    .fill(rarity.waxColor)
                    .overlay(
                        Text("!")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                    )
                    .onAppear {
                        print("⚠️ WAX SEAL MISSING: \(imageName) — run generate_wax_seals.py")
                    }
            }
        }
        .frame(width: 34, height: 34)
        .shadow(
            color: rarity.waxColor.opacity(isGlowing ? 0.75 : 0.35),
            radius: isGlowing ? 8 : 3
        )
        .onAppear {
            guard rarity >= .rare else { return }
            withAnimation(
                .easeInOut(duration: 1.8).repeatForever(autoreverses: true)
            ) {
                isGlowing = true
            }
        }
    }
}
```

**Update all `WaxSealView` call sites** — they now require `faction`:

```swift
// Before:
WaxSealView(rarity: card.rarity)

// After:
WaxSealView(rarity: card.rarity, faction: card.faction)
```

Search for all occurrences:
```bash
grep -rn "WaxSealView(" Sources/ --include="*.swift"
```

---

## Step 8 — Verify & Log

```bash
# Confirm all 25 imagesets installed
find Assets.xcassets/Icons/Seals -name "*.imageset" | wc -l   # must be 25

# Confirm WaxSealView call sites updated
grep -rn "WaxSealView(rarity:" Sources/ --include="*.swift"    # must return 0

# Build check
bash Scripts/compile_shaders.sh && xcodebuild -scheme CardGame \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build \
  2>&1 | grep "error:" | head -10
```

Write to `Logs/iteration_log.md`:
```
## Wax Seal Overhaul — Complete — [timestamp]
Approach: 25 AI-generated images (5 factions × 5 rarities)
  Wax color = rarity (parchment → silver → gold → amethyst → ember-red)
  Embossed symbol = faction (scroll / tree / sledgehammer / wing / skull)
Calibration seal: seal_demonic_legendary — [APPROVED / iterations required: N]
Approved prompt logged: [yes/no — see iteration [N] above]
All 25 generated: [yes / list any failures]
Asset catalog: 25 imagesets installed in Assets.xcassets/Icons/Seals/
WaxSealView updated: faction + rarity parameters, all call sites updated
D20 badge: d20_instability_base.png generated, InstabilityBadgeView.swift created
Stats bar: instability display updated to InstabilityBadgeView
CardFaction.color: removed from Card.swift (no longer referenced)
Type line: faction icon removed (wax seal now carries faction identity)
Build: [PASS / FAIL]
Budget spent: ~$[X.XX] from non-creature artwork allocation
Remaining budget: $[X.XX]
Guide files updated: [yes/no — see Step 9]
```

---

## Quick Reference: Run Order

```bash
# 1. References (one time)
python3 Scripts/download_wax_references.py

# 2. Study references with vision tool — write study notes to iteration_log.md

# 3. Calibration seal
python3 Scripts/generate_wax_seals.py --faction demonic --rarity legendary
python3 Scripts/preview_wax_seal.py Resources/Icons/seal_demonic_legendary.png
# → Vision evaluate → complete critique template → write to iteration_log.md → decision

# 4. If approved, full batch
python3 Scripts/generate_wax_seals.py

# 5. D20 badge
# Run the inline script from Step 5b

# 6. Install wax seals
python3 Scripts/install_wax_seals.py

# 7. Update WaxSealView.swift, InstabilityBadgeView.swift, stats bar call site

# 8. Update Card.swift (remove CardFaction.color)

# 9. Update guide files (see Step 9 below)

# 10. Build check
```

---

## Step 9 — Update `docs/CARD_DESIGN_GUIDE.md` and `docs/CARD_DESIGN_QUICKREF.md`

These files are the source of truth. Every design change made in this overhaul must be reflected in them before the work is considered complete. An agent working from stale guide files will re-introduce removed features or miss the new ones.

Read `docs/CARD_DESIGN_GUIDE.md` in full before making any edits. Use the Table of Contents to locate each section. Make all changes as surgical inline edits — do not restructure sections or alter surrounding content.

### 9a. Changes to `docs/CARD_DESIGN_GUIDE.md`

---

**Section 1.4 — Card Layout & Zone Measurements: Type line zone**

Find the type line zone spec. Remove the faction icon from the left-aligned elements. The type line now contains:
- Left: card type text only (e.g. "Creature — Dragon"), no icon
- Right: set symbol (unchanged)

Remove any measurement row or mention of "faction icon" or "type line faction icon" from the Section 1.4 type line spec. The set symbol row stays.

---

**Section 1.5 — Typography & Icon Spec: Type line faction icon entry**

Find the type line icon entry in the typography/icon spec table (currently specifying font, size, color, placement for the faction icon on the type line). Remove this entry entirely.

Also find the paragraph that reads approximately:
> "Render each faction icon in its faction token color…" / "The token color column is for runtime tinting only…"

Remove this paragraph and the associated `Image("faction_demonic").renderingMode(.template)` SwiftUI code example. The faction icon no longer appears on the type line.

---

**Section 1.5 or wherever instability display is specced — Instability badge**

Find the instability display spec (currently: Oswald-Bold 10pt, faction token color at 80% opacity, D20 icon + numeral, left of stats bar).

Replace with:

```
| Property | Value |
|----------|-------|
| Component | InstabilityBadgeView — D20 base image with number overlaid in code |
| D20 asset | d20_instability_base.png — full color, swirling cobalt blue (left/chaos) and fiery orange (right/order), cracked face, 22×22pt display size |
| Number | Oswald-Bold, 9pt, white (#FFFFFF), shadow: black 60% opacity radius 1pt — overlaid at runtime, offset y=-1pt |
| Color | White only — not faction-tinted. Reads against both blue and orange areas of the D20. |
| Placement | Left side of stats bar, 4pt from left edge |
| Note | instability value 0 hides the badge entirely (guard > 0 before rendering) |
```

---

**Section 2.1 — Card Data Schema: `CardFaction` enum**

Find the `CardFaction` enum and the `var color: Color` computed property added during the guide fix session. Remove the entire `color` property:

```swift
// REMOVE this entire block from CardFaction:
var color: Color {
    switch self {
    case .ironwright: return Color("antique-silver")
    case .fey:        return Color("fey-teal")
    case .demonic:    return Color("wax-red")
    case .celestial:  return Color("aged-gold")
    case .endless:    return Color("rot-moss")
    }
}
```

Also remove the comment `/// Runtime tint color for faction icon and instability badge.` that precedes it.

After removal, confirm no other location in the guide references `card.faction.color` or `faction.color`. If any remain, update them: instability badge uses white, wax seal glow uses `rarity.waxColor`.

---

**Section 3.8 — Icon Generation Briefs: Faction icons**

The faction icon generation briefs stay — the assets are still generated and still used (now as the embossed symbol source for the wax seal). Update the section header and intro to clarify the new purpose:

Find the paragraph that introduces the faction icon generation briefs. It currently reads approximately:
> "Each faction has a unique icon displayed left-aligned on the type line…"

Replace the purpose statement with:
> "Faction icons are embossed into the wax seal for each card — the same five symbols (scroll, tree, sledgehammer, wing, skull) pressed into rarity-colored wax. They are not displayed on the type line. Generate once as white-on-transparent silhouette PNGs per the briefs below. The wax seal generation pipeline (WAX_SEAL_OVERHAUL_BRIEF.md) uses these symbol descriptions directly in its FACTION_SYMBOL prompts."

The per-faction briefs (scroll, tree, sledgehammer, wing, skull) and the post-processing pipeline are unchanged.

---

**Section 3.8 — D20 Instability Icon brief**

Find the D20 instability icon generation brief. The current brief describes a silhouette asset. Replace the entire brief with:

```
**D20 INSTABILITY ICON — Generation brief**

The D20 is a full-color asset — not a silhouette. It shows swirling cobalt blue (chaos, left side)
and fiery orange (order, right side) colliding at the center of the die face. The instability
number is overlaid in code at runtime (see InstabilityBadgeView). Generate once; all instability
values 0–5 use the same base image.

Prompt:
A twenty-sided die (D20), viewed straight-on, face showing. The die face is filled with
violently swirling magical energy — on the left side, deep electric cobalt blue with turbulent
swirling motion; on the right side, fierce fiery orange with upward-licking flame motion.
The two colors meet at the center in a chaotic collision, neither dominant.
The die has visible facets and edges — clearly a D20, not a sphere.
A single crack or fracture runs diagonally across the face, suggesting chaos and instability.
The crack is significant but the die shape remains clearly readable.
Fantasy magical artifact. Studio lighting with rim light. Isolated on pure white background.

Negative prompt: smooth gradient, flat, uniform color, cartoon, plastic, digital, text, numbers,
letters, blurry, soft, glowing outline, 2D, vector art, coin, circle, sphere, perfect symmetry

Post-processing: REMBG background removal (alpha_matting=True). Do NOT convert to silhouette —
retain full color. Downscale from 512×512 source to 144×144px (48pt @3x).
Store at: Resources/Icons/d20_instability_base.png
```

---

**Section 10.3b — Stats Bar: instability display call site**

Find the stats bar ZStack code. The instability display currently reads:
```swift
if card.instability > 0 {
    Text("⚡\(card.instability)")
        .font(.custom("Oswald-Bold", size: 10))
        .foregroundColor(card.faction.color.opacity(0.8))
}
```

Replace with:
```swift
if card.instability > 0 {
    InstabilityBadgeView(instability: card.instability)
}
```

---

**Section 10.3b or wherever `CardFaction.color` is referenced in view code**

Search the guide for any remaining reference to `card.faction.color` or `faction.color`. Remove or update each occurrence. After this pass, `CardFaction.color` should appear nowhere in the guide.

---

### 9b. Changes to `docs/CARD_DESIGN_QUICKREF.md`

---

**Type line zone table**

Find the type line row in the layout/zone measurements table. Remove the faction icon entry. Type line left side = card type text only.

---

**Instability display row**

Find the instability display row in the stats bar or typography table. Update it to reference `InstabilityBadgeView`, white numeral, D20 full-color asset.

---

**Key file locations table**

Add `InstabilityBadgeView.swift` to the key files table:

```
| Sources/Effects/InstabilityBadgeView.swift | D20 badge with runtime number overlay |
```

---

**Wax seal entry**

Update any wax seal description row to reflect:
- Wax color = rarity
- Embossed symbol = faction
- 25 images in Assets.xcassets/Icons/Seals/

---

### 9c. Verification after guide updates

```bash
# Confirm CardFaction.color is gone from guide
grep -n "faction\.color\|CardFaction.*color\|var color.*Color" docs/CARD_DESIGN_GUIDE.md
# Must return 0 results

# Confirm type line faction icon mention is gone
grep -n "type line.*faction icon\|faction icon.*type line" docs/CARD_DESIGN_GUIDE.md
# Must return 0 results

# Confirm D20 brief updated
grep -n "d20_instability_base\|InstabilityBadgeView" docs/CARD_DESIGN_GUIDE.md
# Must return at least 2 results

# Confirm wax seal semantic is documented
grep -n "rarity.*wax\|wax.*rarity\|faction.*symbol.*seal\|seal.*faction.*symbol" docs/CARD_DESIGN_GUIDE.md
# Must return at least 1 result
```

Write to `Logs/iteration_log.md`:
```
## Guide Files Updated — [timestamp]
docs/CARD_DESIGN_GUIDE.md:
  - Section 1.4: faction icon removed from type line spec
  - Section 1.5: faction icon typography entry removed; instability badge spec updated
  - Section 2.1: CardFaction.color computed property removed
  - Section 3.8: faction icon purpose updated (wax seal embossing, not type line); D20 brief updated to full-color
  - Section 10.3b: instability display updated to InstabilityBadgeView
docs/CARD_DESIGN_QUICKREF.md:
  - Type line table updated
  - Instability row updated
  - InstabilityBadgeView added to key files
  - Wax seal entry updated
Verification grep checks: [PASS / list any failures]
```


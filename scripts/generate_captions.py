#!/usr/bin/env python3
"""
Scripts/generate_captions.py
Generates caption .txt files for LoRA v2 training images.

Reads metadata from Training/TRAINING_MANIFEST.md, matches entries to image
files in Training/raw/<category>/ by Met object ID, and writes a caption .txt
file alongside each image.

Usage:
    python3 Scripts/generate_captions.py
    python3 Scripts/generate_captions.py --preview
    python3 Scripts/generate_captions.py --manifest Training/TRAINING_MANIFEST.md --raw Training/raw/
"""

import argparse
import os
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Artist style map — covers all artists in the training manifest
# ---------------------------------------------------------------------------

ARTIST_STYLE_MAP = {
    "rembrandt": "Rembrandt dramatic chiaroscuro style",
    "frans hals": "Frans Hals loose expressive brushwork",
    "peter paul rubens": "Rubens dynamic Baroque composition",
    "anthony van dyck": "Van Dyck elegant aristocratic portraiture",
    "giovanni battista tiepolo": "Tiepolo luminous Rococo ceiling style",
    "giovanni domenico tiepolo": "Tiepolo luminous Rococo narrative style",
    "camille corot": "Corot atmospheric tonal landscape style",
    "gustave courbet": "Courbet thick realist impasto",
    "eugène delacroix": "Delacroix vivid Romantic style",
    "goya": "Goya dark expressive style",
    "joseph mallord william turner": "Turner atmospheric light and color style",
    "john constable": "Constable naturalist landscape style",
    "lucas cranach": "Cranach Northern Renaissance style",
    "jean-baptiste greuze": "Greuze sentimental genre style",
    "johannes vermeer": "Vermeer luminous interior style",
    "gabriël metsu": "Metsu refined Dutch genre style",
    "henri-edmond cross": "Cross Neo-Impressionist pointillist style",
    "martín rico y ortega": "Rico luminous plein air landscape style",
    "ignacio de león y escosura": "León y Escosura detailed interior genre style",
    "lilly martin spencer": "Spencer domestic genre painting style",
    "albert pinkham ryder": "Ryder dark atmospheric visionary style",
    "victor eeckhout": "Eeckhout Dutch genre painting style",
    "peter monamy": "Monamy maritime painting style",
    "ralph earl": "Earl American portrait painting style",
    "frei carlos": "Frei Carlos Flemish devotional style",
    "john f. peto": "Peto American trompe-l'oeil still life style",
    "john a. woodside": "Woodside American still life realism",
    "joseph fagnani": "Fagnani academic portrait style",
    "giambattista cimaroli": "Cimaroli Venetian landscape style",
}

# ---------------------------------------------------------------------------
# Light and palette maps
# ---------------------------------------------------------------------------

ARTIST_LIGHT_MAP = {
    "rembrandt": "dramatic side lighting with deep shadows",
    "goya": "cold grey atmospheric light",
    "peter paul rubens": "warm golden directional light",
    "anthony van dyck": "soft diffused studio light",
    "giovanni battista tiepolo": "bright celestial overhead light",
    "giovanni domenico tiepolo": "bright warm overhead light",
    "eugène delacroix": "dramatic contrasting light",
    "gustave courbet": "natural directional daylight",
    "camille corot": "soft dappled silvery light",
    "joseph mallord william turner": "diffused atmospheric golden light",
    "john constable": "natural English daylight",
    "henri-edmond cross": "bright Mediterranean sunlight",
    "lucas cranach": "even northern studio light",
    "jean-baptiste greuze": "soft warm interior light",
    "johannes vermeer": "soft window light from the left",
    "gabriël metsu": "gentle interior window light",
    "frans hals": "bold directional side light",
    "albert pinkham ryder": "moonlit atmospheric glow",
}

ARTIST_PALETTE_MAP = {
    "rembrandt": "warm brown ochre and gold palette",
    "goya": "dark earth tones with bone-white accents",
    "peter paul rubens": "rich warm reds golds and flesh tones",
    "anthony van dyck": "refined silver grey and warm brown palette",
    "giovanni battista tiepolo": "luminous pastel blue pink and gold palette",
    "giovanni domenico tiepolo": "warm pastel and earth tone palette",
    "eugène delacroix": "vivid crimson blue and amber palette",
    "gustave courbet": "deep earthy greens browns and ochre",
    "camille corot": "silvery green and soft grey palette",
    "joseph mallord william turner": "warm amber gold and atmospheric grey palette",
    "john constable": "deep green white and warm brown palette",
    "henri-edmond cross": "vibrant saturated Mediterranean color palette",
    "lucas cranach": "rich jewel tones on dark ground",
    "jean-baptiste greuze": "warm flesh tones and muted earth palette",
    "johannes vermeer": "cool blue yellow and warm grey palette",
    "frans hals": "bold dark and light contrast palette",
    "albert pinkham ryder": "dark moody blue and amber palette",
}

CATEGORY_LIGHT_MAP = {
    "grimdark": "cold grey dramatic light with deep shadows",
    "landscapes": "natural daylight with atmospheric depth",
    "creatures": "warm directional light",
    "battle": "dramatic side lighting",
    "still_life": "warm directional studio light",
    "portraits": "dramatic chiaroscuro side lighting",
    "architecture": "natural ambient daylight",
}

CATEGORY_PALETTE_MAP = {
    "grimdark": "dark earth tones with bone-white and blood-red accents",
    "landscapes": "deep green ochre and sky-blue palette",
    "creatures": "warm brown and natural earth palette",
    "battle": "dark earth tones with blood-red and steel-grey palette",
    "still_life": "warm rich earth tone palette",
    "portraits": "warm brown ochre and gold palette",
    "architecture": "warm stone and earth tone palette",
}

CATEGORY_COMPOSITION_MAP = {
    "creatures": "creature composition",
    "landscapes": "landscape composition",
    "still_life": "still-life arrangement",
    "battle": "dynamic action scene",
    "architecture": "architectural scene",
    "grimdark": "dramatic narrative scene",
    "portraits": "portrait composition",
}

DEFAULT_LIGHT = "dramatic chiaroscuro lighting"
DEFAULT_PALETTE = "warm earth tone palette"
DEFAULT_COMPOSITION = "scene composition"
DEFAULT_STYLE = "Old Masters dramatic impasto style"


# ---------------------------------------------------------------------------
# Manifest parsing
# ---------------------------------------------------------------------------

def parse_manifest(manifest_path: str) -> dict:
    """
    Parse TRAINING_MANIFEST.md bullet-point format.
    Returns dict mapping object_id (str) -> {artist, title, category, date}.

    Expected format per category section:
        ### category_name
        - **object_id**: Title -- Artist (date) *
    """
    entries = {}

    with open(manifest_path, "r", encoding="utf-8") as f:
        content = f.read()

    current_category = None

    for line in content.splitlines():
        stripped = line.strip()

        # Detect category headers: ### architecture, ### battle, etc.
        header_match = re.match(r"^###\s+(\w[\w_]*)", stripped)
        if header_match:
            current_category = header_match.group(1).strip().lower()
            continue

        # Detect bullet entries: - **437853**: Title -- Artist (date) *
        bullet_match = re.match(
            r"^-\s+\*\*(\d+)\*\*:\s+(.+)",
            stripped,
        )
        if bullet_match and current_category:
            object_id = bullet_match.group(1)
            rest = bullet_match.group(2).strip()

            # Parse: Title -- Artist (date) *
            # Some have Artist|Another Artist format
            title = ""
            artist = ""
            date = ""

            # Split on " -- " to get title and artist+date
            if " -- " in rest:
                parts = rest.split(" -- ", 1)
                title = parts[0].strip()
                artist_date = parts[1].strip()

                # Remove trailing asterisk
                artist_date = artist_date.rstrip("*").strip()

                # Extract date in parentheses at the end
                date_match = re.search(r"\(([^)]*)\)\s*$", artist_date)
                if date_match:
                    date = date_match.group(1).strip()
                    artist_date = artist_date[: date_match.start()].strip()

                # Handle pipe-separated multiple artists — take the first
                if "|" in artist_date:
                    artist = artist_date.split("|")[0].strip()
                else:
                    artist = artist_date.strip()
            else:
                title = rest.rstrip("*").strip()

            entries[object_id] = {
                "object_id": object_id,
                "title": title,
                "artist": artist,
                "category": current_category,
                "date": date,
            }

    return entries


# ---------------------------------------------------------------------------
# Artist matching
# ---------------------------------------------------------------------------

def normalise(s: str) -> str:
    """Lowercase, strip, collapse whitespace."""
    return re.sub(r"\s+", " ", s.strip().lower())


def lookup_artist_key(artist_raw: str) -> str | None:
    """Find the matching key in ARTIST_STYLE_MAP for the given raw artist string."""
    if not artist_raw:
        return None

    norm = normalise(artist_raw)

    # Direct match
    if norm in ARTIST_STYLE_MAP:
        return norm

    # Check if any key is contained in the normalized name or vice versa
    for key in ARTIST_STYLE_MAP:
        if key in norm or norm in key:
            return key

    # Try matching by surname (last word)
    norm_surname = norm.split()[-1] if norm else ""
    for key in ARTIST_STYLE_MAP:
        key_surname = key.split()[-1]
        if norm_surname and norm_surname == key_surname:
            return key

    # Handle parenthetical full names like "Goya (Francisco de Goya y Lucientes)"
    # or "Rembrandt (Rembrandt van Rijn)"
    paren_match = re.search(r"\(([^)]+)\)", artist_raw)
    if paren_match:
        inner = normalise(paren_match.group(1))
        for key in ARTIST_STYLE_MAP:
            if key in inner or inner in key:
                return key

    # Also try the part before the parenthesis
    base_name = re.sub(r"\s*\(.*?\)", "", artist_raw).strip()
    base_norm = normalise(base_name)
    if base_norm in ARTIST_STYLE_MAP:
        return base_norm
    for key in ARTIST_STYLE_MAP:
        if key in base_norm or base_norm in key:
            return key

    return None


# ---------------------------------------------------------------------------
# Title cleaning
# ---------------------------------------------------------------------------

def clean_title_to_subject(title: str) -> str:
    """
    Convert a museum title into a natural subject description for a caption.
    Removes dates, parentheticals with years, and medium references.
    """
    if not title:
        return ""

    text = title.strip()

    # Remove parenthetical year/date info
    text = re.sub(r"\([\w\s.,\-–—~:;]*\d{4}[\w\s.,\-–—~:;]*\)", "", text)
    # Remove empty parentheses
    text = re.sub(r"\(\s*\)", "", text)
    # Remove medium phrases
    for phrase in ["oil on canvas", "oil on panel", "oil on wood", "oil on board",
                   "oil on copper"]:
        text = re.sub(re.escape(phrase), "", text, flags=re.IGNORECASE)
    # Collapse whitespace and strip edge punctuation
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^[\s,;:\-–—]+|[\s,;:\-–—]+$", "", text)

    return text.lower()


# ---------------------------------------------------------------------------
# Caption assembly
# ---------------------------------------------------------------------------

def build_caption(entry: dict, artist_key: str | None) -> str:
    """
    Build the caption string following §3.2e format:
      impasto oil painting, [subject], thick brushwork, paint ridges visible,
      dramatic chiaroscuro, [light], [palette], oil on canvas, [style], [composition]
    """
    category = entry.get("category", "").lower()

    # Subject description
    subject = clean_title_to_subject(entry.get("title", ""))
    if not subject:
        comp_type = CATEGORY_COMPOSITION_MAP.get(category, "scene")
        subject = comp_type

    # Light quality
    if artist_key and artist_key in ARTIST_LIGHT_MAP:
        light = ARTIST_LIGHT_MAP[artist_key]
    else:
        light = CATEGORY_LIGHT_MAP.get(category, DEFAULT_LIGHT)

    # Palette
    if artist_key and artist_key in ARTIST_PALETTE_MAP:
        palette = ARTIST_PALETTE_MAP[artist_key]
    else:
        palette = CATEGORY_PALETTE_MAP.get(category, DEFAULT_PALETTE)

    # Style reference
    if artist_key and artist_key in ARTIST_STYLE_MAP:
        style = ARTIST_STYLE_MAP[artist_key]
    else:
        style = DEFAULT_STYLE

    # Composition type
    composition = CATEGORY_COMPOSITION_MAP.get(category, DEFAULT_COMPOSITION)

    caption = (
        f"impasto oil painting, {subject}, "
        f"thick brushwork, paint ridges visible, "
        f"dramatic chiaroscuro, {light}, {palette}, "
        f"oil on canvas, {style}, {composition}"
    )

    return caption


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate caption .txt files for LoRA v2 training images."
    )
    parser.add_argument(
        "--manifest",
        type=str,
        default="Training/TRAINING_MANIFEST.md",
        help="Path to TRAINING_MANIFEST.md (default: Training/TRAINING_MANIFEST.md)",
    )
    parser.add_argument(
        "--raw",
        type=str,
        default="Training/raw/",
        help="Path to raw image directory (default: Training/raw/)",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Print captions to stdout without writing files",
    )
    args = parser.parse_args()

    # Resolve paths relative to script or cwd
    manifest_path = Path(args.manifest)
    raw_dir = Path(args.raw)

    if not manifest_path.is_file():
        print(f"ERROR: Manifest not found: {manifest_path.resolve()}", file=sys.stderr)
        sys.exit(1)
    if not raw_dir.is_dir():
        print(f"ERROR: Raw directory not found: {raw_dir.resolve()}", file=sys.stderr)
        sys.exit(1)

    # Parse manifest
    manifest_entries = parse_manifest(str(manifest_path))
    print(f"Parsed {len(manifest_entries)} entries from manifest.")

    # Find all image files
    image_exts = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".bmp"}
    image_files = []
    for dirpath, dirnames, filenames in os.walk(str(raw_dir)):
        for fname in filenames:
            if Path(fname).suffix.lower() in image_exts:
                image_files.append(Path(dirpath) / fname)

    image_files.sort()
    print(f"Found {len(image_files)} image files in {raw_dir.resolve()}")

    if not image_files:
        print("ERROR: No image files found.", file=sys.stderr)
        sys.exit(1)

    # Match images to manifest entries by object ID
    generated = 0
    unmatched = []
    review_items = []

    for img_path in image_files:
        stem = img_path.stem  # e.g., met_437853_Venice_from_the_Porch...

        # Extract object ID from filename: met_{ID}_{rest}
        id_match = re.match(r"met_(\d+)_", stem)
        if not id_match:
            unmatched.append(str(img_path))
            continue

        object_id = id_match.group(1)

        # Look up in manifest
        entry = manifest_entries.get(object_id)
        if not entry:
            # Fallback: derive category from parent directory
            category = img_path.parent.name
            entry = {
                "object_id": object_id,
                "title": stem.replace("met_" + object_id + "_", "").replace("_", " "),
                "artist": "",
                "category": category,
                "date": "",
            }
            review_items.append((str(img_path.name), "not found in manifest — used filename fallback"))

        # Resolve artist
        artist_key = lookup_artist_key(entry.get("artist", ""))
        if not artist_key and entry.get("artist"):
            review_items.append((str(img_path.name), f"artist '{entry['artist']}' not in style map"))

        # Build caption
        caption = build_caption(entry, artist_key)

        # Write or preview
        caption_path = img_path.with_suffix(".txt")

        if args.preview:
            flag = ""
            for item_name, reason in review_items:
                if item_name == img_path.name:
                    flag = " [REVIEW]"
                    break
            print(f"\n--- {img_path.relative_to(raw_dir)}{flag} ---")
            print(caption)
        else:
            with open(caption_path, "w", encoding="utf-8") as f:
                f.write(caption + "\n")
            generated += 1

    # Summary
    print()
    print("=" * 60)
    print("CAPTION GENERATION SUMMARY")
    print("=" * 60)
    print(f"  Total images found:     {len(image_files)}")

    if args.preview:
        print(f"  Mode: preview (no files written)")
    else:
        print(f"  Captions written:       {generated}")

    if unmatched:
        print(f"  Unmatched (no ID):      {len(unmatched)}")
        for u in unmatched:
            print(f"    - {u}")

    if review_items:
        print(f"  Needs manual review:    {len(review_items)}")
        for name, reason in review_items:
            print(f"    - {name}: {reason}")
    else:
        print(f"  Needs manual review:    0")

    print()
    print("Done.")


if __name__ == "__main__":
    main()

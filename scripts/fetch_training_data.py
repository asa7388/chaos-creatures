#!/usr/bin/env python3
"""Fetch public domain oil paintings from Met Museum for LoRA v2 training.

Reads pre-filtered CSV of Met Museum objects, categorizes by tags,
prioritizes desired artists, and downloads full-resolution images
via the Met's public API.

Usage:
    python3 Scripts/fetch_training_data.py --target 5 --dry-run
    python3 Scripts/fetch_training_data.py --target 100 --output Training/raw/
"""

import argparse
import csv
import json
import random
import re
import time
import urllib.error
import urllib.request
import shutil
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CSV_PATH = Path(__file__).parent.parent / "Training" / "cache" / "MetObjects.csv"

CATEGORY_TAGS = {
    "creatures": {
        "Horses", "Dogs", "Cows", "Birds", "Cats", "Animals", "Eagles",
        "Sheep", "Lions", "Fish", "Deer", "Dragons", "Unicorns", "Serpents",
    },
    "landscapes": {
        "Landscapes", "Rivers", "Mountains", "Forests", "Trees",
        "Seascapes", "Waterfalls", "Gardens", "Fields",
    },
    "still_life": {
        "Still Life", "Flowers", "Fruit", "Grapes",
        "Musical Instruments", "Books", "Vases",
    },
    "battle": {
        "Soldiers", "Ships", "Battles", "Armor", "Swords",
        "Warriors", "Weapons", "War", "Military",
    },
    "architecture": {
        "Buildings", "Interiors", "Churches", "Cathedrals", "Castles",
        "Houses", "Ruins", "Cities", "Bridges",
    },
    "grimdark": {
        "Christ", "Angels", "Saints", "Martyrdom", "Death", "Skulls",
        "Demons", "Hell", "Crucifixion", "Skeletons",
    },
    "portraits": {
        "Portraits", "Self-portraits",
    },
}

# Base targets for --target 100
CATEGORY_TARGETS_BASE = {
    "creatures": 25,
    "landscapes": 20,
    "still_life": 15,
    "battle": 12,
    "architecture": 12,
    "grimdark": 10,
    "portraits": 8,
}

# Artists whose work we prefer -- matched case-insensitively against Artist Display Name
DESIRED_ARTISTS = {
    "rembrandt", "frans hals", "courbet", "corot", "goya", "delacroix",
    "turner", "constable", "rubens", "van dyck", "tiepolo", "velazquez",
}

USER_AGENT = "ChaosCreatures/1.0 (LoRA training data collection)"
MET_API_BASE = "https://collectionapi.metmuseum.org/public/collection/v1/objects"
RATE_LIMIT_SECONDS = 1.5

# Medium keywords that indicate oil painting
MEDIUM_OIL_PATTERN = re.compile(r"\boil\b", re.IGNORECASE)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def is_oil_painting(medium: str) -> bool:
    """Return True if the medium string indicates an oil painting."""
    if not medium:
        return False
    return bool(MEDIUM_OIL_PATTERN.search(medium))


def parse_tags(tags_str: str) -> set:
    """Parse pipe-separated tags column into a set of stripped strings."""
    if not tags_str or not tags_str.strip():
        return set()
    return {t.strip() for t in tags_str.split("|") if t.strip()}


def categorize(tags: set) -> list:
    """Return list of category names this object belongs to."""
    cats = []
    for cat_name, cat_tags in CATEGORY_TAGS.items():
        if tags & cat_tags:
            cats.append(cat_name)
    return cats


def is_desired_artist(artist_name: str) -> bool:
    """Check if the artist name contains any desired artist substring."""
    lower = artist_name.lower()
    for a in DESIRED_ARTISTS:
        if a in lower:
            return True
    return False


def scale_targets(base_targets: dict, target_total: int) -> dict:
    """Scale category targets proportionally to the requested total."""
    base_total = sum(base_targets.values())  # 102
    scaled = {}
    for cat, base in base_targets.items():
        scaled[cat] = max(1, round(base * target_total / base_total))
    return scaled


def fetch_json(url: str) -> dict:
    """Fetch JSON from a URL with proper User-Agent header."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download_image(url: str, dest: Path) -> bool:
    """Download an image from URL to dest. Returns True on success."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(dest, "wb") as f:
                shutil.copyfileobj(resp, f)
        return True
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
        print(f"    [ERROR] Download failed: {e}")
        if dest.exists():
            dest.unlink()
        return False


# ---------------------------------------------------------------------------
# CSV Loading
# ---------------------------------------------------------------------------

def load_candidates(csv_path: Path) -> dict:
    """Load CSV, filter for public domain oil paintings, categorize by tags.

    Returns dict mapping category -> list of candidate dicts.
    Each candidate: {object_id, title, artist, medium, date, tags, categories}
    """
    print(f"Loading CSV from {csv_path} ...")

    candidates_by_cat = {cat: [] for cat in CATEGORY_TAGS}
    total_rows = 0
    oil_paintings = 0
    categorized = 0

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1

            # Filter: must be public domain
            if row.get("Is Public Domain", "").strip().lower() != "true":
                continue

            # Filter: must be oil painting
            medium = row.get("Medium", "")
            if not is_oil_painting(medium):
                continue

            oil_paintings += 1

            # Parse tags and categorize
            tags = parse_tags(row.get("Tags", ""))
            cats = categorize(tags)
            if not cats:
                continue

            categorized += 1

            candidate = {
                "object_id": row.get("Object ID", "").strip(),
                "title": row.get("Title", "").strip(),
                "artist": row.get("Artist Display Name", "").strip(),
                "medium": medium.strip(),
                "date": row.get("Object Date", "").strip(),
                "tags": tags,
                "categories": cats,
            }

            for cat in cats:
                candidates_by_cat[cat].append(candidate)

    print(f"  Total rows: {total_rows:,}")
    print(f"  Public domain oil paintings: {oil_paintings:,}")
    print(f"  With matching tags: {categorized:,}")
    print()
    print("  Category pool sizes:")
    for cat in sorted(candidates_by_cat.keys()):
        print(f"    {cat}: {len(candidates_by_cat[cat])}")
    print()

    return candidates_by_cat


# ---------------------------------------------------------------------------
# Selection
# ---------------------------------------------------------------------------

def select_candidates(candidates_by_cat: dict, targets: dict) -> dict:
    """Select candidates per category, prioritizing desired artists.

    Returns dict mapping category -> list of selected candidates.
    """
    selected = {}
    seen_ids = set()  # Avoid duplicates across categories

    for cat, target in targets.items():
        pool = candidates_by_cat.get(cat, [])

        # Split into preferred and other
        preferred = [c for c in pool if is_desired_artist(c["artist"])]
        other = [c for c in pool if not is_desired_artist(c["artist"])]

        # Shuffle each group
        random.shuffle(preferred)
        random.shuffle(other)

        # Preferred first, then other
        ordered = preferred + other

        # Select up to target, skipping duplicates
        picks = []
        for c in ordered:
            if c["object_id"] in seen_ids:
                continue
            picks.append(c)
            seen_ids.add(c["object_id"])
            if len(picks) >= target:
                break

        selected[cat] = picks

    return selected


# ---------------------------------------------------------------------------
# Fetching & Downloading
# ---------------------------------------------------------------------------

def fetch_and_download(selected: dict, output_dir: Path, dry_run: bool) -> dict:
    """Fetch primaryImage URLs from Met API and download images.

    Returns stats dict per category: {downloaded, skipped, failed, no_image}
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    stats = {}

    for cat, candidates in selected.items():
        cat_dir = output_dir / cat
        cat_dir.mkdir(parents=True, exist_ok=True)

        cat_stats = {"downloaded": 0, "skipped": 0, "failed": 0, "no_image": 0}

        print(f"\n--- {cat} ({len(candidates)} candidates) ---")

        for i, c in enumerate(candidates, 1):
            obj_id = c["object_id"]
            artist_short = c["artist"][:30] if c["artist"] else "Unknown"
            title_short = c["title"][:40] if c["title"] else "Untitled"

            # Determine output filename
            safe_title = re.sub(r'[^\w\s-]', '', c["title"])[:50].strip().replace(' ', '_')
            filename = f"met_{obj_id}_{safe_title}.jpg"
            dest = cat_dir / filename

            # Skip if already downloaded
            if dest.exists() and dest.stat().st_size > 1000:
                print(f"  [{i}/{len(candidates)}] SKIP (exists): {obj_id} -- {title_short}")
                cat_stats["skipped"] += 1
                continue

            if dry_run:
                print(f"  [{i}/{len(candidates)}] DRY: {obj_id} -- {artist_short} -- {title_short}")
                cat_stats["downloaded"] += 1  # Count as "would download"
                continue

            # Fetch object details from Met API
            print(f"  [{i}/{len(candidates)}] Fetching: {obj_id} -- {artist_short} -- {title_short}")
            try:
                data = fetch_json(f"{MET_API_BASE}/{obj_id}")
            except (urllib.error.URLError, urllib.error.HTTPError, OSError) as e:
                print(f"    [ERROR] API fetch failed: {e}")
                cat_stats["failed"] += 1
                time.sleep(RATE_LIMIT_SECONDS)
                continue

            image_url = data.get("primaryImage", "")
            if not image_url:
                print(f"    [SKIP] No primaryImage available")
                cat_stats["no_image"] += 1
                time.sleep(RATE_LIMIT_SECONDS)
                continue

            # Download the image
            if download_image(image_url, dest):
                size_kb = dest.stat().st_size / 1024
                print(f"    [OK] {size_kb:.0f} KB")
                cat_stats["downloaded"] += 1
            else:
                cat_stats["failed"] += 1

            time.sleep(RATE_LIMIT_SECONDS)

        stats[cat] = cat_stats

    return stats


# ---------------------------------------------------------------------------
# Manifest
# ---------------------------------------------------------------------------

def write_manifest(selected: dict, stats: dict, output_dir: Path, target_total: int, dry_run: bool):
    """Write training manifest to Training/TRAINING_MANIFEST.md."""
    manifest_path = output_dir.parent / "TRAINING_MANIFEST.md"

    lines = [
        "# LoRA v2 Training Data Manifest",
        "",
        f"Generated by `Scripts/fetch_training_data.py` -- target {target_total}",
        f"{'DRY RUN -- no images downloaded' if dry_run else 'Images downloaded to Training/raw/'}",
        "",
        "## Category Breakdown",
        "",
        "| Category | Target | Selected | Downloaded | Skipped | Failed | No Image |",
        "|----------|--------|----------|------------|---------|--------|----------|",
    ]

    total_selected = 0
    total_downloaded = 0

    for cat in sorted(selected.keys()):
        s = stats.get(cat, {})
        n_selected = len(selected[cat])
        total_selected += n_selected
        dl = s.get("downloaded", 0)
        total_downloaded += dl
        lines.append(
            f"| {cat} | {CATEGORY_TARGETS_BASE.get(cat, '?')} | {n_selected} "
            f"| {dl} | {s.get('skipped', 0)} "
            f"| {s.get('failed', 0)} | {s.get('no_image', 0)} |"
        )

    lines.append(f"| **Total** | **{sum(CATEGORY_TARGETS_BASE.values())}** | **{total_selected}** "
                 f"| **{total_downloaded}** | | | |")
    lines.append("")

    # List all selected objects
    lines.append("## Selected Objects")
    lines.append("")

    for cat in sorted(selected.keys()):
        lines.append(f"### {cat}")
        lines.append("")
        for c in selected[cat]:
            artist = c["artist"] or "Unknown"
            preferred = " *" if is_desired_artist(artist) else ""
            lines.append(f"- **{c['object_id']}**: {c['title']} -- {artist} ({c['date']}){preferred}")
        lines.append("")

    lines.append("---")
    lines.append("*Asterisk (*) indicates a preferred/desired artist.*")
    lines.append("")

    manifest_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nManifest written to {manifest_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Fetch public domain oil paintings from Met Museum for LoRA v2 training."
    )
    parser.add_argument(
        "--target", type=int, default=100,
        help="Total number of images to fetch (default: 100). Category targets scale proportionally.",
    )
    parser.add_argument(
        "--output", type=str, default="Training/raw",
        help="Output directory for downloaded images (default: Training/raw/)",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be downloaded without actually downloading.",
    )
    parser.add_argument(
        "--seed", type=int, default=42,
        help="Random seed for reproducible selection (default: 42).",
    )
    args = parser.parse_args()

    # Resolve output dir relative to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_dir = Path(args.output)
    if not output_dir.is_absolute():
        output_dir = project_root / output_dir

    random.seed(args.seed)

    print("=" * 60)
    print("Chaos Creatures -- LoRA v2 Training Data Fetcher")
    print("=" * 60)
    print(f"  Target: {args.target} images")
    print(f"  Output: {output_dir}")
    print(f"  Dry run: {args.dry_run}")
    print(f"  Seed: {args.seed}")
    print()

    # Step 1: Load and filter CSV
    if not CSV_PATH.exists():
        print(f"ERROR: CSV not found at {CSV_PATH}")
        print("Download it from: https://github.com/metmuseum/openaccess")
        return

    candidates_by_cat = load_candidates(CSV_PATH)

    # Step 2: Scale targets
    targets = scale_targets(CATEGORY_TARGETS_BASE, args.target)
    print("Scaled targets:")
    for cat in sorted(targets.keys()):
        pool_size = len(candidates_by_cat.get(cat, []))
        print(f"  {cat}: {targets[cat]} (pool: {pool_size})")
    print()

    # Step 3: Select candidates
    selected = select_candidates(candidates_by_cat, targets)

    total_selected = sum(len(v) for v in selected.values())
    print(f"Total selected: {total_selected}")

    # Step 4: Fetch and download
    stats = fetch_and_download(selected, output_dir, args.dry_run)

    # Step 5: Write manifest
    write_manifest(selected, stats, output_dir, args.target, args.dry_run)

    # Summary
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for cat in sorted(stats.keys()):
        s = stats[cat]
        print(f"  {cat:15s}: {s.get('downloaded', 0):3d} downloaded, "
              f"{s.get('skipped', 0):3d} skipped, "
              f"{s.get('failed', 0):3d} failed, "
              f"{s.get('no_image', 0):3d} no image")

    total_dl = sum(s.get("downloaded", 0) for s in stats.values())
    total_skip = sum(s.get("skipped", 0) for s in stats.values())
    total_fail = sum(s.get("failed", 0) for s in stats.values())
    total_no = sum(s.get("no_image", 0) for s in stats.values())
    print(f"  {'TOTAL':15s}: {total_dl:3d} downloaded, "
          f"{total_skip:3d} skipped, {total_fail:3d} failed, {total_no:3d} no image")


if __name__ == "__main__":
    main()

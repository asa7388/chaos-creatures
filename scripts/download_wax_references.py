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

USER_AGENT = "ChaosCreatures/1.0 (reference-downloader; non-commercial evaluation use)"

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
    req = urllib.request.Request(api_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as r:
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


def download_file(url: str, dest: Path):
    """Download a file with proper User-Agent header."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        dest.write_bytes(r.read())


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
        download_file(url, dest)
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

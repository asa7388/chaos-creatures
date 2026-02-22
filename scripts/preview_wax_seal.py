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

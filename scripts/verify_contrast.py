#!/usr/bin/env python3
"""
Scripts/verify_contrast.py
Verifies WCAG AA contrast ratios for all text/background combinations
from the Chaos Creatures design palette.

Reference: docs/CARD_DESIGN_GUIDE.md Section 10.4 and Section 1.2

WCAG AA requirements:
  - Normal text: 4.5:1 minimum
  - Large text (18pt+ or 14pt+ bold): 3.0:1 minimum

We use 4.5:1 as the conservative threshold for all pairs.

Usage:
    python3 Scripts/verify_contrast.py
"""
import sys


def relative_luminance(hex_color):
    """
    Calculate relative luminance per WCAG 2.1 definition.
    Input: hex color string like '#F5E6C8'
    Output: relative luminance value (0.0 to 1.0)
    """
    hex_color = hex_color.lstrip("#")
    r, g, b = [int(hex_color[i : i + 2], 16) / 255.0 for i in (0, 2, 4)]

    def linearize(c):
        """Convert sRGB component to linear RGB."""
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)


def contrast_ratio(hex1, hex2):
    """
    Calculate WCAG contrast ratio between two colors.
    Formula: (L1 + 0.05) / (L2 + 0.05) where L1 >= L2
    """
    l1 = relative_luminance(hex1)
    l2 = relative_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def main():
    # Color palette from Section 1.2 of CARD_DESIGN_GUIDE.md
    # Token name -> hex (sRGB)
    palette = {
        "ink-black":           "#1A1208",
        "parchment-light":     "#F5E6C8",
        "parchment-mid":       "#D4B896",
        "parchment-dark":      "#8B6914",
        "aged-gold":           "#C8A951",
        "canvas-warm":         "#E8D5B0",
        "wax-red":             "#8B1A1A",
        "parchment-dark-mode": "#2A2015",
        "ink-dark-mode":       "#E8D5A0",
        "dark-wood":           "#2C1810",  # Referenced in task spec
        "white":               "#FFFFFF",
    }

    # All required text/background combinations
    # (text_hex, bg_hex, min_ratio, label)
    pairs = [
        # Task spec pair 1: Ink black on vellum/parchment-light
        (palette["ink-black"], palette["parchment-light"], 4.5,
         "ink-black (#1A1208) on parchment-light (#F5E6C8) — normal text"),

        # Task spec pair 2: Aged gold on dark wood
        (palette["aged-gold"], palette["dark-wood"], 4.5,
         "aged-gold (#C8A951) on dark-wood (#2C1810) — frame accents"),

        # Task spec pair 3: Parchment on dark wood
        (palette["parchment-light"], palette["dark-wood"], 4.5,
         "parchment-light (#F5E6C8) on dark-wood (#2C1810) — card on board"),

        # Task spec pair 4: White on ink black
        (palette["white"], palette["ink-black"], 4.5,
         "white (#FFFFFF) on ink-black (#1A1208) — high contrast"),

        # Task spec pair 5: Wax red on parchment
        (palette["wax-red"], palette["parchment-light"], 4.5,
         "wax-red (#8B1A1A) on parchment-light (#F5E6C8) — wax seal on card"),

        # Additional pairs from Section 10.4 of the guide:
        # parchment-dark on parchment-light (large text / flavor)
        (palette["parchment-dark"], palette["parchment-light"], 3.0,
         "parchment-dark (#8B6914) on parchment-light (#F5E6C8) — large text/flavor"),

        # ink-black on parchment-mid
        (palette["ink-black"], palette["parchment-mid"], 4.5,
         "ink-black (#1A1208) on parchment-mid (#D4B896) — text on shadow areas"),

        # Dark mode: ink-dark-mode on parchment-dark-mode
        (palette["ink-dark-mode"], palette["parchment-dark-mode"], 4.5,
         "ink-dark-mode (#E8D5A0) on parchment-dark-mode (#2A2015) — dark mode text"),

        # ink-black on canvas-warm
        (palette["ink-black"], palette["canvas-warm"], 4.5,
         "ink-black (#1A1208) on canvas-warm (#E8D5B0) — text on canvas background"),
    ]

    print()
    print("  WCAG AA Contrast Ratio Verification")
    print("  " + "=" * 60)
    print()

    all_pass = True
    pass_count = 0
    fail_count = 0

    for text_hex, bg_hex, required, label in pairs:
        ratio = contrast_ratio(text_hex, bg_hex)
        passed = ratio >= required
        status = "PASS" if passed else "FAIL"

        if passed:
            pass_count += 1
        else:
            fail_count += 1
            all_pass = False

        print(f"  {status}  {ratio:5.2f}:1 (need {required}:1) — {label}")

    print()
    print(f"  {'=' * 60}")
    print(f"  Results: {pass_count} passed | {fail_count} failed")
    print()

    if not all_pass:
        print("  CONTRAST FAILURES — fix before marking accessibility complete")
        print("  See Section 10.4 of CARD_DESIGN_GUIDE.md for fix actions")
        sys.exit(1)
    else:
        print("  All contrast ratios pass WCAG AA")
        sys.exit(0)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Scripts/compare_screenshots.py
Automated visual regression comparison between baseline and current screenshots.

Reference: docs/CARD_DESIGN_GUIDE.md Section 12.2

Compares two images pixel-by-pixel and reports whether the mean difference
is below the threshold (2.5% by default). Used to detect visual regressions
after code changes.

Usage:
    python3 Scripts/compare_screenshots.py baseline.png current.png [--output diff.png] [--threshold 0.025]

Exit codes:
    0 = PASS (diff below threshold, or no baseline exists)
    1 = FAIL (diff above threshold)
"""
import argparse
import json
import os
import sys


def compare(ref_path, current_path, threshold=0.025, output_path=None):
    """
    Compare two screenshots and return a result dict.

    Args:
        ref_path: Path to the baseline/reference image
        current_path: Path to the current screenshot
        threshold: Maximum allowed mean difference (0.0 - 1.0). Default 0.025 (2.5%)
        output_path: Optional path to save the diff image

    Returns:
        dict with keys: score, threshold, pass, ref, current
    """
    from PIL import Image, ImageChops

    if not os.path.exists(ref_path):
        print(f"No baseline — skipping comparison ({ref_path})")
        return {"score": 0.0, "threshold": threshold, "pass": True,
                "ref": ref_path, "current": current_path, "skipped": True}

    if not os.path.exists(current_path):
        result = {"error": f"Current not found: {current_path}", "pass": False}
        print(json.dumps(result, indent=2))
        return result

    # Open and normalize both images to same size for fair comparison
    ref = Image.open(ref_path).convert("RGB").resize((400, 560))
    cur = Image.open(current_path).convert("RGB").resize((400, 560))

    # Compute pixel-level difference
    diff = ImageChops.difference(ref, cur)

    # Calculate mean difference across all pixels, normalized to 0.0–1.0
    pixels = list(diff.get_flattened_data() if hasattr(diff, "get_flattened_data") else diff.getdata())
    total_diff = sum(sum(p) for p in pixels)
    max_possible = len(pixels) * 3 * 255
    score = total_diff / max_possible if max_possible > 0 else 0.0

    passed = score < threshold

    result = {
        "score": round(score, 4),
        "threshold": threshold,
        "pass": passed,
        "ref": ref_path,
        "current": current_path,
    }

    # Save diff image if output path is specified
    if output_path:
        # Amplify differences for visibility (scale up by 5x, capped at 255)
        from PIL import ImageEnhance
        amplified = diff.point(lambda x: min(x * 5, 255))
        amplified.save(output_path)
        result["diff_image"] = output_path

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Compare baseline and current screenshots for visual regression."
    )
    parser.add_argument(
        "baseline", help="Path to the baseline/reference screenshot"
    )
    parser.add_argument(
        "current", help="Path to the current screenshot to compare"
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Path to save the diff image (optional)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.025,
        help="Maximum allowed mean difference (default: 0.025 = 2.5%%)",
    )

    args = parser.parse_args()

    try:
        from PIL import Image, ImageChops
    except ImportError:
        print("ERROR: Pillow is required — pip3 install Pillow --break-system-packages")
        sys.exit(1)

    result = compare(args.baseline, args.current, args.threshold, args.output)

    # Print result as JSON
    print(json.dumps(result, indent=2))

    # Print human-readable summary
    print()
    if result.get("skipped"):
        print(f"  No baseline — skipping comparison")
        sys.exit(0)
    elif result.get("error"):
        print(f"  ERROR: {result['error']}")
        sys.exit(1)
    else:
        status = "PASS" if result["pass"] else "FAIL"
        print(f"  {status}  diff score: {result['score']:.4f} (threshold: {result['threshold']})")
        if result.get("diff_image"):
            print(f"  Diff image saved to: {result['diff_image']}")

    if not result["pass"]:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()

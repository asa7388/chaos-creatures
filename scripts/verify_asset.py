#!/usr/bin/env python3
"""
Scripts/verify_asset.py
Hard gate after every AI generation call. Exit 0 = all pass. Exit 1 = any fail.

Reference: docs/CARD_DESIGN_GUIDE.md Section 5.7

Usage:
    python3 Scripts/verify_asset.py --file path/to/file.png \
        [--min-width 512] [--min-height 512] \
        [--no-error-payload] [--warm-tone-check] \
        [--aspect-ratio 5:7]
"""
import argparse
import sys
from pathlib import Path


def check_valid_image(path):
    """Check that the file is a valid image openable by PIL."""
    try:
        from PIL import Image
        img = Image.open(path)
        img.verify()  # Verify it's not corrupted
        return True, None
    except ImportError:
        return False, "Pillow not installed — pip3 install Pillow --break-system-packages"
    except Exception as e:
        return False, f"cannot open as image: {e}"


def check_dimensions(path, min_width, min_height):
    """Check minimum width and height."""
    try:
        from PIL import Image
        img = Image.open(path)
        w, h = img.size
        errors = []
        if w < min_width:
            errors.append(f"width {w} < required {min_width}")
        if h < min_height:
            errors.append(f"height {h} < required {min_height}")
        return w, h, errors
    except ImportError:
        return 0, 0, ["Pillow not installed"]
    except Exception as e:
        return 0, 0, [f"cannot read dimensions: {e}"]


def check_error_payload(path):
    """Check if the file is actually a JSON error response, not an image."""
    try:
        with open(path, "rb") as f:
            header = f.read(64).strip()
            if header.startswith(b"{") or header.startswith(b"["):
                return False, "file looks like a JSON error payload, not an image"
        # Also try to open as image
        from PIL import Image
        img = Image.open(path)
        img.load()  # Force decode
        return True, None
    except ImportError:
        # If no PIL, at least check the JSON header
        with open(path, "rb") as f:
            header = f.read(64).strip()
            if header.startswith(b"{") or header.startswith(b"["):
                return False, "file looks like a JSON error payload, not an image"
        return True, None
    except Exception as e:
        return False, f"file is not a valid image: {e}"


def check_warm_tones(path):
    """Verify the image has warm tones (not cold blue/green dominant)."""
    try:
        from PIL import Image
        import statistics

        img = Image.open(path).convert("RGB")
        pixels = list(img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata())
        # Sample for performance on large images
        sample = pixels[:: max(1, len(pixels) // 2000)]

        avg_r = statistics.mean(p[0] for p in sample)
        avg_g = statistics.mean(p[1] for p in sample)
        avg_b = statistics.mean(p[2] for p in sample)

        # Blue-dominant check: if blue exceeds red by more than 15, it's too cool
        if avg_b > avg_r + 15:
            return False, (
                f"blue-dominant (R={avg_r:.0f}, G={avg_g:.0f}, B={avg_b:.0f}) "
                f"— wrong color grade, expected warm tones"
            )
        # Green-dominant check (optional, less strict)
        if avg_g > avg_r + 25 and avg_g > avg_b + 25:
            return False, (
                f"green-dominant (R={avg_r:.0f}, G={avg_g:.0f}, B={avg_b:.0f}) "
                f"— expected warm/neutral tones"
            )
        return True, f"warm tones OK (R={avg_r:.0f}, G={avg_g:.0f}, B={avg_b:.0f})"
    except ImportError:
        return True, "WARNING: Pillow not installed — warm tone check skipped"
    except Exception as e:
        return False, f"warm tone check error: {e}"


def check_aspect_ratio(path, target_ratio_str, tolerance=0.05):
    """Check aspect ratio is within tolerance of target (e.g. '5:7')."""
    try:
        from PIL import Image
        img = Image.open(path)
        w, h = img.size

        parts = target_ratio_str.split(":")
        if len(parts) != 2:
            return False, f"invalid aspect ratio format: {target_ratio_str} (expected W:H)"

        target_w, target_h = float(parts[0]), float(parts[1])
        target = target_w / target_h
        actual = w / h

        diff = abs(actual - target) / target
        if diff <= tolerance:
            return True, f"aspect ratio {w}:{h} ({actual:.3f}) within {tolerance*100}% of {target_ratio_str} ({target:.3f})"
        else:
            return False, (
                f"aspect ratio {w}:{h} ({actual:.3f}) differs from {target_ratio_str} "
                f"({target:.3f}) by {diff*100:.1f}% (tolerance: {tolerance*100}%)"
            )
    except ImportError:
        return True, "WARNING: Pillow not installed — aspect ratio check skipped"
    except Exception as e:
        return False, f"aspect ratio check error: {e}"


def main():
    parser = argparse.ArgumentParser(
        description="Verify an AI-generated asset meets quality requirements."
    )
    parser.add_argument(
        "--file", required=True, help="Path to image file to verify"
    )
    parser.add_argument(
        "--min-width", type=int, default=0, help="Minimum width in pixels"
    )
    parser.add_argument(
        "--min-height", type=int, default=0, help="Minimum height in pixels"
    )
    parser.add_argument(
        "--no-error-payload",
        action="store_true",
        help="Check that the image is NOT a text/error payload",
    )
    parser.add_argument(
        "--warm-tone-check",
        action="store_true",
        help="Verify image has warm tones (not cold blue/green dominant)",
    )
    parser.add_argument(
        "--aspect-ratio",
        type=str,
        default=None,
        help="Expected aspect ratio as W:H (e.g. 5:7). Tolerance: 5%%",
    )

    args = parser.parse_args()
    path = Path(args.file)
    results = []
    any_fail = False

    # ── File existence ──
    if not path.exists():
        print(f"FAIL  file not found: {path}")
        sys.exit(1)

    if path.stat().st_size == 0:
        print(f"FAIL  file is empty: {path}")
        sys.exit(1)

    results.append(("file exists", True, f"{path.name} ({path.stat().st_size} bytes)"))

    # ── Valid image check (always run) ──
    valid, err = check_valid_image(path)
    if valid:
        results.append(("valid image", True, "opens successfully"))
    else:
        results.append(("valid image", False, err))
        any_fail = True

    # ── Error payload check ──
    if args.no_error_payload:
        ok, msg = check_error_payload(path)
        results.append(("not error payload", ok, msg or "OK"))
        if not ok:
            any_fail = True

    # ── Dimension checks ──
    if args.min_width > 0 or args.min_height > 0:
        w, h, dim_errors = check_dimensions(path, args.min_width, args.min_height)
        if dim_errors:
            for e in dim_errors:
                results.append(("dimensions", False, e))
            any_fail = True
        else:
            results.append(("dimensions", True, f"{w}x{h}px (min: {args.min_width}x{args.min_height})"))

    # ── Warm tone check ──
    if args.warm_tone_check:
        ok, msg = check_warm_tones(path)
        results.append(("warm tones", ok, msg))
        if not ok:
            any_fail = True

    # ── Aspect ratio check ──
    if args.aspect_ratio:
        ok, msg = check_aspect_ratio(path, args.aspect_ratio)
        results.append(("aspect ratio", ok, msg))
        if not ok:
            any_fail = True

    # ── Print results ──
    print(f"\n  Asset Verification: {path.name}")
    print(f"  {'=' * 50}")
    for label, passed, detail in results:
        status = "PASS" if passed else "FAIL"
        print(f"  {status}  {label}: {detail}")

    print()
    if any_fail:
        print(f"  RESULT: FAIL — one or more checks failed for {path.name}")
        sys.exit(1)
    else:
        print(f"  RESULT: PASS — all checks passed for {path.name}")
        sys.exit(0)


if __name__ == "__main__":
    main()

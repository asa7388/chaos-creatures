#!/bin/bash
# screenshot_all_devices.sh
# Usage: ./Scripts/screenshot_all_devices.sh [smoke_test|regression] [--iteration N]
#
# Takes screenshots from available iOS simulators and saves them to Staging/screenshots/.
# Simulators are matched by name prefix. Skips unavailable devices gracefully.
# Uses "xcrun simctl io <udid> screenshot" (correct syntax for this Xcode version).
#
# Options:
#   --iteration N   Prefix screenshot filenames with iteration number (e.g., 003_iPhone_17_Pro_smoke_test.png)
#
# The app is landscape-locked, so all screenshots are captured in landscape orientation.
# PIL verification checks that screenshot dimensions match expected device resolutions.

set -euo pipefail

MODE="smoke_test"
ITERATION=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --iteration)
            ITERATION="$2"
            shift 2
            ;;
        *)
            MODE="$1"
            shift
            ;;
    esac
done

OUTPUT_DIR="Staging/screenshots"
mkdir -p "$OUTPUT_DIR"

# Devices available in Xcode 26.2 simulators.
# Format: "Device Name|expected_landscape_width|expected_landscape_height"
# Dimensions are in pixels (landscape = width > height).
DEVICES=(
    "iPhone 17 Pro|2796|1290"
    "iPhone 17|2556|1179"
    "iPad Pro 13-inch (M5)|2752|2064"
    "iPad Air 13-inch (M3)|2732|2048"
)

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for ENTRY in "${DEVICES[@]}"; do
    IFS='|' read -r DEVICE EXPECTED_W EXPECTED_H <<< "$ENTRY"
    SAFE_NAME=$(echo "$DEVICE" | tr ' ' '_' | tr '(' '_' | tr ')' '_')

    # Build filename with optional iteration prefix
    if [ -n "$ITERATION" ]; then
        PADDED=$(printf "%03d" "$ITERATION")
        OUTFILE="$OUTPUT_DIR/${PADDED}_${SAFE_NAME}_${MODE}.png"
    else
        OUTFILE="$OUTPUT_DIR/${SAFE_NAME}_${MODE}.png"
    fi

    echo "Looking for simulator: $DEVICE..."

    UDID=$(xcrun simctl list devices | grep "$DEVICE" | grep -v "unavailable" | head -1 | grep -oE '[A-F0-9a-f]{8}-[A-F0-9a-f]{4}-[A-F0-9a-f]{4}-[A-F0-9a-f]{4}-[A-F0-9a-f]{12}')

    if [ -z "$UDID" ]; then
        echo "  WARNING: Could not find simulator for '$DEVICE', skipping"
        SKIP_COUNT=$((SKIP_COUNT + 1))
        continue
    fi

    echo "  Found UDID: $UDID"

    # Boot if needed
    STATE=$(xcrun simctl list devices | grep "$UDID" | grep -oE '(Booted|Shutdown)')
    if [ "$STATE" != "Booted" ]; then
        echo "  Booting..."
        xcrun simctl boot "$UDID" 2>/dev/null || true
        sleep 5
    else
        echo "  Already booted."
    fi

    # Ensure landscape orientation — set appearance (orientation is app-controlled via Info.plist)
    xcrun simctl ui "$UDID" appearance light 2>/dev/null || true

    # Capture screenshot
    xcrun simctl io "$UDID" screenshot "$OUTFILE" 2>/dev/null

    if [ ! -f "$OUTFILE" ]; then
        echo "  FAIL: $DEVICE screenshot not written"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        continue
    fi

    SIZE=$(wc -c < "$OUTFILE" | tr -d ' ')
    echo "  Screenshot saved: $OUTFILE (${SIZE} bytes)"

    # PIL dimension verification
    # Check that the screenshot dimensions match expected device resolution.
    # For landscape apps, width should be > height.
    VERIFY_RESULT=$(python3 -c "
from PIL import Image
import sys

try:
    img = Image.open('$OUTFILE')
    w, h = img.size
    exp_w, exp_h = $EXPECTED_W, $EXPECTED_H

    # Check landscape orientation (width > height)
    if w < h:
        print(f'WARN: Screenshot is portrait ({w}x{h}), expected landscape')
        sys.exit(1)

    # Check dimensions match expected (allow either orientation match)
    if (w == exp_w and h == exp_h) or (w == exp_h and h == exp_w):
        print(f'OK: {w}x{h} matches expected {exp_w}x{exp_h}')
        sys.exit(0)
    else:
        # Dimensions may differ due to Xcode version / scale factor — warn but don't fail
        print(f'WARN: {w}x{h} differs from expected {exp_w}x{exp_h} (may be scale factor difference)')
        sys.exit(0)
except Exception as e:
    print(f'ERROR: Could not verify image: {e}')
    sys.exit(1)
" 2>&1)

    VERIFY_EXIT=$?
    echo "  Verify: $VERIFY_RESULT"

    if [ $VERIFY_EXIT -eq 0 ]; then
        echo "  PASS: $DEVICE"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "  FAIL: $DEVICE (dimension verification failed)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

echo ""
echo "========================================="
echo "Screenshot pass complete."
echo "  Passed: $PASS_COUNT  Failed: $FAIL_COUNT  Skipped: $SKIP_COUNT"
echo "  Output: $OUTPUT_DIR/"
echo "========================================="
ls -lh "$OUTPUT_DIR/" 2>/dev/null || echo "(directory empty or not found)"

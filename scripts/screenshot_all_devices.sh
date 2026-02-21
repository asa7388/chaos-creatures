#!/bin/bash
# screenshot_all_devices.sh
# Usage: ./Scripts/screenshot_all_devices.sh [smoke_test|regression]
#
# Takes screenshots from available iOS simulators and saves them to Tests/SmokeTest/.
# Simulators are matched by name prefix. Skips unavailable devices gracefully.
# Uses "xcrun simctl io <udid> screenshot" (correct syntax for this Xcode version).

MODE=${1:-smoke_test}
OUTPUT_DIR="Tests/SmokeTest"
mkdir -p "$OUTPUT_DIR"

DEVICES=(
    "iPhone 17 Pro"
    "iPhone 17 Pro Max"
    "iPhone 16e"
    "iPad Pro 13-inch"
)

for DEVICE in "${DEVICES[@]}"; do
    SAFE_NAME=$(echo "$DEVICE" | tr ' ' '_' | tr '(' '_' | tr ')' '_')
    echo "Looking for simulator: $DEVICE..."

    UDID=$(xcrun simctl list devices | grep "$DEVICE" | grep -v "unavailable" | head -1 | grep -oE '[A-F0-9a-f]{8}-[A-F0-9a-f]{4}-[A-F0-9a-f]{4}-[A-F0-9a-f]{4}-[A-F0-9a-f]{12}')

    if [ -z "$UDID" ]; then
        echo "  WARNING: Could not find simulator for '$DEVICE', skipping"
        continue
    fi

    echo "  Found UDID: $UDID"

    # Boot if needed
    STATE=$(xcrun simctl list devices | grep "$UDID" | grep -oE '(Booted|Shutdown)')
    if [ "$STATE" != "Booted" ]; then
        echo "  Booting..."
        xcrun simctl boot "$UDID" 2>/dev/null || true
        sleep 4
    else
        echo "  Already booted."
    fi

    OUTFILE="$OUTPUT_DIR/${SAFE_NAME}_${MODE}.png"
    xcrun simctl io "$UDID" screenshot "$OUTFILE" 2>/dev/null

    if [ -f "$OUTFILE" ]; then
        SIZE=$(wc -c < "$OUTFILE" | tr -d ' ')
        echo "  PASS: $DEVICE -> $OUTFILE (${SIZE} bytes)"
    else
        echo "  FAIL: $DEVICE screenshot not written"
    fi
done

echo ""
echo "Screenshot pass complete. Files in $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR/"

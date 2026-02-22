#!/bin/bash
# compile_shaders.sh
# Precompile Metal shaders to catch errors before Xcode build.
# Source: Section 6.1 of CARD_DESIGN_GUIDE.md
#
# Usage:
#   ./scripts/compile_shaders.sh
#   bash scripts/compile_shaders.sh && xcodebuild -scheme ChaosCreatures ...
#
# This catches shader errors in fast, readable output before the full Xcode
# build runs. Shader errors in a full xcodebuild are buried in thousands of
# lines — this surfaces them immediately.
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SHADERS_DIR="$PROJECT_DIR/ChaosCreatures/ChaosCreatures/Shaders"
OUTPUT_DIR="$PROJECT_DIR/ChaosCreatures/Logs/Shaders"
mkdir -p "$OUTPUT_DIR"

# Resolve Metal compiler and iPhone SDK
METAL=$(xcrun --find metal 2>/dev/null)
if [ -z "$METAL" ]; then
    echo "ERROR: Metal compiler not found. Run: xcodebuild -downloadComponent MetalToolchain"
    exit 1
fi
IPHONE_SDK=$(xcrun --sdk iphoneos --show-sdk-path 2>/dev/null)

echo "Compiling Metal shaders in $SHADERS_DIR ..."
echo "  metal: $METAL"
echo "  sdk:   $IPHONE_SDK"
echo ""

COMPILE_LOG="$OUTPUT_DIR/compile_log.txt"
> "$COMPILE_LOG"

for SHADER in "$SHADERS_DIR"/*.metal; do
    NAME=$(basename "$SHADER" .metal)
    echo "  Compiling $NAME.metal ..."
    OUTPUT=$("$METAL" \
        -isysroot "$IPHONE_SDK" \
        -target air64-apple-ios17.0 \
        "$SHADER" \
        -o "$OUTPUT_DIR/${NAME}.air" 2>&1)
    EXIT_CODE=$?
    echo "$OUTPUT" >> "$COMPILE_LOG"
    if [ $EXIT_CODE -ne 0 ]; then
        echo "  SHADER COMPILE FAILED: $SHADER"
        echo "  $OUTPUT"
        echo "  See $COMPILE_LOG"
        exit 1
    fi
    if [ -n "$OUTPUT" ]; then
        echo "  WARNING in $NAME: $OUTPUT"
    else
        echo "  OK: $NAME (clean)"
    fi
done

echo ""
echo "All shaders compiled successfully."
echo "Note: Xcode compiles shaders during app build — this script is for quick"
echo "      validation only. .air files in Logs/ are not shipped with the app."

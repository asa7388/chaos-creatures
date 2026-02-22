#!/bin/bash
# Scripts/generate_normal_map.sh
# Generates normal maps from heightmap/diffuse textures using ImageMagick.
# Uses emboss-based gradient computation to create RGB normal maps
# (R=X gradient, G=Y gradient, B=constant ~1.0).
#
# Reference: docs/CARD_DESIGN_GUIDE.md Section 3.5
#
# Usage:
#   bash Scripts/generate_normal_map.sh INPUT OUTPUT              # default strength 1.0
#   bash Scripts/generate_normal_map.sh INPUT OUTPUT --strength 2.0
#   bash Scripts/generate_normal_map.sh                           # process all known textures
#
# Requires: ImageMagick 7 (magick command)

set -e

# Resolve project root (script lives in Scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

STAGING_DIR="${PROJECT_ROOT}/Staging/textures"
RESOURCES_DIR="${PROJECT_ROOT}/Resources/Textures"
ASSETS_BASE="${PROJECT_ROOT}/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/Textures"

# ─────────────────────────────────────────────────
# Verify ImageMagick is installed
# ─────────────────────────────────────────────────
if ! command -v magick &> /dev/null; then
    echo "ERROR: ImageMagick 7 (magick) not found."
    echo "Install with: brew install imagemagick"
    exit 1
fi

# ─────────────────────────────────────────────────
# Generate a normal map from a single input image
# ─────────────────────────────────────────────────
generate_normal() {
    local INPUT="$1"
    local OUTPUT="$2"
    local STRENGTH="${3:-1.0}"

    if [ ! -f "$INPUT" ]; then
        echo "ERROR: Input file not found: $INPUT"
        return 1
    fi

    # Create output directory if needed
    local OUTPUT_DIR
    OUTPUT_DIR="$(dirname "$OUTPUT")"
    mkdir -p "$OUTPUT_DIR"

    # Create temp directory for intermediate files
    local TMPDIR
    TMPDIR=$(mktemp -d)
    trap "rm -rf '$TMPDIR'" RETURN

    echo "Generating normal map:"
    echo "  Input:    $INPUT"
    echo "  Output:   $OUTPUT"
    echo "  Strength: $STRENGTH"

    # Step 1: Convert to grayscale heightmap, resize to 1024x1024
    magick "$INPUT" -colorspace Gray -resize 1024x1024 "${TMPDIR}/heightmap.png"

    # Step 2: Compute X gradient (horizontal edges)
    # Using pixel shift and difference: p[-1,0] - p[1,0]
    magick "${TMPDIR}/heightmap.png" \
        \( -clone 0 -roll +1+0 \) \
        \( -clone 0 -roll -1+0 \) \
        -delete 0 \
        -fx "u-v+0.5" \
        "${TMPDIR}/nx.png"

    # Step 3: Compute Y gradient (vertical edges)
    # Using pixel shift and difference: p[0,-1] - p[0,1]
    magick "${TMPDIR}/heightmap.png" \
        \( -clone 0 -roll +0+1 \) \
        \( -clone 0 -roll +0-1 \) \
        -delete 0 \
        -fx "u-v+0.5" \
        "${TMPDIR}/ny.png"

    # Step 4: Apply strength scaling
    # Strength > 1.0 amplifies the normal map detail
    # Strength < 1.0 flattens it toward neutral (0.5, 0.5, 1.0)
    if [ "$STRENGTH" != "1.0" ] && [ "$STRENGTH" != "1" ]; then
        # Scale X gradient: lerp between 0.5 (flat) and computed value
        magick "${TMPDIR}/nx.png" \
            -fx "(u - 0.5) * $STRENGTH + 0.5" \
            "${TMPDIR}/nx.png"

        # Scale Y gradient
        magick "${TMPDIR}/ny.png" \
            -fx "(u - 0.5) * $STRENGTH + 0.5" \
            "${TMPDIR}/ny.png"
    fi

    # Step 5: Create constant blue channel (Z = 1.0, encoded as 255)
    magick "${TMPDIR}/heightmap.png" \
        -fx "1" \
        "${TMPDIR}/nz.png"

    # Step 6: Combine R (X), G (Y), B (Z) into final normal map
    magick "${TMPDIR}/nx.png" "${TMPDIR}/ny.png" "${TMPDIR}/nz.png" \
        -combine \
        "$OUTPUT"

    local SIZE
    SIZE=$(du -sh "$OUTPUT" | cut -f1)
    echo "  Done: $OUTPUT ($SIZE)"
}

# ─────────────────────────────────────────────────
# Process all known project textures
# ─────────────────────────────────────────────────
process_all() {
    echo "=== Processing all known texture heightmaps ==="
    echo ""

    local PROCESSED=0
    local SKIPPED=0

    # Parchment: use diffuse as heightmap source
    local PARCHMENT_SRC="${STAGING_DIR}/parchment_paper_diff_1k.jpg"
    local PARCHMENT_ALT="${RESOURCES_DIR}/parchment_base_raw.jpg"
    local PARCHMENT_OUT="${RESOURCES_DIR}/parchment_normal_generated.png"

    if [ -f "$PARCHMENT_SRC" ] || [ -f "$PARCHMENT_ALT" ]; then
        local SRC="$PARCHMENT_SRC"
        [ -f "$SRC" ] || SRC="$PARCHMENT_ALT"
        generate_normal "$SRC" "$PARCHMENT_OUT" "1.0"
        ((PROCESSED++))
    else
        echo "SKIP: Parchment source not found (run download_textures.sh first)"
        ((SKIPPED++))
    fi

    echo ""

    # Canvas: use diffuse as heightmap source
    local CANVAS_SRC="${STAGING_DIR}/canvas_1_diff_1k.jpg"
    local CANVAS_ALT="${RESOURCES_DIR}/canvas_base_raw.jpg"
    local CANVAS_OUT="${RESOURCES_DIR}/canvas_normal_generated.png"

    if [ -f "$CANVAS_SRC" ] || [ -f "$CANVAS_ALT" ]; then
        local SRC="$CANVAS_SRC"
        [ -f "$SRC" ] || SRC="$CANVAS_ALT"
        generate_normal "$SRC" "$CANVAS_OUT" "1.0"
        ((PROCESSED++))
    else
        echo "SKIP: Canvas source not found (run download_textures.sh first)"
        ((SKIPPED++))
    fi

    echo ""

    # Wax seal: check for a wax seal source heightmap
    local WAX_SRC="${STAGING_DIR}/wax_seal_heightmap.png"
    local WAX_ALT="${RESOURCES_DIR}/wax_seal_heightmap.png"
    local WAX_OUT="${RESOURCES_DIR}/wax_seal_normal.png"

    if [ -f "$WAX_SRC" ] || [ -f "$WAX_ALT" ]; then
        local SRC="$WAX_SRC"
        [ -f "$SRC" ] || SRC="$WAX_ALT"
        generate_normal "$SRC" "$WAX_OUT" "1.5"
        ((PROCESSED++))
    else
        echo "SKIP: Wax seal heightmap not found"
        echo "  (Use Scripts/generate_wax_normal.py for procedural dome normal map instead)"
        ((SKIPPED++))
    fi

    echo ""
    echo "=== Summary: $PROCESSED processed, $SKIPPED skipped ==="
}

# ─────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────
if [ $# -eq 0 ]; then
    # No arguments: process all known textures
    process_all
    exit 0
fi

# Parse arguments
INPUT=""
OUTPUT=""
STRENGTH="1.0"

while [ $# -gt 0 ]; do
    case "$1" in
        --strength)
            STRENGTH="$2"
            shift 2
            ;;
        *)
            if [ -z "$INPUT" ]; then
                INPUT="$1"
            elif [ -z "$OUTPUT" ]; then
                OUTPUT="$1"
            else
                echo "ERROR: Unexpected argument: $1"
                echo "Usage: $0 INPUT OUTPUT [--strength N]"
                exit 1
            fi
            shift
            ;;
    esac
done

if [ -z "$INPUT" ] || [ -z "$OUTPUT" ]; then
    echo "Usage: $0 INPUT OUTPUT [--strength N]"
    echo "       $0                               # process all known textures"
    exit 1
fi

generate_normal "$INPUT" "$OUTPUT" "$STRENGTH"

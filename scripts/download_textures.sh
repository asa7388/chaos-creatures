#!/bin/bash
# Scripts/download_textures.sh
# Downloads CC0 PBR textures from Poly Haven for card rendering pipeline.
# Textures are saved to Staging/textures/ and then copied to asset catalog
# imageset directories under ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/Textures/
#
# Reference: docs/CARD_DESIGN_GUIDE.md Section 4.4
#
# Usage:
#   bash Scripts/download_textures.sh
#
# All textures are CC0 (public domain) — no attribution required.
# Idempotent: skips files that already exist.

set -e

# Resolve project root (script lives in Scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Directories
STAGING_DIR="${PROJECT_ROOT}/Staging/textures"
RESOURCES_DIR="${PROJECT_ROOT}/Resources/Textures"
ASSETS_BASE="${PROJECT_ROOT}/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/Textures"
MANIFEST="${PROJECT_ROOT}/Resources/ASSET_LICENSE_MANIFEST.md"

mkdir -p "$STAGING_DIR" "$RESOURCES_DIR" "$ASSETS_BASE"

# ─────────────────────────────────────────────────
# Download URLs — Poly Haven API format
# Format: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/{resolution}/{name}/{name}_{type}_{resolution}.jpg
# ─────────────────────────────────────────────────
BASE="https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k"

# Define textures: ASSET_NAME  FILENAME  DESCRIPTION
declare -a TEXTURES=(
    "parchment_paper|parchment_paper_diff_1k.jpg|Parchment diffuse"
    "parchment_paper|parchment_paper_nor_gl_1k.jpg|Parchment normal map"
    "canvas_1|canvas_1_diff_1k.jpg|Canvas/burlap diffuse"
    "canvas_1|canvas_1_nor_gl_1k.jpg|Canvas/burlap normal map"
)

# ─────────────────────────────────────────────────
# Download function
# ─────────────────────────────────────────────────
download_texture() {
    local ASSET="$1" FILE="$2" DESC="$3"
    local URL="${BASE}/${ASSET}/${FILE}"
    local DEST="${STAGING_DIR}/${FILE}"

    if [ -s "$DEST" ]; then
        echo "SKIP (exists): $FILE"
        return 0
    fi

    echo "Downloading: $FILE ($DESC)"
    if curl -fsSL "$URL" -o "$DEST" 2>/dev/null; then
        if [ -s "$DEST" ]; then
            local SIZE
            SIZE=$(du -sh "$DEST" | cut -f1)
            echo "  OK: $FILE ($SIZE)"
            # Append to license manifest if it exists
            if [ -f "$MANIFEST" ]; then
                echo "| ${FILE} | polyhaven.com/a/${ASSET} | CC0 | $(date +%Y-%m-%d) | Yes | No | $DESC |" \
                     >> "$MANIFEST"
            fi
        else
            echo "  FAIL: $FILE downloaded but is empty"
            rm -f "$DEST"
            return 1
        fi
    else
        echo "  WARN: Could not download $FILE"
        echo "  Visit https://polyhaven.com/a/${ASSET} to download 1K JPG manually"
        echo "  Then place it at: $DEST"
        return 1
    fi
}

# ─────────────────────────────────────────────────
# Create imageset directory + Contents.json
# ─────────────────────────────────────────────────
create_imageset() {
    local NAME="$1"       # imageset name (e.g., parchment_base)
    local FILENAME="$2"   # image filename to reference in Contents.json
    local IMAGESET_DIR="${ASSETS_BASE}/${NAME}.imageset"

    mkdir -p "$IMAGESET_DIR"

    # Only create Contents.json if it doesn't exist
    local CONTENTS="${IMAGESET_DIR}/Contents.json"
    if [ -f "$CONTENTS" ]; then
        echo "  Contents.json already exists: ${NAME}.imageset"
        return 0
    fi

    cat > "$CONTENTS" << JSONEOF
{
  "images": [
    {
      "filename": "${FILENAME}",
      "idiom": "universal",
      "scale": "1x"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  },
  "properties": {
    "compression-type": "automatic"
  }
}
JSONEOF
    echo "  Created: ${NAME}.imageset/Contents.json"
}

# ─────────────────────────────────────────────────
# Create Textures group Contents.json if missing
# ─────────────────────────────────────────────────
if [ ! -f "${ASSETS_BASE}/Contents.json" ]; then
    cat > "${ASSETS_BASE}/Contents.json" << JSONEOF
{
  "info": {
    "author": "xcode",
    "version": 1
  }
}
JSONEOF
    echo "Created Textures group Contents.json"
fi

# ─────────────────────────────────────────────────
# Download all textures
# ─────────────────────────────────────────────────
echo "=== Downloading CC0 PBR textures from Poly Haven ==="
echo ""

DOWNLOAD_COUNT=0
SKIP_COUNT=0
FAIL_COUNT=0

for entry in "${TEXTURES[@]}"; do
    IFS='|' read -r ASSET FILE DESC <<< "$entry"
    if download_texture "$ASSET" "$FILE" "$DESC"; then
        ((DOWNLOAD_COUNT++))
    else
        ((FAIL_COUNT++))
    fi
done

echo ""

# ─────────────────────────────────────────────────
# Copy to friendly names in Resources/Textures/
# ─────────────────────────────────────────────────
echo "=== Copying to Resources/Textures/ with friendly names ==="

copy_if_exists() {
    local SRC="${STAGING_DIR}/$1"
    local DST="${RESOURCES_DIR}/$2"
    if [ -s "$SRC" ]; then
        cp "$SRC" "$DST"
        echo "  Copied: $1 -> $2"
    else
        echo "  SKIP (source missing): $1"
    fi
}

copy_if_exists "parchment_paper_diff_1k.jpg"    "parchment_base_raw.jpg"
copy_if_exists "parchment_paper_nor_gl_1k.jpg"  "parchment_normal_raw.jpg"
copy_if_exists "canvas_1_diff_1k.jpg"           "canvas_base_raw.jpg"
copy_if_exists "canvas_1_nor_gl_1k.jpg"         "canvas_normal_raw.jpg"

echo ""

# ─────────────────────────────────────────────────
# Create imageset directories and copy images into them
# ─────────────────────────────────────────────────
echo "=== Setting up asset catalog imagesets ==="

# Parchment base
create_imageset "parchment_base" "parchment_base.jpg"
if [ -s "${STAGING_DIR}/parchment_paper_diff_1k.jpg" ]; then
    cp "${STAGING_DIR}/parchment_paper_diff_1k.jpg" \
       "${ASSETS_BASE}/parchment_base.imageset/parchment_base.jpg"
fi

# Parchment normal
create_imageset "parchment_normal" "parchment_normal.jpg"
if [ -s "${STAGING_DIR}/parchment_paper_nor_gl_1k.jpg" ]; then
    cp "${STAGING_DIR}/parchment_paper_nor_gl_1k.jpg" \
       "${ASSETS_BASE}/parchment_normal.imageset/parchment_normal.jpg"
fi

# Canvas base
create_imageset "canvas_base" "canvas_base.jpg"
if [ -s "${STAGING_DIR}/canvas_1_diff_1k.jpg" ]; then
    cp "${STAGING_DIR}/canvas_1_diff_1k.jpg" \
       "${ASSETS_BASE}/canvas_base.imageset/canvas_base.jpg"
fi

# Canvas normal (mapped to brush_normal per guide Section 4.6 asset catalog structure)
create_imageset "brush_normal" "brush_normal.jpg"
if [ -s "${STAGING_DIR}/canvas_1_nor_gl_1k.jpg" ]; then
    cp "${STAGING_DIR}/canvas_1_nor_gl_1k.jpg" \
       "${ASSETS_BASE}/brush_normal.imageset/brush_normal.jpg"
fi

echo ""
echo "=== Texture download complete ==="
echo "Next steps:"
echo "  1. Run: python3 Scripts/set_astc_compression.py  (ensure ASTC on all imagesets)"
echo "  2. Run: bash Scripts/generate_normal_map.sh       (generate additional normal maps)"
echo "  3. Continue with Section 4.8 smoke test pipeline"

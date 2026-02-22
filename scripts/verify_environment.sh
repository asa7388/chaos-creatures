#!/bin/bash
# Scripts/verify_environment.sh
# Master environment check for Chaos Creatures card game implementation.
# Run from project root. Exit 0 = all clear. Exit 1 = one or more failures.
# Usage: bash Scripts/verify_environment.sh
#
# Reference: docs/CARD_DESIGN_GUIDE.md Section 4.1

set -o pipefail
PASS=0
FAIL=0
WARN=0
RESULTS=()

ok()   { PASS=$((PASS+1));  RESULTS+=("  ✓ $1"); }
fail() { FAIL=$((FAIL+1));  RESULTS+=("  ✗ $1"); }
warn() { WARN=$((WARN+1));  RESULTS+=("  ⚠ $1"); }

# Resolve project root relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "================================================"
echo "  Chaos Creatures — Environment Verification"
echo "================================================"
echo "  Project root: $PROJECT_ROOT"

# ── XCODE ────────────────────────────────────────────
echo ""
echo "── Xcode & Swift ──"

XCODE_PATH=$(xcode-select -p 2>/dev/null)
[ -n "$XCODE_PATH" ] && ok "Xcode path: $XCODE_PATH" || fail "Xcode not found — run: xcode-select --install"

SWIFT_VER=$(swift --version 2>&1 | grep -oE "Swift version [0-9]+\.[0-9]+(\.[0-9]+)?" | head -1 | sed 's/Swift version //')
SWIFT_MAJOR=$(echo "$SWIFT_VER" | cut -d. -f1)
[ "${SWIFT_MAJOR:-0}" -ge 5 ] && ok "Swift: v$SWIFT_VER" || fail "Swift 5.9+ required — got: $(swift --version 2>&1 | head -1)"

XCODE_VER=$(xcodebuild -version 2>/dev/null | head -1)
XCODE_MAJOR=$(echo "$XCODE_VER" | grep -oE "[0-9]+" | head -1)
[ "${XCODE_MAJOR:-0}" -ge 15 ] && ok "Xcode: $XCODE_VER" || fail "Xcode 15.2+ required — got: $XCODE_VER"

# ── AVAILABLE SIMULATORS ─────────────────────────────
echo ""
echo "── Available iOS Simulators ──"

SIM_LIST=$(xcrun simctl list devices available 2>/dev/null | grep -E "iPhone|iPad" || true)
if [ -n "$SIM_LIST" ]; then
    SIM_COUNT=$(echo "$SIM_LIST" | wc -l | tr -d ' ')
    ok "Found $SIM_COUNT available simulators"
    echo "$SIM_LIST" | head -20 | while read -r line; do echo "      $line"; done
    if [ "$SIM_COUNT" -gt 20 ]; then
        echo "      ... and $((SIM_COUNT - 20)) more"
    fi
else
    fail "No iOS simulators found — install via Xcode → Settings → Platforms"
fi

# Check for required simulators from the guide
echo ""
echo "── Required Simulators (Section 4.1) ──"

check_sim() {
    local GREP="$1" LABEL="$2"
    xcrun simctl list devices available 2>/dev/null | grep -q "$GREP" \
        && ok "Simulator: $LABEL" \
        || warn "Simulator not found: $LABEL — install via Xcode → Settings → Platforms"
}
check_sim "iPhone 15 Pro"              "iPhone 15 Pro"
check_sim "iPhone 12 "                 "iPhone 12 (performance floor)"
check_sim "iPad Pro.*12.9"             "iPad Pro 12.9\""
check_sim "iPad Air.*5th\|iPad Air.*M1" "iPad Air 5th gen"

# ── CLI TOOLS ────────────────────────────────────────
echo ""
echo "── CLI Tools ──"

check_cmd() {
    local CMD="$1" LABEL="$2" INSTALL="$3"
    if command -v "$CMD" &>/dev/null; then
        local VERSION=""
        case "$CMD" in
            magick)   VERSION=$($CMD --version 2>/dev/null | head -1 | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -1) ;;
            python3)  VERSION=$($CMD --version 2>/dev/null | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -1) ;;
            pip3)     VERSION=$($CMD --version 2>/dev/null | grep -oE "[0-9]+\.[0-9]+" | head -1) ;;
            node)     VERSION=$($CMD --version 2>/dev/null | sed "s/^v//") ;;
            npm)      VERSION=$($CMD --version 2>/dev/null) ;;
            convert)  VERSION=$($CMD --version 2>/dev/null | head -1 | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" | head -1) ;;
        esac
        [ -n "$VERSION" ] && ok "$LABEL: v$VERSION" || ok "$LABEL: $(command -v $CMD)"
    else
        fail "$LABEL not found — install: $INSTALL"
    fi
}

check_cmd magick    "ImageMagick (magick)"   "brew install imagemagick"
check_cmd convert   "ImageMagick (convert)"  "brew install imagemagick"
check_cmd python3   "Python 3"               "brew install python@3.11"
check_cmd pip3      "pip3"                   "brew install python@3.11"
check_cmd node      "Node.js"                "brew install node"
check_cmd npm       "npm"                    "brew install node"
check_cmd pngquant  "pngquant"               "brew install pngquant"
check_cmd svgexport "svgexport"              "npm install -g svgexport"
check_cmd ffmpeg    "ffmpeg"                 "brew install ffmpeg"
check_cmd jq        "jq"                     "brew install jq"

# license-plist (optional)
command -v license-plist &>/dev/null \
    && ok "license-plist: $(command -v license-plist)" \
    || warn "license-plist not installed — required before App Store submission: brew install mono0926/license-plist/license-plist"

# ── PYTHON LIBRARIES ─────────────────────────────────
echo ""
echo "── Python Libraries ──"

check_py() {
    local MOD="$1" PKG="$2" INSTALL="$3"
    python3 -c "import $MOD" 2>/dev/null \
        && ok "Python: $PKG" \
        || fail "Python: $PKG not found — pip3 install $INSTALL --break-system-packages"
}

check_py PIL        "Pillow"      "Pillow"
check_py numpy      "numpy"       "numpy"
check_py requests   "requests"    "requests"
check_py fal_client "fal_client"  "fal-client"
check_py rembg      "rembg"       "rembg"
check_py replicate  "replicate"   "replicate"

# ── API KEYS ─────────────────────────────────────────
echo ""
echo "── API Keys (.env) ──"

ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
    fail ".env file not found at $ENV_FILE — create it from Section 4.5 template"
else
    ok ".env file exists"
    # Source env file safely
    set -a
    source "$ENV_FILE" 2>/dev/null || true
    set +a

    check_key() {
        local KEY="$1" LABEL="$2" REQUIRED="$3" NOTE="$4"
        VAL="${!KEY}"
        if [ -n "$VAL" ]; then
            ok "Key set: $LABEL (${#VAL} chars)"
        elif [ "$REQUIRED" = "required" ]; then
            fail "Key missing: $LABEL ($KEY) — required"
        else
            warn "Key missing: $LABEL ($KEY) — optional ($NOTE)"
        fi
    }

    check_key "FAL_KEY"                "fal.ai (FLUX art)"                 required
    check_key "OPENAI_API_KEY"         "OpenAI (text gen)"                 required
    check_key "REPLICATE_API_TOKEN"    "Replicate (LoRA creature art)"     required
    check_key "SUPABASE_URL"           "Supabase URL"                      required
    check_key "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key"      required
    check_key "R2_ACCESS_KEY_ID"       "Cloudflare R2 Access Key"          required
    check_key "R2_SECRET_ACCESS_KEY"   "Cloudflare R2 Secret Key"          required
    check_key "LORA_URL"               "LoRA R2 weight URL"                optional "needed for LoRA creature gen"
    check_key "FREESOUND_API_KEY"      "Freesound (CC0 audio)"             optional "needed for Section 8.2 sound download"
fi

# ── API CONNECTIVITY ─────────────────────────────────
echo ""
echo "── API Connectivity (live checks) ──"

if command -v curl &>/dev/null; then
    # Supabase
    SUPA_URL="${SUPABASE_URL:-}"
    if [ -n "$SUPA_URL" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SUPA_URL/rest/v1/" -H "apikey: ${SUPABASE_ANON_KEY:-none}" 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
            ok "Supabase: reachable (HTTP $HTTP_CODE)"
        else
            fail "Supabase: unreachable (HTTP $HTTP_CODE) — check SUPABASE_URL"
        fi
    else
        warn "Supabase connectivity — skipped (SUPABASE_URL not set)"
    fi

    # fal.ai
    FAL="${FAL_KEY:-}"
    if [ -n "$FAL" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://fal.run/fal-ai/flux/dev" -H "Authorization: Key $FAL" 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "405" ] || [ "$HTTP_CODE" = "422" ]; then
            ok "fal.ai: reachable (HTTP $HTTP_CODE — key valid)"
        else
            fail "fal.ai: HTTP $HTTP_CODE — check FAL_KEY"
        fi
    else
        warn "fal.ai connectivity — skipped (FAL_KEY not set)"
    fi
else
    warn "curl not found — skipping connectivity checks"
fi

# ── SUMMARY ──────────────────────────────────────────
echo ""
echo "================================================"
echo "  Results: $PASS passed | $FAIL failed | $WARN warnings"
echo "================================================"
for R in "${RESULTS[@]}"; do echo "$R"; done
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo "ENVIRONMENT NOT READY — fix $FAIL failure(s) above before proceeding"
    exit 1
elif [ "$WARN" -gt 0 ]; then
    echo "Environment ready for core work — $WARN optional item(s) need attention"
    exit 0
else
    echo "ENVIRONMENT FULLY READY — all checks passed"
    exit 0
fi

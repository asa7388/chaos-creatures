#!/bin/bash
# Scripts/load_env.sh
# Sourceable script that loads .env from the project root.
# Usage: source Scripts/load_env.sh
#
# Reference: docs/CARD_DESIGN_GUIDE.md Section 4.5

# Resolve project root relative to script location
_LOAD_ENV_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_LOAD_ENV_PROJECT_ROOT="$(cd "$_LOAD_ENV_SCRIPT_DIR/.." && pwd)"
_LOAD_ENV_FILE="$_LOAD_ENV_PROJECT_ROOT/.env"

if [ ! -f "$_LOAD_ENV_FILE" ]; then
    echo "ERROR: .env not found at $_LOAD_ENV_FILE"
    echo "Create it from the Section 4.5 template in docs/CARD_DESIGN_GUIDE.md"
    return 1 2>/dev/null || exit 1
fi

# Count total key lines (lines matching KEY=value, ignoring comments and blank lines)
_ALL_KEYS=$(grep -cE '^[A-Z_]+=' "$_LOAD_ENV_FILE" 2>/dev/null || echo "0")
# Count keys that have a non-empty value after the =
_LOADED_KEYS=$(grep -cE '^[A-Z_]+=.+' "$_LOAD_ENV_FILE" 2>/dev/null || echo "0")
_EMPTY_KEYS=$((_ALL_KEYS - _LOADED_KEYS))

# Export all variables from .env
set -a
source "$_LOAD_ENV_FILE"
set +a

echo "Loaded $_LOADED_KEYS/$_ALL_KEYS keys from .env"
if [ "$_EMPTY_KEYS" -gt 0 ]; then
    echo "WARNING: $_EMPTY_KEYS key(s) are empty — check .env"
fi

# Clean up temporary variables
unset _LOAD_ENV_SCRIPT_DIR _LOAD_ENV_PROJECT_ROOT _LOAD_ENV_FILE _ALL_KEYS _LOADED_KEYS _EMPTY_KEYS

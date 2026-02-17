#!/bin/bash
# generate-cards.sh — Trigger batch card generation via admin API
# Usage: ./scripts/generate-cards.sh <faction> <count> [creature_type_hint]
# Example: ./scripts/generate-cards.sh IRONWRIGHT 10 "mechanical golem"
set -e

ADMIN_URL="${ADMIN_URL:-http://localhost:3002}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

FACTION="${1:?Usage: generate-cards.sh <faction> <count> [creature_type_hint]}"
COUNT="${2:?Usage: generate-cards.sh <faction> <count> [creature_type_hint]}"
CREATURE_TYPE="${3:-}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Error: ADMIN_TOKEN environment variable is required."
  echo "Get a token: curl -X POST $ADMIN_URL/api/auth -H 'Content-Type: application/json' -d '{\"password\":\"your-password\"}'"
  exit 1
fi

echo "Generating $COUNT cards for faction $FACTION..."

curl -X POST "$ADMIN_URL/api/generate-batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"faction_id\":\"$FACTION\",\"count\":$COUNT,\"creature_type_hint\":\"$CREATURE_TYPE\"}"

echo ""
echo "Batch generation triggered. Check the admin dashboard for results."

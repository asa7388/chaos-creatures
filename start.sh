#!/bin/bash
# start.sh — The only command the owner runs for local dev
set -e
npx supabase start && docker compose up -d && echo "
Local dev running:
  Supabase Studio: http://localhost:54323
  Game Server: http://localhost:3001
  Admin Dashboard: http://localhost:3002
  iOS Client: Open ChaosCreatures/ChaosCreatures.xcodeproj in Xcode, run on Simulator
"

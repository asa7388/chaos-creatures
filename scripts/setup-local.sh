#!/bin/bash
# setup-local.sh — Local development environment setup
# Starts Supabase, installs dependencies, and shows connection info.
set -e

echo "Setting up Chaos Creatures local dev environment..."

# 1. Install Node dependencies
echo "Installing game server dependencies..."
cd packages/game-server && npm install && cd ../..

echo "Installing admin dashboard dependencies..."
cd packages/admin-dashboard && npm install && cd ../..

# 2. Start Supabase local instance
echo "Starting Supabase..."
npx supabase start

# 3. Show connection info
echo ""
echo "Local dev environment ready!"
echo ""
echo "  Supabase Studio:   http://localhost:54323"
echo "  Supabase API:      http://localhost:54321"
echo "  Game Server:       cd packages/game-server && npm run dev"
echo "  Admin Dashboard:   cd packages/admin-dashboard && npm run dev"
echo "  iOS Client:        Open ChaosCreatures/ChaosCreatures.xcodeproj in Xcode"
echo ""
echo "Copy .env.example to .env in packages/game-server/ and packages/admin-dashboard/"
echo "Copy ChaosCreatures/.xcconfig.example to ChaosCreatures/ChaosCreatures/Config/Config.xcconfig"

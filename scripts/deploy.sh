#!/bin/bash
# deploy.sh — One-command backend deployment
# Pushes Supabase migrations, deploys Edge Functions, and deploys Railway services.
set -e

echo "Deploying Chaos Creatures backend..."

# 1. Push Supabase migrations
echo "Pushing database migrations..."
npx supabase db push

# 2. Deploy Edge Functions
echo "Deploying Edge Functions..."
npx supabase functions deploy --all

# 3. Deploy Game Server to Railway
echo "Deploying Game Server..."
cd packages/game-server
railway up --detach
cd ../..

# 4. Deploy Admin Dashboard to Railway
echo "Deploying Admin Dashboard..."
cd packages/admin-dashboard
railway up --detach
cd ../..

echo ""
echo "Backend deployment complete!"
echo "iOS builds are handled by Xcode Cloud (triggered by git tag)."
echo "  Beta: git tag beta/v0.1.0 && git push --tags"
echo "  Release: git tag release/v1.0.0 && git push --tags"

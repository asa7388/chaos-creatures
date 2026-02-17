# Chaos Creatures -- Build Phase Progress

## Current Wave: 0 (Not Started)

## Build Agents

| Wave | Agent | Description | Status | Files Produced | Tests |
|---|---|---|---|---|---|
| 0 | supabase-schema | DB migrations, seed data, RLS policies | Not started | — | — |
| 0 | project-scaffold | Repo structure, configs, deploy scripts | Not started | — | — |
| 1 | game-server | Railway turn engine, combat, WebSocket | Not started | — | — |
| 1 | edge-functions | Supabase Edge Functions (all services) | Not started | — | — |
| 1 | ai-pipeline | fal.ai + OpenAI + R2 card generation | Not started | — | — |
| 2 | ios-app-shell | SwiftUI navigation, auth, screens | Not started | — | — |
| 2 | ios-battle | SpriteKit battlefield scene | Not started | — | — |
| 2 | admin-dashboard | Next.js admin web app | Not started | — | — |

## Code Reviews

| Wave | Review File | Critical | Warnings | Status |
|---|---|---|---|---|
| 0 | — | — | — | — |
| 1 | — | — | — | — |
| 2 | — | — | — | — |

## Wave Dependencies

```
Wave 0 (Foundation)     → Wave 1 (Backend)      → Wave 2 (Frontend)
  supabase-schema ─────→ edge-functions          ios-app-shell
                   ────→ game-server ───────────→ ios-battle
  project-scaffold ───→ all Wave 1               admin-dashboard
                        ai-pipeline ────────────→ admin-dashboard
```

## Integration Milestones (Wave 3+)

| Milestone | Description | Status |
|---|---|---|
| M1 | iOS app builds and launches in Simulator | Not started |
| M2 | Player can sign in with Apple and see home screen | Not started |
| M3 | Matchmaking finds opponent and starts match | Not started |
| M4 | Full battle plays out (9 phases, combat, events) | Not started |
| M5 | Evolution ceremony works with live AI art | Not started |
| M6 | StoreKit 2 subscriptions work end-to-end | Not started |
| M7 | Admin Dashboard can trigger batch generation and review cards | Not started |
| M8 | App Store submission package complete | Not started |

## Prerequisites Checklist

Before Wave 0 can start, the owner must:
- [ ] Create Supabase project → get URL + anon key + service role key
- [ ] Sign up for fal.ai → get FAL_KEY
- [ ] Sign up for OpenAI → get OPENAI_API_KEY
- [ ] Create Cloudflare R2 bucket → get R2 credentials
- [ ] Sign up for Railway → link GitHub repo
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Sign up for PostHog → get project API key

## Blockers

- None yet.

## Budget Tracker

| Category | Estimated | Actual | Notes |
|---|---|---|---|
| Supabase (free tier) | $0 | — | Dev on free tier |
| Railway (free tier + $5/mo) | $5 | — | Game server hosting |
| fal.ai (card art) | $50-80 | — | ~358 cards x $0.02/image |
| OpenAI (card text) | $5 | — | GPT-4o Mini for names/flavor |
| Cloudflare R2 (free tier) | $0 | — | 10 GB free storage |
| PostHog (free tier) | $0 | — | 1M events/month free |
| Apple Developer | $99 | — | Annual fee |
| **Total** | **~$160-190** | — | **Well within $300 budget** |

# Chaos Creatures -- Build Phase Progress

## Current Wave: 1 (Complete) → Wave 2

## Actual Directory Structure (set by project-scaffold)

The scaffold agent chose a monorepo layout. All agents must use these paths:
- `packages/game-server/` (not `server/`)
- `packages/admin-dashboard/` (not `admin/`)
- `packages/shared/` (shared TypeScript types + constants)
- `ChaosCreatures/` (not `ios/ChaosCreatures/`)
- `supabase/` (as expected)

## Build Agents

| Wave | Agent | Description | Status | Files Produced | Tests |
|---|---|---|---|---|---|
| 0 | supabase-schema | DB migrations, seed data, RLS policies | COMPLETE | 12 migrations, seed.sql, config.toml | `supabase db reset` PASS |
| 0 | project-scaffold | Repo structure, configs, deploy scripts | COMPLETE | 88+ iOS files, server/admin scaffolds, scripts, CI/CD | `npm install` PASS (both) |
| 1 | game-server | Railway turn engine, combat, WebSocket | COMPLETE | 31 files, 8,270 lines (engine, services, ws) | 238 tests PASS |
| 1 | edge-functions | Supabase Edge Functions (all services) | COMPLETE | 21 functions, 5 shared utils | 32 tests PASS |
| 1 | ai-pipeline | fal.ai + OpenAI + R2 card generation | COMPLETE | 14 files (4 Edge Functions, 4 services, prompt builder) | 81 tests PASS |
| 2 | ios-app-shell | SwiftUI navigation, auth, screens | Not started | — | — |
| 2 | ios-battle | SpriteKit battlefield scene | Not started | — | — |
| 2 | admin-dashboard | Next.js admin web app | Not started | — | — |

## Audit Gates

| Wave | Audit Agent | Report File | Critical | Warnings | Status |
|---|---|---|---|---|---|
| 0 | build-validator | — | — | — | Not started |
| 1 | build-validator | — | — | — | Not started |
| 1 | api-contract-auditor | — | — | — | Not started |
| 1 | security-auditor | — | — | — | Not started |
| 2 | build-validator | — | — | — | Not started |
| 2 | api-contract-auditor | — | — | — | Not started |
| 2 | security-auditor | — | — | — | Not started |
| 2 | simulator-test | — | — | — | Not started |
| 3 | e2e-test | — | — | — | Not started |
| 3 | req-coverage-auditor | — | — | — | Not started |

## Wave Dependencies

```
Wave 0 (Foundation)     → Wave 1 (Backend)      → Wave 2 (Frontend)
  supabase-schema ─────→ edge-functions          ios-app-shell
                   ────→ game-server ───────────→ ios-battle
  project-scaffold ───→ all Wave 1               admin-dashboard
                        ai-pipeline ────────────→ admin-dashboard

Between each wave:
  build-validator → api-contract-auditor + security-auditor (parallel)
  After Wave 2: + simulator-test
  After Wave 3: + e2e-test + req-coverage-auditor
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
- [x] Install Supabase CLI (`brew install supabase/tap/supabase`) — v2.75
- [x] Install Deno (`brew install deno`) — v2.6
- [x] Open Docker Desktop (Supabase local dev requires Docker) — running
- [ ] Create Supabase project → get URL + anon key + service role key (NOT needed for code writing — only for cloud deploy)
- [ ] Sign up for fal.ai → get FAL_KEY (NOT needed for code writing — mocked in tests)
- [ ] Sign up for OpenAI → get OPENAI_API_KEY (NOT needed for code writing — mocked in tests)
- [ ] Create Cloudflare R2 bucket → get R2 credentials (NOT needed for code writing — mocked in tests)
- [ ] Sign up for Railway → link GitHub repo (NOT needed for code writing — local dev only)
- [ ] Enroll in Apple Developer Program ($99/year) (NOT needed for Simulator builds)
- [ ] Sign up for PostHog → get project API key (NOT needed for code writing)

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

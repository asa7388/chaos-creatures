# Chaos Creatures — AI-Generated Card Game

## Project Overview
Chaos Creatures is a mobile-first collectible card game where every card's art is AI-generated and evolves through play. The core mechanic is a D20 Chaos Roll at the start of each turn that triggers Order or Chaos events based on the player's instability rating.

## Build Context

The entire Chaos Creatures project is built by a solo non-engineer using Claude Code. There is no engineering team. Every technical document is specific enough that Claude Code can implement directly from it — no ambiguity, no "the engineer should decide," no hand-waving.

The codebase is functionally complete (80+ Swift files, 28 game server files, 30 Edge Functions, 14 DB migrations, admin dashboard). The project is now in the **faction expansion overhaul** — expanding from 3 to 5 factions, adding Planar Ruins card type, retheme Ironwright, creating lore bible, then LoRA training and App Store submission. See `docs/design/PLAN-faction-expansion.md` for the full plan.

All build-phase agents must produce code-ready output: actual files, actual commands, actual configs. Not recommendations.

The owner's role is reviewer and decision-maker, not implementer. Every system should be built so the owner can:
- Run a single command or click a button to trigger a process
- Review outputs (cards, art, text, balance sheets) in a simple UI or spreadsheet
- Approve/reject with minimal effort
- Never write code, configure infrastructure, or debug errors manually

If a process requires more than 3 clicks or one terminal command from the owner, redesign it.

## Infrastructure Stack

These are the actual services the project uses. Do not recommend alternatives or say "consider X." These are decided.

- **Client**: Native iOS app. Swift + SwiftUI for UI, SpriteKit for battlefield/card animations. iOS 17+ minimum target.
- **Backend**: Supabase (Postgres database, Auth, Edge Functions for serverless game logic, Storage for non-art assets)
- **Game Server**: Railway (Node.js/TypeScript server for authoritative match resolution — the turn engine. Communicates with clients via direct WebSocket.)
- **Admin Dashboard**: Vercel (Next.js web app for owner workflows — card generation, balance review, analytics. Free tier.)
- **AI Image Generation**: fal.ai (FLUX Kontext API for card art generation and evolution img2img)
- **AI Text Generation**: OpenAI API (GPT-4o Mini for card names, flavor text, evolution narratives)
- **Card Art Storage + CDN**: Cloudflare R2 (stores generated card art, serves globally via built-in CDN)
- **Analytics**: PostHog (player behavior, retention, match data, economy health)
- **App Store**: Apple Developer Program (iOS only — no Android)
- **Payments**: App Store native IAP via StoreKit 2 (no Stripe, no RevenueCat, no third-party payment SDK)

All accounts are created and configured. Credentials are stored in gitignored files:
- `/.env` — Root env with Supabase, fal.ai, OpenAI, R2, PostHog keys
- `/packages/game-server/.env` — Game server credentials (Supabase service role, etc.)
- `/packages/admin-dashboard/.env.local` — Admin dashboard credentials (admin password, JWT secret, game server URL)
- `/ChaosCreatures/Config.xcconfig` — iOS client config (Supabase URL, anon key, game server URL)

## Client Technology

The client is a native iOS app built with Swift + SwiftUI + SpriteKit. NOT React Native. NOT Unity. NOT Expo. This is iOS only — no Android.

- SwiftUI for all non-game screens (collection, deck builder, shop, settings, onboarding)
- SpriteKit for the battlefield scene (card rendering, attack animations, damage numbers, chaos roll, event overlays)
- StoreKit 2 for in-app purchases and subscriptions (native Apple API, no third-party wrappers)
- URLSession + Supabase Swift SDK for networking
- Swift Concurrency (async/await) for all async operations

All UI/UX specs, technical architecture, and PRD must be written for Swift/SwiftUI/SpriteKit. No React Native, no Expo, no TypeScript on the client side. The server remains Node.js/TypeScript on Railway.

## Live Deployment

All services are deployed and operational:
- **Game Server**: `https://game-server-production-88e5.up.railway.app` (Railway)
- **Admin Dashboard**: `https://admin-dashboard-eight-sooty-40.vercel.app` (Vercel)
- **Supabase**: `https://nglnypbxjiswtgaxrxfr.supabase.co` (project ref: `nglnypbxjiswtgaxrxfr`)
- **R2 CDN**: `https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev`

## Current Build State

What's done:
- Database: 33 tables, 51 RLS policies, 5 RPCs, seed data (3 factions, 6 avatars, 50 economy configs, 16 events, 30 quest templates, 23 achievements, 1 season)
- Edge Functions: 24 deployed and active on Supabase
- Game Server: Deployed on Railway, health check passing, match engine + bot AI + matchmaking poller running
- Admin Dashboard: Deployed on Vercel, 8 pages (login, dashboard, cards, economy, analytics, batch generate, settings, generation jobs)
- iOS App: Builds and runs in Simulator, all screens implemented, practice match mode working
- Card Art: 35 base pool cards generated (13 Fey, 10 Demonic, 12 Ironwright-steampunk — Ironwright cards to be discarded after retheme). Prompt system v5.

What's in progress (Faction Expansion Overhaul):
- Expanding from 3 → 5 factions (adding Celestial Crusade, The Endless)
- Retheme Ironwright from Victorian steampunk → brutalist space-industrial empire
- Adding Planar Ruins card type (neutral → faction-evolved structures)
- Adding 2 keywords (Haste, Ward) → 9 total
- Creating lore bible (docs/design/11-lore-bible.md)
- Trimming all factions to 2 sub-factions each (10 total)
- Full plan: docs/design/PLAN-faction-expansion.md

What's NOT done:
- Faction expansion code changes (database, server, iOS, admin — all pending)
- Card art at scale (local scripts work; Edge Function auth bug bypassed)
- Professional card frames, fonts, icons, audio (placeholder assets)
- App Store submission (screenshots, legal pages, metadata)
- LoRA training (moved to after faction expansion)

Known bugs:
- Edge Function `verifyServiceRole()` returns 403 consistently — `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` doesn't match deployed secret. Bypassed with local generation scripts.
- fal.ai intermittently fails to download from R2 CDN — use base64 data URI workaround.

## Two Applications

The project produces TWO separate applications:

1. **Game Client** — Native iOS app (Swift/SwiftUI/SpriteKit). What players download from the App Store. All gameplay, collection, deck building, shop, and player-facing features.

2. **Admin Dashboard** — Next.js web app (deployed on Vercel, free tier). 8 pages built:
   - Login, Dashboard overview, Card generation & review gallery
   - Economy config editor, Analytics embed, Batch generation trigger
   - Settings, Generation job history
   The owner also uses **Supabase Dashboard** (built-in, free) for direct data tasks.

Every doc must be clear about which application a feature belongs to. No doc should spec admin features inside the iOS app or game features inside the admin dashboard.

## Budget Constraint

Total build-to-launch budget: $300 maximum. This covers all service signups, API usage for content generation, and first month of any paid tiers. Every doc that references infrastructure costs must include a dollar estimate and stay within this budget.

All visual assets should be AI-generated or free/open-source. Optional paid asset purchases (e.g., itch.io SFX/music packs) are acceptable within budget if free alternatives are insufficient.

### Polish Budget (~$100 remaining)

Approximately $185-209 has been spent on infrastructure. The remaining ~$100 is allocated to polish assets:
- Visual assets (frames, icons, card backs): AI-generated via fal.ai (~$4 total)
- Fonts: Google Fonts, free (Cinzel + Alegreya)
- SFX: freesound.org CC0 licensed sounds, free
- Music: Suno.ai free tier for faction battle tracks, free
- Optional upgrades: itch.io SFX/music packs ($15-30 each if free options are insufficient)

## Monetization Principle

The game must NOT be pay-to-win. Spending money gives cosmetic variety and convenience, never raw power. A free player with skill must always be able to beat a paying player.

Specifically:
- All cards are earnable through gameplay alone (Chaos Dust economy)
- Subscription tiers affect modifier selection breadth (2/3/4 options), not modifier quality — higher tiers see more choices but the choices are not inherently stronger
- No exclusive gameplay content behind paywalls
- Matchmaking must not pair free players against whales unfairly

## Launch Requirements (App Store)

This ships to the App Store only. Every doc must account for:
- Privacy policy hosted at a public URL (static page on Cloudflare Pages or GitHub Pages — free)
- Terms of service hosted at a public URL (same)
- App icon (1024x1024, generated via fal.ai)
- App Store screenshots (captured from Xcode Simulator)
- App Store description copy and keywords
- Age rating questionnaire answers
- App Store privacy nutrition labels (data collection declarations)

## Art Quality Target

Card art and visual quality must match Magic: The Gathering. Every card must look hand-painted by a professional fantasy illustrator. If a card looks AI-generated, smooth, generic, or "digital art"-looking, it is a failed generation and must be rejected/regenerated.

The locked style anchor (v5) references only public domain artists (all died pre-1953): Gustave Dore and N.C. Wyeth (base anchor), and faction-specific: Giovanni Battista Piranesi + John Martin (Ironwright), Arthur Rackham and Edmund Dulac (Fey Courts), Hieronymus Bosch (Demonic), Gustave Dore + William Blake (Celestial Crusade), Gustave Dore + Francisco Goya (The Endless). No copyrighted brand names or living artist references in any prompt. This produces traditional media aesthetics with heavy impasto brushstrokes, ink linework, crosshatching. Colors can be vivid and saturated within the palette knife oil painting aesthetic — faction identity is expressed through color.

## Art Consistency

All card art must look like it belongs in the same game. The visual style anchor is locked — a base prompt prefix that every single card image uses to enforce consistent rendering style, lighting, color palette, and framing. Individual cards vary in subject matter but share the same artistic DNA. If a card looks like it came from a different game, it's a failed generation and must be rejected/regenerated.

## Composition Variety

Card art must use varied compositions — not every card should be a centered three-quarter portrait. The prompt system includes 25 composition templates (portraits, action shots, environmental, dramatic, narrative) selected automatically based on card tier, keywords, and mana cost. No two cards in a batch should have the same pose/composition. Each faction has 13 specific environment descriptions for rich, atmospheric backgrounds. Additional variety dimensions: 8 weather modifiers (applied ~30% of the time), 6 time-of-day modifiers (applied ~40% of the time), and scale modifiers mapped to mana cost (TINY for CM 1, SMALL for CM 2, LARGE for CM 5-6, COLOSSAL for CM 7+).

## Card Visual System

Decided asset strategy for professional card appearance:

- **Card Frames**: Full-art cards with no bordered frames. Art fills the entire card face. A translucent text panel at the bottom contains card name (Cinzel font), stat icons (chaos-motes, sword-atk, heart-hp), faction icon, and flavor text. Rarity treatment applied as a thin edge glow at the card border.
- **Fonts**: Cinzel (card names, headers — classical display font) + Alegreya (body text, flavor text, stats — readable serif). Both from Google Fonts, free, OFL license.
- **Keyword Icons**: 9 AI-generated icons (Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing, Haste, Ward). 256x256, transparent background.
- **Faction Icons**: 5 AI-generated emblems (Ironwright, Fey, Demonic, Celestial, Endless). 512x512.
- **Card Backs**: 1 universal + 5 faction-specific, AI-generated.
- **Rarity Treatments**: Common (matte), Uncommon (metallic sheen), Rare (energy glow, SKAction pulse), Epic (purple shimmer, SKShader), Legendary (gold prismatic, particle emitter).

## Animation & Polish

The game must feel polished, not like a prototype. The tech architecture and UI specs must commit to:
- SpriteKit for all battlefield animations (card play, attacks, damage, death, chaos roll, events)
- SwiftUI animations for all menu/UI transitions
- Specific animation specs for: card play (hand to board), attack declaration (glow + movement), damage numbers (floating text), creature death (fade/shatter), chaos roll (D20 spin), event popup (slide in/out), evolution reveal (dramatic unveil)
- Loading states, error states, and empty states for every screen — no blank screens ever

## Testing & Validation

During development, agents can and should use the Xcode Simulator to test their work. This includes:
- Building the iOS app and launching it in the Simulator to check for compilation errors
- Visually inspecting UI layouts, animations, and screen flows in the Simulator
- Running the app through gameplay scenarios to validate game logic
- Taking screenshots from the Simulator to verify UI matches specs
- If a build fails or a UI looks wrong, the agent should fix the issue immediately before considering the task complete

Agents are also expected to write and run unit tests and integration tests as they build. Code is not considered done until it compiles, runs in the Simulator without crashes, and passes its tests.

## Safety Rules

These rules are absolute:
- NEVER delete any file in docs/design/ — only edit in place
- NEVER overwrite a file without appending to its Revision Log first
- ALWAYS git commit before starting any major operation
- NEVER run destructive bash commands (rm -rf, drop table, etc.)
- NEVER git force-push, rebase, or delete branches
- NEVER commit .xcconfig, .env, or any file containing API keys to git
- Ensure .gitignore includes: *.xcconfig, .env, .env.*, *.secret
- If something breaks, git stash or git revert — never try to manually reconstruct

## Protected Files

These design files are the source of truth for game design. They are the authority — downstream docs (03-10) must conform to them:
- docs/design/00-game-design-master.md
- docs/design/01-battle-mechanics.md
- docs/design/02-card-data-model.md

**Faction Expansion Authorization**: These files ARE authorized for edits during the faction expansion overhaul (adding Celestial Crusade, The Endless, Planar Ruins, Haste/Ward keywords, Ironwright retheme). All edits must include a Revision Log entry. After expansion is complete, they return to read-only status.

If a downstream doc (03-10) contradicts a protected file, the downstream doc is wrong and must be fixed to match the protected file. Never the other way around.

## Repository Structure
```
ChaosCreatures/                 — iOS app (Swift/SwiftUI/SpriteKit, Xcode project)
packages/game-server/           — Node.js/TS match engine (deployed on Railway)
packages/admin-dashboard/       — Next.js admin web app (deployed on Vercel)
supabase/                       — Migrations, seed data, Edge Functions
  migrations/                   — 14 SQL migrations (33 tables)
  functions/                    — 24 Edge Functions + 6 shared modules
  seed.sql                      — Seed data (factions, avatars, economy configs, etc.)
scripts/                        — Local generation scripts (card art, evolution, frames, icons)
docs/design/
  00-game-design-master.md      — Master design doc (all systems, UI, decisions)
  01-battle-mechanics.md        — Battle mechanics (PP, instability, turn structure)
  02-card-data-model.md         — Data model (all entities, enums, game state)
  03-prompt-templates.md        — AI generation pipeline (FLUX Kontext, GPT-4o Mini)
  04-progression-economy.md     — XP curves, Chaos Dust economy, quest design
  05-content-pipeline.md        — Batch generation tooling, QA, seasonal releases
  06-technical-architecture.md  — System design, APIs, infrastructure
  07-ui-ux-specs.md             — Wireframes and interaction specs
  08-audio-design.md            — Music, SFX, per-faction audio
  09-monetization-details.md    — Subscription tiers, pricing, conversion funnels
  10-prd.md                     — Formal PRD for engineering handoff
  11-lore-bible.md              — Universe lore, faction histories, avatars, sub-factions (NEW)
  12-art-direction.md           — App-wide art plan, asset inventory (NEW)
  PLAN-faction-expansion.md     — Master plan for faction expansion overhaul
  faction-art-bible.md          — Per-faction art guide (sub-factions, envs, moods, textures)
```

## Key Design Decisions (Do Not Contradict)
- 5 factions: Ironwright Collective (Augment), Fey Courts (Bond), Demonic Kingdoms (Corruption), The Celestial Crusade (Exalt), The Endless (Persist)
- Ironwright identity: Brutalist space-industrial empire conquering stars through industry and war efficiency. NOT steampunk.
- 2 sub-factions per faction (10 total): each with distinct visual identity, lore, and avatar
- 9 keywords: Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing, Haste, Ward
- Planar Ruins: New card type — ancient structures from Plane of Chaos. High HP, zero ATK, passive benefits, destruction penalties. Evolve neutral → faction-specific (one evolution, same subscription tier system). Max 1 on field, takes creature slot.
- MTG-style combat: declare attackers → defender assigns blockers → simultaneous damage
- Taunt = forced attack + forced block (two-part rule)
- Main phase only spells — no instant-speed, no response windows
- PP-based modifier pools: 5 factions × 28 faction modifiers + 30 universal = 170 modifiers
- Subscription-tiered modifier selection: Free (2 options), Mid (3), Top (4) — applies to both creature evolution and ruin evolution
- Chaos Dust economy: no real money on individual cards
- CM cost is fixed forever through evolution
- Evolution energy thresholds: 15/30/50/75, earn 2/win 1/loss, all 20 deck cards earn simultaneously
- Instability formula: avatar modifier + sum(creature base_instability + evolution changes + modifier adjustments), clamped 1-20
- 10 avatars (1 per sub-faction) with lore, instability modifier, play style

## Agent Workflow
This project uses orchestrator agents that delegate to specialized sub-agents. See `.claude/agents/` for all agent definitions.

- **Doc pipeline:** Complete. Orchestrator coordinated doc agents for docs 03-10.
- **Build pipeline:** Complete. Build-orchestrator coordinated build agents in waves with audit agents between waves.
- **Current phase:** Faction expansion overhaul — 8-phase plan with ~22 task agents + 10 audit agents. See `docs/design/PLAN-faction-expansion.md` for the full plan with agent assignments, phase dependencies, and user gates.

## Build Phase Protocol — Context Resilience

Build agents write many files over long sessions. Context window compaction will happen. Every build agent MUST follow this protocol to survive compaction without losing progress.

### Checkpoint Files

Every build agent maintains a checkpoint file in its module directory:

```
packages/game-server/CHECKPOINT.md       — game-server agent
supabase/CHECKPOINT.md                   — supabase-schema agent
supabase/functions/CHECKPOINT.md         — edge-functions agent
packages/admin-dashboard/CHECKPOINT.md   — admin-dashboard agent
ChaosCreatures/CHECKPOINT.md             — ios-app agents
```

Format:
```markdown
# {Agent Name} Checkpoint
## Status: in_progress | complete
## Files Created
- path/to/file.ts — description (complete | partial)
## Current Task
What is being worked on right now
## Test Results
- test_name: pass | fail | not_run
## Decisions Made
- Chose X pattern because Y
## Next Steps
- What remains to be done
```

Update the checkpoint after every file creation and every test run. This is the agent's recovery log.

### Recovery After Compaction

If context has been compacted (you don't remember prior work):
1. Read your `CHECKPOINT.md`
2. Run `git log --oneline -10` to see recent commits
3. Glob your module directory to see what files exist
4. Read any existing files before modifying or recreating them
5. Continue from where the checkpoint says you left off

### Commit Frequently

- Commit after every 2-3 files that compile and pass tests
- Commit message format: `build({module}): {what was added}`
  - Examples: `build(server): add combat resolution engine`, `build(ios): add home screen and tab navigation`
- Never let more than ~500 lines of uncommitted work accumulate

### Idempotent Execution

Agents must be safe to re-run on a partially-built module:
- Before creating a file, check if it already exists
- If it exists and looks complete, skip it
- If it exists but is partial, read it and continue from where it left off
- If tests already pass for a section, don't rewrite it
- Running an agent twice on the same module should produce the same result

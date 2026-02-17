# Chaos Creatures — AI-Generated Card Game

## Project Overview
Chaos Creatures is a mobile-first collectible card game where every card's art is AI-generated and evolves through play. The core mechanic is a D20 Chaos Roll at the start of each turn that triggers Order or Chaos events based on the player's instability rating.

## Build Context

Critical: The entire Chaos Creatures project will be built by a solo non-engineer using Claude Code to vibe code the implementation. There is no engineering team. Every technical document must be specific enough that Claude Code can implement directly from it — no ambiguity, no "the engineer should decide," no hand-waving. If a doc says "use WebSockets for match communication," it needs to specify the exact message format, connection lifecycle, and error handling. If it says "use PostgreSQL," it needs the actual schema, not just entity names. Implementation details cannot be left to interpretation — there is no one to interpret them.

All build-phase agents must produce code-ready output: actual files, actual commands, actual configs. Not recommendations.

The owner's role is reviewer and decision-maker, not implementer. Every system should be built so the owner can:
- Run a single command or click a button to trigger a process
- Review outputs (cards, art, text, balance sheets) in a simple UI or spreadsheet
- Approve/reject with minimal effort
- Never write code, configure infrastructure, or debug errors manually

This means every doc must design for maximum automation:
- Card generation is a batch pipeline the owner triggers, then reviews results in a grid/gallery and approves or rejects each card
- Balance testing is automated simulation, not manual playtesting
- Deployment is one command, not a runbook
- Content updates (new cards, events, quests) go through a review UI, not raw database edits
- The entire build process is Claude Code building from these docs with minimal human intervention

If a process requires more than 3 clicks or one terminal command from the owner, redesign it.

## Infrastructure Stack

These are the actual services the project will use. Do not recommend alternatives or say "consider X." These are decided.

- **Client**: Native iOS app. Swift + SwiftUI for UI, SpriteKit for battlefield/card animations. Xcode Cloud for builds. iOS 17+ minimum target.
- **Backend**: Supabase (Postgres database, Auth, Realtime for WebSocket match communication, Edge Functions for serverless game logic, Storage for non-art assets)
- **Game Server**: Railway (Node.js/TypeScript server for authoritative match resolution — the turn engine. Communicates with clients via Supabase Realtime channels or direct WebSocket. Auto-scales.)
- **AI Image Generation**: fal.ai (FLUX Kontext API for card art generation and evolution img2img)
- **AI Text Generation**: OpenAI API (GPT-4o Mini for card names, flavor text, evolution narratives)
- **Card Art Storage + CDN**: Cloudflare R2 (stores generated card art, serves globally via built-in CDN)
- **Analytics**: PostHog (player behavior, retention, match data, economy health)
- **App Store**: Apple Developer Program (iOS only — no Android)
- **Payments**: App Store native IAP via StoreKit 2 (no Stripe, no RevenueCat, no third-party payment SDK)

All infrastructure must be deployable from the project repo. Local dev = Supabase CLI + Xcode Simulator. Production = one-command deploy scripts for backend services, Xcode Cloud for iOS builds. The owner signs up for accounts and sets API keys in a config file. Claude Code does everything else.

Accounts the owner needs to create before build phase:
1. Supabase (supabase.com) — create a project, get URL + anon key + service role key
2. fal.ai (fal.ai) — sign up, get API key
3. OpenAI (platform.openai.com) — sign up, get API key
4. Cloudflare (cloudflare.com) — sign up, create R2 bucket
5. Railway (railway.app) — sign up, link GitHub repo
6. Apple Developer (developer.apple.com) — enroll ($99/year)
7. PostHog (posthog.com) — sign up, get project API key

All keys go in a single .xcconfig or environment config file. No other configuration needed.

## Client Technology

The client is a native iOS app built with Swift + SwiftUI + SpriteKit. NOT React Native. NOT Unity. NOT Expo. This is iOS only — no Android.

- SwiftUI for all non-game screens (collection, deck builder, shop, settings, onboarding, admin)
- SpriteKit for the battlefield scene (card rendering, attack animations, damage numbers, chaos roll, event overlays)
- StoreKit 2 for in-app purchases and subscriptions (native Apple API, no third-party wrappers)
- URLSession + Supabase Swift SDK for networking
- Swift Concurrency (async/await) for all async operations

All UI/UX specs, technical architecture, and PRD must be written for Swift/SwiftUI/SpriteKit. No React Native, no Expo, no TypeScript on the client side. The server remains Node.js/TypeScript on Railway.

## Three Tools

The project uses THREE separate tools for different purposes:

1. **Game Client** — Native iOS app (Swift/SwiftUI/SpriteKit). What players download from the App Store. All gameplay, collection, deck building, shop, and player-facing features.

2. **Admin Dashboard** — Custom web application (Next.js/TypeScript, deployed on Railway). The owner uses this for workflows that require custom UI:
   - Card generation batch trigger + review gallery (approve/reject/regenerate cards)
   - Balance simulation runner + results graphs
   - PostHog analytics embed / key metrics overview
   - App Store screenshot preview
   - Economy config editor (form fields, not raw JSON)
   This is a lightweight app — 4-5 screens max. It is NOT a full admin portal.

3. **Supabase Dashboard** — Built-in, free, no code needed. The owner uses this for direct data tasks:
   - View/search player accounts and match history
   - Edit economy config values directly in database rows
   - Manage auth (ban/unban players)
   - View active Realtime connections
   - Quick data fixes and one-off queries

Every doc must be clear about which tool a feature belongs to. No doc should spec admin features inside the iOS app, game features inside the admin dashboard, or custom UI for things Supabase dashboard already handles.

## Budget Constraint

Total build-to-launch budget: $300 maximum. This covers all service signups, API usage for content generation, and first month of any paid tiers. Use free tiers where available during development, but paid tiers (e.g., Supabase Pro) are acceptable within the budget. Every doc that references infrastructure costs must include a dollar estimate and stay within this budget.

Do not recommend any paid design tools, asset marketplaces, or premium services. All assets must be AI-generated or free/open-source.

## Launch Requirements (App Store)

This ships to the App Store only. Every doc must account for:
- Privacy policy hosted at a public URL (static page on Cloudflare Pages — free)
- Terms of service hosted at a public URL (same)
- App icon (1024x1024, generated via fal.ai)
- App Store screenshots (automated via Xcode UI tests or Fastlane snapshot)
- App Store description copy and keywords
- Age rating questionnaire answers
- App Store privacy nutrition labels (data collection declarations)

The content-pipeline doc must include generating these store assets as part of the launch checklist.

## Art Consistency

All card art must look like it belongs in the same game. The prompt-engineer doc must define a locked visual style anchor — a base prompt prefix that every single card image uses to enforce consistent rendering style, lighting, color palette, and framing. Individual cards vary in subject matter but must share the same artistic DNA. If a card looks like it came from a different game, it's a failed generation and must be rejected/regenerated.

## Animation & Polish

The game must feel polished, not like a prototype. The tech architecture and UI specs must commit to:
- SpriteKit for all battlefield animations (card play, attacks, damage, death, chaos roll, events)
- SwiftUI animations for all menu/UI transitions
- Specific animation specs for: card play (hand to board), attack declaration (glow + movement), damage numbers (floating text), creature death (fade/shatter), chaos roll (D20 spin), event popup (slide in/out), evolution reveal (dramatic unveil)
- Loading states, error states, and empty states for every screen — no blank screens ever

## Testing & Validation (Build Phase)

During the build phase, agents can and should use the Xcode Simulator to test their work. This includes:
- Building the iOS app and launching it in the Simulator to check for compilation errors
- Visually inspecting UI layouts, animations, and screen flows in the Simulator
- Running the app through gameplay scenarios to validate game logic
- Taking screenshots from the Simulator to verify UI matches specs
- If a build fails or a UI looks wrong, the agent should fix the issue immediately before considering the task complete

Agents are also expected to write and run unit tests and integration tests as they build. Code is not considered done until it compiles, runs in the Simulator without crashes, and passes its tests.

## Safety Rules (Bypass Permissions Mode)

Claude Code is running in bypass permissions mode. These rules are absolute:
- NEVER delete any file in docs/design/ — only edit in place
- NEVER overwrite a file without appending to its Revision Log first
- ALWAYS git commit before starting any major operation
- NEVER run destructive bash commands (rm -rf, drop table, etc.)
- NEVER git force-push, rebase, or delete branches
- NEVER commit .xcconfig, .env, or any file containing API keys to git
- Ensure .gitignore includes: *.xcconfig, .env, .env.*, *.secret
- If something breaks, git stash or git revert — never try to manually reconstruct

## Protected Files

These files are the source of truth for the entire project. After CLAUDE.md is updated in Step 1, the following files are READ-ONLY — no agent may modify them for the remainder of this operation:
- CLAUDE.md
- docs/design/00-game-design-master.md
- docs/design/01-battle-mechanics.md
- docs/design/02-card-data-model.md

If a downstream doc (03-10) contradicts a protected file, the downstream doc is wrong and must be fixed to match the protected file. Never the other way around.

Exception: In Step 1 only, the core docs (00, 01, 02) receive a light platform-alignment pass (see below). After that, they are locked.

## Repository Structure
```
docs/design/
  00-game-design-master.md    — Master design doc (all systems, UI, decisions)
  01-battle-mechanics.md      — Battle mechanics (PP, instability, turn structure, keywords, events, factions, modifiers)
  02-card-data-model.md       — Data model (all entities, enums, game state, data flows)
  03-prompt-templates.md      — AI generation pipeline (FLUX Kontext, GPT-4o Mini)
  04-progression-economy.md   — XP curves, Chaos Dust economy, quest design
  05-content-pipeline.md      — Batch generation tooling, QA, seasonal releases
  06-technical-architecture.md — System design, APIs, infrastructure
  07-ui-ux-specs.md           — Wireframes and interaction specs
  08-audio-design.md          — Music, SFX, per-faction audio
  09-monetization-details.md  — Subscription tiers, pricing, conversion funnels
  10-prd.md                   — Formal PRD for engineering handoff
  PROGRESS.md                 — Task tracking for orchestrator
```

## Key Design Decisions (Do Not Contradict)
- 3 factions: Ironwright Collective (Augment), Fey Courts (Bond), Demonic Kingdoms (Corruption)
- 7 keywords: Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing
- MTG-style combat: declare attackers → defender assigns blockers → simultaneous damage
- Taunt = forced attack + forced block (two-part rule)
- Main phase only spells — no instant-speed, no response windows
- PP-based modifier pools: 12 pools × (8 universal + 4 per faction) = 240 modifiers
- Subscription-tiered modifier selection: Free (2 options), Mid (3), Top (4)
- Chaos Dust economy: no real money on individual cards
- CM cost is fixed forever through evolution
- Evolution energy thresholds: 15/30/50/75, earn 2/win 1/loss, all 20 deck cards earn simultaneously
- Instability formula: avatar modifier + sum(creature base_instability + evolution changes + modifier adjustments), clamped 1-20

## Agent Workflow
This project uses an orchestrator agent that delegates to specialized sub-agents. See `.claude/agents/` for all agent definitions. The orchestrator coordinates the production of docs 03-10.

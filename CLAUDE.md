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

- **Client**: React Native (Expo) — NOT Unity. TypeScript. Ships to iOS and Android via Expo EAS Build. Claude Code can build and iterate on this directly.
- **Backend**: Supabase (Postgres database, Auth, Realtime for WebSocket match communication, Edge Functions for serverless game logic, Storage for non-art assets)
- **Game Server**: Railway (Node.js/TypeScript server for authoritative match resolution — the turn engine. Communicates with clients via Supabase Realtime channels or direct WebSocket. Auto-scales.)
- **AI Image Generation**: fal.ai (FLUX Kontext API for card art generation and evolution img2img)
- **AI Text Generation**: OpenAI API (GPT-4o Mini for card names, flavor text, evolution narratives)
- **Card Art Storage + CDN**: Cloudflare R2 (stores generated card art, serves globally via built-in CDN)
- **Analytics**: PostHog (player behavior, retention, match data, economy health)
- **App Stores**: Apple Developer Program + Google Play Developer Console
- **Payments**: App Store / Google Play native IAP (no Stripe needed — stores handle subscriptions)

All infrastructure must be deployable from the project repo. Local dev = Docker Compose or Supabase CLI. Production = one-command deploy scripts per service. The owner signs up for accounts and sets API keys in a .env file. Claude Code does everything else.

Accounts the owner needs to create before build phase:
1. Supabase (supabase.com) — create a project, get URL + anon key + service role key
2. fal.ai (fal.ai) — sign up, get API key
3. OpenAI (platform.openai.com) — sign up, get API key
4. Cloudflare (cloudflare.com) — sign up, create R2 bucket
5. Railway (railway.app) — sign up, link GitHub repo
6. Apple Developer (developer.apple.com) — enroll ($99/year)
7. Google Play (play.google.com/console) — register ($25)
8. PostHog (posthog.com) — sign up, get project API key

All keys go in a single .env file. No other configuration needed.

## Client Technology

The client is React Native (Expo) with TypeScript. NOT Unity. This is a firm decision driven by the vibe coding workflow — Claude Code works natively with TypeScript/React and cannot effectively drive the Unity editor. All UI/UX specs, technical architecture, and PRD must be written for React Native/Expo, not Unity. Card art rendering, animations, and battlefield interactions will use React Native Reanimated, Skia, or equivalent RN-compatible libraries.

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

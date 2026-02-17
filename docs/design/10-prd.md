# 10 -- Product Requirements Document (PRD)

## Chaos Creatures -- Build Handoff

| Field | Value |
|---|---|
| **Document Version** | 3.0 |
| **Date** | 2026-02-16 |
| **Status** | Final -- Ready for Build |
| **Owner** | Solo non-engineer owner, building with Claude Code |
| **Audience** | Claude Code (primary implementer), Owner (reviewer and decision-maker) |

**Build context:** This entire product will be built by a solo non-engineer using Claude Code to vibe code the implementation. There is no engineering team. Every requirement is written so that Claude Code can build it without ambiguity. If a paragraph leaves a decision to "the engineer," it is a bug in this document. The project produces TWO separate applications: a native iOS game client and a web-based Admin Dashboard. Every requirement clearly identifies which application it belongs to.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Stories](#2-user-stories)
3. [Feature Requirements (MVP)](#3-feature-requirements-mvp)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Requirements](#6-data-requirements)
7. [API Requirements](#7-api-requirements)
8. [AI Integration Requirements](#8-ai-integration-requirements)
9. [Analytics Requirements](#9-analytics-requirements)
10. [Launch Criteria](#10-launch-criteria)
11. [Dependencies and Risks](#11-dependencies-and-risks)
12. [Owner's Operational Workflow](#12-owners-operational-workflow)
13. [Accounts and Costs](#13-accounts-and-costs)
14. [Appendix: Document Index](#14-appendix-document-index)

---

## 1. Product Overview

### 1.1 What Is Chaos Creatures?

Chaos Creatures is a mobile collectible card game where every card's art is AI-generated and evolves through play. Players build 20-card, single-faction decks and battle in real-time PvP matches using an MTG-style combat system. The defining mechanic is the **D20 Chaos Roll**: at the start of each turn a D20 is rolled against the player's instability rating, triggering Order or Chaos events that reshape the board state. Cards accumulate energy through play and evolve through four tiers (Common to Uncommon to Rare to Epic to Legendary), with each evolution generating unique AI art, new abilities, and player-chosen modifiers.

### 1.2 Target Audience

- **Primary:** Mobile card game players aged 18-35 who enjoy strategic deckbuilding (ex-Hearthstone, Marvel Snap, Legends of Runeterra players).
- **Secondary:** Collectors and hobbyists drawn to AI-generated art and creature evolution.
- **Tertiary:** Competitive TCG players seeking a mobile alternative with meaningful strategic depth.

### 1.3 Platform

- **Primary:** Native iOS app built with Swift + SwiftUI + SpriteKit. Ships to the Apple App Store only.
- **Minimum target:** iOS 17+, iPhone 11 and newer.
- **No Android.** No React Native. No Unity. No Expo. No cross-platform framework.
- **Admin Dashboard:** Separate web application (Node.js + Express + static HTML/JS or React + Vite) deployed on Railway. Used by the owner only.

### 1.4 Core Differentiators

1. **AI-Generated Art:** Every card's art is created by FLUX Kontext (via fal.ai), evolving visually at each tier. No two players' Legendary cards look the same.
2. **Order/Chaos System:** The D20 Chaos Roll and instability system create a unique strategic axis where deck composition determines probability distributions for beneficial events.
3. **Faction Mechanics:** Three factions (Ironwright/Augment, Fey Courts/Bond, Demonic Kingdoms/Corruption) each with an exclusive mechanic that fundamentally changes how cards interact.
4. **No Pay-to-Win:** All cards are earned through gameplay. Subscriptions provide evolution quality and collection breadth, never exclusive power.
5. **Living Cards:** Cards are not static collectibles. They evolve, gain abilities, change names, and accumulate a visible history of player decisions.

### 1.5 Key Design Decisions (Immutable)

These decisions are finalized and must not be contradicted during implementation:

- 3 factions at launch: Ironwright Collective (Augment), Fey Courts (Bond), Demonic Kingdoms (Corruption)
- 7 keywords: Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing
- MTG-style combat: declare attackers, defender assigns blockers, simultaneous damage
- Taunt = forced attack + forced block (two-part rule)
- Main phase only spells -- no instant-speed, no response windows
- PP-based modifier pools: 12 pools x (8 universal + 4 per faction) = 240 modifiers
- Subscription-tiered modifier selection: Free (2 options), Mid (3), Top (4)
- Chaos Dust economy: no real money on individual cards
- CM cost is fixed forever through evolution
- Evolution energy thresholds: 15/30/50/75; earn 2/win, 1/loss; all 20 deck cards earn simultaneously
- Instability formula: avatar modifier + sum(creature base_instability + evolution changes + modifier adjustments), clamped 1-20

### 1.6 Infrastructure Stack (Non-Negotiable)

| Layer | Service | Notes |
|---|---|---|
| Client | Swift + SwiftUI + SpriteKit | Native iOS only. iOS 17+. Xcode Cloud for builds. |
| Auth | Supabase Auth | Apple Sign-In only (no Google -- iOS-only app) |
| Database | Supabase PostgreSQL | Row Level Security on all tables |
| Serverless API | Supabase Edge Functions (Deno/TypeScript) | Collection, Economy, Evolution, Matchmaking |
| Real-time | Supabase Realtime | WebSocket channels for match communication |
| Game Server | Railway (Node.js/TypeScript) | Authoritative match engine, auto-scales |
| AI Image | fal.ai (FLUX Kontext Dev and Pro) | Card art generation and evolution img2img |
| AI Text | OpenAI GPT-4o Mini | Card names, flavor text |
| Art CDN | Cloudflare R2 | Card art storage with built-in CDN |
| Analytics | PostHog | Player behavior, retention, economy health |
| Payments | StoreKit 2 (native Apple framework) | No RevenueCat. No Stripe. No third-party payment SDK. |
| App Build | Xcode Cloud | iOS builds and TestFlight distribution |
| Admin | Node.js + Express + static HTML/JS on Railway | Dashboard for owner operations |
| Legal Pages | Cloudflare Pages (free) | Privacy policy, Terms of Service |

### 1.7 Budget Constraint

Total build-to-launch budget: **$300 maximum**.

| Service | Build Phase Cost | Notes |
|---|---|---|
| Apple Developer | $99 | Mandatory for App Store distribution |
| Supabase | $25 | Free tier for dev; Pro plan for launch |
| Railway | $15 | Game server + admin dashboard |
| fal.ai | $80 | ~2000 image generations (base cards + testing + evolutions) |
| OpenAI | $2 | ~2000 text generation calls |
| Cloudflare R2 | $0 | Free tier (10 GB storage + 10M reads/mo) |
| PostHog | $0 | Free tier (1M events/mo) |
| Cloudflare Pages | $0 | Free tier for legal pages |
| Domain (optional) | $12 | Custom CDN URL |
| **Total** | **~$233** | **$67 buffer** |

---

## 2. User Stories

### 2.1 New Player

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-001 | As a new player, I want to try all three factions before committing so I can find my playstyle. | Player receives 3 premade 20-card loaner decks during trial phase. Player must play at least 1 match before faction selection is enabled. Trial decks cannot be modified or evolved. |
| US-002 | As a new player, I want a guided tutorial so I understand how combat, events, and evolution work. | Tutorial match runs with scripted rolls and AI opponent. SwiftUI overlays explain each phase. Tutorial can be skipped. First evolution is guided with explanatory overlays. |
| US-003 | As a new player, I want to evolve my first card immediately after onboarding so I experience the core loop. | After faction selection, player receives 200 Chaos Dust, 3 Uncommon Shards, 1 Rare Shard, 1 Legendary Shard, and a starter avatar. One card is pre-loaded with 15 energy for immediate evolution. |
| US-004 | As a new player, I want onboarding quests to guide my first week. | 8 onboarding quests auto-assigned (see `04-progression-economy.md` Section 6.5). Quests are separate from daily rotation and do not expire. Shown in a "Getting Started" UI tab. |

### 2.2 Casual Player (2-3 games/day)

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-005 | As a casual player, I want to complete daily quests in 20-40 minutes so I can progress without a large time commitment. | 3 daily quests generated at 00:00 UTC. Easy quests completable in 2-4 games. 1 free reroll per day. Quests persist until completed (do not expire). |
| US-006 | As a casual player, I want to see my cards evolve over weeks of play so I feel a sense of progression. | All 20 deck cards earn energy simultaneously (2/win, 1/loss). Energy progress visible on card detail screen. Evolution-ready indicator appears when threshold met and shard available. |
| US-007 | As a casual player, I want to build a competitive deck without paying money. | Free players can earn all cards via Chaos Dust. Free players reach competitive Rare-tier deck viability in 3-5 weeks. No card is locked behind a paywall. |

### 2.3 Competitive Player (5-10 games/day)

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-008 | As a competitive player, I want a ranked ladder with meaningful progression so I have a goal each season. | 17 rank tiers (Bronze 3 through Grandmaster). 8-week seasons. Rank floors at Silver 3, Gold 3, Platinum 3, Diamond 3. Season reset drops 5 divisions. End-of-season and monthly milestone rewards. |
| US-009 | As a competitive player, I want fair matchmaking so I face opponents of similar skill. | Ranked mode matches within +/- 2 rank tiers, expanding over time. Hidden MMR for casual mode. New player protection for first 50 games. |
| US-010 | As a competitive player, I want to sculpt my evolution paths precisely so I can optimize my builds. | Modifier selection presents options from correct pool (PP budget from CM cost + step, tier bracket, attunement from 70/30 outcome, faction). Duplicate prevention within a card's evolution history. At least 1 universal and 1 faction option at every evolution. |

### 2.4 Paying Subscriber

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-011 | As a subscriber, I want more modifier choices during evolution so I can refine my builds. | Free: 2 options (1 universal + 1 faction). Mid ($6.99/mo): 3 options (1 universal + 2 faction). Top ($12.99/mo): 4 options (2 universal + 2 faction). All tiers draw from the same pools -- no exclusive modifiers. |
| US-012 | As a subscriber, I want higher-quality evolution art so my cards look visually distinct. | Free: FLUX Kontext Dev, 768x1024, 1 pass. Mid: FLUX Kontext Pro, 1024x1024, 1 pass, priority queue. Top: FLUX Kontext Pro, 1024x1024, 2 passes (generate + refine), priority queue. |
| US-013 | As a subscriber, I want my subscription managed seamlessly through the App Store. | Subscription purchased via StoreKit 2 (native Apple API). `Transaction.currentEntitlements` and `Transaction.updates` detect tier changes. Sync to server via Supabase Edge Function. Grace period of 7 days on lapse before enforcing card limits. |
| US-014 | As a subscriber, I want more collection capacity so I can explore all factions. | Free: 50 cards/faction, 3 deck slots. Mid: 100 cards/faction, 5 deck slots. Top: 200 cards/faction, 10 deck slots. |

### 2.5 Cross-Faction Unlock

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-015 | As a player, I want to unlock additional factions through gameplay so I can explore new strategies. | Purchasing a card pack from another faction (150 Dust) permanently unlocks that faction. Once unlocked, player can build decks, earn cards, and access faction modifiers during evolution. Decks remain single-faction. |

---

## 3. Feature Requirements (MVP)

### 3.1 P0 -- Must Have (Launch Blockers)

| ID | Feature | Description | App | Reference |
|---|---|---|---|---|
| P0-001 | Core Battle System | 9-phase turn structure, D20 chaos roll, event resolution, MTG-style combat with all 7 keywords, simultaneous damage, timer management | iOS | `01-battle-mechanics.md` Sections 1-9 |
| P0-002 | Card Evolution | 4-tier evolution (Common through Legendary), energy accumulation, shard consumption, 70/30 channeling roll, modifier selection, triggered ability grant, stat growth, AI art generation via fal.ai | iOS | `01-battle-mechanics.md` Section 1, `02-card-data-model.md` Section 20 |
| P0-003 | Card Collection | CardInstance CRUD, ownership tracking, collection browsing with filters/search, card detail view, card limit enforcement by subscription tier | iOS | `02-card-data-model.md` Sections 1-5, `07-ui-ux-specs.md` Section 5 |
| P0-004 | Deck Building | 20-card deck construction, single-faction enforcement, copy limits (max 2 per template, max 2 Legendaries at 1 copy each), avatar selection, deck validation | iOS | `02-card-data-model.md` Section 11, `07-ui-ux-specs.md` Section 5.3 |
| P0-005 | Matchmaking | Ranked and Casual queue via Supabase `matchmaking_queue` table, rank-based matching with expanding search, match creation and player assignment | Backend | `06-technical-architecture.md` Section 2.6 |
| P0-006 | Economy Core | Chaos Dust earning (win/loss rewards), spending (card packs, shards, specific cards), shard inventory, transaction logging | Backend | `04-progression-economy.md` Sections 2-3 |
| P0-007 | Authentication | Apple Sign-In via Supabase Auth, JWT session management, subscription tier verification via StoreKit 2 entitlements synced to server | iOS + Backend | `06-technical-architecture.md` Section 2.1, `09-monetization-details.md` Section 2 |
| P0-008 | AI Art Generation | fal.ai FLUX Kontext integration for evolution art (img2img), FLUX Dev for batch base cards (txt2img), quality pipeline (fal.ai built-in NSFW filter, text-in-image prevention), fallback art via Sharp | Backend | `03-prompt-templates.md`, `06-technical-architecture.md` Section 3 |
| P0-009 | AI Text Generation | OpenAI GPT-4o Mini for card names (2-3 candidates) and flavor text at each evolution | Backend | `03-prompt-templates.md`, `06-technical-architecture.md` Section 3 |
| P0-010 | Battle UI | Battlefield layout (5 slots per side), hand display, mana crystals, HP bars, chaos roll animation, event overlay, turn phase indicator, timer bar, combat animations. SpriteKit `SKScene` for battlefield with SwiftUI overlay for HUD elements (opponent info, hand scroll, bottom controls). | iOS | `07-ui-ux-specs.md` Section 3 |
| P0-011 | Core Navigation | 5-tab bottom bar (Home, Collection, Decks, Profile, Shop) via SwiftUI `TabView`, battle flow (mode select, matchmaking, battle via `.fullScreenCover`, post-match) via `NavigationStack` | iOS | `07-ui-ux-specs.md` Sections 1-2 |
| P0-012 | Onboarding | Account creation via Supabase Auth (Apple Sign-In), faction trial (3 loaner decks), tutorial match (scripted), first evolution (guided), faction commitment | iOS | `07-ui-ux-specs.md` Section 7, `04-progression-economy.md` Section 6 |
| P0-013 | Game Server | Server-authoritative game logic on Railway (Node.js/TypeScript), communicates via Supabase Realtime channels, reconnection handling, anti-cheat validation | Backend | `06-technical-architecture.md` Sections 4.1-4.6 |
| P0-014 | Real-Time Match Communication | Supabase Realtime channels (`match:{match_id}`), client-to-server actions via `player_action` broadcast, server-to-client state via `game_event` broadcast, match lifecycle. Swift client uses Supabase Swift SDK for Realtime subscription. | iOS + Backend | `06-technical-architecture.md` Section 5 |
| P0-015 | Instability System | Player instability calculation (avatar + creature sum), clamped 1-20, recalculation on board changes, attunement state management | Backend | `01-battle-mechanics.md` Section 2 |

### 3.2 P1 -- Should Have (Target for Launch)

| ID | Feature | Description | App | Reference |
|---|---|---|---|---|
| P1-001 | Quest System | 3 daily quests (20 templates), 2 weekly quests (10 templates), quest generation algorithm, progress tracking, reward distribution, 1 free reroll/day | Backend + iOS | `04-progression-economy.md` Section 4 |
| P1-002 | Rank Ladder | 17 tiers, points system (+25/-20 same tier), rank floors, season structure (8 weeks), season reset (drop 5 divisions), end-of-season rewards | Backend + iOS | `04-progression-economy.md` Section 5 |
| P1-003 | Full Shop | Subscription tier display via StoreKit 2 paywall, card pack purchase (Dust), shard purchase (Dust), avatar unlock (Dust), subscription upgrade flow | iOS | `07-ui-ux-specs.md` Section 6, `09-monetization-details.md` Section 3 |
| P1-004 | All 3 Factions Complete | ~120 card templates per faction (100 creatures, 17 spells, 7 faction stabilizers) + 7 universal stabilizers. 240 modifier definitions. **367 total cards across 8 batches.** | Backend (content pipeline) | `05-content-pipeline.md` Section 1 |
| P1-005 | Cross-Faction Unlock | 150 Dust card pack unlocks new faction permanently | Backend | `04-progression-economy.md` Section 2.3 |
| P1-006 | Post-Match Results | Victory/defeat display, chaos energy earned per card, Dust earned, quest progress, evolution-ready indicators, play again/evolve/home buttons | iOS | `07-ui-ux-specs.md` Section 15 |
| P1-007 | Subscription Management | StoreKit 2 integration via `EntitlementManager` using `Transaction.currentEntitlements` and `Transaction.updates`. Server sync via Supabase Edge Function `/functions/v1/sync-entitlements`. App Store Server Notifications V2 webhook for subscription lifecycle events. Grace period on lapse. Restore Purchases button in Settings. | iOS + Backend | `09-monetization-details.md` Sections 2-5 |
| P1-008 | Audio System | Faction-specific battle music, adaptive intensity system (4-stem architecture via `AVAudioEngine`), SFX via `SKAction.playSoundFileNamed` in SpriteKit, `AVAudioPlayer` for menus. Music CAF format, SFX CAF format, ambient AAC format. ~23 MB total. Volume controls in Settings. | iOS | `08-audio-design.md` |
| P1-009 | Achievement System | Achievement definitions, progress tracking per player, one-time rewards, achievement display on profile | Backend + iOS | `02-card-data-model.md` Section 17 |
| P1-010 | Settings Screen | Account, Audio (master/music/SFX volume), Visuals (reduced motion, colorblind mode, animation quality, screen shake), Gameplay (auto-end turn, timer extension for casual), Notifications, Privacy, **Restore Purchases** button | iOS | `07-ui-ux-specs.md` Section 14 |
| P1-011 | Admin Dashboard | Web app on Railway: economy config editor, batch card generation trigger, generation review/approve/reject gallery, player lookup, match monitor, PostHog analytics embedding | Web (Admin) | `06-technical-architecture.md` Section 8 |

### 3.3 P2 -- Nice to Have (Post-Launch)

| ID | Feature | Description | App |
|---|---|---|---|
| P2-001 | Practice Mode vs AI | AI opponent with difficulty-based deck selection | iOS + Backend |
| P2-002 | Battle Pass | Free track (30 tiers) + Premium track (50 tiers, $9.99/season), XP progression | iOS + Backend |
| P2-003 | Cosmetics Store | Card backs, board skins, avatar frames, card reveal animations -- all direct purchase via StoreKit 2 | iOS |
| P2-004 | Friends List | Friend codes, friend requests, online status, friend profiles | iOS + Backend |
| P2-005 | Battle History / Replay | Match history for past 10 games, game log replay | iOS + Backend |
| P2-006 | Deck Import/Export | Share deck codes with other players | iOS |

---

## 4. Functional Requirements

### 4.1 Battle System

**Reference:** `01-battle-mechanics.md` (full specification), `06-technical-architecture.md` Section 4

#### Game Setup

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-001 | The game server shall randomly assign Player 1 (P1) and Player 2 (P2) at match start. | Assignment uses match PRNG seeded server-side. P1 and P2 sides are communicated to both clients via `match:start` event on the Supabase Realtime channel `match:{match_id}`. |
| REQ-002 | P1 shall draw 4 cards; P2 shall draw 5 cards plus a Chaos Spark. | Chaos Spark is a 0-cost, single-use spell granting +1 temporary mana. It does not count toward deck size. It cannot be mulliganed. |
| REQ-003 | Each player shall have one mulligan opportunity (shuffle entire hand, draw same number). | Mulligan decisions are simultaneous -- neither player sees the other's choice. Both must submit mulligan decisions before the game proceeds. Server waits for both or 15-second timeout (auto-keep). |
| REQ-004 | Each player shall start with 20 HP, 0 chaos motes, and an empty board. | HP cap is 20. Mana cap is 10. Board has 5 creature/stabilizer slots per player. |

#### Turn Structure

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-005 | Each turn shall execute 9 phases in fixed order: Start of Turn, Chaos Roll, Event Resolution, Draw and Gain Mana, Main Phase, Declare Attackers, Assign Blockers, Combat Resolution, End of Turn. | Phases 1-4 and 9 are automatic (no player input, no timer). Phases 5-6 are decision phases with a shared timer. Phase 7 is a decision phase for the defender with its own timer. Phase 8 resolves automatically after blocker confirmation. |
| REQ-006 | The active player shall have 60 seconds for all decision phases (5-6) combined. | Timer starts at Main Phase. At 15 seconds remaining, server broadcasts `timer:warning` on the Realtime channel. At 0 seconds, turn auto-ends with no attacks. Client triggers `UIImpactFeedbackGenerator` at 15-second warning. |
| REQ-007 | The defending player shall have 60 seconds for blocker assignment (phase 7). | Independent timer. At 0 seconds, no blockers assigned -- all attackers hit face. |
| REQ-008 | P1 shall not be allowed to attack on turn 1. | Server validates and rejects attack declarations from P1 on turn 1. Error code: `P1_NO_ATTACK_TURN_1`. |

#### Chaos Roll and Events

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-009 | The game server shall roll a D20 at the start of each turn and compare to the active player's instability. | Roll < instability = Chaos event. Roll > instability = Order event. Roll == instability = Nothing. RNG is seeded per match for reproducibility. |
| REQ-010 | When an event triggers, the system shall select one event uniformly at random from the 8-event pool for that type (12.5% each). | 8 Order events (O1-O8) and 8 Chaos events (C1-C8) as defined in `01-battle-mechanics.md` Sections 8-9. |
| REQ-011 | Events requiring player choice (O2 Planar Ward, O5 Fortify) shall provide a 10-second sub-timer. | Sub-timer does NOT count against the 60-second decision timer. On timeout, auto-select leftmost valid target. Valid targets highlight on screen via SpriteKit glow effect. |
| REQ-012 | After event resolution, all triggered abilities matching the event type shall fire left-to-right by board slot (0-4). | Each ability fully resolves before the next fires. If an ability kills a creature in a later slot, that creature's ability does not fire. |
| REQ-013 | Attunement state shall persist until the player's next chaos roll. | If a player rolled Chaos, their Chaos-attuned modifier bonuses stay active through the opponent's turn. Attunement does not change during the opponent's turn. |

#### Mana and Card Play

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-014 | The active player shall gain 1 chaos mote per turn (up to cap of 10). Unspent motes carry over. | Mana gain occurs in Phase 4 (Draw and Gain Mana). |
| REQ-015 | The active player shall draw 1 card per turn from the top of their deck. | If deck is empty, no card is drawn and no penalty is applied. |
| REQ-016 | Cards shall be playable during Main Phase only. | Creatures are placed on empty board slots. Spells resolve immediately and are discarded. Stabilizers occupy board slots. No summoning sickness -- creatures can attack the turn they are played. |
| REQ-017 | Chaos mote cost shall be fixed forever and never change through evolution. | `CardInstance.current_mana_cost` always equals `CardTemplate.mana_cost`. Enforced at the database level. |

#### Combat

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-018 | Combat shall use MTG-style declare attackers / assign blockers / simultaneous damage. | Each blocker blocks exactly one attacker. Each attacker can be blocked by at most one creature. Unblocked attackers deal damage to face. |
| REQ-019 | Combat damage resolution shall follow the 6-step priority order: Shield check, Deal damage, Deathtouch check, Normal death check, Piercing check, Lifesteal check. | Full algorithm defined in `06-technical-architecture.md` Section 4.3 and `01-battle-mechanics.md` Phase 8. |
| REQ-020 | Shield shall absorb ALL damage from a single source (not just 1 point), then be consumed. | A 7-ATK creature hitting a Shielded 2-HP creature deals 0 damage; Shield breaks. Lifesteal heals 0 when Shield absorbs. Piercing does not apply when Shield absorbs. |
| REQ-021 | Taunt shall enforce forced attack (Phase 6) and forced block (Phase 7). | Forced attack: active player must declare at least 1 attacker per opposing Taunt creature (up to available creatures). Forced block: Taunt creatures must be assigned as blockers if they can legally block any attacker. Flying attackers waive forced-block on ground Taunts without Reach. |
| REQ-022 | Flying creatures shall only be blockable by creatures with Flying or Reach. | Ground creatures (no Flying) can be blocked by any creature, including Flying creatures. |

#### Game End

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-023 | The game shall end when a player reaches 0 HP, surrenders (available after turn 2), disconnects for 3 consecutive turns, or times out for 3 consecutive turns. | If both players reach 0 HP simultaneously, the active player loses. Match results are persisted to `match_records` in Supabase PostgreSQL. All 20 deck cards receive chaos energy (2/win, 1/loss). Dust rewards: Win = 15 Dust, Loss = 5 Dust. |

### 4.2 Evolution System

**Reference:** `01-battle-mechanics.md` Section 1, `02-card-data-model.md` Section 20, `06-technical-architecture.md` Section 3

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-024 | A card shall be eligible for evolution when its chaos energy meets the tier threshold and the player owns a shard of the appropriate tier. | Thresholds: Common to Uncommon = 15, Uncommon to Rare = 30, Rare to Epic = 50, Epic to Legendary = 75. |
| REQ-025 | The player shall choose to channel toward Order or Chaos. A 70/30 roll determines the actual outcome. | If player channels toward Order: 70% chance of Order outcome, 30% Chaos. If player channels toward Chaos: 70% chance of Chaos outcome, 30% Order. |
| REQ-026 | Evolution shall grant exactly one modifier and one triggered ability per step. | Modifier options drawn from correct pool (PP budget from CM cost + step, tier bracket, attunement from 70/30 outcome, faction). Number of options based on subscription tier: Free=2, Mid=3, Top=4. |
| REQ-027 | Stat growth at evolution shall follow the proportional PP scaling system. | PP at tier = base_PP x tier_multiplier (Common 1.0x, Uncommon 1.5x, Rare 2.0x, Epic 2.5x, Legendary 3.0x). Per-step PP split between stats and modifier budget per `01-battle-mechanics.md` Section 1. |
| REQ-028 | Instability shall change at each evolution based on outcome. | Chaos outcome: +1 instability at every step. Order outcome: +0 at Common-to-Uncommon and Uncommon-to-Rare, -1 at Rare-to-Epic, -2 at Epic-to-Legendary. Creature instability floor is 0. |
| REQ-029 | The system shall prevent duplicate modifiers on the same card. | No ModifierDefinition can be granted twice to the same CardInstance. Within a single evolution's options, no modifier can appear twice. |
| REQ-030 | AI art generation shall use the previous tier's art as img2img reference for visual continuity. | fal.ai FLUX Kontext receives the card's current art_url as input_image. Prompt constructed from faction prefix + evolution direction + STYLE_ANCHOR + composition instruction. Full prompt construction algorithm in `03-prompt-templates.md`. |
| REQ-031 | The player shall select from 2-3 AI-generated name candidates for the evolved card. | GPT-4o Mini generates candidates based on faction voice, evolution history, and previous names. All candidates and the chosen name are stored in the EvolutionRecord. |
| REQ-032 | Evolution shall be an atomic transaction: shard deduction, record creation, and card update succeed or fail together. | Implemented as a Supabase Edge Function wrapping all writes in a PostgreSQL transaction. If AI generation fails, shard and chaos energy are refunded. Fallback art (programmatic color shift + particle overlay via Sharp on the server) is applied if AI fails after 3 retries. |

### 4.3 Card Collection and Deck Building

**Reference:** `02-card-data-model.md` Sections 1-2, 11; `07-ui-ux-specs.md` Section 5

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-033 | Card collection shall enforce per-faction capacity limits based on subscription tier. | Free: 50 cards/faction. Mid: 100 cards/faction. Top: 200 cards/faction. Enforced at the Supabase Edge Function level on card creation. |
| REQ-034 | Card packs shall contain 3 random Commons from the target faction with duplicate protection. | If a pack would produce a 3rd+ copy of an owned Common, it rerolls to a different Common. Own-faction pack costs 100 Dust. Cross-faction pack costs 150 Dust and permanently unlocks the faction. |
| REQ-035 | Deck validation shall enforce all construction rules before matchmaking. | Exactly 20 cards. Single faction (all cards share faction_id). Max 2 copies of any template. Max 2 Legendaries, max 1 copy of each Legendary. Avatar must match deck faction. At least 1 creature. |
| REQ-036 | Players shall have deck slot limits based on subscription tier. | Free: 3 slots. Mid: 5 slots. Top: 10 slots. Invalid (work-in-progress) decks can be saved but not used in matchmaking. |

### 4.4 Economy

**Reference:** `04-progression-economy.md` Sections 2-3

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-037 | Players shall earn Chaos Dust from completed matches. | Win: 15 Dust. Loss: 5 Dust. Awarded at match end. All values read from `economy_config` table (not hardcoded). |
| REQ-038 | Subscriber quest Dust bonuses shall apply to all quest rewards. | Mid tier: 1.5x quest Dust. Top tier: 2.0x quest Dust. Bonuses apply to daily and weekly quests only (not win/loss rewards). Bonus multipliers read from `economy_config` table. |
| REQ-039 | Shard costs shall be: Uncommon 30, Rare 60, Epic 120, Legendary 240 Chaos Dust. | Shard purchases are deducted atomically from player's Chaos Dust balance within a PostgreSQL transaction. All values read from `economy_config` table. |
| REQ-040 | All currency operations shall use PostgreSQL transactions to prevent double-spend. | Every Dust deduction is atomic with the corresponding purchase (pack opening, shard purchase, avatar unlock). All transactions logged to `shard_transactions` table for audit. |
| REQ-041 | Monthly Top-tier subscription benefits shall be granted automatically. | Top: 1 free Legendary Shard/month. Triggered by a `pg_cron` scheduled Edge Function (`0 0 1 * *`) that checks `user_subscriptions.tier = 'top'`. |

### 4.5 Matchmaking

**Reference:** `06-technical-architecture.md` Section 2.6

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-042 | Ranked matchmaking shall match within +/- 2 rank tiers initially, expanding over time. | At 10s, expand by 1 tier per 5 additional seconds. At 30s, match within 5 tiers. At 45s, match with any available player. |
| REQ-043 | Casual matchmaking shall use hidden MMR stored in the `players` table. | A Supabase Edge Function polls the `matchmaking_queue` table every 2 seconds. Players with closest MMR are paired first. |
| REQ-044 | Matchmaking shall validate the player's deck before entering queue. | Deck must pass all validation rules (REQ-035). Invalid decks are rejected with specific error messages. |
| REQ-045 | Queue entries shall expire after 60 seconds. | Player is notified via Realtime channel `matchmaking:{player_id}` and returned to mode selection on expiry. The `matchmaking_queue` row is deleted. |

### 4.6 Onboarding

**Reference:** `07-ui-ux-specs.md` Section 7, `04-progression-economy.md` Section 6

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-046 | New players shall receive 3 premade loaner decks (one per faction) during trial phase. | Loaner decks are 20 Commons each, fixed lists stored in `seed.sql`, cannot be evolved or modified. Player must play at least 1 match. |
| REQ-047 | After trial phase, player selects one faction. That trial deck becomes their real collection. | 20 Commons become owned CardInstances. Other trial cards are removed. Player receives starter rewards: 200 Dust, 3 Uncommon Shards, 1 Rare Shard, 1 Legendary Shard, starter avatar. |
| REQ-048 | Tutorial match shall use scripted rolls and a guided AI opponent. | Forced actions guide player through each phase. Skip button always visible. No turn timer during tutorial. |

### 4.7 User Interface (iOS Game Client)

**Reference:** `07-ui-ux-specs.md` (full specification)

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-049 | All interactive elements shall meet the 44x44pt minimum tap target (Apple HIG). | Small visual icons (mana crystals, keyword icons at 20-24pt) use invisible padding to reach 44x44pt tap area. |
| REQ-050 | The battlefield shall display 5 creature slots per side, HP bars, mana crystals, instability values, timer bar, and a horizontally scrollable hand area. | Layout per `07-ui-ux-specs.md` Section 3.1. SpriteKit `SKScene` for the battlefield area with SwiftUI overlays for HUD (OpponentHUDView, PlayerHUDView, HandScrollView, BottomControlsView). Board slot dimensions ~60x85pt on phone. Hand card dimensions 90x130pt. |
| REQ-051 | The evolution flow shall follow the 9-step ceremony. | Steps: Card Presentation, Channel Selection, Evolution Animation (looping while AI generates), Art Reveal, Name Selection, Ability Reveal, Modifier Selection, Flavor Text Reveal, Final Presentation and Confirm. Minimum animation duration 2.5s even if AI finishes faster. Full step specs in `07-ui-ux-specs.md` Section 4. Built with SwiftUI views and animations. |
| REQ-052 | The bottom tab bar shall be visible on all screens except during battle. | 5 tabs: Home, Collection, Decks, Profile, Shop. Battle is `.fullScreenCover` which hides the tab bar via `.toolbar(.hidden, for: .tabBar)`. Implemented via SwiftUI `TabView`. |
| REQ-053 | Blocker assignment shall use drag interaction. | Drag defending creature onto attacking creature. Valid targets glow green (#4CAF50) via SpriteKit glow effect. Invalid zones flash red and creature snaps back with spring animation. Connection line drawn between assigned blocker and attacker using SpriteKit `SKShapeNode`. |
| REQ-054 | The app shall use portrait orientation for all screens (MVP). | Set in `Info.plist` as `UISupportedInterfaceOrientations = [UIInterfaceOrientationPortrait]`. |

### 4.8 Factions and Content

**Reference:** `01-battle-mechanics.md` Section 5, `05-content-pipeline.md`

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-055 | Each faction shall have an exclusive mechanic referenced by its faction modifiers. | Ironwright: Augment (stacking self-referencing effects). Fey Courts: Bond (cross-creature synergies). Demonic Kingdoms: Corruption (self-damage for power). |
| REQ-056 | Faction modifiers shall always reference their exclusive mechanic keyword. | A modifier in the Ironwright pool that does not reference Augment count or Augment-related conditions is invalid. Universal modifiers shall not reference any faction mechanic. |
| REQ-057 | Each faction shall have 2 avatars at launch (1 starter + 1 unlockable). | Avatars have instability modifiers: Order-leaning (-5 to -6), Balanced (-3 to -4), Chaos-leaning (-1 to -2). 6 avatar rows in `seed.sql`. |

### 4.9 Subscription Management (iOS Game Client)

**Reference:** `09-monetization-details.md` Sections 2-5

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-058 | Subscription purchases shall use StoreKit 2 only. | No RevenueCat. No third-party payment SDK. `EntitlementManager` uses `Transaction.currentEntitlements` to check active entitlements on app launch. `Transaction.updates` async sequence handles real-time renewals/cancellations. Products declared in `Products.storekit` StoreKit Configuration file for Simulator testing. All product IDs in `ProductCatalog.swift` enum. |
| REQ-059 | After a StoreKit 2 purchase, the app shall sync entitlements to the server. | Call Supabase Edge Function `/functions/v1/sync-entitlements` with the signed JWS transaction. Server validates via App Store Server API v2 (not local validation). Server updates `user_subscriptions` table with `tier`, `cancel_at_period_end`, `current_period_end`. |
| REQ-060 | App Store Server Notifications V2 shall handle subscription lifecycle events. | Supabase Edge Function at `/functions/v1/apple-notifications` handles: SUBSCRIBED, DID_RENEW, DID_CHANGE_RENEWAL_STATUS, EXPIRED, DID_FAIL_TO_RENEW (sets 7-day grace period), REFUND, GRACE_PERIOD_EXPIRED. Full handler code in `09-monetization-details.md` Section 2d. |
| REQ-061 | A "Restore Purchases" button shall be available in the Settings screen. | Calls `AppStore.sync()` followed by checking `Transaction.currentEntitlements`. Updates local and server entitlement state. Required by App Store guidelines. |

### 4.10 Audio System (iOS Game Client)

**Reference:** `08-audio-design.md` (full specification)

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-062 | Battle music shall use an adaptive 4-stem architecture via `AVAudioEngine`. | Stems: (1) Foundation (bass + minimal percussion, always full volume), (2) Player faction layer, (3) Opponent faction layer, (4) Intensity layer with Order.caf and Chaos.caf crossfaded by instability (1-6 = Order, 7-13 = neutral mix, 14-20 = Chaos). All stems at 95 BPM, 2:00 loops, CAF format. |
| REQ-063 | Battle SFX shall use `SKAction.playSoundFileNamed` within SpriteKit. | Faction-specific variations for card play, creature attack, creature death. Universal SFX for card draw, mana gain/spend, avatar damage, heal, turn transition, timer warning, surrender. CAF format. Latency target: <20ms. |
| REQ-064 | Menu/ambient music shall use `AVAudioPlayer`. | Non-looping one-shot for evolution ceremony (1:10). Looping for main menu theme (2:30 loop, 75 BPM) and shop/collection ambient (3:00 loop, 60 BPM, AAC format). |
| REQ-065 | Total audio asset size shall not exceed 25 MB. | Music: ~18 MB (CAF). SFX: ~3 MB (CAF, ~40 files). Ambient: ~2 MB (AAC). Total ~23 MB. |
| REQ-066 | Volume defaults shall be: Master 100%, Music 60%, SFX 80%. Max 16 concurrent audio channels. | Stored in UserDefaults. Adjustable in Settings screen. Priority: SFX > Music > Ambient. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| REQ | Requirement | Target | Measurement |
|---|---|---|---|
| REQ-067 | Turn resolution latency | < 100ms server-side (action received to state broadcast) | Game server instrumentation (timestamp before/after state transition) |
| REQ-068 | Supabase Edge Function p50/p95/p99 | < 100ms / < 200ms / < 500ms | Supabase dashboard Edge Function metrics |
| REQ-069 | Supabase Realtime message delivery | < 50ms from server broadcast to client receipt | Client-side timestamp comparison |
| REQ-070 | AI image generation end-to-end | < 30s (fal.ai queue + generation + quality check + R2 upload) | `generation_jobs` table timestamps |
| REQ-071 | AI text generation end-to-end | < 5s | `generation_jobs` table timestamps |
| REQ-072 | Matchmaking queue time | < 15s at launch; < 30s off-peak | `matchmaking_queue.queued_at` to match creation timestamp |
| REQ-073 | Client frame rate | 60fps target, 30fps minimum on iPhone 11 during battle with 10 creatures on board | Xcode Instruments GPU profiler |
| REQ-074 | Client cold start | < 5s to home screen | Client instrumentation via PostHog `app_cold_start` event |
| REQ-075 | Client match load | < 3s from match found to board rendered | Client instrumentation |

### 5.2 Scalability

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-076 | The Railway game server shall handle 50-100 concurrent matches per instance and scale automatically. | Railway auto-scaling configured via `railway.json`. Match state held in-memory. On instance restart, active matches are lost (acceptable at launch scale). PostgreSQL snapshots on phase transitions provide reconnection support. |
| REQ-077 | The system shall support 1,000-5,000 concurrent players at launch with capacity to scale to 50,000. | 1-3 Railway instances at launch. Supabase Pro plan handles database load. Edge Functions auto-scale with Supabase. |
| REQ-078 | AI generation jobs shall be processed via the `generation_jobs` Supabase table with a pg_cron Edge Function polling every 30 seconds. | Priority field on generation_jobs: subscriber jobs (priority 1) processed before free jobs (priority 2). Batch pipeline jobs lowest priority (priority 3). |

### 5.3 Security

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-079 | All game logic shall be server-authoritative. | Client sends action intents only. Server validates legality, applies state changes, broadcasts results. Client never computes game state, rolls dice, or resolves combat. Match PRNG seed is server-side only. Opponent hand and deck order never sent to client. |
| REQ-080 | All network communication shall use TLS. | HTTPS for REST (Supabase enforces this). WSS for Realtime (Supabase enforces this). Cloudflare R2 serves art over HTTPS. Railway endpoints use HTTPS. |
| REQ-081 | All data at rest shall be encrypted. | Supabase PostgreSQL: AES-256 managed encryption. Cloudflare R2: server-side encryption. Secrets stored as Railway environment variables and Supabase Edge Function secrets (encrypted at rest). |
| REQ-082 | Rate limiting shall be enforced at the Edge Function level. | Auth: handled by Supabase Auth built-in rate limiting. General API: 100 req/min per user (Edge Function middleware using `rate_limit_log` table). Evolution start: tier-based (5/15/30 per day for Free/Mid/Top, checked via `generation_jobs` count). Card pack purchase: 20/hour. Matchmaking queue: 5/min. Returns HTTP 429 with Retry-After header. |
| REQ-083 | Player-selected prompt modifiers shall be drawn from a curated whitelist only. | Players never type free-form text that reaches AI models. Prompt construction is entirely server-side from validated components stored in `modifier_definitions` and prompt modifier tables. |
| REQ-084 | All generated images shall pass through NSFW filtering before storage. | fal.ai returns safety scores with generation results. Reject if any unsafe category is flagged. Retry with modified prompt up to 3 times, then apply programmatic fallback art via Sharp on the server. |

### 5.4 Accessibility

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-085 | The app shall support 3 colorblind modes: Deuteranopia, Protanopia, Tritanopia. | Order/Chaos indicators use icons + patterns in addition to color. Attunement: Order = blue circle, Chaos = red triangle, Neutral = gray square. HP bars always show numeric values. |
| REQ-086 | The app shall support a Reduced Motion mode. | D20 roll: instant result. Card animations: fade instead of slide. Damage numbers: static display. Particle effects: disabled. Screen shake: disabled. Respects iOS `UIAccessibility.isReduceMotionEnabled`. |
| REQ-087 | The app shall support system font size preferences (iOS Dynamic Type). | Scalable: card names, descriptions, labels, tooltips. Fixed-size: ATK/HP numbers on cards, mana cost icons. Long text truncated with ellipsis or made scrollable. Implemented via SwiftUI `.dynamicTypeSize()` modifier. |
| REQ-088 | All critical battle interactions shall be reachable with thumb-only input in portrait mode. | Hand area, End Turn button, mana display in bottom zone. No essential controls in top corners (opponent info is read-only). |

### 5.5 Platform Support

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-089 | iOS minimum version shall be iOS 17+. | Configured in Xcode project settings (`IPHONEOS_DEPLOYMENT_TARGET = 17.0`). Safe area insets respected for notch/Dynamic Island. No Android support. |
| REQ-090 | The app shall support iPhone form factors only (MVP). | iPhone SE (3rd gen) through iPhone 15 Pro Max. Adaptive layout via SwiftUI `GeometryReader`. Tablet support is post-launch (P2). |

### 5.6 Localization

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-091 | The app shall launch in English with architecture supporting future localization. | All user-facing strings in `Localizable.strings` or Swift String Catalogs. Date/time formatting locale-aware via `Date.FormatStyle`. Currency display uses `Decimal.FormatStyle.Currency` locale. Regional pricing for subscriptions via App Store Connect pricing tiers. |

---

## 6. Data Requirements

**Reference:** `02-card-data-model.md` (complete entity definitions), `06-technical-architecture.md` Section 2

### 6.1 Key Entities

| Entity | Storage | Description |
|---|---|---|
| CardTemplate | Supabase PostgreSQL (immutable after approval) | Base card definition: name, faction, type, stats, keywords, art prompt, art URL. ~367 rows at launch. |
| CardInstance | Supabase PostgreSQL (JSONB for evolution_history, modifiers, triggered_abilities) | Player-owned card: tier, current stats, instability, chaos energy, modifiers, abilities, art URL. High write frequency on evolution; moderate on energy gain. |
| ModifierDefinition | Supabase PostgreSQL (global content) | Modifier pool entry: effects, attunement, PP cost, faction. 240 rows at launch. |
| Deck / DeckEntry | Supabase PostgreSQL | Player's deck: 20 card entries, faction, avatar. Validated on save and queue entry. |
| Player | Supabase PostgreSQL (row-level locking for currency) | Account, subscription tier, Chaos Dust balance, shard inventory, rank, settings, faction mastery. |
| UserSubscription | Supabase PostgreSQL | Subscription state: tier (free/mid/top), cancel_at_period_end, grace_period_until, current_period_end. |
| GameState | In-memory on Railway game server (TTL = match duration) | Active match state: board, hands, decks, timers, combat state. Snapshotted to PostgreSQL on each phase transition for reconnection. |
| MatchRecord | Supabase PostgreSQL | Completed match: players, result, duration, turns, compressed game log. |
| Mission | Supabase PostgreSQL (TTL-indexed) | Active quests: type, target, progress, reward, expiry. |
| EventDefinition | Supabase PostgreSQL (global content, seed data) | 16 rows (8 Order + 8 Chaos). Static game data in `seed.sql`. |
| Avatar | Supabase PostgreSQL (global content, seed data) | 6 rows at launch (2 per faction). In `seed.sql`. |
| Faction | Supabase PostgreSQL (global content, seed data) | 3 rows at launch. In `seed.sql`. |
| EconomyConfig | Supabase PostgreSQL | Key-value pairs for all tunable economy values. Editable via Admin Dashboard. |
| GenerationJob | Supabase PostgreSQL | AI generation job tracking: status, priority, input/output data, timestamps. |
| MatchmakingQueue | Supabase PostgreSQL | Queue entries: player_id, deck_id, mode, rank, mmr, queued_at. |

### 6.2 Entity Relationships

```
CardTemplate  1 <--> * CardInstance
CardInstance  1 <--> * ModifierInstance (0-4, embedded JSONB)
CardInstance  1 <--> * TriggeredAbility (0-4, embedded JSONB)
CardInstance  1 <--> * EvolutionRecord (0-4, embedded JSONB)
Player        1 <--> * CardInstance
Player        1 <--> * Deck
Player        1 <--> 1 UserSubscription
Deck          * <--> * CardInstance (via DeckEntry)
Faction       1 <--> * CardTemplate
Faction       1 <--> * Avatar
Avatar        1 <--> * Deck
Player        1 <--> * Mission
```

### 6.3 JSONB Denormalization

CardInstance stores `evolution_history`, `modifiers`, and `triggered_abilities` as JSONB arrays (not separate normalized tables). This is a deliberate design choice:

- **Rationale:** A card's full data is fetched in a single row read. Write frequency is low (only on evolution). Read frequency is high (collection browsing, deck loading, battle state initialization).
- **Trade-off:** If a ModifierDefinition is rebalanced post-launch, a migration must update all affected CardInstance JSONB. This is handled via an Admin Dashboard "push balance patch" action that runs a SQL migration.

### 6.4 Key Indexes

| Query Pattern | Index |
|---|---|
| Player's cards in a faction | `card_instances(owner_id, template_id)` + join to `card_templates(faction_id)` |
| Evolution-ready cards | `card_instances(owner_id, tier, chaos_energy)` |
| Cards in a deck | `deck_entries(deck_id)` then `card_instances(id)` |
| Match history | `match_records(player_1_id, started_at DESC)`, `match_records(player_2_id, started_at DESC)` |
| Active missions | `missions(player_id, is_completed, expires_at)` |
| Leaderboard | `players(season_rank_points DESC)` |
| Generation queue | `generation_jobs(status, priority, created_at)` |
| Matchmaking | `matchmaking_queue(mode, rank_tier, queued_at)` |

### 6.5 Storage Requirements

| Store | Launch Estimate | 1-Year Estimate |
|---|---|---|
| Supabase PostgreSQL | ~5 GB | ~50 GB |
| Cloudflare R2 (card art) | ~5 GB (base art for ~367 templates) | ~500 GB - 2 TB (evolution art for all players) |

### 6.6 Data Retention

| Data Type | Retention |
|---|---|
| Player accounts | Indefinite (until account deletion request) |
| CardInstances | Indefinite |
| MatchRecords | 12 months (full_log compressed). Summary data indefinite. |
| Mission records | 30 days after expiry/completion |
| Generation jobs | 90 days after completion |
| Evolution art (R2) | Indefinite |
| PostHog analytics events | 24 months |

### 6.7 Database Schema

Full SQL CREATE TABLE statements with constraints, indexes, and Row Level Security policies are in `06-technical-architecture.md` Section 2. The schema is defined in `supabase/migrations/` and applied via `npx supabase db push`.

---

## 7. API Requirements

**Reference:** `06-technical-architecture.md` Sections 5-6

### 7.1 Protocol Summary

| Protocol | Use Case | Auth | Implementation |
|---|---|---|---|
| HTTPS REST | Collection, economy, deck management, evolution, profile, matchmaking | Supabase JWT (included by Supabase Swift SDK) | Supabase Edge Functions |
| Supabase Realtime | Real-time match communication | JWT on channel subscription | Supabase Realtime channels via Supabase Swift SDK |
| App Store Server API v2 | Subscription validation | App Store Server-to-Server JWT | Supabase Edge Function (server-side) |
| App Store Server Notifications V2 | Subscription lifecycle events | Signed JWS payloads | Supabase Edge Function webhook |

### 7.2 REST API Contracts (Supabase Edge Functions)

Base URL: `https://<project>.supabase.co/functions/v1`

#### Authentication

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-092 | -- | Supabase Auth SDK (Swift) | Sign in with Apple via `supabase.auth.signInWithApple()`. No Google Sign-In (iOS-only app). No custom auth endpoints. |
| REQ-093 | -- | Supabase Auth SDK (Swift) | Token refresh handled automatically by Supabase Swift SDK (`supabase-swift`). |

#### Players

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-094 | GET | `/players/me` | Get current player profile. Response: `{player: Player}`. |
| REQ-095 | PATCH | `/players/me` | Update display name or settings. Request: `{display_name?, settings?}`. |
| REQ-096 | POST | `/players/me/faction` | Select initial faction during onboarding. Request: `{faction_id}`. |

#### Collection

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-097 | GET | `/collection/cards` | List owned cards with pagination, faction filter, tier filter, sort. Response: `{cards: CardInstance[], total, page}`. |
| REQ-098 | GET | `/collection/cards/{id}` | Get full card detail including evolution history, modifiers, abilities. |

#### Decks

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-099 | GET | `/decks` | List all player decks. Response: `{decks: Deck[]}`. |
| REQ-100 | POST | `/decks` | Create deck. Request: `{name, faction_id, avatar_id}`. Response: `{deck}`. |
| REQ-101 | PUT | `/decks/{id}` | Update deck. Request: `{name?, avatar_id?, card_entries?}`. Response: `{deck, validation_errors}`. |
| REQ-102 | POST | `/decks/{id}/validate` | Validate deck against all construction rules. Response: `{is_valid, errors: string[]}`. |

#### Economy

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-103 | GET | `/economy/balance` | Get Chaos Dust and shard balances. |
| REQ-104 | POST | `/economy/purchase/card-pack` | Buy card pack. Request: `{faction_id}`. Response: `{cards: CardInstance[], dust_spent}`. |
| REQ-105 | POST | `/economy/purchase/shard` | Buy shard. Request: `{shard_tier}`. Response: `{shard_tier, dust_spent}`. |
| REQ-106 | GET | `/economy/missions` | Get active daily and weekly missions with progress. |
| REQ-107 | POST | `/economy/missions/{id}/claim` | Claim completed mission reward. Response: `{reward_type, reward_amount}`. |

#### Evolution

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-108 | POST | `/evolution/check` | Check eligibility. Request: `{card_instance_id}`. Response includes chaos energy, threshold, shard availability, available prompt modifiers. |
| REQ-109 | POST | `/evolution/start` | Begin evolution. Request: `{card_instance_id, prompt_modifiers, channel_direction}`. Response: `{evolution_id, actual_outcome, modifier_options, ability, stat_changes, instability_change}`. Fires fal.ai + OpenAI generation jobs. |
| REQ-110 | GET | `/evolution/{id}/status` | Poll generation status. Response: `{status: PENDING|IMAGE_PROCESSING|TEXT_PROCESSING|COMPLETE|FAILED, art_url?, name_candidates?, flavor_text?}`. Client polls every 500ms using Swift `Task.sleep(nanoseconds:)` loop. |
| REQ-111 | POST | `/evolution/{id}/confirm` | Confirm choices. Request: `{modifier_chosen_id, name_chosen}`. Response: `{card: CardInstance}`. |

#### Matchmaking

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-112 | POST | `/matchmaking/queue` | Enter queue. Request: `{deck_id, mode: RANKED|CASUAL}`. Validates deck before inserting into `matchmaking_queue` table. |
| REQ-113 | DELETE | `/matchmaking/queue` | Leave queue. Deletes row from `matchmaking_queue`. |
| REQ-114 | GET | `/matchmaking/status` | Check queue status. Response: `{status: QUEUED|MATCHED|NOT_QUEUED, match_id?}`. |

#### Subscription Sync

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-115 | POST | `/sync-entitlements` | Sync StoreKit 2 entitlements to server. Request: signed JWS transaction. Server validates via App Store Server API v2. Updates `user_subscriptions` table. |
| REQ-116 | POST | `/apple-notifications` | App Store Server Notifications V2 webhook. Handles SUBSCRIBED, DID_RENEW, EXPIRED, DID_FAIL_TO_RENEW, REFUND, GRACE_PERIOD_EXPIRED. Updates `user_subscriptions` table. |

### 7.3 Realtime Channel Events

All match communication uses Supabase Realtime channels via the Supabase Swift SDK. Each match uses channel `match:{match_id}`. Full TypeScript type definitions for all messages are in `06-technical-architecture.md` Section 5.

#### Client-to-Server

| REQ | Event | Payload | Phase |
|---|---|---|---|
| REQ-117 | `player_action: mulligan` | `{mulligan: bool}` | GAME_SETUP |
| REQ-118 | `player_action: play_card` | `{card_id, target_slot?, target_id?}` | MAIN_PHASE |
| REQ-119 | `player_action: declare_attackers` | `{attacker_ids: [string]}` | DECLARE_ATTACKERS |
| REQ-120 | `player_action: assign_blockers` | `{assignments: [{blocker_id, attacker_id}]}` | ASSIGN_BLOCKERS |
| REQ-121 | `player_action: surrender` | `{}` | Any (after turn 2) |

#### Server-to-Client (Key Events)

| REQ | Event | When |
|---|---|---|
| REQ-122 | `game_event: match:state` | On connect/reconnect -- full state snapshot (filtered to hide opponent hand/deck) |
| REQ-123 | `game_event: match:start` | Match begins -- player side, opponent info, first player |
| REQ-124 | `game_event: turn:chaos_roll` | Phase 2 -- roll value, instability, result (ORDER/CHAOS/NOTHING), creature stat updates |
| REQ-125 | `game_event: turn:event` | Phase 3 -- event ID, name, effect description, targets |
| REQ-126 | `game_event: combat:resolution` | Phase 8 -- all combat pairs with damage, deaths, piercing, lifesteal details |
| REQ-127 | `game_event: match:end` | Game over -- winner, end reason, rewards, card energy gained |
| REQ-128 | `game_event: timer:warning` | 15 seconds remaining on decision timer |

### 7.4 Server Validation on Every Action

The game server shall validate on every client action (REQ-079 expansion):

- Action is legal in the current phase
- It is the correct player's turn
- Action is within the timer window
- Card is in the player's hand and they have enough mana
- Board slot is empty (for placement)
- Blocker assignments satisfy Taunt rules and Flying/Reach rules
- No impossible targeting

Full error code table with codes, messages, and trigger conditions in `06-technical-architecture.md` Section 5.3.

---

## 8. AI Integration Requirements

**Reference:** `03-prompt-templates.md`, `06-technical-architecture.md` Section 3

### 8.1 Image Generation

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-129 | Base card art shall be generated via fal.ai FLUX Dev (txt2img) during the batch pipeline at 768x1024 resolution. | Exact fal.ai API endpoint: `POST https://fal.run/fal-ai/flux/dev`. Auth: `Authorization: Key ${FAL_API_KEY}`. Prompt structure: `[STYLE_ANCHOR] + [FACTION_PREFIX] + [CREATURE_TYPE] + [COMPOSITION_INSTRUCTION]`. Negative prompt always appended. Full prompt construction in `03-prompt-templates.md`. |
| REQ-130 | Evolution art shall be generated via fal.ai FLUX Kontext (img2img) using the previous tier's art as reference. | Exact endpoint: Free = `POST https://fal.run/fal-ai/flux-kontext/dev`. Mid/Top = `POST https://fal.run/fal-ai/flux-kontext/pro`. Input: current card art URL as `input_image_url`. Prompt constructed server-side from STYLE_ANCHOR + faction prefix + evolution direction (Order = subtle refinement / Chaos = dramatic transformation) + composition instruction. Denoising strength varies by evolution step (see `03-prompt-templates.md` denoising table). |
| REQ-131 | Shard quality shall determine AI model variant, resolution, and number of passes. | Free (PLANAR): FLUX Kontext Dev, 768x1024, 1 pass, ~$0.02. Mid (REFINED): FLUX Kontext Pro, 1024x1024, 1 pass, priority queue, ~$0.05. Top (PRISMATIC): FLUX Kontext Pro, 1024x1024, 2 passes (generate + refine), priority queue, ~$0.08. |
| REQ-132 | AI generation shall be tracked via the `generation_jobs` Supabase table with priority processing for subscribers. | Priority 1: subscriber evolution jobs. Priority 2: free evolution jobs. Priority 3: batch pipeline jobs. A pg_cron Edge Function processes pending jobs every 30 seconds, ordered by priority then created_at. |

### 8.2 Text Generation

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-133 | Card names and flavor text shall be generated by OpenAI GPT-4o Mini. | Exact model: `gpt-4o-mini`. Temperature 0.8, max 150 tokens. Generate 2-3 name candidates (1-4 words each) and 1 flavor text (1-2 sentences, under 120 chars). Faction voice instructions in system prompt per `03-prompt-templates.md`. Request JSON mode (`response_format: { type: "json_object" }`). Cost: ~$0.0001/card. |
| REQ-134 | If text parsing fails, the system shall retry with JSON mode explicitly requested. | Max 2 retries. On final failure, use template name with tier suffix (e.g., "Ashscale Wyvern II"). |

### 8.3 Quality Pipeline

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-135 | Every generated image shall pass NSFW filtering before storage. | fal.ai returns safety scores with generation results. Reject if any unsafe category is flagged. If fal.ai does not return safety data, the image is accepted (fal.ai models are trained to not generate NSFW content). |
| REQ-136 | Every generated image prompt shall include "no text, no letters, no words" to prevent text-in-image artifacts. | This is part of the NEGATIVE_PROMPT constant which is appended automatically to every prompt by the server-side prompt construction function. |
| REQ-137 | After 3 generation failures, the system shall apply programmatic fallback art. | Fallback: server-side image processing using Sharp in a Supabase Edge Function. Order outcome: blue/gold color tint + sharpen. Chaos outcome: red/purple color tint + saturation boost. Queue a background retry for full AI art by inserting a new `generation_jobs` row. |

### 8.4 Cost Management

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-138 | Per-user daily evolution caps shall be enforced. | Free: 5 evolutions/day. Mid: 15/day. Top: 30/day. Hard cap: 50 per user per day regardless of tier. Enforced by counting `generation_jobs` rows with `player_id` and `created_at > now() - interval '24 hours'`. |
| REQ-139 | Every AI generation call shall log cost data for tracking. | The `generation_jobs` row stores: model used, resolution, estimated cost, player_id, card_instance_id. PostHog receives `ai_generation_completed` events with cost data. |
| REQ-140 | Target AI cost per evolution: Free ~$0.02, Mid ~$0.05, Top ~$0.08. | Monthly AI cost budget at 10K DAU: ~$3,900. Budget tracked via PostHog dashboard aggregating `generation_jobs` cost data. |

### 8.5 Art Storage (Cloudflare R2)

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-141 | Card art shall be stored in Cloudflare R2 with path structure: `art/{card_instance_id}/{tier}.webp` for evolution art, `base/{faction_short_name}/{template_id}.webp` for base art. | R2 public bucket URL serves as CDN (Cloudflare edge caching). Cache-Control: `public, max-age=31536000` for base art (immutable), `public, max-age=3600` for evolution art. iOS client caches images locally using `URLCache` or custom disk cache with `art_url` as cache key. |
| REQ-142 | Art upload shall use the AWS SDK v3 S3Client (compatible with R2). | Server-side TypeScript upload in Edge Functions or Railway. R2 credentials stored in environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`. |

### 8.6 Style Anchor and Prompt Constants

| Constant | Value | Notes |
|---|---|---|
| STYLE_ANCHOR | `"fantasy card game art, painterly digital illustration, semi-realistic style, rich saturated colors with deep shadows and bright highlights, dramatic studio lighting, sharp focus on subject, subject centered and filling frame, card-portrait composition 3:4 aspect ratio, no text, no borders, no frames, no UI elements, no watermarks, professional quality"` | Prepended to every single image request. Locked -- never modify. |
| COMPOSITION_INSTRUCTION | `"portrait orientation, centered creature filling 70 percent of frame, dramatic three-quarter view or frontal pose, simple contextual background not cluttered, clear distinct silhouette, card game art composition, eyes visible and facing viewer, dramatic directional lighting"` | Appended to all faction/creature prompts. |
| NEGATIVE_PROMPT | `"text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, extra limbs, fused body parts, speech bubbles, comic panels, grid layout, collage, white background"` | Sent as negative prompt with every request. Never omit. |

Full faction art prefixes, evolution direction instructions, and modifier pool definitions in `03-prompt-templates.md`.

---

## 9. Analytics Requirements

**Reference:** `04-progression-economy.md` Section 7.6, `09-monetization-details.md` Section 13

### 9.1 Analytics Platform

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-143 | All analytics shall use PostHog (posthog.com). | iOS client uses `posthog-ios` Swift SDK. Initialize with project API key from `Config.xcconfig`. Server-side events sent via PostHog Node SDK from Edge Functions and Railway. No other analytics platform shall be used. Free tier: 1M events/month. |

### 9.2 Key Metrics

#### Engagement

| Metric | Definition | Target |
|---|---|---|
| DAU / MAU | Daily and monthly active users | Track growth. DAU target: 5K-10K at launch month. |
| D1 / D7 / D30 Retention | % of new users returning after 1/7/30 days | D1: 40-50%. D7: 20-30%. D30: 12-18%. |
| Average Session Length | Time from app open to close | 12-18 minutes |
| Sessions per DAU | Average sessions per daily active user | 2-3 |
| Match Completion Rate | % of matches that end via HP_ZERO or SURRENDER (not disconnect/timeout) | > 90% |

#### Progression

| Metric | Definition | Target |
|---|---|---|
| Evolution Rate | Evolutions per engaged player per week | 1-2 |
| Time to First Legendary | Days from account creation to first Legendary evolution | Free Regular ~6 weeks, Top Regular ~3 weeks. |
| Faction Popularity | % of active decks per faction | Each faction 25-40% (no faction below 20%). |
| Card Tier Distribution | % of all CardInstances at each evolution tier | Healthy: majority at Uncommon/Rare in month 1-3. |

#### Economy

| Metric | Definition | Red Flag |
|---|---|---|
| Avg Dust Bank | Average unspent Chaos Dust per player | > 2,000 for > 30% of players = not enough sinks |
| Quest Completion Rate | % of daily quests completed | < 60% = quests too hard or unrewarding |
| Shard Purchase Distribution | % of shard purchases at each tier | Monitor for bottlenecks |
| Pack Opening Rate | Card packs opened per player per week | Declining = economy stagnation |

#### Monetization

| Metric | Definition | Target |
|---|---|---|
| Conversion Rate (Free to Paid) | % of DAU that subscribes | Month 1: 4-5%. Month 12: 7-9%. |
| ARPU (All Players) | Monthly revenue / MAU | $0.85-$1.60 at maturity |
| ARPPU (Paying Only) | Monthly revenue / paying users | $10-$18 at maturity |
| Monthly Churn Rate | % of subscribers who cancel each month | < 5% Mid tier, < 3% Top tier |

#### AI Pipeline

| Metric | Definition | Alert Threshold |
|---|---|---|
| Generation Latency | Time from job enqueue to completion | > 30s for images triggers alert |
| Generation Success Rate | % of AI generation jobs that complete without fallback | < 90% triggers critical alert |
| Cost per Generation | Average cost per AI call by model tier | Track against budget ($0.02/$0.05/$0.08) |
| Queue Depth | Pending rows in `generation_jobs` table with status PENDING | > 500 triggers warning |

### 9.3 Dashboards and Alerting

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-144 | PostHog dashboards shall be configured for: Game Health (active matches, completion rate, duration), Economy (Dust earned/spent, evolution rate, dust bank distribution), AI Pipeline (queue depth, latency, success rate, cost), Player Health (DAU/MAU, retention, session metrics), Revenue (subscriber count by tier, conversion rate, churn rate). | Dashboards created in PostHog UI. No code needed -- PostHog provides dashboard builder. Also embedded in Admin Dashboard. |
| REQ-145 | PostHog webhook alerts shall fire to email for critical thresholds. | Alerts: match completion rate < 90%, AI generation failure rate > 10%, daily revenue drops > 30% day-over-day, zero matches for 5+ minutes during expected peak hours. |

### 9.4 PostHog Events to Fire

Full event table with event names, trigger conditions, and required properties is in `09-monetization-details.md` Section 13. Key events:

| Event Name | When to Fire | Key Properties | Fired From |
|---|---|---|---|
| `match_started` | Match begins | `mode`, `player_faction`, `opponent_faction` | Game server (Railway) |
| `match_completed` | Match ends | `result`, `turns`, `duration`, `end_reason` | Game server (Railway) |
| `evolution_started` | Evolution flow begins | `card_instance_id`, `tier_from`, `tier_to`, `channel_direction` | Edge Function |
| `evolution_completed` | Evolution confirmed | `card_instance_id`, `actual_outcome`, `modifier_chosen`, `ai_cost` | Edge Function |
| `purchase_completed` | StoreKit 2 transaction verified | `product_id`, `price_usd`, `new_tier` | Edge Function (sync-entitlements) |
| `paywall_shown` | Any paywall displayed | `trigger_reason`, `current_tier`, `screen_name` | iOS client |
| `app_cold_start` | App launches | `load_time_ms` | iOS client |
| `ai_generation_completed` | AI generation job finishes | `model`, `resolution`, `cost_estimate`, `success` | Edge Function |
| `card_pack_opened` | Player opens card pack | `faction_id`, `dust_spent`, `cards_received` | Edge Function |

---

## 10. Launch Criteria

### 10.1 Minimum Content

| REQ | Category | Minimum | Target |
|---|---|---|---|
| REQ-146 | Card templates (total) | 300 (100/faction) | 367 (8 batches of ~50) |
| REQ-147 | Creatures per faction | 80 | 100 |
| REQ-148 | Spells per faction | 15 | 17 |
| REQ-149 | Faction stabilizers per faction | 5 | 7 |
| REQ-150 | Universal stabilizers | 7 | 7 |
| REQ-151 | Modifier definitions | 240 (per PP pool structure) | 240 |
| REQ-152 | Order events | 8 | 8 |
| REQ-153 | Chaos events | 8 | 8 |
| REQ-154 | Avatars | 6 (2 per faction) | 6 |
| REQ-155 | Starter decks | 3 (1 per faction, 20 cards each) | 3 |

### 10.2 Feature Completeness

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-156 | All P0 features shall be fully implemented and tested. | Every P0 feature (P0-001 through P0-015) passes acceptance criteria. No known critical or high-severity bugs in P0 features. |
| REQ-157 | All P1 features shall be implemented or have approved deferral plans. | P1 features not ready for launch have documented post-launch delivery timelines. |

### 10.3 Performance Benchmarks

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-158 | Load testing shall simulate 200 concurrent matches without degradation. | Turn resolution < 100ms. Edge Function p95 < 200ms. No match state corruption. Realtime message delivery < 50ms. Tested using a Node.js load test script that simulates match flows. |
| REQ-159 | Client performance shall be validated on iPhone 11 (minimum target device). | 30fps during battle with 10 creatures on board (SpriteKit scene). Cold start < 5s. Match load < 3s. No memory leaks over 30-minute session measured via Xcode Instruments Leaks profiler. |

### 10.4 QA Requirements

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-160 | Full combat resolution test suite shall cover all keyword interaction pairs. | Per `01-battle-mechanics.md` Section 4 keyword interaction matrix: Shield/Piercing, Shield/Deathtouch, Shield/Lifesteal, Flying/Taunt, Flying/Reach, Deathtouch/Piercing, Deathtouch/Lifesteal, Taunt forced-attack and forced-block scenarios. Automated tests in game server test suite. |
| REQ-161 | Evolution flow shall be tested end-to-end for every tier transition and both outcomes. | 4 tier transitions x 2 outcomes = 8 paths. Each path verifies: shard deduction, stat changes, instability change, modifier pool correctness, ability generation, AI art generation (or fallback), EvolutionRecord creation, CardInstance update. Automated tests in Edge Function test suite. |
| REQ-162 | Economy test suite shall validate all currency operations are transactionally safe. | Double-spend prevention under concurrent requests. Shard deduction atomic with evolution. Dust deduction atomic with pack opening. Negative balance prevention. Automated tests using parallel requests to Edge Functions. |
| REQ-163 | Reconnection shall restore full game state within 3 seconds. | Player reconnects to Supabase Realtime channel (via Supabase Swift SDK), receives `match:state` snapshot, rebuilds board in SpriteKit, resumes play. Timer continues from where it was. Opponent sees "Opponent reconnected." |
| REQ-164 | Deck validation shall reject all invalid configurations. | Test: 19 cards, 21 cards, mixed factions, 3 copies of a template, 3 Legendaries, 2 copies of one Legendary, wrong-faction avatar. Each must produce a specific error message. |
| REQ-165 | Balance validation suite shall run against all card templates. | Automated checks per `01-battle-mechanics.md` Section 14: PP budget validation (tolerance +/- 1), instability/stat profile consistency, keyword limits, modifier PP cost matching. Run as `npm run validate-balance` script in game server project. |

### 10.5 App Store Launch Requirements

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-166 | Privacy policy shall be hosted at a public URL. | Static HTML page on Cloudflare Pages (free). URL entered in App Store Connect. Covers: data collection (Apple Sign-In ID, gameplay data, analytics), data use, data retention, third-party sharing (PostHog, fal.ai). |
| REQ-167 | Terms of Service shall be hosted at a public URL. | Static HTML page on Cloudflare Pages. URL entered in App Store Connect. |
| REQ-168 | App icon shall be 1024x1024, generated via fal.ai. | Prompt in `05-content-pipeline.md` Section 6. Exported as PNG. Added to Xcode asset catalog as `AppIcon`. |
| REQ-169 | App Store screenshots shall be generated via Xcode UI tests. | `ScreenshotTests.swift` in `ChaosCreaturesUITests/` captures: home screen, battle mid-game, evolution ceremony, collection grid, shop. Minimum 3 screenshots, target 6. Sizes for iPhone 6.7" and 6.1" displays. |
| REQ-170 | App Store description and keywords shall be prepared. | Description (max 4000 chars) and keywords (max 100 chars) generated via GPT-4o Mini. Template in `05-content-pipeline.md` Section 6. |
| REQ-171 | Age rating questionnaire shall be completed. | Answers documented in `05-content-pipeline.md` Section 6. Expected rating: 12+ (infrequent fantasy violence, unrestricted web access for card art). |
| REQ-172 | Privacy nutrition labels shall be declared in App Store Connect. | Data types: Identifiers (User ID), Usage Data (Product Interaction), Diagnostics (Crash Data, Performance Data). Purpose: App Functionality, Analytics. Linked to user: User ID, Product Interaction. Full declarations in `05-content-pipeline.md` Section 6. |
| REQ-173 | Bundle ID shall be `com.chaoscreatures.app`. | Configured in Xcode project and App Store Connect. Subscription group name: "Chaos Creatures Pro". |
| REQ-174 | "Restore Purchases" button shall be accessible in Settings. | Required by App Store guidelines. Calls `AppStore.sync()` and refreshes entitlements. |

---

## 11. Dependencies and Risks

### 11.1 External Dependencies

| Dependency | Service | Risk | Mitigation |
|---|---|---|---|
| AI Image Generation | fal.ai (FLUX Kontext) | API downtime, rate limits, cost increases, model deprecation | Fallback art pipeline (REQ-137). Pre-generated base art decoupled from runtime. FLUX is open-source -- self-hosting possible as last resort. Exponential backoff: 2s, 4s, 8s, 16s, max 4 retries. |
| AI Text Generation | OpenAI GPT-4o Mini | API downtime, model changes | Fallback to template name + tier suffix. Text generation is non-blocking (evolution can complete without text). Low cost ($0.15/1M tokens) reduces financial risk. |
| Authentication | Supabase Auth (Apple Sign-In) | Supabase outage | Supabase has 99.9% uptime SLA on Pro plan. App is unusable without auth -- no mitigation beyond provider reliability. |
| Subscription Billing | StoreKit 2 (Apple native) | App Store policy changes | `Transaction.currentEntitlements` caches locally and works offline. App Store Server API v2 for server validation. Store commission rate changes are a business risk, not a technical one. |
| Card Art CDN | Cloudflare R2 | Outage | R2 has Cloudflare's global edge network. Client-side image caching (URLCache + custom disk cache, 200MB LRU) means cached art works offline. |
| Game Server Hosting | Railway | Outage, scaling limits | Railway has auto-restart on failure (`restartPolicyType: ON_FAILURE`). Active matches lost on restart -- acceptable at launch scale. |
| Real-time Communication | Supabase Realtime | Outage, message delivery issues | Client reconnection with exponential backoff with jitter, max 5 attempts, then `.failed` status. State snapshot on reconnect. 3-turn grace period before auto-forfeit. |

### 11.2 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **AI generation latency spikes** | Medium | Medium -- evolution ceremony stalls | Evolution animation loops gracefully in SpriteKit while waiting. Minimum 2.5s animation masks normal latency. "Channeling energy..." text appears after 3s. Timeout at 10s triggers refund for mobile users (faster feedback). |
| **AI art quality inconsistency** | Medium | Medium -- player dissatisfaction with evolution art | Quality pipeline (NSFW filter + negative prompt). Prompt engineering with curated modifiers only (no free-form text). Evolution art uses img2img (preserves visual DNA). Owner reviews base card art in batch pipeline Admin Dashboard. |
| **Mobile performance on older devices** | Medium | High -- poor retention | SpriteKit is hardware-accelerated on all iOS devices. Animation quality tiered by device capability (FULL / REDUCED / MINIMAL setting). Reduced Motion mode. 200MB local art cache. Delta-based Realtime updates (not full state on every action). Xcode Instruments profiling on iPhone 11 required before launch. |
| **Game balance issues at launch** | High | Medium -- player frustration | Economy values in `economy_config` table (changeable via Admin Dashboard, no deploy needed). Automated balance validation suite. PostHog telemetry on win rates by faction, card, modifier. |
| **Content volume insufficient for launch** | Medium | High -- repetitive experience | Batch generation pipeline targets 367 cards. Lower bound of 300 cards (100/faction) still provides viable deckbuilding. 240 modifiers provide evolution variety. Total batch generation cost: ~$71 in fal.ai + OpenAI API calls. |
| **Supabase Realtime reliability on mobile** | Medium | Medium -- disconnects during matches | Client reconnection via Supabase Swift SDK with exponential backoff per `06-technical-architecture.md` Section 5.4. Game state snapshotted to PostgreSQL on each phase transition. 3-turn grace period before auto-forfeit. Full state snapshot on reconnect. |
| **Economy inflation/deflation** | Medium | Medium -- progression feels wrong | PostHog dashboard tracks Dust bank distribution, quest completion, evolution rate. Tunable via `economy_config` table through Admin Dashboard. See red flags in Section 9.2. |

### 11.3 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Low conversion rate (< 4%)** | Medium | High -- unsustainable unit economics | PostHog tracks conversion funnels. Evolution-moment upsells (modifier picker shows upgrade benefit). Collection limit (50 cards) as natural conversion trigger. Annual subscription discount (saves 33-36%). |
| **High subscriber churn (> 8%)** | Medium | Medium -- revenue instability | Grace period on lapse (7 days). Downgrade warnings showing card deletion impact. Annual plan promoted as default. |
| **AI API cost increases** | Low | High -- margin compression | fal.ai pricing is usage-based and competitive. FLUX is open-source -- self-hosting on Railway GPU instances is a fallback. Per-user daily evolution caps limit worst-case cost exposure. |
| **App Store rejection** | Low | High -- launch delay | Follow Apple HIG. No loot boxes. Transparent odds disclosure. Anti-predatory design per `09-monetization-details.md` Section 10. StoreKit 2 is Apple's own framework -- full compliance built in. "Restore Purchases" button in Settings. |
| **Budget overrun (> $300)** | Low | Medium -- delayed launch | $67 buffer in budget. fal.ai usage monitored during content generation. Test with Dev models first ($0.02/image), use Pro only for final batch. Reuse rejected generations where possible. |

---

## 12. Owner's Operational Workflow

This section describes how the owner manages the live game. Every operation is through the Admin Dashboard (web app on Railway) or a single terminal command. No code changes, no raw database edits, no infrastructure configuration.

### 12.1 Typical Week (Post-Launch)

| Day | Activity | Tool | Time |
|---|---|---|---|
| Monday | Review weekend metrics: DAU, match completion, revenue, AI costs | Admin Dashboard > PostHog embed | 15 min |
| Monday | Check AI generation queue for failures, retry any stuck jobs | Admin Dashboard > Generation Jobs | 5 min |
| Tuesday | Review and approve/reject any flagged evolution art | Admin Dashboard > Content Review | 10 min |
| Wednesday | Check economy health: Dust bank distribution, quest completion rates | Admin Dashboard > PostHog embed | 10 min |
| Thursday | Review faction win rates, check for balance issues | Admin Dashboard > PostHog embed | 10 min |
| Friday | Approve any batch-generated cards queued for next content drop | Admin Dashboard > Card Generation > Review Gallery | 20 min |
| As needed | Respond to PostHog alerts (match completion drop, AI failure spike, revenue drop) | Email notification > Admin Dashboard | Varies |

### 12.2 Releasing New Cards

1. **Trigger batch generation:** Admin Dashboard > Card Generation > Enter faction, count (e.g., 20 Ironwright creatures), and creature type hint. Click "Generate Batch."
2. **Wait for generation:** The `generation_jobs` table processes at lowest priority. Takes 10-30 minutes for 20 cards. Status visible in Admin Dashboard > Generation Jobs.
3. **Review and approve:** Admin Dashboard > Card Generation > Review Gallery shows a grid of generated cards with art, stats, name, and flavor text. For each card: click "Approve" (creates `card_templates` row) or "Reject" (marks as rejected, optionally queues regeneration).
4. **Cards are live immediately.** Approved cards appear in card pack pools with no deploy needed. The Edge Function reads `card_templates` at runtime.

### 12.3 Adjusting Economy Balance

1. **Open economy editor:** Admin Dashboard > Economy Controls.
2. **Edit values:** Form fields for all tunable parameters: Dust win/loss rewards, shard costs, energy thresholds, quest rewards, subscription bonuses. Current values loaded from `economy_config` table.
3. **Save changes:** Click "Save." The Admin Dashboard writes to `economy_config` table. Changes take effect on the next API call -- no deploy needed.
4. **Verify:** Check PostHog dashboards over the next 48 hours for intended effect on economy metrics.

### 12.4 Running a Season Reset

1. **Admin Dashboard > Season Management > "End Season."**
2. System automatically: calculates end-of-season rewards for all ranked players, resets rank (drop 5 divisions), inserts new season record.
3. **Owner reviews rewards distribution** in the dashboard and clicks "Confirm Season Reset."
4. All players see the new season on next app open.

### 12.5 Handling Incidents

| Incident | Detection | Resolution |
|---|---|---|
| AI generation queue backup (>500 pending) | PostHog alert | Admin Dashboard > Generation Jobs > check for stuck jobs. Retry or clear failed jobs. If fal.ai is down, do nothing -- fallback art kicks in automatically after 3 failures per job. |
| Match completion rate drops below 90% | PostHog alert | Check Railway logs for game server errors. If server crashed, Railway auto-restarts. Active matches are lost but players can requeue. |
| Economy metric out of range (e.g., Dust inflation) | Weekly review | Admin Dashboard > Economy Controls. Adjust relevant values (e.g., reduce Dust per win from 15 to 12). Monitor for 48 hours. |
| Player support request | Email to support address | Admin Dashboard > Player Lookup. Search by display name. View full profile, match history, collection. Grant compensation (Dust, shards) via player detail page if needed. |

### 12.6 Deploying Updates

All deployments use a single script:

```bash
./deploy.sh          # Deploys: Supabase migrations, Edge Functions, Railway game server + admin dashboard
```

For iOS app updates, submit via Xcode Cloud to TestFlight, then promote to App Store.

The owner runs `./deploy.sh` after Claude Code makes backend code changes. The script is defined in `06-technical-architecture.md` Section 9.3.

---

## 13. Accounts and Costs

### 13.1 Accounts to Create (Before Build Phase)

| # | Service | URL | What to Get | Cost |
|---|---|---|---|---|
| 1 | Supabase | supabase.com | Project URL, Anon Key, Service Role Key | Free tier for dev. Pro plan $25/mo for production. |
| 2 | fal.ai | fal.ai | API Key | Pay-per-use. ~$0.02-$0.08 per image. |
| 3 | OpenAI | platform.openai.com | API Key | Pay-per-use. ~$0.15/1M input tokens (GPT-4o Mini). |
| 4 | Cloudflare | cloudflare.com | R2 Bucket, Access Key, Secret Key, Account ID | Free up to 10 GB storage + 10M reads/mo. |
| 5 | Railway | railway.app | Account (link GitHub repo) | $5/mo base + usage. |
| 6 | Apple Developer | developer.apple.com | Developer account for App Store + Xcode Cloud | $99/year. |
| 7 | PostHog | posthog.com | Project API Key | Free up to 1M events/mo. |

**Not needed (removed from v2.0):** Google Play ($25), RevenueCat, Expo/EAS.

All keys go in:
- **Backend:** `.env` file (template at `.env.example`). Contains: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FAL_KEY`, `OPENAI_API_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `POSTHOG_API_KEY`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`, `GAME_SERVER_PORT`, `GAME_SERVER_SECRET`, `APP_STORE_KEY_ID`, `APP_STORE_ISSUER_ID`, `APP_STORE_PRIVATE_KEY_PATH`, `APP_STORE_BUNDLE_ID`, `APP_STORE_ENVIRONMENT`.
- **iOS Client:** `Config.xcconfig` (gitignored). Contains: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `R2_PUBLIC_URL`, `POSTHOG_API_KEY`, `POSTHOG_HOST`.

No other configuration needed.

### 13.2 Build-to-Launch Budget Breakdown

| Service | Build Phase Cost | Notes |
|---|---|---|
| Apple Developer | $99 | Mandatory. Includes Xcode Cloud free tier. |
| Supabase (Pro, 1 month) | $25 | Free tier during dev; Pro for launch. |
| Railway (game server + admin, 1 month) | $15 | Dev environment minimal. |
| fal.ai (content generation) | $80 | 367 base cards (~$14.68) + testing 3x (~$44) + evolution testing (~$10) + app icon/assets (~$2) + buffer (~$9) |
| OpenAI (text generation) | $2 | 367 cards text + testing. Batch API for >100 cards (50% cheaper). |
| Cloudflare R2 | $0 | Free tier covers launch. |
| PostHog | $0 | Free tier covers launch (1M events/mo). |
| Cloudflare Pages | $0 | Free tier for legal pages. |
| Domain (optional) | $12 | Custom CDN URL. |
| **TOTAL** | **~$233** | **$67 buffer within $300 cap** |

### 13.3 Monthly Production Costs (Post-Launch)

| Service | At 1K DAU | At 10K DAU | At 50K DAU |
|---|---|---|---|
| Supabase (Pro) | $25 | $25 | $25-$599 |
| Railway (game server + admin) | $20 | $50-100 | $200-400 |
| fal.ai (image generation) | $100 | $3,900 | $19,500 |
| OpenAI (text generation) | $5 | $20 | $100 |
| Cloudflare R2 | $0 | $5 | $25 |
| PostHog | $0 | $0 | $50 |
| **Total Infrastructure** | **~$150** | **~$4,100** | **~$20,100** |

**Revenue vs. cost at 10K DAU:**
- Estimated net revenue (after 30% App Store fee): ~$8,800/month
- Infrastructure + AI costs: ~$4,100/month
- **Margin: ~$4,700/month (53%)**

See `09-monetization-details.md` Section 9 for full revenue projections and break-even analysis.

### 13.4 When to Set Up Each Account

| Phase | Accounts Needed |
|---|---|
| **Local development** | Supabase (local CLI, free), fal.ai (for testing), OpenAI (for testing) |
| **Staging / testing** | Add: Cloudflare R2 (free tier), Railway (dev environment) |
| **Pre-launch** | Add: Apple Developer ($99/yr), PostHog |
| **Launch** | Upgrade Supabase to Pro ($25/mo). All accounts active. |

---

## 14. Appendix: Document Index

All design documents are located in `docs/design/` and form the complete specification for Chaos Creatures.

| Document | Path | Summary |
|---|---|---|
| **00 - Game Design Master** | `docs/design/00-game-design-master.md` | Complete game design overview. Faction system, card economy, evolution system, modifier system, progression, monetization, battle system, chaos roll mechanics. The foundational document that all others expand upon. **Protected file -- read-only.** |
| **01 - Battle Mechanics** | `docs/design/01-battle-mechanics.md` | PP budget system, instability math, turn structure (9 phases), combat resolution algorithm, 7 keyword definitions and interaction matrix, 3 faction mechanics (Augment/Bond/Corruption), modifier pool structure (240 modifiers across 12 pools), 8 Order events (O1-O8), 8 Chaos events (C1-C8), triggered ability framework, spell and stabilizer design, balance validation rules. **Protected file -- read-only.** |
| **02 - Card Data Model** | `docs/design/02-card-data-model.md` | Complete TypeScript-style entity definitions. CardTemplate, CardInstance, EvolutionRecord, ModifierDefinition, ModifierInstance, TriggeredAbility, SpellEffect, Effect, EventDefinition, Avatar, Faction, Deck, Player, GameState (runtime), MatchRecord, Mission, Achievement. All enums exhaustively defined. Entity relationships. Key indexes. Data flow diagrams. **Protected file -- read-only.** |
| **03 - Prompt Templates** | `docs/design/03-prompt-templates.md` | Exact fal.ai API integration (endpoints, request/response JSON). Faction art style prefixes (exact strings). STYLE_ANCHOR (locked string). Evolution prompt templates (Order and Chaos). Denoising strength table by evolution step. Visual prompt modifier tables: 30 universal, 28 per faction. GPT-4o Mini text generation prompts. Complete TypeScript prompt construction algorithm. Batch generation spec with CSV format. |
| **04 - Progression Economy** | `docs/design/04-progression-economy.md` | Chaos energy thresholds (15/30/50/75) and earning rates (2/win, 1/loss). Full Chaos Dust economy mathematical model with daily/weekly income tables. Quest system: 20 daily templates, 10 weekly templates with exact rewards (Easy: 20, Medium: 30, Hard: 45 Dust). Rank ladder: 17 tiers, 8-week seasons. New player economy and onboarding flow. `economy.config.json` full schema with all tunable values. |
| **05 - Content Pipeline** | `docs/design/05-content-pipeline.md` | Launch content: 367 cards (300 creatures + 51 spells + 21 faction stabilizers + 7 universal). Batch generation pipeline with Admin Dashboard review gallery. Exact fal.ai and OpenAI API calls. Cloudflare R2 upload code with AWS SDK v3. Automated QA checks. Full launch plan: 4 days, 8 batches. Total launch content API cost: ~$71. App Store asset generation (icon, screenshots, description, privacy policy, nutrition labels). |
| **06 - Technical Architecture** | `docs/design/06-technical-architecture.md` | Complete Supabase database schema with SQL CREATE TABLE statements, constraints, indexes, and Row Level Security policies. Service architecture for Swift/SwiftUI/SpriteKit client + Supabase + Railway. Full game server deep dive: state machine, turn resolution (TypeScript), combat resolution (TypeScript), timer management, anti-cheat, reconnection handling. AI pipeline code. Full REST API endpoint definitions. Full Supabase Realtime message type definitions. StoreKit 2 integration code (EntitlementManager, sync-entitlements Edge Function, apple-notifications webhook). Xcode project structure. Environment variables. Budget breakdown. Deploy script. |
| **07 - UI/UX Specs** | `docs/design/07-ui-ux-specs.md` | Technology stack (Swift/SwiftUI/SpriteKit). Screen inventory with navigation map. Battlefield layout with SpriteKit scene + SwiftUI overlay architecture. Component specs (HPBarView, TimerBarView, EndTurnButton, etc.) with exact dimensions, colors, and animations. Evolution screen 9-step ceremony. Collection screen. Deck builder. Shop screen. Onboarding flow. Dark theme color palette. Settings screen. Post-match results. Admin Dashboard specs (Part B). |
| **08 - Audio Design** | `docs/design/08-audio-design.md` | AVAudioEngine adaptive music system (4-stem architecture). Faction audio identities. SFX via SKAction.playSoundFileNamed in SpriteKit. Complete SFX inventory (~40 files, ~3 MB CAF). Music tracks (~18 MB CAF). Evolution ceremony audio (1:10 one-shot). Priority system (SFX > Music > Ambient). Audio sourcing via Suno AI. Total ~23 MB. |
| **09 - Monetization Details** | `docs/design/09-monetization-details.md` | StoreKit 2 implementation (EntitlementManager, Transaction.currentEntitlements, Transaction.updates). Subscription tiers: Free/$6.99/$12.99 with exact feature matrix. All IAP product identifiers. App Store Server API v2 receipt validation. App Store Server Notifications V2 webhook. Conversion funnel analysis. Battle pass design ($9.99, 50 tiers). Cosmetics catalog. Revenue projections. Anti-predatory design. |
| **10 - PRD** | `docs/design/10-prd.md` | This document. |

---

## Gaps and Contradictions Identified

The following discrepancies were found across design documents during the v3.0 revision. Resolutions are provided -- implement these resolutions.

### Gap 1: Shard Costs (Carried Forward from v2.0, Updated)

The `_prd-input-summary.md` cross-doc reference states shard costs as "Uncommon=30, Rare=60, Epic=120, Legendary=240" matching `04-progression-economy.md`. The `00-game-design-master.md` (protected file, Section 3) also states "30/60/120/240 Dust."

**Resolution:** Implement **Uncommon=30, Rare=60, Epic=120, Legendary=240 Dust**. This matches the protected file `00-game-design-master.md`. Store in `economy_config` table so these are tunable without code changes.

### Gap 2: Deck Slots (Mid Tier)

The `_prd-input-summary.md` states Mid tier = 5 deck slots. The US-014 user story from v2.0 stated Mid = 6 deck slots. `06-technical-architecture.md` webhook handler specifies Mid = 5.

**Resolution:** Implement **Mid = 5 deck slots**. Aligned with the technical architecture spec and input summary.

### Gap 3: Card Pack Contents

The v2.0 PRD correctly resolved this as "3 Commons for 100 Dust." This remains correct and matches all current docs.

**Resolution:** No change. **3 Commons for 100 Dust** (own faction). **3 Commons for 150 Dust** (cross-faction, unlocks faction permanently).

### Gap 4: Modifier Pool Count

CLAUDE.md states "12 pools x (8 universal + 4 per faction) = 240 modifiers." The input summary states "30 universal + 28 per faction x 3 = 114 faction modifiers = 144 modifier definitions." These describe different things: CLAUDE.md describes pool structure, the input summary describes individual modifier definitions.

**Resolution:** Implement **144 unique modifier definitions** (30 universal + 28 Ironwright + 28 Fey + 28 Demonic + remaining distributed across pools). The 240 figure from CLAUDE.md refers to pool slots (12 pools x 20 modifiers per pool). Both are correct at different levels of abstraction. Follow the specific definitions in `03-prompt-templates.md` Section 1.6.

### Gap 5: Content Target -- 367 vs 379

The `_prd-input-summary.md` doc 05 section lists 379 templates (300 creatures + 51 spells + 21 faction stabilizers + 7 universal = 379) but then says "Practical launch target: 367 cards (8 batches of ~50)."

**Resolution:** The **379 figure is the theoretical full set**; **367 is the practical target** accounting for batch-size rounding. Implement at least 300 (minimum) and target 367. If the pipeline produces more, that is acceptable.

---

## Revision Log

### v3.0 Changes (from v2.0) -- 2026-02-16

| Change | Old (v2.0) | New (v3.0) | Reason |
|---|---|---|---|
| **Client platform** | React Native (Expo) + TypeScript, iOS + Android | Native iOS: Swift + SwiftUI + SpriteKit. iOS 17+. No Android. | CLAUDE.md platform pivot. Full native experience. |
| **Payments** | RevenueCat (`react-native-purchases` v8.x) wrapping Apple IAP + Google Play Billing | StoreKit 2 (native Apple framework). No RevenueCat. No third-party SDK. | CLAUDE.md specifies StoreKit 2 only. $0 cost. |
| **Auth** | Supabase Auth: Apple Sign-In + Google Sign-In | Supabase Auth: Apple Sign-In only | iOS-only app. No Google Sign-In needed. |
| **App builds** | Expo EAS Build (iOS + Android from single codebase) | Xcode Cloud (iOS only) | No Expo. Native Xcode toolchain. |
| **Battle UI** | React Native Reanimated 3 + Skia for animations | SpriteKit `SKScene` for battlefield + SwiftUI overlays for HUD | Native iOS rendering. Hardware-accelerated SpriteKit. |
| **Navigation** | Expo Router v3, tab layout | SwiftUI `TabView` + `NavigationStack` + `.sheet()` / `.fullScreenCover()` | Native SwiftUI navigation. |
| **Blocker assignment** | `react-native-gesture-handler` drag + Skia Canvas connection lines | SpriteKit touch handling + `SKShapeNode` connection lines | Native SpriteKit gesture handling. |
| **Audio** | `expo-av` 12-channel mixer | `AVAudioEngine` + `AVAudioPlayerNode` for adaptive music. `AVAudioPlayer` for menus. `SKAction.playSoundFileNamed` for battle SFX. | Native iOS audio stack. Lower latency. |
| **Analytics SDK** | `posthog-react-native` | `posthog-ios` Swift SDK | Native iOS SDK. |
| **Font scaling** | `useWindowDimensions()` + custom scaling | iOS Dynamic Type via `.dynamicTypeSize()` SwiftUI modifier | Native accessibility. |
| **Orientation lock** | `app.json "orientation": "portrait"` | `Info.plist UISupportedInterfaceOrientations` | Native iOS config. |
| **Platform support** | iOS 16+ and Android API 33+ | iOS 17+ only. No Android. | Simplified target. iOS 17 for SwiftUI features. |
| **Tablet support** | Adaptive layout via `useWindowDimensions()` | iPhone only (MVP). Tablet post-launch. | Reduced scope for solo build. |
| **Deck slot Mid tier** | 6 slots | 5 slots | Aligned with `06-technical-architecture.md` v3.0. |
| **Accounts removed** | Google Play ($25), RevenueCat, Expo/EAS | Not needed | iOS-only, StoreKit 2, Xcode Cloud. |
| **Budget** | Not explicitly tracked | $300 cap with line-item breakdown | CLAUDE.md budget constraint. |
| **App Store requirements** | Not detailed | Full section: privacy policy, screenshots, nutrition labels, age rating, bundle ID | Required for App Store submission. |
| **Subscription sync** | RevenueCat webhook to Edge Function | StoreKit 2 `Transaction.currentEntitlements` + `Transaction.updates` client-side, `/sync-entitlements` Edge Function server-side, App Store Server Notifications V2 webhook | Native Apple flow. |
| **REQ numbering** | REQ-001 through REQ-151 | REQ-001 through REQ-174 | Renumbered for new requirements (StoreKit, App Store launch, audio). |
| **Shard costs** | Uncommon=25, Rare=75, Epic=150, Legendary=240 | Uncommon=30, Rare=60, Epic=120, Legendary=240 | Aligned with protected file `00-game-design-master.md` Section 3. |

### v2.0 Changes (from v1.0) -- 2026-02-16

| Change | Old (v1.0) | New (v2.0) | Reason |
|---|---|---|---|
| **Document audience** | Engineering team | Claude Code + Owner | Solo non-engineer builds with Claude Code. |
| **Platform** | iOS only + future web/Android | iOS + Android via Expo (v2.0) | Expo cross-platform (later replaced in v3.0). |
| **Matchmaking** | Redis sorted set | Supabase `matchmaking_queue` table | No Redis in stack. |
| **Scalability** | Kubernetes HPA | Railway auto-scaling | Owner cannot operate Kubernetes. |
| **AI job queue** | BullMQ | `generation_jobs` Supabase table | No BullMQ, no Redis. |
| **NSFW filter** | AWS Rekognition | fal.ai built-in content moderation | No AWS services. |
| **Secrets** | AWS Secrets Manager / Vault | Railway env vars + Supabase secrets | Owner cannot configure Vault. |
| **Analytics** | Kafka/Kinesis to BigQuery | PostHog | Single service. |
| **Dashboards** | Grafana + PagerDuty | PostHog built-in | Owner cannot configure Grafana. |
| **WebSocket** | Socket.io | Supabase Realtime | CLAUDE.md specifies Supabase. |
| **Object storage** | S3 + CloudFront | Cloudflare R2 | CLAUDE.md specifies R2. |
| **Load test target** | 1,000 concurrent matches | 200 concurrent matches | Realistic for launch scale. |

---

*Last updated: 2026-02-16*
*Version: 3.0 -- Full rewrite for native iOS (Swift/SwiftUI/SpriteKit) platform pivot.*
*All infrastructure decisions final per CLAUDE.md. All schemas, API contracts, message formats, and deployment configs are code-ready and defined in the referenced design documents.*

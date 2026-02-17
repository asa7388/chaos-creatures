# 10 -- Product Requirements Document (PRD)

## Chaos Creatures -- Build Handoff

| Field | Value |
|---|---|
| **Document Version** | 2.0 |
| **Date** | 2026-02-16 |
| **Status** | Final -- Ready for Build |
| **Owner** | Solo non-engineer owner, building with Claude Code |
| **Audience** | Claude Code (primary implementer), Owner (reviewer and decision-maker) |

**Build context:** This entire product will be built by a solo non-engineer using Claude Code to implement directly from this document. There is no engineering team. Every requirement is written so that Claude Code can build it without ambiguity. If a paragraph leaves a decision to "the engineer," it is a bug in this document.

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

- **Primary:** iOS and Android via React Native (Expo). Ships to both platforms from a single codebase using Expo EAS Build.
- **Target devices:** iPhone 11 and newer (iOS 16+). Android devices with equivalent capability (API level 33+, ~3 years old).

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
| Client | React Native (Expo) + TypeScript | NOT Unity. Expo SDK 51+, Expo Router v3 |
| Auth | Supabase Auth | Apple Sign-In, Google Sign-In |
| Database | Supabase PostgreSQL | Row Level Security on all tables |
| Serverless API | Supabase Edge Functions (Deno/TypeScript) | Collection, Economy, Evolution, Matchmaking |
| Real-time | Supabase Realtime | WebSocket channels for match communication |
| Game Server | Railway (Node.js/TypeScript) | Authoritative match engine, auto-scales |
| AI Image | fal.ai (FLUX Kontext Dev and Pro) | Card art generation and evolution img2img |
| AI Text | OpenAI GPT-4o Mini | Card names, flavor text |
| Art CDN | Cloudflare R2 | Card art storage with built-in CDN |
| Analytics | PostHog | Player behavior, retention, economy health |
| Payments | RevenueCat | Wraps Apple IAP + Google Play Billing |
| App Build | Expo EAS Build | iOS + Android from single codebase |
| Admin | React SPA on Railway | Dashboard for owner operations |

---

## 2. User Stories

### 2.1 New Player

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-001 | As a new player, I want to try all three factions before committing so I can find my playstyle. | Player receives 3 premade 20-card loaner decks during trial phase. Player must play at least 1 match before faction selection is enabled. Trial decks cannot be modified or evolved. |
| US-002 | As a new player, I want a guided tutorial so I understand how combat, events, and evolution work. | Tutorial match runs with scripted rolls and AI opponent. Overlays explain each phase. Tutorial can be skipped. First evolution is guided with explanatory overlays. |
| US-003 | As a new player, I want to evolve my first card immediately after onboarding so I experience the core loop. | After faction selection, player receives 200 Chaos Dust, 3 Uncommon Shards, 1 Rare Shard, 1 Legendary Shard, and a starter avatar. One card is pre-loaded with 15 energy for immediate evolution. |
| US-004 | As a new player, I want onboarding quests to guide my first week. | 8 onboarding quests auto-assigned (see `04-progression-economy.md` Section 6.5). Quests are separate from daily rotation and do not expire. |

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
| US-013 | As a subscriber, I want my subscription managed seamlessly through the app stores. | Subscription purchased via RevenueCat (wrapping Apple IAP and Google Play Billing). Tier changes detected via RevenueCat webhook to Supabase Edge Function. Grace period of 7 days on lapse before enforcing card limits. |
| US-014 | As a subscriber, I want more collection capacity so I can explore all factions. | Free: 50 cards/faction, 3 deck slots. Mid: 100 cards/faction, 6 deck slots. Top: 200 cards/faction, 10 deck slots. |

### 2.5 Cross-Faction Unlock

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-015 | As a player, I want to unlock additional factions through gameplay so I can explore new strategies. | Purchasing a card pack from another faction (150 Dust) permanently unlocks that faction. Once unlocked, player can build decks, earn cards, and access faction modifiers during evolution. Decks remain single-faction. |

---

## 3. Feature Requirements (MVP)

### 3.1 P0 -- Must Have (Launch Blockers)

| ID | Feature | Description | Reference |
|---|---|---|---|
| P0-001 | Core Battle System | 9-phase turn structure, D20 chaos roll, event resolution, MTG-style combat with all 7 keywords, simultaneous damage, timer management | `01-battle-mechanics.md` Sections 1-9 |
| P0-002 | Card Evolution | 4-tier evolution (Common through Legendary), energy accumulation, shard consumption, 70/30 channeling roll, modifier selection, triggered ability grant, stat growth, AI art generation via fal.ai | `01-battle-mechanics.md` Section 1, `02-card-data-model.md` Section 20 |
| P0-003 | Card Collection | CardInstance CRUD, ownership tracking, collection browsing with filters/search, card detail view, card limit enforcement by subscription tier | `02-card-data-model.md` Sections 1-5, `07-ui-ux-specs.md` Section 5 |
| P0-004 | Deck Building | 20-card deck construction, single-faction enforcement, copy limits (max 2 per template, max 2 Legendaries at 1 copy each), avatar selection, deck validation | `02-card-data-model.md` Section 11, `07-ui-ux-specs.md` Section 5.3 |
| P0-005 | Matchmaking | Ranked and Casual queue via Supabase `matchmaking_queue` table, rank-based matching with expanding search, match creation and player assignment | `06-technical-architecture.md` Section 2.6 |
| P0-006 | Economy Core | Chaos Dust earning (win/loss rewards), spending (card packs, shards, specific cards), shard inventory, transaction logging | `04-progression-economy.md` Sections 2-3 |
| P0-007 | Authentication | Apple Sign-In + Google Sign-In via Supabase Auth, JWT session management, subscription tier verification via RevenueCat entitlements | `06-technical-architecture.md` Section 2.1, `09-monetization-details.md` Section 2 |
| P0-008 | AI Art Generation | fal.ai FLUX Kontext integration for evolution art (img2img), FLUX Dev for batch base cards (txt2img), quality pipeline (fal.ai built-in NSFW filter, text-in-image detection), fallback art via Sharp | `03-prompt-templates.md`, `06-technical-architecture.md` Section 3 |
| P0-009 | AI Text Generation | OpenAI GPT-4o Mini for card names (2-3 candidates) and flavor text at each evolution | `03-prompt-templates.md`, `06-technical-architecture.md` Section 3 |
| P0-010 | Battle UI | Battlefield layout (5 slots per side), hand display, mana crystals, HP bars, chaos roll animation, event overlay, turn phase indicator, timer bar, combat animations. Built with React Native Reanimated 3 + Skia. | `07-ui-ux-specs.md` Section 3 |
| P0-011 | Core Navigation | 5-tab bottom bar (Home, Collection, Decks, Profile, Shop) via Expo Router v3, battle flow (mode select, matchmaking, battle, post-match) | `07-ui-ux-specs.md` Sections 1-2 |
| P0-012 | Onboarding | Account creation via Supabase Auth, faction trial (3 loaner decks), tutorial match (scripted), first evolution (guided), faction commitment | `07-ui-ux-specs.md` Section 7, `04-progression-economy.md` Section 6 |
| P0-013 | Game Server | Server-authoritative game logic on Railway (Node.js/TypeScript), communicates via Supabase Realtime channels, reconnection handling, anti-cheat validation | `06-technical-architecture.md` Sections 4.1-4.6 |
| P0-014 | Real-Time Match Communication | Supabase Realtime channels (`match:{match_id}`), client-to-server actions, server-to-client state broadcasts, match lifecycle | `06-technical-architecture.md` Section 5 |
| P0-015 | Instability System | Player instability calculation (avatar + creature sum), clamped 1-20, recalculation on board changes, attunement state management | `01-battle-mechanics.md` Section 2 |

### 3.2 P1 -- Should Have (Target for Launch)

| ID | Feature | Description | Reference |
|---|---|---|---|
| P1-001 | Quest System | 3 daily quests (20 templates), 2 weekly quests (10 templates), quest generation algorithm, progress tracking, reward distribution, 1 free reroll/day | `04-progression-economy.md` Section 4 |
| P1-002 | Rank Ladder | 17 tiers, points system (+25/-20 same tier), rank floors, season structure (8 weeks), season reset (drop 5 divisions), end-of-season rewards | `04-progression-economy.md` Section 5 |
| P1-003 | Full Shop | Subscription tier display via RevenueCat paywall UI, card pack purchase (Dust), shard purchase (Dust), avatar unlock (Dust), subscription upgrade flow | `07-ui-ux-specs.md` Section 6, `09-monetization-details.md` Section 3 |
| P1-004 | All 3 Factions Complete | ~120 card templates per faction (90-125 creatures, 15-20 spells, 5-10 stabilizers) + 7 universal stabilizers. 240 modifier definitions. | `05-content-pipeline.md` Section 1 |
| P1-005 | Cross-Faction Unlock | 150 Dust card pack unlocks new faction permanently | `04-progression-economy.md` Section 2.3 |
| P1-006 | Post-Match Results | Victory/defeat display, chaos energy earned per card, Dust earned, quest progress, evolution-ready indicators, play again/evolve/home buttons | `07-ui-ux-specs.md` Section 15 |
| P1-007 | Subscription Management | RevenueCat integration with `react-native-purchases` v8.x, webhook to Supabase Edge Function for tier sync, grace period on lapse, downgrade warnings | `09-monetization-details.md` Sections 2-5 |
| P1-008 | Audio System | Faction-specific battle music, adaptive intensity system, SFX for combat/events/UI, 12-channel mixer via expo-av, volume controls | `08-audio-design.md` |
| P1-009 | Achievement System | Achievement definitions, progress tracking per player, one-time rewards, achievement display on profile | `02-card-data-model.md` Section 17 |
| P1-010 | Settings Screen | Account, Audio (master/music/SFX volume), Visuals (reduced motion, colorblind mode, animation quality, screen shake), Gameplay (auto-end turn, timer extension for casual), Notifications, Privacy | `07-ui-ux-specs.md` Section 14 |
| P1-011 | Admin Dashboard | React SPA on Railway: economy config editor, batch card generation trigger, generation review/approve/reject gallery, player lookup, match monitor, PostHog embedding | `06-technical-architecture.md` Section 8 |

### 3.3 P2 -- Nice to Have (Post-Launch)

| ID | Feature | Description |
|---|---|---|
| P2-001 | Practice Mode vs AI | AI opponent with difficulty-based deck selection |
| P2-002 | Battle Pass | Free track (30 tiers) + Premium track (50 tiers, $9.99/season), XP progression |
| P2-003 | Cosmetics Store | Card backs, board skins, avatar frames, card reveal animations -- all direct purchase via RevenueCat |
| P2-004 | Friends List | Friend codes, friend requests, online status, friend profiles |
| P2-005 | Battle History / Replay | Match history for past 10 games, game log replay |
| P2-006 | Deck Import/Export | Share deck codes with other players |

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
| REQ-005 | Each turn shall execute 9 phases in fixed order: Start of Turn, Chaos Roll, Event Resolution, Draw and Gain Mana, Main Phase, Declare Attackers, Assign Blockers, Combat Resolution, End of Turn. | Phases 1-4 and 9 are automatic (no player input, no timer). Phases 5-7 are decision phases with timers. Phase 8 resolves automatically after blocker confirmation. |
| REQ-006 | The active player shall have 60 seconds for all decision phases (5-6) combined. | Timer starts at Main Phase. At 15 seconds remaining, server broadcasts `timer:warning` on the Realtime channel. At 0 seconds, turn auto-ends with no attacks. |
| REQ-007 | The defending player shall have 60 seconds for blocker assignment (phase 7). | Independent timer. At 0 seconds, no blockers assigned -- all attackers hit face. |
| REQ-008 | P1 shall not be allowed to attack on turn 1. | Server validates and rejects attack declarations from P1 on turn 1. Error code: `P1_NO_ATTACK_TURN_1`. |

#### Chaos Roll and Events

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-009 | The game server shall roll a D20 at the start of each turn and compare to the active player's instability. | Roll < instability = Chaos event. Roll > instability = Order event. Roll == instability = Nothing. RNG is seeded per match for reproducibility. |
| REQ-010 | When an event triggers, the system shall select one event uniformly at random from the 8-event pool for that type (12.5% each). | 8 Order events (O1-O8) and 8 Chaos events (C1-C8) as defined in `01-battle-mechanics.md` Sections 8-9. |
| REQ-011 | Events requiring player choice (O2 Planar Ward, O5 Fortify) shall provide a 10-second sub-timer. | Sub-timer does NOT count against the 60-second decision timer. On timeout, auto-select leftmost valid target. Valid targets highlight on screen. |
| REQ-012 | After event resolution, all triggered abilities matching the event type shall fire left-to-right by board slot (0-4). | Each ability fully resolves before the next fires. If an ability kills a creature in a later slot, that creature's ability does not fire. |
| REQ-013 | Attunement state shall persist until the player's next chaos roll. | If a player rolled Chaos, their Chaos-attuned modifier bonuses stay active through the opponent's turn. Attunement does not change during the opponent's turn. |

#### Mana and Card Play

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-014 | The active player shall gain 1 chaos mote per turn (up to cap of 10). Unspent motes carry over. | Mana gain occurs in Phase 4 (Draw and Gain Mana). |
| REQ-015 | The active player shall draw 1 card per turn from the top of their deck. | If deck is empty, no card is drawn and no penalty is applied. |
| REQ-016 | Cards shall be playable during Main Phase only. | Creatures are placed on empty board slots. Spells resolve immediately and are discarded. Stabilizers occupy board slots. No summoning sickness -- creatures can attack the turn they are played. |
| REQ-017 | Chaos mote cost shall be fixed forever and never change through evolution. | `CardInstance.mana_cost` always equals `CardTemplate.mana_cost`. Enforced at the database level. |

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
| REQ-030 | AI art generation shall use the previous tier's art as img2img reference for visual continuity. | fal.ai FLUX Kontext receives the card's current art_url as input_image. Prompt constructed from faction prefix + evolution direction + player-selected prompt modifiers + evolution history context. Full prompt construction algorithm in `03-prompt-templates.md`. |
| REQ-031 | The player shall select from 2-3 AI-generated name candidates for the evolved card. | GPT-4o Mini generates candidates based on faction voice, evolution history, and previous names. All candidates and the chosen name are stored in the EvolutionRecord. |
| REQ-032 | Evolution shall be an atomic transaction: shard deduction, record creation, and card update succeed or fail together. | Implemented as a Supabase Edge Function wrapping all writes in a PostgreSQL transaction. If AI generation fails, shard and chaos energy are refunded. Fallback art (programmatic color shift + particle overlay via Sharp) is applied if AI fails after 3 retries. |

### 4.3 Card Collection and Deck Building

**Reference:** `02-card-data-model.md` Sections 1-2, 11; `07-ui-ux-specs.md` Section 5

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-033 | Card collection shall enforce per-faction capacity limits based on subscription tier. | Free: 50 cards/faction. Mid: 100 cards/faction. Top: 200 cards/faction. Enforced at the Supabase Edge Function level on card creation. |
| REQ-034 | Card packs shall contain 3 random Commons from the target faction with duplicate protection. | If a pack would produce a 3rd+ copy of an owned Common, it rerolls to a different Common. Own-faction pack costs 100 Dust. Cross-faction pack costs 150 Dust and permanently unlocks the faction. |
| REQ-035 | Deck validation shall enforce all construction rules before matchmaking. | Exactly 20 cards. Single faction (all cards share faction_id). Max 2 copies of any template. Max 2 Legendaries, max 1 copy of each Legendary. Avatar must match deck faction. At least 1 creature. |
| REQ-036 | Players shall have deck slot limits based on subscription tier. | Free: 3 slots. Mid: 6 slots. Top: 10 slots. Invalid (work-in-progress) decks can be saved but not used in matchmaking. |

### 4.4 Economy

**Reference:** `04-progression-economy.md` Sections 2-3

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-037 | Players shall earn Chaos Dust from completed matches. | Win: 15 Dust. Loss: 5 Dust. Awarded at match end. First daily win: +25 bonus Dust. All values read from `economy_config` table (not hardcoded). |
| REQ-038 | Subscriber quest Dust bonuses shall apply to all quest rewards. | Mid tier: +50% quest Dust. Top tier: +100% quest Dust. Bonuses apply to daily and weekly quests. Bonus percentages read from `economy_config` table. |
| REQ-039 | Shard costs shall be: Uncommon 25, Rare 75, Epic 150, Legendary 240 Chaos Dust. | Shard purchases are deducted atomically from player's Chaos Dust balance within a PostgreSQL transaction. All values read from `economy_config` table. |
| REQ-040 | All currency operations shall use PostgreSQL transactions to prevent double-spend. | Every Dust deduction is atomic with the corresponding purchase (pack opening, shard purchase, avatar unlock). All transactions logged to `shard_transactions` table for audit. |
| REQ-041 | Monthly subscription benefits shall be granted automatically. | Mid: +3 Commons/month to primary faction. Top: +5 Commons/month to any unlocked faction + 1 free Legendary Shard/month. Triggered by a pg_cron job running daily that checks billing anniversary date from RevenueCat webhook data. |

### 4.5 Matchmaking

**Reference:** `06-technical-architecture.md` Section 6.7

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

### 4.7 User Interface

**Reference:** `07-ui-ux-specs.md` (full specification)

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-049 | All interactive elements shall meet the 44x44pt minimum tap target (Apple HIG). | Small visual icons (mana crystals, keyword icons at 20-24pt) use invisible padding to reach 44x44pt tap area. |
| REQ-050 | The battlefield shall display 5 creature slots per side, HP bars, mana crystals, instability values, timer bar, and a horizontally scrollable hand area. | Layout per `07-ui-ux-specs.md` Section 3.1. Board slot dimensions ~60x85pt on phone. Hand card dimensions 90x130pt. |
| REQ-051 | The evolution flow shall follow the 9-step ceremony. | Steps: Card Presentation, Channel Selection, Evolution Animation (looping while AI generates), Art Reveal, Name Selection, Ability Reveal, Modifier Selection, Flavor Text Reveal, Final Presentation and Confirm. Minimum animation duration 2.5s even if AI finishes faster. Full step specs in `07-ui-ux-specs.md` Section 4. |
| REQ-052 | The bottom tab bar shall be visible on all screens except during battle. | 5 tabs: Home, Collection, Decks, Profile, Shop. Battle is full-screen immersive. Implemented via Expo Router tab layout. |
| REQ-053 | Blocker assignment shall use drag interaction via react-native-gesture-handler. | Drag defending creature onto attacking creature. Valid targets glow green (#4CAF50). Invalid zones flash red and creature snaps back with spring animation. Connection line drawn between assigned blocker and attacker using Skia Canvas. |
| REQ-054 | The app shall use portrait orientation for all screens (MVP). | Set in Expo `app.json` as `"orientation": "portrait"`. |

### 4.8 Factions and Content

**Reference:** `01-battle-mechanics.md` Section 5, `05-content-pipeline.md`

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-055 | Each faction shall have an exclusive mechanic referenced by its faction modifiers. | Ironwright: Augment (stacking self-referencing effects). Fey Courts: Bond (cross-creature synergies). Demonic Kingdoms: Corruption (self-damage for power). |
| REQ-056 | Faction modifiers shall always reference their exclusive mechanic keyword. | A modifier in the Ironwright pool that does not reference Augment count or Augment-related conditions is invalid. Universal modifiers shall not reference any faction mechanic. |
| REQ-057 | Each faction shall have 2 avatars at launch (1 starter + 1 unlockable). | Avatars have instability modifiers: Order-leaning (-5 to -6), Balanced (-3 to -4), Chaos-leaning (-1 to -2). 6 avatar rows in `seed.sql`. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| REQ | Requirement | Target | Measurement |
|---|---|---|---|
| REQ-058 | Turn resolution latency | < 100ms server-side (action received to state broadcast) | Game server instrumentation (timestamp before/after state transition) |
| REQ-059 | Supabase Edge Function p50/p95/p99 | < 100ms / < 200ms / < 500ms | Supabase dashboard Edge Function metrics |
| REQ-060 | Supabase Realtime message delivery | < 50ms from server broadcast to client receipt | Client-side timestamp comparison |
| REQ-061 | AI image generation end-to-end | < 30s (fal.ai queue + generation + quality check + R2 upload) | `generation_jobs` table timestamps |
| REQ-062 | AI text generation end-to-end | < 5s | `generation_jobs` table timestamps |
| REQ-063 | Matchmaking queue time | < 15s at launch; < 30s off-peak | `matchmaking_queue.queued_at` to match creation timestamp |
| REQ-064 | Client frame rate | 30fps minimum on iPhone 11 or equivalent 3-year-old Android device | Client profiling with React Native Performance Monitor |
| REQ-065 | Client cold start | < 5s to home screen | Client instrumentation via PostHog `app_cold_start` event |
| REQ-066 | Client match load | < 3s from match found to board rendered | Client instrumentation |

### 5.2 Scalability

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-067 | The Railway game server shall handle 50-100 concurrent matches per instance and scale automatically. | Railway auto-scaling is configured via `railway.json`. Match state is held in-memory. On instance restart, active matches are lost (acceptable at launch scale). PostgreSQL snapshots on phase transitions provide reconnection support. |
| REQ-068 | The system shall support 1,000-5,000 concurrent players at launch with capacity to scale to 50,000. | 1-3 Railway instances at launch. Supabase Pro plan handles database load. Edge Functions auto-scale with Supabase. |
| REQ-069 | AI generation jobs shall be processed via the `generation_jobs` Supabase table with a pg_cron Edge Function polling every 30 seconds. | Priority field on generation_jobs: subscriber jobs (priority 1) processed before free jobs (priority 2). Batch pipeline jobs lowest priority (priority 3). |

### 5.3 Security

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-070 | All game logic shall be server-authoritative. | Client sends action intents only. Server validates legality, applies state changes, broadcasts results. Client never computes game state, rolls dice, or resolves combat. Match PRNG seed is server-side only. Opponent hand and deck order never sent to client. |
| REQ-071 | All network communication shall use TLS. | HTTPS for REST (Supabase enforces this). WSS for Realtime (Supabase enforces this). Cloudflare R2 serves art over HTTPS. Railway endpoints use HTTPS. |
| REQ-072 | All data at rest shall be encrypted. | Supabase PostgreSQL: AES-256 managed encryption. Cloudflare R2: server-side encryption. Secrets stored as Railway environment variables and Supabase Edge Function secrets (encrypted at rest). |
| REQ-073 | Rate limiting shall be enforced at the Edge Function level. | Auth: handled by Supabase Auth built-in rate limiting. General API: 100 req/min per user (Edge Function middleware using `rate_limit_log` table). Evolution start: tier-based (5/15/30 per day, checked via `generation_jobs` count). Card pack purchase: 20/hour. Matchmaking queue: 5/min. Returns HTTP 429 with Retry-After header. |
| REQ-074 | Player-selected prompt modifiers shall be drawn from a curated whitelist only. | Players never type free-form text that reaches AI models. Prompt construction is entirely server-side from validated components stored in `modifier_definitions` and prompt modifier tables. |
| REQ-075 | All generated images shall pass through NSFW filtering before storage. | fal.ai provides built-in content moderation scores with generation results. Reject if any unsafe category flagged. Retry with modified prompt up to 3 times, then apply programmatic fallback art via Sharp on the server. |

### 5.4 Accessibility

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-076 | The app shall support 3 colorblind modes: Deuteranopia, Protanopia, Tritanopia. | Order/Chaos indicators use icons + patterns in addition to color. Attunement: Order = blue circle, Chaos = red triangle, Neutral = gray square. HP bars always show numeric values. |
| REQ-077 | The app shall support a Reduced Motion mode. | D20 roll: instant result. Card animations: fade instead of slide. Damage numbers: static display. Particle effects: disabled. Screen shake: disabled. |
| REQ-078 | The app shall support system font size preferences (iOS Dynamic Type, Android font scale). | Scalable: card names, descriptions, labels, tooltips. Fixed-size: ATK/HP numbers on cards, mana cost icons. Long text truncated with ellipsis or made scrollable. |
| REQ-079 | All critical battle interactions shall be reachable with thumb-only input in portrait mode. | Hand area, End Turn button, mana display in bottom zone. No essential controls in top corners (opponent info is read-only). |

### 5.5 Platform Support

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-080 | iOS minimum version shall be iOS 16+. Android minimum shall be API level 33 (Android 13). | Configured in Expo `app.json`. Safe area insets respected for notch/Dynamic Island on iOS. |
| REQ-081 | The app shall support both phone and tablet layouts. | Phone: 3-column collection grid, stacked deck builder. Tablet (width >= 768pt): 5-6 column grid, side-by-side deck builder. Detected via `useWindowDimensions()`. |

### 5.6 Localization

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-082 | The app shall launch in English with architecture supporting future localization. | All user-facing strings externalized using `expo-localization` + i18n library. Date/time formatting locale-aware. Currency display uses platform locale. Regional pricing for subscriptions via App Store / Play Store pricing tiers (see `09-monetization-details.md` Section 11). |

---

## 6. Data Requirements

**Reference:** `02-card-data-model.md` (complete entity definitions), `06-technical-architecture.md` Section 2

### 6.1 Key Entities

| Entity | Storage | Description |
|---|---|---|
| CardTemplate | Supabase PostgreSQL (immutable after approval) | Base card definition: name, faction, type, stats, keywords, art prompt, art URL. ~360 rows at launch. |
| CardInstance | Supabase PostgreSQL (JSONB for evolution_history, modifiers, triggered_abilities) | Player-owned card: tier, current stats, instability, chaos energy, modifiers, abilities, art URL. High write frequency on evolution; moderate on energy gain. |
| ModifierDefinition | Supabase PostgreSQL (global content) | Modifier pool entry: effects, attunement, PP cost, faction. 240 rows at launch. |
| Deck / DeckEntry | Supabase PostgreSQL | Player's deck: 20 card entries, faction, avatar. Validated on save and queue entry. |
| Player | Supabase PostgreSQL (row-level locking for currency) | Account, subscription tier, Chaos Dust balance, shard inventory, rank, settings, faction mastery. |
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
| Cloudflare R2 (card art) | ~5 GB (base art for ~360 templates) | ~500 GB - 2 TB (evolution art for all players) |

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
| HTTPS REST | Collection, economy, deck management, evolution, profile, matchmaking | Supabase JWT (automatically included by Supabase client SDK) | Supabase Edge Functions |
| Supabase Realtime | Real-time match communication | JWT on channel subscription | Supabase Realtime channels |

### 7.2 REST API Contracts (Supabase Edge Functions)

Base URL: `https://<project>.supabase.co/functions/v1`

#### Authentication

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-083 | -- | Supabase Auth SDK | Sign in with Apple or Google via `supabase.auth.signInWithOAuth({ provider: 'apple' })`. No custom auth endpoints. |
| REQ-084 | -- | Supabase Auth SDK | Token refresh handled automatically by `@supabase/supabase-js`. |

#### Players

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-085 | GET | `/players/me` | Get current player profile. Response: `{player: Player}`. |
| REQ-086 | PATCH | `/players/me` | Update display name or settings. Request: `{display_name?, settings?}`. |
| REQ-087 | POST | `/players/me/faction` | Select initial faction during onboarding. Request: `{faction_id}`. |

#### Collection

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-088 | GET | `/collection/cards` | List owned cards with pagination, faction filter, tier filter, sort. Response: `{cards: CardInstance[], total, page}`. |
| REQ-089 | GET | `/collection/cards/{id}` | Get full card detail including evolution history, modifiers, abilities. |

#### Decks

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-090 | GET | `/decks` | List all player decks. Response: `{decks: Deck[]}`. |
| REQ-091 | POST | `/decks` | Create deck. Request: `{name, faction_id, avatar_id}`. Response: `{deck}`. |
| REQ-092 | PUT | `/decks/{id}` | Update deck. Request: `{name?, avatar_id?, card_entries?}`. Response: `{deck, validation_errors}`. |
| REQ-093 | POST | `/decks/{id}/validate` | Validate deck against all construction rules. Response: `{is_valid, errors: string[]}`. |

#### Economy

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-094 | GET | `/economy/balance` | Get Chaos Dust and shard balances. |
| REQ-095 | POST | `/economy/purchase/card-pack` | Buy card pack. Request: `{faction_id}`. Response: `{cards: CardInstance[], dust_spent}`. |
| REQ-096 | POST | `/economy/purchase/shard` | Buy shard. Request: `{shard_tier}`. Response: `{shard_tier, dust_spent}`. |
| REQ-097 | GET | `/economy/missions` | Get active daily and weekly missions with progress. |
| REQ-098 | POST | `/economy/missions/{id}/claim` | Claim completed mission reward. Response: `{reward_type, reward_amount}`. |

#### Evolution

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-099 | POST | `/evolution/check` | Check eligibility. Request: `{card_instance_id}`. Response includes chaos energy, threshold, shard availability, available prompt modifiers. |
| REQ-100 | POST | `/evolution/start` | Begin evolution. Request: `{card_instance_id, prompt_modifiers, channel_direction}`. Response: `{evolution_id, actual_outcome, modifier_options, ability, stat_changes, instability_change}`. Fires fal.ai + OpenAI generation jobs. |
| REQ-101 | GET | `/evolution/{id}/status` | Poll generation status. Response: `{status: PENDING|IMAGE_PROCESSING|TEXT_PROCESSING|COMPLETE|FAILED, art_url?, name_candidates?, flavor_text?}`. Client polls every 500ms. |
| REQ-102 | POST | `/evolution/{id}/confirm` | Confirm choices. Request: `{modifier_chosen_id, name_chosen}`. Response: `{card: CardInstance}`. |

#### Matchmaking

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-103 | POST | `/matchmaking/queue` | Enter queue. Request: `{deck_id, mode: RANKED|CASUAL}`. Validates deck before inserting into `matchmaking_queue` table. |
| REQ-104 | DELETE | `/matchmaking/queue` | Leave queue. Deletes row from `matchmaking_queue`. |
| REQ-105 | GET | `/matchmaking/status` | Check queue status. Response: `{status: QUEUED|MATCHED|NOT_QUEUED, match_id?}`. |

### 7.3 Realtime Channel Events

All match communication uses Supabase Realtime channels. Each match uses channel `match:{match_id}`. Full TypeScript type definitions for all messages are in `06-technical-architecture.md` Section 5.

#### Client-to-Server

| REQ | Event | Payload | Phase |
|---|---|---|---|
| REQ-106 | `player_action: mulligan` | `{mulligan: bool}` | GAME_SETUP |
| REQ-107 | `player_action: play_card` | `{card_id, target_slot?, target_id?}` | MAIN_PHASE |
| REQ-108 | `player_action: declare_attackers` | `{attacker_ids: string[]}` | DECLARE_ATTACKERS |
| REQ-109 | `player_action: assign_blockers` | `{assignments: [{blocker_id, attacker_id}]}` | ASSIGN_BLOCKERS |
| REQ-110 | `player_action: surrender` | `{}` | Any (after turn 2) |

#### Server-to-Client (Key Events)

| REQ | Event | When |
|---|---|---|
| REQ-111 | `game_event: match:state` | On connect/reconnect -- full state snapshot (filtered to hide opponent hand/deck) |
| REQ-112 | `game_event: match:start` | Match begins -- player side, opponent info, first player |
| REQ-113 | `game_event: turn:chaos_roll` | Phase 2 -- roll value, instability, result (ORDER/CHAOS/NOTHING), creature stat updates |
| REQ-114 | `game_event: turn:event` | Phase 3 -- event ID, name, effect description, targets |
| REQ-115 | `game_event: combat:resolution` | Phase 8 -- all combat pairs with damage, deaths, piercing, lifesteal details |
| REQ-116 | `game_event: match:end` | Game over -- winner, end reason, rewards, card energy gained |
| REQ-117 | `game_event: timer:warning` | 15 seconds remaining on decision timer |

### 7.4 Server Validation on Every Action

The game server shall validate on every client action (REQ-070 expansion):

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
| REQ-118 | Base card art shall be generated via fal.ai FLUX Dev (txt2img) during the batch pipeline at 1024x1024 resolution. | Exact fal.ai API endpoint: `https://fal.run/fal-ai/flux/dev`. Prompt structure: `[FACTION_PREFIX] + [CREATURE_TYPE] + [VISUAL_DETAILS] + [FRAMING] + [QUALITY_TAGS]`. Full prompt construction in `03-prompt-templates.md`. |
| REQ-119 | Evolution art shall be generated via fal.ai FLUX Kontext (img2img) using the previous tier's art as reference. | Exact fal.ai API endpoint: `https://fal.run/fal-ai/flux-pro/kontext`. Input: current card art URL. Prompt constructed server-side from faction prefix, evolution direction (Order = subtle refinement / Chaos = dramatic transformation), player-selected prompt modifiers, and evolution history context. |
| REQ-120 | Shard quality shall determine AI model variant, resolution, and number of passes. | Free (PLANAR): FLUX Kontext Dev (`fal-ai/flux/kontext`), 768x1024, 1 pass. Mid (REFINED): FLUX Kontext Pro (`fal-ai/flux-pro/kontext`), 1024x1024, 1 pass, priority in generation queue. Top (PRISMATIC): FLUX Kontext Pro, 1024x1024, 2 passes (generate + refine), priority in generation queue. |
| REQ-121 | AI generation shall be tracked via the `generation_jobs` Supabase table with priority processing for subscribers. | Priority 1: subscriber evolution jobs. Priority 2: free evolution jobs. Priority 3: batch pipeline jobs. A pg_cron Edge Function processes pending jobs every 30 seconds, ordered by priority then created_at. |

### 8.2 Text Generation

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-122 | Card names and flavor text shall be generated by OpenAI GPT-4o Mini. | Exact model: `gpt-4o-mini`. Temperature 0.8, max 150 tokens. Generate 2-3 name candidates (1-4 words each) and 1 flavor text (1-2 sentences). Faction voice and name voice instructions in system prompt per `03-prompt-templates.md`. Request JSON mode for structured output. |
| REQ-123 | If text parsing fails, the system shall retry with JSON mode explicitly requested. | Max 2 retries. On final failure, use template name with tier suffix (e.g., "Ashscale Wyvern II"). |

### 8.3 Quality Pipeline

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-124 | Every generated image shall pass NSFW filtering before storage. | fal.ai returns safety scores with generation results. Reject if any unsafe category is flagged. If fal.ai does not return safety data, the image is accepted (fal.ai models are trained to not generate NSFW content). |
| REQ-125 | Every generated image prompt shall include "no text, no letters, no words" to prevent text-in-image artifacts. | Appended automatically to every prompt by the server-side prompt construction function. |
| REQ-126 | After 3 generation failures, the system shall apply programmatic fallback art. | Fallback: server-side image processing using Sharp in a Supabase Edge Function. Order outcome: blue/gold color tint + sharpen. Chaos outcome: red/purple color tint + saturation boost. Queue a background retry for full AI art by inserting a new `generation_jobs` row. Player receives push notification when full art is ready. |

### 8.4 Cost Management

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-127 | Per-user daily evolution caps shall be enforced. | Free: 5 evolutions/day. Mid: 15/day. Top: 30/day. Hard cap: 50 per user per day regardless of tier. Enforced by counting `generation_jobs` rows with `player_id` and `created_at > now() - interval '24 hours'`. |
| REQ-128 | Every AI generation call shall log cost data for tracking. | The `generation_jobs` row stores: model used, resolution, estimated cost, player_id, card_instance_id. PostHog receives `ai_generation_completed` events with cost data. |
| REQ-129 | Target AI cost per evolution: Free ~$0.02, Mid ~$0.04, Top ~$0.08. | Monthly AI cost budget at 10K DAU: ~$3,900. Budget tracked via PostHog dashboard aggregating `generation_jobs` cost data. |

### 8.5 Art Storage (Cloudflare R2)

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-130 | Card art shall be stored in Cloudflare R2 with the following path structure: `base/{faction_short_name}/{template_id}.png` for base art, `evolution/{player_id}/{card_instance_id}/step-{1-4}.png` for evolution art. | R2 public bucket URL serves as CDN (Cloudflare edge caching). Cache-Control: `public, max-age=31536000` for base art (immutable), `public, max-age=3600` for evolution art (may be replaced by retry). Client caches images locally with art_url as cache key via React Native Image component built-in caching. |
| REQ-131 | Art upload shall use the AWS SDK v3 S3Client (compatible with R2). | Exact TypeScript upload helper code in `06-technical-architecture.md` Section 7.2. R2 credentials stored in Supabase Edge Function secrets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`. |

---

## 9. Analytics Requirements

**Reference:** `04-progression-economy.md` Section 7.6, `09-monetization-details.md` Section 13

### 9.1 Analytics Platform

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-132 | All analytics shall use PostHog (posthog.com). | React Native client uses `posthog-react-native` SDK. Initialize with project API key from `.env`. Server-side events sent via PostHog Node SDK from Edge Functions. No other analytics platform shall be used. |

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
| Cost per Generation | Average cost per AI call by model tier | Track against budget ($0.02/$0.04/$0.08) |
| Queue Depth | Pending rows in `generation_jobs` table with status PENDING | > 500 triggers warning |

### 9.3 Dashboards and Alerting

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-133 | PostHog dashboards shall be configured for: Game Health (active matches, completion rate, duration), Economy (Dust earned/spent, evolution rate, dust bank distribution), AI Pipeline (queue depth, latency, success rate, cost), Player Health (DAU/MAU, retention, session metrics), Revenue (subscriber count by tier, conversion rate, churn rate). | Dashboards created in PostHog UI. No code needed -- PostHog provides dashboard builder. |
| REQ-134 | PostHog webhook alerts shall fire to a Slack channel (or email) for critical thresholds. | Alerts: match completion rate < 90%, AI generation failure rate > 10%, daily revenue drops > 30% day-over-day, zero matches for 5+ minutes during expected peak hours. |

### 9.4 PostHog Events to Fire

Full event table with event names, trigger conditions, and required properties is in `09-monetization-details.md` Section 13. Key events:

| Event Name | When to Fire | Key Properties |
|---|---|---|
| `match_started` | Match begins | `mode`, `player_faction`, `opponent_faction` |
| `match_completed` | Match ends | `result`, `turns`, `duration`, `end_reason` |
| `evolution_started` | Evolution flow begins | `card_instance_id`, `tier_from`, `tier_to`, `channel_direction` |
| `evolution_completed` | Evolution confirmed | `card_instance_id`, `actual_outcome`, `modifier_chosen`, `ai_cost` |
| `purchase_completed` | RevenueCat confirms purchase | `product_id`, `price_usd`, `new_tier` |
| `paywall_shown` | Any paywall displayed | `trigger_reason`, `current_tier`, `screen_name` |

---

## 10. Launch Criteria

### 10.1 Minimum Content

| REQ | Category | Minimum | Target |
|---|---|---|---|
| REQ-135 | Card templates | 300 total (100/faction) | 360 total (120/faction) |
| REQ-136 | Universal stabilizers | 7 | 7 |
| REQ-137 | Modifier definitions | 240 (96 universal + 48 per faction) | 240 |
| REQ-138 | Order events | 8 | 8 |
| REQ-139 | Chaos events | 8 | 8 |
| REQ-140 | Avatars | 6 (2 per faction) | 6 |
| REQ-141 | Starter decks | 3 (1 per faction, 20 cards each) | 3 |

### 10.2 Feature Completeness

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-142 | All P0 features shall be fully implemented and tested. | Every P0 feature (P0-001 through P0-015) passes acceptance criteria. No known critical or high-severity bugs in P0 features. |
| REQ-143 | All P1 features shall be implemented or have approved deferral plans. | P1 features not ready for launch have documented post-launch delivery timelines. |

### 10.3 Performance Benchmarks

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-144 | Load testing shall simulate 200 concurrent matches without degradation. | Turn resolution < 100ms. Edge Function p95 < 200ms. No match state corruption. Realtime message delivery < 50ms. Tested using a Node.js load test script that simulates match flows. |
| REQ-145 | Client performance shall be validated on iPhone 11 (minimum target device) and a mid-range Android device. | 30fps during battle with 10 creatures on board. Cold start < 5s. Match load < 3s. No memory leaks over 30-minute session. |

### 10.4 QA Requirements

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-146 | Full combat resolution test suite shall cover all keyword interaction pairs. | Per `01-battle-mechanics.md` Section 4 keyword interaction matrix: Shield/Piercing, Shield/Deathtouch, Shield/Lifesteal, Flying/Taunt, Flying/Reach, Deathtouch/Piercing, Deathtouch/Lifesteal, Taunt forced-attack and forced-block scenarios. Automated tests in `packages/game-server/src/__tests__/`. |
| REQ-147 | Evolution flow shall be tested end-to-end for every tier transition and both outcomes. | 4 tier transitions x 2 outcomes = 8 paths. Each path verifies: shard deduction, stat changes, instability change, modifier pool correctness, ability generation, AI art generation (or fallback), EvolutionRecord creation, CardInstance update. Automated tests in `supabase/functions/evolution/__tests__/`. |
| REQ-148 | Economy test suite shall validate all currency operations are transactionally safe. | Double-spend prevention under concurrent requests. Shard deduction atomic with evolution. Dust deduction atomic with pack opening. Negative balance prevention. Automated tests using parallel requests to Edge Functions. |
| REQ-149 | Reconnection shall restore full game state within 3 seconds. | Player reconnects to Supabase Realtime channel, receives `match:state` snapshot, rebuilds board, resumes play. Timer continues from where it was. Opponent sees "Opponent reconnected." |
| REQ-150 | Deck validation shall reject all invalid configurations. | Test: 19 cards, 21 cards, mixed factions, 3 copies of a template, 3 Legendaries, 2 copies of one Legendary, wrong-faction avatar. Each must produce a specific error message. |
| REQ-151 | Balance validation suite shall run against all card templates. | Automated checks per `01-battle-mechanics.md` Section 14: PP budget validation (tolerance +/- 1), instability/stat profile consistency, keyword limits, modifier PP cost matching. Run as `npm run validate-balance` script. |

---

## 11. Dependencies and Risks

### 11.1 External Dependencies

| Dependency | Service | Risk | Mitigation |
|---|---|---|---|
| AI Image Generation | fal.ai (FLUX Kontext) | API downtime, rate limits, cost increases, model deprecation | Fallback art pipeline (REQ-126). Pre-generated base art decoupled from runtime. FLUX is open-source -- self-hosting possible as last resort. |
| AI Text Generation | OpenAI GPT-4o Mini | API downtime, model changes | Fallback to template name + tier suffix. Text generation is non-blocking (evolution can complete without text). Low cost ($0.15/1M tokens) reduces financial risk. |
| Authentication | Supabase Auth (Apple + Google Sign-In) | Supabase outage | Supabase has 99.9% uptime SLA on Pro plan. App is unusable without auth -- no mitigation beyond provider reliability. |
| Subscription Billing | RevenueCat (wrapping Apple IAP + Google Play Billing) | RevenueCat outage, store policy changes | RevenueCat caches entitlements client-side. Offline entitlement checks work for 24h. Store commission rate changes are a business risk, not a technical one. |
| Card Art CDN | Cloudflare R2 | Outage | R2 has Cloudflare's global edge network. Client-side image caching (200MB LRU) means cached art works offline. |
| Game Server Hosting | Railway | Outage, scaling limits | Railway has auto-restart on failure (restartPolicyType: ON_FAILURE). Active matches lost on restart -- acceptable at launch scale. |
| Real-time Communication | Supabase Realtime | Outage, message delivery issues | Client reconnection with exponential backoff (5 attempts). State snapshot on reconnect. 3-turn grace period before auto-forfeit. |

### 11.2 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **AI generation latency spikes** | Medium | Medium -- evolution ceremony stalls | Evolution animation loops gracefully while waiting. Minimum 2.5s animation masks normal latency. "Channeling energy..." text appears after 3s. Timeout at 10s triggers refund (not 30s -- faster feedback for mobile users). |
| **AI art quality inconsistency** | Medium | Medium -- player dissatisfaction with evolution art | Quality pipeline (NSFW filter + "no text" prompt). Prompt engineering with curated modifiers only (no free-form text). Evolution art uses img2img (preserves visual DNA). Owner reviews base card art in batch pipeline Admin Dashboard. |
| **Mobile performance on older devices** | Medium | High -- poor retention | Animation quality tiered by device capability (FULL / REDUCED / MINIMAL setting). Reduced Motion mode. 200MB local art cache. Delta-based Realtime updates (not full state on every action). |
| **Game balance issues at launch** | High | Medium -- player frustration | Economy values in `economy_config` table (changeable via Admin Dashboard, no deploy needed). Automated balance validation suite. PostHog telemetry on win rates by faction, card, modifier. |
| **Content volume insufficient for launch** | Medium | High -- repetitive experience | Batch generation pipeline targets 360 cards. Lower bound of 300 cards (100/faction) still provides viable deckbuilding. 240 modifiers provide evolution variety. Total batch generation cost: ~$11 in fal.ai + OpenAI API calls. |
| **Supabase Realtime reliability on mobile** | Medium | Medium -- disconnects during matches | Client reconnection with exponential backoff per `06-technical-architecture.md` Section 5.4. Game state snapshotted to PostgreSQL on each phase transition. 3-turn grace period before auto-forfeit. Full state snapshot on reconnect. |
| **Economy inflation/deflation** | Medium | Medium -- progression feels wrong | PostHog dashboard tracks Dust bank distribution, quest completion, evolution rate. Tunable via `economy_config` table through Admin Dashboard. See red flags in Section 9.2. |

### 11.3 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Low conversion rate (< 4%)** | Medium | High -- unsustainable unit economics | RevenueCat analytics track conversion funnels. First-month discount offers via RevenueCat offer codes. Evolution-moment upsells. Collection limit (50 cards) as natural conversion trigger. |
| **High subscriber churn (> 8%)** | Medium | Medium -- revenue instability | Grace period on lapse (7 days). Downgrade warnings showing card deletion impact. Annual subscription discount (2 months free). Win-back offers via RevenueCat. |
| **AI API cost increases** | Low | High -- margin compression | fal.ai pricing is usage-based and competitive. FLUX is open-source -- self-hosting on Railway GPU instances is a fallback. Per-user daily evolution caps limit worst-case cost exposure. |
| **App Store rejection** | Low | High -- launch delay | Follow Apple HIG. No loot boxes. Transparent odds disclosure. Anti-predatory design per `09-monetization-details.md` Section 10. RevenueCat handles all IAP compliance. |

---

## 12. Owner's Operational Workflow

This section describes how the owner manages the live game. Every operation is through the Admin Dashboard (React SPA on Railway) or a single terminal command. No code changes, no raw database edits, no infrastructure configuration.

### 12.1 Typical Week (Post-Launch)

| Day | Activity | Tool | Time |
|---|---|---|---|
| Monday | Review weekend metrics: DAU, match completion, revenue, AI costs | Admin Dashboard > PostHog embed | 15 min |
| Monday | Check AI generation queue for failures, retry any stuck jobs | Admin Dashboard > Generation Jobs | 5 min |
| Tuesday | Review and approve/reject any flagged evolution art | Admin Dashboard > Content Review | 10 min |
| Wednesday | Check economy health: Dust bank distribution, quest completion rates | Admin Dashboard > PostHog embed | 10 min |
| Thursday | Review faction win rates, check for balance issues | Admin Dashboard > PostHog embed | 10 min |
| Friday | Approve any batch-generated cards queued for next content drop | Admin Dashboard > Card Generation > Review Gallery | 20 min |
| As needed | Respond to PostHog alerts (match completion drop, AI failure spike, revenue drop) | Email/Slack notification > Admin Dashboard | Varies |

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
2. System automatically: calculates end-of-season rewards for all ranked players, resets rank (drop 5 divisions), inserts new season record, resets battle pass tiers.
3. **Owner reviews rewards distribution** in the dashboard and clicks "Confirm Season Reset."
4. All players see the new season on next app open.

### 12.5 Handling Incidents

| Incident | Detection | Resolution |
|---|---|---|
| AI generation queue backup (>500 pending) | PostHog alert | Admin Dashboard > Generation Jobs > check for stuck jobs. Retry or clear failed jobs. If fal.ai is down, do nothing -- fallback art kicks in automatically after 3 failures per job. |
| Match completion rate drops below 90% | PostHog alert | Check Railway logs for game server errors. If server crashed, Railway auto-restarts. Active matches are lost but players can requeue. |
| Economy metric out of range (e.g., Dust inflation) | Weekly review | Admin Dashboard > Economy Controls. Adjust relevant values (e.g., reduce Dust per win from 15 to 12). Monitor for 48 hours. |
| Player support request | Email to support address | Admin Dashboard > Player Lookup. Search by display name or friend code. View full profile, match history, collection. Grant compensation (Dust, shards) via player detail page if needed. |

### 12.6 Deploying Updates

All deployments use a single script:

```bash
./deploy.sh          # Deploys: Supabase migrations, Edge Functions, Railway game server + admin dashboard
./deploy.sh --build  # Also triggers Expo EAS Build for iOS + Android app updates
```

The owner runs this after Claude Code makes code changes. The script is defined in `06-technical-architecture.md` Section 9.3.

---

## 13. Accounts and Costs

### 13.1 Accounts to Create (Before Build Phase)

| # | Service | URL | What to Get | Cost |
|---|---|---|---|---|
| 1 | Supabase | supabase.com | Project URL, Anon Key, Service Role Key | Free tier for dev. Pro plan $25/mo for production. |
| 2 | fal.ai | fal.ai | API Key | Pay-per-use. ~$0.02-$0.08 per image. |
| 3 | OpenAI | platform.openai.com | API Key | Pay-per-use. ~$0.15/1M input tokens (GPT-4o Mini). |
| 4 | Cloudflare | cloudflare.com | R2 Bucket, Access Key, Secret Key, Account ID | Free up to 10 GB storage + 10M reads/mo. Then $0.015/GB/mo. |
| 5 | Railway | railway.app | Account (link GitHub repo) | $5/mo base + usage. ~$50-100/mo at launch. |
| 6 | Apple Developer | developer.apple.com | Developer account for App Store | $99/year. |
| 7 | Google Play | play.google.com/console | Developer account for Play Store | $25 one-time. |
| 8 | PostHog | posthog.com | Project API Key | Free up to 1M events/mo. Then usage-based. |
| 9 | RevenueCat | app.revenuecat.com | Public SDK Keys (iOS + Android), Webhook URL | Free until $2,500 MRR. Then 1% of tracked revenue. |
| 10 | Expo | expo.dev | EAS account for cloud builds | Free tier: 30 builds/mo. Then $99/mo for more. |

All keys go in a single `.env` file (template at `.env.example`). No other configuration is needed.

### 13.2 Monthly Cost Estimates (Production)

| Service | At 1K DAU | At 10K DAU | At 50K DAU | At 100K DAU |
|---|---|---|---|---|
| Supabase (Pro) | $25 | $25 | $25 | $599 (Team plan) |
| Railway (game server + admin) | $20 | $50-100 | $200-400 | $400-800 |
| fal.ai (image generation) | $100 | $3,900 | $19,500 | $39,000 |
| OpenAI (text generation) | $5 | $20 | $100 | $200 |
| Cloudflare R2 | $0 | $5 | $25 | $50 |
| PostHog | $0 | $0 | $50 | $150 |
| RevenueCat | $0 | $0 | $99 | $299 |
| **Total Infrastructure** | **~$150** | **~$4,100** | **~$20,000** | **~$41,100** |

**Revenue vs. cost at 10K DAU:**
- Estimated net revenue (after 30% store fee): ~$8,800/month
- Infrastructure + AI costs: ~$4,100/month
- **Margin: ~$4,700/month (53%)**

See `09-monetization-details.md` Section 9 for full revenue projections and break-even analysis.

### 13.3 When to Set Up Each Account

| Phase | Accounts Needed |
|---|---|
| **Local development** | Supabase (local CLI, free), fal.ai (for testing), OpenAI (for testing) |
| **Staging / testing** | Add: Cloudflare R2 (free tier), Railway (dev environment) |
| **Pre-launch** | Add: Apple Developer ($99/yr), Google Play ($25), RevenueCat, PostHog, Expo (EAS) |
| **Launch** | Upgrade Supabase to Pro ($25/mo). All accounts active. |

---

## 14. Appendix: Document Index

All design documents are located in `docs/design/` and form the complete specification for Chaos Creatures.

| Document | Path | Summary |
|---|---|---|
| **00 - Game Design Master** | `docs/design/00-game-design-master.md` | Complete game design overview. Faction system, card economy, evolution system, modifier system, progression, monetization, battle system, chaos roll mechanics. The foundational document that all others expand upon. |
| **01 - Battle Mechanics** | `docs/design/01-battle-mechanics.md` | PP budget system, instability math, turn structure (9 phases), combat resolution algorithm, 7 keyword definitions and interaction matrix, 3 faction mechanics (Augment/Bond/Corruption), modifier pool structure (240 modifiers across 12 pools), 8 Order events (O1-O8), 8 Chaos events (C1-C8), triggered ability framework, spell and stabilizer design, balance validation rules. |
| **02 - Card Data Model** | `docs/design/02-card-data-model.md` | Complete TypeScript-style entity definitions. CardTemplate, CardInstance, EvolutionRecord, ModifierDefinition, ModifierInstance, TriggeredAbility, SpellEffect, Effect, EventDefinition, Avatar, Faction, Deck, Player, GameState (runtime), MatchRecord, Mission, Achievement. All enums exhaustively defined. Entity relationships. Key indexes. Data flow diagrams. |
| **03 - Prompt Templates** | `docs/design/03-prompt-templates.md` | Exact fal.ai API integration (endpoints, request/response JSON). Faction art style prefixes (exact strings). Evolution prompt templates (Order and Chaos). Visual prompt modifier tables: 30 universal (U01-U30), 28 per faction (IF01-IF28, FF01-FF28, DF01-DF28). GPT-4o Mini text generation prompts. Complete TypeScript prompt construction algorithm. Batch generation spec with CSV format. |
| **04 - Progression Economy** | `docs/design/04-progression-economy.md` | Chaos energy thresholds (15/30/50/75) and earning rates (2/win, 1/loss). Full Chaos Dust economy mathematical model with daily/weekly income tables. Quest system: 20 daily templates, 10 weekly templates with exact rewards (Easy: 20, Medium: 30, Hard: 45 Dust). Rank ladder: 17 tiers, 8-week seasons. New player economy and onboarding flow. `economy.config.json` full schema with all tunable values. Balance Dashboard specification. |
| **05 - Content Pipeline** | `docs/design/05-content-pipeline.md` | Launch content: 367 cards (360 faction + 7 universal). Batch generation pipeline with Admin Dashboard review gallery. Exact fal.ai and OpenAI API calls with request/response JSON. Cloudflare R2 upload code with AWS SDK v3. Supabase card_templates insert code. Automated QA checks. Full launch plan: 4 days, 8 batches. Total launch content API cost: ~$11.41. |
| **06 - Technical Architecture** | `docs/design/06-technical-architecture.md` | Complete Supabase database schema with SQL CREATE TABLE statements, constraints, indexes, and Row Level Security policies. Service architecture. Full game server deep dive: state machine, turn resolution algorithms (TypeScript), combat resolution algorithm (TypeScript), timer management, anti-cheat, reconnection handling. AI pipeline code (fal.ai + OpenAI calls, quality checks, fallback art). Full REST API endpoint definitions with JSON request/response examples. Full Supabase Realtime message type definitions. Cloudflare R2 upload helper. Admin Dashboard specification. Infrastructure: docker-compose.yml, repository structure, deploy.sh, CI/CD (GitHub Actions). Security: rate limiting, input validation (Zod), encryption. Performance targets. |
| **07 - UI/UX Specs** | `docs/design/07-ui-ux-specs.md` | Technology stack (Expo SDK 51+, Expo Router v3, Reanimated 3, Skia, Gesture Handler, Zustand, TanStack Query). Screen inventory with Expo Router paths. Navigation map. Battlefield screen layout with exact component specs, dimensions, colors, and animation implementations using Reanimated. Evolution screen 9-step ceremony with per-step component specs. Collection screen with filter panel. Deck builder (phone + tablet). Shop screen. Onboarding flow. Interaction patterns (tap, long-press, drag, swipe, haptics). Dark theme color palette. Settings screen. Post-match results. |
| **08 - Audio Design** | `docs/design/08-audio-design.md` | Audio pillars and technical constraints (~25 MB total, 12 channels via expo-av). Faction audio identities (Ironwright: brass/mechanical; Fey: woodwinds/nature; Demonic: war drums/chants). Adaptive music system: 4-layer stem architecture, intensity scaling by creature count, harmonic tension by instability. Complete SFX inventory: 59 files (~1.3 MB) covering battle, keywords, chaos roll, events, evolution, UI. Evolution ceremony music (3 phases, 1:10 one-shot). Priority system (SFX > Music > Ambient). Audio sourcing via Suno AI with exact prompts. |
| **09 - Monetization Details** | `docs/design/09-monetization-details.md` | IAP library decision: RevenueCat (not expo-in-app-purchases), with full reasoning, npm packages, account setup, client initialization code, entitlement hook, webhook integration. Subscription tiers: Free/$6.99/$12.99 with exact feature matrix. IAP product identifiers for all products. Step-by-step App Store Connect and Google Play Console configuration. Conversion funnel analysis with in-app nudge trigger/UI/CTA table. Battle pass design ($9.99, 50 tiers, SQL schema). Cosmetics catalog with pricing. Revenue projections at 10K-500K DAU with infrastructure costs for actual stack. Break-even analysis for solo operator. Anti-predatory design: spending caps SQL schema, parental controls, transparent odds. Regional pricing tables for 3 market tiers. PostHog events table. |
| **10 - PRD** | `docs/design/10-prd.md` | This document. |

---

## Gaps and Contradictions Identified

The following discrepancies were found across design documents. Resolutions are provided -- implement these resolutions.

### Gap 1: Card Pack Contents

The brief states "5 Commons for 100 Dust." The economy doc (`04-progression-economy.md`) and battle mechanics doc (`01-battle-mechanics.md`) state 3 Commons for 100 Dust. The UI/UX spec (`07-ui-ux-specs.md` Section 6.1) shows shop packs as "5 random cards" for 500 Dust.

**Resolution:** Implement **3 Commons for 100 Dust** as the standard pack. This is the most recent and internally consistent specification. The 500-Dust pack in the UI spec is a placeholder error -- do not implement it.

### Gap 2: Mana Cap

The battle mechanics doc and data model both specify mana cap = 10. The brief says "max 6."

**Resolution:** Implement **mana cap of 10**. The brief's "max 6" is an error.

### Gap 3: Chaos Dust Win/Loss Amounts

The brief states Win: 15, Loss: 10. The economy doc states Win: 15, Loss: 5. The economy doc's math is internally consistent with Loss: 5.

**Resolution:** Implement **Win: 15 Dust, Loss: 5 Dust**. The economy doc is the source of truth.

### Gap 4: Daily Quest Reward Range

The brief states "3 daily quests (10-25 Dust each)." The economy doc provides detailed quest templates: Easy: 20, Medium: 30, Hard: 45 Dust.

**Resolution:** Implement **20/30/45 Dust** reward tiers from the economy doc's quest template table.

### Gap 5: Shard Costs

The brief states "Uncommon=25, Rare=75, Epic=150." REQ-039 in v1.0 listed "Uncommon=30, Rare=60, Epic=120, Legendary=240." The economy doc (`04-progression-economy.md` Section 2.3) states "Uncommon=25, Rare=75, Epic=150, Legendary=240."

**Resolution:** Implement **Uncommon=25, Rare=75, Epic=150, Legendary=240 Dust** from the economy doc. Store in `economy_config` table so these are tunable without code changes.

---

## Revision Log (v1.0 to v2.0)

| Change | Old (v1.0) | New (v2.0) | Reason |
|---|---|---|---|
| **Document audience** | "Engineering, QA, Design, Operations" team | "Claude Code (primary implementer), Owner (reviewer)" | CLAUDE.md: Solo non-engineer builds with Claude Code. No engineering team. |
| **Platform** | iOS only + "Web PWA (Phaser.js)" future + "Android future" | iOS + Android via Expo EAS Build from day 1 | Expo produces both platforms from one codebase. No separate Android timeline. No Phaser.js. |
| **Subscription IAP** | "Apple In-App Purchase" (no library specified) | RevenueCat (`react-native-purchases` v8.x) wrapping Apple IAP + Google Play Billing | `09-monetization-details.md` decided RevenueCat. Handles receipt validation, webhooks, entitlement checks. |
| **Matchmaking** | "Redis sorted set keyed by MMR" (REQ-043 v1.0) | Supabase `matchmaking_queue` table with Edge Function polling every 2 seconds | No Redis in stack. CLAUDE.md specifies Supabase for everything. |
| **Scalability** | "Kubernetes HPA", "Redis game state snapshot", "pod failure recovery" (REQ-067 v1.0) | Railway auto-scaling, in-memory game state, PostgreSQL snapshots on phase transitions | Owner cannot operate Kubernetes. Railway handles scaling. |
| **AI job queue** | "BullMQ job queue" (REQ-117, REQ-069 v1.0) | `generation_jobs` Supabase table with pg_cron Edge Function processing | No BullMQ, no Redis. Simpler architecture. |
| **NSFW filter** | "AWS Rekognition or Google Cloud Vision API" (REQ-075, REQ-120 v1.0) | fal.ai built-in content moderation (returns safety scores with generation results) | No AWS/GCP services. fal.ai provides this out of the box. |
| **Secrets management** | "AWS Secrets Manager or HashiCorp Vault" (REQ-072 v1.0) | Railway environment variables + Supabase Edge Function secrets | Owner cannot configure Vault. Environment variables are the correct pattern for this stack. |
| **Analytics pipeline** | "Kafka or Kinesis" to "BigQuery or Redshift" (REQ-129 v1.0) | PostHog (single service for events, dashboards, and alerts) | CLAUDE.md specifies PostHog. No data warehouse needed at this scale. |
| **Dashboards/alerting** | "Grafana", "PagerDuty/Opsgenie" (REQ-130 v1.0) | PostHog dashboards + PostHog webhook alerts to Slack/email | Owner cannot configure Grafana/PagerDuty. PostHog has built-in dashboards. |
| **WebSocket** | "Socket.io" (Section 7.1 v1.0) | Supabase Realtime channels | CLAUDE.md specifies Supabase Realtime. |
| **Object storage** | "S3/GCS" + "CloudFront" (REQ-127, REQ-128 v1.0) | Cloudflare R2 with built-in CDN | CLAUDE.md specifies R2. |
| **Load test target** | "1,000 concurrent matches" (REQ-140 v1.0) | "200 concurrent matches" (REQ-144 v2.0) | Realistic for 1-3 Railway instances at launch. 1,000 concurrent matches would require 10-20 instances. |
| **Auth endpoints** | Custom `/auth/login` and `/auth/refresh` (REQ-083, REQ-084 v1.0) | Supabase Auth SDK (no custom endpoints) | Supabase handles auth entirely. No custom auth code needed. |
| **Added: Section 12** | Not present | Owner's Operational Workflow | Owner needs to know how to run the live game without writing code. |
| **Added: Section 13** | Not present | Accounts and Costs | Owner needs to know which accounts to create, what they cost, and when to set them up. |
| **Added: P1-011** | Not present | Admin Dashboard as P1 feature | Owner cannot manage the game without a dashboard. |
| **REQ numbering** | REQ-001 through REQ-147 | REQ-001 through REQ-151 | Renumbered to reflect added/removed/reorganized requirements. |
| **Economy values** | Some hardcoded, some inconsistent across sections | All read from `economy_config` table, explicit resolution of cross-doc discrepancies | Owner must be able to change economy values without code changes. |
| **Shard costs** | "Uncommon=30, Rare=60, Epic=120, Legendary=240" | "Uncommon=25, Rare=75, Epic=150, Legendary=240" | Aligned with `04-progression-economy.md` source of truth. |
| **Loss Dust reward** | 10 Dust (from brief) | 5 Dust (from economy doc) | Aligned with `04-progression-economy.md` source of truth. |

---

*Last updated: 2026-02-16*
*Version: 2.0 -- Complete revision for solo non-engineer owner using Claude Code.*
*All infrastructure decisions final per CLAUDE.md. All schemas, API contracts, message formats, and deployment configs are code-ready and defined in the referenced design documents.*

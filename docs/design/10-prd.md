# 10 -- Product Requirements Document (PRD)

## Chaos Creatures -- Engineering Handoff

| Field | Value |
|---|---|
| **Document Version** | 1.0 |
| **Date** | 2026-02-16 |
| **Status** | Final -- Ready for Engineering |
| **Owner** | Product Management |
| **Audience** | Engineering, QA, Design, Operations |

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
12. [Appendix: Document Index](#12-appendix-document-index)

---

## 1. Product Overview

### 1.1 What Is Chaos Creatures?

Chaos Creatures is a mobile-first collectible card game where every card's art is AI-generated and evolves through play. Players build 20-card, single-faction decks and battle in real-time PvP matches using an MTG-style combat system. The defining mechanic is the **D20 Chaos Roll**: at the start of each turn a D20 is rolled against the player's instability rating, triggering Order or Chaos events that reshape the board state. Cards accumulate energy through play and evolve through four tiers (Common, Uncommon, Rare, Epic, Legendary), with each evolution generating unique AI art, new abilities, and player-chosen modifiers.

### 1.2 Target Audience

- **Primary:** Mobile card game players aged 18-35 who enjoy strategic deckbuilding (ex-Hearthstone, Marvel Snap, Legends of Runeterra players).
- **Secondary:** Collectors and hobbyists drawn to AI-generated art and creature evolution.
- **Tertiary:** Competitive TCG players seeking a mobile alternative with meaningful strategic depth.

### 1.3 Platform

- **Primary:** iOS mobile (React Native). Target device: iPhone 11 and newer.
- **Future:** Web PWA prototype (Phaser.js). Android via React Native cross-platform build.

### 1.4 Core Differentiators

1. **AI-Generated Art:** Every card's art is created by FLUX Kontext, evolving visually at each tier. No two players' Legendary cards look the same.
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
| US-010 | As a competitive player, I want to sculpt my evolution paths precisely so I can optimize my builds. | Modifier selection presents options from correct pool (PP budget, tier bracket, attunement, faction). Duplicate prevention within a card's evolution history. At least 1 universal and 1 faction option at every evolution. |

### 2.4 Paying Subscriber

| ID | Story | Acceptance Criteria |
|---|---|---|
| US-011 | As a subscriber, I want more modifier choices during evolution so I can refine my builds. | Free: 2 options (1 universal + 1 faction). Mid ($6.99/mo): 3 options (1 universal + 2 faction). Top ($12.99/mo): 4 options (2 universal + 2 faction). All tiers draw from the same pools -- no exclusive modifiers. |
| US-012 | As a subscriber, I want higher-quality evolution art so my cards look visually distinct. | Free: FLUX Kontext Dev, 768x1024, 1 pass. Mid: FLUX Kontext Pro, 1024x1024, 1 pass, priority queue. Top: FLUX Kontext Pro, 1024x1024, 2 passes (generate + refine), priority queue. |
| US-013 | As a subscriber, I want my subscription managed through the App Store so billing is seamless. | Subscription purchased via Apple In-App Purchase. Tier changes detected via App Store Server Notifications webhook. Grace period of 7 days on lapse before enforcing card limits. |
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
| P0-002 | Card Evolution | 4-tier evolution (Common through Legendary), energy accumulation, shard consumption, 70/30 channeling roll, modifier selection, triggered ability grant, stat growth, AI art generation | `01-battle-mechanics.md` Section 1, `02-card-data-model.md` Section 20 |
| P0-003 | Card Collection | CardInstance CRUD, ownership tracking, collection browsing with filters/search, card detail view, card limit enforcement by subscription tier | `02-card-data-model.md` Sections 1-5, `07-ui-ux-specs.md` Section 5 |
| P0-004 | Deck Building | 20-card deck construction, single-faction enforcement, copy limits (max 2 per template, max 2 Legendaries at 1 copy each), avatar selection, deck validation | `02-card-data-model.md` Section 11, `07-ui-ux-specs.md` Section 5.3 |
| P0-005 | Matchmaking | Ranked and Casual queue, rank-based matching with expanding search, match creation and player assignment | `06-technical-architecture.md` Section 2.6 |
| P0-006 | Economy Core | Chaos Dust earning (win/loss rewards), spending (card packs, shards, specific cards), shard inventory, transaction logging | `04-progression-economy.md` Sections 2-3 |
| P0-007 | Authentication | Apple Sign-In, JWT session management, subscription tier verification via App Store receipts | `06-technical-architecture.md` Section 2.1 |
| P0-008 | AI Art Generation | FLUX Kontext integration for evolution art (img2img), FLUX Dev for batch base cards (txt2img), quality pipeline (NSFW filter, text-in-image detection), fallback art | `03-prompt-templates.md`, `06-technical-architecture.md` Section 4 |
| P0-009 | AI Text Generation | GPT-4o Mini for card names (2-3 candidates) and flavor text at each evolution | `03-prompt-templates.md`, `06-technical-architecture.md` Section 4.3 |
| P0-010 | Battle UI | Battlefield layout (5 slots per side), hand display, mana crystals, HP bars, chaos roll animation, event overlay, turn phase indicator, timer bar, combat animations | `07-ui-ux-specs.md` Section 3 |
| P0-011 | Core Navigation | 5-tab bottom bar (Home, Collection, Decks, Profile, Shop), battle flow (mode select, matchmaking, battle, post-match) | `07-ui-ux-specs.md` Sections 1-2 |
| P0-012 | Onboarding | Account creation, faction trial (3 loaner decks), tutorial match (scripted), first evolution (guided), faction commitment | `07-ui-ux-specs.md` Section 7, `04-progression-economy.md` Section 6 |
| P0-013 | Game Server | Server-authoritative game logic, WebSocket real-time communication, reconnection handling, anti-cheat validation | `06-technical-architecture.md` Sections 3.1-3.8 |
| P0-014 | Real-Time Match Communication | WebSocket gateway, client-to-server actions, server-to-client state broadcasts, match lifecycle | `06-technical-architecture.md` Sections 6.2-6.4 |
| P0-015 | Instability System | Player instability calculation (avatar + creature sum), clamped 1-20, recalculation on board changes, attunement state management | `01-battle-mechanics.md` Section 2 |

### 3.2 P1 -- Should Have (Target for Launch)

| ID | Feature | Description | Reference |
|---|---|---|---|
| P1-001 | Quest System | 3 daily quests (20 templates), 2 weekly quests (10 templates), quest generation algorithm, progress tracking, reward distribution, 1 free reroll/day | `04-progression-economy.md` Section 4 |
| P1-002 | Rank Ladder | 17 tiers, points system (+25/-20 same tier), rank floors, season structure (8 weeks), season reset (drop 5 divisions), end-of-season rewards | `04-progression-economy.md` Section 5 |
| P1-003 | Full Shop | Subscription tier display, card pack purchase (Dust), shard purchase (Dust), avatar unlock (Dust), subscription upgrade flow via App Store | `07-ui-ux-specs.md` Section 6, `09-monetization-details.md` Section 2 |
| P1-004 | All 3 Factions Complete | ~120 card templates per faction (90-125 creatures, 15-20 spells, 5-10 stabilizers) + 7 universal stabilizers. 240 modifier definitions. | `05-content-pipeline.md` Section 1 |
| P1-005 | Cross-Faction Unlock | 150 Dust card pack unlocks new faction permanently | `04-progression-economy.md` Section 2.3 |
| P1-006 | Post-Match Results | Victory/defeat display, chaos energy earned per card, Dust earned, quest progress, evolution-ready indicators, play again/evolve/home buttons | `07-ui-ux-specs.md` Section 15 |
| P1-007 | Subscription Management | Apple In-App Purchase integration, tier change webhooks, grace period on lapse, downgrade warnings for card limit impact | `09-monetization-details.md` Section 3 |
| P1-008 | Audio System | Faction-specific battle music, adaptive intensity system, SFX for combat/events/UI, 12-channel mixer, volume controls | `08-audio-design.md` |
| P1-009 | Achievement System | Achievement definitions, progress tracking per player, one-time rewards, achievement display on profile | `02-card-data-model.md` Sections 17 |
| P1-010 | Settings Screen | Account, Audio (master/music/SFX volume), Visuals (reduced motion, colorblind mode, animation quality, screen shake), Gameplay (auto-end turn, timer extension for casual), Notifications, Privacy | `07-ui-ux-specs.md` Section 14 |

### 3.3 P2 -- Nice to Have (Post-Launch)

| ID | Feature | Description |
|---|---|---|
| P2-001 | Practice Mode vs AI | AI opponent with difficulty-based deck selection |
| P2-002 | Battle Pass | Free track (30 tiers) + Premium track (50 tiers, $9.99/season), XP progression |
| P2-003 | Cosmetics Store | Card backs, board skins, avatar frames, card reveal animations -- all direct purchase |
| P2-004 | Friends List | Friend codes, friend requests, online status, friend profiles |
| P2-005 | Battle History / Replay | Match history for past 10 games, game log replay |
| P2-006 | Deck Import/Export | Share deck codes with other players |
| P2-007 | Landscape Battle Mode | Landscape orientation option during battle |

---

## 4. Functional Requirements

### 4.1 Battle System

**Reference:** `01-battle-mechanics.md` (full specification), `06-technical-architecture.md` Section 3

#### Game Setup

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-001 | The system shall randomly assign Player 1 (P1) and Player 2 (P2) at match start. | Assignment uses match PRNG. P1 and P2 sides are communicated to both clients via `match:start` event. |
| REQ-002 | P1 shall draw 4 cards; P2 shall draw 5 cards plus a Chaos Spark. | Chaos Spark is a 0-cost, single-use spell granting +1 temporary mana. It does not count toward deck size. It cannot be mulliganed. |
| REQ-003 | Each player shall have one mulligan opportunity (shuffle entire hand, draw same number). | Mulligan decisions are simultaneous -- neither player sees the other's choice. Both must submit mulligan decisions before the game proceeds. |
| REQ-004 | Each player shall start with 20 HP, 0 chaos motes, and an empty board. | HP cap is 20. Mana cap is 10. Board has 5 creature/stabilizer slots per player. |

#### Turn Structure

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-005 | Each turn shall execute 9 phases in fixed order: Start of Turn, Chaos Roll, Event Resolution, Draw and Gain Mana, Main Phase, Declare Attackers, Assign Blockers, Combat Resolution, End of Turn. | Phases 1-4 and 9 are automatic (no player input, no timer). Phases 5-7 are decision phases with timers. Phase 8 resolves automatically after blocker confirmation. |
| REQ-006 | The active player shall have 60 seconds for all decision phases (5-6) combined. | Timer starts at Main Phase. At 15 seconds remaining, server sends `timer:warning`. At 0 seconds, turn auto-ends with no attacks. |
| REQ-007 | The defending player shall have 60 seconds for blocker assignment (phase 7). | Independent timer. At 0 seconds, no blockers assigned -- all attackers hit face. |
| REQ-008 | P1 shall not be allowed to attack on turn 1. | Server validates and rejects attack declarations from P1 on turn 1. |

#### Chaos Roll and Events

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-009 | The system shall roll a D20 at the start of each turn and compare to the active player's instability. | Roll < instability = Chaos event. Roll > instability = Order event. Roll == instability = Nothing. RNG is seeded per match for reproducibility. |
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
| REQ-017 | Chaos mote cost shall be fixed forever and never change through evolution. | `CardInstance.current_mana_cost` always equals `CardTemplate.mana_cost`. |

#### Combat

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-018 | Combat shall use MTG-style declare attackers / assign blockers / simultaneous damage. | Each blocker blocks exactly one attacker. Each attacker can be blocked by at most one creature. Unblocked attackers deal damage to face. |
| REQ-019 | Combat damage resolution shall follow the 6-step priority order: Shield check, Deal damage, Deathtouch check, Normal death check, Piercing check, Lifesteal check. | Full algorithm defined in `06-technical-architecture.md` Section 3.3 and `01-battle-mechanics.md` Phase 8. |
| REQ-020 | Shield shall absorb ALL damage from a single source (not just 1 point), then be consumed. | A 7-ATK creature hitting a Shielded 2-HP creature deals 0 damage; Shield breaks. Lifesteal heals 0 when Shield absorbs. Piercing does not apply when Shield absorbs. |
| REQ-021 | Taunt shall enforce forced attack (Phase 6) and forced block (Phase 7). | Forced attack: active player must declare at least 1 attacker per opposing Taunt creature (up to available creatures). Forced block: Taunt creatures must be assigned as blockers if they can legally block any attacker. Flying attackers waive forced-block on ground Taunts without Reach. |
| REQ-022 | Flying creatures shall only be blockable by creatures with Flying or Reach. | Ground creatures (no Flying) can be blocked by any creature, including Flying creatures. |

#### Game End

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-023 | The game shall end when a player reaches 0 HP, surrenders (available after turn 2), disconnects for 3 consecutive turns, or times out for 3 consecutive turns. | If both players reach 0 HP simultaneously, the active player loses. Match results are persisted to MatchRecord. All deck cards receive chaos energy (2/win, 1/loss). |

### 4.2 Evolution System

**Reference:** `01-battle-mechanics.md` Section 1, `02-card-data-model.md` Section 20, `06-technical-architecture.md` Section 2.4

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-024 | A card shall be eligible for evolution when its chaos energy meets the tier threshold and the player owns a shard of the appropriate tier. | Thresholds: Common to Uncommon = 15, Uncommon to Rare = 30, Rare to Epic = 50, Epic to Legendary = 75. |
| REQ-025 | The player shall choose to channel toward Order or Chaos. A 70/30 roll determines the actual outcome. | If player channels toward Order: 70% chance of Order outcome, 30% Chaos. If player channels toward Chaos: 70% chance of Chaos outcome, 30% Order. |
| REQ-026 | Evolution shall grant exactly one modifier and one triggered ability per step. | Modifier options drawn from correct pool (PP budget from CM cost + step, tier bracket, attunement from 70/30 outcome, faction). Number of options based on subscription tier: Free=2, Mid=3, Top=4. |
| REQ-027 | Stat growth at evolution shall follow the proportional PP scaling system. | PP at tier = base_PP x tier_multiplier (Common 1.0x, Uncommon 1.5x, Rare 2.0x, Epic 2.5x, Legendary 3.0x). Per-step PP split between stats and modifier budget per `01-battle-mechanics.md` Section 1. |
| REQ-028 | Instability shall change at each evolution based on outcome. | Chaos outcome: +1 instability at every step. Order outcome: +0 at Common-to-Uncommon and Uncommon-to-Rare, -1 at Rare-to-Epic, -2 at Epic-to-Legendary. Creature instability floor is 0. |
| REQ-029 | The system shall prevent duplicate modifiers on the same card. | No ModifierDefinition can be granted twice to the same CardInstance. Within a single evolution's options, no modifier can appear twice. |
| REQ-030 | AI art generation shall use the previous tier's art as img2img reference for visual continuity. | FLUX Kontext receives the card's current art_url as input_image. Prompt constructed from faction prefix + evolution direction + player-selected prompt modifiers + evolution history context. |
| REQ-031 | The player shall select from 2-3 AI-generated name candidates for the evolved card. | GPT-4o Mini generates candidates based on faction voice, evolution history, and previous names. All candidates and the chosen name are stored in the EvolutionRecord. |
| REQ-032 | Evolution shall be an atomic transaction: shard deduction, record creation, and card update succeed or fail together. | If AI generation fails, shard and chaos energy are refunded. Fallback art (programmatic color shift + particle overlay) is applied if AI fails after 3 retries. |

### 4.3 Card Collection and Deck Building

**Reference:** `02-card-data-model.md` Sections 1-2, 11; `07-ui-ux-specs.md` Section 5

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-033 | Card collection shall enforce per-faction capacity limits based on subscription tier. | Free: 50 cards/faction. Mid: 100 cards/faction. Top: 200 cards/faction. |
| REQ-034 | Card packs shall contain 3 random Commons from the target faction with duplicate protection. | If a pack would produce a 3rd+ copy of an owned Common, it rerolls to a different Common. Own-faction pack costs 100 Dust. Cross-faction pack costs 150 Dust and permanently unlocks the faction. |
| REQ-035 | Deck validation shall enforce all construction rules before matchmaking. | Exactly 20 cards. Single faction (all cards share faction_id). Max 2 copies of any template. Max 2 Legendaries, max 1 copy of each Legendary. Avatar must match deck faction. At least 1 creature. |
| REQ-036 | Players shall have deck slot limits based on subscription tier. | Free: 3 slots. Mid: 6 slots. Top: 10 slots. Invalid (work-in-progress) decks can be saved but not used in matchmaking. |

### 4.4 Economy

**Reference:** `04-progression-economy.md` Sections 2-3

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-037 | Players shall earn Chaos Dust from completed matches. | Win: 15 Dust. Loss: 5 Dust. Awarded at match end. |
| REQ-038 | Subscriber quest Dust bonuses shall apply to all quest rewards. | Mid tier: +50% quest Dust. Top tier: +100% quest Dust. Bonuses apply to daily and weekly quests. |
| REQ-039 | Shard costs shall be: Uncommon 30, Rare 60, Epic 120, Legendary 240 Chaos Dust. | Shard purchases are deducted atomically from player's Chaos Dust balance with row-level locking. |
| REQ-040 | All currency operations shall use PostgreSQL transactions with row-level locking to prevent double-spend. | Every Dust deduction is atomic with the corresponding purchase (pack opening, shard purchase, avatar unlock). All transactions logged to ShardTransaction table for audit. |
| REQ-041 | Monthly subscription benefits shall be granted automatically. | Mid: +3 Commons/month to primary faction. Top: +5 Commons/month to any unlocked faction + 1 free Legendary Shard/month. Granted on billing anniversary date. |

### 4.5 Matchmaking

**Reference:** `06-technical-architecture.md` Section 2.6

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-042 | Ranked matchmaking shall match within +/- 2 rank tiers initially, expanding over time. | At 10s, expand by 1 tier per 5 additional seconds. At 30s, match within 5 tiers. At 45s, match with any available player. |
| REQ-043 | Casual matchmaking shall use hidden MMR. | Players are stored in Redis sorted set keyed by MMR. Pairs with closest MMR matched first. |
| REQ-044 | Matchmaking shall validate the player's deck before entering queue. | Deck must pass all validation rules (REQ-035). Invalid decks are rejected with specific error messages. |
| REQ-045 | Queue entries shall expire after 60 seconds. | Player is notified and returned to mode selection on expiry. |

### 4.6 Onboarding

**Reference:** `07-ui-ux-specs.md` Section 7, `04-progression-economy.md` Section 6

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-046 | New players shall receive 3 premade loaner decks (one per faction) during trial phase. | Loaner decks are 20 Commons each, fixed lists, cannot be evolved or modified. Player must play at least 1 match. |
| REQ-047 | After trial phase, player selects one faction. That trial deck becomes their real collection. | 20 Commons become owned CardInstances. Other trial cards are removed. Player receives starter rewards: 200 Dust, 3 Uncommon Shards, 1 Rare Shard, 1 Legendary Shard, starter avatar. |
| REQ-048 | Tutorial match shall use scripted rolls and a guided AI opponent. | Forced actions guide player through each phase. Skip button always visible. No turn timer during tutorial. |

### 4.7 User Interface

**Reference:** `07-ui-ux-specs.md` (full specification)

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-049 | All interactive elements shall meet the 44x44pt minimum tap target (Apple HIG). | Small visual icons (mana crystals, keyword icons at 20-24pt) use invisible padding to reach 44x44pt tap area. |
| REQ-050 | The battlefield shall display 5 creature slots per side, HP bars, mana crystals, instability values, timer bar, and a horizontally scrollable hand area. | Layout per `07-ui-ux-specs.md` Section 3.1. Board slot dimensions ~60x85pt on phone. Hand card dimensions 90x130pt. |
| REQ-051 | The evolution flow shall follow the 9-step ceremony. | Steps: Card Presentation, Channel Selection, Evolution Animation (looping while AI generates), Art Reveal, Name Selection, Ability Reveal, Modifier Selection, Flavor Text Reveal, Final Presentation and Confirm. Minimum animation duration 2.5s even if AI finishes faster. |
| REQ-052 | The bottom tab bar shall be visible on all screens except during battle. | 5 tabs: Home, Collection, Decks, Profile, Shop. Battle is full-screen immersive. |
| REQ-053 | Blocker assignment shall use drag interaction. | Drag defending creature onto attacking creature. Valid targets glow green. Invalid zones flash red and creature snaps back. Connection line drawn between assigned blocker and attacker. |
| REQ-054 | The app shall use portrait orientation for all screens (MVP). | Landscape battle mode deferred to post-launch. Evolution screen forced portrait. |

### 4.8 Factions and Content

**Reference:** `01-battle-mechanics.md` Section 5, `05-content-pipeline.md`

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-055 | Each faction shall have an exclusive mechanic referenced by its faction modifiers. | Ironwright: Augment (stacking self-referencing effects). Fey Courts: Bond (cross-creature synergies). Demonic Kingdoms: Corruption (self-damage for power). |
| REQ-056 | Faction modifiers shall always reference their exclusive mechanic keyword. | A modifier in the Ironwright pool that does not reference Augment count or Augment-related conditions is invalid. Universal modifiers shall not reference any faction mechanic. |
| REQ-057 | Each faction shall have 2 avatars at launch (1 starter + 1 unlockable). | Avatars have instability modifiers: Order-leaning (-5 to -6), Balanced (-3 to -4), Chaos-leaning (-1 to -2). |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| REQ | Requirement | Target | Measurement |
|---|---|---|---|
| REQ-058 | Turn resolution latency | < 100ms server-side (action received to state broadcast) | Game server instrumentation |
| REQ-059 | REST API p50/p95/p99 | < 100ms / < 200ms / < 500ms | API Gateway metrics |
| REQ-060 | WebSocket message delivery | < 50ms from server to client (after processing) | Client round-trip measurement |
| REQ-061 | AI image generation end-to-end | < 30s (queue + generation + quality check + upload) | AI pipeline instrumentation |
| REQ-062 | AI text generation end-to-end | < 5s | AI pipeline instrumentation |
| REQ-063 | Matchmaking queue time | < 15s at launch; < 30s off-peak | Matchmaking service metrics |
| REQ-064 | Client frame rate | 30fps minimum on iPhone 11 or equivalent 3-year-old device | Client profiling |
| REQ-065 | Client cold start | < 5s to home screen | Client instrumentation |
| REQ-066 | Client match load | < 3s from match found to board rendered | Client instrumentation |

### 5.2 Scalability

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-067 | Game servers shall handle 50-100 concurrent matches per pod and scale horizontally. | Kubernetes HPA scales on WebSocket connection count and CPU. Matches pinned to pods via sticky sessions. Pod failure recoverable from Redis game state snapshot. |
| REQ-068 | System shall support 5,000 concurrent players at launch with capacity to scale to 50,000. | 10-20 game server pods at launch. Infrastructure defined in `06-technical-architecture.md` Section 7. |
| REQ-069 | AI worker pods shall auto-scale based on BullMQ queue depth. | Scale trigger: > 50 pending jobs. Min 2 pods, max 20 pods for image workers. |

### 5.3 Security

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-070 | All game logic shall be server-authoritative. | Client sends action intents only. Server validates legality, applies state changes, broadcasts results. Client never computes game state, rolls dice, or resolves combat. Match PRNG seed is server-side only. Opponent hand and deck order never sent to client. |
| REQ-071 | All network communication shall use TLS 1.3. | HTTPS for REST, WSS for WebSocket. Certificate pinning on mobile client. |
| REQ-072 | All data at rest shall be encrypted. | PostgreSQL: AES-256 encryption. S3: SSE-S3 or GCS default encryption. API keys stored in external secrets manager (AWS Secrets Manager or HashiCorp Vault). |
| REQ-073 | Rate limiting shall be enforced at the API Gateway. | Auth: 10 req/min. General API: 100 req/min. Evolution start: tier-based (5/15/30 per 24h). Card pack purchase: 20/hour. Matchmaking queue: 5/min. WebSocket: 30 messages/10s. Returns HTTP 429 with Retry-After. |
| REQ-074 | Player-selected prompt modifiers shall be drawn from a curated whitelist only. | Players never type free-form text that reaches AI models. Prompt construction is entirely server-side from validated components. |
| REQ-075 | All generated images shall pass through NSFW filtering before storage. | AWS Rekognition or Google Cloud Vision API. Reject if confidence > 80% on any unsafe category. Retry with modified prompt up to 3 times, then apply programmatic fallback art. |

### 5.4 Accessibility

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-076 | The app shall support 3 colorblind modes: Deuteranopia, Protanopia, Tritanopia. | Order/Chaos indicators use icons + patterns in addition to color. Attunement: Order = blue circle, Chaos = red triangle, Neutral = gray square. HP bars always show numeric values. |
| REQ-077 | The app shall support a Reduced Motion mode. | D20 roll: instant result. Card animations: fade instead of slide. Damage numbers: static display. Particle effects: disabled. Screen shake: disabled. |
| REQ-078 | The app shall support system font size preferences (iOS Dynamic Type). | Scalable: card names, descriptions, labels, tooltips. Fixed-size: ATK/HP numbers on cards, mana cost icons. Long text truncated with ellipsis or made scrollable. |
| REQ-079 | All critical battle interactions shall be reachable with thumb-only input in portrait mode. | Hand area, End Turn button, mana display in bottom zone. No essential controls in top corners (opponent info is read-only). |

### 5.5 Platform Support

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-080 | iOS minimum version shall be iOS 16+. | Target device: iPhone 11 and newer. Safe area insets respected for notch/Dynamic Island. |
| REQ-081 | The app shall support both phone and tablet layouts. | Phone: 3-column collection grid, stacked deck builder. Tablet: 5-6 column grid, side-by-side deck builder. Bottom tab bar shows icons + labels on tablet. |

### 5.6 Localization

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-082 | The app shall launch in English with architecture supporting future localization. | All user-facing strings externalized. Date/time formatting locale-aware. Currency display uses platform locale. Regional pricing for subscriptions via App Store pricing tiers. |

---

## 6. Data Requirements

**Reference:** `02-card-data-model.md` (complete entity definitions), `06-technical-architecture.md` Section 5

### 6.1 Key Entities

| Entity | Storage | Description |
|---|---|---|
| CardTemplate | PostgreSQL (immutable after approval) | Base card definition: name, faction, type, stats, keywords, art prompt, art URL. ~360 rows at launch. |
| CardInstance | PostgreSQL (JSONB for evolution_history, modifiers, triggered_abilities) | Player-owned card: tier, current stats, instability, chaos energy, modifiers, abilities, art URL. High write frequency on evolution; moderate on energy gain. |
| ModifierDefinition | PostgreSQL (global content) | Modifier pool entry: effects, attunement, PP cost, faction. 240 rows at launch. |
| Deck / DeckEntry | PostgreSQL | Player's deck: 20 card entries, faction, avatar. Validated on save and queue entry. |
| Player | PostgreSQL (row-level locking for currency) | Account, subscription tier, Chaos Dust balance, shard inventory, rank, settings, faction mastery. |
| GameState | Redis (Hash, keyed by match_id, TTL 2h) | Active match state: board, hands, decks, timers, combat state. Persisted to Redis on every state mutation. |
| MatchRecord | PostgreSQL | Completed match: players, result, duration, turns, full compressed game log. |
| Mission | PostgreSQL (TTL-indexed) | Active quests: type, target, progress, reward, expiry. |
| EventDefinition | PostgreSQL (global content) | 16 rows (8 Order + 8 Chaos). Static game data. |
| Avatar | PostgreSQL (global content) | 6 rows at launch (2 per faction). |
| Faction | PostgreSQL (global content) | 3 rows at launch. |

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
- **Trade-off:** If a ModifierDefinition is rebalanced post-launch, a migration must update all affected CardInstance JSONB.

### 6.4 Key Indexes

| Query Pattern | Index |
|---|---|
| Player's cards in a faction | `card_instances(owner_id, template_id)` + join to `card_templates(faction_id)` |
| Evolution-ready cards | `card_instances(owner_id, tier, chaos_energy)` |
| Cards in a deck | `deck_entries(deck_id)` then `card_instances(id)` |
| Match history | `match_records(player_1_id, started_at DESC)`, `match_records(player_2_id, started_at DESC)` |
| Active missions | `missions(player_id, is_completed, expires_at)` |
| Leaderboard | `players(season_rank_points DESC)` |

### 6.5 Storage Requirements

| Store | Launch Estimate | 1-Year Estimate |
|---|---|---|
| PostgreSQL | ~5 GB | ~50 GB |
| Redis | ~2 GB (active matches + sessions + queues) | ~5 GB |
| S3/GCS (card art) | ~5 GB (base art for ~360 templates) | ~2 TB (evolution art for all players) |

### 6.6 Data Retention

| Data Type | Retention |
|---|---|
| Player accounts | Indefinite (until account deletion) |
| CardInstances | Indefinite |
| MatchRecords | 12 months (full_log compressed). Summary data indefinite. |
| Mission records | 30 days after expiry/completion |
| Session tokens (Redis) | 24-hour TTL |
| Game state (Redis) | 2-hour TTL (match timeout) |
| Evolution art (S3) | Indefinite. Move to Infrequent Access after 1 year. |
| Analytics events | 24 months in data warehouse |

---

## 7. API Requirements

**Reference:** `06-technical-architecture.md` Section 6

### 7.1 Protocol Summary

| Protocol | Use Case | Auth |
|---|---|---|
| HTTPS REST | Collection, economy, deck management, evolution, profile, matchmaking | JWT Bearer token |
| WebSocket (Socket.io) | Real-time match communication | JWT on connection handshake |

### 7.2 REST API Contracts

#### Authentication

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-083 | POST | `/auth/login` | Sign in with Apple. Request: `{apple_id_token}`. Response: `{access_token, refresh_token, player}`. |
| REQ-084 | POST | `/auth/refresh` | Refresh access token. Request: `{refresh_token}`. Response: `{access_token}`. |

#### Collection

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-085 | GET | `/collection/cards` | List owned cards with pagination, faction filter, tier filter, sort. Response: `{cards: CardInstance[], total, page}`. |
| REQ-086 | GET | `/collection/cards/{id}` | Get full card detail including evolution history, modifiers, abilities. |

#### Decks

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-087 | POST | `/decks` | Create deck. Request: `{name, faction_id, avatar_id}`. Response: `{deck}`. |
| REQ-088 | PUT | `/decks/{id}` | Update deck. Request: `{name?, avatar_id?, card_entries?}`. Response: `{deck, validation_errors}`. |
| REQ-089 | POST | `/decks/{id}/validate` | Validate deck against all construction rules. Response: `{is_valid, errors: string[]}`. |

#### Economy

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-090 | GET | `/economy/balance` | Get Chaos Dust and shard balances. |
| REQ-091 | POST | `/economy/purchase/card-pack` | Buy card pack. Request: `{faction_id}`. Response: `{cards: CardInstance[], dust_spent}`. |
| REQ-092 | POST | `/economy/purchase/shard` | Buy shard. Request: `{shard_tier}`. Response: `{shard_tier, dust_spent}`. |
| REQ-093 | GET | `/economy/missions` | Get active daily and weekly missions with progress. |

#### Evolution

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-094 | POST | `/evolution/check` | Check eligibility. Response includes chaos energy, threshold, shard availability, shard quality, available prompt modifiers. |
| REQ-095 | POST | `/evolution/start` | Begin evolution. Request: `{card_instance_id, prompt_modifiers, channel_direction}`. Response: `{evolution_id, actual_outcome, modifier_options, ability, stat_changes, instability_change}`. |
| REQ-096 | GET | `/evolution/{id}/status` | Poll generation status. Response: `{status: PENDING|IMAGE_READY|TEXT_READY|COMPLETE|FAILED, art_url?, name_candidates?, flavor_text?}`. |
| REQ-097 | POST | `/evolution/{id}/confirm` | Confirm choices. Request: `{modifier_chosen_id, name_chosen}`. Response: `{card: CardInstance}`. |

#### Matchmaking

| REQ | Method | Endpoint | Description |
|---|---|---|---|
| REQ-098 | POST | `/matchmaking/queue` | Enter queue. Request: `{deck_id, mode: RANKED|CASUAL|PRACTICE}`. Validates deck before queuing. |
| REQ-099 | DELETE | `/matchmaking/queue` | Leave queue. |

### 7.3 WebSocket Events

#### Client-to-Server

| REQ | Event | Payload | Phase |
|---|---|---|---|
| REQ-100 | `match:join` | `{match_id, access_token}` | Connection |
| REQ-101 | `match:mulligan` | `{mulligan: bool}` | GAME_SETUP |
| REQ-102 | `action:play_card` | `{card_id, target_slot?, target_id?}` | MAIN_PHASE |
| REQ-103 | `action:declare_attackers` | `{attacker_ids: string[]}` | DECLARE_ATTACKERS |
| REQ-104 | `action:assign_blockers` | `{assignments: [{blocker_id, attacker_id}]}` | ASSIGN_BLOCKERS |
| REQ-105 | `action:surrender` | `{}` | Any (after turn 2) |

#### Server-to-Client (Key Events)

| REQ | Event | When |
|---|---|---|
| REQ-106 | `match:state` | On connect/reconnect -- full state snapshot (filtered to hide opponent hand/deck) |
| REQ-107 | `match:start` | Match begins -- player side, opponent info, first player |
| REQ-108 | `turn:chaos_roll` | Phase 2 -- roll value, instability, result (ORDER/CHAOS/NOTHING) |
| REQ-109 | `turn:event` | Phase 3 -- event ID, name, effect description |
| REQ-110 | `combat:resolution` | Phase 8 -- all combat pairs with damage, deaths, piercing, lifesteal details |
| REQ-111 | `match:end` | Game over -- winner, end reason, rewards, card XP gained |
| REQ-112 | `timer:warning` | 15 seconds remaining on decision timer |
| REQ-113 | `opponent:disconnected` / `opponent:reconnected` | Connection state changes |

### 7.4 Server Validation on Every Action

The server shall validate on every client action (REQ-070 expansion):

- Action is legal in the current phase
- It is the correct player's turn
- Action is within the timer window
- Card is in the player's hand and they have enough mana
- Board slot is empty (for placement)
- Blocker assignments satisfy Taunt rules and Flying/Reach rules
- No impossible targeting

---

## 8. AI Integration Requirements

**Reference:** `03-prompt-templates.md`, `06-technical-architecture.md` Section 4

### 8.1 Image Generation

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-114 | Base card art shall be generated via FLUX Dev (txt2img) during the batch pipeline at 1024x1024 resolution. | Prompt structure: `[FACTION_PREFIX] + [CREATURE_TYPE] + [VISUAL_DETAILS] + [FRAMING] + [QUALITY_TAGS]`. |
| REQ-115 | Evolution art shall be generated via FLUX Kontext (img2img) using the previous tier's art as reference. | Input: current card art. Prompt constructed server-side from faction prefix, evolution direction (Order = subtle refinement / Chaos = dramatic transformation), player-selected prompt modifiers, and evolution history context. |
| REQ-116 | Shard quality shall determine AI model variant, resolution, and number of passes. | Free (PLANAR): FLUX Kontext Dev, 768x1024, 1 pass. Mid (REFINED): FLUX Kontext Pro, 1024x1024, 1 pass, priority queue. Top (PRISMATIC): FLUX Kontext Pro, 1024x1024, 2 passes (generate + refine), priority queue. |
| REQ-117 | AI generation shall be asynchronous via BullMQ job queue with priority processing for subscribers. | Priority queue for REFINED/PRISMATIC shards. Standard queue for PLANAR shards. Batch pipeline queue (lowest priority) for pre-launch base cards. |

### 8.2 Text Generation

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-118 | Card names and flavor text shall be generated by GPT-4o Mini. | Temperature 0.8, max 150 tokens. Generate 2-3 name candidates (1-4 words each) and 1 flavor text (1-2 sentences). Faction voice and name voice instructions provided in system prompt. |
| REQ-119 | If text parsing fails, the system shall retry with JSON mode. | Max 2 retries. On final failure, use template name with tier suffix (e.g., "Ashscale Wyvern II"). |

### 8.3 Quality Pipeline

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-120 | Every generated image shall pass NSFW filtering before storage. | AWS Rekognition or Google Cloud Vision API. Threshold: reject if confidence > 80% on any unsafe category. |
| REQ-121 | Every generated image shall pass text-in-image detection. | Run OCR detection. If significant text found, retry with "no text, no letters, no words" appended to prompt. |
| REQ-122 | After 3 generation failures, the system shall apply programmatic fallback art. | Fallback: server-side image processing (Sharp or similar). Order: blue/gold color grade + crystalline overlay. Chaos: red/purple color grade + fracture overlay. Queue background retry for full AI art. |
| REQ-123 | Fallback art shall be visually acceptable as a placeholder until full AI art is generated. | Fallback applied to existing card art (color shift + particle overlay). Player notified via push notification when full AI art is ready. |

### 8.4 Cost Management

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-124 | Per-user daily evolution caps shall be enforced. | Free: 5 evolutions/day. Mid: 15/day. Top: 30/day. Enforced via Redis counter with 24h TTL. |
| REQ-125 | Every AI generation call shall log cost data for tracking. | Logged: model used, resolution, actual cost, player ID, card instance ID. Feeds analytics pipeline for cost monitoring and per-user attribution. |
| REQ-126 | Target AI cost per evolution: Free ~$0.02, Mid ~$0.04, Top ~$0.08. | Monthly AI cost budget: ~$0.25/free user, ~$1.00/mid user, ~$1.70/top user. Total monthly AI budget at 10K DAU: ~$3,900. |

### 8.5 Art Storage

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-127 | Card art shall be stored in S3/GCS with a structured path: `base/{faction_id}/{template_id}.png` for base art, `evolution/{player_id}/{card_instance_id}/step-{1-4}.png` for evolution art. | CDN (CloudFront) serves all art. Cache TTL: 1 year for base art (immutable), 1 hour for evolution art (may be replaced by retry). Client caches images locally with art_url as cache key. |
| REQ-128 | CDN shall serve WebP format to supporting clients with on-the-fly resizing. | Thumbnail vs. full card view served at appropriate resolutions. CloudFront Functions or image resizing Lambda. |

---

## 9. Analytics Requirements

**Reference:** `06-technical-architecture.md` Section 5.5, `04-progression-economy.md` Section 7.6, `09-monetization-details.md` Section 10

### 9.1 Event Stream Architecture

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-129 | All analytics events shall flow through a streaming pipeline (Kafka or Kinesis) to a data warehouse (BigQuery or Redshift). | Events include: match events, economy events, evolution events, engagement events, subscription events. |

### 9.2 Key Metrics

#### Engagement

| Metric | Definition | Target |
|---|---|---|
| DAU / MAU | Daily and monthly active users | Track growth trajectory. DAU target: 10K at launch month, 100K at month 12. |
| D1 / D7 / D30 Retention | % of new users returning after 1/7/30 days | D1: 40-50%. D7: 20-30%. D30: 12-18%. |
| Average Session Length | Time from app open to close | 12-18 minutes |
| Sessions per DAU | Average sessions per daily active user | 2-3 |
| Match Completion Rate | % of matches that end via HP_ZERO or SURRENDER (not disconnect/timeout) | > 90% |

#### Progression

| Metric | Definition | Target |
|---|---|---|
| Evolution Rate | Evolutions per engaged player per week | 1-2 |
| Time to First Legendary | Days from account creation to first Legendary evolution | Track by player type. Free Regular ~6 weeks, Top Regular ~3 weeks. |
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
| LTV | Average total revenue per subscriber | Mid: $80+. Top: $180+. |

#### AI Pipeline

| Metric | Definition | Alert Threshold |
|---|---|---|
| Generation Latency | Time from job enqueue to completion | > 30s for images triggers alert |
| Generation Success Rate | % of AI generation jobs that complete without fallback | < 90% triggers critical alert |
| Cost per Generation | Average cost per AI call by model tier | Track against budget ($0.02/$0.04/$0.08) |
| Queue Depth | Pending jobs in BullMQ | > 500 triggers warning |

### 9.3 Dashboards

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-130 | The system shall provide operational dashboards for: Game Health (active matches, completion rate, duration), Server Performance (API latency, error rate, pod utilization), AI Pipeline (queue depth, latency, success rate, cost), Economy (Dust earned/spent, shard consumption, evolution rate), Player Health (DAU/MAU, retention, session metrics). | Dashboards built in Grafana or equivalent. Alerting via PagerDuty/Opsgenie for critical thresholds per `06-technical-architecture.md` Section 7.5. |

---

## 10. Launch Criteria

### 10.1 Minimum Content

| REQ | Category | Minimum | Target |
|---|---|---|---|
| REQ-131 | Card templates | 300 total (100/faction) | 360 total (120/faction) |
| REQ-132 | Universal stabilizers | 7 | 7 |
| REQ-133 | Modifier definitions | 240 (96 universal + 48 per faction) | 240 |
| REQ-134 | Order events | 8 | 8 |
| REQ-135 | Chaos events | 8 | 8 |
| REQ-136 | Avatars | 6 (2 per faction) | 6 |
| REQ-137 | Starter decks | 3 (1 per faction, 20 cards each) | 3 |

### 10.2 Feature Completeness

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-138 | All P0 features shall be fully implemented and tested. | Every P0 feature (P0-001 through P0-015) passes acceptance criteria. No known critical or high-severity bugs in P0 features. |
| REQ-139 | All P1 features shall be implemented or have approved deferral plans. | P1 features not ready for launch have documented post-launch delivery timelines. |

### 10.3 Performance Benchmarks

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-140 | Load testing shall simulate 1,000 concurrent matches without degradation. | Turn resolution < 100ms. API p95 < 200ms. No match state corruption. WebSocket message delivery < 50ms. |
| REQ-141 | Client performance shall be validated on iPhone 11 (minimum target device). | 30fps during battle with 10 creatures on board. Cold start < 5s. Match load < 3s. No memory leaks over 30-minute session. |

### 10.4 QA Requirements

| REQ | Requirement | Acceptance Criteria |
|---|---|---|
| REQ-142 | Full combat resolution test suite shall cover all keyword interaction pairs. | Per `01-battle-mechanics.md` Section 4 keyword interaction matrix: Shield/Piercing, Shield/Deathtouch, Shield/Lifesteal, Flying/Taunt, Flying/Reach, Deathtouch/Piercing, Deathtouch/Lifesteal, Taunt forced-attack and forced-block scenarios. |
| REQ-143 | Evolution flow shall be tested end-to-end for every tier transition and both outcomes. | 4 tier transitions x 2 outcomes = 8 paths. Each path verifies: shard deduction, stat changes, instability change, modifier pool correctness, ability generation, AI art generation (or fallback), EvolutionRecord creation, CardInstance update. |
| REQ-144 | Economy test suite shall validate all currency operations are transactionally safe. | Double-spend prevention under concurrent requests. Shard deduction atomic with evolution. Dust deduction atomic with pack opening. Negative balance prevention. |
| REQ-145 | Reconnection shall restore full game state within 3 seconds. | Player reconnects, receives state snapshot, rebuilds board, resumes play. Timer continues from where it was. Opponent sees "Opponent reconnected." Test with network interruption during each of the 9 phases. |
| REQ-146 | Deck validation shall reject all invalid configurations. | Test: 19 cards, 21 cards, mixed factions, 3 copies of a template, 3 Legendaries, 2 copies of one Legendary, wrong-faction avatar. Each must produce a specific error message. |
| REQ-147 | Balance validation suite shall run against all card templates. | Automated checks per `01-battle-mechanics.md` Section 14: PP budget validation (tolerance +/- 1), instability/stat profile consistency, keyword limits, modifier PP cost matching. |

---

## 11. Dependencies and Risks

### 11.1 External Dependencies

| Dependency | Service | Risk | Mitigation |
|---|---|---|---|
| AI Image Generation | FLUX Kontext via Replicate or Fal.ai | API downtime, rate limits, cost increases, model deprecation | Fallback art pipeline (REQ-122). Dual provider capability (Replicate + Fal.ai). Pre-generated base art decoupled from runtime. Contract for rate/pricing stability. |
| AI Text Generation | OpenAI GPT-4o Mini | API downtime, model changes | Fallback to template name + tier suffix. Text generation is non-blocking (evolution can complete without text). Low cost ($0.15/1M tokens) reduces financial risk. |
| Authentication | Apple Sign-In | Apple API changes, review delays | Standard OAuth flow. Minimal custom logic on Apple side. |
| Subscription Billing | Apple App Store In-App Purchase | App Store policy changes, commission rate changes (currently 15-30%) | Single billing integration point. Monitor Apple policy updates. |
| Content Delivery | CloudFront CDN | Outage, cache invalidation issues | Multi-region edge caching. S3 origin is always available as fallback. Client-side image caching (200MB LRU). |

### 11.2 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **AI generation latency spikes** | Medium | Medium -- evolution ceremony stalls | Evolution animation loops gracefully while waiting. Minimum 2.5s animation masks normal latency. "Channeling energy..." text appears after 3s. Timeout at 30s triggers refund. |
| **AI art quality inconsistency** | Medium | Medium -- player dissatisfaction with evolution art | Quality pipeline (NSFW + text-in-image detection). Prompt engineering with curated modifiers. Evolution art uses img2img (preserves visual DNA). Human QA review of base card art in batch pipeline. |
| **Mobile performance on older devices** | Medium | High -- poor retention | Animation quality tiered by device capability (`card_animation_quality`: FULL / REDUCED / MINIMAL). Reduced Motion mode. 200MB local art cache. Delta-based WebSocket updates. |
| **Game balance issues at launch** | High | Medium -- player frustration | Feature flags for live balance changes without deploy. Automated balance validation suite. Telemetry on win rates by faction, card, modifier. Balance patches every 2 months. |
| **Content volume insufficient for launch** | Medium | High -- repetitive experience | Batch generation pipeline targets 360 cards. Lower bound of 300 cards (100/faction) still provides viable deckbuilding. 240 modifiers provide evolution variety. |
| **WebSocket connection reliability on mobile** | Medium | Medium -- disconnects during matches | Socket.io handles reconnection and fallback transports. Game state persisted to Redis on every mutation. 3-turn grace period before auto-forfeit. Full state snapshot on reconnect. |
| **Economy inflation/deflation** | Medium | Medium -- progression feels wrong | Analytics dashboard tracks Dust bank distribution, quest completion, evolution rate. Tunable via server config: Dust earn rates, shard costs, quest rewards. See red flags in Section 9.2. |

### 11.3 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Low conversion rate (< 4%)** | Medium | High -- unsustainable unit economics | A/B test subscription pricing. First-month discount offers. Evolution-moment upsells. Collection limit as natural conversion trigger at 50 cards. |
| **High subscriber churn (> 8%)** | Medium | Medium -- revenue instability | Grace period on lapse. Downgrade warnings showing card deletion impact. Annual subscription discount (2 months free). Win-back offers. |
| **AI API cost increases** | Low | High -- margin compression | Dual provider (Replicate + Fal.ai). Self-hosted model capability as fallback (FLUX is open-source). Per-user daily evolution caps limit worst-case cost exposure. |
| **App Store rejection** | Low | High -- launch delay | Follow Apple HIG. No loot boxes. Transparent odds disclosure. Parental controls. Anti-predatory design (spending caps, no dark patterns). |

---

## 12. Appendix: Document Index

All design documents are located in `docs/design/` and form the complete specification for Chaos Creatures.

| Document | Path | Summary |
|---|---|---|
| **00 - Game Design Master** | `docs/design/00-game-design-master.md` | Complete game design overview. All systems, UI wireframes, AI integration, economy, factions. The foundational document that all others expand upon. |
| **01 - Battle Mechanics** | `docs/design/01-battle-mechanics.md` | PP budget system, instability math, turn structure (9 phases), combat resolution algorithm, 7 keyword definitions and interaction matrix, 3 faction mechanics (Augment/Bond/Corruption), modifier pool structure (240 modifiers), 8 Order events, 8 Chaos events, triggered ability framework, spell and stabilizer design, starter card stat ranges, balance validation rules. |
| **02 - Card Data Model** | `docs/design/02-card-data-model.md` | Complete entity definitions with TypeScript-style schemas. CardTemplate, CardInstance, EvolutionRecord, ModifierDefinition, ModifierInstance, TriggeredAbility, SpellEffect, Effect, EventDefinition, Avatar, Faction, Deck, Player, GameState (runtime), MatchRecord, Mission, Achievement. All enums. Entity relationships. Key indexes. Data flow diagrams. |
| **03 - Prompt Templates** | `docs/design/03-prompt-templates.md` | FLUX Kontext and FLUX Dev prompt construction. Faction art style prefixes. Evolution direction modifiers (Order = refinement, Chaos = mutation). Player-selectable prompt modifier lists by subscription tier. GPT-4o Mini text generation prompts. Quality guardrails. |
| **04 - Progression Economy** | `docs/design/04-progression-economy.md` | Chaos energy thresholds and earning rates. Chaos Dust economy (earning, spending, daily income by player type). Shard economy. Quest system (20 daily templates, 10 weekly templates). Rank ladder (17 tiers, 8-week seasons). New player economy (onboarding flow, first week milestones, starter rewards). Long-term economy health analysis. |
| **05 - Content Pipeline** | `docs/design/05-content-pipeline.md` | Launch content targets (~360 card templates). Batch generation tooling (FLUX Dev + GPT-4o Mini). Automated QA (NSFW filter, style consistency, stat validation). Human QA review workflow. Content distribution requirements (instability spread, CM cost curve). Seasonal release strategy (6-8 week seasons). |
| **06 - Technical Architecture** | `docs/design/06-technical-architecture.md` | System architecture (React Native, Node.js/TypeScript, PostgreSQL, Redis, S3, BullMQ). Service design (Auth, Game Server, Collection, Evolution, Economy, Matchmaking, AI Generation). Game server deep dive (state machine, turn resolution algorithms, combat resolution algorithm, event system, Taunt enforcement, timer management, anti-cheat, reconnection). AI pipeline (FLUX Kontext integration, GPT-4o Mini integration, quality checks, cost management, storage). Full REST API and WebSocket event contracts. Infrastructure (Kubernetes, auto-scaling, CI/CD, monitoring, alerting). Security (server-authoritative design, rate limiting, encryption). Performance targets. |
| **07 - UI/UX Specs** | `docs/design/07-ui-ux-specs.md` | Screen inventory (15+ screens). Navigation map. Battlefield layout (component specs, animations, indicators). Evolution screen (9-step ceremony with detailed specs per step). Collection and deck builder (layout, filters, validation UI). Shop (subscription tiers, card packs, shards, cosmetics). Onboarding flow (tutorial match, first evolution, deck builder tour). Interaction patterns (tap, long-press, drag, swipe, haptics). Responsive layouts (phone vs tablet). Animation timing specs. Error states. Accessibility (colorblind modes, reduced motion, font scaling). Dark theme color palette. Settings screen. Post-match results. Asset naming conventions. |
| **08 - Audio Design** | `docs/design/08-audio-design.md` | Audio pillars and technical constraints (~25 MB total, 12 channels). Faction audio identities (Ironwright: brass/mechanical; Fey: woodwinds/nature; Demonic: war drums/chants). Adaptive music system (intensity scales with board state and instability). SFX catalog (combat, events, UI). Evolution ceremony audio. Priority system (SFX > Music > Ambient). |
| **09 - Monetization Details** | `docs/design/09-monetization-details.md` | Monetization philosophy (no real money on cards). Subscription tier pricing (Free/$6.99/$12.99). Detailed feature matrix. Conversion funnel analysis. Battle pass design (30-tier free track, 50-tier premium at $9.99). Cosmetics catalog and pricing. Revenue projections at 10K-500K DAU. AI cost offset analysis. Break-even at ~200K DAU. Anti-predatory design (no loot boxes, spending caps, parental controls, transparent odds). Regional pricing strategy. |
| **10 - PRD** | `docs/design/10-prd.md` | This document. |

---

## Gaps and Contradictions Identified

The following discrepancies were found across design documents and require resolution before implementation:

### Gap 1: Card Pack Contents Discrepancy

The brief (`_prd-brief.md`) states card packs contain "5 Commons for 100 Dust." The progression economy doc (`04-progression-economy.md` Section 2.3) states packs contain "3 random Commons from your faction's pool" for 100 Dust. The battle mechanics doc (`01-battle-mechanics.md` Section 13) also states 3 Commons. The UI/UX spec (`07-ui-ux-specs.md` Section 6.1) shows shop packs as "5 random cards" for 500 Dust.

**Resolution needed:** The progression economy doc (3 Commons for 100 Dust) appears to be the most recent and internally consistent specification. The shop UI spec appears to describe a different, higher-tier pack. Engineering should implement 3 Commons for 100 Dust as the standard pack and clarify with design whether the 500-Dust/5-card pack in the shop spec is an additional pack type.

### Gap 2: Mana Cap Discrepancy

The battle mechanics doc (`01-battle-mechanics.md` Section 3) states the mana cap is 10 ("Gain 1 chaos mote (up to the cap of 10)"). The brief states "CM -- gain 1/turn, max 6." The data model (`02-card-data-model.md` Section 13) also defines `mana_cap: int // 10`.

**Resolution needed:** The data model and battle mechanics doc both specify 10. The brief's "max 6" appears to be an error. Engineering should implement a mana cap of 10.

### Gap 3: Shop Pack Pricing in UI Spec

The shop screen in the UI/UX spec (`07-ui-ux-specs.md` Section 6.1) lists Standard Pack at 500 Dust, Premium Pack at 1,500 Dust, and Faction Pack at 800 Dust. These prices and contents do not match the economy doc, which has 100 Dust for 3 Commons. The shop spec also shows shards purchasable with real money ($1.99-$9.99), while the economy design positions shards as Dust-only purchases.

**Resolution needed:** The shop UI spec appears to contain placeholder/aspirational pricing that conflicts with the economy design. The economy doc (`04-progression-economy.md`) is the source of truth for pricing. The UI spec should be updated to match. Engineering should implement economy doc pricing. Any real-money shard bundles should be deferred to post-launch evaluation.

### Gap 4: Chaos Dust Win/Loss Amounts

The brief states Win: 15, Loss: 10. The economy doc (`04-progression-economy.md` Section 2.1) states Win: 15, Loss: 5. The economy doc's math is internally consistent with Loss: 5 (50% WR: 10 Dust/game average).

**Resolution needed:** The economy doc is the source of truth. Loss reward is 5 Dust.

### Gap 5: Daily Quest Reward Range

The brief states "3 daily quests (10-25 Dust each)." The economy doc (`04-progression-economy.md` Section 4.1) states Easy: 20, Medium: 30, Hard: 45 Dust.

**Resolution needed:** The economy doc is the source of truth with its detailed quest template table. Engineering should implement the 20/30/45 Dust reward tiers.

---

*Last updated: 2026-02-16*
*Status: Complete -- Ready for Engineering Handoff*

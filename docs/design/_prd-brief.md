# PRD Input Brief — Condensed Specs from All Design Docs

This is a condensed reference for the PRD writer. Source docs are in docs/design/ (00-09).

---

## Game Overview (from 00-game-design-master.md)
- **Platform:** iOS mobile-first, potential web PWA
- **Genre:** AI-generated collectible card game
- **Core differentiators:** AI-generated art/text, Order/Chaos system, faction mechanics, no pay-to-win
- **3 Factions:** Ironwright Collective (Steampunk/Augment), Fey Courts (Fey/Bond), Demonic Kingdoms (Dark/Corruption)
- **Deck rule:** 20 cards, single faction only, max 1 Legendary per deck
- **Card limit per faction:** Free=50, Mid=100, High=200

### Onboarding Flow
1. Create account → 2. Trial decks (3 factions, premade 20-card) → 3. Play 1-3 matches each → 4. Pick faction → 5. Trial deck becomes owned collection → Start with 20 Commons + starter avatar + shards for 2-3 evolutions + small Chaos Dust

### Card Economy
- All cards start Common, evolve through Uncommon → Rare → Epic → Legendary
- Cards earned via Chaos Dust (in-game currency), never real money
- Card packs: 5 Commons for 100 Dust, guaranteed no duplicates
- Cross-faction unlock: 150 Dust to buy first pack from new faction

---

## Battle Mechanics (from 01-battle-mechanics.md)
- **Turn structure:** 9 phases (Upkeep → Chaos Roll → Draw → Main Phase 1 → Declare Attackers → Assign Blockers → Combat Resolution → Main Phase 2 → End)
- **Resources:** Chaos Motes (CM) — gain 1/turn, max 6. CM cost is FIXED forever through evolution
- **Combat:** MTG-style — declare attackers → defender assigns blockers → simultaneous damage
- **HP:** Each avatar has 20 HP
- **7 Keywords:** Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing
- **Taunt:** Forced attack + forced block (two-part rule)
- **Chaos Roll:** D20 at start of turn. Roll compared to player's instability rating:
  - Roll ≤ instability: Chaos event
  - Roll > instability but within 5: Nothing
  - Roll > instability+5: Order event
- **Instability formula:** avatar_modifier + sum(creature base_instability + evolution_changes + modifier_adjustments), clamped 1-20
- **8 Order events + 8 Chaos events** (16 total)
- **PP-based modifier pools:** 12 pools × (8 universal + 4 faction) = 240 modifiers
- **Modifier selection at evolution:** Free=2 options, Mid=3, Top=4
- **Main phase only spells** — no instant-speed, no response windows

---

## Data Model (from 02-card-data-model.md)
### Key Entities
- **CardTemplate:** base definition (name, faction, card_type, cm_cost, base_atk, base_hp, base_instability, keywords, art_prompt, base_art_url)
- **CardInstance:** player-owned card (owner_id, template_id, current_rarity, chaos_energy, evolution_history[], current_art_url, modifiers[])
- **EvolutionRecord:** {rarity_from, rarity_to, path (Order/Chaos), modifier_applied, shard_used, art_url, timestamp}
- **Modifier:** {id, name, pool_id, modifier_type, stat_changes, keyword_grants, instability_adjustment, faction_exclusive}
- **Deck:** {owner_id, faction, cards[20], avatar_id}
- **GameState:** {match_id, players[2], turn_number, current_phase, board_state, instability_ratings}
- **PlayerProfile:** {user_id, username, subscription_tier, chaos_dust, owned_factions[], rank, mmr}

---

## AI Generation Pipeline (from 03-prompt-templates.md)
- **Base card art:** FLUX Dev (txt2img), 1024x1024, batch pipeline pre-launch
- **Evolution art:** FLUX Kontext (img2img), preserves visual DNA from previous tier
- **Text generation:** GPT-4o Mini for names, flavor text
- **Prompt structure:** [FACTION_PREFIX] + [CREATURE_TYPE] + [VISUAL_DETAILS] + [FRAMING] + [QUALITY_TAGS]
- **Evolution prompt modifiers:** Order path = refinement/harmony, Chaos path = mutation/distortion
- **Quality guardrails:** NSFW filter, style consistency check, visual similarity score for evolutions
- **Players never type prompts** — select from curated modifier lists

---

## Progression Economy (from 04-progression-economy.md)
### Energy Thresholds
- Common→Uncommon: 15 energy, Uncommon→Rare: 30, Rare→Epic: 50, Epic→Legendary: 75
- Total Common→Legendary: 170 energy
- Earn rate: 2/win, 1/loss per card. All 20 deck cards earn simultaneously
- Casual (2 games/day, 50% WR): ~12.4 weeks to full Legendary deck
- Regular (5 games/day): ~5 weeks. Hardcore (10 games/day): ~2.4 weeks

### Chaos Dust Economy
- Win: 15 Dust, Loss: 10 Dust, Daily first win: +25 bonus
- Card pack: 100 Dust (5 Commons), Cross-faction unlock: 150 Dust
- Planar Shards: Common=free, Uncommon=25 Dust, Rare=75, Epic=150
- Subscribers get dust bonuses: Mid +25%, High +50%

### Quest System
- 3 daily quests (10-25 Dust each), 3 weekly quests (50-100 Dust each)
- Achievement milestones for one-time large rewards

---

## Content Pipeline (from 05-content-pipeline.md)
- **Launch target:** ~360 card templates (120/faction × 3 + 7 universal stabilizers)
- **Batch generation:** Automated pipeline with FLUX Dev + GPT-4o Mini
- **QA workflow:** Automated (NSFW, style consistency, stat validation) + human review for art quality
- **Seasonal releases:** New faction = primary content event. Season length 6-8 weeks
- **Content distribution:** Balanced instability spread (0-5), CM cost curve (1-6)

---

## Technical Architecture (from 06-technical-architecture.md)
### Services
- **iOS Client:** React Native
- **API Gateway:** Kong / AWS API Gateway
- **WebSocket Gateway:** Socket.io for real-time battle
- **Services:** Auth, Game Server (stateful match), Collection, Evolution, Economy, Matchmaking, AI Generation
- **Data:** PostgreSQL (primary), Redis (cache + game state), S3/GCS (art storage), BullMQ (job queue)
- **External AI:** FLUX Kontext (Replicate/Fal.ai), GPT-4o Mini (OpenAI)
- **Observability:** Datadog/Grafana Loki, Prometheus+Grafana, BigQuery analytics

### Key API Endpoints (partial)
- POST /api/matchmaking/queue — enter queue
- WS /ws/game/{match_id} — real-time game events
- POST /api/evolution/evolve — trigger evolution
- GET /api/collection — list owned cards
- POST /api/economy/purchase — buy packs/shards

---

## UI/UX Specs (from 07-ui-ux-specs.md)
### Screens
- **Core tabs (5):** Home, Collection, Decks, Profile, Shop
- **Battle flow:** Mode Selection → Matchmaking → Battle → Post-Match Results
- **Card management:** Card Detail, Evolution Flow, Graveyard
- **Secondary:** Settings, Achievements, Battle Log, Friends List, Onboarding

### Key Interactions
- Tap targets: min 44pt for mobile
- Drag: blocker assignment, deck building
- Long press: card detail preview
- Swipe: hand scrolling, collection browsing
- Dark theme default with faction-themed accents
- Portrait for menus, landscape lock during battle

### Battlefield Layout
- 5 creature slots per side, avatar flanking, chaos roll zone center-top
- Hand area bottom, mana display, HP bars, turn phase indicator
- Timer bar with color states (normal → red at 15s)

---

## Audio Design (from 08-audio-design.md)
- **Total audio package:** ~25 MB (15 music, 8 SFX, 2 ambient)
- **Simultaneous channels:** 12 max (6 SFX + 4 music + 2 ambient)
- **Format:** OGG Vorbis 128kbps (music), AAC 96kbps (SFX)
- **Faction audio identities:**
  - Ironwright: brass, mechanical percussion, steam hisses, 90-110 BPM
  - Fey Courts: woodwinds, harps, crystal chimes, nature ambience, 70-90 BPM
  - Demonic: war drums, guttural chants, bone percussion, 100-130 BPM
- **Adaptive system:** Music intensity scales with board state; instability affects audio tension
- **Priority:** SFX > Music > Ambient

---

## Monetization (from 09-monetization-details.md)
### Subscription Tiers
- **Free:** 2 modifier choices, Common shards free, 50 cards/faction
- **Mid (~$5-8/mo):** 3 modifier choices, +25% dust, 100 cards/faction
- **Top (~$10-15/mo):** 4 modifier choices, +50% dust, 200 cards/faction, priority art generation

### Revenue Streams
- Subscriptions (primary), Battle Pass ($5-10/season), Cosmetics ($1-3 each)
- No loot boxes, no pay-to-win, guaranteed pack contents

### Anti-Predatory Design
- No randomized purchases, spending caps/warnings, parental controls, transparent rates

### Key Metrics
- Target conversion: 5-8% Free→Mid, 15-20% Mid→Top
- Industry benchmarks for card games: 3-7% total paying users

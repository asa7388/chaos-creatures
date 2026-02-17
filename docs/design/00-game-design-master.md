# Chaos Creatures — Game Design Master Document

## 1. Concept Overview

Chaos Creatures is an AI-generated collectible card game for iOS where every card's art, flavor text, and effect modifiers are produced by AI. Players collect, evolve, and battle with cards across distinct visual styles — each style acting as its own faction and aesthetic identity.

### Core Differentiators

- **Every card is unique.** AI generates art, flavor text, and effect variations so no two collections look the same.
- **Faction system with exclusive mechanics.** Three launch factions (Steampunk, Fey, Demonic) each have a unique gameplay mechanic (Augment, Bond, Corruption) available only through faction-specific modifiers. Decks must use cards from a single faction.
- **No real money on individual cards.** Cards are earned through gameplay and Chaos Dust (in-game currency). Subscriptions enhance evolution depth, art quality, and collection growth — never raw power.
- **Prompt template engine.** A layered prompt system constrains AI generation to keep cards mechanically balanced and visually cohesive while allowing massive variety.
- **Order vs. Chaos as the central strategic axis.** A D20 chaos roll every turn creates dynamic events. Players build decks that lean into Order (consistency), Chaos (volatility), or a hybrid of both.

### Design Pillars

- **Collectibility** — Cards feel personal, rare, and worth showing off.
- **Strategic Depth** — Evolution choices, modifier attunement, and instability management reward thoughtful play.
- **Self-Expression** — Faction choice, evolution paths, and custom generation let players define their identity.
- **Accessible Progression** — Every game matters. Wins feel great, losses still advance your cards.
- **Sustainable Economy** — Free players have a complete experience. Spending enhances, never gates.

### Lore

The world of Chaos Creatures was once a thriving land of sci-fi and fantasy civilizations. War erupted between the many races, creatures, and factions, and the overwhelming power and destruction unleashed tore open rents to the Plane of Chaos. Chaos motes from the Plane of Chaos now transform the creatures and machines of this world. Players are key figures from the lore — leaders, warlords, mages, and champions — themselves transformed by chaos.

Planar Shards are fragments that fell when the rents to the Plane of Chaos first opened. Made of both Order and Chaos, they are the catalyst for evolution — channeling accumulated chaos energy through a shard triggers transformation. Their dual nature is what gives evolution its unpredictability.

---

## 2. Faction System

A faction is the core unit of player identity and deck construction. Each faction has a distinct art style, creature thematic identity, exclusive mechanic, and AI generation voice.

**What a Faction Contains:** Image prompt prefix (art direction), flavor text voice/tone, card frame design & color palette, UI battle theme (accents, particles, ambient visuals), an exclusive mechanic (Augment/Bond/Corruption), and optionally unique soundtrack/ambient audio.

**Deckbuilding Rule:** A deck may only contain cards from a single faction. Decks of any faction may battle any other faction. Every card is immutably tagged with its faction.

**Card Limit Per Faction (by Subscription Tier):**

| Tier | Cards Per Faction | Rationale |
|---|---|---|
| Free | 50 | Enough for multiple decks; forces meaningful curation |
| Mid Tier | 100 | Room for more evolution experiments and duplicate paths |
| High Tier | 200 | Full collector experience; matches higher evolution volume |

Higher tiers generate more AI art through frequent evolutions and need more cloud storage. Card limits scale with the subscription revenue that covers those costs. Free players still have a complete gameplay experience — 50 cards per faction is more than enough to build strong decks, but they need to be selective about what they keep and evolve.

**Launch Factions (3):**

- **The Ironwright Collective (Steampunk)** — Brass, gears, steam, clockwork creatures. Exclusive mechanic: **Augment** — modifiers that compound as you stack more Augments on a single creature. Play identity: midrange/value, fewer creatures each heavily invested.
- **The Fey Courts (Fey & Druidic)** — Ancient forests, bioluminescent flora, antlered fey lords, mycelial networks. Exclusive mechanic: **Bond** — modifiers that create synergies between creatures on the board. Play identity: board-centric midrange, power in the network.
- **The Demonic Kingdoms** — Hellfire, obsidian fortresses, blood rituals, corrupted flesh. Exclusive mechanic: **Corruption** — modifiers that trade self-damage for outsized power. Play identity: aggro/burn, explosive but on a clock.

*(Full faction details, example modifiers, and faction triangle in `01-battle-mechanics.md` Section 6.)*

**Cross-Faction Unlocking:** Players start with one faction at onboarding. Additional factions are unlocked by purchasing a card pack from that faction using Chaos Dust (150 Dust). Once unlocked, the player can build decks, earn cards, and access faction modifiers for that faction. No real money required.

**Future Factions:** New factions are the primary content release mechanism — a new art style, exclusive mechanic, modifier pool, and card set. The data model supports unlimited factions.

---

## 3. Card Economy

### All Cards Start Common

There is no tiered card economy with separate commons, rares, and legendaries at generation. Every card enters the game as a Common. A card's rarity is earned through evolution — the player shepherds each card from Common through Uncommon, Rare, Epic, and Legendary via gameplay investment and Planar Shards.

This means every legendary in a player's collection has a personal history. No lucky pulls, no instant power — just earned progression.

### Onboarding Flow

1. Player creates account, picks a username.
2. **Trial phase:** player receives a premade 20-card Commons deck for each of the 3 factions (loaner decks — fixed lists, cannot be evolved).
3. Player plays 1–3 matches with each trial deck (vs. AI or new players).
4. **Faction commitment:** player picks one faction. That trial deck becomes their real collection — those 20 Commons are now owned CardInstances, fully evolvable. Other trial decks are returned.
5. Player starts with: 20 Commons in one faction, a starter avatar, enough shards to evolve 2–3 cards, and a small amount of Chaos Dust.

### Card Acquisition — Chaos Dust

**Chaos Dust** is the single in-game currency, earned through gameplay and spent on cards and shards. No premium currency — real money goes to subscriptions only.

| Purchase | Cost |
|---|---|
| Card Pack (own faction, 3 random Commons) | 100 Dust |
| Card Pack (other faction, 3 random Commons + unlocks faction) | 150 Dust |
| Specific Common | 50 Dust |
| Planar Shard (Uncommon/Rare/Epic/Legendary) | 30/60/120/240 Dust |
| Avatar unlock | 300 Dust |

Duplicate protection: packs reroll 3rd+ copies of owned Commons.

*(Full earning rates, progression estimates, and subscription card benefits in `01-battle-mechanics.md` Section 12.)*

### Base Card Generation (Batch Pipeline)

Card templates are batch-generated before launch as Commons. Each faction needs a pool of base creatures and spells that are quality-checked and balanced.

**Launch Targets Per Faction:**

| Type | Count |
|---|---|
| Base creatures | ~60–80 |
| Base spells | ~20–30 |
| Stabilizer/manipulation cards | ~10–15 |
| **Total per faction** | **~90–125** |
| **Total across 3 factions** | **~270–375** |

### Batch Pipeline

Define mechanics from templates → generate art via faction prefix → generate flavor text → QA/reject/regenerate → composite final card. Internal batch tool with approval UI needed.

---

## 4. Evolution System

Evolution is the core progression mechanic. Cards absorb chaos energy through being played in games. When a card has accumulated enough energy and the player has the appropriate Planar Shard, the card can evolve.

### Evolution Path

**Common → Uncommon → Rare → Epic → Legendary**

Each evolution requires:

1. **Accumulated chaos energy** — earned by playing the card in games.
2. **A Planar Shard of the target tier** — Uncommon Shard, Rare Shard, Epic Shard, or Legendary Shard.

### Chaos Energy Thresholds

Cards accumulate chaos energy by being in a deck during completed games. ALL 20 cards in the deck receive energy per game, regardless of whether they were drawn.

**Energy per game:**

| Game Result | Energy per Card |
|---|---|
| Win | 2 |
| Loss | 1 |

**Evolution thresholds:**

| Evolution | Energy Required | ~Games to Earn (avg 1.5/game) |
|---|---|---|
| Common → Uncommon | 15 | ~10 games |
| Uncommon → Rare | 30 | ~20 games |
| Rare → Epic | 50 | ~33 games |
| Epic → Legendary | 75 | ~50 games |
| **Total: Common → Legendary** | **170** | **~113 games** |

A player who wins 50% of their games earns ~1.5 energy per game per card. All 20 cards in a deck progress simultaneously — after ~113 games with the same deck, every card in it can reach Legendary (if the player has enough shards). Players who swap cards in/out will have cards at different energy levels.

### The Evolution Choice

When a card is ready to evolve, the player chooses how to channel the accumulated chaos energy through the Planar Shard:

- **Channel toward Order** — 70% chance of an Order evolution, 30% chance of a Chaos evolution.
- **Channel toward Chaos** — 70% chance of a Chaos evolution, 30% chance of an Order evolution.

The Planar Shard's dual nature (made of both Order and Chaos) is what creates this unpredictability.

### What Evolution Produces

Each evolution grants the card:

- **Increased base stats** — attack and health go up. Chaos mote cost is fixed forever and never changes through evolution.
- **A new triggered ability** tied to Order or Chaos events, determined by the evolution outcome.
- **A new effect modifier** drawn from the corresponding tier's modifier pool (see Section 5).
- **A new AI-generated card name** — the card's name evolves to reflect its transformation history (e.g., "Ashscale Wyvern" → "Ashscale Fury" → "Ashscale, Chaos-Forged").
- **New AI-generated art** — the card's appearance transforms via image-to-image AI, using the previous art as the reference. Cards with more Chaos evolutions look wilder, more distorted, more vivid. Cards with more Order evolutions look more structured, crystalline, illuminated. Mixed evolution histories produce complex visuals — structured elements cracking with chaotic energy, or wild forms containing geometric patterns.
- **New AI-generated flavor text** reflecting the transformation.

### Cards Are Not Tagged With an Alignment

Cards are never labeled "Order" or "Chaos." Instead, each card has a unique profile of Order and Chaos triggered abilities and modifier attunements shaped by its specific evolution history. A card that evolved Chaos/Order/Chaos/Order has two Chaos triggers and two Order triggers — it benefits from both event types. A card that went Chaos four times has four Chaos triggers and leans heavily into chaos but is never restricted from any deck.

This means:

- Deckbuilding is about reading your cards' trigger profiles and attunement leanings, building around aggregate tendencies rather than sorting by faction labels.
- The 30% "miss" on evolution isn't a failure — it's just a different profile than expected, which may be useful in hybrid builds.
- No card is ever "ruined" by an unexpected evolution outcome.
- Every player's collection is genuinely unique in strategic options, not just art.

### Duplicate Card Strategy

Because evolution outcomes are probabilistic, players are incentivized to level multiple copies of the same base card to pursue different evolution paths. This creates a natural gameplay loop — keep evolving copies until you get the trigger profile and modifier set you want for your deck.

### Evolution Art Generation — Image-to-Image AI

Evolution art uses **image-to-image AI generation** (FLUX Kontext). Each evolution takes the card's current art as the input reference image, and the player's chosen prompt modifiers describe *how to transform it.* The card visually evolves from its previous state rather than being regenerated from scratch.

This means:
- A Legendary card's art carries visible DNA from every stage it went through.
- Two players who evolved the same base card differently will have visibly different Legendaries because the image-to-image chain diverged at each step.
- Order evolutions use lower transformation strength (subtle, structured changes — crystalline growth, refined armor, luminous details). Chaos evolutions use higher transformation strength (dramatic shifts — fractured forms, wild energy, distorted silhouettes).

**AI also generates a new card name and flavor text at each evolution** via GPT-4o Mini, reflecting the card's evolving identity and history. An "Ashscale Wyvern" might become "Ashscale Fury" at Rare and "Ashscale, Chaos-Forged" at Legendary. Names are generated to be concise, memorable, and consistent with the card's faction voice.

**Modifier names and triggered ability descriptions are prewritten** (not AI-generated). This ensures consistent terminology across the player base — critical for build guides, strategy discussions, and searchability.

**Event flavor text is prewritten.** No AI API calls during battle. Zero latency risk in gameplay.

### Evolution Tier by Subscription — Planar Shard Quality

Players don't get freeform prompt control at any tier. Instead, all players pick from **curated prompt modifier lists** during evolution. The lists get larger and more dramatic at higher subscription tiers, and the Planar Shards themselves are higher quality, producing better image fidelity. No one types anything — this prevents abuse and ensures visual quality.

| Shard Type | Tier | AI Image Model | Resolution | Prompt Modifiers | Generation |
|---|---|---|---|---|---|
| **Planar Shard** | Free | FLUX Kontext Dev | 768×1024 | 8–10 basic (color shifts, simple additions: armor, scars, glow) | 1 pass, standard queue |
| **Refined Planar Shard** | Mid (~$5–8/mo) | FLUX Kontext Pro | 1024×1024 | 25–30 expanded (dramatic transformations: elemental effects, material changes, aura types) | 1 pass, priority queue |
| **Prismatic Planar Shard** | High (~$10–15/mo) | FLUX Kontext Pro | 1024×1024 | 40+ including exclusive (crystalline fractures, planar tears, chaos corruption, dual-element fusions) | 2 passes (generate → refine), priority queue |

The shard quality distinction is both mechanical and lore-driven: Refined Shards have been purified, allowing clearer channeling. Prismatic Shards refract chaos energy into more complex transformations. In practice, everyone's art uses the same model family (FLUX Kontext), preserving visual cohesion within a style. Subscribers get more dramatic transformations, higher resolution, and exclusive visual options — not a different art style.

*(See Section 7: Monetization for full subscription details. See Section 13a: AI Integration for cost analysis.)*

---

## 5. Effect Modifier System

Modifiers are granted through evolution. A Common card has zero modifiers. Each evolution adds one modifier, building up to 4 modifiers on a fully evolved Legendary.

### Modifier Progression

| Card Tier | Total Modifiers | New Modifier From |
|---|---|---|
| Common | 0 | — |
| Uncommon | 1 | Evolution 1 (C→U) |
| Rare | 2 | Evolution 2 (U→R) |
| Epic | 3 | Evolution 3 (R→E) |
| Legendary | 4 | Evolution 4 (E→L) |

### Modifier Pool Structure

Modifiers are organized into pools by three dimensions: **PP budget** (1, 2, or 3 PP), **tier bracket** (Early = C→U/U→R, Late = R→E/E→L), and **attunement** (Order or Chaos, determined by the evolution outcome roll). This produces 12 pools.

Each pool has two sub-pools:
- **Universal modifiers:** 8 per pool. Available to all factions. Simple stat/keyword effects.
- **Faction modifiers:** 4 per pool per faction. Must reference the faction's exclusive mechanic (Augment/Bond/Corruption). This is how factions feel mechanically distinct.

Total: 96 universal + 48 per faction × 3 factions = **240 modifier definitions at launch.**

### Modifier Selection — Monetization Core

At each evolution, the player chooses from options drawn from the appropriate pool. The number of options varies by subscription tier:

| Subscription Tier | Universal Options | Faction Options | Total Choices |
|---|---|---|---|
| Free (Planar Shard) | 1 | 1 | Pick 1 of 2 |
| Mid (Refined Shard) | 1 | 2 | Pick 1 of 3 |
| Top (Prismatic Shard) | 2 | 2 | Pick 1 of 4 |

Free players always get a real choice (universal vs. faction). Paid tiers widen the menu for more precise build sculpting. All tiers draw from the same pools at the same PP budget — no exclusive-to-paid modifiers.

*(Full modifier pool structure, PP budget tables, and design principles in `01-battle-mechanics.md` Section 7.)*

### Attunement System

Every modifier has two components:

1. **Base Effect** — Always active regardless of chaos roll results. This is the modifier's floor — it always does something.
2. **Attuned Bonus** — Activates only when the matching event type (Order or Chaos) fired on your most recent D20 roll.

The attunement of a modifier is determined at evolution time by the actual evolution outcome (the 70/30 roll result). An Order outcome draws from the Order-attuned pool; a Chaos outcome draws from the Chaos-attuned pool. This means **Order and Chaos attunements draw from completely different modifier pools** — not different bonuses on the same modifiers.

**Example — Standard Modifier:**

> **Chaos-Forged Blade**
> Base: +1 ATK
> Chaos Attunement: If your last roll triggered a Chaos Event, +2 ATK instead.

This creature always has +1 ATK, but on turns following a Chaos Event it has +2 ATK. A chaos-leaning deck that rolls Chaos Events frequently gets more value from this modifier.

**Example — Order Modifier:**

> **Warden's Resilience**
> Base: +1 HP
> Order Attunement: If your last roll triggered an Order Event, this creature also has Shield.

Always has +1 HP, but on Order turns it also gains Shield. An Order-leaning deck keeps this creature shielded most of the time.

**Example — Extra-Powerful Modifier with Drawback:**

> **Entropic Surge**
> Base: +2 ATK
> Chaos Attunement: If your last roll triggered a Chaos Event, +4 ATK instead.
> Order Penalty: If your last roll triggered an Order Event, -1 ATK instead (net +1 ATK).

This modifier is significantly more powerful on Chaos turns (+4 ATK) but actively weakens on Order turns (+1 ATK instead of the base +2). Extra-powerful modifiers reward commitment to one event type while punishing the opposite.

### Instability Adjustment

Modifiers **can** adjust a creature's instability contribution. A modifier with "+1 instability" pushes the creature (and by extension the board state) toward chaos. A modifier with "-1 instability" pulls toward order. Instability adjustments cost PP from the modifier's budget (1 PP per ±1 instability).

This allows players to further sculpt their instability profile through evolution choices, not just through which cards they include in the deck.

### Faction-Exclusive Modifiers

Each faction's modifier pool contains modifiers that reference the faction's exclusive mechanic. These do things universal modifiers cannot:

- **Ironwright (Augment):** Effects scale with Augment count on the creature. "+1 ATK per Augment modifier on this creature."
- **Fey Courts (Bond):** Effects reference other creatures. "+1 HP for each other friendly creature with a Bond modifier."
- **Demonic Kingdoms (Corruption):** Effects trade self-damage for power. "This creature takes 1 damage at start of turn. Chaos Attuned: +3 ATK."

### How Attunement Shapes Deckbuilding

A fully evolved Legendary with 4 modifiers might have 3 Chaos-attuned modifiers and 1 Order-attuned modifier based on its evolution history. On Chaos turns, this creature is a powerhouse — three attuned bonuses all firing. On Order turns, only the one Order-attuned modifier gets its bonus while the others run at base level (or at a penalty if they're the extra-powerful type).

Players building a Chaos-leaning deck want cards whose modifiers are mostly Chaos-attuned. Order decks want Order-attuned modifiers. Hybrid decks want a mix or want modifiers with strong base effects that don't depend heavily on attunement. This creates natural deckbuilding archetypes without ever labeling a card as Order or Chaos.

---

## 6. Progression Systems

### Four Simultaneous Tracks

- **Player Level (Account):** XP from all games → unlocks game modes, cosmetic options.
- **Faction Mastery (Per Faction):** XP from faction games → unlocks faction-specific cosmetics, avatars.
- **Card Veterancy (Per Card):** Games played with card → accumulates chaos energy toward evolution.
- **Season Rank (Competitive):** Ladder ranking → Chaos Dust, exclusive frames.

Every game advances all four tracks simultaneously.

### Chaos Dust Earning

| Source | Chaos Dust | Frequency |
|---|---|---|
| Win a match | 15 | Per game |
| Lose a match | 5 | Per game |
| Daily quest | 25–50 | 3 per day |
| Weekly quest | 100–200 | 2 per week |
| Season milestone | 50–500 | Tiered thresholds |

### Planar Shard Acquisition

Shards are purchased with Chaos Dust (30/60/120/240 Dust for Uncommon/Rare/Epic/Legendary). Subscribers earn shards faster through quest dust bonuses and free monthly shards.

| Shard Tier | Free Player Rate | Subscriber Advantage |
|---|---|---|
| Uncommon Shards | ~1/day from dust earnings | +50-100% dust = faster acquisition |
| Rare Shards | Every 2-3 days | Mid tier: +50% quest dust |
| Epic Shards | Every 4-5 days | Top tier: +100% quest dust |
| Legendary Shards | Every 7-10 days | Top tier: 1 free Legendary shard/month |

---

## 7. Monetization

### Core Principle

Free players have full mechanical access. No real money on individual cards. Spending enhances evolution depth (modifier selection breadth), art quality, collection growth rate, and cosmetics — never raw power.

### Subscription Tiers

| Tier | Price | Cards/Faction | Modifier Selection | Shard Quality | Deck Slots | Monthly Card Bonus |
|---|---|---|---|---|---|---|
| **Free** | $0 | 50 | Pick 1 of 2 (1 universal + 1 faction) | Planar Shard | 3 | — |
| **Mid Tier** | ~$5–8/month | 100 | Pick 1 of 3 (1 universal + 2 faction) | Refined Planar Shard | 6 | +3 Commons/mo, +50% quest dust |
| **High Tier** | ~$10–15/month | 200 | Pick 1 of 4 (2 universal + 2 faction) | Prismatic Planar Shard | 10 | +5 Commons/mo, +100% quest dust, 1 free Legendary shard/mo |

**Why modifier selection depth is not pay-to-win:**
- All tiers draw from the same pools at the same PP budget. No exclusive-to-paid modifiers.
- Free players get a real choice every evolution (universal vs. faction), not a random assignment.
- The advantage is build sculpting consistency, not raw power.
- Over many cards, free players assemble effective builds — just with less precision.

Shard quality determines the AI generation experience during evolution — higher-quality shards produce higher-resolution art with access to more dramatic visual prompt modifiers. See Section 4 for the full shard quality breakdown.

### How Subscription Revenue Aligns With AI Costs

Free players generate minimal AI art — mostly playing with pre-generated Commons. As players subscribe at higher tiers, they evolve more frequently (more dust from quests), store more cards (higher limits), and generate more AI art. The subscription revenue scales with both the API costs and the cloud storage costs.

### Additional Revenue Streams

| Stream | Price Range |
|---|---|
| Season / battle pass | $5–10 |
| Cosmetics (frames, card backs, etc.) | $1–3 |

### The Emotional Moment

A player evolves a card through 115 games — from a humble Common to a Legendary with a unique combination of Order and Chaos triggers, four faction-specific and universal modifiers, and art that carries visual DNA from every evolution. Not paying for power — celebrating a card they built from nothing.

---

## 8. Battle System

### Overview

Turn-based combat inspired by Magic: The Gathering, focused on creatures. The central mechanic is a D20 Chaos Roll at the start of each turn that triggers Order or Chaos events based on the player's current instability.

### Resources — Chaos Motes

- Auto-gain 1 chaos mote per turn.
- Cap at 10.
- Every card has a chaos mote cost to play.
- No land/resource cards. Your entire deck is creatures, spells, and stabilizer/manipulation cards.

### Board

- 5 creature slots per side.
- Forces meaningful decisions about what to play and when.
- Stabilizer cards that sit on the board occupy creature slots — powerful stability effects cost board presence.

### Life Total

20 HP.

### Hand and Draw

- Starting hand: 4 cards.
- Draw 1 card per turn.
- One free mulligan (redraw entire hand once).

### No Summoning Sickness

Creatures can attack the turn they are played. Games move fast, every creature matters immediately.

### Turn Structure

1. **Start of Turn** — Start-of-turn effects fire (Corruption self-damage, stabilizer auras, modifier triggers).
2. **Chaos Roll** — D20 rolls visually on screen. Compare to current instability. Update attunement state on all creatures.
3. **Resolve Event** — Apply the Order or Chaos event. Fire triggered abilities.
4. **Draw & Gain Mana** — Draw 1 card. Gain 1 chaos mote (up to cap of 10).
5. **Main Phase** — Play creatures, spells, or stabilizer cards from hand. Any order, any number (mana permitting). All spells resolve immediately — no response window for the opponent.
6. **Declare Attackers** — Active player selects which creatures attack. Taunt on the opposing side forces minimum attackers. *(P1 skips this on turn 1.)*
7. **Assign Blockers** — Defending player assigns their creatures to block attackers (1-to-1). Taunt creatures MUST block if able. Defending player's 60-second timer starts here.
8. **Combat Resolution** — All damage is simultaneous. Unblocked attackers hit face. Shield → Damage → Deathtouch → Piercing → Lifesteal resolution. Dead creatures removed, on-death effects fire.
9. **End Turn** — Temporary buffs expire. Turn passes.

*(Full phase-by-phase specification with blocking rules, keyword interactions, timer rules, and worked example in `01-battle-mechanics.md` Section 3.)*

### Win Condition

Reduce opponent to 0 HP. That's it. An empty deck does not cause a loss — if a player must draw and cannot, they simply don't draw. This keeps games focused on combat and prevents mill/stall strategies that aren't fun on iOS mobile.

### First Player / Second Player Balance

First player is chosen randomly. Going first gives a tempo advantage (first to play creatures, first to attack), so the second player receives compensation:

- **Second player draws 5 cards** instead of 4 in their opening hand (still mulligans the full hand if desired).
- **Second player receives a Chaos Spark** — a zero-cost, single-use spell that grants +1 chaos mote for one turn. This is Hearthstone's Coin equivalent, reskinned to fit our world. It lets the second player "catch up" in tempo by playing a creature one turn earlier than their mana curve would normally allow.

The Chaos Spark also has a secondary benefit: it counts as a spell cast for any "when you play a spell" triggers. This makes it slightly more valuable in spell-heavy decks and gives the second player a small additional edge.

*(Exact balance of first/second player advantage will be tuned via playtest data.)*

### Turn Timer

Each player has **60 seconds per turn** to complete all actions (play cards, declare attackers). A visible timer bar depletes at the bottom of the screen during the active player's decision phases.

- At **15 seconds remaining**, the bar turns red and a "fuse burning" audio/visual cue plays.
- At **0 seconds**, the turn auto-ends (no cards played, no attackers declared for that turn).
- **No rope extensions.** Keeping turns short maintains iOS-friendly pacing.
- Chaos roll, event resolution, and draw/mana phases are not counted against the timer — only the player's decision phases (play cards and declare attackers/blockers).

### Surrender

A player can surrender at any time after turn 2. Tapping a menu icon (top corner) opens a confirmation dialog: "Surrender this match? This counts as a loss." Surrender counts as a loss for all progression purposes (rank, missions, etc.). Card XP is still awarded for games played before surrender.

The surrender option is deliberately placed behind a menu tap + confirmation to prevent accidental concedes (a common complaint in Marvel Snap).

### Spells

Spells are the minority of cards. All spells are played during the main phase only — there are no response windows or instant-speed spells. Types include:

- **Buff spells** — Buff a creature's stats for the turn. Cast before declaring attackers to set up favorable combat.
- **Removal** — Deal damage to a creature or destroy it.
- **Utility** — Draw cards, heal, gain mana.

No counterspells. No combat tricks (no spells during combat). Keeps the game flowing on iOS without complex stack interactions.

### Deck Construction Rules

- **Deck size:** 20 cards.
- **Max 2 copies** of any card.
- **Legendaries:** Max 2 per deck, limited to 1 copy each.
- Cards from a single faction only.

---

## 9. The Chaos Roll — Order vs. Chaos

### Core Mechanic

At the start of each turn, a D20 is rolled visually on screen. The result is compared to the active player's current **instability rating:**

- **Roll under instability** → a **Chaos Event** triggers.
- **Roll over instability** → an **Order Event** triggers.
- **Roll exactly on instability** → nothing happens (the eye of the storm).

### Instability Rating

Instability is **dynamic** — it changes during the game as creatures enter and leave the field.

**At any moment, your instability = Avatar base modifier + sum of instability values of all your creatures currently on the field.**

Each creature's instability value is computed from its template's `base_instability` (0–5, set at card creation), modified by evolution instability changes and modifier instability adjustments. See `01-battle-mechanics.md` Section 2 for full formula.

Modifiers **can** adjust instability — a modifier with "+1 instability" pushes the creature toward chaos; "-1 instability" pulls toward order.

**Target range for most decks in play: 1–20 instability (clamped to D20 range).**

### How Instability Creates Dynamic Games

- **Early game:** Few creatures on board. Low instability. Order events fire most turns. Both players get steady, modest benefits.
- **Mid game:** Boards develop. Instability rises into the contested zone. Every roll has real tension.
- **Late game:** A player with a stacked board of evolved creatures has high instability — Chaos events fire frequently. Powerful but volatile. If they get board-wiped, instability craters and they start getting Order events to help rebuild.
- **Comeback mechanic:** The player who's behind has fewer creatures out, lower instability, and gets Order effects (consistent, stabilizing) right when they need them most. The player who's ahead has high instability and risks Chaos disruptions. The system naturally creates tension and prevents blowouts.

### Event Lists

**Chaos Events** — Explosive, volatile, high-variance. Individually powerful but unpredictable. Can occasionally backfire.

Curated list of 8–10 events. Examples:

- A random creature you control gets +2 attack this turn
- Deal 2 damage to a random creature on either side of the board
- Your highest-cost creature in hand costs 2 less this turn
- A random modifier on one of your creatures activates twice this turn
- Discard a random card, then draw 2

**Order Events** — Stable, protective, incremental. Always helpful, always go where you want.

Curated list of 8–10 events. Examples:

- All your creatures get +1 health permanently
- Draw a card
- Gain 1 bonus chaos mote
- Your creatures with Shield regenerate their Shield
- Your lowest-health creature heals 2

*(Full event lists to be finalized in 01-battle-mechanics.md.)*

### Card Triggers and Modifier Attunement

Two systems respond to the chaos roll:

1. **Evolution-granted triggered abilities** activate when the corresponding event type fires. A card with "When a Chaos Event triggers, this creature gets +1 attack this turn" fires every time the player rolls a Chaos Event.

2. **Modifier attunement bonuses** activate based on the most recent roll. After a Chaos Event, all Chaos-attuned modifier bonuses on your creatures are active. After an Order Event, all Order-attuned bonuses are active. This means your board's effective power shifts turn-to-turn based on the chaos roll.

Combined, these systems mean a chaos-leaning deck with Chaos triggers and Chaos-attuned modifiers is dramatically more powerful on Chaos turns — multiple triggers firing plus multiple attuned bonuses. On Order turns, it runs at base modifier levels with no triggers. The inverse is true for Order-leaning decks. Hybrid decks have a flatter power curve — always getting some triggers and some attuned bonuses regardless of roll.

---

## 10. Avatars

Players are key figures from the lore, transformed by chaos. Each avatar stylistically matches the style/faction it belongs to.

### Avatar Effects

Avatars provide a **base instability modifier** that is always active. This is added to the instability calculation alongside field-based creature contributions.

- **Order-leaning avatars:** Higher instability reduction (e.g., -5 to -6). Pushes toward more Order events.
- **Balanced avatars:** Moderate instability reduction (e.g., -3 to -4). Flexible.
- **Chaos-leaning avatars:** Low instability reduction (e.g., -1 to -2). Allows instability to run high for more Chaos events.

Avatars have **no other gameplay effects** — no active abilities, no ultimates. They are purely a passive instability modifier and a visual/thematic identity.

### Avatars Per Faction

2 per faction at launch (one leaning Order, one leaning Chaos). 6 total at launch. Additional avatars unlock through faction mastery and seasonal content.

| Faction | Avatar | Leaning | Instability Modifier | Design Intent |
|---|---|---|---|---|
| **Ironwright Collective** | Aldric, the Forgemaster | Order | **-5** | Steady Augment builds. Low chaos risk. Shield and sustain strategy. |
| **Ironwright Collective** | Vex, the Entropy Smith | Chaos | **-2** | Aggressive Augment builds. Augment creatures get burst from Chaos events. Risky but explosive. |
| **The Fey Courts** | Sylara, the Verdant Warden | Order | **-5** | Bond networks protected by Order events. Grow wide, heal often, compound. |
| **The Fey Courts** | Morrigan, the Wild Huntress | Chaos | **-1** | Fastest Chaos buildup. Bond creatures get ATK spikes from Chaos events. Glass cannon strategy. |
| **The Demonic Kingdoms** | Kael, the Bound Tyrant | Order | **-4** | Corruption creatures with Order safety net. Self-damage is manageable because Order events heal you back. Balanced risk. |
| **The Demonic Kingdoms** | Lilith, the Unbound | Chaos | **-2** | Full Corruption + Chaos. Self-damage is the point — high instability triggers massive Chaos events. Race to kill before you kill yourself. |

**Why no balanced (-3 to -4) avatars at launch:** Two extreme leanings per faction creates clearer deckbuilding identity. A balanced option muddies the choice. Future balanced avatars (seasonal rewards, faction mastery unlocks) will expand options after players understand the system.

**Exception: Kael at -4** is the closest to "balanced" — intentional because Demonic Kingdoms' Corruption mechanic already pushes toward Chaos through self-damage instability. A -4 modifier gives Demonic players a viable Order-Corruption hybrid that isn't available to other factions.

### Avatar and Deck Pairing

Players choose an avatar when building a deck. The avatar must be from the same faction as the deck. Different avatars within the same faction enable different strategic approaches — the same card pool can support an Order-leaning or Chaos-leaning build depending on avatar choice.

### Visual Presence

The player's avatar appears on their side of the battlefield and visually represents them throughout the match. The opponent can see your avatar, which gives them information about your strategic leaning before the first card is played.

---

## 11. Stabilizer & Manipulation Cards

A card type alongside creatures and spells. Stabilizers sit on the board, occupy creature slots, have HP (can be destroyed), but have no ATK and cannot attack or block. They manipulate the instability/chaos roll system.

### Board Stabilizers (Occupy Creature Slots)

| Name | CM Cost | HP | Effect |
|---|---|---|---|
| Chaos Anchor | 2 | 3 | While on field: each of your creatures contributes -1 to instability (min 0 per creature). |
| Warding Pillar | 3 | 5 | While on field: your avatar's instability modifier is doubled. |
| Chaos Rift | 2 | 3 | While on field: each of your creatures contributes +1 to instability. |
| Entropy Engine | 3 | 4 | While on field: when you roll a Chaos event, your highest-ATK creature gets +1 ATK permanently. |
| Void Lens | 3 | 2 | While on field: after seeing your chaos roll, choose whether the event is Order or Chaos (once per turn). "Nothing" cannot be overridden. |

### Manipulation Spells (One-Shot, Don't Occupy Slots)

| Name | CM Cost | Effect |
|---|---|---|
| Binding Ward | 2 | Set your instability to 5 for this turn only. |
| Entropy Spike | 2 | Set your instability to 15 for this turn only. |

All 7 cards are **universal** (available to all factions). Faction-specific stabilizers reserved for future expansions.

### Strategic Role

Running a board stabilizer costs a creature slot — powerful instability manipulation means fewer creatures fighting for you. Every slot is a tradeoff. Stabilizers can be targeted and destroyed by damage spells, Chaos events (Wildfire, Upheaval, Maelstrom), and creature abilities, making them fragile investments that the opponent can counter.

*(Full mechanical specification in `01-battle-mechanics.md` Section 11.)*

---

## 12. Keywords

A tight set of 7 creature keywords. Kept small so that modifier-granted keywords feel impactful.

- **Shield** — Absorbs the first instance of damage, then is consumed.
- **Lifesteal** — Damage dealt by this creature also heals your HP.
- **Flying** — Can only be blocked by creatures with Flying or Reach.
- **Reach** — Can block creatures with Flying.
- **Deathtouch** — Any damage this creature deals to another creature destroys it.
- **Taunt** — Two-part rule: while you control a Taunt creature, the opponent must declare at least 1 attacker per Taunt you control. Your Taunt creatures must be assigned as blockers if able. Forces engagement; denies turtling.
- **Piercing** — Excess damage (beyond what's needed to kill a blocker) carries through to the opponent's HP.

*(Full keyword interaction matrix in `01-battle-mechanics.md` Section 3.)*

---

## 13. Technical Direction

### Platform

iOS only (Swift/SwiftUI/SpriteKit) via Xcode Cloud.

| Layer | Technology |
|---|---|
| Client | Native iOS app (Swift + SwiftUI + SpriteKit) |
| Backend | Node.js or Python + AI API layer |
| Image Gen | FLUX Kontext (img2img for evolution), FLUX Dev (text2img for batch) via fal.ai |
| Text Gen | GPT-4o Mini via OpenAI API |
| Audio | Licensed packs |

### Prompt Template Engine Layers

1. **Card Archetype** — valid stats/effects
2. **Faction** — art prefix, tone
3. **Rarity/Power** — stat ranges, complexity (tied to evolution tier)
4. **Evolution History** — Order/Chaos visual treatment based on the card's specific evolution path
5. **Player Modifiers** — prompt modifiers controlled by the player (scoped by subscription tier)
6. **Randomization** — unique name, art details, flavor text, stat values

### MVP Visual Approach

The game targets a "clean and stylish" visual philosophy — clear, readable, satisfying feedback through motion and sound rather than elaborate 3D animations. Think Slay the Spire or Balatro, not Hearthstone.

**Fully codeable by AI (Claude Code):**

- All game logic, backend, database, API layer
- Swift + SwiftUI UI and all screen flows
- Card art generation via AI image APIs
- Flavor text and prompt generation via LLM APIs
- Simple card animations: sliding, shaking, fading, glowing (SpriteKit actions, sprite sheets)
- Particle effects: glowing energy, floating motes, crackling chaos (SpriteKit)
- D20 roll: stylized 2D animated die with satisfying physics and landing effects
- Board layout, hand management, all interaction patterns

**Not attempted (would require specialized studio work):**

- 3D animated creature models (unnecessary — art is 2D card art)
- Complex hand-drawn animation sequences (unnecessary — use motion design instead)
- AAA-quality shader effects (unnecessary — stylized particles are sufficient)

**Paid asset budget: under $100 total.**

- Pre-made particle effect textures (sparks, smoke, energy wisps, glowing orbs) for plugging into particle systems
- Sound effect packs (card plays, attacks, damage, death, D20 roll, chaos/order events, evolution ritual, UI feedback)
- These assets dramatically increase perceived polish for minimal cost

---

## 13a. AI Integration

This section defines exactly where AI is used, what models handle each task, what is prewritten, and the cost structure.

### What AI Generates vs. What Is Prewritten

| Content | AI-Generated? | When | Model |
|---|---|---|---|
| Base card art | ✅ Yes | Batch pipeline (pre-launch) | FLUX Dev text-to-image |
| Base card name | ✅ Yes | Batch pipeline | GPT-4o Mini |
| Base flavor text | ✅ Yes | Batch pipeline | GPT-4o Mini |
| Evolution card art | ✅ Yes | Live, per player evolution | FLUX Kontext (img2img) |
| Evolution card name | ✅ Yes | Live, per player evolution | GPT-4o Mini |
| Evolution flavor text | ✅ Yes | Live, per player evolution | GPT-4o Mini |
| Avatar portraits | ✅ Yes | Batch pipeline | FLUX Dev text-to-image |
| Modifier names | ❌ Prewritten | Design phase | — |
| Modifier flavor text | ❌ Prewritten | Design phase | — |
| Triggered ability descriptions | ❌ Prewritten | Design phase | — |
| Event names & flavor text | ❌ Prewritten | Design phase | — |
| Avatar lore text | ❌ Prewritten | Design phase | — |

**Rationale:** Modifier names and ability descriptions must be prewritten so players can reference them consistently in build guides and strategy discussions. Event text is prewritten because no AI API calls should happen during battle — zero latency risk in gameplay.

### AI Models — Image Generation

**FLUX Kontext** (by Black Forest Labs) is purpose-built for instruction-based image editing. It takes an input image + natural language editing instructions and surgically modifies the specified elements while preserving everything else. This is exactly what card evolution needs — the card's current art is the input, and the prompt modifiers describe *how to transform it.*

Key advantages for our use case:
- **Character consistency** — The creature remains recognizably the same across 4 evolutions, even as it transforms dramatically.
- **Instruction-based editing** — "Add crystalline armor plating" modifies the existing image rather than generating from scratch. The evolution chain preserves visual DNA.
- **Fast generation** — Sub-10-second generation times fit within the evolution ceremony animation.

| Use Case | Model | Cost/Image | Resolution | When |
|---|---|---|---|---|
| Base card art (batch) | FLUX Dev t2i | ~$0.025 | 1024×1024 | Pre-launch, one-time |
| Evolution art — Free tier | FLUX Kontext Dev i2i | ~$0.02 | 768×1024 | Each evolution |
| Evolution art — Mid/High tier | FLUX Kontext Pro i2i | ~$0.04 | 1024×1024 | Each evolution |
| Avatar portraits (batch) | FLUX Dev t2i | ~$0.025 | 1024×1024 | Pre-launch, one-time |

### AI Models — Text Generation

**GPT-4o Mini** (by OpenAI) handles all text generation (card names, flavor text). At ~50 tokens output per evolution call, the cost per call is effectively zero (~$0.0001). GPT-4o Mini is chosen over Claude Haiku 4.5 ($1/$5 per 1M tokens) because our text generation calls are extremely simple and constrained — short creative text following a structured prompt template, not complex reasoning or agentic tasks where Haiku's strengths would justify its ~8x higher cost. At GPT-4o Mini's pricing ($0.15/$0.60 per 1M tokens), text generation is a rounding error next to image costs. This also means we can afford to generate multiple name candidates per evolution and let players pick their favorite.

### Cost Per Evolution

| Component | Free Player | Subscriber |
|---|---|---|
| Image generation | ~$0.02 (Kontext Dev) | ~$0.04 (Kontext Pro) |
| Name + flavor text | ~$0.0001 | ~$0.0001 |
| **Total per evolution** | **~$0.02** | **~$0.04** |
| **Full Common → Legendary (4 evolutions)** | **~$0.08** | **~$0.16** |

**Monthly cost modeling:**

- Free player evolving 10-15 cards/month: $0.20–$0.30 in AI costs. Sustainable as a loss leader.
- Mid subscriber ($5-8/mo) evolving 25 cards/month: ~$1.00. Excellent margin.
- High subscriber ($10-15/mo) evolving 40 cards/month: ~$1.70. Excellent margin.

### Evolution Image Pipeline (Detailed)

1. Retrieve the card's current `art_url` as the reference image.
2. Construct the FLUX Kontext prompt:
   - Faction art_prompt_prefix (from Faction entity)
   - Evolution direction instruction: Order evolutions use lower denoising strength (subtle, structured changes); Chaos evolutions use higher strength (dramatic transformation)
   - Player-selected prompt modifiers (from the tier-appropriate modifier list)
   - Evolution history context (e.g., "this creature has undergone 2 chaos transformations and 1 order transformation")
3. Set generation parameters based on shard quality (resolution, passes, model variant).
4. Call FLUX Kontext API with reference image + prompt.
5. For Prismatic Shards (high tier): run a second refinement pass on the output.
6. Store result to CDN, update `art_url`.

### Evolution Text Pipeline (Detailed)

1. Construct GPT-4o Mini prompt:
   - Faction `flavor_voice` instructions
   - Card's base name (from template)
   - Current evolution tier + direction
   - Full evolution history summary
   - Previous names in the evolution chain
   - Instructions: generate 2-3 new card name candidates (concise, evocative, consistent with faction voice) and flavor text (1-2 sentences matching faction voice)
2. Call GPT-4o Mini API.
3. Parse response for name candidates and flavor text.
4. Present name candidates to player for selection during evolution ceremony.
5. Update `CardInstance.current_name` and `CardInstance.flavor_text`.

### Batch Pipeline (Pre-Launch)

Base card templates are generated in batches before launch. Each batch:

1. Define card archetypes mechanically (stats, type, keywords) from templates.
2. Generate art via FLUX Dev text-to-image using faction prefix + archetype description.
3. Generate card name + flavor text via GPT-4o Mini using faction voice + archetype.
4. Human QA reviews each card in approval UI (approve/reject/regenerate).
5. Approved cards become CardTemplates with `approved_at` and `approved_by` stamps.
6. Composite final card image (art + frame + stats overlay).

Estimated batch cost for 3 factions (~300-375 cards): ~$10 in image generation + ~$0.04 in text generation = **~$10 total.**

### AI Generation Queue & Status

Evolution art generation is hidden behind the evolution ceremony animation (3-5 seconds of card dissolving, shard cracking, particles flowing). The API call fires at step 1 of the ceremony while the animation plays. By the time the animation finishes, the art is typically ready. If generation takes longer than the animation, a brief "channeling energy..." loading state bridges the gap.

For the rare case where generation fails, a fallback system applies a programmatic visual treatment to the existing art (color shift + particle overlay matching the evolution direction) as a temporary placeholder, with the full AI art generated async and pushed to the client when ready.

---

## 14. UI/UX Design & Screen Flow

### Visual Philosophy

Clean, stylish, card-game-native. The UI should feel like a premium iOS card game app — not a generic mobile game with cards bolted on. Think Balatro's clarity, Marvel Snap's speed, Slay the Spire's readability. Every screen serves one primary purpose with minimal navigation friction.

Dark theme default. The game's lore is built around chaos rifts and planar energy — a dark UI lets card art and particle effects pop. Light accents come from the player's active faction palette.

### Navigation Structure — Bottom Tab Bar

The app uses a persistent bottom tab bar with 5 tabs. This is the only top-level navigation. No hamburger menus, no hidden drawers, no nested tab systems.

| Tab | Icon | Primary Function |
|---|---|---|
| **Home** | Chaos mote icon | Dashboard — play, daily rewards, news |
| **Collection** | Card stack icon | Browse and manage all owned cards |
| **Decks** | Deck icon | Build and edit decks |
| **Profile** | Avatar silhouette | Player stats, achievements, showcase |
| **Shop** | Shard icon | Subscriptions, card packs, cosmetics |

### Home Screen

The player's primary hub. Optimized for "I have 5 minutes, get me into a game."

**Layout (top to bottom):**

1. **Header bar** — Player name, level, current rank badge, currency displays (chaos motes currency, Planar Shards by tier).
2. **Featured card showcase** — A single rotating display of one of the player's best cards, rendered large with ambient particle effects matching its evolution history. Tap to view full card detail. This is the emotional anchor of the home screen — your collection has a face.
3. **Play button** — Large, central, unmissable. Tapping opens mode selection:
   - **Ranked** — Ladder matches affecting season rank.
   - **Casual** — Unranked matches for testing decks and earning card XP.
   - **Practice** — Play against AI at adjustable difficulty.
4. **Active deck selector** — Shows the currently selected deck (avatar + faction + deck name). Swipe horizontally to switch between saved decks. The play button always uses the active deck.
5. **Daily/weekly missions panel** — Collapsible panel showing 3 daily missions and 1 weekly mission with progress bars. Missions reward chaos motes, shards, and XP.
6. **News/events banner** — Scrollable cards for seasonal events, new faction drops, and patch notes. Minimal — 1-2 items max, not a feed.

**What the home screen does NOT have:** Social feed, chat, leaderboard preview, or anything that delays getting into a game. Those live in Profile and can be reached in one tap.

### Battle Screen

The most important screen in the game. Every element must be readable at a glance during fast decision-making.

**Layout:**

```
┌─────────────────────────────────────┐
│  Opponent Avatar  |  Opponent HP Bar │
│  Instability: 11  [Opp Hand count]  │
│                                     │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐              │
│  │1│ │2│ │3│ │4│ │5│  ← Opp Board  │
│  └─┘ └─┘ └─┘ └─┘ └─┘              │
│                                     │
│  ═══════ CHAOS ROLL ZONE ═══════   │
│              [D20]                  │
│  ═══════════════════════════════    │
│                                     │
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐              │
│  │1│ │2│ │3│ │4│ │5│  ← Your Board │
│  └─┘ └─┘ └─┘ └─┘ └─┘              │
│                                     │
│  Your Avatar  |  Your HP Bar        │
│  Instability: 8                     │
│  [Your Hand - scrollable]           │
│  [Mana Crystals]  [End Turn Button] │
└─────────────────────────────────────┘
```

**Key UI elements:**

- **Chaos Roll Zone** — Center of the screen. The D20 rolls here with full animation. The roll zone is neutral — it belongs to whichever player's turn it is. Each player's instability is displayed on their own side of the board (next to their avatar/HP), so both players can always see both thresholds. After the roll, the triggered event name flashes briefly with an Order (blue/gold glow) or Chaos (red/purple crackle) visual treatment before resolving.
- **Board slots** — 5 per side. Empty slots are visible as dim outlines so the player always knows capacity. Cards on board show compact view: art thumbnail, ATK/HP numbers, active keyword icons, and a small attunement indicator (glowing if attuned bonus is currently active).
- **Hand** — Horizontally scrollable at the bottom. Cards in hand show full art. Cards you can afford to play are bright; cards you can't are dimmed. Drag a card up to play it.
- **HP bars** — Thick, clear, always visible. Numeric HP displayed on the bar. Damage causes the bar to flash and shake.
- **Mana crystals** — Row of chaos mote icons below your board. Filled = available, empty = spent, outlined = upcoming (shows how many you'll have next turn).
- **End Turn button** — Bottom right. Pulses gently when it's your turn to act as a reminder.
- **Avatars** — Your avatar bottom-left, opponent top-left. Small portrait with style-themed frame. Avatar provides visual identity and reminds you of your instability modifier.

**In-battle interactions:**

- **Tap a card on board** → Expands to full view with all modifiers, attunement status, and current stats.
- **Long-press a card in hand** → Preview card detail without playing it.
- **Drag from hand to board** → Play a card (if you have enough mana).
- **Tap a creature then tap opponent or opponent's creature** → Declare attacker and target.
- **Swipe opponent's creature onto yours** → Assign blocker during defense phase.

**Battle event overlay:**

When the D20 roll triggers an event, a semi-transparent overlay slides in from center showing:
- Event name and icon
- Brief effect description
- Which of your creatures are responding (triggers firing, attunements activating) — highlighted with a pulse

This overlay auto-dismisses after 2-3 seconds or on tap. Fast enough to not slow the game, visible enough to understand what happened.

**Targeting UI for spells:**

Some spells require a target (e.g., "Deal 3 damage to a creature"). When a targeted spell is dragged from hand to the board, all valid targets glow with a highlight. The player taps the intended target to confirm. If the spell can hit any creature (friend or foe), all creatures on both sides highlight. If it's enemy-only, only opponent creatures highlight. Tapping outside the highlighted zone cancels the spell back to hand. Clear, forgiving, no accidental casts.

**Graveyard / destroyed cards:**

Tap your avatar during a match to open a graveyard panel showing all your creatures and spells that have been destroyed or used this game. Opponent's graveyard is also viewable (tap their avatar). This is essential for tracking what threats have been dealt with and what might still be in the opponent's deck. Simple scrollable list of card thumbnails — tap to view full card detail.

**Battle log:**

A small scrollable log icon (bottom-left or accessible via swipe) opens a chronological list of everything that happened this game: rolls, events triggered, cards played, attacks, damage dealt, creatures destroyed, modifier activations. Each entry is a single line with an icon. The log is critical because our game has a lot of systemic interactions (roll → event → triggers → attunement shifts) and players need to be able to reconstruct what just happened, especially if they looked away for a moment.

**Opponent information visibility:**

- **Opponent's mana:** Visible. Shown as a mana crystal row at the top (mirroring yours at the bottom). Knowing the opponent's available mana is essential strategic information — it tells you what they could play.
- **Opponent's hand count:** Visible (face-down cards, count displayed).
- **Opponent's deck count:** Visible. Small number on the deck icon. Less critical since we have no deck-out loss, but still useful for tracking game pacing.
- **Opponent's instability:** Visible on their side of the board. Knowing their instability tells you how likely their next roll is to trigger Order vs. Chaos, which informs your blocking and attack decisions.

**Turn phase indicator:**

A subtle phase label appears below the chaos roll zone showing the current phase: "Start" → "Chaos Roll" → "Event" → "Draw" → "Main Phase" → "Attack" → "Block" → "Combat" → "End." The active phase is highlighted; completed phases are dimmed. This helps new players understand the turn structure and helps all players know when they need to act (main phase, declare attackers, assign blockers).

**Opponent card preview:**

When the opponent plays a card, it briefly appears enlarged in the center of the screen (0.5-1 second) before moving to the board. This gives the player a chance to read the card. After that, any card on the board can be tapped to view its full detail at any time.

### Matchmaking & Loading Screen

When the player taps "Play" and selects a mode, a matchmaking screen appears:

- **Your deck/avatar displayed** on the left side, with your rank badge.
- **Animated "searching" visual** in the center — a chaos rift swirling, Planar Shard floating, or D20 slowly rotating. Atmospheric, not just a spinner.
- **Estimated wait time** if queue is longer than 10 seconds.
- **Cancel button** to back out of the queue.
- **Tip of the day / lore snippet** — rotating short text to keep the player engaged during longer queues.

Once matched:

- Opponent's avatar and rank badge slide in on the right side.
- Brief "VS" screen (1-2 seconds) showing both avatars, both factions, both rank badges.
- Transition into the battle screen.

### Disconnect Handling

- If a player disconnects, their **turn timer continues running.** If they reconnect before their time expires, they resume normally.
- If the timer expires on a disconnected player, their turn auto-ends with no actions.
- If a player misses **3 consecutive turns** due to disconnection, they automatically forfeit (treated as a surrender). This prevents opponents from being held hostage.
- A brief "Opponent disconnected — waiting for reconnection" message appears for the remaining player.
- On reconnect, the full game state is restored from the server. No client-side state dependency for critical game data.

### Evolution Screen

Triggered when a card has enough chaos energy and the player has the required shard. This is a **ritual moment** — the most emotionally impactful screen in the game.

**Flow:**

1. **Card presentation** — The current card is displayed large, centered, with its full history (current tier, all existing modifiers, evolution path so far shown as a vertical timeline on the left: icons showing Order/Chaos for each past evolution).
2. **Prompt modifier selection** — Player picks from their tier-appropriate prompt modifier list (8-10 for free, 25-30 for mid, 40+ for high). These describe how the card will visually transform. Selection shown as a scrollable grid of modifier chips (e.g., "Crystalline armor," "Chaos veins," "Luminous eyes"). Player can pick 1-3 modifiers depending on tier.
3. **Channel selection** — Two buttons: "Channel toward Order" and "Channel toward Chaos." Each shows the probability (70/30). Brief text reminding the player what this influences (event attunement of the new modifier and triggered ability).
4. **Evolution animation** — The card dissolves into particles (chaos energy visual). The Planar Shard appears (visual quality matches tier: standard/refined/prismatic), cracks open, and the particles are drawn through it. The new card assembles from the other side. Full sound design moment — this should feel weighty and magical. AI image generation fires at the start of this animation and runs concurrently.
5. **Reveal: New card art** — The evolved card appears with new AI-generated art (image-to-image from the previous art, transformed by the player's chosen modifiers). Pause here to let the player absorb it. New art carries visible DNA from all previous evolution stages.
6. **Reveal: New card name** — 2-3 AI-generated name candidates are presented as tappable options. The player picks their favorite. The selected name fades in below the art while the previous name briefly shows crossing out or transforming (e.g., "Ashscale Wyvern" → "Ashscale Fury"). Generating multiple candidates is essentially free (~$0.0001 per call via GPT-4o Mini) and gives players ownership over their card's identity.
7. **Reveal: New triggered ability** — The ability earned from this evolution slides in. Shows whether it's an Order or Chaos trigger.
8. **Modifier selection** — Modifier options are presented based on subscription tier (Free: 2 options, Mid: 3, Top: 4). Each always includes at least 1 universal and 1 faction-exclusive option. Each shows:
   - Modifier name and flavor text (prewritten, from the global pool)
   - Base effect (always active)
   - Attuned bonus (and which event type it's attuned to)
   - If extra-powerful: the opposite-event penalty
   - The player taps one to select it. Selected modifier slides onto the card.
9. **Reveal: New flavor text** — AI-generated flavor text appears below the card, reflecting its transformation and history.
10. **Final presentation** — The fully evolved card with updated name, stats, all modifiers listed, and the new ability. "Save" button. Option to share a screenshot.

### Card Detail View

Accessible from Collection, Deck Builder, and by tapping a card in battle. The most information-dense screen — must be extremely well-organized.

**Layout:**

- **Top half** — Full card art, large. Card name, faction tag, evolution tier badge.
- **Bottom half** — Scrollable detail panel:
  - **Stats** — ATK / HP / Chaos Mote Cost. Clear, large numbers.
  - **Keywords** — Row of keyword icons with labels.
  - **Triggered abilities** — Listed with Order/Chaos icon indicating which event type activates them. Each shows the evolution step that granted it.
  - **Modifiers** — Listed vertically. Each modifier shows:
    - Name
    - Base effect
    - Attuned bonus (with Order/Chaos icon)
    - Penalty (if applicable, with opposite icon)
    - Tier badge (which evolution granted it)
  - **Evolution history** — Visual timeline showing each evolution step: Order or Chaos outcome, what ability was gained, what modifier was chosen.
  - **Card veterancy** — Games played, chaos energy progress toward next evolution, shard requirement.
  - **Instability contribution** — The instability value this card adds when on the field.

---

## 15. Player Profile

### Profile Screen

The player's public identity. Visible to opponents before and after matches.

**Layout:**

1. **Profile header:**
   - Player-chosen display name (unique, changeable with cooldown)
   - Current avatar (rendered large, with faction-themed frame and ambient effects)
   - Player level and XP bar
   - Current season rank badge and tier
   - Account age ("Playing since [month] [year]")

2. **Showcase — "Trophy Case":**
   - The player selects up to **3 cards** to display as their showcase. These are rendered as a horizontal row of cards, large enough to appreciate the art. Other players see this when viewing your profile.
   - Showcase cards have subtle idle animations — breathing particle effects matching their evolution history.
   - This is the primary self-expression feature outside of gameplay. Players choose cards they're proudest of — maybe their first Legendary, a card with a perfect modifier set, or one with art they love.

3. **Stats panel:**
   - Total games played
   - Win rate (overall and per faction)
   - Current win streak / best win streak
   - Cards evolved (total, and highest tier reached)
   - Favorite faction (most games played)
   - Most-played card (the card with the highest veterancy)
   - Season history — past season ranks displayed as a row of badges

4. **Faction mastery bars:**
   - One bar per faction the player has unlocked, showing mastery XP progress. Higher mastery unlocks faction-specific cosmetics and avatars.

5. **Achievement badges:**
   - Grid of earned achievement icons. Tap to see achievement name and description. Unearned achievements shown as locked silhouettes.

### Achievements

Achievements provide long-term goals and collection milestones. They award XP, cosmetics, and titles.

**Categories:**

- **Evolution** — "Evolve your first card to Uncommon," "Evolve a card to Legendary," "Evolve 10 cards to Rare," "Evolve a card with 4 Chaos evolutions," "Evolve a card with 4 Order evolutions," "Evolve a card with a 2/2 split."
- **Battle** — "Win your first game," "Win 100 games," "Win 10 games in a row," "Win a game at 1 HP," "Win a game without playing a spell."
- **Collection** — "Own 50 cards," "Own cards in 3 factions," "Own a card with 4 modifiers that are all the same attunement."
- **Chaos Roll** — "Roll a natural 1," "Roll a natural 20," "Trigger 5 Chaos Events in a single game," "Have a card with 3 attuned bonuses all active at once."
- **Social** — "Add a friend," "Win a friendly match," "View another player's profile."

### Titles

Earned through achievements or season rank. Displayed under the player's name. Examples: "Chaos Touched," "Order Warden," "Shard Breaker," "The Unbroken" (win 10 in a row).

---

## 16. Deck Builder

### Overview

The deck builder is where strategy crystallizes. It must make it easy to understand what a deck does, how it responds to Order vs. Chaos events, and where its strengths and weaknesses are.

### Deck Builder Screen Layout

**Top section — Deck Identity:**

- Deck name (editable, player-chosen)
- Faction selector (locked once any card is added — faction can only change by clearing the deck)
- Avatar selector (filtered to avatars matching the selected faction)
- Deck stats summary bar (see below)

**Left panel (or main area on iOS) — Deck contents:**

- Cards currently in the deck displayed as a scrollable list or compact grid.
- Each card shows: thumbnail art, name, tier badge, ATK/HP, chaos mote cost, and small icons for attunement breakdown (e.g., 3 Chaos-attuned modifiers shown as 3 small red dots, 1 Order as 1 blue dot).
- Cards sorted by mana cost (default), with options to sort by tier, ATK, HP, or name.
- Tap a card to view Card Detail. Long-press to remove from deck.
- Running count: "14/20 cards" displayed prominently.
- Legendary count: "1/2 Legendaries" when applicable.

**Right panel (or bottom sheet on iOS) — Card pool:**

- All cards in your collection for the selected faction that are NOT in the deck.
- Same compact card display as the deck panel.
- **Filter bar** with:
  - Card type (Creature / Spell / Stabilizer)
  - Evolution tier (Common through Legendary)
  - Mana cost range
  - Attunement leaning (mostly Order / mostly Chaos / balanced / any)
  - Keyword (has Shield, has Lifesteal, etc.)
- Tap a card in the pool to add it to the deck. If the deck is full, the card bounces back with a brief "Deck full" message.

### Deck Stats Summary

A persistent bar (or expandable panel) that updates live as you add/remove cards. This is the analytical core of the deck builder.

**Always visible (summary bar):**

- **Mana curve** — Tiny histogram showing card count at each mana cost (1-10). Instantly shows if the deck is too top-heavy or too low.
- **Attunement balance** — A simple horizontal bar: left side is Order (blue), right side is Chaos (red). Shows the aggregate attunement across all modifiers in the deck. A pure Order deck has a fully blue bar. A 50/50 hybrid is split down the middle.
- **Avg instability** — The average instability your board will contribute assuming 3-4 creatures out (based on each card's computed instability value). This helps the player understand how often they'll trigger Order vs. Chaos events with this build.
- **Card count** — X/20.

**Expandable (tap to open full stats):**

- **Trigger breakdown** — Total Order triggers across all cards vs. total Chaos triggers. Shows how much the deck benefits from each event type.
- **Modifier attunement breakdown** — Count of Order-attuned vs. Chaos-attuned modifiers across the deck.
- **Keyword distribution** — How many creatures have Shield, Lifesteal, Flying, etc.
- **Type distribution** — Creatures vs. Spells vs. Stabilizers.
- **Estimated instability range** — Low (1-2 creatures out) through high (4-5 creatures out) instability estimate based on deck composition and avatar modifier.

### Deck Slots

- **Free tier:** 3 deck slots.
- **Mid tier:** 6 deck slots.
- **High tier:** 10 deck slots.

Each slot saves the full deck including avatar selection. Players can duplicate a deck to iterate on it without losing the original.

### Deck Validation

The deck builder prevents invalid decks from being saved or queued:

- Fewer than 20 cards → "Need X more cards" warning.
- More than 2 copies of any card → prevented at add time.
- More than 2 Legendaries or 2 copies of a Legendary → prevented at add time.
- Mixed factions → prevented by faction lock.

Invalid decks cannot be used in matchmaking. They can be saved as work-in-progress with a "WIP" badge.

---

## 17. Collection Management

### Collection Screen

The player's full card library across all factions.

**Layout:**

- **Faction tabs** — Horizontal tabs at the top, one per unlocked faction. "All" tab to view everything. Active tab is highlighted with the faction's color palette.
- **Card grid** — Cards displayed as a scrollable grid of card thumbnails. Default 3 columns on phone. Each card shows: art, tier badge (colored border or corner), and a small evolution-ready indicator (glowing shard icon) if the card is eligible for evolution.
- **Sort options** — Tier (highest first), newest, most played, name, mana cost, ATK, HP.
- **Filter options** — Same filters as the deck builder: type, tier, mana cost, attunement leaning, keyword, evolution-ready, in-deck / not-in-deck.
- **Search bar** — Search by card name.

### Card Actions (from Card Detail)

- **Evolve** — Available when the card has enough chaos energy AND the player has the right shard. Navigates to Evolution Screen.
- **Add to Deck** — Opens a deck selector to add this card to an existing deck (if valid).
- **Dismantle** — Destroy a card to recover a fraction of its shard investment. Confirmation dialog with "Are you sure?" Dismantled cards are gone forever. Returns: Uncommon→nothing, Rare→Uncommon Shard, Epic→Rare Shard, Legendary→Epic Shard. (You get one tier below what was invested, creating a shard sink.)
- **Favorite** — Star a card. Favorited cards appear first in sorts and cannot be accidentally dismantled.
- **Share** — Generate a shareable image of the card (art + stats + evolution history) for social media.

### Collection Milestones

Small rewards for collection breadth:

- "Own 10 cards in [Faction]" → Faction-themed card back.
- "Own 25 cards in [Faction]" → Faction mastery XP bonus.
- "Own 50 Uncommon+ cards" → Cosmetic frame.
- "Own a Legendary in 2 different factions" → Title: "Multiversal."

---

## 18. Shop & Monetization UI

### Shop Screen

Clean, non-predatory, no dark patterns. The shop should feel like a curated boutique, not a casino.

**Sections (scrollable):**

1. **Subscription tiers** — Three clean cards showing Free / Mid / High tier. Each lists its benefits plainly. Current tier highlighted. Upgrade/downgrade buttons. No countdown timers, no "limited offer" pressure.

2. **Style packs** — Available premium styles displayed as cards showing a sample card in that style + the style's frame design. Each shows price and a "Preview" button that shows 5-6 sample cards in the style.

3. **Season pass** — Current season's pass with a preview of the reward track. Shows free vs. paid track rewards side-by-side so the player can see what they get either way.

4. **Cosmetics** — Card frames, card backs, and board skins. Each previewed on a sample card or board screenshot. Small individual prices.

5. **Shard bundles** — Direct purchase of Planar Shards. Priced to be less efficient than subscribing (subscriptions should feel like the better deal for active players). Available for players who want to accelerate a specific evolution without committing to a subscription.

**What the shop does NOT have:**

- Loot boxes or randomized purchases. You always know exactly what you're buying.
- "First purchase bonus" or manipulative conversion tactics.
- Currency obfuscation — real money prices are always shown. No intermediary premium currency.
- FOMO timers on core items (seasonal exclusives can be time-limited but are cosmetic only).

---

## 19. Matchmaking & Game Modes

### Ranked Mode

- Season-based ladder. Seasons last ~4-6 weeks.
- Ranks: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster.
- Each rank has 3 tiers (e.g., Gold 3 → Gold 2 → Gold 1 → Platinum 3).
- Win = gain rank points. Loss = lose rank points. Points needed per tier increase at higher ranks.
- Season rewards at end: Planar Shards (scaling with rank achieved), exclusive cosmetic frame for Gold+, exclusive card back for Diamond+, exclusive title for Master+.
- Matchmaking by rank with some allowance for queue times.

### Casual Mode

- No rank impact. Full card XP and chaos energy earned.
- Matchmaking uses a hidden MMR to keep games fair.
- Best for: testing new decks, playing with off-meta builds, daily mission grinding.

### Practice Mode

- Play against AI opponents.
- Difficulty levels: Easy, Medium, Hard, Brutal.
- AI uses pre-built decks from each faction at various power levels.
- Full card XP earned. Reduced chaos energy earned (50% of PvP rate) to incentivize real matches.
- No daily mission progress in Practice mode.

### Future Modes (Post-Launch)

- **Draft** — Open packs from a limited card pool, build a deck on the spot, play a short tournament. Rewards scale with wins.
- **Challenge** — Weekly rotating rule modifications. "All creatures have +2 instability," "Spells cost 1 less," "Chaos events trigger twice." Special rewards for completing the challenge.
- **Friendly** — Challenge a friend directly. No rewards, no rank, just fun.

---

## 20. Social Features

### Friends List

- Add friends by display name or friend code (short unique code).
- See friends' online status, current rank, and active style.
- Tap a friend to view their Profile (showcase, stats).
- Challenge a friend to a Friendly match.

### Post-Match Screen

After every game:

1. **Result** — Win/Loss with XP and reward breakdown.
2. **Card XP gains** — Which cards earned chaos energy this game. If any card is now evolution-ready, a glowing "Ready to Evolve!" indicator appears. Tapping it goes directly to the Evolution Screen.
3. **Opponent's profile card** — Opponent's name, rank, avatar, and showcase. "Add Friend" button.
4. **"Play Again" button** — Re-queues with the same deck. Minimal friction to stay in the loop.

### Spectating & Replays (Post-Launch)

- Watch friends' live games.
- Save and replay your own games.
- Share replay links.

These are post-launch features but the architecture should account for them (game state logging).

---

## 21. Onboarding & Tutorial

### First Launch Flow

1. **Intro cinematic** — Short (30-60 second) motion graphic / illustrated sequence establishing the lore. The world, the chaos rifts, the transformation. Skippable.
2. **Choose your starter faction** — The three factions are presented with sample cards and a brief personality description. This is the player's first meaningful choice. The player gets a starter deck in their chosen faction.
3. **Tutorial match** — A guided game against AI that teaches:
   - Playing creatures and spells
   - The chaos roll and how instability works
   - Attacking and blocking
   - How Order and Chaos events affect the board
   - How modifier attunement works (one creature in the starter deck has an Uncommon modifier to demonstrate)
4. **First evolution** — The tutorial awards enough chaos energy and a shard to immediately evolve one card from the starter deck. Walks through the full evolution flow: channeling choice, new art reveal, modifier selection.
5. **Deck builder tour** — Brief overlay highlighting key features when the player first opens the deck builder.
6. **Release to home screen** — Player is now free to explore. Daily missions are already populated.

### Starter Deck Composition

Each faction's starter deck is a pre-built 20-card deck with:

- 14 Common creatures (variety of mana costs)
- 4 Common spells (1 removal, 1 buff, 1 heal, 1 draw)
- 2 Common stabilizer/manipulation cards (1 Order-leaning, 1 Chaos-leaning)

Plus a handful of additional cards not in the deck (so the player has something to swap in from the collection immediately).

The starter deck is deliberately imperfect — good enough to play, obviously improvable. This teaches the player that deckbuilding matters.

---

## 22. Audio Design

### Music

- **Main menu / Home** — Ambient, atmospheric. Low-key tension. Style-neutral.
- **Deck builder / Collection** — Calm, contemplative. Slightly more melodic. Players spend time here thinking.
- **Battle** — Dynamic intensity. Builds as the game progresses. Shifts tone on Chaos vs. Order event triggers (brief musical stings: dissonant for Chaos, harmonic for Order).
- **Evolution** — Ritual atmosphere. Building tension during the channel, climactic swell on the reveal.

Each faction optionally overrides the battle music with its own theme. The Demonic Kingdoms gets ominous orchestral. The Ironwright Collective gets driving industrial. The Fey Courts gets ethereal woodwind and strings.

### Sound Effects (Priority Asset Purchases)

These are where the $100 budget should go first:

- **D20 roll** — Physical, weighty. Rattling, bouncing, landing with a satisfying thud. Different landing sounds for low vs. high rolls.
- **Chaos Event trigger** — Crackling, electric, unstable. Brief and impactful.
- **Order Event trigger** — Crystalline chime, harmonic tone. Clean and sharp.
- **Card play** — Satisfying "place" sound. Weight proportional to mana cost.
- **Attack** — Impact sound. Varies by creature type if possible.
- **Damage to HP** — Visceral thud/crack.
- **Creature death** — Brief dissolution sound.
- **Evolution reveal** — Magical transformation sound. The most elaborate SFX in the game.
- **Modifier selection** — Click/lock sound when choosing a modifier.
- **UI navigation** — Subtle taps and swooshes. Should never be annoying.

---

## 23. Accessibility

- **Colorblind modes** — Order (blue) and Chaos (red) visual treatments must have non-color alternatives. Icons, patterns, or labels that distinguish them without relying on color alone. All attunement indicators use icon shapes in addition to color.
- **Text scaling** — Support system font size settings. Card text must remain readable at larger sizes (may require scrollable card detail).
- **Reduced motion** — Option to minimize particle effects, screen shake, and animation intensity. Chaos roll still animates but without excessive spinning/bouncing.
- **Screen reader basics** — Cards and UI elements have accessible labels. Battle state can be read aloud. This is aspirational for MVP but the architecture should support it.
- **One-handed play** — All critical battle interactions must be reachable in portrait mode with thumb-only input. No essential controls in the top corners.
- **Turn timer** — Generous default (60 seconds). Extended timer option in settings for players who need more time.

---

## 24. Settings

Accessible from the Profile tab or a gear icon in the header.

**Account:** Display name, linked Apple ID, friend code, data export, delete account.

**Audio:** Master volume, music volume, SFX volume, mute all toggle.

**Visuals:** Reduced motion toggle, colorblind mode (off / deuteranopia / protanopia / tritanopia), card animation quality (full / reduced / minimal), screen shake toggle.

**Gameplay:** Turn timer preference (standard 60s / extended 90s — only applies in Casual and Practice; Ranked always uses standard), auto-end turn when no actions available (on/off), confirm before ending turn (on/off).

**Notifications:** Daily reward reminders, evolution-ready alerts, friend activity, season ending reminders. All individually toggleable. Default: daily rewards on, everything else off. Non-aggressive defaults.

**Privacy:** Block friend requests, hide profile from non-friends, hide online status.

---

## 25. Open Design Questions

- [x] ~~Full Order and Chaos event lists~~ — 8 Order + 8 Chaos events fully designed with effects, targeting, and design notes (see `01-battle-mechanics.md` Sections 8-9).
- [x] ~~Complete keyword list and interaction rules~~ — 7 keywords with full interaction matrix (see `01-battle-mechanics.md` Section 3)
- [x] ~~Exact stat ranges by evolution tier~~ — Proportional PP scaling defined (see `01-battle-mechanics.md` Section 1)
- [x] ~~Full modifier pool structure~~ — 240 modifiers across 12 pools × (universal + 3 factions). Individual definitions pending.
- [x] ~~Avatar instability values~~ — 6 avatars defined with exact instability modifiers (see Section 10 above).
- [x] ~~Avatar names and instability values~~ — names and gameplay values locked. Visual designs are parallel content work.
- [x] ~~Evolution chaos energy thresholds~~ — Exact values: 15/30/50/75 energy. 2 per win, 1 per loss. ~113 games to Legendary (see Section 4).
- [x] ~~Stabilizer/manipulation card designs~~ — 5 board stabilizers + 2 manipulation spells defined with costs, HP, and effects (see `01-battle-mechanics.md` Section 11).
- [x] ~~Spell framework~~ — 5 spell categories defined, design constraints locked, Chaos Spark ruling confirmed (see `01-battle-mechanics.md` Section 10).
- [x] ~~Prompt template architecture~~ — AI model choices locked in (Section 13a). Detailed prompt templates still needed in `03-prompt-templates.md`.
- [x] ~~Card data model and schema~~ — Complete with faction support (see `02-card-data-model.md`)
- [x] ~~Card trading~~ — No trading. Self-contained collections. No real money on individual cards.
- [x] ~~Modifier pool and selection system~~ — PP-based pools with subscription-tiered selection depth.
- [x] ~~Faction system~~ — 3 launch factions with exclusive mechanics (Augment/Bond/Corruption).
- [x] ~~Card acquisition economy~~ — Chaos Dust currency, card packs, onboarding flow (see `01-battle-mechanics.md` Section 12).
- [ ] Draft/sealed format design
- [ ] Anti-cheat and generation abuse prevention
- [ ] Analytics and telemetry plan
- [ ] Card back designs per faction
- [ ] Board/battlefield skin system
- [ ] Emote or communication system during battle (pre-set phrases? stickers? nothing?)
- [x] ~~Chaos Spark ruling~~ — Yes, counts as a spell cast. Triggers "when you play a spell" abilities. Cannot be mulliganed.
- [ ] Season length and reward track design
- [ ] AI opponent deck lists and difficulty scaling for Practice mode
- [ ] Visual prompt modifier lists by tier (8-10 free, 25-30 mid, 40+ high) — exact modifiers to define
- [ ] AI generation fallback and error handling edge cases
- [ ] FLUX Kontext denoising strength values for Order vs. Chaos evolutions
- [x] ~~Turn structure~~ — Full phase-by-phase specification with blocking rules, timer rules, keyword interactions, and worked example (see `01-battle-mechanics.md` Section 3).
- [ ] Trial deck card lists (20 Commons × 3 factions)
- [ ] Full modifier content authoring (240 individual definitions)
- [x] ~~Triggered ability framework~~ — 7 trigger types, 8 effect types, 11 targeting rules, 4 duration types, power scaling by tier, resolution order (see `01-battle-mechanics.md` Section 7).

---

## 26. Decisions Log

Tracking confirmed design decisions and when they were made, for reference.

| Decision | Details | Status |
|---|---|---|
| Modifier structure | Base effect (always active) + attuned bonus (matching event type) + optional penalty (opposite event type for extra-powerful modifiers) | ✅ Confirmed |
| Modifier selection | Draw from PP-based pools. Free: pick 1 of 2 (1 universal + 1 faction). Mid: pick 1 of 3. Top: pick 1 of 4. | ✅ Confirmed |
| Cards have no alignment labels | Cards are defined by their trigger/attunement profile, not tagged Order or Chaos | ✅ Confirmed |
| No summoning sickness | Creatures attack the turn they're played | ✅ Confirmed |
| Instability formula | Avatar modifier + sum of all board creatures' instability values. Each creature's instability = base_instability + evolution changes + modifier adjustments (clamped min 0). Player instability clamped 1-20. | ✅ Confirmed |
| Modifiers CAN adjust instability | Modifiers can include +/- instability adjustments, costing PP from the modifier budget. | ✅ Confirmed |
| Chaos mote cost is fixed | CM cost never changes through evolution. Only stats and modifiers increase. | ✅ Confirmed |
| Proportional PP scaling | PP_at_tier = base_PP × tier_multiplier. 1.0× at Common → 3.0× at Legendary. | ✅ Confirmed |
| Three launch factions | Ironwright Collective (Augment), The Fey Courts (Bond), The Demonic Kingdoms (Corruption) | ✅ Confirmed |
| Faction-exclusive modifiers | Each faction has 48 modifiers (4 per pool × 12 pools) that reference the faction's exclusive mechanic | ✅ Confirmed |
| No real money on individual cards | Subscriptions only. Cards earned via Chaos Dust (gameplay currency). | ✅ Confirmed |
| Chaos Dust economy | Single in-game currency for cards, shards, avatars. Earned from games, quests, milestones. | ✅ Confirmed |
| Cross-faction unlocking | Buy a 150-Dust card pack from another faction to unlock it permanently. | ✅ Confirmed |
| Onboarding: trial decks | Player tries 3 faction trial decks (20 Commons each), commits to one. | ✅ Confirmed |
| Paid asset budget | Under $100 total for particles, SFX, and similar polish assets | ✅ Confirmed |
| Visual philosophy | Clean and stylish, Balatro/Slay the Spire tier, not Hearthstone AAA | ✅ Confirmed |
| MVP approach | iOS only via Xcode Cloud | ✅ Confirmed |
| Evolution probability | 70/30 split when channeling toward Order or Chaos | ✅ Confirmed |
| Deck size | 20 cards, max 2 copies, max 2 Legendaries (1 copy each) | ✅ Confirmed |
| Board size | 5 creature slots per side | ✅ Confirmed |
| Life total | 20 HP | ✅ Confirmed |
| Starting hand | 4 cards, 1 free mulligan | ✅ Confirmed |
| No deck-out loss | Empty deck = you just stop drawing. No mill strategies. | ✅ Confirmed |
| Per-player instability display | Each player's instability shown on their side of the board, not shared in center | ✅ Confirmed |
| Second player compensation | 5-card opening hand + Chaos Spark (free +1 mana spell) | ✅ Recommended |
| Turn timer | 60 seconds for decision phases, auto-end at 0 | ✅ Recommended |
| Surrender | Available after turn 2, behind menu + confirmation dialog | ✅ Recommended |
| Disconnect handling | Timer keeps running, 3 missed turns = auto-forfeit | ✅ Recommended |
| Opponent info visibility | Mana, hand count, deck count, instability all visible | ✅ Recommended |
| Spell targeting | Drag spell to board → valid targets highlight → tap to confirm | ✅ Recommended |
| Evolution art: image-to-image | FLUX Kontext takes current card art as input + prompt modifiers describe transformation. Art evolves visually, not regenerated from scratch. | ✅ Confirmed |
| AI image model | FLUX Kontext Dev (free), FLUX Kontext Pro (subscribers) via fal.ai. Same model family = visual cohesion across tiers. | ✅ Confirmed |
| AI text model | GPT-4o Mini for card names and flavor text (batch + live evolution). Chosen for cost efficiency on simple creative text tasks. | ✅ Confirmed |
| Card names evolve | AI generates a new name at each evolution step. CardInstance has `current_name` separate from template. | ✅ Confirmed |
| Prewritten content | Modifier names, triggered ability descriptions, event flavor text — all prewritten for consistency and zero battle latency. | ✅ Confirmed |
| No freeform prompt control | All tiers pick from curated visual prompt modifier lists. No typing. Prevents abuse, ensures quality. | ✅ Confirmed |
| Planar Shard quality tiers | Planar (free), Refined (mid), Prismatic (high). Determines resolution, model variant, visual modifier pool size, and generation passes. | ✅ Confirmed |
| No AI calls during battle | Event text prewritten. Zero API latency risk in gameplay. | ✅ Confirmed |
| 7 keywords | Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing | ✅ Confirmed |
| Combat model | MTG-style: declare attackers → defender assigns blockers → simultaneous damage. 1-to-1 blocking (no gang blocking). | ✅ Confirmed |
| Spell timing | Main phase only (Hearthstone model). No response windows during combat. Fast, clean, iOS-friendly. | ✅ Confirmed |
| P1 skips attack turn 1 | Player 1 cannot attack on their first turn. Standard first-player balance tool. | ✅ Confirmed |
| Taunt = forced attack + forced block | Opponent must declare min 1 attacker per Taunt you control. Your Taunts must block if able. Scales with count, countered by Flying/spells/disposable attackers. | ✅ Confirmed |
| Simultaneous combat damage | Both attacker and blocker deal damage at the same time. No "first strike" or sequential damage. | ✅ Confirmed |
| Attunement persists between rolls | Attunement state (which bonuses are active) persists until the player's next chaos roll. Does not change during opponent's turn. | ✅ Confirmed |
| Defender gets own timer | Defending player gets their own 60-second timer for blocking decisions. | ✅ Confirmed |
| Mutual kill = active player loses | If both players reach 0 HP simultaneously, the active player (attacker) loses. | ✅ Confirmed |
| 8 Order events | Mending Light, Planar Ward, Steady Growth, Clarity, Fortify, Sanctuary, Bulwark, Harmonize. Predictable targeting, modest power, compounding. | ✅ Confirmed |
| 8 Chaos events | Surge, Wildfire, Upheaval, Frenzy, Rift Bolt, Chaos Siphon, Maelstrom, Overcharge. Random targeting, high power, 3/8 can backfire. | ✅ Confirmed |
| 7 trigger types | ON_ORDER, ON_CHAOS, ON_PLAY, ON_DEATH, ON_DAMAGE_TAKEN, ON_ATTACK, ON_BLOCK. | ✅ Confirmed |
| Triggered ability resolution: left-to-right | Multiple abilities fire slot 1→5. Dead creatures don't fire. | ✅ Confirmed |
| Spells: main phase only, no evolution | Spells are static cards. 5 categories: Buff, Damage, Face Damage, Heal, Utility. ~15-20 per faction. | ✅ Confirmed |
| Chaos Spark = spell | Costs 0, grants +1 mana, counts as spell cast. Cannot be mulliganed. | ✅ Confirmed |
| Stabilizers: have HP, no ATK, can't attack/block | Occupy creature slots. Continuous aura effects. Can be destroyed. 0 base instability. Don't evolve. | ✅ Confirmed |
| 5 stabilizers + 2 manipulation spells at launch | Chaos Anchor, Warding Pillar, Chaos Rift, Entropy Engine, Void Lens (board) + Binding Ward, Entropy Spike (spells). All universal. | ✅ Confirmed |
| 6 launch avatars | Aldric (-5), Vex (-2), Sylara (-5), Morrigan (-1), Kael (-4), Lilith (-2). 2 per faction. No balanced option at launch. | ✅ Confirmed |
| Evolution energy: exact values | 15/30/50/75 energy per tier. 2 per win, 1 per loss. All 20 deck cards earn simultaneously. ~113 games to Legendary. | ✅ Confirmed |
| Energy for all deck cards | All 20 cards in deck earn energy per game, whether drawn or not. Avoids optimization of only playing unique cards. | ✅ Confirmed |

---

## 27. Document Index

| File | Contents | Status |
|---|---|---|
| `00-game-design-master.md` | This document — all systems, UI, and design decisions | ✅ Active |
| `01-battle-mechanics.md` | PP scaling, instability, turn structure & combat (full spec), keywords (MTG-style + Taunt), factions (Augment/Bond/Corruption), modifier pools, triggered abilities (7 trigger types, full framework), Order events (8, fully designed), Chaos events (8, fully designed), spell framework, stabilizer framework (5 board + 2 spells), stat ranges, card acquisition, balance rules | ✅ Complete |
| `02-card-data-model.md` | Card schema, modifier schema (with faction/PP pool fields), evolution tracking, attunement data, faction entity, game state, player model (with Chaos Dust + faction fields), match records, data flow operations | ✅ Complete |
| `03-prompt-templates.md` | Prompt architecture, FLUX Kontext prompt construction, GPT-4o Mini faction voice prompts, evolution art prompts, subscriber visual modifier lists by tier | 🔲 Not started |
| `04-progression-economy.md` | XP curves, drop rates, Chaos Dust economy math, quest design | 🔲 Not started |
| `05-content-pipeline.md` | Batch generation tooling, QA, seasonal releases | 🔲 Not started |
| `06-technical-architecture.md` | System design, APIs, data flow, infra | 🔲 Not started |
| `07-ui-ux-specs.md` | Wireframes and interaction specs (detailed from Section 14 of this doc) | 🔲 Not started |
| `08-audio-design.md` | Music, SFX, per-faction audio themes | 🔲 Not started |
| `09-monetization-details.md` | Subscription tiers, pricing, Chaos Dust economy, conversion funnels | 🔲 Not started |
| `10-prd.md` | Formal PRD for engineering handoff | 🔲 Not started |
| `11-claude-code-agents.md` | Sub-agent task breakdown for Claude Code | 🔲 Not started |

---

## Revision Log

| Date | Change | Section(s) |
|---|---|---|
| 2026-02-16 | Platform-alignment pass: updated Section 13 infrastructure table from "React Native / Flutter / PWA with Phaser.js" to "Native iOS app (Swift + SwiftUI + SpriteKit)"; changed image gen provider from "Replicate or Fal.ai" to "fal.ai"; updated platform from "iOS primary, web prototype first" to "iOS only (Swift/SwiftUI/SpriteKit) via Xcode Cloud"; replaced "React Native / Flutter UI" with "Swift + SwiftUI"; replaced "Phaser.js, PixiJS, or CSS" particle references with "SpriteKit"; updated animation references from "CSS transforms, Lottie" to "SpriteKit actions"; changed Decisions Log entries: MVP approach to "iOS only via Xcode Cloud", AI image model provider to "fal.ai", spell timing to "iOS-friendly"; updated generic "mobile" references to "iOS" or "iOS mobile" throughout Sections 8, 14, 16, and 26. No game mechanics, numbers, or design decisions were changed. | 13, 13a (MVP Visual Approach), 8, 14, 16, 26 |

# Chaos Creatures — Faction Expansion + Overhaul Master Plan

> **FIRST ACTION**: Copy this plan to `docs/design/PLAN-faction-expansion.md` as the persistent, version-controlled copy. Keep both updated.

---

## Status Log

| Date | Phase | Status | Notes |
|---|---|---|---|
| 2026-02-18 | Planning | COMPLETE | Plan approved by user |
| 2026-02-18 | Phase 0 | COMPLETE | CLAUDE.md updated, plan copied, memory updated |
| 2026-02-18 | Phase 1 | READY | 5 parallel agents: lore, mechanics, ruins, UI/UX, art |

---

## Context

Expanding from 3 → 5 factions, retheme Ironwright, add Planar Ruins card type, add 2 keywords, trim sub-factions, create lore bible, update all code/docs/art. LoRA training moved to end.

---

## Table of Contents

1. [New Factions](#new-factions)
2. [Ironwright Retheme](#ironwright-retheme)
3. [Sub-faction Trimming](#sub-faction-trimming)
4. [New Keywords](#new-keywords)
5. [Planar Ruins System](#planar-ruins-system)
6. [Color Palette](#color-palette)
7. [Universe Lore](#universe-lore)
8. [Avatars](#avatars)
9. [Purchasable Assets ($100)](#purchasable-assets)
10. [Phase 0: CLAUDE.md](#phase-0)
11. [Phase 1: Creative Foundation](#phase-1)
12. [Phase 2: Core Docs](#phase-2)
13. [Phase 3: Downstream Docs + Audits](#phase-3)
14. [Phase 4: Code Changes](#phase-4)
15. [Phase 5: Art + Assets](#phase-5)
16. [Phase 6: LoRA Training](#phase-6)
17. [Phase 7: Final Audit](#phase-7)
18. [Audit Agents](#audit-agents)
19. [Task Agents](#task-agents)
20. [Systems Checklist](#systems-checklist)
21. [Checkpoints](#checkpoints)
22. [Verification](#verification)

---

## New Factions

### The Celestial Crusade

- **Theme**: Self-righteous divine crusaders, superior to all non-celestials, holy war for dominion
- **Mechanic**: **Exalt** — aura effects benefiting all creatures when board conditions met. Go-wide formation play.
- **Weakness**: Board wipes collapse bonuses; targeted removal of Exalt sources
- **Sub-factions**:
  1. **Knights of Deliverance** — stoic paladins, divine armor, formation discipline. Military arm.
  2. **Heaven's Chosen** — biblically-accurate multi-winged, multi-eyed celestials. Divine arm.
- **Colors**: Holy gold (#DAA520), divine ivory (#F5F0E1), righteous blue (#3B5998), celestial rose (#C47A8E), bg (#1A1520)
- **Art refs**: Gustave Dore biblical illustrations, William Blake visionary paintings (died 1827 — PD)
- **Particle**: `divine_radiance`

### The Endless

- **Theme**: The undead — raised, summoned, abandoned. Unnatural, relentless.
- **Mechanic**: **Persist** — death triggers and lingering effects. Every kill is pyrrhic.
- **Weakness**: Fast aggro; effects preventing death triggers
- **Sub-factions**:
  1. **Necromantic Cabals** — necromancers and liches raising armies, creating abominations. Liches are the power brokers who summon, bind, and command. Robed figures, bone constructs, phylacteries.
  2. **The Lost Spectres** — ghosts and spectres summoned and abandoned by liches who no longer care. Ethereal, translucent, tragic. Includes spectral entities liches released or lost control of.
- **Colors**: Necrotic purple (#6B3FA0), bone white (#E8DCC8), ghostly teal (#5F9EA0), sickly green (#7B9E5F), bg (#0D0D1A)
- **Art refs**: Gustave Dore Inferno etchings, Francisco Goya "Black Paintings" (died 1828 — PD)
- **Particle**: `spectral_mist`

---

## Ironwright Retheme

**Victorian steampunk → Brutalist space-industrial empire.** A machine empire conquering the stars through industry and efficiency of war. Massive orbital shipyards, star-harvesting factories, void-faring siege engines. Exposed rebar, poured concrete, rusted iron, hydraulic pistons. Space conquest through brutal industrial efficiency.

- **Colors**: Steel blue-gray (#6B7B8D), cold iron (#4A5568), warning orange (#E07020), reactor blue (#3B82C4), bg (#1A1D23)
- **Art refs**: Piranesi "Carceri d'invenzione" (died 1778 — PD) + John Martin
- **NOT**: brass, gears, steam, clockwork, Victorian. **IS**: concrete, iron, hydraulics, rebar, void industry, star conquest, orbital machinery
- **Creatures**: Walking siege engines, orbital automatons, rebar golems, concrete leviathans, void-forge dreadnoughts, star-harvester mechs
- **Environments**: Orbital shipyards, void-dock scaffolding, planetary strip-mines, star-forge interiors, re-entry corridors, gravity-well factories
- **Sub-factions**:
  1. **The Foundry Directorate** — centralized command. Purpose-built, geometric, blueprinted. Order-aligned.
  2. **The Scrap Legions** — self-assembled from battlefield wreckage across conquered worlds. Patchwork, jury-rigged. Chaos-aligned.

---

## Sub-faction Trimming

All factions: 10-13 → 2 sub-factions each.

- **Fey Courts**: The Verdant Throne (bright, growth, Spring/Summer) + The Hollow Court (dark, frost, Autumn/Winter)
- **Demonic Kingdoms**: The Furnace Lords (wrath, volcanic) + The Obsidian Bureaucracy (schemes, contracts)

---

## New Keywords (7 → 9)

- **Haste** — creature can attack the turn it's played. Tempo, aggression. Counter: Shield, Taunt.
- **Ward** — can't be targeted by opponent's modifier effects for 1 turn after deployment. Counter: combat damage, AoE.

Faction keyword affinities:
- Celestial: Shield, Ward, Taunt (protective formation)
- Endless: Lifesteal, Deathtouch, Haste (aggressive attrition)

---

## Planar Ruins System (NEW CARD TYPE)

### Concept

Planar Ruins are a new card type — ancient structures found in the Plane of Chaos by explorers who ventured through the rifts when the planes fractured. Built by a civilization that vanished ages ago. The ruins stabilize the chaotic energy around them, creating pockets where beings of both Order and Chaos can survive.

### Battlefield Role

- **Takes a creature slot** on the battlefield (limits creature board presence — strategic tradeoff)
- **High HP, zero ATK** (unless a specific ruin has a damaging effect by nature)
- **Provides a passive benefit** to the controlling player's creatures while on the field
- **Can be attacked and destroyed** by opponent's creatures
- **Destruction penalty**: When destroyed, causes a negative effect on its own side for 1 turn

### Evolution: Neutral → Faction-Specific

- Ruins start as **neutral** — ancient, unclaimed structures usable in any deck
- After enough battles (familiarity threshold, same as creature evolution energy), a neutral ruin can be **evolved once** into a **faction-specific** ruin
- Evolution effect selection uses the same subscription tier system: Free (2 options), Mid (3), Top (4)
- Once evolved, the ruin is **faction-locked** — can only be played in that faction's deck
- Evolved ruins have **stronger, faction-complementary effects** and **faction-themed destruction penalties**

### Neutral Ruin Effects (examples — `planar-ruins-designer` will finalize)

Generic bonuses available to any faction:
- **Stabilization Aura**: +1 HP to all friendly creatures
- **Planar Regeneration**: Heal 1 HP to a random friendly creature at start of turn
- **Chaos Dampener**: Reduce the first incoming damage each turn by 1
- **Temporal Anchor**: Draw an additional card every 3 turns
- **Mote Collector**: Gain +1 evolution energy on all creatures after each battle this ruin survives

### Faction-Evolved Ruin Effects (examples — complementary to faction mechanics)

| Faction | Mechanic | Ruin Synergy Effect (example) |
|---|---|---|
| Ironwright | Augment | "Each Augment modifier on nearby creatures provides +1 additional stat" |
| Fey Courts | Bond | "Bond effects between creatures trigger an additional time" |
| Demonic | Corruption | "Corruption sacrifice costs reduced by 1 resource" |
| Celestial | Exalt | "Exalt thresholds require 1 fewer creature to activate" |
| Endless | Persist | "Persist death triggers activate twice" |

### Destruction Penalties

**Neutral**: Generic (all creatures lose 1 HP / skip next draw / -1 ATK for 1 turn)
**Evolved** (faction-specific, thematically tied to the faction's mechanic being disrupted):
- **Ironwright**: All Augment modifier stacks reduced by 1 for 1 turn
- **Fey**: All Bond connections severed for 1 turn
- **Demonic**: Take 3 direct damage to player
- **Celestial**: All Exalt auras suppressed for 1 turn
- **Endless**: All Persist effects silenced for 1 turn

### Deck Building Rules

- **Max ruins in deck**: 2-3 (to be balanced by designer)
- **Max on field**: 1 at a time (takes a creature slot — having 2 would be too strong + too few creature slots)
- **Playing a ruin**: Costs CM (chaos motes) like any card. Played during main phase.
- **Mixed decks**: Neutral ruins go in any deck. Evolved ruins only in matching faction deck.

### Art Requirements

**Neutral ruins**: Ancient, mysterious architecture. Partially ruined but stable. Mix of stone and crystalline/planar materials. Pale, otherworldly colors — not belonging to any faction. Palette knife oil painting style matching all other art.

**Faction-evolved ruins** (same structure, transformed by faction aesthetic):
- **Ironwright**: Covered in brutalist machine additions, rebar reinforcement, industrial plating, reactor glow
- **Fey**: Overgrown with living flora, bioluminescent moss, root systems, flowers
- **Demonic**: Corrupted with hellfire, obsidian growths, blood-red runes, chains
- **Celestial**: Purified with golden light, divine inscriptions, angelic statues, halos
- **Endless**: Haunted, spectral energy, bone additions, necromantic symbols, ghostly mist

### Flavor Text

- **Neutral**: Who discovered it, how they found it, what ancient purpose it might have served
- **Evolved**: What the faction now uses it for, how they claimed it, what they see in it

### Data Model Impact

- Add `PLANAR_RUIN` to CardType enum
- Ruin template table: `ruin_templates` (id, name, neutral_effect_id, hp, cm_cost, art_url, flavor_text)
- Ruin effect table: `ruin_effects` (id, ruin_template_id, faction_id NULL for neutral, effect_description, destruction_penalty)
- Player ruin collection: `player_ruins` (player_id, ruin_template_id, is_evolved, faction_id, chosen_effect_id, evolution_energy)
- Battle state: ruin occupies a creature slot, tracked in match state

### Card Count for Launch

- **6-8 neutral ruin archetypes** (distinct structures with different neutral effects)
- **Each evolves into 5 faction variants** = 30-40 evolved variants total
- **Each variant needs**: unique art, effect, destruction penalty, flavor text
- Total ruin art: 6-8 neutral + 30-40 evolved = ~45 images

---

## Color Palette Philosophy

Colors express faction identity within the palette knife oil painting aesthetic. Vivid, saturated colors are encouraged — they're applied with thick impasto strokes, not digital gradients. Color adds variety and makes factions instantly recognizable.

---

## Universe Lore (High-Level)

Galaxy of races coexisting across planes. Five factions hold incompatible visions for reality. War escalates → fractures barrier between Plane of Order and Plane of Chaos. Chaos motes now transform creatures. Players channel chaos through Planar Shards. Evolution is unpredictable.

The ancient civilization that built the Planar Ruins predates all current factions. They may have been the original inhabitants of the Plane of Chaos, or visitors from yet another plane. Their ruins are the only structures that can stabilize chaotic energy, making them invaluable strategic assets.

**Faction core beliefs**:
- **Ironwright**: Reality is raw material. Conquer, mine, build. Efficiency is the only morality.
- **Fey Courts**: Reality is alive and sacred. Growth over construction. Natural order preserved.
- **Demonic**: Reality is fuel. Consume for power. Everything burns.
- **Celestial**: Reality belongs to the divine. All others are lesser.
- **Endless**: Reality is temporary. Only death endures.

---

## Avatars

10 total (1 per sub-faction). Name, title, backstory, instability modifier, play style, art prompt.

- Ironwright: 2 new (brutalist space-industrial)
- Fey: Adapted from Sylara (Verdant Throne) + Morrigan (Hollow Court)
- Demonic: Adapted from Kael (Obsidian Bureaucracy) + Lilith (Furnace Lords)
- Celestial: 2 new
- Endless: 2 new

---

## Purchasable Assets ($100 budget)

| Category | Budget | Sources |
|---|---|---|
| Card game SFX (attack, damage, death, draw, flip) | $15-20 | itch.io, Sonniss GDC |
| Battle music (5 faction themes + ambient) | $25-35 | itch.io, composers |
| UI sounds (clicks, transitions, popups) | $10-15 | itch.io UI packs |
| Particle textures (fire, ice, divine, spectral) | $5-10 | itch.io VFX, OpenGameArt |
| Environmental ambience | $5-10 | Freesound.org, itch.io |
| Buffer | $15-20 | — |

Criteria: Commercial license, royalty-free, perpetual. Prefer no-attribution. Quality matching premium art direction.

---

## Phase 0: CLAUDE.md Foundation Update {#phase-0}

**WHY FIRST**: CLAUDE.md is the source of truth all agents read. Must reflect 5 factions, 9 keywords, Planar Ruins, rethemed Ironwright before any agent launches.

**Changes**:
- Copy this plan to `docs/design/PLAN-faction-expansion.md`
- Faction list: 3 → 5 (Celestial Crusade, The Endless)
- Ironwright: steampunk → brutalist space-industrial empire
- Keywords: 7 → 9 (Haste, Ward)
- Mechanics: Add Exalt, Persist
- New card type: Planar Ruins
- Sub-factions: 2 per faction, 10 total
- Avatars: 6 → 10
- Art refs: Add Blake, Goya, Piranesi
- Protected files: Authorized for expansion edits
- Color palette: Vivid faction colors OK within oil painting aesthetic
- New docs: 11-lore-bible.md, 12-art-direction.md
- Current phase: Faction expansion overhaul

---

## Phase 1: Creative Foundation {#phase-1}

**5 parallel agents**:

### Agent 1A: `lore-bible-writer`

Output: `docs/design/11-lore-bible.md`

1. Universe History — The Great Fracture timeline
2. The Ancient Builders — the vanished civilization that created the Planar Ruins
3. Faction Histories (×5) — origin, philosophy, war goals, current state
4. Sub-Faction Profiles (×10) — lore, visual identity, locations, beliefs
5. Avatar Profiles (×10) — name, title, backstory, personality, instability modifier, play style, art prompt
6. Inter-Faction Dynamics — 5×5 relationship matrix
7. Flavor Text Voice Guide — tone, vocabulary, examples per faction
8. Prompt Templates — GPT-4o Mini templates for names, flavor text, evolution narratives, lore snippets, ruin discovery stories

### Agent 1B: `mechanic-designer`

1. 28 Celestial modifiers (CF01-CF28) — PP costs, effects, attunements, visual prompts
2. 28 Endless modifiers (EF01-EF28)
3. 28 rethemed Ironwright modifiers (IF01-IF28)
4. Haste + Ward keyword rules and all keyword interactions (9×9 matrix)
5. Starter decks for Celestial and Endless (20 cards each)
6. Balance analysis: 5 mechanics × 9 keywords

### Agent 1C: `planar-ruins-designer`

Full Planar Ruins system design:
1. **6-8 neutral ruin archetypes** — names, HP values, CM costs, neutral effects, visual descriptions, discovery lore
2. **5 faction evolution paths per ruin** (30-40 evolved variants) — faction-specific effects, destruction penalties, evolution flavor text
3. **Balance design** — max per deck, max on field, CM cost curve, familiarity thresholds
4. **Turn structure integration** — when ruins are played, how they interact with combat, targeting rules
5. **Art prompt templates** — neutral ruin style guide + faction-specific evolution transformation prompts
6. **Ruin effect pool design** — 2/3/4 effect options per subscription tier for each evolution
7. **Data model spec** — tables, enums, relationships needed

### Agent 1D: `ui-ux-designer`

1. Card visual design for 5 factions + Planar Ruins card layout
2. User journey: download → onboarding → faction pick → first game → daily loop → first purchase
3. 5-faction picker redesign
4. Ruin collection, evolution, and battlefield UI
5. Collection & deck builder for creatures + ruins
6. Shop/IAP layout for 5 factions
7. Screen-by-screen audit
8. Accessibility (5 distinct color palettes, color-blind considerations)

Output: Updated `07-ui-ux-specs.md` recommendations

### Agent 1E: `art-director`

1. Art inventory — every place needing art (backgrounds, banners, ruin art, loading screens, etc.)
2. AI-generated vs purchased decision matrix
3. App background art prompts (per screen, per faction)
4. Planar Ruins art direction — neutral aesthetic + 5 faction transformation styles
5. Season visual identity
6. Asset purchase research — itch.io, Sonniss, Freesound, OpenGameArt
7. Present curated asset list with links, prices, licenses

Output: `docs/design/12-art-direction.md` + asset recommendations

**USER GATE**: Review lore bible, mechanics, ruins design, UI/UX, art direction.

---

## Phase 2: Core Design Doc Updates (00, 01, 02) — AUTHORIZED {#phase-2}

Agent: `core-doc-updater`

**00-game-design-master.md**: 5 factions, rethemed Ironwright, 9 keywords, Planar Ruins card type, 10 avatars, color palette, lore bible reference.

**01-battle-mechanics.md**: Exalt/Persist rules, Haste/Ward rules, Planar Ruins battlefield mechanics (placement, targeting, destruction penalties, evolution), CF01-CF28/EF01-EF28/rewritten IF01-IF28, game AI strategy notes per faction + ruin strategy.

**02-card-data-model.md**: CELESTIAL/ENDLESS in FactionShortName, EXALT/PERSIST in FactionMechanic, HASTE/WARD in Keywords, PLANAR_RUIN in CardType, ruin data model tables.

**AUDIT**: `doc-consistency-auditor`

---

## Phase 3: Downstream Docs + Audits {#phase-3}

**4 parallel agents**:

### 3A: `prompt-content-updater` (03, 05, faction-art-bible.md)
- `03`: Celestial + Endless prompts, rethemed Ironwright, Planar Ruins art prompts (neutral + 5 faction evolutions)
- `05`: 5-faction content pipeline, ruin generation pipeline, card pool targets
- `faction-art-bible.md`: 2 sub-factions per faction, new factions, Planar Ruins visual guide

### 3B: `tech-economy-updater` (04, 06, 09)
- `04`: Economy for 5 factions + ruins. Ruin acquisition (gameplay drops/crafting). Familiarity thresholds.
- `06`: DB schema for ruins. API specs. Game engine ruin mechanics. Game AI ruin strategy.
- `09`: Monetization with 5 factions + ruins. Ruin cosmetics (premium ruin skins?).

### 3C: `ui-audio-prd-updater` (07, 08, 10)
- `07`: 5-faction picker, ruin UI (collection, evolution, battlefield placement), deck builder with ruins
- `08`: 5 faction sonic identities (rethemed Ironwright). Ruin placement SFX. Ruin destruction SFX. Purchased asset notes.
- `10`: All new requirements — factions, mechanics, keywords, ruins, avatars, assets, game AI

### 3D: `player-experience-auditor`
Full audit: FTUE, daily loop, progression, faction balance perception, ruins gameplay feel, monetization friction, dead ends.
Output: `docs/design/AUDIT-player-experience.md`

**AUDIT**: `cross-doc-auditor` + `legal-compliance-auditor`
**USER GATE**: Review all doc updates.

---

## Phase 4: Code Changes {#phase-4}

### Wave 4A: Database + Types

- Migration `00019_faction_expansion.sql`:
  - Faction CHECK constraint (5 values)
  - Mechanic enum (EXALT, PERSIST)
  - New faction rows + updated Ironwright
  - 10 avatars (4 new + 6 updated)
  - Quest/achievement templates
  - **Planar Ruins tables**: `ruin_templates`, `ruin_effects`, `ruin_evolution_options`, `player_ruins`
  - **Dev account**: admin flag or progression bypass for testing all content
- `seed.sql` update
- TypeScript unions (3 files): add CELESTIAL, ENDLESS, EXALT, PERSIST, HASTE, WARD, PLANAR_RUIN

### Wave 4B: Backend (parallel, after 4A)

`prompt-updater`: All prompts.ts updates — 5 factions, ruin art prompts, modifier visuals

`game-ai-updater`: Bot AI for Exalt/Persist/Haste/Ward + ruin placement strategy + all 15 matchups

`server-updater`: Exalt/Persist/Haste/Ward handlers, ruin battlefield mechanics (placement, destruction, penalties), fallback art, tests

### Wave 4C: Frontend (parallel, after 4A)

`ios-updater`: Swift enums, colors, faction picker, particle effects, ruin UI (collection, evolution, battlefield slot), card renderer for ruins, HomeView fix, dev login verification

`admin-updater`: Tailwind colors, CardGrid, ruin management UI

### Wave 4D: Scripts (after 4B)

Faction script rewrites/creation, base pool generator, frame/icon generators, **ruin art generator script**

**AUDIT**: `code-doc-alignment-auditor` + `build-test-auditor`

---

## Phase 5: Art + Assets {#phase-5}

### 5A: Asset Purchase
Present curated list → **USER GATE** → purchase

### 5B: Card Art (×5 parallel)
- Ironwright: 14 base creature cards
- Celestial: 13 base creature cards
- Endless: 13 base creature cards
- Fey/Demonic: regenerate if needed

### 5C: Ruin Art
- 6-8 neutral ruin images
- 30-40 faction-evolved ruin images (5 per neutral ruin)

### 5D: App Art + Visual Assets
- Faction emblems, frames, card backs (new + rethemed)
- App backgrounds, banners, loading screens

### 5E: Asset Integration
- Import all purchased + generated assets
- Wire audio, particles, art into builds

**AUDIT**: `art-consistency-auditor`

---

## Phase 6: LoRA Training {#phase-6}

All 5 factions' base cards + ruin art available:
1. Curate ~25-30 keepers (creatures + maybe ruins)
2. Train FLUX Style LoRA ($2.00)
3. Generate evolution pairs
4. Curate 15-20 evolution pairs
5. Train Kontext Evolution LoRA ($1.25)
6. Validate ($0.13)

---

## Phase 7: Final Audit {#phase-7}

**5 parallel audit agents**:

| Agent | Focus |
|---|---|
| `final-sweep-auditor` | Complete inventory: every enum, row, doc ref, prompt, asset |
| `balance-auditor` | 5 mechanics, 9 keywords, ruin effects, modifier costs |
| `legal-compliance-auditor` | PD art refs, original terms, no copyrighted names |
| `player-experience-auditor` | Full FTUE re-audit with actual code, ruin gameplay feel |
| `app-store-readiness-auditor` | Screenshots, metadata, legal pages for 5 factions + ruins |

---

## Audit Agents {#audit-agents}

| Audit | After Phase | Focus |
|---|---|---|
| `doc-consistency-auditor` | 2 | 00/01/02 alignment |
| `cross-doc-auditor` | 3 | All 12+ docs reference same data |
| `legal-compliance-auditor` | 3, 7 | PD refs, original names |
| `player-experience-auditor` | 3, 7 | User journey, FTUE, dead ends |
| `code-doc-alignment-auditor` | 4 | Code matches doc specs |
| `build-test-auditor` | 4 | Compiles, tests pass, deploys |
| `art-consistency-auditor` | 5 | Visual cohesion |
| `final-sweep-auditor` | 7 | End-to-end check |
| `balance-auditor` | 7 | Game balance |
| `app-store-readiness` | 7 | Submission ready |

---

## Task Agents {#task-agents}

| Phase | Agent | Task |
|---|---|---|
| 0 | Direct edit | CLAUDE.md + copy plan to persistent file |
| 1A | `lore-bible-writer` | 11-lore-bible.md |
| 1B | `mechanic-designer` | Exalt, Persist, Haste, Ward + 84 modifiers |
| 1C | `planar-ruins-designer` | Full ruins system — archetypes, effects, balance, art prompts |
| 1D | `ui-ux-designer` | Card design, user journey, 5-faction + ruins UI |
| 1E | `art-director` | App-wide art plan + asset research |
| 2 | `core-doc-updater` | Update 00, 01, 02 |
| 3A | `prompt-content-updater` | 03, 05, art bible |
| 3B | `tech-economy-updater` | 04, 06, 09 |
| 3C | `ui-audio-prd-updater` | 07, 08, 10 |
| 3D | `player-experience-auditor` | Full player experience audit |
| 4A | `schema-updater` | DB migration + types + ruin tables |
| 4B | `prompt-updater` + `game-ai-updater` + `server-updater` | Backend + ruin mechanics |
| 4C | `ios-updater` + `admin-updater` | Frontend + ruin UI |
| 4D | `script-updater` | Scripts + ruin art generator |
| 5A | `asset-researcher` | Purchasable asset curation |
| 5B | `art-generator` (×5) | Creature card art |
| 5C | `ruin-art-generator` | Neutral + evolved ruin art |
| 5D | `app-art-generator` | Backgrounds, banners, frames, emblems |
| 5E | `asset-integrator` | Wire all assets into builds |
| 6 | `lora-trainer` | Style + Evolution LoRA |
| 7 | 5 audit agents | Final sweep |

**Total: ~22 task agents + 10 audit agents across 8 phases.**

---

## Systems Checklist {#systems-checklist}

| System | Changes | Phase |
|---|---|---|
| CLAUDE.md | Foundation: 5 factions, 9 keywords, ruins, retheme | 0 |
| Lore bible | New doc: universe, factions, ruins lore, avatars | 1A |
| Planar Ruins | New card type: rules, effects, balance, art | 1C + 2 + 4 |
| Starter decks | 5 faction starters (creatures + ruins) | 1B + 4A |
| Onboarding | 5-faction picker, tutorial with ruins | 1D + 4C |
| Card pool targets | Min viable per faction per rarity + ruins | 3A |
| Quests | Faction-specific + ruin quests | 3B + 4A |
| Achievements | Faction mastery + ruin collection | 3B + 4A |
| Season 1 | 5-faction lore + ruin discovery narrative | 1A |
| Matchmaking | 15 matchups, ruin balance | 4B |
| Economy | Chaos Dust for 5 factions + ruin crafting/drops | 3B |
| Game AI | Exalt/Persist/Haste/Ward + ruin placement strategy | 4B |
| Dev login | All factions, all ruins, bypass progression | 4A + 4C |
| Deck validation | Creature + ruin limits, faction locking | 1C + 4B |
| Shop/IAP | 5-faction packs + ruin cosmetics | 1D + 3B |
| Analytics | PostHog events for new factions/mechanics/ruins | 4B + 4C |
| App Store | Screenshots, description, keywords | 7 |
| Audio | 5 faction themes + ruin SFX | 3C + 5A + 5E |
| Art | All factions, ruins, app backgrounds, frames | 5 |

---

## Checkpoints {#checkpoints}

Agent checkpoint files for context compaction recovery:
- `docs/design/CHECKPOINT-lore.md`
- `docs/design/CHECKPOINT-docs.md`
- `docs/design/CHECKPOINT-ruins.md`
- `supabase/CHECKPOINT-expansion.md`
- `ChaosCreatures/CHECKPOINT-expansion.md`
- `packages/game-server/CHECKPOINT-expansion.md`
- `scripts/CHECKPOINT-expansion.md`

Protocol: Commit every 2-3 files. After compaction: checkpoint → git log → glob → continue.

---

## Verification {#verification}

1. `supabase db reset` — 5 factions, 10 sub-factions, 10 avatars, 170 modifiers, ruin tables populated
2. iOS builds zero warnings (all switches exhaustive)
3. Game server tests: 15 matchups + ruin mechanics + new keywords
4. Bot AI plays all 5 factions competently, uses ruins strategically
5. Admin dashboard: 5 factions + ruin management
6. `node scripts/generate-base-pool.mjs --faction CELESTIAL --count 1` works
7. `node scripts/generate-ruin-art.mjs --archetype 1 --faction IRONWRIGHT` works
8. All 12+ docs: same 5 factions, 9 keywords, 10 avatars, ruin system
9. No copyrighted references
10. Dev login: all factions, all ruins, all features
11. LoRA: consistent style across 5 factions + ruins
12. Purchased assets integrated and functional
13. App Store metadata: 5 factions + ruins

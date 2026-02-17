# Chaos Creatures — Card Data Model & Schema

## Overview

This document defines the data structures for every persistent and runtime object in the game. It is the source of truth for database schema, API contracts, and client-side state. Every section includes the canonical field list, types, constraints, and relationships.

Conventions:
- All IDs are UUIDs unless noted otherwise.
- Timestamps are ISO 8601 UTC.
- Enums are listed exhaustively — no other values are valid.
- `?` suffix means the field is optional/nullable.
- JSON examples use TypeScript-style type annotations for clarity.

---

## 1. Card Template

A card template is a pre-generated card definition created during the batch pipeline. Templates define a card's identity — its name, base art, base stats, type, keywords, and style. Templates are **immutable** after approval. Players never modify templates; they own **card instances** (Section 2) that reference a template.

Every card in the game traces back to exactly one template.

```typescript
CardTemplate {
  id:                string        // UUID — unique template ID
  name:              string        // "Ashscale Wyvern", "Binding Ward", etc.
  card_type:         CardType      // CREATURE | SPELL | STABILIZER
  faction_id:        string        // FK → Faction — immutable. One of: IRONWRIGHT | FEY_COURTS | DEMONIC_KINGDOMS
  
  // --- Base stats (Common tier values) ---
  base_attack:       int?          // Creatures only. null for spells/stabilizers
  base_health:       int?          // Creatures only. null for spells/stabilizers
  base_instability:  int           // Creatures: 0–5. Determines stat profile (see 01-battle-mechanics.md Section 2). Spells/stabilizers: 0.
  mana_cost:         int           // Chaos mote cost to play (1–10). Fixed forever — never changes through evolution.
  
  // --- Keywords (innate, present at Common) ---
  base_keywords:     Keyword[]     // e.g., ["SHIELD", "FLYING"]. Most Commons have 0-1.
  
  // --- Spell/Stabilizer-specific ---
  spell_effect?:     SpellEffect   // Spell/stabilizer effect definition (see Section 6)
  stabilizer_type?:  StabilizerType // ORDER | CHAOS | HYBRID (stabilizers only)
  
  // --- AI generation metadata ---
  art_prompt:        string        // Full prompt used to generate base art
  art_url:           string        // CDN URL for base Common art
  flavor_text:       string        // Base flavor text
  
  // --- Pipeline metadata ---
  batch_id:          string        // Which generation batch produced this
  approved_at:       timestamp     // When QA approved this template
  approved_by:       string        // QA approver ID
  
  // --- Rules ---
  is_legendary_eligible: bool      // Can this template's instances evolve to Legendary?
                                   // (All templates are eligible by default; this is a
                                   // safety valve for balance if needed.)
}
```

**Enums:**

```
CardType:        CREATURE | SPELL | STABILIZER
Keyword:         SHIELD | LIFESTEAL | FLYING | REACH | DEATHTOUCH | TAUNT | PIERCING
StabilizerType:  ORDER | CHAOS | HYBRID
```

**Notes:**
- Spells and stabilizers that sit on the board (like Chaos Anchor) use `card_type: STABILIZER` and have `base_health` set (they can be damaged/destroyed) but `base_attack: 0` (they cannot attack or block). Instant spells (like Binding Ward) use `card_type: SPELL` with null attack/health.
- `base_keywords` is for innate keywords only. Keywords granted by modifiers live on the card instance, not the template.
- Templates are shared globally — every player who owns "Ashscale Wyvern" references the same template ID. The player's unique copy is a CardInstance.

---

## 2. Card Instance

A card instance is a player's owned copy of a card. This is the core object in the game — it carries the card's full evolution history, all earned modifiers, all triggered abilities, accumulated chaos energy, and current art.

Two players can own instances of the same template, but their instances will diverge through evolution.

```typescript
CardInstance {
  id:                  string          // UUID — unique instance ID
  template_id:         string          // FK → CardTemplate
  owner_id:            string          // FK → Player
  
  // --- Current tier and stats ---
  tier:                EvolutionTier   // COMMON | UNCOMMON | RARE | EPIC | LEGENDARY
  current_name:        string          // AI-generated name — starts as template.name, evolves at each step
  current_attack:      int?            // Current ATK (base + evolution stat gains). Creatures only.
  current_health:      int?            // Current HP (base + evolution stat gains). Creatures only.
  current_mana_cost:   int             // Always equals template.mana_cost — chaos mote cost never changes through evolution
  
  // --- Instability ---
  instability_value:   int             // Computed: template.base_instability + sum(evolution instability changes) + sum(modifier instability adjustments). Clamped minimum 0.
  
  // --- Keywords ---
  innate_keywords:     Keyword[]       // Copied from template.base_keywords at creation
  modifier_keywords:   Keyword[]       // Keywords granted by modifiers (computed from modifiers)
  // Effective keywords = union of innate_keywords + modifier_keywords
  
  // --- Evolution history ---
  evolution_history:   EvolutionRecord[] // Ordered list, 0-4 entries. See Section 3.
  
  // --- Modifiers ---
  modifiers:           ModifierInstance[] // 0-4 modifiers. See Section 4.
  
  // --- Triggered abilities (from evolution) ---
  triggered_abilities: TriggeredAbility[] // 0-4 abilities. See Section 5.
  
  // --- Progression ---
  chaos_energy:        int              // Accumulated chaos energy toward next evolution
  games_played:        int              // Total games this card has been played in
  
  // --- AI-generated content (current version) ---
  art_url:             string           // CDN URL — base art at Common, evolved art after evolutions
  flavor_text:         string           // Current flavor text
  art_prompt_history:  string[]         // Prompt used for each art generation (base + each evolution)
  
  // --- Metadata ---
  created_at:          timestamp        // When instance was added to player's collection
  last_evolved_at:     timestamp?       // When last evolution occurred
  is_favorite:         bool             // Player-set flag, prevents accidental dismantle
  
  // --- Deck membership (denormalized for quick lookup) ---
  in_deck_ids:         string[]         // List of Deck IDs this instance is currently in
}
```

**Enums:**

```
EvolutionTier:   COMMON | UNCOMMON | RARE | EPIC | LEGENDARY
```

**Constraints:**
- `evolution_history.length == tier_index` (COMMON=0 entries, UNCOMMON=1, RARE=2, EPIC=3, LEGENDARY=4)
- `modifiers.length == evolution_history.length` (one modifier per evolution)
- `triggered_abilities.length == evolution_history.length` (one ability per evolution)
- `instability_value` is computed from template.base_instability + evolution changes + modifier adjustments, clamped minimum 0
- `current_mana_cost` always equals `template.mana_cost` — chaos mote cost is fixed at card creation and never changes
- `current_attack` and `current_health` are always ≥ the template's `base_attack`/`base_health`
- A card instance can appear in **at most 2 decks** (max 2 copies rule applies to instances of the same template, but a single instance can be reused across deck slots)

**Computed properties (not stored, derived at read time):**
- `order_attunement_count`: count of modifiers with attunement == ORDER
- `chaos_attunement_count`: count of modifiers with attunement == CHAOS
- `order_trigger_count`: count of triggered abilities with trigger == ON_ORDER
- `chaos_trigger_count`: count of triggered abilities with trigger == ON_CHAOS
- `evolution_ready`: chaos_energy >= threshold for next tier AND next tier exists
  - Thresholds: Uncommon=15, Rare=30, Epic=50, Legendary=75
  - Energy earned per game: 2 (win), 1 (loss) for ALL cards in the deck
- `effective_keywords`: union of innate_keywords and modifier_keywords

---

## 3. Evolution Record

Each evolution step is recorded permanently. The full evolution history tells the card's story and drives AI art generation.

```typescript
EvolutionRecord {
  step:                int              // 1-4 (which evolution this was)
  from_tier:           EvolutionTier    // Tier before this evolution
  to_tier:             EvolutionTier    // Tier after this evolution
  channeled_toward:    EventType        // ORDER | CHAOS — what the player chose
  actual_outcome:      EventType        // ORDER | CHAOS — what the RNG produced (70/30)
  modifier_chosen_id:  string           // FK → ModifierInstance.id — which modifier the player picked
  modifier_rejected_id: string          // FK → ModifierDefinition.id — the other option (not stored as instance)
  ability_granted_id:  string           // FK → TriggeredAbility.id
  
  // --- Stat changes applied at this evolution ---
  attack_change:       int?             // How much ATK increased (creatures only)
  health_change:       int?             // How much HP increased (creatures only)
  instability_change:  int              // Net instability change at this step. Chaos outcome: +1. Order outcome: 0 (Unc/Rare), -1 (Epic), -2 (Leg).
  
  // --- AI generation ---
  reference_art_url:   string           // Input image URL (previous tier's art) used as img2img reference
  art_url:             string           // Output art generated at this evolution step
  art_prompt:          string           // Full prompt sent to FLUX Kontext for this evolution
  prompt_modifiers_selected: string[]   // Player-chosen prompt modifiers (e.g., ["crystalline armor", "chaos veins"])
  name_candidates:     string[]         // 2-3 AI-generated name candidates presented to player
  name_chosen:         string           // The name the player selected from candidates — becomes current_name
  flavor_text:         string           // AI-generated flavor text at this step
  
  // --- Shard & generation metadata ---
  evolved_at:          timestamp
  shard_consumed:      ShardTier        // UNCOMMON | RARE | EPIC | LEGENDARY
  shard_quality:       ShardQuality     // PLANAR | REFINED | PRISMATIC — determines AI model/resolution/passes
  generation_model:    string           // "flux-kontext-dev" or "flux-kontext-pro"
  generation_resolution: string         // "768x1024" or "1024x1024"
  text_generation_model: string         // "gpt-4o-mini" — model used for name candidates + flavor text
}
```

**Enums:**

```
EventType:     ORDER | CHAOS
ShardTier:     UNCOMMON | RARE | EPIC | LEGENDARY
ShardQuality:  PLANAR | REFINED | PRISMATIC
```

**Notes:**
- `channeled_toward` is the player's choice. `actual_outcome` is the probabilistic result.
- `modifier_rejected_id` references the **definition** (not an instance) of the modifier the player didn't pick. Stored for analytics and potential "what if" UI.
- The full sequence of `actual_outcome` values across all EvolutionRecords defines the card's attunement profile.
- `reference_art_url` is the previous tier's art used as input for FLUX Kontext image-to-image generation. For the first evolution (Common→Uncommon), this is the template's base `art_url`.
- `prompt_modifiers_selected` stores the exact prompt modifiers the player chose from their tier-appropriate list.
- `shard_quality` determines which FLUX Kontext model variant was used (Dev for PLANAR, Pro for REFINED/PRISMATIC), the output resolution, and whether a second refinement pass was run.
- `name_candidates` stores all 2-3 AI-generated name options. `name_chosen` is the one the player picked. This becomes the card's `current_name` until the next evolution. Storing all candidates enables analytics on naming preferences and potential future "rename" features.

---

## 4. Modifier System

### 4a. Modifier Definition

Modifier definitions live in a global pool. They are game content, not player data. When a player picks a modifier during evolution, an instance is created referencing a definition.

```typescript
ModifierDefinition {
  id:                  string           // UUID
  name:               string           // "Chaos-Forged Blade", "Warden's Resilience", etc.
  flavor_text:         string           // Lore text for the modifier
  
  // --- Pool assignment ---
  pool_type:           ModifierPoolType // UNIVERSAL | FACTION
  faction_id?:         string           // FK → Style/Faction. Required if pool_type == FACTION. null for UNIVERSAL.
  pp_cost:             int              // 1, 2, or 3 — which PP budget pool this modifier belongs to
  tier_bracket:        TierBracket      // EARLY (C→U, U→R) | LATE (R→E, E→L)
  attunement:          EventType        // ORDER | CHAOS — which event type activates the bonus AND which pool attunement
  // Pool key = (pp_cost, tier_bracket, attunement, pool_type, faction_id?)
  
  // --- Base effect (always active) ---
  base_effect:         Effect           // See Section 7 — Effect schema
  
  // --- Attuned bonus ---
  attuned_effect:      Effect           // Effect that activates when matching event type fired on last roll
  
  // --- Optional penalty (extra-powerful modifiers only) ---
  has_penalty:         bool             // Whether this modifier has an opposite-event penalty
  penalty_effect?:     Effect           // Effect that activates when OPPOSITE event type fired on last roll
  
  // --- Keywords ---
  grants_keyword?:     Keyword          // If this modifier grants a keyword (base or attuned)
  keyword_is_attuned:  bool             // true = keyword only active when attuned; false = always active
  
  // --- Instability adjustment ---
  instability_adjustment: int           // +N or -N to creature's instability. 0 = no change. +1/+2 = chaos-leaning, -1/-2 = order-leaning.
  instability_is_attuned: bool          // true = instability change only active when attuned; false = always active
  
  // --- Faction mechanic keyword (faction modifiers only) ---
  faction_mechanic?:   FactionMechanic  // AUGMENT | BOND | CORRUPTION. Required for faction modifiers. Must match faction_id.
  
  // --- Metadata ---
  power_rating:        int              // 1-10 internal balance rating. Not shown to players.
}
```

**Enums:**

```
ModifierPoolType:  UNIVERSAL | FACTION
TierBracket:       EARLY | LATE
FactionMechanic:   AUGMENT | BOND | CORRUPTION
```

**Pool structure:** 12 universal pools (3 PP × 2 tiers × 2 attunements) with 8 modifiers each, plus 12 faction pools per faction (same dimensions) with 4 modifiers each. 240 total modifier definitions at launch.

**Modifier selection at evolution:**
1. Determine PP budget from card's CM cost and evolution step (see 01-battle-mechanics.md Section 7)
2. Determine tier bracket: C→U/U→R = EARLY, R→E/E→L = LATE
3. Determine attunement from evolution outcome (70/30 roll result)
4. Draw universal options from matching (pp_cost, tier_bracket, attunement, UNIVERSAL) pool
5. Draw faction options from matching (pp_cost, tier_bracket, attunement, FACTION, card.faction_id) pool
6. Present options based on subscription tier: Free = 1+1, Mid = 1+2, Top = 2+2

### 4b. Modifier Instance

When a player selects a modifier during evolution, an instance is created and attached to the card.

```typescript
ModifierInstance {
  id:                  string           // UUID — unique per card instance
  definition_id:       string           // FK → ModifierDefinition
  card_instance_id:    string           // FK → CardInstance this modifier belongs to
  evolution_step:      int              // 1-4 — which evolution granted this modifier
  
  // Denormalized from definition for runtime performance:
  name:                string
  pool_type:           ModifierPoolType // UNIVERSAL | FACTION
  faction_mechanic?:   FactionMechanic  // AUGMENT | BOND | CORRUPTION (faction modifiers only)
  attunement:          EventType
  base_effect:         Effect
  attuned_effect:      Effect
  has_penalty:         bool
  penalty_effect?:     Effect
  grants_keyword?:     Keyword
  keyword_is_attuned:  bool
  instability_adjustment: int
  instability_is_attuned: bool
}
```

**Notes:**
- Denormalization is intentional. During battle resolution, we need fast access to modifier data without joining to the definition table on every turn. If a definition is ever rebalanced post-launch, a migration updates all instances.

---

## 5. Triggered Ability

Triggered abilities are granted at evolution. Unlike modifiers (which have always-on base effects + conditional bonuses), triggered abilities fire **only** when their matching event type triggers.

```typescript
TriggeredAbility {
  id:                  string           // UUID
  card_instance_id:    string           // FK → CardInstance
  evolution_step:      int              // 1-4 — which evolution granted this ability
  
  trigger:             TriggerType      // What causes this ability to fire
  effect:              Effect           // What happens when it fires. See Section 7.
  
  description:         string           // Human-readable: "When a Chaos Event triggers, this creature gets +2 ATK this turn."
  name:                string           // "Chaos Fury", "Order's Blessing", etc.
}

TriggerType:     ON_ORDER           // Controller's chaos roll triggers an Order event
               | ON_CHAOS           // Controller's chaos roll triggers a Chaos event
               | ON_PLAY            // This creature enters the battlefield from hand
               | ON_DEATH           // This creature is destroyed
               | ON_DAMAGE_TAKEN    // This creature takes damage (not if Shield absorbed)
               | ON_ATTACK          // This creature is declared as an attacker
               | ON_BLOCK           // This creature is assigned as a blocker
```

**How triggered abilities differ from modifier attunement:**
- **Triggered abilities** fire as a one-time event when the matching event type triggers. They resolve during the event phase.
- **Modifier attuned bonuses** are a persistent state — they're "on" or "off" based on what the *most recent* roll was. They affect the card's stats/properties until the next roll changes them.

This distinction matters for implementation: triggers need event listeners; attunement is a state flag checked during stat calculation.

---

## 6. Spell & Stabilizer Effects

Spells and stabilizers use the same `SpellEffect` structure. Stabilizers that sit on the board also have attack/health (on the template) and can be destroyed.

```typescript
SpellEffect {
  effect_type:         SpellEffectType
  target:              TargetType
  value?:              int              // Damage amount, heal amount, buff amount, etc.
  duration?:           Duration         // THIS_TURN | PERMANENT | WHILE_ON_FIELD
  keyword?:            Keyword          // For effects that grant keywords
  
  // --- Stabilizer-specific ---
  instability_change?: int              // +/- instability modification (stabilizers)
  instability_set?:    int              // Set instability to exact value (stabilizers)
  
  description:         string           // Human-readable effect text
}
```

**Enums:**

```
SpellEffectType:  DAMAGE | HEAL | BUFF_ATTACK | BUFF_HEALTH | DRAW | GAIN_MANA 
                | GRANT_KEYWORD | REMOVE_KEYWORD | DESTROY | INSTABILITY_MODIFY 
                | INSTABILITY_SET | CHOOSE_EVENT_TYPE | COST_REDUCTION

TargetType:       SELF | FRIENDLY_CREATURE | ENEMY_CREATURE | ANY_CREATURE
                | ALL_FRIENDLY | ALL_ENEMY | ALL_CREATURES
                | RANDOM_FRIENDLY | RANDOM_ENEMY | RANDOM_ANY
                | LOWEST_HP_FRIENDLY | LOWEST_HP_ENEMY
                | HIGHEST_ATK_FRIENDLY | HIGHEST_ATK_ENEMY
                | HIGHEST_COST_IN_HAND
                | PLAYER_SELF | PLAYER_OPPONENT

Duration:         THIS_TURN | PERMANENT | WHILE_ON_FIELD | UNTIL_NEXT_ROLL
```

**Notes:**
- Spells with `target: FRIENDLY_CREATURE` or `ENEMY_CREATURE` or `ANY_CREATURE` require the player to select a target (see targeting UI in Section 14 of master doc).
- `RANDOM_*` targets are resolved server-side at time of play.
- Stabilizers that sit on the board use `duration: WHILE_ON_FIELD` — their effect persists as long as the card is alive.

---

## 7. Effect Schema

The universal effect structure used by modifiers, triggered abilities, and spells. This is the atomic unit of game logic — every mechanical interaction in the game resolves through Effects.

```typescript
Effect {
  effect_type:         EffectType
  target:              TargetType       // Same TargetType enum as spells
  value?:              int              // Numeric value for the effect
  keyword?:            Keyword          // For keyword-granting effects
  duration?:           Duration         // How long the effect lasts
  
  // --- Compound effects ---
  secondary_effect?:   Effect           // Some effects chain: "Deal 2 damage, then heal 1"
  condition?:          Condition        // Some effects are conditional: "If you have 3+ creatures..."
}
```

```
EffectType:  STAT_MODIFY_ATTACK | STAT_MODIFY_HEALTH | STAT_MODIFY_COST
           | DAMAGE | HEAL | HEAL_PLAYER
           | DRAW_CARD | GAIN_MANA
           | GRANT_KEYWORD | REMOVE_KEYWORD
           | DESTROY_CREATURE
           | SUMMON_TOKEN
           | DOUBLE_MODIFIER_ACTIVATION
           | COST_REDUCTION

Condition:   NONE
           | CREATURE_COUNT_GTE(n)     // "If you control n+ creatures"
           | HEALTH_BELOW(n)           // "If your HP is below n"
           | BOARD_FULL                // "If your board is full"
           | LAST_EVENT_WAS(type)      // "If last event was Order/Chaos"
           | TARGET_AT_FULL_HP         // "If target creature is at full HP"
           | HAS_KEYWORD(keyword)      // "If this creature has [keyword]"
```

**Notes:**
- `secondary_effect` enables chained effects without requiring a complex effect graph. Max chain depth: 2 (an effect can have one secondary, which cannot have its own secondary).
- Conditions on modifiers/triggered abilities define *when* the effect fires. For modifier base effects, condition is always NONE (always active). For modifier attuned bonuses, the attunement check is handled by the attunement system, not by the condition field.
- `SUMMON_TOKEN` creates a creature without a template — tokens have fixed stats, no modifiers, no evolution, and instability value of 0. Token definition is embedded in the effect's value fields.

---

## 8. Event Definitions

The 16 events (8 Order, 8 Chaos) are static game data, not player-owned content. They're referenced by ID during event resolution.

```typescript
EventDefinition {
  id:                  string           // "O1", "O2", ... "C1", "C2", etc.
  name:                string           // "Mending Light", "Surge", etc.
  event_type:          EventType        // ORDER | CHAOS
  
  // --- Effect ---
  effect:              Effect           // Uses the same Effect schema as abilities/spells
  
  // --- Metadata ---
  description:         string           // Human-readable: "Heal your most damaged creature for 3 HP."
  design_notes:        string           // Internal notes for balance reference
  can_backfire:        bool             // True for C3, C6, C7 — affects both sides or self-damages
}
```

**Event selection:** When a player's chaos roll triggers ORDER or CHAOS, the server picks one event uniformly at random from the 8-event pool for that type. Each event has equal probability (12.5%).

**Event targeting resolution:** Events that target "random" creatures resolve server-side using the match's seeded RNG. Events that target "your choice" (O2 Planar Ward, O5 Fortify) pause for player input during Phase 3 with a 10-second sub-timer (auto-selects leftmost valid target on timeout).

---

## 9. Avatar

```typescript
Avatar {
  id:                  string           // UUID
  name:                string           // "Sir Aldric the Resolute", "Vex, Entropy Witch", etc.
  faction_id:          string           // FK → Faction — must match deck faction
  
  // --- Gameplay ---
  instability_modifier: int             // Added to instability calculation. Negative = pushes toward Order.
                                        // Order-leaning: -5 to -6
                                        // Balanced: -3 to -4
                                        // Chaos-leaning: -1 to -2
  
  // --- Visual ---
  portrait_url:        string           // Avatar portrait art
  battle_sprite_url:   string           // In-battle representation
  frame_style:         string           // Asset reference for the avatar's frame design
  
  // --- Lore ---
  title:               string           // "The Resolute", "Entropy Witch", etc.
  lore_text:           string           // Background story
  
  // --- Unlock ---
  unlock_condition:    UnlockCondition  // How the player gets this avatar
}
```

```
UnlockCondition:  FREE_STARTER          // Available at account creation / faction selection
                | FACTION_MASTERY(level) // Unlock at faction mastery level N
                | SEASON_REWARD(season)  // Season-specific reward
                | CHAOS_DUST(cost)       // Purchased with Chaos Dust
```

---

## 10. Faction (replaces "Style")

Factions define card art style, creature thematic identity, and an exclusive mechanic. At launch there are 3 factions. The data model supports additional factions.

```typescript
Faction {
  id:                  string           // UUID
  name:                string           // "The Ironwright Collective", "The Fey Courts", "The Demonic Kingdoms"
  short_name:          string           // "IRONWRIGHT" | "FEY_COURTS" | "DEMONIC_KINGDOMS"
  
  // --- Faction mechanic ---
  exclusive_mechanic:  FactionMechanic  // AUGMENT | BOND | CORRUPTION
  
  // --- AI generation instructions ---
  art_prompt_prefix:   string           // Injected at start of all FLUX art prompts for this faction
                                        // e.g., "steampunk fantasy art, brass and copper tones, gears and steam..."
  flavor_voice:        string           // Tone/voice instructions for GPT-4o Mini flavor text generation
                                        // e.g., "Industrial, pragmatic, references engineering and invention..."
  name_voice:          string           // Instructions for GPT-4o Mini card name generation
                                        // e.g., "Mechanical, compound words, references metals/gears/steam..."
  
  // --- Visual theme ---
  card_frame_asset:    string           // Asset path for the card frame design
  color_primary:       string           // Hex color — dominant UI accent
  color_secondary:     string           // Hex color — secondary accent
  color_background:    string           // Hex color — background tint
  particle_theme:      string           // Particle preset name for ambient effects
  
  // --- Audio ---
  battle_music_url?:   string           // Optional faction-specific battle music
  ambient_audio_url?:  string           // Optional ambient audio layer
  
  // --- Metadata ---
  released_at:         timestamp
  card_template_count: int              // Denormalized: how many templates exist in this faction
}
```

**Enums:**
```
FactionMechanic:   AUGMENT | BOND | CORRUPTION
```

**Notes:**
- All 3 launch factions are available to all players during the trial phase. Players commit to one at onboarding; additional factions are unlocked by purchasing a card pack from that faction (150 Chaos Dust).
- Factions are NOT purchasable with real money. Unlocking is gameplay-earned via Chaos Dust.
- Future factions can be added with new exclusive mechanics.

---

## 11. Deck

```typescript
Deck {
  id:                  string           // UUID
  owner_id:            string           // FK → Player
  name:                string           // Player-chosen deck name
  faction_id:          string           // FK → Faction — all cards must share this faction
  avatar_id:           string           // FK → Avatar — must be from same faction
  
  // --- Contents ---
  card_entries:        DeckEntry[]      // Exactly 20 entries for a valid deck
  
  // --- Validation state ---
  is_valid:            bool             // Meets all construction rules (20 cards, etc.)
  validation_errors:   string[]         // List of current rule violations (empty if valid)
  
  // --- Metadata ---
  created_at:          timestamp
  updated_at:          timestamp
  games_played:        int              // Games played with this deck
  wins:                int
  losses:              int
}

DeckEntry {
  card_instance_id:    string           // FK → CardInstance
  quantity:            int              // 1 or 2 (max 2 copies of any template; max 1 for Legendaries)
}
```

**Validation rules (enforced at save and at queue):**
- `card_entries` must contain exactly 20 cards (sum of all quantities)
- All `card_instance_id` references must belong to `owner_id`
- All referenced CardInstances must have `template.faction_id == deck.faction_id`
- No template appears more than 2 times across all entries
- Legendary-tier cards: max 2 total, max 1 copy each
- `avatar.faction_id == deck.faction_id`

**Computed properties:**
- `mana_curve`: histogram of mana costs across all cards
- `avg_instability`: average instability contribution per creature in deck
- `attunement_balance`: ratio of order-attuned to chaos-attuned modifiers across all cards
- `order_trigger_count` / `chaos_trigger_count`: total triggers across deck
- `keyword_distribution`: count of each keyword across deck

---

## 12. Player

```typescript
Player {
  id:                  string           // UUID
  display_name:        string           // Unique, 3-20 chars, alphanumeric + underscores
  friend_code:         string           // Short unique code for friend requests (e.g., "CHAOS-7K2M")
  
  // --- Account ---
  apple_id:            string           // Linked Apple ID for auth
  subscription_tier:   SubscriptionTier // FREE | MID | HIGH
  created_at:          timestamp
  
  // --- Faction ---
  primary_faction_id:  string           // FK → Faction — chosen at onboarding
  unlocked_faction_ids: string[]        // FK → Faction — which factions the player can build decks from
  onboarding_complete: bool             // true after trial phase + faction commitment
  
  // --- Progression ---
  player_level:        int              // Account level
  player_xp:           int              // XP toward next level
  season_rank:         SeasonRank       // Current competitive rank
  season_rank_points:  int              // Points within current rank tier
  
  // --- Currency ---
  chaos_dust:          int              // Primary in-game currency, earned through gameplay
  
  // --- Collection limits ---
  max_cards_per_faction: int            // 50 (free), 100 (mid), 200 (high)
  max_deck_slots:      int              // 3 (free), 6 (mid), 10 (high)
  
  // --- Shards ---
  shards_uncommon:     int
  shards_rare:         int
  shards_epic:         int
  shards_legendary:    int
  
  // --- Profile showcase ---
  showcase_card_ids:   string[]         // 0-3 CardInstance IDs to display on profile
  active_title?:       string           // Earned title string, or null
  
  // --- Faction mastery ---
  faction_mastery:     FactionMastery[] // Per-faction mastery data
  
  // --- Stats ---
  total_games:         int
  total_wins:          int
  total_losses:        int
  current_win_streak:  int
  best_win_streak:     int
  cards_evolved_total: int
  highest_tier_reached: EvolutionTier
  
  // --- Social ---
  friend_ids:          string[]         // FK → Player
  
  // --- Settings ---
  settings:            PlayerSettings   // See below
}

FactionMastery {
  faction_id:          string           // FK → Faction
  mastery_level:       int
  mastery_xp:          int
  games_played:        int
}

PlayerSettings {
  // Audio
  master_volume:       float            // 0.0 - 1.0
  music_volume:        float
  sfx_volume:          float
  
  // Visuals
  reduced_motion:      bool
  colorblind_mode:     ColorblindMode   // NONE | DEUTERANOPIA | PROTANOPIA | TRITANOPIA
  card_animation_quality: QualityLevel  // FULL | REDUCED | MINIMAL
  screen_shake:        bool
  
  // Gameplay
  auto_end_turn:       bool             // Auto-end when no actions available
  confirm_end_turn:    bool
  
  // Notifications
  notify_daily_rewards: bool
  notify_evolution_ready: bool
  notify_friend_activity: bool
  notify_season_ending: bool
  
  // Privacy
  block_friend_requests: bool
  hide_profile:        bool
  hide_online_status:  bool
}
```

```
SubscriptionTier:  FREE | MID | HIGH

SeasonRank:        BRONZE_3 | BRONZE_2 | BRONZE_1
                 | SILVER_3 | SILVER_2 | SILVER_1
                 | GOLD_3 | GOLD_2 | GOLD_1
                 | PLATINUM_3 | PLATINUM_2 | PLATINUM_1
                 | DIAMOND_3 | DIAMOND_2 | DIAMOND_1
                 | MASTER | GRANDMASTER

ColorblindMode:    NONE | DEUTERANOPIA | PROTANOPIA | TRITANOPIA
QualityLevel:      FULL | REDUCED | MINIMAL
```

**Computed properties (derived from subscription_tier):**
- `shard_quality`: FREE → PLANAR, MID → REFINED, HIGH → PRISMATIC
- `available_prompt_modifiers`: FREE → 8-10 basic, MID → 25-30 expanded, HIGH → 40+ including exclusives
- `evolution_image_model`: PLANAR → "flux-kontext-dev", REFINED/PRISMATIC → "flux-kontext-pro"
- `evolution_resolution`: PLANAR → "768x1024", REFINED/PRISMATIC → "1024x1024"
- `evolution_passes`: PLANAR/REFINED → 1, PRISMATIC → 2 (generate + refine)

---

## 13. Game State (Runtime — Battle)

This is the in-memory state during an active match. Not persisted to the primary database — stored in the game server's memory (or a fast cache like Redis) for the duration of the match, then discarded. Match results are written to persistent storage as a MatchRecord (Section 13).

```typescript
GameState {
  match_id:            string           // UUID
  started_at:          timestamp
  current_turn:        int              // Turn counter (starts at 1)
  active_player:       PlayerSide       // PLAYER_1 | PLAYER_2
  phase:               TurnPhase        // Current phase within the turn
  
  // --- Players ---
  player_1:            BattlePlayer
  player_2:            BattlePlayer
  
  // --- First/second player tracking ---
  first_player:        PlayerSide       // Who went first (for Chaos Spark)
  // Rule: if current_turn == 1 && active_player == first_player → skip DECLARE_ATTACKERS phase
  
  // --- Combat state ---
  declared_attackers:  string[]         // Creature IDs declared as attackers this turn (empty until DECLARE_ATTACKERS)
  blocker_assignments: BlockerAssignment[] // Defending player's blocker → attacker mappings (empty until ASSIGN_BLOCKERS)
  
  // --- Chaos roll state ---
  last_roll_value?:    int              // 1-20, null before first roll
  last_roll_event?:    EventType        // ORDER | CHAOS | null (if exact match / no roll yet)
  last_roll_event_id?: string           // Which specific event fired (FK → event definition)
  
  // --- Turn timer ---
  turn_timer_started:  timestamp?       // When the decision phase started
  turn_timer_seconds:  int              // 60 (standard) or 90 (extended casual)
  
  // --- Game log ---
  log:                 GameLogEntry[]   // Chronological record of all actions/events
}

BattlePlayer {
  player_id:           string           // FK → Player
  side:                PlayerSide       // PLAYER_1 | PLAYER_2
  avatar_id:           string           // FK → Avatar
  
  // --- Health ---
  current_hp:          int              // Starts at 20
  max_hp:              int              // 20 (could be modified by future effects)
  
  // --- Mana ---
  current_mana:        int              // Available chaos motes right now. Gain 1 per turn. Unspent motes carry over.
  mana_cap:            int              // Maximum motes you can hold (10). Cannot exceed this.
  
  // --- Instability ---
  instability:         int              // Computed: avatar modifier + sum of board creature instabilities. Clamped 1-20 (D20 range).
  
  // --- Board ---
  board:               BattleCreature?[5] // 5 slots, each null (empty) or occupied
  
  // --- Hand ---
  hand:                BattleCard[]     // Cards currently in hand
  
  // --- Deck ---
  deck:                BattleCard[]     // Remaining cards in deck (order matters — top = next draw)
  
  // --- Graveyard ---
  graveyard:           BattleCard[]     // Destroyed creatures, spent spells
  
  // --- Chaos Spark ---
  has_chaos_spark:     bool             // Second player starts with this; consumed on use
  
  // --- Last event tracking (for attunement) ---
  last_event_type?:    EventType        // ORDER | CHAOS — drives modifier attunement state
  
  // --- Disconnect tracking ---
  consecutive_missed_turns: int         // Auto-forfeit at 3
  is_connected:        bool
}

BattleCard {
  instance_id:         string           // FK → CardInstance
  template_id:         string           // FK → CardTemplate
  card_type:           CardType
  name:                string
  
  // Denormalized for fast access:
  mana_cost:           int              // May be temporarily modified by events
  art_url:             string
}

BattleCreature extends BattleCard {
  // --- Current combat stats (includes all active modifiers and buffs) ---
  attack:              int              // Effective ATK right now
  health:              int              // Effective HP right now (damage reduces this)
  max_health:          int              // Max HP (base + permanent buffs)
  
  // --- State ---
  has_attacked:        bool             // Has attacked this turn
  is_alive:            bool             // false when health <= 0 (removed at end of combat)
  
  // --- Instability ---
  instability_value:   int              // Computed: template.base_instability + sum(evolution instability changes) + sum(modifier instability adjustments where active). Clamped min 0.
  
  // --- Keywords (effective this moment) ---
  active_keywords:     Keyword[]        // Computed from innate + modifier grants + temporary buffs
  shield_active:       bool             // Specifically tracked: Shield is consumed on first hit
  
  // --- Modifiers (snapshot from CardInstance, with current attunement state) ---
  modifiers:           BattleModifier[]
  
  // --- Triggered abilities ---
  triggered_abilities: TriggeredAbility[]
  
  // --- Temporary effects ---
  temp_buffs:          TempBuff[]       // Effects that expire at end of turn
  
  board_slot:          int              // 0-4, which slot this creature occupies
}

BattleModifier {
  definition_id:       string
  name:                string
  pool_type:           ModifierPoolType
  faction_mechanic?:   FactionMechanic
  attunement:          EventType
  base_effect:         Effect
  attuned_effect:      Effect
  has_penalty:         bool
  penalty_effect?:     Effect
  instability_adjustment: int
  instability_is_attuned: bool
  
  // --- Current state ---
  is_attuned_active:   bool             // true if last_event_type matches attunement
  is_penalty_active:   bool             // true if last_event_type is opposite AND has_penalty
}

TempBuff {
  effect:              Effect
  expires_at:          TurnPhase        // Usually END_OF_TURN
  source:              string           // Description of what caused this: "Chaos Event: Surge", "Spell: Battle Cry"
}

GameLogEntry {
  turn:                int
  phase:               TurnPhase
  timestamp:           timestamp
  entry_type:          LogEntryType
  description:         string           // Human-readable
  data:                object           // Structured data for replay/analysis
}

BlockerAssignment {
  blocker_creature_id: string           // Defending creature assigned to block
  attacker_creature_id: string          // Attacking creature being blocked
}
```

```
PlayerSide:    PLAYER_1 | PLAYER_2

TurnPhase:     START_OF_TURN | CHAOS_ROLL | EVENT_RESOLUTION | DRAW_AND_MANA 
             | MAIN_PHASE | DECLARE_ATTACKERS | ASSIGN_BLOCKERS 
             | COMBAT_RESOLUTION | END_TURN

LogEntryType:  ROLL | EVENT_TRIGGERED | CARD_PLAYED | CARD_DRAWN
             | ATTACK_DECLARED | BLOCKER_ASSIGNED | COMBAT_DAMAGE
             | CREATURE_DESTROYED | SPELL_CAST | MODIFIER_ACTIVATED
             | TRIGGER_FIRED | HP_CHANGED | MANA_CHANGED
             | INSTABILITY_CHANGED | GAME_START | GAME_END | SURRENDER
             | CHAOS_SPARK_USED | TURN_START | TURN_TIMEOUT
```

**Key implementation notes:**

- `BattleCreature.attack` and `.health` are the **effective values right now**, after applying all base modifier effects, active attuned bonuses, active penalties, and temporary buffs. The game engine recalculates these whenever attunement state changes (i.e., after every chaos roll).
- `BattleModifier.is_attuned_active` and `.is_penalty_active` are recalculated after each chaos roll by comparing `attunement` to `BattlePlayer.last_event_type`.
- The `deck` array order IS the draw order. Shuffle happens once at game start. No reshuffling.
- `GameState` is the **single source of truth** during a match. Client receives a projection of this state (hiding opponent's hand/deck contents). All mutations happen server-side and are broadcast to both clients.

---

## 14. Match Record

Persisted after a match ends. Used for player stats, card XP awarding, analytics, and future replay support.

```typescript
MatchRecord {
  id:                  string           // Same as GameState.match_id
  mode:                GameMode         // RANKED | CASUAL | PRACTICE
  
  // --- Players ---
  player_1_id:         string
  player_2_id:         string           // null for Practice mode (AI)
  winner_id:           string?          // null for draws (if we ever add them)
  loser_id:            string?
  
  // --- Decks used ---
  player_1_deck_id:    string
  player_2_deck_id:    string?
  player_1_avatar_id:  string
  player_2_avatar_id:  string?
  player_1_faction_id: string
  player_2_faction_id: string?
  
  // --- Result ---
  end_reason:          EndReason        // HP_ZERO | SURRENDER | DISCONNECT | TIMEOUT
  total_turns:         int
  duration_seconds:    int
  
  // --- Stats snapshot ---
  player_1_final_hp:   int
  player_2_final_hp:   int
  player_1_rank:       SeasonRank       // Rank at time of match
  player_2_rank:       SeasonRank?
  
  // --- Card XP data ---
  cards_played:        CardPlayRecord[] // Which cards were played and earn XP
  
  // --- Chaos roll summary ---
  total_rolls:         int
  order_events_p1:     int
  chaos_events_p1:     int
  order_events_p2:     int
  chaos_events_p2:     int
  
  // --- Game log (for replay) ---
  full_log:            GameLogEntry[]   // Complete game log, compressed/archived
  
  // --- Metadata ---
  started_at:          timestamp
  ended_at:            timestamp
  season_id:           string           // Which season this match occurred in
}

CardPlayRecord {
  card_instance_id:    string
  player_id:           string
  turns_on_board:      int              // How many turns this card was on the field
  damage_dealt:        int
  damage_taken:        int
  triggers_fired:      int
  was_destroyed:       bool
}
```

```
GameMode:    RANKED | CASUAL | PRACTICE
EndReason:   HP_ZERO | SURRENDER | DISCONNECT | TIMEOUT
```

---

## 15. Shard & Currency

```typescript
ShardTransaction {
  id:                  string
  player_id:           string
  shard_tier:          ShardTier
  amount:              int              // Positive = earned/purchased, negative = consumed
  source:              ShardSource
  reference_id?:       string           // FK → match, evolution, purchase, etc.
  created_at:          timestamp
}
```

```
ShardSource:   MATCH_REWARD | DAILY_LOGIN | WEEKLY_CHALLENGE | SEASON_REWARD
             | MILESTONE | PURCHASE | EVOLUTION_CONSUMED | DISMANTLE_RETURN
             | SUBSCRIPTION_GRANT
```

---

## 16. Daily Missions

```typescript
Mission {
  id:                  string
  player_id:           string
  mission_type:        MissionType
  description:         string           // "Win 3 games", "Play 10 creatures", etc.
  
  target_value:        int              // Target to complete (e.g., 3 wins)
  current_value:       int              // Current progress
  is_completed:        bool
  is_claimed:          bool             // Player has claimed the reward
  
  reward_type:         RewardType
  reward_amount:       int
  reward_shard_tier?:  ShardTier        // If reward is shards
  
  expires_at:          timestamp        // Daily missions expire in 24h, weekly in 7d
  created_at:          timestamp
}
```

```
MissionType:   WIN_GAMES | PLAY_CARDS | PLAY_CREATURES | PLAY_SPELLS
             | EVOLVE_CARD | TRIGGER_ORDER_EVENTS | TRIGGER_CHAOS_EVENTS
             | DEAL_DAMAGE | WIN_WITH_STYLE | PLAY_GAMES

RewardType:    XP | SHARDS | CHAOS_ENERGY_BOOST
```

---

## 17. Achievements

```typescript
Achievement {
  id:                  string           // Global achievement definition ID
  name:                string
  description:         string
  category:            AchievementCategory
  
  target_value:        int              // Threshold to earn
  reward_type:         RewardType
  reward_amount:       int
  reward_title?:       string           // Title string earned, if any
  icon_url:            string
}

PlayerAchievement {
  player_id:           string
  achievement_id:      string
  current_value:       int
  is_unlocked:         bool
  unlocked_at?:        timestamp
}
```

```
AchievementCategory:  EVOLUTION | BATTLE | COLLECTION | CHAOS_ROLL | SOCIAL
```

---

## 18. Entity Relationship Summary

```
CardTemplate  1 ←──→ * CardInstance    (template is shared, instances are per-player)
CardInstance  1 ←──→ * ModifierInstance (0-4 modifiers per card)
CardInstance  1 ←──→ * TriggeredAbility (0-4 abilities per card)
CardInstance  1 ←──→ * EvolutionRecord  (0-4 records per card)
Player        1 ←──→ * CardInstance    (player owns many cards)
Player        1 ←──→ * Deck           (player owns many decks)
Deck          * ←──→ * CardInstance    (deck contains cards, card can be in multiple decks)
Faction       1 ←──→ * CardTemplate   (faction has many templates)
Faction       1 ←──→ * Avatar         (faction has avatars)
Avatar        1 ←──→ * Deck           (deck uses one avatar)
Player        1 ←──→ * Mission        (player has active missions)
Player        1 ←──→ * PlayerAchievement (player progress on achievements)

ModifierDefinition (global pool, not per-player)
  → Referenced by ModifierInstance.definition_id

GameState (runtime only, not persisted)
  → References Player, CardInstance, Avatar
  → Produces MatchRecord on completion
```

---

## 19. Key Indexes & Query Patterns

These are the most frequent queries the system will make. Database indexes should optimize for these.

| Query | Tables | Index |
|---|---|---|
| Get all cards for a player in a faction | CardInstance | (owner_id, template.faction_id) |
| Get all evolution-ready cards for a player | CardInstance | (owner_id, tier, chaos_energy) |
| Get cards in a specific deck | Deck → DeckEntry → CardInstance | (deck_id) → (card_instance_id) |
| Find opponent for matchmaking | Player | (season_rank, is_in_queue) |
| Get modifier definitions for a tier | ModifierDefinition | (tier) |
| Get player's match history | MatchRecord | (player_1_id OR player_2_id, started_at DESC) |
| Get player's active missions | Mission | (player_id, is_completed, expires_at) |
| Leaderboard by rank | Player | (season_rank_points DESC) |

---

## 20. Data Flow: Key Operations

### Card Evolution Flow
```
1. Client: Player taps "Evolve" on a CardInstance
2. Server: Validate chaos_energy >= threshold AND player has required shard
3. Server: Deduct shard from player inventory, record shard_quality (PLANAR/REFINED/PRISMATIC)
4. Client: Player selects prompt modifiers from tier-appropriate list (8-10 free / 25-30 mid / 40+ high)
5. Client: Player chooses "Channel toward Order" or "Channel toward Chaos"
6. Server: Roll 70/30 → determine actual_outcome (ORDER or CHAOS)
7. Server: Draw 2 ModifierDefinitions from appropriate tier pool
8. Server: Generate TriggeredAbility matching actual_outcome
9. Server: Construct FLUX Kontext prompt (faction art prefix + evolution direction + player modifiers + history)
10. Server: Set denoising strength (lower for Order outcome = subtle change, higher for Chaos = dramatic)
11. Server: Select model variant based on shard_quality (Kontext Dev for PLANAR, Kontext Pro for REFINED/PRISMATIC)
12. Server: Fire FLUX Kontext API call — input: current art_url, prompt: constructed prompt, resolution: by shard_quality
13. Server: Fire GPT-4o Mini API call — generate 2-3 new card name candidates + flavor text (faction voice + evolution history + previous names)
14. Client: Display evolution animation (runs concurrently with AI generation, ~3-5 seconds)
15. Server: For PRISMATIC shards, run second FLUX Kontext refinement pass on initial output
16. Client: Reveal new art. Present 2-3 name candidates — player selects favorite. Reveal new ability.
17. Client: Player picks 1 of 2 modifiers
18. Client: Reveal new flavor text
19. Server: Create ModifierInstance, TriggeredAbility, EvolutionRecord (with all AI metadata, all name_candidates, name_chosen)
20. Server: Update CardInstance (tier, current_name from name_chosen, stats, art_url, flavor_text, modifiers, abilities)
21. Server: Return updated CardInstance to client
```

**Fallback:** If FLUX Kontext generation fails or times out, apply a programmatic visual treatment to existing art (color shift + particle overlay matching evolution direction) as a temporary placeholder. Queue a retry. Push the full AI art to the client when ready via push notification.

### Chaos Roll Resolution Flow
```
1. Server: Roll d20 (random 1-20)
2. Server: Get active_player.instability
3. Server: Compare: roll < instability → CHAOS, roll > instability → ORDER, roll == instability → NOTHING
4. Server: If event triggered, select random event from appropriate pool
5. Server: Set active_player.last_event_type = result
6. Server: Recalculate all BattleModifier.is_attuned_active and .is_penalty_active for active player
7. Server: Recalculate all BattleCreature effective stats (attack, health, active_keywords)
8. Server: Fire all TriggeredAbility where trigger matches result (ON_ORDER for Order events, ON_CHAOS for Chaos events)
9. Server: Resolve event effect (e.g., "all creatures get +1 health")
10. Server: Broadcast roll result, event, trigger activations, stat changes to both clients
11. Server: Log all of the above to GameState.log
```

### Stat Recalculation (runs after every chaos roll and after any modifier/buff change)
```
For each BattleCreature on active player's board:
  1. Start with CardInstance.current_attack and .current_health
  2. For each modifier:
     a. Apply base_effect (always)
     b. If is_attuned_active: apply attuned_effect
     c. If is_penalty_active: apply penalty_effect
  3. Apply any active TempBuffs
  4. Set creature.attack and creature.health to computed values
  5. Recompute creature.active_keywords (innate + modifier grants based on attunement state + temp buffs)
  6. Recompute creature.instability_value:
     a. Start with template.base_instability
     b. Add sum of evolution_record.instability_change for each evolution step
     c. For each modifier with instability_adjustment != 0:
        - If instability_is_attuned == false: add instability_adjustment (always)
        - If instability_is_attuned == true AND is_attuned_active: add instability_adjustment
     d. Clamp result to minimum 0

Recompute player instability:
  1. Sum creature.instability_value for all living creatures on board
  2. Add avatar.instability_modifier
  3. Clamp result to 1–20 (D20 range)
```

---

## Revision Log

| Date | Change | Section(s) |
|---|---|---|
| 2026-02-16 | Platform-alignment pass: updated Avatar entity `frame_style` field comment from "CSS/asset reference" to "Asset reference" (removed CSS reference since client is now native iOS, not web). No game mechanics, numbers, or data structures were changed. | 9 (Avatar) |

# 01 — Battle Mechanics

This document defines the balance math, event content, modifier pools, keyword rules, and stat ranges that fill the containers established in `02-card-data-model.md`. It is the source of truth for all gameplay numbers and content.

**Depends on:** `00-game-design-master.md` (systems overview), `02-card-data-model.md` (data structures)

---

## 1. Power Budget System

Every card has an internal **Power Point (PP)** budget that determines how much total "stuff" it can have. Players never see PP — it's a design tool for ensuring cards at the same chaos mote cost are roughly equivalent in total power regardless of how that power is distributed.

### Base PP by Chaos Mote Cost

```
PP = (chaos_mote_cost × 2) + 1
```

| Chaos Mote Cost | Base PP |
|---|---|
| 1 | 3 |
| 2 | 5 |
| 3 | 7 |
| 4 | 9 |
| 5 | 11 |
| 6 | 13 |

### How PP Translates to Stats

- **1 PP = +1 ATK or +1 HP**
- Keywords cost PP (see Section 4)
- ATK and HP are not interchangeable at a 1:1 value in practice — HP is slightly more valuable because it determines survivability. But for initial design, 1:1 is the starting framework. Playtesting will introduce fractional adjustments (e.g., 1 HP = 1.2 PP).

### Stat Profile Is Determined by Card Design, Not Instability

Two cards at the same chaos mote cost have the same PP budget. Their instability value determines their **stat profile** — how that PP is distributed — not the total amount.

| Instability | Stat Lean | Keyword Lean | Archetype |
|---|---|---|---|
| 0–1 | HP-heavy, low ATK | Shield, Taunt, Lifesteal, Reach | Order-friendly defensive |
| 2 | Balanced | Any | Flexible / hybrid |
| 3 | ATK-heavy, lower HP | Flying, Piercing, Lifesteal | Aggressive |
| 4–5 | Glass cannon (high ATK, very low HP) | Piercing, Deathtouch, Flying | Chaos glass cannon |

**Example — 3-cost creatures (7 PP base) at different instability values:**

| Card | Instability | ATK | HP | Keywords | PP Check |
|---|---|---|---|---|---|
| Temple Warden | 1 | 2 | 5 | — | 2+5 = 7 ✓ |
| Dusk Stalker | 2 | 3 | 4 | — | 3+4 = 7 ✓ |
| Rift Slasher | 3 | 4 | 3 | — | 4+3 = 7 ✓ |
| Chaos Fang | 4 | 5 | 2 | — | 5+2 = 7 ✓ |

**Example — 3-cost creatures with keywords:**

| Card | Instability | ATK | HP | Keywords | PP Check |
|---|---|---|---|---|---|
| Iron Sentinel | 1 | 1 | 3 | Shield (3) | 1+3+3 = 7 ✓ |
| Void Piercer | 4 | 4 | 1 | Piercing (2) | 4+1+2 = 7 ✓ |

### Evolution PP Growth — Proportional Scaling

Chaos mote cost never changes through evolution. PP increases are **proportional to base PP**, ensuring the ratio between any two chaos mote costs stays consistent across all tiers. A 6-cost creature is always ~4.3× the power of a 1-cost creature, at every tier.

```
PP_at_tier = base_PP × tier_multiplier (rounded to nearest integer)
```

| Tier | Multiplier | 1-cost (3) | 2-cost (5) | 3-cost (7) | 4-cost (9) | 5-cost (11) | 6-cost (13) |
|---|---|---|---|---|---|---|---|
| Common | 1.0× | 3 | 5 | 7 | 9 | 11 | 13 |
| Uncommon | 1.5× | 5 | 8 | 11 | 14 | 17 | 20 |
| Rare | 2.0× | 6 | 10 | 14 | 18 | 22 | 26 |
| Epic | 2.5× | 8 | 13 | 18 | 23 | 28 | 33 |
| Legendary | 3.0× | 9 | 15 | 21 | 27 | 33 | 39 |

**Per-step PP gain = base_PP × 0.5 (rounded).** Split between stat growth and modifier budget:

| Step | Component | 1-cost | 2-cost | 3-cost | 4-cost | 5-cost | 6-cost |
|---|---|---|---|---|---|---|---|
| C→U | Total | 2 | 3 | 4 | 5 | 6 | 7 |
| | Stats | 1 | 2 | 2 | 3 | 4 | 4 |
| | **Modifier** | **1** | **1** | **2** | **2** | **2** | **3** |
| U→R | Total | 1 | 2 | 3 | 4 | 5 | 6 |
| | Stats | 0 | 1 | 2 | 2 | 3 | 4 |
| | **Modifier** | **1** | **1** | **1** | **2** | **2** | **2** |
| R→E | Total | 2 | 3 | 4 | 5 | 6 | 7 |
| | Stats | 1 | 2 | 2 | 3 | 4 | 4 |
| | **Modifier** | **1** | **1** | **2** | **2** | **2** | **3** |
| E→L | Total | 1 | 2 | 3 | 4 | 5 | 6 |
| | Stats | 0 | 1 | 2 | 2 | 3 | 4 |
| | **Modifier** | **1** | **1** | **1** | **2** | **2** | **2** |

**Minimum 1 PP modifier budget per step.** 1-cost cards receive 0 stat growth at U→R and E→L to guarantee a modifier slot at every evolution. This gives cheap creatures a stat ceiling but full strategic depth through modifiers.

**Modifier PP values that actually occur: 1, 2, and 3.** This defines the modifier pool structure (see Section 6).

### Instability-Adjusting Modifiers and PP

Modifiers that adjust a creature's instability cost PP, because pushing in *either* direction is a strategic benefit to the deck that wants it.

| Modifier Instability Effect | PP Cost |
|---|---|
| +1 instability | 1 PP |
| +2 instability | 2 PP |
| -1 instability | 1 PP |
| -2 instability | 2 PP |

This PP is spent from the modifier's budget. A modifier with +2 ATK base and +1 instability costs 3 PP total (2 for ATK, 1 for instability push). A modifier with +1 HP base and -1 instability costs 2 PP total.

### Ratio Validation

The ratio between any two chaos mote costs should remain consistent (±0.1) across all tiers:

| Tier | 2-cost | 6-cost | Ratio |
|---|---|---|---|
| Common | 5 | 13 | 2.6:1 |
| Uncommon | 8 | 20 | 2.5:1 |
| Rare | 10 | 26 | 2.6:1 |
| Epic | 13 | 33 | 2.5:1 |
| Legendary | 15 | 39 | 2.6:1 |

---

## 2. Instability System

Instability is the central strategic axis of the game. It determines whether chaos rolls produce Order or Chaos events, which in turn activates modifier attunement bonuses and triggered abilities. Every deckbuilding decision in the game ultimately relates to instability management.

### Core Instability Math

```
roll < player_instability  → CHAOS event
roll > player_instability  → ORDER event
roll == player_instability → NOTHING (no event this turn)
```

Roll is a D20 (1–20).

### Player Instability Calculation

```
player_instability = avatar_instability_modifier
                   + sum(creature_instability for each creature on board)
                   + sum(ruin_base_instability for each ruin on board)
```

Where each creature's instability is:

```
creature_instability = template.base_instability
                     + sum(evolution_step_instability_change)
                     + sum(modifier_instability_adjustments)
                     // floor of 0 — creature instability cannot go negative
```

### Base Instability (CardTemplate)

Every creature has a base instability value (0–5) set at card design time. This is a visible stat on the card alongside ATK, HP, and chaos mote cost.

Base instability determines the card's **stat profile** — its ATK/HP distribution and keyword tendencies (see Section 1). It does NOT determine total power.

| Base Instability | Card Identity |
|---|---|
| 0 | Pure stability — weakest stat profile but contributes zero board instability. Rare, usually cheap utility creatures. |
| 1 | Order-friendly — HP-heavy, defensive keywords. The backbone of order decks. |
| 2 | Balanced — flexible, works in any archetype. |
| 3 | Chaos-leaning — ATK-heavy, offensive keywords. |
| 4 | Chaos-committed — glass cannon stats. |
| 5 | Extreme chaos — highest ATK possible at cost, very fragile. Rare, usually designed as high-risk payoffs. |

**Design guideline for card pools within a faction:**

| Base Instability | % of Faction's Creature Pool |
|---|---|
| 0 | ~5% |
| 1 | ~25% |
| 2 | ~30% |
| 3 | ~25% |
| 4 | ~10% |
| 5 | ~5% |

This ensures every faction supports both Order and Chaos builds with a balanced middle ground.

### Evolution Instability Changes

Evolution pumps chaos energy into a creature, increasing instability by default. However, the **evolution outcome** (Order or Chaos, determined by the 70/30 channeling roll) modifies this:

| Evolution Step | Chaos Outcome | Order Outcome |
|---|---|---|
| Common → Uncommon | +1 instability | +0 (increase negated) |
| Uncommon → Rare | +1 instability | +0 (increase negated) |
| Rare → Epic | +1 instability | -1 instability (net reduction) |
| Epic → Legendary | +1 instability | -2 instability (net reduction) |

**Key design intent:** Order players are *rewarded* for evolving, especially to Legendary. The Epic→Legendary order evolution provides a -2 net instability reduction, making a fully evolved Legendary potentially more stable than it was at lower tiers. This ensures no player ever has a strategic reason to hold back evolution.

### Evolution Path Examples

**Starting card: base instability 2**

| Evolution Path | Unc | Rare | Epic | Leg | Final Instability |
|---|---|---|---|---|---|
| All Chaos (C/C/C/C) | 3 | 4 | 5 | 6 | 6 |
| All Order (O/O/O/O) | 2 | 2 | 1 | 0 | 0 (clamped) |
| 3 Chaos, Order at Leg | 3 | 4 | 5 | 3 | 3 |
| 2 Chaos, 2 Order (late) | 3 | 4 | 3 | 1 | 1 |
| Alternating C/O/C/O | 3 | 3 | 4 | 2 | 2 |
| Order early, Chaos late | 2 | 2 | 3 | 4 | 4 |

**Starting card: base instability 1 (Order-friendly card)**

| Evolution Path | Unc | Rare | Epic | Leg | Final Instability |
|---|---|---|---|---|---|
| All Order | 1 | 1 | 0 | 0 | 0 |
| All Chaos | 2 | 3 | 4 | 5 | 5 |
| Mostly Order (O/O/C/O) | 1 | 1 | 2 | 0 | 0 |

**Starting card: base instability 4 (Chaos-friendly card)**

| Evolution Path | Unc | Rare | Epic | Leg | Final Instability |
|---|---|---|---|---|---|
| All Chaos | 5 | 6 | 7 | 8 | 8 |
| All Order | 4 | 4 | 3 | 1 | 1 |
| Mostly Chaos (C/C/C/O) | 5 | 6 | 7 | 5 | 5 |

Note: An order player CAN evolve a high-instability card toward Order to tame it. A base-4 card that goes all-Order ends up at instability 1 — fully domesticated. This means no card is "locked out" of any archetype. Player choice during evolution determines the card's final strategic identity.

### Modifier Instability Adjustments

Some modifiers include instability changes as part of their effect. These stack on top of evolution instability changes. See Section 6 (Modifier Pools) for specific modifiers.

Roughly 1/3 of the modifier pool includes +instability effects (chaos-leaning), 1/3 includes -instability effects (order-leaning), and 1/3 are instability-neutral (hybrid-friendly).

### Avatar Instability Modifiers

| Avatar Type | Instability Modifier | Strategic Role |
|---|---|---|
| Order-leaning | -5 to -6 | Anchors instability low. Even with some evolved creatures, order events dominate. |
| Balanced | -3 to -4 | Middle ground. Deck composition determines whether order or chaos events are more likely. |
| Chaos-leaning | -1 to -2 | Minimal reduction. Board instability drives the chaos engine. |

### Instability Probability Table

Reference table showing the probability of Chaos vs. Order events for a given instability value.

| Player Instability | P(Chaos) | P(Order) | P(Nothing) |
|---|---|---|---|
| 1 | 0% | 95% | 5% |
| 2 | 5% | 90% | 5% |
| 3 | 10% | 85% | 5% |
| 4 | 15% | 80% | 5% |
| 5 | 20% | 75% | 5% |
| 6 | 25% | 70% | 5% |
| 7 | 30% | 65% | 5% |
| 8 | 35% | 60% | 5% |
| 9 | 40% | 55% | 5% |
| 10 | 45% | 50% | 5% |
| 11 | 50% | 45% | 5% |
| 12 | 55% | 40% | 5% |
| 13 | 60% | 35% | 5% |
| 14 | 65% | 30% | 5% |
| 15 | 70% | 25% | 5% |
| 16 | 75% | 20% | 5% |
| 17 | 80% | 15% | 5% |
| 18 | 85% | 10% | 5% |
| 19 | 90% | 5% | 5% |
| 20 | 95% | 0% | 5% |

**Design targets:**
- Order decks aim for instability 3–6 (~75–90% Order events)
- Chaos decks aim for instability 14–18 (~75–90% Chaos events)
- Hybrid decks sit around 8–12 (~50/50 split)

### Board State Instability Examples

**Order Control Deck (Order avatar at -6):**

| Slot | Card | Base Inst | Evo Changes | Mod Changes | Creature Inst |
|---|---|---|---|---|---|
| 1 | 2-cost Legendary (all Order evo) | 1 | -3 → clamped 0 | -1 (modifier) → 0 | 0 |
| 2 | 3-cost Epic (3 Order, 1 Chaos) | 1 | -1 | — | 0 |
| 3 | 4-cost Rare (2 Order) | 2 | -0 | — | 2 |
| 4 | 1-cost Uncommon (Order) | 1 | 0 | — | 1 |
| 5 | 5-cost Legendary (3 Order, 1 Chaos) | 2 | -1 | — | 1 |
| | | | | **Board total:** | **4** |
| | | | | **Avatar:** | **-6** |
| | | | | **Player instability:** | **0 (clamped)** |

Result: 0% Chaos, 95% Order, 5% Nothing. Absolute order lock. Shields regenerate every turn, healing ticks constantly.

**Chaos Swarm Deck (Chaos avatar at -1):**

| Slot | Card | Base Inst | Evo Changes | Mod Changes | Creature Inst |
|---|---|---|---|---|---|
| 1 | 1-cost Legendary (all Chaos) | 3 | +4 | +1 (modifier) | 8 |
| 2 | 2-cost Legendary (all Chaos) | 3 | +4 | — | 7 |
| 3 | 2-cost Epic (3 Chaos, 1 Order) | 4 | +2 | +1 (modifier) | 7 |
| 4 | 1-cost Rare (2 Chaos) | 3 | +2 | — | 5 |
| 5 | 3-cost Legendary (all Chaos) | 4 | +4 | — | 8 |
| | | | | **Board total:** | **35** |
| | | | | **Avatar:** | **-1** |
| | | | | **Player instability:** | **34 → clamped 20** |

Result: 95% Chaos, 0% Order, 5% Nothing. Chaos engine fully online. Massive ATK spikes, burst triggers, chaos events every turn. But if two creatures die, instability drops to maybe 14–16 — still chaotic but the ceiling drops and the engine stutters.

*(Note: instability is clamped at 1–20 since the D20 roll range is 1–20. Values above 20 have no additional effect.)*

### Instability Clamping Rules

```
creature_instability: minimum 0, no maximum (but only matters via player total)
player_instability:   minimum 1, maximum 20 (clamped to D20 range)
```

At player instability 1: 0% Chaos, 95% Order, 5% Nothing.
At player instability 20: 95% Chaos, 0% Order, 5% Nothing.

---

## 3. Turn Structure & Combat

### Game Setup

1. **Matchmaking** assigns Player 1 (P1) and Player 2 (P2) randomly.
2. Each player's deck is shuffled.
3. **P1 draws 4 cards.** P2 draws 5 cards (compensation for going second).
4. **Mulligan window:** each player may mulligan once (shuffle entire hand back, draw same number). Both players make this decision simultaneously — neither sees the other's choice.
5. **P2 receives a Chaos Spark** — a zero-cost, single-use spell that grants +1 chaos mote for one turn. It sits in P2's hand as a 6th card.
6. P1's turn begins. Each player starts at 0 chaos motes.

### Turn Phases (In Order)

Every turn follows these phases. Phases 1–4 are automatic (no player input, no timer). Phases 5–8 are the player's decision window (60-second timer applies).

```
AUTOMATIC PHASES (no timer):
  1. Start of Turn
  2. Chaos Roll
  3. Event Resolution
  4. Draw & Gain Mana

DECISION PHASES (60-second timer):
  5. Main Phase (play cards and spells)
  6. Declare Attackers
  7. Assign Blockers (defending player's decision)
  8. Combat Resolution

AUTOMATIC:
  9. End of Turn
```

---

### Phase 1: Start of Turn

**What happens:**

1. The turn counter advances.
2. **Ward expires** on any of the active player's creatures that had Ward from the previous turn.
3. **"Start of turn" effects fire** in this order:
   a. Active player's board effects (Corruption self-damage, stabilizer auras, Planar Ruin passive effects, modifier start-of-turn triggers, Exalt aura recalculation)
   b. Effects resolve left-to-right by board slot (slot 1 → slot 5). Ruins fire in their slot position alongside creatures.
4. Check for creature deaths from start-of-turn effects. Remove dead creatures. Trigger on-death effects (including Persist death triggers).
5. **Recalculate player instability** after any board changes (creature deaths change the sum; ruins contribute base_instability to the calculation).

**Design note:** Corruption's self-damage fires HERE, before the chaos roll. This means a Demonic creature might die before the chaos roll even happens, reducing instability. The Demonic player has to manage this — if their Corruption creatures are too fragile, they lose board presence (and instability) before the turn even starts.

---

### Phase 2: Chaos Roll

**What happens:**

1. A D20 is rolled (animated on screen).
2. The result is compared to the active player's current instability:
   - Roll < instability → **CHAOS event**
   - Roll > instability → **ORDER event**
   - Roll == instability → **NOTHING** (no event this turn)
3. **Update attunement state** on all the active player's creatures:
   - If CHAOS event: all Chaos-attuned modifier bonuses become active; Order-attuned bonuses deactivate; Order penalties activate on extra-powerful modifiers.
   - If ORDER event: all Order-attuned modifier bonuses become active; Chaos-attuned bonuses deactivate; Chaos penalties activate on extra-powerful modifiers.
   - If NOTHING: all attunement bonuses deactivate; no penalties.
4. **Recalculate creature stats** (ATK and HP) based on new attunement state. Modifier instability adjustments that are attunement-gated also update here.
5. **Recalculate player instability** if any modifier instability adjustments changed.

**Important:** Attunement state persists until the player's NEXT chaos roll. It does NOT change during the opponent's turn. If you rolled Chaos, your Chaos-attuned bonuses stay active through the opponent's turn until your next roll.

---

### Phase 3: Event Resolution

**What happens (if CHAOS or ORDER event fired):**

1. **Select event:** one event is chosen randomly (equal weight, 12.5% each) from the 8-event pool for the triggered type.
2. **Resolve event effect.** The full effect applies immediately. For events requiring player choice (O2 Planar Ward, O5 Fortify): valid targets highlight, player has a **10-second sub-timer** to select. Auto-selects leftmost valid target on timeout. This sub-timer does NOT count against the 60-second decision timer.
3. **Fire triggered abilities.** All creatures with triggered abilities matching the event type (ON_ORDER or ON_CHAOS) fire their abilities, left-to-right by board slot (slot 1 → slot 5).
4. Check for creature deaths from event/ability effects. Remove dead creatures. Fire ON_DEATH abilities on destroyed creatures (left-to-right, active player's deaths first).
5. **Recalculate player instability** after any board changes.

**If NOTHING:** skip this phase entirely.

**Event overlay:** A UI overlay shows the event name and effect for 2–3 seconds (or until tapped), then auto-dismisses. Creatures whose abilities fired are highlighted with a pulse.

---

### Phase 4: Draw & Gain Mana

**What happens:**

1. **Draw 1 card** from the top of the deck. If the deck is empty, no card is drawn (no penalty — the game continues normally).
2. **Gain 1 chaos mote** (up to the cap of 10). Unspent motes from previous turns carry over.

**Turn 1 specifics:** P1 gains 1 mote (has 1 to spend). P2 gains 1 mote (has 1 to spend, but can play the Chaos Spark for a temporary +1, effectively having 2 on their first turn).

**Mana progression:**

| Turn | P1 Mana (cumulative if unspent) | P2 Mana |
|---|---|---|
| 1 | 1 | 1 (+Chaos Spark = effectively 2) |
| 2 | 2 | 2 |
| 3 | 3 | 3 |
| ... | ... | ... |
| 10+ | 10 (cap) | 10 (cap) |

---

### Phase 5: Main Phase (Decision — Timer Running)

**What the active player can do:**

- **Play creature cards** from hand onto empty board slots (costs chaos motes). Creatures enter the board immediately with full stats. No summoning sickness — they can attack this same turn.
- **Play spell cards** from hand (costs chaos motes). Spells resolve immediately and are discarded.
- **Play stabilizer cards** from hand onto empty board slots (costs chaos motes). Stabilizers occupy creature slots.
- **Play Planar Ruin cards** from hand onto empty board slots (costs chaos motes). Ruins occupy creature slots. Max 1 ruin on field at a time. If a ruin is already on the field, additional ruin cards in hand are dimmed and unplayable.
- **Haste bonus attack:** When a creature with Haste is played, the controlling player may immediately declare it as attacking a specific enemy creature. Combat resolves instantly for that pair only (Shield check, damage, Deathtouch, Piercing, Lifesteal — full resolution). The Haste creature can still attack during the normal Declare Attackers phase that same turn.
- **Actions can be done in any order.** Play a creature, then a spell, then another creature — as long as you have mana and board space.
- **No spell response window.** The opponent cannot act during the active player's main phase. All spells resolve immediately without interaction.

**Targeting spells:** When a targeted spell is played, valid targets highlight on the board. The player taps a target to confirm. Tapping outside cancels the spell back to hand (mana refunded).

**Board slot limit:** 5 slots. If all 5 are occupied (by creatures, stabilizers, and/or ruins), no more cards that require board slots can be played. Spells (which don't occupy slots) can still be cast.

**When finished:** The player taps "Attack" (transitions to Phase 6) or "End Turn" (skips directly to Phase 9). If the timer expires during main phase, the turn auto-ends with no attack.

---

### Phase 6: Declare Attackers (Decision — Timer Running)

**What the active player does:**

1. Tap each creature they want to attack with. Selected attackers are visually marked (glow, tilt forward, etc.).
2. **Ruin targeting:** For each attacker, the player chooses whether it targets the opponent's HP (default) or the opponent's Planar Ruin (if one exists). Attackers targeting the ruin are marked with a ruin icon. Unblocked ruin-targeting attackers deal ATK damage to the ruin's HP. Unblocked face-targeting attackers deal damage to the player's HP as normal. If the ruin reaches 0 HP, it is destroyed and its destruction penalty fires immediately.
3. Creatures that **cannot** attack are dimmed:
   - Creatures that attacked or were played on the previous turn? NO — there is no summoning sickness and no "tap" exhaustion. All creatures can attack every turn.
   - The only restriction: **P1 cannot attack on turn 1.** On all other turns, all creatures can attack.
4. **Taunt forced-attack rule:** If the opponent controls any Taunt creatures, the active player MUST declare at least 1 attacker per opposing Taunt creature (up to the number of creatures they can legally attack with). The active player chooses which of their creatures to send — they'll typically send their weakest. If the active player has fewer creatures than the opponent has Taunt creatures, they must attack with all of them. **Note:** Taunt does NOT require attacking a ruin — Taunt forces attackers to be declared, not where they are directed. The attacker can target ruin or face; Taunt just ensures they attack.
5. The player can select additional attackers beyond the Taunt minimum.
6. **Tap "Confirm Attackers"** to lock in the attack. This transitions to Phase 7.
7. Alternatively, if there are no Taunt creatures forcing attacks, the player can tap "End Turn" to skip combat entirely.

**No additional spells after declaring attackers.** Once attackers are confirmed, the main phase is over. This is the key simplification from choosing main-phase-only spells — cast your buffs BEFORE committing to attack.

---

### Phase 7: Assign Blockers (Defending Player's Decision — Timer Running)

**Control passes to the defending player.** Their 60-second timer starts for this phase.

**What the defending player does:**

1. For each attacking creature, the defender may assign one of their creatures as a blocker. Each blocker can only block one attacker. Each attacker can only be blocked by one creature.
2. **Taunt forced-block rule:** Taunt creatures the defender controls MUST be assigned as blockers if there is any attacking creature they can legally block. The defender chooses WHICH attacker each Taunt creature blocks.
3. Assign blockers by dragging a defending creature onto an attacking creature, or tapping defender then tapping attacker.
4. **Tap "Confirm Blockers"** to lock in assignments.
5. Any attacking creatures NOT assigned a blocker will deal damage directly to the defending player's HP.

**Taunt Rules (combined forced-attack + forced-block):**

Taunt has two parts that work together:
- **Forced attack (Phase 6):** The opponent must declare at least 1 attacker per Taunt creature you control (up to their available creatures). They choose which creatures to send.
- **Forced block (Phase 7):** Your Taunt creatures must be assigned as blockers if they can legally block any attacker. You choose which attacker each Taunt blocks.

Examples:
- You have 1 Taunt creature. Opponent has 3 creatures. → Opponent must attack with at least 1 (chooses which). Your Taunt must block it.
- You have 2 Taunt creatures. Opponent has 3 creatures. → Opponent must attack with at least 2. Your 2 Taunts each block one attacker. Opponent's 3rd creature can attack or stay back.
- You have 3 Taunt creatures. Opponent has 1 creature. → Opponent must attack with 1 (all they have). One of your Taunts blocks (you choose which). Other 2 Taunts have no attacker to intercept — obligation satisfied.
- All opponent attackers have Flying and your Taunt lacks Reach/Flying: Taunt's forced-block obligation is waived (can't legally block). The forced-attack obligation still applies — the opponent still had to send attackers, they just fly over.

**Flying Blocking Rules:**

- A creature with Flying can only be blocked by creatures with Flying or Reach.
- A ground creature (no Flying) can be blocked by any creature (including Flying creatures — Flying creatures can "swoop down" to block ground attackers).

**Blocking Decision Space:**

The defender has meaningful choices:
- Which attacker each Taunt creature intercepts (if multiple Taunts/attackers)
- Whether to voluntarily block with non-Taunt creatures (sacrifice them to save HP)
- Whether to leave non-Taunt-blocked attackers unblocked (take face damage to preserve creatures)
- How to distribute blocks to maximize favorable trades (block the opponent's best creature with your Deathtouch creature, let the small ones through)

**If timer expires:** No blockers assigned. All attacking creatures hit face.

---

### Phase 8: Combat Resolution

**All combat damage is simultaneous.** Every attacker deals damage to its blocker (if blocked) or to face (if unblocked) at the same time. Every blocker deals damage to its attacker at the same time.

**Resolution steps:**

```
FOR EACH blocked combat pair (attacker vs. blocker), simultaneously:

  1. SHIELD CHECK (both sides):
     - If defender has Shield: Shield absorbs ALL damage from attacker. Shield breaks. 
       Attacker deals 0 effective damage. Skip Deathtouch/Piercing for attacker.
     - If attacker has Shield: Shield absorbs ALL damage from defender. Shield breaks.
       Defender deals 0 effective damage. Skip Deathtouch for defender.

  2. DEAL DAMAGE (both sides simultaneously):
     - Attacker deals ATK damage to defender's HP.
     - Defender deals ATK damage to attacker's HP.

  3. DEATHTOUCH CHECK:
     - If attacker has Deathtouch and dealt any damage (>0): defender is destroyed.
     - If defender has Deathtouch and dealt any damage (>0): attacker is destroyed.

  4. NORMAL DEATH CHECK:
     - Any creature reduced to 0 or less HP is destroyed.

  5. PIERCING CHECK (attacker only):
     - If attacker has Piercing AND the damage dealt exceeded the defender's 
       remaining HP (before death): excess damage is dealt to the defending PLAYER's HP.
     - Piercing does NOT apply to the defender (blockers don't pierce).
     - If Shield absorbed the hit, Piercing does not apply (0 effective damage).

  6. LIFESTEAL CHECK (both sides):
     - If attacker has Lifesteal: attacker's controller heals for the amount 
       of damage actually dealt to the defender (0 if Shield absorbed).
     - If defender has Lifesteal: defender's controller heals for the amount 
       of damage actually dealt to the attacker (0 if Shield absorbed).

FOR EACH unblocked attacker:
  - Attacker deals ATK damage to the defending player's HP.
  - If attacker has Lifesteal: attacker's controller heals for damage dealt to face.
  - If attacker has Piercing: no special effect (already hitting face directly).

AFTER ALL COMBAT:
  7. Remove all destroyed creatures from the board.
  8. Trigger on-death effects (left-to-right by board slot, active player's deaths first,
     then defending player's deaths).
  9. Recalculate both players' instability.
  10. Check for win condition (either player at 0 HP).
```

**Simultaneous damage examples:**

- 3/3 vs. 3/3: Both deal 3 damage. Both die.
- 2/1 Deathtouch vs. 5/5: Deathtouch creature deals 2, destroys the 5/5 via Deathtouch. The 5/5 deals 5, kills the 2/1. Both die.
- 6/4 Piercing vs. 2/3: Piercing creature deals 6 to the 2/3 (overkill by 3). 3 excess damage goes to the defending player's face. The 2/3 deals 2 to the 6/4 (6/4 survives at 6/2).
- 4/3 Lifesteal vs. 3/5 Shield: Shield absorbs all 4 damage. Lifesteal heals 0 (no damage dealt). Shield breaks. The 3/5 deals 3 damage to the 4/3 (4/3 survives at 4/0 — wait, 3 damage to 3 HP means it dies). So the 4/3 dies, the 3/5 loses its shield.

---

### Phase 9: End of Turn

**What happens:**

1. **"End of turn" effects fire** — includes Planar Ruin end-of-turn passive effects (e.g., Communion Altar's Shared Vitality) and any modifier end-of-turn triggers. Resolve left-to-right by board slot.
2. **"This turn" buffs expire.** Any temporary stat modifications that last "this turn" are removed.
3. **Recalculate creature stats** to remove expired buffs.
4. **Turn passes to the opponent.** Their Phase 1 begins.

---

### Turn 1 Special Rules

| Rule | P1 Turn 1 | P2 Turn 1 |
|---|---|---|
| Opening hand | 4 cards | 5 cards + Chaos Spark |
| Chaos roll | Yes (normal) | Yes (normal) |
| Draw | Yes (draws to 5) | Yes (draws to 6) |
| Gain mana | 1 (first mote) | 1 (first mote) |
| Main phase | Normal | Normal (can use Chaos Spark for +1 mote) |
| Attack | **SKIPPED** | Normal |

**Why P1 skips attack:** Without this restriction, P1 plays a creature and immediately deals damage before P2 has any board presence. Combined with P2's extra card and Chaos Spark, this keeps the first few turns competitive.

---

### Full Turn Example

**Setup:** P1 is playing Ironwright (Augment). P2 is playing Demonic Kingdoms (Corruption). It's turn 4.

**P1's board:** Slot 1: 3/5 with Shield + 2 Augment modifiers (instability 2). Slot 3: 2/2 with Taunt (instability 1). P1's avatar: -4 instability. **P1's instability: -4 + 2 + 1 = 0 → clamped to 1.**

**P1's Turn 4:**

1. **Start of Turn:** No start-of-turn effects on P1's board. No changes.

2. **Chaos Roll:** D20 result: 14. P1's instability is 1. 14 > 1 → **ORDER event.** All Order-attuned modifiers on P1's creatures activate. Chaos-attuned bonuses deactivate.

3. **Event Resolution:** Order event selected: "Your lowest-HP creature heals 2." P1's 2/2 Taunt heals 2 → becomes 2/4. No triggered abilities fire (none on these creatures). No deaths.

4. **Draw & Gain Mana:** P1 draws a card. P1 gains 1 mote → now has 4 motes.

5. **Main Phase:** P1 plays a 3-cost Ironwright creature (4/3 with Piercing) onto slot 2. Mana: 4 → 1. P1 decides to keep 1 mote. P1 taps "Attack."

6. **Declare Attackers:** P1 selects the 3/5 Shield creature (slot 1) and the new 4/3 Piercing creature (slot 2) as attackers. The 2/4 Taunt stays back to protect. P1 confirms.

7. **Assign Blockers (P2's decision):** P2's board has a 5/2 Lifesteal creature in slot 1 and a 3/1 Corruption creature in slot 3. P2 assigns the 5/2 Lifesteal to block the 3/5 Shield attacker. P2 lets the 4/3 Piercing go unblocked (taking 4 face damage but preserving the 3/1 for their next turn). P2 confirms.

8. **Combat Resolution:**
   - **Blocked pair (3/5 Shield vs. 5/2 Lifesteal):** P1's creature has Shield. P2's 5/2 deals 5 damage → Shield absorbs all. Shield breaks. P2's Lifesteal heals 0 (shield absorbed). P1's 3/5 deals 3 damage to the 5/2 → 5/2 becomes 5/0 → destroyed. P1's creature survives at 3/5 (no shield now).
   - **Unblocked (4/3 Piercing):** Deals 4 damage to P2's face. P2: 20 → 16 HP.
   - **After combat:** P2's 5/2 is removed from board. P2's instability recalculated. No on-death effects.

9. **End of Turn:** No end-of-turn effects. Turn passes to P2.

---

### Timer Rules

- **60 seconds** for all decision phases combined (Phases 5–6 for active player, Phase 7 for defending player).
- At **15 seconds remaining:** timer bar turns red, audio/visual warning.
- At **0 seconds:** 
  - If in main phase → turn auto-ends, no attacks.
  - If in declare attackers → no attackers declared, skip to end of turn.
  - If in assign blockers → no blockers assigned, all attackers hit face.
- Automatic phases (1–4, 9) are NOT timed. Animations play at fixed speed.
- The defending player gets their own 60-second timer for blocking decisions only.

### Game End Conditions

| Condition | Result |
|---|---|
| A player reaches 0 HP | That player loses. If both reach 0 simultaneously (rare — from simultaneous combat or event), the ACTIVE player loses (attacking into a mutual kill = you took the risk). |
| A player surrenders | That player loses. Available after turn 2. |
| A player disconnects for 3 consecutive turns | Auto-forfeit. |
| Timer expires 3 consecutive turns | Auto-forfeit (anti-stalling). |

---

## 4. Keywords

Nine creature keywords. Kept tight so that modifier-granted keywords feel impactful and players can internalize the full set quickly.

### Keyword Definitions

**Shield**
Absorbs the first instance of damage dealt to this creature, then is consumed. The shield blocks ALL damage from that single source (not just 1 point). A 7-ATK creature hitting a shielded 2-HP creature deals 0 damage and the shield breaks. Shield can be regenerated by Order events and certain modifiers.

**Lifesteal**
When this creature deals damage to another creature or to the opponent's HP, the controlling player heals for the same amount. Applies to both attack damage and any damage-dealing triggered abilities on this creature.

**Flying**
This creature can only be blocked by creatures with Flying or Reach. Unblocked creatures deal damage directly to the opponent's HP. Flying creatures can block other Flying creatures normally.

**Reach**
This creature can block creatures with Flying. No other special effect. Reach exists to give non-Flying decks an answer to Flying threats without requiring them to run Flying creatures.

**Deathtouch**
Any damage dealt by this creature to another creature destroys it, regardless of the target's remaining HP. 1 damage from a Deathtouch creature kills a 20-HP creature. Extremely powerful on low-ATK creatures where the stat inefficiency is offset by guaranteed kills.

**Taunt**
Two-part rule: *forced attack* + *forced block.* While you control a creature with Taunt, the opponent must declare at least 1 attacker during their Declare Attackers phase for each Taunt creature you control (up to the number of creatures they can legally attack with — they cannot be forced to attack with more creatures than they have). Your Taunt creatures must be assigned as blockers during the Assign Blockers phase if there is any attacker they can legally block. The opponent chooses which of their creatures to send in; you choose which attacker each Taunt blocks. Taunt's forced-attack obligation is waived if the opponent has no creatures that can attack. Taunt's forced-block obligation is waived if all attackers have Flying and the Taunt creature lacks Reach/Flying.

**Piercing**
When this creature deals combat damage to a blocking creature and the damage exceeds the blocker's remaining HP, the excess damage is dealt to the opponent's HP. A 6-ATK Piercing creature blocked by a 2-HP creature deals 2 damage to the creature (killing it) and 4 damage to the opponent. Piercing does NOT apply when this creature is the blocker.

**Haste**
When this creature is played, it may immediately declare an attack against a target creature before the normal Declare Attackers phase. This is a bonus attack that happens during the Main Phase as an immediate combat. The creature can still attack normally during the Declare Attackers phase that same turn, effectively attacking twice on its first turn. The bonus attack follows full combat resolution (Shield check, damage, Deathtouch, Piercing, Lifesteal) for that pair only. Haste creatures ignore deployment restrictions from Persist lingering effects, Planar Ruin deployment penalties, and any future mechanics that restrict freshly-played creatures.

**Ward**
This creature cannot be targeted by the opponent's modifier effects, triggered ability effects, or spell effects for 1 turn after deployment. Ward expires at the start of the controlling player's next turn. Key clarifications: (1) Ward only protects against targeted effects -- area-of-effect abilities and events bypass Ward. (2) Ward only protects against the OPPONENT's effects; the controlling player can still target their own Ward creature. (3) Ward does NOT protect against combat damage. (4) Ward does NOT prevent Chaos/Order event effects (events are system-level, not targeted). (5) Ward blocks targeted Persist death-trigger effects; if a Persist trigger randomly selects a Ward creature, the effect retargets to another valid target (fizzles if none). (6) Ward is consumed on expiry, not on absorption -- it simply expires after its duration.

### Keyword PP Costs

| Keyword | PP Cost | Category | Rationale |
|---|---|---|---|
| Shield | 3 | Defensive | Absorbs one full hit — can negate massive damage. Very strong, especially on high-HP creatures. |
| Lifesteal | 2 | Sustain | Value scales with ATK; marginal on low-ATK creatures, powerful on high-ATK. |
| Flying | 2 | Evasion | Evasion is strong but hard-countered by Reach and other Flying. |
| Reach | 1 | Defensive (situational) | Purely defensive, only relevant vs. Flying. |
| Deathtouch | 3 | Removal | Guarantees trades with any creature. Makes small creatures deadly efficient. |
| Taunt | 1 | Defensive (forced engagement) | Forces opponent to attack and forces your creature to intercept. Strong defensive tool but opponent chooses what to send (counterplay: send weakest creature, spell removal, fly over). |
| Piercing | 2 | Aggressive | Converts excess damage to face damage; scales with ATK vs. low-HP blockers. |
| Haste | 2 | Tempo | Bonus attack on play turn. Effectively attacks twice on first turn. Strong on high-ATK creatures and Deathtouch (instant removal on play). |
| Ward | 1 | Protective (deployment) | One-turn protection from targeted effects. Comparable to Reach and Taunt at 1 PP. Does nothing against combat, AoE, or events. |

### Keyword Interaction Matrix (9x9)

How every keyword interacts with every other keyword when they appear in combat or on the same creature.

#### Combat Interactions (Attacker vs. Defender)

| Attacker \ Defender | Shield | Lifesteal | Flying | Reach | Deathtouch | Taunt | Piercing | Haste | Ward |
|---|---|---|---|---|---|---|---|---|---|
| **Shield** | Both shields absorb. Shields cancel each other. No damage dealt. Both shields break. | Shield absorbs defender's damage. Lifesteal heals 0. Attacker deals damage normally. | No special interaction. | No special interaction. | Shield absorbs Deathtouch hit. Creature survives. Shield breaks. | No special interaction. Shield still absorbs first hit. | No special interaction. | No special interaction. | No combat interaction (Ward does not affect combat). |
| **Lifesteal** | Lifesteal heals 0 if defender's Shield absorbs (no damage dealt). | Both heal for damage dealt. Both creatures survive longer in sustain matchups. | No special interaction. | No special interaction. | Lifesteal attacker heals for damage dealt. Deathtouch defender kills attacker regardless. Both resolve. | No special interaction. | No special interaction. | No special interaction. | No combat interaction. |
| **Flying** | No special interaction. | No special interaction. | Both creatures can block each other. Standard combat. | Reach creature CAN block Flying attacker. Defender chooses. | Flying attacker killed by Deathtouch if blocked by creature with Deathtouch + Flying or Deathtouch + Reach. | Ground Taunt cannot block Flying (forced-block waived). Taunt + Reach/Flying CAN block. Forced-attack obligation still applies. | No special interaction. | No special interaction. | No combat interaction. |
| **Reach** | No special interaction. | No special interaction. | Reach creature blocks Flying attacker normally. | No special interaction (standard combat). | No special interaction. | No special interaction. | No special interaction. | No special interaction. | No combat interaction. |
| **Deathtouch** | Shield absorbs Deathtouch hit. Creature survives. Shield breaks. | Deathtouch kills defender. Defender's Lifesteal still heals (simultaneous damage). | No special interaction (still needs to be blocked). | No special interaction. | Both creatures kill each other regardless of stats (mutual Deathtouch). | Taunt forces engagement. Deathtouch kills the Taunt creature regardless of HP. | Deathtouch kills blocker. Piercing applies -- all ATK minus 1 goes to face. EXTREMELY powerful combo. | No special interaction. | No combat interaction. |
| **Taunt** | No special interaction. | No special interaction. | Taunt forced-block waived against Flying if Taunt lacks Reach/Flying. Forced-attack still applies. | No special interaction. | Taunt forces engagement. Deathtouch kills the Taunt creature. | Multiple Taunts: opponent must send 1 attacker per Taunt. Defender chooses which Taunt blocks which. | No special interaction. | No special interaction. | No combat interaction. |
| **Piercing** | Shield absorbs ALL damage. No pierce-through. Shield breaks. 0 damage to face. | No special interaction. | No special interaction. | No special interaction. | Piercing excess goes to face. Deathtouch defender kills attacker. Both resolve. Face damage still applies. | Piercing through Taunt blocker sends excess to face. | Piercing is attacker-only. Defender's Piercing does nothing when blocking. | No special interaction. | No combat interaction. |
| **Haste** | No special combat interaction (Haste is a deployment keyword). | No special interaction. | No special interaction. | No special interaction. | No special interaction. | No special interaction. | No special interaction. | If both have Haste, no special interaction (Haste is about deployment). | No combat interaction. |
| **Ward** | No combat interaction (Ward does not affect combat). | No combat interaction. | No combat interaction. | No combat interaction. | No combat interaction. Ward does NOT protect against Deathtouch in combat. | No combat interaction. Ward creature with Taunt still must block. | No combat interaction. | No combat interaction. | No combat interaction (Ward vs Ward is irrelevant). |

#### Same-Creature Keyword Stacking

When a creature has multiple keywords, they all apply simultaneously:

| Combination | Effect |
|---|---|
| Shield + Taunt | Forces engagement AND absorbs first hit. Excellent defensive wall. |
| Shield + Deathtouch | Shield protects the fragile Deathtouch creature for one engagement. After Shield breaks, Deathtouch trades with anything. |
| Shield + Lifesteal | Shield absorbs the first hit (Lifesteal irrelevant on that exchange). After Shield breaks, Lifesteal sustains. |
| Flying + Deathtouch | Evasive creature that kills anything it touches. Must be blocked by Flying/Reach, or it goes face. Very powerful. |
| Flying + Piercing | Evasion + pierce. If blocked by Flying/Reach creature with less HP than ATK, excess goes to face. |
| Flying + Lifesteal | Evasive Lifesteal. Hard to block, heals on hit. Strong sustain attacker. |
| Deathtouch + Piercing | Kills blocker on 1 damage, ALL remaining ATK pierces to face. The most aggressive keyword combo. |
| Deathtouch + Lifesteal | Kills anything it hits, heals for damage dealt. Efficient and sustaining. |
| Taunt + Reach | Can block Flying attackers AND forces engagement. Complete defensive package. |
| Taunt + Deathtouch | Forces engagement AND kills whatever it blocks. Opponent MUST send a creature to die. Nuclear deterrent. |
| Haste + Deathtouch | Deploy and immediately kill an enemy creature with the bonus attack. Instant removal on a creature. |
| Haste + Piercing | Deploy, bonus attack pierces through a blocker to face, then attack again in combat. Double damage window. |
| Haste + Lifesteal | Deploy, immediately heal from the bonus attack, then heal again in combat. Burst healing. |
| Ward + Shield | Protected from targeted removal (Ward) AND first combat hit (Shield). Maximum survival for one turn. |
| Ward + Taunt | Cannot be removed by spells, must be attacked through. Opponent cannot use removal to bypass the Taunt. |
| Ward + Deathtouch | Cannot be removed before combat. Opponent must commit a creature to kill it. |
| Ward + Flying | Cannot be targeted AND hard to block. Very safe aggressive creature for one turn. |
| Haste + Ward | Deploy, attack immediately, and be safe from targeted removal until next turn. Maximum tempo + safety. |

### Combat Resolution Order

Combat damage is simultaneous. Both attacker and blocker deal damage at the same time. See **Section 3: Turn Structure & Combat, Phase 8** for the full step-by-step resolution algorithm including Shield, Deathtouch, Piercing, and Lifesteal interaction order.

**Key rule (simultaneous damage):** Both creatures deal damage at the same time. A 3/3 vs. a 3/3 results in both dying. A 3/2 Deathtouch vs. a 5/5 results in both dying (Deathtouch kills the 5/5, the 5/5's 5 damage kills the 3/2). Lifesteal on either side triggers based on damage actually dealt.

### Keyword Design Intent by Archetype

| Keyword | Order Affinity | Chaos Affinity | Notes |
|---|---|---|---|
| Shield | ★★★ | ★ | Core order keyword. Order events regenerate shields. High-HP creatures maximize shield value. |
| Lifesteal | ★★★ | ★★ | Sustain keyword. Order decks love the grind; chaos decks can use it to offset fragility. |
| Reach | ★★★ | ★ | Defensive answer to Flying. Almost exclusively order. |
| Taunt | ★★★ | ★ | Forces engagement and intercepts. Denies turtling. Scales with count. Order staple. Countered by Flying, spells, sending disposable attackers. |
| Flying | ★ | ★★★ | Evasion for pushing damage. Chaos wants to bypass blockers. |
| Piercing | ★ | ★★★ | Converts overkill into face damage. Chaos wants every point of ATK to count. |
| Deathtouch | ★★ | ★★★ | Efficient removal. Chaos loves it on cheap glass cannons; Order can use it defensively on Taunt creatures. |
| Haste | ★ | ★★★ | Tempo keyword. Bonus attack on play turn rewards aggression. Primary for Endless (aggressive attrition), secondary for Demonic (fast burnout). |
| Ward | ★★★ | ★ | Deployment protection. Ensures key creatures survive their first turn. Primary for Celestial (protect formation building), secondary for Ironwright (protect Augment investment). |

### Keyword Affinity by Faction

| Keyword | Ironwright | Fey Courts | Demonic | Celestial | Endless |
|---|---|---|---|---|---|
| Shield | High | Medium | Low | High | Low |
| Lifesteal | Medium | Low | High | Low | Medium |
| Flying | Low | Medium | Medium | High | Low |
| Reach | Medium | High | Low | Medium | Low |
| Deathtouch | Low | Low | High | Low | High |
| Taunt | High | Medium | Low | High | Low |
| Piercing | Medium | Low | High | Low | Medium |
| Haste | Low | Low | Medium | Low | High |
| Ward | Medium | Medium | Low | High | Low |

---

## 5. Factions

Five factions. Each faction defines a card art style, creature thematic identity, and an **exclusive mechanic** available only through that faction's modifier pool. Decks are single-faction — all cards in a deck must share a faction.

### The Ironwright Collective (Brutalist Space-Industrial)

**Art style:** Concrete, iron, hydraulics, rebar, void industry, star conquest, orbital machinery, reactor cores, gravity wells. Massive orbital shipyards, star-harvesting factories, void-faring siege engines. Exposed rebar, poured concrete, rusted iron, hydraulic pistons. NOT brass, gears, steam, clockwork, or Victorian.

**Art references:** Piranesi "Carceri d'invenzione" (died 1778 — PD) + John Martin.

**Sub-factions:** The Foundry Directorate (centralized, geometric, blueprinted, Order-aligned) and The Scrap Legions (self-assembled from battlefield wreckage, patchwork, jury-rigged, Chaos-aligned).

**Exclusive mechanic: Augment**

Augment modifiers stack small persistent effects that compound. The more Augment modifiers a creature has, the stronger each one becomes. Each evolution bolts another component onto the creature.

- Effects reference Augment count: "+1 ATK for each Augment modifier on this creature," "Shield regenerates at start of turn if this creature has 3+ Augment modifiers"
- Stacking is self-contained per creature — no cross-creature Augment synergy. Rewards deep evolution investment on individual creatures.
- Natural synergy with Shield (protect your investment), Lifesteal (sustain your big threats), Taunt (force trades on your terms), Ward (protect Augment investment from targeted removal)

**Play identity:** Midrange/value. Fewer creatures, each heavily invested in. An Ironwright Legendary with 4 Augment modifiers is individually terrifying — a walking fortress of compounding effects. Vulnerable to Deathtouch (ignores all that stacked HP) and efficient 1-for-1 removal (each kill loses a lot of invested Augment value).

**Example faction modifiers:**
- **Rebar Reinforcement** (1 PP): Base +1 HP per Augment modifier on this creature. Order Attuned: +1 HP.
- **Overclock Protocol** (1 PP): Base +1 ATK per Augment modifier on this creature. Chaos Attuned: +1 ATK this turn.
- **Void-Iron Bulkhead** (2 PP): Base: Shield. Order Attuned: regenerate Shield at start of turn if creature has 3+ Augment modifiers.
- **Reactor Surge** (1 PP): Base: +1 instability, +1 ATK per Augment modifier. Chaos Attuned: +1 ATK.
- **Gravity Dampener** (2 PP): Base: -1 instability, +1 HP per Augment modifier. Order Attuned: +1 HP per Augment modifier.
- **Emergency Containment** (3 PP): Base: when this creature would die, if it has 4 Augment modifiers, survive with 1 HP instead (once per game). Order Attuned: also gain Shield.

### The Fey Courts (High Fantasy / Fey & Druidic)

**Art style:** Ancient forests, bioluminescent flora, antlered fey lords, mossy stone circles, living wood armor, mycelial networks, wild hunt imagery.

**Art references:** Arthur Rackham and Edmund Dulac.

**Sub-factions:** The Verdant Throne (bright, growth, Spring/Summer) and The Hollow Court (dark, frost, Autumn/Winter).

**Exclusive mechanic: Bond**

Bond modifiers create synergies between creatures on the board. They care about how many other creatures you have, what keywords they carry, and whether they're also Bonded. The power is in the network — each creature makes the others stronger, but losing one weakens the formation.

- Effects reference board state: "+1 ATK for each other friendly creature with a Bond modifier," "While you control 3+ creatures: this creature has Shield," "Adjacent creatures gain +1 HP"
- Cross-creature synergy means going wide is rewarded. A full 5-creature board with 3-4 Bond modifiers is overwhelming.
- Natural synergy with Taunt (protect your Bond network), Shield (keep the board intact), Reach (defensive posture while building bonds)

**Play identity:** Board-centric midrange/control. Individually Fey creatures are slightly below curve — the power is in the network. The Fey player wins by building and maintaining a stable board where every creature empowers the others. Board wipes are devastating, but if the board stabilizes, the cumulative Bond value is insurmountable.

**Example faction modifiers:**
- **Sworn Oath** (1 PP): Base: +1 ATK while you control 2+ other creatures. Order Attuned: +1 HP while you control 2+ other creatures.
- **Rootweave** (2 PP): Base: adjacent creatures get +1 ATK. Order Attuned: adjacent creatures also get +1 HP.
- **Mycelial Link** (2 PP): Base: +1 HP for each other friendly creature with a Bond modifier. Chaos Attuned: +1 ATK for each other friendly creature with a Bond modifier.
- **Wild Hunt's Call** (1 PP): Base: +1 instability, +1 ATK while you control 3+ creatures. Chaos Attuned: +1 ATK.
- **Warden's Grove** (2 PP): Base: -1 instability, adjacent creatures gain +1 HP. Order Attuned: adjacent creatures gain Reach.
- **Last Stand** (3 PP): Base: when another friendly creature dies, this creature gets +2 ATK permanently. Chaos Attuned: also gains Piercing for 1 turn.

### The Demonic Kingdoms

**Art style:** Hellfire, obsidian fortresses, demonic horns and wings, blood rituals, ash-choked wastelands, infernal glyphs, corrupted flesh.

**Art references:** Gustave Dore Inferno etchings, Hieronymus Bosch.

**Sub-factions:** The Furnace Lords (wrath, volcanic) and The Obsidian Bureaucracy (schemes, contracts).

**Exclusive mechanic: Corruption**

Corruption modifiers trade your own resources (HP, creature health, board slots) for outsized effects. Every Corruption modifier is a dark bargain — tremendous power at a cost. The self-damage creates natural synergy with Lifesteal (heal back what you sacrifice) and Deathtouch (creatures were going to die anyway, trade up).

- Effects include self-damage: "At start of your turn: this creature takes 1 damage. Chaos Attuned: +3 ATK" or "When this creature dies: deal 3 damage to enemy avatar"
- Highest raw power ceiling of any faction, but on a clock against self-inflicted damage
- Natural synergy with Lifesteal (sustain through self-damage), Deathtouch (maximize value from dying creatures), Piercing (push maximum face damage before burnout)

**Play identity:** Aggro/burn. Fast, explosive, high-risk. The Demonic player's board looks terrifying but is fragile — creatures hurting themselves, HP dwindling, but damage output is enormous. A Demonic mirror match is a race to see who burns out first. Wants to close games quickly before the clock runs out.

**Example faction modifiers:**
- **Blood Tithe** (1 PP): Base: this creature takes 1 damage at start of your turn. Chaos Attuned: +2 ATK.
- **Soul Siphon** (2 PP): Base: Lifesteal. Corruption bonus: when this creature kills an enemy creature, deal 2 damage to enemy avatar.
- **Death Pact** (2 PP): Base: when this creature dies, deal damage equal to its ATK to a random enemy creature. Chaos Attuned: deal damage to enemy avatar instead.
- **Hellfire Brand** (1 PP): Base: +2 instability, +2 ATK, this creature takes 1 damage at start of your turn. Chaos Attuned: +1 ATK.
- **Binding Chains** (2 PP): Base: -1 instability, Lifesteal. Order Attuned: heal 1 HP to this creature at start of your turn.
- **Infernal Bargain** (3 PP): Base: +3 ATK, this creature takes 2 damage at start of your turn. Chaos Attuned: Piercing. If creature dies from self-damage, deal 4 damage to enemy avatar.

### The Celestial Crusade (Divine / Holy War)

**Art style:** Self-righteous divine crusaders, holy gold armor, biblically-accurate multi-winged multi-eyed celestials, divine mandates, angelic formations, holy fire. Superior to all non-celestials, waging holy war for dominion.

**Art references:** Gustave Dore biblical illustrations, William Blake visionary paintings (died 1827 — PD).

**Sub-factions:** Knights of Deliverance (stoic paladins, divine armor, formation discipline, military arm) and Heaven's Chosen (biblically-accurate multi-winged, multi-eyed celestials, divine arm).

**Exclusive mechanic: Exalt**

Exalt modifiers provide aura effects that benefit the controlling player's board when specific board conditions are met. The Celestial player wins by building a wide, stable formation where every creature empowers every other creature through divine mandate.

- Exalt effects are conditional auras. Each Exalt modifier has a threshold condition (e.g., "while you control 3+ creatures") and an aura effect that applies when the condition is met.
- Exalt auras affect ALL friendly creatures (including the source), unless the modifier text specifies otherwise. Distinct from Bond (which references specific creatures or Bond-holders). Exalt is about divine commandment — all are uplifted.
- Exalt thresholds are creature-count based. Early-tier: 2+ creatures (easy). Core: 3+ creatures (medium). Late-tier: 4+ creatures (hard). Full board (5): very hard, Legendary-tier only.
- Exalt auras stack from different sources but a single source only applies its effect once.
- Exalt collapses when the threshold is not met. Board wipes or targeted removal dropping creature count below threshold deactivate the aura immediately.
- Order-attuned Exalt: defensive auras (HP, Shield propagation, healing). Chaos-attuned Exalt: offensive auras (ATK, damage-dealing, keyword sharing).
- Natural synergy with Shield (protect formation), Taunt (protect Exalt sources), Ward (protect deployment), Reach (defend against Flying)

**Play identity:** Board-centric formation. Slightly below-curve individually (paying for aura potential). A single Celestial creature with an Exalt modifier on an empty board has a dead modifier. But 4+ creatures with stacking Exalt auras creates an overwhelming defensive or offensive wall. Vulnerable to board wipes (collapse all auras simultaneously), targeted removal of high-value Exalt sources, and fast aggro before the formation stabilizes.

**Example faction modifiers:**
- **Blessed Vigil** (1 PP): Base: +1 HP while you control 2+ creatures (Exalt). Order Attuned: +1 HP to this creature.
- **Righteous Fury** (1 PP): Base: +1 ATK while you control 2+ creatures (Exalt). Chaos Attuned: +1 ATK this turn.
- **Divine Aegis** (2 PP): Base: Exalt aura — while you control 3+ creatures, all friendly creatures get +0/+1. Order Attuned: grant Shield to this creature.
- **Holy Judgment** (2 PP): Base: Exalt aura — while you control 3+ creatures, all friendly creatures get +1/+0. Chaos Attuned: +1 ATK to this creature.
- **Archangel's Mantle** (3 PP): Base: Shield. Exalt aura: while you control 3+ creatures, all friendly creatures get +0/+1. Order Attuned: regenerate Shield at start of turn.
- **Celestial Purge** (3 PP): Base: +2 ATK. Exalt condition: while you control 5 creatures (full board), all friendly creatures get +3 ATK and Piercing. Chaos Attuned: deal 2 damage to all enemy creatures. Order penalty: this creature takes 2 damage.

### The Endless (Undead / Necromantic)

**Art style:** The undead — raised, summoned, abandoned. Necromancers and liches raising armies, bone constructs, ghostly spectres, skeletal hordes, phylacteries, ethereal mist, necrotic energy. Unnatural, relentless.

**Art references:** Gustave Dore Inferno etchings, Francisco Goya "Black Paintings" (died 1828 — PD).

**Sub-factions:** Necromantic Cabals (necromancers and liches raising armies, creating abominations — robed figures, bone constructs, phylacteries) and The Lost Spectres (ghosts and spectres summoned and abandoned by liches — ethereal, translucent, tragic).

**Exclusive mechanic: Persist**

Persist modifiers trigger effects when creatures die or create lingering effects that continue after death. The Endless player wins through attrition — every creature that dies (on either side) generates value. Trading is not just acceptable, it is the strategy.

- Persist effects trigger on death. The primary trigger is ON_DEATH — when the creature carrying the Persist modifier is destroyed (from combat, spells, Chaos events, any source).
- Persist lingering effects persist after death. Some modifiers create lasting effects that remain active for a number of turns after the creature dies, tracked as board-level effects.
- Late-tier Persist modifiers can trigger when OTHER friendly creatures die (not just the carrier). Board wipes become actively dangerous for the opponent — killing 3 Endless creatures triggers 3+ death effects.
- Persist effects fire exactly once per modifier per death. No recursion loops.
- Persist does NOT bring creatures back. The value comes from death consequences, not resurrection.
- Order-attuned Persist: sustain and board preservation (healing allies on death, buffing survivors, lingering defensive effects). Chaos-attuned Persist: aggression and punishment (dealing damage on death, debuffing enemies, lingering offensive effects).
- Natural synergy with Deathtouch (trade with anything, trigger Persist), Haste (deploy, attack, die for triggers), Lifesteal (sustain through attrition), Piercing (push face damage alongside attrition)

**Play identity:** Aggro/attrition. Creatures are expendable — the deck wants to trade, trigger death effects, and grind the opponent down. Persist modifiers do nothing while the creature is alive; value is back-loaded into the death moment. Vulnerable to face rush (if opponent ignores Endless creatures, Persist never triggers), Shield walls (prevents trading), and fast games ending before creatures die.

**Example faction modifiers:**
- **Parting Gift** (1 PP): Base: +1 HP. Persist: on death, heal a random friendly creature for 2 HP. Order Attuned: +1 HP.
- **Death Rattle** (1 PP): Base: +1 ATK. Persist: on death, deal 1 damage to a random enemy creature. Chaos Attuned: +1 ATK this turn.
- **Soul Shepherd** (2 PP): Base: +1 HP. Persist sympathy: when any friendly creature dies, this creature gets +0/+1 permanently. Order Attuned: +1 HP.
- **Grave Eruption** (2 PP): Base: +1 ATK. Persist: on death, deal 2 damage to all enemy creatures. Chaos Attuned: +1 ATK.
- **Requiem** (3 PP): Base: Shield, +1 HP. Persist: on death, all friendly creatures gain Shield and +0/+1 permanently. Order Attuned: +1 HP.
- **Soul Bomb** (3 PP): Base: +1 instability, +2 ATK, +1 HP. Persist: on death, deal damage equal to this creature's ATK to the enemy avatar. Chaos Attuned: +2 ATK this turn.

Full modifier definitions for all five factions: see `docs/design/PHASE1B-mechanics.md`.

### Faction Matchup Matrix (5x5)

| Attacker \ Defender | Ironwright (Augment) | Fey (Bond) | Demonic (Corruption) | Celestial (Exalt) | Endless (Persist) |
|---|---|---|---|---|---|
| **Ironwright** | Mirror: tall vs tall. First to assemble a 4-Augment creature wins. | IW wants efficient 1-for-1 trades. Each kill weakens Bond. Fey wants to go wide and overwhelm. | IW's stacked HP resists burst. Deathtouch is the Demonic answer. Slow grind favors IW. | IW's targeted threats vs Celestial's wide formation. Removal spells are key — kill Exalt sources. | IW's tall creatures are hard to trade into profitably for Endless. But Persist death value means even bad trades generate something. |
| **Fey** | Bond network can overwhelm a single Augment stack with numbers. But if IW kills Bond creatures 1-for-1, the network weakens. | Mirror: both go wide. Whoever gets ahead in creature count snowballs. | Bond network can stabilize against Corruption burst if it survives the early game. | Similar board-centric strategies. Bond is more resilient to partial removal than Exalt's hard thresholds. | Fey wants to avoid trading (preserves Bond). Endless wants to force trades (triggers Persist). Taunt and Shield protect the Bond network. |
| **Demonic** | Deathtouch ignores Augment HP stacking. Burst can kill before Augment fully stacks. | Corruption burst can shatter Bond network early. If Fey stabilizes, Demonic burns out. | Mirror: race to kill. Highest burst wins. Both players take self-damage. | Corruption aggro tries to kill Celestial creatures before formation stabilizes. If Exalt gets Shield auras up, Demonic burns out. | Both profit from death. Explosive matchup with creatures dying constantly. Demonic wants to close fast; Endless wants to grind. |
| **Celestial** | Formation vs investment. Exalt auras on 4+ creatures can overwhelm a single Augment stack. IW removal targets Exalt sources. | Both are board-centric. Exalt auras are global; Bond effects are targeted. Exalt is more fragile to partial removal. | Shield auras and healing counter Corruption burst. Celestial stabilizes and grinds. | Mirror: who builds the wider board faster. AoE spells break the stalemate. | Celestial wants to avoid deaths (maintains formation). Endless wants to force trades. Tension between "keep alive" and "kill for value" defines the matchup. |
| **Endless** | Persist death triggers generate value even when trading unfavorably against Augment stacks. Deathtouch is the key keyword. | Forcing trades weakens Bond AND triggers Persist. Endless favored if it can force engagement. | Both thrive on death. Volatile, explosive games. Whoever generates more death value wins. | Endless picks apart the formation one creature at a time. Each kill weakens Exalt AND triggers Persist. But Shield auras make forcing trades difficult. | Mirror: mutual death value. Whoever has better Persist triggers and more efficient trades wins. Haste creatures create tempo advantages. |

---

## 6. Modifier Pools

### Pool Structure

Modifiers are organized into pools by three dimensions:

1. **PP budget** (1, 2, or 3 PP) — determined by the card's chaos mote cost and evolution step
2. **Tier** (Early = C→U/U→R, Late = R→E/E→L) — determines complexity and power shape
3. **Attunement** (Order or Chaos) — determined by the actual evolution outcome (70/30 roll)

This produces **12 pools**: 3 PP budgets × 2 tier brackets × 2 attunements.

Each pool has two sub-pools:
- **Universal modifiers:** 8 per pool. Available to all factions.
- **Faction modifiers:** 4 per pool per faction. Only available to cards of the matching faction.

### Which Pool Does a Card Draw From?

The evolution outcome determines attunement. The card's CM cost and evolution step determine PP budget:

| Step | 1-cost | 2-cost | 3-cost | 4-cost | 5-cost | 6-cost |
|---|---|---|---|---|---|---|
| C→U (Early) | 1 PP | 1 PP | 2 PP | 2 PP | 2 PP | 3 PP |
| U→R (Early) | 1 PP | 1 PP | 1 PP | 2 PP | 2 PP | 2 PP |
| R→E (Late) | 1 PP | 1 PP | 2 PP | 2 PP | 2 PP | 3 PP |
| E→L (Late) | 1 PP | 1 PP | 1 PP | 2 PP | 2 PP | 2 PP |

**Example:** A 4-cost Ironwright creature evolving from Rare→Epic. The 70/30 roll produces a Chaos outcome.
- PP budget: 2 (from table above)
- Tier bracket: Late (R→E)
- Attunement: Chaos
- **Pool drawn from:** 2 PP, Late, Chaos-attuned (8 universal + 4 Ironwright)

### Modifier Selection at Evolution — Monetization

At every evolution, the player is always presented with **at least 1 universal option and 1 faction option**:

| Subscription Tier | Universal Options | Faction Options | Total Choices |
|---|---|---|---|
| Free (Planar Shard) | 1 | 1 | Pick 1 of 2 |
| Mid (Refined Shard, $6.99/mo) | 1 | 2 | Pick 1 of 3 |
| High (Prismatic Shard, $12.99/mo) | 2 | 2 | Pick 1 of 4 |

**Why this isn't pay-to-win:**
- All tiers draw from the same pools at the same PP budget. No exclusive-to-paid modifiers.
- Free players get a real choice every evolution (universal vs. faction), not a random assignment.
- The advantage is selection depth and build sculpting consistency, not raw power.
- Over 4 evolutions across many cards, free players will naturally assemble effective builds — just with less precision.
- Deck diversity in the meta benefits from free players bringing less optimized but more varied builds.

**Duplicate prevention:** within a single evolution's options, no modifier can appear twice. Across a card's full evolution history, no modifier definition can be granted twice to the same card.

### Total Modifier Count

| Pool Type | Pools | Modifiers per Pool | Total |
|---|---|---|---|
| Universal | 12 | 8 | 96 |
| Ironwright Collective | 12 | 4 | 48 |
| The Fey Courts | 12 | 4 | 48 |
| The Demonic Kingdoms | 12 | 4 | 48 |
| The Celestial Crusade | 12 | 4 | 48 |
| The Endless | 12 | 4 | 48 |
| **Grand Total** | | | **336** |

### Universal Modifier Design Principles

Universal modifiers are straightforward stat, keyword, and instability adjustments that work in any faction. They don't reference faction-exclusive mechanics (no Augment/Bond/Corruption/Exalt/Persist).

**By PP budget:**

**1 PP modifiers** — smallest effects, most common draw:
- +1 ATK or +1 HP (base), conditional +1 stat (attuned)
- +1 instability or -1 instability with minor stat bonus
- Simple and clean. The bread and butter of evolution.

**2 PP modifiers** — moderate effects:
- +2 ATK or +2 HP, or +1/+1 split
- Keyword grants (where affordable — Shield at 3 PP is too expensive for a 2 PP budget, but Taunt at 1 PP leaves room for +1 stat)
- Instability adjustments (-1 or +1) with a meaningful stat or keyword rider

**3 PP modifiers** — strongest universal effects (only available to 6-cost at C→U and R→E):
- Keyword grants with stat padding (Shield + remaining PP as stats)
- +3 stats in various configurations
- Larger instability swings (-2 or +2) with effects
- Possible penalties on extra-powerful options

**By tier bracket:**

**Early (C→U, U→R):** Simple stat effects, single keywords, basic instability nudges. No conditional triggers, no board-reading effects.

**Late (R→E, E→L):** Can include conditional triggers ("when [event]: effect"), references to board state ("while you have 3+ creatures"), and more complex attunement bonuses. Penalties appear here on high-power options.

### Faction Modifier Design Principles

Faction modifiers MUST reference their faction's exclusive mechanic. A modifier in the Ironwright pool that just says "+2 ATK" is wrong — it should say "+1 ATK per Augment modifier on this creature" or "Shield, regenerate if 3+ Augment." The faction mechanic keyword (Augment/Bond/Corruption/Exalt/Persist) is what makes these modifiers unavailable to other factions.

**By faction:**

**Ironwright (Augment):** Effects scale with Augment count on the creature. Early-tier Augments are weak alone but lay foundation. Late-tier Augments have powerful threshold effects (e.g., "if 3+ Augment modifiers: effect"). Order-attuned Augments lean defensive (HP, Shield). Chaos-attuned Augments lean offensive (ATK, Piercing).

**Fey Courts (Bond):** Effects reference other creatures. Early-tier Bonds are simple board-count checks ("while you control 2+ creatures"). Late-tier Bonds reference adjacent creatures, Bond-count across the board, and create compounding networks. Order-attuned Bonds lean protective (HP to allies, Shield sharing). Chaos-attuned Bonds lean aggressive (ATK sharing, Piercing propagation).

**Demonic Kingdoms (Corruption):** Effects trade self-damage for power. Early-tier Corruptions are mild bargains (1 self-damage for +2 ATK). Late-tier Corruptions are dramatic ("take 2 damage per turn, gain +4 ATK and Piercing" or "on death: deal ATK as damage to enemy avatar"). Order-attuned Corruptions include sustain (Lifesteal riders, self-healing, damage reduction). Chaos-attuned Corruptions go all-in on burst (more self-damage, more ATK, death triggers).

**Celestial Crusade (Exalt):** Effects reference Exalt thresholds (creature count conditions) and aura buffing. Early-tier Exalt modifiers use low thresholds (2+ creatures) for modest auras. Late-tier Exalt modifiers use high thresholds (3+, 4+, or full board) for powerful formation-wide effects. Order-attuned Exalt modifiers lean toward protective auras (HP buffs, Shield propagation, healing auras, Ward grants). Chaos-attuned Exalt modifiers lean toward offensive auras (ATK buffs, damage-dealing auras, Piercing sharing). Design constraint: Exalt creatures are slightly below-curve individually — the power is in the formation, not the individual.

**The Endless (Persist):** Effects reference death triggers and lingering effects. Early-tier Persist modifiers are simple death consequences (deal damage on death, heal allies on death, draw a card on death). Late-tier Persist modifiers include death sympathy (trigger when ANY friendly creature dies), lingering board-level effects that persist for N turns after death, and retaliation effects. Order-attuned Persist modifiers lean toward sustain and value (healing, buffing survivors, card draw on death). Chaos-attuned Persist modifiers lean toward burst and chain reactions (dealing damage on death, debuffing enemies, damage scaling with ATK). Design constraint: Persist value is entirely back-loaded — modifiers do nothing while the creature lives. The creature must die for value to be extracted.

Full individual modifier definitions (CF01-CF48, EF01-EF48, IF01-IF48): see `docs/design/PHASE1B-mechanics.md`.

---

## 7. Triggered Ability Templates

Triggered abilities are granted during evolution (one per evolution step, starting at Uncommon). They fire as instant effects when their trigger condition is met. Unlike modifier attunement (which is a persistent state toggle), triggered abilities are discrete events that resolve immediately when triggered.

### Trigger Types

| Trigger | When It Fires | Phase | Notes |
|---|---|---|---|
| ON_ORDER | When this creature's controller rolls an Order event | Phase 3 (Event Resolution), step 3 | Most common trigger type for Order-leaning creatures |
| ON_CHAOS | When this creature's controller rolls a Chaos event | Phase 3 (Event Resolution), step 3 | Most common trigger type for Chaos-leaning creatures |
| ON_PLAY | When this creature enters the battlefield from hand | Phase 5 (Main Phase), immediately after creature resolves | ETB (enter-the-battlefield) effects. Not triggered by tokens or resurrection. |
| ON_DEATH | When this creature is destroyed (HP ≤ 0 or Deathtouch) | Phase 8 (Combat Resolution), step 8 / or any phase where creature dies | Fires during the death-processing step. Creature is already gone — can't target self. |
| ON_DAMAGE_TAKEN | When this creature takes damage (after Shield check) | Any phase where damage is dealt to this creature | Does NOT fire if Shield absorbed the damage (0 effective damage). |
| ON_ATTACK | When this creature is declared as an attacker | Phase 6 (Declare Attackers), after confirmation | Fires once per attack declaration, not per target. |
| ON_BLOCK | When this creature is assigned as a blocker | Phase 7 (Assign Blockers), after confirmation | Fires once per block assignment. |

### Effect Types

These are the building blocks that triggered abilities use. Each ability is: one trigger + one effect + one targeting rule + one duration.

| Effect | Examples | Notes |
|---|---|---|
| STAT_BUFF | +1 ATK, +2 HP, +1/+1 | Can be permanent or "this turn" |
| STAT_DEBUFF | -1 ATK, -2 HP (to enemy) | Targets enemy creatures. HP debuff that kills = creature destroyed. |
| DEAL_DAMAGE | Deal N damage to target | Can target creatures or avatar |
| HEAL | Heal N HP | Can target creatures or avatar |
| GRANT_KEYWORD | Grant Shield / Piercing / etc. | Usually "this turn" duration. Permanent keyword grants are Legendary-tier. |
| DRAW_CARD | Draw 1 card | Powerful — limited to higher tiers |
| GAIN_MANA | Gain +1 chaos mote this turn | Temporary mana. Rare effect. |
| INSTABILITY_ADJUST | +1 or -1 instability for this creature | Permanent. Changes the creature's instability contribution. |

### Targeting Rules

| Target | Description |
|---|---|
| SELF | This creature only |
| FRIENDLY_RANDOM | Random friendly creature (including self) |
| FRIENDLY_CHOOSE | Controller chooses a friendly creature — **only used on ON_PLAY triggers** (player is actively making decisions). All other triggers use deterministic or random targeting to avoid interrupting the opponent's turn. |
| FRIENDLY_ALL | All friendly creatures |
| FRIENDLY_LOWEST_HP | Friendly creature with the lowest current HP (leftmost if tied) |
| FRIENDLY_HIGHEST_ATK | Friendly creature with the highest current ATK (leftmost if tied) |
| ENEMY_RANDOM | Random enemy creature |
| ENEMY_ALL | All enemy creatures |
| ENEMY_LOWEST_HP | Enemy creature with the lowest current HP (leftmost if tied) |
| ENEMY_AVATAR | Enemy player's avatar (face damage) |
| OWN_AVATAR | This creature's controller's avatar |

### Duration Types

| Duration | Description |
|---|---|
| THIS_TURN | Expires at end of current turn (Phase 9). |
| PERMANENT | Lasts until the creature leaves the board. |
| UNTIL_NEXT_ROLL | Lasts until this creature's controller's next chaos roll. |

### Ability Power Scaling by Tier

Each evolution step grants one ability. The tier determines the power ceiling.

| Tier | Trigger Budget | Effect Budget | Example Abilities |
|---|---|---|---|
| Uncommon | 1 trigger | Minor effect | "ON_ORDER: this creature gets +1 ATK this turn." / "ON_CHAOS: deal 1 damage to a random enemy creature." / "ON_PLAY: this creature gets +0/+1 permanently." |
| Rare | 1 trigger | Moderate effect | "ON_ORDER: grant Shield to this creature." / "ON_CHAOS: this creature gets +2 ATK this turn." / "ON_DEATH: deal 2 damage to a random enemy creature." |
| Epic | 1 trigger | Significant effect | "ON_ORDER: draw 1 card." / "ON_CHAOS: this creature gets +3 ATK and Piercing this turn." / "ON_DAMAGE_TAKEN: this creature gets +2 ATK permanently." |
| Legendary | 1 trigger | Game-impacting | "ON_ORDER: all friendly creatures get +1/+1 permanently." / "ON_CHAOS: deal 2 damage to all enemy creatures." / "ON_DEATH: deal this creature's ATK as damage to the enemy avatar." |

### Ability Resolution Order

When multiple triggered abilities fire at the same time (e.g., multiple ON_ORDER creatures when an Order event occurs):

1. Abilities resolve left-to-right by board slot (slot 1 → slot 5).
2. Each ability fully resolves before the next fires.
3. If an ability kills a creature in a later slot, that creature's ability does NOT fire (it's already dead).
4. If an ability grants a stat buff to a creature in a later slot, that creature benefits from it when its own ability fires.

### Ability Density Guidelines

Not every creature needs a triggered ability at every tier. Guidelines:

| Tier | % of cards with a NEW ability at this tier |
|---|---|
| Uncommon | 80% — most creatures gain their first ability |
| Rare | 60% — some creatures gain a second ability, some don't |
| Epic | 40% — only strong builds have 3 abilities |
| Legendary | 100% — every Legendary has at least one Legendary-tier ability |

A creature can accumulate up to 4 triggered abilities (one per evolution step). A Legendary creature with 4 abilities is a powerful engine — but it took ~115 games to build.

### Interaction with Events

Triggered abilities fire AFTER the event itself resolves (Phase 3, step 3). This means:
- If an Order event heals a creature to full HP, and that creature has "ON_ORDER: gain +0/+1 if at full HP," it DOES benefit from the heal.
- If a Chaos event kills a creature via damage, that creature's ON_CHAOS ability does NOT fire (it died during event resolution, before triggered abilities).
- ON_DEATH abilities fire whenever a creature dies, regardless of what killed it (event, combat, spell, Corruption self-damage, Chaos Siphon, etc.).

---

## 8. Order Events

8 Order events. These fire when a player's D20 roll exceeds their instability. One event is chosen randomly (equal weight) each time. Order events are stable, protective, and incremental. They always help, always go where you want, and reward board presence and sustain strategies.

**Design principles:**
- No randomness in targeting. Order events let the player choose or hit predictable targets (lowest HP, all creatures, etc.).
- Effects are modest individually but compound over multiple turns.
- Shield and healing synergy — Order events should make Shield and Lifesteal creatures feel great.
- Permanent buffs are small (+1). Temporary buffs don't exist on Order events — Order rewards patience, not burst.

| # | Name | Effect | Design Notes |
|---|---|---|---|
| O1 | Mending Light | Heal your most damaged creature for 3 HP. If tied, leftmost (lowest slot). | Reliable sustain. Keeps your key creature alive. Synergizes with high-HP creatures and Lifesteal (keeps them swinging). |
| O2 | Planar Ward | Grant Shield to a friendly creature of your choice that doesn't already have Shield. If all creatures have Shield, heal your avatar for 1 HP instead. | Huge value on the right target. Player agency — protect your best creature. Shield keyword creatures can get double value (re-shielded after first breaks). |
| O3 | Steady Growth | All your creatures get +0/+1 permanently. | Compounds fast on wide boards. 3 creatures = +3 total HP. Rewards Fey Courts/Bond (many creatures) and Order sustain strategy. |
| O4 | Clarity | Draw 1 card. | Simple card advantage. Extra card = more options. Slightly weaker than other events in raw board impact, but flexibility is powerful. |
| O5 | Fortify | A friendly creature of your choice gets +1/+1 permanently. | Player chooses — put it on your best creature to snowball, or on a weak creature to save it. Small but permanent and targeted. |
| O6 | Sanctuary | Heal your avatar for 3 HP. | Face healing. Extends the game, which favors Order's compounding strategy. Anti-aggro. |
| O7 | Bulwark | Your creature with the lowest current HP gets +0/+2 permanently. If tied, leftmost. | Predictable targeting. Shores up your weakest link. Pairs well with Deathtouch creatures (they're usually low-HP — now they survive an extra hit). |
| O8 | Harmonize | All your creatures heal 2 HP. Any creature already at full HP gets +0/+1 permanently instead. | Board-wide sustain. On a healthy board, this is +1 HP to everything (becomes Steady Growth). On a damaged board, 2 HP heal to everything. Both are great. |

**Order event power budget:** Each event is worth roughly 2–4 "points" of value (where +1 stat = 1 point, Shield = 2 points, draw = 2 points, 1 avatar heal = 0.5 points). They compound — getting 3-4 Order events in a row on a wide board creates a significant stat advantage.

---

## 9. Chaos Events

8 Chaos events. These fire when a player's D20 roll is below their instability. One event is chosen randomly (equal weight) each time. Chaos events are explosive, volatile, and high-variance. They're individually powerful but may affect random targets or have double-edged effects.

**Design principles:**
- Randomness in targeting or scope. Chaos events feel unpredictable and exciting.
- Higher raw power than Order events — a single Chaos event does more than a single Order event.
- Some Chaos events can backfire or hit your own creatures, creating memorable moments.
- ATK buffs, burst damage, and tempo swings — Chaos events should make high-ATK creatures and Piercing feel great.
- "This turn" buffs are the Chaos style — explosive but temporary. Permanent Chaos buffs come with a cost.

| # | Name | Effect | Design Notes |
|---|---|---|---|
| C1 | Surge | A random friendly creature gets +3 ATK this turn. | Pure burst. On a Piercing creature, this is potentially +3 face damage. On a 1-ATK creature, it triples output. Temporary — Chaos doesn't build, it spikes. |
| C2 | Wildfire | Deal 2 damage to a random enemy creature. | Targeted removal. Can snipe a key creature or waste itself on a beefy tank. Randomness creates tension — will it hit the right target? |
| C3 | Upheaval | Deal 1 damage to ALL creatures on the board (both sides). | Board-wide damage. Kills all 1-HP creatures. Backfire risk — your own fragile creatures die too. Chaos players with high-HP creatures benefit; glass cannon boards get punished. Breaks Shields on both sides. |
| C4 | Frenzy | ALL your creatures get +1 ATK this turn. | Board-wide aggression. On 4 creatures, that's +4 total damage. Rewards wide boards, but temporary. Order's Steady Growth (+0/+1 permanent) vs. Chaos's Frenzy (+1/+0 temporary) is the core philosophical split. |
| C5 | Rift Bolt | Deal 3 damage to the enemy avatar. | Direct face damage, bypasses all creatures. Pure aggro. On a Chaos deck pushing ~15 instability, you'll hit this roughly once every 8 turns — adds up to 6-9 face damage over a game. |
| C6 | Chaos Siphon | Deal 2 damage to a random friendly creature. That creature gets +3 ATK permanently. If the damage kills it, the buff is wasted (creature is destroyed). | High risk, high reward. On a 5-HP creature, fantastic. On a 2-HP creature, you just killed your own creature. Creates deckbuilding incentive to run higher-HP creatures even in Chaos builds. |
| C7 | Maelstrom | Deal 3 damage to a random creature on the board (either side). | The most volatile event. Can remove an enemy threat or destroy your own creature. At ~12.5% chance per Chaos roll, it's rare but memorable. Creates stories: "Maelstrom hit my own Legendary and I lost." |
| C8 | Overcharge | A random friendly creature gains +2 ATK and Piercing this turn. If it already has Piercing, it gets +4 ATK instead. | Keyword grant + burst. Temporary Piercing on a high-ATK creature can deal massive face damage through a blocker. Already-Piercing creatures get a bigger ATK spike instead — rewards building into the archetype. |

**Chaos event power budget:** Each event is worth roughly 3–6 "points" of value (where +1 ATK = 1 point, deal 1 damage = 1 point, Piercing grant = 2 points). Higher ceiling than Order but with variance and backfire risk. C3, C6, and C7 can actively hurt you — this is the price of Chaos power.

**Backfire distribution:** 3 of 8 Chaos events can hurt you (C3 Upheaval hits your creatures, C6 Chaos Siphon damages a friendly, C7 Maelstrom can target your side). This means ~37.5% of Chaos events carry some risk. The remaining 62.5% are pure upside.

---

## 10. Spell Framework

Spells are non-creature, non-stabilizer cards. They are played from hand during the Main Phase (Phase 5), cost chaos motes, resolve immediately, and are then discarded. There are no response windows — the opponent cannot react to a spell.

### Spell Categories

| Category | Effect | Targeting | Notes |
|---|---|---|---|
| **Buff** | Increase a creature's ATK and/or HP | Friendly creature (player chooses) | "This turn" or "permanent" depending on rarity. Cast before declaring attackers to set up favorable combat. |
| **Damage** | Deal direct damage to a creature | Any creature (player chooses) | Removal. Can target your own creatures (relevant for Corruption synergies). |
| **Face Damage** | Deal direct damage to the enemy avatar | Enemy avatar (no choice) | Rare — burn spells. Usually low damage (1-3) at high mana cost to prevent spell-only win conditions. |
| **Heal** | Heal a creature or your avatar | Friendly creature or own avatar (player chooses) | Sustain. Less efficient than Order events per mana spent, but on-demand. |
| **Utility** | Draw cards, gain mana, manipulate instability | Varies | Card draw spells are premium — max 2 per deck recommended at launch. |

### Spell Design Constraints

- **No counterspells.** No spell can cancel or prevent another spell. This eliminates stack complexity.
- **No instant-speed.** All spells are sorcery-speed (main phase only). No spells during combat, during the opponent's turn, or in response to anything.
- **No recurring spells.** Spells are one-shot — play, resolve, discard. No enchantments or ongoing spell effects (that's what stabilizers and modifiers are for).
- **Spells don't evolve.** Spells are static cards that don't accumulate chaos energy or progress through evolution tiers. They are always at their base power level.
- **Spells are faction-locked.** Like creatures, spells belong to a faction and can only go in decks of that faction.

### Spell Count per Faction

| Card Type | Count per Faction (Launch) |
|---|---|
| Creatures | ~70–100 |
| Spells | ~15–20 |
| Stabilizers | ~5–10 |
| Planar Ruins | 8 neutral (shared) + faction-evolved variants |

Decks are 20 cards. A typical deck runs 14-16 creatures, 2-4 spells, 0-2 stabilizers, and 0-2 Planar Ruins. Creature-heavy builds are the norm — spells, stabilizers, and ruins are support.

### Spell Rarity

Spells exist at all rarities but do NOT evolve. A Rare spell is always Rare. Spells are acquired through Chaos Dust card packs alongside creatures. Higher-rarity spells have stronger effects and higher mana costs.

### Chaos Spark (Special Spell)

The Chaos Spark given to the second player is a special spell:
- **Cost:** 0 chaos motes.
- **Effect:** Gain +1 chaos mote this turn (temporary — expires if unspent at end of turn).
- **Single use:** Discarded after use. Not part of the deck — it's a bonus card in the opening hand.
- **Counts as a spell cast:** Triggers any "when you play a spell" abilities. This is an intentional secondary benefit for P2.
- **Cannot be mulliganed:** If P2 mulligans, they redraw 5 cards and keep the Chaos Spark.

---

## 11. Stabilizer & Manipulation Cards

Stabilizers are cards that sit on the board and manipulate the instability/chaos roll system. They occupy creature slots — this is their primary cost. A player running 2 stabilizers has only 3 slots for creatures.

### Stabilizer Properties

- **Occupy board slots.** A stabilizer takes one of the 5 creature slots.
- **Have HP but no ATK.** Stabilizers can be damaged by spells, Chaos events (Upheaval, Maelstrom, Wildfire), and creature abilities. They can be destroyed.
- **Cannot attack or block.** Stabilizers are not creatures — they don't participate in combat. They cannot be declared as attackers. They cannot be assigned as blockers. Taunt's forced-attack rule does not count stabilizers as "creatures that can attack."
- **Aura effects are continuous.** A stabilizer's effect is active as long as it's on the board. When destroyed, the effect ends immediately.
- **Don't contribute base instability.** Stabilizers have 0 base instability. They modify instability through their aura effect, not through the creature instability formula.
- **Don't evolve.** Like spells, stabilizers are static cards.
- **Faction-agnostic (Universal).** All launch stabilizers are available to all factions. Faction-specific stabilizers are reserved for future expansions.

### Launch Stabilizer Cards

**Order-Leaning (Reduce Instability):**

| Name | CM Cost | HP | Effect | Faction |
|---|---|---|---|---|
| Chaos Anchor | 2 | 3 | While on field: each of your creatures contributes -1 to your instability (minimum 0 per creature). | Universal (all factions) |
| Warding Pillar | 3 | 5 | While on field: your avatar's instability modifier is doubled (e.g., -4 becomes -8). | Universal |

**Chaos-Leaning (Increase Instability):**

| Name | CM Cost | HP | Effect | Faction |
|---|---|---|---|---|
| Chaos Rift | 2 | 3 | While on field: each of your creatures contributes +1 to your instability. | Universal (all factions) |
| Entropy Engine | 3 | 4 | While on field: when you roll a Chaos event, your highest-ATK creature gets +1 ATK permanently. | Universal |

**Manipulation (Neither — Direct Control):**

| Name | CM Cost | HP | Effect | Faction |
|---|---|---|---|---|
| Void Lens | 3 | 2 | While on field: after seeing your chaos roll result, you may choose whether the event is treated as Order or Chaos (once per turn). "Nothing" results cannot be overridden. | Universal |

**Spell-Type Manipulation Cards** (these are spells, not stabilizers — one-shot use):

| Name | CM Cost | Effect | Faction |
|---|---|---|---|
| Binding Ward | 2 | Set your instability to 5 for this turn only. (Reverts at end of turn.) | Universal |
| Entropy Spike | 2 | Set your instability to 15 for this turn only. (Reverts at end of turn.) | Universal |

### Stabilizer Design Intent

Stabilizers create strategic depth around the instability system:
- **Chaos Anchor** is for Chaos players who want to dial back risk when they're ahead. Running one drops instability by 3-5 points (depending on board size) but costs a creature slot.
- **Chaos Rift** is for Order players who want an occasional Chaos event for burst damage, or for Chaos players who want to push instability even higher.
- **Void Lens** is the most powerful stabilizer — choosing your event type is extremely strong. But at 2 HP, it dies to Wildfire or Upheaval, and it costs a creature slot.
- **Warding Pillar** is for dedicated Order builds that want near-guaranteed Order events every turn.
- **Entropy Engine** rewards sustained Chaos play with permanent snowball.

Stabilizer count at launch: 5 board stabilizers (universal) + 2 manipulation spells (universal) = 7 cards. Future expansions can add faction-specific stabilizers.

---

## 12. Starter Card Stat Ranges

Stat ranges for Common base cards by chaos mote cost. These are the pre-evolution starting points.

### Common Creature Stat Ranges

| CM Cost | ATK Range | HP Range | Keywords at Common? | Notes |
|---|---|---|---|---|
| 1 | 1–2 | 1–2 | Very rare (1 keyword max) | Total stats = 3. Most are vanilla 1/2 or 2/1. |
| 2 | 1–3 | 2–4 | Rare (1 keyword max) | Total stats = 5. Range from 1/4 wall to 3/2 aggro. |
| 3 | 2–4 | 2–5 | Occasional (1 keyword) | Total stats = 7. Workhorses. 2/5 to 4/3 spread. |
| 4 | 2–5 | 3–6 | Common (0–1 keyword) | Total stats = 9. 3/6 walls to 5/4 threats. |
| 5 | 3–6 | 3–7 | Common (0–1 keyword) | Total stats = 11. Premium creatures. |
| 6 | 4–7 | 4–8 | Usually 1 keyword | Total stats = 13. Top end. 4/6+Shield to 7/6. |

**Stat distribution guidance:**
- Low instability cards: ATK ≤ HP (usually by 2+ points)
- Balanced instability: ATK ≈ HP (within 1 point)
- High instability: ATK ≥ HP (usually by 2+ points)

### Common Spell Stat Ranges

| CM Cost | Effect Power | Examples |
|---|---|---|
| 1 | Minor | Deal 2 damage to a creature. Give +1/+1 this turn. |
| 2 | Moderate | Deal 3 damage. Draw a card. Give +2/+2 this turn. |
| 3 | Strong | Deal 4 damage. Destroy a creature with 3 or less HP. Heal 4. |
| 4 | Premium | Deal 5 damage. Destroy any creature. Draw 2 cards. |
| 5 | Powerful | Deal 3 damage to all enemy creatures. Give all friendly creatures +2/+2 this turn. |
| 6 | Game-swinging | Deal 4 damage to all enemy creatures. Draw 3 cards and gain 2 chaos motes. |

### Stabilizer/Manipulation Card Ranges

These occupy creature board slots but manipulate instability rather than fighting.

| Card | CM Cost | Effect | Instability Contribution |
|---|---|---|---|
| Chaos Anchor | 2 | While on field: your creatures contribute -1 instability each (minimum 0 per creature) | 0 |
| Warding Pillar | 3 | While on field: your avatar's instability modifier is doubled (e.g., -4 becomes -8) | 0 |
| Binding Ward | 2 | Spell: set your instability to 5 for one turn | N/A (spell) |
| Chaos Rift | 2 | While on field: your creatures contribute +1 instability each | 0 |
| Entropy Engine | 3 | While on field: when you roll a Chaos event, your highest-ATK creature gets +1 ATK permanently | 0 |
| Entropy Spike | 2 | Spell: set your instability to 15 for one turn | N/A (spell) |
| Void Lens | 3 | While on field: after seeing your chaos roll result, you may choose whether the event is treated as Order or Chaos (once per turn). "Nothing" results cannot be overridden. | 0 |

---

## 13. Planar Ruins — Battlefield Mechanics

Planar Ruins are ancient structures found in the Plane of Chaos, built by a vanished civilization known as the Ancient Builders. They stabilize chaotic energy, creating pockets of survivable space. Ruins are a distinct card type with unique battlefield rules.

### Ruin Properties

- **Takes a creature slot** on the battlefield (5-slot board). Reduces creature board presence in exchange for a passive benefit.
- **High HP, zero ATK.** Ruins are structures, not combatants. HP scales with CM cost: `Ruin HP = (CM cost x 3) + 1`.
- **Provides a passive benefit** to the controlling player while on the field.
- **Can be attacked and destroyed** by opponent's creatures during combat (opponent assigns attackers to target the ruin during Declare Attackers).
- **Cannot attack or block.** Ruins cannot be declared as attackers or assigned as blockers. They are structures.
- **Destruction penalty:** When a ruin is destroyed (reaches 0 HP), a negative effect fires on the controlling player's side for 1 turn.
- **Max 1 on field at a time.** If a player already has a ruin on the field, additional ruin cards in hand are unplayable.
- **Max 2 in deck** (to preserve creature-heavy deckbuilding as the norm).
- **Contributes instability.** Ruins have a base_instability value (0-2) that contributes to the player's instability calculation.

### How Ruins Differ from Stabilizers

| Property | Stabilizers | Planar Ruins |
|---|---|---|
| Card type | `STABILIZER` | `PLANAR_RUIN` |
| Primary function | Manipulate instability/chaos roll system | Provide general passive battlefield benefits |
| Instability contribution | 0 (modify instability via aura effects) | Low (0-2 base instability) |
| Evolution | None — static cards | Neutral to Faction-Specific (1 evolution step) |
| Faction | Universal (all factions) | Neutral OR faction-locked after evolution |
| Destruction penalty | Effect simply ends | Negative penalty effect fires on own side for 1 turn |
| Field limit | No special limit (just board slots) | Max 1 ruin on field at a time |
| Deck limit | No special limit (just deck size) | Max 2 ruins per deck |
| Combat targeting | Can be damaged by spells/events, not by creature attacks | Can be targeted by creature attacks (opponent assigns attackers) |
| ATK | 0 | 0 |
| Blocking | Cannot block | Cannot block |

### Ruin Interaction with Game Mechanics

| Mechanic | Does the Ruin Count? | Rationale |
|---|---|---|
| Board slot occupancy | **Yes** — ruins take 1 of 5 slots | Physical board presence |
| Exalt threshold ("3+ creatures") | **No** — ruins are not creatures | Exalt counts creatures only |
| Bond modifier synergy | **No** — ruins are not creatures | Bond references creatures explicitly |
| "All friendly creatures" effects | **No** — ruins are not creatures | Effects targeting "creatures" skip ruins |
| "All enemy creatures" damage | **No** — ruins are not creatures | Chaos events targeting "creatures" skip ruins |
| Direct damage spells | **No** — spells targeting "any creature" cannot target ruins | Keeps existing spell targeting clean |
| Instability calculation | **Yes** — ruins contribute base_instability | Ruins affect the chaos environment |

### Ruin HP Scaling

| CM Cost | HP |
|---|---|
| 2 | 7 |
| 3 | 10 |
| 4 | 13 |
| 5 | 16 |
| 6 | 19 |

### The 8 Neutral Ruins (Launch Set)

| # | Name | CM | HP | Instability | Neutral Effect | Destruction Penalty |
|---|---|---|---|---|---|---|
| 1 | The Resonance Spire | 2 | 7 | 0 | Heal 1 HP to most damaged creature at start of turn | All your creatures take 1 damage |
| 2 | The Anchor Plinth | 3 | 10 | 0 | All your creatures gain +1 HP (max and current) | All creatures lose 1 max HP and 1 current HP |
| 3 | The Mote Well | 3 | 10 | 1 | Gain +1 chaos mote at start of turn (subject to 10 cap) | Lose 2 chaos motes |
| 4 | The Sight Glass | 4 | 13 | 1 | On draw, see top card; once per turn may bottom it instead | Skip next card draw |
| 5 | The War Cairn | 4 | 13 | 2 | All your creatures gain +1 ATK | All creatures -1 ATK for 1 turn (min 1 ATK) |
| 6 | The Threshold Gate | 5 | 16 | 1 | On Chaos/Order event, all creatures gain +1 evolution energy post-battle | Instability set to 10 for 1 turn |
| 7 | The Communion Altar | 5 | 16 | 1 | At end of turn, if 3+ creatures (not counting ruin), heal all creatures 1 HP | All temporary buffs stripped |
| 8 | The Oblivion Obelisk | 6 | 19 | 2 | At start of opponent's turn, deal 1 damage to random enemy creature | Deal 3 damage to your avatar |

### Ruin Combat Targeting Rules

1. During Declare Attackers (Phase 6), the attacking player selects which creatures attack and designates each as targeting **face** (default) or **ruin** (if opponent has one).
2. During Assign Blockers (Phase 7), the defending player may assign blockers to any attacker regardless of target.
3. Unblocked attackers targeting the ruin deal ATK damage to the ruin's HP.
4. If a Taunt creature blocks an attacker targeting the ruin, the attacker deals damage to the Taunt creature (not the ruin).
5. If the ruin reaches 0 HP, it is destroyed and its destruction penalty fires immediately.

### Destruction Penalty Timing

- Destroyed during combat (Phase 8): penalty fires after combat resolution completes, before Phase 9 (End of Turn).
- Destroyed by start-of-turn effect: penalty fires immediately during Phase 1, before Phase 2 (Chaos Roll).
- Penalty lasts "for 1 turn" — persists until the end of the controlling player's NEXT turn.
- The player CANNOT voluntarily destroy their own ruin. Ruins only leave the field by being destroyed by the opponent.

### Ruin Start-of-Turn and End-of-Turn Effects

- Start-of-turn ruin effects resolve during Phase 1 alongside other board effects (Corruption self-damage, stabilizer auras, modifier triggers). Ruins resolve in board-slot order, left-to-right, intermixed with creature effects by slot position.
- End-of-turn ruin effects resolve during Phase 9, before "this turn" buffs expire.

Full ruin design, faction evolution paths, and effect pools: see `docs/design/PHASE1C-planar-ruins.md`.

---

## 14. Ruin Evolution Mechanics

### Neutral to Faction-Specific Evolution

Ruins start as neutral — ancient, unclaimed structures usable in any faction's deck. After accumulating enough familiarity through battles, a neutral ruin can be evolved **once** into a **faction-specific** ruin.

### Familiarity Thresholds

Ruin familiarity uses the same system as creature evolution energy:
- Ruins earn familiarity when included in a deck that completes a battle (win or loss).
- **Familiarity threshold for evolution: 10 battles** with the ruin in the deck.
- Once the threshold is met, the ruin is eligible for evolution during the post-battle evolution phase.

### Evolution Selection (Subscription Tier)

The evolution uses the same subscription tier system for choice breadth:

| Subscription Tier | Options Presented |
|---|---|
| Free (Planar Shard) | Pick 1 of 2 |
| Mid (Refined Shard) | Pick 1 of 3 |
| Top (Prismatic Shard) | Pick 1 of 4 |

Each ruin has 4 evolved effect options per faction (40 total evolved variants across 8 ruins x 5 factions). Free players see Options 1 and 2 (guaranteed faction synergy in both). Mid-tier players additionally see Option 3. Top-tier players see all 4.

### Post-Evolution Rules

- Once evolved, the ruin is **faction-locked** — it can only be played in decks of that faction.
- Evolved ruins have **stronger, faction-complementary effects** and **faction-themed destruction penalties**.
- Evolution is permanent and one-time. A ruin cannot be re-evolved or reverted.
- Evolved ruins retain the same CM cost and HP as their neutral version.

### Ruin Evolution Does NOT Use Shards

Unlike creature evolution (which costs Planar Shards), ruin evolution is free once the familiarity threshold is reached. The player simply picks from the available options. This is a deliberate accessibility decision — ruins are a smaller part of the collection and shouldn't have a separate shard economy.

---

## 15. Starter Deck Specifications

### Existing Factions

Starter decks for Ironwright Collective, Fey Courts, and Demonic Kingdoms are defined in the base card pool. See individual faction card lists.

### Celestial Crusade Starter Deck

20-card starter deck showcasing the Exalt mechanic. All cards are Common tier. Teaches go-wide formation play — cards are slightly below-curve individually but synergize when multiple creatures are on the board.

| # | Name | Type | CM | ATK | HP | Instability | Keywords | Description |
|---|---|---|---|---|---|---|---|---|
| 1 | Crusader Initiate | Creature | 1 | 1 | 2 | 1 | -- | Young knight of the Celestial order. |
| 2 | Crusader Initiate | Creature | 1 | 1 | 2 | 1 | -- | (2nd copy) |
| 3 | Herald of Dawn | Creature | 1 | 2 | 1 | 2 | -- | Swift messenger heralding the crusade. |
| 4 | Sanctified Scout | Creature | 2 | 1 | 4 | 1 | -- | Blessed scout with divine protection. |
| 5 | Sanctified Scout | Creature | 2 | 1 | 4 | 1 | -- | (2nd copy) |
| 6 | Angelic Recruit | Creature | 2 | 2 | 3 | 2 | -- | Newly awakened celestial. |
| 7 | Angelic Recruit | Creature | 2 | 2 | 3 | 2 | -- | (2nd copy) |
| 8 | Burning Zealot | Creature | 2 | 3 | 2 | 3 | -- | Fanatical crusader wreathed in holy fire. |
| 9 | Temple Guardian | Creature | 3 | 2 | 5 | 1 | Taunt | Protects the formation. |
| 10 | Temple Guardian | Creature | 3 | 2 | 5 | 1 | Taunt | (2nd copy) |
| 11 | Radiant Knight | Creature | 3 | 3 | 4 | 2 | -- | Balanced crusader, army backbone. |
| 12 | Radiant Knight | Creature | 3 | 3 | 4 | 2 | -- | (2nd copy) |
| 13 | Seraph Striker | Creature | 3 | 4 | 3 | 3 | -- | Aggressive angel. |
| 14 | Celestial Warden | Creature | 4 | 3 | 6 | 1 | Shield | Heavily armored divine warden. |
| 15 | Holy Avenger | Creature | 4 | 5 | 4 | 3 | -- | Wrathful angel delivering punishment. |
| 16 | Choir of Blades | Creature | 5 | 4 | 7 | 2 | -- | Angelic warriors fighting as one. |
| 17 | Archangel Vanguard | Creature | 5 | 3 | 7 | 1 | Flying | Winged commander leading from above. |
| 18 | Divine Smite | Spell | 2 | -- | -- | 0 | -- | Deal 3 damage to target creature. |
| 19 | Blessed Rally | Spell | 3 | -- | -- | 0 | -- | All friendly creatures get +1/+1 this turn. |
| 20 | Warding Pillar | Stabilizer | 3 | 0 | 5 | 0 | -- | Avatar instability modifier doubled. |

**Deck Statistics:** 17 creatures (85%), 2 spells (10%), 1 stabilizer (5%). Mana curve: 1-cost: 3, 2-cost: 5, 3-cost: 5, 4-cost: 2, 5-cost: 2. Average CM: 2.65. Average instability (creatures): 1.71. Keywords: Taunt (2), Shield (1), Flying (1).

**Play Pattern:** Turns 1-2: deploy cheap creatures for board presence. Turns 3-4: Temple Guardians protect the formation, Radiant Knights as flexible threats. Turns 5+: premium creatures complete the formation; 3-5 creatures positioned for Exalt auras once evolution begins. Avatar recommendation: Order-leaning (-5 or -6).

### The Endless Starter Deck

20-card starter deck showcasing the Persist mechanic. All cards are Common tier. Teaches aggressive trading — creatures are expendable, the deck wants to trade and trigger death effects once evolved.

| # | Name | Type | CM | ATK | HP | Instability | Keywords | Description |
|---|---|---|---|---|---|---|---|---|
| 1 | Shambling Corpse | Creature | 1 | 2 | 1 | 3 | -- | Mindless undead. Cheap, aggressive, expendable. |
| 2 | Shambling Corpse | Creature | 1 | 2 | 1 | 3 | -- | (2nd copy) |
| 3 | Grave Watcher | Creature | 1 | 1 | 2 | 1 | -- | Spectral sentinel. Defensive. |
| 4 | Bone Collector | Creature | 2 | 3 | 2 | 3 | -- | Skeleton that gathers remains. Fragile. |
| 5 | Bone Collector | Creature | 2 | 3 | 2 | 3 | -- | (2nd copy) |
| 6 | Restless Shade | Creature | 2 | 2 | 3 | 2 | -- | Ghost that refuses to pass on. |
| 7 | Restless Shade | Creature | 2 | 2 | 3 | 2 | -- | (2nd copy) |
| 8 | Crypt Sentinel | Creature | 2 | 1 | 4 | 1 | -- | Undying guard of ancient tombs. |
| 9 | Carrion Stalker | Creature | 3 | 4 | 3 | 3 | -- | Predatory undead drawn to death. |
| 10 | Carrion Stalker | Creature | 3 | 4 | 3 | 3 | -- | (2nd copy) |
| 11 | Necromancer's Thrall | Creature | 3 | 3 | 4 | 2 | -- | Bound servant of a lich. |
| 12 | Necromancer's Thrall | Creature | 3 | 3 | 4 | 2 | -- | (2nd copy) |
| 13 | Spectre Knight | Creature | 3 | 2 | 4 | 2 | Lifesteal | Ethereal knight draining life. |
| 14 | Abomination | Creature | 4 | 5 | 4 | 3 | -- | Stitched-together horror. High ATK. |
| 15 | Bone Leviathan | Creature | 4 | 2 | 6 | 1 | Taunt | Massive bone construct. Forces engagement. |
| 16 | Lich Apprentice | Creature | 5 | 4 | 6 | 2 | Deathtouch | Apprentice lich with lethal touch. |
| 17 | Dread Revenant | Creature | 5 | 6 | 5 | 4 | -- | Terrifying revenant. Glass cannon. |
| 18 | Necrotic Bolt | Spell | 2 | -- | -- | 0 | -- | Deal 3 damage to target creature. |
| 19 | Soul Drain | Spell | 3 | -- | -- | 0 | -- | Deal 2 damage to target creature. Heal avatar 2 HP. |
| 20 | Chaos Rift | Stabilizer | 2 | 0 | 3 | 0 | -- | Each creature contributes +1 instability. |

**Deck Statistics:** 17 creatures (85%), 2 spells (10%), 1 stabilizer (5%). Mana curve: 1-cost: 3, 2-cost: 5, 3-cost: 5, 4-cost: 2, 5-cost: 2. Average CM: 2.65. Average instability (creatures): 2.24. Keywords: Lifesteal (1), Taunt (1), Deathtouch (1).

**Play Pattern:** Turns 1-2: deploy cheap aggressive creatures (Shambling Corpses, Bone Collectors) for early pressure. Turns 3-4: Carrion Stalkers and Necromancer's Thralls trade aggressively; once evolved, deaths trigger Persist effects. Turns 5+: premium threats (Abomination, Lich Apprentice, Dread Revenant) trade up or push massive damage. Avatar recommendation: Chaos-leaning (-1 or -2).

### Starter Deck Comparison (All 5 Factions)

| Metric | Celestial | Endless |
|---|---|---|
| Average instability | 1.71 (Order-leaning) | 2.24 (Chaos-leaning) |
| Avg ATK (creatures) | 2.53 | 2.88 |
| Avg HP (creatures) | 3.71 | 3.35 |
| Playstyle | Defensive formation | Aggressive attrition |
| Win condition | Stabilize, compound, overwhelm | Trade, trigger, grind down |
| Weakness | Board wipes, fast aggro | Face rush, Shield walls |
| Keyword focus | Shield, Taunt, Flying | Lifesteal, Deathtouch, Taunt |

---

## 16. Game AI Strategy Notes

### AI Strategy by Faction

**Ironwright (Augment):**
- Prioritize evolving 1-2 key creatures repeatedly. Stack Augment modifiers on the strongest threat.
- Protect the Augment investment: use Taunt creatures and Shield to keep the main threat alive.
- Trade only when favorable. Each creature loss is costly because the Augment stacks are gone.
- Late game: a 4-Augment Legendary is the win condition. Protect it at all costs.

**Fey Courts (Bond):**
- Build a wide board. Play creatures in pairs and groups to maximize Bond synergy.
- Avoid trades that reduce creature count below Bond thresholds.
- Use Taunt and Shield to protect the network. Sacrifice spells for removal rather than creatures.
- Late game: maintain 4-5 creatures with Bond modifiers for overwhelming cumulative value.

**Demonic Kingdoms (Corruption):**
- Aggro. Play fast, deal damage, close the game before Corruption self-damage kills your own board.
- Target the opponent's face whenever possible. Every turn your creatures survive is borrowed time.
- Use Lifesteal creatures to offset self-damage. Deathtouch creatures trade up efficiently.
- Late game: you are losing. Corruption decks want to end games by turn 6-8.

**Celestial Crusade (Exalt):**
- Go wide. Deploy creatures quickly to meet Exalt thresholds (3+ creatures on board).
- Protect the formation: use Taunt creatures to intercept attacks, Shield auras to absorb hits, Ward to prevent targeted removal of key Exalt sources.
- Prioritize keeping creature count above the threshold. Losing even one creature can cascade (aura drops, other creatures become vulnerable, more deaths follow).
- Target high-value Exalt sources on the opposing Celestial player. Killing one key creature can collapse the entire formation.
- Late game: a stable 4-5 creature board with stacking Exalt auras is nearly impenetrable. Compound Order events for long-term dominance.

**The Endless (Persist):**
- Force trades. Attack aggressively to make the opponent block and kill your creatures, triggering Persist effects.
- Use Deathtouch creatures to trade up — kill expensive creatures while triggering death effects.
- Deploy Haste creatures for immediate impact: attack on play, deal damage, then serve as Persist fodder.
- Do NOT go face if your creatures have strong Persist modifiers. You WANT your creatures to die in combat, not survive while the opponent takes face damage.
- Late game: grind. Every death generates value. The Endless player is favored in long, attrition-heavy games where creatures die constantly.

### AI Strategy for Planar Ruins

- **When to play a ruin:** When the board has 2-3 creatures and the passive effect outweighs the lost creature slot. Never play a ruin on an empty board (no creatures to benefit from the effect). The Mote Well (mana acceleration) and War Cairn (ATK buff) are highest priority for early play.
- **When to attack enemy ruins:** Attack the opponent's ruin when its passive effect is generating more value than the face damage you could deal. High-priority targets: Mote Well (denies mana), War Cairn (denies ATK), Communion Altar (denies healing). Low-priority: Resonance Spire (modest single-target healing).
- **When to protect your ruin:** Use Taunt creatures to force the opponent to attack into your board instead of your ruin. Taunts don't force ruin targeting, but they force the opponent to declare attackers — those attackers can be intercepted by your blockers.
- **Ruin destruction penalty management:** Consider the destruction penalty before playing a ruin. If the penalty would be catastrophic at a given board state (e.g., "all creatures take 2 damage" when your creatures are at low HP), delay playing the ruin.

---

## 17. Card Acquisition & Progression

### Onboarding Flow

1. Player creates account, picks a username.
2. **Trial phase:** player receives a premade 20-card Commons deck for each of the 5 factions. These are loaner decks — fixed lists, cannot be evolved or modified.
3. Player plays 1–3 matches with each trial deck (vs. AI or other new players).
4. **Faction commitment:** player picks one faction as their starter. That trial deck becomes their real collection — those 20 Commons are now owned CardInstances, fully evolvable. The other two trial decks are returned.
5. Player now has: 20 Commons in one faction, a starter avatar for that faction, enough evolution shards to evolve 2–3 cards immediately, and a small amount of Chaos Dust.

### In-Game Currency: Chaos Dust

Single currency earned through gameplay, spent on cards and shards. No premium currency — real money goes to subscriptions only.

**Earning Chaos Dust:**

| Source | Chaos Dust | Frequency |
|---|---|---|
| Win a match | 15 | Per game |
| Lose a match | 5 | Per game |
| Daily quest | 25–50 | 3 per day |
| Weekly quest | 100–200 | 2 per week |
| Season milestone | 50–500 | Tiered thresholds |

**Example daily quests:** "Play 3 games," "Evolve a card," "Win with 3+ Legendaries on board"
**Example weekly quests:** "Win 10 games," "Evolve 5 cards to Rare or higher"

### Spending Chaos Dust

| Purchase | Cost | What You Get |
|---|---|---|
| Card Pack (own faction) | 100 Dust | 3 random Commons from your faction's pool |
| Card Pack (other faction) | 150 Dust | 3 random Commons from another faction — unlocks that faction permanently |
| Specific Common | 50 Dust | Pick any Common from your unlocked faction(s) |
| Planar Shard (Uncommon) | 30 Dust | 1 free-tier evolution shard |
| Planar Shard (Rare) | 60 Dust | |
| Planar Shard (Epic) | 120 Dust | |
| Planar Shard (Legendary) | 240 Dust | |
| Avatar unlock | 300 Dust | Unlock a new avatar within your faction(s) |

**Duplicate protection:** if a pack would give a 3rd+ copy of a Common the player already owns, it rerolls to a different Common from the faction.

### Subscription Card Benefits

| Tier | Card Benefit |
|---|---|
| Free | Earn dust through gameplay only |
| Mid ($6.99/mo) | +3 faction Commons per month (primary faction), +50% dust from quests |
| High ($12.99/mo) | +5 faction Commons per month (any unlocked faction), +100% dust from quests, 1 free Legendary shard per month |

### Cross-Faction Unlocking

- Buying a card pack from another faction unlocks that faction permanently.
- Once unlocked: can build decks from that faction, earn its cards, access its faction modifiers during evolution.
- Decks are still single-faction — all cards must share a faction/style.
- Natural long-term progression: master one faction → unlock second → unlock remaining factions over time.

### Progression Rate Estimates

**Active free player (3–4 games/day, completing dailies):**
- ~45–60 dust/day from games
- ~75–150 dust/day from dailies
- **~150–250 dust/day total**
- Card pack every 1–2 days
- Evolve a card to Uncommon about once per day
- Full Common→Legendary (4 shards): ~450 dust = ~2–3 days

**Mid subscriber (same play rate):**
- ~225–375 dust/day (1.5× quest bonus)
- 3 free Commons per month
- Evolves faster, builds collection wider

**Top subscriber (same play rate):**
- ~300–500 dust/day (2× quest bonus)
- 5 free Commons per month + 1 free Legendary shard
- Fastest collection growth, most evolution flexibility

---

## 18. Balance Validation Rules

Automated checks that should run against every card design to flag balance issues.

### Card-Level Checks

```
1. Total stat PP (ATK + HP + keyword costs) must equal base PP for chaos mote cost
   - Tolerance: ±1 PP (allows slight over/under-statting for flavor)
   
2. Creatures with base instability 0-1 must have HP ≥ ATK
   (Order-friendly cards should be defensive)

3. Creatures with base instability 4-5 must have ATK ≥ HP
   (Chaos-friendly cards should be offensive)

4. No creature may have 0 ATK or 0 HP at Common
   (Every creature should be able to participate in combat)

5. Keywords on Common creatures:
   - 1-2 cost: max 1 keyword
   - 3-4 cost: max 1 keyword
   - 5-6 cost: max 1 keyword
   
6. Deathtouch creatures should have ATK ≤ 2 at Common
   (Deathtouch's value is in efficient kills — high ATK + Deathtouch is overpowered)
```

### Deck-Level Checks

```
1. Exactly 20 cards
2. Max 2 copies of any single CardTemplate
3. Max 2 Legendary cards, max 1 copy of each
4. All cards from a single faction/style (neutral ruins are allowed in any faction deck)
5. At least 1 creature in the deck
6. Max 2 Planar Ruin cards per deck
7. Max 1 Planar Ruin on the field at a time
```

### Evolution-Level Checks

```
1. Creature instability after all evolutions: minimum 0 (clamped)
2. Total stat PP after evolution should fall within tier range (Section 1 table)
3. No creature should exceed 12 ATK or 15 HP at Legendary
   (Soft caps to prevent absurd stat lines)
4. No creature should have more than 3 keywords at Legendary
   (Keyword stacking gets degenerate beyond this)
```

### Modifier-Level Checks

```
1. Modifier PP cost must match its pool's PP budget
2. Faction modifiers must reference their exclusive mechanic keyword
3. Universal modifiers must NOT reference any faction mechanic keyword
4. No modifier can be granted twice to the same CardInstance
5. Instability adjustments on modifiers: max +2 or -2 per modifier
```

---

## 19. Design Space Reserved for Future

Mechanics and content categories that are intentionally NOT in the launch version but that the data model and balance system can support later.

- **Additional keywords:** Regenerate (heal N at end of turn), Volatile (takes 1 damage at start of your turn), Stealth (can't be targeted for 1 turn after playing). (Note: Haste and Ward have been promoted from future to active — see Section 4.)
- **Additional factions:** Data model supports unlimited factions beyond the current 5.
- **Multi-target spells:** "Deal 2 damage to all creatures" or "Heal all friendly creatures for 2"
- **Chaos mote cost reduction effects:** Modifiers or events that temporarily reduce a card's cost
- **Board-wide auras:** "All friendly creatures have +1 ATK" — currently modifiers only affect the creature they're on (except Bond)
- **Instability manipulation spells:** More sophisticated than current stabilizers — "swap your instability with opponent's for one turn"
- **Cross-faction cards:** Cards that can go in any faction's deck (neutral/colorless equivalent)
- **Boss/Raid mode:** PvE content with unique enemy cards that break normal balance rules
- **Seasonal faction mechanics:** Temporary faction-specific modifiers that rotate with seasons

---

*Last updated: 2026-02-19*
*Status: Faction expansion complete. 5 factions (Ironwright, Fey Courts, Demonic Kingdoms, Celestial Crusade, The Endless) with 9 keywords (added Haste, Ward). 336 total modifiers (96 universal + 48 per faction x 5). Planar Ruins battlefield system with 8 neutral ruins and faction evolution paths. Ironwright rethemed from steampunk to brutalist space-industrial. Full 9x9 keyword interaction matrix. Celestial and Endless starter decks specified. All mechanical systems defined.*

---

## Revision Log

| Date | Change | Section(s) |
|---|---|---|
| 2026-02-16 | Platform-alignment pass: no platform-specific references existed in this document (it is purely game mechanics). No changes required. Revision Log added for consistency with other core docs. | N/A |
| 2026-02-16 | Targeted factual error correction (CRIT-03, CRIT-04): Section 12 summary table had Void Lens listed as a Spell — corrected to match its Section 11 stabilizer definition (board stabilizer, HP 2, instability contribution 0). Removed Probability Anchor from Section 12 — it only existed in this summary table, was absent from Section 11 and doc 00, and would have caused content pipeline confusion. | 12 |
| 2026-02-16 | v3.2 targeted error corrections: (1) Section 11 property "Faction-locked" → "Faction-agnostic (Universal)" to match all 7 stabilizer cards being Universal in the table immediately below. (2) Section 12 summary table: added missing Warding Pillar and Entropy Engine rows (were in Section 11 but absent from Section 12). (3) Section 6 modifier table and Section 13 subscription benefits: "Top" → "High", stale "$5–8/mo" and "$10–15/mo" → canonical "$6.99/mo" and "$12.99/mo" per doc 09. | 6, 11, 12, 13 |
| 2026-02-19 | v4.0 Faction expansion: Exalt (Celestial Crusade) and Persist (The Endless) faction mechanics added (Section 5). Haste and Ward keywords added (Section 4). Full 9x9 keyword interaction matrix with combat and stacking tables. 96 new faction modifiers (CF01-CF48, EF01-EF48) — total modifiers 240→336 (Section 6). Ironwright rethemed from Victorian steampunk to brutalist space-industrial with updated modifier examples. Planar Ruins battlefield mechanics system (Section 13) with 8 neutral ruins, ruin combat targeting, destruction penalties, and turn structure integration. Ruin evolution mechanics (Section 14) with familiarity thresholds and subscription tier selection. Celestial and Endless starter decks (Section 15). Game AI strategy notes for all 5 factions and ruins (Section 16). Updated instability calculation to include ruins. Updated Main Phase for ruin play and Haste bonus attack. Updated Declare Attackers for ruin targeting. Updated all faction/keyword counts (3→5 factions, 7→9 keywords). Sections renumbered (old 13-15 → 17-19). | 1-6, 13-16, 17-19 |

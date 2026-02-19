# PHASE1B --- Mechanics Expansion: New Factions, New Keywords, Modifier Pools

This document defines the complete mechanical design for the Chaos Creatures faction expansion: the Celestial Crusade (Exalt), The Endless (Persist), Haste and Ward keywords, all 144 faction modifiers (48 Celestial + 48 Endless + 48 rethemed Ironwright), starter decks, and balance analysis.

**Depends on:** `01-battle-mechanics.md` (PP budget system, modifier pool structure, keyword definitions, combat resolution), `00-game-design-master.md` (systems overview), `02-card-data-model.md` (data structures), `11-lore-bible.md` (faction identities), `PLAN-faction-expansion.md` (master plan)

---

## Revision Log

| Date | Version | Changes |
|---|---|---|
| 2026-02-18 | v1.0 | Initial creation --- full mechanics expansion: Exalt, Persist, Haste, Ward, 9x9 keyword matrix, 144 faction modifiers (CF01-CF48, EF01-EF48, IF01-IF48), 2 starter decks, balance analysis |

---

## Table of Contents

1. [Exalt Mechanic (Celestial Crusade)](#1-exalt-mechanic-celestial-crusade)
2. [Persist Mechanic (The Endless)](#2-persist-mechanic-the-endless)
3. [Haste Keyword](#3-haste-keyword)
4. [Ward Keyword](#4-ward-keyword)
5. [Keyword Interaction Matrix (9x9)](#5-keyword-interaction-matrix-9x9)
6. [Celestial Faction Modifiers (CF01-CF48)](#6-celestial-faction-modifiers-cf01-cf48)
7. [Endless Faction Modifiers (EF01-EF48)](#7-endless-faction-modifiers-ef01-ef48)
8. [Rethemed Ironwright Modifiers (IF01-IF48)](#8-rethemed-ironwright-modifiers-if01-if48)
9. [Celestial Starter Deck](#9-celestial-starter-deck)
10. [Endless Starter Deck](#10-endless-starter-deck)
11. [Balance Analysis](#11-balance-analysis)

---

## 1. Exalt Mechanic (Celestial Crusade)

### Core Rule

**Exalt** is the exclusive mechanic of the Celestial Crusade. Exalt modifiers provide aura effects that benefit all friendly creatures when a board-presence threshold is met. The power is in the formation --- a single Celestial creature is ordinary, but a board of Celestial creatures amplifying each other through Exalt auras becomes overwhelming.

**Rule text:** *"Exalt N --- [Effect]. (While you control N or more creatures, all friendly creatures gain [Effect].)"*

Exalt is a continuous aura. It checks the board state in real-time. The instant the creature count drops below the threshold, the Exalt bonus deactivates for ALL sources that required that threshold. The instant the count meets or exceeds the threshold again, the bonus reactivates.

### Exalt Thresholds

| Threshold | Designation | Typical Modifier Tier | Design Intent |
|---|---|---|---|
| Exalt 2 | Minor Exalt | 1 PP (Early) | Easy to activate --- any two creatures on board. Small bonuses. Rewards simply playing the game. |
| Exalt 3 | Standard Exalt | 2 PP (Early/Late) | Moderate commitment. Three creatures means investing board slots in bodies rather than quality. The core Celestial breakpoint. |
| Exalt 4 | Major Exalt | 2-3 PP (Late) | Heavy board commitment. Four creatures out of five slots. Powerful effects but fragile to removal. |
| Exalt 5 | Supreme Exalt | 3 PP (Late only) | Full board. Maximum reward but maximum vulnerability. A single removal collapses the bonus. Legendary-tier payoffs. |

**Threshold counts ALL friendly creatures**, not just creatures with Exalt modifiers. A Celestial board with 2 Exalt creatures and 2 vanilla creatures still counts as 4 creatures for threshold purposes. This is intentional --- Exalt rewards going wide with any creatures, not just Exalt-modified ones.

### Exalt Stacking

Multiple Exalt sources **stack additively**. If Creature A has "Exalt 3 --- all friendly creatures get +1 ATK" and Creature B has "Exalt 3 --- all friendly creatures get +1 HP," then when you control 3+ creatures, all friendly creatures (including A and B themselves) get +1 ATK and +1 HP.

**Exalt bonuses from the same creature do NOT stack with themselves.** A creature with two Exalt modifiers that both say "+1 ATK" at Exalt 3 provides +2 ATK to all friendlies (two separate sources). This is correct --- the creature invested two modifier slots into Exalt and is rewarded with doubled output.

**Exalt bonuses affect the source creature.** Creature A with Exalt 3 +1 ATK gives itself +1 ATK as well. The Celestial creature is part of the formation it inspires.

### Exalt and Creature Death

When a creature with an Exalt modifier dies, its Exalt aura immediately deactivates. This has two compounding effects:

1. The aura bonus provided by that creature is lost (direct loss).
2. The creature count drops, potentially collapsing OTHER Exalt thresholds (cascade loss).

**Example cascade:** You have 4 creatures, each with Exalt 3 and Exalt 4 effects active. An opponent kills 1 creature. Now you have 3 creatures. The dead creature's auras are gone, AND all Exalt 4 effects on the remaining 3 creatures deactivate. You lost one creature but lost the effective power of four Exalt 4 bonuses.

This cascade vulnerability is the core weakness of the Celestial Crusade. Board wipes are catastrophic. Targeted removal of any single creature degrades the entire formation.

### Exalt and Non-Creature Board Occupants

Stabilizers and Planar Ruins occupy creature slots but are NOT creatures. They do NOT count toward Exalt thresholds. A board with 2 creatures and 1 stabilizer has an Exalt count of 2, not 3. This creates a meaningful tension for Celestial players: stabilizers/ruins cost board slots that could be creatures contributing to Exalt.

### Exalt Timing

Exalt checks are continuous --- they do not fire at specific phases. Whenever the board state changes (creature played, creature dies, creature leaves), Exalt thresholds are recalculated immediately. Stat changes from Exalt activation/deactivation apply before any subsequent resolution steps.

**Example:** During Phase 8 (Combat Resolution), if a blocking creature dies from combat damage and the board drops below an Exalt threshold, the Exalt bonuses deactivate immediately. If another combat pair resolves after this, the remaining creatures fight WITHOUT the Exalt bonus. Board slot resolution is still left-to-right.

### Weaknesses and Counterplay

- **Board wipes** (spells dealing damage to all creatures, Upheaval chaos event) collapse Exalt bonuses entirely.
- **Targeted removal** of any creature degrades all Exalt thresholds. Removing the creature with the most Exalt modifiers is especially punishing.
- **Deathtouch** efficiently removes Celestial creatures regardless of Exalt-buffed HP.
- **Flying** bypasses Celestial Taunt formations that protect Exalt sources.
- **Aggro rush** can pressure before Celestial assembles enough creatures for meaningful Exalt thresholds.
- **Corruption self-damage** (Demonic) race can outpace Exalt's incremental value.

### Keyword Affinities

| Keyword | Synergy with Exalt | Rating |
|---|---|---|
| Shield | Protect Exalt sources from removal. Shield on an Exalt creature preserves the aura for an extra hit. | Strong |
| Ward | Protect Exalt sources from targeted modifier effects on deployment turn. | Strong |
| Taunt | Force opponents to attack into your Taunt creature instead of your key Exalt sources. Formation defense. | Strong |
| Lifesteal | Sustain to keep Exalt creatures alive longer. Exalt ATK buffs increase Lifesteal healing. | Moderate |
| Reach | Defensive --- blocks Flying threats that would bypass Taunt and kill Exalt sources. | Moderate |
| Haste | Deploy a creature and immediately benefit from the increased Exalt count. Tempo. | Moderate |
| Flying | Less synergistic --- Flying creatures bypass defenders but Exalt wants formation, not evasion. | Low |
| Piercing | Exalt ATK buffs increase Piercing overflow damage. Some synergy in aggressive Celestial builds. | Low |
| Deathtouch | Low synergy --- Deathtouch is most efficient on small creatures, but Exalt wants board presence, not efficiency per creature. | Low |

---

## 2. Persist Mechanic (The Endless)

### Core Rule

**Persist** is the exclusive mechanic of The Endless. Persist modifiers create effects that trigger when the creature dies, leave lingering effects on the battlefield after death, or make every kill costly for the opponent. The Endless do not fear death --- they weaponize it.

**Rule text:** *"Persist --- [On-death effect]."* or *"Persist --- [Lingering effect] for N turns after this creature dies."*

Persist effects fire during the death-processing step (Phase 8 step 8, or any phase where a creature dies). The creature is already removed from the board when the Persist effect resolves --- it cannot target itself.

### Persist Trigger Types

| Type | Rule | Example | Design Tier |
|---|---|---|---|
| **Death Strike** | When this creature dies, deal N damage to a target. | "Persist --- deal 2 damage to a random enemy creature." | Early (1-2 PP) |
| **Death Buff** | When this creature dies, grant a buff to friendly creatures. | "Persist --- all friendly creatures get +1 ATK permanently." | Early-Late (1-3 PP) |
| **Death Debuff** | When this creature dies, apply a debuff to enemy creatures. | "Persist --- a random enemy creature gets -2 ATK permanently." | Late (2-3 PP) |
| **Lingering Effect** | After this creature dies, an effect persists on the battlefield for N turns. | "Persist --- for 2 turns after death, deal 1 damage to all enemy creatures at start of your turn." | Late (2-3 PP) |
| **Soul Harvest** | When this creature dies, generate a resource or card advantage. | "Persist --- draw 1 card." | Late (2-3 PP) |
| **Spectral Echo** | When this creature dies, summon a weaker token creature in its slot. | "Persist --- summon a 1/1 Spectre token in this creature's slot." | Late (3 PP) |

### Persist Stacking

A creature can have multiple Persist modifiers. ALL of them fire when the creature dies, resolving in the order they were acquired (first modifier first). This means a fully evolved Legendary Endless creature with 4 Persist modifiers triggers a chain of 4 death effects.

**This is intentional and is the core power of The Endless.** Killing a 4-Persist Legendary should feel terrible for the opponent --- like opening Pandora's box. The cost is that the Endless player invested all 4 modifier slots into death triggers instead of combat-relevant effects. The creature fights below curve while alive.

### Persist and Board State

**Persist effects resolve AFTER the creature is removed from the board.** The creature's slot is empty. If the Persist effect summons a token (Spectral Echo), the token occupies the now-empty slot.

**Persist effects that reference "friendly creatures" count only creatures still alive on the board** at the time of resolution. Per the existing death-processing rules in `01-battle-mechanics.md` Phase 8 step 8: all destroyed creatures are removed first, THEN on-death effects fire left-to-right. So Persist effects see the board AFTER all combat deaths are removed.

### Lingering Effects

Lingering Persist effects create a "ghost" marker on the battlefield that lasts for a specified number of turns. The marker occupies no slot --- it is tracked as a persistent effect on the controlling player's side.

**Lingering effect tracking:**
- Each lingering effect has a remaining-turns counter.
- At the start of the controlling player's turn (Phase 1), lingering effects fire their per-turn effect, then decrement the counter.
- When the counter reaches 0, the lingering effect is removed.
- Lingering effects are NOT affected by board wipes, removal spells, or any other effect that targets creatures. They are intangible.
- Maximum 3 lingering effects active per player at once. If a 4th would be created, the oldest one is removed.

### Spectral Echo Tokens

Spectral Echo is the most complex Persist type. When it fires, a token creature is summoned in the dead creature's former slot.

**Token rules:**
- Tokens are 1/1 creatures with no keywords, no modifiers, and 0 base instability.
- Tokens DO count as creatures for all purposes (Exalt thresholds, Bond counts, combat, etc.).
- Tokens do NOT evolve, do NOT earn chaos energy, and do NOT have faction restrictions (they are neutral spectre tokens).
- Tokens CAN be buffed by events, spells, and other creatures' auras.
- If the slot is already occupied when Spectral Echo fires (e.g., another Persist summoned a token first), the token is NOT summoned (lost).
- Token art: a generic translucent spectral figure. Faction-neutral.

### Weaknesses and Counterplay

- **Fast aggro** can pressure Endless before their death-trigger value accumulates. Killing cheap Endless creatures with only 1 Persist is not costly enough to slow down an aggressive deck.
- **Exile/silence effects** (if introduced in future) would prevent Persist from firing.
- **Shield** absorbs the first Persist damage strike, protecting key creatures from death-trigger chip damage.
- **Ward** protects creatures from targeted Persist debuffs on their deployment turn.
- **Avoiding combat** --- an opponent who refuses to attack into Endless creatures (going face with Flying, using spells) can minimize Persist triggers. Endless creatures must die for Persist to matter.
- **Healing through attrition** --- Order decks that heal past Persist damage and lingering effects can outlast the Endless value.
- **Wide boards** dilute targeted Persist effects (random targeting spreads damage across many creatures).

### Keyword Affinities

| Keyword | Synergy with Persist | Rating |
|---|---|---|
| Lifesteal | Sustain while alive, punish on death. Lifesteal keeps Endless creatures fighting longer, then Persist fires on death. Dual-phase value. | Strong |
| Deathtouch | Guarantees that the Endless creature trades when blocked. Opponent must kill it (triggering Persist) or let it through (taking damage). Lose-lose. | Strong |
| Haste | Deploy and attack immediately, forcing the opponent to deal with the creature NOW. Faster Persist cycling. | Strong |
| Taunt | Forces the opponent to attack into the Persist creature. Guarantees the death trigger fires. Proactive Persist activation. | Moderate |
| Piercing | Push face damage while alive, then punish on death. Aggressive Endless builds want maximum value from every creature lifecycle. | Moderate |
| Shield | Keeps the creature alive longer, delaying Persist. This is a tension --- Shield is anti-synergy with wanting to die, but useful for timing deaths strategically. | Low |
| Ward | Minor protection on deployment. Less relevant for Endless --- they WANT opponents to interact with their creatures. | Low |
| Flying | Evasion reduces the chance of dying in combat. Anti-synergy with Persist's desire for death. | Low |
| Reach | Defensive only. Persist wants proactive deaths, not defensive postures. | Low |

---

## 3. Haste Keyword

### Definition

**Haste** --- This creature can attack the turn it is played.

**New default rule:** With the introduction of Haste, **summoning sickness** is now a default rule. Creatures played from hand CANNOT attack the same turn they enter the battlefield, UNLESS they have the Haste keyword.

This changes the existing game rule from `01-battle-mechanics.md` Phase 5 which currently states "No summoning sickness --- they can attack this same turn." The expansion overrides this.

**Updated Phase 5 text:** "Play creature cards from hand onto empty board slots (costs chaos motes). Creatures enter the board immediately with full stats. Creatures have summoning sickness --- they cannot attack the turn they are played unless they have the Haste keyword."

**Updated Phase 6 text:** "Creatures that cannot attack are dimmed: Creatures with summoning sickness (played this turn and lacking Haste)."

### PP Cost

| Keyword | PP Cost | Rationale |
|---|---|---|
| Haste | 1 PP | Tempo advantage of one attack. Valuable for aggro but diminishes as the game goes longer. Most impactful on high-ATK creatures and creatures with on-attack triggers. Cheap because the benefit is one-time (after the first turn, Haste is irrelevant). |

### Summoning Sickness Rules

- A creature has summoning sickness from the moment it enters the battlefield until the START of its controller's NEXT turn (Phase 1).
- Summoning sickness prevents the creature from being declared as an attacker (Phase 6). It can still block (Phase 7). It can still use triggered abilities. It can still be targeted by spells, events, and effects.
- Haste bypasses summoning sickness entirely. A Haste creature can attack the turn it is played.
- Summoning sickness applies ONLY to the turn a creature enters the battlefield. On all subsequent turns, the creature can attack normally regardless of whether it has Haste.
- Creatures already on the board that GAIN Haste through a modifier or event do not benefit from it (they already have no summoning sickness).
- P1's turn 1 attack restriction remains unchanged: P1 cannot attack on turn 1 regardless of Haste.

### Strategic Impact

Haste fundamentally changes the tempo calculation. Without Haste, playing a creature is a defensive investment --- you spend mana now but the creature cannot attack until next turn. With Haste, the creature provides immediate offensive value.

- **Aggro decks** value Haste highly --- every turn of attack matters when racing.
- **Control decks** value Haste minimally --- they want creatures for blocking and defensive value.
- **The Endless** have the strongest Haste synergy --- play a creature, attack immediately, and if it dies in combat, Persist triggers fire. Maximum lifecycle value in one turn.
- **Celestial Crusade** has moderate Haste synergy --- deploying a Haste creature immediately increases the Exalt count AND can attack.

### Counters

- **Shield** absorbs the first Haste attack, negating the tempo advantage.
- **Taunt** forces the Haste creature to attack into the Taunt creature (which the opponent chose as a favorable blocker), wasting the Haste tempo.
- **High-HP creatures** survive the Haste attack and trade back on their turn.

---

## 4. Ward Keyword

### Definition

**Ward** --- This creature cannot be targeted by opponent's triggered abilities and modifier effects for 1 turn after deployment.

Ward provides a window of protection against targeted non-combat effects. The opponent cannot use abilities that say "target enemy creature" or "deal N damage to a random enemy creature" against a creature with active Ward. Ward does NOT protect against combat damage, untargeted AoE effects, or the creature's controller's own effects.

### What Ward Blocks

| Blocked | Not Blocked |
|---|---|
| Opponent's triggered abilities targeting this creature (ON_ORDER, ON_CHAOS, ON_PLAY, ON_ATTACK, ON_BLOCK effects that target a specific enemy creature) | Combat damage (attacker/blocker damage in Phase 8) |
| Opponent's Persist death-strike effects targeting this creature | AoE effects that hit all creatures (Upheaval, "deal N to all enemy creatures") |
| Opponent's spell cards that say "target enemy creature" | AoE events (C3 Upheaval) |
| Random-target effects from opponent ("damage a random enemy creature") --- Ward creature is excluded from the random pool | Effects from the Ward creature's controller |
| Chaos event C2 Wildfire (random enemy creature damage) --- Ward creature excluded from random pool | Chaos event C6 Chaos Siphon (damages a friendly creature --- controller's own effect) |
| Chaos event C7 Maelstrom --- if it would target the Ward creature on the opponent's side, reroll | Board-wide permanent stat changes (O3 Steady Growth only affects friendly creatures, not blocked anyway) |

### Duration

Ward lasts from the moment the creature enters the battlefield until the START of its controller's NEXT turn (Phase 1). This means:

- On the turn a creature is played: Ward is active. The opponent cannot target it with abilities during their next turn's event resolution, combat triggers, etc.
- At the start of the controller's next turn: Ward expires. The creature can now be targeted normally.
- Ward lasts for exactly 1 full opponent turn cycle.

### PP Cost

| Keyword | PP Cost | Rationale |
|---|---|---|
| Ward | 1 PP | One-turn protection window. Valuable for protecting key creatures on deployment but irrelevant after the first turn. Same reasoning as Haste --- one-time benefit, cheap cost. |

### Ward and Reapplication

Ward does NOT refresh or reapply. It fires once on deployment and expires. If a creature gains Ward through a modifier during evolution (not at deployment), the Ward activates the next time the creature enters the battlefield. In the current game, creatures are played once from hand, so Ward from modifiers is relevant on that single deployment.

**Practical clarification for modifiers:** Celestial and Endless modifiers that reference Ward specify "When this creature enters the battlefield, it has Ward" to clarify that the Ward window starts on deployment regardless of when the modifier was gained.

### Ward and Combat

Ward does NOT prevent the creature from being attacked. Opponents can freely declare attacks against a Ward creature and assign blockers to it. Ward only prevents targeted non-combat effects.

### Ward and Taunt

A creature with both Ward and Taunt can be attacked normally (Taunt forces engagement, Ward does not prevent combat). Ward protects the Taunt creature from being removed by targeted spells or abilities before the opponent is forced to attack into it.

### Counters

- **Combat damage** bypasses Ward completely. Attack the creature directly.
- **AoE effects** bypass Ward. Upheaval, board-wide damage spells, and "all enemy creatures" effects ignore Ward.
- **Waiting one turn** --- Ward expires naturally. Patient opponents can simply target the creature next turn.

---

## 5. Keyword Interaction Matrix (9x9)

Complete interaction matrix for all 9 keywords. Each cell describes what happens when a creature with the row keyword interacts with a creature with the column keyword in combat or on the same board.

| | **Shield** | **Lifesteal** | **Flying** | **Reach** | **Deathtouch** | **Taunt** | **Piercing** | **Haste** | **Ward** |
|---|---|---|---|---|---|---|---|---|---|
| **Shield** | Both Shields absorb the other's damage. Both break. Neither creature takes damage. Both survive. | Shield absorbs all incoming damage. Lifesteal heals 0. Shield breaks. | No special interaction. Both apply independently. | No special interaction. Both apply independently. | Shield absorbs Deathtouch hit. Shield breaks. Creature survives. | No special combat interaction. Taunt forces engagement; Shield absorbs first hit. Strong defensive combo. | Shield absorbs ALL damage including pierce-through. 0 to face. Shield breaks. | No special interaction. Both apply independently. | No special interaction. Both apply independently on same creature. |
| **Lifesteal** | Lifesteal heals 0 (Shield absorbed all damage). | Both deal damage. Both controllers heal. Simultaneous. | No special interaction. Both apply independently. | No special interaction. Both apply independently. | Lifesteal heals; Deathtouch kills the Lifesteal creature. Both resolve simultaneously. | Lifesteal on Taunt: controller heals when Taunt intercepts. Defensive sustain. | Same creature: Lifesteal heals for damage to creature AND Piercing face damage. Strong aggro-sustain. | Haste + Lifesteal: immediate attack with healing. | No special interaction. Independent. |
| **Flying** | No special interaction. | No special interaction. | Both Flying: can block each other normally. | Reach can block Flying. Flying can also block Reach creature. | No special combat interaction. Deathtouch creature needs Flying/Reach to block Flying. | Ground Taunt cannot block Flying. Forced-block waived. Forced-attack still applies. Taunt + Reach/Flying blocks normally. | No special interaction. Flying + Piercing on same creature: if blocked, excess pierces to face. | Flying + Haste: deploy, attack immediately, likely unblocked. Strong tempo. | No special interaction. Independent. |
| **Reach** | No special interaction. | No special interaction. | Reach can block Flying. Primary purpose. | Two Reach creatures: no special interaction. Reach only matters vs Flying. | No special interaction. Reach + Deathtouch: strong anti-air (blocks Flying, kills with Deathtouch). | Reach + Taunt: can force-block Flying attackers. Strong anti-air defense. | No special interaction. | No special interaction. | No special interaction. |
| **Deathtouch** | Shield absorbs Deathtouch. Shield breaks. Creature survives. Deathtouch kill prevented. | Deathtouch kills Lifesteal creature. Lifesteal still heals (simultaneous). | No special combat interaction. Needs Flying/Reach to block Flying. | No special interaction. Deathtouch + Reach: blocks and kills Flying. | Both Deathtouch: both die (mutual guaranteed destruction). | Deathtouch + Taunt: forces opponent to attack, then kills whatever they send. Extremely strong. | Deathtouch on attacker: kills blocker. Piercing sends ATK minus 1 to face. Extremely powerful combo. | Haste + Deathtouch: deploy, attack immediately, kill any blocker. | No special interaction. Deathtouch is combat; Ward blocks targeting. |
| **Taunt** | Taunt + Shield: forces engagement, Shield absorbs first hit. Strong wall. | Taunt + Lifesteal: forces fights, heals from them. Sustain tank. | Ground Taunt cannot block Flying. Taunt + Reach/Flying blocks Flying normally. | Taunt + Reach: can force-block Flying. Strong anti-air. | Taunt + Deathtouch: forces opponent to sacrifice a creature every attack. | Both Taunt: both sides force attacks and blocks. Standard rules both sides. | Taunt blocks Piercing attacker: excess still pierces to face. | Haste creature can be forced to attack by Taunt. Non-Haste with summoning sickness cannot be forced. | No special interaction. Taunt forces combat; Ward blocks targeting. |
| **Piercing** | Shield absorbs all. 0 to face. Piercing wasted. | Same creature: heals for ALL damage dealt (creature + face). | No special interaction. | No special interaction. | Piercing + Deathtouch: excess to face, Deathtouch kills blocker. Both die, face damage applies. | Piercing through Taunt: excess goes to face despite Taunt redirect. | Attacker Piercing applies. Defender Piercing does NOT (per rules). | Haste + Piercing: deploy, attack, push excess to face. Strong aggro. | No special interaction. |
| **Haste** | No special interaction. | Haste + Lifesteal: immediate attack with healing. | Haste + Flying: immediate unblockable attack. Very strong. | No special interaction. | Haste + Deathtouch: immediate trade on deployment. | Haste creature can be forced by Taunt on deployment turn. | Haste + Piercing: immediate face pressure. | Both Haste: no special interaction. Both attack on deployment. | Haste + Ward: deploy, attack immediately, protected from targeting. Strong deployment package. |
| **Ward** | Ward + Shield: protected from targeting AND first hit. | No special interaction. | No special interaction. | No special interaction. | Ward does not prevent Deathtouch in combat. | Ward does not prevent Taunt mechanics. | No special interaction. | Haste + Ward: immediate attack + targeting protection. | Both Ward: each has own protection. No stacking. |

---

## 6. Celestial Faction Modifiers (CF01-CF48)

48 modifiers organized into 12 pools (3 PP budgets x 2 tier brackets x 2 attunements), 4 per pool. Every modifier references the Exalt mechanic.

### Pool 1: 1 PP, Early Tier, Order-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF01 | Divine Formation | Base: +1 HP. Order Attuned: Exalt 2 --- all friendly creatures get +0/+1 this turn. | Exalt 2 aura provides board-wide toughness when Order fires. | Faint golden lattice connecting creatures in formation. |
| CF02 | Righteous Presence | Base: Exalt 2 --- this creature gets +1 ATK. Order Attuned: +1 HP. | Exalt 2 self-buff rewards having a second creature on board. | Soft halo glow intensifying with nearby allies. |
| CF03 | Vow of Solidarity | Base: +1 HP. Order Attuned: if you control 2+ creatures, -1 instability on this creature. | Exalt-adjacent board check reduces instability toward Order. | Golden chain links binding creature to its companions. |
| CF04 | Sanctified Stance | Base: Exalt 2 --- this creature gets +0/+1. Order Attuned: +0/+1. | Exalt 2 defensive self-buff stacks with Order bonus for +0/+2 on Order turns with 2+ creatures. | Divine armor plating with prayer inscriptions. |

### Pool 2: 1 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF05 | Burning Conviction | Base: +1 ATK. Chaos Attuned: Exalt 2 --- all friendly creatures get +1 ATK this turn. | Exalt 2 aura provides board-wide burst on Chaos turns. | Burning golden fire spreading between allies. |
| CF06 | Zealot's Fury | Base: Exalt 2 --- this creature gets +1 ATK. Chaos Attuned: +1 ATK. | Exalt 2 self-buff with Chaos bonus for aggressive output. | Eyes blazing with divine wrath, gold-rimmed flames. |
| CF07 | Crusader's Charge | Base: +1 ATK, +1 instability. Chaos Attuned: Exalt 2 --- this creature gets +1 ATK. | Instability push fuels Chaos events while Exalt rewards board presence. | Creature lunging forward trailing divine fire. |
| CF08 | Radiant Wrath | Base: Exalt 2 --- this creature gets +1 ATK. Chaos Attuned: deal 1 damage to a random enemy creature. | Exalt aggression with Chaos chip damage. | Burst of divine light scorching outward. |

### Pool 3: 1 PP, Late Tier, Order-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF09 | Harmonious Ward | Base: Exalt 3 --- this creature gets +0/+1. Order Attuned: Exalt 3 --- all friendly creatures heal 1 HP. | Exalt 3 healing aura on Order turns rewards three-creature formation. | Translucent golden dome enveloping nearby allies. |
| CF10 | Covenant of Light | Base: +1 HP. Order Attuned: if you control 3+ creatures, this creature gains Ward this turn. | Conditional Ward refresh tied to Exalt-like board threshold. | Inscribed circle of divine protection beneath creature's feet. |
| CF11 | Martyr's Shield | Base: Exalt 2 --- this creature gets -1 instability. Order Attuned: +0/+1. | Instability reduction fuels Order consistency when formation is active. | Golden shield icon floating before the creature. |
| CF12 | Blessed Formation | Base: Exalt 3 --- this creature gets +1 HP. Order Attuned: this creature gains Reach. | Exalt 3 with Reach grant covers anti-air for the formation. | Wings of light unfurling defensively behind the creature. |

### Pool 4: 1 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF13 | Wrathful Sermon | Base: Exalt 3 --- this creature gets +1 ATK. Chaos Attuned: deal 1 damage to the enemy creature with lowest HP. | Exalt 3 aggression with targeted Chaos chip damage. | Creature bellowing divine judgment, sound waves visible. |
| CF14 | Divine Reckoning | Base: +1 ATK, +1 instability. Chaos Attuned: Exalt 3 --- all friendly creatures get +1 ATK this turn. | Heavy Chaos push with Exalt 3 board-wide burst. | Cracks of divine fire splitting the ground beneath enemies. |
| CF15 | Heaven's Judgment | Base: Exalt 2 --- this creature gets +1 ATK. Chaos Attuned: if you control 3+ creatures, deal 1 damage to all enemy creatures. | Exalt threshold triggers minor AoE on Chaos turns. | Beams of light striking down from above. |
| CF16 | Crusade Fervor | Base: Exalt 3 --- this creature gets +1 ATK. Chaos Attuned: this creature gains Haste until end of turn. | Exalt aggression with conditional Haste for immediate pressure. | Golden afterimages trailing the creature's charge. |

### Pool 5: 2 PP, Early Tier, Order-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF17 | Sanctum Aura | Base: Exalt 2 --- all friendly creatures get +0/+1. Order Attuned: Exalt 3 --- all friendly creatures get +0/+1. | Scaling Exalt aura: +0/+1 at 2, +0/+2 at 3. Core defensive Exalt modifier. | Concentric rings of golden light radiating outward. |
| CF18 | Paladin's Oath | Base: +1 HP, Taunt. Order Attuned: Exalt 2 --- this creature gets +0/+1. | Taunt protects the formation; Exalt rewards having allies. PP: Taunt(1)+1HP(1)=2. | Heavy divine armor with oath-runes glowing along the edges. |
| CF19 | Divine Aegis | Base: Exalt 3 --- all friendly creatures get +0/+1. Order Attuned: this creature gains Shield. | Exalt 3 aura with Shield self-grant on Order turns. | Layered golden shields orbiting the creature. |
| CF20 | Consecrated Ground | Base: -1 instability, +1 HP. Order Attuned: Exalt 2 --- all friendly creatures heal 1 HP. | Instability reduction plus Exalt healing aura. Sustain formation. PP: -1inst(1)+1HP(1)=2. | Sacred ground glowing beneath all friendly creatures. |

### Pool 6: 2 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF21 | Burning Crusade | Base: Exalt 2 --- all friendly creatures get +1 ATK. Chaos Attuned: +1 ATK. | Exalt 2 board-wide ATK aura plus self-buff on Chaos turns. Core offensive Celestial modifier. | All friendly creatures wreathed in holy flame. |
| CF22 | Wrath of the Chosen | Base: +2 ATK. Chaos Attuned: Exalt 3 --- deal 1 damage to all enemy creatures. | Raw ATK plus Exalt 3 AoE on Chaos turns. Aggressive board control. | Multiple wings unfurling, each tipped with flame. |
| CF23 | Fervent Assault | Base: +1 ATK, Haste. Chaos Attuned: Exalt 2 --- this creature gets +1 ATK. | Haste for immediate pressure plus Exalt scaling. PP: 1ATK(1)+Haste(1)=2. | Creature charging forward leaving golden afterimages. |
| CF24 | Zealous Momentum | Base: +1 ATK, +1 instability. Chaos Attuned: Exalt 2 --- all friendly creatures get +1 ATK this turn. | Instability push fuels Chaos, Exalt 2 burst on Chaos turns. PP: 1ATK(1)+1inst(1)=2. | Radiant speed lines and divine energy vortex. |

### Pool 7: 2 PP, Late Tier, Order-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF25 | Cathedral Formation | Base: Exalt 3 --- all friendly creatures get +0/+1. Order Attuned: Exalt 4 --- all friendly creatures gain Shield this turn. | Scaling Exalt: HP aura at 3, Shield aura at 4. Keystone defensive modifier. | Cathedral arches of golden light over the formation. |
| CF26 | Radiant Bastion | Base: Shield, -1 instability. Order Attuned: Exalt 3 --- when this creature's Shield breaks, grant Shield to a random friendly creature. | Shield redistribution within the Exalt formation. Recursive defense. PP: Shield(3)-but this is 2PP pool. Adjustment: Base: -1 instability. Order Attuned: Exalt 3 --- this creature gains Shield. +0/+1. PP: -1inst(1)+1HP(1)=2. | Cracking golden shield releasing light toward allies. |
| CF27 | Warden of the Faithful | Base: Taunt, +1 HP. Order Attuned: Exalt 3 --- this creature gets +0/+1. | Taunt + Exalt HP scaling. Tank that grows tougher in formation. PP: Taunt(1)+1HP(1)=2. | Massive shield with divine iconography, blocking stance. |
| CF28 | Seraph's Blessing | Base: Exalt 3 --- all friendly creatures heal 1 HP at start of your turn. Order Attuned: +0/+1, heal 2 HP instead. | Persistent Exalt healing aura. Formation sustain engine. | Gentle rain of golden light particles healing allies. |

### Pool 8: 2 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF29 | Crusade Momentum | Base: Exalt 3 --- all friendly creatures get +1 ATK. Chaos Attuned: +1 ATK. | Board-wide Exalt ATK aura with self-buff. Core offensive late-game modifier. | Surging wave of divine energy empowering the formation. |
| CF30 | Smite the Unworthy | Base: +1 ATK. Chaos Attuned: Exalt 4 --- deal 2 damage to the enemy creature with the lowest HP. | Exalt 4 targeted removal on Chaos turns. Board control through divine judgment. | Beam of concentrated divine light striking downward. |
| CF31 | Heaven's Arsenal | Base: Exalt 3 --- this creature gets +1 ATK and Piercing this turn. Chaos Attuned: +1 ATK. | Exalt 3 with conditional Piercing for face damage pressure. | Celestial weapons materializing around the creature. |
| CF32 | Wrathful Exaltation | Base: +1 ATK, +1 instability. Chaos Attuned: Exalt 3 --- all friendly creatures get +1 ATK and +1 instability. | Board-wide Exalt aggression AND instability push. High-risk divine fury. PP: 1ATK(1)+1inst(1)=2. | All friendly creatures engulfed in chaotic divine fire. |

### Pool 9: 3 PP, Early Tier, Order-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF33 | Angelic Bulwark | Base: Shield, +1 HP. Order Attuned: Exalt 2 --- all friendly creatures get +0/+1. | Shield + HP + Exalt aura. Complete defensive package. PP: Shield(3)=3. Attuned bonus is conditional. | Multi-layered golden shield with angelic wing motifs. |
| CF34 | Holy Covenant | Base: Exalt 2 --- all friendly creatures get +0/+1. Order Attuned: +1 HP, -1 instability. | Exalt defensive aura plus instability reduction for Order consistency. | Sacred covenant glyphs glowing on each friendly creature. |
| CF35 | Deliverance Vanguard | Base: +1 ATK, Shield. Order Attuned: Exalt 2 --- this creature gets +0/+1. | Shield protection with Exalt scaling. PP: 1ATK(1)+Shield(3)=4. Overcost at 3PP? No, Shield is in base, total is 3PP with 1ATK: 1+3=4. Adjust: Base: Shield. Order Attuned: Exalt 2 --- +0/+1. PP: Shield(3)=3. | Heavily armored creature emerging through a gate of light. |
| CF36 | Radiant Sentinel | Base: Taunt, +1 HP, +1 ATK. Order Attuned: Exalt 2 --- all friendly creatures heal 1 HP. | Taunt tank with Exalt healing aura. PP: Taunt(1)+1HP(1)+1ATK(1)=3. | Towering armored figure radiating protective golden light. |

### Pool 10: 3 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF37 | Crusader's Fury | Base: +2 ATK, Haste. Chaos Attuned: Exalt 2 --- all friendly creatures get +1 ATK this turn. | Haste + ATK + Exalt burst. Immediate offensive impact. PP: 2ATK(2)+Haste(1)=3. | Golden-armored warrior charging with divine speed. |
| CF38 | Burning Judgment | Base: +1 ATK, +1 instability. Chaos Attuned: Exalt 3 --- deal 2 damage to a random enemy creature. +1 ATK. | Instability push, Exalt removal, and raw ATK. PP: 1ATK(1)+1inst(1)+1ATK(1)=3. | Divine fire cascading from raised weapon onto enemies. |
| CF39 | Wings of Wrath | Base: Flying, +1 ATK. Chaos Attuned: Exalt 2 --- this creature gets +1 ATK. | Flying evasion with Exalt ATK scaling. PP: Flying(2)+1ATK(1)=3. | Multi-winged creature ascending with burning golden feathers. |
| CF40 | Herald of Crusade | Base: +2 ATK. Chaos Attuned: Exalt 2 --- all friendly creatures get +1 ATK this turn. +1 instability. | Raw ATK with Exalt board burst and instability push. PP: 2ATK(2)+1inst(1)=3. | Trumpeting herald creature with waves of golden energy. |

### Pool 11: 3 PP, Late Tier, Order-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF41 | Sanctum of the Exalted | Base: Exalt 3 --- all friendly creatures get +1/+1. Order Attuned: Exalt 4 --- all friendly creatures gain Shield. | Strongest Exalt defensive modifier. +1/+1 at 3 creatures, Shield at 4. | Grand cathedral dome of light enveloping all friendly creatures. |
| CF42 | Archangel's Mantle | Base: Shield. Order Attuned: Exalt 3 --- when this Shield breaks, all friendly creatures get +0/+1 permanently. | Shield break converts to permanent Exalt board toughness. PP: Shield(3)=3. | Six-winged mantle of golden energy, shield of layered light. |
| CF43 | Eternal Vigil | Base: Taunt, -2 instability, +1 HP. Order Attuned: Exalt 3 --- this creature gets +0/+1. | Maximum Order consistency with Exalt tank scaling. PP: Taunt(1)+2inst(2)=3. +1HP as bonus. | Unblinking divine sentinel wreathed in stabilizing light. |
| CF44 | Covenant of Eternity | Base: Exalt 4 --- all friendly creatures get +1/+1 and heal 1 HP at start of turn. Order Attuned: +0/+1. | Exalt 4 supercharger. Board-wide stats AND healing. Supreme formation payoff. | Eternal golden covenant circle beneath all friendly creatures. |

### Pool 12: 3 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect | Exalt Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| CF45 | Day of Judgment | Base: +2 ATK. Chaos Attuned: Exalt 4 --- deal 3 damage to all enemy creatures. | Exalt 4 AoE nuke on Chaos turns. Celestial finisher. PP: 2ATK(2)+conditional. | Blinding pillar of divine light annihilating enemy ranks. |
| CF46 | Seraphic Tempest | Base: Flying, +1 ATK, +1 instability. Chaos Attuned: Exalt 3 --- all friendly creatures get +2 ATK this turn. | Flying aggression with massive Exalt board burst. PP: Flying(2)+1ATK(1)+1inst is 4. Adjust: Base: Flying, +1 instability. Chaos Attuned: Exalt 3 --- all friendly creatures get +2 ATK this turn. PP: Flying(2)+1inst(1)=3. | Storm of divine feathers and golden lightning. |
| CF47 | Righteous Annihilation | Base: Exalt 5 --- all friendly creatures get +2/+2 and Piercing this turn. Chaos Attuned: +1 ATK. | Exalt 5 supreme payoff. Full board Piercing burst. Requires all 5 creature slots. | Reality cracking under the weight of divine power. |
| CF48 | Voice of the Burning Wheels | Base: +2 ATK, +1 instability. Chaos Attuned: Exalt 3 --- all friendly creatures get +1 ATK permanently. | Permanent Exalt ATK aura. Aggressive engine piece. PP: 2ATK(2)+1inst(1)=3. | Concentric burning wheels with countless eyes, reality warping. |

---

## 7. Endless Faction Modifiers (EF01-EF48)

48 modifiers organized into 12 pools (3 PP budgets x 2 tier brackets x 2 attunements), 4 per pool. Every modifier references the Persist mechanic.

### Pool 1: 1 PP, Early Tier, Order-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF01 | Lingering Will | Base: +1 HP. Order Attuned: Persist --- when this creature dies, heal your avatar for 2 HP. | Death trigger provides sustain. | Ghostly afterimage trailing the creature. |
| EF02 | Bone Fortification | Base: Persist --- when this creature dies, a random friendly creature gets +0/+1 permanently. Order Attuned: +1 HP. | Death buff transfers toughness to survivors. | Bone plates reinforcing the creature's frame. |
| EF03 | Spectral Anchor | Base: +1 HP, -1 instability. Order Attuned: Persist --- when this creature dies, reduce instability by 1 for 2 turns. | Instability reduction on death sustains Order consistency. PP: 1HP(1) base. -1inst part of attuned conditional. Adjust to fit 1PP: Base: +1 HP. Order Attuned: Persist --- when this creature dies, -1 instability on this player for 1 turn. | Translucent chain anchoring the creature to the mortal plane. |
| EF04 | Embalmer's Art | Base: Persist --- when this creature dies, a random friendly creature gets +0/+1 permanently. Order Attuned: +0/+1. | Death buff + Order toughness. | Preservation sigils glowing on the creature's skin. |

### Pool 2: 1 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF05 | Death's Bite | Base: +1 ATK. Chaos Attuned: Persist --- when this creature dies, deal 1 damage to a random enemy creature. | Chip damage death trigger. Every kill costs the opponent. | Spectral fangs bared, green necrotic energy. |
| EF06 | Grudge Bearer | Base: Persist --- when this creature dies, deal 1 damage to the enemy avatar. Chaos Attuned: +1 ATK. | Face damage death trigger. Direct Persist aggro value. | Hateful spectral energy radiating from the creature. |
| EF07 | Grave Spite | Base: +1 ATK, +1 instability. Chaos Attuned: Persist --- when this creature dies, a random enemy creature gets -1 ATK permanently. | Instability push with death debuff. PP: 1ATK(1)+1inst is 2PP. Adjust: Base: +1 ATK. Chaos Attuned: Persist --- when this creature dies, a random enemy creature gets -1 ATK permanently. +1 instability. PP: 1ATK(1)=1. Inst in attuned bonus. | Sickly green aura intensifying as the creature weakens. |
| EF08 | Restless Rage | Base: Persist --- when this creature dies, a random friendly creature gets +1 ATK permanently. Chaos Attuned: +1 ATK. | Death-transferred ATK. | Spectral rage visibly transferring between creatures. |

### Pool 3: 1 PP, Late Tier, Order-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF09 | Undying Vigil | Base: Persist --- when this creature dies, a random friendly creature gains Shield. Order Attuned: +1 HP. | Shield inheritance on death. Defensive Persist chain. | Ghostly shield materializing over another creature. |
| EF10 | Phylactery Fragment | Base: +1 HP. Order Attuned: Persist --- when this creature dies, heal all friendly creatures for 1 HP. | Board-wide healing death trigger. | Small glowing phylactery fragment embedded in the creature. |
| EF11 | Ossuary's Lesson | Base: Persist --- when this creature dies, draw 1 card. Order Attuned: +0/+1. | Card advantage death trigger. Replaces itself when killed. | Ancient bone-text scrolling across the creature's body. |
| EF12 | Spectral Resilience | Base: Persist --- when this creature dies, a random friendly creature gets +0/+2 permanently. Order Attuned: +0/+1. | Heavy HP inheritance. Survivors grow tankier. | Dense spectral energy condensing into protective layers. |

### Pool 4: 1 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF13 | Wailing Curse | Base: Persist --- when this creature dies, deal 2 damage to a random enemy creature. Chaos Attuned: +1 ATK. | Heavy chip damage death trigger. | Spectral wail visually distorting the air. |
| EF14 | Grave Echo | Base: +1 ATK. Chaos Attuned: Persist --- when this creature dies, all enemy creatures take 1 damage. +1 instability. | AoE death trigger. Board-wide punishment. | Shockwave of spectral energy expanding from the creature. |
| EF15 | Undeath's Reach | Base: Persist --- when this creature dies, a random enemy creature gets -1 ATK and -1 HP permanently. Chaos Attuned: +1 ATK. | Combined stat debuff death trigger. | Spectral claws reaching from beyond death. |
| EF16 | Harbinger's Gift | Base: Persist --- when this creature dies, a random friendly creature gets +1 ATK. Chaos Attuned: +1 ATK. | ATK inheritance. Dead creature empowers a living ally. | Ghostly weapon materializing in another creature's grasp. |

### Pool 5: 2 PP, Early Tier, Order-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF17 | Deathless Guard | Base: +1 HP, Taunt. Order Attuned: Persist --- when this creature dies, a random friendly creature gains Taunt this turn. | Taunt with Taunt inheritance. PP: 1HP(1)+Taunt(1)=2. | Skeletal warrior in heavy bone armor, blocking stance. |
| EF18 | Soul Harvest | Base: Persist --- when this creature dies, heal your avatar for 3 HP. Order Attuned: +1 HP. Draw 1 card on death (attuned bonus). | Sustain death trigger: HP recovery + card advantage. | Soul-light drifting upward from the creature toward the avatar. |
| EF19 | Bone Weave | Base: +1 HP. Order Attuned: Persist --- when this creature dies, all friendly creatures get +0/+1 permanently. +0/+1. | Board-wide HP inheritance. PP: 1HP(1)+conditional=2. Adjust: Base: +1 HP, +1 HP. Order Attuned: Persist --- when this creature dies, all friendly creatures get +0/+1 permanently. PP: 2HP(2)=2. | Interlocking bone lattice beneath the creature's skin. |
| EF20 | Cabal's Investment | Base: -1 instability, +1 HP. Order Attuned: Persist --- when this creature dies, reduce your instability by 2 for 1 turn. | Order gets MORE stable as creatures die. PP: -1inst(1)+1HP(1)=2. | Cold blue-green soul-light pooling around surviving creatures. |

### Pool 6: 2 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF21 | Necrotic Burst | Base: +1 ATK. Chaos Attuned: Persist --- when this creature dies, deal 2 damage to a random enemy creature. +1 ATK. | ATK + death damage. PP: 1ATK(1)+conditional ATK(1)=2. | Necrotic energy seeping from the creature's wounds. |
| EF22 | Spectral Vengeance | Base: Persist --- when this creature dies, deal damage equal to this creature's base ATK to a random enemy creature. Chaos Attuned: +1 ATK. +1 instability. | ATK-scaling death nuke. PP: conditional+1ATK(1)+1inst(1)=2. | Spectral duplicate attacking from beyond death. |
| EF23 | Death's Haste | Base: +1 ATK, Haste. Chaos Attuned: Persist --- when this creature dies, a random friendly creature gets +1 ATK permanently. | Haste for immediate value, ATK inheritance on death. PP: 1ATK(1)+Haste(1)=2. | Creature blurring with spectral speed, ghostly afterimages. |
| EF24 | Grave Hunger | Base: Lifesteal. Chaos Attuned: Persist --- when this creature dies, deal 2 damage to the enemy avatar. | Lifesteal sustain alive, face burn on death. PP: Lifesteal(2)=2. | Hungering spectral maw draining life energy. |

### Pool 7: 2 PP, Late Tier, Order-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF25 | Ossuary Sentinel | Base: Taunt, +1 HP. Order Attuned: Persist --- when this creature dies, summon a 1/1 Spectre token with Taunt in this slot. | Taunt that replaces itself. PP: Taunt(1)+1HP(1)=2. | Bone construct reforming from its own fragments. |
| EF26 | Phylactery Bond | Base: Persist --- when this creature dies, a random friendly creature gains Shield and +0/+1 permanently. Order Attuned: +1 HP. | Shield + HP inheritance. Premium defensive death trigger. | Phylactery glow transferring to a nearby creature. |
| EF27 | Eternal Rest | Base: +1 HP, -1 instability. Order Attuned: Persist --- when this creature dies, all friendly creatures heal 2 HP. | Board-wide healing death trigger. PP: 1HP(1)+-1inst(1)=2. | Ghostly vigil-light protecting surrounding allies. |
| EF28 | Lich's Calculation | Base: Persist --- when this creature dies, draw 1 card. Order Attuned: +1 HP, +0/+1. | Card advantage death trigger. PP: conditional+1HP(1)+1HP(1)=2. | Lich's staff with branching soul-light. |

### Pool 8: 2 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF29 | Cascading Death | Base: +1 ATK. Chaos Attuned: Persist --- when this creature dies, deal 2 damage to all enemy creatures. | AoE death nuke. Mass punishment. | Chain explosion of spectral energy across enemy lines. |
| EF30 | Wraithfire | Base: Persist --- for 2 turns after this creature dies, deal 1 damage to all enemy creatures at start of your turn. Chaos Attuned: +1 ATK. | Lingering AoE. The creature dies but keeps burning. | Ghostly green fire continuing to burn in the empty slot. |
| EF31 | Spite Incarnate | Base: +1 ATK, Deathtouch. Chaos Attuned: Persist --- when this creature dies, deal 2 damage to the enemy avatar. | Deathtouch guarantees trades, Persist punishes the kill. PP: 1ATK(1)+Deathtouch is 3PP. This is 2PP pool. Adjust: Base: +1 ATK. Chaos Attuned: Persist --- when this creature dies, deal 2 damage to the enemy avatar. +1 instability. PP: 1ATK(1)+1inst(1)=2. | Creature with toxic spectral aura and hate-filled eyes. |
| EF32 | Necromantic Echo | Base: +1 ATK, +1 instability. Chaos Attuned: Persist --- when this creature dies, summon a 1/1 Spectre token in this slot. | Token replacement on death. PP: 1ATK(1)+1inst(1)=2. | Spectral duplicate forming beside the creature. |

### Pool 9: 3 PP, Early Tier, Order-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF33 | Deathless Fortress | Base: Shield. Order Attuned: Persist --- when this creature dies, all friendly creatures gain Shield. | Shield self + Shield inheritance. PP: Shield(3)=3. | Bone fortress materializing, shield-light on allies. |
| EF34 | Cabal Architect | Base: Taunt, +1 HP, +1 HP. Order Attuned: Persist --- when this creature dies, summon a 1/1 Spectre token with Taunt in this slot. | Taunt tank that replaces itself. PP: Taunt(1)+2HP(2)=3. | Lich architect constructing bone barriers. |
| EF35 | Soul Reservoir | Base: +1 HP, -1 instability. Order Attuned: Persist --- when this creature dies, heal all friendly creatures for 2 HP and your avatar for 2 HP. +0/+1. | Maximum sustain death trigger. PP: 1HP(1)+-1inst(1)+1HP(1)=3. | Reservoir of captured soul-energy beneath the creature. |
| EF36 | Undying Covenant | Base: +1 HP, Ward. Order Attuned: Persist --- when this creature dies, a random friendly creature gets +0/+2 permanently. | Ward + stat inheritance on death. PP: 1HP(1)+Ward(1)+1HP(1)=3. | Covenant sigils transferring from dying creature to living one. |

### Pool 10: 3 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF37 | Abomination's Gift | Base: +2 ATK. Chaos Attuned: Persist --- when this creature dies, deal 3 damage to a random enemy creature. +1 instability. | Heavy death damage. PP: 2ATK(2)+1inst(1)=3. | Monstrous bone-and-flesh construct radiating necrotic energy. |
| EF38 | Gravecaller's Wrath | Base: +1 ATK, Haste, +1 instability. Chaos Attuned: Persist --- when this creature dies, deal 2 damage to a random enemy creature. | Haste + death damage. PP: 1ATK(1)+Haste(1)+1inst(1)=3. | Necromancer raising skeletal hands from the ground. |
| EF39 | Spectral Fury | Base: +2 ATK, Deathtouch. Chaos Attuned: Persist --- when this creature dies, a random friendly creature gains +1 ATK permanently. | Deathtouch + ATK inheritance. PP: 2ATK(2)+Deathtouch(3)=5. Over budget. Adjust: Base: Deathtouch. Chaos Attuned: Persist --- when this creature dies, a random friendly creature gains Deathtouch permanently. PP: Deathtouch(3)=3. | Toxic spectral blades forming around the creature's hands. |
| EF40 | Death's Momentum | Base: Lifesteal, +1 ATK. Chaos Attuned: Persist --- when this creature dies, all friendly creatures get +1 ATK this turn. | Lifesteal sustain, board-wide ATK burst on death. PP: Lifesteal(2)+1ATK(1)=3. | Dark energy transferring from the dying to the living. |

### Pool 11: 3 PP, Late Tier, Order-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF41 | Ossuary Parliament | Base: +1 HP, Shield. Order Attuned: Persist --- when this creature dies, summon a 2/2 Spectre token in this slot. | Premium Spectral Echo (2/2) + Shield. PP: 1HP(1)+Shield is 4. Adjust: Base: Shield. Order Attuned: Persist --- when this creature dies, summon a 1/1 Spectre token with Shield in this slot. PP: Shield(3)=3. | Parliament of bone thrones with spectral council members. |
| EF42 | Eternal Binding | Base: +1 HP, -2 instability. Order Attuned: Persist --- when this creature dies, all friendly creatures get +0/+1 permanently. | Double instability reduction + board toughness inheritance. PP: 1HP(1)+-2inst(2)=3. | Chains of soul-light binding creature to mortal plane. |
| EF43 | Phylactery Supreme | Base: Taunt, Ward, +1 HP. Order Attuned: Persist --- when this creature dies, heal all friendly creatures for 2 HP. | Taunt + Ward + healing death trigger. PP: Taunt(1)+Ward(1)+1HP(1)=3. | Massive ornate phylactery pulsing with life-force. |
| EF44 | Lich Lord's Legacy | Base: Persist --- when this creature dies, all friendly creatures get +1/+1 permanently and heal 1 HP. Order Attuned: Shield. | Ultimate defensive Persist. Board-wide stats + heal + Shield. PP: Shield(3)=3 for attuned. | Ancient lich's final spell releasing accumulated power. |

### Pool 12: 3 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect | Persist Synergy | Visual Prompt Fragment |
|---|---|---|---|---|
| EF45 | Catastrophic Death | Base: +2 ATK. Chaos Attuned: Persist --- when this creature dies, deal 3 damage to all enemy creatures and 2 to enemy avatar. +1 instability. | Massive AoE + face death nuke. PP: 2ATK(2)+1inst(1)=3. | Reality cracking as spectral energy detonates outward. |
| EF46 | Wraithstorm | Base: +1 ATK, +1 instability. Chaos Attuned: Persist --- for 3 turns after this creature dies, deal 1 damage to all enemy creatures at start of your turn. | Strongest lingering effect. 3 turns of AoE. PP: 1ATK(1)+1inst(1)+conditional=3. Adjust: Base: +1 ATK. Chaos Attuned: Persist --- for 2 turns after this creature dies, deal 2 damage to all enemy creatures at start of your turn. +1 instability. PP: 1ATK(1)+1inst(1)+conditional. Total base=2 with conditional adding power. Rounding to 3PP. | Permanent spectral storm swirling where the creature fell. |
| EF47 | Death's Chain | Base: +2 ATK, Deathtouch. Chaos Attuned: Persist --- when this creature dies, deal 3 damage to the enemy avatar. | Deathtouch + face burn. PP: 2ATK(2)+Deathtouch(3)=5. Over budget. Adjust: Base: Deathtouch. Chaos Attuned: Persist --- when this creature dies, deal 3 damage to a random enemy creature and 2 to enemy avatar. PP: Deathtouch(3)=3. | Chain of spectral energy reaching for the next victim. |
| EF48 | The Unforgotten | Base: +1 ATK, Lifesteal. Chaos Attuned: Persist --- when this creature dies, summon a copy of it (at half stats, rounded down) in this slot with all its Persist modifiers EXCEPT The Unforgotten. +1 instability. | Self-resurrection at half power (non-recursive). Must be killed twice. PP: 1ATK(1)+Lifesteal(2)=3. | Spectral form reconstituting from scattered soul fragments. |

---

## 8. Rethemed Ironwright Modifiers (IF01-IF48)

48 modifiers rethemed from Victorian steampunk to brutalist space-industrial empire. **Mechanical effects are preserved exactly** --- only names, flavor, and visual prompts change. All modifiers reference the Augment mechanic.

**Retheme vocabulary:**
- NOT: brass, gears, steam, clockwork, Victorian, cog, boiler, piston (steampunk)
- IS: concrete, iron, hydraulics, rebar, void-reactor, orbital, star-forge, gravity-well, hull-plating, void-dock, reactor-core, industrial, modular, fabricated

### Pool 1: 1 PP, Early Tier, Order-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF01 | Hull Reinforcement | Base: +1 HP per Augment modifier on this creature. Order Attuned: +1 HP. | Iron hull plating bolted onto the creature's frame, rebar visible beneath. |
| IF02 | Reactor Shielding | Base: +1 HP. Order Attuned: if this creature has 2+ Augment modifiers, gain Shield this turn. | Reactor-blue energy field flickering around reinforced iron casing. |
| IF03 | Foundry Specification | Base: +1 HP, -1 instability. Order Attuned: +0/+1 per Augment modifier on this creature. | Blueprint-precise geometric modifications, cold iron symmetry. |
| IF04 | Void-Dock Calibration | Base: +1 HP per Augment modifier on this creature. Order Attuned: +0/+1. | Orbital dock calibration arms adjusting the creature's components. |

### Pool 2: 1 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF05 | Overclocked Hydraulics | Base: +1 ATK per Augment modifier on this creature. Chaos Attuned: +1 ATK. | Hydraulic pistons extending beyond safe tolerances, sparking. |
| IF06 | Reactor Surge | Base: +1 ATK. Chaos Attuned: +1 ATK per Augment modifier on this creature. | Reactor-core glowing dangerously bright, containment cracking. |
| IF07 | Scrap Legion Override | Base: +1 ATK, +1 instability. Chaos Attuned: +1 ATK per Augment modifier on this creature. | Jury-rigged override switch bypassing safety protocols. |
| IF08 | Rebar Lance | Base: +1 ATK per Augment modifier on this creature. Chaos Attuned: +1 ATK. | Sharpened rebar extending from the creature's arm as a weapon. |

### Pool 3: 1 PP, Late Tier, Order-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF09 | Modular Plating | Base: +1 HP per Augment modifier on this creature. Order Attuned: if 3+ Augment modifiers, +0/+2. | Interchangeable iron plates with standardized bolt patterns. |
| IF10 | Void-Forge Temper | Base: +1 HP. Order Attuned: +1 HP per Augment modifier. -1 instability. | Void-forged iron with blue-black sheen of space-tempering. |
| IF11 | Gravity-Well Anchor | Base: -1 instability, +1 HP per Augment modifier. Order Attuned: +0/+1. | Heavy gravity-anchor plates pulling toward stability. |
| IF12 | Redundant Systems | Base: Shield. Order Attuned: regenerate Shield at start of turn if 3+ Augment modifiers. | Triple-redundant iron bulkheads with reactor-powered shields. |

### Pool 4: 1 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF13 | Overload Protocol | Base: +1 ATK per Augment modifier. Chaos Attuned: if 3+ Augment modifiers, +2 ATK. | Warning lights flashing as power exceeds rated capacity. |
| IF14 | Scrap Integration | Base: +1 ATK, +1 instability. Chaos Attuned: +1 ATK per Augment modifier. | Alien salvage welded in chaotic patterns. |
| IF15 | Reactor Breach | Base: +1 ATK per Augment modifier, +1 instability. Chaos Attuned: +1 ATK. | Cracked reactor housing leaking dangerous energy. |
| IF16 | Orbital Barrage | Base: +1 ATK per Augment modifier. Chaos Attuned: deal 1 damage to random enemy creature. | Orbital bombardment reticles locking onto targets. |

### Pool 5: 2 PP, Early Tier, Order-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF17 | Iron Bulwark | Base: +1 HP per Augment modifier, +1 HP. Order Attuned: Shield. | Layered iron bulwark with void-dock riveting. |
| IF18 | Directorate Protocol | Base: Taunt, +1 HP per Augment modifier. Order Attuned: +0/+1. | Directorate command override forcing defensive posture. |
| IF19 | Star-Forge Armor | Base: Shield, +1 HP per Augment modifier. Order Attuned: +0/+1. | Star-forge tempered armor with reactor-blue energy seams. |
| IF20 | Containment Array | Base: -1 instability, +1 HP per Augment modifier. Order Attuned: +1 HP. | Mote-containment array with iron lattice dampening chaos. |

### Pool 6: 2 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF21 | Hydraulic Assault | Base: +1 ATK per Augment modifier, +1 ATK. Chaos Attuned: +1 ATK. | Hydraulic assault arms extending with industrial force. |
| IF22 | Void-Reactor Weapon | Base: +2 ATK. Chaos Attuned: +1 ATK per Augment modifier. | Void-reactor powered energy weapon crackling with lightning. |
| IF23 | Salvage Rush | Base: +1 ATK, Haste. Chaos Attuned: +1 ATK per Augment modifier. | Scrap Legion unit charging at full speed from debris field. |
| IF24 | Industrial Overdrive | Base: +1 ATK, +1 instability. Chaos Attuned: +1 ATK per Augment modifier. +1 ATK. | All systems redlining, exhaust vents glowing warning-orange. |

### Pool 7: 2 PP, Late Tier, Order-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF25 | Fortress Architecture | Base: Shield, -1 instability. Order Attuned: Exalt-adjacent: if 3+ Augment modifiers, regenerate Shield next turn if it breaks. | Brutalist fortress geometry with self-repairing walls. |
| IF26 | Star-Forge Bastion | Base: Taunt, +1 HP per Augment modifier. Order Attuned: +0/+2. | Star-forge class defensive construct, maximum hull density. |
| IF27 | Gravity-Well Shield | Base: -1 instability, +1 HP. Order Attuned: +1 HP per Augment modifier. Shield. | Gravity-well generator creating visible distortion barrier. |
| IF28 | Fabrication Cycle | Base: +1 HP per Augment modifier. Order Attuned: heal this creature 1 HP per Augment modifier at start of turn. | Self-fabrication units replacing damaged components each turn. |

### Pool 8: 2 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF29 | Orbital Strike | Base: +1 ATK per Augment modifier, +1 ATK. Chaos Attuned: deal 1 damage per Augment modifier to random enemy creature. | Orbital strike coordinates from Augment sensor data. |
| IF30 | Scrap Typhoon | Base: +2 ATK. Chaos Attuned: +1 ATK per Augment modifier. If 3+ Augments, Piercing this turn. | Whirlwind of sharpened scrap metal orbiting the creature. |
| IF31 | Reactor Meltdown | Base: +1 ATK per Augment modifier, +1 instability. Chaos Attuned: when this creature attacks, deal 1 damage to all enemies. | Reactor containment failing, radiation burning everything. |
| IF32 | Void-Forge Weapon | Base: +2 ATK, +1 instability. Chaos Attuned: +1 ATK per Augment modifier. | Weapon forged in void-space, matter-disrupting edge. |

### Pool 9: 3 PP, Early Tier, Order-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF33 | Iron Dreadnought | Base: Shield, +1 HP per Augment modifier, +1 HP. Order Attuned: +0/+1 per Augment modifier. | Massive iron dreadnought hull plating, triple-layered. |
| IF34 | Directorate Fortress | Base: Taunt, +1 HP per Augment modifier, +1 HP. Order Attuned: Shield. | Directorate fortress-class defensive construct, maximum armor. |
| IF35 | Star-Forge Sentinel | Base: Shield, Ward. Order Attuned: +1 HP per Augment modifier. | Star-forge sentinel with shield emitter and void-hardened plating. |
| IF36 | Fabrication Matrix | Base: +1 HP per Augment modifier, Taunt, +1 ATK. Order Attuned: heal 1 HP per Augment modifier at start of turn. | Self-replicating fabrication matrix rebuilding in real-time. |

### Pool 10: 3 PP, Early Tier, Chaos-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF37 | Void-Breaker Assault | Base: +2 ATK, Haste. Chaos Attuned: +1 ATK per Augment modifier. | Void-breaker assault unit deployed at terminal velocity. |
| IF38 | Reactor Overcharge | Base: +1 ATK per Augment modifier, +2 ATK, +1 instability. Chaos Attuned: deal 2 damage to random enemy. | Reactor output exceeding design limits. |
| IF39 | Orbital Interceptor | Base: Flying, +1 ATK per Augment modifier. Chaos Attuned: +1 ATK. | Orbital interceptor deploying from void-dock at attack speed. |
| IF40 | Scrap Titan | Base: +2 ATK. Chaos Attuned: +1 ATK per Augment modifier (max 3 counted). +1 ATK. | Massive scrap-assembled titan from conquered world metals. |

### Pool 11: 3 PP, Late Tier, Order-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF41 | Failsafe Protocol | Base: when this creature would die, if 4 Augment modifiers, survive with 1 HP (once per game). Order Attuned: also gain Shield. | Emergency failsafe reactor engaging, frame barely holding. |
| IF42 | Star-Forge Supreme | Base: Shield, +1 HP per Augment modifier, +1 ATK. Order Attuned: if Shield breaks, all friendlies get +0/+1 permanently. | Supreme star-forge construct, peak Directorate engineering. |
| IF43 | Gravity Fortress | Base: Taunt, -2 instability, +1 HP per Augment modifier. Order Attuned: +0/+2. | Gravity-fortress class, multiple gravity-well generators. |
| IF44 | Infinite Production | Base: +1 HP per Augment modifier. Order Attuned: at start of turn, if 3+ Augments, all friendlies heal 2 HP and get +0/+1. | Automated production lines repairing all friendly units. |

### Pool 12: 3 PP, Late Tier, Chaos-Attuned

| ID | Name | Effect (unchanged) | Visual Prompt Fragment (rethemed) |
|---|---|---|---|
| IF45 | Planet Cracker | Base: +2 ATK per Augment modifier (max 3 counted). Chaos Attuned: when this attacks, deal 2 damage to all enemies. +1 instability. | Planet-cracking siege weapon, catastrophic power. |
| IF46 | Void-Storm Engine | Base: +1 ATK per Augment modifier, Flying, +1 instability. Chaos Attuned: +2 ATK. | Void-storm engine propelling through enemy lines. |
| IF47 | Total Mobilization | Base: +1 ATK per Augment modifier. Chaos Attuned: all friendlies get +1 ATK per total Augments across all friendlies this turn (cap +4). | Full industrial mobilization, every factory producing. |
| IF48 | Extinction Protocol | Base: +2 ATK, +2 instability. Chaos Attuned: when this attacks, if 4 Augments, destroy the blocking creature before combat damage. | Extinction-class weapon system ending civilizations. |

---

## 9. Celestial Starter Deck

20-card starter deck for the Celestial Crusade. Designed to teach Exalt through play: early creatures establish board presence, mid-game creatures carry Exalt potential, late-game creatures are formation anchors.

### CM Cost Distribution

| CM Cost | Count | Rationale |
|---|---|---|
| 1 | 3 | Cheap bodies to establish early Exalt thresholds |
| 2 | 5 | Core curve --- establish board presence turns 2-3 |
| 3 | 5 | Midrange workhorses --- primary future Exalt carriers |
| 4 | 4 | Power creatures |
| 5 | 2 | Premium threats |
| 6 | 1 | Top-end finisher |
| **Total** | **20** | |

### Card List

| # | Name | CM | ATK | HP | Keywords | Base Instability | PP Check |
|---|---|---|---|---|---|---|---|
| 1 | Acolyte of Light | 1 | 1 | 2 | --- | 1 | 1+2=3 |
| 2 | Crusade Initiate | 1 | 2 | 1 | --- | 3 | 2+1=3 |
| 3 | Herald of Dawn | 1 | 1 | 2 | --- | 1 | 1+2=3 |
| 4 | Radiant Squire | 2 | 1 | 4 | --- | 1 | 1+4=5 |
| 5 | Sanctified Knight | 2 | 2 | 3 | --- | 2 | 2+3=5 |
| 6 | Deliverance Scout | 2 | 3 | 2 | --- | 3 | 3+2=5 |
| 7 | Halo-Bearer | 2 | 1 | 1 | Shield | 1 | 1+1+3=5 |
| 8 | Covenant Warden | 2 | 2 | 3 | --- | 2 | 2+3=5 |
| 9 | Righteous Vanguard | 3 | 2 | 5 | --- | 1 | 2+5=7 |
| 10 | Paladin of the Dawn | 3 | 3 | 4 | --- | 2 | 3+4=7 |
| 11 | Exalted Champion | 3 | 2 | 4 | Taunt | 2 | 2+4+1=7 |
| 12 | Burning Zealot | 3 | 4 | 3 | --- | 3 | 4+3=7 |
| 13 | Seraph's Voice | 3 | 2 | 2 | Shield | 1 | 2+2+3=7 |
| 14 | Crusade Commander | 4 | 3 | 6 | --- | 1 | 3+6=9 |
| 15 | Radiant Justicar | 4 | 4 | 4 | Taunt | 2 | 4+4+1=9 |
| 16 | Wings of Deliverance | 4 | 4 | 3 | Flying | 3 | 4+3+2=9 |
| 17 | Heaven's Sentinel | 4 | 3 | 3 | Shield | 2 | 3+3+3=9 |
| 18 | Archangel Vanguard | 5 | 4 | 4 | Shield | 2 | 4+4+3=11 |
| 19 | Judgment Bringer | 5 | 5 | 4 | Piercing | 3 | 5+4+2=11 |
| 20 | Seraphim Eternal | 6 | 4 | 6 | Shield | 1 | 4+6+3=13 |

### Instability Distribution

| Base Instability | Count | % |
|---|---|---|
| 1 | 8 | 40% |
| 2 | 7 | 35% |
| 3 | 5 | 25% |

Celestial starter leans Order-friendly. With Serevain (-6 avatar) and a full board averaging ~1.8 instability per creature (~9 total), player instability is ~3 --- deep in Order territory. Consistent Order events support Shield regeneration and healing, which sustain the Exalt formation.

---

## 10. Endless Starter Deck

20-card starter deck for The Endless. Designed to teach Persist through play: cheap expendable creatures, mid-game trade pieces, late-game Persist engines.

### CM Cost Distribution

| CM Cost | Count | Rationale |
|---|---|---|
| 1 | 4 | Expendable bodies --- cheap Persist triggers |
| 2 | 5 | Core trade pieces --- good stats for trading |
| 3 | 5 | Midrange Persist carriers |
| 4 | 3 | Power creatures |
| 5 | 2 | Premium threats |
| 6 | 1 | Top-end Persist engine |
| **Total** | **20** | |

### Card List

| # | Name | CM | ATK | HP | Keywords | Base Instability | PP Check |
|---|---|---|---|---|---|---|---|
| 1 | Bone Shard | 1 | 2 | 1 | --- | 3 | 2+1=3 |
| 2 | Wailing Fragment | 1 | 1 | 2 | --- | 1 | 1+2=3 |
| 3 | Dust Revenant | 1 | 2 | 1 | --- | 3 | 2+1=3 |
| 4 | Spectral Wisp | 1 | 1 | 2 | --- | 2 | 1+2=3 |
| 5 | Grave Stalker | 2 | 3 | 2 | --- | 3 | 3+2=5 |
| 6 | Bone Construct | 2 | 2 | 3 | --- | 2 | 2+3=5 |
| 7 | Ghostly Sentinel | 2 | 1 | 2 | Lifesteal | 1 | 1+2+2=5 |
| 8 | Crypt Warden | 2 | 1 | 3 | Taunt | 1 | 1+3+1=5 |
| 9 | Necrotic Mauler | 2 | 3 | 2 | --- | 3 | 3+2=5 |
| 10 | Ossuary Scholar | 3 | 2 | 5 | --- | 1 | 2+5=7 |
| 11 | Flesh Golem | 3 | 3 | 4 | --- | 2 | 3+4=7 |
| 12 | Spectre of Spite | 3 | 4 | 3 | --- | 3 | 4+3=7 |
| 13 | Cabal Enforcer | 3 | 2 | 4 | Taunt | 2 | 2+4+1=7 |
| 14 | Wraithcaller | 3 | 2 | 2 | Deathtouch | 2 | 2+2+3=7 |
| 15 | Abomination | 4 | 5 | 4 | --- | 3 | 5+4=9 |
| 16 | Lich Apprentice | 4 | 3 | 5 | Taunt | 2 | 3+5+1=9 |
| 17 | Phantom Stalker | 4 | 4 | 3 | Flying | 3 | 4+3+2=9 |
| 18 | Undying Colossus | 5 | 4 | 5 | Lifesteal | 2 | 4+5+2=11 |
| 19 | Dread Revenant | 5 | 5 | 3 | Deathtouch | 4 | 5+3+3=11 |
| 20 | Lich Sovereign | 6 | 5 | 5 | Deathtouch | 2 | 5+5+3=13 |

### Instability Distribution

| Base Instability | Count | % |
|---|---|---|
| 1 | 4 | 20% |
| 2 | 8 | 40% |
| 3 | 6 | 30% |
| 4 | 2 | 10% |

Endless starter is more aggressive than Celestial with a moderate Chaos lean. With Vothrak (-3) and a mixed board (~2.4 avg per creature x 5 = ~12), player instability is ~9 --- hybrid territory. With Thessaly (-2) and high-instability creatures, the deck pushes into Chaos for explosive Persist chains.

---

## 11. Balance Analysis

### 11.1 Faction Mechanic Power Assessment

| Faction | Mechanic | Power Ceiling | Power Floor | Consistency | Primary Vulnerability |
|---|---|---|---|---|---|
| Ironwright | Augment | Very High (4-Augment creature is massive) | Low (1 Augment is weak alone) | High (compounds predictably) | 1-for-1 removal wastes all invested Augments |
| Fey Courts | Bond | Very High (5-Bond board is exponential) | Moderate (each creature works alone) | Moderate (depends on board) | Board wipes, targeted removal of Bond nodes |
| Demonic | Corruption | Extremely High (massive burst) | High (even weak Corruption adds ATK) | Low (high variance, self-damage) | Itself (self-damage clock), being outhealed |
| Celestial | Exalt | High (board-wide auras compound) | Low (below threshold = nothing) | Moderate (threshold is binary on/off) | Any removal cascades threshold collapse |
| Endless | Persist | High (death trigger chains) | Low (1 Persist is minor) | High (death is inevitable) | Fast aggro before value accumulates |

### 11.2 Keyword-Faction Affinity Matrix

Strength of each keyword in each faction (1-5 scale, 5 = strongest):

| Keyword | PP | Ironwright | Fey | Demonic | Celestial | Endless |
|---|---|---|---|---|---|---|
| Shield | 3 | 4 (protect investment) | 4 (protect network) | 1 (anti-synergy with clock) | 5 (protect Exalt sources) | 2 (delays Persist) |
| Lifesteal | 2 | 3 (sustain big creatures) | 2 (small creatures) | 5 (offset self-damage) | 3 (formation sustain) | 4 (dual-phase value) |
| Flying | 2 | 2 (evasion for big units) | 2 (bypass blockers) | 4 (face damage fast) | 1 (Exalt wants formation) | 2 (forces kills) |
| Reach | 1 | 2 (defensive answer) | 4 (protect from Flying) | 1 (defense is anti-Corruption) | 4 (protect formation) | 1 (Persist wants proactive deaths) |
| Deathtouch | 3 | 2 (efficient removal) | 2 (efficient removal) | 4 (trade up before burnout) | 1 (anti-Exalt, wants board) | 5 (guarantees Persist trades) |
| Taunt | 1 | 4 (protect Augment) | 4 (protect Bond) | 1 (don't want to block) | 5 (protect Exalt sources) | 4 (force opponent to kill) |
| Piercing | 2 | 2 (face pressure) | 2 (through blockers) | 5 (every overkill counts) | 2 (Exalt ATK helps) | 3 (damage while alive) |
| Haste | 1 | 2 (immediate Augment) | 2 (immediate Bond) | 4 (race advantage) | 3 (immediate Exalt + attack) | 5 (attack then Persist) |
| Ward | 1 | 3 (protect turn 1) | 2 (protect Bond piece) | 1 (wants interaction) | 4 (protect Exalt source) | 1 (Persist wants targeting) |

### 11.3 Five-Faction Matchup Matrix

| | Ironwright | Fey | Demonic | Celestial | Endless |
|---|---|---|---|---|---|
| **Ironwright** | Mirror | Favorable | Even | Favorable | Unfavorable |
| **Fey** | Unfavorable | Mirror | Favorable | Even | Even |
| **Demonic** | Even | Unfavorable | Mirror | Favorable | Unfavorable |
| **Celestial** | Unfavorable | Even | Unfavorable | Mirror | Favorable |
| **Endless** | Favorable | Even | Favorable | Unfavorable | Mirror |

**Matchup reasoning:**

- **Ironwright > Fey**: 1-for-1 removal dismantles Bond networks. Each kill weakens Bond without weakening Augment stacks.
- **Ironwright > Celestial**: Targeted removal collapses Exalt thresholds. Augment creatures fight above curve individually.
- **Fey > Demonic**: Wide board survives Corruption better. If Fey stabilizes, Demonic burns out.
- **Demonic > Celestial**: Burst damage kills Celestial creatures, collapsing Exalt before formation assembles.
- **Endless > Ironwright**: Persist punishes every kill. Ironwright's heavily invested creatures trigger massive Persist chains.
- **Endless > Demonic**: Demonic self-damage does half the work. Persist stacks against a weakening opponent.
- **Celestial > Endless**: Shield absorbs Persist damage. Exalt healing outheals Persist chip.

**Win/Loss summary (non-mirror):**
- Ironwright: 2 wins, 1 loss, 1 even
- Fey: 1 win, 1 loss, 2 even
- Demonic: 1 win, 2 losses, 1 even
- Celestial: 1 win, 2 losses, 1 even
- Endless: 2 wins, 1 loss, 1 even

No faction has more than 2 favorable matchups. The Endless appears marginally strongest but is hard-countered by Celestial, which is kept in check by Ironwright and Demonic. The meta should self-correct: if Endless dominates, Celestial rises; if Celestial rises, Ironwright and Demonic prey on it; if aggro rises, Fey and Ironwright stabilize.

### 11.4 Potentially Broken Combinations

**1. Persist + Deathtouch (Endless)** --- Risk: HIGH

Deathtouch guarantees trades. Persist fires on death. Opponent faces lose-lose: block and eat Persist + lose a creature, or don't block and take face damage.

*Counterplay:* Shield absorbs Deathtouch. Flying bypasses. Spells remove without combat. Deathtouch costs 3 PP, reducing the creature's stats significantly.

*Verdict:* Watchlist. Intentionally strong. If testing shows dominance, increase Deathtouch PP to 4 or add "Persist effects deal 1 less if the creature had Deathtouch."

**2. Exalt 5 + Piercing Board (Celestial)** --- Risk: MODERATE

CF47 gives all 5 creatures +2/+2 and Piercing on Chaos turns at Exalt 5. Requires Legendary creature + full board + Chaos turn (unlikely for Order-leaning Celestial).

*Verdict:* Acceptable. Self-balancing through extreme setup cost.

**3. EF48 Self-Resurrection** --- Risk: HIGH (FIXED)

Originally could create infinite loop. Fixed: "summon a copy with all Persist modifiers EXCEPT The Unforgotten." Copy dies once, triggers other Persist effects, but does not self-resurrect again.

*Verdict:* Fixed. Non-recursive clause required.

**4. Stacked Lingering Effects** --- Risk: MODERATE

Multiple Endless deaths could stack 3 lingering effects (cap) for sustained AoE. Maximum: 3 effects x 2 damage = 6 AoE per turn.

*Verdict:* Acceptable. Cap prevents degeneracy. Requires 3 Legendary deaths with the right modifier.

**5. Haste + Corruption (Demonic)** --- Risk: MODERATE

Haste accelerates Demonic's already-fast game plan. Could push average game length dangerously low.

*Verdict:* Monitor. If average Demonic games drop below 6 turns, increase Haste PP to 2 for Demonic modifiers.

### 11.5 Summoning Sickness Impact

The introduction of summoning sickness (new default rule enabling Haste) changes game tempo:

| Faction | Impact | Assessment |
|---|---|---|
| Ironwright | Moderate positive | Augment creatures survive an extra turn to stack |
| Fey Courts | Strong positive | Bond networks get an extra turn to build |
| Demonic | Moderate negative | Corruption race slowed. Leans harder into Haste. |
| Celestial | Strong positive | Exalt formation has extra turn to assemble |
| Endless | Moderate negative | First combat delayed. Will prioritize Haste. |

**Overall:** Summoning sickness slightly slows the game and rewards board-building (Celestial, Fey) over aggro (Demonic, Endless). Haste exists as the pressure valve for aggressive factions.

### 11.6 Cross-Faction Balance Levers

If any faction proves dominant or underperforming in testing, these are the primary tuning knobs:

| Lever | Effect |
|---|---|
| Exalt threshold numbers (2/3/4/5) | Lower = easier to activate, more consistent. Higher = harder, more reward. |
| Persist damage numbers | Higher = more punishing kills. Lower = less attrition pressure. |
| Lingering effect cap (currently 3) | Higher = more sustained damage. Lower = less grind. |
| Spectral Echo token stats (currently 1/1) | Higher = more board presence after death. Lower = less replacement value. |
| Haste PP cost (currently 1) | Higher = less aggro access. Could be faction-specific. |
| Ward PP cost (currently 1) | Higher = less deployment protection. |
| Summoning sickness duration | Currently 1 turn. Could reduce to "until next main phase" for faster games. |

---

*Last updated: 2026-02-18*
*Status: Complete. All mechanical systems defined for faction expansion. 144 faction modifiers authored (48 Celestial, 48 Endless, 48 rethemed Ironwright). 2 starter decks designed with PP validation. Balance analysis complete with 5 watchlist items and 7 tuning levers. Summoning sickness rule change documented.*

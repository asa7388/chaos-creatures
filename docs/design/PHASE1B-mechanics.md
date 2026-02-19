# PHASE1B — Mechanics Design: Faction Expansion

Working document for the faction expansion mechanical design. Will be incorporated into 01-battle-mechanics.md and 02-card-data-model.md in Phase 2.

---

## Revision Log

| Date | Change | Section(s) |
|---|---|---|
| 2026-02-18 | Initial creation. Full mechanical design for Exalt, Persist, Haste, Ward, 9x9 keyword matrix, 144 faction modifiers, Ironwright retheme, starter decks, balance analysis. | All |

---

## Table of Contents

1. [Exalt Mechanic (Celestial Crusade)](#1-exalt-mechanic)
2. [Celestial Faction Modifiers (CF01-CF48)](#2-celestial-faction-modifiers)
3. [Persist Mechanic (The Endless)](#3-persist-mechanic)
4. [Endless Faction Modifiers (EF01-EF48)](#4-endless-faction-modifiers)
5. [Ironwright Modifier Retheme (IF01-IF48)](#5-ironwright-modifier-retheme)
6. [Haste Keyword](#6-haste-keyword)
7. [Ward Keyword](#7-ward-keyword)
8. [Full 9x9 Keyword Interaction Matrix](#8-keyword-interaction-matrix)
9. [Celestial Starter Deck](#9-celestial-starter-deck)
10. [Endless Starter Deck](#10-endless-starter-deck)
11. [Balance Analysis: 5 Mechanics x 9 Keywords](#11-balance-analysis)

---

## 1. Exalt Mechanic

### Overview

**Exalt** is the exclusive mechanic of the Celestial Crusade faction. Exalt modifiers provide aura effects that benefit the controlling player's board when specific board conditions are met. The Celestial player wins by building a wide, stable formation where every creature empowers every other creature through divine mandate.

### Core Rules

1. **Exalt effects are conditional auras.** Each Exalt modifier has a threshold condition (e.g., "while you control 3+ creatures") and an aura effect that applies when the condition is met.

2. **Exalt auras affect ALL friendly creatures** (including the source creature), unless the modifier text specifies otherwise. This is distinct from Bond (Fey), which often references adjacent creatures or other Bond-holders specifically. Exalt is about divine commandment -- all are uplifted.

3. **Exalt thresholds are creature-count based.** The primary trigger is the number of friendly creatures on the board. Early-tier Exalt modifiers use low thresholds (2+ creatures). Late-tier Exalt modifiers use high thresholds (3+ or 4+ creatures) for stronger effects.

4. **Exalt auras are NOT cumulative by default.** If two creatures both have "Exalt: while you control 3+ creatures, all friendly creatures get +1 ATK," each creature gets +2 ATK total (one from each source). The auras stack from different sources but a single source only applies its effect once.

5. **Exalt collapses when the threshold is not met.** If a board wipe or targeted removal drops the creature count below the threshold, the aura deactivates immediately. This is the core weakness -- Exalt is powerful when the board is wide but fragile to removal.

6. **Exalt interacts with the Chaos Roll system through attunement:**
   - **Order-attuned Exalt modifiers** lean defensive: HP auras, Shield propagation, healing auras. These reward building and holding a stable formation.
   - **Chaos-attuned Exalt modifiers** lean offensive: ATK auras, damage-dealing auras, keyword sharing. These reward pushing aggression with a full board.

### Exalt Threshold Tiers

| Threshold | Difficulty | Typical Power | Design Notes |
|---|---|---|---|
| 2+ creatures | Easy | Low | Early-tier modifiers. Met with just 2 creatures on board. Modest bonuses. |
| 3+ creatures | Medium | Moderate | Core Exalt threshold. Requires committing 3+ board slots. |
| 4+ creatures | Hard | High | Late-tier modifiers. Almost-full board required. Powerful but fragile. |
| Full board (5) | Very Hard | Very High | Rare, Legendary-tier effects only. Maximum investment, maximum reward. |

### Exalt vs. Other Mechanics

| Matchup | Dynamic |
|---|---|
| Exalt vs. Augment (Ironwright) | Wide board vs. tall stack. Exalt wants many creatures; Augment wants one super-creature. Board wipes hurt Exalt more. Targeted removal hurts Augment more. |
| Exalt vs. Bond (Fey) | Both are board-centric, but Exalt auras are global (all creatures) while Bond effects are network-specific (creatures with Bond modifiers). Exalt is simpler but less resilient to partial removal. |
| Exalt vs. Corruption (Demonic) | Formation vs. burn. Demonic aggro can shatter the Celestial formation before it stabilizes. But if Celestial stabilizes with Shield auras and healing, Demonic burns out. |
| Exalt vs. Persist (Endless) | Formation vs. attrition. Endless wants to trade and get death triggers; Celestial wants to avoid losing creatures. Celestial's Shield auras and HP buffs resist Persist's death-based value. But if Endless can force enough trades, the Exalt formation collapses and Persist triggers fire. |

### Weakness Profile

- **Board wipes** collapse all auras simultaneously. A single "deal damage to all" effect can cascade -- killing one creature drops below threshold, removing the aura, causing other creatures to lose HP buffs and potentially die too.
- **Targeted removal of high-value Exalt sources.** If the creature providing the best aura is killed, the entire board weakens.
- **Low individual creature power.** Celestial creatures are slightly below-curve individually (paying for the aura potential). A Celestial creature alone on the board with an Exalt modifier has a dead modifier.
- **Slow startup.** Exalt needs 2-3 creatures on board before any aura activates. Aggro decks can punish the setup phase.

---

## 2. Celestial Faction Modifiers (CF01-CF48)

### Pool Structure Reference

12 pools: 3 PP budgets (1, 2, 3) x 2 tier brackets (Early, Late) x 2 attunements (Order, Chaos).
4 modifiers per pool = 48 total.

### Pool 1: 1 PP, Early Tier, Order-Attuned (CF01-CF04)

**CF01 — Blessed Vigil**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: +1 HP while you control 2+ creatures (Exalt). Attuned bonus: +1 HP to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Golden filigree armor plates with soft divine glow at the joints

**CF02 — Watchful Grace**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: -1 instability. Exalt aura: while you control 2+ creatures, this creature has +1 HP. Attuned bonus: heal this creature 1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Luminous eyes radiating pale golden light, a halo of tiny orbiting motes

**CF03 — Crusader's Oath**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: while you control 2+ creatures, all friendly creatures get +0/+1 (Exalt aura). Attuned bonus: this creature gains Reach this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Inscribed oath-marks glowing on pauldrons in celestial script

**CF04 — Pilgrim's Resolve**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: +1 HP. Exalt condition: while you control 3+ creatures, this creature also gets +1 ATK. Attuned bonus: none (strong base covers budget).
- **Instability adjustment**: 0
- **Visual prompt**: Simple iron-and-gold staff humming with restrained divine energy

### Pool 2: 1 PP, Early Tier, Chaos-Attuned (CF05-CF08)

**CF05 — Righteous Fury**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 ATK while you control 2+ creatures (Exalt). Attuned bonus: +1 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Flaming blade wreathed in divine fire, sparks of gold

**CF06 — Zealot's Brand**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 instability. Exalt aura: while you control 2+ creatures, all friendly creatures get +1 ATK. Attuned bonus: +1 ATK to this creature.
- **Instability adjustment**: +1
- **Visual prompt**: Branded celestial sigil seared into the creature's forehead, pulsing red-gold

**CF07 — Smiting Presence**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: while you control 2+ creatures, this creature gets +1 ATK (Exalt). Attuned bonus: deal 1 damage to a random enemy creature.
- **Instability adjustment**: 0
- **Visual prompt**: Radiant corona of holy fire expanding outward from the creature

**CF08 — Wrath of the Chosen**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 ATK. Exalt condition: while you control 3+ creatures, this creature also has Piercing. Attuned bonus: none (Piercing grant is high value for 1PP).
- **Instability adjustment**: 0
- **Visual prompt**: Celestial lance tip glowing with penetrating white-gold energy

### Pool 3: 2 PP, Early Tier, Order-Attuned (CF09-CF12)

**CF09 — Divine Aegis**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: Exalt aura -- while you control 3+ creatures, all friendly creatures get +0/+1. Attuned bonus: grant Shield to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Translucent golden dome of divine light sheltering the formation

**CF10 — Consecrated Ground**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: +1 HP. Exalt aura: while you control 2+ creatures, all friendly creatures heal 1 HP at start of your turn. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Ground beneath the creature radiating warm golden light in expanding rings

**CF11 — Sanctified Armor**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: -1 instability, +1 HP. Exalt condition: while you control 3+ creatures, this creature gets +1 ATK. Attuned bonus: +1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Ivory-and-gold plate armor engraved with protective wards

**CF12 — Heaven's Bulwark**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: Exalt aura -- while you control 2+ creatures, this creature and adjacent creatures get +0/+1. Attuned bonus: this creature gains Taunt this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Massive tower shield inscribed with celestial commandments, radiating protective force

### Pool 4: 2 PP, Early Tier, Chaos-Attuned (CF13-CF16)

**CF13 — Holy Judgment**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: Exalt aura -- while you control 3+ creatures, all friendly creatures get +1/+0. Attuned bonus: +1 ATK to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Burning golden eyes casting judgment-light on all enemies

**CF14 — Crusade Banner**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +1 ATK, +1 HP. Exalt condition: while you control 2+ creatures, all friendly creatures get +1 ATK. Attuned bonus: none (strong base + aura).
- **Instability adjustment**: 0
- **Visual prompt**: Holy battle standard streaming divine fire, inspiring nearby warriors

**CF15 — Divine Wrath**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +1 instability, +1 ATK. Exalt aura: while you control 3+ creatures, all friendly creatures get +1 ATK. Attuned bonus: +1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Multiple wings unfurling wreathed in righteous flame

**CF16 — Celestial Charge**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: Exalt -- while you control 2+ creatures, this creature gets +2 ATK. Attuned bonus: this creature gains Piercing this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Divine lance couched for a charge, trailing golden contrail

### Pool 5: 3 PP, Early Tier, Order-Attuned (CF17-CF20)

**CF17 — Archangel's Mantle**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: Shield. Exalt aura: while you control 3+ creatures, all friendly creatures get +0/+1. Attuned bonus: regenerate Shield at start of turn.
- **Instability adjustment**: 0
- **Visual prompt**: Wings of pure light forming a protective canopy over the entire formation

**CF18 — Radiant Sanctuary**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: -1 instability, +2 HP. Exalt aura: while you control 2+ creatures, all friendly creatures heal 1 HP at start of turn. Attuned bonus: +1 HP to all friendly creatures.
- **Instability adjustment**: -1
- **Visual prompt**: Cathedral-like energy structure forming around the creature, stained-glass light

**CF19 — Divine Proclamation**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: +1 ATK, +1 HP. Exalt aura: while you control 3+ creatures, all friendly creatures get +1/+1. Attuned bonus: none (powerful aura covers budget).
- **Instability adjustment**: 0
- **Visual prompt**: Scroll of divine decree unfurling, letters burning with holy authority

**CF20 — Bastion of Faith**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: Shield, +1 HP. Exalt condition: while you control 4+ creatures, all friendly creatures gain Shield. Attuned bonus: +0/+1 to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Fortress-like divine construct materializing around the creature, battlements of light

### Pool 6: 3 PP, Early Tier, Chaos-Attuned (CF21-CF24)

**CF21 — Seraphic Assault**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +2 ATK. Exalt aura: while you control 3+ creatures, all friendly creatures get +1 ATK. Attuned bonus: +1 ATK to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Six-winged seraph-form wreathed in holy fire, each wing tipped with a blade

**CF22 — Celestial Condemnation**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +1 instability, +1 ATK, +1 HP. Exalt aura: while you control 3+ creatures, all friendly creatures get +1 ATK. Attuned bonus: deal 1 damage to all enemy creatures.
- **Instability adjustment**: +1
- **Visual prompt**: Pillars of holy fire descending from above to strike at the unworthy

**CF23 — War of the Righteous**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +1 ATK. Exalt aura: while you control 2+ creatures, all friendly creatures get +1 ATK and Piercing. Attuned bonus: none (Piercing aura is very high value).
- **Instability adjustment**: 0
- **Visual prompt**: Holy weapons manifesting in the hands of all nearby allies, glowing gold

**CF24 — Blazing Crusade**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +2 ATK, +1 HP. Exalt condition: while you control 4+ creatures, deal 2 damage to the enemy avatar at start of your turn. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Divine fire erupting from the ground in a line, burning a path toward the enemy

### Pool 7: 1 PP, Late Tier, Order-Attuned (CF25-CF28)

**CF25 — Eternal Vigil**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: while you control 2+ creatures, all friendly creatures get +0/+1 (Exalt aura). Attuned bonus: if this creature has Shield, +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Angelic sentinel standing guard with immovable divine authority

**CF26 — Martyr's Blessing**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: -1 instability. Exalt condition: when a friendly creature dies while you control 3+ creatures, heal your avatar 2 HP. Attuned bonus: +1 HP to this creature.
- **Instability adjustment**: -1
- **Visual prompt**: Gentle golden light rising from fallen allies, absorbed by the surviving formation

**CF27 — Radiant Persistence**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: Exalt aura -- while you control 3+ creatures, all friendly creatures get +0/+1. Attuned bonus: this creature gains Ward this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Persistent halo of golden motes orbiting the entire formation

**CF28 — Celestial Anchor**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: +1 HP. Exalt condition: while you control 2+ creatures, this creature and one random friendly creature gain Reach. Attuned bonus: none.
- **Instability adjustment**: 0
- **Visual prompt**: Chains of divine light tethering the creature to the battlefield, immovable

### Pool 8: 1 PP, Late Tier, Chaos-Attuned (CF29-CF32)

**CF29 — Burning Conviction**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 ATK while you control 2+ creatures (Exalt). Attuned bonus: deal 1 damage to the enemy creature with the lowest HP.
- **Instability adjustment**: 0
- **Visual prompt**: Flames of righteous anger flickering along the creature's weapons

**CF30 — Zealot's Frenzy**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 instability. Exalt condition: while you control 3+ creatures, this creature gets +2 ATK. Attuned bonus: +1 ATK this turn. Order penalty: -1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Wild-eyed zealot energy, divine fire replacing rational thought

**CF31 — Rapture Strike**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: Exalt aura -- while you control 2+ creatures, all friendly creatures get +1 ATK. Attuned bonus: this creature gains Haste (relevant for newly played creatures with this modifier from a prior evolution).
- **Instability adjustment**: 0
- **Visual prompt**: Sudden burst of transcendent speed, afterimage trailing divine light

**CF32 — Scourge of the Faithless**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 ATK. Exalt condition: while you control 4+ creatures, deal 1 damage to all enemy creatures at start of your turn. Attuned bonus: none (recurring AoE is powerful).
- **Instability adjustment**: 0
- **Visual prompt**: Divine radiance so bright it burns the unholy, light as a weapon

### Pool 9: 2 PP, Late Tier, Order-Attuned (CF33-CF36)

**CF33 — Throne of Grace**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: Exalt aura -- while you control 3+ creatures, all friendly creatures get +0/+1 and heal 1 HP at start of your turn. Attuned bonus: this creature gains Shield.
- **Instability adjustment**: 0
- **Visual prompt**: Ethereal throne of golden light manifesting behind the creature

**CF34 — Absolution**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: -1 instability, +1 HP. Exalt condition: while you control 3+ creatures, when a friendly creature dies, give all surviving friendly creatures +0/+2 permanently. Attuned bonus: +1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Circle of absolution on the ground, golden runes activating upon sacrifice

**CF35 — Heaven's Mandate**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: Exalt aura -- while you control 2+ creatures, all friendly creatures get +1/+1. Attuned bonus: draw 1 card. Order penalty on opposite: none.
- **Instability adjustment**: 0
- **Visual prompt**: Divine decree written across the sky in burning celestial script

**CF36 — Shield of the Faithful**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: Shield. Exalt condition: while you control 3+ creatures with Shield, all friendly creatures get +0/+2. Attuned bonus: regenerate Shield at start of turn if 3+ creatures on board.
- **Instability adjustment**: 0
- **Visual prompt**: Interlocking shield-barriers of holy light connecting all friendly creatures

### Pool 10: 2 PP, Late Tier, Chaos-Attuned (CF37-CF40)

**CF37 — Divine Retribution**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: Exalt aura -- while you control 3+ creatures, all friendly creatures get +1 ATK. Attuned bonus: deal 2 damage to a random enemy creature.
- **Instability adjustment**: 0
- **Visual prompt**: Spears of golden light striking down from above upon the enemy

**CF38 — Wrath Incarnate**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +1 instability, +2 ATK. Exalt condition: while you control 3+ creatures, this creature gains Piercing. Attuned bonus: +1 ATK. Order penalty: -1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Creature transformed into an avatar of divine wrath, eyes and hands burning gold

**CF39 — Crusader's Fervor**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: Exalt aura -- while you control 4+ creatures, all friendly creatures get +2 ATK. Attuned bonus: none (powerful aura at high threshold).
- **Instability adjustment**: 0
- **Visual prompt**: Battle frenzy of holy purpose, each warrior empowered by the group's devotion

**CF40 — Smite the Wicked**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +1 ATK, +1 HP. Exalt condition: while you control 3+ creatures, when this creature attacks, deal 1 damage to all enemy creatures. Attuned bonus: +1 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Shockwave of divine energy radiating from every sword strike

### Pool 11: 3 PP, Late Tier, Order-Attuned (CF41-CF44)

**CF41 — Ascension Protocol**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: Shield, +1 HP. Exalt aura: while you control 3+ creatures, all friendly creatures get +1/+1 and gain Ward for 1 turn after deployment. Attuned bonus: +0/+2 to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Ascending spiral of pure light, creature lifting partially off the ground in divine transcendence

**CF42 — Covenant of the Undying**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: -2 instability, +2 HP. Exalt condition: while you control 4+ creatures, the first friendly creature that would die each turn instead survives with 1 HP. Attuned bonus: +1 HP to all friendly creatures.
- **Instability adjustment**: -2
- **Visual prompt**: Binding covenant runes connecting all creatures in golden chains of mutual protection

**CF43 — Paradise Restored**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: +1 ATK, +2 HP. Exalt aura: while you control 3+ creatures, all friendly creatures heal 2 HP at start of your turn. Attuned bonus: all friendly creatures gain Shield (once per game).
- **Instability adjustment**: 0
- **Visual prompt**: Garden of divine light blooming around the formation, golden flowers of pure energy

**CF44 — Eternal Formation**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: Shield, Taunt. Exalt condition: while you control 4+ creatures, this creature has +3 HP and all Exalt aura effects on your board are doubled. Attuned bonus: regenerate Shield.
- **Instability adjustment**: 0
- **Visual prompt**: The creature becomes the keystone of an architectural divine construct, all allies connected through it

### Pool 12: 3 PP, Late Tier, Chaos-Attuned (CF45-CF48)

**CF45 — Armageddon Crusade**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 ATK, +1 HP. Exalt aura: while you control 3+ creatures, all friendly creatures get +2 ATK. Attuned bonus: deal 1 damage to all enemy creatures. Order penalty: -1 ATK to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Apocalyptic divine army manifesting behind the creature, holy war at its peak

**CF46 — Judgment Day**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 instability, +3 ATK. Exalt condition: while you control 4+ creatures, deal 3 damage to the enemy avatar at start of your turn. Attuned bonus: +2 ATK this turn. Order penalty: -2 ATK.
- **Instability adjustment**: +2
- **Visual prompt**: The sky splitting open to reveal a blinding divine tribunal, fire raining down

**CF47 — Final Crusade**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +1 ATK. Exalt aura: while you control 3+ creatures, all friendly creatures get +1 ATK and Piercing. Attuned bonus: +2 ATK to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Holy weapons in every hand, divine fire on every blade, unstoppable crusading force

**CF48 — Celestial Purge**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 ATK. Exalt condition: while you control 5 creatures (full board), all friendly creatures get +3 ATK and Piercing. Attuned bonus: deal 2 damage to all enemy creatures. Order penalty: this creature takes 2 damage.
- **Instability adjustment**: 0
- **Visual prompt**: Purifying holy fire consuming everything, the boundary between divine and mortal dissolving

---

## 3. Persist Mechanic

### Overview

**Persist** is the exclusive mechanic of The Endless faction. Persist modifiers trigger effects when creatures die or create lingering effects that continue after death. The Endless player wins through attrition -- every creature that dies (on either side) generates value. Trading is not just acceptable, it is the strategy.

### Core Rules

1. **Persist effects trigger on death.** The primary trigger is ON_DEATH -- when the creature carrying the Persist modifier is destroyed. This includes death from combat damage, spell damage, Chaos events, and any other source.

2. **Persist lingering effects persist after death.** Some Persist modifiers create a lasting effect that remains active for a number of turns after the creature dies. These are tracked as board-level effects, not creature-level effects.

3. **Persist effects can trigger from ANY death.** Late-tier Persist modifiers can trigger when other friendly creatures die (not just the carrier). This makes board wipes actively dangerous for the opponent -- killing 3 Endless creatures might trigger 3+ death effects.

4. **Persist effects cannot trigger more than once per creature per death.** A creature with 3 Persist modifiers that dies triggers all 3 death effects, but each modifier fires exactly once. No recursion loops.

5. **Persist does NOT bring creatures back.** Persist is about death consequences, not resurrection. Creatures that die stay dead. The value comes from the effects they leave behind, not from cheating death.

6. **Persist interacts with the Chaos Roll system through attunement:**
   - **Order-attuned Persist modifiers** lean toward sustain and board preservation: healing allies on death, buffing survivors, creating lingering defensive effects.
   - **Chaos-attuned Persist modifiers** lean toward aggression and punishment: dealing damage on death, debuffing enemies, creating lingering offensive effects.

### Persist Effect Categories

| Category | Description | Examples |
|---|---|---|
| Death Trigger (damage) | Deal damage when this creature dies | "On death: deal 2 damage to a random enemy creature" |
| Death Trigger (buff) | Buff allies when this creature dies | "On death: all friendly creatures get +1/+1 permanently" |
| Death Trigger (resource) | Generate resources on death | "On death: draw 1 card" or "On death: gain 1 chaos mote" |
| Lingering Effect | Create a board-level effect that lasts N turns after death | "On death: for 2 turns, all friendly creatures deal +1 damage" |
| Death Sympathy | Trigger when ANY friendly creature dies | "When a friendly creature dies: this creature gets +1 ATK permanently" |
| Retaliation | Punish the opponent for killing | "On death: deal this creature's ATK as damage to the creature that killed it" |

### Persist vs. Other Mechanics

| Matchup | Dynamic |
|---|---|
| Persist vs. Augment (Ironwright) | Attrition vs. investment. Augment stacks value on one creature that Persist wants to kill. But Persist's on-death value means even if Augment trades efficiently, the Endless player gets compensated. Augment's weakness to 1-for-1 removal is Persist's strength. |
| Persist vs. Bond (Fey) | Death triggers vs. board network. Fey wants to keep creatures alive for Bond; Endless profits from death. Forcing trades is key for Endless. If Fey can avoid trading (using Taunt and Shield to protect the network), Persist modifiers sit unused. |
| Persist vs. Corruption (Demonic) | Both factions thrive on creature death but from different angles. Demonic kills its own creatures for burst; Endless profits from all death. This matchup creates explosive, volatile games where creatures die constantly and both players generate value from it. |
| Persist vs. Exalt (Celestial) | Attrition vs. formation. Celestial wants a wide board; Endless wants to pick it apart. Every creature Endless kills weakens the Exalt auras AND triggers Persist effects. But Celestial's Shield auras and HP buffs make it hard to force trades. |

### Weakness Profile

- **Fast aggro that goes face.** If the opponent ignores the Endless player's creatures and just attacks the avatar, Persist modifiers never trigger (the creatures don't die). Endless needs the opponent to interact with its board.
- **Effects that prevent death triggers.** Silence effects, exile effects, or "prevent death trigger" effects (if added in future) shut down Persist entirely.
- **Shield.** Shield prevents the Endless player's creatures from trading in combat. A shielded creature absorbs a Deathtouch hit without dying, wasting the Persist setup.
- **Slow buildup.** Persist modifiers do nothing while the creature is alive. The value is back-loaded into the death moment. If the game ends before creatures die, Persist was dead weight.

---

## 4. Endless Faction Modifiers (EF01-EF48)

### Pool 1: 1 PP, Early Tier, Order-Attuned (EF01-EF04)

**EF01 — Parting Gift**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: +1 HP. Persist: on death, heal a random friendly creature for 2 HP. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Ghostly hands reaching out to mend the wounds of allies as the creature fades

**EF02 — Spectral Residue**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: -1 instability. Persist: on death, give a random friendly creature +0/+1 permanently. Attuned bonus: +1 HP to this creature.
- **Instability adjustment**: -1
- **Visual prompt**: Translucent ectoplasmic mist clinging to nearby allies, strengthening them

**EF03 — Undying Will**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: +1 HP. Persist: on death, give all friendly creatures +0/+1 this turn. Attuned bonus: heal your avatar 1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Ethereal determination solidifying into protective light around allies

**EF04 — Grave Tribute**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: Persist -- on death, draw 1 card. Attuned bonus: +1 HP to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Ancient burial coins manifesting around the creature, payment for passage

### Pool 2: 1 PP, Early Tier, Chaos-Attuned (EF05-EF08)

**EF05 — Death Rattle**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 ATK. Persist: on death, deal 1 damage to a random enemy creature. Attuned bonus: +1 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Bone shards exploding outward from the creature upon destruction

**EF06 — Necrotic Burst**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 instability. Persist: on death, deal 2 damage to a random enemy creature. Attuned bonus: +1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Sickly green energy detonating upon the creature's demise

**EF07 — Vengeful Spirit**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 ATK. Persist: on death, deal 1 damage to the enemy avatar. Attuned bonus: deal 1 additional damage to the enemy avatar on death.
- **Instability adjustment**: 0
- **Visual prompt**: Wrathful ghost tearing free from the fallen body, screaming toward the enemy

**EF08 — Cursed Touch**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: Persist -- on death, give a random enemy creature -1 ATK permanently. Attuned bonus: +1 ATK to this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Withering curse spreading from the creature's dying grasp

### Pool 3: 2 PP, Early Tier, Order-Attuned (EF09-EF12)

**EF09 — Soul Shepherd**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: +1 HP. Persist sympathy: when any friendly creature dies, this creature gets +0/+1 permanently. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Ghostly flock of spirits orbiting the creature, each a fallen ally's echo

**EF10 — Memento Mori**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: -1 instability, +1 HP. Persist: on death, heal all friendly creatures for 2 HP. Attuned bonus: +1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Skull talisman radiating calm, accepting light -- death as peace

**EF11 — Ancestral Shield**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: +1 HP. Persist: on death, grant Shield to the friendly creature with the lowest HP. Attuned bonus: this creature gains Shield.
- **Instability adjustment**: 0
- **Visual prompt**: Spectral shields of fallen ancestors materializing around the weakest ally

**EF12 — Last Rites**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: Persist -- on death, give all friendly creatures +0/+2 permanently. Attuned bonus: draw 1 card on death.
- **Instability adjustment**: 0
- **Visual prompt**: Ritual circle activating upon the creature's death, empowering survivors with ancient rites

### Pool 4: 2 PP, Early Tier, Chaos-Attuned (EF13-EF16)

**EF13 — Grave Eruption**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +1 ATK. Persist: on death, deal 2 damage to all enemy creatures. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Ground splitting open beneath the fallen creature, necrotic energy erupting upward

**EF14 — Corpse Detonation**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +1 instability, +1 ATK, +1 HP. Persist: on death, deal damage equal to this creature's ATK to a random enemy creature. Attuned bonus: +1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Volatile necrotic energy building in the creature's core, primed to detonate

**EF15 — Draining Demise**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +1 ATK. Persist: on death, deal 2 damage to the enemy avatar. Attuned bonus: Lifesteal on this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Life-draining tendrils reaching toward the enemy, darkening as the creature fades

**EF16 — Blight Carrier**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +2 ATK. Persist: on death, give all enemy creatures -1 ATK permanently. Attuned bonus: none (powerful debuff aura).
- **Instability adjustment**: 0
- **Visual prompt**: Plague-bearing entity leaving a trail of decay, corruption spreading on contact

### Pool 5: 3 PP, Early Tier, Order-Attuned (EF17-EF20)

**EF17 — Requiem**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: Shield, +1 HP. Persist: on death, all friendly creatures gain Shield and +0/+1 permanently. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Mournful hymn manifesting as visible sound waves of pale protective light

**EF18 — Phylactery Binding**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: -1 instability, +2 HP. Persist sympathy: when any friendly creature dies, this creature gets +1/+1 permanently. Attuned bonus: +1 HP, heal this creature 1 HP at start of turn.
- **Instability adjustment**: -1
- **Visual prompt**: Glowing phylactery embedded in the creature's chest, pulsing with absorbed souls

**EF19 — Tomb Warden**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: +1 ATK, +1 HP, Taunt. Persist: on death, give the friendly creature with the highest ATK +2/+2 permanently. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Ancient armored guardian standing before a crypt, bones fused with stone

**EF20 — Deathless Devotion**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: +2 HP. Persist: on death, heal your avatar for 5 HP and all friendly creatures for 2 HP. Attuned bonus: draw 1 card on death.
- **Instability adjustment**: 0
- **Visual prompt**: Radiant ghost ascending upon death, showering healing light down upon allies

### Pool 6: 3 PP, Early Tier, Chaos-Attuned (EF21-EF24)

**EF21 — Mass Grave**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +2 ATK. Persist: on death, deal 3 damage to all enemy creatures. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Skeletal hands erupting from the ground in a wave of necrotic destruction

**EF22 — Soul Bomb**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +1 instability, +2 ATK, +1 HP. Persist: on death, deal damage equal to this creature's ATK to the enemy avatar. Attuned bonus: +2 ATK this turn.
- **Instability adjustment**: +1
- **Visual prompt**: Massive concentration of spectral energy building to critical mass, detonation imminent

**EF23 — Lich's Bargain**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +1 ATK, Deathtouch. Persist: on death, give all friendly creatures +2 ATK permanently. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Lich's staff crackling with deadly energy, phylactery chain glowing sickly green

**EF24 — Entropy Cascade**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +3 ATK. Persist: on death, all enemy creatures lose their highest keyword (removed permanently). Attuned bonus: +1 ATK. Order penalty: -1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Cascading wave of entropy radiating from the creature, dissolving magical protections

### Pool 7: 1 PP, Late Tier, Order-Attuned (EF25-EF28)

**EF25 — Ghostly Ward**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: +1 HP. Persist: on death, create a lingering effect for 2 turns: all friendly creatures get +0/+1. Attuned bonus: this creature gains Ward.
- **Instability adjustment**: 0
- **Visual prompt**: Protective spectral barrier that remains visible even after the creature is gone

**EF26 — Echoing Sacrifice**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: -1 instability. Persist sympathy: when any friendly creature dies, heal your avatar 1 HP. Attuned bonus: +1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Echo of life force returning to the avatar from each fallen ally

**EF27 — Death's Certainty**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: Persist -- on death, the next friendly creature played this game enters with +1/+1. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Inevitable sense of destiny, the creature accepting death as a stepping stone

**EF28 — Restless Bones**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: +1 HP. Persist: on death, reduce the cost of the highest-cost card in your hand by 1 (this turn only). Attuned bonus: draw 1 card.
- **Instability adjustment**: 0
- **Visual prompt**: Bones rattling with residual energy, refusing to fully stop even in death

### Pool 8: 1 PP, Late Tier, Chaos-Attuned (EF29-EF32)

**EF29 — Grave Chill**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 ATK. Persist: on death, give a random enemy creature -1 ATK and -1 HP permanently. Attuned bonus: +1 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Freezing necrotic cold radiating from the creature, chilling enemies to the bone

**EF30 — Haunting Wail**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 instability. Persist: on death, deal 1 damage to all enemy creatures and the enemy avatar. Attuned bonus: +1 ATK. Order penalty: -1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Unearthly wail escaping the creature's mouth, a sound that damages the living

**EF31 — Death Mark**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 ATK. Persist: on death, mark a random enemy creature -- it takes 2 damage at start of its controller's next turn. Attuned bonus: this creature gains Haste.
- **Instability adjustment**: 0
- **Visual prompt**: Cursed rune appearing on the target, counting down to punishment

**EF32 — Feeding Frenzy**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: Persist sympathy -- when any friendly creature dies, this creature gets +1 ATK permanently. Attuned bonus: +1 ATK on each trigger.
- **Instability adjustment**: 0
- **Visual prompt**: Ravenous undead growing stronger with each fallen ally, consuming their remnant energy

### Pool 9: 2 PP, Late Tier, Order-Attuned (EF33-EF36)

**EF33 — Spirit Anchor**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: +1 HP. Persist: on death, create a lingering effect for 3 turns: all friendly creatures heal 1 HP at start of turn. Attuned bonus: Shield on this creature.
- **Instability adjustment**: 0
- **Visual prompt**: Spectral anchor embedded in the ground, tethering healing energy to the area

**EF34 — Legacy of the Fallen**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: -1 instability, +1 HP. Persist: on death, give all friendly creatures +1/+1 permanently. Attuned bonus: the next friendly creature played enters with Shield.
- **Instability adjustment**: -1
- **Visual prompt**: Golden death-light ascending and splitting into beams that empower each surviving ally

**EF35 — Martyr's Chain**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: Shield. Persist sympathy: when any friendly creature dies, this creature gets +0/+2 permanently and gains Shield (if it doesn't have one). Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Chain of spectral links connecting to fallen allies, each death adding another link of armor

**EF36 — Eternal Vigil**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: Taunt, +1 HP. Persist: on death, the friendly creature with the lowest HP gains Taunt and +0/+3 permanently. Attuned bonus: draw 1 card.
- **Instability adjustment**: 0
- **Visual prompt**: Undying sentinel passing its duty to the next in line upon falling

### Pool 10: 2 PP, Late Tier, Chaos-Attuned (EF37-EF40)

**EF37 — Necrotic Explosion**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +1 ATK. Persist: on death, deal 3 damage to all enemy creatures and 1 damage to all friendly creatures. Attuned bonus: +2 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Massive necrotic detonation, purple-black energy wave consuming everything nearby

**EF38 — Doom Pact**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +1 instability, +2 ATK. Persist: on death, deal this creature's ATK as damage split evenly among all enemy creatures (round down, leftover to avatar). Attuned bonus: +1 ATK. Order penalty: -1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Dark pact sigils burning into the creature's flesh, ensuring death brings doom

**EF39 — Plague Wind**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +1 ATK, +1 HP. Persist: on death, give all enemy creatures -2 ATK for 2 turns. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Pestilent wind of spectral disease billowing from the creature's fallen form

**EF40 — Carrion Feast**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +2 ATK. Persist sympathy: when any friendly creature dies, deal 2 damage to a random enemy creature. Attuned bonus: +1 ATK per friendly creature that has died this game (cap +3).
- **Instability adjustment**: 0
- **Visual prompt**: Swarm of spectral carrion birds descending to feed on the dead, then attacking the living

### Pool 11: 3 PP, Late Tier, Order-Attuned (EF41-EF44)

**EF41 — Undying Covenant**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: Shield, +2 HP. Persist: on death, all friendly creatures get +1/+2 permanently and gain Shield. Attuned bonus: heal all friendly creatures 2 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Solemn oath of mutual protection, spectral bindings connecting all allies in death

**EF42 — Death's Embrace**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: -2 instability, +2 HP. Persist: on death, create a lingering effect for 3 turns: all friendly creatures get +1/+1 and heal 1 HP at start of turn. Attuned bonus: +1 HP to all friendly creatures.
- **Instability adjustment**: -2
- **Visual prompt**: Gentle spectral embrace enveloping allies, warmth from beyond the grave

**EF43 — Soulkeeper**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: +1 ATK, +1 HP, Taunt. Persist sympathy: when any friendly creature dies, this creature gets +1/+1 permanently and heals 2 HP. Attuned bonus: draw 1 card whenever a friendly creature dies.
- **Instability adjustment**: 0
- **Visual prompt**: Massive bone-and-spirit construct growing larger with each soul it absorbs

**EF44 — Resurrection Echo**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: +2 HP. Persist: on death, the next creature played from your hand this game enters with +3/+3 and Shield. Attuned bonus: draw 2 cards on death.
- **Instability adjustment**: 0
- **Visual prompt**: Brilliant echo of life persisting after death, ready to infuse the next vessel

### Pool 12: 3 PP, Late Tier, Chaos-Attuned (EF45-EF48)

**EF45 — Death Nova**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 ATK, +1 HP. Persist: on death, deal 4 damage to all enemy creatures and 2 damage to the enemy avatar. Attuned bonus: +2 ATK this turn. Order penalty: -1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Catastrophic necrotic supernova erupting from the creature's core upon destruction

**EF46 — Apocalypse Trigger**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 instability, +3 ATK. Persist: on death, deal this creature's ATK as damage to the enemy avatar. Attuned bonus: +2 ATK. Order penalty: -2 ATK.
- **Instability adjustment**: +2
- **Visual prompt**: Doomsday runes carved into the creature's skeleton, glowing brighter as death approaches

**EF47 — Eternal Hunger**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +1 ATK, Deathtouch. Persist sympathy: when any creature dies (friend or enemy), this creature gets +1 ATK permanently. Attuned bonus: Lifesteal.
- **Instability adjustment**: 0
- **Visual prompt**: Insatiable hunger incarnate, growing in power with every death on the battlefield

**EF48 — Final Harvest**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 ATK. Persist: on death, deal 2 damage to all creatures and all avatars. For each creature killed by this effect, deal 2 additional damage to the enemy avatar. Attuned bonus: +1 ATK. Order penalty: this creature takes 1 damage at start of your turn.
- **Instability adjustment**: 0
- **Visual prompt**: Spectral scythe sweeping across the entire battlefield, reaping everything in its path

---

## 5. Ironwright Modifier Retheme (IF01-IF48)

The Ironwright Collective is rethemed from Victorian steampunk to **brutalist space-industrial empire**. All 48 modifiers retain the Augment mechanic (effects scale with Augment count on the creature) but receive new names, flavor text, and visual descriptions.

**NOT**: brass, gears, steam, clockwork, Victorian.
**IS**: concrete, iron, hydraulics, rebar, void industry, star conquest, orbital machinery, reactor cores, gravity wells.

### Pool 1: 1 PP, Early Tier, Order-Attuned (IF01-IF04)

**IF01 — Rebar Reinforcement**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: +1 HP per Augment modifier on this creature. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Exposed rebar lattice fused into the creature's frame, concrete patching over joints

**IF02 — Hull Plating**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: -1 instability. +1 HP while this creature has any Augment modifier. Attuned bonus: +1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Void-rated hull plating bolted onto the creature's exterior in overlapping segments

**IF03 — Structural Integrity**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: +1 HP. Augment condition: if this creature has 2+ Augment modifiers, also +1 ATK. Attuned bonus: none.
- **Instability adjustment**: 0
- **Visual prompt**: Load-bearing infrastructure visible through transparent chest panel, engineering perfection

**IF04 — Gravity Anchor**
- **Pool**: 1 PP / Early / Order
- **Effect**: Base: +1 HP per Augment on this creature. Attuned bonus: this creature gains Reach this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Heavy gravity anchor chains dragging from the creature's base, grounding it to the deck

### Pool 2: 1 PP, Early Tier, Chaos-Attuned (IF05-IF08)

**IF05 — Overclock Protocol**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 ATK per Augment modifier on this creature. Attuned bonus: +1 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Reactor core glowing dangerously bright, heat vents flaring orange

**IF06 — Reactor Surge**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 instability, +1 ATK per Augment modifier on this creature. Attuned bonus: +1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Reactor breach warning lights flashing, energy output spiking beyond safe limits

**IF07 — Void-Tempered Edge**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 ATK. Augment condition: if this creature has 2+ Augment modifiers, gain Piercing. Attuned bonus: none.
- **Instability adjustment**: 0
- **Visual prompt**: Blade edge forged in the void of space, impossibly sharp and cold

**IF08 — Orbital Strike Array**
- **Pool**: 1 PP / Early / Chaos
- **Effect**: Base: +1 ATK per Augment on this creature. Attuned bonus: deal 1 damage to a random enemy creature.
- **Instability adjustment**: 0
- **Visual prompt**: Shoulder-mounted targeting array linked to orbital weapons platforms

### Pool 3: 2 PP, Early Tier, Order-Attuned (IF09-IF12)

**IF09 — Ablative Shielding**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: Shield. Augment condition: regenerate Shield at start of turn if this creature has 2+ Augment modifiers. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Layered ablative armor segments that crack off under damage and regrow from nano-fabricators

**IF10 — Foundry Directive**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: -1 instability, +1 HP per Augment modifier on this creature. Attuned bonus: +1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Foundry directive code scrolling across the creature's visor, optimizing defensive protocols

**IF11 — Bulkhead Construction**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: +1 HP. Augment aura: +1 HP per Augment modifier on this creature. Attuned bonus: this creature gains Taunt this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Massive bulkhead sections deployed around the creature, fortress-like defensive posture

**IF12 — Void Dock Repairs**
- **Pool**: 2 PP / Early / Order
- **Effect**: Base: +1 HP per Augment on this creature. Augment condition: if 3+ Augment modifiers, heal this creature 1 HP at start of turn. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Automated repair drones swarming from void-dock bays, patching damage in real-time

### Pool 4: 2 PP, Early Tier, Chaos-Attuned (IF13-IF16)

**IF13 — Siege Engine Mode**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +1 ATK per Augment modifier on this creature. Attuned bonus: +1 ATK per Augment on this creature (doubles the scaling).
- **Instability adjustment**: 0
- **Visual prompt**: Transformation into siege configuration, weapons systems deploying from every surface

**IF14 — Star-Forge Tempering**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +1 instability, +1 ATK, +1 HP. Augment condition: +1 ATK per Augment modifier. Attuned bonus: +1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Creature's metal components glowing white-hot from star-forge reprocessing

**IF15 — Hydraulic Overload**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +2 ATK. Augment condition: if 2+ Augment modifiers, gain Piercing. Attuned bonus: none (high value combo).
- **Instability adjustment**: 0
- **Visual prompt**: Hydraulic pistons extending past safe limits, immense mechanical force output

**IF16 — Weapons Platform**
- **Pool**: 2 PP / Early / Chaos
- **Effect**: Base: +1 ATK per Augment on this creature. Augment condition: if 3+ Augment, +2 ATK. Attuned bonus: +1 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Additional weapons platforms welded onto the creature's frame, bristling with armament

### Pool 5: 3 PP, Early Tier, Order-Attuned (IF17-IF20)

**IF17 — Dreadnought Armor**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: Shield, +1 HP per Augment modifier on this creature. Attuned bonus: regenerate Shield at start of turn.
- **Instability adjustment**: 0
- **Visual prompt**: Void-dreadnought-class armor plating encasing the creature, massive and impenetrable

**IF18 — Foundry Core**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: -1 instability, +2 HP. Augment condition: +1 HP per Augment modifier. If 3+ Augments, also heal 1 HP per turn. Attuned bonus: +1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Central foundry reactor core visible through armored viewport, powering regeneration systems

**IF19 — Redundant Systems Array**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: +1 ATK, +1 HP per Augment. Augment condition: if 3+ Augments, this creature cannot be reduced below 1 HP by a single source of damage (once per turn). Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Triple-redundant system architecture visible in cross-section, failsafe upon failsafe

**IF20 — Orbital Shipyard**
- **Pool**: 3 PP / Early / Order
- **Effect**: Base: Shield, +1 HP. Augment condition: if 4+ Augment modifiers, all Augment stat bonuses on this creature are doubled. Attuned bonus: +0/+1.
- **Instability adjustment**: 0
- **Visual prompt**: Miniature orbital shipyard scaffolding forming around the creature, constantly upgrading

### Pool 6: 3 PP, Early Tier, Chaos-Attuned (IF21-IF24)

**IF21 — Void Cannon**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +2 ATK per Augment modifier on this creature. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Massive void-energy cannon fused to the creature's arm, barrel glowing with contained devastation

**IF22 — Strip-Mine Protocol**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +1 instability, +1 ATK, +1 HP. +1 ATK per Augment modifier. Attuned bonus: deal 1 damage to all enemy creatures.
- **Instability adjustment**: +1
- **Visual prompt**: Mining lasers repurposed for combat, strip-mining enemy defenses

**IF23 — Re-Entry Assault**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +2 ATK. Augment condition: if 2+ Augments, gain Piercing. If 3+ Augments, also +2 ATK. Attuned bonus: none (very high ceiling).
- **Instability adjustment**: 0
- **Visual prompt**: Creature wreathed in re-entry plasma, descending from orbit like a living missile

**IF24 — Gravity Well Generator**
- **Pool**: 3 PP / Early / Chaos
- **Effect**: Base: +1 ATK, +1 HP. +1 ATK per Augment modifier. Augment condition: if 4+ Augments, enemy creatures get -1 ATK. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Localized gravity distortion warping space around the creature, pulling enemies off-balance

### Pool 7: 1 PP, Late Tier, Order-Attuned (IF25-IF28)

**IF25 — Containment Protocol**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: +1 HP per Augment on this creature. Attuned bonus: if this creature has Shield, also gains Ward this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Emergency containment fields activating around the creature, layered protective barriers

**IF26 — Void-Hardened Frame**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: -1 instability. +1 HP per Augment. Attuned bonus: heal this creature 1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Frame tempered by extended void exposure, impossibly dense and resistant

**IF27 — Modular Repair Bay**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: Augment condition -- if 3+ Augment modifiers, heal this creature 2 HP at start of turn. Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Internal repair bay cycling damaged components, automated maintenance

**IF28 — Fleet Formation**
- **Pool**: 1 PP / Late / Order
- **Effect**: Base: +1 HP. Augment condition: if 2+ Augments, adjacent creatures get +0/+1. Attuned bonus: none.
- **Instability adjustment**: 0
- **Visual prompt**: Fleet formation hologram projecting tactical positioning data to nearby units

### Pool 8: 1 PP, Late Tier, Chaos-Attuned (IF29-IF32)

**IF29 — Targeting Override**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 ATK per Augment on this creature. Attuned bonus: deal 1 damage to the enemy creature with the highest ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Targeting reticle locking onto highest-priority target, red laser designation

**IF30 — Reactor Meltdown**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 instability, +1 ATK per Augment. Attuned bonus: +1 ATK this turn. Order penalty: -1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Reactor containment failing, dangerous energy bleeding through cracks in the hull

**IF31 — Scrap Legion Fury**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 ATK. Augment condition: if 2+ Augments, gain Haste (relevant for newly played creatures). Attuned bonus: +1 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Jury-rigged scrap armor and weapons, aggressive patchwork combat modifications

**IF32 — Bombardment Array**
- **Pool**: 1 PP / Late / Chaos
- **Effect**: Base: +1 ATK per Augment. Augment condition: if 4+ Augments, deal 1 damage to all enemy creatures at start of turn. Attuned bonus: none.
- **Instability adjustment**: 0
- **Visual prompt**: Array of bombardment cannons tracking multiple targets simultaneously

### Pool 9: 2 PP, Late Tier, Order-Attuned (IF33-IF36)

**IF33 — Citadel Mode**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: Shield. +1 HP per Augment modifier. Augment condition: if 3+ Augments, regenerate Shield at start of turn. Attuned bonus: +0/+2.
- **Instability adjustment**: 0
- **Visual prompt**: Creature locking into citadel configuration, armor panels sealing into fortress mode

**IF34 — Central Command**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: -1 instability, +1 HP per Augment. Augment condition: if 3+ Augments, adjacent creatures get +0/+1 per Augment on this creature. Attuned bonus: +1 HP.
- **Instability adjustment**: -1
- **Visual prompt**: Command bridge holographics projecting tactical data, coordinating nearby units

**IF35 — Emergency Fabrication**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: +1 HP per Augment. Augment condition: when this creature takes damage, if it has 3+ Augments, heal 1 HP immediately. Attuned bonus: draw 1 card.
- **Instability adjustment**: 0
- **Visual prompt**: Emergency nano-fabrication swarm repairing damage as fast as it occurs

**IF36 — Bulwark Dreadnought**
- **Pool**: 2 PP / Late / Order
- **Effect**: Base: Taunt, +1 HP per Augment. Augment condition: if 4+ Augments, this creature takes 1 less damage from all sources (minimum 1). Attuned bonus: +1 HP.
- **Instability adjustment**: 0
- **Visual prompt**: Dreadnought-class unit deployed in defensive position, immovable object

### Pool 10: 2 PP, Late Tier, Chaos-Attuned (IF37-IF40)

**IF37 — Weapons Free**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +1 ATK per Augment modifier. Attuned bonus: +1 ATK per Augment on this creature (doubles scaling).
- **Instability adjustment**: 0
- **Visual prompt**: All weapons systems unlocked and firing simultaneously, maximum engagement

**IF38 — Nova Reactor**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +1 instability, +2 ATK. Augment condition: if 3+ Augments, gain Piercing. Attuned bonus: +1 ATK. Order penalty: -1 ATK.
- **Instability adjustment**: +1
- **Visual prompt**: Experimental nova reactor core pushing output past theoretical limits

**IF39 — Planetary Siege**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +1 ATK per Augment. Augment condition: if 4+ Augments, deal 2 damage to the enemy avatar at start of your turn. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Planetary bombardment cannons warming up, targeting enemy stronghold from orbit

**IF40 — Annihilator Beam**
- **Pool**: 2 PP / Late / Chaos
- **Effect**: Base: +2 ATK. Augment condition: if 3+ Augments, when this creature attacks, deal 1 damage to all enemy creatures. Attuned bonus: +1 ATK this turn.
- **Instability adjustment**: 0
- **Visual prompt**: Concentrated annihilation beam cutting through everything in its path

### Pool 11: 3 PP, Late Tier, Order-Attuned (IF41-IF44)

**IF41 — Titan-Class Armor**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: Shield, +1 HP per Augment. Augment condition: if 3+ Augments, this creature and adjacent creatures gain Shield at start of turn. Attuned bonus: +0/+2.
- **Instability adjustment**: 0
- **Visual prompt**: Titan-class void armor encasing the creature completely, nearby units receiving auxiliary shielding

**IF42 — Failsafe Protocol**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: -2 instability, +2 HP. Augment condition: if 4+ Augment modifiers, when this creature would die, survive with 1 HP instead (once per game) and gain Shield. Attuned bonus: +1 HP to all friendly creatures.
- **Instability adjustment**: -2
- **Visual prompt**: Emergency failsafe systems engaging, creature ejecting from destroyed shell into backup frame

**IF43 — Star-Forge Masterwork**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: +1 ATK, +2 HP per Augment modifier on this creature. Augment condition: if 4+ Augments, all Augment stat bonuses are doubled. Attuned bonus: none (ceiling is enormous).
- **Instability adjustment**: 0
- **Visual prompt**: Creature reforged in a star-forge, every component replaced with superior materials

**IF44 — Absolute Zero Containment**
- **Pool**: 3 PP / Late / Order
- **Effect**: Base: Shield, Taunt, +1 HP per Augment. Augment condition: if 3+ Augments, reduce all damage to this creature by 1 (min 1). Attuned bonus: regenerate Shield.
- **Instability adjustment**: 0
- **Visual prompt**: Absolute zero containment field freezing everything that approaches, impenetrable cold

### Pool 12: 3 PP, Late Tier, Chaos-Attuned (IF45-IF48)

**IF45 — Extinction Protocol**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 ATK per Augment modifier. Attuned bonus: +1 ATK per Augment. Order penalty: -1 ATK per Augment.
- **Instability adjustment**: 0
- **Visual prompt**: Ultimate weapons protocol engaged, creature becoming an engine of total destruction

**IF46 — Singularity Core**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 instability, +3 ATK. Augment condition: if 4+ Augments, deal 3 damage to a random enemy creature at start of turn. Attuned bonus: +2 ATK. Order penalty: -2 ATK.
- **Instability adjustment**: +2
- **Visual prompt**: Miniature singularity tearing at the fabric of space inside the creature's core

**IF47 — Void Supremacy**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +1 ATK, Piercing. +1 ATK per Augment modifier. Augment condition: if 3+ Augments, Piercing damage is doubled. Attuned bonus: +1 ATK.
- **Instability adjustment**: 0
- **Visual prompt**: Supreme void-conquest weapon platform, all systems dedicated to punching through defenses

**IF48 — Total War Machine**
- **Pool**: 3 PP / Late / Chaos
- **Effect**: Base: +2 ATK. Augment condition: if 4+ Augments, this creature gets +1 ATK per Augment modifier, gains Piercing, and deals 1 damage to all enemy creatures when it attacks. Attuned bonus: +2 ATK this turn. Order penalty: this creature takes 2 damage at start of turn.
- **Instability adjustment**: 0
- **Visual prompt**: Ultimate war machine configuration, every system weaponized, the final form of industrial conquest

---

## 6. Haste Keyword

### Definition

**Haste** -- This creature can attack the turn it is played.

**Wait -- doesn't the existing game already have no summoning sickness?**

The expansion plan introduces Haste, which implies summoning sickness is being added as the default. This is a critical design decision that requires clarification.

**Resolution: Summoning sickness is NOT being added.** Creatures can already attack the turn they are played (00-game-design-master.md Section 8: "No Summoning Sickness"). Adding summoning sickness as a global rule would be a fundamental change to the game's tempo and violate the protected design docs.

**Revised Haste definition:** Haste allows a creature to **bypass effects that would prevent it from attacking on the turn it is played.** In the base game, this has no effect (there is no summoning sickness). However, Haste becomes relevant in the following contexts:

1. **Ward interaction:** A creature with Ward cannot be targeted by opponent modifier effects for 1 turn. Some future effects might restrict freshly-played creatures. Haste ensures the creature can always act immediately regardless of board-state restrictions.

2. **Persist interaction (Endless):** Some Persist lingering effects create zones that debuff or restrict newly-played creatures. Haste creatures ignore deployment restrictions from lingering effects.

3. **Planar Ruin interaction:** Some evolved Planar Ruins may impose deployment penalties on the opponent (e.g., "creatures you play enter with -1 ATK this turn"). Haste creatures ignore these penalties.

4. **Future-proofing:** The data model supports additional deployment restrictions. Haste is the universal answer to any "slow down deployment" mechanic.

**Alternative interpretation (recommended):** Given the base game has no summoning sickness, Haste should provide a DIFFERENT benefit that fits the aggressive attrition theme of The Endless:

**FINAL DESIGN -- Haste: When this creature is played, it may immediately declare an attack against a target creature before the normal Declare Attackers phase.** This is a bonus attack that happens during the Main Phase as an immediate combat. The creature can still attack normally during the Declare Attackers phase that same turn. This makes Haste a powerful tempo tool -- the creature effectively gets to attack twice on its first turn (once immediately, once in combat).

**Simplified ruling:** On the turn a creature with Haste is played, during the Main Phase, the controlling player may immediately declare it as attacking a specific enemy creature. Combat resolves instantly (Shield check, damage, Deathtouch, Piercing, Lifesteal -- full combat resolution for that pair only). The Haste creature can then still attack during the normal Declare Attackers phase.

### PP Cost

**Haste: 2 PP**

Rationale: Haste provides significant tempo advantage (effectively a free attack on the play turn). This is comparable to Flying (2 PP) in impact -- both create situations where damage gets through that normally wouldn't. Haste's bonus attack is particularly strong on high-ATK creatures and creatures with Deathtouch (instant removal on play).

### Faction Affinity

- **Primary: The Endless** -- Aggressive attrition. Haste creatures enter, attack immediately, then serve as Persist fodder. The "attack on entry" fits the relentless, inevitable theme.
- **Secondary: Demonic Kingdoms** -- Fast aggro. Corruption creatures are on a clock from self-damage. Haste squeezes maximum value before they burn out.
- **Tertiary: Ironwright (Scrap Legions sub-faction)** -- Jury-rigged war machines that hit fast.

### Design Intent

Haste creatures should be designed with moderate-to-high ATK and lower HP. They are meant to deal damage quickly, trade aggressively, and die -- generating value for Persist or spending their window before Corruption burns them down.

| Keyword | Haste Synergy |
|---|---|
| Shield | Haste + Shield: attack immediately with protection. Strong but expensive (5 PP total). |
| Lifesteal | Haste + Lifesteal: immediate heal on the bonus attack. Good sustain for aggro. |
| Flying | Haste + Flying: bonus attack can target any creature (not evasion -- the Haste attack targets a specific creature). Normal attack phase uses Flying evasion. |
| Reach | Minimal synergy. Reach is defensive; Haste is offensive. |
| Deathtouch | Haste + Deathtouch: instant creature removal on play. Extremely powerful. Design at high CM cost. |
| Taunt | Haste + Taunt: deploy and immediately force engagement. Strong defensive deploy. |
| Piercing | Haste + Piercing: bonus attack excess damage hits face. Good for pushing damage. |
| Ward | Haste + Ward: deploy protected and attack immediately. The creature is both safe and aggressive. |

---

## 7. Ward Keyword

### Definition

**Ward** -- This creature cannot be targeted by the opponent's modifier effects, triggered ability effects, or spell effects for 1 turn after deployment. Ward expires at the start of the controlling player's next turn.

### Clarifications

1. **Ward only protects against targeted effects.** Area-of-effect abilities and events (e.g., "deal 1 damage to ALL creatures") bypass Ward. Ward stops "deal 3 damage to target creature" but not "deal 2 damage to all enemy creatures."

2. **Ward only protects against the OPPONENT's effects.** The controlling player can still target their own Ward creature with buffs, heals, and spells.

3. **Ward does NOT protect against combat damage.** If the opponent declares an attack and the Ward creature blocks (or is attacked while having Taunt), combat damage resolves normally.

4. **Ward expires at the start of the controlling player's next turn.** This means Ward protects the creature for approximately one full round -- the opponent's entire turn plus the chaos roll/event phase of the controlling player's next turn. Once the controlling player's Start of Turn phase begins, Ward drops.

5. **Ward is consumed on expiry, not on absorption.** Unlike Shield (which breaks when it absorbs damage), Ward simply expires after its duration regardless of whether it was "tested."

6. **Ward does NOT prevent Chaos/Order event effects.** Events are system-level effects, not targeted spell/modifier effects. If a Chaos event deals 2 damage to a random enemy creature and selects the Ward creature, the damage still applies. Ward only blocks effects originating from the opponent player's cards and abilities.

7. **Ward blocks death-touch effects from Persist.** If a Persist modifier's death trigger targets the Ward creature specifically (e.g., "deal 2 damage to a random enemy creature" and it randomly selects the Ward creature), the effect is blocked and retargets to another valid target. If no other valid target exists, the effect fizzles.

### PP Cost

**Ward: 1 PP**

Rationale: Ward is a one-turn protective effect that only stops targeted effects. It does not protect against combat, AoE, or events. Its value is primarily in protecting a key creature during the vulnerable deployment turn. At 1 PP, it is comparable to Reach (1 PP, situational defensive) and Taunt (1 PP, forces engagement). Ward is slightly stronger in some situations (protects from removal spells) but weaker in others (does nothing against combat or AoE).

### Faction Affinity

- **Primary: Celestial Crusade** -- Protective formation. Ward helps Celestial creatures survive long enough to establish Exalt auras. Deploy a creature with Ward, and it is safe from removal for one turn while the Exalt network builds.
- **Secondary: Ironwright (Foundry Directorate sub-faction)** -- Protecting the investment. Augment creatures have high stacked value; Ward protects them from targeted removal during critical turns.
- **Tertiary: Fey Courts** -- Protecting the Bond network.

### Design Intent

Ward is a deployment-protection keyword. It ensures that newly-played creatures survive their first turn on the board, which is critical for mechanics that need time to activate (Exalt thresholds, Augment stacking, Bond networks).

Ward is deliberately weak against:
- **Board wipes and AoE** (cannot protect against "damage all" effects)
- **Combat** (Taunt creatures can force the Ward creature into combat)
- **Events** (Chaos events that deal random damage still work)

This ensures Ward is not an absolute protection -- it is a timing tool that gives the creature one safe turn against targeted removal.

| Keyword | Ward Synergy |
|---|---|
| Shield | Ward + Shield: double protection. Ward blocks targeted removal; Shield blocks the first combat hit. Expensive (4 PP) but very safe. |
| Lifesteal | Minimal synergy. Lifesteal is about dealing damage; Ward is about surviving. |
| Flying | Ward + Flying: evasive AND removal-proof for one turn. Strong aggressive combo. |
| Reach | Ward + Reach: protected defensive creature. Solid but not exciting. |
| Deathtouch | Ward + Deathtouch: the opponent cannot remove the Deathtouch threat with spells for one turn. They must commit to combat. Very strong. |
| Taunt | Ward + Taunt: forces engagement AND cannot be targeted with removal. Opponent must attack into it. Excellent defensive deploy. |
| Piercing | Minimal synergy. Both are primarily aggressive tools. |
| Haste | Ward + Haste: deploy, attack immediately, and be safe from removal. Maximum tempo. |

---

## 8. Full 9x9 Keyword Interaction Matrix

How every keyword interacts with every other keyword when they appear in combat or on the same creature.

### Combat Interactions (Attacker vs. Defender)

| Attacker \ Defender | Shield | Lifesteal | Flying | Reach | Deathtouch | Taunt | Piercing | Haste | Ward |
|---|---|---|---|---|---|---|---|---|---|
| **Shield** | Both shields absorb. Shields cancel each other. No damage dealt. Both shields break. | Shield absorbs defender's damage. Lifesteal heals 0. Attacker deals damage normally (defender has no Shield). | No special interaction. | No special interaction. | Shield absorbs Deathtouch hit. Creature survives. Shield breaks. | No special interaction. Shield still absorbs first hit. | No special interaction. | No special interaction. | No combat interaction (Ward does not affect combat). |
| **Lifesteal** | Lifesteal heals 0 if defender's Shield absorbs (no damage dealt). | Both heal for damage dealt. Both creatures survive longer in sustain matchups. | No special interaction. | No special interaction. | Lifesteal attacker heals for damage dealt. Deathtouch defender kills attacker regardless. Both effects resolve. | No special interaction. | No special interaction. | No special interaction. | No combat interaction. |
| **Flying** | No special interaction. | No special interaction. | Both creatures can block each other. Standard combat. | Reach creature CAN block Flying attacker. Defender chooses. | Flying attacker can be killed by Deathtouch if blocked by a creature with Deathtouch + Flying or Deathtouch + Reach. | Ground Taunt cannot block Flying (forced-block waived). Taunt + Reach or Taunt + Flying CAN block. Forced-attack obligation still applies. | No special interaction. | No special interaction. | No combat interaction. |
| **Reach** | No special interaction. | No special interaction. | Reach creature blocks Flying attacker normally. | No special interaction (Reach vs Reach is standard combat). | No special interaction. | No special interaction. | No special interaction. | No special interaction. | No combat interaction. |
| **Deathtouch** | Shield absorbs Deathtouch hit. Creature survives. Shield breaks. | Deathtouch kills defender. Defender's Lifesteal still heals (simultaneous damage). | No special interaction (still needs to be blocked). | No special interaction. | Both creatures kill each other regardless of stats (mutual Deathtouch). | Taunt forces engagement. Deathtouch kills the Taunt creature regardless of HP. | Deathtouch kills blocker. Piercing applies -- all ATK minus 1 (minimum needed for Deathtouch kill) goes to face. EXTREMELY powerful combo. | No special interaction. | No combat interaction. |
| **Taunt** | No special interaction. | No special interaction. | Taunt forced-block waived against Flying if Taunt lacks Reach/Flying. Forced-attack still applies. | No special interaction. | Taunt forces engagement. Deathtouch kills the Taunt creature. | Multiple Taunts: opponent must send 1 attacker per Taunt (up to creature count). Defender chooses which Taunt blocks which. | No special interaction. | No special interaction. | No combat interaction. |
| **Piercing** | Shield absorbs ALL damage. No pierce-through. Shield breaks. 0 damage to face. | No special interaction. | No special interaction. | No special interaction. | Piercing attacker's excess goes to face. Deathtouch defender kills attacker. Both effects resolve. Face damage still applies. | Piercing through Taunt blocker sends excess to face. | Piercing is attacker-only. If both have Piercing, only attacker's piercing applies. Defender's Piercing does nothing when blocking. | No special interaction. | No combat interaction. |
| **Haste** | No special combat interaction (Haste is a deployment keyword). | No special interaction. | No special interaction. | No special interaction. | No special interaction. | No special interaction. | No special interaction. | If both creatures have Haste, no special interaction (Haste is about deployment, not combat). | No combat interaction. |
| **Ward** | No combat interaction (Ward does not affect combat). | No combat interaction. | No combat interaction. | No combat interaction. | No combat interaction. Ward does NOT protect against Deathtouch in combat. | No combat interaction. Ward creature with Taunt still must block. | No combat interaction. | No combat interaction. | No combat interaction (Ward vs Ward is irrelevant). |

### Same-Creature Keyword Stacking

When a creature has multiple keywords, they all apply simultaneously:

| Combination | Effect |
|---|---|
| Shield + Taunt | Forces engagement AND absorbs first hit. Excellent defensive wall. |
| Shield + Deathtouch | Shield protects the fragile Deathtouch creature for one engagement. After Shield breaks, Deathtouch trades with anything. |
| Shield + Lifesteal | Shield absorbs the first hit (Lifesteal irrelevant on that exchange). After Shield breaks, Lifesteal sustains. |
| Flying + Deathtouch | Evasive creature that kills anything it touches. Must be blocked by Flying/Reach, or it goes face. Very powerful. |
| Flying + Piercing | Evasion + pierce. If blocked by a Flying/Reach creature with less HP than ATK, excess goes to face. |
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

### Updated Keyword PP Costs (Complete List)

| Keyword | PP Cost | Category |
|---|---|---|
| Shield | 3 | Defensive |
| Lifesteal | 2 | Sustain |
| Flying | 2 | Evasion |
| Reach | 1 | Defensive (situational) |
| Deathtouch | 3 | Removal |
| Taunt | 1 | Defensive (forced engagement) |
| Piercing | 2 | Aggressive |
| Haste | 2 | Tempo |
| Ward | 1 | Protective (deployment) |

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

## 9. Celestial Starter Deck

20-card starter deck showcasing the Exalt mechanic. All cards are Common tier. Designed for the trial phase and faction commitment.

### Deck Philosophy

The Celestial starter teaches go-wide formation play. Cards are slightly below-curve individually but synergize when multiple creatures are on the board. The deck wants to deploy 3+ creatures and keep them alive for Exalt bonuses to activate during evolution.

### Card List

| # | Name | Type | CM | ATK | HP | Instability | Keywords | Description |
|---|---|---|---|---|---|---|---|---|
| 1 | Crusader Initiate | Creature | 1 | 1 | 2 | 1 | -- | Young knight of the Celestial order. Humble beginnings. |
| 2 | Crusader Initiate | Creature | 1 | 1 | 2 | 1 | -- | (2nd copy) |
| 3 | Herald of Dawn | Creature | 1 | 2 | 1 | 2 | -- | Swift messenger heralding the crusade's advance. |
| 4 | Sanctified Scout | Creature | 2 | 1 | 4 | 1 | -- | Blessed scout with divine protection. HP-heavy order card. |
| 5 | Sanctified Scout | Creature | 2 | 1 | 4 | 1 | -- | (2nd copy) |
| 6 | Angelic Recruit | Creature | 2 | 2 | 3 | 2 | -- | Newly awakened celestial, still finding its wings. |
| 7 | Angelic Recruit | Creature | 2 | 2 | 3 | 2 | -- | (2nd copy) |
| 8 | Burning Zealot | Creature | 2 | 3 | 2 | 3 | -- | Fanatical crusader wreathed in holy fire. Aggressive. |
| 9 | Temple Guardian | Creature | 3 | 2 | 5 | 1 | Taunt | Divine guardian that forces engagement. Protects the formation. |
| 10 | Temple Guardian | Creature | 3 | 2 | 5 | 1 | Taunt | (2nd copy) |
| 11 | Radiant Knight | Creature | 3 | 3 | 4 | 2 | -- | Balanced crusader, backbone of the Celestial army. |
| 12 | Radiant Knight | Creature | 3 | 3 | 4 | 2 | -- | (2nd copy) |
| 13 | Seraph Striker | Creature | 3 | 4 | 3 | 3 | -- | Aggressive angel striking down the faithless. |
| 14 | Celestial Warden | Creature | 4 | 3 | 6 | 1 | Shield | Heavily armored divine warden. Shield protects the investment. |
| 15 | Holy Avenger | Creature | 4 | 5 | 4 | 3 | -- | Wrathful angel delivering divine punishment. High ATK. |
| 16 | Choir of Blades | Creature | 5 | 4 | 7 | 2 | -- | Formation of angelic warriors fighting as one. Premium creature. |
| 17 | Archangel Vanguard | Creature | 5 | 3 | 7 | 1 | Flying | Winged commander leading the celestial advance from above. |
| 18 | Divine Smite | Spell | 2 | -- | -- | 0 | -- | Deal 3 damage to target creature. Basic removal. |
| 19 | Blessed Rally | Spell | 3 | -- | -- | 0 | -- | All friendly creatures get +1/+1 this turn. Showcases go-wide strategy. |
| 20 | Warding Pillar | Stabilizer | 3 | 0 | 5 | 0 | -- | Avatar instability modifier doubled. Universal stabilizer for order builds. |

### Deck Statistics

- **Creatures**: 17 (85%)
- **Spells**: 2 (10%)
- **Stabilizers**: 1 (5%)
- **Mana curve**: 1-cost: 3, 2-cost: 5, 3-cost: 5, 4-cost: 2, 5-cost: 2, 6-cost: 0
- **Average CM**: 2.65
- **Average instability** (creatures only): 1.71
- **Keywords**: Taunt (2), Shield (1), Flying (1)
- **Instability distribution**: 0: 0, 1: 8, 2: 6, 3: 3, 4: 0, 5: 0

### Play Pattern

1. **Turns 1-2**: Deploy cheap creatures (Crusader Initiates, Sanctified Scouts, Angelic Recruits). Build board presence.
2. **Turns 3-4**: Deploy Temple Guardians to protect the formation. Play Radiant Knights as flexible threats.
3. **Turns 5+**: Deploy premium creatures (Celestial Warden, Choir of Blades, Archangel Vanguard). With 3-5 creatures on board, the deck is positioned for Exalt auras once cards begin evolving.
4. **Spells**: Divine Smite removes threats. Blessed Rally pushes damage with a wide board.
5. **Avatar recommendation**: Order-leaning avatar (-5 or -6) to keep instability low and Order events frequent.

---

## 10. Endless Starter Deck

20-card starter deck showcasing the Persist mechanic. All cards are Common tier.

### Deck Philosophy

The Endless starter teaches aggressive trading. Creatures are expendable -- the deck wants to trade, trigger death effects (once evolved), and grind the opponent down through attrition. The deck runs slightly more aggressive stats than Celestial, with lower HP and higher ATK.

### Card List

| # | Name | Type | CM | ATK | HP | Instability | Keywords | Description |
|---|---|---|---|---|---|---|---|---|
| 1 | Shambling Corpse | Creature | 1 | 2 | 1 | 3 | -- | Mindless undead. Cheap, aggressive, expendable. |
| 2 | Shambling Corpse | Creature | 1 | 2 | 1 | 3 | -- | (2nd copy) |
| 3 | Grave Watcher | Creature | 1 | 1 | 2 | 1 | -- | Spectral sentinel. Order-leaning, defensive. |
| 4 | Bone Collector | Creature | 2 | 3 | 2 | 3 | -- | Skeleton that gathers remains. High ATK, fragile. |
| 5 | Bone Collector | Creature | 2 | 3 | 2 | 3 | -- | (2nd copy) |
| 6 | Restless Shade | Creature | 2 | 2 | 3 | 2 | -- | Ghost that refuses to pass on. Balanced. |
| 7 | Restless Shade | Creature | 2 | 2 | 3 | 2 | -- | (2nd copy) |
| 8 | Crypt Sentinel | Creature | 2 | 1 | 4 | 1 | -- | Undying guard of ancient tombs. Defensive anchor. |
| 9 | Carrion Stalker | Creature | 3 | 4 | 3 | 3 | -- | Predatory undead drawn to death. Aggressive. |
| 10 | Carrion Stalker | Creature | 3 | 4 | 3 | 3 | -- | (2nd copy) |
| 11 | Necromancer's Thrall | Creature | 3 | 3 | 4 | 2 | -- | Bound servant of a lich. Balanced workhorse. |
| 12 | Necromancer's Thrall | Creature | 3 | 3 | 4 | 2 | -- | (2nd copy) |
| 13 | Spectre Knight | Creature | 3 | 2 | 4 | 2 | Lifesteal | Ethereal knight draining life from the living. Sustain. |
| 14 | Abomination | Creature | 4 | 5 | 4 | 3 | -- | Stitched-together horror. High ATK, chaos-leaning. |
| 15 | Bone Leviathan | Creature | 4 | 2 | 6 | 1 | Taunt | Massive bone construct. Forces engagement, protecting aggro creatures behind it. |
| 16 | Lich Apprentice | Creature | 5 | 4 | 6 | 2 | Deathtouch | Apprentice lich with lethal touch. Premium threat. |
| 17 | Dread Revenant | Creature | 5 | 6 | 5 | 4 | -- | Terrifying revenant. Glass cannon. High risk, high reward. |
| 18 | Necrotic Bolt | Spell | 2 | -- | -- | 0 | -- | Deal 3 damage to target creature. Basic removal. |
| 19 | Soul Drain | Spell | 3 | -- | -- | 0 | -- | Deal 2 damage to target creature. Heal your avatar for 2 HP. Sustain + removal. |
| 20 | Chaos Rift | Stabilizer | 2 | 0 | 3 | 0 | -- | Each creature contributes +1 instability. Universal stabilizer for chaos builds. |

### Deck Statistics

- **Creatures**: 17 (85%)
- **Spells**: 2 (10%)
- **Stabilizers**: 1 (5%)
- **Mana curve**: 1-cost: 3, 2-cost: 5, 3-cost: 5, 4-cost: 2, 5-cost: 2, 6-cost: 0
- **Average CM**: 2.65
- **Average instability** (creatures only): 2.24
- **Keywords**: Lifesteal (1), Taunt (1), Deathtouch (1)
- **Instability distribution**: 0: 0, 1: 3, 2: 6, 3: 6, 4: 1, 5: 0

### Play Pattern

1. **Turns 1-2**: Deploy cheap aggressive creatures (Shambling Corpses, Bone Collectors). Apply early pressure.
2. **Turns 3-4**: Deploy Carrion Stalkers and Necromancer's Thralls. Trade aggressively. Once evolved, deaths will trigger Persist effects.
3. **Turns 5+**: Deploy premium threats (Abomination, Lich Apprentice, Dread Revenant). These trade up with Deathtouch or push massive damage.
4. **Spells**: Necrotic Bolt removes blockers. Soul Drain provides sustain.
5. **Avatar recommendation**: Chaos-leaning avatar (-1 or -2) to maximize Chaos events for burst damage and ATK spikes. Higher instability from creatures naturally pushes toward Chaos.

### Starter Deck Comparison

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

## 11. Balance Analysis: 5 Mechanics x 9 Keywords

### Mechanic-Keyword Synergy Matrix

Rating scale: -2 (anti-synergy) to +3 (strong synergy). 0 = neutral.

| Keyword \ Mechanic | Augment (IW) | Bond (Fey) | Corruption (Dem) | Exalt (Cel) | Persist (End) |
|---|---|---|---|---|---|
| **Shield** | +3 (protect stacked investment) | +2 (keep Bond network alive) | -1 (wasted if creature self-damages to death) | +3 (protect formation for Exalt thresholds) | -1 (prevents trading, delays Persist triggers) |
| **Lifesteal** | +2 (sustain the big creature) | +1 (moderate sustain for network) | +3 (offset Corruption self-damage) | +1 (modest sustain for formation) | +1 (sustain through attrition) |
| **Flying** | +1 (evasion for tall threat) | +1 (push damage past blockers) | +2 (bypass blockers for face damage) | +1 (evasive aura carrier) | +1 (fly over to push face, then die for triggers) |
| **Reach** | +1 (protect investment from flyers) | +2 (protect Bond network from flyers) | 0 (defensive, doesn't help aggro) | +2 (protect formation from flyers) | 0 (defensive, contradicts aggressive trading) |
| **Deathtouch** | -1 (wastes Augment investment -- DT creature trades 1-for-1 regardless of stats) | 0 (neutral -- DT trades, removing Bond count) | +2 (cheap creature trades up, dies, triggers Corruption death effects) | -1 (DT wants to trade, Exalt wants to keep creatures alive) | +3 (trade with anything, trigger Persist) |
| **Taunt** | +2 (force engagement on your terms, protect other Augment creatures) | +2 (protect Bond network by intercepting) | +1 (forces opponent to engage with Corruption creatures) | +3 (protect formation, prevent opponent from picking off Exalt sources) | +1 (forces engagement, enables trading) |
| **Piercing** | +2 (high ATK from Augment stacking pierces through blockers) | +1 (moderate synergy with Bond ATK buffs) | +3 (max face damage before burnout, every point counts) | +1 (decent with Exalt ATK auras) | +1 (push face damage alongside attrition) |
| **Haste** | +1 (get immediate value from Augment creature) | 0 (Bond needs sustained presence, not burst) | +2 (maximize damage before Corruption burnout) | 0 (Exalt needs sustained board, not burst deploys) | +3 (deploy, attack, then serve as Persist fodder) |
| **Ward** | +2 (protect Augment investment from removal) | +2 (protect key Bond creature from removal) | 0 (Corruption doesn't mind creature dying -- self-damage often kills them anyway) | +3 (protect formation building from targeted removal) | -1 (Ward keeps creature alive, delaying Persist) |

### Balance Concerns and Mitigations

**1. Exalt + Shield + Taunt (Celestial fortress)**
- **Concern**: A Celestial board with 4+ creatures, Exalt HP auras, Shield on everything, and Taunt forcing engagement could be nearly impenetrable.
- **Mitigation**: AoE damage (Chaos events Upheaval/Maelstrom, AoE spells) bypasses Shield/Taunt. Board wipes collapse all Exalt auras at once. Deathtouch ignores HP stacking. Piercing punches through Taunt blockers to face. The Celestial player also sacrifices individual creature power for the formation -- if the formation breaks, each creature is weak alone.

**2. Persist + Deathtouch + Haste (Endless death engine)**
- **Concern**: Endless creatures that deploy with Haste, immediately kill something with Deathtouch, then die to trigger Persist effects could create an overwhelming value loop.
- **Mitigation**: This requires significant PP investment (Deathtouch 3 PP + Haste 2 PP = 5 PP minimum, only available on 5-6 cost creatures at Common). The creature itself will have very low stats after paying for keywords. Shield blocks Deathtouch for one hit. Ward prevents targeted Persist death triggers. The loop requires constant card draw to keep deploying, and the Endless player runs out of hand.

**3. Augment stacking ceiling**
- **Concern**: A 4-Augment Ironwright creature with scaling bonuses (+1 ATK per Augment x4, doubled by late-tier modifier = +8 ATK) reaches extreme stat levels.
- **Mitigation**: Augment is self-contained per creature (no board-wide scaling). Deathtouch kills it regardless of stats. One removal spell trades with the entire Augment stack. The Ironwright player puts all eggs in one basket. Persist death triggers mean killing the Augment stack generates massive value for Endless. Board wipe effects don't care about stats.

**4. Corruption + Lifesteal sustainability**
- **Concern**: Corruption self-damage offset by Lifesteal could create infinite sustainability -- the creature hurts itself but heals it all back.
- **Mitigation**: Corruption self-damage fires at Start of Turn (before attacks). Lifesteal only triggers on combat damage (during Combat Resolution phase). The timing gap means the creature takes damage before it can heal. If the creature dies from self-damage before combat, Lifesteal never fires. Also, Shield on opponents' creatures means Lifesteal heals 0 when damage is absorbed.

**5. Cross-faction Exalt + Persist interaction**
- **Concern**: In a Celestial vs Endless matchup, when the Endless player kills Celestial creatures, the Exalt auras collapse (good for Endless) but does the Persist trigger interact with the aura loss? Could cascading deaths occur?
- **Mitigation**: Resolution order is clear -- creature dies, aura deactivates, then death triggers fire. If the aura loss causes another creature to die (e.g., it was at 1 HP from a +0/+1 aura), that secondary death happens before Persist triggers fire for the first death. All deaths in a batch are collected, then all death triggers fire in board-slot order. No infinite loops because Persist effects cannot cause further Persist triggers from the same death event.

### Faction Matchup Matrix (5x5)

| Attacker \ Defender | Ironwright (Augment) | Fey (Bond) | Demonic (Corruption) | Celestial (Exalt) | Endless (Persist) |
|---|---|---|---|---|---|
| **Ironwright** | Mirror: tall vs tall. First to assemble a 4-Augment creature wins. | IW wants efficient 1-for-1 trades. Each kill weakens Bond. Fey wants to go wide and overwhelm. | IW's stacked HP resists burst. Deathtouch is the Demonic answer. Slow grind favors IW. | IW's targeted threats vs Celestial's wide formation. Removal spells are key -- kill Exalt sources. | IW's tall creatures are hard to trade into profitably for Endless. But Persist death value means even bad trades generate something. |
| **Fey** | Bond network can overwhelm a single Augment stack with numbers. But if IW kills Bond creatures 1-for-1, the network weakens. | Mirror: both go wide. Whoever gets ahead in creature count snowballs. | Bond network can stabilize against Corruption burst if it survives the early game. Healing and Shield keep the network alive. | Similar board-centric strategies. Fey's Bond is more resilient to partial removal (Bond effects on specific creatures vs Exalt's threshold). | Fey wants to avoid trading (preserves Bond). Endless wants to force trades (triggers Persist). Taunt and Shield protect the Bond network. |
| **Demonic** | Deathtouch ignores Augment HP stacking. Burst can kill before Augment fully stacks. Race matchup. | Corruption burst can shatter Bond network early. If Fey stabilizes, Demonic burns out. | Mirror: race to kill. Highest burst wins. Both players take self-damage. Volatile and fast. | Corruption aggro tries to kill Celestial creatures before formation stabilizes. If Exalt gets Shield auras up, Demonic burns out. | Both profit from death. Explosive matchup with creatures dying constantly. Demonic wants to close fast; Endless wants to grind. |
| **Celestial** | Formation vs investment. Exalt auras on 4+ creatures can overwhelm a single Augment stack. IW removal targets Exalt sources. | Both are board-centric. Celestial auras are global; Bond effects are targeted. Celestial is more fragile to partial removal. | Shield auras and healing counter Corruption burst. Celestial stabilizes and grinds. | Mirror: who builds the wider board faster. AoE spells break the stalemate. | Celestial wants to avoid deaths (maintains formation). Endless wants to force trades. The tension between "keep alive" and "kill for value" defines the matchup. |
| **Endless** | Persist death triggers generate value even when trading unfavorably against Augment stacks. Deathtouch is the key keyword. | Forcing trades weakens Bond AND triggers Persist. Endless favored if it can force engagement. | Both thrive on death. Volatile, explosive games. Whoever generates more value from death wins. | Endless picks apart the formation one creature at a time. Each kill weakens Exalt AND triggers Persist. But Shield auras make forcing trades difficult. | Mirror: mutual death value. Whoever has better Persist triggers and more efficient trades wins. Haste creatures create tempo advantages. |

---

*End of PHASE1B Mechanics Design Document*

*Status: Complete. Ready for user review and Phase 2 integration into core design docs (00, 01, 02).*

# PHASE1C — Planar Ruins System Design

## Revision Log

| Version | Date | Changes | Author |
|---|---|---|---|
| v1.0 | 2026-02-18 | Initial complete design: 8 neutral archetypes, 40 faction evolutions, balance design, turn integration, art prompts, effect pools, data model | planar-ruins-designer |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Neutral Ruin Archetypes](#2-neutral-ruin-archetypes)
3. [Faction Evolution Paths](#3-faction-evolution-paths)
4. [Balance Design](#4-balance-design)
5. [Turn Structure Integration](#5-turn-structure-integration)
6. [Effect Pool Design](#6-effect-pool-design)
7. [Art Prompt Templates](#7-art-prompt-templates)
8. [Data Model Specification](#8-data-model-specification)

---

## 1. Overview

### What Are Planar Ruins?

Planar Ruins are ancient structures found in the Plane of Chaos by explorers who ventured through the rifts when the planes fractured. Built by a vanished civilization known as the Ancient Builders, the ruins stabilize chaotic energy, creating pockets of survivable space where beings of both Order and Chaos can persist. They are prized strategic assets in battle.

### Battlefield Role Summary

- **Takes a creature slot** on the battlefield (5-slot board). Reduces creature board presence in exchange for a passive benefit.
- **High HP, zero ATK.** Ruins are structures, not combatants.
- **Provides a passive benefit** to the controlling player while on the field.
- **Can be attacked and destroyed** by opponent's creatures during combat (opponent assigns attackers to ruins).
- **Destruction penalty**: When a ruin is destroyed, a negative effect fires on the controlling player's side for 1 turn.
- **Max 1 on field at a time.**
- **Max 2 in deck** (to preserve creature-heavy deckbuilding as the norm).

### Evolution: Neutral to Faction-Specific

Ruins start as neutral — ancient, unclaimed structures usable in any faction's deck. After accumulating enough familiarity (10 battles), a neutral ruin can be evolved **once** into a **faction-specific** ruin. The evolution uses the same subscription tier system for choice breadth:

| Subscription Tier | Options Presented |
|---|---|
| Free (Planar Shard) | Pick 1 of 2 |
| Mid (Refined Shard) | Pick 1 of 3 |
| Top (Prismatic Shard) | Pick 1 of 4 |

Once evolved, the ruin is **faction-locked** — it can only be played in decks of that faction. Evolved ruins have stronger, faction-complementary effects and faction-themed destruction penalties.

### How Ruins Differ from Stabilizers

Stabilizers already exist in the game (Section 11 of `01-battle-mechanics.md`). Ruins are a distinct card type with different gameplay characteristics:

| Property | Stabilizers | Planar Ruins |
|---|---|---|
| Card type | `STABILIZER` | `PLANAR_RUIN` |
| Primary function | Manipulate instability/chaos roll system | Provide general passive battlefield benefits |
| Instability contribution | 0 (modify instability via aura effects) | Low (0-2 base instability) |
| Evolution | None — static cards | Neutral to Faction-Specific (1 evolution step) |
| Faction | Universal (all factions at launch) | Neutral OR faction-locked after evolution |
| Destruction penalty | Effect simply ends | Negative penalty effect fires on own side for 1 turn |
| Field limit | No special limit (just board slots) | Max 1 ruin on field at a time |
| Deck limit | No special limit (just deck size) | Max 2 ruins per deck |
| Combat targeting | Can be damaged by spells/events, not by creature attacks directly | Can be targeted by creature attacks (opponent assigns attackers) |
| ATK | 0 | 0 |
| Blocking | Cannot block | Cannot block |

**Key distinction on creature targeting:** Stabilizers cannot be attacked by creatures (only damaged by spells/events). Planar Ruins CAN be attacked by creatures — the opponent may declare attackers targeting the ruin during combat, just as they would attack a creature. This is a deliberate design choice: ruins provide stronger, more varied effects than stabilizers and must be destroyable through normal combat to provide counterplay.

---

## 2. Neutral Ruin Archetypes

### HP Formula

Ruins are structures meant to persist. Their HP scales with CM cost using the formula:

```
Ruin HP = (CM cost x 3) + 1
```

| CM Cost | HP |
|---|---|
| 2 | 7 |
| 3 | 10 |
| 4 | 13 |
| 5 | 16 |
| 6 | 19 |

This makes ruins significantly tougher than creatures at the same CM cost. A 3-cost creature at Common has 7 PP total (split between ATK and HP, typically 3/4 or 4/3). A 3-cost ruin has 10 HP and no ATK. The opponent must commit significant board resources to destroy a ruin through combat damage, or use removal spells/chaos events.

### The 8 Ruins

---

#### Ruin 1: The Resonance Spire

| Property | Value |
|---|---|
| CM Cost | 2 |
| HP | 7 |
| Base Instability | 0 |
| Neutral Effect | **Harmonic Pulse** — At the start of your turn, heal 1 HP to your most damaged creature. If tied, heal the leftmost (lowest slot). |
| Destruction Penalty | **Feedback Surge** — All your creatures take 1 damage. |
| Visual Description | A slender crystalline tower, roughly ten feet tall, rising from a cracked stone foundation. The crystal pulses with a soft white-blue light in rhythmic waves. Faint geometric engravings spiral up the tower's surface — not language, but mathematical patterns. The foundation stones are worn smooth by millennia. Pale dust motes drift upward around the spire, defying gravity. |
| Discovery Lore | Ironwright surveyors found the first Resonance Spire half-buried in a collapsed rift valley. When they set up camp nearby, wounded soldiers healed faster overnight. The engineers theorized the spire converts ambient chaos into restorative frequencies, though they could never explain the mathematics carved into its surface. |

---

#### Ruin 2: The Anchor Plinth

| Property | Value |
|---|---|
| CM Cost | 3 |
| HP | 10 |
| Base Instability | 0 |
| Neutral Effect | **Planar Stability** — All your creatures gain +1 HP (max HP and current HP). Creatures played while the Anchor Plinth is on the field enter with this bonus. |
| Destruction Penalty | **Foundation Collapse** — All your creatures lose 1 max HP and 1 current HP (cannot reduce below 1 current HP). |
| Visual Description | A broad, low platform of dark grey stone — three stepped tiers ascending to a flat altar surface. Each tier is etched with concentric circles that glow faintly amber. The top surface is perfectly smooth, reflecting the sky like still water. Six broken pillars once supported something above the plinth, but whatever it held is long gone. The air within arm's reach of the plinth feels heavier, more still — as if chaos cannot touch the space directly above it. |
| Discovery Lore | Fey scouts discovered the first Anchor Plinth deep in a region of the Plane of Chaos where nothing should survive — constant reality storms that dissolved matter itself. Yet the plinth stood untouched, and in a radius around it, the storms parted. The Fey brought their wounded there and found that even gravely injured creatures stabilized in its presence. |

---

#### Ruin 3: The Mote Well

| Property | Value |
|---|---|
| CM Cost | 3 |
| HP | 10 |
| Base Instability | 1 |
| Neutral Effect | **Chaos Siphon** — At the start of your turn, gain +1 chaos mote (still subject to the 10 mote cap). |
| Destruction Penalty | **Mote Drain** — Lose 2 chaos motes immediately. |
| Visual Description | A circular basin carved from a single block of obsidian-veined marble. The basin is five feet across and two feet deep, filled with a slowly swirling liquid that glows faintly violet — not water, but liquefied chaos energy. Small motes of light rise from the surface and dissolve into the air. The basin's rim is carved with interlocking triangular patterns, each triangle containing a different symbol. The ground around the well is scorched in a perfect circle. |
| Discovery Lore | A Demonic raiding party found the first Mote Well while pursuing fleeing Fey through a rift. The warlord who touched the liquid felt a rush of raw energy — the well was collecting and concentrating chaos motes from the surrounding environment. The Demons realized the Ancient Builders had created infrastructure for harvesting chaos itself, not merely surviving it. |

---

#### Ruin 4: The Sight Glass

| Property | Value |
|---|---|
| CM Cost | 4 |
| HP | 13 |
| Base Instability | 1 |
| Neutral Effect | **Prescient Lens** — Whenever you draw a card, look at the top card of your deck (revealed to you only). Once per turn, you may choose to put that top card on the bottom of your deck instead of drawing it next turn. |
| Destruction Penalty | **Shattered Vision** — Skip your next card draw (the draw during Phase 4 of your next turn). |
| Visual Description | A great lens of translucent amber crystal, six feet in diameter, mounted in a frame of tarnished silver alloy. The frame stands on three curving legs that dig into the ground like roots. Through the lens, the world appears slightly different — colors shift, shadows move independently, and occasionally an image of something that hasn't happened yet flickers across the surface. The crystal has a single crack running from edge to center, sealed with a substance that glows gold. |
| Discovery Lore | Celestial scholars found the first Sight Glass at the intersection of three rift lines, mounted as if it were a window looking at nothing. When a curious acolyte looked through it, she could see two seconds into the future — not enough to change fate, but enough to prepare for it. The scholars determined the lens was a fragment of something much larger, a window through which the Ancient Builders observed time itself. |

---

#### Ruin 5: The War Cairn

| Property | Value |
|---|---|
| CM Cost | 4 |
| HP | 13 |
| Base Instability | 2 |
| Neutral Effect | **Battle Resonance** — All your creatures gain +1 ATK. Creatures played while the War Cairn is on the field enter with this bonus. |
| Destruction Penalty | **Valor Shattered** — All your creatures lose 1 ATK for 1 turn (minimum 1 ATK). |
| Visual Description | A rough pyramid of stacked stones, each stone carved with a different weapon — swords, spears, axes, maces — in bas-relief. The cairn stands eight feet high, and the topmost stone is a single large crystal that glows a deep, angry red. The stones vibrate faintly, as though responding to nearby conflict. When battle occurs nearby, the red crystal pulses brighter and the weapon carvings seem to shift, as though the depicted weapons are being drawn. |
| Discovery Lore | An Endless necromancer, exploring the Plane of Chaos alone, found the first War Cairn on an ancient battlefield littered with weapons from no known civilization. The cairn stood at the center, and the necromancer felt their summoned revenants grow stronger simply by standing near it. Whatever the Ancient Builders used it for, it remembers war, and it amplifies the violence of those who claim it. |

---

#### Ruin 6: The Threshold Gate

| Property | Value |
|---|---|
| CM Cost | 5 |
| HP | 16 |
| Base Instability | 1 |
| Neutral Effect | **Planar Attunement** — Whenever a Chaos or Order event fires on your turn, all your creatures gain +1 evolution energy after the battle (stacks with normal post-battle energy). Does not fire on "Nothing" rolls. |
| Destruction Penalty | **Rift Backlash** — Your instability is set to 10 for 1 turn (overrides all creature instability calculations). Reverts at end of turn. |
| Visual Description | A freestanding stone archway, twelve feet tall, constructed from two massive pillar-stones capped by a lintel carved with spiraling cosmic patterns. The space within the archway shimmers — not a portal, but a membrane between stability and chaos. The air passing through the gate carries a faint charge. The pillar-stones are covered in thousands of tiny hash-marks, as if someone once used the gate to count events over an impossibly long time. Lichen of no natural color grows at the base. |
| Discovery Lore | An Ironwright expedition discovered the first Threshold Gate at the edge of a stability pocket, exactly where order met chaos. Instruments placed within the archway registered every fluctuation in planar energy — the gate was a measuring device, built to observe the boundary between the planes. The engineers realized the Ancient Builders had been studying the fracture between Order and Chaos long before anyone else knew it existed. |

---

#### Ruin 7: The Communion Altar

| Property | Value |
|---|---|
| CM Cost | 5 |
| HP | 16 |
| Base Instability | 1 |
| Neutral Effect | **Shared Vitality** — At the end of your turn, if you control 3 or more creatures (not counting the ruin), heal all your creatures for 1 HP. |
| Destruction Penalty | **Bond Severed** — All your creatures lose all temporary buffs currently active on them (any THIS_TURN or UNTIL_NEXT_ROLL effects are stripped immediately). |
| Visual Description | A circular stone table, seven feet across, carved from a single piece of pale grey stone. The surface is divided into five equal sections by shallow channels that radiate from the center like a star. Each channel still holds traces of a luminous blue substance that dried millennia ago. Five smaller stones surround the altar at equal intervals, each carved with a hand pressing downward — as though five beings were meant to stand at the altar simultaneously. The air above the table shimmers faintly when living creatures stand near multiple stones at once. |
| Discovery Lore | Fey wardens found the first Communion Altar in a hidden grove that had somehow survived the planar fractures intact. When five of them stood at the surrounding stones, they felt each other's pain and strength. Wounds on one began to close as the others lent their vitality. The wardens believed the Ancient Builders used these altars for collective healing — or perhaps for something more profound, a sharing of consciousness that no modern faction has been able to replicate. |

---

#### Ruin 8: The Oblivion Obelisk

| Property | Value |
|---|---|
| CM Cost | 6 |
| HP | 19 |
| Base Instability | 2 |
| Neutral Effect | **Dread Presence** — At the start of your opponent's turn, deal 1 damage to a random enemy creature. |
| Destruction Penalty | **Unleashed Void** — Deal 3 damage to your avatar (player HP). |
| Visual Description | A single monolithic pillar of featureless black stone, fifteen feet tall and perfectly smooth. No carvings, no seams, no imperfections. The surface absorbs light — shadows deepen near it, and colors fade. The ground around the obelisk is dead — no lichen, no dust, no chaos motes. Anything that touches the obelisk's surface feels cold beyond temperature, a cold that reaches into thought itself. At certain angles, the obelisk appears to have depth — as though the surface is a window into an infinite black interior. |
| Discovery Lore | No one knows who found the first Oblivion Obelisk, because the first expedition that reported it did not return whole. A second expedition found the survivors sitting silently around the obelisk, alive but unresponsive. The obelisk radiates negation — it unmakes things slowly, patiently, indifferently. The Ancient Builders either worshiped entropy or sought to contain it. The distinction no longer matters. |

---

### Ruin Summary Table

| # | Name | CM | HP | Inst | Neutral Effect | Destruction Penalty |
|---|---|---|---|---|---|---|
| 1 | The Resonance Spire | 2 | 7 | 0 | Heal 1 to most damaged creature at start of turn | All creatures take 1 damage |
| 2 | The Anchor Plinth | 3 | 10 | 0 | All creatures gain +1 HP | All creatures lose 1 max HP and 1 current HP |
| 3 | The Mote Well | 3 | 10 | 1 | Gain +1 chaos mote at start of turn | Lose 2 chaos motes |
| 4 | The Sight Glass | 4 | 13 | 1 | Scry top card on draw; once per turn may bottom it | Skip next card draw |
| 5 | The War Cairn | 4 | 13 | 2 | All creatures gain +1 ATK | All creatures -1 ATK for 1 turn |
| 6 | The Threshold Gate | 5 | 16 | 1 | Creatures gain +1 evolution energy per event | Instability set to 10 for 1 turn |
| 7 | The Communion Altar | 5 | 16 | 1 | Heal all creatures for 1 HP at end of turn if 3+ creatures | All temporary buffs stripped |
| 8 | The Oblivion Obelisk | 6 | 19 | 2 | Deal 1 damage to random enemy creature at start of opponent's turn | Deal 3 damage to your avatar |

**Design notes on variety:**
- **Healing/sustain**: Resonance Spire (cheap, single-target), Communion Altar (wide, conditional)
- **Stat buffing**: Anchor Plinth (HP), War Cairn (ATK)
- **Resource advantage**: Mote Well (mana), Sight Glass (card selection), Threshold Gate (evolution energy)
- **Offensive disruption**: Oblivion Obelisk (damage to enemies)
- **Instability spread**: 0, 0, 1, 1, 2, 1, 1, 2 — mostly low, but War Cairn and Oblivion Obelisk add meaningful instability
- **CM curve**: 2, 3, 3, 4, 4, 5, 5, 6 — full spread across viable play turns

---

## 3. Faction Evolution Paths

Each of the 8 neutral ruins can evolve into a faction-specific variant for each of the 5 factions = 40 total evolved ruins.

Evolution follows the subscription tier system: the player picks from 2/3/4 faction-specific evolution options (see Section 6 for full effect pools). The entries below describe the **primary evolved variant** — the strongest or most representative of each faction's theme. Additional options per ruin are detailed in Section 6.

### 3.1 The Resonance Spire (CM 2, HP 7)

**Neutral Effect**: Heal 1 HP to most damaged creature at start of turn.

---

#### Ironwright Evolution: Repair Pylon

| Property | Value |
|---|---|
| Evolved Name | Repair Pylon |
| Evolved Effect | **Augment Maintenance** — At the start of your turn, heal 2 HP to your most damaged creature. If that creature has at least 1 Augment modifier, also grant it Shield until end of turn. |
| Evolved Destruction Penalty | **System Failure** — All creatures with Augment modifiers lose their highest-PP Augment modifier's base effect for 1 turn (attuned effects also suppressed). |
| Visual Transformation | The crystalline tower is encased in welded iron plating bolted with heavy rivets. Hydraulic repair arms extend from the sides. The crystal's glow is channeled through conduit pipes into a directed beam. Industrial coolant vents hiss from the base. The geometric engravings are overlaid with circuit-like schematics etched in acid. |
| Evolution Flavor Text | "The Foundry Directorate does not study what it cannot use. Within a week, they had the spire producing repair frequencies on demand." |

---

#### Fey Courts Evolution: Heartwood Spire

| Property | Value |
|---|---|
| Evolved Name | Heartwood Spire |
| Evolved Effect | **Verdant Pulse** — At the start of your turn, heal 2 HP to your most damaged creature. If you control 2+ creatures with Bond modifiers, also heal 1 HP to all other friendly creatures. |
| Evolved Destruction Penalty | **Root Wither** — All Bond connections between your creatures are severed for 1 turn (Bond modifier synergy effects do not count other creatures). |
| Visual Transformation | Living wood has grown through and around the crystal, splitting the stone foundation with root systems. The tower is wrapped in flowering vines with bioluminescent blooms that pulse in sync with the crystal. Moss covers the base. The geometric engravings have been overgrown but the light now filters through leaves, casting dappled green patterns. A canopy of branches crowns the top. |
| Evolution Flavor Text | "The Verdant Throne planted a seed at its base and sang for three days. When they stopped, the spire was alive." |

---

#### Demonic Kingdoms Evolution: Bloodfire Spire

| Property | Value |
|---|---|
| Evolved Name | Bloodfire Spire |
| Evolved Effect | **Sanguine Resonance** — At the start of your turn, heal 2 HP to your most damaged creature. Additionally, deal 1 damage to your lowest-HP creature. If that creature has a Corruption modifier, it gains +2 ATK until end of turn instead of taking damage. |
| Evolved Destruction Penalty | **Pact Rupture** — All creatures with Corruption modifiers take 2 damage immediately. |
| Visual Transformation | The crystal has darkened to deep crimson, cracked and seeping a viscous red substance. Chains wrap the tower from base to tip. The foundation stones are scorched black, and blood-red runes are burned into every surface. The geometric engravings have been defaced with ritual markings. Hellfire licks the base, and the light it pulses is no longer soothing — it throbs like a heartbeat. |
| Evolution Flavor Text | "The Furnace Lords fed the spire blood until it learned to crave it." |

---

#### Celestial Crusade Evolution: Sanctified Beacon

| Property | Value |
|---|---|
| Evolved Name | Sanctified Beacon |
| Evolved Effect | **Divine Restoration** — At the start of your turn, heal 2 HP to your most damaged creature. If you triggered an Order event on your last chaos roll, heal 2 HP to ALL friendly creatures instead. (Exalt synergy: more creatures alive = more Exalt thresholds met.) |
| Evolved Destruction Penalty | **Faith Shaken** — All Exalt aura effects are suppressed for 1 turn (Exalt conditions are not checked; bonuses do not apply). |
| Visual Transformation | The crystal has been purified to brilliant white-gold. An angelic figure carved from marble kneels at the base, hands raised toward the light. Golden inscriptions in a divine script replace the geometric engravings. A halo of light crowns the top of the spire, and the dust motes that once drifted upward are now tiny sparks of divine radiance. The foundation is clad in white marble with gold inlay. |
| Evolution Flavor Text | "Heaven's Chosen declared the spire a holy relic and stationed an eternal guard. Its light now answers only to the righteous." |

---

#### The Endless Evolution: Dirge Spire

| Property | Value |
|---|---|
| Evolved Name | Dirge Spire |
| Evolved Effect | **Lingering Mend** — At the start of your turn, heal 2 HP to your most damaged creature. Whenever a friendly creature dies while this ruin is on the field, deal 1 damage to a random enemy creature. (Persist synergy: death triggers benefit from ruin presence.) |
| Evolved Destruction Penalty | **Silence of the Grave** — All Persist death-trigger effects are suppressed for 1 turn (creatures that die this turn do not fire Persist effects). |
| Visual Transformation | The crystal has turned a pale ghostly teal, translucent and flickering. Bone fragments are embedded in the foundation stones. Spectral mist seeps from the base. The geometric engravings now glow with necrotic purple light. A faint sound — like distant mourning — emanates from the crystal. Ghostly hands reach from the ground around the base, grasping but never quite touching the tower. |
| Evolution Flavor Text | "The Necromantic Cabals bound a dozen ghosts to the spire. It still heals — but now it also remembers every death." |

---

### 3.2 The Anchor Plinth (CM 3, HP 10)

**Neutral Effect**: All creatures gain +1 HP.

---

#### Ironwright Evolution: Reinforced Bastion

| Property | Value |
|---|---|
| Evolved Name | Reinforced Bastion |
| Evolved Effect | **Structural Augmentation** — All your creatures gain +1 HP. Creatures with at least 1 Augment modifier gain an additional +1 HP (total +2 HP for Augmented creatures). |
| Evolved Destruction Penalty | **Structural Collapse** — All creatures with Augment modifiers lose 2 max HP and 2 current HP (cannot reduce below 1). Non-augmented creatures lose 1 max HP and 1 current HP. |
| Visual Transformation | The stone platform is reinforced with iron plating and rebar. Industrial scaffolding extends upward from the broken pillar stumps, supporting radar dishes and sensor arrays. The amber glow of the channels has been replaced by reactor blue energy flowing through welded conduit. Hydraulic stabilizer legs anchor the platform to the ground. |
| Evolution Flavor Text | "The Foundry Directorate does not trust stone. They replaced it with iron, then reinforced the iron with more iron." |

---

#### Fey Courts Evolution: Living Foundation

| Property | Value |
|---|---|
| Evolved Name | Living Foundation |
| Evolved Effect | **Rooted Vitality** — All your creatures gain +1 HP. Whenever a creature with a Bond modifier enters the battlefield, it gains an additional +1 HP (total +2 HP on entry). |
| Evolved Destruction Penalty | **Uprooted** — All Bond connections severed for 1 turn. All creatures lose 1 max HP and 1 current HP. |
| Visual Transformation | The stone platform has been swallowed by a living root system. The altar surface is now a bed of soft moss. The amber channels are replaced by veins of bioluminescent sap flowing through root pathways. The broken pillars have been replaced by living trees that curve inward, forming a natural canopy. Fireflies drift in the air beneath. |
| Evolution Flavor Text | "The Hollow Court planted acorns in the channels and the plinth disappeared beneath a forest within a single moon." |

---

#### Demonic Kingdoms Evolution: Sacrificial Platform

| Property | Value |
|---|---|
| Evolved Name | Sacrificial Platform |
| Evolved Effect | **Blood Pact** — All your creatures gain +1 HP. At the start of your turn, you may sacrifice 1 HP from any friendly creature to give another friendly creature +2 ATK until end of turn. (Corruption synergy: creatures are already self-damaging, so the sacrifice cost is negligible.) |
| Evolved Destruction Penalty | **Broken Covenant** — All creatures lose 1 max HP and 1 current HP. All creatures with Corruption modifiers take an additional 2 damage. |
| Visual Transformation | The stone platform is stained permanently with blood. The channels are filled with molten obsidian that pulses with hellfire. The altar surface is carved with a pentagonal sacrificial circle. Chains dangle from the broken pillar stumps, each ending in a hook. The air above the altar shimmers with heat, and the smell of sulfur is inescapable. |
| Evolution Flavor Text | "The Furnace Lords carved the circle in one night, and by dawn the plinth was eager to drink." |

---

#### Celestial Crusade Evolution: Consecrated Dais

| Property | Value |
|---|---|
| Evolved Name | Consecrated Dais |
| Evolved Effect | **Divine Bulwark** — All your creatures gain +1 HP. When you control 3+ creatures (Exalt threshold), all creatures gain an additional +1 HP (total +2 HP while Exalt is met). |
| Evolved Destruction Penalty | **Desecration** — All Exalt auras suppressed for 1 turn. All creatures lose 2 max HP and 2 current HP. |
| Visual Transformation | The stone platform is clad in white marble veined with gold. The broken pillars have been replaced by six golden columns supporting a dome of divine light. The channels glow with liquid gold. An angelic relief is carved into the altar surface. Divine inscriptions ring the base, and a faint chorus of voices emanates from the dome above. |
| Evolution Flavor Text | "The Knights of Deliverance consecrated the plinth with holy water and prayer. The stone answered in light." |

---

#### The Endless Evolution: Ossuary Foundation

| Property | Value |
|---|---|
| Evolved Name | Ossuary Foundation |
| Evolved Effect | **Deathward** — All your creatures gain +1 HP. Whenever a friendly creature dies, the next creature you play gains +1/+1 permanently. (Persist synergy: deaths fuel future plays.) |
| Evolved Destruction Penalty | **Grave Collapse** — All creatures lose 1 max HP and 1 current HP. Persist death-trigger effects suppressed for 1 turn. |
| Visual Transformation | The stone platform is constructed from densely packed bones. The altar surface is a skull mosaic. The channels are filled with ectoplasmic residue that glows sickly green. The broken pillars are replaced by stacks of ribcages and femurs reaching upward. Ghostly mist seeps from between the bones. The entire structure hums with the whispers of the dead. |
| Evolution Flavor Text | "The Cabals laid bones in the channels where amber once flowed. The dead are a better foundation than stone." |

---

### 3.3 The Mote Well (CM 3, HP 10)

**Neutral Effect**: Gain +1 chaos mote at start of turn.

---

#### Ironwright: Reactor Well
- **Evolved Effect**: **Power Surge** — Gain +1 chaos mote at start of turn. Whenever you play a creature with an Augment modifier, refund 1 chaos mote.
- **Destruction Penalty**: Lose 3 chaos motes. All Augment modifier base effects suppressed for 1 turn.
- **Visual Transformation**: Industrial pumps and containment vessels surround the basin. The violet liquid is channeled through pipes into a glowing reactor core above. Warning indicators flash along the rim.
- **Evolution Flavor Text**: "The Scrap Legions jury-rigged a containment system in under an hour. Efficiency, not elegance."

---

#### Fey Courts: Moonpool
- **Evolved Effect**: **Tidal Mana** — Gain +1 chaos mote at start of turn. If your last chaos roll was an Order event, gain +1 additional chaos mote (total +2).
- **Destruction Penalty**: Lose 2 chaos motes. All Bond modifier synergy effects suppressed for 1 turn.
- **Visual Transformation**: The obsidian basin is now a natural pool fed by a miniature waterfall. Water lilies with luminous petals float on the surface. The violet liquid has become clear moonlit water that reflects a moon not visible in the sky.
- **Evolution Flavor Text**: "The Verdant Throne says the pool remembers a moon from before the fracture — a moon that only the Fey can see."

---

#### Demonic Kingdoms: Hellmouth Basin
- **Evolved Effect**: **Infernal Harvest** — Gain +1 chaos mote at start of turn. Whenever a friendly creature with a Corruption modifier takes self-damage, gain +1 chaos mote.
- **Destruction Penalty**: Lose 3 chaos motes. Deal 2 damage to all your creatures.
- **Visual Transformation**: The basin is a molten pit. The violet liquid is replaced by bubbling magma. The rim is jagged obsidian. Chains descend into the depths. Demonic runes circle the edge, each pulsing with firelight.
- **Evolution Flavor Text**: "The Furnace Lords widened the well until it became a mouth. It eats chaos and spits out fire."

---

#### Celestial Crusade: Font of Radiance
- **Evolved Effect**: **Divine Provision** — Gain +1 chaos mote at start of turn. Whenever an Exalt aura activates (board condition newly met), gain +1 chaos mote.
- **Destruction Penalty**: Lose 2 chaos motes. All Exalt auras suppressed for 1 turn.
- **Visual Transformation**: The basin is now a baptismal font of white stone filled with liquid gold light. Dove-like energy constructs circle above it. The rim is carved with prayers. A single golden chalice sits on the edge.
- **Evolution Flavor Text**: "Heaven's Chosen filled the well with blessed oil. What rises from it now is not chaos — it is purpose."

---

#### The Endless: Soulwell
- **Evolved Effect**: **Death Tithe** — Gain +1 chaos mote at start of turn. Whenever a creature (friendly or enemy) dies, gain +1 chaos mote.
- **Destruction Penalty**: Lose 3 chaos motes. Persist effects suppressed for 1 turn.
- **Visual Transformation**: The basin is filled with ectoplasm. Ghostly faces occasionally surface before sinking back. The rim is bone. The violet liquid has become a pale, luminous fog that laps at the edges like water made of souls.
- **Evolution Flavor Text**: "The Lost Spectres recognized the well for what it truly is — a drain. Everything pours into it eventually."

---

### 3.4 The Sight Glass (CM 4, HP 13)

**Neutral Effect**: Scry top card on draw; once per turn may bottom it.

---

#### Ironwright: Probability Engine
- **Evolved Effect**: **Calculated Precision** — Scry top card on draw; may bottom it. Additionally, whenever you play a creature with an Augment modifier, look at the top 2 cards and reorder them.
- **Destruction Penalty**: Skip next card draw. All Augment modifier attuned bonuses are suppressed for 1 turn.
- **Visual Transformation**: The amber lens is mounted in a mechanical armature with rotating calibration wheels. Telescopic lenses extend from the sides. Data readout screens display scrolling calculations. The crack is sealed with welded iron.
- **Evolution Flavor Text**: "The Directorate replaced intuition with mathematics. The lens now computes probability, not merely observes it."

---

#### Fey Courts: Oracle Pool
- **Evolved Effect**: **Dreaming Sight** — Scry top card on draw; may bottom it. Once per turn, when a Bond modifier triggers its synergy effect, look at the top card of the opponent's deck.
- **Destruction Penalty**: Skip next card draw. Bond connections severed for 1 turn.
- **Visual Transformation**: The lens has become a shallow reflecting pool held in a frame of living wood. The amber crystal dissolved into the water. Looking into the pool shows not reflections but visions. Fireflies orbit the frame.
- **Evolution Flavor Text**: "The Hollow Court gazed into the lens and the lens gazed back. Now it shows them not what will be, but what should never be."

---

#### Demonic Kingdoms: Eye of Malice
- **Evolved Effect**: **Cruel Foresight** — Scry top card on draw; may bottom it. Once per turn, you may pay 1 HP from any friendly creature to look at 2 cards from the top of your opponent's deck.
- **Destruction Penalty**: Skip next card draw. All creatures with Corruption modifiers take 2 damage.
- **Visual Transformation**: The lens has darkened to blood-red. A literal demonic eye, slitted and blinking, has formed in the center of the crystal. The frame is twisted iron, chains anchor it to the ground. The crack weeps a dark fluid.
- **Evolution Flavor Text**: "The Bureaucracy prizes information above all. They paid the lens in blood until it learned to spy."

---

#### Celestial Crusade: Seraph's Mirror
- **Evolved Effect**: **Divine Revelation** — Scry top card on draw; may bottom it. Whenever you trigger an Order event, draw 1 additional card.
- **Destruction Penalty**: Skip next card draw. Exalt auras suppressed for 1 turn.
- **Visual Transformation**: The lens is now flawless gold-tinted crystal. The frame is carved with six-winged seraphim. The crack is gone — healed by divine light. The lens shows truth, and lies cannot exist in its reflection. Holy light radiates outward.
- **Evolution Flavor Text**: "The Chosen look through the mirror and see the world as it should be — ordered, pure, and theirs."

---

#### The Endless: Death's Prism
- **Evolved Effect**: **Spectral Sight** — Scry top card on draw; may bottom it. Whenever a creature (friendly or enemy) dies, draw 1 card.
- **Destruction Penalty**: Skip next card draw. Persist effects suppressed for 1 turn.
- **Visual Transformation**: The lens has become translucent and ghostly. Through it, the dead are visible — ghosts walk the battlefield. The frame is bone and tarnished silver. The crack has widened and spectral energy leaks from it like breath in cold air.
- **Evolution Flavor Text**: "The Spectres looked through the lens and saw themselves — alive, whole, and screaming."

---

### 3.5 The War Cairn (CM 4, HP 13)

**Neutral Effect**: All creatures gain +1 ATK.

---

#### Ironwright: Siege Monument
- **Evolved Effect**: **Industrial Arsenal** — All creatures gain +1 ATK. Creatures with 2+ Augment modifiers gain an additional +1 ATK (total +2 ATK for heavily augmented creatures).
- **Destruction Penalty**: All creatures -1 ATK for 1 turn. Augment modifier base effects suppressed for 1 turn.
- **Visual Transformation**: The stone cairn is rebuilt in iron and concrete. Each weapon carving is replaced by schematics of siege engines. The red crystal is replaced by a reactor core pulsing with blue energy. Industrial scaffolding and cranes surround the structure.
- **Evolution Flavor Text**: "The Directorate mapped every weapon carving and improved upon them all. Stone remembers; iron improves."

---

#### Fey Courts: Thornguard Menhir
- **Evolved Effect**: **Nature's Wrath** — All creatures gain +1 ATK. Creatures with Bond modifiers gain Piercing until end of turn whenever an Order event fires.
- **Destruction Penalty**: All creatures -1 ATK for 1 turn. Bond connections severed for 1 turn.
- **Visual Transformation**: The stone pyramid is encased in thorny vines that grow and retract with the seasons. The weapon carvings are replaced by natural weapons — antlers, claws, fangs, thorns. The red crystal has become a flowering bud that blooms blood-red.
- **Evolution Flavor Text**: "Nature does not need forged weapons. The Verdant Throne showed the cairn what teeth really look like."

---

#### Demonic Kingdoms: Bloodstone Pyre
- **Evolved Effect**: **Sacrificial Fury** — All creatures gain +1 ATK. At the start of your turn, deal 1 damage to all your creatures. Each creature that survives gains +1 additional ATK until end of turn.
- **Destruction Penalty**: All creatures -2 ATK for 1 turn. All creatures take 2 damage.
- **Visual Transformation**: The stone pyramid is obsidian and basalt. The weapon carvings weep blood. The red crystal is a chunk of compressed hellfire. Chains wrap each stone, and at the apex burns a sacrificial pyre that never goes out. Screaming faces are visible in the flames.
- **Evolution Flavor Text**: "The Furnace Lords stacked the cairn with the skulls of the defeated. The weapons carved in stone are now carved in bone."

---

#### Celestial Crusade: Banner of the Crusade
- **Evolved Effect**: **Righteous Arms** — All creatures gain +1 ATK. When you control 3+ creatures (Exalt threshold), all creatures gain an additional +1 ATK (total +2 ATK while Exalt is met).
- **Destruction Penalty**: All creatures -1 ATK for 1 turn. Exalt auras suppressed for 1 turn.
- **Visual Transformation**: The stone cairn is clad in marble and gold. Each weapon carving is a holy weapon — flaming swords, divine lances, sanctified maces. A golden banner with the Celestial emblem flies from the apex. The red crystal is replaced by a radiant star.
- **Evolution Flavor Text**: "The Knights planted their banner in the cairn's summit and declared everything within its shadow a battlefield of the divine."

---

#### The Endless: Grave Marker
- **Evolved Effect**: **Deathbound Fury** — All creatures gain +1 ATK. Whenever a friendly creature dies, all remaining friendly creatures gain +1 ATK permanently.
- **Destruction Penalty**: All creatures -2 ATK for 1 turn. Persist effects suppressed for 1 turn.
- **Visual Transformation**: The cairn is a pile of gravestones, broken headstones, and funerary monuments stacked haphazardly. Each weapon carving is replaced by an epitaph. The red crystal is replaced by a will-o'-wisp that flickers between the stones. Skeletal hands reach from beneath the pile.
- **Evolution Flavor Text**: "Every stone in this cairn is a gravestone. Every name carved upon them died fighting. The dead remember rage best."

---

### 3.6 The Threshold Gate (CM 5, HP 16)

**Neutral Effect**: Creatures gain +1 evolution energy per event.

---

#### Ironwright: Calibration Arch
- **Evolved Effect**: **Optimized Channeling** — Creatures gain +1 evolution energy per event. When an Order event fires, all creatures with Augment modifiers gain +2 evolution energy instead of +1.
- **Destruction Penalty**: Instability set to 10 for 1 turn. All Augment modifiers' attuned effects suppressed for 1 turn.
- **Visual Transformation**: The stone archway is reinforced with iron struts and fitted with calibration instruments. Antennas and sensor arrays extend from the lintel. The shimmer within the gate is now channeled through copper coils. The hash-marks have been replaced by engraved measurement scales.
- **Evolution Flavor Text**: "The engineers measured the gate's output and found it 73% inefficient. They corrected this."

---

#### Fey Courts: Faerie Ring Gate
- **Evolved Effect**: **Seasonal Cycle** — Creatures gain +1 evolution energy per event. Whenever you play a creature with a Bond modifier while this ruin is on the field, that creature enters with +1/+1.
- **Destruction Penalty**: Instability set to 10 for 1 turn. Bond connections severed for 1 turn.
- **Visual Transformation**: The stone pillars are now ancient trees grown into an arch shape, their branches intertwined overhead. The shimmer between them is a curtain of floating petals. Mushroom rings circle the base. The hash-marks are growth rings in the bark.
- **Evolution Flavor Text**: "The Fey do not walk through doors. They grow them."

---

#### Demonic Kingdoms: Hellgate
- **Evolved Effect**: **Infernal Passage** — Creatures gain +1 evolution energy per event. When a Chaos event fires, deal 1 damage to all enemy creatures.
- **Destruction Penalty**: Instability set to 15 for 1 turn. All creatures take 2 damage.
- **Visual Transformation**: The archway is twisted basalt scorched with hellfire. The shimmer is replaced by a literal wall of flame. Demonic runes replace the hash-marks. Chains hang from the lintel, swaying in a heat-wind from beyond. The ground is cracked and smoking.
- **Evolution Flavor Text**: "The Furnace Lords kicked down the door between worlds. What comes through now is not gentle."

---

#### Celestial Crusade: Pearly Gates
- **Evolved Effect**: **Ascension Path** — Creatures gain +1 evolution energy per event. When an Order event fires, all your creatures heal 1 HP.
- **Destruction Penalty**: Instability set to 10 for 1 turn. Exalt auras suppressed for 1 turn.
- **Visual Transformation**: The archway is white marble inlaid with gold, topped by an arch of angelic wings. The shimmer is a veil of pure light. Through the gate, a golden city is faintly visible. The hash-marks are replaced by names — a registry of the worthy.
- **Evolution Flavor Text**: "The Chosen believe the gate leads to paradise. They are half right."

---

#### The Endless: Veil Threshold
- **Evolved Effect**: **Thinned Boundary** — Creatures gain +1 evolution energy per event. Whenever a creature dies (friendly or enemy), gain +1 evolution energy on all your creatures.
- **Destruction Penalty**: Instability set to 10 for 1 turn. Persist effects suppressed for 1 turn.
- **Visual Transformation**: The archway is crumbling stone held together by spectral energy. The shimmer between the pillars is a doorway to grey nothingness. Ghosts occasionally pass through the gate in both directions. The hash-marks are names of the dead.
- **Evolution Flavor Text**: "The Spectres do not need to walk through the gate. They are already on both sides."

---

### 3.7 The Communion Altar (CM 5, HP 16)

**Neutral Effect**: Heal all creatures for 1 HP at end of turn if 3+ creatures.

---

#### Ironwright: Assembly Platform
- **Evolved Effect**: **Mass Production** — At end of turn, if you control 3+ creatures, heal all creatures for 1 HP. If all your creatures have at least 1 Augment modifier, also grant +1 ATK to all creatures until end of next turn.
- **Destruction Penalty**: All temporary buffs stripped. Augment modifier base effects suppressed for 1 turn.
- **Visual Transformation**: The stone altar is a factory floor. The five surrounding stones are replaced by workstations with robotic arms. The channels contain coolant. Assembly lines run between stations. Everything hums with mechanical precision.
- **Evolution Flavor Text**: "The Directorate built assembly lines where the Builders once held hands. Efficiency replaced communion."

---

#### Fey Courts: Grove Heart
- **Evolved Effect**: **Mycelial Network** — At end of turn, if you control 2+ creatures (lower threshold than neutral), heal all creatures for 1 HP. If you control 4+ creatures, heal for 2 HP instead. (Bond synergy: wide boards are rewarded.)
- **Destruction Penalty**: All temporary buffs stripped. Bond connections severed for 1 turn. All creatures lose 1 HP.
- **Visual Transformation**: The stone table has become a massive tree stump with the altar surface visible as growth rings. The channels are mycelial networks glowing blue-white. The surrounding stones are replaced by smaller trees connected by visible root systems. The air is thick with pollen and light.
- **Evolution Flavor Text**: "A forest is not many trees. It is one organism with many stems. The Verdant Throne understood this before anyone."

---

#### Demonic Kingdoms: Ritual Circle
- **Evolved Effect**: **Dark Communion** — At end of turn, if you control 3+ creatures, heal all creatures for 1 HP. You may also sacrifice 2 HP from any creature to deal 3 damage to a random enemy creature.
- **Destruction Penalty**: All temporary buffs stripped. All creatures with Corruption modifiers take 3 damage.
- **Visual Transformation**: The stone table is a ritual altar of black marble. The channels run with blood. Candles of black wax burn at the five surrounding positions. Pentagonal sigils glow on the surface. The air smells of incense and sulfur.
- **Evolution Flavor Text**: "The Bureaucracy convenes here. Their meetings always require a sacrifice."

---

#### Celestial Crusade: Conclave Table
- **Evolved Effect**: **Unified Purpose** — At end of turn, if you control 3+ creatures (Exalt threshold), heal all creatures for 2 HP (upgraded from 1). If you control 5 creatures, also grant Shield to your lowest-HP creature.
- **Destruction Penalty**: All temporary buffs stripped. Exalt auras suppressed for 1 turn. All creatures lose 2 HP.
- **Visual Transformation**: The stone table is a round conference table of white marble with five golden thrones. A chandelier of divine light hangs above. The channels contain holy water. Tapestries depicting the Crusade's victories drape the surrounding stones.
- **Evolution Flavor Text**: "The Crusade does not commune — it commands. But the table still demands five."

---

#### The Endless: Seance Circle
- **Evolved Effect**: **Ghostly Communion** — At end of turn, if you control 3+ creatures, heal all creatures for 1 HP. Additionally, whenever a friendly creature dies while this ruin is on the field, summon a 1/1 Spectre token (0 instability) in the first available slot.
- **Destruction Penalty**: All temporary buffs stripped. Persist effects suppressed for 1 turn. All tokens are destroyed.
- **Visual Transformation**: The stone table is covered in spirit boards and divination tools. The five surrounding stones each have a ghost tethered to them by chains of spectral energy. The channels glow with ectoplasm. Candles float unsupported in a ring above the altar.
- **Evolution Flavor Text**: "Five ghosts sit at the table, one for each stone. They have been sitting there since before the fracture. They will be sitting there long after."

---

### 3.8 The Oblivion Obelisk (CM 6, HP 19)

**Neutral Effect**: Deal 1 damage to random enemy creature at start of opponent's turn.

---

#### Ironwright: Void Projector
- **Evolved Effect**: **Targeted Bombardment** — At the start of your opponent's turn, deal 2 damage to the enemy creature with the highest ATK (if tied, leftmost). Creatures with Augment modifiers are immune to this damage if they are on your side.
- **Destruction Penalty**: Deal 3 damage to your avatar. All Augment modifier base effects suppressed for 1 turn.
- **Visual Transformation**: The black monolith is encased in a targeting system — cross-hairs are projected onto the surface, and a focusing dish is mounted on top. Industrial wiring runs up the sides. The void-like surface is visible through slits in the iron casing. Warning lights flash at the base.
- **Evolution Flavor Text**: "The Directorate could not understand the obelisk. So they pointed it at the enemy and turned it on."

---

#### Fey Courts: Withering Monolith
- **Evolved Effect**: **Entropy Bloom** — At the start of your opponent's turn, deal 1 damage to ALL enemy creatures. Friendly creatures with Bond modifiers are healed for 1 HP at the same time.
- **Destruction Penalty**: Deal 3 damage to your avatar. Bond connections severed for 1 turn.
- **Visual Transformation**: The black stone is split by aggressively growing vines — not healthy vines, but thorny, dark ones with berries that look like eyes. The monolith drains life from enemies and feeds it to the network. Black flowers bloom on its surface, beautiful and poisonous.
- **Evolution Flavor Text**: "Even death feeds the forest. The Hollow Court understood the obelisk better than anyone."

---

#### Demonic Kingdoms: Pillar of Agony
- **Evolved Effect**: **Shared Suffering** — At the start of your opponent's turn, deal 2 damage to a random enemy creature. Deal 1 damage to a random friendly creature (Corruption cost). If the friendly creature has a Corruption modifier, it gains +2 ATK until end of its next turn instead of taking damage.
- **Destruction Penalty**: Deal 5 damage to your avatar (increased self-damage reflects Corruption's double-edged nature).
- **Visual Transformation**: The black stone is streaked with veins of red. Screaming faces press outward from within the surface. Chains embedded in the obelisk connect to hooks in the ground. The base is surrounded by a pool of black liquid. Hellfire burns at the top.
- **Evolution Flavor Text**: "Pain is the only universal language. The Furnace Lords made the obelisk fluent."

---

#### Celestial Crusade: Pillar of Judgment
- **Evolved Effect**: **Divine Retribution** — At the start of your opponent's turn, deal 1 damage to all enemy creatures. If you triggered an Order event on your last chaos roll, deal 2 damage instead.
- **Destruction Penalty**: Deal 3 damage to your avatar. Exalt auras suppressed for 1 turn.
- **Visual Transformation**: The black stone is now white marble with gold veins. A radiant eye is carved at the apex, always watching. Light pours from the eye, searing the unworthy. The base is ringed with divine scripture. The dead ground around the original obelisk has been replaced by a perfect circle of white flowers.
- **Evolution Flavor Text**: "The Chosen purified the obelisk and found judgment beneath the void. It is worse."

---

#### The Endless: Monument of Endings
- **Evolved Effect**: **Inevitable Decay** — At the start of your opponent's turn, deal 1 damage to a random enemy creature. At the start of YOUR turn, deal 1 damage to a random enemy creature as well (damage happens twice per round). Whenever this damage kills a creature, trigger its Persist death effects as though it died on your turn.
- **Destruction Penalty**: Deal 4 damage to your avatar. Persist effects suppressed for 1 turn.
- **Visual Transformation**: The black stone has become translucent — inside, something moves. The ground around the obelisk is covered in a fine bone dust. Spectral hands reach outward from the surface. The temperature drops to freezing nearby. A permanent ring of ghostly mist surrounds the base, and within it, faint shapes of everything the obelisk has ever destroyed can be seen, endlessly dissolving.
- **Evolution Flavor Text**: "The obelisk does not destroy. It remembers the moment of ending and plays it forever."

---

## 4. Balance Design

### 4.1 Deck Construction Rules

**Max ruins in deck: 2**

Justification:
- A 20-card deck running 2 ruins means 18 other cards (creatures + spells). This preserves the game's creature-combat focus.
- Running 2 ruins is a heavy commitment: 2 board slots potentially occupied by non-combatants (1 ruin + any stabilizers), reducing creature board presence from 5 to 3 or fewer.
- With max 1 on field, the second ruin is insurance (replacement if the first is destroyed) or a different ruin for different situations.
- Combined with the existing 0-2 stabilizer recommendation, a player running 2 ruins + 2 stabilizers would have only 1 creature slot. This is theoretically possible but self-punishing, which is correct game design — the system allows it but does not reward it.

**Max ruins on field: 1 (confirmed)**

If a ruin is on the field and the player has another ruin in hand, they CANNOT play the second ruin until the first leaves the field (destroyed or removed by effect). The hand ruin is playable but the board rejects it while another ruin occupies a slot.

### 4.2 CM Cost Curve: Ruins vs. Creatures

Ruins cost the same chaos motes as creatures at the same CM but trade ATK for greatly increased HP and a passive effect. The tradeoff is explicit:

| CM Cost | Creature (Common) Typical Stats | Ruin HP | What You Give Up | What You Get |
|---|---|---|---|---|
| 2 | 2/3 or 3/2 | 7 | ~2 ATK, a blocker | 7 HP structure, passive effect |
| 3 | 3/4 or 4/3 | 10 | ~3 ATK, a blocker | 10 HP structure, passive effect |
| 4 | 4/5 or 5/4 | 13 | ~4 ATK, a blocker | 13 HP structure, passive effect |
| 5 | 5/6 or 6/5 | 16 | ~5 ATK, a blocker | 16 HP structure, passive effect |
| 6 | 6/7 or 7/6 | 19 | ~6 ATK, a blocker | 19 HP structure, passive effect |

The HP values are designed so destroying a ruin requires meaningful investment:
- A 2-cost ruin (7 HP) requires ~2 attacking turns from a mid-sized creature (3 ATK) to destroy.
- A 6-cost ruin (19 HP) requires ~4 attacking turns from a 5-ATK creature, or committing multiple attackers simultaneously.
- Removal spells (if they deal enough damage) can destroy ruins instantly, providing counterplay.

### 4.3 Familiarity Thresholds

**Ruin evolution familiarity threshold: 10 battles**

Justification:
- Creatures require 15/30/50/75 energy for their 4 evolution steps (at ~1.5 energy per game average).
- Ruins have only 1 evolution step. Using the creature's first threshold (15 energy / ~10 games) as a reference, but simplified to a flat "10 battles played with this ruin in the deck" counter.
- This is accessible enough that players evolve ruins relatively quickly, encouraging engagement with the system.
- The ruin must be in the player's deck during each battle to count (same as creature energy). It does NOT need to be drawn or played.

**Energy system for ruins:**
- Ruins use a simplified `battles_played` counter instead of the chaos energy system.
- After 10 battles, the ruin is eligible for evolution.
- Evolution consumes 1 Planar Shard of Uncommon tier (the cheapest, 30 Chaos Dust).
- Shard quality determines the subscription tier choice breadth (2/3/4 options), same as creature evolution.

### 4.4 Economy: How Players Acquire Ruins

**Ruins are earned through gameplay, never purchased with real money.** This follows the core monetization principle in CLAUDE.md.

| Acquisition Method | Details |
|---|---|
| Starter ruin | Each player receives 1 random neutral ruin during onboarding (after faction selection). |
| Card packs | Card packs have a ~15% chance of containing a neutral ruin instead of a third Common creature. |
| Chaos Dust purchase | Any specific neutral ruin can be purchased for 75 Chaos Dust (more than a specific Common creature at 50, reflecting ruins' unique utility). |
| Quest rewards | Certain weekly quests reward a random neutral ruin. |
| Season milestones | Season reward tracks include specific ruins at certain thresholds. |

**No evolved ruins in the shop.** Players must evolve ruins themselves. This ensures every evolved ruin represents player investment.

### 4.5 Matchup Impact: How Ruins Shift the 5-Faction Meta

Ruins introduce a new strategic dimension that affects each faction differently based on their core mechanic:

| Faction | Best Ruin Synergies | Meta Impact |
|---|---|---|
| **Ironwright (Augment)** | Reinforced Bastion (+HP for Augmented creatures), Siege Monument (+ATK scaling), Probability Engine (card selection for finding more Augment creatures) | Augment builds stack modifiers on individual creatures. Ruins that buff stats compound with Augment scaling. Ironwright becomes slightly stronger in midrange because ruins protect their investment in individual creatures. |
| **Fey Courts (Bond)** | Grove Heart (wide-board healing), Living Foundation (on-entry bonuses), Thornguard Menhir (Piercing on Bond creatures) | Bond wants many creatures on the field. Ruins take a board slot, which is a real cost for wide-board strategies. But the synergy effects (lower Exalt-like thresholds, on-entry bonuses) partially compensate. Fey must carefully choose when a ruin is worth a creature slot. |
| **Demonic Kingdoms (Corruption)** | Hellmouth Basin (mana from self-damage), Bloodstone Pyre (+ATK from self-damage), Ritual Circle (sacrifice for removal) | Corruption's self-damage mechanic means ruins that convert self-damage into advantages are very powerful. Demonic Kingdoms gains the most offensive value from ruins, but the destruction penalties are also harshest (additional damage to own creatures). High risk, high reward. |
| **Celestial Crusade (Exalt)** | Consecrated Dais (+HP at Exalt threshold), Banner of the Crusade (+ATK at Exalt threshold), Conclave Table (Shield at 5 creatures) | Exalt requires board presence thresholds (3+ creatures). A ruin takes a slot but does NOT count as a creature for Exalt thresholds (see Section 5). This is a significant cost for Celestial. However, Exalt-enhanced ruin effects that activate at 3+ creatures are powerful enough to justify the slot investment. Celestial must run efficient cheap creatures alongside ruins. |
| **The Endless (Persist)** | Grave Marker (permanent +ATK on death), Seance Circle (token generation on death), Monument of Endings (double-tick damage), Soulwell (mana from deaths) | Persist feeds on death. Many Endless ruin evolutions generate value when things die, which is Persist's entire identity. The Endless gets the most synergistic ruin effects because death is constant in games. Very strong, but offset by the fact that Persist effects being suppressed by destruction penalties is devastating when it happens. |

**Overall meta impact:** Ruins slow the game slightly by providing sustain and value generation, favoring midrange and control strategies. Aggro decks (fast Demonic Corruption rushes, low-curve Chaos swarms) must decide whether to spend resources destroying the opponent's ruin or pushing face damage. This is a healthy tension — it gives control archetypes another tool without eliminating aggro's viability.

---

## 5. Turn Structure Integration

### 5.1 When Can a Ruin Be Played?

Ruins are played during **Phase 5: Main Phase**, exactly like creatures and stabilizers. Playing a ruin costs chaos motes equal to the ruin's CM cost.

### 5.2 Does Playing a Ruin Use Your Card Play for the Turn?

No. There is no "one card play per turn" rule in Chaos Creatures. Players can play as many cards as their mana allows during the Main Phase. Playing a ruin simply costs mana and occupies a board slot.

### 5.3 Can Creatures Attack Ruins Directly?

**Yes.** During Phase 6 (Declare Attackers), the active player may declare attackers. During Phase 7 (Assign Blockers), the defending player assigns blockers. **Any attacker that is NOT blocked deals damage to the defending player's HP** — this is existing behavior.

Ruins introduce a new targeting option: **The attacking player may designate specific attackers as targeting an opponent's ruin during Phase 6.** This works as follows:

1. During Declare Attackers, the active player selects which creatures attack. For each attacker, they choose whether it targets the opponent's HP (default) or the opponent's ruin (if one exists).
2. Attackers targeting the ruin are visually marked with a different indicator (e.g., a ruin icon instead of a face icon).
3. During Assign Blockers, the defending player may assign blockers to any attacker, regardless of whether it targets face or ruin.
4. Unblocked attackers targeting the ruin deal their ATK as damage to the ruin's HP.
5. Unblocked attackers targeting face deal damage to the player's HP as normal.
6. If the ruin reaches 0 HP, it is destroyed and its destruction penalty fires immediately.

**Key rule:** Taunt's forced-attack obligation does NOT require attacking a ruin. Taunt forces attackers to be declared, not where they are directed. The attacker can choose to target the ruin or face; Taunt just ensures they attack at all.

**Key rule:** Taunt's forced-block obligation works normally. A Taunt creature must block if it can, regardless of whether the attacker is targeting face or ruin. If a Taunt creature blocks an attacker that was targeting the ruin, the attacker deals damage to the Taunt creature (not the ruin), and the ruin is unaffected.

### 5.4 Can Ruins Block?

**No.** Ruins have 0 ATK and cannot participate in combat as blockers. They cannot be assigned as blockers during Phase 7. They are structures, not combatants.

### 5.5 Do Ruins Count for Board-Wide Effects?

| Mechanic | Does the Ruin Count? | Rationale |
|---|---|---|
| Board slot occupancy | **Yes** — ruins take 1 of 5 slots | Physical board presence |
| Exalt threshold ("3+ creatures") | **No** — ruins are not creatures | Exalt counts creatures only; ruins are structures |
| Bond modifier synergy ("for each creature with Bond") | **No** — ruins are not creatures | Bond references creatures explicitly |
| Corruption self-damage ("deal 1 to this creature") | **N/A** — ruins don't have Corruption modifiers | Corruption is a creature mechanic |
| Augment scaling ("per Augment on this creature") | **N/A** — ruins don't have modifiers in the creature sense | Augment counts modifiers on a single creature |
| "All friendly creatures" effects (events, spells, buffs) | **No** — ruins are not creatures | Effects targeting "creatures" skip ruins |
| "All enemy creatures" damage (Wildfire, Upheaval) | **No** — ruins are not creatures | Chaos events targeting "creatures" skip ruins |
| Direct damage spells targeting "any creature" | **No** — ruins are not creatures. Spells that say "any creature" cannot target ruins. A future spell could specify "any creature or ruin" if needed. | Keeps existing spell targeting clean |
| Instability calculation | **Yes** — ruins contribute their base_instability to the player's instability | Ruins are on the board and affect the chaos environment |
| "Cards on field" count | **Yes** — for any generic "cards on the board" counting | Ruins are cards on the board |

**Design intent:** Ruins explicitly do NOT count as creatures for any mechanic that references "creatures." This preserves the cost of using a board slot for a ruin — you lose a creature slot AND the ruin doesn't satisfy creature-count thresholds. The only exceptions are physical board presence (slot occupancy) and instability contribution.

### 5.6 What Happens If a Player Wants to Play Another Ruin?

**Max 1 ruin on field at a time.** If a player already has a ruin on the field, the second ruin in their hand is not playable. The UI dims the ruin card in hand and shows a tooltip: "Only 1 ruin on field at a time."

If the first ruin is destroyed, the player can play the second ruin on a subsequent turn during the Main Phase (assuming they have mana and a board slot).

The player CANNOT voluntarily destroy their own ruin to replace it. Ruins can only leave the field by being destroyed by the opponent (through creature attacks or effects) or by effects that destroy cards on the field.

### 5.7 Ruin Targeting by Spells and Effects

**Current spells cannot target ruins** because existing spell targeting uses `TargetType` values that reference "creatures." Ruins are not creatures.

If needed, the TargetType enum can be extended to include ruin-specific targets:

```
FRIENDLY_RUIN | ENEMY_RUIN | ANY_RUIN
```

However, at launch, no spells specifically target ruins. Ruins can only be damaged by:
1. Creature attacks (opponent assigns attackers to target the ruin)
2. Effects that deal damage to "everything on the board" (if any are added)
3. Future spells that explicitly reference ruin targets

This means ruins are relatively safe from removal except through sustained creature combat, which is the intended counterplay — commit board resources to destroying the ruin, or ignore it and deal with its effect.

### 5.8 Ruin Start-of-Turn Effects

Ruin passive effects that trigger "at the start of your turn" resolve during **Phase 1: Start of Turn**, alongside other board effects (Corruption self-damage, stabilizer auras, modifier triggers). Ruins resolve in board-slot order, left-to-right, intermixed with creature effects by slot position.

### 5.9 Ruin End-of-Turn Effects

Ruin passive effects that trigger "at the end of your turn" resolve during **Phase 9: End of Turn**, before "this turn" buffs expire.

### 5.10 Destruction Penalty Timing

When a ruin is destroyed (reaches 0 HP), the destruction penalty fires **immediately** at the point of destruction:
- If destroyed during combat (Phase 8), the penalty fires after combat resolution completes (after step 10: check for win condition), before Phase 9 (End of Turn).
- If destroyed by a start-of-turn effect, the penalty fires immediately during Phase 1, before Phase 2 (Chaos Roll).
- The penalty lasts "for 1 turn" — it persists until the end of the controlling player's NEXT turn (not the current turn).

### 5.11 Ruin Instability

Ruins contribute their `base_instability` to the player's instability calculation, just like creatures. This is included in the sum:

```
player_instability = avatar_instability_modifier
                   + sum(creature_instability for each creature on board)
                   + sum(ruin_instability for each ruin on board)
```

Most ruins have low instability (0-2), but this still matters. Playing a War Cairn (instability 2) adds 2 to your instability, which slightly shifts the chaos roll probability. This is an additional cost of running ruins that players must consider.

---

## 6. Effect Pool Design

Each ruin evolution presents 2/3/4 options based on subscription tier. Below are the full option pools for each faction evolution of each ruin.

### Design Principles

1. **No obvious best pick.** Each option should appeal to a different play style (Order-leaning, Chaos-leaning, or hybrid).
2. **Faction mechanic integration.** At least 2 of the options per pool should directly reference the faction mechanic.
3. **Destruction penalties scale with effect power.** Stronger effects have harsher penalties.
4. **Options should create meaningful deck-building choices.** The chosen effect should influence which creatures and strategies the player builds around.

### Pool Structure

For each ruin x faction combination, there are **4 evolved effect options** (the maximum shown to Top-tier subscribers). Free players see options 1 and 2. Mid-tier players see options 1, 2, and 3. Top-tier players see all 4.

The option pools for all 40 combinations follow. For brevity, each option is listed with its effect and destruction penalty. The previously detailed "primary" variants in Section 3 correspond to Option 1 in each pool.

---

### 6.1 Resonance Spire Pools

**Ironwright Options:**
1. **Repair Pylon** — Heal 2 to most damaged; if Augmented, grant Shield. Penalty: Augment base effects suppressed 1 turn.
2. **Diagnostic Beacon** — Heal 1 to most damaged; if Augmented, gain +1 ATK permanently. Penalty: All creatures -1 ATK for 1 turn.
3. **Emergency Protocol** — Heal 3 to most damaged creature. No faction synergy. Penalty: All creatures take 2 damage.
4. **Redundancy Node** — Heal 1 to ALL creatures (not just most damaged). Penalty: All creatures take 1 damage, Augment attuned effects suppressed 1 turn.

**Fey Courts Options:**
1. **Heartwood Spire** — Heal 2 to most damaged; if 2+ Bond creatures, heal 1 to all. Penalty: Bond severed 1 turn.
2. **Moonbloom Spire** — Heal 1 to most damaged; that creature gains +1 HP permanently. Penalty: All creatures lose 1 max HP.
3. **Dewdrop Spire** — Heal 2 to a random creature; if it has Bond, heal 1 additional. Penalty: Random creature loses 2 HP.
4. **Root Pulse Spire** — Heal 1 to most damaged. Whenever a Bond modifier triggers, heal that creature for 1 additional HP. Penalty: Bond severed 1 turn, all creatures take 1 damage.

**Demonic Kingdoms Options:**
1. **Bloodfire Spire** — Heal 2 to most damaged; deal 1 to lowest HP; if Corruption, +2 ATK instead. Penalty: Corruption creatures take 2 damage.
2. **Leech Spire** — Heal 2 to most damaged; deal 1 damage to a random enemy creature. Penalty: Deal 2 to avatar.
3. **Hellspark Spire** — Heal 1 to most damaged; gain +1 chaos mote. Penalty: Lose 2 chaos motes, take 1 avatar damage.
4. **Agony Spire** — Heal 3 to most damaged; that creature takes 1 damage at end of turn. Penalty: All creatures take 2 damage.

**Celestial Crusade Options:**
1. **Sanctified Beacon** — Heal 2 to most damaged; if Order event, heal 2 to ALL instead. Penalty: Exalt suppressed 1 turn.
2. **Mercy Spire** — Heal 1 to most damaged; grant Ward to that creature until end of turn. Penalty: All creatures lose Ward.
3. **Radiant Spire** — Heal 2 to most damaged; if 3+ creatures (Exalt), grant +1 HP permanently to healed creature. Penalty: Exalt suppressed 1 turn, all creatures lose 1 HP.
4. **Spire of Grace** — Heal 1 to ALL creatures. If Order event last roll, heal 2 to ALL instead. Penalty: All creatures lose 2 HP.

**The Endless Options:**
1. **Dirge Spire** — Heal 2 to most damaged; on creature death, deal 1 to random enemy. Penalty: Persist suppressed 1 turn.
2. **Wail Spire** — Heal 1 to most damaged; on creature death, heal 2 to another random friendly creature. Penalty: Persist suppressed 1 turn, random creature takes 2 damage.
3. **Echoing Spire** — Heal 2 to most damaged; that creature gains +1 ATK until end of turn. Penalty: All creatures -1 ATK for 1 turn.
4. **Tomb Spire** — Heal 1 to most damaged; whenever a creature dies, reduce the next creature you play's mana cost by 1 (this turn only). Penalty: Persist suppressed 1 turn, lose 2 mana.

---

### 6.2-6.8 Remaining Ruin Pools

The remaining 7 ruin x 5 faction pools follow the same pattern. For each pool, Option 1 is the "primary" variant detailed in Section 3. Options 2-4 are alternatives that emphasize different aspects of the faction mechanic or trade faction synergy for raw power.

**Summary of Option Design Philosophy Per Ruin:**

| Ruin | Option 1 (Primary) | Option 2 | Option 3 | Option 4 |
|---|---|---|---|---|
| Anchor Plinth | Faction-scaled HP buff | On-entry bonus | Conditional large buff | Broad but weaker buff |
| Mote Well | Faction mana synergy | Conditional double mana | Mana + minor damage | Mana + minor heal |
| Sight Glass | Faction scry synergy | Enemy deck vision | Card draw trigger | Card selection + buff |
| War Cairn | Faction-scaled ATK buff | Conditional keyword grant | ATK + self-damage tradeoff | Broad ATK + condition |
| Threshold Gate | Faction energy synergy | Energy + stat bonus on entry | Energy + event damage | Energy + healing |
| Communion Altar | Faction-enhanced group heal | Lower threshold heal | Heal + sacrifice option | Heal + token generation |
| Oblivion Obelisk | Faction-enhanced enemy damage | Targeted high damage | AoE damage | Damage + death synergy |

Each option pool is designed so that:
- **Option 1** has the strongest faction synergy but moderate raw power.
- **Option 2** has a more defensive or utility-oriented faction interaction.
- **Option 3** has less faction synergy but higher raw power (good for players who want the ruin's base effect more than the faction interaction).
- **Option 4** has a unique or unusual interaction that creates novel deck-building possibilities.

Free players always see Options 1 and 2 (guaranteed faction synergy in both choices). Mid-tier players additionally see Option 3 (a non-faction option for flexibility). Top-tier players see all 4, including the unique Option 4.

---

## 7. Art Prompt Templates

All prompts follow the existing v5 style anchor system defined in `03-prompt-templates.md`. The base prefix for all card art is prepended automatically. These templates define the ruin-specific components.

### 7.1 Neutral Ruin Base Style

```
RUIN_NEUTRAL_PREFIX = "ancient planar ruins structure, palette knife oil painting, thick impasto brushstrokes, heavy crosshatching in shadows, muted earth tones with pale otherworldly glow, mysterious architecture of unknown civilization, mix of carved stone and crystalline planar materials, partially ruined but structurally stable, no figures present, no creatures, architectural subject only"
```

**Composition guidelines for neutral ruins:**
- Use `ENVIRONMENTAL_WIDE` or `ENVIRONMENTAL_ESTABLISHING` compositions (not portrait compositions).
- Camera angle: low angle looking up at the ruin, or wide establishing shot showing the ruin in context of the Plane of Chaos landscape.
- Lighting: diffuse ambient light from an unclear source, with the ruin's own glow as a secondary light. No strong directional shadows.
- Color palette: greys, pale blues, faded ambers, weathered stone tones. The ruin's magical elements (crystals, glowing channels, shimmering surfaces) provide the only saturated color.

**Per-ruin neutral prompts:**

```
RESONANCE_SPIRE_NEUTRAL = "{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, slender crystalline tower ten feet tall rising from cracked stone foundation, crystal pulses with soft white-blue light in rhythmic waves, geometric spiral engravings on surface, worn smooth stone base, pale dust motes drifting upward defying gravity, rift valley background with broken terrain"

ANCHOR_PLINTH_NEUTRAL = "{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, broad low stone platform three stepped tiers with flat altar top, concentric circle etchings glowing faint amber, top surface smooth as still water reflecting sky, six broken pillar stumps around edge, heavy still air atmosphere, reality storms parting in background"

MOTE_WELL_NEUTRAL = "{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, circular obsidian-veined marble basin five feet across two feet deep, slowly swirling violet luminous liquid inside, small light motes rising from surface, interlocking triangular patterns carved on rim, scorched earth in perfect circle around basin, dark mysterious atmosphere"

SIGHT_GLASS_NEUTRAL = "{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, great amber crystal lens six feet diameter mounted in tarnished silver alloy frame, frame on three curving root-like legs, world appears differently through lens with shifted colors, single crack running edge to center sealed with gold substance, rift intersection background"

WAR_CAIRN_NEUTRAL = "{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, rough pyramid of stacked carved stones eight feet tall, each stone carved with different weapon in bas-relief, topmost stone single large crystal glowing deep angry red, stones vibrating faintly, ancient battlefield background with scattered unknown weapons"

THRESHOLD_GATE_NEUTRAL = "{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, freestanding stone archway twelve feet tall, two massive pillar-stones with carved lintel of spiraling cosmic patterns, shimmering membrane in archway space not a portal, thousands of tiny hash-marks covering pillars, strange lichen at base, edge of stability pocket background"

COMMUNION_ALTAR_NEUTRAL = "{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, circular stone table seven feet across carved from single pale grey stone, surface divided into five sections by shallow channels radiating from center like star, traces of luminous blue substance in dried channels, five smaller hand-carved stones surrounding at equal intervals, faint shimmer when multiple figures near"

OBLIVION_OBELISK_NEUTRAL = "{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, single monolithic pillar of featureless black stone fifteen feet tall perfectly smooth, no carvings no seams, surface absorbs light deepening shadows, dead ground around base no lichen no dust, cold beyond temperature atmosphere, appears to have infinite depth at certain angles, void-like quality"
```

### 7.2 Faction Evolution Style Overlays

When a ruin evolves into a faction variant, the prompt combines the ruin's neutral base description with a faction-specific transformation overlay.

#### Ironwright (Brutalist Space-Industrial)

```
RUIN_IRONWRIGHT_OVERLAY = "brutalist industrial transformation, welded iron plating and heavy rivets, hydraulic mechanisms and conduit pipes, reactor blue energy glow through copper coils, warning indicators and measurement scales, rebar reinforcement, industrial scaffolding, concrete and cold iron additions, Piranesi-inspired industrial architecture, John Martin dramatic scale"
```

#### Fey Courts (Bioluminescent Nature)

```
RUIN_FEY_OVERLAY = "living nature transformation, overgrown with flowering vines and bioluminescent moss, root systems splitting stone, mycelial networks glowing blue-white, natural canopy of intertwined branches, fireflies and floating pollen, mushroom rings at base, Arthur Rackham twisted tree forms, Edmund Dulac ethereal color palette"
```

#### Demonic Kingdoms (Hellfire and Obsidian)

```
RUIN_DEMONIC_OVERLAY = "hellfire corruption transformation, obsidian growths and basalt additions, blood-red runes burned into every surface, chains wrapping structure, hellfire burning at base and apex, molten elements and cracked scorched ground, screaming faces pressing from within surfaces, Hieronymus Bosch nightmare imagery, visceral and oppressive atmosphere"
```

#### Celestial Crusade (Divine Gold and Marble)

```
RUIN_CELESTIAL_OVERLAY = "divine purification transformation, white marble and gold inlay additions, angelic statuary and six-winged seraphim carvings, golden inscriptions in divine script, radiant halo of holy light, dove-like energy constructs, golden banners and tapestries, Gustave Dore biblical grandeur, William Blake visionary luminosity"
```

#### The Endless (Spectral and Necromantic)

```
RUIN_ENDLESS_OVERLAY = "spectral haunting transformation, bone and skull additions embedded in structure, ghostly teal translucent energy, spectral mist seeping from base, necrotic purple glowing symbols, ghostly hands reaching from ground, ectoplasmic residue in channels, Gustave Dore Inferno atmosphere, Francisco Goya Black Paintings darkness, perpetual cold and mourning tone"
```

### 7.3 Full Prompt Assembly

For a specific evolved ruin, the prompt is assembled as:

```
{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, {SPECIFIC_RUIN_DESCRIPTION}, {FACTION_OVERLAY}, {SPECIFIC_TRANSFORMATION_DETAILS}
```

Example — Ironwright evolution of the Resonance Spire:

```
{STYLE_ANCHOR} {RUIN_NEUTRAL_PREFIX}, slender crystalline tower ten feet tall rising from cracked stone foundation, crystal pulses with soft white-blue light, {RUIN_IRONWRIGHT_OVERLAY}, crystalline tower encased in welded iron plating bolted with heavy rivets, hydraulic repair arms extending from sides, crystal glow channeled through conduit pipes into directed beam, industrial coolant vents hissing from base, circuit-like schematics etched in acid over geometric engravings
```

### 7.4 Art Specifications

| Property | Neutral Ruins | Evolved Ruins |
|---|---|---|
| Resolution | 1024x1024 | 1024x1024 |
| Model | FLUX Kontext Pro | FLUX Kontext Pro |
| Generation method | Text-to-image (new generation) | Image-to-image (neutral art as reference, ~0.6 transformation strength) |
| Output format | PNG, transparent background | PNG, transparent background |
| Total images needed | 8 | 40 |

**Evolution art generation:** Evolved ruin art uses the neutral ruin's art as the input reference for img2img generation, with ~0.6 transformation strength (moderate — enough to clearly show the faction claiming the ruin while preserving the underlying structure). This is the same FLUX Kontext img2img pipeline used for creature evolution.

---

## 8. Data Model Specification

### 8.1 New Enums

```typescript
// Add to existing CardType enum
CardType: CREATURE | SPELL | STABILIZER | PLANAR_RUIN

// New enum for ruin evolution state
RuinEvolutionState: NEUTRAL | EVOLVED

// New target types (extend existing TargetType)
TargetType: ... | FRIENDLY_RUIN | ENEMY_RUIN | ANY_RUIN
```

### 8.2 Ruin Template

Base ruin definitions — game content, not player data. Defines the 8 neutral ruins.

```typescript
RuinTemplate {
  id:                  string           // UUID — unique ruin template ID
  name:                string           // "The Resonance Spire", "The Anchor Plinth", etc.
  card_type:           'PLANAR_RUIN'    // Always PLANAR_RUIN

  // --- Base stats ---
  base_health:         int              // HP at neutral state (CM x 3 + 1)
  mana_cost:           int              // Chaos mote cost to play (2-6). Fixed forever.
  base_instability:    int              // 0-2. Contributes to player instability while on field.

  // --- Neutral effect ---
  neutral_effect_id:   string           // FK → RuinEffect (the neutral passive effect)
  neutral_penalty_id:  string           // FK → RuinEffect (the neutral destruction penalty)

  // --- AI generation metadata ---
  art_prompt:          string           // Full prompt used to generate neutral art
  art_url:             string           // CDN URL for neutral ruin art
  flavor_text:         string           // Neutral discovery lore
  visual_description:  string           // Detailed visual description for art generation

  // --- Pipeline metadata ---
  batch_id:            string           // Which generation batch produced this
  approved_at:         timestamp        // When QA approved
  approved_by:         string           // QA approver ID

  // --- Familiarity threshold ---
  evolution_battles_required: int       // 10 (battles with ruin in deck before evolution eligible)
}
```

### 8.3 Ruin Effect

Defines both neutral effects and faction-evolved effects. Used for passive benefits and destruction penalties.

```typescript
RuinEffect {
  id:                  string           // UUID
  ruin_template_id:    string           // FK → RuinTemplate

  // --- Context ---
  effect_context:      RuinEffectContext // PASSIVE | DESTRUCTION_PENALTY
  faction_id?:         string           // FK → Faction. NULL for neutral effects.
  evolution_state:     RuinEvolutionState // NEUTRAL | EVOLVED

  // --- Effect definition ---
  name:                string           // "Harmonic Pulse", "Feedback Surge", etc.
  description:         string           // Human-readable effect text
  effect:              Effect           // Uses the same Effect schema as modifiers/abilities/spells (Section 7 of 02-card-data-model.md)

  // --- Timing ---
  trigger_phase:       RuinTriggerPhase // PASSIVE (always on) | START_OF_TURN | END_OF_TURN | ON_EVENT | ON_CREATURE_DEATH | ON_CREATURE_PLAY | ON_OPPONENT_TURN_START | IMMEDIATE (for destruction penalties)
  duration:            Duration         // WHILE_ON_FIELD (for passives) | THIS_TURN (for penalties) | PERMANENT (for permanent grants)

  // --- Conditions ---
  condition?:          Condition         // Optional condition (e.g., CREATURE_COUNT_GTE(3) for Communion Altar)
  faction_mechanic?:   FactionMechanic  // AUGMENT | BOND | CORRUPTION | EXALT | PERSIST — which faction mechanic this effect references

  // --- Visual ---
  vfx_id?:             string           // Visual effect to play when this effect triggers
}
```

```typescript
// New enums
RuinEffectContext:   PASSIVE | DESTRUCTION_PENALTY
RuinTriggerPhase:   PASSIVE | START_OF_TURN | END_OF_TURN | ON_EVENT
                  | ON_CREATURE_DEATH | ON_CREATURE_PLAY | ON_OPPONENT_TURN_START
                  | IMMEDIATE
```

### 8.4 Ruin Evolution Option

Defines the 2/3/4 options presented during ruin evolution. Each option is a pair: (evolved passive effect, evolved destruction penalty).

```typescript
RuinEvolutionOption {
  id:                  string           // UUID
  ruin_template_id:    string           // FK → RuinTemplate
  faction_id:          string           // FK → Faction — which faction this option belongs to

  // --- Option metadata ---
  option_index:        int              // 1-4 (which option this is in the pool)
  // Option 1-2: shown to Free tier. Option 1-3: shown to Mid tier. Option 1-4: shown to Top tier.

  // --- Evolved effect ---
  evolved_name:        string           // "Repair Pylon", "Heartwood Spire", etc.
  evolved_effect_id:   string           // FK → RuinEffect (passive effect)
  evolved_penalty_id:  string           // FK → RuinEffect (destruction penalty)

  // --- Art ---
  evolved_art_prompt:  string           // Prompt for generating evolved art
  evolved_art_url:     string           // CDN URL for evolved ruin art
  evolved_flavor_text: string           // Evolution flavor text

  // --- Visual transformation description ---
  visual_transformation: string         // Detailed description of how the ruin's appearance changes
}
```

### 8.5 Player Ruin

Player-owned ruin instances. Tracks ownership, evolution state, and familiarity.

```typescript
PlayerRuin {
  id:                  string           // UUID — unique player ruin instance ID
  owner_id:            string           // FK → Player
  ruin_template_id:    string           // FK → RuinTemplate

  // --- Evolution state ---
  evolution_state:     RuinEvolutionState // NEUTRAL | EVOLVED
  faction_id?:         string           // FK → Faction. NULL if neutral. Set when evolved.
  chosen_option_id?:   string           // FK → RuinEvolutionOption. NULL if neutral. Set when evolved.

  // --- Current display data ---
  current_name:        string           // Template name if neutral; evolved name if evolved
  current_art_url:     string           // Neutral art if neutral; evolved art if evolved
  current_flavor_text: string           // Neutral lore if neutral; evolved flavor text if evolved

  // --- Familiarity ---
  battles_played:      int              // Number of battles this ruin has been in the player's deck
  evolution_ready:     bool             // Computed: battles_played >= template.evolution_battles_required AND evolution_state == NEUTRAL

  // --- Metadata ---
  created_at:          timestamp
  evolved_at?:         timestamp        // When evolution occurred
  is_favorite:         bool             // Player-set flag, prevents accidental dismantle

  // --- Deck membership ---
  in_deck_ids:         string[]         // List of Deck IDs this ruin is currently in
}
```

### 8.6 Battle State Extension

The existing `BattlePlayer` type needs modification to support ruins on the battlefield.

```typescript
// Extend BattlePlayer
BattlePlayer {
  // ... existing fields ...

  board:               (BattleCreature | BattleRuin | null)[5]  // 5 slots, each null, creature, OR ruin
  ruin_on_field:       bool             // Convenience flag: true if any slot contains a BattleRuin
}

// New battle-state type
BattleRuin {
  instance_id:         string           // FK → PlayerRuin
  template_id:         string           // FK → RuinTemplate
  name:                string           // Current name (neutral or evolved)

  // --- Stats ---
  health:              int              // Current HP (damage reduces this)
  max_health:          int              // Max HP from template

  // --- State ---
  is_alive:            bool             // false when health <= 0
  board_slot:          int              // 0-4, which slot this ruin occupies

  // --- Instability ---
  instability_value:   int              // Base instability from template (no modifiers on ruins)

  // --- Effects ---
  passive_effect:      RuinEffect       // Active passive effect (neutral or evolved)
  destruction_penalty: RuinEffect       // Penalty that fires if destroyed

  // --- Evolution state ---
  evolution_state:     RuinEvolutionState
  faction_id?:         string

  // --- Visual ---
  art_url:             string
}
```

### 8.7 Deck Validation Updates

```typescript
// Updated validation rules for Deck
Deck.validation_rules:
  - card_entries must contain exactly 20 cards (sum of all quantities)
  - All card instances must belong to owner_id
  - All creature/spell CardInstances must have template.faction_id == deck.faction_id
  - All evolved PlayerRuins must have faction_id == deck.faction_id (neutral ruins are allowed in any faction deck)
  - Max 2 copies of any creature/spell template
  - Legendary-tier cards: max 2 total, max 1 copy each
  - avatar.faction_id == deck.faction_id
  // NEW:
  - Max 2 ruins in deck (across all ruin types)
  - Ruin entries reference PlayerRuin instances, not CardInstances
  - Evolved ruins must match deck faction
```

### 8.8 Database Tables (SQL)

```sql
-- Ruin templates (game content)
CREATE TABLE ruin_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  base_health INT NOT NULL CHECK (base_health > 0),
  mana_cost INT NOT NULL CHECK (mana_cost BETWEEN 1 AND 10),
  base_instability INT NOT NULL DEFAULT 0 CHECK (base_instability BETWEEN 0 AND 5),
  neutral_effect_id UUID NOT NULL REFERENCES ruin_effects(id),
  neutral_penalty_id UUID NOT NULL REFERENCES ruin_effects(id),
  art_prompt TEXT NOT NULL,
  art_url TEXT NOT NULL,
  flavor_text TEXT NOT NULL,
  visual_description TEXT NOT NULL,
  evolution_battles_required INT NOT NULL DEFAULT 10,
  batch_id UUID,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ruin effects (both neutral and evolved)
CREATE TABLE ruin_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruin_template_id UUID NOT NULL REFERENCES ruin_templates(id) ON DELETE CASCADE,
  effect_context TEXT NOT NULL CHECK (effect_context IN ('PASSIVE', 'DESTRUCTION_PENALTY')),
  faction_id UUID REFERENCES factions(id),  -- NULL for neutral
  evolution_state TEXT NOT NULL CHECK (evolution_state IN ('NEUTRAL', 'EVOLVED')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  effect JSONB NOT NULL,  -- Serialized Effect object
  trigger_phase TEXT NOT NULL CHECK (trigger_phase IN (
    'PASSIVE', 'START_OF_TURN', 'END_OF_TURN', 'ON_EVENT',
    'ON_CREATURE_DEATH', 'ON_CREATURE_PLAY', 'ON_OPPONENT_TURN_START', 'IMMEDIATE'
  )),
  duration TEXT NOT NULL CHECK (duration IN ('WHILE_ON_FIELD', 'THIS_TURN', 'PERMANENT', 'UNTIL_NEXT_TURN')),
  condition JSONB,  -- Serialized Condition object, nullable
  faction_mechanic TEXT CHECK (faction_mechanic IN ('AUGMENT', 'BOND', 'CORRUPTION', 'EXALT', 'PERSIST')),
  vfx_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ruin evolution options (faction-specific evolution paths)
CREATE TABLE ruin_evolution_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruin_template_id UUID NOT NULL REFERENCES ruin_templates(id) ON DELETE CASCADE,
  faction_id UUID NOT NULL REFERENCES factions(id),
  option_index INT NOT NULL CHECK (option_index BETWEEN 1 AND 4),
  evolved_name TEXT NOT NULL,
  evolved_effect_id UUID NOT NULL REFERENCES ruin_effects(id),
  evolved_penalty_id UUID NOT NULL REFERENCES ruin_effects(id),
  evolved_art_prompt TEXT NOT NULL,
  evolved_art_url TEXT,  -- May be NULL until art is generated
  evolved_flavor_text TEXT NOT NULL,
  visual_transformation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ruin_template_id, faction_id, option_index)
);

-- Player ruin collection
CREATE TABLE player_ruins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ruin_template_id UUID NOT NULL REFERENCES ruin_templates(id),
  evolution_state TEXT NOT NULL DEFAULT 'NEUTRAL' CHECK (evolution_state IN ('NEUTRAL', 'EVOLVED')),
  faction_id UUID REFERENCES factions(id),  -- NULL if neutral
  chosen_option_id UUID REFERENCES ruin_evolution_options(id),  -- NULL if neutral
  current_name TEXT NOT NULL,
  current_art_url TEXT NOT NULL,
  current_flavor_text TEXT NOT NULL,
  battles_played INT NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evolved_at TIMESTAMPTZ
);

-- Deck-ruin junction table (replaces in_deck_ids array)
CREATE TABLE deck_ruins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  player_ruin_id UUID NOT NULL REFERENCES player_ruins(id) ON DELETE CASCADE,
  UNIQUE(deck_id, player_ruin_id)
);

-- Index for fast lookups
CREATE INDEX idx_player_ruins_owner ON player_ruins(owner_id);
CREATE INDEX idx_player_ruins_template ON player_ruins(ruin_template_id);
CREATE INDEX idx_deck_ruins_deck ON deck_ruins(deck_id);
CREATE INDEX idx_deck_ruins_ruin ON deck_ruins(player_ruin_id);
CREATE INDEX idx_ruin_effects_template ON ruin_effects(ruin_template_id);
CREATE INDEX idx_ruin_evolution_options_template ON ruin_evolution_options(ruin_template_id);
CREATE INDEX idx_ruin_evolution_options_faction ON ruin_evolution_options(faction_id);
```

### 8.9 RLS Policies

```sql
-- ruin_templates: public read, no player writes
ALTER TABLE ruin_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ruin_templates_read" ON ruin_templates FOR SELECT USING (true);

-- ruin_effects: public read, no player writes
ALTER TABLE ruin_effects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ruin_effects_read" ON ruin_effects FOR SELECT USING (true);

-- ruin_evolution_options: public read, no player writes
ALTER TABLE ruin_evolution_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ruin_evolution_options_read" ON ruin_evolution_options FOR SELECT USING (true);

-- player_ruins: owner read/write
ALTER TABLE player_ruins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_ruins_read" ON player_ruins FOR SELECT
  USING (owner_id = auth.uid());
CREATE POLICY "player_ruins_insert" ON player_ruins FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "player_ruins_update" ON player_ruins FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "player_ruins_delete" ON player_ruins FOR DELETE
  USING (owner_id = auth.uid());

-- deck_ruins: owner access via deck ownership
ALTER TABLE deck_ruins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deck_ruins_read" ON deck_ruins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM decks WHERE decks.id = deck_ruins.deck_id AND decks.owner_id = auth.uid()
  ));
CREATE POLICY "deck_ruins_insert" ON deck_ruins FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM decks WHERE decks.id = deck_ruins.deck_id AND decks.owner_id = auth.uid()
  ));
CREATE POLICY "deck_ruins_delete" ON deck_ruins FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM decks WHERE decks.id = deck_ruins.deck_id AND decks.owner_id = auth.uid()
  ));
```

### 8.10 Relationships to Existing Tables

```
ruin_templates
  └── ruin_effects (1:many — neutral + all faction evolved effects)
  └── ruin_evolution_options (1:many — 5 factions x 4 options = up to 20 per template)
  └── player_ruins (1:many — player collection)

ruin_evolution_options
  └── ruin_effects (references 2 — evolved passive + evolved penalty)
  └── factions (many:1)

player_ruins
  └── auth.users (many:1 — owner)
  └── ruin_templates (many:1)
  └── ruin_evolution_options (many:1, nullable — chosen evolution)
  └── factions (many:1, nullable — faction lock after evolution)
  └── deck_ruins → decks (many:many junction)

decks (existing)
  └── deck_ruins (1:many — ruin entries in this deck)
  // Existing deck_entries for creatures/spells remain unchanged
  // Deck validation now checks: sum(card_entries quantities) + count(deck_ruins) == 20
```

### 8.11 Deck Size Accounting

With ruins added, the 20-card deck now contains a mix of creatures, spells, and ruins:

```
Total deck size = sum(card_entry quantities) + count(deck_ruins for this deck) = 20
```

A typical deck might be:
- 14 creatures (via card_entries)
- 4 spells (via card_entries)
- 2 ruins (via deck_ruins)
- Total: 20

This means adding a ruin to a deck requires removing a creature or spell. The tradeoff is explicit and enforced.

---

## Appendix A: Complete Ruin Card Reference

| # | Name | CM | HP | Inst | Type | Slot |
|---|---|---|---|---|---|---|
| R01 | The Resonance Spire | 2 | 7 | 0 | Healing/sustain | Cheap utility |
| R02 | The Anchor Plinth | 3 | 10 | 0 | HP buff | Midrange defensive |
| R03 | The Mote Well | 3 | 10 | 1 | Mana generation | Midrange tempo |
| R04 | The Sight Glass | 4 | 13 | 1 | Card selection | Midrange control |
| R05 | The War Cairn | 4 | 13 | 2 | ATK buff | Midrange aggressive |
| R06 | The Threshold Gate | 5 | 16 | 1 | Evolution energy | Long-game investment |
| R07 | The Communion Altar | 5 | 16 | 1 | Group healing | Wide-board sustain |
| R08 | The Oblivion Obelisk | 6 | 19 | 2 | Enemy damage | Expensive disruption |

## Appendix B: Evolved Ruin Name Reference

| Ruin | Ironwright | Fey Courts | Demonic | Celestial | Endless |
|---|---|---|---|---|---|
| Resonance Spire | Repair Pylon | Heartwood Spire | Bloodfire Spire | Sanctified Beacon | Dirge Spire |
| Anchor Plinth | Reinforced Bastion | Living Foundation | Sacrificial Platform | Consecrated Dais | Ossuary Foundation |
| Mote Well | Reactor Well | Moonpool | Hellmouth Basin | Font of Radiance | Soulwell |
| Sight Glass | Probability Engine | Oracle Pool | Eye of Malice | Seraph's Mirror | Death's Prism |
| War Cairn | Siege Monument | Thornguard Menhir | Bloodstone Pyre | Banner of the Crusade | Grave Marker |
| Threshold Gate | Calibration Arch | Faerie Ring Gate | Hellgate | Pearly Gates | Veil Threshold |
| Communion Altar | Assembly Platform | Grove Heart | Ritual Circle | Conclave Table | Seance Circle |
| Oblivion Obelisk | Void Projector | Withering Monolith | Pillar of Agony | Pillar of Judgment | Monument of Endings |

## Appendix C: Art Asset Count

| Category | Count |
|---|---|
| Neutral ruin art | 8 |
| Evolved ruin art (8 ruins x 5 factions) | 40 |
| **Total ruin art assets** | **48** |

Estimated generation cost at fal.ai FLUX Kontext Pro rates:
- 8 neutral (text-to-image): ~$0.56 (8 x $0.07)
- 40 evolved (img2img): ~$2.80 (40 x $0.07)
- Total: **~$3.36** (well within the ~$4 allocated for visual assets in CLAUDE.md)

---

*End of PHASE1C — Planar Ruins System Design*

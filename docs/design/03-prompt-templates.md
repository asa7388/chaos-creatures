# Chaos Creatures — Prompt Templates & AI Generation Pipeline

## Overview

This document defines the complete AI generation pipeline for Chaos Creatures. It covers prompt templates for FLUX Kontext (image generation) and GPT-4o Mini (text generation), faction voice guides, prompt construction algorithms, and quality guardrails.

**Dependencies:**
- `00-game-design-master.md` — Evolution system, faction design, shard tiers
- `01-battle-mechanics.md` — Faction art styles, modifier effects
- `02-card-data-model.md` — Evolution record fields, prompt storage

**Key Principles:**
- All art generation uses FLUX Kontext for evolution (img2img) and FLUX Dev for base cards (txt2img)
- Evolution art MUST visually reference the previous tier via img2img denoising
- Players never type freeform prompts — they select from curated modifier lists
- Chaos mote cost is fixed forever; art changes but cost never does
- Text generation (names, flavor text) uses GPT-4o Mini for cost efficiency

---

## 1. Image Generation Pipeline (FLUX Kontext)

### 1.1 Base Card Art Generation (Batch Pipeline)

Base cards are generated during the pre-launch batch pipeline using FLUX Dev text-to-image. These become the Common-tier art that all players start with.

#### Prompt Structure

```
[FACTION_PREFIX], [CREATURE_TYPE], [VISUAL_DETAILS], [FRAMING_INSTRUCTIONS], [QUALITY_TAGS]
```

#### Template

```
{faction_art_style_prefix}, {creature_archetype}, {visual_details},
portrait orientation, centered composition, dramatic lighting,
fantasy card game art, high detail, professional digital art,
clean background, no text, no watermarks, no borders
```

#### Faction-Specific Style Prefixes

**Ironwright Collective (Steampunk):**
```
steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms,
riveted metal plating, steam vents, intricate engineering, industrial aesthetic,
warm metallic tones, glowing amber lights, Victorian-era machinery
```

**The Fey Courts (High Fantasy / Druidic):**
```
ethereal fey creature, ancient forest setting, bioluminescent flora, living wood and vines,
mystical natural magic, moonlight and starlight, organic flowing forms,
antlers or nature-grown armor, moss and crystal accents,
cool nature tones with magical highlights
```

**The Demonic Kingdoms (Dark Fantasy / Infernal):**
```
demonic corrupted creature, hellfire and shadow, obsidian and bone materials,
infernal glyphs and runes, corrupted flesh, demonic horns or wings,
volcanic ash and embers, blood-red and deep purple tones,
dark visceral aesthetic, chaotic energy
```

#### Creature Type Examples by Faction

**Ironwright:**
- Clockwork automaton
- Steam-powered golem
- Brass dragon
- Mechanical guardian
- Cogwork beast

**Fey Courts:**
- Fey lord with antlers
- Dryad warrior
- Mycelial network creature
- Wild hunt hound
- Ancient treant

**Demonic Kingdoms:**
- Corrupted demon
- Infernal warlord
- Hellfire elemental
- Bone construct
- Shadow fiend

#### Framing & Composition Instructions

```
portrait orientation (768x1024 or 1024x1024),
centered creature filling 70-80% of frame,
dramatic three-quarter view or frontal pose,
background contextual but not cluttered,
clear silhouette, card game art composition,
eyes visible and engaging
```

#### Quality & Negative Prompts

**Positive quality tags:**
```
high detail, professional digital art, sharp focus,
vibrant colors, dynamic pose, fantasy card game art,
Magic: The Gathering style, Hearthstone style
```

**Negative prompts (always exclude):**
```
text, words, letters, watermarks, signatures, logos,
borders, frames, NSFW, explicit content, gore,
low quality, blurry, distorted anatomy,
multiple heads, deformed limbs, floating objects
```

#### Example: Full Base Card Prompt

**Ironwright 3-cost creature (instability 2, balanced stats):**

```
steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms,
riveted metal plating, steam vents, intricate engineering, industrial aesthetic,
clockwork wolf, sleek predator design, glowing amber eyes,
mechanical jaw with visible pistons, articulated brass limbs,

portrait orientation, centered composition, dramatic lighting from above-left,
creature in prowling stance, industrial workshop background with soft focus,

fantasy card game art, high detail, professional digital art, sharp focus,
vibrant warm metallic tones, Magic: The Gathering style, clean edges, no text, no watermarks

Negative prompt: text, words, watermarks, NSFW, low quality, blurry, deformed anatomy
```

#### Technical Parameters (Base Card Generation)

| Parameter | Value |
|---|---|
| Model | FLUX Dev (txt2img) |
| Resolution | 1024×1024 |
| Inference Steps | 30-40 |
| Guidance Scale | 7.5 |
| Sampler | DPM++ 2M Karras |

---

### 1.2 Evolution Art Prompts (Image-to-Image)

Evolution uses FLUX Kontext img2img to transform the card's existing art. The previous tier's art is the reference image. Denoising strength determines how dramatically the card transforms.

#### Core Concept

- **Order evolutions:** Subtle, structured changes. Low denoising (0.3-0.5). Refinement, crystallization, luminous details.
- **Chaos evolutions:** Dramatic transformations. High denoising (0.6-0.8). Fractured forms, wild energy, distorted elements.

#### Prompt Structure (Evolution)

```
[EVOLUTION_DIRECTION_INSTRUCTION], [PLAYER_SELECTED_MODIFIERS], [FACTION_CONTEXT], [QUALITY_PRESERVATION]
```

#### Template

```
Transform this {faction} creature: {evolution_direction_instruction}.
Apply these changes: {player_selected_prompt_modifiers}.
Preserve recognizable features from the original while {transformation_intensity}.
Maintain {faction_art_style} aesthetic. High detail, professional quality.
```

#### Evolution Direction Instructions

**Order Evolution (Low Denoising 0.3-0.5):**

```
Refine and structure this creature. Add crystalline geometric patterns,
luminous Order energy (blue-white-gold glow), refined armor plating,
symmetrical enhancements, polished surfaces, ordered fractals,
harmonious composition. Subtle transformation preserving 70-80% of original design.
```

**Chaos Evolution (High Denoising 0.6-0.8):**

```
Transform this creature with chaotic energy. Add fractured elements,
wild Chaos energy (red-purple-violet crackle), distorted asymmetry,
jagged edges, volatile auras, surging power,
chaotic fractals, dynamic instability. Dramatic transformation
with only 40-50% of original design preserved.
```

**Mixed History Context:**

For cards that have evolved multiple times, include evolution history:

```
This creature has undergone {chaos_count} Chaos transformations and {order_count} Order transformations.
It should show {chaos visual elements} integrated with {order visual elements}.
```

Examples:
- 3 Chaos + 1 Order: "Chaotic wild form with crystalline fractures trying to contain the energy"
- 2 Order + 2 Chaos: "Structured geometric base with chaotic energy breaking through the patterns"
- All Order: "Pristine crystalline form, perfected geometry, radiant luminous energy"
- All Chaos: "Completely fractured volatile form, barely held together, raw chaos incarnate"

#### Denoising Strength by Evolution Type & Tier

| Evolution Tier | Order Denoising | Chaos Denoising |
|---|---|---|
| Common → Uncommon | 0.35 | 0.65 |
| Uncommon → Rare | 0.40 | 0.70 |
| Rare → Epic | 0.45 | 0.75 |
| Epic → Legendary | 0.50 | 0.80 |

Higher tiers use slightly higher denoising because the card has more accumulated energy and should show more dramatic change.

#### Example: Evolution Prompt

**Ironwright creature, Common → Uncommon, Chaos outcome:**

Reference image: Common-tier clockwork wolf

Player selected modifiers: "glowing eyes," "battle-scarred armor"

```
Transform this steampunk mechanical creature with chaotic energy.
Add fractured elements, wild Chaos energy (red-purple crackle),
jagged edges and asymmetry.

Apply these specific changes:
- Eyes now glow with intense red-orange chaos fire
- Armor plating is dented, scratched, and battle-worn
- Exposed gears show signs of strain and stress

Preserve the clockwork wolf silhouette and brass materials while
increasing visual intensity by 40%. Maintain steampunk industrial aesthetic.
High detail, professional digital art, no text, no watermarks.

Negative prompt: text, watermarks, NSFW, low quality, blurry
```

Denoising: 0.65, Guidance: 7.5, Steps: 30

---

### 1.3 Visual Prompt Modifiers by Subscriber Tier

Players select from curated lists of visual transformation keywords during evolution. The lists scale by subscription tier.

#### Free Tier (Planar Shard): 8-10 Basic Modifiers

**Universal (apply to any faction):**
1. Glowing eyes
2. Battle-scarred
3. Armored plating
4. Crackling energy
5. Shadow-wreathed
6. Luminous highlights
7. Weathered and aged
8. Pristine and polished

**Faction-specific additions:**

**Ironwright (+2):**
- Reinforced gears
- Steam venting

**Fey Courts (+2):**
- Vine overgrowth
- Bioluminescent markings

**Demonic (+2):**
- Flame-wreathed
- Bone spurs

#### Mid Tier (Refined Planar Shard): 25-30 Expanded Modifiers

All Free tier options PLUS:

**Universal:**
9. Elemental aura (fire/ice/lightning)
10. Crystalline growth
11. Spectral trails
12. Runic inscriptions
13. Multi-eyed
14. Wing expansion
15. Size increase (larger, more imposing)
16. Material transformation (stone/metal/crystal)
17. Ethereal glow
18. Scarred and torn
19. Ornate decorations
20. Tribal markings

**Ironwright (+8):**
- Hydraulic pistons
- Rotating components
- Arc lightning discharge
- Polished chrome finish
- Overclocked (red-hot gears)
- Modular weapon mounts
- Pressure vents glowing
- Gyroscopic stabilizers

**Fey Courts (+8):**
- Flowering blooms
- Antler growth
- Mycelial threads
- Seasonal transformation (spring/autumn)
- Starlight aura
- Root system visible
- Wild hunt eyes (predator gaze)
- Lunar cycle phases

**Demonic (+8):**
- Molten cracks (lava veins)
- Infernal runes glowing
- Shadow tendrils
- Blood ritual markings
- Corrupted flesh pulsing
- Sulfurous smoke
- Demonic wings unfurled
- Hellfire corona

#### Top Tier (Prismatic Planar Shard): 40+ Including Exclusive

All Mid tier options PLUS exclusive dramatic transformations:

**Universal (+10 exclusive):**
21. Planar tear (reality fracture around creature)
22. Dual-element fusion (fire+ice, light+shadow)
23. Geometric impossibility (Escher-like structures)
24. Time distortion effect
25. Prismatic refraction
26. Void-touched (emptiness seeping in)
27. Celestial alignment (cosmic energy)
28. Mirror dimension echo
29. Fractured existence (multiple overlapping versions)
30. Transcendent form (ascended aesthetic)

**Ironwright (+10 exclusive):**
- Perpetual motion core visible
- Quantum entanglement gears
- Dimensional shift pistons
- Clockwork singularity heart
- Temporal gears (moving in reverse)
- Nanotech swarm integration
- Antimatter reactor glow
- Reality anchor systems
- Tesseract internals
- Infinite regress mechanisms

**Fey Courts (+10 exclusive):**
- World tree connection
- Dreaming realm bleed
- Seasons simultaneous (all four at once)
- Primordial wild form
- Astral constellation map
- Living ecosystem (multiple creatures in one)
- Eternal bloom/decay cycle
- Fey court crown manifesting
- Nature's wrath incarnate
- Verdant singularity

**Demonic (+10 exclusive):**
- Abyssal portal core
- Multi-planar corruption
- Chaos god blessing visible
- Soul consumption aura
- Hellscape terrain integration
- Demonic ascension wings
- Blood moon empowerment
- Infernal throne aspect
- Apocalypse herald form
- Sin manifestation (pride/wrath/etc.)

#### Modifier Selection Rules

At each evolution, the player picks 1 modifier from a pool of options (the number of options depends on subscription tier):
- Free tier: Choose 1 from 2 options (1 universal + 1 faction)
- Mid tier: Choose 1 from 3 options
- Top tier: Choose 1 from 4 options

Each evolution applies exactly 1 modifier. The visual prompt incorporates the cumulative effect of all modifiers applied across the card's evolution history.

---

### 1.4 Technical Parameters by Shard Quality

| Parameter | Planar Shard (Free) | Refined Shard (Mid) | Prismatic Shard (High) |
|---|---|---|---|
| **Model** | FLUX Kontext Dev | FLUX Kontext Pro | FLUX Kontext Pro |
| **Resolution** | 768×1024 | 1024×1024 | 1024×1024 |
| **Inference Steps** | 25-30 | 30-35 | 35-40 |
| **Guidance Scale** | 7.0 | 7.5 | 8.0 |
| **Passes** | 1 (single generation) | 1 | 2 (generate → refine) |
| **Denoising (Order)** | 0.35-0.50 | 0.35-0.50 | 0.30-0.45 (1st) + 0.20 (2nd) |
| **Denoising (Chaos)** | 0.65-0.80 | 0.65-0.80 | 0.65-0.80 (1st) + 0.30 (2nd) |
| **Queue Priority** | Standard | Priority | Priority |
| **Cost per Image** | ~$0.02 | ~$0.04 | ~$0.04 |

**Prismatic Shard Second Pass:**
The refinement pass uses the first generation as the reference image with lower denoising (0.20-0.30) to polish details, enhance lighting, and improve overall fidelity without changing the composition.

---

## 2. Text Generation Pipeline (GPT-4o Mini)

All text generation uses GPT-4o Mini for cost efficiency (~$0.15 input / $0.60 output per 1M tokens). At ~50-100 tokens per call, cost is negligible (~$0.0001 per evolution).

### 2.1 Card Naming

#### Prompt Template

```
You are a creative card name generator for a fantasy card game called Chaos Creatures.

FACTION: {faction_name}
FACTION VOICE: {faction_voice_guide}
BASE NAME: {template_base_name}
EVOLUTION TIER: {tier} (Common/Uncommon/Rare/Epic/Legendary)
EVOLUTION DIRECTION: {evolution_outcome} (Order or Chaos)
EVOLUTION HISTORY: {summary_of_past_evolutions}
PREVIOUS NAMES: {list_of_previous_names_in_evolution_chain}

Generate 3 card name candidates that:
1. Reflect the creature's evolution toward {Order/Chaos}
2. Match the {faction} voice and aesthetic
3. Are concise (2-4 words maximum)
4. Are memorable and evocative
5. Build on the previous name "{most_recent_name}" showing progression

For Order evolutions: names should suggest refinement, structure, titles, crystallization
For Chaos evolutions: names should suggest power, wildness, corruption, transformation

Return ONLY a JSON array of 3 name strings, no other text:
["Name Option 1", "Name Option 2", "Name Option 3"]
```

#### Example: Ironwright Common → Uncommon (Chaos)

Input:
```
FACTION: Ironwright Collective
FACTION VOICE: Steampunk, industrial, precise. Emphasize engineering, metals, mechanical terminology.
BASE NAME: Cogwork Stalker
EVOLUTION TIER: Uncommon
EVOLUTION DIRECTION: Chaos
EVOLUTION HISTORY: 1 Chaos evolution
PREVIOUS NAMES: ["Cogwork Stalker"]

Generate 3 card name candidates...
```

Output:
```json
["Overclocked Stalker", "Cogwork Fury", "Stalker, Unbound"]
```

#### Example: Fey Courts Rare → Epic (Order)

Input:
```
FACTION: The Fey Courts
FACTION VOICE: Ethereal, wild, organic. Emphasize nature, seasons, fey titles, ancient wisdom.
BASE NAME: Thornwood Warden
EVOLUTION TIER: Epic
EVOLUTION DIRECTION: Order
EVOLUTION HISTORY: 2 Order, 1 Chaos
PREVIOUS NAMES: ["Thornwood Warden", "Thornwood Sentinel", "Thornwood, the Verdant"]

Generate 3 card name candidates...
```

Output:
```json
["Thornwood, Crown of the Wilds", "Thornwood Archon", "Thornwood, the Eternal Guardian"]
```

#### Example: Demonic Epic → Legendary (Chaos)

Input:
```
FACTION: The Demonic Kingdoms
FACTION VOICE: Dark, visceral, corrupted. Emphasize hellfire, blood, demonic titles, infernal power.
BASE NAME: Ashblade Reaver
EVOLUTION TIER: Legendary
EVOLUTION DIRECTION: Chaos
EVOLUTION HISTORY: 4 Chaos evolutions (all Chaos)
PREVIOUS NAMES: ["Ashblade Reaver", "Ashblade Executioner", "Ashblade, the Unbound", "Ashblade Tyrant"]

Generate 3 card name candidates...
```

Output:
```json
["Ashblade, Chaos Incarnate", "Ashblade, Lord of Ruin", "Ashblade the Apocalyptic"]
```

---

### 2.2 Flavor Text

#### Prompt Template

```
You are writing flavor text for a fantasy card game called Chaos Creatures.

FACTION: {faction_name}
FACTION VOICE: {faction_voice_guide}
CARD NAME: {chosen_evolved_name}
EVOLUTION TIER: {tier}
EVOLUTION DIRECTION: {evolution_outcome}
EVOLUTION HISTORY: {summary}
PREVIOUS FLAVOR TEXT: {previous_flavor_text}

Generate a single flavor text entry (1-2 sentences, max 120 characters) that:
1. Reflects the card's transformation toward {Order/Chaos}
2. Matches the {faction} voice and tone
3. Is evocative and atmospheric
4. Hints at the card's history or nature
5. Stands alone — does not require reading previous flavor text to understand

For Order evolutions: tone is reverent, structured, protective, wise
For Chaos evolutions: tone is fierce, wild, ominous, powerful

Return ONLY the flavor text string, no quotes, no other formatting.
```

#### Example Outputs

**Ironwright, Uncommon, Chaos:**
```
The gears scream as chaos energy surges through brass veins, pushing the design beyond its limits.
```

**Fey Courts, Epic, Order:**
```
In stillness, the grove remembers every leaf, every root, every season since the world was young.
```

**Demonic, Legendary, Chaos:**
```
Where it walks, the ground cracks and bleeds. Where it roars, kingdoms fall silent.
```

---

### 2.3 Evolution Narrative (Optional Feature)

For high-tier evolutions (Epic/Legendary), optionally generate a longer narrative snippet describing the transformation moment. This could be displayed in the evolution ceremony or in card history.

#### Prompt Template

```
You are writing a brief evolution narrative for a card in Chaos Creatures.

FACTION: {faction_name}
CARD NAME (before): {old_name}
CARD NAME (after): {new_name}
EVOLUTION DIRECTION: {evolution_outcome}
PLAYER-SELECTED MODIFIERS: {prompt_modifiers}

Write a vivid 2-3 sentence narrative describing the moment of transformation
as chaos energy channels through the Planar Shard and transforms the creature.
Match the {faction} voice. {Order/Chaos} transformations have different tones.

Return ONLY the narrative text.
```

#### Example Outputs

**Ironwright, Chaos, "Overclocked" modifier:**
```
The Planar Shard cracks, and raw chaos floods the cogwork frame.
Gears spin beyond their rated tolerances, friction igniting into arcs of crimson lightning.
What emerges is no longer a tool — it is a weapon unleashed.
```

**Fey Courts, Order, "Crystalline growth" modifier:**
```
The shard's light is soft, patient, like dawn through mist.
The creature stands motionless as crystalline patterns bloom across bark and vine,
each facet locking into perfect order, an echo of the first forests before chaos came.
```

**Demonic, Chaos, "Molten cracks" modifier:**
```
The shard detonates. Hellfire rips through flesh and bone, carving molten channels
that pulse with the heartbeat of the Abyss itself. Pain is power. Ruin is purpose.
```

---

### 2.4 Event Flavor Text (Prewritten)

Event flavor text is NOT AI-generated. All 16 events (8 Order, 8 Chaos) have prewritten flavor text to ensure zero latency during gameplay and consistent terminology.

**Example prewritten event flavor text:**

**Order Event: Mending Light**
```
"A pulse of gentle radiance knits wounds and steadies breath."
```

**Chaos Event: Wildfire**
```
"The chaos roll ignites — flame leaps from creature to creature, indiscriminate and hungry."
```

These are defined in the game content database, not generated per-match.

---

## 3. Faction Voice Guides

Detailed voice and tone guidelines for each faction, used by both image and text generation prompts.

### 3.1 Ironwright Collective (Steampunk)

**Core Identity:** Precision. Engineering. Industry. Progress through invention.

**Visual Keywords:**
- Brass, copper, steel, bronze
- Gears, pistons, clockwork, hydraulics
- Rivets, plates, vents, conduits
- Steam, pressure, heat, spark
- Victorian/industrial aesthetic
- Warm metallic palette (gold, amber, rust, orange)

**Naming Conventions:**
- Engineering terms: Cogwork, Piston, Valve, Forged, Tempered, Wrought
- Titles of function: Warden, Sentinel, Overseer, Architect, Engineer
- Industrial locations: Forge, Foundry, Crucible, Anvil
- Compound names: "Brassbound Guardian," "Steamforged Titan"

**Flavor Text Tone:**
- Technical but not dry
- Reverent toward craftsmanship
- Emphasis on function, purpose, design
- Order = perfected engineering, harmonious systems
- Chaos = overclock, strain, pushed beyond limits, glorious malfunction

**Example Names:**
- Common: Cogwork Scout, Brass Sentinel, Steamforged Hound
- Uncommon: Ironbound Warden, Piston Fury
- Rare: Gearwright Commander, The Tempered Blade
- Epic: Aldric's Masterwork, Clockwork Ascendant
- Legendary: The Eternal Engine, Brassforge Colossus

**Example Flavor Text:**
- "Precision tolerances. Redundant systems. A masterpiece of function." (Order)
- "The gears scream, but they hold. They always hold." (Chaos)

---

### 3.2 The Fey Courts (High Fantasy / Druidic)

**Core Identity:** Ethereal. Wild. Ancient. Nature and magic intertwined.

**Visual Keywords:**
- Living wood, vines, roots, bark
- Bioluminescent flora, glowing mushrooms, crystals
- Antlers, horns, natural armor
- Moonlight, starlight, dawn, dusk
- Moss, lichen, flowers, thorns
- Cool natural palette (green, blue, silver, violet, gold highlights)

**Naming Conventions:**
- Nature terms: Thorn, Root, Bloom, Vine, Grove, Glade
- Fey titles: Lord, Lady, Warden, Huntress, Speaker
- Seasons: Spring, Autumn, Winter's (concept)
- Mythic descriptors: Verdant, Eternal, Wild, Ancient, Moonlit
- Poetic structure: "Thornwood, Crown of the Wilds"

**Flavor Text Tone:**
- Lyrical but not flowery
- Timeless and ancient
- Emphasis on cycles, memory, wildness
- Order = harmony with nature, eternal patience, growth
- Chaos = the wild hunt, primal fury, untamed power

**Example Names:**
- Common: Thornvine Stalker, Gladekeeper, Moonpetal Sprite
- Uncommon: Rootcaller Warden, Wildbloom Huntress
- Rare: Sylara's Chosen, The Verdant Blade
- Epic: Thornwood Archon, Starborn Protector
- Legendary: The Eternal Grove, Morrigan's Wild Hunt

**Example Flavor Text:**
- "The forest remembers. Every root, every leaf, every silence." (Order)
- "When the hunt rides, even the moon hides her face." (Chaos)

---

### 3.3 The Demonic Kingdoms (Dark Fantasy / Infernal)

**Core Identity:** Visceral. Corrupted. Power at any cost. Infernal hunger.

**Visual Keywords:**
- Hellfire, shadow, ash, ember
- Bone, horn, fang, claw
- Obsidian, molten stone, blood
- Infernal runes, glyphs, sigils
- Corrupted flesh, demonic features
- Dark palette (black, red, purple, deep crimson, violet)

**Naming Conventions:**
- Dark materials: Ash, Bone, Blood, Shadow, Flame, Cinder
- Violent verbs: Reaver, Ripper, Render, Ruin, Scar
- Infernal titles: Tyrant, Lord, Unbound, Forsaken, Damned
- Names of sin/concept: Wrath, Ruin, Agony, Despair
- Structure: "Ashblade, Lord of Ruin"

**Flavor Text Tone:**
- Visceral and direct
- Ominous and foreboding
- Emphasis on power, sacrifice, consumption
- Order = restrained corruption, controlled fury, dark pacts honored
- Chaos = unbound carnage, self-immolation for power, apocalyptic

**Example Names:**
- Common: Ashclaw Fiend, Bonebreaker Imp, Emberhound
- Uncommon: Bloodrite Reaver, Shadowscar Warlord
- Rare: Kael's Chosen, The Bound Flame
- Epic: Ashblade Tyrant, Infernal Ascendant
- Legendary: The Unbound, Ruinbringer Eternal

**Example Flavor Text:**
- "The pact is written in blood. It will be paid in blood." (Order)
- "It does not hunger. It IS hunger." (Chaos)

---

## 4. Prompt Construction Algorithm

Step-by-step process for assembling prompts at evolution time.

### 4.1 Evolution Image Prompt Assembly

**Inputs:**
1. `card_instance` — the card being evolved
2. `evolution_outcome` — ORDER or CHAOS (from 70/30 roll)
3. `player_selected_modifiers` — array of 1-4 modifier strings chosen by player
4. `shard_quality` — PLANAR, REFINED, or PRISMATIC
5. `reference_art_url` — current tier's art (img2img input)

**Algorithm:**

```python
def build_evolution_image_prompt(card_instance, evolution_outcome, player_modifiers, shard_quality):
    # 1. Get faction context
    faction = get_faction(card_instance.template.faction_id)
    faction_prefix = faction.art_style_prefix

    # 2. Determine evolution direction instruction
    if evolution_outcome == ORDER:
        direction = ORDER_EVOLUTION_INSTRUCTION
        denoising = get_order_denoising(card_instance.tier, shard_quality)
    else:  # CHAOS
        direction = CHAOS_EVOLUTION_INSTRUCTION
        denoising = get_chaos_denoising(card_instance.tier, shard_quality)

    # 3. Analyze evolution history
    chaos_count = count_chaos_evolutions(card_instance.evolution_history)
    order_count = count_order_evolutions(card_instance.evolution_history)
    history_context = generate_history_context(chaos_count, order_count)

    # 4. Format player-selected modifiers
    modifier_list = ", ".join(player_modifiers)
    modifier_instruction = f"Apply these specific changes: {modifier_list}."

    # 5. Assemble full prompt
    prompt = f"""
    Transform this {faction.name} creature: {direction}

    {history_context}

    {modifier_instruction}

    Preserve recognizable features from the original while transforming.
    Maintain {faction_prefix} aesthetic.

    High detail, professional digital art, portrait orientation,
    fantasy card game art, no text, no watermarks.

    Negative prompt: text, words, watermarks, NSFW, low quality, blurry, deformed anatomy
    """

    # 6. Set technical parameters
    params = {
        "model": get_model_for_shard(shard_quality),
        "reference_image": reference_art_url,
        "prompt": prompt,
        "denoising_strength": denoising,
        "width": get_width(shard_quality),
        "height": get_height(shard_quality),
        "steps": get_steps(shard_quality),
        "guidance_scale": get_guidance(shard_quality),
        "negative_prompt": NEGATIVE_PROMPT_STANDARD
    }

    # 7. If Prismatic, prepare second refinement pass
    if shard_quality == PRISMATIC:
        params["refinement_pass"] = {
            "denoising_strength": 0.25,
            "steps": 20,
            "prompt": f"Enhance details and lighting. {prompt}"
        }

    return params
```

**Helper Functions:**

```python
def get_order_denoising(tier, quality):
    base = {
        COMMON: 0.35,
        UNCOMMON: 0.40,
        RARE: 0.45,
        EPIC: 0.50
    }[tier]

    # Prismatic uses slightly lower denoising for more control
    if quality == PRISMATIC:
        return base - 0.05
    return base

def get_chaos_denoising(tier, quality):
    base = {
        COMMON: 0.65,
        UNCOMMON: 0.70,
        RARE: 0.75,
        EPIC: 0.80
    }[tier]
    return base  # Chaos always uses high denoising

def generate_history_context(chaos_count, order_count):
    if chaos_count == 0 and order_count == 0:
        return ""

    if chaos_count > order_count * 2:
        return "This creature is heavily corrupted by chaos energy, with fractured unstable forms and wild power."
    elif order_count > chaos_count * 2:
        return "This creature has been refined by order energy, showing crystalline patterns and structured harmony."
    elif chaos_count == order_count:
        return "This creature balances chaos and order, showing both structured elements and chaotic energy."
    else:
        return f"This creature has undergone {chaos_count} Chaos and {order_count} Order transformations."
```

### 4.2 Evolution Text Prompt Assembly

**Algorithm:**

```python
def build_evolution_text_prompt(card_instance, evolution_outcome, tier):
    faction = get_faction(card_instance.template.faction_id)

    # Build evolution history summary
    history = card_instance.evolution_history
    history_summary = f"{count_chaos(history)} Chaos, {count_order(history)} Order evolutions"

    # Get previous names
    previous_names = [card_instance.template.name] + [
        record.name_chosen for record in history
    ]

    prompt = f"""
You are a creative card name generator for a fantasy card game called Chaos Creatures.

FACTION: {faction.name}
FACTION VOICE: {faction.flavor_voice_guide}
BASE NAME: {card_instance.template.name}
EVOLUTION TIER: {tier}
EVOLUTION DIRECTION: {evolution_outcome}
EVOLUTION HISTORY: {history_summary}
PREVIOUS NAMES: {json.dumps(previous_names)}

Generate 3 card name candidates that:
1. Reflect the creature's evolution toward {evolution_outcome}
2. Match the {faction.name} voice and aesthetic
3. Are concise (2-4 words maximum)
4. Are memorable and evocative
5. Build on the previous name "{previous_names[-1]}" showing progression

For Order evolutions: names should suggest refinement, structure, titles, crystallization
For Chaos evolutions: names should suggest power, wildness, corruption, transformation

Return ONLY a JSON array of 3 name strings, no other text:
["Name Option 1", "Name Option 2", "Name Option 3"]
"""

    return {
        "model": "gpt-4o-mini",
        "temperature": 0.8,  # Creative but not random
        "max_tokens": 100,
        "messages": [
            {"role": "system", "content": "You are a creative fantasy card name generator."},
            {"role": "user", "content": prompt}
        ]
    }
```

---

### 4.3 Example Prompt Outputs by Faction & Tier

#### Ironwright Collective

**Common → Uncommon (Chaos)**

Reference: Brass clockwork wolf with amber eyes

Player modifiers: "glowing eyes," "steam venting"

```
Transform this Ironwright Collective creature with chaotic energy.
Add fractured elements, wild Chaos energy (red-purple crackle), jagged edges and asymmetry.

Apply these specific changes: glowing eyes, steam venting.

Eyes now burn with intense red-orange chaos fire.
Steam vents across the chassis release violent pressure bursts.

Preserve the clockwork wolf silhouette and brass materials while
increasing visual intensity by 40%. Maintain steampunk industrial aesthetic.

High detail, professional digital art, portrait orientation,
fantasy card game art, no text, no watermarks.

Negative prompt: text, words, watermarks, NSFW, low quality, blurry
```

Denoising: 0.65, Steps: 30, Guidance: 7.5

**Epic → Legendary (Order)**

Reference: Highly evolved clockwork construct with 2 Chaos + 2 Order history

Player modifiers: "crystalline growth," "polished chrome finish," "prismatic refraction"

```
Transform this Ironwright Collective creature: Refine and structure this creature.
Add crystalline geometric patterns, luminous Order energy (blue-white-gold glow),
refined armor plating, symmetrical enhancements, polished surfaces.

This creature balances chaos and order, showing both structured elements and chaotic energy.

Apply these specific changes: crystalline growth, polished chrome finish, prismatic refraction.

Brass and copper plating develops crystalline geometric overlays.
All surfaces are polished to mirror-chrome perfection.
Light refracts through crystal patterns creating rainbow halos.

Preserve 50% of the chaotic fractured elements while overlaying perfect order.
Maintain steampunk industrial aesthetic with arcane crystalline fusion.

High detail, professional digital art, portrait orientation,
fantasy card game art, no text, no watermarks.

Negative prompt: text, words, watermarks, NSFW, low quality, blurry
```

Denoising: 0.45 (first pass), 0.25 (refinement pass), Steps: 35+20, Guidance: 8.0

---

#### The Fey Courts

**Uncommon → Rare (Order)**

Reference: Fey warrior with antlers and vine armor, 1 Order evolution

Player modifiers: "flowering blooms," "starlight aura"

```
Transform this Fey Courts creature: Refine and structure this creature.
Add crystalline geometric patterns, luminous Order energy (blue-white-gold glow),
natural harmonious growth, symmetrical organic patterns.

This creature has undergone 2 Order transformations, showing refined natural perfection.

Apply these specific changes: flowering blooms, starlight aura.

Vines sprout delicate flowers in perfect symmetrical patterns.
The creature emanates soft starlight, illuminating from within.

Preserve recognizable features from the original while refining natural beauty.
Maintain ethereal fey courts aesthetic with bioluminescent natural magic.

High detail, professional digital art, portrait orientation,
fantasy card game art, no text, no watermarks.

Negative prompt: text, words, watermarks, NSFW, low quality, blurry
```

Denoising: 0.40, Steps: 30, Guidance: 7.5

**Rare → Epic (Chaos)**

Reference: Refined fey warrior (2 Order, now first Chaos)

Player modifiers: "wild hunt eyes," "shadow tendrils"

```
Transform this Fey Courts creature with chaotic energy.
Add fractured elements, wild primal fury, asymmetrical natural overgrowth,
untamed power breaking through structured forms.

This creature was refined by order but is now touched by chaos for the first time.

Apply these specific changes: wild hunt eyes, shadow tendrils.

Eyes shift to predatory wild hunt gaze — glowing with feral intensity.
Writhing shadow tendrils emerge from beneath the natural armor.

Structured floral patterns fracture as wild chaos breaks containment.
Maintain ethereal fey courts aesthetic but introduce primordial wildness.

High detail, professional digital art, portrait orientation,
fantasy card game art, no text, no watermarks.

Negative prompt: text, words, watermarks, NSFW, low quality, blurry
```

Denoising: 0.75, Steps: 30, Guidance: 7.5

---

#### The Demonic Kingdoms

**Common → Uncommon (Chaos)**

Reference: Small demonic imp with basic horns and claws

Player modifiers: "flame-wreathed"

```
Transform this Demonic Kingdoms creature with chaotic energy.
Add fractured elements, wild Chaos energy (red-purple crackle),
hellfire and shadow, infernal power surge.

Apply these specific changes: flame-wreathed.

The creature is engulfed in hellfire corona, flames licking across corrupted flesh.

Preserve recognizable features while intensifying demonic corruption by 40%.
Maintain dark demonic aesthetic with visceral infernal power.

High detail, professional digital art, portrait orientation,
fantasy card game art, no text, no watermarks.

Negative prompt: text, words, watermarks, NSFW, low quality, blurry
```

Denoising: 0.65, Steps: 30, Guidance: 7.5

**Epic → Legendary (All Chaos x4)**

Reference: Massive corrupted demon, fully chaotic evolution history

Player modifiers: "abyssal portal core," "apocalypse herald form," "multi-planar corruption"

```
Transform this Demonic Kingdoms creature with ultimate chaotic energy.
Add reality-fracturing power, planar tears, apocalyptic presence,
complete corruption incarnate.

This creature is heavily corrupted by chaos energy — 4 complete Chaos transformations.
It is barely contained raw chaos given demonic form.

Apply these specific changes: abyssal portal core, apocalypse herald form, multi-planar corruption.

The creature's chest contains a visible abyssal portal to the demon plane.
Its form shifts between multiple planar corruption states simultaneously.
It radiates apocalyptic power — the end of worlds made flesh.

Only 30% of the original design should be preserved — this is transcendent chaos.
Maintain dark demonic aesthetic at reality-breaking scale.

High detail, professional digital art, portrait orientation,
fantasy card game art, no text, no watermarks.

Negative prompt: text, words, watermarks, NSFW, low quality, blurry
```

Denoising: 0.80 (first pass), 0.30 (refinement), Steps: 40+20, Guidance: 8.0

---

## 5. Quality Guardrails

Systems to ensure generated content meets quality and safety standards.

### 5.1 Content Filtering

**NSFW Detection:**
- All generated images run through NSFW classification API (e.g., Azure Content Safety, AWS Rekognition)
- Threshold: 80% confidence for flagging
- Flagged images are rejected and regenerated with modified prompt
- After 3 failed attempts, evolution is rolled back and player receives shard refund + error notification

**Text-in-Image Detection:**
- Check for embedded text in generated images (OCR scan)
- Reject if readable text is detected (watermarks, signatures, in-world text we can't control)
- Regenerate with stronger "no text" negative prompt weighting

**Prohibited Content:**
- Gore, excessive violence, explicit content
- Hate symbols, offensive imagery
- Copyright-infringing recognizable characters/logos

**Implementation:**
```python
def validate_generated_image(image_url):
    # NSFW check
    nsfw_score = content_safety_api.check_nsfw(image_url)
    if nsfw_score > 0.8:
        return {"valid": False, "reason": "NSFW content detected"}

    # Text detection
    text_detected = ocr_api.detect_text(image_url)
    if text_detected and len(text_detected) > 5:  # More than 5 chars
        return {"valid": False, "reason": "Text detected in image"}

    # Demonic faction exception: allow mild blood/dark themes
    # but still block extreme gore
    violence_score = content_safety_api.check_violence(image_url)
    if card.faction == DEMONIC and violence_score < 0.7:
        pass  # Allow moderate dark themes for Demonic
    elif violence_score > 0.6:
        return {"valid": False, "reason": "Excessive violence"}

    return {"valid": True}
```

### 5.2 Retry Logic

**Image Generation Failures:**

1. **API timeout** (>30 seconds): Retry once with same parameters
2. **Content filter rejection**: Retry up to 3 times with modified prompt:
   - Add stronger negative prompts
   - Reduce denoising by 0.1
   - Remove most aggressive player-selected modifier
3. **Total failure after 3 retries**: Fallback to programmatic art treatment

**Text Generation Failures:**

1. **Malformed JSON output**: Retry once with explicit JSON formatting instruction
2. **Inappropriate names**: Regex filter for profanity/slurs, regenerate if detected
3. **Empty output**: Retry with simplified prompt

### 5.3 Fallback Systems

**Fallback Art Generation (if FLUX fails):**

Apply programmatic visual treatment to existing art:
- Order: Blue-white glow overlay, subtle brightness increase, sharpen filter
- Chaos: Red-purple glow overlay, color saturation boost, add particle effect overlay

Store as temporary placeholder. Queue full AI generation asynchronously.
Push completed art to client when ready (websocket or next app open).

**Fallback Text Generation:**

If name generation fails completely:
- Append tier suffix: "{Previous Name}, the {Tier}" (e.g., "Cogwork Stalker, the Rare")
- Use template-based names: "{Faction adjective} {Base name}" (e.g., "Chaotic Cogwork Stalker")

**Player Communication:**

If fallback is used:
```
"Evolution complete! Your card's art is being refined in the background
and will update when ready. You can continue playing with your evolved card."
```

Never block the player. Always complete the evolution mechanically even if art generation is delayed.

### 5.4 Generation Queue Management

**Priority Tiers:**
1. Prismatic Shard evolutions (paid tier) — priority queue
2. Refined Shard evolutions (paid tier) — priority queue
3. Planar Shard evolutions (free tier) — standard queue
4. Batch base card generation — low priority background

**Rate Limiting:**
- Free tier: Max 5 evolutions per day (prevents abuse, aligns with shard acquisition rate)
- Mid tier: Max 15 evolutions per day
- Top tier: Max 30 evolutions per day

Players see their remaining daily evolution quota in the UI.

**Cost Controls:**
- Log all API costs per user per month
- Alert if any user exceeds expected cost profile (possible exploit/abuse)
- Hard cap: 50 evolutions per user per day (any tier) to prevent runaway costs

### 5.5 Quality Assurance — Base Cards

For batch-generated base cards (pre-launch), manual QA is required:

**QA Checklist:**
- [ ] Art matches faction aesthetic
- [ ] Creature is clearly visible and well-framed
- [ ] No text, watermarks, or artifacts
- [ ] Colors are vibrant and appropriate
- [ ] Name fits faction voice
- [ ] Flavor text is grammatically correct and evocative
- [ ] Stats are balanced for PP budget
- [ ] No offensive or inappropriate content

**QA Workflow:**
1. Batch generate 50 cards
2. Display in approval UI grid view
3. QA reviewer marks: Approve / Reject / Regenerate
4. Rejected cards are deleted
5. Regenerate flags trigger new generation with modified seed
6. Approved cards get `approved_at` timestamp and `approved_by` user ID
7. Only approved cards enter the live card pool

**Target Approval Rate:** 70-80% (20-30% rejection is normal for AI art)

---

## 6. Appendix: Full Prompt Examples

### Base Card Generation (Common Tier)

**Ironwright 2-cost creature (instability 2, balanced, 2 ATK / 3 HP):**

```
steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms,
riveted metal plating, steam vents, intricate engineering, industrial aesthetic,

clockwork raven, avian predator design, articulated brass wings with visible pistons,
copper beak with razor edge, glowing amber optical sensors, perched hunting stance,

portrait orientation, centered composition, dramatic lighting from above,
industrial rooftop background with chimneys and steam pipes softly out of focus,

fantasy card game art, high detail, professional digital art, sharp focus,
vibrant warm metallic tones, dynamic pose, Magic: The Gathering style,
clear silhouette, no text, no watermarks, no borders

Negative prompt: text, words, letters, watermarks, signatures, logos, borders, frames,
NSFW, explicit content, low quality, blurry, distorted anatomy, deformed wings,
multiple heads, floating objects, cluttered background
```

Model: FLUX Dev, Resolution: 1024×1024, Steps: 35, Guidance: 7.5

---

**Fey Courts 4-cost creature (instability 1, defensive, 3 ATK / 6 HP, keyword: Shield):**

```
ethereal fey creature, ancient forest setting, bioluminescent flora, living wood and vines,
mystical natural magic, moonlight and starlight, organic flowing forms,

fey knight with shield, living bark armor grown into elegant plates,
shield made of woven vines and glowing crystal, antlers crowned with moonflowers,
luminous green eyes, noble protective stance, moss and silver accents,

portrait orientation, centered composition, soft moonlight from above-right,
ancient grove background with towering trees and floating motes of light,

fantasy card game art, high detail, professional digital art, sharp focus,
cool nature tones with magical cyan and silver highlights, ethereal glow,
Magic: The Gathering style, no text, no watermarks

Negative prompt: text, words, watermarks, NSFW, low quality, blurry,
deformed anatomy, mechanical elements, urban setting, harsh lighting
```

Model: FLUX Dev, Resolution: 1024×1024, Steps: 35, Guidance: 7.5

---

**Demonic 3-cost creature (instability 4, glass cannon, 5 ATK / 2 HP, keyword: Piercing):**

```
demonic corrupted creature, hellfire and shadow, obsidian and bone materials,
infernal glyphs and runes, corrupted flesh, demonic horns,
volcanic ash and embers, blood-red and deep purple tones, dark visceral aesthetic,

infernal ravager, lean predatory demon with elongated claws,
obsidian horns curving back, exposed bone structure through torn flesh,
eyes burning with hellfire, crouched pouncing stance,
glowing red infernal runes across body, embers falling around,

portrait orientation, centered composition, dramatic lighting from below (hellfire glow),
volcanic wasteland background with rivers of lava softly out of focus,

fantasy card game art, high detail, professional digital art, sharp focus,
dark palette with intense red and violet highlights, menacing presence,
Magic: The Gathering style, no text, no watermarks

Negative prompt: text, words, watermarks, NSFW, explicit gore, low quality, blurry,
deformed anatomy, bright colors, cheerful tone, peaceful setting
```

Model: FLUX Dev, Resolution: 1024×1024, Steps: 35, Guidance: 7.5

---

This completes the Chaos Creatures Prompt Templates & AI Generation Pipeline documentation.

# Chaos Creatures — Prompt Templates & AI Generation Pipeline

**Version:** 2.0 (Revised for solo non-engineer build)
**Last Updated:** 2026-02-16
**Dependencies:** `00-game-design-master.md`, `01-battle-mechanics.md`, `02-card-data-model.md`

---

## Overview

This document defines the complete AI generation pipeline for Chaos Creatures. It contains exact prompt strings Claude Code can implement directly — no fill-in-the-blanks, no "construct a prompt using faction style," no decisions left to the engineer.

**Infrastructure used (non-negotiable, from CLAUDE.md):**
- Image generation: fal.ai FLUX Kontext API
- Text generation: OpenAI GPT-4o Mini
- Art storage: Cloudflare R2 (CDN delivery)
- Backend: Supabase Edge Functions (trigger generation jobs)
- Server: Railway Node.js (batch pipeline runner)

**Key Principles:**
- Players never type freeform prompts — they pick from curated lists
- Every evolution uses img2img (FLUX Kontext) referencing the previous tier's art
- Chaos mote cost never changes through evolution — only art, name, stats, and abilities change
- Text generation uses GPT-4o Mini at ~$0.0001 per call
- All generated art uploads to Cloudflare R2; `art_url` on CardInstance/EvolutionRecord stores the R2 CDN URL

---

## 1. Image Generation Pipeline (fal.ai FLUX Kontext)

### 1.1 fal.ai API Integration

All image generation calls go to fal.ai. There are two endpoints used:

**Base card generation (text-to-image):**
```
POST https://fal.run/fal-ai/flux/dev
```

**Evolution art generation (image-to-image):**
```
POST https://fal.run/fal-ai/flux-kontext/dev
POST https://fal.run/fal-ai/flux-kontext/pro
```

**Authentication:** `Authorization: Key ${FAL_API_KEY}` header. `FAL_API_KEY` comes from `.env`.

**Base request structure for evolution (img2img):**
```json
{
  "image_url": "https://r2.chaos-creatures.com/art/{card_instance_id}/tier-common.webp",
  "prompt": "<assembled prompt string>",
  "negative_prompt": "text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects",
  "image_size": "portrait_4_3",
  "num_inference_steps": 30,
  "guidance_scale": 7.5,
  "strength": 0.65,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "webp"
}
```

**Base request structure for base card generation (txt2img):**
```json
{
  "prompt": "<assembled prompt string>",
  "negative_prompt": "text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects",
  "image_size": "portrait_4_3",
  "num_inference_steps": 35,
  "guidance_scale": 7.5,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "webp"
}
```

**`image_size` values used:** `portrait_4_3` = 768×1024. For 1024×1024 (paid tiers), use `square_hd`.

**`strength` parameter:** This is the denoising strength for img2img. 0.0 = identical to input, 1.0 = completely new image. See denoising table in Section 1.4.

**Response format:**
```json
{
  "images": [
    {
      "url": "https://fal.ai/files/...",
      "width": 768,
      "height": 1024,
      "content_type": "image/webp"
    }
  ],
  "timings": { "inference": 4.2 },
  "seed": 12345678,
  "has_nsfw_concepts": [false]
}
```

After generation, download the image from `images[0].url` and upload to Cloudflare R2 at path `art/{card_instance_id}/{tier}.webp`. Store the R2 CDN URL as `art_url`.

---

### 1.2 Base Card Art Generation (Batch Pipeline — Pre-Launch)

Base cards are generated during the batch pipeline before launch. These become the Common-tier art.

#### Prompt Structure

All base card prompts follow this exact pattern:

```
{FACTION_PREFIX}, {CREATURE_DESCRIPTION}, {COMPOSITION_INSTRUCTION}, {QUALITY_TAGS}
```

#### Faction Prefixes (Exact Strings — Copy Into Code as Constants)

**IRONWRIGHT_PREFIX:**
```
steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms, riveted metal plating, steam vents, intricate precision engineering, industrial Victorian aesthetic, warm metallic tones with amber and rust highlights, glowing amber lenses
```

**FEY_COURTS_PREFIX:**
```
ethereal fey fantasy creature, ancient forest setting, bioluminescent flora and glowing fungi, living wood and vine armor, mystical natural magic, soft moonlight and starlight illumination, organic flowing forms, moss and crystal accents, cool nature palette with silver and violet highlights
```

**DEMONIC_KINGDOMS_PREFIX:**
```
demonic corrupted dark fantasy creature, hellfire and deep shadow, obsidian and bone construction, infernal glyphs and runes, corrupted flesh with visible strain, volcanic ash and floating embers, blood-red and deep purple-black tones, visceral menacing presence
```

#### Composition Instruction (Same for All Factions)

```
portrait orientation, centered creature filling 70 percent of frame, dramatic three-quarter view or frontal pose, simple contextual background not cluttered, clear distinct silhouette, card game art composition, eyes visible and facing viewer, dramatic directional lighting
```

#### Quality Tags (Same for All Factions)

```
fantasy card game art, high detail, professional digital illustration, sharp focus, vibrant colors, dynamic pose, Magic: The Gathering style composition, clean edges
```

#### Negative Prompt (Used on Every Single Request — Never Omit)

```
text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, extra limbs, fused body parts, speech bubbles, comic panels, grid layout
```

---

#### Concrete Base Card Prompt Examples

These are copy-paste ready prompts. The batch script assembles them from the constants above plus a creature description row from the CSV.

**Ironwright — 3-cost Clockwork Wolf (instability 2, 3ATK/4HP):**
```
steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms, riveted metal plating, steam vents, intricate precision engineering, industrial Victorian aesthetic, warm metallic tones with amber and rust highlights, glowing amber lenses,

clockwork wolf, sleek predatory design, articulated brass leg joints with visible pistons, mechanical jaw with copper fangs, glowing amber optical sensors, mid-prowl stance,

portrait orientation, centered creature filling 70 percent of frame, dramatic three-quarter view, industrial workshop background with soft-focus steam pipes, clear distinct silhouette, eyes facing viewer, dramatic lighting from upper left,

fantasy card game art, high detail, professional digital illustration, sharp focus, vibrant warm metallic tones, dynamic pose, Magic: The Gathering style composition, clean edges
```

**Ironwright — 1-cost Gear Sprite (instability 1, 1ATK/2HP):**
```
steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms, riveted metal plating, steam vents, intricate precision engineering, industrial Victorian aesthetic, warm metallic tones with amber and rust highlights, glowing amber lenses,

tiny clockwork sprite, insect-like brass wings with visible gear joints, small rounded body of copper plating, spinning gear on back like a propeller, curious alert posture, diminutive but precise,

portrait orientation, centered creature filling 70 percent of frame, frontal pose, dark industrial girder background with atmospheric steam wisps, clear distinct silhouette, glowing eyes facing viewer, dramatic top-down lighting,

fantasy card game art, high detail, professional digital illustration, sharp focus, vibrant warm metallic tones, Magic: The Gathering style composition, clean edges
```

**Fey Courts — 4-cost Thornwood Warden (instability 1, 2ATK/6HP, Shield keyword):**
```
ethereal fey fantasy creature, ancient forest setting, bioluminescent flora and glowing fungi, living wood and vine armor, mystical natural magic, soft moonlight and starlight illumination, organic flowing forms, moss and crystal accents, cool nature palette with silver and violet highlights,

tall fey knight, living bark armor grown into elegant broad plates, large shield woven from vines and glowing teal crystal, antlers crowned with moonflowers, luminous pale-green eyes, noble protective wide-stance pose, silver-green bioluminescent veins across armor,

portrait orientation, centered creature filling 70 percent of frame, three-quarter view, ancient grove background with towering trees and floating magical motes, clear distinct silhouette, dramatic soft moonlight from above-right,

fantasy card game art, high detail, professional digital illustration, sharp focus, cool tones with magical cyan and silver highlights, ethereal inner glow, Magic: The Gathering style composition, clean edges
```

**Fey Courts — 2-cost Moonpetal Sprite (instability 3, 3ATK/2HP, Flying keyword):**
```
ethereal fey fantasy creature, ancient forest setting, bioluminescent flora and glowing fungi, living wood and vine armor, mystical natural magic, soft moonlight and starlight illumination, organic flowing forms, moss and crystal accents, cool nature palette with silver and violet highlights,

small agile fey scout, dragonfly-like translucent wings of solidified moonlight, lithe body clad in petal armor, sharp thorn-claws, crouched ready-to-spring stance, wild feral expression, bioluminescent marking streaks on skin,

portrait orientation, centered creature filling 70 percent of frame, dynamic angled pose with wings spread, misty forest canopy background, clear distinct silhouette, eyes glowing violet facing viewer, dramatic rim lighting,

fantasy card game art, high detail, professional digital illustration, sharp focus, cool silver and violet tones, dynamic pose showing speed, Magic: The Gathering style composition, clean edges
```

**Demonic Kingdoms — 3-cost Ashclaw Ravager (instability 4, 5ATK/2HP, Piercing keyword):**
```
demonic corrupted dark fantasy creature, hellfire and deep shadow, obsidian and bone construction, infernal glyphs and runes, corrupted flesh with visible strain, volcanic ash and floating embers, blood-red and deep purple-black tones, visceral menacing presence,

lean predatory demon, elongated razor-edged obsidian claws, exposed rib-cage bone structure through torn corrupted flesh, swept-back obsidian horns, eyes burning with hellfire, crouched low pouncing stance, glowing crimson infernal rune tattoos across body, ash and embers drifting around,

portrait orientation, centered creature filling 70 percent of frame, low three-quarter view emphasizing menace, volcanic wasteland background with lava rivers soft-focus, clear distinct silhouette, hellfire eyes facing viewer, dramatic underlighting from lava glow,

fantasy card game art, high detail, professional digital illustration, sharp focus, dark palette with intense crimson and violet highlights, menacing weight, Magic: The Gathering style composition, clean edges
```

**Demonic Kingdoms — 5-cost Bloodrite Warlord (instability 2, 4ATK/7HP, Lifesteal keyword):**
```
demonic corrupted dark fantasy creature, hellfire and deep shadow, obsidian and bone construction, infernal glyphs and runes, corrupted flesh with visible strain, volcanic ash and floating embers, blood-red and deep purple-black tones, visceral menacing presence,

massive demonic warlord, heavy obsidian plate armor etched with blood-glyphs, large weapon dripping with dark ichor, imposing upright commanding stance, prominent curved horns, deep-set burning eyes, blood ritual sigils glowing on pauldrons, veins of dark energy visible through armor joints,

portrait orientation, centered creature filling 70 percent of frame, dramatic frontal command pose, obsidian fortress battlements background, clear distinct silhouette, burning eyes facing viewer, dramatic top lighting with hellfire from below,

fantasy card game art, high detail, professional digital illustration, sharp focus, dark palette with deep crimson command presence, Magic: The Gathering style composition, clean edges
```

---

### 1.3 Evolution Art Prompts (Image-to-Image with FLUX Kontext)

Every evolution calls `fal.run/fal-ai/flux-kontext/dev` or `.../pro` with the previous tier's art as `image_url`.

#### Order Evolution Prompt Template

```
Transform this {FACTION_NAME} creature with Order energy. Refine and structure the design. Add crystalline geometric patterns growing from the surface, luminous blue-white-gold Order energy emanating from within, refined and polished armor or outer casing, symmetrical ordered enhancements, harmonious natural or mechanical growth. Subtle transformation — the creature should remain clearly recognizable. {HISTORY_CONTEXT}

Apply these specific visual changes: {MODIFIER_DESCRIPTIONS}

Maintain the {FACTION_SHORT_DESCRIPTION} aesthetic throughout. Portrait orientation, centered composition, fantasy card game art, high detail, professional digital illustration, no text, no watermarks.
```

#### Chaos Evolution Prompt Template

```
Transform this {FACTION_NAME} creature with Chaos energy. Dramatically alter the design with wild volatile energy. Add fractured asymmetric elements breaking the original silhouette, red-purple crackling Chaos energy surging through and around the creature, jagged edges and distorted proportions, volatile auras, surging unstable power. Dramatic transformation — retain the creature's core identity but push it toward the extreme. {HISTORY_CONTEXT}

Apply these specific visual changes: {MODIFIER_DESCRIPTIONS}

Maintain the {FACTION_SHORT_DESCRIPTION} aesthetic but push it toward its most extreme and unstable expression. Portrait orientation, centered composition, fantasy card game art, high detail, professional digital illustration, no text, no watermarks.
```

#### History Context Strings (Inserted into Both Templates)

These are selected by the server based on the card's `evolution_history` record count and outcome distribution:

| Condition | History Context String |
|---|---|
| First evolution (0 previous) | *(empty string — omit this field)* |
| All Order so far | `This creature has been shaped entirely by Order energy, showing crystalline perfection and structured harmony. This evolution continues that refinement.` |
| All Chaos so far | `This creature has been wracked entirely by Chaos energy, showing fractured volatile forms barely held together. This evolution pushes further into dissolution.` |
| Mostly Order (Order > Chaos by 2+) | `This creature carries strong Order patterning — structured crystalline elements — but now Chaos energy breaks through the cracks.` |
| Mostly Chaos (Chaos > Order by 2+) | `This creature carries deep Chaos corruption — fractured volatile forms — but now Order energy attempts to crystallize and contain it.` |
| Balanced (Order == Chaos, or within 1) | `This creature carries both Order crystallization and Chaos fracturing in equal measure, a volatile balance of structured and wild energy.` |

#### FACTION_SHORT_DESCRIPTION Values (Insert Into Templates)

| Faction | FACTION_SHORT_DESCRIPTION |
|---|---|
| Ironwright Collective | `steampunk industrial brass-and-gears` |
| The Fey Courts | `ethereal fey nature bioluminescent` |
| The Demonic Kingdoms | `dark infernal demonic hellfire` |

---

### 1.4 Technical Parameters by Shard Quality

These are the exact values to pass in the fal.ai API request body.

| Parameter | Planar Shard (Free) | Refined Shard (Mid) | Prismatic Shard (High) |
|---|---|---|---|
| **Endpoint** | `fal-ai/flux-kontext/dev` | `fal-ai/flux-kontext/pro` | `fal-ai/flux-kontext/pro` |
| **`image_size`** | `portrait_4_3` (768×1024) | `square_hd` (1024×1024) | `square_hd` (1024×1024) |
| **`num_inference_steps`** | `28` | `32` | `40` |
| **`guidance_scale`** | `7.0` | `7.5` | `8.0` |
| **Passes** | 1 | 1 | 2 (generate then refine) |
| **Estimated cost** | ~$0.02 | ~$0.05 | ~$0.08 (both passes) |

#### Denoising Strength (`strength` parameter) by Evolution Tier and Outcome

| Evolution Step | Order `strength` | Chaos `strength` |
|---|---|---|
| Common → Uncommon | `0.35` | `0.65` |
| Uncommon → Rare | `0.40` | `0.70` |
| Rare → Epic | `0.45` | `0.75` |
| Epic → Legendary | `0.50` | `0.80` |

**Prismatic Second Pass (refinement):** After the first generation, call the API again with:
- `image_url`: URL of first-pass output
- Same prompt as first pass, prepended with: `Enhance lighting quality, sharpen details, improve overall fidelity without changing the composition or design.`
- `strength`: `0.20` (very low — polish only, no composition change)
- `num_inference_steps`: `20`

---

### 1.5 Visual Prompt Modifiers by Subscriber Tier

At evolution time, the player picks one modifier from a presented list. The server assembles the list based on the player's subscription tier and the faction of the evolving card. The selected modifier's description is inserted into the `{MODIFIER_DESCRIPTIONS}` slot in the evolution prompt template.

**Selection counts by tier (from `01-battle-mechanics.md` Section 6):**
- Free (Planar Shard): Player sees 2 options, picks 1 (1 universal + 1 faction)
- Mid (Refined Shard): Player sees 3 options, picks 1 (1 universal + 2 faction)
- Top (Prismatic Shard): Player sees 4 options, picks 1 (2 universal + 2 faction)

#### Universal Modifiers — All Tiers Have Access to These

These are the base 10. Free tier gets 2 presented per evolution (1 universal randomly drawn from this list, 1 faction from faction list below).

| ID | Display Name | Prompt Description String |
|---|---|---|
| U01 | Glowing Eyes | `eyes now glow with intense ethereal light in a contrasting color to the faction palette` |
| U02 | Battle-Scarred | `visible battle damage across the surface — dents, cracks, scorch marks, scratches earned through combat` |
| U03 | Heavy Armor | `additional protective plating or natural armor covering more of the body, reinforced and layered` |
| U04 | Crackling Energy | `arcs of crackling energy discharging across the surface in the faction's energy color` |
| U05 | Shadowed Form | `deep shadows pooling around the creature, partially obscuring details, wreathed in darkness` |
| U06 | Luminous Highlights | `points of soft glowing light emanating from key features, inner light shining through joints or seams` |
| U07 | Weathered and Ancient | `aged and worn appearance suggesting great age, weathering, and history — worn edges, faded markings` |
| U08 | Pristine and Perfect | `immaculate condition with a polished gleaming finish, perfect surfaces, no wear, idealized form` |
| U09 | Elemental Aura | `swirling elemental energy aura surrounding the creature — fire, ice, or lightning trails in motion` |
| U10 | Crystalline Growth | `crystals growing from the creature's surface, geometric and ordered, catching and refracting light` |

#### Universal Modifiers — Mid Tier Adds These (Total 20 Universal Options in Pool)

| ID | Display Name | Prompt Description String |
|---|---|---|
| U11 | Spectral Trails | `ghostly translucent afterimage trails following motion, as if the creature is partially phasing between planes` |
| U12 | Runic Inscriptions | `ancient runes and symbols carved or etched into the surface, glowing faintly` |
| U13 | Multi-Eyed | `additional eyes appearing across the body — some open, some half-closed, all aware` |
| U14 | Expanded Wings | `large impressive wings unfurling — feathered, membranous, or constructed depending on faction` |
| U15 | Imposing Scale | `the creature appears larger and more imposing, taking up more of the frame with increased presence` |
| U16 | Material Transformation | `parts of the body transform into a different material — stone, pure crystal, liquid metal` |
| U17 | Ethereal Glow | `soft overall ethereal luminescence, the creature partially translucent with inner light` |
| U18 | Ornate Decoration | `intricate ornamental decorations added to key features — filigree, emblems, ceremonial markings` |
| U19 | Tribal Markings | `bold painted or scarified tribal or clan markings across the body in contrasting pigment` |
| U20 | Dual Coloring | `the color palette splits — one side or element shifts to a contrasting color suggesting internal conflict` |

#### Universal Modifiers — Top Tier Adds These (Total 30 Universal Options in Pool)

| ID | Display Name | Prompt Description String |
|---|---|---|
| U21 | Planar Tear | `a visible tear in reality behind or around the creature, showing glimpses of another plane through the rift` |
| U22 | Dual Element Fusion | `two opposing elements fused visually on the creature — fire and ice simultaneously, light and shadow coexisting` |
| U23 | Impossible Geometry | `elements of the design that defy physical logic — recursive patterns, surfaces that fold into themselves` |
| U24 | Time Distortion | `visual blur artifacts suggesting motion through time, multiple overlapping ghost positions of the same creature` |
| U25 | Prismatic Refraction | `rainbow light diffraction patterns spreading from the creature, prismatic halos and refracted spectrum light` |
| U26 | Void-Touched | `patches of absolute nothingness — not shadow but true void — seeping into parts of the form` |
| U27 | Celestial Alignment | `cosmic energy and starfield patterns woven into the form, nebula colors deep in the surface` |
| U28 | Fractured Existence | `the creature appears in multiple slightly offset overlapping versions, as if existing in several states at once` |
| U29 | Transcendent Form | `the creature has begun ascending beyond its physical form — parts dissolving into pure energy while the core remains` |
| U30 | Mirror Echo | `a faint inverted reflection of the creature visible around it, as if its dimension-shadow is showing` |

---

#### Ironwright Collective Faction Modifiers

Free tier: 1 faction option drawn randomly from F01–F10.
Mid tier: 2 faction options drawn from F01–F18.
Top tier: 2 faction options drawn from F01–F28.

| ID | Display Name | Prompt Description String |
|---|---|---|
| IF01 | Reinforced Gears | `additional reinforced gear clusters installed at key joints, oversized and heavy-duty` |
| IF02 | Steam Venting | `multiple high-pressure steam vents erupting from the chassis in dramatic plumes` |
| IF03 | Hydraulic Pistons | `large visible hydraulic cylinders extending and contracting along the limbs` |
| IF04 | Rotating Components | `gear assemblies and rings visibly spinning and rotating as if running at high speed` |
| IF05 | Arc Lightning | `electrical arc discharges jumping between exposed metal components and conductors` |
| IF06 | Chrome Polish | `surfaces polished to mirror-chrome perfection, every reflection crisp and metallic` |
| IF07 | Overclocked State | `gears and components glowing red-hot from extreme overclocking, heat shimmer visible` |
| IF08 | Weapon Mounts | `modular weapon systems bolted onto chassis — barrels, blades, or energy emitters` |
| IF09 | Pressure Glow | `steam pressure vents glowing amber-orange from contained thermal energy about to release` |
| IF10 | Gyroscopic Rings | `concentric gyroscopic stabilizer rings orbiting the main body, spinning counterrotating` |
| IF11 | Copper Filigree | `decorative copper filigree scrollwork added to armor plates in intricate patterns` |
| IF12 | Riveted Overlay | `additional heavy riveting over seams and plating, studded reinforcement pattern` |
| IF13 | Exposed Internals | `a section of outer plating removed revealing complex internal clockwork mechanisms inside` |
| IF14 | Brass Antennae | `tall brass antennae or sensory arrays extending from the head or shoulders` |
| IF15 | Pneumatic Joints | `visible pneumatic tube connections between joint segments, pressurized and pulsing` |
| IF16 | Signal Lights | `colored indicator lights across the chassis blinking in patterns, amber and red status arrays` |
| IF17 | Armored Shell | `a secondary outer shell of thick iron plates adding bulk and imposing defensive mass` |
| IF18 | Chain Drive | `heavy chains connecting major moving components, mechanical drive system visible externally` |
| IF19 | Perpetual Motion Core | `a glowing core visible through the chest — a mechanism that runs without external power, impossibly` |
| IF20 | Quantum Gears | `gears that phase in and out of visibility, existing in multiple positions simultaneously` |
| IF21 | Dimension Pistons | `pistons that extend into a pocket dimension, disappearing and reappearing as they cycle` |
| IF22 | Singularity Heart | `a miniature singularity visible behind a crystal viewport in the chest, bending space slightly` |
| IF23 | Temporal Gears | `gears visibly running in reverse — counter-time mechanisms with timeline artifact trails` |
| IF24 | Nanoswarm Integration | `a cloud of microscopic mechanical drones swarming around the creature as an extension of itself` |
| IF25 | Antimatter Reactor | `a reactor core glowing with violent antimatter annihilation light, containment field visible` |
| IF26 | Reality Anchor | `thick bolts of energy anchoring the creature to the physical plane as if it might otherwise transcend` |
| IF27 | Tesseract Internals | `the creature's internals visible as a four-dimensional hypercube structure folding through itself` |
| IF28 | Infinite Regress | `mechanisms that contain smaller versions of themselves in an infinite regression visible through transparent panels` |

---

#### The Fey Courts Faction Modifiers

| ID | Display Name | Prompt Description String |
|---|---|---|
| FF01 | Flowering Blooms | `small flowers blooming across the vine and bark armor in symmetrical natural patterns` |
| FF02 | Antler Growth | `the antlers grow larger and more elaborate, branching with additional points and natural curves` |
| FF03 | Mycelial Threads | `bioluminescent mycelial threads extending from the body connecting to the ground or air around it` |
| FF04 | Autumn Transformation | `portions of the leaf and vine elements shifting to autumn colors — crimson, orange, gold` |
| FF05 | Starlight Aura | `soft starlight emanating from within the creature, points of light moving slowly around it` |
| FF06 | Root System | `deep root systems visible extending from the creature's feet or lower body into the ground` |
| FF07 | Wild Hunt Eyes | `eyes shift to predatory feral glow — sharp and intense like an apex nocturnal predator mid-hunt` |
| FF08 | Lunar Phases | `moon phase symbols appearing across the armor like natural markings, crescent to full` |
| FF09 | Thorn Spurs | `sharp defensive thorns erupting from joints and edges of the natural armor` |
| FF10 | Bioluminescent Veins | `bright bioluminescent veins running through bark and wood like a circulatory system, pulsing softly` |
| FF11 | Frost Crystals | `ice crystals forming on the creature's natural elements — winter encroaching on the fey form` |
| FF12 | Pollen Cloud | `a drifting cloud of luminescent pollen or spores surrounding the creature` |
| FF13 | Living Canopy | `small tree branches growing from the shoulder or head area, leafed out as a natural crown` |
| FF14 | Mushroom Caps | `large bioluminescent mushroom caps growing from the back or shoulders as natural protrusions` |
| FF15 | River Stones | `smooth river-worn stones embedded naturally into the bark armor like embedded gems` |
| FF16 | Moth Wings | `large moth or luna moth wings unfurled behind the creature, patterned with eye markings` |
| FF17 | Spider Web Armor | `gossamer spider silk reinforcing the bark armor like natural chainmail, dew-beaded` |
| FF18 | Coral Growth | `pale ethereal coral formations growing across portions of the figure as natural enchantment` |
| FF19 | World Tree Connection | `a golden thread of light connecting the creature up to the sky where the World Tree exists` |
| FF20 | Dreaming Realm Bleed | `sections of the creature blurring into dream-reality, fuzzy edges with dream imagery seeping through` |
| FF21 | All Seasons | `all four seasons visible simultaneously across the creature — winter frost, spring bloom, summer green, autumn red` |
| FF22 | Primordial Form | `the creature reverts toward its oldest primal shape — older, rawer, more powerful and less refined` |
| FF23 | Constellation Map | `the creature's surface becomes a star map, constellations visible like glowing freckles` |
| FF24 | Living Ecosystem | `tiny animals and insects living on the creature as part of its form — symbiotic organisms visible` |
| FF25 | Eternal Bloom Cycle | `flowers rapidly blooming and dying in fast-forward cycle, life and death simultaneous on the form` |
| FF26 | Fey Crown | `a crown of living light and antler materializing above the creature's head, a mark of fey royalty` |
| FF27 | Nature's Wrath | `storm energy conducting through the natural elements — lightning following the root and vine paths` |
| FF28 | Verdant Singularity | `a concentrated point of green-gold life energy at the chest, from which all natural energy radiates` |

---

#### The Demonic Kingdoms Faction Modifiers

| ID | Display Name | Prompt Description String |
|---|---|---|
| DF01 | Flame Wreathed | `the creature engulfed in a hellfire corona, active flames licking across corrupted flesh and armor` |
| DF02 | Bone Spurs | `jagged bone spurs erupting from joints and edges of the corrupted flesh` |
| DF03 | Molten Cracks | `glowing molten lava cracks running through the flesh and armor like veins of liquid fire` |
| DF04 | Infernal Runes | `infernal runes etched across the body glowing with intense crimson power` |
| DF05 | Shadow Tendrils | `writhing shadow tendrils extending from the creature, partially corporeal and reaching` |
| DF06 | Blood Ritual Marks | `blood ritual markings across the body — ancient symbols painted in dark ichor` |
| DF07 | Corruption Pulse | `corrupted flesh pulsing with dark energy, visible distortion waves emanating outward` |
| DF08 | Sulfurous Smoke | `thick sulfurous yellow-gray smoke rising from the creature, the smell of brimstone implied` |
| DF09 | Demon Wings | `large leathery demon wings unfurled fully, membranes stretched, imposing span` |
| DF10 | Hellfire Corona | `an intense crown of hellfire above the head, brighter and more aggressive than standard flame` |
| DF11 | Obsidian Spikes | `obsidian crystal spikes growing from the armor and flesh, black volcanic glass sharp-edged` |
| DF12 | Ichor Drip | `dark supernatural ichor dripping from wounds or edges, pooling slightly below` |
| DF13 | Necrotic Patches | `patches of necrotic energy decay visible in the flesh, dark purple-black corruption spreading` |
| DF14 | Skull Motifs | `skull imagery carved into or growing from the armor, demonic heraldry of death` |
| DF15 | Chain Bindings | `heavy cursed chains wrapped around parts of the creature, glowing with infernal sigils` |
| DF16 | Eye Cluster | `additional demonic eyes opening across the body — multi-pupiled and glowing` |
| DF17 | Void Hunger | `a visible sphere of consuming void darkness at the chest, pulling light inward` |
| DF18 | Ash Fall | `ash and cinders constantly falling from the creature as it moves, leaving a trail` |
| DF19 | Abyssal Core | `a visible portal to the demon plane at the creature's chest — a window into the abyss` |
| DF20 | Multi-Planar Corruption | `the creature exists across multiple planes simultaneously, translucent demon-plane versions visible overlapping` |
| DF21 | Chaos God Blessing | `a massive divine sigil of a chaos god hovering above or behind the creature, crackling` |
| DF22 | Soul Consumption Aura | `an aura of consuming hunger, visible as wisps of light being drawn into the creature from around it` |
| DF23 | Hellscape Integration | `the volcanic hellscape terrain literally merging with the creature — rock and lava becoming part of its form` |
| DF24 | Ascension Wings | `wings that transform into something beyond demonic — larger, stranger, partly cosmic` |
| DF25 | Blood Moon | `a blood-red moon visible as a halo behind the creature's head, infernal light source` |
| DF26 | Infernal Throne | `a fragment of obsidian infernal throne materialized behind the creature, marking it as a ruler` |
| DF27 | Apocalypse Herald | `the creature radiates an apocalyptic aura — cracks in reality spreading behind it, worlds ending at its back` |
| DF28 | Sin Manifest | `one of the cardinal sins made visually manifest on the form — wrath, pride, or hunger given shape` |

---

## 2. Text Generation Pipeline (OpenAI GPT-4o Mini)

All text generation uses `gpt-4o-mini` at the OpenAI API. Endpoint: `POST https://api.openai.com/v1/chat/completions`. Auth: `Authorization: Bearer ${OPENAI_API_KEY}`.

**Standard request parameters:**
```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.8,
  "max_tokens": 150,
  "messages": [...]
}
```

---

### 2.1 Card Naming

Called during every evolution. Generates 3 candidates; player picks 1.

#### Exact System Prompt

```
You are a card name generator for a fantasy card game called Chaos Creatures. You output only valid JSON. Never include explanations, preambles, or any text outside the JSON array.
```

#### Exact User Prompt Template

```
FACTION: {faction_name}
FACTION VOICE: {faction_name_voice}
BASE NAME: {template_base_name}
EVOLUTION TIER: {to_tier}
EVOLUTION DIRECTION: {actual_outcome}
EVOLUTION HISTORY: {chaos_count} Chaos evolutions, {order_count} Order evolutions before this one
PREVIOUS NAMES: {json_array_of_previous_names}

Generate exactly 3 card name candidates. Rules:
- 2 to 4 words maximum per name
- Must match the faction voice exactly
- Must reflect evolution toward {actual_outcome}
- Must show progression from the most recent name: "{most_recent_name}"
- Order evolution names: suggest refinement, structure, titles, crystallization, mastery
- Chaos evolution names: suggest power, wildness, corruption, rage, transformation
- Do not reuse any name from PREVIOUS NAMES

Return ONLY this JSON array, nothing else:
["Name One", "Name Two", "Name Three"]
```

#### Faction Name Voice Strings (Insert Into `{faction_name_voice}`)

**Ironwright Collective:**
```
Industrial and precise. Use engineering terminology: Cogwork, Piston, Valve, Forged, Tempered, Wrought, Clockwork. Use functional titles: Warden, Sentinel, Overseer, Architect. Reference places of craft: Forge, Foundry, Crucible, Anvil. Compound nouns preferred. Examples: Brassbound Guardian, Steamforged Titan, Ironwrought Sentinel.
```

**The Fey Courts:**
```
Lyrical and ancient. Use nature terms: Thorn, Root, Bloom, Vine, Grove, Glade, Moss. Use fey titles: Lord, Lady, Warden, Huntress, Speaker, Court. Use seasons and celestial: Spring, Autumn, Moon, Star, Dawn. Use mythic descriptors: Verdant, Eternal, Wild, Ancient. Poetic structures preferred. Examples: Thornwood, Crown of the Wilds — Moonpetal Huntress — the Eternal Grove.
```

**The Demonic Kingdoms:**
```
Visceral and direct. Use dark materials: Ash, Bone, Blood, Shadow, Flame, Cinder, Ruin, Void. Use violent action: Reaver, Ripper, Render, Scar, Breaker. Use infernal titles: Tyrant, Lord, Unbound, Forsaken, Damned, Herald. Use concepts of sin: Wrath, Hunger, Ruin, Agony. Direct hard sounds preferred. Examples: Ashblade, Lord of Ruin — Bloodrite Reaver — the Unbound Hunger.
```

#### Concrete Naming Examples (Actual Input/Output)

**Example 1 — Ironwright, Common → Uncommon, Chaos outcome:**

User prompt (with fields filled in):
```
FACTION: Ironwright Collective
FACTION VOICE: Industrial and precise. Use engineering terminology: Cogwork, Piston, Valve, Forged, Tempered, Wrought, Clockwork. Use functional titles: Warden, Sentinel, Overseer, Architect. Reference places of craft: Forge, Foundry, Crucible, Anvil. Compound nouns preferred. Examples: Brassbound Guardian, Steamforged Titan, Ironwrought Sentinel.
BASE NAME: Cogwork Stalker
EVOLUTION TIER: UNCOMMON
EVOLUTION DIRECTION: CHAOS
EVOLUTION HISTORY: 0 Chaos evolutions, 0 Order evolutions before this one
PREVIOUS NAMES: ["Cogwork Stalker"]

Generate exactly 3 card name candidates...
```

Expected output:
```json
["Overclocked Stalker", "Cogwork Fury", "Stalker Unbound"]
```

**Example 2 — Fey Courts, Rare → Epic, Order outcome:**

User prompt:
```
FACTION: The Fey Courts
FACTION VOICE: Lyrical and ancient...
BASE NAME: Thornwood Warden
EVOLUTION TIER: EPIC
EVOLUTION DIRECTION: ORDER
EVOLUTION HISTORY: 1 Chaos evolution, 2 Order evolutions before this one
PREVIOUS NAMES: ["Thornwood Warden", "Thornwood Sentinel", "Thornwood, the Verdant"]

Generate exactly 3 card name candidates...
```

Expected output:
```json
["Thornwood, Crown of the Wilds", "Thornwood Archon", "Thornwood, Eternal Guardian"]
```

**Example 3 — Demonic Kingdoms, Epic → Legendary, Chaos outcome, all-Chaos history:**

User prompt:
```
FACTION: The Demonic Kingdoms
FACTION VOICE: Visceral and direct...
BASE NAME: Ashblade Reaver
EVOLUTION TIER: LEGENDARY
EVOLUTION DIRECTION: CHAOS
EVOLUTION HISTORY: 3 Chaos evolutions, 0 Order evolutions before this one
PREVIOUS NAMES: ["Ashblade Reaver", "Ashblade Executioner", "Ashblade, the Unbound", "Ashblade Tyrant"]

Generate exactly 3 card name candidates...
```

Expected output:
```json
["Ashblade, Chaos Incarnate", "Ashblade, Lord of Ruin", "Ashblade the Apocalyptic"]
```

---

### 2.2 Flavor Text Generation

Called during every evolution. Generates one flavor text string, max 120 characters.

#### Exact System Prompt

```
You are a flavor text writer for a fantasy card game called Chaos Creatures. You write short evocative lore snippets. You output only the flavor text string — no quotes, no labels, no other text.
```

#### Exact User Prompt Template

```
FACTION: {faction_name}
FACTION TONE: {faction_flavor_tone}
CARD NAME: {chosen_name}
EVOLUTION TIER: {to_tier}
EVOLUTION DIRECTION: {actual_outcome}
PREVIOUS FLAVOR TEXT: "{previous_flavor_text}"

Write exactly one flavor text entry. Rules:
- 1 to 2 sentences maximum
- Maximum 120 characters total
- Matches the faction tone
- Reflects evolution toward {actual_outcome}
- Does NOT reference game mechanics or stats
- Stands alone without needing context
- Order tone: reverent, structured, protective, patient, wise
- Chaos tone: fierce, ominous, powerful, unstable, consuming

Output only the flavor text, nothing else.
```

#### Faction Flavor Tone Strings (Insert Into `{faction_flavor_tone}`)

**Ironwright Collective:**
```
Technical reverence for craftsmanship. Emphasizes function, precision, and engineering. Order = perfected systems, harmonious mechanisms. Chaos = overloaded, screaming gears, design pushed beyond limits. Tone is clipped and declarative — short sentences that sound like engineer's notes.
```

**The Fey Courts:**
```
Ancient and lyrical. Emphasizes cycles, memory, wildness, and time. Order = harmony with nature, patient growth, eternal memory. Chaos = the wild hunt, primal fury, untamed power that predates civilization. Tone is poetic but not flowery — spare and weighted with age.
```

**The Demonic Kingdoms:**
```
Visceral and direct. Emphasizes power, sacrifice, consumption, and hunger. Order = controlled fury, pacts honored in blood, restrained corruption. Chaos = unbound carnage, self-immolation for power, apocalyptic hunger. Tone is declarative and ominous — short sentences like dark scripture.
```

#### Concrete Flavor Text Examples (Actual Input/Output)

**Ironwright, Uncommon, Chaos:**
Input uses FACTION TONE above, CARD NAME: "Overclocked Stalker", previous: "Built to hunt. Built to last."
Output:
```
The gears scream, but they hold. They always hold.
```

**Ironwright, Legendary, Order:**
Input: CARD NAME: "Brassforge Colossus", Chaos direction.
Output:
```
Precision tolerances. Redundant systems. A masterpiece of function over flaw.
```

**Fey Courts, Rare, Order:**
Input: CARD NAME: "Thornwood, the Verdant".
Output:
```
In stillness, the grove remembers every leaf, every root, every season since the world was young.
```

**Fey Courts, Epic, Chaos:**
Input: CARD NAME: "Thornwood Archon".
Output:
```
When the hunt rides, even the moon hides her face.
```

**Demonic Kingdoms, Uncommon, Chaos:**
Input: CARD NAME: "Ashblade Executioner".
Output:
```
It does not hunger. It IS hunger.
```

**Demonic Kingdoms, Legendary, Order:**
Input: CARD NAME: "Bloodrite Warlord, the Bound".
Output:
```
The pact is written in blood. It will be paid in blood.
```

---

### 2.3 Evolution Narrative (Epic and Legendary Tiers Only)

Displayed during the evolution ceremony animation for Epic and Legendary evolutions. Not generated for Common→Uncommon or Uncommon→Rare.

#### Exact System Prompt

```
You are writing evolution narrative text for a fantasy card game called Chaos Creatures. You output only the narrative text — no labels, no formatting, no other text.
```

#### Exact User Prompt Template

```
FACTION: {faction_name}
CREATURE NAME BEFORE: {previous_name}
CREATURE NAME AFTER: {chosen_name}
EVOLUTION DIRECTION: {actual_outcome}
VISUAL CHANGES: {player_selected_modifier_display_name}

Write a 2 to 3 sentence narrative describing the moment the Planar Shard channels chaos energy and transforms this creature. Match the faction voice exactly. Order evolutions: tone is reverent, structured, a controlled transformation. Chaos evolutions: tone is violent, explosive, transcendent through destruction. Reference the visual change described in VISUAL CHANGES.

Output only the narrative, nothing else.
```

#### Concrete Narrative Examples

**Ironwright, Chaos, modifier: "Overclocked State":**
```
The Planar Shard cracks open and raw chaos floods the cogwork chassis.
Gears spin beyond their rated tolerances, friction igniting into arcs of crimson lightning.
What emerges is no longer a tool — it is a weapon, and it has chosen itself.
```

**Fey Courts, Order, modifier: "Crystalline Growth":**
```
The shard's light is soft, patient — like dawn through mist on still water.
The creature stands motionless as crystalline patterns bloom across bark and vine, each facet locking into perfect symmetry.
This is what the forest always meant to become.
```

**Demonic Kingdoms, Chaos, modifier: "Molten Cracks":**
```
The shard detonates. Hellfire rips through flesh and bone, carving molten channels that pulse with the heartbeat of the Abyss.
Pain is not an obstacle. Pain is the transformation.
Ruin is purpose. Purpose is everything.
```

**Ironwright, Order, modifier: "Chrome Polish":**
```
Precision tolerances re-established. Every surface polished to theoretical perfection.
The chaos energy is not expelled — it is organized, compressed, made useful.
The Shard closes. The machine is better than its design intended.
```

---

### 2.4 Prewritten Event Flavor Text

Event flavor text is NOT AI-generated. All 16 events have static prewritten strings. These are stored in the database at seed time, never called from an API during gameplay.

#### Order Events

| Event ID | Name | Flavor Text |
|---|---|---|
| O1 | Mending Light | `A pulse of gentle radiance knits wounds and steadies breath.` |
| O2 | Planar Ward | `The Shard hums. The air crystallizes. Hold the line.` |
| O3 | Steady Growth | `Roots do not rush. They endure, and enduring, they prevail.` |
| O4 | Clarity | `For one clear moment, every move is obvious.` |
| O5 | Fortify | `Not all strength is raw. Some must be placed with care.` |
| O6 | Sanctuary | `The order holds. It always holds, if you let it.` |
| O7 | Bulwark | `Shore up the weakness. Build the wall from the breach outward.` |
| O8 | Harmonize | `All wounds remembered. All strength renewed. The battle continues.` |

#### Chaos Events

| Event ID | Name | Flavor Text |
|---|---|---|
| C1 | Surge | `Something snaps. The chaos finds a vessel — and the vessel obliges.` |
| C2 | Wildfire | `The roll ignites. Chaos does not ask permission.` |
| C3 | Upheaval | `It hits everything. That was never the point.` |
| C4 | Frenzy | `All of them. All at once. The chaos does not discriminate.` |
| C5 | Rift Bolt | `The Plane tears. The damage finds the face it was looking for.` |
| C6 | Chaos Siphon | `It hurts. It always hurts. But the survivor will be magnificent.` |
| C7 | Maelstrom | `Nobody controls a maelstrom. That is the entire point.` |
| C8 | Overcharge | `More. Always more. The limits were someone else's idea.` |

---

## 3. Faction Voice Guides

Reference section for image prompt and text prompt writers. Every AI call referencing faction voice should pull from here.

### 3.1 Ironwright Collective (Steampunk)

**Core Identity:** Precision, engineering, industry, progress through invention.

**Visual Vocabulary:**
- Materials: brass, copper, steel, bronze, iron
- Components: gears, pistons, clockwork, hydraulics, rivets, vents, conduits, springs
- Atmosphere: steam, pressure, heat, spark, forge, furnace
- Palette: warm metallics — gold, amber, rust, orange, dark iron
- Era: Victorian-industrial, not futuristic

**Image Generation Voice:** Industrial mechanical precision. Warm tones. Every detail should look like it was engineered with purpose. Nothing organic unless it has been mechanized.

**Text Generation Voice:** Clipped declarative sentences. Engineering terminology. Reverence for function and design. Avoid flowery language.

**Order Aesthetic:** Perfect engineering, harmonious systems, redundant safeguards, polished to spec.
**Chaos Aesthetic:** Overclock, strain, pushed beyond tolerances, glorious catastrophic malfunction.

**Full Name Progression Example (Clockwork Wolf, all-Chaos path):**
- Common: Cogwork Stalker
- Uncommon (Chaos): Overclocked Stalker
- Rare (Chaos): Cogwork Fury, the Unshackled
- Epic (Chaos): Steamforged Berserker
- Legendary (Chaos): The Eternal Engine, Unbound

**Full Name Progression Example (Clockwork Wolf, all-Order path):**
- Common: Cogwork Stalker
- Uncommon (Order): Tempered Stalker
- Rare (Order): Ironwrought Warden
- Epic (Order): Brassbound Sentinel
- Legendary (Order): Brassforge Colossus, Perfected

---

### 3.2 The Fey Courts (High Fantasy / Fey and Druidic)

**Core Identity:** Ethereal, wild, ancient. Nature and magic intertwined. Older than civilization.

**Visual Vocabulary:**
- Materials: living wood, bark, vines, roots, moss, crystal, bone (natural)
- Flora: bioluminescent mushrooms, moonflowers, thorns, lichen, ancient canopy
- Fauna: antlers, feathers, insect wings, natural armor
- Light: moonlight, starlight, dawn, bioluminescence, motes of drifting light
- Palette: cool naturals — deep greens, silver, violet, soft gold highlights, cyan bioluminescence

**Image Generation Voice:** Ancient organic beauty that breathes. Light should feel soft and natural. Growth and decay coexisting. Every surface should look like it grew rather than was made.

**Text Generation Voice:** Spare and ancient. Lyrical without being flowery. Short sentences weighted with age. The fey do not explain themselves.

**Order Aesthetic:** Harmony with nature's cycles, patient growth, crystallized permanence, the still forest.
**Chaos Aesthetic:** The wild hunt, primal fury older than gods, untameable power, the forest in storm.

**Full Name Progression Example (Fey Warden, mixed path):**
- Common: Thornwood Warden
- Uncommon (Order): Thornwood Sentinel
- Rare (Order): Thornwood, the Verdant
- Epic (Chaos): Thornwood Archon
- Legendary (Order): Thornwood, Crown of the Wilds

---

### 3.3 The Demonic Kingdoms (Dark Fantasy / Infernal)

**Core Identity:** Visceral, corrupted, power at any cost, infernal hunger.

**Visual Vocabulary:**
- Materials: obsidian, bone, corrupted flesh, ichor, hellstone
- Fire: hellfire, infernal flames, volcanic ash, molten cracks, embers
- Darkness: shadow, void, abyssal dark, deep crimson
- Markings: infernal runes, glyphs, sigils, blood ritual marks
- Palette: dark — near-black, deep crimson, purple-black, occasional sickly yellow-green

**Image Generation Voice:** Visceral weight and menace. Dark but not muddy — the reds and purples should be intense. Everything looks like it costs something. Pain and power are the same thing here.

**Text Generation Voice:** Direct, declarative, ominous. Short harsh sentences. Like dark scripture. Never whimsical.

**Order Aesthetic:** Controlled fury, infernal pacts honored, restrained corruption as a weapon.
**Chaos Aesthetic:** Unbound carnage, self-immolation for power, the apocalypse as a personal expression.

**Full Name Progression Example (Ashblade Reaver, all-Chaos path):**
- Common: Ashblade Reaver
- Uncommon (Chaos): Ashblade Executioner
- Rare (Chaos): Ashblade, the Unbound
- Epic (Chaos): Ashblade Tyrant
- Legendary (Chaos): Ashblade, Chaos Incarnate

---

## 4. Prompt Construction Algorithm

This is the exact server-side logic that assembles prompts. Claude Code implements this as TypeScript functions in the Railway game server (or Supabase Edge Function for evolution triggers).

### 4.1 Evolution Image Prompt Assembly

**Function signature:**
```typescript
function buildEvolutionImagePrompt(
  cardInstance: CardInstance,
  evolutionOutcome: 'ORDER' | 'CHAOS',
  selectedModifierId: string,   // e.g. "IF03" or "U07"
  shardQuality: 'PLANAR' | 'REFINED' | 'PRISMATIC'
): FalAiRequestBody
```

**Step-by-step assembly:**

**Step 1: Determine faction prefix**
```typescript
const factionPrefixes: Record<string, string> = {
  'IRONWRIGHT':       'steampunk mechanical creature, brass and copper materials, exposed gears and clockwork mechanisms, riveted metal plating, steam vents, intricate precision engineering, industrial Victorian aesthetic, warm metallic tones with amber and rust highlights, glowing amber lenses',
  'FEY_COURTS':       'ethereal fey fantasy creature, ancient forest setting, bioluminescent flora and glowing fungi, living wood and vine armor, mystical natural magic, soft moonlight and starlight illumination, organic flowing forms, moss and crystal accents, cool nature palette with silver and violet highlights',
  'DEMONIC_KINGDOMS': 'demonic corrupted dark fantasy creature, hellfire and deep shadow, obsidian and bone construction, infernal glyphs and runes, corrupted flesh with visible strain, volcanic ash and floating embers, blood-red and deep purple-black tones, visceral menacing presence'
};
const factionPrefix = factionPrefixes[cardInstance.faction_id];
```

**Step 2: Determine evolution direction instruction**
```typescript
const ORDER_INSTRUCTION = 'Transform this creature with Order energy. Refine and structure the design. Add crystalline geometric patterns growing from the surface, luminous blue-white-gold Order energy emanating from within, refined and polished armor or outer casing, symmetrical ordered enhancements, harmonious growth. Subtle transformation — the creature should remain clearly recognizable.';

const CHAOS_INSTRUCTION = 'Transform this creature with Chaos energy. Dramatically alter the design with wild volatile energy. Add fractured asymmetric elements, red-purple crackling Chaos energy surging through and around the creature, jagged edges and distorted proportions, volatile auras, surging unstable power. Dramatic transformation — retain core identity but push toward the extreme.';

const directionInstruction = evolutionOutcome === 'ORDER' ? ORDER_INSTRUCTION : CHAOS_INSTRUCTION;
```

**Step 3: Build evolution history context**
```typescript
function getHistoryContext(history: EvolutionRecord[]): string {
  if (history.length === 0) return '';
  const chaosCount = history.filter(r => r.actual_outcome === 'CHAOS').length;
  const orderCount = history.filter(r => r.actual_outcome === 'ORDER').length;

  if (chaosCount === 0) return 'This creature has been shaped entirely by Order energy, showing crystalline perfection and structured harmony. This evolution continues that refinement.';
  if (orderCount === 0) return 'This creature has been wracked entirely by Chaos energy, showing fractured volatile forms barely held together. This evolution pushes further into dissolution.';
  if (chaosCount >= orderCount + 2) return 'This creature carries deep Chaos corruption — fractured volatile forms — but now Order energy attempts to crystallize and contain it.';
  if (orderCount >= chaosCount + 2) return 'This creature carries strong Order patterning — structured crystalline elements — but now Chaos energy breaks through the cracks.';
  return 'This creature carries both Order crystallization and Chaos fracturing in equal measure, a volatile balance of structured and wild energy.';
}
const historyContext = getHistoryContext(cardInstance.evolution_history);
```

**Step 4: Get modifier description**
```typescript
// MODIFIER_PROMPT_DESCRIPTIONS is a Record<string, string> mapping modifier ID to prompt description
// See full table in Section 1.5 above
const modifierDescription = MODIFIER_PROMPT_DESCRIPTIONS[selectedModifierId];
```

**Step 5: Assemble full prompt**
```typescript
const factionShortDescriptions: Record<string, string> = {
  'IRONWRIGHT':       'steampunk industrial brass-and-gears',
  'FEY_COURTS':       'ethereal fey nature bioluminescent',
  'DEMONIC_KINGDOMS': 'dark infernal demonic hellfire'
};

const prompt = [
  directionInstruction,
  historyContext,
  `Apply these specific visual changes: ${modifierDescription}.`,
  `Maintain the ${factionShortDescriptions[cardInstance.faction_id]} aesthetic throughout.`,
  'Portrait orientation, centered composition, fantasy card game art, high detail, professional digital illustration, no text, no watermarks.'
].filter(Boolean).join('\n\n');
```

**Step 6: Set technical parameters based on shard quality and tier**
```typescript
const STRENGTH_TABLE = {
  ORDER: { COMMON: 0.35, UNCOMMON: 0.40, RARE: 0.45, EPIC: 0.50 },
  CHAOS: { COMMON: 0.65, UNCOMMON: 0.70, RARE: 0.75, EPIC: 0.80 }
};

const endpointMap = {
  PLANAR:   'fal-ai/flux-kontext/dev',
  REFINED:  'fal-ai/flux-kontext/pro',
  PRISMATIC: 'fal-ai/flux-kontext/pro'
};

const imageSizeMap = {
  PLANAR:   'portrait_4_3',
  REFINED:  'square_hd',
  PRISMATIC: 'square_hd'
};

const stepsMap = { PLANAR: 28, REFINED: 32, PRISMATIC: 40 };
const guidanceMap = { PLANAR: 7.0, REFINED: 7.5, PRISMATIC: 8.0 };

const strength = STRENGTH_TABLE[evolutionOutcome][cardInstance.tier];

return {
  endpoint: endpointMap[shardQuality],
  body: {
    image_url:            cardInstance.art_url,  // current tier art as reference
    prompt:               prompt,
    negative_prompt:      'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects',
    image_size:           imageSizeMap[shardQuality],
    num_inference_steps:  stepsMap[shardQuality],
    guidance_scale:       guidanceMap[shardQuality],
    strength:             strength,
    num_images:           1,
    enable_safety_checker: true,
    output_format:        'webp'
  },
  needsSecondPass: shardQuality === 'PRISMATIC'
};
```

**Step 7 (Prismatic only): Second refinement pass**
```typescript
if (needsSecondPass) {
  const refinementRequest = {
    endpoint: 'fal-ai/flux-kontext/pro',
    body: {
      image_url:           firstPassOutputUrl,
      prompt:              `Enhance lighting quality, sharpen details, improve overall fidelity without changing the composition or design. ${prompt}`,
      negative_prompt:     STANDARD_NEGATIVE_PROMPT,
      image_size:          'square_hd',
      num_inference_steps: 20,
      guidance_scale:      8.0,
      strength:            0.20,
      num_images:          1,
      enable_safety_checker: true,
      output_format:       'webp'
    }
  };
}
```

---

### 4.2 Text Prompt Assembly

**Function signature:**
```typescript
function buildNamingPrompt(
  cardInstance: CardInstance,
  evolutionOutcome: 'ORDER' | 'CHAOS',
  toTier: string
): OpenAIRequestBody
```

```typescript
const FACTION_NAME_VOICES: Record<string, string> = {
  'IRONWRIGHT':       'Industrial and precise. Use engineering terminology: Cogwork, Piston, Valve, Forged, Tempered, Wrought, Clockwork. Use functional titles: Warden, Sentinel, Overseer, Architect. Reference places of craft: Forge, Foundry, Crucible, Anvil. Compound nouns preferred.',
  'FEY_COURTS':       'Lyrical and ancient. Use nature terms: Thorn, Root, Bloom, Vine, Grove, Glade, Moss. Use fey titles: Lord, Lady, Warden, Huntress, Speaker, Court. Use seasons and celestial: Spring, Autumn, Moon, Star, Dawn. Use mythic descriptors: Verdant, Eternal, Wild, Ancient. Poetic structures preferred.',
  'DEMONIC_KINGDOMS': 'Visceral and direct. Use dark materials: Ash, Bone, Blood, Shadow, Flame, Cinder, Ruin, Void. Use violent action: Reaver, Ripper, Render, Scar, Breaker. Use infernal titles: Tyrant, Lord, Unbound, Forsaken, Damned, Herald. Direct hard sounds preferred.'
};

const previousNames = [
  cardInstance.template_name,
  ...cardInstance.evolution_history.map(r => r.name_chosen)
];
const chaosCount = cardInstance.evolution_history.filter(r => r.actual_outcome === 'CHAOS').length;
const orderCount = cardInstance.evolution_history.filter(r => r.actual_outcome === 'ORDER').length;

const userPrompt = `FACTION: ${cardInstance.faction_name}
FACTION VOICE: ${FACTION_NAME_VOICES[cardInstance.faction_id]}
BASE NAME: ${cardInstance.template_name}
EVOLUTION TIER: ${toTier}
EVOLUTION DIRECTION: ${evolutionOutcome}
EVOLUTION HISTORY: ${chaosCount} Chaos evolutions, ${orderCount} Order evolutions before this one
PREVIOUS NAMES: ${JSON.stringify(previousNames)}

Generate exactly 3 card name candidates. Rules:
- 2 to 4 words maximum per name
- Must match the faction voice exactly
- Must reflect evolution toward ${evolutionOutcome}
- Must show progression from the most recent name: "${previousNames[previousNames.length - 1]}"
- Order evolution names: suggest refinement, structure, titles, crystallization, mastery
- Chaos evolution names: suggest power, wildness, corruption, rage, transformation
- Do not reuse any name from PREVIOUS NAMES

Return ONLY this JSON array, nothing else:
["Name One", "Name Two", "Name Three"]`;

return {
  model: 'gpt-4o-mini',
  temperature: 0.8,
  max_tokens: 100,
  messages: [
    { role: 'system', content: 'You are a card name generator for a fantasy card game called Chaos Creatures. You output only valid JSON. Never include explanations, preambles, or any text outside the JSON array.' },
    { role: 'user', content: userPrompt }
  ]
};
```

---

### 4.3 Complete End-to-End Example Prompts

#### Ironwright — Common to Uncommon, Chaos, Free Tier

Reference image: `https://r2.chaos-creatures.com/art/abc123/common.webp` (clockwork wolf)
Selected modifier: IF02 (Steam Venting)
Shard: PLANAR

**fal.ai request body:**
```json
{
  "image_url": "https://r2.chaos-creatures.com/art/abc123/common.webp",
  "prompt": "Transform this creature with Chaos energy. Dramatically alter the design with wild volatile energy. Add fractured asymmetric elements, red-purple crackling Chaos energy surging through and around the creature, jagged edges and distorted proportions, volatile auras, surging unstable power. Dramatic transformation — retain core identity but push toward the extreme.\n\nApply these specific visual changes: multiple high-pressure steam vents erupting from the chassis in dramatic plumes.\n\nMaintain the steampunk industrial brass-and-gears aesthetic throughout.\n\nPortrait orientation, centered composition, fantasy card game art, high detail, professional digital illustration, no text, no watermarks.",
  "negative_prompt": "text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects",
  "image_size": "portrait_4_3",
  "num_inference_steps": 28,
  "guidance_scale": 7.0,
  "strength": 0.65,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "webp"
}
```

**GPT-4o Mini naming request body:**
```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.8,
  "max_tokens": 100,
  "messages": [
    {
      "role": "system",
      "content": "You are a card name generator for a fantasy card game called Chaos Creatures. You output only valid JSON. Never include explanations, preambles, or any text outside the JSON array."
    },
    {
      "role": "user",
      "content": "FACTION: Ironwright Collective\nFACTION VOICE: Industrial and precise...\nBASE NAME: Cogwork Stalker\nEVOLUTION TIER: UNCOMMON\nEVOLUTION DIRECTION: CHAOS\nEVOLUTION HISTORY: 0 Chaos evolutions, 0 Order evolutions before this one\nPREVIOUS NAMES: [\"Cogwork Stalker\"]\n\nGenerate exactly 3 card name candidates..."
    }
  ]
}
```

---

#### Fey Courts — Uncommon to Rare, Order, Mid Tier

Reference image: previously evolved art at Uncommon tier
Selected modifier: FF05 (Starlight Aura) — from faction pool
Shard: REFINED

**fal.ai request body:**
```json
{
  "image_url": "https://r2.chaos-creatures.com/art/def456/uncommon.webp",
  "prompt": "Transform this creature with Order energy. Refine and structure the design. Add crystalline geometric patterns growing from the surface, luminous blue-white-gold Order energy emanating from within, refined and polished armor or outer casing, symmetrical ordered enhancements, harmonious growth. Subtle transformation — the creature should remain clearly recognizable.\n\nThis creature has been shaped entirely by Order energy, showing crystalline perfection and structured harmony. This evolution continues that refinement.\n\nApply these specific visual changes: soft starlight emanating from within the creature, points of light moving slowly around it.\n\nMaintain the ethereal fey nature bioluminescent aesthetic throughout.\n\nPortrait orientation, centered composition, fantasy card game art, high detail, professional digital illustration, no text, no watermarks.",
  "negative_prompt": "text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects",
  "image_size": "square_hd",
  "num_inference_steps": 32,
  "guidance_scale": 7.5,
  "strength": 0.40,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "webp"
}
```

---

#### Demonic Kingdoms — Epic to Legendary, Chaos, Top Tier (2 passes)

Reference image: previously evolved Epic-tier art (3 Chaos evolutions prior)
Selected modifier: DF27 (Apocalypse Herald) — top-tier exclusive
Shard: PRISMATIC

**First pass fal.ai request body:**
```json
{
  "image_url": "https://r2.chaos-creatures.com/art/ghi789/epic.webp",
  "prompt": "Transform this creature with Chaos energy. Dramatically alter the design with wild volatile energy. Add fractured asymmetric elements, red-purple crackling Chaos energy surging through and around the creature, jagged edges and distorted proportions, volatile auras, surging unstable power. Dramatic transformation — retain core identity but push toward the extreme.\n\nThis creature has been wracked entirely by Chaos energy, showing fractured volatile forms barely held together. This evolution pushes further into dissolution.\n\nApply these specific visual changes: the creature radiates an apocalyptic aura — cracks in reality spreading behind it, worlds ending at its back.\n\nMaintain the dark infernal demonic hellfire aesthetic throughout.\n\nPortrait orientation, centered composition, fantasy card game art, high detail, professional digital illustration, no text, no watermarks.",
  "negative_prompt": "text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects",
  "image_size": "square_hd",
  "num_inference_steps": 40,
  "guidance_scale": 8.0,
  "strength": 0.80,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "webp"
}
```

**Second pass (refinement):**
```json
{
  "image_url": "<first_pass_output_url>",
  "prompt": "Enhance lighting quality, sharpen details, improve overall fidelity without changing the composition or design. Transform this creature with Chaos energy...",
  "image_size": "square_hd",
  "num_inference_steps": 20,
  "guidance_scale": 8.0,
  "strength": 0.20,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "webp"
}
```

---

## 5. Batch Generation Spec

The batch pipeline is the tool used before launch to generate all Common-tier card art and text. The owner runs this tool from one command, reviews results in a web gallery, and approves or rejects each card with one click.

### 5.1 CSV Input Format

The batch pipeline reads a CSV file at `scripts/batch/cards-to-generate.csv`. This is the only input the owner provides. Claude Code generates the art and text from it.

**Column definitions:**

| Column | Type | Description |
|---|---|---|
| `id` | string | Unique ID for this row — used as the batch key. Use format `IW-001`, `FEY-001`, `DMK-001`. |
| `faction_id` | string | One of: `IRONWRIGHT`, `FEY_COURTS`, `DEMONIC_KINGDOMS` |
| `card_type` | string | One of: `CREATURE`, `SPELL`, `STABILIZER` |
| `base_name` | string | Starting name for the creature. This is the Common-tier name. |
| `creature_description` | string | Visual description of the creature for the art prompt. 1-3 sentences. What it looks like, its pose, distinctive features. |
| `mana_cost` | integer | 1 through 6 |
| `base_attack` | integer | ATK value. Leave empty for SPELL/STABILIZER. |
| `base_health` | integer | HP value. |
| `base_instability` | integer | 0 through 5 |
| `keywords` | string | Comma-separated list of keywords from: SHIELD, LIFESTEAL, FLYING, REACH, DEATHTOUCH, TAUNT, PIERCING. Leave empty if none. |
| `flavor_note` | string | Optional hint to guide flavor text tone. e.g., "aggressive hunter," "noble defender," "ancient sleeper." |

**Example CSV (`cards-to-generate.csv`):**

```csv
id,faction_id,card_type,base_name,creature_description,mana_cost,base_attack,base_health,base_instability,keywords,flavor_note
IW-001,IRONWRIGHT,CREATURE,Cogwork Stalker,"clockwork wolf, sleek predatory design, articulated brass leg joints with visible pistons, mechanical jaw with copper fangs, glowing amber optical sensors, mid-prowl stance",3,3,4,2,,hunting machine
IW-002,IRONWRIGHT,CREATURE,Gear Sprite,"tiny clockwork sprite, insect-like brass wings with visible gear joints, small rounded copper body, spinning gear on back, curious alert posture",1,1,2,1,,nimble scout
IW-003,IRONWRIGHT,CREATURE,Steamforged Sentinel,"heavily armored humanoid construct, thick riveted iron plates, broad rectangular chest with steam vents, no visible face just glowing amber eye-slit, planted defensive stance",4,2,6,1,SHIELD,immovable guardian
IW-004,IRONWRIGHT,CREATURE,Overclock Predator,"sleek velocipede-style mechanical creature, six articulated legs, streamlined brass chassis with exposed red-hot gears, speed blurs at joints, aggressive lunging stance",2,3,2,3,,speed over durability
IW-005,IRONWRIGHT,CREATURE,Pressure Golem,"massive barrel-chested stone-and-brass golem, iron boiler for a torso with pressure gauges visible, thick piston arms, stomping heavy stance, steam erupting from shoulder joints",6,5,8,2,TAUNT,unstoppable force
FEY-001,FEY_COURTS,CREATURE,Thornwood Warden,"tall fey knight, living bark armor grown into broad plates, large shield woven from vines and glowing teal crystal, antlers crowned with moonflowers, noble protective wide-stance",4,2,6,1,SHIELD,noble defender
FEY-002,FEY_COURTS,CREATURE,Moonpetal Sprite,"small agile fey scout, dragonfly-like translucent wings of solidified moonlight, lithe body in petal armor, sharp thorn-claws, crouched ready-to-spring",2,3,2,3,FLYING,quick striker
FEY-003,FEY_COURTS,CREATURE,Rootcaller Warden,"ancient tree-creature, gnarled living wood body, roots extending from feet into the ground, moss-covered bark armor, slow dignified stance, glowing green eye",3,2,5,1,REACH,ancient protector
FEY-004,FEY_COURTS,CREATURE,Gladekeeper,"lithe fey warrior, vine-wrapped leather armor, dual thorn-blades, bioluminescent freckle markings, low stalking crouch, predator eyes",3,4,3,3,,relentless hunter
FEY-005,FEY_COURTS,CREATURE,Thornvine Behemoth,"massive creature formed from living trees fused together, multiple gnarled limbs, bark armor plates with glowing fungal growth between, enormous presence filling the frame",6,4,9,2,TAUNT,living wall
DMK-001,DEMONIC_KINGDOMS,CREATURE,Ashclaw Ravager,"lean predatory demon, elongated razor-edged obsidian claws, exposed rib-cage through torn flesh, swept-back obsidian horns, eyes burning with hellfire, crouched pouncing stance",3,5,2,4,PIERCING,glass cannon striker
DMK-002,DEMONIC_KINGDOMS,CREATURE,Bloodrite Warlord,"massive demonic warlord, heavy obsidian plate armor with blood-glyphs, large weapon dripping dark ichor, imposing upright commanding stance, prominent curved horns",5,4,7,2,LIFESTEAL,dark sustain threat
DMK-003,DEMONIC_KINGDOMS,CREATURE,Bonebreaker Imp,"small vicious imp, oversized clawed hands relative to tiny body, jagged bone-shard wings, manic grin showing rows of fangs, mid-leap attack stance",1,2,1,3,DEATHTOUCH,cheap removal piece
DMK-004,DEMONIC_KINGDOMS,CREATURE,Emberhound,"demonic hound, four legs with hooked obsidian claws, fire erupting from between rib bones showing through skin, low tail-up hunting stance, hellfire eyes",2,3,2,3,,aggressive body
DMK-005,DEMONIC_KINGDOMS,CREATURE,Infernal Colossus,"colossal demon, three stories of corrupted flesh and obsidian plating, massive horned head, arms like siege weapons, surrounded by floating infernal runes, apocalyptic presence",6,7,6,4,PIERCING,game-ending threat
```

---

### 5.2 Batch Script

The batch pipeline script lives at `scripts/batch/generate-cards.ts`. The owner runs it with:

```bash
npx ts-node scripts/batch/generate-cards.ts
```

The script:
1. Reads `scripts/batch/cards-to-generate.csv`
2. For each row, calls fal.ai (txt2img) to generate art
3. Uploads art to Cloudflare R2 at `art/batch/{row_id}/common.webp`
4. Calls GPT-4o Mini to generate initial flavor text
5. Writes results to `scripts/batch/output/results.json`
6. Builds `scripts/batch/output/review-gallery.html` — a static web page the owner opens in a browser

**Expected environment variables in `.env`:**
```
FAL_API_KEY=...
OPENAI_API_KEY=...
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=chaos-creatures-art
CLOUDFLARE_R2_PUBLIC_URL=https://r2.chaos-creatures.com
```

---

### 5.3 Review Gallery Specification

`review-gallery.html` is a self-contained static HTML file the owner opens locally in a browser. It does NOT require a server. All approve/reject state is saved to `scripts/batch/output/review-state.json` in the local filesystem (via a tiny Node.js server the script starts automatically, or via localStorage as fallback).

**Gallery layout:**

Each card displays as a card-sized panel in a grid:
- Left: Generated art (scaled to card proportions)
- Right: Card details
  - Name, faction, type
  - Stats: `{mana_cost} cost | {base_attack}/{base_health} | Instability {base_instability}`
  - Keywords (if any)
  - Flavor text
  - Art prompt used (collapsible)
- Below: Three buttons
  - **Approve** (green) — marks card as approved, enters production pool
  - **Reject** (red) — marks card as rejected, removes from pool
  - **Regenerate** (orange) — triggers a new generation for just this card with a different seed

**Header section:**
- Progress bar: "X of Y approved | Z rejected | W pending"
- Button: "Export Approved Cards to Database" — generates `approved-cards.sql` INSERT statements
- Button: "Regenerate All Rejected" — reruns generation for all rejected cards at once

**Approve/Reject persistence:** State saves automatically on every click to `review-state.json`. Refreshing the page preserves all decisions.

---

### 5.4 Batch Art Prompt Assembly

The script builds each card's art prompt by concatenating the three components:

```typescript
function buildBaseCardPrompt(row: CsvRow): string {
  const factionPrefix = FACTION_PREFIXES[row.faction_id];
  const composition = 'portrait orientation, centered creature filling 70 percent of frame, dramatic three-quarter view or frontal pose, simple contextual background not cluttered, clear distinct silhouette, card game art composition, eyes visible and facing viewer, dramatic directional lighting';
  const quality = 'fantasy card game art, high detail, professional digital illustration, sharp focus, vibrant colors, dynamic pose, Magic: The Gathering style composition, clean edges';

  return `${factionPrefix},\n\n${row.creature_description},\n\n${composition},\n\n${quality}`;
}
```

The `negative_prompt` is always:
```
text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, extra limbs, fused body parts, speech bubbles, comic panels, grid layout
```

---

### 5.5 Batch Flavor Text Prompt

The batch script uses a simplified flavor text prompt for base cards (no evolution history yet):

**System prompt:**
```
You are a flavor text writer for a fantasy card game called Chaos Creatures. You output only the flavor text string — no quotes, no labels, no other text.
```

**User prompt:**
```
FACTION: {faction_name}
CARD NAME: {base_name}
FLAVOR NOTE: {flavor_note}
FACTION TONE: {faction_flavor_tone}

Write exactly one flavor text entry for this Common-tier creature card. Rules:
- 1 to 2 sentences maximum
- Maximum 120 characters total
- Matches the faction tone
- Reflects the creature's nature and role (use FLAVOR NOTE as a guide)
- Does NOT reference game mechanics or stats
- Should feel like lore, not a game description

Output only the flavor text, nothing else.
```

---

## 6. Quality Guardrails

### 6.1 Content Safety

fal.ai's FLUX Kontext API has `enable_safety_checker: true` set on every request. This is the first line of defense. The response field `has_nsfw_concepts` returns `[true]` if the safety checker flagged the image.

**Server-side check after every generation:**
```typescript
async function validateGeneratedImage(falResponse: FalResponse): Promise<ValidationResult> {
  // Check fal.ai's built-in safety checker result
  if (falResponse.has_nsfw_concepts[0] === true) {
    return { valid: false, reason: 'nsfw_flagged_by_fal' };
  }

  // Check for text in image using fal.ai OCR or a simple heuristic
  // For launch: trust fal.ai safety checker + negative prompt
  // Post-launch: add Azure Content Safety or AWS Rekognition call here

  return { valid: true };
}
```

**If validation fails:**
1. Log the failure with prompt and card instance ID
2. Increment retry counter for this generation attempt
3. If retry count < 3: retry with the negative prompt augmented with `no text overlay, completely clean image, SFW, appropriate for all ages`
4. If retry count == 3: use fallback art (see Section 6.3)
5. Notify owner via PostHog event `generation_failed_after_retries` with card details

---

### 6.2 Retry Logic

**Image generation retry sequence:**

| Attempt | Action |
|---|---|
| 1 (initial) | Send standard request |
| 2 (retry on NSFW flag) | Add to negative_prompt: `no text overlay, completely clean image, SFW, appropriate for all ages`. Reduce `strength` by 0.05 for evolution calls. |
| 3 (retry on second flag) | Remove the most recently selected player modifier from the prompt. Add `safe, tasteful, professional game art` to positive prompt. |
| 4 (all retries exhausted) | Use fallback art, queue async retry, notify owner |

**API timeout handling (fal.ai calls that don't return within 45 seconds):**
1. Cancel the pending request
2. Retry once with identical parameters
3. If second timeout: use fallback art, queue async retry

**Text generation retry sequence:**

| Attempt | Action |
|---|---|
| 1 (initial) | Standard request |
| 2 (if response is not valid JSON) | Add to system prompt: `CRITICAL: Your response must be ONLY a valid JSON array like ["Name1", "Name2", "Name3"]. No other text.` |
| 3 (if still malformed) | Use template fallback names |

**Template fallback names if GPT fails completely:**
```typescript
function getFallbackNames(previousName: string, evolutionOutcome: string, tier: string): string[] {
  const tierSuffix = { UNCOMMON: 'Prime', RARE: 'Elite', EPIC: 'Champion', LEGENDARY: 'Legendary' }[tier];
  const outcomeSuffix = evolutionOutcome === 'CHAOS' ? 'Unbound' : 'Ascendant';
  return [
    `${previousName} ${tierSuffix}`,
    `${previousName}, the ${outcomeSuffix}`,
    `${previousName} Evolved`
  ];
}
```

---

### 6.3 Fallback Art System

If all generation attempts fail, the card still evolves mechanically. The player is never blocked by an API failure.

**Fallback art is a programmatic overlay applied to the existing art:**

```typescript
async function generateFallbackArt(
  existingArtUrl: string,
  evolutionOutcome: 'ORDER' | 'CHAOS'
): Promise<string> {
  // Download existing art from R2
  // Apply color overlay using sharp (Node.js image processing library):
  // ORDER: blue-white tint overlay at 30% opacity + slight brightness increase (+10) + sharpness
  // CHAOS: red-purple tint overlay at 30% opacity + saturation boost (+20) + slight blur on edges
  // Upload modified image to R2 at art/{card_instance_id}/{tier}-fallback.webp
  // Return R2 CDN URL
}
```

**Player-facing message when fallback is used:**
```
Your card has evolved! The new art is being finalized in the background and will appear shortly.
You can play with your evolved card right now.
```

This message appears in the evolution completion screen. The art updates automatically the next time the player opens the card (via push notification if the app is in the background).

**Async retry queue:** Failed generation jobs are added to a Supabase table `art_generation_queue` with status `PENDING`. A Railway cron job runs every 15 minutes and retries up to 5 pending items. On success, it updates `CardInstance.art_url` and `EvolutionRecord.art_url` and sends a push notification.

---

### 6.4 Generation Queue and Rate Limits

**Priority queuing:** fal.ai Pro endpoints have higher throughput. Paid tier evolutions go to Pro endpoints (REFINED, PRISMATIC), free tier goes to Dev endpoint.

**Per-user daily rate limits (prevents abuse — aligns with max shard acquisition rate):**

| Tier | Max Evolutions per Day |
|---|---|
| Free | 5 |
| Mid | 15 |
| Top | 30 |
| Hard cap (any tier) | 50 |

Rate limit enforcement: stored in Supabase as `daily_evolution_count` on Player table, reset by midnight UTC cron.

**Cost monitoring:** Each generation call is logged to a Supabase table `api_cost_log` with:
- `player_id`, `generation_type` (base/evolution/refinement), `model`, `estimated_cost_usd`, `timestamp`

A PostHog dashboard watches for players exceeding expected cost profiles. Alert fires if any player's monthly API cost exceeds $2.00 (signals possible exploit or runaway retry loop).

---

### 6.5 Base Card QA Workflow

All batch-generated base cards go through owner approval before entering the live card pool. The review gallery (Section 5.3) is the complete QA interface.

**QA criteria (owner evaluates each card):**

| Check | Pass Condition |
|---|---|
| Art matches faction | Clearly Ironwright / Fey / Demonic aesthetic |
| Creature is visible | Subject fills frame, clearly identifiable |
| No text or watermarks | No readable characters in image |
| Colors appropriate | Warm metallic / cool nature / dark infernal as expected |
| Name fits faction voice | Passes the "does this sound like this faction" gut check |
| Flavor text grammatical | Readable, no obvious errors |
| Flavor text evocative | Feels like a card game, not a description |
| Stats match PP budget | ATK + HP + keyword costs = mana cost × 2 + 1 (±1 tolerance) |
| No offensive content | Nothing that would trigger app store review |

**Target approval rate:** 70–80% (20–30% rejection is normal for AI batch generation).

**Approved cards:** Get `approved_at` timestamp and are inserted into `card_templates` table via the "Export Approved Cards to Database" button in the review gallery.

**Rejected cards:** Deleted from the output set. Owner can click "Regenerate All Rejected" to try again with different seeds.

---

## Revision Log

### Changes Made in Version 2.0 (2026-02-16)

1. **Replaced all generic infrastructure references with fal.ai specifics.** The original document referenced "FLUX Dev" and "FLUX Kontext" generically. Version 2.0 specifies exact fal.ai endpoint URLs (`fal.run/fal-ai/flux-kontext/dev`, `fal.run/fal-ai/flux-kontext/pro`), exact request JSON body shapes including all parameter names (`image_url`, `strength`, `image_size`, `num_inference_steps`, `guidance_scale`, `enable_safety_checker`, `output_format`), and the exact response format to parse.

2. **Replaced abstract prompt templates with exact prompt strings.** The original used placeholder language like "construct a prompt using faction style." Version 2.0 provides verbatim faction prefix strings, verbatim evolution direction instruction strings, verbatim composition and quality tag strings, and fully assembled example prompts ready to copy into code.

3. **Added complete visual modifier tables with prompt description strings.** The original listed modifier display names only. Version 2.0 adds a `Prompt Description String` column for every modifier (U01–U30, IF01–IF28, FF01–FF28, DF01–DF28) — the exact text inserted into `{MODIFIER_DESCRIPTIONS}` in the evolution prompt. This removes all judgment calls about how to translate a modifier name into a prompt instruction.

4. **Added TypeScript function signatures and implementations for prompt assembly.** The original had Python pseudocode with undefined helper functions. Version 2.0 provides TypeScript implementations matching the CLAUDE.md infrastructure stack (Railway Node.js/TypeScript) including the complete `buildEvolutionImagePrompt` function, all lookup tables as typed constants, and the `buildNamingPrompt` function.

5. **Added complete Batch Generation Spec (Section 5) — new section not in original.** The original had a note saying "internal batch tool with approval UI needed." Version 2.0 fully specifies: the exact CSV format with all columns and types, example CSV rows for all three factions, the script entry point and run command, the review gallery UI specification (layout, buttons, persistence, export), and the batch art prompt assembly function.

6. **Replaced pseudocode content filter with fal.ai-native safety approach.** The original referenced Azure Content Safety and AWS Rekognition as third-party services. Version 2.0 uses fal.ai's built-in `enable_safety_checker: true` as the primary mechanism (no additional accounts needed), with explicit handling of the `has_nsfw_concepts` response field. Post-launch upgrade path noted but not required for launch.

7. **Replaced generic "NSFW detection API" with explicit retry sequence table.** The original had Python pseudocode calling undefined APIs. Version 2.0 defines a concrete 4-attempt retry sequence with specific prompt modifications at each attempt.

8. **Made fallback art system implementation-ready.** The original said "apply programmatic visual treatment." Version 2.0 specifies the exact operation (sharp library, tint overlay at 30% opacity, specific adjustments for Order vs. Chaos), the R2 path convention, the Supabase queue table name (`art_generation_queue`), and the Railway cron retry interval (15 minutes).

9. **Removed all references to non-stack services.** Original mentioned "consider X" alternatives. Version 2.0 only references Supabase, Railway, fal.ai, Cloudflare R2, OpenAI, and PostHog — exactly the stack from CLAUDE.md.

10. **Added exact prewritten event flavor text for all 16 events.** The original noted these should be prewritten but left the text as examples. Version 2.0 provides the complete set of all 8 Order and 8 Chaos event flavor text strings in a table, ready to seed into the database.

11. **Converted all "the engineer should decide" notes into specific decisions.** Examples: denoising values are now exact numbers in a table rather than ranges in prose; fal.ai `image_size` values are specified by exact API parameter name (`portrait_4_3`, `square_hd`) rather than pixel dimensions; the fallback name generator is provided as a TypeScript function rather than described as a concept.

12. **Added faction name voice strings and flavor tone strings as exact insertable constants.** The original described voice guides in prose. Version 2.0 separates these into distinct constants (`FACTION_NAME_VOICES`, flavor tone strings) that map directly to template variables in the prompt templates.

13. **Added PostHog cost monitoring integration.** The original mentioned "log all API costs" without specifying how. Version 2.0 specifies a Supabase `api_cost_log` table and a PostHog event `generation_failed_after_retries`, consistent with the analytics stack from CLAUDE.md.

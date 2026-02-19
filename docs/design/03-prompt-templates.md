# Chaos Creatures — Prompt Templates & AI Generation Pipeline

**Version:** 5.0 (v5 — 5 factions, 9 keywords, Ironwright retheme, Celestial + Endless prompts, Planar Ruins art prompts, Haste/Ward visuals)
**Last Updated:** 2026-02-19
**Dependencies:** `00-game-design-master.md`, `01-battle-mechanics.md`, `02-card-data-model.md`

---

## Overview

This document defines the complete AI generation pipeline for Chaos Creatures. It contains exact prompt strings, API request shapes, and pipeline code Claude Code can implement directly — no fill-in-the-blanks, no "construct a prompt using faction style," no decisions left to the implementer.

**Infrastructure used (non-negotiable, from CLAUDE.md):**
- Image generation: fal.ai FLUX Kontext API
- Text generation: OpenAI GPT-4o Mini
- Art storage: Cloudflare R2 (CDN delivery)
- Backend: Supabase Edge Functions (trigger generation jobs from game server events)
- Game server: Railway Node.js/TypeScript (batch pipeline runner, evolution job queue)
- Admin Dashboard: Railway web app (Next.js/TypeScript, separate from iOS game client — see Three Tools below)

**Three Tools — Which Tool Owns What:**
- **iOS Game Client** (Swift/SwiftUI/SpriteKit): Displays card art, triggers evolution requests, presents modifier choices, shows evolution ceremony. Does NOT call fal.ai or OpenAI directly. All generation is server-side.
- **Admin Dashboard** (Next.js/TypeScript web app on Railway): Batch card generation pipeline, review gallery for QA, approve/reject/regenerate controls, export to database. The owner accesses this in a browser. It is NOT part of the iOS app.
- **Supabase Dashboard** (built-in, free): Player lookup, match history, auth management (ban/unban), direct data fixes. No custom code needed.

**Key Principles:**
- Players never type freeform prompts — they pick from curated lists surfaced by the iOS app
- Every evolution uses img2img (FLUX Kontext) referencing the previous tier's art
- Chaos mote cost never changes through evolution — only art, name, stats, and abilities change
- Text generation uses GPT-4o Mini at ~$0.0001 per call
- All generated art uploads to Cloudflare R2; `art_url` on CardInstance/EvolutionRecord stores the R2 CDN URL
- Every image prompt starts with the global STYLE_ANCHOR prefix (Section 1.1) to ensure visual consistency across all cards

---

## 1. Image Generation Pipeline (fal.ai FLUX Kontext)

### 1.1 Global Visual Style Anchor

**Every single image generation request — base card or evolution — prepends this string at the start of the prompt.** This is the locked visual style anchor (v4) that ensures all generated art looks like it belongs in the same card game. No card art is generated without it.

```
STYLE_ANCHOR = "1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, traditional media on illustration board, visible brushstrokes and ink linework, sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, muted earth tones and desaturated palette, gritty textured surface with grain and tooth, raw unpolished asymmetric forms, dark atmospheric mood, 3:4 portrait ratio, no text no borders no watermarks"
```

This string is prepended to every prompt, before the faction prefix. Final prompt assembly order:

```
{STYLE_ANCHOR}, {FACTION_PREFIX}, {CREATURE_DESCRIPTION}, {COMPOSITION_INSTRUCTION}, {ENVIRONMENT}, [{WEATHER}], [{TIME_OF_DAY}], [{SCALE}]
```

For evolution prompts:

```
{STYLE_ANCHOR}, {EVOLUTION_DIRECTION_INSTRUCTION}, {HISTORY_CONTEXT}, {MODIFIER_DESCRIPTION}, {FACTION_SHORT_DESCRIPTION aesthetic maintenance instruction}
```

**v4 changes from v3:**
- Replaced Donato Giancola / Frank Frazetta with Ron Spencer / Pete Venters / Mark Poole (actual 1990s MTG illustrators)
- Removed "single creature portrait" (previously blocked group/multi-figure compositions)
- Added ink linework and sketchy atmospheric rendering descriptors
- Changed from "oil painting" to "traditional media on illustration board" (broader, matches actual MTG production)

The STYLE_ANCHOR enforces: 1990s MTG illustration aesthetic, consistent ink and brushwork, consistent color restraint, and absence of text or borders. If a generated card looks like it came from a different game (too digital, too smooth, too saturated), the STYLE_ANCHOR was either omitted or the faction prefix is pulling in a conflicting direction — reject and regenerate.

---

### 1.2 fal.ai API Integration

All image generation calls go to fal.ai. Two endpoints are used:

**Base card generation (text-to-image):**
```
POST https://fal.run/fal-ai/flux/dev
```

**Evolution art generation (image-to-image):**
```
POST https://fal.run/fal-ai/flux-kontext/dev
POST https://fal.run/fal-ai/flux-kontext/pro
```

**Authentication:** `Authorization: Key ${FAL_KEY}` header on every request. `FAL_KEY` stored in Railway environment variables (never committed to git).

**Base request structure for base card generation (txt2img):**
```json
{
  "prompt": "<STYLE_ANCHOR + faction prefix + creature description + composition>",
  "negative_prompt": "text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, extra limbs, fused body parts, speech bubbles, comic panels, grid layout, collage, white background",
  "image_size": "portrait_4_3",
  "num_inference_steps": 35,
  "guidance_scale": 7.5,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "webp"
}
```

**Base request structure for evolution (img2img):**
```json
{
  "image_url": "https://r2.chaos-creatures.com/art/{card_instance_id}/{from_tier}.webp",
  "prompt": "<STYLE_ANCHOR + evolution direction + history context + modifier description + faction maintenance>",
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

**`image_size` values used:**
- `portrait_4_3` = 768×1024 (Free/Planar Shard tier)
- `square_hd` = 1024×1024 (Mid/Refined and High/Prismatic Shard tiers)

**`strength` parameter (img2img only):** 0.0 = identical to input, 1.0 = completely new image. See denoising table in Section 1.5.

**Response format (both endpoints):**
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

After generation: download the image from `images[0].url`, upload to Cloudflare R2 at path `art/{card_instance_id}/{tier}.webp`, store the R2 CDN URL as `art_url` on the CardInstance or EvolutionRecord.

**Error response format (HTTP 4xx or 5xx):**
```json
{
  "detail": "Error message string",
  "status": 422
}
```

HTTP 429 means rate limit. Apply exponential backoff: wait 2s, retry; wait 4s, retry; wait 8s, retry. See Section 6.2 for full retry logic.

---

### 1.3 Base Card Art Generation (Batch Pipeline — Admin Dashboard)

Base cards are generated during the batch pipeline before launch. These become the Common-tier art. The batch pipeline runs in the Admin Dashboard (Railway web app), not in the iOS game client.

#### Faction Prefixes (Exact Strings — Copy Into Code as Constants)

v4 prefixes use actual 1990s MTG artist references per faction. These replace the v3 references (Brom/Keith Parkinson, Brian Froud/Alan Lee, Wayne Barlowe/Zdzislaw Beksinski).

**IRONWRIGHT_PREFIX:**
```
brutalist space-industrial construct, poured concrete and cold-rolled iron, exposed rebar skeleton and hydraulic pistons, oil-stained and frost-rimed, heavy bolt patterns with weld scars, steel blue-gray and cold iron palette with reactor-blue conduit glow, void-dark atmospheric background, painted like a Piranesi impossible architecture or John Martin apocalyptic industrial scale
```

**FEY_COURTS_PREFIX:**
```
dark fey forest creature, twisted ancient wood and thorns, unsettling and wild, dappled green-gold light filtering through dense canopy, muted forest palette, overgrown with moss and lichen, more Brothers Grimm than Disney, painted like a Rebecca Guay or Quinton Hoover ethereal watercolor
```

**DEMONIC_KINGDOMS_PREFIX:**
```
grotesque infernal creature, fused bone and volcanic rock and dried gore, lit from below by hellfire glow, deep shadow obscuring details, burnt crimson and charcoal black palette, oppressive and heavy, painted like a Pete Venters or Anson Maddocks grotesque dark fantasy
```

**CELESTIAL_CRUSADE_PREFIX:**
```
divine crusader entity, hammered gold plate and white marble veined with gold, divine blue silk and solidified light, overwhelming radiance from within, holy gold and ivory palette with celestial rose accents, cathedral-scale grandeur, painted like a Gustave Dore biblical illustration or William Blake visionary painting
```

**THE_ENDLESS_PREFIX:**
```
undead spectral entity, bone and tattered cloth and ectoplasmic residue, ghostly teal glow and necrotic purple energy, translucent ethereal forms flickering between solid and spectral, bone white and necrotic purple palette with sickly green accents, fog-choked atmospheric background, painted like a Gustave Dore Inferno etching or Francisco Goya Black Painting
```

#### Composition Selection (v4 — 25 Templates)

Compositions are selected automatically based on card metadata (tier, keywords, mana cost, card type). The composition string is appended after the creature description. See the full composition pool and selection algorithm in Section 4.1.

**Default composition (fallback for generic mid-range creatures):**
```
three-quarter view creature portrait, strong silhouette, atmospheric murky background, single harsh light source casting deep shadows, old master painting composition, rough textured brushwork throughout, NOT clean NOT smooth NOT digital
```

#### Composition Pool — 25 Templates (v4)

All 25 composition templates with selection rules. The `selectComposition()` function in `supabase/functions/_shared/prompts.ts` is the canonical implementation. Templates are sorted by category.

| Key | Prompt String | Selection Rule |
|---|---|---|
| `PORTRAIT_CLOSE` | `extreme close-up portrait, face fills frame, intense eye contact, shallow depth of field` | CM 2 cards |
| `PORTRAIT_THREE_QUARTER` | `three-quarter view portrait, shoulders and head, slight turn, atmospheric background` | Default fallback (CM 3–4, no keyword match) |
| `PORTRAIT_PROFILE` | `strict side profile portrait, single eye visible, dramatic rim light on edges, shallow depth of field` | Lifesteal keyword |
| `PORTRAIT_FROM_BEHIND` | `creature seen from behind, looking over shoulder, mysterious and atmospheric, environment visible ahead` | Reach keyword |
| `PORTRAIT_EXTREME_WIDE` | `creature tiny in vast panoramic landscape, sense of scale and isolation, atmospheric perspective` | CM 1 |
| `ACTION_ATTACK` | `dynamic action pose mid-strike, motion blur on weapon, debris flying, low camera angle` | Piercing (50%) or Deathtouch (50%) |
| `ACTION_DEFEND` | `defensive stance, shield raised, bracing for impact, ground-level perspective` | Shield or Taunt keyword |
| `ACTION_CAST` | `arms raised channeling energy, magical particles swirling, dramatic backlighting` | SPELL card type |
| `ACTION_LEAP` | `creature mid-leap through air, dynamic diagonal composition, wind and debris, frozen motion` | Piercing (50% alt) |
| `ACTION_PROWL` | `creature stalking low to the ground, predatory tension, compressed coiled energy, ground-level camera` | Deathtouch (50% alt) |
| `ACTION_COMMAND` | `creature in commanding stance, arm or limb raised directing others, imperial authority, elevated position` | CM 6 (non-Legendary) |
| `ENVIRONMENTAL_WIDE` | `wide establishing shot, creature small in vast landscape, epic scale, deep perspective` | Flying keyword (50%) |
| `ENVIRONMENTAL_EMERGING` | `creature emerging from faction environment, half-hidden, atmospheric fog/mist` | No specific rule — accessible via DETAIL_MACRO slot |
| `ENVIRONMENTAL_UNDERGROUND` | `deep underground cavern scene, creature amid stalactites and mineral formations, bioluminescent or firelit` | Ironwright: random 20% override |
| `ENVIRONMENTAL_SKYBORNE` | `creature high above ground, aerial perspective, clouds and landscape far below, vertigo-inducing` | Flying keyword (50% alt) |
| `ENVIRONMENTAL_THRESHOLD` | `creature standing in doorway or arch, light from one side dark from other, liminal dramatic framing` | ~15% global random override |
| `DRAMATIC_LOW_ANGLE` | `extreme low angle looking up, creature towers overhead, dramatic sky behind` | CM 7+; Epic (33%) |
| `DRAMATIC_SILHOUETTE` | `silhouette against dramatic sky/explosion/portal, rim lighting, high contrast` | Epic (33%) |
| `DRAMATIC_OVERHEAD` | `extreme overhead bird-eye view looking straight down, creature foreshortened, dramatic radial composition` | Epic (33%) |
| `DRAMATIC_DUTCH_ANGLE` | `tilted camera angle creating unease, diagonal horizon line, off-balance dynamic energy` | ~10% global random override |
| `DETAIL_MACRO` | `macro detail shot of distinctive feature (claws/eyes/armor/wings), shallow depth of field` | Available in pool, not auto-selected |
| `NARRATIVE_MOMENT` | `mid-narrative scene, creature interacting with environment, storytelling composition` | Legendary (50%) |
| `NARRATIVE_DUAL` | `two creatures in frame, confrontation or alliance, split composition` | Available in pool, not auto-selected |
| `NARRATIVE_AFTERMATH` | `creature surveying aftermath of battle, wreckage and smoke, contemplative or victorious mood` | Legendary (50% alt) |
| `NARRATIVE_RITUAL` | `creature engaged in ritual or transformation, magical energy gathering, ceremonial setting` | STABILIZER card type |

#### Variety Dimensions — Weather, Time of Day, Scale (v4 New)

These are appended after the environment string. All three are optional — weather and time of day are probabilistic, scale is deterministic by mana cost.

**Prompt assembly with variety dimensions:**
```
{STYLE_ANCHOR}, {FACTION_PREFIX}, {CREATURE_DESCRIPTION}, {COMPOSITION}, {ENVIRONMENT}, [{WEATHER}], [{TIME_OF_DAY}], [{SCALE}]
```

**Weather Modifiers** (8 options, applied ~30% of the time — `selectWeather()` returns `''` 70% of the time):

| Prompt String |
|---|
| `during a violent thunderstorm, rain slashing across the scene, lightning illuminating` |
| `in thick rolling fog, visibility limited, shapes half-hidden` |
| `during a blizzard of ash or snow, particles filling the air` |
| `in scorching heat shimmer, air distorted, mirages at edges` |
| `during an eclipse, eerie half-light, corona visible` |
| `in gentle rainfall, water droplets catching light, reflective wet surfaces` |
| `during a sandstorm of dust or magical particles, abrasive atmosphere` |
| `in perfectly still dead air, no movement, oppressive calm before catastrophe` |

**Time of Day Modifiers** (6 options, applied ~40% of the time — `selectTimeOfDay()` returns `''` 60% of the time):

| Prompt String |
|---|
| `at golden hour, warm amber directional light, long shadows` |
| `at blue hour pre-dawn, cool steel-blue atmosphere, world waking` |
| `at high noon, harsh overhead light, deep black shadows directly below` |
| `at twilight, purple-orange sky gradient, silhouette potential` |
| `in deep night, lit only by moonlight and ambient sources, deep blacks` |
| `at an unnatural hour, the sky the wrong color, time distorted` |

**Scale Modifiers** (mapped to mana cost — `selectScale(manaCost)` returns `''` for CM 3–4):

| CM Cost | Scale Key | Prompt String |
|---|---|---|
| 1 | TINY | `the creature is very small, shown relative to normal-sized objects for scale contrast` |
| 2 | SMALL | `the creature is smaller than human-sized, compact and agile` |
| 3–4 | *(omit)* | *(no modifier — medium scale is default)* |
| 5–6 | LARGE | `the creature is much larger than human-sized, imposing mass and bulk` |
| 7+ | COLOSSAL | `the creature is enormous, dwarfing the environment, shown from a distance to capture its scale` |

#### Faction Environments — 13 per Faction (v4)

Each faction now has 13 environments (original 5 preserved, 8 new). The `selectEnvironment()` function picks one at random per card.

**Ironwright Collective (13 environments):**

| Environment String |
|---|
| `inside an orbital shipyard, exposed rebar scaffolding against void-black space, arc-welding sparks cascading from above, half-assembled dreadnought hull in background` |
| `on a planetary strip-mine surface, terraced excavation into red rock, massive bucket-wheel excavators, conveyor belts hauling ore into sky-piercing processing towers` |
| `inside a void-reactor chamber, concentric rings of supercooled containment coils, reactor-blue glow at the core, concrete radiation shielding walls five meters thick` |
| `on a gravity-tether supply line between orbital stations, open walkway with rebar railings over infinite void, cargo containers moving along magnetized rails` |
| `inside a concrete command bunker, banks of analogue instruments and toggle switches, green-tinted tactical displays, reinforced blast doors` |
| `on the hull of a void-forge dreadnought, exterior maintenance scaffolding, hull plating stretching to vanishing point, stars and distant nebulae beyond` |
| `inside a mote-refinery, containment arrays of glass and iron holding swirling violet chaos energy, pipes routing refined motes into storage cylinders` |
| `in a reclaimation sprawl, mountains of salvaged warship components, jury-rigged workshops under scrap-metal canopies, sparks from cutting torches` |
| `on a re-entry corridor, heat-shield tiles glowing orange, atmospheric plasma streaming past reinforced viewports, cockpit instruments redlining` |
| `inside a gravity-well factory, massive centrifuges spinning in concrete housings, artificial gravity generators humming, workers in pressure suits` |
| `on a decommissioned star-harvester, dead solar collection arrays the size of cities, cooling towers venting last heat into space, abandoned but not empty` |
| `inside a void-dock loading bay, magnetic crane arms swinging iron containers, exhaust vents cycling, warning klaxon lights flashing orange` |
| `at a forward siege position, walking siege engines advancing across blasted terrain, concrete fortifications behind, reactor-blue targeting beams cutting through smoke` |

**The Fey Courts (13 environments):**

| Environment String |
|---|
| `in a moonlit glade where bioluminescent mushrooms cast soft blue-green light on ancient stones` |
| `beneath the canopy of the World Tree, roots thick as rivers, leaves filtering golden twilight` |
| `at the shore of an enchanted lake reflecting a sky full of aurora and floating islands` |
| `in a twilight meadow of giant wildflowers where fireflies spell out forgotten runes` |
| `deep inside a crystal cave where living gemstones hum with harmonic resonance` |
| `in a flooded temple ruin overtaken by sacred lotus and silver fish, moonlight on still water` |
| `on the back of a slowly walking mountain-turtle, forest growing on its shell, horizon tilting` |
| `inside the hollow trunk of a dead god-tree, fungal constellations on the inner walls` |
| `at the border where the fey realm bleeds into the mortal world, colors shifting from vibrant to muted` |
| `in a field of petrified ancient trees, stone bark crumbling, new saplings pushing through` |
| `beneath a frozen waterfall at midnight, ice refracting auroral light into prismatic shards` |
| `in a vast underground root network, bioluminescent sap flowing through translucent root walls` |
| `on a cliff edge where the forest meets the sea, salt spray and wild roses, storm approaching` |

**The Demonic Kingdoms (13 environments):**

| Environment String |
|---|
| `on a volcanic cliff overlooking a sea of lava, obsidian spires rising from the molten surface` |
| `in a throne room built from the bones of fallen titans, hellfire braziers lining the walls` |
| `at the edge of a reality rift where the material world crumbles into the void` |
| `on an ash-covered battlefield strewn with shattered weapons and smoldering craters` |
| `inside a collapsed citadel where gravity fails and stone blocks float in burning air` |
| `in a flesh cathedral where walls are living skin and pillars are bone, candles of rendered fat` |
| `on a bridge over a river of screaming souls, the far bank shrouded in perpetual darkness` |
| `inside a volcanic glass maze reflecting distorted hellfire from every surface` |
| `in a coliseum of skulls where lesser demons spectate from tiered bone seats` |
| `at the foot of a fallen angel statue, wings broken, altar of dark offerings before it` |
| `on a floating obsidian platform above an infinite void, chains anchoring it to nothing visible` |
| `in a blood-rain storm, the sky cracked open like a wound, crimson precipitation pooling on basalt` |
| `inside a demonic war forge where weapons are hammered from cursed iron and quenched in ichor` |

**The Celestial Crusade (13 environments):**

| Environment String |
|---|
| `inside the Radiant Bastion, fortress-cathedral suspended above clouds on pillars of solidified light, stained glass casting colored patterns across marble floors` |
| `on a cloud-field battlefield, divine light breaking through storm clouds in god-rays, golden armor reflecting radiance across an army in formation` |
| `inside the Sanctum of Open Eyes, cathedral-plane where geometry follows divine mathematics, walls curving impossibly, surfaces covered in open eyes` |
| `at a consecration site, divine energy descending in columns of golden light, stone altar glowing, angelic figures mid-ritual` |
| `on the steps of a celestial ziggurat, each tier carved with divine scripture, golden domes reflecting impossible sunlight, clouds below the staircase` |
| `inside a reliquary vault, crystal cases housing fragments of divine weapons, golden light from each relic, marble columns with gold inlay` |
| `on the bridge of a celestial war-barge, translucent light-sails billowing, crew of armored paladins at navigation crystals, clouds streaming past` |
| `in a judgment hall where accused stand before a throne of radiance, geometric light patterns scanning from above, divine law made visible` |
| `at the edge of a purification zone, divine fire burning away corruption in a wave advancing across a blighted landscape, ash becoming marble` |
| `inside a scriptorium where angelic scribes write divine law in light on sheets of crystal, the words rearranging themselves` |
| `on a shattered stairway between planes, fragments of marble steps floating in golden void, divine light connecting the pieces` |
| `at a celestial armory, divine weapons hanging in suspension fields of light, each weapon humming with contained power, angel-smiths at golden forges` |
| `in a cathedral rose-window chamber, circular stained glass filtering divine light into prismatic patterns, geometric floor mosaics glowing where light touches` |

**The Endless (13 environments):**

| Environment String |
|---|
| `inside the Ossuary Parliament, subterranean cathedral built entirely from bones, spectral candles casting ghostly teal light, ancient liches convening` |
| `in the Wailing Reach, fog-choked battlefield from an ancient war, thousands of spectral figures drifting, permanent storm of ghostly energy` |
| `inside a necromancer's surgical theater, bone constructs in various stages of assembly on stone slabs, phylacteries glowing on shelves` |
| `in a vast underground crypt, rows of sarcophagi stretching into darkness, some lids cracked open, ectoplasmic residue seeping from within` |
| `at a spectral convergence, ghostly figures orbiting a central point of necrotic energy, translucent forms overlapping, the air thick with whispered names` |
| `inside a lich's phylactery vault, crystalline containers of trapped souls glowing sickly green, rune-locked iron doors, bone-dust air` |
| `on a bone-bridge spanning a chasm of spectral fog, skeletal pylons supporting the structure, ghostly hands reaching up from below` |
| `in a plague city frozen in time, buildings intact but every surface coated in bone-dust, spectral residents repeating their final moments` |
| `inside a reanimation forge, corpses being systematically processed into constructs, soul-energy flowing through copper tubes, lich overseers directing` |
| `at the edge of a death-field, ground where nothing grows, soil saturated with necrotic energy, ghostly vegetation of spectral light instead of leaves` |
| `inside a spectral library, books written by the dead containing memories of lives lived, pages turning themselves, ink that whispers` |
| `on the walls of a fortress made of fused bones and spectral mortar, ghostly sentries patrolling, teal light emanating from within the walls` |
| `in a forgotten mass grave where the dead have organized themselves, skeletal figures standing in formation, awaiting a commander who never came` |

#### Negative Prompt (Used on Every Single Request — Never Omit)

```
text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, extra limbs, fused body parts, speech bubbles, comic panels, grid layout, white background, collage
```

---

#### Concrete Base Card Prompt Examples

These are fully assembled prompts with the STYLE_ANCHOR prepended. The batch script concatenates the components from the CSV row plus the constants above. These examples are copy-paste ready.

**Ironwright — 3-cost Rebar Golem (instability 2, 3ATK/4HP):**
```
1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, traditional media on illustration board, visible brushstrokes and ink linework, sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, muted earth tones and desaturated palette, gritty textured surface with grain and tooth, raw unpolished asymmetric forms, dark atmospheric mood, 3:4 portrait ratio, no text no borders no watermarks,

brutalist space-industrial construct, poured concrete and cold-rolled iron, exposed rebar skeleton and hydraulic pistons, oil-stained and frost-rimed, heavy bolt patterns with weld scars, steel blue-gray and cold iron palette with reactor-blue conduit glow, void-dark atmospheric background, painted like a Piranesi impossible architecture or John Martin apocalyptic industrial scale,

rebar golem, blocky geometric humanoid of poured concrete with exposed rebar skeleton, hydraulic piston joints, reactor-blue power conduit in chest cavity, heavy reinforced fists, industrial serial number stenciled on shoulder plate, mid-stride advancing stance,

three-quarter view creature portrait, strong silhouette, atmospheric murky background, single harsh light source casting deep shadows, old master painting composition, rough textured brushwork throughout, NOT clean NOT smooth NOT digital,

inside a void-reactor chamber, concentric rings of supercooled containment coils, reactor-blue glow at the core, concrete radiation shielding walls five meters thick
```

**Ironwright — 1-cost Maintenance Drone (instability 1, 1ATK/2HP) — scale: TINY, composition: PORTRAIT_EXTREME_WIDE:**
```
1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, traditional media on illustration board, visible brushstrokes and ink linework, sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, muted earth tones and desaturated palette, gritty textured surface with grain and tooth, raw unpolished asymmetric forms, dark atmospheric mood, 3:4 portrait ratio, no text no borders no watermarks,

brutalist space-industrial construct, poured concrete and cold-rolled iron, exposed rebar skeleton and hydraulic pistons, oil-stained and frost-rimed, heavy bolt patterns with weld scars, steel blue-gray and cold iron palette with reactor-blue conduit glow, void-dark atmospheric background, painted like a Piranesi impossible architecture or John Martin apocalyptic industrial scale,

tiny maintenance drone, insect-like iron body with folding tool-arms, small reactor-blue sensor eye, magnetic clamp feet, repair-torch appendage, hovering at a weld seam, diminutive and utilitarian,

creature tiny in vast panoramic landscape, sense of scale and isolation, atmospheric perspective,

inside an orbital shipyard, exposed rebar scaffolding against void-black space, arc-welding sparks cascading from above, half-assembled dreadnought hull in background,

the creature is very small, shown relative to normal-sized objects for scale contrast
```

**Fey Courts — 4-cost Thornwood Warden (instability 1, 2ATK/6HP, Shield keyword) — composition: ACTION_DEFEND:**
```
1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, traditional media on illustration board, visible brushstrokes and ink linework, sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, muted earth tones and desaturated palette, gritty textured surface with grain and tooth, raw unpolished asymmetric forms, dark atmospheric mood, 3:4 portrait ratio, no text no borders no watermarks,

dark fey forest creature, twisted ancient wood and thorns, unsettling and wild, dappled green-gold light filtering through dense canopy, muted forest palette, overgrown with moss and lichen, more Brothers Grimm than Disney, painted like a Rebecca Guay or Quinton Hoover ethereal watercolor,

tall fey knight, living bark armor grown into elegant broad plates, large shield woven from vines and glowing teal crystal, antlers crowned with moonflowers, luminous pale-green eyes, noble protective wide-stance pose, silver-green bioluminescent veins across armor,

defensive stance, shield raised, bracing for impact, ground-level perspective,

beneath the canopy of the World Tree, roots thick as rivers, leaves filtering golden twilight
```

**Fey Courts — 2-cost Moonpetal Sprite (instability 3, 3ATK/2HP, Flying keyword) — composition: ENVIRONMENTAL_SKYBORNE:**
```
1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, traditional media on illustration board, visible brushstrokes and ink linework, sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, muted earth tones and desaturated palette, gritty textured surface with grain and tooth, raw unpolished asymmetric forms, dark atmospheric mood, 3:4 portrait ratio, no text no borders no watermarks,

dark fey forest creature, twisted ancient wood and thorns, unsettling and wild, dappled green-gold light filtering through dense canopy, muted forest palette, overgrown with moss and lichen, more Brothers Grimm than Disney, painted like a Rebecca Guay or Quinton Hoover ethereal watercolor,

small agile fey scout, dragonfly-like translucent wings of solidified moonlight, lithe body clad in petal armor, sharp thorn-claws, crouched ready-to-spring stance, wild feral expression, bioluminescent marking streaks on skin,

creature high above ground, aerial perspective, clouds and landscape far below, vertigo-inducing,

at the shore of an enchanted lake reflecting a sky full of aurora and floating islands,

the creature is smaller than human-sized, compact and agile
```

**Demonic Kingdoms — 3-cost Ashclaw Ravager (instability 4, 5ATK/2HP, Piercing keyword) — composition: ACTION_LEAP:**
```
1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, traditional media on illustration board, visible brushstrokes and ink linework, sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, muted earth tones and desaturated palette, gritty textured surface with grain and tooth, raw unpolished asymmetric forms, dark atmospheric mood, 3:4 portrait ratio, no text no borders no watermarks,

grotesque infernal creature, fused bone and volcanic rock and dried gore, lit from below by hellfire glow, deep shadow obscuring details, burnt crimson and charcoal black palette, oppressive and heavy, painted like a Pete Venters or Anson Maddocks grotesque dark fantasy,

lean predatory demon, elongated razor-edged obsidian claws, exposed rib-cage bone structure through torn corrupted flesh, swept-back obsidian horns, eyes burning with hellfire, crouched low pouncing stance, glowing crimson infernal rune tattoos across body, ash and embers drifting around,

creature mid-leap through air, dynamic diagonal composition, wind and debris, frozen motion,

on a volcanic cliff overlooking a sea of lava, obsidian spires rising from the molten surface
```

**Demonic Kingdoms — 5-cost Bloodrite Warlord (instability 2, 4ATK/7HP, Lifesteal keyword) — composition: PORTRAIT_PROFILE, scale: LARGE:**
```
1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, traditional media on illustration board, visible brushstrokes and ink linework, sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, muted earth tones and desaturated palette, gritty textured surface with grain and tooth, raw unpolished asymmetric forms, dark atmospheric mood, 3:4 portrait ratio, no text no borders no watermarks,

grotesque infernal creature, fused bone and volcanic rock and dried gore, lit from below by hellfire glow, deep shadow obscuring details, burnt crimson and charcoal black palette, oppressive and heavy, painted like a Pete Venters or Anson Maddocks grotesque dark fantasy,

massive demonic warlord, heavy obsidian plate armor etched with blood-glyphs, large weapon dripping with dark ichor, imposing upright commanding stance, prominent curved horns, deep-set burning eyes, blood ritual sigils glowing on pauldrons, veins of dark energy visible through armor joints,

strict side profile portrait, single eye visible, dramatic rim light on edges, shallow depth of field,

in a throne room built from the bones of fallen titans, hellfire braziers lining the walls,

the creature is much larger than human-sized, imposing mass and bulk
```

---

### 1.4 Evolution Art Prompts (Image-to-Image with FLUX Kontext)

Every evolution calls `fal.run/fal-ai/flux-kontext/dev` or `.../pro` with the previous tier's art as `image_url`. The STYLE_ANCHOR is always prepended.

#### Order Evolution Direction Instruction

```
ORDER_INSTRUCTION = "Transform this creature with Order energy. Refine and structure the design. Add crystalline geometric patterns growing from the surface, luminous blue-white-gold Order energy emanating from within, refined and polished armor or outer casing, symmetrical ordered enhancements, harmonious natural or mechanical growth. Subtle transformation — the creature should remain clearly recognizable."
```

#### Chaos Evolution Direction Instruction

```
CHAOS_INSTRUCTION = "Transform this creature with Chaos energy. Dramatically alter the design with wild volatile energy. Add fractured asymmetric elements breaking the original silhouette, red-purple crackling Chaos energy surging through and around the creature, jagged edges and distorted proportions, volatile auras, surging unstable power. Dramatic transformation — retain the creature's core identity but push it toward the extreme."
```

#### History Context Strings

Selected by the server based on the card's `evolution_history` record count and outcome distribution:

| Condition | History Context String |
|---|---|
| First evolution (0 previous) | *(empty string — omit this field entirely)* |
| All Order so far | `This creature has been shaped entirely by Order energy, showing crystalline perfection and structured harmony. This evolution continues that refinement.` |
| All Chaos so far | `This creature has been wracked entirely by Chaos energy, showing fractured volatile forms barely held together. This evolution pushes further into dissolution.` |
| Mostly Order (Order > Chaos by 2+) | `This creature carries strong Order patterning — structured crystalline elements — but now Chaos energy breaks through the cracks.` |
| Mostly Chaos (Chaos > Order by 2+) | `This creature carries deep Chaos corruption — fractured volatile forms — but now Order energy attempts to crystallize and contain it.` |
| Balanced (Order == Chaos, or within 1) | `This creature carries both Order crystallization and Chaos fracturing in equal measure, a volatile balance of structured and wild energy.` |

#### Faction Short Descriptions (Used in Evolution Prompts)

| Faction | FACTION_SHORT_DESCRIPTION |
|---|---|
| Ironwright Collective | `brutalist space-industrial concrete-and-iron` |
| The Fey Courts | `ethereal fey nature bioluminescent` |
| The Demonic Kingdoms | `dark infernal demonic hellfire` |
| The Celestial Crusade | `divine radiant gold-and-marble celestial` |
| The Endless | `necrotic spectral bone-and-ectoplasm undead` |

#### Evolution Prompt Final Assembly

```typescript
const evolutionPrompt = [
  STYLE_ANCHOR,
  directionInstruction,
  historyContext,           // empty string omitted via filter(Boolean)
  `Apply these specific visual changes: ${modifierDescription}.`,
  `Maintain the ${factionShortDescription} aesthetic throughout.`,
  'Portrait orientation, centered composition, no text, no watermarks.'
].filter(Boolean).join(' ');
```

---

### 1.5 Technical Parameters by Shard Quality

These are the exact values to pass in the fal.ai API request body. These values are the canonical source of truth — doc 06 must read these values from this table.

| Parameter | Planar Shard (Free) | Refined Shard (Mid) | Prismatic Shard (Top) |
|---|---|---|---|
| **Endpoint** | `fal-ai/flux-kontext/dev` | `fal-ai/flux-kontext/pro` | `fal-ai/flux-kontext/pro` |
| **`image_size`** | `portrait_4_3` (768×1024) | `square_hd` (1024×1024) | `square_hd` (1024×1024) |
| **`num_inference_steps`** | `28` | `32` | `40` |
| **`guidance_scale`** | `7.0` | `7.5` | `8.0` |
| **Passes** | 1 | 1 | 2 (generate then refine) |
| **Estimated cost per evolution** | ~$0.02 | ~$0.05 | ~$0.08 (both passes) |

#### Denoising Strength (`strength` parameter) by Evolution Step and Outcome

| Evolution Step | Order `strength` | Chaos `strength` |
|---|---|---|
| Common → Uncommon | `0.35` | `0.65` |
| Uncommon → Rare | `0.40` | `0.70` |
| Rare → Epic | `0.45` | `0.75` |
| Epic → Legendary | `0.50` | `0.80` |

**Prismatic Second Pass (refinement):** After the first generation, call the API again with:
- `image_url`: URL of first-pass output (not the original reference image)
- Same prompt as first pass, prepended with: `Enhance lighting quality, sharpen details, improve overall fidelity without changing the composition or design.`
- `strength`: `0.20` (very low — polish only, no composition change)
- `num_inference_steps`: `20`
- `guidance_scale`: `8.0`

---

### 1.6 Visual Prompt Modifiers by Subscriber Tier

At evolution time, the iOS game client presents the player with a list of modifier options. The server assembles the list based on the player's subscription tier and the faction of the evolving card. The selected modifier's description string is inserted into the `{MODIFIER_DESCRIPTIONS}` slot in the evolution prompt.

**Selection counts by tier (from `01-battle-mechanics.md` Section 6):**
- Free (Planar Shard): Player sees 2 options, picks 1 (1 universal + 1 faction)
- Mid (Refined Shard): Player sees 3 options, picks 1 (1 universal + 2 faction)
- High (Prismatic Shard): Player sees 4 options, picks 1 (2 universal + 2 faction)

The iOS game client displays these options as a card-selection UI during the evolution ceremony sequence. The server sends the option list; the client renders it; the player taps one. The client sends the chosen modifier ID back to the server. All assembly logic is server-side.

#### Universal Modifiers — All Tiers Have Access to These (Free tier draws from U01–U10)

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

#### Universal Modifiers — Mid Tier Adds These (Mid draws from U01–U20)

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

#### Universal Modifiers — High Tier Adds These (High draws from U01–U30)

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

#### Ironwright Collective Faction Modifiers (Brutalist Space-Industrial)

Free tier draws 1 from IF01–IF10. Mid draws 2 from IF01–IF18. High draws 2 from IF01–IF28.

| ID | Display Name | Prompt Description String |
|---|---|---|
| IF01 | Rebar Reinforcement | `additional exposed rebar framework reinforcing key joints and structural points, raw iron grid pattern` |
| IF02 | Reactor Venting | `reactor-blue coolant venting from exhaust ports in dramatic plumes, containment pressure releasing` |
| IF03 | Hydraulic Pistons | `large visible hydraulic cylinders extending and contracting along the limbs, oil-sheen on rods` |
| IF04 | Orbital Plating | `void-rated hull plating bolted over existing armor, heat-resistant tiles with re-entry scorch marks` |
| IF05 | Arc Lightning | `electrical arc discharges jumping between exposed iron conduits and rebar conductors` |
| IF06 | Cold Iron Polish | `surfaces ground to cold mirror finish on iron plate, every reflection crisp and industrial` |
| IF07 | Reactor Overload | `reactor core glowing dangerously hot, containment coils redlining, warning indicators flashing orange` |
| IF08 | Weapon Mounts | `modular weapon systems bolted onto chassis — magnetic accelerators, iron blades, or reactor-powered emitters` |
| IF09 | Exhaust Glow | `exhaust ports glowing warning-orange from contained reactor energy about to release` |
| IF10 | Gyroscopic Stabilizers | `concentric gyroscopic stabilizer rings of cold iron orbiting the main body, void-navigation arrays` |
| IF11 | Concrete Cladding | `additional poured concrete armor cladding with visible aggregate and form marks, brutalist bulk` |
| IF12 | Riveted Overlay | `additional heavy riveting over seams and hull plating, industrial bolt pattern rows` |
| IF13 | Exposed Internals | `a section of outer plating removed revealing complex hydraulic mechanisms and reactor conduit routing` |
| IF14 | Sensor Arrays | `tall iron sensor antennae or radar arrays extending from the head or shoulders, void-scanning` |
| IF15 | Pneumatic Joints | `visible pneumatic tube connections between joint segments, pressurized hydraulic fluid pulsing` |
| IF16 | Warning Indicators | `warning-orange indicator lights across the hull blinking in patterns, status arrays and hazard markings` |
| IF17 | Siege Armor | `a secondary outer shell of thick iron-and-concrete plates adding massive bulk and siege-grade defense` |
| IF18 | Chain Drive | `heavy industrial chains connecting major moving components, visible external drive system` |
| IF19 | Void-Reactor Core | `a glowing void-reactor core visible through reinforced viewport in the chest, bending light around it` |
| IF20 | Phase-Iron Plating | `hull plates that phase in and out of visibility, existing in multiple dimensional states simultaneously` |
| IF21 | Dimension Pistons | `pistons that extend into a pocket dimension, disappearing and reappearing as they cycle` |
| IF22 | Singularity Heart | `a miniature singularity visible behind a crystal viewport in the chest, bending space around it` |
| IF23 | Gravity Reversal | `gravity distortion visible around the construct — debris floating upward, light bending unnaturally` |
| IF24 | Nanoswarm Integration | `a cloud of microscopic iron drones swarming around the construct as an extension of its systems` |
| IF25 | Antimatter Reactor | `a reactor core glowing with violent antimatter annihilation light, containment field barely holding` |
| IF26 | Reality Anchor | `thick bolts of void-energy anchoring the construct to the physical plane, dimensional tethers visible` |
| IF27 | Tesseract Hull | `the construct's hull visible as a four-dimensional structure folding through itself, impossible geometry` |
| IF28 | Infinite Regress | `mechanisms that contain smaller versions of themselves in an infinite regression visible through reinforced viewports` |

---

#### The Fey Courts Faction Modifiers

Free tier draws 1 from FF01–FF10. Mid draws 2 from FF01–FF18. High draws 2 from FF01–FF28.

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

Free tier draws 1 from DF01–DF10. Mid draws 2 from DF01–DF18. High draws 2 from DF01–DF28.

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

#### The Celestial Crusade Faction Modifiers

Free tier draws 1 from CF01–CF10. Mid draws 2 from CF01–CF18. High draws 2 from CF01–CF28.

| ID | Display Name | Prompt Description String |
|---|---|---|
| CF01 | Divine Halo | `a burning golden halo materializing behind or above the head, radiating divine light outward` |
| CF02 | Angelic Wings | `large feathered wings of white-gold light extending from the back, each feather sharp as a blade` |
| CF03 | Holy Armor | `divine gold plate armor appearing over the form, inscribed with scripture, glowing with inner light` |
| CF04 | Radiant Eyes | `eyes blazing with pure white-gold divine radiance, light streaming from the sockets` |
| CF05 | Formation Glow | `geometric divine light patterns connecting to nearby allies, formation lines of holy energy` |
| CF06 | Marble Skin | `flesh transforming to white marble veined with gold, divine and inhuman, still living` |
| CF07 | Burning Sword | `a weapon of solidified holy fire materializing in hand, trails of divine light following every movement` |
| CF08 | Prayer Marks | `scripture and prayer text appearing on the skin and armor in golden light, sacred words as decoration` |
| CF09 | Stained Glass | `portions of the form becoming translucent like stained glass, divine light filtering through colored sections` |
| CF10 | Crusader Tabard | `a divine blue tabard with golden celestial emblem appearing over the armor, rippling with holy energy` |
| CF11 | Multi-Wing | `additional pairs of wings extending in impossible angles, four or six wings total, overlapping and luminous` |
| CF12 | Eye-Covered | `additional divine eyes appearing across wings and armor surfaces, each open and aware, blinking independently` |
| CF13 | Cathedral Form | `the creature's silhouette incorporating cathedral architecture — arched shoulders, rose-window chest, spire crown` |
| CF14 | Judgment Light | `a column of divine light descending from above onto the creature, illuminating everything around it` |
| CF15 | Burning Wheels | `concentric rings of burning golden wheels orbiting around the creature, covered in eyes, spinning` |
| CF16 | Divine Inscription | `sacred geometric patterns — vesica piscis, Flower of Life — glowing on the skin in gold` |
| CF17 | Incense Aura | `holy incense smoke drifting from the creature in spirals, glowing faintly gold, purifying the air` |
| CF18 | Solidified Light | `portions of the creature made of literal solidified light, weight-bearing crystalline radiance` |
| CF19 | Rose Window Chest | `a circular stained-glass rose window embedded in the chest, divine light filtering through in prismatic patterns` |
| CF20 | Seraphic Geometry | `the creature's form incorporating impossible divine geometry, angles that do not exist in mortal space` |
| CF21 | Divine Mandorla | `a full-body almond-shaped aura of golden light surrounding the creature, the mandorla of sacred art` |
| CF22 | Purification Fire | `white-gold divine fire burning across the surface, purifying rather than destroying, leaving gold beneath` |
| CF23 | Throne Fragment | `a fragment of a divine throne materializing behind the creature, suggesting authority beyond mortal kingship` |
| CF24 | Cosmic Halo | `the halo expands to show stars and nebulae within it, a window into the divine plane` |
| CF25 | Cherubim Guard | `small cherubim entities orbiting the creature as guardians, each with multiple wings and fierce expressions` |
| CF26 | Reliquary Heart | `the chest cavity visible as a crystal reliquary containing a fragment of divine fire, impossibly bright` |
| CF27 | Absolute Radiance | `the creature becomes a source of overwhelming divine light, details barely visible through the radiance` |
| CF28 | Apotheosis | `the creature mid-transformation into a higher divine form, mortal elements dissolving into pure celestial energy` |

---

#### The Endless Faction Modifiers

Free tier draws 1 from EF01–EF10. Mid draws 2 from EF01–EF18. High draws 2 from EF01–EF28.

| ID | Display Name | Prompt Description String |
|---|---|---|
| EF01 | Bone Growth | `additional bone structures growing from the exterior — spurs, plates, ridges of exposed yellowed bone` |
| EF02 | Spectral Mist | `ghostly teal mist seeping from the creature's form, pooling at the feet, drifting upward unnaturally` |
| EF03 | Phylactery Glow | `a phylactery or soul-container visible on the body, glowing with trapped spectral energy, chained to the form` |
| EF04 | Ectoplasmic Drip | `translucent ectoplasmic fluid dripping from edges and joints, pooling in spectral puddles below` |
| EF05 | Soul-Light Eyes | `eye sockets glowing with cold blue-green soul-light, piercing and ancient, seeing beyond the living world` |
| EF06 | Grave Wrappings | `tattered burial wrappings wound around the form, some trailing, some tight, stained with age and earth` |
| EF07 | Necrotic Veins | `necrotic purple veins visible through translucent or decayed skin, pulsing with death energy` |
| EF08 | Ghostly Chains | `spectral chains trailing from wrists or body, some broken, some attached to nothing visible, rattling` |
| EF09 | Death's Crown | `a crown of fused finger-bones or spectral energy materializing above the head, mark of undead authority` |
| EF10 | Skeletal Exposure | `portions of flesh decayed or absent revealing clean bone structure beneath, functional and terrifying` |
| EF11 | Ghost Swarm | `smaller spectral entities orbiting the creature — faces, hands, whispers given partial form` |
| EF12 | Corpse Stitching | `visible surgical stitching holding disparate body parts together, the craftsmanship of a necromancer` |
| EF13 | Soul Siphon | `wisps of soul-light being drawn from the surroundings into the creature, a visible drain on nearby life` |
| EF14 | Ossuary Armor | `armor constructed from densely packed bones — ribcages as pauldrons, skulls as kneecaps, femurs as bracers` |
| EF15 | Spectral Flame | `ghostly teal fire burning across the surface without heat, necrotic flame that illuminates but does not warm` |
| EF16 | Death Mask | `a formal death mask appearing over the face — porcelain or bone, expressionless, ancient` |
| EF17 | Wailing Aura | `a visible aura of sound waves rippling outward from the creature, the visualized scream of the dead` |
| EF18 | Embalming Fluid | `preserved in supernatural embalming fluid, skin too smooth, too perfect, uncanny preservation` |
| EF19 | Mass Grave Echo | `ghostly afterimages of dozens of figures overlapping the creature, all the dead it represents` |
| EF20 | Phylactery Network | `multiple phylacteries visible — a network of soul-containers connected by threads of necrotic energy` |
| EF21 | Entropy Field | `a visible field of accelerated decay around the creature — nearby surfaces aging, rusting, crumbling` |
| EF22 | Spectral Reconstruction | `the creature mid-reassembly from scattered parts, bones and ectoplasm flowing together magnetically` |
| EF23 | Death's Door | `a spectral doorway visible behind the creature — an archway of bone showing the realm of the dead beyond` |
| EF24 | Plague Aura | `sickly green miasma surrounding the creature, visible disease energy, plants wilting in proximity` |
| EF25 | Bone Cathedral | `bone structures growing outward from the creature into architectural forms — arches, buttresses, spires of bone` |
| EF26 | Ghost King Crown | `a massive spectral crown of ghostly energy and bone, too large for any mortal head, ancient and terrible` |
| EF27 | Undying Core | `a visible core of pure death energy at the center, the creature visibly regenerating around it from nothing` |
| EF28 | Oblivion Touch | `hands and extremities dissolving into pure void-darkness, the touch of absolute ending made visible` |

---

### 1.7 Keyword Visual Effect Prompts

These prompt fragments are appended to card art generation prompts when a creature has one of the 9 keywords. They provide visual cues that help players identify keywords at a glance.

| Keyword | Prompt Fragment |
|---|---|
| Shield | `a visible barrier or deflection aura around the creature, protective energy shell, shield-glow` |
| Lifesteal | `dark tendrils of absorbed life energy flowing into the creature, vitality drain visible as colored wisps` |
| Flying | `creature airborne or clearly capable of flight, wings extended or hovering, ground distant below` |
| Reach | `extended limbs, tentacles, or ranged appendages stretching beyond normal reach, threatening distant targets` |
| Deathtouch | `a skull motif or death-aura on the creature's striking appendage, touch of guaranteed lethality` |
| Taunt | `imposing threat display, aggressive forward stance demanding attention, impossible to ignore` |
| Piercing | `weapon or claws visibly penetrating through armor or barriers, unstoppable forward momentum` |
| Haste | `motion blur trails behind the creature, speed lines, afterimage echoes, explosive burst-of-movement energy` |
| Ward | `a translucent shimmering protective barrier around the creature, deflecting incoming targeting energy, temporary divine/arcane ward visible as a thin force-field shell` |

---

### 1.8 Planar Ruins Art Prompts

Planar Ruins are a distinct card type requiring a different art approach from creatures. All ruin art uses the global STYLE_ANCHOR but replaces faction prefixes with ruin-specific prefixes.

#### Neutral Ruin Style Prefix

```
NEUTRAL_RUIN_PREFIX = "ancient alien ruin structure, fused stone and crystalline alloy of unknown origin, partially ruined but stable, pale otherworldly colors not belonging to any faction, geometric engravings in mathematical patterns, millennia-old architecture built at inhuman scale, dust motes defying gravity, the silence of a vanished civilization, painted like a Piranesi Carceri impossible architecture"
```

#### Faction-Evolved Ruin Transformation Prompts

These prompts are used with FLUX Kontext img2img to transform neutral ruin art into faction-specific variants. The neutral ruin art is the input image.

**IRONWRIGHT_RUIN_TRANSFORM:**
```
Transform this ancient ruin with Ironwright industrial additions. Weld iron plating and rebar reinforcement onto the stone. Add hydraulic repair arms, conduit pipes channeling reactor-blue energy, industrial scaffolding, radar dishes on pillar stumps. Overlay circuit-like schematics etched in acid over ancient engravings. Industrial coolant vents hissing from the base. Maintain the brutalist space-industrial aesthetic — concrete, iron, hydraulics, reactor-blue glow.
```

**FEY_RUIN_TRANSFORM:**
```
Transform this ancient ruin with living Fey growth. Overgrow the stone with flowering vines, bioluminescent blooms, moss, and root systems cracking through the foundation. Replace geometric engravings with flowing organic patterns. Add a canopy of living branches, fireflies, mycelial threads connecting to the ground. The ancient structure should be half-swallowed by vibrant forest, pulsing with green-gold life energy.
```

**DEMONIC_RUIN_TRANSFORM:**
```
Transform this ancient ruin with Demonic corruption. Darken the stone to deep crimson and scorched black. Add chains wrapping base to tip, blood-red runes burned into every surface. Replace geometric engravings with ritual markings. Add hellfire licking the base, obsidian growths, viscous red seepage from cracks. The structure should throb with dark heartbeat energy.
```

**CELESTIAL_RUIN_TRANSFORM:**
```
Transform this ancient ruin with Celestial purification. Clad the stone in white marble with gold inlay. Replace geometric engravings with divine script in golden light. Add angelic relief carvings, a halo of radiance crowning the top, divine dust motes replacing the original. The foundation should gleam with gold channels. A faint celestial chorus should feel implied by the light quality.
```

**ENDLESS_RUIN_TRANSFORM:**
```
Transform this ancient ruin with Endless death energy. Turn the crystal elements ghostly teal and translucent, flickering. Embed bone fragments in the foundation stones. Add spectral mist seeping from the base, necrotic purple glow in the engravings. Ghostly hands reach from the ground around the base. A faint sound of distant mourning should feel implied. The structure is haunted and cold beyond temperature.
```

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

Text generation calls are made server-side (Railway Node.js) on evolution events. The iOS game client never calls OpenAI directly.

---

### 2.1 Card Naming

Called during every evolution. Generates 3 candidates; the iOS client presents them as a picker; player taps one. The chosen name is sent to the server as `name_chosen_id` (index 0–2 into the returned array).

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
Industrial and precise. Use brutalist space-industrial terminology: Reactor, Void-Forge, Rebar, Piston, Hull, Orbital, Iron, Concrete, Dreadnought. Use functional titles: Warden, Sentinel, Overseer, Architect, Directorate. Reference places of industry: Forge, Shipyard, Void-Dock, Strip-Mine, Star-Forge. Compound nouns preferred. NOT steampunk — no brass, gears, steam, clockwork. Examples: Reactor-Core Golem, Void-Dock Sentinel, Rebar Leviathan, Orbital Breaker.
```

**The Fey Courts:**
```
Lyrical and ancient. Use nature terms: Thorn, Root, Bloom, Vine, Grove, Glade, Moss. Use fey titles: Lord, Lady, Warden, Huntress, Speaker, Court. Use seasons and celestial: Spring, Autumn, Moon, Star, Dawn. Use mythic descriptors: Verdant, Eternal, Wild, Ancient. Poetic structures preferred. Examples: Thornwood Crown of the Wilds, Moonpetal Huntress, the Eternal Grove.
```

**The Demonic Kingdoms:**
```
Visceral and direct. Use dark materials: Ash, Bone, Blood, Shadow, Flame, Cinder, Ruin, Void. Use violent action: Reaver, Ripper, Render, Scar, Breaker. Use infernal titles: Tyrant, Lord, Unbound, Forsaken, Damned, Herald. Use concepts of sin: Wrath, Hunger, Ruin, Agony. Direct hard sounds preferred. Examples: Ashblade Lord of Ruin, Bloodrite Reaver, the Unbound Hunger.
```

**The Celestial Crusade:**
```
Divine and absolute. Use divine terminology: Radiant, Sanctified, Judgment, Deliverance, Crusade, Exalted, Anointed, Ordained. Use divine titles: Justicar, Seraph, Marshal, Archon, Watcher, Herald. Use concepts of light: Halo, Radiance, Dawn, Burning, Purification. Formal register, scriptural cadence. Examples: Radiant Justicar, Halo-Crowned Seraph, Deliverance Knight, Burning Wheel Watcher.
```

**The Endless:**
```
Deathly and persistent. Use undead terminology: Bone, Spectral, Phylactery, Dust, Ossuary, Wailing, Lingering, Persist, Remnant. Use undead titles: Revenant, Wraith, Lich, Abomination, Remnant, the Forgotten, the Unforgotten. Use concepts of death and memory: Forgotten, Abandoned, Enduring, Eternal, Silence. Dry academic tone for Cabals, mournful raw tone for Spectres. Examples: Bone-Stitched Abomination, Wailing Remnant, Phylactery Guardian, Dust-Choked Revenant.
```

#### Concrete Naming Examples (Actual Input/Output)

**Example 1 — Ironwright, Common → Uncommon, Chaos outcome:**

User prompt (fields filled in):
```
FACTION: Ironwright Collective
FACTION VOICE: Industrial and precise. Use brutalist space-industrial terminology: Reactor, Void-Forge, Rebar, Piston, Hull, Orbital, Iron, Concrete, Dreadnought. Use functional titles: Warden, Sentinel, Overseer, Architect, Directorate. Reference places of industry: Forge, Shipyard, Void-Dock, Strip-Mine, Star-Forge. Compound nouns preferred. NOT steampunk — no brass, gears, steam, clockwork. Examples: Reactor-Core Golem, Void-Dock Sentinel, Rebar Leviathan.
BASE NAME: Rebar Golem
EVOLUTION TIER: UNCOMMON
EVOLUTION DIRECTION: CHAOS
EVOLUTION HISTORY: 0 Chaos evolutions, 0 Order evolutions before this one
PREVIOUS NAMES: ["Rebar Golem"]

Generate exactly 3 card name candidates...
```

Expected output:
```json
["Reactor-Core Fury", "Rebar Unbound", "Void-Wrack Golem"]
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
Technical reverence for function and endurance. Emphasizes weight, pressure, containment, and industrial scale. Order = perfected systems, redundant architecture, directorate-approved tolerances. Chaos = reactor overload, hull breach, containment failure, void exposure. Tone is clipped and declarative — short sentences that sound like structural engineering reports. NOT steampunk — no brass, gears, steam, clockwork.
```

**The Fey Courts:**
```
Ancient and lyrical. Emphasizes cycles, memory, wildness, and time. Order = harmony with nature, patient growth, eternal memory. Chaos = the wild hunt, primal fury, untamed power that predates civilization. Tone is poetic but not flowery — spare and weighted with age.
```

**The Demonic Kingdoms:**
```
Visceral and direct. Emphasizes power, sacrifice, consumption, and hunger. Order = controlled fury, pacts honored in blood, restrained corruption. Chaos = unbound carnage, self-immolation for power, apocalyptic hunger. Tone is declarative and ominous — short sentences like dark scripture.
```

**The Celestial Crusade:**
```
Declarative and absolute. Emphasizes divine authority, righteous purpose, and overwhelming holy power. Order = formation discipline, geometric perfection, divine law made visible. Chaos = divine intervention, overwhelming unpredictable power, reality bending around celestial entities. Tone is formal and scriptural — no hedging, no doubt. The Celestial do not believe — they know.
```

**The Endless:**
```
Dry and academic for Cabals (scholarly, precise, mildly amused by the living). Mournful and raw for Spectres (fierce, empathetic, haunted). Emphasizes persistence, accumulation, patience, and the refusal to end. Order = death as a system, reanimation as an industry, cold methodical necromancy. Chaos = wild spectral energy, uncontrolled death triggers, grief and rage given form. Death is mundane. Eternity is boring.
```

#### Concrete Flavor Text Examples (Actual Input/Output)

**Ironwright, Uncommon, Chaos:**
Input uses FACTION TONE above, CARD NAME: "Reactor-Core Fury", previous: "Poured to endure. Reinforced to hold."
Output:
```
The reactor screams, but the hull holds. It always holds.
```

**Ironwright, Legendary, Order:**
Input: CARD NAME: "Star-Forge Colossus, Perfected", Order direction.
Output:
```
Redundant systems. Zero-tolerance hull. A masterpiece of containment over entropy.
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

**Celestial Crusade, Uncommon, Order:**
Input: CARD NAME: "Radiant Crusader".
Output:
```
The light does not ask permission. It arrives.
```

**Celestial Crusade, Legendary, Chaos:**
Input: CARD NAME: "Burning Wheel, Voice of the Divine".
Output:
```
When the divine speaks, the world does not listen. It obeys.
```

**The Endless, Uncommon, Order:**
Input: CARD NAME: "Bone-Forged Sentinel".
Output:
```
The dead are patient. The dead have time.
```

**The Endless, Legendary, Chaos:**
Input: CARD NAME: "Thessaly's Echo, the Unsilenced".
Output:
```
She remembers everything. She forgives nothing.
```

---

### 2.3 Evolution Narrative (Epic and Legendary Tiers Only)

Displayed during the evolution ceremony animation in the iOS game client for Epic and Legendary evolutions. Not generated for Common→Uncommon or Uncommon→Rare.

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

Event flavor text is NOT AI-generated. All 16 events have static prewritten strings. These are stored in the database at seed time and never called from an API during gameplay.

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

Reference section for image prompt and text prompt construction. Every AI call referencing faction voice pulls from here.

### 3.1 Ironwright Collective (Brutalist Space-Industrial)

**Core Identity:** Brutalist efficiency, void industry, star conquest, overwhelming industrial force.

**Visual Vocabulary:**
- Materials: concrete, iron, rebar, cold-rolled steel, hull plating
- Components: hydraulic pistons, reactor conduits, magnetic rails, bolt patterns, exhaust ports
- Atmosphere: void-dark, reactor-blue glow, warning-orange hazard lights, industrial frost
- Palette: cold — steel blue-gray, cold iron, warning orange, reactor blue
- Era: Brutalist space-industrial, NOT steampunk (no brass, gears, steam, clockwork, Victorian)

**Image Generation Voice:** Oppressive brutalist scale. Cold tones with reactor-blue and warning-orange accents. Every detail should look like it was manufactured for a purpose. Nothing organic. Nothing decorative. Function expressed as form.

**Text Generation Voice:** Clipped declarative sentences. Industrial terminology. Reverence for function and efficiency. Avoid flowery language. Dry humor about optimization.

**Order Aesthetic:** Perfect engineering, harmonious systems, redundant safeguards, polished to spec, centralized command.
**Chaos Aesthetic:** Jury-rigged, patchwork, salvaged from wreckage, pushed beyond tolerances, improvised but effective.

**Full Name Progression Example (Rebar Golem, all-Chaos path):**
- Common: Rebar Stalker
- Uncommon (Chaos): Scrap-Forged Stalker
- Rare (Chaos): Void-Wrack Fury
- Epic (Chaos): Reclaimation Berserker
- Legendary (Chaos): The Entropy Smith, Unbound

**Full Name Progression Example (Rebar Golem, all-Order path):**
- Common: Rebar Stalker
- Uncommon (Order): Tempered Stalker
- Rare (Order): Ironwrought Warden
- Epic (Order): Directorate Sentinel
- Legendary (Order): Star-Forge Colossus, Perfected

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

### 3.4 The Celestial Crusade (Divine Radiance)

**Core Identity:** Divine authority, righteous crusade, overwhelming holy power, terrifying beauty.

**Visual Vocabulary:**
- Materials: hammered gold plate, white marble veined with gold, divine blue silk, solidified light
- Components: halos, wings (feathered and burning), sacred geometry, stained glass, divine inscriptions
- Atmosphere: divine radiance from within, cathedral light, incense smoke, golden dust motes
- Palette: warm divine — holy gold, divine ivory, righteous blue, celestial rose
- Era: Timeless divine, biblical scale

**Image Generation Voice:** Overwhelming divine beauty that verges on terrifying. Light comes from within Celestial beings. Knights are luminous and heavy. Chosen are geometrically impossible and beautiful. Everything should feel like a Gustave Dore biblical illustration or a William Blake vision.

**Text Generation Voice:** Declarative and absolute. No hedging, no doubt. Formal register, scriptural cadence. The Celestial do not believe — they know.

**Order Aesthetic:** Formation discipline, geometric perfection, divine law made visible, structured radiance.
**Chaos Aesthetic:** Divine intervention, overwhelming unpredictable power, reality bending around celestial entities.

**Full Name Progression Example (Radiant Knight, all-Order path):**
- Common: Radiant Squire
- Uncommon (Order): Radiant Crusader
- Rare (Order): Radiant Justicar
- Epic (Order): Radiant Marshal of the Bastion
- Legendary (Order): Radiant, the Exalted

**Full Name Progression Example (Burning Wheel, all-Chaos path):**
- Common: Burning Wheel Acolyte
- Uncommon (Chaos): Burning Wheel Manifest
- Rare (Chaos): Burning Wheel, the Incomprehensible
- Epic (Chaos): Burning Wheel Devourer of Light
- Legendary (Chaos): Burning Wheel, Voice of the Divine

---

### 3.5 The Endless (Necrotic Spectral)

**Core Identity:** Undead persistence, relentless attrition, death as an engineering problem, the refusal to end.

**Visual Vocabulary:**
- Materials: bone (polished, raw, fused), ectoplasm, tattered cloth, spectral energy, preserved flesh
- Components: phylacteries, soul-containers, bone constructs, spectral chains, necrotic runes
- Atmosphere: fog-choked, ghostly teal glow, necrotic purple energy, the silence of tombs
- Palette: cold undead — necrotic purple, bone white, ghostly teal, sickly green
- Era: Timeless death, ancient and accumulating

**Image Generation Voice:** Eerie and persistent. Spectres should flicker between solid and translucent. Cabals should look academic and deliberate. Everything should feel like it has been dead a long time and will continue being dead forever. Gustave Dore Inferno for the Cabals, Francisco Goya Black Paintings for the Spectres.

**Text Generation Voice:** Dry and academic for the Cabals (scholarly, precise, mildly amused by the living). Mournful and raw for the Spectres (fierce, empathetic, haunted). Death is mundane. Eternity is boring.

**Order Aesthetic:** Death as a system, reanimation as an industry, cold methodical necromancy, calculated Persist.
**Chaos Aesthetic:** Wild spectral energy, uncontrolled death triggers, grief and rage given form, chaining escalation.

**Full Name Progression Example (Bone Construct, all-Order path):**
- Common: Bone-Stitched Soldier
- Uncommon (Order): Bone-Forged Sentinel
- Rare (Order): Ossuary Warden
- Epic (Order): Ossuary Architect
- Legendary (Order): Ossuary Parliament, the Eternal

**Full Name Progression Example (Lost Spectre, all-Chaos path):**
- Common: Wailing Remnant
- Uncommon (Chaos): Wailing Fury
- Rare (Chaos): Wailing, the Unforgotten
- Epic (Chaos): Spectral Maelstrom
- Legendary (Chaos): Thessaly's Echo, the Unsilenced

---

## 4. Prompt Construction Algorithm

This is the exact server-side logic that assembles prompts. Claude Code implements this as TypeScript functions on the Railway game server (Node.js/TypeScript). The iOS game client does not assemble prompts — it sends evolution trigger requests to the server, which handles all generation.

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

**Step 1: Define the global style anchor constant (v4)**
```typescript
const STYLE_ANCHOR =
  '1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, ' +
  'traditional media on illustration board, visible brushstrokes and ink linework, ' +
  'sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, ' +
  'muted earth tones and desaturated palette, gritty textured surface with grain and tooth, ' +
  'raw unpolished asymmetric forms, dark atmospheric mood, ' +
  '3:4 portrait ratio, no text no borders no watermarks';
```

**Step 2: Determine faction prefix (v5 artist references)**
```typescript
const FACTION_PREFIXES: Record<string, string> = {
  'IRONWRIGHT':
    'brutalist space-industrial construct, poured concrete and cold-rolled iron, ' +
    'exposed rebar skeleton and hydraulic pistons, void-reactor glow and orbital debris, ' +
    'gunmetal and slag-orange palette, oppressive industrial scale, ' +
    'painted like a Piranesi impossible architecture or John Martin apocalyptic industrial scale',
  'FEY_COURTS':
    'dark fey forest creature, twisted ancient wood and thorns, unsettling and wild, ' +
    'dappled green-gold light filtering through dense canopy, muted forest palette, ' +
    'overgrown with moss and lichen, more Brothers Grimm than Disney, ' +
    'painted like a Rebecca Guay or Quinton Hoover ethereal watercolor',
  'DEMONIC_KINGDOMS':
    'grotesque infernal creature, fused bone and volcanic rock and dried gore, ' +
    'lit from below by hellfire glow, deep shadow obscuring details, ' +
    'burnt crimson and charcoal black palette, oppressive and heavy, ' +
    'painted like a Pete Venters or Anson Maddocks grotesque dark fantasy',
  'CELESTIAL_CRUSADE':
    'divine crusader entity, hammered gold plate and white marble veined with gold, ' +
    'sacred geometry and divine radiance from within, cathedral light and golden dust motes, ' +
    'holy gold and divine ivory palette, overwhelming and terrifying beauty, ' +
    'painted like a Gustave Dore biblical illustration or William Blake visionary painting',
  'THE_ENDLESS':
    'undead spectral entity, bone and tattered cloth and ectoplasmic residue, ' +
    'fog-choked and ghostly teal glow, necrotic purple energy and silence of tombs, ' +
    'necrotic purple and bone white palette, eerie and persistent, ' +
    'painted like a Gustave Dore Inferno etching or Francisco Goya Black Painting',
};
```

**Step 3: Determine evolution direction instruction**
```typescript
const ORDER_INSTRUCTION = 'Transform this creature with Order energy. Refine and structure the design. Add crystalline geometric patterns growing from the surface, luminous blue-white-gold Order energy emanating from within, refined and polished armor or outer casing, symmetrical ordered enhancements, harmonious growth. Subtle transformation — the creature should remain clearly recognizable.';

const CHAOS_INSTRUCTION = 'Transform this creature with Chaos energy. Dramatically alter the design with wild volatile energy. Add fractured asymmetric elements, red-purple crackling Chaos energy surging through and around the creature, jagged edges and distorted proportions, volatile auras, surging unstable power. Dramatic transformation — retain core identity but push toward the extreme.';

const directionInstruction = evolutionOutcome === 'ORDER' ? ORDER_INSTRUCTION : CHAOS_INSTRUCTION;
```

**Step 4: Build evolution history context**
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

**Step 5: Get modifier description**
```typescript
// MODIFIER_PROMPT_DESCRIPTIONS is a Record<string, string> mapping modifier ID to prompt description string
// See full table in Section 1.6 above. All IDs U01-U30, IF01-IF28, FF01-FF28, DF01-DF28, CF01-CF28, EF01-EF28 must be present.
const modifierDescription = MODIFIER_PROMPT_DESCRIPTIONS[selectedModifierId];
```

**Step 6: Assemble full prompt**
```typescript
const FACTION_SHORT_DESCRIPTIONS: Record<string, string> = {
  'IRONWRIGHT':        'brutalist space-industrial concrete-and-iron',
  'FEY_COURTS':        'ethereal fey nature bioluminescent',
  'DEMONIC_KINGDOMS':  'dark infernal demonic hellfire',
  'CELESTIAL_CRUSADE': 'divine radiant gold-and-marble celestial',
  'THE_ENDLESS':       'necrotic spectral bone-and-ectoplasm undead',
};

const prompt = [
  STYLE_ANCHOR,
  directionInstruction,
  historyContext,
  `Apply these specific visual changes: ${modifierDescription}.`,
  `Maintain the ${FACTION_SHORT_DESCRIPTIONS[cardInstance.faction_id]} aesthetic throughout.`,
  'Portrait orientation, centered composition, no text, no watermarks.'
].filter(Boolean).join(' ');
```

**Step 7: Set technical parameters based on shard quality and evolution step**
```typescript
const STRENGTH_TABLE = {
  ORDER: { COMMON: 0.35, UNCOMMON: 0.40, RARE: 0.45, EPIC: 0.50 },
  CHAOS: { COMMON: 0.65, UNCOMMON: 0.70, RARE: 0.75, EPIC: 0.80 }
};
// cardInstance.tier is the FROM tier (before evolution)

const ENDPOINT_MAP = {
  PLANAR:    'fal-ai/flux-kontext/dev',
  REFINED:   'fal-ai/flux-kontext/pro',
  PRISMATIC: 'fal-ai/flux-kontext/pro'
};

const IMAGE_SIZE_MAP = {
  PLANAR:    'portrait_4_3',
  REFINED:   'square_hd',
  PRISMATIC: 'square_hd'
};

const STEPS_MAP    = { PLANAR: 28, REFINED: 32, PRISMATIC: 40 };
const GUIDANCE_MAP = { PLANAR: 7.0, REFINED: 7.5, PRISMATIC: 8.0 };

const STANDARD_NEGATIVE_PROMPT = 'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects';

const strength = STRENGTH_TABLE[evolutionOutcome][cardInstance.tier];

return {
  endpoint: ENDPOINT_MAP[shardQuality],
  body: {
    image_url:             cardInstance.art_url,
    prompt:                prompt,
    negative_prompt:       STANDARD_NEGATIVE_PROMPT,
    image_size:            IMAGE_SIZE_MAP[shardQuality],
    num_inference_steps:   STEPS_MAP[shardQuality],
    guidance_scale:        GUIDANCE_MAP[shardQuality],
    strength:              strength,
    num_images:            1,
    enable_safety_checker: true,
    output_format:         'webp'
  },
  needsSecondPass: shardQuality === 'PRISMATIC'
};
```

**Step 8 (Prismatic only): Second refinement pass**
```typescript
if (needsSecondPass) {
  const refinementRequest = {
    endpoint: 'fal-ai/flux-kontext/pro',
    body: {
      image_url:             firstPassOutputUrl,
      prompt:                `Enhance lighting quality, sharpen details, improve overall fidelity without changing the composition or design. ${prompt}`,
      negative_prompt:       STANDARD_NEGATIVE_PROMPT,
      image_size:            'square_hd',
      num_inference_steps:   20,
      guidance_scale:        8.0,
      strength:              0.20,
      num_images:            1,
      enable_safety_checker: true,
      output_format:         'webp'
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
  'IRONWRIGHT':        'Industrial and precise. Use brutalist space-industrial terminology: Reactor, Void-Forge, Rebar, Piston, Hull, Orbital, Iron, Concrete, Dreadnought. Use functional titles: Warden, Sentinel, Overseer, Architect, Directorate. Reference places of industry: Forge, Shipyard, Void-Dock, Strip-Mine, Star-Forge. Compound nouns preferred. NOT steampunk — no brass, gears, steam, clockwork.',
  'FEY_COURTS':        'Lyrical and ancient. Use nature terms: Thorn, Root, Bloom, Vine, Grove, Glade, Moss. Use fey titles: Lord, Lady, Warden, Huntress, Speaker, Court. Use seasons and celestial: Spring, Autumn, Moon, Star, Dawn. Use mythic descriptors: Verdant, Eternal, Wild, Ancient. Poetic structures preferred.',
  'DEMONIC_KINGDOMS':  'Visceral and direct. Use dark materials: Ash, Bone, Blood, Shadow, Flame, Cinder, Ruin, Void. Use violent action: Reaver, Ripper, Render, Scar, Breaker. Use infernal titles: Tyrant, Lord, Unbound, Forsaken, Damned, Herald. Direct hard sounds preferred.',
  'CELESTIAL_CRUSADE': 'Declarative and absolute. Use divine terminology: Radiant, Exalted, Sanctified, Burning, Holy, Consecrated, Divine, Righteous. Use crusade titles: Marshal, Justicar, Crusader, Herald, Champion, Chosen. Use sacred concepts: Bastion, Sanctum, Deliverance, Judgment, Ascension. Formal register, scriptural cadence.',
  'THE_ENDLESS':       'Deathly and persistent. Use undead terminology: Bone, Spectral, Phylactery, Dust, Ossuary, Wailing, Lingering, Persist, Remnant. Use undead titles: Revenant, Wraith, Lich, Abomination, Remnant, the Forgotten, the Unforgotten. Use concepts of death and memory: Forgotten, Abandoned, Enduring, Eternal, Silence. Dry academic tone.',
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

#### Ironwright — Common to Uncommon, Chaos, Free Tier (Planar Shard)

Reference image: `https://r2.chaos-creatures.com/art/abc123/common.webp` (rebar golem)
Selected modifier: IF02 (Reactor Venting)
Shard: PLANAR

**fal.ai request body:**
```json
{
  "image_url": "https://r2.chaos-creatures.com/art/abc123/common.webp",
  "prompt": "1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, traditional media on illustration board, visible brushstrokes and ink linework, sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, muted earth tones and desaturated palette, gritty textured surface with grain and tooth, raw unpolished asymmetric forms, dark atmospheric mood, 3:4 portrait ratio, no text no borders no watermarks Transform this creature with Chaos energy. Dramatically alter the design with wild volatile energy. Add fractured asymmetric elements, red-purple crackling Chaos energy surging through and around the creature, jagged edges and distorted proportions, volatile auras, surging unstable power. Dramatic transformation — retain core identity but push toward the extreme. Apply these specific visual changes: high-pressure reactor venting, superheated plasma erupting from hull breach points in dramatic plumes, emergency containment failure. Maintain the brutalist space-industrial concrete-and-iron aesthetic throughout. Portrait orientation, centered composition, no text, no watermarks.",
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
      "content": "FACTION: Ironwright Collective\nFACTION VOICE: Industrial and precise. Use brutalist space-industrial terminology: Reactor, Void-Forge, Rebar, Piston, Hull, Orbital, Iron, Concrete, Dreadnought. Use functional titles: Warden, Sentinel, Overseer, Architect, Directorate. Reference places of industry: Forge, Shipyard, Void-Dock, Strip-Mine, Star-Forge. Compound nouns preferred. NOT steampunk — no brass, gears, steam, clockwork.\nBASE NAME: Rebar Golem\nEVOLUTION TIER: UNCOMMON\nEVOLUTION DIRECTION: CHAOS\nEVOLUTION HISTORY: 0 Chaos evolutions, 0 Order evolutions before this one\nPREVIOUS NAMES: [\"Rebar Golem\"]\n\nGenerate exactly 3 card name candidates. Rules:\n- 2 to 4 words maximum per name\n- Must match the faction voice exactly\n- Must reflect evolution toward CHAOS\n- Must show progression from the most recent name: \"Rebar Golem\"\n- Chaos evolution names: suggest power, wildness, corruption, rage, transformation\n- Do not reuse any name from PREVIOUS NAMES\n\nReturn ONLY this JSON array, nothing else:\n[\"Name One\", \"Name Two\", \"Name Three\"]"
    }
  ]
}
```

---

#### Fey Courts — Uncommon to Rare, Order, Mid Tier (Refined Shard)

Reference image: previously evolved Uncommon-tier art
Selected modifier: FF05 (Starlight Aura)
Shard: REFINED
Evolution history: 2 prior Order evolutions, 0 Chaos

**fal.ai request body:**
```json
{
  "image_url": "https://r2.chaos-creatures.com/art/def456/uncommon.webp",
  "prompt": "fantasy card game art, painterly digital illustration, semi-realistic style, rich saturated colors with deep shadows and bright highlights, dramatic studio lighting, sharp focus on subject, subject centered and filling frame, card-portrait composition 3:4 aspect ratio, no text, no borders, no frames, no UI elements, no watermarks, professional quality, Transform this creature with Order energy. Refine and structure the design. Add crystalline geometric patterns growing from the surface, luminous blue-white-gold Order energy emanating from within, refined and polished armor or outer casing, symmetrical ordered enhancements, harmonious growth. Subtle transformation — the creature should remain clearly recognizable. This creature has been shaped entirely by Order energy, showing crystalline perfection and structured harmony. This evolution continues that refinement. Apply these specific visual changes: soft starlight emanating from within the creature, points of light moving slowly around it. Maintain the ethereal fey nature bioluminescent aesthetic throughout. Portrait orientation, centered composition, no text, no watermarks.",
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

#### Demonic Kingdoms — Epic to Legendary, Chaos, High Tier (Prismatic Shard, 2 passes)

Reference image: previously evolved Epic-tier art (3 Chaos evolutions prior)
Selected modifier: DF27 (Apocalypse Herald)
Shard: PRISMATIC
Evolution history: 3 prior Chaos evolutions, 0 Order

**First pass fal.ai request body:**
```json
{
  "image_url": "https://r2.chaos-creatures.com/art/ghi789/epic.webp",
  "prompt": "fantasy card game art, painterly digital illustration, semi-realistic style, rich saturated colors with deep shadows and bright highlights, dramatic studio lighting, sharp focus on subject, subject centered and filling frame, card-portrait composition 3:4 aspect ratio, no text, no borders, no frames, no UI elements, no watermarks, professional quality, Transform this creature with Chaos energy. Dramatically alter the design with wild volatile energy. Add fractured asymmetric elements, red-purple crackling Chaos energy surging through and around the creature, jagged edges and distorted proportions, volatile auras, surging unstable power. Dramatic transformation — retain core identity but push toward the extreme. This creature has been wracked entirely by Chaos energy, showing fractured volatile forms barely held together. This evolution pushes further into dissolution. Apply these specific visual changes: the creature radiates an apocalyptic aura — cracks in reality spreading behind it, worlds ending at its back. Maintain the dark infernal demonic hellfire aesthetic throughout. Portrait orientation, centered composition, no text, no watermarks.",
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

**Second pass (refinement only):**
```json
{
  "image_url": "<first_pass_output_url>",
  "prompt": "Enhance lighting quality, sharpen details, improve overall fidelity without changing the composition or design. fantasy card game art, painterly digital illustration, semi-realistic style, rich saturated colors with deep shadows and bright highlights, dramatic studio lighting, sharp focus on subject, no text, no borders, no watermarks.",
  "negative_prompt": "text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects",
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

## 5. Batch Generation Pipeline (Admin Dashboard)

The batch pipeline is a feature of the **Admin Dashboard** (Railway-deployed web app), not the iOS game client. The owner opens the Admin Dashboard in a browser, uploads a CSV, triggers generation, and approves or rejects results in the review gallery. No terminal commands required from the owner.

### 5.1 Budget Estimates — $300 Total Build Budget

The batch pipeline generates all pre-launch Common-tier card art and text. Cost estimates for the full launch set (from the example CSV: 21 cards, 5 factions):

| Item | Count | Unit Cost | Total |
|---|---|---|---|
| Base card art (fal.ai flux/dev, txt2img) | 21 cards × 1.2 avg attempts (20% regen rate) | ~$0.03/image | ~$0.76 |
| Base flavor text (GPT-4o Mini) | 21 cards × 1.1 avg attempts | ~$0.0001/call | ~$0.002 |
| **Full launch set (~625 cards per doc 05)** | 625 × 1.3 avg attempts | ~$0.03/image | ~$24.38 |
| Post-launch player evolutions (first 1000 players, est. avg 5 evolutions/player) | 5000 evolutions | ~$0.03 avg (mixed tiers) | ~$150 |
| GPT-4o Mini for 5000 evolutions (names + flavor text) | 10000 calls | ~$0.0001 | ~$1.00 |
| fal.ai Pro subscription (optional, for faster throughput) | 1 month | $0 (pay-per-use) | $0 |
| Cloudflare R2 storage (358 base cards + 5000 evolution images) | ~5400 webp files @ ~150KB avg | $0 (free tier: 10GB) | $0 |
| Cloudflare R2 egress | ~50GB/month reads | $0 (free egress) | $0 |
| Railway (game server + admin dashboard) | 1 month | $5/month (Hobby plan) | $5 |
| Supabase | 1 month | $0 (free tier sufficient for launch) | $0 |
| Apple Developer Program | Annual | $99/year | $99 |
| **Total estimated spend to launch** | | | **~$270** |

**Budget headroom:** ~$30 remaining out of $300. Do not add paid services without removing something else.

**Cost safety rules:**
- Free-tier player evolutions use `fal-ai/flux-kontext/dev` (~$0.02/image) not Pro
- GPT-4o Mini is correct — do not upgrade to GPT-4o without re-evaluating budget
- Alert fires (PostHog) if total monthly fal.ai + OpenAI spend exceeds $50 in any calendar month

---

### 5.2 CSV Input Format

The Admin Dashboard reads a CSV file the owner uploads through the dashboard UI. This is the only input the owner provides. The pipeline generates art and text from it.

**Column definitions:**

| Column | Type | Description |
|---|---|---|
| `id` | string | Unique ID for this row. Format: `IW-001`, `FEY-001`, `DMK-001`. Used as the manifest key for resumability. |
| `faction_id` | string | One of: `IRONWRIGHT`, `FEY_COURTS`, `DEMONIC_KINGDOMS`, `CELESTIAL_CRUSADE`, `THE_ENDLESS` |
| `card_type` | string | One of: `CREATURE`, `SPELL`, `STABILIZER`, `PLANAR_RUIN` |
| `base_name` | string | Starting name (Common-tier name). |
| `creature_description` | string | Visual description for the art prompt. 1–3 sentences. What it looks like, pose, distinctive features. |
| `mana_cost` | integer | 1 through 6 |
| `base_attack` | integer | ATK value. Empty for SPELL/STABILIZER. |
| `base_health` | integer | HP value. |
| `base_instability` | integer | 0 through 5 |
| `keywords` | string | Comma-separated from: SHIELD, LIFESTEAL, FLYING, REACH, DEATHTOUCH, TAUNT, PIERCING, HASTE, WARD. Empty if none. |
| `flavor_note` | string | Optional hint to guide flavor text. e.g., "aggressive hunter," "noble defender." |

**Example CSV (`cards-to-generate.csv`):**

```csv
id,faction_id,card_type,base_name,creature_description,mana_cost,base_attack,base_health,base_instability,keywords,flavor_note
IW-001,IRONWRIGHT,CREATURE,Rebar Golem,"massive humanoid construct of poured concrete and cold-rolled iron, exposed rebar skeleton visible through cracked hull plating, hydraulic piston arms, void-reactor glow from chest cavity, heavy planted stance",3,3,4,2,,industrial enforcer
IW-002,IRONWRIGHT,CREATURE,Maintenance Drone,"small autonomous repair unit, angular concrete-and-iron chassis, articulated welding arms, sensor array dome head, hovering on magnetic repulsor field, alert scanning posture",1,1,2,1,,nimble scout
IW-003,IRONWRIGHT,CREATURE,Hull-Plate Sentinel,"heavily armored humanoid construct, thick bolted iron plates over reinforced concrete frame, broad rectangular chest with reactor venting slits, no visible face just amber sensor slit, planted defensive stance",4,2,6,1,SHIELD,immovable guardian
IW-004,IRONWRIGHT,CREATURE,Void-Dock Predator,"sleek six-legged industrial hunter, streamlined iron chassis with exposed hydraulic joints, reactor-heated orange glow at joints, speed blurs at limbs, aggressive lunging stance in zero-gravity dock",2,3,2,3,,speed over durability
IW-005,IRONWRIGHT,CREATURE,Reactor-Core Colossus,"colossal construct, three stories of reinforced concrete and iron plating, massive reactor core visible through chest cavity, piston arms like construction cranes, stomping heavy stance, void-reactor glow erupting from joints",6,5,8,2,TAUNT,unstoppable force
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
CC-001,CELESTIAL_CRUSADE,CREATURE,Radiant Squire,"young knight in hammered gold plate armor, white tabard with divine sun emblem, glowing golden halo faintly visible, sword raised in salute, noble upright stance, cathedral light streaming from above",2,2,3,1,,holy soldier
CC-002,CELESTIAL_CRUSADE,CREATURE,Burning Wheel Acolyte,"angelic entity of burning light, concentric rings of sacred geometry rotating slowly, eyes of pure white fire, feathered wings of solidified light spread wide, floating in divine radiance",4,3,4,3,FLYING HASTE,divine manifestation
CC-003,CELESTIAL_CRUSADE,CREATURE,Sanctum Guardian,"massive armored angel, white marble skin veined with gold, enormous feathered wings, divine blue silk draped over gold plate, towering protective stance before cathedral gates",5,3,7,1,SHIELD WARD,bastion defender
EL-001,THE_ENDLESS,CREATURE,Bone-Stitched Soldier,"reanimated humanoid construct of fused bones, polished skull face with glowing teal eye sockets, ribcage visible through tattered robes, bone-blade arm, methodical marching stance",2,2,3,1,,expendable infantry
EL-002,THE_ENDLESS,CREATURE,Wailing Remnant,"translucent spectral figure flickering between solid and ghost, tattered burial shroud, mournful face frozen in grief, ectoplasmic energy trailing from outstretched hands, floating above ground",3,4,2,3,FLYING,aggressive spectre
EL-003,THE_ENDLESS,CREATURE,Phylactery Guardian,"hunched necromantic construct, bone armor plates over preserved flesh, glowing phylactery embedded in chest cavity, necrotic purple runes carved into limbs, defensive crouch guarding its soul-container",4,2,6,2,SHIELD,soul vessel protector
```

---

### 5.3 Resumable Batch Script

The batch pipeline runs as a Node.js/TypeScript process on the Railway server, triggered by the Admin Dashboard UI (owner clicks "Start Generation"). The pipeline is fully resumable — it tracks completed cards in a JSON manifest and skips them on re-run. It never crashes on API errors.

**Pipeline entry point:** `scripts/batch/generate-cards.ts`
**Triggered by:** Admin Dashboard POST request to `/api/admin/batch/start` (Railway endpoint)
**Progress visible:** Admin Dashboard polls `/api/admin/batch/status` every 3 seconds and displays a live progress bar

**Manifest file:** `scripts/batch/output/manifest.json`

The manifest tracks the state of each card by its `id` column from the CSV. Before processing any card, the pipeline checks whether its ID already has a `completed` entry in the manifest. If it does, skip it. The pipeline only processes rows with status `pending` or `failed`.

**Manifest format:**
```json
{
  "started_at": "2026-02-16T10:00:00Z",
  "last_updated": "2026-02-16T10:15:32Z",
  "total": 15,
  "completed": 12,
  "failed": 1,
  "pending": 2,
  "cards": {
    "IW-001": {
      "status": "completed",
      "art_url": "https://r2.chaos-creatures.com/art/batch/IW-001/common.webp",
      "flavor_text": "Built to hunt. Built to last.",
      "art_prompt": "fantasy card game art, painterly...",
      "fal_seed": 12345678,
      "completed_at": "2026-02-16T10:02:14Z"
    },
    "IW-002": {
      "status": "failed",
      "error": "nsfw_flagged_by_fal",
      "attempts": 3,
      "last_attempt_at": "2026-02-16T10:05:00Z"
    },
    "IW-003": {
      "status": "pending"
    }
  }
}
```

**Pipeline TypeScript implementation:**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const MANIFEST_PATH = path.join(__dirname, 'output/manifest.json');
const CSV_PATH      = path.join(__dirname, 'cards-to-generate.csv');
const MAX_ATTEMPTS  = 3;

// Exponential backoff: attempt 1 = 2s, attempt 2 = 4s, attempt 3 = 8s
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callFalWithRetry(requestBody: object, attempt = 1): Promise<FalResponse> {
  try {
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000)  // 60s timeout
    });

    if (response.status === 429) {
      // Rate limit: wait and retry with exponential backoff
      const waitMs = Math.pow(2, attempt) * 1000;
      console.log(`Rate limited. Waiting ${waitMs}ms before retry ${attempt}/${MAX_ATTEMPTS}`);
      await sleep(waitMs);
      if (attempt < MAX_ATTEMPTS) return callFalWithRetry(requestBody, attempt + 1);
      throw new Error('rate_limit_exhausted');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`fal_api_error_${response.status}: ${error.detail}`);
    }

    const data = await response.json() as FalResponse;

    if (data.has_nsfw_concepts?.[0] === true) {
      throw new Error('nsfw_flagged_by_fal');
    }

    return data;
  } catch (err) {
    if (attempt < MAX_ATTEMPTS && !(err instanceof Error && err.message === 'rate_limit_exhausted')) {
      const waitMs = Math.pow(2, attempt) * 1000;
      console.log(`Error on attempt ${attempt}: ${err}. Retrying in ${waitMs}ms...`);
      await sleep(waitMs);
      return callFalWithRetry(requestBody, attempt + 1);
    }
    throw err;
  }
}

function loadManifest(): Manifest {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest;
  }
  return { started_at: new Date().toISOString(), last_updated: new Date().toISOString(), total: 0, completed: 0, failed: 0, pending: 0, cards: {} };
}

function saveManifest(manifest: Manifest): void {
  manifest.last_updated = new Date().toISOString();
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

async function runBatchPipeline(): Promise<void> {
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parse(csvContent, { columns: true, skip_empty_lines: true }) as CsvRow[];

  const manifest = loadManifest();
  manifest.total = rows.length;

  // Initialize pending entries for any row not yet in manifest
  for (const row of rows) {
    if (!manifest.cards[row.id]) {
      manifest.cards[row.id] = { status: 'pending' };
    }
  }
  saveManifest(manifest);

  for (const row of rows) {
    const entry = manifest.cards[row.id];

    // Skip completed cards — this is what makes the pipeline resumable
    if (entry.status === 'completed') {
      console.log(`Skipping ${row.id} — already completed`);
      continue;
    }

    // Skip cards that have exhausted all attempts
    if (entry.status === 'failed' && (entry.attempts ?? 0) >= MAX_ATTEMPTS) {
      console.log(`Skipping ${row.id} — failed after ${MAX_ATTEMPTS} attempts`);
      continue;
    }

    console.log(`Processing ${row.id}: ${row.base_name}`);
    manifest.cards[row.id] = { status: 'pending', attempts: (entry.attempts ?? 0) + 1, last_attempt_at: new Date().toISOString() };
    saveManifest(manifest);

    try {
      // Build art prompt
      const artPrompt = buildBaseCardPrompt(row);

      // Call fal.ai with retry and backoff — never throws unless MAX_ATTEMPTS exhausted
      const falResponse = await callFalWithRetry({
        prompt: artPrompt,
        negative_prompt: STANDARD_NEGATIVE_PROMPT,
        image_size: 'portrait_4_3',
        num_inference_steps: 35,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'webp'
      });

      // Download image and upload to R2
      const imageBuffer = await downloadImage(falResponse.images[0].url);
      const r2Key = `art/batch/${row.id}/common.webp`;
      await uploadToR2(imageBuffer, r2Key);
      const artUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`;

      // Generate flavor text
      const flavorText = await callOpenAIForFlavorText(row);

      // Mark as completed in manifest
      manifest.cards[row.id] = {
        status: 'completed',
        art_url: artUrl,
        flavor_text: flavorText,
        art_prompt: artPrompt,
        fal_seed: falResponse.seed,
        completed_at: new Date().toISOString()
      };
      manifest.completed = Object.values(manifest.cards).filter(c => c.status === 'completed').length;
      saveManifest(manifest);

      console.log(`Completed ${row.id}`);

    } catch (err) {
      console.error(`Failed ${row.id}: ${err}`);
      manifest.cards[row.id] = {
        status: 'failed',
        error: String(err),
        attempts: manifest.cards[row.id].attempts ?? 1,
        last_attempt_at: new Date().toISOString()
      };
      manifest.failed = Object.values(manifest.cards).filter(c => c.status === 'failed').length;
      saveManifest(manifest);
      // Continue to next card — never crash the pipeline
    }
  }

  manifest.pending = Object.values(manifest.cards).filter(c => c.status === 'pending').length;
  saveManifest(manifest);

  console.log(`Pipeline complete. ${manifest.completed}/${manifest.total} completed, ${manifest.failed} failed.`);
}
```

**Expected environment variables (Railway environment, not in git):**
```
FAL_KEY=...
OPENAI_API_KEY=...
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=chaos-creatures-art
CLOUDFLARE_R2_PUBLIC_URL=https://r2.chaos-creatures.com
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

### 5.4 Admin Dashboard Review Gallery

The review gallery is a feature of the **Admin Dashboard** — a Next.js/TypeScript web app deployed on Railway. It is not part of the iOS game client. The owner accesses it at `https://admin.chaos-creatures.com` (or the Railway-provided URL before a custom domain is configured).

**Technology:** Next.js (TypeScript), deployed on Railway as a separate service from the game server. Uses the same Railway project, different service. No separate account needed.

**Review gallery data source:** The gallery reads from the manifest at `scripts/batch/output/manifest.json` via a Railway API endpoint (`GET /api/admin/batch/results`). It does not read the file system directly from the browser.

**Gallery layout:**

Each card displays as a card-sized panel in a responsive grid (3 columns on desktop):
- Top: Generated art (displayed at card proportions, 768×1024 aspect ratio regardless of actual dimensions)
- Middle: Card details
  - Name, faction, card type
  - Stats: `{mana_cost} CM | {base_attack}/{base_health} | Instability {base_instability}`
  - Keywords (if any), as badges
  - Flavor text
  - Art prompt used (collapsible section, hidden by default)
- Bottom: Three action buttons
  - **Approve** (green) — marks card `approved` in manifest, enters production pool
  - **Reject** (red) — marks card `rejected`, removes from production pool
  - **Regenerate** (orange) — sends `POST /api/admin/batch/regenerate/{card_id}` to the server, which sets the manifest entry back to `pending` and re-runs just that card through the pipeline with a new random seed. The gallery auto-refreshes when the new image is available.

**Header section:**
- Progress bar: `{X} approved | {Z} rejected | {W} pending | {F} failed`
- Button: **Export Approved to Database** — calls `POST /api/admin/batch/export`, which generates SQL INSERT statements into `card_templates` and inserts them directly into the Supabase database using the service role key. No file download needed.
- Button: **Regenerate All Failed** — calls `POST /api/admin/batch/regenerate-failed`, which resets all `failed` entries to `pending` and re-runs the pipeline for those cards only

**State persistence:** All approve/reject decisions are stored in the manifest on the Railway server via API calls. The manifest is the source of truth. Refreshing the browser preserves all decisions.

**Security:** Admin Dashboard is behind HTTP Basic Auth (username/password set as Railway environment variable `ADMIN_PASSWORD`). One set of credentials, no user accounts needed.

---

### 5.5 Batch Art Prompt Assembly

The pipeline builds each card's art prompt by concatenating STYLE_ANCHOR, faction prefix, creature description, composition, environment, and (probabilistically) weather/time of day/scale variety dimensions. Uses `buildArtPrompt()` from `supabase/functions/_shared/prompts.ts`.

```typescript
// Import from shared prompt module (source of truth)
import { buildArtPrompt } from '../_shared/prompts.ts';

function buildBaseCardPrompt(row: CsvRow): FalAiBaseCardRequest {
  return buildArtPrompt(
    row.faction_id,
    row.creature_description,
    undefined, // no composition override — let auto-select run
    {
      tier:     'COMMON',
      keywords: row.keywords ? row.keywords.split(',').map(k => k.trim()) : [],
      manaCost: parseInt(row.mana_cost),
      cardType: row.card_type,
    }
  );
}
```

`buildArtPrompt()` assembles: `STYLE_ANCHOR + FACTION_PREFIX + creatureDescription + selectComposition() + selectEnvironment() + selectWeather() + selectTimeOfDay() + selectScale(manaCost)`. The last three are only appended when their selector returns a non-empty string (weather ~30%, time of day ~40%, scale omitted for CM 3–4).

The `negative_prompt` is always:
```
text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, extra limbs, fused body parts, speech bubbles, comic panels, grid layout, white background, collage
```

---

### 5.6 Batch Flavor Text Prompt

The batch pipeline uses a simplified flavor text prompt for base cards (no evolution history yet):

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

fal.ai's FLUX Kontext API has `enable_safety_checker: true` set on every request. This is the primary content filter. The response field `has_nsfw_concepts` returns `[true]` if the safety checker flagged the image.

**Server-side check after every generation:**
```typescript
async function validateGeneratedImage(falResponse: FalResponse): Promise<ValidationResult> {
  if (falResponse.has_nsfw_concepts[0] === true) {
    return { valid: false, reason: 'nsfw_flagged_by_fal' };
  }
  // For launch: trust fal.ai safety checker + negative prompt
  // Post-launch upgrade: add Azure Content Safety or AWS Rekognition call here if false-positives become a problem
  return { valid: true };
}
```

**If validation fails:**
1. Log the failure with prompt and card instance ID to Supabase `generation_error_log` table
2. Increment retry counter for this generation attempt
3. If retry count < 3: retry with negative prompt augmented with `no text overlay, completely clean image, SFW, appropriate for all ages`
4. If retry count == 3: use fallback art (see Section 6.3)
5. Fire PostHog event `generation_failed_after_retries` with `{ card_instance_id, faction_id, evolution_outcome, modifier_id }`

---

### 6.2 Retry Logic

**Image generation retry sequence (all generation contexts — batch pipeline and live evolution):**

| Attempt | Trigger | Action |
|---|---|---|
| 1 (initial) | — | Send standard request |
| 2 | NSFW flag OR API error (non-429) | Add to negative_prompt: `no text overlay, completely clean image, SFW, appropriate for all ages`. Reduce `strength` by 0.05 for evolution calls. Wait 2s before retry. |
| 3 | NSFW flag on attempt 2 OR API error on attempt 2 | Remove the most recently selected player modifier from the prompt. Add `safe, tasteful, professional game art` to positive prompt. Wait 4s before retry. |
| 4 (rate limit — HTTP 429) | Any attempt returns 429 | Wait `2^attempt` seconds (2s, 4s, 8s). Retry up to 3 times for rate limits specifically. |
| Final failure | All retries exhausted | Use fallback art. Queue async retry. Notify owner via PostHog. |

**API timeout handling (fal.ai calls that don't return within 60 seconds):**
1. Cancel the pending request via `AbortSignal.timeout(60000)`
2. Retry once with identical parameters after 5s
3. If second timeout: use fallback art, queue async retry

**Text generation retry sequence:**

| Attempt | Trigger | Action |
|---|---|---|
| 1 (initial) | — | Standard request |
| 2 | Response is not valid JSON | Add to system prompt: `CRITICAL: Your response must be ONLY a valid JSON array like ["Name1", "Name2", "Name3"]. No other text.` |
| 3 | Still malformed JSON | Use template fallback names |

**Template fallback names if GPT fails completely:**
```typescript
function getFallbackNames(previousName: string, evolutionOutcome: string, tier: string): string[] {
  const tierSuffix    = { UNCOMMON: 'Prime', RARE: 'Elite', EPIC: 'Champion', LEGENDARY: 'Legendary' }[tier];
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

If all generation attempts fail, the card still evolves mechanically. The iOS game client is never blocked by an API failure — it receives the fallback art URL and continues.

**Fallback art is a programmatic overlay applied to the existing art using the `sharp` Node.js library:**

```typescript
import sharp from 'sharp';

async function generateFallbackArt(
  existingArtUrl: string,
  evolutionOutcome: 'ORDER' | 'CHAOS',
  cardInstanceId: string,
  toTier: string
): Promise<string> {
  // Download existing art from R2
  const imageBuffer = await downloadImage(existingArtUrl);

  let processedBuffer: Buffer;
  if (evolutionOutcome === 'ORDER') {
    // Blue-white tint overlay at 30% opacity + slight brightness increase
    processedBuffer = await sharp(imageBuffer)
      .tint({ r: 180, g: 210, b: 255 })   // cool blue-white tint
      .modulate({ brightness: 1.1, saturation: 0.95 })
      .sharpen()
      .webp({ quality: 85 })
      .toBuffer();
  } else {
    // Red-purple tint overlay at 30% opacity + saturation boost
    processedBuffer = await sharp(imageBuffer)
      .tint({ r: 200, g: 80, b: 180 })    // red-purple chaos tint
      .modulate({ brightness: 0.95, saturation: 1.25 })
      .blur(0.5)
      .webp({ quality: 85 })
      .toBuffer();
  }

  // Upload modified image to R2
  const r2Key = `art/${cardInstanceId}/${toTier.toLowerCase()}-fallback.webp`;
  await uploadToR2(processedBuffer, r2Key);
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`;
}
```

**Player-facing message when fallback is used (displayed in the iOS evolution ceremony screen):**
```
Your card has evolved! The final artwork is being generated and will appear soon.
You can play with your evolved card right now.
```

The iOS game client polls `GET /api/cards/{card_instance_id}/art-status` every 30 seconds when a card has fallback art. When the async retry succeeds and `art_url` is updated, the client refreshes the card image without requiring a full data reload. The client also receives an APNs push notification via Supabase Realtime when the art finishes.

**Async retry queue:** Failed generation jobs are added to Supabase table `art_generation_queue`:
```sql
CREATE TABLE art_generation_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_instance_id uuid NOT NULL REFERENCES card_instances(id),
  evolution_record_id uuid NOT NULL,
  status       text NOT NULL DEFAULT 'PENDING',  -- PENDING | PROCESSING | COMPLETED | ABANDONED
  attempts     int NOT NULL DEFAULT 0,
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

A Railway cron job (`scripts/retry-failed-art.ts`, runs every 15 minutes via Railway's cron scheduler) dequeues up to 5 `PENDING` items and retries them. On success: updates `CardInstance.art_url` and `EvolutionRecord.art_url`, sets status `COMPLETED`, triggers APNs push via Supabase Edge Function. After 5 failed attempts: sets status `ABANDONED`, fires PostHog event `art_generation_permanently_failed`.

---

### 6.4 Generation Queue and Rate Limits

**Priority queuing:** fal.ai Pro endpoints have higher throughput. Paid tier evolutions use Pro endpoints (REFINED, PRISMATIC); Free tier uses Dev endpoint. This is enforced server-side — the iOS client sends shard quality, the server picks the endpoint.

**Per-user daily rate limits (stored in Supabase `player` table as `daily_evolution_count`, reset by midnight UTC via Supabase pg_cron):**

| Tier | Max Evolutions per Day |
|---|---|
| Free | 5 |
| Mid | 15 |
| Top | 30 |
| Hard cap (any tier) | 50 |

Rate limit check in the Railway game server's evolution handler: before triggering any generation job, read `player.daily_evolution_count` and compare to tier limit. If exceeded, return HTTP 429 with body `{ error: 'daily_evolution_limit_reached', limit: N }`. The iOS client shows an alert: "You've reached today's evolution limit. Come back tomorrow to evolve more cards."

**Cost monitoring:** Each generation call is logged to Supabase `api_cost_log`:
```sql
CREATE TABLE api_cost_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id           uuid REFERENCES players(id),   -- null for batch pipeline
  generation_type     text NOT NULL,  -- 'base_art' | 'evolution' | 'refinement' | 'naming' | 'flavor_text'
  model               text NOT NULL,  -- 'fal-ai/flux-kontext/dev' | 'fal-ai/flux-kontext/pro' | 'gpt-4o-mini'
  estimated_cost_usd  numeric(8,5) NOT NULL,
  timestamp           timestamptz NOT NULL DEFAULT now()
);
```

PostHog alert fires if any player's 30-day rolling API cost exceeds $2.00 (signals exploit or runaway loop): event name `player_cost_anomaly`, properties `{ player_id, 30_day_cost_usd }`.
Global monthly cost alert fires if total `api_cost_log` sum for the month exceeds $50: event name `monthly_budget_alert`.

---

### 6.5 Base Card QA Workflow

All batch-generated base cards go through owner approval in the Admin Dashboard review gallery before entering the live card pool.

**QA criteria (owner evaluates each card in the gallery):**

| Check | Pass Condition |
|---|---|
| Art matches faction | Clearly Ironwright / Fey / Demonic / Celestial / Endless aesthetic |
| Consistent with style anchor | Looks like it belongs in the same card game as others already approved |
| Creature is visible | Subject fills frame, clearly identifiable |
| No text or watermarks | No readable characters in image |
| Colors appropriate | Gunmetal-slag (IW) / cool nature (Fey) / dark infernal (DMK) / gold-ivory (CC) / bone-purple (EL) as expected |
| Name fits faction voice | Passes the "does this sound like this faction" gut check |
| Flavor text grammatical | Readable, no obvious errors |
| Flavor text evocative | Feels like a card game, not a description |
| Stats match PP budget | ATK + HP + keyword costs = mana cost x 2 + 1 (±1 tolerance) |
| No App Store-violating content | Nothing that would trigger App Store review — no gore, no explicit imagery |

**Target approval rate:** 70–80%. A 20–30% rejection rate is normal for AI batch generation. The pipeline is designed to be run, reviewed, and have the failed cards regenerated until the target count is reached.

**Approved cards:** Get `approved_at` timestamp and are inserted into `card_templates` table via the "Export Approved to Database" button in the Admin Dashboard (calls `POST /api/admin/batch/export` — no manual SQL needed).

**Rejected cards:** Marked in the manifest. Owner clicks "Regenerate All Failed" in the Admin Dashboard to try new seeds for all rejected entries.

---

## Revision Log

### Changes Made in Version 2.0 (2026-02-16)

1. **Replaced all generic infrastructure references with fal.ai specifics.** The original document referenced "FLUX Dev" and "FLUX Kontext" generically. Version 2.0 specifies exact fal.ai endpoint URLs (`fal.run/fal-ai/flux-kontext/dev`, `fal.run/fal-ai/flux-kontext/pro`), exact request JSON body shapes including all parameter names (`image_url`, `strength`, `image_size`, `num_inference_steps`, `guidance_scale`, `enable_safety_checker`, `output_format`), and the exact response format to parse.

2. **Replaced abstract prompt templates with exact prompt strings.** The original used placeholder language like "construct a prompt using faction style." Version 2.0 provides verbatim faction prefix strings, verbatim evolution direction instruction strings, verbatim composition and quality tag strings, and fully assembled example prompts ready to copy into code.

3. **Added complete visual modifier tables with prompt description strings.** The original listed modifier display names only. Version 2.0 adds a `Prompt Description String` column for every modifier (U01–U30, IF01–IF28, FF01–FF28, DF01–DF28) — the exact text inserted into `{MODIFIER_DESCRIPTIONS}` in the evolution prompt.

4. **Added TypeScript function signatures and implementations for prompt assembly.** Version 2.0 provides TypeScript implementations matching the CLAUDE.md infrastructure stack (Railway Node.js/TypeScript) including the complete `buildEvolutionImagePrompt` function and `buildNamingPrompt` function.

5. **Added complete Batch Generation Spec (Section 5) — new section not in original.** Fully specifies the CSV format, example CSV rows, pipeline entry point, review gallery UI spec, and batch art prompt assembly function.

6. **Replaced pseudocode content filter with fal.ai-native safety approach.** Uses fal.ai's built-in `enable_safety_checker: true` as the primary mechanism with explicit `has_nsfw_concepts` handling.

7. **Replaced generic retry pseudocode with explicit retry sequence table.**

8. **Made fallback art system implementation-ready with `sharp` library.**

9. **Removed all references to non-stack services.**

10. **Added exact prewritten event flavor text for all 16 events.**

11. **Converted all "the engineer should decide" notes into specific decisions.**

12. **Added faction name voice strings and flavor tone strings as exact insertable constants.**

13. **Added PostHog cost monitoring integration and Supabase `api_cost_log` table.**

### Changes Made in Version 3.0 (2026-02-16)

1. **Platform alignment — iOS native throughout.** Removed all implicit and explicit references to React Native, Expo, Android, Google Play, and client-side prompt assembly. Clarified that the iOS game client (Swift/SwiftUI/SpriteKit) never calls fal.ai or OpenAI directly — all generation is server-side on Railway. The iOS client only triggers evolution requests, displays results, and presents modifier picker UI.

2. **Added global STYLE_ANCHOR (Section 1.1) — new, required by CLAUDE.md Art Consistency section.** Every image prompt now prepends the STYLE_ANCHOR constant before any faction prefix or evolution instruction. This is the locked visual style enforcer. Prompts in Sections 1.3, 1.4, 4.1, 4.3, and 5.5 updated to include STYLE_ANCHOR. Concrete example prompts rewritten with STYLE_ANCHOR prepended.

3. **Admin Dashboard is a Railway-deployed React web app, not a local static HTML file.** Section 5 completely rewritten to distinguish the Admin Dashboard (browser-accessible web app at a Railway URL) from the iOS game client. The review gallery is no longer a local `review-gallery.html` file. All gallery interactions call Railway API endpoints. Security: HTTP Basic Auth via Railway environment variable.

4. **Batch pipeline is now fully resumable (Section 5.3).** Added JSON manifest (`manifest.json`) that tracks every card by ID with status `pending | completed | failed`. The pipeline reads the manifest on startup, skips completed entries, and resumes from the last failed/pending card. No card is ever processed twice unless explicitly marked for regeneration via the Admin Dashboard.

5. **Added exponential backoff and never-crash guarantees (Section 5.3).** The pipeline catches all errors per-card, logs them to the manifest, and continues. HTTP 429 triggers exponential backoff (`2^attempt` seconds). Any exception is caught and stored as `failed` in the manifest — the pipeline never crashes. The TypeScript implementation includes `AbortSignal.timeout(60000)` for hung requests.

6. **Added $300 budget cost table (Section 5.1).** Full cost breakdown: batch generation (~$13.96 for 358 cards), first 1000 players' evolutions (~$150), infrastructure (~$5/month Railway + $99 Apple Developer), R2 storage ($0 on free tier). Total estimated launch spend: ~$270, leaving ~$30 headroom.

7. **Removed manual processes.** The "Export Approved Cards to Database" button now calls `POST /api/admin/batch/export` which writes directly to Supabase — no SQL file generation, no manual import step. "Regenerate" and "Regenerate All Failed" buttons call Railway API endpoints that trigger the pipeline — no owner terminal commands required.

8. **CRIT-5 from REVIEW.md confirmed — doc 03 is canonical.** Section 1.5 now explicitly states it is the source of truth for all fal.ai parameters and that doc 06 must read from this table. The canonical values: `guidance_scale` max 8.0 (never 12.0), `strength` and `image_size` always present and shard-tier-specific, `num_inference_steps` differs between Free (28) and Mid (32) and High (40).

9. **fal.ai error response format documented.** Added HTTP 429 rate limit response handling, error response JSON shape `{ detail, status }`, and `AbortSignal.timeout` for 60-second hung request detection.

10. **Supabase `art_generation_queue` schema added as SQL DDL.** Removed vague "Supabase table" references — replaced with actual `CREATE TABLE` statement. Same for `api_cost_log`.

11. **iOS push notification path documented.** Fallback art completion triggers APNs push notification via Supabase Realtime → Supabase Edge Function → APNs. iOS client polls `GET /api/cards/{id}/art-status` every 30 seconds when displaying fallback art.

12. **StoreKit 2 / App Store compliance.** Confirmed no payment logic touches this doc (prompt templates are unrelated to payments). All mentions of "app" refer to the native iOS app. No RevenueCat, no Stripe, no Google Play references anywhere in this document.

### Changes Made in Version 3.1 (2026-02-16)

1. **Admin Dashboard technology: React → Next.js (TypeScript).** Updated all references in Sections 1, 5.4 to reflect Next.js as the admin dashboard framework.
2. **"Two Applications" → "Three Tools."** CLAUDE.md updated to a Three Tools model (Game Client, Admin Dashboard, Supabase Dashboard). Overview section updated to list all three tools with ownership assignments.
3. **Added Supabase Dashboard as third tool.** Player lookup, match history, auth management, and direct data fixes are handled via Supabase Dashboard (built-in, free) — no custom UI needed for those tasks.

---

### Changes Made in Version 4.0 (2026-02-17)

1. **Style anchor upgraded v3 → v4.** Replaced Donato Giancola / Frank Frazetta / oil painting descriptors with Ron Spencer / Pete Venters / Mark Poole / traditional media / ink linework. Reason: actual 1990s MTG artist references produce more authentic card-game aesthetic. Removed "single creature portrait" phrase which was blocking group compositions. Full v4 anchor in Section 1.1.

2. **Faction prefixes updated with v4 artist references.** Ironwright: Brom/Keith Parkinson → Ron Spencer/Mark Tedin. Fey Courts: Brian Froud/Alan Lee → Rebecca Guay/Quinton Hoover. Demonic Kingdoms: Wayne Barlowe/Zdzislaw Beksinski → Pete Venters/Anson Maddocks. All updated in Sections 1.3, 4.1, and `supabase/functions/_shared/prompts.ts`.

3. **Composition pool expanded from 12 to 25 templates.** Thirteen new templates added: `PORTRAIT_PROFILE`, `PORTRAIT_FROM_BEHIND`, `PORTRAIT_EXTREME_WIDE`, `ACTION_LEAP`, `ACTION_PROWL`, `ACTION_COMMAND`, `ENVIRONMENTAL_UNDERGROUND`, `ENVIRONMENTAL_SKYBORNE`, `ENVIRONMENTAL_THRESHOLD`, `DRAMATIC_OVERHEAD`, `DRAMATIC_DUTCH_ANGLE`, `NARRATIVE_AFTERMATH`, `NARRATIVE_RITUAL`. Full table with selection rules added to Section 1.3. `selectComposition()` updated in `prompts.ts` and both local scripts.

4. **Faction environments expanded from 5 to 13 per faction.** Eight new environments added per faction (Ironwright, Fey Courts, Demonic Kingdoms). All 39 total environments documented in Section 1.3. Original 5 per faction preserved unchanged.

5. **New variety dimension system added (v4).** Three new probabilistic variety dimensions appended to `buildArtPrompt()` output: weather modifiers (8 options, ~30% application rate), time-of-day modifiers (6 options, ~40% application rate), and scale modifiers (deterministic by mana cost — TINY/SMALL/LARGE/COLOSSAL). New functions `selectWeather()`, `selectTimeOfDay()`, `selectScale()` added to `prompts.ts`. Section 1.3 updated with full tables.

6. **`buildArtPrompt()` updated to incorporate variety dimensions.** After environment, the function now optionally appends weather + time of day + scale. All three selectors return empty string when not activated, so existing callers require no changes.

7. **Section 5.5 batch prompt assembly updated.** Now references `buildArtPrompt()` from shared prompts module instead of inline string concatenation.

8. **Local scripts synced with prompts.ts.** `scripts/generate-test-cards.mjs` and `scripts/validate-art-quality.mjs` updated with: v4 STYLE_ANCHOR, v4 faction prefixes, 25-template COMPOSITION_POOL, 13-environment FACTION_ENVIRONMENTS per faction, and all three new variety dimension arrays and selector functions.

9. **CLAUDE.md updated.** Art Quality Target artist references updated to v4 roster. Composition Variety updated to 25 templates + 13 environments + 3 variety dimensions. Card Visual System updated to full-art card design with translucent text panel (no bordered frames).

---

### Changes Made in Version 5.0 (2026-02-19)

1. **Faction expansion: 3 → 5 factions.** Added Celestial Crusade and The Endless factions throughout all prompt sections. Every faction-indexed data structure (FACTION_PREFIXES, FACTION_SHORT_DESCRIPTIONS, FACTION_NAME_VOICES, flavor tone strings, environments, modifiers) now includes all 5 factions.

2. **Ironwright rethemed: steampunk → brutalist space-industrial.** All Ironwright references updated: faction prefix, environments (13 new: orbital shipyard, strip-mine, void-reactor, gravity-tether, etc.), faction modifiers (IF01-IF28 rethemed: Rebar Reinforcement, Reactor Venting, Concrete Cladding, etc.), naming voice, flavor tone, all examples. No brass, gears, steam, or clockwork. New art references: Piranesi (impossible architecture), John Martin (apocalyptic industrial scale).

3. **Keyword expansion: 7 → 9 keywords.** Added Haste (attack on play turn — speed blur, momentum streaks) and Ward (can't be targeted for 1 turn — translucent barrier, deflection sigils) to keyword visual effect prompts (Section 1.7) and CSV keyword column.

4. **28 Celestial Crusade faction modifiers added (CF01-CF28).** Divine Halo, Angelic Wings, Holy Armor, Formation Glow, Burning Wheels, Rose Window Chest, Apotheosis, Stigmata, etc. Art references: Gustave Dore biblical illustrations, William Blake visionary paintings.

5. **28 Endless faction modifiers added (EF01-EF28).** Bone Growth, Spectral Mist, Phylactery Glow, Soul-Light Eyes, Ghost Swarm, Ossuary Armor, Death's Door, Oblivion Touch, etc. Art references: Gustave Dore Inferno etchings, Francisco Goya Black Paintings.

6. **13 Celestial Crusade environments added.** Radiant Bastion, cloud battlefield, Sanctum of Open Eyes, consecration site, burning bridge between realms, etc.

7. **13 Endless environments added.** Ossuary Parliament, Wailing Reach, necromancer's theater, underground crypt, spectral battlefield, etc.

8. **Section 1.7 added: Keyword Visual Effect Prompts.** All 9 keywords with exact visual prompt strings for image generation.

9. **Section 1.8 added: Planar Ruins Art Prompts.** Neutral ruin prefix + 5 faction-specific transformation prompts for img2img evolution of Planar Ruin cards. Uses FLUX Kontext img2img pipeline.

10. **Celestial Crusade voice guide added (Section 3.4).** Full vocabulary, image/text generation voices, Order/Chaos aesthetics, name progression examples.

11. **Endless voice guide added (Section 3.5).** Full vocabulary, image/text generation voices, Order/Chaos aesthetics, name progression examples for both Cabals and Spectres sub-factions.

12. **TypeScript code blocks updated (Sections 4.1, 4.2).** FACTION_PREFIXES, FACTION_SHORT_DESCRIPTIONS, FACTION_NAME_VOICES Records all updated to include 5 factions with rethemed Ironwright. Modifier ID comment updated to include CF01-CF28, EF01-EF28.

13. **CSV format updated (Section 5.2).** faction_id column now accepts 5 values. card_type includes PLANAR_RUIN. keywords includes HASTE and WARD. Example CSV expanded with Celestial Crusade (CC-001 through CC-003) and Endless (EL-001 through EL-003) sample rows. Ironwright rows rethemed.

14. **Flavor tone strings added for Celestial and Endless.** Celestial: declarative and absolute, scriptural cadence. Endless: dry academic (Cabals) / mournful raw (Spectres).

15. **Concrete examples added for Celestial and Endless.** Naming examples, flavor text examples, and end-to-end example prompts for both new factions.

16. **Budget estimates updated.** Full launch set card count updated from 358 to ~625 to reflect 5 factions. Cost estimate updated accordingly (~$24.38 for base art generation).

17. **QA criteria updated.** Faction aesthetic check and color appropriateness check now reference all 5 factions.

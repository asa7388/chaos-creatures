# Chaos Creatures -- Art Direction & Visual Asset Plan

**Version:** 1.0
**Last Updated:** 2026-02-18
**Dependencies:** `00-game-design-master.md`, `03-prompt-templates.md`, `08-audio-design.md`, `PLAN-faction-expansion.md`, `faction-art-bible.md`

---

## Revision Log

| Date | Version | Changes |
|---|---|---|
| 2026-02-18 | v1.0 | Initial creation. Complete art inventory, decision matrix, background prompts, Planar Ruins art direction, season identity, asset purchase research, new/rethemed faction art bible sections. |

---

## Table of Contents

1. [Art Style Foundation](#1-art-style-foundation)
2. [Complete Art Inventory](#2-complete-art-inventory)
3. [AI-Generated vs Purchased Decision Matrix](#3-ai-generated-vs-purchased-decision-matrix)
4. [App Background Art Prompts](#4-app-background-art-prompts)
5. [Planar Ruins Art Direction](#5-planar-ruins-art-direction)
6. [Season 1 Visual Identity](#6-season-1-visual-identity)
7. [Asset Purchase Research & Recommendations](#7-asset-purchase-research--recommendations)
8. [Updated Faction Art Bible: Celestial Crusade](#8-updated-faction-art-bible-celestial-crusade)
9. [Updated Faction Art Bible: The Endless](#9-updated-faction-art-bible-the-endless)
10. [Updated Faction Art Bible: Ironwright Collective (Rethemed)](#10-updated-faction-art-bible-ironwright-collective-rethemed)

---

## 1. Art Style Foundation

### Global Aesthetic

All visual art in Chaos Creatures adheres to a **palette knife oil painting / traditional media aesthetic**. This is the non-negotiable style anchor. Every piece of art -- card illustrations, backgrounds, icons, UI textures, and loading screens -- must look hand-painted, with visible impasto brushstrokes, ink linework, crosshatching, and the organic imperfections of real paint on real surfaces. Nothing should look digital, smooth, gradient-based, or AI-generated in the typical "smooth diffusion" sense.

### LoRA Enforcement

All card art is generated via fal.ai FLUX with a custom LoRA:
- **EldritchPaletteKnife** at weight **0.9**
- Trained on curated keeper images from base card generation
- Ensures stylistic consistency across all five factions and Planar Ruins

### Public Domain Artist References (All Died Pre-1953)

| Role | Artist | Died | Style Contribution |
|---|---|---|---|
| **Base anchor** | Gustave Dore | 1883 | Dramatic engraving, chiaroscuro, biblical/epic scale, ink crosshatching |
| **Base anchor** | N.C. Wyeth | 1945 | Saturated oil painting, adventure illustration, bold compositions |
| **Ironwright** | Giovanni Battista Piranesi | 1778 | Impossible architecture, prison/industrial interiors, oppressive scale |
| **Ironwright** | John Martin | 1854 | Apocalyptic landscapes, vast industrial vistas, divine-scale destruction |
| **Fey Courts** | Arthur Rackham | 1939 | Twisted trees, sinuous linework, fairy-tale grotesquerie, pen-and-ink detail |
| **Fey Courts** | Edmund Dulac | 1953 | Luminous watercolor, decorative pattern, jewel-toned fantasy |
| **Demonic Kingdoms** | Hieronymus Bosch | 1516 | Surreal hellscapes, grotesque hybrid creatures, nightmare logic |
| **Celestial Crusade** | Gustave Dore (biblical) | 1883 | Divine radiance, angelic hosts, overwhelming heavenly light |
| **Celestial Crusade** | William Blake | 1827 | Visionary painting, muscular divine figures, ecstatic spirituality |
| **The Endless** | Gustave Dore (Inferno) | 1883 | Dante's circles, tormented souls, spectral darkness |
| **The Endless** | Francisco Goya | 1828 | Black Paintings, nightmare figures, psychological horror, decay |

### Color Philosophy

Colors are vivid and saturated within the oil painting aesthetic. They are applied with thick impasto strokes, not digital gradients. Each faction has a distinct, immediately recognizable palette. The muted earth-tone base from the style anchor grounds everything, but faction-specific accent colors punch through.

### Quality Gate

If a generated image looks:
- Smooth, plastic, or "AI-generated"
- Like it came from a different game
- Generic digital art without visible paint texture
- Inconsistent with the palette knife oil painting aesthetic

It is a **failed generation** and must be rejected and regenerated.

---

## 2. Complete Art Inventory

### 2.1 Card Art

| Category | Count Per Unit | Units | Total Images | Notes |
|---|---|---|---|---|
| Base creature cards | 13-14 per faction | 5 factions | **65-70** | Common tier art, batch-generated pre-launch |
| Evolved creature cards | 4 evolutions per card | 65-70 base cards | **260-280** | Generated via img2img during gameplay; not pre-generated |
| Planar Ruins -- neutral | 1 per archetype | 8 archetypes | **8** | Ancient, faction-neutral structures |
| Planar Ruins -- evolved | 5 faction variants per archetype | 8 archetypes | **40** | Faction-transformed ruin art |
| **Total pre-launch card art** | | | **113-118** | Base creatures + neutral ruins + evolved ruins |
| **Total including evolution art** | | | **373-398** | All card art including player-triggered evolutions |

### 2.2 App Chrome (Backgrounds & Screens)

| Asset | Dimensions | Count | Notes |
|---|---|---|---|
| App icon | 1024x1024 | 1 | App Store requirement. Faction-neutral, shows Chaos energy motif. |
| Launch screen / splash | 1290x2796 (iPhone 15 Pro Max) | 1 | Chaos motes swirling through fractured plane, logo overlay |
| Home screen background | 1290x2796 | 1 | Faction-neutral or adaptive to active deck faction |
| Collection screen background | 1290x2796 | 1 | Card vault / archive aesthetic |
| Deck builder background | 1290x2796 | 1 | Workshop / war table aesthetic |
| Shop background | 1290x2796 | 1 | Marketplace / bazaar aesthetic |
| Battle screen background | 1290x2796 | 5 | One per faction (player's faction determines battlefield) |
| Settings/profile background | 1290x2796 | 1 | Subtle, dark, non-distracting |
| Loading screen backgrounds | 1290x2796 | 8 | Rotating set, lore-themed vignettes |
| Onboarding faction slides | 1290x2796 | 5 | One per faction, introduces visual identity |
| Match result screen (victory) | 1290x2796 | 1 | Triumphant, golden light |
| Match result screen (defeat) | 1290x2796 | 1 | Somber, fading embers |
| Evolution ceremony background | 1290x2796 | 1 | Planar Shard energy, chaotic swirl |
| **App Chrome Total** | | **28** | |

### 2.3 Faction Assets (Per Faction x 5)

| Asset | Dimensions | Count Per Faction | Total (x5) | Notes |
|---|---|---|---|---|
| Faction emblem / icon | 512x512 | 1 | **5** | Used in UI, card info, deck builder, profile |
| Card back design | 768x1024 | 1 | **5** | Faction-specific back face |
| Universal card back | 768x1024 | -- | **1** | Default before faction is chosen |
| Faction banner | 1024x256 | 1 | **5** | Shop headers, profile display, battle intro |
| Battle field background | 1290x2796 | 1 | **5** | (same as battle screen backgrounds above) |
| Faction particle base texture | 128x128 | 1 | **5** | Used in SpriteKit particle emitters |
| **Faction Assets Total** | | | **26** | (5 counted in App Chrome already) |

### 2.4 UI Elements

| Asset | Dimensions | Count | Notes |
|---|---|---|---|
| Keyword icons | 256x256 | 9 | Shield, Lifesteal, Flying, Reach, Deathtouch, Taunt, Piercing, Haste, Ward |
| Stat icons (chaos motes, ATK, HP) | 128x128 | 3 | Already have v1 iterations generated |
| Rarity edge glow textures | 512x32 (strip) | 5 | Common (none), Uncommon (metallic), Rare (energy), Epic (purple), Legendary (gold prismatic) |
| Currency icon -- Chaos Dust | 256x256 | 1 | Swirling purple-gold mote |
| Planar Shard icons (per tier) | 256x256 | 3 | Planar Shard, Refined, Prismatic |
| Evolution energy icon | 128x128 | 1 | Chaos energy accumulation indicator |
| Achievement badge icons | 128x128 | 23 | Per achievement (existing 23 achievements) |
| Quest type icons | 128x128 | 6 | Daily/weekly/faction/seasonal/ruins/special |
| Button background texture | 512x128 | 3 | Primary, secondary, destructive |
| Tab bar icons | 64x64 | 5 | Home, Collection, Battle, Shop, Profile |
| Chaos Roll D20 face texture | 512x512 | 1 | Applied to 3D-rendered D20 in SpriteKit |
| Card text panel overlay | 768x300 | 1 | Translucent dark panel for card name/stats area |
| Mana crystal (empty/filled) | 64x64 | 2 | Resource display on battlefield |
| Sub-faction emblems | 256x256 | 10 | One per sub-faction (used in avatar selection, profile) |
| Avatar portrait frames | 512x512 | 10 | One per avatar, thematic border |
| **UI Elements Total** | | **83** | |

### 2.5 Battle VFX Textures

| Asset | Dimensions | Count | Notes |
|---|---|---|---|
| Attack impact -- per faction | 256x256 spritesheet | 5 | Ironwright: sparks/metal shrapnel. Fey: leaf burst/vine whip. Demonic: fire/obsidian shards. Celestial: divine light flash. Endless: spectral wail. |
| Damage number background | 128x64 | 1 | Translucent dark pill for floating damage text |
| Creature death -- per faction | 256x256 spritesheet | 5 | Ironwright: metal collapse/rust cloud. Fey: decomposition/spore burst. Demonic: hellfire immolation. Celestial: divine ascension/light scatter. Endless: spectral dissolution. |
| Chaos Roll D20 texture | 512x512 | 1 | (same as UI above) |
| Event popup -- Order background | 512x256 | 1 | Crystalline blue-gold frame |
| Event popup -- Chaos background | 512x256 | 1 | Fiery red-purple frame |
| Ruin placement effect | 256x256 spritesheet | 1 | Ancient stone materialization, energy settling |
| Ruin destruction effect | 256x256 spritesheet | 5 | Per faction -- how faction-evolved ruins shatter |
| Faction particle emitter textures | 128x128 | 5 | divine_radiance, spectral_mist, augment_spark, bond_bloom, corruption_flame |
| Shield keyword visual | 128x128 | 1 | Translucent barrier overlay on creature |
| Lifesteal drain arc | 256x64 | 1 | Red energy arc from target to source |
| Flying hover particles | 64x64 | 1 | Wind/lift particles under creature |
| Taunt aggro indicator | 128x128 | 1 | Red targeting reticle/forced-attack glow |
| Ward protection shimmer | 128x128 | 1 | Blue-white protective aura texture |
| Haste speed trail | 256x64 | 1 | Motion blur/afterimage trail |
| Exalt aura pulse | 256x256 | 1 | Golden radial pulse outward from creature |
| Persist death trigger | 256x256 | 1 | Ghostly echo / lingering shadow effect |
| Bond connection line | 16x256 (tileable) | 1 | Green-gold energy thread between bonded creatures |
| Augment stack glow | 128x128 | 1 | Blue-orange layered tech glow per stack |
| Corruption self-damage | 128x128 | 1 | Red veins / cracking skin texture |
| **Battle VFX Total** | | **36** | |

### 2.6 App Store Assets

| Asset | Dimensions | Count | Notes |
|---|---|---|---|
| Screenshots -- 6.7" (iPhone 15 Pro Max) | 1290x2796 | 6 | Home, Collection, Battle, Evolution, Shop, Deck Builder |
| Screenshots -- 6.1" (iPhone 15) | 1179x2556 | 6 | Same screens, different resolution |
| App Store preview video frames | 1290x2796 | 10 | Key moments for optional preview video |
| Feature graphic | 1024x500 | 1 | Promotional banner (if Apple features) |
| **App Store Total** | | **23** | |

### 2.7 Grand Total Summary

| Category | Asset Count |
|---|---|
| Pre-launch card art (base creatures + all ruins) | 113-118 |
| App Chrome (backgrounds, screens) | 28 |
| Faction assets (emblems, card backs, banners, particles) | 21 (excl. 5 battle BGs counted in Chrome) |
| UI elements | 83 |
| Battle VFX textures | 36 |
| App Store assets | 23 |
| **Total visual assets (pre-launch)** | **304-309** |
| Evolution card art (generated at runtime by players) | 260-280 (not pre-generated) |

---

## 3. AI-Generated vs Purchased Decision Matrix

| Category | Method | Est. Cost | Tools/Sources | Notes |
|---|---|---|---|---|
| **Card art (creatures)** | AI-generated | ~$8-12 | fal.ai FLUX + LoRA | 65-70 base cards at ~$0.04/gen, ~3 gens per keeper |
| **Card art (evolutions)** | AI-generated | Runtime cost | fal.ai FLUX Kontext img2img | Generated during gameplay, cost per evolution ~$0.04-0.08 |
| **Planar Ruins -- neutral** | AI-generated | ~$1.50 | fal.ai FLUX + LoRA | 8 archetypes, ~5 gens per keeper |
| **Planar Ruins -- evolved** | AI-generated | ~$6-8 | fal.ai FLUX + LoRA | 40 variants, ~4 gens per keeper |
| **App backgrounds** | AI-generated | ~$4-6 | fal.ai FLUX + LoRA | 28 backgrounds at ~$0.04/gen, ~5 gens per keeper |
| **Faction emblems** | AI-generated | ~$1 | fal.ai FLUX (no LoRA) | 5 emblems, transparent BG, icon style |
| **Card backs** | AI-generated | ~$1 | fal.ai FLUX + LoRA | 6 designs (5 faction + 1 universal) |
| **Faction banners** | AI-generated | ~$1 | fal.ai FLUX + LoRA | 5 banners |
| **Keyword icons** | AI-generated | ~$1.50 | fal.ai FLUX (no LoRA) | 9 icons, transparent BG, stylized |
| **Sub-faction emblems** | AI-generated | ~$1.50 | fal.ai FLUX (no LoRA) | 10 emblems |
| **Avatar portrait frames** | Created in code | $0 | SpriteKit / SwiftUI | Procedural borders with faction colors |
| **Stat icons** | AI-generated | ~$0.50 | fal.ai FLUX (no LoRA) | 3 icons, already have v1 |
| **Achievement badges** | AI-generated | ~$2 | fal.ai FLUX (no LoRA) | 23 badges, simple symbolic designs |
| **Quest type icons** | AI-generated | ~$0.50 | fal.ai FLUX (no LoRA) | 6 icons |
| **Button textures** | Created in code | $0 | SwiftUI gradients + overlays | Procedural, faction-tinted |
| **Tab bar icons** | Created in code (SF Symbols) | $0 | Apple SF Symbols | Free system icons |
| **Rarity glow textures** | Created in code | $0 | SpriteKit shaders + SKAction | Procedural glow, shimmer, pulse |
| **Currency/shard icons** | AI-generated | ~$0.50 | fal.ai FLUX (no LoRA) | 4 icons total |
| **D20 face texture** | AI-generated | ~$0.25 | fal.ai FLUX (no LoRA) | 1 texture, engraved stone look |
| **Card text panel** | Created in code | $0 | SwiftUI / SpriteKit | Translucent dark overlay, procedural |
| **Mana crystals** | AI-generated | ~$0.25 | fal.ai FLUX (no LoRA) | 2 states (empty/filled) |
| **Battle VFX spritesheets** | Mix: AI + code | ~$2 | fal.ai + SpriteKit particles | AI generates base textures; particle systems coded |
| **Faction particle textures** | AI-generated | ~$0.50 | fal.ai FLUX (no LoRA) | 5 base textures for emitters |
| **Event popup frames** | Created in code | $0 | SwiftUI + SpriteKit | Procedural frame with faction tinting |
| **App icon** | AI-generated | ~$0.50 | fal.ai FLUX + LoRA | Must look premium at 1024x1024 |
| **App Store screenshots** | Captured from Simulator | $0 | Xcode Simulator | Annotated with marketing text overlays |
| **Fonts** | Free/open-source | $0 | Google Fonts (OFL) | Cinzel + Alegreya |
| **SFX -- card game** | Purchased | $0-20 | itch.io / freesound.org | See Section 7 |
| **SFX -- UI** | Purchased | $0-12 | itch.io / freesound.org | See Section 7 |
| **Battle music** | Purchased | $15-28 | itch.io | See Section 7 |
| **Ambient/environmental** | Free | $0 | Suno.ai free tier / Freesound.org CC0 | See Section 7 |
| **Particle texture reference** | Free | $0 | OpenGameArt.org CC0 | Base textures adapted in SpriteKit |

### Cost Summary

| Category | Estimated Cost |
|---|---|
| AI art generation (fal.ai) -- all visual assets | ~$32-42 |
| Purchased audio assets (SFX + music) | ~$45-75 |
| Free assets (fonts, CC0 sounds, SF Symbols) | $0 |
| Code-generated assets (procedural) | $0 |
| **Total visual + audio asset budget** | **~$77-117** |
| **Budget available** | **~$100** |

Budget is tight but achievable. Prioritize: (1) card art quality, (2) battle music, (3) card game SFX. Everything else can use free alternatives or code generation.

---

## 4. App Background Art Prompts

All background prompts use the style anchor and LoRA. Backgrounds are generated at landscape orientation (2796x1290) or portrait (1290x2796) depending on screen orientation, then cropped/scaled in the app. All include heavy depth-of-field blur in the mid/background to avoid competing with foreground UI elements.

### 4.1 Global Style Prefix for Backgrounds

```
BG_STYLE_PREFIX = "palette knife oil painting, heavy impasto brushstrokes visible, traditional media on canvas, muted earth tones with vivid accent colors, atmospheric perspective, deep depth of field blur, no text no borders no watermarks, painted in the style of Gustave Dore and N.C. Wyeth, wide establishing shot"
```

### 4.2 Home Screen

**Faction-Neutral Version (default):**
```
{BG_STYLE_PREFIX}, a vast fractured landscape where the Plane of Order meets the Plane of Chaos, crystalline geometric structures on the left gradually crumbling into swirling chaotic energy on the right, a massive rift in the sky revealing cosmic void above, chaos motes drifting like fireflies through the scene, muted golds and deep purples and midnight blues, epic scale, contemplative mood, painted like a John Martin apocalyptic landscape
```

**Faction-Adaptive Versions** (shown when player has active deck):

**Ironwright:**
```
{BG_STYLE_PREFIX}, a vast orbital shipyard seen from a command bridge viewport, massive iron hulls under construction with welding sparks like stars, rebar scaffolding stretching to infinity, reactor glow illuminating concrete bulkheads, cold steel blue-gray and warning orange accents, industrial grandeur, painted like a Piranesi prison imagined in space, void of stars visible through gaps in the superstructure
```

**Fey Courts:**
```
{BG_STYLE_PREFIX}, the interior of an impossibly vast hollow tree, spiral staircases of living wood ascending into darkness, bioluminescent mushrooms casting soft teal and gold light, roots thick as rivers weaving through the space, a single shaft of moonlight descending from an opening far above, emerald green and gold and deep teal, painted like an Arthur Rackham fairy tale illustration, enchanted and ancient
```

**Demonic Kingdoms:**
```
{BG_STYLE_PREFIX}, a volcanic throne room viewed from the foot of obsidian stairs, lava channels carved into the floor casting hellfire glow upward, bone pillars supporting a vaulted ceiling of fused skulls, a distant throne silhouetted against a wall of flame, burnt crimson and charcoal black and sulfur yellow, oppressive heat shimmer, painted like a Hieronymus Bosch vision of the infernal court
```

**Celestial Crusade:**
```
{BG_STYLE_PREFIX}, a cathedral of light floating in golden clouds, massive arched windows pouring divine radiance inward, marble columns carved with angelic figures, a central altar radiating concentric rings of holy light, the floor reflecting like still water, divine ivory and holy gold and celestial rose, transcendent and overwhelming, painted like a Gustave Dore illustration of Paradise
```

**The Endless:**
```
{BG_STYLE_PREFIX}, a necropolis stretching to the horizon under a sick green-black sky, mausoleums and crypts in various states of decay, spectral energy drifting between tombstones like luminous fog, a massive lich tower in the distant center radiating necrotic purple light, bone white and ghostly teal and necrotic purple, oppressive silence made visible, painted like a Francisco Goya Black Painting given depth and architecture
```

### 4.3 Collection Screen

```
{BG_STYLE_PREFIX}, an ancient library or archive interior, towering shelves of leather-bound tomes and card cases stretching into darkness, warm amber candlelight from scattered brass fixtures, a central reading table with cards spread across it catching the light, dust motes drifting in light shafts, mahogany brown and amber gold and deep shadow, scholarly and reverent, every surface textured with age and use
```

### 4.4 Deck Builder Screen

```
{BG_STYLE_PREFIX}, a war room table seen from slightly above, covered in tactical maps and scattered cards and glowing crystal markers, candles and lanterns providing warm focused light, the edges of the scene falling into shadow, implements of strategy visible (compass, quill, wax seals), warm amber and parchment cream and deep wood brown, focused and strategic, a general planning their campaign
```

### 4.5 Shop / Store Screen

```
{BG_STYLE_PREFIX}, a mysterious merchant's tent interior, shelves and display cases filled with glowing artifacts and sealed card cases, fabric draping from above in rich jewel tones, a central counter with scattered chaos motes and planar shards catching candlelight, the tent flaps revealing a starfield beyond, rich burgundy and gold and deep purple and candlelight amber, enticing and opulent, the feeling of discovering rare treasures
```

### 4.6 Settings / Profile Screen

```
{BG_STYLE_PREFIX}, a quiet chamber with stone walls and a single arched window showing a distant landscape, simple furnishings, a desk with personal effects, soft diffused light, understated and calm, deep shadow and muted earth tones, a private space away from the chaos of war, minimal and contemplative
```

### 4.7 Evolution Ceremony Background

```
{BG_STYLE_PREFIX}, a Planar Shard floating in the center of a vortex of chaos energy, crystalline fractures radiating outward with light pouring through the cracks, swirling motes of gold and purple converging on the shard, the ground below cracked and glowing with planar energy, deep cosmic purple and crackling gold and white-hot energy at the center, the moment before transformation, overwhelming power barely contained
```

### 4.8 Match Result -- Victory

```
{BG_STYLE_PREFIX}, triumphant golden light breaking through storm clouds, battlefield wreckage below bathed in warm radiance, a single figure or banner silhouetted against the light, scattered chaos motes settling like embers, warm gold and amber and deep shadow contrast, glory and earned triumph, the storm has passed
```

### 4.9 Match Result -- Defeat

```
{BG_STYLE_PREFIX}, a battlefield at dusk, scattered remnants of battle in fading light, embers and ash drifting slowly, the sky darkening from deep orange to black, a broken banner or fallen weapon in the foreground, muted orange and ash gray and deepening shadow, somber but dignified, loss without despair, the sun sets but will rise again
```

### 4.10 Loading Screen Backgrounds (Rotating Set of 8)

Each loading screen depicts a different lore-significant location or event, providing visual worldbuilding during brief load times.

**1. The Great Fracture:**
```
{BG_STYLE_PREFIX}, a cosmic event viewed from a distance, the sky tearing open along a massive jagged rift, Order (geometric, crystalline, blue-white) on one side and Chaos (organic, swirling, purple-red) on the other, the land below buckling and splitting, figures tiny against the scale of the event, epic catastrophe, painted like John Martin's The Great Day of His Wrath
```

**2. The Ancient Ruin Discovery:**
```
{BG_STYLE_PREFIX}, explorers with lanterns entering a vast underground chamber, a partially buried ruin of impossible architecture glowing with faint crystalline light, the explorers dwarfed by the structure, pale otherworldly colors contrasting with the warm lantern light, mystery and awe, the first discovery of the Planar Ruins
```

**3. Ironwright Void-Forge:**
```
{BG_STYLE_PREFIX}, a massive orbital factory seen from space, the structure wrapping around a dying star being harvested for energy, industrial spires and docking arms extending in all directions, reactor glow and welding sparks visible even at this scale, steel blue-gray and reactor blue and warning orange, Piranesi architecture at cosmic scale, the machine empire's beating heart
```

**4. The Hollow Court (Fey):**
```
{BG_STYLE_PREFIX}, a frozen throne room in a dead forest, bare bone-white trees forming a natural cathedral, a throne of ice and thorns at the center, the Hollow Court in winter, a single figure barely visible on the throne, frost and moonlight and deep shadow, Arthur Rackham's darkest fairy tale, beauty in desolation
```

**5. The Furnace Lords' Domain (Demonic):**
```
{BG_STYLE_PREFIX}, the interior of a volcanic caldera repurposed as a war fortress, lava rivers channeled into forges and weapon foundries, demonic architects overseeing construction of siege engines from bone and obsidian, hellfire light from below casting everything in deep red and black, Bosch's hell given industrial purpose
```

**6. The Celestial March:**
```
{BG_STYLE_PREFIX}, an army of armored celestial beings marching across a bridge of light spanning an abyss, their golden armor reflecting divine radiance, massive angelic figures flying in formation above the column, clouds parting before their advance, holy gold and divine ivory and righteous blue, painted like Gustave Dore's Crusade illustrations, overwhelming holy military might
```

**7. The Necromantic Cabal:**
```
{BG_STYLE_PREFIX}, a circle of robed liches performing a massive ritual in a bone-encrusted cathedral, spectral energy spiraling upward from the ritual circle, the undead rising from graves visible through gaps in the floor, necrotic purple and bone white and ghostly teal, Francisco Goya's witches' sabbath reimagined as necromantic industry
```

**8. The Plane of Chaos:**
```
{BG_STYLE_PREFIX}, a landscape where physics has collapsed, floating islands of rock and crystal tumbling through prismatic void, rivers flowing upward, trees growing sideways, creatures half-transformed by chaos energy, every surface crackling with motes of chaotic power, deep purple and crackling gold and impossible colors, the raw Plane of Chaos before the Fracture stabilized, alien and beautiful and terrifying
```

### 4.11 Onboarding Faction Slides (5)

Each slide introduces a faction with its key visual identity, shown during the faction selection flow.

**Ironwright Collective:**
```
{BG_STYLE_PREFIX}, a commanding view of a brutalist orbital shipyard, massive concrete-and-iron warships docked at industrial piers, cranes and scaffolding filling the frame, void of space visible through industrial windows, a Foundry Directorate officer in heavy armor inspecting blueprints in the foreground, steel blue-gray and cold iron and reactor blue, Piranesi and John Martin, industrial empire at the height of its power
```

**Fey Courts:**
```
{BG_STYLE_PREFIX}, the Verdant Throne court in full bloom, a clearing in an ancient forest where the trees have grown into a natural palace, flowers exploding from every surface, a fey lord on a throne of living wood and crystal, bioluminescent creatures hovering like attendants, emerald and gold and teal, Arthur Rackham and Edmund Dulac, the beauty and danger of the wild
```

**Demonic Kingdoms:**
```
{BG_STYLE_PREFIX}, the Obsidian Bureaucracy's soul exchange trading floor, towering filing cabinets of damned contracts, demonic brokers haggling over soul-jars at obsidian counters, hellfire braziers providing harsh light, a Furnace Lord overseeing from a raised volcanic throne, burnt crimson and charcoal and sulfur, Hieronymus Bosch, hell as organized commerce and unrestrained ambition
```

**Celestial Crusade:**
```
{BG_STYLE_PREFIX}, the Knights of Deliverance marshaling for holy war, armored paladins in formation before a cathedral of golden light, divine banners catching wind, biblically-accurate multi-winged celestial beings hovering above blessing the troops, the sky cracked open revealing Heaven beyond, holy gold and divine ivory and righteous blue, Gustave Dore and William Blake, righteous certainty and overwhelming divine power
```

**The Endless:**
```
{BG_STYLE_PREFIX}, a Necromantic Cabal lich standing atop a tower overlooking a vast army of the risen dead, bone constructs and spectral warriors stretching to the horizon, ghostly mist flowing between the ranks, the lich's phylactery glowing with necrotic energy, a Lost Spectre drifting past the tower weeping translucent tears, necrotic purple and bone white and sickly green, Gustave Dore's Inferno and Goya's Black Paintings, death as industry and inevitability
```

---

## 5. Planar Ruins Art Direction

### 5.1 Neutral Ruins Aesthetic

Neutral Planar Ruins are the remnants of an ancient civilization that predates all five factions. They are mysterious, beautiful, and alien. They should look like nothing the factions have built -- a wholly different architectural tradition.

**Core Visual Principles:**
- **Materials**: Pale stone (not granite or marble -- something otherworldly, like petrified light), crystalline veins running through the structure, metallic elements of unknown alloy (not gold, not iron -- something in between, like electrum or orichalcum)
- **Architecture**: Non-Euclidean geometry (subtle, not surreal). Arches that curve in unexpected ways. Columns with slight spiral forms. Surfaces covered in geometric patterns that suggest mathematical meaning
- **Color palette**: Pale blue-white stone, warm amber crystalline veins, soft silver metallic accents, background of neutral earth tones. The ruins themselves provide the only bright colors in the scene.
- **Condition**: Partially ruined but structurally stable. Some sections collapsed, others pristine. The intact sections glow faintly with residual energy. Vegetation growing in the ruins (moss, lichen, small plants) but not overtaking them.
- **Scale**: Medium-large. Each ruin is the size of a small building or large monument. Large enough to provide shelter, small enough to fit on a battlefield.
- **Lighting**: Self-illuminated from within (crystalline veins glow), supplemented by ambient environmental lighting. The glow suggests the ruin is still active, still containing energy.
- **Mood**: Awe, mystery, melancholy. These are beautiful things from a lost world. They stabilize chaos energy, creating pockets of calm in a fractured plane.

**Neutral Ruin Style Anchor (prepended to all neutral ruin prompts):**
```
RUIN_NEUTRAL_PREFIX = "palette knife oil painting, heavy impasto brushstrokes, an ancient ruin of pale crystalline-veined stone, non-human architecture with subtle non-Euclidean geometry, partially collapsed but structurally stable, faint warm amber glow emanating from intact crystalline veins, unknown metallic accents, moss and lichen growing in cracks, a sense of deep age and alien beauty, mysterious and melancholy, painted in the style of Gustave Dore and N.C. Wyeth, portrait composition"
```

### 5.2 Eight Neutral Ruin Archetypes

Each archetype is a distinct structure with a different visual identity and implied purpose.

**1. The Stabilization Spire**
```
{RUIN_NEUTRAL_PREFIX}, a tall narrow spire of pale stone rising from a fractured base, the top section still intact with crystalline energy pulsing upward in a visible beam, the base surrounded by fallen stone blocks arranged in concentric circles, energy patterns on the surface suggesting it was built to project stability into surrounding space, vertical emphasis, sense of a lighthouse or beacon
```

**2. The Resonance Well**
```
{RUIN_NEUTRAL_PREFIX}, a circular well or pool structure with stepped sides descending into a glowing center, crystalline water (or energy that looks like water) filling the basin and reflecting impossible colors, stone benches arranged around the rim suggesting a gathering place, the well rim carved with geometric patterns that pulse with the glow, sense of a font or ritual pool
```

**3. The Archive Gate**
```
{RUIN_NEUTRAL_PREFIX}, a massive freestanding archway with no wall around it, the space within the arch shimmering with contained energy, the arch itself covered in dense geometric carvings that may be text or mathematical notation, broken stone tablets scattered at the base, the sense of a portal or gateway that once connected to something, imposing and scholarly
```

**4. The Harmonic Pillars**
```
{RUIN_NEUTRAL_PREFIX}, a colonnade of seven pillars arranged in a semicircle, each pillar a different height and thickness, the tops of intact pillars humming with visible vibration (motion blur), crystalline caps on each pillar glowing in sequence, the ground between them unnaturally smooth and reflective, the sense of a musical instrument or tuning mechanism built at architectural scale
```

**5. The Temporal Anchor**
```
{RUIN_NEUTRAL_PREFIX}, a low squat structure like a bunker or vault, heavy stone walls with crystalline reinforcement, a single doorway revealing an interior lit with steady golden light, the exterior weathered and ancient but the interior visible through the door appears impossibly pristine, a time distortion effect at the threshold (subtle visual warping), the sense of something preserved against all entropy
```

**6. The Mote Collector**
```
{RUIN_NEUTRAL_PREFIX}, an open-topped structure like a stone bowl or amphitheater, the interior surface covered in crystalline filaments that reach upward like frozen grass, chaos motes drifting toward the structure and being captured by the filaments, the collected energy pooling at the center as visible light, the sense of a net or trap designed to harvest ambient chaos energy, glowing from within
```

**7. The Planar Lens**
```
{RUIN_NEUTRAL_PREFIX}, a structure built around a massive crystalline disc (the lens) mounted vertically in a stone frame, the disc refracting light into prismatic patterns on surrounding surfaces, the frame partially collapsed on one side but the lens intact and still functioning, energy patterns suggesting it was used to focus or redirect planar forces, rainbow refractions and deep shadow
```

**8. The Warden's Bastion**
```
{RUIN_NEUTRAL_PREFIX}, a fortified structure with thick walls and narrow observation slits, defensive architecture clearly designed to protect something inside, the roof partially collapsed revealing crystalline machinery within, guardian statues (broken) flanking the entrance, the sense of a military installation from a civilization that fought wars with energy and geometry rather than steel and fire
```

### 5.3 Faction-Evolved Ruin Transformations

When a neutral ruin is evolved into a faction-specific variant, the base architecture remains recognizable but is visually transformed by the faction's aesthetic. The ruin becomes a hybrid -- ancient alien structure adapted and claimed by the faction.

**Faction Transformation Style Anchors:**

**Ironwright Evolution:**
```
RUIN_IRONWRIGHT_SUFFIX = "the ancient ruin has been retrofitted with brutalist industrial additions, rebar reinforcement bolted into the pale stone, concrete patches over cracks, hydraulic pistons bracing weakened sections, reactor-powered conduits running along the exterior feeding into the crystalline systems, warning orange hazard markings, industrial plating covering some of the ancient carvings, the glow now tinged with reactor blue, the ancient beauty partially obscured by functional industrial pragmatism"
```

**Fey Courts Evolution:**
```
RUIN_FEY_SUFFIX = "the ancient ruin has been claimed by living nature, roots and vines growing through and around the stone in symbiotic embrace, bioluminescent moss covering surfaces and adding green-gold glow to the original amber, flowers blooming from cracks, the crystalline veins now pulsing in harmony with the surrounding forest's rhythms, a sense that the forest is nurturing and protecting the ruin rather than consuming it, Arthur Rackham's trees embracing ancient stone"
```

**Demonic Kingdoms Evolution:**
```
RUIN_DEMONIC_SUFFIX = "the ancient ruin has been corrupted by infernal energy, obsidian growths erupting from the pale stone like tumors, blood-red runes carved over the original geometric patterns, chains wrapped around structural elements, hellfire replacing the original amber glow with angry crimson light, the crystalline veins cracked and leaking dark energy, a sense of violation and repurposing, the ancient structure suffering under demonic occupation"
```

**Celestial Crusade Evolution:**
```
RUIN_CELESTIAL_SUFFIX = "the ancient ruin has been purified and consecrated by divine power, golden light flooding the structure from within, angelic inscriptions carved alongside the original geometric patterns, small statues of celestial figures placed at key points, the crystalline veins now blazing with holy radiance, white marble additions smoothly integrated with the pale stone, a sense of claiming and sanctifying, the Celestial Crusade declaring this place holy and theirs by divine right"
```

**The Endless Evolution:**
```
RUIN_ENDLESS_SUFFIX = "the ancient ruin has been haunted by undead energy, spectral mist flowing from every opening, bone additions and necromantic symbols bolted or grown onto the stone, the crystalline veins now pulsing with ghostly teal and necrotic purple, shadows moving independently of any light source, frost forming on surfaces near the strongest spectral concentrations, a sense that the ruin is no longer empty -- it is full of the dead, Goya's nightmares given architecture"
```

### 5.4 Example Evolved Ruin Prompt (Complete)

**Stabilization Spire -- Fey Courts Evolved:**
```
palette knife oil painting, heavy impasto brushstrokes, an ancient ruin of pale crystalline-veined stone, non-human architecture with subtle non-Euclidean geometry, partially collapsed but structurally stable, faint warm amber glow emanating from intact crystalline veins, unknown metallic accents, painted in the style of Gustave Dore and N.C. Wyeth, portrait composition,

a tall narrow spire of pale stone rising from a living forest floor, the top section still intact with crystalline energy pulsing upward, the base surrounded by massive roots that have grown around the fallen stone blocks in protective embrace,

the ancient ruin has been claimed by living nature, roots and vines growing through and around the stone in symbiotic embrace, bioluminescent moss covering surfaces and adding green-gold glow to the original amber, flowers blooming from cracks, the crystalline veins now pulsing in harmony with the surrounding forest's rhythms, Arthur Rackham's trees embracing ancient stone,

in a moonlit glade where bioluminescent mushrooms cast soft blue-green light on the ancient structure
```

**Archive Gate -- Ironwright Evolved:**
```
palette knife oil painting, heavy impasto brushstrokes, an ancient ruin of pale crystalline-veined stone, non-human architecture with subtle non-Euclidean geometry, partially collapsed but structurally stable, painted in the style of Gustave Dore and N.C. Wyeth, portrait composition,

a massive freestanding archway reinforced with industrial scaffolding, the shimmering energy within the arch now contained by reactor-powered field generators bolted to the frame, broken stone tablets stacked and catalogued in iron crates,

the ancient ruin has been retrofitted with brutalist industrial additions, rebar reinforcement bolted into the pale stone, concrete patches over cracks, hydraulic pistons bracing the arch, reactor-powered conduits running along the exterior feeding into the crystalline systems, warning orange hazard markings, the glow now tinged with reactor blue,

inside a vast orbital construction bay, the gate structure clamped to a rotating industrial platform, void of space visible through gaps in the station hull
```

---

## 6. Season 1 Visual Identity

### 6.1 Season Theme: "The First Fracture"

Season 1 tells the story of the Great Fracture -- the moment the barrier between the Plane of Order and the Plane of Chaos shattered, releasing chaos motes into the world and triggering the faction wars. This is the origin story of everything players know.

### 6.2 Seasonal Color Palette Overlay

The Season 1 palette is added as a subtle overlay/accent to the base faction palettes. It does not replace faction colors; it tints the world.

| Element | Color | Hex | Usage |
|---|---|---|---|
| Season primary | Fracture Gold | #C4A030 | Season pass progress bar, seasonal reward borders, XP text |
| Season secondary | Rift Purple | #6B3FA0 | Seasonal event banners, chaos rift visual effects |
| Season accent | Planar Silver | #B0B8C8 | Seasonal quest icons, milestone markers |
| Season dark | Void Black | #0A0A12 | Seasonal screen backgrounds, card back seasonal edition |

### 6.3 Seasonal UI Accents

- **Season pass progress bar**: Fracture Gold fill on Void Black track, with subtle energy particles at the fill edge
- **Seasonal quest markers**: Planar Silver icon with Rift Purple glow ring
- **Milestone reward frames**: Fracture Gold border with animated energy cracks (SKAction)
- **Battle pass card back**: Void Black base with Fracture Gold geometric crack patterns and a central Rift Purple chaos mote

### 6.4 Battle Pass / Seasonal Reward Visual Style

| Tier | Visual Treatment | Description |
|---|---|---|
| Free tier rewards | Planar Silver border | Clean, understated, accessible |
| Premium tier rewards | Fracture Gold border with energy particles | Premium feel, animated shimmer |
| Milestone rewards (every 10 levels) | Full art card-style frame with Rift Purple + Fracture Gold | Dramatic, collectible, screenshot-worthy |

### 6.5 Seasonal Card Back (Battle Pass Reward)

```
{BG_STYLE_PREFIX}, a card back design showing the moment of the Great Fracture, a central point of blinding white-gold light with geometric cracks radiating outward through void black, each crack leaking different faction-colored energy (steel blue, emerald, crimson, holy gold, necrotic purple), the edges of the card framed with ancient geometric patterns from the Planar Ruin civilization, a single chaos mote hovering at the center of the fracture point, Fracture Gold and Rift Purple and Void Black, dramatic and collectible
```

### 6.6 Season Narrative Arc (Lore Beats for Loading Screens)

The 8 loading screen backgrounds in Section 4.10 are ordered to tell the Season 1 story:
1. The Great Fracture (cosmic event)
2. The Ancient Ruin Discovery (aftermath exploration)
3-7. Each faction's response to the Fracture (Ironwright industrialization, Fey retreat, Demonic exploitation, Celestial crusade, Endless rising)
8. The Plane of Chaos (what lies beyond the rifts)

---

## 7. Asset Purchase Research & Recommendations

### 7.1 Budget Allocation

| Category | Budget | Priority |
|---|---|---|
| Battle music (5 faction themes + ambient) | $25-30 | HIGH -- music defines the atmosphere of every match |
| Card game SFX (attack, damage, death, draw, card play) | $0-15 | HIGH -- core gameplay feel |
| UI sounds (clicks, transitions, popups) | $0-12 | MEDIUM -- polish, not critical |
| Particle textures | $0-5 | LOW -- can generate in code |
| Environmental ambience | $0 | LOW -- Freesound CC0 or Suno free tier |
| **Buffer** | $15-30 | Safety margin |
| **Total** | **$55-92** | |

### 7.2 Battle Music Recommendations

#### PRIMARY RECOMMENDATION: "10 RPG Battle Themes (+loops)" by BLACKMID

- **URL**: https://blackmid.itch.io/10-rpg-battle-themes-loops
- **Price**: $15.00 USD (minimum)
- **Content**: 10 orchestral battle themes with looped + non-looped versions (20 files total). Dark fantasy, heroic, dramatic, epic, medieval styles.
- **Format**: WAV 16-bit 44.1kHz
- **License**: Unlimited royalty-free. YouTube-safe. No attribution required. Commercial use OK.
- **Quality Assessment**: STRONG. Orchestral quality matches a premium card game. 10 themes provide enough variety for 5 factions with the adaptive mixing system (use different tracks as faction layers). Looped versions are critical for seamless battle music.
- **Covers**: Foundation battle music for all factions. At $15, this is the highest-priority purchase.

#### SECONDARY RECOMMENDATION: "Epic Battle Music Pack Vol. 1" by OhmAudioStudios

- **URL**: https://ohmaudiostudios.itch.io/epic-battle-music-pack-vol-1
- **Price**: $15.00 USD (minimum)
- **Content**: 14 full-length dark orchestral tracks + 14 seamless loops + 3 bonus combat loops (31 files total, 975 MB).
- **Format**: WAV 44.1kHz 16-bit PCM Stereo
- **License**: Royalty-free. Commercial + non-commercial use. Cannot redistribute as standalone music library.
- **Quality Assessment**: STRONG. Larger library than BLACKMID. Dark orchestral style fits Demonic and Endless factions particularly well. Seamless loops ready for AVAudioEngine integration.
- **Covers**: Battle music + additional faction-specific layers.

#### ALTERNATIVE: "Dark Orchestra: Dark Fantasy" by Cyberleaf Studio

- **URL**: https://cyberleaf.itch.io/dark-orchestra-dark-fantasy
- **Price**: $28.00 USD
- **Content**: 38 tracks (12 full-length, 10 short, 11 loops, 2 stingers). 42 minutes original, 63 minutes total. WAV and OGG.
- **License**: Unrestricted commercial/non-commercial use. Not registered for content ID. No attribution.
- **Quality Assessment**: EXCELLENT. Most comprehensive pack. Includes stingers (usable as SFX -- chaos roll result, event triggers, evolution reveal). Loops + full tracks + stingers cover the entire audio design needs for battle.
- **Covers**: Battle music + menu themes + stingers for SFX moments.
- **Tradeoff**: At $28, uses most of the music budget. Quality justifies the cost if budget allows.

#### FREE ALTERNATIVE: "Free Dark Fantasy Boss Battle Music Pack Vol. 2" by alkakrab

- **URL**: https://alkakrab.itch.io/fantasy-boss-battle-music-pack-vol-2
- **Price**: Free
- **Content**: 8 dark fantasy boss battle tracks with loops
- **License**: Check pack -- likely royalty-free for commercial use
- **Quality Assessment**: DECENT. Free option if budget is extremely tight. Fewer tracks means less faction variety.

**RECOMMENDATION**: Purchase BLACKMID ($15) as primary battle music. If quality is insufficient after testing, upgrade to Cyberleaf ($28) or add OhmAudio ($15) for additional variety. Total music spend: $15-30.

### 7.3 Card Game SFX Recommendations

#### PRIMARY RECOMMENDATION: "Fantasy Card Game SFX Pack" by olexmazur

- **URL**: https://olexmazur.itch.io/fantasy-card-game
- **Price**: Name your own price (free download available, suggest $5-10 donation)
- **Content**: 80+ high-quality sound effects designed specifically for fantasy card games.
- **Format**: ZIP (44 MB)
- **License**: Not explicitly stated -- contact creator or check included license file. Name-your-price suggests permissive.
- **Quality Assessment**: STRONG. Purpose-built for card games. 80+ effects covers card play, draw, shuffle, and likely attack/damage/death.
- **Covers**: Core card gameplay SFX (card play, draw, shuffle, flip).
- **Risk**: License unclear. Download and verify before commercial use.

#### SECONDARY RECOMMENDATION: "Free Fantasy 200 SFX Pack" by TomMusic

- **URL**: https://tommusic.itch.io/free-fantasy-200-sfx-pack
- **Price**: Free
- **Content**: 200+ fantasy sound effects
- **License**: Likely free for commercial use (verify in pack)
- **Quality Assessment**: GOOD. Large library means high chance of finding card game, combat, and magic SFX. May require more curation than a purpose-built pack.
- **Covers**: Combat SFX, magic effects, ambient sounds, environmental effects.

#### FREE BASELINE: Freesound.org CC0

- **URL**: https://freesound.org (search by tag + CC0 license filter)
- **Price**: Free
- **License**: CC0 (public domain, no attribution required)
- **Search terms per SFX** (from existing AUDIO-SOURCING-GUIDE.md):
  - Card play: `whoosh card`, `swoosh paper`
  - Attack: `sword hit`, `melee hit`
  - Damage: `damage crunch`, `hit impact`
  - Death: `glass shatter`, `crystal break`
  - Heal: `heal chime`, `magic sparkle`
  - D20 roll: `dice roll`, `dice shake`
- **Quality Assessment**: VARIABLE. Individual sounds range from amateur to professional. Requires curation time.
- **Covers**: Any gaps left by purchased packs.

**RECOMMENDATION**: Download olexmazur pack (free/$5) as primary SFX source. Supplement with TomMusic 200 SFX (free) for combat and magic effects. Fill remaining gaps with Freesound.org CC0 individual downloads. Total SFX spend: $0-10.

### 7.4 UI Sound Effects Recommendations

#### PRIMARY RECOMMENDATION: "Pack of 100 Royalty-Free UI Sounds" by 3rdEchoSounds

- **URL**: https://3rdechosounds.itch.io/pack-of-100-royalty-free-ui-sounds
- **Price**: $12.00 USD
- **Content**: 100 royalty-free UI sounds. High-quality WAV (24-bit/44.1kHz).
- **License**: Royalty-free. Unlimited projects. Commercial and personal. Perpetual.
- **Quality Assessment**: STRONG. 100 sounds at $12 is good value. 24-bit WAV is professional quality. Covers buttons, transitions, alerts, confirmations.
- **Covers**: All UI SFX needs (button taps, tab switches, card flips, notifications, errors, level-ups).

#### FREE ALTERNATIVE: "Ultimate UI SFX Pack" by JDSherbert

- **URL**: https://jdsherbert.itch.io/ultimate-ui-sfx-pack
- **Price**: Free (full version ~$6.50 USD)
- **Content**: 67 unique sounds (670 files across formats). WAV HD + SD, MP3, M4A, OGG. Stereo + Mono.
- **License**: Requires credit attribution. No redistribution. Royalty-free otherwise.
- **Quality Assessment**: GOOD. Multiple format options. Attribution requirement is minor (add to credits screen).
- **Covers**: Core UI sounds with good variety.

**RECOMMENDATION**: Purchase 3rdEchoSounds ($12) for clean, no-attribution UI sounds. Or use JDSherbert (free/$6.50) if budget is tight, adding attribution to the credits screen. Total UI spend: $0-12.

### 7.5 Particle Textures

#### PRIMARY RECOMMENDATION: OpenGameArt.org CC0 Collections

- **URL**: https://opengameart.org/content/particle-pack-80-sprites
- **Price**: Free
- **Content**: 80+ particle sprites (fire, smoke, magic, sparks, electricity)
- **License**: CC0 (public domain)
- **Quality Assessment**: ADEQUATE. These are base textures that will be tinted and processed in SpriteKit particle emitters. Exact art style is less critical for particles than for cards or backgrounds.
- **Covers**: Fire, smoke, sparks, magic particles as base textures for SpriteKit.

#### SECONDARY: "Particle FX" by RagnaPixel

- **URL**: https://ragnapixel.itch.io/particle-fx
- **Price**: $3.99 USD
- **Content**: 73 effects including fire, poison cloud, electric, sparks, water, smoke. GIF + PNG frames + spritesheets.
- **License**: CC-BY 4.0 (attribution required: credit Raphael Hatencia)
- **Quality Assessment**: GOOD. More polished than free alternatives. Spritesheets ready for SpriteKit integration.
- **Covers**: Most VFX base texture needs.

**RECOMMENDATION**: Start with OpenGameArt CC0 (free). If quality is insufficient for key effects (divine radiance, spectral mist, corruption flame), purchase RagnaPixel ($3.99). Most particle effects will be code-generated in SpriteKit with these textures as seeds. Total particle spend: $0-4.

### 7.6 Environmental Ambience

#### PRIMARY RECOMMENDATION: Sonniss GDC Game Audio Bundle

- **URL**: https://sonniss.com/gameaudiogdc/
- **Price**: Free
- **Content**: 200+ GB of royalty-free game audio from annual GDC bundles (2015-2024). Includes ambient, environmental, impact, and cinematic sounds.
- **License**: Royalty-free. Commercial use. No attribution required. Unlimited projects. Perpetual.
- **Quality Assessment**: EXCELLENT. Professional studio quality. The single best free resource for game audio. Massive library requires curation time but contains virtually any ambient sound needed.
- **Covers**: All environmental ambience, atmospheric backgrounds, subtle atmospheric layers.

#### SECONDARY: Freesound.org CC0

- **URL**: https://freesound.org
- **Price**: Free
- **License**: Filter for CC0 only
- **Covers**: Specific ambient sounds (wind, fire crackle, water, forest ambience) for faction-specific battle backgrounds.

**RECOMMENDATION**: Download Sonniss GDC bundles (free, ~27 GB per year). Extract needed ambient sounds. Supplement with Freesound.org CC0 for specific faction-themed ambience. Total ambience spend: $0.

### 7.7 Music Generation (Non-Purchased)

For tracks not covered by purchased packs (menu theme, evolution ceremony, shop ambient):

- **Suno.ai free tier**: Generate 2-3 tracks per month. Use for menu theme, shop ambient, and evolution ceremony music.
- **Process**: Generate in Suno -> export WAV -> trim loops in Audacity (free) -> convert to CAF via `afconvert` (built-in macOS).
- **Cost**: $0

### 7.8 Complete Purchase Plan

| Priority | Item | Source | Price | Status |
|---|---|---|---|---|
| 1 | Battle music (10 themes + loops) | BLACKMID @ itch.io | $15.00 | TO BUY |
| 2 | UI sounds (100 pack) | 3rdEchoSounds @ itch.io | $12.00 | TO BUY |
| 3 | Fantasy card SFX (80+ pack) | olexmazur @ itch.io | $5.00 (donation) | TO BUY |
| 4 | Fantasy SFX (200 pack) | TomMusic @ itch.io | $0 (free) | TO DOWNLOAD |
| 5 | Particle textures (80 sprites) | OpenGameArt.org | $0 (free) | TO DOWNLOAD |
| 6 | Ambient sounds | Sonniss GDC Bundle | $0 (free) | TO DOWNLOAD |
| 7 | Ambient fills | Freesound.org CC0 | $0 (free) | TO DOWNLOAD |
| 8 | Menu/evolution/shop music | Suno.ai free tier | $0 (free) | TO GENERATE |
| -- | **TOTAL COMMITTED** | | **$32.00** | |
| -- | **BUFFER REMAINING** | | **$68.00** | For upgrades if quality insufficient |

**Upgrade path if primary picks are insufficient:**
- Battle music upgrade: Cyberleaf Dark Orchestra ($28) or OhmAudio Epic Battle ($15)
- Card SFX upgrade: VisionaryEight Card Game Sound Effects ($45 -- eats most of buffer, only if free packs are unusable)
- Particle upgrade: RagnaPixel Particle FX ($3.99)

---

## 8. Updated Faction Art Bible: Celestial Crusade

### The Celestial Crusade

*Divine Wrath * Holy War * Formation * Radiance * Superiority * Judgment*

The Celestial Crusade believes reality belongs to the divine. All non-celestial beings are lesser -- tolerable at best, obstacles at worst. They wage holy war not out of malice but out of absolute certainty that their dominion is the natural order. They are the most dangerous faction because they believe they are righteous.

---

### Sub-Factions

#### Knights of Deliverance (Military Arm)

**Visual Identity**: Disciplined, austere, armored in divine metal. The Knights are soldiers first -- their holiness is expressed through martial perfection, not ecstatic visions. Think Templar Knights painted by Gustave Dore: stoic, massive, unyielding. Their armor is not ornate but functional, with divine symbols etched in gold on steel-white surfaces. Formation discipline is visible in every image -- even a single Knight suggests rank and file behind them.

**Character Archetypes**:
- **Paladin Commander**: Heavy plate armor of divine white metal, golden etchings, closed helm with narrow eye slit, commanding pose, holding a banner or signal weapon. Authority incarnate.
- **Shield Bearer**: Massive tower shields bearing the Celestial emblem, crouched in defensive formation, face hidden behind shield rim. The wall that does not break.
- **Divine Lancer**: Mounted on an armored celestial steed (not a horse -- something with multiple wings folded, extra eyes along the neck), lance couched, charging pose. Holy cavalry.
- **Battle Priest**: Lighter armor under vestments, one hand raised in blessing/ward, the other gripping a mace. The spiritual anchor of a unit.
- **Siege Engineer**: Operating a divine artillery piece (a golden trebuchet that fires concentrated light). Methodical, professional. Holy war is logistics too.
- **Squire / Initiate**: Young, unarmored or lightly armored, carrying a Knight's equipment. The next generation. Not yet touched by battle.

**Environments**:
- A vast parade ground before a cathedral-fortress, thousands of Knights in formation
- A breached city wall, Knights pouring through with divine light behind them
- A command tent with maps and holy texts side by side on a campaign table
- A forge-chapel where armor is blessed as it is made
- A mountain pass held by a small unit, shields locked, divine banners catching wind
- The deck of a celestial war-barge (floating ship of golden wood and divine metal)
- A captured ruin being consecrated, Knights kneeling in prayer around a central altar
- A field hospital where injured Knights are healed by divine light, not medicine

**Moods & Palettes**:
- Martial glory: Golden hour, divine light breaking through clouds, holy gold/steel white/righteous blue/blood-shadow
- Grim duty: Overcast, pre-battle, muted ivory/cold steel/dark earth/distant golden light
- Absolute conviction: Harsh divine light from above, no shadow to hide in, blinding gold/pure white/nothing else
- The cost of crusade: Battlefield aftermath, golden light on fallen bodies, somber gold/rust/dried blood/ash

#### Heaven's Chosen (Divine Arm)

**Visual Identity**: Biblically accurate celestials. These are NOT pretty angels with feathered wings and halos. They are multi-winged, multi-eyed, geometrically impossible beings of living light and divine substance. Wheels within wheels. Faces that are all faces at once. Wings covered in eyes that all see. They are terrifying and beautiful in equal measure. William Blake's visionary paintings are the primary reference -- ecstatic, overwhelming, muscular divine forms that transcend human anatomy.

**Character Archetypes**:
- **Seraphim**: Six-winged beings of living flame, two wings covering their face, two covering their feet, two for flight. The highest choir. Their presence burns mortals.
- **Ophanim**: Wheels within wheels, covered in eyes, spinning slowly, radiating divine judgment. Not creatures in the usual sense -- divine machinery.
- **Throne Guardian**: A massive armored figure with four faces (human, lion, eagle, ox), four wings, standing at attention before a gate or altar. Ancient and immovable.
- **Herald of Judgment**: A being of pure light taking vaguely humanoid form, wielding a trumpet or horn, the sound of which is visible as golden shockwaves. The announcement of divine will.
- **Celestial Architect**: A multi-armed being constructing or repairing divine structures, each arm working independently, eyes studying blueprints only they can read. Heaven is maintained.
- **Fallen Aspirant**: A mortal who attempted to ascend and partially succeeded -- caught between human and celestial, flesh cracking with golden light, expression caught between agony and ecstasy. The cost of reaching for divinity.

**Environments**:
- The Celestial Throne Room: Impossibly vast, golden light from no visible source, geometric patterns on every surface, the floor a mirror reflecting a different sky
- The Garden of Judgment: A garden where every plant is made of crystallized light, paths of golden stone, figures kneeling in supplication before blooming light-trees
- The Armory of Heaven: Weapons of divine light arranged in perfect order, each one singing with faint harmonic resonance, attended by Ophanim
- The Bridge of Ascension: A span of pure light connecting a mortal city to a celestial citadel, pilgrims walking upward, some transforming as they climb
- Above the clouds: The celestial war camp, tents of golden fabric, war plans written in light on tables of divine crystal, the world far below
- A mortal city under celestial occupation: Golden banners hung from every building, mortals going about daily life under the watchful eyes of Seraphim overhead

**Moods & Palettes**:
- Divine ecstasy: Blinding central light, all shadows pushed to edges, holy gold/divine ivory/celestial rose/pure white
- Terrible beauty: Harsh geometric light, shadows that are too sharp, gold/cold silver/eye-white/void behind the light
- Judgment without mercy: Single beam of divine light illuminating a target, everything else in darkness, gold beam/black void/crimson judgment
- Heavenly serenity: Soft diffused golden light, no harsh shadows, warm ivory/gentle gold/soft blue/cream

### Textures

Divine white metal (neither steel nor silver -- something that glows faintly), golden etchings that are slightly raised from the surface, crystallized light (solid but transparent), angelic feathers (if any -- massive, more like sword blades than down), divine fire (gold and white, not orange), holy water (mercury-like, reflective, silver-gold), sacred stone (marble but warm to the touch, veined with gold), divine fabric (impossibly fine, catches light like liquid), living geometric patterns (tessellating, evolving slowly), eye-covered surfaces (each eye blinking independently, iris colors shifting).

### Color Palette Detail

| Color | Hex | Usage |
|---|---|---|
| Holy Gold | #DAA520 | Primary accent. Armor etchings, divine light, UI borders. |
| Divine Ivory | #F5F0E1 | Base surfaces. Stone, fabric, sky, card frame. |
| Righteous Blue | #3B5998 | Secondary accent. Celestial steel, shadow tint, Knight armor trim. |
| Celestial Rose | #C47A8E | Tertiary accent. Healing effects, inner light, flesh tones of celestial beings. |
| Judgment White | #F8F4F0 | Highlights. Divine radiance, weapon edges, eye glow. |
| Celestial BG Dark | #1A1520 | Background darkness. Deep purple-black behind all that light. |

---

## 9. Updated Faction Art Bible: The Endless

### The Endless

*Death * Undeath * Persistence * Spectral * Bone * Inevitability*

The Endless are the undead -- raised, summoned, bound, and abandoned. They are not a unified army; they are a fractured ecosystem of necromancers and their creations, held together by the simple truth that death endures when everything else fails. The liches raise them, the spectres linger when the liches no longer care, and the whole rotten machinery of undeath grinds on.

---

### Sub-Factions

#### Necromantic Cabals (Commanders)

**Visual Identity**: Liches and necromancers -- the power brokers of undeath. Robed figures of immense arcane knowledge, surrounded by the tools of their craft: phylacteries, bone constructs, ritual circles, preserved organs in jars. They are scholars of death, treating it as a resource to be extracted, refined, and deployed. Gustave Dore's illustrations of Dante's Inferno are the primary reference -- vast underground spaces, tortured landscapes, figures of authority presiding over realms of suffering. But the Cabals are not demonic -- they are cold, academic, methodical. Death is their laboratory.

**Character Archetypes**:
- **Arch-Lich**: Skeletal figure in ornate robes, phylactery visible (glowing gem embedded in chest or floating nearby), surrounded by floating bone fragments and necromantic energy, seated on a throne of fused bones. The ultimate necromancer -- ancient, powerful, utterly detached from mortal concerns.
- **Bone Architect**: Hunched figure assembling a construct from raw skeletal material, tools made of enchanted bone, wearing leather apron over robes, surrounded by works-in-progress. The engineer of the undead.
- **Flesh Binder**: Necromancer specializing in re-animating intact corpses rather than skeletons. Surgical tools, preservation fluids, half-sewn bodies on slabs. Medical horror meets magical industry.
- **Thrall Commander**: Armored lich leading a regiment of skeletal soldiers, riding a bone-horse construct, pointing forward with a staff crackling with necrotic energy. The field general.
- **Phylactery Guard**: Massive bone construct built specifically to protect a lich's phylactery. Hulking, heavily armored in bone plate, single-minded. The most dangerous undead because destroying it means nothing if the phylactery survives.
- **Apprentice Necromancer**: Still partly alive, bags under eyes, stained robes, struggling to control a small summoning. The beginning of the descent.

**Environments**:
- A lich's laboratory: Stone chamber filled with shelves of preserved specimens, ritual circles drawn on the floor, a central worktable where a corpse is being prepared for reanimation, candlelight and necrotic glow
- A bone quarry: A vast pit where skeletons are mined from ancient battlefields, bone sorted by type and size, necromancers overseeing the extraction like mining foremen
- The Phylactery Vault: A heavily warded underground chamber where liches store their soul vessels, each phylactery on a pedestal surrounded by protective constructs, the most important room in the undead empire
- A necromantic academy: Lecture hall where apprentices study anatomy and death magic, cadavers on demonstration tables, chalkboards covered in arcane notation, an Arch-Lich lecturing
- The Risen Factory: An assembly line where raw bone material enters one end and fully assembled undead soldiers emerge from the other, overseen by Bone Architects working in shifts
- A battlefield from the lich's perspective: The aftermath of a battle, necromancers moving among the fallen, selecting useful corpses, the living wounded watching in horror

**Moods & Palettes**:
- Academic horror: Cold blue-green lighting, clinical detachment, bone white/ghostly teal/surgical silver/necrotic purple
- Industrial death: Harsh overhead light, assembly-line efficiency, bone white/rust/dried fluid brown/cold iron gray
- Ancient power: Deep shadow with pinpoints of phylactery glow, necrotic purple/bone white/gold(phylactery)/void black
- Quiet menace: Dim candlelight, long shadows, things moving at the edge of vision, sickly green/bone white/warm candle amber/deep shadow

#### The Lost Spectres (The Abandoned Dead)

**Visual Identity**: Ghosts, wraiths, and spectral entities -- the undead that liches summoned and then abandoned when they were no longer useful, or spirits that escaped binding and now drift without purpose. They are tragic, ethereal, translucent. Goya's "Black Paintings" are the primary reference -- specifically "The Dog," "Saturn Devouring His Son," and "Witches' Sabbath" for their sense of isolation, horror, and beings trapped in states they cannot escape. Lost Spectres are not evil -- they are lost, abandoned, and in pain.

**Character Archetypes**:
- **Wandering Shade**: A translucent humanoid figure drifting through a landscape, features barely visible, expression frozen in whatever emotion they died with (usually fear or confusion). The baseline spectre.
- **Banshee**: A spectral figure with mouth open in a perpetual scream, sound waves visible as distortion in the air around them. Their scream is their only remaining power.
- **Phantom Knight**: A ghost still wearing the armor they died in, going through the motions of patrol or battle, unaware they are dead. Spectral equipment glowing with residual energy.
- **Poltergeist Swarm**: Not a single entity but a cluster of tiny spectral fragments orbiting a central point, causing physical objects to move and shatter. Rage without form.
- **Memory Echo**: A spectre replaying a moment from their life on loop -- a mother holding a child, a soldier raising a sword, a scholar reading. Transparent, repeating, heartbreaking.
- **Spectre Lord**: A rare powerful ghost that has retained its identity and will. More solid than other spectres, with visible features and personality. They lead other Lost Spectres not through power but through shared grief.

**Environments**:
- A ruined village at night: Spectres drifting through collapsed houses, re-enacting daily routines, moonlight passing through translucent forms
- A haunted battlefield: Ghost soldiers fighting a battle that ended centuries ago, spectral weapons clashing silently, the ground still scarred
- The Drift: An ethereal void between the material world and death, where spectres float in endless mist, losing memories and form over time
- A graveyard during the raising: Freshly risen spectres emerging from graves, confused and frightened, as a distant lich's summoning circle glows on the horizon -- the moment of their creation and abandonment
- A living city haunted: A mortal settlement where spectres have accumulated, transparent figures overlapping with living inhabitants, the living unaware or resigned
- The Wailing Cliffs: A cliff face where spectres gather, drawn by some resonance, their combined grief creating a perpetual wind that howls with their voices

**Moods & Palettes**:
- Ethereal grief: Soft diffused moonlight, everything slightly transparent, ghostly teal/bone white/moonlight silver/deep void blue
- Psychological horror: Goya-style darkness, harsh contrast, faces emerging from black, sickly green/bone white/void black/single point of spectral light
- Abandoned isolation: Vast empty space, single spectre small in frame, muted everything/ghostly teal glow the only color
- Spectral fury: Poltergeist energy, objects in motion, harsh strobing spectral light, white/teal/purple/black in violent contrast

### Textures

Translucent ectoplasm (like very thin smoke with faint color), old bone (yellowed, cracked, porous -- not clean white), preserved flesh (grey-green, leathery, stitched), phylactery gem glow (deep purple with gold core), necromantic energy (sickly green threads, like veins of bad light), spectral forms (transparent with faint outline glow, visible environment through them), grave soil (dark, damp, with root fragments), ritual chalk (white and red markings on dark stone), embalming fluid (amber, slightly luminous), moth-eaten fabric (robes, shrouds, burial wrappings -- thin, grey, fragmenting), frozen breath (visible exhalation in cold spectral air), rust and verdigris on ancient armor and weapons carried by ghost knights.

### Color Palette Detail

| Color | Hex | Usage |
|---|---|---|
| Necrotic Purple | #6B3FA0 | Primary accent. Phylactery glow, necromantic energy, lich power. |
| Bone White | #E8DCC8 | Base surfaces. Skeletal material, architecture, fabric. |
| Ghostly Teal | #5F9EA0 | Spectral glow. Spectre outlines, haunted environments, ghost fire. |
| Sickly Green | #7B9E5F | Decay accent. Necromantic ambient glow, corruption, pestilence. |
| Void Dark | #0D0D1A | Background darkness. Deeper and colder than other factions' darks. |
| Dried Blood Brown | #5C3A2E | Tertiary. Old stains, preserved flesh, grave soil. |

---

## 10. Updated Faction Art Bible: Ironwright Collective (Rethemed)

### The Ironwright Collective (Brutalist Space-Industrial Empire)

*Conquest * Industry * Void * Iron * Concrete * Efficiency * Star-Forges * Rebar*

The Ironwright Collective has been rethemed from Victorian steampunk to a **brutalist space-industrial empire**. This is a machine civilization that conquers the stars through industry and the efficiency of war. Massive orbital shipyards. Star-harvesting factories. Void-faring siege engines. Exposed rebar, poured concrete, rusted iron, hydraulic pistons. Space conquest through brutal industrial efficiency.

**NOT**: brass, gears, steam, clockwork, Victorian, whimsical, ornate, decorative, steampunk goggles, top hats, cogs.
**IS**: concrete, iron, hydraulics, rebar, void industry, star conquest, orbital machinery, brutalist architecture, military engineering, void-dock scaffolding, gravity-well factories, re-entry corridors.

The artistic references shift from generic steampunk to **Piranesi's "Carceri d'Invenzione" (Imaginary Prisons)** -- impossible architectural spaces of overwhelming scale, oppressive industrial interiors, staircases and bridges leading nowhere, mechanisms whose purpose is unclear -- combined with **John Martin's apocalyptic landscapes** -- vast vistas of divine-scale destruction, collapsing architecture, tiny humans dwarfed by the forces they have unleashed.

---

### Sub-Factions

#### The Foundry Directorate (Centralized Command)

**Visual Identity**: Purpose-built, geometric, blueprinted. The Directorate represents the Ironwright ideal: every component designed, approved, and manufactured to specification. Their constructs are angular, precise, new-looking (by industrial standards). Colors trend toward cold steel blue-gray and reactor blue. Everything has a serial number. Everything follows the plan. Order-aligned within the faction.

**Character Archetypes**:
- **Directorate Commander**: Heavy industrial power armor of reinforced concrete composite over iron frame, reactor pack on back, visor displaying tactical data. Not ornate -- functional. The officer who fights from the command bridge but can walk onto the hull if needed.
- **Void-Forge Engineer**: Sealed environment suit with magnetic boots, carrying industrial tools (rivet gun, plasma welder, structural scanner). The worker who builds warships in the vacuum of space. Practical, exhausted, essential.
- **Rebar Golem**: A humanoid construct of poured concrete over an iron rebar skeleton, hydraulic joints, optical sensors embedded in the chest (no head -- heads are wasteful), designed for heavy labor and combat interchangeably. The Directorate's workhorse.
- **Star-Harvester Mech**: A massive construct designed to operate near stellar surfaces, heat-resistant plating glowing dull red, energy collection arrays on its back, moving slowly and deliberately. An industrial machine that happens to be combat-capable.
- **Orbital Automaton**: A standardized humanoid combat unit, mass-produced, identical to thousands of others, serial number stenciled on chest plate. Basic but effective. The infantry.
- **Blueprint Savant**: An augmented human whose body has been partially replaced with industrial components -- one arm is a hydraulic crane, one eye is a reactor-powered sensor array. The mind that designs what the factory builds.

**Environments**:
- An orbital shipyard: Massive warship hull under construction, scaffolding stretching in all directions, welders creating constellations of sparks, void of space visible through gaps, scale that makes humans invisible
- A star-forge interior: The inside of a facility built around a captured star, energy conduits channeling stellar power to industrial processes, the walls glowing with contained heat, everything built to withstand forces that would crush planets
- A void-dock: The docking facility for interstellar warships, concrete platforms extending into vacuum, magnetic clamps securing hulls, supply lines running like veins, the organized chaos of military logistics
- A planetary strip-mine: An entire planet's surface being systematically harvested, terraced excavations visible from orbit, hauler vehicles the size of buildings, the horizon nothing but industrial activity
- A re-entry corridor: The interior passage of a ship during atmospheric entry, the walls glowing cherry-red from friction heat, crew strapped in, everything shaking, the moment before deployment
- The Assembly Line: An interior factory where constructs are built -- rebar frames moving along conveyor systems, concrete poured into molds, hydraulic actuators being installed, quality control stations
- A gravity-well factory: A facility built in the extreme gravity near a massive celestial body, everything reinforced to an absurd degree, workers in heavy-assist exoskeletons, the weight of reality itself as an industrial challenge
- A command bridge: Brutalist, functional, no decoration -- concrete walls, iron consoles, reactor-powered displays, officers in uniform gray, watching the void through armored viewports

**Moods & Palettes**:
- Industrial might: Harsh overhead factory lighting, steel blue-gray/cold iron/reactor blue glow/concrete gray, the pride of efficient production
- Void isolation: The cold light of distant stars, steel blue/void black/reactor blue pinpoints/concrete gray silhouettes, alone in the vast
- War machine: Warning orange emergency lighting, steel/iron/warning orange/concrete dust/smoke, everything at battle stations
- Blueprint precision: Clinical white light on technical drawings, white/steel blue/pencil gray/annotation red, the mind before the machine

#### The Scrap Legions (Battlefield Salvage)

**Visual Identity**: Self-assembled from the wreckage of conquered worlds and lost battles. Patchwork, jury-rigged, improvised. Where the Directorate is precise and planned, the Scrap Legions are chaotic and adaptive. They use whatever works -- alien technology scavenged from defeated enemies, damaged Directorate equipment repaired with incompatible parts, organic material fused with industrial components out of desperation. Colors trend toward rust, warning orange, and the mismatched metals of a dozen different sources. Chaos-aligned within the faction.

**Character Archetypes**:
- **Scrap Warlord**: A construct assembled from the best salvage of a hundred battlefields, no two parts matching, some alien, some Directorate, some unknown. Larger than standard constructs because they just kept adding. Covered in kill markings and territorial symbols.
- **Wreck-Diver**: A scavenger who crawls through destroyed ships and facilities salvaging useful components, wearing cobbled-together environment suit, carrying a cutting tool and a sack of parts. The supply chain of the Legions.
- **Jury-Rig Medic**: Part mechanic, part field surgeon, responsible for keeping damaged constructs and augmented soldiers functional using whatever is available. Carries a toolbox of mismatched components. Patches of alien tech grafted onto Ironwright frames.
- **Siege Crawler**: A massive improvised siege engine built from the combined wreckage of multiple destroyed vehicles, moving on mismatched treads and legs, bristling with salvaged weapons pointing in every direction. Ugly, effective, terrifying.
- **Feral Automaton**: A Directorate automaton that lost its command signal and has been self-repairing for so long it barely resembles its original design. Twitchy, unpredictable, parts grafted from alien sources. The Legion's shock trooper.
- **Void Barnacle**: A small parasitic construct that attaches to enemy ships and slowly dismantles them from the outside, feeding salvaged material back to the Legions. Not humanoid -- more like an industrial crustacean.

**Environments**:
- A scrapyard planet: An entire world used as a dump for destroyed warships and failed constructs, mountains of metal wreckage, Legion camps built from salvage, smoke from processing fires
- A battlefield being harvested: The aftermath of a space battle, debris fields being picked through by Wreck-Divers, destroyed hulls being towed to processing stations
- A jury-rigged fortress: A defensive position built entirely from salvage, walls of stacked hull plating, gun emplacements made from repurposed ship weapons, no two sections matching
- Inside a captured enemy ship: Scrap Legion occupiers tearing out interior systems and replacing them with their own jury-rigged alternatives, alien technology being grafted onto Ironwright power systems
- The Proving Yard: An arena where new constructs and siege engines are tested, surrounded by the wreckage of failed attempts, engineers watching from armored observation posts
- A deep space convoy: A fleet of mismatched salvage ships moving through void, no two the same size or design, held together by welding and hope, the Scrap Legions on the move

**Moods & Palettes**:
- Scavenger resourcefulness: Harsh, uneven lighting from multiple sources, rust orange/mismatched metal grays/warning orange/alien color accents (anything goes)
- Post-battle harvest: Dim emergency lighting, debris floating in zero-g, dark void/spark orange/hull gray/dried fluid stains
- Improvised grandeur: A surprisingly impressive structure made entirely from salvage, lit by captured reactor glow, rust/reactor blue/concrete gray/scavenged gold (from alien decoration)
- Feral machine: Glitchy light from damaged systems, shadows moving wrong, warning orange/glitch-white/void black/rust

### Textures

Poured concrete (raw, unfinished, showing form marks and aggregate), exposed rebar (rusted, bent, protruding from broken concrete), industrial iron plate (thick, heavy, bolted), hydraulic piston assemblies (oil-sheened, articulated), reactor glow (contained blue-white light behind shielding), void of space (pure black with pinpoint stars), welding sparks (brief, bright, scattered), hull plating (layered, riveted, scarred from micro-meteorite impacts), magnetic boot prints on dusty hull surfaces, conduit runs (bundled pipes and cables along walls and ceilings), serial number stencils (military font, spray-painted), warning markings (orange-and-black hazard stripes), concrete dust (fine gray powder on everything), cracked viewport glass (spiderwebbed from impact but holding), cargo netting (industrial mesh restraining equipment), military uniform fabric (coarse gray-blue, functional), scrap metal (torn, oxidized, mismatched alloys), jury-rigged welds (lumpy, uneven, holding but ugly), alien material fragments (unknown composition, wrong color, wrong texture -- integrated but not understood).

### Color Palette Detail

| Color | Hex | Usage |
|---|---|---|
| Steel Blue-Gray | #6B7B8D | Primary base. Hull plating, armor, uniform fabric. |
| Cold Iron | #4A5568 | Secondary base. Structural elements, concrete shadow. |
| Warning Orange | #E07020 | Primary accent. Hazard markings, emergency lighting, Scrap Legion identity. |
| Reactor Blue | #3B82C4 | Secondary accent. Power sources, Directorate energy, digital displays. |
| Concrete Gray | #8B8B83 | Neutral base. Brutalist architecture, unpainted surfaces. |
| Industrial BG Dark | #1A1D23 | Background darkness. The void of space, the interior of unlit stations. |
| Rust | #8B4513 | Scrap Legion accent. Oxidation, age, salvaged material. |

---

## Cross-Faction Variety Strategies (Updated for 5 Factions)

1. **Rotate sub-factions**: Never two consecutive cards from the same sub-faction within a faction.
2. **Vary scale**: Alternate close-ups, medium shots, epic wide shots. Use the CM-based scale system (TINY/SMALL/LARGE/COLOSSAL).
3. **Vary time of day and weather**: Apply the existing probabilistic weather (30%) and time (40%) systems to all five factions.
4. **Include non-combat moments**: Liches studying, Knights praying, spectres drifting through ruins, Fey feasting, Directorate engineers blueprinting.
5. **Show faction intersections**: A captured ruin being fought over by two factions. An Ironwright construct powered by scavenged celestial technology. A spectre haunting a Demonic throne room.
6. **Age and body diversity across humanoid characters**: Veteran lich vs. apprentice necromancer. Grizzled Knight commander vs. fresh squire. Ancient Fey lord vs. young sprite.
7. **"What If" expander**: Unusual angles, unusual weather, something gone wrong, first day on the job, unexpected sub-faction environment (a Spectre in a Directorate shipyard, a Knight in a Fey forest).
8. **New faction-specific variety**: Celestial -- vary between militant (Knights) and terrifying-divine (Chosen). Endless -- vary between cold-clinical (Cabals) and tragic-ethereal (Spectres). Ironwright -- vary between precise-new (Directorate) and chaotic-salvaged (Scrap Legions).

---

## Appendix A: Prompt Assembly Reference

### Card Art Prompt Order
```
{STYLE_ANCHOR}, {FACTION_PREFIX}, {CREATURE_DESCRIPTION}, {COMPOSITION}, {ENVIRONMENT}, [{WEATHER}], [{TIME_OF_DAY}], [{SCALE}]
```

### Planar Ruin Prompt Order (Neutral)
```
{RUIN_NEUTRAL_PREFIX}, {ARCHETYPE_DESCRIPTION}
```

### Planar Ruin Prompt Order (Evolved)
```
{RUIN_NEUTRAL_PREFIX}, {ARCHETYPE_DESCRIPTION}, {FACTION_SUFFIX}, {FACTION_ENVIRONMENT}
```

### Background Prompt Order
```
{BG_STYLE_PREFIX}, {SCENE_DESCRIPTION}
```

### LoRA Application
- **Card art (creatures + ruins)**: EldritchPaletteKnife @ 0.9
- **App backgrounds**: EldritchPaletteKnife @ 0.9
- **Icons and emblems**: NO LoRA (simpler style, transparent backgrounds)
- **Card backs**: EldritchPaletteKnife @ 0.7 (slightly less heavy to allow graphic design elements)

### Negative Prompt (Universal)
```
text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, gore, low quality, blurry, distorted anatomy, multiple heads, deformed limbs, floating objects, extra limbs, fused body parts, speech bubbles, comic panels, grid layout, white background, collage
```

---

## Appendix B: Asset File Naming Convention

All generated assets follow this naming pattern:

| Asset Type | Pattern | Example |
|---|---|---|
| Base creature card | `BASE-{faction}-{id}.webp` | `BASE-celestial-c01.webp` |
| Evolved creature card | `EVO-{faction}-{id}-t{tier}.webp` | `EVO-endless-e05-t3.webp` |
| Neutral ruin | `RUIN-neutral-{archetype}.webp` | `RUIN-neutral-stabilization-spire.webp` |
| Evolved ruin | `RUIN-{faction}-{archetype}.webp` | `RUIN-ironwright-archive-gate.webp` |
| Background | `BG-{screen}-{variant}.webp` | `BG-home-celestial.webp` |
| Faction emblem | `ICON-faction-{faction}.png` | `ICON-faction-endless.png` |
| Card back | `CARDBACK-{faction}.webp` | `CARDBACK-fey.webp` |
| Keyword icon | `ICON-keyword-{name}.png` | `ICON-keyword-ward.png` |
| Faction banner | `BANNER-{faction}.webp` | `BANNER-demonic.webp` |
| Onboarding slide | `ONBOARD-{faction}.webp` | `ONBOARD-celestial.webp` |
| Loading screen | `LOADING-{number}-{name}.webp` | `LOADING-03-void-forge.webp` |
| Particle texture | `PARTICLE-{name}.png` | `PARTICLE-divine-radiance.png` |
| Sub-faction emblem | `ICON-subfaction-{name}.png` | `ICON-subfaction-scrap-legions.png` |

All card art and backgrounds stored in Cloudflare R2. All UI assets stored in the Xcode asset catalog.

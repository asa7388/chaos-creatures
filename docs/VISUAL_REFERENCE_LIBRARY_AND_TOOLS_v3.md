# Chaos Creatures — Visual Reference Library & Agent Tools
## Supplement to ASSET_CREATION_GUIDE_v1.2.md | Version 3.0

**Read this before generating any asset. It answers two questions:**
1. *What should the output look like, specifically?* — Part I: Visual Reference Library
2. *What tools does the agent have to produce and evaluate it?* — Part II: Agent Tools

Every reference is public domain or CC0. Every tool is agent-callable via API, CLI, or MCP.

**Authority hierarchy:** `docs/CARD_DESIGN_GUIDE_FINAL.md` is authoritative on technical specs. `docs/GRIMDARK_AESTHETIC_DIRECTIVE.md` is authoritative on aesthetic register — what the output should *feel* like, and the acceptance test to apply before sign-off. This document provides the specific references and tools to achieve both. When in doubt: design guide for measurements, grimdark directive for feeling, this doc for how to generate.

---

## How to Use the References

Each reference entry follows this structure:

- **URL** — fetch this with `web_fetch` to view the image before generating
- **What to look at** — the specific area of the painting that's relevant
- **What to extract** — the concrete quality to inject into your prompt or shader
- **What to avoid** — aspects of the reference that are wrong for this project
- **Prompt phrase** — the exact language to add to your generation prompt based on this reference

The agent must look at each reference image, not just read the description. Use `web_fetch` on the URL, examine the image, then write one sentence in `Logs/iteration_log.md`: *"For [asset], I am targeting [specific quality] from [reference ID]."*

---

## Part I: Visual Reference Library

### 1.1 Oil Paint Quality — Universal Standards

These four references define what "oil painting" means in this project regardless of faction. Every generated artwork, at every rarity, must meet this baseline before faction-specific qualities are evaluated.

---

**OIL-1 — What impasto texture actually looks like**

Rembrandt van Rijn, *The Anatomy Lesson of Dr. Nicolaes Tulp* (1632)
```
https://upload.wikimedia.org/wikipedia/commons/4/4d/Rembrandt_-_The_Anatomy_Lesson_of_Dr_Nicolaes_Tulp.jpg
```
**What to look at:** Dr. Tulp's white ruff collar and the lit side of the faces. Now look at the same faces in shadow.

**What to extract:** In the lit areas, paint is physically thick — you can almost feel the ridges. In shadow areas, paint is thin — the warm brown of the ground coat shows through. This is impasto: *selective* thickness, not uniform texture. The highlights are the most three-dimensional parts of the painting. Shadows are glazes, nearly transparent.

**What to avoid:** The portrait composition and the anatomical subject matter.

**Prompt phrase:** `impasto highlights, thin glazed shadows, visible paint ridges on lit surfaces, warm amber undertone in darks, evidence of long use and hard conditions`

---

**OIL-2 — How figures emerge from darkness (not float above it)**

Rembrandt van Rijn, *The Night Watch* (1642)
```
https://upload.wikimedia.org/wikipedia/commons/5/5a/Rembrandt_van_Rijn_-_De_Nachtwacht.jpg
```
**What to look at:** The faces emerging from the right side of the painting — the ones that are half in shadow. Then look at the background: it is not a flat dark field, it has depth and texture.

**What to extract:** Creatures in this game should *emerge* from their environments the way these figures emerge from the background. The background is not a backdrop — it is a space with its own texture, and the figure interrupts it. The dark areas of the background have subtle warm variation. No area of shadow is perfectly uniform.

**What to avoid:** The military group portrait composition.

**Prompt phrase:** `figure emerging from environmental darkness, background with volumetric depth not flat field, shadow areas with warm ambient variation`

---

**OIL-3 — How different materials look different**

Johannes Vermeer, *The Milkmaid* (c.1658)
```
https://upload.wikimedia.org/wikipedia/commons/2/20/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg
```
**What to look at:** Four surfaces at once — the rough plaster wall (upper right), the woven bread basket, the ceramic pitcher, and the linen cloth on her shoulder. They all receive the same window light. They all look completely different.

**What to extract:** Material differentiation. Stone, cloth, ceramic, and bread each catch and scatter light in distinct ways. Every creature in this game is made of multiple materials. Fur does not look like armor. Bark does not look like stone. If every surface in the generated image catches light identically, the LoRA is not doing its job.

**What to avoid:** The domestic setting.

**Prompt phrase:** `physically distinct material surfaces, different specularity on each material type, rough surfaces scatter light, smooth surfaces catch specular highlights`

---

**OIL-4 — What aging looks like in paint**

Jacob van Ruisdael, *The Jewish Cemetery* (c.1655–60)
```
https://upload.wikimedia.org/wikipedia/commons/7/7a/Jacob_van_Ruisdael_-_The_Jewish_Cemetery.jpg
```
**What to look at:** The broken tombstones in the foreground. Then the ruined arch behind them. Then the sky.

**What to extract:** Aging is *specific*, not uniform. The tombstones are worn smooth at the top where rain has fallen, rough and lichened at the sides. The mortar between the arch stones has crumbled at stress points — not evenly everywhere. This is the reference for how "aged" should look in every card component: the parchment wears at the edges and at touch points, the wax seal chips at the rim where it's thinnest, the gold frame loses finish at the corners. Nothing ages uniformly.

**What to avoid:** The cemetery subject matter — this reference is purely for aging quality.

**Prompt phrase:** `aged surfaces worn specifically at stress and contact points, not uniformly deteriorated, lichen and erosion follow physical logic`

---

### 1.2 Faction-Specific References

#### Ironwright Collective

The Ironwright aesthetic is **monumental industrial brutalism rendered with Old Master skill**. The machinery is ancient and vast. The light is harsh and directional. There is no warmth — only the cold light of arc welders and reactor cores.

---

**IRON-1 — The architecture and scale**

Giovanni Battista Piranesi, *Carceri d'Invenzione*, Plate VII — The Drawbridge (1761 edition)
```
https://upload.wikimedia.org/wikipedia/commons/4/48/Giovanni_Battista_Piranesi_-_Le_Carceri_d%27Invenzione_-_Second_Edition_-_1761_-_Plate_07_-_The_Drawbridge.jpg
```
**What to look at:** The tiny human figures at bottom center. Now look at the machinery around them — chains, bridges, arches, staircases going nowhere useful. This is not a building anyone would want to be in.

**What to extract:** Scale through human diminishment. An Ironwright creature should be rendered such that the architecture around it communicates the same monumental wrongness. The machinery has weight — you can tell these chains are iron because they hang with the right sag. The shadow pools are not gradients; they are absolute dark where no light reaches. Also note the cross-hatching technique: in oil paint translation, this becomes directional brushstrokes in shadow areas, not smooth blending.

**What to avoid:** The etching/engraving rendering style itself — this must become oil paint, not an imitation of printmaking.

**Prompt phrase:** `Piranesian scale, architecture that diminishes figures, massive structural members, absolute shadow pools, brutalist industrial geometry, no ornamentation`

---

**IRON-2 — The light quality inside Ironwright spaces**

Rembrandt van Rijn, *The Philosopher in Meditation* (1632)
```
https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Rembrandt_-_The_Philosopher_in_Meditation.jpg/800px-Rembrandt_-_The_Philosopher_in_Meditation.jpg
```
**What to look at:** The spiral staircase in the background on the right. It is almost entirely in shadow — only the edges of each step catch a tiny fragment of light from the window. Now look at the window itself — light streams in from one direction and everything else falls away to darkness.

**What to extract:** Ironwright interiors have exactly this quality: single-source industrial light, everything else in deep shadow with only edge catches. The Foundry Directorate uses reactor-blue light instead of warm window light, but the structure of the lighting is identical. Harsh directional source, shadow that is genuine black, tiny edge catches on structural elements.

**What to avoid:** The cozy firelit atmosphere — Ironwright is cold, not warm.

**Prompt phrase:** `single harsh directional light source, deep shadow with only edge highlights on structural elements, industrial interior depth`

---

**IRON-3 — Industrial violence at panoramic scale (Legendary tier reference)**

Pieter Bruegel the Elder, *The Triumph of Death* (c.1562)
```
https://upload.wikimedia.org/wikipedia/commons/5/52/The_Triumph_of_Death_by_Pieter_Bruegel_the_Elder.jpg
```
**What to look at:** Zoom into the background — the burning towers, the army in the middle distance, the individual figures in the far right corners. Every single figure at every distance is rendered with the same specificity as the foreground.

**What to extract:** This is the Legendary rarity ambition level. A Legendary Ironwright card should be a painting that rewards close examination: details at every depth plane, the background as complete as the foreground. Also note the palette: warm amber burning sky, bone-grey machinery/army, the only vivid color is fire. This is Ironwright's palette logic — everything grey and cold except the industrial light source.

**What to avoid:** The skeleton/undead subject matter. Ironwright is machinery and industry, not death imagery.

**Prompt phrase:** `panoramic industrial scale, every depth plane rendered with equal specificity, amber and grey palette with cold white industrial light as the only color`

---

#### Fey Courts — Verdant Throne

Verdant Throne is **ancient, inhabited, powerful wilderness**. Not fairy-tale prettiness — genuinely old forest that has absorbed centuries of magic into its root systems. The light is dappled and filtered, never direct. Everything is alive.

---

**FEY-V-1 — Density and living surface quality**

Richard Dadd, *The Fairy Feller's Master-Stroke* (1855–64)
```
https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Richard_Dadd_-_The_Fairy_Feller%27s_Master-Stroke.jpg/800px-Richard_Dadd_-_The_Fairy_Feller%27s_Master-Stroke.jpg
```
**What to look at:** The grass, seeds, and undergrowth in the foreground — zoom in. Each seed head is individually painted. The grass blades have physical presence. Small figures emerge from this texture, not in front of it.

**What to extract:** Verdant Throne environments should have this quality of inhabited density. The background is not an atmospheric wash — it is rendered vegetation with the same care as the figures. Creatures in this faction are *part* of the environment, emerging from it rather than posed against it. Also note: the palette is earth greens, warm golds, and shadows that are deep forest-cool. This is not a sunlit scene; it is dappled, filtered, ancient canopy light.

**What to avoid:** The Victorian fairy-tale scale and whimsy. Verdant Throne is genuinely powerful and ancient, not cute.

**Prompt phrase:** `inhabited organic density, undergrowth rendered with same specificity as figures, creature integrated with not posed against environment, dappled filtered canopy light`

---

**FEY-V-2 — A creature that communicates intent through posture alone (Common/Uncommon reference)**

Jan Asselijn, *The Threatened Swan* (c.1650) — Rijksmuseum
```
https://upload.wikimedia.org/wikipedia/commons/a/a4/Jan_Asselijn_-_Bedreigde_zwaan.jpg
```
**What to look at:** The swan's posture. Wings spread, neck extended forward — this bird is *doing something*, not posing. The simple background. The quality of the feathers.

**What to extract:** Common and Uncommon cards have simpler compositions — one creature, one environment. This is the standard: even a simple composition can communicate agency and physical presence through posture and rendering quality. The swan is not decorative; it is dangerous. Also: note how the feathers are painted — each one is individually textured. This is material specificity at a lower compositional complexity. Common cards should achieve this level of creature rendering even without complex backgrounds.

**What to avoid:** The specific swan subject matter.

**Prompt phrase:** `creature in active posture communicating intent, simple environment supporting not competing with figure, material specificity on creature surface`

---

**FEY-V-3 — Bioluminescence that feels physical, not digital**

Henri Rousseau, *The Dream* (1910)
```
https://upload.wikimedia.org/wikipedia/commons/b/b8/Henri_Rousseau_-_Le_R%C3%AAve.jpg
```
**What to look at:** The flowers — they have a quality of impossible vividness against the dark foliage. They do not glow digitally; they are simply painted more brightly than their surroundings. The whole scene is lit from within the foliage, not from a sky.

**What to extract:** Verdant Throne bioluminescence is achieved through paint brightness contrast, not through a glow filter or bloom effect. The luminescent markings on Verdant creatures are simply painted more saturated and brighter than their surroundings — in the context of the painting, this reads as self-illuminated. There is no halo, no blur, no soft edge. Just paint that is brighter.

**What to avoid:** The naive/primitive painting style — Verdant Throne has the skill quality of Dutch/Flemish masters, just with this subject matter.

**Prompt phrase:** `self-luminous markings achieved through paint brightness contrast not glow effects, jungle interior lit from within vegetation, vivid forms against deep foliage`

---

#### Fey Courts — Hollow Court

Hollow Court is **patient predatory cold**. The forest in winter, stripped bare. Moonlight on frost. Creatures that have outlasted warmth. Nothing here wastes energy.

---

**FEY-H-1 — The Hollow Court spatial register**

Caspar David Friedrich, *Wanderer above the Sea of Fog* (1818)
```
https://upload.wikimedia.org/wikipedia/commons/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg
```
**What to look at:** The scale relationship between the figure and the void below. The figure occupies maybe 15% of the canvas height. The rest is fog, distant peaks, open sky.

**What to extract:** Hollow Court compositions have this spatial quality: the creature is present but the emptiness around it is the point. The world does not belong to the creature; the creature inhabits a world that is fundamentally empty and cold. The palette is perfectly on: cold grey-blue fog, dark stone, pale sky. Nothing warm except the figure itself — and in Hollow Court, the creature won't even be warm.

**What to avoid:** The Romantic heroism interpretation. Hollow Court is not triumphant or sublime — it is patient and predatory.

**Prompt phrase:** `figure small against vast cold emptiness, grey-blue fog and pale sky palette, cold stone surfaces, no warmth in environment`

---

**FEY-H-2 — Cold stone and frost surface quality**

Pieter Saenredam, *Interior of the Grote Kerk, Haarlem* (1636–37)
```
https://upload.wikimedia.org/wikipedia/commons/b/bb/Pieter_Jansz_Saenredam_-_Interior_of_the_Choir_of_Sint-Bavokerk_-_WGA20608.jpg
```
**What to look at:** The white-painted stone walls and columns. The cold even light. The way the stone surface is neither bright nor dark but simply cold.

**What to extract:** Hollow Court stone and frost have this quality — grey-white, matte, utterly cold. Light falls on it without warmth. The shadows are grey-blue, not brown-warm. Stone in the Hollow Court does not look like Ironwright stone — Ironwright stone is ancient and dirty; Hollow stone is exposed and frost-cleaned. Mineralogically distinct.

**What to avoid:** The church architectural setting.

**Prompt phrase:** `cold white stone surfaces, grey-blue shadows without warmth, matte mineral surface catching light flatly, frost-cleaned not aged-dirty`

---

#### Demonic Kingdoms — Furnace Lords

Furnace Lords is **volcanic violence and industrial heat at a scale that makes Ironwright look small**. Everything burns. The sky is fire. Creatures are made from magma-forged obsidian plate, or are themselves partly volcanic.

---

**DEM-F-1 — The Furnace Lords' atmospheric light**

J.M.W. Turner, *The Fighting Temeraire* (1839)
```
https://upload.wikimedia.org/wikipedia/commons/7/76/The_Fighting_Temeraire%2C_JMW_Turner%2C_National_Gallery.jpg
```
**What to look at:** The sunset sky — orange bleeding into crimson bleeding into dark at the top. Then look at the smoke from the tug — how it dissolves the horizon.

**What to extract:** Furnace Lords' atmosphere is a Turner sky. The sky is on fire. The horizon dissolves. Smoke from forges creates the same atmospheric dissolution — objects far away lose their edges not because they're blurry but because the air between is thick with heat and particulate. This is the spatial quality for Furnace Lords backgrounds: volcanic atmosphere that physically alters what you can see.

**What to avoid:** The elegiac, melancholy register. Furnace Lords are violent and ascendant, not sunset-nostalgic.

**Prompt phrase:** `Turner volcanic sky, orange bleeding into crimson into dark, atmosphere thick with heat-haze and smoke, horizon dissolves in particulate`

---

**DEM-F-2 — What things look like inside a forge fire**

Joseph Wright of Derby, *An Iron Forge* (1772)
```
https://upload.wikimedia.org/wikipedia/commons/9/98/Joseph_Wright_of_Derby_-_An_Iron_Forge_-_Google_Art_Project.jpg
```
**What to look at:** The glowing metal on the anvil. How it lights the faces of the workers from below. The deep shadow everywhere else.

**What to extract:** Forge light — the primary light source in Furnace Lords interiors — is orange-white at the source, orange at medium distance, and creates strong underlighting on faces and forms. Everything lit by forge-fire has warm, high-contrast illumination. Everything not in direct forge-light is in genuine shadow with a warm reflected ambient. This painting is the definitive forge-light reference.

**What to avoid:** The 18th-century industrial romanticism framing.

**Prompt phrase:** `forge-fire underlighting, orange-white primary source, faces lit from below, warm ambient in deep shadow, high contrast industrial interior`

---

#### Demonic Kingdoms — Obsidian Bureaucracy

The Obsidian Bureaucracy is **administrative evil conducted with absolute procedural normalcy**. Contracts are signed in blood but the ink is still wet and the quill is still in the bureaucrat's hand. The horror is that everyone is doing their job.

---

**DEM-B-1 — The Bureau's aesthetic: formal settings doing terrible things normally**

Hieronymus Bosch, *The Garden of Earthly Delights* — Hell panel (right triptych, c.1500)
```
https://upload.wikimedia.org/wikipedia/commons/a/ae/El_jard%C3%ADn_de_las_Delicias%2C_de_El_Bosco.jpg
```
**What to look at:** The right third of the image (the Hell panel). Specifically the lower-center area with the tree-man figure, and the upper portions where figures move purposefully through the scene. Notice their expressions — focused, professional, occupied.

**What to extract:** The bureaucratic horror register. In Bosch's Hell, terrible things happen procedurally. The torturers are working. The figures being processed are being processed efficiently. The Obsidian Bureaucracy operates on exactly this logic: contracts, chains, reddish lamplight, too-many-eyes bureaucrats processing souls with administrative thoroughness. The horror is the normalcy of it.

**What to avoid:** Reproducing Bosch's specific iconography. The tone and psychological register, not the visual elements.

**Prompt phrase:** `bureaucratic evil with procedural normalcy, administrative horror in formal setting, purposeful figures conducting terrible work as routine`

---

**DEM-B-2 — The Bureau's material vocabulary: vellum, ink, formal robes, reddish light**

Rembrandt van Rijn, *Belshazzar's Feast* (c.1635)
```
https://upload.wikimedia.org/wikipedia/commons/6/67/Rembrandt_Harmenszoon_van_Rijn_-_Belshazzar%27s_Feast_-_WGA19121.jpg
```
**What to look at:** The golden vessels. The formal robes. The reddish-gold candlelight. The writing appearing from nowhere amid a formal occasion.

**What to extract:** This is the Bureau's physical setting: formal ceremonial objects (gold vessels → obsidian and gold contract-seals), formal robes (Bureau functionaries wear formal black robes with contract-ink stains), reddish-gold lamplight (no sunlight ever reaches Bureau spaces — they operate by lamplight and soul-fire), and formal occasions that become horrifying. The material language — obsidian, gold, vellum, lamplight — is all here.

**What to avoid:** The Old Testament narrative context.

**Prompt phrase:** `formal bureaucratic materials, obsidian and tarnished gold, reddish lamplight interior, vellum contracts and ink, robes of office, formal occasion with dark undertone`

---

#### Celestial Crusade

The Celestial Crusade is **divine order as absolute power**. Not gentle heaven — burning geometric certainty. Blake's prophetic entities. Six wings and eyes in every surface. Reality bends around them.

---

**CEL-1 — The Celestial's energy quality**

William Blake, *The Ancient of Days* (1794)
```
https://upload.wikimedia.org/wikipedia/commons/3/39/William_Blake_-_The_Ancient_of_Days.jpg
```
**What to look at:** The figure emerging from a dark void. The radiance around it is not a halo or glow — it is the figure's own energy pushing against the darkness like a physical force. The compass extended downward is deliberate and precise.

**What to extract:** Celestial energy is not a glow effect. It is painted radiance — the paint is literally brighter in that zone, creating an impression of light through craft rather than filter. Celestial creatures *impose* their radiance on the space around them. The darkness around the figure is not empty — it is resistance. And note: even this divine figure is geometric and purposeful, not soft or fluffy.

**What to avoid:** Any reading that makes Celestial feel gentle or angelic in a soft sense. Celestial is terrifying.

**Prompt phrase:** `painted radiance not glow effect, divine energy as physical force against darkness, geometric and purposeful, burning gold light that is cold not warm`

---

**CEL-2 — Celestial scale and architecture**

Gustave Doré, *Paradise Lost* — Satan Arousing the Rebel Angels (1866)
```
https://upload.wikimedia.org/wikipedia/commons/1/17/Paradise_Lost_1.jpg
```
**What to look at:** The scale of the figure against the void. The single beam of divine light in the upper right — hard-edged, directional. The figures below receiving that light.

**What to extract:** Celestial light is directional, hard-edged, and creates true shadows. It is not diffuse divine glow — it is a beam, and anything not in the beam is in shadow. Scale is operatic: Celestial creatures are massive. Their environments (heavenly architecture, void, celestial space) are larger still. Also note Doré's linework quality in the engraving — in oil paint translation, this becomes very fine directional brushstrokes in shadow areas.

**What to avoid:** The Satanic subject matter — this is purely a light and scale reference.

**Prompt phrase:** `single directional divine beam, hard-edged celestial light source, true shadows not ambient glow, operatic scale with small figures in vast celestial space`

---

**CEL-3 — Gold that reads as divine, not decorative**

Fra Angelico, *Annunciation with Saint Ansanus* (c.1450) — Uffizi
```
https://upload.wikimedia.org/wikipedia/commons/b/b0/Fra_Angelico%2C_Annunciation%2C_Uffizi.jpg
```
**What to look at:** The gold leaf on the halos and angel wings. Notice it is not uniformly bright — there is directional variation, warm and cool areas, patches where it catches fully and patches where it is nearly matte.

**What to extract:** Celestial gold is the `aged-gold` token behavior: warm, with directional variation, single directional catch rather than uniform reflectivity. Gold areas in Celestial cards should feel like they were applied with a brush — there is texture and variation in the application. Not chrome, not foil, not spray paint. Painted gold.

**What to avoid:** The medieval flat composition style — Celestial faction creatures have volumetric, Old Master rendering quality.

**Prompt phrase:** `painted gold with directional variation, warm aged-gold tone not bright chrome, single directional specular catch on gold surfaces`

---

#### The Endless — Necromantic Cabals

The Cabals are **academics who have mastered death as a discipline**. Libraries built inside bone cathedrals. Soul-light as the only illumination. They are methodical, patient, and terrifying because they understand what they're doing.

---

**END-C-1 — The Cabal's spatial environment**

Gustave Doré, *The Divine Comedy* — Inferno, Canto III (1861)
```
https://upload.wikimedia.org/wikipedia/commons/c/c3/Gustave_Dore_Inferno_Canto_III.jpg
```
**What to look at:** The scale of the stone architecture against the figures. The cold, directionless light that seems to come from everywhere and nowhere. The procession moving through the space with mechanical purposefulness.

**What to extract:** Cabal environments have exactly this spatial quality: massive stone architecture with bone-cathedral overtones, cold light without a visible source, figures moving through it with methodical purpose. The atmosphere is damp stone — you can almost feel the moisture. The palette is Doré's: bone-white stone surfaces, cold grey shadows, figures as dark silhouettes against the architecture.

**What to avoid:** The Inferno narrative context — this is a spatial and atmospheric reference, not a subject matter reference.

**Prompt phrase:** `bone-cathedral scale, cold sourceless light on stone, damp stone atmosphere, figures as purposeful silhouettes against massive architecture`

---

**END-C-2 — The scholar-horror register (the academic studying something terrible)**

Rembrandt van Rijn, *Faust* (c.1652) — etching
```
https://upload.wikimedia.org/wikipedia/commons/d/d2/Rembrandt_Harmensz_van_Rijn_-_Faust_-_WGA19012.jpg
```
**What to look at:** The scholar at his desk — absorbed, not theatrical. The supernatural light from the disc behind the window. The cold window light competing with warm candle.

**What to extract:** Cabal card subjects are absorbed in their work. They are not performing horror — they are conducting research. The horror is in *what* they are researching, not in theatrical grimacing. A Cabal lich studies at a desk exactly like this scholar. Also note the light: cold phylactery soul-light (the disc) competing with warm candle. This is the exact light quality for Cabal interiors — a cold teal soul-light source and warm candle as secondary.

**What to avoid:** The Faust narrative context.

**Prompt phrase:** `scholar absorbed in terrible research, cold teal soul-light competing with warm candlelight, academic setting with horrific subject matter treated as normal work`

---

#### The Endless — Lost Spectres

Lost Spectres are **half-present**. They exist in a world where the color has been drained. They are not scary because they're frightening — they're sad because they're lost. They don't know they're dissolving.

---

**END-S-1 — Spectre color palette and atmosphere**

Arnold Böcklin, *Isle of the Dead* (1880)
```
https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Arnold_B%C3%B6cklin_-_Die_Toteninsel_I_%28Kunstmuseum_Basel%29.jpg/1280px-Arnold_B%C3%B6cklin_-_Die_Toteninsel_I_%28Kunstmuseum_Basel%29.jpg
```
**What to look at:** The color palette — grey-green water, white stone, black cypress trees. The lone figure in white in the boat. The light that seems sourceless.

**What to extract:** The Spectre palette is built from this: grey-greens, bone-whites, deep shadows with no warm tones. The light is flat, as if the sun has been turned down rather than switched to a different angle. Spectre environments have had their warmth extracted — what remains is the physical world but without the life-energy that gives it color. The white-robed figure in the boat is also instructive: Spectre figures have just enough opacity to be present but are rendered with visible transparency in the lighter areas.

**What to avoid:** The Victorian funerary subject matter framing.

**Prompt phrase:** `grey-green and bone-white palette, warmth drained from environment, flat sourceless light, figures with partial translucency in lit areas`

---

**END-S-2 — How figure and environment interpenetrate (the dissolution quality)**

Odilon Redon, *The Cyclops* (1914)
```
https://upload.wikimedia.org/wikipedia/commons/3/38/Odilon_Redon_-_The_Cyclops_-_1914.jpg
```
**What to look at:** The seam between the cyclops figure and the landscape. They don't have a clean edge between them — figure and environment blend at their boundary.

**What to extract:** Spectre figures don't have clean edges at their boundaries with the environment. The brushstrokes at the edge of a Spectre figure should blend into the background strokes — the figure emerges from the background and the background invades the figure at every edge. This is not blur or transparency; it is paint quality — the same stroke that describes the background continues to describe the figure's edge. Also note Redon's color approach: teals, purples, warm yellows all coexist in the same painting, creating chromatic richness without conventional harmony. This is the Spectre palette logic.

**What to avoid:** The grotesque/mythological subject matter.

**Prompt phrase:** `figure edges dissolving into environment through brushstroke continuity not blur, teal and lavender with warm shadow accents, chromatic richness without conventional harmony`

---

### 1.3 Card Component References

The artwork is only half the card. These references define the card body, typography, wax seals, and frame materials.

---

**COMP-1 — The parchment surface and ink-into-fiber typography**

This component requires *two* references: one for the material behavior of vellum, one for the worn/working-document end of the spectrum. Book of Kells gives the material truth; the second reference gives the register.

**Reference 1a — Material behavior**

Book of Kells, Chi Rho page (c.800 AD)
```
https://upload.wikimedia.org/wikipedia/commons/1/1b/KellsFol034rChiRhoMonogram.jpg
```
**What to look at:** The vellum surface between the letterforms — the warm cream ground tone. The ink letterforms themselves — look at their edges under magnification. Now look at the gold areas.

**What to extract:** Three lessons simultaneously: (1) The ground tone of unworked vellum is warm cream, not white, not beige — specifically warm and slightly yellowish. This is `parchment-light`. (2) The ink has *sunk into* the fiber — the edges of letterforms are slightly irregular, with microfibrous bleed. Typography in this app uses letterpress quality: ink that is *in* the paper, not printed on top of it. (3) Gold leaf sits *above* the surface — it catches light differently from ink because it is proud of the vellum.

**What to avoid:** The pristine, sacred-manuscript condition — Book of Kells was treasured and preserved. Cards in this game have been handled in field conditions.

---

**Reference 1b — Worn working-document parchment**

Medieval document examples — Wikimedia Commons
```
https://commons.wikimedia.org/wiki/Category:Medieval_manuscripts
```
Search specifically for: `Category:Medieval_charters`, `Category:Damaged_manuscripts`. Find examples showing fold lines, edge darkening from handling, partial water damage, or wear at corners.

**What to look at:** How parchment darkens and becomes supple at the folds. How edges compress and darken where hands have gripped. How the writing zone stays relatively clean while margins and borders show accumulation of dirt and handling oil.

**What to extract:** Cards are not museum pieces. They are documents that have been in pockets, tucked into armor, handled by soldiers. The parchment `parchment-mid` color at edges is not an aesthetic choice — it is the physical consequence of this use. Edge darkening should follow the logic of handling: heavier at corners (where fingers grip), lighter at center. The ParchmentShader edge vignette should intensify at the four corners more than the four midpoints.

**What to avoid:** Random texture application that doesn't follow physical logic. Wear that is uniform rather than concentrated at touch points.

**Prompt phrase (for parchment texture generation):** `warm cream vellum with visible fiber grain, ink letters with micro-bleed at edges as if letterpress printed, edges darkened from handling, corner wear from gripping, field-document condition not museum-preserved`

---

**COMP-2 — The wax seal dome and single specular highlight**

*Various medieval wax seals* — Wikimedia Commons Category
```
https://commons.wikimedia.org/wiki/Category:Wax_seals
```
Browse at least 5 images in this category before generating any wax seal.

**What to look at:** On every seal, find the specular highlight. There is exactly one. It is offset from center — toward the dominant light source. The dome creates a convex reflection. Now look at the edges — where the wax pooled and cooled, it formed irregular drip texture. Now look at the relief symbol — it is pressed *into* the wax (intaglio), so the recessed areas are darker and the raised wax rim of each relief element catches the light.

**What to extract:** The three-part structure of every correct wax seal: (1) dome geometry — not a flat disc, genuinely convex; (2) single offset specular — one directional catch, warm-toned, not white; (3) intaglio relief — symbol is below the wax surface level, catching shadow in recessed areas. If the generated seal does not have all three of these, it is wrong regardless of how nice it looks otherwise.

**Prompt phrase:** `convex wax dome with single directional specular highlight, intaglio relief symbol pressed below wax surface, irregular drip texture at seal edges, dense translucent wax`

---

**COMP-3 — Aged gold frame surface quality**

Various Baroque frame details — search Rijksmuseum API
```python
# Run this to find high-quality gold frame reference images from Rijksmuseum
import requests
params = {"key": RIJKS_API_KEY, "q": "gold frame baroque painting", "imgonly": "true", "ps": 5}
results = requests.get("https://www.rijksmuseum.nl/api/en/collection", params=params).json()
# Look through artObjects for paintings with ornate gold frames visible
```

**What to look at:** The gold frame in any large Baroque painting. Note: the raised relief elements of the frame catch the primary light with a single warm highlight. The recessed areas between relief elements are almost brown-black. The overall tone reads as gold but the local variation is extreme.

**What to extract:** `aged-gold` token behavior: single directional warm highlight on raised frame elements, near-black in recesses, overall warm gold read but never uniformly bright. Real gold frames are not shiny chrome — they are warm, directional, and have areas that are nearly as dark as the wood beneath. The card's rarity frame should behave identically.

**What to avoid:** Any frame that reads as uniformly metallic or chrome.

**Shader behavior:** In `WarmFoilShader.metal`, the gold areas should have a single directional specular with warm tint (`float3(1.0, 0.95, 0.80)`), not a white or neutral specular.

---

**COMP-4 — Canvas grain visible through thin paint**

Jan Brueghel the Elder, *Flowers in a Wooden Vessel* (c.1606–7) — detail of background area
```
https://upload.wikimedia.org/wikipedia/commons/5/5a/Jan_Brueghel_d._%C3%84._Blumenstrau%C3%9F_in_hölzernem_Gefäß.jpg
```
**What to look at:** The dark background areas — the canvas grain is visible where the paint is thinly applied. This is intentional: the weave of the canvas becomes part of the visual texture in shadow and mid-tone areas.

**What to extract:** Card backgrounds and the open areas around creatures should show canvas tooth — not aggressively, but enough that it is perceptible as a physical surface. In the OilPaintShader, this is achieved by the brush_normal texture tiling at high frequency in low-saturation areas and having low influence in bright colors. The canvas grain should *only* show where paint is thin — in deep shadows and mid-tones. In bright areas, impasto paint covers the grain.

**Shader note:** `brushNormal` tiling frequency should be ~4x in shadow areas, ~1.5x in highlights where thick paint fills the grain.

---

### 1.4 Sound Character References

The agent cannot hear, but can reason about sound by studying acoustic descriptions and frequency profiles. These references are for reasoning about what kinds of sounds to search for on Freesound.

---

**SFX-1 — What "cardstock" sounds like vs. paper**

The card has the weight and stiffness of playing card stock — 300gsm coated cardboard. This is heavier and stiffer than paper. When searching Freesound:

- ✅ Search for: `card shuffle`, `playing card`, `stiff paper`, `card deal`
- ❌ Do not use: `paper rustle`, `notebook`, `book page` — too light, too flexible
- Target frequency profile: Low-mid body (200–600 Hz is where card stock lives), short duration (under 200ms for tap/place sounds), transient attack with fast decay

Freesound search for card pickup: `"playing card" OR "card stock" OR "stiff card"` with CC0 filter, duration < 0.3s

---

**SFX-2 — What wax sounds like when pressed**

A wax seal being pressed: dense, dampened, not hollow. Think of pressing your thumb into a ball of modeling clay — the resistance, the slight deformation, the springback. Not a click (too bright), not a thud (too low), not a tap (too light).

- ✅ Search for: `wax press`, `clay press`, `dense material impact`, `rubber stamp`
- Target: Low-mid transient (200–400Hz dominant), short decay (~80ms), dampened not ringing

---

**SFX-3 — Faction ambient character descriptions for Freesound searches**

| Faction | Freesound search terms (CC0 only) | What to avoid |
|---|---|---|
| Ironwright | `industrial hum`, `metal stress creak`, `steam vent`, `electric arc` | Musical tones, melodic elements |
| Verdant — Throne | `forest ambience`, `wind leaves`, `bird distant`, `water stream gentle` | Electronic elements, drums |
| Verdant — Hollow | `wind empty space`, `branch creak winter`, `silence with breath` | Bird sounds, water — Hollow Court is silent |
| Demonic — Furnace | `forge fire rumble`, `molten metal`, `deep fire crackle` | Gentle fire sounds — Furnace is industrial scale |
| Demonic — Bureau | `quill writing`, `paper shuffle`, `chain links slow` | Dramatic horror sounds — Bureau is quiet and procedural |
| Celestial | `single high tone`, `crystal resonance`, `breath of wind distant` | Choral music, church bells — too literal |
| Endless — Cabals | `stone grinding distant`, `water drip cave`, `bone rattle subtle` | Dramatic horror — Cabals are academic |
| Endless — Spectres | `wind through empty room`, `distant voice unintelligible`, `hollow resonance` | Clear voices, melodic elements |

---

### 1.5 The Failure Gallery — Bad Output Patterns

Recognizing bad output is as important as knowing what good output looks like. These are the failure modes the agent will most frequently encounter.

---

**FAIL-1: Digital Art in an Oil Paint Costume**

*Symptom:* The output has an oil paint texture overlaid on what is fundamentally a digital illustration. Colors are too saturated — pure blues, pure purples appear. Edges of figures are crisp even in shadow. The "brushwork" is mechanical and regular.

*Why it happens:* The LoRA trigger phrase was omitted, or the prompt contains words that steer toward digital illustration styles: "detailed," "vibrant," "dynamic," "concept art."

*Fix:* Remove all words that could mean "digital illustration." Add `"17th century oil painting technique, visible brushwork, impasto highlights, glazed shadows"`. Check that LoRA trigger phrase `oil paint canvas texture impasto` is present. Reduce guidance scale by 0.5.

*Reference:* Compare against OIL-1 (Anatomy Lesson). If your output doesn't have the same relationship between thick highlights and thin shadows, it is FAIL-1.

---

**FAIL-2: Wrong Color Temperature**

*Symptom:* The `verify_asset.py --warm-tone-check` fails, OR the image passes the script check but clearly has cool areas — blue-cast shadows, purple mid-tones, grey that reads as cold rather than warm.

*Why it happens:* The model's default output trend is toward cooler digital aesthetics. Fey — Hollow Court is the only faction with genuinely cold tones, and even there the shadows have grey warmth, not blue coldness.

*Fix:* Add `"warm ochre-brown ambient in shadows, no cool shadows, no blue midtones"` to the prompt. Run the faction grade script (`bash Scripts/grade_artwork.sh`) which applies the ImageMagick color grade — this alone resolves most temperature failures.

*Script check:*
```bash
python3 Scripts/verify_asset.py output.png --warm-tone-check
```

---

**FAIL-3: The Flat Wax Seal**

*Symptom:* The wax seal looks like a flat disc with a stamp on it. There is no dome. The specular is diffuse across the whole surface. The relief symbol sits on top of the wax rather than being pressed into it.

*Why it happens:* The generation prompt did not specify dome geometry, the normal map is not driving specular correctly, or the diffuse texture was accepted without checking the WaxSealView implementation.

*Fix for art:* Regenerate with `"3D convex dome shape, single specular highlight at top-left of dome, intaglio relief symbol recessed below wax surface, not a flat disc"` added to prompt.

*Fix for shader:* Verify `WaxSealView` is applying the wax seal normal map. The single specular highlight should be at a fixed directional offset (not ambient) and should be warm-tinted, not white.

*Reference:* Compare against COMP-2 (wax seal category). Your seal must have the dome, single offset highlight, and intaglio relief all simultaneously correct.

---

**FAIL-4: Creatures Floating Above Their Backgrounds**

*Symptom:* The creature is clearly composited onto a background — there is a clean edge, the lighting on the creature doesn't match the background light source, or the background looks like a painted backdrop behind a figure.

*Why it happens:* The prompt separated figure from background too clearly, or img2img parameters for evolution didn't preserve enough background integration.

*Fix:* Add `"creature integrated with environment not posed against it, same light source on figure and background, figure casts shadow into environment"`. For evolution, reduce img2img strength slightly to preserve more background consistency.

*Reference:* Compare against OIL-2 (Night Watch) — the figures *emerge* from the background.

---

**FAIL-5: Too Much Horror, Not Enough Craft**

*Symptom:* Demonic or Endless faction output is gratuitously dark/violent in a way that reads as shock value rather than craft. The darkness serves spectacle rather than narrative weight.

*Why it happens:* Over-weighted dark descriptors in the prompt without corresponding quality and composition descriptors.

*Fix:* Add quality and composition descriptors to balance horror descriptors: `"museum-quality composition, darkness in service of narrative weight not spectacle, rendered with Old Master craft"`. Reference Caravaggio's Judith (OIL-4) — the darkness there is purposeful, not decorative.

---

**FAIL-6: Sound That Belongs to a Different App**

*Symptom:* A sound passes the CC0 check but when played alongside the card interaction it sounds like a mobile game from 2015. Plastic, bright, synthetic.

*Why it happens:* The downloaded sound, even after processing, doesn't have the physical material character of the card game.

*Fix:* Run the full ffmpeg warmth pipeline (high-pass at 40Hz, +1.5dB at 200Hz, -0.8dB at 8kHz, stereo narrowed to 80%). If it still sounds wrong after processing, the source sound is wrong — find a different recording. Search specifically for sounds of the physical material (cardstock, wax, wood) rather than abstract sound effects.

---

**FAIL-7: Too Pretty / High Fantasy**

*Symptom:* The output is technically correct oil paint — correct technique, correct brushwork, correct material differentiation — but it reads as a premium fantasy collectible rather than a field document from a war. The creature looks *posed*. The environment looks *designed*. The colors are too balanced and harmonious. You could imagine this on the wall of a gallery or on the box art of a AAA fantasy game.

*This is the most likely failure for Fey Verdant and Celestial Crusade assets, and for Common-rarity cards across all factions.*

*Why it happens:* The technique is right but the register is wrong. The model is defaulting to "high fantasy illustration aesthetic" which happens to share some surface qualities with Old Master oil painting. The output looks like a skilled artist painted a collectible card — not like a field document from a world at war.

*Specific tells:*
- Fey creature looks *magical* and *enchanting* rather than *ancient* and *territorial*
- Celestial creature looks *beatific* rather than *geometrically wrong and terrifying*
- Environment looks like a backdrop — beautiful, composed, lit for presentation
- The subject appears to be *displaying itself* rather than *caught in the act of existing*
- Colors are harmonious and pleasing rather than specific and earned

*Fix:* Do not change the technique. Change the subject description and environmental context. The creature is not posing — it is occupied with something. The environment is not a backdrop — it is a place that existed before the creature arrived and will exist after it leaves. Add specific evidence of the world's history: debris, wear, evidence of previous violence or struggle, materials that carry weight. For Fey: roots that have broken through something. For Celestial: a geometrically impossible form that the painter has rendered with painstaking craft precisely because it hurts to look at.

*Prompt additions for Fey Verdant:* `ancient territorial presence not enchanted magic, creature occupied with its own purposes not posing, undergrowth that has absorbed many seasons of death, roots breaking through masonry`

*Prompt additions for Celestial:* `geometrically wrong and disturbing, too many wings at impossible angles, eyes that should not be where they are, rendered with precise craft that makes the wrongness worse, cold gold not warm gold`

*Reference:* Compare against the grimdark directive's per-faction war-camp descriptions. If your output doesn't match the material evidence described there, it has failed this test regardless of technical quality.

---

## Part II: Agent Tools

### 2.1 Tool Index

All tools the agent can use for this project, with their purpose and when to invoke them.

| Tool | Type | Purpose | When to use |
|---|---|---|---|
| `fal.ai API` | API | Image generation (non-creature art, test iterations) | Any non-creature card art, all icon/symbol generation, cheap test iterations |
| `Replicate API` | API | Creature art via LoRA | Creature artwork, evolution img2img |
| `Met Museum API` | API (no key) | CC0 reference images, training data | Finding reference paintings, downloading training data |
| `Rijksmuseum API` | API | CC0 reference images, training data | Dutch/Flemish painting references, training data |
| `Freesound API` | API | CC0 sound FX download | All sound asset sourcing |
| `Poly Haven API` | API | CC0 PBR textures | Parchment, canvas, other material textures |
| `ImageMagick` | CLI | Image processing, color grading, analysis | Post-processing all generated art, faction color grading, dominant color extraction |
| `ffmpeg` | CLI | Audio processing | All sound file processing (warmth EQ, loudness normalization, format conversion) |
| `pngquant` | CLI | PNG compression | Reducing asset file sizes before Xcode import |
| `Pillow/numpy` | Python | Asset verification, analysis | Running automated quality checks |
| `verify_asset.py` | Script | Quality gate | After every generation call — never skip |
| `grade_artwork.sh` | Script | Faction color grading | After every approved artwork |
| `Figma MCP` | MCP | Card layout reference, color tokens | When verifying measurements or color P3 values |
| `web_fetch` | Built-in | Fetch reference images for vision comparison | Before generating each asset category |

---

### 2.2 Generation APIs

#### fal.ai

```python
# Install once
pip install fal-client requests --break-system-packages

# .env key: FAL_KEY

import fal_client, os, requests
from pathlib import Path

os.environ["FAL_KEY"] = os.environ.get("FAL_KEY", "")

def generate_image(prompt: str, model: str = "fal-ai/flux/schnell",
                   steps: int = 4, guidance: float = 0.0,
                   output_path: str = "Staging/output.png") -> bool:
    """Generate an image via fal.ai. Returns True on success."""
    try:
        result = fal_client.run(model, arguments={
            "prompt": prompt,
            "num_inference_steps": steps,
            "guidance_scale": guidance,
            "image_size": "square_hd",   # 1024×1024
            "num_images": 1,
            "output_format": "png",
        })
        url = result["images"][0]["url"]
        resp = requests.get(url, timeout=60)
        Path(output_path).write_bytes(resp.content)
        return True
    except Exception as e:
        print(f"fal.ai generation failed: {e}")
        return False

# Model selection guide:
# fal-ai/flux/schnell  — Apache 2.0, ~$0.003/image, 4 steps — USE FOR TESTING
# fal-ai/flux/dev      — BFL commercial API, ~$0.025/image, 28 steps — USE FOR FINALS
# fal-ai/flux-pro      — Highest quality, ~$0.05/image — USE FOR LEGENDARY/HERO ART

# IMPORTANT: Test every prompt on schnell first. Only run dev/pro on approved prompts.
# Budget saved on test iterations is budget available for more final assets.
```

#### Replicate (creature art with LoRA)

```python
# Install once
pip install replicate --break-system-packages

# .env keys: REPLICATE_API_TOKEN, LORA_URL

import replicate, os, requests
from pathlib import Path

SDXL_MODEL = "stability-ai/sdxl:39ed52f2319f9b723b1b4ed18b9edd6f78c97bcf8d4e2b70e72a3a449673f77"

def generate_creature(prompt: str, negative_prompt: str,
                      output_path: str, lora_scale: float = 0.85) -> bool:
    lora_url = os.environ.get("LORA_URL")
    if not lora_url:
        raise RuntimeError("LORA_URL not set — run verify_environment.sh first")
    
    output = replicate.run(SDXL_MODEL, input={
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "extra_lora": lora_url,
        "lora_scale": lora_scale,
        "num_inference_steps": 35,
        "guidance_scale": 7.5,
        "width": 1024, "height": 1024,
    })
    
    if not output:
        return False
    
    url = output[0] if isinstance(output, list) else str(output)
    resp = requests.get(url, timeout=120)
    # Download IMMEDIATELY — Replicate output URLs expire after ~1 hour
    Path(output_path).write_bytes(resp.content)
    return True

# Universal negative prompt — append to every creature generation
CREATURE_NEGATIVE = (
    "MTG, Magic the Gathering, Pokémon, Yu-Gi-Oh, photorealistic, 3D render, "
    "digital art, anime, smooth, plastic, watermark, signature, text, card frame, "
    "any trademarked character, ugly, deformed, extra limbs, flat colors"
)
```

---

### 2.3 Reference APIs (CC0 Sources)

#### Met Museum — No API key required

```python
import requests

MET = "https://collectionapi.metmuseum.org/public/collection/v1"

def met_search(query: str, department_id: int = 11) -> list[dict]:
    """Search Met Museum for CC0 paintings. Returns list of objects with image URLs.
    Department 11 = European Paintings. No API key needed."""
    
    ids = requests.get(f"{MET}/search", params={
        "q": query, "departmentId": department_id, "isPublicDomain": "true"
    }).json().get("objectIDs", []) or []
    
    results = []
    for obj_id in ids[:10]:
        obj = requests.get(f"{MET}/objects/{obj_id}").json()
        if obj.get("primaryImage"):
            results.append({
                "title": obj.get("title"), "artist": obj.get("artistDisplayName"),
                "date": obj.get("objectDate"), "medium": obj.get("medium"),
                "image": obj["primaryImage"], "license": "CC0"
            })
    return results

# Example: find Baroque oil paintings of battles for Ironwright training data
for r in met_search("battle scene oil painting baroque"):
    print(f"{r['title']} — {r['artist']}\n  {r['image']}")
```

#### Rijksmuseum API

```python
import requests, os

def rijks_search(query: str, count: int = 5) -> list[dict]:
    """Search Rijksmuseum for CC0 paintings. All public domain objects are CC0."""
    key = os.environ.get("RIJKS_API_KEY")
    if not key:
        raise RuntimeError("RIJKS_API_KEY not set in .env")
    
    results = requests.get("https://www.rijksmuseum.nl/api/en/collection", params={
        "key": key, "q": query, "type": "painting",
        "imgonly": "true", "ps": count, "s": "relevance"
    }).json().get("artObjects", [])
    
    return [{"title": r["title"], "artist": r["principalOrFirstMaker"],
             "image": r["webImage"]["url"], "id": r["objectNumber"], "license": "CC0"}
            for r in results if r.get("webImage", {}).get("url")]
```

#### Freesound — CC0 sounds only

```python
import requests, os

def freesound_search_cc0(query: str, max_duration: float = 2.0) -> list[dict]:
    """ALWAYS returns CC0 sounds only. The license filter is not optional."""
    key = os.environ.get("FREESOUND_API_KEY")
    if not key:
        raise RuntimeError("FREESOUND_API_KEY not set in .env")
    
    resp = requests.get("https://freesound.org/apiv2/search/text/", params={
        "query": query,
        "license": "http://creativecommons.org/publicdomain/zero/1.0/",  # CC0 HARDCODED
        "filter": f"duration:[0 TO {max_duration}]",
        "fields": "id,name,duration,license,previews",
        "sort": "rating_desc", "token": key
    }).json()
    
    results = resp.get("results", [])
    # Verify license on every result — the filter parameter isn't always enforced
    cc0_only = [r for r in results if "publicdomain/zero" in r.get("license", "")]
    
    return [{"id": r["id"], "name": r["name"], "duration": r["duration"],
             "preview": r["previews"]["preview-hq-mp3"]}
            for r in cc0_only]

def freesound_download(sound_id: int, output_path: str) -> bool:
    key = os.environ.get("FREESOUND_API_KEY")
    sound = requests.get(f"https://freesound.org/apiv2/sounds/{sound_id}/",
                         headers={"Authorization": f"Token {key}"}).json()
    url = sound.get("download")
    if not url: return False
    resp = requests.get(url, headers={"Authorization": f"Token {key}"}, stream=True)
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(8192): f.write(chunk)
    return True
```

---

### 2.4 Processing CLIs

#### ImageMagick — Image analysis and grading

```bash
# After any generation, check dominant colors (should align with faction palette)
convert generated_art.png -colors 8 -format "%c" histogram:info: | sort -rn | head -8

# Check if any pure white exists (should return 0 for correct output)
convert generated_art.png -threshold 99% -format "%[fx:mean]" info:
# Returns value close to 0 if no near-white pixels

# Run faction color grade (required before any art goes to Xcode)
# Full script in CARD_DESIGN_GUIDE_FINAL.md §3.4
bash Scripts/grade_artwork.sh <input.png> <faction> <output.png>

# Quick resize and crop for training data preparation
convert input.jpg -resize 1024x1024^ -gravity center -extent 1024x1024 output.jpg

# Extract color channels to check temperature
convert input.png -separate -channel R -format "%[fx:mean]" info:  # red mean
convert input.png -separate -channel B -format "%[fx:mean]" info:  # blue mean
# Red should be higher than blue for warm output
```

#### ffmpeg — Audio processing pipeline

```bash
# Full warmth processing pipeline — run on every downloaded sound before use
ffmpeg -i input.wav \
  -af "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB:stop_periods=-1:stop_duration=0.1:stop_threshold=-50dB,\
       highpass=f=40,\
       equalizer=f=200:t=h:width=200:g=1.5,\
       equalizer=f=8000:t=h:width=2000:g=-0.8,\
       loudnorm=I=-18:TP=-1:LRA=7,\
       pan=stereo|c0=0.9*c0+0.1*c1|c1=0.9*c1+0.1*c0" \
  -ar 44100 processed.wav -y

# Encode to final iOS format
ffmpeg -i processed.wav -c:a aac -b:a 192k final.m4a -y

# Check loudness of output (should be close to -18 LUFS)
ffmpeg -i processed.wav -filter:a loudnorm=print_format=json -f null - 2>&1 | \
  python3 -c "import sys,json,re; data=re.search(r'\{.*\}',sys.stdin.read(),re.DOTALL); print(json.loads(data.group()))"

# Batch process all raw sounds in Staging/raw_sounds/
for f in Staging/raw_sounds/*.wav; do
  name=$(basename "$f" .wav)
  ffmpeg -i "$f" \
    -af "highpass=f=40,equalizer=f=200:t=h:width=200:g=1.5,loudnorm=I=-18" \
    "Resources/Sounds/${name}.wav" -y
done
```

---

### 2.5 Quality Verification

**Always run `verify_asset.py` after every generation call.** This script is defined in full in CARD_DESIGN_GUIDE_FINAL.md §5.7 — do not create a duplicate. The file lives at `Scripts/verify_asset.py`.

```bash
# Standard verification after generation
python3 Scripts/verify_asset.py Staging/generated.png \
  --min-width 1024 --min-height 1024 \
  --no-error-payload \
  --warm-tone-check

# Verify wax seal (smaller acceptable minimum)
python3 Scripts/verify_asset.py Resources/Textures/wax_seal_rare.png \
  --min-width 256 --min-height 256 \
  --no-error-payload
```

For the full multi-axis visual quality review workflow, see the Refinement Loop Procedure in CARD_DESIGN_GUIDE_FINAL.md §5.4. When running that workflow, add this as axis 7 (after the six technical axes defined there):

**Axis 7 — War camp register**: Close your eyes. Imagine you are in a war camp at the edge of a contested Planar Ruin. You pick up a card from the table. Open your eyes and look at the generated asset. Does it feel like that card? If yes: pass. If no: which specific element reads as "premium collectible" or "high fantasy" rather than "field document"? Apply FAIL-7 fix for that element.

This axis is the last line of defense for Fey Verdant and Celestial Crusade assets, which have the strongest pull toward prettiness. A technically perfect asset that fails axis 7 needs its subject description revised, not its technique.

---

### 2.6 Figma MCP

The Figma MCP is connected. Use it when you need ground truth on card layout measurements or color token P3 values. **Do not guess measurements — query Figma.**

To use the Figma tools, you need the file key and node ID from the Figma URL:
- URL format: `https://figma.com/design/{fileKey}/{fileName}?node-id={nodeId}`
- nodeId uses hyphens in URLs (`1-2`) but colons in API calls (`1:2`)

```
Available Figma tools:
  get_design_context(fileKey, nodeId)   — full design specs: dimensions, colors, text styles
  get_screenshot(fileKey, nodeId)        — rendered image of any component
  get_variable_defs(fileKey, nodeId)     — color token P3 values
```

**When to call Figma:**
- Before implementing any card layout measurement — verify the zone dimensions match CARD_DESIGN_GUIDE_FINAL.md §1.4
- When checking a color token value (Figma variables are the source of truth for P3 values)
- When generated artwork needs to be verified against the art box dimensions
- After any layout change — screenshot the relevant Figma component and compare against your simulator screenshot

**When NOT to call Figma:**
- Figma is not a substitute for reading the design guide — read first, verify with Figma when uncertain
- Do not generate artwork from a Figma screenshot — use the written references in this document

---

### 2.7 The Generation Budget Discipline

Before any generation call, update `Logs/BUDGET_LEDGER.md`. Never spend money without logging it first.

```
Rule 1: Every prompt is tested on fal-ai/flux/schnell (~$0.003) before running on dev (~$0.025).
         This means test iterations cost ~12% of production iterations.
         Always iterate to an approved prompt before spending production budget.

Rule 2: Never run more than 3 iterations of the same prompt without changing something
         meaningful in the prompt or parameters. If 3 iterations all fail, the problem
         is the approach, not the parameters. Re-read the relevant references in Part I.

Rule 3: Immediately download any generated image URL. Replicate URLs expire in ~1 hour.
         fal.ai URLs may also expire. Write bytes to disk before doing anything else.

Rule 4: Log every API call in BUDGET_LEDGER.md with: task name, service, model, cost,
         whether accepted or rejected. Rejected calls still cost money and must be logged.
```

---

### 2.8 What the Agent Cannot Do Without Human Help

Flag these in `Logs/iteration_log.md` as `⚠️ REQUIRES HUMAN` and halt dependent work.

- **Haptic testing** — Simulator cannot test haptics. Flag every AHAP file pending physical device verification.
- **Xcode Instruments profiling** — GUI only. Write the profiling checklist (CARD_DESIGN_GUIDE_FINAL.md §13.1) to the log and await human.
- **License screenshots** — Any licensing page (CivitAI, etc.) requires a human to visit and screenshot.
- **LoRA training data audit** — Auto-captions are unreliable. Flag 10% of training image captions for human review before training begins.
- **App Store submission** — Requires Apple Developer credentials.

---

*This document gives the agent eyes (references) and hands (tools). Neither substitutes for the primary design authority: CARD_DESIGN_GUIDE_FINAL.md.*

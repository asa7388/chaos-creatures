# Chaos Creatures — Grimdark Aesthetic Directive
## The Emotional North Star for All Design Decisions
### Version 1.0 — Supersedes the "physical artifact" framing in CARD_DESIGN_GUIDE_FINAL.md §1.1

**Authority:** This document sharpens and overrides the aesthetic *register* in §1.1 of the Card Design Guide. All technical specifications in the Guide (measurements, shaders, fonts, color tokens) remain authoritative. When the Guide describes *how* to build something, follow it. When this document describes *what it should feel like*, follow this.

---

## The One Question That Replaces All Others

The existing guide asks: *"Does this look like it could be held in a hand?"*

Replace that question with: **"Does this look like it was made in a world that has been at war for two hundred years?"**

A card in this game is not a premium collectible produced in a sterile factory. It is a **field document** — made from available materials, by people who needed it to work, in a civilization where every faction has been fighting every other faction across multiple planes of existence for two centuries. The parchment was scraped from something. The ink has iron in it. The wax seal was pressed while the camp was still smoking. The gold on Legendary cards is looted, not minted.

If a design decision makes the card look *nicer* but less *used*, it is wrong. If it makes it look more *premium* but less *physical*, it is wrong. The target is not the museum. The target is the war chest.

---

## The Physical Environment These Cards Come From

Before implementing any component, hold this image: a field commander's tent in a Chaos Creatures war camp. On the folding table:

- **Ironwright camp:** The table is bolted steel. The cards are written on industrial-grade vellum stamped from a press. The ink is carbon black with visible metallic particles — it catches the reactor-blue overhead light. The edges of older cards show abrasion from armor gauntlets. A few cards have small dents from being set down on metal surfaces. Nothing is decorative. Everything is functional.

- **Fey camp:** The table is a living root, still growing. The cards are written on material that is part parchment, part dried membrane — warm cream with visible vein structure in the fiber. Some cards have a faint green tint where bioluminescent sap has seeped through. Older cards smell of earth and rot. The faction seal is pressed in tree resin, not wax — it still has bark texture on its underside.

- **Demonic camp:** The table is obsidian slab over iron legs. The cards are written in blood-ink on bone-pale vellum — the red-brown of old blood, not fresh scarlet. Some cards have been signed in what appears to be a binding contract signature: the owner's mark in a darker, denser ink, corner of the text box. Wax seals are deep blood-red and smell faintly of sulfur. Legendary cards have small cracks in the vellum where a contract was renegotiated under duress.

- **Celestial camp:** The camp is more fortress than tent — white stone that never looks quite real, too geometric. The cards are immaculate compared to others, but immaculate in the way a sword kept obsessively clean is immaculate — this cleanliness is itself martial. The gold on Celestial cards is burnished not gilded. The edges are sharp. The wax seal is pressed with absolute precision. But the artwork is terrifying: beings with too many wings, too many eyes, geometries that hurt. The parchment is white in a way that feels wrong next to any other card.

- **Endless camp:** There is no camp, only a site. The cards are older than any living faction, some of them — reused, repurposed, written over earlier text that bleeds through. Bone dust worked into the ink makes it slightly grey rather than pure black. Some text boxes contain notes written by previous owners, scratched faintly into the vellum. The wax is dark, near-black at rarity extremes. The parchment has aged to a brown-grey that reads as wrong next to living factions' cards. These cards have survived things. It shows.

None of this is literal — you are not rendering blood stains on every card. You are rendering the *material consequence* of existing in a world where these factions are real.

---

## The Strategic Differentiation

Major card game developers compete on digital spectacle: particle effects, 3D transforms, dynamic lighting, screen-filling animations. This game cannot win that competition and will not try.

The competitive advantage is in the *opposite direction*: while every other mobile card game looks like a video game, Chaos Creatures looks like **a physical object that happens to be on a screen**. The player feels like they are handling something real. The effects are not flashy — they are *weighty*. A card being played feels like setting down a heavy thing. A card dying feels like something being lost.

**This asymmetry is the product identity.** It must be pursued aggressively, not hedged.

Practical consequences:
- When choosing between a more impressive animation and a more physically grounded one, always choose physical.
- When choosing between a crisper visual and a more tactile one, always choose tactile.
- When a design element looks "cool" in a digital sense, it is probably wrong.
- When a design element looks like it would be at home in a 3D video game, it is wrong.
- When a design element looks like it could exist as a physical card in a war chest, it is right.

---

## Material Register by Component

### The Parchment Body

Not cream paper. Not beige background. **Scraped hide.** The fiber structure is visible because the surface is not uniformly smooth — it was prepared by hand. The color is warm but uneven: slightly darker at the edges where handling has compressed the surface, slightly lighter in the writing zones where the scribe scraped it smoother. In raking light (the way a phone screen delivers light) the surface texture should be perceptible.

The dark mode equivalent is not "dark parchment." It is the card being read by **lamplight in the tent** — the parchment-dark-mode color is the same card with warmth turned all the way down, lit by a single candle. The result should feel like the card has been in use since before the light changed.

**What it is not:** Aged paper from a stationery store. A texture overlay on a white background. A CSS gradient. A beige rectangle.

### The Ink

Letterpress quality means the ink has *penetrated* the surface, not been *printed on* it. At the scale of card text, this is a subtle effect — the edges of letterforms are not perfectly crisp, they have a faint micro-roughness where the fiber of the parchment interrupted the ink flow. The text has weight. It was pressed into the surface by a tool with mass.

This effect is implemented in the LetterPress shader and in the typography shadow spec. But the *intent* behind it is that this text was written by someone who needed it to last. Field conditions. Expedition conditions. The kind of permanence you get when you know the document may be your only record.

**What it is not:** Clean web typography. San Francisco system font. Any font that reads as a UI element.

### The Wax Seal

The wax seal is the most physically specific element on the card. It communicates two things simultaneously — rarity (through color) and faction (through embossed symbol) — and it does so through a physical process: hot wax poured, then pressed with a stamp bearing the faction symbol, then cooled.

The physical process leaves evidence: the dome shape from the pooled wax, the displacement ring around the embossed symbol where the stamp pushed wax outward, the edge irregularity where the wax flowed before setting, the single specular highlight that tells you the surface is convex. Every one of these physical artifacts must be present in the generated seal images and in the WaxSealView shader.

A flat disc with a symbol on it is not a wax seal. It is a sticker. It is wrong regardless of how well-designed it is otherwise.

**What it is not:** A badge. A coin. A medal. A flat circle with texture applied.

### The Artwork

The artwork for each card depicts a creature, spell effect, or location from a world that has been at war for two hundred years. The painting style is Old Master oil — Rembrandt, Caravaggio, Wright of Derby, Piranesi — but the *subject matter* is grimdark, and the two must coexist without softening either.

Rembrandt painted dissections, military companies, and merchants. He painted with warmth and craft, but he didn't sanitize his subjects. That is the model: the craft is museum-quality, the subject is war-camp visceral. A Demonic Kingdoms creature is genuinely terrifying, rendered with the same care and physical weight that Caravaggio brought to Judith and Holofernes. An Ironwright construct is genuinely vast and brutal, rendered with the same specificity Piranesi brought to his imaginary prisons.

The artwork is *not* concept art. It is not illustration. It has the texture and light behavior of a painting that was made over days or weeks, not hours. The difference between a concept art style and a painting style is physical: concept art sits on top of its surface; a painting is *in* its surface.

**What it is not:** MTG card art. Fantasy RPG illustration. Anime. 3D render. Concept art. Digital painting. Airbrush. Gradient background with a posed figure in front of it.

### The Frame and Borders

The card frame is the structural element — the border that holds the card's zones together. It should read as the card's material support, like the wooden chassis of a painting. At Common rarity it is barely there — a matte edge that defines the card boundary. At Legendary rarity it has accumulated material: gold leaf applied over time, built up in layers, thicker in some places than others because it was applied by hand.

The frame does not glow. Glow is a digital artifact — a bloom filter, an emission shader. Physical gold does not glow; it *catches*. There is a difference: catching means one directional highlight that moves as the card tilts (the WarmFoilShader + CMMotionManager), and everything else reads warm-neutral. Glowing means light emanates from the surface in all directions simultaneously. Catching is physical. Glowing is digital. Always catching.

The rarity color bar at the bottom of the card is the exception — it is the *only* element that reads as a designed signal rather than a material artifact. Keep it thin (4pt), unornamented, and let the material quality of everything else make it read as a system marker rather than a digital decoration.

**What it is not:** A glowing frame. A gradient border with bloom. A neon edge. Chrome.

### The Typography

Cinzel and EB Garamond are correct for this project because they were designed to be cut in stone and pressed into paper respectively. They carry the weight of physical inscription. Oswald for stats because it reads with the mechanical clarity of something stamped rather than typeset.

No font in this app should look like it was made for a screen. If it reads as a UI element, it is wrong.

### The Animations and Haptics

Every animation should feel like *mass moving*. The card has weight. It doesn't bounce — it settles. The spring constants in the guide are calibrated for this. A card being selected presses down like a thumb pressing a real card. A card being released springs back with the stiffness of card stock, not the bounciness of a rubber toy.

The haptics reinforce materiality: the texture-bump of the foil tilt is not a strong pulse, it is a faint surface resistance, like running a finger over the raised embossing of a real card. The card flip has the weight of something actually rotating. The graveyard entry has the finality of something being set down on a stone surface.

**What they are not:** Flashy mobile game animations. Particle explosions on every interaction. Satisfying in a gamified way. Smooth, effortless, frictionless. Any animation that says "digital product."

### Sound

Card sounds are sounds of physical materials: card stock, wax, fabric, wood, metal. Not synthesized game sounds. Not confirmation tones. Not UI feedback bleeps. The draw sound is the sound of a card being pulled from a stack of stiff paper. The play sound is the sound of heavy cardstock being set on a surface. The foil shimmer is inaudible — the haptic carries that interaction.

Faction ambient audio is the environment sound of each faction's war camp: industrial hum and metal stress for Ironwright, forest ambience for Verdant Throne, forge roar for Furnace Lords, and so on. These are not musical. They are environmental.

---

## The Acceptance Test

Before marking any phase or component complete, apply this test. It is not a technical checklist — it is an experiential one.

Close your eyes. Imagine you are standing in a war camp at the edge of a contested Planar Ruin site. It is cold. There is smoke from the Ironwright forges two klicks away. You have just picked up a card from the table in front of you.

Open your eyes and look at the screen.

Does what you see feel like that card?

If yes: it is done.

If no: identify which element breaks the illusion and fix that element. One at a time. Until the illusion holds.

---

## Document Hierarchy

When this document and the Card Design Guide conflict on *register* or *feeling*, this document wins.
When the Card Design Guide specifies *measurements*, *shader parameters*, *timing values*, or *technical implementation*, the Card Design Guide wins.
When the ASSET_CREATION_GUIDE_v1.1 or VISUAL_REFERENCE_LIBRARY_AND_TOOLS_v2 specify *how to generate assets*, those documents win for their domain.

This document answers: **what should it feel like?**
The Card Design Guide answers: **how do I build it?**
The Asset docs answer: **how do I generate the imagery?**

All three questions have the same answer: a field document from a two-hundred-year war, made with whatever was available, by people who needed it to last.

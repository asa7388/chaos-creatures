# Chaos Creatures — Visual Design & Art Direction Guide for AI Agents

## Revision Log

| Date | Version | Changes |
|---|---|---|
| 2026-02-19 | v1.0 | Initial creation — complete card layout specification, UI direction, art style rules, faction palettes, typography, texture system, information hierarchy, and interaction design |
| 2026-02-19 | v1.1 | Removed creature art generation guidance (handled externally). Added comprehensive AI generation workflows for textures, icons, card frames, UI elements, and all non-creature art. Added Section 17 (AI Asset Generation Playbook). |

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [The Core Problem & Solution](#2-the-core-problem--solution)
3. [Card Anatomy — Layout Specification](#3-card-anatomy--layout-specification)
4. [Art Style — Oil Palette Direction](#4-art-style--oil-palette-direction)
5. [Typography System](#5-typography-system)
6. [Color System — Faction Palettes](#6-color-system--faction-palettes)
7. [Iconography & Stat Design](#7-iconography--stat-design)
8. [Texture & Material System](#8-texture--material-system)
9. [Information Hierarchy & Tap-to-Discover](#9-information-hierarchy--tap-to-discover)
10. [App UI — Supporting the Physical Aesthetic](#10-app-ui--supporting-the-physical-aesthetic)
11. [Card States & Interactions](#11-card-states--interactions)
12. [Faction-Specific Card Variations](#12-faction-specific-card-variations)
13. [Rarity Treatments](#13-rarity-treatments)
14. [Reference Benchmarks](#14-reference-benchmarks)
15. [Common Mistakes to Avoid](#15-common-mistakes-to-avoid)
16. [Asset Checklist](#16-asset-checklist)
17. [AI Asset Generation Playbook](#17-ai-asset-generation-playbook)

---

## 1. Design Philosophy

### The Guiding Principle

**This game should feel like holding a collectible card that costs $300 on the secondary market.** Every visual decision must serve the illusion that the player is interacting with physical objects — thick matte cardstock, oil-painted canvas art, debossed text, foil stamping, and the subtle imperfections that make real printed materials feel premium.

### Three Pillars

**Pillar 1 — Materiality.** Every surface in the game should reference a physical material: cardstock, canvas, linen, leather, parchment, metal foil. If an element looks like it was rendered by a computer, it has failed. Flat color fills, hard pixel-perfect edges, uniform gradients, and drop shadows are the language of digital UI. This game speaks in fiber texture, ink absorption, emboss depth, and print grain.

**Pillar 2 — Restraint.** The difference between a cluttered card and a professional card is the courage to leave space empty. Professional card games succeed because their card frames breathe. Every stat, every icon, every line of text has a defined home with margin around it. When in doubt, remove an element rather than shrink it.

**Pillar 3 — Hierarchy.** A player glancing at a card during a fast-paced match needs to read four things in under one second: Attack, HP, Chaos Motes cost, and creature name. Everything else — flavor text, effects, faction, type, instability — exists in a secondary or tertiary layer that rewards closer inspection or tap interaction.

---

## 2. The Core Problem & Solution

### The Problem

The current implementation suffers from a disconnect: the main creature art is rendered in a beautiful oil-palette style, but it sits inside a card frame and UI that look like a generic mobile game. This creates visual dissonance — a museum painting displayed in a plastic frame. The card borders are too clean, the stat displays are too digital, the fonts are too modern, and the overall UI uses flat color panels and hard-edged containers that scream "app" instead of "card game."

### The Solution: The Canvas-and-Cardstock System

Every visual element in the game falls into one of two material categories:

**Canvas elements** are things that would be painted or printed with ink on a physical card — creature art, faction emblems, decorative borders, flavor text illumination. These use organic textures, visible brushwork, and the warm imperfection of physical media.

**Cardstock elements** are the structural components of the card and UI — the card frame itself, stat boxes, text fields, menu panels, buttons. These use matte paper texture, subtle fiber grain, soft rounded corners (as if die-cut), and the gentle shadow of physical thickness. No element should have a perfectly uniform color fill. Every cardstock surface gets a subtle noise/grain overlay at 3-8% opacity.

---

## 3. Card Anatomy — Layout Specification

### Overview: What Must Be Visible at a Glance

A card in the player's hand or on the battlefield must communicate the following without any interaction:

| Element | Position | Priority |
|---|---|---|
| Creature art | Center, dominant | Immediate — the eye goes here first |
| Card name | Top of card, overlapping or adjacent to art frame | Immediate |
| Attack (ATK) | Bottom-left corner | Immediate — large, bold |
| HP | Bottom-right corner | Immediate — large, bold |
| Chaos Motes cost | Top-right corner | Immediate — the "mana cost" equivalent |
| Faction identity | Card border color/texture + small emblem | Ambient — perceived without reading |

### What Can Be Tap-to-Discover

| Element | Access Method | Rationale |
|---|---|---|
| Instability value | Small indicator on card; full detail on tap | Important for strategy but not needed every glance |
| Effect modifiers (1–4) | Tap to expand card — scrollable effect list | Too variable in length for fixed layout |
| Flavor text | Tap to expand card — below effects | Lore reward for engaged players |
| Card type | Small text under card name; detail on tap | Secondary classification info |
| Faction + Sub-faction | Border communicates faction; sub-faction text on tap | Visual cues handle this passively |

### Card Layout Zones (Top to Bottom)

```
┌─────────────────────────────┐
│  [Faction Emblem]   [Chaos Motes ●●●] │  ← Header Band
├─────────────────────────────┤
│                             │
│                             │
│      CREATURE ART           │  ← Art Window (55-60% of card height)
│      (oil palette)          │
│                             │
│                             │
├─────────────────────────────┤
│  CARD NAME                  │  ← Name Bar (sits on border of art/text)
│  Card Type · Instability ◆  │  ← Subline
├─────────────────────────────┤
│  Effect 1 icon + text       │  ← Text Box (remaining space)
│  Effect 2 icon + text       │     1-2 effects visible; "..." if more
├────────┬───────────────┬────────┤
│ ⚔ 5  │              │ ♥ 8  │  ← Stat Corners
└────────┴───────────────┴────────┘
```

### Critical Proportions

The art window must dominate. On a physical card, the illustration is the centerpiece, and the frame exists to support it. Target **55-60% of total card height** for the art window. The text box below should be **20-25%**. The header and footer stat bars split the remaining **15-20%**.

The card's aspect ratio should be approximately **2.5:3.5** (standard poker card proportions, 63mm × 88mm). On a mobile screen, cards in hand will render at roughly 120-160px wide, so every element in the "at a glance" tier must be legible at that size.

### The Name Bar

The card name bar is the single most important typographic element. It should span the full width of the card between the art window and the text box, functioning as a visual bridge. The name should be set in a display typeface (see Typography section) with enough size to be readable when the card is at minimum hand-view scale. Consider placing the name bar so it slightly overlaps the bottom edge of the art frame — this is a classic physical card design technique that creates depth and connects the art to the information space.

### The Stat Corners

Attack and HP sit in the bottom-left and bottom-right corners respectively. These must be the **second thing the eye reads after the art**. They should be rendered as if physically stamped or debossed into the card — large numerals with a subtle inner shadow, sitting inside shaped containers (shields, circles, hexagons — see Faction Variations). The containers should feel like metal or enamel inlays set into the cardstock, not floating digital badges.

Chaos Motes cost sits in the top-right corner. Render each mote as a small glowing orb — a painted element, not a flat circle. If the cost is 1-4, show individual orbs. If higher, show a numeral inside a single mote container.

### The Text Box

The text box holds 1-2 effect modifiers visible by default, with a subtle visual indicator (a faint downward chevron or "..." in the faction's accent color) signaling that more content exists on tap. Effect text should be concise — keyword-based with a short descriptor. Each effect modifier gets a small icon to its left for quick visual parsing.

**Do not try to display all 4 possible effect modifiers on the card face at once.** This is the primary source of clutter. Show the first 1-2, and trust the tap-to-discover interaction for the rest. Players will learn this pattern immediately.

---

## 4. Art Style — Oil Palette Direction

### The Look

All creature art follows a palette knife oil painting aesthetic — thick, textured oil strokes with visible impasto, rich color layering, and the luminous depth that oil paint achieves when built up in multiple passes. The style references the tradition of fantasy illustration filtered through a painterly abstraction that emphasizes gesture and atmosphere over photorealism.

> **Note:** Creature art generation is handled by an external pipeline and is not covered in this guide. The direction below applies to all **non-creature painted elements** — faction emblems, decorative frame details, Chaos Mote orbs, effect icons, card-back art, and any hand-painted UI illustrations (e.g., menu-screen objects, pack art, promotional banners). These elements must match the creature art's oil-palette feel so the card reads as a single cohesive piece.

### Composition Rules (for Non-Creature Painted Elements)

- **Faction emblems** should look like wax-seal impressions or hand-painted heraldry — slightly irregular edges, visible brushwork, impasto highlights on raised surfaces. They are not flat vector logos.
- **Decorative border art** (the vines on Fey, the bone structures on Endless, the filigree on Celestial) should be rendered in the same painterly style, not as clean vector paths. These are painted details on a physical card, not digital ornaments.
- **Card-back art** is a single shared illustration (or per-faction set) that should be treated as a full painting — a Chaos Mote vortex, a planar shard field, or a faction-neutral cosmic scene. It must hold up to close inspection during pack opening and must match the impasto, canvas-texture quality of the creature art.

### Art Frame Treatment

The border between the art window and the card frame should not be a hard pixel edge. Use a vignette that darkens the art toward its edges, blending into the card border. This mimics the way physical cards use a printed frame that overlaps slightly onto the art, creating a natural transition between the painted image and the cardstock surface.

---

## 5. Typography System

### Font Selection Criteria

The typography must evoke physical printing — letterpress, foil stamping, or screen printing on cardstock. This means:

- **No system fonts.** No Helvetica, no San Francisco, no Roboto. These are digital-native typefaces that immediately break the physical illusion.
- **No novelty/fantasy fonts.** No Papyrus, no heavily stylized medieval blackletter for body text. These look cheap and hinder readability.
- **Serif or humanist typefaces** for body text — they reference the printing tradition and feel at home on cardstock.

### Recommended Font Stack

| Use | Style Direction | Examples |
|---|---|---|
| **Card Name (display)** | A refined serif or semi-serif with character — slightly condensed for long names, with distinctive letterforms that feel hand-crafted but remain legible at small sizes. | Garamond Premier Pro, Minion Pro, Cormorant Garamond, EB Garamond, or a bespoke serif. Avoid overly decorative display faces. |
| **Stat Numerals** | Bold, high-contrast numerals that read instantly — slightly condensed, with a tactile weight that suggests stamped metal. | Oswald Bold, Bebas Neue, or custom numerals with a slab-serif or industrial character. Must be legible at 10px rendering height. |
| **Effect/Body Text** | A clean, warm serif or humanist sans for readability at small sizes. | Source Serif Pro, Lora, Alegreya, or Alegreya Sans. Needs to be readable at 9-10pt equivalent on mobile. |
| **UI Elements (menus, buttons)** | A humanist sans-serif that doesn't feel sterile — warm, slightly rounded, with enough personality to not feel like a tech product. | Fira Sans, Source Sans Pro, or Nunito. Used sparingly and only for meta-UI, never on cards. |
| **Flavor Text** | Italic variant of the body font. | Emphasizes that flavor text is a different register — lore, not mechanics. |

### Typography Anti-Patterns

- **Do not use more than 3 typefaces** across the entire game (display, body, UI). More than three creates visual noise.
- **Do not use pure white text on dark backgrounds.** Use an off-white (e.g., #F0EAD6, a parchment cream) to reduce harshness and reinforce the physical paper feeling.
- **Do not use outer glow or neon-style text effects.** If text needs to pop against a complex background, use a subtle dark vignette behind it (as if the card has a printed text field), not a digital glow.
- **Do not center-align effect text.** Left-align all mechanical text. Center alignment is reserved for the card name and flavor text only.

---

## 6. Color System — Faction Palettes

Each faction has a distinct palette that defines its card border, accent elements, and overall atmosphere. These palettes are drawn directly from the lore bible's visual descriptions and art prompts.

### Master Palette

| Faction | Primary Border | Accent | Card Frame Tint | Text Box BG | Art Mood |
|---|---|---|---|---|---|
| **Ironwright** | Steel gray (#6B7280) | Reactor blue (#3B82F6) | Cool dark iron (#2D3748) | Matte gunmetal (#374151) | Cold, industrial, brutalist |
| **Fey — Verdant** | Deep emerald (#065F46) | Bioluminescent gold (#D4AF37) | Warm moss (#1B4332) | Parchment-moss tint (#F0EAD6 + green shift) | Dappled forest light |
| **Fey — Hollow** | Bone white / frost (#D1D5DB) | Ice blue (#93C5FD) | Cold birch (#E5E7EB with blue tint) | Pale frost (#F9FAFB) | Moonlit winter, eerie |
| **Demonic — Furnace** | Obsidian black (#1F1F1F) | Volcanic orange-red (#DC2626) | Deep volcanic (#450A0A) | Charred parchment (#292524) | Chiaroscuro, lava-lit |
| **Demonic — Bureaucracy** | Dark obsidian (#1C1917) | Muted blood-red (#991B1B) | Bureaucratic dark (#1C1917) | Dusty parchment (#D6D3D1 with sepia) | Dim office-light, oppressive |
| **Celestial — Knights** | Ivory gold (#D4AF37) | Divine blue (#3B82F6) | Warm ivory (#FFFBEB) | Illuminated parchment (#FEF3C7) | Golden hour, heavenly |
| **Celestial — Chosen** | Burning gold (#F59E0B) | Rose-white (#FFF1F2) | Radiant cream (#FFFBEB) | Light-warped parchment (#FEF3C7) | Overwhelming divine light |
| **Endless — Cabals** | Bone (#D6D3D1) | Necrotic teal (#2DD4BF) | Aged bone (#44403C) | Yellowed parchment (#F5F0E1) | Subterranean, cold |
| **Endless — Spectres** | Spectral gray (#9CA3AF with transparency) | Sickly green (#4ADE80) | Fog gray (#374151 at 80% opacity) | Translucent smoke (#1F2937 at 70%) | Foggy, ethereal |

### Color Rules

- **The faction palette should be identifiable in peripheral vision.** A player should know a card's faction before reading any text, purely from the color temperature and accent tone of the card frame.
- **Dark factions (Demonic, Ironwright, Endless Cabals) use light text.** Off-white (#F0EAD6) for body text, slightly brighter for stat numerals.
- **Light factions (Celestial, Fey Verdant) use dark text.** Deep warm black (#1C1917) for body text, not pure #000000.
- **The Fey Hollow Court and Endless Spectres** use a high-contrast split — pale frames with dark text, but with desaturated, eerie accent colors that distinguish them from the "warm light" factions.
- **Never use faction colors at full saturation for large areas.** Saturated color is reserved for small accents — stat icons, mote orbs, ability keywords. Large areas use desaturated, textured versions of the faction color.

---

## 7. Iconography & Stat Design

### Icon Design Philosophy

Every icon must look like it could be **physically embossed, stamped, or printed onto a real card.** This means:

- **Monochrome or duotone.** Icons use the faction's accent color on the card's background, or metallic (gold, silver, bronze) treatments. No multi-color illustrated icons — those look like mobile game UI.
- **Slightly rounded, organic edges.** Not pixel-perfect geometry. The subtle softness of a stamp or die-cut.
- **Consistent stroke weight.** All icons in a set should share the same visual weight so they feel unified.
- **A subtle bevel or inner shadow.** Just enough to suggest that the icon is pressed into the cardstock, not floating on top of it. This is the single biggest differentiator between "digital icon" and "printed icon."

### The Four Key Stat Icons

| Stat | Icon Concept | Visual Treatment |
|---|---|---|
| **Attack (ATK)** | A fractured blade or serrated shard — referencing the Great Fracture and the world's broken state. Not a generic sword. | Rendered as a metallic inlay in the card's bottom-left corner. The numeral sits inside or adjacent to the icon. Color: faction-specific metal (iron for Ironwright, gold for Celestial, obsidian for Demonic, bone for Endless, living wood for Fey). |
| **HP** | A cracked shield or a planar shard — evoking both protection and the fragility of the shattered world. | Rendered as a metallic inlay in the card's bottom-right corner, mirroring the ATK treatment. Same faction-specific materials. |
| **Chaos Motes** | Small orbs of swirling energy — painted, not flat. Each orb should have internal color variation (a brighter core, darker edge) suggesting raw planar energy. | Top-right corner. Individual orbs for costs 1-4. For costs 5+, a single larger orb with the numeral inside. The orbs should have a subtle painted glow — not a digital outer-glow effect, but a warm/cool halo rendered in brushstroke texture. |
| **Instability** | A single diamond or crystalline shard indicator, filled proportionally or marked with a value — referencing Planar Shards. | Small and secondary — lives near the card name or subline. Shown as a small printed symbol with the numeric value, not a progress bar. On tap-expand, this becomes a more detailed readout. |

### Effect Modifier Icons

Each effect modifier displayed in the text box gets a small icon prefix. These icons should be drawn from a unified set of approximately 15-20 symbols covering the game's keyword mechanics. They should be simple, monochromatic glyphs that read at 12-16px — similar in complexity to professional card game mana symbols or keyword ability icons.

Design them as a set: consistent weight, consistent style, consistent metaphor language. Every icon should be recognizable without its text label after the player has seen it 3-4 times.

> **AI generation guidance for icons is covered in Section 17.4 (Icon & Glyph Generation).**

---

## 8. Texture & Material System

This section is the most critical for eliminating the "digital" feeling. Every surface in the game needs a texture layer.

### Card Textures

| Surface | Texture | Application |
|---|---|---|
| **Card base** | Matte cardstock grain — a subtle, fine-grained noise that mimics thick premium card paper (300gsm+). | Applied as a full-card overlay at 5-8% opacity. Should be slightly visible on all card areas including the text box and border. |
| **Art window** | Canvas weave — a woven linen/canvas texture that reinforces the oil-painting aesthetic. | Applied over the creature art at 3-5% opacity. Subtle enough not to interfere with art detail, strong enough to prevent the art from looking like a digital image pasted onto a card. |
| **Card border/frame** | Depending on faction: brushed metal, aged wood grain, weathered stone, cracked obsidian, or frosted glass. | Applied to the card border at 8-15% opacity. This is what makes the border feel like a real material instead of a flat color fill. |
| **Text box background** | Parchment — a warm, slightly uneven paper texture with very faint foxing (age spots). | Applied to the text box area. Should feel like a separate piece of paper laid into the card frame, slightly different in tone from the main card body. |

### UI Textures

| Surface | Texture | Application |
|---|---|---|
| **Menu backgrounds** | Dark leather or bookcloth — the material of a collector's binder or a game box interior. | Applied to all full-screen backgrounds (collection screen, deck builder, main menu). |
| **Buttons** | Embossed cardstock or stamped metal, depending on context. | Buttons should feel like they are physically raised elements. Use inner light/shadow to simulate thickness, not a flat drop shadow. |
| **Panels/containers** | Parchment or card-paper — lighter panels on the leather background, as if papers laid on a table. | Stat panels, info overlays, and detail views use this treatment. |
| **Battlefield surface** | A textured play mat — woven nylon or felt — with a subtle pattern that references the Plane of Chaos (faint, abstract, cosmic). | The play area where cards are placed during matches. |

### Texture Anti-Patterns

- **Never use a texture at over 20% opacity.** Textures should be felt, not seen. If a player consciously notices the texture, it's too strong.
- **Never use a single noise layer for everything.** Each material type needs its own texture — cardstock grain is different from canvas weave, which is different from leather, which is different from parchment.
- **Never apply textures that tile visibly.** All texture maps must be large enough (minimum 512x512px) or blended to prevent visible repeat patterns on mobile screens.
- **Never skip the texture pass.** A flat color fill is always wrong in this game's visual language. Every surface gets texture, no exceptions.

> **AI generation guidance for textures is covered in Section 17.2 (Texture & Material Generation).**

---

## 9. Information Hierarchy & Tap-to-Discover

### The Three Tiers

**Tier 1 — Glance (0.5 seconds).** What the player sees when a card is in their hand at minimum size or on the battlefield at game-view zoom:
- Creature silhouette (art)
- Faction (border color)
- ATK and HP (corner stats)
- Chaos Motes cost (top-right)
- Card name (name bar)

**Tier 2 — Focus (2-3 seconds).** What the player sees when they hold a finger on a card or it's zoomed to medium view during play:
- Card type (subline text)
- Instability value (near name)
- First 1-2 effect modifiers (text box)
- The "more" indicator if additional effects exist

**Tier 3 — Inspect (intentional tap).** What the player sees when they deliberately tap to expand the card to a full-screen detail view:
- All effect modifiers (1-4), fully described
- Flavor text (below effects, in italic)
- Faction and sub-faction names (header area)
- Full instability breakdown
- Card rarity indicator
- Evolution state / history (if applicable)
- Full-resolution art (pinch to zoom)

### The Expand Interaction

When a player taps a card, it should animate into a full-screen detail view that feels like picking up a physical card and holding it close to your face. The animation should:

- Scale the card up smoothly from its in-game position
- Add a subtle depth-of-field blur to the background (everything behind the card goes out of focus)
- Reveal the hidden content (effects 3-4, flavor text) with a gentle fade-in or slide, as if turning the card to catch the light
- Show a "close" gesture hint (swipe down or tap outside)

**This is not a modal dialog.** It is a physical interaction — picking up a card, examining it, putting it back. The transition must feel tactile, not like a popup.

---

## 10. App UI — Supporting the Physical Aesthetic

### The Collector's Table Metaphor

The entire app UI should feel like a **collector's workspace** — a dark leather-topped table where cards, binders, and game materials are spread out. This metaphor informs every screen:

| Screen | Metaphor | Visual Treatment |
|---|---|---|
| **Main Menu** | The table surface with key items placed on it | Dark leather/bookcloth background. Menu options presented as physical objects (a deck box, a map, a binder) rather than flat buttons. Minimal text — rely on recognizable objects. |
| **Collection** | An open collector's binder | Cards displayed in a grid with visible "page" edges. Binder rings or binding visible at screen edge. Cards sit in recessed pockets (subtle inner shadow). Swipe to turn pages. |
| **Deck Builder** | Cards spread on the table | A top-down view of the play-mat surface. Cards can be dragged from a side panel (the open binder) onto the mat. The deck stack shows card thickness. |
| **Battle/Match** | The game mat with two players | A textured play-mat surface (felt or nylon weave). Card zones marked with subtle embossed outlines, not hard digital borders. The mat should have the cosmic/chaotic pattern of the Plane of Chaos woven into it, very subtly. |
| **Card Detail** | Holding a single card close | Full-screen card with enhanced detail. Dark background blur. Subtle ambient light on the card surface (as if under a desk lamp). |
| **Pack Opening** | Unwrapping a physical booster pack | Foil wrapper texture that tears or peels. Cards revealed with a tactile slide, fanning out. Appropriate rarity effects (foil sheen for rare+). |

### UI Component Treatments

**Buttons:** Never flat. Buttons should look like embossed cardstock or stamped metal plates. Use an inner shadow on the top edge and a subtle outer shadow on the bottom to create physical lift. On press, the button should "depress" — the shadow inverts, and the button shifts down 1-2px. The button surface gets the cardstock grain texture.

**Navigation bars:** Minimal. A slim bar at the top or bottom of the screen using the darkest tone of the background material (dark leather). Tab icons should be small, monochrome glyphs — not colorful illustrated icons. The active tab gets a subtle metallic underline or a slightly brighter treatment, not a color fill.

**Overlays and modals:** When information panels appear (stats, settings, confirmations), they should slide in as **parchment cards** — physical-feeling panels with paper texture, soft rounded corners, and a subtle edge shadow suggesting thickness. They should never look like OS-native modal dialogs.

**Loading states:** Instead of spinners, use a subtle Chaos Mote animation — a small painted orb gently swirling. This keeps the player in the game's visual world during waits.

**Resource displays (currency, motes, etc.):** Show as physical tokens or coins sitting on the table surface, not as flat HUD numbers. A pile of Chaos Motes. A stack of Planar Shards. The count number is embossed into a small plate nearby.

### Layout Spacing

- **Minimum touch target: 44x44pt** (Apple HIG standard). No exceptions.
- **Card grid spacing: 8-12pt** between cards in collection view. Cards should not touch.
- **Screen edge margins: 16-20pt** minimum. Content should never bleed to the screen edge — this is a table, and tables have edges.
- **Section spacing: 24-32pt** between logical content groups.

> **AI generation guidance for UI surfaces, buttons, and screen backgrounds is covered in Section 17.5 (UI Surface & Component Generation).**

---

## 11. Card States & Interactions

### In-Hand State

Cards fan out from the bottom of the screen. Each card is slightly overlapping the next, angled as if held in a physical hand. Key visible elements: art silhouette, ATK, HP, Chaos Motes cost, and name. A subtle drop shadow under each card reinforces the physical stacking.

When the player swipes through their hand, cards should shift with a **slight parallax** on the art — the card frame moves, but the art moves at a slightly different rate, as if the frame is a window over a deeper surface. This is a subtle but powerful depth cue.

### On-Battlefield State

Cards on the field are displayed face-up, smaller than in-hand. They should appear to be **laying flat on the play mat**, which means a very slight perspective tilt (top edge narrower than bottom, by 1-3%) and a soft contact shadow (not a floating drop shadow).

Tapped/exhausted cards rotate 90° to the right, and their texture shifts — slightly more desaturated, as if the card is face-down in shadow. A small status icon (a painted glyph, not a digital badge) can indicate state.

### Damaged/Buffed States

When a card takes damage, its HP numeral should update with a subtle "stamp" animation — the old number fades, the new one appears with a brief emboss pulse. Damaged HP is shown in a muted red tone (not a bright digital red). Buffs show in a warm gold tone.

**Do not add floating numbers, particle effects, or "+1" badges** over the card for stat changes. These are the most "mobile game" visual patterns and will destroy the physical feeling. Keep stat changes within the card's own visual framework.

### Destruction

When a card is destroyed, it should not explode, shatter, or dissolve in digital particle effects. Instead: the card cracks (a visible fracture line across the surface, like a broken shard — referencing the Great Fracture), the art drains of color, and the card drifts downward off the screen as if falling off the table. Quick, dignified, physical.

For Endless faction cards specifically, the destruction can have a lingering ghost-image — a translucent afterimage that persists for a beat before fading — referencing their Persist mechanic.

---

## 12. Faction-Specific Card Variations

Each faction's card frame should have distinct characteristics while sharing the same fundamental layout. The differences are in materials, border treatments, and decorative details.

### Ironwright Collective

- **Border material:** Brushed steel / industrial iron. Visible bolt or rivet details at the four corners.
- **Frame style:** Geometric, angular. The art window has straight edges with slight industrial bevels — no soft curves.
- **Decorative elements:** Exposed rebar patterns along the card edges. Faint blueprint-grid lines in the text box background.
- **Stat containers:** Hexagonal, industrial. Reactor-blue inner glow behind the numerals.
- **Chaos Mote orbs:** Cold blue-white, with a mechanical containment ring around each orb.

### Fey Courts — Verdant Throne

- **Border material:** Living wood — visible grain with tiny green vines or roots threading through. The border should feel grown, not built.
- **Frame style:** Organic curves. The art window has a slightly irregular edge, as if shaped by branches.
- **Decorative elements:** Tiny leaf or flower buds at the corners. Bioluminescent dots along the frame edges.
- **Stat containers:** Rounded, leaf-shaped or seed-pod shaped. Warm gold with green veining.
- **Chaos Mote orbs:** Green-gold, with a pulsing organic glow suggesting bioluminescence.

### Fey Courts — Hollow Court

- **Border material:** Bone-white birch bark or frosted antler. Smooth, cold, with hairline cracks.
- **Frame style:** Elegant but stark. The art window has thorn-like points along its upper edge.
- **Decorative elements:** Bare branch silhouettes in the margins. Moth-wing patterns in the text box watermark.
- **Stat containers:** Angular thorns or antler-point shapes. Ice blue with bone-white numerals.
- **Chaos Mote orbs:** Pale ice-blue, with a cold, sharp-edged glow.

### Demonic Kingdoms — Furnace Lords

- **Border material:** Cracked obsidian with molten veins visible in the cracks. Should feel hot.
- **Frame style:** Jagged, aggressive. The art window frame has irregular volcanic-glass edges.
- **Decorative elements:** Lava veins that pulse faintly (a very subtle, slow glow animation — the only animated card element at rest). Scorch marks at the card edges.
- **Stat containers:** Jagged obsidian shards. Volcanic orange-red numerals that look like they're carved from cooling lava.
- **Chaos Mote orbs:** Deep red with a molten orange core, wreathed in black smoke wisps.

### Demonic Kingdoms — Obsidian Bureaucracy

- **Border material:** Polished obsidian — smooth, reflective, cold. No cracks.
- **Frame style:** Precise, formal. The card has thin ruled lines along the frame edges, like a legal document.
- **Decorative elements:** A wax-seal impression of the Bureaucracy's emblem at the bottom center. Faint contract-text watermark in the text box.
- **Stat containers:** Rectangular with precise corners — like stamps on a document. Dark red, formal.
- **Chaos Mote orbs:** Dark red, contained within obsidian settings — orderly and controlled.

### Celestial Crusade — Knights of Deliverance

- **Border material:** Polished gold and ivory. The most ornate frame — cathedral-inspired geometric patterns.
- **Frame style:** Symmetrical, architectural. The art window has an arched top (like a cathedral window). Thin gold filigree lines.
- **Decorative elements:** A faint halo of light behind the card name. Geometric patterns inspired by rose windows in the border.
- **Stat containers:** Shield-shaped with gold trim. Divine blue inner field with white or gold numerals.
- **Chaos Mote orbs:** Pure white with a golden halo, like concentrated divine light.

### Celestial Crusade — Heaven's Chosen

- **Border material:** Burning gold — the frame itself appears to radiate soft light. Edges are slightly blurred or distorted.
- **Frame style:** The same cathedral structure as the Knights, but warped — slightly non-Euclidean, edges bending in subtle ways suggesting divine geometry. This should be very subtle.
- **Decorative elements:** Multiple faint eye symbols in the border pattern (referencing the biblically-accurate celestials). The border seems to shift very slightly (a subtle parallax/shimmer).
- **Stat containers:** Circular, ringed with tiny eye symbols. Burning gold numerals.
- **Chaos Mote orbs:** Brilliant white, almost too bright — with a slight reality-distortion effect at their edges.

### The Endless — Necromantic Cabals

- **Border material:** Aged bone — a yellowed, cracked surface like an ossuary wall. Visible suture lines where bones are fused.
- **Frame style:** Constructed and deliberate. The art window is framed by stacked bone shapes — femurs, ribs — arranged architecturally.
- **Decorative elements:** Tiny phylactery symbols at the corners. A faint soul-light glow (teal) along the inner frame edge.
- **Stat containers:** Skull-shaped or vertebral. Bone-white with teal-green numerals.
- **Chaos Mote orbs:** Teal-green, with a cold ghostly glow — necrotic energy, not natural light.

### The Endless — Lost Spectres

- **Border material:** Translucent and ethereal — the border appears semi-transparent, as if the card itself is partially immaterial. Wisps of spectral fog along the edges.
- **Frame style:** Faded and indistinct. The art window's edges are soft, bleeding into the border as if the card is losing cohesion.
- **Decorative elements:** Broken chain links along one edge. Faint ghostly faces in the border fog.
- **Stat containers:** Translucent orbs with faded, flickering numerals. The stat containers should feel less solid than any other faction's.
- **Chaos Mote orbs:** Sickly green, with a fog-like diffusion around them — the energy is leaking.

---

## 13. Rarity Treatments

Rarity should be communicated through **material quality upgrades** to the card frame, not through digital effects layered on top.

| Rarity | Frame Treatment | Art Treatment |
|---|---|---|
| **Common** | Standard matte card frame with base faction textures. No metallic elements. | Standard oil painting style. Good quality, but less detail in the background. |
| **Uncommon** | A thin metallic (silver) inner border line between the art window and the frame. Slightly richer texture detail in the border. | More detailed backgrounds. Slightly more saturated color palette. |
| **Rare** | Gold metallic inner border. The faction-specific decorative elements are more pronounced — more vines on Fey, more filigree on Celestial, more lava veins on Demonic. | Full detail in art. Dynamic pose or action composition. Rich color depth. |
| **Epic** | Holographic foil treatment on the border — a rainbow-shift sheen that reacts subtly to device tilt (gyroscope parallax). The card frame has enhanced material detail (polished metal, deeper emboss). | Art has a luminous quality — brighter highlights, richer darks, more impasto texture. The creature seems to glow from within. |
| **Legendary** | Full holographic foil border with an animated shimmer. The art itself has a foil treatment — certain painted elements (eyes, weapons, energy effects) catch light independently. The border material is upgraded (gold for Celestial, dark steel for Ironwright, etc.). Extended art that bleeds slightly beyond the normal art window into the border area. | The finest oil painting quality. Museum-piece level of detail and composition. The creature dominates the frame with presence. Extended art composition that pushes beyond the standard window. |

### Rarity Anti-Patterns

- **No colored gem indicators** (the Hearthstone model works for Hearthstone's aesthetic, not for a physical-card aesthetic).
- **No particle effects floating around the card at rest.** The foil sheen for Epic/Legendary is the maximum animation.
- **No glow outlines around the card.** Rarity is communicated through the card itself, not through effects applied around it.

---

## 14. Reference Benchmarks

Study these references for specific aspects of the design:

| Aspect | Reference | What to Learn |
|---|---|---|
| **Card layout & proportions** | Professional fantasy card games (2003-present frame) | How to balance art, text, and stats. How the name bar bridges art and text. How stat boxes anchor the bottom corners. |
| **Physical card feel in digital** | Legends of Runeterra (Riot Games) | How they use depth, shadow, and subtle animation to make digital cards feel three-dimensional and physical. Their card hover/inspect interactions. |
| **Art integration into frame** | Hearthstone (Blizzard) | How painted art interacts with a stylized frame. How the art window shape creates character. How rarity is communicated through frame material. |
| **Oil painting card art** | Public domain fantasy illustration tradition | The specific oil-palette, atmospheric style this game targets. Study use of impasto texture, muted backgrounds, and dramatic focal lighting. |
| **Premium physical card design** | Premium collectible card series / Secret Lair | What "premium collectible" looks like — extended art, special frames, foil treatments. The aspirational target for Legendary rarity. |
| **Dark/atmospheric UI** | Darkest Dungeon (Red Hook Studios) | How to create a physical, textured, non-digital UI. Their use of parchment, wax seals, and candlelight as UI metaphors. |
| **Mobile card game UI** | Marvel Snap (Second Dinner) | Modern mobile card game interaction patterns — hand management, battlefield layout, card snap-to-position. What works on small screens. |

---

## 15. Common Mistakes to Avoid

These are the specific pitfalls that produce the "cluttered and digital" feeling described in the project brief:

### Card Design Mistakes

1. **Trying to show all information at once.** The #1 source of clutter. A card with 4 effect modifiers, flavor text, card type, faction, sub-faction, instability, ATK, HP, Chaos Motes, and a name — all visible simultaneously — will always look like a spreadsheet. Use the tier system. Hide Tier 3 content behind a tap.

2. **Flat color fills on the card frame.** A card border that is a solid, uniform `#2D3748` rectangle looks like a div with a background-color. Add grain, material texture, and very subtle color variation. Real cardstock is never perfectly uniform.

3. **Hard pixel-perfect edges.** Real cards have softness — die-cut corners have a radius, foil stamping has slight bleed, printed borders have micro-imperfections. Add a 0.5-1px feather or softness to edges. Use subtle anti-aliasing on frame boundaries.

4. **Digital-style drop shadows.** The CSS `box-shadow: 0 4px 12px rgba(0,0,0,0.3)` is the most "app" visual pattern. Cards should have a **contact shadow** — dark at the very base, fading quickly — as if they're resting on a surface, not floating. The shadow should be warm (tinted toward the background material color), not pure black.

5. **Using bright, saturated colors for UI chrome.** Saturated blue buttons, green confirmation badges, red error states — these belong in a productivity app. In this game, UI chrome should be muted, textured, and material-appropriate. Confirmation is a warm gold stamp. Error is a cracked/damaged texture treatment.

6. **Inconsistent icon styles.** If ATK uses a detailed illustrated sword, HP uses a flat vector heart, and Chaos Motes use a glossy 3D orb, the card looks like it was designed by three different people. All icons must share a unified style — the monochrome, slightly-embossed, stamp-like treatment described in Section 7.

### UI Mistakes

7. **System-native UI components.** iOS toggles, standard navigation bars, native modals — any component that the player has seen in Settings.app or Safari will break the immersion instantly. Every interactive element must be custom-skinned.

8. **White or light-gray full-screen backgrounds.** The collector's table is dark. Light backgrounds look like a web page. The background should always be a dark, textured material.

9. **Flat navigation tabs with color fills.** Tab bars with solid-color active states look like a banking app. Use subtle material changes — a raised brass tab, an embossed indicator, a shift in leather tone.

10. **Toast notifications and standard banners.** "You received a new card!" should not appear in a floating rounded-rect banner. It should appear as a **physical card sliding into view** or a **wax-sealed message** that the player opens. Keep every notification in the game's material language.

### AI Generation Mistakes

11. **Using raw AI output without post-processing.** AI-generated textures and icons almost always have artifacts, inconsistent lighting, or telltale smoothness. Every AI asset must go through the post-processing pipeline described in Section 17 before use. Raw AI output should be treated as a first draft, not a final asset.

12. **Mixing AI-generated styles.** If the faction emblem was generated with one model and the border texture with another and the icons with a third, they will look like they came from different games. Commit to a consistent pipeline per asset type, and use the same post-processing treatment across every asset in a category.

13. **Prompt-drifting across batches.** When generating 10 faction variants of the same icon, small prompt changes introduce visual drift — one icon is thicker, another has different lighting, a third is slightly more detailed. Always generate the entire set in one session with identical structural prompts, changing only the faction-specific parameters.

---

## 16. Asset Checklist

### Required Texture Assets

| Asset | Source | Notes |
|---|---|---|
| Matte cardstock grain (tileable, min 512x512, neutral gray) | AI generate | See 17.2 |
| Canvas weave overlay (tileable, min 512x512, warm neutral) | AI generate | See 17.2 |
| Parchment paper (tileable, min 1024x1024, warm cream with faint foxing) | AI generate | See 17.2 |
| Dark leather surface (tileable, min 1024x1024, for menu backgrounds) | AI generate | See 17.2 |
| Play-mat felt/nylon weave (tileable, min 1024x1024, dark with subtle cosmic pattern) | AI generate | See 17.2 |
| 10 faction-specific border textures (one per sub-faction) | AI generate | See 17.3 |
| Holographic foil overlay (for Epic/Legendary rarity) | Purchase or photograph | Difficult to get right with AI — a real holographic foil scan or a licensed texture pack is more reliable |
| Metal surface variations (gold, silver, bronze, iron, obsidian) | AI generate | See 17.2 |
| Bone texture (for Endless Cabals frame) | AI generate | See 17.2 |
| Spectral fog overlay (for Endless Spectres frame, semi-transparent) | AI generate | See 17.2 |

### Required Icon Assets

| Asset | Source | Notes |
|---|---|---|
| ATK icon (10 faction variants) | AI generate + post-process | See 17.4 |
| HP icon (10 faction variants) | AI generate + post-process | See 17.4 |
| Chaos Mote orb (10 faction variants) | AI generate + post-process | See 17.4 |
| Instability indicator glyph | AI generate + post-process | See 17.4 |
| 15-20 effect modifier keyword icons (unified style) | AI generate + post-process | See 17.4 |
| 5 faction emblems (primary factions) | AI generate + post-process | See 17.4 |
| 10 sub-faction emblems | AI generate + post-process | See 17.4 |
| Rarity indicators (Common through Legendary) | AI generate + post-process | See 17.4 |
| UI navigation icons (6-8 for main nav) | AI generate + post-process | See 17.4 |
| Card state indicators (tapped, buffed, damaged, shielded) | AI generate + post-process | See 17.4 |

### Required Card Frame Templates

| Asset | Source | Notes |
|---|---|---|
| 10 card frame PSD/Figma templates (one per sub-faction) | AI generate borders + manual compositing | See 17.3 |
| 5 rarity variations per frame (50 total frame variants) | AI generate metallic/foil layers + manual compositing | See 17.3 |
| Card back design (single design or per-faction) | AI generate | Full painted illustration — see 17.6 |
| Expanded/detail view card layout | Manual layout using AI-generated textures | — |

### Required Font Files

| Asset | Source | Notes |
|---|---|---|
| Display serif (card names) — full Latin character set | Purchase license | Fonts should not be AI generated. Use a properly licensed typeface (e.g., Cormorant Garamond is free via Google Fonts). |
| Body serif (effect text, flavor text) — including italic | Purchase license or use open-source | Source Serif Pro and Lora are free. Alegreya is free. |
| Stat numeral face (bold, condensed) | Purchase license or use open-source | Oswald and Bebas Neue are free. |
| UI sans-serif (menus, buttons) | Purchase license or use open-source | Fira Sans and Source Sans Pro are free. |

### Required UI Surface Assets

| Asset | Source | Notes |
|---|---|---|
| Main menu table/leather background (1080×1920+) | AI generate | See 17.5 |
| Collection binder page spread | AI generate + manual compositing | See 17.5 |
| Battlefield play-mat surface | AI generate | See 17.5 |
| Pack opening foil wrapper texture | AI generate or purchase | See 17.5 |
| Button textures (embossed cardstock, stamped metal) | AI generate | See 17.5 |
| Wax seal notification element | AI generate | See 17.5 |
| Loading Chaos Mote animation frames | AI generate + manual animation | See 17.6 |

---

## 17. AI Asset Generation Playbook

This section is the operational manual for generating all non-creature visual assets using AI image generation tools. The goal is to produce assets that are indistinguishable from the work of a professional graphic designer and illustrator — which means AI generation is only half the job. Post-processing, compositing, and quality control are the other half.

### 17.1 General Principles

**The Professional-Grade Pipeline.** Every AI-generated asset follows this workflow:

```
PROMPT → GENERATE (3-5 variants) → SELECT best candidate → POST-PROCESS → INTEGRATE into game asset → QA CHECK
```

Never skip a step. The difference between "AI-generated art" and "art that happens to have been made with AI tools" is entirely in the selection and post-processing stages.

**Consistency over novelty.** When generating a set of related assets (e.g., 10 faction border textures), the prompts must share identical structural language and differ only in the faction-specific descriptors. Document your working prompts. When you find one that produces the right look, lock it and use it for the entire set.

**Negative prompts are mandatory.** Every generation prompt must include negative constraints. At minimum, always exclude: `text, letters, words, watermark, signature, logo, UI elements, flat vector, clipart, cartoon, 3D render, glossy, plastic, smooth digital, gradient, lens flare, bokeh, photograph, photorealistic`.

**Resolution strategy.** Generate at the highest resolution your tool supports, then downscale. Upscaling AI output introduces artifacts. For tileable textures, generate at 1024x1024 minimum and test tileability before committing. For icons, generate at 512x512+ even though they'll render at 32-64px — the extra resolution gives you room to clean up edges.

**Model selection.** Different AI models have different strengths. For painterly, textured work (faction emblems, card backs, decorative elements), use models tuned for artistic/illustrative output. For clean material textures (leather, paper, metal), photographic-trained models often produce better base material. The post-processing pipeline standardizes the final look regardless of source model.

### 17.2 Texture & Material Generation

Textures are the highest-volume AI generation task and the area where AI excels most naturally. A well-prompted texture generation can produce game-ready results with minimal post-processing.

#### Prompt Architecture for Tileable Textures

```
[MATERIAL DESCRIPTION], seamless tileable texture, top-down flat view,
even studio lighting, no directional shadows, no perspective distortion,
[SPECIFIC SURFACE QUALITIES], high detail macro photography style,
neutral color palette, 1:1 aspect ratio

Negative: text, watermark, objects, items on surface, hands, tools,
strong directional light, vignette, border, frame, uneven lighting,
color cast, gradient
```

#### Faction-Specific Texture Prompts

**Matte cardstock grain (universal base):**
```
Premium heavyweight matte card stock paper surface, seamless tileable texture,
top-down flat view, even studio lighting, subtle fiber grain visible,
300gsm thick paper, very fine uniform grain, neutral warm gray,
micro-texture detail, no gloss, no sheen

Negative: glossy, shiny, text, wrinkles, folds, creases, stains,
printed pattern, colored
```

**Dark leather (menu backgrounds):**
```
Dark brown full-grain leather surface, seamless tileable texture,
top-down flat view, even studio lighting, visible natural pore texture,
subtle grain variation, rich deep brown, matte finish, aged but maintained,
bookbinding leather quality

Negative: stitching, seams, edges, buttons, hardware, scratches,
cracks, peeling, glossy, patent leather
```

**Canvas weave (art overlay):**
```
Artist canvas linen weave surface, seamless tileable texture,
top-down flat view, even studio lighting, visible warp and weft threads,
natural off-white linen, unprimed canvas texture, fine weave pattern,
subtle thread variation

Negative: paint, color, stains, painted surface, gesso, primed,
frame, stretcher bars
```

**Parchment (text box background):**
```
Aged parchment paper surface, seamless tileable texture,
top-down flat view, even studio lighting, warm cream color,
very subtle foxing age spots, slight color variation,
handmade paper quality, soft vellum-like surface

Negative: text, writing, printed, calligraphy, torn edges, holes,
dark stains, heavy damage, burned
```

**Brushed steel (Ironwright borders):**
```
Brushed stainless steel metal surface, seamless tileable texture,
top-down flat view, even studio lighting, fine linear brush marks,
cool gray industrial metal, subtle directional grain, matte industrial finish

Negative: rust, corrosion, scratches, dents, reflections, mirror finish,
polished, fingerprints
```

**Cracked obsidian (Demonic borders):**
```
Black obsidian volcanic glass surface with thin glowing orange-red veins in cracks,
seamless tileable texture, top-down flat view, dark glossy black stone,
natural fracture patterns with molten light visible through thin crack lines,
volcanic rock texture

Negative: lava flow, large cracks, bright fire, flames, smoke,
too much orange, uniform pattern
```

Generate analogous prompts for: living wood grain (Fey Verdant), birch bark frost (Fey Hollow), polished obsidian (Demonic Bureaucracy), ivory gold (Celestial Knights), aged bone (Endless Cabals), and spectral fog (Endless Spectres — generate as semi-transparent PNG with fog wisps on transparent background).

#### Texture Post-Processing Pipeline

1. **Tileability check.** Open the generated texture in an image editor, tile it in a 2×2 or 3×3 grid, and look for visible seams. If seams are visible, use offset + clone stamp to blend them, or use a dedicated seamless texture tool.

2. **Color correction.** Match the texture to the faction palette hex values in Section 6. AI models tend to drift toward their own color biases. Use Hue/Saturation and Curves adjustments to lock the color to the design spec. The texture's average color should align with the palette's Card Frame Tint value.

3. **Contrast normalization.** Ensure the texture has subtle contrast variation but no hot spots or dark pits. The texture will be applied as an overlay at 3-15% opacity — extreme contrast areas in the base texture will create distracting spots at overlay opacity.

4. **Resolution export.** Export at the specified minimum resolution (512×512 for card textures, 1024×1024 for full-screen surfaces). Export as PNG for textures that need transparency (fog, spectral effects); use high-quality JPEG for opaque textures to save on file size.

5. **In-context test.** Apply the texture to a mockup card or UI panel at its intended opacity before signing off. A texture that looks great in isolation might look wrong in context — too warm, too busy, too smooth. Always test in situ.

### 17.3 Card Frame & Border Generation

Card frames are the most complex AI generation task because they combine texture, structure, and decorative detail into a single cohesive element. The approach is to **generate border elements as components and composite them manually**, not to try to generate a complete card frame in a single prompt.

#### The Component Approach

A card frame is assembled from:
1. **Base material texture** (from Section 17.2 — already generated)
2. **Decorative border elements** (vines, rivets, bone structures, filigree — AI generated as isolated elements)
3. **Corner ornaments** (faction-specific corner details — AI generated as isolated elements)
4. **Inner border trim** (metallic line separating art window from frame — AI generated or created in an image editor)

Generate each component separately, then composite them in Figma or Photoshop onto the base material texture. This gives you full control over positioning, scale, and opacity of each element — which is what a real graphic designer would do.

#### Prompt Architecture for Decorative Border Elements

```
[DECORATIVE ELEMENT] on plain black background, isolated element,
[FACTION MATERIAL], painterly oil painting style, heavy impasto texture,
visible brushstrokes, muted [FACTION COLOR] palette,
fantasy card game decoration, ornamental detail,
hand-painted quality, traditional media look

Negative: text, frame, card, rectangle, border around image,
digital art, clean vector, smooth gradients, 3D render, photograph,
bright saturated colors, neon, glow effects
```

**Examples:**

Fey Verdant corner ornament:
```
Twisting green vine with tiny leaf buds and bioluminescent golden dots,
on plain black background, isolated element, living wood material,
painterly oil painting style, heavy impasto texture, visible brushstrokes,
muted emerald and gold palette, fantasy card game decoration,
L-shaped corner ornament, organic growth pattern

Negative: [standard negatives], flowers in full bloom, realistic photograph of plant
```

Ironwright corner rivet:
```
Industrial steel bolt and rivet plate with exposed rebar detail,
on plain black background, isolated element, brushed metal material,
painterly oil painting style with metallic sheen, visible texture,
cool gray and blue-steel palette, fantasy card game decoration,
geometric angular corner piece

Negative: [standard negatives], rusty, corroded, modern machinery
```

Celestial Knights arch detail:
```
Gothic cathedral rose window inspired gold filigree arch,
on plain black background, isolated element, polished gold and ivory material,
painterly oil painting style, heavy impasto texture on gold surfaces,
warm gold and divine blue palette, ornamental architectural detail,
symmetrical geometric sacred geometry pattern

Negative: [standard negatives], actual window, glass, stained glass panes,
modern architecture, simple circle
```

#### Frame Assembly Workflow

1. Generate 3-5 variants of each decorative element per faction.
2. Select the best candidates. Look for: consistent painterly quality, correct faction material feel, clean isolation from background.
3. In Photoshop/Figma, remove the black background (use blending mode Screen or manual masking).
4. Place the decorative elements onto the base material texture, arranged according to the card layout spec in Section 3.
5. Apply the cardstock grain overlay at 5-8% over the entire assembled frame.
6. Add the inner shadow/emboss effects described in Section 7 (Iconography) — this is done in the compositing tool, not in the AI generation.
7. Build rarity variations by layering additional metallic elements: silver trim (Uncommon), gold trim (Rare), holographic overlay (Epic/Legendary — use a purchased holographic texture for this layer).

### 17.4 Icon & Glyph Generation

Icons are the asset type most likely to look "AI-generated" if not handled carefully, because AI models struggle with simple, consistent, small-scale symbol design. The strategy is to **over-generate, then refine aggressively** in an image editor.

#### Approach A: Generate as Painted Stamps (Preferred)

Generate icons at large scale as if they are hand-painted or hand-carved stamps. This produces the slightly organic, impasto-textured look that matches the physical card aesthetic.

```
[ICON SUBJECT] symbol, hand-carved stamp impression on paper,
monochrome [FACTION ACCENT COLOR], single flat icon design,
slightly worn edges, subtle ink texture, embossed printing quality,
centered on plain [CARD BACKGROUND COLOR] background,
medieval heraldic style, bold simple silhouette

Negative: 3D, glossy, gradient, multiple colors, detailed illustration,
realistic depiction, text, letters, complex scene, background elements,
thin lines, outline only, clipart, emoji
```

**Example — ATK icon (Ironwright variant):**
```
Fractured blade shard symbol, hand-carved stamp impression on paper,
monochrome steel blue-gray, single flat icon design,
slightly worn edges, subtle ink texture, embossed printing quality,
centered on plain dark gunmetal background,
medieval heraldic style, bold simple silhouette, broken sword fragment

Negative: [standard negatives], full sword, realistic weapon,
handle or hilt, hand holding sword
```

#### Approach B: Generate as Reference, Rebuild Manually

For the cleanest results — especially for the effect modifier icon set that must be pixel-perfect at 12-16px — use AI generation to produce reference art, then manually redraw the icons in a vector tool (Figma, Illustrator, Inkscape). This gives you total control over stroke weight, symmetry, and consistency across the set.

1. Generate a loose painted version of each icon using Approach A.
2. Use the AI output as a visual reference for composition and style.
3. Redraw in vector with consistent stroke weight (2-3px at 64px canvas).
4. Apply a subtle texture overlay (the cardstock grain from 17.2) to break the vector cleanliness.
5. Add the bevel/inner-shadow emboss effect in the compositing stage.

This hybrid approach is recommended for the effect modifier icons because it guarantees the visual consistency that a set of 15-20 icons demands. AI generation alone will produce style drift across that many icons.

#### Icon Post-Processing Pipeline

1. **Background removal.** Isolate the icon from its generated background. Use clean masking — no halo artifacts.
2. **Edge refinement.** Zoom in and clean up any AI artifacts: doubled lines, inconsistent edges, lumpy curves. Use the eraser and clone stamp at 200-400% zoom.
3. **Stroke weight normalization.** Compare all icons in the set side by side at their final render size (32-64px). If one icon appears thicker or thinner than the others, adjust.
4. **Color lock.** Ensure every icon in a faction variant set uses the exact faction accent color hex from Section 6. Colorize the cleaned icon to the target color.
5. **Emboss application.** Apply a subtle inner bevel (1-2px, 120° light angle, 10-20% depth) to give the stamped-into-cardstock feel. This is done in the compositing stage, not during generation.
6. **Set review.** Display all icons at final size on a mockup card. If any icon jumps out as visually different from the others, fix it or regenerate it. The set must feel like it was designed by one person in one sitting.

### 17.5 UI Surface & Component Generation

UI backgrounds and component textures are generated using the same texture pipeline from 17.2, but at screen-resolution scale and with more specific scene direction.

#### Main Menu — The Collector's Table

Generate the table surface as a top-down photograph-style image rather than a flat texture, to give it environmental depth.

```
Top-down view of a dark leather-topped collector's desk surface,
dramatic warm side lighting from upper left, subtle pool of lamplight
in center, deep rich brown aged leather, worn desk surface with
character, faint scratches and patina, dark moody atmosphere,
card game collector aesthetic, empty surface ready for objects,
wide composition 16:9 aspect ratio

Negative: cards, objects on desk, hands, people, items, clutter,
bright lighting, overhead fluorescent, white surface, modern desk,
computer, keyboard
```

Post-processing: darken the edges into a heavy vignette. The center of the screen should be the brightest area (where menu items will sit). Overlay the leather texture from 17.2 at low opacity to reinforce the material. Color-correct to warm brown/black.

#### Battlefield Play Mat

```
Top-down view of a woven fabric game mat surface, dark navy-black
with very subtle cosmic nebula pattern woven into the fabric,
textile weave texture visible, nylon or felt material, faint abstract
swirling pattern suggesting deep space chaos, muted purple and
dark teal undertones, game mat for tabletop card game

Negative: cards, miniatures, dice, hands, bright colors, stars,
planets, literal space scene, glossy, plastic
```

#### Buttons and Interactive Elements

For buttons, generate the surface texture (embossed cardstock, stamped metal plate) as a rectangular swatch, then slice and apply in the engine using 9-slice scaling so buttons resize without distortion.

```
Rectangular embossed cardstock button surface, pressed intaglio effect,
warm cream paper with visible fiber texture, raised edges casting soft
inner shadow, top-down view, even lighting, [FACTION MATERIAL] tint,
tactile paper craft quality, aged printing press finish

Negative: text, words, rounded corners (add these in engine), digital,
glossy, plastic, 3D button, web button, gradient
```

Generate one button texture per material type needed (cardstock for general UI, metal plate for primary actions, parchment for secondary/info panels). Apply faction tinting in post-processing rather than generating separate buttons per faction.

#### Wax Seal Notification Element

```
Red wax seal impression on dark leather surface, broken seal with
cracked wax, embossed heraldic symbol in center, traditional
correspondence wax seal, melted wax drips, warm candlelight,
painterly oil painting style, fantasy game notification element

Negative: envelope, letter, paper, text, modern, plastic, clean edges
```

Generate several broken-seal variants for notification states. The unbroken seal is the "unread" state; the cracked seal is the "opened" state.

### 17.6 Painted Illustrations (Non-Creature)

Some assets require full painted illustrations in the oil-palette style: the card back, pack art, promotional banners, and any full-scene UI illustrations (e.g., a painted vignette behind the main menu). These must match the creature art's look.

#### Card Back Illustration

```
Abstract swirling vortex of planar energy, oil painting on canvas,
palette knife impasto technique, heavy visible brushstrokes,
rich deep color layers, central glowing chaos mote orb surrounded
by fractured reality shards, cosmic dark background with warm
energy tendrils, [MUTED VERSION OF ALL FIVE FACTION COLORS
swirling together], luminous depth, museum quality oil painting,
vertical composition 2.5:3.5 aspect ratio

Negative: creature, character, person, face, text, logo, border,
frame, digital art, smooth, clean lines, 3D render, photograph
```

Post-processing: apply the canvas weave overlay at 3-5% opacity. Add a faint vignette darkening the edges. Color-grade to ensure no single faction's palette dominates — this is faction-neutral.

#### Pack Opening Art

Generate the foil wrapper as a texture with a sense of material crinkle and reflectivity, then composite the pack branding elements on top.

```
Crinkled metallic foil wrapper surface, holographic rainbow sheen,
silver foil packaging material, creased and textured, studio lighting
showing metallic reflections, packaging material close-up,
shiny but tactile, not smooth mirror

Negative: text, branding, logo, product, contents, open package,
torn, flat, matte
```

### 17.7 Asset Naming & Organization

AI-generated assets should follow a strict naming convention so the build pipeline can reference them reliably:

```
[asset-type]_[faction]_[variant]_[rarity].[ext]

Examples:
texture_cardstock_base_v1.png
texture_leather_ironwright_border.png
texture_obsidian_demonic-furnace_border.png
icon_atk_ironwright_v1.png
icon_atk_celestial-knights_v1.png
icon_effect_shield_base.png
frame_fey-verdant_common.psd
frame_fey-verdant_rare.psd
ui_button_cardstock_base.png
ui_menu-bg_leather_main.png
illustration_card-back_universal_v2.png
```

Organize into directories:

```
assets/
├── textures/
│   ├── base/          (universal textures: cardstock, canvas, parchment, leather)
│   ├── faction/       (faction-specific border textures)
├── icons/
│   ├── stats/         (ATK, HP, Chaos Mote, Instability)
│   ├── effects/       (effect modifier keyword icons)
│   ├── emblems/       (faction and sub-faction emblems)
│   ├── nav/           (UI navigation icons)
│   ├── states/        (card state indicators)
├── frames/
│   ├── templates/     (PSD/Figma frame templates per sub-faction)
│   ├── components/    (decorative elements, corner ornaments, trims)
├── ui/
│   ├── backgrounds/   (menu, battlefield, collection surfaces)
│   ├── components/    (button textures, panel textures, seal elements)
│   ├── animations/    (loading mote frames, destruction crack overlay)
├── illustrations/
│   ├── card-backs/
│   ├── pack-art/
│   ├── promotional/
├── fonts/             (licensed font files only — never AI generated)
```

### 17.8 Quality Checklist for AI-Generated Assets

Before any AI-generated asset is committed to the build, it must pass all of these checks:

**Universal Checks:**
- [ ] No visible AI artifacts (doubled lines, melted details, impossible geometry)
- [ ] No embedded text, letters, or word-like artifacts (AI models frequently hallucinate text into textures)
- [ ] Color values match the faction palette in Section 6
- [ ] Asset matches the target physical material described in its section (Sections 7, 8, 12)
- [ ] Asset has been tested in context (on a card mockup, on a UI screen) at its intended size and opacity

**Texture-Specific Checks:**
- [ ] Tiles seamlessly at 2×2 minimum (no visible seams)
- [ ] No hot spots or dark pits that create distracting patterns at overlay opacity
- [ ] Appropriate level of detail for its use case (subtle grain for cardstock, more pronounced for leather)

**Icon-Specific Checks:**
- [ ] Reads clearly at final render size (32-64px for card icons, 24-32px for UI nav)
- [ ] Consistent stroke weight and visual mass with all other icons in its set
- [ ] Clean edges — no halo, no fringing, no aliasing artifacts from background removal
- [ ] Emboss/bevel effect applied consistently

**Frame Component Checks:**
- [ ] Decorative elements match the faction description in Section 12
- [ ] Elements composite cleanly onto the base material texture (no visible masking edges)
- [ ] Corner ornaments are mirrored/rotated versions of each other (AI generates each differently — manually enforce symmetry)
- [ ] Rarity upgrades (metallic trim, foil layers) layer correctly without obscuring base design

**Illustration Checks:**
- [ ] Canvas weave overlay has been applied
- [ ] Painting style matches creature art oil-palette aesthetic (impasto texture, visible brushstrokes, luminous color depth)
- [ ] Composition works at the target aspect ratio and crop
- [ ] No unintentional faces, figures, or recognizable shapes in abstract areas (AI hallucinates these into painterly backgrounds)

---

*End of Design Guide v1.1*

*This document is intended as a directive reference for AI agents generating art assets, card layouts, and UI components for Chaos Creatures. Every instruction should be treated as a constraint, not a suggestion. When in doubt, refer to the Three Pillars: Materiality, Restraint, Hierarchy.*

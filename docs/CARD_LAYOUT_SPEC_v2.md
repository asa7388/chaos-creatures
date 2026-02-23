# Card Layout Specification v2 — Full Art Dossier Format
## Replaces §1.4, §1.5, §1.5b, and §1.8 of CARD_DESIGN_GUIDE.md

**Summary of changes from v1:**
- Zone-stack layout (name bar / art box / type line / text box / stats bar / rarity bar) is retired
- Cards are now full-art dossiers — faction-specific decorated border frames full-bleed creature portrait
- All text is rendered directly over artwork in Yeseva One — labeled field format, no icons
- Flavor text and ability/modifier details move to the card back
- Card back becomes an intelligence report with full ability detail, modifier detail, and flavor text
- Instability D20 badge, chaos mote symbols, set symbol, faction icon, rarity color bar all retired
- Wax seal retained as Rank Emblem — the one authenticating physical mark on the front

---

## §1.4 Card Layout Specification — Full Art Dossier

### Design Principle

The card is a faction-issued field dossier, not a designed game object. The creature portrait was painted first. The tactical text was written over it afterward by whoever needed to record the information. The decorative border is the issuing faction's document culture — Ironwright cards look like Ironwright documents, Celestial cards look like Celestial sacred records. The Rank Emblem wax seal in the bottom right is the authenticating mark.

**The front contains identification and tactical summary only.** Full ability mechanics are on the back. A player glancing at the front knows what the creature is, what it costs, what it does in one line, and how dangerous it is. They flip to the back for full detail.

### Card Dimensions

Base card size at "selected" state (design reference): **210pt × 294pt** (5:7 ratio). All other sizes scale proportionally from this ratio. Never use fixed-point values for zone positioning — always derive from card height (H) and card width (W).

```
┌─────────────────────────────────┐  ← Decorative faction border (full card edge)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓                             ▓ │
│ ▓                             ▓ │
│ ▓    FULL ART — creature      ▓ │
│ ▓    portrait, oil paint,     ▓ │
│ ▓    bleeds edge to edge      ▓ │
│ ▓    inside the border        ▓ │
│ ▓                             ▓ │
│ ▓  Name: [Card Name]          ▓ │
│ ▓  Type: [Type / Faction]     ▓ │
│ ▓  Abilities: [keywords]      ▓ │
│ ▓  Modifiers: [modifier name] ▓ │
│ ▓  Cost: 4  ATK: 4  HP: 3    ▓ │
│ ▓  Instability: 2             ▓ │
│ ▓                             ▓ │
│ ▓  Rank Emblem    [WAX SEAL]  ▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────┘
```

### Layers (ZStack, bottom to top)

```
1. CardBacklightView          — rarity glow behind card (see §6.6c)
2. Full-art artwork image     — bleeds to inner border edge, corner radius 9pt
3. Decorative faction border  — PNG asset with transparent interior, overlays artwork
4. Text overlay layer         — all labeled fields rendered over artwork
5. Rank Emblem wax seal       — WaxSealView, bottom right, over text layer
```

### Full-Art Artwork

The creature portrait fills the entire card interior — from the inner edge of the decorative border to the opposite inner edge on all four sides. No zones, no contained art box. The artwork has no corner radius of its own — the decorative border's inner edge clips the artwork visually.

**Art vignette:** Apply a subtle darkening vignette at the lower portion of the artwork (bottom 40% of card interior, feathered) so that text rendered over it has increased legibility without a visible background panel. This is not a hard zone — it is a soft gradient darkening of the artwork itself.

**Art image spec:**
- Asset size: 606 × 858px (@3× of 202 × 286pt inner content area)
- Format: PNG or JPEG at maximum quality
- Corner radius: 9pt (applied by SwiftUI `.clipShape(RoundedRectangle(cornerRadius: 9))`)

### Decorative Faction Border

Each faction has its own border asset reflecting its document culture:

| Faction | Border material and character |
|---------|------------------------------|
| Ironwright | Dark iron and riveted steel, engraved with mechanical precision markings, worn industrial |
| Fey Courts | Gnarled root and branch weave, organic and asymmetric, faintly bioluminescent at nodes |
| Demonic Kingdoms | Aged scroll-leather with inked demonic sigils at corners, worn edges, blood-dark binding |
| Celestial Crusade | Hammered aged gold leaf with engraved feather/wing motifs, ivory inner dividing ridge |
| The Endless | Bone-pale carved border with skull motifs at corners, cracked and repaired with dark resin |

**Border asset spec:**
- Size: 630 × 882px (@3× of 210 × 294pt card)
- Format: PNG with transparent interior
- Outer corner radius: 36px (12pt @3×)
- Inner transparent region: 606 × 858px centered, corner radius 27px (9pt @3×)
- All decorative ornamentation confined within the 12px border band and corner zones
- Inner dividing line: raised ridge of faction-appropriate material, 4px wide, running continuously at the inner boundary — creates clear visual separation between border and artwork
- Single warm directional light from upper-left throughout — one specular catch on raised elements, deep shadow in recesses

**Border implementation:**
```swift
ZStack {
    // Artwork behind
    Image(card.artworkAssetName)
        .resizable()
        .scaledToFill()
        .frame(width: cardWidth, height: cardHeight)
        .clipShape(RoundedRectangle(cornerRadius: 9))

    // Art vignette for text legibility
    LinearGradient(
        gradient: Gradient(colors: [.clear, Color.black.opacity(0.45)]),
        startPoint: UnitPoint(x: 0.5, y: 0.45),
        endPoint: .bottom
    )

    // Faction border over artwork
    Image(borderAssetName(for: card.faction))
        .resizable()
        .frame(width: cardWidth, height: cardHeight)

    // Text and wax seal rendered above border
    CardDossierTextView(card: card)
}
.frame(width: cardWidth, height: cardHeight)
```

### Text Overlay — Labeled Field Format

All text is rendered directly over the artwork. No background panels, no text boxes, no zones. Text is left-aligned, positioned in the lower portion of the card interior where the art vignette provides legibility contrast.

**Field labels** ("Name:", "Type:", etc.) are part of the text — rendered in the same font as the value, slightly smaller, at reduced opacity. They read as handwritten field labels on a form, not as UI chrome.

**Text anchor point:** Bottom of text block sits at 88% of card height (approximately y=258pt at reference size). Text grows upward from this anchor. If text is long, it grows further up into the artwork — it does not scroll on the front face. The front is a summary, not a complete record.

**Text block layout (top to bottom within the block):**

```
Name: [Card Name]
Type: [CardType] / [Faction]
Abilities: [comma-separated keyword list — summary only]
Modifiers: [modifier name only — no detail]
Cost: [N]  ATK: [N]  HP: [N]
Instability: [N]
[blank line]
Rank Emblem          [WAX SEAL]
```

For card types without certain fields, omit that line entirely — do not show "ATK: —" or "Cost: N/A". Spells omit ATK/HP/Instability. Stabilizers omit Cost/ATK/HP/Instability. Planar Ruins omit ATK/Instability.

### Rank Emblem and Wax Seal

The Rank Emblem is the authenticating mark of the issuing faction. It is the only non-text visual element on the front face beyond the artwork and border.

| Property | Value |
|----------|-------|
| Label | "Rank Emblem" — rendered as a field label in the same style as other labels |
| Wax seal position | Bottom right of text block, aligned to right inner border edge |
| Wax seal size | 34 × 34pt (unchanged from v1) |
| Wax seal color | Driven by rarity — parchment-tan (Common) through ember-red (Legendary) |
| Wax seal embossed symbol | Driven by faction — scroll, tree, sledgehammer, wing, skull |
| Implementation | WaxSealView — unchanged from §6.6 |

The label "Rank Emblem" sits to the left of the wax seal on the same baseline as the seal's vertical center. The player learns that Rank Emblem = rarity/threat classification. The world calls it rank.

### Rarity → CardBacklightView

Rarity glow is retained. CardBacklightView sits behind the card in the ZStack, producing the colored light effect. The decorative border interacts with this glow — higher rank cards appear to glow through the border material. See §6.6c for implementation. This is the primary at-a-glance rarity signal from a distance, supplemented by the wax seal color up close.

---

## §1.5 Typography Specification — Full Art Dossier

### Primary Font: Yeseva One

All text on the front face uses **Yeseva One**. This font has the thick stroke weight and visible brush-load character of paint or heavy ink applied by hand. It reads as written directly onto the artwork rather than typeset over it. The thick strokes hold legibility over complex painted backgrounds.

- OFL licensed, commercial use permitted
- Download from fonts.google.com
- Register in Info.plist as `YesevaOne-Regular.ttf`

Yeseva One has one weight only (Regular). Size variation and opacity variation create the hierarchy between field labels and field values.

### Font Registration

```xml
<!-- Info.plist -->
<key>UIAppFonts</key>
<array>
    <string>YesevaOne-Regular.ttf</string>
    <string>IMFellEnglish-Regular.ttf</string>
    <string>IMFellEnglish-Italic.ttf</string>
</array>
```

IM Fell English is used on the card back only (see §1.8). Yeseva One is used exclusively on the front face.

**Never fall back to San Francisco.** If Yeseva One fails to load, fall back to Georgia Bold. Log the failure to `Logs/font_errors.log`.

### Front Face Text Specifications

All front-face text uses Yeseva One. No other font on the front.

| Element | Size | Opacity | Notes |
|---------|------|---------|-------|
| Field labels ("Name:", "Type:", etc.) | 8pt | 70% | Smaller, recedes — the label is infrastructure |
| Card name value | 13pt | 100% | Largest element — primary identification |
| Type / Faction value | 10pt | 90% | |
| Abilities value | 10pt | 90% | Keywords only — "Flying, Siege" not full descriptions |
| Modifiers value | 10pt | 90% | Modifier name only — "Iron Skin" not the effect |
| Cost / ATK / HP line | 11pt | 100% | All three on one line with 2em spacing between pairs |
| Instability value | 10pt | 90% | |
| "Rank Emblem" label | 8pt | 70% | Same style as other field labels |

**Color:** All front-face text uses `ink-black` (P3 0.098, 0.071, 0.027) in light mode. In dark mode, use `ink-dark-mode` (P3 0.906, 0.831, 0.620). Do not vary text color by field.

**Text shadow for legibility over artwork:**
- Shadow offset: x=0, y=1pt
- Shadow blur: 2pt
- Shadow color: black at 80% opacity
- This is heavier than the v1 letterpress shadow — it needs to separate text from complex painted backgrounds, not just create an ink-pressed-into-paper effect
- Apply to all front-face text without exception

**Line spacing:** 1.4× for all front-face text elements.

**Alignment:** Left-aligned. All fields start at the same left margin (inner border edge + 8pt). The Cost/ATK/HP line uses fixed spacing between values, not right-alignment.

### SwiftUI Implementation

```swift
struct CardDossierTextView: View {
    let card: Card

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            DossierField(label: "Name", value: card.name, valueSize: 13)
            DossierField(label: "Type",
                        value: "\(card.type.displayName) / \(card.faction.displayName)",
                        valueSize: 10)

            if !card.keywordAbilities.isEmpty {
                DossierField(label: "Abilities",
                            value: card.keywordAbilities.joined(separator: ", "),
                            valueSize: 10)
            }

            if !card.modifiers.isEmpty {
                DossierField(label: "Modifiers",
                            value: card.modifiers.map { $0.name }.joined(separator: ", "),
                            valueSize: 10)
            }

            // Stats line — only for card types that have them
            if card.hasCombatStats {
                StatsLineView(card: card)
            }

            if card.instability > 0 {
                DossierField(label: "Instability",
                            value: "\(card.instability)",
                            valueSize: 10)
            }

            Spacer(minLength: 8)

            RankEmblemRow(card: card)
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 8)
    }
}

struct DossierField: View {
    let label: String
    let value: String
    var valueSize: CGFloat = 10

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text("\(label):")
                .font(.custom("YesevaOne-Regular", size: 8))
                .foregroundColor(Color("ink-black").opacity(0.7))
            Text(value)
                .font(.custom("YesevaOne-Regular", size: valueSize))
                .foregroundColor(Color("ink-black"))
        }
        .shadow(color: .black.opacity(0.8), radius: 2, x: 0, y: 1)
    }
}

struct StatsLineView: View {
    let card: Card

    var body: some View {
        HStack(spacing: 0) {
            if let cost = card.cost {
                StatPair(label: "Cost", value: "\(cost)")
                Spacer().frame(width: 16)
            }
            if let atk = card.attack {
                StatPair(label: "ATK", value: "\(atk)")
                Spacer().frame(width: 16)
            }
            if let hp = card.hp {
                StatPair(label: "HP", value: "\(hp)")
            }
        }
        .shadow(color: .black.opacity(0.8), radius: 2, x: 0, y: 1)
    }
}

struct StatPair: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 2) {
            Text("\(label):")
                .font(.custom("YesevaOne-Regular", size: 8))
                .foregroundColor(Color("ink-black").opacity(0.7))
            Text(value)
                .font(.custom("YesevaOne-Regular", size: 11))
                .foregroundColor(Color("ink-black"))
        }
    }
}

struct RankEmblemRow: View {
    let card: Card

    var body: some View {
        HStack {
            Text("Rank Emblem:")
                .font(.custom("YesevaOne-Regular", size: 8))
                .foregroundColor(Color("ink-black").opacity(0.7))
                .shadow(color: .black.opacity(0.8), radius: 2, x: 0, y: 1)
            Spacer()
            WaxSealView(rarity: card.rarity, faction: card.faction)
                .frame(width: 34, height: 34)
        }
    }
}
```

---

## §1.5b Card Type Layout Variants

The full-art dossier layout applies to all card types. The differences between types are in which fields appear, not in layout structure.

### Creature (base case — all fields present)

```
Name: [name]
Type: Creature / [Faction]
Abilities: [keywords]
Modifiers: [modifier names]          ← omit if Common (no modifiers)
Cost: [N]  ATK: [N]  HP: [N]
Instability: [N]                     ← omit if 0

Rank Emblem              [WAX SEAL]
```

### Spell

Spells are played and discarded. No ATK, HP, Instability, or Rank Emblem.

```
Name: [name]
Type: Spell / [Faction]
Abilities: [effect summary — one line]
Cost: [N]
```

No wax seal on spells — they are expendable orders, not classified dossiers. No Rank Emblem row.

### Stabilizer

Stabilizers have no cost, no combat stats, no instability.

```
Name: [name]
Type: Stabilizer / [Faction]
Abilities: [effect summary — one line]

Rank Emblem              [WAX SEAL]
```

Stabilizers retain the Rank Emblem — they are permanent field installations and carry classification.

### Planar Ruin

Ruins are full-art by nature — this layout was always appropriate for them. They have HP but no ATK or Instability.

```
Name: [name]
Type: Planar Ruin                    ← no faction if neutral
Abilities: [passive effect summary]
Destroyed: [penalty summary]         ← new field replacing "IF DESTROYED" panel
Modifiers: [modifier names]          ← omit if unevolved
HP: [cost×3+1]

Rank Emblem              [WAX SEAL]  ← omit if neutral/unevolved
```

The "Destroyed:" field replaces the two-panel (PASSIVE / IF DESTROYED) structure from v1. On the front face it is a single labeled summary. Full detail is on the back.

---

## §1.8 Card Back — Intelligence Report

### Design Principle

The back of the card is the full intelligence report. Where the front is a field identification summary written hastily over a portrait, the back is the detailed record — ability mechanics, modifier effects, and a field note from whoever encountered this creature and survived. It is written on faction-appropriate material, not decorated with the faction border. The back is a working document, not a display object.

### Back Face Layout

```
┌─────────────────────────────────┐  ← Same outer border as front (faction border asset)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓                             ▓ │
│ ▓  [FACTION NAME — small,     ▓ │
│ ▓   top center, faded]        ▓ │
│ ▓                             ▓ │
│ ▓  Abilities:                 ▓ │
│ ▓  [Keyword]: [full           ▓ │
│ ▓  mechanical description]    ▓ │
│ ▓                             ▓ │
│ ▓  Modifiers:                 ▓ │
│ ▓  [Modifier name]: [full     ▓ │
│ ▓  effect + attunement bonus] ▓ │
│ ▓  ON [TRIGGER]: [effect]     ▓ │
│ ▓  ─────────────────────────  ▓ │
│ ▓  "[Flavor text — field      ▓ │
│ ▓   note from the field]"     ▓ │
│ ▓                             ▓ │
│ ▓          [GAME SIGIL]       ▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────┘
```

### Back Face Material

The card back interior (inside the faction border) uses a generated parchment panel asset rather than full artwork. This is the faction's document material — the surface on which their records are kept.

**Parchment panel asset spec:**
- Size: 606 × 858px (@3× of inner content area)
- PNG with transparent alpha edges
- Top edge: smooth alpha fade to transparent over 20px
- Left, right, bottom edges: smooth alpha fade to transparent over 8px
- Color: warm aged-hide cream, approximately `#F5E6C8` with amber variation
- Fiber grain visible, slightly darker toward edges from handling
- No hard rectangular boundary anywhere

The same faction border asset used on the front is used on the back. The border is faction-consistent across both faces.

### Back Face Typography

The card back uses **IM Fell English** — letterpress quality, ink-in-fiber character, appropriate for detailed written records. Yeseva One is front-face only.

| Element | Font | Size | Color | Style |
|---------|------|------|-------|-------|
| Faction name header | IM Fell English | 8pt | parchment-dark at 60% opacity | Centered, top |
| Section labels ("Abilities:", "Modifiers:") | IM Fell English | 9pt | ink-black | Left, SemiBold weight via synthesis |
| Keyword name | IM Fell English | 10pt | ink-black | Left, italic |
| Ability description | IM Fell English | 10pt | ink-black | Left, regular |
| Modifier name | IM Fell English | 10pt | ink-black | Left, italic |
| Modifier effect | IM Fell English | 10pt | ink-black | Left, regular |
| Triggered ability | IM Fell English | 10pt | ink-black | Left, regular |
| Divider | Hairline 0.5pt | — | parchment-mid | Between modifiers and flavor text |
| Flavor text | IM Fell English | 10pt | parchment-dark | Left, italic, quoted |
| Game sigil | Asset | 24pt diameter | ink-black | Centered, bottom |

**Letterpress effect (back face):**
- Shadow offset: x=0, y=0.5pt
- Shadow blur: 0.5pt
- Shadow color: parchment-dark at 60% opacity
- Lighter than front-face shadow — back face has a parchment background, not complex artwork

**Line height:** 1.3× for all back-face body text.

**Padding:** 12pt internal padding on all sides inside the border inner edge.

### Back Face Scrolling

If total content (abilities + modifiers + flavor text) exceeds the available interior height, the back face scrolls. Scroll indicators hidden, momentum scrolling enabled. The faction border does not move — only the content inside scrolls. This is more likely for Legendary cards with four modifiers and four triggered abilities.

### Back Face: Sections by Card Type

**Creature:**
- Faction name header
- Abilities section (if any keywords)
- Modifiers section (if any — omit entirely for Common)
- Divider
- Flavor text
- Game sigil

**Spell:**
- Faction name header
- Abilities section — full mechanical description of the spell effect
- Divider
- Flavor text
- Game sigil

**Stabilizer:**
- Faction name header
- Abilities section — full passive effect description
- Divider
- Flavor text
- Game sigil

**Planar Ruin:**
- Faction name header
- Passive section — full passive benefit description
- Destroyed section — full destruction penalty description
- Modifiers section (if evolved)
- Divider
- Flavor text
- Game sigil

### Game Sigil

Small centered emblem at the bottom of the back face. Represents the game itself — the Great Fracture. Same asset as the set symbol (`Resources/Icons/set_symbol.png`), displayed at 24pt diameter in `ink-black`. This is the one element that is faction-neutral on an otherwise faction-specific document — the sigil that classifies this as a Chaos Creatures dossier regardless of issuing faction.

---

## §1.9 Error and Fallback States (Updated)

| Failure | Fallback Display |
|---------|-----------------|
| Artwork image fails to load | Show faction-appropriate solid color fill (parchment-light for all factions) with a subtle procedural ink-wash pattern. Display text fields over this fill as normal — the dossier format means text is always legible without artwork |
| Faction border asset fails to load | Fall back to a plain rounded rectangle border in `parchment-mid`, 3pt, corner radius 12pt. Log to `Logs/asset_errors.log` |
| Yeseva One font fails to load | Fall back to Georgia Bold for front-face text. Log to `Logs/font_errors.log` |
| IM Fell English fails to load | Fall back to Georgia Regular/Italic for back-face text. Log to `Logs/font_errors.log` |
| Metal device unavailable | Front-face art vignette implemented as a SwiftUI gradient overlay rather than shader. All other elements unaffected — this layout is less shader-dependent than v1 |
| Card JSON parse error | Show faction border with "???" for all text fields and no artwork. Never a blank rectangle |
| Wax seal fails to render | Show a simple circle in the rarity color at 34pt diameter. Do not omit the Rank Emblem row |

---

## Asset Checklist — New Assets Required by This Spec

The following assets are new requirements introduced by the v2 layout. These do not exist in the v1 asset catalog and must be generated before any front-face implementation.

| Asset | Count | Spec | Location |
|-------|-------|------|----------|
| Faction border PNG (front = back) | 5 (one per faction) | 630×882px, transparent interior, faction material | `Resources/Borders/border_[faction].png` |
| Parchment panel PNG | 1 (shared across factions) | 606×858px, transparent alpha edges | `Resources/Textures/parchment_panel.png` |
| Yeseva One font | 1 | OFL, Google Fonts | `Resources/Fonts/YesevaOne-Regular.ttf` |
| IM Fell English Regular | 1 | OFL, Google Fonts | `Resources/Fonts/IMFellEnglish-Regular.ttf` |
| IM Fell English Italic | 1 | OFL, Google Fonts | `Resources/Fonts/IMFellEnglish-Italic.ttf` |

**Retired assets — remove from catalog:**
- `d20_instability_base.png` — D20 badge retired
- `chaos_mote_symbol.png` — mote symbols retired (cost is now a number)
- `faction_[name].png` — faction icons retired from front face (still used in wax seal embossing via WaxSealView — keep in catalog but update reference context)
- `set_symbol.png` — retained for game sigil on card back only

---

## MASTER_STATE.json Update Required

Add the following to `known_conflicts_to_include` in MASTER_STATE.json before the audit consolidates:

```json
"CONFLICT Section 1.4: Entire zone-stack layout replaced by full-art dossier format per CARD_LAYOUT_SPEC_v2.md. CardFrameView.swift requires complete rewrite. All zone-based SwiftUI views (NameBarView, ArtBoxView, TypeLineView, TextBoxView, StatsBarView, RarityBarView) are retired and replaced by CardDossierTextView.",

"CONFLICT Section 1.5: Typography system replaced. Cinzel, EBGaramond, Oswald retired from front face. Yeseva One is the sole front-face font. IM Fell English replaces EBGaramond on back face only.",

"CONFLICT Section 1.8: Card back spec replaced. Canvas + game sigil back retired. Back is now faction-bordered intelligence report with parchment panel, full ability/modifier detail, and flavor text.",

"ABSENT: Faction border PNG assets (5 required — one per faction). Not in current asset catalog.",

"ABSENT: Parchment panel PNG asset. Not in current asset catalog.",

"ABSENT: Yeseva One font. Not in current font set.",

"ABSENT: IM Fell English font. Not in current font set."
```

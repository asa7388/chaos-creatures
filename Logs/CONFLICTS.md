# Conflicts Resolved During CLAUDE.md Cleanup
Date: 2026-02-21
CLAUDE.md archived to: docs/CLAUDE_ARCHIVE_20260221.md

All conflicts resolved in favor of docs/CARD_DESIGN_GUIDE.md per owner decision.

## Conflict 1 — fal.ai Model
Removed from: Infrastructure Stack (fal.ai bullet, line 30), Polish Budget block (line 110)
Was: "fal.ai (FLUX Kontext API)"
Guide says: fal-ai/flux/dev (FLUX.1 Dev, text-to-image). Section 3.3.
Resolution: Removed model name from CLAUDE.md. Infrastructure Stack now says "fal.ai (card art generation)". Guide Section 3 is the authority for all generation model parameters.

## Conflict 2 — Card Layout Architecture
Removed from: Card Visual System block (lines 150–159)
Was: "Full-art cards with no bordered frames. Art fills the entire card face. A translucent text panel at the bottom contains card name, stat icons, faction icon, and flavor text."
Guide says: Structured bordered layout. Art Box = 45% of card height (132pt of 294pt). Distinct zones: Name Bar (25pt), Art Box (132pt), Type Line (18pt), Text Box (88pt), Stats Bar (15pt), Rarity Color Bar (4pt). Full-art only for Planar Ruins (Section 1.5b). See Section 1.4.
Resolution: Entire Card Visual System block removed from CLAUDE.md. Replaced with pointer to guide Sections 1.4, 1.5, 1.8.

## Conflict 3 — Font Selection
Removed from: Card Visual System block (line 155)
Was: "Cinzel (card names, headers) + Alegreya (body text, flavor text, stats)"
Guide says: Cinzel-Regular/Bold + EBGaramond-Regular/Italic/SemiBold + Oswald-Bold. Six weights across three families. Alegreya absent. Section 1.5.
Resolution: Card Visual System block removed. Typography is now exclusively owned by guide Section 1.5.

## Conflict 4 — Rarity Visual Treatment
Removed from: Card Visual System block (line 159)
Was: "Rarity treatment applied as a thin edge glow at the card border"
Guide says: Multi-component system — graduated border widths (3–4pt by rarity), inner shadows, outer glows with palette colors at specific opacities, 4pt Rarity Color Bar, WaxSeal component (34×34pt, Section 6.6). Section 1.4.
Resolution: Card Visual System block removed. Rarity system is now exclusively owned by guide Section 1.4 and 6.6.

## Conflict 5 — Battlefield Animation Engine
Removed from: Animation & Polish block (lines 161–167)
Was: "SpriteKit for all battlefield animations (card play, attacks, damage, death, chaos roll, events)"
Guide says: SwiftUI animation modifiers + Metal shaders via MTKView for card state transitions (summoning, damaged, inGraveyard, focused, selected, tapped, previewed). SpriteKit for particle systems only. Sections 1.6, 6.1–6.8.
Resolution: Animation & Polish block replaced with a pointer to guide Sections 1.6 and 6. CLAUDE.md now states SwiftUI + Metal for card transitions; SpriteKit for particles only.

## Conflict 6 — iOS Minimum Version
Changed: Infrastructure Stack section (line 26)
Was: "iOS 17+ minimum target"
Guide says: "Minimum iOS: iOS 16" (Preamble, Locked Deployment Parameters)
Resolution: All occurrences changed to "iOS 16+".

## Non-Conflicting Removals (Superseded)
- Art Consistency block (lines 142–144): Removed. Fully covered by guide Section 1.1.
- Composition Variety block (lines 146–148): Removed. Fully covered by guide Section 3.

---

## Phase 1 Conflicts — 2026-02-21 (Card Data Schema)
**STATUS: ALL RESOLVED 2026-02-21** — P1-1: FactionShortName removed, CardFaction canonical throughout all 28 Swift files. P1-2: EvolutionTier removed, Rarity canonical throughout all affected files. P1-3: Card(from: CardTemplate) init added to CardGuideEnums.swift with 12 mapped fields and TODOs logged.

### Conflict P1-1 — Faction Enum Name and Case Names
**Source A (existing codebase — Enums.swift):** `FactionShortName` enum with cases:
  - `.ironwright` ("IRONWRIGHT")
  - `.feyCourts` ("FEY_COURTS")
  - `.demonicKingdoms` ("DEMONIC_KINGDOMS")
  - `.celestialCrusade` ("CELESTIAL_CRUSADE")
  - `.theEndless` ("THE_ENDLESS")

**Source B (guide Section 2.1):** `CardFaction` enum with cases:
  - `.ironwright`
  - `.fey`
  - `.demonic`
  - `.celestial`
  - `.endless`

**Nature of conflict:** Different type name (`FactionShortName` vs `CardFaction`); different case names for 4 of 5 factions (fey/feyCourts, demonic/demonicKingdoms, celestial/celestialCrusade, endless/theEndless). The existing enum is DB-mapped to Supabase string values; the guide enum is for render-time card data.

**Resolution (NOT self-resolved — owner decision required):**
Both types coexist as of Phase 1. `FactionShortName` (existing, DB-mapped) is left untouched. `CardFaction` (new, guide Section 2.1) is added to `CardGuideEnums.swift`. Downstream views that need faction color for card rendering should use `CardFaction`. Views that need DB faction data continue using `FactionShortName`. A conversion helper between the two types is NOT added until the owner resolves the naming conflict and decides on a single canonical type.

---

### Conflict P1-2 — Rarity Enum Name
**Source A (existing codebase — Enums.swift):** `EvolutionTier` with cases: common, uncommon, rare, epic, legendary. Includes energy thresholds (15/30/50/75), display names, and `nextTier` computed property.

**Source B (guide Section 2.1):** `Rarity` with cases: common, uncommon, rare, epic, legendary. Used for frame styling, wax seal colors, glow uniforms, foil intensity. Section 2.2 defines extensive `Rarity` extensions for `waxColor`, `glowSIMD`, `foilIntensity`, `glowIntensity`, `sealIconName`, `borderWidth`, `borderGradient`.

**Nature of conflict:** Same semantic concept (card rarity / evolution tier), different type name. The guide's `Rarity` extensions are specified as canonically belonging in `Sources/Models/Card.swift` (Section 2.2 comment).

**Resolution (NOT self-resolved — owner decision required):**
Both types coexist as of Phase 1. `EvolutionTier` (existing, DB-mapped with energy thresholds) is left untouched. `Rarity` (new, guide Section 2.1) is added to `CardGuideEnums.swift` with all Section 2.2 extensions. Card views being rebuilt in Phase 2 must use `Rarity`. The existing collection/evolution views that reference `EvolutionTier` continue as-is until those screens are audited. Owner must decide whether to rename `EvolutionTier` → `Rarity` and merge, or keep both with an explicit conversion layer.

---

### Conflict P1-3 — CardTemplate vs Card (Struct Name and Field Names)
**Source A (existing codebase — CardTemplate.swift):** `CardTemplate` struct, DB-mapped fields. Key fields: `cardType: CardType`, `factionId: UUID` (FK), `baseAttack: Int?`, `baseHealth: Int?`, `manaCost: Int`, `baseInstability: Int`, `artUrl: String`.

**Source B (guide Section 2.1):** `Card` struct. Key fields: `type: CardType`, `faction: CardFaction`, `rarity: Rarity`, `attack: Int?`, `hp: Int?`, `cost: Int?`, `instability: Int`, `artworkAssetName: String`.

**Nature of conflict:** Different struct names; field naming diverges (attack/baseAttack, hp/baseHealth, cost/manaCost, faction/factionId, instability/baseInstability). The guide struct is a render-time model loaded from JSON; the existing struct is a DB decode model.

**Resolution (NOT self-resolved — owner decision required):**
The guide-spec `Card` struct is added as a NEW struct in `CardGuideEnums.swift`. The existing `CardTemplate` struct is left untouched (it is the Supabase DB model and is used by CollectionService, BattleCard, etc.). Card views being rebuilt in Phase 2 will target `Card`. Owner must eventually decide whether to merge these into a single struct or maintain a conversion layer between the DB model and render model.

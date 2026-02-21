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

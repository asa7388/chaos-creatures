# Plan: Card Visual Overhaul — Physical Cardstock Aesthetic + Faction Stat Icons

> **Persistent copy:** On execution, save to `docs/design/PLAN-card-overhaul.md`
> **Design guide:** Update `docs/design/13-visual-design-guide.md` with revised card aesthetic

---

## Context

The card UI has 11 visual bugs (stat overlap, badge clipping, card back bleed, flat styling, cramped text, redundancy) and lacks the physical cardstock feel described in the design guide. The creature art already has rich painterly texture — everything else about the card (frame, text panel, stat badges, borders, name plate) needs to match that quality and look like a handcrafted physical collectible card.

**Aesthetic direction:** Premium physical card with wax-seal stat tokens. Stat badges look like dimensional wax seals pressed onto the card surface — raised, tactile, with faction-specific shapes.

**Scope:** 5 faction stat containers (not 10 sub-factions). Hexagonal (Ironwright), Leaf (Fey), Jagged Shard (Demonic), Shield (Celestial), Skull (Endless).

---

## Update Log

| Date | Change |
|------|--------|
| 2026-02-20 | Initial plan created |
| 2026-02-20 | Revised: 5 factions only (not 10 sub-faction), wax-seal badge aesthetic, hybrid gen pipeline, physical cardstock direction, $3 budget, design guide updates authorized |
| 2026-02-20 | Added: 6-agent orchestration plan (Scribe, Asset Maker, SwiftUI Engineer, SpriteKit Engineer, Build Validator, Art Director). Art Director is quality gate — reviews all output before merge. Re-run protocol for failed reviews. |
| 2026-02-20 | Major revision: New card layout — name top-left, CM top-right, ATK bottom-left, HP bottom-right. Lower thirds redesign: type, instability, modifiers (names only + hover-to-discover), flavor text. Replaces previous bug-fix approach with full layout redesign. |
| 2026-02-20 | Finalized: Contained name plate (engraved badge, not full-width strip). Inline tooltip for modifier tap-to-discover. |

---

## Phase 0: Save Plan + Update Design Guide

**Agent:** A0 (Scribe)
**Files:**
- Save this plan to `docs/design/PLAN-card-overhaul.md`
- Update `docs/design/13-visual-design-guide.md` Sections 3, 7, 12 to reflect:
  - **New card layout**: name top-left, CM top-right, ATK bottom-left, HP bottom-right
  - **Lower thirds redesign**: type + instability, modifier names (tap-to-discover), flavor text
  - **Wax-seal badge aesthetic**: raised tokens on card surface, 5 faction shapes
  - **Physical cardstock material direction** for all card chrome
  - **Modifier interaction model**: names only visible, tap to discover full descriptions

---

## Phase 1: Generate Faction Wax-Seal Stat Containers

**Approach:** Hybrid — node-canvas base shapes + fal.ai painterly texture
**Budget:** ~$1.00-2.00 (well within $3 cap)

### Step 1A: Node-Canvas Base Shapes

Generate 5 faction-shaped silhouettes via `scripts/generate-icons-v2.mjs`:

| Faction | Shape | Description |
|---------|-------|-------------|
| Ironwright | Hexagonal | Industrial hex bolt, sharp geometric edges |
| Fey Courts | Leaf | Organic leaf/seed-pod, flowing curves |
| Demonic Kingdoms | Jagged shard | Cracked obsidian shard, aggressive points |
| Celestial Crusade | Shield | Heraldic shield, symmetrical, noble |
| The Endless | Skull | Simplified skull/vertebral, ominous |

**Spec:** 512x512 white-on-black silhouettes (used as masks for fal.ai)

### Step 1B: fal.ai Painterly Texture Pass

Use fal.ai to generate wax-seal material textures per faction:

| Faction | Wax-Seal Material | Color |
|---------|-------------------|-------|
| Ironwright | Industrial pressed steel wax seal | Steel gray + reactor blue accent |
| Fey Courts | Forest resin/amber wax seal | Deep emerald + gold |
| Demonic Kingdoms | Volcanic obsidian wax seal | Black + molten orange veins |
| Celestial Crusade | Gold leaf wax seal | Ivory gold + divine blue |
| The Endless | Bone/ash wax seal | Aged bone + necrotic teal |

**Generation:** 5 images at ~$0.03-0.05 each = ~$0.15-0.25
May need 2-3 iterations per faction for quality = ~$0.50-1.50 total

### Step 1C: ImageMagick Compositing

- Composite node-canvas shape masks onto fal.ai wax-seal textures
- Apply emboss/bevel for raised 3D wax-seal effect
- Add edge highlights (top-lit) and contact shadow (bottom)
- Export at 256x256 with transparent background
- Install to `Assets.xcassets/StatIcons/stat-seal-{faction}.imageset` (1x/2x/3x)

**Total asset cost:** ~$0.50-2.00

### Tools Required

Already available:
- node-canvas (vector drawing)
- ImageMagick 7 (compositing, emboss, shade, shadow)
- sharp (resize, color correction, tiling)
- fal.ai API (image generation)

**Question for user:** Do you have access to any of these that might be useful but aren't currently installed?
- Photoshop/GIMP for manual touch-up if AI output needs fixes
- `potrace` for bitmap-to-vector conversion
- `rsvg-convert` for SVG rendering

If the hybrid pipeline produces good results, no additional tools should be needed.

---

## Phase 2: CardFrameView Redesign — New Layout + Physical Cardstock

**Agent:** A2 (SwiftUI Engineer)
**File:** `ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift`

### New Card Layout (replaces current layout entirely)

```
┌──────────────────────────────────────┐
│ ┌────────────┐            ┌────────┐ │
│ │ REBAR GOLEM│            │  ⬡ 4   │ │  ← Contained name plate (left), CM wax seal (right)
│ └────────────┘            └────────┘ │
│                                      │
│                                      │
│          CREATURE ART                │  ← Full-bleed art (~60-65% of card)
│          (oil painting)              │
│                                      │
│                                      │
├──────────────────────────────────────┤
│  CREATURE — IRONWRIGHT    ◆ INST 1  │  ← Type line + instability (inline)
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  Haste · Shield · Piercing          │  ← Modifier names (tap for inline tooltip)
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  "Rage remembers what flesh forgets" │  ← Flavor text (italic, low opacity)
├────────┬────────────────────┬────────┤
│  ⚔ 5  │                    │  ♥ 3  │  ← ATK wax seal (left), HP wax seal (right)
└────────┴────────────────────┴────────┘
```

**Key changes from current:**
- **Card name moves to top-left** (was in text panel). Displayed as Cinzel Bold, parchment-colored, with subtle letterpress shadow. Sits on a translucent dark scrim strip.
- **CM cost stays top-right** as wax-seal badge (faction-shaped)
- **Instability moves to type line** (was a separate top-right badge). Small diamond + number inline with type text.
- **ATK/HP stay bottom corners** as wax-seal badges (faction-shaped), positioned at the bottom edge of the card straddling the lower-thirds panel
- **Lower thirds** (bottom ~30-35%): type line, modifier names, flavor text
- **Modifiers shown as names only** (e.g., "Haste · Shield · Piercing") — user taps to see full descriptions in a popover/sheet
- **No separate instability badge** — instability is inline in the type line

### WaxSealBadge Component

Replace `MedallionBadge` with `WaxSealBadge`:

```swift
struct WaxSealBadge: View {
    let value: Int
    let size: CGFloat
    let factionSealAsset: String?  // nil = neutral bronze circle
    let tintColor: Color
    let iconName: String           // stat icon stamp behind number
}
```

Rendering layers:
1. **Contact shadow** — warm, offset 2pt down, 4pt blur (badge sits ON card)
2. **Seal image** — faction-shaped wax-seal asset, or Circle() fallback
3. **Faction tint overlay** — 30% opacity color blend
4. **Icon stamp** — stat icon at 25% opacity behind number
5. **Top-lit highlight** — crescent highlight at top edge (wax catches light)
6. **Number** — Bebas Neue with embossed shadow

Faction seal asset resolution:
- Ironwright: `stat-seal-ironwright` (hexagonal)
- Fey Courts: `stat-seal-fey` (leaf)
- Demonic Kingdoms: `stat-seal-demonic` (jagged shard)
- Celestial Crusade: `stat-seal-celestial` (shield)
- The Endless: `stat-seal-endless` (skull)

### Lower Thirds Panel

The text area occupies the bottom ~30-35% of the card:

**Type Line** (top of panel):
- Format: `"CREATURE — IRONWRIGHT"` or `"SPELL — FEY COURTS"`
- Font: Fira Sans SemiBold 12pt, opacity 0.80
- Instability: `◆ INST 1` right-aligned on same line
- Thin divider below (0.5pt, faction color at 0.20 opacity)

**Modifier Names** (middle):
- Format: `"Haste · Shield · Piercing"` — names only, separated by centered dots
- Font: Alegreya Bold 11pt, parchment color
- **Tap interaction: inline tooltip** — tapping a modifier name shows a small floating tooltip directly above the tapped word with the full description. Tooltip has dark parchment background, faction-colored border, dismisses on tap-away.
- Tooltip content: modifier icon + name (bold) + 1-2 line description
- If no modifiers: this row is hidden, space reclaimed by art/flavor

**Flavor Text** (bottom):
- Font: Alegreya Italic 11pt, opacity 0.48
- Max 2 lines, trailing ellipsis if truncated
- Thin divider above (0.3pt, parchment at 0.12 opacity)

### Card Name Plate (Top-Left)

- **Contained name plate** — small badge/plate wrapping just the card name text (not full-width strip)
- Handcrafted/engraved feel: parchment-tinted background with subtle border, like a brass nameplate on a picture frame
- Background: faction text panel texture at low opacity + dark overlay for readability
- Border: 0.5pt faction-colored stroke
- Rounded corners (4pt)
- Padding: 4pt horizontal, 2pt vertical
- Name: Cinzel Bold, parchment color, with letterpress inner shadow
- Size scales: 10pt (grid), 9pt (hand), 18pt (detail), 22pt (fullscreen)
- Positioned top-left with 6-8pt inset from card edge

### Physical Cardstock Enhancements

- Black base layer behind everything (no card-back bleed)
- Card edge: visible rounded corner with cardstock thickness contact shadow
- Text panel: printed-on-card feel (parchment texture, not floating glass)
- Name bar: letterpress/deboss text shadow
- Keyword/modifier text: embossed feel
- Consistent top-left light direction on all dimensional elements
- 1.15x iPad scale multiplier for badges and fonts

---

## Phase 3: SpriteKit Parity

**Agent:** A3 (SpriteKit Engineer)
**Files:**
- `ChaosCreatures/ChaosCreatures/SpriteKit/Nodes/HandCardNode.swift`
- `ChaosCreatures/ChaosCreatures/SpriteKit/Utilities/SpriteKitConstants.swift`

Changes:
- Add `SK.CardTextures.factionSealAsset(faction:)` mapping
- Refactor `setupMedallionBadge()` to use wax-seal images instead of `SKShapeNode(circleOfRadius:)`
- **New layout:** Card name top-left, CM top-right, ATK bottom-left, HP bottom-right
- **No instability badge** in hand view (it's inline in type line, which isn't shown at hand size)
- Add contact shadow beneath badges (SKSpriteNode with gaussian blur)
- Update text panel to show only card name + modifier dots (hand size is compact)
- Hand-size card shows: name (top-left), CM (top-right), art, ATK (bottom-left), HP (bottom-right), keyword dots (small colored circles below art)

---

## Phase 4: Build + Validate

**Agent:** general-purpose (Bash — xcodebuild + Simulator)

1. Build for iPhone 16 + iPad Simulator
2. Screenshot collection grid, detail, fullscreen per faction
3. Screenshot practice match hand cards
4. Verify all success criteria
5. Compare against updated design guide

---

## Agent Orchestration

### Agent Roster

| Agent | Type | Role | Runs In |
|-------|------|------|---------|
| **A0: Scribe** | general-purpose | Save plan to persistent file, update design guide doc | Phase 0 |
| **A1: Asset Maker** | general-purpose (Bash) | Run node-canvas + fal.ai + ImageMagick to produce 5 wax-seal assets | Phase 1 |
| **A2: SwiftUI Engineer** | general-purpose | Fix all 11 bugs in CardFrameView, refactor MedallionBadge to WaxSealBadge, add physical cardstock enhancements | Phase 2 |
| **A3: SpriteKit Engineer** | general-purpose | Port wax-seal badges + positioning fixes to HandCardNode + SpriteKitConstants | Phase 3 |
| **A4: Art Director** | general-purpose | Review ALL visual output from A1, A2, A3. Compare against design guide. Reject/request fixes for anything that looks digital, flat, or inconsistent. Final quality gate. | Phase 4 |
| **A5: Build Validator** | general-purpose (Bash) | xcodebuild, launch Simulator, screenshot all factions at all sizes | Phase 5 |

### Agent Dependency Graph

```
A0 (scribe) ─────────────────────────────────────────────────┐
    |                                                         |
A1 (asset maker)                                              |
    |                                                         |
    ├── A2 (SwiftUI engineer) ──┐                             |
    |                           ├── A5 (build validator) ──> A4 (art director)
    └── A3 (SpriteKit engineer)─┘                             |
                                                              |
         If A4 rejects ──> fix agent(s) re-run ──> A5 ──> A4 again
```

### Agent Details

**A0: Scribe** (Phase 0 — runs first, alone)
- Saves this plan to `docs/design/PLAN-card-overhaul.md`
- Updates `docs/design/13-visual-design-guide.md` Sections 3, 7, 12:
  - Section 3: Revised card anatomy with wax-seal badge positioning
  - Section 7: Wax-seal stat containers (raised tokens, not debossed), 5 faction shapes
  - Section 12: Simplified to 5 faction containers (remove sub-faction container variants)
- Appends to design guide's Revision Log
- Commits: `docs(design): update visual guide for wax-seal badge aesthetic`

**A1: Asset Maker** (Phase 1 — runs after A0)
- **Step 1A:** Modify `scripts/generate-icons-v2.mjs` to add/update 5 faction shape drawing functions. Generate 512x512 white-on-black silhouette masks.
- **Step 1B:** Write a new script `scripts/generate-wax-seals.mjs` that calls fal.ai to generate wax-seal material textures for each faction. Prompts describe rich physical wax-seal materials (pressed steel, forest resin, volcanic obsidian, gold leaf, bone ash). Generate at 512x512.
- **Step 1C:** Use ImageMagick to composite masks onto textures: apply emboss/bevel, add top-lit edge highlight, add contact shadow, export at 256x256 with transparent background.
- **Step 1D:** Install assets to `Assets.xcassets/StatIcons/stat-seal-{faction}.imageset` at 1x/2x/3x scales.
- Commits: `feat(assets): generate 5 faction wax-seal stat containers`

**A2: SwiftUI Engineer** (Phase 2 — runs after A1, parallel with A3)
- Reads CardFrameView.swift completely before editing
- Fixes all 11 bugs (see bug table above)
- Refactors `MedallionBadge` into `WaxSealBadge` with faction seal asset support
- Adds physical cardstock enhancements (contact shadows, letterpress name, embossed keyword capsules)
- Tests that the file compiles (can do a quick xcodebuild check)
- Commits: `fix(cards): overhaul CardFrameView layout, wax-seal badges, physical cardstock aesthetic`

**A3: SpriteKit Engineer** (Phase 3 — runs after A1, parallel with A2)
- Reads HandCardNode.swift and SpriteKitConstants.swift completely before editing
- Adds `SK.CardTextures.factionSealAsset(faction:)` mapping
- Refactors `setupMedallionBadge()` to use wax-seal images
- Matches A2's repositioned ATK/HP placement
- Adds contact shadows beneath badges
- Commits: `fix(battle): port wax-seal badges and positioning to SpriteKit`

**A5: Build Validator** (Phase 4 — runs after A2 + A3 complete)
- Builds project with `xcodebuild` for iPhone 16 Simulator
- Launches app in Simulator
- Navigates to collection, screenshots cards from each faction at grid/detail/fullscreen
- Enters practice match, screenshots hand cards
- Reports: build status, any compiler errors, visual issues spotted
- Takes screenshots and saves them for A4 review

**A4: Art Director** (Phase 5 — runs last, reviews everything)
- **Reviews generated wax-seal assets:** Do they look like real wax seals? Are faction identities clear? Do they read at small sizes (20pt)? Are they consistent with each other as a set?
- **Reviews CardFrameView screenshots:** Do cards look like physical premium cardstock? Are badges dimensional (shadow, highlight)? Is text hierarchy clear? No overlaps or clipping?
- **Reviews SpriteKit screenshots:** Do battle hand cards match the SwiftUI rendering? Are badges positioned correctly?
- **Reviews against design guide:** Does each faction's card match its specified material (steel, wood, obsidian, gold, bone)?
- **Outputs a review report** with: PASS/FAIL per success criterion, specific issues found, fix recommendations
- If issues found: describes exactly what needs fixing so fix agent(s) can re-run
- **This agent is the quality gate** — no commit to main until A4 approves

### Re-run Protocol

If A4 (Art Director) flags issues:
1. Categorize: asset issue (A1 re-runs), SwiftUI issue (A2 re-runs), SpriteKit issue (A3 re-runs)
2. Fix agent re-runs with A4's specific feedback
3. A5 re-builds and re-screenshots
4. A4 reviews again
5. Max 2 fix cycles before escalating to user for decision

---

## Cost Estimate

| Item | Tool | Est. Cost |
|------|------|-----------|
| 5 base shape silhouettes | node-canvas | $0.00 |
| 5-15 wax-seal textures (iterations) | fal.ai | $0.50-1.50 |
| Compositing + emboss | ImageMagick | $0.00 |
| Swift code changes | Agent time | $0.00 |
| **Total** | | **$0.50-1.50** |

Well under the $3 budget cap.

---

## Success Criteria

1. Card name visible top-left, CM cost top-right, ATK bottom-left, HP bottom-right
2. 5 faction wax-seal stat containers render as raised dimensional tokens with correct shapes
3. No stat badge overlaps any text at any display size
4. No card back/dark edges visible around card perimeter
5. Lower thirds panel shows: type line + instability, modifier names (tap-to-discover), flavor text
6. Modifier names display as compact dot-separated list; tap opens full descriptions
7. Clear text panel hierarchy (type > modifiers > flavor) with divider lines
8. Card chrome feels like physical premium cardstock (not digital UI)
9. Wax seals have visible contact shadows (dimensional, not flat)
10. SpriteKit hand cards match new layout (name top-left, CM top-right, stats bottom corners)
11. Builds without errors on iPhone + iPad Simulator

---

## Validation

- Build with `xcodebuild` for iPhone 16 + iPad Air Simulator
- Launch app, view collection cards from each of the 5 factions
- Screenshot at grid, detail, fullscreen sizes
- Enter practice match, screenshot hand cards
- Compare badge shapes: hex (Ironwright), leaf (Fey), shard (Demonic), shield (Celestial), skull (Endless)
- Verify wax-seal dimensional effect (shadow, highlight, raised appearance)
- Check text readability and hierarchy at all sizes

---

## Risks

| Risk | Mitigation |
|------|-----------|
| fal.ai wax-seal textures don't match card art style | Iterate prompts (budget allows 15+ attempts). Fall back to node-canvas + emboss if AI quality insufficient. |
| Shaped badges unreadable at 20pt (grid/hand) | Test at small sizes first. Consider simplified shapes or circle fallback below 25pt. |
| Physical cardstock enhancements conflict with existing frame textures | The 9 sub-faction border textures already installed are compatible — they provide the frame material. We're enhancing the badges and text panel, not replacing frames. |
| Design guide updates contradict other docs | Only updating Sections 3, 7, 12 of doc 13. These are self-contained. No impact on protected files (00-02). |

---

## Files Modified

1. `docs/design/PLAN-card-overhaul.md` — This plan (new file)
2. `docs/design/13-visual-design-guide.md` — Sections 3, 7, 12 updated
3. `scripts/generate-icons-v2.mjs` — 5 faction shape draw functions + fal.ai texture pipeline
4. `ChaosCreatures/.../Views/Components/CardFrameView.swift` — 11 bug fixes + WaxSealBadge
5. `ChaosCreatures/.../SpriteKit/Nodes/HandCardNode.swift` — Badge refactor + positioning
6. `ChaosCreatures/.../SpriteKit/Utilities/SpriteKitConstants.swift` — Seal asset mapping
7. 5+ new imagesets in `Assets.xcassets/StatIcons/`

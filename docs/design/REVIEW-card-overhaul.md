# Card Visual Overhaul — Art Director Review

**Reviewer:** A4 Art Director Agent
**Date:** 2026-02-20
**Scope:** Wax-seal stat badges, card layout redesign, lower thirds panel, SpriteKit parity
**Files Reviewed:**
- `ChaosCreatures/ChaosCreatures/Views/Components/CardFrameView.swift`
- `ChaosCreatures/ChaosCreatures/SpriteKit/Nodes/HandCardNode.swift`
- `docs/design/13-visual-design-guide.md` (Sections 3, 7, 12)
- 5 wax-seal assets in `scripts/output/seal-final/`
- 5 seal imagesets in `Assets.xcassets/StatIcons/`
- Simulator screenshots: login, home, collection (x2)

---

## 1. Overall Verdict

### NEEDS FIXES

The card layout redesign is structurally sound and the visual direction is excellent. The wax-seal assets are high quality and faction-distinctive. However, there is a **P0 critical bug** that prevents faction-shaped seals from rendering in SwiftUI (the most visible surface), and several P1 items that should be addressed before this work is considered shippable.

**Summary:** 7 PASS, 3 PARTIAL, 1 FAIL out of 11 criteria.

---

## 2. Per-Criterion Scores

| # | Criterion | Score | Notes |
|---|-----------|-------|-------|
| 1 | Card name visible top-left, CM cost top-right, ATK bottom-left, HP bottom-right | **PASS** | Layout positions are correct in both SwiftUI and SpriteKit. Name plate top-left with dark background, CM seal top-right, ATK/HP straddling panel boundary at bottom corners. Confirmed in screenshot and code. |
| 2 | 5 faction wax-seal stat containers render as raised dimensional tokens with correct shapes | **FAIL** | Assets exist and are excellent quality, but SwiftUI references them WITHOUT the `StatIcons/` namespace prefix. The `StatIcons` folder has `provides-namespace: true`, so `Image("stat-seal-ironwright")` fails silently and falls back to the bronze circle. All faction seals in the SwiftUI collection view are rendering as generic bronze circles, not faction shapes. SpriteKit references are correct (`StatIcons/stat-seal-ironwright`). |
| 3 | No stat badge overlaps any text at any display size | **PASS** | At grid size (112x157), the name plate (top-left, max 60% width) and CM seal (top-right) have adequate clearance. ATK/HP seals straddle the panel boundary at bottom corners. The text panel content (type line, modifiers) is inset 14pt horizontally in detail view, providing clearance from the corner seals. No overlap visible in screenshots. |
| 4 | No card back/dark edges visible around card perimeter | **PASS** | Layer -1 is `Color.black` base which prevents any card-back bleed. The border frame system (faction texture + frame overlay + tint) covers the full card area. In the collection screenshots, all cards show clean edges with no dark gaps or card-back artifacts. |
| 5 | Lower thirds panel shows: type line + instability, modifier names (tap-to-discover), flavor text | **PARTIAL** | At grid size, the panel correctly shows a compact type label and faction icon. At detail/fullscreen, the full three-row layout (type line with instability, modifier names with dot separators, flavor text) is correctly implemented. However, at grid size the panel only shows a type label row -- the instability value is not visible at any size below detail. The design guide says instability is inline in the type line but the grid panel implementation uses `compactTypeLabel` which omits it. This is acceptable for grid (too small) but should be verified at hand size. |
| 6 | Modifier names display as compact dot-separated list; tap opens full descriptions | **PASS** | The `modifierNamesRow` uses centered dot separator (`\u{00B7}`) between keyword names. Each keyword has an `onTapGesture` that toggles `activeTooltipKeyword`. The tooltip overlay shows keyword icon, name (bold), and 1-2 line description in a dark parchment panel with faction-colored border. Dismissal on tap-away is implemented. |
| 7 | Clear text panel hierarchy (type > modifiers > flavor) with divider lines | **PASS** | Three rows are separated by dashed dividers: type line (top) with faction-colored divider at 0.15 opacity, modifiers (middle) with parchment-colored divider at 0.10 opacity, flavor text (bottom) at 0.45 opacity italic. Hierarchy is visually clear: type line is bold at 0.80, modifiers bold at 0.75, flavor italic at 0.45. |
| 8 | Card chrome feels like physical premium cardstock (not digital UI) | **PASS** | Multiple material layers contribute to the physical feel: canvas weave overlay at 0.15-0.22 opacity, noise texture grain at 6%, inner vignette, faction border textures, text panel with paper grain overlay, letterpress shadow on name text. The collection screenshots show cards with visible texture depth -- they do not look flat. The dark vellum/parchment text panels with faction tinting work well. |
| 9 | Wax seals have visible contact shadows (dimensional, not flat) | **PARTIAL** | SwiftUI WaxSealBadge has a contact shadow: `.shadow(color: Color.black.opacity(0.5), radius: size * 0.12, x: 0, y: size * 0.06)`. This is warm and offset down. However, because the faction seals are not rendering (see criterion 2), only the bronze circle fallback is showing, which has the contact shadow but does not have the faction shape. Additionally, at grid size (24pt badge), the contact shadow blur radius is only ~2.9pt which may be barely perceptible. The SpriteKit implementation also has a contact shadow (circle at 0.4 alpha, offset 1.5pt down) which is appropriate for the smaller hand scale. **Contact shadows exist in code but are undermined by the seal asset bug.** |
| 10 | SpriteKit hand cards match new layout (name top-left, CM top-right, stats bottom corners) | **PASS** | HandCardNode layout matches the SwiftUI CardFrameView card anatomy: name label at top-left with dark background plate (line 100-102), CM badge at top-right (line 115-116), ATK at bottom-left and HP at bottom-right straddling the panel boundary (lines 131-153). The `setupMedallionBadge` method correctly checks for faction seal assets and falls through to bronze circle fallback. Keyword dots positioned above the text panel edge. |
| 11 | Builds without errors on iPhone + iPad Simulator | **PARTIAL** | Cannot verify build status from this review session (no xcodebuild output provided). The code appears syntactically correct and well-structured. The iPad scaling multiplier (`iPadScale = 1.15`) for badges and fonts is present. However, the seal asset namespace bug means that while the app builds, the visual output is degraded on ALL cards with a faction assignment. The build may succeed but the visual result is incorrect. |

---

## 3. Asset Quality Review

### Wax Seal Assessment

| Faction | Asset | Shape | Material | Quality | Notes |
|---------|-------|-------|----------|---------|-------|
| **Ironwright** | `stat-seal-ironwright@2x.png` | Hexagonal | Pressed steel | **Excellent** | Clear hexagonal shape with sharp geometric edges. The steel material reads as industrial metal with a convincing pressed/stamped impression. The relief pattern in the center adds dimension. The overall dark steel tone matches faction identity perfectly. |
| **Fey Courts** | `stat-seal-fey@2x.png` | Leaf/organic | Forest resin/amber | **Good** | Recognizable leaf/seed-pod shape with organic flowing edges. Deep emerald-green resin material with visible surface bubbles/inclusions that sell the amber/resin feel. Slightly less defined edges than Ironwright -- at 20pt display, the leaf shape may read as a generic blob. Consider post-processing to sharpen the silhouette. |
| **Demonic Kingdoms** | `stat-seal-demonic@2x.png` | Jagged shard | Volcanic obsidian | **Good** | Aggressive, irregular shape with jagged edges -- clearly distinct from the other seals. The obsidian material is convincing with volcanic orange-red speckles (lava inclusions). The dark tone may make the stat number hard to read at small sizes if the embossed text overlay does not provide enough contrast. |
| **Celestial Crusade** | `stat-seal-celestial@2x.png` | Shield | Gold leaf | **Excellent** | Clean heraldic shield shape with a laurel/leaf impression in the center. The gold leaf material is the brightest and most legible of the set. Strong noble/divine quality. The raised rim detail is well-defined. This will be the most readable seal at small sizes due to its light, high-contrast surface. |
| **The Endless** | `stat-seal-endless@2x.png` | Skull | Bone/ash | **Good-** | The skull shape is recognizable but the triangular eye/nose cutouts create literal holes in the asset. At 20pt display size, the stat number will need to be positioned carefully to avoid being partially hidden behind these transparent gaps. The bone/ash material with teal-green patina is on-brand. The cracked surface texture is atmospheric but adds visual noise at small scale. |

### Set Consistency

The five seals are **reasonably consistent as a set** -- they all share a similar photographic realism level, similar lighting angle (top-left), and similar scale/framing. However, there are consistency concerns:

1. **Lighting direction**: Ironwright and Celestial have clear top-left lighting. Fey has more ambient/scattered lighting. Demonic is darker overall. This variance is acceptable as it reinforces faction mood but could be more unified.
2. **Edge treatment**: Ironwright has the cleanest silhouette. Endless has the most irregular edge. At badge size, edge irregularity translates to visual noise.
3. **Background transparency**: All five appear to have transparent backgrounds, which is correct for compositing.
4. **Scale concern**: The Endless skull has transparent cutouts (eye sockets) that will create visual artifacts when a stat number is overlaid. The number text may partially show through the holes.

---

## 4. Screenshot Review

### Collection View (`chaos-screenshot-collection.png`)

**Positive observations:**
- Card layout positions are correct: name plate visible at top-left on all cards, CM seal visible at top-right, ATK bottom-left, HP bottom-right
- The name plates have dark backgrounds providing good contrast against varied art backgrounds
- Text panel at bottom of each card shows type information ("Creature" label visible)
- Cards have visible border textures -- not flat digital borders
- The collection grid spacing is appropriate (~8-10pt between cards)
- The background leather texture is present and contributes to the collector's table feel
- Faction tab chips visible at top-left ("Ironwright" label visible)
- Cards exhibit visual variety in art and coloring across the grid

**Negative observations:**
- **All stat seals appear as bronze circles, not faction shapes** (P0 -- confirms the namespace bug). No hexagons, leaves, shards, shields, or skulls visible. Every badge is a generic round medallion.
- At grid size, some card names are truncated quite aggressively -- hard to read what some cards are called. This is expected for 112pt width cards but worth noting.
- The lower-thirds text panel occupies 25% of card height at grid size, which is appropriate -- but the content is very minimal (just a type label). Consider whether this space is being used efficiently.
- Some cards show very dark art that blends into the dark border, making the card boundaries less distinct for those specific cards. The inner vignette may be compounding with already-dark art.

### Login Screen (`chaos-screenshot-1.png`)

- Clean, dark leather background with visible texture
- "Chaos Creatures" title in Cinzel font -- appropriate
- Subtle icon above the title
- Sign in with Apple button and Dev Mode button are clean
- No issues observed -- this screen is not part of the card overhaul scope

### Home Screen (`chaos-screenshot-home.png`)

- Tab bar at bottom with glass effect and gold active indicator
- "PLAY" card, daily missions, stats section all visible
- Dark background with texture
- No card rendering on this screen -- not relevant to card overhaul scope

---

## 5. Code Quality Notes

### CardFrameView.swift

**Strengths:**
- Well-structured layer stack with clear comments (Layer -1 through Layer 12)
- Clean separation of concerns: each visual element has its own computed property
- The `CardDisplaySize` enum scales all dimensions appropriately for grid/hand/detail/fullscreen
- `WaxSealBadge` is a self-contained component with proper layer ordering (contact shadow, seal image, tint, icon stamp, highlight, number)
- iPadScale multiplier applied consistently to fonts and badge sizes
- The rarity system (`RarityBorderModifier`) is clean and uses appropriate techniques (animated gyroscope-driven foil for Epic, angular gradient shimmer for Legendary)
- Tooltip system for modifier keywords is well-implemented with tap-to-toggle and dismiss-on-tap-away

**Concerns:**
1. **P0 BUG -- Asset namespace mismatch**: Lines 557-561 return `"stat-seal-ironwright"` etc. but the `StatIcons` asset catalog folder has `provides-namespace: true`. Must be `"StatIcons/stat-seal-ironwright"`. This causes all faction seals to silently fail, falling back to generic bronze circles.
2. The `NoiseTextureOverlay` uses a Canvas with pseudo-random dots. At large card sizes (fullscreen 350x490), this generates `350 * 490 * 0.06 = ~10,290` individual path draws per frame. This could cause frame drops during scroll/animation. Consider pre-rendering the noise to a CGImage or using a pre-baked noise texture asset instead.
3. The `dashedDivider` function creates a solid rectangle, not an actual dashed line. The name is misleading. If dashed appearance is desired, the implementation needs `StrokeDash` or a repeating pattern. If a solid thin line is intentional, rename it to `thinDivider`.
4. The `factionSealAsset` property on `CardFrameView` (private, line 554) returns the asset name. The public `CMBadgeView`, `ATKBadgeView`, and `HPBadgeView` structs also accept `factionSealAsset` as an optional parameter. This dual-path approach means the seal asset name must be passed correctly from BOTH the internal `CardFrameView` rendering AND any external badge usage. The internal usage has the namespace bug; external callers would need to pass the correct namespaced string.

### HandCardNode.swift

**Strengths:**
- Layout matches the SwiftUI CardFrameView card anatomy (name top-left, CM top-right, ATK/HP bottom corners)
- Faction seal asset lookup goes through `SK.CardTextures.factionSealAsset(faction:)` which correctly uses `"StatIcons/stat-seal-..."` namespace
- Parallax effect is cleanly implemented with SKCropNode for art clipping
- Card expand/dismiss animation system is well-built with state management (CardExpandDismissData)
- Rarity effects (uncommon through legendary) are properly tiered with increasing visual complexity

**Concerns:**
1. The `setupMedallionBadge` method's faction seal path (lines 414-445) does NOT add an embossed rim or inner highlight, unlike the generic fallback path (lines 483-496). This means faction-shaped seals in SpriteKit will lack the dimensional rim detail. Minor -- the seal images themselves have rim detail baked in, but it may look less polished than the fallback path.
2. Name label truncation at `maxNameChars = 10` is very aggressive. Cards named "Rebar Golem" (11 chars) would truncate to "Rebar Gol..." -- this truncation is visible in the screenshots. Consider 12-13 characters or dynamic width-based truncation.
3. The contact shadow for faction seals (line 419-423) uses `circleOfRadius: radius * 0.9` which is always circular. For non-circular faction shapes (hexagon, leaf, shard, shield, skull), the circular shadow will not match the seal shape. This is a minor visual inconsistency but acceptable at the small hand card scale.

---

## 6. Fix Recommendations

### P0 — Must Fix Before Commit

| Issue | File | Fix |
|-------|------|-----|
| **Faction seal asset namespace bug** | `CardFrameView.swift` lines 557-561 | Change `"stat-seal-ironwright"` to `"StatIcons/stat-seal-ironwright"` (and same for all 5 factions). The `StatIcons` folder has `provides-namespace: true` so the full path is required. Without this fix, NO faction-shaped seals render in the SwiftUI collection/detail views -- the entire wax-seal feature is invisible to users. |

### P1 — Fix Soon (Before App Store Submission)

| Issue | File | Fix |
|-------|------|-----|
| **Endless skull transparent holes** | Asset: `stat-seal-endless` | The skull seal has transparent eye/nose cutouts that will show through when a number is overlaid. Either fill the cutouts with bone-colored fill in the asset, or add an opaque backing layer in the `WaxSealBadge` view behind the seal image. |
| **NoiseTextureOverlay performance** | `CardFrameView.swift` lines 352-384 | Replace the per-frame Canvas drawing with a pre-rendered `UIImage` or a pre-baked noise texture asset. Current implementation draws ~10K paths per card at fullscreen size, which will cause frame drops during animations or list scrolling. |
| **SpriteKit faction seal lacks rim detail** | `HandCardNode.swift` line 414-445 | Add an embossed outer rim and inner highlight to the faction seal path (matching the fallback path at lines 483-496) to ensure dimensional consistency. Or verify that the seal image assets already contain sufficient rim detail and document this intentional difference. |
| **Name truncation too aggressive** | `HandCardNode.swift` line 107 | Increase `maxNameChars` from 10 to 12, or use SKLabelNode's `preferredMaxLayoutWidth` for dynamic truncation based on available width rather than a fixed character count. |
| **Misleading function name** | `CardFrameView.swift` line 1125 | Rename `dashedDivider` to `thinDivider` if the solid-line implementation is intentional, or implement actual dashed stroke if dashes are desired per the design guide. |

### P2 — Nice to Have

| Issue | File | Fix |
|-------|------|-----|
| **Fey seal silhouette softness** | Asset: `stat-seal-fey` | Consider post-processing to sharpen the leaf silhouette edge slightly. At 20pt display size it may read as an amorphous blob rather than a leaf. |
| **Demonic seal readability** | Asset: `stat-seal-demonic` | The dark obsidian material combined with dark volcanic speckles may make white stat numbers difficult to read at small sizes. Verify readability at 20pt and 24pt sizes; may need a brighter highlight crescent or stronger number shadow. |
| **Dark art compounding with vignette** | `CardFrameView.swift` | For cards with very dark art, the inner vignette overlay (lines 389-403) compounds with the dark art to make the card nearly black at edges. Consider reducing vignette strength or making it adaptive based on dominant art color (advanced, low priority). |
| **Lighting consistency across seal set** | All seal assets | Unify lighting angle more strictly across all 5 seals. Currently Ironwright/Celestial have clear top-left key light, while Fey/Demonic have more ambient lighting. |

---

## 7. Summary

The card visual overhaul is structurally well-executed. The layout redesign (name top-left, CM top-right, ATK/HP bottom corners) is correct in both SwiftUI and SpriteKit. The lower thirds panel with type line, modifier names (tap-to-discover), and flavor text follows the design guide specification. The wax seal assets are high quality and faction-distinctive. The physical cardstock aesthetic is convincing thanks to the multi-layer texture system (canvas weave, noise grain, faction border textures, paper panel).

The single blocking issue is the **SwiftUI asset namespace bug** that causes all faction-shaped seals to silently fail, rendering generic bronze circles instead. This is a one-line-per-faction fix (5 lines total) that will immediately unlock the entire wax-seal feature in the collection and detail views.

After fixing the P0 namespace bug, this work is ready for commit. The P1 items should be addressed in a follow-up pass before App Store screenshots are captured.

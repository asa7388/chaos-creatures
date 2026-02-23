# Implementation Plan — Chaos Creatures Design Overhaul
## Date: 2026-02-22 (supersedes 2026-02-21)
## Authority: CARD_DESIGN_GUIDE.md + GRIMDARK_AESTHETIC_DIRECTIVE.md
## Source: Logs/GAP_ANALYSIS.md (consolidated from 3 audit agents)

---

## Decisions Required (Resolve Before Phase 1)

These items require owner input. Record each resolution in `Logs/DEPENDENCY_DECISIONS.md`.

### Decision 1: Creature Full-Bleed ZStack vs Zone-Stack VStack
**Conflict:** Creature cards currently use full-bleed art ZStack with overlaid text panel. Guide Section 1.4 specifies VStack zone-stack where art is confined to 45% Art Box zone. Previous round resolved as "Option A — zone-stack per guide."
- **Option A (guide):** Convert creature layout to VStack zone-stack matching spell/stabilizer/ruin. Art confined to Art Box zone.
- **Option B (current):** Keep full-bleed ZStack for creatures. Document as intentional deviation. All other card types remain zone-stack.
**Impact:** If Option A, creature layout conversion is a Phase 2 task (~M effort). If Option B, log deviation and no code change needed.

### Decision 2: Stats Bar Height — 7% or 5%?
**Conflict:** Current is 7% "for badge visibility." Guide says 5%.
- **Option A (guide):** Reduce to 5%. Resize badges if needed.
- **Option B (current):** Keep 7%. Document deviation.
**Impact:** One line change either way.

### Decision 3: Stats Bar Ad-Hoc Colors
**Conflict:** ATK badge uses `#FF8F00`, HP badge uses `#E53935` — not palette tokens.
- **Option A:** Replace with palette-derived colors (e.g., `aged-gold` tinted for ATK, `wax-red` for HP).
- **Option B:** Keep current colors. Document as intentional UI accent outside palette.
**Impact:** Cosmetic, ~2 lines.

---

## Previously Resolved Decisions (Carry Forward — Do NOT Re-Ask)

- **Card layout:** Option A — zone-stack layout per guide Section 1.4
- **Typography:** Option A — EBGaramond + Oswald-Bold per guide Section 1.5
- **Generation pipeline:** Option 3A — New LoRA v2 on public domain artworks
- **Missing faction music:** DEFERRED — graceful degradation acceptable
- **Music stem structure:** Single-track per faction, document deviation
- **Commercial license gate:** EldritchPaletteKnife LoRA RETIRED, new v2 pending

---

## Budget Constraint

**Remaining asset generation budget: $9.50**

| Phase | Estimated API Cost | Notes |
|-------|-------------------|-------|
| Phase 1 (Environment/Tooling) | $0 | Scripts only |
| Phase 2 (Card Layout Fixes) | $0 | Code changes only |
| Phase 3 (Texture Assets) | $0 | CC0 downloads + ImageMagick |
| Phase 4 (Metal Bridge) | $0 | Code only |
| Phase 5 (Sound) | $0-2 | Freesound CC0, optional itch.io packs |
| Phase 6 (Art Generation) | $5-7 | fal.ai calls for test cards |
| Phase 7 (Haptics) | $0 | Code only |
| Phase 8 (Accessibility) | $0 | Code only |
| Phase 9 (Performance) | $0 | Profiling only |
| **Total estimated** | **$5-9** | Within $9.50 budget |

---

## Grimdark Priority Order

The implementation sequence front-loads work that makes the app feel like a physical wartime field document. The acceptance test for every phase: *"Imagine you are standing in a war camp at the edge of a contested Planar Ruin site. You have just picked up a card from the table. Does what you see on screen feel like that card?"*

Physical-material work (texture assets, Metal shaders, zone boundary character, sound materials) takes priority over technically-correct-but-invisible work (ASTC compression, performance profiling, accessibility). Both must be done, but the order matters for grimdark identity.

---

## Phase 1: Environment & Tooling Foundation
**Depends on:** Nothing
**Can parallel with:** Nothing (this is the foundation)
**Effort:** M

All scripts and verification tools that gate subsequent phases. No visual work.

### Tasks

1.1 — Create `Scripts/verify_environment.sh`
  Files: `Scripts/verify_environment.sh` (new)
  Action: Implement from Section 4.1 spec. Checks Xcode, simulators, CLI tools, Python libs, API keys, connectivity.
  Effort: S

1.2 — Create `Scripts/load_env.sh`
  Files: `Scripts/load_env.sh` (new)
  Action: Implement from Section 4.5 spec. Sources `.env`, reports key count.
  Effort: S

1.3 — Create `Scripts/verify_asset.py`
  Files: `Scripts/verify_asset.py` (new)
  Action: Implement from Section 5.7 spec. `--min-width`, `--min-height`, `--no-error-payload`, `--warm-tone-check` flags.
  Effort: S

1.4 — Create `Scripts/verify_contrast.py`
  Files: `Scripts/verify_contrast.py` (new)
  Action: Implement from Section 10.4 spec. Check 5 required WCAG AA color contrast pairs.
  Effort: S

1.5 — Create `Scripts/compare_screenshots.py`
  Files: `Scripts/compare_screenshots.py` (new)
  Action: Implement from Section 12.2 spec. PIL ImageChops.difference, 0.025 threshold.
  Effort: S

1.6 — Create `Scripts/set_astc_compression.py`
  Files: `Scripts/set_astc_compression.py` (new)
  Action: Implement from Section 4.6 spec. Walk all `.imageset` directories under Textures, inject `"properties": {"compression-type": "automatic"}` into Contents.json.
  Effort: S

1.7 — Create `Scripts/download_textures.sh`
  Files: `Scripts/download_textures.sh` (new)
  Action: Implement from Section 4.4 spec. Downloads CC0 PBR textures from Poly Haven (parchment diffuse, parchment normal, canvas diffuse, canvas normal).
  Effort: S

1.8 — Create `Scripts/generate_normal_map.sh`
  Files: `Scripts/generate_normal_map.sh` (new)
  Action: Implement from Section 3.5 spec. ImageMagick heightmap-to-normal-map for parchment, brush, wax seal.
  Effort: S

1.9 — Create `Scripts/generate_foil_gradient.py`
  Files: `Scripts/generate_foil_gradient.py` (new)
  Action: Implement from Section 3.6 spec. Generate foil gradient texture for WarmFoilShader.
  Effort: S

1.10 — Update `Scripts/screenshot_all_devices.sh` device list
  Files: `Scripts/screenshot_all_devices.sh` (modify)
  Action: Change DEVICES array to: "iPhone 15 Pro", "iPhone 12", "iPad Pro 12.9-inch (6th generation)", "iPad Air (5th generation)". Add PIL dimension verification. Add iteration numbering.
  Effort: S

1.11 — Update `Scripts/requirements.txt`
  Files: `Scripts/requirements.txt` (modify)
  Action: Add `fal-client` and `rembg`.
  Effort: S

1.12 — Update `.env.example`
  Files: `.env.example` (modify)
  Action: Add `REPLICATE_API_TOKEN`, `LORA_URL`, `FREESOUND_API_KEY`.
  Effort: S

1.13 — Run `verify_environment.sh` and fix any failures
  Action: Execute the script, resolve missing dependencies.
  Effort: S

### Exit Criteria
- [ ] `Scripts/verify_environment.sh` runs and reports all-green (or documents known-missing items)
- [ ] `Scripts/verify_asset.py --help` runs without error
- [ ] `Scripts/verify_contrast.py` runs and outputs pass/fail for 5 color pairs
- [ ] `Scripts/compare_screenshots.py` runs with no-op (no baseline yet)
- [ ] `Scripts/set_astc_compression.py` runs dry (reports imagesets it would modify)
- [ ] All new scripts committed to git

---

## Phase 2: Card Layout Corrections & Zone Boundary Character
**Depends on:** Phase 1 (scripts exist for verification)
**Can parallel with:** Nothing (modifies core CardFrameView)
**Effort:** M

Fix card layout deviations from guide. Most critically: zone boundary character must read as physical material edges, not digital lines.

### Tasks

2.1 — Resolve creature layout (pending Decision 1)
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift`
  Action: If Option A: convert creature `creatureLayout` from ZStack full-bleed to VStack zone-stack matching other card types. If Option B: add comment documenting deviation.
  Effort: M (if converting) / S (if documenting)

2.2 — Resolve stats bar height (pending Decision 2)
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift` (line 264)
  Action: Set `ZoneHeight.statsBar` to 0.051 (Option A) or document (Option B).
  Effort: S

2.3 — Move wax seal from type line to stats bar
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift` (line 852)
  Action: Reposition WaxSealView to stats bar zone at guide coordinates (x=164, y=258 at 210x294pt). Increase size to 34pt at reference scale.
  Effort: S

2.4 — Zone boundary character treatment
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift`
  Action: Replace clean hairline dividers between zones (name bar/art box boundary, art box/type line boundary, type line/text box boundary) with textured material-edge treatments. Options: (a) subtle shadow + highlight pair simulating material overlap, (b) thin gradient from one zone's material color into the next, (c) micro-texture strip. The edge should look like where canvas meets vellum — two materials touching, not a CSS border. Do NOT just make the line thicker; make it look like a material junction.
  Effort: M

2.5 — Fix AnimatedRarityBorder hex colors to palette tokens
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift` (lines 1146-1190)
  Action: Replace `Color(hex: "#FFD700")` etc. with `Color("aged-gold")`, `Color("epic-amethyst")`, `Color("legendary-ember")`.
  Effort: S

2.6 — Fix stats bar ad-hoc colors (pending Decision 3)
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift`, `ChaosCreatures/Extensions/Color+Theme.swift`
  Action: Replace `Color(hex: "#FF8F00")` and `Color(hex: "#E53935")` with palette tokens or document.
  Effort: S

2.7 — Fix font fallback terminal path
  Files: `ChaosCreatures/Config/CardFont.swift` (lines 223-263)
  Action: Change `.systemFont()` terminal fallbacks to `UIFont(name: "Georgia", size:)` and `UIFont(name: "TimesNewRoman", size:)`.
  Effort: S

2.8 — Remove retired fonts from Info.plist
  Files: `ChaosCreatures/Config/Info.plist`
  Action: Remove Cinzel-Variable.ttf, Alegreya-Variable.ttf, Alegreya-Italic-Variable.ttf, BebasNeue-Regular.ttf, FiraSans-Regular.ttf, FiraSans-SemiBold.ttf from UIAppFonts. Verify non-card screens compile without these fonts first.
  Effort: S

2.9 — Fix GyroscopeManager parameters
  Files: `ChaosCreatures/Services/GyroscopeManager.swift`
  Action: Change updateInterval to `1.0/60.0`. Change tilt normalization to clamp at `±0.6`.
  Effort: S

### Exit Criteria
- [ ] All zone proportions match Section 1.4 measurements
- [ ] Wax seal positioned per guide coordinates at 34pt
- [ ] Zone boundaries visually read as material junctions, not digital lines
- [ ] **ZONE BOUNDARY CHARACTER GATE:** Owner confirms zone edges read as physical material edges (screenshot required)
- [ ] AnimatedRarityBorder uses only palette token colors
- [ ] GyroscopeManager at 60Hz with ±0.6 tilt range
- [ ] App builds and runs in Simulator without crashes
- [ ] Simulator screenshots captured on all 4 devices (light + dark mode)
- [ ] Structured critique (8 axes + War Camp Test) written to iteration_log.md

---

## Phase 3: Texture Asset Generation & Normal Maps
**Depends on:** Phase 1 (scripts exist)
**Can parallel with:** Phase 2 (different files, but Phase 2 should ideally be done first for screenshot baseline)
**Effort:** M

Generate all texture assets the Metal shaders need. No code changes — only asset production.

### Tasks

3.1 — Download CC0 PBR textures
  Files: `Scripts/download_textures.sh` (run)
  Action: Run script to download parchment and canvas textures from Poly Haven.
  Effort: S

3.2 — Generate normal maps
  Files: `Scripts/generate_normal_map.sh` (run)
  Action: Generate `parchment_normal`, `brush_normal`, `wax_seal_normal` from downloaded heightmaps.
  Effort: S

3.3 — Generate foil gradient texture
  Files: `Scripts/generate_foil_gradient.py` (run)
  Action: Generate `foil_gradient` texture for WarmFoilShader.
  Effort: S

3.4 — Install textures to asset catalog
  Files: `ChaosCreatures/Resources/Assets.xcassets/` (new imagesets: `parchment_normal`, `brush_normal`, `wax_seal_normal`, `foil_gradient`, `canvas_base`, `parchment_base`)
  Action: Create imageset directories with proper Contents.json including `@1x/@2x/@3x` and ASTC compression property.
  Effort: S

3.5 — Apply ASTC compression to ALL texture imagesets
  Files: `Scripts/set_astc_compression.py` (run), all `*.imageset/Contents.json` under Textures
  Action: Run ASTC script across all texture imagesets (existing + new).
  Effort: S

3.6 — Verify all texture assets with verify_asset.py
  Files: `Scripts/verify_asset.py` (run)
  Action: Check dimensions and warm tone on all new texture assets.
  Effort: S

### Exit Criteria
- [ ] `parchment_normal.imageset/`, `brush_normal.imageset/`, `wax_seal_normal.imageset/` exist in asset catalog
- [ ] `foil_gradient.imageset/` exists in asset catalog
- [ ] All texture imagesets have `"compression-type": "automatic"` in Contents.json
- [ ] `verify_asset.py` passes on all new textures
- [ ] All assets committed to git

---

## Phase 4: Metal Rendering Bridge — CRITICAL
**Depends on:** Phase 3 (texture assets must exist for shaders to load)
**Can parallel with:** Nothing (this gates all visual quality)
**Effort:** L

Connect the four existing Metal shaders to actual card rendering. This is the #1 critical gap. Without this, the card looks flat and digital.

### Tasks

4.1 — Create `CardRenderer` protocol and `NullCardRenderer`
  Files: `ChaosCreatures/Effects/CardRenderer.swift` (new)
  Action: Implement per Section 5.5/6.5. Protocol with `func render(card: Card, to: MTLTexture)`. NullCardRenderer that returns a flat parchment fill for graceful degradation.
  Effort: S

4.2 — Create `MetalCardEffectView` (UIViewRepresentable + MTKView)
  Files: `ChaosCreatures/Effects/MetalCardEffectView.swift` (new)
  Action: Implement per Section 6.5. UIViewRepresentable wrapping MTKView. Coordinator implements MTKViewDelegate. Loads shader library, creates pipeline states for OilPaintShader, ParchmentShader, WarmFoilShader, InkSpreadKernel. Passes card shader uniforms + gyroscope tilt data. Falls back to NullCardRenderer if Metal unavailable.
  Effort: L

4.3 — Create `TextureCache` singleton
  Files: `ChaosCreatures/Services/TextureCache.swift` (new)
  Action: Implement per Section 13.4. Wraps `MTLTextureLoader`, LRU with max 20 textures, `evictAll()` on memory warning.
  Effort: M

4.4 — Wire MetalCardEffectView to CardFrameView art box
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift`
  Action: Replace the current `AsyncImage`/`CachedCardArt` art loading in the art box zone with MetalCardEffectView. The MetalCardEffectView takes the card's artwork + shader uniforms and renders through the OilPaintShader and ParchmentShader pipelines. EffectTier check: if `.staticOnly` or lower, fall back to current AsyncImage path.
  Effort: M

4.5 — Wire WarmFoilShader to foil rendering
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift` or `ChaosCreatures/Effects/MetalCardEffectView.swift`
  Action: For foil cards (uncommon+), apply WarmFoilShader pass using GyroscopeManager tilt data + foil_gradient texture. Gate on EffectTier >= `.shimmerOnly`.
  Effort: M

4.6 — Wire InkSpreadKernel to summoning animation
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift`
  Action: On `CardDisplayState.summoning(progress:)`, run InkSpreadKernel compute shader with progress parameter. The ink spreads from center outward, revealing the card art.
  Effort: M

4.7 — Create CardBacklightView
  Files: `ChaosCreatures/Effects/CardBacklightView.swift` (new)
  Action: Implement per Section 6.6. Separate view behind card in ZStack. Radial gradient or blurred shape matching rarity glow color. Replace current `.shadow()` approach.
  Effort: S

4.8 — Add memory warning observer
  Files: `ChaosCreatures/ChaosCreaturesApp.swift` or `ChaosCreatures/AppDelegate.swift`
  Action: Add `NotificationCenter.default.addObserver(forName: UIApplication.didReceiveMemoryWarningNotification)` that calls `TextureCache.shared.evictAll()` and `ImageCacheService.shared.clearMemoryCache()`.
  Effort: S

### Exit Criteria
- [ ] ParchmentShader renders visible fiber grain on card body
- [ ] OilPaintShader renders warm shadow lift and impasto texture on card art
- [ ] WarmFoilShader produces tilt-responsive warm shimmer on foil cards
- [ ] InkSpreadKernel renders organic ink-spread summoning animation
- [ ] CardBacklightView provides behind-card rarity glow (replacing .shadow())
- [ ] EffectTier graceful degradation: `.minimal` = no shaders, `.staticOnly` = flat parchment, `.shimmerOnly` = no gyro, `.full` = all effects
- [ ] App runs at 60fps on iPhone 12 Simulator (test with Instruments)
- [ ] **SMOKE TEST GATE:** Owner must see 4 simulator screenshots (2 devices x 2 color schemes) showing Material Believability and confirm the parchment reads as scraped hide, the art reads as oil paint, and the foil catches rather than glows. NO further visual work proceeds until this gate passes.
- [ ] Structured critique (8 axes + War Camp Test) written to iteration_log.md

---

## Phase 5: Art Generation Pipeline
**Depends on:** Phase 1 (verify_asset.py), Phase 3 (texture assets). Can start before Phase 4 completes.
**Can parallel with:** Phase 4 (different files)
**Effort:** M
**API Cost:** $5-7 (fal.ai calls)

Build the Python generation scripts with corrected faction style strings.

### Tasks

5.1 — Create `Scripts/prompt_utils.py` with CORRECTED style strings
  Files: `Scripts/prompt_utils.py` (new)
  Action: Implement `FACTION_CREATURE_STYLE`, `SUBFACTION_CREATURE_STYLE`, `FACTION_NONCREATURE_STYLE`, `build_creature_prompt()`, `build_noncreature_prompt()`. CRITICAL: Use ASSET_CREATION_GUIDE Section 6 strings, NOT Card Design Guide Section 3.2. Specifically:
  - Fey Verdant: `English Pre-Raphaelite oil painting, dense inhabited undergrowth, warm earth tones, ancient canopy light, figures integrated with not posed against environment`
  - Fey Hollow: `19th century Scandinavian Romantic oil painting, cold Nordic forest, muted greys, winter stripped bare, patient predatory stillness`
  - Celestial: `18th century Visionary oil painting, prophetic divine geometry, burning cold gold, biblical scale, terrifying geometric radiance, multiple wings and eyes, James Barry RA style`
  - All other factions per ASSET_CREATION_GUIDE Section 6.
  Effort: M

5.2 — Create `Scripts/generate_creature.py`
  Files: `Scripts/generate_creature.py` (new)
  Action: Implement from Section 3.2. Python script using fal.ai FLUX as default (LoRA v2 not yet trained). Import from prompt_utils. Calls verify_asset.py after generation.
  Effort: M

5.3 — Create `Scripts/generate_noncreature.py`
  Files: `Scripts/generate_noncreature.py` (new)
  Action: Implement from Section 3.3. fal.ai FLUX.1 Dev for spells, stabilizers, ruins. Import from prompt_utils.
  Effort: M

5.4 — Create `Scripts/grade_artwork.sh`
  Files: `Scripts/grade_artwork.sh` (new)
  Action: Implement from Section 3.4. ImageMagick warm shift + per-faction color grading passes.
  Effort: S

5.5 — Generate 5 test card artworks (1 per faction)
  Files: Generated artwork files
  Action: Run generation + grading pipeline on 5 test cards. Verify each with verify_asset.py. Log costs in BUDGET_LEDGER.md.
  Effort: M (includes iteration)
  API Cost: ~$1.25 (5 images at ~$0.25 each, assuming 1-2 retries)

5.6 — Update BUDGET_LEDGER.md
  Files: `Logs/BUDGET_LEDGER.md`
  Action: Correct total to $9.50. Log wax seal costs (~$0.63) and test artwork costs.
  Effort: S

### Exit Criteria
- [ ] `Scripts/prompt_utils.py` exists with ALL corrected faction style strings (NO "enchanted forest," NO "radiant divine light," NO "warm gold")
- [ ] `Scripts/generate_creature.py` runs and produces output
- [ ] `Scripts/generate_noncreature.py` runs and produces output
- [ ] `Scripts/grade_artwork.sh` processes generated artwork
- [ ] 5 test artworks pass `verify_asset.py` warm-tone check
- [ ] Budget ledger updated with actual costs

---

## Phase 6: Sound Design & Audio Pipeline
**Depends on:** Phase 1 (load_env.sh)
**Can parallel with:** Phase 4, Phase 5 (independent domain)
**Effort:** L
**API Cost:** $0-2 (Freesound CC0 or optional itch.io packs)

Fix all audio conflicts. Source physical-material sounds per Grimdark Directive.

### Tasks

6.1 — Create `Scripts/download_sounds.sh`
  Files: `Scripts/download_sounds.sh` (new)
  Action: Implement from Section 8.2. Freesound API download with CC0 filter.
  Effort: S

6.2 — Create `Scripts/process_sounds.sh`
  Files: `Scripts/process_sounds.sh` (new)
  Action: ffmpeg pipeline: normalize -12 LUFS, trim silence, warmth EQ, convert to `.caf`.
  Effort: S

6.3 — Source 7 missing physical-material SFX
  Files: `ChaosCreatures/Resources/Sounds/SFX/` (new files)
  Action: Download CC0 sounds from Freesound.org for: card_pickup (cardstock flex), card_setdown (cardstock on wood), card_flip (paper whoosh + thud), card_graveyard (slow paper crumple), card_summon (ink brush stroke to resonant thrum), wax_seal_tap (dampened thud), foil_shimmer (delicate shimmer). Process through Section 8.2 pipeline.
  Effort: M

6.4 — Replace 16 silent SFX placeholders
  Files: `ChaosCreatures/Resources/Sounds/SFX/` (replace files)
  Action: Source real CC0 sounds for all 16 silent placeholders. Use physical-material search terms per Grimdark Directive — NOT digital game terms.
  Effort: M

6.5 — Convert all audio to .caf format
  Files: All files in `Resources/Sounds/SFX/` and `Resources/Sounds/Music/`
  Action: `afconvert -f caff -d LEI16@44100 input.wav output.caf` for all files. Delete `.wav` originals after conversion.
  Effort: S

6.6 — Create `SoundEngine.swift`
  Files: `ChaosCreatures/Services/SoundEngine.swift` (new)
  Action: Implement per Section 8.3. `AVAudioEngine` + `AVAudioPlayerNode` per sound, preloaded buffers, `.caf` extension. Handles: card_pickup, card_setdown, card_flip, wax_seal_tap, card_summon, card_graveyard, foil_shimmer, epic_reveal, legendary_reveal, card_drag.
  Effort: M

6.7 — Update BattleAudioManager
  Files: `ChaosCreatures/Services/BattleAudioManager.swift`
  Action: Change hardcoded `.wav` to `.caf` (line 232). Fix music stem naming to match actual file names. Update to use `AVAudioEngine` for SFX playback (replace `SKAction.playSoundFileNamed`). Fix music file lookup to match actual files on disk.
  Effort: M

6.8 — Update AUDIO-SOURCING-GUIDE.md search terms
  Files: `Scripts/AUDIO-SOURCING-GUIDE.md`
  Action: Rewrite search terms from digital game SFX to physical material sounds per Grimdark Directive.
  Effort: S

6.9 — Update license manifest with audio entries
  Files: `Resources/ASSET_LICENSE_MANIFEST.md`
  Action: Add all audio files with CC0 source attribution. De-duplicate wax seal entries.
  Effort: S

### Exit Criteria
- [ ] All 26+ SFX files are real audio (no silent placeholders), `.caf` format
- [ ] 7 physical-material SFX play correctly: card_pickup, card_setdown, card_flip, card_graveyard, card_summon, wax_seal_tap, foil_shimmer
- [ ] `SoundEngine.swift` loads and plays material sounds via `AVAudioEngine`
- [ ] BattleAudioManager loads music files without filename mismatch
- [ ] All audio files are `.caf` format — zero `.wav` files remain
- [ ] License manifest updated with all audio sources

---

## Phase 7: Haptic Feedback — HARD GATE
**Depends on:** Phase 4 (Metal bridge, so haptics can be synced with visual effects)
**Can parallel with:** Phase 6 (sound can proceed independently)
**Effort:** M

Implement all haptic interactions. Physical device testing REQUIRED.

### Tasks

7.1 — Create `Resources/Haptics/` directory and 6 AHAP files
  Files: `Resources/Haptics/card_flip.ahap`, `card_summon.ahap`, `card_graveyard.ahap`, `foil_shimmer.ahap`, `epic_reveal.ahap`, `legendary_reveal.ahap` (all new)
  Action: Create from Section 7.2 JSON specs. Create `Scripts/generate_foil_shimmer_ahap.py` per Section 7.2.
  Effort: M

7.2 — Create `HapticEngine.swift`
  Files: `ChaosCreatures/Services/HapticEngine.swift` (new)
  Action: Implement per Section 7.2. Singleton with `prepare()`, `play(ahapNamed:)`, `impact(_:)`. Initialize at app startup.
  Effort: M

7.3 — Wire haptic calls to all 11 interaction sites
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift`, `ChaosCreatures/Views/Components/DraggableCardView.swift`, `ChaosCreatures/Effects/WaxSealView.swift`, battle scene files
  Action: Add haptic calls per Section 7.1 table: card pick up (light impact), card set down (medium impact), card flip (AHAP), wax seal tap (heavy impact), card summon (AHAP), card to graveyard (AHAP), foil shimmer (AHAP), epic reveal (AHAP), legendary reveal (AHAP), invalid action (notification error), scroll text box (selection feedback).
  Effort: M

7.4 — Log all haptic interactions as PENDING PHYSICAL VERIFICATION
  Files: `Logs/iteration_log.md`
  Action: Log each of 11 interactions with "PENDING PHYSICAL DEVICE VERIFICATION" per Section 7.3.
  Effort: S

### Exit Criteria
- [ ] 6 AHAP files exist in Resources/Haptics/
- [ ] HapticEngine.swift compiles and initializes at startup
- [ ] All 11 haptic interaction sites wired
- [ ] All 11 interactions logged as "PENDING PHYSICAL DEVICE VERIFICATION"
- [ ] **HAPTIC HARD GATE:** Owner must verify all 11 haptic interactions on physical device. Haptics CANNOT be tested in Simulator. NO haptic work is marked complete until physical device confirmation.

---

## Phase 8: Accessibility Pass
**Depends on:** Phase 4 (core card rendering stable), Phase 2 (layout finalized)
**Can parallel with:** Phase 6, Phase 7
**Effort:** L

Comprehensive accessibility pass across entire codebase.

### Tasks

8.1 — Add VoiceOver labels to all interactive views
  Files: `ChaosCreatures/Views/` (15+ view files)
  Action: Add `.accessibilityLabel()`, `.accessibilityHint()`, `.accessibilityAddTraits()`, `.accessibilityIdentifier()` to: OnboardingView, CollectionView, CardDetailView, DeckBuilderView, DeckListView, ShopView, SubscriptionView, SettingsView, HomeView, ProfileView, MatchmakingView, BattleContainerView, PostMatchView, EvolutionFlowView, EvolutionRevealView.
  Effort: L

8.2 — Add VoiceOver to SpriteKit scenes
  Files: `ChaosCreatures/Battle/` (BattleScene, CreatureNode, HandCardNode, etc.)
  Action: Implement `UIAccessibilityElement` approach for SKNode accessibility.
  Effort: M

8.3 — Create Dynamic Type `scaledFont()` helper
  Files: `ChaosCreatures/Config/CardFont.swift` (modify)
  Action: Implement `scaledFont(name:textStyle:baseSize:)` per Section 10.2 using `UIFontMetrics`. Add to CardFont alongside existing fixed-size accessors.
  Effort: S

8.4 — Apply Dynamic Type to CardFrameView text
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift`
  Action: Replace fixed-size font calls with `scaledFont()` equivalents. Ensure text box scroll region expands at larger sizes.
  Effort: M

8.5 — Add Reduce Motion guards to all 30+ animation sites
  Files: 24+ files with animations
  Action: Add `@Environment(\.accessibilityReduceMotion)` or `UIAccessibility.isReduceMotionEnabled` check to every `withAnimation`, `.animation`, and `.repeatForever` site. For SpriteKit: check before starting `.repeatForever` actions.
  Key files: OnboardingView, EvolutionRevealView, WaxSealView, CardDetailView, MatchmakingView, LoadingView, FullscreenCardView, DraggableCardView, ChaosCreaturesApp, CollectionView, BattleContainerView, PostMatchView, plus all SpriteKit nodes with `SKAction.repeatForever`.
  Effort: L

8.6 — Create Accessibility UITest
  Files: `ChaosCreaturesUITests/AccessibilityTests.swift` (new)
  Action: Implement `CardAccessibilityTests` per Section 10.4.
  Effort: S

### Exit Criteria
- [ ] All interactive views have VoiceOver labels, hints, and traits
- [ ] SpriteKit scenes accessible via UIAccessibilityElement
- [ ] Dynamic Type scaling works at XXL size
- [ ] ALL .repeatForever animations guarded by Reduce Motion check
- [ ] `verify_contrast.py` passes for all 5 color pairs
- [ ] AccessibilityTests.swift passes
- [ ] Accessibility Inspector reports no VoiceOver gaps on CardFrameView

---

## Phase 9: Performance Profiling & Optimization
**Depends on:** Phase 4 (Metal rendering must be active to profile)
**Can parallel with:** Phase 8 (different concerns)
**Effort:** M

Profile, measure, optimize. Last phase before final quality gate.

### Tasks

9.1 — Create `Logs/Performance/` directory
  Files: `Logs/Performance/` (new directory)
  Action: Create directory for profiling artifacts.
  Effort: S

9.2 — Run Instruments profiling
  Files: `Logs/Performance/` (profiling results)
  Action: Run `xctrace` for: Core Animation Commits, GPU Frame Capture, Metal System Trace. Record GPU frame time, draw calls, texture memory, app launch time.
  Effort: M

9.3 — Create SpriteKit texture atlases
  Files: `ChaosCreatures/Resources/Assets.xcassets/` (new atlas groups)
  Action: Create texture atlases for icons, mana symbols, wax seals. Update SpriteKit nodes to load from atlases.
  Effort: M

9.4 — Set drawsAsynchronously on particle nodes
  Files: `ChaosCreatures/Effects/CardParticleFactory.swift`, `ChaosCreatures/Battle/BattleScene.swift`
  Action: Set `drawsAsynchronously = true` on emitter nodes and ambient background.
  Effort: S

9.5 — Implement shouldRasterize on idle card layers
  Files: `ChaosCreatures/Views/Components/CardFrameView.swift`
  Action: Set `shouldRasterize = true` + `rasterizationScale = UIScreen.main.scale` when card is in `.default` state. Disable when animating.
  Effort: S

9.6 — Set preferredFramesPerSecond
  Files: `ChaosCreatures/Battle/BattleContainerView.swift`, `ChaosCreatures/Effects/CardParticleFactory.swift`
  Action: Battle SKView = 60fps. Particle overlay SKView = 30fps.
  Effort: S

9.7 — Create off-screen rendering audit extension
  Files: `ChaosCreatures/Debug/OffScreenRenderingAudit.swift` (new, DEBUG only)
  Action: Implement `CALayer.auditOffscreenRendering()` per Section 13.1.
  Effort: S

9.8 — Add "HUMAN PROFILING REQUIRED" flags
  Files: `Logs/iteration_log.md`
  Action: Add profiling flags for GPU Frame Capture, Metal System Trace, Core Animation Color Offscreen-Rendered.
  Effort: S

### Exit Criteria
- [ ] GPU frame time < 8ms on iPhone 12 Simulator
- [ ] Texture memory < 120MB with 7 cards in hand
- [ ] App launch to first card visible < 2.5s
- [ ] All SpriteKit particle nodes have drawsAsynchronously = true
- [ ] Idle cards rasterize; animating cards do not
- [ ] "HUMAN PROFILING REQUIRED" flags logged for GPU Frame Capture
- [ ] Performance measurements recorded in `Logs/Performance/`

---

## Phase 10: Quality Gate & Final Polish
**Depends on:** All previous phases
**Can parallel with:** Nothing (final gate)
**Effort:** M

Reference screenshots, regression framework, final structured critique.

### Tasks

10.1 — Capture reference screenshot baseline
  Files: `Tests/ReferenceScreenshots/` (new directory + images)
  Action: Run screenshot script on all 4 devices x 2 color schemes = 8 baseline images. Commit as reference.
  Effort: S

10.2 — Run compare_screenshots.py against baseline
  Files: `Scripts/compare_screenshots.py` (run)
  Action: Verify diff < 0.025 threshold.
  Effort: S

10.3 — Full structured critique (9 axes)
  Files: `Logs/iteration_log.md`
  Action: Score all 8 axes per CRITIQUE_SCORING_GUIDE.md plus War Camp Test (Axis 9). All axes must score 4+. War Camp Test must return YES.
  Effort: M

10.4 — Create pre-submission compliance script
  Files: `Scripts/pre_submission_check.sh` (new)
  Action: Implement Section 13.5 3-step compliance check: license plist, asset manifest verification, LoRA license gate status.
  Effort: S

10.5 — Fix any issues identified in critique
  Action: ONE FIX PER LOOP per Section 12.4. Iterate until all axes score 4+ and War Camp Test = YES.
  Effort: Variable

### Exit Criteria
- [ ] Reference screenshots captured for all 4 devices x 2 color schemes
- [ ] Visual regression diff < 0.025 on all screenshots
- [ ] Structured critique: ALL 8 axes score 4+ per CRITIQUE_SCORING_GUIDE.md
- [ ] War Camp Test: YES — "Imagine you are standing in a war camp. Does what you see feel like that card?"
- [ ] **Section 14 physical quality test:** A screenshot makes an observer want to reach out and touch the card
- [ ] One-fix-per-loop discipline followed for all corrections
- [ ] All HUMAN PROFILING REQUIRED flags resolved
- [ ] All PENDING PHYSICAL DEVICE VERIFICATION flags resolved

---

## Deferred Items (Not In This Plan)

These items are acknowledged but deferred beyond this implementation cycle:

- **iPad hand layout views** (CardHandArcView, CardHandSpreadView) — Section 9.1, Phase 8+ work
- **Stage Manager / Multiple Scenes** — Section 9.3, significant architecture
- **LoRA v2 training** — Blocked on budget/timing decision
- **Missing faction music** (celestial, endless) — Graceful degradation acceptable
- **4 stems per faction music structure** — Single-track, document deviation
- **CardRepository + test card JSON fixtures** — Nice-to-have for Previews
- **App Store submission assets** — Screenshots, legal pages, metadata
- **Stale scripts cleanup** — ~37 superseded files in Scripts/

---

## Dependency Graph

```
Phase 1 (Environment/Tooling)
   |
   +---> Phase 2 (Card Layout Fixes)
   |        |
   |        +---> Phase 10 (Quality Gate)
   |
   +---> Phase 3 (Texture Assets)
   |        |
   |        +---> Phase 4 (Metal Bridge) -----> Phase 7 (Haptics) --+
   |                |                                                |
   |                +---> Phase 9 (Performance) --------------------+---> Phase 10
   |
   +---> Phase 5 (Art Generation Pipeline)
   |
   +---> Phase 6 (Sound) ----------------------------------------+---> Phase 10
   |
   +---> Phase 8 (Accessibility) ---------------------------------+---> Phase 10
```

**Critical path:** Phase 1 -> Phase 3 -> Phase 4 (Metal Bridge) -> Phase 9/10
**Parallelizable:** Phase 5, Phase 6, Phase 8 can all run alongside Phase 4.

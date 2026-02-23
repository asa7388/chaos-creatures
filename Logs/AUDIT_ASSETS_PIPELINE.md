# Audit B: Assets & Pipeline
**Auditor:** Audit Agent B
**Date:** 2026-02-22
**Scope:** Card Design Guide Sections 3 (Asset Strategy & LoRA), 4 (Environment & Tool Setup), 8 (Sound), 11 (Production Workflow)
**Authority docs read:** CARD_DESIGN_GUIDE.md (Sections 3, 4, 8, 11 in full), GRIMDARK_AESTHETIC_DIRECTIVE.md (full), CRITIQUE_SCORING_GUIDE.md (full), ASSET_CREATION_GUIDE_v1.2.md (full)

---

## Section 3: Asset Strategy & LoRA

### CONFLICT [Section 3.1] -- Fey faction creature style string is wrong (KNOWN CONFLICT)
**File:** Card Design Guide Section 3.2 `FACTION_CREATURE_STYLE["fey"]` (and wherever it is eventually implemented)
**Current:** The Card Design Guide Section 3.2 defines `FACTION_CREATURE_STYLE["fey"]` as:
```
"Arthur Rackham and Edmund Dulac style, delicate sinuous linework, jewel-tone color,
enchanted forest atmosphere, organic forms, moonlit quality"
```
**Required per GRIMDARK_AESTHETIC_DIRECTIVE and ASSET_CREATION_GUIDE v1.2 Section 6.2:**
- Fey Verdant style should be: `English Pre-Raphaelite oil painting, dense inhabited undergrowth, warm earth tones, ancient canopy light, figures integrated with not posed against environment`
- Fey Hollow style should be: `19th century Scandinavian Romantic oil painting, cold Nordic forest, muted greys, winter stripped bare, patient predatory stillness`
- The terms "enchanted forest atmosphere" and "moonlit quality" directly contradict the GRIMDARK_AESTHETIC_DIRECTIVE which says: "Avoid: anything that reads as whimsical, light, or welcoming. The Fey are powerful and patient and dangerous."
**Recommended action:** When `Scripts/prompt_utils.py` is created, use the ASSET_CREATION_GUIDE Section 6.2 / Section 2.3 style descriptors verbatim. "Enchanted" and "moonlit" must be removed.

### CONFLICT [Section 3.1] -- Celestial faction creature style string is wrong (KNOWN CONFLICT)
**File:** Card Design Guide Section 3.2 `FACTION_CREATURE_STYLE["celestial"]`
**Current:**
```
"Gustave Dore Paradise Lost style, radiant divine light, upward composition,
monumental figure scale, William Blake prophetic power, warm gold and white"
```
**Required per GRIMDARK_AESTHETIC_DIRECTIVE and ASSET_CREATION_GUIDE v1.2 Section 6.4:**
- Celestial style should be: `18th century Visionary oil painting, prophetic divine geometry, burning cold gold, biblical scale, terrifying geometric radiance, multiple wings and eyes, James Barry RA style`
- Key correction: gold is "burning cold" not "warm" -- the Grimdark Directive says "The gold light they emit is not warm -- it is judgmental." The word "radiant divine light" should be replaced with "terrifying geometric radiance."
**Recommended action:** Update the style string to use ASSET_CREATION_GUIDE Section 6.4 language. Replace "radiant divine light" with "terrifying geometric radiance" and "warm gold" with "burning cold gold."

### ABSENT [Section 3.1b] -- prompt_utils.py does not exist in codebase
**File:** `Scripts/prompt_utils.py` -- referenced in Card Design Guide Section 3.2
**Current:** File does not exist. `Glob("**/prompt_utils*")` returns no results. The Card Design Guide specifies this file as the shared prompt utility for both creature and non-creature generation scripts.
**Required:** Per Section 3.2: `Scripts/prompt_utils.py` containing `FACTION_CREATURE_STYLE`, `SUBFACTION_CREATURE_STYLE`, `FACTION_NONCREATURE_STYLE`, `build_creature_prompt()`, and `build_noncreature_prompt()`.
**Recommended action:** Create `Scripts/prompt_utils.py` with corrected style strings per ASSET_CREATION_GUIDE Section 6 (not the Card Design Guide Section 3.2 strings, which have the Fey/Celestial conflicts noted above).

### ABSENT [Section 3.2] -- generate_creature.py does not exist
**File:** `Scripts/generate_creature.py` -- referenced in Card Design Guide Section 3.2
**Current:** No `generate_creature.py` file exists. `Glob("**/generate_creature*")` returns no results. There are 18 `.mjs` generation scripts (Node.js) from earlier phases but no Python creature generation script matching the guide spec.
**Required:** Per Section 3.2: A Python script using Replicate + LoRA (or fallback to fal.ai) for creature artwork generation.
**Recommended action:** Create `Scripts/generate_creature.py` implementing the generation call from Section 3.2. NOTE: The LoRA is RETIRED, so this script should default to fal.ai FLUX fallback until new LoRA v2 is trained.

### ABSENT [Section 3.3] -- generate_noncreature.py does not exist
**File:** `Scripts/generate_noncreature.py` -- referenced in Card Design Guide Section 3.3
**Current:** No `generate_noncreature.py` exists. `Glob("**/generate_noncreature*")` returns no results.
**Required:** Per Section 3.3: A Python script using fal.ai FLUX.1 Dev for non-creature artwork generation.
**Recommended action:** Create `Scripts/generate_noncreature.py` implementing the generation call from Section 3.3.

### COMPLIANT [Section 3.2] -- LoRA retirement documented correctly
**File:** `Logs/DEPENDENCY_DECISIONS.md` (Decision 3)
**Current:** The EldritchPaletteKnife LoRA is documented as RETIRED with clear explanation: "Run on services that generate for money" is blocked, which prevents Replicate use. The new LoRA v2 training pipeline is documented. The 35 existing card images are correctly marked as PLACEHOLDER.
**Required:** Per CLAUDE.md and ASSET_CREATION_GUIDE Section 0: LoRA retirement and new training pipeline.
**Recommended action:** None -- this is correctly documented.

### PARTIAL [Section 3.2] -- LoRA v2 training pipeline not yet implemented
**File:** `Scripts/train-sdxl-lora-replicate.mjs` (exists), `Scripts/train-style-lora.mjs` (exists)
**Current:** Two LoRA training scripts exist as `.mjs` (Node.js). No Python training script per ASSET_CREATION_GUIDE Section 0.5 exists. The ASSET_CREATION_GUIDE specifies `Scripts/train_lora.py` (Python).
**Required:** Per ASSET_CREATION_GUIDE Section 0.5: Python script using Replicate API for LoRA training on CC0 museum paintings.
**Recommended action:** The existing `.mjs` scripts may be functional. Either verify they implement the same pipeline or create the Python version. Training is blocked until budget/timing decisions are made.

### ABSENT [Section 3.4] -- Color grading pipeline script does not exist
**File:** `Scripts/grade_artwork.sh` -- referenced in Card Design Guide Section 3.4
**Current:** `Glob("**/grade_artwork*")` returns no results. The faction-specific color grading pipeline (base pass + per-faction grading) does not exist.
**Required:** Per Section 3.4: `Scripts/grade_artwork.sh` with ImageMagick commands for warm shift, blue reduction, saturation aging, warm vignette, plus per-faction passes for ironwright/fey/demonic/celestial/endless.
**Recommended action:** Create `Scripts/grade_artwork.sh` verbatim from Section 3.4. This is critical infrastructure -- all artwork must be color graded before use.

### ABSENT [Section 3.5] -- Normal map generation script does not exist
**File:** `Scripts/generate_normal_map.sh` -- referenced in Card Design Guide Section 3.5
**Current:** `Glob("**/normal_map*")` returns no results. No normal map generation script exists.
**Required:** Per Section 3.5: Shell script using ImageMagick to convert heightmap textures to normal maps for brushwork, parchment fiber, and wax seal shaders.
**Recommended action:** Create `Scripts/generate_normal_map.sh` from Section 3.5. This blocks shader work that depends on normal map textures.

### ABSENT [Section 3.5] -- Normal map texture assets missing from asset catalog
**File:** `Assets.xcassets/Textures/` -- expected: `parchment_normal.imageset/`, `brush_normal.imageset/`, `wax_seal_normal.imageset/`
**Current:** No normal map imagesets exist in the asset catalog. The texture catalog has `paper-texture`, `canvas-weave`, `dark-vellum`, `tex-parchment`, `tex-canvas-weave` -- all are diffuse textures, none are normal maps.
**Required:** Per Section 4.6: `parchment_normal.imageset/`, `brush_normal.imageset/`, `wax_seal_normal.imageset/` in `Assets.xcassets/Textures/`.
**Recommended action:** Generate normal maps using Section 3.5 pipeline, then add to asset catalog with ASTC compression.

### ABSENT [Section 3.6] -- Foil gradient texture does not exist
**File:** `Scripts/generate_foil_gradient.py` and `Assets.xcassets/Textures/foil_gradient.imageset/`
**Current:** `Glob("**/foil_gradient*")` returns no results. Neither the generation script nor the asset exists.
**Required:** Per Section 3.6 / Section 4.8: Foil gradient texture for the WarmFoilShader. Must exist before smoke test.
**Recommended action:** Create `Scripts/generate_foil_gradient.py` and generate the foil gradient asset. Add to asset catalog with ASTC compression.

### PARTIAL [Section 3.7] -- Art box compositing not yet implemented
**File:** N/A -- no compositing script or pipeline exists
**Current:** No art box compositing pipeline (edge vignette, AO shadow overlay) exists as standalone scripts.
**Required:** Per Section 3.7 / Step 11 in Section 11.2: Art box compositing including oil paint shader + edge vignette + AO shadow.
**Recommended action:** This is a Phase 3+ implementation task. Create compositing pipeline when shaders are ready.

### PARTIAL [Section 3.9] -- License manifest exists but has issues
**File:** `/Users/alexali/Projects/chaos-creatures/Resources/ASSET_LICENSE_MANIFEST.md`
**Current:** The manifest exists and includes fonts (6 entries, all OFL 1.1), AI-generated card art (35 placeholder entries), LoRA weights (2 entries), training data sources, and 50 wax seal entries (25 unique, duplicated -- the manifest was appended twice). Audio section says "To be populated in Phase 6."
**Required:** Per Section 3.9 / Section 11: Complete manifest with all assets tracked, no duplicates, audio entries populated.
**Recommended action:**
1. De-duplicate the wax seal entries (lines 46-94 are duplicate of lines 21-44 in the seal section).
2. Add entries for all audio files (19 SFX + 5 music files).
3. Add entries for UI textures (bg-dark-leather, bg-aged-wood, bg-polished-stone, bg-play-mat-felt, bg-metallic-foil, felt-table, etc.).
4. Add entries for keyword icons (20 kw-*.imageset assets).

### COMPLIANT [Section 3.2] -- Wax seal generation script exists and is correct
**File:** `/Users/alexali/Projects/chaos-creatures/scripts/generate_wax_seals.py`
**Current:** Script exists with correct faction symbols (scroll, tree, sledgehammer, wing, skull), correct rarity-driven wax colors (parchment-tan, pewter-silver, amber-gold, amethyst, ember-red), REMBG background removal, and 102x102px downscaling. Verification checks for opacity and color correctness are included. License manifest logging is present.
**Required:** Per Section 3.2 / ASSET_CREATION_GUIDE Section 2.5: Wax seal generation with faction x rarity matrix.
**Recommended action:** None -- this script is well-implemented.

### ABSENT [Section 3.2] -- verify_asset.py does not exist
**File:** `Scripts/verify_asset.py` -- referenced 4+ times in Card Design Guide Sections 3.2, 3.3, 3.4
**Current:** `Glob("**/verify_asset*")` returns no results. This script is called after every generation call to verify output dimensions and quality.
**Required:** Per Section 3.2: `Scripts/verify_asset.py` with `--min-width`, `--min-height`, `--no-error-payload` flags.
**Recommended action:** Create `Scripts/verify_asset.py` implementing dimension and quality checks.

---

## Section 4: Environment & Tool Setup

### ABSENT [Section 4.1] -- verify_environment.sh does not exist
**File:** `Scripts/verify_environment.sh` -- the master environment check script
**Current:** `Glob("**/verify_environment.sh")` returns no results. This is the single most important setup script -- it verifies Xcode, simulators, CLI tools, Python libs, API keys, and API connectivity.
**Required:** Per Section 4.1: Master environment verification script that checks all tools, simulators, Python libraries, API keys, and live connectivity.
**Recommended action:** Create `Scripts/verify_environment.sh` verbatim from Section 4.1. This is the first script that should exist.

### CONFLICT [Section 4.6] -- ASTC compression NOT set on any imageset
**File:** Sample checked: `CardTextures/paper-texture.imageset/Contents.json`, `CardTextures/tex-parchment.imageset/Contents.json`
**Current:** Both sample Contents.json files have no `"properties"` key at all. No `"compression-type": "automatic"` setting. Checked two representative texture imagesets -- neither has ASTC compression configured.
```json
{
  "images": [{"filename": "paper-texture.png", "idiom": "universal", "scale": "1x"}, ...],
  "info": {"author": "xcode", "version": 1}
}
```
**Required:** Per Section 4.6: Every `.imageset` in the Textures directory must have:
```json
"properties": { "compression-type": "automatic" }
```
This enables ASTC 4x4 on A8+ devices, reducing VRAM by ~6x.
**Recommended action:** Run `python3 Scripts/set_astc_compression.py` (which also needs to be created) across all texture imagesets. This is a significant VRAM optimization that is currently missing.

### ABSENT [Section 4.6] -- set_astc_compression.py does not exist
**File:** `Scripts/set_astc_compression.py` -- referenced in Section 4.6
**Current:** Script does not exist.
**Required:** Per Section 4.6: Python script to apply ASTC compression to all texture imageset Contents.json files.
**Recommended action:** Create from Section 4.6 spec.

### PARTIAL [Section 4.6] -- Asset catalog structure does not match guide spec
**File:** `ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/`
**Current:** The asset catalog is organized into: `CardTextures/`, `UIBackgrounds/`, `TextPanels/`, `StatIcons/`, `KeywordIcons/`, `FactionEmblems/`, `CardBacks/`, `UIComponents/`. This is a reasonable structure but does NOT match the guide's specified structure.
**Required:** Per Section 4.6:
```
Assets.xcassets/
  Textures/          (parchment_base, parchment_normal, brush_normal, foil_gradient, wax_seal_normal, canvas_base)
  Artwork/           (one folder per card)
  Icons/             (mana symbols, ability icons)
  Colors/            (named colors from palette Section 1.2)
```
**Recommended action:** This is a minor organizational difference -- the current structure works. However, the critical issue is that the guide's `Textures/` directory expects specific texture files (parchment_normal, brush_normal, foil_gradient, wax_seal_normal) that DO NOT EXIST in the current catalog regardless of directory structure. The missing textures are the real problem (covered in Section 3.5 and 3.6 above).

### PARTIAL [Section 1.5 / 4.7] -- Font registration in Info.plist has extra fonts
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Config/Info.plist`
**Current:** UIAppFonts array contains 12 entries:
- `Cinzel-Variable.ttf` -- NOT in guide spec (variable font, may work)
- `Alegreya-Variable.ttf` -- RETIRED per DEPENDENCY_DECISIONS.md Decision 2
- `Alegreya-Italic-Variable.ttf` -- RETIRED
- `BebasNeue-Regular.ttf` -- NOT in guide spec, not a guide font
- `FiraSans-Regular.ttf` -- NOT in guide spec, not a guide font
- `FiraSans-SemiBold.ttf` -- NOT in guide spec, not a guide font
- `Cinzel-Regular.ttf` -- COMPLIANT
- `Cinzel-Bold.ttf` -- COMPLIANT
- `EBGaramond-Regular.ttf` -- COMPLIANT
- `EBGaramond-Italic.ttf` -- COMPLIANT
- `EBGaramond-SemiBold.ttf` -- COMPLIANT
- `Oswald-Bold.ttf` -- COMPLIANT

**Required:** Per Section 1.5 / Section 4.7: Exactly 6 fonts:
- Cinzel-Regular, Cinzel-Bold, EBGaramond-Regular, EBGaramond-Italic, EBGaramond-SemiBold, Oswald-Bold

**Recommended action:**
1. Remove Alegreya, BebasNeue, FiraSans from UIAppFonts (these are retired per Decision 2).
2. The Cinzel-Variable.ttf entry should probably remain (it covers both Regular and Bold weights as a variable font), but then the separate Cinzel-Regular.ttf and Cinzel-Bold.ttf entries are redundant. Decide which approach to use and remove the duplicates.
3. Verify all non-card screens have been migrated off Alegreya/BebasNeue/FiraSans before removing the font files.

### COMPLIANT [Section 4.7] -- All 12 font files present in Resources/Fonts/
**File:** `ChaosCreatures/ChaosCreatures/Resources/Fonts/`
**Current:** 12 font files present: Cinzel-Variable.ttf, Alegreya-Variable.ttf, Alegreya-Italic-Variable.ttf, BebasNeue-Regular.ttf, FiraSans-Regular.ttf, FiraSans-SemiBold.ttf, Cinzel-Regular.ttf, Cinzel-Bold.ttf, EBGaramond-Regular.ttf, EBGaramond-Italic.ttf, EBGaramond-SemiBold.ttf, Oswald-Bold.ttf.
**Required:** The 6 guide-specified fonts ARE present. The extra 6 are legacy.
**Recommended action:** Once non-card screens are audited and migrated, remove the 6 legacy font files.

### ABSENT [Section 4.4] -- download_textures.sh does not exist
**File:** `Scripts/download_textures.sh` -- referenced in Section 4.4 and 4.8
**Current:** `Glob("**/download_textures*")` returns no results.
**Required:** Per Section 4.4: Shell script to download CC0 PBR textures from Poly Haven (parchment diffuse, parchment normal, canvas diffuse, canvas normal).
**Recommended action:** Create from Section 4.4 spec. This is a prerequisite for the smoke test.

### ABSENT [Section 4.5] -- load_env.sh does not exist
**File:** `Scripts/load_env.sh` -- referenced in Sections 4.5, 8.2
**Current:** No project-level `Scripts/load_env.sh` exists (only a supabase-swift dependency has one).
**Required:** Per Section 4.5: Shell script to source `.env` and report how many keys are loaded.
**Recommended action:** Create from Section 4.5 spec.

### PARTIAL [Section 4.5] -- .env.example is missing guide-specific keys
**File:** `/Users/alexali/Projects/chaos-creatures/.env.example`
**Current:** Contains: SUPABASE_SERVICE_ROLE_KEY, FAL_KEY, OPENAI_API_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, GAME_SERVER_SECRET, ADMIN_PASSWORD, ADMIN_JWT_SECRET, POSTHOG_API_KEY, POSTHOG_HOST.
**Required:** Per Section 4.5: Must also include: `REPLICATE_API_TOKEN`, `LORA_URL`, `FREESOUND_API_KEY`.
**Recommended action:** Add the three missing keys to `.env.example`.

### COMPLIANT [Section 4.4] -- compile_shaders.sh exists and is correct
**File:** `/Users/alexali/Projects/chaos-creatures/Scripts/compile_shaders.sh`
**Current:** Script exists, uses `xcrun --find metal`, compiles all `.metal` files in the Shaders directory, logs results, and exits non-zero on failure.
**Required:** Per Section 6.1 reference: Metal shader pre-compilation.
**Recommended action:** None -- well-implemented.

### PARTIAL [Section 4.9] -- screenshot_all_devices.sh exists but has wrong device list
**File:** `/Users/alexali/Projects/chaos-creatures/Scripts/screenshot_all_devices.sh`
**Current:** Device list uses: "iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone 16e", "iPad Pro 13-inch".
**Required:** Per Section 4.1: "iPhone 15 Pro" (A17 120Hz), "iPhone 12" (A14 60Hz performance floor), "iPad Pro 12.9-inch 6th gen" (M2), "iPad Air 5th gen" (M1).
**Recommended action:** Update the DEVICES array to match the guide's four-device requirement. The current devices may correspond to the dev environment's available simulators but do not match the spec's required set.

### PARTIAL [Section 4.3] -- Python requirements.txt is incomplete
**File:** `/Users/alexali/Projects/chaos-creatures/Scripts/requirements.txt`
**Current:** Contains: Pillow>=10.0.0, requests>=2.31.0, replicate>=0.25.0, numpy>=1.24.0.
**Required:** Per Section 4.1/4.4: Must also include `fal-client` (for fal.ai generation), and optionally `rembg` (for wax seal background removal -- used in generate_wax_seals.py).
**Recommended action:** Add `fal-client` and `rembg` to requirements.txt.

---

## Section 8: Sound Design

### CONFLICT [Section 8.2] -- Sound files are .wav, guide specifies .caf
**File:** All files in `ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/` and `Music/`
**Current:** All 19 SFX files and 5 music files are `.wav` format.
**Required:** Per Section 8.2: Files should be `.caf` (iOS native audio format). The processing pipeline in Section 8.2 ends with `afconvert -f caff -d LEI16@44100 ... Resources/Sounds/${NAME}.caf`. The SoundEngine implementation in Section 8.3 loads files with extension `.caf`: `Bundle.main.url(forResource: name, withExtension: "caf")`.
**Recommended action:** Convert all audio files from `.wav` to `.caf` using: `afconvert -f caff -d LEI16@44100 input.wav output.caf`. Then update BattleAudioManager.swift to use `.caf` extension (or keep `.wav` and update the guide -- but the guide is authoritative).

### CONFLICT [Section 8.3] -- BattleAudioManager does not match guide's SoundEngine spec
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/BattleAudioManager.swift`
**Current:** BattleAudioManager is a combined music + SFX manager. The SFX section:
- Uses `SKAction.playSoundFileNamed` (SpriteKit) or `AVAudioPlayer` fallback
- Hardcodes `.wav` extension (line 232: `let fileName = sfx.rawValue + ".wav"`)
- Has 19 SFX enum cases: cardPlay, attack, damage, death, heal, shieldBreak, chaosRollStart, chaosRollOrder, chaosRollChaos, chaosRollNothing, eventOrder, eventChaos, turnStart, manaGain, buttonTap, victory, defeat, chaosSpark, evolutionReveal

**Required:** Per Section 8.3: A separate `SoundEngine.swift` using `AVAudioEngine` with `AVAudioPlayerNode` per sound, preloaded buffers, and `.caf` extension. The guide's SFX list from Section 8.1 includes: card_pickup, card_setdown, card_flip, wax_seal_tap, card_summon, card_graveyard, foil_shimmer, epic_reveal, legendary_reveal, card_drag, ambient.
**Conflicts identified:**
1. **Architecture mismatch:** Guide specifies `AVAudioEngine` + `AVAudioPlayerNode` for both music and SFX (low latency preloaded buffers). Current implementation uses `SKAction.playSoundFileNamed` for SFX (higher latency, no preloading).
2. **File extension:** Hardcoded `.wav` on line 232, guide requires `.caf`.
3. **Missing SFX:** Guide-required sounds not in enum: `card_pickup`, `card_setdown`, `card_flip`, `card_graveyard`, `card_summon`, `wax_seal_tap`, `foil_shimmer`, `epic_reveal`, `legendary_reveal`.
4. **Extra SFX:** Current enum has game-logic SFX not in the guide's material-sound list: attack, damage, death, heal, shieldBreak, chaosRollStart, etc. These may be intentional additions beyond the guide scope.

**Recommended action:**
1. Create `SoundEngine.swift` per Section 8.3 spec for material interaction sounds.
2. BattleAudioManager can remain for game-logic SFX (attack, damage, etc.) but should be updated to use `.caf` and `AVAudioEngine`.
3. Add the 9 missing material-sound SFX cases.
4. Update file extension from `.wav` to `.caf`.

### CONFLICT [Section 8.3] -- Music stem naming convention bug
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/BattleAudioManager.swift` (line 107)
**Current:** Music stems are loaded as: `"\(currentFaction.rawValue.lowercased())_\(stem)"` -- producing filenames like `ironwright_base`, `fey_base`, `demonic_base`.
**Actual files on disk:** `battle-ironwright.wav`, `battle-fey.wav`, `battle-demonic.wav`, `battle-tension.wav`, `menu-ambient.wav`.
**Problems:**
1. The code generates `ironwright_base.caf` but files are named `battle-ironwright.wav` -- uses underscores vs hyphens, different prefix pattern, missing stem suffix.
2. Music files use `.wav` but code looks for `.caf`.
3. There is only 1 file per faction (e.g., `battle-ironwright.wav`) but the code expects 4 stems per faction (`ironwright_base`, `ironwright_tension`, `ironwright_chaos`, `ironwright_victory`).
4. `battle-tension.wav` exists as a shared tension stem, but the code expects faction-specific tension stems.
**Required:** Per Section 8.3 / AUDIO-SOURCING-GUIDE.md: 4 stems per faction (`{faction}_base.caf`, `{faction}_tension.caf`, `{faction}_chaos.caf`, `{faction}_victory.caf`).
**Recommended action:** Either: (a) rename existing files to match the code's naming convention and convert to `.caf`, or (b) update the code to match the actual file names. Option (a) is preferred since the code follows the guide pattern. Also need to generate the missing stems (only 1 per faction exists, need 4).

### CONFLICT [Section 8.1] -- Missing guide-required SFX files
**File:** `ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/`
**Current SFX on disk (19 files):** sfx_card_play, sfx_attack, sfx_damage, sfx_death, sfx_heal, sfx_shield_break, sfx_chaos_roll_start, sfx_chaos_roll_order, sfx_chaos_roll_chaos, sfx_chaos_roll_nothing, sfx_event_order, sfx_event_chaos, sfx_turn_start, sfx_mana_gain, sfx_button_tap, sfx_victory, sfx_defeat, sfx_chaos_spark, sfx_evolution_reveal.
**Missing per Section 8.1:**
- `card_pickup` (soft cardstock flex, paper rustle)
- `card_setdown` (crisp cardstock landing on wood)
- `card_flip` (paper whoosh + landing thud)
- `card_graveyard` (slow paper crumple)
- `card_summon` (ink brush stroke building to resonant thrum)
- `wax_seal_tap` (low dampened thud)
- `foil_shimmer` (delicate shimmer + subtle ring)
**Required:** Per Section 8.1 and GRIMDARK_AESTHETIC_DIRECTIVE Sound section: Physical material sounds for card interactions.
**Recommended action:** Source these 7 sounds from Freesound.org (CC0 only) or record them. These are the core "physical material" sounds that define the grimdark tactile feel.

### PARTIAL [Section 8.1] -- Existing SFX are mostly silent placeholders
**File:** `ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/`
**Current:** File size analysis shows 16 of 19 SFX files are exactly 8,864 bytes -- this is the signature size of a minimal silent WAV header + ~100ms of silence. Only 3 files have real content: sfx_victory (264KB), sfx_defeat (264KB), sfx_evolution_reveal (220KB). The AUDIO-SOURCING-GUIDE.md confirms: "All 19 SFX placeholders have been generated as silent WAV files."
**Required:** Per Section 8.1: All SFX should be real material sounds, processed through the warmth EQ pipeline (Section 8.2).
**Recommended action:** Replace all 16 silent placeholder files with real CC0 sounds from Freesound.org per the search terms in AUDIO-SOURCING-GUIDE.md. Process through the ffmpeg pipeline in Section 8.2.

### ABSENT [Section 8.1] -- Missing faction music files (celestial, endless)
**File:** `ChaosCreatures/ChaosCreatures/Resources/Sounds/Music/`
**Current:** 5 music files: battle-ironwright.wav, battle-fey.wav, battle-demonic.wav, battle-tension.wav, menu-ambient.wav. All are 264KB, likely also placeholders.
**Required:** Per AUDIO-SOURCING-GUIDE.md and Section 8.1:
- Missing: `battle-celestial.wav` (or `.caf`)
- Missing: `battle-endless.wav` (or `.caf`)
- Missing: All per-faction stems (base/tension/chaos/victory x 5 factions = 20 stems total)
**Recommended action:** Generate or source faction music for all 5 factions. Currently only 3 factions have any music file (ironwright, fey, demonic). Celestial and Endless are completely absent.

### ABSENT [Section 8.2] -- Sound processing pipeline not implemented
**File:** No `Scripts/download_sounds.sh` or equivalent processing script exists.
**Current:** No ffmpeg processing pipeline exists. The AUDIO-SOURCING-GUIDE.md describes a manual process but no automation.
**Required:** Per Section 8.2: `Scripts/download_sounds.sh` (Freesound API download + CC0 filter) and processing pipeline (normalize to -12 LUFS, trim silence, convert to `.caf`).
**Recommended action:** Create `Scripts/download_sounds.sh` from Section 8.2. Create `Scripts/process_sounds.sh` implementing the ffmpeg pipeline.

### PARTIAL [Section 8.1] -- AUDIO-SOURCING-GUIDE.md exists but has aesthetic conflicts
**File:** `/Users/alexali/Projects/chaos-creatures/Scripts/AUDIO-SOURCING-GUIDE.md`
**Current:** The guide describes SFX in digital game terms: "Whoosh when a card is played" (sfx_card_play), "Impact sound when creature attacks" (sfx_attack), "Healing chime/sparkle" (sfx_heal), "Glass/energy shield breaking" (sfx_shield_break). Search terms like "sword hit", "magic sparkle", "crystal break" steer toward digital game sound effects.
**Required:** Per GRIMDARK_AESTHETIC_DIRECTIVE Sound section: "Card sounds are sounds of physical materials: card stock, wax, fabric, wood, metal. Not synthesized game sounds. Not confirmation tones. Not UI feedback bleeps."
**Recommended action:** Update AUDIO-SOURCING-GUIDE.md search terms to target physical material sounds rather than digital game SFX. For example: sfx_card_play should search for "cardstock paper", not "whoosh card"; sfx_heal should search for "warm resonant tone" not "heal chime sparkle".

---

## Section 11: Production Workflow

### PARTIAL [Section 11.1] -- Budget ledger exists but is incorrect
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/BUDGET_LEDGER.md`
**Current:** Ledger shows "Total budget: $10.00" with $0 spent. No actual API call costs logged.
**Required:** Per Section 11.1: Budget allocation table with categories (Creature artwork 35%, Non-creature 25%, Iterations 15%, Layer segmentation 15%, Textures 5%, Reserve 5%). Should reflect actual spending. The overall project polish budget is ~$100 remaining per CLAUDE.md.
**Problems:**
1. The $10.00 budget seems arbitrary and does not match CLAUDE.md's ~$100 remaining polish budget.
2. No actual API costs have been logged despite wax seal generation having run (25 seals at ~$0.025/image = ~$0.63).
3. The budget allocation categories don't match Section 11.1.
**Recommended action:** Update budget total to reflect actual remaining budget. Log the wax seal generation costs. Add Section 11.1 category allocations.

### COMPLIANT [Section 11.2] -- DEPENDENCY_DECISIONS.md exists and is thorough
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/DEPENDENCY_DECISIONS.md`
**Current:** Contains 4 decisions: Card layout architecture, Typography font set, Generation pipeline architecture (with LoRA license gate findings), and Unified cost display. All are owner-approved with clear rationale.
**Required:** Per Section 11 / Section 3.3: Document service decisions, license gates, and architectural choices.
**Recommended action:** None -- well-documented.

### PARTIAL [Section 3.2] -- LoRA license evidence file is incorrectly named
**File:** Expected: `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png`
**Current:** `Resources/LegalEvidence/eldritchpaletteknife_license_REVIEWED.md` exists (a markdown file, not a screenshot).
**Required:** Per Section 3.2: "Screenshot this and store it in `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png`."
**Recommended action:** This is a minor discrepancy. The markdown review file documents the license gate findings (which is arguably more useful than a screenshot). Since the LoRA is RETIRED anyway, this is informational only. No action needed unless the LoRA is reconsidered.

---

## Scripts/ Directory Categorization (78 files total)

### CURRENT -- Active pipeline scripts
| File | Purpose |
|------|---------|
| `compile_shaders.sh` | Metal shader pre-compilation |
| `screenshot_all_devices.sh` | Simulator screenshots |
| `generate_wax_seals.py` | Wax seal generation (fal.ai) |
| `install_wax_seals.py` | Install generated seals to asset catalog |
| `preview_wax_seal.py` | Preview wax seal output |
| `reinstall_wax_seals_raw.py` | Reinstall raw wax seals |
| `download_wax_references.py` | Download wax seal reference images |
| `requirements.txt` | Python dependencies |
| `AUDIO-SOURCING-GUIDE.md` | Audio sourcing documentation |
| `generate-placeholder-audio.mjs` | Generate silent audio placeholders |
| `setup-local.sh` | Local dev environment setup |
| `deploy.sh` | Deployment script |
| `generate-wax-seals.mjs` | Wax seal generation (Node.js version) |

### CURRENT -- Faction prompt files
| File | Purpose |
|------|---------|
| `factions/celestial.mjs` | Celestial faction prompts |
| `factions/demonic.mjs` | Demonic faction prompts |
| `factions/endless.mjs` | Endless faction prompts |
| `factions/fey-courts.mjs` | Fey Courts faction prompts |
| `factions/ironwright.mjs` | Ironwright faction prompts |

### CURRENT -- Asset generation (visual textures, icons, frames)
| File | Purpose |
|------|---------|
| `generate-card-textures.mjs` | Card texture generation |
| `generate-card-textures-v2.mjs` | Card texture generation v2 |
| `generate-card-frames.mjs` | Card frame generation |
| `generate-visual-textures.mjs` | Visual texture generation |
| `generate-icons.mjs` | Icon generation |
| `generate-icons-v2.mjs` | Icon generation v2 |
| `generate-ui-icons.mjs` | UI icon generation |
| `generate-ui-icons-extras.mjs` | Additional UI icons |
| `generate-ui-icons-missing.mjs` | Missing UI icons |
| `generate-stat-icons.mjs` | Stat icon generation |
| `generate-faction-tab-icons.mjs` | Faction tab icons |
| `generate-base-pool.mjs` | Base card pool generation |
| `generate-test-cards.mjs` | Test card generation |
| `install-regen-textures.mjs` | Install regenerated textures |
| `regen-failed-textures.mjs` | Regenerate failed textures |
| `gen-custom.mjs` | Custom generation utility |
| `preview-cards.mjs` | Card preview utility |

### STALE -- Superseded evolution scripts (multiple iterations, most replaced by later versions)
| File | Purpose | Status |
|------|---------|--------|
| `evolve-all-kl.mjs` | Evolution via KL method | Superseded by evolve-all-pro.mjs |
| `evolve-all-pro.mjs` | Evolution via Pro method | Latest evolution script |
| `evolve-kl-max.mjs` | KL max scale evolution | Superseded |
| `evolve-kl-scales.mjs` | KL scale testing | Superseded |
| `evolve-kontext-lora.mjs` | Kontext + LoRA evolution | Superseded (LoRA retired) |
| `evolve-kontext-styled.mjs` | Kontext styled evolution | Superseded |
| `evolve-oil-chain.mjs` | Oil paint chain evolution | Superseded |
| `evolve-preview.mjs` | Evolution preview | May still be useful |
| `evolve-pro-texture.mjs` | Pro texture evolution | Superseded |
| `evolve-rare-pro.mjs` | Rare tier pro evolution | Superseded |
| `evolve-retry-pro.mjs` | Retry failed pro evolutions | May still be useful |
| `evolve-test-cards.mjs` | Test card evolution | Superseded |
| `evolve-test-oil.mjs` | Oil paint test evolution | Superseded |
| `evolve-test-pro.mjs` | Test pro evolution | Superseded |
| `evolve-test-strength.mjs` | Strength parameter testing | Superseded |
| `evolve-two-pass-pro.mjs` | Two-pass pro evolution | Superseded by evolve-all-pro.mjs |
| `evolve-two-pass-v2.mjs` | Two-pass v2 evolution | Superseded |
| `evolve-two-pass.mjs` | Two-pass evolution | Superseded |
| `regen-cabals-iter3.mjs` | Cabals iteration 3 regen | One-time fix |
| `regen-failed-iter2.mjs` | Iteration 2 failure regen | One-time fix |

### STALE -- Version test scripts (v2-v18, used for style iteration, no longer needed)
| File | Purpose | Status |
|------|---------|--------|
| `generate-v2-test.mjs` | Style v2 test | Test iteration, superseded |
| `generate-v3-test.mjs` | Style v3 test | Test iteration, superseded |
| `generate-v4-test.mjs` | Style v4 test | Test iteration, superseded |
| `generate-v5-test.mjs` | Style v5 test (anchor) | Historical -- v5 was the locked anchor |
| `generate-v6-test.mjs` | Style v6 test | Test iteration, superseded |
| `generate-v7-test.mjs` | Style v7 test | Test iteration, superseded |
| `generate-v8-test.mjs` | Style v8 test | Test iteration, superseded |
| `generate-v9-test.mjs` | Style v9 test | Test iteration, superseded |
| `generate-v10-test.mjs` | Style v10 test | Test iteration, superseded |
| `generate-v11-test.mjs` | Style v11 test | Test iteration, superseded |
| `generate-v12-test.mjs` | Style v12 test | Test iteration, superseded |
| `generate-v13-test.mjs` | Style v13 test | Test iteration, superseded |
| `generate-v14-lora-test.mjs` | LoRA v14 test | Test iteration, superseded |
| `generate-v15-lora-weight-test.mjs` | LoRA weight v15 test | Test iteration, superseded |
| `generate-v16-sdxl-dual-lora.mjs` | SDXL dual LoRA v16 test | Test iteration, superseded |
| `generate-v17-sdxl-scale-test.mjs` | SDXL scale v17 test | Test iteration, superseded |
| `generate-v18-sdxl-full-test.mjs` | SDXL full v18 test | Test iteration, superseded |

### RETIRED -- LoRA-related (retired due to license gate)
| File | Purpose | Status |
|------|---------|--------|
| `train-sdxl-lora-replicate.mjs` | LoRA training via Replicate | May be reused for LoRA v2 |
| `train-style-lora.mjs` | Style LoRA training | May be reused for LoRA v2 |
| `lora-compare.mjs` | LoRA comparison utility | May be reused for LoRA v2 |
| `upload-v18-to-r2.mjs` | Upload v18 LoRA to R2 | Retired (v18 LoRA retired) |
| `test-sd-api.mjs` | Test Stable Diffusion API | Utility, may still be useful |

### OTHER
| File | Purpose |
|------|---------|
| `validate-art-quality.mjs` | Art quality validation |
| `validate-evolution-quality.mjs` | Evolution quality validation |
| `generate-cards.sh` | Shell wrapper for card generation |
| `output/` | Directory containing generated output (seal-final, seal-masks) |
| `preview/` | Directory containing preview images (~209 files) |

---

## Summary

| Status | Count |
|--------|-------|
| COMPLIANT | 4 |
| CONFLICT | 7 |
| PARTIAL | 9 |
| ABSENT | 12 |

**Total items audited: 32**

### Critical Items (must fix before any artwork generation runs)

1. **prompt_utils.py Fey/Celestial style strings** -- CONFLICT. The Fey "enchanted forest atmosphere, moonlit quality" and Celestial "radiant divine light, warm gold" strings directly contradict the Grimdark Directive. Must use ASSET_CREATION_GUIDE Section 6 strings. Block artwork generation until fixed.

2. **prompt_utils.py does not exist** -- ABSENT. The entire shared prompt infrastructure is missing. No Python generation scripts exist (generate_creature.py, generate_noncreature.py).

3. **Sound format is .wav, guide requires .caf** -- CONFLICT. All 24 audio files use wrong format. BattleAudioManager hardcodes `.wav`. Must convert and update code.

4. **BattleAudioManager music stem naming bug** -- CONFLICT. Code generates filenames that don't match any file on disk. Music playback is completely broken (silent no-ops).

5. **16 of 19 SFX are silent placeholders** -- PARTIAL. Only 3 SFX have real audio content.

6. **7 guide-required physical-material SFX are completely absent** -- ABSENT. card_pickup, card_setdown, card_flip, card_graveyard, card_summon, wax_seal_tap, foil_shimmer.

7. **ASTC compression not set on any texture imageset** -- CONFLICT. 6x VRAM savings missing on all texture assets.

### Important Items (should fix before next phase)

8. **verify_environment.sh does not exist** -- ABSENT. The master environment check is the first thing the guide says to create.

9. **Color grading pipeline missing** -- ABSENT. No grade_artwork.sh means artwork cannot be color-matched to the parchment palette.

10. **Normal map assets missing** -- ABSENT. Three shaders depend on normal maps that don't exist.

11. **Foil gradient texture missing** -- ABSENT. WarmFoilShader has no texture to work with.

12. **Budget ledger has wrong total and no logged costs** -- PARTIAL. Wax seal costs not logged.

13. **Info.plist has 6 retired fonts still registered** -- PARTIAL. Alegreya, BebasNeue, FiraSans should be removed once non-card screens are migrated.

### Informational (low priority)

14. Scripts/ directory has ~37 stale/superseded files (v2-v18 test scripts, superseded evolution scripts). Consider archiving to a `Scripts/archive/` directory to reduce clutter.

15. License manifest has duplicate wax seal entries (appended twice).

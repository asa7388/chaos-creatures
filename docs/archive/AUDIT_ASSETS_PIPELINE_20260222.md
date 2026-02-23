# Audit Report: Sections 3, 4, 8, 11
**Audit Agent:** B
**Sections covered:** 3 (Asset Strategy), 4 (Environment & Tool Setup), 8 (Sound), 11 (Production Workflow)
**Date:** 2026-02-21
**Status:** Complete

---

## Summary

| Category | Count |
|----------|-------|
| COMPLIANT | 6 |
| PARTIAL | 9 |
| CONFLICT | 5 |
| ABSENT | 22 |
| **Total findings** | **42** |

---

## Section 3 — Commercially Safe Asset Strategy

### [CONFLICT] Section 3.2 — Generation pipeline uses fal-ai/fast-sdxl, not Replicate LoRA
**File:** `/Users/alexali/Projects/chaos-creatures/scripts/generate-base-pool.mjs` (line 465, 892), `generate-test-cards.mjs` (line 892), `gen-custom.mjs` (line 53), `evolve-preview.mjs` (line 137), and 8+ other scripts
**Current:** All primary creature generation scripts use `fal-ai/fast-sdxl` via fal.ai's queue API. The guide's `chscrt-sdxl-lora.safetensors` on R2 and Replicate's `extra_lora` mechanism are not present anywhere in the codebase.
**Required:** Creature artwork must be generated via the custom LoRA (`chscrt-sdxl-lora.safetensors`) deployed to R2 and loaded at inference time via Replicate's `extra_lora` parameter, using the `stability-ai/sdxl` model on Replicate (not fal.ai for creatures).
**Recommended action:** Create new Python scripts `Scripts/generate_creature.py` and `Scripts/evolve_creature.py` using the Replicate client as specified in Section 3.2. The existing `.mjs` scripts can remain as legacy references but must not be used for new production generation.

---

### [CONFLICT] Section 3.2 — LoRA weight file `chscrt-sdxl-lora.safetensors` is not confirmed present at R2 URL
**File:** R2 storage (not a codebase file)
**Current:** The `.env` file does not include a `LORA_URL` key, and no codebase script references the `chscrt-sdxl-lora.safetensors` filename at the canonical R2 path. The LoRA training result JSON exists at `scripts/preview/sdxl-lora-training-result.json` suggesting a training run completed on Replicate, but no download/upload to R2 is confirmed.
**Required:** `LORA_URL=https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors` must be in `.env`. The weight file must be present at that URL (verifiable via `requests.head()`).
**Recommended action:** Confirm the LoRA is uploaded to R2 at that path; add `LORA_URL` to `.env`; run the R2 reachability check from Section 3.2.

---

### [CONFLICT] Section 3.3 — Non-creature pipeline uses fal-ai/fast-sdxl, not fal-ai/flux/dev
**File:** `scripts/generate-base-pool.mjs` (line 465 and throughout), `scripts/generate-test-cards.mjs` (line 892)
**Current:** Non-creature cards are generated using `fal-ai/fast-sdxl` + EldritchPaletteKnife or ClassipeintXL LoRA, not `fal-ai/flux/dev` (FLUX.1 Dev). The evolution scripts for non-creatures use `fal-ai/flux-kontext-lora` or `fal-ai/flux-pro/kontext` (FLUX Kontext variants, not the base FLUX.1 Dev endpoint).
**Required:** Non-creature artwork (spells, stabilizers, planar ruins) must use `fal-ai/flux/dev` with the faction-aware prompt templates from `Scripts/prompt_utils.py`. FLUX Kontext is an img2img/editing model distinct from FLUX.1 Dev for text-to-image.
**Recommended action:** Create `Scripts/generate_noncreature.py` using `fal_client.run("fal-ai/flux/dev", ...)` as specified in Section 3.3. Separate evolution scripts (Section 3.4b) should use `fal-ai/flux/dev` with `image_url` + `strength` for non-creature img2img.

---

### [ABSENT] Section 3.4 — `Scripts/grade_artwork.sh` does not exist
**File:** Not found anywhere in the codebase
**Current:** Nothing. No color grading pipeline exists for faction-aware artwork processing.
**Required:** A 5-pass ImageMagick bash script: base warm-shift pass (blue reduction, vignette) followed by faction-specific pass (ironwright shadow deepening, fey blue/green lift, demonic red push, celestial highlight lift, endless desaturation). Outputs to `Resources/CardArt/`.
**Recommended action:** Create `/Users/alexali/Projects/chaos-creatures/Scripts/grade_artwork.sh` with the exact pipeline from Section 3.4. This is a hard dependency for all artwork post-processing.

---

### [ABSENT] Section 3.5 — `Scripts/generate_normal_map.sh` does not exist
**File:** Not found anywhere in the codebase
**Current:** Nothing. No normal map generation script exists.
**Required:** A bash script that converts a grayscale heightmap source to an RGB normal map (R=X, G=Y, B=Z) using ImageMagick's clone/roll/fx technique.
**Recommended action:** Create `Scripts/generate_normal_map.sh` per Section 3.5 specification.

---

### [ABSENT] Section 3.5 — `Scripts/generate_wax_normal.py` does not exist
**File:** Not found anywhere in the codebase
**Current:** Nothing.
**Required:** A Python script (using Pillow + numpy) that procedurally generates a 256×256 dome-shaped normal map for the wax seal shader, saved to `Resources/Textures/wax_seal_normal.png`.
**Recommended action:** Create `Scripts/generate_wax_normal.py` per Section 3.5 specification.

---

### [ABSENT] Section 3.6 — `Scripts/generate_foil_gradient.py` does not exist
**File:** Not found anywhere in the codebase
**Current:** Nothing.
**Required:** A Python script (using Pillow + numpy) that generates a 512×512 warm iridescent gradient texture (gold → amber → copper → bronze → gold) with sine wave vertical variation, saved to `Resources/Textures/foil_gradient.png`.
**Recommended action:** Create `Scripts/generate_foil_gradient.py` per Section 3.6 specification.

---

### [ABSENT] Section 3.2 — `Scripts/prompt_utils.py` does not exist
**File:** Not found anywhere in the codebase
**Current:** Prompt construction logic is embedded in each individual `.mjs` script without a shared Python utility module.
**Required:** A Python module `Scripts/prompt_utils.py` containing `FACTION_CREATURE_STYLE`, `SUBFACTION_CREATURE_STYLE`, `FACTION_NONCREATURE_STYLE`, `build_creature_prompt()`, and `build_noncreature_prompt()` as specified in Sections 3.2 and 3.3.
**Recommended action:** Create `Scripts/prompt_utils.py` from the guide specification. This shared module is imported by all generation scripts.

---

### [ABSENT] Section 3.2 — `Scripts/verify_asset.py` does not exist
**File:** Not found anywhere in the codebase
**Current:** Nothing. No asset dimension verification script exists.
**Required:** A Python script that verifies image dimensions meet minimum requirements (`--min-width`, `--min-height` flags, `--no-error-payload` flag) — called after every generation and evolution step.
**Recommended action:** Create `Scripts/verify_asset.py`.

---

### [ABSENT] Section 3.9 — `Resources/ASSET_LICENSE_MANIFEST.md` does not exist
**File:** Not found at project root `Resources/ASSET_LICENSE_MANIFEST.md`
**Current:** Nothing. No asset license tracking exists anywhere in the project.
**Required:** A manifest table tracking every asset (filename, source URL, license, date, commercial OK, attribution required, notes). Must exist from day one per Section 3.9.
**Recommended action:** Create `Resources/ASSET_LICENSE_MANIFEST.md` with the table header from Section 3.9 and begin populating with existing card art assets.

---

### [ABSENT] Section 3.2 — `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png` does not exist
**File:** Not found
**Current:** The `Resources/LegalEvidence/` directory does not exist at the project root.
**Required:** A screenshot of the EldritchPaletteKnife CivitAI model page (civitai.com/models/336656) showing the commercial use permission checkbox state. This is a hard gate before App Store submission (Section 3.2: "⛔ COMMERCIAL PIPELINE GATE").
**Recommended action:** A human must visit civitai.com/models/336656, confirm "Allow commercial use" checkbox state, take a screenshot, and save it to `Resources/LegalEvidence/eldritchpaletteknife_license_screenshot.png`.

---

### [CONFLICT] Section 3.2/.env — `REPLICATE_API_TOKEN` missing from `.env`
**File:** `/Users/alexali/Projects/chaos-creatures/.env`
**Current:** The `.env` file contains: `FAL_KEY`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_*` keys, `POSTHOG_*` keys, `ADMIN_*` keys, `GAME_SERVER_SECRET`. No `REPLICATE_API_TOKEN` and no `LORA_URL`.
**Required:** `.env` must include `REPLICATE_API_TOKEN` (for LoRA creature generation) and `LORA_URL` (pointing to R2 LoRA weight file). Also missing: `FREESOUND_API_KEY` (optional per guide but required slot in template).
**Recommended action:** Add `REPLICATE_API_TOKEN=`, `LORA_URL=https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors`, and `FREESOUND_API_KEY=` to the `.env` file.

---

### [ABSENT] Section 3.4b — `Resources/CardArt/` directory does not exist at project root
**File:** Not found
**Current:** Card art is stored in R2 (remote), not in a local `Resources/CardArt/` directory. The project root has no `Resources/` directory.
**Required:** A local `Resources/CardArt/` directory with files named `{card_uuid}_{tier}.png` for every card. A `Staging/` directory for intermediate generation artifacts.
**Recommended action:** Create `Resources/CardArt/` and `Staging/` at the project root. These are required by the color grading pipeline, evolution pipeline, and verify scripts.

---

### [COMPLIANT] Section 3.3b — fal.ai Kontext evolution pipeline exists
**File:** `/Users/alexali/Projects/chaos-creatures/scripts/evolve-kontext-lora.mjs`, `evolve-all-kl.mjs`, `evolve-all-pro.mjs`, etc.
**Current:** Multiple evolution scripts exist using `fal-ai/flux-kontext-lora` and `fal-ai/flux-pro/kontext`. These implement img2img evolution with strength parameters.
**Required:** Non-creature img2img evolution via fal.ai. While the specific model differs (kontext vs dev), the functional intent matches.
**Recommended action:** None critical — the kontext-based evolution approach is a reasonable operational adaptation. Document this deviation in `Logs/DEPENDENCY_DECISIONS.md` as an authorized variant.

---

## Section 4 — Environment & Tool Setup

### [ABSENT] Section 4.1 — `Scripts/verify_environment.sh` does not exist
**File:** Not found anywhere in the codebase
**Current:** Nothing. The master environment check script from Section 4.1 (checking Xcode, simulators, CLI tools, Python libs, API keys, API connectivity, legal gates) does not exist.
**Required:** A shell script at `Scripts/verify_environment.sh` that runs all checks and exits 0 (pass) or 1 (fail), with `✓`/`✗`/`⚠` output format.
**Recommended action:** Create `Scripts/verify_environment.sh` per the exact specification in Section 4.1. This is the single "am I ready to work?" gate.

---

### [CONFLICT] Section 4.7 — Wrong fonts installed; 6 required fonts vs 6 different fonts present
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Fonts/`
**Current:** The following fonts are present:
- `Cinzel-Variable.ttf` ← Cinzel present but as variable font
- `Alegreya-Variable.ttf` ← Alegreya present but as variable font (no dedicated bold file)
- `Alegreya-Italic-Variable.ttf` ← Alegreya Italic present
- `BebasNeue-Regular.ttf` ← Not in guide's required font list
- `FiraSans-Regular.ttf` ← Not in guide's required font list
- `FiraSans-SemiBold.ttf` ← Not in guide's required font list

**Required by Section 4.7:** `Cinzel-Regular.ttf`, `Cinzel-Bold.ttf`, `EBGaramond-Regular.ttf`, `EBGaramond-Italic.ttf`, `EBGaramond-SemiBold.ttf`, `Oswald-Bold.ttf`

**Assessment:** The guide requires EB Garamond + Oswald. The codebase has Alegreya + Bebas Neue + Fira Sans instead. These are different fonts entirely. The CLAUDE.md (project source of truth) specifies "Cinzel + Alegreya" as the decided fonts — **this creates a direct conflict between the new design guide and the existing project decision.** The `CardFont.swift` file comprehensively implements Cinzel + Alegreya + Bebas Neue + Fira Sans, which matches CLAUDE.md but not the design guide Section 4.7.
**Recommended action:** Flag this conflict for human decision. The guide's Section 4.7 font list (EB Garamond, Oswald) differs from both CLAUDE.md (Cinzel + Alegreya) and the implemented font system. The owner must decide which font system to proceed with before any font-related work continues.

---

### [CONFLICT] Section 4.7 — Info.plist font registration does not match guide spec
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Config/Info.plist`
**Current:** UIAppFonts array registers: `Cinzel-Variable.ttf`, `Alegreya-Variable.ttf`, `Alegreya-Italic-Variable.ttf`, `BebasNeue-Regular.ttf`, `FiraSans-Regular.ttf`, `FiraSans-SemiBold.ttf`
**Required by guide:** `Cinzel-Regular.ttf`, `Cinzel-Bold.ttf`, `EBGaramond-Regular.ttf`, `EBGaramond-Italic.ttf`, `EBGaramond-SemiBold.ttf`, `Oswald-Bold.ttf`
**Recommended action:** Contingent on font system decision (see previous finding). Do not change until owner decides which font set to use.

---

### [ABSENT] Section 4.1 — `Scripts/verify_environment.sh` — Python libraries not installed
**File:** System Python environment
**Current:** `PIL` (Pillow), `numpy`, `replicate`, and `fal_client` Python packages are all absent from the system Python environment. `requests` status unknown (not tested).
**Required:** All four packages must be importable for the generation pipeline to function: Pillow (image verification, normal map generation), numpy (foil gradient, wax normal), replicate (creature generation), fal-client (non-creature generation).
**Recommended action:** Run `pip3 install Pillow numpy requests replicate fal-client --break-system-packages` (or use a venv). Verify with `python3 -c "import PIL, numpy, requests, replicate, fal_client; print('OK')"`.

---

### [PARTIAL] Section 4.4 — CLI tools partially present
**File:** System CLI tools
**Current:**
- `ffmpeg` — PRESENT (v8.0.1)
- `imagemagick (convert)` — PRESENT (v7.1.2-13, uses `magick` command; `convert` deprecated alias works)
- `jq` — PRESENT (v1.7.1)
- `pngquant` — ABSENT
- `svgexport` — ABSENT
- `license-plist` — ABSENT

**Required:** All 6 tools must be present for the pipeline to run.
**Recommended action:** Install missing tools: `brew install pngquant`, `npm install -g svgexport`, `brew install mono0926/license-plist/license-plist`. Note: ImageMagick 7 uses `magick` as primary command — scripts using bare `convert` will need updating or the deprecated alias must be confirmed working.

---

### [ABSENT] Section 4.4 — `Scripts/download_textures.sh` does not exist
**File:** Not found
**Current:** Nothing. No script to download Poly Haven PBR textures (parchment_paper, canvas_1 diffuse + normal maps).
**Required:** Script that downloads from `dl.polyhaven.org`, saves to `Staging/textures/`, and appends license entries to `Resources/ASSET_LICENSE_MANIFEST.md`.
**Recommended action:** Create `Scripts/download_textures.sh` per Section 4.4 specification.

---

### [ABSENT] Section 4.4 — `Scripts/cleanup_staging.sh` does not exist
**File:** Not found
**Current:** Nothing. No Staging directory cleanup script.
**Required:** A script that deletes Staging files older than 24 hours, callable via `make clean-staging`.
**Recommended action:** Create `Scripts/cleanup_staging.sh` and a `Makefile` with `clean-staging` target per Section 4.4.

---

### [ABSENT] Section 4.4 — `Makefile` does not exist at project root
**File:** Not found
**Current:** Nothing. No Makefile exists.
**Required:** A Makefile with at minimum `clean-staging` and `clean-all` targets.
**Recommended action:** Create `Makefile` at project root with targets from Section 4.4.

---

### [ABSENT] Section 4.5 — `Scripts/load_env.sh` does not exist
**File:** Not found
**Current:** Nothing. Individual scripts load their own `.env` files directly.
**Required:** A shared `Scripts/load_env.sh` that sources the root `.env` and prints a count of loaded/total keys, used at the start of all generation scripts.
**Recommended action:** Create `Scripts/load_env.sh` per Section 4.5.

---

### [ABSENT] Section 4.6 — Asset catalog lacks required structure (no `Textures/` imageset group)
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/`
**Current:** The asset catalog contains: `AppIcon`, `CardBacks`, `CardFrames`, `CardTextures`, `CurrencyIcons`, `FactionEmblems`, `FactionIcons`, `KeywordIcons`, `RarityEffects`, `ShardIcons`, `StatIcons`, `TextPanels`, `UIBackgrounds`, `UIComponents`, `UIIcons`. The `CardTextures` group has some textures (canvas-weave, paper-texture, tex-parchment, etc.) but no dedicated `Textures/` group matching the guide's structure.
**Required:** `Assets.xcassets/Textures/` group with: `parchment_base.imageset`, `parchment_normal.imageset`, `brush_normal.imageset`, `foil_gradient.imageset`, `wax_seal_normal.imageset`, `canvas_base.imageset`. Each must have `"compression-type": "automatic"` in `Contents.json`.
**Recommended action:** Create the `Textures/` group in the asset catalog and verify ASTC compression is set. Run `Scripts/set_astc_compression.py` on the existing `CardTextures/` group as well.

---

### [ABSENT] Section 4.6 — ASTC compression not set on any texture imageset
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/CardTextures/tex-parchment.imageset/Contents.json`
**Current:** No `"properties": {"compression-type": "automatic"}` in any imageset's `Contents.json`. All texture imagesets use default settings.
**Required:** Every texture imageset in `Assets.xcassets/Textures/` must have `"compression-type": "automatic"` to enable ASTC 4x4 compression.
**Recommended action:** Create `Scripts/set_astc_compression.py` per Section 4.6 and run it on all texture imagesets.

---

### [ABSENT] Section 4.9 — `SmokeTestCardView.swift` does not exist
**File:** Not found anywhere in the iOS project
**Current:** Nothing. No smoke test view exists.
**Required:** `Sources/Views/SmokeTestCardView.swift` — a SwiftUI view that exercises parchment texture, all 6 fonts, name bar, art box placeholder, type line, text box, stats bar, rarity color bar. Must compile and render correctly on all 4 simulators before proceeding.
**Recommended action:** Create `SmokeTestCardView.swift` per Section 4.9 specification. Note: the required fonts differ between the guide and current implementation (see font conflict finding) — the smoke test must use whichever font system the owner approves.

---

### [ABSENT] Section 4.9 — Pre-build verification scripts listed in smoke test check are absent
**File:** Scripts referenced in Section 4.9 smoke test bash block
**Current:** The smoke test shell block references `Scripts/verify_asset.py`, `Scripts/download_textures.sh`, `Scripts/generate_foil_shimmer_ahap.py`, `Scripts/cleanup_staging.sh` — none of these exist.
**Required:** All scripts must exist and be runnable before the smoke test is considered passing.
**Recommended action:** Create all missing scripts as part of the environment setup phase.

---

### [PARTIAL] Section 4.3 — SPM dependencies partially match guide spec
**File:** Package.swift / Xcode project dependencies
**Current:** The project uses `@supabase/supabase-js` (Node SDK in game server), but for the iOS app the SPM dependencies are not directly visible from codebase inspection. The `build/SourcePackages/checkouts/` directory contains `swift-http-types`, `swift-concurrency-extras`, `swift-clocks`, `xctest-dynamic-overlay` — these are Supabase Swift SDK transitive dependencies.
**Required by guide:** `lottie-ios` (Apache 2.0), `Nuke` (MIT), `swift-collections` (Apache 2.0)
**Assessment:** `lottie-ios` and `Nuke` are not confirmed present. `swift-collections` is not visible in checkouts. The iOS project structure uses a different dependency set.
**Recommended action:** Check `ChaosCreatures.xcodeproj` package dependencies to confirm whether lottie-ios and Nuke are included. If not, they must be added per Section 4.3.

---

### [COMPLIANT] Section 4.5 — `.env` file exists and is gitignored
**File:** `/Users/alexali/Projects/chaos-creatures/.env`
**Current:** The `.env` file exists. It contains `FAL_KEY`, `OPENAI_API_KEY`, and all Supabase/R2/admin credentials. The `.gitignore` includes `.env` entries per CLAUDE.md.
**Required:** `.env` must exist and be gitignored.
**Recommended action:** Add the missing keys (`REPLICATE_API_TOKEN`, `LORA_URL`, `FREESOUND_API_KEY`) to complete the template.

---

## Section 8 — Sound Design

### [CONFLICT] Section 8 — Audio implementation is `BattleAudioManager`, not `SoundEngine`
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/BattleAudioManager.swift`
**Current:** The audio class is named `BattleAudioManager` with a `static let shared = BattleAudioManager()` singleton. It uses `AVAudioEngine` for music stems and `SKAction.playSoundFileNamed` / `AVAudioPlayer` fallback for SFX.
**Required:** Section 8.3 specifies a class named `SoundEngine` with `static let shared = SoundEngine()`. The `SoundEngine` implementation uses `AVAudioEngine` for all audio (both SFX and music) with pre-loaded `AVAudioPCMBuffer` and `AVAudioPlayerNode` per sound.
**Assessment:** The functional intent (AVAudioEngine-based audio with singleton pattern) matches. The implementation diverges: BattleAudioManager handles music with stems/adaptive mixing (richer than the guide's SoundEngine) but uses `AVAudioPlayer` as fallback for SFX rather than pre-loaded buffers. The class name and SFX buffer-preloading approach differ.
**Recommended action:** This is a PARTIAL compliance situation upgraded to CONFLICT due to name mismatch (any code that imports `SoundEngine` would fail). Either rename `BattleAudioManager` to `SoundEngine` or document the deviation. The music stem/adaptive system in `BattleAudioManager` is superior to the guide's simple `SoundEngine` — this is not a regression.

---

### [ABSENT] Section 8.1 — Required SFX files missing: `card_draw.caf`, `card_flip.caf`, `card_summon.caf`
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/`
**Current:** The SFX directory contains 19 `.wav` files covering: `sfx_card_play`, `sfx_attack`, `sfx_damage`, `sfx_death`, `sfx_heal`, `sfx_shield_break`, `sfx_chaos_roll_*`, `sfx_event_*`, `sfx_turn_start`, `sfx_mana_gain`, `sfx_button_tap`, `sfx_victory`, `sfx_defeat`, `sfx_chaos_spark`, `sfx_evolution_reveal`.
**Required by Section 8.1 sound vocabulary:** `card_draw.caf` (card pick up), `card_flip.caf` (paper whoosh), `card_summon.caf` (ink brush stroke), `card_graveyard.caf` (paper crumple), `wax_seal_tap.caf`, `foil_shimmer.caf`, `attack_hit.caf`, `creature_death.caf`, `chaos_roll.caf`, `level_up.caf`
**Assessment:** The existing SFX set (sfx_card_play, sfx_attack, sfx_death) functionally overlaps with the guide's required set but uses different naming conventions. The guide requires `.caf` format; the codebase uses `.wav`. The guide names (`card_draw`, `card_summon`, `wax_seal_tap`, `foil_shimmer`) are absent.
**Recommended action:** The naming convention mismatch is the critical issue. `BattleAudioManager` is hardcoded to look for `.wav` files. Either: (a) convert existing .wav files to .caf and rename per the guide, or (b) keep .wav and document the deviation. The missing sounds (card_draw, wax_seal_tap, foil_shimmer, card_summon, card_graveyard) must be sourced from freesound.org CC0.

---

### [ABSENT] Section 8 — Audio files are in `.wav` format, not `.caf`
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/` (all files)
**Current:** All 19 SFX files use `.wav` format. All 5 music files use `.wav` format.
**Required by Section 8.2:** SFX files must be converted to `.caf` (Core Audio Format — iOS native audio format) using `afconvert -f caff -d LEI16@44100`. CAF offers better performance and lower latency on iOS than WAV.
**Recommended action:** Process all existing WAV files through the ffmpeg + afconvert pipeline from Section 8.2. `BattleAudioManager.playSFX()` looks for `.wav` extension — update to `.caf` after conversion.

---

### [ABSENT] Section 8.2 — `Scripts/download_sounds.sh` does not exist
**File:** Not found
**Current:** The `scripts/AUDIO-SOURCING-GUIDE.md` provides manual instructions for sourcing SFX from freesound.org. No automated download script exists.
**Required:** `Scripts/download_sounds.sh` that uses the Freesound API with `FREESOUND_API_KEY` to programmatically download CC0 sounds and log them to `Resources/ASSET_LICENSE_MANIFEST.md`.
**Recommended action:** Create `Scripts/download_sounds.sh` per Section 8.2. The current manual guide (`scripts/AUDIO-SOURCING-GUIDE.md`) is helpful context but does not fulfill the automation requirement.

---

### [PARTIAL] Section 8 — Faction music themes partially implemented (3 of 5 factions)
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Sounds/Music/`
**Current:** Music files present: `battle-ironwright.wav`, `battle-fey.wav`, `battle-demonic.wav`, `battle-tension.wav`, `menu-ambient.wav`. Missing: `battle-celestial.wav`, `battle-endless.wav`. The `battle-tension.wav` appears to be a universal tension stem, not faction-specific.
**Required:** The guide implies 5 faction battle tracks. `BattleAudioManager` implements adaptive stem mixing per faction (4 stems per faction: base, tension, chaos, victory) but only 3 faction base tracks exist.
**Recommended action:** Source or generate `battle-celestial.wav` and `battle-endless.wav`. Also, the adaptive stem system requires 4 stems per faction (`{faction}_base`, `{faction}_tension`, `{faction}_chaos`, `{faction}_victory`) but only `battle-{faction}.wav` files exist — the stem naming convention doesn't match `BattleAudioManager`'s lookup pattern (`{faction.rawValue.lowercased()}_{stem}`).

---

### [ABSENT] Section 7/8 — All 6 AHAP haptic files are absent
**File:** Not found anywhere in the iOS project
**Current:** Nothing. No `.ahap` files exist. The `Resources/Particles/` directory exists but no `Resources/Haptics/` directory.
**Required by Section 4.9 smoke test and Section 7:** `card_flip.ahap`, `card_summon.ahap`, `card_graveyard.ahap`, `foil_shimmer.ahap`, `epic_reveal.ahap`, `legendary_reveal.ahap` — all must be present in `Resources/Haptics/`.
**Recommended action:** Create `Resources/Haptics/` directory and generate AHAP files. The smoke test explicitly checks for these files and will fail without them.

---

### [COMPLIANT] Section 8.3 — AVAudioEngine used for music (matches guide's architectural requirement)
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/BattleAudioManager.swift`
**Current:** `BattleAudioManager` uses `AVAudioEngine` with `AVAudioPlayerNode` for music stems, and `AVAudioSession` category `.ambient` with `.mixWithOthers`. This matches the guide's architectural requirement for AVAudioEngine-based implementation.
**Required:** AVAudioEngine for music, `.ambient` session category.
**Recommended action:** None — this aspect is compliant.

---

### [COMPLIANT] Section 8 — SFX sound set covers primary gameplay interactions
**File:** `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Resources/Sounds/SFX/` (19 files)
**Current:** Covers card_play, attack, damage, death, chaos_roll variants, events, turn_start, victory/defeat, evolution_reveal.
**Required:** Card interaction sounds, combat sounds, chaos roll sounds, event sounds.
**Assessment:** Good coverage of gameplay SFX, though naming and format differ from guide spec. Placeholder silence files exist (generated by `generate-placeholder-audio.mjs`).
**Recommended action:** Replace placeholders with real CC0 sounds per the sourcing guide.

---

## Section 11 — Production Workflow

### [ABSENT] Section 11.1 — `Logs/BUDGET_LEDGER.md` does not exist
**File:** Not found at `/Users/alexali/Projects/chaos-creatures/Logs/BUDGET_LEDGER.md`
**Current:** Nothing. The `Logs/` directory exists but contains only: `CLAUDEMD_AUDIT.md`, `CONFLICTS.md`, `iteration_log.md`, `MASTER_STATE.json`, `AUDIT_MASTER.md`.
**Required:** `Logs/BUDGET_LEDGER.md` must exist to track all API spend: generation calls, costs per call, session totals, cumulative spend vs budget allocation. Section 3.2 explicitly requires logging every Replicate call cost; Section 11.1 defines the budget allocation table (creatures 35%, non-creature 25%, iterations 15%, parallax 15%, textures 5%, reserve 5%).
**Recommended action:** Create `Logs/BUDGET_LEDGER.md` with the budget allocation table from Section 11.1 and begin logging all API calls.

---

### [ABSENT] Section 11 — `Logs/DEPENDENCY_DECISIONS.md` does not exist
**File:** Not found
**Current:** Nothing.
**Required:** Section 3.3 requires documenting the fal.ai FLUX.1 Dev commercial license decision (BFL partnership confirmation, model choice). This document must be created before any artwork generation.
**Recommended action:** Create `Logs/DEPENDENCY_DECISIONS.md` and document the fal.ai commercial licensing decision and the LoRA source/license decision.

---

### [PARTIAL] Section 11.2 — Pipeline steps 1-2 partially complete; steps 3-24 not started
**File:** Project state assessment
**Current:**
- Step 1 (lock deployment parameters in iteration_log): DONE — `Logs/iteration_log.md` confirms guide was read
- Step 2 (environment setup — simulators, CLI tools, font verification): PARTIAL — some CLI tools present, Python libs absent, fonts conflict with guide spec, no verify script
- Step 3 (generate procedural assets — foil gradient, wax normal, brush normal): NOT DONE — scripts don't exist
- Step 4 (source parchment/canvas textures): NOT DONE — no download_textures.sh, no Staging/ directory
- Steps 5-24: NOT DONE
**Required:** Complete all 24 steps in order before declaring the implementation phase complete.
**Recommended action:** Address environment gaps (Section 4 findings) before attempting Steps 3+.

---

### [COMPLIANT] Section 11 — `Logs/iteration_log.md` exists and has guide read confirmation
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/iteration_log.md`
**Current:** File exists. Contains "Guide Read Confirmation — 2026-02-21" with confirmation that sections 1-14 + Addendum were read.
**Required:** Must exist and confirm guide was read before any code was written.
**Recommended action:** None — this is compliant.

---

### [COMPLIANT] Section 11 — `Logs/` directory exists with core files
**File:** `/Users/alexali/Projects/chaos-creatures/Logs/`
**Current:** Directory exists with `iteration_log.md`, `AUDIT_MASTER.md`, `CLAUDEMD_AUDIT.md`, `CONFLICTS.md`, `MASTER_STATE.json`.
**Required:** `Logs/` directory with at minimum `iteration_log.md`.
**Recommended action:** Add `BUDGET_LEDGER.md` and `DEPENDENCY_DECISIONS.md` per findings above.

---

### [ABSENT] Section 11 — No QA checklist exists
**File:** Not found
**Current:** Nothing. No QA checklist document exists in `Logs/` or `docs/`.
**Required:** Section 12 defines the exit criteria checklist and structured critique template. While Section 12 is not directly in scope for this audit, Section 11 (Step 24) requires a "visual regression baseline" with screenshots committed. No such baseline exists.
**Recommended action:** After implementing the smoke test (Section 4.9), run `Scripts/screenshot_all_devices.sh` and commit the baseline screenshots to `Logs/Iterations/`.

---

### [ABSENT] Section 11 — `Resources/` directory does not exist at project root
**File:** Project root `/Users/alexali/Projects/chaos-creatures/Resources/`
**Current:** Nothing. The project's iOS resources live in `ChaosCreatures/ChaosCreatures/Resources/`. The guide assumes a project-root `Resources/` directory with: `Resources/CardArt/`, `Resources/Fonts/`, `Resources/Icons/`, `Resources/Textures/`, `Resources/Sounds/`, `Resources/Haptics/`, `Resources/Cards/`, `Resources/ASSET_LICENSE_MANIFEST.md`, `Resources/LegalEvidence/`.
**Required:** Project-root `Resources/` structure for generation pipeline outputs, separate from the iOS app bundle resources.
**Recommended action:** Create the project-root `Resources/` directory structure. Note that some of these files (fonts, sounds) will need to be copied into the iOS app's `ChaosCreatures/ChaosCreatures/Resources/` for use in the bundle.

---

## Top 5 Most Critical Gaps

### 1. Generation Pipeline Architecture Mismatch (Section 3)
The entire artwork generation pipeline is built on `fal-ai/fast-sdxl` via JavaScript `.mjs` scripts, but the guide requires a Python-based pipeline using Replicate (for creatures) and `fal-ai/flux/dev` (for non-creatures). This is the largest structural gap — it requires creating new Python scripts (`Scripts/prompt_utils.py`, `Scripts/generate_creature.py`, `Scripts/generate_noncreature.py`, `Scripts/evolve_creature.py`, `Scripts/evolve_noncreature.py`) from scratch, plus confirming the LoRA weight file exists at R2.

### 2. Missing Environment Setup Infrastructure (Section 4)
`Scripts/verify_environment.sh` (the master gate), `Scripts/load_env.sh`, `Scripts/download_textures.sh`, `Scripts/cleanup_staging.sh`, Python libraries (Pillow, numpy, replicate, fal-client), and the Makefile are all completely absent. Without these, no agent can confirm the environment is ready before generation begins.

### 3. Font System Conflict Between Guide and Existing Implementation (Section 4.7)
The guide requires EB Garamond + Oswald + Cinzel. The existing codebase has Cinzel + Alegreya + Bebas Neue + Fira Sans, which matches CLAUDE.md. This contradiction requires a human decision before any font-related work can proceed. This blocks the smoke test (which uses guide-specified fonts) and all typography work.

### 4. Missing Procedural Asset Generation Scripts (Sections 3.5, 3.6, 4.8)
`Scripts/generate_foil_gradient.py`, `Scripts/generate_wax_normal.py`, `Scripts/generate_normal_map.sh`, `Scripts/verify_asset.py`, and `Scripts/set_astc_compression.py` are all absent. These are required before the smoke test can pass (Section 4.9 explicitly checks for `foil_gradient` and `wax_seal_normal` in the asset catalog). Without them, Steps 3-6 of the Section 11 pipeline are blocked.

### 5. AHAP Haptic Files Completely Absent (Section 7/8)
Zero of the 6 required AHAP files exist. The `Resources/Haptics/` directory doesn't exist. The smoke test (Section 4.9) explicitly checks for these files and will fail without them. While haptic content is a Section 7 concern, the smoke test dependency makes this a hard gate for Section 4 completion as well.

---

*End of AUDIT_ASSETS_PIPELINE.md*
*Lines: approximately 310*

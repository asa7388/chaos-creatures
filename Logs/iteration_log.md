# Iteration Log — Chaos Creatures Design Overhaul

## Guide Read Confirmation — 2026-02-21
Guide read in full: docs/CARD_DESIGN_GUIDE.md
Sections read: 1 through 14 + Addendum

Top 3 sections expected to require most significant changes:
1. Section 6 (Digital Effects & Animations) — Four Metal shaders (OilPaintShader, ParchmentShader, WarmFoilShader, InkSpreadKernel) plus SpriteKit particle systems must be written from scratch; the existing codebase uses Core Animation and SpriteKit but has no Metal shader pipeline at all, and the guide requires full MTKView bridge integration with CMMotionManager for foil tilt effects.
2. Section 1 (Aesthetic System & Design Language) — The existing CardFrameView uses wood borders, canvas weave, vellum text panel, and bronze medallion badges (as noted in CLAUDE.md), but the guide mandates a fully different layout system: precise proportional zones (8.5%/45%/6%/30%/5%/1.5% of card height), three new card type layout variants (Spell, Stabilizer, Planar Ruin), new font stack (Cinzel + EB Garamond + Oswald replacing the current Cinzel + Alegreya setup), and a 16-token P3 color palette that differs from the current implementation in several tokens.
3. Section 3 (Asset Strategy) — The guide introduces a dual-service artwork pipeline (custom LoRA via Replicate for creatures, FLUX.1 Dev via fal.ai for non-creatures) that supersedes the existing fal-ai/fast-sdxl + EldritchPaletteKnife approach documented in CLAUDE.md; all 35 existing Ironwright cards are already marked invalid post-retheme, so a full regeneration pipeline with faction-aware color grading and img2img evolution is required.

Deployment parameters confirmed:
- iOS minimum: iOS 16
- Devices: iPhone + iPad
- Chip baseline: A14+
- LoRA file location: https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev/training/chscrt-sdxl-lora.safetensors (R2 public URL, accessed via Replicate extra_lora param — see Section 3.2)
- Asset generation budget: $10.00
- LoRA status: chscrt-sdxl-lora.safetensors RETIRED (EldritchPaletteKnife license blocks Replicate use). New LoRA (v2) to be trained on public domain artworks + SDXL base.

---

## Phase 0 Complete — 2026-02-21
Tasks completed:
- Fonts downloaded: All 6 newly downloaded (none of the 6 target fonts were present; only Cinzel-Variable.ttf existed). Downloaded as variable-weight TTFs from Google Fonts GitHub raw URLs. EBGaramond-SemiBold and Cinzel-Bold are copies of the corresponding variable font file.
- Info.plist updated: yes — 6 entries added (Cinzel-Regular.ttf, Cinzel-Bold.ttf, EBGaramond-Regular.ttf, EBGaramond-Italic.ttf, EBGaramond-SemiBold.ttf, Oswald-Bold.ttf). Existing Alegreya/Bebas Neue/Fira Sans entries left in place per instructions.
- Xcode project updated: yes — manually edited ChaosCreatures.xcodeproj/project.pbxproj. Added entries to all 4 required sections: PBXBuildFile (EE prefix UUIDs), PBXFileReference (FF prefix UUIDs), Fonts PBXGroup children, and Copy Bundle Resources build phase. Method: Python string replacement (tabs in pbxproj require Python, not the Edit tool).
- CardFont.swift rewritten: yes — full rewrite preserving all SpriteKit/UIKit helpers. Added 6 new SwiftUI font accessors (cinzelRegular, cinzelBold, ebGaramondRegular, ebGaramondItalic, ebGaramondSemiBold, oswaldBold) and semantic aliases per Section 1.5. Legacy accessors (Alegreya, Bebas Neue, Fira Sans, displayTitle, header, stats) preserved for non-card UI screens.
- BUDGET_LEDGER.md created: yes — /Users/alexali/Projects/chaos-creatures/Logs/BUDGET_LEDGER.md
- ASSET_LICENSE_MANIFEST.md created: yes — /Users/alexali/Projects/chaos-creatures/Resources/ASSET_LICENSE_MANIFEST.md
- .env template updated: yes — added REPLICATE_API_TOKEN, LORA_URL, FREESOUND_API_KEY (FAL_KEY was already present). Added with placeholder values only.
- Python toolchain: Python 3.13.5 installed. Pillow, requests, and replicate packages are MISSING. requirements.txt created at /Users/alexali/Projects/chaos-creatures/Scripts/requirements.txt — run `pip install -r Scripts/requirements.txt` (in a virtualenv) before Phase 5 generation scripts.
- Build result: PASSED (BUILD SUCCEEDED after fixing 4 CardFont member references that were dropped in the rewrite: displayTitle, header, stats, spriteKitBody, spriteKitStats)

Issues encountered:
- Google Fonts static URLs (e.g. /static/Cinzel-Regular.ttf) return 404. Variable font TTFs used instead. Variable fonts may not register weight-specific PostScript names (e.g. "Cinzel-Bold") with iOS — UIFont(name: "Cinzel-Bold", size:) may return nil at runtime. CardFont uses UIFontDescriptor family+weight fallback path. Use debugVerifyRequiredFonts() at app launch to confirm. This is a deviation from the spec's assumption that static weight files would be available.
- EBGaramond-SemiBold.ttf does not exist as a separate file in Google Fonts GitHub — variable font EBGaramond[wght].ttf copied as EBGaramond-SemiBold.ttf. PostScript name "EBGaramond-SemiBold" may not be registered by iOS. Fallback to family+weight descriptor is in place.
- Build initially failed with 4 errors: CardFont.displayTitle, CardFont.header, CardFont.stats, CardFont.spriteKitBody referenced in OnboardingView.swift, View+Loading.swift, PostMatchView.swift, SpriteKitConstants.swift. These were legacy accessors from the old CardFont.swift that were not included in the first rewrite. Added back as legacy accessors in the "Non-Card UI" section.
- Edit tool cannot handle tab-indented pbxproj files — Python was used for all 2 pbxproj edits after the initial 2 edits via Edit tool succeeded for space-indented sections.

Phase 0 exit criteria:
- [x] All 6 fonts present in Resources/Fonts/
- [x] All 6 fonts registered in Info.plist
- [x] CardFont.swift uses new font names
- [x] Build passes (no compilation errors from font changes)

Next phase: Phase 1 — Color Palette & Data Schema

---

## Session Start — 2026-02-21 — Phase 0 begins
MASTER_STATE.json read: phase=pre-implementation, all decisions resolved, ready for Phase 0.
Guide section for today's task: Section 4 (Environment & Tool Setup).
Beginning Phase 0: Environment & Toolchain Setup — fonts, .env, budget ledger, asset license manifest, toolchain verification.

---

## Phase 1 Start — 2026-02-21
Phase 0 font deviation resolved: 3 incorrect variable-weight fonts replaced with static-weight builds from fontsource CDN. All 6 PostScript names verified correct. Build: SUCCEEDED.
Guide section for Phase 1: Section 1.2 (P3 color palette), Section 2 (Card Data Schema).
Beginning Phase 1: Color Palette & Data Schema — 16 P3 named color assets, CardDisplayState enum, CardTemplate struct, enum updates.

---

## Phase 1 Complete — 2026-02-21
Tasks completed:
- Color assets created: 16 new .colorset files in Assets.xcassets (all at root level of xcassets, not in a subfolder)
- CardPalette.swift: created with 16 color tokens matching guide Section 1.2 exactly
- CardDisplayState.swift: created with 8 states from guide Section 2.3 (default, focused, selected, tapped, previewed, summoning(progress:), foilActive(tiltX:tiltY:), damaged(severity:), inGraveyard)
- CardGuideEnums.swift: created — new file containing guide Section 2.1 spec: CardFaction, CardSubFaction, Rarity (with all Section 2.2 extensions), EvolutionDirection, FrameStyle, CardCondition, InkColor, CardShaderUniforms, Card struct
- CardTemplate.swift: NOT modified — additive approach taken; guide-spec Card struct placed in separate CardGuideEnums.swift to avoid breaking DB-mapped CardTemplate (see CONFLICTS.md P1-3)
- Enums updated: CardType already had all 4 required cases (creature/spell/stabilizer/planarRuin). Keyword already had all 9 cases. No changes needed to existing enums — all were already correct.
- Xcode project (pbxproj): 3 new files registered (PBXBuildFile, PBXFileReference, group children, Sources build phase)
- Build: PASSED

Conflicts encountered (logged to Logs/CONFLICTS.md — NOT self-resolved):
- P1-1: CardFaction (guide) vs FactionShortName (existing) — different type name and case names
- P1-2: Rarity (guide) vs EvolutionTier (existing) — same concept, different type name
- P1-3: Card struct (guide) vs CardTemplate struct (existing) — same concept, different field names

Phase 1 exit criteria:
- [x] All 16 color tokens in Assets.xcassets (parchment-light, parchment-mid, parchment-dark, ink-black, wax-red, wax-blue, wax-green, fey-teal, rot-moss, aged-gold, antique-silver, epic-amethyst, legendary-ember, canvas-warm, parchment-dark-mode, ink-dark-mode)
- [x] CardPalette.swift compiles and all 16 tokens reference valid asset names
- [x] CardDisplayState enum has all guide Section 2.3 states (8 states, 3 with associated values)
- [x] Card struct has all guide Section 2.1 fields (22 fields + 2 computed properties)
- [x] Build passes

Next phase: Phase 2 — Card Layout Rebuild (Decision Gate: CardFrameView zone-stack rewrite approved per DEPENDENCY_DECISIONS.md Decision 1)

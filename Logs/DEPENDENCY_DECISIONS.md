# Dependency Decisions
Date: 2026-02-21
Owner-approved before implementation begins.

---

## Decision 1 — Card Layout Architecture
**Resolution: Option A — Adopt the guide's zone-stack layout**

CardFrameView.swift will be fully rewritten to implement the zone-stack layout
specified in Section 1.4 of docs/CARD_DESIGN_GUIDE.md:
- Outer border: 3pt
- Name Bar: 25pt (8.5% of 294pt inner height)
- Art Box: 132pt (45%)
- Type Line: 18pt (6%)
- Text Box: 88pt (30%)
- Stats Bar: 15pt (5%)
- Rarity Color Bar: 4pt (1.5%)
- Reference dimensions: 210pt wide × 294pt tall inner content area

Downstream views affected: ATKBadgeView, HPBadgeView, CMBadgeView (all updated
to fit within the Stats Bar zone rather than overlaid on art).

Layout variants to implement:
- Creature (standard zone-stack)
- Spell (no Art Box — text fills the space)
- Stabilizer (portrait art box variant per Section 1.5)
- Planar Ruins (full-art bleed — art fills entire card face)

The existing full-art-bleed CardFrameView is retired as the primary renderer.
It may be preserved temporarily as a reference during the rewrite.

---

## Decision 2 — Typography Font Set
**Resolution: Option A — Adopt the guide's font set (EBGaramond + Oswald-Bold)**

Font families to implement per Section 1.5 of the design guide:
- Cinzel-Regular — card name bar, type line, collector number
- Cinzel-Bold — headers
- EBGaramond-Regular — ability text, flavor text, keyword rules text
- EBGaramond-Italic — flavor text (italic variant)
- EBGaramond-SemiBold — keyword ability names
- Oswald-Bold — ATK/HP stats, numbers, mana cost

Action items:
1. Download all 6 font files from Google Fonts (OFL license, commercial use permitted)
2. Add to ChaosCreatures/ Xcode project under Resources/Fonts/
3. Register all 6 weights in Info.plist UIAppFonts array
4. Rewrite CardFont.swift to expose the new font set
5. Replace all Alegreya, Bebas Neue, and Fira Sans references in card views

Alegreya, Bebas Neue, and Fira Sans are retired from card rendering.
They may remain in non-card UI until those screens are audited.

---

## Decision 3 — Generation Pipeline Architecture
**Resolution: Option 3A — Retrain the LoRA on commercial-safe training data**

### License gate finding
The EldritchPaletteKnife LoRA (civitai.com/models/336656) permits:
  ✅ Use without crediting creator
  ✅ Sell images they generate
  ✅ Run on Civitai
  ❌ Run on services that generate for money  ← BLOCKS REPLICATE
  ❌ Share merges using this model
  ❌ Sell this model or merges using this model

The existing chscrt-sdxl-lora.safetensors was trained on images generated
with EldritchPaletteKnife @ 0.9 — a derived work. It cannot be used on
Replicate (a paid service). It is retired.

### Resolution
Retrain a new LoRA on two categories of commercial-safe training data:

**Source 1 — Public domain artworks (preferred, highest style quality)**
Pre-1953 artists approved in CLAUDE.md (all copyright expired):
- Gustave Doré (Fey Courts, Celestial Crusade, The Endless)
- Arthur Rackham (Fey Courts)
- Edmund Dulac (Fey Courts)
- Hieronymus Bosch (Demonic Kingdoms)
- William Blake (Celestial Crusade)
- Francisco Goya (The Endless)
- Giovanni Battista Piranesi (Ironwright Collective)
- N.C. Wyeth (cross-faction secondary reference)
- John Martin (Ironwright secondary reference)
Sources: Wikimedia Commons (public domain), Project Gutenberg, Museum APIs
(MET, Rijksmuseum, Smithsonian) — all confirmed public domain, commercial use permitted.

**Source 2 — SDXL base text-to-image outputs (supplementary)**
Generated using SDXL base model only (Apache 2.0 license, no restrictions).
Faction-matched prompts to fill gaps where public domain coverage is thin.
These supplement, not replace, the public domain works.

### Training data constraints
- Minimum 80% public domain works in training set
- All images must match approved faction palettes and oil painting aesthetic
- No EldritchPaletteKnife images in training data (neither direct nor derivatives)
- Target training set: 150–300 curated images
- Training platform: Replicate Trainings API (separate from inference — training
  on Replicate for a custom model is permitted as we own the output weights)

### Pipeline after retraining
- Creatures: Replicate inference + new LoRA (chscrt-sdxl-lora-v2.safetensors)
- Non-creatures (spells, stabilizers, ruins): fal-ai/flux/dev
- Both track guide Section 3.2 and 3.3 respectively
- New LoRA uploaded to R2, referenced via LORA_URL in .env

### Existing assets
- chscrt-sdxl-lora.safetensors: ⛔ RETIRED — do not use for new generation
- 35 existing card images: the final generated images (not the LoRA itself)
  are covered by EldritchPaletteKnife's ✅ "Sell images they generate"
  permission. They were generated via fal.ai (not Replicate). They may be
  kept as style reference and placeholder art during development. They must
  be replaced with new LoRA-generated art before production/App Store launch.
  Status: PLACEHOLDER until replaced by new LoRA outputs.

### Phase 5 prerequisite
LoRA retraining runs in parallel with Phases 0–4. Phase 5 (Asset Generation
Pipeline) cannot begin creature generation until new LoRA is trained and
uploaded to R2. Non-creature art (fal-ai/flux/dev) can proceed without
waiting for the new LoRA.

---

## Commercial License Gate Status
- Screenshot reviewed: 2026-02-21
- Evidence file: Resources/LegalEvidence/eldritchpaletteknife_license_REVIEWED.md
- Result: FAILED for Replicate use. PASSED for final image commercial sale.
- Resolution: Decision 3A — new LoRA trained on public domain + SDXL base
- Gate status: ✅ RESOLVED — implementation may proceed under Decision 3A terms

---

## Decision: N ⊕ Unified Cost Display
Date: 2026-02-21
Status: OWNER APPROVED
Section: §1.4 Name Bar / Chaos Mote Symbols

Previous spec: Tiled dot pips (up to 7 ● symbols + "N+" overflow text for costs >7). Ruins used "COST: N" label format.
New spec: `N ⊕` — Oswald-Bold 13pt numeral + single 20×20pt chaos mote icon, right-aligned in name bar (6pt from inner right edge). All card types (creature, spell, planar ruin) use identical format. Stabilizers: no cost indicator.

Rationale: 7 dots at 16pt consumed ~124pt of name bar width, leaving insufficient room for card names. Single icon + numeral takes ~35pt regardless of cost value. Eliminates ruins "COST:" inconsistency. Cleaner, more readable at all card display sizes.

Implementation: Replace chaos mote dot tiling logic in CardFrameView with HStack{Text("\(cost)").font(Oswald-Bold-13) + Image("chaos_mote_symbol").frame(20×20)}

# Art Pipeline Direction Change — LoRA v2 + Material Background
## Saved 2026-02-23 — survives compaction

## Status: IN PROGRESS — editing CARD_DESIGN_GUIDE.md

## Decisions Made (user-approved)
1. §3.2 structure: keep as single section, v1 retired subsection + v2 subsection
2. Artist pairings in §3.1 faction table: UNCHANGED — material suffix is additive
3. Generation dimensions: 1024×1432 for creature art only; non-creature (§3.3 fal.ai) stays 1024×1024

## §3.1 Changes
- Add paragraph to service selection note: creature art includes faction material surface baked in
- Add FACTION_MATERIAL_SUFFIX dict (5 factions) after SUBFACTION_CREATURE_STYLE
- Update build_creature_prompt() to append material suffix
- Update all 5 example prompts to include material suffix
- Update negative prompt: add plain/gradient/solid/neutral/vignette/studio/dark void background
- Update creature generation dimensions: 1024×1024 → 1024×1432

### FACTION_MATERIAL_SUFFIX values:
- ironwright: "painted directly onto cold iron plate, paint thin in places where dark metal shows through the brushstrokes, scratches and corrosion visible under and through the paint layer, oil paint on metal surface not canvas"
- fey: "painted directly onto pale birch bark, paint follows the wood grain in thin areas, absorbed into the bark surface, grain texture visible through translucent paint, organic warm surface, oil paint on wood"
- demonic: "painted directly onto cured dark leather hide, paint absorbed unevenly into the hide surface, matte finish where paint soaked in, slightly raised where paint pooled, oil paint on leather"
- celestial: "painted directly onto fine vellum, paint sitting on the membrane surface, vellum slightly luminous and translucent at the thinner areas, warm cream ground showing through thin paint, illuminated manuscript quality, oil paint on vellum"
- endless: "painted directly onto ancient bone-dark parchment, paint thin and absorbed, the figure emerges from the dark stained surface rather than sitting on top of it, parchment cracked and repaired, oil paint on aged parchment"

## §3.2 Changes
- Rename to "Custom LoRA Pipeline"
- v1 subsection: mark RETIRED, reason = EldritchPaletteKnife license gate, keep existing R2 URL documented
- v2 subsection: full training pipeline
  - Training data: 80-120 public domain oil paintings
  - Composition distribution: creatures 25-30, landscapes 20-25, still life 15-20, battle 10-15, architecture 10-15, portraits MAX 10
  - Artists: Rembrandt, Frans Hals, Courbet, Corot, Constable, Turner, Goya, Géricault, Delacroix, Fuseli, Stubbs, Agasse, Landseer (all pre-1900)
  - APIs: Met Museum (primary), Rijksmuseum (secondary), Wikimedia (tertiary)
  - Caption format: "impasto oil painting, [subject], thick brushwork, paint ridges visible, dramatic chiaroscuro, [light], [palette], oil on canvas, [style ref], [composition type]"
  - Training: Replicate SDXL LoRA, lora_rank 32, 2000 steps, trigger "impasto oil painting"
  - R2 URL: chscrt-sdxl-lora-v2.safetensors
  - License: RESOLVED (public domain + CreativeML Open RAIL++)
  - HARD GATE: No creature art gen until v2 trained + smoke-tested

## §3.7 Change
- Note that material surface is baked into artwork — no separate compositing layer

## New Files (to create LATER, not now)
- Scripts/fetch_training_data.py
- Scripts/generate_captions.py
- Training/TRAINING_MANIFEST.md
- Resources/LegalEvidence/lora_v2_license_confirmation.md

## MASTER_STATE.json Updates
- Add LoRA v2 pipeline status
- Add material background approach status
- Add hard gate for creature art generation

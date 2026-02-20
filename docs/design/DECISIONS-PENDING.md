# Pending Decisions for Owner Review

**Created:** 2026-02-19 ~07:00
**Context:** Faction expansion Phases 0-4 + Phase 7 audit are complete. Phases 5-6 require spending money.

---

## What's Done (Phases 0-4, 7)

All code, docs, and database changes for the 5-faction expansion are committed and verified:

| Phase | Commit | Summary |
|---|---|---|
| 0 | (CLAUDE.md) | Foundation update |
| 1 | bbf9e25..3294f91 | Creative foundation: lore bible, mechanics, ruins, UI/UX, art direction |
| 2 | 08fea68 | Core design docs (00, 01, 02) |
| 3 | be673d9 | Downstream docs (03-10), art bible, prompts |
| 4A | 2393e21 | DB migration, TypeScript/Swift enums |
| 4B+4C | a14adc0 | Game server mechanics + iOS/admin frontend |
| 4D | 4702fa1 | Generation scripts for 5 factions |
| 7 | fc601c8 | Audit: fixed 77 steampunk refs, 3 faction alignment issues |

**Game server compiles clean. 88 audit checks: 81 pass, 0 remaining failures.**

---

## Phase 5: Art + Assets (~$62-99)

This is where real money gets spent. Broken into 4 tiers by priority.

### Tier 1: Card Art Foundation (~$12) -- REQUIRED FOR LAUNCH

| Item | Count | Cost | Notes |
|---|---|---|---|
| Card frames (5 rarity levels) | 5 | $0.20 | Must exist before card rendering |
| Faction emblems (5) | 5 | $1.00 | Used in card UI |
| Keyword icons (9) | 9 | $1.50 | Shield, Lifesteal, etc. |
| Stat/UI icons | 10 | $1.00 | HP, ATK, CM, etc. |
| Creature cards -- Ironwright | 14 | $1.68 | ~3 gens per keeper @ $0.04 |
| Creature cards -- Fey Courts | 14 | $1.68 | |
| Creature cards -- Demonic | 14 | $1.68 | |
| Creature cards -- Celestial | 13 | $1.56 | |
| Creature cards -- Endless | 13 | $1.56 | |
| **Tier 1 Total** | **97** | **~$12** | |

### Tier 2: Ruins + Audio (~$32-56) -- HIGH PRIORITY

| Item | Count | Cost | Notes |
|---|---|---|---|
| Neutral Planar Ruin art | 8 | $1.60 | 8 archetypes |
| Ruin card frames | 6 | $1.20 | Neutral + 5 faction |
| Evolved Planar Ruin art | 40 | $6.40 | img2img from neutral base |
| Avatar portraits | 10 | $1.50 | 10 avatars per lore bible |
| Card backs | 6 | $1.00 | Universal + 5 faction |
| Battlefield backgrounds | 6 | $1.00 | 5 faction + neutral |
| Battle SFX pack (itch.io) | ~16 | $5-15 | olexmazur + TomMusic |
| Battle music pack (itch.io) | 10+ | $15-28 | BLACKMID recommended |
| **Tier 2 Total** | **92+** | **~$32-56** | |

### Tier 3: Polish (~$8-26) -- NICE TO HAVE

App backgrounds, sub-faction emblems, UI sounds, particle textures, etc.

### Tier 4: Launch Prep (~$3.50) -- POST-POLISH

App icon, achievement badges, App Store screenshots, marketing graphics.

### Decision: Audio Purchases

The art direction doc recommends specific itch.io packs. Do you want me to:

- **Option A**: List the specific URLs for you to purchase manually, then I integrate them
- **Option B**: Skip purchased audio for now, use Suno.ai free tier + freesound.org CC0 for everything
- **Option C**: Something else

### Decision: Art Generation Approach

- **Option A**: Generate all Tier 1 + Tier 2 art (~$44-68). This gets us launch-ready card art for all 5 factions + ruins.
- **Option B**: Generate Tier 1 only (~$12). Get creature cards for all factions, defer ruins and audio.
- **Option C**: Generate just 1-2 factions first as a quality check (~$4-6), then proceed if the style looks good.

**Recommendation**: Option C first (generate Ironwright + Celestial as test, since Ironwright is rethemed and Celestial is brand new), then Option A if quality is acceptable.

---

## Phase 6: LoRA Training (~$3.25)

Requires completed art from Phase 5. Steps:

1. Curate ~25-30 best card images across all factions
2. Train FLUX Style LoRA (~$2.00)
3. Generate evolution pairs using the style LoRA
4. Curate 15-20 evolution pairs
5. Train Kontext Evolution LoRA (~$1.25)
6. Validate output (~$0.13)

**Decision**: Proceed after Phase 5 art is approved? (Y/N -- this is straightforward once art exists)

---

## Budget Summary

| Category | Estimated Cost |
|---|---|
| Already spent (infrastructure) | ~$185-209 |
| Phase 5 Tier 1 (card art) | ~$12 |
| Phase 5 Tier 2 (ruins + audio) | ~$32-56 |
| Phase 5 Tier 3 (polish) | ~$8-26 |
| Phase 5 Tier 4 (launch prep) | ~$3.50 |
| Phase 6 (LoRA training) | ~$3.25 |
| **Total if all tiers** | **~$244-310** |
| **Budget** | **$300** |

Going through all 4 tiers puts us right at the budget limit. Tiers 1+2+6 alone (~$47-71) are comfortably within budget.

---

## What I Can Do Without Approval

While waiting for your decisions on art/audio spending:

1. Nothing code-related remains -- all expansion code is committed and verified
2. I could push the 5 local commits to `chaos/main` if you want
3. I could run the iOS build in Simulator to verify compilation

Let me know your decisions and I'll execute Phase 5 immediately.

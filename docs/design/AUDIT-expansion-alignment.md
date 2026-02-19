# Expansion Alignment Audit

**Date:** 2026-02-19
**Scope:** Verify all code matches design docs after faction expansion (3 to 5 factions, Ironwright retheme, Planar Ruins, 2 new keywords, 2 new mechanics).

---

## 1. Faction Consistency (5 factions everywhere)

**Expected:** IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS

| File | Values Found | Status |
|---|---|---|
| `supabase/migrations/00018_faction_expansion.sql:36` | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | PASS |
| `supabase/seed.sql:17-82` | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | PASS |
| `packages/game-server/src/types/enums.ts:37` | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | PASS |
| `packages/shared/src/types.ts:6` | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | PASS |
| `supabase/functions/_shared/types.ts:25` | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | PASS |
| `ChaosCreatures/ChaosCreatures/Models/Enums.swift:576-615` | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | PASS |
| `packages/admin-dashboard/components/CardGrid.tsx:43-57` | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | PASS |
| `packages/game-server/src/bot/ai.ts:33-62` | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | PASS |
| `packages/game-server/src/services/fallback-art.ts:18-34` | IRONWRIGHT, FEY_COURTS, **DEMONIC** (missing _KINGDOMS suffix), **missing CELESTIAL_CRUSADE, missing THE_ENDLESS** | **FAIL** |
| `ChaosCreatures/ChaosCreatures/Extensions/Color+Theme.swift:11-25` | ironwright, feyCourts, demonic -- **missing celestialCrusade and theEndless static color constants** (handled inline in factionPrimary/swiftUIColor switch cases with hardcoded hex values, but no named static properties) | **WARNING** |

### Faction Consistency Failures

**FAIL: `packages/game-server/src/services/fallback-art.ts:18-34`**
- Uses key `DEMONIC` instead of `DEMONIC_KINGDOMS`
- Missing `CELESTIAL_CRUSADE` entry entirely
- Missing `THE_ENDLESS` entry entirely
- Fallback art generation will fail or produce wrong results for Celestial, Endless, and potentially Demonic cards

**WARNING: `ChaosCreatures/ChaosCreatures/Extensions/Color+Theme.swift:11-25`**
- Static color constants only defined for 3 factions (ironwright, feyCourts, demonic)
- Celestial and Endless colors are handled via inline hex values in `factionPrimary()` and `swiftUIColor` switch cases (lines 100-107, 180-188), so they functionally work
- However, there are no `static let celestialCrusade` or `static let theEndless` properties, making them inconsistent with the other 3 factions
- Comment on line 12 still says "steampunk brass/industrial" (stale retheme reference)
- Ironwright colors (`#C9A84C`, `#8B6914`, `#D4AF37`) do NOT match the rethemed palette from seed.sql (`#6B7B8D` primary, `#E07020` secondary) -- they still reflect the old steampunk brass tones

---

## 2. Keyword Consistency (9 keywords everywhere)

**Expected:** SHIELD, LIFESTEAL, FLYING, REACH, DEATHTOUCH, TAUNT, PIERCING, HASTE, WARD

| File | Values Found | Status |
|---|---|---|
| `supabase/migrations/00018_faction_expansion.sql:19-20` | Adds HASTE, WARD (to existing 7) | PASS |
| `packages/game-server/src/types/enums.ts:8` | All 9 keywords | PASS |
| `packages/shared/src/types.ts:12` | All 9 keywords | PASS |
| `supabase/functions/_shared/types.ts:8-17` | All 9 keywords | PASS |
| `ChaosCreatures/ChaosCreatures/Models/Enums.swift:29-83` | All 9 keywords with displayName, description, iconName | PASS |
| `docs/design/02-card-data-model.md:63` | All 9 keywords | PASS |
| `docs/design/01-battle-mechanics.md:672-690` | Haste and Ward rules defined, 9x9 keyword matrix present | PASS |

---

## 3. Card Type Consistency

**Expected:** CREATURE, SPELL, STABILIZER, PLANAR_RUIN

| File | Values Found | Status |
|---|---|---|
| `supabase/migrations/00018_faction_expansion.sql:16` | Adds PLANAR_RUIN (to existing 3) | PASS |
| `supabase/migrations/00018_faction_expansion.sql:48` | CHECK constraint: CREATURE, SPELL, STABILIZER, PLANAR_RUIN | PASS |
| `packages/game-server/src/types/enums.ts:5` | CREATURE, SPELL, STABILIZER, PLANAR_RUIN | PASS |
| `packages/shared/src/types.ts:9` | CREATURE, SPELL, STABILIZER, PLANAR_RUIN | PASS |
| `supabase/functions/_shared/types.ts:6` | CREATURE, SPELL, STABILIZER, PLANAR_RUIN | PASS |
| `ChaosCreatures/ChaosCreatures/Models/Enums.swift:9-25` | CREATURE, SPELL, STABILIZER, PLANAR_RUIN | PASS |
| `docs/design/02-card-data-model.md:62` | CREATURE, SPELL, STABILIZER, PLANAR_RUIN | PASS |

---

## 4. Mechanic Consistency

**Expected:** AUGMENT, BOND, CORRUPTION, EXALT, PERSIST

| File | Values Found | Status |
|---|---|---|
| `supabase/migrations/00018_faction_expansion.sql:23-24` | Adds EXALT, PERSIST (to existing 3) | PASS |
| `supabase/migrations/00018_faction_expansion.sql:42` | CHECK constraint: AUGMENT, BOND, CORRUPTION, EXALT, PERSIST | PASS |
| `packages/game-server/src/types/enums.ts:40` | AUGMENT, BOND, CORRUPTION, EXALT, PERSIST | PASS |
| `ChaosCreatures/ChaosCreatures/Models/Enums.swift:201-207` | AUGMENT, BOND, CORRUPTION, EXALT, PERSIST | PASS |
| `ChaosCreatures/ChaosCreatures/Models/Enums.swift:605-613` | FactionShortName.mechanic maps all 5 correctly | PASS |
| `docs/design/02-card-data-model.md:276` | AUGMENT, BOND, CORRUPTION, EXALT, PERSIST | PASS |
| `packages/shared/src/types.ts` | **FactionMechanic type not defined** | **WARNING** |

### Mechanic Consistency Warnings

**WARNING: `packages/shared/src/types.ts`**
- Defines FactionId, CardType, Keyword, EvolutionTier, but does NOT define FactionMechanic type
- Not critical since game-server has its own `enums.ts` with FactionMechanic, but inconsistent with the "shared types" purpose

---

## 5. Avatar Count

**Expected:** 10 avatars (2 per faction: 6 original updated + 4 new)

| File | Count | Status |
|---|---|---|
| `supabase/seed.sql:88-184` | 10 avatars (2 Ironwright, 2 Fey, 2 Demonic, 2 Celestial, 2 Endless) | PASS |
| `supabase/migrations/00018_faction_expansion.sql:195-234` | 4 new avatars (2 Celestial, 2 Endless) | PASS |
| `supabase/migrations/00018_faction_expansion.sql:241-247` | 2 Ironwright avatars updated (lore retheme) | PASS |

Avatar instability modifiers:
- Ironwright: Aldric -5, Vex -2
- Fey Courts: Sylara -5, Morrigan -1
- Demonic Kingdoms: Kael -4, Lilith -2
- Celestial Crusade: Serevain -6, Ophaniel -1
- The Endless: Vothrak -3, Thessaly -2

All avatars have `FREE_STARTER` unlock condition. **PASS.**

---

## 6. Ironwright Retheme Verification

**Rule:** No steampunk references should exist in active code. Exceptions: comments explicitly saying "NOT steampunk" or migration comments documenting the change.

### FAIL -- Active Code with Stale Steampunk References

| File | Line | Issue |
|---|---|---|
| `ChaosCreatures/ChaosCreatures/Extensions/Color+Theme.swift` | 12 | Comment: `"steampunk brass/industrial"` -- stale, should say "brutalist space-industrial" |
| `ChaosCreatures/ChaosCreatures/Extensions/Color+Theme.swift` | 13-15 | Ironwright colors `#C9A84C`, `#8B6914`, `#D4AF37` -- old brass palette, should be `#6B7B8D`, `#E07020` per retheme |
| `packages/game-server/src/services/fallback-art.ts` | 20-22 | Ironwright fallback colors `#B87333` (Copper), `#D4A957` (Brass/Gold) -- old palette, should be `#6B7B8D`, `#E07020` |
| `supabase/functions/_shared/prompts.ts` | 121-123, 129 | Ironwright environments still use steampunk terms: "steam-powered foundry", "clockwork bridge", "brass and copper workshop", "brass conduits" |
| `supabase/functions/_shared/prompts.ts` | 378-379 | Ironwright features: "clockwork mechanisms", "tall brass antennae" |
| `packages/game-server/tests/ai-pipeline/prompts.test.ts` | 24-27, 60, 142-161, 172, 194, 253 | Test file still uses old steampunk faction prefix and asserts steampunk keywords |
| `store-assets/screenshot-guide.md` | 22 | References "brass/steampunk aesthetic" |
| `store-assets/app-store-description.md` | 24 | Ironwright described as "Brass gears and steam-powered constructs" |
| `.claude/agents/audio-designer.md` | 14 | References "Ironwright (steampunk)" |
| `.claude/agents/audio-designer.md` | 28 | References "brass instruments, mechanical rhythms, steam hisses, anvil strikes, clockwork" |
| `scripts/AUDIO-SOURCING-GUIDE.md` | 95 | "Industrial/steampunk orchestral, heavy brass, clanking gears" |
| `docs/design/09-monetization-details.md` | 1115 | "Clockwork Foundry (rotating gears, steam vents)" |

### WARNING -- Stale Pre-Retheme Scripts (Not Active Code)

These are local generation scripts that pre-date the retheme. They use old steampunk prompts but are test/preview/generation scripts, not production game code:

| File | Issue |
|---|---|
| `scripts/generate-test-cards.mjs` | Old Ironwright environments with steampunk references (steam-powered foundry, clockwork, brass, etc.) |
| `scripts/evolve-test-cards.mjs` | Old environments, old faction_style |
| `scripts/validate-evolution-quality.mjs` | Old environments |
| `scripts/validate-art-quality.mjs` | Old faction style "steampunk" |
| `scripts/evolve-preview.mjs` | Brass armor evolution prompt |
| `scripts/evolve-pro-texture.mjs` | Brass armor evolution prompt |
| `scripts/evolve-all-pro.mjs` | Brass armor evolution prompt |
| `scripts/evolve-two-pass-pro.mjs` | Brass armor evolution prompt |
| `scripts/evolve-all-kl.mjs` | Brass armor evolution prompt |
| `scripts/evolve-oil-chain.mjs` | Brass armor evolution prompt |
| `scripts/lora-compare.mjs` | Old Ironwright creature descriptions with clockwork, brass, airship, steampunk |
| `scripts/preview/cards.json` | Card names: "Clockwork Surgeon", "Cogwheel Prophet" |
| `scripts/preview/pool/pool-manifest-ironwright.json` | Old environments and names |
| `scripts/preview/BASE-iron-r1-manifest.json` | Old Ironwright manifest data |
| `scripts/preview/BASE-iron-r1-evo-manifest.json` | "Brasswork Artisan" archetype |
| `scripts/preview/BASE-iron-r1-evo-kl-manifest.json` | "Brasswork Artisan" archetype |
| `scripts/preview/BASE-iron-r1-evo-pro-manifest.json` | "Brasswork Artisan" archetype |

### Acceptable References (Comments/Docs Noting "NOT Steampunk")

| File | Line | Context |
|---|---|---|
| `CLAUDE.md` | 240 | "NOT steampunk" (explicit negation) |
| `supabase/migrations/00018_faction_expansion.sql` | 6, 92, 238 | Comments documenting the transition |
| `scripts/factions/ironwright.mjs` | 2, 15, 104 | Comments explicitly saying "NOT steampunk" |
| `docs/design/03-prompt-templates.md` | 904, 934, 1028, 1226, 1564 | All contain "NOT steampunk" negation |
| `docs/design/08-audio-design.md` | 51 | "NOT steampunk" |
| `docs/design/12-art-direction.md` | 337 | "NOT steampunk" |
| `docs/design/faction-art-bible.md` | 29 | "NOT steampunk" |
| `docs/design/11-lore-bible.md` | 470 | "NOT steampunk" |
| `docs/design/05-content-pipeline.md` | 364 | "NOT steampunk" |
| `docs/design/01-battle-mechanics.md` | 777 | "NOT brass, gears, steam, clockwork, or Victorian" |
| `docs/design/PLAN-faction-expansion.md` | 86 | "NOT brass, gears, steam, clockwork, Victorian" |

---

## 7. Game Server Mechanics

### 7a. Constants (`packages/game-server/src/engine/constants.ts`)

| Constant | Expected | Found | Status |
|---|---|---|---|
| MAX_RUINS_ON_FIELD | 1 | 1 (line 82) | PASS |
| MAX_RUINS_IN_DECK | 2 | 2 (line 83) | PASS |
| WARD_DURATION_TURNS | 1 | 1 (line 86) | PASS |
| RUIN_FAMILIARITY_WIN | 2 | 2 (line 89) | PASS |
| RUIN_FAMILIARITY_LOSS | 1 | 1 (line 90) | PASS |
| RUIN_FAMILIARITY_THRESHOLD | 10 | 10 (line 91) | PASS |
| MAX_LINGERING_EFFECTS | 3 | 3 (line 94) | PASS |

### 7b. Effects (`packages/game-server/src/engine/effects.ts`)

| Function | Expected | Status |
|---|---|---|
| `isBattleRuin()` | Type guard for PLANAR_RUIN entities | PASS (line 41) |
| `isBattleCreature()` | Type guard excluding ruins | PASS (line 46) |
| `recheckExaltAuras()` | Exalt aura recalculation on board changes | PASS (line 682) |
| `processPersistOnDeath()` | Persist death triggers + lingering effects | PASS (line 765) |
| `addLingeringEffect()` | Add lingering effect with MAX_LINGERING_EFFECTS cap | PASS (line 794) |
| `processLingeringEffects()` | Fire lingering effects at start of turn | PASS (line 807) |
| `applyRuinPassiveEffects()` | Apply ruin passive effects at start of turn | PASS (line 831) |
| `applyDamageToRuin()` | Damage to ruin with destruction handling | PASS (line 849) |
| `expireWard()` | Ward expiration at start of turn | PASS (line 872) |
| `clearSummoningSickness()` | Clear summoning sickness at start of turn | PASS (line 887) |

### 7c. Combat (`packages/game-server/src/engine/combat.ts`)

| Feature | Expected | Status |
|---|---|---|
| Ruin attack targeting | `ruin_attack_targets` map, `findRuinOnBoard()` | PASS (lines 51-58, 379-413) |
| Deathtouch vs ruins | Instant destroy on any damage | PASS (lines 387-389) |
| Piercing vs ruins | NOT applied to ruins | PASS (line 404 comment) |
| Lifesteal from ruin attacks | Heals attacker | PASS (lines 396-402) |
| Haste in attackable check | Summoning sick creatures with Haste can attack | PASS (line 81) |
| Ruins cannot attack | Validated in `validateDeclareAttackers` | PASS (lines 112-114) |
| Ruins cannot block | Validated in `validateBlockerAssignments` | PASS (lines 169-171) |
| Exalt recheck after combat deaths | `recheckExaltAuras` called for both players | PASS (lines 462-463) |
| `ruin_attack_targets` cleanup | Cleared in `resolveCombat` | PASS (line 482) |

### 7d. Turn (`packages/game-server/src/engine/turn.ts`)

| Feature | Expected | Status |
|---|---|---|
| PLANAR_RUIN in `handlePlayCard` | Separate branch for ruin placement | PASS (lines 289-309) |
| `createBattleRuin()` | Converts BattleCard to BattleRuin | PASS (lines 625-648) |
| `createBattleCreature()` Ward handling | Sets `ward_active` if creature has Ward keyword | PASS (lines 591, 617) |
| `createBattleCreature()` Haste handling | Sets `summoning_sick = true` (Haste checked at attack time) | PASS (line 615) |
| MAX_RUINS_ON_FIELD enforced | `ruin_on_board` check before placement | PASS (lines 291-293) |
| `expireWard()` at start of turn | Called in `resolveStartOfTurn` | PASS (line 83) |
| `clearSummoningSickness()` at start of turn | Called in `resolveStartOfTurn` | PASS (line 86) |
| `applyRuinPassiveEffects()` at start of turn | Called in `resolveStartOfTurn` | PASS (line 89) |
| `processLingeringEffects()` at start of turn | Called in `resolveStartOfTurn` | PASS (line 92) |
| `recheckExaltAuras()` after start-of-turn deaths | Called after `processDeaths` | PASS (line 123) |
| `recheckExaltAuras()` after creature play | Called in `handlePlayCard` creature branch | PASS (line 286) |
| `ruinTargets` in `handleDeclareAttackersAction` | Parameter and storage in state | PASS (lines 375, 396) |
| `ruin_attack_targets` cleanup in `resolveEndOfTurn` | Cleared | PASS (line 461) |

### 7e. Bot AI (`packages/game-server/src/bot/ai.ts`)

| Feature | Expected | Status |
|---|---|---|
| 5-faction bot support | `ALL_FACTION_IDS` array with all 5 | PASS (line 62) |
| `BOT_FACTION_AVATARS` | Config for all 5 factions with correct avatar/faction IDs | PASS (lines 33-59) |
| PLANAR_RUIN in bot deck builder | Queries and includes PLANAR_RUIN cards | PASS (lines 122-123, 140, 143-144) |
| Bot ruin placement logic | Ruins first in play priority, ruin_on_board check | PASS (lines 312-314, 325-326, 356-358) |
| Haste awareness in bot decisions | Haste creatures prioritized when bot HP low | PASS (lines 329-333) |
| Ward awareness in bot decisions | Ward creatures prioritized when opponent has many creatures | PASS (lines 336-340) |
| Ruins excluded from attackers | card_type check in `decideBotAttackers` | PASS (line 398) |
| Ruin targeting by bot | Bot assigns weakest attacker to target opponent ruins | PASS (lines 406-431) |
| Ruins excluded from blockers | card_type check in `decideBotBlockers` | PASS (line 462) |

---

## 8. Doc Consistency

### 8a. `docs/design/00-game-design-master.md`

| Check | Expected | Found | Status |
|---|---|---|---|
| Faction count | 5 | "Five launch factions" (line 10), 5 factions listed in Section 2 (lines 49-77) | PASS |
| Faction names | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | All 5 present with full descriptions | PASS |
| Ironwright description | Brutalist space-industrial | "Brutalist Space-Industrial" (line 51), concrete/iron/hydraulics terminology | PASS |
| Keywords | 9 | Mentioned in keyword list via 02-card-data-model.md reference | PASS |

### 8b. `docs/design/01-battle-mechanics.md`

| Check | Expected | Found | Status |
|---|---|---|---|
| Keywords | 9 | Haste (line 672) and Ward (line 675) rules defined. 9x9 keyword matrix at line 698. Status note: "9 keywords (added Haste, Ward)" at line 1755. | PASS |
| Exalt rules | Present | Referenced in turn structure (line 361, 363) | PASS |
| Persist rules | Present | Referenced in turn structure (line 363) | PASS |
| Planar Ruins rules | Present | Ruin placement (line 434), ruin targeting (line 452), ruin end-of-turn (line 570) | PASS |
| Haste bonus attack | Present | "When a creature with Haste is played, the controlling player may immediately declare it as attacking" (line 435) | PASS |

### 8c. `docs/design/02-card-data-model.md`

| Check | Expected | Found | Status |
|---|---|---|---|
| CardType enum | CREATURE, SPELL, STABILIZER, PLANAR_RUIN | Matches at line 62 | PASS |
| Keyword enum | 9 keywords | All 9 at line 63 | PASS |
| FactionMechanic enum | AUGMENT, BOND, CORRUPTION, EXALT, PERSIST | Matches at lines 276, 577 | PASS |
| FactionShortName enum | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS, CELESTIAL_CRUSADE, THE_ENDLESS | **Uses `CELESTIAL` and `ENDLESS` instead** (lines 545, 578) | **FAIL** |
| Faction table | 5 factions | All 5 listed at lines 588-589 with correct mechanics | PASS (content correct) |
| Planar Ruins section | Present | Section 21 (line 1287+) with full RuinTemplate schema | PASS |

### 8d. `docs/design/10-prd.md`

| Check | Expected | Found | Status |
|---|---|---|---|
| Faction count | 5 | "Five factions" referenced at lines 60, 68, 90, 125 | PASS |
| Requirement count | 191+ (expanded) | 223 REQ-### references found (includes REQ IDs in notes/cross-refs) | PASS |
| 5-faction bot support | Referenced | "Bot AI for 5 factions" at line 90 | PASS |

### Doc Consistency Failure

**FAIL: `docs/design/02-card-data-model.md:545,578`**
- FactionShortName uses `CELESTIAL` and `ENDLESS` as short names
- All code files use `CELESTIAL_CRUSADE` and `THE_ENDLESS`
- The doc's enum definition does NOT match the code or the migration CHECK constraint
- However, the faction table in the same doc (lines 588-589) uses "CELESTIAL" and "ENDLESS" in the short_name column header, while the seed data and migration use `CELESTIAL_CRUSADE` and `THE_ENDLESS`
- Code is correct; doc is stale

---

## Summary

| Category | Checks | Passed | Failed | Warnings |
|---|---|---|---|---|
| 1. Faction Consistency | 10 | 8 | 1 | 1 |
| 2. Keyword Consistency | 7 | 7 | 0 | 0 |
| 3. Card Type Consistency | 7 | 7 | 0 | 0 |
| 4. Mechanic Consistency | 7 | 6 | 0 | 1 |
| 5. Avatar Count | 3 | 3 | 0 | 0 |
| 6. Ironwright Retheme | 3 groups | 0 | 1 (12 files) | 1 (17 files) |
| 7. Game Server Mechanics | 37 | 37 | 0 | 0 |
| 8. Doc Consistency | 14 | 13 | 1 | 0 |
| **TOTAL** | **88** | **81** | **3** | **3** |

### Critical Failures (Must Fix)

1. **`packages/game-server/src/services/fallback-art.ts`** -- Missing 2 factions (CELESTIAL_CRUSADE, THE_ENDLESS), wrong key for Demonic (DEMONIC vs DEMONIC_KINGDOMS). Fallback art generation broken for 3 of 5 factions.

2. **Active code steampunk references (12 files)** -- Stale steampunk terminology in prompts.ts (Ironwright environments), test file (prompts.test.ts), Swift color theme, fallback-art.ts colors, store-assets descriptions, agent configs, and monetization doc. See Section 6 for full list.

3. **`docs/design/02-card-data-model.md:545,578`** -- FactionShortName uses `CELESTIAL` and `ENDLESS` instead of `CELESTIAL_CRUSADE` and `THE_ENDLESS`. Doc does not match code or migration.

### Warnings (Should Fix)

1. **`ChaosCreatures/ChaosCreatures/Extensions/Color+Theme.swift`** -- No static color constants for Celestial and Endless factions. Ironwright colors still use old brass palette instead of rethemed `#6B7B8D`/`#E07020`.

2. **`packages/shared/src/types.ts`** -- Missing FactionMechanic type definition.

3. **Local scripts (17 files)** -- Pre-retheme Ironwright prompts and card data. Not production code, but will produce incorrect art if reused.

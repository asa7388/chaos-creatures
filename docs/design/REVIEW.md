# Chaos Creatures — Consolidated Audit Report

**Date:** 2026-02-16
**Sources:** REVIEW-numbers.md (numbers audit), REVIEW-systems.md (systems audit), REVIEW-prd.md (PRD audit)

---

## Issue Summary

| Severity | Count |
|----------|-------|
| **Critical** | 8 |
| **Warning** | 14 |
| **Info** | 5 |
| **Total** | **27** |

---

## Critical Issues

Contradictions, wrong numbers, or missing system definitions that would cause implementation bugs.

### CRIT-1: Shard Costs — Three Conflicting Sets of Values
**Sources:** numbers-auditor CRITICAL-1, prd-auditor C-1

The PRD (REQ-039) claims shard costs are 25/75/150/240, citing the economy doc. But the economy doc (`04-progression-economy.md`) actually says 30/60/120/240 everywhere. The master doc (`00`) also says 30/60/120/240. All economy math (total evolution cost = 450 Dust, weekly projections) is based on 30/60/120/240.

| Doc | Uncommon | Rare | Epic | Legendary |
|-----|----------|------|------|-----------|
| 00-master, 01-battle, 06-tech | 30 | 60 | 120 | 240 |
| 04-economy (all references) | 30 | 60 | 120 | 240 |
| 10-PRD (REQ-039, Gap 5) | **25** | **75** | **150** | 240 |

**Fix:** Update PRD REQ-039 and Gap 5 to 30/60/120/240. The PRD invented incorrect values.

### CRIT-2: First Daily Win Bonus — PRD Invention, Not in Any Source Doc
**Sources:** systems-auditor 2.7, prd-auditor A-1

PRD REQ-037 adds "+25 first daily win bonus" which exists in no source doc. The economy doc's weekly income tables, dust projections, and progression timelines do not account for this. Adding it inflates weekly income by ~175 Dust/week (~13% increase).

**Fix:** Remove from PRD REQ-037, or if intentional, add to economy doc and recalculate all projections.

### CRIT-3: Chaos Roll Formula — _prd-brief Has Completely Wrong Mechanics
**Sources:** numbers-auditor CRITICAL-2

The brief describes a 5-point "dead zone" system that doesn't exist. Canonical formula (all docs agree): `roll < instability = CHAOS`, `roll > instability = ORDER`, `roll == instability = NOTHING`.

**Fix:** Delete or deprecate _prd-brief.md. It has 12+ errors.

### CRIT-4: Turn Phase Names — Brief Has Wrong Names and Extra Phase
**Sources:** numbers-auditor CRITICAL-3

The brief lists "Main Phase 1" and "Main Phase 2" — there is NO Main Phase 2. Canonical phases: Start of Turn, Chaos Roll, Event Resolution, Draw & Gain Mana, Main Phase, Declare Attackers, Assign Blockers, Combat Resolution, End Turn.

**Fix:** Same as CRIT-3 — deprecate the brief.

### CRIT-5: fal.ai Parameters Mismatch Between Doc 03 and Doc 06
**Sources:** systems-auditor 2.1, 2.2, 2.3

Doc 06's `generateEvolutionArt` function uses `guidance_scale: 12.0` for Chaos (doc 03 says max 8.0), omits `strength` and `image_size` parameters entirely, and collapses Mid/Free into the same `num_inference_steps` value.

**Fix:** Doc 06 must use doc 03 Section 1.4 as the source of truth for all fal.ai parameters.

### CRIT-6: Void Lens — Listed as Both Stabilizer and Spell in Doc 01
**Sources:** numbers-auditor MISMATCH-11, systems-auditor 2.4

Doc 01 Section 11 says Void Lens is a board stabilizer (HP 2). Doc 01 Section 12 says it's a spell. Doc 00 confirms it's a stabilizer.

**Fix:** Update Doc 01 Section 12 to list Void Lens as a stabilizer, not a spell.

### CRIT-7: Probability Anchor — Exists in Doc 01 Section 12 But Not Section 11 or Doc 00
**Sources:** numbers-auditor MISMATCH-12, systems-auditor 2.5

Doc 01 Section 12 lists "Probability Anchor" (CM 3, instability treated as 10) but it doesn't appear in the canonical stabilizer list in Section 11 (which counts "7 cards").

**Fix:** Either add Probability Anchor to Section 11 in docs 00 and 01 (making 8 cards), or remove it from Section 12.

### CRIT-8: Missing PRD Features — 8 Design Features Have No Requirements
**Sources:** prd-auditor M-1 through M-8

Missing REQs for: (1) Specific Common purchase (50 Dust), (2) Card dismantling, (3) Favorite/star cards, (4) Visual prompt modifier counts by tier, (5) Stabilizer-specific rules, (6) Hand limit rule, (7) Start of Turn phase effects, (8) Triggered ability framework details.

**Fix:** Add REQs for each, or add explicit forward references to the design docs where these are fully specified.

---

## Warning Issues

Too vague for vibe coding, requires manual technical work from the owner, or wrong infrastructure stack referenced.

### WARN-1: Doc 00 Section 13 Still References Wrong/Generic Stack
**Sources:** numbers-auditor infra table, systems-auditor 3.1-3.4

Doc 00 lists "React Native / Flutter / PWA", "Replicate or Fal.ai", "Node.js or Python", "Phaser.js, PixiJS". Should reference exact stack from CLAUDE.md.

### WARN-2: CLAUDE.md Missing RevenueCat
**Sources:** prd-auditor I-1

Monetization doc chose RevenueCat over expo-in-app-purchases, but CLAUDE.md still says "App Store / Google Play native IAP".

### WARN-3: Daily Quest Dust Range — Doc 00/01 Say 25-50, Doc 04 Says 20-45
**Sources:** numbers-auditor MISMATCH-9, systems-auditor 2.6

Economy doc (source of truth): Easy=20, Medium=30, Hard=45 Dust. Master/battle docs say "25-50".

### WARN-4: Season Length — Doc 00 Says 4-6 Weeks, All Others Say 8
**Sources:** numbers-auditor MISMATCH-14

Economy, monetization, tech, and PRD all say 8 weeks. Master doc says "~4-6 weeks".

### WARN-5: Subscription Prices — Doc 00/01 Use Ranges, Doc 09/10 Have Final Prices
**Sources:** numbers-auditor MISMATCH-15

Final prices: $6.99 Mid, $12.99 Top (from doc 09). Docs 00/01 still say "~$5-8/mo" and "~$10-15/mo".

### WARN-6: Legendary Deck Limit — Brief Says 1, All Docs Say 2
**Sources:** numbers-auditor MISMATCH-10

Max 2 Legendaries per deck (1 copy each). Brief says max 1.

### WARN-7: Starter Shard Package — Inconsistency Within Doc 04
**Sources:** numbers-auditor MISMATCH-13

Doc 04 Section 2 includes 1 Legendary shard in starter pack. Section 3.2 omits it.

### WARN-8: PRD Stat Growth Algorithm Vagueness (REQ-027)
**Sources:** prd-auditor V-1

Gives tier multipliers but defers actual stat distribution algorithm.

### WARN-9: PRD Evolution Ceremony Vagueness (REQ-051)
**Sources:** prd-auditor V-2

Lists 9 steps but lacks duration targets and visual specs.

### WARN-10: PRD Faction Mechanic Implementation Vagueness (REQ-055/056)
**Sources:** prd-auditor V-3

Descriptions are conceptual ("stacking self-referencing effects"), not implementable.

### WARN-11: PRD Admin Dashboard Vagueness (P1-011)
**Sources:** prd-auditor V-4

Feature list only, no screen specs or data flows.

### WARN-12: PRD Matchmaking Polling Mechanism (REQ-043)
**Sources:** prd-auditor V-5

"Edge Function polls every 2 seconds" — Supabase Edge Functions are request-response, not long-running. pg_cron minimum is 1 minute.

### WARN-13: Owner Must Check Railway Logs for Errors
**Sources:** prd-auditor O-1

Should route to PostHog/Slack instead of requiring log reading.

### WARN-14: Doc 00 Open Design Questions — Some Resolved, Some Launch-Blocking
**Sources:** systems-auditor 5.2

11 unchecked items in doc 00. Some are resolved in other docs (denoising values, modifier lists) but not checked off. Two are launch-blocking: trial deck card lists and 240 modifier definitions.

---

## Info Issues

Minor inconsistencies or style issues.

### INFO-1: Doc 04 Shard Cost Math Uses Old Total (450) Even With New Per-Shard Values
**Sources:** numbers-auditor derived calculations

If shards are 30/60/120/240 = 450, the math is consistent. If changed to 25/75/150/240 = 490, doc 04's progression calculations need updates. Currently consistent at 30/60/120/240.

### INFO-2: PRD Phase 8 Reclassification
**Sources:** prd-auditor C-2

Battle doc groups Phase 8 under "decision phases". PRD reclassifies as "automatic". Functionally correct but diverges from source categorization.

### INFO-3: Content Count Ranges vs Final Numbers
**Sources:** prd-auditor C-3

PRD uses doc 00's early ranges (90-125 creatures). Doc 05 has final numbers (100 creatures, 17 spells, 7 stabilizers = 124/faction, 367 total).

### INFO-4: Doc 02 max_hp Comment Says "Could Be Modified"
**Sources:** systems-auditor 5.1

Vague wording. Should say "fixed for MVP" or "loaded from config".

### INFO-5: _prd-brief.md Contains 12+ Errors
**Sources:** numbers-auditor full analysis

The brief should be deleted or marked as deprecated. It was a working document created before the final docs and contains stale values for nearly every metric.

---

## Recommended Actions (Priority Order)

1. **Delete or deprecate** `_prd-brief.md` (resolves CRIT-3, CRIT-4, INFO-5)
2. **Fix PRD shard costs** to 30/60/120/240 (resolves CRIT-1)
3. **Remove PRD first daily win bonus** or add to economy doc with recalculations (resolves CRIT-2)
4. **Update doc 06 fal.ai parameters** to match doc 03 (resolves CRIT-5)
5. **Fix Void Lens type** in doc 01 Section 12 (resolves CRIT-6)
6. **Resolve Probability Anchor** — add to Section 11 or remove from Section 12 (resolves CRIT-7)
7. **Add missing PRD requirements** for 8 features (resolves CRIT-8)
8. **Update doc 00 Section 13** to exact infrastructure stack (resolves WARN-1)
9. **Add RevenueCat to CLAUDE.md** (resolves WARN-2)
10. **Update doc 00/01** daily quest dust, season length, subscription prices to final values (resolves WARN-3, WARN-4, WARN-5)

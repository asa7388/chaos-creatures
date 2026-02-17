# Systems Audit — Cross-Document Review

**Auditor:** systems-auditor agent
**Date:** 2026-02-16
**Scope:** All docs in `docs/design/` (00 through 10) plus `CLAUDE.md`

---

## 1. Summary

| Category | Issues Found |
|---|---|
| Cross-Reference Issues | 7 |
| Infrastructure Stack Issues | 4 |
| Unity/Legacy References | 0 (all in changelog context) |
| Vagueness Issues | 2 |
| Owner Workflow Issues | 0 |
| **Total** | **13** |

---

## 2. Cross-Reference Issues

### 2.1 guidance_scale mismatch between doc 03 and doc 06

**Doc 03** (`03-prompt-templates.md`, line 280) specifies `guidance_scale` by shard quality:
- Planar (Free): `7.0`
- Refined (Mid): `7.5`
- Prismatic (High): `8.0`

**Doc 06** (`06-technical-architecture.md`, line 938) uses `guidance_scale` based on evolution outcome instead:
```typescript
guidance_scale: params.evolutionOutcome === 'ORDER' ? 7.5 : 12.0,
```

The value `12.0` for Chaos evolutions does not appear anywhere in doc 03. Doc 03 is the source of truth for AI generation parameters.

**Fix:** Doc 06 line 938 must use the shard-quality-based values from doc 03 Section 1.4.

### 2.2 Missing `strength` and `image_size` parameters in doc 06

**Doc 03** (`03-prompt-templates.md`, lines 284-291) defines a full denoising strength table by evolution tier and outcome (ranging from `0.35` to `0.80`), plus `image_size` parameter (`portrait_4_3` vs `square_hd`).

**Doc 06** (`06-technical-architecture.md`, lines 934-941) omits both `strength` and `image_size` from the fal.ai API call. These are critical parameters that control how much the image changes during evolution.

**Fix:** Doc 06's `generateEvolutionArt` function must include `strength` (looked up from the tier+outcome table in doc 03) and `image_size` (based on shard quality per doc 03 line 278).

### 2.3 num_inference_steps only partially mapped in doc 06

**Doc 03** defines three tiers of `num_inference_steps`: `28` (Free), `32` (Mid), `40` (Prismatic).

**Doc 06** (line 937) only distinguishes two: `PRISMATIC ? 40 : 28`, collapsing Free and Mid into the same value. Mid (Refined Shard) should use `32`, not `28`.

**Fix:** Doc 06 needs a 3-way lookup for `num_inference_steps` matching doc 03 Section 1.4.

### 2.4 Void Lens inconsistency within doc 01

**Doc 01** Section 11 (`01-battle-mechanics.md`, line 1133) defines Void Lens as a **board stabilizer** with CM cost 3, HP 2, and a continuous aura effect.

**Doc 01** Section 12 (`01-battle-mechanics.md`, line 1196) lists Void Lens as a **spell** with `N/A (spell)` for instability contribution.

**Doc 00** (`00-game-design-master.md`, line 598) matches Section 11: Void Lens is a board stabilizer.

**Fix:** Doc 01 Section 12 line 1196 must list Void Lens as a stabilizer (not a spell) with instability contribution `0`, consistent with Section 11 and doc 00.

### 2.5 Probability Anchor exists in doc 01 Section 12 but not in Section 11

**Doc 01** Section 12 (`01-battle-mechanics.md`, line 1197) lists "Probability Anchor" as a stabilizer (CM cost 3, instability = 0, effect: "your instability is treated as 10").

**Doc 01** Section 11 has no mention of Probability Anchor. The definitive stabilizer list in Section 11 has 5 board stabilizers + 2 spells = 7 cards.

**Doc 00** Section 11 (`00-game-design-master.md`, lines 592-607) also lists exactly 5 board stabilizers + 2 spells with no Probability Anchor.

**Fix:** Either add Probability Anchor to doc 01 Section 11 (and update the count to 6 board stabilizers + 2 spells = 8 cards), or remove it from doc 01 Section 12 as an orphaned reference. The canonical list in Section 11 and doc 00 should be authoritative.

### 2.6 Daily quest dust range mismatch (doc 00 / doc 01 vs doc 04)

**Doc 00** (`00-game-design-master.md`, line 328) says daily quests award `25-50` Dust.
**Doc 01** (`01-battle-mechanics.md`, line 1221) repeats `25-50` Dust for daily quests.

**Doc 04** (`04-progression-economy.md`, lines 131-133) is the source of truth and defines three tiers:
- Easy: 20 Dust
- Medium: 30 Dust
- Hard: 45 Dust

The actual range is `20-45`, not `25-50`. Doc 04 is the authoritative economy document.

**Fix:** Docs 00 and 01 should update their daily quest dust references to `20-45` or simply cross-reference doc 04 without specifying a range.

### 2.7 First daily win bonus in doc 10 but absent from doc 04

**Doc 10** (`10-prd.md`, line 284, REQ-037) specifies: "First daily win: +25 bonus Dust."

**Doc 04** (`04-progression-economy.md`), the economy source of truth, has no mention of a "first daily win bonus" anywhere. The dust income tables, progression estimates, and economy config JSON all omit this concept.

**Fix:** Either add the first daily win bonus to doc 04's dust income table and `economy.config.json`, or remove it from doc 10 REQ-037. The economy doc is the source of truth.

---

## 3. Infrastructure Stack Issues

### 3.1 Doc 00 Section 13 still references wrong/generic stack

**Doc 00** (`00-game-design-master.md`, lines 641-667) contains the original pre-decision technical direction that contradicts CLAUDE.md:

| Line | Wrong Reference | Correct Reference |
|---|---|---|
| 641 | `React Native / Flutter / PWA with Phaser.js` | `React Native (Expo) + TypeScript` |
| 643 | `FLUX Kontext via Replicate or Fal.ai` | `fal.ai only` |
| 663 | `React Native / Flutter UI` | `React Native (Expo)` |
| 667 | `Phaser.js, PixiJS, or CSS` | `React Native Reanimated, Skia` |

**Fix:** Doc 00 Section 13 must be updated to match the exact stack from CLAUDE.md. Remove all mentions of Flutter, Phaser.js, PixiJS, PWA, and "Replicate or."

### 3.2 Doc 00 Decisions Log references "Replicate/Fal.ai"

**Doc 00** (`00-game-design-master.md`, line 1392) in the Decisions Log says:
> `FLUX Kontext Dev (free), FLUX Kontext Pro (subscribers) via Replicate/Fal.ai.`

CLAUDE.md specifies `fal.ai` only. Replicate is not in the stack.

**Fix:** Update line 1392 to say `via fal.ai` only.

### 3.3 Doc 00 launch card count range is outdated

**Doc 00** (`00-game-design-master.md`, lines 103-107) states the launch target as `~270-375` cards across 3 factions.

**Doc 05** (`05-content-pipeline.md`, line 24) locks the practical target at `367 cards` (360 faction + 7 universal).

**Fix:** Doc 00's card count table should be updated to match doc 05's final target of 367, or should cross-reference doc 05.

### 3.4 Doc 00 Section 13 still says "iOS primary, web prototype first"

**Doc 00** (`00-game-design-master.md`, line 637) says "iOS primary, web prototype first."

CLAUDE.md specifies: "Ships to iOS and Android via Expo EAS Build." There is no web prototype in the decided stack.

**Fix:** Update doc 00 line 637 to say "iOS and Android via Expo EAS Build" with no web prototype reference.

---

## 4. Unity/Legacy References

**No actionable issues found.** All Unity, C#, and legacy infrastructure references in docs 03-10 appear exclusively in changelog/comparison sections where they document what was removed from earlier drafts. These are appropriate historical context and do not need correction. Examples:

- Doc 06, line 2885: "Unity (C#) + Phaser.js (web)" appears in the "What Changed" table comparing v1.0 to v2.0.
- Doc 08, line 1234: "Replaced Unity/C# AudioSource references with React Native/Expo" in the changelog.
- Doc 10, line 967: Comparison table showing old "PWA (Phaser.js)" vs new "Expo EAS Build."

---

## 5. Vagueness Issues

### 5.1 Doc 02 `max_hp` comment says "could be modified"

**Doc 02** (`02-card-data-model.md`, line 757):
```
max_hp: int  // 20 (could be modified by future effects)
```

The phrase "could be modified by future effects" is speculative. Claude Code cannot implement from this — should the value be hardcoded or configurable?

**Fix:** Change to either `// 20, fixed for MVP` or `// Loaded from economy_config table` if it should be tunable.

### 5.2 Doc 00 has multiple open design questions marked incomplete

**Doc 00** (`00-game-design-master.md`, lines 1336-1351) has 11 unchecked items in the "Open Design Questions" section. While these are explicitly flagged as future work, some are relevant to launch:

- `[ ] Anti-cheat and generation abuse prevention` — No doc defines anti-cheat. Doc 06 has rate limiting but no cheat detection.
- `[ ] AI generation fallback and error handling edge cases` — Doc 03 handles the primary fallback case, but doc 00 flags edge cases as unresolved.
- `[ ] FLUX Kontext denoising strength values for Order vs. Chaos evolutions` — This IS resolved in doc 03 Section 1.4 but the checkbox in doc 00 was never checked.
- `[ ] Visual prompt modifier lists by tier (8-10 free, 25-30 mid, 40+ high)` — This IS resolved in doc 03 Section 1.5 but the checkbox was never checked.
- `[ ] Trial deck card lists (20 Commons x 3 factions)` — Not defined in any doc. Required for launch (onboarding flow depends on them).
- `[ ] Full modifier content authoring (240 individual definitions)` — Not defined. Required for launch.

**Fix:** Check off items that are resolved (denoising values, visual prompt modifiers). For unresolved launch-blocking items (trial deck lists, 240 modifier definitions), either create them or explicitly defer with a note about how they will be generated.

---

## 6. Owner Workflow Issues

**No actionable issues found.** All docs reviewed (05, 06, 10) design owner-facing processes correctly:

- Batch card generation: one `npm run generate-batch` command, then browser-based approve/reject gallery (doc 05).
- Economy tuning: form fields in Admin Dashboard, save button, no code changes (doc 06, doc 10).
- Deployment: single `./deploy.sh` command (doc 10).
- Incident response: PostHog alerts to email/Slack, actions in Admin Dashboard (doc 10).
- All processes require fewer than 3 clicks or a single terminal command.

---

## Appendix: Docs Verified

| Doc | Verified For |
|---|---|
| 00-game-design-master.md | Stack references, event counts, dust values, card counts, stabilizer list |
| 01-battle-mechanics.md | Event counts (8+8), dust values, stabilizer list consistency |
| 02-card-data-model.md | Vague language scan |
| 03-prompt-templates.md | fal.ai parameter values (source of truth), stack references |
| 04-progression-economy.md | Dust values (source of truth), quest templates, stack references |
| 05-content-pipeline.md | Launch card count, owner workflow, stack references |
| 06-technical-architecture.md | fal.ai parameters (cross-check with 03), schema cross-check with 02, stack references |
| 07-ui-ux-specs.md | Stack references, vagueness scan |
| 08-audio-design.md | Stack references, Unity reference check |
| 09-monetization-details.md | Stack references, vagueness scan |
| 10-prd.md | Cross-references to all docs, stack references, event counts, dust values |
| CLAUDE.md | Authoritative stack definition |

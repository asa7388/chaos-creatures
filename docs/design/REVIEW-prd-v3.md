# PRD Audit Report — REVIEW-prd-v3.md

**Audited Document:** `docs/design/10-prd.md` (v3.1, dated 2026-02-16)
**Auditor:** PRD Audit Agent (v3 pass)
**Audit Date:** 2026-02-16
**Audit Method:** Targeted grep verification of all v2 audit fix claims, plus full cross-reference check against protected files (CLAUDE.md, docs 00, 01, 02) and downstream docs (03-09)

---

## Part 1: V2 Audit Fix Verification

The v3.1 revision log (PRD lines 1095–1102) claims to have fixed three items from the v2 audit: WARN-11 (instability formula), WARN-12 (Admin Dashboard REQs), and WARN-13 (Ranked Ladder REQs). The following table verifies each v2 audit item.

### Summary Table — V2 Audit Fix Verification

| # | Check | Expected | Grep Result | PASS / FAIL |
|---|---|---|---|---|
| V2-01 | "Top" tier replaced with "High" in all references | No remaining "Top" in tier context | 2 remaining "Top" instances: line 710 (REQ-140), line 758 (metrics table) | **FAIL** |
| V2-02 | Mid deck slots = 6 (not 5) in body | US-014 and REQ-036 say "6" | Lines 151 and 296 both say "Mid: 6 slots" | **PASS** |
| V2-03 | Modifier count = 240 in Gap 4 and REQ-151 | 240 (not 144) | Lines 72, 190, 476, 825, 1083 all say 240 | **PASS** |
| V2-04 | FAL_KEY (not FAL_API_KEY) | `FAL_KEY` in env var list and REQ-129 | Lines 684 and 987 both use `FAL_KEY` | **PASS** |
| V2-05 | P0-005 references `06-technical-architecture.md` Section 4.5 | Section 4.5 = Matchmaking Service in doc 06 | Line 171 says "Section 4.5" — confirmed Section 4.5 of doc 06 is Matchmaking | **PASS** |
| V2-06 | P0-002 references `02-card-data-model.md` Sections 2-5, 20 | Sections 2-5 (CardInstance, EvolutionRecord, ModifierSystem, TriggeredAbility) and 20 (DataFlow) | Line 168 — confirmed sections exist in doc 02 | **PASS** |
| V2-07 | P0-013 references `06-technical-architecture.md` Sections 4.6, 5.1-5.6 | Section 4.6 = Game Server; 5.1-5.6 = Game Server Deep Dive | Line 179 — confirmed sections 4.6 and 5.1-5.6 exist in doc 06 | **PASS** |
| V2-08 | Instability formula includes `max(0, ...)` per-creature floor | `max(0, creature_base_instability + ...)` in Section 1.5 | Line 77 — formula present with `max(0, ...)` and explanatory note | **PASS** |
| V2-09 | Admin Dashboard tech = React + Vite (TypeScript) | React + Vite used in all Admin contexts | Lines 53, 197, 396, 979 all say "React + Vite, TypeScript" | **PARTIAL FAIL** (see NEW-02 below) |
| V2-10 | REQ-175 through REQ-178 present (Ranked Ladder) | 4 ranked ladder REQs with acceptance criteria | Lines 383-386 — all 4 present with full acceptance criteria | **PASS** |
| V2-11 | REQ-179 through REQ-186 present (Admin Dashboard) | 8 admin dashboard REQs with acceptance criteria | Lines 396-403 — all 8 present with full acceptance criteria | **PASS** |
| V2-12 | No "Top" in REQ acceptance criteria or user stories | "Top" must not appear in any REQ or US rows | Line 710 (REQ-140 acceptance criteria) contains "Top ~$0.08" | **FAIL** |

---

## Part 2: Detailed Findings for Failed Checks

### FAIL-01: "Top" Tier Still Present in Two Locations

**Severity:** Medium — inconsistency; tier name standardization is incomplete

**Location 1 (line 710):**
```
| REQ-140 | Target AI cost per evolution: Free ~$0.02, Mid ~$0.05, Top ~$0.08. |
```
This is inside a REQ acceptance criteria cell. "Top" should be "High" to match the standardized tier name used everywhere else in the PRD.

**Location 2 (line 758):**
```
| Time to First Legendary | Days from account creation to first Legendary evolution | Free Regular ~6 weeks, Top Regular ~3 weeks. |
```
This is in the Progression metrics table under Section 9.2. "Top Regular" should be "High Regular."

**Required fix:** Replace both instances with "High."

---

### FAIL-02 (from V2-09): Infrastructure Table Row Contradicts Section 1.3 and All REQs

**Severity:** Medium — contradictory tech spec will confuse Claude Code when building Admin Dashboard

**Location (line 95, Section 1.6 infrastructure table):**
```
| Admin | Node.js + Express + static HTML/JS on Railway | Dashboard for owner operations |
```

**Contradicted by** (all other Admin Dashboard references in the PRD):
- Line 53 (Section 1.3): "React + Vite, TypeScript"
- Line 197 (P1-011): "React + Vite, TypeScript"
- Line 396 (REQ-179): "Railway-hosted web app (React + Vite, TypeScript)"
- Doc 06 Section 9.1, Doc 07 Part B: "React + Vite (TypeScript)"

The infrastructure table at line 95 was not updated when the Admin Dashboard tech was corrected from "Node.js + Express + static HTML/JS" to "React + Vite (TypeScript)" in v3.0. The v3.1 revision log does not list this row as updated.

**Required fix:** Change line 95 to:
```
| Admin | React + Vite (TypeScript) on Railway (served via Node.js + Express) | Dashboard for owner operations |
```

---

## Part 3: New Issues Not Covered in V2 Audit

### NEW-01: Section 4.5 Matchmaking — Wrong Internal Reference

**Severity:** Medium — Claude Code will look in the wrong section of doc 06

**Location (line 312):**
```
**Reference:** `06-technical-architecture.md` Section 2.6
```

**What Section 2.6 of doc 06 actually is:**
- `### 2.6 Image Caching` (line 879 of doc 06) — not matchmaking

**What the correct section is:**
- `### 4.5 Matchmaking Service (Supabase Edge Functions + Realtime)` (line 1719 of doc 06)

Note: P0-005 in the feature table (line 171) correctly references "Section 4.5." Only the body of Section 4.5 in the PRD has the wrong reference. This inconsistency creates confusion.

**Required fix:** Change line 312 to:
```
**Reference:** `06-technical-architecture.md` Section 4.5
```

---

### NEW-02: Section 4.12 Admin Dashboard — Wrong Internal Reference

**Severity:** Low — wrong section number, but REQ-179-186 are fully self-contained

**Location (line 392):**
```
**Reference:** `06-technical-architecture.md` Section 8, CLAUDE.md ("Two Applications" section)
```

**What Section 8 of doc 06 actually is:**
- `## 8. Object Storage (Cloudflare R2)` (line 3116 of doc 06) — not Admin Dashboard

**What the correct section is:**
- `## 9. Admin Dashboard (Separate Web Application)` (line 3192 of doc 06)

**Required fix:** Change to `06-technical-architecture.md` Section 9.

---

### NEW-03: Section 12.6 Deploy Script — Wrong Section Reference

**Severity:** Low — wrong section number in an informational note

**Location (line 966):**
```
The script is defined in `06-technical-architecture.md` Section 9.3.
```

**What Section 9.3 of doc 06 actually is:**
- `### 9.3 Economy Config Editor` (line 3232 of doc 06) — not the deploy script

**What the correct section is:**
- `### 10.3 Production Deployment` (line 3477 of doc 06) — this is where `deploy.sh` is defined

**Required fix:** Change to `06-technical-architecture.md` Section 10.3.

---

### NEW-04: Revision Log Entry v3.0 — Deck Slot Direction is Backwards

**Severity:** Low — revision log error only; body content is correct

**Location (line 1121, v3.0 revision log):**
```
| **Deck slot Mid tier** | 6 slots | 5 slots | Aligned with `06-technical-architecture.md` v3.0. |
```

This entry is backwards. The PRD's body (US-014 line 151, REQ-036 line 296) correctly shows Mid = 6 slots, as required by protected files `00-game-design-master.md` and `02-card-data-model.md`. The v3.0 revision log states the change was from 6 → 5, implying the v3.0 PRD reduced slots, but the body says 6. The v2 audit (CONTRADICTION-01) found the v2.0 PRD had 5 slots and required a fix to 6.

The revision log should read: "Old (v2.0) = 5 slots → New (v3.0) = 6 slots."

Additionally, the cited reason "Aligned with `06-technical-architecture.md` v3.0" is incorrect — the alignment is with protected files `00-game-design-master.md` and `02-card-data-model.md` (per the v2 audit finding and the Gap 2 resolution text at line 1069).

**Required fix:** Correct the revision log row to show "Old = 5 slots, New = 6 slots. Aligned with protected files `00-game-design-master.md` Section 8 and `02-card-data-model.md` Player entity."

---

### NEW-05: REQ-082 and REQ-138 Still Use "Top" in Accepted Rate Limit Text

**Severity:** Medium — covered under FAIL-01 but worth isolating as a REQ-specific instance

**Location (line 438, REQ-082 acceptance criteria):**
```
Evolution start: tier-based (5/15/30 per day for Free/Mid/High, checked via `generation_jobs` count)
```
This one is CORRECT — it says "High." No issue here.

**Location (line 710, REQ-140 acceptance criteria):**
```
Free ~$0.02, Mid ~$0.05, Top ~$0.08
```
This says "Top." This is the same instance as FAIL-01.

---

### NEW-06: MISSING-02 (v2) — Achievement System Still Has No Functional REQs

**Severity:** Medium — carried from v2 audit; not fixed in v3.1

P1-009 (line 195) still lists achievement features without any REQ-XXX requirements with acceptance criteria. The v3.1 revision log does not claim to have fixed this. No Section 4.12+ for achievements exists (4.12 was assigned to Admin Dashboard). No REQ covering:
- What triggers achievement progress evaluation
- How one-time rewards are granted
- Which Edge Function handles evaluation

This was MISSING-02 in the v2 audit and remains open.

---

### NEW-07: VAGUE-01 (v2) — Phase Timer "Shared" Ambiguity Not Clarified

**Severity:** Low — carried from v2 audit; not fixed in v3.1

REQ-005 (line 231) still reads: "Phases 5-6 are decision phases with a shared timer." The v2 audit flagged that "shared timer" is ambiguous — does each phase get 60 seconds, or is it one 60-second window covering both? This was not addressed in v3.1.

The v3.1 revision log does not list a fix for VAGUE-01.

---

### NEW-08: VAGUE-06 (v2) — Quest Generation Algorithm Still Not Specified as REQ

**Severity:** Low — carried from v2 audit; not fixed in v3.1

P1-001 references `04-progression-economy.md` Section 4 for the quest system, but no REQ-XXX requirement specifies how 3 daily quests are generated at 00:00 UTC, what prevents conflicting quest objectives, or which Edge Function runs the generation. The `QuestTemplate` entity is still absent from Section 6.1.

---

### NEW-09: MISSING-04 (v2) — Faction Mastery Progression Not Specified

**Severity:** Low — carried from v2 audit; not fixed in v3.1

Section 6.1 (line 478) references "faction mastery" in the Player entity, and REQ-057 (line 352) references unlockable avatars, but no REQ specifies what grants mastery XP, when mastery level increases, or what level unlocks the second avatar. This was MISSING-04 in the v2 audit and remains unaddressed.

---

### NEW-10: Version Footer Mismatch

**Severity:** Low — cosmetic issue only

**Location (line 1149):**
```
*Version: 3.0 -- Full rewrite for native iOS (Swift/SwiftUI/SpriteKit) platform pivot.*
```

The document header (line 7) declares Version 3.1, but the footer still says "Version: 3.0." The v3.1 revision log (line 1095) also notes changes from v3.0 to v3.1, confirming the current version is 3.1.

**Required fix:** Update line 1149 to "Version: 3.1."

---

### NEW-11: SKILL-01 (v2) — `npm run validate-balance` Still Requires Terminal Access

**Severity:** Low — not changed; carry-forward from v2 audit

REQ-165 (line 854) still says: "Run as `npm run validate-balance` script in game server project." The v2 audit flagged this as requiring the owner to navigate a project directory and run a terminal command, which violates CLAUDE.md's "no more than 3 clicks or one terminal command" principle. The fix would add a "Run Balance Validation" button to the Admin Dashboard that calls `POST /admin/validate-balance` on Railway. This was SKILL-01 in v2 and was not addressed in v3.1.

---

## Part 4: Overall Summary

### V2 Fix Verification Results

| Category | Count | Status |
|---|---|---|
| V2 fixes confirmed PASS | 9 | Correctly implemented |
| V2 fixes FAIL (incomplete) | 2 | FAIL-01 ("Top" remains), FAIL-02 (infra table not updated) |
| V2 fixes PARTIAL | 1 | V2-09 (Admin tech correct in 4 of 5 locations; infra table missed) |

### New Issues Found in V3 Pass

| ID | Severity | Description | Type |
|---|---|---|---|
| NEW-01 | Medium | Section 4.5 Matchmaking references doc 06 Section 2.6 (Image Caching) — should be Section 4.5 | Wrong cross-reference |
| NEW-02 | Low | Section 4.12 Admin Dashboard references doc 06 Section 8 (R2 Storage) — should be Section 9 | Wrong cross-reference |
| NEW-03 | Low | Section 12.6 deploy.sh references doc 06 Section 9.3 (Economy Config Editor) — should be Section 10.3 | Wrong cross-reference |
| NEW-04 | Low | v3.0 revision log shows deck slot change direction as 6→5 (backwards); body correctly shows 6 | Revision log error |
| NEW-05 | Medium | REQ-140 acceptance criteria uses "Top ~$0.08" (same as FAIL-01) | Tier name inconsistency |
| NEW-06 | Medium | Achievement system (P1-009) still has no REQ-XXX requirements (v2 MISSING-02 unresolved) | Missing requirements |
| NEW-07 | Low | REQ-005 phase timer "shared timer" ambiguity not resolved (v2 VAGUE-01 unresolved) | Vagueness carry-forward |
| NEW-08 | Low | Quest generation algorithm not specified as REQ (v2 VAGUE-06 unresolved) | Vagueness carry-forward |
| NEW-09 | Low | Faction mastery progression not specified (v2 MISSING-04 unresolved) | Missing requirements |
| NEW-10 | Low | Footer says "Version: 3.0" but document is v3.1 | Cosmetic |
| NEW-11 | Low | REQ-165 `npm run validate-balance` requires terminal nav (v2 SKILL-01 unresolved) | Owner UX |

### Priority Fix List for V3.1 → V3.2

**Fix immediately (blocking or high-priority):**

1. **FAIL-01 / NEW-05**: Replace "Top" with "High" in REQ-140 (line 710) and metrics table (line 758).
2. **FAIL-02 / NEW-02 (infra table)**: Update infrastructure table row for Admin (line 95) to "React + Vite (TypeScript) on Railway (served via Node.js + Express)."
3. **NEW-01**: Fix Section 4.5 Matchmaking reference from "Section 2.6" to "Section 4.5" (line 312).

**Fix in next pass (medium priority):**

4. **NEW-02**: Fix Section 4.12 Admin Dashboard reference from "Section 8" to "Section 9" (line 392).
5. **NEW-03**: Fix Section 12.6 deploy.sh reference from "Section 9.3" to "Section 10.3" (line 966).
6. **NEW-06**: Add 3+ REQ-XXX requirements for achievement system (evaluation trigger, reward grant, Edge Function identity) under a new Section 4.13 or appended to Section 4.9.

**Fix when time permits (low priority):**

7. **NEW-04**: Correct v3.0 revision log deck slot entry (line 1121) to show "Old = 5 → New = 6."
8. **NEW-07**: Clarify REQ-005 "shared timer" language.
9. **NEW-08**: Add a QuestTemplate entity to Section 6.1 and a REQ for the quest generation algorithm.
10. **NEW-09**: Add a REQ for faction mastery progression and unlockable avatar criteria.
11. **NEW-10**: Update footer version from "3.0" to "3.1" (line 1149).
12. **NEW-11**: Add "Run Balance Validation" button to Admin Dashboard REQs; remove raw `npm run validate-balance` expectation for owner.

---

## Part 5: Confirmed Correct Items (No Action Needed)

The following v2 audit fixes and v3.1 claims were verified as correct:

- Deck slots Mid = 6 in US-014 (line 151), REQ-036 (line 296), and Gap 2 resolution (line 1069–1071). PASS.
- Modifier count = 240 in Section 1.5 (line 72), P1-004 (line 190), Section 6.1 (line 476), REQ-151 (line 825), and Gap 4 resolution (line 1083). PASS.
- `FAL_KEY` (not `FAL_API_KEY`) in REQ-129 (line 684) and `.env` variable list (line 987). PASS.
- P0-005 references `06-technical-architecture.md` Section 4.5. PASS.
- P0-013 references `06-technical-architecture.md` Sections 4.6, 5.1–5.6. PASS.
- Instability formula `max(0, ...)` per-creature floor in Section 1.5 (line 77) with explanatory note. PASS.
- REQ-175 through REQ-178 (Ranked Ladder) present with full acceptance criteria. PASS.
- REQ-179 through REQ-186 (Admin Dashboard) present with full acceptance criteria. PASS.
- Admin Dashboard tech = "React + Vite, TypeScript" in Section 1.3 (line 53), P1-011 (line 197), and REQ-179 (line 396). PASS (with exception of infra table line 95 — see FAIL-02).
- Subscription tier enum values use FREE/MID/HIGH (not FREE/MID/TOP) in code contexts: `user_subscriptions.tier = 'HIGH'` (line 308), `tier (FREE/MID/HIGH)` (line 479). PASS.
- Evolution energy earn rate 2/win, 1/loss, all 20 cards simultaneously — consistent in Section 1.5 (line 76), US-006 (line 133), REQ-023 (line 269). PASS.
- Evolution energy thresholds 15/30/50/75 in Section 1.5 (line 76) and REQ-024 (line 277). PASS.
- Infrastructure stack in Section 1.6 is consistent with CLAUDE.md (with exception of Admin row — see FAIL-02). PASS.
- StoreKit 2 references complete and correct. PASS.
- Budget $300 cap with ~$233 total respected. PASS.

---

*Audit completed: 2026-02-16*
*Auditor: PRD Audit Agent — v3 pass*
*PRD version audited: 3.1*
*Issues found this pass: 3 FAIL (2 from v2 not fixed, 1 new wrong cross-reference [NEW-01]) + 8 carry-forward v2 items + 4 new low-severity items*

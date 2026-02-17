# Chaos Creatures -- Documentation Pipeline Progress

## Current Phase: Step 7 -- Resolution Loop (v3.2 fixes applied)

| # | Document | Agent | Status | Notes |
|---|---|---|---|---|
| 01 | battle-mechanics.md | (protected) | v3.2 PATCH | Void Lens fixed, Probability Anchor removed, "Faction-locked"→"Universal", Section 12 table completed (Warding Pillar + Entropy Engine), "Top"→"High" + canonical prices |
| 03 | prompt-templates.md | prompt-engineer | v3.2 FIXED | FAL_KEY, High tier naming, 367→358 card count, inference steps |
| 04 | progression-economy.md | economy-designer | v3.2 FIXED | Top→High tier naming throughout (including weekly quest table header) |
| 05 | content-pipeline.md | content-pipeline | v3.2 FIXED | Faction stabilizers removed (universal only), 358 cards, FAL_KEY, "Top"→"High" in cost table |
| 06 | technical-architecture.md | tech-architect | v3.2 FIXED | Deck slots 6, highTierID, React+Vite admin, 367→358 card count in budget, seasons/bp tables, fallback art spec |
| 07 | ui-ux-specs.md | ui-spec-writer | v3.2 FIXED | .high tier, Free/Mid/High labels, subscription card "Top"→"High" |
| 08 | audio-design.md | audio-designer | v3.0 (no changes needed) | No audit issues found |
| 09 | monetization-details.md | monetization-analyst | v3.2 FIXED | HIGH enum, grace period section, topMonthly→highMonthly, product IDs updated |
| 10 | prd.md | prd-writer | v3.2 FIXED | 367→358, faction stabilizers corrected, admin infra table, section references fixed, "Top"→"High", deck slot changelog, footer version |

## Resolution Summary

### Round 1: v2 Audit Fixes (5 CRITICAL + 13 WARNING = 18 issues, all fixed)
- CRIT-01: Mid deck slots 5→6 (docs 06, 10)
- CRIT-02: Modifier count 144→240 (doc 10 Gap 4)
- CRIT-03: Void Lens spell→stabilizer (doc 01 Section 12)
- CRIT-04: Probability Anchor removed (doc 01 Section 12)
- CRIT-05: FAL_API_KEY→FAL_KEY (docs 03, 05, 10)
- WARN-01 through WARN-13: Tier naming, stabilizers, section refs, admin tech, grace period, fallback art, seasons tables, instability floor, ranked ladder REQs, admin dashboard REQs

### Round 2: v3 Re-Audit Fixes (from REVIEW-numbers-v3, REVIEW-systems-v3, REVIEW-prd-v3)
- 367→358 card count across docs 03, 06, 10 (and _prd-input-summary)
- Doc 01 line 1111 "Faction-locked"→"Faction-agnostic (Universal)"
- Doc 01 Section 12 table: added Warding Pillar + Entropy Engine (were missing)
- Doc 01 Section 6 + 13: "Top"→"High", stale prices→canonical $6.99/$12.99
- Doc 09 ProductID struct: topMonthly/topAnnual→highMonthly/highAnnual
- Doc 10 infra table: "Node.js + Express + static HTML/JS"→"React + Vite (TypeScript)"
- Doc 10 Section 4.5 reference: 2.6→4.5
- Doc 10 Section 4.12 reference: Section 8→Section 9
- Doc 10 Section 12.6 reference: Section 9.3→Section 10.3
- Doc 10 REQ-140 + metrics: "Top"→"High"
- Doc 10 deck slot changelog: direction corrected (5→6, not 6→5)
- Doc 10 footer: version 3.0→3.2
- Doc 10 Gap 5: rewritten for 358 (no faction stabilizers)
- Doc 10 REQ-149/150: stabilizer REQs corrected (universal only)

### Known Accepted Items (not fixable or low-priority)
- Doc 00 stale price ranges (~$5-8, ~$10-15): protected file, doc 09 supersedes
- Doc 00 "Top (Prismatic Shard)": protected file, cannot modify
- Doc 04 simulation persona labels "Top Casual/Regular/Hardcore": internal-only, no player impact
- Missing REQs for achievements, quest generation, faction mastery: design holes for future iteration
- REQ-005 "shared timer" vagueness: low priority, clarified by doc 01 turn structure

## Pipeline History

### Initial Wave 1 + Wave 2 (Original)
- All 8 docs (03-10) produced: 8,821 total lines
- Validation pass: COMPLETE

### Phase 1 Revisions (Audit v1)
- Numbers audit, systems audit, PRD audit: REVIEW.md produced (27 issues)
- All docs revised to fix audit findings

### Step 1: Platform Pivot to iOS
- CLAUDE.md rewritten for Swift/SwiftUI/SpriteKit
- All 12+ agent files updated for iOS
- 3 new agents created (checkpoint-auditor, buildability-auditor, player-journey-auditor)
- Core docs (00, 01, 02) light pass for iOS alignment
- Protected files locked: CLAUDE.md, 00, 01, 02

### Step 2: Full Agent Revision for iOS -- COMPLETE
- 7 specialist agents ran in parallel
- All docs 03-09 revised to v3.0

### Step 3: Checkpoint Audit -- PASS
### Step 4: PRD Revision -- COMPLETE (v3.0, 1,113 lines, REQ-001 through REQ-174)
### Step 5: Checkpoint Audit -- PASS

### Step 6: 5 Audit Agents -- COMPLETE
- REVIEW-numbers-v2.md, REVIEW-systems-v2.md, REVIEW-prd-v2.md, REVIEW-buildability.md, REVIEW-player-journey.md
- Merged into REVIEW-v2.md

### Step 7: Resolution Loop -- Round 1 COMPLETE, Round 2 COMPLETE
- Round 1: Fixed all 5 CRITICAL and 13 WARNING from REVIEW-v2.md
- Round 2: Fixed all HIGH/MEDIUM from v3 re-audit (REVIEW-numbers-v3, REVIEW-systems-v3, REVIEW-prd-v3)
- Remaining items are LOW priority / accepted / in protected files

## Next Steps
- Final commit and push

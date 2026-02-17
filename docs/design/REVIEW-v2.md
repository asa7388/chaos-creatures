# Chaos Creatures — Merged Design Review v2

**Date:** 2026-02-16
**Sources:** REVIEW-numbers-v2.md, REVIEW-systems-v2.md, REVIEW-prd-v2.md, REVIEW-buildability.md, REVIEW-player-journey.md
**Method:** De-duplicated cross-audit merge. See individual audit files for full evidence and line references.

---

## Summary Table

| Severity | Count | Notes |
|---|---|---|
| CRITICAL | 5 | 3 doc contradictions, 2 implementation risks |
| WARNING | 13 | Spec gaps, naming inconsistencies, missing backend tables |
| INFO | 5 | Low-priority notes, documentation improvements |
| **BUILDABILITY RED** | **5** | Flagged separately — implementation risk, not doc errors |
| **MISSING SCREENS** | **14** | Flagged separately — new content required in doc 07 |

---

## CRITICAL Issues

Issues in this section will produce incorrect build output if not resolved before implementation begins.

---

### CRIT-01 — Mid-Tier Deck Slots: 5 vs. 6

**Source audits:** numbers-v2, systems-v2, prd-v2
**Severity:** CRITICAL — contradicts protected files
**Affected docs:** `06-technical-architecture.md`, `10-prd.md` (downstream), `_prd-input-summary.md`
**Protected truth:** `00-game-design-master.md` Section 7 and `02-card-data-model.md` line 623 both state `3 (free), 6 (mid), 10 (high)`.

**What is wrong:** Docs 06 and 10 say Mid = 5. The PRD v3.0 "resolved" this by deferring to doc 06 — but doc 06 is also downstream and doc 06 is also wrong. Both must be corrected to 6.

**Specific locations to fix:**
- `06-technical-architecture.md` lines ~721 and ~751: `tier === "MID" ? 5 : 3` → change `5` to `6`
- `06-technical-architecture.md` DB schema comment: `-- 3 (free), 5 (mid), 10 (high)` → change `5` to `6`
- `10-prd.md` US-014: "Mid: 5 deck slots" → 6
- `10-prd.md` REQ-036: "Mid: 5 slots" → 6
- `10-prd.md` Gap 2 resolution: change "Implement Mid = 5" to 6, cite protected docs 00 and 02

---

### CRIT-02 — Modifier Count: 240 vs. 144 (PRD Gap 4)

**Source audits:** numbers-v2, systems-v2
**Severity:** CRITICAL — contradicts CLAUDE.md and all three protected files
**Affected docs:** `10-prd.md`

**What is wrong:** `10-prd.md` Gap 4 reinterprets the canonical "240 modifier definitions" as "144 unique modifier definitions" and instructs "Implement 144 unique modifier definitions." CLAUDE.md, `00-game-design-master.md`, `01-battle-mechanics.md`, and `02-card-data-model.md` all state unambiguously: 12 pools × (8 universal + 4 per faction) = **240 modifier definitions at launch**.

**Fix:** Remove or replace the Gap 4 resolution in `10-prd.md` with: "Implement 240 modifier definitions as specified in CLAUDE.md and protected docs 00/01/02. The 240 count is the canonical number of distinct modifier entries in the database."

---

### CRIT-03 — Void Lens: Stabilizer vs. Spell Contradiction

**Source audits:** systems-v2 (CRIT-02)
**Severity:** CRITICAL — unresolvable ambiguity in protected doc 01
**Affected docs:** `01-battle-mechanics.md` (protected)

**What is wrong:** `01-battle-mechanics.md` Section 11 defines Void Lens as a board stabilizer (CM cost 3, HP 2, continuous effect while on field, counted among "5 board stabilizers + 2 spells = 7 cards"). Section 12 lists Void Lens as a **Spell** with a different effect ("Spell: choose whether this turn's event is Order or Chaos after seeing the roll"). These are mutually exclusive definitions in the same protected document. This has been flagged in three prior reviews without resolution.

**Fix:** Per the protected file exception process (targeted factual error correction), remove Void Lens from the Section 12 spell list in `01-battle-mechanics.md`. Keep the Section 11 stabilizer definition as canonical. Note: doc 00 Section 11 also defines Void Lens as a stabilizer, which confirms the Section 11 entry is correct.

---

### CRIT-04 — Probability Anchor: Card Exists in Section 12 But Not Section 11

**Source audits:** systems-v2 (CRIT-03)
**Severity:** CRITICAL — unresolvable ambiguity blocks content pipeline
**Affected docs:** `01-battle-mechanics.md` (protected), `05-content-pipeline.md`

**What is wrong:** `01-battle-mechanics.md` Section 12 lists "Probability Anchor" (CM 3, instability = 0, "While on field: your instability is treated as 10"). Section 11 does not mention it and explicitly states "5 board stabilizers + 2 spells = 7 cards." `00-game-design-master.md` Section 11 also has no mention. The content pipeline cannot know whether to create this card.

**Fix:** Make an explicit decision — either (A) add Probability Anchor to Section 11 in docs 00 and 01 and update the count from 7 to 8, or (B) remove it from doc 01 Section 12. The content pipeline in `05-content-pipeline.md` must be updated to reflect the decision.

---

### CRIT-05 — FAL API Key Name: `FAL_KEY` vs. `FAL_API_KEY`

**Source audits:** systems-v2 (CRIT-04, INFO-05)
**Severity:** CRITICAL — generation pipeline will fail with auth errors at build time
**Affected docs:** `03-prompt-templates.md`, `05-content-pipeline.md` (use `FAL_API_KEY`); `06-technical-architecture.md`, `10-prd.md` (use `FAL_KEY`)

**What is wrong:** `03-prompt-templates.md` and `05-content-pipeline.md` reference `process.env.FAL_API_KEY` in all code examples and `.env` templates. `06-technical-architecture.md` (the authoritative infrastructure spec) uses `Deno.env.get('FAL_KEY')`. The batch pipeline and Edge Functions will look for different environment variables.

**Fix:** Standardize on `FAL_KEY` (matching doc 06). Update all `FAL_API_KEY` occurrences in docs 03 and 05 to `FAL_KEY`.

---

## WARNING Issues

---

### WARN-01 — Subscription Tier Naming: `HIGH` vs. `top`

**Source audits:** numbers-v2 (15b), systems-v2 (WARN-01)
**Affected docs:** `09-monetization-details.md`, `10-prd.md`

The protected data model (`02-card-data-model.md` SubscriptionTier enum) defines `FREE | MID | HIGH`. The database schema in doc 06 uses `HIGH`. Swift code in doc 09 uses `case top = "top"`. PRD code references `top`. Human-readable labels like "Top Tier" are acceptable, but raw enum and database values must use `HIGH` to match the protected schema.

**Fix:** Update Swift enum in doc 09 from `case top = "top"` to `case high = "high"`.

---

### WARN-02 — Faction Stabilizers: Per-Faction (doc 05) vs. Universal Only (docs 00, 01)

**Source audits:** systems-v2 (CRIT-08), numbers-v2 (12)
**Affected docs:** `05-content-pipeline.md`

`05-content-pipeline.md` Section 1a targets "7 faction stabilizers per faction" (21 total, included in per-faction counts). Docs 00 and 01 explicitly state all launch stabilizers are universal (shared by all factions), with faction-specific stabilizers reserved for future expansions. The content pipeline will generate 21 faction-specific cards that have no mechanical definition.

**Fix:** Remove "Faction stabilizers" from per-faction counts in `05-content-pipeline.md` Section 1a. The 7 universal stabilizers are a one-time shared pool. Update the grand total from 379/367 to 358 (300 creatures + 51 spells + 7 universal stabilizers).

---

### WARN-03 — PRD Section References Point to Wrong Doc Sections

**Source audits:** systems-v2 (CRIT-05, CRIT-06, CRIT-07)
**Affected docs:** `10-prd.md`

Three broken cross-references in the PRD:
1. **P0-005 (Matchmaking)** references `06-technical-architecture.md Section 2.6` — Section 2.6 is Image Caching. Matchmaking is Section 4.5.
2. **P0-002 (Evolution)** references `02-card-data-model.md Section 20` — Section 20 is Data Flow diagrams. Evolution schema is Sections 2–5.
3. **P0-013 (Game Server)** references Sections 4.1–4.6 — misses Section 5 (turn resolution algorithm, combat resolution, timer management). Should reference Sections 4.6 and 5 (5.1–5.6).

**Fix:** Update all three PRD references to correct section numbers.

---

### WARN-04 — Admin Dashboard Technology Inconsistency

**Source audits:** systems-v2 (WARN-03)
**Affected docs:** `03-prompt-templates.md`, `06-technical-architecture.md`, `07-ui-ux-specs.md`, `10-prd.md`

| Doc | Admin Dashboard Tech |
|---|---|
| `03-prompt-templates.md` | "React web app on Railway" |
| `06-technical-architecture.md` Sections 1.2 and 9 | "Node.js + Express + static HTML/JS" |
| `07-ui-ux-specs.md` Part B | "React + Vite (TypeScript)" with `.tsx` files |
| `10-prd.md` | Hedged: "Node.js + Express or React + Vite" |

**Fix:** Choose one. Doc 07 Part B has the most complete spec (React + Vite with `.tsx` files). Recommend updating doc 06 Sections 1.2 and 9 to match doc 07 Part B: "React + Vite (TypeScript)." This eliminates the ambiguity a build agent will otherwise have to resolve.

---

### WARN-05 — Daily Quest Dust Values: Doc 00 Range vs. Doc 04 Exact Values

**Source audits:** systems-v2 (WARN-04)
**Affected docs:** `00-game-design-master.md` (protected), `04-progression-economy.md`

Doc 00 Section 6 states daily quest dust as "25–50." Doc 04 Section 2.1 specifies: Easy = 20 Dust, Medium = 30 Dust, Hard = 45 Dust. The Easy value (20) is below doc 00's range minimum (25). Doc 00 is protected and cannot be edited.

**Implementation instruction:** Use doc 04's exact values (20/30/45). Doc 04 is the canonical source for quest dust amounts and explicitly supersedes doc 00's approximate range.

---

### WARN-06 — Subscription Lapse Grace Period: 7 Days Not Defined

**Source audits:** systems-v2 (WARN-11), prd-v2 (VAGUE-07)
**Affected docs:** `10-prd.md` (P1-007), `09-monetization-details.md`

`10-prd.md` P1-007 states "grace period of 7 days on lapse before enforcing card limits" but no doc defines: what happens during grace period, which limits are enforced at day 7, what UI is shown, or how modifier selection and deck slots revert.

**Fix:** Add a "Subscription Lapse and Grace Period" section to `09-monetization-details.md` covering the 7-day grace period behavior in full.

---

### WARN-07 — Evolution Fallback Art Not Fully Specified in Doc 06

**Source audits:** systems-v2 (WARN-07), buildability (YELLOW — evolution polling)
**Affected docs:** `06-technical-architecture.md`

Doc 00 Section 13a specifies fallback art (color shift + particle overlay). Doc 03 Section 6.4 references a fallback. Doc 06 Section 4.4 (Evolution Service) does not specify the library, color shift parameters, or the `art_updated` push mechanism.

**Fix:** Add a fallback spec to doc 06 Section 4.4: (1) `sharp` npm library for server-side color grading; (2) Order fallback = blue-white tint, Chaos fallback = red-purple tint; (3) stored to R2 with `_fallback` suffix; (4) when real art arrives, push via Supabase Realtime `collection:{player_id}` with event type `art_updated`.

---

### WARN-08 — Missing Seasons and Battle Pass Tables in DB Schema

**Source audits:** player-journey (Step 12, MISSING BACKEND)
**Affected docs:** `06-technical-architecture.md`

`09-monetization-details.md` references a `seasons` table (for determining which season a battle pass purchase applies to) and `04-progression-economy.md` specifies season-end reward distribution. Neither a `seasons` table nor a `battle_pass_progress` table is defined in `06-technical-architecture.md` Section 3.1 (DB schema). Season-end reward distribution and rank reset Edge Functions are also absent.

**Fix:** Add `seasons` and `battle_pass_progress` table schemas to doc 06 Section 3.1. Add a season-end Edge Function or Railway cron job spec.

---

### WARN-09 — Base Card Art Resolution Ambiguity: 768x1024 vs. 1024x1024

**Source audits:** systems-v2 (WARN-09)
**Affected docs:** `05-content-pipeline.md`, `03-prompt-templates.md`

Doc 05 Section 1b and doc 03 both use `image_size: "portrait_4_3"` (768x1024) for base card templates. Doc 00 Section 13a implies 1024x1024 (square, HD) for base art. This is a cost and quality tradeoff that needs an explicit decision.

**Fix:** Clarify in doc 05 Section 1b whether base batch art uses `"square_hd"` (1024x1024) or `"portrait_4_3"` (768x1024). If square, update the cost estimate in doc 05 Section 13c. The current inconsistency will cause Claude Code to pick arbitrarily.

---

### WARN-10 — Onboarding Starter Bonus Not Specified in Protected Doc 00

**Source audits:** systems-v2 (WARN-10)
**Affected docs:** `00-game-design-master.md` (protected), `04-progression-economy.md`, `10-prd.md`

Doc 00 Section 3 says "a small amount of Chaos Dust" and "enough shards to evolve 2–3 cards." Docs 04 and 10 specify exactly: 200 Dust + 3 Uncommon Shards + 1 Rare Shard + 1 Legendary Shard. A build agent reading doc 00 for onboarding will not see these values.

**Implementation instruction:** Use doc 04 and doc 10 values (200 Dust, 3 Uncommon + 1 Rare + 1 Legendary Shard) as canonical. Doc 00 is protected and cannot be updated.

---

### WARN-11 — Instability Formula Missing Per-Creature Floor

**Source audits:** prd-v2 (CONTRADICTION-04)
**Affected docs:** `10-prd.md`

`10-prd.md` Section 1.5 summarizes the instability formula but omits the per-creature floor of 0. `01-battle-mechanics.md` specifies `creature_instability` has a floor of 0 before being summed. Without this floor, a negative modifier adjustment on a creature with low base instability would produce a negative sum, yielding an incorrect (too-low) player instability value.

**Fix:** Update `10-prd.md` Section 1.5 formula to: `player_instability = avatar_modifier + sum(max(0, creature_base_instability + evolution_changes + modifier_adjustments)), clamped 1-20`.

---

### WARN-12 — Admin Dashboard Has No REQ-XXX Requirements in PRD

**Source audits:** prd-v2 (TWOAPPS-01)
**Affected docs:** `10-prd.md`

P1-011 describes the Admin Dashboard as a single feature bullet. Every other P0/P1 feature has detailed REQ-XXX acceptance criteria. The Admin Dashboard has none. Build agents cannot implement it without auth mechanism, endpoint list, review gallery interaction model, economy config field list, or player lookup scope.

**Fix:** Add a Section 4.13 (Admin Dashboard Requirements) to `10-prd.md` with a minimum of 8–10 REQ-XXX entries covering: admin auth, economy config editor, batch generation trigger, review gallery (approve/reject), player lookup, match monitor, PostHog embed.

---

### WARN-13 — Ranked Ladder REQ-XXX Requirements Missing from PRD

**Source audits:** prd-v2 (MISSING-01)
**Affected docs:** `10-prd.md`

P1-002 and US-008 reference the rank ladder but no REQ-XXX requirements cover: rank points gain/loss formula, rank floor enforcement, season reset algorithm, or end-of-season reward distribution trigger.

**Fix:** Add REQ-XXX requirements in `10-prd.md` Section 4.5 or a new Section 4.11 covering the four items above, sourced from `04-progression-economy.md` Section 5.2.

---

## INFO Issues

---

### INFO-01 — Doc 00 Launch Card Count Uses Old Range

**Source audits:** numbers-v2 (15e)
**Affected docs:** `00-game-design-master.md` (protected, cannot edit)

Doc 00 Section 3 states "~270–375 total cards." The finalized target is 367 across 8 batches (doc 05 is canonical). No action possible — doc 00 is protected. **Implementation must use doc 05's 367 figure.**

---

### INFO-02 — Doc 00 Monthly Card Bonus Values Not Confirmed Downstream

**Source audits:** numbers-v2 (15f)
**Affected docs:** `00-game-design-master.md` (protected)

Doc 00 Section 7 lists "+3 Commons/mo" (Mid) and "+5 Commons/mo" (High) as subscription benefits. These values do not appear in docs 04, 09, or 10. Needs confirmation during implementation — either add these values to doc 04/09 or remove them from the subscription benefit list at build time.

---

### INFO-03 — Doc 03 Retry Backoff Description Incomplete

**Source audits:** systems-v2 (INFO-03)
**Affected docs:** `03-prompt-templates.md`

Section 1.2 inline description says "2s, 4s, 8s, retry" but Section 6.2 implementation shows 2s, 4s, 8s, 16s over 4 retries capped at 32s. The inline description is incomplete. Low risk since the implementation in Section 6.2 is authoritative, but a build agent may implement Section 1.2's simplified version.

**Fix:** Update Section 1.2 to: "HTTP 429: exponential backoff — 2s, 4s, 8s, 16s delays, max 4 retries, cap 32s. See Section 6.2."

---

### INFO-04 — Doc 00 Architecture Table Says "Node.js or Python"

**Source audits:** systems-v2 (INFO-04)
**Affected docs:** `00-game-design-master.md` (protected, cannot edit)

Doc 00 Section 13 infrastructure table shows "Backend | Node.js or Python + AI API layer." All other docs specify Node.js/TypeScript exclusively. Protected file — cannot change. **Implementation uses Node.js/TypeScript only per all downstream docs.**

---

### INFO-05 — No Consolidated PostHog Event Taxonomy

**Source audits:** player-journey (Owner Step 5)
**Affected docs:** Multiple

PostHog events are scattered across docs (e.g., `evolution_flux_timeout` in doc 07). No single reference lists all events. Owner cannot set up dashboards or verify analytics coverage without this list.

**Fix:** Add a PostHog event taxonomy table to doc 06 or doc 04 listing every event name, trigger condition, and key properties.

---

## Buildability RED Items

These are not doc errors — they are implementation risk assessments. See `REVIEW-buildability.md` for full detail and suggested mitigations for each.

| ID | Feature | Primary Risk |
|---|---|---|
| BUILD-RED-01 | Authoritative game server — full turn engine | `resolveEffect()` dispatcher not specified; combat keyword ordering bugs will be game-breaking; no unit test scaffold. **Recommendation: phase build — MVP with no keywords first, add one keyword at a time.** |
| BUILD-RED-02 | Real-time match synchronization | No sequence numbers on broadcast messages; server-side reconnect handler unimplemented; Railway horizontal scaling breaks in-memory match state. **Recommendation: add `seq` field to all broadcasts; specify `handleReconnect()` server function; pin single Railway instance for MVP.** |
| BUILD-RED-03 | AVAudioEngine multi-stem synchronized battle music | Synchronized multi-stem looping requires advanced audio session management Claude Code will not produce correctly. **Recommendation: replace with two overlapping `AVAudioPlayer` instances and `.volume` crossfade — 80% of the effect at 20% of the complexity.** |
| BUILD-RED-04 | Blocker assignment + Taunt two-part enforcement | Six-way client/server/cross-client interaction; Flying + Taunt exception highly likely to be implemented incorrectly. **Recommendation: defer Taunt to v1.1 post-launch; ship with 6 keywords (exclude Taunt).** |
| BUILD-RED-05 | Mid-match offline recovery with timer sync | Timer state reconciliation on reconnect underspecified; Railway SIGTERM handling not implemented; simultaneous disconnect produces phantom auto-actions. **Recommendation: specify 60-second reconnect window; add `SIGTERM` handler to force-end active matches before shutdown.** |

---

## Missing Screen Items (Player Journey)

These represent missing specs in `07-ui-ux-specs.md` (and some in `06-technical-architecture.md`) that require new content. See `REVIEW-player-journey.md` for full detail and recommended spec content for each.

| ID | Screen / Element | Severity | Location Needed |
|---|---|---|---|
| SCREEN-01 | `HomeView` — dashboard, play entry, daily quest display | **Critical** | `07-ui-ux-specs.md` new section |
| SCREEN-02 | `ModeSelectionView` — Ranked/Casual/Practice selector | High | `07-ui-ux-specs.md` new section |
| SCREEN-03 | `MatchmakingView` — queue timer, opponent reveal, match found | High | `07-ui-ux-specs.md` new section |
| SCREEN-04 | `ProfileView` — rank badge, stats, showcase cards, achievements | High | `07-ui-ux-specs.md` new section |
| SCREEN-05 | Ranked Ladder / Rank Progress screen | High | `07-ui-ux-specs.md` new section |
| SCREEN-06 | Battle Pass screen — tier track, free/premium rows | High | `07-ui-ux-specs.md` new section |
| SCREEN-07 | Season End / Season Transition screen | High | `07-ui-ux-specs.md` new section |
| SCREEN-08 | Season Management admin section (create season, set dates, configure battle pass rewards) | High | `07-ui-ux-specs.md` Part B (admin) |
| SCREEN-09 | Avatar unlock/browse screen | Medium | `07-ui-ux-specs.md` new section |
| SCREEN-10 | Cosmetics shop subsection (card backs, board skins, frames) | Medium | `07-ui-ux-specs.md` Section 6 extension |
| SCREEN-11 | Apple Sign-In prompt screen before onboarding Step 1 | Medium | `07-ui-ux-specs.md` Section 7 |
| SCREEN-12 | Player-facing bug/player report screen | Medium | `07-ui-ux-specs.md` new section |
| SCREEN-13 | Admin-side player reports review queue | Medium | `07-ui-ux-specs.md` Part B (admin) |
| SCREEN-14 | App Store assets (description copy, keywords, age rating, privacy labels) | Medium | `05-content-pipeline.md` Section 5 |

Additionally, three **undefined transitions** need spec:
- `PostMatchResultsView` replacing `.fullScreenCover` `BattleView` and returning to `TabView`
- Quest reward claim flow (where in the UI does the player tap "claim"?)
- Rank change notification component in `PostMatchResultsView`

---

## Passing Checks (No Action Required)

All 13 canonical game values were verified across all docs. These all pass:

- Evolution energy thresholds: 15/30/50/75
- Energy earn rates: 2/win, 1/loss, all 20 deck cards simultaneously
- All 7 keywords present and consistent
- All 3 factions with correct exclusive mechanics
- Deck size: exactly 20 cards
- CM cost fixed forever through evolution
- Instability formula structure (per-creature floor gap noted in WARN-11)
- Shard costs: 30/60/120/240 Dust
- Subscription prices: $6.99/$12.99 (doc 09 is canonical; doc 00 uses old ranges)
- Budget: $233 total, within $300 cap
- Launch cards: 367 across 8 batches (doc 05 canonical; doc 00 uses old range)
- Max copies: 2 per card, 2 Legendaries max 1 copy each
- Tech stack compliance: no banned terms in any main document body

---

## Fix Priority Order

1. **CRIT-01** — Mid-tier deck slots (docs 06, 10) — fix before any backend or StoreKit build
2. **CRIT-02** — Modifier count 240 vs. 144 in PRD Gap 4 — fix before content pipeline build
3. **CRIT-05** — FAL key name — fix before first generation run
4. **CRIT-03 / CRIT-04** — Void Lens / Probability Anchor — fix before content pipeline targets are finalized
5. **WARN-02** — Faction stabilizers per-faction vs. universal — fix before content pipeline runs
6. **WARN-03** — PRD broken section references — fix before build agents read PRD
7. **SCREEN-01** — `HomeView` spec — needed before iOS build begins
8. **SCREEN-02 / SCREEN-03** — Mode selection + matchmaking screens — needed before matchmaking build
9. **BUILD-RED-01** — Game server phasing plan — decide before game server build begins
10. **BUILD-RED-04** — Taunt deferral decision — fix before keyword implementation

---

*Merged review complete. Individual audit files contain full evidence, line numbers, and extended analysis.*

## Revision Log

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-02-16 | Claude Code (merge agent) | Initial merged review from 5 audit sources |

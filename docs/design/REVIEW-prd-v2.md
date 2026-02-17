# PRD Audit Report — REVIEW-prd-v2.md

**Audited Document:** `docs/design/10-prd.md` (v3.0, dated 2026-02-16)
**Auditor:** PRD Audit Agent
**Audit Date:** 2026-02-16
**Audit Method:** Line-by-line comparison of all REQ-XXX requirements against `00-game-design-master.md`, `01-battle-mechanics.md`, `02-card-data-model.md`, and `CLAUDE.md`

---

## Summary

The PRD v3.0 is in substantially good shape for a vibe-coding implementation. The infrastructure stack, core battle system, evolution system, and most functional requirements are correctly specified and code-ready. However, the audit found **1 confirmed contradiction against a protected file**, **3 unresolved internal inconsistencies**, **2 missing feature areas**, **several vagueness issues** that will leave Claude Code guessing, and **1 spec gap** in the data model integration.

**Overall Assessment:** The PRD is not yet clear to build from without resolving the issues below. The deck-slot contradiction with a protected file is a blocking issue. The missing season/ranked-ladder requirements and the timer-rule discrepancy are high-priority gaps that will produce incorrect behavior if built without resolution.

Total issues found: **19**

---

## Section 1: Contradictions with Core Design Docs

### CONTRADICTION-01 (BLOCKING) — Mid-Tier Deck Slots

**Severity:** Critical — Contradicts a protected file

**Location in PRD:**
- US-014 (line 151): "Mid: 100 cards/faction, 5 deck slots."
- REQ-036 (line 296): "Mid: 5 slots."
- Section 14 Gap 2 (line 1039–1043): PRD resolves this as 5 slots, citing `06-technical-architecture.md`.

**What the protected files say:**
- `00-game-design-master.md` Section 8 (lines 1092–1094): "Mid tier: 6 deck slots."
- `02-card-data-model.md` Player entity (line 623): `max_deck_slots: int // 3 (free), 6 (mid), 10 (high)`

**What non-protected downstream docs say:**
- `09-monetization-details.md` (line 561): "6 deck slots"
- `09-monetization-details.md` paywall nudge (line 787): "Upgrade to Mid Tier for 6 deck slots"
- `06-technical-architecture.md` (lines 721, 751): `MID ? 5 : 3` — this downstream doc uses 5, which conflicts with `02-card-data-model.md`

**Why this matters:** Per CLAUDE.md rules, downstream docs (03-10) must conform to protected files. The protected file `02-card-data-model.md` explicitly states Mid = 6 deck slots. The PRD's resolution (accepting `06-technical-architecture.md`'s value of 5) is incorrect. Claude Code will build Mid tier with 5 deck slots, contradicting `02-card-data-model.md` and `00-game-design-master.md`.

**Required fix:** Change US-014 and REQ-036 to "Mid: 6 deck slots." Change Gap 2 resolution to "Mid = 6 deck slots per protected file." Note `06-technical-architecture.md` must also be corrected to use 6.

---

### CONTRADICTION-02 — Turn Timer Rule for Phases 5–8

**Severity:** High — Behavioral contradiction

**Location in PRD:** REQ-005 and REQ-006 state: "Phases 5-6 are decision phases with a shared timer. Phase 7 is a decision phase for the defender with its own timer." REQ-007 says "The defending player shall have 60 seconds for blocker assignment (phase 7)."

**What `01-battle-mechanics.md` says (Section 3, Timer Rules):**
"60 seconds for all decision phases combined (Phases 5–6 for active player, Phase 7 for defending player)."

The PRD's REQ-005 describes phases 5 and 6 as sharing one timer, with phase 8 resolving automatically. This matches `01-battle-mechanics.md`. However, REQ-006 also states "Timer starts at Main Phase" — this is correct.

**The actual contradiction:** `01-battle-mechanics.md` Phase 7 states "Control passes to the defending player. Their 60-second timer starts for this phase." This matches the PRD (REQ-007). The PRD's description in REQ-005 says "Phases 5-6 are decision phases with a shared timer" but REQ-006 says the active player has 60 seconds total for those phases. This is internally consistent. No actual contradiction found upon closer reading — this item is RESOLVED upon closer inspection.

**Status:** Cleared — no contradiction found.

---

### CONTRADICTION-03 — EvolutionRecord `modifier_rejected_id` Is Singular

**Severity:** Medium — Data model gap at higher subscription tiers

**Location in PRD:** REQ-026 states modifier options count as "Free=2, Mid=3, Top=4." REQ-031 says "The player shall select from 2-3 AI-generated name candidates."

**What `02-card-data-model.md` says:** The EvolutionRecord (Section 3, line 168) has only one field `modifier_rejected_id`, not an array. This field stores "the other option (not stored as instance)." This works for Free tier (2 options = 1 chosen + 1 rejected). But for Mid tier (3 options) and Top tier (4 options), there are 2 or 3 rejected modifier options, and the schema can only store one.

**Required fix:** Either:
1. The PRD must add a note that `modifier_rejected_id` should be changed to `modifier_rejected_ids: string[]` in the data model, flagging that `02-card-data-model.md` needs a targeted fix, OR
2. The PRD must note that only one rejected option is stored per `02-card-data-model.md` as designed, and the extra options are discarded without logging.

The PRD does not acknowledge this gap. Claude Code will build whatever schema is in `02-card-data-model.md` (storing only one rejected ID), which is technically fine but loses analytics value for mid/top tier evolution choices.

**Required fix:** Add a note in Section 4.2 (Evolution System requirements) explicitly stating that only the last-rejected modifier is stored per `02-card-data-model.md` schema, OR flag a schema amendment.

---

### CONTRADICTION-04 — Instability Formula Omits Creature Floor in Description

**Severity:** Low — Documentation inconsistency that could cause wrong implementation

**Location in PRD:** Section 1.5 (Key Design Decisions), line 77: "Instability formula: avatar modifier + sum(creature base_instability + evolution changes + modifier adjustments), clamped 1-20"

**What `01-battle-mechanics.md` says (Section 2):**
```
creature_instability = template.base_instability
                     + sum(evolution_step_instability_change)
                     + sum(modifier_instability_adjustments)
                     // floor of 0 — creature instability cannot go negative
player_instability = avatar_instability_modifier + sum(creature_instability)
// clamped 1-20
```

The PRD's summary formula omits the per-creature floor of 0. The clamping note says "clamped 1-20" which applies to `player_instability`, but the formula as written in 1.5 implies individual creature instability can go negative before summing. A Claude Code implementation built only from Section 1.5 would produce incorrect results for cards with negative modifier instability adjustments.

**Required fix:** Update the instability formula in Section 1.5 to include the creature-level floor: `player_instability = avatar_modifier + sum(max(0, creature_base_instability + evolution_changes + modifier_adjustments)), clamped 1-20`.

---

## Section 2: Requirements That Add Things Not in the Design

### ADDITION-01 — `turn_timer_seconds: 90` Extended Casual Timer

**Severity:** Low — Minor addition not specified in core docs

**Location in PRD:** REQ-010 (Settings) mentions "timer extension for casual." The GameState spec in `02-card-data-model.md` (line 744) has `turn_timer_seconds: int // 60 (standard) or 90 (extended casual)`. The PRD references this at P1-010.

**Core doc status:** `01-battle-mechanics.md` Section 3 (Timer Rules) specifies only 60 seconds with no mention of an extended casual timer. The 90-second extended casual timer exists in `02-card-data-model.md` but not in `01-battle-mechanics.md`.

**Assessment:** This is a small addition not contradicted by the protected file — `01-battle-mechanics.md` does not prohibit it. It is present in `02-card-data-model.md`. However, the PRD provides no acceptance criteria for when it activates (player setting toggle? Automatically for all casual matches? Does the server enforce it or just the client?). This is a vagueness issue addressed in Section 5.

---

### ADDITION-02 — Battle Pass (P2-002)

**Severity:** Low — Post-launch feature, correctly labeled P2

**Location in PRD:** P2-002 describes a Battle Pass with free track (30 tiers) and premium track (50 tiers, $9.99/season). This is also mentioned in `09-monetization-details.md`.

**Core doc status:** `00-game-design-master.md` does not define a Battle Pass in its monetization section. `CLAUDE.md` does not prohibit post-launch features, and P2 classification is appropriate. The Battle Pass would use StoreKit 2 IAP which is correct.

**Assessment:** No contradiction — properly labeled P2 (post-launch). No issue.

---

### ADDITION-03 — "Hard Cap: 50 evolutions per user per day regardless of tier" (REQ-138)

**Severity:** Low — Reasonable safeguard, but undocumented in core docs

**Location in PRD:** REQ-138 states "Hard cap: 50 per user per day regardless of tier." The per-tier caps (5/15/30) are defined in several docs, but the hard cap of 50 appears only in the PRD.

**Assessment:** Not contradicted by any protected file. Prudent cost management. No fix needed, but this should be mentioned in `economy_config` as a tunable parameter.

---

## Section 3: Design Features Missing from the PRD

### MISSING-01 (HIGH PRIORITY) — Ranked Ladder Requirements Are Incomplete

**Severity:** High — Critical P1 feature underspecified

**Location in PRD:** P1-002 and US-008 mention the rank system and reference `04-progression-economy.md` Section 5. However, there are no REQ-XXX requirements in Section 4 covering:
- The rank points formula (+25/-20 same tier, full formula for different tiers)
- Rank floor enforcement (Silver 3, Gold 3, Platinum 3, Diamond 3)
- Season reward distribution algorithm
- Milestone reward triggers

REQ-042 through REQ-045 cover matchmaking but not the rank ladder itself. There is no requirement for rank gain/loss calculation logic, no requirement for enforcing rank floors, and no acceptance criteria for what happens when a player crosses a rank floor boundary.

**Required fix:** Add REQ-XXX requirements in Section 4.5 or a new Section 4.11 covering:
1. Rank points gain/loss per match with formula from `04-progression-economy.md`
2. Rank floor behavior (cannot drop below floor on loss)
3. Season reset algorithm (drop 5 divisions from current rank)
4. End-of-season reward distribution trigger

---

### MISSING-02 (MEDIUM PRIORITY) — Achievement System Has No Functional Requirements

**Severity:** Medium — P1-009 references achievements but no REQ-XXX spec them

**Location in PRD:** P1-009 mentions "Achievement definitions, progress tracking per player, one-time rewards, achievement display on profile" and references `02-card-data-model.md` Section 17. However, no REQ-XXX requirements specify:
- What triggers achievement progress evaluation (after match? After evolution? Real-time?)
- How one-time rewards are granted (automatically or via claim button?)
- What happens if a player already qualifies for an achievement when it is added
- Which Edge Function handles achievement evaluation

**Required fix:** Add at least 3 REQ-XXX requirements under a new Section 4.12 covering: achievement progress update trigger, reward grant mechanism, and the API endpoint (likely a POST to `/achievements/{id}/claim` or automatic grant after evaluation).

---

### MISSING-03 (LOW PRIORITY) — Post-Match Screen Requirements Incomplete

**Severity:** Low — P1-006 lists UI elements but lacks server-side requirements

**Location in PRD:** P1-006 references the post-match screen UI. There are no REQ-XXX requirements covering:
- The server-side algorithm for computing per-card chaos energy grants at match end
- Whether evolution-ready detection happens server-side or client-side
- Quest progress update timing (at match end or after post-match screen?)

**Required fix:** Add acceptance criteria to REQ-023 (Game End) specifying when and where per-card energy is computed and stored, and when quest progress is updated.

---

### MISSING-04 (LOW PRIORITY) — Faction Mastery System Has No Requirements

**Severity:** Low — Present in data model but absent from PRD

**Location:** `02-card-data-model.md` Player entity (line 654) defines `FactionMastery` with `mastery_level`, `mastery_xp`, `games_played`. The Avatar entity defines `UnlockCondition.FACTION_MASTERY(level)`. REQ-057 states each faction has 1 unlockable avatar but does not specify what triggers mastery level progression.

**Required fix:** Add a requirement defining: what grants faction mastery XP (games played with that faction), when mastery level increases, and what mastery level is required to unlock the second avatar per faction.

---

## Section 4: Vagueness Issues

### VAGUE-01 — REQ-005 Phase Timer Ambiguity

**Requirement:** "Phases 5-6 are decision phases with a shared timer."

**Problem:** "Shared timer" is ambiguous. Does the 60-second timer start at Phase 5 and run through Phase 6 without reset? Or does Phase 5 and Phase 6 each get 60 seconds? The intent (per `01-battle-mechanics.md`) is that the entire active-player decision window is one 60-second period covering both Phase 5 and Phase 6.

**Required fix:** Change to: "The active player has one combined 60-second timer that starts at the beginning of Phase 5 (Main Phase) and continues through Phase 6 (Declare Attackers). The timer is not reset between phases. Transitioning from Phase 5 to Phase 6 by tapping 'Attack' does not restart the timer."

---

### VAGUE-02 — REQ-011 "Auto-select leftmost valid target" Not Defined for All Event Types

**Requirement:** "On timeout, auto-select leftmost valid target."

**Problem:** "Leftmost valid target" is undefined for events that target the player's board vs. the opponent's board, and for events that allow targeting any creature. Which board's "leftmost" takes precedence? Slot 1 of which player?

**Required fix:** Specify "leftmost valid target on the active player's board (slot 1 → slot 5). If no valid target on active player's board, leftmost on opponent's board."

---

### VAGUE-03 — REQ-043 Matchmaking Poll Frequency vs. Latency Target

**Requirement:** "A Supabase Edge Function polls the `matchmaking_queue` table every 2 seconds."

**Problem:** REQ-072 targets "< 15s at launch" for matchmaking queue time. With a 2-second polling cycle and the matching algorithm potentially requiring multiple cycles to find a pair, the actual wait time could exceed 15 seconds even at good player counts. The requirement does not specify whether this is a pg_cron scheduled function or an event-driven trigger.

**Required fix:** Specify whether the polling is via `pg_cron` (`*/2 * * * *` is minute-granular — insufficient) or a Supabase Edge Function called via a Realtime trigger or dedicated Railway job. If it is intended to be pg_cron, acknowledge that pg_cron minimum resolution is 1 minute and describe the actual mechanism.

---

### VAGUE-04 — REQ-051 "Evolution Ceremony — 9-Step Ceremony" Missing Server Interaction Spec

**Requirement:** The evolution flow involves 9 steps. The requirement lists them in order but does not specify at which step the client is blocked waiting for server responses.

**Problem:** Claude Code needs to know: Does the Art Reveal step (step 4) poll the `/evolution/{id}/status` endpoint? What happens if the player closes the app mid-ceremony? Can a ceremony be resumed?

**Required fix:** Add to REQ-051: "Steps 1-3 complete immediately using data returned from `/evolution/start`. Step 4 (Art Reveal) polls `/evolution/{id}/status` every 500ms (per REQ-110) until `status: COMPLETE` or a 30-second timeout. Steps 5-9 complete immediately using data from the completed status response. If the player closes the app during steps 1-8 before step 9 (Confirm), the evolution is not committed — the card and shard state remain unchanged. `/evolution/{id}/confirm` (REQ-111) must be called to commit."

---

### VAGUE-05 — REQ-082 Rate Limiting — "5/15/30 per day for Free/Mid/Top" vs. REQ-138 "5/15/30 per day + hard cap 50"

**Requirement:** REQ-082 says "Evolution start: tier-based (5/15/30 per day for Free/Mid/Top, checked via `generation_jobs` count)." REQ-138 also states the same values plus adds a hard cap of 50.

**Problem:** Two requirements govern the same rate limit from different angles. They agree on the per-tier values but REQ-138 adds an independent hard cap. The implementation question is: does the hard cap of 50 override a Top-tier player's 30/day limit? (50 > 30 so hard cap never triggers for Top tier.) Or does the hard cap apply to some other scenario?

**Required fix:** Clarify in REQ-138 that the hard cap of 50 is a safeguard that can only trigger if tier caps are bypassed (e.g., multiple devices, race conditions). The effective per-user daily limit is min(tier_cap, 50). For Top tier: min(30, 50) = 30. The hard cap is only a backstop.

---

### VAGUE-06 — P1-001 Quest System References Section 4 but REQ-XXX for Quest Generation Not Present

**Location:** P1-001 and REQ-106/REQ-107 cover quest API endpoints, but no REQ specifies:
- How the server generates 3 daily quests at 00:00 UTC (which Edge Function, using which template pool)
- How weekly quests are generated
- What prevents two quests with conflicting objectives from being assigned together
- Where quest templates are stored (presumably `quest_templates` table, but this entity is not in Section 6.1)

**Required fix:** Add a `QuestTemplate` entity to Section 6.1. Add a REQ under Section 4 specifying the quest generation algorithm (pg_cron at 00:00 UTC, sampling without replacement from daily pool of 20 templates, weighted by difficulty to match `04-progression-economy.md` Section 4 distribution).

---

### VAGUE-07 — REQ-082 Admin Rate Limiting Not Specified

**Requirement:** REQ-082 covers rate limiting for player-facing endpoints but does not specify how Admin Dashboard endpoints are protected.

**Problem:** The Admin Dashboard has access to `POST /economy-config`, player lookup, batch generation triggers. These are on Railway, not Supabase Edge Functions. No rate limiting or authentication spec for admin endpoints appears in the PRD.

**Required fix:** Add to Section 4.11 (Admin Dashboard requirements, currently under P1-011): "Admin Dashboard endpoints on Railway shall be protected by HTTP Basic Auth using `ADMIN_PASSWORD` environment variable. JWT signing with `ADMIN_JWT_SECRET` for session management."

---

## Section 5: Owner Skill Assumptions

### SKILL-01 — REQ-165 Balance Validation Runs `npm run validate-balance`

**Requirement:** "Run as `npm run validate-balance` script in game server project."

**Problem:** This assumes the owner knows to navigate to the game server project directory and run an npm command. Per CLAUDE.md, if a process requires more than 3 clicks or one terminal command from the owner, redesign it.

**Assessment:** The `./deploy.sh` pattern is the right model. The balance validation should be triggerable from the Admin Dashboard (a "Validate Balance" button that calls the Railway game server's validation endpoint) or included as part of `./deploy.sh` pre-flight checks. A raw npm command is not owner-friendly.

**Required fix:** Add to Section 4.11 (Admin Dashboard): "The Admin Dashboard shall expose a 'Run Balance Validation' button that calls the Railway game server endpoint `POST /admin/validate-balance` and displays pass/fail results in the browser." Remove the expectation that the owner runs `npm run validate-balance` directly.

---

### SKILL-02 — Section 12.6 Deploying Updates Assumes Terminal Access

**Location:** Section 12.6 specifies `./deploy.sh` as the single deployment command.

**Assessment:** This is correctly designed per CLAUDE.md. A single terminal command is acceptable. No fix needed.

---

### SKILL-03 — REQ-159 "Xcode Instruments Leaks Profiler" as Owner Validation Tool

**Requirement:** "No memory leaks over 30-minute session measured via Xcode Instruments Leaks profiler."

**Problem:** Running Xcode Instruments requires opening Xcode, attaching the profiler to a running Simulator instance, and interpreting leak reports. This is engineering work, not owner work.

**Assessment:** This requirement is correctly placed as a build-phase QA check that Claude Code runs before considering the feature complete (per CLAUDE.md: "If a build fails or a UI looks wrong, the agent should fix the issue immediately before considering the task complete"). The acceptance criteria is for Claude Code to verify, not the owner. The current wording implies the owner does this validation, which is incorrect.

**Required fix:** Add clarifying language: "Verified by Claude Code during build phase using Xcode Instruments. Owner does not need to run this profiler."

---

## Section 6: Infrastructure Stack Issues

**Overall Assessment:** The PRD infrastructure stack is well-specified and consistent with CLAUDE.md. The following are minor issues only.

### INFRA-01 — Auth: "Apple Sign-In only (no Google -- iOS-only app)" Is Correct

**Location:** Section 1.6, Table row for Auth. This is consistent with CLAUDE.md and iOS-only targeting. No issue.

---

### INFRA-02 — StoreKit 2 References Are Complete and Correct

The PRD consistently references StoreKit 2, `Transaction.currentEntitlements`, `Transaction.updates`, `AppStore.sync()`, and explicitly states "No RevenueCat. No Stripe. No third-party payment SDK." This is consistent with CLAUDE.md. No issue.

---

### INFRA-03 — iOS Only Correctly Enforced

Section 1.3 states: "No Android. No React Native. No Unity. No Expo. No cross-platform framework." REQ-089 states iOS 17+ minimum. This is consistent with CLAUDE.md. No issue.

---

### INFRA-04 — Budget: $300 Cap Correctly Referenced

Section 1.7 and Section 13.2 show a total of ~$233 with $67 buffer, within the $300 cap. Consistent with CLAUDE.md. No issue.

---

### INFRA-05 — Railway for Admin Dashboard Is Correct

Section 1.3: "Admin Dashboard: Separate web application (Node.js + Express + static HTML/JS or React + Vite) deployed on Railway." This is consistent with CLAUDE.md. No issue.

---

## Section 7: Two Applications Separation Issues

**Overall Assessment:** The PRD is good at labeling requirements with "iOS", "Backend", or "Web (Admin)." However there are two issues.

### TWOAPPS-01 — P1-011 Admin Dashboard Requirements Are Insufficient for Build

**Location:** P1-011 lists Admin Dashboard features in a single bullet: "Web app on Railway: economy config editor, batch card generation trigger, generation review/approve/reject gallery, player lookup, match monitor, PostHog analytics embedding."

**Problem:** Every other P0/P1 feature has detailed REQ-XXX requirements with acceptance criteria. The Admin Dashboard — which the owner uses daily — has no REQ-XXX requirements. Claude Code cannot build the Admin Dashboard from a feature list without:
- Which HTTP endpoints the Admin Dashboard exposes vs. consumes
- The admin auth mechanism (Basic Auth with ADMIN_PASSWORD — referenced in Section 13.1 but not as a REQ)
- The review gallery UI interaction model (how does approve/reject work? Is it one card at a time or batch?)
- The economy config editor field list (which `economy_config` keys are editable?)
- Player lookup scope (what data is shown? Can the owner modify player data?)

**Required fix:** Add a Section 4.13 (Admin Dashboard Requirements) with at minimum 8-10 REQ-XXX entries covering: admin auth, economy config editor (field list + save mechanism), batch generation trigger, generation review gallery (approve/reject flow), player lookup (read-only profile view + compensation grant), match monitor, and PostHog embed.

---

### TWOAPPS-02 — Section 7.3 Realtime Events Mix Client and Server Without Separation Label

**Location:** Section 7.3 covers Realtime channel events but the "App" column is not present in this section (unlike Section 3 feature requirements). The Swift client implementation details (Supabase Swift SDK subscription) and the server broadcast implementation (TypeScript on Railway) are described in the same table without clear separation.

**Assessment:** Minor documentation clarity issue — not a functional problem since the events themselves are protocol-level. No fix required, but adding a note clarifying "Client sends via Supabase Swift SDK `channel.broadcast()`; Server broadcasts via Supabase server-side Realtime client (Node.js `@supabase/realtime-js`)" would prevent implementation confusion.

---

## Section 8: Testable Acceptance Criteria

The PRD is generally strong on acceptance criteria specificity. The following are the weak spots:

### CRITERIA-01 — REQ-009 Chaos Roll "Seeded Per Match for Reproducibility" — No Test Specified

**Requirement:** "RNG is seeded per match for reproducibility."

**Problem:** There is no acceptance criteria test for verifying reproducibility. A complete replay with the same seed should produce the same sequence of rolls. This should be tested.

**Required fix:** Add to REQ-009 acceptance criteria: "Two game instances initialized with the same match seed and the same sequence of player actions shall produce identical roll sequences. Verified by a unit test in the game server test suite that replays a recorded match and confirms roll identity."

---

### CRITERIA-02 — REQ-076 "Match State Held In-Memory — On Instance Restart, Active Matches Are Lost"

**Requirement:** "On instance restart, active matches are lost (acceptable at launch scale)."

**Problem:** This is not a testable acceptance criterion — it is a design decision stated as acceptable. There is no test for "match state is lost on Railway restart." The reconnection behavior (REQ-163) covers client reconnection but not instance restart.

**Assessment:** This is fine as a documented trade-off, not a failing acceptance criterion. The PRD correctly documents it. No fix required.

---

### CRITERIA-03 — REQ-055/REQ-056 Faction Mechanic Enforcement Has No Test Spec

**Requirements:** REQ-055 defines faction mechanics, REQ-056 states faction modifiers must reference their exclusive mechanic.

**Problem:** There is no acceptance criteria test for REQ-056. How does the system validate that a faction modifier references its mechanic? Is this a database constraint, a validation script, or only enforced at content pipeline review time?

**Required fix:** Add to REQ-056: "Enforced at Admin Dashboard approval time: the review gallery shall display a warning badge on any faction modifier that does not reference its faction's exclusive mechanic keyword in its `base_effect` or `attuned_effect` description. Automated check run as part of `npm run validate-balance`."

---

### CRITERIA-04 — US-015 Cross-Faction Unlock "Permanently Unlocks That Faction" — No Failure Test

**Requirement:** "Purchasing a card pack from another faction (150 Dust) permanently unlocks that faction."

**Problem:** No acceptance criteria for what happens if the Dust purchase fails mid-transaction (network error, insufficient Dust). The atomicity requirement is in REQ-040 but cross-faction unlock is not explicitly called out as atomic.

**Required fix:** Add to REQ-034: "Cross-faction unlock is atomic with card pack purchase. If Dust deduction succeeds but faction unlock fails, the transaction is rolled back. If faction unlock succeeds but card pack generation fails, the faction remains unlocked (partial success acceptable — player has the faction access and cards will be retried) and Dust is not refunded for the pack."

---

## Revision Log

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-02-16 | PRD Audit Agent | Initial audit of 10-prd.md v3.0 against protected files and CLAUDE.md |

---

## Issue Priority Summary

| ID | Severity | Description | Blocking? |
|---|---|---|---|
| CONTRADICTION-01 | Critical | Mid-tier deck slots = 5 in PRD, = 6 in protected files | YES |
| MISSING-01 | High | Ranked ladder REQ-XXX requirements missing | No |
| TWOAPPS-01 | High | Admin Dashboard has no REQ-XXX requirements | No |
| VAGUE-04 | High | Evolution ceremony server interaction not specified | No |
| MISSING-02 | Medium | Achievement system has no functional requirements | No |
| CONTRADICTION-03 | Medium | `modifier_rejected_id` singular vs. multi-option tiers | No |
| CONTRADICTION-04 | Medium | Instability formula missing per-creature floor | No |
| VAGUE-01 | Medium | Turn timer "shared" ambiguity | No |
| VAGUE-06 | Medium | Quest generation algorithm not specified | No |
| SKILL-01 | Medium | Balance validation requires owner terminal command | No |
| SKILL-03 | Medium | Xcode Instruments implies owner validation | No |
| VAGUE-02 | Low | "Leftmost valid target" undefined for event targeting | No |
| VAGUE-03 | Low | Matchmaking poll mechanism unclear (pg_cron limitation) | No |
| VAGUE-05 | Low | Rate limit hard cap scope ambiguous | No |
| VAGUE-07 | Low | Admin endpoint authentication not specified | No |
| MISSING-03 | Low | Post-match per-card energy grant not server-specified | No |
| MISSING-04 | Low | Faction mastery progression not specified | No |
| CRITERIA-01 | Low | RNG reproducibility has no defined test | No |
| CRITERIA-03 | Low | Faction mechanic enforcement has no test spec | No |

# Chaos Creatures — Systems Audit v2
**Auditor:** Systems Audit Agent
**Date:** 2026-02-16
**Scope:** All docs in `docs/design/` (00–10 plus supporting files)
**Method:** Full doc-by-doc read, cross-reference verification, banned-term grep, flow tracing

---

## Audit Summary

| Severity | Count |
|---|---|
| CRITICAL | 8 |
| WARNING | 11 |
| INFO | 5 |
| **Total Issues** | **24** |

---

## CRITICAL Issues

---

### CRIT-01: Mid-Tier Deck Slots Contradiction Across 5 Documents

**Source docs:** `00-game-design-master.md`, `04-progression-economy.md`, `06-technical-architecture.md`, `09-monetization-details.md`, `10-prd.md`

**Description:** Mid-tier deck slot count is stated inconsistently as either 5 or 6 across the project.

| Document | Mid Tier Deck Slots |
|---|---|
| `00-game-design-master.md` Section 7 table | 6 |
| `00-game-design-master.md` (inline text, line ~1093) | 6 |
| `04-progression-economy.md` (line ~996) | 6 |
| `09-monetization-details.md` (line ~561, ~787) | 6 |
| `_prd-input-summary.md` | 5 |
| `06-technical-architecture.md` webhook handler (both apple-webhook instances) | 5 |
| `10-prd.md` US-014 | 5 |
| `10-prd.md` (known discrepancy note, line ~1041) | Explicitly flags 5 vs 6 conflict |

The conflict is noted in `10-prd.md` line ~1041 itself, but no resolution was applied. The protected files (00) say 6. The webhook code in 06 hard-codes 5. The code will implement the wrong value at build time.

**Suggested fix:** Declare 6 as the authoritative Mid-tier deck slot count (matching the protected master doc `00-game-design-master.md` Section 7). Update `06-technical-architecture.md` webhook handler (two occurrences) from `MID ? 5 : 3` to `MID ? 6 : 3`. Update `10-prd.md` US-014 and all references in `_prd-input-summary.md`.

---

### CRIT-02: Void Lens — Stabilizer vs. Spell Contradiction in Doc 01 (Persists from Previous Reviews)

**Source docs:** `01-battle-mechanics.md`

**Description:** This issue was flagged in `REVIEW.md` (CRIT-6) and `REVIEW-systems.md` (Section 2.3) and `REVIEW-numbers.md` (MISMATCH-11) but has NOT been resolved in the actual documents.

- `01-battle-mechanics.md` **Section 11** (line ~1133): Void Lens is a board stabilizer with CM cost 3, HP 2, continuous effect while on field. Count is stated as "5 board stabilizers + 2 spells = 7 cards."
- `01-battle-mechanics.md` **Section 12** (line ~1196): Void Lens is listed as a **Spell** with `N/A (spell)` for instability contribution and a different effect description ("Spell: choose whether this turn's event is Order or Chaos **after** seeing the roll").
- `00-game-design-master.md` Section 11: Void Lens is a board stabilizer with HP 2.

Three previous review documents have identified this and it remains unresolved. Implementing from this contradiction will produce inconsistent behavior.

**Suggested fix:** Remove Void Lens from the Section 12 spell list in `01-battle-mechanics.md`. Keep the Section 11 stabilizer entry. The Section 12 table should list Void Lens as a STABILIZER with instability contribution `0`. Since doc 01 is a protected file, the fix must be applied as a targeted correction under the exception process (factual error correction).

---

### CRIT-03: Probability Anchor — Undocumented Card in Section 12 (Persists from Previous Reviews)

**Source docs:** `01-battle-mechanics.md`

**Description:** Also flagged in REVIEW.md (CRIT-7), REVIEW-numbers.md (MISMATCH-12), and REVIEW-systems.md (Section 2.5) but NOT resolved.

- `01-battle-mechanics.md` **Section 12** (line ~1197): Lists "Probability Anchor" (CM 3, instability = 0, "While on field: your instability is treated as 10 (always 50/50)").
- `01-battle-mechanics.md` **Section 11**: No mention of Probability Anchor. Section 11 explicitly states "5 board stabilizers + 2 spells = 7 cards."
- `00-game-design-master.md` Section 11: No mention of Probability Anchor.

Probability Anchor either does or does not exist. The ambiguity means the content pipeline (doc 05) and card generation infrastructure will not know whether to create it.

**Suggested fix:** Make a decision: (A) Add Probability Anchor to Section 11 in docs 00 and 01 (update count from 7 to 8) and add it to doc 05 content targets, OR (B) Remove it from doc 01 Section 12. Apply the fix to resolve the contradiction. Given docs 00 and 01 are protected, if adding it, apply as factual completion. If removing from Section 12, that is a correction to a non-protected section.

---

### CRIT-04: FAL API Key Name Inconsistency — `FAL_KEY` vs `FAL_API_KEY`

**Source docs:** `03-prompt-templates.md`, `05-content-pipeline.md`, `06-technical-architecture.md`, `10-prd.md`

**Description:** The fal.ai API key environment variable name is inconsistent across documents.

| Document | Variable Name Used |
|---|---|
| `06-technical-architecture.md` (`.env` template, Section 1.3) | `FAL_KEY` |
| `06-technical-architecture.md` (Edge Function code, Section 4.7) | `FAL_KEY` (via `Deno.env.get('FAL_KEY')`) |
| `06-technical-architecture.md` (Docker Compose) | `FAL_KEY` |
| `10-prd.md` (backend `.env` list, Section 13) | `FAL_KEY` |
| `03-prompt-templates.md` (Section 1.2) | `FAL_API_KEY` |
| `03-prompt-templates.md` (code examples) | `process.env.FAL_API_KEY` |
| `05-content-pipeline.md` (`.env` template) | `FAL_API_KEY` |
| `05-content-pipeline.md` (code examples) | `process.env.FAL_API_KEY` |

If Claude Code implements docs 03 and 05 with `FAL_API_KEY` and doc 06 with `FAL_KEY`, the batch pipeline and the edge functions will look for different environment variables. The generation pipeline will fail with authentication errors.

**Suggested fix:** Standardize on `FAL_KEY` (matching doc 06, which is the authoritative infrastructure spec). Update all occurrences of `FAL_API_KEY` in docs 03 and 05 to `FAL_KEY`.

---

### CRIT-05: PRD P0-005 References Wrong Section of Doc 06 for Matchmaking

**Source docs:** `10-prd.md`, `06-technical-architecture.md`

**Description:** `10-prd.md` line ~171 states:

> `P0-005 | Matchmaking | ... | Backend | 06-technical-architecture.md Section 2.6`

However, `06-technical-architecture.md` **Section 2.6** is titled "Image Caching" — it documents Swift URLCache and disk cache for card art. Matchmaking is documented in **Section 4.5** ("Matchmaking Service — Supabase Edge Functions + Realtime").

Any build agent following P0-005's reference to implement matchmaking will land in the wrong section.

**Suggested fix:** Update `10-prd.md` P0-005 reference from `Section 2.6` to `Section 4.5`.

---

### CRIT-06: PRD P0-002 References Non-Existent `02-card-data-model.md Section 20` for Evolution

**Source docs:** `10-prd.md`, `02-card-data-model.md`

**Description:** `10-prd.md` references `02-card-data-model.md` Section 20 for the card evolution feature (P0-002, line ~168, and again at line ~273). Section 20 in doc 02 is titled **"Data Flow: Key Operations"** — it contains data flow diagrams, not the evolution mechanics schema.

The evolution data structures (EvolutionRecord, ModifierInstance, TriggeredAbility, ShardQuality enum) are defined in Sections 3–5 of doc 02.

A build agent looking for "evolution schema in Section 20" will find data flow diagrams, not the schema it needs. The reference should point to Sections 2–5 (CardInstance, EvolutionRecord, ModifierSystem, TriggeredAbility).

**Suggested fix:** Update P0-002 reference in `10-prd.md` from `02-card-data-model.md Section 20` to `02-card-data-model.md Sections 2–5`.

---

### CRIT-07: PRD P0-013 References Sections 4.1-4.6 for Game Server but Section 2.6 Matchmaking Cross-Reference

**Source docs:** `10-prd.md`, `06-technical-architecture.md`

**Description:** `10-prd.md` P0-013 states the Game Server references `06-technical-architecture.md Sections 4.1-4.6`. These sections are:

- 4.1: Auth (not game server)
- 4.2: Collection Service
- 4.3: Economy Service
- 4.4: Evolution Service
- 4.5: Matchmaking Service
- 4.6: Game Server (correct)

The Game Server is specifically documented in **Section 4.6** and the deep dive in **Section 5** (Sections 5.1–5.6). Pointing at 4.1–4.6 includes three sections (4.1–4.4) that are Edge Functions with no game server relevance, and misses Section 5 which contains the actual turn resolution algorithm, combat resolution algorithm, and timer management — all critical for game server implementation.

**Suggested fix:** Update P0-013 reference to `06-technical-architecture.md Sections 4.6 and 5 (Sections 5.1–5.6)`.

---

### CRIT-08: Doc 05 Content Pipeline Faction Stabilizer Count Contradicts Docs 00 and 01

**Source docs:** `05-content-pipeline.md`, `00-game-design-master.md`, `01-battle-mechanics.md`

**Description:** `05-content-pipeline.md` Section 1a targets **7 faction stabilizers per faction** in its content distribution table:

> `Faction stabilizers | 7 | 21`

However, `00-game-design-master.md` Section 11 and `01-battle-mechanics.md` Section 11 specify that all launch stabilizers are **universal** (all factions), not faction-specific. The 7 stabilizer cards are universal. The docs explicitly state: "Faction-specific stabilizers reserved for future expansions."

If the content pipeline generates 7 faction-specific stabilizers per faction (21 total), it will create content that contradicts the game design. These would be cards with no mechanical definition (since no faction stabilizer mechanics are designed) and they would need to be inserted into a database schema that doesn't support them at launch.

**Suggested fix:** Update `05-content-pipeline.md` Section 1a to remove "Faction stabilizers" from per-faction counts and correctly reflect that the 7 universal stabilizers are a one-time shared pool, not per-faction. The grand total should decrease from 379 to 358 (300 creatures + 51 spells + 7 universal stabilizers). Update the "Practical launch target" note accordingly.

---

## WARNING Issues

---

### WARN-01: Turn Phase Naming Inconsistency Between Doc 01, Doc 02, and Doc 06

**Source docs:** `01-battle-mechanics.md`, `02-card-data-model.md`, `06-technical-architecture.md`

**Description:** The turn phase enum values differ across documents:

| Document | Phase Name |
|---|---|
| `01-battle-mechanics.md` Section 3 | "Draw & Gain Mana" |
| `02-card-data-model.md` TurnPhase enum | `DRAW_AND_MANA` |
| `06-technical-architecture.md` Section 5.1 state machine | Uses different naming conventions in some places |

While the semantic meaning is the same, build agents implementing the turn phase enum need exact name consistency. Small discrepancies cause TypeScript/Swift enum mismatches.

**Suggested fix:** Ensure doc 06 Section 5 game state machine uses TurnPhase values identical to the `02-card-data-model.md` TurnPhase enum: `START_OF_TURN | CHAOS_ROLL | EVENT_RESOLUTION | DRAW_AND_MANA | MAIN_PHASE | DECLARE_ATTACKERS | ASSIGN_BLOCKERS | COMBAT_RESOLUTION | END_TURN`. Verify doc 06 Section 5.1 state machine matches exactly.

---

### WARN-02: Doc 00 Section 7 Subscription Table Inconsistency With Doc 10 on Deck Slots

**Source docs:** `00-game-design-master.md`, `10-prd.md`

**Description:** `00-game-design-master.md` Section 7 subscription table shows **Mid: 6 deck slots**. `10-prd.md` US-014 shows **Mid: 5 deck slots**. This is the same underlying conflict as CRIT-01, but worth calling out explicitly as a protected-file vs. non-protected contradiction: the protected file (`00`) says 6, but the PRD (downstream doc that should conform to protected files) says 5.

The fix is as described in CRIT-01. This WARN documents the protected-file implication.

---

### WARN-03: Doc 03 Admin Dashboard Technology Described as "React" — Inconsistent with Doc 06 and Doc 07

**Source docs:** `03-prompt-templates.md`, `06-technical-architecture.md`, `07-ui-ux-specs.md`, `10-prd.md`

**Description:** Docs reference different technologies for the Admin Dashboard:

| Document | Admin Dashboard Technology |
|---|---|
| `03-prompt-templates.md` (line ~23) | "React web app on Railway" |
| `06-technical-architecture.md` Section 1.2 | "Node.js + Express + static HTML/JS on Railway" |
| `07-ui-ux-specs.md` Part B | "React + Vite (TypeScript)" with `.tsx` files |
| `10-prd.md` Section 1.3 | "Node.js + Express + static HTML/JS or React + Vite" (hedged) |
| `10-prd.md` Section 1.6 | "Node.js + Express + static HTML/JS on Railway" |

The inconsistency between React+Vite and plain HTML/JS is a build-time ambiguity. The `.tsx` files in doc 07 Part B (Dashboard.tsx, Cards.tsx, etc.) imply React+Vite, but doc 06 Section 9 (Admin Dashboard spec) describes it as "Node.js + Express + static HTML/JS." A build agent will need to pick one.

**Suggested fix:** Choose React + Vite (TypeScript) as the Admin Dashboard technology (consistent with doc 07 Part B which has the most complete spec), and update doc 06 Section 1.2 and 9 to reflect this explicitly. Alternatively, lock to plain HTML/JS and update doc 07 Part B to remove `.tsx` files.

---

### WARN-04: Doc 04 Authoritative Daily Quest Dust Values Override Doc 00 Range

**Source docs:** `04-progression-economy.md`, `00-game-design-master.md`

**Description:** `00-game-design-master.md` Section 6 states daily quest dust as "25–50" per quest. `04-progression-economy.md` Section 2.1 declares the exact canonical values: Easy = 20 Dust, Medium = 30 Dust, Hard = 45 Dust, with a note that the master doc's "25–50" is an approximation. Doc 04 explicitly claims to be the source of truth for these values.

While doc 04 handles this correctly by calling it out, the discrepancy means any implementation reading only doc 00 will use different numbers than intended. The minimum value (Easy = 20) is actually BELOW the doc 00 range minimum (25).

**Suggested fix:** Update `00-game-design-master.md` Section 6 Chaos Dust Earning table to state exact values: "Daily quest (easy) 20 / (medium) 30 / (hard) 45" rather than "25–50". This aligns the protected file with the canonical implementation values in doc 04.

---

### WARN-05: Doc 10 P1-004 Card Count — 120 vs. 124 per Faction

**Source docs:** `10-prd.md`, `05-content-pipeline.md`

**Description:** `10-prd.md` P1-004 states "~120 card templates per faction" while `05-content-pipeline.md` Section 1a shows a per-faction total of **124** (100 creatures + 17 spells + 7 faction stabilizers). Even after fixing CRIT-08 (removing 7 faction stabilizers), the per-faction total for faction-specific cards becomes 117. The PRD's "~120" is approximate, but given CRIT-08 the actual number changes.

**Suggested fix:** After resolving CRIT-08, update `10-prd.md` P1-004 to state the accurate count: "~117 card templates per faction (100 creatures, 17 spells) + 7 shared universal stabilizers = **358 total cards**."

---

### WARN-06: Doc 09 Mid Tier Price Stated as $6.99/mo But Doc 00 Says "$5–8/mo"

**Source docs:** `09-monetization-details.md`, `00-game-design-master.md`

**Description:** The Mid tier subscription price is expressed as a range ("$5–8/month") in the protected file (`00-game-design-master.md` Section 7) and as a specific value ("$6.99/month") in doc 09. Similarly, Top tier is "$10–15/month" in doc 00 but "$12.99/month" in doc 09. This is not a contradiction per se — doc 09 locks specific prices within doc 00's stated ranges — but the price in the StoreKit product IDs (`sub_mid_monthly_699`, `sub_top_monthly_1299`) is the operative value and supersedes the range.

**Suggested fix:** No change required to the protected doc (doc 00's ranges are intentional flexibility). Confirm in doc 09 that $6.99 and $12.99 are final and add a note: "These exact prices are canonical and supersede the ranges stated in doc 00 Section 7." This makes the relationship explicit for build agents.

---

### WARN-07: Evolution Pipeline — Fallback Art Not Specified in Doc 06 but Referenced in Doc 00

**Source docs:** `00-game-design-master.md`, `06-technical-architecture.md`, `03-prompt-templates.md`

**Description:** `00-game-design-master.md` Section 13a specifies a fallback system: "a fallback system applies a programmatic visual treatment to the existing art (color shift + particle overlay) as a temporary placeholder." Doc 03 Section 6.4 mentions a fallback. However, doc 06's evolution pipeline spec (Section 4.4) does not fully specify what the fallback implementation looks like — specifically: what library applies the color shift (`sharp`?), what the exact color shift parameters are for Order vs Chaos, and how the async "retry and push to client when ready" mechanism works in the Railway server.

**Suggested fix:** Add a fallback specification subsection to doc 06 Section 4.4 Evolution Service. Specify: (1) Use `sharp` npm library for server-side color grading, (2) Order fallback = blue-white tint shift, Chaos fallback = red-purple tint shift, (3) Fallback art stored to R2 with a `_fallback` suffix, (4) When real art arrives, push via Supabase Realtime channel `collection:{player_id}` with event type `art_updated`.

---

### WARN-08: Doc 06 Subscription Webhook Hard-Codes `max_deck_slots: 5` for Mid (From CRIT-01)

**Source docs:** `06-technical-architecture.md`

**Description:** The `apple-webhook` Edge Function in doc 06 (two occurrences, lines ~721 and ~751) hard-codes:
```typescript
max_deck_slots: tier === "HIGH" ? 10 : tier === "MID" ? 5 : 3
```
This is the wrong value for Mid tier (should be 6 per protected doc 00). Since this is implementation code, not a reference, it will ship the wrong limits to production.

**Suggested fix:** Change both occurrences to `tier === "MID" ? 6 : 3`. (Same fix as CRIT-01 but specifically calling out the code location.)

---

### WARN-09: Doc 05 Batch Pipeline Base Card Art Resolution Contradicts Docs 03 and 00

**Source docs:** `05-content-pipeline.md`, `03-prompt-templates.md`, `00-game-design-master.md`

**Description:** `05-content-pipeline.md` Section 1b states base art is "768x1024 portrait PNG/WebP" and Section 3a uses `image_size: "portrait_4_3"` for base cards.

`03-prompt-templates.md` Section 1.2 shows `"image_size": "portrait_4_3"` mapping to "768x1024 (Free/Planar Shard tier)" — this is the Free tier evolution resolution.

However, `00-game-design-master.md` Section 13a AI cost table shows base card art uses FLUX Dev at "1024×1024" (not 768×1024), and the cost estimate uses ~$0.025/image which corresponds to the HD square format.

The resolution for base card art templates is ambiguous: 768x1024 (portrait) or 1024x1024 (square).

**Suggested fix:** Clarify in doc 05 Section 1b and doc 03 Section 1.3 the exact base art resolution. Given base cards are templates shared by all players (not player-specific evolutions), using 1024x1024 square (as doc 00 implies) would be a one-time cost that produces higher quality Common art. Lock to `"square_hd"` (1024x1024) for base batch art and `"portrait_4_3"` (768x1024) for Free-tier evolution art only.

---

### WARN-10: Economy Flow — Onboarding Bonus Dust Amount Contradicted

**Source docs:** `04-progression-economy.md`, `10-prd.md`

**Description:** `04-progression-economy.md` Section 2.1 specifies an "Onboarding starter bonus: 200 Dust (one-time, given at faction commitment)." `10-prd.md` US-003 states "After faction selection, player receives 200 Chaos Dust, 3 Uncommon Shards, 1 Rare Shard, 1 Legendary Shard."

These are consistent on the 200 Dust amount. However, `00-game-design-master.md` Section 3 (Onboarding Flow) says "a small amount of Chaos Dust" and "enough shards to evolve 2–3 cards" without specifying amounts. The onboarding dust value (200) and shard bundle (3 Uncommon + 1 Rare + 1 Legendary) are only canonical in docs 04 and 10, not in the protected doc 00.

This is an INFO-level gap, but it becomes a WARNING because the protected doc 00 might be read first by a build agent for onboarding implementation.

**Suggested fix:** Update `00-game-design-master.md` Section 3 Onboarding Flow step 5 to state exact values: "200 Chaos Dust, 3 Uncommon Shards, 1 Rare Shard, and 1 Legendary Shard" instead of "a small amount" and "enough shards."

---

### WARN-11: Doc 10 P1-007 Subscription Management — Grace Period "7 Days" Not Defined Anywhere in Docs 04 or 09

**Source docs:** `10-prd.md`, `04-progression-economy.md`, `09-monetization-details.md`

**Description:** `10-prd.md` P1-007 states "Grace period of 7 days on lapse before enforcing card limits." This grace period is mentioned in the PRD as an acceptance criterion but is not defined in the canonical monetization doc (09) or economy doc (04). The implementation behavior during grace period — what limits are enforced, what functionality is maintained, what messaging is shown — is completely absent from all docs.

**Suggested fix:** Add a "Subscription Lapse and Grace Period" section to `09-monetization-details.md` defining: (1) 7-day grace period after billing failure before limits enforced, (2) During grace period: all subscriber benefits remain active, (3) At day 7: collection limit enforced (cannot add new cards beyond free limit, existing cards retained), modifier selection reverts to Free tier at next evolution, deck slots above free limit become read-only (cannot add cards but existing decks usable), (4) UI notification shown on login if in grace period.

---

## INFO Issues

---

### INFO-01: .tsx Files in Doc 07 Part B Are for Admin Dashboard (Web App) — Not a Violation

**Source docs:** `07-ui-ux-specs.md`

**Description:** The banned-reference grep found `.tsx` file references in doc 07 at lines ~3380-3395 (Dashboard.tsx, Cards.tsx, Evolution.tsx, etc.) and `main.tsx`. These are in **Part B — Admin Dashboard** section, which correctly documents the React + Vite TypeScript web application. This is NOT a violation — the Admin Dashboard is the correct application context for `.tsx` files.

**Suggested fix:** No action needed. The doc correctly separates iOS client (Part A) from Admin Dashboard (Part B). The React/TypeScript usage is correctly scoped to the web admin app.

---

### INFO-02: Doc 04 Balance Dashboard Runs Locally — No Spec in Doc 06

**Source docs:** `04-progression-economy.md`, `06-technical-architecture.md`

**Description:** `04-progression-economy.md` Section 10 describes a "balance dashboard" that runs locally on the owner's machine as a Monte Carlo simulator for economy tuning. This tool is not described in `06-technical-architecture.md` Section 9 (Admin Dashboard spec), which only covers the web app. The balance dashboard appears to be a separate local Node.js script (not a deployed service).

There is no spec for what file path the balance dashboard lives at, how to run it, or what its output looks like.

**Suggested fix:** Add a one-paragraph "Local Balance Dashboard" entry to doc 06 Section 10 (Infrastructure and Deployment) clarifying: script location (`scripts/balance-dashboard.ts`), run command (`npx ts-node scripts/balance-dashboard.ts`), that it reads `economy.config.json` and writes HTML output to `balance_results/report.html`, and that it does NOT need to be deployed.

---

### INFO-03: Doc 03 References "Section 6.2 for full retry logic" — Section Does Not Match

**Source docs:** `03-prompt-templates.md`

**Description:** `03-prompt-templates.md` Section 1.2 (line ~141) says: "HTTP 429 means rate limit. Apply exponential backoff: wait 2s, retry; wait 4s, retry; wait 8s, retry. See Section 6.2 for full retry logic."

The exponential backoff implementation code IS present in doc 03 Section 6.2, so the cross-reference is technically valid. However, the Section 1.2 backoff description ("2s, 4s, 8s, retry") differs from the actual implementation in Section 6.2 (which caps at 32 seconds over 4 retries: 2s, 4s, 8s, 16s, 32s cap). The inline description is incomplete.

**Suggested fix:** Update Section 1.2's inline description to match Section 6.2: "HTTP 429: exponential backoff — 2s, 4s, 8s, 16s delays, max 4 retries, cap 32s. See Section 6.2."

---

### INFO-04: Doc 00 Architecture Table Uses Generic "Node.js or Python" — Should Be Node.js Only

**Source docs:** `00-game-design-master.md`

**Description:** `00-game-design-master.md` Section 13 infrastructure table (line ~643) shows:

> `Backend | Node.js or Python + AI API layer`

All other docs (06, 03, 05, 10) specify Node.js/TypeScript exclusively. "Python" is not referenced anywhere else as a backend option. This is a remnant from before the platform alignment pass.

**Suggested fix:** Update the Section 13 table in doc 00 to read "Node.js/TypeScript (Railway game server + Edge Functions)" — consistent with all other infrastructure references.

---

### INFO-05: Doc 03 Prompt Template `.env` Template Uses `FAL_API_KEY` While Doc 06 Uses `FAL_KEY`

**Source docs:** `03-prompt-templates.md`, `05-content-pipeline.md`, `06-technical-architecture.md`

**Description:** (Overlaps with CRIT-04.) Documented here at INFO level to flag the specific template locations: doc 03 Section 6.3 and doc 05 Section 2d both contain `.env` template blocks that the owner is instructed to fill in. These templates use `FAL_API_KEY=...` but the authoritative backend `.env` template in doc 06 Section 1.3 uses `FAL_KEY=fal_...`. An owner copying from either the doc 03 or doc 05 template will create a key name that the Railway Edge Functions (using `Deno.env.get('FAL_KEY')`) will not find.

**Suggested fix:** Same as CRIT-04. Update all `FAL_API_KEY` template entries in docs 03 and 05 to `FAL_KEY`.

---

## Banned Reference Check Results

The following banned terms were found in document bodies. Context is provided:

| Term | Location | Context | Verdict |
|---|---|---|---|
| `React Native` | `03-prompt-templates.md` rev log | Revision log notes "Removed all implicit and explicit references to React Native" | PASS — revision log only, not body |
| `React Native` | `04-progression-economy.md` rev log | Revision log noting the removal of React Native references | PASS — revision log only |
| `React Native` | `05-content-pipeline.md` rev log | "Removed all React Native, Expo, and npm-run-script references" | PASS — revision log only |
| `React Native` / `Expo` | `06-technical-architecture.md` rev log | CI/CD row "Expo EAS Build + GitHub Actions → Xcode Cloud" (prior state → fixed) | PASS — revision log only |
| `React Native` | `07-ui-ux-specs.md` rev log | Revision notes documenting the removal | PASS — revision log only |
| `React Native` | `07-ui-ux-specs.md` rev log | "Platform Migration: React Native/Expo/TypeScript → Native iOS Swift/SwiftUI/SpriteKit" | PASS — revision log only |
| `Expo` | `07-ui-ux-specs.md` rev log | Multiple references in revision change log | PASS — revision log only |
| `expo-in-app-purchases` | `07-ui-ux-specs.md` rev log | "All IAP calls converted from expo-in-app-purchases to StoreKit 2" | PASS — revision log only |
| `.tsx` | `07-ui-ux-specs.md` Part B | Admin Dashboard file structure (Dashboard.tsx, etc.) | PASS — correctly scoped to web Admin Dashboard |
| `Android` | `05-content-pipeline.md` header | "No Android, no React Native, no Expo" (affirming iOS-only) | PASS — negation/clarification |
| `No RevenueCat` | `06-technical-architecture.md`, `07-ui-ux-specs.md`, `09-monetization-details.md` | All instances are "No RevenueCat" statements | PASS — all negations |

**Result: No banned terms found in document body content outside revision logs. All occurrences are in revision logs documenting what was removed, or in negation statements confirming the correct platform choice.**

---

## Admin/Client Separation Check

All 10 docs were reviewed for admin features inside the iOS app spec or game features inside the web dashboard spec.

**Result: PASS.** All documents correctly identify which app features belong to:
- iOS game client: battle, collection, deck building, shop, evolution ceremony, profile, onboarding
- Admin Dashboard (web app): batch card generation, QA gallery, economy config, player lookup, analytics

Docs 03, 04, 05, 07, and 10 all contain explicit "Two Applications" tables or statements. No violations found.

---

## Evolution Pipeline Completeness Check

Tracing the full evolution flow: **energy threshold → shard check → 70/30 roll → modifier selection → AI generation → art storage → card update**

| Step | Specified In | Status |
|---|---|---|
| Energy threshold check | `02-card-data-model.md` Section 2 (evolution_ready computed property) | COMPLETE |
| Shard inventory check | `04-progression-economy.md` Section 3, `02-card-data-model.md` Section 15 | COMPLETE |
| 70/30 channeling roll | `00-game-design-master.md` Section 4, `02-card-data-model.md` Section 3 | COMPLETE |
| Modifier selection (by tier) | `01-battle-mechanics.md` Section 6, `02-card-data-model.md` Section 4a | COMPLETE |
| fal.ai FLUX Kontext call | `03-prompt-templates.md` Section 1.2–1.5, `06-technical-architecture.md` Section 4.4 | COMPLETE |
| Download from fal.ai CDN | `03-prompt-templates.md` Section 1.2 (after generation step) | COMPLETE |
| Upload to Cloudflare R2 | `06-technical-architecture.md` Section 8.2 | COMPLETE |
| Update `art_url` on EvolutionRecord | `02-card-data-model.md` Section 3, `06-technical-architecture.md` Section 4.4 | COMPLETE |
| GPT-4o Mini name/flavor generation | `03-prompt-templates.md` Section 2, `06-technical-architecture.md` Section 4.4 | COMPLETE |
| Player name selection from candidates | `00-game-design-master.md` Section 13a, `07-ui-ux-specs.md` evolution flow | COMPLETE |
| Stat increases applied | `01-battle-mechanics.md` Section 1 PP tables, `02-card-data-model.md` Section 3 | COMPLETE |
| Instability recalculation | `02-card-data-model.md` Section 2 (instability_value constraint) | COMPLETE |
| Shard consumed from inventory | `02-card-data-model.md` Section 15, `04-progression-economy.md` Section 3 | COMPLETE |
| Fallback art on failure | `00-game-design-master.md` Section 13a | PARTIAL — see WARN-07 |
| Triggered ability granted | `01-battle-mechanics.md` Section 7, `02-card-data-model.md` Section 5 | COMPLETE |
| CardInstance tier updated | `02-card-data-model.md` Section 2 (tier field) | COMPLETE |
| Resumable on failure | `05-content-pipeline.md` Section 2c (manifest) | COMPLETE for batch; evolution fallback needs spec (WARN-07) |

**Overall: Pipeline is nearly complete. One partial gap (fallback art mechanism) per WARN-07.**

---

## Economy Flow Completeness Check

Tracing Chaos Dust: **earning → accumulation → spending → sinks**

| Flow | Specified | Status |
|---|---|---|
| Win/loss dust award | `01-battle-mechanics.md` Section 13 / `04-progression-economy.md` Section 2.1 | COMPLETE |
| Daily quest reward | `04-progression-economy.md` Section 4 | COMPLETE |
| Weekly quest reward | `04-progression-economy.md` Section 4.3 | COMPLETE |
| Season milestone reward | `04-progression-economy.md` Section 5.4 | COMPLETE |
| Onboarding bonus | `04-progression-economy.md` Section 2.1 | COMPLETE (doc 00 is vague — see WARN-10) |
| Card pack purchase | `04-progression-economy.md` Section 2.3 | COMPLETE |
| Shard purchase | `04-progression-economy.md` Section 2.3 | COMPLETE |
| Faction unlock via pack | `04-progression-economy.md` Section 2.6 | COMPLETE |
| Avatar purchase | `04-progression-economy.md` Section 2.3 | COMPLETE |
| Subscriber quest multiplier | `04-progression-economy.md` Section 2.2 | COMPLETE |
| Inflation prevention / sinks | `04-progression-economy.md` Section 2.7 | COMPLETE |

**Overall: Economy flow is fully specified. No broken paths found.**

---

## Resumable Pipeline Check

`05-content-pipeline.md` Section 2c defines the JSON manifest system. Review:

- Manifest written at `batch_results/run_TIMESTAMP/manifest.json` — COMPLETE
- Status values: `pending`, `generating`, `qa_pass`, `qa_fail`, `approved`, `rejected`, `published` — COMPLETE
- Resume behavior: on startup, skip `approved`, `published`, `qa_pass`; treat `generating` as `pending` — COMPLETE
- Exponential backoff on fal.ai errors (2s, 4s, 8s, 16s, max 4 retries, cap 32s) — COMPLETE
- Concurrent requests (max 10) — COMPLETE
- Cards with `generating` status treated as `pending` on restart (handles process kill mid-call) — COMPLETE

**Overall: Resumable pipeline is fully and correctly specified.**

---

## Cross-Reference Verification Summary

| Reference | From Doc | Points To | Exists? | Correct? |
|---|---|---|---|---|
| "see 01-battle-mechanics.md Section 6" | doc 00 Section 5 | modifier pools | YES | YES |
| "see 01-battle-mechanics.md Section 3" | doc 00 Section 8 | turn structure | YES | YES |
| "see 01-battle-mechanics.md Section 7" | doc 00 Section 5 | triggered abilities | YES — Section 7 is Triggered Abilities | YES |
| "01-battle-mechanics.md Section 2" | doc 00 Section 9 | instability formula | YES | YES |
| "02-card-data-model.md Section 2" | doc 01 | CardInstance | YES | YES |
| "06-technical-architecture.md Section 2.6" | doc 10 P0-005 | MATCHMAKING | YES — BUT wrong section (2.6 = Image Caching) | NO — see CRIT-05 |
| "02-card-data-model.md Section 20" | doc 10 P0-002 | Evolution | YES — but wrong section (20 = Data Flow) | PARTIAL — see CRIT-06 |
| "04-progression-economy.md Section 6.5" | doc 10 US-004 | onboarding quests | YES | YES |

---

*End of REVIEW-systems-v2.md*
*Generated: 2026-02-16*

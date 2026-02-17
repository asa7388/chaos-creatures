# 05 — Content Pipeline

This document defines the AI-powered batch generation tooling, quality assurance workflows, seasonal content release strategy, and testing infrastructure for Chaos Creatures' card content.

**Depends on:** `00-game-design-master.md` (card economy, factions, AI integration), `01-battle-mechanics.md` (stat ranges, modifier pools, PP system), `02-card-data-model.md` (CardTemplate, CardInstance schemas)

---

## 1. Launch Content Requirements

### 1a. Target Card Counts

Each of the 3 launch factions needs a pool of Common-tier card templates to serve as the foundation for the game economy.

| Type | Count Per Faction | Purpose |
|---|---|---|
| Base creatures | 90-125 | Core deck-building units with varied PP costs (1-6 CM), instability profiles (0-5), and keyword distributions |
| Base spells | 15-20 | Utility, removal, buffs — diverse effects at 1-5 CM cost |
| Stabilizers | 5-10 | Instability manipulation — both board permanents and instant spells |
| **Total per faction** | **110-155** | |
| **Total across 3 factions** | **330-465** | |

**Universal stabilizer/manipulation cards:** 7 cards (already designed in `01-battle-mechanics.md` Section 11) — these are faction-agnostic and available to all players.

**Final launch target:** 330-465 faction cards + 7 universal stabilizers = **337-472 unique card templates.**

For a realistic and achievable launch scope, we'll target the lower-mid range: **~360 cards total** (120 per faction × 3 factions + 7 universal).

### 1b. Card Template Requirements

Each Common card template needs:

1. **Base art** — 1024×1024 PNG, generated via FLUX Dev text-to-image
2. **Card name** — faction-appropriate, generated via GPT-4o Mini
3. **Flavor text** — 1-2 sentences, faction voice, generated via GPT-4o Mini
4. **Stat assignment** — ATK/HP/CM cost within PP budget, base instability value (0-5), keywords (0-1 at Common)
5. **Spell/stabilizer effect definition** — structured effect schema (see `02-card-data-model.md` Section 6)
6. **Balance validation** — automated PP check, stat range check, keyword cost verification

### 1c. Content Distribution Requirements

To support diverse deckbuilding and ensure both Order and Chaos strategies are viable within each faction:

| Base Instability | % of Faction Creature Pool | Count (out of ~100 creatures/faction) |
|---|---|---|
| 0 (Pure stability) | ~5% | 5 |
| 1 (Order-friendly) | ~25% | 25 |
| 2 (Balanced) | ~30% | 30 |
| 3 (Chaos-leaning) | ~25% | 25 |
| 4 (Chaos-committed) | ~10% | 10 |
| 5 (Extreme chaos) | ~5% | 5 |

**Chaos mote cost distribution:**

| CM Cost | % of Creature Pool | Count (out of ~100 creatures/faction) |
|---|---|---|
| 1 | ~15% | 15 |
| 2 | ~20% | 20 |
| 3 | ~25% | 25 |
| 4 | ~20% | 20 |
| 5 | ~15% | 15 |
| 6 | ~5% | 5 |

This ensures healthy mana curves and viable aggro/midrange/control archetypes.

---

## 2. Batch Generation Pipeline

### 2a. Pipeline Overview

```
[Design Input] → [Batch Generation] → [Automated QA] → [Human Review] → [Approval/Reject] → [Database Import] → [CDN Upload]
```

**Design Input:** CSV/spreadsheet with mechanical specs for each card (name stub, CM cost, instability, ATK/HP ranges, keywords, spell effects, faction).

**Batch Generation:** Automated scripts call FLUX Dev and GPT-4o Mini APIs to generate art, names, and flavor text in parallel batches.

**Automated QA:** Scripts validate PP budgets, stat ranges, keyword legality, image resolution, and faction consistency.

**Human Review:** Internal team reviews flagged cards and samples of passing cards for quality and thematic fit.

**Approval/Reject:** Approved cards are written to the database. Rejected cards are regenerated with modified prompts or manual adjustments.

**CDN Upload:** Approved card art is uploaded to CDN (AWS S3 + CloudFront or similar). URLs are written to CardTemplate records.

### 2b. Art Generation — FLUX Dev Batch Pipeline

**Model:** FLUX Dev (text-to-image) via Replicate or Fal.ai

**Cost per image:** ~$0.025 per 1024×1024 generation

**Resolution:** 1024×1024 (high enough for mobile display and future evolution i2i input)

**Batch strategy:**

1. **Prompt construction:** Each card receives a layered prompt:
   - **Faction art prefix** (from `Faction.art_prompt_prefix`) — e.g., "steampunk fantasy art, brass and copper tones, gears and steam, industrial cathedral aesthetic"
   - **Creature archetype** — e.g., "mechanical war hound," "clockwork knight," "steam-powered golem"
   - **Visual modifiers based on instability** — low instability: structured, armored, symmetrical; high instability: fractured, asymmetrical, volatile energy
   - **Keywords visual cues** — Shield → armor plating, Flying → wings/thrusters, Deathtouch → venomous/lethal visual details
   - **Standard format constraints** — "portrait orientation, centered subject, dark background, single creature focus, card game art style"

2. **Batching:** Group cards by faction to reuse faction prefix. Generate in batches of 50-100 cards per API call window to manage rate limits and cost tracking.

3. **Concurrent generation:** Use async batch API calls (if available) or parallel workers to generate 10-20 images simultaneously. Target generation speed: ~100 cards/hour.

4. **Fallback/retry:** If a generation fails (API error, timeout, or produces a completely unusable image), log the failure and queue a retry with a slightly modified prompt (add/remove a detail, adjust phrasing).

**Example prompts:**

| Faction | Creature Type | Instability | Full Prompt |
|---|---|---|---|
| Ironwright Collective | Mechanical war hound | 3 (Chaos-leaning) | "steampunk fantasy art, brass and copper tones, gears and steam, industrial cathedral aesthetic. A mechanical war hound with exposed gears, asymmetrical plating, crackling energy leaking from joints, aggressive stance. Portrait orientation, centered subject, dark background, single creature focus, card game art style." |
| Fey Courts | Mycelial guardian | 1 (Order-friendly) | "ancient forest fantasy art, bioluminescent flora, ethereal glow, organic textures. A towering mycelial guardian covered in moss and glowing fungi, symmetrical form, protective stance, emanating calm order. Portrait orientation, centered subject, dark background, single creature focus, card game art style." |
| Demonic Kingdoms | Blood ritualist | 4 (Chaos-committed) | "dark fantasy art, hellfire and obsidian, blood rituals, corrupted flesh. A gaunt blood ritualist with cracked skin leaking crimson energy, wild eyes, chaotic flame aura, volatile posture. Portrait orientation, centered subject, dark background, single creature focus, card game art style." |

### 2c. Name and Flavor Text Generation — GPT-4o Mini Batch API

**Model:** GPT-4o Mini via OpenAI Batch API

**Cost per card:** ~$0.0002-0.0005 per card (name + flavor text in single call)

**Batch strategy:**

1. **Batch API submission:** Submit all 360 card requests as a single JSONL batch file to OpenAI's Batch API endpoint. Batch API is ~50% cheaper than real-time API and returns results within 24 hours (acceptable for pre-launch pipeline).

2. **Prompt construction:** Each card receives a structured prompt with faction voice instructions + card mechanical context:

```
System: You are a card name and flavor text generator for Chaos Creatures, an AI-generated card game. Generate concise, evocative card names (2-4 words) and flavor text (1-2 sentences) that match the faction's voice and the card's mechanical identity.

User:
Faction: The Ironwright Collective
Faction voice: Industrial, pragmatic, references engineering and invention. Names use mechanical compound words, references to metals/gears/steam. Flavor text emphasizes function, craftsmanship, and the fusion of magic and machinery.
Creature archetype: Mechanical war hound
Stats: 4 ATK / 3 HP, 3 chaos mote cost
Instability: 3 (aggressive, chaos-leaning)
Keywords: Piercing
Visual description: Exposed gears, asymmetrical plating, crackling energy leaking from joints

Generate:
1. Card name (2-4 words)
2. Flavor text (1-2 sentences, <140 characters)

Output as JSON:
{"name": "...", "flavor_text": "..."}
```

**Expected output:**

```json
{
  "name": "Arcforge Ravager",
  "flavor_text": "Built for the siege of Ember Spire, its gears never stop grinding. Mercy was not part of the schematic."
}
```

3. **Fallback for poor outputs:** If a name is too long (>30 chars), too generic ("Creature 1"), or flavor text exceeds character limits, flag for human review or automatic regeneration with stricter constraints.

4. **Alternative names:** Generate 2-3 name candidates per card (costs ~3× but still negligible at $0.0015/card). Store all candidates, present to internal team for selection. This improves name quality and provides backups.

### 2d. Automated Quality Checks

Run immediately after generation, before human review. Any card that fails a check is flagged and added to the regeneration queue.

| Check | Rule | Failure Action |
|---|---|---|
| **PP Budget Validation** | `(ATK + HP + keyword_cost) == base_PP_for_CM_cost` (±1 tolerance) | Flag for stat adjustment |
| **Stat Range Validation** | ATK and HP within ranges defined in `01-battle-mechanics.md` Section 12 | Flag for stat adjustment |
| **Instability Profile** | Low instability (0-1): HP ≥ ATK. High instability (4-5): ATK ≥ HP | Flag for stat rebalance |
| **Keyword Legality** | Common creatures: 0-1 keyword. No multiple expensive keywords (Shield + Flying) unless PP allows | Flag for keyword removal |
| **Image Resolution** | 1024×1024 minimum, aspect ratio 1:1 or 3:4 | Regenerate art |
| **Image Quality** | No blank images, no visible API error artifacts, subject is centered | Regenerate art |
| **Name Length** | 3-30 characters, no profanity filter hits | Regenerate name |
| **Flavor Text Length** | 1-200 characters, readable English | Regenerate flavor text |
| **Faction Consistency** | Visual style matches faction (manual spot-check sample) | Flag for human review |

**Automated check script output:** CSV or web UI showing pass/fail status for each card, with specific failure reasons.

### 2e. Human Review Queue

After automated checks, a sample of passing cards (10-20%) and ALL flagged cards are sent to internal reviewers (designers, artists, QA).

**Review criteria:**

1. **Art quality:** Does the art look good? Is the creature clearly visible and visually interesting? Does it match the faction's aesthetic?
2. **Name quality:** Is the name evocative, faction-appropriate, and memorable? Does it fit the card's visual identity?
3. **Flavor text quality:** Is the flavor text engaging and faction-appropriate? Does it enhance the card's identity?
4. **Mechanical coherence:** Do the stats, keywords, and instability value make sense together? (E.g., a 1/5 creature with 0 instability and Taunt is coherent. A 5/1 creature with 0 instability is incoherent.)
5. **Uniqueness:** Is this card too similar to another card in the same faction/cost slot?

**Review actions:**

- **Approve:** Card is finalized and moves to database import.
- **Reject (regenerate):** Card is discarded. Regenerate art, name, or flavor text with modified prompts.
- **Edit (manual fix):** Minor issues (name tweak, stat adjustment) are fixed manually by the reviewer. Card is approved after edit.

**Review tooling:** Internal web UI that displays:
- Card art
- Card name
- Flavor text
- Stats (ATK/HP/CM cost/instability/keywords)
- Faction
- Automated check results (pass/fail status)
- Action buttons: Approve / Reject (Art) / Reject (Name) / Reject (Flavor) / Edit Stats

### 2f. Database Import

Approved cards are written to the `CardTemplate` table in the production database. Each card receives:

- `id` (UUID)
- `name`, `card_type`, `faction_id`
- `base_attack`, `base_health`, `base_instability`, `mana_cost`
- `base_keywords` (array)
- `spell_effect` or `stabilizer_type` (if applicable)
- `art_prompt` (full FLUX prompt used for generation — stored for future reference and potential regeneration)
- `art_url` (CDN URL after upload)
- `flavor_text`
- `batch_id` (batch generation run identifier)
- `approved_at`, `approved_by`

**Import script validation:** Before writing to production, run a final sanity check on the full card set:
- No duplicate names within the same faction
- Instability distribution matches target percentages (±5%)
- CM cost distribution matches target percentages (±5%)
- All art URLs are valid and reachable
- All faction IDs reference existing Faction records

### 2g. Estimated Generation Time and Costs

**Per faction (120 cards):**

| Task | Count | Unit Cost | Total Cost | Time (parallel) |
|---|---|---|---|---|
| Art generation (FLUX Dev) | 120 | $0.025 | $3.00 | ~1-2 hours |
| Name + flavor (GPT-4o Mini batch) | 120 | $0.0005 | $0.06 | ~24 hours (batch queue) |
| Automated QA | 120 | — | — | ~5 minutes |
| Human review (20% sample) | 24 | — | — | ~2-3 hours |
| **Total per faction** | | | **~$3.06** | **~26-28 hours (mostly waiting on batch API)** |

**All 3 factions (360 cards):**

| Total Cost | Total Time (serial) | Total Time (parallel, 3 factions) |
|---|---|---|
| **~$9.18** | ~78-84 hours | ~26-28 hours |

**Universal stabilizers (7 cards):** ~$0.20, ~1 hour

**Grand total (367 cards):** **~$9.40**, **~27-29 hours** (or ~1-2 weeks if done serially with human review cycles)

**Regeneration budget:** Assume 10-15% of cards require regeneration (art or text). Add ~$1.50 to total budget. **Final launch content cost: ~$11.**

---

## 3. Card Design Tooling

### 3a. Card Template Creation Tool

**Purpose:** Internal web-based tool for designers to create card templates with guided stat assignment, keyword selection, and automated balance validation.

**Features:**

1. **Faction selection** — dropdown to choose faction (locks in art style, mechanic, and flavor voice)
2. **Card type** — Creature / Spell / Stabilizer
3. **Chaos mote cost** — 1-6 slider (automatically calculates base PP budget)
4. **Instability value** — 0-5 slider (for creatures only, affects stat profile guidance)
5. **Stat assignment** — ATK and HP sliders with live PP budget tracker showing remaining PP after stats + keywords
6. **Keyword picker** — checkboxes for 7 keywords, with PP cost displayed next to each. Grays out keywords that exceed remaining PP budget.
7. **Spell effect builder** — dropdown for effect type, target type, value input, duration selector (for spells/stabilizers)
8. **Visual archetype input** — text field for creature archetype description (e.g., "mechanical war hound," "shadow assassin")
9. **Balance validation** — real-time feedback on stat profile coherence (e.g., "Low instability creature should have HP ≥ ATK. Current: ATK 4 > HP 2. Recommendation: swap stats or increase instability.")
10. **Batch export** — export 50-100 card specs as CSV for batch generation pipeline

**Validation on save:**

- PP budget must be fully spent (within ±1 tolerance)
- Stat ranges must match `01-battle-mechanics.md` Section 12 guidelines
- Instability profile must be coherent with stats
- Spell effects must have valid target types and values

**Output:** CardTemplate spec (JSON or CSV row) ready for batch generation pipeline.

### 3b. Balance Validation Script

**Purpose:** Automated script that runs against a CSV of card specs (or against the production CardTemplate table) to flag balance issues before generation or after import.

**Checks performed:**

1. **PP budget check:** `(ATK + HP + sum(keyword_costs)) == base_PP_for_CM_cost` (±1 tolerance)
2. **Stat range check:** ATK and HP within min/max for CM cost (from Section 12 table)
3. **Instability coherence check:**
   - Instability 0-1: HP ≥ ATK
   - Instability 4-5: ATK ≥ HP
4. **Keyword legality:** Common creatures have ≤1 keyword (unless high PP cost allows multiple)
5. **Spell effect power check:** Spell effects should match power budget for CM cost (manual guidelines, not fully automatable)
6. **Duplicate name check:** No two cards in the same faction have identical names
7. **Distribution check:** Instability and CM cost distributions match target percentages (±5%)

**Output:** Report listing all flagged cards with specific issues. Can be integrated into the Card Template Creation Tool for real-time feedback.

### 3c. CSV/Spreadsheet → Database Import Pipeline

**Purpose:** Batch import tool that reads a CSV of card specs (with art URLs and text already generated) and writes CardTemplate records to the database.

**CSV format:**

```csv
name,faction_id,card_type,cm_cost,base_instability,atk,hp,keywords,art_url,flavor_text,art_prompt,batch_id
"Arcforge Ravager","IRONWRIGHT","CREATURE",3,3,4,3,"PIERCING","https://cdn.example.com/cards/arcforge-ravager.png","Built for the siege of Ember Spire...","steampunk fantasy art, brass and copper tones...","batch_2026_02_01"
```

**Import steps:**

1. Parse CSV, validate column headers
2. For each row:
   - Validate faction_id references existing Faction
   - Validate card_type is valid enum
   - Validate stats match balance rules
   - Check art_url is reachable (HTTP HEAD request)
   - Generate UUID for card `id`
   - Construct CardTemplate object
   - Write to database
3. Report success/failure for each card

**Error handling:** If any card fails validation, log the error and continue with remaining cards. Generate a final error report listing failed cards and reasons.

---

## 4. Seasonal Content Releases

### 4a. Post-Launch Content Cadence

**Content release strategy:** Regular cadence of new cards to keep the meta fresh, reward long-term players, and provide design space for new archetypes and strategies.

| Release Type | Frequency | Content | Purpose |
|---|---|---|---|
| **New card packs** | Quarterly (every 3 months) | 20-30 new Common templates per faction | Expand deckbuilding options, introduce new archetypes, shake up meta |
| **New faction** | Annually (1st year: 1 new faction, 2nd year: 1-2 new factions) | 110-155 cards + exclusive mechanic + art style | Major content expansion, new player onboarding hook, subscription value add |
| **Balance patches** | Monthly | Stat adjustments to 5-10 existing templates | Address meta imbalances, buff underplayed cards, nerf overperformers |
| **Seasonal events** | Every 6 weeks | Limited-time quests, special avatars, cosmetic rewards | Engagement spikes, reward active players, no gameplay power |

### 4b. New Card Pack Releases (Quarterly)

**Target:** 20-30 new Common templates per faction, released simultaneously across all factions.

**Design goals for each pack:**

1. **Archetype support:** Introduce cards that enable a new deck archetype or strengthen an underrepresented one (e.g., "Bond aggro" for Fey Courts, "low-instability control" for Demonic Kingdoms).
2. **Meta diversity:** Add counters to dominant strategies (e.g., if Taunt-heavy decks are oppressive, add more Deathtouch creatures or Piercing options).
3. **Keyword exploration:** Introduce new keyword combinations or unusual stat profiles (e.g., a 1-cost creature with Flying but 0 instability).
4. **Faction identity reinforcement:** Every pack includes 2-3 cards that strongly showcase the faction's exclusive mechanic (Augment/Bond/Corruption).

**Release process:**

1. **Design phase (4-6 weeks before release):** Design team specs out 60-90 cards (20-30 per faction) using Card Template Creation Tool. Balance validation runs continuously.
2. **Batch generation (2-3 weeks before release):** Run batch pipeline to generate art, names, and flavor text. Same process as launch content.
3. **QA and testing (1-2 weeks before release):** Internal playtesting with new cards. Balance adjustments if needed. Human review of all art and text.
4. **Database staging (1 week before release):** Import approved cards to staging database. Final validation checks.
5. **Release day:** Flip feature flag to make new cards available in card packs and the "Specific Common" shop. Announce via in-game news and social media.

**Cost per quarterly release:** ~$9-14 (60-90 cards × $0.025 art + $0.0005 text + 10-15% regeneration buffer)

**Player acquisition:** New cards are added to the existing card pack pool. Players can acquire them via:
- Random card packs (100 Dust for own faction, 150 Dust for other factions)
- Specific Common purchase (50 Dust)
- Subscription monthly card grants (Mid tier: +3 Commons, Top tier: +5 Commons)

No new currency or paywall — new cards enter the same economy as launch cards.

### 4c. New Faction Releases (Annually)

**Scope of a new faction:**

- 110-155 Common card templates (creatures, spells, stabilizers)
- Exclusive mechanic (design and implementation)
- Faction art style (FLUX prompt prefix, visual identity)
- Faction flavor voice (GPT-4o Mini instructions for names and flavor text)
- 3-5 starter avatars
- Card frame design and UI theme
- Faction-specific modifier pool (48 modifiers: 12 pools × 4 modifiers per pool)

**Development timeline:**

| Phase | Duration | Tasks |
|---|---|---|
| Design | 3-4 months | Exclusive mechanic design, card specs, art direction, faction lore |
| Batch generation | 1 month | Generate all card art, names, flavor text via batch pipeline |
| Modifier design | 2-3 months | Design 48 faction modifiers (parallel with card generation) |
| Art & UI | 2-3 months | Card frame design, avatar portraits, UI theme (parallel with content) |
| Implementation | 2-3 months | Code exclusive mechanic, integrate modifiers, test balance |
| QA & playtesting | 1-2 months | Internal testing, balance iteration |
| **Total** | **6-9 months** | |

**Release strategy:**

- Announce 2-3 months before release (tease art, mechanic, lore)
- Open faction for trial during onboarding for all new players
- Existing players unlock via 150 Dust card pack purchase (same as cross-faction unlock)
- Season tie-in: new faction releases at the start of a new ranked season

**Cost per new faction:** ~$35-50 (content generation + avatar art + UI assets)

**Revenue impact:** New factions are a major subscription driver. Players who love the new art style or mechanic are incentivized to subscribe for faster collection growth and better evolution options.

### 4d. Balance Patches (Monthly)

**Scope:** Adjust 5-10 existing CardTemplates per month to address meta imbalances.

**Balance adjustment types:**

1. **Stat tweaks:** +1/-1 ATK or HP (keeps PP budget roughly intact)
2. **Keyword changes:** Add or remove a keyword (adjust stats to maintain PP budget)
3. **Instability adjustments:** +1/-1 base instability (shifts stat profile expectations)
4. **Chaos mote cost changes:** Increase or decrease CM cost by 1 (rare, last resort for severely over/underperforming cards)
5. **Spell effect power adjustments:** Change damage/healing values, target restrictions, or duration

**How balance patches interact with evolved cards:**

- **CardTemplate changes propagate to all CardInstances** at the base stat level. If a template's `base_attack` changes from 3 to 4, all instances of that template (even evolved Legendaries) gain +1 ATK.
- **Evolution stat gains are not recalculated.** If a card evolved from 3 ATK → 5 ATK (gaining +2 from evolution), and the template is buffed to 4 ATK, the evolved card becomes 6 ATK (new base 4 + old evolution gain +2).
- **Modifiers are not affected.** Balance patches never change ModifierDefinitions that are already in circulation (would break evolved cards' identities). New modifiers can be added to pools, but existing modifiers are immutable.
- **Migration script:** When a balance patch is deployed, a database migration script updates all CardInstance records that reference the changed CardTemplate, recalculating their `current_attack`, `current_health`, and `instability_value` based on new template values + existing evolution history.

**Balance patch process:**

1. **Data analysis:** Review win rates, play rates, and deck composition data for all cards. Identify outliers (cards with >55% win rate or <1% play rate).
2. **Designer review:** Design team discusses proposed changes. Prioritize cards that are warping the meta or completely unplayed.
3. **Staging deployment:** Deploy changes to staging environment. Internal playtesting for 1 week.
4. **Production deployment:** Push balance patch live. In-game announcement lists all changed cards with before/after stats.
5. **Post-patch monitoring:** Track win rate and play rate changes for 2 weeks. Revert or further adjust if needed.

**Player communication:** Balance patches are announced 3-5 days in advance with a blog post or in-game news article explaining the rationale for each change. Transparency builds trust and helps players understand the game's evolving meta.

**Cost per balance patch:** $0 (no new AI generation, just database updates and testing)

### 4e. Seasonal Events (Every 6 Weeks)

**Purpose:** Engagement spikes, reward active players, introduce limited-time cosmetic content.

**Event types:**

1. **Themed quests:** Special daily/weekly quests tied to a narrative theme (e.g., "The Ironwright Rebellion" — win 10 games with Ironwright, evolve 3 Ironwright creatures, play 50 Augment modifiers). Rewards: Chaos Dust, Planar Shards, exclusive avatar or card frame.
2. **Double XP weekends:** All games award 2× chaos energy for 48 hours. Drives engagement spikes.
3. **Limited-time avatars:** New avatar released, available for Chaos Dust purchase only during the event (300-500 Dust). After event ends, avatar becomes unavailable (or moves to a higher Dust price).
4. **Faction mastery challenges:** Reach faction mastery level X during the event to unlock exclusive cosmetic (card back, avatar frame, title).

**Event content generation:**

- Avatars: FLUX Dev text-to-image (~$0.025 per avatar portrait)
- Card frames: Manual graphic design (no AI generation)
- Quest text: Manually written (no AI generation needed)

**Cost per event:** ~$0.10-0.50 (1-2 avatar portraits + minimal design work)

**No gameplay power:** Seasonal events never gate gameplay-affecting cards or modifiers behind limited-time availability. Only cosmetics. This preserves fairness for players who miss events.

---

## 5. QA and Testing

### 5a. Automated Balance Testing

**Purpose:** Simulate thousands of games with new card templates to detect balance outliers before release.

**Approach:**

1. **AI deckbuilding:** Generate 20-30 decks per faction using random card selection (weighted toward new cards for quarterly releases). Ensure decks meet construction rules (20 cards, single faction, valid mana curve).
2. **AI vs. AI simulation:** Pit AI decks against each other in simulated games. AI makes random-but-legal decisions (play cheapest creature, attack with all non-Taunt creatures, assign blockers randomly).
3. **Win rate tracking:** Track win rate for each card template across all simulated games. Flag cards with >60% win rate (when drawn) or <30% win rate as potential outliers.
4. **Statistical significance:** Run 10,000+ simulated games to achieve statistical confidence. Cards with <100 appearances in simulations are marked as "insufficient data."
5. **Heatmap output:** Generate a CSV or web UI heatmap showing:
   - Card name
   - Games played (appearances in starting decks)
   - Games won (when card was in winning deck)
   - Win rate
   - Avg damage dealt (creatures only)
   - Avg damage taken (creatures only)
   - Avg turns on board

**Interpretation:** This is a smoke test, not a definitive balance verdict. AI plays randomly and doesn't exploit synergies or build optimized decks. Outliers flagged by simulation are reviewed manually by designers, who decide whether the card needs adjustment.

**Implementation:** Game simulation engine (server-side, reuses battle logic from production game code). Can run headless on CI/CD pipeline or locally.

**Cost:** $0 (computation only, no AI API calls)

**Timeline:** 1-2 days to run 10,000+ simulations for a 60-90 card quarterly release.

### 5b. Art Quality Gates

**Purpose:** Automated checks to catch low-quality or broken art before human review.

**Checks:**

1. **Resolution check:** Image is exactly 1024×1024 pixels. Reject if not.
2. **File size check:** Image is 100KB - 3MB (PNG). Reject if outside range (too small = corrupted, too large = inefficient).
3. **Aspect ratio check:** Image is square (1:1) or near-square (within 5% tolerance). Reject if not.
4. **Blank image detection:** Check if image is entirely black or white (indicates generation failure). Reject if >95% of pixels are same color.
5. **Composition check (ML-based, optional):** Use a lightweight image classification model (e.g., CLIP) to verify that the image contains a creature/object in the center. Reject if confidence <50%.
6. **Faction consistency check (ML-based, optional):** Train a simple classifier on approved faction art to detect if a generated image matches the faction's visual style. Flag for human review if confidence <70%.

**Implementation:** Python script using PIL/Pillow for basic checks, optional CLIP or custom-trained model for composition/faction checks.

**Cost:** $0 (local computation, or minimal cloud GPU cost for ML checks ~$0.001/image)

**Timeline:** <1 minute to run checks on 100-500 images.

### 5c. Regression Testing

**Purpose:** Ensure new content doesn't break existing card interactions, game rules, or UI.

**Test suites:**

1. **Card interaction tests:** Automated unit tests for every keyword combination (e.g., "Shield + Deathtouch creature blocks Piercing attacker — verify Shield blocks damage, Deathtouch still triggers, Piercing does not apply").
2. **Evolution flow tests:** End-to-end tests for card evolution (API calls, database updates, art generation mocks, UI state updates).
3. **Deck construction tests:** Verify deck validation rules (20 cards, single faction, max 2 copies, Legendary limits).
4. **Battle flow tests:** Simulate full game from start to finish, verify turn phases execute correctly, chaos roll triggers events, combat damage resolves as expected.
5. **Modifier attunement tests:** Verify modifier base effects and attuned bonuses activate correctly based on last chaos roll result.
6. **Instability calculation tests:** Verify player instability recalculates correctly after creatures enter/leave board, after evolution instability changes, after modifier instability adjustments.

**Test coverage target:** >90% code coverage for game logic (battle engine, card effects, modifiers, keywords, instability).

**CI/CD integration:** All test suites run automatically on every commit to the main branch. Block merge if any tests fail.

**Cost:** $0 (computation only, runs on CI/CD servers)

**Timeline:** Test suites run in 5-15 minutes per commit.

### 5d. Playtesting (Human QA)

**Purpose:** Catch bugs, balance issues, and UX problems that automated tests miss.

**Playtest schedule:**

- **Weekly internal playtests (2-3 hours):** Design team, engineers, and QA play games with staging content. Focus on new cards, new features, and balance changes.
- **Quarterly external playtests (1 week, 20-50 external testers):** Recruit external playtesters (via Discord, Reddit, or email list) to play pre-release builds. Collect feedback via surveys and bug reports.

**Playtest focus areas:**

1. **New card balance:** Do new cards feel fair? Are any cards obviously overpowered or useless?
2. **Faction identity:** Do new faction cards feel thematically distinct? Does the exclusive mechanic create interesting gameplay?
3. **Meta diversity:** Are multiple deck archetypes viable, or does one strategy dominate?
4. **UI/UX:** Are card effects clear? Is the evolution flow intuitive? Any confusing interactions?
5. **Bug hunting:** Look for crashes, soft locks, incorrect stat calculations, visual glitches.

**Feedback collection:** Google Forms survey + Discord channel for bug reports and discussion.

**Iteration:** Design team reviews feedback after each playtest session. High-priority issues are fixed before next session. Balance adjustments are tested in subsequent playtests.

---

## 6. Content Pipeline Tooling Summary

### 6a. Required Tools

| Tool | Purpose | Status |
|---|---|---|
| **Card Template Creation Tool** | Web UI for designing card specs with live balance validation | 🔲 To build |
| **Batch Generation Script** | Automated pipeline for FLUX + GPT-4o Mini batch generation | 🔲 To build |
| **Automated QA Script** | Validation checks for PP budgets, stat ranges, image quality | 🔲 To build |
| **Human Review UI** | Web UI for approving/rejecting generated cards | 🔲 To build |
| **CSV Import Pipeline** | Batch import CardTemplates from CSV to database | 🔲 To build |
| **Balance Validation Script** | Automated balance checks for card collections | 🔲 To build |
| **Game Simulation Engine** | AI vs. AI battle simulator for statistical balance testing | 🔲 To build |
| **Art Quality Check Script** | Automated image validation (resolution, composition, etc.) | 🔲 To build |
| **CI/CD Test Suite** | Automated regression tests for game logic and card interactions | 🔲 To build |

### 6b. Development Priorities

**Phase 1 (Pre-launch, critical path):**

1. Card Template Creation Tool (2 weeks)
2. Batch Generation Script (1 week)
3. Automated QA Script (1 week)
4. Human Review UI (2 weeks)
5. CSV Import Pipeline (1 week)

**Phase 2 (Post-launch, continuous improvement):**

6. Balance Validation Script (1 week)
7. Game Simulation Engine (3-4 weeks)
8. Art Quality Check Script (1 week)

**Phase 3 (Ongoing, maintenance):**

9. CI/CD Test Suite (ongoing, incremental)

---

## 7. Cost Projections

### 7a. Launch Content (One-Time)

| Item | Cost |
|---|---|
| 360 faction cards (art + text + regeneration) | ~$11 |
| 7 universal stabilizers | ~$0.20 |
| 9-12 starter avatars (3-4 per faction) | ~$0.30 |
| **Total launch content** | **~$11.50** |

### 7b. Quarterly Content Releases (Recurring)

| Item | Cost per Quarter |
|---|---|
| 60-90 new cards (art + text + regeneration) | ~$9-14 |
| 2-3 seasonal event avatars | ~$0.10-0.50 |
| **Total per quarter** | **~$10-15** |

### 7c. Annual Content Releases (Recurring)

| Item | Cost per Year |
|---|---|
| Quarterly releases × 4 | ~$40-60 |
| 1 new faction (110-155 cards + avatars) | ~$35-50 |
| **Total per year** | **~$75-110** |

### 7d. Player-Driven Costs (Variable, Subscriber-Driven)

| Tier | Evolutions per Month (avg) | Cost per Evolution | Monthly AI Cost per Player |
|---|---|---|---|
| Free | 3-5 | $0.02 (FLUX Kontext Dev + GPT-4o Mini) | ~$0.06-0.10 |
| Mid | 8-12 | $0.04 (FLUX Kontext Pro + GPT-4o Mini) | ~$0.32-0.48 |
| Top | 15-25 | $0.04-0.08 (FLUX Kontext Pro 1-2 passes + GPT-4o Mini) | ~$0.60-2.00 |

**Subscriber AI cost coverage:**

- Mid tier ($5-8/mo): Avg AI cost per player ~$0.40/mo. Subscription revenue covers 12-20× AI cost.
- Top tier ($10-15/mo): Avg AI cost per player ~$1.30/mo. Subscription revenue covers 8-12× AI cost.

**Conclusion:** Player-driven evolution costs are well-covered by subscription revenue. Even top-tier players who evolve 25 cards/month cost <$2 in AI API fees, while contributing $10-15 in recurring revenue. This leaves ample margin for cloud storage, server costs, and development.

---

## 8. Timeline Summary

### 8a. Pre-Launch Content Generation

| Milestone | Duration | Cumulative Time |
|---|---|---|
| Design all 367 card templates | 3-4 weeks | 3-4 weeks |
| Batch generate art + text | 1-2 days (waiting on batch API) | 3-4 weeks |
| Automated QA + human review | 1-2 weeks | 5-6 weeks |
| Database import + CDN upload | 1-2 days | 5-6 weeks |
| **Total pre-launch content pipeline** | | **5-6 weeks** |

### 8b. Post-Launch Content Cadence

| Release Type | Timeline |
|---|---|
| Quarterly card packs | Every 3 months: 6-8 weeks of design/generation/QA, release on schedule |
| Monthly balance patches | Every month: 1-2 weeks of data analysis + playtesting, deploy mid-month |
| Seasonal events | Every 6 weeks: 1 week of design/content creation, 2-week event duration |
| Annual new faction | 6-9 months of development, release at start of new ranked season |

---

## 9. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| **FLUX API rate limits or downtime** | Delays batch generation | Medium | Use multiple API providers (Replicate + Fal.ai), implement retry logic with exponential backoff |
| **Low-quality AI art in batch** | Increases human review workload | Medium | Strengthen automated quality checks (composition, faction consistency), regenerate liberally (cost is negligible) |
| **Balance outliers post-release** | Meta becomes stale or warped | High (inevitable) | Monthly balance patches, active community feedback channels, designer playtesting before release |
| **New faction development overruns** | Delays annual content roadmap | Medium | Start faction development 9-12 months before target release, buffer timeline by 25% |
| **Player-driven AI costs exceed projections** | Higher infrastructure costs than expected | Low | Monitor usage closely, implement rate limiting if needed (max evolutions/day per player), adjust shard costs if usage spikes |
| **Modifier pool exhaustion** | Running out of fresh modifier designs for new factions | Low (years away) | Each new faction adds 48 modifiers. At 1 faction/year, will take 5+ years to exhaust design space. Revisit in Year 3. |

---

## 10. Future Expansion Ideas

### 10a. Community-Driven Content (Year 2+)

**Concept:** Allow players to submit card designs (stats, keywords, archetypes) via a community portal. AI generates art + text for approved designs. Top-voted designs are added to the game in special "Community Pack" releases.

**Benefits:** Deep player engagement, crowdsourced creativity, reduces internal design workload.

**Challenges:** Moderation workload (filter inappropriate submissions), balance review (community designs may be overpowered or underpowered), credit attribution (how to credit original designers).

**Timeline:** Year 2 feature, after core content pipeline is stable.

### 10b. Faction Crossover Events (Year 2+)

**Concept:** Limited-time events where players can use cards from multiple factions in the same deck. New hybrid modifiers that reference multiple faction mechanics (e.g., "Augment + Bond: +1 ATK per Augment modifier, +1 HP for each adjacent Bond creature").

**Benefits:** Shake up meta, explore new design space, reward players who unlock multiple factions.

**Challenges:** Deck construction rule changes (UI updates, validation logic), balance complexity (cross-faction synergies hard to predict), dilutes faction identity if overused.

**Timeline:** Year 2+ feature, one-off events only (not permanent mode).

### 10c. AI-Generated Lore and Quests (Year 3+)

**Concept:** Use LLMs (GPT-4o or similar) to generate quest narratives, event flavor text, and avatar backstories dynamically. Players experience unique story beats based on their faction, avatar, and card collection.

**Benefits:** Personalized narrative experience, scalable content generation, deeper world-building.

**Challenges:** Quality control (LLM-generated text can be generic or incoherent), cost (text generation is cheap but scales with player base), narrative consistency (hard to maintain lore continuity with generative text).

**Timeline:** Year 3+ R&D project, experimental feature.

---

## Appendix A: Faction Art Prompt Prefixes

**The Ironwright Collective:**

```
steampunk fantasy art, brass and copper tones, gears and steam, industrial cathedral aesthetic, mechanical precision, clockwork details, riveted metal plating, warm amber lighting, Victorian-era industrial design, intricate engineering
```

**The Fey Courts:**

```
ancient forest fantasy art, bioluminescent flora, ethereal glow, organic textures, moss and bark, glowing fungi, antlers and nature spirits, deep green and blue tones, mystical atmosphere, living wood and stone, mycelial networks
```

**The Demonic Kingdoms:**

```
dark fantasy art, hellfire and obsidian, blood rituals, corrupted flesh, crimson and black tones, volcanic rock, demonic architecture, sharp angles and spikes, glowing red eyes, cracked skin leaking energy, infernal atmosphere
```

---

## Appendix B: Example Card Generation Prompt (Full)

**Card spec:**

- Faction: The Ironwright Collective
- Type: Creature
- CM cost: 4
- Base instability: 2 (balanced)
- ATK: 4
- HP: 5
- Keywords: Shield
- Visual archetype: "armored war golem"

**FLUX Dev text-to-image prompt:**

```
steampunk fantasy art, brass and copper tones, gears and steam, industrial cathedral aesthetic, mechanical precision, clockwork details, riveted metal plating, warm amber lighting. An armored war golem, towering humanoid construct, reinforced plating with visible rivets, glowing core, symmetrical design, protective stance, heavy shield integrated into left arm. Portrait orientation, centered subject, dark background, single creature focus, card game art style.
```

**GPT-4o Mini name + flavor text prompt:**

```
System: You are a card name and flavor text generator for Chaos Creatures, an AI-generated card game. Generate concise, evocative card names (2-4 words) and flavor text (1-2 sentences, <140 characters) that match the faction's voice and the card's mechanical identity.

User:
Faction: The Ironwright Collective
Faction voice: Industrial, pragmatic, references engineering and invention. Names use mechanical compound words, references to metals/gears/steam. Flavor text emphasizes function, craftsmanship, and the fusion of magic and machinery.
Creature archetype: armored war golem
Stats: 4 ATK / 5 HP, 4 chaos mote cost
Instability: 2 (balanced, defensive)
Keywords: Shield
Visual description: Towering humanoid construct, reinforced plating with visible rivets, glowing core, heavy shield integrated into left arm

Generate:
1. Card name (2-4 words)
2. Flavor text (1-2 sentences, <140 characters)

Output as JSON:
{"name": "...", "flavor_text": "..."}
```

**Expected output:**

```json
{
  "name": "Aegis-Forged Sentinel",
  "flavor_text": "Commissioned by the High Engineer to guard the Foundry Gates. Its shield has never been breached."
}
```

---

## Appendix C: Balance Validation Checklist

Use this checklist when manually reviewing flagged cards or designing new cards.

**Creature cards:**

- [ ] PP budget: (ATK + HP + keyword_cost) == base_PP ± 1
- [ ] ATK and HP within stat range for CM cost (see Section 12 table in `01-battle-mechanics.md`)
- [ ] Instability coherence: low instability (0-1) → HP ≥ ATK, high instability (4-5) → ATK ≥ HP
- [ ] Keywords: ≤1 keyword at Common (unless high PP allows), no nonsensical combinations (e.g., Flying + Reach)
- [ ] Name: 3-30 characters, faction-appropriate, memorable
- [ ] Flavor text: 1-200 characters, faction voice, engaging
- [ ] Art: clear subject, centered composition, matches faction aesthetic

**Spell cards:**

- [ ] Effect power matches CM cost (see spell ranges in Section 12)
- [ ] Target type is valid and makes sense for effect
- [ ] Duration is appropriate (instant spells = no duration, buffs = THIS_TURN or PERMANENT)
- [ ] Name: clear, descriptive of effect
- [ ] Flavor text: evocative, faction voice

**Stabilizer cards:**

- [ ] Instability modification is balanced (±1-2 instability per turn, or set to fixed value 5-15)
- [ ] HP (if board stabilizer): 2-4 HP, appropriate for CM cost
- [ ] Can be destroyed (no indestructible stabilizers)
- [ ] Name: clear function, thematic
- [ ] Flavor text: explains the instability manipulation lore-wise

---

**End of Document**

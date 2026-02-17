# Audit W2C: Database & Security

**Auditor**: Claude Code (automated)
**Date**: 2026-02-17
**Source of truth**: `docs/design/02-card-data-model.md`
**Migration files audited**: 00001 through 00014 (14 files)
**Additional files**: `supabase/seed.sql`, `supabase/config.toml`

---

## Summary

| Metric | Count |
|---|---|
| Entities in doc 02 | 14 persistent entities (+ 7 runtime-only) |
| Tables in migrations | 22 |
| Enum types in SQL | 27 |
| Enum types in doc 02 | 24 |
| RLS-enabled tables | 21 of 22 |
| Tables missing RLS policies | 1 (`matches` has RLS enabled but zero policies for any role) |
| Indexes defined | 33 |
| Triggers defined | 3 (updated_at on players, decks, economy_config) |
| Stored procedures / RPCs | 5 (add_chaos_dust, add_shards, reset_season_ranks, increment_chaos_energy, update_updated_at_column) |
| Critical issues | 4 |
| High issues | 6 |
| Medium issues | 11 |

---

## Table Inventory

All 22 tables across all migrations:

| # | Table | Migration | Doc 02 Entity |
|---|---|---|---|
| 1 | `factions` | 00002 | Section 10 (Faction) |
| 2 | `avatars` | 00002 | Section 9 (Avatar) |
| 3 | `card_templates` | 00002 | Section 1 (CardTemplate) |
| 4 | `players` | 00002 | Section 12 (Player) |
| 5 | `card_instances` | 00002 | Section 2 (CardInstance) |
| 6 | `decks` | 00002 | Section 11 (Deck) |
| 7 | `modifier_definitions` | 00002 | Section 4a (ModifierDefinition) |
| 8 | `event_definitions` | 00002 | Section 8 (EventDefinition) |
| 9 | `match_records` | 00003 | Section 14 (MatchRecord) |
| 10 | `matchmaking_queue` | 00003 | N/A (doc 06 operational) |
| 11 | `economy_config` | 00004 | N/A (doc 06 operational) |
| 12 | `shard_transactions` | 00004 | Section 15 (ShardTransaction) |
| 13 | `dust_transactions` | 00004 | N/A (implicit from Player.chaos_dust) |
| 14 | `friend_requests` | 00005 | N/A (supplements Player.friend_ids) |
| 15 | `achievements` | 00006 | Section 17 (Achievement) |
| 16 | `player_achievements` | 00006 | Section 17 (PlayerAchievement) |
| 17 | `missions` | 00006 | Section 16 (Mission) |
| 18 | `quest_templates` | 00006 | N/A (doc 04 operational) |
| 19 | `generation_jobs` | 00007 | N/A (doc 06 operational) |
| 20 | `seasons` | 00008 | N/A (doc 04 operational) |
| 21 | `battle_pass_progress` | 00008 | N/A (doc 04 operational) |
| 22 | `rank_history` | 00008 | N/A (doc 04 operational) |
| (admin) | `rate_limit_log` | 00009 | N/A (doc 06 operational) |
| (admin) | `admin_audit_log` | 00009 | N/A (doc 06 operational) |
| (live) | `matches` | 00013 | N/A (live match tracking) |

**Total: 25 tables** (including admin and live match tables).

---

## Schema Completeness

### factions
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **Extra columns**: `created_at` (acceptable metadata addition)
- **FK constraints**: None needed (root entity)
- **Issues**: None

### avatars
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **Extra columns**: `created_at` (acceptable)
- **FK constraints**: `faction_id -> factions(id)` -- correct
- **Issues**: `unlock_condition` stored as JSONB rather than typed enum. Acceptable since doc 02 defines `UnlockCondition` as a union type with parameters (e.g., `FACTION_MASTERY(level)`, `CHAOS_DUST(cost)`) -- JSONB is the pragmatic choice.

### card_templates
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **Extra columns**: `created_at` (acceptable)
- **FK constraints**: `faction_id -> factions(id)` -- correct
- **Issues**: None. `base_keywords` as `TEXT[]` matches doc 02's `Keyword[]`. `spell_effect` as JSONB correctly handles the complex `SpellEffect` type. `batch_id` is `TEXT` (not UUID FK) which is fine since batches are pipeline metadata, not a separate table.

### players
- **Status**: COMPLETE
- **Columns match doc 02**: YES (with appropriate adaptations)
- **Missing columns**: None significant
- **Extra columns**: `auth_id` (UUID FK to `auth.users` -- required for Supabase auth integration, not in doc 02 but essential), `hidden_mmr` (matchmaking operational data), `created_at`/`updated_at`
- **FK constraints**: `auth_id -> auth.users(id) ON DELETE CASCADE`, `primary_faction_id -> factions(id)` -- correct
- **Issues**:
  - Doc 02 specifies `apple_id: string` but the SQL uses `auth_id UUID REFERENCES auth.users(id)` instead. This is correct -- Supabase handles Apple Sign-In through its auth layer, so `auth_id` replaces `apple_id`. **No action needed.**
  - `faction_mastery` (doc 02 Section 12) is not stored as a column or separate table. This data would need to be tracked somewhere -- either as a JSONB column on `players` or as a separate `faction_mastery` table. **HIGH: Missing `faction_mastery` data storage.**
  - `settings` stored as JSONB -- matches doc 02's `PlayerSettings` sub-object. All 17 settings fields from doc 02 are present in the default JSONB. Correct.
  - `season_rank` is `TEXT` with no CHECK constraint against valid rank values. The enum `season_rank_enum` exists in 00001 but is not used. **MEDIUM: No validation on season_rank values.**
  - `highest_tier_reached` is `TEXT` with no CHECK constraint. **MEDIUM: No validation on highest_tier_reached values.**

### card_instances
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **Extra columns**: None
- **FK constraints**: `template_id -> card_templates(id)`, `owner_id -> players(id) ON DELETE CASCADE` -- correct
- **Issues**:
  - `evolution_history`, `modifiers`, `triggered_abilities` stored as JSONB arrays. This is a deliberate denormalization for single-row reads (noted in migration comments). Per doc 02 Sections 3-5, these are separate entity types. The trade-off is acceptable for performance but means no FK enforcement on nested IDs (e.g., `modifier_chosen_id`, `definition_id`). **MEDIUM: No referential integrity for JSONB-embedded entities.**
  - `instability_value` has no CHECK constraint for minimum 0 (doc 02 says "clamped minimum 0"). **MEDIUM: Missing CHECK constraint `instability_value >= 0`.**

### decks
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **Extra columns**: None
- **FK constraints**: `owner_id -> players(id) ON DELETE CASCADE`, `faction_id -> factions(id)`, `avatar_id -> avatars(id)` -- correct
- **Issues**:
  - `card_entries` stored as JSONB array of `{card_instance_id, quantity}`. No FK enforcement on embedded `card_instance_id` values. **MEDIUM: No referential integrity for deck entries.** Validation must be done at the application layer.

### modifier_definitions
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **Extra columns**: `created_at` (acceptable)
- **FK constraints**: `faction_id -> factions(id)` -- correct
- **Issues**: None. All 15 fields from doc 02 Section 4a are present with correct types and constraints. `base_effect` and `attuned_effect` as JSONB correctly handle the complex `Effect` type (Section 7).

### event_definitions
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **Extra columns**: `created_at` (acceptable)
- **FK constraints**: None needed (root reference data)
- **Issues**: `id` is `TEXT PRIMARY KEY` (e.g., "O1", "C1") which matches doc 02's convention. Correct.

### match_records
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **Extra columns**: None
- **FK constraints**: `player_1_id -> players(id)`, `player_2_id -> players(id)`, `winner_id -> players(id)`, `loser_id -> players(id)` -- correct. **However**: `player_1_deck_id`, `player_2_deck_id`, `player_1_avatar_id`, `player_2_avatar_id`, `player_1_faction_id`, `player_2_faction_id` have **no FK constraints**. These are UUID columns that logically reference `decks(id)`, `avatars(id)`, and `factions(id)`.
- **Issues**:
  - **HIGH: 6 columns missing FK constraints** on deck/avatar/faction IDs. While this avoids cascade issues if a deck is deleted after a match, it allows invalid UUIDs. At minimum, these should reference the parent tables without cascade behavior (or be snapshotted as TEXT).
  - `player_1_rank` and `player_2_rank` are `TEXT` with no CHECK constraint against valid rank values. **MEDIUM: No validation on rank values.**
  - `cards_played` and `full_log` as JSONB arrays -- correct for complex nested data.

### matchmaking_queue
- **Status**: COMPLETE (operational table, not in doc 02)
- **FK constraints**: `player_id -> players(id)` (UNIQUE), `deck_id -> decks(id)` -- correct
- **Issues**: None

### economy_config
- **Status**: COMPLETE (operational table, not in doc 02)
- **Issues**: None

### shard_transactions
- **Status**: COMPLETE
- **Columns match doc 02**: PARTIAL
- **Missing columns**: None
- **Extra columns**: None
- **FK constraints**: `player_id -> players(id) ON DELETE CASCADE` -- correct
- **Issues**:
  - `shard_tier` is `TEXT NOT NULL` with **no CHECK constraint** against valid shard tier values ('UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'). The `shard_tier_enum` type exists in 00001 but is not used here. **HIGH: No validation on shard_tier values.**
  - `source` is `TEXT NOT NULL` with **no CHECK constraint** against valid `ShardSource` enum values. **HIGH: No validation on source values.**

### dust_transactions
- **Status**: N/A (not explicitly in doc 02, but implied by Chaos Dust economy)
- **Issues**: No CHECK constraints on `source` values. Acceptable since dust sources may expand over time.

### friend_requests
- **Status**: COMPLETE (supplements doc 02's Player.friend_ids)
- **FK constraints**: `sender_id -> players(id) ON DELETE CASCADE`, `receiver_id -> players(id) ON DELETE CASCADE` -- correct
- **Issues**: None. Good constraint design with `no_self_friend` and `unique_friend_request`.

### achievements
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Missing columns**: None
- **FK constraints**: None needed (root reference data)
- **Issues**: None

### player_achievements
- **Status**: COMPLETE
- **Columns match doc 02**: YES
- **Extra columns**: `id` (UUID PK -- doc 02 implies composite PK of `player_id + achievement_id` but having a surrogate key plus unique constraint is fine)
- **FK constraints**: `player_id -> players(id) ON DELETE CASCADE`, `achievement_id -> achievements(id) ON DELETE CASCADE` -- correct. UNIQUE constraint on `(player_id, achievement_id)` -- correct.
- **Issues**: None

### missions
- **Status**: PARTIAL
- **Columns match doc 02**: PARTIAL
- **Differences from doc 02 Section 16**:
  - Doc 02 has `reward_type: RewardType` (XP | SHARDS | CHAOS_ENERGY_BOOST) and `reward_amount: int` -- SQL has `reward_dust: int` and `reward_shard_tier: TEXT` and `reward_shard_count: int` instead. These are more specific but do not match doc 02's schema exactly.
  - SQL adds `difficulty` (EASY | MEDIUM | HARD) and `period` (DAILY | WEEKLY | ONBOARDING) -- not in doc 02 Section 16 but defined in doc 04.
  - Doc 02 has `mission_type` with CHECK against `MissionType` enum -- SQL has `mission_type TEXT NOT NULL` with **no CHECK constraint**. **MEDIUM: No validation on mission_type values.**
- **Issues**: The schema diverges from doc 02 in reward structure, but the SQL version is arguably more practical. **MEDIUM: Reward column structure differs from doc 02 spec.**

### quest_templates
- **Status**: N/A (operational table from doc 04, not in doc 02)
- **Issues**: None

### generation_jobs
- **Status**: N/A (operational table from doc 06, not in doc 02)
- **FK constraints**: `player_id -> players(id)`, `card_instance_id -> card_instances(id)` -- correct
- **Issues**: None

### seasons
- **Status**: N/A (operational table from doc 04)
- **Issues**: None

### battle_pass_progress
- **Status**: N/A (operational table from doc 04)
- **FK constraints**: `player_id -> players(id)`, `season_id -> seasons(id)` -- correct. UNIQUE on `(player_id, season_id)` -- correct.
- **Issues**: None

### rank_history
- **Status**: N/A (operational table from doc 04)
- **FK constraints**: `player_id -> players(id) ON DELETE CASCADE`, `season_id -> seasons(id)` -- correct. UNIQUE on `(player_id, season_id)` -- correct.
- **Issues**: None

### rate_limit_log
- **Status**: N/A (admin operational table)
- **FK constraints**: `player_id -> players(id) ON DELETE CASCADE` -- correct
- **Issues**: None

### admin_audit_log
- **Status**: N/A (admin operational table)
- **Issues**: None

### matches (00013)
- **Status**: COMPLETE (live match tracking, supplementary to match_records)
- **FK constraints**: `player_1_id -> players(id)`, `player_2_id -> players(id)`, `player_1_deck_id -> decks(id)`, `player_2_deck_id -> decks(id)` -- correct
- **Issues**: See RLS section -- **CRITICAL: No access policies defined.**

---

## Entities in Doc 02 NOT Represented as Separate Tables

These doc 02 entities are stored as JSONB within parent tables rather than as standalone relational tables:

| Doc 02 Entity | Storage Location | Notes |
|---|---|---|
| EvolutionRecord (Section 3) | `card_instances.evolution_history` JSONB | Denormalized for single-row read performance |
| ModifierInstance (Section 4b) | `card_instances.modifiers` JSONB | Denormalized |
| TriggeredAbility (Section 5) | `card_instances.triggered_abilities` JSONB | Denormalized |
| SpellEffect (Section 6) | `card_templates.spell_effect` JSONB | Complex nested type |
| Effect (Section 7) | Various JSONB columns | Universal effect schema |
| DeckEntry (Section 11) | `decks.card_entries` JSONB | Avoids junction table |
| FactionMastery (Section 12) | **NOT STORED ANYWHERE** | **HIGH ISSUE** |
| PlayerSettings (Section 12) | `players.settings` JSONB | Reasonable |
| GameState (Section 13) | In-memory only (runtime) | Correct per doc 02 |
| BattlePlayer, BattleCreature, etc. | In-memory only (runtime) | Correct per doc 02 |
| CardPlayRecord (Section 14) | `match_records.cards_played` JSONB | Correct |

---

## Enum Audit

### Enums defined in SQL (00001_enums.sql) vs Doc 02

| SQL Enum Type | Doc 02 Source | Values Match | Notes |
|---|---|---|---|
| `card_type_enum` | Section 1: CardType | YES | CREATURE, SPELL, STABILIZER |
| `keyword_enum` | Section 1: Keyword | YES | All 7 keywords match |
| `stabilizer_type_enum` | Section 1: StabilizerType | YES | ORDER, CHAOS, HYBRID |
| `evolution_tier_enum` | Section 2: EvolutionTier | YES | COMMON through LEGENDARY |
| `event_type_enum` | Section 3: EventType | YES | ORDER, CHAOS |
| `shard_tier_enum` | Section 3: ShardTier | YES | UNCOMMON through LEGENDARY |
| `shard_quality_enum` | Section 3: ShardQuality | YES | PLANAR, REFINED, PRISMATIC |
| `modifier_pool_type_enum` | Section 4a: ModifierPoolType | YES | UNIVERSAL, FACTION |
| `tier_bracket_enum` | Section 4a: TierBracket | YES | EARLY, LATE |
| `faction_mechanic_enum` | Section 4a/10: FactionMechanic | YES | AUGMENT, BOND, CORRUPTION |
| `trigger_type_enum` | Section 5: TriggerType | YES | All 7 trigger types match |
| `spell_effect_type_enum` | Section 6: SpellEffectType | YES | All 13 values match |
| `target_type_enum` | Section 6: TargetType | YES | All 17 values match |
| `duration_enum` | Section 6: Duration | YES | All 4 values match |
| `effect_type_enum` | Section 7: EffectType | YES | All 14 values match |
| `subscription_tier_enum` | Section 12: SubscriptionTier | YES | FREE, MID, HIGH |
| `season_rank_enum` | Section 12: SeasonRank | YES | All 17 ranks match |
| `colorblind_mode_enum` | Section 12: ColorblindMode | YES | NONE + 3 modes |
| `quality_level_enum` | Section 12: QualityLevel | YES | FULL, REDUCED, MINIMAL |
| `game_mode_enum` | Section 14: GameMode | YES | RANKED, CASUAL, PRACTICE |
| `end_reason_enum` | Section 14: EndReason | YES | HP_ZERO, SURRENDER, DISCONNECT, TIMEOUT |
| `mission_type_enum` | Section 16: MissionType | YES | All 10 values match |
| `reward_type_enum` | Section 16: RewardType | YES | XP, SHARDS, CHAOS_ENERGY_BOOST |
| `shard_source_enum` | Section 15: ShardSource | YES | All 9 values match |
| `achievement_category_enum` | Section 17: AchievementCategory | YES | All 5 categories match |

### Extra SQL enums NOT in doc 02 (from doc 04/06):

| SQL Enum Type | Source | Notes |
|---|---|---|
| `mission_difficulty_enum` | doc 06 Section 3 | EASY, MEDIUM, HARD |
| `mission_period_enum` | doc 06 Section 3 | DAILY, WEEKLY, ONBOARDING |
| `generation_job_type_enum` | doc 06 Section 3 | 4 job types |
| `generation_job_status_enum` | doc 06 Section 3 | 5 statuses |

### CRITICAL Enum Issue: Enums defined but NOT used by tables

All 27 SQL enum types are defined in 00001_enums.sql but **NONE of them are actually used as column types**. Every table uses `TEXT + CHECK(...)` constraints instead. The migration file itself notes this:

> "The tables in subsequent migrations use TEXT + CHECK constraints (matching doc 06 Section 3), but we also create these types for reference, validation in functions, and potential future use in stricter typing."

**This is not inherently wrong** -- TEXT + CHECK is a valid Supabase/Postgres pattern and avoids enum migration pain. However, it means:
1. The 27 enum types add schema clutter with no functional purpose
2. Several TEXT columns are **missing CHECK constraints** that the enum types would have enforced (see Critical Issues)
3. The enums and CHECK constraints can drift out of sync

**Recommendation**: Either (a) use the enum types as column types, or (b) remove the enum types and ensure all TEXT columns have proper CHECK constraints. The current hybrid approach is the worst of both worlds.

---

## RLS Policy Audit

### factions
- **RLS enabled**: YES
- **SELECT**: Anyone can read (public) -- CORRECT for global reference data
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### avatars
- **RLS enabled**: YES
- **SELECT**: Anyone can read (public) -- CORRECT for global reference data
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### card_templates
- **RLS enabled**: YES
- **SELECT**: Anyone can read (public) -- CORRECT for global reference data
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### players
- **RLS enabled**: YES
- **SELECT**: Two policies: (1) "Players can read own data" via `auth.uid() = auth_id`, (2) "Public profile read" via `USING (true)` -- effectively allows all authenticated users to read all player rows
- **INSERT**: No explicit INSERT policy. New player rows must be created by service role.
- **UPDATE**: "Players can update own data" via `auth.uid() = auth_id` -- CORRECT
- **DELETE**: No explicit DELETE policy (service role only) -- CORRECT
- **Issues**:
  - **HIGH: "Public profile read" policy allows reading ALL columns of ALL players.** This exposes sensitive data: `chaos_dust`, `shards_uncommon/rare/epic/legendary`, `settings` (including privacy flags), `friend_ids`, `auth_id`, `subscription_tier`. Doc 02 Section 12 has `hide_profile` and `hide_online_status` settings, but the RLS policy ignores them. The policy should either: (a) restrict public read to specific columns (display_name, season_rank, showcase_card_ids) using a view, or (b) filter by `settings->>'hide_profile' != 'true'`.
  - The "Players can read own data" policy is redundant with "Public profile read" since the public read already grants `USING (true)`.

### card_instances
- **RLS enabled**: YES
- **SELECT**: Players read own cards via subquery `auth.uid() = (SELECT auth_id FROM players WHERE id = owner_id)` -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**:
  - No INSERT policy for players. Card instances must be created by service role (edge functions/game server). This is correct for security -- players should not directly insert cards.
  - The subquery pattern `(SELECT auth_id FROM players WHERE id = owner_id)` is executed per-row. For large collections, this could be slow. Consider a materialized join or denormalizing `auth_id` onto `card_instances`. **MEDIUM: Performance concern on RLS subquery.**

### decks
- **RLS enabled**: YES
- **SELECT**: Players read own decks via subquery -- CORRECT
- **ALL**: "Players manage own decks" via same subquery -- **allows INSERT, UPDATE, DELETE by deck owner**
- **ALL**: Service role full access -- CORRECT
- **Issues**:
  - The "Players manage own decks" policy uses `FOR ALL` which grants INSERT, UPDATE, DELETE, and SELECT. This is appropriate -- players should be able to create, edit, and delete their own decks.
  - However, the `FOR ALL` policy only has a `USING` clause, not a `WITH CHECK` clause for INSERT/UPDATE. This means a player could potentially INSERT a deck with a different `owner_id`. **HIGH: Missing `WITH CHECK` on deck insert/update policy.** The policy should include `WITH CHECK (auth.uid() = (SELECT auth_id FROM players WHERE id = owner_id))` to prevent a player from creating decks assigned to another player.

### modifier_definitions
- **RLS enabled**: YES
- **SELECT**: Anyone can read -- CORRECT for global game content
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### event_definitions
- **RLS enabled**: YES
- **SELECT**: Anyone can read -- CORRECT for global game content
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### match_records
- **RLS enabled**: YES
- **SELECT**: Players read matches where they are player_1 or player_2 via subquery -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None. Good security -- match data is only accessible by participants.

### matchmaking_queue
- **RLS enabled**: YES
- **ALL**: Players manage own queue entry via subquery -- CORRECT (players need to insert/delete their queue entry)
- **ALL**: Service role full access -- CORRECT
- **Issues**:
  - Same `FOR ALL` without `WITH CHECK` concern as decks. A player could theoretically insert a queue entry with a different `player_id`. **MEDIUM: Missing `WITH CHECK` on matchmaking insert.**

### economy_config
- **RLS enabled**: YES
- **SELECT**: Anyone can read -- CORRECT (config values are not secret)
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### shard_transactions
- **RLS enabled**: YES
- **SELECT**: Players read own transactions via subquery -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT (only server can create transactions)
- **Issues**: None. Economic table correctly locked to service role for writes.

### dust_transactions
- **RLS enabled**: YES
- **SELECT**: Players read own transactions via subquery -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None. Economic table correctly locked to service role for writes.

### missions
- **RLS enabled**: YES
- **SELECT**: Players read own missions via subquery -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### achievements
- **RLS enabled**: YES
- **SELECT**: Anyone can read -- CORRECT for global reference data
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### player_achievements
- **RLS enabled**: YES
- **SELECT**: Players read own achievement progress via subquery -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### quest_templates
- **RLS enabled**: YES
- **SELECT**: Anyone can read -- CORRECT for global reference data
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### generation_jobs
- **RLS enabled**: YES
- **SELECT**: Players read own generation jobs via subquery -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None. Card generation tables correctly restricted.

### seasons
- **RLS enabled**: YES
- **SELECT**: Anyone can read -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### battle_pass_progress
- **RLS enabled**: YES
- **SELECT**: Players read own battle pass via subquery -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### rank_history
- **RLS enabled**: YES
- **SELECT**: Players read own rank history via subquery -- CORRECT
- **INSERT/UPDATE/DELETE**: Service role only -- CORRECT
- **Issues**: None

### friend_requests
- **RLS enabled**: YES
- **SELECT**: Players read requests where they are sender or receiver -- CORRECT
- **INSERT**: Players can only create requests where they are the sender -- CORRECT
- **UPDATE**: Only receiver can respond -- CORRECT
- **ALL**: Service role full access -- CORRECT
- **Issues**: None. Well-designed policy with appropriate granularity.

### rate_limit_log
- **RLS enabled**: YES
- **ALL**: Service role only -- CORRECT
- **Issues**: None

### admin_audit_log
- **RLS enabled**: YES
- **ALL**: Service role only -- CORRECT
- **Issues**: None

### matches (00013)
- **RLS enabled**: YES
- **Policies**: **NONE defined.** The migration comment says "No public policies -- only accessible via service role key" but there is no explicit service role policy either.
- **Issues**: **CRITICAL: No policies at all.** With RLS enabled and no policies, this table is completely inaccessible to everyone, including the service role via normal queries. The service role bypasses RLS by default in Supabase, so this technically works, but it should have an explicit `FOR ALL USING (auth.role() = 'service_role')` policy for clarity and safety. If the Supabase configuration ever changes the service role bypass behavior, this table becomes a black hole.

---

## Index Audit

### Indexes Present (33 total)

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_card_instances_owner` | card_instances | (owner_id) | Player collection lookup |
| `idx_card_instances_owner_template` | card_instances | (owner_id, template_id) | Player cards by template |
| `idx_card_instances_evolution_ready` | card_instances | (owner_id, tier, chaos_energy) | Evolution-ready query |
| `idx_card_templates_faction` | card_templates | (faction_id) | Templates by faction |
| `idx_card_templates_type` | card_templates | (card_type) | Templates by type |
| `idx_match_records_p1` | match_records | (player_1_id, started_at DESC) | P1 match history |
| `idx_match_records_p2` | match_records | (player_2_id, started_at DESC) | P2 match history |
| `idx_match_records_season` | match_records | (season_id, started_at DESC) | Season match lookup |
| `idx_missions_player` | missions | (player_id, is_completed, expires_at) | Active missions |
| `idx_shard_tx_player` | shard_transactions | (player_id, created_at DESC) | Shard history |
| `idx_dust_tx_player` | dust_transactions | (player_id, created_at DESC) | Dust history |
| `idx_generation_jobs_status` | generation_jobs | (status, priority DESC, created_at) | Worker job polling |
| `idx_generation_jobs_player` | generation_jobs | (player_id, created_at DESC) | Player gen history |
| `idx_rate_limit_player_action` | rate_limit_log | (player_id, action, created_at DESC) | Rate limit lookup |
| `idx_decks_owner` | decks | (owner_id) | Player deck lookup |
| `idx_modifier_defs_pool` | modifier_definitions | (pp_cost, tier_bracket, attunement, pool_type) | Modifier pool query |
| `idx_modifier_defs_faction` | modifier_definitions | (faction_id) WHERE faction_id IS NOT NULL | Faction modifier lookup |
| `idx_avatars_faction` | avatars | (faction_id) | Avatars by faction |
| `idx_player_achievements_player` | player_achievements | (player_id) | Achievement progress |
| `idx_friend_requests_receiver` | friend_requests | (receiver_id, status) | Incoming requests |
| `idx_friend_requests_sender` | friend_requests | (sender_id, status) | Outgoing requests |
| `idx_battle_pass_player_season` | battle_pass_progress | (player_id, season_id) | BP progress |
| `idx_rank_history_player` | rank_history | (player_id, season_id) | Rank history |
| `idx_matchmaking_queue_order` | matchmaking_queue | (queued_at ASC) | Queue ordering |
| `idx_matchmaking_queue_mmr` | matchmaking_queue | (hidden_mmr, queued_at ASC) | MMR-based matching |
| `idx_players_rank_points` | players | (season_rank_points DESC) | Leaderboard |
| `idx_players_friend_code` | players | (friend_code) | Friend code lookup |
| `idx_admin_audit_log_created` | admin_audit_log | (created_at DESC) | Audit log chronological |
| `idx_admin_audit_log_target` | admin_audit_log | (target_type, target_id) | Audit by target |

### Missing Indexes

| Query Pattern (doc 02 Section 19) | Recommended Index | Severity |
|---|---|---|
| Get modifier definitions for a tier (per doc 02 Section 19) | Index on `(tier_bracket)` exists as part of composite `idx_modifier_defs_pool` -- covered | N/A |
| Leaderboard by rank | `idx_players_rank_points` exists -- covered | N/A |
| `matches` table by status | No index on `matches(status)` for finding in-progress matches | MEDIUM |
| `matches` table by player | No index on `matches(player_1_id)` or `matches(player_2_id)` | MEDIUM |
| `card_instances.in_deck_ids` GIN index | No GIN index for array containment queries on `in_deck_ids` | MEDIUM |
| `players.unlocked_faction_ids` GIN index | No GIN index for array containment queries | LOW |
| `players.showcase_card_ids` GIN index | No GIN index for array containment queries | LOW |

### Index Coverage Assessment

The existing indexes cover the documented query patterns from doc 02 Section 19 well. The composite index `idx_modifier_defs_pool` on `(pp_cost, tier_bracket, attunement, pool_type)` directly supports the modifier selection query at evolution time. Match history is well-indexed for both player positions. The main gaps are on the `matches` table (00013) and GIN indexes for array columns.

---

## Trigger Audit

### Trigger: `set_updated_at_players`
- **Table**: `players`
- **Type**: BEFORE UPDATE, FOR EACH ROW
- **Function**: `update_updated_at_column()` -- sets `NEW.updated_at = now()`
- **Correctness**: YES. Simple timestamp update, no loop risk.
- **Issues**: None

### Trigger: `set_updated_at_decks`
- **Table**: `decks`
- **Type**: BEFORE UPDATE, FOR EACH ROW
- **Function**: `update_updated_at_column()`
- **Correctness**: YES
- **Issues**: None

### Trigger: `set_updated_at_economy_config`
- **Table**: `economy_config`
- **Type**: BEFORE UPDATE, FOR EACH ROW
- **Function**: `update_updated_at_column()`
- **Correctness**: YES
- **Issues**: None

### Missing Triggers

No `updated_at` trigger exists for tables that might benefit:
- `card_instances` has `last_evolved_at` but no general `updated_at` column or trigger. When a card is modified (energy, deck membership, favorites), there is no timestamp tracking. **LOW: Consider adding `updated_at` to card_instances.**

### Infinite Loop Risk: NONE
All triggers are simple BEFORE UPDATE triggers that modify only the current row's `updated_at` column. No trigger calls other triggers or modifies other tables.

---

## RPC / Stored Procedure Audit

### `add_chaos_dust(p_player_id, p_amount, p_source, p_reference_id)`
- **Location**: 00012_triggers.sql
- **Purpose**: Atomically add/subtract dust and record transaction
- **Security**: `SECURITY DEFINER` -- runs with function owner's privileges (bypasses RLS)
- **Input validation**:
  - `p_player_id`: UUID type provides format validation
  - `p_amount`: INTEGER, can be negative (for spending). **The `players.chaos_dust` column has `CHECK (chaos_dust >= 0)` which prevents going below zero.** This is correct -- the CHECK constraint acts as a safeguard.
  - `p_source`: TEXT, no validation against valid sources
  - `p_reference_id`: TEXT, nullable, no validation
- **Transaction safety**: Single transaction (implicit). UPDATE + INSERT are atomic. CORRECT.
- **Return type**: INTEGER (new balance) -- CORRECT
- **Issues**:
  - **MEDIUM: No input validation on `p_source`.** Should validate against ShardSource enum values or at least a reasonable set.
  - No protection against being called by unauthenticated users. Since it's `SECURITY DEFINER`, anyone who can call the function bypasses RLS. **This function should only be callable by the service role.** Need to verify Supabase Edge Function permissions.

### `add_shards(p_player_id, p_shard_tier, p_amount, p_source, p_reference_id)`
- **Location**: 00012_triggers.sql
- **Purpose**: Atomically add/subtract shards and record transaction
- **Security**: `SECURITY DEFINER`
- **Input validation**:
  - `p_shard_tier`: Validated via CASE statement with RAISE EXCEPTION for invalid values. CORRECT.
  - `p_amount`: INTEGER, can go negative. The individual shard columns have `CHECK (>= 0)` constraints. CORRECT.
- **Transaction safety**: Atomic. CORRECT.
- **Return type**: VOID
- **Issues**:
  - Same SECURITY DEFINER concern as `add_chaos_dust`. Should be restricted to service role callers.
  - No validation on `p_source`. **MEDIUM.**

### `reset_season_ranks()`
- **Location**: 00012_triggers.sql
- **Purpose**: Demote all players by one tier at season end
- **Security**: `SECURITY DEFINER`
- **Input validation**: No inputs -- applies to all players. CORRECT.
- **Transaction safety**: Single UPDATE statement. CORRECT.
- **Logic correctness**: The rank demotion mapping is:
  - MASTER/GRANDMASTER -> DIAMOND_1
  - DIAMOND_* -> PLATINUM_3
  - PLATINUM_* -> GOLD_3
  - GOLD_* -> SILVER_3
  - SILVER_* -> BRONZE_3
  - BRONZE_* -> BRONZE_3
  - This matches the typical "drop by one full tier" pattern. CORRECT.
- **Issues**: None significant. Should only be called by admin/service role (manual season-end process).

### `increment_chaos_energy(instance_ids, amount)`
- **Location**: 00014_chaos_energy_rpc.sql
- **Purpose**: Batch increment chaos_energy on card instances after matches
- **Security**: `SECURITY DEFINER`
- **Input validation**:
  - `instance_ids`: UUID[] -- type-validated
  - `amount`: INTEGER -- no bounds check. Could theoretically pass negative values or very large values.
- **Transaction safety**: Single UPDATE. CORRECT.
- **Return type**: VOID
- **Issues**:
  - **MEDIUM: No bounds check on `amount`.** Should validate `amount > 0` or at least `amount BETWEEN 1 AND 2` per doc 02 (win=2, loss=1).
  - **MEDIUM: No ownership validation.** The function updates ANY card instance by ID. A malicious caller could increment energy on cards they don't own. Since it's SECURITY DEFINER, this depends on who can call the function. If exposed as a Supabase RPC, any authenticated user could call it with arbitrary card IDs.

### `update_updated_at_column()`
- **Location**: 00012_triggers.sql
- **Purpose**: Trigger function for auto-updating `updated_at` timestamps
- **Issues**: None. Standard pattern.

---

## SQL Injection Analysis

- **Stored procedures**: All use parameterized inputs (`$1`, `$2` etc. via PL/pgSQL function parameters). No string concatenation or dynamic SQL. **No SQL injection vectors.**
- **RLS policies**: All use `auth.uid()`, `auth.role()`, and subqueries with parameterized comparisons. **No SQL injection vectors.**
- **JSONB columns**: Data is inserted via parameterized queries from the application layer. JSONB path operators in RLS would need scrutiny, but none are used. **Safe.**

---

## Seed Data Audit

The `supabase/seed.sql` file populates:
1. **3 factions** with correct short_names, mechanics, and art prompts -- matches doc 02 Section 10
2. **6 avatars** (2 per faction) with correct instability modifiers matching doc 02 Section 9 ranges:
   - Order-leaning: -5 (Aldric, Sylara)
   - Balanced: -4 (Kael)
   - Chaos-leaning: -2 (Vex, Lilith), -1 (Morrigan)
   - All are FREE_STARTER -- correct for launch
3. **16 event definitions** (O1-O8, C1-C8) matching doc 02 Section 8 with correct effect JSONB
4. **Economy config** values matching doc 04 Section 9
5. **30 quest templates** (20 daily + 10 weekly) matching doc 04 Section 4
6. **23 achievements** across all 5 categories matching doc 02 Section 17
7. **1 season** (Season of Awakening) correctly configured

**Issues**: The seed data is comprehensive and well-structured. Uses fixed UUIDs for factions and avatars for deterministic FK references. All `ON CONFLICT DO NOTHING` comment is in the header but no actual `ON CONFLICT` clauses on INSERT statements -- **the seed is NOT idempotent despite claiming to be.** Running it twice will fail on primary key/unique constraint violations.

---

## Critical Issues

| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | **`matches` table has RLS enabled but zero policies** | 00013 | Table is inaccessible without service role bypass. If Supabase service role bypass is disabled, the game server cannot write live match data. Add explicit service role policy. |
| C2 | **`players` table "Public profile read" policy exposes all columns to all users** | 00011 line 72 | Any authenticated user can read every player's `chaos_dust`, `shards`, `auth_id`, `friend_ids`, `subscription_tier`, and `settings` (including privacy preferences). This is a data privacy violation. Replace with a restricted view or column-level security. |
| C3 | **27 enum types defined but none used; multiple TEXT columns lack CHECK constraints** | 00001 + various | `shard_transactions.shard_tier`, `shard_transactions.source`, `missions.mission_type`, `players.season_rank`, `players.highest_tier_reached`, `match_records.player_1_rank`, `match_records.player_2_rank` all accept arbitrary text. Invalid data can enter the system. |
| C4 | **`SECURITY DEFINER` functions callable by any authenticated user** | 00012, 00014 | `add_chaos_dust`, `add_shards`, `increment_chaos_energy` can potentially be called as Supabase RPCs by any authenticated user. These should be restricted via `ALTER FUNCTION ... SET search_path = public; REVOKE ALL ON FUNCTION ... FROM public; GRANT EXECUTE ON FUNCTION ... TO service_role;` |

---

## High Issues

| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | **`FactionMastery` entity has no storage** | players table / no separate table | Doc 02 Section 12 defines `FactionMastery` with `faction_id`, `mastery_level`, `mastery_xp`, `games_played` per faction. This data is not stored anywhere in the schema. A `faction_mastery` table is needed. |
| H2 | **`match_records` missing FK constraints on 6 columns** | 00003 | `player_1_deck_id`, `player_2_deck_id`, `player_1_avatar_id`, `player_2_avatar_id`, `player_1_faction_id`, `player_2_faction_id` are bare UUID columns with no foreign key references. |
| H3 | **`decks` "Players manage own decks" policy missing `WITH CHECK`** | 00011 line 101-103 | The `FOR ALL` policy only has `USING` but no `WITH CHECK`. A player could potentially INSERT a deck with `owner_id` belonging to another player. |
| H4 | **`shard_transactions.shard_tier` missing CHECK constraint** | 00004 line 28 | Accepts any text value. Should CHECK against ('UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'). |
| H5 | **`shard_transactions.source` missing CHECK constraint** | 00004 line 30 | Accepts any text value. Should CHECK against ShardSource enum values. |
| H6 | **Seed SQL claims idempotency but is not idempotent** | seed.sql header | Running seed twice will fail on PK/unique violations. Need `ON CONFLICT DO NOTHING` on all INSERT statements. |

---

## Medium Issues

| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | No CHECK on `players.season_rank` | 00002 line 106 | Accepts arbitrary text |
| M2 | No CHECK on `players.highest_tier_reached` | 00002 line 134 | Accepts arbitrary text |
| M3 | No CHECK on `match_records.player_1_rank` / `player_2_rank` | 00003 lines 33-34 | Accepts arbitrary text |
| M4 | No referential integrity for JSONB-embedded entities | card_instances (evolution_history, modifiers, triggered_abilities) | Denormalization trade-off; invalid IDs can be embedded |
| M5 | No referential integrity for deck entries | decks.card_entries JSONB | Invalid card_instance_ids can be embedded |
| M6 | Missing CHECK on `card_instances.instability_value >= 0` | 00002 line 177 | Doc 02 specifies minimum clamp of 0 |
| M7 | `missions` reward columns diverge from doc 02 | 00006 lines 44-60 | Uses `reward_dust` + `reward_shard_tier` + `reward_shard_count` instead of doc 02's `reward_type` + `reward_amount` |
| M8 | No CHECK on `missions.mission_type` | 00006 line 47 | Accepts arbitrary text |
| M9 | RLS subquery performance on `card_instances` | 00011 line 86 | Per-row subquery `SELECT auth_id FROM players WHERE id = owner_id` may be slow for large collections |
| M10 | Missing indexes on `matches` table | 00013 | No indexes for status or player lookups on live match table |
| M11 | `increment_chaos_energy` lacks bounds check and ownership validation | 00014 | Can be called with arbitrary card IDs and negative/excessive amounts |

---

## Supabase Config Audit (config.toml)

- **Auth**: Apple Sign-In enabled via `[auth.external.apple]`. Client IDs read from environment variables. CORRECT.
- **Email signup disabled**: `[auth.email] enable_signup = false`. CORRECT for Apple-only auth.
- **SMS signup disabled**: CORRECT.
- **Anonymous sign-ins disabled**: CORRECT.
- **JWT expiry**: 3600 seconds (1 hour). Reasonable.
- **Refresh token rotation**: Enabled. CORRECT.
- **Analytics**: Disabled. Matches PostHog usage (external analytics).
- **File size limit**: 50MiB. Reasonable for card art.
- **DB major version**: 17 (Postgres 17). Latest stable. CORRECT.

---

## Recommendations Summary (Priority Order)

1. **Fix `players` public profile RLS** -- Create a view for public profile data or restrict the public SELECT policy to specific columns
2. **Add explicit service role policy to `matches` table** -- Prevent accessibility issues
3. **Restrict `SECURITY DEFINER` functions** -- REVOKE public execution, GRANT to service_role only
4. **Add CHECK constraints** to all TEXT columns that represent enum values (at least: `shard_transactions.shard_tier`, `shard_transactions.source`, `missions.mission_type`, `players.season_rank`, `players.highest_tier_reached`)
5. **Add `WITH CHECK` clause** to decks and matchmaking_queue ALL policies
6. **Create `faction_mastery` table** to store per-player per-faction mastery data
7. **Add FK constraints** to match_records deck/avatar/faction columns (or document why they are intentionally omitted)
8. **Make seed.sql idempotent** with `ON CONFLICT DO NOTHING`
9. **Add missing indexes** on `matches` table
10. **Add `instability_value >= 0` CHECK constraint** to card_instances
11. **Either use or remove** the 27 unused enum types from 00001_enums.sql

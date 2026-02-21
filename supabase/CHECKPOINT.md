# Supabase Stabilizer Redesign Checkpoint
## Status: complete

## Files Created
- migrations/00019_stabilizer_redesign.sql — complete

## Notes
- `activated_effect JSONB` added to `card_templates` with `ADD COLUMN IF NOT EXISTS` (idempotent).
- Column is nullable: CREATURE and SPELL rows remain NULL; STABILIZER rows should be populated
  with a JSONB object describing trigger, cost, effect, cooldown_turns, and description.
- `mana_cost` SET to 0 for all existing STABILIZER rows via plain UPDATE (idempotent on re-run).
- DECK_SIZE change (20 → 30) is documented in the migration as a comment only — no DB constraint
  exists for deck card count; enforcement lives in application code (game server, iOS client,
  Edge Function). This is intentional and noted explicitly.
- Stability zone is in-memory only on the game server (Railway). No DB table created. Rationale
  documented in migration section 4.
- Migration follows the same style as 00018: top-level comment block, numbered sections, idempotent
  guards (IF NOT EXISTS), and a revision log at the bottom.

---

# Supabase Schema — Build Checkpoint (Wave 0, archived)

**Agent:** supabase-schema
**Phase:** Wave 0 (Foundation)
**Status:** COMPLETE
**Date:** 2026-02-16

---

## Files Created

### Config
- `supabase/config.toml` — Local dev configuration (Postgres 15, Apple Sign-In enabled, email auth disabled)

### Migrations (12 files, applied in order)

| File | Contents | Tables/Objects |
|---|---|---|
| `00001_enums.sql` | 30 custom ENUM types | All enums from doc 02 |
| `00002_core_tables.sql` | Core entity tables | factions, avatars, card_templates, players, card_instances, decks, modifier_definitions, event_definitions |
| `00003_battle_tables.sql` | Battle/match tables | match_records, matchmaking_queue |
| `00004_economy_tables.sql` | Economy tables | economy_config, shard_transactions, dust_transactions |
| `00005_social_tables.sql` | Social tables | friend_requests |
| `00006_content_tables.sql` | Content tables | achievements, player_achievements, missions, quest_templates |
| `00007_generation_tables.sql` | AI generation tables | generation_jobs |
| `00008_season_tables.sql` | Season tables | seasons, battle_pass_progress, rank_history |
| `00009_admin_tables.sql` | Admin tables | rate_limit_log, admin_audit_log |
| `00010_indexes.sql` | All indexes | 30+ indexes covering all query patterns from doc 02 Section 19 |
| `00011_rls_policies.sql` | All RLS policies | Every table has RLS enabled with appropriate policies |
| `00012_triggers.sql` | Triggers + stored procs | updated_at trigger, add_chaos_dust(), add_shards(), reset_season_ranks() |

### Seed Data
- `supabase/seed.sql` — All initial game content

| Data | Count | Source |
|---|---|---|
| Factions | 3 | doc 01 Section 5 |
| Avatars | 6 (2 per faction) | doc 00 Section 10 / doc 01 Section 5 |
| Event Definitions | 16 (8 Order + 8 Chaos) | doc 01 Sections 8-9 |
| Economy Config | 50+ key-value pairs | doc 04 Section 9 / doc 06 Section 3.1 |
| Quest Templates | 30 (20 daily + 10 weekly) | doc 04 Section 4 |
| Achievements | 23 | doc 00 Section 15 |
| Seasons | 1 (Season of Awakening) | Initial season |

---

## Validation Results

- All 12 migrations apply cleanly via `supabase db reset`
- Seed data loads without errors
- REST API queries confirm all seed data is accessible
- RLS policies active on every table
- Verified via Supabase local instance (v2.75.0)

### Tables (19 total)
1. factions
2. avatars
3. card_templates
4. players
5. card_instances
6. decks
7. modifier_definitions
8. event_definitions
9. match_records
10. matchmaking_queue
11. economy_config
12. shard_transactions
13. dust_transactions
14. friend_requests
15. achievements
16. player_achievements
17. missions
18. quest_templates
19. generation_jobs
20. seasons
21. battle_pass_progress
22. rank_history
23. rate_limit_log
24. admin_audit_log

### Stored Functions (3)
1. `add_chaos_dust(player_id, amount, source, reference_id)` — Atomic dust add + transaction log
2. `add_shards(player_id, shard_tier, amount, source, reference_id)` — Atomic shard add + transaction log
3. `reset_season_ranks()` — Season-end rank reset per doc 04 Section 5.4

### ENUM Types (30)
All enum values from doc 02 are defined as Postgres ENUM types for reference/validation. Tables use TEXT + CHECK constraints for consistency with doc 06.

---

## Design Doc Coverage

| Entity (doc 02) | Table | Status |
|---|---|---|
| CardTemplate (Section 1) | card_templates | Implemented |
| CardInstance (Section 2) | card_instances | Implemented |
| EvolutionRecord (Section 3) | card_instances.evolution_history (JSONB) | Implemented |
| ModifierDefinition (Section 4a) | modifier_definitions | Implemented |
| ModifierInstance (Section 4b) | card_instances.modifiers (JSONB) | Implemented |
| TriggeredAbility (Section 5) | card_instances.triggered_abilities (JSONB) | Implemented |
| EventDefinition (Section 8) | event_definitions | Implemented |
| Avatar (Section 9) | avatars | Implemented |
| Faction (Section 10) | factions | Implemented |
| Deck (Section 11) | decks | Implemented |
| Player (Section 12) | players | Implemented |
| GameState (Section 13) | Runtime only (game server memory) | N/A |
| MatchRecord (Section 14) | match_records | Implemented |
| ShardTransaction (Section 15) | shard_transactions | Implemented |
| Mission (Section 16) | missions | Implemented |
| Achievement (Section 17) | achievements + player_achievements | Implemented |

---

## Notes for Downstream Agents

1. **Foreign key references**: `players.auth_id` references `auth.users(id)` — this is Supabase's built-in auth table. New players are created after Supabase Auth signup.

2. **JSONB columns**: evolution_history, modifiers, triggered_abilities on card_instances are denormalized JSONB arrays. This is intentional per doc 06 for single-row read performance during battles.

3. **card_entries on decks**: JSONB array of `{card_instance_id, quantity}` objects. Validated by the game server, not by database constraints.

4. **Settings on players**: JSONB with sensible defaults. Schema matches PlayerSettings from doc 02 Section 12.

5. **Economy config**: All values from doc 04 are seeded. Game server and edge functions should read from this table at startup/per-request, enabling hot-tuning via admin dashboard.

6. **The `dust_transactions` table** is not in doc 06 but was added for parity with shard_transactions (audit trail for all Chaos Dust movement). The `add_chaos_dust()` function writes to both `players.chaos_dust` and `dust_transactions` atomically.

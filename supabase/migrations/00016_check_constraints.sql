-- ============================================================================
-- Migration 00016: Add CHECK Constraints to TEXT Columns
-- Addresses S-52: Multiple TEXT columns accept arbitrary values without validation.
-- Also addresses S-57 sync: Ensures seed defaults match design spec.
-- ============================================================================

-- ────────────────────────────────────────────
-- players.season_rank — must be a valid rank
-- ────────────────────────────────────────────
ALTER TABLE players ADD CONSTRAINT chk_players_season_rank
  CHECK (season_rank IN (
    'BRONZE_3', 'BRONZE_2', 'BRONZE_1',
    'SILVER_3', 'SILVER_2', 'SILVER_1',
    'GOLD_3', 'GOLD_2', 'GOLD_1',
    'PLATINUM_3', 'PLATINUM_2', 'PLATINUM_1',
    'DIAMOND_3', 'DIAMOND_2', 'DIAMOND_1',
    'MASTER', 'GRANDMASTER'
  ));

-- ────────────────────────────────────────────
-- players.highest_tier_reached — must be a valid evolution tier
-- ────────────────────────────────────────────
ALTER TABLE players ADD CONSTRAINT chk_players_highest_tier
  CHECK (highest_tier_reached IN ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'));

-- ────────────────────────────────────────────
-- shard_transactions.shard_tier — must be a valid shard tier
-- ────────────────────────────────────────────
ALTER TABLE shard_transactions ADD CONSTRAINT chk_shard_tx_tier
  CHECK (shard_tier IN ('UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'));

-- ────────────────────────────────────────────
-- shard_transactions.source — must be a valid source type
-- ────────────────────────────────────────────
ALTER TABLE shard_transactions ADD CONSTRAINT chk_shard_tx_source
  CHECK (source IN (
    'MATCH_REWARD', 'DAILY_LOGIN', 'WEEKLY_CHALLENGE', 'SEASON_REWARD',
    'MILESTONE', 'PURCHASE', 'EVOLUTION_CONSUMED', 'DISMANTLE_RETURN',
    'SUBSCRIPTION_GRANT', 'SYSTEM'
  ));

-- ────────────────────────────────────────────
-- dust_transactions.source — must be a valid source type
-- ────────────────────────────────────────────
ALTER TABLE dust_transactions ADD CONSTRAINT chk_dust_tx_source
  CHECK (source IN (
    'MATCH_REWARD', 'DAILY_LOGIN', 'QUEST_REWARD', 'SEASON_REWARD',
    'DISMANTLE', 'PURCHASE', 'PACK_OPENING', 'SUBSCRIPTION_MONTHLY_COMMONS',
    'SYSTEM'
  ));

-- ────────────────────────────────────────────
-- missions.mission_type — must be a valid mission type
-- ────────────────────────────────────────────
ALTER TABLE missions ADD CONSTRAINT chk_missions_type
  CHECK (mission_type IN (
    'WIN_GAMES', 'PLAY_CARDS', 'PLAY_CREATURES', 'PLAY_SPELLS',
    'EVOLVE_CARD', 'TRIGGER_ORDER_EVENTS', 'TRIGGER_CHAOS_EVENTS',
    'DEAL_DAMAGE', 'WIN_WITH_STYLE', 'PLAY_GAMES'
  ));

-- ────────────────────────────────────────────
-- missions.reward_shard_tier — must be a valid shard tier or null
-- ────────────────────────────────────────────
ALTER TABLE missions ADD CONSTRAINT chk_missions_shard_tier
  CHECK (reward_shard_tier IS NULL OR reward_shard_tier IN ('UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'));

-- ────────────────────────────────────────────
-- quest_templates.mission_type — must be a valid mission type
-- ────────────────────────────────────────────
ALTER TABLE quest_templates ADD CONSTRAINT chk_quest_tmpl_type
  CHECK (mission_type IN (
    'WIN_GAMES', 'PLAY_CARDS', 'PLAY_CREATURES', 'PLAY_SPELLS',
    'EVOLVE_CARD', 'TRIGGER_ORDER_EVENTS', 'TRIGGER_CHAOS_EVENTS',
    'DEAL_DAMAGE', 'WIN_WITH_STYLE', 'PLAY_GAMES'
  ));

-- ────────────────────────────────────────────
-- S-53 (partial): Add UNIQUE constraint on achievements.name so seed.sql
-- can use ON CONFLICT (name) DO NOTHING for idempotent re-runs.
-- ────────────────────────────────────────────
ALTER TABLE achievements ADD CONSTRAINT uq_achievements_name UNIQUE (name);

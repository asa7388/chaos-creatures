-- ============================================================================
-- Migration 00012: Database Triggers
-- Source: docs/design/06-technical-architecture.md Section 3.2
--
-- Handles:
-- 1. Auto-update of updated_at timestamps
-- 2. Friend code generation uniqueness
-- ============================================================================

-- ────────────────────────────────────────────
-- Trigger function: auto-set updated_at on row update
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at columns
CREATE TRIGGER set_updated_at_players
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_decks
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_economy_config
  BEFORE UPDATE ON economy_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────
-- Stored procedure: add_chaos_dust
-- Atomically adds dust to a player and records the transaction.
-- Used by game server and edge functions.
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_chaos_dust(
  p_player_id UUID,
  p_amount INTEGER,
  p_source TEXT DEFAULT 'SYSTEM',
  p_reference_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE players
  SET chaos_dust = chaos_dust + p_amount
  WHERE id = p_player_id
  RETURNING chaos_dust INTO new_balance;

  INSERT INTO dust_transactions (player_id, amount, source, reference_id, balance_after)
  VALUES (p_player_id, p_amount, p_source, p_reference_id, new_balance);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────
-- Stored procedure: add_shards
-- Atomically adds shards to a player and records the transaction.
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_shards(
  p_player_id UUID,
  p_shard_tier TEXT,
  p_amount INTEGER,
  p_source TEXT DEFAULT 'SYSTEM',
  p_reference_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  CASE p_shard_tier
    WHEN 'UNCOMMON' THEN
      UPDATE players SET shards_uncommon = shards_uncommon + p_amount WHERE id = p_player_id;
    WHEN 'RARE' THEN
      UPDATE players SET shards_rare = shards_rare + p_amount WHERE id = p_player_id;
    WHEN 'EPIC' THEN
      UPDATE players SET shards_epic = shards_epic + p_amount WHERE id = p_player_id;
    WHEN 'LEGENDARY' THEN
      UPDATE players SET shards_legendary = shards_legendary + p_amount WHERE id = p_player_id;
    ELSE
      RAISE EXCEPTION 'Invalid shard tier: %', p_shard_tier;
  END CASE;

  INSERT INTO shard_transactions (player_id, shard_tier, amount, source, reference_id)
  VALUES (p_player_id, p_shard_tier, p_amount, p_source, p_reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────
-- Stored procedure: reset_season_ranks
-- Called at season end to demote all players by 1 tier.
-- See doc 04 Section 5.4 for reset rules.
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reset_season_ranks()
RETURNS VOID AS $$
BEGIN
  UPDATE players SET
    season_rank = CASE
      WHEN season_rank IN ('MASTER', 'GRANDMASTER') THEN 'DIAMOND_1'
      WHEN season_rank IN ('DIAMOND_3', 'DIAMOND_2', 'DIAMOND_1') THEN 'PLATINUM_3'
      WHEN season_rank IN ('PLATINUM_3', 'PLATINUM_2', 'PLATINUM_1') THEN 'GOLD_3'
      WHEN season_rank IN ('GOLD_3', 'GOLD_2', 'GOLD_1') THEN 'SILVER_3'
      WHEN season_rank IN ('SILVER_3', 'SILVER_2', 'SILVER_1') THEN 'BRONZE_3'
      ELSE 'BRONZE_3'
    END,
    season_rank_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

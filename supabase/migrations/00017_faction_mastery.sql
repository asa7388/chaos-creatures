-- ============================================================================
-- Migration 00017: Faction Mastery Table
-- Addresses: S-36 (missing faction_mastery storage)
-- Source: docs/design/04-progression-economy.md, _shared/types.ts constants
-- ============================================================================

-- ────────────────────────────────────────────
-- Create faction_mastery table.
-- Tracks per-player, per-faction mastery progress.
-- One row per (player, faction) pair.
-- Max level: 10. XP per level: 100. XP per game: 10. Win bonus: 5.
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faction_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 10),
  mastery_xp INTEGER NOT NULL DEFAULT 0 CHECK (mastery_xp >= 0),
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each player has at most one mastery row per faction
  UNIQUE (player_id, faction_id)
);

-- Index for quick lookups by player
CREATE INDEX IF NOT EXISTS idx_faction_mastery_player
  ON faction_mastery(player_id);

-- Index for leaderboard queries by faction
CREATE INDEX IF NOT EXISTS idx_faction_mastery_faction_level
  ON faction_mastery(faction_id, mastery_level DESC);

-- ────────────────────────────────────────────
-- RLS Policies
-- ────────────────────────────────────────────

ALTER TABLE faction_mastery ENABLE ROW LEVEL SECURITY;

-- Players can read their own mastery data
CREATE POLICY "Players can read own mastery"
  ON faction_mastery FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

-- Only service_role can insert/update mastery (via game server after match)
-- No INSERT/UPDATE/DELETE policy for authenticated role — mutations happen
-- server-side via service_role (which bypasses RLS).

-- ────────────────────────────────────────────
-- RPC: Increment faction mastery after a match.
-- Called by game server / edge functions with service_role.
-- Automatically levels up when XP threshold is reached.
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_faction_mastery(
  p_player_id UUID,
  p_faction_id UUID,
  p_won BOOLEAN
)
RETURNS TABLE (
  mastery_level INTEGER,
  mastery_xp INTEGER,
  leveled_up BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_gain INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_xp INTEGER;
  v_xp_per_level CONSTANT INTEGER := 100;
  v_max_level CONSTANT INTEGER := 10;
  v_xp_per_game CONSTANT INTEGER := 10;
  v_win_bonus CONSTANT INTEGER := 5;
BEGIN
  -- Calculate XP gain
  v_xp_gain := v_xp_per_game;
  IF p_won THEN
    v_xp_gain := v_xp_gain + v_win_bonus;
  END IF;

  -- Upsert the mastery row
  INSERT INTO faction_mastery (player_id, faction_id, mastery_level, mastery_xp, games_played, wins, updated_at)
  VALUES (p_player_id, p_faction_id, 0, v_xp_gain, 1, CASE WHEN p_won THEN 1 ELSE 0 END, now())
  ON CONFLICT (player_id, faction_id) DO UPDATE SET
    mastery_xp = faction_mastery.mastery_xp + v_xp_gain,
    games_played = faction_mastery.games_played + 1,
    wins = faction_mastery.wins + CASE WHEN p_won THEN 1 ELSE 0 END,
    updated_at = now();

  -- Fetch current state after upsert
  SELECT fm.mastery_level, fm.mastery_xp
  INTO v_old_level, v_new_xp
  FROM faction_mastery fm
  WHERE fm.player_id = p_player_id AND fm.faction_id = p_faction_id;

  -- Calculate new level from total XP
  v_new_level := LEAST(v_new_xp / v_xp_per_level, v_max_level);

  -- Update level if it changed
  IF v_new_level > v_old_level THEN
    UPDATE faction_mastery
    SET mastery_level = v_new_level, updated_at = now()
    WHERE faction_mastery.player_id = p_player_id AND faction_mastery.faction_id = p_faction_id;
  END IF;

  RETURN QUERY SELECT
    v_new_level AS mastery_level,
    v_new_xp AS mastery_xp,
    (v_new_level > v_old_level) AS leveled_up;
END;
$$;

-- Restrict RPC to service_role only (matches S-13 pattern)
REVOKE EXECUTE ON FUNCTION increment_faction_mastery(UUID, UUID, BOOLEAN) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION increment_faction_mastery(UUID, UUID, BOOLEAN) TO service_role;

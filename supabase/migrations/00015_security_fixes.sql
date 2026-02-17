-- ============================================================================
-- Migration 00015: Security Fixes
-- Addresses: S-12 (players public column exposure), S-13 (RPC permissions),
--            S-51 (decks missing WITH CHECK)
-- ============================================================================

-- ────────────────────────────────────────────
-- S-12: Restrict public player profile reads to safe columns only.
-- The "Public profile read" policy uses USING (true) which exposes all columns
-- (chaos_dust, shards, auth_id, friend_ids, subscription_tier, settings).
-- Fix: Drop the overly-permissive policy and replace it with a view-based
-- approach using column-level security via a restricted SELECT policy.
-- ────────────────────────────────────────────

-- Drop the overly-permissive public read policy
DROP POLICY IF EXISTS "Public profile read" ON players;

-- Replace with a restricted policy that only allows public reads of safe columns.
-- Since RLS operates at the row level (not column level), we use a security barrier
-- view for public profile data. For direct table access, only own-row SELECT remains.
-- The existing "Players can read own data" policy (USING auth.uid() = auth_id) handles
-- own-row reads with full column access.

-- Create a public-safe view for leaderboard / opponent display / friend lookup
CREATE OR REPLACE VIEW public_player_profiles AS
SELECT
  id,
  display_name,
  avatar_id,
  season_rank,
  season_rank_points,
  showcase_card_ids,
  active_title,
  total_games,
  total_wins,
  current_win_streak,
  best_win_streak,
  primary_faction_id,
  player_level,
  friend_code,
  created_at
FROM players;

-- Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public_player_profiles TO authenticated, anon;

-- ────────────────────────────────────────────
-- S-13: Restrict SECURITY DEFINER RPCs to service_role only.
-- add_chaos_dust, add_shards, increment_chaos_energy, reset_season_ranks
-- can currently be called by any authenticated user, allowing economy exploits.
-- ────────────────────────────────────────────

-- Revoke execute from public and authenticated roles
REVOKE EXECUTE ON FUNCTION add_chaos_dust(UUID, INTEGER, TEXT, TEXT) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION add_shards(UUID, TEXT, INTEGER, TEXT, TEXT) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION increment_chaos_energy(UUID[], INTEGER) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION reset_season_ranks() FROM public, authenticated;

-- Grant execute only to service_role (game server, edge functions)
GRANT EXECUTE ON FUNCTION add_chaos_dust(UUID, INTEGER, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION add_shards(UUID, TEXT, INTEGER, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION increment_chaos_energy(UUID[], INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION reset_season_ranks() TO service_role;

-- ────────────────────────────────────────────
-- S-51: Add WITH CHECK to decks "Players manage own decks" policy.
-- Without WITH CHECK, a player could INSERT a deck with another player's owner_id.
-- ────────────────────────────────────────────

-- Drop the existing policy and recreate with WITH CHECK
DROP POLICY IF EXISTS "Players manage own decks" ON decks;

CREATE POLICY "Players manage own decks"
  ON decks FOR ALL
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = owner_id))
  WITH CHECK (auth.uid() = (SELECT auth_id FROM players WHERE id = owner_id));

-- ============================================================================
-- Migration 00008: Season Tables
-- Source: docs/design/06-technical-architecture.md Section 3.1 (seasons, battle_pass_progress)
--         docs/design/04-progression-economy.md Section 5 (Rank/Ladder System)
-- ============================================================================

-- ────────────────────────────────────────────
-- seasons
-- Tracks game seasons for ranked play and battle pass.
-- Season length: 8 weeks (6 seasons/year). See doc 04 Section 5.4.
-- ────────────────────────────────────────────
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  battle_pass_tiers INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- battle_pass_progress
-- Per-player battle pass progress per season.
-- ────────────────────────────────────────────
CREATE TABLE battle_pass_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id),
  season_id UUID NOT NULL REFERENCES seasons(id),
  is_premium BOOLEAN DEFAULT FALSE,
  current_tier INTEGER NOT NULL DEFAULT 0,
  xp_in_current_tier INTEGER NOT NULL DEFAULT 0,
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, season_id)
);

-- ────────────────────────────────────────────
-- rank_history
-- Snapshot of player rank at end of each season for historical tracking.
-- ────────────────────────────────────────────
CREATE TABLE rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id),
  final_rank TEXT NOT NULL,
  peak_rank TEXT NOT NULL,
  final_rank_points INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  rewards_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, season_id)
);

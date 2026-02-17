-- ============================================================================
-- Migration 00003: Battle Tables
-- Source: docs/design/06-technical-architecture.md Section 3.1 (match_records)
--         docs/design/06-technical-architecture.md Section 4.5 (matchmaking_queue)
--         docs/design/02-card-data-model.md Section 14 (MatchRecord)
-- ============================================================================

-- ────────────────────────────────────────────
-- match_records
-- Persisted after a match ends. Used for player stats, card XP, analytics.
-- ────────────────────────────────────────────
CREATE TABLE match_records (
  id UUID PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('RANKED', 'CASUAL', 'PRACTICE')),
  player_1_id UUID NOT NULL REFERENCES players(id),
  player_2_id UUID REFERENCES players(id),
  winner_id UUID REFERENCES players(id),
  loser_id UUID REFERENCES players(id),

  player_1_deck_id UUID,
  player_2_deck_id UUID,
  player_1_avatar_id UUID,
  player_2_avatar_id UUID,
  player_1_faction_id UUID,
  player_2_faction_id UUID,

  end_reason TEXT NOT NULL CHECK (end_reason IN ('HP_ZERO', 'SURRENDER', 'DISCONNECT', 'TIMEOUT')),
  total_turns INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,

  player_1_final_hp INTEGER NOT NULL,
  player_2_final_hp INTEGER NOT NULL,
  player_1_rank TEXT,
  player_2_rank TEXT,

  -- Card play records (JSONB array of CardPlayRecord objects)
  cards_played JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Chaos roll summary
  total_rolls INTEGER NOT NULL DEFAULT 0,
  order_events_p1 INTEGER NOT NULL DEFAULT 0,
  chaos_events_p1 INTEGER NOT NULL DEFAULT 0,
  order_events_p2 INTEGER NOT NULL DEFAULT 0,
  chaos_events_p2 INTEGER NOT NULL DEFAULT 0,

  -- Full game log for replay
  full_log JSONB NOT NULL DEFAULT '[]'::jsonb,

  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  season_id TEXT NOT NULL DEFAULT 'season_1'
);

-- ────────────────────────────────────────────
-- matchmaking_queue
-- Used by game server polling every 2 seconds for match pairing.
-- ────────────────────────────────────────────
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE NOT NULL REFERENCES players(id),
  deck_id UUID NOT NULL REFERENCES decks(id),
  avatar_id UUID NOT NULL,
  faction_id UUID NOT NULL,
  mode TEXT NOT NULL DEFAULT 'RANKED' CHECK (mode IN ('RANKED', 'CASUAL', 'PRACTICE')),
  season_rank TEXT NOT NULL,
  season_rank_points INTEGER NOT NULL,
  hidden_mmr INTEGER NOT NULL,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

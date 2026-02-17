-- 00013_matches_table.sql
-- Live match tracking table (game server writes, admin reads).
-- match_records stores completed match data; this tracks in-progress ones.

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'RANKED',
  player_1_id UUID NOT NULL REFERENCES players(id),
  player_2_id UUID NOT NULL REFERENCES players(id),
  player_1_deck_id UUID NOT NULL REFERENCES decks(id),
  player_2_deck_id UUID NOT NULL REFERENCES decks(id),
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: service role only (game server writes via service key)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
-- No public policies — only accessible via service role key

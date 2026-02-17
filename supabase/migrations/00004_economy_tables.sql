-- ============================================================================
-- Migration 00004: Economy Tables
-- Source: docs/design/06-technical-architecture.md Section 3.1
--         docs/design/02-card-data-model.md Section 15 (ShardTransaction)
--         docs/design/04-progression-economy.md Section 9 (economy_config)
-- ============================================================================

-- ────────────────────────────────────────────
-- economy_config
-- Live-tunable key-value store for all economy parameters.
-- Admin dashboard reads/writes these. Game server and edge functions read.
-- ────────────────────────────────────────────
CREATE TABLE economy_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL DEFAULT 'system'
);

-- ────────────────────────────────────────────
-- shard_transactions
-- Audit trail for all shard earn/spend events.
-- ────────────────────────────────────────────
CREATE TABLE shard_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  shard_tier TEXT NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- dust_transactions
-- Audit trail for all Chaos Dust earn/spend events.
-- ────────────────────────────────────────────
CREATE TABLE dust_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  reference_id TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

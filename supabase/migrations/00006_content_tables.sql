-- ============================================================================
-- Migration 00006: Content Tables
-- Source: docs/design/06-technical-architecture.md Section 3.1 (missions)
--         docs/design/02-card-data-model.md Section 16 (Mission), 17 (Achievement)
--         docs/design/04-progression-economy.md Section 4 (Quest System)
-- ============================================================================

-- ────────────────────────────────────────────
-- achievements
-- Global achievement definitions. Not per-player.
-- ────────────────────────────────────────────
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('EVOLUTION', 'BATTLE', 'COLLECTION', 'CHAOS_ROLL', 'SOCIAL')),
  target_value INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('XP', 'SHARDS', 'CHAOS_ENERGY_BOOST')),
  reward_amount INTEGER NOT NULL DEFAULT 0,
  reward_title TEXT,
  icon_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- player_achievements
-- Per-player progress on each achievement.
-- ────────────────────────────────────────────
CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_player_achievement UNIQUE (player_id, achievement_id)
);

-- ────────────────────────────────────────────
-- missions
-- Active daily/weekly/onboarding quests per player.
-- ────────────────────────────────────────────
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  period TEXT NOT NULL CHECK (period IN ('DAILY', 'WEEKLY', 'ONBOARDING')),
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  reward_dust INTEGER NOT NULL DEFAULT 0,
  reward_shard_tier TEXT,
  reward_shard_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- quest_templates
-- Static quest template definitions used by the quest generation algorithm.
-- ────────────────────────────────────────────
CREATE TABLE quest_templates (
  id TEXT PRIMARY KEY,
  mission_type TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  period TEXT NOT NULL CHECK (period IN ('DAILY', 'WEEKLY', 'ONBOARDING')),
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  base_dust INTEGER NOT NULL DEFAULT 0,
  shard_reward_tier TEXT,
  shard_reward_count INTEGER NOT NULL DEFAULT 0,
  shard_reward_chance NUMERIC(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

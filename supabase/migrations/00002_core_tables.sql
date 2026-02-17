-- ============================================================================
-- Migration 00002: Core Tables
-- Source: docs/design/06-technical-architecture.md Section 3.1
--         docs/design/02-card-data-model.md Sections 1, 2, 9, 10, 11
--
-- Tables: factions, avatars, card_templates, players, card_instances, decks,
--         modifier_definitions, event_definitions
-- ============================================================================

-- ────────────────────────────────────────────
-- factions
-- ────────────────────────────────────────────
CREATE TABLE factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT UNIQUE NOT NULL CHECK (short_name IN ('IRONWRIGHT', 'FEY_COURTS', 'DEMONIC_KINGDOMS')),
  exclusive_mechanic TEXT NOT NULL CHECK (exclusive_mechanic IN ('AUGMENT', 'BOND', 'CORRUPTION')),
  art_prompt_prefix TEXT NOT NULL,
  flavor_voice TEXT NOT NULL,
  name_voice TEXT NOT NULL,
  card_frame_asset TEXT NOT NULL DEFAULT '',
  color_primary TEXT NOT NULL DEFAULT '#000000',
  color_secondary TEXT NOT NULL DEFAULT '#000000',
  color_background TEXT NOT NULL DEFAULT '#000000',
  particle_theme TEXT NOT NULL DEFAULT 'default',
  battle_music_url TEXT,
  ambient_audio_url TEXT,
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  card_template_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- avatars
-- ────────────────────────────────────────────
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  faction_id UUID NOT NULL REFERENCES factions(id),
  instability_modifier INTEGER NOT NULL,
  portrait_url TEXT NOT NULL DEFAULT '',
  battle_sprite_url TEXT NOT NULL DEFAULT '',
  frame_style TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL DEFAULT '',
  lore_text TEXT NOT NULL DEFAULT '',
  unlock_condition JSONB NOT NULL DEFAULT '{"type": "FREE_STARTER"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- card_templates
-- ────────────────────────────────────────────
CREATE TABLE card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('CREATURE', 'SPELL', 'STABILIZER')),
  faction_id UUID NOT NULL REFERENCES factions(id),

  -- Base stats
  base_attack INTEGER,
  base_health INTEGER,
  base_instability INTEGER NOT NULL DEFAULT 0 CHECK (base_instability BETWEEN 0 AND 5),
  mana_cost INTEGER NOT NULL CHECK (mana_cost BETWEEN 1 AND 10),

  -- Keywords
  base_keywords TEXT[] NOT NULL DEFAULT '{}',

  -- Spell/Stabilizer
  spell_effect JSONB,
  stabilizer_type TEXT CHECK (stabilizer_type IN ('ORDER', 'CHAOS', 'HYBRID')),

  -- AI generation metadata
  art_prompt TEXT NOT NULL,
  art_url TEXT NOT NULL,
  flavor_text TEXT NOT NULL DEFAULT '',

  -- Pipeline metadata
  batch_id TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  is_legendary_eligible BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- players
-- ────────────────────────────────────────────
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT UNIQUE NOT NULL CHECK (length(display_name) BETWEEN 3 AND 20),
  friend_code TEXT UNIQUE NOT NULL DEFAULT ('CHAOS-' || upper(substr(md5(random()::text), 1, 4))),

  -- Subscription
  subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'MID', 'HIGH')),

  -- Faction
  primary_faction_id UUID REFERENCES factions(id),
  unlocked_faction_ids UUID[] DEFAULT '{}',
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,

  -- Progression
  player_level INTEGER NOT NULL DEFAULT 1,
  player_xp INTEGER NOT NULL DEFAULT 0,
  season_rank TEXT NOT NULL DEFAULT 'BRONZE_3',
  season_rank_points INTEGER NOT NULL DEFAULT 0,
  hidden_mmr INTEGER NOT NULL DEFAULT 1000,

  -- Currency
  chaos_dust INTEGER NOT NULL DEFAULT 0 CHECK (chaos_dust >= 0),

  -- Collection limits (derived from subscription_tier, denormalized for query speed)
  max_cards_per_faction INTEGER NOT NULL DEFAULT 50,
  max_deck_slots INTEGER NOT NULL DEFAULT 3,

  -- Shards
  shards_uncommon INTEGER NOT NULL DEFAULT 0 CHECK (shards_uncommon >= 0),
  shards_rare INTEGER NOT NULL DEFAULT 0 CHECK (shards_rare >= 0),
  shards_epic INTEGER NOT NULL DEFAULT 0 CHECK (shards_epic >= 0),
  shards_legendary INTEGER NOT NULL DEFAULT 0 CHECK (shards_legendary >= 0),

  -- Profile
  showcase_card_ids UUID[] DEFAULT '{}',
  active_title TEXT,

  -- Stats
  total_games INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  cards_evolved_total INTEGER NOT NULL DEFAULT 0,
  highest_tier_reached TEXT NOT NULL DEFAULT 'COMMON',

  -- Social
  friend_ids UUID[] DEFAULT '{}',

  -- Settings (JSONB for flexibility)
  settings JSONB NOT NULL DEFAULT '{
    "master_volume": 1.0,
    "music_volume": 0.7,
    "sfx_volume": 1.0,
    "reduced_motion": false,
    "colorblind_mode": "NONE",
    "card_animation_quality": "FULL",
    "screen_shake": true,
    "auto_end_turn": false,
    "confirm_end_turn": true,
    "notify_daily_rewards": true,
    "notify_evolution_ready": true,
    "notify_friend_activity": true,
    "notify_season_ending": true,
    "block_friend_requests": false,
    "hide_profile": false,
    "hide_online_status": false
  }'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- card_instances
-- ────────────────────────────────────────────
CREATE TABLE card_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES card_templates(id),
  owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Current state
  tier TEXT NOT NULL DEFAULT 'COMMON' CHECK (tier IN ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  current_name TEXT NOT NULL,
  current_attack INTEGER,
  current_health INTEGER,
  current_mana_cost INTEGER NOT NULL,
  instability_value INTEGER NOT NULL DEFAULT 0,

  -- Keywords
  innate_keywords TEXT[] NOT NULL DEFAULT '{}',
  modifier_keywords TEXT[] NOT NULL DEFAULT '{}',

  -- Evolution history (JSONB array -- denormalized for single-row read)
  evolution_history JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Modifiers (JSONB array of ModifierInstance objects)
  modifiers JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Triggered abilities (JSONB array)
  triggered_abilities JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Progression
  chaos_energy INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,

  -- Art
  art_url TEXT NOT NULL,
  flavor_text TEXT NOT NULL DEFAULT '',
  art_prompt_history TEXT[] NOT NULL DEFAULT '{}',

  -- Metadata
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  in_deck_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_evolved_at TIMESTAMPTZ
);

-- ────────────────────────────────────────────
-- decks
-- ────────────────────────────────────────────
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  faction_id UUID NOT NULL REFERENCES factions(id),
  avatar_id UUID NOT NULL REFERENCES avatars(id),

  -- Contents (JSONB array of {card_instance_id, quantity})
  card_entries JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Validation
  is_valid BOOLEAN NOT NULL DEFAULT FALSE,
  validation_errors TEXT[] NOT NULL DEFAULT '{}',

  -- Stats
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- modifier_definitions
-- ────────────────────────────────────────────
CREATE TABLE modifier_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  flavor_text TEXT NOT NULL DEFAULT '',
  pool_type TEXT NOT NULL CHECK (pool_type IN ('UNIVERSAL', 'FACTION')),
  faction_id UUID REFERENCES factions(id),
  pp_cost INTEGER NOT NULL CHECK (pp_cost BETWEEN 1 AND 3),
  tier_bracket TEXT NOT NULL CHECK (tier_bracket IN ('EARLY', 'LATE')),
  attunement TEXT NOT NULL CHECK (attunement IN ('ORDER', 'CHAOS')),
  base_effect JSONB NOT NULL,
  attuned_effect JSONB NOT NULL,
  has_penalty BOOLEAN NOT NULL DEFAULT FALSE,
  penalty_effect JSONB,
  grants_keyword TEXT,
  keyword_is_attuned BOOLEAN NOT NULL DEFAULT FALSE,
  instability_adjustment INTEGER NOT NULL DEFAULT 0,
  instability_is_attuned BOOLEAN NOT NULL DEFAULT FALSE,
  faction_mechanic TEXT CHECK (faction_mechanic IN ('AUGMENT', 'BOND', 'CORRUPTION')),
  power_rating INTEGER NOT NULL DEFAULT 5 CHECK (power_rating BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- event_definitions
-- ────────────────────────────────────────────
CREATE TABLE event_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ORDER', 'CHAOS')),
  effect JSONB NOT NULL,
  description TEXT NOT NULL,
  design_notes TEXT NOT NULL DEFAULT '',
  can_backfire BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Migration 00001: Custom ENUM Types
-- Source: docs/design/02-card-data-model.md (all enum definitions)
--
-- Note: The tables in subsequent migrations use TEXT + CHECK constraints
-- (matching doc 06 Section 3), but we also create these types for reference,
-- validation in functions, and potential future use in stricter typing.
-- ============================================================================

-- Card types (Section 1)
CREATE TYPE card_type_enum AS ENUM ('CREATURE', 'SPELL', 'STABILIZER');

-- Keywords (Section 1)
CREATE TYPE keyword_enum AS ENUM (
  'SHIELD', 'LIFESTEAL', 'FLYING', 'REACH',
  'DEATHTOUCH', 'TAUNT', 'PIERCING'
);

-- Stabilizer types (Section 1)
CREATE TYPE stabilizer_type_enum AS ENUM ('ORDER', 'CHAOS', 'HYBRID');

-- Evolution tiers (Section 2)
CREATE TYPE evolution_tier_enum AS ENUM (
  'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'
);

-- Event types (Section 3)
CREATE TYPE event_type_enum AS ENUM ('ORDER', 'CHAOS');

-- Shard tiers (Section 3)
CREATE TYPE shard_tier_enum AS ENUM ('UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- Shard quality (Section 3)
CREATE TYPE shard_quality_enum AS ENUM ('PLANAR', 'REFINED', 'PRISMATIC');

-- Modifier pool type (Section 4a)
CREATE TYPE modifier_pool_type_enum AS ENUM ('UNIVERSAL', 'FACTION');

-- Tier bracket (Section 4a)
CREATE TYPE tier_bracket_enum AS ENUM ('EARLY', 'LATE');

-- Faction mechanic (Section 4a / Section 10)
CREATE TYPE faction_mechanic_enum AS ENUM ('AUGMENT', 'BOND', 'CORRUPTION');

-- Trigger types (Section 5)
CREATE TYPE trigger_type_enum AS ENUM (
  'ON_ORDER', 'ON_CHAOS', 'ON_PLAY', 'ON_DEATH',
  'ON_DAMAGE_TAKEN', 'ON_ATTACK', 'ON_BLOCK'
);

-- Spell effect types (Section 6)
CREATE TYPE spell_effect_type_enum AS ENUM (
  'DAMAGE', 'HEAL', 'BUFF_ATTACK', 'BUFF_HEALTH', 'DRAW', 'GAIN_MANA',
  'GRANT_KEYWORD', 'REMOVE_KEYWORD', 'DESTROY', 'INSTABILITY_MODIFY',
  'INSTABILITY_SET', 'CHOOSE_EVENT_TYPE', 'COST_REDUCTION'
);

-- Target types (Section 6)
CREATE TYPE target_type_enum AS ENUM (
  'SELF', 'FRIENDLY_CREATURE', 'ENEMY_CREATURE', 'ANY_CREATURE',
  'ALL_FRIENDLY', 'ALL_ENEMY', 'ALL_CREATURES',
  'RANDOM_FRIENDLY', 'RANDOM_ENEMY', 'RANDOM_ANY',
  'LOWEST_HP_FRIENDLY', 'LOWEST_HP_ENEMY',
  'HIGHEST_ATK_FRIENDLY', 'HIGHEST_ATK_ENEMY',
  'HIGHEST_COST_IN_HAND',
  'PLAYER_SELF', 'PLAYER_OPPONENT'
);

-- Duration types (Section 6)
CREATE TYPE duration_enum AS ENUM (
  'THIS_TURN', 'PERMANENT', 'WHILE_ON_FIELD', 'UNTIL_NEXT_ROLL'
);

-- Effect types (Section 7)
CREATE TYPE effect_type_enum AS ENUM (
  'STAT_MODIFY_ATTACK', 'STAT_MODIFY_HEALTH', 'STAT_MODIFY_COST',
  'DAMAGE', 'HEAL', 'HEAL_PLAYER',
  'DRAW_CARD', 'GAIN_MANA',
  'GRANT_KEYWORD', 'REMOVE_KEYWORD',
  'DESTROY_CREATURE',
  'SUMMON_TOKEN',
  'DOUBLE_MODIFIER_ACTIVATION',
  'COST_REDUCTION'
);

-- Subscription tiers (Section 12)
CREATE TYPE subscription_tier_enum AS ENUM ('FREE', 'MID', 'HIGH');

-- Season ranks (Section 12)
CREATE TYPE season_rank_enum AS ENUM (
  'BRONZE_3', 'BRONZE_2', 'BRONZE_1',
  'SILVER_3', 'SILVER_2', 'SILVER_1',
  'GOLD_3', 'GOLD_2', 'GOLD_1',
  'PLATINUM_3', 'PLATINUM_2', 'PLATINUM_1',
  'DIAMOND_3', 'DIAMOND_2', 'DIAMOND_1',
  'MASTER', 'GRANDMASTER'
);

-- Colorblind modes (Section 12)
CREATE TYPE colorblind_mode_enum AS ENUM (
  'NONE', 'DEUTERANOPIA', 'PROTANOPIA', 'TRITANOPIA'
);

-- Quality levels (Section 12)
CREATE TYPE quality_level_enum AS ENUM ('FULL', 'REDUCED', 'MINIMAL');

-- Game modes (Section 14)
CREATE TYPE game_mode_enum AS ENUM ('RANKED', 'CASUAL', 'PRACTICE');

-- End reasons (Section 14)
CREATE TYPE end_reason_enum AS ENUM ('HP_ZERO', 'SURRENDER', 'DISCONNECT', 'TIMEOUT');

-- Mission types (Section 16)
CREATE TYPE mission_type_enum AS ENUM (
  'WIN_GAMES', 'PLAY_CARDS', 'PLAY_CREATURES', 'PLAY_SPELLS',
  'EVOLVE_CARD', 'TRIGGER_ORDER_EVENTS', 'TRIGGER_CHAOS_EVENTS',
  'DEAL_DAMAGE', 'WIN_WITH_STYLE', 'PLAY_GAMES'
);

-- Reward types (Section 16)
CREATE TYPE reward_type_enum AS ENUM ('XP', 'SHARDS', 'CHAOS_ENERGY_BOOST');

-- Shard sources (Section 15)
CREATE TYPE shard_source_enum AS ENUM (
  'MATCH_REWARD', 'DAILY_LOGIN', 'WEEKLY_CHALLENGE', 'SEASON_REWARD',
  'MILESTONE', 'PURCHASE', 'EVOLUTION_CONSUMED', 'DISMANTLE_RETURN',
  'SUBSCRIPTION_GRANT'
);

-- Achievement categories (Section 17)
CREATE TYPE achievement_category_enum AS ENUM (
  'EVOLUTION', 'BATTLE', 'COLLECTION', 'CHAOS_ROLL', 'SOCIAL'
);

-- Mission difficulty (doc 06 Section 3 missions table)
CREATE TYPE mission_difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- Mission period (doc 06 Section 3 missions table)
CREATE TYPE mission_period_enum AS ENUM ('DAILY', 'WEEKLY', 'ONBOARDING');

-- Generation job types (doc 06 Section 3)
CREATE TYPE generation_job_type_enum AS ENUM (
  'EVOLUTION_IMAGE', 'EVOLUTION_TEXT', 'BASE_CARD_IMAGE', 'BASE_CARD_TEXT'
);

-- Generation job status (doc 06 Section 3)
CREATE TYPE generation_job_status_enum AS ENUM (
  'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING'
);

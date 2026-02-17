// _shared/types.ts — Shared TypeScript types for Edge Functions
// Derived from docs/design/02-card-data-model.md and the Supabase schema.

// ─── Enums ───────────────────────────────────────────────

export type CardType = "CREATURE" | "SPELL" | "STABILIZER";

export type Keyword =
  | "SHIELD"
  | "LIFESTEAL"
  | "FLYING"
  | "REACH"
  | "DEATHTOUCH"
  | "TAUNT"
  | "PIERCING";

export type EvolutionTier = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type ShardTier = "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type SubscriptionTier = "FREE" | "MID" | "HIGH";

export type FactionShortName = "IRONWRIGHT" | "FEY_COURTS" | "DEMONIC_KINGDOMS";

export type MissionType =
  | "WIN_GAMES"
  | "PLAY_CARDS"
  | "PLAY_CREATURES"
  | "PLAY_SPELLS"
  | "EVOLVE_CARD"
  | "TRIGGER_ORDER_EVENTS"
  | "TRIGGER_CHAOS_EVENTS"
  | "DEAL_DAMAGE"
  | "WIN_WITH_STYLE"
  | "PLAY_GAMES";

export type MissionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type MissionPeriod = "DAILY" | "WEEKLY" | "ONBOARDING";

export type AchievementCategory = "EVOLUTION" | "BATTLE" | "COLLECTION" | "CHAOS_ROLL" | "SOCIAL";

export type SeasonRank =
  | "BRONZE_3" | "BRONZE_2" | "BRONZE_1"
  | "SILVER_3" | "SILVER_2" | "SILVER_1"
  | "GOLD_3" | "GOLD_2" | "GOLD_1"
  | "PLATINUM_3" | "PLATINUM_2" | "PLATINUM_1"
  | "DIAMOND_3" | "DIAMOND_2" | "DIAMOND_1"
  | "MASTER" | "GRANDMASTER";

export type GameMode = "RANKED" | "CASUAL" | "PRACTICE";

// ─── Database Row Types ──────────────────────────────────

export interface Player {
  id: string;
  auth_id: string;
  display_name: string;
  friend_code: string;
  subscription_tier: SubscriptionTier;
  primary_faction_id: string | null;
  unlocked_faction_ids: string[];
  onboarding_complete: boolean;
  player_level: number;
  player_xp: number;
  season_rank: SeasonRank;
  season_rank_points: number;
  hidden_mmr: number;
  chaos_dust: number;
  max_cards_per_faction: number;
  max_deck_slots: number;
  shards_uncommon: number;
  shards_rare: number;
  shards_epic: number;
  shards_legendary: number;
  showcase_card_ids: string[];
  active_title: string | null;
  total_games: number;
  total_wins: number;
  total_losses: number;
  current_win_streak: number;
  best_win_streak: number;
  cards_evolved_total: number;
  highest_tier_reached: string;
  friend_ids: string[];
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  card_type: CardType;
  faction_id: string;
  base_attack: number | null;
  base_health: number | null;
  base_instability: number;
  mana_cost: number;
  base_keywords: string[];
  spell_effect: Record<string, unknown> | null;
  stabilizer_type: string | null;
  art_prompt: string;
  art_url: string;
  flavor_text: string;
  batch_id: string | null;
  approved_at: string | null;
  approved_by: string | null;
  is_legendary_eligible: boolean;
  created_at: string;
}

export interface CardInstance {
  id: string;
  template_id: string;
  owner_id: string;
  tier: EvolutionTier;
  current_name: string;
  current_attack: number | null;
  current_health: number | null;
  current_mana_cost: number;
  instability_value: number;
  innate_keywords: string[];
  modifier_keywords: string[];
  evolution_history: unknown[];
  modifiers: unknown[];
  triggered_abilities: unknown[];
  chaos_energy: number;
  games_played: number;
  art_url: string;
  flavor_text: string;
  art_prompt_history: string[];
  is_favorite: boolean;
  in_deck_ids: string[];
  created_at: string;
  last_evolved_at: string | null;
}

export interface Deck {
  id: string;
  owner_id: string;
  name: string;
  faction_id: string;
  avatar_id: string;
  card_entries: DeckEntry[];
  is_valid: boolean;
  validation_errors: string[];
  games_played: number;
  wins: number;
  losses: number;
  created_at: string;
  updated_at: string;
}

export interface DeckEntry {
  card_instance_id: string;
  quantity: number;
}

export interface Mission {
  id: string;
  player_id: string;
  mission_type: MissionType;
  description: string;
  difficulty: MissionDifficulty;
  period: MissionPeriod;
  target_value: number;
  current_value: number;
  is_completed: boolean;
  is_claimed: boolean;
  reward_dust: number;
  reward_shard_tier: ShardTier | null;
  reward_shard_count: number;
  expires_at: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  target_value: number;
  reward_type: string;
  reward_amount: number;
  reward_title: string | null;
  icon_url: string;
  created_at: string;
}

export interface PlayerAchievement {
  id: string;
  player_id: string;
  achievement_id: string;
  current_value: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
}

export interface Avatar {
  id: string;
  name: string;
  faction_id: string;
  instability_modifier: number;
  portrait_url: string;
  battle_sprite_url: string;
  frame_style: string;
  title: string;
  lore_text: string;
  unlock_condition: Record<string, unknown>;
  created_at: string;
}

export interface QuestTemplate {
  id: string;
  mission_type: MissionType;
  difficulty: MissionDifficulty;
  period: MissionPeriod;
  description: string;
  target_value: number;
  base_dust: number;
  shard_reward_tier: ShardTier | null;
  shard_reward_count: number;
  shard_reward_chance: number;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────

/** Energy thresholds for evolution. Key = target tier. */
export const EVOLUTION_ENERGY_THRESHOLDS: Record<EvolutionTier, number> = {
  COMMON: 0,
  UNCOMMON: 15,
  RARE: 30,
  EPIC: 50,
  LEGENDARY: 75,
};

/** Cumulative energy needed to reach a tier from Common. */
export const CUMULATIVE_ENERGY: Record<EvolutionTier, number> = {
  COMMON: 0,
  UNCOMMON: 15,
  RARE: 45,
  EPIC: 95,
  LEGENDARY: 170,
};

/** The next tier in the evolution path. */
export const NEXT_TIER: Record<string, EvolutionTier | null> = {
  COMMON: "UNCOMMON",
  UNCOMMON: "RARE",
  RARE: "EPIC",
  EPIC: "LEGENDARY",
  LEGENDARY: null,
};

/** The shard tier required for each evolution step. */
export const EVOLUTION_SHARD_TIER: Record<string, ShardTier> = {
  UNCOMMON: "UNCOMMON",
  RARE: "RARE",
  EPIC: "EPIC",
  LEGENDARY: "LEGENDARY",
};

/** Dust cost per shard tier. */
export const SHARD_DUST_COSTS: Record<ShardTier, number> = {
  UNCOMMON: 30,
  RARE: 60,
  EPIC: 120,
  LEGENDARY: 240,
};

/** Subscription-tier quest dust multiplier. */
export const SUBSCRIPTION_QUEST_MULTIPLIER: Record<SubscriptionTier, number> = {
  FREE: 1.0,
  MID: 1.5,
  HIGH: 2.0,
};

/** Max deck slots by subscription tier. Source: docs/design/09-monetization-details.md */
export const MAX_DECK_SLOTS: Record<SubscriptionTier, number> = {
  FREE: 3,
  MID: 6,
  HIGH: 10,
};

/** Deck validation constants. */
export const DECK_SIZE = 20;
export const MAX_COPIES_PER_TEMPLATE = 2;
export const MAX_LEGENDARIES = 2;

/** Column name for shard tier on the players table. */
export const SHARD_COLUMN: Record<ShardTier, string> = {
  UNCOMMON: "shards_uncommon",
  RARE: "shards_rare",
  EPIC: "shards_epic",
  LEGENDARY: "shards_legendary",
};

/** Faction mastery XP per game and win bonus. */
export const MASTERY_XP_PER_GAME = 10;
export const MASTERY_XP_WIN_BONUS = 5;
export const MASTERY_XP_PER_LEVEL = 100;
export const MASTERY_MAX_LEVEL = 10;

// Chaos Creatures Game Server — Full Game State Types
// Source of truth: docs/design/02-card-data-model.md Section 13

import type {
  CardType,
  Keyword,
  EventType,
  PlayerSide,
  TurnPhase,
  FactionMechanic,
  ModifierPoolType,
  EffectType,
  TargetType,
  Duration,
  TriggerType,
  ConditionType,
  LogEntryType,
  GameMode,
  EndReason,
  SeasonRank,
  FactionId,
} from './enums';

// ─── Effect Schema (atomic game logic unit) ─────────────

export interface Condition {
  type: ConditionType;
  value?: number;
  keyword?: Keyword;
  event_type?: EventType;
}

export interface Effect {
  effect_type: EffectType;
  target: TargetType;
  value?: number;
  keyword?: Keyword;
  duration?: Duration;
  secondary_effect?: Effect;
  condition?: Condition;
}

// ─── Battle Modifier (runtime state) ─────────────

export interface BattleModifier {
  definition_id: string;
  name: string;
  pool_type: ModifierPoolType;
  faction_mechanic?: FactionMechanic;
  attunement: EventType;
  base_effect: Effect;
  attuned_effect: Effect;
  has_penalty: boolean;
  penalty_effect?: Effect;
  grants_keyword?: Keyword;
  keyword_is_attuned: boolean;
  instability_adjustment: number;
  instability_is_attuned: boolean;

  // Current state
  is_attuned_active: boolean;
  is_penalty_active: boolean;
}

// ─── Triggered Ability ─────────────

export interface TriggeredAbility {
  id: string;
  card_instance_id: string;
  evolution_step: number;
  trigger: TriggerType;
  effect: Effect;
  description: string;
  name: string;
}

// ─── Temporary Buff ─────────────

export interface TempBuff {
  effect: Effect;
  expires_at: 'END_OF_TURN' | 'UNTIL_NEXT_ROLL';
  source: string;
}

// ─── Battle Card (base for hand/deck/graveyard) ─────────────

export interface BattleCard {
  instance_id: string;
  template_id: string;
  card_type: CardType;
  name: string;
  mana_cost: number;
  art_url: string;
  base_attack?: number;
  base_health?: number;
  base_instability: number;
  innate_keywords: Keyword[];
  modifiers: BattleModifier[];
  triggered_abilities: TriggeredAbility[];
  faction_id: string;
}

// ─── Battle Creature (on board — extends BattleCard) ─────────────

export interface BattleCreature extends BattleCard {
  // Current combat stats (includes all active modifiers and buffs)
  attack: number;
  health: number;
  max_health: number;

  // State
  has_attacked: boolean;
  is_alive: boolean;

  // Instability
  instability_value: number;

  // Effective keywords right now
  active_keywords: Keyword[];
  shield_active: boolean;

  // Temporary effects
  temp_buffs: TempBuff[];

  // Board position
  board_slot: number;
}

// ─── Battle Ruin (Planar Ruin on board) ─────────────

export interface BattleRuin extends BattleCard {
  // Current stats
  health: number;
  max_health: number;

  // State
  is_alive: boolean;

  // Board position
  board_slot: number;

  // Ruin-specific effects
  passive_effect: Effect;
  destruction_penalty: Effect;

  // Ward protection (cannot be targeted by opponent modifier effects for 1 turn)
  ward_active: boolean;
}

// ─── Blocker Assignment ─────────────

export interface BlockerAssignment {
  blocker_creature_id: string;
  attacker_creature_id: string;
}

// ─── Game Log Entry ─────────────

export interface GameLogEntry {
  turn: number;
  phase: TurnPhase;
  timestamp: string;
  entry_type: LogEntryType;
  description: string;
  data: Record<string, unknown>;
}

// ─── Battle Player ─────────────

export interface BattlePlayer {
  player_id: string;
  side: PlayerSide;
  avatar_id: string;
  avatar_instability_modifier: number;

  // Health
  current_hp: number;
  max_hp: number;

  // Mana
  current_mana: number;
  mana_cap: number;

  // Instability (computed)
  instability: number;

  // Board: 5 slots, each null (empty) or occupied by a creature or ruin
  board: (BattleCreature | BattleRuin | null)[];

  // Whether a Planar Ruin is currently on the board
  ruin_on_board: boolean;

  // Hand
  hand: BattleCard[];

  // Deck (order matters — index 0 = next draw)
  deck: BattleCard[];

  // Graveyard
  graveyard: BattleCard[];

  // Chaos Spark (P2 only)
  has_chaos_spark: boolean;

  // Attunement tracking
  last_event_type: EventType | null;

  // Disconnect tracking
  consecutive_missed_turns: number;
  is_connected: boolean;

  // Deck info for match record
  deck_id: string;
  faction_id: string;
  season_rank: SeasonRank;
}

// ─── Game State (full runtime state) ─────────────

export interface GameState {
  match_id: string;
  mode: GameMode;
  started_at: string;
  current_turn: number;
  active_player: PlayerSide;
  phase: TurnPhase;

  // Players
  player_1: BattlePlayer;
  player_2: BattlePlayer;

  // First/second tracking
  first_player: PlayerSide;

  // Combat state
  declared_attackers: string[];
  blocker_assignments: BlockerAssignment[];

  // Chaos roll state
  last_roll_value: number | null;
  last_roll_event: EventType | null;
  last_roll_event_id: string | null;

  // Pending event awaiting player choice (O2 Planar Ward, O5 Fortify)
  pending_event_id?: string;

  // Turn timer
  turn_timer_started: string | null;
  turn_timer_seconds: number;

  // Game log
  log: GameLogEntry[];

  // Winner (set when game ends)
  winner: PlayerSide | null;

  // Seeded RNG seed
  rng_seed: number;
  rng_counter: number;
}

// ─── Event Definition ─────────────

export interface EventDefinition {
  id: string;
  name: string;
  event_type: EventType;
  effect: Effect;
  description: string;
  design_notes: string;
  can_backfire: boolean;
}

// ─── Combat Result Types ─────────────

export interface CombatPairResult {
  attacker_id: string;
  blocker_id: string;
  attacker_damage_dealt: number;
  blocker_damage_dealt: number;
  attacker_died: boolean;
  blocker_died: boolean;
  piercing_damage: number;
  attacker_lifesteal: number;
  blocker_lifesteal: number;
  attacker_shield_broke: boolean;
  blocker_shield_broke: boolean;
}

export interface UnblockedResult {
  attacker_id: string;
  face_damage: number;
  lifesteal: number;
}

export interface CombatResult {
  pairs: CombatPairResult[];
  unblocked: UnblockedResult[];
  deaths: Array<{ creature_id: string; side: PlayerSide; board_slot: number }>;
}

// ─── Chaos Roll Result ─────────────

export interface ChaosRollResult {
  roll: number;
  result: 'ORDER' | 'CHAOS' | 'NOTHING';
  instability: number;
}

// ─── Event Resolution Result ─────────────

export interface EventResolutionResult {
  event: EventDefinition;
  event_effect_results: EffectResult[];
  trigger_results: TriggerResult[];
}

export interface TriggerResult {
  creature_id: string;
  ability_name: string;
  effect_results: EffectResult[];
}

export interface EffectResult {
  effect_type: EffectType;
  target_ids: string[];
  value?: number;
  description: string;
}

// ─── Card Play Record (for match record) ─────────────

export interface CardPlayRecord {
  card_instance_id: string;
  player_id: string;
  turns_on_board: number;
  damage_dealt: number;
  damage_taken: number;
  triggers_fired: number;
  was_destroyed: boolean;
}

// ─── Match Record ─────────────

export interface MatchRecord {
  id: string;
  mode: GameMode;
  player_1_id: string;
  player_2_id: string;
  winner_id: string | null;
  loser_id: string | null;
  player_1_deck_id: string;
  player_2_deck_id: string;
  player_1_avatar_id: string;
  player_2_avatar_id: string;
  player_1_faction_id: string;
  player_2_faction_id: string;
  end_reason: EndReason;
  total_turns: number;
  duration_seconds: number;
  player_1_final_hp: number;
  player_2_final_hp: number;
  player_1_rank: SeasonRank;
  player_2_rank: SeasonRank;
  cards_played: CardPlayRecord[];
  total_rolls: number;
  order_events_p1: number;
  chaos_events_p1: number;
  order_events_p2: number;
  chaos_events_p2: number;
  full_log: GameLogEntry[];
  started_at: string;
  ended_at: string;
  season_id: string;
}

// Chaos Creatures Game Server — WebSocket Message Types
// Client -> Server actions and Server -> Client events
// Source: docs/design/06-technical-architecture.md Section 5.5

import { z } from 'zod';
import type {
  PlayerSide,
  TurnPhase,
  EventType,
  ChaosRollOutcome,
  EndReason,
  Keyword,
} from './enums';
import type {
  GameState,
  BattleCreature,
  BattleRuin,
  BattleCard,
  EventDefinition,
  CombatPairResult,
  UnblockedResult,
  TriggerResult,
  EffectResult,
} from './game-state';

// ═══════════════════════════════════════════════════
// CLIENT -> SERVER ACTIONS (validated by Zod)
// ═══════════════════════════════════════════════════

export const PlayCardActionSchema = z.object({
  type: z.literal('PLAY_CARD'),
  card_id: z.string().uuid(),
  target_slot: z.number().int().min(0).max(4).optional(),
  target_id: z.string().uuid().optional(),
});

export const UseChaosSparkSchema = z.object({
  type: z.literal('USE_CHAOS_SPARK'),
});

export const EndMainPhaseSchema = z.object({
  type: z.literal('END_MAIN_PHASE'),
});

export const DeclareAttackersSchema = z.object({
  type: z.literal('DECLARE_ATTACKERS'),
  attacker_ids: z.array(z.string()),
  ruin_targets: z.record(z.string(), z.string()).optional(), // attacker_id -> ruin_id
});

export const AssignBlockersSchema = z.object({
  type: z.literal('ASSIGN_BLOCKERS'),
  assignments: z.array(z.object({
    blocker_id: z.string(),
    attacker_id: z.string(),
  })),
});

export const ChooseEventTargetSchema = z.object({
  type: z.literal('CHOOSE_EVENT_TARGET'),
  creature_id: z.string(),
});

export const SurrenderSchema = z.object({
  type: z.literal('SURRENDER'),
});

export const MulliganSchema = z.object({
  type: z.literal('MULLIGAN'),
  keep: z.boolean(),
});

export const ReconnectSchema = z.object({
  type: z.literal('RECONNECT'),
});

export const EndTurnSchema = z.object({
  type: z.literal('END_TURN'),
});

export const ClientActionSchema = z.discriminatedUnion('type', [
  PlayCardActionSchema,
  UseChaosSparkSchema,
  EndMainPhaseSchema,
  DeclareAttackersSchema,
  AssignBlockersSchema,
  ChooseEventTargetSchema,
  SurrenderSchema,
  MulliganSchema,
  ReconnectSchema,
  EndTurnSchema,
]);

export type ClientAction = z.infer<typeof ClientActionSchema>;

// ═══════════════════════════════════════════════════
// SERVER -> CLIENT EVENTS
// ═══════════════════════════════════════════════════

/** Full state snapshot (sent on connect/reconnect, filtered per player) */
export interface StateSnapshotEvent {
  type: 'STATE_SNAPSHOT';
  state: ClientGameState;
}

/** Turn started */
export interface TurnStartEvent {
  type: 'TURN_START';
  turn: number;
  active_player: PlayerSide;
}

/** Chaos roll result */
export interface ChaosRollEvent {
  type: 'CHAOS_ROLL';
  roll: number;
  instability: number;
  result: ChaosRollOutcome;
  active_player: PlayerSide;
}

/** Event triggered (Order or Chaos) */
export interface EventTriggeredEvent {
  type: 'EVENT_TRIGGERED';
  event_id: string;
  event_name: string;
  event_type: EventType;
  description: string;
  effect_results: EffectResult[];
  trigger_results: TriggerResult[];
  requires_choice: boolean;
  valid_targets?: string[];
}

/** Player drew a card (only sent to that player) */
export interface CardDrawnEvent {
  type: 'CARD_DRAWN';
  card: BattleCard;
  player: PlayerSide;
  cards_remaining: number;
}

/** Mana gained */
export interface ManaGainedEvent {
  type: 'MANA_GAINED';
  player: PlayerSide;
  current_mana: number;
  mana_cap: number;
}

/** Card played */
export interface CardPlayedEvent {
  type: 'CARD_PLAYED';
  player: PlayerSide;
  card: BattleCard;
  slot?: number;
  creature?: BattleCreature;
  mana_remaining: number;
  effect_results?: EffectResult[];
}

/** Attackers declared */
export interface AttackersDeclaredEvent {
  type: 'ATTACKERS_DECLARED';
  attacker_ids: string[];
  player: PlayerSide;
}

/** Blockers assigned */
export interface BlockersAssignedEvent {
  type: 'BLOCKERS_ASSIGNED';
  assignments: Array<{ blocker_id: string; attacker_id: string }>;
  player: PlayerSide;
}

/** Combat resolution */
export interface CombatResolvedEvent {
  type: 'COMBAT_RESOLVED';
  pairs: CombatPairResult[];
  unblocked: UnblockedResult[];
  deaths: Array<{ creature_id: string; side: PlayerSide; board_slot: number }>;
  player_1_hp: number;
  player_2_hp: number;
}

/** Creature destroyed */
export interface CreatureDestroyedEvent {
  type: 'CREATURE_DESTROYED';
  creature_id: string;
  board_slot: number;
  player: PlayerSide;
  cause: string;
}

/** HP changed */
export interface HpChangedEvent {
  type: 'HP_CHANGED';
  player: PlayerSide;
  old_hp: number;
  new_hp: number;
  cause: string;
}

/** Instability changed */
export interface InstabilityChangedEvent {
  type: 'INSTABILITY_CHANGED';
  player: PlayerSide;
  old_instability: number;
  new_instability: number;
}

/** Timer warning */
export interface TimerWarningEvent {
  type: 'TIMER_WARNING';
  seconds_remaining: number;
  phase: TurnPhase;
}

/** Timer expired */
export interface TimerExpiredEvent {
  type: 'TIMER_EXPIRED';
  phase: TurnPhase;
  player: PlayerSide;
}

/** Match ended */
export interface MatchEndEvent {
  type: 'MATCH_END';
  winner: PlayerSide;
  end_reason: EndReason;
  player_1_final_hp: number;
  player_2_final_hp: number;
  total_turns: number;
}

/** Mulligan request */
export interface MulliganRequestEvent {
  type: 'MULLIGAN_REQUEST';
  hand: BattleCard[];
}

/** Phase changed */
export interface PhaseChangedEvent {
  type: 'PHASE_CHANGED';
  phase: TurnPhase;
  active_player: PlayerSide;
}

/** Chaos spark used */
export interface ChaosSparkUsedEvent {
  type: 'CHAOS_SPARK_USED';
  player: PlayerSide;
  mana_after: number;
}

/** Opponent hand count update (don't reveal cards) */
export interface OpponentHandUpdateEvent {
  type: 'OPPONENT_HAND_UPDATE';
  count: number;
}

/** Error from the server */
export interface ServerErrorEvent {
  type: 'SERVER_ERROR';
  code: string;
  message: string;
}

export type ServerEvent =
  | StateSnapshotEvent
  | TurnStartEvent
  | ChaosRollEvent
  | EventTriggeredEvent
  | CardDrawnEvent
  | ManaGainedEvent
  | CardPlayedEvent
  | AttackersDeclaredEvent
  | BlockersAssignedEvent
  | CombatResolvedEvent
  | CreatureDestroyedEvent
  | HpChangedEvent
  | InstabilityChangedEvent
  | TimerWarningEvent
  | TimerExpiredEvent
  | MatchEndEvent
  | MulliganRequestEvent
  | PhaseChangedEvent
  | ChaosSparkUsedEvent
  | OpponentHandUpdateEvent
  | ServerErrorEvent;

// ═══════════════════════════════════════════════════
// CLIENT GAME STATE (filtered — hides opponent hand/deck)
// ═══════════════════════════════════════════════════

export interface ClientBattlePlayer {
  player_id: string;
  side: PlayerSide;
  avatar_id: string;
  current_hp: number;
  max_hp: number;
  current_mana: number;
  mana_cap: number;
  instability: number;
  board: (BattleCreature | BattleRuin | null)[];
  hand_count: number;
  deck_count: number;
  graveyard_count: number;
  has_chaos_spark: boolean;
  last_event_type: EventType | null;
  consecutive_missed_turns: number;
  is_connected: boolean;
}

export interface ClientGameState {
  match_id: string;
  current_turn: number;
  active_player: PlayerSide;
  phase: TurnPhase;
  first_player: PlayerSide;
  declared_attackers: string[];
  blocker_assignments: Array<{ blocker_creature_id: string; attacker_creature_id: string }>;
  last_roll_value: number | null;
  last_roll_event: EventType | null;
  last_roll_event_id: string | null;
  turn_timer_started: string | null;
  turn_timer_seconds: number;
  my_side: PlayerSide;
  my_hand: BattleCard[];
  my_deck_count: number;
  opponent: ClientBattlePlayer;
  me: ClientBattlePlayer;
  winner: PlayerSide | null;
}

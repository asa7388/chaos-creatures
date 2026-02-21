// Chaos Creatures Game Server — Match Lifecycle
// Create, join, start, end, forfeit, reconnect
// Source: docs/design/06-technical-architecture.md Section 5

import type {
  GameState,
  BattlePlayer,
  BattleCard,
  BattleCreature,
  MatchRecord,
} from '../types/game-state';
import type { PlayerSide, GameMode, EndReason, SeasonRank } from '../types/enums';
import {
  STARTING_HP,
  MAX_HP,
  MAX_MANA,
  MAX_BOARD_SLOTS,
  P1_HAND_SIZE,
  P2_HAND_SIZE,
  DECK_SIZE,
  RUIN_FAMILIARITY_WIN,
  RUIN_FAMILIARITY_LOSS,
} from './constants';
import { SeededRNG, generateMatchSeed } from './rng';
import { recalculateInstability } from './instability';
import { ClientGameState, ClientBattlePlayer } from '../types/messages';

// ─── Match Store (in-memory) ─────────────

const activeMatches = new Map<string, GameState>();

/** Get an active match by ID */
export function getMatch(matchId: string): GameState | undefined {
  return activeMatches.get(matchId);
}

/** Store an active match */
export function storeMatch(state: GameState): void {
  activeMatches.set(state.match_id, state);
}

/** Remove a match from active storage */
export function removeMatch(matchId: string): void {
  activeMatches.delete(matchId);
}

/** Get count of active matches */
export function getActiveMatchCount(): number {
  return activeMatches.size;
}

// ─── Match Participant Data ─────────────

export interface MatchParticipant {
  player_id: string;
  deck_cards: BattleCard[];
  avatar_id: string;
  avatar_instability_modifier: number;
  deck_id: string;
  faction_id: string;
  season_rank: SeasonRank;
}

// ─── Create Match ─────────────

/**
 * Create a new match with two participants.
 * Shuffles decks, deals opening hands, assigns P1/P2.
 */
export function createMatch(
  matchId: string,
  mode: GameMode,
  participant1: MatchParticipant,
  participant2: MatchParticipant
): GameState {
  const seed = generateMatchSeed();
  const rng = new SeededRNG(seed);

  // Randomly assign P1/P2
  const p1IsFirst = rng.next() < 0.5;
  const p1Data = p1IsFirst ? participant1 : participant2;
  const p2Data = p1IsFirst ? participant2 : participant1;

  // Create decks and shuffle
  const p1Deck = [...p1Data.deck_cards];
  const p2Deck = [...p2Data.deck_cards];
  rng.shuffle(p1Deck);
  rng.shuffle(p2Deck);

  // Deal opening hands
  const p1Hand = p1Deck.splice(0, P1_HAND_SIZE);
  const p2Hand = p2Deck.splice(0, P2_HAND_SIZE);

  // Create player states
  const player1: BattlePlayer = {
    player_id: p1Data.player_id,
    side: 'PLAYER_1',
    avatar_id: p1Data.avatar_id,
    avatar_instability_modifier: p1Data.avatar_instability_modifier,
    current_hp: STARTING_HP,
    max_hp: MAX_HP,
    current_mana: 0,
    mana_cap: MAX_MANA,
    instability: 1,
    board: Array(MAX_BOARD_SLOTS).fill(null),
    ruin_on_board: false,
    stability_zone: [],
    stabilizers_played_this_turn: 0,
    lingering_effects: [],
    hand: p1Hand,
    deck: p1Deck,
    graveyard: [],
    has_chaos_spark: false,
    last_event_type: null,
    consecutive_missed_turns: 0,
    is_connected: true,
    deck_id: p1Data.deck_id,
    faction_id: p1Data.faction_id,
    season_rank: p1Data.season_rank,
  };

  const player2: BattlePlayer = {
    player_id: p2Data.player_id,
    side: 'PLAYER_2',
    avatar_id: p2Data.avatar_id,
    avatar_instability_modifier: p2Data.avatar_instability_modifier,
    current_hp: STARTING_HP,
    max_hp: MAX_HP,
    current_mana: 0,
    mana_cap: MAX_MANA,
    instability: 1,
    board: Array(MAX_BOARD_SLOTS).fill(null),
    ruin_on_board: false,
    stability_zone: [],
    stabilizers_played_this_turn: 0,
    lingering_effects: [],
    hand: p2Hand,
    deck: p2Deck,
    graveyard: [],
    has_chaos_spark: true, // P2 gets Chaos Spark
    last_event_type: null,
    consecutive_missed_turns: 0,
    is_connected: true,
    deck_id: p2Data.deck_id,
    faction_id: p2Data.faction_id,
    season_rank: p2Data.season_rank,
  };

  // Calculate initial instability (no creatures on board yet, so just avatar modifier)
  recalculateInstability(player1);
  recalculateInstability(player2);

  const state: GameState = {
    match_id: matchId,
    mode,
    started_at: new Date().toISOString(),
    current_turn: 0, // Will be incremented to 1 at start of first turn
    active_player: 'PLAYER_1',
    phase: 'GAME_SETUP',
    player_1: player1,
    player_2: player2,
    first_player: 'PLAYER_1',
    declared_attackers: [],
    blocker_assignments: [],
    ruin_attack_targets: {},
    last_roll_value: null,
    last_roll_event: null,
    last_roll_event_id: null,
    turn_timer_started: null,
    turn_timer_seconds: 60,
    log: [],
    winner: null,
    rng_seed: seed,
    rng_counter: rng.getCounter(),
  };

  storeMatch(state);
  return state;
}

// ─── End Match ─────────────

/** Ruin familiarity progress earned in a match */
export interface RuinFamiliarityProgress {
  player_id: string;
  ruin_template_ids: string[];
  familiarity_gained: number;
}

export interface MatchEndResult {
  winner_id: string;
  loser_id: string;
  end_reason: EndReason;
  match_record: MatchRecord;
  ruin_familiarity: RuinFamiliarityProgress[];
}

/**
 * End a match and create the match record.
 */
export function endMatch(
  state: GameState,
  endReason: EndReason
): MatchEndResult {
  state.phase = 'GAME_OVER';

  const winner = state.winner === 'PLAYER_1' ? state.player_1 : state.player_2;
  const loser = state.winner === 'PLAYER_1' ? state.player_2 : state.player_1;

  const matchRecord: MatchRecord = {
    id: state.match_id,
    mode: state.mode,
    player_1_id: state.player_1.player_id,
    player_2_id: state.player_2.player_id,
    winner_id: winner.player_id,
    loser_id: loser.player_id,
    player_1_deck_id: state.player_1.deck_id,
    player_2_deck_id: state.player_2.deck_id,
    player_1_avatar_id: state.player_1.avatar_id,
    player_2_avatar_id: state.player_2.avatar_id,
    player_1_faction_id: state.player_1.faction_id,
    player_2_faction_id: state.player_2.faction_id,
    end_reason: endReason,
    total_turns: state.current_turn,
    duration_seconds: Math.floor(
      (Date.now() - new Date(state.started_at).getTime()) / 1000
    ),
    player_1_final_hp: state.player_1.current_hp,
    player_2_final_hp: state.player_2.current_hp,
    player_1_rank: state.player_1.season_rank,
    player_2_rank: state.player_2.season_rank,
    cards_played: [], // TODO: Track during match
    total_rolls: state.log.filter(e => e.entry_type === 'ROLL').length,
    order_events_p1: state.log.filter(
      e => e.entry_type === 'EVENT_TRIGGERED' && e.data.player === 'PLAYER_1' && e.data.event_type === 'ORDER'
    ).length,
    chaos_events_p1: state.log.filter(
      e => e.entry_type === 'EVENT_TRIGGERED' && e.data.player === 'PLAYER_1' && e.data.event_type === 'CHAOS'
    ).length,
    order_events_p2: state.log.filter(
      e => e.entry_type === 'EVENT_TRIGGERED' && e.data.player === 'PLAYER_2' && e.data.event_type === 'ORDER'
    ).length,
    chaos_events_p2: state.log.filter(
      e => e.entry_type === 'EVENT_TRIGGERED' && e.data.player === 'PLAYER_2' && e.data.event_type === 'CHAOS'
    ).length,
    full_log: state.log,
    started_at: state.started_at,
    ended_at: new Date().toISOString(),
    season_id: 'season_1',
  };

  removeMatch(state.match_id);

  // Track ruin familiarity progress for both players
  const ruinFamiliarity: RuinFamiliarityProgress[] = [];
  for (const player of [state.player_1, state.player_2]) {
    // Find all PLANAR_RUIN cards that were in the player's deck or graveyard
    const ruinTemplateIds = new Set<string>();
    for (const card of [...player.graveyard, ...player.deck, ...player.hand]) {
      if (card.card_type === 'PLANAR_RUIN') {
        ruinTemplateIds.add(card.template_id);
      }
    }
    // Also check the board for any surviving ruins
    for (const entity of player.board) {
      if (entity && entity.card_type === 'PLANAR_RUIN') {
        ruinTemplateIds.add(entity.template_id);
      }
    }

    if (ruinTemplateIds.size > 0) {
      const isWinner = player.player_id === winner.player_id;
      ruinFamiliarity.push({
        player_id: player.player_id,
        ruin_template_ids: Array.from(ruinTemplateIds),
        familiarity_gained: isWinner ? RUIN_FAMILIARITY_WIN : RUIN_FAMILIARITY_LOSS,
      });
    }
  }

  return {
    winner_id: winner.player_id,
    loser_id: loser.player_id,
    end_reason: endReason,
    match_record: matchRecord,
    ruin_familiarity: ruinFamiliarity,
  };
}

// ─── Forfeit ─────────────

export function forfeitMatch(
  state: GameState,
  forfeitingPlayerId: string
): MatchEndResult {
  const forfeiter = state.player_1.player_id === forfeitingPlayerId
    ? state.player_1
    : state.player_2;

  state.winner = forfeiter.side === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
  return endMatch(state, 'SURRENDER');
}

// ─── Disconnect handling ─────────────

export function handleDisconnect(state: GameState, playerId: string): void {
  const player = state.player_1.player_id === playerId
    ? state.player_1
    : state.player_2;

  player.is_connected = false;
}

export function handleReconnect(state: GameState, playerId: string): void {
  const player = state.player_1.player_id === playerId
    ? state.player_1
    : state.player_2;

  player.is_connected = true;
  player.consecutive_missed_turns = 0;
}

// ─── State Projection (client-safe view) ─────────────

/**
 * Create a client-safe view of the game state.
 * Hides the opponent's hand contents and deck order.
 */
export function createClientGameState(
  state: GameState,
  forPlayer: PlayerSide
): ClientGameState {
  const isP1 = forPlayer === 'PLAYER_1';
  const me = isP1 ? state.player_1 : state.player_2;
  const opponent = isP1 ? state.player_2 : state.player_1;

  return {
    match_id: state.match_id,
    current_turn: state.current_turn,
    active_player: state.active_player,
    phase: state.phase,
    first_player: state.first_player,
    declared_attackers: state.declared_attackers,
    blocker_assignments: state.blocker_assignments,
    last_roll_value: state.last_roll_value,
    last_roll_event: state.last_roll_event,
    last_roll_event_id: state.last_roll_event_id,
    turn_timer_started: state.turn_timer_started,
    turn_timer_seconds: state.turn_timer_seconds,
    my_side: forPlayer,
    my_hand: me.hand,
    my_deck_count: me.deck.length,
    me: createClientBattlePlayer(me),
    opponent: createClientBattlePlayer(opponent),
    winner: state.winner,
  };
}

function createClientBattlePlayer(player: BattlePlayer): ClientBattlePlayer {
  return {
    player_id: player.player_id,
    side: player.side,
    avatar_id: player.avatar_id,
    current_hp: player.current_hp,
    max_hp: player.max_hp,
    current_mana: player.current_mana,
    mana_cap: player.mana_cap,
    instability: player.instability,
    board: player.board,
    hand_count: player.hand.length,
    deck_count: player.deck.length,
    graveyard_count: player.graveyard.length,
    has_chaos_spark: player.has_chaos_spark,
    last_event_type: player.last_event_type,
    consecutive_missed_turns: player.consecutive_missed_turns,
    is_connected: player.is_connected,
  };
}

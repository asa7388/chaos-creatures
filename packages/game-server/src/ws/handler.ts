// Chaos Creatures Game Server — WebSocket Connection Handler
// Routes incoming messages to the appropriate game engine functions

import type WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import type { ClientAction, ServerEvent } from '../types/messages';
import type { PlayerSide } from '../types/enums';
import { parseClientMessage, ProtocolError } from './protocol';
import { joinRoom, leaveRoom, sendToPlayer, broadcastToRoom, getPlayerSide } from './rooms';
import {
  getMatch,
  createClientGameState,
  forfeitMatch,
  endMatch,
} from '../engine/match';
import {
  executeAutomaticPhases,
  handlePlayCard,
  handleUseChaosSparkAction,
  handleDeclareAttackersAction,
  handleAssignBlockersAction,
  resolveCombatPhase,
  resolveEndOfTurn,
  GameError,
} from '../engine/turn';
import {
  onPlayerDisconnect,
  onPlayerReconnect,
  resetMissedTurns,
  trackMissedTurn,
} from '../services/reconnection';
import {
  createTimerManager,
  getTimerManager,
  destroyTimerManager,
} from '../services/timer';

/** Map of WebSocket -> { matchId, playerId } for cleanup on disconnect */
const wsToMatch = new Map<WebSocket, { matchId: string; playerId: string }>();

/**
 * Handle a new WebSocket connection.
 */
export function handleConnection(ws: WebSocket, request: IncomingMessage): void {
  // Extract match_id and player_id from query string
  const url = new URL(request.url ?? '', 'http://localhost');
  const matchId = url.searchParams.get('match_id');
  const playerId = url.searchParams.get('player_id');

  if (!matchId || !playerId) {
    ws.close(4000, 'Missing match_id or player_id');
    return;
  }

  const state = getMatch(matchId);
  if (!state) {
    ws.close(4001, 'Match not found');
    return;
  }

  // Determine player side
  let side: PlayerSide;
  if (state.player_1.player_id === playerId) {
    side = 'PLAYER_1';
  } else if (state.player_2.player_id === playerId) {
    side = 'PLAYER_2';
  } else {
    ws.close(4002, 'Player not in match');
    return;
  }

  // Register in room
  joinRoom(matchId, playerId, side, ws);
  wsToMatch.set(ws, { matchId, playerId });

  // Send state snapshot on connect
  const snapshot = createClientGameState(state, side);
  sendToPlayer(matchId, playerId, {
    type: 'STATE_SNAPSHOT',
    state: snapshot,
  });

  // Handle reconnection
  const reconnectState = onPlayerReconnect(matchId, playerId);
  if (reconnectState) {
    sendToPlayer(matchId, playerId, {
      type: 'STATE_SNAPSHOT',
      state: reconnectState,
    });
  }

  // Message handler
  ws.on('message', (data) => {
    try {
      const raw = data.toString();
      handleMessage(matchId, playerId, side, raw);
    } catch (err) {
      const errorEvent: ServerEvent = {
        type: 'SERVER_ERROR',
        code: err instanceof GameError ? err.code :
              err instanceof ProtocolError ? err.code : 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
      sendToPlayer(matchId, playerId, errorEvent);
    }
  });

  // Disconnect handler
  ws.on('close', () => {
    handlePlayerDisconnect(matchId, playerId, side);
    wsToMatch.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for player ${playerId} in match ${matchId}:`, err);
  });
}

/**
 * Process an incoming message from a player.
 */
function handleMessage(
  matchId: string,
  playerId: string,
  side: PlayerSide,
  raw: string
): void {
  const state = getMatch(matchId);
  if (!state) throw new GameError('MATCH_NOT_FOUND', 'Match not found');
  if (state.winner) throw new GameError('MATCH_OVER', 'Match is already over');

  let action: ClientAction;
  try {
    const parsed = parseClientMessage(raw);
    action = parsed.action;
  } catch (err) {
    if (err instanceof ProtocolError) throw err;
    throw new ProtocolError('PARSE_ERROR', 'Failed to parse message');
  }

  // Reset missed turns counter on any valid action
  resetMissedTurns(state, playerId);

  switch (action.type) {
    case 'PLAY_CARD':
      handlePlayCardAction(state, matchId, playerId, side, action.card_id, action.target_slot, action.target_id);
      break;

    case 'USE_CHAOS_SPARK':
      handleChaosSparkAction(state, matchId, playerId, side);
      break;

    case 'END_MAIN_PHASE':
    case 'DECLARE_ATTACKERS':
      handleDeclareAction(state, matchId, playerId, side, action);
      break;

    case 'ASSIGN_BLOCKERS':
      handleBlockerAction(state, matchId, playerId, side, action.assignments);
      break;

    case 'END_TURN':
      handleEndTurnAction(state, matchId, playerId, side);
      break;

    case 'SURRENDER':
      handleSurrenderAction(state, matchId, playerId);
      break;

    case 'RECONNECT':
      handleReconnectAction(state, matchId, playerId, side);
      break;

    case 'MULLIGAN':
      // Mulligan handling is done during GAME_SETUP
      break;

    case 'CHOOSE_EVENT_TARGET':
      // Event target choice is handled via event choice timer
      break;
  }
}

function handlePlayCardAction(
  state: GameState,
  matchId: string,
  playerId: string,
  side: PlayerSide,
  cardId: string,
  targetSlot?: number,
  targetId?: string
): void {
  if (state.active_player !== side) {
    throw new GameError('NOT_YOUR_TURN', 'Not your turn');
  }

  const result = handlePlayCard(state, cardId, targetSlot, targetId);

  broadcastToRoom(matchId, {
    type: 'CARD_PLAYED',
    player: side,
    card: result.card,
    slot: result.slot,
    creature: result.creature,
    mana_remaining: result.mana_remaining,
    effect_results: result.effect_results,
  });

  // Send opponent hand count update
  const opponentSide: PlayerSide = side === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
  const opponentPlayerId = side === 'PLAYER_1' ? state.player_2.player_id : state.player_1.player_id;
  const activePlayer = side === 'PLAYER_1' ? state.player_1 : state.player_2;
  sendToPlayer(matchId, opponentPlayerId, {
    type: 'OPPONENT_HAND_UPDATE',
    count: activePlayer.hand.length,
  });
}

function handleChaosSparkAction(
  state: GameState,
  matchId: string,
  playerId: string,
  side: PlayerSide
): void {
  if (state.active_player !== side) {
    throw new GameError('NOT_YOUR_TURN', 'Not your turn');
  }

  const result = handleUseChaosSparkAction(state);
  broadcastToRoom(matchId, {
    type: 'CHAOS_SPARK_USED',
    player: side,
    mana_after: result.mana_after,
  });
}

function handleDeclareAction(
  state: GameState,
  matchId: string,
  playerId: string,
  side: PlayerSide,
  action: ClientAction
): void {
  if (state.active_player !== side) {
    throw new GameError('NOT_YOUR_TURN', 'Not your turn');
  }

  if (action.type === 'END_MAIN_PHASE') {
    // Move to declare attackers phase
    state.phase = 'DECLARE_ATTACKERS';
    broadcastToRoom(matchId, {
      type: 'PHASE_CHANGED',
      phase: 'DECLARE_ATTACKERS',
      active_player: side,
    });
    return;
  }

  if (action.type === 'DECLARE_ATTACKERS') {
    const result = handleDeclareAttackersAction(state, action.attacker_ids);
    if (!result.valid) {
      throw new GameError('INVALID_ATTACKERS', result.error ?? 'Invalid attackers');
    }

    broadcastToRoom(matchId, {
      type: 'ATTACKERS_DECLARED',
      attacker_ids: action.attacker_ids,
      player: side,
    });

    if (action.attacker_ids.length === 0) {
      // No attackers, skip combat
      performEndOfTurn(state, matchId);
    } else {
      // Transition to assign blockers
      state.phase = 'ASSIGN_BLOCKERS';
      const defenderSide: PlayerSide = side === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
      broadcastToRoom(matchId, {
        type: 'PHASE_CHANGED',
        phase: 'ASSIGN_BLOCKERS',
        active_player: defenderSide,
      });

      // Start defender timer
      const timer = getTimerManager(matchId);
      if (timer) {
        timer.cancelDecisionTimer();
        timer.startDecisionTimer(() => {
          // Timer expired: no blockers assigned, resolve combat
          state.blocker_assignments = [];
          performCombatAndEndTurn(state, matchId);
        });
      }
    }
  }
}

function handleBlockerAction(
  state: GameState,
  matchId: string,
  playerId: string,
  side: PlayerSide,
  assignments: Array<{ blocker_id: string; attacker_id: string }>
): void {
  const defenderSide = state.active_player === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
  if (side !== defenderSide) {
    throw new GameError('NOT_YOUR_TURN', 'Not the defender turn');
  }

  const result = handleAssignBlockersAction(state, assignments);
  if (!result.valid) {
    throw new GameError('INVALID_BLOCKERS', result.error ?? 'Invalid blockers');
  }

  broadcastToRoom(matchId, {
    type: 'BLOCKERS_ASSIGNED',
    assignments,
    player: side,
  });

  // Cancel defender timer
  const timer = getTimerManager(matchId);
  if (timer) timer.cancelDecisionTimer();

  // Resolve combat
  performCombatAndEndTurn(state, matchId);
}

function handleEndTurnAction(
  state: GameState,
  matchId: string,
  playerId: string,
  side: PlayerSide
): void {
  if (state.active_player !== side) {
    throw new GameError('NOT_YOUR_TURN', 'Not your turn');
  }

  const timer = getTimerManager(matchId);
  if (timer) timer.cancelDecisionTimer();

  performEndOfTurn(state, matchId);
}

function handleSurrenderAction(
  state: GameState,
  matchId: string,
  playerId: string
): void {
  if (state.current_turn < 2) {
    throw new GameError('TOO_EARLY', 'Cannot surrender before turn 2');
  }

  const result = forfeitMatch(state, playerId);
  broadcastToRoom(matchId, {
    type: 'MATCH_END',
    winner: state.winner!,
    end_reason: 'SURRENDER',
    player_1_final_hp: state.player_1.current_hp,
    player_2_final_hp: state.player_2.current_hp,
    total_turns: state.current_turn,
  });

  destroyTimerManager(matchId);
}

function handleReconnectAction(
  state: GameState,
  matchId: string,
  playerId: string,
  side: PlayerSide
): void {
  const snapshot = createClientGameState(state, side);
  sendToPlayer(matchId, playerId, {
    type: 'STATE_SNAPSHOT',
    state: snapshot,
  });
}

// ─── Internal helpers ─────────────

function performCombatAndEndTurn(state: GameState, matchId: string): void {
  const combatResult = resolveCombatPhase(state);

  broadcastToRoom(matchId, {
    type: 'COMBAT_RESOLVED',
    pairs: combatResult.pairs,
    unblocked: combatResult.unblocked,
    deaths: combatResult.deaths,
    player_1_hp: state.player_1.current_hp,
    player_2_hp: state.player_2.current_hp,
  });

  if (state.winner) {
    finishMatch(state, matchId, 'HP_ZERO');
    return;
  }

  performEndOfTurn(state, matchId);
}

function performEndOfTurn(state: GameState, matchId: string): void {
  resolveEndOfTurn(state);

  if (state.winner) {
    finishMatch(state, matchId, 'HP_ZERO');
    return;
  }

  // Start next turn (automatic phases)
  startNextTurn(state, matchId);
}

/**
 * Execute automatic phases and start the decision timer.
 */
export function startNextTurn(state: GameState, matchId: string): void {
  const result = executeAutomaticPhases(state);

  // Broadcast turn start
  broadcastToRoom(matchId, {
    type: 'TURN_START',
    turn: result.startOfTurn.turn,
    active_player: result.startOfTurn.active_player,
  });

  // Broadcast chaos roll
  broadcastToRoom(matchId, {
    type: 'CHAOS_ROLL',
    roll: result.chaosRoll.roll,
    instability: result.chaosRoll.instability,
    result: result.chaosRoll.result,
    active_player: state.active_player,
  });

  // Broadcast event if one fired
  if (result.event) {
    broadcastToRoom(matchId, {
      type: 'EVENT_TRIGGERED',
      event_id: result.event.event.id,
      event_name: result.event.event.name,
      event_type: result.event.event.event_type,
      description: result.event.event.description,
      effect_results: result.event.event_effect_results,
      trigger_results: result.event.trigger_results,
      requires_choice: result.requiresEventChoice,
      valid_targets: result.validEventTargets,
    });
  }

  // Broadcast draw and mana
  const activePlayer = state.active_player === 'PLAYER_1' ? state.player_1 : state.player_2;
  if (result.drawAndMana.drawn_card) {
    sendToPlayer(matchId, activePlayer.player_id, {
      type: 'CARD_DRAWN',
      card: result.drawAndMana.drawn_card,
      player: state.active_player,
      cards_remaining: result.drawAndMana.cards_in_deck,
    });
  }

  broadcastToRoom(matchId, {
    type: 'MANA_GAINED',
    player: state.active_player,
    current_mana: result.drawAndMana.current_mana,
    mana_cap: activePlayer.mana_cap,
  });

  // Check if game ended during automatic phases
  if (state.winner) {
    finishMatch(state, matchId, 'HP_ZERO');
    return;
  }

  // Broadcast phase change to main phase
  broadcastToRoom(matchId, {
    type: 'PHASE_CHANGED',
    phase: 'MAIN_PHASE',
    active_player: state.active_player,
  });

  // Start decision timer
  let timer = getTimerManager(matchId);
  if (!timer) {
    timer = createTimerManager(matchId, {
      onWarning: (mId, seconds) => {
        broadcastToRoom(mId, {
          type: 'TIMER_WARNING',
          seconds_remaining: seconds,
          phase: state.phase,
        });
      },
      onExpired: (mId, phase) => {
        broadcastToRoom(mId, {
          type: 'TIMER_EXPIRED',
          phase: state.phase,
          player: state.active_player,
        });
      },
      onDisconnectForfeit: (mId, pId) => {
        // Handle disconnect forfeit
        const s = getMatch(mId);
        if (s) {
          forfeitMatch(s, pId);
          finishMatch(s, mId, 'DISCONNECT');
        }
      },
    });
  }

  timer.startDecisionTimer(() => {
    // Timer expired: auto-end turn
    const s = getMatch(matchId);
    if (s) {
      const { shouldForfeit } = trackMissedTurn(s, activePlayer.player_id);
      if (shouldForfeit) {
        forfeitMatch(s, activePlayer.player_id);
        finishMatch(s, matchId, 'TIMEOUT');
      } else {
        performEndOfTurn(s, matchId);
      }
    }
  });
}

function finishMatch(
  state: GameState,
  matchId: string,
  endReason: 'HP_ZERO' | 'SURRENDER' | 'DISCONNECT' | 'TIMEOUT'
): void {
  const result = endMatch(state, endReason);

  broadcastToRoom(matchId, {
    type: 'MATCH_END',
    winner: state.winner!,
    end_reason: endReason,
    player_1_final_hp: state.player_1.current_hp,
    player_2_final_hp: state.player_2.current_hp,
    total_turns: state.current_turn,
  });

  destroyTimerManager(matchId);

  // Save match record to Supabase and award chaos energy (fire and forget)
  saveMatchRecordAndAwardEnergy(result).catch((err) => {
    console.error(`Failed to save match record ${matchId}:`, err);
  });
}

/**
 * Save the match record to Supabase and award chaos energy to deck cards.
 */
async function saveMatchRecordAndAwardEnergy(
  result: ReturnType<typeof endMatch>
): Promise<void> {
  const { getSupabase } = await import('../services/supabase');
  const supabase = getSupabase();

  const record = result.match_record;

  // Insert match record
  await supabase.from('match_records').insert({
    id: record.id,
    mode: record.mode,
    player_1_id: record.player_1_id,
    player_2_id: record.player_2_id,
    winner_id: record.winner_id,
    loser_id: record.loser_id,
    player_1_deck_id: record.player_1_deck_id,
    player_2_deck_id: record.player_2_deck_id,
    player_1_avatar_id: record.player_1_avatar_id,
    player_2_avatar_id: record.player_2_avatar_id,
    player_1_faction_id: record.player_1_faction_id,
    player_2_faction_id: record.player_2_faction_id,
    end_reason: record.end_reason,
    total_turns: record.total_turns,
    duration_seconds: record.duration_seconds,
    player_1_final_hp: record.player_1_final_hp,
    player_2_final_hp: record.player_2_final_hp,
    player_1_rank: record.player_1_rank,
    player_2_rank: record.player_2_rank,
    total_rolls: record.total_rolls,
    order_events_p1: record.order_events_p1,
    chaos_events_p1: record.chaos_events_p1,
    order_events_p2: record.order_events_p2,
    chaos_events_p2: record.chaos_events_p2,
    started_at: record.started_at,
    ended_at: record.ended_at,
    season_id: record.season_id,
  });

  // Award chaos energy to all card instances in both decks
  // Winner earns 2 energy, loser earns 1 (per docs/design/04-progression-economy.md)
  const winnerEnergy = 2;
  const loserEnergy = 1;

  // Update card instances: increment chaos_energy for all cards in winner's deck
  if (record.winner_id && record.player_1_deck_id) {
    const winnerDeckId = record.winner_id === record.player_1_id
      ? record.player_1_deck_id
      : record.player_2_deck_id;
    const loserDeckId = record.winner_id === record.player_1_id
      ? record.player_2_deck_id
      : record.player_1_deck_id;

    // Fetch deck card instance IDs and increment energy
    await awardEnergyToDeck(supabase, winnerDeckId, winnerEnergy);
    await awardEnergyToDeck(supabase, loserDeckId, loserEnergy);
  }

  // Update match status
  await supabase
    .from('matches')
    .update({ status: 'COMPLETED', ended_at: record.ended_at })
    .eq('id', record.id);

  console.log(`Match record saved: ${record.id} (winner: ${record.winner_id})`);
}

async function awardEnergyToDeck(
  supabase: ReturnType<typeof import('../services/supabase').getSupabase>,
  deckId: string,
  energy: number
): Promise<void> {
  // Get all card instance IDs in this deck
  const { data: deckCards } = await supabase
    .from('deck_cards')
    .select('card_instance_id')
    .eq('deck_id', deckId);

  if (!deckCards || deckCards.length === 0) return;

  const instanceIds = deckCards.map((dc: { card_instance_id: string }) => dc.card_instance_id);

  // Increment chaos_energy for each card instance via RPC or direct update
  // Using raw SQL via rpc for atomic increment
  const { error: rpcError } = await supabase.rpc('increment_chaos_energy', {
    instance_ids: instanceIds,
    amount: energy,
  });

  if (rpcError) {
    // RPC may not exist yet — log warning but don't fail the match
    console.warn(`increment_chaos_energy RPC failed (${rpcError.message}), skipping energy award`);
  }
}

function handlePlayerDisconnect(
  matchId: string,
  playerId: string,
  side: PlayerSide
): void {
  leaveRoom(matchId, playerId);

  onPlayerDisconnect(matchId, playerId, side, (mId, pId) => {
    const state = getMatch(mId);
    if (state && !state.winner) {
      forfeitMatch(state, pId);
      finishMatch(state, mId, 'DISCONNECT');
    }
  });
}

// Type import for the handler function signature
import type { GameState } from '../types/game-state';

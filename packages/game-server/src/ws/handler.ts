// Chaos Creatures Game Server — Supabase Realtime Match Handler
// Subscribes to Supabase Realtime channels for match communication.
// Listens for `player_action` broadcasts from iOS clients.
// Sends `game_event` broadcasts back.

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ClientAction, ServerEvent } from '../types/messages';
import type { PlayerSide } from '../types/enums';
import type { GameState } from '../types/game-state';
import { parseAction, ProtocolError } from './protocol';
import { createRoom, joinRoom, leaveRoom, sendToPlayer, broadcastToRoom, destroyRoom } from './rooms';
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
import { resolveEventWithTarget } from '../engine/events';
import { SeededRNG } from '../engine/rng';
import {
  onPlayerReconnect,
  resetMissedTurns,
  trackMissedTurn,
} from '../services/reconnection';
import {
  createTimerManager,
  getTimerManager,
  destroyTimerManager,
} from '../services/timer';
import { getSupabase } from '../services/supabase';
import { isPracticeMatch, shouldBotAct, executeBotTurn, executeBotBlockers } from '../bot/runner';

/**
 * Set up a Supabase Realtime channel for a match.
 * The server subscribes to `match:<matchId>` and listens for
 * `player_action` broadcasts from iOS clients.
 *
 * Returns the RealtimeChannel once subscribed.
 */
export function setupMatchChannel(matchId: string): Promise<RealtimeChannel> {
  return new Promise((resolve, reject) => {
    const supabase = getSupabase();

    // Create channel with self=true so the server receives its own
    // broadcasts (the iOS client also subscribes to game_event on this
    // same channel) and ack for reliability.
    const channel = supabase.channel(`match:${matchId}`, {
      config: {
        broadcast: { self: true, ack: true },
      },
    });

    // Listen for player actions
    channel.on('broadcast', { event: 'player_action' }, (message) => {
      try {
        handleIncomingAction(matchId, message.payload);
      } catch (err) {
        console.error(`Error handling player_action in match ${matchId}:`, err);
      }
    });

    // Listen for heartbeat (player presence tracking)
    channel.on('broadcast', { event: 'heartbeat' }, (message) => {
      const playerId = message.payload?.player_id;
      if (playerId && typeof playerId === 'string') {
        handleHeartbeat(matchId, playerId);
      }
    });

    // Subscribe to the channel
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        // Create room with the subscribed channel
        createRoom(matchId, channel);
        console.log(`Match channel subscribed: match:${matchId}`);
        resolve(channel);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`Failed to subscribe to match:${matchId}: ${status}`, err);
        reject(new Error(`Channel subscription failed: ${status}`));
      }
    });
  });
}

/**
 * Register a player in a match room after the channel is set up.
 * Sends an initial state snapshot.
 */
export function registerPlayer(matchId: string, playerId: string): void {
  const state = getMatch(matchId);
  if (!state) {
    console.error(`Cannot register player ${playerId}: match ${matchId} not found`);
    return;
  }

  // Determine player side
  let side: PlayerSide;
  if (state.player_1.player_id === playerId) {
    side = 'PLAYER_1';
  } else if (state.player_2.player_id === playerId) {
    side = 'PLAYER_2';
  } else {
    console.error(`Player ${playerId} not in match ${matchId}`);
    return;
  }

  // Register in room
  joinRoom(matchId, playerId, side);

  // Send state snapshot on connect
  const snapshot = createClientGameState(state, side);
  sendToPlayer(matchId, playerId, {
    type: 'STATE_SNAPSHOT',
    state: snapshot,
  });
}

/**
 * Handle an incoming player_action broadcast from a Supabase Realtime channel.
 *
 * The iOS client sends:
 *   channel.broadcast(event: "player_action", message: dict)
 * where dict is the action payload, e.g. { type: "PLAY_CARD", card_id: "..." }
 *
 * The Supabase Realtime JS SDK wraps that into:
 *   { payload: <the dict>, event: "player_action", type: "broadcast" }
 *
 * We need `player_id` in the payload to identify the sender. The iOS client
 * should include it in every action payload.
 */
function handleIncomingAction(matchId: string, payload: Record<string, unknown>): void {
  if (!payload || typeof payload !== 'object') {
    console.warn(`Invalid payload in match ${matchId}:`, payload);
    return;
  }

  // The iOS client includes player_id in the action payload
  const playerId = payload.player_id as string | undefined;
  if (!playerId) {
    console.warn(`Missing player_id in player_action for match ${matchId}`);
    return;
  }

  const state = getMatch(matchId);
  if (!state) {
    sendErrorToPlayer(matchId, playerId, 'MATCH_NOT_FOUND', 'Match not found');
    return;
  }

  // Validate player is in this match
  let side: PlayerSide;
  if (state.player_1.player_id === playerId) {
    side = 'PLAYER_1';
  } else if (state.player_2.player_id === playerId) {
    side = 'PLAYER_2';
  } else {
    sendErrorToPlayer(matchId, playerId, 'PLAYER_NOT_IN_MATCH', 'Player not in match');
    return;
  }

  // Handle reconnection if the player was marked as disconnected
  const reconnectState = onPlayerReconnect(matchId, playerId);
  if (reconnectState) {
    sendToPlayer(matchId, playerId, {
      type: 'STATE_SNAPSHOT',
      state: reconnectState,
    });
  }

  // Parse the action from the payload (strip player_id before parsing)
  try {
    const { player_id: _pid, ...actionPayload } = payload;
    const action = parseAction(actionPayload);
    handleMessage(matchId, playerId, side, action);
  } catch (err) {
    const errorEvent: ServerEvent = {
      type: 'SERVER_ERROR',
      code: err instanceof GameError ? err.code :
            err instanceof ProtocolError ? err.code : 'INTERNAL_ERROR',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
    sendToPlayer(matchId, playerId, errorEvent);
  }
}

/**
 * Handle heartbeat from a player (keeps connection alive).
 */
function handleHeartbeat(matchId: string, playerId: string): void {
  const state = getMatch(matchId);
  if (!state) return;

  // If player was disconnected, reconnect them
  const reconnectState = onPlayerReconnect(matchId, playerId);
  if (reconnectState) {
    sendToPlayer(matchId, playerId, {
      type: 'STATE_SNAPSHOT',
      state: reconnectState,
    });
  }
}

/**
 * Send an error event to a specific player.
 */
function sendErrorToPlayer(
  matchId: string,
  playerId: string,
  code: string,
  message: string
): void {
  sendToPlayer(matchId, playerId, {
    type: 'SERVER_ERROR',
    code,
    message,
  });
}

/**
 * Process a validated action from a player.
 */
function handleMessage(
  matchId: string,
  playerId: string,
  side: PlayerSide,
  action: ClientAction
): void {
  const state = getMatch(matchId);
  if (!state) throw new GameError('MATCH_NOT_FOUND', 'Match not found');
  if (state.winner) throw new GameError('MATCH_OVER', 'Match is already over');

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
      handleMulliganAction(state, matchId, playerId, side, action.keep);
      break;

    case 'CHOOSE_EVENT_TARGET':
      handleChooseEventTarget(state, matchId, playerId, side, action.creature_id);
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
    const result = handleDeclareAttackersAction(state, action.attacker_ids, action.ruin_targets);
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

      // --- Bot blocker hook ---
      // If the defender is the bot, let the bot handle blockers instead of starting a timer.
      if (isPracticeMatch(state)) {
        executeBotBlockers(matchId).catch((err) => {
          console.error(`Bot blocker error in match ${matchId}:`, err);
        });
        return; // Bot handles blockers; do not start a human decision timer
      }

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
  // Allow early surrender in practice, but not in PvP
  if (state.current_turn < 2 && state.mode !== 'PRACTICE') {
    throw new GameError('TOO_EARLY', 'Cannot surrender before turn 2');
  }

  // Use finishMatch for full cleanup (room destroy, record save, timer destroy)
  state.winner = state.player_1.player_id === playerId ? 'PLAYER_2' : 'PLAYER_1';
  finishMatch(state, matchId, 'SURRENDER');
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

function handleMulliganAction(
  state: GameState,
  matchId: string,
  playerId: string,
  side: PlayerSide,
  keep: boolean
): void {
  // Mulligan is only allowed during the opening draw before the first turn
  if (state.current_turn > 0) {
    throw new GameError('WRONG_PHASE', 'Mulligan only allowed before the first turn');
  }

  const player = side === 'PLAYER_1' ? state.player_1 : state.player_2;

  if (keep) {
    // Player keeps their hand — no action needed
    sendToPlayer(matchId, playerId, {
      type: 'MULLIGAN_RESULT',
      kept: true,
      new_hand: player.hand,
    } as any);
    return;
  }

  // Shuffle hand back into deck and draw the same number of cards
  const handSize = player.hand.length;
  player.deck.push(...player.hand);
  player.hand = [];

  // Shuffle the deck using the seeded RNG
  const rng = SeededRNG.fromState(state.rng_seed, state.rng_counter);
  for (let i = player.deck.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
  }
  state.rng_counter = rng.getCounter();

  // Draw the same number of cards
  for (let i = 0; i < handSize && player.deck.length > 0; i++) {
    player.hand.push(player.deck.shift()!);
  }

  // Send the new hand to the player
  sendToPlayer(matchId, playerId, {
    type: 'MULLIGAN_RESULT',
    kept: false,
    new_hand: player.hand,
  } as any);
}

function handleChooseEventTarget(
  state: GameState,
  matchId: string,
  playerId: string,
  side: PlayerSide,
  creatureId: string
): void {
  if (state.active_player !== side) {
    throw new GameError('NOT_YOUR_TURN', 'Not your turn');
  }

  if (!state.pending_event_id) {
    throw new GameError('NO_PENDING_EVENT', 'No event awaiting target choice');
  }

  const result = resolveEventWithTarget(state, state.pending_event_id, creatureId);

  if (result) {
    broadcastToRoom(matchId, {
      type: 'EVENT_TRIGGERED',
      event_id: result.event.id,
      event_name: result.event.name,
      event_type: result.event.event_type,
      description: result.event.description,
      effect_results: result.event_effect_results,
      trigger_results: result.trigger_results,
      requires_choice: false,
      valid_targets: [],
    });
  }

  // Check win condition after event resolution
  if (state.winner) {
    finishMatch(state, matchId, 'HP_ZERO');
    return;
  }
}

// --- Internal helpers ---

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
      onExpired: (mId, _phase) => {
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

  // --- Bot automation hook ---
  // If this is a practice match and it's the bot's turn, schedule bot actions.
  if (isPracticeMatch(state) && shouldBotAct(state)) {
    executeBotTurn(matchId).catch((err) => {
      console.error(`Bot turn error in match ${matchId}:`, err);
    });
  }
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

  // Clean up the Realtime channel room
  destroyRoom(matchId);

  // Skip match record save and energy award for practice matches
  if (state.mode !== 'PRACTICE') {
    // Save match record to Supabase and award chaos energy (fire and forget)
    saveMatchRecordAndAwardEnergy(result).catch((err) => {
      console.error(`Failed to save match record ${matchId}:`, err);
    });
  } else {
    console.log(`Practice match ${matchId} ended (no record saved)`);
  }
}

/**
 * Save the match record to Supabase and award chaos energy to deck cards.
 */
async function saveMatchRecordAndAwardEnergy(
  result: ReturnType<typeof endMatch>
): Promise<void> {
  const supabase = getSupabase();

  const record = result.match_record;

  // Insert match record with retry (3 attempts, exponential backoff)
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.from('match_records').insert({
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
    if (!error) break;
    console.error(`match_records insert attempt ${attempt} failed:`, error.message);
    if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1000));
  }

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
  supabase: ReturnType<typeof getSupabase>,
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

  // Increment chaos_energy for each card instance via RPC for atomic increment
  const { error: rpcError } = await supabase.rpc('increment_chaos_energy', {
    instance_ids: instanceIds,
    amount: energy,
  });

  if (rpcError) {
    // RPC may not exist yet -- log warning but don't fail the match
    console.warn(`increment_chaos_energy RPC failed (${rpcError.message}), skipping energy award`);
  }
}

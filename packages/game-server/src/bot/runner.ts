// Chaos Creatures Game Server — Bot Turn Orchestrator
// Automates the bot's turn within a practice match.
// Calls AI decision functions, then the existing engine functions.
// Broadcasts actions via Realtime for iOS to animate.
// Source: docs/design/PRACTICE-MATCH-SPEC.md Section 3.2

import type { GameState } from '../types/game-state';
import { getMatch } from '../engine/match';
import {
  handlePlayCard,
  handleActivateStabilizer,
  handleDeclareAttackersAction,
  handleAssignBlockersAction,
  resolveCombatPhase,
  resolveEndOfTurn,
  GameError,
} from '../engine/turn';
import { broadcastToRoom, sendToPlayer, destroyRoom } from '../ws/rooms';
import { endMatch } from '../engine/match';
import {
  getTimerManager,
  createTimerManager,
  destroyTimerManager,
} from '../services/timer';
import {
  decideBotMainPhase,
  decideBotAttackers,
  decideBotBlockers,
  BOT_THINK_DELAY_MS,
  BOT_ACTION_DELAY_MS,
  BOT_BLOCK_DELAY_MS,
  BOT_PLAYER_ID,
} from './ai';

/**
 * Check if a match is a practice match (has the bot as PLAYER_2).
 */
export function isPracticeMatch(state: GameState): boolean {
  return state.player_2.player_id === BOT_PLAYER_ID;
}

/**
 * Check if the bot should act right now.
 * The bot acts when:
 * 1. It is the active player (its turn, in MAIN_PHASE or DECLARE_ATTACKERS)
 * 2. It is the defending player and needs to assign blockers (ASSIGN_BLOCKERS phase)
 */
export function shouldBotAct(state: GameState): boolean {
  if (!isPracticeMatch(state)) return false;
  if (state.winner) return false;

  const botSide = 'PLAYER_2' as const; // Bot is always PLAYER_2

  // Bot's turn: main phase or declare attackers
  if (state.active_player === botSide && state.phase === 'MAIN_PHASE') {
    return true;
  }

  // Bot needs to declare attackers
  if (state.active_player === botSide && state.phase === 'DECLARE_ATTACKERS') {
    return true;
  }

  // Bot needs to assign blockers (human attacked, bot defends)
  if (state.active_player !== botSide && state.phase === 'ASSIGN_BLOCKERS') {
    return true;
  }

  return false;
}

/**
 * Execute the bot's full turn (called after automatic phases finish when it's the bot's turn).
 *
 * Sequence:
 * 1. Wait BOT_THINK_DELAY_MS (simulate thinking)
 * 2. Play cards one at a time (with BOT_ACTION_DELAY_MS between each)
 * 3. Move to declare attackers
 * 4. Declare all attackers
 * 5. Combat resolution and end turn happen via the normal handler flow
 */
export async function executeBotTurn(matchId: string): Promise<void> {
  // Initial think delay
  await delay(BOT_THINK_DELAY_MS);

  const state = getMatch(matchId);
  if (!state || state.winner || state.phase !== 'MAIN_PHASE') return;
  if (state.active_player !== 'PLAYER_2') return;

  // Cancel any decision timer for the bot (bot never times out)
  const timer = getTimerManager(matchId);
  if (timer) timer.cancelDecisionTimer();

  // ─── Main Phase: Play cards ─────────────
  const actions = decideBotMainPhase(state);

  for (const action of actions) {
    await delay(BOT_ACTION_DELAY_MS);

    const currentState = getMatch(matchId);
    if (!currentState || currentState.winner) return;

    try {
      if (action.type === 'PLAY_STABILIZER') {
        // Stabilizers go to stability_zone, not a board slot
        const result = handlePlayCard(currentState, action.card_id);

        broadcastToRoom(matchId, {
          type: 'CARD_PLAYED',
          player: 'PLAYER_2',
          card: result.card,
          slot: undefined,
          creature: undefined,
          mana_remaining: result.mana_remaining,
          effect_results: result.effect_results,
        });

        sendToPlayer(matchId, currentState.player_1.player_id, {
          type: 'OPPONENT_HAND_UPDATE',
          count: currentState.player_2.hand.length,
        });
      } else if (action.type === 'ACTIVATE_STABILIZER') {
        const result = handleActivateStabilizer(currentState, action.instance_id);

        broadcastToRoom(matchId, {
          type: 'STABILIZER_ACTIVATED',
          player: 'PLAYER_2',
          stabilizer: result.stabilizer,
          effect_applied: result.effect_applied,
          instability: result.instability,
        });
      } else {
        // PLAY_CARD — creature or planar ruin going to a board slot
        const result = handlePlayCard(currentState, action.card_id, action.target_slot);

        broadcastToRoom(matchId, {
          type: 'CARD_PLAYED',
          player: 'PLAYER_2',
          card: result.card,
          slot: result.slot,
          creature: result.creature,
          mana_remaining: result.mana_remaining,
          effect_results: result.effect_results,
        });

        sendToPlayer(matchId, currentState.player_1.player_id, {
          type: 'OPPONENT_HAND_UPDATE',
          count: currentState.player_2.hand.length,
        });
      }
    } catch (err) {
      // Bot failed to play card (e.g., not enough mana, slot occupied)
      // Log and continue
      if (err instanceof GameError) {
        console.warn(`Bot action error in ${matchId}: ${err.code} - ${err.message}`);
      }
    }
  }

  // ─── Transition to Declare Attackers ─────────────
  await delay(BOT_ACTION_DELAY_MS);

  const stateBeforeAttack = getMatch(matchId);
  if (!stateBeforeAttack || stateBeforeAttack.winner) return;

  stateBeforeAttack.phase = 'DECLARE_ATTACKERS';
  broadcastToRoom(matchId, {
    type: 'PHASE_CHANGED',
    phase: 'DECLARE_ATTACKERS',
    active_player: 'PLAYER_2',
  });

  // ─── Declare Attackers ─────────────
  const { attackerIds, ruinTargets } = decideBotAttackers(stateBeforeAttack);
  const attackResult = handleDeclareAttackersAction(stateBeforeAttack, attackerIds, ruinTargets);

  if (!attackResult.valid) {
    // If attack declaration fails, skip combat and end turn
    console.warn(`Bot attack declaration failed in ${matchId}: ${attackResult.error}`);
    performBotEndOfTurn(matchId);
    return;
  }

  broadcastToRoom(matchId, {
    type: 'ATTACKERS_DECLARED',
    attacker_ids: attackerIds,
    player: 'PLAYER_2',
  });

  if (attackerIds.length === 0) {
    // No attackers, skip to end of turn
    performBotEndOfTurn(matchId);
    return;
  }

  // ─── Transition to Assign Blockers (human's turn to block) ─────────────
  stateBeforeAttack.phase = 'ASSIGN_BLOCKERS';
  broadcastToRoom(matchId, {
    type: 'PHASE_CHANGED',
    phase: 'ASSIGN_BLOCKERS',
    active_player: 'PLAYER_1', // Human blocks
  });

  // Start a timer for the human to assign blockers
  let blockerTimer = getTimerManager(matchId);
  if (!blockerTimer) {
    blockerTimer = createTimerManager(matchId, {
      onWarning: (mId, seconds) => {
        broadcastToRoom(mId, {
          type: 'TIMER_WARNING',
          seconds_remaining: seconds,
          phase: 'ASSIGN_BLOCKERS',
        });
      },
      onExpired: (mId) => {
        broadcastToRoom(mId, {
          type: 'TIMER_EXPIRED',
          phase: 'ASSIGN_BLOCKERS',
          player: 'PLAYER_1',
        });
      },
      onDisconnectForfeit: () => {
        // No disconnect forfeit in practice
      },
    });
  }

  blockerTimer.startDecisionTimer(() => {
    // Timer expired for human: no blockers assigned, resolve combat
    const s = getMatch(matchId);
    if (s && !s.winner) {
      s.blocker_assignments = [];
      performBotCombatAndEndTurn(matchId);
    }
  });

  // Note: When the human sends ASSIGN_BLOCKERS, the existing handler in
  // ws/handler.ts will call handleBlockerAction -> performCombatAndEndTurn.
  // After that turn ends, startNextTurn is called which triggers the next
  // turn. If the next turn is the bot's, the bot runner kicks in again.
}

/**
 * Execute the bot's blocker assignments (called when the human attacks and the bot defends).
 */
export async function executeBotBlockers(matchId: string): Promise<void> {
  await delay(BOT_BLOCK_DELAY_MS);

  const state = getMatch(matchId);
  if (!state || state.winner) return;
  if (state.phase !== 'ASSIGN_BLOCKERS') return;

  // Cancel the defender timer since bot is responding
  const timer = getTimerManager(matchId);
  if (timer) timer.cancelDecisionTimer();

  const assignments = decideBotBlockers(state);
  const result = handleAssignBlockersAction(state, assignments);

  if (!result.valid) {
    console.warn(`Bot blocker assignment failed in ${matchId}: ${result.error}`);
    // Submit empty blockers
    state.blocker_assignments = [];
  } else {
    broadcastToRoom(matchId, {
      type: 'BLOCKERS_ASSIGNED',
      assignments,
      player: 'PLAYER_2',
    });
  }

  // Resolve combat and end turn
  performBotCombatAndEndTurn(matchId);
}

// ─── Internal Helpers ─────────────

function performBotCombatAndEndTurn(matchId: string): void {
  const state = getMatch(matchId);
  if (!state) return;

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
    finishPracticeMatch(state, matchId, 'HP_ZERO');
    return;
  }

  performBotEndOfTurn(matchId);
}

function performBotEndOfTurn(matchId: string): void {
  const state = getMatch(matchId);
  if (!state) return;

  resolveEndOfTurn(state);

  if (state.winner) {
    finishPracticeMatch(state, matchId, 'HP_ZERO');
    return;
  }

  // Start next turn (automatic phases)
  // Use lazy require to avoid circular dependency with ws/handler.ts
  const { startNextTurn } = require('../ws/handler') as { startNextTurn: (state: GameState, matchId: string) => void };
  startNextTurn(state, matchId);

  // NOTE: Do NOT schedule executeBotTurn here. startNextTurn() in handler.ts
  // already checks isPracticeMatch && shouldBotAct and schedules the bot turn.
  // Adding another call here would cause the bot turn to execute TWICE concurrently.
}

function finishPracticeMatch(
  state: GameState,
  matchId: string,
  endReason: 'HP_ZERO' | 'SURRENDER' | 'DISCONNECT' | 'TIMEOUT'
): void {
  const _result = endMatch(state, endReason);

  broadcastToRoom(matchId, {
    type: 'MATCH_END',
    winner: state.winner!,
    end_reason: endReason,
    player_1_final_hp: state.player_1.current_hp,
    player_2_final_hp: state.player_2.current_hp,
    total_turns: state.current_turn,
  });

  destroyTimerManager(matchId);

  // DO NOT save match record for practice matches
  // DO NOT award chaos energy for practice matches
  // Just clean up the room
  destroyRoom(matchId);

  console.log(`Practice match ${matchId} ended. Winner: ${state.winner}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

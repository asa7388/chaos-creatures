// Chaos Creatures Game Server — Reconnection Service
// Handles client disconnect detection, state snapshot for reconnecting client,
// 60s grace period before forfeit.
// Source: docs/design/06-technical-architecture.md Section 5.4

import type { GameState } from '../types/game-state';
import type { ClientGameState } from '../types/messages';
import type { PlayerSide } from '../types/enums';
import { createClientGameState, getMatch, handleDisconnect, handleReconnect } from '../engine/match';
import { RECONNECT_GRACE_SECONDS, MAX_MISSED_TURNS } from '../engine/constants';

/** Track disconnected players and their reconnection timers */
interface DisconnectedPlayer {
  matchId: string;
  playerId: string;
  side: PlayerSide;
  disconnectedAt: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

const disconnectedPlayers = new Map<string, DisconnectedPlayer>();

/**
 * Handle a player disconnecting from a match.
 * Starts the reconnection grace timer.
 */
export function onPlayerDisconnect(
  matchId: string,
  playerId: string,
  side: PlayerSide,
  onForfeit: (matchId: string, playerId: string) => void
): void {
  const state = getMatch(matchId);
  if (!state) return;

  handleDisconnect(state, playerId);

  const key = `${matchId}:${playerId}`;

  // Start grace period timer
  const reconnectTimer = setTimeout(() => {
    onForfeit(matchId, playerId);
    disconnectedPlayers.delete(key);
  }, RECONNECT_GRACE_SECONDS * 1000);

  disconnectedPlayers.set(key, {
    matchId,
    playerId,
    side,
    disconnectedAt: Date.now(),
    reconnectTimer,
  });
}

/**
 * Handle a player reconnecting to a match.
 * Cancels the forfeit timer and returns a state snapshot.
 */
export function onPlayerReconnect(
  matchId: string,
  playerId: string
): ClientGameState | null {
  const state = getMatch(matchId);
  if (!state) return null;

  const key = `${matchId}:${playerId}`;
  const disconnected = disconnectedPlayers.get(key);

  if (disconnected) {
    // Cancel forfeit timer
    if (disconnected.reconnectTimer) {
      clearTimeout(disconnected.reconnectTimer);
    }
    disconnectedPlayers.delete(key);
  }

  handleReconnect(state, playerId);

  // Determine player side
  const side: PlayerSide = state.player_1.player_id === playerId ? 'PLAYER_1' : 'PLAYER_2';

  // Return full state snapshot
  return createClientGameState(state, side);
}

/**
 * Check if a player is currently disconnected from a match.
 */
export function isPlayerDisconnected(matchId: string, playerId: string): boolean {
  const key = `${matchId}:${playerId}`;
  return disconnectedPlayers.has(key);
}

/**
 * Get the time a player has been disconnected (ms).
 */
export function getDisconnectDuration(matchId: string, playerId: string): number {
  const key = `${matchId}:${playerId}`;
  const entry = disconnectedPlayers.get(key);
  if (!entry) return 0;
  return Date.now() - entry.disconnectedAt;
}

/**
 * Track a missed turn for auto-forfeit after MAX_MISSED_TURNS consecutive misses.
 */
export function trackMissedTurn(
  state: GameState,
  playerId: string
): { shouldForfeit: boolean; missedCount: number } {
  const player = state.player_1.player_id === playerId
    ? state.player_1
    : state.player_2;

  player.consecutive_missed_turns += 1;

  return {
    shouldForfeit: player.consecutive_missed_turns >= MAX_MISSED_TURNS,
    missedCount: player.consecutive_missed_turns,
  };
}

/**
 * Reset missed turn counter when a player takes an action.
 */
export function resetMissedTurns(state: GameState, playerId: string): void {
  const player = state.player_1.player_id === playerId
    ? state.player_1
    : state.player_2;

  player.consecutive_missed_turns = 0;
}

/**
 * Clean up all disconnection data for a match.
 */
export function cleanupMatch(matchId: string): void {
  for (const [key, entry] of disconnectedPlayers.entries()) {
    if (entry.matchId === matchId) {
      if (entry.reconnectTimer) {
        clearTimeout(entry.reconnectTimer);
      }
      disconnectedPlayers.delete(key);
    }
  }
}

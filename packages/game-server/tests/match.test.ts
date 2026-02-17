// Chaos Creatures Game Server — Match Lifecycle Tests
// Tests for match creation, state projection, forfeit, disconnect/reconnect

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createMatch,
  endMatch,
  forfeitMatch,
  handleDisconnect,
  handleReconnect,
  createClientGameState,
  getMatch,
  removeMatch,
  getActiveMatchCount,
  type MatchParticipant,
} from '../src/engine/match';
import { resetIds, createTestCard } from './helpers';
import type { BattleCard } from '../src/types/game-state';

function makeTestDeck(): BattleCard[] {
  return Array.from({ length: 20 }, () => createTestCard());
}

function makeParticipant(id: string): MatchParticipant {
  return {
    player_id: id,
    deck_cards: makeTestDeck(),
    avatar_id: `avatar-${id}`,
    avatar_instability_modifier: -3,
    deck_id: `deck-${id}`,
    faction_id: 'IRONWRIGHT',
    season_rank: 'BRONZE_3',
  };
}

let matchId: string;

beforeEach(() => {
  resetIds();
  matchId = `test-match-${Date.now()}`;
});

afterEach(() => {
  // Clean up active matches
  removeMatch(matchId);
});

// ─── Match Creation ─────────────

describe('Match creation', () => {
  it('should create a match with two players', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    expect(state.match_id).toBe(matchId);
    expect(state.mode).toBe('RANKED');
    expect(state.player_1).toBeDefined();
    expect(state.player_2).toBeDefined();
    expect(state.current_turn).toBe(0);
    expect(state.phase).toBe('GAME_SETUP');
    expect(state.winner).toBeNull();
  });

  it('should deal 4 cards to P1', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    expect(state.player_1.hand).toHaveLength(4);
  });

  it('should deal 5 cards to P2', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    expect(state.player_2.hand).toHaveLength(5);
  });

  it('should give P2 Chaos Spark', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    expect(state.player_2.has_chaos_spark).toBe(true);
    expect(state.player_1.has_chaos_spark).toBe(false);
  });

  it('should initialize both players at 20 HP', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    expect(state.player_1.current_hp).toBe(20);
    expect(state.player_2.current_hp).toBe(20);
  });

  it('should start with empty boards', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    expect(state.player_1.board.every(s => s === null)).toBe(true);
    expect(state.player_2.board.every(s => s === null)).toBe(true);
  });

  it('should have a valid RNG seed', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    expect(typeof state.rng_seed).toBe('number');
    expect(state.rng_seed).toBeGreaterThanOrEqual(0);
    expect(state.rng_counter).toBeGreaterThanOrEqual(0);
  });

  it('should store the match in active matches', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    createMatch(matchId, 'RANKED', p1, p2);

    expect(getMatch(matchId)).toBeDefined();
  });

  it('should set deck size = 20 - hand size for each player', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    expect(state.player_1.deck.length).toBe(16); // 20 - 4
    expect(state.player_2.deck.length).toBe(15); // 20 - 5
  });
});

// ─── Match End ─────────────

describe('Match ending', () => {
  it('should create a match record', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);
    state.winner = 'PLAYER_1';
    state.current_turn = 10;

    const result = endMatch(state, 'HP_ZERO');

    expect(result.match_record).toBeDefined();
    expect(result.match_record.total_turns).toBe(10);
    expect(result.end_reason).toBe('HP_ZERO');
    expect(result.winner_id).toBe(state.player_1.player_id);
    expect(result.loser_id).toBe(state.player_2.player_id);
  });

  it('should set phase to GAME_OVER', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);
    state.winner = 'PLAYER_1';

    endMatch(state, 'HP_ZERO');

    expect(state.phase).toBe('GAME_OVER');
  });

  it('should remove match from active storage', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);
    state.winner = 'PLAYER_1';

    endMatch(state, 'HP_ZERO');

    expect(getMatch(matchId)).toBeUndefined();
  });
});

// ─── Forfeit ─────────────

describe('Forfeit', () => {
  it('should set the non-forfeiting player as winner', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    const result = forfeitMatch(state, state.player_1.player_id);

    expect(result.end_reason).toBe('SURRENDER');
    expect(result.winner_id).toBe(state.player_2.player_id);
    expect(state.winner).toBe('PLAYER_2');
  });
});

// ─── Disconnect/Reconnect ─────────────

describe('Disconnect and reconnect', () => {
  it('should mark player as disconnected', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    handleDisconnect(state, state.player_1.player_id);

    expect(state.player_1.is_connected).toBe(false);
    expect(state.player_2.is_connected).toBe(true);
  });

  it('should mark player as connected on reconnect', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    handleDisconnect(state, state.player_1.player_id);
    expect(state.player_1.is_connected).toBe(false);

    handleReconnect(state, state.player_1.player_id);
    expect(state.player_1.is_connected).toBe(true);
  });

  it('should reset missed turns on reconnect', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    state.player_1.consecutive_missed_turns = 2;
    handleReconnect(state, state.player_1.player_id);

    expect(state.player_1.consecutive_missed_turns).toBe(0);
  });
});

// ─── State Projection (Client View) ─────────────

describe('Client game state projection', () => {
  it('should include own hand but not opponent hand', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    const clientState = createClientGameState(state, 'PLAYER_1');

    expect(clientState.my_hand).toBeDefined();
    expect(clientState.my_hand).toHaveLength(4);
    // Opponent hand is just a count
    expect(clientState.opponent.hand_count).toBe(5);
  });

  it('should include own deck count but not cards', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    const clientState = createClientGameState(state, 'PLAYER_1');

    expect(clientState.my_deck_count).toBe(16);
    expect(clientState.opponent.deck_count).toBe(15);
  });

  it('should set my_side correctly', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    const clientState1 = createClientGameState(state, 'PLAYER_1');
    expect(clientState1.my_side).toBe('PLAYER_1');

    const clientState2 = createClientGameState(state, 'PLAYER_2');
    expect(clientState2.my_side).toBe('PLAYER_2');
  });

  it('should include both boards with creature data', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    const clientState = createClientGameState(state, 'PLAYER_1');

    expect(clientState.me.board).toBeDefined();
    expect(clientState.opponent.board).toBeDefined();
    expect(clientState.me.board).toHaveLength(5);
    expect(clientState.opponent.board).toHaveLength(5);
  });

  it('should include match metadata', () => {
    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    const state = createMatch(matchId, 'RANKED', p1, p2);

    const clientState = createClientGameState(state, 'PLAYER_1');

    expect(clientState.match_id).toBe(matchId);
    expect(clientState.current_turn).toBe(0);
    expect(clientState.phase).toBe('GAME_SETUP');
    expect(clientState.winner).toBeNull();
  });
});

// ─── Active Match Count ─────────────

describe('Active match count', () => {
  it('should track active matches', () => {
    const countBefore = getActiveMatchCount();

    const p1 = makeParticipant('player-1');
    const p2 = makeParticipant('player-2');

    createMatch(matchId, 'RANKED', p1, p2);

    expect(getActiveMatchCount()).toBe(countBefore + 1);

    removeMatch(matchId);

    expect(getActiveMatchCount()).toBe(countBefore);
  });
});

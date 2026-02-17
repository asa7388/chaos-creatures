// Chaos Creatures Game Server — Turn Engine Tests
// Tests for 9-phase turn cycle, card play, chaos spark, phase transitions

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveStartOfTurn,
  resolveChaosRoll,
  resolveDrawAndMana,
  handlePlayCard,
  handleUseChaosSparkAction,
  handleDeclareAttackersAction,
  handleAssignBlockersAction,
  resolveCombatPhase,
  resolveEndOfTurn,
  executeAutomaticPhases,
  GameError,
  createBattleCreature,
} from '../src/engine/turn';
import {
  resetIds,
  createTestGameState,
  createTestCard,
  createTestCreature,
  createKeywordCreature,
  placeCreature,
  fillDeck,
  fillHand,
} from './helpers';
import type { GameState } from '../src/types/game-state';

let state: GameState;

beforeEach(() => {
  resetIds();
  state = createTestGameState();
  // Give both players decks and hands for a proper game state
  fillDeck(state.player_1, 16);
  fillDeck(state.player_2, 15);
  fillHand(state.player_1, 4);
  fillHand(state.player_2, 5);
});

// ─── Phase 1: Start of Turn ─────────────

describe('Phase 1: Start of Turn', () => {
  it('should increment the turn counter', () => {
    state.current_turn = 0;
    const result = resolveStartOfTurn(state);
    expect(result.turn).toBe(1);
    expect(state.current_turn).toBe(1);
  });

  it('should set phase to START_OF_TURN', () => {
    resolveStartOfTurn(state);
    expect(state.phase).toBe('START_OF_TURN');
  });

  it('should return the active player side', () => {
    state.active_player = 'PLAYER_1';
    const result = resolveStartOfTurn(state);
    expect(result.active_player).toBe('PLAYER_1');
  });

  it('should recalculate instability', () => {
    state.player_1.avatar_instability_modifier = -3;
    const creature = createTestCreature(0, { base_instability: 5, modifiers: [] });
    placeCreature(state.player_1, 0, creature);

    const result = resolveStartOfTurn(state);
    expect(result.instability).toBe(2); // -3 + 5 = 2
  });
});

// ─── Phase 2: Chaos Roll ─────────────

describe('Phase 2: Chaos Roll', () => {
  it('should produce a roll between 1 and 20', () => {
    state.current_turn = 1;
    state.phase = 'START_OF_TURN';

    const result = resolveChaosRoll(state);
    expect(result.roll).toBeGreaterThanOrEqual(1);
    expect(result.roll).toBeLessThanOrEqual(20);
  });

  it('should set phase to CHAOS_ROLL', () => {
    resolveChaosRoll(state);
    expect(state.phase).toBe('CHAOS_ROLL');
  });

  it('should store last_roll_value on state', () => {
    const result = resolveChaosRoll(state);
    expect(state.last_roll_value).toBe(result.roll);
  });

  it('should advance the RNG counter', () => {
    const counterBefore = state.rng_counter;
    resolveChaosRoll(state);
    expect(state.rng_counter).toBeGreaterThan(counterBefore);
  });

  it('should be deterministic with the same seed', () => {
    const seed = state.rng_seed;
    const counter = state.rng_counter;

    const result1 = resolveChaosRoll(state);

    // Reset state
    state.rng_counter = counter;
    state.player_1.instability = result1.instability;

    const result2 = resolveChaosRoll(state);
    expect(result1.roll).toBe(result2.roll);
  });

  it('roll < instability should be CHAOS', () => {
    // Force high instability so most rolls are CHAOS
    state.player_1.instability = 20;
    const result = resolveChaosRoll(state);
    // With instability 20, roll 1-19 = CHAOS, roll 20 = NOTHING
    if (result.roll < 20) {
      expect(result.result).toBe('CHAOS');
    } else {
      expect(result.result).toBe('NOTHING');
    }
  });

  it('roll > instability should be ORDER', () => {
    state.player_1.instability = 1;
    const result = resolveChaosRoll(state);
    // With instability 1, roll 1 = NOTHING, roll 2-20 = ORDER
    if (result.roll > 1) {
      expect(result.result).toBe('ORDER');
    } else {
      expect(result.result).toBe('NOTHING');
    }
  });

  it('should update attunement state on modifiers', () => {
    const modifier = {
      definition_id: 'mod-1',
      name: 'Test Mod',
      pool_type: 'UNIVERSAL' as const,
      attunement: 'ORDER' as const,
      base_effect: { effect_type: 'STAT_MODIFY_ATTACK' as const, target: 'SELF' as const, value: 1 },
      attuned_effect: { effect_type: 'STAT_MODIFY_ATTACK' as const, target: 'SELF' as const, value: 1 },
      has_penalty: false,
      grants_keyword: undefined,
      keyword_is_attuned: false,
      instability_adjustment: 0,
      instability_is_attuned: false,
      is_attuned_active: false,
      is_penalty_active: false,
    };
    const creature = createTestCreature(0, {
      base_instability: 2,
      modifiers: [modifier],
    });
    placeCreature(state.player_1, 0, creature);

    // Force instability to 1 so roll is almost always ORDER
    state.player_1.instability = 1;
    const result = resolveChaosRoll(state);

    if (result.result === 'ORDER') {
      expect(modifier.is_attuned_active).toBe(true);
    } else if (result.result === 'CHAOS') {
      expect(modifier.is_attuned_active).toBe(false);
    }
  });
});

// ─── Phase 4: Draw and Mana ─────────────

describe('Phase 4: Draw and Mana', () => {
  it('should draw 1 card', () => {
    const handBefore = state.player_1.hand.length;
    const deckBefore = state.player_1.deck.length;

    resolveDrawAndMana(state);

    expect(state.player_1.hand.length).toBe(handBefore + 1);
    expect(state.player_1.deck.length).toBe(deckBefore - 1);
  });

  it('should gain 1 mana', () => {
    state.player_1.current_mana = 3;
    state.player_1.mana_cap = 10;

    const result = resolveDrawAndMana(state);

    expect(result.current_mana).toBe(4);
    expect(state.player_1.current_mana).toBe(4);
  });

  it('should not exceed mana cap', () => {
    state.player_1.current_mana = 10;
    state.player_1.mana_cap = 10;

    resolveDrawAndMana(state);

    expect(state.player_1.current_mana).toBe(10);
  });

  it('should handle empty deck (no draw)', () => {
    state.player_1.deck = [];
    const handBefore = state.player_1.hand.length;

    const result = resolveDrawAndMana(state);

    expect(result.drawn_card).toBeNull();
    expect(state.player_1.hand.length).toBe(handBefore);
  });

  it('should set phase to DRAW_AND_MANA', () => {
    resolveDrawAndMana(state);
    expect(state.phase).toBe('DRAW_AND_MANA');
  });
});

// ─── Phase 5: Main Phase (Play Card) ─────────────

describe('Phase 5: Main Phase - Play Card', () => {
  it('should play a creature card to a board slot', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.current_mana = 5;

    const card = createTestCard({
      card_type: 'CREATURE',
      mana_cost: 2,
      base_attack: 3,
      base_health: 4,
      base_instability: 2,
    });
    state.player_1.hand.push(card);

    const result = handlePlayCard(state, card.instance_id, 0);

    expect(result.card.instance_id).toBe(card.instance_id);
    expect(result.slot).toBe(0);
    expect(result.creature).toBeDefined();
    expect(result.mana_remaining).toBe(3);
    expect(state.player_1.board[0]).not.toBeNull();
  });

  it('should deduct mana cost', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.current_mana = 7;

    const card = createTestCard({ mana_cost: 4 });
    state.player_1.hand.push(card);

    handlePlayCard(state, card.instance_id, 0);

    expect(state.player_1.current_mana).toBe(3);
  });

  it('should remove card from hand', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.current_mana = 5;

    const card = createTestCard({ mana_cost: 2 });
    state.player_1.hand.push(card);
    const handSize = state.player_1.hand.length;

    handlePlayCard(state, card.instance_id, 0);

    expect(state.player_1.hand.length).toBe(handSize - 1);
    expect(state.player_1.hand.find(c => c.instance_id === card.instance_id)).toBeUndefined();
  });

  it('should throw WRONG_PHASE if not in Main Phase', () => {
    state.phase = 'CHAOS_ROLL';
    const card = createTestCard({ mana_cost: 1 });
    state.player_1.hand.push(card);

    expect(() => handlePlayCard(state, card.instance_id, 0)).toThrow(GameError);
  });

  it('should throw NOT_ENOUGH_MANA if insufficient mana', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.current_mana = 1;

    const card = createTestCard({ mana_cost: 5 });
    state.player_1.hand.push(card);

    expect(() => handlePlayCard(state, card.instance_id, 0)).toThrow(GameError);
  });

  it('should throw CARD_NOT_IN_HAND if card not in hand', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.current_mana = 5;

    expect(() => handlePlayCard(state, 'nonexistent', 0)).toThrow(GameError);
  });

  it('should throw SLOT_OCCUPIED if board slot is taken', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.current_mana = 5;

    const existing = createTestCreature(0, {});
    placeCreature(state.player_1, 0, existing);

    const card = createTestCard({ mana_cost: 2 });
    state.player_1.hand.push(card);

    expect(() => handlePlayCard(state, card.instance_id, 0)).toThrow(GameError);
  });

  it('should throw INVALID_SLOT for out-of-range slot', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.current_mana = 5;

    const card = createTestCard({ mana_cost: 2 });
    state.player_1.hand.push(card);

    expect(() => handlePlayCard(state, card.instance_id, 5)).toThrow(GameError);
    expect(() => handlePlayCard(state, card.instance_id, -1)).toThrow(GameError);
  });

  it('should throw NO_SLOT if creature card played without target slot', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.current_mana = 5;

    const card = createTestCard({ card_type: 'CREATURE', mana_cost: 2 });
    state.player_1.hand.push(card);

    expect(() => handlePlayCard(state, card.instance_id)).toThrow(GameError);
  });
});

// ─── Chaos Spark ─────────────

describe('Chaos Spark', () => {
  it('should grant +1 mana when used', () => {
    state.phase = 'MAIN_PHASE';
    state.active_player = 'PLAYER_2';
    state.player_2.has_chaos_spark = true;
    state.player_2.current_mana = 3;

    const result = handleUseChaosSparkAction(state);

    expect(result.mana_after).toBe(4);
    expect(state.player_2.current_mana).toBe(4);
    expect(state.player_2.has_chaos_spark).toBe(false);
  });

  it('should cap mana at mana_cap', () => {
    state.phase = 'MAIN_PHASE';
    state.active_player = 'PLAYER_2';
    state.player_2.has_chaos_spark = true;
    state.player_2.current_mana = 10;
    state.player_2.mana_cap = 10;

    const result = handleUseChaosSparkAction(state);

    expect(result.mana_after).toBe(10);
  });

  it('should throw if no Chaos Spark', () => {
    state.phase = 'MAIN_PHASE';
    state.player_1.has_chaos_spark = false;

    expect(() => handleUseChaosSparkAction(state)).toThrow(GameError);
  });

  it('should throw if not Main Phase', () => {
    state.phase = 'CHAOS_ROLL';
    state.active_player = 'PLAYER_2';
    state.player_2.has_chaos_spark = true;

    expect(() => handleUseChaosSparkAction(state)).toThrow(GameError);
  });
});

// ─── Phase 6: Declare Attackers ─────────────

describe('Phase 6: Declare Attackers', () => {
  it('should set declared_attackers on state', () => {
    const creature = createTestCreature(0, { attack: 3, health: 3 });
    placeCreature(state.player_1, 0, creature);
    state.current_turn = 2;

    const result = handleDeclareAttackersAction(state, [creature.instance_id]);

    expect(result.valid).toBe(true);
    expect(state.declared_attackers).toContain(creature.instance_id);
  });

  it('should mark creatures as has_attacked', () => {
    const creature = createTestCreature(0, { attack: 3, health: 3 });
    placeCreature(state.player_1, 0, creature);
    state.current_turn = 2;

    handleDeclareAttackersAction(state, [creature.instance_id]);

    expect(creature.has_attacked).toBe(true);
  });

  it('should set phase to DECLARE_ATTACKERS', () => {
    state.current_turn = 2;
    handleDeclareAttackersAction(state, []);
    expect(state.phase).toBe('DECLARE_ATTACKERS');
  });
});

// ─── Phase 7: Assign Blockers ─────────────

describe('Phase 7: Assign Blockers', () => {
  it('should set blocker_assignments on state', () => {
    const attacker = createTestCreature(0, { attack: 3, health: 3 });
    placeCreature(state.player_1, 0, attacker);
    state.declared_attackers = [attacker.instance_id];

    const blocker = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_2, 0, blocker);

    const result = handleAssignBlockersAction(state, [
      { blocker_id: blocker.instance_id, attacker_id: attacker.instance_id },
    ]);

    expect(result.valid).toBe(true);
    expect(state.blocker_assignments).toHaveLength(1);
    expect(state.blocker_assignments[0].blocker_creature_id).toBe(blocker.instance_id);
    expect(state.blocker_assignments[0].attacker_creature_id).toBe(attacker.instance_id);
  });

  it('should set phase to ASSIGN_BLOCKERS', () => {
    state.declared_attackers = [];
    handleAssignBlockersAction(state, []);
    expect(state.phase).toBe('ASSIGN_BLOCKERS');
  });
});

// ─── Phase 8: Combat Resolution ─────────────

describe('Phase 8: Combat Resolution', () => {
  it('should set phase to COMBAT_RESOLUTION', () => {
    state.declared_attackers = [];
    state.blocker_assignments = [];
    resolveCombatPhase(state);
    expect(state.phase).toBe('COMBAT_RESOLUTION');
  });
});

// ─── Phase 9: End of Turn ─────────────

describe('Phase 9: End of Turn', () => {
  it('should switch active player', () => {
    state.active_player = 'PLAYER_1';
    state.declared_attackers = [];
    state.blocker_assignments = [];

    resolveEndOfTurn(state);

    expect(state.active_player).toBe('PLAYER_2');
  });

  it('should reset has_attacked on all creatures', () => {
    const creature1 = createTestCreature(0, { has_attacked: true });
    placeCreature(state.player_1, 0, creature1);

    const creature2 = createTestCreature(0, { has_attacked: true });
    placeCreature(state.player_2, 0, creature2);

    resolveEndOfTurn(state);

    expect(creature1.has_attacked).toBe(false);
    expect(creature2.has_attacked).toBe(false);
  });

  it('should set phase to END_TURN', () => {
    resolveEndOfTurn(state);
    expect(state.phase).toBe('END_TURN');
  });

  it('should not switch active player if there is a winner', () => {
    state.active_player = 'PLAYER_1';
    state.winner = 'PLAYER_1';

    resolveEndOfTurn(state);

    expect(state.active_player).toBe('PLAYER_1');
  });

  it('should expire temp buffs', () => {
    const creature = createTestCreature(0, { attack: 3, health: 3 });
    creature.temp_buffs = [{
      effect: {
        effect_type: 'STAT_MODIFY_ATTACK',
        target: 'SELF',
        value: 2,
      },
      expires_at: 'END_OF_TURN',
      source: 'test',
    }];
    creature.attack = 5; // 3 base + 2 temp buff
    placeCreature(state.player_1, 0, creature);

    resolveEndOfTurn(state);

    expect(creature.attack).toBe(3); // Back to base
    expect(creature.temp_buffs).toHaveLength(0);
  });
});

// ─── Full Automatic Phase Execution ─────────────

describe('executeAutomaticPhases', () => {
  it('should execute phases 1-4 and reach MAIN_PHASE', () => {
    const result = executeAutomaticPhases(state);

    expect(result.startOfTurn).toBeDefined();
    expect(result.chaosRoll).toBeDefined();
    expect(result.drawAndMana).toBeDefined();
    expect(state.phase).toBe('MAIN_PHASE');
    expect(state.current_turn).toBe(1);
  });

  it('should draw a card during phase 4', () => {
    const handBefore = state.player_1.hand.length;
    const result = executeAutomaticPhases(state);
    // Phase 4 always draws 1 card. Events (e.g. O4 Clarity) may draw additional cards.
    expect(result.drawAndMana.drawn_card).not.toBeNull();
    expect(state.player_1.hand.length).toBeGreaterThanOrEqual(handBefore + 1);
  });

  it('should gain mana during phase 4', () => {
    state.player_1.current_mana = 2;
    const result = executeAutomaticPhases(state);
    expect(result.drawAndMana.current_mana).toBe(3);
  });

  it('should produce a chaos roll result', () => {
    const result = executeAutomaticPhases(state);
    expect(['ORDER', 'CHAOS', 'NOTHING']).toContain(result.chaosRoll.result);
    expect(result.chaosRoll.roll).toBeGreaterThanOrEqual(1);
    expect(result.chaosRoll.roll).toBeLessThanOrEqual(20);
  });
});

// ─── createBattleCreature ─────────────

describe('createBattleCreature', () => {
  it('should convert a BattleCard to a BattleCreature', () => {
    const card = createTestCard({
      base_attack: 4,
      base_health: 5,
      base_instability: 3,
      innate_keywords: ['FLYING'],
    });

    const creature = createBattleCreature(card, 2);

    expect(creature.attack).toBe(4);
    expect(creature.health).toBe(5);
    expect(creature.max_health).toBe(5);
    expect(creature.board_slot).toBe(2);
    expect(creature.is_alive).toBe(true);
    expect(creature.has_attacked).toBe(false);
    expect(creature.active_keywords).toContain('FLYING');
    expect(creature.shield_active).toBe(false);
  });

  it('should activate shield if innate SHIELD keyword', () => {
    const card = createTestCard({
      base_attack: 2,
      base_health: 3,
      innate_keywords: ['SHIELD'],
    });

    const creature = createBattleCreature(card, 0);

    expect(creature.shield_active).toBe(true);
    expect(creature.active_keywords).toContain('SHIELD');
  });

  it('should add modifier keywords that are not attuned', () => {
    const card = createTestCard({
      base_attack: 2,
      base_health: 3,
      innate_keywords: [],
      modifiers: [{
        definition_id: 'mod-1',
        name: 'Test Mod',
        pool_type: 'UNIVERSAL',
        attunement: 'ORDER',
        base_effect: { effect_type: 'STAT_MODIFY_ATTACK', target: 'SELF', value: 1 },
        attuned_effect: { effect_type: 'STAT_MODIFY_ATTACK', target: 'SELF', value: 1 },
        has_penalty: false,
        grants_keyword: 'LIFESTEAL',
        keyword_is_attuned: false,
        instability_adjustment: 0,
        instability_is_attuned: false,
        is_attuned_active: false,
        is_penalty_active: false,
      }],
    });

    const creature = createBattleCreature(card, 0);

    expect(creature.active_keywords).toContain('LIFESTEAL');
  });
});

// ─── GameError ─────────────

describe('GameError', () => {
  it('should have a code and message', () => {
    const error = new GameError('TEST_CODE', 'Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('GameError');
  });

  it('should be an instance of Error', () => {
    const error = new GameError('TEST', 'test');
    expect(error).toBeInstanceOf(Error);
  });
});

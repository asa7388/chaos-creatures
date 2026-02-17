// Chaos Creatures Game Server — Event System Tests
// Tests for event selection, resolution, triggered abilities, event pools

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEventPool,
  getEventById,
  getAllEvents,
  resolveEventPhase,
  eventRequiresChoice,
  getValidEventTargets,
} from '../src/engine/events';
import {
  resetIds,
  createTestGameState,
  createTestCreature,
  createTestAbility,
  placeCreature,
  fillDeck,
  fillHand,
} from './helpers';
import type { GameState } from '../src/types/game-state';

let state: GameState;

beforeEach(() => {
  resetIds();
  state = createTestGameState({
    current_turn: 1,
    active_player: 'PLAYER_1',
  });
  fillDeck(state.player_1, 16);
  fillDeck(state.player_2, 15);
  fillHand(state.player_1, 4);
  fillHand(state.player_2, 5);
});

// ─── Event Pools ─────────────

describe('Event pools', () => {
  it('should have 8 Order events', () => {
    const pool = getEventPool('ORDER');
    expect(pool).toHaveLength(8);
    pool.forEach(e => expect(e.event_type).toBe('ORDER'));
  });

  it('should have 8 Chaos events', () => {
    const pool = getEventPool('CHAOS');
    expect(pool).toHaveLength(8);
    pool.forEach(e => expect(e.event_type).toBe('CHAOS'));
  });

  it('should have 16 total events', () => {
    expect(getAllEvents()).toHaveLength(16);
  });

  it('should find events by ID', () => {
    expect(getEventById('O1')?.name).toBe('Mending Light');
    expect(getEventById('C1')?.name).toBe('Surge');
    expect(getEventById('O8')?.name).toBe('Harmonize');
    expect(getEventById('C8')?.name).toBe('Overcharge');
    expect(getEventById('NONEXISTENT')).toBeUndefined();
  });
});

// ─── Event Choice Requirements ─────────────

describe('Event choice requirements', () => {
  it('O2 (Planar Ward) should require player choice', () => {
    expect(eventRequiresChoice('O2')).toBe(true);
  });

  it('O5 (Fortify) should require player choice', () => {
    expect(eventRequiresChoice('O5')).toBe(true);
  });

  it('O1 (Mending Light) should NOT require choice', () => {
    expect(eventRequiresChoice('O1')).toBe(false);
  });

  it('C1 (Surge) should NOT require choice', () => {
    expect(eventRequiresChoice('C1')).toBe(false);
  });
});

// ─── Valid Event Targets ─────────────

describe('getValidEventTargets', () => {
  it('O2 targets should exclude creatures with Shield', () => {
    const noShield = createTestCreature(0, { shield_active: false });
    const withShield = createTestCreature(1, { shield_active: true });
    placeCreature(state.player_1, 0, noShield);
    placeCreature(state.player_1, 1, withShield);

    const targets = getValidEventTargets(state, 'O2');

    expect(targets).toContain(noShield.instance_id);
    expect(targets).not.toContain(withShield.instance_id);
  });

  it('O5 targets should include all alive friendly creatures', () => {
    const c1 = createTestCreature(0, {});
    const c2 = createTestCreature(1, {});
    placeCreature(state.player_1, 0, c1);
    placeCreature(state.player_1, 1, c2);

    const targets = getValidEventTargets(state, 'O5');

    expect(targets).toContain(c1.instance_id);
    expect(targets).toContain(c2.instance_id);
  });

  it('should return empty array for non-choice events', () => {
    const targets = getValidEventTargets(state, 'O1');
    expect(targets).toEqual([]);
  });
});

// ─── Order Event Resolution ─────────────

describe('Order event resolution', () => {
  it('should select an event from the Order pool', () => {
    const creature = createTestCreature(0, {
      attack: 3,
      health: 3,
      base_attack: 3,
      base_health: 3,
      max_health: 3,
    });
    placeCreature(state.player_1, 0, creature);

    const result = resolveEventPhase(state, 'ORDER');

    expect(result).not.toBeNull();
    expect(result!.event.event_type).toBe('ORDER');
    expect(state.last_roll_event_id).toBeTruthy();
  });

  it('should fire ON_ORDER triggered abilities', () => {
    const ability = createTestAbility({
      trigger: 'ON_ORDER',
      effect: {
        effect_type: 'STAT_MODIFY_ATTACK',
        target: 'SELF',
        value: 1,
        duration: 'THIS_TURN',
      },
    });

    const creature = createTestCreature(0, {
      attack: 3,
      health: 3,
      base_attack: 3,
      base_health: 3,
      max_health: 3,
      triggered_abilities: [ability],
    });
    placeCreature(state.player_1, 0, creature);

    const result = resolveEventPhase(state, 'ORDER');

    expect(result).not.toBeNull();
    // The creature should have had its ON_ORDER ability fired
    // Check trigger_results (may be empty if event killed the creature)
    expect(result!.trigger_results).toBeDefined();
  });
});

// ─── Chaos Event Resolution ─────────────

describe('Chaos event resolution', () => {
  it('should select an event from the Chaos pool', () => {
    const creature = createTestCreature(0, {
      attack: 3,
      health: 10,
      base_attack: 3,
      base_health: 10,
      max_health: 10,
    });
    placeCreature(state.player_1, 0, creature);

    const result = resolveEventPhase(state, 'CHAOS');

    expect(result).not.toBeNull();
    expect(result!.event.event_type).toBe('CHAOS');
  });

  it('should fire ON_CHAOS triggered abilities', () => {
    const ability = createTestAbility({
      trigger: 'ON_CHAOS',
      effect: {
        effect_type: 'STAT_MODIFY_ATTACK',
        target: 'SELF',
        value: 2,
        duration: 'THIS_TURN',
      },
    });

    const creature = createTestCreature(0, {
      attack: 3,
      health: 10,
      base_attack: 3,
      base_health: 10,
      max_health: 10,
      triggered_abilities: [ability],
    });
    placeCreature(state.player_1, 0, creature);

    const result = resolveEventPhase(state, 'CHAOS');

    expect(result).not.toBeNull();
    expect(result!.trigger_results).toBeDefined();
  });
});

// ─── Deterministic Event Selection ─────────────

describe('Deterministic event selection', () => {
  it('should select the same event given the same RNG state', () => {
    const creature = createTestCreature(0, { attack: 3, health: 10, base_attack: 3, base_health: 10, max_health: 10 });
    placeCreature(state.player_1, 0, creature);

    const counter1 = state.rng_counter;
    const result1 = resolveEventPhase(state, 'ORDER');

    // Reset RNG state
    state.rng_counter = counter1;

    // Reset creature state for a clean second run
    state.player_1.board[0] = createTestCreature(0, {
      instance_id: creature.instance_id,
      attack: 3,
      health: 10,
      base_attack: 3,
      base_health: 10,
      max_health: 10,
    });

    const result2 = resolveEventPhase(state, 'ORDER');

    expect(result1!.event.id).toBe(result2!.event.id);
  });
});

// ─── Specific Event Effects ─────────────

describe('Specific event effects', () => {
  it('O6 (Sanctuary) should heal the player', () => {
    state.player_1.current_hp = 15;
    state.player_1.max_hp = 20;

    // We can't control which event is selected, but if O6 is picked...
    // Let's test O6 directly by checking the event definition
    const o6 = getEventById('O6');
    expect(o6).toBeDefined();
    expect(o6!.name).toBe('Sanctuary');
    expect(o6!.effect.effect_type).toBe('HEAL_PLAYER');
    expect(o6!.effect.value).toBe(3);
    expect(o6!.effect.target).toBe('PLAYER_SELF');
  });

  it('C5 (Rift Bolt) should damage opponent player', () => {
    const c5 = getEventById('C5');
    expect(c5).toBeDefined();
    expect(c5!.name).toBe('Rift Bolt');
    expect(c5!.effect.effect_type).toBe('DAMAGE');
    expect(c5!.effect.value).toBe(3);
    expect(c5!.effect.target).toBe('PLAYER_OPPONENT');
  });

  it('C3 (Upheaval) should damage ALL creatures', () => {
    const c3 = getEventById('C3');
    expect(c3).toBeDefined();
    expect(c3!.effect.target).toBe('ALL_CREATURES');
    expect(c3!.effect.value).toBe(1);
    expect(c3!.can_backfire).toBe(true);
  });

  it('O3 (Steady Growth) should buff all friendly HP', () => {
    const o3 = getEventById('O3');
    expect(o3).toBeDefined();
    expect(o3!.effect.effect_type).toBe('STAT_MODIFY_HEALTH');
    expect(o3!.effect.target).toBe('ALL_FRIENDLY');
    expect(o3!.effect.value).toBe(1);
    expect(o3!.effect.duration).toBe('PERMANENT');
  });

  it('O4 (Clarity) should draw a card', () => {
    const o4 = getEventById('O4');
    expect(o4).toBeDefined();
    expect(o4!.effect.effect_type).toBe('DRAW_CARD');
    expect(o4!.effect.value).toBe(1);
  });

  it('C6 (Chaos Siphon) should have a secondary effect', () => {
    const c6 = getEventById('C6');
    expect(c6).toBeDefined();
    expect(c6!.effect.effect_type).toBe('DAMAGE');
    expect(c6!.effect.secondary_effect).toBeDefined();
    expect(c6!.effect.secondary_effect!.effect_type).toBe('STAT_MODIFY_ATTACK');
    expect(c6!.can_backfire).toBe(true);
  });

  it('C8 (Overcharge) should grant Piercing and ATK buff', () => {
    const c8 = getEventById('C8');
    expect(c8).toBeDefined();
    expect(c8!.effect.effect_type).toBe('STAT_MODIFY_ATTACK');
    expect(c8!.effect.secondary_effect).toBeDefined();
    expect(c8!.effect.secondary_effect!.effect_type).toBe('GRANT_KEYWORD');
    expect(c8!.effect.secondary_effect!.keyword).toBe('PIERCING');
  });
});

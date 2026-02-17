// Chaos Creatures Game Server — Instability Calculation Tests
// Tests for instability formula, clamping, modifier interactions

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCreatureInstability,
  calculatePlayerInstability,
  recalculateInstability,
} from '../src/engine/instability';
import {
  resetIds,
  createTestPlayer,
  createTestCreature,
  createTestModifier,
  placeCreature,
} from './helpers';
import type { BattlePlayer, BattleCreature } from '../src/types/game-state';

let player: BattlePlayer;

beforeEach(() => {
  resetIds();
  player = createTestPlayer('PLAYER_1', {
    avatar_instability_modifier: -3,
  });
});

// ─── Creature Instability ─────────────

describe('calculateCreatureInstability', () => {
  it('should return base instability with no modifiers', () => {
    const creature = createTestCreature(0, { base_instability: 4, modifiers: [] });
    expect(calculateCreatureInstability(creature)).toBe(4);
  });

  it('should add always-on modifier instability adjustments', () => {
    const modifier = createTestModifier({
      instability_adjustment: 2,
      instability_is_attuned: false,
    });
    const creature = createTestCreature(0, {
      base_instability: 3,
      modifiers: [modifier],
    });

    expect(calculateCreatureInstability(creature)).toBe(5);
  });

  it('should add attuned modifier instability only when attuned', () => {
    const modifier = createTestModifier({
      instability_adjustment: 3,
      instability_is_attuned: true,
      is_attuned_active: false,
    });
    const creature = createTestCreature(0, {
      base_instability: 2,
      modifiers: [modifier],
    });

    // Not attuned — should not add
    expect(calculateCreatureInstability(creature)).toBe(2);

    // Now activate attunement
    modifier.is_attuned_active = true;
    expect(calculateCreatureInstability(creature)).toBe(5);
  });

  it('should handle negative instability adjustments', () => {
    const modifier = createTestModifier({
      instability_adjustment: -2,
      instability_is_attuned: false,
    });
    const creature = createTestCreature(0, {
      base_instability: 3,
      modifiers: [modifier],
    });

    expect(calculateCreatureInstability(creature)).toBe(1);
  });

  it('should clamp creature instability to minimum 0', () => {
    const modifier = createTestModifier({
      instability_adjustment: -10,
      instability_is_attuned: false,
    });
    const creature = createTestCreature(0, {
      base_instability: 2,
      modifiers: [modifier],
    });

    expect(calculateCreatureInstability(creature)).toBe(0);
  });

  it('should sum multiple modifier instability adjustments', () => {
    const mod1 = createTestModifier({ instability_adjustment: 1, instability_is_attuned: false });
    const mod2 = createTestModifier({ instability_adjustment: 2, instability_is_attuned: false });
    const creature = createTestCreature(0, {
      base_instability: 3,
      modifiers: [mod1, mod2],
    });

    expect(calculateCreatureInstability(creature)).toBe(6);
  });
});

// ─── Player Instability ─────────────

describe('calculatePlayerInstability', () => {
  it('should return avatar modifier only with no creatures', () => {
    player.avatar_instability_modifier = -3;
    // -3 clamped to [1, 20] = 1
    expect(calculatePlayerInstability(player)).toBe(1);
  });

  it('should sum avatar modifier and creature instabilities', () => {
    player.avatar_instability_modifier = -3;

    const creature1 = createTestCreature(0, { base_instability: 4, modifiers: [] });
    const creature2 = createTestCreature(1, { base_instability: 3, modifiers: [] });
    placeCreature(player, 0, creature1);
    placeCreature(player, 1, creature2);

    // -3 + 4 + 3 = 4
    expect(calculatePlayerInstability(player)).toBe(4);
  });

  it('should exclude dead creatures', () => {
    player.avatar_instability_modifier = -3;

    const alive = createTestCreature(0, { base_instability: 5, modifiers: [] });
    const dead = createTestCreature(1, { base_instability: 10, modifiers: [], is_alive: false });
    placeCreature(player, 0, alive);
    placeCreature(player, 1, dead);

    // -3 + 5 = 2 (dead creature ignored)
    expect(calculatePlayerInstability(player)).toBe(2);
  });

  it('should clamp to minimum 1', () => {
    player.avatar_instability_modifier = -20;
    expect(calculatePlayerInstability(player)).toBe(1);
  });

  it('should clamp to maximum 20', () => {
    player.avatar_instability_modifier = 5;

    // Place 5 creatures each with instability 10
    for (let i = 0; i < 5; i++) {
      const creature = createTestCreature(i, { base_instability: 10, modifiers: [] });
      placeCreature(player, i, creature);
    }

    // 5 + 50 = 55, clamped to 20
    expect(calculatePlayerInstability(player)).toBe(20);
  });

  it('should handle zero instability clamped to 1', () => {
    player.avatar_instability_modifier = 0;
    // 0 with no creatures = 0, clamped to 1
    expect(calculatePlayerInstability(player)).toBe(1);
  });
});

// ─── Recalculate Instability ─────────────

describe('recalculateInstability', () => {
  it('should update player.instability in place', () => {
    player.avatar_instability_modifier = -3;
    const creature = createTestCreature(0, { base_instability: 6, modifiers: [] });
    placeCreature(player, 0, creature);

    const result = recalculateInstability(player);

    expect(result).toBe(3); // -3 + 6 = 3
    expect(player.instability).toBe(3);
  });

  it('should update each creature instability_value', () => {
    const mod = createTestModifier({ instability_adjustment: 2, instability_is_attuned: false });
    const creature = createTestCreature(0, { base_instability: 3, modifiers: [mod] });
    placeCreature(player, 0, creature);

    recalculateInstability(player);

    expect(creature.instability_value).toBe(5); // 3 + 2
  });

  it('should handle empty board correctly', () => {
    player.avatar_instability_modifier = -3;
    const result = recalculateInstability(player);
    expect(result).toBe(1); // -3 clamped to 1
    expect(player.instability).toBe(1);
  });
});

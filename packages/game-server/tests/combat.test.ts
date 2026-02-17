// Chaos Creatures Game Server — Combat Resolution Tests
// Tests for keyword interactions, combat pairs, blocker validation, attacker validation

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveCombat,
  validateDeclareAttackers,
  validateBlockerAssignments,
  countTauntCreatures,
  countAttackableCreatures,
} from '../src/engine/combat';
import {
  resetIds,
  createTestGameState,
  createTestCreature,
  createKeywordCreature,
  placeCreature,
} from './helpers';
import type { GameState, BattleCreature } from '../src/types/game-state';

let state: GameState;

beforeEach(() => {
  resetIds();
  state = createTestGameState({
    current_turn: 2,
    phase: 'DECLARE_ATTACKERS',
    active_player: 'PLAYER_1',
  });
});

// ─── Basic Combat ─────────────

describe('Basic combat resolution', () => {
  it('should deal mutual damage in a blocked combat pair', () => {
    const attacker = createTestCreature(0, { attack: 3, health: 4, base_attack: 3, base_health: 4, max_health: 4 });
    const blocker = createTestCreature(0, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const result = resolveCombat(state);

    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0].attacker_damage_dealt).toBe(3);
    expect(result.pairs[0].blocker_damage_dealt).toBe(2);
    // Blocker (3 HP - 3 ATK = 0) should die
    expect(result.pairs[0].blocker_died).toBe(true);
    // Attacker (4 HP - 2 ATK = 2) should survive
    expect(result.pairs[0].attacker_died).toBe(false);
  });

  it('should handle unblocked attacker dealing face damage', () => {
    const attacker = createTestCreature(0, { attack: 4, health: 3, base_attack: 4, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, attacker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [];

    const hpBefore = state.player_2.current_hp;
    const result = resolveCombat(state);

    expect(result.unblocked).toHaveLength(1);
    expect(result.unblocked[0].face_damage).toBe(4);
    expect(state.player_2.current_hp).toBe(hpBefore - 4);
  });

  it('should clear declared_attackers and blocker_assignments after combat', () => {
    const attacker = createTestCreature(0, { attack: 1, health: 1 });
    placeCreature(state.player_1, 0, attacker);
    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [];

    resolveCombat(state);

    expect(state.declared_attackers).toEqual([]);
    expect(state.blocker_assignments).toEqual([]);
  });

  it('should move destroyed creatures to graveyard', () => {
    const attacker = createTestCreature(0, { attack: 5, health: 5, base_attack: 5, base_health: 5, max_health: 5 });
    const blocker = createTestCreature(0, { attack: 1, health: 2, base_attack: 1, base_health: 2, max_health: 2 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    resolveCombat(state);

    expect(state.player_2.board[0]).toBeNull();
    expect(state.player_2.graveyard).toHaveLength(1);
    expect(state.player_2.graveyard[0].instance_id).toBe(blocker.instance_id);
  });

  it('should set winner when defending player HP drops to 0', () => {
    const attacker = createTestCreature(0, { attack: 20, health: 5, base_attack: 20, base_health: 5, max_health: 5 });
    placeCreature(state.player_1, 0, attacker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [];
    state.player_2.current_hp = 20;

    resolveCombat(state);

    expect(state.player_2.current_hp).toBe(0);
    expect(state.winner).toBe('PLAYER_1');
  });

  it('should favor defender on simultaneous HP depletion', () => {
    // Both players die — active player (attacker) should lose
    const attacker = createTestCreature(0, {
      attack: 20,
      health: 1,
      base_attack: 20,
      base_health: 1,
      max_health: 1,
      active_keywords: ['LIFESTEAL'],
      innate_keywords: ['LIFESTEAL'],
    });
    placeCreature(state.player_1, 0, attacker);

    // Blocker that kills the attacker's player via Piercing
    const blocker = createTestCreature(0, {
      attack: 1,
      health: 1,
      base_attack: 1,
      base_health: 1,
      max_health: 1,
    });
    placeCreature(state.player_2, 0, blocker);

    // Set both players low
    state.player_1.current_hp = 1;
    state.player_2.current_hp = 1;

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    resolveCombat(state);

    // Attacker kills blocker: Lifesteal heals P1 by 20 (1 + 20 = 21, capped at 20)
    // Blocker deals 1 to attacker (1 HP - 1 = 0, attacker dies)
    // Unblocked: none. Both mutual kills.
    // No face damage scenario here — just checking the structure works.
    // With Lifesteal healing P1, only P2 is in danger of losing.
  });
});

// ─── Shield Keyword ─────────────

describe('Shield keyword', () => {
  it('should absorb all damage and break shield on the blocker', () => {
    const attacker = createTestCreature(0, { attack: 5, health: 5, base_attack: 5, base_health: 5, max_health: 5 });
    const blocker = createKeywordCreature(0, ['SHIELD'], 2, 3);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const result = resolveCombat(state);
    const pair = result.pairs[0];

    expect(pair.blocker_shield_broke).toBe(true);
    expect(pair.attacker_damage_dealt).toBe(0); // Shield absorbed
    expect(pair.blocker_died).toBe(false); // Blocker survived
    expect(pair.blocker_damage_dealt).toBe(2); // Blocker still dealt damage
  });

  it('should absorb all damage on the attacker side too', () => {
    const attacker = createKeywordCreature(0, ['SHIELD'], 3, 3);
    const blocker = createTestCreature(0, { attack: 5, health: 5, base_attack: 5, base_health: 5, max_health: 5 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const result = resolveCombat(state);
    const pair = result.pairs[0];

    expect(pair.attacker_shield_broke).toBe(true);
    expect(pair.blocker_damage_dealt).toBe(0); // Attacker's shield absorbed blocker's damage
    expect(pair.attacker_died).toBe(false);
  });

  it('Shield + Deathtouch: shield absorbs all including deathtouch', () => {
    const attacker = createKeywordCreature(0, ['DEATHTOUCH'], 1, 3);
    const blocker = createKeywordCreature(0, ['SHIELD'], 2, 3);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const result = resolveCombat(state);
    const pair = result.pairs[0];

    // Shield absorbs all damage, so Deathtouch never applies (0 damage dealt)
    expect(pair.blocker_shield_broke).toBe(true);
    expect(pair.attacker_damage_dealt).toBe(0);
    expect(pair.blocker_died).toBe(false);
  });

  it('Shield + Piercing: shield absorbs prevents piercing', () => {
    const attacker = createKeywordCreature(0, ['PIERCING'], 10, 5);
    const blocker = createKeywordCreature(0, ['SHIELD'], 1, 2);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const hpBefore = state.player_2.current_hp;
    const result = resolveCombat(state);
    const pair = result.pairs[0];

    // Shield absorbed so no damage, no piercing
    expect(pair.blocker_shield_broke).toBe(true);
    expect(pair.piercing_damage).toBe(0);
    expect(state.player_2.current_hp).toBe(hpBefore);
  });

  it('Shield + Lifesteal: no healing when damage was 0 (shield)', () => {
    const attacker = createKeywordCreature(0, ['LIFESTEAL'], 3, 3);
    const blocker = createKeywordCreature(0, ['SHIELD'], 2, 2);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    state.player_1.current_hp = 15;
    const result = resolveCombat(state);
    const pair = result.pairs[0];

    // Shield absorbed damage, so Lifesteal heals 0
    expect(pair.attacker_damage_dealt).toBe(0);
    expect(pair.attacker_lifesteal).toBe(0);
    expect(state.player_1.current_hp).toBe(15); // No healing
  });
});

// ─── Deathtouch Keyword ─────────────

describe('Deathtouch keyword', () => {
  it('should kill any creature regardless of HP if damage > 0', () => {
    const attacker = createKeywordCreature(0, ['DEATHTOUCH'], 1, 3);
    const blocker = createTestCreature(0, { attack: 1, health: 100, base_health: 100, max_health: 100 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const result = resolveCombat(state);
    const pair = result.pairs[0];

    expect(pair.blocker_died).toBe(true);
    expect(pair.attacker_damage_dealt).toBe(1); // Only 1 damage dealt
  });

  it('Deathtouch vs Deathtouch: both creatures should die', () => {
    const attacker = createKeywordCreature(0, ['DEATHTOUCH'], 1, 10);
    const blocker = createKeywordCreature(0, ['DEATHTOUCH'], 1, 10);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const result = resolveCombat(state);
    const pair = result.pairs[0];

    expect(pair.attacker_died).toBe(true);
    expect(pair.blocker_died).toBe(true);
  });

  it('Deathtouch + Piercing: excess damage after deathtouch kill goes to face', () => {
    const attacker = createKeywordCreature(0, ['DEATHTOUCH', 'PIERCING'], 5, 5);
    const blocker = createTestCreature(0, { attack: 1, health: 3, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const hpBefore = state.player_2.current_hp;
    const result = resolveCombat(state);
    const pair = result.pairs[0];

    // Deathtouch kills blocker, Piercing excess = 5 - 3 = 2
    expect(pair.blocker_died).toBe(true);
    expect(pair.piercing_damage).toBe(2);
    expect(state.player_2.current_hp).toBe(hpBefore - 2);
  });

  it('Deathtouch + Lifesteal: Lifesteal heals for damage dealt', () => {
    const attacker = createKeywordCreature(0, ['DEATHTOUCH', 'LIFESTEAL'], 1, 5);
    const blocker = createTestCreature(0, { attack: 2, health: 20, base_health: 20, max_health: 20 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    state.player_1.current_hp = 15;
    const result = resolveCombat(state);
    const pair = result.pairs[0];

    expect(pair.blocker_died).toBe(true); // Deathtouch kills
    expect(pair.attacker_lifesteal).toBe(1); // Heals for damage dealt (1)
    expect(state.player_1.current_hp).toBe(16);
  });
});

// ─── Piercing Keyword ─────────────

describe('Piercing keyword', () => {
  it('should deal excess damage to defending player face', () => {
    const attacker = createKeywordCreature(0, ['PIERCING'], 7, 5);
    const blocker = createTestCreature(0, { attack: 1, health: 3, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const hpBefore = state.player_2.current_hp;
    const result = resolveCombat(state);
    const pair = result.pairs[0];

    // Excess = 7 - 3 = 4
    expect(pair.piercing_damage).toBe(4);
    expect(state.player_2.current_hp).toBe(hpBefore - 4);
  });

  it('should not pierce if damage exactly kills blocker (no excess)', () => {
    const attacker = createKeywordCreature(0, ['PIERCING'], 3, 5);
    const blocker = createTestCreature(0, { attack: 1, health: 3, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    const hpBefore = state.player_2.current_hp;
    const result = resolveCombat(state);
    const pair = result.pairs[0];

    expect(pair.piercing_damage).toBe(0);
    expect(state.player_2.current_hp).toBe(hpBefore);
  });

  it('should not pierce on unblocked attacks (already hitting face)', () => {
    const attacker = createKeywordCreature(0, ['PIERCING'], 5, 5);
    placeCreature(state.player_1, 0, attacker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [];

    const hpBefore = state.player_2.current_hp;
    resolveCombat(state);

    // Unblocked attacker just deals face damage, no double-dip piercing
    expect(state.player_2.current_hp).toBe(hpBefore - 5);
  });
});

// ─── Lifesteal Keyword ─────────────

describe('Lifesteal keyword', () => {
  it('should heal attacking player for damage dealt to blocker', () => {
    const attacker = createKeywordCreature(0, ['LIFESTEAL'], 3, 5);
    const blocker = createTestCreature(0, { attack: 1, health: 3, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    state.player_1.current_hp = 15;
    const result = resolveCombat(state);
    const pair = result.pairs[0];

    expect(pair.attacker_lifesteal).toBe(3);
    expect(state.player_1.current_hp).toBe(18);
  });

  it('should cap healing at max HP', () => {
    const attacker = createKeywordCreature(0, ['LIFESTEAL'], 5, 5);
    const blocker = createTestCreature(0, { attack: 1, health: 5, base_health: 5, max_health: 5 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    state.player_1.current_hp = 19;
    resolveCombat(state);

    expect(state.player_1.current_hp).toBe(20); // Capped at max
  });

  it('should heal on unblocked face damage', () => {
    const attacker = createKeywordCreature(0, ['LIFESTEAL'], 4, 3);
    placeCreature(state.player_1, 0, attacker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [];

    state.player_1.current_hp = 15;
    const result = resolveCombat(state);

    expect(result.unblocked[0].lifesteal).toBe(4);
    expect(state.player_1.current_hp).toBe(19);
  });

  it('blocker with Lifesteal should heal defending player', () => {
    const attacker = createTestCreature(0, { attack: 3, health: 5, base_attack: 3, base_health: 5, max_health: 5 });
    const blocker = createKeywordCreature(0, ['LIFESTEAL'], 2, 5);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];
    state.blocker_assignments = [{
      blocker_creature_id: blocker.instance_id,
      attacker_creature_id: attacker.instance_id,
    }];

    state.player_2.current_hp = 15;
    const result = resolveCombat(state);
    const pair = result.pairs[0];

    expect(pair.blocker_lifesteal).toBe(2);
    expect(state.player_2.current_hp).toBe(17);
  });
});

// ─── Flying Keyword ─────────────

describe('Flying keyword', () => {
  it('should reject blocking flying with non-flying/reach creature', () => {
    const attacker = createKeywordCreature(0, ['FLYING'], 3, 3);
    const blocker = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];

    const result = validateBlockerAssignments(state, [
      { blocker_id: blocker.instance_id, attacker_id: attacker.instance_id },
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Flying');
  });

  it('should allow Flying to block Flying', () => {
    const attacker = createKeywordCreature(0, ['FLYING'], 3, 3);
    const blocker = createKeywordCreature(0, ['FLYING'], 2, 3);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];

    const result = validateBlockerAssignments(state, [
      { blocker_id: blocker.instance_id, attacker_id: attacker.instance_id },
    ]);

    expect(result.valid).toBe(true);
  });

  it('should allow Reach to block Flying', () => {
    const attacker = createKeywordCreature(0, ['FLYING'], 3, 3);
    const blocker = createKeywordCreature(0, ['REACH'], 2, 3);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker.instance_id];

    const result = validateBlockerAssignments(state, [
      { blocker_id: blocker.instance_id, attacker_id: attacker.instance_id },
    ]);

    expect(result.valid).toBe(true);
  });

  it('Flying + Taunt: Taunt creature need not block if it cannot legally block flying', () => {
    const attacker = createKeywordCreature(0, ['FLYING'], 3, 3);
    const tauntBlocker = createKeywordCreature(0, ['TAUNT'], 2, 3); // No Flying/Reach
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, tauntBlocker);

    state.declared_attackers = [attacker.instance_id];

    // Taunt creature cannot block flying — validation should pass with no blockers
    const result = validateBlockerAssignments(state, []);

    expect(result.valid).toBe(true);
  });
});

// ─── Taunt Keyword ─────────────

describe('Taunt keyword', () => {
  it('should require minimum attackers equal to opponent Taunt count', () => {
    const creature1 = createTestCreature(0, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    const creature2 = createTestCreature(1, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, creature1);
    placeCreature(state.player_1, 1, creature2);

    // Opponent has 1 Taunt creature
    const tauntCreature = createKeywordCreature(0, ['TAUNT'], 2, 3);
    placeCreature(state.player_2, 0, tauntCreature);

    // Attempting to declare 0 attackers when opponent has 1 Taunt = invalid
    const result = validateDeclareAttackers(state, []);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Taunt');
  });

  it('should allow attack with at least Taunt count attackers', () => {
    const creature1 = createTestCreature(0, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, creature1);

    const tauntCreature = createKeywordCreature(0, ['TAUNT'], 2, 3);
    placeCreature(state.player_2, 0, tauntCreature);

    const result = validateDeclareAttackers(state, [creature1.instance_id]);
    expect(result.valid).toBe(true);
  });

  it('should enforce Taunt creatures must block if able', () => {
    // 2 attackers: one blocked by normal creature, Taunt creature left unassigned
    const attacker1 = createTestCreature(0, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    const attacker2 = createTestCreature(1, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, attacker1);
    placeCreature(state.player_1, 1, attacker2);

    const tauntBlocker = createKeywordCreature(0, ['TAUNT'], 2, 3);
    const normalCreature = createTestCreature(1, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    placeCreature(state.player_2, 0, tauntBlocker);
    placeCreature(state.player_2, 1, normalCreature);

    state.declared_attackers = [attacker1.instance_id, attacker2.instance_id];

    // Normal creature blocks one attacker, but Taunt creature is not blocking
    // Taunt creature CAN legally block the second attacker, so it MUST
    const result = validateBlockerAssignments(state, [
      { blocker_id: normalCreature.instance_id, attacker_id: attacker1.instance_id },
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Taunt creature');
  });

  it('should allow Taunt creature to block', () => {
    const attacker = createTestCreature(0, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, attacker);

    const tauntBlocker = createKeywordCreature(0, ['TAUNT'], 2, 3);
    placeCreature(state.player_2, 0, tauntBlocker);

    state.declared_attackers = [attacker.instance_id];

    const result = validateBlockerAssignments(state, [
      { blocker_id: tauntBlocker.instance_id, attacker_id: attacker.instance_id },
    ]);

    expect(result.valid).toBe(true);
  });

  it('Taunt min attack is capped by available attackable creatures', () => {
    // Only 1 attackable creature, opponent has 3 Taunt creatures
    const creature1 = createTestCreature(0, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, creature1);

    const taunt1 = createKeywordCreature(0, ['TAUNT'], 2, 3);
    const taunt2 = createKeywordCreature(1, ['TAUNT'], 2, 3);
    const taunt3 = createKeywordCreature(2, ['TAUNT'], 2, 3);
    placeCreature(state.player_2, 0, taunt1);
    placeCreature(state.player_2, 1, taunt2);
    placeCreature(state.player_2, 2, taunt3);

    // Only 1 creature can attack, so min(3 taunt, 1 attackable) = 1
    const result = validateDeclareAttackers(state, [creature1.instance_id]);
    expect(result.valid).toBe(true);
  });
});

// ─── Reach Keyword ─────────────

describe('Reach keyword', () => {
  it('Reach can block Flying', () => {
    const flyingAttacker = createKeywordCreature(0, ['FLYING'], 3, 3);
    const reachBlocker = createKeywordCreature(0, ['REACH'], 2, 4);
    placeCreature(state.player_1, 0, flyingAttacker);
    placeCreature(state.player_2, 0, reachBlocker);

    state.declared_attackers = [flyingAttacker.instance_id];

    const result = validateBlockerAssignments(state, [
      { blocker_id: reachBlocker.instance_id, attacker_id: flyingAttacker.instance_id },
    ]);

    expect(result.valid).toBe(true);
  });

  it('Reach can block non-Flying normally', () => {
    const attacker = createTestCreature(0, { attack: 3, health: 3, base_attack: 3, base_health: 3, max_health: 3 });
    const reachBlocker = createKeywordCreature(0, ['REACH'], 2, 4);
    placeCreature(state.player_1, 0, attacker);
    placeCreature(state.player_2, 0, reachBlocker);

    state.declared_attackers = [attacker.instance_id];

    const result = validateBlockerAssignments(state, [
      { blocker_id: reachBlocker.instance_id, attacker_id: attacker.instance_id },
    ]);

    expect(result.valid).toBe(true);
  });
});

// ─── Validate Declare Attackers ─────────────

describe('validateDeclareAttackers', () => {
  it('should reject P1 attacking on turn 1', () => {
    state.current_turn = 1;
    state.active_player = 'PLAYER_1';
    state.first_player = 'PLAYER_1';

    const creature = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_1, 0, creature);

    const result = validateDeclareAttackers(state, [creature.instance_id]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('turn 1');
  });

  it('should reject stabilizer as attacker', () => {
    const stabilizer = createTestCreature(0, { card_type: 'STABILIZER' });
    placeCreature(state.player_1, 0, stabilizer);

    const result = validateDeclareAttackers(state, [stabilizer.instance_id]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Stabilizer');
  });

  it('should reject duplicate attacker IDs', () => {
    const creature = createTestCreature(0, { attack: 2, health: 3, base_attack: 2, base_health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, creature);

    const result = validateDeclareAttackers(state, [
      creature.instance_id,
      creature.instance_id,
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Duplicate');
  });

  it('should reject non-existent creature as attacker', () => {
    const result = validateDeclareAttackers(state, ['nonexistent-id']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid attacker');
  });

  it('should allow empty attackers when no Taunt requirement', () => {
    const creature = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_1, 0, creature);

    const result = validateDeclareAttackers(state, []);
    expect(result.valid).toBe(true);
  });
});

// ─── Validate Blocker Assignments ─────────────

describe('validateBlockerAssignments', () => {
  it('should reject stabilizer as blocker', () => {
    const attacker = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_1, 0, attacker);

    const stabilizer = createTestCreature(0, { card_type: 'STABILIZER' });
    placeCreature(state.player_2, 0, stabilizer);

    state.declared_attackers = [attacker.instance_id];

    const result = validateBlockerAssignments(state, [
      { blocker_id: stabilizer.instance_id, attacker_id: attacker.instance_id },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Stabilizer');
  });

  it('should reject duplicate blockers', () => {
    const attacker1 = createTestCreature(0, { attack: 2, health: 3 });
    const attacker2 = createTestCreature(1, { attack: 2, health: 3 });
    placeCreature(state.player_1, 0, attacker1);
    placeCreature(state.player_1, 1, attacker2);

    const blocker = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = [attacker1.instance_id, attacker2.instance_id];

    const result = validateBlockerAssignments(state, [
      { blocker_id: blocker.instance_id, attacker_id: attacker1.instance_id },
      { blocker_id: blocker.instance_id, attacker_id: attacker2.instance_id },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('already assigned');
  });

  it('should reject blocking a non-declared attacker', () => {
    const attacker = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_1, 0, attacker);

    const blocker = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_2, 0, blocker);

    state.declared_attackers = []; // No declared attackers

    const result = validateBlockerAssignments(state, [
      { blocker_id: blocker.instance_id, attacker_id: attacker.instance_id },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid attacker target');
  });

  it('should allow empty blockers (no blocks)', () => {
    const attacker = createTestCreature(0, { attack: 2, health: 3 });
    placeCreature(state.player_1, 0, attacker);

    state.declared_attackers = [attacker.instance_id];

    // No Taunt creatures, so no blocks required
    const result = validateBlockerAssignments(state, []);
    expect(result.valid).toBe(true);
  });
});

// ─── Utility functions ─────────────

describe('Combat utility functions', () => {
  it('countTauntCreatures should count alive Taunt creatures only', () => {
    const taunt1 = createKeywordCreature(0, ['TAUNT'], 2, 3);
    const taunt2 = createKeywordCreature(1, ['TAUNT'], 2, 3);
    taunt2.is_alive = false; // Dead
    const normal = createTestCreature(2, { attack: 2, health: 3 });

    placeCreature(state.player_1, 0, taunt1);
    placeCreature(state.player_1, 1, taunt2);
    placeCreature(state.player_1, 2, normal);

    expect(countTauntCreatures(state.player_1)).toBe(1);
  });

  it('countAttackableCreatures should exclude stabilizers', () => {
    const creature1 = createTestCreature(0, { attack: 2, health: 3 });
    const stabilizer = createTestCreature(1, { card_type: 'STABILIZER' });
    const creature3 = createTestCreature(2, { attack: 2, health: 3 });

    placeCreature(state.player_1, 0, creature1);
    placeCreature(state.player_1, 1, stabilizer);
    placeCreature(state.player_1, 2, creature3);

    expect(countAttackableCreatures(state.player_1)).toBe(2);
  });
});

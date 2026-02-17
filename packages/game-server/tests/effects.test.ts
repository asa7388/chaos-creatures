// Chaos Creatures Game Server — Effects and Triggered Abilities Tests
// Tests for effect resolution, target resolution, temp buffs, death processing

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveEffect,
  applyDamageToCreature,
  resolveTriggeredAbilities,
  processDeaths,
  expireTempBuffs,
  recalculateAllCreatureStats,
} from '../src/engine/effects';
import {
  resetIds,
  createTestGameState,
  createTestCreature,
  createTestAbility,
  createKeywordCreature,
  placeCreature,
  fillDeck,
} from './helpers';
import type { GameState, Effect, BattleCreature } from '../src/types/game-state';

let state: GameState;

beforeEach(() => {
  resetIds();
  state = createTestGameState({
    current_turn: 1,
    active_player: 'PLAYER_1',
  });
  fillDeck(state.player_1, 10);
  fillDeck(state.player_2, 10);
});

// ─── Damage Effects ─────────────

describe('Damage effects', () => {
  it('should deal damage to a creature', () => {
    const creature = createTestCreature(0, { health: 5, max_health: 5 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'DAMAGE',
      target: 'FRIENDLY_CREATURE',
      value: 2,
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.health).toBe(3);
  });

  it('should deal damage to a player', () => {
    const effect: Effect = {
      effect_type: 'DAMAGE',
      target: 'PLAYER_OPPONENT',
      value: 3,
    };

    resolveEffect(state, effect, state.player_1);

    expect(state.player_2.current_hp).toBe(17);
  });

  it('should mark creature as dead when health drops to 0', () => {
    const creature = createTestCreature(0, { health: 2, max_health: 2 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'DAMAGE',
      target: 'FRIENDLY_CREATURE',
      value: 5,
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.health).toBe(-3);
    expect(creature.is_alive).toBe(false);
  });
});

// ─── Healing Effects ─────────────

describe('Healing effects', () => {
  it('should heal a creature', () => {
    const creature = createTestCreature(0, { health: 2, max_health: 5 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'HEAL',
      target: 'FRIENDLY_CREATURE',
      value: 2,
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.health).toBe(4);
  });

  it('should not heal above max_health', () => {
    const creature = createTestCreature(0, { health: 4, max_health: 5 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'HEAL',
      target: 'FRIENDLY_CREATURE',
      value: 10,
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.health).toBe(5);
  });

  it('should heal a player', () => {
    state.player_1.current_hp = 15;

    const effect: Effect = {
      effect_type: 'HEAL_PLAYER',
      target: 'PLAYER_SELF',
      value: 3,
    };

    resolveEffect(state, effect, state.player_1);

    expect(state.player_1.current_hp).toBe(18);
  });

  it('should not heal player above max_hp', () => {
    state.player_1.current_hp = 19;
    state.player_1.max_hp = 20;

    const effect: Effect = {
      effect_type: 'HEAL_PLAYER',
      target: 'PLAYER_SELF',
      value: 5,
    };

    resolveEffect(state, effect, state.player_1);

    expect(state.player_1.current_hp).toBe(20);
  });
});

// ─── Stat Modification ─────────────

describe('Stat modification effects', () => {
  it('should modify ATK permanently', () => {
    const creature = createTestCreature(0, { attack: 3 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'FRIENDLY_CREATURE',
      value: 2,
      duration: 'PERMANENT',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.attack).toBe(5);
  });

  it('should modify ATK temporarily and add temp buff', () => {
    const creature = createTestCreature(0, { attack: 3 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'FRIENDLY_CREATURE',
      value: 2,
      duration: 'THIS_TURN',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.attack).toBe(5);
    expect(creature.temp_buffs).toHaveLength(1);
    expect(creature.temp_buffs[0].expires_at).toBe('END_OF_TURN');
  });

  it('should modify HP and max_health', () => {
    const creature = createTestCreature(0, { health: 3, max_health: 3 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'STAT_MODIFY_HEALTH',
      target: 'FRIENDLY_CREATURE',
      value: 2,
      duration: 'PERMANENT',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.health).toBe(5);
    expect(creature.max_health).toBe(5);
  });
});

// ─── Draw Card ─────────────

describe('Draw card effect', () => {
  it('should draw a card for the player', () => {
    const handBefore = state.player_1.hand.length;
    const deckBefore = state.player_1.deck.length;

    const effect: Effect = {
      effect_type: 'DRAW_CARD',
      target: 'PLAYER_SELF',
      value: 1,
    };

    resolveEffect(state, effect, state.player_1);

    expect(state.player_1.hand.length).toBe(handBefore + 1);
    expect(state.player_1.deck.length).toBe(deckBefore - 1);
  });

  it('should draw multiple cards', () => {
    const handBefore = state.player_1.hand.length;

    const effect: Effect = {
      effect_type: 'DRAW_CARD',
      target: 'PLAYER_SELF',
      value: 3,
    };

    resolveEffect(state, effect, state.player_1);

    expect(state.player_1.hand.length).toBe(handBefore + 3);
  });

  it('should handle drawing from empty deck', () => {
    state.player_1.deck = [];
    const handBefore = state.player_1.hand.length;

    const effect: Effect = {
      effect_type: 'DRAW_CARD',
      target: 'PLAYER_SELF',
      value: 1,
    };

    resolveEffect(state, effect, state.player_1);

    expect(state.player_1.hand.length).toBe(handBefore); // No change
  });
});

// ─── Gain Mana ─────────────

describe('Gain mana effect', () => {
  it('should grant mana to the player', () => {
    state.player_1.current_mana = 3;
    state.player_1.mana_cap = 10;

    const effect: Effect = {
      effect_type: 'GAIN_MANA',
      target: 'PLAYER_SELF',
      value: 2,
    };

    resolveEffect(state, effect, state.player_1);

    expect(state.player_1.current_mana).toBe(5);
  });

  it('should cap at mana_cap', () => {
    state.player_1.current_mana = 9;
    state.player_1.mana_cap = 10;

    const effect: Effect = {
      effect_type: 'GAIN_MANA',
      target: 'PLAYER_SELF',
      value: 5,
    };

    resolveEffect(state, effect, state.player_1);

    expect(state.player_1.current_mana).toBe(10);
  });
});

// ─── Grant Keyword ─────────────

describe('Grant keyword effect', () => {
  it('should grant a keyword to a creature', () => {
    const creature = createTestCreature(0, { active_keywords: [] });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'GRANT_KEYWORD',
      target: 'FRIENDLY_CREATURE',
      keyword: 'FLYING',
      duration: 'PERMANENT',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.active_keywords).toContain('FLYING');
  });

  it('should not duplicate a keyword', () => {
    const creature = createTestCreature(0, { active_keywords: ['FLYING'] });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'GRANT_KEYWORD',
      target: 'FRIENDLY_CREATURE',
      keyword: 'FLYING',
      duration: 'PERMANENT',
    };

    resolveEffect(state, effect, state.player_1);

    const flyingCount = creature.active_keywords.filter(k => k === 'FLYING').length;
    expect(flyingCount).toBe(1);
  });

  it('should activate shield when granting SHIELD', () => {
    const creature = createTestCreature(0, { active_keywords: [], shield_active: false });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'GRANT_KEYWORD',
      target: 'FRIENDLY_CREATURE',
      keyword: 'SHIELD',
      duration: 'PERMANENT',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.shield_active).toBe(true);
  });

  it('should add temp buff for THIS_TURN keywords', () => {
    const creature = createTestCreature(0, { active_keywords: [] });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'GRANT_KEYWORD',
      target: 'FRIENDLY_CREATURE',
      keyword: 'PIERCING',
      duration: 'THIS_TURN',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.active_keywords).toContain('PIERCING');
    expect(creature.temp_buffs).toHaveLength(1);
  });
});

// ─── Remove Keyword ─────────────

describe('Remove keyword effect', () => {
  it('should remove a keyword from a creature', () => {
    const creature = createTestCreature(0, { active_keywords: ['FLYING', 'SHIELD'] });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'REMOVE_KEYWORD',
      target: 'FRIENDLY_CREATURE',
      keyword: 'FLYING',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.active_keywords).not.toContain('FLYING');
    expect(creature.active_keywords).toContain('SHIELD');
  });

  it('should deactivate shield when removing SHIELD', () => {
    const creature = createTestCreature(0, {
      active_keywords: ['SHIELD'],
      shield_active: true,
    });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'REMOVE_KEYWORD',
      target: 'FRIENDLY_CREATURE',
      keyword: 'SHIELD',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.shield_active).toBe(false);
  });
});

// ─── Destroy Creature ─────────────

describe('Destroy creature effect', () => {
  it('should set creature health to 0 and mark as dead', () => {
    const creature = createTestCreature(0, { health: 10, max_health: 10 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'DESTROY_CREATURE',
      target: 'FRIENDLY_CREATURE',
    };

    resolveEffect(state, effect, state.player_1);

    expect(creature.health).toBe(0);
    expect(creature.is_alive).toBe(false);
  });
});

// ─── Secondary Effects ─────────────

describe('Secondary effects', () => {
  it('should resolve secondary effects after primary', () => {
    const creature = createTestCreature(0, { attack: 3, health: 5, max_health: 5 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'FRIENDLY_CREATURE',
      value: 1,
      duration: 'PERMANENT',
      secondary_effect: {
        effect_type: 'STAT_MODIFY_HEALTH',
        target: 'FRIENDLY_CREATURE',
        value: 1,
        duration: 'PERMANENT',
      },
    };

    const results = resolveEffect(state, effect, state.player_1);

    expect(creature.attack).toBe(4); // +1 ATK
    expect(creature.health).toBe(6); // +1 HP
    expect(results).toHaveLength(2);
  });
});

// ─── Target Resolution ─────────────

describe('Target resolution', () => {
  it('ALL_FRIENDLY should affect all friendly creatures', () => {
    const c1 = createTestCreature(0, { attack: 2 });
    const c2 = createTestCreature(1, { attack: 3 });
    placeCreature(state.player_1, 0, c1);
    placeCreature(state.player_1, 1, c2);

    const effect: Effect = {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'ALL_FRIENDLY',
      value: 1,
      duration: 'PERMANENT',
    };

    resolveEffect(state, effect, state.player_1);

    expect(c1.attack).toBe(3);
    expect(c2.attack).toBe(4);
  });

  it('ALL_ENEMY should affect all enemy creatures', () => {
    const c1 = createTestCreature(0, { health: 5, max_health: 5 });
    const c2 = createTestCreature(1, { health: 5, max_health: 5 });
    placeCreature(state.player_2, 0, c1);
    placeCreature(state.player_2, 1, c2);

    const effect: Effect = {
      effect_type: 'DAMAGE',
      target: 'ALL_ENEMY',
      value: 2,
    };

    resolveEffect(state, effect, state.player_1);

    expect(c1.health).toBe(3);
    expect(c2.health).toBe(3);
  });

  it('ALL_CREATURES should affect both sides', () => {
    const friendly = createTestCreature(0, { health: 5, max_health: 5 });
    const enemy = createTestCreature(0, { health: 5, max_health: 5 });
    placeCreature(state.player_1, 0, friendly);
    placeCreature(state.player_2, 0, enemy);

    const effect: Effect = {
      effect_type: 'DAMAGE',
      target: 'ALL_CREATURES',
      value: 1,
    };

    resolveEffect(state, effect, state.player_1);

    expect(friendly.health).toBe(4);
    expect(enemy.health).toBe(4);
  });

  it('SELF should target the source creature', () => {
    const creature = createTestCreature(0, { attack: 2 });
    placeCreature(state.player_1, 0, creature);

    const effect: Effect = {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'SELF',
      value: 3,
      duration: 'PERMANENT',
    };

    resolveEffect(state, effect, state.player_1, creature);

    expect(creature.attack).toBe(5);
  });

  it('LOWEST_HP_FRIENDLY should target the creature with lowest HP', () => {
    const highHp = createTestCreature(0, { health: 5, max_health: 5 });
    const lowHp = createTestCreature(1, { health: 1, max_health: 5 });
    placeCreature(state.player_1, 0, highHp);
    placeCreature(state.player_1, 1, lowHp);

    const effect: Effect = {
      effect_type: 'HEAL',
      target: 'LOWEST_HP_FRIENDLY',
      value: 2,
    };

    resolveEffect(state, effect, state.player_1);

    expect(lowHp.health).toBe(3); // Healed
    expect(highHp.health).toBe(5); // Unchanged
  });

  it('should return empty results when no valid targets', () => {
    const effect: Effect = {
      effect_type: 'DAMAGE',
      target: 'ALL_ENEMY',
      value: 1,
    };

    // No enemy creatures
    const results = resolveEffect(state, effect, state.player_1);
    expect(results).toHaveLength(0);
  });
});

// ─── Apply Damage to Creature ─────────────

describe('applyDamageToCreature', () => {
  it('should reduce health by damage amount', () => {
    const creature = createTestCreature(0, { health: 5 });
    placeCreature(state.player_1, 0, creature);

    const actualDamage = applyDamageToCreature(state, creature, 3, state.player_1);

    expect(actualDamage).toBe(3);
    expect(creature.health).toBe(2);
  });

  it('should absorb damage with shield and return 0', () => {
    const creature = createTestCreature(0, {
      health: 5,
      shield_active: true,
      active_keywords: ['SHIELD'],
    });
    placeCreature(state.player_1, 0, creature);

    const actualDamage = applyDamageToCreature(state, creature, 10, state.player_1);

    expect(actualDamage).toBe(0);
    expect(creature.health).toBe(5);
    expect(creature.shield_active).toBe(false);
  });

  it('should mark creature as dead when health drops to 0', () => {
    const creature = createTestCreature(0, { health: 3 });
    placeCreature(state.player_1, 0, creature);

    applyDamageToCreature(state, creature, 5, state.player_1);

    expect(creature.is_alive).toBe(false);
  });

  it('should ignore zero damage', () => {
    const creature = createTestCreature(0, { health: 5 });
    placeCreature(state.player_1, 0, creature);

    const actualDamage = applyDamageToCreature(state, creature, 0, state.player_1);

    expect(actualDamage).toBe(0);
    expect(creature.health).toBe(5);
  });
});

// ─── Process Deaths ─────────────

describe('processDeaths', () => {
  it('should remove dead creatures from board', () => {
    const alive = createTestCreature(0, { health: 5, is_alive: true });
    const dead = createTestCreature(1, { health: 0, is_alive: true }); // HP is 0 but not yet marked
    placeCreature(state.player_1, 0, alive);
    placeCreature(state.player_1, 1, dead);

    processDeaths(state, state.player_1);

    expect(state.player_1.board[0]).not.toBeNull();
    expect(state.player_1.board[1]).toBeNull();
  });

  it('should add dead creatures to graveyard', () => {
    const dead = createTestCreature(0, { health: 0, is_alive: true });
    placeCreature(state.player_1, 0, dead);

    processDeaths(state, state.player_1);

    expect(state.player_1.graveyard).toHaveLength(1);
  });
});

// ─── Expire Temp Buffs ─────────────

describe('expireTempBuffs', () => {
  it('should reverse ATK temp buffs', () => {
    const creature = createTestCreature(0, { attack: 5 });
    creature.temp_buffs = [{
      effect: { effect_type: 'STAT_MODIFY_ATTACK', target: 'SELF', value: 2 },
      expires_at: 'END_OF_TURN',
      source: 'test',
    }];
    placeCreature(state.player_1, 0, creature);

    expireTempBuffs(state.player_1);

    expect(creature.attack).toBe(3);
    expect(creature.temp_buffs).toHaveLength(0);
  });

  it('should reverse HP temp buffs and cap health', () => {
    const creature = createTestCreature(0, { health: 5, max_health: 5 });
    creature.temp_buffs = [{
      effect: { effect_type: 'STAT_MODIFY_HEALTH', target: 'SELF', value: 2 },
      expires_at: 'END_OF_TURN',
      source: 'test',
    }];
    placeCreature(state.player_1, 0, creature);

    expireTempBuffs(state.player_1);

    expect(creature.max_health).toBe(3);
    expect(creature.health).toBeLessThanOrEqual(3);
  });

  it('should remove temporary keywords', () => {
    const creature = createTestCreature(0, { active_keywords: ['PIERCING'] });
    creature.temp_buffs = [{
      effect: { effect_type: 'GRANT_KEYWORD', target: 'SELF', keyword: 'PIERCING' },
      expires_at: 'END_OF_TURN',
      source: 'test',
    }];
    placeCreature(state.player_1, 0, creature);

    expireTempBuffs(state.player_1);

    expect(creature.active_keywords).not.toContain('PIERCING');
  });

  it('should not expire non-END_OF_TURN buffs', () => {
    const creature = createTestCreature(0, { attack: 5 });
    creature.temp_buffs = [{
      effect: { effect_type: 'STAT_MODIFY_ATTACK', target: 'SELF', value: 2 },
      expires_at: 'UNTIL_NEXT_ROLL',
      source: 'test',
    }];
    placeCreature(state.player_1, 0, creature);

    expireTempBuffs(state.player_1);

    expect(creature.attack).toBe(5); // Not reversed
    expect(creature.temp_buffs).toHaveLength(1);
  });
});

// ─── Triggered Abilities ─────────────

describe('resolveTriggeredAbilities', () => {
  it('should fire matching abilities', () => {
    const ability = createTestAbility({
      trigger: 'ON_PLAY',
      effect: {
        effect_type: 'STAT_MODIFY_ATTACK',
        target: 'SELF',
        value: 1,
        duration: 'PERMANENT',
      },
    });

    const creature = createTestCreature(0, {
      attack: 3,
      triggered_abilities: [ability],
    });
    placeCreature(state.player_1, 0, creature);

    const results = resolveTriggeredAbilities(state, creature, 'ON_PLAY', state.player_1);

    expect(results.length).toBeGreaterThan(0);
    expect(creature.attack).toBe(4);
  });

  it('should not fire abilities with wrong trigger', () => {
    const ability = createTestAbility({
      trigger: 'ON_DEATH',
      effect: {
        effect_type: 'STAT_MODIFY_ATTACK',
        target: 'SELF',
        value: 5,
        duration: 'PERMANENT',
      },
    });

    const creature = createTestCreature(0, {
      attack: 3,
      triggered_abilities: [ability],
    });
    placeCreature(state.player_1, 0, creature);

    const results = resolveTriggeredAbilities(state, creature, 'ON_PLAY', state.player_1);

    expect(results).toHaveLength(0);
    expect(creature.attack).toBe(3); // Unchanged
  });
});

// Chaos Creatures Game Server — Effect Resolution & Triggered Abilities
// Resolves the Effect schema from docs/design/02-card-data-model.md Section 7

import type {
  GameState,
  BattleCreature,
  BattlePlayer,
  Effect,
  EffectResult,
  TempBuff,
} from '../types/game-state';
import type { TriggerType, Keyword, TargetType } from '../types/enums';
import { SeededRNG } from './rng';
import { recalculateInstability } from './instability';

/** Get active player from game state */
function getActivePlayer(state: GameState): BattlePlayer {
  return state.active_player === 'PLAYER_1' ? state.player_1 : state.player_2;
}

/** Get defending player from game state */
function getDefendingPlayer(state: GameState): BattlePlayer {
  return state.active_player === 'PLAYER_1' ? state.player_2 : state.player_1;
}

/** Get the seeded RNG from state */
function getRNG(state: GameState): SeededRNG {
  return SeededRNG.fromState(state.rng_seed, state.rng_counter);
}

/** Save RNG state back */
function saveRNG(state: GameState, rng: SeededRNG): void {
  state.rng_counter = rng.getCounter();
}

/** Get all alive creatures for a player */
function getAliveCreatures(player: BattlePlayer): BattleCreature[] {
  return player.board.filter((c): c is BattleCreature => c !== null && c.is_alive);
}

/** Find creature with lowest HP on a player's board (leftmost if tied) */
function findLowestHpCreature(player: BattlePlayer): BattleCreature | null {
  let lowest: BattleCreature | null = null;
  for (const creature of player.board) {
    if (!creature || !creature.is_alive) continue;
    if (!lowest || creature.health < lowest.health) {
      lowest = creature;
    }
  }
  return lowest;
}

/** Find creature with highest ATK on a player's board (leftmost if tied) */
function findHighestAtkCreature(player: BattlePlayer): BattleCreature | null {
  let highest: BattleCreature | null = null;
  for (const creature of player.board) {
    if (!creature || !creature.is_alive) continue;
    if (!highest || creature.attack > highest.attack) {
      highest = creature;
    }
  }
  return highest;
}

/** Resolve targets for an effect */
function resolveTargets(
  state: GameState,
  target: TargetType,
  sourcePlayer: BattlePlayer,
  sourceCreature?: BattleCreature
): (BattleCreature | BattlePlayer)[] {
  const opponent = sourcePlayer.side === 'PLAYER_1' ? state.player_2 : state.player_1;
  const rng = getRNG(state);

  let targets: (BattleCreature | BattlePlayer)[] = [];

  switch (target) {
    case 'SELF':
      if (sourceCreature && sourceCreature.is_alive) targets = [sourceCreature];
      break;
    case 'FRIENDLY_CREATURE': {
      // For auto-targeting, pick the best target (leftmost alive)
      const alive = getAliveCreatures(sourcePlayer);
      if (alive.length > 0) targets = [alive[0]];
      break;
    }
    case 'ENEMY_CREATURE': {
      const alive = getAliveCreatures(opponent);
      if (alive.length > 0) targets = [alive[0]];
      break;
    }
    case 'ANY_CREATURE': {
      const all = [...getAliveCreatures(sourcePlayer), ...getAliveCreatures(opponent)];
      if (all.length > 0) targets = [all[0]];
      break;
    }
    case 'ALL_FRIENDLY':
      targets = getAliveCreatures(sourcePlayer);
      break;
    case 'ALL_ENEMY':
      targets = getAliveCreatures(opponent);
      break;
    case 'ALL_CREATURES':
      targets = [...getAliveCreatures(sourcePlayer), ...getAliveCreatures(opponent)];
      break;
    case 'RANDOM_FRIENDLY': {
      const alive = getAliveCreatures(sourcePlayer);
      if (alive.length > 0) {
        const idx = rng.nextInt(0, alive.length - 1);
        targets = [alive[idx]];
      }
      break;
    }
    case 'RANDOM_ENEMY': {
      const alive = getAliveCreatures(opponent);
      if (alive.length > 0) {
        const idx = rng.nextInt(0, alive.length - 1);
        targets = [alive[idx]];
      }
      break;
    }
    case 'RANDOM_ANY': {
      const all = [...getAliveCreatures(sourcePlayer), ...getAliveCreatures(opponent)];
      if (all.length > 0) {
        const idx = rng.nextInt(0, all.length - 1);
        targets = [all[idx]];
      }
      break;
    }
    case 'LOWEST_HP_FRIENDLY': {
      const lowest = findLowestHpCreature(sourcePlayer);
      if (lowest) targets = [lowest];
      break;
    }
    case 'LOWEST_HP_ENEMY': {
      const lowest = findLowestHpCreature(opponent);
      if (lowest) targets = [lowest];
      break;
    }
    case 'HIGHEST_ATK_FRIENDLY': {
      const highest = findHighestAtkCreature(sourcePlayer);
      if (highest) targets = [highest];
      break;
    }
    case 'HIGHEST_ATK_ENEMY': {
      const highest = findHighestAtkCreature(opponent);
      if (highest) targets = [highest];
      break;
    }
    case 'PLAYER_SELF':
      targets = [sourcePlayer];
      break;
    case 'PLAYER_OPPONENT':
      targets = [opponent];
      break;
    default:
      break;
  }

  saveRNG(state, rng);
  return targets;
}

/** Check if a target is a BattleCreature */
function isCreature(target: BattleCreature | BattlePlayer): target is BattleCreature {
  return 'instance_id' in target;
}

/** Check if a target is a BattlePlayer */
function isPlayer(target: BattleCreature | BattlePlayer): target is BattlePlayer {
  return 'player_id' in target && !('instance_id' in target);
}

/**
 * Apply damage to a creature, handling ON_DAMAGE_TAKEN triggers and shield.
 */
export function applyDamageToCreature(
  state: GameState,
  creature: BattleCreature,
  damage: number,
  owner: BattlePlayer
): number {
  if (damage <= 0) return 0;

  // Check shield
  if (creature.shield_active) {
    creature.shield_active = false;
    creature.active_keywords = creature.active_keywords.filter(k => k !== 'SHIELD');
    return 0; // Shield absorbed all damage
  }

  creature.health -= damage;

  // Fire ON_DAMAGE_TAKEN triggers
  resolveTriggeredAbilities(state, creature, 'ON_DAMAGE_TAKEN', owner);

  // Check death
  if (creature.health <= 0) {
    creature.is_alive = false;
  }

  return damage;
}

/**
 * Resolve an Effect against its targets.
 */
export function resolveEffect(
  state: GameState,
  effect: Effect,
  sourcePlayer: BattlePlayer,
  sourceCreature?: BattleCreature,
  specificTarget?: BattleCreature
): EffectResult[] {
  const results: EffectResult[] = [];

  // If a specific target was provided (e.g., player choice), use it
  let targets: (BattleCreature | BattlePlayer)[];
  if (specificTarget) {
    targets = [specificTarget];
  } else {
    targets = resolveTargets(state, effect.target, sourcePlayer, sourceCreature);
  }

  if (targets.length === 0) {
    return results;
  }

  // Check condition
  if (effect.condition && effect.condition.type !== 'NONE') {
    if (!evaluateCondition(effect.condition, sourcePlayer, sourceCreature)) {
      return results;
    }
  }

  const targetIds: string[] = [];

  for (const target of targets) {
    if (isCreature(target)) {
      targetIds.push(target.instance_id);
    } else if (isPlayer(target)) {
      targetIds.push(target.player_id);
    }

    switch (effect.effect_type) {
      case 'STAT_MODIFY_ATTACK': {
        if (isCreature(target) && effect.value !== undefined) {
          if (effect.duration === 'THIS_TURN') {
            target.temp_buffs.push({
              effect: { ...effect },
              expires_at: 'END_OF_TURN',
              source: 'effect',
            });
          }
          target.attack += effect.value;
        }
        break;
      }
      case 'STAT_MODIFY_HEALTH': {
        if (isCreature(target) && effect.value !== undefined) {
          if (effect.duration === 'THIS_TURN') {
            target.temp_buffs.push({
              effect: { ...effect },
              expires_at: 'END_OF_TURN',
              source: 'effect',
            });
          }
          target.health += effect.value;
          target.max_health += effect.value;
        }
        break;
      }
      case 'DAMAGE': {
        if (isCreature(target) && effect.value !== undefined) {
          const owner = findCreatureOwner(state, target);
          if (owner) {
            applyDamageToCreature(state, target, effect.value, owner);
          }
        } else if (isPlayer(target) && effect.value !== undefined) {
          target.current_hp -= effect.value;
        }
        break;
      }
      case 'HEAL': {
        if (isCreature(target) && effect.value !== undefined) {
          target.health = Math.min(target.health + effect.value, target.max_health);
        }
        break;
      }
      case 'HEAL_PLAYER': {
        if (isPlayer(target) && effect.value !== undefined) {
          target.current_hp = Math.min(target.current_hp + effect.value, target.max_hp);
        }
        break;
      }
      case 'DRAW_CARD': {
        if (isPlayer(target)) {
          const count = effect.value ?? 1;
          for (let i = 0; i < count; i++) {
            if (target.deck.length > 0) {
              const card = target.deck.shift()!;
              target.hand.push(card);
            }
          }
        }
        break;
      }
      case 'GAIN_MANA': {
        if (isPlayer(target) && effect.value !== undefined) {
          target.current_mana = Math.min(target.current_mana + effect.value, target.mana_cap);
        }
        break;
      }
      case 'GRANT_KEYWORD': {
        if (isCreature(target) && effect.keyword) {
          if (!target.active_keywords.includes(effect.keyword)) {
            target.active_keywords.push(effect.keyword);
          }
          if (effect.keyword === 'SHIELD') {
            target.shield_active = true;
          }
          if (effect.duration === 'THIS_TURN') {
            target.temp_buffs.push({
              effect: { ...effect },
              expires_at: 'END_OF_TURN',
              source: 'effect',
            });
          }
        }
        break;
      }
      case 'REMOVE_KEYWORD': {
        if (isCreature(target) && effect.keyword) {
          target.active_keywords = target.active_keywords.filter(k => k !== effect.keyword);
          if (effect.keyword === 'SHIELD') {
            target.shield_active = false;
          }
        }
        break;
      }
      case 'DESTROY_CREATURE': {
        if (isCreature(target)) {
          target.health = 0;
          target.is_alive = false;
        }
        break;
      }
      default:
        break;
    }
  }

  results.push({
    effect_type: effect.effect_type,
    target_ids: targetIds,
    value: effect.value,
    description: describeEffect(effect, targetIds),
  });

  // Resolve secondary effect
  if (effect.secondary_effect) {
    const secondaryResults = resolveEffect(
      state, effect.secondary_effect, sourcePlayer, sourceCreature
    );
    results.push(...secondaryResults);
  }

  return results;
}

/** Find which player owns a creature */
function findCreatureOwner(state: GameState, creature: BattleCreature): BattlePlayer | null {
  for (const c of state.player_1.board) {
    if (c && c.instance_id === creature.instance_id) return state.player_1;
  }
  for (const c of state.player_2.board) {
    if (c && c.instance_id === creature.instance_id) return state.player_2;
  }
  return null;
}

/** Evaluate a condition for an effect */
function evaluateCondition(
  condition: { type: string; value?: number; keyword?: Keyword; event_type?: string },
  sourcePlayer: BattlePlayer,
  sourceCreature?: BattleCreature
): boolean {
  switch (condition.type) {
    case 'NONE':
      return true;
    case 'CREATURE_COUNT_GTE': {
      const count = getAliveCreatures(sourcePlayer).length;
      return count >= (condition.value ?? 0);
    }
    case 'HEALTH_BELOW':
      return sourcePlayer.current_hp < (condition.value ?? 0);
    case 'BOARD_FULL':
      return getAliveCreatures(sourcePlayer).length >= 5;
    case 'LAST_EVENT_WAS':
      return sourcePlayer.last_event_type === condition.event_type;
    case 'TARGET_AT_FULL_HP':
      return sourceCreature ? sourceCreature.health >= sourceCreature.max_health : false;
    case 'HAS_KEYWORD':
      return sourceCreature && condition.keyword
        ? sourceCreature.active_keywords.includes(condition.keyword)
        : false;
    default:
      return true;
  }
}

/** Generate a human-readable description of an effect */
function describeEffect(effect: Effect, targetIds: string[]): string {
  const val = effect.value ?? 0;
  switch (effect.effect_type) {
    case 'STAT_MODIFY_ATTACK':
      return `${val >= 0 ? '+' : ''}${val} ATK to ${targetIds.length} target(s)`;
    case 'STAT_MODIFY_HEALTH':
      return `${val >= 0 ? '+' : ''}${val} HP to ${targetIds.length} target(s)`;
    case 'DAMAGE':
      return `Deal ${val} damage to ${targetIds.length} target(s)`;
    case 'HEAL':
      return `Heal ${val} HP to ${targetIds.length} target(s)`;
    case 'HEAL_PLAYER':
      return `Heal player for ${val} HP`;
    case 'DRAW_CARD':
      return `Draw ${val} card(s)`;
    case 'GAIN_MANA':
      return `Gain ${val} mana`;
    case 'GRANT_KEYWORD':
      return `Grant ${effect.keyword} to ${targetIds.length} target(s)`;
    case 'REMOVE_KEYWORD':
      return `Remove ${effect.keyword} from ${targetIds.length} target(s)`;
    case 'DESTROY_CREATURE':
      return `Destroy ${targetIds.length} creature(s)`;
    default:
      return `Effect: ${effect.effect_type}`;
  }
}

/**
 * Fire triggered abilities on a creature for a specific trigger type.
 */
export function resolveTriggeredAbilities(
  state: GameState,
  creature: BattleCreature,
  triggerType: TriggerType,
  owner: BattlePlayer
): EffectResult[] {
  const results: EffectResult[] = [];

  for (const ability of creature.triggered_abilities) {
    if (ability.trigger === triggerType) {
      const effectResults = resolveEffect(state, ability.effect, owner, creature);
      results.push(...effectResults);
    }
  }

  return results;
}

/**
 * Process deaths on a player's board: mark dead, remove from board, fire ON_DEATH abilities.
 */
export function processDeaths(state: GameState, player: BattlePlayer): void {
  for (let slot = 0; slot < player.board.length; slot++) {
    const creature = player.board[slot];
    if (creature && creature.health <= 0 && creature.is_alive) {
      creature.is_alive = false;
    }
  }

  // Collect dead creatures (sorted by slot for deterministic ordering)
  const dead: { creature: BattleCreature; slot: number }[] = [];
  for (let slot = 0; slot < player.board.length; slot++) {
    const creature = player.board[slot];
    if (creature && !creature.is_alive) {
      dead.push({ creature, slot });
      player.board[slot] = null;
      player.graveyard.push(creature);
    }
  }

  // Fire ON_DEATH abilities left-to-right
  for (const { creature } of dead) {
    resolveTriggeredAbilities(state, creature, 'ON_DEATH', player);
  }
}

/**
 * Expire temporary buffs at end of turn.
 */
export function expireTempBuffs(player: BattlePlayer): void {
  for (const creature of player.board) {
    if (!creature || !creature.is_alive) continue;

    const expiring = creature.temp_buffs.filter(b => b.expires_at === 'END_OF_TURN');

    for (const buff of expiring) {
      // Reverse the effect
      switch (buff.effect.effect_type) {
        case 'STAT_MODIFY_ATTACK':
          if (buff.effect.value !== undefined) {
            creature.attack -= buff.effect.value;
          }
          break;
        case 'STAT_MODIFY_HEALTH':
          if (buff.effect.value !== undefined) {
            creature.max_health -= buff.effect.value;
            creature.health = Math.min(creature.health, creature.max_health);
          }
          break;
        case 'GRANT_KEYWORD':
          if (buff.effect.keyword) {
            // Only remove if it was temporary (not innate or from permanent sources)
            creature.active_keywords = creature.active_keywords.filter(
              k => k !== buff.effect.keyword
            );
            if (buff.effect.keyword === 'SHIELD') {
              creature.shield_active = false;
            }
          }
          break;
        default:
          break;
      }
    }

    creature.temp_buffs = creature.temp_buffs.filter(b => b.expires_at !== 'END_OF_TURN');
  }
}

/**
 * Recalculate all creature stats based on modifiers and attunement state.
 * Called after every chaos roll.
 */
export function recalculateAllCreatureStats(player: BattlePlayer): void {
  for (const creature of player.board) {
    if (!creature || !creature.is_alive) continue;

    // Start from base stats
    let atk = creature.base_attack ?? 0;
    let hp = creature.base_health ?? 0;
    const keywords = new Set<Keyword>(creature.innate_keywords);

    // Apply modifier base effects
    for (const modifier of creature.modifiers) {
      // Base effect (always on)
      applyStatEffect(modifier.base_effect, { atk: 0, hp: 0 }, (d) => {
        atk += d.atk;
        hp += d.hp;
      });

      // Attuned bonus
      if (modifier.is_attuned_active) {
        applyStatEffect(modifier.attuned_effect, { atk: 0, hp: 0 }, (d) => {
          atk += d.atk;
          hp += d.hp;
        });
      }

      // Penalty
      if (modifier.is_penalty_active && modifier.penalty_effect) {
        applyStatEffect(modifier.penalty_effect, { atk: 0, hp: 0 }, (d) => {
          atk += d.atk;
          hp += d.hp;
        });
      }

      // Keywords from modifiers
      if (modifier.grants_keyword) {
        if (!modifier.keyword_is_attuned || modifier.is_attuned_active) {
          keywords.add(modifier.grants_keyword);
        }
      }
    }

    // Apply temp buffs
    for (const buff of creature.temp_buffs) {
      if (buff.effect.effect_type === 'STAT_MODIFY_ATTACK' && buff.effect.value) {
        atk += buff.effect.value;
      }
      if (buff.effect.effect_type === 'STAT_MODIFY_HEALTH' && buff.effect.value) {
        hp += buff.effect.value;
      }
      if (buff.effect.effect_type === 'GRANT_KEYWORD' && buff.effect.keyword) {
        keywords.add(buff.effect.keyword);
      }
    }

    creature.attack = Math.max(0, atk);
    creature.max_health = Math.max(1, hp);
    creature.health = Math.min(creature.health, creature.max_health);
    creature.active_keywords = Array.from(keywords);
    creature.shield_active = keywords.has('SHIELD') && creature.shield_active;
  }
}

/** Helper: apply a stat-modifying effect to get delta values */
function applyStatEffect(
  effect: Effect,
  _base: { atk: number; hp: number },
  apply: (delta: { atk: number; hp: number }) => void
): void {
  if (effect.effect_type === 'STAT_MODIFY_ATTACK' && effect.value !== undefined) {
    apply({ atk: effect.value, hp: 0 });
  }
  if (effect.effect_type === 'STAT_MODIFY_HEALTH' && effect.value !== undefined) {
    apply({ atk: 0, hp: effect.value });
  }
}

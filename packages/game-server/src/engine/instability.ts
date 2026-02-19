// Chaos Creatures Game Server — Instability Calculator
// Source: docs/design/01-battle-mechanics.md Section 2

import type { BattleCreature, BattlePlayer } from '../types/game-state';
import { INSTABILITY_MIN, INSTABILITY_MAX, CREATURE_INSTABILITY_MIN } from './constants';

/**
 * Calculate a single creature's instability contribution.
 *
 * creature_instability = template.base_instability
 *   + sum(evolution_step_instability_change)   -- baked into instability_value on card
 *   + sum(modifier_instability_adjustments)    -- some are attunement-gated
 *
 * Clamped to minimum 0.
 */
export function calculateCreatureInstability(creature: BattleCreature): number {
  // Start from the card's stored instability_value which includes base + evolution changes
  // For runtime, we already have this on the BattleCreature, but we also need to add
  // modifier adjustments based on current attunement state.
  let instability = creature.base_instability;

  // Add modifier instability adjustments
  for (const modifier of creature.modifiers) {
    if (modifier.instability_is_attuned) {
      // Only apply if attunement is active
      if (modifier.is_attuned_active) {
        instability += modifier.instability_adjustment;
      }
    } else {
      // Always-on instability adjustment
      instability += modifier.instability_adjustment;
    }
  }

  return Math.max(CREATURE_INSTABILITY_MIN, instability);
}

/** Type guard: check if a board entity is a BattleCreature (has attack property) */
function isCreatureEntity(entity: unknown): entity is BattleCreature {
  return entity !== null && typeof entity === 'object' && 'attack' in (entity as any) && 'instability_value' in (entity as any);
}

/**
 * Calculate a player's total instability.
 *
 * player_instability = avatar_instability_modifier
 *   + sum(creature_instability for each creature on board)
 *   + sum(ruin base_instability for each ruin on board)
 *
 * Clamped to [1, 20] (D20 range).
 */
export function calculatePlayerInstability(player: BattlePlayer): number {
  let total = player.avatar_instability_modifier;

  for (const entity of player.board) {
    if (!entity || !entity.is_alive) continue;

    if (isCreatureEntity(entity)) {
      total += calculateCreatureInstability(entity);
    } else {
      // Ruins contribute their base_instability directly (no modifiers)
      total += entity.base_instability;
    }
  }

  return Math.max(INSTABILITY_MIN, Math.min(INSTABILITY_MAX, total));
}

/**
 * Recalculate and update a player's instability in place.
 * Also updates each creature's instability_value.
 */
export function recalculateInstability(player: BattlePlayer): number {
  // Update each creature's instability value
  for (const entity of player.board) {
    if (!entity || !entity.is_alive) continue;

    if (isCreatureEntity(entity)) {
      entity.instability_value = calculateCreatureInstability(entity);
    }
  }

  const newInstability = calculatePlayerInstability(player);
  player.instability = newInstability;
  return newInstability;
}

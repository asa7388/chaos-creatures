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

/**
 * Calculate a player's total instability.
 *
 * player_instability = avatar_instability_modifier
 *   + sum(creature_instability for each creature on board)
 *
 * Clamped to [1, 20] (D20 range).
 */
export function calculatePlayerInstability(player: BattlePlayer): number {
  let total = player.avatar_instability_modifier;

  for (const creature of player.board) {
    if (creature && creature.is_alive) {
      total += calculateCreatureInstability(creature);
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
  for (const creature of player.board) {
    if (creature && creature.is_alive) {
      creature.instability_value = calculateCreatureInstability(creature);
    }
  }

  const newInstability = calculatePlayerInstability(player);
  player.instability = newInstability;
  return newInstability;
}

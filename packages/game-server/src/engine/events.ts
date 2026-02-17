// Chaos Creatures Game Server — Event System
// 8 Order events + 8 Chaos events from docs/design/01-battle-mechanics.md Sections 8-9

import type { EventDefinition, GameState, BattlePlayer, EffectResult, EventResolutionResult, TriggerResult } from '../types/game-state';
import type { EventType } from '../types/enums';
import { resolveEffect, resolveTriggeredAbilities, processDeaths } from './effects';
import { recalculateInstability } from './instability';
import { SeededRNG } from './rng';
import { EVENT_POOL_SIZE } from './constants';

// ═══════════════════════════════════════════════════
// ORDER EVENTS (O1-O8)
// ═══════════════════════════════════════════════════

const ORDER_EVENTS: EventDefinition[] = [
  {
    id: 'O1',
    name: 'Mending Light',
    event_type: 'ORDER',
    effect: {
      effect_type: 'HEAL',
      target: 'LOWEST_HP_FRIENDLY',
      value: 3,
    },
    description: 'Heal your most damaged creature for 3 HP.',
    design_notes: 'Reliable sustain. Keeps your key creature alive.',
    can_backfire: false,
  },
  {
    id: 'O2',
    name: 'Planar Ward',
    event_type: 'ORDER',
    effect: {
      effect_type: 'GRANT_KEYWORD',
      target: 'FRIENDLY_CREATURE',
      keyword: 'SHIELD',
      duration: 'PERMANENT',
    },
    description: 'Grant Shield to a friendly creature of your choice that does not already have Shield.',
    design_notes: 'Player agency — protect your best creature.',
    can_backfire: false,
  },
  {
    id: 'O3',
    name: 'Steady Growth',
    event_type: 'ORDER',
    effect: {
      effect_type: 'STAT_MODIFY_HEALTH',
      target: 'ALL_FRIENDLY',
      value: 1,
      duration: 'PERMANENT',
    },
    description: 'All your creatures get +0/+1 permanently.',
    design_notes: 'Compounds fast on wide boards.',
    can_backfire: false,
  },
  {
    id: 'O4',
    name: 'Clarity',
    event_type: 'ORDER',
    effect: {
      effect_type: 'DRAW_CARD',
      target: 'PLAYER_SELF',
      value: 1,
    },
    description: 'Draw 1 card.',
    design_notes: 'Simple card advantage.',
    can_backfire: false,
  },
  {
    id: 'O5',
    name: 'Fortify',
    event_type: 'ORDER',
    effect: {
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
    },
    description: 'A friendly creature of your choice gets +1/+1 permanently.',
    design_notes: 'Player chooses target — versatile.',
    can_backfire: false,
  },
  {
    id: 'O6',
    name: 'Sanctuary',
    event_type: 'ORDER',
    effect: {
      effect_type: 'HEAL_PLAYER',
      target: 'PLAYER_SELF',
      value: 3,
    },
    description: 'Heal your avatar for 3 HP.',
    design_notes: 'Face healing. Extends the game.',
    can_backfire: false,
  },
  {
    id: 'O7',
    name: 'Bulwark',
    event_type: 'ORDER',
    effect: {
      effect_type: 'STAT_MODIFY_HEALTH',
      target: 'LOWEST_HP_FRIENDLY',
      value: 2,
      duration: 'PERMANENT',
    },
    description: 'Your creature with the lowest current HP gets +0/+2 permanently.',
    design_notes: 'Shores up your weakest link.',
    can_backfire: false,
  },
  {
    id: 'O8',
    name: 'Harmonize',
    event_type: 'ORDER',
    effect: {
      effect_type: 'HEAL',
      target: 'ALL_FRIENDLY',
      value: 2,
    },
    description: 'All your creatures heal 2 HP. Creatures at full HP get +0/+1 permanently instead.',
    design_notes: 'Board-wide sustain.',
    can_backfire: false,
  },
];

// ═══════════════════════════════════════════════════
// CHAOS EVENTS (C1-C8)
// ═══════════════════════════════════════════════════

const CHAOS_EVENTS: EventDefinition[] = [
  {
    id: 'C1',
    name: 'Surge',
    event_type: 'CHAOS',
    effect: {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'RANDOM_FRIENDLY',
      value: 3,
      duration: 'THIS_TURN',
    },
    description: 'A random friendly creature gets +3 ATK this turn.',
    design_notes: 'Pure burst. Temporary.',
    can_backfire: false,
  },
  {
    id: 'C2',
    name: 'Wildfire',
    event_type: 'CHAOS',
    effect: {
      effect_type: 'DAMAGE',
      target: 'RANDOM_ENEMY',
      value: 2,
    },
    description: 'Deal 2 damage to a random enemy creature.',
    design_notes: 'Targeted removal with randomness.',
    can_backfire: false,
  },
  {
    id: 'C3',
    name: 'Upheaval',
    event_type: 'CHAOS',
    effect: {
      effect_type: 'DAMAGE',
      target: 'ALL_CREATURES',
      value: 1,
    },
    description: 'Deal 1 damage to ALL creatures on the board (both sides).',
    design_notes: 'Board-wide damage. Can backfire.',
    can_backfire: true,
  },
  {
    id: 'C4',
    name: 'Frenzy',
    event_type: 'CHAOS',
    effect: {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'ALL_FRIENDLY',
      value: 1,
      duration: 'THIS_TURN',
    },
    description: 'ALL your creatures get +1 ATK this turn.',
    design_notes: 'Board-wide aggression. Temporary.',
    can_backfire: false,
  },
  {
    id: 'C5',
    name: 'Rift Bolt',
    event_type: 'CHAOS',
    effect: {
      effect_type: 'DAMAGE',
      target: 'PLAYER_OPPONENT',
      value: 3,
    },
    description: 'Deal 3 damage to the enemy avatar.',
    design_notes: 'Direct face damage.',
    can_backfire: false,
  },
  {
    id: 'C6',
    name: 'Chaos Siphon',
    event_type: 'CHAOS',
    effect: {
      effect_type: 'DAMAGE',
      target: 'RANDOM_FRIENDLY',
      value: 2,
      // secondary_effect intentionally removed — handled in resolveEventPhase
      // to ensure same creature gets both damage and buff
    },
    description: 'Deal 2 damage to a random friendly creature. That creature gets +3 ATK permanently. If the damage kills it, the buff is wasted.',
    design_notes: 'High risk, high reward.',
    can_backfire: true,
  },
  {
    id: 'C7',
    name: 'Maelstrom',
    event_type: 'CHAOS',
    effect: {
      effect_type: 'DAMAGE',
      target: 'RANDOM_ANY',
      value: 3,
    },
    description: 'Deal 3 damage to a random creature on the board (either side).',
    design_notes: 'Most volatile event.',
    can_backfire: true,
  },
  {
    id: 'C8',
    name: 'Overcharge',
    event_type: 'CHAOS',
    effect: {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'RANDOM_FRIENDLY',
      value: 2,
      duration: 'THIS_TURN',
      secondary_effect: {
        effect_type: 'GRANT_KEYWORD',
        target: 'RANDOM_FRIENDLY',
        keyword: 'PIERCING',
        duration: 'THIS_TURN',
      },
    },
    description: 'A random friendly creature gains +2 ATK and Piercing this turn. If it already has Piercing, it gets +4 ATK instead.',
    design_notes: 'Keyword grant + burst.',
    can_backfire: false,
  },
];

/** Get the event pool for a given event type */
export function getEventPool(eventType: EventType): EventDefinition[] {
  return eventType === 'ORDER' ? ORDER_EVENTS : CHAOS_EVENTS;
}

/** Get a specific event by ID */
export function getEventById(id: string): EventDefinition | undefined {
  return [...ORDER_EVENTS, ...CHAOS_EVENTS].find(e => e.id === id);
}

/** Get all event definitions */
export function getAllEvents(): EventDefinition[] {
  return [...ORDER_EVENTS, ...CHAOS_EVENTS];
}

/**
 * Select a random event from the pool and resolve it.
 * Returns null if no event fired (NOTHING result).
 */
export function resolveEventPhase(
  state: GameState,
  eventType: EventType
): EventResolutionResult | null {
  const activePlayer = getActivePlayer(state);
  const pool = getEventPool(eventType);

  // Select random event (equal weight, 12.5% each)
  const rng = SeededRNG.fromState(state.rng_seed, state.rng_counter);
  const eventIndex = rng.nextInt(0, EVENT_POOL_SIZE - 1);
  state.rng_counter = rng.getCounter();

  const selectedEvent = pool[eventIndex];
  state.last_roll_event_id = selectedEvent.id;

  // Snapshot full-HP creature IDs BEFORE resolving effects (needed for O8 Harmonize)
  const fullHpCreatureIds = new Set<string>();
  if (selectedEvent.id === 'O8') {
    for (const creature of activePlayer.board) {
      if (creature && creature.is_alive && creature.health >= creature.max_health) {
        fullHpCreatureIds.add(creature.instance_id);
      }
    }
  }

  // Resolve event effect
  const effectResults = resolveEffect(state, selectedEvent.effect, activePlayer);

  // Handle Chaos Siphon (C6) special case: same creature gets damage + ATK buff
  if (selectedEvent.id === 'C6') {
    // The damage was already applied to a random friendly via resolveEffect.
    // Now apply the +3 ATK buff to the SAME creature (identified from effectResults).
    if (effectResults.length > 0 && effectResults[0].target_ids.length > 0) {
      const targetId = effectResults[0].target_ids[0];
      // Find the creature that was damaged
      const targetCreature = activePlayer.board.find(
        c => c && c.instance_id === targetId
      );
      // Only buff if the creature survived the damage
      if (targetCreature && targetCreature.is_alive) {
        targetCreature.attack += 3;
        effectResults.push({
          effect_type: 'STAT_MODIFY_ATTACK',
          target_ids: [targetId],
          value: 3,
          description: '+3 ATK to the siphoned creature',
        });
      }
    }
  }

  // Handle Harmonize (O8) special case: creatures that were at full HP BEFORE
  // the heal get +0/+1 permanent instead. Uses pre-heal snapshot to avoid
  // wrongly buffing creatures that were healed up to full by the event.
  if (selectedEvent.id === 'O8') {
    for (const creature of activePlayer.board) {
      if (creature && creature.is_alive && fullHpCreatureIds.has(creature.instance_id)) {
        // This creature was at full HP before the heal — give +0/+1 permanent
        creature.max_health += 1;
        creature.health = creature.max_health;
        effectResults.push({
          effect_type: 'STAT_MODIFY_HEALTH',
          target_ids: [creature.instance_id],
          value: 1,
          description: '+0/+1 permanent (was at full HP)',
        });
      }
    }
  }

  // Handle Overcharge (C8) special case: if already has Piercing, +4 ATK instead of +2 ATK + Piercing
  if (selectedEvent.id === 'C8') {
    // The base effect already applied +2 ATK and Piercing to a random friendly.
    // Check if the targeted creature already had Piercing BEFORE the event.
    // If so, we need to give +4 ATK total instead of +2 ATK + Piercing.
    if (effectResults.length > 0 && effectResults[0].target_ids.length > 0) {
      const targetId = effectResults[0].target_ids[0];
      const targetCreature = activePlayer.board.find(
        c => c && c.instance_id === targetId
      );
      if (targetCreature && targetCreature.is_alive) {
        // Check if Piercing appeared in innate_keywords (had it before the event)
        const hadPiercingBefore = targetCreature.innate_keywords.includes('PIERCING') ||
          targetCreature.modifiers.some(m =>
            m.grants_keyword === 'PIERCING' &&
            (!m.keyword_is_attuned || m.is_attuned_active)
          );

        if (hadPiercingBefore) {
          // Already had Piercing: give additional +2 ATK (total +4)
          targetCreature.attack += 2;
          effectResults.push({
            effect_type: 'STAT_MODIFY_ATTACK',
            target_ids: [targetId],
            value: 2,
            description: '+2 bonus ATK (already had Piercing)',
          });
          // Add the +2 to temp_buffs so it expires at end of turn
          targetCreature.temp_buffs.push({
            effect: { effect_type: 'STAT_MODIFY_ATTACK', target: 'SELF', value: 2, duration: 'THIS_TURN' },
            expires_at: 'END_OF_TURN',
            source: 'C8_PIERCING_BONUS',
          });
        }
      }
    }
  }

  // Fire triggered abilities (ON_ORDER or ON_CHAOS) left-to-right (slot 0->4)
  const triggerType = eventType === 'ORDER' ? 'ON_ORDER' as const : 'ON_CHAOS' as const;
  const triggerResults: TriggerResult[] = [];

  for (let slot = 0; slot < 5; slot++) {
    const creature = activePlayer.board[slot];
    if (!creature || !creature.is_alive) continue;

    const abilityResults = resolveTriggeredAbilities(state, creature, triggerType, activePlayer);
    if (abilityResults.length > 0) {
      triggerResults.push({
        creature_id: creature.instance_id,
        ability_name: creature.triggered_abilities
          .filter(a => a.trigger === triggerType)
          .map(a => a.name)
          .join(', '),
        effect_results: abilityResults,
      });
    }
  }

  // Process deaths from event/ability effects
  processDeaths(state, activePlayer);
  const opponent = getDefendingPlayer(state);
  processDeaths(state, opponent);

  // Recalculate instability
  recalculateInstability(activePlayer);
  recalculateInstability(opponent);

  return {
    event: selectedEvent,
    event_effect_results: effectResults,
    trigger_results: triggerResults,
  };
}

/**
 * Peek at which event would fire next without resolving it.
 * Uses the same RNG logic as resolveEventPhase to determine the event,
 * then advances the RNG counter so the same result isn't re-rolled.
 */
export function peekNextEvent(
  state: GameState,
  eventType: EventType
): string | null {
  const pool = getEventPool(eventType);
  const rng = SeededRNG.fromState(state.rng_seed, state.rng_counter);
  const eventIndex = rng.nextInt(0, EVENT_POOL_SIZE - 1);
  state.rng_counter = rng.getCounter();

  const selectedEvent = pool[eventIndex];
  state.last_roll_event_id = selectedEvent.id;
  return selectedEvent.id;
}

/**
 * Resolve a pending event that required player choice.
 * The player has chosen a target creature — apply the event's effect to that target.
 */
export function resolveEventWithTarget(
  state: GameState,
  eventId: string,
  targetCreatureId: string
): EventResolutionResult | null {
  const eventDef = getEventById(eventId);
  if (!eventDef) return null;

  state.phase = 'EVENT_RESOLUTION';
  const activePlayer = getActivePlayer(state);

  // Find the chosen target creature on the active player's board
  const targetCreature = activePlayer.board.find(
    c => c && c.is_alive && c.instance_id === targetCreatureId
  );
  if (!targetCreature) return null;

  // Resolve the event's effect with the specific target
  const effectResults = resolveEffect(state, eventDef.effect, activePlayer, undefined, targetCreature);

  // If O5 Fortify has secondary_effect, apply it to the same target
  if (eventDef.effect.secondary_effect) {
    const secondaryResults = resolveEffect(
      state, eventDef.effect.secondary_effect, activePlayer, undefined, targetCreature
    );
    effectResults.push(...secondaryResults);
  }

  // Fire triggered abilities (ON_ORDER or ON_CHAOS)
  const triggerType = eventDef.event_type === 'ORDER' ? 'ON_ORDER' as const : 'ON_CHAOS' as const;
  const triggerResults: TriggerResult[] = [];

  for (let slot = 0; slot < 5; slot++) {
    const creature = activePlayer.board[slot];
    if (!creature || !creature.is_alive) continue;

    const abilityResults = resolveTriggeredAbilities(state, creature, triggerType, activePlayer);
    if (abilityResults.length > 0) {
      triggerResults.push({
        creature_id: creature.instance_id,
        ability_name: creature.triggered_abilities
          .filter(a => a.trigger === triggerType)
          .map(a => a.name)
          .join(', '),
        effect_results: abilityResults,
      });
    }
  }

  // Process deaths
  processDeaths(state, activePlayer);
  const opponent = getDefendingPlayer(state);
  processDeaths(state, opponent);

  // Recalculate instability
  recalculateInstability(activePlayer);
  recalculateInstability(opponent);

  // Clear pending event
  state.pending_event_id = undefined;

  return {
    event: eventDef,
    event_effect_results: effectResults,
    trigger_results: triggerResults,
  };
}

/** Does the event require a player choice for targeting? */
export function eventRequiresChoice(eventId: string): boolean {
  // O2 (Planar Ward) and O5 (Fortify) require player choice
  return eventId === 'O2' || eventId === 'O5';
}

/** Get valid targets for an event that requires player choice */
export function getValidEventTargets(
  state: GameState,
  eventId: string
): string[] {
  const activePlayer = getActivePlayer(state);
  const validTargets: string[] = [];

  if (eventId === 'O2') {
    // Planar Ward: friendly creature without Shield
    for (const creature of activePlayer.board) {
      if (creature && creature.is_alive && !creature.shield_active) {
        validTargets.push(creature.instance_id);
      }
    }
  } else if (eventId === 'O5') {
    // Fortify: any friendly creature
    for (const creature of activePlayer.board) {
      if (creature && creature.is_alive) {
        validTargets.push(creature.instance_id);
      }
    }
  }

  return validTargets;
}

// Helper functions

function getActivePlayer(state: GameState): BattlePlayer {
  return state.active_player === 'PLAYER_1' ? state.player_1 : state.player_2;
}

function getDefendingPlayer(state: GameState): BattlePlayer {
  return state.active_player === 'PLAYER_1' ? state.player_2 : state.player_1;
}

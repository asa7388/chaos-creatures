// Chaos Creatures Game Server — Turn Engine
// 9-phase turn loop from docs/design/01-battle-mechanics.md Section 3

import type {
  GameState,
  BattlePlayer,
  BattleCreature,
  BattleCard,
  ChaosRollResult,
  EventResolutionResult,
  CombatResult,
  EffectResult,
} from '../types/game-state';
import type { PlayerSide, TurnPhase } from '../types/enums';
import {
  STARTING_HP,
  MAX_HP,
  MAX_MANA,
  MAX_BOARD_SLOTS,
  D20_MIN,
  D20_MAX,
} from './constants';
import { SeededRNG } from './rng';
import { recalculateInstability } from './instability';
import {
  resolveTriggeredAbilities,
  processDeaths,
  expireTempBuffs,
  recalculateAllCreatureStats,
  resolveEffect,
  applyDamageToCreature,
} from './effects';
import { resolveEventPhase, eventRequiresChoice, getValidEventTargets } from './events';
import { resolveCombat, validateDeclareAttackers, validateBlockerAssignments } from './combat';

// ─── Helpers ─────────────

function getActivePlayer(state: GameState): BattlePlayer {
  return state.active_player === 'PLAYER_1' ? state.player_1 : state.player_2;
}

function getDefendingPlayer(state: GameState): BattlePlayer {
  return state.active_player === 'PLAYER_1' ? state.player_2 : state.player_1;
}

function findOnBoard(player: BattlePlayer, creatureId: string): BattleCreature | null {
  for (const creature of player.board) {
    if (creature && creature.instance_id === creatureId) {
      return creature;
    }
  }
  return null;
}

// ─── Phase 1: Start of Turn ─────────────

export interface StartOfTurnResult {
  turn: number;
  active_player: PlayerSide;
  corruption_damage: Array<{ creature_id: string; damage: number }>;
  deaths: string[];
  instability: number;
}

export function resolveStartOfTurn(state: GameState): StartOfTurnResult {
  state.current_turn += 1;
  state.phase = 'START_OF_TURN';

  const activePlayer = getActivePlayer(state);
  const corruptionDamage: Array<{ creature_id: string; damage: number }> = [];
  const deaths: string[] = [];

  // Fire start-of-turn effects left-to-right (slot 0 -> slot 4)
  for (let slot = 0; slot < MAX_BOARD_SLOTS; slot++) {
    const creature = activePlayer.board[slot];
    if (!creature || !creature.is_alive) continue;

    // Corruption self-damage from modifiers
    for (const modifier of creature.modifiers) {
      if (
        modifier.base_effect.effect_type === 'DAMAGE' &&
        modifier.base_effect.target === 'SELF' &&
        modifier.base_effect.value !== undefined
      ) {
        const damage = modifier.base_effect.value;
        applyDamageToCreature(state, creature, damage, activePlayer);
        corruptionDamage.push({ creature_id: creature.instance_id, damage });
      }
    }
  }

  // Check deaths from start-of-turn effects
  processDeaths(state, activePlayer);
  for (const creature of activePlayer.graveyard) {
    if (!deaths.includes(creature.instance_id)) {
      deaths.push(creature.instance_id);
    }
  }

  // Recalculate instability after any board changes
  const instability = recalculateInstability(activePlayer);

  return {
    turn: state.current_turn,
    active_player: state.active_player,
    corruption_damage: corruptionDamage,
    deaths,
    instability,
  };
}

// ─── Phase 2: Chaos Roll ─────────────

export function resolveChaosRoll(state: GameState): ChaosRollResult {
  state.phase = 'CHAOS_ROLL';

  const activePlayer = getActivePlayer(state);
  const rng = SeededRNG.fromState(state.rng_seed, state.rng_counter);
  const roll = rng.nextInt(D20_MIN, D20_MAX);
  state.rng_counter = rng.getCounter();

  state.last_roll_value = roll;

  let result: 'ORDER' | 'CHAOS' | 'NOTHING';
  if (roll < activePlayer.instability) {
    result = 'CHAOS';
  } else if (roll > activePlayer.instability) {
    result = 'ORDER';
  } else {
    result = 'NOTHING';
    state.last_roll_event = null;
    return { roll, result, instability: activePlayer.instability };
  }

  state.last_roll_event = result;
  activePlayer.last_event_type = result;

  // Update attunement state on all active player's creatures
  for (const creature of activePlayer.board) {
    if (!creature || !creature.is_alive) continue;
    for (const modifier of creature.modifiers) {
      modifier.is_attuned_active = modifier.attunement === result;
      modifier.is_penalty_active = modifier.has_penalty && modifier.attunement !== result;
    }
  }

  // Recalculate creature stats based on new attunement state
  recalculateAllCreatureStats(activePlayer);

  // Recalculate instability if modifier instability adjustments changed
  recalculateInstability(activePlayer);

  return { roll, result, instability: activePlayer.instability };
}

// ─── Phase 3: Event Resolution ─────────────

export function resolveEventResolution(state: GameState): EventResolutionResult | null {
  if (!state.last_roll_event || state.last_roll_event === 'NOTHING') {
    return null;
  }

  state.phase = 'EVENT_RESOLUTION';
  return resolveEventPhase(state, state.last_roll_event);
}

// ─── Phase 4: Draw & Gain Mana ─────────────

export interface DrawAndManaResult {
  drawn_card: BattleCard | null;
  current_mana: number;
  cards_in_deck: number;
}

export function resolveDrawAndMana(state: GameState): DrawAndManaResult {
  state.phase = 'DRAW_AND_MANA';

  const activePlayer = getActivePlayer(state);
  let drawnCard: BattleCard | null = null;

  // Draw 1 card (if deck is not empty)
  if (activePlayer.deck.length > 0) {
    drawnCard = activePlayer.deck.shift()!;
    activePlayer.hand.push(drawnCard);
  }

  // Gain 1 chaos mote (up to cap)
  if (activePlayer.current_mana < activePlayer.mana_cap) {
    activePlayer.current_mana += 1;
  }

  return {
    drawn_card: drawnCard,
    current_mana: activePlayer.current_mana,
    cards_in_deck: activePlayer.deck.length,
  };
}

// ─── Phase 5: Main Phase (handle individual actions) ─────────────

export interface PlayCardResult {
  card: BattleCard;
  slot?: number;
  creature?: BattleCreature;
  mana_remaining: number;
  effect_results: EffectResult[];
}

export function handlePlayCard(
  state: GameState,
  cardId: string,
  targetSlot?: number,
  targetId?: string
): PlayCardResult {
  if (state.phase !== 'MAIN_PHASE') {
    throw new GameError('WRONG_PHASE', 'Can only play cards during Main Phase');
  }

  const activePlayer = getActivePlayer(state);
  const cardIndex = activePlayer.hand.findIndex(c => c.instance_id === cardId);

  if (cardIndex === -1) {
    throw new GameError('CARD_NOT_IN_HAND', 'Card not in hand');
  }

  const card = activePlayer.hand[cardIndex];

  if (card.mana_cost > activePlayer.current_mana) {
    throw new GameError('NOT_ENOUGH_MANA', 'Not enough mana');
  }

  let creature: BattleCreature | undefined;
  const effectResults: EffectResult[] = [];

  if (card.card_type === 'CREATURE' || card.card_type === 'STABILIZER') {
    if (targetSlot === undefined) {
      throw new GameError('NO_SLOT', 'Must specify board slot');
    }
    if (targetSlot < 0 || targetSlot >= MAX_BOARD_SLOTS) {
      throw new GameError('INVALID_SLOT', `Slot must be 0-${MAX_BOARD_SLOTS - 1}`);
    }
    if (activePlayer.board[targetSlot] !== null) {
      throw new GameError('SLOT_OCCUPIED', 'Slot is occupied');
    }

    // Place on board
    creature = createBattleCreature(card, targetSlot);
    activePlayer.board[targetSlot] = creature;

    // Fire ON_PLAY triggered abilities
    for (const ability of creature.triggered_abilities) {
      if (ability.trigger === 'ON_PLAY') {
        const results = resolveEffect(state, ability.effect, activePlayer, creature);
        effectResults.push(...results);
      }
    }

    recalculateInstability(activePlayer);
  } else if (card.card_type === 'SPELL') {
    // Resolve spell immediately
    // If spell targets a specific creature, use targetId
    if (targetId) {
      const targetCreature = findTargetCreature(state, targetId);
      if (targetCreature) {
        // TODO: resolve spell with specific target
      }
    }

    activePlayer.graveyard.push(card);
  }

  // Deduct mana and remove from hand
  activePlayer.current_mana -= card.mana_cost;
  activePlayer.hand.splice(cardIndex, 1);

  return {
    card,
    slot: targetSlot,
    creature,
    mana_remaining: activePlayer.current_mana,
    effect_results: effectResults,
  };
}

/** Handle using the Chaos Spark (P2 only) */
export function handleUseChaosSparkAction(state: GameState): { mana_after: number } {
  if (state.phase !== 'MAIN_PHASE') {
    throw new GameError('WRONG_PHASE', 'Can only use Chaos Spark during Main Phase');
  }

  const activePlayer = getActivePlayer(state);

  if (!activePlayer.has_chaos_spark) {
    throw new GameError('NO_CHAOS_SPARK', 'No Chaos Spark available');
  }

  activePlayer.has_chaos_spark = false;
  activePlayer.current_mana = Math.min(activePlayer.current_mana + 1, activePlayer.mana_cap);

  return { mana_after: activePlayer.current_mana };
}

// ─── Phase 6: Declare Attackers ─────────────

export function handleDeclareAttackersAction(
  state: GameState,
  attackerIds: string[]
): { valid: boolean; error?: string } {
  state.phase = 'DECLARE_ATTACKERS';

  const validation = validateDeclareAttackers(state, attackerIds);
  if (!validation.valid) {
    return validation;
  }

  const activePlayer = getActivePlayer(state);

  // Fire ON_ATTACK triggered abilities
  for (const id of attackerIds) {
    const creature = findOnBoard(activePlayer, id);
    if (creature) {
      resolveTriggeredAbilities(state, creature, 'ON_ATTACK', activePlayer);
      creature.has_attacked = true;
    }
  }

  state.declared_attackers = attackerIds;
  return { valid: true };
}

// ─── Phase 7: Assign Blockers ─────────────

export function handleAssignBlockersAction(
  state: GameState,
  assignments: Array<{ blocker_id: string; attacker_id: string }>
): { valid: boolean; error?: string } {
  state.phase = 'ASSIGN_BLOCKERS';

  const validation = validateBlockerAssignments(state, assignments);
  if (!validation.valid) {
    return validation;
  }

  const defendingPlayer = getDefendingPlayer(state);

  // Fire ON_BLOCK triggered abilities
  for (const assignment of assignments) {
    const blocker = findOnBoard(defendingPlayer, assignment.blocker_id);
    if (blocker) {
      resolveTriggeredAbilities(state, blocker, 'ON_BLOCK', defendingPlayer);
    }
  }

  state.blocker_assignments = assignments.map(a => ({
    blocker_creature_id: a.blocker_id,
    attacker_creature_id: a.attacker_id,
  }));

  return { valid: true };
}

// ─── Phase 8: Combat Resolution ─────────────

export function resolveCombatPhase(state: GameState): CombatResult {
  state.phase = 'COMBAT_RESOLUTION';
  return resolveCombat(state);
}

// ─── Phase 9: End of Turn ─────────────

export function resolveEndOfTurn(state: GameState): void {
  state.phase = 'END_TURN';

  const activePlayer = getActivePlayer(state);
  const defendingPlayer = getDefendingPlayer(state);

  // Expire "this turn" buffs on both players' boards
  expireTempBuffs(activePlayer);
  expireTempBuffs(defendingPlayer);

  // Reset has_attacked on all creatures
  for (const creature of activePlayer.board) {
    if (creature) creature.has_attacked = false;
  }
  for (const creature of defendingPlayer.board) {
    if (creature) creature.has_attacked = false;
  }

  // Clear combat state
  state.declared_attackers = [];
  state.blocker_assignments = [];

  // Check win condition
  if (state.winner) return;

  // Switch active player
  state.active_player = state.active_player === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
}

// ─── Full Turn Execution (automated phases) ─────────────

/**
 * Execute all automatic phases (1-4) of a turn.
 * Returns the state after automatic phases, ready for player decisions (Phase 5+).
 */
export function executeAutomaticPhases(state: GameState): {
  startOfTurn: StartOfTurnResult;
  chaosRoll: ChaosRollResult;
  event: EventResolutionResult | null;
  drawAndMana: DrawAndManaResult;
  requiresEventChoice: boolean;
  validEventTargets: string[];
} {
  // Phase 1: Start of Turn
  const startOfTurn = resolveStartOfTurn(state);

  // Check win condition after start-of-turn effects
  if (getActivePlayer(state).current_hp <= 0) {
    state.winner = getDefendingPlayer(state).side;
  }
  if (state.winner) {
    return {
      startOfTurn,
      chaosRoll: { roll: 0, result: 'NOTHING', instability: 0 },
      event: null,
      drawAndMana: { drawn_card: null, current_mana: 0, cards_in_deck: 0 },
      requiresEventChoice: false,
      validEventTargets: [],
    };
  }

  // Phase 2: Chaos Roll
  const chaosRoll = resolveChaosRoll(state);

  // Phase 3: Event Resolution
  let event: EventResolutionResult | null = null;
  let requiresEventChoice = false;
  let validEventTargets: string[] = [];

  if (chaosRoll.result !== 'NOTHING') {
    // Check if event needs player choice before resolving
    // For events that require choice (O2, O5), we'll need to pause
    // and wait for player input. For now, auto-resolve.
    event = resolveEventResolution(state);

    if (event && eventRequiresChoice(event.event.id)) {
      requiresEventChoice = true;
      validEventTargets = getValidEventTargets(state, event.event.id);
    }
  }

  // Check win condition after events
  if (getActivePlayer(state).current_hp <= 0 || getDefendingPlayer(state).current_hp <= 0) {
    const ap = getActivePlayer(state);
    const dp = getDefendingPlayer(state);
    if (dp.current_hp <= 0 && ap.current_hp <= 0) {
      state.winner = dp.side;
    } else if (dp.current_hp <= 0) {
      state.winner = ap.side;
    } else if (ap.current_hp <= 0) {
      state.winner = dp.side;
    }
  }
  if (state.winner) {
    return {
      startOfTurn,
      chaosRoll,
      event,
      drawAndMana: { drawn_card: null, current_mana: 0, cards_in_deck: 0 },
      requiresEventChoice: false,
      validEventTargets: [],
    };
  }

  // Phase 4: Draw & Gain Mana
  const drawAndMana = resolveDrawAndMana(state);

  // Transition to Main Phase
  state.phase = 'MAIN_PHASE';

  return {
    startOfTurn,
    chaosRoll,
    event,
    drawAndMana,
    requiresEventChoice,
    validEventTargets,
  };
}

// ─── Game Error ─────────────

export class GameError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'GameError';
  }
}

// ─── Helper: Create BattleCreature from BattleCard ─────────────

export function createBattleCreature(card: BattleCard, slot: number): BattleCreature {
  const keywords = [...card.innate_keywords];
  const hasShield = keywords.includes('SHIELD');

  // Add keywords from always-active modifiers
  for (const modifier of card.modifiers) {
    if (modifier.grants_keyword && !modifier.keyword_is_attuned) {
      if (!keywords.includes(modifier.grants_keyword)) {
        keywords.push(modifier.grants_keyword);
      }
    }
  }

  return {
    ...card,
    attack: card.base_attack ?? 0,
    health: card.base_health ?? 0,
    max_health: card.base_health ?? 0,
    has_attacked: false,
    is_alive: true,
    instability_value: card.base_instability,
    active_keywords: keywords,
    shield_active: hasShield,
    temp_buffs: [],
    board_slot: slot,
  };
}

/** Find a creature on either player's board */
function findTargetCreature(state: GameState, creatureId: string): BattleCreature | null {
  return findOnBoard(state.player_1, creatureId) || findOnBoard(state.player_2, creatureId);
}

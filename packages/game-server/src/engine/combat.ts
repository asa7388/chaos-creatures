// Chaos Creatures Game Server — Combat Resolution
// Full keyword priority algorithm from docs/design/01-battle-mechanics.md Phase 8
// Keyword priority: Shield absorb -> base damage -> Deathtouch check -> Piercing overflow -> Lifesteal heal

import type {
  GameState,
  BattleCreature,
  BattlePlayer,
  CombatPairResult,
  UnblockedResult,
  CombatResult,
} from '../types/game-state';
import type { PlayerSide, Keyword } from '../types/enums';
import { recalculateInstability } from './instability';
import { resolveTriggeredAbilities, processDeaths } from './effects';

/** Check if a creature has a specific keyword */
function hasKeyword(creature: BattleCreature, keyword: Keyword): boolean {
  return creature.active_keywords.includes(keyword);
}

/** Get active player from game state */
function getActivePlayer(state: GameState): BattlePlayer {
  return state.active_player === 'PLAYER_1' ? state.player_1 : state.player_2;
}

/** Get defending player from game state */
function getDefendingPlayer(state: GameState): BattlePlayer {
  return state.active_player === 'PLAYER_1' ? state.player_2 : state.player_1;
}

/** Find a creature on a player's board by instance_id */
function findOnBoard(player: BattlePlayer, creatureId: string): BattleCreature | null {
  for (const creature of player.board) {
    if (creature && creature.instance_id === creatureId) {
      return creature;
    }
  }
  return null;
}

/** Count creatures with Taunt that can legally block */
export function countTauntCreatures(player: BattlePlayer): number {
  let count = 0;
  for (const creature of player.board) {
    if (creature && creature.is_alive && hasKeyword(creature, 'TAUNT') && creature.card_type !== 'STABILIZER') {
      count++;
    }
  }
  return count;
}

/** Count creatures that can attack (not stabilizers, alive) */
export function countAttackableCreatures(player: BattlePlayer): number {
  let count = 0;
  for (const creature of player.board) {
    if (creature && creature.is_alive && creature.card_type !== 'STABILIZER') {
      count++;
    }
  }
  return count;
}

/**
 * Validate declare attackers action.
 * Enforces: Taunt forced-attack, P1 turn 1, stabilizers can't attack.
 */
export function validateDeclareAttackers(
  state: GameState,
  attackerIds: string[]
): { valid: boolean; error?: string } {
  const activePlayer = getActivePlayer(state);
  const defendingPlayer = getDefendingPlayer(state);

  // P1 Turn 1 restriction
  if (state.current_turn === 1 && state.active_player === state.first_player) {
    return { valid: false, error: 'P1 cannot attack on turn 1' };
  }

  // Validate each attacker exists and is legal
  for (const id of attackerIds) {
    const creature = findOnBoard(activePlayer, id);
    if (!creature || !creature.is_alive) {
      return { valid: false, error: `Invalid attacker: ${id}` };
    }
    if (creature.card_type === 'STABILIZER') {
      return { valid: false, error: 'Stabilizers cannot attack' };
    }
  }

  // No duplicate attackers
  const uniqueIds = new Set(attackerIds);
  if (uniqueIds.size !== attackerIds.length) {
    return { valid: false, error: 'Duplicate attacker IDs' };
  }

  // Validate Taunt forced-attack minimum
  const opponentTauntCount = countTauntCreatures(defendingPlayer);
  const attackableCount = countAttackableCreatures(activePlayer);
  const minAttackers = Math.min(opponentTauntCount, attackableCount);

  if (attackerIds.length < minAttackers) {
    return {
      valid: false,
      error: `Must attack with at least ${minAttackers} creature(s) due to Taunt`,
    };
  }

  return { valid: true };
}

/**
 * Validate blocker assignments.
 * Enforces: Flying/Reach rules, Taunt forced-block, no stabilizer blocks, each blocker/attacker used once.
 */
export function validateBlockerAssignments(
  state: GameState,
  assignments: Array<{ blocker_id: string; attacker_id: string }>
): { valid: boolean; error?: string } {
  const activePlayer = getActivePlayer(state);
  const defendingPlayer = getDefendingPlayer(state);

  const usedBlockers = new Set<string>();
  const usedAttackers = new Set<string>();

  for (const assignment of assignments) {
    const blocker = findOnBoard(defendingPlayer, assignment.blocker_id);
    const attacker = findOnBoard(activePlayer, assignment.attacker_id);

    if (!blocker || !blocker.is_alive) {
      return { valid: false, error: `Invalid blocker: ${assignment.blocker_id}` };
    }
    if (!attacker || !state.declared_attackers.includes(attacker.instance_id)) {
      return { valid: false, error: `Invalid attacker target: ${assignment.attacker_id}` };
    }
    if (blocker.card_type === 'STABILIZER') {
      return { valid: false, error: 'Stabilizers cannot block' };
    }
    if (usedBlockers.has(blocker.instance_id)) {
      return { valid: false, error: `Blocker already assigned: ${assignment.blocker_id}` };
    }
    if (usedAttackers.has(attacker.instance_id)) {
      return { valid: false, error: `Attacker already blocked: ${assignment.attacker_id}` };
    }

    // Flying check
    if (hasKeyword(attacker, 'FLYING')) {
      if (!hasKeyword(blocker, 'FLYING') && !hasKeyword(blocker, 'REACH')) {
        return { valid: false, error: 'Cannot block Flying without Flying or Reach' };
      }
    }

    usedBlockers.add(blocker.instance_id);
    usedAttackers.add(attacker.instance_id);
  }

  // Validate Taunt forced-block: all Taunt creatures MUST block if they can legally block any attacker
  for (const creature of defendingPlayer.board) {
    if (!creature || !creature.is_alive) continue;
    if (!hasKeyword(creature, 'TAUNT')) continue;
    if (creature.card_type === 'STABILIZER') continue;
    if (usedBlockers.has(creature.instance_id)) continue;

    // Check if any unblocked attacker can be legally blocked by this Taunt creature
    for (const attackerId of state.declared_attackers) {
      if (usedAttackers.has(attackerId)) continue;
      const attacker = findOnBoard(activePlayer, attackerId);
      if (!attacker || !attacker.is_alive) continue;

      // Can this Taunt creature legally block this attacker?
      if (hasKeyword(attacker, 'FLYING')) {
        if (!hasKeyword(creature, 'FLYING') && !hasKeyword(creature, 'REACH')) {
          continue; // Cannot legally block flying
        }
      }
      // This Taunt creature CAN block but wasn't assigned
      return { valid: false, error: `Taunt creature ${creature.instance_id} must block if able` };
    }
  }

  return { valid: true };
}

/**
 * Resolve a single blocked combat pair.
 * Keyword priority: Shield -> Damage -> Deathtouch -> Piercing -> Lifesteal
 */
function resolveCombatPair(
  attacker: BattleCreature,
  blocker: BattleCreature,
  attackingPlayerHp: { current_hp: number; max_hp: number },
  defendingPlayerHp: { current_hp: number; max_hp: number }
): CombatPairResult {
  let attackerDamageToBlocker = attacker.attack;
  let blockerDamageToAttacker = blocker.attack;
  let blockerShieldBroke = false;
  let attackerShieldBroke = false;
  let piercingDamage = 0;
  let attackerLifesteal = 0;
  let blockerLifesteal = 0;
  let attackerDied = false;
  let blockerDied = false;

  // STEP 1: SHIELD CHECK (both sides)
  if (blocker.shield_active) {
    blocker.shield_active = false;
    blockerShieldBroke = true;
    attackerDamageToBlocker = 0;
    // Shield absorbs ALL damage - skip Deathtouch/Piercing for attacker
  }
  if (attacker.shield_active) {
    attacker.shield_active = false;
    attackerShieldBroke = true;
    blockerDamageToAttacker = 0;
  }

  // STEP 2: DEAL DAMAGE (simultaneous)
  blocker.health -= attackerDamageToBlocker;
  attacker.health -= blockerDamageToAttacker;

  // STEP 3: DEATHTOUCH CHECK
  if (hasKeyword(attacker, 'DEATHTOUCH') && attackerDamageToBlocker > 0) {
    blocker.is_alive = false;
    blockerDied = true;
  }
  if (hasKeyword(blocker, 'DEATHTOUCH') && blockerDamageToAttacker > 0) {
    attacker.is_alive = false;
    attackerDied = true;
  }

  // STEP 4: NORMAL DEATH CHECK
  if (blocker.health <= 0 && !blockerDied) {
    blocker.is_alive = false;
    blockerDied = true;
  }
  if (attacker.health <= 0 && !attackerDied) {
    attacker.is_alive = false;
    attackerDied = true;
  }

  // STEP 5: PIERCING CHECK (attacker only, not if shield absorbed)
  if (hasKeyword(attacker, 'PIERCING') && !blockerShieldBroke && attackerDamageToBlocker > 0) {
    // Excess damage = attacker ATK - blocker's HP before damage was applied
    // blocker.max_health represents the HP before this combat
    const blockerHpBeforeDamage = blocker.health + attackerDamageToBlocker;
    const overkill = attacker.attack - blockerHpBeforeDamage;
    if (overkill > 0) {
      piercingDamage = overkill;
      defendingPlayerHp.current_hp -= overkill;
    }
  }

  // STEP 6: LIFESTEAL CHECK (both sides)
  if (hasKeyword(attacker, 'LIFESTEAL') && attackerDamageToBlocker > 0) {
    attackerLifesteal = attackerDamageToBlocker;
    attackingPlayerHp.current_hp = Math.min(
      attackingPlayerHp.current_hp + attackerDamageToBlocker,
      attackingPlayerHp.max_hp
    );
  }
  if (hasKeyword(blocker, 'LIFESTEAL') && blockerDamageToAttacker > 0) {
    blockerLifesteal = blockerDamageToAttacker;
    defendingPlayerHp.current_hp = Math.min(
      defendingPlayerHp.current_hp + blockerDamageToAttacker,
      defendingPlayerHp.max_hp
    );
  }

  return {
    attacker_id: attacker.instance_id,
    blocker_id: blocker.instance_id,
    attacker_damage_dealt: attackerDamageToBlocker,
    blocker_damage_dealt: blockerDamageToAttacker,
    attacker_died: attackerDied,
    blocker_died: blockerDied,
    piercing_damage: piercingDamage,
    attacker_lifesteal: attackerLifesteal,
    blocker_lifesteal: blockerLifesteal,
    attacker_shield_broke: attackerShieldBroke,
    blocker_shield_broke: blockerShieldBroke,
  };
}

/**
 * Full combat resolution.
 * Process all blocked pairs simultaneously, then unblocked attackers hit face.
 * Fire ON_DEATH abilities, recalculate instability, check win condition.
 */
export function resolveCombat(state: GameState): CombatResult {
  const activePlayer = getActivePlayer(state);
  const defendingPlayer = getDefendingPlayer(state);
  const destroyedCreatures: Array<{
    creature: BattleCreature;
    side: PlayerSide;
    board_slot: number;
    owner: BattlePlayer;
  }> = [];
  const combatPairs: CombatPairResult[] = [];

  // --- Blocked combat pairs ---
  for (const assignment of state.blocker_assignments) {
    const attacker = findOnBoard(activePlayer, assignment.attacker_creature_id);
    const blocker = findOnBoard(defendingPlayer, assignment.blocker_creature_id);
    if (!attacker || !blocker) continue;

    const result = resolveCombatPair(
      attacker,
      blocker,
      activePlayer,
      defendingPlayer
    );

    if (result.attacker_died) {
      destroyedCreatures.push({
        creature: attacker,
        side: activePlayer.side,
        board_slot: attacker.board_slot,
        owner: activePlayer,
      });
    }
    if (result.blocker_died) {
      destroyedCreatures.push({
        creature: blocker,
        side: defendingPlayer.side,
        board_slot: blocker.board_slot,
        owner: defendingPlayer,
      });
    }

    combatPairs.push(result);
  }

  // --- Unblocked attackers ---
  const blockedAttackerIds = new Set(
    state.blocker_assignments.map(a => a.attacker_creature_id)
  );
  const unblockedResults: UnblockedResult[] = [];

  for (const attackerId of state.declared_attackers) {
    if (blockedAttackerIds.has(attackerId)) continue;
    const attacker = findOnBoard(activePlayer, attackerId);
    if (!attacker || !attacker.is_alive) continue;

    const faceDamage = attacker.attack;
    defendingPlayer.current_hp -= faceDamage;

    let lifesteal = 0;
    if (hasKeyword(attacker, 'LIFESTEAL')) {
      lifesteal = faceDamage;
      activePlayer.current_hp = Math.min(
        activePlayer.current_hp + faceDamage,
        activePlayer.max_hp
      );
    }

    unblockedResults.push({
      attacker_id: attackerId,
      face_damage: faceDamage,
      lifesteal,
    });
  }

  // STEP 7: Remove destroyed creatures from the board
  for (const entry of destroyedCreatures) {
    const owner = entry.side === activePlayer.side ? activePlayer : defendingPlayer;
    if (owner.board[entry.board_slot]?.instance_id === entry.creature.instance_id) {
      owner.board[entry.board_slot] = null;
      owner.graveyard.push(entry.creature);
    }
  }

  // STEP 8: Fire ON_DEATH abilities (active player deaths first, left-to-right)
  const activeDeaths = destroyedCreatures
    .filter(e => e.side === activePlayer.side)
    .sort((a, b) => a.board_slot - b.board_slot);
  const defendingDeaths = destroyedCreatures
    .filter(e => e.side === defendingPlayer.side)
    .sort((a, b) => a.board_slot - b.board_slot);

  for (const entry of [...activeDeaths, ...defendingDeaths]) {
    resolveTriggeredAbilities(state, entry.creature, 'ON_DEATH', entry.owner);
  }

  // STEP 9: Recalculate instability for both players
  recalculateInstability(activePlayer);
  recalculateInstability(defendingPlayer);

  // STEP 10: Check win condition
  if (defendingPlayer.current_hp <= 0 && activePlayer.current_hp <= 0) {
    // Simultaneous death: active player loses (they took the risk of attacking)
    state.winner = defendingPlayer.side;
  } else if (defendingPlayer.current_hp <= 0) {
    state.winner = activePlayer.side;
  } else if (activePlayer.current_hp <= 0) {
    state.winner = defendingPlayer.side;
  }

  // Clean up combat state
  state.declared_attackers = [];
  state.blocker_assignments = [];

  return {
    pairs: combatPairs,
    unblocked: unblockedResults,
    deaths: destroyedCreatures.map(d => ({
      creature_id: d.creature.instance_id,
      side: d.side,
      board_slot: d.board_slot,
    })),
  };
}

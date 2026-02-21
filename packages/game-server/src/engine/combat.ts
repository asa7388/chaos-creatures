// Chaos Creatures Game Server — Combat Resolution
// Full keyword priority algorithm from docs/design/01-battle-mechanics.md Phase 8
// Keyword priority: Shield absorb -> base damage -> Deathtouch check -> Piercing overflow -> Lifesteal heal

import type {
  GameState,
  BattleCreature,
  BattleRuin,
  BattlePlayer,
  CombatPairResult,
  UnblockedResult,
  CombatResult,
} from '../types/game-state';
import type { PlayerSide, Keyword } from '../types/enums';
import { recalculateInstability } from './instability';
import {
  resolveTriggeredAbilities,
  processDeaths,
  isBattleRuin,
  isBattleCreature,
  recheckExaltAuras,
  applyDamageToRuin,
} from './effects';

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
  for (const entity of player.board) {
    if (entity && entity.instance_id === creatureId && isBattleCreature(entity)) {
      return entity;
    }
  }
  return null;
}

/** Find a ruin on a player's board by instance_id */
function findRuinOnBoard(player: BattlePlayer, ruinId: string): BattleRuin | null {
  for (const entity of player.board) {
    if (entity && entity.instance_id === ruinId && isBattleRuin(entity)) {
      return entity;
    }
  }
  return null;
}

/** Count creatures with Taunt that can legally block */
export function countTauntCreatures(player: BattlePlayer): number {
  let count = 0;
  for (const entity of player.board) {
    if (!entity || !entity.is_alive) continue;
    if (!isBattleCreature(entity)) continue;
    // Planar Ruins cannot block (they have no ATK and are structures, not creatures)
    if (entity.card_type === 'PLANAR_RUIN') continue;
    // Stabilizers are no longer on the board — this check is kept for safety but will never fire
    if (hasKeyword(entity, 'TAUNT')) count++;
  }
  return count;
}

/** Count creatures that can attack (not ruins, alive, not summoning sick unless Haste) */
export function countAttackableCreatures(player: BattlePlayer): number {
  let count = 0;
  for (const entity of player.board) {
    if (!entity || !entity.is_alive) continue;
    if (!isBattleCreature(entity)) continue;
    // Planar Ruins have 0 ATK and cannot attack
    if (entity.card_type === 'PLANAR_RUIN') continue;
    // Summoning sick creatures can't attack unless they have Haste
    if (entity.summoning_sick && !entity.active_keywords.includes('HASTE')) continue;
    count++;
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
    // Planar Ruins have 0 ATK and cannot attack
    if (creature.card_type === 'PLANAR_RUIN') {
      return { valid: false, error: 'Ruins cannot attack' };
    }
    // Stabilizers are no longer placed on the board, so this path cannot be reached.
    // They live in player.stability_zone. No explicit check needed.
    // Summoning sickness: creatures cannot attack on deployment turn unless they have Haste
    if (creature.summoning_sick && !creature.active_keywords.includes('HASTE')) {
      return { valid: false, error: `Creature ${id} has summoning sickness and cannot attack without Haste` };
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
    // Planar Ruins cannot block (structures, no combat ability)
    if (blocker.card_type === 'PLANAR_RUIN') {
      return { valid: false, error: 'Ruins cannot block' };
    }
    // Stabilizers are no longer on the board — they are in stability_zone, so this check
    // is unreachable, but leaving the Ruin check above is sufficient for safety.
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
  for (const entity of defendingPlayer.board) {
    if (!entity || !entity.is_alive) continue;
    if (!isBattleCreature(entity)) continue;
    if (!hasKeyword(entity, 'TAUNT')) continue;
    // Stabilizers are in stability_zone, not on the board — no exclusion needed here
    if (usedBlockers.has(entity.instance_id)) continue;

    // Check if any unblocked attacker can be legally blocked by this Taunt creature
    for (const attackerId of state.declared_attackers) {
      if (usedAttackers.has(attackerId)) continue;
      const attacker = findOnBoard(activePlayer, attackerId);
      if (!attacker || !attacker.is_alive) continue;

      // Can this Taunt creature legally block this attacker?
      if (hasKeyword(attacker, 'FLYING')) {
        if (!hasKeyword(entity, 'FLYING') && !hasKeyword(entity, 'REACH')) {
          continue; // Cannot legally block flying
        }
      }
      // This Taunt creature CAN block but wasn't assigned
      return { valid: false, error: `Taunt creature ${entity.instance_id} must block if able` };
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

    // Check if this attacker is targeting a ruin
    const targetRuinId = state.ruin_attack_targets?.[attackerId];
    if (targetRuinId) {
      const ruin = findRuinOnBoard(defendingPlayer, targetRuinId);
      if (ruin && ruin.is_alive) {
        // Attack the ruin
        const damage = attacker.attack;

        // Deathtouch: destroy ruin regardless of damage amount
        if (hasKeyword(attacker, 'DEATHTOUCH') && damage > 0) {
          ruin.health = 0;
          ruin.is_alive = false;
        } else {
          applyDamageToRuin(state, ruin, damage, defendingPlayer);
        }

        // Lifesteal applies when attacking ruins
        let lifesteal = 0;
        if (hasKeyword(attacker, 'LIFESTEAL') && damage > 0) {
          lifesteal = damage;
          activePlayer.current_hp = Math.min(
            activePlayer.current_hp + damage,
            activePlayer.max_hp
          );
        }

        // NOTE: Piercing does NOT apply to ruins (no "defending player" behind a ruin)

        unblockedResults.push({
          attacker_id: attackerId,
          face_damage: 0, // Damage went to ruin, not face
          lifesteal,
        });
        continue;
      }
      // If ruin is already dead/gone, fall through to face damage
    }

    // Standard unblocked: deal face damage
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

  // STEP 9: Process ruin deaths on defending side (from ruin attacks)
  processDeaths(state, defendingPlayer);
  processDeaths(state, activePlayer);

  // STEP 10: Recheck Exalt thresholds after combat deaths
  recheckExaltAuras(state, activePlayer);
  recheckExaltAuras(state, defendingPlayer);

  // STEP 11: Recalculate instability for both players
  recalculateInstability(activePlayer);
  recalculateInstability(defendingPlayer);

  // STEP 12: Check win condition
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
  state.ruin_attack_targets = {};

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

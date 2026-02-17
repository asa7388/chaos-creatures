# Practice Match Implementation Spec

## Status
- **Author**: Game Architect Agent
- **Date**: 2026-02-17
- **Scope**: Full implementation spec for "Play against AI" (Practice Match) feature
- **Consumers**: Backend Build Agent (Game Server), iOS Build Agent (Client)

---

## 1. Problem Statement

The iOS app has a "Practice" game mode in `GameMode.practice` and a dead `startPracticeMatch()` method in `MatchmakingService.swift` that calls a non-existent Edge Function at `matchmaking/practice`. The game server's matchmaking poller (`services/matchmaking.ts`) only handles `RANKED` and `CASUAL` modes. There is no bot player logic, no practice match creation endpoint, and no way to play a game against AI. The entire feature must be built from scratch.

---

## 2. Architecture Overview

Practice matches run on the same game server as PvP matches. The game server creates the match, manages a synthetic bot player, and automates the bot's turns. The iOS client calls the game server directly (not through the matchmaking queue) and then connects to the same Supabase Realtime channel used by PvP matches. The bot is PLAYER_2 in every practice match.

```
iOS Client                  Game Server (Railway)              Supabase
    |                             |                               |
    |-- POST /api/practice/start->|                               |
    |   (JWT + deck_id)           |                               |
    |                             |-- verify JWT ----------------->|
    |                             |<-- user profile + deck cards --|
    |                             |-- load card_templates -------->|
    |                             |<-- bot card pool --------------|
    |                             |                               |
    |                             | [build bot deck in-memory]    |
    |                             | [createMatch()]               |
    |                             | [setupMatchChannel()]         |
    |                             |-- subscribe match:XXX -------->|
    |                             |                               |
    |<-- { match_id: "XXX" } -----|                               |
    |                             |                               |
    |-- subscribe match:XXX ----->|                               |
    |                             | [registerPlayer(human)]       |
    |                             | [registerPlayer(bot)]         |
    |                             | [startNextTurn()]             |
    |                             |                               |
    |<== game_event broadcasts ===================================>|
    |                             |                               |
    |                             | [bot turn: automated actions] |
    |                             |                               |
    |<-- MATCH_END ===============================================>|
    |                             |                               |
    |                             | [cleanup, NO match_record     |
    |                             |  insert for practice]         |
```

---

## 3. Game Server Changes

### 3.1 New File: `packages/game-server/src/bot/ai.ts`

This file contains all bot decision-making logic.

#### 3.1.1 Bot Constants

```typescript
// Bot timing constants
export const BOT_THINK_DELAY_MS = 1500;       // Delay before bot starts its turn actions
export const BOT_ACTION_DELAY_MS = 800;        // Delay between individual actions (play card, attack, etc.)
export const BOT_BLOCK_DELAY_MS = 1000;        // Delay before bot assigns blockers

// Bot player ID convention
export const BOT_PLAYER_ID = '00000000-0000-0000-0000-000000000000';
export const BOT_DECK_ID = '00000000-0000-0000-0000-000000000001';
export const BOT_AVATAR_ID = 'b0000000-0000-0000-0000-000000000005'; // Kael, the Bound Tyrant
```

#### 3.1.2 Bot Deck Builder

```typescript
import type { BattleCard } from '../types/game-state';
import type { Keyword, CardType } from '../types/enums';
import { getSupabase } from '../services/supabase';
import { randomUUID } from 'crypto';

export interface BotDeckConfig {
  faction_id?: string;   // If provided, only use cards from this faction. Otherwise, use all factions.
  card_count: number;    // Always 20
}

/**
 * Build a bot deck from card_templates in the database.
 *
 * Strategy:
 * 1. Query all active card_templates
 * 2. Filter to CREATURE and SPELL types only (no STABILIZER for bot simplicity)
 * 3. Build a balanced deck with a good mana curve
 * 4. Convert card_templates into BattleCard[] with synthetic instance IDs
 *
 * The bot has NO card_instances in the database. All cards are synthesized
 * in-memory from card_templates with fake instance IDs.
 */
export async function buildBotDeck(config: BotDeckConfig = { card_count: 20 }): Promise<BattleCard[]> {
  const supabase = getSupabase();

  // Query all active card templates (the is_active column is on card_templates
  // but may not exist yet -- fall back to querying all)
  const { data: templates, error } = await supabase
    .from('card_templates')
    .select('id, name, card_type, faction_id, mana_cost, base_attack, base_health, base_instability, base_keywords, art_url')
    .in('card_type', ['CREATURE', 'SPELL']);

  if (error || !templates || templates.length === 0) {
    // Fallback: generate a hardcoded starter deck
    return generateFallbackDeck();
  }

  // Filter by faction if specified
  let pool = templates;
  if (config.faction_id) {
    const factionCards = templates.filter((t: any) => t.faction_id === config.faction_id);
    if (factionCards.length >= 10) {
      pool = factionCards;
    }
    // Otherwise use full pool
  }

  // Separate by card type
  const creatures = pool.filter((t: any) => t.card_type === 'CREATURE');
  const spells = pool.filter((t: any) => t.card_type === 'SPELL');

  // Target: 16 creatures, 4 spells (if available)
  const targetCreatures = Math.min(16, creatures.length);
  const targetSpells = Math.min(4, spells.length);
  const remaining = config.card_count - targetCreatures - targetSpells;

  // Build mana curve for creatures: prefer 2-4 cost range
  const sortedCreatures = [...creatures].sort((a: any, b: any) => {
    // Prioritize mana costs 2-4, then 1, then 5+
    const curveScore = (cost: number) => {
      if (cost >= 2 && cost <= 4) return 0;
      if (cost === 1) return 1;
      if (cost === 5) return 2;
      return 3;
    };
    return curveScore(a.mana_cost) - curveScore(b.mana_cost);
  });

  // Select creatures (allow up to 2 copies of each template)
  const selectedCards: any[] = [];
  const templateCounts: Record<string, number> = {};

  for (const creature of sortedCreatures) {
    if (selectedCards.length >= targetCreatures) break;
    const count = templateCounts[creature.id] || 0;
    if (count < 2) {
      selectedCards.push(creature);
      templateCounts[creature.id] = count + 1;
    }
  }

  // If we need more creatures, loop again
  if (selectedCards.length < targetCreatures) {
    for (const creature of sortedCreatures) {
      if (selectedCards.length >= targetCreatures) break;
      const count = templateCounts[creature.id] || 0;
      if (count < 2) {
        selectedCards.push(creature);
        templateCounts[creature.id] = count + 1;
      }
    }
  }

  // Select spells
  for (const spell of spells) {
    if (selectedCards.length >= targetCreatures + targetSpells) break;
    const count = templateCounts[spell.id] || 0;
    if (count < 2) {
      selectedCards.push(spell);
      templateCounts[spell.id] = count + 1;
    }
  }

  // Fill remaining slots with any cards
  if (selectedCards.length < config.card_count) {
    for (const card of sortedCreatures) {
      if (selectedCards.length >= config.card_count) break;
      const count = templateCounts[card.id] || 0;
      if (count < 2) {
        selectedCards.push(card);
        templateCounts[card.id] = count + 1;
      }
    }
  }

  // Convert to BattleCard format with synthetic instance IDs
  return selectedCards.map((t: any) => templateToBattleCard(t));
}

/**
 * Convert a card_template row into a BattleCard with a synthetic instance_id.
 * The bot has no real card_instances, so we generate UUIDs on the fly.
 * Modifiers and triggered abilities are empty (bot cards are always Common tier).
 */
function templateToBattleCard(template: any): BattleCard {
  return {
    instance_id: randomUUID(),
    template_id: template.id,
    card_type: template.card_type as CardType,
    name: template.name,
    mana_cost: template.mana_cost,
    art_url: template.art_url ?? '',
    base_attack: template.base_attack ?? undefined,
    base_health: template.base_health ?? undefined,
    base_instability: template.base_instability ?? 0,
    innate_keywords: (template.base_keywords ?? []) as Keyword[],
    modifiers: [],
    triggered_abilities: [],
    faction_id: template.faction_id,
  };
}

/**
 * Hardcoded fallback deck if no card_templates exist in the database.
 * 20 vanilla creatures with a basic mana curve.
 * This ensures practice mode works even with an empty database.
 */
function generateFallbackDeck(): BattleCard[] {
  const cards: BattleCard[] = [];
  const fallbackFaction = 'a0000000-0000-0000-0000-000000000001'; // Ironwright

  // Mana curve: 4x 1-cost, 4x 2-cost, 4x 3-cost, 4x 4-cost, 2x 5-cost, 2x 6-cost
  const curve = [
    { cost: 1, atk: 1, hp: 2, count: 4 },
    { cost: 2, atk: 2, hp: 2, count: 4 },
    { cost: 3, atk: 3, hp: 3, count: 4 },
    { cost: 4, atk: 4, hp: 4, count: 4 },
    { cost: 5, atk: 5, hp: 5, count: 2 },
    { cost: 6, atk: 6, hp: 6, count: 2 },
  ];

  for (const tier of curve) {
    for (let i = 0; i < tier.count; i++) {
      cards.push({
        instance_id: randomUUID(),
        template_id: randomUUID(),
        card_type: 'CREATURE',
        name: `Bot Creature ${tier.cost}-${i + 1}`,
        mana_cost: tier.cost,
        art_url: '',
        base_attack: tier.atk,
        base_health: tier.hp,
        base_instability: 1,
        innate_keywords: [],
        modifiers: [],
        triggered_abilities: [],
        faction_id: fallbackFaction,
      });
    }
  }

  return cards;
}
```

#### 3.1.3 Bot AI Engine

```typescript
import type { GameState, BattlePlayer, BattleCard, BattleCreature } from '../types/game-state';
import type { PlayerSide } from '../types/enums';
import { handlePlayCard, handleDeclareAttackersAction, handleAssignBlockersAction, GameError } from '../engine/turn';
import { MAX_BOARD_SLOTS } from '../engine/constants';

/**
 * Decide which cards to play from the bot's hand during the Main Phase.
 * Returns an array of actions to execute sequentially.
 *
 * Strategy (single difficulty level -- "Normal"):
 * 1. Play creatures if board has empty slots, prioritizing by mana efficiency
 * 2. Play the most expensive creature the bot can afford first (greedy mana use)
 * 3. Do not play spells (bot does not target -- spells require targeting logic)
 * 4. Stop when out of mana or no playable cards remain
 */
export function decideBotMainPhase(state: GameState): BotAction[] {
  const bot = getBotPlayer(state);
  const actions: BotAction[] = [];

  // Sort hand by mana cost descending (play biggest creature first)
  const playableCards = [...bot.hand]
    .filter((card) => {
      if (card.mana_cost > bot.current_mana) return false;
      if (card.card_type === 'CREATURE' || card.card_type === 'STABILIZER') {
        // Need an empty board slot
        return bot.board.some((slot) => slot === null);
      }
      // Skip spells for now (targeting is complex)
      return false;
    })
    .sort((a, b) => b.mana_cost - a.mana_cost);

  let remainingMana = bot.current_mana;

  for (const card of playableCards) {
    if (card.mana_cost > remainingMana) continue;

    // Find first empty slot
    const emptySlot = bot.board.findIndex((slot) => slot === null);
    if (emptySlot === -1) break;

    actions.push({
      type: 'PLAY_CARD',
      card_id: card.instance_id,
      target_slot: emptySlot,
    });

    remainingMana -= card.mana_cost;
  }

  return actions;
}

/**
 * Decide which creatures to declare as attackers.
 *
 * Strategy:
 * 1. Attack with ALL creatures that are alive and not Stabilizers
 * 2. Respect P1 Turn 1 restriction (no attacks)
 * 3. Obey Taunt forced-attack rules (must attack with at least minAttackers)
 *
 * This is aggressive but simple -- the bot always attacks with everything.
 */
export function decideBotAttackers(state: GameState): string[] {
  const bot = getBotPlayer(state);

  // P1 Turn 1 restriction
  if (state.current_turn === 1 && state.active_player === state.first_player) {
    return [];
  }

  const attackerIds: string[] = [];
  for (const creature of bot.board) {
    if (!creature) continue;
    if (!creature.is_alive) continue;
    if (creature.card_type === 'STABILIZER') continue;
    attackerIds.push(creature.instance_id);
  }

  return attackerIds;
}

/**
 * Decide how to assign blockers when the bot is defending.
 *
 * Strategy:
 * 1. Creatures with Taunt MUST block (game rules)
 * 2. Block the highest-ATK attacker first with the bot's lowest-value creature
 * 3. Each blocker blocks exactly one attacker, each attacker blocked at most once
 * 4. Skip blocking if the bot has no creatures, or if all attackers have Flying
 *    and the bot has no Flying/Reach creatures
 * 5. Prioritize blocking attackers that would deal lethal face damage
 */
export function decideBotBlockers(
  state: GameState
): Array<{ blocker_id: string; attacker_id: string }> {
  const bot = getBotPlayer(state);
  const attacker = getOpponentPlayer(state);
  const assignments: Array<{ blocker_id: string; attacker_id: string }> = [];
  const usedBlockers = new Set<string>();
  const usedAttackers = new Set<string>();

  // Get all available blockers (alive, not Stabilizer)
  const availableBlockers: BattleCreature[] = [];
  for (const creature of bot.board) {
    if (!creature) continue;
    if (!creature.is_alive) continue;
    if (creature.card_type === 'STABILIZER') continue;
    availableBlockers.push(creature);
  }

  // Get all declared attackers
  const attackerCreatures: BattleCreature[] = [];
  for (const attackerId of state.declared_attackers) {
    for (const creature of attacker.board) {
      if (creature && creature.instance_id === attackerId && creature.is_alive) {
        attackerCreatures.push(creature);
      }
    }
  }

  if (availableBlockers.length === 0 || attackerCreatures.length === 0) {
    return [];
  }

  // Sort attackers by ATK descending (block the biggest threat first)
  const sortedAttackers = [...attackerCreatures].sort((a, b) => b.attack - a.attack);

  // First pass: assign Taunt creatures (they MUST block)
  const tauntBlockers = availableBlockers.filter(
    (c) => c.active_keywords.includes('TAUNT')
  );

  for (const tauntCreature of tauntBlockers) {
    // Find the best attacker this Taunt creature can legally block
    for (const attackerCreature of sortedAttackers) {
      if (usedAttackers.has(attackerCreature.instance_id)) continue;

      // Flying check: can this blocker block this attacker?
      if (attackerCreature.active_keywords.includes('FLYING')) {
        if (
          !tauntCreature.active_keywords.includes('FLYING') &&
          !tauntCreature.active_keywords.includes('REACH')
        ) {
          continue;
        }
      }

      assignments.push({
        blocker_id: tauntCreature.instance_id,
        attacker_id: attackerCreature.instance_id,
      });
      usedBlockers.add(tauntCreature.instance_id);
      usedAttackers.add(attackerCreature.instance_id);
      break;
    }
  }

  // Second pass: assign remaining blockers to highest-ATK unblocked attackers
  // Sort remaining blockers by ATK ascending (sacrifice weakest first)
  const remainingBlockers = availableBlockers
    .filter((c) => !usedBlockers.has(c.instance_id))
    .sort((a, b) => a.attack - b.attack);

  for (const blocker of remainingBlockers) {
    // Find highest-ATK unblocked attacker this creature can legally block
    for (const attackerCreature of sortedAttackers) {
      if (usedAttackers.has(attackerCreature.instance_id)) continue;

      // Flying check
      if (attackerCreature.active_keywords.includes('FLYING')) {
        if (
          !blocker.active_keywords.includes('FLYING') &&
          !blocker.active_keywords.includes('REACH')
        ) {
          continue;
        }
      }

      // Only block if the attacker would deal >= 3 face damage
      // (bot saves small creatures from blocking weak attackers)
      if (attackerCreature.attack >= 3 || bot.current_hp <= 8) {
        assignments.push({
          blocker_id: blocker.instance_id,
          attacker_id: attackerCreature.instance_id,
        });
        usedBlockers.add(blocker.instance_id);
        usedAttackers.add(attackerCreature.instance_id);
        break;
      }
    }
  }

  return assignments;
}

// ─── Bot Action Types ─────────────

export interface BotPlayCardAction {
  type: 'PLAY_CARD';
  card_id: string;
  target_slot: number;
}

export type BotAction = BotPlayCardAction;

// ─── Helpers ─────────────

function getBotPlayer(state: GameState): BattlePlayer {
  // Bot is always PLAYER_2
  return state.player_2;
}

function getOpponentPlayer(state: GameState): BattlePlayer {
  // Human is always PLAYER_1 from the bot's perspective
  return state.player_1;
}
```

### 3.2 New File: `packages/game-server/src/bot/runner.ts`

This file orchestrates the bot's automated turn execution within the existing match lifecycle.

```typescript
import type { GameState } from '../types/game-state';
import { getMatch } from '../engine/match';
import { handlePlayCard, handleDeclareAttackersAction, handleAssignBlockersAction, resolveCombatPhase, resolveEndOfTurn, executeAutomaticPhases, GameError } from '../engine/turn';
import { broadcastToRoom, sendToPlayer } from '../ws/rooms';
import { createClientGameState, endMatch, forfeitMatch } from '../engine/match';
import { startNextTurn } from '../ws/handler';
import { decideBotMainPhase, decideBotAttackers, decideBotBlockers, BOT_THINK_DELAY_MS, BOT_ACTION_DELAY_MS, BOT_BLOCK_DELAY_MS, BOT_PLAYER_ID } from './ai';
import { getTimerManager, createTimerManager, destroyTimerManager } from '../services/timer';

/**
 * Check if a match is a practice match (has the bot as PLAYER_2).
 */
export function isPracticeMatch(state: GameState): boolean {
  return state.player_2.player_id === BOT_PLAYER_ID;
}

/**
 * Check if the bot should act right now.
 * The bot acts when:
 * 1. It is the active player (its turn, in MAIN_PHASE or DECLARE_ATTACKERS)
 * 2. It is the defending player and needs to assign blockers (ASSIGN_BLOCKERS phase)
 */
export function shouldBotAct(state: GameState): boolean {
  if (!isPracticeMatch(state)) return false;
  if (state.winner) return false;

  const botSide = 'PLAYER_2'; // Bot is always PLAYER_2

  // Bot's turn: main phase or declare attackers
  if (state.active_player === botSide && state.phase === 'MAIN_PHASE') {
    return true;
  }

  // Bot needs to declare attackers
  if (state.active_player === botSide && state.phase === 'DECLARE_ATTACKERS') {
    return true;
  }

  // Bot needs to assign blockers (human attacked, bot defends)
  if (state.active_player !== botSide && state.phase === 'ASSIGN_BLOCKERS') {
    return true;
  }

  return false;
}

/**
 * Execute the bot's full turn (called after automatic phases finish when it's the bot's turn).
 *
 * Sequence:
 * 1. Wait BOT_THINK_DELAY_MS (simulate thinking)
 * 2. Play cards one at a time (with BOT_ACTION_DELAY_MS between each)
 * 3. Move to declare attackers
 * 4. Declare all attackers
 * 5. Combat resolution and end turn happen via the normal handler flow
 */
export async function executeBotTurn(matchId: string): Promise<void> {
  // Initial think delay
  await delay(BOT_THINK_DELAY_MS);

  const state = getMatch(matchId);
  if (!state || state.winner || state.phase !== 'MAIN_PHASE') return;
  if (state.active_player !== 'PLAYER_2') return;

  // Cancel any decision timer for the bot (bot never times out)
  const timer = getTimerManager(matchId);
  if (timer) timer.cancelDecisionTimer();

  // ─── Main Phase: Play cards ─────────────
  const actions = decideBotMainPhase(state);

  for (const action of actions) {
    await delay(BOT_ACTION_DELAY_MS);

    const currentState = getMatch(matchId);
    if (!currentState || currentState.winner) return;

    try {
      const result = handlePlayCard(currentState, action.card_id, action.target_slot);

      broadcastToRoom(matchId, {
        type: 'CARD_PLAYED',
        player: 'PLAYER_2',
        card: result.card,
        slot: result.slot,
        creature: result.creature,
        mana_remaining: result.mana_remaining,
        effect_results: result.effect_results,
      });

      // Send opponent hand count update to human
      sendToPlayer(matchId, currentState.player_1.player_id, {
        type: 'OPPONENT_HAND_UPDATE',
        count: currentState.player_2.hand.length,
      });
    } catch (err) {
      // Bot failed to play card (e.g., not enough mana, slot occupied)
      // Log and continue
      if (err instanceof GameError) {
        console.warn(`Bot play card error in ${matchId}: ${err.code} - ${err.message}`);
      }
    }
  }

  // ─── Transition to Declare Attackers ─────────────
  await delay(BOT_ACTION_DELAY_MS);

  const stateBeforeAttack = getMatch(matchId);
  if (!stateBeforeAttack || stateBeforeAttack.winner) return;

  stateBeforeAttack.phase = 'DECLARE_ATTACKERS';
  broadcastToRoom(matchId, {
    type: 'PHASE_CHANGED',
    phase: 'DECLARE_ATTACKERS',
    active_player: 'PLAYER_2',
  });

  // ─── Declare Attackers ─────────────
  const attackerIds = decideBotAttackers(stateBeforeAttack);
  const attackResult = handleDeclareAttackersAction(stateBeforeAttack, attackerIds);

  if (!attackResult.valid) {
    // If attack declaration fails, skip combat and end turn
    console.warn(`Bot attack declaration failed in ${matchId}: ${attackResult.error}`);
    performBotEndOfTurn(matchId);
    return;
  }

  broadcastToRoom(matchId, {
    type: 'ATTACKERS_DECLARED',
    attacker_ids: attackerIds,
    player: 'PLAYER_2',
  });

  if (attackerIds.length === 0) {
    // No attackers, skip to end of turn
    performBotEndOfTurn(matchId);
    return;
  }

  // ─── Transition to Assign Blockers (human's turn to block) ─────────────
  stateBeforeAttack.phase = 'ASSIGN_BLOCKERS';
  broadcastToRoom(matchId, {
    type: 'PHASE_CHANGED',
    phase: 'ASSIGN_BLOCKERS',
    active_player: 'PLAYER_1', // Human blocks
  });

  // Start a timer for the human to assign blockers
  let blockerTimer = getTimerManager(matchId);
  if (!blockerTimer) {
    blockerTimer = createTimerManager(matchId, {
      onWarning: (mId, seconds) => {
        broadcastToRoom(mId, {
          type: 'TIMER_WARNING',
          seconds_remaining: seconds,
          phase: 'ASSIGN_BLOCKERS',
        });
      },
      onExpired: (mId) => {
        broadcastToRoom(mId, {
          type: 'TIMER_EXPIRED',
          phase: 'ASSIGN_BLOCKERS',
          player: 'PLAYER_1',
        });
      },
      onDisconnectForfeit: () => {
        // No disconnect forfeit in practice
      },
    });
  }

  blockerTimer.startDecisionTimer(() => {
    // Timer expired for human: no blockers assigned, resolve combat
    const s = getMatch(matchId);
    if (s && !s.winner) {
      s.blocker_assignments = [];
      performBotCombatAndEndTurn(matchId);
    }
  });

  // Note: When the human sends ASSIGN_BLOCKERS, the existing handler in
  // ws/handler.ts will call handleBlockerAction -> performCombatAndEndTurn.
  // After that turn ends, startNextTurn is called which triggers the next
  // turn. If the next turn is the bot's, the bot runner kicks in again.
}

/**
 * Execute the bot's blocker assignments (called when the human attacks and the bot defends).
 */
export async function executeBotBlockers(matchId: string): Promise<void> {
  await delay(BOT_BLOCK_DELAY_MS);

  const state = getMatch(matchId);
  if (!state || state.winner) return;
  if (state.phase !== 'ASSIGN_BLOCKERS') return;

  // Cancel the defender timer since bot is responding
  const timer = getTimerManager(matchId);
  if (timer) timer.cancelDecisionTimer();

  const assignments = decideBotBlockers(state);
  const result = handleAssignBlockersAction(state, assignments);

  if (!result.valid) {
    console.warn(`Bot blocker assignment failed in ${matchId}: ${result.error}`);
    // Submit empty blockers
    state.blocker_assignments = [];
  } else {
    broadcastToRoom(matchId, {
      type: 'BLOCKERS_ASSIGNED',
      assignments,
      player: 'PLAYER_2',
    });
  }

  // Resolve combat and end turn
  performBotCombatAndEndTurn(matchId);
}

// ─── Internal Helpers ─────────────

function performBotCombatAndEndTurn(matchId: string): void {
  const state = getMatch(matchId);
  if (!state) return;

  const combatResult = resolveCombatPhase(state);

  broadcastToRoom(matchId, {
    type: 'COMBAT_RESOLVED',
    pairs: combatResult.pairs,
    unblocked: combatResult.unblocked,
    deaths: combatResult.deaths,
    player_1_hp: state.player_1.current_hp,
    player_2_hp: state.player_2.current_hp,
  });

  if (state.winner) {
    finishPracticeMatch(state, matchId, 'HP_ZERO');
    return;
  }

  performBotEndOfTurn(matchId);
}

function performBotEndOfTurn(matchId: string): void {
  const state = getMatch(matchId);
  if (!state) return;

  resolveEndOfTurn(state);

  if (state.winner) {
    finishPracticeMatch(state, matchId, 'HP_ZERO');
    return;
  }

  // Start next turn (this will trigger automatic phases)
  // If the next turn is the bot's, we need to schedule bot actions
  startNextTurn(state, matchId);

  // After startNextTurn, check if it's now the bot's turn
  const updatedState = getMatch(matchId);
  if (updatedState && !updatedState.winner && shouldBotAct(updatedState)) {
    // Schedule bot turn execution (non-blocking)
    executeBotTurn(matchId).catch((err) => {
      console.error(`Bot turn error in match ${matchId}:`, err);
    });
  }
}

function finishPracticeMatch(
  state: GameState,
  matchId: string,
  endReason: 'HP_ZERO' | 'SURRENDER' | 'DISCONNECT' | 'TIMEOUT'
): void {
  const result = endMatch(state, endReason);

  broadcastToRoom(matchId, {
    type: 'MATCH_END',
    winner: state.winner!,
    end_reason: endReason,
    player_1_final_hp: state.player_1.current_hp,
    player_2_final_hp: state.player_2.current_hp,
    total_turns: state.current_turn,
  });

  destroyTimerManager(matchId);

  // DO NOT save match record for practice matches
  // DO NOT award chaos energy for practice matches
  // Just clean up the room
  const { destroyRoom } = require('../ws/rooms');
  destroyRoom(matchId);

  console.log(`Practice match ${matchId} ended. Winner: ${state.winner}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 3.3 New Endpoint: `POST /api/practice/start`

Add this to `packages/game-server/src/index.ts`.

#### 3.3.1 Authentication

The endpoint validates the Supabase JWT from the `Authorization: Bearer <token>` header using the Supabase service client. This is the same auth flow used by Edge Functions -- the token is the user's access token from Supabase Auth.

#### 3.3.2 Request Format

```typescript
// POST /api/practice/start
// Headers: { Authorization: "Bearer <supabase_jwt>" }
// Body:
interface PracticeStartRequest {
  deck_id: string; // UUID of the player's deck
}
```

#### 3.3.3 Response Format

```typescript
// 200 OK
interface PracticeStartResponse {
  match_id: string;  // UUID of the created match
  bot_name: string;  // Display name for the bot (e.g., "Kael, the Bound Tyrant")
}

// 400 Bad Request
interface PracticeErrorResponse {
  error: string;
}

// 401 Unauthorized
interface PracticeAuthError {
  error: "Unauthorized" | "Invalid token";
}
```

#### 3.3.4 Endpoint Implementation

```typescript
// In packages/game-server/src/index.ts, add after the existing admin routes:

import { buildBotDeck, BOT_PLAYER_ID, BOT_DECK_ID, BOT_AVATAR_ID, BOT_THINK_DELAY_MS } from './bot/ai';
import { executeBotTurn, shouldBotAct } from './bot/runner';

/**
 * Verify a Supabase JWT and return the user ID.
 * Uses the Supabase service client's auth.getUser() with the JWT.
 */
async function verifySupabaseJWT(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

app.post('/api/practice/start', async (req, res) => {
  try {
    // 1. Authenticate
    const userId = await verifySupabaseJWT(req.headers.authorization);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // 2. Validate request
    const { deck_id } = req.body;
    if (!deck_id || typeof deck_id !== 'string') {
      res.status(400).json({ error: 'deck_id is required' });
      return;
    }

    const supabase = getSupabase();

    // 3. Load player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, season_rank')
      .eq('auth_id', userId)
      .single();

    if (playerError || !player) {
      res.status(400).json({ error: 'Player profile not found' });
      return;
    }

    // 4. Load the player's deck
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id, faction_id, avatar_id, is_valid')
      .eq('id', deck_id)
      .eq('owner_id', player.id)
      .single();

    if (deckError || !deck) {
      res.status(400).json({ error: 'Deck not found or does not belong to player' });
      return;
    }

    // 5. Load player's deck cards (same query as matchmaking poller)
    const playerCards = await loadDeckCards(player.id, deck_id);

    // 6. Load player's avatar instability modifier
    const playerAvatarMod = await loadAvatarModifier(deck.avatar_id);

    // 7. Build bot deck from card_templates
    const botCards = await buildBotDeck({ card_count: 20 });

    // 8. Build participants
    const humanParticipant: MatchParticipant = {
      player_id: player.id,
      deck_cards: playerCards,
      avatar_id: deck.avatar_id,
      avatar_instability_modifier: playerAvatarMod,
      deck_id: deck_id,
      faction_id: deck.faction_id,
      season_rank: player.season_rank as SeasonRank,
    };

    const botParticipant: MatchParticipant = {
      player_id: BOT_PLAYER_ID,
      deck_cards: botCards,
      avatar_id: BOT_AVATAR_ID,
      avatar_instability_modifier: -4, // Kael's instability modifier
      deck_id: BOT_DECK_ID,
      faction_id: 'a0000000-0000-0000-0000-000000000003', // Demonic Kingdoms
      season_rank: 'BRONZE_3' as SeasonRank,
    };

    // 9. Create match (PRACTICE mode)
    // Force human = PLAYER_1, bot = PLAYER_2 (override random assignment)
    const matchId = randomUUID();
    const state = createMatch(matchId, 'PRACTICE', humanParticipant, botParticipant);

    // Ensure human is PLAYER_1 and bot is PLAYER_2
    // createMatch randomly assigns P1/P2, so we may need to swap
    if (state.player_1.player_id !== player.id) {
      // Swap player_1 and player_2
      const temp = state.player_1;
      state.player_1 = state.player_2;
      state.player_2 = temp;
      state.player_1.side = 'PLAYER_1';
      state.player_2.side = 'PLAYER_2';
      // P1 gets 4-card hand, P2 gets 5-card hand + Chaos Spark
      // The swap preserves hand sizes as they were dealt
    }

    // 10. Set up Supabase Realtime channel
    await setupMatchChannel(matchId);

    // 11. Register both players in the room
    registerPlayer(matchId, player.id);
    registerPlayer(matchId, BOT_PLAYER_ID);

    // 12. Insert match record into matches table (for admin visibility)
    // Use service role key -- RLS allows service role writes
    // Note: player_2_id references players table which requires a real player.
    // We do NOT insert into matches table for practice matches since
    // BOT_PLAYER_ID does not exist in the players table.
    // Instead, we just track in-memory.

    // 13. Return match_id to client
    res.json({
      match_id: matchId,
      bot_name: 'Kael, the Bound Tyrant',
    });

    console.log(`Practice match ${matchId} created: ${player.id} vs BOT`);

    // 14. Start the first turn after a short delay
    // (gives the client time to connect to the channel)
    setTimeout(() => {
      const s = getMatch(matchId);
      if (s && !s.winner) {
        startNextTurn(s, matchId);

        // If bot goes first (unlikely since we forced human=P1, but handle it)
        const updated = getMatch(matchId);
        if (updated && !updated.winner && shouldBotAct(updated)) {
          executeBotTurn(matchId).catch((err) => {
            console.error(`Bot first turn error in match ${matchId}:`, err);
          });
        }
      }
    }, 2000); // 2 second delay for client connection

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Practice match creation failed:', message);
    res.status(500).json({ error: `Failed to create practice match: ${message}` });
  }
});
```

### 3.4 Modifications to Existing Handler: `packages/game-server/src/ws/handler.ts`

The existing handler needs two hook points so the bot runner can react to human actions:

#### 3.4.1 After Human Assigns Blockers (bot attacked, human blocked)

No change needed. The existing `handleBlockerAction` already calls `performCombatAndEndTurn`, which calls `performEndOfTurn` -> `startNextTurn`. After `startNextTurn`, the bot runner needs to check if it is the bot's turn.

#### 3.4.2 Add Bot Turn Hook to `startNextTurn`

At the end of `startNextTurn()` in `ws/handler.ts`, add:

```typescript
// At the end of startNextTurn(), after broadcasting PHASE_CHANGED:

// --- Bot automation hook ---
if (isPracticeMatch(state) && shouldBotAct(state)) {
  executeBotTurn(matchId).catch((err) => {
    console.error(`Bot turn error in match ${matchId}:`, err);
  });
}
```

Import at the top of `handler.ts`:
```typescript
import { isPracticeMatch, shouldBotAct, executeBotTurn, executeBotBlockers } from '../bot/runner';
```

#### 3.4.3 Add Bot Blocker Hook to `handleDeclareAction`

When the human declares attackers and the phase transitions to ASSIGN_BLOCKERS, check if the defender is the bot:

In the `handleDeclareAction` function, after the transition to `ASSIGN_BLOCKERS`, add:

```typescript
// After state.phase = 'ASSIGN_BLOCKERS' and the broadcastToRoom call:

// --- Bot blocker hook ---
if (isPracticeMatch(state)) {
  executeBotBlockers(matchId).catch((err) => {
    console.error(`Bot blocker error in match ${matchId}:`, err);
  });
  return; // Bot handles blockers; do not start a human decision timer
}
```

#### 3.4.4 Skip Match Record Save for Practice Matches

In `finishMatch()` inside `handler.ts`, the `saveMatchRecordAndAwardEnergy` call should be skipped for practice matches:

```typescript
function finishMatch(
  state: GameState,
  matchId: string,
  endReason: 'HP_ZERO' | 'SURRENDER' | 'DISCONNECT' | 'TIMEOUT'
): void {
  const result = endMatch(state, endReason);

  broadcastToRoom(matchId, {
    type: 'MATCH_END',
    winner: state.winner!,
    end_reason: endReason,
    player_1_final_hp: state.player_1.current_hp,
    player_2_final_hp: state.player_2.current_hp,
    total_turns: state.current_turn,
  });

  destroyTimerManager(matchId);
  destroyRoom(matchId);

  // Skip match record save and energy award for practice matches
  if (state.mode !== 'PRACTICE') {
    saveMatchRecordAndAwardEnergy(result).catch((err) => {
      console.error(`Failed to save match record ${matchId}:`, err);
    });
  } else {
    console.log(`Practice match ${matchId} ended (no record saved)`);
  }
}
```

#### 3.4.5 Allow Surrender in Practice Before Turn 2

In `handleSurrenderAction`, the current check `if (state.current_turn < 2)` prevents early surrender. For practice matches, allow surrender at any time:

```typescript
function handleSurrenderAction(
  state: GameState,
  matchId: string,
  playerId: string
): void {
  // Allow early surrender in practice, but not in PvP
  if (state.current_turn < 2 && state.mode !== 'PRACTICE') {
    throw new GameError('TOO_EARLY', 'Cannot surrender before turn 2');
  }
  // ... rest unchanged
}
```

This requires adding `mode` to the check, which is available on `state.mode`.

---

## 4. iOS Client Changes

### 4.1 Add `GAME_SERVER_URL` to Config

#### 4.1.1 `ChaosCreatures/Config.xcconfig`

Add this line:

```
GAME_SERVER_URL = https://your-railway-app.railway.app
```

For local development:
```
GAME_SERVER_URL = http://localhost:3001
```

#### 4.1.2 `ChaosCreatures/ChaosCreatures/Config/Secrets.swift`

Add accessor:

```swift
static var gameServerURL: String {
    Bundle.main.object(forInfoDictionaryKey: "GAME_SERVER_URL") as? String ?? ""
}
```

#### 4.1.3 Info.plist

Add the key `GAME_SERVER_URL` with value `$(GAME_SERVER_URL)` to the Info.plist so the xcconfig value is available at runtime.

### 4.2 New Service Method: `PracticeMatchService`

Add a method to `MatchmakingService.swift` (or create a new `PracticeMatchService.swift` -- either approach works, but adding to `MatchmakingService` is simpler since the dead `startPracticeMatch` is already there).

#### 4.2.1 Replace `startPracticeMatch()` in `MatchmakingService.swift`

Replace the current dead implementation:

```swift
/// Start a practice match against AI via the game server's REST API.
/// Does NOT use the matchmaking queue or Edge Functions.
/// Calls the game server directly at POST /api/practice/start.
func startPracticeMatch(deckId: UUID) async throws -> String {
    // Reset state
    isSearching = true
    matchFound = false
    matchId = nil
    error = nil

    struct PracticeRequest: Encodable {
        let deckId: UUID

        enum CodingKeys: String, CodingKey {
            case deckId = "deck_id"
        }
    }

    struct PracticeResponse: Decodable {
        let matchId: String
        let botName: String

        enum CodingKeys: String, CodingKey {
            case matchId = "match_id"
            case botName = "bot_name"
        }
    }

    do {
        // Get the current user's access token for auth
        guard let session = await supabase.currentSession else {
            isSearching = false
            throw MatchmakingError.notAuthenticated
        }

        let gameServerURL = Secrets.gameServerURL
        guard !gameServerURL.isEmpty,
              let url = URL(string: "\(gameServerURL)/api/practice/start") else {
            isSearching = false
            throw PracticeMatchError.serverNotConfigured
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")

        let body = PracticeRequest(deckId: deckId)
        request.httpBody = try JSONEncoder().encode(body)

        let (data, httpResponse) = try await URLSession.shared.data(for: request)

        guard let response = httpResponse as? HTTPURLResponse else {
            isSearching = false
            throw PracticeMatchError.invalidResponse
        }

        guard response.statusCode == 200 else {
            isSearching = false
            // Try to decode error message
            if let errorBody = try? JSONDecoder().decode(PracticeErrorBody.self, from: data) {
                throw PracticeMatchError.serverError(errorBody.error)
            }
            throw PracticeMatchError.serverError("HTTP \(response.statusCode)")
        }

        let practiceResponse = try JSONDecoder().decode(PracticeResponse.self, from: data)

        self.matchFound = true
        self.matchId = practiceResponse.matchId
        self.isSearching = false

        return practiceResponse.matchId

    } catch let error as PracticeMatchError {
        self.isSearching = false
        self.error = error.localizedDescription
        throw error
    } catch let error as MatchmakingError {
        self.isSearching = false
        self.error = error.localizedDescription
        throw error
    } catch {
        self.isSearching = false
        self.error = "Practice match failed: \(error.localizedDescription)"
        throw error
    }
}
```

#### 4.2.2 Add Error Types

Add after `MatchmakingError`:

```swift
enum PracticeMatchError: LocalizedError {
    case serverNotConfigured
    case invalidResponse
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .serverNotConfigured:
            return "Game server URL not configured."
        case .invalidResponse:
            return "Invalid response from game server."
        case .serverError(let message):
            return "Server error: \(message)"
        }
    }
}

private struct PracticeErrorBody: Decodable {
    let error: String
}
```

### 4.3 Modify `MatchmakingView.swift`

The `MatchmakingView` currently sends ALL modes through the PvP queue via `joinQueue()`. For practice mode, it must skip the queue entirely.

#### 4.3.1 Replace `joinQueue()` Method

```swift
private func joinQueue() async {
    guard !hasJoinedQueue else { return }
    hasJoinedQueue = true

    // Practice mode: call game server directly, skip matchmaking queue
    if router.selectedGameMode == .practice {
        await startPractice()
        return
    }

    // PvP modes: use the matchmaking queue (existing flow)
    do {
        let decks: [Deck] = try await SupabaseService.shared.fetchAll(
            from: SupabaseService.Table.decks,
            filters: [("is_valid", "true")],
            limit: 1
        )
        guard let deck = decks.first else {
            joinError = "No valid deck found. Build a deck first."
            return
        }

        try await matchmakingService.joinQueue(
            deckId: deck.id,
            gameMode: router.selectedGameMode
        )
    } catch {
        joinError = error.localizedDescription
        hasJoinedQueue = false
    }
}

private func startPractice() async {
    do {
        let decks: [Deck] = try await SupabaseService.shared.fetchAll(
            from: SupabaseService.Table.decks,
            filters: [("is_valid", "true")],
            limit: 1
        )
        guard let deck = decks.first else {
            joinError = "No valid deck found. Build a deck first."
            hasJoinedQueue = false
            return
        }

        let matchId = try await matchmakingService.startPracticeMatch(deckId: deck.id)

        // Match found immediately -- navigate to battle
        // The onChange(of: matchmakingService.matchFound) handler will fire
        // and call router.navigateToBattle(matchID:)

    } catch {
        joinError = error.localizedDescription
        hasJoinedQueue = false
    }
}
```

#### 4.3.2 Update Cancel Behavior for Practice

In `cancelMatchmaking()`, the practice path does not need to call `leaveQueue()` (there is no queue entry to remove):

```swift
private func cancelMatchmaking() async {
    if router.selectedGameMode != .practice {
        await matchmakingService.leaveQueue()
    }
    matchmakingService.isSearching = false
    matchmakingService.matchFound = false
    matchmakingService.matchId = nil
    router.showMatchmaking = false
}
```

#### 4.3.3 Update Searching View Text for Practice

In the `searchingView`, change the text for practice mode:

```swift
Text(router.selectedGameMode == .practice ? "Setting up AI opponent..." : "Finding Opponent...")
    .font(.system(size: 20, weight: .bold))
    .foregroundColor(.textPrimary)
```

### 4.4 No Changes Required to BattleContainerView or MatchService

The beauty of this architecture: once the match is created and the client has a `match_id`, the battle flow is identical for PvP and practice. `BattleContainerView` connects to `match:<matchId>`, receives `game_event` broadcasts, and sends `player_action` broadcasts -- all exactly the same. The game server handles the bot's actions transparently.

The only cosmetic difference the client might want (optional, not required for initial implementation):
- Show "Practice Match" instead of opponent rank in the HUD
- Hide the "Reconnecting..." overlay timeout for bot (bot never disconnects)
- Show a different post-match screen (no XP/dust rewards displayed)

These are polish items and not required for the feature to work.

---

## 5. Data Flow: Complete Sequence

### 5.1 Happy Path: Human Wins

```
1. User taps "Practice" on Home screen
   -> AppRouter.startMatchmaking(mode: .practice)
   -> MatchmakingView appears

2. MatchmakingView.joinQueue() detects .practice mode
   -> calls startPractice()
   -> fetches first valid deck from Supabase

3. MatchmakingService.startPracticeMatch(deckId:)
   -> POST /api/practice/start
      Headers: { Authorization: "Bearer <jwt>" }
      Body: { "deck_id": "<uuid>" }

4. Game Server receives request
   -> verifySupabaseJWT() extracts user_id
   -> loads player profile from players table
   -> loads deck + deck_cards from Supabase
   -> calls buildBotDeck() to build bot cards from card_templates
   -> createMatch(matchId, 'PRACTICE', humanParticipant, botParticipant)
   -> setupMatchChannel(matchId) subscribes to match:<matchId>
   -> registerPlayer(matchId, humanPlayerId)
   -> registerPlayer(matchId, BOT_PLAYER_ID)
   -> responds: { match_id: "abc-123", bot_name: "Kael, the Bound Tyrant" }

5. iOS receives match_id
   -> matchmakingService.matchFound = true, matchId = "abc-123"
   -> MatchmakingView shows "Match Found!" animation
   -> router.navigateToBattle(matchID: "abc-123")

6. BattleContainerView appears
   -> connectToMatch() subscribes to match:abc-123
   -> MatchService.connect(matchId: "abc-123", playerId: <uuid>)
   -> receives STATE_SNAPSHOT via game_event broadcast

7. Game Server (after 2s delay) calls startNextTurn()
   -> broadcasts: TURN_START, CHAOS_ROLL, EVENT_TRIGGERED (if any),
      CARD_DRAWN (to active player), MANA_GAINED, PHASE_CHANGED
   -> If it's the human's turn, waits for player_action
   -> If it's the bot's turn, executeBotTurn() fires

8. Human plays cards, declares attackers
   -> sends player_action broadcasts: PLAY_CARD, END_MAIN_PHASE, DECLARE_ATTACKERS
   -> Server processes each, broadcasts results
   -> When human declares attackers, if bot is defender:
      -> executeBotBlockers() runs after BOT_BLOCK_DELAY_MS
      -> bot assigns blockers, broadcasts BLOCKERS_ASSIGNED
      -> combat resolves normally

9. Bot's turn
   -> executeBotTurn() fires after BOT_THINK_DELAY_MS
   -> Bot plays cards (broadcast CARD_PLAYED for each)
   -> Bot declares attackers (broadcast ATTACKERS_DECLARED)
   -> Human assigns blockers (normal flow with timer)
   -> Combat resolves, end of turn

10. Match ends (HP_ZERO or SURRENDER)
    -> finishPracticeMatch() broadcasts MATCH_END
    -> NO match_record inserted
    -> NO chaos energy awarded
    -> Room destroyed, channel unsubscribed

11. iOS receives MATCH_END
    -> BattleContainerView.handleGameOver()
    -> Transitions to PostMatchView (with practice-specific display)
```

### 5.2 Human Surrenders

```
1. Human taps Surrender in battle
2. BattleContainerView sends SURRENDER action
3. Game Server handleSurrenderAction():
   -> state.mode === 'PRACTICE', so early surrender is allowed
   -> forfeitMatch(state, humanPlayerId)
   -> finishPracticeMatch(state, matchId, 'SURRENDER')
   -> broadcasts MATCH_END with winner = PLAYER_2 (bot)
4. No match record saved, no energy awarded
```

### 5.3 Human Disconnects

```
1. iOS app goes to background or loses connection
2. Heartbeat stops arriving at game server
3. Reconnection grace period timer runs (RECONNECT_GRACE_SECONDS = 60)
4. If human reconnects:
   -> handleReconnect sends STATE_SNAPSHOT
   -> game continues normally
5. If human does NOT reconnect within grace period:
   -> For practice: simply clean up the match (forfeit bot wins, no record saved)
   -> In PvP this would be a disconnect loss, but in practice it does not matter
```

---

## 6. Message Formats

All messages between iOS and Game Server use the existing Supabase Realtime broadcast protocol. No new message types are needed for practice matches. The bot's actions produce the same server events as a human player's actions.

### 6.1 Practice Start API (New)

**Request:**
```json
POST /api/practice/start
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "deck_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "match_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "bot_name": "Kael, the Bound Tyrant"
}
```

**Error Responses:**

401:
```json
{ "error": "Unauthorized" }
```

400:
```json
{ "error": "deck_id is required" }
{ "error": "Player profile not found" }
{ "error": "Deck not found or does not belong to player" }
```

500:
```json
{ "error": "Failed to create practice match: <details>" }
```

### 6.2 Match Communication (Unchanged)

All match communication uses the existing `game_event` broadcast on `match:<matchId>`. No changes to any broadcast format. The iOS client does not need to know or care whether the opponent is a bot or a human -- the server events are identical.

---

## 7. Bot Deck Strategy

### 7.1 Card Selection

1. Query all `card_templates` with `card_type IN ('CREATURE', 'SPELL')`
2. Exclude `STABILIZER` (bot does not use instability management strategies)
3. Build a 20-card deck with target ratio: 16 creatures, 4 spells
4. Prioritize mana costs 2-4 for creatures (good curve)
5. Allow up to 2 copies of each template (standard deck-building rule)
6. If fewer than 20 cards available, fill with duplicates

### 7.2 Mana Curve Target

| Cost | Target Count | Priority |
|------|-------------|----------|
| 1    | 2-3         | Medium   |
| 2    | 4-5         | High     |
| 3    | 4-5         | High     |
| 4    | 3-4         | High     |
| 5    | 1-2         | Medium   |
| 6+   | 0-1         | Low      |

### 7.3 Fallback Deck

If no card_templates exist in the database (empty database), the bot uses a hardcoded fallback deck of 20 vanilla creatures with a standard mana curve. See `generateFallbackDeck()` in Section 3.2.1.

### 7.4 Bot Difficulty

Single difficulty level: "Normal". The bot:
- Plays the most expensive creature it can afford each turn (greedy mana use)
- Attacks with all available creatures every turn (aggressive)
- Blocks the highest-ATK attacker with the lowest-value blocker (defensive efficiency)
- Does not play spells (no targeting logic)
- Does not use Chaos Spark
- Does not consider board state beyond basic slot availability
- Has realistic timing delays (1-2 seconds per action)

This produces a competent but beatable opponent suitable for learning the game.

---

## 8. Files to Create

| File | Purpose |
|------|---------|
| `packages/game-server/src/bot/ai.ts` | Bot constants, deck builder, AI decision engine |
| `packages/game-server/src/bot/runner.ts` | Bot turn orchestrator, timing, lifecycle |

## 9. Files to Modify

| File | Changes |
|------|---------|
| `packages/game-server/src/index.ts` | Add `POST /api/practice/start` endpoint, add `verifySupabaseJWT()` helper, import bot modules |
| `packages/game-server/src/ws/handler.ts` | Add bot automation hooks in `startNextTurn()`, `handleDeclareAction()`, `finishMatch()`, and `handleSurrenderAction()` |
| `ChaosCreatures/Config.xcconfig` | Add `GAME_SERVER_URL` key |
| `ChaosCreatures/ChaosCreatures/Config/Secrets.swift` | Add `gameServerURL` accessor |
| `ChaosCreatures/ChaosCreatures/Services/MatchmakingService.swift` | Replace `startPracticeMatch()`, add `PracticeMatchError` |
| `ChaosCreatures/ChaosCreatures/Views/Battle/MatchmakingView.swift` | Branch `joinQueue()` on practice mode, add `startPractice()`, update UI text |

Info.plist must also be updated to include the `GAME_SERVER_URL` key with value `$(GAME_SERVER_URL)`.

---

## 10. What NOT to Do

1. **Do NOT store practice match results** in `match_records` or `matches` tables. The bot's `BOT_PLAYER_ID` does not exist in the `players` table, and practice games should not affect player stats.
2. **Do NOT award chaos energy** for practice matches. Card progression is a PvP-only reward.
3. **Do NOT create a database entry for the bot player.** The bot exists only in-memory during the match.
4. **Do NOT modify the matchmaking queue** for practice. Practice bypasses the queue entirely.
5. **Do NOT create new Supabase Edge Functions** for practice. The game server handles everything directly.
6. **Do NOT change any existing broadcast message formats.** The client treats practice matches identically to PvP matches at the protocol level.

---

## 11. Testing Checklist

### Backend
- [ ] `POST /api/practice/start` returns 401 without JWT
- [ ] `POST /api/practice/start` returns 400 with missing deck_id
- [ ] `POST /api/practice/start` returns 400 with invalid deck_id
- [ ] `POST /api/practice/start` returns 200 with valid JWT and deck_id
- [ ] Match is created in-memory with mode `PRACTICE`
- [ ] Bot is always PLAYER_2
- [ ] Bot deck is built from card_templates (or fallback if empty)
- [ ] Supabase Realtime channel is set up correctly
- [ ] First turn starts after 2-second delay
- [ ] Bot plays cards during its main phase
- [ ] Bot declares attackers
- [ ] Bot assigns blockers when defending
- [ ] Bot actions have realistic timing delays
- [ ] Match ends normally on HP_ZERO
- [ ] Match ends on human surrender (even before turn 2)
- [ ] No match_record is inserted for practice matches
- [ ] No chaos energy is awarded for practice matches
- [ ] Room and channel are cleaned up after match ends

### iOS
- [ ] Practice mode calls game server directly (not Edge Function)
- [ ] MatchmakingView shows "Setting up AI opponent..." for practice
- [ ] Match found navigates to BattleContainerView
- [ ] Battle plays normally (cards, attacks, blocks all work)
- [ ] Surrender works in practice mode
- [ ] Cancel during setup works (no queue entry to remove)
- [ ] Error handling for missing GAME_SERVER_URL
- [ ] Error handling for game server unreachable

---

## Revision Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-17 | Game Architect Agent | Initial spec created |

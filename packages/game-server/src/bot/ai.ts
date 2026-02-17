// Chaos Creatures Game Server — Bot AI Decision Engine
// Contains bot constants, deck builder, and AI decision logic for practice matches.
// Source: docs/design/PRACTICE-MATCH-SPEC.md Section 3.1

import type { BattleCard, BattleCreature, BattlePlayer, GameState } from '../types/game-state';
import type { Keyword, CardType } from '../types/enums';
import { getSupabase } from '../services/supabase';
import { MAX_BOARD_SLOTS } from '../engine/constants';
import { randomUUID } from 'crypto';

// ─── Bot Constants ─────────────

/** Delay before bot starts its turn actions */
export const BOT_THINK_DELAY_MS = 1500;

/** Delay between individual bot actions (play card, attack, etc.) */
export const BOT_ACTION_DELAY_MS = 800;

/** Delay before bot assigns blockers */
export const BOT_BLOCK_DELAY_MS = 1000;

/** Fixed UUID for the bot player — never collides with real players */
export const BOT_PLAYER_ID = '00000000-0000-0000-0000-000000000000';

/** Fixed UUID for the bot's synthetic deck */
export const BOT_DECK_ID = '00000000-0000-0000-0000-000000000001';

/** Fixed avatar ID for the bot: Kael, the Bound Tyrant */
export const BOT_AVATAR_ID = 'b0000000-0000-0000-0000-000000000005';

// ─── Bot Deck Config ─────────────

export interface BotDeckConfig {
  faction_id?: string;   // If provided, only use cards from this faction. Otherwise, use all factions.
  card_count: number;    // Always 20
}

// ─── Bot Action Types ─────────────

export interface BotPlayCardAction {
  type: 'PLAY_CARD';
  card_id: string;
  target_slot: number;
}

export type BotAction = BotPlayCardAction;

// ─── Bot Deck Builder ─────────────

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

// ─── Bot AI Engine ─────────────

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

// ─── Helpers ─────────────

function getBotPlayer(state: GameState): BattlePlayer {
  // Bot is always PLAYER_2
  return state.player_2;
}

function getOpponentPlayer(state: GameState): BattlePlayer {
  // Human is always PLAYER_1 from the bot's perspective
  return state.player_1;
}

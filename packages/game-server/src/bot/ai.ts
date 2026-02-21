// Chaos Creatures Game Server — Bot AI Decision Engine
// Contains bot constants, deck builder, and AI decision logic for practice matches.
// Source: docs/design/PRACTICE-MATCH-SPEC.md Section 3.1

import type { BattleCard, BattleCreature, BattleRuin, BattlePlayer, GameState } from '../types/game-state';
import type { Keyword, CardType, FactionId } from '../types/enums';
import { getSupabase } from '../services/supabase';
import { MAX_BOARD_SLOTS, MAX_RUINS_ON_FIELD, MAX_STABILIZERS_PER_TURN } from '../engine/constants';
import { isBattleCreature, isBattleRuin } from '../engine/effects';
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

/** Fixed avatar ID for the bot — default Kael, the Bound Tyrant */
export const BOT_AVATAR_ID = 'b0000000-0000-0000-0000-000000000005';

/** Avatar IDs per faction for bot variety */
export const BOT_FACTION_AVATARS: Record<string, { avatar_id: string; instability_modifier: number; faction_id: string }> = {
  IRONWRIGHT: {
    avatar_id: 'b0000000-0000-0000-0000-000000000001',
    instability_modifier: 3,
    faction_id: 'a0000000-0000-0000-0000-000000000001',
  },
  FEY_COURTS: {
    avatar_id: 'b0000000-0000-0000-0000-000000000003',
    instability_modifier: 5,
    faction_id: 'a0000000-0000-0000-0000-000000000002',
  },
  DEMONIC_KINGDOMS: {
    avatar_id: 'b0000000-0000-0000-0000-000000000005',
    instability_modifier: 7,
    faction_id: 'a0000000-0000-0000-0000-000000000003',
  },
  CELESTIAL_CRUSADE: {
    avatar_id: 'b0000000-0000-0000-0000-000000000007',
    instability_modifier: 4,
    faction_id: 'a0000000-0000-0000-0000-000000000004',
  },
  THE_ENDLESS: {
    avatar_id: 'b0000000-0000-0000-0000-000000000009',
    instability_modifier: 6,
    faction_id: 'a0000000-0000-0000-0000-000000000005',
  },
};

/** All faction IDs the bot can pick from */
const ALL_FACTION_IDS: FactionId[] = ['IRONWRIGHT', 'FEY_COURTS', 'DEMONIC_KINGDOMS', 'CELESTIAL_CRUSADE', 'THE_ENDLESS'];

/**
 * Pick a random faction for the bot.
 */
export function pickRandomBotFaction(): FactionId {
  const idx = Math.floor(Math.random() * ALL_FACTION_IDS.length);
  return ALL_FACTION_IDS[idx];
}

/**
 * Get the bot's avatar config for a given faction.
 */
export function getBotFactionConfig(factionId: FactionId) {
  return BOT_FACTION_AVATARS[factionId] ?? BOT_FACTION_AVATARS.DEMONIC_KINGDOMS;
}

// ─── Bot Deck Config ─────────────

export interface BotDeckConfig {
  faction_id?: string;   // If provided, only use cards from this faction. Otherwise, use all factions.
  card_count: number;    // Always 30 (deck size changed from 20 to 30)
}

// ─── Bot Action Types ─────────────

export interface BotPlayCardAction {
  type: 'PLAY_CARD';
  card_id: string;
  target_slot: number;
}

export interface BotPlayStabilizerAction {
  type: 'PLAY_STABILIZER';
  card_id: string;
}

export interface BotActivateStabilizerAction {
  type: 'ACTIVATE_STABILIZER';
  instance_id: string;
}

export type BotAction = BotPlayCardAction | BotPlayStabilizerAction | BotActivateStabilizerAction;

// ─── Bot Deck Builder ─────────────

/**
 * Build a bot deck from card_templates in the database.
 *
 * Strategy:
 * 1. Query all active card_templates
 * 2. Filter to CREATURE, SPELL, and optionally PLANAR_RUIN types
 * 3. Build a balanced deck with a good mana curve
 * 4. Convert card_templates into BattleCard[] with synthetic instance IDs
 *
 * The bot has NO card_instances in the database. All cards are synthesized
 * in-memory from card_templates with fake instance IDs.
 *
 * If no faction_id is provided, a random faction is chosen for variety.
 */
export async function buildBotDeck(config: BotDeckConfig = { card_count: 30 }): Promise<BattleCard[]> {
  const supabase = getSupabase();

  // If no faction specified, pick a random one for bot variety
  const factionId = config.faction_id ?? getBotFactionConfig(pickRandomBotFaction()).faction_id;

  // Query all active card templates including PLANAR_RUIN and STABILIZER
  const { data: templates, error } = await supabase
    .from('card_templates')
    .select('id, name, card_type, faction_id, mana_cost, base_attack, base_health, base_instability, base_keywords, art_url, stabilizer_type, activated_effect')
    .in('card_type', ['CREATURE', 'SPELL', 'PLANAR_RUIN', 'STABILIZER']);

  if (error || !templates || templates.length === 0) {
    // Fallback: generate a hardcoded starter deck
    return generateFallbackDeck();
  }

  // Filter by faction
  let pool = templates;
  const factionCards = templates.filter((t: any) => t.faction_id === factionId);
  if (factionCards.length >= 10) {
    pool = factionCards;
  }
  // Otherwise use full pool (faction may not have enough cards yet)

  // Separate by card type
  const creatures = pool.filter((t: any) => t.card_type === 'CREATURE');
  const spells = pool.filter((t: any) => t.card_type === 'SPELL');
  const ruins = pool.filter((t: any) => t.card_type === 'PLANAR_RUIN');
  const stabilizers = pool.filter((t: any) => t.card_type === 'STABILIZER');

  // Target: 22 creatures, 4 spells, 1 ruin, 3 stabilizers (if available), total 30
  const targetRuins = Math.min(1, ruins.length);
  const targetSpells = Math.min(4, spells.length);
  const targetStabilizers = Math.min(3, stabilizers.length);
  const targetCreatures = Math.min(
    config.card_count - targetSpells - targetRuins - targetStabilizers,
    creatures.length
  );

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

  // Select ruins (max 1 for bot decks)
  for (const ruin of ruins) {
    if (selectedCards.length >= targetCreatures + targetSpells + targetRuins) break;
    selectedCards.push(ruin);
  }

  // Select stabilizers (up to 3 for bot decks)
  for (const stabilizer of stabilizers) {
    if (selectedCards.length >= targetCreatures + targetSpells + targetRuins + targetStabilizers) break;
    const count = templateCounts[stabilizer.id] || 0;
    if (count < 2) {
      selectedCards.push(stabilizer);
      templateCounts[stabilizer.id] = count + 1;
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

  // Mana curve: 6x 1-cost, 6x 2-cost, 6x 3-cost, 6x 4-cost, 4x 5-cost, 2x 6-cost (total 30)
  const curve = [
    { cost: 1, atk: 1, hp: 2, count: 6 },
    { cost: 2, atk: 2, hp: 2, count: 6 },
    { cost: 3, atk: 3, hp: 3, count: 6 },
    { cost: 4, atk: 4, hp: 4, count: 6 },
    { cost: 5, atk: 5, hp: 5, count: 4 },
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
 * 1. Play ruins first if bot has board space and no ruin on field
 * 2. Play creatures if board has empty slots, prioritizing by mana efficiency
 * 3. Play the most expensive creature the bot can afford first (greedy mana use)
 * 4. Haste creatures are prioritized when bot is low on HP (immediate damage)
 * 5. Ward creatures are prioritized when opponent has many creatures (modifier protection)
 * 6. Celestial (Exalt) bot prioritizes getting creature count up
 * 7. Do not play spells (bot does not target -- spells require targeting logic)
 * 8. Stop when out of mana or no playable cards remain
 */
export function decideBotMainPhase(state: GameState): BotAction[] {
  const bot = getBotPlayer(state);
  const opponent = getOpponentPlayer(state);
  const actions: BotAction[] = [];
  let ruinPlayed = false;

  // Determine how many empty board slots remain
  const emptySlotCount = bot.board.filter(s => s === null).length;
  const opponentCreatureCount = opponent.board.filter(s => s !== null && isBattleCreature(s)).length;

  // Play stabilizer first (free, one per turn, goes to stability_zone)
  const hasStabilizerAvailable = bot.hand.some(c => c.card_type === 'STABILIZER');
  if (hasStabilizerAvailable && bot.stabilizers_played_this_turn < MAX_STABILIZERS_PER_TURN) {
    const stabCard = bot.hand.find(c => c.card_type === 'STABILIZER');
    if (stabCard) {
      actions.push({
        type: 'PLAY_STABILIZER',
        card_id: stabCard.instance_id,
      });
    }
  }

  // Activate any non-cooldown stabilizers in stability_zone (simple strategy: always activate)
  for (const stabilizer of bot.stability_zone) {
    if (!stabilizer.is_on_cooldown) {
      actions.push({
        type: 'ACTIVATE_STABILIZER',
        instance_id: stabilizer.instance_id,
      });
    }
  }

  // Sort hand by priority: ruins first (if no ruin on field), then creatures by mana cost descending
  const playableCards = [...bot.hand]
    .filter((card) => {
      if (card.mana_cost > bot.current_mana) return false;

      if (card.card_type === 'PLANAR_RUIN') {
        // Can only play if no ruin on field and there's an empty slot
        return !bot.ruin_on_board && !ruinPlayed && emptySlotCount > 0;
      }
      if (card.card_type === 'CREATURE') {
        // Need an empty board slot
        return bot.board.some((slot) => slot === null);
      }
      // Stabilizers are handled above (free, no mana cost check needed)
      // Skip spells for now (targeting is complex)
      return false;
    })
    .sort((a, b) => {
      // Ruins first (strategic placement), then creatures by mana cost
      if (a.card_type === 'PLANAR_RUIN' && b.card_type !== 'PLANAR_RUIN') return -1;
      if (b.card_type === 'PLANAR_RUIN' && a.card_type !== 'PLANAR_RUIN') return 1;

      // Haste creatures prioritized when bot is low on HP
      if (bot.current_hp <= 8) {
        const aHasHaste = a.innate_keywords.includes('HASTE') ? 1 : 0;
        const bHasHaste = b.innate_keywords.includes('HASTE') ? 1 : 0;
        if (aHasHaste !== bHasHaste) return bHasHaste - aHasHaste;
      }

      // Ward creatures prioritized when opponent has many creatures (lots of modifier effects)
      if (opponentCreatureCount >= 3) {
        const aHasWard = a.innate_keywords.includes('WARD') ? 1 : 0;
        const bHasWard = b.innate_keywords.includes('WARD') ? 1 : 0;
        if (aHasWard !== bHasWard) return bHasWard - aHasWard;
      }

      // Otherwise sort by mana cost descending (play biggest first)
      return b.mana_cost - a.mana_cost;
    });

  let remainingMana = bot.current_mana;

  for (const card of playableCards) {
    if (card.mana_cost > remainingMana) continue;

    // Find first empty slot
    const emptySlot = bot.board.findIndex((slot) => slot === null);
    if (emptySlot === -1) break;

    // For ruins, check the limit again (may have changed during this planning loop)
    if (card.card_type === 'PLANAR_RUIN') {
      if (bot.ruin_on_board || ruinPlayed) continue;
      ruinPlayed = true;
    }

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
 * Decide which creatures to declare as attackers and which ruins to target.
 *
 * Strategy:
 * 1. Attack with ALL eligible creatures (alive, not Stabilizer, not Ruin, not summoning sick unless Haste)
 * 2. Respect P1 Turn 1 restriction (no attacks)
 * 3. Obey Taunt forced-attack rules (must attack with at least minAttackers)
 * 4. Consider targeting opponent's ruins if they provide strong passive effects
 *
 * Returns attacker IDs and optional ruin targets.
 */
export function decideBotAttackers(state: GameState): { attackerIds: string[]; ruinTargets: Record<string, string> } {
  const bot = getBotPlayer(state);
  const opponent = getOpponentPlayer(state);

  // P1 Turn 1 restriction
  if (state.current_turn === 1 && state.active_player === state.first_player) {
    return { attackerIds: [], ruinTargets: {} };
  }

  const attackerIds: string[] = [];
  for (const entity of bot.board) {
    if (!entity) continue;
    if (!entity.is_alive) continue;
    // Ruins cannot attack (0 ATK structures). Stabilizers are in stability_zone, not on the board.
    if (entity.card_type === 'PLANAR_RUIN') continue;
    if (!isBattleCreature(entity)) continue;
    // Summoning sickness: can't attack unless Haste
    if (entity.summoning_sick && !entity.active_keywords.includes('HASTE')) continue;
    attackerIds.push(entity.instance_id);
  }

  // Check if opponent has ruins that should be targeted
  const ruinTargets: Record<string, string> = {};
  const opponentRuin = opponent.board.find(
    e => e !== null && isBattleRuin(e) && e.is_alive
  );

  // Check if opponent has Taunt creatures — if so, we must attack them, not ruins
  const opponentHasTaunt = opponent.board.some(
    e => e !== null && isBattleCreature(e) && e.is_alive && e.active_keywords.includes('TAUNT')
  );

  if (opponentRuin && !opponentHasTaunt && attackerIds.length > 0) {
    // Assign one attacker to target the ruin (the weakest attacker, to not waste big damage on a structure)
    // Find the attacker with the lowest ATK
    let weakestAttackerId: string | null = null;
    let weakestAtk = Infinity;
    for (const id of attackerIds) {
      const creature = bot.board.find(e => e && e.instance_id === id) as BattleCreature | undefined;
      if (creature && creature.attack < weakestAtk) {
        weakestAtk = creature.attack;
        weakestAttackerId = creature.instance_id;
      }
    }
    if (weakestAttackerId) {
      ruinTargets[weakestAttackerId] = opponentRuin.instance_id;
    }
  }

  return { attackerIds, ruinTargets };
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

  // Get all available blockers (alive creatures, not Ruins)
  // Stabilizers are in stability_zone, never on the board.
  const availableBlockers: BattleCreature[] = [];
  for (const entity of bot.board) {
    if (!entity) continue;
    if (!entity.is_alive) continue;
    if (!isBattleCreature(entity)) continue;
    if (entity.card_type === 'PLANAR_RUIN') continue;
    availableBlockers.push(entity);
  }

  // Get all declared attackers (only actual creatures)
  const attackerCreatures: BattleCreature[] = [];
  for (const attackerId of state.declared_attackers) {
    for (const entity of attacker.board) {
      if (entity && entity.instance_id === attackerId && entity.is_alive && isBattleCreature(entity)) {
        attackerCreatures.push(entity);
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

// Chaos Creatures Game Server — Test Helpers
// Factory functions for creating test game states, creatures, and players

import type {
  GameState,
  BattlePlayer,
  BattleCreature,
  BattleCard,
  BattleModifier,
  TriggeredAbility,
  Effect,
} from '../src/types/game-state';
import type {
  Keyword,
  PlayerSide,
  TurnPhase,
  EventType,
  SeasonRank,
} from '../src/types/enums';
import {
  STARTING_HP,
  MAX_HP,
  MAX_MANA,
  MAX_BOARD_SLOTS,
} from '../src/engine/constants';
import { generateMatchSeed } from '../src/engine/rng';

let idCounter = 0;
function nextId(): string {
  idCounter++;
  return `test-${idCounter.toString().padStart(8, '0')}`;
}

/** Reset the ID counter (call in beforeEach) */
export function resetIds(): void {
  idCounter = 0;
}

/** Create a minimal BattleCard for testing */
export function createTestCard(overrides: Partial<BattleCard> = {}): BattleCard {
  return {
    instance_id: nextId(),
    template_id: nextId(),
    card_type: 'CREATURE',
    name: 'Test Creature',
    mana_cost: 2,
    art_url: 'https://test.com/art.webp',
    base_attack: 2,
    base_health: 3,
    base_instability: 2,
    innate_keywords: [],
    modifiers: [],
    triggered_abilities: [],
    faction_id: 'test-faction',
    ...overrides,
  };
}

/** Create a BattleCreature on the board */
export function createTestCreature(
  slot: number,
  overrides: Partial<BattleCreature> = {}
): BattleCreature {
  const card = createTestCard(overrides);
  return {
    ...card,
    attack: card.base_attack ?? 2,
    health: card.base_health ?? 3,
    max_health: card.base_health ?? 3,
    has_attacked: false,
    is_alive: true,
    instability_value: card.base_instability,
    active_keywords: [...card.innate_keywords],
    shield_active: card.innate_keywords.includes('SHIELD'),
    temp_buffs: [],
    board_slot: slot,
    ...overrides,
  };
}

/** Create a creature with specific keywords */
export function createKeywordCreature(
  slot: number,
  keywords: Keyword[],
  atk: number = 3,
  hp: number = 3
): BattleCreature {
  return createTestCreature(slot, {
    base_attack: atk,
    base_health: hp,
    attack: atk,
    health: hp,
    max_health: hp,
    innate_keywords: keywords,
    active_keywords: keywords,
    shield_active: keywords.includes('SHIELD'),
  });
}

/** Create a test BattlePlayer */
export function createTestPlayer(
  side: PlayerSide,
  overrides: Partial<BattlePlayer> = {}
): BattlePlayer {
  return {
    player_id: nextId(),
    side,
    avatar_id: nextId(),
    avatar_instability_modifier: -3,
    current_hp: STARTING_HP,
    max_hp: MAX_HP,
    current_mana: 5,
    mana_cap: MAX_MANA,
    instability: 1,
    board: Array(MAX_BOARD_SLOTS).fill(null),
    hand: [],
    deck: [],
    graveyard: [],
    has_chaos_spark: false,
    last_event_type: null,
    consecutive_missed_turns: 0,
    is_connected: true,
    deck_id: nextId(),
    faction_id: 'test-faction',
    season_rank: 'BRONZE_3' as SeasonRank,
    ...overrides,
  };
}

/** Create a full GameState for testing */
export function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  const p1 = createTestPlayer('PLAYER_1');
  const p2 = createTestPlayer('PLAYER_2', { has_chaos_spark: true });
  const seed = generateMatchSeed();

  return {
    match_id: nextId(),
    mode: 'RANKED',
    started_at: new Date().toISOString(),
    current_turn: 0,
    active_player: 'PLAYER_1',
    phase: 'GAME_SETUP' as TurnPhase,
    player_1: p1,
    player_2: p2,
    first_player: 'PLAYER_1',
    declared_attackers: [],
    blocker_assignments: [],
    last_roll_value: null,
    last_roll_event: null,
    last_roll_event_id: null,
    turn_timer_started: null,
    turn_timer_seconds: 60,
    log: [],
    winner: null,
    rng_seed: seed,
    rng_counter: 0,
    ...overrides,
  };
}

/** Place a creature on a player's board */
export function placeCreature(
  player: BattlePlayer,
  slot: number,
  creature: BattleCreature
): void {
  creature.board_slot = slot;
  player.board[slot] = creature;
}

/** Create a test modifier */
export function createTestModifier(overrides: Partial<BattleModifier> = {}): BattleModifier {
  return {
    definition_id: nextId(),
    name: 'Test Modifier',
    pool_type: 'UNIVERSAL',
    attunement: 'ORDER',
    base_effect: {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'SELF',
      value: 1,
    },
    attuned_effect: {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'SELF',
      value: 1,
    },
    has_penalty: false,
    grants_keyword: undefined,
    keyword_is_attuned: false,
    instability_adjustment: 0,
    instability_is_attuned: false,
    is_attuned_active: false,
    is_penalty_active: false,
    ...overrides,
  };
}

/** Create a test triggered ability */
export function createTestAbility(overrides: Partial<TriggeredAbility> = {}): TriggeredAbility {
  return {
    id: nextId(),
    card_instance_id: 'test',
    evolution_step: 1,
    trigger: 'ON_ORDER',
    effect: {
      effect_type: 'STAT_MODIFY_ATTACK',
      target: 'SELF',
      value: 1,
      duration: 'THIS_TURN',
    },
    description: 'Test ability',
    name: 'Test Ability',
    ...overrides,
  };
}

/** Fill a player's deck with test cards */
export function fillDeck(player: BattlePlayer, count: number = 20): void {
  player.deck = Array.from({ length: count }, () => createTestCard());
}

/** Fill a player's hand with test cards */
export function fillHand(player: BattlePlayer, count: number = 4): void {
  player.hand = Array.from({ length: count }, () => createTestCard());
}

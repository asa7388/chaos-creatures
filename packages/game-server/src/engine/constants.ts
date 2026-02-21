// Chaos Creatures Game Server — Game Constants
// Source: docs/design/01-battle-mechanics.md, 02-card-data-model.md, 06-technical-architecture.md

/** Starting HP for each player */
export const STARTING_HP = 20;

/** Maximum HP for each player */
export const MAX_HP = 20;

/** Board slots per player */
export const MAX_BOARD_SLOTS = 5;

/** Maximum hand size (no hard limit in rules, but 10 is reasonable UI cap) */
export const MAX_HAND_SIZE = 10;

/** Deck size */
export const DECK_SIZE = 30;

/** Maximum stabilizers that can be played per turn */
export const MAX_STABILIZERS_PER_TURN = 1;

/** Maximum mana (chaos mote cap) */
export const MAX_MANA = 10;

/** P1 opening hand size */
export const P1_HAND_SIZE = 4;

/** P2 opening hand size (before Chaos Spark) */
export const P2_HAND_SIZE = 5;

/** Turn timer in seconds (decision phases) */
export const TURN_TIMER_SECONDS = 60;

/** Event choice sub-timer in seconds */
export const EVENT_CHOICE_TIMER_SECONDS = 10;

/** Timer warning threshold (seconds remaining) */
export const TIMER_WARNING_SECONDS = 15;

/** Consecutive missed turns before auto-forfeit */
export const MAX_MISSED_TURNS = 3;

/** Reconnection grace period in seconds */
export const RECONNECT_GRACE_SECONDS = 60;

/** D20 range */
export const D20_MIN = 1;
export const D20_MAX = 20;

/** Instability clamp range */
export const INSTABILITY_MIN = 1;
export const INSTABILITY_MAX = 20;

/** Creature instability floor */
export const CREATURE_INSTABILITY_MIN = 0;

/** Event pool size (8 Order, 8 Chaos) */
export const EVENT_POOL_SIZE = 8;

/** Matchmaking poll interval (ms) */
export const MATCHMAKING_POLL_INTERVAL_MS = 2000;

/** Initial rank range for matchmaking (+/- tiers) */
export const INITIAL_RANK_RANGE = 2;

/** Max rank range for matchmaking after expansion */
export const MAX_RANK_RANGE = 5;

/** Rank range expansion interval (seconds of wait time) */
export const RANK_RANGE_EXPANSION_INTERVAL = 5;

/** Evolution energy thresholds */
export const EVOLUTION_THRESHOLDS = {
  UNCOMMON: 15,
  RARE: 30,
  EPIC: 50,
  LEGENDARY: 75,
} as const;

/** Energy earned per game */
export const ENERGY_PER_WIN = 2;
export const ENERGY_PER_LOSS = 1;

/** Planar Ruin limits */
export const MAX_RUINS_ON_FIELD = 1;
export const MAX_RUINS_IN_DECK = 2;

/** Ward duration (turns after deployment) */
export const WARD_DURATION_TURNS = 1;

/** Ruin familiarity progression */
export const RUIN_FAMILIARITY_WIN = 2;
export const RUIN_FAMILIARITY_LOSS = 1;
export const RUIN_FAMILIARITY_THRESHOLD = 10;

/** Maximum lingering effects per player (Persist mechanic) */
export const MAX_LINGERING_EFFECTS = 3;

// Chaos Creatures — Game Constants
// TODO: Expand with full constants in Wave 1
// See docs/design/01-battle-mechanics.md and 04-progression-economy.md.

/** Maximum cards per deck */
export const DECK_SIZE = 20;

/** Maximum creatures on board per player */
export const MAX_BOARD_SLOTS = 5;

/** Starting player HP */
export const STARTING_HP = 20;

/** Maximum mana */
export const MAX_MANA = 10;

/** Turn timer in seconds */
export const TURN_TIMER_SECONDS = 60;

/** Evolution energy thresholds per stage */
export const EVOLUTION_THRESHOLDS = [15, 30, 50, 75] as const;

/** Energy earned per win */
export const ENERGY_PER_WIN = 2;

/** Energy earned per loss */
export const ENERGY_PER_LOSS = 1;

/** Instability range */
export const INSTABILITY_MIN = 1;
export const INSTABILITY_MAX = 20;

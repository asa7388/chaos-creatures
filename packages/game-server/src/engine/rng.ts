// Chaos Creatures Game Server — Seeded PRNG
// Deterministic pseudorandom number generator for reproducible match outcomes.
// Uses a simple mulberry32 algorithm — fast, well-distributed, seedable.

export class SeededRNG {
  private originalSeed: number;
  private state: number;
  private counter: number;

  constructor(seed: number) {
    this.originalSeed = seed >>> 0;
    this.state = seed >>> 0;
    this.counter = 0;
  }

  /** Get the current RNG counter (for serialization) */
  getCounter(): number {
    return this.counter;
  }

  /** Get the original seed (for serialization/replay) */
  getSeed(): number {
    return this.originalSeed;
  }

  /** Generate a random float in [0, 1) */
  next(): number {
    this.counter++;
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Generate a random integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Shuffle an array in place using Fisher-Yates */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** Create a new SeededRNG from the current state (for forking) */
  fork(): SeededRNG {
    return new SeededRNG(this.state);
  }

  /** Restore from a saved state */
  static fromState(seed: number, counter: number): SeededRNG {
    const rng = new SeededRNG(seed);
    // Advance to the saved counter
    for (let i = 0; i < counter; i++) {
      rng.next();
    }
    return rng;
  }
}

/** Generate a random seed for a new match */
export function generateMatchSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

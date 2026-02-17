// Chaos Creatures — Shared Type Definitions
// Canonical enum types shared across game-server, Edge Functions, admin dashboard.
// Must match: DB enums (00001_enums.sql), Swift enums (Enums.swift), Edge Function types.

/** Faction identifiers */
export type FactionId = 'IRONWRIGHT' | 'FEY_COURTS' | 'DEMONIC_KINGDOMS';

/** Card type */
export type CardType = 'CREATURE' | 'SPELL' | 'STABILIZER';

/** Keyword identifiers */
export type Keyword = 'SHIELD' | 'LIFESTEAL' | 'FLYING' | 'REACH' | 'DEATHTOUCH' | 'TAUNT' | 'PIERCING';

/** Evolution tier (replaces "Rarity" — cards evolve, not drop at rarity) */
export type EvolutionTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

/** Match status */
export type MatchStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

/** Subscription tier */
export type SubscriptionTier = 'FREE' | 'MID' | 'HIGH';

/** Evolution stage (0 = base, 4 = max) */
export type EvolutionStage = 0 | 1 | 2 | 3 | 4;

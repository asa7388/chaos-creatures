// Chaos Creatures — Shared Type Definitions
// TODO: Implement full type definitions in Wave 1
// See docs/design/02-card-data-model.md for the complete data model.

/** Faction identifiers */
export type FactionId = 'IRONWRIGHT' | 'FEY_COURTS' | 'DEMONIC';

/** Card type */
export type CardType = 'CREATURE' | 'SPELL';

/** Keyword identifiers */
export type Keyword = 'SHIELD' | 'LIFESTEAL' | 'FLYING' | 'REACH' | 'DEATHTOUCH' | 'TAUNT' | 'PIERCING';

/** Rarity tiers */
export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

/** Match status */
export type MatchStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

/** Subscription tier */
export type SubscriptionTier = 'FREE' | 'MID' | 'TOP';

/** Evolution stage (0 = base, 4 = max) */
export type EvolutionStage = 0 | 1 | 2 | 3 | 4;

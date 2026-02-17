// Chaos Creatures Game Server — All Game Enums
// Source of truth: docs/design/02-card-data-model.md

/** Card type */
export type CardType = 'CREATURE' | 'SPELL' | 'STABILIZER';

/** 7 creature keywords */
export type Keyword = 'SHIELD' | 'LIFESTEAL' | 'FLYING' | 'REACH' | 'DEATHTOUCH' | 'TAUNT' | 'PIERCING';

/** Evolution tier */
export type EvolutionTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

/** Event type — Order/Chaos roll result */
export type EventType = 'ORDER' | 'CHAOS';

/** Chaos roll outcome including "nothing" (exact match) */
export type ChaosRollOutcome = 'ORDER' | 'CHAOS' | 'NOTHING';

/** Player side in a match */
export type PlayerSide = 'PLAYER_1' | 'PLAYER_2';

/** Turn phases — state machine states */
export type TurnPhase =
  | 'GAME_SETUP'
  | 'START_OF_TURN'
  | 'CHAOS_ROLL'
  | 'EVENT_RESOLUTION'
  | 'DRAW_AND_MANA'
  | 'MAIN_PHASE'
  | 'DECLARE_ATTACKERS'
  | 'ASSIGN_BLOCKERS'
  | 'COMBAT_RESOLUTION'
  | 'END_TURN'
  | 'GAME_OVER';

/** Faction short identifiers */
export type FactionId = 'IRONWRIGHT' | 'FEY_COURTS' | 'DEMONIC_KINGDOMS';

/** Faction exclusive mechanic */
export type FactionMechanic = 'AUGMENT' | 'BOND' | 'CORRUPTION';

/** Modifier pool type */
export type ModifierPoolType = 'UNIVERSAL' | 'FACTION';

/** Modifier tier bracket */
export type TierBracket = 'EARLY' | 'LATE';

/** Stabilizer type */
export type StabilizerType = 'ORDER' | 'CHAOS' | 'HYBRID';

/** Effect type — atomic game logic unit */
export type EffectType =
  | 'STAT_MODIFY_ATTACK'
  | 'STAT_MODIFY_HEALTH'
  | 'STAT_MODIFY_COST'
  | 'DAMAGE'
  | 'HEAL'
  | 'HEAL_PLAYER'
  | 'DRAW_CARD'
  | 'GAIN_MANA'
  | 'GRANT_KEYWORD'
  | 'REMOVE_KEYWORD'
  | 'DESTROY_CREATURE'
  | 'SUMMON_TOKEN'
  | 'DOUBLE_MODIFIER_ACTIVATION'
  | 'COST_REDUCTION';

/** Spell-specific effect types */
export type SpellEffectType =
  | 'DAMAGE'
  | 'HEAL'
  | 'BUFF_ATTACK'
  | 'BUFF_HEALTH'
  | 'DRAW'
  | 'GAIN_MANA'
  | 'GRANT_KEYWORD'
  | 'REMOVE_KEYWORD'
  | 'DESTROY'
  | 'INSTABILITY_MODIFY'
  | 'INSTABILITY_SET'
  | 'CHOOSE_EVENT_TYPE'
  | 'COST_REDUCTION';

/** Target type for effects */
export type TargetType =
  | 'SELF'
  | 'FRIENDLY_CREATURE'
  | 'ENEMY_CREATURE'
  | 'ANY_CREATURE'
  | 'ALL_FRIENDLY'
  | 'ALL_ENEMY'
  | 'ALL_CREATURES'
  | 'RANDOM_FRIENDLY'
  | 'RANDOM_ENEMY'
  | 'RANDOM_ANY'
  | 'LOWEST_HP_FRIENDLY'
  | 'LOWEST_HP_ENEMY'
  | 'HIGHEST_ATK_FRIENDLY'
  | 'HIGHEST_ATK_ENEMY'
  | 'HIGHEST_COST_IN_HAND'
  | 'PLAYER_SELF'
  | 'PLAYER_OPPONENT';

/** Duration of effects */
export type Duration = 'THIS_TURN' | 'PERMANENT' | 'WHILE_ON_FIELD' | 'UNTIL_NEXT_ROLL';

/** Triggered ability trigger types */
export type TriggerType =
  | 'ON_ORDER'
  | 'ON_CHAOS'
  | 'ON_PLAY'
  | 'ON_DEATH'
  | 'ON_DAMAGE_TAKEN'
  | 'ON_ATTACK'
  | 'ON_BLOCK';

/** Condition type for conditional effects */
export type ConditionType =
  | 'NONE'
  | 'CREATURE_COUNT_GTE'
  | 'HEALTH_BELOW'
  | 'BOARD_FULL'
  | 'LAST_EVENT_WAS'
  | 'TARGET_AT_FULL_HP'
  | 'HAS_KEYWORD';

/** Game mode */
export type GameMode = 'RANKED' | 'CASUAL' | 'PRACTICE';

/** End reason for a match */
export type EndReason = 'HP_ZERO' | 'SURRENDER' | 'DISCONNECT' | 'TIMEOUT';

/** Log entry types */
export type LogEntryType =
  | 'ROLL'
  | 'EVENT_TRIGGERED'
  | 'CARD_PLAYED'
  | 'CARD_DRAWN'
  | 'ATTACK_DECLARED'
  | 'BLOCKER_ASSIGNED'
  | 'COMBAT_DAMAGE'
  | 'CREATURE_DESTROYED'
  | 'SPELL_CAST'
  | 'MODIFIER_ACTIVATED'
  | 'TRIGGER_FIRED'
  | 'HP_CHANGED'
  | 'MANA_CHANGED'
  | 'INSTABILITY_CHANGED'
  | 'GAME_START'
  | 'GAME_END'
  | 'SURRENDER'
  | 'CHAOS_SPARK_USED'
  | 'TURN_START'
  | 'TURN_TIMEOUT';

/** Subscription tier */
export type SubscriptionTier = 'FREE' | 'MID' | 'HIGH';

/** Season rank */
export type SeasonRank =
  | 'BRONZE_3' | 'BRONZE_2' | 'BRONZE_1'
  | 'SILVER_3' | 'SILVER_2' | 'SILVER_1'
  | 'GOLD_3' | 'GOLD_2' | 'GOLD_1'
  | 'PLATINUM_3' | 'PLATINUM_2' | 'PLATINUM_1'
  | 'DIAMOND_3' | 'DIAMOND_2' | 'DIAMOND_1'
  | 'MASTER' | 'GRANDMASTER';

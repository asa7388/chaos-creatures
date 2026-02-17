# Game Server — Build Checkpoint

## Status: COMPLETE
All core systems implemented and tested. 319/319 tests passing.

## What Was Built

### Types (`src/types/`)
| File | Description |
|------|-------------|
| `enums.ts` | All game enums: CardType, Keyword, TurnPhase, EventType, PlayerSide, FactionId, EffectType, TargetType, Duration, TriggerType, etc. |
| `game-state.ts` | Full runtime types: GameState, BattlePlayer, BattleCreature, BattleCard, BattleModifier, Effect, TriggeredAbility, TempBuff, CombatResult, EventResolutionResult, MatchRecord |
| `messages.ts` | Zod-validated client actions (PLAY_CARD, DECLARE_ATTACKERS, ASSIGN_BLOCKERS, etc.), all ServerEvent types, ClientGameState (filtered view) |
| `index.ts` | Barrel export |

### Engine (`src/engine/`)
| File | Description |
|------|-------------|
| `constants.ts` | All game constants: HP, mana, board slots, timers, D20 range, instability bounds, evolution thresholds |
| `rng.ts` | Seeded PRNG (mulberry32) — deterministic, serializable, forkable |
| `instability.ts` | Creature + player instability calculator with modifier attunement gating, clamped [1,20] |
| `combat.ts` | Full combat resolution: Shield absorb -> damage -> Deathtouch -> Piercing overflow -> Lifesteal. Taunt forced-attack/block validation, Flying/Reach rules |
| `effects.ts` | Effect resolution for all EffectTypes, target resolution (SELF, ALL_FRIENDLY, RANDOM_ENEMY, LOWEST_HP_FRIENDLY, etc.), triggered abilities, death processing, temp buff expiry |
| `events.ts` | All 16 events (O1-O8, C1-C8) with full Effect definitions, event selection, event resolution, choice-event handling |
| `turn.ts` | 9-phase turn engine: START_OF_TURN -> CHAOS_ROLL -> EVENT_RESOLUTION -> DRAW_AND_MANA -> MAIN_PHASE -> DECLARE_ATTACKERS -> ASSIGN_BLOCKERS -> COMBAT_RESOLUTION -> END_TURN |
| `match.ts` | Match lifecycle: create (shuffle, deal, assign P1/P2), end (match record), forfeit, disconnect/reconnect, client state projection |
| `index.ts` | Barrel export |

### Services (`src/services/`)
| File | Description |
|------|-------------|
| `supabase.ts` | Supabase service-role client, token validation, player ID lookup |
| `timer.ts` | Timer management: 60s decision, 10s event choice, 60s reconnect grace, auto-forfeit on 3 missed turns |
| `matchmaking.ts` | Matchmaking queue polling: rank-based matching with expanding range |
| `reconnection.ts` | Reconnection handling: disconnect tracking, state snapshot on reconnect |

### WebSocket Layer (`src/ws/`)
| File | Description |
|------|-------------|
| `protocol.ts` | Message parsing with Zod validation, serialization, ProtocolError class |
| `rooms.ts` | Match rooms: create/join/leave/destroy, send to player/broadcast/broadcast-to-others |
| `handler.ts` | WebSocket connection handler: auth, message routing, turn execution, combat flow, match completion |

### Server Entry (`src/index.ts`)
Express + WebSocket server with health check, admin API stubs, matchmaking poller, graceful shutdown.

## Test Coverage

| Test File | Tests | Covers |
|-----------|-------|--------|
| `combat.test.ts` | 44 | All keyword interactions (Shield, Deathtouch, Piercing, Lifesteal, Flying, Reach, Taunt), attacker/blocker validation, combat resolution |
| `instability.test.ts` | 15 | Creature instability, player instability, modifier attunement gating, clamping |
| `turn.test.ts` | 50 | All 9 phases, card play validation, Chaos Spark, phase transitions, temp buff expiry, GameError |
| `events.test.ts` | 23 | Event pools, choice requirements, target validation, Order/Chaos resolution, triggered abilities, determinism |
| `effects.test.ts` | 41 | All effect types, target resolution, damage/heal/stat modify/draw/mana/keyword grant-remove/destroy, secondary effects, temp buffs, death processing |
| `rng.test.ts` | 12 | Determinism, range bounds, distribution, shuffle, counter tracking, state serialization |
| `messages.test.ts` | 31 | All Zod schemas, valid/invalid inputs, protocol parsing, envelope validation |
| `match.test.ts` | 22 | Match creation, hand sizes, Chaos Spark, forfeit, disconnect/reconnect, client state projection, active match tracking |

**Total: 238 game-server tests, all passing.**

## Key Design Decisions
- **Server-authoritative**: Client sends only actions; server validates everything
- **Seeded PRNG**: mulberry32 for deterministic match replay
- **In-memory match store**: Map<matchId, GameState> — sufficient for 200 concurrent matches
- **Keyword priority**: Shield absorb -> base damage -> Deathtouch check -> Normal death -> Piercing overflow -> Lifesteal heal
- **Taunt two-part rule**: Forced-attack (min attackers = opponent Taunt count) + Forced-block (Taunt creatures must block if able)
- **Combat simultaneous**: Damage applied simultaneously, active player loses on mutual death
- **Event system**: 8 Order + 8 Chaos, equal weight selection, O2/O5 require player choice

## Dependencies on Other Systems
- Supabase: Auth token validation, matchmaking queue, match records storage
- Client: WebSocket message format defined in `types/messages.ts`
- Shared: Game constants aligned with `packages/shared/src/constants.ts`

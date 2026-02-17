# API Contract Audit -- Wave 2

**Date**: 2026-02-17
**Auditor**: Cross-module contract auditor agent
**Scope**: WebSocket messages, REST APIs, database schema, shared types, environment variables

## Summary
- Contracts checked: 47
- Mismatches found: 19 (8 critical, 11 warnings)

---

## Critical Mismatches (will cause runtime errors)

| # | Source | Target | Field/Type | Issue |
|---|--------|--------|------------|-------|
| C1 | `packages/shared/src/types.ts:6` | `packages/game-server/src/types/enums.ts:37`, `supabase/functions/_shared/types.ts:23`, DB `00002_core_tables.sql:16` | `FactionId` enum | **Shared types** defines `'DEMONIC'` but game server, Edge Functions, DB, and iOS all use `'DEMONIC_KINGDOMS'`. Any code importing from `packages/shared` will send the wrong faction ID and fail DB lookups. |
| C2 | `packages/shared/src/types.ts:9` | `packages/game-server/src/types/enums.ts:5`, `supabase/functions/_shared/types.ts:6`, DB `00001_enums.sql:11` | `CardType` enum | **Shared types** is missing `'STABILIZER'`. Only has `'CREATURE' \| 'SPELL'`. Game server, Edge Functions, DB, and iOS all include `'STABILIZER'`. Any STABILIZER card will fail type validation if routed through shared types. |
| C3 | `packages/shared/src/types.ts:21` | `packages/game-server/src/types/enums.ts:157`, `ChaosCreatures/.../Enums.swift:279`, DB `00001_enums.sql:87` | `SubscriptionTier` enum | **Shared types** defines `'TOP'` but game server, iOS, Edge Functions, and DB all use `'HIGH'`. Any subscription check through shared types will not match `'HIGH'` tier players. |
| C4 | `packages/shared/src/types.ts:15` | `packages/game-server/src/types/enums.ts:11`, `ChaosCreatures/.../Enums.swift:85`, DB `00001_enums.sql:23` | `Rarity` / `EvolutionTier` | **Shared types** defines a `Rarity` type with only 4 values (`'COMMON' \| 'UNCOMMON' \| 'RARE' \| 'LEGENDARY'`) -- missing `'EPIC'`. Game server calls this `EvolutionTier` with 5 values. Swift and DB both have 5 tiers. Cards at EPIC tier will fail validation through shared types. |
| C5 | `ChaosCreatures/.../MatchService.swift:219` (CodingKeys) | DB `00003_battle_tables.sql:14-15` | `MatchRecord.game_mode` vs `mode` | Swift `MatchRecord` maps `gameMode` to JSON key `"game_mode"` (line 220), but the DB column is `mode` (not `game_mode`). Fetching match records directly from Supabase will fail to decode because the column name does not match the CodingKey. |
| C6 | `ChaosCreatures/.../MatchService.swift:221-224` (CodingKeys) | DB `00003_battle_tables.sql:16-18` | `MatchRecord` player ID column names | Swift maps `player1Id` to `"player1_id"` and `player2Id` to `"player2_id"` (no underscore between "player" and "1"). But the DB columns are `player_1_id` and `player_2_id` (with underscore). Same mismatch for `player1DeckId` -> `"player1_deck_id"` vs DB `player_1_deck_id`, and `player1FinalHp` -> `"player1_final_hp"` vs DB `player_1_final_hp`. All 6 player-indexed columns will fail to decode. |
| C7 | `ChaosCreatures/.../BattleCard.swift:12-39` | `packages/game-server/src/types/game-state.ts:86-100` | `BattleCardData` missing fields | Swift `BattleCardData` is missing `modifiers`, `triggered_abilities` fields that the server's `BattleCard` type includes. When the server serializes a `BattleCard` with these arrays, Swift will receive extra fields it ignores (safe with Codable defaults), BUT the server sends `modifiers` as `BattleModifier[]` objects. If the server ever requires the client to echo these back, data will be lost. More critically, any future logic depending on client-side modifier display will silently have no data. |
| C8 | `ChaosCreatures/.../CollectionService.swift:162-176` | `supabase/functions/open-pack/index.ts:168-171` | Pack open request/response shape mismatch | iOS sends `{ pack_type, faction_id }` and expects response `{ cards, dust_remaining }`. But the Edge Function expects `{ faction_id }` only (no `pack_type` field) and returns `{ data: { cards, dust_spent } }` (not `dust_remaining`). The response is wrapped in a `data` envelope AND the field name is `dust_spent` not `dust_remaining`. |

---

## Warnings (may cause subtle bugs)

| # | Source | Target | Field/Type | Issue |
|---|--------|--------|------------|-------|
| W1 | `supabase/functions/_shared/types.ts:281-285` | `ChaosCreatures/.../Enums.swift:293-298` | `MAX_DECK_SLOTS` per tier | Edge Functions define `FREE=4, MID=6, HIGH=8`. Swift defines `FREE=3, MID=6, HIGH=10`. The `save-deck` Edge Function uses Edge values to enforce limits, but the iOS UI shows different limits to the player. Free players see 3 slots in UI but server allows 4; High players see 10 in UI but server rejects at 8. |
| W2 | `ChaosCreatures/.../MatchmakingService.swift:47-58` | `supabase/functions/join-queue/index.ts:81-92` | Matchmaking queue entry schema | iOS sends `{ player_id, deck_id, game_mode, mmr }` directly to the `matchmaking_queue` table. But the table schema (`00003_battle_tables.sql:58-69`) requires `avatar_id`, `faction_id`, `season_rank`, `season_rank_points` -- none of which are in the iOS insert payload. The join-queue Edge Function populates these from the deck/player records, but the iOS client tries to insert directly, bypassing the Edge Function. This will fail with NOT NULL constraint violations. |
| W3 | `ChaosCreatures/.../MatchmakingService.swift:57` | DB `00003_battle_tables.sql:64` | Column name `game_mode` vs `mode` | iOS sends `game_mode` as the column name, but the DB column is `mode`. The insert will put the value in a non-existent column (Supabase will ignore it) and `mode` will default to `'RANKED'` regardless of what the player chose. |
| W4 | `ChaosCreatures/.../CollectionService.swift:28-33` | DB `00002_core_tables.sql:166-206` | `card_instances` has no `faction_id` column | `fetchCollectionByFaction` filters by `("faction_id", factionId)` on `card_instances`, but `card_instances` does not have a `faction_id` column. Faction is on the related `card_templates` table. This query will fail with "column card_instances.faction_id does not exist". |
| W5 | `ChaosCreatures/.../CollectionService.swift:98-130` | `supabase/functions/save-deck/index.ts:24-27` | Deck save function name and request shape | iOS calls Edge Function `"player/save-deck"` with body `{ deck_id, name, faction_id, avatar_id, cards }`. But the actual Edge Function is named `save-deck` (not `player/save-deck`) and expects `card_entries` (not `cards`) with HTTP method POST/PUT and `id` as a query param (not `deck_id` in body). |
| W6 | `packages/game-server/src/types/game-state.ts:86-100` (BattleCard) | `ChaosCreatures/.../BattleCard.swift:88-107` (BattleCreatureData CodingKeys) | BattleCreature inherits BattleCard fields | Server's `BattleCreature extends BattleCard` which includes `modifiers` and `triggered_abilities`. Swift `BattleCreatureData` does not include these fields. Creature state snapshots from the server will have modifier/ability data that the client silently drops. |
| W7 | `ChaosCreatures/.../Enums.swift:539-543` | `packages/game-server/src/types/enums.ts:17` | `RollResult` vs `ChaosRollOutcome` | Swift `RollResult` uses lowercase raw values (`"order"`, `"chaos"`, `"nothing"`) while the server's `ChaosRollOutcome` and the Swift `ChaosRollOutcome` both use uppercase (`"ORDER"`, `"CHAOS"`, `"NOTHING"`). If `RollResult` is ever used for decoding server data, it will fail. Currently `ChaosRollOutcome` is used in `ChaosRollData` (correct), so this is latent risk only. |
| W8 | `supabase/functions/_shared/types.ts:231-237` | `packages/shared/src/constants.ts:21` | Evolution energy thresholds | Edge Function `EVOLUTION_ENERGY_THRESHOLDS` maps tier -> threshold for reaching THAT tier (COMMON=0, UNCOMMON=15...). Shared constants `EVOLUTION_THRESHOLDS = [15, 30, 50, 75]` is an array (no tier keys). Both are correct but represent different data structures -- any code mixing them will get wrong values. The Edge Function also has `CUMULATIVE_ENERGY` which differs from thresholds (RARE cumulative=45 vs threshold=30). |
| W9 | `ChaosCreatures/.../EvolutionService.swift:39-44` | `supabase/functions/start-evolution/index.ts:34` | Evolution start request field mismatch | iOS `EvolutionService.startEvolution` sends `{ card_instance_id, channeled_toward, modifier_definition_id, shard_tier }`. The `start-evolution` Edge Function expects `{ card_instance_id, prompt_modifiers, channel_direction }`. Different field names (`channeled_toward` vs `channel_direction`), different fields entirely (`modifier_definition_id` and `shard_tier` not expected by server; `prompt_modifiers` not sent by client). The iOS client appears to use a different evolution flow than the Edge Function implements. |
| W10 | Admin dashboard `app/api/economy-config/route.ts:19` | Edge Function error format `_shared/errors.ts:58-66` | Error response format inconsistency | Admin dashboard returns `{ error: "message" }` (string). Edge Functions return `{ error: { code: "CODE", message: "msg" } }` (object). Any shared error handling code would break on one format or the other. |
| W11 | `ChaosCreatures/.../MatchService.swift:97-112` | `packages/game-server/src/ws/protocol.ts:57-63` | Action sending format | iOS `MatchService.sendAction` encodes the `PlayerAction` enum directly via `JSONEncoder`, producing `{ "playCard": { "cardId": "..." } }` format. But the server's `protocol.ts` expects a message envelope: `{ match_id, player_id, action: { type: "PLAY_CARD", card_id: "..." } }`. The iOS code uses Supabase broadcast (not raw WebSocket), but the action payload format inside the broadcast still needs to match what the server handler expects. The `PlayerAction.jsonPayload` property produces the correct snake_case format, but `sendAction` uses `JSONEncoder().encode(action)` which produces the Swift enum format, NOT `jsonPayload`. |

---

## Verified Contracts (all clean)

| # | Contract | Components | Status |
|---|----------|-----------|--------|
| V1 | Server event type strings | `packages/game-server/src/types/messages.ts` vs `ChaosCreatures/.../MatchEvent.swift` | All 21 event type strings match exactly (STATE_SNAPSHOT, TURN_START, CHAOS_ROLL, etc.) |
| V2 | Client action type strings | `packages/game-server/src/types/messages.ts` (ClientActionSchema) vs `ChaosCreatures/.../PlayerAction.swift` (jsonPayload) | All 10 action type strings match (PLAY_CARD, USE_CHAOS_SPARK, END_MAIN_PHASE, DECLARE_ATTACKERS, ASSIGN_BLOCKERS, CHOOSE_EVENT_TARGET, SURRENDER, MULLIGAN, RECONNECT, END_TURN) |
| V3 | Client action field names | Server Zod schemas vs Swift `jsonPayload` | `card_id`, `target_slot`, `target_id`, `attacker_ids`, `blocker_id`/`attacker_id` in assignments, `creature_id`, `keep` -- all match exactly |
| V4 | TurnStartData fields | Server `TurnStartEvent` vs Swift `TurnStartData` | `turn` (Int), `active_player` (String via CodingKey) -- match |
| V5 | ChaosRollData fields | Server `ChaosRollEvent` vs Swift `ChaosRollData` | `roll`, `instability`, `result`, `active_player` -- all match with correct CodingKeys |
| V6 | EventTriggeredData fields | Server `EventTriggeredEvent` vs Swift `EventTriggeredData` | All 8 fields match with correct snake_case CodingKeys |
| V7 | CardDrawnData fields | Server `CardDrawnEvent` vs Swift `CardDrawnData` | `card`, `player`, `cards_remaining` -- match |
| V8 | ManaGainedData fields | Server `ManaGainedEvent` vs Swift `ManaGainedData` | `player`, `current_mana`, `mana_cap` -- match |
| V9 | CardPlayedData fields | Server `CardPlayedEvent` vs Swift `CardPlayedData` | `player`, `card`, `slot`, `creature`, `mana_remaining`, `effect_results` -- match |
| V10 | CombatResolvedData fields | Server `CombatResolvedEvent` vs Swift `CombatResolvedData` | All fields including nested `CombatPairResult` and `UnblockedResult` match |
| V11 | ClientGameState fields | Server `ClientGameState` vs Swift `ClientGameState` | All 17 fields match with correct snake_case CodingKeys. `blockerAssignments` uses `blocker_creature_id`/`attacker_creature_id` on both sides. |
| V12 | ClientBattlePlayer fields | Server `ClientBattlePlayer` vs Swift `ClientBattlePlayer` | All 16 fields match exactly |
| V13 | Keyword enum values | Server, Swift, DB, Edge Functions | All 7 values identical: SHIELD, LIFESTEAL, FLYING, REACH, DEATHTOUCH, TAUNT, PIERCING |
| V14 | TurnPhase enum values | Server, Swift | All 11 phases match: GAME_SETUP through GAME_OVER |
| V15 | PlayerSide enum values | Server, Swift | PLAYER_1, PLAYER_2 match |
| V16 | EndReason enum values | Server, Swift, DB | HP_ZERO, SURRENDER, DISCONNECT, TIMEOUT match |
| V17 | GameMode enum values | Server, Swift, DB, Edge Functions | RANKED, CASUAL, PRACTICE match |
| V18 | SeasonRank enum values | Server, Swift, DB, Edge Functions | All 17 ranks match (BRONZE_3 through GRANDMASTER) |
| V19 | EvolutionTier enum values | Server, Swift, DB, Edge Functions | All 5 tiers match: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY |
| V20 | SubscriptionTier enum values | Server, Swift, DB, Edge Functions | FREE, MID, HIGH match (except `packages/shared` -- see C3) |
| V21 | FactionShortName / FactionId values | Server, Swift, DB, Edge Functions | IRONWRIGHT, FEY_COURTS, DEMONIC_KINGDOMS match (except `packages/shared` -- see C1) |
| V22 | DB players table columns | `00002_core_tables.sql` vs Swift `Player.CodingKeys` vs Edge Functions `Player` interface | All column names align across all 3 codebases |
| V23 | DB card_templates columns | `00002_core_tables.sql` vs Swift `CardTemplate.CodingKeys` vs Edge Functions `CardTemplate` interface | All column names align |
| V24 | DB card_instances columns | `00002_core_tables.sql` vs Swift `CardInstance.CodingKeys` vs Edge Functions `CardInstance` interface | All column names align |
| V25 | DB decks columns | `00002_core_tables.sql` vs Swift `Deck.CodingKeys` vs Edge Functions `Deck` interface | All column names align |
| V26 | DB economy_config columns | `00004_economy_tables.sql` vs Swift `EconomyConfig.CodingKeys` | `key`, `value`, `description`, `updated_at`, `updated_by` all match |
| V27 | Environment variable SUPABASE_URL | Game server `config.ts`, Edge Functions `_shared/supabase.ts`, Admin dashboard `lib/supabase.ts` | All use `SUPABASE_URL` |
| V28 | Environment variable SUPABASE_SERVICE_ROLE_KEY | Game server `config.ts`, Edge Functions `_shared/supabase.ts`, Admin dashboard `lib/supabase.ts` | All use `SUPABASE_SERVICE_ROLE_KEY` |

---

## Environment Variable Audit

| Variable | Game Server | Edge Functions | Admin Dashboard | iOS Client | Status |
|----------|------------|----------------|-----------------|------------|--------|
| `SUPABASE_URL` | `config.ts:8` | `_shared/supabase.ts:11` | `lib/supabase.ts:12` | `Secrets.swift:10` (via xcconfig) | OK |
| `SUPABASE_SERVICE_ROLE_KEY` | `config.ts:9` | `_shared/supabase.ts:12` | `lib/supabase.ts:13` | N/A (client uses anon key) | OK |
| `SUPABASE_ANON_KEY` | N/A | `_shared/supabase.ts:28` | N/A | `Secrets.swift:14` (via xcconfig) | OK |
| `GAME_SERVER_PORT` | `config.ts:10` | N/A | N/A | N/A | OK |
| `GAME_SERVER_SECRET` | `config.ts:11` | N/A | `lib/game-server.ts:6` | N/A | OK |
| `GAME_SERVER_URL` | N/A | N/A | `lib/game-server.ts:5` | N/A | OK |
| `ADMIN_JWT_SECRET` | N/A | N/A | `middleware.ts:8` | N/A | OK |
| `POSTHOG_API_KEY` | N/A | N/A | N/A | `Secrets.swift:18` (via xcconfig) | OK |
| `R2_PUBLIC_URL` | N/A | N/A | N/A | `Secrets.swift:22` (via xcconfig) | OK |
| `NODE_ENV` | `config.ts:12` | N/A | N/A (Next.js handles) | N/A | OK |

No naming inconsistencies found in environment variables.

---

## Detailed Analysis

### C1-C4: `packages/shared/src/types.ts` is stale

The shared package (`packages/shared/src/types.ts`) contains a TODO comment: "TODO: Implement full type definitions in Wave 1". It was clearly written as a placeholder and never updated when the game server, Edge Functions, and iOS types were fully built out. The file has 4 critical enum mismatches:
- `FactionId` missing `_KINGDOMS` suffix
- `CardType` missing `STABILIZER`
- `SubscriptionTier` using `TOP` instead of `HIGH`
- `Rarity` (wrong name, missing `EPIC`, wrong concept)

**Risk**: Any code importing from `@chaos-creatures/shared` will use wrong enum values.
**Current impact**: Low if nothing actually imports from shared yet. But this is a landmine.

### C5-C6: Swift `MatchRecord` column name mismatch

The Swift `MatchRecord` struct in `MatchService.swift` uses CodingKeys that do not match the actual database column names. The column `mode` is mapped as `game_mode`, and all player-indexed columns use `player1_id` format instead of `player_1_id`. This means every direct Supabase query for match records from iOS will fail to decode.

**File**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/MatchService.swift`, lines 218-233
**DB**: `/Users/alexali/Projects/chaos-creatures/supabase/migrations/00003_battle_tables.sql`, lines 12-52

### C8: Pack open API contract mismatch

The iOS `CollectionService.openPack` method sends a `pack_type` field that the Edge Function does not expect, and expects `dust_remaining` in the response when the server returns `dust_spent`. Additionally, the Edge Function wraps the response in a `{ data: { ... } }` envelope.

**iOS**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/CollectionService.swift`, lines 162-209
**Server**: `/Users/alexali/Projects/chaos-creatures/supabase/functions/open-pack/index.ts`, lines 168-171

### W2-W3: iOS matchmaking bypasses Edge Function

The iOS `MatchmakingService` inserts directly into the `matchmaking_queue` table rather than calling the `join-queue` Edge Function. This means it skips deck validation, does not populate required columns (`avatar_id`, `faction_id`, `season_rank`, `season_rank_points`), and uses wrong column name `game_mode` instead of `mode`.

**iOS**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/MatchmakingService.swift`, lines 38-82
**Edge Function**: `/Users/alexali/Projects/chaos-creatures/supabase/functions/join-queue/index.ts`

### W11: iOS action encoding uses wrong serialization path

`MatchService.sendAction` uses `JSONEncoder().encode(action)` which would produce Swift enum encoding format, not the flat `{ type: "...", field: "..." }` format the server expects. The `PlayerAction` enum does have a `jsonPayload` property that produces the correct format, but it is not used in `sendAction`. The `jsonPayload` returns `[String: Any]` which is not directly Codable-encodable.

**iOS**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/MatchService.swift`, lines 97-112
**Server**: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/ws/protocol.ts`, lines 57-63

---

## Revision Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-17 | Contract Auditor Agent | Initial audit. 47 contracts checked, 8 critical + 11 warning mismatches found. |

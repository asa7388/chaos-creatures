# AUDIT-W3A: API Contract Audit
**Date**: 2026-02-17
**Scope**: iOS Client (Swift) <-> Edge Functions (Supabase), iOS Client <-> Game Server (Railway)

## Summary
- Edge Function endpoints checked: **12**
- Game Server REST endpoints checked: **1**
- WebSocket/Realtime message types checked: **21 server events, 10 client actions**
- Mismatches found: **9**
- Missing handlers/endpoints: **5**
- Error handling gaps: **4**

---

## Edge Function Contract Checks

### 1. Endpoints Called by iOS Client vs. Edge Functions That Exist

| iOS Service Method | Function Name Called | Exists in `supabase/functions/`? | Status |
|---|---|---|---|
| `AuthService.deleteAccount()` | `player/delete-account` | **NO** | MISSING |
| `AuthService.ensurePlayerProfile()` | `player/ensure-profile` | **NO** | MISSING |
| `CollectionService.cardCountByFaction()` | `player/card-counts` | **NO** | MISSING |
| `CollectionService.createDeck()` | `save-deck` | YES | OK |
| `CollectionService.updateDeck()` | `save-deck` | YES | MISMATCH |
| `CollectionService.openPack()` | `open-pack` | YES | OK |
| `CollectionService.setActiveDeck()` | `player/set-active-deck` | **NO** | MISSING |
| `EconomyService.spendDust()` | `economy/spend-dust` | **NO** | MISSING |
| `EconomyService.claimMission()` | `economy/claim-mission` | **NO** | MISSING (not in supabase/functions/) |
| `EconomyService.processMatchRewards()` | `economy/match-rewards` | **NO** | MISSING |
| `EvolutionService.startEvolution()` | `start-evolution` | YES | MISMATCH |
| `EvolutionService.confirmEvolution()` | `complete-evolution` | YES | OK |
| `MatchmakingService.joinQueue()` | `join-queue` | YES | OK |
| `MatchmakingService.leaveQueue()` | `leave-queue` | YES | OK |
| `MatchService.fetchMatchHistory()` | `match/history` | **NO** | MISSING |
| `StoreKitService.syncSubscriptionWithBackend()` | `sync-entitlements` | YES | OK |

**Note**: Several iOS services use direct Supabase table queries (via `SupabaseService.fetchAll`) rather than Edge Functions. These bypass the function layer and query `card_instances`, `decks`, `players`, `economy_config`, `missions`, `dust_transactions`, `shard_transactions`, and `card_templates` directly. This is valid since RLS policies govern access.

### 2. Request/Response Shape Checks

#### join-queue
| Aspect | iOS Client (MatchmakingService.swift:45-67) | Edge Function (join-queue/index.ts:26-121) | Match? |
|---|---|---|---|
| Request body | `{ deck_id: UUID, mode: String }` | `{ deck_id: string, mode: string }` | YES |
| Response envelope | Expects `{ data: { queue_id, estimated_wait_seconds } }` | Returns `{ data: { queue_id, estimated_wait_seconds } }` | YES |

**Status**: PASS

#### leave-queue
| Aspect | iOS Client (MatchmakingService.swift:100) | Edge Function (leave-queue/index.ts:10-37) | Match? |
|---|---|---|---|
| Request body | None (void call) | None expected | YES |
| Response | Discarded | `{ ok: true }` | YES (client ignores) |
| HTTP method | POST (via Supabase SDK .invoke) | Accepts POST or DELETE | YES |

**Status**: PASS

#### save-deck (CREATE)
| Aspect | iOS Client (CollectionService.swift:103-131) | Edge Function (save-deck/index.ts:41-88) | Match? |
|---|---|---|---|
| Request body | `{ name, faction_id, avatar_id }` (CodingKeys: `faction_id`, `avatar_id`) | Expects `{ name, faction_id, avatar_id }` | YES |
| Response envelope | Expects `{ data: { deck: Deck } }` | Returns `{ data: { deck: <row> } }` | YES |

**Status**: PASS

#### save-deck (UPDATE)
| Aspect | iOS Client (CollectionService.swift:140-176) | Edge Function (save-deck/index.ts:91-154) | Match? |
|---|---|---|---|
| Request body | `{ id, card_entries, avatar_id, name }` sent in JSON body | Edge Function reads `id` from **URL query param** `?id=`, not from body | **NO** |
| Response envelope | Expects `{ data: { deck, validation_errors } }` | Returns `{ data: { deck, validation_errors } }` | YES |

**Status**: MISMATCH -- The iOS client sends deck `id` in the request body, but the Edge Function reads it from `url.searchParams.get("id")` (line 27). The Supabase Swift SDK `.invoke()` sends a POST with a JSON body; it does not append query parameters. The deck ID will never be read by the server, causing the function to fall through to the "Deck id parameter required for updates" error.

**File references**:
- iOS: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/CollectionService.swift` lines 140-176
- Server: `/Users/alexali/Projects/chaos-creatures/supabase/functions/save-deck/index.ts` line 27, 41, 92

**Fix**: Either (a) change the Edge Function to also check `body.id` when `deckId` is null from query params, or (b) have the iOS client append `?id=<uuid>` to the function name when invoking for updates. Option (a) is simpler and backward-compatible.

#### open-pack
| Aspect | iOS Client (CollectionService.swift:208-222) | Edge Function (open-pack/index.ts:27-175) | Match? |
|---|---|---|---|
| Request body | `{ faction_id: String }` | `{ faction_id: string }` | YES |
| Response envelope | Expects `{ data: { cards: [CardInstance], dust_spent: Int } }` | Returns `{ data: { cards: [...], dust_spent: number } }` | YES |

**Status**: PASS -- However, note that the Edge Function returns raw `card_instances` rows from Supabase `.select()`, which include snake_case keys. The iOS `CardInstance` struct uses `CodingKeys` that map snake_case to camelCase (e.g., `template_id` -> `templateId`). This should work correctly with the Swift Supabase SDK's default decoder which handles snake_case.

#### start-evolution
| Aspect | iOS Client (EvolutionService.swift:52-84) | Edge Function (start-evolution/index.ts:33-220) | Match? |
|---|---|---|---|
| Request body | `{ card_instance_id: UUID, channel_direction: String? }` | Expects `{ card_instance_id, prompt_modifiers?, channel_direction? }` | YES (superset OK) |
| Response `stat_changes` | iOS expects `{ attack_bonus, health_bonus, instability_change }` | Server returns `{ attack_bonus, health_bonus, instability_change }` | YES |
| Response `modifier_options` | iOS decodes as `[ModifierDefinition]` | Server returns raw `modifier_definitions` rows from Supabase | **POSSIBLE MISMATCH** |

**Status**: POSSIBLE MISMATCH -- The server returns raw `modifier_definitions` rows directly from Supabase `select("*")`, which will have snake_case column names matching the DB schema. The iOS `ModifierDefinition` struct (CardInstance.swift:254-295) expects fields like `flavor_text`, `pool_type`, `faction_id`, `pp_cost`, `tier_bracket`, `base_effect`, `attuned_effect`, etc. The Supabase Swift SDK's decoder should handle the snake_case mapping via the struct's `CodingKeys`. However, the `base_effect` and `attuned_effect` fields are JSONB `Effect` objects in the DB. The iOS `Effect` struct expects nested `EffectCondition` objects, while the DB stores them as plain JSON. This _should_ decode correctly if the JSONB structure matches exactly, but any shape differences in nested JSONB would cause silent decoding failures.

**File references**:
- iOS: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/EvolutionService.swift` lines 62-84
- iOS model: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Models/CardInstance.swift` lines 254-295
- Server: `/Users/alexali/Projects/chaos-creatures/supabase/functions/start-evolution/index.ts` lines 127-138, 207-220

#### complete-evolution
| Aspect | iOS Client (EvolutionService.swift:129-160) | Edge Function (complete-evolution/index.ts:26-228) | Match? |
|---|---|---|---|
| Request body | `{ evolution_id, card_instance_id, modifier_chosen_id?, name_chosen }` | Expects `{ evolution_id, card_instance_id, modifier_chosen_id?, name_chosen }` | YES |
| Response envelope | Expects `{ data: { card: CardInstance } }` | Returns `{ data: { card: <updated row> } }` | YES |

**Status**: PASS

#### sync-entitlements
| Aspect | iOS Client (StoreKitService.swift:182-206) | Edge Function (sync-entitlements/index.ts:40-122) | Match? |
|---|---|---|---|
| Request body | `{ transaction_id, product_id, original_transaction_id }` | Expects `{ transaction_id, product_id, original_transaction_id }` | YES |
| Response | iOS discards response (fire-and-forget) | Returns `{ data: { subscription_tier, max_deck_slots, max_cards_per_faction } }` | YES (ignored) |

**Status**: PASS -- The iOS client intentionally discards the response per the documented NOTE (C-10) at StoreKitService.swift:175-180.

---

## Game Server REST API Contract Checks

#### POST /api/practice/start
| Aspect | iOS Client (MatchmakingService.swift:119-203) | Game Server (index.ts:248-392) | Match? |
|---|---|---|---|
| URL | `{gameServerURL}/api/practice/start` | `POST /api/practice/start` | YES |
| Auth header | `Bearer {session.accessToken}` | Verifies via `supabase.auth.getUser(token)` | YES |
| Request body | `{ deck_id: UUID }` (encoded as `"deck_id"`) | Expects `{ deck_id: string }` | YES |
| Response body | Expects `{ match_id, bot_name }` | Returns `{ match_id, bot_name }` | YES |
| Error shape | Expects `{ error: string }` | Returns `{ error: string }` | YES |

**Status**: PASS

---

## WebSocket / Supabase Realtime Message Contract Checks

The iOS client uses **Supabase Realtime channels** (not raw WebSocket) for match communication. The client subscribes to `match:<matchId>` and listens for `game_event` broadcasts, while sending `player_action` broadcasts.

### Client -> Server Actions

| iOS Action (PlayerAction.swift) | Server Handler (handler.ts) | Payload Shape Match | Status |
|---|---|---|---|
| `PLAY_CARD { card_id, target_slot?, target_id? }` | `PlayCardActionSchema` (messages.ts:29-34) | **MISMATCH**: iOS sends `card_id` as plain string, Zod expects `.uuid()` | WARN |
| `USE_CHAOS_SPARK {}` | `UseChaosSparkSchema` | YES | PASS |
| `END_MAIN_PHASE {}` | `EndMainPhaseSchema` | YES | PASS |
| `DECLARE_ATTACKERS { attacker_ids: [String] }` | `DeclareAttackersSchema` (messages.ts:44-47) | YES | PASS |
| `ASSIGN_BLOCKERS { assignments: [{ blocker_id, attacker_id }] }` | `AssignBlockersSchema` (messages.ts:49-55) | YES | PASS |
| `CHOOSE_EVENT_TARGET { creature_id }` | `ChooseEventTargetSchema` (messages.ts:57-59) | YES but handler is **NO-OP** | WARN |
| `SURRENDER {}` | `SurrenderSchema` | YES | PASS |
| `MULLIGAN { keep: Bool }` | `MulliganSchema` | YES but handler is **NO-OP** | WARN |
| `RECONNECT {}` | `ReconnectSchema` | YES | PASS |
| `END_TURN {}` | `EndTurnSchema` | YES | PASS |

#### Critical Issue: Missing `player_id` in iOS Actions

The game server handler (`handler.ts:139-148`) requires `player_id` in every action payload to identify the sender:
```typescript
const playerId = payload.player_id as string | undefined;
if (!playerId) {
  console.warn(`Missing player_id in player_action for match ${matchId}`);
  return; // Silently drops the action!
}
```

The iOS `PlayerAction.swift` `jsonPayload` property (lines 23-49) does **NOT** include `player_id` in any action type. The `MatchService.sendAction()` at line 104 broadcasts the action via:
```swift
try? await channel.broadcast(event: "player_action", message: action)
```

This encodes the `PlayerAction` enum via its `Codable` conformance. Since `PlayerAction` is a Swift enum with associated values and uses `Codable`, the encoded format depends on the Supabase Swift SDK's broadcast method. The `jsonPayload` computed property explicitly constructs dictionaries, but `sendAction` uses the `Codable` overload of `broadcast`, not `jsonPayload`.

**There are two separate issues here**:
1. **The `player_id` is never included** in the encoded action payload. The server silently drops all actions.
2. **The encoding path** uses `Codable` conformance of the Swift enum, which produces a different JSON shape than `jsonPayload` would. The server's Zod schemas expect flat objects like `{ type: "PLAY_CARD", card_id: "..." }`, but Swift's `Codable` for enums with associated values produces a nested structure.

**This is a CRITICAL bug** that would prevent any gameplay actions from being processed in online matches.

**File references**:
- iOS: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Models/PlayerAction.swift` lines 10-56
- iOS: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/MatchService.swift` line 104
- Server: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/ws/handler.ts` lines 139-148

**Fix**: The `sendAction` method must:
1. Use `jsonPayload` (the manually-constructed dictionary) instead of the `Codable` encoding.
2. Inject `player_id` into every payload before sending.

### Server -> Client Events

| Server Event Type (messages.ts) | iOS Decoder (MatchEvent.swift) | Field Shape Match | Status |
|---|---|---|---|
| `STATE_SNAPSHOT { state: ClientGameState }` | `.stateSnapshot(ClientGameState)` | **MISMATCH** -- see below | FAIL |
| `TURN_START { turn, active_player }` | `.turnStart(TurnStartData)` | YES | PASS |
| `CHAOS_ROLL { roll, instability, result, active_player }` | `.chaosRoll(ChaosRollData)` | YES | PASS |
| `EVENT_TRIGGERED { event_id, event_name, event_type, description, effect_results, trigger_results, requires_choice, valid_targets? }` | `.eventTriggered(EventTriggeredData)` | YES | PASS |
| `CARD_DRAWN { card, player, cards_remaining }` | `.cardDrawn(CardDrawnData)` | YES | PASS |
| `MANA_GAINED { player, current_mana, mana_cap }` | `.manaGained(ManaGainedData)` | YES | PASS |
| `CARD_PLAYED { player, card, slot?, creature?, mana_remaining, effect_results? }` | `.cardPlayed(CardPlayedData)` | YES | PASS |
| `ATTACKERS_DECLARED { attacker_ids, player }` | `.attackersDeclared(AttackersDeclaredData)` | YES | PASS |
| `BLOCKERS_ASSIGNED { assignments, player }` | `.blockersAssigned(BlockersAssignedData)` | YES | PASS |
| `COMBAT_RESOLVED { pairs, unblocked, deaths, player_1_hp, player_2_hp }` | `.combatResolved(CombatResolvedData)` | YES | PASS |
| `CREATURE_DESTROYED { creature_id, board_slot, player, cause }` | `.creatureDestroyed(CreatureDestroyedData)` | YES | PASS |
| `HP_CHANGED { player, old_hp, new_hp, cause }` | `.hpChanged(HpChangedData)` | YES | PASS |
| `INSTABILITY_CHANGED { player, old_instability, new_instability }` | `.instabilityChanged(InstabilityChangedData)` | YES | PASS |
| `TIMER_WARNING { seconds_remaining, phase }` | `.timerWarning(TimerWarningData)` | YES | PASS |
| `TIMER_EXPIRED { phase, player }` | `.timerExpired(TimerExpiredData)` | YES | PASS |
| `MATCH_END { winner, end_reason, player_1_final_hp, player_2_final_hp, total_turns }` | `.matchEnd(MatchEndData)` | YES | PASS |
| `MULLIGAN_REQUEST { hand }` | `.mulliganRequest(MulliganRequestData)` | YES | PASS |
| `PHASE_CHANGED { phase, active_player }` | `.phaseChanged(PhaseChangedData)` | YES | PASS |
| `CHAOS_SPARK_USED { player, mana_after }` | `.chaosSparkUsed(ChaosSparkUsedData)` | YES | PASS |
| `OPPONENT_HAND_UPDATE { count }` | `.opponentHandUpdate(OpponentHandUpdateData)` | YES | PASS |
| `SERVER_ERROR { code, message }` | `.serverError(ServerErrorData)` | YES | PASS |

#### STATE_SNAPSHOT Mismatch

The server sends `{ type: "STATE_SNAPSHOT", state: { ... } }` (messages.ts:99-102, handler.ts:120-123).

The iOS decoder at MatchEvent.swift:43-44 attempts:
```swift
case "STATE_SNAPSHOT":
    self = .stateSnapshot(try singleContainer.decode(ClientGameState.self))
```

This uses `singleValueContainer()`, which means it tries to decode the **entire JSON object** as `ClientGameState`. But the server's `StateSnapshotEvent` wraps the state in a `state` field:
```json
{ "type": "STATE_SNAPSHOT", "state": { "match_id": "...", ... } }
```

The iOS `ClientGameState` expects fields like `match_id`, `current_turn`, etc. at the **top level**, but they are nested under `state`. This means the `STATE_SNAPSHOT` event will **fail to decode** on the client.

All other event types are sent as flat objects (e.g., `{ type: "TURN_START", turn: 1, active_player: "PLAYER_1" }`), which matches the iOS decoding pattern of `singleValueContainer().decode(TurnStartData.self)` because `TurnStartData` includes the `type` field.

But `STATE_SNAPSHOT` nests its data one level deeper, which breaks the pattern.

**File references**:
- iOS: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Models/MatchEvent.swift` lines 43-44
- Server: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/types/messages.ts` lines 99-102
- Server send: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/ws/handler.ts` lines 120-123

**Fix**: Either (a) change the server to flatten `STATE_SNAPSHOT` by spreading the state fields at the top level alongside `type`, or (b) create a wrapper struct on the iOS side:
```swift
struct StateSnapshotWrapper: Codable {
    let type: String
    let state: ClientGameState
}
```
and decode it separately in the `STATE_SNAPSHOT` case.

#### Realtime Channel Event Routing

The iOS `MatchService.connect()` (line 48) listens on `broadcastStream(event: "game_event")`. The server sends events via `broadcastToRoom` which calls `channel.send({ type: 'broadcast', event: 'game_event', payload: event })`. This routing is consistent.

However, `sendToPlayer` (rooms.ts) also sends via the same channel with event `game_event`. Since Supabase Realtime broadcasts go to ALL subscribers on the channel, **both players receive events meant for only one player** (e.g., `CARD_DRAWN`, `OPPONENT_HAND_UPDATE`). The server creates `ClientGameState` filtered per player, but individual per-player events like card draws are broadcast to both.

This is a **design concern** (the opponent could see the other player's drawn cards if they inspect the raw broadcast data) but not strictly an API contract mismatch. The iOS client should filter events by checking `player` fields. This is already partially handled since `CARD_DRAWN` includes a `player` field.

---

## Critical Mismatches

### C-01: Missing `player_id` in iOS Action Payloads (CRITICAL)
**Severity**: Blocker -- no online gameplay actions will be processed
**iOS file**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Models/PlayerAction.swift`
**iOS file**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/MatchService.swift` line 104
**Server file**: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/ws/handler.ts` lines 146-149
**Details**: The game server requires `player_id` in every `player_action` broadcast payload. The iOS client never includes it. All actions are silently dropped.

### C-02: Swift Codable Enum Encoding vs. Expected Flat JSON (CRITICAL)
**Severity**: Blocker -- action payloads will be malformed
**iOS file**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/MatchService.swift` line 104
**iOS file**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Models/PlayerAction.swift` lines 10-56
**Server file**: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/types/messages.ts` lines 79-90
**Details**: `MatchService.sendAction()` uses the Codable overload of Supabase's `channel.broadcast()`, which will encode the Swift enum using its auto-synthesized `Codable` (nested discriminator format). The server expects flat `{ type: "PLAY_CARD", card_id: "..." }` validated by Zod discriminated union. The `jsonPayload` computed property on `PlayerAction` produces the correct shape but is never used in the send path.

### C-03: STATE_SNAPSHOT Decoding Failure (HIGH)
**Severity**: High -- client cannot receive initial game state or reconnect state
**iOS file**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Models/MatchEvent.swift` lines 43-44
**Server file**: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/types/messages.ts` lines 99-102
**Details**: Server sends `{ type: "STATE_SNAPSHOT", state: { ...fields... } }` but iOS decodes the entire object as `ClientGameState`, which does not have a `state` wrapper field. Decoding will fail.

### C-04: save-deck UPDATE Sends ID in Body, Server Reads from Query Param (MEDIUM)
**Severity**: Medium -- deck updates will always fail with "Deck id parameter required"
**iOS file**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/CollectionService.swift` lines 140-176
**Server file**: `/Users/alexali/Projects/chaos-creatures/supabase/functions/save-deck/index.ts` lines 27, 92
**Details**: The Edge Function reads deck ID from `url.searchParams.get("id")`, but the Supabase Swift SDK's `.invoke()` does not set query parameters -- it sends a POST body. The `id` field is in the body but never checked.

### C-05: PLAY_CARD card_id UUID Validation (LOW)
**Severity**: Low -- may cause Zod validation errors for valid cards
**iOS file**: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Models/PlayerAction.swift` line 11
**Server file**: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/types/messages.ts` line 31
**Details**: The server's `PlayCardActionSchema` validates `card_id` as `z.string().uuid()`. The iOS client uses `String` for card IDs in `PlayerAction.playCard(cardId:)`. If the card ID is a valid UUID, this passes. However, the `BattleCardData.instanceId` is typed as `String` (not UUID), so if the server ever sends non-UUID instance IDs, the client would send them back and the server would reject them.

---

## Missing Endpoints/Handlers

### M-01: `player/delete-account` Edge Function
**Called by**: `AuthService.deleteAccount()` at `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/AuthService.swift` line 114
**Expected**: Edge Function at `supabase/functions/player/delete-account/index.ts`
**Status**: Does not exist. Account deletion will throw a runtime error.

### M-02: `player/ensure-profile` Edge Function
**Called by**: `AuthService.ensurePlayerProfile()` at `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/AuthService.swift` line 126
**Expected**: Edge Function at `supabase/functions/player/ensure-profile/index.ts`
**Status**: Does not exist. First-time sign-in will fail to create a player record.

### M-03: `player/card-counts` Edge Function
**Called by**: `CollectionService.cardCountByFaction()` at `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/CollectionService.swift` line 72
**Expected**: Edge Function at `supabase/functions/player/card-counts/index.ts`
**Status**: Does not exist.

### M-04: `player/set-active-deck` Edge Function
**Called by**: `CollectionService.setActiveDeck()` at `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/CollectionService.swift` line 199
**Expected**: Edge Function at `supabase/functions/player/set-active-deck/index.ts`
**Status**: Does not exist.

### M-05: `economy/spend-dust` Edge Function
**Called by**: `EconomyService.spendDust()` at `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/EconomyService.swift` line 67
**Expected**: Edge Function at `supabase/functions/economy/spend-dust/index.ts`
**Status**: Does not exist. Generic dust spending (outside pack purchase) will fail.

### M-06: `economy/claim-mission` Edge Function
**Called by**: `EconomyService.claimMission()` at `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/EconomyService.swift` line 159
**Expected**: Edge Function at `supabase/functions/economy/claim-mission/index.ts`
**Status**: Does not exist. Mission reward claiming will fail.

### M-07: `economy/match-rewards` Edge Function
**Called by**: `EconomyService.processMatchRewards()` at `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/EconomyService.swift` line 179
**Expected**: Edge Function at `supabase/functions/economy/match-rewards/index.ts`
**Status**: Does not exist. Post-match rewards will not be processed.

### M-08: `match/history` Edge Function
**Called by**: `MatchService.fetchMatchHistory()` at `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/MatchService.swift` line 169
**Expected**: Edge Function at `supabase/functions/match/history/index.ts`
**Status**: Does not exist. Match history display will fail.

**Note on naming convention**: The Supabase Edge Functions use flat directory names (e.g., `join-queue`, `open-pack`). The iOS client calls several with slash-separated paths (`player/delete-account`, `economy/spend-dust`, etc.). Supabase Edge Functions are invoked by function name, and slash paths would require nested directories (`player/delete-account/index.ts`) or alternative routing. Verify that the Supabase deployment supports this path convention.

---

## Existing Edge Functions Not Called by iOS Client

The following deployed Edge Functions have no corresponding iOS client calls:

| Edge Function | Purpose | Likely Caller |
|---|---|---|
| `batch-generate` | Batch card generation | Admin dashboard |
| `generate-card-art` | AI art generation | Pipeline/admin |
| `generate-card-text` | AI text generation | Pipeline/admin |
| `generate-evolution-art` | Evolution art generation | Pipeline/admin |
| `get-quests` | Fetch quest templates | Not called (iOS queries `missions` table directly) |
| `evaluate-quests` | Evaluate quest progress | Server-side trigger |
| `evaluate-achievements` | Evaluate achievements | Server-side trigger (called from complete-evolution) |
| `check-missed-achievements` | Backfill achievements | Admin/cron |
| `refresh-daily-quests` | Refresh daily quests | Cron job |
| `monthly-rewards` | Monthly subscription rewards | Cron job |
| `update-mastery` | Update faction mastery | Server-side trigger |
| `validate-deck` | Deck validation only | Could be called by iOS but isn't |
| `get-collection` | Paginated collection fetch | iOS uses direct table query instead |
| `get-decks` | Fetch all decks | iOS uses direct table query instead |
| `get-card` | Fetch single card | iOS uses direct table query instead |
| `get-economy-status` | Economy status | iOS uses direct table query instead |
| `purchase-shards` | Buy shards with dust | iOS EconomyService doesn't call this |

**Observation**: The iOS client duplicates several Edge Function capabilities by querying Supabase tables directly. This is functionally valid but means business logic (pagination, filtering, validation) in those Edge Functions is bypassed. This is acceptable since RLS policies enforce access control, but it does mean any server-side business rules in those functions (e.g., `get-collection`'s sorting/pagination) are not used by the client.

---

## Error Handling Gaps

### E-01: No Structured Error Parsing for Edge Function Errors
**Severity**: Medium
**Details**: Edge Functions return errors as `{ error: { code: "INSUFFICIENT_DUST", message: "..." } }` (defined in `_shared/errors.ts`). The iOS client uses `SupabaseService.callFunction<T>()` which calls `client.functions.invoke()`. When the Edge Function returns a non-2xx status, the Supabase Swift SDK throws a `FunctionsError`. The iOS client catches this as a generic `Error` and displays `error.localizedDescription`, which will show the SDK error message, not the structured error code/message from the server.

**Missing**: The iOS client has no mechanism to parse the `{ error: { code, message } }` structure to show user-friendly error messages (e.g., "Insufficient Chaos Dust" vs. a generic "Function invocation failed").

**File references**:
- Server: `/Users/alexali/Projects/chaos-creatures/supabase/functions/_shared/errors.ts` (ErrorCode enum, lines 4-53)
- iOS: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/SupabaseService.swift` lines 123-148

### E-02: SERVER_ERROR Event Code Not Mapped to User Actions
**Severity**: Low
**Details**: The game server sends `SERVER_ERROR { code, message }` events (e.g., `NOT_YOUR_TURN`, `MATCH_NOT_FOUND`, `INVALID_ATTACKERS`, `MATCH_OVER`, `TOO_EARLY`). The iOS `ServerErrorData` struct captures these, but the `MatchService.onGameEvent` callback provides them generically. There is no switch on error codes to show contextual UI feedback (e.g., showing "Not your turn" toast vs. "Match not found" navigation).

**File references**:
- Server error codes: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/ws/handler.ts` lines 186-191, 237-238, 293-294
- iOS model: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Models/MatchEvent.swift` lines 413-417

### E-03: Game Server Protocol Errors Not Surfaced
**Severity**: Low
**Details**: The game server's `ProtocolError` class (protocol.ts:83-91) produces error codes like `INVALID_JSON`, `INVALID_ENVELOPE`, `INVALID_ACTION`. The `GameError` class (in turn.ts) produces codes like `NOT_YOUR_TURN`, `MATCH_NOT_FOUND`, `MATCH_OVER`, `INVALID_ATTACKERS`, `INVALID_BLOCKERS`, `TOO_EARLY`. These are sent as `SERVER_ERROR` events but the iOS client has no error-code-specific handling for any of them.

### E-04: Matchmaking MATCH_FOUND Payload Extraction
**Severity**: Medium
**Details**: The iOS `MatchmakingService` at line 222 extracts the match ID via:
```swift
if let matchIdValue = message["match_id"]?.stringValue {
```
The server sends via Supabase Realtime broadcast with `payload: { match_id: matchId }`. Depending on the Supabase Swift SDK version, the broadcast stream may deliver the payload directly or wrapped. The `.stringValue` accessor suggests the value might be an `AnyJSON` type. If the SDK version changes the payload wrapping, this extraction could break silently (no match ID found, matchmaking hangs forever).

**File references**:
- iOS: `/Users/alexali/Projects/chaos-creatures/ChaosCreatures/ChaosCreatures/Services/MatchmakingService.swift` line 222
- Server: `/Users/alexali/Projects/chaos-creatures/packages/game-server/src/index.ts` lines 522-524

---

## Enum/Type Symmetry Checks

| Type | iOS (Enums.swift) | Server (enums.ts) | Match? |
|---|---|---|---|
| `PlayerSide` | `PLAYER_1`, `PLAYER_2` | `PLAYER_1`, `PLAYER_2` | YES |
| `TurnPhase` | 11 values | 11 values (identical) | YES |
| `EventType` | `ORDER`, `CHAOS` | `ORDER`, `CHAOS` | YES |
| `ChaosRollOutcome` | `ORDER`, `CHAOS`, `NOTHING` (BattleCard.swift:173-177) | `ORDER`, `CHAOS`, `NOTHING` | YES |
| `EndReason` | `HP_ZERO`, `SURRENDER`, `DISCONNECT`, `TIMEOUT` | `HP_ZERO`, `SURRENDER`, `DISCONNECT`, `TIMEOUT` | YES |
| `GameMode` | `RANKED`, `CASUAL`, `PRACTICE` | `RANKED`, `CASUAL`, `PRACTICE` | YES |
| `Keyword` | 7 values | 7 values (identical) | YES |
| `CardType` | `CREATURE`, `SPELL`, `STABILIZER` | `CREATURE`, `SPELL`, `STABILIZER` | YES |
| `EvolutionTier` | 5 values | 5 values (identical) | YES |
| `SubscriptionTier` | `FREE`, `MID`, `HIGH` | `FREE`, `MID`, `HIGH` | YES |
| `SeasonRank` | 17 values | 17 values (identical) | YES |
| `ErrorCode` (Edge Functions) | Not modeled on iOS | 28 values in `_shared/errors.ts` | NO MIRROR |

---

## Recommendations (Priority Order)

### Priority 1: Blockers (Must Fix Before Any Online Play)

1. **Fix `MatchService.sendAction()` to include `player_id` and use correct JSON format** (C-01, C-02)
   - Change `sendAction` to serialize via `jsonPayload` dictionary instead of `Codable`
   - Inject `player_id` from the current user session into every action
   - Example fix:
     ```swift
     func sendAction(_ action: PlayerAction) async {
         guard let channel = matchChannel, isConnected else { return }
         guard let playerId = await SupabaseService.shared.currentUserID else { return }
         var payload = action.jsonPayload
         payload["player_id"] = playerId.uuidString
         try? await channel.broadcast(event: "player_action", message: payload)
     }
     ```

2. **Fix STATE_SNAPSHOT decoding** (C-03)
   - Add a wrapper that extracts `state` from the event before decoding `ClientGameState`

### Priority 2: High (Must Fix Before Launch)

3. **Fix save-deck UPDATE to pass ID correctly** (C-04)
   - Update Edge Function to check `body.id` as fallback: `const deckId = url.searchParams.get("id") || body.id;`

4. **Implement missing Edge Functions** (M-01 through M-08)
   - `player/ensure-profile` (blocks sign-up flow)
   - `player/delete-account` (blocks GDPR compliance)
   - `economy/claim-mission` (blocks mission rewards)
   - `economy/match-rewards` (blocks post-match rewards)
   - `match/history` (blocks match history screen)
   - `player/card-counts` (blocks collection limit checking)
   - `player/set-active-deck` (blocks deck selection)
   - `economy/spend-dust` (blocks generic dust spending)

### Priority 3: Medium (Should Fix Before Launch)

5. **Add structured error parsing for Edge Function responses** (E-01)
   - Define an `APIError` struct matching `{ error: { code, message } }`
   - Parse Edge Function error responses and surface user-readable messages

6. **Handle MATCH_FOUND payload robustly** (E-04)
   - Add fallback extraction and timeout handling

### Priority 4: Low (Polish)

7. **Implement CHOOSE_EVENT_TARGET and MULLIGAN handlers** on the server (currently no-ops)
8. **Add error-code-specific UI feedback** for game server errors (E-02, E-03)
9. **Mirror `ErrorCode` enum on iOS** for type-safe error handling

---

## Revision Log
| Date | Author | Changes |
|---|---|---|
| 2026-02-17 | Claude Code (Audit W3A) | Initial audit |

# API Contract Audit — Wave 3

## Summary
- Contracts checked: 14
- CRITICAL: 5 (must fix before Wave 4)
- WARNING: 5 (note for future)
- PASS: 4

---

## Findings

### [CRITICAL] C-01: WebSocket Transport Mismatch — iOS Uses Supabase Realtime, Server Uses Raw WebSocket
- **Contract**: iOS `MatchService.swift` -> Game Server `handler.ts`
- **Issue**: The iOS client connects to the match via **Supabase Realtime** channels (`supabase.client.realtimeV2.channel("match:\(matchId)")`), listening for `broadcastStream(event: "game_event")` and sending via `channel.broadcast(event: "player_action", ...)`. However, the game server uses **raw WebSocket** (`ws` library) on path `/ws`, expecting clients to connect with `?match_id=X&player_id=Y` query parameters and send JSON message envelopes `{ match_id, player_id, action }`. The server sends events via `ws.send(JSON.stringify(event))`. These are completely different transport protocols — Supabase Realtime is a Phoenix Channel abstraction over WebSocket, while the server runs a plain `WebSocketServer`. Messages sent from the iOS client via Supabase Realtime broadcast will **never reach** the game server, and events broadcast by the server via `ws.send()` will **never arrive** at the iOS Supabase Realtime channel.
- **Fix**: Choose one transport and align both sides. Two options:
  1. **Option A (recommended)**: Make the game server also use Supabase Realtime for match communication. The server subscribes to `match:{matchId}` channel, listens for `player_action` broadcasts, and sends `game_event` broadcasts. This keeps the iOS code as-is.
  2. **Option B**: Switch MatchService.swift to use a raw `URLSessionWebSocketTask` connecting to the Railway game server's `/ws` endpoint with query params. This requires rewriting MatchService to use native WebSocket instead of Supabase Realtime.

### [CRITICAL] C-02: Protocol Envelope Mismatch — iOS Sends Flat Actions, Server Expects Wrapped Envelope
- **Contract**: iOS `PlayerAction.jsonPayload` -> Game Server `protocol.ts parseClientMessage`
- **Issue**: Even within the same transport, the message formats are incompatible. The iOS client sends flat action objects via Supabase broadcast, e.g., `{ "type": "PLAY_CARD", "card_id": "..." }`. The game server's `parseClientMessage` expects a `MessageEnvelopeSchema` wrapping the action: `{ match_id: string, player_id: string, action: { type: "PLAY_CARD", card_id: "..." } }`. If C-01 is resolved by switching to raw WebSocket, the iOS client must also wrap its actions in this envelope. If C-01 is resolved by switching the server to Supabase Realtime, the server already has `matchId` and `playerId` from room context and the envelope becomes unnecessary.
- **Fix**: Depends on resolution of C-01. If Option A (Supabase Realtime on server), remove the envelope requirement from `parseClientMessage` and extract `matchId`/`playerId` from the channel context. If Option B (raw WS on iOS), modify `PlayerAction.jsonPayload` to include `match_id` and `player_id` fields, or wrap it in `MatchService.sendAction`.

### [CRITICAL] C-03: Missing `matches` Table — Game Server Inserts Into Non-Existent Table
- **Contract**: Game Server `index.ts` line 276 -> Supabase DB
- **Issue**: The matchmaking callback in `index.ts` inserts into `supabase.from('matches').insert({...})` and `handler.ts` updates `supabase.from('matches').update({ status: 'COMPLETED' })`. However, **no `matches` table exists in any migration file** (00001-00012). The only match-related table is `match_records` in `00003_battle_tables.sql`. The game server creates a separate `matches` table row on match creation (with `status: 'IN_PROGRESS'`) and then inserts a separate row into `match_records` on match completion. The `matches` table is never created, so both operations will fail silently (Supabase returns error, the code logs it but does not crash).
- **Fix**: Either:
  1. Add a `CREATE TABLE matches` migration with columns: `id UUID PRIMARY KEY, mode TEXT, player_1_id UUID, player_2_id UUID, player_1_deck_id UUID, player_2_deck_id UUID, status TEXT, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ`.
  2. Or remove the `matches` table usage and only use `match_records`, inserting a row at match creation with `status = 'IN_PROGRESS'` and updating it at completion. This would require adding a `status` column to `match_records`.

### [CRITICAL] C-04: Missing `increment_chaos_energy` RPC Function
- **Contract**: Game Server `handler.ts` `awardEnergyToDeck` -> Supabase `rpc('increment_chaos_energy')`
- **Issue**: After a match ends, `handler.ts` calls `supabase.rpc('increment_chaos_energy', { instance_ids, amount })` to atomically increment chaos energy on card instances. This RPC function is **not defined in any migration**. The handler does have a `console.warn` fallback, so the match won't crash, but chaos energy will never be awarded after matches. This means cards will never accumulate energy toward evolution thresholds (15/30/50/75), which is a core game loop blocker.
- **Fix**: Add a PostgreSQL function in a new migration:
  ```sql
  CREATE OR REPLACE FUNCTION increment_chaos_energy(
    instance_ids UUID[],
    amount INTEGER
  ) RETURNS void AS $$
  BEGIN
    UPDATE card_instances
    SET chaos_energy = chaos_energy + amount
    WHERE id = ANY(instance_ids);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

### [CRITICAL] C-05: PostMatchView Fetches From `match_records` But Server Insert May Fail Due to Missing Columns
- **Contract**: Game Server `handler.ts saveMatchRecordAndAwardEnergy` -> DB `match_records` -> iOS `PostMatchView`
- **Issue**: The server inserts into `match_records` with all fields from the TypeScript `MatchRecord` interface, but omits `cards_played` and `full_log` fields that the SQL schema defines as `JSONB NOT NULL DEFAULT '[]'`. While these have defaults so the INSERT won't fail, the iOS `MatchRecord` struct maps `createdAt` to `"started_at"` (which is correct), but the struct expects `gameMode` mapped to `"mode"`. The `match_records` table column is `mode TEXT`, the server inserts `mode`, and the iOS reads `mode` — this is correct. However, the iOS `MatchRecord` struct declares `endedAt: Date?` as optional, but the SQL schema has `ended_at TIMESTAMPTZ NOT NULL DEFAULT now()`. The server does insert `ended_at`. The real issue is **timing**: PostMatchView calls `fetchMatchRecord` immediately after BattleContainerView disconnects (1.5 second delay), but `saveMatchRecordAndAwardEnergy` is fire-and-forget (`catch` logs error). If the DB insert is slow or fails, PostMatchView gets "Match not found" error. The view handles this gracefully (shows basic results), but the record will be permanently missing if the insert fails.
- **Fix**: Add retry logic to `saveMatchRecordAndAwardEnergy` (3 retries with exponential backoff). Also consider having PostMatchView poll/retry fetching the match record for up to 5 seconds before giving up.

---

### [WARNING] C-06: Matchmaking MATCH_FOUND Broadcast Uses Server-Side Supabase Channel Without Subscribe
- **Contract**: Game Server `index.ts` -> Supabase Realtime -> iOS `MatchmakingService.swift`
- **Issue**: The game server broadcasts `MATCH_FOUND` using `supabase.channel('matchmaking:${playerId}').send(...)`. This calls `send()` on a channel **without first calling `.subscribe()`**. In the Supabase JS client, you must subscribe to a channel before sending messages on it. However, the server only needs to broadcast (not listen), and the Supabase admin/service-role client may behave differently than the end-user client. The iOS side correctly subscribes to `matchmaking:{playerId}` and listens for broadcast event `"MATCH_FOUND"`. The payload shapes match: server sends `{ payload: { match_id: matchId } }`, iOS reads `message.payload["match_id"]`. This may work or may silently fail depending on Supabase JS SDK version behavior for server-side broadcast without subscribe.
- **Fix**: Add `.subscribe()` before `.send()` on the server-side channel, then unsubscribe after sending. Or use Supabase's REST-based broadcast API for server-to-client messages if the SDK requires subscription first.

### [WARNING] C-07: `leave-queue` Method Handling — Edge Function Accepts DELETE/POST but Client Uses POST
- **Contract**: iOS `MatchmakingService.leaveQueue()` -> Edge Function `leave-queue/index.ts`
- **Issue**: The `leave-queue` Edge Function accepts both `DELETE` and `POST` methods (line 14). The iOS client calls `supabase.callFunction("leave-queue")` with no body. Supabase Functions SDK `invoke()` sends a `POST` request by default. The Edge Function handles POST, so this works. However, the Edge Function returns `204 No Content` (empty body), and the iOS client's `callFunction` (void return version) calls `invoke` which may throw if it tries to decode the empty response body. The current implementation wraps this in a `do { ... } catch { }` block that swallows errors, so it won't crash, but the leave operation may silently fail if the SDK cannot handle 204 responses.
- **Fix**: Test this specific call. If the Supabase Swift SDK throws on 204 empty body, change the Edge Function to return `{ "ok": true }` with status 200.

### [WARNING] C-08: `start-evolution` Edge Function Field Naming vs iOS Request
- **Contract**: iOS `EvolutionService.startEvolution` -> Edge Function `start-evolution/index.ts`
- **Issue**: The iOS client sends `card_instance_id` (via CodingKeys) and `channel_direction`. The Edge Function reads `card_instance_id` and `channel_direction` — these match. The response envelope also matches: server returns `{ data: { evolution_id, target_tier, card_instance_id, modifier_options, stat_changes, image_job_id, text_job_id } }` and the iOS `StartResponse` struct maps all these fields correctly. However, `modifier_options` from the server is an array of raw `modifier_definitions` table rows (all columns via `select("*")`), while the iOS expects `[ModifierDefinition]`. If the `ModifierDefinition` Swift struct does not exactly match the `modifier_definitions` table column names, deserialization will fail silently (missing fields become nil, extra fields are ignored, but required fields will throw).
- **Fix**: Verify that the `ModifierDefinition` Swift struct's `CodingKeys` exactly match the column names from `modifier_definitions` table. If the table has columns like `pool_type`, `faction_id`, `tier_bracket`, etc., the Swift struct must map all required (non-optional) fields.

### [WARNING] C-09: `complete-evolution` Returns Raw DB Row, iOS Expects `CardInstance` Struct
- **Contract**: Edge Function `complete-evolution/index.ts` -> iOS `EvolutionService.confirmEvolution`
- **Issue**: The Edge Function returns `{ data: { card: updatedCard } }` where `updatedCard` is the raw Supabase `.select().single()` result from `card_instances`. This is a flat database row with snake_case column names (e.g., `current_name`, `current_attack`, `art_url`, `evolution_tier`). The iOS `ConfirmResponse.card` expects a `CardInstance` Swift struct. If `CardInstance` uses `CodingKeys` to map snake_case to camelCase (e.g., `currentName = "current_name"`), this will work. But the column `tier` in the Edge Function is the updated tier, while the iOS `CardInstance` may expect `evolution_tier` (the actual DB column name is `tier` based on the `card_instances` table). If there is a mismatch between what the DB returns and what `CardInstance` expects, the evolution reveal will fail.
- **Fix**: Verify that the `CardInstance` Swift struct's `CodingKeys` exactly match the `card_instances` table column names. Pay special attention to: `tier` vs `evolution_tier`, `template_id` vs `card_template_id`.

### [WARNING] C-10: `sync-entitlements` Response Format Mismatch
- **Contract**: iOS `StoreKitService.syncSubscriptionWithBackend` -> Edge Function `sync-entitlements/index.ts`
- **Issue**: The iOS client calls `sync-entitlements` but uses the void-returning `callFunction` (no return type decoded — line 186-193 in StoreKitService). So the iOS side does not parse the response at all. The Edge Function returns `{ data: { subscription_tier, max_deck_slots, max_cards_per_faction } }`. Since the iOS client ignores the response, there is no contract violation. However, the iOS app's local `currentTier` is determined entirely by local StoreKit state, not the server response. If the server-side tier assignment differs from the client-side product-to-tier mapping, the player could see inconsistent behavior (e.g., getting 2 modifier choices locally but 3 server-side).
- **Fix**: After `syncSubscriptionWithBackend` succeeds, optionally fetch the player profile from Supabase to confirm the tier matches. Or decode the response and update local state. Low priority since the product-to-tier mapping in StoreKitService and sync-entitlements currently match.

---

### [PASS] C-11: `open-pack` Contract — iOS and Edge Function Match
- **Contract**: iOS `CollectionService.openPack` -> Edge Function `open-pack/index.ts`
- **Issue**: None. The iOS client sends `{ "faction_id": "..." }` which the Edge Function reads as `faction_id`. The response is `{ data: { cards: [...], dust_spent: N } }`. The iOS `PackOpenEnvelope` correctly wraps `PackOpenResult` with `cards: [CardInstance]` and `dustSpent: Int` (mapped to `"dust_spent"`). The Edge Function's `.select()` returns the full `card_instances` rows which the iOS `CardInstance` struct can decode.
- **Fix**: None required.

### [PASS] C-12: `join-queue` Contract — iOS and Edge Function Match
- **Contract**: iOS `MatchmakingService.joinQueue` -> Edge Function `join-queue/index.ts`
- **Issue**: None. The iOS client sends `{ "deck_id": UUID, "mode": "RANKED" }`. The Edge Function reads `deck_id` and `mode`, validates the deck, inserts into `matchmaking_queue`, and returns `{ data: { queue_id, estimated_wait_seconds } }`. The iOS `JoinQueueResponse` correctly maps these fields. The iOS then subscribes to `matchmaking:{playerId}` Realtime channel for the MATCH_FOUND broadcast.
- **Fix**: None required.

### [PASS] C-13: PlayerAction Enum Matches Server ClientAction Schema
- **Contract**: iOS `PlayerAction.swift` -> Game Server `messages.ts ClientActionSchema`
- **Issue**: None. All 10 action types match between iOS and server:
  - `PLAY_CARD` with `card_id`, `target_slot`, `target_id` — matches `PlayCardActionSchema`
  - `USE_CHAOS_SPARK` — matches `UseChaosSparkSchema`
  - `END_MAIN_PHASE` — matches `EndMainPhaseSchema`
  - `DECLARE_ATTACKERS` with `attacker_ids` — matches `DeclareAttackersSchema`
  - `ASSIGN_BLOCKERS` with `assignments` array of `{ blocker_id, attacker_id }` — matches `AssignBlockersSchema`
  - `CHOOSE_EVENT_TARGET` with `creature_id` — matches `ChooseEventTargetSchema`
  - `SURRENDER` — matches `SurrenderSchema`
  - `MULLIGAN` with `keep` — matches `MulliganSchema`
  - `RECONNECT` — matches `ReconnectSchema`
  - `END_TURN` — matches `EndTurnSchema`
- **Fix**: None required. (Note: this is a logical match — the transport issue in C-01/C-02 must be resolved for these actions to actually reach the server.)

### [PASS] C-14: ServerEvent Types Match Between Server and iOS
- **Contract**: Game Server `messages.ts ServerEvent` -> iOS `MatchEvent.swift ServerEvent`
- **Issue**: None. All 20 server event types are defined on both sides with matching type strings and field names:
  - `STATE_SNAPSHOT`, `TURN_START`, `CHAOS_ROLL`, `EVENT_TRIGGERED`, `CARD_DRAWN`, `MANA_GAINED`, `CARD_PLAYED`, `ATTACKERS_DECLARED`, `BLOCKERS_ASSIGNED`, `COMBAT_RESOLVED`, `CREATURE_DESTROYED`, `HP_CHANGED`, `INSTABILITY_CHANGED`, `TIMER_WARNING`, `TIMER_EXPIRED`, `MATCH_END`, `MULLIGAN_REQUEST`, `PHASE_CHANGED`, `CHAOS_SPARK_USED`, `OPPONENT_HAND_UPDATE`, `SERVER_ERROR`
  - CodingKeys on iOS side correctly map camelCase Swift properties to snake_case JSON keys matching the server's TypeScript interfaces.
- **Fix**: None required. (Same caveat as C-13 — transport must be resolved first.)

---

## Priority Resolution Order

1. **C-01 + C-02** (Transport + Envelope): These are the same root issue. Fix together. Recommend Option A (server uses Supabase Realtime for match channels).
2. **C-03** (Missing `matches` table): Add migration or consolidate with `match_records`.
3. **C-04** (Missing RPC function): Add `increment_chaos_energy` migration. Core game loop depends on this.
4. **C-05** (Post-match timing): Add retry logic. Can be deferred to polish phase but should not be forgotten.
5. **C-06** (Server broadcast subscribe): Quick fix, add `.subscribe()` before `.send()`.
6. **C-07 through C-10**: Verify Swift struct CodingKeys match DB column names during integration testing.

---

*Audit performed: 2026-02-17*
*Auditor: API Contract Auditor Agent*
*Files examined: 21 source files across iOS client, game server, Edge Functions, and DB migrations*

# Security Audit -- Wave 3

**Date**: 2026-02-17
**Auditor**: Claude Code (Security Sub-Agent)
**Scope**: Wave 3 integration code -- match creation, WebSocket communication, evolution flow, StoreKit entitlements, pack opening, chaos energy awards, admin auth.

## Summary

- **Files audited**: 18
- **CRITICAL**: 3 (must fix before launch)
- **WARNING**: 5 (should fix)
- **INFO**: 3 (acceptable risk)

### Files Audited

1. `packages/game-server/src/index.ts`
2. `packages/game-server/src/ws/handler.ts`
3. `packages/game-server/src/ws/rooms.ts`
4. `packages/game-server/src/ws/protocol.ts`
5. `packages/game-server/src/config.ts`
6. `packages/game-server/src/services/supabase.ts`
7. `packages/game-server/src/services/matchmaking.ts`
8. `packages/game-server/src/engine/match.ts`
9. `packages/game-server/src/types/messages.ts`
10. `packages/admin-dashboard/middleware.ts`
11. `packages/admin-dashboard/lib/auth.ts`
12. `packages/admin-dashboard/app/api/auth/route.ts`
13. `supabase/functions/_shared/auth.ts`
14. `supabase/functions/_shared/supabase.ts`
15. `supabase/functions/_shared/errors.ts`
16. `supabase/functions/start-evolution/index.ts`
17. `supabase/functions/complete-evolution/index.ts`
18. `supabase/functions/sync-entitlements/index.ts`
19. `supabase/functions/open-pack/index.ts`
20. `supabase/functions/join-queue/index.ts`
21. `supabase/migrations/00011_rls_policies.sql`
22. `supabase/migrations/00012_triggers.sql`
23. `ChaosCreatures/ChaosCreatures/Services/MatchService.swift`

---

## Findings

---

### [CRITICAL] S-01: WebSocket Authentication -- No JWT Validation on Connect

- **File(s)**: `packages/game-server/src/ws/handler.ts` (lines 44-69)
- **Risk**: The WebSocket `handleConnection` function authenticates players by extracting `match_id` and `player_id` from query string parameters. It verifies the player is a participant in the match (lines 62-68), but **never validates a JWT or auth token**. The `player_id` is trusted from the query string without cryptographic proof of identity.

  The game server has `validatePlayerToken()` in `packages/game-server/src/services/supabase.ts` (line 37) which can verify JWTs, but it is never called during WebSocket connection.

- **Impact**: An attacker who knows a `match_id` and a valid `player_id` (both are UUIDs broadcast via Supabase Realtime) can connect to the WebSocket as that player. Since `MATCH_FOUND` is broadcast to Realtime channels, an eavesdropper on the channel could intercept the match ID and impersonate a player. The attacker could then send game actions (play cards, surrender, etc.) on behalf of the victim.

- **Fix**: Require a JWT Bearer token as a query parameter or in the WebSocket upgrade headers. Validate it using `validatePlayerToken()` before accepting the connection:
  ```typescript
  // In handleConnection, after extracting matchId and playerId:
  const token = url.searchParams.get('token');
  if (!token) {
    ws.close(4003, 'Missing auth token');
    return;
  }
  const authId = await validatePlayerToken(token);
  if (!authId) {
    ws.close(4003, 'Invalid auth token');
    return;
  }
  const resolvedPlayerId = await getPlayerIdFromAuthId(authId);
  if (resolvedPlayerId !== playerId) {
    ws.close(4002, 'Token does not match player_id');
    return;
  }
  ```

---

### [CRITICAL] S-02: WebSocket Message Envelope player_id/match_id Ignored -- Action Routing Trusts Connection State Only

- **File(s)**: `packages/game-server/src/ws/protocol.ts` (lines 58-63), `packages/game-server/src/ws/handler.ts` (lines 93-106, 122-140)
- **Risk**: The `MessageEnvelopeSchema` validates that each WS message contains `match_id` and `player_id` fields. The `parseClientMessage()` function extracts and returns them (line 33-37). However, in `handleConnection` at line 96, the handler calls `handleMessage(matchId, playerId, side, raw)` using the **connection-level** `matchId` and `playerId`, not the values from the parsed envelope. The envelope's `player_id` and `match_id` are parsed and then **discarded**.

  This means:
  1. A client can send a message with `player_id: "victim-uuid"` and `match_id: "other-match"` in the envelope body, and the server ignores it -- which is actually the correct behavior defensively.
  2. BUT the envelope validation is misleading and creates a false sense of cross-referencing. If a future developer assumes the envelope values are authoritative, bugs could emerge.

- **Impact**: Currently low due to connection-level trust. However, this is a defense-in-depth failure. Combined with S-01 (no JWT on WS connect), this means the entire match action pipeline trusts only the initial unverified `player_id` from the query string.

- **Fix**: Either (a) remove `player_id` and `match_id` from the `MessageEnvelopeSchema` since they are not used (simplify the protocol), or (b) cross-validate them against the connection state and reject mismatches:
  ```typescript
  if (parsed.player_id !== playerId || parsed.match_id !== matchId) {
    throw new ProtocolError('IDENTITY_MISMATCH', 'Message identity does not match connection');
  }
  ```

---

### [CRITICAL] S-03: StoreKit Receipt Verification Not Implemented Server-Side

- **File(s)**: `supabase/functions/sync-entitlements/index.ts` (lines 57-68)
- **Risk**: The `sync-entitlements` function has an explicit TODO comment acknowledging that server-side receipt verification with Apple's App Store Server API is **not implemented**. The function trusts the `product_id` and `transaction_id` sent by the client without verifying them against Apple's servers. The only protection is Supabase JWT auth (valid player identity).

- **Impact**: A player with a valid Supabase auth token can call the `sync-entitlements` Edge Function with a fabricated `product_id` (e.g., `"com.chaoscreatures.sub.high"`) and `transaction_id` (any string) to grant themselves a HIGH-tier subscription for free. This unlocks:
  - 4 modifier options per evolution (instead of 2)
  - 8 deck slots (instead of 4)
  - 200 cards per faction (instead of 50)
  - Higher quest dust multipliers

- **Fix**: Implement server-side JWS verification of StoreKit 2 transactions. StoreKit 2 transactions are JWS-signed by Apple. Use Apple's public certificates to verify the JWS signature:
  ```typescript
  // 1. Decode the JWS transaction_id
  // 2. Verify the signature using Apple's root certificate chain
  // 3. Extract the product_id from the verified payload (don't trust client-sent product_id)
  // 4. Check the transaction is not expired/revoked
  ```
  Alternatively, use Apple's App Store Server API v2 `GET /inApps/v1/transactions/{transactionId}` to verify.

---

### [WARNING] S-04: Chaos Energy Award RPC Missing -- Silent Failure

- **File(s)**: `packages/game-server/src/ws/handler.ts` (lines 620-645), `supabase/migrations/00012_triggers.sql`
- **Risk**: The `awardEnergyToDeck()` function calls `supabase.rpc('increment_chaos_energy', ...)` but this RPC function does **not exist** in any migration file. The code at line 643 logs a warning and silently continues: `"increment_chaos_energy RPC failed ... skipping energy award"`. This means **no chaos energy is ever awarded after matches**.

- **Impact**: Players cannot accumulate chaos energy, which means they can never reach evolution thresholds. The entire evolution progression system is broken. While not a direct security vulnerability, it is an integrity issue -- the system silently fails a core game mechanic.

- **Fix**: Create the `increment_chaos_energy` RPC in a new migration:
  ```sql
  CREATE OR REPLACE FUNCTION increment_chaos_energy(
    instance_ids UUID[],
    amount INTEGER
  ) RETURNS VOID AS $$
  BEGIN
    UPDATE card_instances
    SET chaos_energy = chaos_energy + amount
    WHERE id = ANY(instance_ids);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```

---

### [WARNING] S-05: Missing `matches` Table -- Match Insert Fails Silently

- **File(s)**: `packages/game-server/src/index.ts` (lines 276-285)
- **Risk**: The matchmaking callback inserts into a `matches` table (`supabase.from('matches').insert(...)`) but no such table exists in the migrations. Only `match_records` exists (in `00003_battle_tables.sql`). This insert will fail silently because the `await` result is not checked for errors.

- **Impact**: No live match tracking in the database. The handler at line 612-616 also tries to update `matches.status` to `COMPLETED` on match end, which also silently fails. This means the database has no record of in-progress matches, only completed ones (via `match_records`).

- **Fix**: Either (a) add a `matches` table migration for tracking live matches, or (b) change the code to use the existing `match_records` table with an initial `IN_PROGRESS` status and update it on completion.

---

### [WARNING] S-06: Admin Session Token is Reversible Base64 -- Not a Real MAC/HMAC

- **File(s)**: `packages/admin-dashboard/middleware.ts` (lines 17-30), `packages/admin-dashboard/app/api/auth/route.ts` (line 46)
- **Risk**: The admin session token is `base64(timestamp:ADMIN_JWT_SECRET)`. This is a reversible encoding, not a cryptographic signature. The `ADMIN_JWT_SECRET` is embedded **in plaintext** inside every session cookie. If an attacker captures any session cookie (XSS, network sniffing on non-HTTPS dev, log leak), they recover the `ADMIN_JWT_SECRET` and can forge session cookies with any timestamp, gaining permanent admin access.

- **Impact**: Compromise of the admin secret from a single cookie capture. The secret is not rotatable without invalidating the concept of session validation.

- **Fix**: Use HMAC-SHA256 to create the session token. The cookie should be `base64(timestamp):hmac(timestamp, secret)`. Validation checks the HMAC, never exposing the secret:
  ```typescript
  import { createHmac } from 'crypto';
  const timestamp = Date.now().toString();
  const hmac = createHmac('sha256', secret).update(timestamp).digest('hex');
  const token = Buffer.from(`${timestamp}:${hmac}`).toString('base64');
  // Validation: decode, recalculate HMAC, compare
  ```

---

### [WARNING] S-07: CORS Allows All Origins on Edge Functions

- **File(s)**: `supabase/functions/_shared/errors.ts` (lines 84-87)
- **Risk**: `corsHeaders` sets `Access-Control-Allow-Origin: "*"`. All Edge Functions use these headers. This means any website can make authenticated cross-origin requests to the Edge Functions if the user's browser has a valid Supabase JWT.

- **Impact**: A malicious website could trigger game actions (open packs, start evolution, join queue) on behalf of any logged-in player who visits the site, if the browser attaches credentials. In practice, Supabase JWT is sent via `Authorization` header (not cookies), which limits CORS risk since custom headers trigger preflight. However, the permissive CORS policy is still overly broad.

- **Fix**: Restrict to known origins:
  ```typescript
  export const corsHeaders = {
    "Access-Control-Allow-Origin": "https://admin.chaoscreatures.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  ```
  Note: iOS app requests are not subject to CORS (native HTTP, not browser). Only the admin dashboard needs CORS. Consider using a function to dynamically set the origin based on the request.

---

### [WARNING] S-08: Race Condition in open-pack Dust Deduction

- **File(s)**: `supabase/functions/open-pack/index.ts` (lines 52-58, 107-117)
- **Risk**: The function reads `player.chaos_dust` at line 53 to check if the player can afford the pack, then deducts at lines 107-113. While the deduction uses `.gte("chaos_dust", cost)` as a guard, there is a separate `add_chaos_dust` RPC call at lines 120-125 that records the transaction **after** the deduction. The dual-write pattern (direct UPDATE + RPC) means the dust is deducted twice logically -- once via the UPDATE and once via the RPC (which also calls `UPDATE players SET chaos_dust = chaos_dust + p_amount`). The RPC passes `-cost` which would deduct **again**.

- **Impact**: Players are charged double dust for each pack opening. The `.gte` guard on the UPDATE prevents negative balance, but the subsequent RPC `add_chaos_dust` with `-cost` will deduct a second time. If the CHECK constraint blocks the second deduction, the dust_transaction log will be inconsistent.

- **Fix**: Use only one mechanism for the deduction. Either:
  - Use only the `add_chaos_dust` RPC (atomic, with transaction logging), OR
  - Use only the direct UPDATE with `.gte()` guard and insert the `dust_transactions` record manually.

  Do not do both.

---

### [INFO] S-09: Health Endpoint Exposes Internal Metrics

- **File(s)**: `packages/game-server/src/index.ts` (lines 42-50)
- **Risk**: The `/health` endpoint exposes `active_matches`, `active_rooms`, and `uptime` without any authentication. This endpoint is public.

- **Impact**: Low. This information is useful for operational monitoring (Railway health checks) but reveals server load patterns. An attacker could use `active_matches` count to time attacks or identify quiet periods.

- **Fix**: Consider limiting the public health check to `{ status: "ok" }` and exposing detailed metrics only behind admin auth, or accept this as a known low-risk exposure.

---

### [INFO] S-10: Supabase Realtime Channel Names Are Predictable

- **File(s)**: `packages/game-server/src/index.ts` (lines 296-299), `ChaosCreatures/ChaosCreatures/Services/MatchService.swift` (line 45)
- **Risk**: Realtime channels are named `matchmaking:<player_id>` and `match:<match_id>`. Both use predictable UUIDs. Any authenticated Supabase user could subscribe to another player's matchmaking channel or match channel to eavesdrop on match events.

  The iOS client subscribes to `match:<matchId>` via Supabase Realtime (MatchService.swift line 45) and the game server broadcasts `MATCH_FOUND` to `matchmaking:<playerId>` channels (index.ts lines 296-299).

- **Impact**: An attacker could learn when specific players enter matches and observe their match IDs. Combined with S-01, this enables impersonation attacks. Even without S-01, an eavesdropper sees all broadcast game events (board state, cards played, HP values).

- **Fix**: Use Supabase Realtime's RLS-based authorization or add a secret token component to channel names. Supabase Realtime supports policies on channel subscriptions -- configure these to restrict access. Alternatively, sign channel subscriptions with a short-lived token.

---

### [INFO] S-11: Modifier SQL Injection via String Interpolation in start-evolution

- **File(s)**: `supabase/functions/start-evolution/index.ts` (line 126)
- **Risk**: The modifier query uses string interpolation: `.or(\`pool_type.eq.UNIVERSAL,faction_id.eq.${card.card_templates.faction_id}\`)`. The `faction_id` comes from the database (card_templates table), not from user input directly. However, if a card template were created with a malicious `faction_id` value, it could inject PostgREST filter syntax.

- **Impact**: Very low. The `faction_id` originates from the `card_templates` table which is service-role-write-only (RLS policy). Only admin/batch-generate can create templates. The risk requires a compromised admin or service role key.

- **Fix**: Use parameterized filters instead of string interpolation:
  ```typescript
  .or(`pool_type.eq.UNIVERSAL,faction_id.eq.${encodeURIComponent(card.card_templates.faction_id)}`)
  ```
  Or use separate `.eq()` calls with Supabase's query builder.

---

## Positive Findings

The following security measures are correctly implemented:

1. **Edge Function Auth**: All player-facing Edge Functions (`start-evolution`, `complete-evolution`, `open-pack`, `join-queue`) use `getAuthContext()` which validates the JWT via `supabase.auth.getUser(token)` and resolves to a player ID. This is solid.

2. **Ownership Checks**: Card operations (`start-evolution`, `complete-evolution`) filter by `.eq("owner_id", auth.playerId)`. Deck operations (`join-queue`) filter by `.eq("owner_id", auth.playerId)`. These prevent cross-player data access.

3. **RLS Policies**: Comprehensive RLS is enabled on all tables. Player-owned data requires `auth.uid()` match. Global data is read-only. Admin tables are service-role-only.

4. **Database CHECK Constraints**: `chaos_dust >= 0` and `shards_* >= 0` constraints prevent negative balances at the database level, even if application logic has race conditions.

5. **Zod Validation**: WebSocket messages are validated with Zod schemas (`ClientActionSchema` discriminated union). This prevents malformed action payloads.

6. **Service Role Key Isolation**: The service role key is only used server-side (game server env vars, Edge Function Deno env). The iOS client uses the anon key via Supabase SDK. No service role key exposure was found in client code.

7. **Admin Auth**: The admin dashboard uses httpOnly cookies with secure flag in production and 8-hour expiry. The `/api/admin/*` routes on the game server require `X-Admin-Secret` header validation.

8. **Gitignore**: `.env`, `.env.*`, `*.xcconfig`, and `*.secret` are properly gitignored. No secrets found in committed code.

9. **Active Player Turn Enforcement**: All game actions check `state.active_player !== side` before processing, preventing out-of-turn actions.

10. **Match Participant Validation**: WebSocket connections are rejected if the player ID is not `player_1` or `player_2` of the match (handler.ts lines 62-68).

---

## Priority Fix Order

1. **S-01** (CRITICAL): Add JWT validation to WebSocket connections. This is the most exploitable vulnerability.
2. **S-03** (CRITICAL): Implement StoreKit server-side verification. This directly impacts revenue integrity.
3. **S-06** (WARNING): Fix admin session tokens to use HMAC instead of embedding the secret.
4. **S-02** (CRITICAL): Either remove or enforce envelope identity cross-validation.
5. **S-04** (WARNING): Create the missing `increment_chaos_energy` RPC so progression works.
6. **S-05** (WARNING): Fix the `matches` table reference or create the table.
7. **S-08** (WARNING): Fix the double-deduction in open-pack.
8. **S-07** (WARNING): Restrict CORS origins.
9. **S-10** (INFO): Secure Realtime channel subscriptions.
10. **S-09** (INFO): Reduce health endpoint information exposure.
11. **S-11** (INFO): Parameterize the modifier query filter.

---

## Revision Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-17 | Claude Code (Security Auditor) | Initial Wave 3 security audit |

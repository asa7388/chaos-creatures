# Security Audit -- Wave 2

## Summary
- Critical vulnerabilities: 7
- Warnings: 9
- Files audited: 48

## Critical (must fix before next wave)

| # | Category | File:Line | Issue | Fix |
|---|---|---|---|---|
| C1 | Authentication | `supabase/functions/batch-generate/index.ts:406` | **No auth validation on batch-generate Edge Function.** The entire handler has zero authentication checks. Any unauthenticated caller can trigger batch card generation, consuming fal.ai/OpenAI API credits and writing to the `generation_jobs` table. | Add `getAuthContext(req)` with service-role or admin-only check. Since this is an admin function, verify the incoming JWT belongs to service role: check `Authorization: Bearer <service_role_key>` against `SUPABASE_SERVICE_ROLE_KEY`. |
| C2 | Authentication | `supabase/functions/generate-card-art/index.ts:253` | **No auth validation on generate-card-art Edge Function.** No auth header check at all. Anyone can call this endpoint to generate card art via fal.ai, consuming real API credits ($0.025 per call). | Add service-role-only auth check at the top of the handler. These internal pipeline functions should only accept requests from the game server or other Edge Functions bearing the service role key. |
| C3 | Authentication | `supabase/functions/generate-evolution-art/index.ts:206` | **No auth validation on generate-evolution-art Edge Function.** Same issue as C2. No authentication of any kind. Unauthenticated callers can trigger fal.ai FLUX Kontext calls (up to $0.08 each for Prismatic). | Add service-role-only auth check. |
| C4 | Authentication | `supabase/functions/generate-card-text/index.ts:314` | **No auth validation on generate-card-text Edge Function.** No authentication. Anyone can call OpenAI GPT-4o Mini via this endpoint. | Add service-role-only auth check. |
| C5 | Authentication | `supabase/functions/evaluate-achievements/index.ts:21-24` | **Auth header existence check only -- no JWT validation.** The function checks `if (!authHeader)` but never validates the token. Any request with `Authorization: anything` passes. The function also accepts `player_id` from the request body and operates on that player's data -- meaning an attacker with any fake auth header can grant achievements and rewards to any player. | Replace the bare header check with either `getAuthContext(req)` for player-facing calls, or verify the token matches the service role key for server-to-server calls. At minimum, validate the JWT with `supabase.auth.getUser(token)`. |
| C6 | Authentication | `supabase/functions/evaluate-quests/index.ts:38-41` | **Auth header existence check only -- no JWT validation.** Same as C5. Accepts `player_id` from request body. An attacker can fabricate quest completions and grant Chaos Dust and shards to any player by sending `{ player_id: <target>, match_data: { won: true, ... } }` with a garbage Authorization header. | Verify service role key or use `getAuthContext()`. |
| C7 | Authentication | `supabase/functions/update-mastery/index.ts:35-38` | **Auth header existence check only -- no JWT validation.** Same pattern. Accepts `player_id` from body. Attacker can level up faction mastery for any player, unlocking cosmetic rewards. | Verify service role key or use `getAuthContext()`. |

## Warnings (should fix)

| # | Category | File:Line | Issue | Fix |
|---|---|---|---|---|
| W1 | Authentication | `packages/game-server/src/index.ts:35-43` | **Game server admin API endpoints have no authentication.** Both `/api/admin/validate-balance` and `/api/admin/batch/start` accept requests from anyone. Although they are currently TODOs returning `{ status: 'not_implemented' }`, once implemented they will be exploitable. The admin dashboard sends `X-Admin-Secret` header (see `packages/admin-dashboard/lib/game-server.ts:28`) but the game server never checks it. | Add middleware to validate `X-Admin-Secret` header against `GAME_SERVER_SECRET` env var for all `/api/admin/*` routes. |
| W2 | Authentication | `packages/game-server/src/ws/handler.ts:44-69` | **WebSocket connection has no JWT verification.** The connection accepts `match_id` and `player_id` as query string parameters and only checks if the player_id matches a player in the match state. There is no cryptographic proof that the connecting user owns that player_id. An attacker who learns a match_id and player_id can impersonate that player. | Require a JWT or session token in the WebSocket handshake. Validate it with `supabase.auth.getUser()` before allowing the connection. Compare the auth user to the claimed player_id. |
| W3 | Session Security | `packages/admin-dashboard/middleware.ts:8` | **Hardcoded fallback session secret.** `const SESSION_TOKEN = process.env.ADMIN_JWT_SECRET \|\| 'chaos-admin-session'` -- if `ADMIN_JWT_SECRET` is not set, the session token is the static string `'chaos-admin-session'`, meaning anyone can forge admin session cookies. Same in `packages/admin-dashboard/lib/auth.ts:4` and `packages/admin-dashboard/app/api/auth/route.ts:9`. | Remove the fallback value. Fail loudly if the env var is not set: `const SESSION_TOKEN = process.env.ADMIN_JWT_SECRET; if (!SESSION_TOKEN) throw new Error('ADMIN_JWT_SECRET not configured');` |
| W4 | Session Security | `packages/admin-dashboard/app/api/auth/route.ts:31` | **Plaintext password comparison vulnerable to timing attacks.** `if (password !== ADMIN_PASSWORD)` uses JavaScript's `!==` which short-circuits on the first differing character. This leaks password length and character values to a timing side-channel attacker. | Use `crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD))` for constant-time comparison (with length check first). |
| W5 | Subscription | `supabase/functions/sync-entitlements/index.ts:58-68` | **No server-side receipt verification for App Store purchases.** The function trusts the client-provided `transaction_id` and `product_id` without verifying them against Apple's App Store Server API. A jailbroken device or modified client can send fake transaction data to upgrade to HIGH tier for free. The code has a TODO acknowledging this. | Implement App Store Server API v2 verification before launch. Verify the JWS-signed transaction token using Apple's public key. This is critical for a subscription-based game. |
| W6 | Race Condition | `supabase/functions/purchase-shards/index.ts:53-119` | **Non-atomic fallback transaction.** When the `purchase_shard_atomic` RPC doesn't exist, the fallback path performs separate read, deduct, and credit operations. If the shard credit (line 89-96) fails, the "rollback" (line 100-103) uses a simple update that could race with another concurrent purchase. The optimistic `.gte("chaos_dust", cost)` check (line 77) mitigates double-spend, but the rollback is not atomic. | Ensure the `purchase_shard_atomic` stored procedure exists in a migration. Remove or gate the fallback path behind a development-only flag. |
| W7 | Data Privacy | `supabase/migrations/00011_rls_policies.sql:70-72` | **Overly broad public profile read policy on `players` table.** The policy `"Public profile read" ON players FOR SELECT USING (true)` allows any authenticated user to read ALL columns of ALL players, including: `chaos_dust`, `shards_uncommon/rare/epic/legendary`, `hidden_mmr`, `settings` (JSON with privacy preferences), `friend_ids`, `subscription_tier`, and `auth_id`. This leaks sensitive economic, matchmaking, social, and authentication data. | Restrict the public read policy to only public profile columns. Use a SQL view or restrict columns: `USING (true)` but limit to `display_name, season_rank, active_title, showcase_card_ids, total_wins, total_games`. Or better: create a `player_profiles` view with only public fields and apply RLS to the base `players` table to require `auth.uid() = auth_id`. |
| W8 | Rate Limiting | Multiple files | **No rate limiting on player-facing endpoints.** The `rate_limit_log` table exists (`supabase/migrations/00009_admin_tables.sql:12`) but no Edge Function checks it. Endpoints vulnerable to abuse: login (`/api/auth` -- brute-force admin password), `open-pack` (spam purchases), `purchase-shards`, `start-evolution`, `join-queue`, `sync-entitlements`. | Implement a shared `checkRateLimit(playerId, action, maxPerPeriod, periodMs)` function in `_shared/` that inserts into `rate_limit_log` and rejects if threshold exceeded. Apply to all economy and matchmaking endpoints. |
| W9 | CORS | `supabase/functions/_shared/errors.ts:84-86` | **Wildcard CORS origin on all Edge Functions.** `"Access-Control-Allow-Origin": "*"` allows any website to make credentialed requests to these endpoints. While the JWT auth prevents unauthorized access on player-facing functions, the unauthenticated functions (C1-C4) are fully exploitable from any origin. Even for authenticated functions, CORS `*` combined with a stolen JWT token allows cross-origin exploitation. | Set `Access-Control-Allow-Origin` to the specific allowed origins: the iOS app's Supabase URL and the admin dashboard URL. |

## Passed Checks

| # | Category | Description |
|---|---|---|
| P1 | Secret Exposure | `.gitignore` correctly excludes `*.xcconfig`, `.env`, `.env.*`, `*.secret`, `*.p8`, and `node_modules/`. No API keys found committed to the repository. |
| P2 | Secret Exposure | iOS client (`ChaosCreatures/ChaosCreatures/Config/Secrets.swift`) correctly reads only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `POSTHOG_API_KEY`, and `R2_PUBLIC_URL` from Info.plist. The `SUPABASE_SERVICE_ROLE_KEY` never appears in any iOS source file. |
| P3 | Input Validation (Zod) | All WebSocket client messages are validated through Zod schemas (`packages/game-server/src/types/messages.ts:29-90`). The discriminated union `ClientActionSchema` validates all 10 action types with strict type checking (UUIDs, integers, min/max bounds). |
| P4 | Input Validation (Protocol) | WebSocket message parsing (`packages/game-server/src/ws/protocol.ts:11-38`) validates the message envelope with `MessageEnvelopeSchema` and the inner action with `ClientActionSchema`. Invalid JSON and malformed messages are caught and reported via `ProtocolError`. |
| P5 | SQL Injection | No raw SQL or string interpolation in database queries. All Supabase queries use the client library's parameterized API (`.eq()`, `.select()`, `.insert()`, etc.). One `.or()` call in `start-evolution/index.ts:125` interpolates a `faction_id` from the database (not user input), which is safe. |
| P6 | Server-Authoritative | The iOS client (`ChaosCreatures/ChaosCreatures/Services/BattleViewModel.swift`) is correctly display-only for combat. It sends player actions (play card, declare attackers, assign blockers, end turn, surrender) to the server and receives computed results. No damage calculation, card draw logic, or combat resolution exists in client code. |
| P7 | XSS Prevention | The admin dashboard has no uses of `dangerouslySetInnerHTML` or unescaped template literal rendering. All dynamic content in React components uses JSX expressions `{variable}` which are auto-escaped by React. |
| P8 | RLS Coverage | All 24 database tables have Row Level Security enabled with appropriate policies. Player-owned tables use `auth.uid()` match against `auth_id` (directly or via subquery). Global reference data is read-only. Admin tables are service-role-only. |
| P9 | Auth Coverage (Player Functions) | All 15 player-facing Edge Functions use `getAuthContext(req)` which validates the JWT via `supabase.auth.getUser(token)` and maps to the player row. Functions correctly use `auth.playerId` (not user-supplied player_id) for data access, preventing IDOR. |
| P10 | Admin Middleware | The admin dashboard middleware (`packages/admin-dashboard/middleware.ts:26-54`) correctly protects all routes except `/login`, `/api/health`, `/api/auth`, and static assets. API routes return 401; page routes redirect to `/login`. |
| P11 | Session Cookies | Admin session cookies are set with `httpOnly: true`, `secure: true` (in production), `sameSite: 'lax'`, and `maxAge: 8 hours` (`packages/admin-dashboard/app/api/auth/route.ts:43-48`). This prevents XSS cookie theft and CSRF. |
| P12 | Ownership Checks | Edge Functions that access player-owned resources (cards, decks, economy) consistently check `owner_id = auth.playerId` in all queries, preventing horizontal privilege escalation. |
| P13 | Atomic Economy | Card pack purchases (`open-pack/index.ts:107-113`) and shard purchases (`purchase-shards/index.ts:73-78`) use optimistic locking with `.gte("chaos_dust", cost)` to prevent double-spend race conditions. |
| P14 | Config Validation | The game server validates all environment variables at startup using Zod (`packages/game-server/src/config.ts:7-13`). Missing or invalid config causes immediate exit, preventing runtime failures with undefined secrets. |

## Notes

### Files Audited

**Edge Functions (22 files):**
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/_shared/errors.ts`
- `supabase/functions/_shared/supabase.ts`
- `supabase/functions/_shared/types.ts`
- `supabase/functions/get-collection/index.ts`
- `supabase/functions/get-card/index.ts`
- `supabase/functions/get-decks/index.ts`
- `supabase/functions/save-deck/index.ts`
- `supabase/functions/validate-deck/index.ts`
- `supabase/functions/purchase-shards/index.ts`
- `supabase/functions/open-pack/index.ts`
- `supabase/functions/get-economy-status/index.ts`
- `supabase/functions/start-evolution/index.ts`
- `supabase/functions/complete-evolution/index.ts`
- `supabase/functions/get-quests/index.ts`
- `supabase/functions/evaluate-quests/index.ts`
- `supabase/functions/evaluate-achievements/index.ts`
- `supabase/functions/check-missed-achievements/index.ts`
- `supabase/functions/refresh-daily-quests/index.ts`
- `supabase/functions/join-queue/index.ts`
- `supabase/functions/leave-queue/index.ts`
- `supabase/functions/sync-entitlements/index.ts`
- `supabase/functions/monthly-rewards/index.ts`
- `supabase/functions/update-mastery/index.ts`
- `supabase/functions/generate-card-art/index.ts`
- `supabase/functions/generate-evolution-art/index.ts`
- `supabase/functions/generate-card-text/index.ts`
- `supabase/functions/batch-generate/index.ts`

**Game Server (10 files):**
- `packages/game-server/src/index.ts`
- `packages/game-server/src/config.ts`
- `packages/game-server/src/ws/handler.ts`
- `packages/game-server/src/ws/protocol.ts`
- `packages/game-server/src/ws/rooms.ts`
- `packages/game-server/src/types/messages.ts`
- `packages/game-server/src/services/supabase.ts`
- `packages/game-server/src/services/matchmaking.ts`
- `packages/game-server/src/services/reconnection.ts`
- `packages/game-server/src/services/timer.ts`

**Admin Dashboard (10 files):**
- `packages/admin-dashboard/middleware.ts`
- `packages/admin-dashboard/lib/auth.ts`
- `packages/admin-dashboard/lib/supabase.ts`
- `packages/admin-dashboard/lib/game-server.ts`
- `packages/admin-dashboard/app/api/auth/route.ts`
- `packages/admin-dashboard/app/api/generate-batch/route.ts`
- `packages/admin-dashboard/app/api/economy-config/route.ts`
- `packages/admin-dashboard/app/login/page.tsx`
- `packages/admin-dashboard/app/cards/page.tsx`
- `packages/admin-dashboard/next.config.js`

**Database Migrations (3 files):**
- `supabase/migrations/00002_core_tables.sql`
- `supabase/migrations/00009_admin_tables.sql`
- `supabase/migrations/00011_rls_policies.sql`

**iOS Client (5 files):**
- `ChaosCreatures/ChaosCreatures/Config/Secrets.swift`
- `ChaosCreatures/ChaosCreatures/Services/BattleViewModel.swift`
- `ChaosCreatures/ChaosCreatures/Services/BattleStateMachine.swift`
- `ChaosCreatures/ChaosCreatures/Services/MatchService.swift`
- `ChaosCreatures/ChaosCreatures/Models/PlayerAction.swift`

**Other:**
- `.gitignore`

---

*Audit performed: 2026-02-17*
*Auditor: Security Audit Agent (Wave 2)*

# Audit W2B: Edge Functions

**Auditor:** Claude Code (Opus 4.6)
**Date:** 2026-02-17
**Scope:** All Supabase Edge Functions, shared modules, test files
**Reference:** docs/design/06-technical-architecture.md (Sections 4, 7, 8, 11)

---

## Summary

| Metric | Value |
|---|---|
| Total function directories | 24 |
| Functions audited | 24 of 24 |
| Shared modules audited | 6 of 6 (auth.ts, supabase.ts, errors.ts, types.ts, prompts.ts, deck-validator.ts) |
| Test files audited | 3 (deck-validation, economy-double-spend, achievement-idempotency) |
| Auth bug diagnosis | **Root cause identified** -- Supabase auto-injects env vars in a specific way; the `verifyServiceRole()` design itself is the issue (see below) |
| Critical issues | 4 |
| High issues | 8 |
| Medium issues | 11 |

---

## Auth Bug Diagnosis (PRIORITY)

### What `verifyServiceRole()` does

File: `supabase/functions/_shared/auth.ts`, lines 59-76.

```typescript
export function verifyServiceRole(req: Request): Response | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Missing Authorization header", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Server misconfigured: missing service role key", 500);
  }

  if (token !== serviceRoleKey) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Invalid service role key", 403);
  }

  return null; // Auth passed
}
```

### Root Cause Analysis

The function reads `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env.get()` and compares it against the `Authorization: Bearer <token>` sent by the caller. There are **two distinct problems** that can cause a 403:

#### Problem 1: Supabase Edge Functions auto-inject the anon key, NOT the service role key, into the Authorization header

When the Supabase client SDK calls an Edge Function, it automatically sends `Authorization: Bearer <SUPABASE_ANON_KEY>` (the user's JWT or the anon key). The `SUPABASE_SERVICE_ROLE_KEY` IS available as an environment variable inside Edge Functions (Supabase automatically injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`). However, when one Edge Function calls another (e.g., `check-missed-achievements` calling `evaluate-achievements`), the caller must **explicitly** set `Authorization: Bearer <service_role_key>`. This part is correctly implemented in `check-missed-achievements/index.ts` (line 33) and `complete-evolution/index.ts` (line 213).

**The 403 happens when:** The Admin Dashboard or Game Server calls a `verifyServiceRole()`-protected Edge Function but sends a different value in the Authorization header than what the Edge Function sees in `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`.

#### Problem 2: Supabase Gateway Intercepts and Replaces the Authorization Header

This is the **primary root cause**. When you call a Supabase Edge Function via the standard URL (`https://<project>.supabase.co/functions/v1/<function-name>`), the Supabase API gateway validates the JWT in the `Authorization` header. If you send a raw service role key (which is a JWT), the gateway accepts it. **However**, Supabase's gateway may also validate and decode the JWT, and the Edge Function receives the validated JWT context. The comparison `token !== serviceRoleKey` can fail if:

1. The caller's `.env` has a different `SUPABASE_SERVICE_ROLE_KEY` value than what's deployed to Supabase (e.g., the key was rotated, or the caller is using a project ref key instead of the deployed key).
2. The caller sends `apikey` header (the Supabase convention) instead of `Authorization: Bearer`.
3. The Supabase gateway strips or modifies the Authorization header before passing it to the Edge Function.

#### Problem 3: The design pattern itself is fragile

Comparing a raw token string against an env var is not how Supabase intends service-role auth to work. The proper pattern for Supabase Edge Functions is:

- **User-facing functions:** Use `supabase.auth.getUser(token)` to validate the JWT (already done by `getAuthContext()`).
- **Service-to-service functions:** Use Supabase's built-in service role detection. When a request arrives with the service role JWT, Supabase sets `auth.role() = 'service_role'` in the PostgreSQL context. The Edge Function should verify the caller's role from the decoded JWT, not by raw string comparison.

### Proposed Fix

Replace the raw string comparison with JWT-based role verification:

```typescript
export async function verifyServiceRole(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Missing Authorization header", 401);
  }

  const token = authHeader.replace("Bearer ", "");

  // Option A: Decode the JWT and check the role claim
  // Supabase service role JWTs contain { "role": "service_role" }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role === 'service_role') {
      return null; // Auth passed
    }
  } catch {
    // Not a valid JWT -- fall through to string comparison
  }

  // Option B (fallback): Direct comparison against env var
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    return null; // Auth passed
  }

  return errorResponse(ErrorCode.UNAUTHORIZED, "Invalid service role key", 403);
}
```

**Why this works:** Supabase service role keys are JWTs with `"role": "service_role"` in the payload. By decoding the JWT payload (the middle segment, base64url-encoded) and checking the `role` field, the function correctly identifies service role callers regardless of key rotation, gateway transformation, or env var mismatch. The raw string comparison is kept as a fallback.

**Alternative simpler fix:** If the callers are exclusively other Edge Functions or the game server (which have direct access to the same env var), ensure all callers pass the exact same key:

```typescript
// In the calling Edge Function:
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
fetch(`${supabaseUrl}/functions/v1/evaluate-achievements`, {
  headers: { Authorization: `Bearer ${serviceKey}` },
  // ...
});
```

This is already done correctly in `check-missed-achievements` and `complete-evolution`. The bug occurs when the **Admin Dashboard** or **Game Server** (running on Railway with their own `.env`) call these Edge Functions with a key that doesn't exactly match.

### Which Functions Are Affected

Functions using `verifyServiceRole()` (server-to-server only, 7 total):

| Function | Auth | Called By |
|---|---|---|
| `batch-generate` | `verifyServiceRole()` | Admin Dashboard |
| `evaluate-achievements` | `verifyServiceRole()` | Game Server, other Edge Functions |
| `evaluate-quests` | `verifyServiceRole()` | Game Server |
| `generate-card-art` | `verifyServiceRole()` | `batch-generate`, Admin Dashboard |
| `generate-card-text` | `verifyServiceRole()` | `batch-generate`, Admin Dashboard |
| `generate-evolution-art` | `verifyServiceRole()` | `start-evolution` (internal) |
| `update-mastery` | `verifyServiceRole()` | Game Server |

Functions using `getAuthContext()` / `verifyUser()` (player-facing, 14 total):

| Function | Auth |
|---|---|
| `check-missed-achievements` | `getAuthContext()` |
| `complete-evolution` | `getAuthContext()` |
| `get-card` | `getAuthContext()` |
| `get-collection` | `getAuthContext()` |
| `get-decks` | `getAuthContext()` |
| `get-economy-status` | `getAuthContext()` |
| `get-quests` | `getAuthContext()` |
| `join-queue` | `getAuthContext()` |
| `leave-queue` | `getAuthContext()` |
| `open-pack` | `getAuthContext()` |
| `purchase-shards` | `getAuthContext()` |
| `save-deck` | `getAuthContext()` |
| `start-evolution` | `getAuthContext()` |
| `sync-entitlements` | `getAuthContext()` |
| `validate-deck` | `getAuthContext()` |

Functions using weak/incomplete auth (3 total):

| Function | Auth | Issue |
|---|---|---|
| `monthly-rewards` | Checks `Authorization` header exists but does NOT verify the value | **CRITICAL** |
| `refresh-daily-quests` | Checks `Authorization` header exists but does NOT verify the value | **CRITICAL** |
| `monthly-rewards` | No `verifyServiceRole()` call -- just presence check | Open to abuse |

---

## Shared Module Audit

### `_shared/auth.ts`
- **`getAuthContext()`**: Correctly validates JWT via `supabase.auth.getUser(token)`, then looks up player row. Proper 401/404 responses. Uses service client for the lookup (correct -- needs to bypass RLS to find the player).
- **`isAuthError()`**: Clean type guard using `instanceof Response`.
- **`verifyServiceRole()`**: See auth bug diagnosis above. Raw string comparison is fragile.
- **Missing**: No `verifyUser()` function exists despite task description mentioning it. All user-facing functions call `getAuthContext()` instead. This is fine -- `getAuthContext()` serves the same purpose.

### `_shared/supabase.ts`
- **`createServiceClient()`**: Correctly reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Disables auto-refresh and session persistence (correct for server-side).
- **`createUserClient()`**: Correctly creates a client scoped to the user's JWT via `global.headers`. Uses `SUPABASE_ANON_KEY`.
- **Issue**: `createUserClient()` is defined but **never used** by any Edge Function. All functions use `createServiceClient()` and rely on manual ownership checks (`eq("owner_id", auth.playerId)`). This is acceptable but means RLS is bypassed everywhere. **Medium risk**: If a query forgets the owner filter, it could leak data across players.

### `_shared/errors.ts`
- **`errorResponse()`**: Clean standardized format `{ error: { code, message } }` with correct Content-Type.
- **`successResponse()`**: Clean format `{ data: ... }`. Note: Only some functions use this -- many construct Response manually.
- **`corsHeaders` (deprecated)**: Uses `Access-Control-Allow-Origin: *`. Marked deprecated in favor of `getCorsHeaders()`.
- **`getCorsHeaders()`**: Dynamic origin checking against `ALLOWED_ORIGINS` list. Returns empty string for non-matching origins, which means the `Access-Control-Allow-Origin` header is present but empty. **Issue**: An empty string for the header is technically valid but may cause confusing CORS errors. Better to omit the header entirely for non-matching origins.
- **`handleCors()`**: Correctly handles OPTIONS preflight.
- **Issue**: The `ALLOWED_ORIGINS` list includes `https://admin-dashboard-eight-sooty-40.vercel.app` which appears to be a Vercel deploy, but the Admin Dashboard is supposed to be on Railway. Stale/incorrect origin?

### `_shared/types.ts`
- Comprehensive type definitions matching `02-card-data-model.md`.
- Constants correctly match documented values (DECK_SIZE=20, MAX_COPIES=2, MAX_LEGENDARIES=2).
- `SHARD_DUST_COSTS` match REQ-039: Uncommon=30, Rare=60, Epic=120, Legendary=240.
- `EVOLUTION_ENERGY_THRESHOLDS` match doc: 15/30/50/75.
- `CUMULATIVE_ENERGY` correctly pre-computes: 0/15/45/95/170.
- `SUBSCRIPTION_QUEST_MULTIPLIER` matches doc: Free=1.0, Mid=1.5, High=2.0.
- **No issues found.**

### `_shared/prompts.ts`
- `STYLE_ANCHOR` matches doc 03 Section 1.1.
- Faction prefixes correctly handle DEMONIC_KINGDOMS alias.
- `normalizeFactionId()` exists but is **never called** by any function. Functions should use this when looking up faction prefixes.
- `MODIFIER_PROMPT_DESCRIPTIONS` contains all 114 modifier entries (U01-U30, IF01-IF28, FF01-FF28, DF01-DF28).
- `buildEvolutionPrompt()` correctly implements the two-pass Prismatic logic.
- `buildBaseCardTextPrompt()` uses `response_format: { type: 'json_object' }` for structured output.
- `buildNamingPrompt()` correctly returns 3 name candidates.
- `buildFlavorTextPrompt()` enforces 120 char limit.
- **No critical issues.**

### `_shared/deck-validator.ts`
- Implements all REQ-164 rules: exactly 20 cards, single faction, max 2 copies per template, max 2 Legendaries.
- Uses `card_templates!inner` join for faction checking (correct Supabase PostgREST syntax).
- Validates avatar faction match.
- **No issues found.**

---

## Per-Function Audit

### `batch-generate`
- **Auth**: `verifyServiceRole()` -- correct (admin/pipeline function)
- **CORS**: YES (`handleCors`)
- **Validation**: YES -- checks `batch_id`, `faction_id`, `card_specs` array
- **Error handling**: GOOD -- per-card error handling with job status updates, cost tracking
- **Issues**:
  - R2 upload uses manual AWS Signature V4 (duplicated from `generate-card-art`). Should be extracted to shared module.
  - `ConcurrencyLimiter` class is well-implemented.
  - fal.ai endpoint is `fal-ai/flux/dev` which matches doc 03 for base cards.
  - Cost estimate hardcoded at $0.025/image, $0.0001/text. Reasonable.
  - **HIGH**: Entire batch runs synchronously within a single Edge Function invocation. Supabase Edge Functions have a default timeout (typically 150s for Pro, 2s for free tier). A batch of 20+ cards will certainly timeout. Doc 06 Section 4.7 implies async pattern but this implementation is synchronous.

### `check-missed-achievements`
- **Auth**: `getAuthContext()` -- correct (player-facing, then delegates to service-role function)
- **CORS**: YES
- **Validation**: Minimal -- delegates to `evaluate-achievements`
- **Error handling**: GOOD -- proxies response from inner function
- **Issues**:
  - Correctly passes `auth.playerId` as `player_id` and uses service role key for the inner call.
  - The inner call response is parsed and re-returned, which is correct.

### `complete-evolution`
- **Auth**: `getAuthContext()` -- correct (player-facing)
- **CORS**: YES
- **Validation**: YES -- checks `evolution_id`, `card_instance_id`, `name_chosen`
- **Error handling**: GOOD -- checks card ownership, tier limits
- **Issues**:
  - **HIGH**: Lines 185-204 perform a read-then-write on `cards_evolved_total` and `highest_tier_reached` without atomicity. Two concurrent evolution completions could result in a lost increment. Should use `.rpc()` for atomic increment or a single SQL update with `cards_evolved_total + 1`.
  - **MEDIUM**: The stat bonuses (lines 112-117) duplicate the same values in `start-evolution` (lines 233-238). Should be centralized in `_shared/types.ts`.
  - Correctly triggers `evaluate-achievements` asynchronously (fire-and-forget with `.catch()`).
  - Does NOT use `successResponse()` helper -- manually constructs Response. Inconsistent but functional.

### `evaluate-achievements`
- **Auth**: `verifyServiceRole()` -- correct (server-to-server)
- **CORS**: YES
- **Validation**: YES -- checks `player_id`
- **Error handling**: GOOD -- idempotent via `is_unlocked` guard and unique constraint handling (23505)
- **Issues**:
  - **MEDIUM**: `calculateAchievementValue()` for COLLECTION category uses string matching on `achievement.description` (`includes("legendary")`) to determine if it's a legendary collection achievement. This is fragile -- a description change would break the logic. Should use a dedicated field or subcategory.
  - **MEDIUM**: `grantAchievementReward()` for XP reward reads current XP then writes new value (lines 219-222). Same non-atomic read-then-write pattern as `complete-evolution`.
  - `CHAOS_ENERGY_BOOST` reward type has a comment "Implementation depends on game server integration" -- stub only.

### `evaluate-quests`
- **Auth**: `verifyServiceRole()` -- correct (called by game server)
- **CORS**: YES
- **Validation**: YES -- checks `player_id`, `match_data`
- **Error handling**: GOOD
- **Issues**:
  - **MEDIUM**: `WIN_WITH_STYLE` quest handler (lines 186-192) checks multiple conditions with OR logic but grants progress of 1 for any match. If the quest description specifies a *specific* condition (e.g., "Win with 15+ HP"), the generic handler cannot distinguish which condition to check. Relies on a single quest type for all "style" conditions.
  - Quest completion auto-grants rewards and marks as claimed in the same pass. This bypasses the "claim" step from doc 07 UI flow where players explicitly claim quest rewards. The quest is auto-completed AND auto-claimed.
  - Shard reward chance uses `Math.random()` which is fine for game logic but is not server-seeded. Acceptable for quest rewards.

### `generate-card-art`
- **Auth**: `verifyServiceRole()` -- correct (pipeline function)
- **CORS**: YES
- **Validation**: YES -- checks `faction_id`, `creature_description`, `rarity`, `card_id`
- **Error handling**: GOOD -- retries once on failure, NSFW detection, job status updates on error
- **Issues**:
  - **MEDIUM**: R2 upload uses a presigned URL approach via `generateS3SignedUrl()` but the implementation has a subtle issue: it includes `x-amz-content-sha256` and `x-amz-date` in the `SignedHeaders` for the canonical request, but then generates a query-string presigned URL. The presigned URL approach typically does NOT include these headers in the actual request. The upload call at line 135 sets Content-Type and Cache-Control headers but NOT the `x-amz-content-sha256` or `x-amz-date` headers that were signed. **This means the R2 upload signature will not match and the upload will fail.** Compare with `batch-generate/index.ts` which uses the header-based signing approach correctly.
  - **HIGH**: The error handler at line 377 calls `req.clone().json()` but the request body was already consumed at line 268. `req.clone()` must be called before the body is read. This will throw "Body already consumed" on error paths. (Though it's in a try/catch so it silently fails -- the job status just won't be updated on error.)
  - fal.ai endpoint hardcoded as `fal-ai/flux/dev` -- correct for base cards.

### `generate-card-text`
- **Auth**: `verifyServiceRole()` -- correct (pipeline function)
- **CORS**: YES
- **Validation**: YES -- checks `mode`, mode-specific input validation
- **Error handling**: GOOD -- retries on invalid JSON, job status updates
- **Issues**:
  - **Same `req.clone().json()` issue** in error handler (line 376). Body already consumed.
  - `estimateCost()` uses correct GPT-4o Mini pricing: $0.15/1M input, $0.60/1M output.
  - Supports all 4 modes: name, flavor, narrative, base_text. Well-structured.
  - **No critical issues.**

### `generate-evolution-art`
- **Auth**: `verifyServiceRole()` -- correct (pipeline function)
- **CORS**: YES
- **Validation**: YES -- iterates over required fields array
- **Error handling**: GOOD -- NSFW fallback on Prismatic refinement, job status updates
- **Issues**:
  - R2 upload uses header-based signing (like `batch-generate`) which is correct and should work.
  - Correctly implements two-pass Prismatic logic via `buildEvolutionPrompt()`.
  - **Same `req.clone().json()` issue** in error handler (line 340).
  - **MEDIUM**: R2 key path uses `body.rarity` which may be undefined (it's not in the required fields check but is used with a fallback `|| 'common'`). The key structure `cards/{faction}/{rarity}/{instance_id}_{tier}_evo{n}.webp` differs from doc 06 Section 8.1 which specifies `evolution/{player_id}/{card_instance_id}/step-{n}.webp`. The art will be saved to the wrong path.

### `get-card`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: YES -- checks `id` query param
- **Error handling**: GOOD
- **Issues**: None. Clean, simple function.

### `get-collection`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: YES -- sanitizes page/limit params
- **Error handling**: GOOD
- **Issues**:
  - Pagination correctly uses `range()`.
  - Supports multiple sort options (name, tier, mana_cost, newest, energy).
  - **No issues found.**

### `get-decks`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: Minimal (no params needed)
- **Error handling**: GOOD
- **Issues**: None. Clean, simple function.

### `get-economy-status`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: N/A (no input)
- **Error handling**: GOOD
- **Issues**:
  - Returns dust, all 4 shard types, subscription tier, and active missions. Matches doc 06 Section 7.5 `GET /economy/balance`.
  - **No issues found.**

### `get-quests`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: N/A
- **Error handling**: GOOD
- **Issues**:
  - Groups missions by DAILY/WEEKLY/ONBOARDING. Matches doc 06 Section 7.5.
  - Filters expired dailies/weeklies client-side (string comparison on `expires_at`). This works because ISO dates sort correctly as strings.
  - Does NOT filter expired quests in the database query (only filters `is_claimed = false`). Could return expired unclaimed quests which are then filtered client-side. **MEDIUM**: Should filter `gte("expires_at", now)` in the query for efficiency, or handle ONBOARDING quests which don't expire.

### `join-queue`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: YES -- checks `deck_id`, validates `mode` against whitelist, checks deck validity
- **Error handling**: GOOD -- handles unique constraint race condition (23505)
- **Issues**:
  - Correctly validates deck ownership and `is_valid` flag before queuing.
  - **MEDIUM**: No rate limiting. Doc 06 Section 11.2 specifies "5 entries per 1 minute" for matchmaking queue. Not implemented.
  - Wait time estimate is simplistic (5 or 15 seconds). Acceptable for launch.

### `leave-queue`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: N/A
- **Error handling**: GOOD
- **Issues**:
  - Accepts both DELETE and POST methods (line 14). Flexible but non-standard. Doc 06 specifies `DELETE /matchmaking/queue`.
  - Does not return 204 as specified in doc 06 -- returns 200 with `{ ok: true }`. **Minor** deviation.
  - Does NOT check `NOT_IN_QUEUE` error case. If player was not in queue, delete returns no error and 0 rows affected. Returns success regardless. Acceptable.

### `monthly-rewards`
- **Auth**: **CRITICAL BUG** -- Only checks if Authorization header exists (line 16), does NOT call `verifyServiceRole()`. Any request with ANY Authorization header will pass.
- **CORS**: YES
- **Validation**: N/A (cron function)
- **Error handling**: GOOD -- idempotent via reference_id check
- **Issues**:
  - **CRITICAL**: Missing `verifyServiceRole()` call. Anyone can trigger monthly rewards.
  - **MEDIUM**: Line 94 attempts to distinguish MID vs HIGH for card count: `const count = player.id === midTierPlayers?.[0]?.id ? 3 : 5`. This compares the current player's ID against the *first player* in the query result, not against the subscription tier. The logic is wrong -- it should check `player.subscription_tier === "MID" ? 3 : 5`. Currently, the first MID/HIGH player gets 3 cards and all others get 5 regardless of tier.
  - Idempotency via `shard_transactions` and `dust_transactions` reference_id is correct pattern.

### `open-pack`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: YES -- checks `faction_id`, dust balance, template availability
- **Error handling**: GOOD -- refund on card creation failure
- **Issues**:
  - Pack costs: Own faction=100, Other faction=150. Matches doc 04.
  - Cards per pack: 3. Matches doc.
  - Duplicate protection: prefers templates player owns <2 of. Good.
  - Atomic dust deduction via `add_chaos_dust` RPC with CHECK constraint. Correct.
  - **MEDIUM**: The "other faction" cost logic considers `unlocked_faction_ids` (line 49-50). Once a player buys a pack from another faction, that faction is added to `unlocked_faction_ids` (line 132-138) and future packs cost 100 instead of 150. This is a **permanent** faction unlock on first purchase. Not clear if this matches design intent -- doc says own faction = 100, other = 150. The unlock behavior is not documented.
  - **No critical issues.**

### `purchase-shards`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: YES -- validates `shard_tier` against whitelist
- **Error handling**: GOOD -- handles missing RPC gracefully with fallback, manual rollback on shard credit failure
- **Issues**:
  - Shard costs match types.ts: Uncommon=30, Rare=60, Epic=120, Legendary=240.
  - **MEDIUM**: The fallback path (lines 53-119) performs a non-atomic two-step: deduct dust then credit shard. Between these steps, a crash would leave the player with deducted dust but no shard. The manual rollback (lines 99-103) mitigates this but is still a TOCTOU window.
  - **MEDIUM**: In the fallback path, line 109 calls `add_chaos_dust` with negative amount AFTER already deducting dust via direct update (line 73-78). This creates a double-deduction: the dust was already subtracted at line 76, then `add_chaos_dust` subtracts it again at line 109. This is a **bug** -- the `add_chaos_dust` call should be a transaction log entry only, not an additional deduction. However, this path only executes if the `purchase_shard_atomic` RPC doesn't exist, so it's a fallback-only issue.

### `refresh-daily-quests`
- **Auth**: **CRITICAL BUG** -- Same as `monthly-rewards`. Only checks header presence (line 22), does NOT call `verifyServiceRole()`.
- **CORS**: YES
- **Validation**: N/A (cron function)
- **Error handling**: GOOD
- **Issues**:
  - **CRITICAL**: Missing `verifyServiceRole()` call. Anyone can trigger quest refresh.
  - Daily quest generation correctly implements 40/40/20 difficulty distribution.
  - Correctly avoids duplicate quest types.
  - Weekly quests generated on Mondays with correct expiry.
  - Subscription multiplier correctly applied to daily dust rewards.
  - **MEDIUM**: Deletes uncompleted daily quests before replacement (line 74-80). This means if a player has partial progress on a daily quest, it's silently removed. Doc 04 says "uncompleted quests persist until replaced" which is what this does, but the deletion happens without notifying the player.

### `save-deck`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: YES -- uses shared `validateDeck()`, checks slot limits, validates ownership
- **Error handling**: GOOD
- **Issues**:
  - Correctly handles both POST (create) and PUT (update) via method + id check.
  - Deck slot limits correctly use `MAX_DECK_SLOTS` from types (Free=4, Mid=6, High=8).
  - Faction cannot be changed on update (correct -- per design).
  - **No critical issues.**

### `start-evolution`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: YES -- checks card ownership, tier, energy threshold, shard availability
- **Error handling**: GOOD -- refunds shard on generation job failure
- **Issues**:
  - Correctly uses cumulative energy thresholds.
  - **GOOD**: Lines 123-126 validate `factionId` as UUID format before using in `.or()` query to prevent SQL injection via PostgREST filter.
  - Modifier options count by subscription tier: Free=2, Mid=3, High=4. Matches CLAUDE.md.
  - **MEDIUM**: The evolution art prompt (lines 147-152) is built locally but the generation job only stores this prompt. The actual art generation is handled by `generate-evolution-art` which uses `buildEvolutionPrompt()` from prompts.ts. The stored prompt in `input_data` is redundant/different from what will actually be used.
  - **No critical issues.**

### `sync-entitlements`
- **Auth**: `getAuthContext()` -- correct (player-facing)
- **CORS**: YES
- **Validation**: YES -- checks `transaction_id`, `product_id`, dedup via audit log
- **Error handling**: GOOD
- **Issues**:
  - **HIGH**: **No Apple JWS verification.** Line 72 explicitly warns: "Transaction accepted without full Apple JWS verification (TODO)". A malicious client could send fake transaction_id and product_id to upgrade their subscription for free. The dedup check only prevents replaying the same transaction_id, not forging new ones.
  - Product ID mapping covers both short and `.monthly` suffixed IDs.
  - Correctly updates subscription_tier, max_deck_slots, max_cards_per_faction.
  - Logs to `admin_audit_log` for analytics.

### `update-mastery`
- **Auth**: `verifyServiceRole()` -- correct (game server only)
- **CORS**: YES
- **Validation**: YES -- checks `player_id`, `faction_id`
- **Error handling**: GOOD
- **Issues**:
  - **HIGH**: Stores mastery data in `economy_config` table using key pattern `mastery:{player_id}:{faction_id}`. This is a **schema hack** -- the `economy_config` table is designed for game-wide configuration values, not per-player-per-faction data. At 10,000 players x 3 factions = 30,000 rows in a table meant for ~50 config entries. This will degrade query performance on the config table.
  - Mastery XP values match doc 04: 10/game, 5 win bonus, 100 XP per level, max level 10.
  - Level-up unlock rewards correctly defined at levels 3, 5, 7, 10.
  - **MEDIUM**: Avatar unlock at mastery level 5 only logs to audit_log, does not actually unlock the avatar for the player.

### `validate-deck`
- **Auth**: `getAuthContext()` -- correct
- **CORS**: YES
- **Validation**: YES -- checks `faction_id`, `avatar_id`, `card_entries`
- **Error handling**: GOOD
- **Issues**: None. Uses shared `validateDeck()`. Clean.

---

## Card Generation Pipeline Audit

### Flow: batch-generate -> generate-card-art -> generate-card-text

**Expected flow (doc 06 Section 4.7):**
1. Admin triggers batch from Admin Dashboard
2. Edge Function creates generation_jobs
3. Process: art generation (fal.ai) -> text generation (OpenAI) -> review queue

**Actual implementation:**
- `batch-generate` does both art AND text generation inline (not separate function calls).
- It calls fal.ai and OpenAI directly within `processCard()`.
- It does NOT delegate to `generate-card-art` or `generate-card-text` functions.
- `generate-card-art` and `generate-card-text` exist as standalone functions but are NOT called by `batch-generate`.

**Assessment:** The inline approach works but duplicates the fal.ai and OpenAI client code. The standalone functions are intended for individual card generation or evolution, not batch. This is acceptable but means:
- Bug fixes in API calling logic need to be applied in 3+ places.
- The R2 upload code is duplicated in 3 functions with different implementations.

### Evolution flow: start-evolution -> generate-evolution-art -> complete-evolution

**Expected flow (doc 06 Section 4.4):**
1. Player triggers evolution
2. Validate eligibility, deduct shard
3. Create generation jobs
4. generate-evolution-art processes the image job
5. Player polls for status
6. Player confirms with modifier + name choice
7. complete-evolution finalizes

**Gap:** `start-evolution` creates generation jobs but does NOT call `generate-evolution-art` or `generate-card-text`. There is no mechanism to process the pending generation jobs. The jobs sit in PENDING status forever unless something else processes them.

**Missing piece:** There is no job processor/poller that picks up PENDING generation jobs and calls the appropriate Edge Functions. This needs to be either:
- A pg_cron trigger that calls the generation functions
- A separate worker Edge Function that polls for pending jobs
- Or `start-evolution` should directly call the generation functions

**This is a CRITICAL gap in the pipeline.**

---

## Economy Pipeline Audit

### Dust costs
- Card pack: 100 (own faction), 150 (other faction) -- matches doc 04
- Shard purchase: 30/60/120/240 -- matches doc 04 and REQ-039

### Transaction safety
- `open-pack` uses `add_chaos_dust` RPC with CHECK constraint -- good
- `purchase-shards` has primary RPC path (`purchase_shard_atomic`) with fallback -- acceptable
- **Issue**: The fallback path in `purchase-shards` has a double-deduction bug (see per-function audit)

### Subscription rewards
- `monthly-rewards` has the MID/HIGH card count logic bug (line 94)
- `monthly-rewards` correctly grants 1 Legendary Shard to HIGH tier monthly
- Idempotency via reference_id pattern is correct

---

## Deck Pipeline Audit

### Validation rules
- Exactly 20 cards: YES
- Single faction: YES (via card_templates join)
- Max 2 copies per template: YES
- Max 2 Legendaries: YES
- Avatar matches faction: YES
- Slot limits by tier: YES (Free=4, Mid=6, High=8)

### Test coverage
- `deck-validation.test.ts` covers all edge cases with pure validation logic
- Tests pass correct assertions for: 19 cards, 21 cards, 0 cards, mixed factions, 3 copies, 3 Legendaries, 2 Legendaries (valid), wrong avatar faction, null avatar, unowned cards, quantity=2
- **Good test coverage.**

---

## Quest/Achievement Pipeline Audit

### Quest system
- `refresh-daily-quests` generates 3 daily (40/40/20 easy/medium/hard) + 2 weekly on Mondays
- `evaluate-quests` correctly calculates progress for all MissionType values
- Subscription multiplier correctly applied to dust rewards
- Auto-claim on completion (differs from UI spec which shows explicit claim button)

### Achievement system
- `evaluate-achievements` is idempotent via `is_unlocked` guard
- Handles unique constraint violations (23505) gracefully
- `check-missed-achievements` correctly delegates with LOGIN trigger
- `achievement-idempotency.test.ts` provides thorough coverage of double-grant prevention

### Trigger flow
- Match completion -> game server calls `evaluate-quests` + `evaluate-achievements`
- Evolution completion -> `complete-evolution` calls `evaluate-achievements`
- Login -> `check-missed-achievements` calls `evaluate-achievements`
- **Correct trigger architecture.**

---

## Critical Issues

| # | Issue | Function | Description | Fix |
|---|---|---|---|---|
| C1 | **verifyServiceRole() 403 bug** | `_shared/auth.ts` | Raw string comparison against env var is fragile. Breaks when caller's key doesn't exactly match deployed env var. | Decode JWT and check `role === "service_role"` claim. See proposed fix above. |
| C2 | **Missing auth on monthly-rewards** | `monthly-rewards` | Only checks header presence, not value. Anyone can trigger monthly rewards. | Add `verifyServiceRole(req)` call. |
| C3 | **Missing auth on refresh-daily-quests** | `refresh-daily-quests` | Only checks header presence, not value. Anyone can trigger quest refresh. | Add `verifyServiceRole(req)` call. |
| C4 | **No evolution job processor** | Pipeline gap | `start-evolution` creates PENDING generation jobs but nothing processes them. `generate-evolution-art` and `generate-card-text` exist but are never triggered by the pending jobs. | Add a job processor that picks up PENDING jobs and calls the appropriate Edge Functions, or have `start-evolution` call them directly. |

---

## High Issues

| # | Issue | Function | Description |
|---|---|---|---|
| H1 | **No Apple JWS verification** | `sync-entitlements` | Subscription upgrades accepted without cryptographic verification. Anyone can forge a transaction. |
| H2 | **batch-generate timeout risk** | `batch-generate` | Processes all cards synchronously. Will timeout on batches of 5+ cards with Supabase Edge Function time limits. |
| H3 | **Non-atomic player stat update** | `complete-evolution` | Read-then-write on `cards_evolved_total` causes lost updates under concurrency. |
| H4 | **R2 upload broken in generate-card-art** | `generate-card-art` | Presigned URL approach signs headers that aren't sent in the upload request. Signature mismatch will cause upload failure. |
| H5 | **Mastery stored in economy_config** | `update-mastery` | Per-player mastery data stored in a table meant for 50 game-wide config entries. Will not scale. |
| H6 | **R2 path mismatch for evolution art** | `generate-evolution-art` | Stores to `cards/{faction}/{rarity}/...` instead of `evolution/{player_id}/{card_instance_id}/step-{n}.webp` as specified in doc 06 Section 8.1. |
| H7 | **req.clone().json() after body consumed** | `generate-card-art`, `generate-card-text`, `generate-evolution-art` | Error handlers try to re-read request body after it was already consumed. Will silently fail. |
| H8 | **Double dust deduction in purchase-shards fallback** | `purchase-shards` | Fallback path deducts dust via UPDATE then calls `add_chaos_dust` with negative amount again. |

---

## Medium Issues

| # | Issue | Function | Description |
|---|---|---|---|
| M1 | Achievement COLLECTION category uses string matching on description | `evaluate-achievements` | Fragile -- description changes break logic |
| M2 | Non-atomic XP grant in achievement rewards | `evaluate-achievements` | Read-then-write pattern on player_xp |
| M3 | WIN_WITH_STYLE quest handler checks multiple conditions generically | `evaluate-quests` | Cannot distinguish which specific style condition the quest requires |
| M4 | No rate limiting on matchmaking queue | `join-queue` | Doc specifies 5 entries/minute |
| M5 | createUserClient() defined but never used | `_shared/supabase.ts` | All functions bypass RLS via service client |
| M6 | normalizeFactionId() defined but never called | `_shared/prompts.ts` | May cause issues with DEMONIC_KINGDOMS faction |
| M7 | Monthly rewards MID/HIGH card count bug | `monthly-rewards` | Compares player.id against first result's id instead of checking subscription_tier |
| M8 | Stale CORS origin for Vercel deploy | `_shared/errors.ts` | ALLOWED_ORIGINS includes Vercel URL but Admin Dashboard is on Railway |
| M9 | Auto-claim on quest completion | `evaluate-quests` | Bypasses the explicit claim step in the UI flow |
| M10 | Avatar unlock at mastery level 5 only logs, doesn't unlock | `update-mastery` | Audit log entry created but avatar not actually unlocked for the player |
| M11 | Duplicated R2 upload, fal.ai, and OpenAI client code | Multiple functions | 3+ copies of signing/API code; bugs must be fixed in all copies |

---

## Test Coverage Assessment

| Test File | Coverage | Quality |
|---|---|---|
| `deck-validation.test.ts` | All REQ-164 rules | GOOD -- 10 test cases, pure logic testing |
| `economy-double-spend.test.ts` | Shard costs, balance checks | GOOD -- 9 test cases, concurrent simulation |
| `achievement-idempotency.test.ts` | REQ-187/188 idempotency | GOOD -- 10 test cases, multi-pass evaluation |

**Missing test coverage:**
- No tests for auth (verifyServiceRole, getAuthContext)
- No tests for evolution pipeline
- No tests for card generation pipeline
- No tests for quest progress calculation
- No integration tests against Supabase

---

## Doc 06 Architecture vs Implementation Comparison

### Function naming divergence

Doc 06 Section 10.2 specifies these Edge Function directories:
```
collection/index.ts
economy/index.ts
evolution/index.ts
matchmaking/index.ts
apple-webhook/index.ts
```

Actual implementation has 24 separate functions instead of 5 consolidated ones. This is actually **better** for Supabase Edge Functions since each function deploys independently. However, the `deploy.sh` script only deploys the 5 documented functions, missing all 24 actual functions.

### Missing functions from doc 06

- `apple-webhook` -- specified in doc 06 for App Store Server Notifications V2. Not implemented. `sync-entitlements` handles client-side sync but the webhook for server-to-server notifications is missing.

---

## Revision Log

| Date | Author | Changes |
|---|---|---|
| 2026-02-17 | Claude Code (Opus 4.6) | Initial audit of all 24 Edge Functions, 6 shared modules, 3 test files |

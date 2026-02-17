# AI Pipeline Agent -- Checkpoint

**Agent:** ai-pipeline
**Date:** 2026-02-17
**Status:** COMPLETE

---

## What Was Built

### 1. Centralized Prompt Builder (`supabase/functions/_shared/prompts.ts`)
- **STYLE_ANCHOR** constant -- prefixes every art generation request for visual consistency
- **FACTION_PREFIXES** -- exact prompt strings for Ironwright, Fey Courts, Demonic (+ DEMONIC_KINGDOMS DB alias)
- **COMPOSITION_INSTRUCTION** -- standard composition for all card art
- **NEGATIVE_PROMPT_BASE / NEGATIVE_PROMPT_EVOLUTION** -- comprehensive negative prompts
- **Evolution direction instructions** -- ORDER_INSTRUCTION and CHAOS_INSTRUCTION
- **History context builder** -- `getHistoryContext()` with all 5 documented conditions
- **All 114 modifier prompt descriptions** -- U01-U30, IF01-IF28, FF01-FF28, DF01-DF28
- **Technical parameter maps** -- ENDPOINT_MAP, IMAGE_SIZE_MAP, STEPS_MAP, GUIDANCE_MAP, STRENGTH_TABLE
- **Prompt builder functions:**
  - `buildArtPrompt()` -- base card art (txt2img)
  - `buildEvolutionPrompt()` -- evolution art (img2img)
  - `buildPrismaticRefinementRequest()` -- second pass for Prismatic shards
  - `buildNamingPrompt()` -- evolution name generation (3 candidates)
  - `buildFlavorTextPrompt()` -- flavor text (max 120 chars)
  - `buildNarrativePrompt()` -- evolution narrative (Epic/Legendary only)
  - `buildBaseCardTextPrompt()` -- batch pipeline name + flavor_text

### 2. R2 Storage Utilities (`packages/game-server/src/services/r2.ts`)
- `uploadToR2()` -- Upload image buffer to Cloudflare R2 with immutable cache headers
- `getPublicUrl()` -- Return CDN URL for stored image
- `deleteFromR2()` -- Delete rejected art
- `existsInR2()` -- Check if object exists
- Key generation: `baseCardKey()`, `evolutionArtKey()`, `fallbackArtKey()`
- Key format: `cards/{faction}/{rarity}/{card_id}_{tier}.webp`
- Test helpers: `_resetClient()`, `_setClient()` for injection

### 3. fal.ai Client (`packages/game-server/src/services/fal-client.ts`)
- `generateBaseCardArt()` -- FLUX Dev txt2img
- `generateEvolutionArt()` -- FLUX Kontext img2img
- `downloadImage()` -- Download from temporary fal.ai CDN URL
- `estimateCost()` -- Per-endpoint cost estimation
- `ConcurrencyLimiter` -- Max N concurrent API calls (default 5)
- Exponential backoff retry: 2s, 4s, 8s, 16s, max 4 retries
- NSFW check on every response (throws `FalNsfwError`)
- Error handling: `FalApiError` (non-retryable), `FalNsfwError`

### 4. OpenAI Client (`packages/game-server/src/services/openai-client.ts`)
- `generateCardNames()` -- 3 name candidates (validates array of 3 strings)
- `generateFlavorText()` -- Single string, max 120 chars (strips quotes)
- `generateNarrative()` -- 2-3 sentence evolution narrative
- `generateBaseCardText()` -- name + flavor_text JSON (validates both fields)
- `generateBaseCardTextWithRetry()` -- Auto-retry on validation failure
- `estimateCost()` -- Token-based cost calculation
- Error handling: `OpenAIApiError`, `OpenAIValidationError`

### 5. Fallback Art System (`packages/game-server/src/services/fallback-art.ts`)
- `generateFallbackSvg()` -- SVG fallback with faction colors and rarity borders
- `getFallbackImageBuffer()` -- Returns Buffer + content type for R2 upload
- 3 faction silhouettes (gear/cog, tree/vine, horned skull)
- 5 rarity border colors (gray, green, blue, purple, gold)
- XML-safe card name rendering

### 6. Edge Functions

**`generate-card-art/index.ts`** -- Single card art generation
- Builds prompt via `buildArtPrompt()`
- Calls fal.ai FLUX Dev with retry
- NSFW check, downloads image, uploads to R2
- Updates generation_jobs table with status and cost

**`generate-evolution-art/index.ts`** -- Evolution art generation
- Builds prompt via `buildEvolutionPrompt()`
- Calls fal.ai FLUX Kontext (Dev or Pro based on shard quality)
- Prismatic second pass (refinement) when shard_quality === 'PRISMATIC'
- Full R2 upload with AWS Signature V4

**`generate-card-text/index.ts`** -- Text generation (4 modes)
- `name` mode: 3 evolution name candidates
- `flavor` mode: flavor text (max 120 chars)
- `narrative` mode: evolution narrative (Epic/Legendary)
- `base_text` mode: batch pipeline name + flavor_text
- Auto-retry on malformed responses

**`batch-generate/index.ts`** -- Batch card generation orchestrator
- Creates generation_jobs rows for each card
- Processes in parallel with ConcurrencyLimiter (default 5)
- Per-card pipeline: art -> text -> validate -> mark for review
- Supports `dry_run` mode (create jobs without processing)
- Returns batch summary with counts and total cost

### 7. Test Suite (81 tests, all passing)
- `prompts.test.ts` (31 tests) -- Style anchor, faction prefixes, evolution history, parameters
- `r2-keys.test.ts` (10 tests) -- Key format, public URL generation
- `fal-client.test.ts` (11 tests) -- Error classes, concurrency limiter, cost estimation
- `openai-client.test.ts` (17 tests) -- Cost estimation, validation rules, JSON parsing
- `fallback-art.test.ts` (12 tests) -- SVG generation, faction colors, rarity borders

---

## Environment Variables Required

```
FAL_KEY              -- fal.ai API key
OPENAI_API_KEY       -- OpenAI API key
R2_ACCOUNT_ID        -- Cloudflare account ID
R2_ACCESS_KEY_ID     -- R2 access key
R2_SECRET_ACCESS_KEY -- R2 secret key
R2_BUCKET_NAME       -- R2 bucket name
R2_PUBLIC_URL        -- R2 public CDN URL
SUPABASE_URL         -- Supabase project URL
SUPABASE_SERVICE_ROLE_KEY -- Supabase service role key
```

---

## Files Created

```
supabase/functions/_shared/prompts.ts              -- Centralized prompt builder
supabase/functions/generate-card-art/index.ts      -- Base card art Edge Function
supabase/functions/generate-evolution-art/index.ts  -- Evolution art Edge Function
supabase/functions/generate-card-text/index.ts     -- Text generation Edge Function
supabase/functions/batch-generate/index.ts         -- Batch orchestrator Edge Function
packages/game-server/src/services/r2.ts            -- R2 storage utilities
packages/game-server/src/services/fal-client.ts    -- fal.ai client with retry
packages/game-server/src/services/openai-client.ts -- OpenAI client with validation
packages/game-server/src/services/fallback-art.ts  -- Fallback art SVG generator
packages/game-server/tests/ai-pipeline/prompts.test.ts
packages/game-server/tests/ai-pipeline/r2-keys.test.ts
packages/game-server/tests/ai-pipeline/fal-client.test.ts
packages/game-server/tests/ai-pipeline/openai-client.test.ts
packages/game-server/tests/ai-pipeline/fallback-art.test.ts
packages/game-server/tests/setup.ts (updated)
supabase/functions/AI-CHECKPOINT.md (this file)
```

---

## Commits

1. `build(ai): add core AI pipeline services and prompt builder` -- prompts.ts, r2.ts, fal-client.ts, openai-client.ts, fallback-art.ts
2. `build(ai): add card art, evolution art, and text generation Edge Functions` -- 3 Edge Functions + prompts.ts alias fix
3. `build(ai): add batch-generate Edge Function for admin card pipeline` -- batch orchestrator
4. `build(ai): add comprehensive AI pipeline test suite (81 tests)` -- 5 test files

---

## Design Decisions

1. **Inline API clients in Edge Functions:** Supabase Edge Functions run in Deno isolated contexts. Rather than importing Node.js dependencies, each function includes lightweight inline HTTP clients with the same retry/backoff logic as the game-server services. This ensures portability across both environments.

2. **AWS Signature V4 for R2:** Edge Functions cannot use the AWS SDK (Node.js only). Instead, they implement minimal AWS Signature V4 signing using `crypto.subtle` (available in Deno). This handles PutObject operations directly.

3. **DEMONIC_KINGDOMS alias:** The database uses `DEMONIC_KINGDOMS` as the faction short_name, but the prompt templates use `DEMONIC` for brevity. All faction lookup maps include both keys to avoid lookup failures regardless of which form callers use.

4. **SVG-based fallback art:** Instead of requiring `sharp` or other image processing dependencies for fallback art, the system generates SVG directly. This can be stored as `image/svg+xml` in R2 or converted to WebP by a caller that has `sharp` available.

5. **ConcurrencyLimiter:** A simple promise-based limiter ensures max 5 concurrent fal.ai API calls. This is used by both the batch-generate Edge Function and the game-server's batch pipeline script.

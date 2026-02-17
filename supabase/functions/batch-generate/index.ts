// Chaos Creatures -- batch-generate Edge Function
// Orchestrates batch card generation for the admin dashboard.
//
// Source: .claude/agents/ai-pipeline.md Section 1 (Batch Generation)
// Source: docs/design/05-content-pipeline.md Section 2
//
// Called by admin API: POST /api/admin/batch/start
//
// Flow:
//   1. Receive batch spec (faction, count, card specs)
//   2. Create generation_jobs rows in Supabase (one per card)
//   3. Process jobs in parallel (max 5 concurrent for fal.ai rate limits)
//   4. For each card: generate art -> generate text -> validate -> mark review
//   5. Track progress via generation_jobs table (admin polls for status)
//   6. Log cost per card
//
// Status transitions:
//   PENDING -> generating_art -> generating_text -> review -> approved/rejected

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { verifyServiceRole } from '../_shared/auth.ts';
import { errorResponse, successResponse, handleCors, ErrorCode } from '../_shared/errors.ts';
import {
  buildArtPrompt,
  buildBaseCardTextPrompt,
  NEGATIVE_PROMPT_BASE,
  type CardPromptMetadata,
} from '../_shared/prompts.ts';

// =============================================================================
// Types
// =============================================================================

interface CardSpec {
  spec_id: string;
  faction_id: string;
  creature_archetype: string;
  creature_description: string;
  composition_override?: string;
  visual_description: string;
  card_type: string;
  cm_cost: number;
  base_attack: number;
  base_health: number;
  base_instability: number;
  keywords: string[];
  rarity: string;
}

interface BatchGenerateRequest {
  batch_id: string;
  faction_id: string;
  card_specs: CardSpec[];
  max_concurrent?: number; // Default 5
  dry_run?: boolean; // If true, create jobs but don't process
}

interface FalAiResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: { inference: number };
  seed: number;
  has_nsfw_concepts: boolean[];
}

interface OpenAIResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// =============================================================================
// API Clients (inline for Edge Function portability)
// =============================================================================

async function callFalWithRetry(body: Record<string, unknown>): Promise<FalAiResponse> {
  const falKey = Deno.env.get('FAL_KEY');
  if (!falKey) throw new Error('Missing FAL_KEY');

  let delay = 2000;
  const maxRetries = 4;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://fal.run/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) return await response.json() as FalAiResponse;

      const errText = await response.text();
      const isRetryable = response.status === 429 || response.status >= 500;
      if (!isRetryable || attempt === maxRetries) {
        throw new Error(`fal.ai HTTP ${response.status}: ${errText}`);
      }
    } catch (err) {
      if (attempt === maxRetries) throw err;
    }

    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 32000);
  }
  throw new Error('unreachable');
}

async function callOpenAI(body: Record<string, unknown>): Promise<OpenAIResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  let delay = 1000;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) return await response.json() as OpenAIResponse;

      const errText = await response.text();
      const isRetryable = response.status === 429 || response.status >= 500;
      if (!isRetryable || attempt === 2) {
        throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
      }
    } catch (err) {
      if (attempt === 2) throw err;
    }
    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }
  throw new Error('unreachable');
}

// =============================================================================
// R2 Upload
// =============================================================================

async function uploadToR2(imageBuffer: Uint8Array, key: string): Promise<string> {
  const accountId = Deno.env.get('R2_ACCOUNT_ID');
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const bucketName = Deno.env.get('R2_BUCKET_NAME');
  const publicUrl = Deno.env.get('R2_PUBLIC_URL');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error('Missing R2 environment variables');
  }

  const host = `${accountId}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${bucketName}/${key}`;
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateOnly = dateStr.substring(0, 8);
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateStr}\n`;
  const canonicalRequest = `PUT\n/${bucketName}/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const stringToSign = `AWS4-HMAC-SHA256\n${dateStr}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;
  const signingKey = await getSigningKey(secretAccessKey, dateOnly, region, service);
  const signature = await hmacHex(signingKey, stringToSign);

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const uploadResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': dateStr,
      'Host': host,
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`R2 upload failed: HTTP ${uploadResponse.status}: ${errText}`);
  }

  return `${publicUrl.replace(/\/$/, '')}/${key}`;
}

async function sha256Hex(data: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const ck = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', ck, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const sig = await hmacSha256(key, data);
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getSigningKey(secret: string, dateOnly: string, region: string, service: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const kDate = await hmacSha256(enc.encode(`AWS4${secret}`), dateOnly);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

// =============================================================================
// Concurrency Limiter
// =============================================================================

class ConcurrencyLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.active >= this.max) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// =============================================================================
// Single Card Processing
// =============================================================================

async function processCard(
  spec: CardSpec,
  batchId: string,
  jobId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<{
  success: boolean;
  art_url?: string;
  name?: string;
  flavor_text?: string;
  error?: string;
  cost: number;
}> {
  let totalCost = 0;

  try {
    // Step 1: Generate art
    await supabase.from('generation_jobs').update({
      status: 'PROCESSING',
      started_at: new Date().toISOString(),
      input_data: { stage: 'generating_art', spec },
    }).eq('id', jobId);

    const cardMeta: CardPromptMetadata = {
      tier: spec.rarity,
      keywords: spec.keywords,
      manaCost: spec.cm_cost,
      cardType: spec.card_type,
    };

    const artRequest = buildArtPrompt(
      spec.faction_id,
      spec.creature_description,
      spec.composition_override,
      cardMeta
    );

    let falResponse: FalAiResponse;
    try {
      falResponse = await callFalWithRetry(artRequest as unknown as Record<string, unknown>);
    } catch (firstErr) {
      // Retry once with same prompt
      console.warn(`Art generation retry for ${spec.spec_id}:`, firstErr);
      falResponse = await callFalWithRetry(artRequest as unknown as Record<string, unknown>);
    }

    totalCost += 0.025; // ~$0.025 per image

    // NSFW check
    if (falResponse.has_nsfw_concepts?.[0] === true) {
      throw new Error('NSFW content detected');
    }

    if (!falResponse.images?.[0]?.url) {
      throw new Error('No image URL in fal.ai response');
    }

    // Download image
    const imgResponse = await fetch(falResponse.images[0].url);
    if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
    const imageBuffer = new Uint8Array(await imgResponse.arrayBuffer());

    // Upload to R2
    const r2Key = `cards/${spec.faction_id.toLowerCase()}/${spec.rarity.toLowerCase()}/${spec.spec_id}_common.webp`;
    const artUrl = await uploadToR2(imageBuffer, r2Key);

    // Step 2: Generate text
    await supabase.from('generation_jobs').update({
      input_data: { stage: 'generating_text', spec, art_url: artUrl },
    }).eq('id', jobId);

    const textRequest = buildBaseCardTextPrompt(
      spec.faction_id,
      spec.creature_archetype,
      {
        attack: spec.base_attack,
        health: spec.base_health,
        cmCost: spec.cm_cost,
        instability: spec.base_instability,
      },
      spec.keywords,
      spec.visual_description
    );

    const textResponse = await callOpenAI(textRequest as unknown as Record<string, unknown>);
    totalCost += 0.0001; // ~$0.0001 per GPT-4o Mini call

    let textResult: { name: string; flavor_text: string };
    const textContent = textResponse.choices[0]?.message?.content;
    if (!textContent) throw new Error('Empty OpenAI response');

    try {
      textResult = JSON.parse(textContent);
    } catch {
      // Retry
      const retryRequest = {
        ...textRequest,
        messages: [
          ...(textRequest as { messages: Array<{ role: string; content: string }> }).messages,
          { role: 'user', content: 'That was invalid JSON. Output ONLY: {"name": "...", "flavor_text": "..."}' },
        ],
      };
      const retryResponse = await callOpenAI(retryRequest as unknown as Record<string, unknown>);
      textResult = JSON.parse(retryResponse.choices[0].message.content);
    }

    // Validate text
    if (!textResult.name || textResult.name.length < 3 || textResult.name.length > 30) {
      throw new Error(`Invalid name: "${textResult.name}"`);
    }
    if (!textResult.flavor_text || textResult.flavor_text.length > 120) {
      throw new Error(`Invalid flavor text length: ${textResult.flavor_text?.length}`);
    }

    // Step 3: Mark for review
    await supabase.from('generation_jobs').update({
      status: 'COMPLETED',
      art_url: artUrl,
      output_data: {
        name: textResult.name,
        flavor_text: textResult.flavor_text,
        seed: falResponse.seed,
        inference_time: falResponse.timings?.inference,
        batch_id: batchId,
        card_spec: spec,
      },
      model_used: 'fal-ai/flux/dev + gpt-4o-mini',
      cost_usd: totalCost,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    return {
      success: true,
      art_url: artUrl,
      name: textResult.name,
      flavor_text: textResult.flavor_text,
      cost: totalCost,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await supabase.from('generation_jobs').update({
      status: 'FAILED',
      error_message: errorMessage,
      cost_usd: totalCost,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    return { success: false, error: errorMessage, cost: totalCost };
  }
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse(ErrorCode.INVALID_REQUEST, 'Method not allowed', 405);
  }

  // Service-role-only: batch generation is an admin/pipeline function
  const authError = verifyServiceRole(req);
  if (authError) return authError;

  try {
    const body = await req.json() as BatchGenerateRequest;

    if (!body.batch_id || !body.faction_id || !body.card_specs?.length) {
      return errorResponse(
        ErrorCode.INVALID_REQUEST,
        'Missing required fields: batch_id, faction_id, card_specs (non-empty array)'
      );
    }

    const supabase = createServiceClient();
    const maxConcurrent = body.max_concurrent || 5;

    // Step 1: Create generation_jobs rows
    const jobRows = body.card_specs.map((spec) => ({
      job_type: 'BASE_CARD_IMAGE' as const,
      status: 'PENDING' as const,
      input_data: {
        batch_id: body.batch_id,
        spec,
      },
      model_used: null,
      cost_usd: 0,
      attempt_count: 0,
      max_attempts: 3,
    }));

    const { data: jobs, error: insertError } = await supabase
      .from('generation_jobs')
      .insert(jobRows)
      .select('id');

    if (insertError || !jobs) {
      throw new Error(`Failed to create generation jobs: ${insertError?.message}`);
    }

    // If dry run, return job IDs without processing
    if (body.dry_run) {
      return successResponse({
        batch_id: body.batch_id,
        total_cards: body.card_specs.length,
        job_ids: jobs.map((j) => j.id),
        status: 'dry_run',
      });
    }

    // Step 2: Process all cards with concurrency limiter
    const limiter = new ConcurrencyLimiter(maxConcurrent);
    const results: Array<{
      spec_id: string;
      success: boolean;
      art_url?: string;
      name?: string;
      flavor_text?: string;
      error?: string;
      cost: number;
    }> = [];

    const promises = body.card_specs.map((spec, index) => {
      const jobId = jobs[index].id;
      return limiter.run(async () => {
        const result = await processCard(spec, body.batch_id, jobId, supabase);
        results.push({ spec_id: spec.spec_id, ...result });
        return result;
      });
    });

    await Promise.all(promises);

    // Step 3: Summary
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

    return successResponse({
      batch_id: body.batch_id,
      total_cards: body.card_specs.length,
      succeeded,
      failed,
      total_cost_usd: Math.round(totalCost * 1000) / 1000,
      results,
    });
  } catch (err) {
    console.error('batch-generate error:', err);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      `Batch generation failed: ${err instanceof Error ? err.message : String(err)}`,
      500
    );
  }
});

// Chaos Creatures -- generate-evolution-art Edge Function
// Generates evolution art via fal.ai FLUX Kontext (img2img).
//
// Source: .claude/agents/ai-pipeline.md Section 1
// Source: docs/design/03-prompt-templates.md Section 1.4-1.5
//
// Flow:
//   1. Receive evolution parameters (card instance, outcome, modifier, shard quality)
//   2. Build evolution prompt using STYLE_ANCHOR + direction + history + modifier
//   3. Call fal.ai FLUX Kontext with previous tier's art as image_url
//   4. If Prismatic: second refinement pass
//   5. Check NSFW flag
//   6. Download and upload to R2
//   7. Update generation_jobs table
//   8. Return R2 public URL

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { verifyServiceRole } from '../_shared/auth.ts';
import { errorResponse, successResponse, handleCors, ErrorCode } from '../_shared/errors.ts';
import {
  buildEvolutionPrompt,
  buildPrismaticRefinementRequest,
  type EvolutionPromptInput,
  type EvolutionRecord,
  type ShardQuality,
  type EvolutionOutcome,
  type Tier,
} from '../_shared/prompts.ts';

// =============================================================================
// Types
// =============================================================================

interface GenerateEvolutionArtRequest {
  job_id?: string;
  card_instance_id: string;
  player_id: string;
  faction_id: string;
  rarity: string;
  art_url: string; // Previous tier's art URL
  evolution_outcome: EvolutionOutcome;
  selected_modifier_id: string;
  from_tier: Tier;
  shard_quality: ShardQuality;
  evolution_history: EvolutionRecord[];
  evolution_number: number;
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

// =============================================================================
// fal.ai Client (inline for Edge Function portability)
// =============================================================================

async function callFal(
  endpoint: string,
  body: Record<string, unknown>
): Promise<FalAiResponse> {
  const falKey = Deno.env.get('FAL_KEY');
  if (!falKey) throw new Error('Missing FAL_KEY');

  let delay = 2000;

  for (let attempt = 0; attempt <= 4; attempt++) {
    try {
      const response = await fetch(`https://fal.run/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return await response.json() as FalAiResponse;
      }

      const errText = await response.text();
      const isRetryable = response.status === 429 || response.status >= 500;

      if (!isRetryable || attempt === 4) {
        throw new Error(`fal.ai HTTP ${response.status}: ${errText}`);
      }
    } catch (err) {
      if (attempt === 4) throw err;
    }

    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 32000);
  }

  throw new Error('unreachable');
}

// =============================================================================
// R2 Upload (same as generate-card-art, shared inline)
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

  const canonicalUri = `/${bucketName}/${key}`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateStr}\n`;

  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

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
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
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
// Cost Estimation
// =============================================================================

function estimateCost(shardQuality: ShardQuality): number {
  switch (shardQuality) {
    case 'PLANAR': return 0.02;
    case 'REFINED': return 0.05;
    case 'PRISMATIC': return 0.08; // Two passes
    default: return 0.03;
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

  // Service-role-only: evolution art is an internal pipeline function
  const authError = verifyServiceRole(req);
  if (authError) return authError;

  try {
    const body = await req.json() as GenerateEvolutionArtRequest;

    // Validate required fields
    const required = ['card_instance_id', 'faction_id', 'art_url', 'evolution_outcome',
      'selected_modifier_id', 'from_tier', 'shard_quality', 'evolution_number'] as const;
    for (const field of required) {
      if (!body[field]) {
        return errorResponse(ErrorCode.INVALID_REQUEST, `Missing required field: ${field}`);
      }
    }

    const supabase = createServiceClient();

    // Update job status
    if (body.job_id) {
      await supabase
        .from('generation_jobs')
        .update({ status: 'PROCESSING', started_at: new Date().toISOString() })
        .eq('id', body.job_id);
    }

    // Build evolution prompt
    const promptInput: EvolutionPromptInput = {
      factionId: body.faction_id,
      artUrl: body.art_url,
      evolutionOutcome: body.evolution_outcome,
      selectedModifierId: body.selected_modifier_id,
      fromTier: body.from_tier,
      shardQuality: body.shard_quality,
      evolutionHistory: body.evolution_history || [],
    };

    const { endpoint, body: falBody, needsSecondPass } = buildEvolutionPrompt(promptInput);

    // First pass
    const firstResponse = await callFal(endpoint, falBody as unknown as Record<string, unknown>);

    // Check NSFW
    if (firstResponse.has_nsfw_concepts?.[0] === true) {
      if (body.job_id) {
        await supabase.from('generation_jobs').update({
          status: 'FAILED',
          error_message: 'NSFW content detected in evolution art',
          completed_at: new Date().toISOString(),
        }).eq('id', body.job_id);
      }
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'NSFW content detected', 422);
    }

    let finalImageUrl = firstResponse.images[0].url;
    let totalCost = estimateCost(body.shard_quality);

    // Prismatic second pass (refinement)
    if (needsSecondPass) {
      const refinementBody = buildPrismaticRefinementRequest(
        firstResponse.images[0].url,
        falBody.prompt
      );

      const refinedResponse = await callFal(
        'fal-ai/flux-kontext/pro',
        refinementBody as unknown as Record<string, unknown>
      );

      if (refinedResponse.has_nsfw_concepts?.[0] === true) {
        // Use first pass result if refinement triggers NSFW
        console.warn('Prismatic refinement NSFW flagged, using first pass result');
      } else {
        finalImageUrl = refinedResponse.images[0].url;
      }
    }

    // Download image
    const imageResponse = await fetch(finalImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download evolution image: HTTP ${imageResponse.status}`);
    }
    const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());

    // Determine target tier
    const TIER_MAP: Record<string, string> = {
      COMMON: 'uncommon',
      UNCOMMON: 'rare',
      RARE: 'epic',
      EPIC: 'legendary',
    };
    const targetTier = TIER_MAP[body.from_tier] || 'unknown';

    // Upload to R2
    const r2Key = `cards/${body.faction_id.toLowerCase()}/${(body.rarity || 'common').toLowerCase()}/${body.card_instance_id}_${targetTier}_evo${body.evolution_number}.webp`;
    const publicUrl = await uploadToR2(imageBuffer, r2Key);

    // Update job status
    if (body.job_id) {
      await supabase.from('generation_jobs').update({
        status: 'COMPLETED',
        art_url: publicUrl,
        output_data: {
          seed: firstResponse.seed,
          inference_time: firstResponse.timings?.inference,
          shard_quality: body.shard_quality,
          had_second_pass: needsSecondPass,
        },
        model_used: endpoint,
        cost_usd: totalCost,
        completed_at: new Date().toISOString(),
      }).eq('id', body.job_id);
    }

    return successResponse({
      art_url: publicUrl,
      seed: firstResponse.seed,
      shard_quality: body.shard_quality,
      had_second_pass: needsSecondPass,
      estimated_cost: totalCost,
    });
  } catch (err) {
    console.error('generate-evolution-art error:', err);

    try {
      const body = await req.clone().json() as GenerateEvolutionArtRequest;
      if (body.job_id) {
        const supabase = createServiceClient();
        await supabase.from('generation_jobs').update({
          status: 'FAILED',
          error_message: String(err),
          completed_at: new Date().toISOString(),
        }).eq('id', body.job_id);
      }
    } catch {
      // Best effort
    }

    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      `Evolution art generation failed: ${err instanceof Error ? err.message : String(err)}`,
      500
    );
  }
});

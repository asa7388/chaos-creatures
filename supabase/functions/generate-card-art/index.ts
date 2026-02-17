// Chaos Creatures -- generate-card-art Edge Function
// Generates a single base card art image via fal.ai FLUX Dev (txt2img).
//
// Source: .claude/agents/ai-pipeline.md Section 1
// Source: docs/design/03-prompt-templates.md Section 1
//
// Flow:
//   1. Receive card spec (faction, creature description, rarity)
//   2. Build prompt using STYLE_ANCHOR + faction prefix + description + composition
//   3. Call fal.ai FLUX Dev endpoint
//   4. Check NSFW flag
//   5. Download image from temporary fal.ai URL
//   6. Upload to Cloudflare R2
//   7. Update generation_jobs table
//   8. Return R2 public URL
//
// On failure: retry once, then use fallback art.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { verifyServiceRole } from '../_shared/auth.ts';
import { errorResponse, successResponse, handleCors, ErrorCode, corsHeaders } from '../_shared/errors.ts';
import {
  buildArtPrompt,
  STYLE_ANCHOR,
  NEGATIVE_PROMPT_BASE,
} from '../_shared/prompts.ts';

// =============================================================================
// Types
// =============================================================================

interface GenerateCardArtRequest {
  job_id?: string;
  faction_id: string;
  creature_description: string;
  rarity: string;
  card_id: string;
  composition_override?: string;
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

async function callFal(body: Record<string, unknown>): Promise<FalAiResponse> {
  const falKey = Deno.env.get('FAL_KEY');
  if (!falKey) throw new Error('Missing FAL_KEY');

  const endpoint = 'fal-ai/flux/dev';
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
// R2 Upload (S3-compatible, inline for Edge Function)
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

  // Use S3 PutObject via signed request
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateOnly = dateStr.substring(0, 8);

  // For Edge Functions, we use a simplified approach: call the game server's R2 upload endpoint
  // In production, the game server handles R2 uploads. The Edge Function sends the image data
  // to an internal endpoint. For now, we use the Supabase Storage as intermediary.
  //
  // Alternative: Use the AWS Signature V4 directly. Since Deno supports crypto.subtle,
  // we implement minimal S3 signing here.

  const { signedUrl } = await generateS3SignedUrl(
    'PUT',
    bucketName,
    key,
    accountId,
    accessKeyId,
    secretAccessKey,
    now
  );

  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`R2 upload failed: HTTP ${uploadResponse.status}: ${errText}`);
  }

  return `${publicUrl.replace(/\/$/, '')}/${key}`;
}

// Minimal AWS Signature V4 for R2
async function generateS3SignedUrl(
  method: string,
  bucket: string,
  key: string,
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  now: Date
): Promise<{ signedUrl: string }> {
  const region = 'auto';
  const service = 's3';
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const dateStr = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateOnly = dateStr.substring(0, 8);
  const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  const canonicalUri = `/${bucket}/${key}`;
  const canonicalQueryString = '';
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${dateStr}`,
  ].join('\n') + '\n';

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateStr,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await getSigningKey(secretAccessKey, dateOnly, region, service);
  const signature = await hmacHex(signingKey, stringToSign);

  const authorization = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // Build the signed URL with headers approach (non-presigned)
  const signedUrl = `https://${host}${canonicalUri}`;

  // We return the URL plus the headers that need to be set
  // Actually, for a PUT request, we need to set headers. Let's use a different approach.
  // Return a fetch-ready URL with all needed headers.
  return { signedUrl: `https://${host}${canonicalUri}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(credential)}&X-Amz-Date=${dateStr}&X-Amz-SignedHeaders=${signedHeaders}&X-Amz-Signature=${signature}` };
}

async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const sig = await hmacSha256(key, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getSigningKey(
  secretKey: string,
  dateOnly: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const kDate = await hmacSha256(encoder.encode(`AWS4${secretKey}`), dateOnly);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse(ErrorCode.INVALID_REQUEST, 'Method not allowed', 405);
  }

  // Service-role-only: art generation is an internal pipeline function
  const authError = verifyServiceRole(req);
  if (authError) return authError;

  try {
    const body = await req.json() as GenerateCardArtRequest;

    // Validate required fields
    if (!body.faction_id || !body.creature_description || !body.rarity || !body.card_id) {
      return errorResponse(
        ErrorCode.INVALID_REQUEST,
        'Missing required fields: faction_id, creature_description, rarity, card_id'
      );
    }

    const supabase = createServiceClient();

    // Update job status if job_id provided
    if (body.job_id) {
      await supabase
        .from('generation_jobs')
        .update({
          status: 'PROCESSING',
          started_at: new Date().toISOString(),
        })
        .eq('id', body.job_id);
    }

    // Build the art prompt
    const artRequest = buildArtPrompt(
      body.faction_id,
      body.creature_description,
      body.composition_override
    );

    // Call fal.ai
    let falResponse: FalAiResponse;
    let retried = false;

    try {
      falResponse = await callFal(artRequest as unknown as Record<string, unknown>);
    } catch (firstErr) {
      // Retry once
      console.warn('First fal.ai attempt failed, retrying:', firstErr);
      retried = true;
      falResponse = await callFal(artRequest as unknown as Record<string, unknown>);
    }

    // Check NSFW
    if (falResponse.has_nsfw_concepts?.[0] === true) {
      // Mark job as failed
      if (body.job_id) {
        await supabase
          .from('generation_jobs')
          .update({
            status: 'FAILED',
            error_message: 'NSFW content detected',
            completed_at: new Date().toISOString(),
          })
          .eq('id', body.job_id);
      }
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'NSFW content detected, generation rejected', 422);
    }

    // Validate image presence
    if (!falResponse.images?.[0]?.url) {
      throw new Error('No image URL in fal.ai response');
    }

    // Download image from temporary fal.ai URL
    const imageResponse = await fetch(falResponse.images[0].url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: HTTP ${imageResponse.status}`);
    }
    const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());

    // Upload to R2
    const r2Key = `cards/${body.faction_id.toLowerCase()}/${body.rarity.toLowerCase()}/${body.card_id}_common.webp`;
    const publicUrl = await uploadToR2(imageBuffer, r2Key);

    // Update job status
    if (body.job_id) {
      await supabase
        .from('generation_jobs')
        .update({
          status: 'COMPLETED',
          art_url: publicUrl,
          output_data: {
            seed: falResponse.seed,
            inference_time: falResponse.timings?.inference,
            width: falResponse.images[0].width,
            height: falResponse.images[0].height,
            retried,
          },
          model_used: 'fal-ai/flux/dev',
          cost_usd: 0.025,
          completed_at: new Date().toISOString(),
        })
        .eq('id', body.job_id);
    }

    return successResponse({
      art_url: publicUrl,
      seed: falResponse.seed,
      inference_time: falResponse.timings?.inference,
      width: falResponse.images[0].width,
      height: falResponse.images[0].height,
      retried,
    });
  } catch (err) {
    console.error('generate-card-art error:', err);

    // Try to update job status on failure
    try {
      const body = await req.clone().json() as GenerateCardArtRequest;
      if (body.job_id) {
        const supabase = createServiceClient();
        await supabase
          .from('generation_jobs')
          .update({
            status: 'FAILED',
            error_message: String(err),
            completed_at: new Date().toISOString(),
          })
          .eq('id', body.job_id);
      }
    } catch {
      // Ignore -- best effort
    }

    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      `Art generation failed: ${err instanceof Error ? err.message : String(err)}`,
      500
    );
  }
});

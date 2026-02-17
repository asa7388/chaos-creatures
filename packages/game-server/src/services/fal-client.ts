// Chaos Creatures -- fal.ai Client Service
// Source: docs/design/03-prompt-templates.md Section 1.2
// Source: docs/design/05-content-pipeline.md Section 3a
//
// Handles all communication with fal.ai for image generation:
//   - Base card art (txt2img via FLUX Dev)
//   - Evolution art (img2img via FLUX Kontext Dev/Pro)
//   - Prismatic refinement second pass
//
// Key behaviors:
//   - Exponential backoff retry (2s, 4s, 8s, 16s, max 4 retries)
//   - NSFW content check on every response
//   - Max 5 concurrent requests (caller enforces via concurrency limiter)
//   - WebP output format always
//
// Environment: FAL_KEY (not FAL_API_KEY)

// =============================================================================
// Types (mirrored from supabase/functions/_shared/prompts.ts for portability)
// =============================================================================

export interface FalAiBaseCardRequest {
  prompt: string;
  negative_prompt: string;
  image_size: string;
  num_inference_steps: number;
  guidance_scale: number;
  num_images: 1;
  enable_safety_checker: true;
  output_format: 'webp';
}

export interface FalAiEvolutionRequest extends FalAiBaseCardRequest {
  image_url: string;
  strength: number;
}

export interface FalAiResponse {
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
// Configuration
// =============================================================================

const FAL_BASE_URL = 'https://fal.run';

function getFalKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error('Missing FAL_KEY environment variable');
  }
  return key;
}

// =============================================================================
// Error Types
// =============================================================================

export class FalApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'FalApiError';
  }
}

export class FalNsfwError extends Error {
  constructor(public readonly seed: number) {
    super(`NSFW content detected (seed: ${seed})`);
    this.name = 'FalNsfwError';
  }
}

// =============================================================================
// Retry Logic (exponential backoff)
// =============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call fal.ai with exponential backoff retry.
 * Retries on HTTP 429 (rate limit) and 5xx (server errors).
 * Does NOT retry on 4xx (client errors) except 429.
 */
async function callFalWithRetry(
  endpoint: string,
  body: Record<string, unknown>,
  maxRetries: number = 4
): Promise<FalAiResponse> {
  const falKey = getFalKey();
  let delay = 2000; // 2 seconds initial delay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const url = `${FAL_BASE_URL}/${endpoint}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      // Network error -- retry
      if (attempt === maxRetries) throw err;
      console.warn(`fal.ai network error on attempt ${attempt + 1}, retrying in ${delay}ms:`, err);
      await sleep(delay);
      delay = Math.min(delay * 2, 32000);
      continue;
    }

    if (response.ok) {
      const data = (await response.json()) as FalAiResponse;
      return data;
    }

    // Parse error
    let errorDetail: string;
    try {
      const errorBody = await response.text();
      errorDetail = errorBody;
    } catch {
      errorDetail = `HTTP ${response.status}`;
    }

    // Only retry on 429 (rate limit) and 5xx (server error)
    const isRetryable = response.status === 429 || response.status >= 500;

    if (!isRetryable || attempt === maxRetries) {
      throw new FalApiError(
        `fal.ai HTTP ${response.status}: ${errorDetail}`,
        response.status,
        errorDetail
      );
    }

    console.warn(
      `fal.ai attempt ${attempt + 1} failed (HTTP ${response.status}), retrying in ${delay}ms`
    );
    await sleep(delay);
    delay = Math.min(delay * 2, 32000);
  }

  throw new Error('unreachable');
}

// =============================================================================
// NSFW Check
// =============================================================================

function checkNsfw(response: FalAiResponse): void {
  if (response.has_nsfw_concepts && response.has_nsfw_concepts[0] === true) {
    throw new FalNsfwError(response.seed);
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate base card art using fal.ai FLUX Dev (txt2img).
 * Used during batch generation pipeline.
 *
 * @param request - The prompt and parameters from buildArtPrompt()
 * @returns fal.ai response with image URL, seed, and NSFW check result
 * @throws FalNsfwError if content is flagged as NSFW
 * @throws FalApiError on non-retryable API errors
 */
export async function generateBaseCardArt(
  request: FalAiBaseCardRequest
): Promise<FalAiResponse> {
  const endpoint = 'fal-ai/flux/dev';
  const response = await callFalWithRetry(endpoint, request as unknown as Record<string, unknown>);
  checkNsfw(response);
  return response;
}

/**
 * Generate evolution art using fal.ai FLUX Kontext (img2img).
 * Used during player evolution flow.
 *
 * @param endpoint - The fal.ai endpoint (from ENDPOINT_MAP based on shard quality)
 * @param request - The prompt and parameters from buildEvolutionPrompt()
 * @returns fal.ai response with image URL
 * @throws FalNsfwError if content is flagged as NSFW
 * @throws FalApiError on non-retryable API errors
 */
export async function generateEvolutionArt(
  endpoint: string,
  request: FalAiEvolutionRequest
): Promise<FalAiResponse> {
  const response = await callFalWithRetry(endpoint, request as unknown as Record<string, unknown>);
  checkNsfw(response);
  return response;
}

/**
 * Download an image from a URL and return it as a Buffer.
 * Used to download the temporary fal.ai CDN URL before uploading to R2.
 * The fal.ai URL expires in ~1 hour, so download immediately after generation.
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}: HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Estimate the cost of a fal.ai generation call.
 * Based on docs/design/06-technical-architecture.md Section 1.4
 */
export function estimateCost(endpoint: string): number {
  if (endpoint.includes('flux/dev') || endpoint.includes('flux-kontext/dev')) {
    return 0.025; // ~$0.025 per image at portrait_4_3
  }
  if (endpoint.includes('flux-kontext/pro')) {
    return 0.05; // ~$0.05 per image at square_hd
  }
  return 0.03; // fallback estimate
}

// =============================================================================
// Concurrency Limiter
// =============================================================================

/**
 * Simple concurrency limiter for batching fal.ai requests.
 * Ensures max N concurrent API calls to respect rate limits.
 */
export class ConcurrencyLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number = 5) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.active >= this.maxConcurrent) {
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

  get activeCount(): number {
    return this.active;
  }

  get queueLength(): number {
    return this.queue.length;
  }
}

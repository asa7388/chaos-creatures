// Chaos Creatures -- generate-card-text Edge Function
// Generates card name, flavor text, and evolution narrative via OpenAI GPT-4o Mini.
//
// Source: .claude/agents/ai-pipeline.md Section 1
// Source: docs/design/03-prompt-templates.md Section 2
//
// Supports three modes:
//   - "name": Generate 3 evolution name candidates
//   - "flavor": Generate flavor text (max 120 chars)
//   - "narrative": Generate evolution narrative (Epic/Legendary only)
//   - "base_text": Generate name + flavor_text for batch pipeline

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { verifyServiceRole } from '../_shared/auth.ts';
import { errorResponse, successResponse, handleCors, ErrorCode } from '../_shared/errors.ts';
import {
  buildNamingPrompt,
  buildFlavorTextPrompt,
  buildNarrativePrompt,
  buildBaseCardTextPrompt,
  type NamingPromptInput,
  type FlavorTextPromptInput,
  type NarrativePromptInput,
  type EvolutionOutcome,
  type EvolutionRecord,
} from '../_shared/prompts.ts';

// =============================================================================
// Types
// =============================================================================

interface TextGenerationRequest {
  mode: 'name' | 'flavor' | 'narrative' | 'base_text';
  job_id?: string;

  // For "name" mode
  naming?: NamingPromptInput;

  // For "flavor" mode
  flavor?: FlavorTextPromptInput;

  // For "narrative" mode
  narrative?: NarrativePromptInput;

  // For "base_text" mode (batch pipeline)
  base_text?: {
    faction_id: string;
    creature_archetype: string;
    stats: { attack: number; health: number; cmCost: number; instability: number };
    keywords: string[];
    visual_description: string;
  };
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// =============================================================================
// OpenAI Client (inline for Edge Function portability)
// =============================================================================

interface OpenAIRequestBody {
  model: string;
  temperature: number;
  max_tokens: number;
  messages: Array<{ role: string; content: string }>;
  response_format?: { type: string };
}

async function callOpenAI(body: OpenAIRequestBody): Promise<OpenAIResponse> {
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

      if (response.ok) {
        return await response.json() as OpenAIResponse;
      }

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

function extractContent(response: OpenAIResponse): string {
  if (!response.choices?.length) {
    throw new Error('No choices in OpenAI response');
  }
  return response.choices[0].message.content;
}

function estimateCost(usage: { prompt_tokens: number; completion_tokens: number }): number {
  return (usage.prompt_tokens / 1_000_000) * 0.15 + (usage.completion_tokens / 1_000_000) * 0.60;
}

// =============================================================================
// Response Handlers
// =============================================================================

async function handleNaming(input: NamingPromptInput, supabase: ReturnType<typeof createServiceClient>, jobId?: string) {
  const requestBody = buildNamingPrompt(input);
  const response = await callOpenAI(requestBody);
  const content = extractContent(response);

  let names: string[];
  try {
    names = JSON.parse(content);
  } catch {
    // Retry with stricter prompt
    const retryBody = {
      ...requestBody,
      messages: [
        ...requestBody.messages,
        {
          role: 'user' as const,
          content: 'That was not valid JSON. Return ONLY a JSON array of 3 strings: ["Name One", "Name Two", "Name Three"]',
        },
      ],
    };
    const retryResponse = await callOpenAI(retryBody);
    const retryContent = extractContent(retryResponse);
    names = JSON.parse(retryContent);
  }

  if (!Array.isArray(names) || names.length !== 3) {
    throw new Error(`Expected array of 3 names, got: ${content}`);
  }

  // Validate each name
  for (const name of names) {
    if (typeof name !== 'string' || name.length < 3 || name.length > 30) {
      throw new Error(`Invalid name "${name}": must be 3-30 characters`);
    }
  }

  if (jobId) {
    await supabase.from('generation_jobs').update({
      status: 'COMPLETED',
      output_data: { names },
      model_used: 'gpt-4o-mini',
      cost_usd: estimateCost(response.usage),
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  return { names, usage: response.usage };
}

async function handleFlavor(input: FlavorTextPromptInput, supabase: ReturnType<typeof createServiceClient>, jobId?: string) {
  const requestBody = buildFlavorTextPrompt(input);
  const response = await callOpenAI(requestBody);
  let content = extractContent(response).trim();

  // Strip surrounding quotes
  if ((content.startsWith('"') && content.endsWith('"')) ||
      (content.startsWith("'") && content.endsWith("'"))) {
    content = content.slice(1, -1);
  }

  // Validate length
  if (content.length > 120) {
    // Retry with stricter instruction
    const retryBody = {
      ...requestBody,
      messages: [
        ...requestBody.messages,
        {
          role: 'user' as const,
          content: `That was ${content.length} characters. Write a new flavor text that is UNDER 120 characters. Output only the text.`,
        },
      ],
    };
    const retryResponse = await callOpenAI(retryBody);
    content = extractContent(retryResponse).trim();
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
    }
  }

  if (jobId) {
    await supabase.from('generation_jobs').update({
      status: 'COMPLETED',
      output_data: { flavor_text: content },
      model_used: 'gpt-4o-mini',
      cost_usd: estimateCost(response.usage),
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  return { flavor_text: content, usage: response.usage };
}

async function handleNarrative(input: NarrativePromptInput, supabase: ReturnType<typeof createServiceClient>, jobId?: string) {
  const requestBody = buildNarrativePrompt(input);
  const response = await callOpenAI(requestBody);
  const content = extractContent(response).trim();

  if (jobId) {
    await supabase.from('generation_jobs').update({
      status: 'COMPLETED',
      output_data: { narrative: content },
      model_used: 'gpt-4o-mini',
      cost_usd: estimateCost(response.usage),
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  return { narrative: content, usage: response.usage };
}

async function handleBaseText(
  input: {
    faction_id: string;
    creature_archetype: string;
    stats: { attack: number; health: number; cmCost: number; instability: number };
    keywords: string[];
    visual_description: string;
  },
  supabase: ReturnType<typeof createServiceClient>,
  jobId?: string
) {
  const requestBody = buildBaseCardTextPrompt(
    input.faction_id,
    input.creature_archetype,
    input.stats,
    input.keywords,
    input.visual_description
  );

  const response = await callOpenAI(requestBody);
  const content = extractContent(response);

  let result: { name: string; flavor_text: string };
  try {
    result = JSON.parse(content);
  } catch {
    // Retry with stricter prompt
    const retryBody = {
      ...requestBody,
      messages: [
        ...requestBody.messages,
        {
          role: 'user' as const,
          content: 'That was not valid JSON. Respond ONLY with: {"name": "...", "flavor_text": "..."}',
        },
      ],
    };
    const retryResponse = await callOpenAI(retryBody);
    result = JSON.parse(extractContent(retryResponse));
  }

  // Validate
  if (!result.name || result.name.length < 3 || result.name.length > 30) {
    throw new Error(`Invalid name: "${result.name}"`);
  }
  const genericNames = ['creature', 'card', 'unit', 'monster'];
  if (genericNames.includes(result.name.toLowerCase())) {
    throw new Error(`Name too generic: "${result.name}"`);
  }
  if (!result.flavor_text || result.flavor_text.length > 120) {
    throw new Error(`Invalid flavor text length: ${result.flavor_text?.length || 0}`);
  }

  if (jobId) {
    await supabase.from('generation_jobs').update({
      status: 'COMPLETED',
      output_data: result,
      model_used: 'gpt-4o-mini',
      cost_usd: estimateCost(response.usage),
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  return { ...result, usage: response.usage };
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

  // Service-role-only: text generation is an internal pipeline function
  const authError = verifyServiceRole(req);
  if (authError) return authError;

  try {
    const body = await req.json() as TextGenerationRequest;

    if (!body.mode) {
      return errorResponse(ErrorCode.INVALID_REQUEST, 'Missing required field: mode');
    }

    const supabase = createServiceClient();

    // Update job status if job_id provided
    if (body.job_id) {
      await supabase.from('generation_jobs').update({
        status: 'PROCESSING',
        started_at: new Date().toISOString(),
      }).eq('id', body.job_id);
    }

    let result: unknown;

    switch (body.mode) {
      case 'name':
        if (!body.naming) return errorResponse(ErrorCode.INVALID_REQUEST, 'Missing naming input');
        result = await handleNaming(body.naming, supabase, body.job_id);
        break;

      case 'flavor':
        if (!body.flavor) return errorResponse(ErrorCode.INVALID_REQUEST, 'Missing flavor input');
        result = await handleFlavor(body.flavor, supabase, body.job_id);
        break;

      case 'narrative':
        if (!body.narrative) return errorResponse(ErrorCode.INVALID_REQUEST, 'Missing narrative input');
        result = await handleNarrative(body.narrative, supabase, body.job_id);
        break;

      case 'base_text':
        if (!body.base_text) return errorResponse(ErrorCode.INVALID_REQUEST, 'Missing base_text input');
        result = await handleBaseText(body.base_text, supabase, body.job_id);
        break;

      default:
        return errorResponse(ErrorCode.INVALID_REQUEST, `Unknown mode: ${body.mode}`);
    }

    return successResponse(result);
  } catch (err) {
    console.error('generate-card-text error:', err);

    try {
      const body = await req.clone().json() as TextGenerationRequest;
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
      `Text generation failed: ${err instanceof Error ? err.message : String(err)}`,
      500
    );
  }
});

// Chaos Creatures -- OpenAI Client Service
// Source: docs/design/03-prompt-templates.md Section 2
// Source: docs/design/05-content-pipeline.md Section 3b
//
// Handles all communication with OpenAI GPT-4o Mini for text generation:
//   - Card naming (3 candidates per evolution)
//   - Flavor text generation (max 120 chars)
//   - Evolution narrative (Epic/Legendary only, 2-3 sentences)
//   - Base card text (batch pipeline: name + flavor_text)
//
// Key behaviors:
//   - Structured JSON output parsing with validation
//   - Retry once on malformed responses
//   - Cost tracking per call (~$0.0001 per call)
//
// Environment: OPENAI_API_KEY

// =============================================================================
// Types
// =============================================================================

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequestBody {
  model: string;
  temperature: number;
  max_tokens: number;
  messages: OpenAIMessage[];
  response_format?: { type: string };
}

export interface OpenAIChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

export interface CardTextResult {
  name: string;
  flavor_text: string;
}

export interface NamingResult {
  names: string[];
}

// =============================================================================
// Error Types
// =============================================================================

export class OpenAIApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'OpenAIApiError';
  }
}

export class OpenAIValidationError extends Error {
  constructor(message: string, public readonly rawContent: string) {
    super(message);
    this.name = 'OpenAIValidationError';
  }
}

// =============================================================================
// Configuration
// =============================================================================

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  return key;
}

// =============================================================================
// Core API Call
// =============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call the OpenAI Chat Completions API.
 * Retries once on 429 (rate limit) and 5xx (server error).
 */
async function callOpenAI(body: OpenAIRequestBody): Promise<OpenAIResponse> {
  const apiKey = getOpenAIKey();
  const maxRetries = 2;
  let delay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let response: Response;
    try {
      response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      console.warn(`OpenAI network error on attempt ${attempt + 1}, retrying in ${delay}ms`);
      await sleep(delay);
      delay *= 2;
      continue;
    }

    if (response.ok) {
      return (await response.json()) as OpenAIResponse;
    }

    let errorDetail: string;
    try {
      errorDetail = await response.text();
    } catch {
      errorDetail = `HTTP ${response.status}`;
    }

    const isRetryable = response.status === 429 || response.status >= 500;
    if (!isRetryable || attempt === maxRetries - 1) {
      throw new OpenAIApiError(
        `OpenAI HTTP ${response.status}: ${errorDetail}`,
        response.status,
        errorDetail
      );
    }

    console.warn(`OpenAI attempt ${attempt + 1} failed (HTTP ${response.status}), retrying in ${delay}ms`);
    await sleep(delay);
    delay *= 2;
  }

  throw new Error('unreachable');
}

/**
 * Extract the text content from an OpenAI response.
 */
function extractContent(response: OpenAIResponse): string {
  if (!response.choices || response.choices.length === 0) {
    throw new OpenAIValidationError('No choices in OpenAI response', JSON.stringify(response));
  }
  return response.choices[0].message.content;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate card name candidates for evolution.
 * Returns 3 name options for the player to choose from.
 *
 * @param requestBody - From buildNamingPrompt()
 * @returns Array of 3 name strings
 * @throws OpenAIValidationError if response is not a valid JSON array of 3 strings
 */
export async function generateCardNames(
  requestBody: OpenAIRequestBody
): Promise<{ names: string[]; usage: OpenAIUsage }> {
  const response = await callOpenAI(requestBody);
  const content = extractContent(response);

  let names: string[];
  try {
    names = JSON.parse(content);
  } catch {
    throw new OpenAIValidationError(
      `Failed to parse naming response as JSON array: ${content}`,
      content
    );
  }

  if (!Array.isArray(names) || names.length !== 3) {
    throw new OpenAIValidationError(
      `Expected array of 3 names, got: ${content}`,
      content
    );
  }

  // Validate each name: 3-30 characters
  for (const name of names) {
    if (typeof name !== 'string' || name.length < 3 || name.length > 30) {
      throw new OpenAIValidationError(
        `Invalid name "${name}" -- must be 3-30 characters`,
        content
      );
    }
  }

  return { names, usage: response.usage };
}

/**
 * Generate flavor text for a card.
 * Returns a single string, max 120 characters.
 *
 * @param requestBody - From buildFlavorTextPrompt()
 * @returns The flavor text string
 * @throws OpenAIValidationError if response exceeds 120 characters
 */
export async function generateFlavorText(
  requestBody: OpenAIRequestBody
): Promise<{ flavorText: string; usage: OpenAIUsage }> {
  const response = await callOpenAI(requestBody);
  let content = extractContent(response).trim();

  // Strip surrounding quotes if present
  if (
    (content.startsWith('"') && content.endsWith('"')) ||
    (content.startsWith("'") && content.endsWith("'"))
  ) {
    content = content.slice(1, -1);
  }

  if (content.length > 120) {
    throw new OpenAIValidationError(
      `Flavor text exceeds 120 characters (${content.length}): "${content}"`,
      content
    );
  }

  return { flavorText: content, usage: response.usage };
}

/**
 * Generate evolution narrative for Epic/Legendary evolutions.
 * Returns 2-3 sentences for the evolution ceremony animation.
 *
 * @param requestBody - From buildNarrativePrompt()
 * @returns The narrative text string
 */
export async function generateNarrative(
  requestBody: OpenAIRequestBody
): Promise<{ narrative: string; usage: OpenAIUsage }> {
  const response = await callOpenAI(requestBody);
  const content = extractContent(response).trim();

  return { narrative: content, usage: response.usage };
}

/**
 * Generate base card text (name + flavor_text) during batch generation.
 * Returns structured JSON with name and flavor_text fields.
 *
 * @param requestBody - From buildBaseCardTextPrompt()
 * @returns CardTextResult with name and flavor_text
 * @throws OpenAIValidationError if response is malformed
 */
export async function generateBaseCardText(
  requestBody: OpenAIRequestBody
): Promise<{ result: CardTextResult; usage: OpenAIUsage }> {
  const response = await callOpenAI(requestBody);
  const content = extractContent(response);

  let result: CardTextResult;
  try {
    result = JSON.parse(content);
  } catch {
    throw new OpenAIValidationError(
      `Failed to parse base card text response as JSON: ${content}`,
      content
    );
  }

  // Validate fields
  if (!result.name || typeof result.name !== 'string') {
    throw new OpenAIValidationError('Missing or invalid "name" field', content);
  }
  if (!result.flavor_text || typeof result.flavor_text !== 'string') {
    throw new OpenAIValidationError('Missing or invalid "flavor_text" field', content);
  }

  // Validate name length (3-30 characters)
  if (result.name.length < 3 || result.name.length > 30) {
    throw new OpenAIValidationError(
      `Name "${result.name}" must be 3-30 characters (got ${result.name.length})`,
      content
    );
  }

  // Reject generic names
  const genericNames = ['creature', 'card', 'unit', 'monster'];
  if (genericNames.includes(result.name.toLowerCase())) {
    throw new OpenAIValidationError(
      `Name "${result.name}" is too generic`,
      content
    );
  }

  // Validate flavor text length (max 120 characters)
  if (result.flavor_text.length > 120) {
    throw new OpenAIValidationError(
      `Flavor text exceeds 120 characters (${result.flavor_text.length})`,
      content
    );
  }

  return { result, usage: response.usage };
}

/**
 * Generate base card text with automatic retry on validation failure.
 * On first failure, retries with a stricter prompt.
 */
export async function generateBaseCardTextWithRetry(
  requestBody: OpenAIRequestBody
): Promise<{ result: CardTextResult; usage: OpenAIUsage; retried: boolean }> {
  try {
    const { result, usage } = await generateBaseCardText(requestBody);
    return { result, usage, retried: false };
  } catch (err) {
    if (!(err instanceof OpenAIValidationError)) throw err;

    // Retry with stricter instructions
    const retryBody: OpenAIRequestBody = {
      ...requestBody,
      messages: [
        ...requestBody.messages,
        {
          role: 'user',
          content:
            'The previous response was invalid. The name must be 2-4 words and under 30 characters total. ' +
            'The flavor text must be under 120 characters. Do not explain, just output the JSON: ' +
            '{"name": "...", "flavor_text": "..."}',
        },
      ],
    };

    const { result, usage } = await generateBaseCardText(retryBody);
    return { result, usage, retried: true };
  }
}

/**
 * Estimate the cost of an OpenAI GPT-4o Mini call.
 * GPT-4o Mini: $0.15/1M input tokens, $0.60/1M output tokens.
 * Average card text call: ~200 input tokens, ~40 output tokens.
 */
export function estimateCost(usage: OpenAIUsage): number {
  const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
  return inputCost + outputCost;
}

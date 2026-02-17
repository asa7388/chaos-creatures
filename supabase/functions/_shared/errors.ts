// _shared/errors.ts — Standardized error response format
// All Edge Functions return { error: { code, message } } on failure.

export enum ErrorCode {
  // Auth
  UNAUTHORIZED = "UNAUTHORIZED",
  PLAYER_NOT_FOUND = "PLAYER_NOT_FOUND",

  // Validation
  INVALID_REQUEST = "INVALID_REQUEST",
  VALIDATION_FAILED = "VALIDATION_FAILED",

  // Deck
  DECK_NOT_FOUND = "DECK_NOT_FOUND",
  DECK_INVALID = "DECK_INVALID",
  DECK_SLOT_LIMIT = "DECK_SLOT_LIMIT",
  DECK_CARD_NOT_OWNED = "DECK_CARD_NOT_OWNED",

  // Economy
  INSUFFICIENT_DUST = "INSUFFICIENT_DUST",
  INSUFFICIENT_SHARDS = "INSUFFICIENT_SHARDS",
  INVALID_SHARD_TIER = "INVALID_SHARD_TIER",

  // Evolution
  EVOLUTION_NOT_ELIGIBLE = "EVOLUTION_NOT_ELIGIBLE",
  EVOLUTION_ENERGY_INSUFFICIENT = "EVOLUTION_ENERGY_INSUFFICIENT",
  EVOLUTION_SHARD_MISSING = "EVOLUTION_SHARD_MISSING",
  EVOLUTION_ALREADY_MAX = "EVOLUTION_ALREADY_MAX",
  EVOLUTION_NOT_FOUND = "EVOLUTION_NOT_FOUND",
  EVOLUTION_GENERATION_FAILED = "EVOLUTION_GENERATION_FAILED",

  // Collection
  CARD_NOT_FOUND = "CARD_NOT_FOUND",
  CARD_NOT_OWNED = "CARD_NOT_OWNED",

  // Matchmaking
  ALREADY_IN_QUEUE = "ALREADY_IN_QUEUE",
  NOT_IN_QUEUE = "NOT_IN_QUEUE",
  INVALID_DECK_FOR_QUEUE = "INVALID_DECK_FOR_QUEUE",

  // Quest
  QUEST_NOT_FOUND = "QUEST_NOT_FOUND",
  QUEST_NOT_COMPLETED = "QUEST_NOT_COMPLETED",
  QUEST_ALREADY_CLAIMED = "QUEST_ALREADY_CLAIMED",

  // Subscription
  RECEIPT_INVALID = "RECEIPT_INVALID",
  SUBSCRIPTION_SYNC_FAILED = "SUBSCRIPTION_SYNC_FAILED",

  // General
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
}

/**
 * Create a standardized error Response.
 */
export function errorResponse(code: ErrorCode, message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Create a standardized success Response.
 */
export function successResponse<T>(data: T, status: number = 200): Response {
  return new Response(
    JSON.stringify({ data }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * CORS headers for all Edge Functions.
 * @deprecated Use getCorsHeaders(req) for dynamic origin checking.
 * Kept for backward compatibility.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Allowed CORS origins for the admin dashboard.
 * The iOS app uses native HTTP (URLSession) and is not subject to CORS.
 * Only the admin dashboard (web) needs CORS headers.
 */
const ALLOWED_ORIGINS = [
  "https://admin.chaoscreatures.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

/**
 * Return CORS headers with a dynamic origin check.
 * Only allows requests from known admin dashboard origins.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };
}

/**
 * Handle OPTIONS preflight requests.
 * Uses dynamic CORS origin checking.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }
  return null;
}

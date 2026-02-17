// _shared/auth.ts — JWT extraction and player ID lookup
// Every authenticated Edge Function calls getPlayer() to get the player row.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createServiceClient } from "./supabase.ts";
import { errorResponse, ErrorCode } from "./errors.ts";

export interface AuthContext {
  authId: string;
  playerId: string;
}

/**
 * Extract the auth user from the JWT in the Authorization header.
 * Returns the Supabase auth user ID and the corresponding player row ID.
 */
export async function getAuthContext(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Missing Authorization header", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createServiceClient();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Invalid or expired token", 401);
  }

  // Look up the player row by auth_id
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (playerError || !player) {
    return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player profile not found", 404);
  }

  return { authId: user.id, playerId: player.id };
}

/**
 * Type guard: check if the result is a Response (error) or AuthContext (success).
 */
export function isAuthError(result: AuthContext | Response): result is Response {
  return result instanceof Response;
}

/**
 * Verify that the request is authorized with the service role key.
 * Used for server-to-server calls (game server -> Edge Functions, admin -> Edge Functions,
 * and internal pipeline functions like batch-generate, generate-card-art, etc.).
 *
 * The caller must send: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 *
 * Verification strategy (in order):
 * 1. Decode the JWT payload and check role === "service_role" (handles gateway transformations)
 * 2. Fall back to raw string comparison against SUPABASE_SERVICE_ROLE_KEY env var
 */
export function verifyServiceRole(req: Request): Response | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Missing Authorization header", 401);
  }

  const token = authHeader.replace("Bearer ", "");

  // Strategy 1: Decode JWT payload and check role claim.
  // Supabase service role JWTs contain { role: "service_role" } in the payload.
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      // Base64url decode the payload (second segment)
      const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payloadJson = atob(payloadB64);
      const payload = JSON.parse(payloadJson);
      if (payload.role === "service_role") {
        return null; // Auth passed
      }
    }
  } catch {
    // JWT decode failed — fall through to raw comparison
  }

  // Strategy 2: Raw string comparison (original approach, works for direct key usage)
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    return null; // Auth passed
  }

  return errorResponse(ErrorCode.UNAUTHORIZED, "Invalid service role key", 403);
}

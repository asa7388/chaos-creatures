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

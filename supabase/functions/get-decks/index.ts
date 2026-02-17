// get-decks/index.ts — GET /decks
// Returns all decks belonging to the authenticated player.
// Response: { data: { decks: Deck[] } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, corsHeaders, ErrorCode } from "../_shared/errors.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "GET") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const supabase = createServiceClient();

  const { data: decks, error } = await supabase
    .from("decks")
    .select("*")
    .eq("owner_id", auth.playerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("get-decks error:", error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch decks", 500);
  }

  return new Response(
    JSON.stringify({ data: { decks: decks || [] } }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

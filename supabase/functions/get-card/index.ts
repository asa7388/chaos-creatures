// get-card/index.ts — GET /collection/cards/{id}
// Returns a single card instance with full template details.
// Response: { data: { card: CardInstance } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, successResponse, handleCors, corsHeaders, ErrorCode } from "../_shared/errors.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "GET") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  // Authenticate
  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  // Extract card ID from URL path: /get-card?id=<uuid>
  const url = new URL(req.url);
  const cardId = url.searchParams.get("id");
  if (!cardId) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Missing card id parameter");
  }

  const supabase = createServiceClient();

  const { data: card, error } = await supabase
    .from("card_instances")
    .select(`
      *,
      card_templates (
        id,
        name,
        card_type,
        faction_id,
        base_attack,
        base_health,
        base_instability,
        mana_cost,
        base_keywords,
        spell_effect,
        stabilizer_type,
        art_prompt,
        flavor_text
      )
    `)
    .eq("id", cardId)
    .eq("owner_id", auth.playerId)
    .single();

  if (error || !card) {
    return errorResponse(ErrorCode.CARD_NOT_FOUND, "Card not found or not owned", 404);
  }

  return new Response(
    JSON.stringify({ data: { card } }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

// validate-deck/index.ts — POST /decks/validate
// Validation-only endpoint — does not save.
// Returns specific error messages per REQ-164.
// Response: { data: { valid: boolean, errors: string[] } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, corsHeaders, ErrorCode } from "../_shared/errors.ts";
import { validateDeck } from "../_shared/deck-validator.ts";
import { DeckEntry } from "../_shared/types.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { faction_id, avatar_id, card_entries } = body as {
    faction_id: string;
    avatar_id: string;
    card_entries: DeckEntry[];
  };

  if (!faction_id || !avatar_id || !card_entries) {
    return errorResponse(
      ErrorCode.INVALID_REQUEST,
      "faction_id, avatar_id, and card_entries are required"
    );
  }

  const supabase = createServiceClient();

  const validation = await validateDeck(
    supabase,
    auth.playerId,
    faction_id,
    avatar_id,
    card_entries
  );

  return new Response(
    JSON.stringify({ data: validation }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

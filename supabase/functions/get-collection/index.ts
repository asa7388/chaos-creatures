// get-collection/index.ts — GET /collection/cards
// Returns paginated card collection with filtering by faction, tier, sort.
// Response: { data: { cards: CardInstance[], total: number, page: number } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, successResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "GET") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  // Authenticate
  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const url = new URL(req.url);
  const factionId = url.searchParams.get("faction_id");
  const tier = url.searchParams.get("tier");
  const sort = url.searchParams.get("sort") || "name";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  // Build query for card_instances joined with card_templates for faction filtering
  let query = supabase
    .from("card_instances")
    .select(`
      *,
      card_templates!inner (
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
        stabilizer_type
      )
    `, { count: "exact" })
    .eq("owner_id", auth.playerId);

  // Filter by faction (via card_templates.faction_id)
  if (factionId) {
    query = query.eq("card_templates.faction_id", factionId);
  }

  // Filter by tier
  if (tier) {
    query = query.eq("tier", tier);
  }

  // Sort
  switch (sort) {
    case "name":
      query = query.order("current_name", { ascending: true });
      break;
    case "tier":
      query = query.order("tier", { ascending: false });
      break;
    case "mana_cost":
      query = query.order("current_mana_cost", { ascending: true });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "energy":
      query = query.order("chaos_energy", { ascending: false });
      break;
    default:
      query = query.order("current_name", { ascending: true });
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: cards, count, error } = await query;

  if (error) {
    console.error("get-collection error:", error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch collection", 500);
  }

  return new Response(
    JSON.stringify({ data: { cards: cards || [], total: count || 0, page } }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

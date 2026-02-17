// get-quests/index.ts — GET /economy/missions
// Returns player's active daily, weekly, and onboarding quests with progress.
// Response: { data: { daily: Mission[], weekly: Mission[], onboarding: Mission[] } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "GET") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const supabase = createServiceClient();

  // Fetch all active (not expired, not claimed) missions for this player
  const { data: missions, error } = await supabase
    .from("missions")
    .select("*")
    .eq("player_id", auth.playerId)
    .eq("is_claimed", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("get-quests error:", error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch quests", 500);
  }

  const now = new Date().toISOString();

  // Group by period
  const daily = (missions || []).filter(
    (m: any) => m.period === "DAILY" && m.expires_at >= now
  );
  const weekly = (missions || []).filter(
    (m: any) => m.period === "WEEKLY" && m.expires_at >= now
  );
  const onboarding = (missions || []).filter(
    (m: any) => m.period === "ONBOARDING"
  );

  return new Response(
    JSON.stringify({ data: { daily, weekly, onboarding } }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

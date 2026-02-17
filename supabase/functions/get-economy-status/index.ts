// get-economy-status/index.ts — GET /economy/balance
// Returns player's Dust balance, shard inventory, subscription tier, quest progress.
// Response: { data: { chaos_dust, shards: { uncommon, rare, epic, legendary }, subscription_tier, active_missions } }

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

  // Fetch player economy data
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select(
      "chaos_dust, shards_uncommon, shards_rare, shards_epic, shards_legendary, subscription_tier"
    )
    .eq("id", auth.playerId)
    .single();

  if (playerError || !player) {
    return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player not found", 404);
  }

  // Fetch active missions summary
  const { data: missions } = await supabase
    .from("missions")
    .select("id, mission_type, description, difficulty, period, target_value, current_value, is_completed, is_claimed")
    .eq("player_id", auth.playerId)
    .eq("is_claimed", false)
    .gte("expires_at", new Date().toISOString());

  return new Response(
    JSON.stringify({
      data: {
        chaos_dust: player.chaos_dust,
        shards: {
          uncommon: player.shards_uncommon,
          rare: player.shards_rare,
          epic: player.shards_epic,
          legendary: player.shards_legendary,
        },
        subscription_tier: player.subscription_tier,
        active_missions: missions || [],
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

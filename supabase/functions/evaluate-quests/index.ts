// evaluate-quests/index.ts — POST /evaluate-quests
// Called after match completion by the game server.
// Checks all active quests against match result. Updates progress.
// Grants rewards for completed quests. Subscriber bonus: Mid=1.5x, High=2.0x dust.
// Request: { player_id: string, match_data: MatchData }
// MatchData: { won: boolean, cards_played: CardPlayRecord[], damage_dealt: number,
//              order_events: number, chaos_events: number, creatures_played: number,
//              spells_played: number, final_hp: number, creatures_lost: number,
//              legendary_on_board: number }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { errorResponse, handleCors, corsHeaders, ErrorCode } from "../_shared/errors.ts";
import { SUBSCRIPTION_QUEST_MULTIPLIER, SubscriptionTier } from "../_shared/types.ts";

interface MatchData {
  won: boolean;
  cards_played: number;
  creatures_played: number;
  spells_played: number;
  damage_dealt: number;
  order_events: number;
  chaos_events: number;
  final_hp: number;
  creatures_lost: number;
  legendary_on_board: number;
}

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  // This is called by the game server with service role key, not player auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Missing Authorization", 401);
  }

  const body = await req.json();
  const { player_id, match_data } = body as { player_id: string; match_data: MatchData };

  if (!player_id || !match_data) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "player_id and match_data are required");
  }

  const supabase = createServiceClient();

  // Get player subscription tier for multiplier
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, subscription_tier")
    .eq("id", player_id)
    .single();

  if (playerError || !player) {
    return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player not found", 404);
  }

  const multiplier = SUBSCRIPTION_QUEST_MULTIPLIER[player.subscription_tier as SubscriptionTier] || 1.0;

  // Get active unclaimed missions
  const now = new Date().toISOString();
  const { data: missions, error: missionError } = await supabase
    .from("missions")
    .select("*")
    .eq("player_id", player_id)
    .eq("is_claimed", false)
    .eq("is_completed", false)
    .gte("expires_at", now);

  if (missionError) {
    console.error("evaluate-quests fetch error:", missionError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch missions", 500);
  }

  const completedMissions: any[] = [];
  const updatedMissions: any[] = [];

  for (const mission of (missions || [])) {
    const progress = calculateProgress(mission.mission_type, match_data);
    if (progress <= 0) continue;

    const newValue = Math.min(mission.target_value, mission.current_value + progress);
    const isNowCompleted = newValue >= mission.target_value;

    const { error: updateError } = await supabase
      .from("missions")
      .update({
        current_value: newValue,
        is_completed: isNowCompleted,
      })
      .eq("id", mission.id);

    if (updateError) {
      console.error("evaluate-quests update error:", updateError);
      continue;
    }

    if (isNowCompleted) {
      // Auto-grant rewards for completed quests
      const dustReward = Math.floor(mission.reward_dust * multiplier);

      if (dustReward > 0) {
        await supabase.rpc("add_chaos_dust", {
          p_player_id: player_id,
          p_amount: dustReward,
          p_source: "QUEST_REWARD",
          p_reference_id: mission.id,
        });
      }

      // Roll for shard reward
      if (mission.reward_shard_tier && mission.reward_shard_count > 0) {
        // Check shard_reward_chance from quest templates (default: medium=20%, hard=30%)
        const shardChance = mission.difficulty === "HARD" ? 0.3 :
                           mission.difficulty === "MEDIUM" ? 0.2 : 0;

        if (Math.random() < shardChance) {
          await supabase.rpc("add_shards", {
            p_player_id: player_id,
            p_shard_tier: mission.reward_shard_tier,
            p_amount: mission.reward_shard_count,
            p_source: "QUEST_REWARD",
            p_reference_id: mission.id,
          });
        }
      }

      // Mark as claimed
      await supabase
        .from("missions")
        .update({ is_claimed: true })
        .eq("id", mission.id);

      completedMissions.push({
        mission_id: mission.id,
        dust_reward: dustReward,
        shard_tier: mission.reward_shard_tier,
      });
    } else {
      updatedMissions.push({
        mission_id: mission.id,
        new_value: newValue,
      });
    }
  }

  return new Response(
    JSON.stringify({
      data: {
        completed: completedMissions,
        updated: updatedMissions,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

/**
 * Calculate how much progress a match gives toward a specific mission type.
 */
function calculateProgress(missionType: string, match: MatchData): number {
  switch (missionType) {
    case "WIN_GAMES":
      return match.won ? 1 : 0;
    case "PLAY_GAMES":
      return 1;
    case "PLAY_CREATURES":
      return match.creatures_played || 0;
    case "PLAY_SPELLS":
      return match.spells_played || 0;
    case "PLAY_CARDS":
      return match.cards_played || 0;
    case "DEAL_DAMAGE":
      return match.damage_dealt || 0;
    case "TRIGGER_CHAOS_EVENTS":
      return match.chaos_events || 0;
    case "TRIGGER_ORDER_EVENTS":
      return match.order_events || 0;
    case "WIN_WITH_STYLE":
      // This is handled specially per quest description.
      // Check multiple conditions:
      // D13: Win with 15+ HP
      if (match.won && match.final_hp >= 15) return 1;
      // D19: Win with 3+ Legendaries on board
      if (match.won && match.legendary_on_board >= 3) return 1;
      // D20: Win without losing a creature
      if (match.won && match.creatures_lost === 0) return 1;
      return 0;
    case "EVOLVE_CARD":
      // Evolution quests are tracked separately by the evolution service
      return 0;
    default:
      return 0;
  }
}

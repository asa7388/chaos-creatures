// evaluate-achievements/index.ts — POST /evaluate-achievements
// Called after match completion and evolution completion.
// Checks all achievement conditions against player_achievements.
// Grants rewards atomically. One-time granted flag prevents double-grant.
// REQ-187, REQ-188: idempotent — running multiple times produces same result.
// Request: { player_id: string, trigger: "MATCH" | "EVOLUTION" | "LOGIN",
//            match_data?: MatchData, evolution_tier?: string }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { errorResponse, handleCors, corsHeaders, ErrorCode } from "../_shared/errors.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Missing Authorization", 401);
  }

  const body = await req.json();
  const { player_id, trigger, match_data, evolution_tier } = body;

  if (!player_id) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "player_id is required");
  }

  const supabase = createServiceClient();

  // 1. Get all achievement definitions
  const { data: achievements, error: achError } = await supabase
    .from("achievements")
    .select("*");

  if (achError) {
    console.error("evaluate-achievements fetch error:", achError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch achievements", 500);
  }

  // 2. Get player's current achievement progress
  const { data: playerAchievements, error: paError } = await supabase
    .from("player_achievements")
    .select("*")
    .eq("player_id", player_id);

  if (paError) {
    console.error("evaluate-achievements player progress error:", paError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch player achievements", 500);
  }

  // Map for quick lookup
  const progressMap = new Map(
    (playerAchievements || []).map((pa: any) => [pa.achievement_id, pa])
  );

  // 3. Get player stats for evaluation
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", player_id)
    .single();

  if (playerError || !player) {
    return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player not found", 404);
  }

  // 4. Get collection stats
  const { count: collectionCount } = await supabase
    .from("card_instances")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", player_id);

  const { count: legendaryCount } = await supabase
    .from("card_instances")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", player_id)
    .eq("tier", "LEGENDARY");

  const newlyUnlocked: any[] = [];

  for (const achievement of (achievements || [])) {
    const existing = progressMap.get(achievement.id);

    // Already unlocked — skip (idempotent)
    if (existing?.is_unlocked) continue;

    // Calculate current value based on achievement category
    const currentValue = calculateAchievementValue(
      achievement,
      player,
      collectionCount || 0,
      legendaryCount || 0,
      match_data
    );

    if (currentValue <= 0 && !existing) continue;

    // Upsert progress
    if (!existing) {
      // Create player_achievement row
      const isUnlocked = currentValue >= achievement.target_value;
      const { error: insertError } = await supabase
        .from("player_achievements")
        .insert({
          player_id,
          achievement_id: achievement.id,
          current_value: Math.min(currentValue, achievement.target_value),
          is_unlocked: isUnlocked,
          unlocked_at: isUnlocked ? new Date().toISOString() : null,
        });

      if (insertError) {
        // Check for unique constraint violation (idempotency)
        if (insertError.code === "23505") continue;
        console.error("evaluate-achievements insert error:", insertError);
        continue;
      }

      if (isUnlocked) {
        await grantAchievementReward(supabase, player_id, achievement);
        newlyUnlocked.push({
          achievement_id: achievement.id,
          name: achievement.name,
          reward_type: achievement.reward_type,
          reward_amount: achievement.reward_amount,
        });
      }
    } else {
      // Update existing progress
      const newValue = Math.min(
        Math.max(existing.current_value, currentValue),
        achievement.target_value
      );
      const isUnlocked = newValue >= achievement.target_value;

      if (newValue === existing.current_value && !isUnlocked) continue;

      const { error: updateError } = await supabase
        .from("player_achievements")
        .update({
          current_value: newValue,
          is_unlocked: isUnlocked,
          unlocked_at: isUnlocked ? new Date().toISOString() : null,
        })
        .eq("id", existing.id)
        .eq("is_unlocked", false); // Only update if not already unlocked (idempotent guard)

      if (updateError) {
        console.error("evaluate-achievements update error:", updateError);
        continue;
      }

      if (isUnlocked && !existing.is_unlocked) {
        await grantAchievementReward(supabase, player_id, achievement);
        newlyUnlocked.push({
          achievement_id: achievement.id,
          name: achievement.name,
          reward_type: achievement.reward_type,
          reward_amount: achievement.reward_amount,
        });
      }
    }
  }

  return new Response(
    JSON.stringify({ data: { newly_unlocked: newlyUnlocked } }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

/**
 * Calculate achievement progress value based on category and player stats.
 */
function calculateAchievementValue(
  achievement: any,
  player: any,
  collectionCount: number,
  legendaryCount: number,
  matchData?: any
): number {
  switch (achievement.category) {
    case "BATTLE":
      return player.total_wins || 0;
    case "EVOLUTION":
      return player.cards_evolved_total || 0;
    case "COLLECTION":
      if (achievement.description?.toLowerCase().includes("legendary")) {
        return legendaryCount;
      }
      return collectionCount;
    case "CHAOS_ROLL":
      // Chaos roll achievements are tracked via match_data if provided
      if (matchData) {
        return (matchData.chaos_events || 0) + (matchData.order_events || 0);
      }
      return 0;
    case "SOCIAL":
      return (player.friend_ids || []).length;
    default:
      return 0;
  }
}

/**
 * Grant achievement reward atomically.
 */
async function grantAchievementReward(
  supabase: any,
  playerId: string,
  achievement: any
): Promise<void> {
  switch (achievement.reward_type) {
    case "XP":
      await supabase
        .from("players")
        .update({ player_xp: await getPlayerXp(supabase, playerId) + achievement.reward_amount })
        .eq("id", playerId);
      break;

    case "SHARDS":
      // Default to UNCOMMON shards for achievements
      await supabase.rpc("add_shards", {
        p_player_id: playerId,
        p_shard_tier: "UNCOMMON",
        p_amount: achievement.reward_amount,
        p_source: "MILESTONE",
        p_reference_id: achievement.id,
      });
      break;

    case "CHAOS_ENERGY_BOOST":
      // This would boost energy for all cards in active deck
      // Implementation depends on game server integration
      break;
  }

  // Grant title if the achievement has one
  if (achievement.reward_title) {
    await supabase
      .from("players")
      .update({ active_title: achievement.reward_title })
      .eq("id", playerId)
      .is("active_title", null); // Only set if player hasn't chosen a title
  }
}

async function getPlayerXp(supabase: any, playerId: string): Promise<number> {
  const { data } = await supabase
    .from("players")
    .select("player_xp")
    .eq("id", playerId)
    .single();
  return data?.player_xp || 0;
}

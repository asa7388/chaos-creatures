// refresh-daily-quests/index.ts — Scheduled function (pg_cron daily at 00:00 UTC)
// Assigns 3 new daily quests from quest templates.
// Quest generation: 40% easy / 40% medium / 20% hard.
// Uncompleted quests persist (do NOT expire) until replaced.
// Also generates 2 weekly quests on Mondays.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";
import { SUBSCRIPTION_QUEST_MULTIPLIER, SubscriptionTier } from "../_shared/types.ts";

const DAILY_QUEST_COUNT = 3;
const WEEKLY_QUEST_COUNT = 2;

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  // This is a cron/admin function — verify service role auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Missing Authorization", 401);
  }

  const supabase = createServiceClient();

  // Get all active players (played in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: players, error: playerError } = await supabase
    .from("players")
    .select("id, subscription_tier")
    .gte("updated_at", thirtyDaysAgo);

  if (playerError) {
    console.error("refresh-daily-quests player fetch error:", playerError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch players", 500);
  }

  // Get all quest templates
  const { data: dailyTemplates, error: dtError } = await supabase
    .from("quest_templates")
    .select("*")
    .eq("period", "DAILY");

  const { data: weeklyTemplates, error: wtError } = await supabase
    .from("quest_templates")
    .select("*")
    .eq("period", "WEEKLY");

  if (dtError || wtError) {
    console.error("refresh-daily-quests template fetch error:", dtError, wtError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch quest templates", 500);
  }

  const now = new Date();
  const isMonday = now.getUTCDay() === 1;

  // Calculate expiry times
  const dailyExpiry = new Date(now);
  dailyExpiry.setUTCDate(dailyExpiry.getUTCDate() + 1);
  dailyExpiry.setUTCHours(0, 0, 0, 0);

  const weeklyExpiry = new Date(now);
  // Set to next Sunday 23:59 UTC
  const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7;
  weeklyExpiry.setUTCDate(weeklyExpiry.getUTCDate() + daysUntilSunday);
  weeklyExpiry.setUTCHours(23, 59, 59, 999);

  let totalAssigned = 0;
  let totalWeeklyAssigned = 0;

  for (const player of (players || [])) {
    // Clear expired daily quests (replace uncompleted ones)
    await supabase
      .from("missions")
      .delete()
      .eq("player_id", player.id)
      .eq("period", "DAILY")
      .eq("is_completed", false)
      .eq("is_claimed", false);

    // Get existing quest types to avoid duplicates
    const { data: existingMissions } = await supabase
      .from("missions")
      .select("mission_type")
      .eq("player_id", player.id)
      .eq("is_claimed", false);

    const existingTypes = new Set(
      (existingMissions || []).map((m: any) => m.mission_type)
    );

    // Generate daily quests using the documented algorithm
    const newDailyQuests = generateDailyQuests(
      dailyTemplates || [],
      existingTypes,
      DAILY_QUEST_COUNT,
      player.subscription_tier as SubscriptionTier
    );

    if (newDailyQuests.length > 0) {
      const dailyRows = newDailyQuests.map((q) => ({
        player_id: player.id,
        mission_type: q.mission_type,
        description: q.description,
        difficulty: q.difficulty,
        period: "DAILY" as const,
        target_value: q.target_value,
        current_value: 0,
        is_completed: false,
        is_claimed: false,
        reward_dust: q.reward_dust,
        reward_shard_tier: q.shard_reward_tier || null,
        reward_shard_count: q.shard_reward_count || 0,
        expires_at: dailyExpiry.toISOString(),
      }));

      await supabase.from("missions").insert(dailyRows);
      totalAssigned += dailyRows.length;
    }

    // Generate weekly quests on Mondays
    if (isMonday && weeklyTemplates && weeklyTemplates.length > 0) {
      // Remove expired weekly quests
      await supabase
        .from("missions")
        .delete()
        .eq("player_id", player.id)
        .eq("period", "WEEKLY")
        .eq("is_completed", false)
        .eq("is_claimed", false);

      const shuffled = [...weeklyTemplates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, WEEKLY_QUEST_COUNT);

      const multiplier = SUBSCRIPTION_QUEST_MULTIPLIER[player.subscription_tier as SubscriptionTier] || 1.0;

      const weeklyRows = selected.map((q) => ({
        player_id: player.id,
        mission_type: q.mission_type,
        description: q.description,
        difficulty: "HARD" as const,
        period: "WEEKLY" as const,
        target_value: q.target_value,
        current_value: 0,
        is_completed: false,
        is_claimed: false,
        reward_dust: Math.floor(q.base_dust * multiplier),
        reward_shard_tier: q.shard_reward_tier || null,
        reward_shard_count: q.shard_reward_count || 0,
        expires_at: weeklyExpiry.toISOString(),
      }));

      await supabase.from("missions").insert(weeklyRows);
      totalWeeklyAssigned += weeklyRows.length;
    }
  }

  return new Response(
    JSON.stringify({
      data: {
        players_processed: (players || []).length,
        daily_quests_assigned: totalAssigned,
        weekly_quests_assigned: totalWeeklyAssigned,
      },
    }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

/**
 * Generate daily quests using the documented algorithm from doc 04 Section 4.1.
 * Difficulty distribution: 40% easy, 40% medium, 20% hard.
 */
function generateDailyQuests(
  templates: any[],
  existingTypes: Set<string>,
  count: number,
  subscriptionTier: SubscriptionTier
): any[] {
  const multiplier = SUBSCRIPTION_QUEST_MULTIPLIER[subscriptionTier] || 1.0;
  const results: any[] = [];
  const usedTypes = new Set<string>(existingTypes);

  for (let i = 0; i < count; i++) {
    // Roll difficulty
    const roll = Math.random();
    let difficulty: string;
    if (roll < 0.4) difficulty = "EASY";
    else if (roll < 0.8) difficulty = "MEDIUM";
    else difficulty = "HARD";

    // Get templates for this difficulty
    let candidates = templates.filter((t) => t.difficulty === difficulty);

    // Filter out already-used mission types
    let filtered = candidates.filter((t) => !usedTypes.has(t.mission_type));

    // Fallback if all filtered out
    if (filtered.length === 0) filtered = candidates;
    if (filtered.length === 0) continue;

    // Select random
    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    usedTypes.add(selected.mission_type);

    results.push({
      ...selected,
      reward_dust: Math.floor(selected.base_dust * multiplier),
    });
  }

  return results;
}

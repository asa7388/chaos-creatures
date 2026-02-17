// monthly-rewards/index.ts — Scheduled function (pg_cron monthly, 1st of month)
// Grant High-tier monthly Legendary Shard (REQ-041).
// Also grants Mid-tier monthly bonus Commons (3 per month).
// Idempotent: checks if reward was already granted this month.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { errorResponse, handleCors, corsHeaders, ErrorCode } from "../_shared/errors.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  // This is a cron/admin function
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse(ErrorCode.UNAUTHORIZED, "Missing Authorization", 401);
  }

  const supabase = createServiceClient();

  // Get current month identifier for idempotency
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  // Get all HIGH tier subscribers
  const { data: highTierPlayers, error: highError } = await supabase
    .from("players")
    .select("id")
    .eq("subscription_tier", "HIGH");

  if (highError) {
    console.error("monthly-rewards HIGH fetch error:", highError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to fetch subscribers", 500);
  }

  let legendaryGranted = 0;

  for (const player of (highTierPlayers || [])) {
    // Idempotency check: look for existing shard transaction this month
    const { data: existing } = await supabase
      .from("shard_transactions")
      .select("id")
      .eq("player_id", player.id)
      .eq("source", "SUBSCRIPTION_GRANT")
      .eq("reference_id", `monthly_legendary_${monthKey}`)
      .limit(1);

    if (existing && existing.length > 0) continue; // Already granted

    await supabase.rpc("add_shards", {
      p_player_id: player.id,
      p_shard_tier: "LEGENDARY",
      p_amount: 1,
      p_source: "SUBSCRIPTION_GRANT",
      p_reference_id: `monthly_legendary_${monthKey}`,
    });

    legendaryGranted++;
  }

  // Get all MID tier subscribers for bonus Commons
  const { data: midTierPlayers, error: midError } = await supabase
    .from("players")
    .select("id, primary_faction_id")
    .in("subscription_tier", ["MID", "HIGH"]);

  let commonsGranted = 0;

  for (const player of (midTierPlayers || [])) {
    if (!player.primary_faction_id) continue;

    // Idempotency check
    const { data: existing } = await supabase
      .from("dust_transactions")
      .select("id")
      .eq("player_id", player.id)
      .eq("source", "SUBSCRIPTION_MONTHLY_COMMONS")
      .eq("reference_id", `monthly_commons_${monthKey}`)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Get random templates from player's faction
    const { data: templates } = await supabase
      .from("card_templates")
      .select("*")
      .eq("faction_id", player.primary_faction_id)
      .not("approved_at", "is", null)
      .limit(50);

    if (!templates || templates.length === 0) continue;

    const count = player.id === midTierPlayers?.[0]?.id ? 3 : 5; // MID=3, HIGH=5
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const newCards = selected.map((t) => ({
      template_id: t.id,
      owner_id: player.id,
      tier: "COMMON",
      current_name: t.name,
      current_attack: t.base_attack,
      current_health: t.base_health,
      current_mana_cost: t.mana_cost,
      instability_value: t.base_instability,
      innate_keywords: t.base_keywords,
      art_url: t.art_url,
      flavor_text: t.flavor_text,
    }));

    await supabase.from("card_instances").insert(newCards);

    // Record for idempotency
    await supabase.from("dust_transactions").insert({
      player_id: player.id,
      amount: 0,
      source: "SUBSCRIPTION_MONTHLY_COMMONS",
      reference_id: `monthly_commons_${monthKey}`,
      balance_after: 0, // Placeholder — no dust change
    });

    commonsGranted += count;
  }

  return new Response(
    JSON.stringify({
      data: {
        month: monthKey,
        legendary_shards_granted: legendaryGranted,
        bonus_commons_granted: commonsGranted,
        high_tier_count: (highTierPlayers || []).length,
        mid_tier_count: (midTierPlayers || []).length,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

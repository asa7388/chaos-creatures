// complete-evolution/index.ts — POST /evolution/{id}/confirm
// Finalize evolution after player confirms modifier and name choice.
// Updates card instance with new tier, stats, art URL, ability, flavor text.
// Records in evolution_history JSONB. Triggers evaluate-achievements.
// Request: { evolution_id: string, card_instance_id: string, modifier_chosen_id?: string, name_chosen: string }
// Response: { data: { card: CardInstance } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";
import { NEXT_TIER, EvolutionTier } from "../_shared/types.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { evolution_id, card_instance_id, modifier_chosen_id, name_chosen } = body;

  if (!evolution_id || !card_instance_id || !name_chosen) {
    return errorResponse(
      ErrorCode.INVALID_REQUEST,
      "evolution_id, card_instance_id, and name_chosen are required"
    );
  }

  const supabase = createServiceClient();

  // 1. Fetch card instance
  const { data: card, error: cardError } = await supabase
    .from("card_instances")
    .select("*")
    .eq("id", card_instance_id)
    .eq("owner_id", auth.playerId)
    .single();

  if (cardError || !card) {
    return errorResponse(ErrorCode.CARD_NOT_FOUND, "Card not found or not owned", 404);
  }

  const currentTier = card.tier as EvolutionTier;
  const targetTier = NEXT_TIER[currentTier];

  if (!targetTier) {
    return errorResponse(ErrorCode.EVOLUTION_ALREADY_MAX, "Card is already at maximum tier");
  }

  // 2. Check generation jobs are complete
  const { data: jobs, error: jobError } = await supabase
    .from("generation_jobs")
    .select("*")
    .eq("card_instance_id", card_instance_id)
    .in("job_type", ["EVOLUTION_IMAGE", "EVOLUTION_TEXT"])
    .order("created_at", { ascending: false })
    .limit(2);

  const imageJob = (jobs || []).find((j: any) => j.job_type === "EVOLUTION_IMAGE");
  const textJob = (jobs || []).find((j: any) => j.job_type === "EVOLUTION_TEXT");

  // Use generated art if available, otherwise keep current
  const newArtUrl = imageJob?.status === "COMPLETED" && imageJob?.art_url
    ? imageJob.art_url
    : card.art_url;

  // Use generated text if available
  const generatedText = textJob?.status === "COMPLETED" && textJob?.output_data
    ? textJob.output_data
    : null;

  const newFlavorText = generatedText?.flavor_text || card.flavor_text;

  // 3. Fetch chosen modifier (if provided)
  let chosenModifier: any = null;
  let newModifiers = [...(card.modifiers || [])];
  let newModifierKeywords = [...(card.modifier_keywords || [])];
  let instabilityAdjustment = 0;

  if (modifier_chosen_id) {
    const { data: modifier } = await supabase
      .from("modifier_definitions")
      .select("*")
      .eq("id", modifier_chosen_id)
      .single();

    if (modifier) {
      chosenModifier = modifier;
      newModifiers.push({
        modifier_id: modifier.id,
        name: modifier.name,
        base_effect: modifier.base_effect,
        attuned_effect: modifier.attuned_effect,
        applied_at_tier: targetTier,
      });

      if (modifier.grants_keyword) {
        newModifierKeywords.push(modifier.grants_keyword);
      }

      instabilityAdjustment = modifier.instability_adjustment || 0;
    }
  }

  // 4. Calculate stat bonuses
  const statBonuses: Record<string, { attack: number; health: number }> = {
    UNCOMMON: { attack: 1, health: 1 },
    RARE: { attack: 1, health: 2 },
    EPIC: { attack: 2, health: 2 },
    LEGENDARY: { attack: 2, health: 3 },
  };

  const bonus = statBonuses[targetTier] || { attack: 0, health: 0 };
  const newAttack = (card.current_attack || 0) + bonus.attack;
  const newHealth = (card.current_health || 0) + bonus.health;

  // Instability changes per tier
  const instabilityBonuses: Record<string, number> = {
    UNCOMMON: 0,
    RARE: 1,
    EPIC: 1,
    LEGENDARY: 1,
  };

  const newInstability = Math.min(
    20,
    Math.max(0, card.instability_value + (instabilityBonuses[targetTier] || 0) + instabilityAdjustment)
  );

  // 5. Build evolution history entry
  const evolutionEntry = {
    evolution_id,
    from_tier: currentTier,
    to_tier: targetTier,
    modifier_id: modifier_chosen_id || null,
    modifier_name: chosenModifier?.name || null,
    stat_changes: { attack: bonus.attack, health: bonus.health },
    instability_change: (instabilityBonuses[targetTier] || 0) + instabilityAdjustment,
    art_url: newArtUrl,
    name_before: card.current_name,
    name_after: name_chosen,
    evolved_at: new Date().toISOString(),
  };

  const newHistory = [...(card.evolution_history || []), evolutionEntry];
  const newArtPromptHistory = [...(card.art_prompt_history || [])];
  if (imageJob?.input_data?.prompt) {
    newArtPromptHistory.push(imageJob.input_data.prompt);
  }

  // 6. Update card instance
  const { data: updatedCard, error: updateError } = await supabase
    .from("card_instances")
    .update({
      tier: targetTier,
      current_name: name_chosen,
      current_attack: newAttack,
      current_health: newHealth,
      instability_value: newInstability,
      modifier_keywords: newModifierKeywords,
      modifiers: newModifiers,
      evolution_history: newHistory,
      art_url: newArtUrl,
      flavor_text: newFlavorText,
      art_prompt_history: newArtPromptHistory,
      last_evolved_at: new Date().toISOString(),
    })
    .eq("id", card_instance_id)
    .eq("owner_id", auth.playerId)
    .select()
    .single();

  if (updateError) {
    console.error("complete-evolution update error:", updateError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to update card", 500);
  }

  // 7. Update player stats atomically (single read, then single write)
  const { data: currentPlayer } = await supabase
    .from("players")
    .select("cards_evolved_total, highest_tier_reached")
    .eq("id", auth.playerId)
    .single();

  if (currentPlayer) {
    await supabase
      .from("players")
      .update({
        cards_evolved_total: (currentPlayer.cards_evolved_total || 0) + 1,
        highest_tier_reached: getHighestTier(
          currentPlayer.highest_tier_reached || "COMMON",
          targetTier
        ),
      })
      .eq("id", auth.playerId);
  }

  // 8. Trigger achievement evaluation asynchronously
  // Call the evaluate-achievements function via Supabase
  const functionUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (functionUrl && serviceKey) {
    fetch(`${functionUrl}/functions/v1/evaluate-achievements`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player_id: auth.playerId,
        trigger: "EVOLUTION",
        evolution_tier: targetTier,
      }),
    }).catch((err) => console.error("Achievement eval trigger error:", err));
  }

  return new Response(
    JSON.stringify({ data: { card: updatedCard } }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

const TIER_ORDER: Record<string, number> = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
};

function getHighestTier(current: string, candidate: string): string {
  return (TIER_ORDER[candidate] || 0) > (TIER_ORDER[current] || 0) ? candidate : current;
}

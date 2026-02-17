// start-evolution/index.ts — POST /evolution/start
// Initiate evolution ceremony for a card instance.
// Validates: energy threshold met, shard available, card eligible.
// Deducts shard. Creates generation jobs for art + text. Returns evolution data.
// Request: { card_instance_id: string, prompt_modifiers?: string, channel_direction?: string }
// Response: { data: { evolution_id, target_tier, modifier_options, stat_changes, job_ids } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";
import {
  NEXT_TIER,
  EVOLUTION_ENERGY_THRESHOLDS,
  CUMULATIVE_ENERGY,
  EVOLUTION_SHARD_TIER,
  SHARD_COLUMN,
  EvolutionTier,
  ShardTier,
} from "../_shared/types.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { card_instance_id, prompt_modifiers, channel_direction } = body;

  if (!card_instance_id) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "card_instance_id is required");
  }

  const supabase = createServiceClient();

  // 1. Fetch card instance + template
  const { data: card, error: cardError } = await supabase
    .from("card_instances")
    .select(`
      *,
      card_templates (
        id, name, card_type, faction_id, base_attack, base_health,
        base_instability, mana_cost, base_keywords, art_prompt, art_url,
        factions:faction_id ( short_name, art_prompt_prefix )
      )
    `)
    .eq("id", card_instance_id)
    .eq("owner_id", auth.playerId)
    .single();

  if (cardError || !card) {
    return errorResponse(ErrorCode.CARD_NOT_FOUND, "Card not found or not owned", 404);
  }

  // 2. Check if card can evolve
  const currentTier = card.tier as EvolutionTier;
  const targetTier = NEXT_TIER[currentTier];

  if (!targetTier) {
    return errorResponse(ErrorCode.EVOLUTION_ALREADY_MAX, "Card is already at maximum tier (LEGENDARY)");
  }

  // 3. Check energy threshold
  const requiredEnergy = EVOLUTION_ENERGY_THRESHOLDS[targetTier];
  // For tiers beyond the first, we need cumulative minus what was spent at previous tiers
  // chaos_energy tracks total accumulated, and the threshold is the energy needed for THIS step
  // Energy thresholds: UNCOMMON=15, RARE=30, EPIC=50, LEGENDARY=75
  // The card's chaos_energy is cumulative; check if it meets the cumulative threshold for target tier
  const cumulativeRequired = CUMULATIVE_ENERGY[targetTier];

  if (card.chaos_energy < cumulativeRequired) {
    return errorResponse(
      ErrorCode.EVOLUTION_ENERGY_INSUFFICIENT,
      `Insufficient Chaos Energy. Need ${cumulativeRequired} total, have ${card.chaos_energy}`
    );
  }

  // 4. Check shard availability
  const shardTier = EVOLUTION_SHARD_TIER[targetTier] as ShardTier;
  const shardColumn = SHARD_COLUMN[shardTier];

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select(`id, ${shardColumn}, subscription_tier`)
    .eq("id", auth.playerId)
    .single();

  if (playerError || !player) {
    return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player not found", 404);
  }

  const shardCount = (player as any)[shardColumn] as number;
  if (shardCount < 1) {
    return errorResponse(
      ErrorCode.EVOLUTION_SHARD_MISSING,
      `Missing ${shardTier} Shard for evolution to ${targetTier}`
    );
  }

  // 5. Deduct shard atomically
  const { error: deductError } = await supabase.rpc("add_shards", {
    p_player_id: auth.playerId,
    p_shard_tier: shardTier,
    p_amount: -1,
    p_source: "EVOLUTION_CONSUMED",
    p_reference_id: card_instance_id,
  });

  if (deductError) {
    console.error("start-evolution shard deduct error:", deductError);
    return errorResponse(ErrorCode.EVOLUTION_SHARD_MISSING, "Failed to deduct shard");
  }

  // 6. Generate modifier options (select from modifier_definitions pool)
  // 70/30 rule: 70% chance of stat modifier, 30% chance of keyword modifier
  // S-11: Validate faction_id is a valid UUID before interpolation
  const factionId = card.card_templates.faction_id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(factionId)) {
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Invalid faction ID in card template", 500);
  }
  const { data: modifiers, error: modError } = await supabase
    .from("modifier_definitions")
    .select("*")
    .or(`pool_type.eq.UNIVERSAL,faction_id.eq.${factionId}`)
    .limit(20);

  // Select 2-4 modifier options based on subscription tier
  const numOptions = player.subscription_tier === "HIGH" ? 4 :
                     player.subscription_tier === "MID" ? 3 : 2;

  const shuffledModifiers = (modifiers || []).sort(() => Math.random() - 0.5);
  const modifierOptions = shuffledModifiers.slice(0, numOptions);

  // 7. Calculate stat changes for the evolution step
  const statChanges = calculateStatChanges(currentTier, targetTier, card);

  // 8. Create generation jobs for AI art + text
  const evolutionId = crypto.randomUUID();

  const factionPrefix = card.card_templates?.factions?.art_prompt_prefix || "";
  const artPrompt = [
    factionPrefix,
    card.card_templates.art_prompt,
    `Evolution stage: ${targetTier.toLowerCase()}, more powerful and ornate`,
    prompt_modifiers || "",
  ].filter(Boolean).join(". ");

  const { data: imageJob, error: imgJobError } = await supabase
    .from("generation_jobs")
    .insert({
      job_type: "EVOLUTION_IMAGE",
      status: "PENDING",
      priority: 10,
      player_id: auth.playerId,
      card_instance_id,
      input_data: {
        evolution_id: evolutionId,
        prompt: artPrompt,
        source_art_url: card.art_url,
        target_tier: targetTier,
        channel_direction: channel_direction || "enhance",
      },
    })
    .select("id")
    .single();

  const { data: textJob, error: txtJobError } = await supabase
    .from("generation_jobs")
    .insert({
      job_type: "EVOLUTION_TEXT",
      status: "PENDING",
      priority: 10,
      player_id: auth.playerId,
      card_instance_id,
      input_data: {
        evolution_id: evolutionId,
        current_name: card.current_name,
        current_tier: currentTier,
        target_tier: targetTier,
        card_type: card.card_templates.card_type,
        faction_short_name: card.card_templates?.factions?.short_name,
        flavor_text: card.flavor_text,
      },
    })
    .select("id")
    .single();

  if (imgJobError || txtJobError) {
    console.error("Generation job creation error:", imgJobError, txtJobError);
    // Refund the shard on failure
    await supabase.rpc("add_shards", {
      p_player_id: auth.playerId,
      p_shard_tier: shardTier,
      p_amount: 1,
      p_source: "REFUND",
      p_reference_id: `evolution_${evolutionId}_failed`,
    });
    return errorResponse(ErrorCode.EVOLUTION_GENERATION_FAILED, "Failed to start AI generation");
  }

  // 9. Fire-and-forget: invoke generation Edge Functions to process the PENDING jobs.
  // Uses the same pattern as complete-evolution's achievement trigger.
  const functionUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (functionUrl && serviceKey) {
    const headers = {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    // Fire evolution art generation
    if (imageJob?.id) {
      fetch(`${functionUrl}/functions/v1/generate-evolution-art`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          job_id: imageJob.id,
          card_instance_id,
          player_id: auth.playerId,
          faction_id: factionId,
          rarity: currentTier.toLowerCase(),
          art_url: card.art_url,
          evolution_outcome: "STANDARD",
          selected_modifier_id: "pending",
          from_tier: currentTier,
          shard_quality: "PLANAR",
          evolution_history: card.evolution_history || [],
          evolution_number: (card.evolution_history || []).length + 1,
        }),
      }).catch((err) => console.error("Evolution art trigger error:", err));
    }

    // Fire evolution text generation (name candidates)
    if (textJob?.id) {
      const previousNames = (card.evolution_history || [])
        .map((e: any) => e.name_after)
        .filter(Boolean);
      fetch(`${functionUrl}/functions/v1/generate-card-text`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "name",
          job_id: textJob.id,
          naming: {
            factionId,
            templateBaseName: card.current_name,
            toTier: targetTier,
            evolutionOutcome: "STANDARD",
            evolutionHistory: card.evolution_history || [],
            previousNames: [card.current_name, ...previousNames],
          },
        }),
      }).catch((err) => console.error("Evolution text trigger error:", err));
    }
  }

  return new Response(
    JSON.stringify({
      data: {
        evolution_id: evolutionId,
        target_tier: targetTier,
        card_instance_id,
        modifier_options: modifierOptions,
        stat_changes: statChanges,
        image_job_id: imageJob?.id,
        text_job_id: textJob?.id,
      },
    }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

/**
 * Calculate stat changes for an evolution step.
 * Stats scale based on tier progression.
 */
function calculateStatChanges(
  currentTier: EvolutionTier,
  targetTier: EvolutionTier,
  card: any
): { attack_bonus: number; health_bonus: number; instability_change: number } {
  // Base stat bonuses per evolution step
  const statBonuses: Record<string, { attack: number; health: number; instability: number }> = {
    UNCOMMON: { attack: 1, health: 1, instability: 0 },
    RARE: { attack: 1, health: 2, instability: 1 },
    EPIC: { attack: 2, health: 2, instability: 1 },
    LEGENDARY: { attack: 2, health: 3, instability: 1 },
  };

  const bonus = statBonuses[targetTier] || { attack: 0, health: 0, instability: 0 };

  return {
    attack_bonus: bonus.attack,
    health_bonus: bonus.health,
    instability_change: bonus.instability,
  };
}

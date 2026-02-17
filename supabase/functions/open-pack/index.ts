// open-pack/index.ts — POST /economy/purchase/card-pack
// Opens a card pack. Deducts 100 Dust (own faction) or 150 (other faction).
// Generates 3 random Common card instances from the faction's templates.
// Request: { faction_id: string }
// Response: { data: { cards: CardInstance[], dust_spent: number } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, corsHeaders, ErrorCode } from "../_shared/errors.ts";

const OWN_FACTION_COST = 100;
const OTHER_FACTION_COST = 150;
const CARDS_PER_PACK = 3;

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { faction_id } = body;

  if (!faction_id) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "faction_id is required");
  }

  const supabase = createServiceClient();

  // Get player data
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, chaos_dust, primary_faction_id, unlocked_faction_ids")
    .eq("id", auth.playerId)
    .single();

  if (playerError || !player) {
    return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player not found", 404);
  }

  // Determine cost
  const isOwnFaction = player.primary_faction_id === faction_id;
  const isUnlocked = (player.unlocked_faction_ids || []).includes(faction_id);
  const cost = (isOwnFaction || isUnlocked) ? OWN_FACTION_COST : OTHER_FACTION_COST;

  // Check dust
  if (player.chaos_dust < cost) {
    return errorResponse(
      ErrorCode.INSUFFICIENT_DUST,
      `Insufficient Chaos Dust. Need ${cost}, have ${player.chaos_dust}`
    );
  }

  // Get all approved Common templates for this faction
  const { data: templates, error: templateError } = await supabase
    .from("card_templates")
    .select("*")
    .eq("faction_id", faction_id)
    .not("approved_at", "is", null);

  if (templateError || !templates || templates.length === 0) {
    return errorResponse(ErrorCode.INTERNAL_ERROR, "No approved card templates for this faction", 500);
  }

  // Get owned templates for duplicate protection
  const { data: ownedCards } = await supabase
    .from("card_instances")
    .select("template_id")
    .eq("owner_id", auth.playerId);

  const ownedTemplateCounts = new Map<string, number>();
  (ownedCards || []).forEach((c: any) => {
    ownedTemplateCounts.set(c.template_id, (ownedTemplateCounts.get(c.template_id) || 0) + 1);
  });

  // Select 3 random templates with duplicate protection:
  // 3rd+ copy of owned Common rerolls
  const selectedTemplates: any[] = [];
  const shuffled = [...templates].sort(() => Math.random() - 0.5);

  for (const template of shuffled) {
    if (selectedTemplates.length >= CARDS_PER_PACK) break;
    const ownedCount = ownedTemplateCounts.get(template.id) || 0;
    // Prefer templates player owns < 2 of (or at all)
    if (ownedCount < 2) {
      selectedTemplates.push(template);
    }
  }

  // If not enough after filtering, fill with any remaining templates
  if (selectedTemplates.length < CARDS_PER_PACK) {
    for (const template of shuffled) {
      if (selectedTemplates.length >= CARDS_PER_PACK) break;
      if (!selectedTemplates.some((t) => t.id === template.id)) {
        selectedTemplates.push(template);
      }
    }
  }

  // Deduct dust atomically via RPC (handles both balance update and transaction log)
  const { data: newBalance, error: dustError } = await supabase.rpc("add_chaos_dust", {
    p_player_id: auth.playerId,
    p_amount: -cost,
    p_source: "CARD_PACK",
    p_reference_id: faction_id,
  });

  if (dustError || newBalance === null || newBalance === undefined) {
    return errorResponse(ErrorCode.INSUFFICIENT_DUST, "Insufficient Chaos Dust (concurrent modification)");
  }

  // The add_chaos_dust RPC enforces the CHECK (chaos_dust >= 0) constraint on
  // the players table, so if the balance would go negative the UPDATE fails.
  if (newBalance < 0) {
    // Shouldn't reach here due to CHECK constraint, but guard defensively
    await supabase.rpc("add_chaos_dust", {
      p_player_id: auth.playerId,
      p_amount: cost,
      p_source: "REFUND",
      p_reference_id: "CARD_PACK_NEGATIVE_GUARD",
    });
    return errorResponse(ErrorCode.INSUFFICIENT_DUST, "Insufficient Chaos Dust");
  }

  // If this is an other-faction unlock, add to unlocked_faction_ids
  if (!isOwnFaction && !isUnlocked) {
    const updatedFactions = [...(player.unlocked_faction_ids || []), faction_id];
    await supabase
      .from("players")
      .update({ unlocked_faction_ids: updatedFactions })
      .eq("id", auth.playerId);
  }

  // Create card instances
  const newCards = selectedTemplates.map((t) => ({
    template_id: t.id,
    owner_id: auth.playerId,
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

  const { data: createdCards, error: createError } = await supabase
    .from("card_instances")
    .insert(newCards)
    .select();

  if (createError) {
    console.error("open-pack card creation error:", createError);
    // Refund dust on failure
    await supabase.rpc("add_chaos_dust", {
      p_player_id: auth.playerId,
      p_amount: cost,
      p_source: "REFUND",
      p_reference_id: "CARD_PACK_FAILED",
    });
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to create cards", 500);
  }

  return new Response(
    JSON.stringify({ data: { cards: createdCards, dust_spent: cost } }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

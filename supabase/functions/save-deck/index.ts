// save-deck/index.ts — POST /decks (create) or PUT /decks/{id} (update)
// Creates or updates a deck. Validates all rules per REQ-035 and REQ-164.
// Slot limits by subscription tier: Free=4, Mid=6, High=8.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, corsHeaders, ErrorCode } from "../_shared/errors.ts";
import { validateDeck } from "../_shared/deck-validator.ts";
import { MAX_DECK_SLOTS, DeckEntry, SubscriptionTier } from "../_shared/types.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST" && req.method !== "PUT") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const supabase = createServiceClient();
  const body = await req.json();

  const url = new URL(req.url);
  const deckId = url.searchParams.get("id"); // For PUT updates

  // Get player for subscription tier check
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, subscription_tier, max_deck_slots")
    .eq("id", auth.playerId)
    .single();

  if (playerError || !player) {
    return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player not found", 404);
  }

  // ── CREATE (POST) ──
  if (req.method === "POST" && !deckId) {
    const { name, faction_id, avatar_id } = body;

    if (!name || !faction_id || !avatar_id) {
      return errorResponse(ErrorCode.INVALID_REQUEST, "name, faction_id, and avatar_id are required");
    }

    // Check slot limit
    const { count, error: countError } = await supabase
      .from("decks")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", auth.playerId);

    if (countError) {
      return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to count decks", 500);
    }

    const maxSlots = MAX_DECK_SLOTS[player.subscription_tier as SubscriptionTier] || player.max_deck_slots;
    if ((count || 0) >= maxSlots) {
      return errorResponse(
        ErrorCode.DECK_SLOT_LIMIT,
        `Deck slot limit reached (${maxSlots} for ${player.subscription_tier} tier)`
      );
    }

    const { data: deck, error: createError } = await supabase
      .from("decks")
      .insert({
        owner_id: auth.playerId,
        name,
        faction_id,
        avatar_id,
        card_entries: [],
        is_valid: false,
        validation_errors: ["Deck is empty"],
      })
      .select()
      .single();

    if (createError) {
      console.error("save-deck create error:", createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to create deck", 500);
    }

    return new Response(
      JSON.stringify({ data: { deck } }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── UPDATE (PUT with id) ──
  if (!deckId) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Deck id parameter required for updates");
  }

  // Verify deck ownership
  const { data: existingDeck, error: fetchError } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .eq("owner_id", auth.playerId)
    .single();

  if (fetchError || !existingDeck) {
    return errorResponse(ErrorCode.DECK_NOT_FOUND, "Deck not found or not owned", 404);
  }

  // Build update payload
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.avatar_id !== undefined) updates.avatar_id = body.avatar_id;

  // If card_entries are provided, validate the full deck
  const cardEntries: DeckEntry[] = body.card_entries ?? existingDeck.card_entries;
  const avatarId = body.avatar_id ?? existingDeck.avatar_id;
  const factionId = existingDeck.faction_id; // Faction cannot change

  if (body.card_entries !== undefined) {
    updates.card_entries = body.card_entries;

    const validation = await validateDeck(
      supabase,
      auth.playerId,
      factionId,
      avatarId,
      cardEntries
    );

    updates.is_valid = validation.valid;
    updates.validation_errors = validation.errors;
  }

  const { data: updatedDeck, error: updateError } = await supabase
    .from("decks")
    .update(updates)
    .eq("id", deckId)
    .select()
    .single();

  if (updateError) {
    console.error("save-deck update error:", updateError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to update deck", 500);
  }

  return new Response(
    JSON.stringify({
      data: {
        deck: updatedDeck,
        validation_errors: updatedDeck.validation_errors || [],
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

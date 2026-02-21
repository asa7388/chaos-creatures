// _shared/deck-validator.ts — Deck validation logic
// Used by both save-deck and validate-deck functions.
// Rules per REQ-164: exactly 30 cards, single faction, max 2 copies per template,
// max 2 Legendaries, exactly 1 avatar matching faction.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  DECK_SIZE,
  MAX_COPIES_PER_TEMPLATE,
  MAX_LEGENDARIES,
  DeckEntry,
} from "./types.ts";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a deck configuration against all game rules.
 * Returns a list of human-readable error strings (empty = valid).
 */
export async function validateDeck(
  supabase: SupabaseClient,
  playerId: string,
  factionId: string,
  avatarId: string,
  cardEntries: DeckEntry[]
): Promise<ValidationResult> {
  const errors: string[] = [];

  // 1. Count total cards
  const totalCards = cardEntries.reduce((sum, e) => sum + e.quantity, 0);
  if (totalCards !== DECK_SIZE) {
    errors.push(`Deck must contain exactly ${DECK_SIZE} cards (has ${totalCards})`);
  }

  // 2. Validate avatar exists and matches faction
  const { data: avatar, error: avatarError } = await supabase
    .from("avatars")
    .select("id, faction_id")
    .eq("id", avatarId)
    .single();

  if (avatarError || !avatar) {
    errors.push("Avatar not found");
  } else if (avatar.faction_id !== factionId) {
    errors.push("Avatar faction does not match deck faction");
  }

  // 3. Validate all card instances exist and are owned by player
  const cardInstanceIds = cardEntries.map((e) => e.card_instance_id);

  if (cardInstanceIds.length === 0 && totalCards !== 0) {
    errors.push("Card entries cannot be empty when cards are expected");
    return { valid: false, errors };
  }

  const { data: cards, error: cardsError } = await supabase
    .from("card_instances")
    .select(`
      id,
      template_id,
      tier,
      owner_id,
      card_templates!inner ( faction_id )
    `)
    .in("id", cardInstanceIds);

  if (cardsError) {
    errors.push("Failed to verify card ownership");
    return { valid: false, errors };
  }

  const cardMap = new Map(
    (cards || []).map((c: any) => [c.id, c])
  );

  // Check each entry
  const templateCounts = new Map<string, number>();
  let legendaryCount = 0;

  for (const entry of cardEntries) {
    const card: any = cardMap.get(entry.card_instance_id);

    if (!card) {
      errors.push(`Card ${entry.card_instance_id} not found or not owned`);
      continue;
    }

    // Ownership check
    if (card.owner_id !== playerId) {
      errors.push(`Card ${entry.card_instance_id} is not owned by this player`);
      continue;
    }

    // Faction check — all cards must match deck faction
    if (card.card_templates?.faction_id !== factionId) {
      errors.push(`Card ${card.id} belongs to a different faction`);
    }

    // Template copy count
    const currentTemplateCount = (templateCounts.get(card.template_id) || 0) + entry.quantity;
    templateCounts.set(card.template_id, currentTemplateCount);
    if (currentTemplateCount > MAX_COPIES_PER_TEMPLATE) {
      errors.push(`Template ${card.template_id} exceeds max ${MAX_COPIES_PER_TEMPLATE} copies (has ${currentTemplateCount})`);
    }

    // Legendary count
    if (card.tier === "LEGENDARY") {
      legendaryCount += entry.quantity;
    }

    // Quantity must be positive
    if (entry.quantity < 1 || entry.quantity > MAX_COPIES_PER_TEMPLATE) {
      errors.push(`Card ${entry.card_instance_id} has invalid quantity: ${entry.quantity}`);
    }
  }

  // 4. Max legendaries check
  if (legendaryCount > MAX_LEGENDARIES) {
    errors.push(`Deck has ${legendaryCount} Legendary cards (max ${MAX_LEGENDARIES})`);
  }

  return { valid: errors.length === 0, errors };
}

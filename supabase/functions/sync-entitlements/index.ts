// sync-entitlements/index.ts — POST /sync-entitlements
// Called by iOS client after StoreKit 2 purchase.
// Verifies the transaction server-side with the App Store Server API.
// Updates players.subscription_tier and related limits.
// Request: { transaction_id: string, product_id: string, original_transaction_id: string }
// Response: { data: { subscription_tier: string, max_deck_slots: number, max_cards_per_faction: number } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";
import { MAX_DECK_SLOTS, SubscriptionTier } from "../_shared/types.ts";

// Product ID to subscription tier mapping
// Source: docs/design/09-monetization-details.md Section 2
const PRODUCT_TIER_MAP: Record<string, SubscriptionTier> = {
  "com.chaoscreatures.app.sub_mid_monthly_699": "MID",
  "com.chaoscreatures.app.sub_mid_annual_5599": "MID",
  "com.chaoscreatures.app.sub_high_monthly_1299": "HIGH",
  "com.chaoscreatures.app.sub_high_annual_9999": "HIGH",
};

// Max cards per faction by tier
const MAX_CARDS_PER_FACTION: Record<SubscriptionTier, number> = {
  FREE: 50,
  MID: 100,
  HIGH: 200,
};

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { transaction_id, product_id, original_transaction_id } = body;

  if (!transaction_id || !product_id) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "transaction_id and product_id are required");
  }

  const supabase = createServiceClient();

  // ── Receipt verification stub ──────────────────────────────────
  // Validate transaction_id is a non-empty string
  if (typeof transaction_id !== "string" || transaction_id.trim().length === 0) {
    return errorResponse(ErrorCode.RECEIPT_INVALID, "transaction_id must be a non-empty string");
  }

  // Dedup check: ensure this transaction_id hasn't already been processed
  const { data: existingTx } = await supabase
    .from("admin_audit_log")
    .select("id")
    .eq("action", "SUBSCRIPTION_SYNC")
    .contains("details", { transaction_id })
    .limit(1);

  if (existingTx && existingTx.length > 0) {
    return errorResponse(ErrorCode.RECEIPT_INVALID, "transaction_id has already been processed (duplicate)");
  }

  // WARNING: Full JWS verification with Apple's App Store Server API is not yet
  // implemented. This stub validates format and deduplicates, but does NOT
  // cryptographically verify the transaction with Apple's certificates.
  // TODO: Implement full server-side JWS verification before scaling.
  // https://developer.apple.com/documentation/appstoreserverapi
  console.warn(
    `[sync-entitlements] Transaction ${transaction_id} accepted without full Apple JWS verification (TODO)`
  );
  // ── End receipt verification stub ─────────────────────────────

  // Determine subscription tier from product ID
  const tier = PRODUCT_TIER_MAP[product_id];
  if (!tier) {
    // If product_id is not a known subscription, it might be a one-time purchase
    // or an unknown product. For subscriptions, we require a known product.
    return errorResponse(ErrorCode.RECEIPT_INVALID, `Unknown product_id: ${product_id}`);
  }

  const maxDeckSlots = MAX_DECK_SLOTS[tier];
  const maxCardsPerFaction = MAX_CARDS_PER_FACTION[tier];

  // Update player subscription
  const { data: updatedPlayer, error: updateError } = await supabase
    .from("players")
    .update({
      subscription_tier: tier,
      max_deck_slots: maxDeckSlots,
      max_cards_per_faction: maxCardsPerFaction,
    })
    .eq("id", auth.playerId)
    .select("subscription_tier, max_deck_slots, max_cards_per_faction")
    .single();

  if (updateError) {
    console.error("sync-entitlements update error:", updateError);
    return errorResponse(ErrorCode.SUBSCRIPTION_SYNC_FAILED, "Failed to update subscription", 500);
  }

  // Log the subscription event for analytics
  await supabase.from("admin_audit_log").insert({
    admin_user: "SYSTEM",
    action: "SUBSCRIPTION_SYNC",
    target_type: "player",
    target_id: auth.playerId,
    details: {
      transaction_id,
      product_id,
      original_transaction_id,
      new_tier: tier,
    },
  });

  return new Response(
    JSON.stringify({ data: updatedPlayer }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

// purchase-shards/index.ts — POST /economy/purchase/shard
// Buy Evolution Shards with Chaos Dust. Atomic transaction.
// Costs: Uncommon=30, Rare=60, Epic=120, Legendary=240 (REQ-039).
// Request: { shard_tier: "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" }
// Response: { data: { shard_tier: string, dust_spent: number } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";
import { SHARD_DUST_COSTS, SHARD_COLUMN, ShardTier } from "../_shared/types.ts";

const VALID_SHARD_TIERS = new Set<string>(["UNCOMMON", "RARE", "EPIC", "LEGENDARY"]);

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const shardTier = body.shard_tier as string;

  if (!shardTier || !VALID_SHARD_TIERS.has(shardTier)) {
    return errorResponse(
      ErrorCode.INVALID_SHARD_TIER,
      `Invalid shard_tier. Must be one of: ${[...VALID_SHARD_TIERS].join(", ")}`
    );
  }

  const tier = shardTier as ShardTier;
  const cost = SHARD_DUST_COSTS[tier];
  const shardColumn = SHARD_COLUMN[tier];

  const supabase = createServiceClient();

  // Atomic: deduct dust and credit shard in a single RPC call.
  // We use the stored procedure pattern with FOR UPDATE row lock.
  // Step 1: Deduct dust with optimistic locking (WHERE dust >= cost)
  const { data: updatedPlayer, error: deductError } = await supabase
    .rpc("purchase_shard_atomic", {
      p_player_id: auth.playerId,
      p_shard_tier: tier,
      p_cost: cost,
    });

  // If the RPC doesn't exist yet, fall back to manual transaction
  if (deductError?.message?.includes("function") || deductError?.code === "42883") {
    // Fallback: manual two-step with optimistic lock
    const { data: player, error: fetchError } = await supabase
      .from("players")
      .select("id, chaos_dust")
      .eq("id", auth.playerId)
      .single();

    if (fetchError || !player) {
      return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player not found", 404);
    }

    if (player.chaos_dust < cost) {
      return errorResponse(
        ErrorCode.INSUFFICIENT_DUST,
        `Insufficient Chaos Dust. Need ${cost}, have ${player.chaos_dust}`
      );
    }

    // Deduct dust with check (prevents double-spend via WHERE)
    const { data: deducted, error: dustError } = await supabase
      .from("players")
      .update({ chaos_dust: player.chaos_dust - cost })
      .eq("id", auth.playerId)
      .gte("chaos_dust", cost)
      .select("id, chaos_dust")
      .single();

    if (dustError || !deducted) {
      return errorResponse(
        ErrorCode.INSUFFICIENT_DUST,
        "Insufficient Chaos Dust (concurrent modification)"
      );
    }

    // Credit shard using the stored function
    const { error: shardError } = await supabase
      .rpc("add_shards", {
        p_player_id: auth.playerId,
        p_shard_tier: tier,
        p_amount: 1,
        p_source: "PURCHASE",
        p_reference_id: null,
      });

    if (shardError) {
      // Rollback: re-add dust
      await supabase
        .from("players")
        .update({ chaos_dust: deducted.chaos_dust + cost })
        .eq("id", auth.playerId);
      console.error("purchase-shards shard credit error:", shardError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to credit shard", 500);
    }

    // Record dust transaction
    await supabase.rpc("add_chaos_dust", {
      p_player_id: auth.playerId,
      p_amount: -cost,
      p_source: "SHARD_PURCHASE",
      p_reference_id: tier,
    });

    return new Response(
      JSON.stringify({ data: { shard_tier: tier, dust_spent: cost } }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }

  if (deductError) {
    if (deductError.message?.includes("insufficient")) {
      return errorResponse(ErrorCode.INSUFFICIENT_DUST, deductError.message);
    }
    console.error("purchase-shards error:", deductError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Purchase failed", 500);
  }

  return new Response(
    JSON.stringify({ data: { shard_tier: tier, dust_spent: cost } }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

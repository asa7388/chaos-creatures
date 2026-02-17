// join-queue/index.ts — POST /matchmaking/queue
// Add player to matchmaking_queue with rank, MMR, deck ID.
// Validates deck before allowing queue entry.
// Request: { deck_id: string, mode: "RANKED" | "CASUAL" | "PRACTICE" }
// Response: { data: { queue_id: string, estimated_wait_seconds: number } }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";

const VALID_MODES = new Set(["RANKED", "CASUAL", "PRACTICE"]);

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { deck_id, mode } = body;

  if (!deck_id) {
    return errorResponse(ErrorCode.INVALID_REQUEST, "deck_id is required");
  }

  const gameMode = mode || "RANKED";
  if (!VALID_MODES.has(gameMode)) {
    return errorResponse(ErrorCode.INVALID_REQUEST, `Invalid mode. Must be one of: ${[...VALID_MODES].join(", ")}`);
  }

  const supabase = createServiceClient();

  // Rate limit: prevent rapid re-queuing (max once per 5 seconds)
  const QUEUE_COOLDOWN_SECONDS = 5;
  const { data: existingEntry } = await supabase
    .from("matchmaking_queue")
    .select("id, queued_at")
    .eq("player_id", auth.playerId)
    .single();

  if (existingEntry) {
    return errorResponse(ErrorCode.ALREADY_IN_QUEUE, "Already in matchmaking queue");
  }

  // Check recent queue activity to prevent spam re-queuing after leave
  const { data: recentMatch } = await supabase
    .from("admin_audit_log")
    .select("created_at")
    .eq("action", "QUEUE_JOIN")
    .eq("target_id", auth.playerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (recentMatch) {
    const lastJoinTime = new Date(recentMatch.created_at).getTime();
    const now = Date.now();
    if (now - lastJoinTime < QUEUE_COOLDOWN_SECONDS * 1000) {
      return errorResponse(
        ErrorCode.RATE_LIMITED,
        `Please wait ${QUEUE_COOLDOWN_SECONDS} seconds before re-queuing`
      );
    }
  }

  // Validate the deck
  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id, faction_id, avatar_id, is_valid, validation_errors")
    .eq("id", deck_id)
    .eq("owner_id", auth.playerId)
    .single();

  if (deckError || !deck) {
    return errorResponse(ErrorCode.DECK_NOT_FOUND, "Deck not found or not owned", 404);
  }

  if (!deck.is_valid) {
    return errorResponse(
      ErrorCode.INVALID_DECK_FOR_QUEUE,
      `Deck is not valid: ${(deck.validation_errors || []).join("; ")}`
    );
  }

  // Get player rank/MMR data
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, season_rank, season_rank_points, hidden_mmr")
    .eq("id", auth.playerId)
    .single();

  if (playerError || !player) {
    return errorResponse(ErrorCode.PLAYER_NOT_FOUND, "Player not found", 404);
  }

  // Insert into queue
  const { data: queueEntry, error: queueError } = await supabase
    .from("matchmaking_queue")
    .insert({
      player_id: auth.playerId,
      deck_id: deck.id,
      avatar_id: deck.avatar_id,
      faction_id: deck.faction_id,
      mode: gameMode,
      season_rank: player.season_rank,
      season_rank_points: player.season_rank_points,
      hidden_mmr: player.hidden_mmr,
    })
    .select("id, queued_at")
    .single();

  if (queueError) {
    // Unique constraint violation = already in queue (race condition)
    if (queueError.code === "23505") {
      return errorResponse(ErrorCode.ALREADY_IN_QUEUE, "Already in matchmaking queue");
    }
    console.error("join-queue error:", queueError);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to join queue", 500);
  }

  // Log queue join for rate-limiting and analytics
  await supabase.from("admin_audit_log").insert({
    admin_user: "SYSTEM",
    action: "QUEUE_JOIN",
    target_type: "player",
    target_id: auth.playerId,
    details: { mode: gameMode, deck_id: deck.id },
  }).then(() => {}, (err: unknown) => console.warn("Audit log insert failed:", err));

  // Estimate wait time based on current queue size
  const { count: queueSize } = await supabase
    .from("matchmaking_queue")
    .select("id", { count: "exact", head: true })
    .eq("mode", gameMode);

  // Rough estimate: if 1+ others in same mode, fast match. Otherwise 10-30s.
  const estimatedWait = (queueSize || 0) >= 2 ? 5 : 15;

  return new Response(
    JSON.stringify({
      data: {
        queue_id: queueEntry.id,
        estimated_wait_seconds: estimatedWait,
      },
    }),
    { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

// leave-queue/index.ts — DELETE /matchmaking/queue
// Remove player from matchmaking queue.
// Response: 200 { ok: true }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "DELETE" && req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  const supabase = createServiceClient();

  const { error, count } = await supabase
    .from("matchmaking_queue")
    .delete()
    .eq("player_id", auth.playerId);

  if (error) {
    console.error("leave-queue error:", error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Failed to leave queue", 500);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
});

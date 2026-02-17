// check-missed-achievements/index.ts — POST /check-missed-achievements
// Called on login. Idempotent retroactive evaluation (REQ-189).
// Re-checks all achievements against current player stats to catch any
// that might have been missed (e.g., due to server errors).
// This is essentially evaluate-achievements with trigger="LOGIN".

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { getAuthContext, isAuthError } from "../_shared/auth.ts";
import { errorResponse, handleCors, getCorsHeaders, ErrorCode } from "../_shared/errors.ts";

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== "POST") {
    return errorResponse(ErrorCode.INVALID_REQUEST, "Method not allowed", 405);
  }

  const auth = await getAuthContext(req);
  if (isAuthError(auth)) return auth;

  // Delegate to evaluate-achievements with LOGIN trigger
  const functionUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!functionUrl || !serviceKey) {
    return errorResponse(ErrorCode.INTERNAL_ERROR, "Server configuration error", 500);
  }

  const response = await fetch(`${functionUrl}/functions/v1/evaluate-achievements`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      player_id: auth.playerId,
      trigger: "LOGIN",
    }),
  });

  const result = await response.json();

  return new Response(
    JSON.stringify(result),
    { status: response.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
  );
});

// Chaos Creatures Game Server — Protocol
// Message serialization/deserialization with Zod validation
// Supports both envelope-based (legacy raw WS) and direct action parsing
// (Supabase Realtime broadcast).

import { z } from 'zod';
import { ClientActionSchema, type ClientAction, type ServerEvent } from '../types/messages';

/**
 * Parse and validate an incoming client message (legacy envelope format).
 * Used by the old raw WebSocket path.
 * Returns the validated action or throws with details.
 */
export function parseClientMessage(raw: string): {
  action: ClientAction;
  player_id: string;
  match_id: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ProtocolError('INVALID_JSON', 'Message is not valid JSON');
  }

  const envelope = MessageEnvelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    throw new ProtocolError('INVALID_ENVELOPE', `Invalid message envelope: ${envelope.error.message}`);
  }

  const actionResult = ClientActionSchema.safeParse(envelope.data.action);
  if (!actionResult.success) {
    throw new ProtocolError('INVALID_ACTION', `Invalid action: ${actionResult.error.message}`);
  }

  return {
    action: actionResult.data,
    player_id: envelope.data.player_id,
    match_id: envelope.data.match_id,
  };
}

/**
 * Parse and validate an action payload directly (no envelope).
 * Used by the Supabase Realtime handler. The iOS client sends actions
 * as flat objects: { type: "PLAY_CARD", card_id: "..." }
 * The match_id comes from the channel name and player_id from the payload.
 */
export function parseAction(payload: Record<string, unknown>): ClientAction {
  const actionResult = ClientActionSchema.safeParse(payload);
  if (!actionResult.success) {
    throw new ProtocolError('INVALID_ACTION', `Invalid action: ${actionResult.error.message}`);
  }
  return actionResult.data;
}

/**
 * Serialize a server event to a JSON string.
 */
export function serializeServerEvent(event: ServerEvent): string {
  return JSON.stringify(event);
}

/**
 * Serialize a server event with match context for broadcasting.
 */
export function serializeMatchEvent(matchId: string, event: ServerEvent): string {
  return JSON.stringify({
    match_id: matchId,
    event,
  });
}

/** Message envelope schema (wraps the action with auth context) */
const MessageEnvelopeSchema = z.object({
  match_id: z.string(),
  player_id: z.string(),
  action: z.record(z.unknown()),
  timestamp: z.number().optional(),
});

/** Protocol error with a code for the client */
export class ProtocolError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ProtocolError';
  }
}

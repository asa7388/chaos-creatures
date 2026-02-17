// Chaos Creatures Game Server — WebSocket Protocol
// Message serialization/deserialization with Zod validation

import { z } from 'zod';
import { ClientActionSchema, type ClientAction, type ServerEvent } from '../types/messages';

/**
 * Parse and validate an incoming client message.
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

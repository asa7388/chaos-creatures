// Chaos Creatures Game Server — Message Validation Tests
// Tests for Zod schema validation of client actions and protocol parsing

import { describe, it, expect } from 'vitest';
import {
  ClientActionSchema,
  PlayCardActionSchema,
  DeclareAttackersSchema,
  AssignBlockersSchema,
  ChooseEventTargetSchema,
  MulliganSchema,
} from '../src/types/messages';
import { parseClientMessage, ProtocolError } from '../src/ws/protocol';

// ─── Zod Schema Validation ─────────────

describe('ClientActionSchema validation', () => {
  it('should accept valid PLAY_CARD action', () => {
    const result = ClientActionSchema.safeParse({
      type: 'PLAY_CARD',
      card_id: '550e8400-e29b-41d4-a716-446655440000',
      target_slot: 2,
    });
    expect(result.success).toBe(true);
  });

  it('should accept PLAY_CARD without optional fields', () => {
    const result = ClientActionSchema.safeParse({
      type: 'PLAY_CARD',
      card_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject PLAY_CARD with invalid card_id (not UUID)', () => {
    const result = PlayCardActionSchema.safeParse({
      type: 'PLAY_CARD',
      card_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should reject PLAY_CARD with slot out of range', () => {
    const result = PlayCardActionSchema.safeParse({
      type: 'PLAY_CARD',
      card_id: '550e8400-e29b-41d4-a716-446655440000',
      target_slot: 5, // Max is 4
    });
    expect(result.success).toBe(false);
  });

  it('should reject PLAY_CARD with negative slot', () => {
    const result = PlayCardActionSchema.safeParse({
      type: 'PLAY_CARD',
      card_id: '550e8400-e29b-41d4-a716-446655440000',
      target_slot: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid USE_CHAOS_SPARK', () => {
    const result = ClientActionSchema.safeParse({ type: 'USE_CHAOS_SPARK' });
    expect(result.success).toBe(true);
  });

  it('should accept valid END_MAIN_PHASE', () => {
    const result = ClientActionSchema.safeParse({ type: 'END_MAIN_PHASE' });
    expect(result.success).toBe(true);
  });

  it('should accept valid DECLARE_ATTACKERS', () => {
    const result = DeclareAttackersSchema.safeParse({
      type: 'DECLARE_ATTACKERS',
      attacker_ids: ['id1', 'id2'],
    });
    expect(result.success).toBe(true);
  });

  it('should accept DECLARE_ATTACKERS with empty array', () => {
    const result = DeclareAttackersSchema.safeParse({
      type: 'DECLARE_ATTACKERS',
      attacker_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid ASSIGN_BLOCKERS', () => {
    const result = AssignBlockersSchema.safeParse({
      type: 'ASSIGN_BLOCKERS',
      assignments: [
        { blocker_id: 'b1', attacker_id: 'a1' },
        { blocker_id: 'b2', attacker_id: 'a2' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should accept ASSIGN_BLOCKERS with empty assignments', () => {
    const result = AssignBlockersSchema.safeParse({
      type: 'ASSIGN_BLOCKERS',
      assignments: [],
    });
    expect(result.success).toBe(true);
  });

  it('should reject ASSIGN_BLOCKERS with malformed assignment', () => {
    const result = AssignBlockersSchema.safeParse({
      type: 'ASSIGN_BLOCKERS',
      assignments: [{ blocker_id: 'b1' }], // Missing attacker_id
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid CHOOSE_EVENT_TARGET', () => {
    const result = ChooseEventTargetSchema.safeParse({
      type: 'CHOOSE_EVENT_TARGET',
      creature_id: 'creature-123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid SURRENDER', () => {
    const result = ClientActionSchema.safeParse({ type: 'SURRENDER' });
    expect(result.success).toBe(true);
  });

  it('should accept valid MULLIGAN', () => {
    const result = MulliganSchema.safeParse({
      type: 'MULLIGAN',
      keep: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject MULLIGAN without keep field', () => {
    const result = MulliganSchema.safeParse({
      type: 'MULLIGAN',
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid RECONNECT', () => {
    const result = ClientActionSchema.safeParse({ type: 'RECONNECT' });
    expect(result.success).toBe(true);
  });

  it('should accept valid END_TURN', () => {
    const result = ClientActionSchema.safeParse({ type: 'END_TURN' });
    expect(result.success).toBe(true);
  });

  it('should reject unknown action type', () => {
    const result = ClientActionSchema.safeParse({ type: 'UNKNOWN_ACTION' });
    expect(result.success).toBe(false);
  });

  it('should reject null input', () => {
    const result = ClientActionSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('should reject empty object', () => {
    const result = ClientActionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject string input', () => {
    const result = ClientActionSchema.safeParse('PLAY_CARD');
    expect(result.success).toBe(false);
  });
});

// ─── Protocol Parsing ─────────────

describe('parseClientMessage', () => {
  it('should parse a valid message envelope', () => {
    const message = JSON.stringify({
      match_id: 'match-123',
      player_id: 'player-456',
      action: {
        type: 'SURRENDER',
      },
    });

    const result = parseClientMessage(message);

    expect(result.match_id).toBe('match-123');
    expect(result.player_id).toBe('player-456');
    expect(result.action.type).toBe('SURRENDER');
  });

  it('should throw ProtocolError for invalid JSON', () => {
    expect(() => parseClientMessage('not json')).toThrow(ProtocolError);
  });

  it('should throw ProtocolError for missing match_id', () => {
    const message = JSON.stringify({
      player_id: 'player-456',
      action: { type: 'SURRENDER' },
    });

    expect(() => parseClientMessage(message)).toThrow(ProtocolError);
  });

  it('should throw ProtocolError for missing player_id', () => {
    const message = JSON.stringify({
      match_id: 'match-123',
      action: { type: 'SURRENDER' },
    });

    expect(() => parseClientMessage(message)).toThrow(ProtocolError);
  });

  it('should throw ProtocolError for missing action', () => {
    const message = JSON.stringify({
      match_id: 'match-123',
      player_id: 'player-456',
    });

    expect(() => parseClientMessage(message)).toThrow(ProtocolError);
  });

  it('should throw ProtocolError for invalid action', () => {
    const message = JSON.stringify({
      match_id: 'match-123',
      player_id: 'player-456',
      action: { type: 'INVALID_TYPE' },
    });

    expect(() => parseClientMessage(message)).toThrow(ProtocolError);
  });

  it('should accept optional timestamp', () => {
    const message = JSON.stringify({
      match_id: 'match-123',
      player_id: 'player-456',
      action: { type: 'SURRENDER' },
      timestamp: Date.now(),
    });

    const result = parseClientMessage(message);
    expect(result.action.type).toBe('SURRENDER');
  });
});

// ─── ProtocolError ─────────────

describe('ProtocolError', () => {
  it('should have code and message', () => {
    const error = new ProtocolError('TEST_CODE', 'Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('ProtocolError');
  });

  it('should be an instance of Error', () => {
    const error = new ProtocolError('CODE', 'msg');
    expect(error).toBeInstanceOf(Error);
  });
});

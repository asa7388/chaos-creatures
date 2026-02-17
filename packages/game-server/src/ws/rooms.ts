// Chaos Creatures Game Server — Match Rooms (Supabase Realtime)
// Manages Supabase Realtime channels for match communication.
// Each match gets a single channel `match:<matchId>`.
// Server broadcasts `game_event` to all players on the channel.
// Server can also send targeted events to specific players via
// `game_event_<playerId>` broadcast events.

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ServerEvent } from '../types/messages';
import type { PlayerSide } from '../types/enums';
import { serializeServerEvent } from './protocol';

interface RoomMember {
  playerId: string;
  side: PlayerSide;
}

/** Match room: the Realtime channel and registered players */
interface MatchRoom {
  matchId: string;
  channel: RealtimeChannel;
  members: Map<string, RoomMember>; // playerId -> RoomMember
  subscribed: boolean;
}

const rooms = new Map<string, MatchRoom>();

/**
 * Create a room for a match with a Supabase Realtime channel.
 * The channel must already be subscribed before calling this.
 */
export function createRoom(matchId: string, channel: RealtimeChannel): void {
  rooms.set(matchId, {
    matchId,
    channel,
    members: new Map(),
    subscribed: true,
  });
}

/**
 * Join a player to a match room.
 * No WebSocket needed — communication is via Supabase Realtime channel.
 */
export function joinRoom(
  matchId: string,
  playerId: string,
  side: PlayerSide
): boolean {
  const room = rooms.get(matchId);
  if (!room) return false;

  room.members.set(playerId, { playerId, side });
  return true;
}

/**
 * Remove a player from a room.
 */
export function leaveRoom(matchId: string, playerId: string): void {
  const room = rooms.get(matchId);
  if (!room) return;
  room.members.delete(playerId);

  // Don't auto-destroy the room when empty — the channel stays alive
  // until the match ends (the server is the authority).
}

/**
 * Send an event to a specific player in a room.
 * Uses a player-targeted broadcast event: `game_event_<playerId>`.
 * The iOS client listens for both `game_event` (broadcast to all) and
 * `game_event_<playerId>` (targeted to self).
 *
 * NOTE: On the iOS side, the client currently only listens for `game_event`.
 * For player-targeted events, we embed a `target_player_id` field in the
 * payload so the client can filter. We also broadcast on the shared
 * `game_event` event name to ensure compatibility.
 */
export function sendToPlayer(
  matchId: string,
  playerId: string,
  event: ServerEvent
): void {
  const room = rooms.get(matchId);
  if (!room || !room.subscribed) return;

  const payload = JSON.parse(serializeServerEvent(event));

  // Send as a targeted broadcast — include target_player_id so the iOS
  // client can filter events meant only for it.
  room.channel.send({
    type: 'broadcast',
    event: 'game_event',
    payload: {
      ...payload,
      target_player_id: playerId,
    },
  }).catch((err: unknown) => {
    console.error(`Failed to send to player ${playerId} in match ${matchId}:`, err);
  });
}

/**
 * Broadcast an event to all players in a room.
 */
export function broadcastToRoom(matchId: string, event: ServerEvent): void {
  const room = rooms.get(matchId);
  if (!room || !room.subscribed) return;

  const payload = JSON.parse(serializeServerEvent(event));

  room.channel.send({
    type: 'broadcast',
    event: 'game_event',
    payload,
  }).catch((err: unknown) => {
    console.error(`Failed to broadcast to match ${matchId}:`, err);
  });
}

/**
 * Broadcast an event to all players except one.
 */
export function broadcastToOthers(
  matchId: string,
  excludePlayerId: string,
  event: ServerEvent
): void {
  const room = rooms.get(matchId);
  if (!room || !room.subscribed) return;

  const payload = JSON.parse(serializeServerEvent(event));

  // Send with an exclude marker so the client with this player_id can skip it.
  // Since Supabase Realtime broadcast goes to all subscribers, we include
  // an exclude field in the payload.
  room.channel.send({
    type: 'broadcast',
    event: 'game_event',
    payload: {
      ...payload,
      exclude_player_id: excludePlayerId,
    },
  }).catch((err: unknown) => {
    console.error(`Failed to broadcast-to-others in match ${matchId}:`, err);
  });
}

/**
 * Get a room by match ID.
 */
export function getRoom(matchId: string): MatchRoom | undefined {
  return rooms.get(matchId);
}

/**
 * Destroy a room (match ended).
 * Unsubscribes from the Supabase Realtime channel.
 */
export function destroyRoom(matchId: string): void {
  const room = rooms.get(matchId);
  if (!room) return;

  room.subscribed = false;

  // Unsubscribe from the channel (async, fire and forget)
  room.channel.unsubscribe().catch((err: unknown) => {
    console.error(`Failed to unsubscribe channel for match ${matchId}:`, err);
  });

  rooms.delete(matchId);
}

/**
 * Get the player side for a given player in a room.
 */
export function getPlayerSide(matchId: string, playerId: string): PlayerSide | null {
  const room = rooms.get(matchId);
  if (!room) return null;
  const member = room.members.get(playerId);
  return member?.side ?? null;
}

/**
 * Check if a player is registered in the room.
 */
export function isPlayerInRoom(matchId: string, playerId: string): boolean {
  const room = rooms.get(matchId);
  if (!room) return false;
  return room.members.has(playerId);
}

/**
 * Get the Realtime channel for a match room.
 */
export function getRoomChannel(matchId: string): RealtimeChannel | null {
  const room = rooms.get(matchId);
  return room?.channel ?? null;
}

/**
 * Get the count of active rooms.
 */
export function getActiveRoomCount(): number {
  return rooms.size;
}

// Chaos Creatures Game Server — Match Rooms
// 2 players per room, message broadcasting

import type WebSocket from 'ws';
import type { ServerEvent } from '../types/messages';
import type { PlayerSide } from '../types/enums';
import { serializeServerEvent } from './protocol';

interface RoomMember {
  ws: WebSocket;
  playerId: string;
  side: PlayerSide;
}

/** Match room: contains connections for both players */
interface MatchRoom {
  matchId: string;
  members: Map<string, RoomMember>; // playerId -> RoomMember
}

const rooms = new Map<string, MatchRoom>();

/**
 * Create a room for a match.
 */
export function createRoom(matchId: string): void {
  rooms.set(matchId, {
    matchId,
    members: new Map(),
  });
}

/**
 * Join a player to a match room.
 */
export function joinRoom(
  matchId: string,
  playerId: string,
  side: PlayerSide,
  ws: WebSocket
): boolean {
  let room = rooms.get(matchId);
  if (!room) {
    room = { matchId, members: new Map() };
    rooms.set(matchId, room);
  }

  room.members.set(playerId, { ws, playerId, side });
  return true;
}

/**
 * Remove a player from a room.
 */
export function leaveRoom(matchId: string, playerId: string): void {
  const room = rooms.get(matchId);
  if (!room) return;
  room.members.delete(playerId);

  if (room.members.size === 0) {
    rooms.delete(matchId);
  }
}

/**
 * Send an event to a specific player in a room.
 */
export function sendToPlayer(
  matchId: string,
  playerId: string,
  event: ServerEvent
): void {
  const room = rooms.get(matchId);
  if (!room) return;

  const member = room.members.get(playerId);
  if (!member || member.ws.readyState !== member.ws.OPEN) return;

  try {
    member.ws.send(serializeServerEvent(event));
  } catch (err) {
    console.error(`Failed to send to player ${playerId}:`, err);
  }
}

/**
 * Broadcast an event to all players in a room.
 */
export function broadcastToRoom(matchId: string, event: ServerEvent): void {
  const room = rooms.get(matchId);
  if (!room) return;

  const message = serializeServerEvent(event);

  for (const member of room.members.values()) {
    if (member.ws.readyState === member.ws.OPEN) {
      try {
        member.ws.send(message);
      } catch (err) {
        console.error(`Failed to broadcast to player ${member.playerId}:`, err);
      }
    }
  }
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
  if (!room) return;

  const message = serializeServerEvent(event);

  for (const member of room.members.values()) {
    if (member.playerId === excludePlayerId) continue;
    if (member.ws.readyState === member.ws.OPEN) {
      try {
        member.ws.send(message);
      } catch (err) {
        console.error(`Failed to broadcast to player ${member.playerId}:`, err);
      }
    }
  }
}

/**
 * Get a room by match ID.
 */
export function getRoom(matchId: string): MatchRoom | undefined {
  return rooms.get(matchId);
}

/**
 * Destroy a room (match ended).
 */
export function destroyRoom(matchId: string): void {
  const room = rooms.get(matchId);
  if (!room) return;

  // Close all connections
  for (const member of room.members.values()) {
    try {
      member.ws.close(1000, 'Match ended');
    } catch {
      // Ignore close errors
    }
  }

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
 * Check if all players in a room are connected.
 */
export function areAllPlayersConnected(matchId: string): boolean {
  const room = rooms.get(matchId);
  if (!room) return false;
  if (room.members.size < 2) return false;
  for (const member of room.members.values()) {
    if (member.ws.readyState !== member.ws.OPEN) return false;
  }
  return true;
}

/**
 * Get the count of active rooms.
 */
export function getActiveRoomCount(): number {
  return rooms.size;
}

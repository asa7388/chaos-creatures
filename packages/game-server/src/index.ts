// Chaos Creatures Game Server — Entry Point
// Express + WebSocket server for authoritative match resolution.
// See docs/design/06-technical-architecture.md Sections 4-6 for full spec.

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { loadConfig } from './config';
import { initSupabase } from './services/supabase';
import { handleConnection } from './ws/handler';
import { startMatchmakingPoller, stopMatchmakingPoller } from './services/matchmaking';
import { getActiveMatchCount } from './engine/match';
import { getActiveRoomCount } from './ws/rooms';

const config = loadConfig();

// Initialize Supabase client
initSupabase(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.json());

// Health check endpoint (used by Railway)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    active_matches: getActiveMatchCount(),
    active_rooms: getActiveRoomCount(),
    uptime: process.uptime(),
  });
});

// Admin API: validate card template balance (REQ-165)
app.post('/api/admin/validate-balance', (_req, res) => {
  // TODO: Implement card template balance validation
  res.json({ status: 'not_implemented' });
});

// Admin API: trigger batch card generation (REQ-181)
app.post('/api/admin/batch/start', (_req, res) => {
  // TODO: Implement batch card generation trigger
  res.json({ status: 'not_implemented' });
});

const server = createServer(app);

// WebSocket server for match communication
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, request) => {
  handleConnection(ws, request);
});

// Start matchmaking poller
if (config.NODE_ENV !== 'test') {
  startMatchmakingPoller(async (p1, p2) => {
    console.log(`Match found: ${p1.player_id} vs ${p2.player_id}`);
    // TODO: Load deck data from Supabase and create match
  });
}

const PORT = config.GAME_SERVER_PORT;
server.listen(PORT, () => {
  console.log(`Chaos Creatures Game Server running on port ${PORT}`);
  console.log(`  Environment: ${config.NODE_ENV}`);
  console.log(`  WebSocket path: /ws`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
function gracefulShutdown(signal: string): void {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  stopMatchmakingPoller();

  wss.close(() => {
    console.log('WebSocket server closed');
  });

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

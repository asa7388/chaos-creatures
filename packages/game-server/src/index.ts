// Chaos Creatures Game Server — Entry Point
// TODO: Implement in Wave 1
// This will be an Express + WebSocket server for authoritative match resolution.
// See docs/design/06-technical-architecture.md Section 3-8 for full spec.

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { loadConfig } from './config';

const config = loadConfig();

const app = express();
app.use(express.json());

// Health check endpoint (used by Railway)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = createServer(app);

// WebSocket server for match communication
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (_ws) => {
  // TODO: Implement match connection handler in Wave 1
});

const PORT = config.GAME_SERVER_PORT;
server.listen(PORT, () => {
  console.log(`Chaos Creatures Game Server running on port ${PORT}`);
});

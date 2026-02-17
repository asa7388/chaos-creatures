// Chaos Creatures Game Server — Entry Point
// Express + WebSocket server for authoritative match resolution.
// See docs/design/06-technical-architecture.md Sections 4-6 for full spec.

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { loadConfig } from './config';
import { initSupabase, getSupabase } from './services/supabase';
import { handleConnection } from './ws/handler';
import { startMatchmakingPoller, stopMatchmakingPoller } from './services/matchmaking';
import { getActiveMatchCount } from './engine/match';
import { getActiveRoomCount } from './ws/rooms';

const config = loadConfig();

// Initialize Supabase client
initSupabase(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Admin Auth Middleware
// Validates X-Admin-Secret header against GAME_SERVER_SECRET.
// Applied to all /api/admin/* routes.
// ---------------------------------------------------------------------------
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-admin-secret'] !== config.GAME_SERVER_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

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

// Apply admin auth to all /api/admin routes
app.use('/api/admin', requireAdminAuth);

// ---------------------------------------------------------------------------
// Admin API: validate card template balance (REQ-165)
// Queries active card_templates, groups by faction, computes per-faction
// averages and flags outliers > 2 standard deviations from faction mean.
// ---------------------------------------------------------------------------
app.post('/api/admin/validate-balance', async (_req, res) => {
  try {
    const supabase = getSupabase();

    const { data: templates, error } = await supabase
      .from('card_templates')
      .select('id, name, faction_id, mana_cost, base_attack, base_health, rarity, is_active')
      .eq('is_active', true);

    if (error) {
      res.status(500).json({ error: `Database error: ${error.message}` });
      return;
    }

    if (!templates || templates.length === 0) {
      res.json({ factions: {}, outliers: [], total_cards: 0 });
      return;
    }

    // Group by faction
    const factionMap: Record<string, typeof templates> = {};
    for (const t of templates) {
      const fid = t.faction_id ?? 'unknown';
      if (!factionMap[fid]) factionMap[fid] = [];
      factionMap[fid].push(t);
    }

    // Compute per-faction stats
    const factionStats: Record<string, {
      count: number;
      avg_mana_cost: number;
      avg_attack: number;
      avg_health: number;
      std_mana_cost: number;
      std_attack: number;
      std_health: number;
    }> = {};

    for (const [fid, cards] of Object.entries(factionMap)) {
      const n = cards.length;
      const avgMana = cards.reduce((s, c) => s + (c.mana_cost ?? 0), 0) / n;
      const avgAtk = cards.reduce((s, c) => s + (c.base_attack ?? 0), 0) / n;
      const avgHp = cards.reduce((s, c) => s + (c.base_health ?? 0), 0) / n;

      const stdMana = Math.sqrt(cards.reduce((s, c) => s + (c.mana_cost - avgMana) ** 2, 0) / n);
      const stdAtk = Math.sqrt(cards.reduce((s, c) => s + (c.base_attack - avgAtk) ** 2, 0) / n);
      const stdHp = Math.sqrt(cards.reduce((s, c) => s + (c.base_health - avgHp) ** 2, 0) / n);

      factionStats[fid] = {
        count: n,
        avg_mana_cost: Math.round(avgMana * 100) / 100,
        avg_attack: Math.round(avgAtk * 100) / 100,
        avg_health: Math.round(avgHp * 100) / 100,
        std_mana_cost: Math.round(stdMana * 100) / 100,
        std_attack: Math.round(stdAtk * 100) / 100,
        std_health: Math.round(stdHp * 100) / 100,
      };
    }

    // Flag outliers (> 2 std deviations from faction mean on any stat)
    const outliers: Array<{
      id: string;
      name: string;
      faction_id: string;
      reasons: string[];
    }> = [];

    for (const [fid, cards] of Object.entries(factionMap)) {
      const stats = factionStats[fid];
      for (const card of cards) {
        const reasons: string[] = [];
        if (stats.std_mana_cost > 0 && Math.abs(card.mana_cost - stats.avg_mana_cost) > 2 * stats.std_mana_cost) {
          reasons.push(`mana_cost=${card.mana_cost} (faction avg ${stats.avg_mana_cost})`);
        }
        if (stats.std_attack > 0 && Math.abs(card.base_attack - stats.avg_attack) > 2 * stats.std_attack) {
          reasons.push(`attack=${card.base_attack} (faction avg ${stats.avg_attack})`);
        }
        if (stats.std_health > 0 && Math.abs(card.base_health - stats.avg_health) > 2 * stats.std_health) {
          reasons.push(`health=${card.base_health} (faction avg ${stats.avg_health})`);
        }
        if (reasons.length > 0) {
          outliers.push({ id: card.id, name: card.name, faction_id: fid, reasons });
        }
      }
    }

    res.json({
      factions: factionStats,
      outliers,
      total_cards: templates.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Balance validation failed: ${message}` });
  }
});

// ---------------------------------------------------------------------------
// Admin API: trigger batch card generation (REQ-181)
// Accepts batch spec, invokes the batch-generate Edge Function via Supabase,
// and returns the number of jobs created.
// ---------------------------------------------------------------------------
app.post('/api/admin/batch/start', async (req, res) => {
  try {
    const { faction_id, count, card_type, creature_type_hint } = req.body;

    if (!faction_id || !count) {
      res.status(400).json({ error: 'faction_id and count are required' });
      return;
    }

    if (count < 1 || count > 50) {
      res.status(400).json({ error: 'count must be between 1 and 50' });
      return;
    }

    const supabase = getSupabase();
    const batch_id = `batch_${Date.now()}`;

    // Invoke the batch-generate Edge Function
    const { data, error } = await supabase.functions.invoke('batch-generate', {
      body: {
        batch_id,
        faction_id,
        card_specs: Array.from({ length: count }, (_, i) => ({
          spec_id: `${batch_id}_${i}`,
          faction_id,
          card_type: card_type || 'CREATURE',
          creature_type_hint: creature_type_hint || null,
          batch_index: i,
        })),
        dry_run: false,
      },
    });

    if (error) {
      res.status(502).json({
        error: `Edge Function error: ${error.message}`,
        batch_id,
      });
      return;
    }

    res.json({
      batch_id,
      jobs_created: data?.total_cards ?? count,
      status: data?.status ?? 'started',
      edge_function_response: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Batch start failed: ${message}` });
  }
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

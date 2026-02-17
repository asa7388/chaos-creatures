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
import { createMatch, getActiveMatchCount } from './engine/match';
import type { MatchParticipant } from './engine/match';
import { createRoom, getActiveRoomCount } from './ws/rooms';
import { startNextTurn } from './ws/handler';
import type { BattleCard, BattleModifier, TriggeredAbility } from './types/game-state';
import type { SeasonRank, Keyword, CardType } from './types/enums';
import { randomUUID } from 'crypto';

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

    try {
      const supabase = getSupabase();

      // Load deck cards for both players (card_instances joined with card_templates)
      const [p1Cards, p2Cards] = await Promise.all([
        loadDeckCards(p1.player_id, p1.deck_id),
        loadDeckCards(p2.player_id, p2.deck_id),
      ]);

      // Load avatar instability modifiers
      const [p1Avatar, p2Avatar] = await Promise.all([
        loadAvatarModifier(p1.avatar_id),
        loadAvatarModifier(p2.avatar_id),
      ]);

      // Build match participants
      const participant1: MatchParticipant = {
        player_id: p1.player_id,
        deck_cards: p1Cards,
        avatar_id: p1.avatar_id,
        avatar_instability_modifier: p1Avatar,
        deck_id: p1.deck_id,
        faction_id: p1.faction_id,
        season_rank: p1.season_rank,
      };

      const participant2: MatchParticipant = {
        player_id: p2.player_id,
        deck_cards: p2Cards,
        avatar_id: p2.avatar_id,
        avatar_instability_modifier: p2Avatar,
        deck_id: p2.deck_id,
        faction_id: p2.faction_id,
        season_rank: p2.season_rank,
      };

      // Determine game mode from queue entry
      const mode = (p1.mode === 'RANKED' ? 'RANKED' : 'CASUAL') as 'RANKED' | 'CASUAL';

      // Create match via engine
      const matchId = randomUUID();
      const state = createMatch(matchId, mode, participant1, participant2);

      // Create WebSocket room for the match
      createRoom(matchId);

      // Insert match record into Supabase matches table
      await supabase.from('matches').insert({
        id: matchId,
        mode,
        player_1_id: state.player_1.player_id,
        player_2_id: state.player_2.player_id,
        player_1_deck_id: state.player_1.deck_id,
        player_2_deck_id: state.player_2.deck_id,
        status: 'IN_PROGRESS',
        started_at: state.started_at,
      });

      // Broadcast MATCH_FOUND to both players via Supabase Realtime
      // Each player listens on their own matchmaking:<playerId> channel
      const matchFoundPayload = {
        type: 'broadcast',
        event: 'MATCH_FOUND',
        payload: { match_id: matchId },
      };

      await Promise.all([
        supabase.channel(`matchmaking:${p1.player_id}`)
          .send(matchFoundPayload as any),
        supabase.channel(`matchmaking:${p2.player_id}`)
          .send(matchFoundPayload as any),
      ]);

      console.log(`Match ${matchId} created: ${p1.player_id} vs ${p2.player_id} (${mode})`);
    } catch (err) {
      console.error('Failed to create match from matchmaking:', err);
    }
  });
}

/**
 * Load deck cards for a player from Supabase.
 * Joins card_instances with card_templates to get full card data.
 */
async function loadDeckCards(playerId: string, deckId: string): Promise<BattleCard[]> {
  const supabase = getSupabase();

  // Fetch deck_cards join: deck_cards -> card_instances -> card_templates
  const { data: deckCards, error } = await supabase
    .from('deck_cards')
    .select(`
      card_instance_id,
      card_instances!inner (
        id,
        card_template_id,
        evolution_tier,
        chaos_energy,
        modifiers,
        triggered_abilities,
        card_templates!inner (
          id,
          name,
          card_type,
          mana_cost,
          base_attack,
          base_health,
          base_instability,
          innate_keywords,
          faction_id,
          art_url
        )
      )
    `)
    .eq('deck_id', deckId);

  if (error) {
    throw new Error(`Failed to load deck cards for player ${playerId}: ${error.message}`);
  }

  if (!deckCards || deckCards.length === 0) {
    throw new Error(`No cards found in deck ${deckId} for player ${playerId}`);
  }

  return deckCards.map((dc: any) => {
    const ci = dc.card_instances;
    const ct = ci.card_templates;

    return {
      instance_id: ci.id,
      template_id: ct.id,
      card_type: ct.card_type as CardType,
      name: ct.name,
      mana_cost: ct.mana_cost,
      art_url: ct.art_url ?? '',
      base_attack: ct.base_attack ?? undefined,
      base_health: ct.base_health ?? undefined,
      base_instability: ct.base_instability ?? 0,
      innate_keywords: (ct.innate_keywords ?? []) as Keyword[],
      modifiers: (ci.modifiers ?? []) as BattleModifier[],
      triggered_abilities: (ci.triggered_abilities ?? []) as TriggeredAbility[],
      faction_id: ct.faction_id,
    } satisfies BattleCard;
  });
}

/**
 * Load avatar instability modifier from Supabase.
 */
async function loadAvatarModifier(avatarId: string): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('avatars')
    .select('instability_modifier')
    .eq('id', avatarId)
    .single();

  if (error || !data) {
    console.warn(`Could not load avatar ${avatarId}, defaulting instability modifier to 0`);
    return 0;
  }

  return data.instability_modifier ?? 0;
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

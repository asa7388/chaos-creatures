// Chaos Creatures Game Server — Entry Point
// Express + Supabase Realtime server for authoritative match resolution.
// Match communication uses Supabase Realtime channels (not raw WebSocket).
// A lightweight WebSocket server remains on /ws for health/admin monitoring.
// See docs/design/06-technical-architecture.md Sections 4-6 for full spec.

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { loadConfig } from './config';
import { initSupabase, getSupabase } from './services/supabase';
import { setupMatchChannel, registerPlayer, startNextTurn } from './ws/handler';
import { startMatchmakingPoller, stopMatchmakingPoller } from './services/matchmaking';
import { createMatch, getActiveMatchCount, getMatch } from './engine/match';
import type { MatchParticipant } from './engine/match';
import { getActiveRoomCount } from './ws/rooms';
import type { BattleCard, BattleModifier, TriggeredAbility } from './types/game-state';
import type { SeasonRank, Keyword, CardType } from './types/enums';
import { randomUUID } from 'crypto';
import { buildBotDeck, BOT_PLAYER_ID, BOT_DECK_ID, BOT_AVATAR_ID } from './bot/ai';
import { executeBotTurn, shouldBotAct } from './bot/runner';

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

// Health check endpoint (used by Railway) — public, minimal info only
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Apply admin auth to all /api/admin routes
app.use('/api/admin', requireAdminAuth);

// Detailed health/metrics endpoint — admin-only (S-09)
app.get('/api/admin/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    active_matches: getActiveMatchCount(),
    active_rooms: getActiveRoomCount(),
    uptime: process.uptime(),
  });
});

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

// ---------------------------------------------------------------------------
// JWT Verification Helper
// Validates a Supabase JWT and returns the user ID.
// Used by the practice endpoint for player authentication.
// ---------------------------------------------------------------------------
async function verifySupabaseJWT(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Practice Match Endpoint: POST /api/practice/start
// Creates a practice match against the AI bot.
// Bypasses the matchmaking queue entirely.
// Source: docs/design/PRACTICE-MATCH-SPEC.md Section 3.3
// ---------------------------------------------------------------------------
app.post('/api/practice/start', async (req, res) => {
  try {
    // 1. Authenticate
    const userId = await verifySupabaseJWT(req.headers.authorization);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // 2. Validate request
    const { deck_id } = req.body;
    if (!deck_id || typeof deck_id !== 'string') {
      res.status(400).json({ error: 'deck_id is required' });
      return;
    }

    const supabase = getSupabase();

    // 3. Load player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, season_rank')
      .eq('auth_id', userId)
      .single();

    if (playerError || !player) {
      res.status(400).json({ error: 'Player profile not found' });
      return;
    }

    // 4. Load the player's deck
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id, faction_id, avatar_id, is_valid')
      .eq('id', deck_id)
      .eq('owner_id', player.id)
      .single();

    if (deckError || !deck) {
      res.status(400).json({ error: 'Deck not found or does not belong to player' });
      return;
    }

    // 5. Load player's deck cards (same query as matchmaking poller)
    const playerCards = await loadDeckCards(player.id, deck_id);

    // 6. Load player's avatar instability modifier
    const playerAvatarMod = await loadAvatarModifier(deck.avatar_id);

    // 7. Build bot deck from card_templates
    const botCards = await buildBotDeck({ card_count: 20 });

    // 8. Build participants
    const humanParticipant: MatchParticipant = {
      player_id: player.id,
      deck_cards: playerCards,
      avatar_id: deck.avatar_id,
      avatar_instability_modifier: playerAvatarMod,
      deck_id: deck_id,
      faction_id: deck.faction_id,
      season_rank: player.season_rank as SeasonRank,
    };

    const botParticipant: MatchParticipant = {
      player_id: BOT_PLAYER_ID,
      deck_cards: botCards,
      avatar_id: BOT_AVATAR_ID,
      avatar_instability_modifier: -4, // Kael's instability modifier
      deck_id: BOT_DECK_ID,
      faction_id: 'a0000000-0000-0000-0000-000000000003', // Demonic Kingdoms
      season_rank: 'BRONZE_3' as SeasonRank,
    };

    // 9. Create match (PRACTICE mode)
    // Force human = PLAYER_1, bot = PLAYER_2 (override random assignment)
    const matchId = randomUUID();
    const state = createMatch(matchId, 'PRACTICE', humanParticipant, botParticipant);

    // Ensure human is PLAYER_1 and bot is PLAYER_2
    // createMatch randomly assigns P1/P2, so we may need to swap
    if (state.player_1.player_id !== player.id) {
      // Swap player_1 and player_2 objects
      const temp = state.player_1;
      state.player_1 = state.player_2;
      state.player_2 = temp;
      state.player_1.side = 'PLAYER_1';
      state.player_2.side = 'PLAYER_2';

      // Fix hand sizes and Chaos Spark to match side conventions:
      // P1 should have 4-card hand (no Chaos Spark)
      // P2 should have 5-card hand (with Chaos Spark)
      // After the swap, P1 (human) has 5 cards + spark, P2 (bot) has 4 cards + no spark.
      // Move one card from P1's hand back to top of P1's deck, give P2 a card from P2's deck.
      if (state.player_1.hand.length > 4 && state.player_2.deck.length > 0) {
        // Return the last card from P1's hand to the top of P1's deck
        const returnedCard = state.player_1.hand.pop()!;
        state.player_1.deck.unshift(returnedCard);
        // Draw one extra card for P2 from P2's deck
        const drawnCard = state.player_2.deck.shift();
        if (drawnCard) {
          state.player_2.hand.push(drawnCard);
        }
      }
      // Fix Chaos Spark assignment: P1 = no spark, P2 = spark
      state.player_1.has_chaos_spark = false;
      state.player_2.has_chaos_spark = true;
    }

    // 10. Set up Supabase Realtime channel
    await setupMatchChannel(matchId);

    // 11. Register both players in the room
    registerPlayer(matchId, player.id);
    registerPlayer(matchId, BOT_PLAYER_ID);

    // 12. We do NOT insert into matches table for practice matches since
    // BOT_PLAYER_ID does not exist in the players table.
    // Instead, we just track in-memory.

    // 13. Return match_id to client
    res.json({
      match_id: matchId,
      bot_name: 'Kael, the Bound Tyrant',
    });

    console.log(`Practice match ${matchId} created: ${player.id} vs BOT`);

    // 14. Start the first turn after a short delay
    // (gives the client time to connect to the channel)
    setTimeout(() => {
      const s = getMatch(matchId);
      if (s && !s.winner) {
        startNextTurn(s, matchId);
        // NOTE: Do NOT call executeBotTurn here. startNextTurn() in handler.ts
        // already checks isPracticeMatch && shouldBotAct and schedules the bot
        // turn if needed. Adding another call would cause double execution.
      }
    }, 2000); // 2 second delay for client connection

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Practice match creation failed:', message);
    res.status(500).json({ error: `Failed to create practice match: ${message}` });
  }
});

const server = createServer(app);

// ---------------------------------------------------------------------------
// WebSocket server for health/admin monitoring only.
// Match communication now uses Supabase Realtime channels (see ws/handler.ts).
// The /ws endpoint is retained for admin tooling and future monitoring.
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, _request) => {
  // Admin/monitoring WebSocket — just send health status
  ws.send(JSON.stringify({
    type: 'SERVER_INFO',
    active_matches: getActiveMatchCount(),
    active_rooms: getActiveRoomCount(),
    uptime: process.uptime(),
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch {
      // Ignore invalid messages
    }
  });
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

      // Set up Supabase Realtime channel for match communication
      // This subscribes to match:<matchId> and listens for player_action broadcasts
      await setupMatchChannel(matchId);

      // Register both players in the room
      registerPlayer(matchId, state.player_1.player_id);
      registerPlayer(matchId, state.player_2.player_id);

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
      // Each player listens on their own matchmaking:<playerId> channel.
      // We must subscribe before sending, then unsubscribe after.
      // TODO: S-10 — Consider adding a secret token component to channel names to prevent eavesdropping
      await Promise.all([
        broadcastMatchFound(supabase, p1.player_id, matchId),
        broadcastMatchFound(supabase, p2.player_id, matchId),
      ]);

      console.log(`Match ${matchId} created: ${p1.player_id} vs ${p2.player_id} (${mode})`);
    } catch (err) {
      console.error('Failed to create match from matchmaking:', err);
    }
  });
}

/**
 * Broadcast MATCH_FOUND to a player's matchmaking channel.
 * Subscribes, sends, then unsubscribes.
 */
async function broadcastMatchFound(
  supabase: ReturnType<typeof getSupabase>,
  playerId: string,
  matchId: string
): Promise<void> {
  const channel = supabase.channel(`matchmaking:${playerId}`);

  return new Promise((resolve, reject) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.send({
            type: 'broadcast',
            event: 'MATCH_FOUND',
            payload: { match_id: matchId },
          });
          // Small delay to ensure delivery before unsubscribe
          setTimeout(async () => {
            try {
              await channel.unsubscribe();
            } catch {
              // Ignore unsubscribe errors
            }
            resolve();
          }, 200);
        } catch (err) {
          try {
            await channel.unsubscribe();
          } catch {
            // Ignore
          }
          reject(err);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        reject(new Error(`Failed to subscribe to matchmaking:${playerId}: ${status}`));
      }
    });
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
  console.log(`  Match transport: Supabase Realtime`);
  console.log(`  Admin WebSocket: /ws`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
function gracefulShutdown(signal: string): void {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  stopMatchmakingPoller();

  wss.close(() => {
    console.log('Admin WebSocket server closed');
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

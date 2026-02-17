-- ============================================================================
-- Migration 00011: Row Level Security Policies
-- Source: docs/design/06-technical-architecture.md Section 3.1
--
-- Policy pattern:
--   - Global read-only data (factions, avatars, templates, events, config,
--     modifier_defs, achievements, quest_templates): anyone can read.
--   - Player-owned data (players, cards, decks, missions, etc.): player reads
--     own data via auth_id match.
--   - Service role: full access on all tables (game server, edge functions).
--   - Admin tables: service role only.
-- ============================================================================

-- ────────────────────────────────────────────
-- factions — global read-only
-- ────────────────────────────────────────────
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read factions"
  ON factions FOR SELECT
  USING (true);

CREATE POLICY "Service role manages factions"
  ON factions FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- avatars — global read-only
-- ────────────────────────────────────────────
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read avatars"
  ON avatars FOR SELECT
  USING (true);

CREATE POLICY "Service role manages avatars"
  ON avatars FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- card_templates — global read-only
-- ────────────────────────────────────────────
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates"
  ON card_templates FOR SELECT
  USING (true);

CREATE POLICY "Service role manages templates"
  ON card_templates FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- players
-- ────────────────────────────────────────────
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Players can read their own data
CREATE POLICY "Players can read own data"
  ON players FOR SELECT
  USING (auth.uid() = auth_id);

-- Players can update their own data
CREATE POLICY "Players can update own data"
  ON players FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Public profile read (display_name, season_rank, showcase visible to all)
CREATE POLICY "Public profile read"
  ON players FOR SELECT
  USING (true);

-- Service role full access (game server, edge functions)
CREATE POLICY "Service role full access on players"
  ON players FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- card_instances — player-owned
-- ────────────────────────────────────────────
ALTER TABLE card_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own cards"
  ON card_instances FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = owner_id));

CREATE POLICY "Service role full access on cards"
  ON card_instances FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- decks — player-owned
-- ────────────────────────────────────────────
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own decks"
  ON decks FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = owner_id));

CREATE POLICY "Players manage own decks"
  ON decks FOR ALL
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = owner_id));

CREATE POLICY "Service role full access on decks"
  ON decks FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- modifier_definitions — global read-only
-- ────────────────────────────────────────────
ALTER TABLE modifier_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read modifiers"
  ON modifier_definitions FOR SELECT
  USING (true);

CREATE POLICY "Service role manages modifiers"
  ON modifier_definitions FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- event_definitions — global read-only
-- ────────────────────────────────────────────
ALTER TABLE event_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events"
  ON event_definitions FOR SELECT
  USING (true);

CREATE POLICY "Service role manages events"
  ON event_definitions FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- match_records — players read own matches
-- ────────────────────────────────────────────
ALTER TABLE match_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own matches"
  ON match_records FOR SELECT
  USING (
    auth.uid() = (SELECT auth_id FROM players WHERE id = player_1_id)
    OR auth.uid() = (SELECT auth_id FROM players WHERE id = player_2_id)
  );

CREATE POLICY "Service role full access on matches"
  ON match_records FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- matchmaking_queue — players manage own entry
-- ────────────────────────────────────────────
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players manage own queue entry"
  ON matchmaking_queue FOR ALL
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

CREATE POLICY "Service role full access on queue"
  ON matchmaking_queue FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- economy_config — global read, service write
-- ────────────────────────────────────────────
ALTER TABLE economy_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config"
  ON economy_config FOR SELECT
  USING (true);

CREATE POLICY "Service role manages config"
  ON economy_config FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- shard_transactions — players read own
-- ────────────────────────────────────────────
ALTER TABLE shard_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own shard transactions"
  ON shard_transactions FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

CREATE POLICY "Service role full access on shard tx"
  ON shard_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- dust_transactions — players read own
-- ────────────────────────────────────────────
ALTER TABLE dust_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own dust transactions"
  ON dust_transactions FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

CREATE POLICY "Service role full access on dust tx"
  ON dust_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- missions — players read own
-- ────────────────────────────────────────────
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own missions"
  ON missions FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

CREATE POLICY "Service role full access on missions"
  ON missions FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- achievements — global read-only
-- ────────────────────────────────────────────
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Service role manages achievements"
  ON achievements FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- player_achievements — players read own
-- ────────────────────────────────────────────
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own achievements"
  ON player_achievements FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

CREATE POLICY "Service role full access on player achievements"
  ON player_achievements FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- quest_templates — global read-only
-- ────────────────────────────────────────────
ALTER TABLE quest_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read quest templates"
  ON quest_templates FOR SELECT
  USING (true);

CREATE POLICY "Service role manages quest templates"
  ON quest_templates FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- generation_jobs — players read own
-- ────────────────────────────────────────────
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own generation jobs"
  ON generation_jobs FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

CREATE POLICY "Service role full access on generation jobs"
  ON generation_jobs FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- seasons — global read-only
-- ────────────────────────────────────────────
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seasons"
  ON seasons FOR SELECT
  USING (true);

CREATE POLICY "Service role manages seasons"
  ON seasons FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- battle_pass_progress — players read own
-- ────────────────────────────────────────────
ALTER TABLE battle_pass_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own battle pass"
  ON battle_pass_progress FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

CREATE POLICY "Service role manages battle pass"
  ON battle_pass_progress FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- rank_history — players read own
-- ────────────────────────────────────────────
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own rank history"
  ON rank_history FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = player_id));

CREATE POLICY "Service role full access on rank history"
  ON rank_history FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- friend_requests — players read/manage own
-- ────────────────────────────────────────────
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own friend requests"
  ON friend_requests FOR SELECT
  USING (
    auth.uid() = (SELECT auth_id FROM players WHERE id = sender_id)
    OR auth.uid() = (SELECT auth_id FROM players WHERE id = receiver_id)
  );

CREATE POLICY "Players create friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_id FROM players WHERE id = sender_id));

CREATE POLICY "Players respond to friend requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = (SELECT auth_id FROM players WHERE id = receiver_id));

CREATE POLICY "Service role full access on friend requests"
  ON friend_requests FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- rate_limit_log — service role only
-- ────────────────────────────────────────────
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only on rate limits"
  ON rate_limit_log FOR ALL
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────
-- admin_audit_log — service role only
-- ────────────────────────────────────────────
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only on admin audit"
  ON admin_audit_log FOR ALL
  USING (auth.role() = 'service_role');

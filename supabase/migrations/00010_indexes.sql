-- ============================================================================
-- Migration 00010: Indexes
-- Source: docs/design/06-technical-architecture.md Section 3.1
--         docs/design/02-card-data-model.md Section 19 (Key Indexes)
-- ============================================================================

-- ── card_instances ──────────────────────────
-- Get all cards for a player
CREATE INDEX idx_card_instances_owner
  ON card_instances(owner_id);

-- Get all cards for a player in a faction (via template join)
CREATE INDEX idx_card_instances_owner_template
  ON card_instances(owner_id, template_id);

-- Get evolution-ready cards for a player
CREATE INDEX idx_card_instances_evolution_ready
  ON card_instances(owner_id, tier, chaos_energy);

-- ── card_templates ─────────────────────────
-- Filter templates by faction
CREATE INDEX idx_card_templates_faction
  ON card_templates(faction_id);

-- Filter templates by type
CREATE INDEX idx_card_templates_type
  ON card_templates(card_type);

-- ── match_records ──────────────────────────
-- Player 1 match history (descending by date)
CREATE INDEX idx_match_records_p1
  ON match_records(player_1_id, started_at DESC);

-- Player 2 match history (descending by date)
CREATE INDEX idx_match_records_p2
  ON match_records(player_2_id, started_at DESC);

-- Season-based match lookup
CREATE INDEX idx_match_records_season
  ON match_records(season_id, started_at DESC);

-- ── missions ───────────────────────────────
-- Active missions for a player (uncompleted, not expired)
CREATE INDEX idx_missions_player
  ON missions(player_id, is_completed, expires_at);

-- ── shard_transactions ─────────────────────
-- Player shard history
CREATE INDEX idx_shard_tx_player
  ON shard_transactions(player_id, created_at DESC);

-- ── dust_transactions ──────────────────────
-- Player dust history
CREATE INDEX idx_dust_tx_player
  ON dust_transactions(player_id, created_at DESC);

-- ── generation_jobs ────────────────────────
-- Pending jobs by priority (for worker polling)
CREATE INDEX idx_generation_jobs_status
  ON generation_jobs(status, priority DESC, created_at);

-- Player's generation history
CREATE INDEX idx_generation_jobs_player
  ON generation_jobs(player_id, created_at DESC);

-- ── rate_limit_log ─────────────────────────
-- Rate limit lookups per player+action
CREATE INDEX idx_rate_limit_player_action
  ON rate_limit_log(player_id, action, created_at DESC);

-- ── decks ──────────────────────────────────
-- Player's decks
CREATE INDEX idx_decks_owner
  ON decks(owner_id);

-- ── modifier_definitions ───────────────────
-- Pool lookup: the primary query path for modifier selection at evolution
CREATE INDEX idx_modifier_defs_pool
  ON modifier_definitions(pp_cost, tier_bracket, attunement, pool_type);

-- Faction-specific modifier lookup
CREATE INDEX idx_modifier_defs_faction
  ON modifier_definitions(faction_id)
  WHERE faction_id IS NOT NULL;

-- ── avatars ────────────────────────────────
-- Avatars by faction
CREATE INDEX idx_avatars_faction
  ON avatars(faction_id);

-- ── player_achievements ────────────────────
-- Player achievement progress
CREATE INDEX idx_player_achievements_player
  ON player_achievements(player_id);

-- ── friend_requests ────────────────────────
-- Incoming friend requests
CREATE INDEX idx_friend_requests_receiver
  ON friend_requests(receiver_id, status);

-- Outgoing friend requests
CREATE INDEX idx_friend_requests_sender
  ON friend_requests(sender_id, status);

-- ── battle_pass_progress ───────────────────
-- Player battle pass by season
CREATE INDEX idx_battle_pass_player_season
  ON battle_pass_progress(player_id, season_id);

-- ── rank_history ───────────────────────────
-- Player rank history
CREATE INDEX idx_rank_history_player
  ON rank_history(player_id, season_id);

-- ── matchmaking_queue ──────────────────────
-- Queue ordering for matchmaker polling
CREATE INDEX idx_matchmaking_queue_order
  ON matchmaking_queue(queued_at ASC);

-- MMR-based matchmaking range queries
CREATE INDEX idx_matchmaking_queue_mmr
  ON matchmaking_queue(hidden_mmr, queued_at ASC);

-- ── players ────────────────────────────────
-- Leaderboard by rank points
CREATE INDEX idx_players_rank_points
  ON players(season_rank_points DESC);

-- Friend code lookup
CREATE INDEX idx_players_friend_code
  ON players(friend_code);

-- ── admin_audit_log ────────────────────────
-- Audit log chronological
CREATE INDEX idx_admin_audit_log_created
  ON admin_audit_log(created_at DESC);

-- Audit by target
CREATE INDEX idx_admin_audit_log_target
  ON admin_audit_log(target_type, target_id);

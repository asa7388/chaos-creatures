-- ============================================================================
-- Migration 00009: Admin Tables
-- Source: docs/design/06-technical-architecture.md Section 3.1 (rate_limit_log)
--         docs/design/06-technical-architecture.md Section 9 (Admin Dashboard)
-- ============================================================================

-- ────────────────────────────────────────────
-- rate_limit_log
-- Tracks rate-limited actions per player for abuse prevention.
-- Entries auto-cleaned after 24 hours via pg_cron (configured separately).
-- ────────────────────────────────────────────
CREATE TABLE rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- admin_audit_log
-- Tracks all admin actions for accountability.
-- Written by admin dashboard and edge functions.
-- ────────────────────────────────────────────
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

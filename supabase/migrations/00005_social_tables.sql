-- ============================================================================
-- Migration 00005: Social Tables
-- Source: docs/design/02-card-data-model.md Section 12 (Player.friend_ids)
--         docs/design/00-game-design-master.md Section 20 (Social Features)
--
-- Note: The primary player model stores friend_ids as a UUID array for quick
-- lookup. This friends table provides a proper relational structure for
-- friend requests with status tracking.
-- ============================================================================

-- ────────────────────────────────────────────
-- friend_requests
-- Manages the lifecycle of friend requests between players.
-- ────────────────────────────────────────────
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT no_self_friend CHECK (sender_id != receiver_id),
  CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id)
);

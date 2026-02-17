-- ============================================================================
-- Migration 00007: Generation Tables
-- Source: docs/design/06-technical-architecture.md Section 3.1 (generation_jobs)
--         docs/design/02-card-data-model.md Section 3 (EvolutionRecord)
-- ============================================================================

-- ────────────────────────────────────────────
-- generation_jobs
-- Tracks AI image/text generation requests (fal.ai, OpenAI).
-- ────────────────────────────────────────────
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('EVOLUTION_IMAGE', 'EVOLUTION_TEXT', 'BASE_CARD_IMAGE', 'BASE_CARD_TEXT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING')),
  priority INTEGER NOT NULL DEFAULT 0,

  -- Input
  player_id UUID REFERENCES players(id),
  card_instance_id UUID REFERENCES card_instances(id),
  input_data JSONB NOT NULL,

  -- Output
  output_data JSONB,
  art_url TEXT,
  error_message TEXT,

  -- Cost tracking
  model_used TEXT,
  cost_usd NUMERIC(10, 6) DEFAULT 0,

  -- Retry
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

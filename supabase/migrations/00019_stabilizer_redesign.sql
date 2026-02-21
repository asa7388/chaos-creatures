-- ============================================================================
-- Migration 00019: Stabilizer Redesign
--
-- Context:
--   Stabilizers are being redesigned from passive stat-modifiers to cards with
--   discrete activated effects. The new design adds an `activated_effect` JSONB
--   column so each stabilizer template can declare exactly what it does when
--   activated during a match (cost, trigger timing, outcome).
--
-- Changes:
--   1. card_templates: ADD COLUMN activated_effect JSONB (nullable)
--      - NULL for CREATURE and SPELL rows (no change in behavior)
--      - Populated for STABILIZER rows to describe the card's on-use ability
--   2. Existing STABILIZER rows: SET mana_cost = 0
--      - Stabilizers are no longer "played" the same way as creatures/spells.
--        They have no casting cost; cost is folded into their activated_effect.
--   3. DECK_SIZE constant: changed from 20 → 30
--      - This is enforced in application code only (game server + iOS client).
--        No DB CHECK constraint exists for deck size — validation lives in the
--        deck_entries JSONB length check inside Edge Functions and the match
--        engine. No schema change is required here; this comment documents the
--        architectural decision so future migrations have the correct baseline.
--   4. Stability Zone: in-memory only on the game server
--      - There is NO database table for the stability zone. The active
--        stabilizer slot during a match is transient server state, stored in
--        the match's in-memory game state object and never persisted to the DB.
--        Match result snapshots (match_results table) capture final board state
--        if needed for replay, but the stability zone itself requires no
--        migration.
--
-- Idempotent: safe to re-run (IF NOT EXISTS, ON CONFLICT guards where relevant)
-- ============================================================================


-- ============================================================================
-- 1. ADD activated_effect COLUMN TO card_templates
-- ============================================================================

-- Nullable: CREATURE and SPELL rows leave this NULL.
-- STABILIZER rows should populate it with a JSONB object describing the
-- activated ability, e.g.:
--   {
--     "trigger": "ON_ACTIVATE",          -- when it fires (always ON_ACTIVATE for now)
--     "cost": { "type": "NONE" },         -- what it costs to use
--     "effect": { "type": "REDUCE_INSTABILITY", "amount": 2 },
--     "cooldown_turns": 1,                -- 0 = usable every turn
--     "description": "Reduce your instability by 2 until your next turn."
--   }

ALTER TABLE card_templates
  ADD COLUMN IF NOT EXISTS activated_effect JSONB;

COMMENT ON COLUMN card_templates.activated_effect IS
  'Activated ability for STABILIZER cards. NULL for CREATURE and SPELL types. '
  'JSONB object with keys: trigger, cost, effect, cooldown_turns, description. '
  'The stability zone where active stabilizers live during a match is transient '
  'in-memory state on the game server — it is not stored in this column.';


-- ============================================================================
-- 2. SET mana_cost = 0 FOR EXISTING STABILIZER ROWS
-- ============================================================================

-- Stabilizers no longer have a casting cost under the redesign.
-- Any cost associated with their activated ability lives in activated_effect.cost.
-- This UPDATE is idempotent (running it twice has no harmful side-effect).

UPDATE card_templates
SET mana_cost = 0
WHERE card_type = 'STABILIZER';


-- ============================================================================
-- 3. DOCUMENTATION: DECK_SIZE CHANGED FROM 20 → 30
--    (No schema change — enforced in application code only)
-- ============================================================================

-- The deck size constant has been updated from 20 to 30 cards.
-- Enforcement locations:
--   - packages/game-server/src/engine/deckValidator.ts — authoritative validation
--   - ChaosCreatures/Models/DeckValidator.swift         — client-side pre-check
--   - supabase/functions/validate-deck/index.ts         — Edge Function guard
-- No DB CHECK constraint exists on card_entries length; the decks table stores
-- card_entries as JSONB (unconstrained length). Application-layer validation is
-- the sole enforcement mechanism for deck size — this is intentional (it allows
-- the constant to change in a future migration by updating application code only,
-- without requiring a constraint DROP/ADD cycle).


-- ============================================================================
-- 4. DOCUMENTATION: STABILITY ZONE IS IN-MEMORY ONLY
--    (No schema change needed)
-- ============================================================================

-- The stability zone (the slot where a player's active stabilizer lives during
-- a match) is stored exclusively in the game server's in-memory match state.
-- It is NOT persisted to any Postgres table. Rationale:
--   - Match state is authoritative on the Railway game server, not in Supabase.
--   - Stabilizer slot occupancy changes multiple times per turn (activate →
--     cooldown → expire) — writing every transition to DB would cause
--     unnecessary write amplification.
--   - If a server restart occurs mid-match, the match is treated as abandoned
--     (existing behavior, unchanged by this migration).
-- If future designs require replaying stabilizer activations, they can be
-- appended to the match_events JSONB log at match resolution time.


-- ============================================================================
-- REVISION LOG
-- ============================================================================
-- 2026-02-20  Initial migration — activated_effect column, stabilizer mana_cost
--             reset, deck size and stability zone design decisions documented.
-- ============================================================================

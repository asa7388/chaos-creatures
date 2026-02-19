-- ============================================================================
-- Migration 00018: Faction Expansion (3 → 5 factions)
-- Adds: Celestial Crusade, The Endless factions
-- Adds: PLANAR_RUIN card type, HASTE + WARD keywords, EXALT + PERSIST mechanics
-- Adds: Planar Ruins tables, new avatars, quest templates, achievements
-- Updates: Ironwright retheme (steampunk → brutalist space-industrial)
--
-- Idempotent: safe to re-run (IF NOT EXISTS, ON CONFLICT DO NOTHING, etc.)
-- ============================================================================

-- ============================================================================
-- 1. ENUM EXTENSIONS (ALTER TYPE ... ADD VALUE is idempotent with IF NOT EXISTS)
-- ============================================================================

-- card_type_enum: add PLANAR_RUIN
ALTER TYPE card_type_enum ADD VALUE IF NOT EXISTS 'PLANAR_RUIN';

-- keyword_enum: add HASTE, WARD
ALTER TYPE keyword_enum ADD VALUE IF NOT EXISTS 'HASTE';
ALTER TYPE keyword_enum ADD VALUE IF NOT EXISTS 'WARD';

-- faction_mechanic_enum: add EXALT, PERSIST
ALTER TYPE faction_mechanic_enum ADD VALUE IF NOT EXISTS 'EXALT';
ALTER TYPE faction_mechanic_enum ADD VALUE IF NOT EXISTS 'PERSIST';


-- ============================================================================
-- 2. CHECK CONSTRAINT UPDATES
-- ============================================================================

-- 2a. factions.short_name — drop the inline constraint from 00002 and re-add with new values
-- PostgreSQL auto-names inline constraints as: {table}_{column}_check
ALTER TABLE factions DROP CONSTRAINT IF EXISTS factions_short_name_check;
ALTER TABLE factions DROP CONSTRAINT IF EXISTS chk_factions_short_name;
ALTER TABLE factions ADD CONSTRAINT chk_factions_short_name
  CHECK (short_name IN ('IRONWRIGHT', 'FEY_COURTS', 'DEMONIC_KINGDOMS', 'CELESTIAL_CRUSADE', 'THE_ENDLESS'));

-- 2b. factions.exclusive_mechanic — add EXALT, PERSIST
ALTER TABLE factions DROP CONSTRAINT IF EXISTS factions_exclusive_mechanic_check;
ALTER TABLE factions DROP CONSTRAINT IF EXISTS chk_factions_exclusive_mechanic;
ALTER TABLE factions ADD CONSTRAINT chk_factions_exclusive_mechanic
  CHECK (exclusive_mechanic IN ('AUGMENT', 'BOND', 'CORRUPTION', 'EXALT', 'PERSIST'));

-- 2c. card_templates.card_type — add PLANAR_RUIN
ALTER TABLE card_templates DROP CONSTRAINT IF EXISTS card_templates_card_type_check;
ALTER TABLE card_templates DROP CONSTRAINT IF EXISTS chk_card_templates_card_type;
ALTER TABLE card_templates ADD CONSTRAINT chk_card_templates_card_type
  CHECK (card_type IN ('CREATURE', 'SPELL', 'STABILIZER', 'PLANAR_RUIN'));

-- 2d. modifier_definitions.faction_mechanic — add EXALT, PERSIST
ALTER TABLE modifier_definitions DROP CONSTRAINT IF EXISTS modifier_definitions_faction_mechanic_check;
ALTER TABLE modifier_definitions DROP CONSTRAINT IF EXISTS chk_modifier_definitions_faction_mechanic;
ALTER TABLE modifier_definitions ADD CONSTRAINT chk_modifier_definitions_faction_mechanic
  CHECK (faction_mechanic IN ('AUGMENT', 'BOND', 'CORRUPTION', 'EXALT', 'PERSIST'));


-- ============================================================================
-- 3. NEW FACTION ROWS
-- ============================================================================

INSERT INTO factions (id, name, short_name, exclusive_mechanic, art_prompt_prefix, flavor_voice, name_voice, color_primary, color_secondary, color_background, particle_theme) VALUES
(
  'a0000000-0000-0000-0000-000000000004',
  'The Celestial Crusade',
  'CELESTIAL_CRUSADE',
  'EXALT',
  'divine crusader entity, hammered gold plate and white marble, radiant halo, wings of light, sacred geometry, celestial armor, burning righteous fury, painted like a Gustave Dore biblical illustration or William Blake visionary painting',
  'Righteous, commanding, references divine mandate and celestial hierarchy. Superior and absolute. "The light does not ask permission to shine."',
  'Divine, compound words, references light/heaven/judgment. Examples: Dawnblade, Sanctiveil, Gloryhammer, Radiantcrest.',
  '#DAA520',
  '#F5F0E1',
  '#1A1520',
  'divine_radiance'
),
(
  'a0000000-0000-0000-0000-000000000005',
  'The Endless',
  'THE_ENDLESS',
  'PERSIST',
  'undead spectral entity, bone and tattered cloth, ghostly luminescence, necromantic symbols, phylacteries, spectral chains, painted like a Gustave Dore Inferno etching or Francisco Goya Black Painting',
  'Hollow, patient, references inevitability and the passage beyond. Melancholic and inevitable. "We were here before you. We will remain after."',
  'Death-themed, compound words, references bone/shadow/void. Examples: Graveweald, Hollowmere, Duskpyre, Spectraveil.',
  '#6B3FA0',
  '#E8DCC8',
  '#0D0D1A',
  'spectral_mist'
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 4. IRONWRIGHT RETHEME (steampunk → brutalist space-industrial)
-- ============================================================================

UPDATE factions SET
  art_prompt_prefix = 'brutalist space-industrial construct, poured concrete and cold-rolled iron, exposed rebar, hydraulic pistons, orbital shipyard machinery, reactor glow, void-forge exhaust, painted like a Piranesi impossible architecture or John Martin apocalyptic industrial scale',
  flavor_voice = 'Industrial, pragmatic, references engineering and void conquest. Dry wit. Functional brutality. "Efficiency is its own elegance."',
  name_voice = 'Mechanical, compound words, references iron/void/industry. Examples: Rebargolem, Voidforge, Ironclad, Gravwell.',
  color_primary = '#6B7B8D',
  color_secondary = '#E07020',
  color_background = '#1A1D23',
  particle_theme = 'industrial_sparks'
WHERE short_name = 'IRONWRIGHT';


-- ============================================================================
-- 5. PLANAR RUINS TABLES
-- ============================================================================

-- 5a. Ruin templates (neutral archetypes + evolved faction variants)
CREATE TABLE IF NOT EXISTS ruin_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cm_cost INT NOT NULL CHECK (cm_cost >= 1 AND cm_cost <= 10),
  hp INT NOT NULL CHECK (hp >= 1),
  base_instability INT NOT NULL DEFAULT 0,
  faction_id UUID REFERENCES factions(id),  -- NULL for neutral
  evolved_from UUID REFERENCES ruin_templates(id),  -- NULL for neutral archetypes
  neutral_effect JSONB NOT NULL,
  destruction_penalty JSONB NOT NULL,
  flavor_text TEXT,
  art_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5b. Ruin evolution options (what a player can choose when evolving)
CREATE TABLE IF NOT EXISTS ruin_evolution_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neutral_ruin_id UUID NOT NULL REFERENCES ruin_templates(id),
  faction_id UUID NOT NULL REFERENCES factions(id),
  evolved_ruin_id UUID NOT NULL REFERENCES ruin_templates(id),
  effect_description TEXT NOT NULL,
  UNIQUE(neutral_ruin_id, faction_id, evolved_ruin_id)
);

-- 5c. Player ruin collection
CREATE TABLE IF NOT EXISTS player_ruins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id),
  ruin_template_id UUID NOT NULL REFERENCES ruin_templates(id),
  is_evolved BOOLEAN NOT NULL DEFAULT false,
  evolved_faction_id UUID REFERENCES factions(id),
  familiarity INT NOT NULL DEFAULT 0,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5d. Indexes
CREATE INDEX IF NOT EXISTS idx_ruin_templates_faction ON ruin_templates(faction_id);
CREATE INDEX IF NOT EXISTS idx_ruin_templates_evolved_from ON ruin_templates(evolved_from);
CREATE INDEX IF NOT EXISTS idx_player_ruins_player ON player_ruins(player_id);
CREATE INDEX IF NOT EXISTS idx_player_ruins_template ON player_ruins(ruin_template_id);

-- 5e. RLS policies
ALTER TABLE ruin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruin_evolution_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ruins ENABLE ROW LEVEL SECURITY;

-- Use DO block to make policy creation idempotent
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ruin_templates' AND policyname = 'ruin_templates_select') THEN
    CREATE POLICY ruin_templates_select ON ruin_templates FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ruin_evolution_options' AND policyname = 'ruin_evolution_options_select') THEN
    CREATE POLICY ruin_evolution_options_select ON ruin_evolution_options FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_ruins' AND policyname = 'player_ruins_select') THEN
    CREATE POLICY player_ruins_select ON player_ruins FOR SELECT USING (auth.uid() = player_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_ruins' AND policyname = 'player_ruins_insert') THEN
    CREATE POLICY player_ruins_insert ON player_ruins FOR INSERT WITH CHECK (auth.uid() = player_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_ruins' AND policyname = 'player_ruins_update') THEN
    CREATE POLICY player_ruins_update ON player_ruins FOR UPDATE USING (auth.uid() = player_id);
  END IF;
END $$;


-- ============================================================================
-- 6. NEW AVATARS (4 new for Celestial + Endless)
-- ============================================================================

INSERT INTO avatars (id, name, faction_id, instability_modifier, title, lore_text, unlock_condition) VALUES
-- Celestial Crusade
(
  'b0000000-0000-0000-0000-000000000007',
  'Serevain, the Binding Light',
  'a0000000-0000-0000-0000-000000000004',
  -6,
  'The Binding Light',
  'Commander of the Knights of Deliverance, Serevain channels divine mandate through chains of radiant light. Every link is a prayer, every prayer a binding. The faithful kneel willingly; the heretics kneel regardless.',
  '{"type": "FREE_STARTER"}'::jsonb
),
(
  'b0000000-0000-0000-0000-000000000008',
  'Ophaniel, the Thousand-Eyed',
  'a0000000-0000-0000-0000-000000000004',
  -1,
  'The Thousand-Eyed',
  'Ophaniel sees everything — past, present, and the fracturing possibilities of what might come. Among Heaven''s Chosen, prophecy is certainty. Ophaniel embraces the chaos of revelation, knowing that even divine plans must sometimes burn to be reborn.',
  '{"type": "FREE_STARTER"}'::jsonb
),
-- The Endless
(
  'b0000000-0000-0000-0000-000000000009',
  'Vothrak, the Stitched King',
  'a0000000-0000-0000-0000-000000000005',
  -3,
  'The Stitched King',
  'Ruler of the Necromantic Cabals, Vothrak has died seven times and been reassembled each time by his lieutenants. Every seam is a lesson, every scar a treaty. He rules the dead because he understands what they lost — and what they still crave.',
  '{"type": "FREE_STARTER"}'::jsonb
),
(
  'b0000000-0000-0000-0000-000000000010',
  'Thessaly, the Fading Whisper',
  'a0000000-0000-0000-0000-000000000005',
  -2,
  'The Fading Whisper',
  'Thessaly is a Lost Spectre — she does not remember who she was, only what she has become. Her whispers erode reality itself, unraveling the boundaries between the living and the dead. She does not haunt. She reminds.',
  '{"type": "FREE_STARTER"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 7. UPDATE IRONWRIGHT AVATARS (remove steampunk references)
-- ============================================================================

UPDATE avatars SET
  lore_text = 'Master of the Orbital Foundry, Aldric believes in precision and order. Every piston firing on schedule, every reactor calibrated to the microgram. His constructs are marvels of void-engineering — slow to build, impossible to break.'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

UPDATE avatars SET
  lore_text = 'Where Aldric sees order, Vex sees opportunity in entropy. Her inventions push the boundaries of what cold iron and reactor fuel can endure — overclocked, overheated, and devastatingly effective. Until they detonate.'
WHERE id = 'b0000000-0000-0000-0000-000000000002';


-- ============================================================================
-- 8. NEW QUEST TEMPLATES (8 daily + 4 weekly for new mechanics)
-- ============================================================================

INSERT INTO quest_templates (id, mission_type, difficulty, period, description, target_value, base_dust, shard_reward_tier, shard_reward_count, shard_reward_chance) VALUES
  -- Daily quests for new mechanics
  ('D21', 'PLAY_CARDS',             'EASY',   'DAILY', 'Play 3 Planar Ruins',                         3,  20, NULL,       0, 0.00),
  ('D22', 'WIN_GAMES',              'MEDIUM', 'DAILY', 'Win 2 games with a Celestial Crusade deck',   2,  30, 'UNCOMMON', 1, 0.20),
  ('D23', 'WIN_GAMES',              'MEDIUM', 'DAILY', 'Win 2 games with an Endless deck',            2,  30, 'UNCOMMON', 1, 0.20),
  ('D24', 'DEAL_DAMAGE',            'MEDIUM', 'DAILY', 'Trigger Exalt on 5 creatures',                5,  30, 'UNCOMMON', 1, 0.20),
  ('D25', 'DEAL_DAMAGE',            'MEDIUM', 'DAILY', 'Trigger Persist on 5 creatures',              5,  30, 'UNCOMMON', 1, 0.20),
  ('D26', 'PLAY_CREATURES',         'HARD',   'DAILY', 'Play 10 creatures with Haste',               10,  45, 'RARE',     1, 0.30),
  ('D27', 'PLAY_CREATURES',         'HARD',   'DAILY', 'Play 10 creatures with Ward',                10,  45, 'RARE',     1, 0.30),
  ('D28', 'WIN_WITH_STYLE',         'HARD',   'DAILY', 'Win a game with 2+ Planar Ruins on board',    1,  45, 'RARE',     1, 0.30),
  -- Weekly quests for new mechanics
  ('W11', 'WIN_GAMES',              'MEDIUM', 'WEEKLY', 'Win 5 games with Celestial or Endless decks', 5, 150, 'RARE',  1, 1.00),
  ('W12', 'PLAY_CARDS',             'MEDIUM', 'WEEKLY', 'Play 15 Planar Ruins this week',             15, 150, 'RARE',  1, 1.00),
  ('W13', 'DEAL_DAMAGE',            'HARD',   'WEEKLY', 'Trigger Exalt or Persist 25 times this week', 25, 200, 'EPIC', 1, 1.00),
  ('W14', 'WIN_WITH_STYLE',         'HARD',   'WEEKLY', 'Win 3 games with all 5 factions this week',   3, 200, 'EPIC', 1, 1.00)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 9. NEW ACHIEVEMENTS (faction mastery for Celestial + Endless)
-- ============================================================================

INSERT INTO achievements (name, description, category, target_value, reward_type, reward_amount, reward_title) VALUES
-- Celestial Crusade achievements
('Crusader Initiate',       'Win 10 games with a Celestial Crusade deck',         'BATTLE',     10, 'XP',   500, NULL),
('Radiant Champion',        'Win 50 games with a Celestial Crusade deck',         'BATTLE',     50, 'XP',  1500, 'Radiant Champion'),
('Divine Mandate',          'Trigger Exalt 100 times',                            'BATTLE',    100, 'XP',  1000, 'Exalted'),
('Heaven''s Chosen',        'Evolve 10 Celestial Crusade cards to Rare or higher', 'EVOLUTION', 10, 'XP',   750, NULL),

-- The Endless achievements
('Whisper in the Dark',     'Win 10 games with an Endless deck',                  'BATTLE',     10, 'XP',   500, NULL),
('Inevitable',              'Win 50 games with an Endless deck',                  'BATTLE',     50, 'XP',  1500, 'The Inevitable'),
('Undying Will',            'Trigger Persist 100 times',                          'BATTLE',    100, 'XP',  1000, 'Undying'),
('Beyond the Veil',         'Evolve 10 Endless cards to Rare or higher',          'EVOLUTION',  10, 'XP',   750, NULL),

-- Planar Ruins achievements
('Ruin Architect',          'Play 50 Planar Ruins',                               'COLLECTION', 50, 'XP',   500, NULL),
('Five Factions',           'Own cards in all 5 factions',                         'COLLECTION',  5, 'XP',  1000, 'Planeswalker')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- 10. UPDATE EXISTING ACHIEVEMENT (Faction Explorer: 3 → 5 factions)
-- ============================================================================

UPDATE achievements SET
  description = 'Own cards in all 5 factions',
  target_value = 5
WHERE name = 'Faction Explorer';

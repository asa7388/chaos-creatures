-- ============================================================================
-- Seed Data for Chaos Creatures
-- Source: docs/design/01-battle-mechanics.md Section 5 (Factions, Avatars)
--         docs/design/01-battle-mechanics.md Sections 8-9 (Events)
--         docs/design/04-progression-economy.md Section 9 (Economy Config)
--         docs/design/04-progression-economy.md Section 4 (Quest Templates)
--         docs/design/00-game-design-master.md Section 15 (Achievements)
--
-- This file is idempotent: uses ON CONFLICT DO NOTHING where appropriate.
-- ============================================================================

-- ============================================================================
-- 1. FACTIONS (5 factions: 3 original + 2 expansion)
-- ============================================================================

INSERT INTO factions (id, name, short_name, exclusive_mechanic, art_prompt_prefix, flavor_voice, name_voice, color_primary, color_secondary, color_background, particle_theme) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'The Ironwright Collective',
  'IRONWRIGHT',
  'AUGMENT',
  'brutalist space-industrial construct, poured concrete and cold-rolled iron, exposed rebar, hydraulic pistons, orbital shipyard machinery, reactor glow, void-forge exhaust, painted like a Piranesi impossible architecture or John Martin apocalyptic industrial scale',
  'Industrial, pragmatic, references engineering and void conquest. Dry wit. Functional brutality. "Efficiency is its own elegance."',
  'Mechanical, compound words, references iron/void/industry. Examples: Rebargolem, Voidforge, Ironclad, Gravwell.',
  '#6B7B8D',
  '#E07020',
  '#1A1D23',
  'industrial_sparks'
),
(
  'a0000000-0000-0000-0000-000000000002',
  'The Fey Courts',
  'FEY_COURTS',
  'BOND',
  'high fantasy fey art, ancient forests, bioluminescent flora, antlered fey lords, mossy stone circles, living wood armor, mycelial networks, wild hunt imagery, ethereal green-blue lighting, organic flowing forms',
  'Enigmatic, ancient, references nature cycles and the wild hunt. Poetic and slightly ominous. "The forest remembers what mortals forget."',
  'Nature-inspired, compound words, references flora/fauna/seasons. Examples: Thornweave, Moonbloom, Roothold, Briarsong.',
  '#2D7A4F',
  '#7BC8A4',
  '#0F1F15',
  'bioluminescent_spores'
),
(
  'a0000000-0000-0000-0000-000000000003',
  'The Demonic Kingdoms',
  'DEMONIC_KINGDOMS',
  'CORRUPTION',
  'dark fantasy demonic art, hellfire, obsidian fortresses, demonic horns and wings, blood rituals, ash-choked wastelands, infernal glyphs, corrupted flesh, crimson and black lighting, aggressive angular forms',
  'Menacing, imperious, references power and sacrifice. Dark bargains. "Every throne is built on bones."',
  'Aggressive, harsh sounds, references fire/blood/darkness. Examples: Ashfang, Doomcrest, Bloodforge, Hellscorn.',
  '#8B0000',
  '#FF4444',
  '#1A0A0A',
  'hellfire_embers'
),
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
-- 2. AVATARS (10 avatars, 2 per faction)
-- ============================================================================

INSERT INTO avatars (id, name, faction_id, instability_modifier, title, lore_text, unlock_condition) VALUES
-- Ironwright Collective (rethemed: brutalist space-industrial)
(
  'b0000000-0000-0000-0000-000000000001',
  'Aldric, the Forgemaster',
  'a0000000-0000-0000-0000-000000000001',
  -5,
  'The Forgemaster',
  'Master of the Orbital Foundry, Aldric believes in precision and order. Every piston firing on schedule, every reactor calibrated to the microgram. His constructs are marvels of void-engineering — slow to build, impossible to break.',
  '{"type": "FREE_STARTER"}'::jsonb
),
(
  'b0000000-0000-0000-0000-000000000002',
  'Vex, the Entropy Smith',
  'a0000000-0000-0000-0000-000000000001',
  -2,
  'The Entropy Smith',
  'Where Aldric sees order, Vex sees opportunity in entropy. Her inventions push the boundaries of what cold iron and reactor fuel can endure — overclocked, overheated, and devastatingly effective. Until they detonate.',
  '{"type": "FREE_STARTER"}'::jsonb
),
-- Fey Courts
(
  'b0000000-0000-0000-0000-000000000003',
  'Sylara, the Verdant Warden',
  'a0000000-0000-0000-0000-000000000002',
  -5,
  'The Verdant Warden',
  'Sylara tends the Evergrove, the living heart of the Fey Courts. Her bond with the forest runs deeper than roots — when she calls, the trees themselves answer. Patient, enduring, inevitable.',
  '{"type": "FREE_STARTER"}'::jsonb
),
(
  'b0000000-0000-0000-0000-000000000004',
  'Morrigan, the Wild Huntress',
  'a0000000-0000-0000-0000-000000000002',
  -1,
  'The Wild Huntress',
  'Morrigan leads the Wild Hunt — a primal force of nature that sweeps through the Courts when the moon bleeds. She embraces chaos as the natural order, a storm that clears the way for new growth.',
  '{"type": "FREE_STARTER"}'::jsonb
),
-- Demonic Kingdoms
(
  'b0000000-0000-0000-0000-000000000005',
  'Kael, the Bound Tyrant',
  'a0000000-0000-0000-0000-000000000003',
  -4,
  'The Bound Tyrant',
  'Kael rules through binding pacts — every demon in his domain owes a debt. He channels the power of Corruption through chains of obligation, maintaining order through the promise of shared destruction.',
  '{"type": "FREE_STARTER"}'::jsonb
),
(
  'b0000000-0000-0000-0000-000000000006',
  'Lilith, the Unbound',
  'a0000000-0000-0000-0000-000000000003',
  -2,
  'The Unbound',
  'Lilith rejected every pact, every chain, every throne. She burns with uncontrolled Corruption — a walking cataclysm who traded safety for raw, untethered power. She will consume everything, herself included.',
  '{"type": "FREE_STARTER"}'::jsonb
),
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
-- 3. EVENT DEFINITIONS (16 events from doc 01 Sections 8-9)
-- ============================================================================

-- Order Events (8)
INSERT INTO event_definitions (id, name, event_type, effect, description, design_notes, can_backfire) VALUES
(
  'O1', 'Mending Light', 'ORDER',
  '{"effect_type": "HEAL", "target": "LOWEST_HP_FRIENDLY", "value": 3}'::jsonb,
  'Heal your most damaged creature for 3 HP. If tied, leftmost (lowest slot).',
  'Reliable sustain. Keeps your key creature alive. Synergizes with high-HP creatures and Lifesteal.',
  FALSE
),
(
  'O2', 'Planar Ward', 'ORDER',
  '{"effect_type": "GRANT_KEYWORD", "target": "FRIENDLY_CREATURE", "keyword": "SHIELD"}'::jsonb,
  'Grant Shield to a friendly creature of your choice that does not already have Shield. If all creatures have Shield, heal your avatar for 1 HP instead.',
  'Huge value on the right target. Player agency. Shield keyword creatures can get double value.',
  FALSE
),
(
  'O3', 'Steady Growth', 'ORDER',
  '{"effect_type": "STAT_MODIFY_HEALTH", "target": "ALL_FRIENDLY", "value": 1, "duration": "PERMANENT"}'::jsonb,
  'All your creatures get +0/+1 permanently.',
  'Compounds fast on wide boards. 3 creatures = +3 total HP. Rewards Fey Courts/Bond and Order sustain.',
  FALSE
),
(
  'O4', 'Clarity', 'ORDER',
  '{"effect_type": "DRAW_CARD", "target": "PLAYER_SELF", "value": 1}'::jsonb,
  'Draw 1 card.',
  'Simple card advantage. Slightly weaker in raw board impact, but flexibility is powerful.',
  FALSE
),
(
  'O5', 'Fortify', 'ORDER',
  '{"effect_type": "STAT_MODIFY_ATTACK", "target": "FRIENDLY_CREATURE", "value": 1, "duration": "PERMANENT", "secondary_effect": {"effect_type": "STAT_MODIFY_HEALTH", "target": "FRIENDLY_CREATURE", "value": 1, "duration": "PERMANENT"}}'::jsonb,
  'A friendly creature of your choice gets +1/+1 permanently.',
  'Player chooses target. Small but permanent and targeted. Put it on your best creature to snowball.',
  FALSE
),
(
  'O6', 'Sanctuary', 'ORDER',
  '{"effect_type": "HEAL_PLAYER", "target": "PLAYER_SELF", "value": 3}'::jsonb,
  'Heal your avatar for 3 HP.',
  'Face healing. Extends the game, which favors Orders compounding strategy. Anti-aggro.',
  FALSE
),
(
  'O7', 'Bulwark', 'ORDER',
  '{"effect_type": "STAT_MODIFY_HEALTH", "target": "LOWEST_HP_FRIENDLY", "value": 2, "duration": "PERMANENT"}'::jsonb,
  'Your creature with the lowest current HP gets +0/+2 permanently. If tied, leftmost.',
  'Predictable targeting. Shores up your weakest link. Pairs well with Deathtouch creatures.',
  FALSE
),
(
  'O8', 'Harmonize', 'ORDER',
  '{"effect_type": "HEAL", "target": "ALL_FRIENDLY", "value": 2, "condition": {"type": "TARGET_AT_FULL_HP", "fallback": {"effect_type": "STAT_MODIFY_HEALTH", "target": "SELF", "value": 1, "duration": "PERMANENT"}}}'::jsonb,
  'All your creatures heal 2 HP. Any creature already at full HP gets +0/+1 permanently instead.',
  'Board-wide sustain. On a healthy board, becomes Steady Growth. On a damaged board, 2 HP heal to everything.',
  FALSE
),

-- Chaos Events (8)
(
  'C1', 'Surge', 'CHAOS',
  '{"effect_type": "STAT_MODIFY_ATTACK", "target": "RANDOM_FRIENDLY", "value": 3, "duration": "THIS_TURN"}'::jsonb,
  'A random friendly creature gets +3 ATK this turn.',
  'Pure burst. On a Piercing creature, potentially +3 face damage. Temporary — Chaos spikes, not builds.',
  FALSE
),
(
  'C2', 'Wildfire', 'CHAOS',
  '{"effect_type": "DAMAGE", "target": "RANDOM_ENEMY", "value": 2}'::jsonb,
  'Deal 2 damage to a random enemy creature.',
  'Targeted removal. Can snipe a key creature or waste itself on a beefy tank. Randomness creates tension.',
  FALSE
),
(
  'C3', 'Upheaval', 'CHAOS',
  '{"effect_type": "DAMAGE", "target": "ALL_CREATURES", "value": 1}'::jsonb,
  'Deal 1 damage to ALL creatures on the board (both sides).',
  'Board-wide damage. Kills all 1-HP creatures. Backfire risk — your own fragile creatures die too. Breaks Shields on both sides.',
  TRUE
),
(
  'C4', 'Frenzy', 'CHAOS',
  '{"effect_type": "STAT_MODIFY_ATTACK", "target": "ALL_FRIENDLY", "value": 1, "duration": "THIS_TURN"}'::jsonb,
  'ALL your creatures get +1 ATK this turn.',
  'Board-wide aggression. On 4 creatures, +4 total damage. Rewards wide boards, but temporary.',
  FALSE
),
(
  'C5', 'Rift Bolt', 'CHAOS',
  '{"effect_type": "DAMAGE", "target": "PLAYER_OPPONENT", "value": 3}'::jsonb,
  'Deal 3 damage to the enemy avatar.',
  'Direct face damage, bypasses all creatures. Pure aggro. Adds up to 6-9 face damage over a game.',
  FALSE
),
(
  'C6', 'Chaos Siphon', 'CHAOS',
  '{"effect_type": "DAMAGE", "target": "RANDOM_FRIENDLY", "value": 2, "secondary_effect": {"effect_type": "STAT_MODIFY_ATTACK", "target": "SELF", "value": 3, "duration": "PERMANENT"}}'::jsonb,
  'Deal 2 damage to a random friendly creature. That creature gets +3 ATK permanently. If the damage kills it, the buff is wasted.',
  'High risk, high reward. On a 5-HP creature, fantastic. On a 2-HP creature, you just killed your own creature.',
  TRUE
),
(
  'C7', 'Maelstrom', 'CHAOS',
  '{"effect_type": "DAMAGE", "target": "RANDOM_ANY", "value": 3}'::jsonb,
  'Deal 3 damage to a random creature on the board (either side).',
  'The most volatile event. Can remove an enemy threat or destroy your own creature. Rare but memorable.',
  TRUE
),
(
  'C8', 'Overcharge', 'CHAOS',
  '{"effect_type": "STAT_MODIFY_ATTACK", "target": "RANDOM_FRIENDLY", "value": 2, "duration": "THIS_TURN", "secondary_effect": {"effect_type": "GRANT_KEYWORD", "target": "SELF", "keyword": "PIERCING", "duration": "THIS_TURN"}}'::jsonb,
  'A random friendly creature gains +2 ATK and Piercing this turn. If it already has Piercing, it gets +4 ATK instead.',
  'Keyword grant + burst. Temporary Piercing on a high-ATK creature can deal massive face damage through a blocker.',
  FALSE
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. ECONOMY CONFIG (from doc 04 Section 9 / doc 06 Section 3.1)
-- ============================================================================

INSERT INTO economy_config (key, value, description) VALUES
  -- Match rewards
  ('dust_per_win', '15', 'Chaos Dust earned per match win'),
  ('dust_per_loss', '5', 'Chaos Dust earned per match loss'),

  -- Card pack costs
  ('card_pack_cost_own_faction', '100', 'Dust cost for own faction pack (3 random Commons)'),
  ('card_pack_cost_other_faction', '150', 'Dust cost for other faction pack (3 Commons + unlock)'),
  ('specific_common_cost', '50', 'Dust cost for targeted Common purchase'),

  -- Shard costs
  ('shard_cost_uncommon', '30', 'Dust cost for Uncommon shard'),
  ('shard_cost_rare', '60', 'Dust cost for Rare shard'),
  ('shard_cost_epic', '120', 'Dust cost for Epic shard'),
  ('shard_cost_legendary', '240', 'Dust cost for Legendary shard'),

  -- Avatar cost
  ('avatar_unlock_cost', '300', 'Dust cost for avatar unlock'),

  -- Chaos energy
  ('energy_per_win', '2', 'Chaos energy per card per win'),
  ('energy_per_loss', '1', 'Chaos energy per card per loss'),
  ('energy_threshold_uncommon', '15', 'Energy needed for Common -> Uncommon'),
  ('energy_threshold_rare', '30', 'Energy needed for Uncommon -> Rare'),
  ('energy_threshold_epic', '50', 'Energy needed for Rare -> Epic'),
  ('energy_threshold_legendary', '75', 'Energy needed for Epic -> Legendary'),

  -- Evolution daily caps
  ('evolution_daily_cap_free', '5', 'Max evolutions per day for free tier'),
  ('evolution_daily_cap_mid', '15', 'Max evolutions per day for mid tier'),
  ('evolution_daily_cap_high', '30', 'Max evolutions per day for high tier'),

  -- Ranked point values
  ('ranked_points_win_same', '25', 'Points for winning vs same rank'),
  ('ranked_points_loss_same', '-20', 'Points for losing vs same rank'),
  ('ranked_points_win_higher', '30', 'Points for winning vs higher rank (+1-2 divisions)'),
  ('ranked_points_loss_higher', '-15', 'Points for losing vs higher rank'),
  ('ranked_points_win_lower', '20', 'Points for winning vs lower rank (-1-2 divisions)'),
  ('ranked_points_loss_lower', '-25', 'Points for losing vs lower rank'),
  ('ranked_points_win_much_higher', '35', 'Points for winning vs much higher rank (+3 divisions)'),
  ('ranked_points_loss_much_higher', '-10', 'Points for losing vs much higher rank'),
  ('ranked_points_win_much_lower', '15', 'Points for winning vs much lower rank (-3 divisions)'),
  ('ranked_points_loss_much_lower', '-30', 'Points for losing vs much lower rank'),

  -- Season
  ('season_length_weeks', '8', 'Season duration in weeks'),

  -- Subscription quest multipliers (doc 04 Section 2.2)
  ('quest_multiplier_free', '1.0', 'Quest dust multiplier for FREE tier'),
  ('quest_multiplier_mid', '1.5', 'Quest dust multiplier for MID tier'),
  ('quest_multiplier_high', '2.0', 'Quest dust multiplier for HIGH tier'),

  -- Onboarding starter bonus (doc 04 Section 6.1)
  ('onboarding_dust_bonus', '200', 'One-time Chaos Dust given at faction commitment'),
  ('onboarding_shards_uncommon', '3', 'Starter Uncommon shards'),
  ('onboarding_shards_rare', '1', 'Starter Rare shards'),
  ('onboarding_shards_legendary', '1', 'Starter Legendary shards'),

  -- Collection limits by tier
  ('max_cards_free', '50', 'Max cards per faction for free tier'),
  ('max_cards_mid', '100', 'Max cards per faction for mid tier'),
  ('max_cards_high', '200', 'Max cards per faction for high tier'),
  ('max_decks_free', '3', 'Max deck slots for free tier'),
  ('max_decks_mid', '6', 'Max deck slots for mid tier'),
  ('max_decks_high', '10', 'Max deck slots for high tier'),

  -- Season rewards by rank (doc 04 Section 5.5)
  ('season_reward_bronze_dust', '100', 'Season end dust reward for Bronze'),
  ('season_reward_silver_dust', '200', 'Season end dust reward for Silver'),
  ('season_reward_gold_dust', '400', 'Season end dust reward for Gold'),
  ('season_reward_platinum_dust', '600', 'Season end dust reward for Platinum'),
  ('season_reward_diamond_dust', '800', 'Season end dust reward for Diamond'),
  ('season_reward_master_dust', '1000', 'Season end dust reward for Master'),
  ('season_reward_grandmaster_dust', '1500', 'Season end dust reward for Grandmaster')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 5. QUEST TEMPLATES (30 total: 20 daily + 10 weekly from doc 04 Section 4)
-- ============================================================================

-- Daily quests (20)
INSERT INTO quest_templates (id, mission_type, difficulty, period, description, target_value, base_dust, shard_reward_tier, shard_reward_count, shard_reward_chance) VALUES
  ('D01', 'WIN_GAMES',              'EASY',   'DAILY', 'Win 2 games',                             2,  20, NULL,       0, 0.00),
  ('D02', 'PLAY_GAMES',             'EASY',   'DAILY', 'Play 3 games (any result)',                3,  20, NULL,       0, 0.00),
  ('D03', 'PLAY_CREATURES',         'EASY',   'DAILY', 'Play 15 creatures',                       15,  20, NULL,       0, 0.00),
  ('D04', 'PLAY_SPELLS',            'EASY',   'DAILY', 'Play 5 spells',                            5,  20, NULL,       0, 0.00),
  ('D05', 'WIN_GAMES',              'MEDIUM', 'DAILY', 'Win 3 games',                              3,  30, 'UNCOMMON', 1, 0.20),
  ('D06', 'PLAY_CREATURES',         'MEDIUM', 'DAILY', 'Play 25 creatures',                       25,  30, 'UNCOMMON', 1, 0.20),
  ('D07', 'DEAL_DAMAGE',            'MEDIUM', 'DAILY', 'Deal 30 damage to enemy creatures',       30,  30, 'UNCOMMON', 1, 0.20),
  ('D08', 'TRIGGER_CHAOS_EVENTS',   'MEDIUM', 'DAILY', 'Trigger 5 Chaos Events',                   5,  30, 'UNCOMMON', 1, 0.20),
  ('D09', 'TRIGGER_ORDER_EVENTS',   'MEDIUM', 'DAILY', 'Trigger 5 Order Events',                   5,  30, 'UNCOMMON', 1, 0.20),
  ('D10', 'EVOLVE_CARD',            'MEDIUM', 'DAILY', 'Evolve 1 card to any tier',                1,  30, 'UNCOMMON', 1, 0.20),
  ('D11', 'WIN_GAMES',              'HARD',   'DAILY', 'Win 5 games',                              5,  45, 'RARE',     1, 0.30),
  ('D12', 'PLAY_CARDS',             'HARD',   'DAILY', 'Play 50 cards total (any type)',           50,  45, 'RARE',     1, 0.30),
  ('D13', 'WIN_WITH_STYLE',         'HARD',   'DAILY', 'Win 2 games with 15+ HP remaining',        2,  45, 'RARE',     1, 0.30),
  ('D14', 'DEAL_DAMAGE',            'HARD',   'DAILY', 'Deal 60 damage to enemy creatures',       60,  45, 'RARE',     1, 0.30),
  ('D15', 'PLAY_CREATURES',         'HARD',   'DAILY', 'Play 20 creatures costing 3+ mana',       20,  45, 'RARE',     1, 0.30),
  ('D16', 'PLAY_SPELLS',            'HARD',   'DAILY', 'Play 10 spells',                          10,  45, 'RARE',     1, 0.30),
  ('D17', 'TRIGGER_CHAOS_EVENTS',   'HARD',   'DAILY', 'Trigger 10 Chaos Events',                 10,  45, 'RARE',     1, 0.30),
  ('D18', 'TRIGGER_ORDER_EVENTS',   'HARD',   'DAILY', 'Trigger 10 Order Events',                 10,  45, 'RARE',     1, 0.30),
  ('D19', 'WIN_WITH_STYLE',         'HARD',   'DAILY', 'Win a game with 3+ Legendary cards on board at end', 1, 45, 'RARE', 1, 0.30),
  ('D20', 'WIN_WITH_STYLE',         'HARD',   'DAILY', 'Win a game without any of your creatures dying', 1, 45, 'RARE', 1, 0.30)
ON CONFLICT (id) DO NOTHING;

-- Weekly quests (10)
INSERT INTO quest_templates (id, mission_type, difficulty, period, description, target_value, base_dust, shard_reward_tier, shard_reward_count, shard_reward_chance) VALUES
  ('W01', 'WIN_GAMES',              'MEDIUM', 'WEEKLY', 'Win 10 games this week',                  10, 150, 'RARE',  1, 1.00),
  ('W02', 'WIN_GAMES',              'HARD',   'WEEKLY', 'Win 15 games this week',                  15, 200, 'EPIC',  1, 1.00),
  ('W03', 'PLAY_GAMES',             'MEDIUM', 'WEEKLY', 'Play 20 games this week',                 20, 150, 'RARE',  1, 1.00),
  ('W04', 'EVOLVE_CARD',            'MEDIUM', 'WEEKLY', 'Evolve 3 cards this week',                 3, 150, 'RARE',  2, 1.00),
  ('W05', 'EVOLVE_CARD',            'HARD',   'WEEKLY', 'Evolve 5 cards to Rare or higher this week', 5, 200, 'EPIC', 1, 1.00),
  ('W06', 'PLAY_CREATURES',         'MEDIUM', 'WEEKLY', 'Play 100 creatures this week',           100, 150, 'RARE',  1, 1.00),
  ('W07', 'DEAL_DAMAGE',            'MEDIUM', 'WEEKLY', 'Deal 200 damage to enemy creatures this week', 200, 150, 'RARE', 1, 1.00),
  ('W08', 'TRIGGER_CHAOS_EVENTS',   'MEDIUM', 'WEEKLY', 'Trigger 20 Chaos Events this week',       20, 150, 'RARE',  1, 1.00),
  ('W09', 'TRIGGER_ORDER_EVENTS',   'MEDIUM', 'WEEKLY', 'Trigger 20 Order Events this week',       20, 150, 'RARE',  1, 1.00),
  ('W10', 'WIN_WITH_STYLE',         'HARD',   'WEEKLY', 'Win 5 games with 3+ Legendary cards on board', 5, 200, 'EPIC', 1, 1.00)
ON CONFLICT (id) DO NOTHING;

-- Expansion quests: daily (8) + weekly (4) for new factions/mechanics/ruins
INSERT INTO quest_templates (id, mission_type, difficulty, period, description, target_value, base_dust, shard_reward_tier, shard_reward_count, shard_reward_chance) VALUES
  ('D21', 'PLAY_CARDS',             'EASY',   'DAILY', 'Play 3 Planar Ruins',                         3,  20, NULL,       0, 0.00),
  ('D22', 'WIN_GAMES',              'MEDIUM', 'DAILY', 'Win 2 games with a Celestial Crusade deck',   2,  30, 'UNCOMMON', 1, 0.20),
  ('D23', 'WIN_GAMES',              'MEDIUM', 'DAILY', 'Win 2 games with an Endless deck',            2,  30, 'UNCOMMON', 1, 0.20),
  ('D24', 'DEAL_DAMAGE',            'MEDIUM', 'DAILY', 'Trigger Exalt on 5 creatures',                5,  30, 'UNCOMMON', 1, 0.20),
  ('D25', 'DEAL_DAMAGE',            'MEDIUM', 'DAILY', 'Trigger Persist on 5 creatures',              5,  30, 'UNCOMMON', 1, 0.20),
  ('D26', 'PLAY_CREATURES',         'HARD',   'DAILY', 'Play 10 creatures with Haste',               10,  45, 'RARE',     1, 0.30),
  ('D27', 'PLAY_CREATURES',         'HARD',   'DAILY', 'Play 10 creatures with Ward',                10,  45, 'RARE',     1, 0.30),
  ('D28', 'WIN_WITH_STYLE',         'HARD',   'DAILY', 'Win a game with 2+ Planar Ruins on board',    1,  45, 'RARE',     1, 0.30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quest_templates (id, mission_type, difficulty, period, description, target_value, base_dust, shard_reward_tier, shard_reward_count, shard_reward_chance) VALUES
  ('W11', 'WIN_GAMES',              'MEDIUM', 'WEEKLY', 'Win 5 games with Celestial or Endless decks', 5, 150, 'RARE',  1, 1.00),
  ('W12', 'PLAY_CARDS',             'MEDIUM', 'WEEKLY', 'Play 15 Planar Ruins this week',             15, 150, 'RARE',  1, 1.00),
  ('W13', 'DEAL_DAMAGE',            'HARD',   'WEEKLY', 'Trigger Exalt or Persist 25 times this week', 25, 200, 'EPIC', 1, 1.00),
  ('W14', 'WIN_WITH_STYLE',         'HARD',   'WEEKLY', 'Win 3 games with all 5 factions this week',   3, 200, 'EPIC', 1, 1.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. ACHIEVEMENTS (20+ from doc 00 Section 15 / doc 02 Section 17)
-- ============================================================================

INSERT INTO achievements (name, description, category, target_value, reward_type, reward_amount, reward_title) VALUES
-- Evolution achievements
('First Steps',           'Evolve your first card to Uncommon',                    'EVOLUTION',   1, 'XP',    100, NULL),
('Rising Power',          'Evolve your first card to Rare',                        'EVOLUTION',   1, 'XP',    250, NULL),
('Epic Achievement',      'Evolve your first card to Epic',                        'EVOLUTION',   1, 'XP',    500, 'Shard Breaker'),
('Living Legend',         'Evolve your first card to Legendary',                   'EVOLUTION',   1, 'XP',   1000, 'Legend Forger'),
('Evolution Addict',      'Evolve 10 cards to Rare or higher',                    'EVOLUTION',  10, 'XP',    500, NULL),
('Chaos Devoted',         'Evolve a card with 4 Chaos evolution outcomes',         'EVOLUTION',   1, 'XP',    750, 'Chaos Touched'),
('Order Devoted',         'Evolve a card with 4 Order evolution outcomes',         'EVOLUTION',   1, 'XP',    750, 'Order Warden'),
('Balanced Path',         'Evolve a card with a 2 Order / 2 Chaos split',         'EVOLUTION',   1, 'XP',    500, NULL),

-- Battle achievements
('First Blood',           'Win your first game',                                   'BATTLE',      1, 'XP',     50, NULL),
('Centurion',             'Win 100 games',                                         'BATTLE',    100, 'XP',   1000, NULL),
('The Unbroken',          'Win 10 games in a row',                                 'BATTLE',     10, 'XP',   1500, 'The Unbroken'),
('Against All Odds',      'Win a game at 1 HP',                                    'BATTLE',      1, 'XP',    500, NULL),
('Purist',                'Win a game without playing a spell',                     'BATTLE',      1, 'XP',    300, NULL),
('Veteran',               'Play 500 games',                                        'BATTLE',    500, 'XP',   2000, 'Veteran'),

-- Collection achievements
('Hoarder',               'Own 50 cards',                                          'COLLECTION', 50, 'XP',    300, NULL),
('Faction Explorer',      'Own cards in all 5 factions',                           'COLLECTION',  5, 'XP',    500, NULL),
('Pure Attunement',       'Own a card with 4 modifiers all of the same attunement', 'COLLECTION', 1, 'XP',   750, NULL),

-- Celestial Crusade achievements
('Crusader Initiate',     'Win 10 games with a Celestial Crusade deck',            'BATTLE',     10, 'XP',    500, NULL),
('Radiant Champion',      'Win 50 games with a Celestial Crusade deck',            'BATTLE',     50, 'XP',   1500, 'Radiant Champion'),
('Divine Mandate',        'Trigger Exalt 100 times',                               'BATTLE',    100, 'XP',   1000, 'Exalted'),
('Heaven''s Chosen',      'Evolve 10 Celestial Crusade cards to Rare or higher',   'EVOLUTION',  10, 'XP',    750, NULL),

-- The Endless achievements
('Whisper in the Dark',   'Win 10 games with an Endless deck',                     'BATTLE',     10, 'XP',    500, NULL),
('Inevitable',            'Win 50 games with an Endless deck',                     'BATTLE',     50, 'XP',   1500, 'The Inevitable'),
('Undying Will',          'Trigger Persist 100 times',                             'BATTLE',    100, 'XP',   1000, 'Undying'),
('Beyond the Veil',       'Evolve 10 Endless cards to Rare or higher',             'EVOLUTION',  10, 'XP',    750, NULL),

-- Planar Ruins achievements
('Ruin Architect',        'Play 50 Planar Ruins',                                  'COLLECTION', 50, 'XP',    500, NULL),
('Five Factions',         'Own cards in all 5 factions',                            'COLLECTION',  5, 'XP',   1000, 'Planeswalker'),

-- Chaos Roll achievements
('Natural One',           'Roll a natural 1 on the D20',                           'CHAOS_ROLL',  1, 'XP',    100, NULL),
('Natural Twenty',        'Roll a natural 20 on the D20',                          'CHAOS_ROLL',  1, 'XP',    100, NULL),
('Chaos Storm',           'Trigger 5 Chaos Events in a single game',              'CHAOS_ROLL',  5, 'XP',    500, NULL),

-- Social achievements
('Friendly',              'Add a friend',                                          'SOCIAL',      1, 'XP',     50, NULL),
('Friendly Rivalry',      'Win a friendly match',                                  'SOCIAL',      1, 'XP',    100, NULL),
('Stalker',               'View another players profile',                          'SOCIAL',      1, 'XP',     25, NULL)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 7. INITIAL SEASON (Season 1)
-- ============================================================================

INSERT INTO seasons (season_number, name, starts_at, ends_at, is_active) VALUES
(1, 'Season of Awakening', '2026-03-01T00:00:00Z', '2026-04-26T23:59:59Z', TRUE)
ON CONFLICT (season_number) DO NOTHING;

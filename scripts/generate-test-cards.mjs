#!/usr/bin/env node
// generate-test-cards.mjs — Local card generation script
// Bypasses Edge Functions and calls fal.ai + OpenAI + R2 + Supabase directly.
// Usage: node scripts/generate-test-cards.mjs

import { createClient } from '../packages/game-server/node_modules/@supabase/supabase-js/dist/index.mjs';
import { createHmac, createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load env from game-server/.env
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../packages/game-server/.env');
const envText = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const FAL_KEY = env.FAL_KEY;
const OPENAI_API_KEY = env.OPENAI_API_KEY;
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = env.R2_PUBLIC_URL;

// Validate all keys present
const required = { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FAL_KEY, OPENAI_API_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL };
for (const [k, v] of Object.entries(required)) {
  if (!v) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ==========================================================================
// Prompt constants (from supabase/functions/_shared/prompts.ts)
// ==========================================================================

// v4 style anchor: 1990s MTG artists, ink linework, sketchy rendering
const STYLE_ANCHOR =
  '1990s Magic: The Gathering illustration, painted by Ron Spencer and Pete Venters and Mark Poole, ' +
  'traditional media on illustration board, visible brushstrokes and ink linework, ' +
  'sketchy atmospheric rendering with areas left loose, moody chiaroscuro with a single dramatic light source, ' +
  'muted earth tones and desaturated palette, gritty textured surface with grain and tooth, ' +
  'raw unpolished asymmetric forms, dark atmospheric mood, ' +
  '3:4 portrait ratio, no text no borders no watermarks';

// v4 faction prefixes with updated artist references
const FACTION_PREFIXES = {
  IRONWRIGHT:
    'grimy industrial steampunk creature, corroded brass and blackened iron, ' +
    'oil-stained and soot-caked, dented riveted plates with weld scars, ' +
    'warm ochre and raw umber palette, smoky atmospheric background, ' +
    'painted like a Ron Spencer or Mark Tedin industrial horror',
  FEY_COURTS:
    'dark fey forest creature, twisted ancient wood and thorns, unsettling and wild, ' +
    'dappled green-gold light filtering through dense canopy, muted forest palette, ' +
    'overgrown with moss and lichen, more Brothers Grimm than Disney, ' +
    'painted like a Rebecca Guay or Quinton Hoover ethereal watercolor',
  DEMONIC:
    'grotesque infernal creature, fused bone and volcanic rock and dried gore, ' +
    'lit from below by hellfire glow, deep shadow obscuring details, ' +
    'burnt crimson and charcoal black palette, oppressive and heavy, ' +
    'painted like a Pete Venters or Anson Maddocks grotesque dark fantasy',
};

const COMPOSITION_INSTRUCTION =
  'three-quarter view creature portrait, strong silhouette, atmospheric murky background, ' +
  'single harsh light source casting deep shadows, old master painting composition, ' +
  'rough textured brushwork throughout, NOT clean NOT smooth NOT digital';

// Composition pool — 25 templates for art variety (mirrors prompts.ts v4)
const COMPOSITION_POOL = {
  // Original 12
  PORTRAIT_CLOSE: 'extreme close-up portrait, face fills frame, intense eye contact, shallow depth of field',
  PORTRAIT_THREE_QUARTER: 'three-quarter view portrait, shoulders and head, slight turn, atmospheric background',
  ACTION_ATTACK: 'dynamic action pose mid-strike, motion blur on weapon, debris flying, low camera angle',
  ACTION_DEFEND: 'defensive stance, shield raised, bracing for impact, ground-level perspective',
  ACTION_CAST: 'arms raised channeling energy, magical particles swirling, dramatic backlighting',
  ENVIRONMENTAL_WIDE: 'wide establishing shot, creature small in vast landscape, epic scale, deep perspective',
  ENVIRONMENTAL_EMERGING: 'creature emerging from faction environment, half-hidden, atmospheric fog/mist',
  DRAMATIC_LOW_ANGLE: 'extreme low angle looking up, creature towers overhead, dramatic sky behind',
  DRAMATIC_SILHOUETTE: 'silhouette against dramatic sky/explosion/portal, rim lighting, high contrast',
  DETAIL_MACRO: 'macro detail shot of distinctive feature (claws/eyes/armor/wings), shallow depth of field',
  NARRATIVE_MOMENT: 'mid-narrative scene, creature interacting with environment, storytelling composition',
  NARRATIVE_DUAL: 'two creatures in frame, confrontation or alliance, split composition',
  // 13 new v4 templates
  PORTRAIT_PROFILE: 'strict side profile portrait, single eye visible, dramatic rim light on edges, shallow depth of field',
  PORTRAIT_FROM_BEHIND: 'creature seen from behind, looking over shoulder, mysterious and atmospheric, environment visible ahead',
  PORTRAIT_EXTREME_WIDE: 'creature tiny in vast panoramic landscape, sense of scale and isolation, atmospheric perspective',
  ACTION_LEAP: 'creature mid-leap through air, dynamic diagonal composition, wind and debris, frozen motion',
  ACTION_PROWL: 'creature stalking low to the ground, predatory tension, compressed coiled energy, ground-level camera',
  ACTION_COMMAND: 'creature in commanding stance, arm or limb raised directing others, imperial authority, elevated position',
  ENVIRONMENTAL_UNDERGROUND: 'deep underground cavern scene, creature amid stalactites and mineral formations, bioluminescent or firelit',
  ENVIRONMENTAL_SKYBORNE: 'creature high above ground, aerial perspective, clouds and landscape far below, vertigo-inducing',
  ENVIRONMENTAL_THRESHOLD: 'creature standing in doorway or arch, light from one side dark from other, liminal dramatic framing',
  DRAMATIC_OVERHEAD: 'extreme overhead bird-eye view looking straight down, creature foreshortened, dramatic radial composition',
  DRAMATIC_DUTCH_ANGLE: 'tilted camera angle creating unease, diagonal horizon line, off-balance dynamic energy',
  NARRATIVE_AFTERMATH: 'creature surveying aftermath of battle, wreckage and smoke, contemplative or victorious mood',
  NARRATIVE_RITUAL: 'creature engaged in ritual or transformation, magical energy gathering, ceremonial setting',
};

// Faction environments — 13 per faction (mirrors prompts.ts v4)
const FACTION_ENVIRONMENTS = {
  ironwright: [
    'inside a vast steam-powered foundry with molten metal rivers and chain-driven machinery',
    'atop a massive clockwork bridge spanning a canyon of interlocking gears',
    'in a brass and copper workshop littered with half-finished automata and blueprints',
    'on the observation deck of a towering industrial spire belching steam into orange skies',
    'inside a walking factory, mechanical legs visible through floor grates, landscape moving outside windows',
    'inside a collapsed mine shaft, sparking electrical cables and leaking hydraulic fluid, emergency red lighting',
    'on the deck of a massive iron warship, smokestacks belching, ocean of molten slag',
    'in a subterranean geothermal plant where pipes carry magma through brass conduits',
    'atop a rusted water tower overlooking an endless industrial sprawl of chimneys and rail yards',
    'inside an abandoned automaton graveyard, defunct mechanical bodies piled high, one eye still flickering',
    'in a pressurized boiler room, gauges redlining, steam jetting from failed seals',
    'on an elevated rail bridge during a thunderstorm, lightning striking copper rod arrays',
    'inside a crystal-powered computation engine room, spinning relay drums and clicking gears processing data',
  ],
  fey: [
    'in a moonlit glade where bioluminescent mushrooms cast soft blue-green light on ancient stones',
    'beneath the canopy of the World Tree, roots thick as rivers, leaves filtering golden twilight',
    'at the shore of an enchanted lake reflecting a sky full of aurora and floating islands',
    'in a twilight meadow of giant wildflowers where fireflies spell out forgotten runes',
    'deep inside a crystal cave where living gemstones hum with harmonic resonance',
    'in a flooded temple ruin overtaken by sacred lotus and silver fish, moonlight on still water',
    'on the back of a slowly walking mountain-turtle, forest growing on its shell, horizon tilting',
    'inside the hollow trunk of a dead god-tree, fungal constellations on the inner walls',
    'at the border where the fey realm bleeds into the mortal world, colors shifting from vibrant to muted',
    'in a field of petrified ancient trees, stone bark crumbling, new saplings pushing through',
    'beneath a frozen waterfall at midnight, ice refracting auroral light into prismatic shards',
    'in a vast underground root network, bioluminescent sap flowing through translucent root walls',
    'on a cliff edge where the forest meets the sea, salt spray and wild roses, storm approaching',
  ],
  demonic: [
    'on a volcanic cliff overlooking a sea of lava, obsidian spires rising from the molten surface',
    'in a throne room built from the bones of fallen titans, hellfire braziers lining the walls',
    'at the edge of a reality rift where the material world crumbles into the void',
    'on an ash-covered battlefield strewn with shattered weapons and smoldering craters',
    'inside a collapsed citadel where gravity fails and stone blocks float in burning air',
    'in a flesh cathedral where walls are living skin and pillars are bone, candles of rendered fat',
    'on a bridge over a river of screaming souls, the far bank shrouded in perpetual darkness',
    'inside a volcanic glass maze reflecting distorted hellfire from every surface',
    'in a coliseum of skulls where lesser demons spectate from tiered bone seats',
    'at the foot of a fallen angel statue, wings broken, altar of dark offerings before it',
    'on a floating obsidian platform above an infinite void, chains anchoring it to nothing visible',
    'in a blood-rain storm, the sky cracked open like a wound, crimson precipitation pooling on basalt',
    'inside a demonic war forge where weapons are hammered from cursed iron and quenched in ichor',
  ],
};

// Weather modifiers — 8 options, applied ~30% of the time (mirrors prompts.ts v4)
const WEATHER_MODIFIERS = [
  'during a violent thunderstorm, rain slashing across the scene, lightning illuminating',
  'in thick rolling fog, visibility limited, shapes half-hidden',
  'during a blizzard of ash or snow, particles filling the air',
  'in scorching heat shimmer, air distorted, mirages at edges',
  'during an eclipse, eerie half-light, corona visible',
  'in gentle rainfall, water droplets catching light, reflective wet surfaces',
  'during a sandstorm of dust or magical particles, abrasive atmosphere',
  'in perfectly still dead air, no movement, oppressive calm before catastrophe',
];

// Time of day — 6 options, applied ~40% of the time (mirrors prompts.ts v4)
const TIME_OF_DAY = [
  'at golden hour, warm amber directional light, long shadows',
  'at blue hour pre-dawn, cool steel-blue atmosphere, world waking',
  'at high noon, harsh overhead light, deep black shadows directly below',
  'at twilight, purple-orange sky gradient, silhouette potential',
  'in deep night, lit only by moonlight and ambient sources, deep blacks',
  'at an unnatural hour, the sky the wrong color, time distorted',
];

// Scale modifiers mapped to mana cost (mirrors prompts.ts v4)
const SCALE_MODIFIERS = {
  TINY: 'the creature is very small, shown relative to normal-sized objects for scale contrast',
  SMALL: 'the creature is smaller than human-sized, compact and agile',
  LARGE: 'the creature is much larger than human-sized, imposing mass and bulk',
  COLOSSAL: 'the creature is enormous, dwarfing the environment, shown from a distance to capture its scale',
};

function selectScale(manaCost) {
  if (manaCost === 1) return SCALE_MODIFIERS.TINY;
  if (manaCost === 2) return SCALE_MODIFIERS.SMALL;
  if (manaCost >= 5 && manaCost <= 6) return SCALE_MODIFIERS.LARGE;
  if (manaCost >= 7) return SCALE_MODIFIERS.COLOSSAL;
  return '';
}

function selectWeather() {
  if (Math.random() > 0.30) return '';
  return WEATHER_MODIFIERS[Math.floor(Math.random() * WEATHER_MODIFIERS.length)];
}

function selectTimeOfDay() {
  if (Math.random() > 0.40) return '';
  return TIME_OF_DAY[Math.floor(Math.random() * TIME_OF_DAY.length)];
}

// Map faction keys to environment lookup keys
const FACTION_ENV_MAP = {
  IRONWRIGHT: 'ironwright',
  FEY_COURTS: 'fey',
  DEMONIC: 'demonic',
};

// v4: updated selectComposition — 25 compositions with probabilistic selection
function selectComposition(spec) {
  const tier = (spec.rarity || '').toUpperCase();
  const keywords = (spec.keywords || []).map(k => k.toUpperCase());
  const manaCost = spec.cm_cost ?? 3;
  const cardType = (spec.card_type || 'CREATURE').toUpperCase();

  // Global probabilistic overrides
  if (Math.random() < 0.10) return COMPOSITION_POOL.DRAMATIC_DUTCH_ANGLE;
  if (Math.random() < 0.15) return COMPOSITION_POOL.ENVIRONMENTAL_THRESHOLD;

  if (cardType === 'STABILIZER') return COMPOSITION_POOL.NARRATIVE_RITUAL;
  if (tier === 'LEGENDARY') return Math.random() > 0.5 ? COMPOSITION_POOL.NARRATIVE_AFTERMATH : COMPOSITION_POOL.NARRATIVE_MOMENT;
  if (tier === 'EPIC') {
    const r = Math.random();
    if (r < 0.33) return COMPOSITION_POOL.DRAMATIC_OVERHEAD;
    if (r < 0.67) return COMPOSITION_POOL.DRAMATIC_SILHOUETTE;
    return COMPOSITION_POOL.DRAMATIC_LOW_ANGLE;
  }
  if (cardType === 'SPELL') return COMPOSITION_POOL.ACTION_CAST;
  if (manaCost >= 6) return COMPOSITION_POOL.ACTION_COMMAND;
  if (manaCost >= 7) return COMPOSITION_POOL.DRAMATIC_LOW_ANGLE;
  if (keywords.includes('LIFESTEAL')) return COMPOSITION_POOL.PORTRAIT_PROFILE;
  if (keywords.includes('REACH')) return COMPOSITION_POOL.PORTRAIT_FROM_BEHIND;
  if (keywords.includes('PIERCING')) return Math.random() > 0.5 ? COMPOSITION_POOL.ACTION_ATTACK : COMPOSITION_POOL.ACTION_LEAP;
  if (keywords.includes('DEATHTOUCH')) return Math.random() > 0.5 ? COMPOSITION_POOL.ACTION_ATTACK : COMPOSITION_POOL.ACTION_PROWL;
  if (keywords.includes('SHIELD') || keywords.includes('TAUNT')) return COMPOSITION_POOL.ACTION_DEFEND;
  if (keywords.includes('FLYING')) return Math.random() > 0.5 ? COMPOSITION_POOL.ENVIRONMENTAL_WIDE : COMPOSITION_POOL.ENVIRONMENTAL_SKYBORNE;
  if (manaCost === 1) return COMPOSITION_POOL.PORTRAIT_EXTREME_WIDE;
  if (manaCost <= 2) return COMPOSITION_POOL.PORTRAIT_CLOSE;
  return COMPOSITION_POOL.PORTRAIT_THREE_QUARTER;
}

function selectEnvironment(factionKey) {
  const envKey = FACTION_ENV_MAP[factionKey] || 'ironwright';
  const envs = FACTION_ENVIRONMENTS[envKey];
  return envs[Math.floor(Math.random() * envs.length)];
}

const NEGATIVE_PROMPT =
  'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, ' +
  'gore, distorted anatomy, multiple heads, deformed limbs, extra limbs, fused body parts, ' +
  '3d render, CGI, photorealistic, airbrushed, smooth plastic skin, digital art, vector art, ' +
  'deviantart, artstation trending, oversaturated, neon glow, stock photo, generic, symmetrical face, ' +
  'white background, collage, grid layout, concept art sheet';

const FACTION_NAME_VOICES = {
  IRONWRIGHT:
    'Industrial and precise. Use engineering terminology: Cogwork, Piston, Valve, Forged, Tempered, Wrought, Clockwork. Use functional titles: Warden, Sentinel, Overseer, Architect. Reference places of craft: Forge, Foundry, Crucible, Anvil. Compound nouns preferred.',
  FEY_COURTS:
    'Lyrical and ancient. Use nature terms: Thorn, Root, Bloom, Vine, Grove, Glade, Moss. Use fey titles: Lord, Lady, Warden, Huntress, Speaker, Court. Use seasons and celestial: Spring, Autumn, Moon, Star, Dawn. Use mythic descriptors: Verdant, Eternal, Wild, Ancient. Poetic structures preferred.',
  DEMONIC:
    'Visceral and direct. Use dark materials: Ash, Bone, Blood, Shadow, Flame, Cinder, Ruin, Void. Use violent action: Reaver, Ripper, Render, Scar, Breaker. Use infernal titles: Tyrant, Lord, Unbound, Forsaken, Damned, Herald. Direct hard sounds preferred.',
};

const FACTION_FLAVOR_TONES = {
  IRONWRIGHT:
    "Technical reverence for craftsmanship. Emphasizes function, precision, and engineering. Order = perfected systems, harmonious mechanisms. Chaos = overloaded, screaming gears, design pushed beyond limits. Tone is clipped and declarative — short sentences that sound like engineer's notes.",
  FEY_COURTS:
    'Ancient and lyrical. Emphasizes cycles, memory, wildness, and time. Order = harmony with nature, patient growth, eternal memory. Chaos = the wild hunt, primal fury, untamed power that predates civilization. Tone is poetic but not flowery — spare and weighted with age.',
  DEMONIC:
    'Visceral and direct. Emphasizes power, sacrifice, consumption, and hunger. Order = controlled fury, pacts honored in blood, restrained corruption. Chaos = unbound carnage, self-immolation for power, apocalyptic hunger. Tone is declarative and ominous — short sentences like dark scripture.',
};

const FACTION_DISPLAY_NAMES = {
  IRONWRIGHT: 'The Ironwright Collective',
  FEY_COURTS: 'The Fey Courts',
  DEMONIC: 'The Demonic Kingdoms',
};

// ==========================================================================
// Card specs: 1 card per faction for testing
// ==========================================================================

const FACTION_IDS = {
  IRONWRIGHT: 'a0000000-0000-0000-0000-000000000001',
  FEY_COURTS: 'a0000000-0000-0000-0000-000000000002',
  DEMONIC: 'a0000000-0000-0000-0000-000000000003',
};

const CARD_SPECS = [
  // Ironwright — a weary old construct, not a shiny hero
  {
    spec_id: 'iron-v4-01',
    faction_key: 'IRONWRIGHT',
    faction_id: FACTION_IDS.IRONWRIGHT,
    creature_archetype: 'Furnace Warden',
    creature_description: 'A squat heavy-set mechanical golem with a pot-belly furnace chest glowing orange through iron grate ribs, one arm is a massive wrench and the other a dented shield plate, its head is a riveted bucket helm with a single cracked lens, soot-stained and battle-worn with missing bolts and welded repair patches',
    visual_description: 'Pot-belly furnace golem with wrench arm, bucket helm, soot-stained and battle-worn',
    card_type: 'CREATURE',
    cm_cost: 3,
    base_attack: 2,
    base_health: 4,
    base_instability: 1,
    keywords: ['Shield'],
    rarity: 'COMMON',
  },
  // Ironwright — epic tier war engine, dramatic overhead composition
  {
    spec_id: 'iron-v4-02',
    faction_key: 'IRONWRIGHT',
    faction_id: FACTION_IDS.IRONWRIGHT,
    creature_archetype: 'Siege Colossus',
    creature_description: 'A towering bipedal war machine three stories tall built from riveted boiler plates and locomotive parts, its torso is a converted steam engine with exhaust stacks belching black smoke, massive piston-driven legs each ending in iron-shod crushing feet, a battering ram jaw mounted where a head should be, chains and grappling hooks dangle from its arms, rust and battle damage everywhere',
    visual_description: 'Towering steam-engine war machine with piston legs and battering ram jaw',
    card_type: 'CREATURE',
    cm_cost: 7,
    base_attack: 6,
    base_health: 8,
    base_instability: 4,
    keywords: ['Piercing'],
    rarity: 'EPIC',
  },
  // Fey Courts — something ancient and unsettling, not pretty
  {
    spec_id: 'fey-v4-01',
    faction_key: 'FEY_COURTS',
    faction_id: FACTION_IDS.FEY_COURTS,
    creature_archetype: 'Rootmaw Lurker',
    creature_description: 'A hunched predatory creature made of gnarled ancient tree roots twisted into a bestial shape, its mouth is a vertical split in the trunk lined with thorn-teeth, pale fungal growths cluster on its shoulders like tumors, two hollow knotholes serve as eyes with faint green foxfire deep within, moss hangs from it like matted fur',
    visual_description: 'Gnarled root-beast with thorn-lined trunk mouth and foxfire knothole eyes',
    card_type: 'CREATURE',
    cm_cost: 2,
    base_attack: 1,
    base_health: 3,
    base_instability: 1,
    keywords: ['Lifesteal'],
    rarity: 'COMMON',
  },
  // Fey Courts — flying faerie, environmental skyborne composition
  {
    spec_id: 'fey-v4-02',
    faction_key: 'FEY_COURTS',
    faction_id: FACTION_IDS.FEY_COURTS,
    creature_archetype: 'Moonwing Harbinger',
    creature_description: 'An ethereal moth-like fey creature with four translucent wings patterned like stained glass, its body is slender and insectoid wrapped in living ivy and silver thread, antennae trail luminous pollen, its face is eerily humanoid with compound eyes reflecting moonlight, it carries a staff of petrified wood capped with a glowing seed pod',
    visual_description: 'Moth-winged fey with stained-glass wings, compound eyes, and glowing seed staff',
    card_type: 'CREATURE',
    cm_cost: 4,
    base_attack: 2,
    base_health: 3,
    base_instability: 2,
    keywords: ['Flying'],
    rarity: 'UNCOMMON',
  },
  // Demonic Kingdoms — grotesque and heavy, not a clean demon
  {
    spec_id: 'demon-v4-01',
    faction_key: 'DEMONIC',
    faction_id: FACTION_IDS.DEMONIC,
    creature_archetype: 'Slag Brute',
    creature_description: 'A hulking misshapen creature formed from cooled volcanic slag and fused bone, one shoulder is much larger than the other giving it a lopsided silhouette, cracks in its stone skin reveal the molten interior, a crude iron collar and broken chain hang from its thick neck, its face is a half-melted skull with one intact horn and one broken stump',
    visual_description: 'Lopsided slag and bone brute with molten cracks, broken horn, crude iron collar',
    card_type: 'CREATURE',
    cm_cost: 3,
    base_attack: 4,
    base_health: 2,
    base_instability: 3,
    keywords: ['Deathtouch'],
    rarity: 'COMMON',
  },
  // Demonic Kingdoms — legendary overlord, narrative composition
  {
    spec_id: 'demon-v4-02',
    faction_key: 'DEMONIC',
    faction_id: FACTION_IDS.DEMONIC,
    creature_archetype: 'Tyrant of the Black Altar',
    creature_description: 'A massive horned demon seated on a throne of fused skulls and molten obsidian, four arms each gripping a different weapon — a serrated blade, a bone scepter, a chain whip, and a still-beating heart, its chest is split open revealing a furnace of hellfire within, a crown of broken swords sits atop its ram-like horns, lesser demons grovel at its feet',
    visual_description: 'Four-armed throne demon with hellfire chest, broken sword crown, skull throne',
    card_type: 'CREATURE',
    cm_cost: 8,
    base_attack: 7,
    base_health: 7,
    base_instability: 5,
    keywords: ['Deathtouch', 'Piercing'],
    rarity: 'LEGENDARY',
  },
];

// ==========================================================================
// API call helpers
// ==========================================================================

async function callFal(body) {
  const maxRetries = 3;
  let delay = 3000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) return await response.json();

    const errText = await response.text();
    if (response.status === 429 || response.status >= 500) {
      if (attempt < maxRetries) {
        console.log(`  fal.ai ${response.status}, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
    }
    throw new Error(`fal.ai HTTP ${response.status}: ${errText}`);
  }
}

async function callOpenAI(messages, responseFormat) {
  const body = {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 150,
    messages,
  };
  if (responseFormat) body.response_format = responseFormat;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
  }

  return await response.json();
}

// ==========================================================================
// R2 upload using AWS4 signature
// ==========================================================================

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function hmacSha256(key, data) {
  return createHmac('sha256', key).update(data).digest();
}

async function uploadToR2(imageBuffer, key) {
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${R2_BUCKET_NAME}/${key}`;
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateOnly = dateStr.substring(0, 8);
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateOnly}/${region}/${service}/aws4_request`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalHeaders = `content-type:image/png\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateStr}\n`;
  const canonicalRequest = `PUT\n/${R2_BUCKET_NAME}/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const stringToSign = `AWS4-HMAC-SHA256\n${dateStr}\n${credentialScope}\n${sha256(canonicalRequest)}`;

  const kDate = hmacSha256(`AWS4${R2_SECRET_ACCESS_KEY}`, dateOnly);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const signingKey = hmacSha256(kService, 'aws4_request');
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const uploadResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': dateStr,
      'Host': host,
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`R2 upload failed: HTTP ${uploadResponse.status}: ${errText}`);
  }

  return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

// ==========================================================================
// Main: generate 6 cards sequentially
// ==========================================================================

async function generateCard(spec) {
  console.log(`\n--- Generating: ${spec.creature_archetype} (${spec.faction_key}) ---`);

  // 1. Build art prompt with composition, environment, and v4 variety dimensions
  const factionPrefix = FACTION_PREFIXES[spec.faction_key];
  const composition = selectComposition(spec);
  const compositionName = Object.entries(COMPOSITION_POOL).find(([, v]) => v === composition)?.[0] || 'UNKNOWN';
  const environment = selectEnvironment(spec.faction_key);
  const weather = selectWeather();
  const timeOfDay = selectTimeOfDay();
  const scale = selectScale(spec.cm_cost ?? 3);
  const promptParts = [STYLE_ANCHOR, factionPrefix, spec.creature_description, composition, environment];
  if (weather) promptParts.push(weather);
  if (timeOfDay) promptParts.push(timeOfDay);
  if (scale) promptParts.push(scale);
  const fullPrompt = promptParts.join(', ');

  const artRequest = {
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: 'portrait_4_3',
    num_inference_steps: 40,
    guidance_scale: 8.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  // 2. Call fal.ai
  console.log('  Calling fal.ai FLUX Dev...');
  const falResult = await callFal(artRequest);

  if (falResult.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected — regenerate');
  }
  if (!falResult.images?.[0]?.url) {
    throw new Error('No image URL in fal.ai response');
  }

  const tempImageUrl = falResult.images[0].url;
  console.log(`  Art generated (seed: ${falResult.seed}, ${Math.round(falResult.timings?.inference || 0)}ms)`);

  // 3. Download image
  console.log('  Downloading image...');
  const imgResponse = await fetch(tempImageUrl);
  if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
  console.log(`  Image downloaded: ${(imageBuffer.length / 1024).toFixed(0)}KB`);

  // 3b. Save image locally to scripts/preview/
  const previewDir = join(__dirname, 'preview');
  if (!existsSync(previewDir)) mkdirSync(previewDir, { recursive: true });
  const localFileName = `${spec.spec_id}.png`;
  const localPath = join(previewDir, localFileName);
  writeFileSync(localPath, imageBuffer);
  console.log(`  Saved locally: scripts/preview/${localFileName}`);

  // 4. Upload to R2
  const r2Key = `cards/${spec.faction_key.toLowerCase()}/${spec.rarity.toLowerCase()}/${spec.spec_id}.png`;
  console.log(`  Uploading to R2: ${r2Key}`);
  const artUrl = await uploadToR2(imageBuffer, r2Key);
  console.log(`  R2 URL: ${artUrl}`);

  // 5. Generate name + flavor text via OpenAI
  console.log('  Calling OpenAI GPT-4o Mini for name/flavor...');
  const factionVoice = FACTION_NAME_VOICES[spec.faction_key];
  const factionTone = FACTION_FLAVOR_TONES[spec.faction_key];
  const factionDisplayName = FACTION_DISPLAY_NAMES[spec.faction_key];

  const instabilityDesc =
    spec.base_instability <= 1 ? 'stable and composed'
    : spec.base_instability <= 3 ? 'balanced'
    : 'volatile and aggressive';

  const textMessages = [
    {
      role: 'system',
      content: 'You are a card name and flavor text generator for Chaos Creatures, a fantasy card game. Always respond with valid JSON only.',
    },
    {
      role: 'user',
      content: `Generate a card name and flavor text for this card.

FACTION: ${factionDisplayName}
FACTION VOICE: ${factionVoice}
FACTION TONE: ${factionTone}
CREATURE ARCHETYPE: ${spec.creature_archetype}
STATS: ${spec.base_attack} ATK / ${spec.base_health} HP, ${spec.cm_cost} chaos mote cost
INSTABILITY: ${spec.base_instability} (${instabilityDesc})
KEYWORDS: ${spec.keywords.length > 0 ? spec.keywords.join(', ') : 'none'}
VISUAL DESCRIPTION: ${spec.visual_description}

Generate:
1. Card name: 2-4 words, faction-appropriate, memorable
2. Flavor text: 1-2 sentences, under 120 characters, faction voice

Respond ONLY with this JSON:
{"name": "...", "flavor_text": "..."}`,
    },
  ];

  const textResult = await callOpenAI(textMessages, { type: 'json_object' });
  const textContent = textResult.choices[0]?.message?.content;
  if (!textContent) throw new Error('Empty OpenAI response');

  const { name, flavor_text } = JSON.parse(textContent);
  console.log(`  Name: "${name}"`);
  console.log(`  Flavor: "${flavor_text}"`);

  // 6. Insert card_template into Supabase
  console.log('  Inserting card_template...');
  const templateRow = {
    name,
    card_type: spec.card_type,
    faction_id: spec.faction_id,
    base_attack: spec.base_attack,
    base_health: spec.base_health,
    base_instability: spec.base_instability,
    mana_cost: spec.cm_cost,
    base_keywords: spec.keywords,
    art_prompt: fullPrompt.substring(0, 2000), // Truncate if needed
    art_url: artUrl,
    flavor_text: flavor_text || '',
    batch_id: 'test-batch-001',
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('card_templates')
    .insert(templateRow)
    .select('id, name')
    .single();

  if (insertErr) throw new Error(`Supabase insert failed: ${insertErr.message}`);

  console.log(`  Inserted card_template: ${inserted.id}`);
  return {
    id: inserted.id,
    name,
    flavor_text,
    art_url: artUrl,
    localFile: `${spec.spec_id}.png`,
    compositionName,
    spec,
  };
}

// ==========================================================================
// Run
// ==========================================================================

async function main() {
  console.log('=== Chaos Creatures — Test Card Generation ===');
  console.log(`Generating ${CARD_SPECS.length} cards...\n`);

  // Clean up any orphaned PENDING generation_jobs from previous attempts
  const { count } = await supabase
    .from('generation_jobs')
    .delete()
    .eq('status', 'PENDING')
    .select('*', { count: 'exact', head: true });
  if (count > 0) console.log(`Cleaned up ${count} orphaned PENDING generation_jobs\n`);

  const results = [];
  let totalCost = 0;

  for (const spec of CARD_SPECS) {
    try {
      const result = await generateCard(spec);
      results.push({ ...result, faction: spec.faction_key, success: true });
      totalCost += 0.026; // ~$0.025 fal.ai + ~$0.001 OpenAI
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      results.push({ faction: spec.faction_key, name: spec.creature_archetype, success: false, error: err.message });
    }
  }

  console.log('\n=== RESULTS ===');
  console.log('─'.repeat(60));
  for (const r of results) {
    const status = r.success ? '✓' : '✗';
    console.log(`${status} [${r.faction}] ${r.name}${r.art_url ? ` — ${r.art_url}` : ''}`);
    if (r.error) console.log(`  Error: ${r.error}`);
  }
  console.log('─'.repeat(60));
  console.log(`Total: ${results.filter(r => r.success).length}/${results.length} succeeded`);
  console.log(`Estimated cost: $${totalCost.toFixed(3)}`);

  // 7. Write cards.json for preview server
  const FACTION_TYPE_LINES = {
    IRONWRIGHT: 'Ironwright Creature',
    FEY_COURTS: 'Fey Creature',
    DEMONIC: 'Demonic Creature',
  };
  const cardsJson = results.filter(r => r.success).map(r => ({
    name: r.name,
    faction: r.faction,
    rarity: (r.spec?.rarity || 'common').toLowerCase(),
    cardType: r.spec?.card_type === 'SPELL' ? 'Spell' : 'Creature',
    typeLine: `${FACTION_TYPE_LINES[r.faction] || 'Creature'} - ${r.spec?.creature_archetype || ''}`,
    manaCost: r.spec?.cm_cost ?? 3,
    attack: r.spec?.card_type === 'SPELL' ? null : (r.spec?.base_attack ?? 0),
    health: r.spec?.card_type === 'SPELL' ? null : (r.spec?.base_health ?? 0),
    keywords: r.spec?.keywords || [],
    flavorText: r.flavor_text || '',
    artFile: r.localFile,
    composition: r.compositionName,
  }));

  const previewDir = join(__dirname, 'preview');
  const cardsJsonPath = join(previewDir, 'cards.json');
  writeFileSync(cardsJsonPath, JSON.stringify(cardsJson, null, 2));
  console.log(`\nWrote ${cardsJson.length} cards to scripts/preview/cards.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

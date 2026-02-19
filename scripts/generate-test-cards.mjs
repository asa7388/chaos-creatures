#!/usr/bin/env node
// generate-test-cards.mjs — Local card generation script
// Bypasses Edge Functions and calls fal.ai + OpenAI + R2 + Supabase directly.
// Usage: node scripts/generate-test-cards.mjs

import { createClient } from '../packages/game-server/node_modules/@supabase/supabase-js/dist/index.mjs';
import { createHmac, createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

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

// LoRA configs — switchable via --lora flag
// classipeint: ClassipeintXL v2.1 oil painting (tight, detailed, portrait-biased)
// eldritch: Eldritch Impressionism v1.5 (loose, gestural, environmental)
// dual: both stacked (ClassipeintXL 0.5 + Eldritch 0.7)
const LORA_CLASSIPEINT = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/ClassipeintXL2.1.safetensors';
const LORA_ELDRITCH = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchImpressionismXL1.5.safetensors';

const loraFlag = process.argv.includes('--lora') ? process.argv[process.argv.indexOf('--lora') + 1] : 'classipeint';
let LORA_CONFIG;
if (loraFlag === 'eldritch') {
  LORA_CONFIG = { loras: [{ path: LORA_ELDRITCH, scale: 1.0 }], label: 'Eldritch Impressionism solo' };
} else if (loraFlag === 'dual') {
  LORA_CONFIG = { loras: [{ path: LORA_CLASSIPEINT, scale: 0.5 }, { path: LORA_ELDRITCH, scale: 0.7 }], label: 'ClassipeintXL 0.5 + Eldritch 0.7' };
} else {
  LORA_CONFIG = { loras: [{ path: LORA_CLASSIPEINT, scale: 1.0 }], label: 'ClassipeintXL solo' };
}

// v10 style anchor: LoRA handles style at model level, trigger word adapts to LoRA selection.
// "muted earth tones + chiaroscuro" is the proven sweet spot (Forsaken Blood Reaver reference).
const STYLE_ANCHOR = loraFlag === 'classipeint'
  ? 'oil painting, dark atmospheric fantasy, muted earth tones, chiaroscuro lighting, no text no borders no watermarks'
  : 'impressionist painting, dark atmospheric fantasy, muted earth tones, chiaroscuro lighting, no text no borders no watermarks';

// Sub-faction flavor pools — rotated per card to avoid visual repetition.
// Each entry sets the faction atmosphere + sub-faction specialty + color palette.
// Source: docs/design/faction-art-bible.md
const FACTION_SUB_FLAVORS = {
  IRONWRIGHT: [
    'grimy steampunk foundry, corroded brass and blackened iron, rivers of molten metal, chain-driven machinery, amber and brass gold palette with molten orange glow',
    'Coalvein mining operation, steam-drill tunneling, pneumatic pick-axes, headlamps in darkness, soot-blackened iron, ash gray and dull orange embers palette',
    'Gearwright Academy clockwork workshop, articulated brass mannequins, chalkboard schematics, working orreries, warm cream and mahogany and copper palette',
    'Tideforge Foundry naval engineering, riveted iron hulls, steam-powered diving suits, barnacle-crusted pressure gauges, gunmetal blue and verdigris and rust orange palette',
    'Skywarden airship fleet, rigid aluminium and canvas airship skeletons, propeller arrays, altitude gauges, high-altitude cold thin blue light, ice-steel blue and leather brown palette',
    'Rivet Saints industrial cathedral, girders and steam pipes, stained glass depicting gears, pipe organs, gold leaf and deep burgundy and polished bronze palette',
    'Emberwright demolition zone, pressure-triggered detonators, reinforced brass goggles, rubble fields, alarm red and steam white and charcoal palette',
    'Cogwright Artificers automaton assembly line, articulated brass humanoids, exposed gear-trains, wind-up keys, burnished brass and oxblood leather and ivory palette',
  ],
  FEY_COURTS: [
    'Verdant Throne spring court, exploding flowers, pollen storms, vines cracking stone, overwhelming greenery, emerald and gold and warm amber palette',
    'Gilded Canopy summer revelry, blinding golden light, impossible banquets, jeweled-wing insects, hot pink and electric violet and marigold palette',
    'Amber Court autumn harvest, falling leaves, scales for weighing promises, amber-preserved creatures, bittersweet twilight, rust orange and dried-blood red palette',
    'Hollow Court winter silence, bare branches like bones, frozen ponds, snow absorbing sound, moth-eaten elegance, ice blue and bone white and bare wood gray palette',
    'Wild Hunt predation, antlered riders, spectral hounds, moonlit chase, silver and cobalt blue and hunter green and blood red palette',
    'Mushroom Ring decomposition, bioluminescent fungi, fairy rings, mycelial networks, spore clouds, deep teal and sickly yellow-green and bruise purple palette',
    'Briar Parliament fey law, thorned thrones, contract scrolls in blood-sap, cage-like topiary, dark enchanted forest, muted forest greens palette',
    'Moth Priests night worship, giant moths, silk cocoons, lantern processions, lunar calendar, opal and mother-of-pearl and shifting rainbow palette',
  ],
  DEMONIC: [
    'Furnace Lords volcanic wrath, magma rivers, jagged obsidian armor, war banners of flame, magma orange and obsidian black and sulfur yellow palette',
    'Obsidian Bureaucracy infernal law, towering filing cabinets, stamp seals that brand skin, endless corridors, sickly yellow-green and institutional gray and red stamp ink palette',
    'Silk Whisperers temptation, opulent fabrics, golden chains as jewelry, mirrors showing deepest wants, burgundy and gold and black velvet and plum palette',
    'Fleshweavers body horror, surgical theaters, stitched-together creatures, extra limbs, chiaroscuro Renaissance light, flesh tones and bone white and organ red palette',
    'Plague Gardens toxic beauty, flowers growing from wounds, iridescent rot, jewel-toned fungal growths, poisonous landscape, bright toxic greens and purples palette',
    'Bone Architects ossuary construction, fused bone structures, cathedral-scale, skeletal workers, bone white and charcoal and ancient iron palette',
    'Iron Inquisition zealotry, spiked censers, chains, brands, black-and-gold religious vestments, cage confessionals, deep gold and bruise spectrum palette',
    'Clock Devourers time debt, broken clocks, hourglass prisons, figures at different ages, stolen time as golden mist, amber and void blue palette',
  ],
};

// Select a random sub-faction flavor for the given faction
function selectSubFlavor(factionKey) {
  const flavors = FACTION_SUB_FLAVORS[factionKey] || FACTION_SUB_FLAVORS.IRONWRIGHT;
  return flavors[Math.floor(Math.random() * flavors.length)];
}

// Composition pool — 25 templates for art variety
// Each template is explicit about: facing direction, frame placement, and depth/scale.
// This prevents DreamShaper from defaulting to "centered creature facing camera."
const COMPOSITION_POOL = {
  // --- Portraits (close/medium, creature dominates frame) ---
  PORTRAIT_CLOSE: 'extreme close-up of creature face filling entire frame, facing slightly left, eyes looking directly at viewer, shallow depth of field, blurred background, creature occupies 90% of frame',
  PORTRAIT_THREE_QUARTER: 'creature facing right at three-quarter angle, head and upper body visible, positioned in left third of frame, background visible on right side, medium depth of field',
  PORTRAIT_PROFILE: 'strict side profile facing left, single eye visible, creature positioned in right half of frame, strong rim light on edges, negative space on left, shallow depth of field',
  PORTRAIT_FROM_BEHIND: 'creature seen from behind facing away from viewer into the distance, looking over right shoulder, positioned in center-left of frame, vast environment visible ahead, deep depth of field',
  PORTRAIT_EXTREME_WIDE: 'creature tiny in lower third of frame, vast panoramic landscape filling upper two-thirds, extreme sense of scale and isolation, deep atmospheric perspective, creature occupies less than 15% of frame',

  // --- Action (dynamic poses, creature in motion) ---
  ACTION_ATTACK: 'creature lunging toward right side of frame, body stretched diagonally from lower-left to upper-right, motion blur on limbs, debris flying, low camera angle looking up at creature',
  ACTION_DEFEND: 'creature in wide defensive stance facing left, positioned in right third of frame, shield or arms raised, bracing for impact from off-frame left, ground-level camera',
  ACTION_CAST: 'creature in center of frame with arms raised overhead, energy swirling upward, dramatic backlighting from behind creature creating rim light silhouette, creature in midground',
  ACTION_LEAP: 'creature mid-leap through air, body arcing from lower-right to upper-left of frame, diagonal composition, wind and debris trailing behind, frozen motion, nothing beneath creature',
  ACTION_PROWL: 'creature low to ground stalking toward viewer, positioned in bottom third of frame, body compressed and coiled, shot from ground level looking slightly up, predatory tension, environment looms above',
  ACTION_COMMAND: 'creature on elevated position in upper-left of frame, arm or limb raised pointing right, looking down at something below frame edge, imperial authority, high vantage point',

  // --- Environmental (environment as co-star, creature placed within) ---
  ENVIRONMENTAL_WIDE: 'wide establishing shot, creature small in center-right of vast landscape, environment dominates the frame, epic scale, deep perspective, creature occupies 20-30% of frame height',
  ENVIRONMENTAL_EMERGING: 'creature partially hidden, emerging from left edge of frame into fog or mist, only head and one limb fully visible, rest obscured by environment, mysterious and atmospheric',
  ENVIRONMENTAL_UNDERGROUND: 'deep underground cavern, creature in midground positioned off-center right, stalactites framing from top, bioluminescent or firelit, strong sense of enclosed space',
  ENVIRONMENTAL_SKYBORNE: 'creature high in the sky in upper third of frame, wings spread wide, clouds around it, landscape far below visible in bottom quarter, vertigo-inducing downward perspective',
  ENVIRONMENTAL_THRESHOLD: 'creature standing in doorway or archway, positioned dead center of frame, bright light from behind casting creature as partial silhouette, dark space in foreground',

  // --- Dramatic (unusual camera angles) ---
  DRAMATIC_LOW_ANGLE: 'extreme low angle looking straight up at creature towering overhead, creature fills upper 70% of frame, dramatic sky behind, foreshortened perspective making creature seem massive',
  DRAMATIC_SILHOUETTE: 'creature as dark silhouette in center of frame against bright dramatic sky or explosion behind, only rim lighting visible on edges, high contrast, creature outline is the focus',
  DRAMATIC_OVERHEAD: 'extreme overhead bird-eye view looking straight down, creature foreshortened on ground in center of frame, radial composition with environment spreading outward from creature',
  DRAMATIC_DUTCH_ANGLE: 'camera tilted 20 degrees creating diagonal horizon line, creature positioned in lower-right of frame facing upper-left, off-balance dynamic energy, environment at a slant',

  // --- Narrative (storytelling, creature in context) ---
  NARRATIVE_MOMENT: 'creature in left half of frame interacting with an object or environment feature on the right, storytelling composition with clear action and subject, midground framing',
  NARRATIVE_DUAL: 'two creatures facing each other from opposite sides of frame, confrontation composition, negative space between them in center, split lighting',
  NARRATIVE_AFTERMATH: 'creature in right third of frame looking left across a scene of wreckage, contemplative mood, wreckage fills left two-thirds, smoke and debris in foreground partially obscuring creature legs',
  NARRATIVE_RITUAL: 'creature kneeling or hunched in center of frame surrounded by magical energy or ritual circle, energy gathering upward, ceremonial setting, camera slightly above looking down',
};

// Faction environments — from faction art bible, richer and more specific
const FACTION_ENVIRONMENTS = {
  ironwright: [
    'inside the Great Foundry, cathedral-scale with multiple levels of catwalks connected by steam-powered lifts, rivers of molten metal below, massive chains and drive-belts hanging from above, flywheel generators the size of houses',
    'in a Canal Lock District, industrial waterways with brick walls, enormous gear mechanisms and hydraulic pistons controlling iron gates, steam-barges loaded with ore, foggy morning light',
    'in the Patent Library, vast archive of mechanical drawings, brass pneumatic tube mail systems whooshing overhead, gas lamp reading rooms, rotating blueprint displays on clockwork carousels',
    'in an open-pit mine, terraced earth with steam-powered bucket-wheel excavators, tiny figures on switchback roads, ore carts on rail tracks, exposed geological strata',
    'in a railway frontier town, half-built station with decorative ironwork, workers tent camps, tracks stretching into wilderness, locomotive idling with steam billowing',
    'in the Pressure Depths, underwater glass-domed workshop connected by pressurized tunnels, air bubble columns from steam recyclers, bioluminescent and gas lamp lighting',
    'in a scrapyard bazaar, mountains of discarded gears and pistons and boiler parts, haggling merchants, makeshift stalls roofed with sheet metal, sparks from improvised repairs',
    'on the Proving Grounds, open field of prototype machines being tested, steam walkers taking first steps, experimental cannons firing, observation towers, explosion craters',
    'on a textile mill floor, rows of thundering steam-driven looms, cotton dust in shafts of light from high clerestory windows, belt-drives connecting machines to central steam shaft',
    'in the Ironwright Cemetery, cast iron headstones engraved with craft specialties, tools left as grave offerings, steam-powered eternal flames, rust patina on older graves',
    'inside a zeppelin hangar, enormous airship skeleton being assembled, scaffolding and steam-cranes, gas bladders being inflated, workers on rope swings at dizzying height',
    'inside a steam-pipe cathedral, every surface is functional infrastructure, pews heated by under-floor steam, altar doubling as pressure regulator, hymns from steam-organ pipes',
    'in the Difference Engine Hall, rows of city-block-sized mechanical computers, operators feeding punch cards, output tape spooling onto floor, deafening clatter of thousands of brass drums',
    'in an airship drydock, airship suspended in scaffolding high above a valley, workers rappelling along the hull, replacement propeller hoisted by steam-crane, mountain backdrop',
    'in the Clockwork Menagerie, vast hall of mechanical animals, brass songbirds, iron horses, copper serpents, some functional some half-built, engineers tinkering',
    'in the Assay Office, precise room with mechanical scales, acid-test rigs, ore samples, a single evaluator under bright gas light, pressure-sealed vault behind them',
  ],
  fey: [
    'in the Endless Feast Hall, table stretching to horizon, food centuries old (some fresh some skeletal), dancing guests who cannot stop, candelabras of living flame',
    'at a Fairy Ring crossroads, circle of mushrooms in a midnight clearing, space inside subtly brighter than it should be, multiple paths leading away into darkness',
    'in the Thorn Maze, walls of living briar 30 feet high, passages that shift, bones of previous visitors tangled in the hedge, no sky visible',
    'inside a Hollow Tree Palace, impossibly vast tree interior, spiral staircases of living wood, windows looking out onto different seasons simultaneously',
    'in the Drowning Garden, flowers growing underwater, flooded meadow with sunlight filtering through, fish swimming through rose bushes, submerged stepping stones',
    'at an Autumn Market, stalls selling bottled memories and years of life and names, paid for with intangibles, perpetual twilight ambiance, leaf-strewn cobblestones',
    'on the Petrified Dance Floor, stone figures caught mid-dance with expressions of ecstasy and terror, moss creeping over them, music still faintly audible',
    'in a Spider-Silk Observatory, web-like structure stretched between ancient trees, dewdrops acting as lenses to view stars, spider-fey astronomers',
    'in the Whispering Bog, mist-choked marshland, will-o-wisps leading travelers astray, half-submerged standing stones, bubbling mud, distant wailing',
    'inside a Cocoon Cathedral, vast space draped in silk cocoons of various sizes, some glowing from within, moth-winged attendants tending them',
    'at the Mirror Lake, perfectly still water that reflects a different time or place entirely, shore of silver sand, inverted stars',
    'in a Bone Orchard, trees made of interlocking bones (antlers, ribs, skulls) but blooming with real flowers, tended by silent gardeners',
  ],
  demonic: [
    'on the Soul Exchange trading floor, boards showing soul prices, frantic demonic brokers, soul-jars in pneumatic tubes, ticker tape and screaming',
    'in a volcanic court throne room inside a caldera, obsidian pillars, lava flowing in decorative channels, heat haze distorting everything',
    'in the Library of Sins, vast archive where every mortals transgressions are recorded, books shelving themselves, librarians with too many eyes',
    'at a Flesh Market, open-air bazaar selling body modifications, extra eyes and wings and venomous fangs displayed on mannequin-like living displays',
    'on the Penitents Staircase, infinite stone stairs descending into darkness, each step carved with a different sin, worn smooth by millennia of feet',
    'at an infernal shipyard, ships of bone and black iron being built to sail rivers of fire, skeletal crews drilling, volcanic docks',
    'in the Garden of Earthly Delights, Bosch-inspired surreal landscape, giant fruit, impossible creatures, hedonistic revelers unaware they are trapped',
    'in a Corruption Nursery, demonic creatures grown in pods and incubation chambers, half-formed beings, clinical and disturbing, umbilical tubes of ichor',
    'inside the Broken Clocktower, massive damaged mechanism that once tracked mortal lifespans, stolen time leaking out as golden mist',
    'at a Border Checkpoint where Hell meets the mortal world, mundane bureaucratic office, fluorescent lights flickering to reveal the truth beneath',
    'in the Screaming Colosseum, vast amphitheater where demons settle disputes through combat, tiered spectators, bookmakers, food vendors, almost normal',
    'on a Frozen Lake of Treachery, Dantes deepest circle, traitors frozen in ice up to various points, eerily silent and cold not hot',
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

// Mood/lighting combos per faction — applied ~35% of the time for atmosphere variety
// Source: faction art bible mood tables
const FACTION_MOODS = {
  IRONWRIGHT: [
    'industrial pride lighting, golden hour through factory windows, lens flare off polished brass',
    'grim labor atmosphere, dim harsh single-source furnace light, deep shadows',
    'discovery eureka moment, bright flash radiating outward, arc-light intensity, electric blue arcs',
    'quiet precision mood, focused desk lamp, gas-light warmth, deep shadows',
    'catastrophic failure, red emergency glow, sparks and billowing steam, boiler rupture chaos',
    'sacred industry atmosphere, cathedral light shafts through steam clouds, gas-lamp halos',
    'steampunk grandeur, warm amber interior, firelight reflecting on polished brass, everything gleaming',
  ],
  FEY_COURTS: [
    'enchanted allure, soft dappled light, golden hour filtering through leaves',
    'creeping dread atmosphere, dim blue twilight, single points of bioluminescence in darkness',
    'manic revelry, oversaturated competing firelight and moonlight, garish and beautiful',
    'melancholy decay mood, overcast flat light, everything slightly faded and bittersweet',
    'predatory pursuit lighting, moonlight through branches, motion blur, hunting tension',
    'frozen stillness, blue-white winter light, crystalline clarity, breath visible',
    'overwhelming growth, noon light barely penetrating dense canopy, suffocating greenery',
    'dream logic, light sources that dont cast proper shadows, iridescent and impossible',
  ],
  DEMONIC: [
    'seductive luxury, warm candlelight, gold reflections, soft focus, opulent darkness',
    'bureaucratic dread, harsh fluorescent lighting, no shadows, clinical and soulless',
    'volcanic fury, underlit by magma glow, deep shadow above, hellish radiance from below',
    'existential void, absence of light, shapes defined by negative space, single distant point of light',
    'grotesque beauty, chiaroscuro Renaissance painting light, beautiful and horrifying simultaneously',
    'frozen betrayal, cold blue-white light, ice reflections, corpse-cold atmosphere',
    'carnival of the damned, multicolored garish circus lights, festive and nightmarish',
  ],
};

function selectMood(factionKey) {
  if (Math.random() > 0.35) return '';
  const moods = FACTION_MOODS[factionKey] || FACTION_MOODS.IRONWRIGHT;
  return moods[Math.floor(Math.random() * moods.length)];
}

// Texture accent pools per faction — applied ~40% of the time for material detail
const FACTION_TEXTURES = {
  IRONWRIGHT: [
    'key textures: hammered iron, riveted plate, piston rods with oil sheen, brass gear teeth',
    'key textures: tarnished copper patina, vulcanized rubber, oiled leather toolbelts, coal dust on skin',
    'key textures: polished brass, ground glass gauge lenses, wax-sealed parchment, graphite smudges',
    'key textures: pitted cast iron, canvas airship skin weathered and taut, welding spark trails, exhaust soot',
    'key textures: boiler plate with blue heat-temper lines, chain mail links, pressed tin ceiling tiles, engine grease',
  ],
  FEY_COURTS: [
    'key textures: iridescent beetle shells, spider silk wet with dew, bark in all stages of decay',
    'key textures: mushroom gills, lichen crust, antler velvet, moth wing dust, dragonfly wing venation',
    'key textures: amber resin, snail shell nacre, cobweb lace, frozen dew drops, autumn leaf translucency backlit',
    'key textures: mycelial threads, bioluminescent fungus glow, owl feather softness, fish scale iridescence',
    'key textures: honeycomb wax, fox fur, rose thorn hooks, pinecone spirals, dandelion seed heads',
  ],
  DEMONIC: [
    'key textures: cracked obsidian, cooled lava ropy and jagged, sulfur crystal deposits, ancient black iron',
    'key textures: horn and chitin, scales, velvet and silk in moth-eaten decay, molten gold, congealed blood',
    'key textures: crystallized tears, rusted chains, smoke and ash, brimstone powder, melting wax pools',
    'key textures: cracked marble, tarnished silver, burnt parchment, ink that moves, cracked mirror glass',
    'key textures: stretched skin as parchment, polished bone, coral-like demonic growths, fungal infection on surfaces',
  ],
};

function selectTexture(factionKey) {
  if (Math.random() > 0.40) return '';
  const textures = FACTION_TEXTURES[factionKey] || FACTION_TEXTURES.IRONWRIGHT;
  return textures[Math.floor(Math.random() * textures.length)];
}

// Faction-specific weapons/armor — applied ~50% of the time for creature variety
const FACTION_GEAR = {
  IRONWRIGHT: [
    'wielding a massive wrench-mace hybrid, bolts as rivets',
    'carrying a pneumatic piston-hammer, steam venting from joints',
    'dragging a chain-linked anchor weapon, rust flaking off',
    'armored in overlapping boiler plates with pressure gauge shoulder pads',
    'equipped with a rotating sawblade arm, sparks flying',
    'wearing a riveted helm with a cracked observation visor',
  ],
  FEY_COURTS: [
    'clutching a staff of living wood, budding with impossible flowers',
    'draped in armor of woven bark and silver spider silk',
    'wielding a bow carved from a single moonlit branch, string of light',
    'wearing a crown of antlers and thorns, each thorn dripping amber sap',
    'carrying a lantern of trapped fireflies that whisper',
    'cloaked in moth-wing fabric that shifts between visible and invisible',
  ],
  DEMONIC: [
    'gripping a jagged obsidian greatsword, veins of hellfire running through it',
    'clad in armor made from fused rib cages and vertebrae, still warm',
    'wielding a flail of screaming skulls bound by chains of sinew',
    'wearing a crown of broken horns taken from defeated rivals',
    'carrying a tower shield made from a fallen angel wing, charred and twisted',
    'dragging a barbed whip that leaves trails of smoldering ichor',
  ],
};

function selectGear(factionKey) {
  if (Math.random() > 0.50) return '';
  const gearList = FACTION_GEAR[factionKey] || FACTION_GEAR.IRONWRIGHT;
  return gearList[Math.floor(Math.random() * gearList.length)];
}

// Map faction keys to environment lookup keys
const FACTION_ENV_MAP = {
  IRONWRIGHT: 'ironwright',
  FEY_COURTS: 'fey',
  DEMONIC: 'demonic',
};

// Updated selectComposition — always returns from a curated pool per category,
// with randomization so no two cards in a batch are likely to get the same one.
function selectComposition(spec) {
  const tier = (spec.rarity || '').toUpperCase();
  const keywords = (spec.keywords || []).map(k => k.toUpperCase());
  const manaCost = spec.cm_cost ?? 3;
  const cardType = (spec.card_type || 'CREATURE').toUpperCase();

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // 15% chance of a wild-card dramatic angle regardless of card type
  if (Math.random() < 0.15) {
    return pick([
      COMPOSITION_POOL.DRAMATIC_DUTCH_ANGLE,
      COMPOSITION_POOL.ENVIRONMENTAL_THRESHOLD,
      COMPOSITION_POOL.DRAMATIC_OVERHEAD,
      COMPOSITION_POOL.ENVIRONMENTAL_EMERGING,
    ]);
  }

  if (cardType === 'STABILIZER') return COMPOSITION_POOL.NARRATIVE_RITUAL;
  if (cardType === 'SPELL') return pick([COMPOSITION_POOL.ACTION_CAST, COMPOSITION_POOL.DRAMATIC_SILHOUETTE]);

  // Legendary: narrative compositions showing power and context
  if (tier === 'LEGENDARY') return pick([
    COMPOSITION_POOL.NARRATIVE_AFTERMATH,
    COMPOSITION_POOL.NARRATIVE_MOMENT,
    COMPOSITION_POOL.ACTION_COMMAND,
    COMPOSITION_POOL.DRAMATIC_LOW_ANGLE,
  ]);

  // Epic: dramatic camera angles
  if (tier === 'EPIC') return pick([
    COMPOSITION_POOL.DRAMATIC_OVERHEAD,
    COMPOSITION_POOL.DRAMATIC_SILHOUETTE,
    COMPOSITION_POOL.DRAMATIC_LOW_ANGLE,
    COMPOSITION_POOL.ENVIRONMENTAL_WIDE,
  ]);

  // Keyword-influenced pools (each has 2-3 options for variety)
  if (keywords.includes('FLYING')) return pick([
    COMPOSITION_POOL.ENVIRONMENTAL_SKYBORNE,
    COMPOSITION_POOL.ENVIRONMENTAL_WIDE,
    COMPOSITION_POOL.ACTION_LEAP,
  ]);
  if (keywords.includes('DEATHTOUCH')) return pick([
    COMPOSITION_POOL.ACTION_PROWL,
    COMPOSITION_POOL.ENVIRONMENTAL_EMERGING,
    COMPOSITION_POOL.DRAMATIC_DUTCH_ANGLE,
  ]);
  if (keywords.includes('PIERCING')) return pick([
    COMPOSITION_POOL.ACTION_ATTACK,
    COMPOSITION_POOL.ACTION_LEAP,
    COMPOSITION_POOL.DRAMATIC_LOW_ANGLE,
  ]);
  if (keywords.includes('SHIELD') || keywords.includes('TAUNT')) return pick([
    COMPOSITION_POOL.ACTION_DEFEND,
    COMPOSITION_POOL.PORTRAIT_THREE_QUARTER,
    COMPOSITION_POOL.ENVIRONMENTAL_THRESHOLD,
  ]);
  if (keywords.includes('LIFESTEAL')) return pick([
    COMPOSITION_POOL.PORTRAIT_PROFILE,
    COMPOSITION_POOL.ENVIRONMENTAL_EMERGING,
    COMPOSITION_POOL.ACTION_PROWL,
  ]);
  if (keywords.includes('REACH')) return pick([
    COMPOSITION_POOL.PORTRAIT_FROM_BEHIND,
    COMPOSITION_POOL.ENVIRONMENTAL_UNDERGROUND,
    COMPOSITION_POOL.ACTION_COMMAND,
  ]);

  // Mana-cost-influenced defaults
  if (manaCost >= 7) return pick([COMPOSITION_POOL.DRAMATIC_LOW_ANGLE, COMPOSITION_POOL.ENVIRONMENTAL_WIDE]);
  if (manaCost >= 5) return pick([COMPOSITION_POOL.ACTION_COMMAND, COMPOSITION_POOL.PORTRAIT_FROM_BEHIND]);
  if (manaCost === 1) return pick([COMPOSITION_POOL.PORTRAIT_EXTREME_WIDE, COMPOSITION_POOL.DETAIL_MACRO]);

  // Default pool for common/uncommon 2-4 mana creatures — maximum variety
  return pick([
    COMPOSITION_POOL.PORTRAIT_THREE_QUARTER,
    COMPOSITION_POOL.PORTRAIT_PROFILE,
    COMPOSITION_POOL.ACTION_PROWL,
    COMPOSITION_POOL.ENVIRONMENTAL_EMERGING,
    COMPOSITION_POOL.NARRATIVE_MOMENT,
    COMPOSITION_POOL.PORTRAIT_FROM_BEHIND,
    COMPOSITION_POOL.ENVIRONMENTAL_UNDERGROUND,
    COMPOSITION_POOL.ENVIRONMENTAL_THRESHOLD,
  ]);
}

// Composition directives: each has a SCENE prefix (goes before creature) and
// a CAMERA suffix (goes after creature). Both parts reinforce the composition
// from opposite sides of the creature description in the prompt.
// Also includes negative terms to add when this composition is selected.
const COMPOSITION_DIRECTIVES = {
  PORTRAIT_CLOSE: {
    prefix: 'extreme close-up filling the entire frame,',
    suffix: 'face and eyes dominate the composition, shallow depth of field, blurred background',
    negative: '',
  },
  PORTRAIT_THREE_QUARTER: {
    prefix: 'three-quarter view facing right,',
    suffix: 'head and upper body visible, background on right side, medium shot',
    negative: '',
  },
  PORTRAIT_PROFILE: {
    prefix: 'strict side profile facing left, single eye visible,',
    suffix: 'positioned in right half of frame, strong rim light on edges, negative space on left',
    negative: 'front-facing, looking at viewer, symmetrical',
  },
  PORTRAIT_FROM_BEHIND: {
    prefix: '(seen from behind:1.3) looking away from the viewer into the distance,',
    suffix: 'back of the creature visible, (vast environment stretching ahead:1.2), deep depth of field',
    negative: 'front-facing, looking at viewer, face visible, portrait, headshot',
  },
  PORTRAIT_EXTREME_WIDE: {
    prefix: '(tiny creature in lower third of a vast panoramic landscape:1.4),',
    suffix: '(extreme wide shot:1.3), creature occupies less than 15% of the frame, overwhelming sense of scale',
    negative: 'portrait, headshot, close-up, medium shot, creature fills frame',
  },
  ACTION_ATTACK: {
    prefix: '(creature lunging diagonally:1.3) from lower-left to upper-right, body stretched mid-strike,',
    suffix: '(motion blur on limbs:1.2), debris flying, low camera angle looking up, dynamic action pose',
    negative: 'standing still, static pose, portrait, headshot, symmetrical, calm',
  },
  ACTION_DEFEND: {
    prefix: '(creature in wide defensive stance:1.3) bracing for impact from the left,',
    suffix: 'shield or arms raised, ground-level camera, dust kicked up, tension before impact',
    negative: 'portrait, headshot, relaxed pose, symmetrical',
  },
  ACTION_CAST: {
    prefix: '(creature with arms raised overhead channeling swirling magical energy:1.3),',
    suffix: '(dramatic backlighting:1.2) creating rim light silhouette, energy spiraling upward',
    negative: 'portrait, headshot, static pose, arms at sides',
  },
  ACTION_LEAP: {
    prefix: '(creature frozen mid-leap through the air:1.4), nothing beneath it,',
    suffix: 'body arcing diagonally, wind and debris trailing, (dynamic frozen motion:1.2)',
    negative: 'standing on ground, static pose, portrait, headshot, feet on floor',
  },
  ACTION_PROWL: {
    prefix: '(creature crouched very low to the ground:1.3) stalking toward the viewer,',
    suffix: '(shot from ground level:1.2) looking slightly up, body compressed and coiled, predatory tension',
    negative: 'standing upright, portrait, headshot, relaxed pose',
  },
  ACTION_COMMAND: {
    prefix: '(creature on elevated high ground:1.3), arm raised pointing outward,',
    suffix: '(looking down from imperial vantage point:1.2), subjects below, commanding authority',
    negative: 'portrait, headshot, ground level, eye-level',
  },
  ENVIRONMENTAL_WIDE: {
    prefix: '(wide establishing shot of vast landscape:1.4) with creature small in center-right,',
    suffix: '(environment dominates the frame:1.3), epic scale, creature occupies 20-30% of frame height',
    negative: 'portrait, headshot, close-up, creature fills frame',
  },
  ENVIRONMENTAL_EMERGING: {
    prefix: '(creature partially hidden emerging from dense fog:1.3), left edge of frame,',
    suffix: '(only head and one limb fully visible:1.2), rest obscured by swirling mist, mysterious atmosphere',
    negative: 'fully visible, clear view, portrait, centered',
  },
  ENVIRONMENTAL_UNDERGROUND: {
    prefix: '(deep underground cavern:1.4) with creature in midground off-center right,',
    suffix: '(stalactites framing from top:1.2), bioluminescent lighting, strong sense of enclosed dark space',
    negative: 'outdoor, sky visible, bright lighting, portrait',
  },
  ENVIRONMENTAL_SKYBORNE: {
    prefix: '(creature high in the sky:1.4) in upper third of frame with wings fully spread,',
    suffix: '(clouds around it:1.2), landscape far below in bottom quarter, vertigo-inducing downward angle',
    negative: 'standing on ground, indoor, portrait, headshot',
  },
  ENVIRONMENTAL_THRESHOLD: {
    prefix: '(creature standing in a massive stone archway:1.3), bright light behind casting it as a silhouette,',
    suffix: '(positioned dead center:1.2), dark foreground space, doorway framing the figure',
    negative: 'outdoor, no framing, close-up face',
  },
  DRAMATIC_LOW_ANGLE: {
    prefix: '(extreme low angle looking straight up:1.4) at creature towering overhead,',
    suffix: '(creature fills upper 70% of frame:1.2), dramatic sky behind, foreshortened perspective making it seem massive',
    negative: 'eye-level, looking down, portrait, headshot',
  },
  DRAMATIC_SILHOUETTE: {
    prefix: '(creature as dark black silhouette:1.4) against a bright dramatic sky,',
    suffix: '(only rim lighting visible on edges:1.3), extremely high contrast, outline is the focus',
    negative: 'fully lit, detailed face, portrait, front lighting',
  },
  DRAMATIC_OVERHEAD: {
    prefix: '(extreme overhead birds-eye view looking straight down:1.4) at creature on the ground,',
    suffix: '(foreshortened from above:1.2), radial composition, environment spreading outward',
    negative: 'side view, portrait, headshot, eye-level, horizon visible',
  },
  DRAMATIC_DUTCH_ANGLE: {
    prefix: '(camera tilted 20 degrees:1.3) creating diagonal horizon, off-balance dynamic energy,',
    suffix: 'creature in lower-right facing upper-left, (environment at a slant:1.2), dramatic tension',
    negative: 'level horizon, static, calm, centered, symmetrical',
  },
  NARRATIVE_MOMENT: {
    prefix: '(creature in left half of frame interacting with environment:1.3),',
    suffix: '(storytelling composition:1.2) with clear action and subject, rich environmental context',
    negative: 'portrait, headshot, static, alone, no context',
  },
  NARRATIVE_DUAL: {
    prefix: '(two creatures facing each other from opposite sides of the frame:1.3),',
    suffix: '(confrontation composition:1.2), negative space between them, split lighting',
    negative: 'single figure, portrait, headshot',
  },
  NARRATIVE_AFTERMATH: {
    prefix: '(creature in right third of frame looking across a scene of wreckage:1.3) to the left,',
    suffix: '(contemplative mood:1.2), smoke and debris in foreground partially obscuring creature legs',
    negative: 'portrait, headshot, clean background, no context',
  },
  NARRATIVE_RITUAL: {
    prefix: '(creature kneeling in center surrounded by glowing magical energy:1.3) in a circle,',
    suffix: '(energy gathering upward:1.2), ceremonial setting, camera slightly above looking down',
    negative: 'standing, portrait, headshot, no magic',
  },
};

function getCompositionDirective(fullComposition) {
  for (const [key, directive] of Object.entries(COMPOSITION_DIRECTIVES)) {
    if (COMPOSITION_POOL[key] === fullComposition) return directive;
  }
  // Fallback
  return { prefix: fullComposition.split(',')[0] + ',', suffix: '', negative: '' };
}

function selectEnvironment(factionKey) {
  const envKey = FACTION_ENV_MAP[factionKey] || 'ironwright';
  const envs = FACTION_ENVIRONMENTS[envKey];
  return envs[Math.floor(Math.random() * envs.length)];
}

// Enhanced negative prompt — council-recommended for pushing DreamShaper toward traditional media
const NEGATIVE_PROMPT =
  'digital art, digital painting, concept art, artstation, deviantart, cgsociety, ' +
  '3d render, CGI, photorealistic, hyperrealistic, subsurface scattering, ambient occlusion, ' +
  'global illumination, HDR, bloom, lens flare, chromatic aberration, ' +
  'smooth gradients, airbrushed, airbrush shading, plastic skin, vinyl texture, ' +
  'iridescent, holographic, neon, glowing outline, studio lighting, ' +
  'watermark, signature, text, words, letters, logos, borders, frames, card border, ui elements, ' +
  'contemporary digital fantasy, game concept art, ' +
  'anime style, manga, comic book halftone, cel shading, toon shading, flat color, gradient map, ' +
  'watercolor wash, loose sketch, pencil lines, ink wash, ' +
  'deformed, disfigured, bad anatomy, extra limbs, missing limbs, floating limbs, ' +
  'blurry, jpeg artifacts, low quality, worst quality, cropped, out of frame, ' +
  'monochrome, grayscale, black and white, desaturated, sepia, ' +
  'centered symmetrical pose, T-pose, A-pose, white background, ' +
  'collage, grid layout, concept art sheet, cartoon, ' +
  'nudity, naked, bare chest, bare breasts, exposed skin, revealing clothing, nsfw, cleavage';

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
  // Ironwright — legendary with 4 keywords (tests card layout with max modifiers)
  {
    spec_id: 'iron-v4-03',
    faction_key: 'IRONWRIGHT',
    faction_id: FACTION_IDS.IRONWRIGHT,
    creature_archetype: 'Forgemaster Titan',
    creature_description: 'An ancient colossal automaton built from the hulls of decommissioned warships, its torso is a blast furnace with the door welded shut and fire leaking from every seam, one arm ends in a massive anvil-fist and the other in a cluster of welding torches and articulated clamps, its legs are railway bridge trusses repurposed as limbs, a smokestack crown belches black industrial smog, every surface covered in decades of weld repairs and patch plates',
    visual_description: 'Warship-hull titan with blast furnace torso, anvil-fist, smokestack crown',
    card_type: 'CREATURE',
    cm_cost: 9,
    base_attack: 8,
    base_health: 9,
    base_instability: 5,
    keywords: ['Shield', 'Piercing', 'Taunt', 'Reach'],
    rarity: 'LEGENDARY',
  },
  // ---- Bible archetype cards for variety testing ----
  // Ironwright — non-combat, intimate moment (Clockwork Surgeon)
  {
    spec_id: 'iron-v4-04',
    faction_key: 'IRONWRIGHT',
    faction_id: FACTION_IDS.IRONWRIGHT,
    creature_archetype: 'Clockwork Surgeon',
    creature_description: 'A gaunt woman with a magnifying monocle on an articulated brass arm swung over her left eye, oil-stained surgical gloves, a leather apron covered in tiny gear-tools and watchmaker implements, her right hand holds a pair of needle-nose pliers adjusting a miniature piston inside an open mechanical forearm, her patient is a brass automaton lying on a steel operating table, tubes of lubricant feeding into the joint',
    visual_description: 'Gaunt surgeon with brass monocle arm, adjusting pistons inside an automaton patient',
    card_type: 'CREATURE',
    cm_cost: 3,
    base_attack: 1,
    base_health: 4,
    base_instability: 1,
    keywords: ['Shield'],
    rarity: 'UNCOMMON',
  },
  // Ironwright — small utility creature (Canary Keeper)
  {
    spec_id: 'iron-v4-05',
    faction_key: 'IRONWRIGHT',
    faction_id: FACTION_IDS.IRONWRIGHT,
    creature_archetype: 'Canary Keeper',
    creature_description: 'A small wiry figure in a heavy leather coat with a caged canary strapped to their chest, a headlamp casting a cone of yellowish gaslight, soot streaks across their face, a gas-detection bellows in one hand, descending alone into a dark mine shaft on a chain-driven elevator platform, rope coiled over one shoulder, pickaxe strapped to their back',
    visual_description: 'Small miner with chest-mounted canary cage and headlamp, descending into darkness',
    card_type: 'CREATURE',
    cm_cost: 1,
    base_attack: 0,
    base_health: 2,
    base_instability: 0,
    keywords: ['Reach'],
    rarity: 'COMMON',
  },
  // Fey Courts — sinister trickster (Changeling)
  {
    spec_id: 'fey-v4-03',
    faction_key: 'FEY_COURTS',
    faction_id: FACTION_IDS.FEY_COURTS,
    creature_archetype: 'The Changeling',
    creature_description: 'A sinister fey shapeshifter mid-transformation, its body splitting between two forms: the left half is a pale green-skinned creature with elongated arms ending in twig-like claws, a rack of mossy antlers growing from its skull, hollow black eye sockets leaking amber sap, the right half still wears the stolen face of a young woman with rosy cheeks and a too-wide smile showing pointed teeth, the seam between the two halves ripples like water, surrounded by emerald foxfire and drifting autumn leaves in deep forest twilight',
    visual_description: 'Fey shapeshifter split between monster and stolen human face, amber sap and emerald foxfire',
    card_type: 'CREATURE',
    cm_cost: 2,
    base_attack: 2,
    base_health: 2,
    base_instability: 3,
    keywords: ['Deathtouch'],
    rarity: 'UNCOMMON',
  },
  // Fey Courts — elder creature (Spore Druid)
  {
    spec_id: 'fey-v4-04',
    faction_key: 'FEY_COURTS',
    faction_id: FACTION_IDS.FEY_COURTS,
    creature_archetype: 'Spore Druid',
    creature_description: 'A towering ancient treant-like fey creature covered in layers of vivid shelf fungi in brilliant orange and toxic green and deep violet, its form is thick gnarled bark and twisted roots shaped into a hunched humanoid, a weathered face with glowing amber eyes peers out from within the mushroom growth, its arms are massive root appendages plunging into mossy earth, around it a ring of luminous teal mushrooms emit clouds of golden spores drifting upward like embers, the forest floor glows with branching networks of electric blue fungal threads, a dark ancient forest canopy looms above',
    visual_description: 'Towering bark-and-fungi treant with vivid orange and green shelf fungi, golden spore clouds, glowing forest floor',
    card_type: 'CREATURE',
    cm_cost: 5,
    base_attack: 3,
    base_health: 5,
    base_instability: 2,
    keywords: ['Lifesteal', 'Reach'],
    rarity: 'RARE',
  },
  // Demonic — bureaucratic horror (Infernal Advocate)
  {
    spec_id: 'demon-v4-03',
    faction_key: 'DEMONIC',
    faction_id: FACTION_IDS.DEMONIC,
    creature_archetype: 'Infernal Advocate',
    creature_description: 'A tall gaunt horned demon draped in heavy robes of charred crimson velvet and tarnished gold brocade, its face is aristocratic and cruel with too many sharp teeth in a wide predatory grin, curved ram horns sweep back from a high forehead, long clawed fingers hold a burning scroll of soul contracts that trails hellfire and dripping molten gold ink, its eyes glow sulfur yellow, behind it towers a wall of filing cabinets made of black iron and bone, each drawer leaking wisps of trapped souls, warm candlelight and infernal red glow illuminate the scene',
    visual_description: 'Horned demon bureaucrat in charred crimson robes, burning soul contracts, wall of bone filing cabinets',
    card_type: 'CREATURE',
    cm_cost: 4,
    base_attack: 2,
    base_health: 4,
    base_instability: 3,
    keywords: ['Lifesteal'],
    rarity: 'UNCOMMON',
  },
  // Demonic — body horror (Pain Alchemist)
  {
    spec_id: 'demon-v4-04',
    faction_key: 'DEMONIC',
    faction_id: FACTION_IDS.DEMONIC,
    creature_archetype: 'Pain Alchemist',
    creature_description: 'A grotesque demon alchemist with skin like cracked grey leather stretched over too-visible bones, eight spidery fingers on each hand, hunched over a stone worktable covered in bubbling flasks of glowing emerald poison and vials of molten crimson liquid, shelves behind it hold glass jars of luminous amber crystals and swirling violet smoke, its face is a skeletal nightmare with sunken eyes that burn toxic green, wearing a heavy leather apron stained with iridescent alchemical residue in blues and golds, the walls of the chamber are living flesh with pulsing veins of dark ichor, lit by sickly green alchemical light from below',
    visual_description: 'Skeletal demon alchemist with eight-fingered hands, glowing emerald and crimson flasks, living flesh walls',
    card_type: 'CREATURE',
    cm_cost: 3,
    base_attack: 3,
    base_health: 2,
    base_instability: 4,
    keywords: ['Deathtouch'],
    rarity: 'RARE',
  },
];

// ==========================================================================
// API call helpers
// ==========================================================================

// ==========================================================================
// fal.ai API: DreamShaper XL (SDXL fine-tune for fantasy/painterly art)
// 25 steps + guidance 8.5 = council-recommended sweet spot for painterly output.
// Negative prompts critical for pushing away from digital aesthetic.
// ==========================================================================

// Use curl for all fal.ai HTTP — Node fetch has DNS/TLS issues on this machine
function curlPost(url, body, timeoutSec = 30) {
  const tmpFile = `/tmp/fal-body-${Date.now()}.json`;
  writeFileSync(tmpFile, JSON.stringify(body));
  try {
    const result = execFileSync('curl', [
      '-s', '--max-time', String(timeoutSec),
      '-X', 'POST', url,
      '-H', `Authorization: Key ${FAL_KEY}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tmpFile}`,
    ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(result);
  } finally {
    try { execFileSync('rm', [tmpFile]); } catch {}
  }
}

function curlGet(url, timeoutSec = 30) {
  const result = execFileSync('curl', [
    '-s', '--max-time', String(timeoutSec),
    '-H', `Authorization: Key ${FAL_KEY}`,
    url,
  ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(result);
}

async function callFalSD(body) {
  // Queue mode: submit → poll → fetch result.
  // Using fal-ai/fast-sdxl with ClassipeintXL LoRA for oil painting style.
  const endpoint = 'fal-ai/fast-sdxl';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 30);
  if (submitResult.detail) throw new Error(`fal.ai submit error: ${JSON.stringify(submitResult.detail)}`);
  const requestId = submitResult.request_id;
  if (!requestId) throw new Error(`No request_id in fal.ai response: ${JSON.stringify(submitResult)}`);

  // Poll for completion
  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  const t0 = Date.now();
  let queueDone = false;
  let inQueue = true;
  while (!queueDone) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    const status = curlGet(pollUrl, 15);
    if (status.status === 'COMPLETED') {
      queueDone = true;
    } else if (status.status === 'FAILED') {
      throw new Error(`fal.ai generation failed: ${JSON.stringify(status)}`);
    } else {
      if (inQueue && status.status === 'IN_PROGRESS') {
        console.log(`    Queue wait: ${elapsed}s, now generating...`);
        inQueue = false;
      } else if (inQueue) {
        process.stdout.write(`    Queued ${elapsed}s (pos: ${status.queue_position ?? '?'})...\r`);
      }
      // Wait 2s between polls
      execFileSync('sleep', ['2']);
    }
  }
  const totalWait = ((Date.now() - t0) / 1000).toFixed(1);

  // Fetch result
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 30);
  if (result.detail) throw new Error(`fal.ai fetch error: ${JSON.stringify(result.detail)}`);

  console.log(`    Total fal.ai time: ${totalWait}s`);
  return result;
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

  // 1. Build art prompt with bible-sourced variety dimensions
  // Prompt order: COMPOSITION FIRST (SDXL gives highest attention to first 77 tokens),
  // then style anchor, then creature description, then environment/flavor.
  // This ensures the camera angle/pose actually gets rendered instead of buried.
  const subFlavor = selectSubFlavor(spec.faction_key);
  // --comp FLAG: force a specific composition (e.g. --comp ENVIRONMENTAL_WIDE)
  const compFlag = process.argv.includes('--comp') ? process.argv[process.argv.indexOf('--comp') + 1] : null;
  const composition = (compFlag && COMPOSITION_POOL[compFlag]) ? COMPOSITION_POOL[compFlag] : selectComposition(spec);
  const compositionName = Object.entries(COMPOSITION_POOL).find(([, v]) => v === composition)?.[0] || 'UNKNOWN';
  const environment = selectEnvironment(spec.faction_key);
  const weather = selectWeather();
  const timeOfDay = selectTimeOfDay();
  const scale = selectScale(spec.cm_cost ?? 3);
  const gear = selectGear(spec.faction_key);
  const mood = selectMood(spec.faction_key);
  const texture = selectTexture(spec.faction_key);

  // Prompt structure: COMP PREFIX → creature → style → COMP SUFFIX → environment → extras.
  // Prefix and suffix sandwich the creature description to reinforce the composition
  // from both ends. Composition-specific negative terms block portrait defaults.
  const compDir = getCompositionDirective(composition);
  const promptParts = [compDir.prefix, spec.creature_description, STYLE_ANCHOR];
  if (compDir.suffix) promptParts.push(compDir.suffix);
  if (gear) promptParts.push(gear);
  promptParts.push(environment);
  promptParts.push(subFlavor);
  if (mood) promptParts.push(mood);
  if (texture) promptParts.push(texture);
  if (weather) promptParts.push(weather);
  if (timeOfDay) promptParts.push(timeOfDay);
  if (scale) promptParts.push(scale);
  const fullPrompt = promptParts.join(', ');

  // Add composition-specific negative terms (e.g. "portrait, headshot" for action shots)
  const fullNegative = compDir.negative
    ? NEGATIVE_PROMPT + ', ' + compDir.negative
    : NEGATIVE_PROMPT;

  const artRequest = {
    prompt: fullPrompt,
    negative_prompt: fullNegative,
    image_size: 'portrait_4_3',
    num_inference_steps: 25,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    format: 'png',
    loras: LORA_CONFIG.loras,
  };

  // 2. Call fal.ai SDXL + ClassipeintXL LoRA (queue mode — immune to cold start timeouts)
  console.log(`  Submitting to fal.ai SDXL + ${LORA_CONFIG.label} (25 steps, cfg 7.5)...`);
  const falResult = await callFalSD(artRequest);

  if (falResult.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected — regenerate');
  }
  if (!falResult.images?.[0]?.url) {
    throw new Error('No image URL in fal.ai response');
  }

  const tempImageUrl = falResult.images[0].url;
  console.log(`  Art generated (seed: ${falResult.seed})`);

  // 3. Download image
  const t1 = Date.now();
  const imgResponse = await fetch(tempImageUrl);
  if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
  console.log(`  Downloaded ${(imageBuffer.length / 1024).toFixed(0)}KB in ${((Date.now() - t1) / 1000).toFixed(1)}s`);

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
1. Card name: 2-4 words, faction-appropriate, evocative and memorable
2. Flavor text: 2-3 sentences, 120-200 characters. Write it as a snippet of lore — a quote from a character, a fragment of a myth, or a brief scene. It should hint at a larger story. Faction voice, atmospheric, rich with worldbuilding detail.

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
  // --limit N: generate only the first N cards (for quick testing)
  // --only id1,id2: generate only specific spec_ids
  const limitIdx = process.argv.indexOf('--limit');
  const onlyIdx = process.argv.indexOf('--only');
  let specsToRun;
  if (onlyIdx !== -1 && process.argv[onlyIdx + 1]) {
    const ids = process.argv[onlyIdx + 1].split(',');
    specsToRun = CARD_SPECS.filter(s => ids.includes(s.spec_id));
  } else {
    const cardLimit = limitIdx !== -1 && process.argv[limitIdx + 1]
      ? parseInt(process.argv[limitIdx + 1])
      : CARD_SPECS.length;
    specsToRun = CARD_SPECS.slice(0, cardLimit);
  }

  console.log(`=== Chaos Creatures — Test Card Generation (SDXL + ${LORA_CONFIG.label}) ===`);
  console.log(`Generating ${specsToRun.length} of ${CARD_SPECS.length} cards...\n`);

  // Clean up any orphaned PENDING generation_jobs from previous attempts
  const { count } = await supabase
    .from('generation_jobs')
    .delete()
    .eq('status', 'PENDING')
    .select('*', { count: 'exact', head: true });
  if (count > 0) console.log(`Cleaned up ${count} orphaned PENDING generation_jobs\n`);

  const results = [];
  let totalCost = 0;

  for (const spec of specsToRun) {
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

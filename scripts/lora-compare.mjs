#!/usr/bin/env node
// lora-compare.mjs — Lightweight LoRA comparison script for multi-agent testing.
// Image generation only (no Supabase, no OpenAI) for fast iteration.
//
// Usage:
//   node scripts/lora-compare.mjs \
//     --agent A --run 1 \
//     --lora-url "https://huggingface.co/.../model.safetensors" \
//     --lora-scale 1.0 \
//     --trigger "oil painting" \
//     --style "dark atmospheric fantasy, muted earth tones, chiaroscuro lighting" \
//     --specs "iron-v4-01,demon-v4-03" \
//     [--comp COMPOSITION_NAME]
//
// Output: scripts/preview/{agent}-r{run}-{spec_id}.png + manifest JSON

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import * as Ironwright from './factions/ironwright.mjs';
import * as FeyCourts from './factions/fey-courts.mjs';
import * as Demonic from './factions/demonic.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, 'preview');

// Load FAL_KEY from game-server/.env
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
const FAL_KEY = env.FAL_KEY;
if (!FAL_KEY) { console.error('Missing FAL_KEY in .env'); process.exit(1); }
const OPENAI_API_KEY = env.OPENAI_API_KEY;

// ==========================================================================
// Parse CLI args
// ==========================================================================
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1];
}

const AGENT = getArg('agent') || 'X';
const RUN = getArg('run') || '1';
const LORA_URL = getArg('lora-url');
const LORA_SCALE = parseFloat(getArg('lora-scale') || '1.0');
const TRIGGER = getArg('trigger') || 'oil painting';
const STYLE_EXTRA = getArg('style') || 'dark atmospheric fantasy, muted earth tones, chiaroscuro lighting';
const SPEC_IDS = (getArg('specs') || '').split(',').filter(Boolean);
const FORCED_COMP = getArg('comp') || null;
const V2_MODE = process.argv.includes('--v2'); // scene-first prompt architecture
const V3_MODE = process.argv.includes('--v3'); // action-first prompt architecture
const V4_MODE = process.argv.includes('--v4'); // bible-based prompt architecture (faction art bible formula)
const NAME_MODE = process.argv.includes('--name'); // GPT-4o Mini post-gen naming

if (!LORA_URL) { console.error('Missing --lora-url'); process.exit(1); }
if (SPEC_IDS.length === 0) { console.error('Missing --specs'); process.exit(1); }

const STYLE_ANCHOR = `${TRIGGER}, ${STYLE_EXTRA}, no text no borders no watermarks`;

// ==========================================================================
// Faction data lookup (from bible modules)
// ==========================================================================
const FACTION_DATA = {
  IRONWRIGHT: Ironwright,
  FEY_COURTS: FeyCourts,
  DEMONIC: Demonic,
};

// ==========================================================================
// Card specs pool (same as generate-test-cards.mjs)
// ==========================================================================
const ALL_SPECS = {
  'iron-v4-01': {
    spec_id: 'iron-v4-01', faction_key: 'IRONWRIGHT', creature_archetype: 'Furnace Warden',
    creature_description: 'A squat heavy-set mechanical golem with a pot-belly furnace chest glowing orange through iron grate ribs, one arm is a massive wrench and the other a dented shield plate, its head is a riveted bucket helm with a single cracked lens, soot-stained and battle-worn with missing bolts and welded repair patches',
    creature_silhouette: 'a squat mechanical golem with glowing orange furnace chest, bucket helm, wrench arm and shield arm, soot-stained iron',
    creature_count: '1',
    cm_cost: 3, keywords: ['Shield'], rarity: 'COMMON', card_type: 'CREATURE',
  },
  'iron-v4-02': {
    spec_id: 'iron-v4-02', faction_key: 'IRONWRIGHT', creature_archetype: 'Siege Colossus',
    creature_description: 'A towering bipedal war machine three stories tall built from riveted hull plates and reactor segments, its torso is a converted reactor core with exhaust stacks belching black industrial waste, massive hydraulic-driven legs each ending in iron-shod crushing feet, a battering ram jaw mounted where a head should be, chains and grappling hooks dangle from its arms, rust and battle damage everywhere',
    creature_silhouette: 'a towering three-story bipedal war machine of hull plates and reactor segments, exhaust stacks belching waste, battering ram jaw',
    creature_count: '1',
    cm_cost: 7, keywords: ['Piercing'], rarity: 'EPIC', card_type: 'CREATURE',
  },
  'fey-v4-01': {
    spec_id: 'fey-v4-01', faction_key: 'FEY_COURTS', creature_archetype: 'Rootmaw Lurker',
    creature_description: 'A hunched predatory creature made of gnarled ancient tree roots twisted into a bestial shape, its mouth is a vertical split in the trunk lined with thorn-teeth, pale fungal growths cluster on its shoulders like tumors, two hollow knotholes serve as eyes with faint green foxfire deep within, moss hangs from it like matted fur',
    creature_silhouette: 'a hunched predatory root-beast with vertical thorn-toothed mouth, knothole eyes glowing green foxfire, moss-matted bark',
    creature_count: '1',
    cm_cost: 2, keywords: ['Lifesteal'], rarity: 'COMMON', card_type: 'CREATURE',
  },
  'fey-v4-02': {
    spec_id: 'fey-v4-02', faction_key: 'FEY_COURTS', creature_archetype: 'Moonwing Harbinger',
    creature_description: 'An ethereal moth-like fey creature with four translucent wings patterned like stained glass, its body is slender and insectoid wrapped in living ivy and silver thread, antennae trail luminous pollen, its face is eerily humanoid with compound eyes reflecting moonlight, it carries a staff of petrified wood capped with a glowing seed pod',
    creature_silhouette: 'an ethereal moth-fey with four stained-glass wings, slender ivy-wrapped body, trailing luminous pollen, humanoid face',
    creature_count: '1',
    cm_cost: 4, keywords: ['Flying'], rarity: 'UNCOMMON', card_type: 'CREATURE',
  },
  'demon-v4-01': {
    spec_id: 'demon-v4-01', faction_key: 'DEMONIC', creature_archetype: 'Slag Brute',
    creature_description: 'A hulking misshapen creature formed from cooled volcanic slag and fused bone, one shoulder is much larger than the other giving it a lopsided silhouette, cracks in its stone skin reveal the molten interior, a crude iron collar and broken chain hang from its thick neck, its face is a half-melted skull with one intact horn and one broken stump',
    creature_silhouette: 'a hulking lopsided creature of volcanic slag and bone, molten cracks glowing orange, half-melted skull face with one broken horn',
    creature_count: '1',
    cm_cost: 3, keywords: ['Deathtouch'], rarity: 'COMMON', card_type: 'CREATURE',
  },
  'demon-v4-02': {
    spec_id: 'demon-v4-02', faction_key: 'DEMONIC', creature_archetype: 'Tyrant of the Black Altar',
    creature_description: 'A massive horned demon seated on a throne of fused skulls and molten obsidian, four arms each gripping a different weapon — a serrated blade, a bone scepter, a chain whip, and a still-beating heart, its chest is split open revealing a furnace of hellfire within, a crown of broken swords sits atop its ram-like horns, lesser demons grovel at its feet',
    creature_silhouette: 'a massive four-armed horned demon on a skull throne, hellfire burning in split chest, crown of broken swords',
    creature_count: '1+minions',
    cm_cost: 8, keywords: ['Deathtouch', 'Piercing'], rarity: 'LEGENDARY', card_type: 'CREATURE',
  },
  'iron-v4-03': {
    spec_id: 'iron-v4-03', faction_key: 'IRONWRIGHT', creature_archetype: 'Forgemaster Titan',
    creature_description: 'An ancient colossal automaton built from the hulls of decommissioned warships, its torso is a reactor core with the containment door welded shut and fire leaking from every seam, one arm ends in a massive anvil-fist and the other in a cluster of welding torches and articulated clamps, its legs are structural I-beam trusses repurposed as limbs, exhaust stacks belch black industrial waste, every surface covered in decades of weld repairs and patch plates',
    creature_silhouette: 'a colossal automaton of warship hulls, reactor core torso leaking fire, anvil-fist arm, exhaust stack crown',
    creature_count: '1+minions',
    cm_cost: 9, keywords: ['Shield', 'Piercing', 'Taunt', 'Reach'], rarity: 'LEGENDARY', card_type: 'CREATURE',
  },
  'fey-v4-03': {
    spec_id: 'fey-v4-03', faction_key: 'FEY_COURTS', creature_archetype: 'The Changeling',
    creature_description: 'A sinister fey shapeshifter mid-transformation, its body splitting between two forms: the left half is a pale green-skinned creature with elongated arms ending in twig-like claws, a rack of mossy antlers growing from its skull, hollow black eye sockets leaking amber sap, the right half still wears the stolen face of a young woman with rosy cheeks and a too-wide smile showing pointed teeth, the seam between the two halves ripples like water, surrounded by emerald foxfire and drifting autumn leaves in deep forest twilight',
    creature_silhouette: 'a sinister fey shapeshifter splitting between two forms, half antlered green creature half stolen human face, seam rippling',
    creature_count: '1',
    cm_cost: 2, keywords: ['Deathtouch'], rarity: 'UNCOMMON', card_type: 'CREATURE',
  },
  'fey-v4-04': {
    spec_id: 'fey-v4-04', faction_key: 'FEY_COURTS', creature_archetype: 'Spore Druid',
    creature_description: 'A towering ancient treant-like fey creature covered in layers of vivid shelf fungi in brilliant orange and toxic green and deep violet, its form is thick gnarled bark and twisted roots shaped into a hunched humanoid, a weathered face with glowing amber eyes peers out from within the mushroom growth, its arms are massive root appendages plunging into mossy earth, around it a ring of luminous teal mushrooms emit clouds of golden spores drifting upward like embers, the forest floor glows with branching networks of electric blue fungal threads, a dark ancient forest canopy looms above',
    creature_silhouette: 'a towering treant covered in vivid shelf fungi, gnarled bark body, glowing amber eyes, root arms, surrounded by luminous mushrooms',
    creature_count: '1',
    cm_cost: 5, keywords: ['Lifesteal', 'Reach'], rarity: 'RARE', card_type: 'CREATURE',
  },
  'demon-v4-03': {
    spec_id: 'demon-v4-03', faction_key: 'DEMONIC', creature_archetype: 'Infernal Advocate',
    creature_description: 'A tall gaunt horned demon draped in heavy robes of charred crimson velvet and tarnished gold brocade, its face is aristocratic and cruel with too many sharp teeth in a wide predatory grin, curved ram horns sweep back from a high forehead, long clawed fingers hold a burning scroll of soul contracts that trails hellfire and dripping molten gold ink, its eyes glow sulfur yellow, behind it towers a wall of filing cabinets made of black iron and bone, each drawer leaking wisps of trapped souls, warm candlelight and infernal red glow illuminate the scene',
    creature_silhouette: 'a tall gaunt horned demon in charred crimson robes, aristocratic cruel face, holding a burning scroll of soul contracts',
    creature_count: '1',
    cm_cost: 4, keywords: ['Lifesteal'], rarity: 'UNCOMMON', card_type: 'CREATURE',
  },
  'demon-v4-04': {
    spec_id: 'demon-v4-04', faction_key: 'DEMONIC', creature_archetype: 'Pain Alchemist',
    creature_description: 'A grotesque demon alchemist with skin like cracked grey leather stretched over too-visible bones, eight spidery fingers on each hand, hunched over a stone worktable covered in bubbling flasks of glowing emerald poison and vials of molten crimson liquid, shelves behind it hold glass jars of luminous amber crystals and swirling violet smoke, its face is a skeletal nightmare with sunken eyes that burn toxic green, wearing a heavy leather apron stained with iridescent alchemical residue in blues and golds, the walls of the chamber are living flesh with pulsing veins of dark ichor, lit by sickly green alchemical light from below',
    creature_silhouette: 'a grotesque skeletal demon alchemist hunched over bubbling flasks of glowing poison, eight spidery fingers, toxic green eyes',
    creature_count: '1',
    cm_cost: 3, keywords: ['Deathtouch'], rarity: 'RARE', card_type: 'CREATURE',
  },

  // --- Ironwright variety batch (8 cards spanning full faction identity) ---
  'iron-var-01': {
    spec_id: 'iron-var-01', faction_key: 'IRONWRIGHT', creature_archetype: 'Slag-Rat Scavenger',
    creature_description: 'A small burrowing rodent-like construct with a body of welded scrap iron plates and exposed rebar ribs, its snout is a rotating diamond-tipped drill bit that spins lazily, beady sensor-lens eyes glow a dim amber through cracked glass housings, stubby legs end in shovel-shaped iron claws caked with ore dust, a segmented tail of interlocking hull washers drags behind it through the strip-mine rubble',
    creature_silhouette: 'small burrowing scrap-iron rodent with drill-bit snout, sensor-lens eyes, shovel claws, segmented hull-washer tail',
    creature_count: '1',
    cm_cost: 1, keywords: [], rarity: 'COMMON', card_type: 'CREATURE',
  },
  'iron-var-02': {
    spec_id: 'iron-var-02', faction_key: 'IRONWRIGHT', creature_archetype: 'Rebar Drone',
    creature_description: 'A compact hovering automaton no taller than a child, its body a crude cube of poured concrete reinforced with exposed rebar, four stubby thruster nozzles on its underside glow with reactor exhaust keeping it aloft, a single large sensor eye of cracked industrial glass dominates its front face, two articulated manipulator arms of cold-rolled iron extend from its sides ending in welding-torch fingers that spark intermittently',
    creature_silhouette: 'compact hovering concrete-and-rebar cube drone, single cracked sensor eye, two welding-torch manipulator arms, thruster exhaust below',
    creature_count: '1',
    cm_cost: 2, keywords: ['Deathtouch'], rarity: 'COMMON', card_type: 'CREATURE',
  },
  'iron-var-03': {
    spec_id: 'iron-var-03', faction_key: 'IRONWRIGHT', creature_archetype: 'Rivet Witch',
    creature_description: 'A gaunt human woman in heavy leather welding gear and iron-rimmed goggles pushed up on her forehead, her left arm replaced with a pneumatic rivet gun fused to the shoulder, bandolier of glowing reactor cartridges across her chest, face streaked with soot and burn scars, wild hair escaping from under a dented hard hat, standing with defiant posture',
    creature_silhouette: 'gaunt woman with pneumatic rivet-gun arm, welding gear, iron-rimmed goggles, bandolier of glowing reactor cartridges',
    creature_count: '1',
    cm_cost: 3, keywords: ['Piercing'], rarity: 'UNCOMMON', card_type: 'CREATURE',
  },
  'iron-var-04': {
    spec_id: 'iron-var-04', faction_key: 'IRONWRIGHT', creature_archetype: 'Void-Forge Raptor',
    creature_description: 'A large mechanical bird of prey with wingspan of twenty feet, feathers are overlapping cold-rolled iron scales that flex and shimmer, wings have visible hydraulic joints at each segment, talons are tempered steel grappling hooks, head is an eagle skull encased in an iron reactor-shielded helmet with twin exhaust pipes, eyes are spinning sensor arrays that glow blue, trailing reactor exhaust from wingtip vents',
    creature_silhouette: 'large mechanical raptor with iron-scale feathers, hydraulic-jointed wings, eagle skull in reactor-shielded helmet, sensor array eyes',
    creature_count: '1',
    cm_cost: 4, keywords: ['Flying'], rarity: 'UNCOMMON', card_type: 'CREATURE',
  },
  'iron-var-05': {
    spec_id: 'iron-var-05', faction_key: 'IRONWRIGHT', creature_archetype: 'Reactor-Back Bear',
    creature_description: 'A massive mechanical grizzly bear with hull plates of corroded iron riveted over a framework of exposed hydraulic pistons, its back is a functional reactor core with exhaust stacks rising from the spine venting industrial waste, jaw is a steel bear trap that opens impossibly wide, paws end in mining pick claws, one eye is a cracked sensor lamp and the other is dark and dead',
    creature_silhouette: 'massive mechanical bear with iron hull plates, reactor core on its back with exhaust stack spine, bear-trap jaw, mining pick claws',
    creature_count: '1',
    cm_cost: 5, keywords: ['Taunt'], rarity: 'RARE', card_type: 'CREATURE',
  },
  'iron-var-06': {
    spec_id: 'iron-var-06', faction_key: 'IRONWRIGHT', creature_archetype: 'Void Frigate',
    creature_description: 'A small military void-craft converted into a living war-creature, the hull envelope is reinforced concrete over iron ribs, gun turrets along the gondola are operated by tiny automaton drones, thruster arrays spin from reactor-powered engines, anchor chains dangle like tentacles, the prow is a cast-iron rams head battering ram',
    creature_silhouette: 'small military void-craft creature with concrete-over-iron hull, gun turrets, dangling anchor-chain tentacles, iron ram prow',
    creature_count: '1+minions',
    cm_cost: 6, keywords: ['Flying', 'Reach'], rarity: 'RARE', card_type: 'CREATURE',
  },
  'iron-var-07': {
    spec_id: 'iron-var-07', faction_key: 'IRONWRIGHT', creature_archetype: 'Bunker Colossus',
    creature_description: 'An enormous humanoid automaton built from an entire concrete bunker complex, its torso is the blast door itself with a reactor-powered maw that opens to reveal a furnace throat, reinforced turret mounts rise from its shoulders as pauldrons, the walls form its chest armor with viewport slits still visible, its legs are reinforced concrete pylons fitted with hydraulic joints, it carries a bridge segment as a shield',
    creature_silhouette: 'enormous bunker-complex automaton with blast-door mouth, turret-mount shoulders, bridge-segment shield, concrete pylon legs',
    creature_count: '1',
    cm_cost: 8, keywords: ['Shield', 'Taunt'], rarity: 'EPIC', card_type: 'CREATURE',
  },
  'iron-var-08': {
    spec_id: 'iron-var-08', faction_key: 'IRONWRIGHT', creature_archetype: 'The Iron Wyrm',
    creature_description: 'A serpentine mechanical dragon that coils and slithers rather than stands, its body is an impossibly long chain of interlocking reactor segments connected by flexible armored joints, each segment has its own set of stumpy articulated legs like a centipede, the head is a reinforced concrete-and-iron jaw lined with hydraulic-driven teeth that snap open and shut rhythmically, six small red sensor-lens eyes cluster on each side of the wedge-shaped skull, a forest of exhaust stacks runs the length of its spine belching black reactor waste and orange embers, its coils wrap around and crush whatever is nearby, the tail ends in a massive flywheel turbine spinning at lethal speed',
    creature_silhouette: 'serpentine mechanical centipede-dragon of interlocking reactor segments, concrete-iron jaw, six red sensor eyes per side, exhaust stack spine, flywheel tail',
    creature_count: '1+minions',
    cm_cost: 10, keywords: ['Flying', 'Shield', 'Piercing'], rarity: 'LEGENDARY', card_type: 'CREATURE',
  },

  // --- Bible-sourced faction specs (from faction data modules) ---
  ...Ironwright.CARD_SPECS,
  ...FeyCourts.CARD_SPECS,
  ...Demonic.CARD_SPECS,
};

// ==========================================================================
// Composition directives (same as generate-test-cards.mjs — with emphasis weighting)
// ==========================================================================
const COMPOSITION_POOL = {
  PORTRAIT_THREE_QUARTER: 'three-quarter view',
  PORTRAIT_PROFILE: 'strict side profile',
  PORTRAIT_FROM_BEHIND: 'seen from behind',
  PORTRAIT_EXTREME_WIDE: 'tiny creature in vast landscape',
  ACTION_ATTACK: 'creature lunging mid-strike',
  ACTION_DEFEND: 'defensive stance bracing',
  ACTION_PROWL: 'crouched low stalking',
  ACTION_COMMAND: 'elevated commanding',
  ENVIRONMENTAL_WIDE: 'wide establishing shot vast landscape',
  ENVIRONMENTAL_EMERGING: 'emerging from fog',
  ENVIRONMENTAL_UNDERGROUND: 'deep underground cavern',
  ENVIRONMENTAL_SKYBORNE: 'high in the sky wings spread',
  ENVIRONMENTAL_THRESHOLD: 'standing in archway silhouette',
  DRAMATIC_LOW_ANGLE: 'extreme low angle looking up',
  DRAMATIC_SILHOUETTE: 'dark silhouette against sky',
  DRAMATIC_OVERHEAD: 'overhead birds-eye view',
  DRAMATIC_DUTCH_ANGLE: 'tilted camera diagonal horizon',
  NARRATIVE_MOMENT: 'interacting with environment',
  NARRATIVE_AFTERMATH: 'looking across wreckage',
  NARRATIVE_RITUAL: 'kneeling in magical circle',
};

const COMPOSITION_DIRECTIVES = {
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

// Faction environments
const FACTION_ENVIRONMENTS = {
  IRONWRIGHT: [
    'inside a vast orbital shipyard, skeletal warship hulls under construction, welding arcs in vacuum, gantry cranes swinging reactor cores',
    'on a planetary strip-mine surface, terraced excavation descending into darkness, massive bucket-wheel excavators, exposed geological strata',
    'in a void-dock hangar, pressurized atmosphere behind mag-sealed bay doors, half-assembled fighters suspended on hydraulic arms',
    'inside a star-forge control room, banks of analog instruments, reactor readouts redlining, reinforced concrete blast walls',
    'on the exterior hull of a dreadnought under construction, workers in pressure suits welding rebar-reinforced plating, stars behind',
    'in a foundry command center, poured concrete walls lined with pipe conduits, holographic production manifests, iron blast doors',
    'inside a collapsing reactor chamber, emergency lighting, containment field failing, superheated coolant venting through ruptured pipes',
    'on a slag-field battlefield, twisted rebar and shattered concrete, wrecked war machines half-buried in industrial waste',
    'in a subterranean ore processing facility, conveyor belts carrying raw material through crushing and smelting stages, brutal scale',
    'atop a void-dock observation tower overlooking an armada of iron warships, engine exhaust trails visible against deep space',
  ],
  FEY_COURTS: [
    'in the Endless Feast Hall, table stretching to horizon, dancing guests who cannot stop',
    'inside a Hollow Tree Palace, impossibly vast tree interior, spiral staircases of living wood',
    'in the Thorn Maze, walls of living briar 30 feet high, bones tangled in the hedge',
    'at the Mirror Lake, perfectly still water reflecting a different time, shore of silver sand',
  ],
  DEMONIC: [
    'on the Soul Exchange trading floor, boards showing soul prices, frantic demonic brokers',
    'in a volcanic court throne room inside a caldera, obsidian pillars, lava flowing in channels',
    'in the Garden of Earthly Delights, Bosch-inspired surreal landscape, impossible creatures',
    'inside the Broken Clocktower, massive damaged mechanism, stolen time leaking as golden mist',
  ],
};

// Sub-faction flavors
const FACTION_SUB_FLAVORS = {
  IRONWRIGHT: [
    'orbital shipyard assembly bay, poured concrete and cold-rolled iron, reactor orange and gunmetal palette',
    'void-dock hangar, half-assembled fighters on hydraulic arms, cold steel blue and warning amber palette',
    'planetary strip-mine, terraced excavation, exposed rebar and slag, ash gray and dull orange embers palette',
  ],
  FEY_COURTS: [
    'Verdant Throne spring court, exploding flowers, pollen storms, emerald and gold and warm amber palette',
    'Wild Hunt predation, antlered riders, spectral hounds, silver and cobalt blue and hunter green palette',
    'Mushroom Ring decomposition, bioluminescent fungi, deep teal and sickly yellow-green and bruise purple palette',
  ],
  DEMONIC: [
    'Furnace Lords volcanic wrath, magma rivers, jagged obsidian armor, magma orange and obsidian black palette',
    'Fleshweavers body horror, surgical theaters, stitched creatures, flesh tones and bone white and organ red palette',
    'Clock Devourers time debt, broken clocks, hourglass prisons, amber and void blue palette',
  ],
};

// ==========================================================================
// V2: Scene-first composition system (environment → mood → creature as element)
// ==========================================================================
const SCENE_COMPOSITIONS = {
  ACTION_ATTACK: {
    camera: 'low angle dynamic shot with strong diagonal energy',
    scene_mood: 'violent motion, debris flying, dust and sparks in the air, impact moment',
    creature_placement: 'lunging from the lower-left toward the upper-right',
  },
  ACTION_DEFEND: {
    camera: 'ground-level frontal shot, stable composition',
    scene_mood: 'tension before impact, dust kicked up, bracing energy',
    creature_placement: 'planted firmly in the center, arms or body raised in defense',
  },
  ACTION_PROWL: {
    camera: 'ground-level tracking shot through undergrowth',
    scene_mood: 'predatory tension, quiet menace, compressed stillness',
    creature_placement: 'crouched very low in the midground, stalking toward the viewer',
  },
  ACTION_COMMAND: {
    camera: 'slightly low angle looking up at an elevated position',
    scene_mood: 'authority and dominance, wind-swept, commanding presence',
    creature_placement: 'standing on high ground in the upper third, arm raised pointing outward, smaller figures below',
  },
  ENVIRONMENTAL_WIDE: {
    camera: 'extreme wide panoramic establishing shot, vast landscape',
    scene_mood: 'epic scale, the environment overwhelms, atmospheric depth and distance',
    creature_placement: 'a relatively small figure in the center-right, dwarfed by the landscape',
  },
  ENVIRONMENTAL_EMERGING: {
    camera: 'medium shot with heavy atmospheric fog, shallow depth',
    scene_mood: 'mystery, concealment, the unknown lurking, dense mist',
    creature_placement: 'partially hidden in the left third, only head and one limb visible through swirling fog',
  },
  ENVIRONMENTAL_UNDERGROUND: {
    camera: 'wide shot inside a vast underground cavern, looking deeper',
    scene_mood: 'enclosed darkness, bioluminescent glow, dripping stalactites, oppressive stone',
    creature_placement: 'in the midground off-center, framed between stalactite formations',
  },
  ENVIRONMENTAL_SKYBORNE: {
    camera: 'vertigo-inducing upward shot into open sky, clouds swirling',
    scene_mood: 'freedom and danger of height, wind and light, vast emptiness above',
    creature_placement: 'in the upper third with wings spread wide, landscape far below',
  },
  ENVIRONMENTAL_THRESHOLD: {
    camera: 'centered symmetrical shot through a massive stone archway',
    scene_mood: 'dramatic backlighting, doorway framing, crossing between worlds',
    creature_placement: 'silhouetted dead center in the archway, bright light behind',
  },
  DRAMATIC_LOW_ANGLE: {
    camera: 'extreme low angle looking straight up, foreshortened perspective',
    scene_mood: 'towering menace, overwhelming power, dramatic sky behind',
    creature_placement: 'filling the upper 60% of frame, looming directly overhead',
  },
  DRAMATIC_SILHOUETTE: {
    camera: 'medium-wide shot, extremely high contrast, backlit',
    scene_mood: 'stark silhouette, only rim lighting on edges, dramatic colored sky',
    creature_placement: 'as a solid dark shape in the center against brilliant sky',
  },
  DRAMATIC_OVERHEAD: {
    camera: 'high elevated angle looking down from above',
    scene_mood: 'radial composition, environment spreading outward, top-down energy',
    creature_placement: 'foreshortened below, seen from above, ground detail radiating outward',
  },
  DRAMATIC_DUTCH_ANGLE: {
    camera: 'camera tilted 25 degrees, diagonal horizon line, off-balance framing',
    scene_mood: 'unease and dynamic tension, slanted world, unstable energy',
    creature_placement: 'in the lower-right facing upper-left across the tilted frame',
  },
  NARRATIVE_MOMENT: {
    camera: 'medium shot with rich environmental context visible all around',
    scene_mood: 'storytelling composition, clear action happening, a moment frozen in time',
    creature_placement: 'in the left half of the frame, actively interacting with objects or surroundings',
  },
  NARRATIVE_AFTERMATH: {
    camera: 'wide shot across a scene of wreckage and destruction',
    scene_mood: 'aftermath of battle, smoke and debris, contemplative silence',
    creature_placement: 'standing in the right third looking left across the devastation, partially obscured by foreground debris',
  },
  NARRATIVE_RITUAL: {
    camera: 'slightly elevated shot looking down into a glowing ceremonial circle',
    scene_mood: 'magical energy gathering, ritualistic geometry, mystical light rising upward',
    creature_placement: 'kneeling in the center of the circle, surrounded by arcane energy',
  },
  PORTRAIT_FROM_BEHIND: {
    camera: 'medium-wide shot from directly behind the subject, deep depth of field',
    scene_mood: 'journey ahead, vast unknown stretching into the distance, solitary path',
    creature_placement: 'seen entirely from behind in the lower third, looking out at an expansive vista',
  },
  PORTRAIT_EXTREME_WIDE: {
    camera: 'extreme wide landscape shot, creature is tiny',
    scene_mood: 'overwhelming scale of nature or architecture, lonely insignificance',
    creature_placement: 'a tiny figure in the lower third occupying less than 10% of the frame',
  },
};

// ==========================================================================
// V3: Action-first composition system (what's happening → where → creature as participant)
// ==========================================================================
const ACTION_SCENES = {
  ACTION_ATTACK: {
    action: 'A violent strike sends stone and debris scattering, dust and sparks erupting on impact',
    camera: 'low angle dynamic shot with strong diagonal energy',
  },
  ACTION_DEFEND: {
    action: 'The ground shakes as something massive braces against an incoming blow, tension crackling in the air',
    camera: 'ground-level frontal shot, stable grounded composition',
  },
  ACTION_PROWL: {
    action: 'Something stalks through the undergrowth, branches bending silently aside, prey unaware ahead',
    camera: 'ground-level tracking shot through dense foliage',
  },
  ACTION_COMMAND: {
    action: 'A commanding presence rallies forces from a high vantage, smaller figures gathering below in formation',
    camera: 'slightly low angle looking up at an elevated ridge',
  },
  ENVIRONMENTAL_WIDE: {
    action: 'A vast landscape stretches to the horizon, ancient and untouched, with a lone figure crossing through it',
    camera: 'extreme wide panoramic establishing shot',
  },
  ENVIRONMENTAL_EMERGING: {
    action: 'Dense fog rolls through the terrain as something barely visible pushes through, half-concealed and watching',
    camera: 'medium shot with heavy atmospheric fog, shallow depth of field',
  },
  ENVIRONMENTAL_UNDERGROUND: {
    action: 'Deep beneath the earth, bioluminescent light pulses off wet cavern walls as something moves between the pillars of stone',
    camera: 'wide shot inside a vast underground cavern looking deeper in',
  },
  ENVIRONMENTAL_SKYBORNE: {
    action: 'High above the world, wings carve through wind and cloud, the landscape a distant patchwork far below',
    camera: 'vertigo-inducing upward shot into open sky',
  },
  ENVIRONMENTAL_THRESHOLD: {
    action: 'A massive stone archway frames the passage between two worlds, brilliant light pouring through as a silhouette crosses the threshold',
    camera: 'centered symmetrical shot through the archway',
  },
  DRAMATIC_LOW_ANGLE: {
    action: 'Something enormous looms overhead, blotting out the sky, its shadow falling across the ground like a closing fist',
    camera: 'extreme low angle looking straight up, foreshortened perspective',
  },
  DRAMATIC_SILHOUETTE: {
    action: 'The sky burns with color as a dark shape stands motionless against it, only edges catching the dying light',
    camera: 'medium-wide extremely high contrast backlit shot',
  },
  DRAMATIC_OVERHEAD: {
    action: 'Seen from high above, a figure stands at the center of spreading destruction, the ground scarred outward in all directions',
    camera: 'high elevated angle looking straight down',
  },
  DRAMATIC_DUTCH_ANGLE: {
    action: 'The world tilts off-balance as chaos unfolds, nothing stable, everything sliding into disorder',
    camera: 'camera tilted 25 degrees with diagonal horizon line',
  },
  NARRATIVE_MOMENT: {
    action: 'A moment frozen in time as a creature interacts with its surroundings — touching, examining, reaching for something',
    camera: 'medium shot with rich environmental context visible all around',
  },
  NARRATIVE_AFTERMATH: {
    action: 'Smoke drifts across a ruined battlefield, the fighting over, wreckage and silence where violence was',
    camera: 'wide shot across a scene of wreckage and destruction',
  },
  NARRATIVE_RITUAL: {
    action: 'Arcane energy spirals upward from a glowing circle on the ground, a ritual reaching its crescendo',
    camera: 'slightly elevated shot looking down into the ceremonial circle',
  },
  PORTRAIT_FROM_BEHIND: {
    action: 'A solitary figure faces away from the viewer, gazing out across an endless vista stretching to the horizon',
    camera: 'medium-wide shot from directly behind the subject, deep depth of field',
  },
  PORTRAIT_EXTREME_WIDE: {
    action: 'A tiny figure crosses a landscape so vast it reduces everything to insignificance',
    camera: 'extreme wide landscape shot, the figure is tiny',
  },
};

// V3 action-first prompt builder
function buildActionFirstPrompt(spec, compName, environment, subFlavor) {
  const scene = ACTION_SCENES[compName];
  if (!scene) throw new Error(`Unknown action scene: ${compName}`);

  const countPhrase = creatureCountPhrase(spec);
  let silhouette = spec.creature_silhouette || spec.creature_description.substring(0, 120);
  silhouette = silhouette.replace(/^(a |an |the )/i, '');

  // Structure: what's happening → where → camera → aesthetic → creature as participant → style
  const creaturePart = countPhrase === 'a single'
    ? `a single ${silhouette}`
    : `${silhouette}, ${countPhrase}`;

  const parts = [
    scene.action,
    environment,
    scene.camera,
    subFlavor,
    creaturePart,
    STYLE_ANCHOR,
  ];
  return parts.join(', ');
}

// Creature count phrasing
function creatureCountPhrase(spec) {
  const count = spec.creature_count || '1';
  if (count === '1+minions') return 'with smaller lesser creatures at its feet';
  if (count === 'pack') return 'a pack of several';
  if (count === '2') return 'two creatures facing each other, one larger and more prominent';
  return 'a single';
}

// V2 scene-first prompt builder
function buildSceneFirstPrompt(spec, compName, environment, subFlavor) {
  const comp = SCENE_COMPOSITIONS[compName];
  if (!comp) throw new Error(`Unknown scene composition: ${compName}`);

  const countPhrase = creatureCountPhrase(spec);
  let silhouette = spec.creature_silhouette || spec.creature_description.substring(0, 120);
  // Strip leading article to avoid "a single a towering..."
  silhouette = silhouette.replace(/^(a |an |the )/i, '');

  // Structure: environment → camera → mood → creature as element → style
  const parts = [
    environment,
    comp.camera,
    subFlavor,
    comp.scene_mood,
    countPhrase === 'a single'
      ? `a single ${silhouette}, ${comp.creature_placement}`
      : `${silhouette}, ${comp.creature_placement}, ${countPhrase}`,
    STYLE_ANCHOR,
  ];
  return parts.join(', ');
}

const NEGATIVE_PROMPT =
  'digital art, digital painting, concept art, artstation, 3d render, CGI, photorealistic, ' +
  'smooth gradients, airbrushed, plastic skin, neon, glowing outline, ' +
  'watermark, signature, text, words, letters, logos, borders, frames, ui elements, ' +
  'anime, manga, cel shading, flat color, cartoon, ' +
  'deformed, disfigured, bad anatomy, extra limbs, missing limbs, ' +
  'blurry, jpeg artifacts, low quality, worst quality, cropped, ' +
  'nudity, naked, bare chest, bare breasts, exposed skin, revealing clothing, nsfw, cleavage';

// ==========================================================================
// Helpers
// ==========================================================================
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function selectComposition(spec) {
  if (FORCED_COMP && COMPOSITION_DIRECTIVES[FORCED_COMP]) return FORCED_COMP;
  const keywords = (spec.keywords || []).map(k => k.toUpperCase());
  const mc = spec.cm_cost || 3;
  // Keyword-driven
  if (keywords.includes('FLYING')) return pick(['ENVIRONMENTAL_SKYBORNE', 'ENVIRONMENTAL_WIDE', 'ACTION_ATTACK']);
  if (keywords.includes('DEATHTOUCH')) return pick(['ACTION_PROWL', 'ENVIRONMENTAL_EMERGING', 'DRAMATIC_DUTCH_ANGLE']);
  if (keywords.includes('PIERCING')) return pick(['ACTION_ATTACK', 'DRAMATIC_LOW_ANGLE', 'ENVIRONMENTAL_WIDE']);
  if (keywords.includes('SHIELD') || keywords.includes('TAUNT')) return pick(['ACTION_DEFEND', 'ENVIRONMENTAL_THRESHOLD', 'PORTRAIT_THREE_QUARTER']);
  if (keywords.includes('LIFESTEAL')) return pick(['ENVIRONMENTAL_EMERGING', 'ACTION_PROWL', 'NARRATIVE_MOMENT']);
  // Mana-driven
  if (mc >= 7) return pick(['DRAMATIC_LOW_ANGLE', 'ENVIRONMENTAL_WIDE', 'NARRATIVE_AFTERMATH']);
  if (mc >= 5) return pick(['ACTION_COMMAND', 'PORTRAIT_FROM_BEHIND', 'ENVIRONMENTAL_UNDERGROUND']);
  if (mc === 1) return pick(['PORTRAIT_EXTREME_WIDE', 'ENVIRONMENTAL_WIDE']);
  // Default variety
  return pick(['PORTRAIT_THREE_QUARTER', 'ACTION_PROWL', 'ENVIRONMENTAL_EMERGING', 'NARRATIVE_MOMENT', 'ENVIRONMENTAL_UNDERGROUND', 'DRAMATIC_DUTCH_ANGLE']);
}

function selectEnvironment(factionKey) {
  const envs = FACTION_ENVIRONMENTS[factionKey] || FACTION_ENVIRONMENTS.IRONWRIGHT;
  return pick(envs);
}

function selectSubFlavor(factionKey) {
  const flavors = FACTION_SUB_FLAVORS[factionKey] || FACTION_SUB_FLAVORS.IRONWRIGHT;
  return pick(flavors);
}

// ==========================================================================
// V4: Bible-based dynamic selectors (from faction data modules)
// ==========================================================================
function selectBibleEnvironment(factionKey) {
  const data = FACTION_DATA[factionKey];
  if (!data) return pick(Ironwright.ENVIRONMENTS);
  return pick(data.ENVIRONMENTS);
}

function selectBibleSubFlavor(factionKey) {
  const data = FACTION_DATA[factionKey];
  if (!data) return pick(Ironwright.SUB_FACTIONS).flavor;
  return pick(data.SUB_FACTIONS).flavor;
}

function selectMood(factionKey) {
  const data = FACTION_DATA[factionKey];
  if (!data) return pick(Ironwright.MOODS);
  return pick(data.MOODS);
}

function selectTexture(factionKey) {
  const data = FACTION_DATA[factionKey];
  if (!data) return pick(Ironwright.TEXTURES);
  return pick(data.TEXTURES);
}

// ==========================================================================
// V4: Creature action/pose pools (what the creature is DOING)
// ==========================================================================
const UNIVERSAL_ACTIONS = [
  // Combat
  'lunging forward mid-strike with jaws open',
  'rearing back about to unleash a devastating blow',
  'locked in a grapple with a smaller creature',
  'standing over a fresh kill, blood dripping',
  'charging headlong through debris and dust',
  'coiled and tensed, about to spring',
  // Non-combat
  'sleeping curled up in its lair',
  'eating, tearing into a carcass',
  'grooming itself, licking a wound',
  'drinking from a dark pool of water',
  'perched high up, watching the horizon',
  'sniffing the air, head tilted, ears pricked',
  'scratching territorial marks into stone',
  'carrying something precious in its jaws',
  'stretching lazily after waking',
  'nuzzling a smaller creature of its kind',
  // Emotional / narrative
  'howling or roaring at the sky',
  'backing away cautiously from something unseen',
  'pacing restlessly back and forth',
  'sitting perfectly still, ancient and patient',
  'turning to look directly over its shoulder at the viewer',
  'fleeing at full speed, looking back in fear',
];

const FACTION_ACTIONS = {
  IRONWRIGHT: [
    'hammering red-hot metal on an anvil with its fist',
    'dragging a massive chain behind it across concrete flooring',
    'venting reactor exhaust from ports while powering up',
    'pulling itself out of a pile of scrap iron and rebar',
    'stomping through a factory floor, workers scattering',
    'recalibrating its own hydraulic actuators with one arm',
    'sparking and short-circuiting, bolts of electricity arcing off its body',
    'standing guard at a massive iron blast door, motionless as a statue',
    'assembling a smaller automaton from salvaged reactor parts',
    'trudging through deep snow, frost forming on its hull plates',
  ],
  FEY_COURTS: [
    'weaving a spell from threads of moonlight between its fingers',
    'dissolving into a cloud of fireflies and reforming',
    'growing flowers and vines from its footsteps as it walks',
    'playing a bone flute, creatures gathering to listen',
    'reaching into a still pool and pulling something strange out',
    'dancing alone in a fairy ring at midnight',
    'whispering into the ear of a sleeping mortal',
    'shedding its old skin like a snake, new form beneath glowing',
    'sitting in a throne of living wood, roots growing around it',
    'stalking through chest-deep fog, only its antlers visible above the mist',
  ],
  DEMONIC: [
    'signing a contract with a quill made from a bone, ink glowing red',
    'emerging from a crack in the ground, pulling itself up',
    'lounging on a throne, idly torturing a small imp',
    'counting gold coins stacked on a desk made of skulls',
    'tearing open a portal in the air with its bare claws',
    'preaching from a pulpit of blackened iron to a crowd of lesser demons',
    'devouring a clock, time distorting around its mouth',
    'stitching new limbs onto its own body with surgical precision',
    'kneeling before a larger unseen presence, head bowed',
    'walking calmly through flames, completely unharmed and unconcerned',
  ],
};

function selectAction(factionKey) {
  // 60% chance faction-specific, 40% universal — keeps faction identity strong but adds surprise
  const factionActions = FACTION_ACTIONS[factionKey] || FACTION_ACTIONS.IRONWRIGHT;
  if (Math.random() < 0.6) return pick(factionActions);
  return pick(UNIVERSAL_ACTIONS);
}

// ==========================================================================
// V4: Mana cost → visual power scaling
// ==========================================================================
// Power expressed through VARIED visual languages — not just size.
// Low-cost: small, scrappy. Mid: capable, dangerous. High: awe-inspiring through
// size OR intensity OR presence OR magical corruption OR environmental reaction.
function getScaleModifiers(manaCost) {
  if (manaCost <= 2) return {
    sizePrefix: pick(['small', 'diminutive', 'scrappy little', 'compact']),
    powerSuffix: '',
    environmentScale: '',
  };
  if (manaCost <= 4) return {
    sizePrefix: '',
    powerSuffix: '',
    environmentScale: '',
  };
  if (manaCost <= 6) return {
    sizePrefix: pick(['large', 'imposing', 'battle-scarred', 'powerful']),
    powerSuffix: pick([
      'the air around it shimmers with latent energy',
      'smaller creatures keep their distance',
      'scorch marks and claw gouges on the ground around it',
      'its eyes burn with focused intensity',
    ]),
    environmentScale: '',
  };
  if (manaCost <= 8) return {
    sizePrefix: pick(['massive', 'ancient', 'fearsome', 'monstrous']),
    powerSuffix: pick([
      'everything nearby vibrates with the force of its presence',
      'the light bends strangely around its body',
      'cracks spread through the ground radiating outward from where it stands',
      'the weather itself seems to react to its mood',
    ]),
    environmentScale: pick([
      'the surrounding environment shows signs of its prolonged presence — warped metal, scorched earth, frozen patches',
      'nearby structures lean away from it as if repelled',
      '',  // sometimes no environment scale — let the creature speak for itself
    ]),
  };
  // 9-10: power through VARIED means — not always "biggest thing in frame"
  return {
    sizePrefix: pick([
      '',  // let the creature description define its own scale — some legendaries are powerful at normal size
      'ancient beyond measure',
      'legendary',
      'awe-inspiring',
    ]),
    powerSuffix: pick([
      'reality itself distorts around it like heat haze over hot metal',
      'color drains from the world near it, leaving only the creature in vivid detail',
      'the air crackles with barely contained energy arcing between surfaces',
      'everything it has touched bears permanent marks of its passage',
      'its mere gaze causes the environment to wither and transform',
      'an unnatural stillness surrounds it — no wind, no sound, no movement',
    ]),
    environmentScale: pick([
      'the environment bears the scars of its presence — cracked earth, twisted metal, bleached stone',
      'the boundary between the creature and its surroundings blurs as if it is part of the landscape',
      '',  // sometimes the creature IS the scale reference — no environment note needed
      '',
    ]),
  };
}

// V4 bible-based prompt builder
// Formula: COMPOSITION → SUBJECT → ACTION → ENVIRONMENT → LIGHTING → MATERIALS → PALETTE → STYLE
function buildBiblePrompt(spec, compName, factionKey) {
  const comp = COMPOSITION_DIRECTIVES[compName];
  if (!comp) throw new Error(`Unknown composition: ${compName}`);

  const environment = selectBibleEnvironment(factionKey);
  const mood = selectMood(factionKey);
  const texture = selectTexture(factionKey);
  const action = selectAction(factionKey);
  const scale = getScaleModifiers(spec.cm_cost || 3);

  const countPhrase = creatureCountPhrase(spec);
  let silhouette = spec.creature_silhouette || spec.creature_description.substring(0, 120);
  silhouette = silhouette.replace(/^(a |an |the )/i, '');

  // Inject size prefix before creature identity
  const sizedSilhouette = scale.sizePrefix ? `${scale.sizePrefix} ${silhouette}` : silhouette;

  // Bible formula: COMPOSITION → SUBJECT → ACTION → ENVIRONMENT → LIGHTING → MATERIALS → PALETTE → STYLE
  const creaturePart = countPhrase === 'a single'
    ? `a single ${sizedSilhouette}`
    : `${sizedSilhouette}, ${countPhrase}`;

  // Build action with power suffix for high-cost creatures
  const actionPart = scale.powerSuffix ? `${action}, ${scale.powerSuffix}` : action;

  // Build environment with scale impact for very high-cost creatures
  const envPart = scale.environmentScale ? `${environment}, ${scale.environmentScale}` : environment;

  const parts = [
    comp.prefix.replace(/,$/, ''),                    // COMPOSITION/FRAMING
    creaturePart,                                      // SUBJECT (creature identity + size)
    actionPart,                                        // ACTION + power indicator
    envPart,                                           // ENVIRONMENT + scale impact
    mood.description,                                  // MOOD/LIGHTING
    texture,                                           // MATERIAL/TEXTURE detail
    mood.palette,                                      // COLOR PALETTE
    STYLE_ANCHOR,                                      // STYLE
  ];
  return parts.join(', ');
}

// ==========================================================================
// fal.ai API (curl-based, queue mode)
// ==========================================================================
function curlPost(url, body, timeoutSec = 30) {
  const tmpFile = `/tmp/fal-body-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  const endpoint = 'fal-ai/fast-sdxl';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 30);
  if (submitResult.detail) throw new Error(`fal.ai submit error: ${JSON.stringify(submitResult.detail)}`);
  const requestId = submitResult.request_id;
  if (!requestId) throw new Error(`No request_id: ${JSON.stringify(submitResult)}`);

  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  const t0 = Date.now();
  let queueDone = false;
  while (!queueDone) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    const status = curlGet(pollUrl, 15);
    if (status.status === 'COMPLETED') { queueDone = true; }
    else if (status.status === 'FAILED') { throw new Error(`fal.ai failed: ${JSON.stringify(status)}`); }
    else {
      process.stdout.write(`    Waiting ${elapsed}s (${status.status})...\r`);
      execFileSync('sleep', ['2']);
    }
  }
  const totalWait = ((Date.now() - t0) / 1000).toFixed(1);
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 30);
  if (result.detail) throw new Error(`fal.ai fetch error: ${JSON.stringify(result.detail)}`);
  console.log(`    fal.ai time: ${totalWait}s`);
  return result;
}

// ==========================================================================
// GPT-4o Mini card naming (post-generation)
// ==========================================================================
async function generateCardName(prompt, faction, rarity, manaCost) {
  if (!OPENAI_API_KEY) {
    console.log('  [name] No OPENAI_API_KEY — skipping AI naming');
    return null;
  }
  const systemMsg = `You name fantasy trading card game cards. Given an image generation prompt, produce a single evocative card name (2-4 words) that matches what the scene actually depicts — the action, environment, and mood — not just the creature type. Names should feel like 1990s Magic: The Gathering card names.

Rules:
- ${rarity === 'LEGENDARY' ? 'Legendary cards get a title with a comma: "Name, the Title" (e.g. "Karn, Silver Golem")' : rarity === 'EPIC' ? 'Epic cards can use "the" or a dramatic modifier (e.g. "The Iron Colossus", "Raging Furnace")' : 'Common/Uncommon/Rare cards get simple 2-3 word names (e.g. "Iron Stalker", "Furnace Warden", "Reactor Viper")'}
- The name must reflect what you SEE in the scene, not just the creature
- Faction is ${faction} — names should feel thematically appropriate
- Mana cost ${manaCost}: ${manaCost <= 2 ? 'small, quick, minor' : manaCost <= 5 ? 'mid-weight, capable' : 'massive, powerful, imposing'}
- Return ONLY the card name, nothing else`;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: `Image prompt: "${prompt.substring(0, 400)}"` },
    ],
    max_tokens: 30,
    temperature: 0.9,
  };

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      console.log(`  [name] OpenAI error ${resp.status} — using archetype`);
      return null;
    }
    const data = await resp.json();
    const name = data.choices?.[0]?.message?.content?.trim().replace(/^"|"$/g, '');
    if (name) console.log(`  [name] AI name: "${name}"`);
    return name;
  } catch (err) {
    console.log(`  [name] Failed: ${err.message} — using archetype`);
    return null;
  }
}

// ==========================================================================
// Generate one card
// ==========================================================================
async function generateCard(spec) {
  const compName = selectComposition(spec);
  const environment = selectEnvironment(spec.faction_key);
  const subFlavor = selectSubFlavor(spec.faction_key);

  let fullPrompt, fullNegative;

  if (V4_MODE) {
    // V4: Bible-based — faction art bible formula (composition → subject → action → env → mood → texture → palette → style)
    fullPrompt = buildBiblePrompt(spec, compName, spec.faction_key);
    fullNegative = NEGATIVE_PROMPT + ', creature centered, creature fills frame, portrait, headshot, static pose';
    console.log(`  [V4 bible] ${spec.creature_archetype} [${compName}]`);
  } else if (V3_MODE) {
    // V3: Action-first — what's happening drives the scene, creature is a participant
    fullPrompt = buildActionFirstPrompt(spec, compName, environment, subFlavor);
    fullNegative = NEGATIVE_PROMPT + ', creature centered, creature fills frame, portrait, headshot, static pose';
    console.log(`  [V3 action-first] ${spec.creature_archetype} [${compName}]`);
  } else if (V2_MODE) {
    // V2: Scene-first — environment dominates, creature is an element within the scene
    fullPrompt = buildSceneFirstPrompt(spec, compName, environment, subFlavor);
    fullNegative = NEGATIVE_PROMPT + ', creature centered, creature fills frame, portrait, headshot';
    console.log(`  [V2 scene-first] ${spec.creature_archetype} [${compName}]`);
  } else {
    // V1: Creature-first — creature description dominates
    const compDir = COMPOSITION_DIRECTIVES[compName];
    const promptParts = [compDir.prefix, spec.creature_description, STYLE_ANCHOR];
    if (compDir.suffix) promptParts.push(compDir.suffix);
    promptParts.push(environment);
    promptParts.push(subFlavor);
    fullPrompt = promptParts.join(', ');
    fullNegative = compDir.negative
      ? NEGATIVE_PROMPT + ', ' + compDir.negative
      : NEGATIVE_PROMPT;
  }

  const artRequest = {
    prompt: fullPrompt,
    negative_prompt: fullNegative,
    image_size: 'portrait_4_3',
    num_inference_steps: 25,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    format: 'png',
    loras: [{ path: LORA_URL, scale: LORA_SCALE }],
  };

  console.log(`  Generating ${spec.creature_archetype} [${compName}]...`);
  const falResult = await callFalSD(artRequest);

  if (falResult.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW detected — retry with different seed');
  }
  if (!falResult.images?.[0]?.url) {
    throw new Error('No image URL in response');
  }

  // Download and save
  const imgResponse = await fetch(falResult.images[0].url);
  if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());

  const fileName = `${AGENT}-r${RUN}-${spec.spec_id}.png`;
  const filePath = join(PREVIEW_DIR, fileName);
  if (!existsSync(PREVIEW_DIR)) mkdirSync(PREVIEW_DIR, { recursive: true });
  writeFileSync(filePath, imageBuffer);
  console.log(`  Saved: ${fileName} (${(imageBuffer.length / 1024).toFixed(0)}KB, seed: ${falResult.seed})`);

  // AI-generated card name (if --name flag)
  let aiName = null;
  if (NAME_MODE) {
    aiName = await generateCardName(fullPrompt, spec.faction_key, spec.rarity, spec.cm_cost);
  }

  return {
    agent: AGENT,
    run: parseInt(RUN),
    fileName,
    specId: spec.spec_id,
    faction: spec.faction_key,
    archetype: aiName || spec.creature_archetype,
    originalArchetype: spec.creature_archetype,
    composition: compName,
    rarity: spec.rarity,
    keywords: spec.keywords,
    manaCost: spec.cm_cost,
    seed: falResult.seed,
    prompt: fullPrompt.substring(0, 500),
    loraUrl: LORA_URL,
    loraScale: LORA_SCALE,
    trigger: TRIGGER,
    styleExtra: STYLE_EXTRA,
  };
}

// ==========================================================================
// Main
// ==========================================================================
async function main() {
  const modeLabel = V4_MODE ? '[V4 BIBLE]' : V3_MODE ? '[V3 ACTION-FIRST]' : V2_MODE ? '[V2 SCENE-FIRST]' : '[V1 creature-first]';
  console.log(`\n=== Agent ${AGENT}, Run ${RUN} ${modeLabel} ===`);
  console.log(`LoRA: ${LORA_URL.split('/').pop()} @ ${LORA_SCALE}`);
  console.log(`Trigger: "${TRIGGER}"`);
  console.log(`Style: "${STYLE_EXTRA}"`);
  console.log(`Specs: ${SPEC_IDS.join(', ')}\n`);

  const results = [];
  for (const specId of SPEC_IDS) {
    const spec = ALL_SPECS[specId];
    if (!spec) { console.error(`Unknown spec: ${specId}`); continue; }

    let attempts = 0;
    while (attempts < 3) {
      try {
        const result = await generateCard(spec);
        results.push(result);
        break;
      } catch (err) {
        attempts++;
        console.error(`  Attempt ${attempts} failed: ${err.message}`);
        if (attempts >= 3) {
          results.push({ agent: AGENT, run: parseInt(RUN), specId, error: err.message });
        }
      }
    }
  }

  // Write manifest
  const manifestPath = join(PREVIEW_DIR, `${AGENT}-r${RUN}-manifest.json`);
  writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`\nManifest: ${AGENT}-r${RUN}-manifest.json`);
  console.log(`Generated: ${results.filter(r => !r.error).length}/${SPEC_IDS.length} cards`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

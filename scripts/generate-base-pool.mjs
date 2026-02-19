#!/usr/bin/env node
// generate-base-pool.mjs — Generate diverse base card training data
// Usage: node scripts/generate-base-pool.mjs --faction IRONWRIGHT --count 14
//        node scripts/generate-base-pool.mjs --faction CELESTIAL_CRUSADE --count 14 --type PLANAR_RUIN
// Uses fal-ai/fast-sdxl + EldritchPaletteKnife LoRA @ 0.9 (locked recipe)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POOL_DIR = join(__dirname, 'preview', 'pool');

// Parse CLI args
const factionIdx = process.argv.indexOf('--faction');
const countIdx = process.argv.indexOf('--count');
const typeIdx = process.argv.indexOf('--type');
if (factionIdx === -1) { console.error('Missing --faction'); process.exit(1); }
const FACTION = process.argv[factionIdx + 1];
const COUNT = countIdx !== -1 ? parseInt(process.argv[countIdx + 1]) : 14;
const CARD_TYPE = typeIdx !== -1 ? process.argv[typeIdx + 1] : 'CREATURE';

const VALID_FACTIONS = ['IRONWRIGHT', 'FEY_COURTS', 'DEMONIC', 'CELESTIAL_CRUSADE', 'THE_ENDLESS'];
if (!VALID_FACTIONS.includes(FACTION)) {
  console.error(`Invalid faction: ${FACTION}. Valid: ${VALID_FACTIONS.join(', ')}`); process.exit(1);
}
if (!['CREATURE', 'PLANAR_RUIN'].includes(CARD_TYPE)) {
  console.error(`Invalid type: ${CARD_TYPE}. Valid: CREATURE, PLANAR_RUIN`); process.exit(1);
}

// Load FAL_KEY
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
if (!FAL_KEY) { console.error('Missing FAL_KEY'); process.exit(1); }

// === LOCKED RECIPE ===
const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const LORA_SCALE = 0.9;
const STYLE_ANCHOR = 'oil painting, dark atmospheric fantasy, muted earth tones, chiaroscuro lighting, heavy impasto palette knife texture, no text no borders no watermarks';

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

// === CREATURE POOLS (diverse archetypes per faction) ===
const CREATURE_POOLS = {
  IRONWRIGHT: [
    { name: 'Reactor Warden', desc: 'A squat heavy-set mechanical golem with a pot-belly reactor core glowing orange through iron grate ribs, one arm is a massive rebar-reinforced wrench and the other a dented concrete shield plate, riveted bucket helm with a cracked sensor lens, soot-stained and battle-worn', cm: 3, kw: ['Shield'] },
    { name: 'Strip-Mine Scout', desc: 'A small wiry automaton in a heavy reinforced suit with a radiation sensor array strapped to its chest, headlamp casting harsh white light, carbon scoring across its plating, ore-detection probe in one hand, descending into darkness on a hydraulic lift', cm: 1, kw: ['Reach'] },
    { name: 'Siege Colossus', desc: 'A towering bipedal war machine three stories tall built from riveted hull plates and reactor components, torso is a converted reactor core belching exhaust, hydraulic piston-driven legs, reinforced concrete battering ram jaw, anchor chains and grappling hooks dangling', cm: 7, kw: ['Piercing'] },
    { name: 'Void-Forge Technician', desc: 'A gaunt figure with a magnifying sensor array on an articulated iron arm, oil-stained reinforced gloves, heavy canvas apron covered in tiny industrial tools, adjusting a miniature hydraulic piston inside the open forearm of an automaton patient', cm: 3, kw: ['Shield'] },
    { name: 'Siege Salamander', desc: 'A low-slung biomechanical lizard-creature with scales of overlapping iron blast plates, a thick segmented tail ending in a concrete wrecking ball, reactor exhaust vents along its spine hissing, heavy iron claws, beady red optical sensors', cm: 5, kw: ['Piercing'] },
    { name: 'Foundry Overseer', desc: 'A tall gaunt automaton in cold-rolled iron plating, wearing a cracked sensor visor, holding a massive data-slate chained to its wrist, its head is a reinforced viewport containing spinning calculation arrays and a glowing reactor indicator', cm: 3, kw: ['Shield'] },
    { name: 'Void-Dock Diver', desc: 'A hulking figure in a riveted vacuum-rated suit with circular viewport visor glowing green from within, hull-patched and scarred, massive hydraulic clamps for hands, tether cables trailing behind, pressure gauge on chest', cm: 4, kw: ['Taunt'] },
    { name: 'Orbital Wyrm', desc: 'A serpentine mechanical dragon built from warship hull segments, each body section a reactor module with thruster pods still attached, exhaust stacks running along its spine, jaws of interlocking hull-plate teeth, reactor-fire glowing in its throat', cm: 6, kw: ['Flying', 'Piercing'] },
    { name: 'Repair Drone Swarm', desc: 'A cloud of dozens of tiny maintenance drones, each the size of a fist, iron thruster-wings buzzing, wielding miniature welding tools, sparks flying as they repair each other mid-flight, moving as a chaotic coordinated mass', cm: 2, kw: [] },
    { name: 'Reactor Knight', desc: 'A humanoid warrior encased in reactor-powered plate armor, a compact reactor unit on its back connected by conduit pipes to arm hydraulics, visor glowing with reactor light, wielding a superheated iron lance', cm: 4, kw: ['Shield', 'Piercing'] },
    { name: 'Conduit Prophet', desc: 'A skeletal figure wrapped in robes of woven conduit cable, head replaced by a massive spinning turbine, arms spread wide with chains of interlocking pipe fittings cascading from its fingers, standing atop a pile of discarded reactor components', cm: 5, kw: ['Reach'] },
    { name: 'Slag Furnace Beetle', desc: 'An enormous scarab-like construct made of cast iron, its hull splits open to reveal a molten reactor core, six articulated legs of hydraulic pistons, mandibles dripping liquid metal, trails of cooling slag behind it', cm: 3, kw: ['Deathtouch'] },
    { name: 'Iron Cage Spider', desc: 'A spider-construct the size of a transport vehicle, body is a reinforced containment cage, eight legs of articulated rebar blades, webs of razor wire stretching between its legs, single glowing red sensor in the cage seam', cm: 4, kw: ['Deathtouch', 'Reach'] },
    { name: 'Exhaust Phantom', desc: 'A ghostly figure made entirely of trapped reactor exhaust and condensation given shape by a framework of conduit pipes and pressure valves, flickering between solid and vapor, a mournful face visible in the cloud, leaving trails of industrial mist', cm: 2, kw: ['Flying'] },
  ],
  FEY_COURTS: [
    { name: 'Rootmaw Lurker', desc: 'A hunched predatory creature made of gnarled ancient tree roots twisted into a bestial shape, mouth is a vertical split in the trunk lined with thorn-teeth, pale fungal growths on shoulders, hollow knotholes for eyes with green foxfire', cm: 2, kw: ['Lifesteal'] },
    { name: 'Thorn Sprite', desc: 'A tiny malicious pixie-like creature covered in needle-sharp thorns, insect wings of dried autumn leaves, fingers ending in bramble hooks, riding atop a massive beetle made of bark and moss', cm: 1, kw: ['Deathtouch'] },
    { name: 'Bog Troll Lurker', desc: 'A massive hunched troll made of compacted swamp mud and rotting vegetation, eyes like swamp gas lanterns glowing sickly green, long arms dragging through brackish water, moss hanging from its jaw like a beard', cm: 2, kw: ['Taunt'] },
    { name: 'Briar Court Sentinel', desc: 'A tall elegant humanoid figure made entirely of woven thorny rose vines, face a featureless mask of white bark with two glowing amber eyes, wearing a crown of wild roses dripping with dew, holding a spear of sharpened ancient wood', cm: 3, kw: ['Shield', 'Reach'] },
    { name: 'Moonwing Harbinger', desc: 'An ethereal moth-like fey with four translucent wings patterned like stained glass, slender insectoid body wrapped in living ivy and silver thread, antennae trailing luminous pollen, eerily humanoid face with compound eyes', cm: 4, kw: ['Flying'] },
    { name: 'Spore Druid', desc: 'A towering ancient treant covered in vivid shelf fungi in orange and toxic green and violet, thick gnarled bark form, weathered face with glowing amber eyes, root arms plunging into earth, ring of luminous mushrooms emitting golden spore clouds', cm: 5, kw: ['Lifesteal', 'Reach'] },
    { name: 'Changeling', desc: 'A sinister fey shapeshifter mid-transformation, body splitting between two forms: left half is pale green-skinned with twig-claws and mossy antlers, right half wears a stolen human face with a too-wide pointed-tooth smile, seam ripples like water', cm: 2, kw: ['Deathtouch'] },
    { name: 'Foxfire Will-o-Wisp', desc: 'A cluster of floating ghostly flames in pale green and blue, each flame has a tiny malicious face barely visible, they orbit around a central darkness that suggests a larger invisible form, trailing phosphorescent mist', cm: 1, kw: ['Flying'] },
    { name: 'Antler King', desc: 'A massive stag-like creature with a crown of impossibly branching antlers reaching skyward, each branch growing different season leaves simultaneously, body of ancient silver-barked wood, eyes of liquid gold, surrounded by orbiting sprites', cm: 7, kw: ['Taunt', 'Shield'] },
    { name: 'Mycelial Horror', desc: 'A shambling mass of interconnected fungal bodies, multiple half-formed faces pushing through the surface of the central mass, tentacles of braided mycelial threads, bioluminescent veins pulsing in waves, leaving a trail of luminous spores', cm: 4, kw: ['Lifesteal'] },
    { name: 'Cobweb Weaver', desc: 'A spider-fey with the upper body of an elegant pale elf and the lower body of a massive orb-weaver spider, weaving a web of silver moonlight between ancient trees, eight legs of polished black chitin, multiple small eyes reflecting starlight', cm: 3, kw: ['Reach'] },
    { name: 'Petrified Dancer', desc: 'A graceful humanoid figure caught mid-dance, half turned to living stone, one arm still flesh reaching skyward while the other is crumbling granite, face frozen in ecstatic expression, moss and tiny flowers growing in the stone cracks', cm: 3, kw: ['Shield'] },
    { name: 'Wild Hunt Hound', desc: 'A massive spectral wolf-hound with translucent blue-white fur revealing skeleton beneath, eyes of cold white fire, antlers growing from its skull, chains of frozen starlight trailing from a collar of twisted silver, baying at an invisible moon', cm: 5, kw: ['Piercing'] },
  ],
  DEMONIC: [
    { name: 'Slag Brute', desc: 'A hulking misshapen creature formed from cooled volcanic slag and fused bone, one shoulder much larger than the other, cracks in stone skin reveal molten interior, crude iron collar and broken chain, half-melted skull face with one horn', cm: 3, kw: ['Deathtouch'] },
    { name: 'Infernal Advocate', desc: 'A tall gaunt horned demon in charred crimson velvet robes and tarnished gold brocade, aristocratic cruel face with too many sharp teeth, curved ram horns, holding a burning scroll of soul contracts trailing hellfire and molten gold ink', cm: 4, kw: ['Lifesteal'] },
    { name: 'Pain Alchemist', desc: 'A grotesque demon alchemist with cracked grey leather skin over visible bones, eight spidery fingers per hand, hunched over a stone worktable of bubbling emerald and crimson flasks, skeletal face with toxic green burning eyes', cm: 3, kw: ['Deathtouch'] },
    { name: 'Plague Blossom Crawler', desc: 'A low centipede-like demon with a segmented body of fused rib cages, hundreds of bone-spur legs, its back blooming with beautiful but poisonous flowers growing from rotting flesh, each blossom dripping luminous toxic nectar', cm: 3, kw: ['Deathtouch', 'Piercing'] },
    { name: 'Mirror Stalker', desc: 'A gaunt faceless demon whose body is made of shattered mirror shards reflecting distorted hellscapes, limbs elongated and wrong-angled, moves like a broken puppet, wherever it steps reality cracks like glass', cm: 4, kw: ['Deathtouch'] },
    { name: 'Bone Architect', desc: 'A massive four-armed demon methodically assembling a cathedral from bones, each arm working independently, its body is a framework of fused spines and ribs, a single burning eye in a skull-face, surrounded by floating bone fragments', cm: 6, kw: ['Taunt', 'Reach'] },
    { name: 'Soul Broker', desc: 'A well-dressed demon in a suit of stitched human skin, sitting behind a desk of polished obsidian, soul-jars on shelves behind, weighing a glowing orb on scales, monocle of a trapped screaming face, calm professional demeanor', cm: 2, kw: ['Lifesteal'] },
    { name: 'Ash Wraith', desc: 'A swirling column of ash and cinder given vaguely humanoid form, burning ember eyes, skeletal hands reaching out from the tornado of debris, the ground beneath it scorched and cracking, leaving a trail of smoldering footprints', cm: 2, kw: ['Flying'] },
    { name: 'Flesh Golem', desc: 'A massive creature stitched together from parts of different demons, mismatched limbs, multiple faces sewn shut, chains and hooks holding the body together, one arm massive and clawed the other small and delicate, leaking ichor', cm: 5, kw: ['Taunt'] },
    { name: 'Pit Fiend Hatchling', desc: 'A small but vicious young demon, bat-wings too large for its body, stubby horns, sharp teeth in an oversized jaw, clinging to a volcanic rock with hooked claws, tail wrapped around a stolen bone like a toy, eyes of molten gold', cm: 1, kw: [] },
    { name: 'Blood Tide Serpent', desc: 'An enormous snake-demon swimming through a river of blood, scales of polished obsidian, multiple eyes running down its head like a crown, hood spread wide revealing a pattern of screaming faces, fangs dripping crimson venom', cm: 7, kw: ['Piercing', 'Deathtouch'] },
    { name: 'Corruption Seedling', desc: 'A small pulsating organic mass of dark flesh and crystal, tendrils spreading outward into the ground, tiny malevolent eyes scattered across its surface, glowing with sickly internal light, the ground around it dying and turning black', cm: 1, kw: ['Lifesteal'] },
    { name: 'War Effigy', desc: 'A towering construct of melted weapons and armor fused into a vaguely humanoid shape, swords and axes jutting from its body, a helm of crushed shields for a head, dragging a massive chain of linked broken blades, still smoldering from the forge', cm: 5, kw: ['Piercing', 'Taunt'] },
  ],
  CELESTIAL_CRUSADE: [
    { name: 'Prayer Lantern', desc: 'A tiny floating construct of hammered gold and crystal shaped like a censer, four delicate wings of stained glass, a single flame of divine white light burns within its latticed body casting prismatic patterns, chains of fine golden links dangle beneath', cm: 1, kw: [] },
    { name: 'Blessed Squire', desc: 'A young armored crusader in polished white plate with golden trim, kneeling with a short sword planted point-down, a faint halo of warm golden light crowns their helmeted head, sun tabard, small round shield with sacred geometry', cm: 2, kw: ['Shield'] },
    { name: 'Sanctified Automaton', desc: 'A humanoid construct of white marble and hammered gold carved with scripture and sacred geometry, crystal eyes, tower shield of gilded ivory, crystal mace humming with resonant energy, golden filigree veins pulsing with divine light', cm: 3, kw: ['Shield', 'Ward'] },
    { name: 'Crusade Standard-Bearer', desc: 'A tall armored warrior in burnished gold and white enamel plate, carrying a massive battle standard burning with holy fire, banner showing divine victories in golden thread, warhammer on back, three concentric golden halo rings', cm: 4, kw: ['Haste'] },
    { name: 'Seraph Guardian', desc: 'A towering angel warrior with four white-and-gold wings, ceremonial battle armor of gold plate over marble, longsword of crystallized light, golden energy barrier, solid white-light eyes, crown of golden thorns, golden blood from old wounds', cm: 5, kw: ['Flying', 'Shield'] },
    { name: 'Divine Siege Ram', desc: 'A massive holy war machine shaped like a charging bull, white marble and gold-plated iron, crystal battering head focusing divine light, six gilded stone legs, holy fire brazier on back, prayer bead chains on flanks', cm: 6, kw: ['Piercing', 'Haste'] },
    { name: 'Throne of Judgment', desc: 'An enormous multi-winged celestial entity, six wings of blinding white light with hundreds of burning judgment eyes, central robed judge holding scales and light-sword, orbiting angel-constructs, reality warping around it', cm: 7, kw: ['Flying', 'Ward', 'Taunt'] },
    { name: 'The Exalted Primarch', desc: 'A colossal armored warrior of unbearable radiance, twelve wings of crystallized light from white to gold to rose to blue, masterwork gold-and-marble armor with microscopic crusade history, greatsword of divine wrath, heaven-reflecting shield, golden serenity mask with twin sun eyes', cm: 9, kw: ['Flying', 'Shield', 'Piercing'] },
    { name: 'Holy Automaton Hound', desc: 'A quadruped construct of white marble with golden joint fittings, sleek divine hunting beast, crystal eyes burning with righteous purpose, sacred geometry etched into every plate, exhaust of golden dust from its joints', cm: 2, kw: ['Haste'] },
    { name: 'Reliquary Sentinel', desc: 'A stocky marble-and-gold guardian permanently fused to a massive reliquary chest on its back, divine artifacts visible through crystal viewing ports, heavily armored with layers of prayer-inscribed plate, shield-arms protecting the sacred cargo', cm: 4, kw: ['Shield', 'Ward'] },
    { name: 'Sunfire Archer', desc: 'A lithe angelic figure with two wings of radiant golden feathers, drawing a bow of solidified light, arrow tipped with concentrated solar energy, divine war paint in gold across face, lightweight ceremonial armor, eyes of focused white fire', cm: 3, kw: ['Reach'] },
    { name: 'Choir Construct', desc: 'A floating collection of golden pipes and crystal resonance chambers arranged in the vague shape of a many-armed angel, it produces visible sound waves of golden energy that shatter corruption, each pipe a different length and pitch, halo of harmonic rings', cm: 3, kw: ['Reach'] },
    { name: 'Judgment Herald', desc: 'A massive armored angel on a rearing warhorse of white marble, both rider and mount in full celestial plate, carrying a trumpet that splits into a sword, the sound of its horn visible as golden shockwaves, wings spread in declaration', cm: 6, kw: ['Piercing', 'Taunt'] },
  ],
  THE_ENDLESS: [
    { name: 'Grave Wisp', desc: 'A tiny floating orb of pale green-purple light with a flickering skull face within, trailing spectral mist, small bone fragments orbiting like electrons, phosphorescent residue fading in the air behind it', cm: 1, kw: [] },
    { name: 'Bone Crawler', desc: 'A low skeletal construct on six mismatched bone limbs, fused ribcage housing a pulsing necrotic green crystal core, multi-eyed skull clicking its jaw, bone-dust trails, small fungal growths at joints', cm: 2, kw: ['Piercing'] },
    { name: 'Spectral Knight', desc: 'A translucent ghostly warrior in corroded plate armor floating above ground, spectral energy body visible through gaps, frost-covered notched longsword, battered kite shield with worn heraldry, tattered surcoat, eerily smooth underwater movements', cm: 3, kw: ['Shield'] },
    { name: 'Phylactery Guardian', desc: 'A hunched four-armed skeletal figure in moth-eaten purple-and-gold robes, silver-banded cracked skull, clutching phylactery jars of swirling violet-green soul energy, bone chains linking vessels to guardian, necromantic runes on every bone', cm: 4, kw: ['Ward', 'Shield'] },
    { name: 'Death Knight Commander', desc: 'A massive undead warrior in rune-etched blackened plate, tattered midnight command cloak streaming in unfelt wind, dark iron greatsword with necrotic crystal edge, violet skull-helm eyes leaving trails, skeleton regiment in mist behind', cm: 5, kw: ['Taunt', 'Haste'] },
    { name: 'Wraith Harvester', desc: 'A tall spectral column of dark mist with enormous skeletal draining hands, shadow face with white-burning hollow eyes, massive bone-and-spectral scythe passing through matter but severing souls, ground dying to ash in spreading circle', cm: 6, kw: ['Lifesteal', 'Deathtouch'] },
    { name: 'Lich Sovereign', desc: 'An ancient skeletal mage on a floating skull-throne, tattered purple silk and corroded gold robes, dark crystal circlet with soul-gem screaming faces, phylactery staff, necrotic lightning between fingertips, spectral chains anchoring to mortal plane', cm: 7, kw: ['Ward', 'Lifesteal'] },
    { name: 'The Undying Colossus', desc: 'A titanic skeletal construct of thousands of fused bones taller than castle walls, cathedral ribcage with massive sickly green phylactery heart, four building-sized bone weapons, composite hundred-skull head with void-purple wagon-wheel eyes, undead army clinging and repairing, spectral energy streaming upward', cm: 9, kw: ['Taunt', 'Shield', 'Lifesteal'] },
    { name: 'Memory Shade', desc: 'A translucent humanoid figure of flickering ghostly light, features shifting between faces of the living it has consumed, leaving afterimages of its previous shapes behind it, dressed in the overlapping echoes of stolen clothing, melancholic and hollow', cm: 2, kw: ['Lifesteal'] },
    { name: 'Ossuary Golem', desc: 'A massive lumbering construct built from compacted grave earth and bones, roughly humanoid, gravestones embedded in its shoulders like pauldrons, empty coffins forming its arms, necromantic sigils etched in glowing green across its torso', cm: 5, kw: ['Taunt'] },
    { name: 'Banshee Caller', desc: 'A hovering spectral woman in tattered burial robes, mouth opened impossibly wide in a silent scream visible as distortion waves, long spectral hair streaming upward, skeletal hands outstretched, the air around her crackling with death energy', cm: 3, kw: ['Reach'] },
    { name: 'Corpse Candle Swarm', desc: 'A drifting mass of pale blue-green flames, each containing a screaming face frozen in death, they move as one colony organism, dimming all other light sources nearby, cold mist trailing beneath them, attracted to the living', cm: 1, kw: ['Flying'] },
    { name: 'Grave Titan', desc: 'A massive undead knight encased in ornate but corroded ceremonial plate, burial crown still on its skull, wielding a two-handed executioner sword of black iron, every step cracks the ground and lesser skeletons claw up from the earth in its wake', cm: 6, kw: ['Piercing', 'Taunt'] },
  ],
};

// === COMPOSITION POOL (25 templates, cycled systematically) ===
const COMPOSITIONS = [
  { key: 'PORTRAIT_CLOSE', prefix: 'extreme close-up filling the entire frame,', suffix: 'face and eyes dominate the composition, shallow depth of field, blurred background', neg: '' },
  { key: 'PORTRAIT_THREE_QUARTER', prefix: 'three-quarter view facing right,', suffix: 'head and upper body visible, background on right side, medium shot', neg: '' },
  { key: 'PORTRAIT_PROFILE', prefix: 'strict side profile facing left, single eye visible,', suffix: 'positioned in right half of frame, strong rim light on edges, negative space on left', neg: 'front-facing, looking at viewer, symmetrical' },
  { key: 'PORTRAIT_FROM_BEHIND', prefix: '(seen from behind:1.3) looking away from the viewer into the distance,', suffix: 'back of the creature visible, (vast environment stretching ahead:1.2), deep depth of field', neg: 'front-facing, looking at viewer, face visible, portrait, headshot' },
  { key: 'PORTRAIT_EXTREME_WIDE', prefix: '(tiny creature in lower third of a vast panoramic landscape:1.4),', suffix: '(extreme wide shot:1.3), creature occupies less than 15% of the frame, overwhelming sense of scale', neg: 'portrait, headshot, close-up, medium shot, creature fills frame' },
  { key: 'ACTION_ATTACK', prefix: '(creature lunging diagonally:1.3) from lower-left to upper-right, body stretched mid-strike,', suffix: '(motion blur on limbs:1.2), debris flying, low camera angle looking up, dynamic action pose', neg: 'standing still, static pose, portrait, headshot, symmetrical, calm' },
  { key: 'ACTION_DEFEND', prefix: '(creature in wide defensive stance:1.3) bracing for impact from the left,', suffix: 'shield or arms raised, ground-level camera, dust kicked up, tension before impact', neg: 'portrait, headshot, relaxed pose, symmetrical' },
  { key: 'ACTION_CAST', prefix: '(creature with arms raised overhead channeling swirling magical energy:1.3),', suffix: '(dramatic backlighting:1.2) creating rim light silhouette, energy spiraling upward', neg: 'portrait, headshot, static pose, arms at sides' },
  { key: 'ACTION_LEAP', prefix: '(creature frozen mid-leap through the air:1.4), nothing beneath it,', suffix: 'body arcing diagonally, wind and debris trailing, (dynamic frozen motion:1.2)', neg: 'standing on ground, static pose, portrait, headshot, feet on floor' },
  { key: 'ACTION_PROWL', prefix: '(creature crouched very low to the ground:1.3) stalking toward the viewer,', suffix: '(shot from ground level:1.2) looking slightly up, body compressed and coiled, predatory tension', neg: 'standing upright, portrait, headshot, relaxed pose' },
  { key: 'ACTION_COMMAND', prefix: '(creature on elevated high ground:1.3), arm raised pointing outward,', suffix: '(looking down from imperial vantage point:1.2), subjects below, commanding authority', neg: 'portrait, headshot, ground level, eye-level' },
  { key: 'ENVIRONMENTAL_WIDE', prefix: '(wide establishing shot of vast landscape:1.4) with creature small in center-right,', suffix: '(environment dominates the frame:1.3), epic scale, creature occupies 20-30% of frame height', neg: 'portrait, headshot, close-up, creature fills frame' },
  { key: 'ENVIRONMENTAL_EMERGING', prefix: '(creature partially hidden emerging from dense fog:1.3), left edge of frame,', suffix: '(only head and one limb fully visible:1.2), rest obscured by swirling mist, mysterious atmosphere', neg: 'fully visible, clear view, portrait, centered' },
  { key: 'ENVIRONMENTAL_UNDERGROUND', prefix: '(deep underground cavern:1.4) with creature in midground off-center right,', suffix: '(stalactites framing from top:1.2), bioluminescent lighting, strong sense of enclosed dark space', neg: 'outdoor, sky visible, bright lighting, portrait' },
  { key: 'ENVIRONMENTAL_SKYBORNE', prefix: '(creature high in the sky:1.4) in upper third of frame with wings fully spread,', suffix: '(clouds around it:1.2), landscape far below in bottom quarter, vertigo-inducing downward angle', neg: 'standing on ground, indoor, portrait, headshot' },
  { key: 'ENVIRONMENTAL_THRESHOLD', prefix: '(creature standing in a massive stone archway:1.3), bright light behind casting it as a silhouette,', suffix: '(positioned dead center:1.2), dark foreground space, doorway framing the figure', neg: 'outdoor, no framing, close-up face' },
  { key: 'DRAMATIC_LOW_ANGLE', prefix: '(extreme low angle looking straight up:1.4) at creature towering overhead,', suffix: '(creature fills upper 70% of frame:1.2), dramatic sky behind, foreshortened perspective making it seem massive', neg: 'eye-level, looking down, portrait, headshot' },
  { key: 'DRAMATIC_SILHOUETTE', prefix: '(creature as dark black silhouette:1.4) against a bright dramatic sky,', suffix: '(only rim lighting visible on edges:1.3), extremely high contrast, outline is the focus', neg: 'fully lit, detailed face, portrait, front lighting' },
  { key: 'DRAMATIC_OVERHEAD', prefix: '(extreme overhead birds-eye view looking straight down:1.4) at creature on the ground,', suffix: '(foreshortened from above:1.2), radial composition, environment spreading outward', neg: 'side view, portrait, headshot, eye-level, horizon visible' },
  { key: 'DRAMATIC_DUTCH_ANGLE', prefix: '(camera tilted 20 degrees:1.3) creating diagonal horizon, off-balance dynamic energy,', suffix: 'creature in lower-right facing upper-left, (environment at a slant:1.2), dramatic tension', neg: 'level horizon, static, calm, centered, symmetrical' },
  { key: 'NARRATIVE_MOMENT', prefix: '(creature in left half of frame interacting with environment:1.3),', suffix: '(storytelling composition:1.2) with clear action and subject, rich environmental context', neg: 'portrait, headshot, static, alone, no context' },
  { key: 'NARRATIVE_DUAL', prefix: '(two creatures facing each other from opposite sides of the frame:1.3),', suffix: '(confrontation composition:1.2), negative space between them, split lighting', neg: 'single figure, portrait, headshot' },
  { key: 'NARRATIVE_AFTERMATH', prefix: '(creature in right third of frame looking across a scene of wreckage:1.3) to the left,', suffix: '(contemplative mood:1.2), smoke and debris in foreground partially obscuring creature legs', neg: 'portrait, headshot, clean background, no context' },
  { key: 'NARRATIVE_RITUAL', prefix: '(creature kneeling in center surrounded by glowing magical energy:1.3) in a circle,', suffix: '(energy gathering upward:1.2), ceremonial setting, camera slightly above looking down', neg: 'standing, portrait, headshot, no magic' },
];

// === ENVIRONMENTS ===
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
    'inside an abandoned automaton graveyard, defunct mechanical bodies piled high in concrete silos, one sensor still flickering',
    'in a pressurized reactor hall, containment cylinders humming with barely-controlled energy, cold-rolled iron walkways, warning strobes',
    'on an elevated transit bridge spanning a canyon-scale factory complex, freight haulers rumbling past, industrial exhaust rising',
  ],
  FEY_COURTS: [
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
  DEMONIC: [
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
  CELESTIAL_CRUSADE: [
    'in a cathedral of pure light, stained glass windows depicting divine victories, golden dust motes',
    'on the steps of a marble celestial citadel, clouds below, twin suns blazing above',
    'atop a floating temple island connected by bridges of solidified light',
    'in a garden of crystal flowers and golden trees, where gravity lifts petals skyward',
    'inside a war sanctum of hammered gold, battle standards of divine crusades lining the walls',
    'on a battlefield where holy fire has scorched the earth white, angelic silhouettes in the sky',
    'at the gates of divine judgment, massive scales of gold and ivory, petitioners below',
    'in a reliquary vault of sacred weapons and armor, each glowing with inner radiance',
    'on a celestial bridge between realms, stars visible below and above, halo rings orbiting',
    'inside a prayer hall where thousands of candles float in formation, hymns echoing',
    'at the summit of a holy mountain, lightning-struck and wind-scoured, divine mandate in the air',
    'in a scriptorium of prophecy, scrolls floating and writing themselves in golden ink',
    'on the prow of a golden warship sailing through clouds, angelic warriors at stations',
  ],
  THE_ENDLESS: [
    'in a necropolis of crumbling mausoleums, spectral light seeping from cracks in sealed tombs',
    'on a bridge of bones spanning an abyss of whispering souls, ghostly luminescence below',
    'inside a lich-king throne room, phylacteries in alcoves, tattered banners of forgotten kingdoms',
    'in a graveyard where tombstones grow like trees, roots of bone piercing the surface',
    'at the shore of a dead sea, still black water reflecting no light, ghost ships anchored',
    'inside a collapsed library of the dead, spectral librarians shelving books of memory',
    'on a frozen battlefield where the fallen still stand, ice-locked in their final poses',
    'in a crypt beneath the world where time does not pass, cobwebs of pure darkness',
    'at the boundary between life and death, one side green and warm, the other grey and still',
    'inside a spiraling tower of skulls, each eye socket glowing with a fading memory',
    'in a fungal forest of pale mushrooms and phosphorescent mold, growing from ancient remains',
    'on the deck of a ghost galleon, tattered sails moving without wind, crew of shadows',
    'in a cathedral of silence where sound itself has died, only the whisper of entropy remains',
  ],
};

// === SUB-FLAVORS ===
const FACTION_SUB_FLAVORS = {
  IRONWRIGHT: [
    'Foundry Directorate orbital command, cold-rolled iron and poured concrete, reactor orange and gunmetal gray palette',
    'Scrap Legions planetary assault, rebar infantry, slag-field debris, ash gray and dull orange embers palette',
    'void-dock warship assembly, riveted hull plates, vacuum-sealed bulkheads, gunmetal blue and reactor orange palette',
    'strip-mine excavation, massive bucket-wheel machines, exposed geological strata, iron oxide and concrete white palette',
    'reactor containment facility, warning strobes, pressurized coolant, alarm red and exhaust white and charcoal palette',
    'orbital shipyard construction bay, welding arcs in vacuum, cold steel blue and spark yellow palette',
    'brutalist command citadel, poured concrete walls, conduit pipe bundles, concrete gray and cold iron and reactor amber palette',
    'automated foundry line, robotic manipulator arms, conveyor belt systems, burnished iron and industrial orange palette',
  ],
  FEY_COURTS: [
    'Verdant Throne spring court, exploding flowers, overwhelming greenery, emerald and gold and warm amber palette',
    'Hollow Court winter silence, bare branches like bones, ice blue and bone white and bare wood gray palette',
    'twilight forest glade, bioluminescent fungi, deep teal and sickly yellow-green and bruise purple palette',
    'ancient root network, mycelial threads, muted forest greens and warm amber palette',
    'moonlit enchanted lake, silver reflections, opal and mother-of-pearl and shifting rainbow palette',
    'fey boundary crossing, vibrant to muted color shift, emerald and gold bleeding to gray palette',
    'frozen waterfall midnight, auroral prismatic light, ice blue and bone white palette',
    'wild hunt predation, antlered riders, silver and cobalt blue and hunter green and blood red palette',
  ],
  DEMONIC: [
    'Furnace Lords volcanic wrath, magma rivers, magma orange and obsidian black and sulfur yellow palette',
    'Obsidian Bureaucracy infernal law, sickly yellow-green and institutional gray and red stamp ink palette',
    'hellfire throne room, fallen titan bones, deep crimson and charcoal and ember orange palette',
    'flesh cathedral interior, living skin walls, flesh tones and bone white and organ red palette',
    'volcanic glass maze, distorted hellfire reflections, obsidian black and molten orange palette',
    'skull coliseum, tiered bone seats, bone white and charcoal and ancient iron palette',
    'blood-rain battlefield, crimson precipitation, blood red and basalt black and bruise purple palette',
    'demonic war forge, cursed iron and ichor, deep gold and bruise spectrum palette',
  ],
  CELESTIAL_CRUSADE: [
    'Knights of Deliverance crusade, hammered gold plate, divine swords, burnished gold and white marble palette',
    'Heaven\'s Chosen angelic hierarchy, sacred geometry halos, pale gold and powder blue and pearl white palette',
    'divine war sanctum, battle standards, gold leaf and deep crimson and burning white palette',
    'celestial citadel steps, clouds below, white marble and sky blue and warm gold palette',
    'crystal garden, golden trees, gravitational anomaly, rose quartz and amber gold and crystal clear palette',
    'prayer hall candlelight, floating formations, warm gold and deep indigo and candle amber palette',
    'holy battlefield, scorched white earth, dawn pink and divine gold and smoke gray palette',
    'reliquary vault, sacred weapons, inner radiance, burnished bronze and ivory and radiant white palette',
  ],
  THE_ENDLESS: [
    'Necromantic Cabals ritual, phylactery vaults, necrotic green and deep purple and tarnished gold palette',
    'Lost Spectres warband, ghostly charge, ghost blue and phosphor white and shadow purple palette',
    'necropolis crumbling, spectral tomb light, bone white and ash gray and faded lavender palette',
    'lich throne room, tattered banners, corroded gold and deep purple and void black palette',
    'dead sea shore, ghost ships, black water and phantom light and cold silver palette',
    'frozen battlefield, ice-locked fallen, frost white and steel blue and death gray palette',
    'skull tower spiraling, fading memory light, ivory and moonlight silver and shadow purple palette',
    'cathedral of silence, entropy whisper, absolute black and faint violet and dried moss palette',
  ],
};

// === WEATHER, TIME, SCALE MODIFIERS ===
const WEATHER = [
  'during a violent thunderstorm, rain slashing across the scene',
  'in thick rolling fog, visibility limited',
  'during a blizzard of ash or snow, particles filling the air',
  'in scorching heat shimmer, air distorted',
  'during an eclipse, eerie half-light',
  'in gentle rainfall, wet reflective surfaces',
  'during a sandstorm of dust or magical particles',
  'in perfectly still dead air, oppressive calm',
];

const TIME_OF_DAY = [
  'at golden hour, warm amber light, long shadows',
  'at blue hour pre-dawn, cool steel-blue atmosphere',
  'at high noon, harsh overhead light, deep black shadows',
  'at twilight, purple-orange sky gradient',
  'in deep night, lit only by moonlight, deep blacks',
  'at an unnatural hour, the sky the wrong color',
];

const SCALE = {
  1: 'the creature is very small, shown relative to normal-sized objects for scale contrast',
  2: 'the creature is smaller than human-sized, compact and agile',
  5: 'the creature is much larger than human-sized, imposing mass and bulk',
  6: 'the creature is much larger than human-sized, imposing mass and bulk',
  7: 'the creature is enormous, dwarfing the environment, shown from a distance to capture its scale',
};

const FACTION_GEAR = {
  IRONWRIGHT: [
    'wielding a massive rebar-reinforced demolition hammer',
    'carrying a hydraulic piston-driver, reactor exhaust venting from joints',
    'armored in overlapping hull blast plates with pressure gauge shoulder arrays',
    'equipped with a rotating industrial sawblade arm, sparks flying',
    'wearing a riveted iron helm with a cracked sensor visor',
  ],
  FEY_COURTS: [
    'clutching a staff of living wood, budding with impossible flowers',
    'draped in armor of woven bark and silver spider silk',
    'wearing a crown of antlers and thorns, each thorn dripping amber sap',
    'carrying a lantern of trapped fireflies that whisper',
    'cloaked in moth-wing fabric that shifts between visible and invisible',
  ],
  DEMONIC: [
    'gripping a jagged obsidian greatsword, veins of hellfire running through it',
    'clad in armor made from fused rib cages and vertebrae',
    'wielding a flail of screaming skulls bound by chains of sinew',
    'wearing a crown of broken horns taken from defeated rivals',
    'dragging a barbed whip that leaves trails of smoldering ichor',
  ],
  CELESTIAL_CRUSADE: [
    'wielding a greatsword of crystallized divine light, hilt of hammered gold',
    'carrying a massive tower shield of gilded ivory etched with sacred geometry',
    'armored in layered gold plate over white marble, prayer scrolls trailing from pauldrons',
    'bearing a war standard of golden thread depicting divine victories',
    'wearing a halo crown of concentric golden rings that rotate slowly',
  ],
  THE_ENDLESS: [
    'gripping a scythe of bone and spectral iron, blade phasing through matter',
    'clad in corroded ceremonial armor with necromantic runes glowing faintly',
    'wielding a staff topped with a phylactery orb swirling with trapped souls',
    'dragging spectral chains that anchor it to the mortal plane',
    'wearing a burial crown of dark crystal set with screaming soul-gems',
  ],
};

// === PLANAR RUIN POOLS (ancient structures per faction) ===
const RUIN_STYLE_ANCHOR = 'oil painting, dark atmospheric fantasy, muted earth tones, chiaroscuro lighting, heavy impasto palette knife texture, architectural illustration, high detail stonework, no text no borders no watermarks';

const PLANAR_RUIN_POOLS = {
  IRONWRIGHT: [
    { name: 'Collapsed Reactor Shrine', desc: 'A massive ruined reactor containment structure half-buried in industrial slag, cracked concrete walls revealing twisted rebar skeleton, residual reactor glow seeping from fissures, warning symbols barely visible under corrosion' },
    { name: 'Abandoned Void-Dock', desc: 'A derelict orbital shipyard platform crashed into a planetary surface, massive gantry cranes twisted and broken, hull plating scattered, mag-lock clamps still gripping nothing, reactor coolant frozen mid-leak' },
    { name: 'Foundry Ruins', desc: 'The gutted remains of a massive star-forge facility, enormous blast furnaces cracked open, conveyor systems frozen mid-operation, molten metal long solidified in rivers across the floor, concrete ceiling collapsed inward' },
    { name: 'Strip-Mine Altar', desc: 'A terraced excavation so deep it reaches bedrock, at the bottom a monolithic iron altar built from compressed industrial waste, offerings of reactor cores and hull fragments arranged in geometric patterns' },
  ],
  FEY_COURTS: [
    { name: 'Overgrown Stone Circle', desc: 'An ancient circle of standing stones completely consumed by living forest, massive roots lifting and cracking the megaliths, bioluminescent mushrooms colonizing every surface, the stones still humming with faint fey energy' },
    { name: 'Drowned Temple', desc: 'A once-grand fey temple now submerged in enchanted floodwater, only the upper spires and treeline canopy visible above the mirror-still surface, lotus flowers and silver fish inhabiting the flooded halls, moonlight filtering through' },
    { name: 'Petrified Court', desc: 'The remains of a fey court frozen in living stone, figures of dancers and revelers caught mid-motion turned to granite, moss and tiny flowers growing in the cracks, the dance floor surrounded by petrified feast tables' },
    { name: 'World-Root Hollow', desc: 'A cavern formed by the exposed roots of an impossibly ancient tree, the root system forming natural arches and chambers, bioluminescent sap flowing through translucent root walls, fungal constellations on the ceiling' },
  ],
  DEMONIC: [
    { name: 'Shattered Throne', desc: 'The ruined remains of a demon lord throne room, the throne itself cracked in half, obsidian pillars toppled into rivers of cooled lava, hellfire braziers still flickering weakly, the vaulted bone ceiling partially collapsed' },
    { name: 'Infernal Gate Ruin', desc: 'A massive demonic portal frame of fused bone and obsidian, cracked and partially collapsed, residual hellfire energy arcing between the broken halves, the ground around it scorched and vitrified, demonic script still glowing in the remaining stones' },
    { name: 'Corruption Crater', desc: 'A vast impact crater where something fell from the sky, the ground transformed into a bowl of crystallized dark energy, tendrils of corruption spreading outward from the center, the rim lined with fused bone and volcanic glass' },
    { name: 'Bone Cathedral Ruins', desc: 'The collapsed skeleton of a cathedral built entirely from fused bones, ribcage vault ceiling partially caved in, skull-paved floor cracked, altar of compressed vertebrae still standing, candles of rendered fat still burning impossibly' },
  ],
  CELESTIAL_CRUSADE: [
    { name: 'Fallen Citadel Spire', desc: 'A toppled marble spire of a celestial fortress, golden filigree still gleaming through dirt and vine, stained glass shattered across the ground in prismatic fragments, divine light still emanating weakly from the broken core' },
    { name: 'Judgment Hall Ruins', desc: 'The roofless remains of a divine court, massive golden scales of judgment still balanced on a cracked marble pedestal, ivory columns toppled in rows, prayer inscriptions on every surviving surface, holy fire guttering in broken braziers' },
    { name: 'Shattered Bridge of Light', desc: 'A celestial bridge that once connected floating temple islands, now broken into segments hanging in the air by residual divine energy, golden handrails twisted, marble flagstones floating separately, stars visible through the gaps' },
    { name: 'Reliquary Breach', desc: 'A sacred vault torn open from within, golden walls peeled back like petals, divine artifacts scattered across consecrated ground, protective wards still flickering in broken patterns, crystal containment vessels cracked and leaking radiance' },
  ],
  THE_ENDLESS: [
    { name: 'Necropolis Gate', desc: 'A monumental archway of carved bone and ancient stone marking the entrance to a vast city of the dead, the gates themselves hanging open and broken, spectral light seeping from within, necromantic wards still faintly active on the lintel' },
    { name: 'Collapsed Phylactery Vault', desc: 'A subterranean vault of reinforced stone and bone, shelves of phylactery containers toppled and shattered, soul energy leaked and pooling in glowing puddles on the floor, preservation wards failing one by one' },
    { name: 'Ghost Ship Wreck', desc: 'The beached hulk of an enormous ghost galleon, tattered spectral sails still billowing without wind, the hull phasing between solid wood and translucent ectoplasm, skeletal crew still at their stations, frozen in death' },
    { name: 'Memory Obelisk', desc: 'A towering obelisk of dark crystal covered in shifting images of the dead, cracked at the base and leaning, the memories it contains leaking out as whispered fragments, the ground around it grey and lifeless, small spectral lights orbiting' },
  ],
};

// Faction-neutral ruin for when no faction is specified (not used currently but available)
const NEUTRAL_RUIN_POOL = [
  { name: 'Ancient Planar Nexus', desc: 'A crumbling stone platform at the intersection of multiple planar rifts, pillars of different materials (bone, marble, iron, living wood, dark crystal) arranged in a circle, each showing damage from its native plane, reality unstable at the center' },
  { name: 'Forgotten Battlefield Monument', desc: 'A massive war memorial of neutral grey stone carved with scenes from a battle between all factions, weathered and cracked, faction-specific offerings decaying at its base, the monument itself radiating residual magical energy' },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// === fal.ai QUEUE MODE with retry ===
function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-pool-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  writeFileSync(tmpFile, JSON.stringify(body));
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = execFileSync('curl', [
          '-s', '--max-time', String(timeoutSec),
          '-X', 'POST', url,
          '-H', `Authorization: Key ${FAL_KEY}`,
          '-H', 'Content-Type: application/json',
          '-d', `@${tmpFile}`,
        ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        return JSON.parse(result);
      } catch (err) {
        if (attempt < 2) {
          console.log(`    curl POST retry ${attempt + 1}...`);
          execFileSync('sleep', [String(3 * (attempt + 1))]);
        } else throw err;
      }
    }
  } finally {
    try { execFileSync('rm', [tmpFile]); } catch {}
  }
}

function curlGet(url, timeoutSec = 30) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = execFileSync('curl', [
        '-s', '--max-time', String(timeoutSec),
        '-H', `Authorization: Key ${FAL_KEY}`,
        url,
      ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      return JSON.parse(result);
    } catch (err) {
      if (attempt < 2) {
        execFileSync('sleep', [String(2 * (attempt + 1))]);
      } else throw err;
    }
  }
}

async function callFalSDXL(body) {
  const endpoint = 'fal-ai/fast-sdxl';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 60);
  if (submitResult.detail) throw new Error(`fal.ai submit error: ${JSON.stringify(submitResult.detail)}`);
  const requestId = submitResult.request_id;
  if (!requestId) throw new Error(`No request_id: ${JSON.stringify(submitResult)}`);

  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  const t0 = Date.now();
  let inQueue = true;
  while (true) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    let status;
    try {
      status = curlGet(pollUrl, 20);
    } catch {
      // Poll failed, wait and retry
      execFileSync('sleep', ['3']);
      continue;
    }
    if (status.status === 'COMPLETED') break;
    if (status.status === 'FAILED') throw new Error(`Generation failed: ${JSON.stringify(status)}`);
    if (inQueue && status.status === 'IN_PROGRESS') {
      console.log(`    Queue: ${elapsed}s, generating...`);
      inQueue = false;
    } else if (inQueue) {
      process.stdout.write(`    Queued ${elapsed}s (pos: ${status.queue_position ?? '?'})...\r`);
    }
    execFileSync('sleep', ['2']);
  }
  const totalWait = ((Date.now() - t0) / 1000).toFixed(1);

  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 60);
  if (result.detail) throw new Error(`fal.ai fetch error: ${JSON.stringify(result.detail)}`);
  console.log(`    fal.ai: ${totalWait}s`);
  return result;
}

// === MAIN ===
async function main() {
  const factionSlug = FACTION.toLowerCase().replace(/_/g, '-');
  const typeSlug = CARD_TYPE === 'PLANAR_RUIN' ? 'ruins' : 'creatures';
  const factionDir = join(POOL_DIR, factionSlug, typeSlug);
  if (!existsSync(factionDir)) mkdirSync(factionDir, { recursive: true });

  // Branch on card type
  if (CARD_TYPE === 'PLANAR_RUIN') {
    return await generatePlanarRuins(factionDir, factionSlug);
  }

  const creatures = CREATURE_POOLS[FACTION];
  if (!creatures) { console.error(`No creatures for ${FACTION}`); process.exit(1); }

  // Select COUNT creatures, cycling if needed
  const selected = [];
  for (let i = 0; i < COUNT; i++) {
    selected.push(creatures[i % creatures.length]);
  }

  // Assign compositions systematically — no duplicates
  const shuffledComps = [...COMPOSITIONS].sort(() => Math.random() - 0.5);
  const envs = FACTION_ENVIRONMENTS[FACTION];
  const subFlavors = FACTION_SUB_FLAVORS[FACTION];
  const gearPool = FACTION_GEAR[FACTION];

  console.log(`\n=== Base Pool: ${FACTION} — Creatures (${COUNT} cards) ===\n`);
  console.log(`Recipe: fal-ai/fast-sdxl + EldritchPaletteKnife @ ${LORA_SCALE}`);
  console.log(`Cost: ~$${(COUNT * 0.025).toFixed(2)}\n`);

  const results = [];

  for (let i = 0; i < selected.length; i++) {
    const creature = selected[i];
    const comp = shuffledComps[i % shuffledComps.length];
    const environment = envs[i % envs.length]; // Cycle through environments
    const subFlavor = pick(subFlavors);

    // Probabilistic modifiers
    const weather = Math.random() < 0.30 ? pick(WEATHER) : '';
    const timeOfDay = Math.random() < 0.40 ? pick(TIME_OF_DAY) : '';
    const scale = SCALE[creature.cm] || (creature.cm >= 7 ? SCALE[7] : '');
    const gear = Math.random() < 0.50 ? pick(gearPool) : '';

    // Build prompt: comp prefix → creature desc → style → comp suffix → environment → extras
    const parts = [comp.prefix, creature.desc, STYLE_ANCHOR];
    if (comp.suffix) parts.push(comp.suffix);
    if (gear) parts.push(gear);
    parts.push(environment);
    parts.push(subFlavor);
    if (weather) parts.push(weather);
    if (timeOfDay) parts.push(timeOfDay);
    if (scale) parts.push(scale);
    const prompt = parts.join(', ');

    const negPrompt = comp.neg ? NEGATIVE_PROMPT + ', ' + comp.neg : NEGATIVE_PROMPT;

    const fileName = `BASE-${factionSlug}-pool-${String(i + 1).padStart(2, '0')}.png`;
    console.log(`[${i + 1}/${selected.length}] ${creature.name} (CM${creature.cm}) — ${comp.key}`);

    // Skip if already generated (idempotent re-run)
    if (existsSync(join(factionDir, fileName))) {
      console.log(`    Already exists, skipping`);
      results.push({
        index: i + 1, fileName, name: creature.name, faction: FACTION,
        cm: creature.cm, keywords: creature.kw, composition: comp.key,
        environment: environment.substring(0, 80), seed: 0, sizeKB: 0, skipped: true,
      });
      continue;
    }

    try {
      const result = await callFalSDXL({
        prompt,
        negative_prompt: negPrompt,
        image_size: 'portrait_4_3',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        format: 'png',
        loras: [{ path: LORA_URL, scale: LORA_SCALE }],
      });

      if (result.has_nsfw_concepts?.[0]) {
        console.log('    NSFW detected, skipping');
        results.push({ index: i + 1, name: creature.name, error: 'NSFW' });
        continue;
      }
      if (!result.images?.[0]?.url) {
        console.log('    No image URL');
        results.push({ index: i + 1, name: creature.name, error: 'No image' });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(factionDir, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);

      results.push({
        index: i + 1,
        fileName,
        name: creature.name,
        faction: FACTION,
        cm: creature.cm,
        keywords: creature.kw,
        composition: comp.key,
        environment: environment.substring(0, 80),
        seed: result.seed,
        sizeKB: Math.round(buf.length / 1024),
      });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index: i + 1, name: creature.name, error: err.message });
    }
  }

  // Save manifest
  const manifestPath = join(POOL_DIR, `pool-manifest-${factionSlug}.json`);
  writeFileSync(manifestPath, JSON.stringify(results, null, 2));

  const ok = results.filter(r => !r.error).length;
  console.log(`\n=== Complete: ${ok}/${selected.length} cards ===`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Images: ${factionDir}/`);
  console.log(`Est. cost: ~$${(ok * 0.025).toFixed(2)}`);
}

// === PLANAR RUIN GENERATION ===
async function generatePlanarRuins(factionDir, factionSlug) {
  const ruins = PLANAR_RUIN_POOLS[FACTION];
  if (!ruins) { console.error(`No ruins for ${FACTION}`); process.exit(1); }

  // Select COUNT ruins, cycling if needed
  const selected = [];
  for (let i = 0; i < COUNT; i++) {
    selected.push(ruins[i % ruins.length]);
  }

  const envs = FACTION_ENVIRONMENTS[FACTION];
  const subFlavors = FACTION_SUB_FLAVORS[FACTION];

  // Ruin-specific compositions (architectural/environmental focus)
  const RUIN_COMPOSITIONS = [
    { key: 'WIDE_ESTABLISHING', prefix: '(wide establishing shot of a vast ruined structure:1.4),', suffix: '(environment dominates the frame:1.3), epic architectural scale, deep perspective, rubble and debris in foreground', neg: 'portrait, headshot, close-up, creature fills frame, people, characters' },
    { key: 'LOW_ANGLE_MONUMENTAL', prefix: '(extreme low angle looking straight up:1.4) at the towering ruined structure,', suffix: '(structure fills upper 70% of frame:1.2), dramatic sky behind, foreshortened perspective emphasizing massive scale', neg: 'eye-level, looking down, portrait, headshot, people' },
    { key: 'INTERIOR_DETAIL', prefix: '(interior of a ruined chamber:1.3), rubble-strewn floor, cracked walls,', suffix: '(light filtering through gaps in the ceiling:1.2), dust motes in shafts of light, atmospheric decay', neg: 'exterior, sky, portrait, people, characters' },
    { key: 'OVERHEAD_LAYOUT', prefix: '(overhead birds-eye view looking down:1.4) at the ruined structure layout,', suffix: '(architectural floor plan visible through collapse:1.2), radial composition, rubble patterns', neg: 'side view, portrait, people, horizon visible' },
    { key: 'THRESHOLD_FRAMING', prefix: '(view through a crumbling archway or doorway:1.3) into the ruin beyond,', suffix: '(archway framing the interior:1.2), light from one side dark from other, dramatic sense of entry', neg: 'outdoor open, no framing, people, characters' },
    { key: 'SILHOUETTE_SKYLINE', prefix: '(ruined structure as dark silhouette:1.4) against a dramatic sky,', suffix: '(rim lighting on broken edges:1.3), extremely high contrast, jagged outline is the focus', neg: 'fully lit, detailed interior, people, front lighting' },
  ];

  const shuffledComps = [...RUIN_COMPOSITIONS].sort(() => Math.random() - 0.5);

  console.log(`\n=== Base Pool: ${FACTION} — Planar Ruins (${COUNT} cards) ===\n`);
  console.log(`Recipe: fal-ai/fast-sdxl + EldritchPaletteKnife @ ${LORA_SCALE}`);
  console.log(`Cost: ~$${(COUNT * 0.025).toFixed(2)}\n`);

  const results = [];

  for (let i = 0; i < selected.length; i++) {
    const ruin = selected[i];
    const comp = shuffledComps[i % shuffledComps.length];
    const environment = envs[i % envs.length];
    const subFlavor = pick(subFlavors);

    // Probabilistic modifiers (weather + time only, no scale/gear for ruins)
    const weather = Math.random() < 0.30 ? pick(WEATHER) : '';
    const timeOfDay = Math.random() < 0.40 ? pick(TIME_OF_DAY) : '';

    // Build ruin prompt: comp prefix → ruin desc → style → comp suffix → environment → extras
    const parts = [comp.prefix, ruin.desc, RUIN_STYLE_ANCHOR];
    if (comp.suffix) parts.push(comp.suffix);
    parts.push(environment);
    parts.push(subFlavor);
    if (weather) parts.push(weather);
    if (timeOfDay) parts.push(timeOfDay);
    const prompt = parts.join(', ');

    const negPrompt = NEGATIVE_PROMPT + ', characters, creatures, people, faces, living beings' + (comp.neg ? ', ' + comp.neg : '');

    const fileName = `RUIN-${factionSlug}-pool-${String(i + 1).padStart(2, '0')}.png`;
    console.log(`[${i + 1}/${selected.length}] ${ruin.name} — ${comp.key}`);

    // Skip if already generated (idempotent re-run)
    if (existsSync(join(factionDir, fileName))) {
      console.log(`    Already exists, skipping`);
      results.push({
        index: i + 1, fileName, name: ruin.name, faction: FACTION,
        type: 'PLANAR_RUIN', composition: comp.key,
        environment: environment.substring(0, 80), seed: 0, sizeKB: 0, skipped: true,
      });
      continue;
    }

    try {
      const result = await callFalSDXL({
        prompt,
        negative_prompt: negPrompt,
        image_size: 'portrait_4_3',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        format: 'png',
        loras: [{ path: LORA_URL, scale: LORA_SCALE }],
      });

      if (result.has_nsfw_concepts?.[0]) {
        console.log('    NSFW detected, skipping');
        results.push({ index: i + 1, name: ruin.name, error: 'NSFW' });
        continue;
      }
      if (!result.images?.[0]?.url) {
        console.log('    No image URL');
        results.push({ index: i + 1, name: ruin.name, error: 'No image' });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(factionDir, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);

      results.push({
        index: i + 1,
        fileName,
        name: ruin.name,
        faction: FACTION,
        type: 'PLANAR_RUIN',
        composition: comp.key,
        environment: environment.substring(0, 80),
        seed: result.seed,
        sizeKB: Math.round(buf.length / 1024),
      });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index: i + 1, name: ruin.name, error: err.message });
    }
  }

  // Save manifest
  const manifestPath = join(POOL_DIR, `pool-manifest-${factionSlug}-ruins.json`);
  writeFileSync(manifestPath, JSON.stringify(results, null, 2));

  const ok = results.filter(r => !r.error).length;
  console.log(`\n=== Complete: ${ok}/${selected.length} ruins ===`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Images: ${factionDir}/`);
  console.log(`Est. cost: ~$${(ok * 0.025).toFixed(2)}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

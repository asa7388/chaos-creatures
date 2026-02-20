#!/usr/bin/env node
// generate-v13-test.mjs — Artifact-fix regen of best v12 concepts
// Every prompt redesigned to avoid specific SDXL failure modes:
// - No small humanoids (pixies, tiny riders) — face/hand mush
// - No compound motion (rider+horse+jumping) — anatomy collapse
// - Single creature dominating frame with clear anatomy
// - Iconic silhouettes only — no generic humanoids
// - Action verbs but creature must be fully visible

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v13');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

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

const LORA_URL = 'https://huggingface.co/EldritchAdam/SDXL_Eldritch_LoRAs/resolve/main/EldritchPaletteKnife.safetensors';
const LORA_SCALE = 0.65;
const STYLE = 'oil painting, dark fantasy, palette knife impasto, defined brushwork, chiaroscuro';
const NEG = 'digital art, 3d render, photorealistic, smooth gradients, airbrushed, ' +
  'anime, cartoon, watermark, text, borders, frames, ' +
  'symmetrical centered portrait, T-pose, white background, ' +
  'dripping paint, melting, paint streaks, vertical streaks, runny paint, ' +
  'standing still, posing, facing camera, ' +
  'nudity, nsfw';

const CARDS = [
  // === REGEN: Kelpie — v12 had mangled legs at waterline ===
  // Fix: horse fully visible on shore, seaweed mane, no water obscuring anatomy
  {
    name: 'Kelpie Luring',
    scene: 'A Scottish kelpie as a magnificent black horse standing at the edge of a dark loch at night, its mane made of dripping seaweed and pondweed, glowing green eyes, water streaming from its body onto the rocky shore, moonlight, the horse turning its head to look back over its shoulder invitingly',
    faction: 'FEY_COURTS',
    comp: 'NAR',
  },

  // === REGEN: Seraph — v12 was a featureless dark blob ===
  // Fix: describe the face as visible and radiant, fewer dark elements
  {
    name: 'Seraph Descending',
    scene: 'A six-winged seraph descending from golden clouds, arms outstretched holding a flaming sword pointed downward, face visible and radiant with stern expression, three pairs of white feathered wings spread wide, robes of white and gold billowing, divine light radiating outward, seen from below',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },

  // === REGEN: Pegasus — v12 had burning fused wings ===
  // Fix: clearly white feathered wings, no fire, wounded but graceful
  {
    name: 'Pegasus in Flight',
    scene: 'A white winged horse soaring through dramatic storm clouds, enormous white feathered wings fully spread catching the light, mane and tail streaming in wind, one wing trailing blood from an arrow wound, looking back at pursuing dark shapes below, golden light breaking through clouds above',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },

  // === REGEN: Nephilim — v12 was generic gorilla humanoid ===
  // Fix: half-angel half-giant, describe divine features explicitly
  {
    name: 'Fallen Angel',
    scene: 'A massive fallen angel kneeling in a smoldering crater, one broken wing dragging on the ground and one still intact pointing skyward, ancient armor cracked and scorched, face beautiful but anguished looking up at the sky it fell from, chains of light still trailing from wrists, epic scale with tiny trees around the crater rim',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ENV',
  },

  // === REGEN: Wraith — v12 was too much "hooded man" ===
  // Fix: make it clearly spectral, translucent, supernatural
  {
    name: 'Wraith Emerging',
    scene: 'A translucent ghostly wraith pulling itself out of a cracked tombstone, upper body emerged and lower body still phasing through the stone, skeletal face with hollow glowing eye sockets screaming, tattered spectral robes dissolving into mist, graveyard at midnight, other gravestones leaning away from it',
    faction: 'THE_ENDLESS',
    comp: 'ACT',
  },

  // === REGEN: Minotaur — v12 had wrong proportions, too static ===
  // Fix: emphasize massive bull head, low charging posture, motion blur
  {
    name: 'Minotaur Charge',
    scene: 'A massive minotaur mid-charge down a narrow stone labyrinth corridor, enormous bull head lowered with horns forward, muscular body leaning into the sprint, one hoof smashing flagstones sending debris flying, steam snorting from nostrils, torchlight on the walls blurring with speed, viewed from ground level ahead of it',
    faction: 'DEMONIC',
    comp: 'ACT',
  },

  // === REGEN: Hydra — v12 had mirrored symmetry artifact ===
  // Fix: describe asymmetric heads at different heights doing different things
  {
    name: 'Hydra Regenerating',
    scene: 'A colossal hydra with five serpentine necks of different lengths, the tallest head biting down on prey, a short bleeding stump where a sixth head was severed with two new small heads budding from the wound, body coiled in a swamp, each head a slightly different color, dark murky water and dead trees',
    faction: 'DEMONIC',
    comp: 'HERO',
  },

  // === REGEN: Kraken — v12 had no tentacles visible ===
  // Fix: tentacles must dominate the composition, ship is secondary
  {
    name: 'Kraken Surfacing',
    scene: 'Enormous kraken tentacles erupting from ocean surface, eight massive suckered arms reaching skyward and wrapping around the mast of a small sailing ship, the krakens huge eye visible just below the waterline, sailors falling from the tilting deck, stormy seas, the tentacles are the main subject filling most of the frame',
    faction: 'DEMONIC',
    comp: 'ENV',
  },

  // === REGEN: Golem — v12 looked like a dirty human ===
  // Fix: emphasize clay/stone material, cracks, glowing runes
  {
    name: 'Iron Golem Waking',
    scene: 'A massive humanoid figure made of rough riveted iron plates cracking open its own chest cavity as it awakens, orange molten light pouring from the cracks between its plates, one arm raised and fingers flexing for the first time, bolts and rivets visible across its body, standing in a dark industrial foundry, sparks falling',
    faction: 'IRONWRIGHT',
    comp: 'HERO',
  },

  // === REGEN: Siege construct — v12 was just a burning tower ===
  // Fix: describe mechanical legs explicitly, creature not building
  {
    name: 'Walking Fortress',
    scene: 'A colossal fortress on six enormous mechanical legs striding across a battlefield, each leg a massive iron piston crushing the ground beneath it, a furnace glowing in its belly, gun ports along its sides, smoke stacks on top belching black smoke, tiny soldiers scattering below for scale, apocalyptic sky',
    faction: 'IRONWRIGHT',
    comp: 'ENV',
  },

  // === REGEN: Rakshasa — v12 was static tiger on throne ===
  // Fix: show the transformation happening, dual nature visible
  {
    name: 'Rakshasa Unmasked',
    scene: 'A figure in ornate Indian royal robes tearing off its own human face to reveal a snarling tiger face beneath, one hand pulling away the human mask which hangs like a limp skin, tiger fangs and burning eyes exposed, jeweled fingers with backwards-facing palms, palace interior with silk curtains, horrified servants fleeing',
    faction: 'DEMONIC',
    comp: 'PORTRAIT',
  },

  // === NEW: Fill gaps — need more dynamic Fey ===
  {
    name: 'Treant Uprooting',
    scene: 'An ancient treant pulling its root-feet from the earth to walk, massive oak trunk body splitting as it takes its first step, soil and rocks cascading from its roots, smaller trees bending away from it, face formed in the bark of its trunk bellowing, birds erupting from its canopy crown, forest clearing, enormous scale',
    faction: 'FEY_COURTS',
    comp: 'ENV',
  },

  // === NEW: Iconic fey creature doing something ===
  {
    name: 'Will-o-Wisp Swarm',
    scene: 'A cluster of ghostly pale lights floating through a dark misty bog at night, each wisp a different pale color with a faint face visible inside, leading a lone traveler deeper into the swamp, the travelers lantern tiny compared to the wisps glow, dead trees reflected in black water, eerie and beautiful',
    faction: 'FEY_COURTS',
    comp: 'NAR',
  },

  // === NEW: Endless creature with clear iconic shape ===
  {
    name: 'Bone Colossus',
    scene: 'A towering giant assembled from thousands of human bones fused together, skull-shaped head made of dozens of smaller skulls, rib cage torso with a sickly green glow inside, arm made of fused femurs reaching down to pick up more bones from a battlefield, walking through fog, dwarfing ruined castle walls',
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },

  // === NEW: Another Endless with strong action ===
  {
    name: 'Banshee Wailing',
    scene: 'A banshee hovering above a moonlit hilltop screaming, mouth open impossibly wide, long white hair whipping upward like flames, tattered grey dress dissolving into mist at the hem, visible sonic waves rippling outward from her mouth cracking nearby standing stones, bare dead trees bent away from the sound',
    faction: 'THE_ENDLESS',
    comp: 'ACT',
  },

  // === NEW: Ruin with dramatic action ===
  {
    name: 'Obsidian Spire',
    scene: 'A massive spire of black obsidian glass erupting from cracked desert earth, perfectly smooth and reflective, dark lightning arcing between its tip and storm clouds above, the sand around its base turned to glass in concentric rings, small figures in robes approaching with offerings, alien and wrong in the landscape',
    faction: 'NEUTRAL',
    comp: 'ENV',
    type: 'PLANAR_RUIN',
  },

  // === NEW: Ruin with mystery/narrative ===
  {
    name: 'The Drowned Gate',
    scene: 'A colossal stone archway standing in the middle of a calm ocean, covered in barnacles and coral, the space inside the arch showing a different sky than the one above the ocean, ships anchored nearby studying it, chains hanging from the arch into the deep water, sunset light, sense of ancient alien purpose',
    faction: 'NEUTRAL',
    comp: 'ENV',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v13-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
        if (attempt < 2) execFileSync('sleep', [String(3 * (attempt + 1))]);
        else throw err;
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
      if (attempt < 2) execFileSync('sleep', [String(2 * (attempt + 1))]);
      else throw err;
    }
  }
}

async function callFal(body) {
  const endpoint = 'fal-ai/fast-sdxl';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 60);
  if (submitResult.detail) throw new Error(`fal.ai submit: ${JSON.stringify(submitResult.detail)}`);
  const requestId = submitResult.request_id;
  if (!requestId) throw new Error(`No request_id: ${JSON.stringify(submitResult)}`);
  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  while (true) {
    let status;
    try { status = curlGet(pollUrl, 20); } catch { execFileSync('sleep', ['3']); continue; }
    if (status.status === 'COMPLETED') break;
    if (status.status === 'FAILED') throw new Error(`Failed: ${JSON.stringify(status)}`);
    execFileSync('sleep', ['2']);
  }
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 60);
  if (result.detail) throw new Error(`fal.ai fetch: ${JSON.stringify(result.detail)}`);
  return result;
}

async function main() {
  console.log('\n=== V13 Artifact-Fix Regen (16 cards) ===\n');
  console.log('10 regen from v12 with fixed prompts + 6 new fills');
  console.log('Fixes: clear anatomy, iconic silhouettes, single-creature focus');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V13-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
    console.log(`[${i + 1}/${CARDS.length}] ${card.name} (${card.faction}) [${card.comp}]`);

    if (existsSync(join(OUT_DIR, fileName))) {
      console.log('    Already exists, skipping');
      results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', skipped: true });
      continue;
    }

    try {
      const result = await callFal({
        prompt,
        negative_prompt: NEG,
        image_size: 'portrait_4_3',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        format: 'png',
        loras: [{ path: LORA_URL, scale: LORA_SCALE }],
      });

      if (result.has_nsfw_concepts?.[0]) {
        console.log('    NSFW flagged, retrying...');
        const retryResult = await callFal({
          prompt: `${card.name}, dark fantasy creature, ${STYLE}`,
          negative_prompt: NEG, image_size: 'portrait_4_3', num_inference_steps: 25,
          guidance_scale: 7.5, num_images: 1, enable_safety_checker: true, format: 'png',
          loras: [{ path: LORA_URL, scale: LORA_SCALE }],
        });
        if (retryResult.has_nsfw_concepts?.[0] || !retryResult.images?.[0]?.url) {
          results.push({ index: i + 1, name: card.name, faction: card.faction, error: 'NSFW' });
          continue;
        }
        const img = await fetch(retryResult.images[0].url);
        const buf = Buffer.from(await img.arrayBuffer());
        writeFileSync(join(OUT_DIR, fileName), buf);
        console.log(`    Saved (retry): ${fileName} (${(buf.length / 1024).toFixed(0)}KB)`);
        results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', seed: retryResult.seed, sizeKB: Math.round(buf.length / 1024) });
        continue;
      }

      if (!result.images?.[0]?.url) {
        results.push({ index: i + 1, name: card.name, faction: card.faction, error: 'No image' });
        continue;
      }

      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(join(OUT_DIR, fileName), buf);
      console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);
      results.push({ index: i + 1, fileName, name: card.name, faction: card.faction, comp: card.comp, type: card.type || 'CREATURE', seed: result.seed, sizeKB: Math.round(buf.length / 1024) });
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ index: i + 1, name: card.name, faction: card.faction, error: err.message });
    }
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));
  const ok = results.filter(r => !r.error && !r.skipped).length;
  console.log(`\n=== Complete: ${ok}/${CARDS.length} ===`);
  console.log(`Est. cost: ~$${(ok * 0.025).toFixed(2)}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

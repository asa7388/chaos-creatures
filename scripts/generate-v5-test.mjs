#!/usr/bin/env node
// generate-v5-test.mjs — Compositional variety batch for LoRA training
// Targeting compositions underrepresented in keepers:
//   - AERIAL: bird's eye / top-down / creature in flight
//   - CLOSE: extreme close-up on face/detail
//   - GROUP: multiple creatures / swarm
//   - SILHOUETTE: backlit dramatic outline
//   - UNUSUAL: underwater, upside-down, unusual perspective
//   - LOW_ANGLE: worm's eye view looking up

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v5');
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
  'nudity, nsfw';

const CARDS = [
  // AERIAL compositions
  {
    name: 'Skyforge Carrier',
    scene: 'A massive iron airship seen from directly above, its deck crawling with tiny worker automatons, flying through clouds over a strip-mined planet, exhaust trails behind it, bird\'s eye view',
    faction: 'IRONWRIGHT',
    comp: 'AERIAL',
  },
  {
    name: 'Verdant Drake',
    scene: 'A dragon made of living wood and vines soaring above a canopy of ancient trees, wings of broad green leaves spread wide, seen from below against a twilight sky, spores trailing from its body',
    faction: 'FEY_COURTS',
    comp: 'LOW_ANGLE',
  },

  // EXTREME CLOSE-UP compositions
  {
    name: 'Abyssal Eye',
    scene: 'Extreme close-up of a single enormous demonic eye filling the frame, iris of swirling molten gold, veins of hellfire in the sclera, reflection of a burning city visible in the pupil, cracked obsidian skin around the eye',
    faction: 'DEMONIC',
    comp: 'CLOSE',
  },
  {
    name: 'Rusted Prophet',
    scene: 'Close-up portrait of an ancient iron automaton face, one eye a flickering blue sensor, the other a dark empty socket, rust and lichen covering half the face, jaw hanging open revealing gears, rain dripping off it',
    faction: 'IRONWRIGHT',
    comp: 'CLOSE',
  },

  // GROUP / SWARM compositions
  {
    name: 'Fey Procession',
    scene: 'A long winding procession of dozens of strange fey creatures marching through a moonlit forest path, each one different and bizarre, some tall some tiny, carrying lanterns and banners of leaves, seen from a distance',
    faction: 'FEY_COURTS',
    comp: 'GROUP',
  },
  {
    name: 'Soul Harvest',
    scene: 'A field of translucent ghosts rising from graves in a vast cemetery, hundreds of spectral figures ascending into a vortex in the sky, a single lich standing in the center with arms raised, wide shot',
    faction: 'THE_ENDLESS',
    comp: 'GROUP',
  },

  // SILHOUETTE / BACKLIT compositions
  {
    name: 'Dusk Sentinel',
    scene: 'Silhouette of a massive winged celestial warrior standing on a cliff edge against a blazing sunset, sword raised, cape billowing, dramatic backlit outline with golden rim light, clouds below',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'SILHOUETTE',
  },
  {
    name: 'Furnace Gate',
    scene: 'Dark silhouette of a horned demon lord standing in an enormous doorway of fire, the entire frame backlit by hellfire behind the figure, only glowing eyes and molten cracks visible on the body, tiny supplicants kneeling before it',
    faction: 'DEMONIC',
    comp: 'SILHOUETTE',
  },

  // UNUSUAL PERSPECTIVE compositions
  {
    name: 'Depth Lurker',
    scene: 'An enormous bioluminescent deep-sea creature seen from below in murky water, tentacles trailing upward, a faint light source above the water surface, eerie blue-green glow from the creature\'s body, underwater scene',
    faction: 'FEY_COURTS',
    comp: 'UNUSUAL',
  },
  {
    name: 'Crypt Spider',
    scene: 'A massive bone-armored spider hanging upside-down from a cathedral ceiling, wrapping a ghostly figure in spectral webbing, viewed looking straight up, vaulted arches framing the scene, green necromantic light',
    faction: 'THE_ENDLESS',
    comp: 'UNUSUAL',
  },

  // PLANAR RUINS
  {
    name: 'The Dreaming Spire',
    scene: 'A impossibly tall crystalline tower spiraling into clouds, its surface shifting between transparent and opaque, strange lights moving inside it like trapped stars, crumbled ancient walls at its base, no people, alien landscape',
    faction: 'NEUTRAL',
    comp: 'LOW_ANGLE',
    type: 'PLANAR_RUIN',
  },
  {
    name: 'Mote Garden',
    scene: 'A circular stone amphitheater overgrown with glowing crystal formations, hundreds of tiny floating light motes drifting above the seats like frozen fireflies, ancient carved steps leading down to a dark pool at center, no people',
    faction: 'NEUTRAL',
    comp: 'AERIAL',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v5-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V5 Compositional Variety (10 creatures + 2 ruins) ===\n');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V5-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
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
          prompt: `${card.name}, fantasy creature, ${STYLE}`,
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

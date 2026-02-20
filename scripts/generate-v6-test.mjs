#!/usr/bin/env node
// generate-v6-test.mjs — Gap-filling batch for LoRA training
// Targeting: Fey +3, Demonic +3, Celestial +1, Endless +1, Ironwright +1, Ruins +1
// Composition focus: more CLOSE, SILHOUETTE, GROUP, UNUSUAL, PORTRAIT

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v6');
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
  // FEY COURTS — need 3 more keepers
  {
    name: 'Sporecrown Matriarch',
    scene: 'A towering fungal queen with a crown of enormous spotted mushroom caps, body of intertwined mycelium threads, dozens of tiny spore-children crawling on her form, in a vast underground cavern of giant mushrooms',
    faction: 'FEY_COURTS',
    comp: 'GROUP',
  },
  {
    name: 'Petrified Treant',
    scene: 'Close-up of a massive face formed in ancient bark, one eye a hollow filled with glowing amber sap, the other eye a birds nest with tiny luminous eggs, moss beard, caterpillars crawling across the brow, bark texture filling the frame',
    faction: 'FEY_COURTS',
    comp: 'CLOSE',
  },
  {
    name: 'Will-o-Wisp Swarm',
    scene: 'A cloud of pale blue-green flame spirits swirling through a misty bog at night, each wisp a tiny ghostly face with trailing light, their reflections dancing on dark water, dead trees silhouetted against them',
    faction: 'FEY_COURTS',
    comp: 'GROUP',
  },

  // DEMONIC — need 3 more keepers
  {
    name: 'Obsidian Magistrate',
    scene: 'A gaunt demon in elaborate black glass armor seated on a throne of contracts and scrolls, holding a quill dripping with liquid fire, shelves of soul-jars behind, green candlelight, bureaucratic hellscape office',
    faction: 'DEMONIC',
    comp: 'NAR',
  },
  {
    name: 'Magma Wurm',
    scene: 'A colossal serpentine creature of cooled volcanic rock bursting through the floor of a lava cavern, molten cracks running along its segmented body, mouth open revealing a core of white-hot magma, debris flying',
    faction: 'DEMONIC',
    comp: 'ACT',
  },
  {
    name: 'Hellfire Coliseum',
    scene: 'Silhouette of two massive demons locked in combat in a burning arena, backlit by a wall of hellfire, spectator demons visible as dark shapes in tiered seating, sparks and embers filling the air',
    faction: 'DEMONIC',
    comp: 'SILHOUETTE',
  },

  // CELESTIAL — need 1 more
  {
    name: 'Cherub Swarm',
    scene: 'A formation of dozens of tiny armored cherubs flying in a V-pattern through clouds, each one carrying a miniature golden lance, halos glowing, wings of white light, seen from the side against dramatic cloud banks',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'GROUP',
  },

  // ENDLESS — need 1 more
  {
    name: 'Tomb Colossus',
    scene: 'An enormous stone sarcophagus lid rising as a giant, mummy wrappings trailing like tattered robes, one massive hand gripping a crumbling pillar, hieroglyphic runes glowing green on its body, ancient temple collapsing around it',
    faction: 'THE_ENDLESS',
    comp: 'ACT',
  },

  // IRONWRIGHT — need 1 more portrait type
  {
    name: 'Forge Overseer',
    scene: 'Close-up of a massive industrial automaton face behind a welding visor, one eye a telescoping lens glowing red, the other a bank of tiny sensors, riveted iron jaw, steam venting from neck joints, molten sparks reflecting off the visor',
    faction: 'IRONWRIGHT',
    comp: 'CLOSE',
  },

  // RUINS — 1 more unusual
  {
    name: 'The Hollow Throne',
    scene: 'An enormous empty stone throne carved from a single mountain peak, clouds passing through it, a stairway of a thousand steps leading up to it, lightning striking the armrests, no one seated, desolate and ancient, wide shot from below',
    faction: 'NEUTRAL',
    comp: 'ENV',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v6-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V6 Gap-Fill Batch (10 creatures + 1 ruin) ===\n');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V6-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
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

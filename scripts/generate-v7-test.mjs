#!/usr/bin/env node
// generate-v7-test.mjs — Gap fill: undead variety, fey variety, mid-shot portraits
// Fixes: no "dozens of X" swarm descriptions, describe collective as single entity

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v7');
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
  // THE ENDLESS — undead variety (4 cards, all different undead types)
  {
    name: 'Revenant Knight',
    scene: 'A towering armored figure with a rusted greatsword, helmet visor open revealing a skull with one glowing green eye, tattered black cloak, standing in a ruined castle hallway lit by moonlight through broken windows',
    faction: 'THE_ENDLESS',
    comp: 'HERO',
  },
  {
    name: 'Fleshknit Abomination',
    scene: 'A hulking mass of stitched-together corpses lurching through a necromancer laboratory, multiple arms of different sizes, chains and hooks embedded in its flesh, jars of specimens on shelves behind it, sickly yellow lamplight',
    faction: 'THE_ENDLESS',
    comp: 'NAR',
  },
  {
    name: 'Banshee Queen',
    scene: 'A spectral woman with hollow black eyes and a mouth open in a silent scream, crown of frozen tears on her head, translucent robes dissolving into mist at the edges, floating above a frozen throne room, icicles on every surface',
    faction: 'THE_ENDLESS',
    comp: 'PORTRAIT',
  },
  {
    name: 'Grave Titan',
    scene: 'An enormous skeletal giant half-buried in earth tearing itself free from a hillside graveyard, tombstones tumbling off its shoulders, dirt cascading, one arm fully emerged grasping at the sky, green necromantic lightning in storm clouds above',
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },

  // FEY COURTS — non-plant variety (3 cards)
  {
    name: 'Gloom Weaver',
    scene: 'A tall pale fey creature with too-long fingers weaving shadow into cloth on a loom made of moonlight, in a dark hollow tree interior, cobwebs of darkness in corners, a single candle casting wild shadows, unsettling beauty',
    faction: 'FEY_COURTS',
    comp: 'NAR',
  },
  {
    name: 'Ironbark Guardian',
    scene: 'A massive tree-creature with bark like hammered iron standing guard at a forest gate of twisted branches, shield of woven roots in one hand, eyes of smoldering amber, moss hanging like a beard, dusk light filtering through canopy',
    faction: 'FEY_COURTS',
    comp: 'HERO',
  },
  {
    name: 'Frost Nymph',
    scene: 'A small crystalline ice-figure perched on a frozen waterfall edge, body of translucent blue ice with cracks of inner light, hair of icicles, one hand touching the waterfall and spreading frost patterns outward, winter forest behind',
    faction: 'FEY_COURTS',
    comp: 'OBJ',
  },

  // MID-SHOT PORTRAITS — bread-and-butter card game compositions (3 cards, mixed factions)
  {
    name: 'Siege Chaplain',
    scene: 'A battle-worn priest in dented golden armor gripping a war hammer, blood on his face, halo cracked and flickering, standing amid battlefield smoke, determined expression, wounded but unbroken, mid-shot waist up',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'PORTRAIT',
  },
  {
    name: 'Scrap Sentinel',
    scene: 'A jury-rigged automaton built from mismatched salvage standing in a junkyard, one arm a crane hook, chest plate a repurposed boiler door with glowing vents, sensor array head cobbled from cameras and pipes, rain falling',
    faction: 'IRONWRIGHT',
    comp: 'PORTRAIT',
  },
  {
    name: 'Pact Broker',
    scene: 'A suave horned demon in a fine dark suit seated in a leather chair, holding a burning contract in one clawed hand and a glass of glowing liquid in the other, smirking, bookshelves of grimoires behind, warm candlelight, mid-shot',
    faction: 'DEMONIC',
    comp: 'PORTRAIT',
  },

  // RUIN — interior/claustrophobic
  {
    name: 'The Whispering Vault',
    scene: 'A small underground chamber with walls covered floor to ceiling in carved stone faces with open mouths, faint light emanating from each mouth, a single stone pedestal in the center holding a cracked orb, tight claustrophobic space, no people',
    faction: 'NEUTRAL',
    comp: 'CLOSE',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v7-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V7 Variety Batch (11 cards) ===\n');
  console.log('Focus: undead variety, fey variety, mid-shot portraits, interior ruin');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V7-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
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

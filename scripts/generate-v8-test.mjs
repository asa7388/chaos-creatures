#!/usr/bin/env node
// generate-v8-test.mjs — Composition gap fill for LoRA training balance
// Target: SILHOUETTE +3, GROUP +2, LOW_ANGLE +2, UNUSUAL +2, PORTRAIT +2, ACT +2, AERIAL +1
// Total: 14 cards to balance training set away from ENV dominance

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v8');
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
  // === SILHOUETTE x3 (backlit dramatic outlines — currently only 1 keeper) ===
  {
    name: 'Voidwalker',
    scene: 'Black silhouette of a massive horned figure standing at the edge of a cliff, backlit by a dying red sun sinking into an ocean of clouds, tattered cloak billowing, one arm raised holding a jagged spear, birds circling',
    faction: 'THE_ENDLESS',
    comp: 'SILHOUETTE',
  },
  {
    name: 'Thornqueen Ascending',
    scene: 'Dark silhouette of a crowned figure with enormous branch-antlers rising from a forest canopy, backlit by a huge full moon, vines and leaves trailing from outstretched arms, fireflies dotting the darkness below',
    faction: 'FEY_COURTS',
    comp: 'SILHOUETTE',
  },
  {
    name: 'Siege Engine',
    scene: 'Black silhouette of a colossal walking machine against a burning city skyline, smoke and embers filling the orange sky, tiny fleeing figures in shadow below, searchlights cutting through haze',
    faction: 'IRONWRIGHT',
    comp: 'SILHOUETTE',
  },

  // === GROUP x2 (multiple distinct creatures — currently only 1 keeper) ===
  {
    name: 'War Council',
    scene: 'Three demon lords of different builds gathered around a burning map table in a war tent, one tall and thin with ram horns, one squat and armored with tusks, one floating and spectral with too many eyes, arguing over strategy',
    faction: 'DEMONIC',
    comp: 'GROUP',
  },
  {
    name: 'The Last Watch',
    scene: 'Five skeletal knights in rusted armor standing in a line on a crumbling castle wall at dawn, each in a different state of decay, shields raised, facing an unseen threat beyond the wall, morning mist below',
    faction: 'THE_ENDLESS',
    comp: 'GROUP',
  },

  // === LOW_ANGLE x2 (dramatic upward shot — currently only 1 keeper) ===
  {
    name: 'Cathedral Golem',
    scene: 'Looking straight up at a towering stone golem made of cathedral architecture, flying buttresses for arms, rose window glowing in its chest, stained glass eyes, rain falling past it from dark clouds above, dramatic perspective',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'LOW_ANGLE',
  },
  {
    name: 'Canopy Hydra',
    scene: 'Looking up from the forest floor at a massive multi-headed serpent coiled through ancient tree branches high above, each head a different color of venomous bloom, dappled sunlight filtering through scales and leaves',
    faction: 'FEY_COURTS',
    comp: 'LOW_ANGLE',
  },

  // === UNUSUAL x2 (underwater, inverted, surreal perspective — currently only 1 keeper) ===
  {
    name: 'Abyss Leviathan',
    scene: 'Deep underwater scene of a massive creature with bioluminescent lures descending into a trench, jellyfish and deep-sea creatures scattered around, light only from organic glow, crushing darkness at the edges, bubbles rising',
    faction: 'THE_ENDLESS',
    comp: 'UNUSUAL',
  },
  {
    name: 'Gravity Inverter',
    scene: 'A mechanical construct hanging upside down from a ceiling of gears and pipes, its body oriented opposite to the viewer, chains and debris falling upward around it, disorienting perspective, industrial cavern',
    faction: 'IRONWRIGHT',
    comp: 'UNUSUAL',
  },

  // === PORTRAIT x2 (tight mid-shot character — currently only 2 keepers) ===
  {
    name: 'Blightsower',
    scene: 'Mid-shot of a gaunt fey creature with bark skin and hollow eye sockets leaking golden sap, a crown of dead flowers, expression of ancient sorrow, fungi growing from its shoulders, soft green-gold backlight',
    faction: 'FEY_COURTS',
    comp: 'PORTRAIT',
  },
  {
    name: 'Void Admiral',
    scene: 'Mid-shot of a massive automaton commander, riveted iron face plate with a single glowing viewport slit, shoulder epaulettes of welded scrap metal, exhaust pipes venting steam behind, cold blue industrial lighting',
    faction: 'IRONWRIGHT',
    comp: 'PORTRAIT',
  },

  // === ACT x2 (dynamic mid-combat action — currently 4 keepers but want more variety) ===
  {
    name: 'Rift Breaker',
    scene: 'A celestial warrior mid-leap slashing downward with a blade of pure light, golden wings fully spread, shattered stone flying from the impact point below, divine energy radiating outward, frozen moment of violence',
    faction: 'CELESTIAL_CRUSADE',
    comp: 'ACT',
  },
  {
    name: 'Chain Lash',
    scene: 'A horned demon swinging a massive spiked chain in a wide arc through a crowd of ghostly shapes, chain mid-whip trailing fire, the demons body twisted in violent motion, debris and sparks flying, lava-lit cavern',
    faction: 'DEMONIC',
    comp: 'ACT',
  },

  // === AERIAL x1 (bird's eye — currently 2 keepers, bring to 3) ===
  {
    name: 'The Bone Garden',
    scene: 'Birds eye view looking straight down at a circular graveyard where the tombstones form a spiral pattern, skeletal hands reaching up from the earth between graves, a necromantic glyph visible in the layout, moonlight from above',
    faction: 'THE_ENDLESS',
    comp: 'AERIAL',
    type: 'PLANAR_RUIN',
  },
];

function curlPost(url, body, timeoutSec = 60) {
  const tmpFile = `/tmp/fal-v8-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  console.log('\n=== V8 Composition Gap Fill (14 cards) ===\n');
  console.log('Target: SILHOUETTE +3, GROUP +2, LOW_ANGLE +2, UNUSUAL +2, PORTRAIT +2, ACT +2, AERIAL +1');
  console.log(`Cost: ~$${(CARDS.length * 0.025).toFixed(2)}\n`);

  const results = [];
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];
    const prompt = `${card.scene}, ${STYLE}`;
    const typeSlug = card.type === 'PLANAR_RUIN' ? 'ruin' : card.faction.toLowerCase().replace(/_/g, '-');
    const fileName = `V8-${typeSlug}-${String(i + 1).padStart(2, '0')}.png`;
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

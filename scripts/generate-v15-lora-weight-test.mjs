#!/usr/bin/env node
// generate-v15-lora-weight-test.mjs — Test LoRA weight scaling
// Same 3 creatures at scale 1.0, 1.3, 1.6 to find the sweet spot

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'preview', 'pool-v15');
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

const LORA_URL = 'https://v3b.fal.media/files/b/0a8f209b/hUzJMCoRfQSuU0e4CDUS6_pytorch_lora_weights.safetensors';
const TRIGGER = 'CHSCRT style';

// 3 test creatures — one portrait, one action, one environment
const CREATURES = [
  {
    name: 'Forge Priest',
    prompt: `${TRIGGER}, close-up portrait of an iron priest with a mask made of welded steel plates, glowing orange eyes behind slits, molten metal dripping from ritual tools held in gauntleted hands, furnace light from below illuminating the mask, dark industrial cathedral behind`,
    faction: 'IRONWRIGHT',
    comp: 'PORTRAIT',
  },
  {
    name: 'Root Wyrm',
    prompt: `${TRIGGER}, a massive serpentine creature made of twisted tree roots and vines bursting from the forest floor, soil cascading from its body, glowing amber sap dripping from its wooden fangs, crushing a stone wall as it emerges, birds fleeing the canopy above`,
    faction: 'FEY_COURTS',
    comp: 'ACT',
  },
  {
    name: 'Grave Tide',
    prompt: `${TRIGGER}, a massive wave of skeletal hands and arms erupting from cemetery ground, hundreds of bony fingers reaching skyward like a frozen tidal wave, a lone gravedigger dropping his shovel and stumbling backward, green moonlight, fog rolling between headstones`,
    faction: 'THE_ENDLESS',
    comp: 'ENV',
  },
];

const SCALES = [1.0, 1.3, 1.6];

function curlPost(url, body, timeoutSec = 120) {
  const tmpFile = `/tmp/fal-v15-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  const endpoint = 'fal-ai/flux-lora';
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 120);
  if (submitResult.detail) throw new Error(`fal.ai submit: ${JSON.stringify(submitResult.detail)}`);
  const requestId = submitResult.request_id;
  if (!requestId) throw new Error(`No request_id: ${JSON.stringify(submitResult)}`);
  const pollUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  while (true) {
    let status;
    try { status = curlGet(pollUrl, 20); } catch { execFileSync('sleep', ['3']); continue; }
    if (status.status === 'COMPLETED') break;
    if (status.status === 'FAILED') throw new Error(`Failed: ${JSON.stringify(status)}`);
    execFileSync('sleep', ['3']);
  }
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 60);
  if (result.detail) throw new Error(`fal.ai fetch: ${JSON.stringify(result.detail)}`);
  return result;
}

async function main() {
  const total = CREATURES.length * SCALES.length;
  console.log(`\n=== V15 LoRA Weight Test (${total} images) ===\n`);
  console.log(`Scales: ${SCALES.join(', ')}`);
  console.log(`Cost: ~$${(total * 0.035).toFixed(2)}\n`);

  const results = [];
  let idx = 0;
  for (const creature of CREATURES) {
    for (const scale of SCALES) {
      idx++;
      const scaleStr = scale.toFixed(1).replace('.', '');
      const typeSlug = creature.faction.toLowerCase().replace(/_/g, '-');
      const nameSlug = creature.name.toLowerCase().replace(/\s+/g, '-');
      const fileName = `V15-${typeSlug}-${nameSlug}-s${scaleStr}.png`;
      console.log(`[${idx}/${total}] ${creature.name} @ scale ${scale}`);

      if (existsSync(join(OUT_DIR, fileName))) {
        console.log('    Already exists, skipping');
        results.push({ index: idx, fileName, name: creature.name, faction: creature.faction, comp: creature.comp, scale, skipped: true });
        continue;
      }

      try {
        const result = await callFal({
          prompt: creature.prompt,
          image_size: { width: 768, height: 1024 },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
          output_format: 'png',
          loras: [{ path: LORA_URL, scale }],
        });

        if (!result.images?.[0]?.url) {
          results.push({ index: idx, name: creature.name, scale, error: 'No image' });
          continue;
        }

        const img = await fetch(result.images[0].url);
        const buf = Buffer.from(await img.arrayBuffer());
        writeFileSync(join(OUT_DIR, fileName), buf);
        console.log(`    Saved: ${fileName} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);
        results.push({ index: idx, fileName, name: creature.name, faction: creature.faction, comp: creature.comp, scale, seed: result.seed, sizeKB: Math.round(buf.length / 1024) });
      } catch (err) {
        console.error(`    FAILED: ${err.message}`);
        results.push({ index: idx, name: creature.name, scale, error: err.message });
      }
    }
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));
  const ok = results.filter(r => !r.error && !r.skipped).length;
  console.log(`\n=== Complete: ${ok}/${total} ===`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

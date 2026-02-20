#!/usr/bin/env node
// evolve-test-strength.mjs — Test evolution at lower strength with shorter prompts
// Picks 4 cards across factions, tries strength 0.35 with surgical prompts.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, 'preview');

// Load env
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
const LORA_SCALE = 0.9;

const STYLE_ANCHOR =
  'palette knife painting, dark atmospheric fantasy, rich saturated colors, ' +
  'dramatic lighting, deep shadows, chiaroscuro, heavy paint texture, ' +
  'layered palette knife strokes, masterwork fantasy illustration, ' +
  'traditional oil painting on canvas, ' +
  'no text no borders no UI no watermarks';

const NEGATIVE_PROMPT =
  'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, ' +
  'gore, distorted anatomy, multiple heads, deformed limbs, extra limbs, ' +
  '3d render, CGI, photorealistic, airbrushed, smooth, digital art, ' +
  'white background, collage, grid layout, concept art sheet, turnaround sheet';

// ==========================================================================
// Test cases: 4 cards, short surgical prompts
// ==========================================================================

const TEST_CARDS = [
  {
    baseFile: 'BASE-iron-r1-iron-b05.png',
    label: 'Iron: Sapper Salamander [CM5]',
    direction: 'CHAOS',
    // Short surgical prompt — just describe what to ADD
    instruction: 'Add cracked glowing red vents along the mech torso. Add extra exhaust pipes belching wild flames from the back. Add sparking exposed wires at the joints.',
    strength: 0.35,
  },
  {
    baseFile: 'BASE-fey-r1-fey-b04.png',
    label: 'Fey: Gilded Moth Dancer [CM4]',
    direction: 'ORDER',
    instruction: 'Add golden crystalline patterns on the wing edges. Add a small crown of amber light above the head. Add faint silver sigils glowing on the body.',
    strength: 0.35,
  },
  {
    baseFile: 'BASE-demon-r1-demon-b04.png',
    label: 'Demon: Mirror Stalker [CM4]',
    direction: 'ORDER',
    instruction: 'Add dark obsidian crystal growths on the shoulders. Add glowing infernal runes etched into the chest. Add longer sharper horns.',
    strength: 0.35,
  },
  {
    baseFile: 'BASE-fey-r1-fey-b05.png',
    label: 'Fey: Sporemound Elder [CM5]',
    direction: 'CHAOS',
    instruction: 'Add jagged thorns erupting from the joints and spine. Add glowing green-purple veins cracking through the bark. Add toxic mushrooms sprouting from the shoulders.',
    strength: 0.35,
  },
];

// ==========================================================================
// fal.ai fast-sdxl queue API (same as evolve-preview.mjs)
// ==========================================================================

function curlPost(url, body, timeoutSec = 30) {
  const tmpFile = `/tmp/fal-evotest-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  const submitResult = curlPost(`https://queue.fal.run/${endpoint}`, body, 60);
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
// Main
// ==========================================================================

async function main() {
  console.log('\n=== Evolution Strength Test (strength 0.35, short prompts) ===\n');

  for (const card of TEST_CARDS) {
    console.log(`\n--- ${card.label} [${card.direction}] strength=${card.strength} ---`);

    const basePath = join(PREVIEW_DIR, card.baseFile);
    if (!existsSync(basePath)) {
      console.log(`  SKIP: ${card.baseFile} not found`);
      continue;
    }

    const baseBuffer = readFileSync(basePath);
    const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;

    // Instruction FIRST, then style anchor
    const prompt = [card.instruction, STYLE_ANCHOR].join('. ');

    const request = {
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      image_url: dataUri,
      strength: card.strength,
      image_size: 'portrait_4_3',
      num_inference_steps: 25,
      guidance_scale: 7.5,
      num_images: 1,
      enable_safety_checker: true,
      format: 'png',
      loras: [{ path: LORA_URL, scale: LORA_SCALE }],
    };

    try {
      const result = await callFalSD(request);

      if (result.has_nsfw_concepts?.[0]) {
        console.log('  NSFW false positive — skipping');
        continue;
      }
      if (!result.images?.[0]?.url) {
        console.log('  No image URL in response');
        continue;
      }

      const imgResponse = await fetch(result.images[0].url);
      if (!imgResponse.ok) throw new Error(`Download failed: ${imgResponse.status}`);
      const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());

      // Save as TEST-evo-{baseFile}
      const outFile = card.baseFile.replace('.png', '-test-evo.png');
      writeFileSync(join(PREVIEW_DIR, outFile), imageBuffer);
      console.log(`  Saved: ${outFile} (${(imageBuffer.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }

  console.log('\n=== Done ===');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

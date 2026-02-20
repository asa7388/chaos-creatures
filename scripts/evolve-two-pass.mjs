#!/usr/bin/env node
// evolve-two-pass.mjs — Two-pass evolution pipeline
// Pass 1: FLUX Kontext (identity-preserving edit — adds physical changes)
// Pass 2: fast-sdxl + LoRA at very low strength (re-applies palette knife texture)

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
// Test cases
// ==========================================================================

const TEST_CARDS = [
  {
    baseFile: 'BASE-iron-r1-iron-b05.png',
    label: 'Iron: Sapper Salamander [CM5]',
    direction: 'CHAOS',
    instruction: 'Add cracked glowing red vents along the mech torso. Add extra exhaust pipes belching wild flames from the back. Add sparking exposed wires at the joints.',
  },
  {
    baseFile: 'BASE-fey-r1-fey-b04.png',
    label: 'Fey: Gilded Moth Dancer [CM4]',
    direction: 'ORDER',
    instruction: 'Add golden crystalline patterns on the wing edges. Add a small crown of amber light above the head. Add faint silver sigils glowing on the body.',
  },
  {
    baseFile: 'BASE-demon-r1-demon-b04.png',
    label: 'Demon: Mirror Stalker [CM4]',
    direction: 'ORDER',
    instruction: 'Add dark obsidian crystal growths on the shoulders. Add glowing infernal runes etched into the chest. Add longer sharper horns.',
  },
  {
    baseFile: 'BASE-fey-r1-fey-b05.png',
    label: 'Fey: Sporemound Elder [CM5]',
    direction: 'CHAOS',
    instruction: 'Add jagged thorns erupting from the joints and spine. Add glowing green-purple veins cracking through the bark. Add toxic mushrooms sprouting from the shoulders.',
  },
];

// ==========================================================================
// Pass 1: FLUX Kontext (identity-preserving edit)
// ==========================================================================

async function callKontext(body) {
  const maxRetries = 3;
  let delay = 3000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux-kontext/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) return await response.json();

    const errText = await response.text();
    if (response.status === 422) throw new Error(`Kontext 422: ${errText}`);
    if (response.status === 429 || response.status >= 500) {
      if (attempt < maxRetries) {
        console.log(`    Kontext ${response.status}, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
    }
    throw new Error(`Kontext HTTP ${response.status}: ${errText}`);
  }
}

// ==========================================================================
// Pass 2: fast-sdxl + LoRA (style texture pass)
// ==========================================================================

function curlPost(url, body, timeoutSec = 30) {
  const tmpFile = `/tmp/fal-2pass-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  while (true) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    const status = curlGet(pollUrl, 15);
    if (status.status === 'COMPLETED') break;
    if (status.status === 'FAILED') throw new Error(`fal.ai failed: ${JSON.stringify(status)}`);
    process.stdout.write(`      Waiting ${elapsed}s (${status.status})...\r`);
    execFileSync('sleep', ['2']);
  }
  const totalWait = ((Date.now() - t0) / 1000).toFixed(1);
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const result = curlGet(resultUrl, 30);
  if (result.detail) throw new Error(`fal.ai fetch error: ${JSON.stringify(result.detail)}`);
  console.log(`      sdxl time: ${totalWait}s`);
  return result;
}

// ==========================================================================
// Two-pass pipeline
// ==========================================================================

async function evolveCard(card) {
  const basePath = join(PREVIEW_DIR, card.baseFile);
  if (!existsSync(basePath)) throw new Error(`Base not found: ${basePath}`);

  const baseBuffer = readFileSync(basePath);
  const baseDataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;

  // --- PASS 1: Kontext (identity-preserving physical changes) ---
  console.log(`  Pass 1: Kontext (add physical changes)...`);

  const kontextResult = await callKontext({
    image_url: baseDataUri,
    prompt: card.instruction,
    guidance_scale: 3.5,
    num_inference_steps: 28,
    output_format: 'png',
  });

  if (!kontextResult.images?.[0]?.url) throw new Error('Kontext: no image URL');
  if (kontextResult.has_nsfw_concepts?.[0]) throw new Error('Kontext: NSFW detected');

  // Download Kontext result
  const kontextImg = await fetch(kontextResult.images[0].url);
  if (!kontextImg.ok) throw new Error(`Kontext download failed: ${kontextImg.status}`);
  const kontextBuffer = Buffer.from(await kontextImg.arrayBuffer());
  console.log(`    Kontext done (${(kontextBuffer.length / 1024).toFixed(0)}KB, seed: ${kontextResult.seed})`);

  // Save intermediate for debugging
  const pass1File = card.baseFile.replace('.png', '-2pass-p1.png');
  writeFileSync(join(PREVIEW_DIR, pass1File), kontextBuffer);

  // --- PASS 2: SDXL + LoRA (re-apply palette knife texture) ---
  console.log(`  Pass 2: SDXL + LoRA (style texture, strength 0.15)...`);

  const kontextDataUri = `data:image/png;base64,${kontextBuffer.toString('base64')}`;

  const sdxlResult = await callFalSD({
    prompt: STYLE_ANCHOR,
    negative_prompt: NEGATIVE_PROMPT,
    image_url: kontextDataUri,
    strength: 0.15,
    image_size: 'portrait_4_3',
    num_inference_steps: 25,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    format: 'png',
    loras: [{ path: LORA_URL, scale: LORA_SCALE }],
  });

  if (sdxlResult.has_nsfw_concepts?.[0]) throw new Error('SDXL: NSFW detected');
  if (!sdxlResult.images?.[0]?.url) throw new Error('SDXL: no image URL');

  const finalImg = await fetch(sdxlResult.images[0].url);
  if (!finalImg.ok) throw new Error(`SDXL download failed: ${finalImg.status}`);
  const finalBuffer = Buffer.from(await finalImg.arrayBuffer());

  // Save final
  const outFile = card.baseFile.replace('.png', '-2pass-final.png');
  writeFileSync(join(PREVIEW_DIR, outFile), finalBuffer);
  console.log(`    Final: ${outFile} (${(finalBuffer.length / 1024).toFixed(0)}KB, seed: ${sdxlResult.seed})`);

  return { pass1File, outFile };
}

// ==========================================================================
// Main
// ==========================================================================

async function main() {
  console.log('\n=== Two-Pass Evolution Test ===');
  console.log('Pass 1: FLUX Kontext (identity-preserving edit)');
  console.log('Pass 2: fast-sdxl + LoRA @ 0.15 (palette knife texture)\n');

  for (const card of TEST_CARDS) {
    console.log(`\n--- ${card.label} [${card.direction}] ---`);
    try {
      await evolveCard(card);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }

  console.log('\n=== Done — check preview/ for *-2pass-p1.png (Kontext) and *-2pass-final.png (final) ===');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

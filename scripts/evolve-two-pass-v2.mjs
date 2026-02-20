#!/usr/bin/env node
// evolve-two-pass-v2.mjs — Two-pass evolution pipeline (v2)
// Pass 1: FLUX Kontext (identity-preserving edit)
// Pass 2: fast-sdxl + LoRA at low strength with FULL prompt (creature + evo + style)

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
// Test cases — now with creature descriptions for Pass 2
// ==========================================================================

const TEST_CARDS = [
  {
    baseFile: 'BASE-iron-r1-iron-b05.png',
    label: 'Iron: Sapper Salamander [CM5]',
    direction: 'CHAOS',
    // Kontext prompt (surgical additions)
    kontextPrompt: 'Add cracked glowing red vents along the mech torso. Add extra exhaust pipes belching wild flames from the back. Add sparking exposed wires at the joints.',
    // SDXL prompt (creature description + evo changes + style)
    sdxlPrompt: 'A massive mechanical war golem firing flames from its torso cannon in a barren desert wasteland, a small soldier standing in the foreground. The mech has cracked glowing red vents along its torso, extra exhaust pipes belching wild flames from the back, sparking exposed wires at the joints.',
  },
  {
    baseFile: 'BASE-fey-r1-fey-b04.png',
    label: 'Fey: Gilded Moth Dancer [CM4]',
    direction: 'ORDER',
    kontextPrompt: 'Add golden crystalline patterns on the wing edges. Add a small crown of amber light above the head. Add faint silver sigils glowing on the body.',
    sdxlPrompt: 'A large ornate moth creature with spread wings floating in a magical sky with scattered petals and moonlight, stream and mountains below. The moth has golden crystalline patterns on the wing edges, a small crown of amber light above the head, faint silver sigils glowing on the body.',
  },
  {
    baseFile: 'BASE-demon-r1-demon-b04.png',
    label: 'Demon: Mirror Stalker [CM4]',
    direction: 'ORDER',
    kontextPrompt: 'Add dark obsidian crystal growths on the shoulders. Add glowing infernal runes etched into the chest. Add longer sharper horns.',
    sdxlPrompt: 'A winged demon creature standing on stone stairs inside a dark gothic archway cathedral, muscular dark silhouette with horns and bat wings. The demon has dark obsidian crystal growths on the shoulders, glowing infernal runes etched into the chest, longer sharper horns.',
  },
  {
    baseFile: 'BASE-fey-r1-fey-b05.png',
    label: 'Fey: Sporemound Elder [CM5]',
    direction: 'CHAOS',
    kontextPrompt: 'Add jagged thorns erupting from the joints and spine. Add glowing green-purple veins cracking through the bark. Add toxic mushrooms sprouting from the shoulders.',
    sdxlPrompt: 'A massive ancient tree creature with a face made of bark and roots looming over a small cloaked figure in a misty autumn forest. The tree creature has jagged thorns erupting from the joints and spine, glowing green-purple veins cracking through the bark, toxic mushrooms sprouting from the shoulders.',
  },
];

// ==========================================================================
// Pass 1: FLUX Kontext
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
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      console.log(`    Kontext ${response.status}, retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`Kontext HTTP ${response.status}: ${errText}`);
  }
}

// ==========================================================================
// Pass 2: fast-sdxl + LoRA
// ==========================================================================

function curlPost(url, body, timeoutSec = 30) {
  const tmpFile = `/tmp/fal-2pv2-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
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
  if (submitResult.detail) throw new Error(`fal.ai submit: ${JSON.stringify(submitResult.detail)}`);
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
  if (result.detail) throw new Error(`fal.ai fetch: ${JSON.stringify(result.detail)}`);
  console.log(`      sdxl time: ${totalWait}s`);
  return result;
}

// ==========================================================================
// Pipeline
// ==========================================================================

async function evolveCard(card) {
  const basePath = join(PREVIEW_DIR, card.baseFile);
  if (!existsSync(basePath)) throw new Error(`Base not found: ${basePath}`);

  const baseBuffer = readFileSync(basePath);
  const baseDataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;

  // --- PASS 1: Kontext ---
  console.log(`  Pass 1: Kontext...`);
  const kontextResult = await callKontext({
    image_url: baseDataUri,
    prompt: card.kontextPrompt,
    guidance_scale: 3.5,
    num_inference_steps: 28,
    output_format: 'png',
  });
  if (!kontextResult.images?.[0]?.url) throw new Error('Kontext: no image URL');
  if (kontextResult.has_nsfw_concepts?.[0]) throw new Error('Kontext: NSFW');

  const kontextImg = await fetch(kontextResult.images[0].url);
  if (!kontextImg.ok) throw new Error(`Kontext download: ${kontextImg.status}`);
  const kontextBuffer = Buffer.from(await kontextImg.arrayBuffer());
  console.log(`    Kontext done (${(kontextBuffer.length / 1024).toFixed(0)}KB)`);

  // Save pass 1
  const p1File = card.baseFile.replace('.png', '-v2-p1.png');
  writeFileSync(join(PREVIEW_DIR, p1File), kontextBuffer);

  // --- PASS 2: SDXL + LoRA with full creature prompt ---
  console.log(`  Pass 2: SDXL + LoRA (full prompt, strength 0.15)...`);
  const kontextDataUri = `data:image/png;base64,${kontextBuffer.toString('base64')}`;

  // Full prompt = creature description + style anchor
  const fullPrompt = card.sdxlPrompt + '. ' + STYLE_ANCHOR;

  const sdxlResult = await callFalSD({
    prompt: fullPrompt,
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

  if (sdxlResult.has_nsfw_concepts?.[0]) throw new Error('SDXL: NSFW');
  if (!sdxlResult.images?.[0]?.url) throw new Error('SDXL: no image URL');

  const finalImg = await fetch(sdxlResult.images[0].url);
  if (!finalImg.ok) throw new Error(`SDXL download: ${finalImg.status}`);
  const finalBuffer = Buffer.from(await finalImg.arrayBuffer());

  const outFile = card.baseFile.replace('.png', '-v2-final.png');
  writeFileSync(join(PREVIEW_DIR, outFile), finalBuffer);
  console.log(`    Final: ${outFile} (${(finalBuffer.length / 1024).toFixed(0)}KB)`);
}

async function main() {
  console.log('\n=== Two-Pass v2: Kontext → SDXL+LoRA (full creature prompt) ===\n');

  for (const card of TEST_CARDS) {
    console.log(`\n--- ${card.label} [${card.direction}] ---`);
    try {
      await evolveCard(card);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }

  console.log('\n=== Done — check *-v2-p1.png and *-v2-final.png ===');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

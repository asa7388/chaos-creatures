#!/usr/bin/env node
// regen-cabals-iter3.mjs — Single texture iteration 3 fix for border-endless-cabals
// The word "skull" causes AI to generate skull objects. Must avoid it entirely.

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

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

const REGEN_DIR = join(PROJECT_ROOT, 'scripts/preview/visual-textures/regen');
mkdirSync(REGEN_DIR, { recursive: true });

async function callFal(body) {
  const maxRetries = 3;
  let delay = 3000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) return await response.json();
    const errText = await response.text();
    if (response.status === 422) throw new Error(`422: ${errText}`);
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      console.log(`  Retry in ${delay/1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }
}

async function main() {
  console.log('Generating border-endless-cabals iteration 3...');
  console.log('Approach: Avoid word "skull" entirely. Focus on generic bone material.\n');

  const body = {
    prompt: `Extreme macro close-up of aged animal bone material surface texture filling entire frame, seamless tileable texture, top-down flat view, even studio lighting, dense cortical bone with visible fine pores and hairline cracks, calcium-white ivory color with yellowing from centuries of age, smooth compact bone surface with subtle grain running through it, ossuary catacomb quality, ancient relic material, the flat surface of a single large bone plate, no recognizable anatomy just raw bone material surface, high detail macro photography, 1:1 aspect ratio. Avoid: whole bones, recognizable anatomy, teeth, joints, assembled skeleton, earth, mud, soil, dirt, clay, cracked ground, dried lake, desert, sand, text, watermark, objects, items on surface, hands, tools, strong directional light, vignette, border, frame`,
    image_size: { width: 512, height: 512 },
    num_inference_steps: 40,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  const result = await callFal(body);
  if (!result.images?.[0]?.url) throw new Error('No image URL');

  console.log(`  Generated (seed: ${result.seed || 'unknown'})`);
  const response = await fetch(result.images[0].url);
  const rawBuffer = Buffer.from(await response.arrayBuffer());

  const iter3Path = join(REGEN_DIR, 'border-endless-cabals-iter3.png');
  writeFileSync(iter3Path, rawBuffer);
  console.log(`  Raw: ${iter3Path}`);

  // Post-process: resize + sharpen
  const processed = await sharp(rawBuffer)
    .resize(512, 512, { fit: 'cover' })
    .sharpen({ sigma: 0.5 })
    .png({ quality: 90 })
    .toBuffer();

  const finalPath = join(REGEN_DIR, 'border-endless-cabals-final.png');
  writeFileSync(finalPath, processed);
  console.log(`  Final: ${finalPath} (${(processed.length / 1024).toFixed(0)}KB)`);
  console.log('  Cost: $0.04');
  console.log('  Total wave spend: $0.84 of $2.00');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

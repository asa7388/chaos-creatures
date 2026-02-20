#!/usr/bin/env node
// evolve-test-pro.mjs — Test Kontext Pro (no LoRA) for evolution
// Theory: base cards already have palette knife style baked in,
// Kontext Pro preserves it naturally without a LoRA fighting the colors.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, 'preview');

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

const STYLE_SUFFIX =
  'Keep the same color palette and lighting. ' +
  'Maintain thick palette knife oil painting style with visible heavy brushstrokes and impasto texture. ' +
  'Do not change the background, composition, or camera angle.';

const CARDS = [
  {
    baseFile: 'BASE-fey-r1-fey-b05.png',
    label: 'Fey: Sporemound Elder',
    instruction: 'Add jagged thorns erupting from the joints and spine. Add glowing green-purple veins cracking through the bark. Add toxic mushrooms sprouting from the shoulders.',
  },
  {
    baseFile: 'BASE-iron-r1-iron-b05.png',
    label: 'Iron: Sapper Salamander',
    instruction: 'Add cracked glowing red vents along the torso. Add extra exhaust pipes belching wild uncontrolled flames from the back. Add sparking exposed wires bursting from the joints.',
  },
];

async function callKontextPro(body) {
  const maxRetries = 3;
  let delay = 3000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
      method: 'POST',
      headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) return await response.json();
    const errText = await response.text();
    if (response.status === 422) throw new Error(`422: ${errText}`);
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      console.log(`    ${response.status}, retrying...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }
}

async function main() {
  console.log('\n=== Kontext Pro (No LoRA) Test ===\n');

  for (const card of CARDS) {
    const basePath = join(PREVIEW_DIR, card.baseFile);
    if (!existsSync(basePath)) { console.log(`Skip: ${card.baseFile} not found`); continue; }
    const baseBuffer = readFileSync(basePath);
    const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;
    const prompt = card.instruction + ' ' + STYLE_SUFFIX;

    console.log(`--- ${card.label} (Kontext Pro) ---`);
    try {
      const t0 = Date.now();
      const result = await callKontextPro({
        image_url: dataUri,
        prompt,
        guidance_scale: 2.5,
        num_inference_steps: 28,
        output_format: 'png',
        seed: 42,
      });
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      if (!result.images?.[0]?.url) throw new Error('No image');
      if (result.has_nsfw_concepts?.[0]) throw new Error('NSFW');
      const img = await fetch(result.images[0].url);
      const buf = Buffer.from(await img.arrayBuffer());
      const outFile = card.baseFile.replace('.png', '-pro.png');
      writeFileSync(join(PREVIEW_DIR, outFile), buf);
      console.log(`  ${outFile} (${(buf.length / 1024).toFixed(0)}KB, ${elapsed}s)`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }
  console.log('\n=== Done ===');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

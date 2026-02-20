#!/usr/bin/env node
// evolve-kontext-styled.mjs — Single-pass Kontext with style preservation instructions
// Tests whether adding palette/style language to Kontext prompt keeps colors consistent.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

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

const STYLE_SUFFIX =
  'Keep the same color palette, same warm muted earth tones, same heavy paint texture. ' +
  'Maintain the thick palette knife oil painting style with visible brushstrokes and impasto texture. ' +
  'Do not change the background, composition, or lighting.';

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

async function main() {
  console.log('\n=== Kontext with Style Preservation ===\n');

  for (const card of TEST_CARDS) {
    console.log(`--- ${card.label} [${card.direction}] ---`);

    const basePath = join(PREVIEW_DIR, card.baseFile);
    if (!existsSync(basePath)) { console.log('  SKIP: not found'); continue; }

    const baseBuffer = readFileSync(basePath);
    const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;

    // Combine physical changes + style preservation
    const prompt = card.instruction + ' ' + STYLE_SUFFIX;

    try {
      const result = await callKontext({
        image_url: dataUri,
        prompt,
        guidance_scale: 3.5,
        num_inference_steps: 28,
        output_format: 'png',
      });

      if (!result.images?.[0]?.url) throw new Error('No image URL');
      if (result.has_nsfw_concepts?.[0]) throw new Error('NSFW');

      const img = await fetch(result.images[0].url);
      if (!img.ok) throw new Error(`Download: ${img.status}`);
      const buf = Buffer.from(await img.arrayBuffer());

      const outFile = card.baseFile.replace('.png', '-ks.png');
      writeFileSync(join(PREVIEW_DIR, outFile), buf);
      console.log(`  Saved: ${outFile} (${(buf.length / 1024).toFixed(0)}KB, seed: ${result.seed})`);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }

  console.log('\n=== Done ===');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

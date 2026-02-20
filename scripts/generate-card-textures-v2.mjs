#!/usr/bin/env node
// generate-card-textures-v2.mjs — Generate additional textures for paper aesthetic
// Felt table background, wax seal badge texture
// Usage: node scripts/generate-card-textures-v2.mjs

import { readFileSync, mkdirSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

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
if (!FAL_KEY) { console.error('Missing FAL_KEY in game-server/.env'); process.exit(1); }

const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/card-textures');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
mkdirSync(PREVIEW_DIR, { recursive: true });

const TEXTURES = [
  {
    name: 'felt-table',
    variants: 3,
    width: 1024,
    height: 1024,
    prompt: 'seamless tileable texture of dark green felt fabric, like a poker table or card game playing surface, deep forest green to dark emerald color, visible soft fabric fibers and nap, slightly worn in places, warm dim ambient lighting, very dark and moody atmosphere, no patterns no text no objects, macro photograph of green felt surface',
  },
  {
    name: 'wax-seal-bronze',
    variants: 3,
    width: 256,
    height: 256,
    prompt: 'a single circular bronze wax seal stamp impression on dark background, aged patina, embossed raised edges, weathered bronze metal texture, ancient coin or medallion look, worn and tarnished, centered in frame, no text no letters no symbols, dark moody lighting from above left, macro photograph of antique bronze seal',
  },
  {
    name: 'leather-panel',
    variants: 2,
    width: 512,
    height: 256,
    prompt: 'seamless tileable texture of tooled dark leather panel, like a book cover or card game box, deep rich dark brown, visible leather grain and slight tooling marks, aged and worn patina, embossed border effect, warm dark tones, no text no symbols no patterns, flat lit from above, macro photograph of aged leather surface',
  },
];

async function callFal(body) {
  const maxRetries = 3;
  let delay = 3000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (response.ok) return await response.json();
    const errText = await response.text();
    if (response.status === 422) throw new Error(`fal.ai 422: ${errText}`);
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      console.log(`  fal.ai ${response.status}, retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    throw new Error(`fal.ai HTTP ${response.status}: ${errText}`);
  }
}

async function generateTexture(texture, variantNum) {
  const filename = `${texture.name}-v${variantNum}.png`;
  const filepath = join(PREVIEW_DIR, filename);
  if (existsSync(filepath)) {
    console.log(`  SKIP: ${filename} already exists`);
    return { skipped: true };
  }
  console.log(`  Generating: ${filename}...`);
  const result = await callFal({
    prompt: texture.prompt,
    image_size: { width: texture.width, height: texture.height },
    num_inference_steps: 40,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  });
  if (!result.images?.[0]?.url) throw new Error('No image URL');
  const tempUrl = result.images[0].url;
  console.log(`    Generated (seed: ${result.seed})`);
  const imgResponse = await fetch(tempUrl);
  if (!imgResponse.ok) throw new Error(`Download failed: ${imgResponse.status}`);
  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  writeFileSync(filepath, buffer);
  console.log(`    Saved: ${(buffer.length / 1024).toFixed(0)}KB`);
  return { skipped: false };
}

function installToAssets(textureName, variantNum, subdir = 'CardTextures') {
  const src = join(PREVIEW_DIR, `${textureName}-v${variantNum}.png`);
  if (!existsSync(src)) { console.log(`  Not found: ${textureName}-v${variantNum}`); return; }
  const groupDir = join(ASSETS_DIR, subdir);
  mkdirSync(groupDir, { recursive: true });
  if (!existsSync(join(groupDir, 'Contents.json'))) {
    writeFileSync(join(groupDir, 'Contents.json'), JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2));
  }
  const imagesetDir = join(groupDir, `${textureName}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });
  const destFilename = `${textureName}.png`;
  copyFileSync(src, join(imagesetDir, destFilename));
  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify({
    images: [
      { filename: destFilename, idiom: 'universal', scale: '1x' },
      { idiom: 'universal', scale: '2x' },
      { idiom: 'universal', scale: '3x' },
    ],
    info: { author: 'xcode', version: 1 },
  }, null, 2));
  console.log(`  Installed: ${textureName} → Assets.xcassets/${subdir}/`);
}

async function main() {
  console.log('=== Card Texture Generator v2 ===\n');
  let generated = 0;
  for (const texture of TEXTURES) {
    console.log(`\n--- ${texture.name} (${texture.variants} variants) ---`);
    for (let v = 1; v <= texture.variants; v++) {
      try {
        const r = await generateTexture(texture, v);
        if (!r.skipped) generated++;
      } catch (err) { console.error(`  ERROR: ${err.message}`); }
    }
  }
  console.log(`\nGenerated: ${generated} images (~$${(generated * 0.04).toFixed(2)})`);
  console.log(`Preview in: ${PREVIEW_DIR}`);

  const installIdx = process.argv.indexOf('--install');
  if (installIdx !== -1) {
    console.log('\n=== Installing ===');
    const specs = process.argv.slice(installIdx + 1);
    for (const spec of specs) {
      const parts = spec.split(':');
      const name = parts[0], variant = parts[1], subdir = parts[2] || 'CardTextures';
      installToAssets(name, parseInt(variant), subdir);
    }
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

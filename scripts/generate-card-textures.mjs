#!/usr/bin/env node
// generate-card-textures.mjs — Generate paper/canvas textures for card chrome
// Gives cards a 90s printed card game feel (like early MTG, Pokemon Base Set)
// Usage: node scripts/generate-card-textures.mjs

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

// Texture definitions
const TEXTURES = [
  {
    name: 'paper-texture',
    variants: 3,
    width: 512,
    height: 512,
    prompt: 'seamless tileable texture of aged antique parchment paper, warm cream and tan tones with subtle yellowing, visible paper fibers and grain, slight foxing spots and age marks, mottled uneven color like old handmade paper, no text no writing no patterns no drawings, flat lit from above, natural warm lighting, high detail macro photograph of old paper surface',
  },
  {
    name: 'dark-vellum',
    variants: 3,
    width: 512,
    height: 512,
    prompt: 'seamless tileable texture of very dark aged vellum or leather, dark brown almost black with subtle warm undertones, visible animal skin grain and subtle texture variations, slight wear marks and patina, like the dark leather binding of an ancient grimoire, no text no writing no patterns, flat lit diffuse lighting, macro photograph of dark aged leather surface',
  },
  {
    name: 'card-border-wood',
    variants: 2,
    width: 512,
    height: 512,
    prompt: 'seamless tileable texture of dark stained aged wood grain, rich deep brown walnut or mahogany, visible natural wood grain lines and knots, slight weathering and patina, warm dark tones like antique furniture, no text no patterns, flat lit from above, macro photograph of polished dark wood surface',
  },
  {
    name: 'canvas-weave',
    variants: 2,
    width: 512,
    height: 512,
    prompt: 'seamless tileable texture of natural linen canvas fabric weave, warm cream off-white color, visible interlocking thread pattern, like an oil painting canvas before being painted on, subtle texture variation in the weave, no paint no color no patterns, flat lit diffuse lighting, macro close-up photograph of raw artist canvas texture',
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
    if (response.status === 422) {
      throw new Error(`fal.ai 422 Validation: ${errText}`);
    }
    if (response.status === 429 || response.status >= 500) {
      if (attempt < maxRetries) {
        console.log(`  fal.ai ${response.status}, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
    }
    throw new Error(`fal.ai HTTP ${response.status}: ${errText}`);
  }
}

async function generateTexture(texture, variantNum) {
  const filename = `${texture.name}-v${variantNum}.png`;
  const filepath = join(PREVIEW_DIR, filename);

  if (existsSync(filepath)) {
    console.log(`  SKIP: ${filename} already exists`);
    return { filename, skipped: true };
  }

  console.log(`  Generating: ${filename}...`);

  const request = {
    prompt: texture.prompt,
    image_size: { width: texture.width, height: texture.height },
    num_inference_steps: 40,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  const result = await callFal(request);

  if (result.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected');
  }
  if (!result.images?.[0]?.url) {
    throw new Error('No image URL in fal.ai response');
  }

  const tempUrl = result.images[0].url;
  console.log(`    Generated (seed: ${result.seed}, ${Math.round(result.timings?.inference || 0)}ms)`);

  const imgResponse = await fetch(tempUrl);
  if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  console.log(`    Downloaded: ${(buffer.length / 1024).toFixed(0)}KB`);

  writeFileSync(filepath, buffer);
  console.log(`    Saved: ${filepath}`);

  return { filename, skipped: false, size: buffer.length, seed: result.seed };
}

function installToAssets(textureName, variantNum) {
  const src = join(PREVIEW_DIR, `${textureName}-v${variantNum}.png`);
  if (!existsSync(src)) {
    console.log(`  Cannot install ${textureName}-v${variantNum}: file not found`);
    return false;
  }

  // Create imageset directory
  const imagesetDir = join(ASSETS_DIR, 'CardTextures', `${textureName}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  // Copy image
  const destFilename = `${textureName}.png`;
  copyFileSync(src, join(imagesetDir, destFilename));

  // Write Contents.json
  const contents = {
    images: [
      { filename: destFilename, idiom: 'universal', scale: '1x' },
      { idiom: 'universal', scale: '2x' },
      { idiom: 'universal', scale: '3x' },
    ],
    info: { author: 'xcode', version: 1 },
  };
  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify(contents, null, 2));

  console.log(`  Installed: ${textureName} → Assets.xcassets/CardTextures/`);
  return true;
}

async function main() {
  console.log('=== Card Texture Generator ===\n');

  // Create CardTextures group Contents.json
  const groupDir = join(ASSETS_DIR, 'CardTextures');
  mkdirSync(groupDir, { recursive: true });
  if (!existsSync(join(groupDir, 'Contents.json'))) {
    writeFileSync(join(groupDir, 'Contents.json'), JSON.stringify({
      info: { author: 'xcode', version: 1 }
    }, null, 2));
  }

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalCost = 0;

  for (const texture of TEXTURES) {
    console.log(`\n--- ${texture.name} (${texture.variants} variants) ---`);
    for (let v = 1; v <= texture.variants; v++) {
      try {
        const result = await generateTexture(texture, v);
        if (result.skipped) {
          totalSkipped++;
        } else {
          totalGenerated++;
          totalCost += 0.04; // ~$0.04 per FLUX dev image
        }
      } catch (err) {
        console.error(`  ERROR: ${err.message}`);
      }
    }
  }

  console.log(`\n=== Generation Complete ===`);
  console.log(`Generated: ${totalGenerated}, Skipped: ${totalSkipped}`);
  console.log(`Estimated cost: $${totalCost.toFixed(2)}`);
  console.log(`\nPreview textures in: ${PREVIEW_DIR}`);
  console.log(`Pick the best variant of each and run with --install to copy to Xcode assets.`);
  console.log(`\nTo install best variants manually:`);
  console.log(`  node scripts/generate-card-textures.mjs --install paper-texture:2 dark-vellum:1 card-border-wood:1 canvas-weave:2`);

  // Check for --install flag
  const installIdx = process.argv.indexOf('--install');
  if (installIdx !== -1) {
    console.log('\n=== Installing to Assets ===');
    const specs = process.argv.slice(installIdx + 1);
    for (const spec of specs) {
      const [name, variant] = spec.split(':');
      if (!name || !variant) {
        console.log(`  Invalid spec: ${spec} (use name:variant)`);
        continue;
      }
      installToAssets(name, parseInt(variant));
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

#!/usr/bin/env node
// generate-stat-icons.mjs — Generate stat icons (chaos-motes, sword-atk, heart-hp)
// Generates 2 variants per icon for visual comparison.
// Usage: node scripts/generate-stat-icons.mjs [--iteration N] [--icon NAME]

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
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

const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/stat-icons');
mkdirSync(PREVIEW_DIR, { recursive: true });

// Parse CLI args
const args = process.argv.slice(2);
let iterationNum = 1;
let onlyIcon = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--iteration' && args[i + 1]) iterationNum = parseInt(args[i + 1]);
  if (args[i] === '--icon' && args[i + 1]) onlyIcon = args[i + 1];
}

// Shared style
const NEGATIVE_PROMPT =
  'text, words, letters, numbers, watermarks, signatures, logos, borders, frames, photograph, ' +
  '3d render, CGI, photorealistic, airbrushed, smooth plastic, vector art, clip art, flat design, ' +
  'minimalist, modern, clean lines, white background, solid background, gradient background';

// Icon prompts — iteration 1
const STAT_ICONS = [
  {
    name: 'chaos-motes',
    prompt: 'painterly oil painting style, heavy visible brushwork, traditional fantasy RPG game icon, dark moody background, a swirling vortex of multicolored chaotic energy motes, purple red gold and blue magical particles spiraling inward to a bright unstable core, volatile magical energy, no text no letters no words no borders no watermarks, square format, centered composition',
  },
  {
    name: 'sword-atk',
    prompt: 'painterly oil painting style, heavy visible brushwork, traditional fantasy RPG game icon, dark moody background, a single upright fantasy battle sword, ornate crossguard, glowing warm orange-red magical energy along the blade edge, attack power weapon icon, no text no letters no words no borders no watermarks, square format, centered composition',
  },
  {
    name: 'heart-hp',
    prompt: 'painterly oil painting style, heavy visible brushwork, traditional fantasy RPG game icon, dark moody background, a stylized heart symbol glowing with green protective energy, organic and warm, health and vitality, subtle magical shimmer, no text no letters no words no borders no watermarks, square format, centered composition',
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

async function generateVariant(icon, variantNum) {
  const filename = `${icon.name}-iter${iterationNum}-v${variantNum}.png`;
  const filepath = join(PREVIEW_DIR, filename);

  if (existsSync(filepath)) {
    console.log(`  SKIP: ${filename} already exists`);
    return { filename, skipped: true };
  }

  console.log(`  Generating: ${filename}...`);

  const request = {
    prompt: icon.prompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: { width: 256, height: 256 },
    num_inference_steps: 40,
    guidance_scale: 8.5,
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

async function main() {
  console.log(`=== Stat Icon Generation — Iteration ${iterationNum} ===`);

  const icons = onlyIcon
    ? STAT_ICONS.filter(i => i.name === onlyIcon)
    : STAT_ICONS;

  if (icons.length === 0) {
    console.error(`No icon found matching: ${onlyIcon}`);
    process.exit(1);
  }

  let totalGenerated = 0;

  for (const icon of icons) {
    console.log(`\n--- ${icon.name} ---`);
    for (let v = 1; v <= 2; v++) {
      try {
        const result = await generateVariant(icon, v);
        if (!result.skipped) {
          totalGenerated++;
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error(`  FAILED variant ${v}: ${err.message}`);
      }
    }
  }

  const costPerImage = 0.025;
  const totalCost = totalGenerated * costPerImage;
  console.log(`\n=== Done: ${totalGenerated} images generated ===`);
  console.log(`Estimated cost: $${totalCost.toFixed(3)}`);
  console.log(`Preview dir: ${PREVIEW_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

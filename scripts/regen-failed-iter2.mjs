#!/usr/bin/env node
// regen-failed-iter2.mjs — Iteration 2 for textures that failed visual inspection
// 7 textures that need re-generation with even more specific prompts
// Budget: Uses remaining ~$1.48 from Wave 1A-fix allocation

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ── Load environment ────────────────────────────────────────────────
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
if (!FAL_KEY) { console.error('Missing FAL_KEY in packages/game-server/.env'); process.exit(1); }

// ── Paths ───────────────────────────────────────────────────────────
const PREVIEW_DIR = join(PROJECT_ROOT, 'scripts/preview/visual-textures');
const REGEN_DIR = join(PROJECT_ROOT, 'scripts/preview/visual-textures/regen');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
mkdirSync(REGEN_DIR, { recursive: true });

// ── Budget tracking ─────────────────────────────────────────────────
const COST_PER_GEN = 0.04;
const BUDGET_LIMIT = 1.48; // Remaining from iter1
let totalCost = 0;
let totalGenerated = 0;
let failures = [];

const STD_NEGATIVE = 'text, watermark, objects, items on surface, hands, tools, strong directional light, vignette, border, frame, uneven lighting, color cast, gradient';

// ═══════════════════════════════════════════════════════════════════
// Iteration 2 textures — fundamentally different approaches
// ═══════════════════════════════════════════════════════════════════

const ITER2_TEXTURES = [
  // ── Transparency textures: Generate BRIGHT WHITE fog on SOLID BLACK ──
  // Then use sharp to extract luminance as alpha channel
  // This is the same approach as original but with MUCH higher contrast prompts
  {
    name: 'border-endless-spectres',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    luminanceAlpha: true,
    prompt: `Bright white smoke wisps and fog tendrils on a completely solid pitch black background, high contrast, pure white ethereal smoke against pure black void, spectral fog wisps, ghostly translucent white mist, very high contrast black and white only, no color, monochrome, studio photography of smoke against black backdrop, 1:1 aspect ratio`,
    negative: `color, green, blue, red, face, skull, ghost figure, person, gray background, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-endless-spectres',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    luminanceAlpha: true,
    prompt: `Thin horizontal wisps of bright white smoke on a completely solid pitch black background, high contrast, pure white translucent fog tendrils against pure black void, wispy horizontal smoke panel, very high contrast black and white only, no color, monochrome, studio photography of thin smoke wisps against black backdrop, 2:1 aspect ratio`,
    negative: `color, green, blue, red, face, skull, ghost figure, person, gray background, ${STD_NEGATIVE}`,
  },
  {
    name: 'fx-spectral-fog',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    luminanceAlpha: true,
    prompt: `Swirling white fog and smoke on completely solid pitch black background, high contrast, pure white ethereal smoke wisps against pure black void, abstract fog overlay texture, no figures no faces no skulls, just abstract smoke and mist, very high contrast black and white only, no color, monochrome, studio photography of smoke against black backdrop, 1:1 aspect ratio`,
    negative: `skull, face, person, figure, creature, ghost, skeleton, color, green, blue, red, gray background, ${STD_NEGATIVE}`,
  },

  // ── metal-obsidian: surface filling entire frame, absolutely no 3D object ──
  {
    name: 'metal-obsidian',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Seamless tileable polished black glass surface texture, macro photography extreme close-up filling entire frame edge to edge, deep pure black volcanic glass, very subtle conchoidal fracture lines barely visible, completely flat top-down view, even diffuse lighting, the surface extends beyond all four edges of the frame, NO rock specimen NO slab NO object NO edges visible, just continuous black glass surface, high detail macro photography, 1:1 aspect ratio`,
    negative: `rock, slab, specimen, edges, rough edges, 3D object, sphere, ball, curved, round, stone on table, isolated object, ${STD_NEGATIVE}`,
  },

  // ── border-endless-cabals: real bone, not earth ──
  {
    name: 'border-endless-cabals',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Extreme macro close-up of real human skull bone surface texture filling entire frame, seamless tileable texture, top-down flat view, calcium white with slight yellowing from age, visible bone porosity and cranial suture lines, smooth dense cortical bone surface with fine pores, museum quality skeletal specimen, the texture of actual bone material not soil or earth, ivory-white to pale yellow color palette, even studio lighting, high detail macro photography, 1:1 aspect ratio`,
    negative: `earth, mud, soil, dirt, clay, cracked ground, dried lake, desert, sand, tan, brown ground, whole skull, eye socket, teeth, jaw, ${STD_NEGATIVE}`,
  },

  // ── ui-button-cardstock-pressed: fill entire frame ──
  {
    name: 'ui-button-cardstock-pressed',
    width: 512, height: 128,
    xcodeFolder: 'UIComponents',
    prompt: `Top-down close-up photograph of a single rectangular piece of thick cream cardstock paper that fills the ENTIRE frame edge to edge, the paper surface has a subtle pressed/depressed concave impression across its center, slightly darker shadow along the top edge, slightly lighter highlight along the bottom edge suggesting the surface is pressed inward, visible paper fiber texture, warm cream-white matte paper, the cardstock fills the entire image with no background visible, high detail macro photography`,
    negative: `multiple, grid, tiles, repeating, 3D button floating, small button, background visible, border, margin, digital, glossy, plastic, web button, ${STD_NEGATIVE}`,
  },

  // ── tex-cardstock-grain: much more visible grain (low priority) ──
  {
    name: 'tex-cardstock-grain',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Extreme macro close-up of rough handmade cotton rag paper surface, seamless tileable texture, individual paper fibers clearly visible like tiny threads, pronounced rough tactile texture, thick 300gsm artisan paper with visible pulp fibers, off-white with warm cream tone, the paper grain and fiber structure is the main subject, looks like you could feel the rough fibers if you touched it, high magnification macro photography filling entire frame, 1:1 aspect ratio`,
    negative: `smooth, glossy, shiny, uniform, featureless, flat, clean, commercial paper, printer paper, ${STD_NEGATIVE}`,
  },
];

// ── fal.ai API caller ───────────────────────────────────────────────

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

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

// ── Luminance-to-alpha conversion (for fog textures) ────────────────
// Takes a black-background image and converts brightness to alpha
// White fog = opaque, black background = transparent
// Then tints the RGB to white so the fog overlays cleanly

async function luminanceToAlpha(inputBuffer, width, height) {
  const pipeline = sharp(inputBuffer).resize(width, height, { fit: 'cover' });

  // First, boost contrast to make the fog pop more
  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    // Compute luminance
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    // Apply a gamma curve to boost mid-tones (make fog more visible)
    // and crush blacks harder (make background more transparent)
    const gamma = 0.7;
    const adjusted = Math.round(255 * Math.pow(lum / 255, gamma));

    // Set alpha from adjusted luminance
    pixels[i + 3] = adjusted;

    // Tint the visible part: give it a slight sickly green-white tint for spectral feel
    // White base with very subtle green shift
    pixels[i] = 240;     // R
    pixels[i + 1] = 255;  // G (slightly stronger)
    pixels[i + 2] = 245;  // B
  }

  return sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

// ── Generate a single texture ───────────────────────────────────────

async function generateTexture(texture) {
  const outputPath = join(REGEN_DIR, `${texture.name}-iter2.png`);
  const finalPath = join(REGEN_DIR, `${texture.name}-final.png`);

  // Budget check
  if (totalCost + COST_PER_GEN > BUDGET_LIMIT) {
    console.log(`  ABORT: Budget limit ($${BUDGET_LIMIT.toFixed(2)}) would be exceeded`);
    failures.push({ name: texture.name, error: 'Budget limit reached' });
    return null;
  }

  console.log(`  Generating: ${texture.name} (${texture.width}x${texture.height}, iteration 2)...`);

  const body = {
    prompt: texture.prompt + `. Avoid: ${texture.negative || STD_NEGATIVE}`,
    image_size: { width: texture.width, height: texture.height },
    num_inference_steps: 40,
    guidance_scale: 7.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  try {
    const result = await callFal(body);
    if (!result.images?.[0]?.url) throw new Error('No image URL in response');

    const url = result.images[0].url;
    console.log(`    Generated (seed: ${result.seed || 'unknown'})`);

    const rawBuffer = await downloadImage(url);

    // Save raw gen for inspection
    writeFileSync(outputPath, rawBuffer);
    console.log(`    Raw saved: ${outputPath}`);

    // Process based on type
    let processedBuffer;
    if (texture.luminanceAlpha) {
      console.log(`    Applying luminance-to-alpha conversion...`);
      processedBuffer = await luminanceToAlpha(rawBuffer, texture.width, texture.height);
    } else {
      // Normal: resize + sharpen
      processedBuffer = await sharp(rawBuffer)
        .resize(texture.width, texture.height, { fit: 'cover' })
        .sharpen({ sigma: 0.5 })
        .png({ quality: 90 })
        .toBuffer();
    }

    writeFileSync(finalPath, processedBuffer);
    console.log(`    Final saved: ${finalPath} (${(processedBuffer.length / 1024).toFixed(0)}KB)`);

    totalCost += COST_PER_GEN;
    totalGenerated++;

    return { outputPath, finalPath, buffer: processedBuffer };
  } catch (err) {
    console.error(`    ERROR: ${err.message}`);
    failures.push({ name: texture.name, error: err.message });
    return null;
  }
}

// ── Install to Xcode ────────────────────────────────────────────────

function installToXcode(imageName, sourceBuffer, targetSubfolder) {
  const groupDir = join(ASSETS_DIR, targetSubfolder);
  mkdirSync(groupDir, { recursive: true });

  const groupContents = join(groupDir, 'Contents.json');
  if (!existsSync(groupContents)) {
    writeFileSync(groupContents, JSON.stringify({
      info: { author: 'xcode', version: 1 }
    }, null, 2));
  }

  const imagesetDir = join(groupDir, `${imageName}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  const destFilename = `${imageName}.png`;
  writeFileSync(join(imagesetDir, destFilename), sourceBuffer);

  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify({
    images: [
      { filename: destFilename, idiom: 'universal', scale: '1x' },
      { idiom: 'universal', scale: '2x' },
      { idiom: 'universal', scale: '3x' },
    ],
    info: { author: 'xcode', version: 1 },
  }, null, 2));

  console.log(`    Installed: ${imageName} -> Assets.xcassets/${targetSubfolder}/`);
}

function copyToMainPreview(textureName) {
  const finalPath = join(REGEN_DIR, `${textureName}-final.png`);
  const mainPath = join(PREVIEW_DIR, `${textureName}.png`);
  if (existsSync(finalPath)) {
    writeFileSync(mainPath, readFileSync(finalPath));
    console.log(`    Copied to main preview: ${mainPath}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const doInstall = args.includes('--install');

  console.log('====================================================================');
  console.log('  Chaos Creatures - Iteration 2 Regen (7 failed textures)');
  console.log('====================================================================');
  console.log(`Budget remaining: $${BUDGET_LIMIT.toFixed(2)} ($${COST_PER_GEN}/gen)`);
  console.log(`Estimated cost: $${(ITER2_TEXTURES.length * COST_PER_GEN).toFixed(2)}`);
  console.log(`Textures: ${ITER2_TEXTURES.length}\n`);

  for (const texture of ITER2_TEXTURES) {
    const result = await generateTexture(texture);

    if (result && doInstall) {
      copyToMainPreview(texture.name);
      installToXcode(texture.name, result.buffer, texture.xcodeFolder);
    }

    if (result) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Summary
  console.log('\n====================================================================');
  console.log('  ITERATION 2 COMPLETE');
  console.log('====================================================================');
  console.log(`  Generated: ${totalGenerated}`);
  console.log(`  Failed:    ${failures.length}`);
  console.log(`  Cost:      $${totalCost.toFixed(2)}`);
  console.log(`  Budget remaining: $${(BUDGET_LIMIT - totalCost).toFixed(2)}`);

  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) console.log(`    - ${f.name}: ${f.error}`);
  }

  // Total cost across both iterations
  console.log(`\n  Total spend (iter1 + iter2): $${(0.52 + totalCost).toFixed(2)} of $2.00 cap`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

#!/usr/bin/env node
// generate-wax-seals.mjs — Generate 5 faction-specific wax-seal stat container assets
// Pipeline: node-canvas base shapes + fal.ai painterly textures + ImageMagick compositing
// Produces raised, dimensional wax-seal tokens with faction-specific shapes and materials.
// Budget: ~$0.20 (5 images x ~$0.04 each)
// Usage: node scripts/generate-wax-seals.mjs [--skip-fal] [--install]

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync, readFileSync, existsSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ── Load environment ────────────────────────────────────────────────
function loadEnv() {
  // Try root .env first, then game-server .env
  const envPaths = [
    resolve(PROJECT_ROOT, '.env'),
    resolve(PROJECT_ROOT, 'packages/game-server/.env'),
  ];
  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue;
    const envText = readFileSync(envPath, 'utf-8');
    for (const line of envText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
  return process.env.FAL_KEY || process.env.FAL_AI_KEY;
}

const FAL_KEY = loadEnv();

// ── Paths ───────────────────────────────────────────────────────────
const MASK_DIR = join(PROJECT_ROOT, 'scripts/output/seal-masks');
const TEXTURE_DIR = join(PROJECT_ROOT, 'scripts/output/seal-textures');
const FINAL_DIR = join(PROJECT_ROOT, 'scripts/output/seal-final');
const ASSETS_DIR = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/StatIcons');

mkdirSync(MASK_DIR, { recursive: true });
mkdirSync(TEXTURE_DIR, { recursive: true });
mkdirSync(FINAL_DIR, { recursive: true });

// ── Budget tracking ─────────────────────────────────────────────────
const COST_PER_GEN = 0.04;
const BUDGET_LIMIT = 3.0;
let totalCost = 0;
let totalGenerated = 0;

// ── Faction Definitions ─────────────────────────────────────────────
const FACTIONS = [
  {
    id: 'ironwright',
    shape: 'hexagonal',
    assetName: 'stat-seal-ironwright',
    colors: { primary: '#6B7B8D', accent: '#3B82F6' },
    prompt: 'Close-up macro photograph of a pressed industrial steel wax seal on parchment, brushed gunmetal steel surface with subtle reactor blue iridescent sheen, exposed rivet detail at edges, dramatic top-left lighting revealing hammered metalwork texture, isolated on dark background, studio photography, 8k detail. Avoid: text, watermark, letters, words, fingers, hands, tools, frame, border',
  },
  {
    id: 'fey',
    shape: 'leaf',
    assetName: 'stat-seal-fey',
    colors: { primary: '#065F46', accent: '#D4AF37' },
    prompt: 'Close-up macro photograph of an ancient forest resin wax seal on parchment, deep emerald green amber with trapped golden particles like bioluminescent spores, organic flowing surface with tiny vine impressions, warm dappled side lighting, isolated on dark background, studio photography, 8k detail. Avoid: text, watermark, letters, words, fingers, hands, tools, frame, border',
  },
  {
    id: 'demonic',
    shape: 'jagged-shard',
    assetName: 'stat-seal-demonic',
    colors: { primary: '#1F1F1F', accent: '#DC2626' },
    prompt: 'Close-up macro photograph of a volcanic obsidian wax seal on scorched parchment, jet black cracked glass surface with glowing orange-red magma veins in the cracks, aggressive jagged texture, harsh dramatic underlighting revealing molten heat, isolated on dark background, studio photography, 8k detail. Avoid: text, watermark, letters, words, fingers, hands, tools, frame, border',
  },
  {
    id: 'celestial',
    shape: 'shield',
    assetName: 'stat-seal-celestial',
    colors: { primary: '#D4AF37', accent: '#3B82F6' },
    prompt: 'Close-up macro photograph of a gold leaf wax seal on illuminated parchment, pure hammered gold surface with ivory white accent details, cathedral-inspired impressed pattern, warm divine golden light from above, isolated on dark background, studio photography, 8k detail. Avoid: text, watermark, letters, words, fingers, hands, tools, frame, border',
  },
  {
    id: 'endless',
    shape: 'skull',
    assetName: 'stat-seal-endless',
    colors: { primary: '#D6D3D1', accent: '#2DD4BF' },
    prompt: 'Close-up macro photograph of an ancient bone and ash wax seal on yellowed parchment, aged cracked bone surface with necrotic teal-green patina in the crevices, phylactery-style markings, cold blue-green side lighting, isolated on dark background, studio photography, 8k detail. Avoid: text, watermark, letters, words, fingers, hands, tools, frame, border',
  },
];

// ==========================================================================
// STEP 1: Node-Canvas Base Shape Masks (512x512, white on transparent)
// ==========================================================================

function drawHexagonal() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;
  const radius = 210; // Leave margin for emboss effects
  const sides = 6;

  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();

  return canvas;
}

function drawLeaf() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;

  // Draw a leaf/seed-pod shape using bezier curves
  ctx.beginPath();
  // Start at top (stem attachment)
  ctx.moveTo(cx, cy - 220);
  // Right side curves outward
  ctx.bezierCurveTo(cx + 60, cy - 200, cx + 170, cy - 140, cx + 190, cy - 40);
  // Right widest point curves down
  ctx.bezierCurveTo(cx + 200, cy + 40, cx + 160, cy + 130, cx + 100, cy + 180);
  // Bottom right curves to tip
  ctx.bezierCurveTo(cx + 50, cy + 210, cx + 20, cy + 225, cx, cy + 230);
  // Bottom left mirrors
  ctx.bezierCurveTo(cx - 20, cy + 225, cx - 50, cy + 210, cx - 100, cy + 180);
  // Left side
  ctx.bezierCurveTo(cx - 160, cy + 130, cx - 200, cy + 40, cx - 190, cy - 40);
  // Back to top
  ctx.bezierCurveTo(cx - 170, cy - 140, cx - 60, cy - 200, cx, cy - 220);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();

  return canvas;
}

function drawJaggedShard() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;

  // Irregular jagged polygon with broken, angular edges
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 210);
  ctx.lineTo(cx + 80, cy - 185);
  ctx.lineTo(cx + 140, cy - 170);
  ctx.lineTo(cx + 180, cy - 120);
  ctx.lineTo(cx + 160, cy - 80);  // jagged notch
  ctx.lineTo(cx + 200, cy - 30);
  ctx.lineTo(cx + 185, cy + 20);
  ctx.lineTo(cx + 195, cy + 80);  // jagged protrusion
  ctx.lineTo(cx + 160, cy + 130);
  ctx.lineTo(cx + 120, cy + 170);
  ctx.lineTo(cx + 60, cy + 195);
  ctx.lineTo(cx + 20, cy + 210);
  ctx.lineTo(cx - 30, cy + 200);
  ctx.lineTo(cx - 90, cy + 190);
  ctx.lineTo(cx - 140, cy + 150);
  ctx.lineTo(cx - 170, cy + 100);
  ctx.lineTo(cx - 190, cy + 40);  // jagged edge
  ctx.lineTo(cx - 175, cy - 10);  // notch
  ctx.lineTo(cx - 200, cy - 60);
  ctx.lineTo(cx - 180, cy - 110);
  ctx.lineTo(cx - 150, cy - 155);
  ctx.lineTo(cx - 100, cy - 180);
  ctx.lineTo(cx - 50, cy - 200);
  ctx.lineTo(cx - 20, cy - 215);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();

  return canvas;
}

function drawShield() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;

  // Classic heraldic shield shape
  ctx.beginPath();
  // Top edge with slight ornamental curve
  ctx.moveTo(cx, cy - 210);
  // Top-right curve
  ctx.bezierCurveTo(cx + 40, cy - 215, cx + 100, cy - 210, cx + 150, cy - 195);
  // Right shoulder
  ctx.lineTo(cx + 195, cy - 170);
  // Right side, slightly curved inward
  ctx.bezierCurveTo(cx + 205, cy - 130, cx + 205, cy - 50, cx + 195, cy + 10);
  // Right lower, curves toward bottom point
  ctx.bezierCurveTo(cx + 180, cy + 80, cx + 130, cy + 150, cx + 60, cy + 195);
  // Bottom point
  ctx.lineTo(cx, cy + 220);
  // Left lower
  ctx.lineTo(cx - 60, cy + 195);
  ctx.bezierCurveTo(cx - 130, cy + 150, cx - 180, cy + 80, cx - 195, cy + 10);
  // Left side
  ctx.bezierCurveTo(cx - 205, cy - 50, cx - 205, cy - 130, cx - 195, cy - 170);
  // Left shoulder
  ctx.lineTo(cx - 150, cy - 195);
  // Top-left curve
  ctx.bezierCurveTo(cx - 100, cy - 210, cx - 40, cy - 215, cx, cy - 210);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();

  return canvas;
}

function drawSkull() {
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;

  // Simplified skull front-view, bold and recognizable at small sizes
  ctx.beginPath();

  // Cranium - wide oval top
  ctx.moveTo(cx, cy - 210);
  // Right cranium
  ctx.bezierCurveTo(cx + 80, cy - 215, cx + 170, cy - 180, cx + 195, cy - 100);
  // Right temple
  ctx.bezierCurveTo(cx + 210, cy - 40, cx + 200, cy + 20, cx + 180, cy + 60);
  // Right cheekbone
  ctx.bezierCurveTo(cx + 165, cy + 85, cx + 150, cy + 100, cx + 130, cy + 110);
  // Right jaw angle
  ctx.lineTo(cx + 110, cy + 140);
  // Right jaw
  ctx.bezierCurveTo(cx + 100, cy + 160, cx + 80, cy + 180, cx + 60, cy + 190);
  // Chin
  ctx.bezierCurveTo(cx + 30, cy + 205, cx + 10, cy + 210, cx, cy + 210);
  // Left chin
  ctx.bezierCurveTo(cx - 10, cy + 210, cx - 30, cy + 205, cx - 60, cy + 190);
  // Left jaw
  ctx.bezierCurveTo(cx - 80, cy + 180, cx - 100, cy + 160, cx - 110, cy + 140);
  // Left jaw angle
  ctx.lineTo(cx - 130, cy + 110);
  // Left cheekbone
  ctx.bezierCurveTo(cx - 150, cy + 100, cx - 165, cy + 85, cx - 180, cy + 60);
  // Left temple
  ctx.bezierCurveTo(cx - 200, cy + 20, cx - 210, cy - 40, cx - 195, cy - 100);
  // Left cranium
  ctx.bezierCurveTo(cx - 170, cy - 180, cx - 80, cy - 215, cx, cy - 210);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();

  // Cut out eye sockets (draw black / transparent holes)
  ctx.globalCompositeOperation = 'destination-out';

  // Left eye socket - angular
  ctx.beginPath();
  ctx.moveTo(cx - 90, cy - 60);
  ctx.lineTo(cx - 40, cy - 75);
  ctx.lineTo(cx - 20, cy - 40);
  ctx.lineTo(cx - 35, cy - 10);
  ctx.lineTo(cx - 85, cy - 15);
  ctx.closePath();
  ctx.fill();

  // Right eye socket - angular
  ctx.beginPath();
  ctx.moveTo(cx + 90, cy - 60);
  ctx.lineTo(cx + 40, cy - 75);
  ctx.lineTo(cx + 20, cy - 40);
  ctx.lineTo(cx + 35, cy - 10);
  ctx.lineTo(cx + 85, cy - 15);
  ctx.closePath();
  ctx.fill();

  // Nose hole - small inverted triangle
  ctx.beginPath();
  ctx.moveTo(cx, cy + 20);
  ctx.lineTo(cx + 25, cy + 60);
  ctx.lineTo(cx - 25, cy + 60);
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}

const SHAPE_DRAWERS = {
  'hexagonal': drawHexagonal,
  'leaf': drawLeaf,
  'jagged-shard': drawJaggedShard,
  'shield': drawShield,
  'skull': drawSkull,
};

// ==========================================================================
// STEP 2: fal.ai Painterly Texture Generation
// ==========================================================================

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

async function generateTexture(faction) {
  const texturePath = join(TEXTURE_DIR, `seal-texture-${faction.id}.png`);

  // Skip if already generated
  if (existsSync(texturePath)) {
    console.log(`  SKIP: seal-texture-${faction.id}.png already exists`);
    return texturePath;
  }

  // Budget check
  if (totalCost + COST_PER_GEN > BUDGET_LIMIT) {
    throw new Error(`Budget limit ($${BUDGET_LIMIT}) would be exceeded`);
  }

  console.log(`  Generating texture for ${faction.id}...`);

  const body = {
    prompt: faction.prompt,
    image_size: { width: 512, height: 512 },
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  const result = await callFal(body);
  if (!result.images?.[0]?.url) throw new Error('No image URL in response');

  const url = result.images[0].url;
  console.log(`    Generated (seed: ${result.seed || 'unknown'})`);

  const rawBuffer = await downloadImage(url);
  writeFileSync(texturePath, rawBuffer);
  console.log(`    Saved: ${(rawBuffer.length / 1024).toFixed(0)}KB`);

  totalCost += COST_PER_GEN;
  totalGenerated++;

  return texturePath;
}

// ==========================================================================
// STEP 3: ImageMagick Compositing Pipeline
// ==========================================================================

function compositeWaxSeal(faction, maskPath, texturePath) {
  const shapedPath = join(FINAL_DIR, `${faction.assetName}-shaped.png`);
  const coloredPath = join(FINAL_DIR, `${faction.assetName}-colored.png`);
  const embossedPath = join(FINAL_DIR, `${faction.assetName}-embossed.png`);
  const highlightedPath = join(FINAL_DIR, `${faction.assetName}-highlighted.png`);

  console.log(`  Compositing ${faction.id}...`);

  // Step 1: Cut texture into faction shape using mask
  execSync(`magick "${texturePath}" "${maskPath}" -alpha Off -compose CopyOpacity -composite "${shapedPath}"`, { stdio: 'pipe' });
  console.log(`    Shape mask applied`);

  // Step 2: Color-tint the texture toward the faction palette (25% colorize)
  const { primary } = faction.colors;
  execSync(`magick "${shapedPath}" \\( +clone -fill "${primary}" -colorize 25% \\) -compose Over -composite "${coloredPath}"`, { stdio: 'pipe' });
  console.log(`    Color tint applied (${primary})`);

  // Step 3: Emboss for raised 3D wax-seal effect
  // CRITICAL: Preserve alpha by extracting it, applying emboss only to RGB, then restoring alpha
  // The shade operator on the alpha-extracted channel produces directional lighting;
  // HardLight compositing onto the RGB creates the depth illusion.
  execSync([
    `magick "${coloredPath}"`,
    `\\( +clone -alpha extract \\)`,
    `\\( -clone 0 -alpha off \\( +clone -shade 135x30 -normalize \\) -compose HardLight -composite \\)`,
    `-delete 0 +swap -alpha off -compose CopyOpacity -composite`,
    `"${embossedPath}"`,
  ].join(' '), { stdio: 'pipe' });
  console.log(`    Emboss applied (shade 135x30, alpha-preserved)`);

  // Step 4: Soft top-lit highlight for additional dimensionality
  // Uses SoftLight blend (not Multiply which over-darkens) to add subtle top-down lighting
  execSync([
    `magick "${embossedPath}"`,
    `\\( +clone -alpha extract \\)`,
    `\\( -clone 0 -alpha off \\( +clone -shade 135x45 -normalize -level 40%,100% \\) -compose SoftLight -composite \\)`,
    `-delete 0 +swap -alpha off -compose CopyOpacity -composite`,
    `"${highlightedPath}"`,
  ].join(' '), { stdio: 'pipe' });
  console.log(`    Top-lit highlight applied (SoftLight, alpha-preserved)`);

  // Step 5: Generate 1x, 2x, 3x sizes from the highlighted composite
  const final1x = join(FINAL_DIR, `${faction.assetName}.png`);
  const final2x = join(FINAL_DIR, `${faction.assetName}@2x.png`);
  const final3x = join(FINAL_DIR, `${faction.assetName}@3x.png`);

  execSync(`magick "${highlightedPath}" -resize 128x128 "${final1x}"`, { stdio: 'pipe' });
  execSync(`magick "${highlightedPath}" -resize 256x256 "${final2x}"`, { stdio: 'pipe' });
  execSync(`magick "${highlightedPath}" -resize 384x384 "${final3x}"`, { stdio: 'pipe' });
  console.log(`    Resized to 128/256/384px`);

  // Clean up intermediate files
  for (const p of [shapedPath, coloredPath, embossedPath, highlightedPath]) {
    if (existsSync(p) && p !== final1x && p !== final2x && p !== final3x) {
      try { execSync(`rm "${p}"`, { stdio: 'pipe' }); } catch (e) { /* ignore */ }
    }
  }

  return { final1x, final2x, final3x };
}

// ==========================================================================
// STEP 4: Install to Xcode Asset Catalog
// ==========================================================================

function installToXcode(faction, paths) {
  const imagesetDir = join(ASSETS_DIR, `${faction.assetName}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  // Ensure parent StatIcons Contents.json exists
  const catContents = join(ASSETS_DIR, 'Contents.json');
  if (!existsSync(catContents)) {
    writeFileSync(catContents, JSON.stringify({
      info: { author: 'xcode', version: 1 },
      properties: { 'provides-namespace': true },
    }, null, 2));
  }

  // Copy image files
  copyFileSync(paths.final1x, join(imagesetDir, `${faction.assetName}.png`));
  copyFileSync(paths.final2x, join(imagesetDir, `${faction.assetName}@2x.png`));
  copyFileSync(paths.final3x, join(imagesetDir, `${faction.assetName}@3x.png`));

  // Write Contents.json
  writeFileSync(join(imagesetDir, 'Contents.json'), JSON.stringify({
    images: [
      { filename: `${faction.assetName}.png`, idiom: 'universal', scale: '1x' },
      { filename: `${faction.assetName}@2x.png`, idiom: 'universal', scale: '2x' },
      { filename: `${faction.assetName}@3x.png`, idiom: 'universal', scale: '3x' },
    ],
    info: { author: 'xcode', version: 1 },
  }, null, 2));

  console.log(`    Installed to Assets.xcassets/StatIcons/${faction.assetName}.imageset/`);
}

// ==========================================================================
// MAIN
// ==========================================================================

async function main() {
  const args = process.argv.slice(2);
  const skipFal = args.includes('--skip-fal');
  const doInstall = args.includes('--install');

  console.log('===================================================================');
  console.log('  Chaos Creatures -- Wax-Seal Stat Container Generator');
  console.log('  5 faction seals: node-canvas + fal.ai + ImageMagick');
  console.log('===================================================================');
  console.log(`  Mask dir:    ${MASK_DIR}`);
  console.log(`  Texture dir: ${TEXTURE_DIR}`);
  console.log(`  Final dir:   ${FINAL_DIR}`);
  if (skipFal) console.log('  MODE: Skip fal.ai (use existing textures)');
  if (doInstall) console.log('  MODE: Install to Xcode Assets');
  if (!FAL_KEY && !skipFal) {
    console.error('\n  ERROR: No FAL_KEY found in .env. Use --skip-fal to skip texture generation.');
    process.exit(1);
  }
  console.log('');

  // ── Phase 1: Generate shape masks ──────────────────────────────
  console.log('Phase 1: Generating shape masks (node-canvas)...');
  const maskPaths = {};
  for (const faction of FACTIONS) {
    const maskFile = join(MASK_DIR, `seal-mask-${faction.shape}.png`);
    if (existsSync(maskFile)) {
      console.log(`  SKIP: seal-mask-${faction.shape}.png already exists`);
    } else {
      const drawer = SHAPE_DRAWERS[faction.shape];
      const canvas = drawer();
      const buffer = canvas.toBuffer('image/png');
      writeFileSync(maskFile, buffer);
      console.log(`  Created: seal-mask-${faction.shape}.png (${(buffer.length / 1024).toFixed(0)}KB)`);
    }
    maskPaths[faction.id] = maskFile;
  }
  console.log('  All 5 shape masks ready.\n');

  // ── Phase 2: Generate textures via fal.ai ─────────────────────
  const texturePaths = {};
  if (skipFal) {
    console.log('Phase 2: SKIPPED (--skip-fal flag)');
    for (const faction of FACTIONS) {
      const texturePath = join(TEXTURE_DIR, `seal-texture-${faction.id}.png`);
      if (!existsSync(texturePath)) {
        console.error(`  ERROR: Missing texture: ${texturePath}`);
        console.error('  Cannot composite without textures. Remove --skip-fal to generate them.');
        process.exit(1);
      }
      texturePaths[faction.id] = texturePath;
    }
    console.log('  Using existing textures from previous run.\n');
  } else {
    console.log('Phase 2: Generating painterly textures (fal.ai FLUX Dev)...');
    console.log(`  Budget: $${BUDGET_LIMIT} ($${COST_PER_GEN}/gen, ${FACTIONS.length} images)\n`);
    for (const faction of FACTIONS) {
      try {
        texturePaths[faction.id] = await generateTexture(faction);
        // Small delay between generations
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`  ERROR generating ${faction.id}: ${err.message}`);
        process.exit(1);
      }
    }
    console.log(`\n  Textures complete. Cost so far: $${totalCost.toFixed(2)}\n`);
  }

  // ── Phase 3: ImageMagick compositing ──────────────────────────
  console.log('Phase 3: Compositing wax seals (ImageMagick)...');
  const finalPaths = {};
  for (const faction of FACTIONS) {
    const paths = compositeWaxSeal(faction, maskPaths[faction.id], texturePaths[faction.id]);
    finalPaths[faction.id] = paths;
    console.log(`  ${faction.id}: DONE`);
  }
  console.log('  All 5 seals composited.\n');

  // ── Phase 4: Install to Xcode ─────────────────────────────────
  if (doInstall) {
    console.log('Phase 4: Installing to Xcode asset catalog...');
    for (const faction of FACTIONS) {
      installToXcode(faction, finalPaths[faction.id]);
    }
    console.log('  All 5 seals installed.\n');
  } else {
    console.log('Phase 4: SKIPPED (use --install to install to Xcode)\n');
  }

  // ── Summary ───────────────────────────────────────────────────
  console.log('===================================================================');
  console.log('  SUMMARY');
  console.log('===================================================================');
  console.log(`  Masks generated: ${Object.keys(maskPaths).length}`);
  console.log(`  Textures generated: ${totalGenerated} (${Object.keys(texturePaths).length} total)`);
  console.log(`  Seals composited: ${Object.keys(finalPaths).length}`);
  console.log(`  Total cost: $${totalCost.toFixed(2)}`);
  if (doInstall) {
    console.log(`  Assets installed to: Assets.xcassets/StatIcons/`);
  }
  console.log('===================================================================');
}

main().catch(err => {
  console.error(`\nFATAL: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

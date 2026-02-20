#!/usr/bin/env node
// regen-failed-textures.mjs — Regenerate 14 failed textures from Wave 1A with improved prompts
// Uses fal.ai FLUX Dev endpoint (~$0.04 per generation)
// Budget: $2.00 hard cap for this entire regen wave
// Usage: node scripts/regen-failed-textures.mjs [--install] [--iteration <n>]

import { readFileSync, mkdirSync, writeFileSync, existsSync, unlinkSync } from 'fs';
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
mkdirSync(PREVIEW_DIR, { recursive: true });
mkdirSync(REGEN_DIR, { recursive: true });

// ── Budget tracking ─────────────────────────────────────────────────
const COST_PER_GEN = 0.04;
const BUDGET_LIMIT = 2.00;
let totalCost = 0;
let totalGenerated = 0;
let failures = [];
let passes = [];

// ── Standard negative prompts ───────────────────────────────────────
const STD_NEGATIVE = 'text, watermark, objects, items on surface, hands, tools, strong directional light, vignette, border, frame, uneven lighting, color cast, gradient';

// ── The 14 failed textures with IMPROVED prompts ────────────────────

const REGEN_TEXTURES = [
  // ═══ Category 1: Transparency Conversion Failures (3) ═══
  // Fix: Generate on GREEN (#00FF00) chroma key background, then ImageMagick green-to-transparent
  {
    name: 'border-endless-spectres',
    category: 'transparency-fix',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    chromaKey: true, // Use green screen approach
    prompt: `Wisps of white and pale gray spectral fog tendrils on a solid bright green chroma key background (#00FF00), ethereal smoke wisps, ghostly translucent mist floating, cold sickly green-white tinted fog wisps, soft diffused spectral smoke tendrils on BRIGHT GREEN background, paranormal aesthetic, high detail, 1:1 aspect ratio. The background MUST be solid uniform bright green (#00FF00) like a green screen.`,
    negative: `face, skull, ghost figure, person, dark background, black background, blue background, ${STD_NEGATIVE}`,
  },
  {
    name: 'tp-endless-spectres',
    category: 'transparency-fix',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    chromaKey: true,
    prompt: `Thin horizontal wisps of translucent dark smoke on a solid bright green chroma key background (#00FF00), ethereal spectral fog panel, ghostly gray-white translucent mist, thin wispy smoke tendrils on BRIGHT GREEN background, dark paranormal aesthetic, sickly green tint in fog, high detail, 2:1 aspect ratio. The background MUST be solid uniform bright green (#00FF00) like a green screen.`,
    negative: `face, skull, ghost figure, person, dark background, black background, ${STD_NEGATIVE}`,
  },
  {
    name: 'fx-spectral-fog',
    category: 'transparency-fix',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    chromaKey: true,
    prompt: `Wisps of white and gray spectral fog on solid bright green chroma key background (#00FF00), ethereal smoke tendrils, ghostly translucent swirling mist, soft diffused fog overlay effect, spectral haunting atmosphere, cold sickly green-white tinted fog, paranormal aesthetic, high detail, 1:1 aspect ratio. The background MUST be solid uniform bright green (#00FF00) like a green screen.`,
    negative: `face, skull, ghost figure, person, dark background, black background, ${STD_NEGATIVE}`,
  },

  // ═══ Category 2: Objects in Texture (3) ═══
  {
    name: 'tp-fey-verdant',
    category: 'objects-fix',
    width: 512, height: 256,
    xcodeFolder: 'TextPanels',
    prompt: `Extreme close-up macro photography of aged paper surface with subtle moss green tint, NO objects NO items NO tools ONLY surface texture, seamless tileable texture, top-down flat view, even studio lighting, aged dark cream paper with faint green-brown moss staining soaked into paper fibers, organic handmade paper quality, surface fills entire frame, high detail macro photography style`,
    negative: `bowl, shears, tools, scissors, glass, objects, items, utensils, containers, products, bright green, leaves, plants, flowers, ${STD_NEGATIVE}`,
  },
  {
    name: 'metal-iron',
    category: 'objects-fix',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Flat iron metal plate surface only, extreme close-up macro photography of flat iron sheet, NO objects NO gates NO fences NO decorative elements, seamless tileable texture, top-down flat view, even studio lighting, deep dark gray-black iron, subtle forge hammer marks on flat surface, matte dark finish, industrial medieval quality, surface fills entire frame, high detail macro photography style, 1:1 aspect ratio`,
    negative: `gate, fence, railing, wrought iron object, decorative, ornamental, scrollwork, rust, heavy corrosion, chains, 3D object, ${STD_NEGATIVE}`,
  },
  {
    name: 'metal-obsidian',
    category: 'objects-fix',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Flat obsidian slab surface only, top-down flat view macro photography of polished volcanic glass, NO curved shapes NO spheres NO 3D objects, seamless tileable texture, even studio lighting, deep pure black with subtle glossy depth, natural conchoidal fracture patterns very faintly visible, premium polished stone, surface fills entire frame, completely flat, high detail macro photography style, 1:1 aspect ratio`,
    negative: `sphere, ball, curved, round, 3D shape, bowl, lens, orb, cracks, rough, matte, chips, gray, ${STD_NEGATIVE}`,
  },

  // ═══ Category 3: Wrong Material (4) ═══
  {
    name: 'border-ironwright',
    category: 'wrong-material',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Matte brushed steel metal surface, seamless tileable texture, top-down flat view, completely diffuse even lighting with ZERO specular highlights, fine linear grain marks from industrial brushing, cool gray industrial metal, matte finish, NO mirror reflections, NO bright spots, NO specular hotspots, factory workshop metal panel quality, high detail macro photography style, 1:1 aspect ratio`,
    negative: `shiny, mirror, reflective, bright spot, hotspot, specular, glare, polished, chrome, rust, corrosion, scratches, dents, fingerprints, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-celestial-knights',
    category: 'wrong-material',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Hammered gold metal plate surface, seamless tileable texture, top-down flat view, even studio lighting, subtle hammer dimple texture in warm rich gold metal surface, goldsmith quality craftsmanship, traditional hand-hammered gold sheet, warm deep yellow-gold color, NO craters NO bubbles NO pockmarks, premium jewelry-grade hammered gold, high detail macro photography style, 1:1 aspect ratio`,
    negative: `craters, bubbles, pockmarks, holes, pitted, rough, corroded, coins, jewelry, objects, bright yellow, cheap gold, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-endless-cabals',
    category: 'wrong-material',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Real animal bone surface texture, seamless tileable texture, top-down flat view, even studio lighting, calcium-white yellowed bone material, visible bone grain and marrow texture, aged ossuary quality bone surface, NOT earth NOT mud NOT soil NOT cracked ground, actual skeletal bone material close-up, fused bone suture lines visible, necrotic cold feel, museum specimen quality, high detail macro photography style, 1:1 aspect ratio`,
    negative: `earth, mud, soil, dirt, cracked ground, dried lake bed, desert, clay, skull shape, whole bones, skeleton, flesh, blood, ${STD_NEGATIVE}`,
  },
  {
    name: 'border-fey-verdant',
    category: 'wrong-material',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Smooth polished wood surface with TINY hairline green moss veins threading only in the wood grain lines, seamless tileable texture, top-down flat view, even studio lighting, deep warm brown wood is the DOMINANT surface, emerald green moss is a SUBTLE accent only in grain lines, moss is thin like thread not chunky patches, bioluminescent golden-green hints, wood surface is smooth and polished, NOT chunky moss patches, high detail macro photography style, 1:1 aspect ratio`,
    negative: `chunky moss, thick moss, moss patches, moss clumps, heavy moss coverage, bark, leaves, branches, whole tree, forest scene, lichen, ${STD_NEGATIVE}`,
  },

  // ═══ Category 4: Non-Tileable / Wrong Composition (1) ═══
  {
    name: 'ui-button-cardstock-pressed',
    category: 'composition-fix',
    width: 512, height: 128,
    xcodeFolder: 'UIComponents',
    prompt: `Single embossed cardstock button surface in pressed/depressed state, slightly depressed center with soft shadow around edges suggesting pressed state, cream-white paper material with visible fiber texture, one single rectangular button filling the entire frame, shadow on top edge and highlight on bottom edge, tactile paper craft quality, aged printing press finish, premium matte paper, high detail macro photography style. This is ONE button, NOT a grid, NOT tiles, NOT repeating pattern.`,
    negative: `grid, tiles, bricks, repeating pattern, multiple buttons, tiled, mosaic, text, words, rounded corners, digital, glossy, plastic, 3D button, web button, gradient, ${STD_NEGATIVE}`,
  },

  // ═══ Category 5: Too Light / Wrong Tone (2) ═══
  {
    name: 'bg-dark-parchment',
    category: 'tone-fix',
    width: 1024, height: 1024,
    xcodeFolder: 'UIBackgrounds',
    prompt: `VERY DARK aged parchment paper surface, seamless tileable texture, top-down flat view, even studio lighting, deep brown-black aged antique paper, extremely dark sepia tone that is nearly black, only subtle warm brown tint visible in darkest tones, dark as coffee-stained centuries-old document, NOT light NOT cream NOT bright NOT tan, charred-edge darkness level, high detail macro photography style, 1:1 aspect ratio`,
    negative: `light, bright, cream, white, tan, beige, light brown, warm, cheerful, clean paper, new paper, ${STD_NEGATIVE}`,
  },
  {
    name: 'tex-cardstock-grain',
    category: 'tone-fix',
    width: 512, height: 512,
    xcodeFolder: 'CardTextures',
    prompt: `Extreme close-up macro photography of rough handmade paper surface with very visible paper fiber grain, seamless tileable texture, top-down flat view, even studio lighting, pronounced textile-like weave visible in thick paper, individual paper fibers clearly visible, off-white with STRONG visible fiber texture, rough tactile surface like handmade cotton rag paper, 300gsm thick card stock, CLOSE macro showing individual fibers, high detail macro photography style, 1:1 aspect ratio`,
    negative: `smooth, glossy, shiny, uniform, featureless, text, wrinkles, folds, creases, stains, printed pattern, colored, ${STD_NEGATIVE}`,
  },
];

// ── fal.ai API caller with retry logic ──────────────────────────────

async function callFal(body, endpoint = 'fal-ai/flux/dev') {
  const maxRetries = 3;
  let delay = 3000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`https://fal.run/${endpoint}`, {
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

// ── Download image from URL ─────────────────────────────────────────

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

// ── Post-processing with sharp ──────────────────────────────────────

async function postProcess(inputBuffer, texture) {
  let pipeline = sharp(inputBuffer);

  // Resize to exact target dimensions
  pipeline = pipeline.resize(texture.width, texture.height, { fit: 'cover' });

  // For chroma key textures: save intermediate, then ImageMagick removes green
  if (texture.chromaKey) {
    // Save the resized version first, ImageMagick will handle green removal
    const resizedBuffer = await pipeline.png().toBuffer();
    return resizedBuffer; // Green removal happens in generateTexture
  }

  // Normal textures: subtle sharpening
  pipeline = pipeline.modulate({ brightness: 1.0, saturation: 1.0 });
  pipeline = pipeline.sharpen({ sigma: 0.5 });

  return pipeline.png({ quality: 90 }).toBuffer();
}

// ── Green screen removal with ImageMagick ───────────────────────────

function removeGreenScreen(inputPath, outputPath) {
  // Use ImageMagick to convert green (#00FF00) background to transparency
  // -fuzz 20% allows for slight color variation around the green
  const cmd = `magick "${inputPath}" -fuzz 20% -transparent "#00FF00" "${outputPath}"`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log(`    Green screen removed via ImageMagick`);
    return true;
  } catch (err) {
    console.error(`    ImageMagick error: ${err.message}`);
    return false;
  }
}

// ── Generate a single texture ───────────────────────────────────────

async function generateTexture(texture, iteration = 1) {
  const suffix = iteration > 1 ? `-iter${iteration}` : '';
  const regenPath = join(REGEN_DIR, `${texture.name}${suffix}.png`);
  const finalPath = join(REGEN_DIR, `${texture.name}-final.png`);

  // Budget check
  if (totalCost + COST_PER_GEN > BUDGET_LIMIT) {
    console.log(`  ABORT: Budget limit ($${BUDGET_LIMIT.toFixed(2)}) would be exceeded (spent: $${totalCost.toFixed(2)})`);
    failures.push({ name: texture.name, error: 'Budget limit reached', iteration });
    return null;
  }

  console.log(`  Generating: ${texture.name} (${texture.width}x${texture.height}, iteration ${iteration})...`);

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

    // Download
    const rawBuffer = await downloadImage(url);

    // Post-process (resize + sharpen)
    console.log(`    Post-processing...`);
    const processedBuffer = await postProcess(rawBuffer, texture);

    // Save the regen preview
    writeFileSync(regenPath, processedBuffer);

    // For chroma key textures, run ImageMagick green removal
    if (texture.chromaKey) {
      const success = removeGreenScreen(regenPath, finalPath);
      if (!success) {
        failures.push({ name: texture.name, error: 'ImageMagick green removal failed', iteration });
        totalCost += COST_PER_GEN;
        totalGenerated++;
        return null;
      }
      console.log(`    Final (transparent): ${finalPath}`);
    } else {
      // Copy processed to final
      writeFileSync(finalPath, processedBuffer);
    }

    console.log(`    Preview saved: ${regenPath}`);
    totalCost += COST_PER_GEN;
    totalGenerated++;

    return { regenPath, finalPath, buffer: readFileSync(finalPath) };
  } catch (err) {
    console.error(`    ERROR: ${err.message}`);
    failures.push({ name: texture.name, error: err.message, iteration });
    return null;
  }
}

// ── Install to Xcode Assets.xcassets ────────────────────────────────

function installToXcode(imageName, sourceBuffer, targetSubfolder) {
  const groupDir = join(ASSETS_DIR, targetSubfolder);
  mkdirSync(groupDir, { recursive: true });

  // Create group Contents.json if needed
  const groupContents = join(groupDir, 'Contents.json');
  if (!existsSync(groupContents)) {
    writeFileSync(groupContents, JSON.stringify({
      info: { author: 'xcode', version: 1 }
    }, null, 2));
  }

  // Create imageset directory
  const imagesetDir = join(groupDir, `${imageName}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  // Write image file
  const destFilename = `${imageName}.png`;
  writeFileSync(join(imagesetDir, destFilename), sourceBuffer);

  // Write Contents.json for the imageset
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

// ── Copy final regen to main preview dir (overwrite originals) ──────

function copyToMainPreview(textureName) {
  const finalPath = join(REGEN_DIR, `${textureName}-final.png`);
  const mainPath = join(PREVIEW_DIR, `${textureName}.png`);
  if (existsSync(finalPath)) {
    const buf = readFileSync(finalPath);
    writeFileSync(mainPath, buf);
    console.log(`    Copied to main preview: ${mainPath}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const doInstall = args.includes('--install');

  console.log('====================================================================');
  console.log('  Chaos Creatures - Failed Texture Regeneration (Wave 1A-fix)');
  console.log('  14 textures with improved prompts via fal.ai FLUX Dev');
  console.log('====================================================================');
  console.log(`\nRegen preview dir: ${REGEN_DIR}`);
  console.log(`Budget: $${BUDGET_LIMIT.toFixed(2)} hard cap ($${COST_PER_GEN}/gen)`);
  console.log(`Estimated cost: $${(REGEN_TEXTURES.length * COST_PER_GEN).toFixed(2)} (single pass)`);
  if (doInstall) console.log('Mode: Generate + Install to Xcode Assets');
  console.log(`\nTextures to regenerate: ${REGEN_TEXTURES.length}\n`);

  // Group by category for organized output
  const categories = {};
  for (const tex of REGEN_TEXTURES) {
    if (!categories[tex.category]) categories[tex.category] = [];
    categories[tex.category].push(tex);
  }

  const categoryLabels = {
    'transparency-fix': '1. Transparency Conversion Failures (green screen approach)',
    'objects-fix': '2. Objects in Texture (prompt fixes)',
    'wrong-material': '3. Wrong Material (prompt emphasis)',
    'composition-fix': '4. Non-Tileable / Wrong Composition',
    'tone-fix': '5. Too Light / Wrong Tone',
  };

  for (const [cat, textures] of Object.entries(categories)) {
    console.log(`\n=== ${categoryLabels[cat] || cat} (${textures.length}) ===`);

    for (const texture of textures) {
      const result = await generateTexture(texture, 1);

      if (result && doInstall) {
        // Copy to main preview directory (overwrite original)
        copyToMainPreview(texture.name);
        // Install to Xcode
        installToXcode(texture.name, result.buffer, texture.xcodeFolder);
      }

      // Small delay between generations
      if (result) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n====================================================================');
  console.log('  REGEN COMPLETE');
  console.log('====================================================================');
  console.log(`  Generated: ${totalGenerated} textures`);
  console.log(`  Failed:    ${failures.length}`);
  console.log(`  Total cost: $${totalCost.toFixed(2)}`);
  console.log(`  Budget remaining: $${(BUDGET_LIMIT - totalCost).toFixed(2)}`);

  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    - ${f.name} (iter ${f.iteration}): ${f.error}`);
    }
  }

  if (passes.length > 0) {
    console.log('\n  Passed:');
    for (const p of passes) {
      console.log(`    - ${p}`);
    }
  }

  if (doInstall) {
    console.log(`\n  Assets installed to: ${ASSETS_DIR}`);
  } else {
    console.log(`\n  Previews saved to: ${REGEN_DIR}`);
    console.log('  Run with --install to install to Xcode Assets.xcassets');
  }

  // Write regen manifest
  const manifest = {
    generated_at: new Date().toISOString(),
    wave: '1A-fix',
    total_generated: totalGenerated,
    total_failed: failures.length,
    total_cost: totalCost,
    budget_remaining: BUDGET_LIMIT - totalCost,
    textures: REGEN_TEXTURES.map(t => ({
      name: t.name,
      category: t.category,
      size: `${t.width}x${t.height}`,
      xcodeFolder: t.xcodeFolder,
      chromaKey: t.chromaKey || false,
      status: failures.find(f => f.name === t.name) ? 'failed' : 'success',
    })),
    failures,
  };
  const manifestPath = join(REGEN_DIR, 'regen-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n  Manifest: ${manifestPath}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

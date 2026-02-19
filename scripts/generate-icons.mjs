#!/usr/bin/env node
// generate-icons.mjs — Generate all game icons, emblems, and app icon via fal.ai FLUX Dev
// Saves directly into Xcode Assets.xcassets with proper Contents.json for each imageset.
// Usage: node scripts/generate-icons.mjs

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// Load env from game-server/.env (same pattern as other scripts)
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

const ASSETS_BASE = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');

// ==========================================================================
// Icon definitions
// ==========================================================================

// Shared style fragments
const ICON_STYLE = 'painterly oil painting style, heavy visible brushwork, traditional fantasy RPG game icon, dark moody background, glowing magical energy, high detail, single centered symbol, no text, no letters, no words, no borders, no watermarks, square format';
const EMBLEM_STYLE = 'painterly oil painting style, heavy visible brushwork, fantasy guild crest emblem, dark moody background, ornate heraldic design, high detail, centered composition, no text, no letters, no words, no borders, no watermarks, square format';
const CURRENCY_STYLE = 'painterly oil painting style, heavy visible brushwork, fantasy game currency icon, dark moody background, magical glow, centered composition, no text, no letters, no words, no borders, no watermarks, square format';
const STAT_STYLE = 'painterly oil painting style, heavy visible brushwork, traditional fantasy RPG game icon, dark moody background, no text no letters no words no borders no watermarks, square format, centered composition';

const NEGATIVE_PROMPT =
  'text, words, letters, numbers, watermarks, signatures, logos, borders, frames, NSFW, ' +
  '3d render, CGI, photorealistic, airbrushed, smooth plastic, digital art, vector art, flat design, ' +
  'deviantart, artstation trending, oversaturated, neon glow, stock photo, generic, ' +
  'white background, collage, grid layout, concept art sheet, UI mockup, wireframe';

const ICONS = [
  // --- Keyword Icons (9) — 256x256, transparent bg ---
  {
    name: 'shield',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, a glowing magical shield ward, golden and silver metallic sheen, radiant defensive energy barrier, arcane protective runes etched into the surface, warm golden light emanating outward, classical fantasy RPG shield icon`,
  },
  {
    name: 'lifesteal',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, crimson energy being drained and absorbed, vampiric essence drain, swirling dark red and black blood magic tendrils, sinister life-draining aura, drops of glowing red essence, dark crimson glow, fantasy vampire drain icon`,
  },
  {
    name: 'flying',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, a pair of feathered wings spread wide in flight, ethereal translucent feathers, wind energy swirling around the wings, pale blue and white luminous glow, angelic and majestic, fantasy flight icon`,
  },
  {
    name: 'reach',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, a long ornate spear thrust upward into the sky, extending reach, vertical dynamic composition, the spearhead glowing with enchantment, steel and silver tones, fantasy reach weapon icon`,
  },
  {
    name: 'deathtouch',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, a skull dripping with poisonous venom, sickly green toxic glow, deadly poison drops falling from fanged jaw, necrotic energy, dark and lethal, fantasy poison death icon`,
  },
  {
    name: 'taunt',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, a roaring aggressive face with mouth wide open in challenge, red furious energy radiating outward, provocation and rage, forcing engagement, fiery aggressive aura, fantasy taunt provoke icon`,
  },
  {
    name: 'piercing',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, an arrow or blade piercing straight through a metal shield, penetrating force, sharp edges and shattered armor fragments, the blade glowing with piercing energy, dynamic impact, fantasy armor-piercing icon`,
  },
  {
    name: 'haste',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, a lightning bolt crackling with speed lines and motion blur, electric energy surging forward, streaks of golden-white light trailing behind, dynamic forward momentum, the bolt leaving afterimages, fantasy haste speed icon`,
  },
  {
    name: 'ward',
    category: 'KeywordIcons',
    size: 256,
    prompt: `${ICON_STYLE}, a translucent magical shield barrier with glowing arcane runes floating on its surface, hexagonal energy patterns, pale blue and silver protective light, runes orbiting the barrier, impenetrable magical ward, fantasy ward protection icon`,
  },

  // --- Faction Emblems (5) — 512x512 ---
  {
    name: 'ironwright-emblem',
    category: 'FactionEmblems',
    size: 512,
    prompt: `${EMBLEM_STYLE}, interlocking cold-rolled iron conduits and reactor core forming an industrial mandala pattern, brutalist space-industrial guild crest, cold gunmetal and reactor-orange tones, industrial precision meets brutal scale, reactor exhaust and concrete atmosphere, Ironwright Collective guild seal`,
  },
  {
    name: 'fey-emblem',
    category: 'FactionEmblems',
    size: 512,
    prompt: `${EMBLEM_STYLE}, a crescent moon cradling a great ancient tree with spreading roots, bioluminescent glow, nature and starlight, enchanted forest crest, silver moonlight and deep emerald green, mystical fairy realm heraldry, Fey Courts nature seal`,
  },
  {
    name: 'demonic-emblem',
    category: 'FactionEmblems',
    size: 512,
    prompt: `${EMBLEM_STYLE}, a horned skull wearing an infernal crown, hellfire burning in the eye sockets, bone and obsidian materials, demonic kingdom sigil, deep crimson and charcoal black, menacing and powerful, Demonic Kingdoms infernal seal`,
  },
  {
    name: 'celestial-emblem',
    category: 'FactionEmblems',
    size: 512,
    prompt: `${EMBLEM_STYLE}, a golden sun with radiant wings spreading outward, divine light emanating from the center, sacred geometry halo ring behind, hammered gold and white marble materials, burnished gold and pale rose tones, righteous and commanding, Celestial Crusade divine seal`,
  },
  {
    name: 'endless-emblem',
    category: 'FactionEmblems',
    size: 512,
    prompt: `${EMBLEM_STYLE}, a spectral skull wreathed in swirling purple mist, hollow glowing eye sockets with ghostly teal light, bone and dark crystal materials, necromantic death motif, deep purple and bone white and spectral teal tones, melancholic and inevitable, The Endless death seal`,
  },

  // --- Currency/Shard Icons (4) — 256x256 ---
  {
    name: 'chaos-dust',
    category: 'CurrencyIcons',
    size: 256,
    prompt: `${CURRENCY_STYLE}, swirling purple and blue magical dust particles, crystalline shards floating in a vortex, arcane primary currency, mystical and valuable, shimmering iridescent energy, fantasy chaos dust currency`,
  },
  {
    name: 'order-shards',
    category: 'CurrencyIcons',
    size: 256,
    prompt: `${CURRENCY_STYLE}, crystalline geometric shards arranged in perfect symmetry, blue and white pristine crystal, orderly structured formation, premium valuable feel, cold pure light, fantasy order crystal premium currency`,
  },
  {
    name: 'chaos-shards',
    category: 'CurrencyIcons',
    size: 256,
    prompt: `${CURRENCY_STYLE}, jagged chaotic crystal fragments crackling with unstable energy, red and purple volatile crystals, shattered and asymmetric, dangerous premium feel, wild energy arcing between fragments, fantasy chaos crystal premium currency`,
  },
  {
    name: 'gold',
    category: 'CurrencyIcons',
    size: 256,
    prompt: `${CURRENCY_STYLE}, a stack of ancient gold coins with fantasy emblems stamped on them, warm golden glow, gleaming precious metal, secondary currency, rich and abundant, fantasy gold coin treasure`,
  },

  // --- Stat Icons (3) — 256x256, @2x for Retina card display ---
  {
    name: 'chaos-motes',
    category: 'StatIcons',
    size: 256,
    scaleLabel: '2x',
    filenameSuffix: '@2x',
    prompt: `${STAT_STYLE}, a swirling vortex of multicolored chaotic energy motes, purple red gold and blue magical particles spiraling inward to a bright unstable core, volatile magical energy`,
  },
  {
    name: 'sword-atk',
    category: 'StatIcons',
    size: 256,
    scaleLabel: '2x',
    filenameSuffix: '@2x',
    prompt: `${STAT_STYLE}, a single upright fantasy battle sword, ornate crossguard, glowing warm orange-red magical energy along the blade edge, attack power weapon icon`,
  },
  {
    name: 'heart-hp',
    category: 'StatIcons',
    size: 256,
    scaleLabel: '2x',
    filenameSuffix: '@2x',
    prompt: `${STAT_STYLE}, a stylized heart symbol glowing with green protective energy, organic and warm, health and vitality, subtle magical shimmer`,
  },
];

// App Icon — separate because it has special handling
const APP_ICON = {
  name: 'app-icon',
  size: 1024,
  prompt:
    'Mobile game app icon, a D20 icosahedron die at the center with swirling order energy in blue on one side and chaos energy in red and purple on the other side, dramatic lighting from below, dark background with subtle magical particles, vibrant saturated colors, clean readable composition at small sizes, fantasy card game feel, polished and professional, square format with no transparency, no text, no letters, no words',
};

// ==========================================================================
// fal.ai FLUX Dev call (same pattern as generate-test-cards.mjs)
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

// ==========================================================================
// Asset catalog helpers
// ==========================================================================

function writeImageset(dir, filename, buffer, scale = '1x') {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), buffer);
  writeFileSync(join(dir, 'Contents.json'), JSON.stringify({
    images: [{ filename, idiom: 'universal', scale }],
    info: { author: 'xcode', version: 1 },
  }, null, 2));
}

function writeCategoryContentsJson(categoryDir) {
  const contentsPath = join(categoryDir, 'Contents.json');
  if (!existsSync(contentsPath)) {
    mkdirSync(categoryDir, { recursive: true });
    writeFileSync(contentsPath, JSON.stringify({
      info: { author: 'xcode', version: 1 },
      properties: { 'provides-namespace': true },
    }, null, 2));
  }
}

// ==========================================================================
// Generate a single icon
// ==========================================================================

async function generateIcon(icon) {
  const suffix = icon.filenameSuffix || '';
  const scale = icon.scaleLabel || '1x';
  const pngFilename = `${icon.name}${suffix}.png`;
  const imagesetDir = join(ASSETS_BASE, icon.category, `${icon.name}.imageset`);
  const pngPath = join(imagesetDir, pngFilename);

  // Skip if already generated
  if (existsSync(pngPath)) {
    console.log(`  SKIP: ${icon.name} already exists`);
    return { name: icon.name, success: true, skipped: true };
  }

  console.log(`  Generating: ${icon.name} (${icon.size}x${icon.size})...`);

  const request = {
    prompt: icon.prompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: { width: icon.size, height: icon.size },
    num_inference_steps: 40,
    guidance_scale: 8.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  const result = await callFal(request);

  if (result.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected — regenerate');
  }
  if (!result.images?.[0]?.url) {
    throw new Error('No image URL in fal.ai response');
  }

  const tempUrl = result.images[0].url;
  console.log(`    Generated (seed: ${result.seed}, ${Math.round(result.timings?.inference || 0)}ms)`);

  // Download the image
  const imgResponse = await fetch(tempUrl);
  if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  console.log(`    Downloaded: ${(buffer.length / 1024).toFixed(0)}KB`);

  // Write to Assets.xcassets
  writeCategoryContentsJson(join(ASSETS_BASE, icon.category));
  writeImageset(imagesetDir, pngFilename, buffer, scale);
  console.log(`    Saved: ${icon.category}/${icon.name}.imageset/`);

  return { name: icon.name, success: true, skipped: false, size: buffer.length };
}

// ==========================================================================
// Generate the app icon (special path)
// ==========================================================================

async function generateAppIcon() {
  const appIconDir = join(ASSETS_BASE, 'AppIcon.appiconset');
  const pngPath = join(appIconDir, 'app-icon.png');

  if (existsSync(pngPath)) {
    console.log(`  SKIP: app-icon already exists`);
    return { name: 'app-icon', success: true, skipped: true };
  }

  console.log(`  Generating: app-icon (1024x1024)...`);

  const request = {
    prompt: APP_ICON.prompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: { width: 1024, height: 1024 },
    num_inference_steps: 40,
    guidance_scale: 8.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  const result = await callFal(request);

  if (result.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected — regenerate');
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

  // Write to AppIcon.appiconset with the special Contents.json format
  mkdirSync(appIconDir, { recursive: true });
  writeFileSync(pngPath, buffer);
  writeFileSync(join(appIconDir, 'Contents.json'), JSON.stringify({
    images: [{ filename: 'app-icon.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
    info: { author: 'xcode', version: 1 },
  }, null, 2));
  console.log(`    Saved: AppIcon.appiconset/app-icon.png`);

  return { name: 'app-icon', success: true, skipped: false, size: buffer.length };
}

// ==========================================================================
// Main
// ==========================================================================

async function main() {
  console.log('=== Chaos Creatures — Icon & Emblem Generation ===');
  console.log(`Generating ${ICONS.length} icons + 1 app icon (${ICONS.length + 1} total)\n`);

  const results = [];
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  // Generate all standard icons
  for (const icon of ICONS) {
    try {
      const result = await generateIcon(icon);
      results.push(result);
      if (result.skipped) skipped++; else generated++;
      // Rate limit: 1s between calls
      if (!result.skipped) await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`    FAILED: ${err.message}`);
      results.push({ name: icon.name, success: false, error: err.message });
      failed++;
      // Still wait before next call
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Generate app icon
  try {
    const result = await generateAppIcon();
    results.push(result);
    if (result.skipped) skipped++; else generated++;
  } catch (err) {
    console.error(`    FAILED: ${err.message}`);
    results.push({ name: 'app-icon', success: false, error: err.message });
    failed++;
  }

  // Summary
  console.log('\n=== RESULTS ===');
  console.log('-'.repeat(60));
  for (const r of results) {
    const status = r.success ? (r.skipped ? 'SKIP' : 'OK') : 'FAIL';
    const sizeStr = r.size ? ` (${(r.size / 1024).toFixed(0)}KB)` : '';
    console.log(`  [${status}] ${r.name}${sizeStr}`);
    if (r.error) console.log(`         Error: ${r.error}`);
  }
  console.log('-'.repeat(60));
  console.log(`Generated: ${generated} | Skipped: ${skipped} | Failed: ${failed} | Total: ${results.length}`);

  // Cost estimate: FLUX Dev is ~$0.025/image
  const costPerImage = 0.025;
  const totalCost = generated * costPerImage;
  console.log(`Estimated cost: $${totalCost.toFixed(3)} (${generated} images x $${costPerImage})`);

  if (failed > 0) {
    console.log(`\nWARNING: ${failed} icon(s) failed. Re-run the script to retry (existing icons will be skipped).`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

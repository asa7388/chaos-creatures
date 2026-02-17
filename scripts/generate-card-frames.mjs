#!/usr/bin/env node
// generate-card-frames.mjs — Generate card frames, card backs, and UI backgrounds via fal.ai
// Saves to Assets.xcassets for bundling with the iOS app.
// Usage: node scripts/generate-card-frames.mjs

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ==========================================================================
// Load env from game-server/.env (same pattern as generate-test-cards.mjs)
// ==========================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
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
if (!FAL_KEY) {
  console.error('Missing FAL_KEY in packages/game-server/.env');
  process.exit(1);
}

// ==========================================================================
// Output directories (Assets.xcassets subfolders)
// ==========================================================================

const PROJECT_ROOT = resolve(__dirname, '..');
const ASSETS_BASE = join(PROJECT_ROOT, 'ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets');
const FRAMES_DIR = join(ASSETS_BASE, 'CardFrames');
const BACKS_DIR = join(ASSETS_BASE, 'CardBacks');
const BACKGROUNDS_DIR = join(ASSETS_BASE, 'UIBackgrounds');

// ==========================================================================
// Shared style elements for frames
// ==========================================================================

const FRAME_STYLE_BASE =
  'hand-painted fantasy card game frame border, traditional oil painting style, ' +
  'visible brushwork and texture, high detail ornamental border, ' +
  'transparent empty center opening where artwork would go, ' +
  'the center area is completely empty/transparent/cut out, ' +
  'dark moody background behind frame edges, ' +
  'no text no characters no creatures, just the decorative frame border itself';

const NEGATIVE_PROMPT =
  'text, words, letters, numbers, watermarks, signatures, logos, ' +
  'characters, creatures, faces, people, animals, ' +
  'photograph, 3d render, CGI, photorealistic, airbrushed, smooth plastic, ' +
  'vector art, clip art, flat design, minimalist, modern, clean lines, ' +
  'white background, solid background, gradient background';

// ==========================================================================
// Frame definitions (15 creature/spell/stabilizer frames)
// ==========================================================================

const FRAMES = [
  // --- Ironwright Creature Frames ---
  {
    name: 'ironwright-common',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, industrial steampunk decorative border, riveted brass plates with patina and tarnish, interlocking gear motifs in corners, copper filigree scrollwork along edges, iron bolts and weld seams visible, warm brass and copper tones, matte weathered finish, Art Nouveau industrial aesthetic, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'ironwright-rare',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, industrial steampunk decorative border, riveted brass plates polished to a sheen, interlocking gear motifs in corners, copper filigree scrollwork along edges, blue arcane energy crackling along frame edges and through gear teeth, metallic sheen on brass surfaces, ethereal blue light emanating from rivets, Art Nouveau industrial aesthetic, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'ironwright-legendary',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, the most ornate industrial steampunk decorative border, highly detailed riveted brass with gold leaf inlays, intricate clockwork mechanisms visible in frame corners, prismatic golden highlights across polished surfaces, glowing amber energy nodes at cardinal points, crystal-capped gear finials, every surface covered in master-crafted filigree, Art Nouveau industrial aesthetic at peak opulence, rectangular card frame with large transparent center window for artwork`,
  },

  // --- Fey Courts Creature Frames ---
  {
    name: 'fey-common',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, enchanted forest decorative border, living twisted wood and vine borders intertwined with thorns, small bioluminescent mushroom clusters at corners, raw crystal inlays catching moonlight, moss and lichen growing on bark surfaces, muted green and brown and silver palette, matte natural finish, forest fairy tale aesthetic, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'fey-rare',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, enchanted forest decorative border, living twisted wood and vine borders with glowing crystalline edges, ethereal blue-green light pulsing through crystal veins in the wood, luminous fungi and flower buds opening along the frame, moonlit silver sheen on bark, metallic leaf accents catching fey light, forest fairy tale aesthetic, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'fey-legendary',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, the most ornate enchanted forest decorative border, ancient living wood carved by master fey artisans, gold leaf and polished moonstone cabochons inset along edges, crystalline branches forming elaborate Celtic knotwork, prismatic shimmer on every surface, bioluminescent flowers in full bloom at corners, the wood itself seems alive and breathing, peak fairy tale opulence, rectangular card frame with large transparent center window for artwork`,
  },

  // --- Demonic Creature Frames ---
  {
    name: 'demonic-common',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, infernal hellish decorative border, jagged bone and obsidian shards forming the frame, subtle hellfire glow in cracks between segments, carved infernal runes etched into bone surfaces, blackened iron clasps holding bone plates together, muted crimson and charcoal palette, matte dark finish, dark fantasy horror aesthetic, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'demonic-rare',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, infernal hellish decorative border, jagged bone and obsidian shards forming the frame, pulsing red-orange molten energy visible in cracks and fissures, ember glow emanating from between bone plates, infernal runes glowing with inner fire, volcanic glass edges catching hellish light, dark fantasy horror aesthetic, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'demonic-legendary',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, the most ornate infernal hellish decorative border, masterwork skull and bone architecture forming elaborate frame, gold and hellfire prismatic accents along every edge, obsidian surfaces polished to mirror finish reflecting flames, molten lava veins pulsing through the entire frame, particle-like embers drifting from frame edges, demonic faces carved into corner finials, peak dark fantasy opulence, rectangular card frame with large transparent center window for artwork`,
  },

  // --- Spell Frames (3) ---
  {
    name: 'ironwright-spell',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, industrial steampunk spell card border, brass frame with gear-shaped corner ornaments, arcane engineering symbols etched along edges, conduit pipes running along frame sides, pressure gauge motifs, energy coils at top and bottom, warm brass and electric blue accents, the frame suggests channeled mechanical energy, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'fey-spell',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, enchanted forest spell card border, vine and crystal border with spell-casting motifs, swirling magical energy patterns woven through living wood, crystalline runes floating near the frame edges, moonflower buds at corners with pollen-like sparkles, the frame suggests wild magic being channeled through nature, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'demonic-spell',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, infernal hellish spell card border, bone and flame border with ritual circle motifs, sacrificial rune carvings along the edges, dark energy swirling at corners, blood-red crystal shards embedded in obsidian frame, the frame suggests dark ritual magic being invoked, rectangular card frame with large transparent center window for artwork`,
  },

  // --- Stabilizer Frames (3) ---
  {
    name: 'ironwright-stabilizer',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, industrial steampunk stabilizer card border, heavy brass shield-shaped outer frame, thick reinforced plating with extra rivets, stability regulators and dampener coils at corners, grounding chains along bottom edge, the frame conveys mechanical stability and protection, warm brass and gunmetal tones, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'fey-stabilizer',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, enchanted forest stabilizer card border, crystal and living wood protective ward frame, thick root-wrapped borders suggesting deep grounding, protective rune circles at corners, amber resin deposits along edges like natural armor, the frame conveys ancient natural protection, rectangular card frame with large transparent center window for artwork`,
  },
  {
    name: 'demonic-stabilizer',
    category: 'frames',
    prompt: `${FRAME_STYLE_BASE}, infernal hellish stabilizer card border, heavy bone and obsidian ward frame, thick skull-reinforced corners, warding runes carved deep into bone to contain chaos, iron chains woven through the frame structure, banishment sigils at cardinal points, the frame conveys forceful containment of dark energy, rectangular card frame with large transparent center window for artwork`,
  },
];

// ==========================================================================
// Card back definitions (4)
// ==========================================================================

const CARD_BACKS = [
  {
    name: 'card-back-universal',
    category: 'backs',
    prompt: 'Fantasy card game card back design, centered D20 polyhedral die with swirling chaos energy around it, dark mysterious background with subtle magical particles, the text CHAOS CREATURES implied by the design without actual text, ornate border frame, deep purple and gold color scheme, hand-painted oil painting style, visible brushwork, classical fantasy illustration, symmetric design, no text no words no letters',
  },
  {
    name: 'card-back-ironwright',
    category: 'backs',
    prompt: 'Fantasy card game card back design, centered brass and iron faction emblem of interlocking gears forming a flower pattern, industrial steampunk background with riveted metal plates and steam, warm brass copper and iron tones, ornate mechanical border, hand-painted oil painting style, visible brushwork, classical fantasy illustration, symmetric design, no text no words no letters',
  },
  {
    name: 'card-back-fey',
    category: 'backs',
    prompt: 'Fantasy card game card back design, centered nature faction emblem of a crescent moon cradling an ancient tree, enchanted forest background with bioluminescent mushrooms and crystal formations, deep green silver and moonlight color scheme, living wood and vine border, hand-painted oil painting style, visible brushwork, classical fantasy illustration, symmetric design, no text no words no letters',
  },
  {
    name: 'card-back-demonic',
    category: 'backs',
    prompt: 'Fantasy card game card back design, centered infernal faction emblem of a horned skull wreathed in hellfire, volcanic hellscape background with lava cracks and ash, deep crimson black and ember orange color scheme, bone and obsidian border, hand-painted oil painting style, visible brushwork, classical fantasy illustration, symmetric design, no text no words no letters',
  },
];

// ==========================================================================
// UI background definitions (3)
// ==========================================================================

const UI_BACKGROUNDS = [
  {
    name: 'bg-main-menu',
    category: 'backgrounds',
    prompt: 'Dark atmospheric fantasy background for a card game main menu, swirling magical energy in deep purple and gold, subtle D20 die silhouettes in the mist, mysterious and inviting, hand-painted oil painting style with visible brushwork, classical fantasy illustration, moody chiaroscuro lighting, no text no characters no UI elements, suitable as a blurred background behind menu buttons',
  },
  {
    name: 'bg-collection',
    category: 'backgrounds',
    prompt: 'Dark atmospheric fantasy background for a card collection screen, ancient wooden desk surface with scattered magical artifacts, old leather and parchment textures, warm candlelight glow, hand-painted oil painting style with visible brushwork, classical fantasy illustration, overhead view of a collectors workspace, no text no characters no UI elements, moody warm tones',
  },
  {
    name: 'bg-battlefield',
    category: 'backgrounds',
    prompt: 'Dark atmospheric fantasy background for a card game battlefield, ancient stone arena floor with magical rune circles, two opposing sides divided by a line of magical energy, dramatic overhead lighting casting shadows, hand-painted oil painting style with visible brushwork, classical fantasy illustration, bird-eye view of a mystical dueling ground, no text no characters no UI elements, deep moody tones with subtle magical glow',
  },
];

// ==========================================================================
// fal.ai API call with retry (same pattern as generate-test-cards.mjs)
// ==========================================================================

async function callFal(body) {
  const maxRetries = 3;
  let delay = 5000;

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
      throw new Error(`fal.ai 422 validation error: ${errText}`);
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
// Save image to Assets.xcassets
// ==========================================================================

function saveToAssetCatalog(imageBuffer, name, category) {
  let baseDir;
  if (category === 'frames') {
    baseDir = FRAMES_DIR;
  } else if (category === 'backs') {
    baseDir = BACKS_DIR;
  } else {
    baseDir = BACKGROUNDS_DIR;
  }

  const imagesetDir = join(baseDir, `${name}.imageset`);
  mkdirSync(imagesetDir, { recursive: true });

  const filename = `${name}@2x.png`;
  writeFileSync(join(imagesetDir, filename), imageBuffer);
  writeFileSync(
    join(imagesetDir, 'Contents.json'),
    JSON.stringify(
      {
        images: [
          { filename, idiom: 'universal', scale: '2x' },
        ],
        info: { author: 'xcode', version: 1 },
      },
      null,
      2
    )
  );

  return imagesetDir;
}

// Ensure folder-level Contents.json exists for each asset group
function ensureFolderContents(dir, providesNamespace = true) {
  mkdirSync(dir, { recursive: true });
  const contentsPath = join(dir, 'Contents.json');
  if (!existsSync(contentsPath)) {
    writeFileSync(
      contentsPath,
      JSON.stringify(
        {
          info: { author: 'xcode', version: 1 },
          properties: { 'provides-namespace': providesNamespace },
        },
        null,
        2
      )
    );
  }
}

// ==========================================================================
// Generate a single item
// ==========================================================================

async function generateItem(item, index, total) {
  const label = `[${index + 1}/${total}]`;
  console.log(`\n${label} Generating: ${item.name} (${item.category})...`);

  // Check if already generated
  let baseDir;
  if (item.category === 'frames') baseDir = FRAMES_DIR;
  else if (item.category === 'backs') baseDir = BACKS_DIR;
  else baseDir = BACKGROUNDS_DIR;

  const imagesetDir = join(baseDir, `${item.name}.imageset`);
  const imagePath = join(imagesetDir, `${item.name}@2x.png`);
  if (existsSync(imagePath)) {
    console.log(`  Already exists, skipping.`);
    return { name: item.name, success: true, skipped: true };
  }

  // Determine image size based on category
  let imageSize;
  if (item.category === 'frames') {
    // Card frame: 744x1039 (5:7 ratio at 2x)
    imageSize = { width: 744, height: 1039 };
  } else if (item.category === 'backs') {
    // Card back: same as frame
    imageSize = { width: 744, height: 1039 };
  } else {
    // UI background: landscape 1080x1920 (phone screen at ~2x)
    imageSize = { width: 1080, height: 1920 };
  }

  const request = {
    prompt: item.prompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: imageSize,
    num_inference_steps: 40,
    guidance_scale: 8.5,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  // Call fal.ai
  console.log(`  Calling fal.ai FLUX Dev...`);
  const result = await callFal(request);

  if (result.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected -- regenerate');
  }
  if (!result.images?.[0]?.url) {
    throw new Error('No image URL in fal.ai response');
  }

  const tempUrl = result.images[0].url;
  const inferenceMs = Math.round(result.timings?.inference || 0);
  console.log(`  Generated (seed: ${result.seed}, ${inferenceMs}ms inference)`);

  // Download
  console.log(`  Downloading...`);
  const imgResponse = await fetch(tempUrl);
  if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
  console.log(`  Downloaded: ${(imageBuffer.length / 1024).toFixed(0)}KB`);

  // Save to asset catalog
  const savedPath = saveToAssetCatalog(imageBuffer, item.name, item.category);
  console.log(`  Saved to: ${savedPath}`);

  return { name: item.name, success: true, skipped: false, size: imageBuffer.length };
}

// ==========================================================================
// Main
// ==========================================================================

async function main() {
  console.log('=== Chaos Creatures -- Card Frame, Back & Background Generation ===\n');

  // Ensure top-level asset group folders exist
  ensureFolderContents(FRAMES_DIR);
  ensureFolderContents(BACKS_DIR);
  ensureFolderContents(BACKGROUNDS_DIR);

  const allItems = [...FRAMES, ...CARD_BACKS, ...UI_BACKGROUNDS];
  console.log(`Total items to generate: ${allItems.length}`);
  console.log(`  - Card frames: ${FRAMES.length}`);
  console.log(`  - Card backs: ${CARD_BACKS.length}`);
  console.log(`  - UI backgrounds: ${UI_BACKGROUNDS.length}`);
  console.log(`Estimated cost: ~$${(allItems.length * 0.025).toFixed(2)} ($0.025/image)\n`);

  const results = [];

  for (let i = 0; i < allItems.length; i++) {
    try {
      const result = await generateItem(allItems[i], i, allItems.length);
      results.push(result);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      results.push({ name: allItems[i].name, success: false, error: err.message });
    }

    // Delay between API calls to avoid rate limiting (skip if item was cached)
    if (i < allItems.length - 1 && !results[results.length - 1]?.skipped) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Summary
  console.log('\n=== RESULTS ===');
  console.log('-'.repeat(70));

  const succeeded = results.filter(r => r.success && !r.skipped);
  const skipped = results.filter(r => r.success && r.skipped);
  const failed = results.filter(r => !r.success);

  for (const r of results) {
    if (r.success && r.skipped) {
      console.log(`  SKIP  ${r.name} (already exists)`);
    } else if (r.success) {
      console.log(`  OK    ${r.name} (${(r.size / 1024).toFixed(0)}KB)`);
    } else {
      console.log(`  FAIL  ${r.name}: ${r.error}`);
    }
  }

  console.log('-'.repeat(70));
  console.log(`Generated: ${succeeded.length} | Skipped: ${skipped.length} | Failed: ${failed.length} | Total: ${results.length}`);
  console.log(`Estimated API cost: ~$${(succeeded.length * 0.025).toFixed(3)}`);

  if (failed.length > 0) {
    console.log('\nFailed items (re-run script to retry):');
    for (const f of failed) {
      console.log(`  - ${f.name}: ${f.error}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

#!/usr/bin/env node
// validate-evolution-quality.mjs — Evolution art quality validation
// Tests 3 evolution scenarios (1 per faction) using local base images from scripts/preview/.
// Saves results to scripts/preview/validation/ (gitignored).
// Budget: max 3 fal.ai calls (~$0.08)
//
// Usage: node scripts/validate-evolution-quality.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = resolve(__dirname, 'preview');
const VALIDATION_DIR = resolve(__dirname, 'preview/validation');

// ---------------------------------------------------------------------------
// Load env from game-server/.env
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Style anchor (v3 — same as base generation for consistency)
// ---------------------------------------------------------------------------

const STYLE_ANCHOR =
  'traditional oil painting on canvas by Donato Giancola and Frank Frazetta, ' +
  'visible heavy brushwork and palette knife texture, cracked oil paint surface, ' +
  'classical fantasy illustration from 1990s Magic: The Gathering, muted earth tone palette, ' +
  'chiaroscuro lighting, raw and gritty not polished, imperfect asymmetric anatomy, ' +
  'single creature portrait 3:4 ratio, no text no borders no watermarks';

const NEGATIVE_PROMPT =
  'text, words, letters, watermarks, signatures, logos, borders, frames, NSFW, explicit content, ' +
  'gore, distorted anatomy, multiple heads, deformed limbs, extra limbs, fused body parts, ' +
  '3d render, CGI, photorealistic, airbrushed, smooth plastic skin, digital art, vector art, ' +
  'deviantart, artstation trending, oversaturated, neon glow, stock photo, generic, ' +
  'white background, collage, grid layout, concept art sheet';

// ---------------------------------------------------------------------------
// Faction environments (from prompts.ts / evolve-test-cards.mjs)
// ---------------------------------------------------------------------------

const FACTION_ENVIRONMENTS = {
  ironwright: [
    'inside a vast steam-powered foundry with molten metal rivers and chain-driven machinery',
    'atop a massive clockwork bridge spanning a canyon of interlocking gears',
    'in a brass and copper workshop littered with half-finished automata and blueprints',
    'on the observation deck of a towering industrial spire belching steam into orange skies',
    'inside a walking factory, mechanical legs visible through floor grates, landscape moving outside windows',
  ],
  fey: [
    'in a moonlit glade where bioluminescent mushrooms cast soft blue-green light on ancient stones',
    'beneath the canopy of the World Tree, roots thick as rivers, leaves filtering golden twilight',
    'at the shore of an enchanted lake reflecting a sky full of aurora and floating islands',
    'in a twilight meadow of giant wildflowers where fireflies spell out forgotten runes',
    'deep inside a crystal cave where living gemstones hum with harmonic resonance',
  ],
  demonic: [
    'on a volcanic cliff overlooking a sea of lava, obsidian spires rising from the molten surface',
    'in a throne room built from the bones of fallen titans, hellfire braziers lining the walls',
    'at the edge of a reality rift where the material world crumbles into the void',
    'on an ash-covered battlefield strewn with shattered weapons and smoldering craters',
    'inside a collapsed citadel where gravity fails and stone blocks float in burning air',
  ],
};

// ---------------------------------------------------------------------------
// Evolution test cases: 1 per faction, covering ORDER + CHAOS directions
// ---------------------------------------------------------------------------

const EVOLUTION_TESTS = [
  {
    id: 'iron-order-evo',
    faction: 'IRONWRIGHT',
    faction_env_key: 'ironwright',
    base_image: 'iron-v3-01.png',
    base_name: 'Furnace Warden',
    direction: 'ORDER',
    strength: 0.40,
    faction_style:
      'grimy industrial steampunk, corroded brass and blackened iron, painted like Brom',
    transform_instruction:
      'Refine and upgrade this mechanical creature with Order energy. ' +
      'Add reinforced hydraulic pistons along its arms and legs. Polish key armor plates to a cleaner finish while keeping the weathered base. ' +
      'Add a faint amber crystalline glow emanating from its furnace core, more controlled and structured. ' +
      'The creature should look upgraded and fortified but still recognizable as the same golem.',
    expected_changes: 'Polished armor plates, hydraulic additions, amber core glow, same pose/silhouette',
  },
  {
    id: 'fey-chaos-evo',
    faction: 'FEY_COURTS',
    faction_env_key: 'fey',
    base_image: 'fey-v3-01.png',
    base_name: 'Rootmaw Lurker',
    direction: 'CHAOS',
    strength: 0.55,
    faction_style:
      'dark fey forest creature, twisted ancient wood, painted like Brian Froud',
    transform_instruction:
      'Transform this forest root creature with violent Chaos energy. ' +
      'Its knothole eyes now burn with intense predatory green fire. Jagged thorns erupt aggressively from its joints and spine. ' +
      'The bark cracks and splinters revealing wild red-purple chaos energy pulsing beneath. It looks larger, wilder, more feral. ' +
      'Moss becomes tangled and matted. The creature should look like it has gone feral and dangerous.',
    expected_changes: 'Burning green eyes, erupting thorns, cracked bark with chaos energy, wilder/larger',
  },
  {
    id: 'demon-chaos-evo',
    faction: 'DEMONIC',
    faction_env_key: 'demonic',
    base_image: 'demon-v3-01.png',
    base_name: 'Slag Brute',
    direction: 'CHAOS',
    strength: 0.55,
    faction_style:
      'grotesque infernal creature, fused bone and volcanic rock, painted like Wayne Barlowe',
    transform_instruction:
      'Transform this infernal bone creature with explosive Chaos energy. ' +
      'Deep glowing lava cracks split open across its entire body like volcanic fissures. A corona of hellfire erupts from its back and shoulders. ' +
      'The broken horn stump now glows white-hot. Chains glow red from heat. The molten interior is now visible through widening cracks. ' +
      'The creature should look like it is about to erupt, barely containing its own destructive power.',
    expected_changes: 'Lava fissures, hellfire corona, glowing horn stump, red-hot chains, molten interior visible',
  },
];

// ---------------------------------------------------------------------------
// fal.ai FLUX Kontext img2img call
// ---------------------------------------------------------------------------

async function callFalKontext(body) {
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
    if (response.status === 422) {
      throw new Error(`fal.ai Kontext 422 validation error: ${errText}`);
    }
    if (response.status === 429 || response.status >= 500) {
      if (attempt < maxRetries) {
        console.log(`  fal.ai ${response.status}, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
    }
    throw new Error(`fal.ai Kontext HTTP ${response.status}: ${errText}`);
  }
}

// ---------------------------------------------------------------------------
// Evolve a single test card
// ---------------------------------------------------------------------------

async function evolveTestCard(test) {
  const label = `[${test.faction}] ${test.base_name} -> ${test.direction} (strength ${test.strength})`;
  console.log(`\n${'='.repeat(70)}`);
  console.log(`EVOLVING: ${label}`);
  console.log(`${'='.repeat(70)}`);

  // 1. Load base image from local file
  const basePath = resolve(PREVIEW_DIR, test.base_image);
  if (!existsSync(basePath)) {
    throw new Error(`Base image not found: ${basePath}`);
  }
  const baseBuffer = readFileSync(basePath);
  const dataUri = `data:image/png;base64,${baseBuffer.toString('base64')}`;
  console.log(`  Base image loaded: ${test.base_image} (${(baseBuffer.length / 1024).toFixed(0)}KB)`);

  // 2. Pick a faction environment
  const envs = FACTION_ENVIRONMENTS[test.faction_env_key];
  const environment = envs[Math.floor(Math.random() * envs.length)];

  // 3. Build evolution prompt (same structure as evolve-test-cards.mjs)
  const fullPrompt = [
    STYLE_ANCHOR,
    test.faction_style,
    test.transform_instruction,
    'Keep the same creature, same pose angle, same composition. The creature must remain clearly recognizable.',
    `Background setting: ${environment}`,
    'Three-quarter view portrait, strong silhouette, atmospheric background, NOT clean NOT smooth NOT digital',
  ].join('. ');

  console.log(`\n  PROMPT (${fullPrompt.length} chars):`);
  console.log(`  ${'-'.repeat(60)}`);
  // Print prompt in wrapped segments for readability
  const words = fullPrompt.split(' ');
  let line = '  ';
  for (const word of words) {
    if (line.length + word.length > 100) {
      console.log(line);
      line = '  ';
    }
    line += word + ' ';
  }
  if (line.trim()) console.log(line);
  console.log(`  ${'-'.repeat(60)}`);
  console.log(`  Environment: ${environment}`);
  console.log(`  Strength: ${test.strength} (${test.direction === 'ORDER' ? 'subtle refinement' : 'dramatic transformation'})`);

  // 4. Call fal.ai FLUX Kontext with img2img
  const request = {
    image_url: dataUri,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: 'portrait_4_3',
    num_inference_steps: 28,
    guidance_scale: 7.0,
    strength: test.strength,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  };

  console.log(`\n  Calling fal.ai FLUX Kontext (img2img)...`);
  const startTime = Date.now();
  const result = await callFalKontext(request);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (result.has_nsfw_concepts?.[0]) {
    throw new Error('NSFW content detected — image rejected');
  }
  if (!result.images?.[0]?.url) {
    throw new Error('No image URL in fal.ai response');
  }

  console.log(`  Generated in ${elapsed}s (seed: ${result.seed})`);

  // 5. Download the generated image
  const tempUrl = result.images[0].url;
  console.log('  Downloading evolved image...');
  const imgResponse = await fetch(tempUrl);
  if (!imgResponse.ok) throw new Error(`Image download failed: ${imgResponse.status}`);
  const imageBuffer = Buffer.from(await imgResponse.arrayBuffer());

  // 6. Save to validation directory
  const outPath = resolve(VALIDATION_DIR, `${test.id}.png`);
  writeFileSync(outPath, imageBuffer);
  console.log(`  Saved: preview/validation/${test.id}.png (${(imageBuffer.length / 1024).toFixed(0)}KB)`);

  return {
    id: test.id,
    faction: test.faction,
    base_name: test.base_name,
    direction: test.direction,
    strength: test.strength,
    base_size_kb: (baseBuffer.length / 1024).toFixed(0),
    evolved_size_kb: (imageBuffer.length / 1024).toFixed(0),
    seed: result.seed,
    elapsed_s: elapsed,
    prompt_length: fullPrompt.length,
    environment,
    expected_changes: test.expected_changes,
    success: true,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(70));
  console.log('  CHAOS CREATURES — Evolution Art Quality Validation');
  console.log('  Testing 3 evolution scenarios (1 per faction)');
  console.log('  ORDER strength: 0.40 | CHAOS strength: 0.55');
  console.log('='.repeat(70));

  // Ensure output directory exists
  if (!existsSync(VALIDATION_DIR)) {
    mkdirSync(VALIDATION_DIR, { recursive: true });
    console.log(`\nCreated output directory: scripts/preview/validation/`);
  }

  // Verify base images exist
  console.log('\nVerifying base images...');
  for (const test of EVOLUTION_TESTS) {
    const basePath = resolve(PREVIEW_DIR, test.base_image);
    if (!existsSync(basePath)) {
      console.error(`  MISSING: ${test.base_image} — cannot evolve without base art`);
      console.error(`  Run 'node scripts/generate-test-cards.mjs' first to generate base images.`);
      process.exit(1);
    }
    const stat = readFileSync(basePath);
    console.log(`  OK: ${test.base_image} (${(stat.length / 1024).toFixed(0)}KB)`);
  }

  // Run evolution tests sequentially
  const results = [];
  const startAll = Date.now();

  for (const test of EVOLUTION_TESTS) {
    try {
      const result = await evolveTestCard(test);
      results.push(result);
    } catch (err) {
      console.error(`\n  FAILED: ${err.message}`);
      results.push({
        id: test.id,
        faction: test.faction,
        base_name: test.base_name,
        direction: test.direction,
        strength: test.strength,
        success: false,
        error: err.message,
      });
    }
  }

  const totalElapsed = ((Date.now() - startAll) / 1000).toFixed(1);

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------

  console.log(`\n\n${'='.repeat(70)}`);
  console.log('  EVOLUTION VALIDATION REPORT');
  console.log(`${'='.repeat(70)}`);

  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n  Total: ${succeeded.length}/${results.length} succeeded`);
  console.log(`  Time: ${totalElapsed}s total`);
  console.log(`  Estimated cost: $${(results.length * 0.025).toFixed(3)} (${results.length} x $0.025/image)`);
  console.log(`  Output: scripts/preview/validation/\n`);

  for (const r of results) {
    const icon = r.success ? 'PASS' : 'FAIL';
    const dir = r.direction === 'ORDER' ? 'ORDER (0.40)' : 'CHAOS (0.55)';
    console.log(`  [${icon}] ${r.faction} | ${r.base_name} -> ${dir}`);

    if (r.success) {
      console.log(`         Base: ${r.base_size_kb}KB | Evolved: ${r.evolved_size_kb}KB | Seed: ${r.seed}`);
      console.log(`         Time: ${r.elapsed_s}s | Prompt: ${r.prompt_length} chars`);
      console.log(`         Env: ${r.environment}`);
      console.log(`         Expected: ${r.expected_changes}`);
      console.log(`         File: preview/validation/${r.id}.png`);
    } else {
      console.log(`         Error: ${r.error}`);
    }
    console.log('');
  }

  console.log(`${'='.repeat(70)}`);
  console.log('  VALIDATION CHECKLIST (manual review):');
  console.log(`${'='.repeat(70)}`);
  console.log('  For each evolved image, verify:');
  console.log('  [ ] Same creature is recognizable (not a completely different image)');
  console.log('  [ ] Same pose/angle/composition preserved');
  console.log('  [ ] Evolution changes are visible (per "Expected" notes above)');
  console.log('  [ ] ORDER evolution is subtle/refined, CHAOS is dramatic/wild');
  console.log('  [ ] Oil painting style maintained (not digital/smooth/CGI)');
  console.log('  [ ] No text, watermarks, borders, or artifacts');
  console.log('  [ ] Faction identity preserved (Ironwright=industrial, Fey=forest, Demonic=infernal)');
  console.log(`${'='.repeat(70)}\n`);

  // Write a summary JSON for programmatic review
  const summaryPath = resolve(VALIDATION_DIR, 'validation-report.json');
  writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_tests: results.length,
    succeeded: succeeded.length,
    failed: failed.length,
    total_elapsed_s: totalElapsed,
    estimated_cost_usd: (results.length * 0.025).toFixed(3),
    results: results.map(r => ({
      id: r.id,
      faction: r.faction,
      base_name: r.base_name,
      direction: r.direction,
      strength: r.strength,
      success: r.success,
      base_size_kb: r.base_size_kb,
      evolved_size_kb: r.evolved_size_kb,
      seed: r.seed,
      elapsed_s: r.elapsed_s,
      environment: r.environment,
      expected_changes: r.expected_changes,
      error: r.error,
    })),
  }, null, 2));
  console.log(`Summary written to: preview/validation/validation-report.json`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
